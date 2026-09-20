import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { normalizePlan } from '@/lib/plans'

/**
 * POST /api/public/mint-license — server-to-server license authority for the
 * public website (Buy -> Pay -> Auto-key). Called by aurumos-website's
 * verify-payment + payment-webhook with the shared LICENSE_API_SECRET.
 * Minted rows land in the SAME `licenses` table, so auto-sold keys show up
 * in /dashboard and /licenses with zero extra work.
 *
 * Auth: `Authorization: Bearer <LICENSE_API_SECRET>` (never from the browser).
 * Idempotent: same payment_id / order_id / idempotency_key always returns the
 * SAME key — webhook retries can never create a duplicate license.
 */

// ── key format: AU-/AR- + 4x4, no O,I,0,1 (mirrors lib/license.ts) ──
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randomSegment(): string {
  let out = ''
  for (let i = 0; i < 4; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out
}
function generateKey(type: 'wholesale' | 'retail'): string {
  const p = type === 'retail' ? 'AR' : 'AU'
  return `${p}-${randomSegment()}-${randomSegment()}-${randomSegment()}-${randomSegment()}`
}

// ── per-IP rate limit: 60 mints / min (in-memory, per instance) ──
const buckets = new Map<string, number[]>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < 60_000)
  hits.push(now)
  buckets.set(ip, hits)
  return hits.length > 60
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown'
  )
}

