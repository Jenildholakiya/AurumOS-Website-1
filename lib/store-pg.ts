/**
 * Postgres backend for the website store (tables `site_*`, shared DB with admin).
 * Same signatures as ./store-file — ./store picks this when POSTGRES_URL is set.
 */

import { ensureSchema, query } from './db';
import type {
  LicenseRecord,
  OrderStatus,
  SessionRecord,
  TokenPurpose,
  TokenRecord,
  UserRecord,
  WebsiteOrder,
} from './store-types';

function iso(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v.toISOString();
  const s = String(v);
  return s || undefined;
}

function isoReq(v: unknown): string {
  return iso(v) ?? '';
}

function mapOrder(r: Record<string, unknown>): WebsiteOrder {
  return {
    idempotency_key: String(r.idempotency_key),
    email: String(r.email ?? ''),
    plan: r.plan as WebsiteOrder['plan'],
    software_type: r.software_type as WebsiteOrder['software_type'],
    form: (r.form as WebsiteOrder['form']) ?? ({} as WebsiteOrder['form']),
    status: r.status as OrderStatus,
    razorpay_order_id: String(r.razorpay_order_id ?? ''),
    razorpay_payment_id: (r.razorpay_payment_id as string | null) ?? undefined,
    license_key: (r.license_key as string | null) ?? undefined,
    amount: Number(r.amount ?? 0),
    currency: String(r.currency ?? 'INR'),
    mock: Boolean(r.mock),
    created_at: isoReq(r.created_at),
    paid_at: iso(r.paid_at),
  };
}

function mapLicense(r: Record<string, unknown>): LicenseRecord {
  return {
    key: String(r.key),
    business_name: String(r.business_name ?? ''),
    owner_name: String(r.owner_name ?? ''),
    city: String(r.city ?? ''),
    phone: String(r.phone ?? ''),
    email: (r.email as string | null) ?? undefined,
    notes: (r.notes as string | null) ?? undefined,
    amount_paid: Number(r.amount_paid ?? 0),
    software_type: r.software_type as LicenseRecord['software_type'],
    status: (r.status as LicenseRecord['status']) ?? 'active',
    plan_type: r.plan_type as LicenseRecord['plan_type'],
    duration_days: Number(r.duration_days ?? 15),
    is_used: Boolean(r.is_used),
    machine_id: (r.machine_id as string | null) ?? null,
    subscription_started_at: isoReq(r.subscription_started_at),
    subscription_expires_at: isoReq(r.subscription_expires_at),
    created_at: isoReq(r.created_at),
    payment_id: (r.payment_id as string | null) ?? undefined,
    order_id: (r.order_id as string | null) ?? undefined,
    idempotency_key: (r.idempotency_key as string | null) ?? undefined,
  };
}

function mapUser(r: Record<string, unknown>): UserRecord {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    business: String(r.business ?? ''),
    email: String(r.email ?? ''),
    phone: String(r.phone ?? ''),
    plan_interest: String(r.plan_interest ?? ''),
    password_hash: String(r.password_hash ?? ''),
    password_salt: String(r.password_salt ?? ''),
    email_verified: Boolean(r.email_verified),
    failed_logins: Number(r.failed_logins ?? 0),
    locked_until: iso(r.locked_until),
    created_at: isoReq(r.created_at),
  };
}

function mapSession(r: Record<string, unknown>): SessionRecord {
  return {
    token_hash: String(r.token_hash),
    user_id: String(r.user_id),
    created_at: isoReq(r.created_at),
    expires_at: isoReq(r.expires_at),
    ip: (r.ip as string | null) ?? undefined,
    ua: (r.ua as string | null) ?? undefined,
  };
}

function mapToken(r: Record<string, unknown>): TokenRecord {
  return {
    token_hash: String(r.token_hash),
    user_id: String(r.user_id),
    purpose: r.purpose as TokenPurpose,
    expires_at: isoReq(r.expires_at),
    used: Boolean(r.used),
    created_at: isoReq(r.created_at),
  };
}

