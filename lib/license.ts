import {
  findLicenseByIdempotencyKey,
  findLicenseByOrderId,
  findLicenseByPayment,
  keyExists,
  saveLicense,
  type LicenseRecord,
} from './store';
import type { PlanId, SoftwareType } from './plans';

/**
 * License key minting — same format as aurumos-admin:
 * `AU-XXXX-XXXX-XXXX-XXXX` (wholesale) / `AR-XXXX-XXXX-XXXX-XXXX` (retail),
 * 4x4 segments from ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no O, I, 0, 1).
 *
 * When the standalone `aurumos-admin` repo becomes the license authority,
 * keep `generateKey`/`validateKeyFormat` in sync with its `lib/license.ts`
 * and point the website at its `/api/public/mint-license` endpoint.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX: Record<SoftwareType, string> = { wholesale: 'AU', retail: 'AR' };

function randomSegment(): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateKey(softwareType: SoftwareType): string {
  const p = PREFIX[softwareType];
  return `${p}-${randomSegment()}-${randomSegment()}-${randomSegment()}-${randomSegment()}`;
}

const KEY_RE = /^(AU|AR)-([A-Z2-9]{4}-){3}[A-Z2-9]{4}$/;

export function validateKeyFormat(key: string): { ok: boolean; software_type?: SoftwareType } {
  const k = String(key ?? '').trim().toUpperCase();
  if (!KEY_RE.test(k)) return { ok: false };
  return { ok: true, software_type: k.startsWith('AU-') ? 'wholesale' : 'retail' };
}

export interface MintInput {
  business_name: string;
  owner_name: string;
  city: string;
  phone: string;
  email?: string;
  notes?: string;
  amount_paid: number;
  software_type: SoftwareType;
  plan_type: PlanId;
  duration_days?: number;
  payment_id?: string;
  order_id?: string;
  idempotency_key?: string;
}

/**
 * Mint a license. Idempotent: if a license already exists for the same
 * `payment_id`, `order_id` or `idempotency_key` (webhook retries / double
 * verify calls), the existing license is returned — never a second key.
 */
export async function mintLicense(input: MintInput): Promise<{ license: LicenseRecord; duplicate: boolean }> {
  if (input.payment_id) {
    const existing = await findLicenseByPayment(input.payment_id);
    if (existing) return { license: existing, duplicate: true };
  }
  if (input.order_id) {
    const existing = await findLicenseByOrderId(input.order_id);
    if (existing) return { license: existing, duplicate: true };
  }
  if (input.idempotency_key) {
    const existing = await findLicenseByIdempotencyKey(input.idempotency_key);
    if (existing) return { license: existing, duplicate: true };
  }

  // Unique key with retry on collision (UNIQUE constraint equivalent).
  let key = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateKey(input.software_type);
    if (!(await keyExists(candidate))) {
      key = candidate;
      break;
    }
  }
  if (!key) throw new Error('Could not generate a unique license key, please retry.');

  const now = new Date();
  const durationDays = input.duration_days && input.duration_days > 0 ? Math.floor(input.duration_days) : 365;
  const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const license: LicenseRecord = {
    key,
    business_name: input.business_name,
    owner_name: input.owner_name,
    city: input.city,
    phone: input.phone,
    email: input.email,
    notes: input.notes,
    amount_paid: input.amount_paid,
    software_type: input.software_type,
    status: 'active',
    plan_type: input.plan_type,
    duration_days: durationDays,
    is_used: false,
    machine_id: null,
    subscription_started_at: now.toISOString(),
    subscription_expires_at: expires.toISOString(),
    created_at: now.toISOString(),
    payment_id: input.payment_id,
    order_id: input.order_id,
    idempotency_key: input.idempotency_key,
  };

  await saveLicense(license);
  return { license, duplicate: false };
}
