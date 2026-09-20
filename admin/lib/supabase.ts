import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Lazy Supabase client.
 *
 * Several API routes used to call `createClient()` at module top-level,
 * which throws ("supabaseUrl is required") while Next.js collects page data
 * at build time — before any env exists. Importing this module is always
 * safe; the client is created on first use, inside a request handler, and
 * throws a clear error there if the env is missing.
 */

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
    )
  }
  _client = createClient(url, key)
  return _client
}