function allowedOrigins(): string[] {
  // Comma-separated list, e.g. "https://aurumos-website.vercel.app,http://localhost:3001"
  return (process.env.LICENSE_WEBSITE_URL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const u = new URL(origin)
    return (
      (u.protocol === 'http:' || u.protocol === 'https:') &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
    )
  } catch {
    return false
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const headers: Record<string, string> = {}
  // Server-to-server calls send no Origin and are unaffected. Browser calls
  // get CORS when they come from a configured website origin — plus any
  // localhost origin in non-production so website dev (:3001) can reach
  // admin dev (:3000) during local testing.
  if (!origin) return headers
  try {
    const configured = allowedOrigins()
    if (configured.includes(new URL(origin).origin)) {
      headers['Access-Control-Allow-Origin'] = new URL(origin).origin
    } else if (process.env.NODE_ENV !== 'production' && isLocalhostOrigin(origin)) {
      headers['Access-Control-Allow-Origin'] = new URL(origin).origin
    }
  } catch { /* ignore malformed origin */ }
  return headers
}

async function ensurePaymentColumns(): Promise<void> {
  await query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS payment_id TEXT`)
  await query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS order_id TEXT`)
  await query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email TEXT`)
  await query(`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS idempotency_key TEXT`)
  await query(`CREATE INDEX IF NOT EXISTS idx_licenses_payment_id ON licenses(payment_id)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_licenses_order_id ON licenses(order_id)`)
}

// ── every call (success AND failure) is logged so a purchase that never
// appears as a license still shows up in the dashboard diagnostics with
// its exact reason. Best-effort: logging never blocks the response. ──
async function logAttempt(a: {
  ip: string
  ok: boolean
  stage: string
  payment_id?: string | null
  order_id?: string | null
}): Promise<void> {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS mint_attempts (
         id BIGSERIAL PRIMARY KEY,
         ip TEXT NOT NULL,
         ok BOOLEAN NOT NULL,
         stage TEXT NOT NULL DEFAULT '',
         payment_id TEXT,
         order_id TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    )
    await query(
      `INSERT INTO mint_attempts (ip, ok, stage, payment_id, order_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [a.ip.slice(0, 64), a.ok, a.stage.slice(0, 64), a.payment_id || null, a.order_id || null]
    )
  } catch {
    /* audit is best-effort */
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(req),
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const secret = process.env.LICENSE_API_SECRET
  if (!secret) {
    console.error('[MINT-LICENSE] misconfigured: LICENSE_API_SECRET is not set — refusing to mint.')
    await logAttempt({ ip, ok: false, stage: 'misconfigured-503' })
    return NextResponse.json(
      { ok: false, error: 'License server is not configured (LICENSE_API_SECRET).' },
      { status: 503 }
    )
  }
  if ((req.headers.get('authorization') ?? '') !== `Bearer ${secret}`) {
    await logAttempt({ ip, ok: false, stage: 'bad-auth-401' })
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 })
  }

  if (rateLimited(ip)) {
    await logAttempt({ ip, ok: false, stage: 'rate-limited-429' })
    return NextResponse.json({ ok: false, error: 'Rate limited. Retry shortly.' }, { status: 429 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    await logAttempt({ ip, ok: false, stage: 'bad-json-400' })
    return NextResponse.json({ ok: false, error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  const softwareType = String(body?.software_type ?? '').trim().toLowerCase()
  // NOTE: admin normalizePlan() defaults unknown -> 'lite'; the website only
  // ever sends lite|pro|enterprise, so force strict validation here instead.
  const planRaw = String(body?.plan_type ?? body?.plan ?? '').trim().toLowerCase()
  const businessName = String(body?.business_name ?? '').trim()
  const ownerName = String(body?.owner_name ?? '').trim()
  const city = String(body?.city ?? '').trim()
  const phone = body?.phone ? String(body.phone).trim() : null
  const email = body?.email ? String(body.email).trim() : null
  const notes = body?.notes ? String(body.notes) : null
  const amountPaid = Number(body?.amount_paid ?? 0)
  const durationDays = Number(body?.duration_days ?? 365)
  const paymentId = body?.payment_id ? String(body.payment_id) : null
  const orderId = body?.order_id ? String(body.order_id) : null
  const idempotencyKey = body?.idempotency_key ? String(body.idempotency_key) : null

  if (!businessName || !ownerName || !phone) {
    await logAttempt({ ip, ok: false, stage: 'validation-400', payment_id: paymentId, order_id: orderId })
    return NextResponse.json(
      { ok: false, error: 'business_name, owner_name and phone are required.' },
      { status: 400 }
    )
  }
  if (softwareType !== 'wholesale' && softwareType !== 'retail') {
    await logAttempt({ ip, ok: false, stage: 'validation-400', payment_id: paymentId, order_id: orderId })
    return NextResponse.json(
      { ok: false, error: "software_type must be 'wholesale' or 'retail'." },
      { status: 400 }
    )
  }
  if (planRaw !== 'lite' && planRaw !== 'pro' && planRaw !== 'enterprise') {
    await logAttempt({ ip, ok: false, stage: 'validation-400', payment_id: paymentId, order_id: orderId })
    return NextResponse.json(
      { ok: false, error: "plan_type must be 'lite', 'pro' or 'enterprise'." },
      { status: 400 }
    )
  }
  const plan = normalizePlan(planRaw)
  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    await logAttempt({ ip, ok: false, stage: 'validation-400', payment_id: paymentId, order_id: orderId })
    return NextResponse.json({ ok: false, error: 'amount_paid must be a number.' }, { status: 400 })
  }
  const duration = Number.isFinite(durationDays) && durationDays > 0 ? Math.floor(durationDays) : 365

  try {
    await ensurePaymentColumns()

    // ── idempotency: never mint twice for one payment ──
    if (paymentId) {
      const { rows } = await query(
        `SELECT key, plan_type, software_type, duration_days, subscription_expires_at
           FROM licenses WHERE payment_id = $1 LIMIT 1`,
        [paymentId]
      )
      if (rows[0]) {
        await logAttempt({ ip, ok: true, stage: 'duplicate-payment', payment_id: paymentId, order_id: orderId })
        return NextResponse.json({ ok: true, duplicate: true, ...rows[0] }, { headers: corsHeaders(req) })
      }
    }
    if (orderId) {
      const { rows } = await query(
        `SELECT key, plan_type, software_type, duration_days, subscription_expires_at
           FROM licenses WHERE order_id = $1 LIMIT 1`,
        [orderId]
      )
      if (rows[0]) {
        await logAttempt({ ip, ok: true, stage: 'duplicate-order', payment_id: paymentId, order_id: orderId })
        return NextResponse.json({ ok: true, duplicate: true, ...rows[0] }, { headers: corsHeaders(req) })
      }
    }
    if (idempotencyKey) {
      const { rows } = await query(
        `SELECT key, plan_type, software_type, duration_days, subscription_expires_at
           FROM licenses WHERE idempotency_key = $1 LIMIT 1`,
        [idempotencyKey]
      )
      if (rows[0]) {
        await logAttempt({ ip, ok: true, stage: 'duplicate-idempotency', payment_id: paymentId, order_id: orderId })
        return NextResponse.json({ ok: true, duplicate: true, ...rows[0] }, { headers: corsHeaders(req) })
      }
    }

    // ── mint with retry on key collision (unique violation 23505) ──
    let minted: any = null
    for (let attempt = 0; attempt < 5 && !minted; attempt++) {
      const key = generateKey(softwareType as 'wholesale' | 'retail')
      try {
        const { rows } = await query(
          `INSERT INTO licenses
             (key, business_name, owner_name, city, phone, email, notes,
              amount_paid, software_type, status, plan_type, duration_days, is_used,
              payment_id, order_id, idempotency_key,
              subscription_expires_at, subscription_started_at, created_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7,
               $8, $9, 'active', $10, $11, false,
               $12, $13, $14,
               NOW() + ($15 || ' days')::interval, NOW(), NOW())
            RETURNING key, plan_type, software_type, duration_days, subscription_expires_at`,
          [
            key, businessName, ownerName, city || null, phone, email, notes,
            amountPaid, softwareType, plan, duration,
            paymentId, orderId, idempotencyKey,
            // $15 is a SEPARATE text param for the interval: reusing the
            // integer $11 inside ($11 || ' days') makes Postgres infer
            // conflicting types (42P08) and every mint 500s.
            String(duration),
          ]
        )
        minted = rows[0]
      } catch (err: any) {
        // unique violation on key -> fresh candidate next loop; anything else throws
        if (err?.code !== '23505' || attempt === 4) throw err
      }
    }
    if (!minted) throw new Error('Could not generate a unique license key, please retry.')

    console.log('[MINT-LICENSE]', {
      ip,
      payment_id: paymentId,
      order_id: orderId,
      key: `${String(minted.key).slice(0, 6)}****`,
    })
    await logAttempt({ ip, ok: true, stage: 'minted', payment_id: paymentId, order_id: orderId })

    return NextResponse.json({ ok: true, duplicate: false, ...minted }, { headers: corsHeaders(req) })
  } catch (err: any) {
    console.error('[POST /api/public/mint-license] failed:', err?.message || err)
    await logAttempt({ ip, ok: false, stage: `server-error-500`, payment_id: paymentId, order_id: orderId })
    return NextResponse.json({ ok: false, error: 'Could not mint license.' }, { status: 500 })
  }
}
