import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

const BASTION_SALT = 'BASTION@AurumOS#Jenil$2024!Admin'
const REGULAR_SALT = 'AurumOS@Jewel#2024$Prof'

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

function toIST(date: Date): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utcMs + 5.5 * 3600000)
}

function formatDateIST(date: Date): string {
  const ist = toIST(date)
  const y = ist.getFullYear()
  const m = String(ist.getMonth() + 1).padStart(2, '0')
  const d = String(ist.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface KeyVariant {
  label: string
  key: string
  length: number
  input: string
}

interface DateResult {
  date: string
  isToday: boolean
  keys: KeyVariant[]
}

function generateKeysForDate(lockCode: string, dateStr: string, nonce: number): KeyVariant[] {
  const nonceStr = nonce.toString()

  const bastionNoNonceInput = lockCode + BASTION_SALT + dateStr
  const bastionNonceInput = lockCode + BASTION_SALT + dateStr + nonceStr
  const regularNoNonceInput = lockCode + REGULAR_SALT + dateStr
  const regularNonceInput = lockCode + REGULAR_SALT + dateStr + nonceStr

  return [
    {
      label: 'BASTION (no nonce)',
      key: sha256(bastionNoNonceInput).substring(0, 16).toUpperCase(),
      length: 16,
      input: bastionNoNonceInput,
    },
    {
      label: 'BASTION (with nonce)',
      key: sha256(bastionNonceInput).substring(0, 16).toUpperCase(),
      length: 16,
      input: bastionNonceInput,
    },
    {
      label: 'REGULAR (no nonce)',
      key: sha256(regularNoNonceInput).substring(0, 12).toUpperCase(),
      length: 12,
      input: regularNoNonceInput,
    },
    {
      label: 'REGULAR (with nonce)',
      key: sha256(regularNonceInput).substring(0, 12).toUpperCase(),
      length: 12,
      input: regularNonceInput,
    },
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { lock_code, nonce = 0 } = await req.json()

    if (!lock_code || typeof lock_code !== 'string') {
      return NextResponse.json({ error: 'lock_code is required' }, { status: 400 })
    }

    const cleaned = lock_code.trim().toUpperCase()
    if (cleaned.length !== 8 || !/^[A-Z0-9]{8}$/.test(cleaned)) {
      return NextResponse.json({ error: 'Lock code must be exactly 8 alphanumeric characters' }, { status: 400 })
    }

    const now = new Date()
    const todayIST = toIST(now)

    const yesterday = new Date(todayIST)
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date(todayIST)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStr = formatDateIST(now)
    const yesterdayStr = formatDateIST(yesterday)
    const tomorrowStr = formatDateIST(tomorrow)

    const results: DateResult[] = [
      { date: yesterdayStr, isToday: false, keys: generateKeysForDate(cleaned, yesterdayStr, nonce) },
      { date: todayStr, isToday: true, keys: generateKeysForDate(cleaned, todayStr, nonce) },
      { date: tomorrowStr, isToday: false, keys: generateKeysForDate(cleaned, tomorrowStr, nonce) },
    ]

    console.log(`[BASTION KEYGEN] lock_code=${cleaned} nonce=${nonce} generated at ${new Date().toISOString()}`)

    return NextResponse.json({ lock_code: cleaned, nonce, dates: results })
  } catch (err: any) {
    console.error('[BASTION KEYGEN Error]:', err)
    return NextResponse.json({ error: 'Key generation failed' }, { status: 500 })
  }
}
