import { mintLicense, type MintInput } from './license';
import type { LicenseRecord } from './store';

/**
 * License authority router.
 *
 * Default: mint locally via `mintLicense()` (this repo acts as its own
 * authority — good for dev and single-deploy setups).
 *
 * Split mode: when `LICENSE_SERVER_URL` + `LICENSE_API_SECRET` are set,
 * minting is delegated server-to-server to aurumos-admin's
 * `POST /api/public/mint-license` (same contract as the local route).
 * The secret never leaves the server.
 */
export async function mintViaAuthority(
  input: MintInput
): Promise<{ license: LicenseRecord; duplicate: boolean; remote: boolean }> {
  const base = (process.env.LICENSE_SERVER_URL ?? '').replace(/\/+$/, '');
  const secret = process.env.LICENSE_API_SECRET;

  if (base && secret) {
    const res = await fetch(`${base}/api/public/mint-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as {
      ok: boolean;
      error?: string;
      key?: string;
      plan_type?: LicenseRecord['plan_type'];
      software_type?: LicenseRecord['software_type'];
      duration_days?: number;
      subscription_expires_at?: string;
      duplicate?: boolean;
    };
    if (!res.ok || !data.ok || !data.key) {
      throw new Error(data?.error || `License server mint failed (${res.status}).`);
    }
    // Shape the remote response into a LicenseRecord for email/receipt use.
    const now = new Date().toISOString();
    const license: LicenseRecord = {
      key: data.key,
      business_name: input.business_name,
      owner_name: input.owner_name,
      city: input.city,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
      amount_paid: input.amount_paid,
      software_type: data.software_type ?? input.software_type,
      status: 'active',
      plan_type: data.plan_type ?? input.plan_type,
      duration_days: data.duration_days ?? input.duration_days ?? 365,
      is_used: false,
      machine_id: null,
      subscription_started_at: now,
      subscription_expires_at: data.subscription_expires_at ?? now,
      created_at: now,
      payment_id: input.payment_id,
      order_id: input.order_id,
      idempotency_key: input.idempotency_key,
    };
    return { license, duplicate: Boolean(data.duplicate), remote: true };
  }

  const { license, duplicate } = await mintLicense(input);
  return { license, duplicate, remote: false };
}
