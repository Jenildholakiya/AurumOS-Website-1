# AurumOS ERP — Subscription & Feature Gating Integration Spec

## Overview

This document describes how the AurumOS ERP client software integrates with the
Admin Dashboard's subscription system. The admin dashboard is the **source of
truth** for license state. The ERP client enforces plan-based feature access
locally using data received from the server.

---

## Architecture

```
┌──────────────────┐       ┌──────────────────────────┐
│  AurumOS ERP     │       │  Admin Dashboard API      │
│  (Client App)    │◄─────►│  (Next.js on Vercel)      │
│                  │       │                          │
│  - License key   │ POST  │  /api/check              │
│  - Machine ID    │       │  /api/nexus/handshake     │
│  - Feature gates │       │  /api/feature-check       │
│  - Plan display  │ SSE   │  /api/subscription/status │
│  - Renewal UI    │◄─────►│  /api/nexus/stream (SSE)  │
└──────────────────┘       └──────────────────────────┘
```

---

## Plan Tiers & Features

### Tier Hierarchy (Cumulative)
- **Lite**: 10 core features (billing, inventory basics, security)
- **Pro**: All Lite + 11 advanced features (LAN, accounts, analytics)
- **Enterprise**: All Pro + 9 premium features (cloud sync, AI, API access)

### Full Feature List

| Feature ID                  | Lite | Pro | Enterprise | Category   |
|-----------------------------|------|-----|------------|------------|
| local_mode                  | ✓    | ✓   | ✓          | core       |
| billing_retail              | ✓    | ✓   | ✓          | core       |
| stock_entry                 | ✓    | ✓   | ✓          | inventory  |
| product_master              | ✓    | ✓   | ✓          | inventory  |
| client_ledger               | ✓    | ✓   | ✓          | accounts   |
| staff_login_lockout         | ✓    | ✓   | ✓          | security   |
| tag_printing_local          | ✓    | ✓   | ✓          | printing   |
| scale_weighing              | ✓    | ✓   | ✓          | inventory  |
| sales_report_basic          | ✓    | ✓   | ✓          | core       |
| bastion_core                | ✓    | ✓   | ✓          | security   |
| lan_multi_pc                |      | ✓   | ✓          | network    |
| karigar_vouchers            |      | ✓   | ✓          | inventory  |
| touch_groups                |      | ✓   | ✓          | inventory  |
| full_accounts               |      | ✓   | ✓          | accounts   |
| tag_audit                   |      | ✓   | ✓          | inventory  |
| stock_med_reports           |      | ✓   | ✓          | inventory  |
| tsc_network_printing        |      | ✓   | ✓          | printing   |
| multi_staff                 |      | ✓   | ✓          | security   |
| analytics_dashboard         |      | ✓   | ✓          | core       |
| year_close                  |      | ✓   | ✓          | accounts   |
| bastion_enhanced            |      | ✓   | ✓          | security   |
| cloud_sync                  |      |     | ✓          | cloud      |
| fleet_bastion               |      |     | ✓          | cloud      |
| customer_loyalty            |      |     | ✓          | accounts   |
| bastion_ai                  |      |     | ✓          | security   |
| nexus_management            |      |     | ✓          | network    |
| bridge_server               |      |     | ✓          | network    |
| custom_db_location          |      |     | ✓          | cloud      |
| priority_support            |      |     | ✓          | support    |
| api_integration             |      |     | ✓          | support    |

---

## Subscription Lifecycle

### States

| State       | Meaning                                                       | Features Available |
|-------------|---------------------------------------------------------------|--------------------|
| **active**  | `subscription_expires_at` is in the future                    | Full plan features |
| **grace**   | Within 7 days past expiry                                     | Lite features only |
| **expired** | > 30 days past expiry                                         | None (license locked) |

### Timeline

```
License Created
    │
    ├── subscription_started_at = NOW()
    ├── subscription_expires_at = NOW() + duration_days
    │
    ▼
Active Period (full features)
    │
    ├── subscription_expires_at reached
    │
    ▼
Grace Period (7 days, Lite features only)
    │
    ├── 7 days past expiry
    │
    ▼
Hard Expiry (license locked, 30-day window)
    │
    ├── Admin renews → resets to active
    └── 30 days past → fully expired
```

---

## API Endpoints

### 1. POST /api/check (Startup Validation)

Called by ERP on startup. Returns full license + subscription state.

**Request:**
```json
{
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "machine_id": "MACHINE-ID-HERE"
}
```

**Response (active):**
```json
{
  "valid": true,
  "status": "active",
  "business": "Shop Name",
  "owner": "Owner Name",
  "plan": "pro",
  "effective_plan": "pro",
  "features": ["local_mode", "billing_retail", ..., "bastion_enhanced"],
  "is_trial": false,
  "trial_end_ms": null,
  "subscription": {
    "status": "active",
    "expires_at": "2026-12-31T00:00:00.000Z",
    "remaining_days": 120,
    "grace_remaining_days": 0,
    "effective_plan": "pro",
    "renewal_amount": 7000
  }
}
```

**Response (grace period):**
```json
{
  "valid": true,
  "status": "grace",
  "effective_plan": "lite",
  "features": ["local_mode", "billing_retail", ...],
  "subscription": {
    "status": "grace",
    "grace_remaining_days": 5,
    "effective_plan": "lite",
    "renewal_amount": 7000
  }
}
```

