# Prompt: Fix Urgent-Message Receiving in Terminal Software

The server is PROVEN working (see Proof below). DO NOT touch the server.
Fix the desktop client so `urgent_message` events render in the inbox.

---

## Prompt

You are fixing the AurumOS Retail POS terminal's urgent-message inbox.
The server delivers correctly — a `curl -N` on the SSE stream shows the
`urgent_message` event arriving live, but the terminal's notifications panel
never shows it. The bug is 100% client-side: connection, listener, or render.

### Proof (do not re-litigate this):

```
event: urgent_message
data: {"id":12,"key":"AR-CDCA-QPDU-LRSK-SNH5","body":"...","title":"MARKER 2315","sent_at":"...","priority":"warning"}
```

This block arrived on `GET /api/nexus/stream?key=AR-CDCA-QPDU-LRSK-SNH5`
within seconds of the admin clicking Send. Persist + broadcast + stream all work.

### Suspect #1 (most likely): wrong listener type

The server sends NAMED events (`event: urgent_message`, `event: connected`,
`event: plan_change`, ...) plus `: heartbeat` comments. A bare `onmessage`
handler NEVER fires for named events — you MUST use:

```javascript
const streamUrl = "https://aurum-os-admin.vercel.app/api/nexus/stream?key=" + LICENSE_KEY;
let es = new EventSource(streamUrl);

es.addEventListener('urgent_message', (event) => {
  let msg;
  try { msg = JSON.parse(event.data); }
  catch { console.error('[MSGS] bad JSON, dropped:', event.data); return; }
  handleUrgentMessage(msg);
});

es.onerror = (err) => {
  console.error('[MSGS] stream error, EventSource will retry:', err);
  // If closed for > 60s, fall back to polling catchUp() every 5 min.
};
```

Check your code NOW: if you only set `es.onmessage`, that is the bug.

### Suspect #2: over-strict validation dropping the event

Normalize defensively — never drop on type technicalities:

```javascript
function handleUrgentMessage(raw) {
  const msg = {
    id: Number(raw.id),                                   // server sent "12" (string) before the fix, 12 (int) after — accept BOTH
    title: String(raw.title ?? '').slice(0, 120),
    body: String(raw.body ?? '').slice(0, 1000),
    priority: ['info','warning','critical'].includes(raw.priority) ? raw.priority : 'info',
    sent_at: raw.sent_at || new Date().toISOString(),
  };
  if (!Number.isFinite(msg.id) || !msg.title || !msg.body) {
    console.error('[MSGS] invalid payload, dropped:', raw); return;
  }
  if (seenIds.has(msg.id)) return;                        // dedupe: 'all' arrives twice (global + per-key)
  seenIds.add(msg.id);
  storeMessage(msg);                                      // persist locally (SQLite/localStorage), unread = true
  renderInbox();                                          // re-render panel, badge = unread count
  toastByPriority(msg);                                   // critical → blocking modal; warning/info → toast
}
```

### Suspect #3: stream never connected in the app

- The stream URL must use the ADMIN domain + the terminal's OWN license key,
  uppercase, trimmed: `.../api/nexus/stream?key=AU-XXXX-...`.
- Open it at app startup and keep it open for the session. Log every
  `connected` event and every `onerror` — if you have no such logs, add them.
- Do NOT share one EventSource across license keys.

### Suspect #4: catch-up missing (offline / restart case)

On startup AND on reconnect, merge missed messages:

```javascript
async function catchUp() {
  try {
    const res = await fetch("https://aurum-os-admin.vercel.app/api/messages?key=" + LICENSE_KEY + "&limit=30");
    const { ok, messages } = await res.json();
    if (!ok) return;
    for (const m of messages) handleUrgentMessage(m);     // same handler → dedupe free
  } catch { /* silent: SSE is the primary path */ }
}
```

The endpoint needs NO admin session, is CORS-open, and 404s unknown keys.

### Rules:

- NEVER gate rendering on `msg.key === MY_KEY` for display — the server
  already filtered by channel; just render what arrives on your stream.
- NEVER lock billing/stock for any message, even `critical` (modal only).
- ALWAYS render title/body as PLAIN TEXT (no HTML injection).
- ALWAYS persist inbox + read state locally; keep last 100, prune older.
- The old "No new messages from AurumOS" ghost boxes (empty-state rendering
  over a non-empty list) are a separate bug — also fix: show empty-state
  IFF messages.length === 0 AND fetch completed.

### Acceptance (repeat with admin, report all):

1. Admin sends "MARKER <time>" to your key → appears in inbox ≤ 5s, badge +1.
2. Go offline → admin sends another → reconnect → appears via catch-up.
3. Admin sends to ALL → appears EXACTLY once.
4. Admin sends to ANOTHER shop → never appears in yours.
5. Report: PASS/FAIL per item + the console log lines (`[MSGS]...`) for each.

### Addendum: message retraction (admin can delete sent messages)

The admin dashboard now lets the sender delete a message (`✕` per message,
"Clear all" for everything). Deletion broadcasts retract events on the SAME
stream — implement both listeners:

```javascript
// Single message deleted by admin → remove it live.
es.addEventListener('message_retract', (event) => {
  const { id } = JSON.parse(event.data);   // { id: number, retracted_at: ISO, key?: string }
  const nid = Number(id);
  delete storedMessages[nid];
  seenIds.delete(nid);
  renderInbox();                            // badge = unread count (decrements)
});

// Admin cleared ALL messages → drop every AurumOS admin message.
es.addEventListener('message_retract_all', () => {
  storedMessages = {};
  renderInbox();
});
```

And on every `catchUp()`, reconcile instead of only merging: drop any locally
stored admin message whose numeric id is NOT in the server list (it was
deleted while you were offline). Shop-local alerts (gold rate etc.) are
untouched — only touch entries that came from `urgent_message`.
