# Prompt: Handle Subscription Sync Network Errors

Use this prompt when the AurumOS ERP client shows "network unavailable"
during subscription sync.

---

## Prompt

The AurumOS ERP client is showing `[SUB] Sync: network unavailable` when
trying to call `POST /api/subscription/status`. This means the server
endpoint is unreachable. Your job is to make the software handle this
gracefully without breaking the user experience.

### The failing call:

```python
# This is what the software is trying to do:
response = requests.post(
    "https://aurum-os-admin.vercel.app/api/subscription/status",
    json={"key": license_key, "machine_id": machine_id},
    timeout=10
)
```

### Why it fails:

1. Server is down or deploying
2. No internet connection
3. Firewall blocking the request
4. DNS resolution failure
5. Endpoint doesn't exist yet (not deployed)

### Fix: Implement offline resilience

```python
import requests
import json
import os
from datetime import datetime, timedelta

CACHE_FILE = os.path.join(os.path.expanduser("~"), ".aurumos", "sub_cache.json")
CACHE_MAX_AGE_HOURS = 24

def save_subscription_cache(data):
    """Save subscription state to local file."""
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    cache = {
        "data": data,
        "cached_at": datetime.now().isoformat(),
        "synced": True
    }
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)

def load_subscription_cache():
    """Load cached subscription state."""
    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
        cached_at = datetime.fromisoformat(cache["cached_at"])
        age_hours = (datetime.now() - cached_at).total_seconds() / 3600
        if age_hours < CACHE_MAX_AGE_HOURS:
            return cache["data"]
    except:
        pass
    return None

def sync_subscription_status(license_key, machine_id):
    """
    Sync subscription status with server.
    Falls back to cached data if network unavailable.
    Returns: (data, source) where source is 'server' or 'cache'
    """
    # Try server first
    try:
        response = requests.post(
            "https://aurum-os-admin.vercel.app/api/subscription/status",
            json={"key": license_key, "machine_id": machine_id},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            save_subscription_cache(data)
            print("[SUB] Sync: server")
            return data, "server"
    except requests.exceptions.ConnectionError:
        print("[SUB] Sync: network unavailable, using cache")
    except requests.exceptions.Timeout:
        print("[SUB] Sync: timeout, using cache")
    except Exception as e:
        print(f"[SUB] Sync: {e}, using cache")

    # Fallback to cache
    cached = load_subscription_cache()
    if cached:
        print("[SUB] Sync: using cached data")
        return cached, "cache"

    # No cache either — use safe defaults
    print("[SUB] Sync: no cache, using defaults")
    return {
        "valid": True,
        "plan": "lite",
        "effective_plan": "lite",
        "features": get_lite_features(),
        "subscription_status": "active",
        "remaining_days": 0,
    }, "default"

def get_lite_features():
    """Minimum feature set when completely offline."""
    return [
        "local_mode", "billing_retail", "stock_entry", "product_master",
        "client_ledger", "staff_login_lockout", "tag_printing_local",
        "scale_weighing", "sales_report_basic", "bastion_core"
    ]
```

### Behavior by scenario:

| Scenario | What happens |
|----------|-------------|
| Server responds OK | Use server data, save to cache |
| Network unavailable | Use cache (up to 24 hours old) |
| Cache expired (> 24h) | Use Lite features only, show warning |
| First install, no cache | Use Lite features, try sync every 5 min |

### UI messages:

```
Server sync OK:
  "[SUB] Sync: server" → no notification needed

Cache used:
  "[SUB] Sync: network unavailable, using cached data"
  Show: "Offline mode — features based on last sync"

No cache:
  "[SUB] Sync: no cache, using defaults"
  Show: "Unable to verify subscription. Using basic features."
```

### Retry logic:

```python
def start_sync_loop(license_key, machine_id):
    """Background sync every 30 minutes."""
    while True:
        data, source = sync_subscription_status(license_key, machine_id)
        apply_features(data["features"])
        
        if source == "server":
            time.sleep(1800)  # 30 minutes
        else:
            time.sleep(300)   # retry every 5 min if offline
```

### Critical rules:

1. NEVER crash on network failure — always have a fallback
2. NEVER show raw errors to user — use friendly messages
3. ALWAYS cache successful responses — for offline use
4. Cache max age: 24 hours — after that, degrade to Lite
5. Retry faster when offline (every 5 min) vs online (every 30 min)
6. The `features` field controls what's available — use it
7. If completely offline with no cache, allow Lite features only