**Response (expired):**
```json
{
  "valid": false,
  "status": "subscription_expired",
  "message": "Subscription has expired. Please renew.",
  "subscription": {
    "status": "expired",
    "expires_at": "2026-11-01T00:00:00.000Z"
  }
}
```

### 2. POST /api/subscription/status (Periodic Sync)

Called every 15-30 minutes. Returns same structure as /api/check but
subscription-focused. Use this for runtime sync without full re-validation.

**Request:**
```json
{ "key": "AU-XXXX-XXXX-XXXX-XXXX", "machine_id": "MACHINE-ID-HERE" }
```

**Response:** Same shape as `/api/check` response.

### 3. POST /api/feature-check (Per-Feature Gate)

Called before enabling any gated feature. Returns whether the specific
feature is allowed.

**Request:**
```json
{
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "machine_id": "MACHINE-ID-HERE",
  "feature": "lan_multi_pc"
}
```

**Response (allowed):**
```json
{
  "allowed": true,
  "plan": "pro",
  "effective_plan": "pro",
  "feature": "lan_multi_pc",
  "reason": "ok",
  "subscription_status": "active"
}
```

**Response (not allowed — upgrade needed):**
```json
{
  "allowed": false,
  "plan": "lite",
  "effective_plan": "lite",
  "feature": "lan_multi_pc",
  "reason": "upgrade_required",
  "subscription_status": "active"
}
```

**Response (not allowed — grace period):**
```json
{
  "allowed": false,
  "plan": "pro",
  "effective_plan": "lite",
  "feature": "lan_multi_pc",
  "reason": "grace_limited",
  "subscription_status": "grace"
}
```

### 4. GET /api/nexus/stream (SSE — Real-Time Updates)

Server-Sent Events stream for instant plan/status changes.

**Connection:** `GET /api/nexus/stream?key=AU-XXXX-XXXX-XXXX-XXXX`

**Events:**
- `connected`: `{ status: "connected" }` — initial handshake
- `status_change`: `{ key, status, message }` — license revoked/activated
- `plan_change`: `{ key, plan, subscription_expires_at, message }` — plan renewed/changed
- `heartbeat`: keepalive every 15 seconds

**Client must:**
1. Reconnect on disconnect (exponential backoff, max 30s)
2. On `plan_change`: re-fetch `/api/subscription/status` to get new features
3. On `status_change` where `status === 'revoked'`: lock the software immediately
4. On `status_change` where `status === 'active'`: unlock the software

---

## Client-Side Implementation Guide

### Startup Sequence

```
1. Load cached license from local DB/config
2. POST /api/check with { key, machine_id }
3. If valid=true → apply effective_plan features, unlock software
4. If valid=false and status=subscription_expired → show renewal prompt, lock features
5. If valid=false and status=trial_expired → show trial expired prompt
6. Start SSE connection to /api/nexus/stream
7. Start periodic sync timer (every 30 min) calling /api/subscription/status
```

### Feature Gating Logic

```python
# Pseudocode for feature checking

def is_feature_enabled(feature_id: str) -> bool:
    # Check local cache first (from last /api/check or /api/subscription/status)
    if feature_id in cached_features:
        return True
    return False

def get_effective_plan() -> str:
    return cached_effective_plan  # 'lite' during grace, actual plan when active
```

### Grace Period Behavior

When `subscription.status === 'grace'`:
- Show warning banner: "Subscription in grace period — {grace_remaining_days} days remaining"
- All features degrade to Lite tier (effective_plan = 'lite')
- Higher-tier features are disabled but data is preserved
- Admin can renew to restore full features instantly via SSE

### Renewal Flow

1. Admin clicks "Renew Subscription" in dashboard dropdown
2. Admin confirms → POST /api/subscription/renew with { id }
3. Server pushes `plan_change` SSE event to client
4. Client receives event → re-fetches `/api/subscription/status`
5. New features unlocked immediately — no restart needed

### Offline Resilience

- Cache last-known subscription state locally
- On network failure, use cached state for up to 24 hours
- After 24 hours offline, degrade to Lite features only
- On reconnection, sync with server and restore full features if still valid

---

## Database Schema Changes

Add to `licenses` table:

```sql
ALTER TABLE licenses
  ADD COLUMN subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN subscription_started_at TIMESTAMPTZ;
```

---

## Migration Script

Run `migrations/add_subscription_columns.sql` to add columns and backfill
existing licenses.

---

## Pricing Reference

| Plan       | Onboarding  | Annual Renewal |
|------------|-------------|----------------|
| Lite       | ₹15,000     | ₹3,000/yr      |
| Pro        | ₹35,000     | ₹7,000/yr      |
| Enterprise | ₹75,000     | ₹15,000/yr     |

---

## Error Codes

| status                | Meaning                              |
|-----------------------|--------------------------------------|
| `active`              | License and subscription valid       |
| `grace`               | Past expiry, 7-day grace active      |
| `subscription_expired`| Past grace, license locked           |
| `trial_expired`       | Trial period elapsed                 |
| `revoked`             | Admin-revoked                        |
| `not_found`           | Key not in database                  |
| `server_error`        | API failure (client uses cache)      |
