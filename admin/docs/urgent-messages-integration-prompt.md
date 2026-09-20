# Prompt: Urgent Messages — Admin → Jeweller Terminal

Use this prompt when building the AurumOS ERP client software's urgent-message
inbox (messages sent from the admin dashboard's `/messages` page).

---

## Prompt

You are building the AurumOS ERP desktop application's urgent-message system.
The admin dashboard (Next.js) is the source of truth. Your job is to implement
the CLIENT-SIDE receiving + display. DO NOT modify the server.

### What exists on the server (DO NOT modify):

- Admin composes at `/messages`: title (max 120), body (max 1000),
  priority `info | warning | critical`, targets = one / many / all clients.
- `POST /api/messages` (admin only) persists + broadcasts.
- `GET /api/messages` returns recent history: `{ ok, messages: [{ id, title, body, priority, target_mode, target_keys, target_count, created_at }] }`.
- Delivery is SSE on the EXISTING stream — no new connection needed:
  `GET /api/nexus/stream?key=<LICENSE_KEY>` (reconnect with exponential backoff, max 30s).

### SSE event format (what you receive):

```
event: urgent_message
data: {
  "id": 12,
  "title": "Urgent: keep terminal online tonight",
  "body": "A critical update is required...",
  "priority": "info|warning|critical",
  "sent_at": "2026-09-06T12:00:00.000Z",
  "key": "AU-XXXX-XXXX-XXXX-XXXX",   // present on per-key delivery
  "broadcast": "all"                 // present instead when sent to ALL
}
```

- Targeted send → event arrives on that license-key's channel only.
- "All clients" send → event arrives on the `*` global channel AND per-key.
- Your stream already subscribes to both (key channel + `*`), so just add the listener.

### Your task:

1. **Listen** — on the existing `EventSource`, add:
   ```javascript
   eventSource.addEventListener('urgent_message', (event) => {
     const msg = JSON.parse(event.data); // { id, title, body, priority, sent_at, ... }
     if (seenIds.has(msg.id)) return;    // deduplicate (global + per-key fan-out can double-deliver)
     seenIds.add(msg.id);
     storeMessage(msg);                  // persist locally (SQLite/localStorage)
     displayMessage(msg);                // UI by priority (below)
   });
   ```

2. **Display by priority** (must be distinct):
   - `critical` → BLOCKING modal: red accent, title + body, single "Acknowledge" button.
     Play alert sound. Do NOT auto-dismiss. Badge count increments until acknowledged.
     Never block an in-progress bill save — show after the transaction commits.
   - `warning` → gold toast/banner, auto-dismiss after 15s, plus inbox entry + badge.
   - `info` → subtle toast, auto-dismiss after 8s, plus inbox entry + badge.

3. **Inbox** — a bell icon in the header with unread count:
   - List sorted newest-first: priority dot, title, body, received time (`sent_at`).
   - Unread → read on open/click. Persist read state locally across restarts.
   - "Mark all read" button. Keep last 100 messages; prune older.

4. **Missed messages (offline)** — SSE events expire on the server after ~5 min,
   so on reconnect / startup:
   - Fetch `GET /api/messages`, filter to what applies to THIS terminal:
     `m.target_mode === 'all' || m.target_keys.includes(MY_KEY_UPPERCASE)`.
   - Insert any `id` not already stored. Cap at 30. Fail silently on network error.

5. **Polling fallback** — if SSE is disconnected > 60s, poll `GET /api/messages`
   every 5 minutes with the same filter until SSE recovers.

### Critical rules:

- NEVER lock billing/stock features because of a message — even `critical` is
  informational; only `status_change: revoked/expired` locks the software.
- ALWAYS deduplicate by `msg.id` — "all" broadcasts arrive twice (global + per-key).
- ALWAYS normalize the license key (`trim().toUpperCase()`) before comparing
  with `target_keys`.
- ALWAYS persist messages + read state locally — the server keeps ~30 recent only.
- ALWAYS show the received date/time in `en-IN` format (day month, hh:mm).
- NEVER auto-mark `critical` as read — only the Acknowledge click clears it.
- Escape title/body as plain text (no HTML render) — admin input is plain text.
