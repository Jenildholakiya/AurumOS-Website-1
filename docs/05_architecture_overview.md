# AurumOS - Architecture Overview

## 1. System Architecture

AurumOS follows a **layered desktop application architecture** with a Python backend, a web-based frontend rendered via native WebView, and a local SQLite database.

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  pywebview (EdgeChromium / WebView2)                │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  HTML/CSS/JS Frontend (58 pages)            │    │    │
│  │  │  - Dashboard, Billing, Inventory, etc.      │    │    │
│  │  │  - boot.js (API bridge shim)                │    │    │
│  │  │  - sidebar.js/css (navigation)              │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      BRIDGE LAYER                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  window.pywebview.api.* (JavaScript → Python)      │    │
│  │  ~80+ methods: auth, CRUD, printing, scale, AI     │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                     APPLICATION LAYER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ AurumAPI │ │ SyncEng  │ │ SubMgr   │ │ Updater  │      │
│  │ (main.py)│ │ (sync)   │ │ (subs)   │ │ (updater)│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ BastionAI│ │ TagEngine│ │ NetDisc  │ │ SSEListnr│      │
│  │ (bastion)│ │ (tags)   │ │ (network)│ │ (sse)    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│                       DATA LAYER                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  SQLite (WAL mode) - aurum_local.db                │    │
│  │  DBManager: CRUD, sync, config, auditing            │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Vercel   │ │ GitHub   │ │ Groq API │                   │
│  │ (License)│ │ (Updates)│ │ (AI)     │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Entry Point (`main.py`)

The `AurumAPI` class is the central controller:
- Initializes pywebview with the EdgeChromium renderer
- Exposes Python methods to JavaScript via the bridge
- Manages application lifecycle (startup, shutdown, updates)
- Coordinates between all subsystems

### 2.2 Core Modules (`core/`)

| Module | Responsibility |
|--------|---------------|
| `tag_engine.py` | Generates tag images (Pillow) with QR codes for thermal printing |
| `ai_support.py` | Groq API integration (LLaMA 3.3 70B) for AI chat |
| `bastion_sync.py` | Bastion security synchronization logic |
| `io_safety.py` | Atomic file I/O (temp write + `os.replace()`) for crash safety |
| `security_lock.py` | Hardware ID generation (motherboard serial → SHA-256 hash) |
| `print_bridge.py` | Bridge between TagFactory and the main application |
| `nl_report.py` | Natural language report generation |

### 2.3 Database Layer (`database/`)

| Module | Responsibility |
|--------|---------------|
| `db_manager.py` | SQLite schema, CRUD operations, sync, config, auditing |
| `bastion_ai.py` | 5-thread background security monitor |
| `bastion_report.py` | Forensic PDF report generator |
| `aurum_health.py` | Health dashboard provisioning |

### 2.4 Network Layer (`network/`)

| Module | Responsibility |
|--------|---------------|
| `discovery.py` | UDP broadcast beacon for LAN peer discovery |
| `brain_server.py` | HTTP server for host mode (port 58901) |
| `brain_client.py` | Client node logic for connecting to host |
| `brain_guard.py` | Access control for network mode |
| `connection_store.py` | Connection persistence and peer tracking |
| `handshake.py` | Connection handshake protocol |
| `hardware_map.py` | Hardware identification for network nodes |

### 2.5 UI Layer (`ui/`)

58 HTML/CSS/JS pages organized by module:

| Directory | Pages |
|-----------|-------|
| Root | `login.html`, `dashboard.html`, `settings.html` |
| Billing | `billing.html`, `pos_billing.html` |
| Inventory | `inventory.html`, `stock_reports.html` |
| Karigar | `karigar.html`, `karigar_jobs.html` |
| Accounting | `cash_bank.html`, `chart_of_accounts.html`, `client_ledger.html` |
| Manufacturing | `katti_entry.html`, `uchak_entry.html` |
| Network | `network_manager.html` |
| Security | `bastion_keygen.html`, `revoked.html`, `expiry.html` |

JavaScript utilities:
- `boot.js` - Ensures pywebview API readiness before page load
- `sidebar.js/css` - Navigation sidebar
- `scale_widget.js` - Weighing scale UI widget
- `sse_stream.js` - Client-side SSE handler
- `subscription.js` - Subscription state management
- `ai_support.js` - AI chat interface
- `bastion_guard.js` - Security guard client-side logic

---

## 3. Data Flow Architecture

### 3.1 License Validation Flow

```
User launches AurumOS
        │
        ▼
┌─────────────────┐
│ Read license key │
│ from .license_key│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Compute machine  │────▶│ POST /api/check  │
│ ID (MAC-based)   │     │ {key, machine_id}│
└─────────────────┘     └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐            ┌──────▼──────┐
              │  Valid     │            │  Invalid     │
              │  → Dashboard│           │  → Revoked   │
              └───────────┘            │    screen    │
                                       └─────────────┘
```

### 3.2 LAN Sync Flow

```
PC A (Host)                    PC B (Client)
    │                              │
    │  UDP Broadcast (port 58902)  │
    │ ◀────────────────────────────│
    │                              │
    │  GET /aurum-sync/ping        │
    │ ◀────────────────────────────│
    │                              │
    │  POST /aurum-sync/exchange   │
    │ ────────────────────────────▶│
    │  {data, versions}            │
    │                              │
    │  Response {data, versions}   │
    │ ◀────────────────────────────│
    │                              │
    │  Local DB Merge              │
    │  (INSERT OR IGNORE)          │
```

