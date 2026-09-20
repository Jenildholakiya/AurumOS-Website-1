# Prompt: Test Urgent Messages End-to-End (Software Side)

Paste this to your desktop-software developer/AI AFTER the server fix is
deployed to https://aurum-os-admin.vercel.app. DO NOT touch the server —
verify from the terminal side only.

---

## Prompt

You are testing the AurumOS urgent-message pipeline end-to-end. The server fix
is deployed. Your job is to PROVE each stage works from a real terminal, using
a REAL license key (replace `AU-REAL-KEY-HERE` with a key from the dashboard).

Base: `https://aurum-os-admin.vercel.app`. All calls must work WITHOUT an
admin session (the terminal has none).

### Test 1 — CORS preflight (must pass, no login):

```bash
curl -i "https://aurum-os-admin.vercel.app/api/messages?key=AU-REAL-KEY-HERE" | grep -i "access-control-allow-origin"
```

PASS = a line `access-control-allow-origin: *` is present.
FAIL = missing header, 307 redirect, or HTML login page → STOP, report to server team.

### Test 2 — Catch-up fetch (must pass, no login):

```bash
curl "https://aurum-os-admin.vercel.app/api/messages?key=AU-REAL-KEY-HERE&limit=30"
```

PASS = `{"ok":true,"messages":[...]}` — newest first, max 30 items, and EVERY
item satisfies: `target_mode === "all"` OR `target_keys` includes your key
(uppercase). FAIL = 401/307/HTML, or messages for other keys leak in.

### Test 3 — Live SSE (two terminals):

Terminal A (leave running):
```bash
curl -N "https://aurum-os-admin.vercel.app/api/nexus/stream?key=AU-REAL-KEY-HERE"
```

Then ask the admin to send an urgent message to YOUR shop from
`/messages` (or to ALL clients). In Terminal A you must see a block:

```
event: urgent_message
data: {"id":...,"title":"...","body":"...","priority":"info|warning|critical","sent_at":"...","key":"AU-REAL-KEY-HERE"}
```

(`"broadcast":"all"` appears instead of `"key"` for all-client sends.)
PASS = block arrives within ~5 seconds of the admin clicking Send.
FAIL = nothing arrives → report to server team with timestamps.

### Test 4 — Client behavior (in the software itself):

1. With the software RUNNING, have the admin send a `critical` message to your
   key → a BLOCKING modal with title + body + Acknowledge button must appear.
   Inbox bell badge must increment by 1.
2. Restart the software OFFLINE (disconnect network), have the admin send an
   `info` message to your key, reconnect → the message must appear via the
   `GET /api/messages?key=...` catch-up (Test 2) even though SSE was down.
3. Send the same message to ALL → confirm it appears EXACTLY ONCE in the inbox
   (server fans out on global + per-key channels; dedupe by `msg.id`).

### Test 5 — Negative checks:

- A message sent to ANOTHER shop's key must NEVER appear in your inbox
  (neither live nor via catch-up).
- A message must NEVER lock billing/stock — even `critical` is informational.
- Title/body render as PLAIN TEXT (no HTML execution).

### Report format:

For each test: PASS/FAIL + the exact command + first 5 lines of output (or the
timestamp of Send vs Receive for Test 3). On any FAIL, also include the HTTP
status code and whether the body was JSON or HTML.
