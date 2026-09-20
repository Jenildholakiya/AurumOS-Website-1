import type { PlanId, SoftwareType } from './plans';

/**
 * Shared record shapes for the website store.
 * Implemented by ./store-file (local JSON) and ./store-pg (Postgres);
 * ./store re-exports these types and delegates the functions.
 */

export type OrderStatus = 'pending' | 'paid' | 'failed';

export interface CheckoutForm {
  business_name: string;
  owner_name: string;
  city: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface WebsiteOrder {
  idempotency_key: string;
  email: string;
  plan: PlanId;
  software_type: SoftwareType;
  form: CheckoutForm;
  status: OrderStatus;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  license_key?: string;
  /** Expected amount in paise. */
  amount: number;
  currency: string;
  mock: boolean;
  created_at: string;
  paid_at?: string;
}

export interface LicenseRecord {
  key: string;
  business_name: string;
  owner_name: string;
  city: string;
  phone: string;
  email?: string;
  notes?: string;
  /** Amount paid in INR (rupees). */
  amount_paid: number;
  software_type: SoftwareType;
  status: 'active' | 'suspended' | 'revoked';
  plan_type: PlanId;
  duration_days: number;
  is_used: boolean;
  machine_id: string | null;
  subscription_started_at: string;
  subscription_expires_at: string;
  created_at: string;
  payment_id?: string;
  order_id?: string;
  idempotency_key?: string;
}

/** Password NEVER stored — only scrypt hash + salt. */
export interface UserRecord {
  id: string;
  name: string;
  business: string;
  email: string; // lowercase
  phone: string;
  plan_interest: string;
  password_hash: string; // scrypt hex
  password_salt: string; // hex
  email_verified: boolean;
  failed_logins: number;
  locked_until?: string;
  created_at: string;
}

export interface SessionRecord {
  token_hash: string; // sha256 hex of the cookie token
  user_id: string;
  created_at: string;
  expires_at: string;
  ip?: string;
  ua?: string;
}

export type TokenPurpose = 'verify_email' | 'reset_password';

export interface TokenRecord {
  token_hash: string;
  user_id: string;
  purpose: TokenPurpose;
  expires_at: string;
  used: boolean;
  created_at: string;
}
