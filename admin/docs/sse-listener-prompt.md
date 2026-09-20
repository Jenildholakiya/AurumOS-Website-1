# Prompt: Real-Time SSE Listener for AurumOS ERP Client

Use this prompt when building the AurumOS ERP Python client's real-time
event listener that syncs subscription and license changes instantly.

---

## Prompt

You are building the AurumOS ERP desktop application's real-time event
listener. The server broadcasts license and subscription changes via
Server-Sent Events (SSE). Your job is to implement the Python client
that receives these events and updates the software state instantly.

### Server endpoint:

```
GET https://aurum-os-admin.vercel.app/api/nexus/stream?key={LICENSE_KEY}
```

### Events you will receive:

**1. Connection established:**
```
event: connected
data: {"status":"connected","server_time":1787484750123}
```

**2. Plan changed (admin upgraded/downgraded/renewed):**
```
event: plan_change
data: {
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "plan": "enterprise",
  "features": ["local_mode", "billing_retail", ..., "api_integration"],
  "subscription_expires_at": "2027-08-23T11:32:59.124Z",
  "message": "Plan changed to ENTERPRISE. Features: 30. Expires: 23/08/2027"
}
```

**3. License status changed (revoked/activated):**
```
event: status_change
data: {
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "status": "revoked",
  "message": "License has been revoked by administrator."
}
```

**4. Keepalive (every 15 seconds):**
```
: heartbeat
```

### Python implementation:

```python
import sseclient
import requests
import json
import time
import threading

class LicenseEventListener:
    def __init__(self, license_key, on_plan_change, on_status_change):
        self.license_key = license_key
        self.on_plan_change = on_plan_change
        self.on_status_change = on_status_change
        self.running = False
        self.thread = None
    
    def start(self):
        """Start listening in background thread."""
        self.running = True
        self.thread = threading.Thread(target=self._listen_loop, daemon=True)
        self.thread.start()
    
    def stop(self):
        """Stop listening."""
        self.running = False
    
    def _listen_loop(self):
        """Main loop with auto-reconnect."""
        url = f"https://aurum-os-admin.vercel.app/api/nexus/stream?key={self.license_key}"
        
        while self.running:
            try:
                response = requests.get(url, stream=True, timeout=30)
                client = sseclient.SSEClient(response)
                
                for event in client.events():
                    if not self.running:
                        break
                    
                    if event.event == "connected":
                        print(f"[SSE] Connected to server")
                    
                    elif event.event == "plan_change":
                        data = json.loads(event.data)
                        print(f"[SSE] Plan changed: {data['plan']}")
                        self.on_plan_change(data)
                    
                    elif event.event == "status_change":
                        data = json.loads(event.data)
                        print(f"[SSE] Status changed: {data['status']}")
                        self.on_status_change(data)
                    
                    elif event.event == "":
                        # Heartbeat comment — ignore
                        pass
            
            except Exception as e:
                print(f"[SSE] Connection lost: {e}")
            
            if self.running:
                print(f"[SSE] Reconnecting in 5 seconds...")
                time.sleep(5)


# ── USAGE ──────────────────────────────────────────────────

def handle_plan_change(data):
    """Called when admin changes plan."""
    new_plan = data["plan"]
    features = data["features"]
    expires = data["subscription_expires_at"]
    
    # Update local cache
    save_to_cache("plan", new_plan)
    save_to_cache("features", features)
    save_to_cache("expires_at", expires)
    
    # Apply features to UI
    for feature in FEATURES:
        if feature in features:
            enable_feature(feature)
        else:
            disable_feature(feature)
    
    # Show notification
    show_notification(f"Plan changed to {new_plan.upper()}! {len(features)} features available.")

def handle_status_change(data):
    """Called when license status changes."""
    status = data["status"]
    
    if status == "revoked":
        lock_software()
        show_notification("License revoked. Contact AurumOS support.", error=True)
    
    elif status == "active":
        unlock_software()
        show_notification("License activated.")


# Start listener
listener = LicenseEventListener(
    license_key=get_license_key(),
    on_plan_change=handle_plan_change,
    on_status_change=handle_status_change
)
listener.start()
```

### Event handling rules:

**plan_change event:**
1. Parse the new plan and features list
2. Save to local cache (for offline use)
3. Enable features that are in the new list
4. Disable features that are NOT in the new list
5. Show user notification with plan name
6. If features were removed (downgrade), redirect user away from locked modules

**status_change event:**
1. If `status === "revoked"` → lock software immediately, show error
2. If `status === "active"` → unlock software
3. Save status to local cache

**heartbeat (comment line):**
1. Ignore — it's just keeping the connection alive

### Reconnection rules:

- On disconnect, wait 5 seconds then reconnect
- On repeated failures, increase wait: 5s → 10s → 20s → 30s (max)
- On successful reconnect, reset wait to 5s
- NEVER give up reconnecting — keep trying forever
- On reconnect, re-fetch `/api/subscription/status` to sync state

### Threading:

- Run the listener in a **daemon thread** (dies when main app exits)
- Don't block the main UI thread
- Use locks if accessing shared state from multiple threads

### Dependencies:

```bash
pip install sseclient-py requests
```

### Critical rules:

1. NEVER stop listening — the listener runs for the entire app lifetime
2. NEVER block the UI thread — always run in background thread
3. ALWAYS reconnect on failure — network drops are normal
4. ALWAYS save events to local cache — for offline resilience
5. NEVER skip the `features` list — it defines exactly what's available
6. The `plan` field is the purchased tier, use it for display only
7. The `features` array is what actually controls feature access
