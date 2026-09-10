# AurumOS - API Documentation

## 1. Overview

AurumOS exposes three layers of API:

1. **Remote Server API** - Vercel-hosted Next.js endpoints for license/subscription management
2. **LAN Sync API** - Peer-to-peer HTTP endpoints for multi-PC data synchronization
3. **pywebview Bridge API** - Python-to-JavaScript bridge for the desktop UI

---

## 2. Remote Server API

**Base URL**: `https://aurum-os-admin.vercel.app`

### 2.1 POST /api/check

Validates a license key against a machine ID.

**Request**:
```json
{
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Response (200 OK)**:
```json
{
  "valid": true,
  "status": "active",
  "plan": "enterprise",
  "expires": "2026-12-31T23:59:59Z"
}
```

**Response (401 Unauthorized)**:
```json
{
  "valid": false,
  "error": "Invalid license key"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | License key (format: `AU-XXXX-XXXX-XXXX-XXXX`) |
| `machine_id` | string | UUID based on MAC address |
| `valid` | boolean | Whether the key is valid |
| `status` | string | `"active"`, `"expired"`, `"revoked"` |
| `plan` | string | `"lite"`, `"pro"`, or `"enterprise"` |
| `expires` | string | ISO 8601 expiration timestamp |

---

### 2.2 POST /api/subscription/status

Returns the current subscription state for a machine.

**Request**:
```json
{
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Response (200 OK)**:
```json
{
  "plan": "pro",
  "features": ["billing", "stock", "reports", "scale", "karigar", "accounting"],
  "status": "active",
  "expires": "2026-12-31T23:59:59Z",
  "daily_remaining": 245
}
```

---

### 2.3 POST /api/subscription/check

Alternative subscription check endpoint.

**Request**:
```json
{
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Response**: Same as `/api/subscription/status`.

---

### 2.4 POST /api/subscription/renew

Renews a subscription.

**Request**:
```json
{
  "key": "AU-XXXX-XXXX-XXXX-XXXX",
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "plan": "enterprise"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "new_expires": "2027-08-30T23:59:59Z",
  "plan": "enterprise"
}
```

---

### 2.5 GET /api/subscription/plans

Returns available subscription plans.

**Response (200 OK)**:
```json
{
  "plans": [
    {
      "id": "lite",
      "name": "Lite",
      "price": 3000,
      "currency": "INR",
      "billing_cycle": "yearly",
      "features": ["billing", "stock", "reports", "scale", "basic_export", "backup", "auto_update", "gst_reports", "low_stock_alert", "multi_printer"]
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 7000,
      "currency": "INR",
      "billing_cycle": "yearly",
      "features": ["billing", "stock", "reports", "scale", "karigar", "accounting", "analytics", "katti", "client_ledger", "cash_bank", "chart_of_accounts", "year_close", "bulk_print", "custom_reports", "data_export", "multi_user", "role_permissions", "inventory_valuation", "profit_loss", "balance_sheet"]
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "price": 15000,
      "currency": "INR",
      "billing_cycle": "yearly",
      "features": ["all_pro_features", "lan_sync", "cloud_backup", "ai_assistant", "fleet_management", "priority_support", "custom_branding", "api_access", "audit_trail", "bastion_security", "auto_suspension", "forensic_reports", "multi_shop", "network_mode", "brain_client", "hardware_fingerprint", "one_time_unlock", "sse_events", "health_dashboard", "self_learning"]
    }
  ]
}
```

---

### 2.6 POST /api/poll

Lightweight reactivation poll (used to check if a revoked license has been reactivated).

**Request**:
```json
{
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Response (200 OK)**:
```json
{
  "active": true
}
```

---

### 2.7 GET /api/nexus/stream

Server-Sent Events (SSE) stream for real-time license events.

**Headers**:
```
Accept: text/event-stream
Cache-Control: no-cache
```

**Event Types**:
| Event | Data | Description |
|-------|------|-------------|
| `license_update` | `{status, plan, expires}` | License status changed |
| `license_revoke` | `{reason}` | License revoked |
| `license_activate` | `{plan, expires}` | License activated |
| `feature_toggle` | `{feature, enabled}` | Feature enabled/disabled |

**Example Stream**:
```
event: license_update
data: {"status":"active","plan":"enterprise","expires":"2026-12-31T23:59:59Z"}

event: feature_toggle
data: {"feature":"ai_assistant","enabled":true}
```

---

### 2.8 POST /api/bastion/events

Pushes health/security events to the dashboard.

**Request**:
```json
{
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "event_type": "db_tamper_detected",
  "severity": "critical",
  "details": {
    "table": "admin_creds",
    "hash_before": "abc123...",
    "hash_after": "def456..."
  },
  "timestamp": "2026-08-30T09:47:00Z"
}
```

**Response (200 OK)**:
```json
{
  "received": true
}
```

---

## 3. LAN Sync API

**Base URL**: `http://{host_ip}:58901`

### 3.1 GET /aurum-sync/ping

Peer identity check. Returns the host's device and shop information.

**Response (200 OK)**:
```json
{
  "device_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "shop_id": "SHOP-XXXXXXXX",
  "version": "1.0.2",
  "tables": ["stock_inventory", "sales_history", "clients_master", "credit_ledger"]
}
```

---

### 3.2 POST /aurum-sync/exchange

Bidirectional data exchange between peers.

**Request**:
```json
{
  "sender_device_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "sender_shop_id": "SHOP-XXXXXXXX",
  "versions": {
    "stock_inventory": 150,
    "sales_history": 89,
    "clients_master": 23
  },
  "data": {
    "stock_inventory": [
      {
        "local_id": 151,
        "tag_id": "TAG-001",
        "weight": 10.5,
        "touch": 916,
        "sync_version": 151
      }
    ]
  }
}
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "received": {
    "stock_inventory": 3,
    "sales_history": 1
  },
  "data": {
    "stock_inventory": [
      {
        "local_id": 200,
        "tag_id": "TAG-050",
        "weight": 5.2,
        "touch": 750,
        "sync_version": 200
      }
    ]
  }
}
```

**Sync Tables**: `stock_inventory`, `sales_history`, `clients_master`, `credit_ledger`, `katti_vouchers`, `katti_voucher_items`, `uchak_inward_vouchers`, `uchak_inward_items`

---

### 3.3 POST /brain/register

Register a client node in network mode.

**Request**:
```json
{
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "hostname": "WORKSTATION-02",
  "ip_address": "192.168.1.101"
}
```

**Response (200 OK)**:
```json
{
  "registered": true,
  "node_id": "NODE-002",
  "access_level": "standard"
}
```

---

### 3.4 POST /brain/check-access

Check access permissions for a network node.

**Request**:
```json
{
  "machine_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "action": "create_bill"
}
```

**Response (200 OK)**:
```json
{
  "allowed": true,
  "permissions": ["billing", "stock", "reports"]
}
```

---

### 3.5 GET /api/constellation/stream_listen

SSE stream for network nodes to receive real-time updates from the host.

**Event Types**:
| Event | Description |
|-------|-------------|
| `data_update` | New data available for sync |
| `config_change` | Configuration changed on host |
| `alert` | System alert or notification |

---

## 4. pywebview Bridge API

The `AurumAPI` class in `main.py` exposes ~80+ methods to the frontend JavaScript via `window.pywebview.api.*`.

### 4.1 Authentication

#### verify_key(key)
Validates a license key locally.

**Parameters**:
- `key` (string): License key

**Returns**: `bool`

---

#### check_license()
Checks current license status against server.

**Returns**: `object` - `{valid, plan, expires, status}`

---

#### check_license_revoked()
Checks if the current license has been revoked.

**Returns**: `bool`

---

### 4.2 Navigation & Session

#### navigate(page)
Navigates to a specific page.

**Parameters**:
- `page` (string): Page name (e.g., `"dashboard"`, `"billing"`, `"inventory"`)

---

#### get_session()
Returns the current session information.

**Returns**: `object` - `{user, role, permissions, login_time}`

---

#### get_dynamic_greeting()
Returns a time-based greeting message.

**Returns**: `string`

---

### 4.3 Printing

#### print_tag(tag_data)
Prints a single tag.

**Parameters**:
- `tag_data` (object): `{tag_id, product_name, weight, touch, huid, design_code}`

**Returns**: `bool`

---

#### print_multiple_tags(tags_array)
Prints multiple tags in batch.

**Parameters**:
- `tags_array` (array): Array of tag data objects

**Returns**: `bool`

---

#### get_tag_preview(tag_data)
Returns a preview image of a tag.

**Parameters**:
- `tag_data` (object): Tag data object

**Returns**: `string` - Base64 encoded image

---

### 4.4 AI Support

#### ai_ask(question)
Sends a question to the AI assistant.

**Parameters**:
- `question` (string): User's question

**Returns**: `string` - AI response

---

#### ai_get_config()
Returns the AI configuration.

**Returns**: `object` - `{api_key_set, model, provider}`

---

#### ai_save_config(config)
Saves AI configuration.

**Parameters**:
- `config` (object): `{api_key, model, provider}`

**Returns**: `bool`

---

### 4.5 Subscription Management

#### subscription_startup_check()
Performs subscription validation on startup.

**Returns**: `object` - `{valid, plan, features, expires}`

---

#### subscription_sync()
Forces a subscription state sync with the server.

**Returns**: `object` - Updated subscription state

---

#### renew_subscription(plan)
Initiates subscription renewal.

**Parameters**:
- `plan` (string): Plan ID (`"lite"`, `"pro"`, `"enterprise"`)

**Returns**: `object` - `{success, new_expires}`

---

#### get_plans()
Returns available subscription plans.

**Returns**: `array` - Plan details

---

#### get_live_command_metrics()
Returns real-time usage metrics.

**Returns**: `object` - `{bills_today, items_sold, revenue_today}`

---

### 4.6 Inventory CRUD

#### add_stock_item(item)
Adds a new stock item.

**Parameters**:
- `item` (object): `{tag_id, product_code, weight, touch, huid, design_code, pieces, category}`

**Returns**: `int` - New item ID

---

#### update_stock_item(item_id, item)
Updates an existing stock item.

**Parameters**:
- `item_id` (int): Item ID
- `item` (object): Updated fields

**Returns**: `bool`

---

#### delete_stock_item(item_id)
Deletes a stock item.

**Parameters**:
- `item_id` (int): Item ID

**Returns**: `bool`

---

#### get_stock_items(filters)
Returns stock items with optional filters.

**Parameters**:
- `filters` (object): `{category, touch, design_code, min_weight, max_weight}`

**Returns**: `array` - Stock items

---

#### get_stock_stats()
Returns inventory statistics.

**Returns**: `object` - `{total_items, total_weight, total_value, by_category}`

---

### 4.7 Sales / Billing

#### create_bill(bill_data)
Creates a new sales bill.

**Parameters**:
- `bill_data` (object): `{client_id, items, discount, tax, payment_method}`

**Returns**: `int` - Bill ID (vch_id)

---

#### get_sales_history(filters)
Returns sales history with optional filters.

**Parameters**:
- `filters` (object): `{date_from, date_to, client_id, min_amount}`

**Returns**: `array` - Sales records

---

#### get_bill(bill_id)
Returns a specific bill.

**Parameters**:
- `bill_id` (int): Bill ID

**Returns**: `object` - Full bill details

---

### 4.8 Client Ledger

#### add_client(client_data)
Adds a new client.

**Parameters**:
- `client_data` (object): `{name, phone, metal_limit, cash_limit}`

**Returns**: `int` - Client ID

---

#### add_ledger_entry(entry)
Adds a ledger entry for a client.

**Parameters**:
- `entry` (object): `{client_id, type, metal_weight, metal_touch, cash_amount, description}`

**Returns**: `int` - Entry ID

---

#### get_client_ledger(client_id)
Returns the full ledger for a client.

**Parameters**:
- `client_id` (int): Client ID

**Returns**: `object` - `{client, entries, metal_balance, cash_balance}`

---

### 4.9 Weighing Scale

#### scale_start(port, baud_rate)
Starts reading from the weighing scale.

**Parameters**:
- `port` (string): COM port (e.g., `"COM3"`)
- `baud_rate` (int): Baud rate (default: 9600)

**Returns**: `bool`

---

#### scale_stop()
Stops the scale reader.

**Returns**: `bool`

---

#### scale_list_ports()
Lists available COM ports.

**Returns**: `array` - Port names

---

### 4.10 Bastion Security

#### bastion_get_status()
Returns the Bastion AI security status.

**Returns**: `object` - `{threads_active, threats_detected, last_scan, escalation_level}`

---

#### bastion_unlock(unlock_code)
Unlocks the system after auto-suspension.

**Parameters**:
- `unlock_code` (string): One-time unlock code

**Returns**: `bool`

---

### 4.11 Settings

#### get_business_profile()
Returns the business profile.

**Returns**: `object` - `{biz_name, phone, address, gstin, owner_name}`

---

#### update_business_profile(profile)
Updates the business profile.

**Parameters**:
- `profile` (object): Business profile fields

**Returns**: `bool`

---

#### get_printer_settings()
Returns printer configuration.

**Returns**: `object` - `{printer_name, paper_size, margins}`

---

#### update_printer_settings(settings)
Updates printer configuration.

**Parameters**:
- `settings` (object): Printer settings

**Returns**: `bool`

---

## 5. Error Handling

### 5.1 HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request (invalid parameters) |
| `401` | Unauthorized (invalid/revoked license) |
| `404` | Not Found |
| `500` | Internal Server Error |

### 5.2 Error Response Format

```json
{
  "error": true,
  "code": "INVALID_KEY",
  "message": "The provided license key is not valid"
}
```

### 5.3 pywebview Bridge Errors

When a bridge method fails, it returns:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 6. Rate Limiting

- **Remote API**: 100 requests per minute per machine
- **LAN Sync**: No rate limiting (local network)
- **SSE Stream**: Single persistent connection per client

---

## 7. Versioning

The API follows the application version. Major API changes are indicated by version bumps in `version.json`.

Current API version: **1.0.2**
