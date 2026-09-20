import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  CheckoutForm,
  LicenseRecord,
  OrderStatus,
  SessionRecord,
  TokenPurpose,
  TokenRecord,
  UserRecord,
  WebsiteOrder,
} from './store-types';

/**
 * File-backed JSON store (`./data/*.json`) — used only when POSTGRES_URL
 * is unset. All access goes through the functions below with the same
 * signatures as ./store-pg, so API routes never care which backend is live.
 */

interface StoreShape {
  orders: WebsiteOrder[];
  licenses: LicenseRecord[];
  users: UserRecord[];
  sessions: SessionRecord[];
  tokens: TokenRecord[];
}

const g = globalThis as unknown as { __aurumos_store?: StoreShape };

function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), 'data');
}

function ordersFile(): string {
  return path.join(dataDir(), 'website_orders.json');
}

function licensesFile(): string {
  return path.join(dataDir(), 'licenses.json');
}

function usersFile(): string {
  return path.join(dataDir(), 'users.json');
}

function sessionsFile(): string {
  return path.join(dataDir(), 'sessions.json');
}

function tokensFile(): string {
  return path.join(dataDir(), 'tokens.json');
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}

async function load(): Promise<StoreShape> {
  if (!g.__aurumos_store) {
    const [orders, licenses, users, sessions, tokens] = await Promise.all([
      readJson<WebsiteOrder[]>(ordersFile(), []),
      readJson<LicenseRecord[]>(licensesFile(), []),
      readJson<UserRecord[]>(usersFile(), []),
      readJson<SessionRecord[]>(sessionsFile(), []),
      readJson<TokenRecord[]>(tokensFile(), []),
    ]);
    g.__aurumos_store = { orders, licenses, users, sessions, tokens };
  }
  return g.__aurumos_store;
}

async function persist(s: StoreShape): Promise<void> {
  await Promise.all([
    writeJson(ordersFile(), s.orders),
    writeJson(licensesFile(), s.licenses),
    writeJson(usersFile(), s.users),
    writeJson(sessionsFile(), s.sessions),
    writeJson(tokensFile(), s.tokens),
  ]);
}

// --- Orders ---------------------------------------------------------------

export async function saveOrder(order: WebsiteOrder): Promise<void> {
  const s = await load();
  const i = s.orders.findIndex((o) => o.idempotency_key === order.idempotency_key);
  if (i >= 0) s.orders[i] = order;
  else s.orders.push(order);
  await persist(s);
}

export async function getOrderByKey(idempotencyKey: string): Promise<WebsiteOrder | null> {
  const s = await load();
  return s.orders.find((o) => o.idempotency_key === idempotencyKey) ?? null;
}

export async function getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<WebsiteOrder | null> {
  const s = await load();
  return s.orders.find((o) => o.razorpay_order_id === razorpayOrderId) ?? null;
}

// --- Licenses --------------------------------------------------------------

export async function saveLicense(license: LicenseRecord): Promise<void> {
  const s = await load();
  const i = s.licenses.findIndex((l) => l.key === license.key);
  if (i >= 0) s.licenses[i] = license;
  else s.licenses.push(license);
  await persist(s);
}

export async function findLicenseByKey(key: string): Promise<LicenseRecord | null> {
  const s = await load();
  return s.licenses.find((l) => l.key === key) ?? null;
}

/** Idempotency lookup: an already-minted license for this payment. */
export async function findLicenseByPayment(paymentId: string): Promise<LicenseRecord | null> {
  const s = await load();
  return s.licenses.find((l) => l.payment_id === paymentId) ?? null;
}

export async function findLicenseByOrderId(orderId: string): Promise<LicenseRecord | null> {
  const s = await load();
  return s.licenses.find((l) => l.order_id === orderId) ?? null;
}

export async function findLicenseByIdempotencyKey(key: string): Promise<LicenseRecord | null> {
  const s = await load();
  return s.licenses.find((l) => l.idempotency_key === key) ?? null;
}

export async function keyExists(key: string): Promise<boolean> {
  return (await findLicenseByKey(key)) !== null;
}

export async function findLicensesByEmail(email: string): Promise<LicenseRecord[]> {
  const s = await load();
  const want = email.trim().toLowerCase();
  return s.licenses.filter((l) => (l.email ?? '').trim().toLowerCase() === want);
}

// --- Users ---------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const s = await load();
  const want = email.trim().toLowerCase();
  return s.users.find((u) => u.email === want) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const s = await load();
  return s.users.find((u) => u.id === id) ?? null;
}

export async function saveUser(user: UserRecord): Promise<void> {
  const s = await load();
  const i = s.users.findIndex((u) => u.id === user.id);
  if (i >= 0) s.users[i] = user;
  else s.users.push(user);
  await persist(s);
}

// --- Sessions (opaque, revocable) -----------------------------------------

export async function saveSession(sess: SessionRecord): Promise<void> {
  const s = await load();
  const i = s.sessions.findIndex((x) => x.token_hash === sess.token_hash);
  if (i >= 0) s.sessions[i] = sess;
  else s.sessions.push(sess);
  await persist(s);
}

export async function findSession(tokenHash: string): Promise<SessionRecord | null> {
  const s = await load();
  return s.sessions.find((x) => x.token_hash === tokenHash) ?? null;
}

export async function deleteSession(tokenHash: string): Promise<void> {
  const s = await load();
  s.sessions = s.sessions.filter((x) => x.token_hash !== tokenHash);
  await persist(s);
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const s = await load();
  s.sessions = s.sessions.filter((x) => x.user_id !== userId);
  await persist(s);
}

// --- Single-use tokens (email verify / password reset) --------------------

export async function saveToken(tok: TokenRecord): Promise<void> {
  const s = await load();
  s.tokens.push(tok);
  await persist(s);
}

export async function findToken(tokenHash: string, purpose: TokenPurpose): Promise<TokenRecord | null> {
  const s = await load();
  return s.tokens.find((t) => t.token_hash === tokenHash && t.purpose === purpose) ?? null;
}

export async function markTokenUsed(tokenHash: string): Promise<void> {
  const s = await load();
  const t = s.tokens.find((x) => x.token_hash === tokenHash);
  if (t) {
    t.used = true;
    await persist(s);
  }
}
