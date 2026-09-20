# Prompt: Build AurumOS ERP Subscription & Feature Gating

Use this prompt when building the AurumOS ERP client software's subscription
and feature gating system.

---

## Prompt

You are building the AurumOS ERP desktop application's license subscription
and feature gating system. The admin dashboard (Next.js) is the source of
truth. Your job is to implement the CLIENT-SIDE enforcement.

### What exists on the server (DO NOT modify):

- `POST /api/check` — startup validation, returns license + subscription state
- `POST /api/subscription/status` — periodic sync (every 30 min)
- `POST /api/feature-check` — per-feature entitlement check
- `GET /api/nexus/stream?key=...` — SSE for real-time plan changes
- `POST /api/nexus/handshake` — activation + subscription validation

### Your task:

1. **Startup validation**: On app launch, call `POST /api/check` with
   `{ key, machine_id }`. Parse the response:
   - `valid: true` + `status: "active"` → unlock software, apply `effective_plan` features
   - `valid: true` + `status: "grace"` → show grace warning, apply ONLY Lite features
   - `valid: false` + `status: "subscription_expired"` → show renewal modal, lock all features
   - `valid: false` + `status: "trial_expired"` → show trial expired modal

2. **Feature gating**: Before enabling ANY feature, check:
   ```
   if effective_plan includes feature_id → enable
   else → show "Upgrade to {required_plan}" message
   ```
   The `features` array in the response contains ALL allowed feature IDs.
   Just check `if feature_id in features`.

3. **Periodic sync**: Every 30 minutes, call `POST /api/subscription/status`
   to get fresh subscription state. If the plan changed (e.g., admin renewed),
   the response will have updated `effective_plan` and `features`.

4. **SSE real-time updates**: Connect to `GET /api/nexus/stream?key=...`:
   - On `plan_change` event → re-fetch `/api/subscription/status`
   - On `status_change` event where `status === 'revoked'` → lock software
   - On `status_change` event where `status === 'active'` → unlock software
   - Auto-reconnect on disconnect with exponential backoff

5. **Grace period UI**: When `subscription.status === 'grace'`:
   - Show warning: "Subscription in grace period — {grace_remaining_days} days remaining"
   - All features degrade to Lite tier (the `effective_plan` field tells you this)
   - Pro/Enterprise features are disabled but user DATA is preserved
   - Show "Renew Now" button linking to admin contact

6. **Subscription expiry UI**: When `subscription.status === 'expired'`:
   - Show full-screen renewal modal
   - Display: business name, plan, expiry date, renewal amount
   - "Contact AurumOS support to renew" message
   - Block ALL software functionality until renewed

7. **Offline resilience**:
   - Cache last-known subscription state locally
   - On network failure, use cache for up to 24 hours
   - After 24 hours offline, degrade to Lite features only
   - On reconnection, sync with server

### Response formats (from server):

**/api/check and /api/subscription/status:**
```json
{
  "valid": true,
  "status": "active|grace",
  "effective_plan": "lite|pro|enterprise",
  "features": ["feature_id_1", "feature_id_2", ...],
  "subscription": {
    "status": "active|grace|expired",
    "expires_at": "2026-12-31T00:00:00.000Z",
    "remaining_days": 120,
    "grace_remaining_days": 0,
    "renewal_amount": 7000
  },
  "business": "Shop Name",
  "owner": "Owner Name",
  "plan": "pro",
  "is_trial": false,
  "trial_end_ms": null
}
```

**SSE events:**
```
event: plan_change
data: {"key":"AU-XXXX","plan":"enterprise","subscription_expires_at":"2027-01-01T00:00:00Z"}

event: status_change
data: {"key":"AU-XXXX","status":"revoked","message":"License revoked."}
```

### Critical rules:

- NEVER hardcode feature lists. Always use the `features` array from the server.
- NEVER skip the subscription check. Even if `valid: true`, check `effective_plan`.
- ALWAYS show the subscription expiry date and remaining days in the UI.
- ALWAYS use `effective_plan` (not `plan`) for feature gating — `plan` is the
  purchased tier, `effective_plan` is what's actually available (degraded during grace).
- The server response `subscription.renewal_amount` is in INR (₹). Display as ₹X,XXX.

### Feature ID reference (30 features):

**Lite (10):** local_mode, billing_retail, stock_entry, product_master,
client_ledger, staff_login_lockout, tag_printing_local, scale_weighing,
sales_report_basic, bastion_core

**Pro adds (11):** lan_multi_pc, karigar_vouchers, touch_groups, full_accounts,
tag_audit, stock_med_reports, tsc_network_printing, multi_staff,
analytics_dashboard, year_close, bastion_enhanced

**Enterprise adds (9):** cloud_sync, fleet_bastion, customer_loyalty, bastion_ai,
nexus_management, bridge_server, custom_db_location, priority_support, api_integration
