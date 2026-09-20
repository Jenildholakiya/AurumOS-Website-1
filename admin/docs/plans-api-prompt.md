# Prompt: Fetch Subscription Plans for Renewal UI

Use this prompt when building the AurumOS ERP client's subscription renewal
screen (revoked.html or any plan display).

---

## Prompt

You are building the AurumOS ERP client's subscription plan display and
renewal screen. The server provides a `GET /api/subscription/plans` endpoint
that returns all available plans with pricing.

### Server endpoint:

```
GET https://aurum-os-admin.vercel.app/api/subscription/plans
```

### Response format:

```json
{
  "plans": [
    {
      "id": "lite",
      "name": "Lite",
      "emoji": "🥉",
      "price": 3000,
      "onboarding": 15000,
      "period": "year",
      "desc": "10 Features",
      "features": ["local_mode", "billing_retail", "stock_entry", "product_master", "client_ledger", "staff_login_lockout", "tag_printing_local", "scale_weighing", "sales_report_basic", "bastion_core"],
      "accent": "#b45309"
    },
    {
      "id": "pro",
      "name": "Pro",
      "emoji": "🥈",
      "price": 7000,
      "onboarding": 35000,
      "period": "year",
      "desc": "21 Features",
      "features": ["local_mode", "billing_retail", "stock_entry", "product_master", "client_ledger", "staff_login_lockout", "tag_printing_local", "scale_weighing", "sales_report_basic", "bastion_core", "lan_multi_pc", "karigar_vouchers", "touch_groups", "full_accounts", "tag_audit", "stock_med_reports", "tsc_network_printing", "multi_staff", "analytics_dashboard", "year_close", "bastion_enhanced"],
      "accent": "#6b7280"
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "emoji": "🥇",
      "price": 15000,
      "onboarding": 75000,
      "period": "year",
      "desc": "30 Features",
      "features": ["local_mode", "billing_retail", "stock_entry", "product_master", "client_ledger", "staff_login_lockout", "tag_printing_local", "scale_weighing", "sales_report_basic", "bastion_core", "lan_multi_pc", "karigar_vouchers", "touch_groups", "full_accounts", "tag_audit", "stock_med_reports", "tsc_network_printing", "multi_staff", "analytics_dashboard", "year_close", "bastion_enhanced", "cloud_sync", "fleet_bastion", "customer_loyalty", "bastion_ai", "nexus_management", "bridge_server", "custom_db_location", "priority_support", "api_integration"],
      "accent": "#a87d1e"
    }
  ]
}
```

### Field reference:

| Field        | Meaning                                         |
|--------------|-------------------------------------------------|
| `id`         | Plan tier: `lite`, `pro`, `enterprise`           |
| `name`       | Display name                                    |
| `emoji`      | Plan icon (for UI display)                      |
| `price`      | Annual renewal price in ₹ (Indian Rupees)       |
| `onboarding` | One-time onboarding fee in ₹                    |
| `period`     | Billing period (`year` = annual)                 |
| `desc`       | Feature count summary (e.g., "21 Features")     |
| `features`   | Array of feature IDs included in this plan      |
| `accent`     | CSS color for plan branding                     |

### Implementation:

**Two fetch paths (primary + fallback):**

```javascript
// Path 1: pywebview bridge (primary)
async function fetchPlansPywebview() {
  try {
    const result = await pywebview.api.get_plans();
    if (result && result.plans) return result.plans;
  } catch (e) {
    console.log("pywebview bridge failed, trying direct fetch");
  }
  return null;
}

// Path 2: Direct browser fetch (fallback)
async function fetchPlansDirect() {
  try {
    const res = await fetch("https://aurum-os-admin.vercel.app/api/subscription/plans");
    const data = await res.json();
    if (data && data.plans) return data.plans;
  } catch (e) {
    console.log("Direct fetch also failed");
  }
  return null;
}

// Combined: try pywebview first, fallback to direct
async function getPlans() {
  let plans = await fetchPlansPywebview();
  if (!plans) plans = await fetchPlansDirect();
  if (!plans) plans = getHardcodedPlans(); // final fallback
  return plans;
}

// Hardcoded fallback (if server is unreachable)
function getHardcodedPlans() {
  return [
    { id: "lite", name: "Lite", emoji: "🥉", price: 3000, onboarding: 15000, period: "year", desc: "10 Features" },
    { id: "pro", name: "Pro", emoji: "🥈", price: 7000, onboarding: 35000, period: "year", desc: "21 Features" },
    { id: "enterprise", name: "Enterprise", emoji: "🥇", price: 15000, onboarding: 75000, period: "year", desc: "30 Features" },
  ];
}
```

### UI display rules:

1. Show all 3 plans as cards side by side
2. Highlight the user's current plan (from `/api/check` response `plan` field)
3. Show price as ₹X,XXX/yr (use `price` field)
4. Show onboarding fee as ₹XX,XXX one-time (use `onboarding` field)
5. Show feature count from `desc` field
6. "Renew" button on the current plan card
7. "Upgrade" button on higher-tier cards
8. "Contact Support" for custom Enterprise needs

### Error handling:

- If server unreachable → use hardcoded fallback prices
- If pywebview bridge fails → use direct browser fetch
- If both fail → show hardcoded plans with "Prices may have changed" note
- NEVER block the UI on network failure — always show something

### Critical rules:

- Prices are in INR (₹). Format as `₹X,XXX`
- `price` = annual renewal, `onboarding` = one-time first fee
- ALWAYS try pywebview bridge FIRST (it's faster and works offline)
- ALWAYS have hardcoded fallback (server might be down)
- The `features` array tells you exactly what each plan includes
- Use `accent` color for plan card branding/borders