// --- Orders ---------------------------------------------------------------

export async function saveOrder(order: WebsiteOrder): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO site_orders
       (idempotency_key, email, plan, software_type, form, status, razorpay_order_id,
        razorpay_payment_id, license_key, amount, currency, mock, created_at, paid_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (idempotency_key) DO UPDATE SET
       email = EXCLUDED.email, plan = EXCLUDED.plan, software_type = EXCLUDED.software_type,
       form = EXCLUDED.form, status = EXCLUDED.status,
       razorpay_order_id = EXCLUDED.razorpay_order_id,
       razorpay_payment_id = EXCLUDED.razorpay_payment_id,
       license_key = EXCLUDED.license_key, amount = EXCLUDED.amount,
       currency = EXCLUDED.currency, mock = EXCLUDED.mock,
       created_at = EXCLUDED.created_at, paid_at = EXCLUDED.paid_at`,
    [
      order.idempotency_key, order.email, order.plan, order.software_type,
      JSON.stringify(order.form ?? {}), order.status, order.razorpay_order_id,
      order.razorpay_payment_id ?? null, order.license_key ?? null, order.amount,
      order.currency, order.mock, order.created_at, order.paid_at ?? null,
    ]
  );
}

export async function getOrderByKey(idempotencyKey: string): Promise<WebsiteOrder | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_orders WHERE idempotency_key = $1`, [idempotencyKey]);
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<WebsiteOrder | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_orders WHERE razorpay_order_id = $1 LIMIT 1`, [razorpayOrderId]);
  return rows[0] ? mapOrder(rows[0]) : null;
}

// --- Licenses --------------------------------------------------------------

export async function saveLicense(license: LicenseRecord): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO site_licenses
       ("key", business_name, owner_name, city, phone, email, notes, amount_paid,
        software_type, status, plan_type, duration_days, is_used, machine_id,
        subscription_started_at, subscription_expires_at, created_at,
        payment_id, order_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     ON CONFLICT ("key") DO UPDATE SET
       business_name = EXCLUDED.business_name, owner_name = EXCLUDED.owner_name,
       city = EXCLUDED.city, phone = EXCLUDED.phone, email = EXCLUDED.email,
       notes = EXCLUDED.notes, amount_paid = EXCLUDED.amount_paid,
       software_type = EXCLUDED.software_type, status = EXCLUDED.status,
       plan_type = EXCLUDED.plan_type, duration_days = EXCLUDED.duration_days,
       is_used = EXCLUDED.is_used, machine_id = EXCLUDED.machine_id,
       subscription_started_at = EXCLUDED.subscription_started_at,
       subscription_expires_at = EXCLUDED.subscription_expires_at,
       created_at = EXCLUDED.created_at, payment_id = EXCLUDED.payment_id,
       order_id = EXCLUDED.order_id, idempotency_key = EXCLUDED.idempotency_key`,
    [
      license.key, license.business_name, license.owner_name, license.city, license.phone,
      license.email ?? null, license.notes ?? null, license.amount_paid,
      license.software_type, license.status, license.plan_type, license.duration_days,
      license.is_used, license.machine_id,
      license.subscription_started_at || null, license.subscription_expires_at || null,
      license.created_at, license.payment_id ?? null, license.order_id ?? null,
      license.idempotency_key ?? null,
    ]
  );
}

export async function findLicenseByKey(key: string): Promise<LicenseRecord | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_licenses WHERE "key" = $1`, [key]);
  return rows[0] ? mapLicense(rows[0]) : null;
}

export async function findLicenseByPayment(paymentId: string): Promise<LicenseRecord | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_licenses WHERE payment_id = $1 LIMIT 1`, [paymentId]);
  return rows[0] ? mapLicense(rows[0]) : null;
}