### 3.3 Bastion Security Flow

```
BastionAI (5 daemon threads)
    │
    ├── DB Watchdog (30s interval)
    │   └── Hash table row counts → detect external edits
    │
    ├── Session Guard (60s interval)
    │   └── Validate registry session token
    │
    ├── Auto Healer (5min interval)
    │   └── Fix stale backups, WAL, logs, registry
    │
    ├── Pattern Learner (24h interval)
    │   └── Analyze 30-day event history
    │
    └── Alert Sender (5min interval)
        └── Queue → Gmail SMTP / Health Dashboard

Threat Escalation:
  DETECT → WARN (1st signal)
         → RESTRICT (2nd corroboration)
         → SUSPEND (3rd confirmation)
         → Generate forensic PDF
         → Await unlock key
```

---

## 4. Security Architecture

### 4.1 License System

- **Key Format**: `AU-XXXX-XXXX-XXXX-XXXX` (22 characters)
- **Encryption**: XOR cipher with machine ID as key
- **Storage**: Encrypted in `database/.license_key`
- **Validation**: Server-side via POST `/api/check`
- **Offline Grace**: 24-hour cached validation
- **Revocation**: Server-side + `.revoked` flag file + SSE real-time

### 4.2 Authentication

- **Password Hashing**: SHA-256 (stored in `admin_creds` table)
- **Session Tokens**: Generated at startup, stored in Windows registry
- **Lockout**: 5-minute lockout after 3 failed attempts
- **Role-Based Access**: Owner (full access) vs Staff (permission array)

### 4.3 Hardware Identity

- **Machine ID**: UUID derived from MAC address
- **Hardware Fingerprint**: SHA-256 hash of motherboard serial
- **Device Registry**: Permanent PC identity for LAN sync

### 4.4 Build Obfuscation

The build process (`build.py`) applies:
1. Python compilation → `.pyc`
2. Marshal serialization
3. zlib compression
4. XOR symmetric encryption
5. base85 encoding

Obfuscated files: `main.py`, `db_manager.py`, `tag_engine.py`, `updater.py`

---

## 5. Deployment Architecture

### 5.1 Single-PC Mode (Local)

```
┌─────────────────────────────┐
│         PC (Windows)         │
│  ┌─────────────────────────┐│
│  │      AurumOS.exe        ││
│  │  ┌───────────────────┐  ││
│  │  │ Python 3.12       │  ││
│  │  │ pywebview         │  ││
│  │  │ SQLite            │  ││
│  │  └───────────────────┘  ││
│  │  ┌───────────────────┐  ││
│  │  │ aurum_local.db    │  ││
│  │  └───────────────────┘  ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 5.2 Multi-PC Mode (LAN Sync)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PC A (Host) │    │   PC B       │    │   PC C       │
│  mode=server  │    │  mode=client │    │  mode=client │
│               │    │              │    │              │
│ Port 58901 ──┼────┼──▶           │    │              │
│ Port 58902 ──┼────┼──────▶       │    │              │
│               │    │              │    │              │
│ UDP Beacon ──┼────┼──────────────┼────┼──▶           │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 5.3 Network Mode (Brain/Client)

```
┌──────────────┐
│   Host Core   │
│ (Brain Server)│
│  Port 7272    │
└──────┬───────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
┌──────┐ ┌──────┐
│Node 1│ │Node 2│
│Client│ │Client│
└──────┘ └──────┘
```

---

## 6. Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Python | 3.12 |
| UI Framework | pywebview | Latest |
| Renderer | EdgeChromium (WebView2) | System |
| Frontend | Vanilla HTML/CSS/JS | ES6+ |
| Database | SQLite3 (WAL mode) | 3.x |
| Build | PyInstaller | ONEDIR |
| Obfuscation | XOR + marshal + zlib | Custom |
| Serial I/O | pyserial | Latest |
| Printing | pywin32 (win32print) | Latest |
| Imaging | Pillow (PIL) | Latest |
| QR Codes | qrcode | Latest |
| AI | Groq API (LLaMA 3.3 70B) | Latest |
| Crypto | cryptography (AES-GCM) | Latest |
| Hashing | hashlib (SHA-256, PBKDF2) | Stdlib |
| License Server | Next.js on Vercel | Latest |
| Auto-Update | GitHub Releases API | Latest |
| LAN Sync | UDP + HTTP (custom) | Custom |
| SSE | Server-Sent Events | Standard |
| .NET Interop | pythonnet (CLR) | Latest |

---

## 7. File Protection Strategy

| Protected | Method |
|-----------|--------|
| Source code | XOR encryption + marshal + zlib |
| License key | XOR encryption with machine ID |
| Session token | Windows registry + temp file |
| Database | SQLite WAL mode + auto-backup |
| Config | JSON file (not overwritten on update) |
| EXE integrity | Trusted hash verification |
| Build artifacts | Authenticode signing (optional) |

---

## 8. Scalability Considerations

| Dimension | Current Limit | Mitigation |
|-----------|---------------|------------|
| Concurrent users | 1 (single desktop) | Multi-PC via LAN sync |
| Database size | ~1GB (SQLite limit) | WAL mode + log rotation |
| Sync peers | ~10 PCs | UDP discovery + HTTP exchange |
| Tag generation | Batch printing | Pillow image caching |
| AI requests | Groq rate limits | Client-side caching |
| Storage | Local disk | Manual backup to external |
