import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'
import {
  getAllLicenses,
  createLicense,
  getLicenseByKey,
  updateLicenseActivation
} from '@/lib/license'
import { normalizePlan, featuresWithSeats, basePcsFor } from '@/lib/plans'

export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const licenses = await getAllLicenses()
    return NextResponse.json(licenses)
  } catch (err: any) {
    console.error('[GET /api/licenses]', err)
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const { action } = body

  // ── CLIENT SYSTEM ACTIVATION HANDSHAKE ──
  if (action === 'verify') {
    const { license_key, machine_id } = body

    if (!license_key?.trim() || !machine_id?.trim()) {
      return NextResponse.json(
        { error: 'license_key and machine_id parameters are required' },
        { status: 400 }
      )
    }

    try {
      const license = await getLicenseByKey(license_key.trim().toUpperCase())

      if (!license) {
        return NextResponse.json({ error: 'Activation key is invalid or unrecognized' }, { status: 404 })
      }

      if (license.status !== 'active') {
        return NextResponse.json({
          valid: false,
          status: license.status || 'revoked',
          message: `License is ${license.status || 'revoked'}. Contact AurumOS support.`
        }, { status: 200 })
      }

      if (license.is_used && license.activated_machine !== machine_id.trim()) {
        return NextResponse.json({ error: 'This activation pass is already bound to another machine fingerprint' }, { status: 400 })
      }

      if (!license.is_used) {
        await updateLicenseActivation(license.id, {
          is_used: true,
          activated_machine: machine_id.trim()
        })
      }

      const plan = normalizePlan(license.plan_type)
      const pcBase = basePcsFor(plan)
      const pcTotal = Number((license as any).max_allowed_connections ?? pcBase) > 0
        ? Math.floor(Number((license as any).max_allowed_connections ?? pcBase))
        : pcBase
      return NextResponse.json({
        status: 'success',
        plan,                              // normalized tier: lite | pro | enterprise
        features: featuresWithSeats(plan, pcTotal), // resolved (inherited) ids + terminals=N seat token
        days_valid: license.duration_days, // honest value — no phantom 15
        max_allowed_connections: pcTotal,
        pc_total: pcTotal,
        pc_base: pcBase,
        pc_extra: Math.max(0, pcTotal - pcBase),
        message: 'Terminal verification authorized successfully.'
      })

    } catch (err: any) {
      console.error('[POST /api/licenses] Verification failed:', err)
      return NextResponse.json({ error: 'Internal activation verification failure' }, { status: 500 })
    }
  }

  // ── ADMINISTRATIVE KEY MINTING ──
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    business_name,
    owner_name,
    city,
    phone,
    notes,
    amount_paid,
    software_type,
    plan_type,
    duration_days,
    key,
    identity_proof_url,
    address_proof_url,
    identity_proof_type,
    address_proof_type,
} = body

  if (!business_name?.trim() || !owner_name?.trim()) {
    return NextResponse.json(
      { error: 'business_name and owner_name are required' },
      { status: 400 }
    )
  }

  if (!key || typeof key !== "string") {
    return NextResponse.json(
        { error: "License key is required." },
        { status: 400 }
    )
}

  const validSoftwareTypes = ['wholesale', 'retail']
  const resolvedSoftwareType: 'wholesale' | 'retail' =
    validSoftwareTypes.includes(software_type) ? software_type : 'wholesale'

  const validPlanTypes = ['lite', 'pro', 'enterprise']
  const resolvedPlanType = validPlanTypes.includes(plan_type) ? plan_type : 'lite'
  // Lite = trial tier. Without an explicit duration it becomes a REAL 15-day
  // trial (not a 365-day non-expiring license, which the old `|| 365` produced).
  const resolvedDuration = parseInt(duration_days) ||
    (resolvedPlanType === 'lite' ? 15 : 365)


  try {
    const license = await createLicense({
      business_name: business_name.trim(),
      owner_name:    owner_name.trim(),
      city:          (city || '').trim(),
      phone:         phone || null,
      notes:         notes || null,
      amount_paid:   amount_paid ? parseFloat(amount_paid) : undefined,
      software_type: resolvedSoftwareType,
      key: key.trim().toUpperCase(),
      plan_type:     resolvedPlanType,
      duration_days: resolvedDuration,
      is_used:       false,
      identity_proof_url:  identity_proof_url  || null,
      address_proof_url:   address_proof_url   || null,
      identity_proof_type: identity_proof_type || null,
      address_proof_type:  address_proof_type  || null,
    })
    
    return NextResponse.json(license, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/licenses] createLicense failed:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to generate license profile' },
      { status: 500 }
    )
  }
}