export async function findLicenseByOrderId(orderId: string): Promise<LicenseRecord | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_licenses WHERE order_id = $1 LIMIT 1`, [orderId]);
  return rows[0] ? mapLicense(rows[0]) : null;
}

export async function findLicenseByIdempotencyKey(key: string): Promise<LicenseRecord | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_licenses WHERE idempotency_key = $1 LIMIT 1`, [key]);
  return rows[0] ? mapLicense(rows[0]) : null;
}

export async function keyExists(key: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await query(`SELECT 1 FROM site_licenses WHERE "key" = $1 LIMIT 1`, [key]);
  return rows.length > 0;
}

export async function findLicensesByEmail(email: string): Promise<LicenseRecord[]> {
  await ensureSchema();
  const want = email.trim().toLowerCase();
  const { rows } = await query(
    `SELECT * FROM site_licenses WHERE LOWER(TRIM(COALESCE(email, ''))) = $1 ORDER BY created_at DESC`,
    [want]
  );
  return rows.map(mapLicense);
}

// --- Users -----------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureSchema();
  const want = email.trim().toLowerCase();
  const { rows } = await query(`SELECT * FROM site_users WHERE LOWER(email) = $1 LIMIT 1`, [want]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_users WHERE id = $1`, [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function saveUser(user: UserRecord): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO site_users
       (id, name, business, email, phone, plan_interest, password_hash, password_salt,
        email_verified, failed_logins, locked_until, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, business = EXCLUDED.business, email = EXCLUDED.email,
       phone = EXCLUDED.phone, plan_interest = EXCLUDED.plan_interest,
       password_hash = EXCLUDED.password_hash, password_salt = EXCLUDED.password_salt,
       email_verified = EXCLUDED.email_verified, failed_logins = EXCLUDED.failed_logins,
       locked_until = EXCLUDED.locked_until, created_at = EXCLUDED.created_at`,
    [
      user.id, user.name, user.business, user.email, user.phone, user.plan_interest,
      user.password_hash, user.password_salt, user.email_verified, user.failed_logins,
      user.locked_until ?? null, user.created_at,
    ]
  );
}

// --- Sessions ---------------------------------------------------------------

export async function saveSession(sess: SessionRecord): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO site_sessions (token_hash, user_id, created_at, expires_at, ip, ua)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (token_hash) DO UPDATE SET
       user_id = EXCLUDED.user_id, created_at = EXCLUDED.created_at,
       expires_at = EXCLUDED.expires_at, ip = EXCLUDED.ip, ua = EXCLUDED.ua`,
    [sess.token_hash, sess.user_id, sess.created_at, sess.expires_at, sess.ip ?? null, sess.ua ?? null]
  );
}

export async function findSession(tokenHash: string): Promise<SessionRecord | null> {
  await ensureSchema();
  const { rows } = await query(`SELECT * FROM site_sessions WHERE token_hash = $1`, [tokenHash]);
  return rows[0] ? mapSession(rows[0]) : null;
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await ensureSchema();
  await query(`DELETE FROM site_sessions WHERE token_hash = $1`, [tokenHash]);
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await ensureSchema();
  await query(`DELETE FROM site_sessions WHERE user_id = $1`, [userId]);
}

// --- Single-use tokens -------------------------------------------------------

export async function saveToken(tok: TokenRecord): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO site_tokens (token_hash, user_id, purpose, expires_at, used, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (token_hash) DO NOTHING`,
    [tok.token_hash, tok.user_id, tok.purpose, tok.expires_at, tok.used, tok.created_at]
  );
}

export async function findToken(tokenHash: string, purpose: TokenPurpose): Promise<TokenRecord | null> {
  await ensureSchema();
  const { rows } = await query(
    `SELECT * FROM site_tokens WHERE token_hash = $1 AND purpose = $2`,
    [tokenHash, purpose]
  );
  return rows[0] ? mapToken(rows[0]) : null;
}

export async function markTokenUsed(tokenHash: string): Promise<void> {
  await ensureSchema();
  await query(`UPDATE site_tokens SET used = true WHERE token_hash = $1`, [tokenHash]);
}
