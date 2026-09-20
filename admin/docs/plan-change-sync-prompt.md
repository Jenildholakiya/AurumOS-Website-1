# Prompt: Real-Time Plan Change Sync

Use this prompt when building the AurumOS ERP client's real-time plan
upgrade/downgrade handling.

---

## Prompt

You are building the AurumOS ERP client's real-time plan synchronization.
When an admin changes a license plan in the dashboard, the client must
instantly receive the new plan and update available features without restart.

### How it works:

1. Admin changes plan in dashboard → `POST /api/subscription/change-plan`
2. Server updates database and broadcasts `plan_change` SSE event
3. Client receives SSE event → re-fetches `/api/subscription/status`
4. New features are applied immediately — no restart needed

### SSE event format:

```
event: plan_change
data: {
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "plan": "enterprise",
  "features": ["local_mode", "billing_retail", ..., "api_integration"],
  "subscription_expires_at": "2027-08-22T00:00:00.000Z",
  "message": "Plan changed to ENTERPRISE. Features: 30. Expires: 22/08/2027"
}
```

### Client implementation:

```javascript
// SSE connection (already running from startup)
const eventSource = new EventSource(`/api/nexus/stream?key=${licenseKey}`);

// Handle plan change event
eventSource.addEventListener('plan_change', async (event) => {
  const data = JSON.parse(event.data);
  
  console.log(`Plan changed to ${data.plan}`);
  console.log(`New features: ${data.features.length}`);
  
  // Re-fetch full subscription status to get updated feature list
  const status = await fetchSubscriptionStatus();
  
  // Apply new features immediately
  applyFeatures(status.features);
  
  // Update UI
  showNotification(`Plan upgraded to ${data.plan.toUpperCase()}!`);
  updatePlanDisplay(data.plan, data.features);
  
  // If features were removed (downgrade), disable those modules
  if (data.plan === 'lite') {
    disableAdvancedFeatures();
  }
});
```

### Feature application rules:

**When upgrading (e.g., Lite → Pro):**
- New features become available instantly
- User can access previously locked modules
- Show notification: "Pro features now available"

**When downgrading (e.g., Enterprise → Lite):**
- Features are removed immediately
- If user is in a removed module, redirect to dashboard
- Show notification: "Features limited to Lite tier"
- User DATA is preserved — only access is restricted

**When plan changes but tier is same:**
- Subscription expiry is reset to 1 year
- No feature changes needed
- Show notification: "Subscription renewed"

### API endpoints:

**Change plan (admin calls):**
```
POST /api/subscription/change-plan
Body: { id: number, plan: string }
Response: {
  status: "success",
  data: {
    id: number,
    plan: "pro",
    features: [...],
    subscription_expires_at: "2027-08-22T00:00:00.000Z",
    previous_plan: "lite"
  }
}
```

**Get current status (client calls):**
```
POST /api/subscription/status
Body: { key: string, machine_id: string }
Response: {
  valid: true,
  plan: "enterprise",
  effective_plan: "enterprise",
  features: [...],
  subscription_status: "active",
  ...
}
```

### Critical rules:

1. NEVER cache features for more than 30 minutes — always re-fetch on plan_change
2. ALWAYS apply features from `effective_plan` (not `plan`) — grace period degrades to lite
3. ALWAYS preserve user data on downgrade — only restrict access
4. ALWAYS show notification when plan changes — user must know
5. If SSE disconnects, reconnect with exponential backoff (max 30s)
6. On reconnect, re-fetch `/api/subscription/status` to sync state

### Error handling:

- If `/api/subscription/status` fails → keep current features, retry in 60s
- If SSE disconnects → show "Reconnecting..." indicator
- If plan change fails → revert to previous plan in UI, show error
- NEVER lock user out on network failure — use last-known-good state
