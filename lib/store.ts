/**
 * Website store facade.
 *
 * Types live in ./store-types. Functions are delegated to exactly one backend:
 *   - POSTGRES_URL set   → ./store-pg  (Postgres `site_*` tables, shared DB with admin)
 *   - POSTGRES_URL unset → ./store-file (local `./data/*.json`, zero-setup dev)
 *
 * All 16 consumer files import from here — switching backends touches nothing else.
 */

export type {
  CheckoutForm,
  LicenseRecord,
  OrderStatus,
  SessionRecord,
  TokenPurpose,
  TokenRecord,
  UserRecord,
  WebsiteOrder,
} from './store-types';

import * as fileBackend from './store-file';
import * as pgBackend from './store-pg';

const backend = process.env.POSTGRES_URL ? pgBackend : fileBackend;

/** Which backend is live — surfaced by /api/setup-db for diagnostics. */
export const STORE_BACKEND = process.env.POSTGRES_URL ? 'postgres' : 'files';

export const saveOrder = backend.saveOrder;
export const getOrderByKey = backend.getOrderByKey;
export const getOrderByRazorpayOrderId = backend.getOrderByRazorpayOrderId;
export const saveLicense = backend.saveLicense;
export const findLicenseByKey = backend.findLicenseByKey;
export const findLicenseByPayment = backend.findLicenseByPayment;
export const findLicenseByOrderId = backend.findLicenseByOrderId;
export const findLicenseByIdempotencyKey = backend.findLicenseByIdempotencyKey;
export const keyExists = backend.keyExists;
export const findLicensesByEmail = backend.findLicensesByEmail;
export const findUserByEmail = backend.findUserByEmail;
export const findUserById = backend.findUserById;
export const saveUser = backend.saveUser;
export const saveSession = backend.saveSession;
export const findSession = backend.findSession;
export const deleteSession = backend.deleteSession;
export const deleteUserSessions = backend.deleteUserSessions;
export const saveToken = backend.saveToken;
export const findToken = backend.findToken;
export const markTokenUsed = backend.markTokenUsed;
