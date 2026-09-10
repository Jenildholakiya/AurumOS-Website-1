# AurumOS - Database Schema

## 1. Overview

AurumOS uses **SQLite3** with WAL (Write-Ahead Logging) mode for local data storage. The database file is located at `database/aurum_local.db`.

### 1.1 Conventions

- **Primary Keys**: Auto-incrementing `id` columns
- **Sync Columns**: Syncable tables have `device_id`, `sync_version`, `local_id`
- **Timestamps**: ISO 8601 format strings
- **Booleans**: Integer (0/1)
- **JSON**: Stored as TEXT with `json.loads()`/`json.dumps()`
- **Soft Deletes**: Not used; records are permanently deleted

---

## 2. Tables

### 2.1 admin_creds

Staff accounts with authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Account ID |
| `username` | TEXT | UNIQUE NOT NULL | Login username |
| `password` | TEXT | NOT NULL | SHA-256 hashed password |
| `is_owner` | INTEGER | DEFAULT 0 | 1 = Owner (full access), 0 = Staff |
| `permissions` | TEXT | DEFAULT '[]' | JSON array of allowed modules |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `last_login` | TEXT | | Last login timestamp |

**Relationships**: Referenced by `login_log.user_id`, `audit_log.user_id`

---

### 2.2 business_profile

Shop information (single row).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Profile ID |
| `biz_name` | TEXT | NOT NULL | Business/shop name |
| `phone` | TEXT | | Primary phone number |
| `address` | TEXT | | Full business address |
| `gstin` | TEXT | | GST Identification Number |
| `owner_name` | TEXT | | Owner's full name |
| `logo_path` | TEXT | | Path to logo image |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TEXT | | Last update time |

---

### 2.3 categories

Product categories for inventory organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Category ID |
| `name` | TEXT | UNIQUE NOT NULL | Category name |
| `description` | TEXT | | Category description |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Relationships**: Referenced by `product_master.category_id`

---

### 2.4 touch_groups

Gold purity (touch) groups with wastage percentages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Group ID |
| `name` | TEXT | UNIQUE NOT NULL | Group name (e.g., "22K Gold") |
| `touch_value` | REAL | NOT NULL | Purity value (e.g., 916, 750) |
| `wastage_percent` | REAL | DEFAULT 0 | Wastage percentage |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Relationships**: Referenced by `product_master.touch_id`, `stock_inventory.touch`

---

### 2.5 product_master

Product catalog with pricing and specifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Product ID |
| `code` | TEXT | UNIQUE NOT NULL | Product code (e.g., "RING-001") |
| `name` | TEXT | NOT NULL | Product name |
| `category_id` | INTEGER | FOREIGN KEY → categories.id | Product category |
| `touch_id` | INTEGER | FOREIGN KEY → touch_groups.id | Touch/purity group |
| `wastage_percent` | REAL | DEFAULT 0 | Product-specific wastage |
| `making_charge` | REAL | DEFAULT 0 | Making charge per gram |
| `description` | TEXT | | Product description |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Relationships**: Referenced by `stock_inventory.product_code`

---

### 2.6 stock_inventory

Individual stock items with unique tag IDs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Inventory ID |
| `tag_id` | TEXT | UNIQUE NOT NULL | Unique tag identifier |
| `product_code` | TEXT | FOREIGN KEY → product_master.code | Product code |
| `weight` | REAL | NOT NULL | Weight in grams |
| `touch` | REAL | NOT NULL | Purity/touch value |
| `huid` | TEXT | | Hallmark Unique Identification |
| `pieces` | INTEGER | DEFAULT 1 | Number of pieces |
| `design_code` | TEXT | | Design code |
| `category` | TEXT | | Category name (denormalized) |
| `status` | TEXT | DEFAULT 'in_stock' | `in_stock`, `sold`, `reserved` |
| `purchase_rate` | REAL | DEFAULT 0 | Purchase rate per gram |
| `selling_rate` | REAL | DEFAULT 0 | Selling rate per gram |
| `location` | TEXT | | Storage location |
| `notes` | TEXT | | Additional notes |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version cursor |
| `local_id` | INTEGER | | Local ID on source device |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TEXT | | Last update time |

**Relationships**: References `product_master.code`, used by `sales_history` items

**Sync**: Yes (multi-PC sync enabled)

---

### 2.7 sales_history

Sales bills with line items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Bill ID |
| `vch_id` | TEXT | UNIQUE NOT NULL | Voucher/bill number |
| `client_id` | INTEGER | FOREIGN KEY → clients_master.id | Customer ID |
| `items` | TEXT | NOT NULL | JSON array of bill items |
| `total_fine` | REAL | DEFAULT 0 | Total fine weight |
| `total_amount` | REAL | DEFAULT 0 | Total bill amount |
| `discount` | REAL | DEFAULT 0 | Discount amount |
| `tax` | REAL | DEFAULT 0 | Tax amount |
| `grand_total` | REAL | DEFAULT 0 | Final amount after discount/tax |
| `payment_method` | TEXT | DEFAULT 'cash' | `cash`, `upi`, `card`, `credit` |
| `payment_status` | TEXT | DEFAULT 'paid' | `paid`, `pending`, `partial` |
| `bill_date` | TEXT | DEFAULT CURRENT_TIMESTAMP | Bill date |
| `notes` | TEXT | | Bill notes |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version cursor |
| `local_id` | INTEGER | | Local ID on source device |

**Bill Items JSON Structure**:
```json
[
  {
    "tag_id": "TAG-001",
    "product_code": "RING-001",
    "weight": 10.5,
    "touch": 916,
    "fine": 9.618,
    "rate": 5500,
    "amount": 52899,
    "quantity": 1
  }
]
```

**Relationships**: References `clients_master.id`, items reference `stock_inventory.tag_id`

**Sync**: Yes

---

### 2.8 katti_vouchers

Manufacturing job vouchers for karigars.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Voucher ID |
| `vch_id` | TEXT | UNIQUE NOT NULL | Voucher number |
| `karigar_id` | INTEGER | FOREIGN KEY → karigar table | Artisan ID |
| `type` | TEXT | NOT NULL | `inward`, `outward` |
| `total_weight` | REAL | DEFAULT 0 | Total weight |
| `total_items` | INTEGER | DEFAULT 0 | Total item count |
| `status` | TEXT | DEFAULT 'open' | `open`, `closed`, `cancelled` |
| `voucher_date` | TEXT | DEFAULT CURRENT_TIMESTAMP | Voucher date |
| `notes` | TEXT | | Voucher notes |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version |
| `local_id` | INTEGER | | Local ID on source device |

**Relationships**: Has many `katti_voucher_items`

**Sync**: Yes

---

### 2.9 katti_voucher_items

Individual items within katti vouchers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Item ID |
| `voucher_id` | INTEGER | FOREIGN KEY → katti_vouchers.id | Parent voucher |
| `tag_id` | TEXT | | Tag identifier |
| `product_code` | TEXT | | Product code |
| `weight` | REAL | NOT NULL | Weight in grams |
| `touch` | REAL | NOT NULL | Purity value |
| `pieces` | INTEGER | DEFAULT 1 | Number of pieces |
| `design_code` | TEXT | | Design code |
| `notes` | TEXT | | Item notes |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version |
| `local_id` | INTEGER | | Local ID on source device |

**Relationships**: Belongs to `katti_vouchers`

**Sync**: Yes

---

### 2.10 clients_master

Customer accounts with balance limits.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Client ID |
| `name` | TEXT | NOT NULL | Client name |
| `phone` | TEXT | | Phone number |
| `email` | TEXT | | Email address |
| `address` | TEXT | | Address |
| `metal_limit` | REAL | DEFAULT 0 | Maximum metal credit allowed |
| `cash_limit` | REAL | DEFAULT 0 | Maximum cash credit allowed |
| `metal_balance` | REAL | DEFAULT 0 | Current metal balance |
| `cash_balance` | REAL | DEFAULT 0 | Current cash balance |
| `notes` | TEXT | | Additional notes |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version |
| `local_id` | INTEGER | | Local ID on source device |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Relationships**: Referenced by `sales_history.client_id`, `credit_ledger.client_id`

**Sync**: Yes

---

### 2.11 credit_ledger

Double-entry credit ledger for metal and cash transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Entry ID |
| `client_id` | INTEGER | FOREIGN KEY → clients_master.id | Client ID |
| `type` | TEXT | NOT NULL | `metal_dr`, `metal_cr`, `cash_dr`, `cash_cr` |
| `metal_weight` | REAL | DEFAULT 0 | Metal weight (grams) |
| `metal_touch` | REAL | DEFAULT 0 | Metal purity |
| `cash_amount` | REAL | DEFAULT 0 | Cash amount |
| `description` | TEXT | | Transaction description |
| `reference_id` | TEXT | | Reference to related bill/voucher |
| `entry_date` | TEXT | DEFAULT CURRENT_TIMESTAMP | Entry date |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version |
| `local_id` | INTEGER | | Local ID on source device |

**Transaction Types**:
| Type | Meaning | Effect |
|------|---------|--------|
| `metal_dr` | Metal Debit (client owes metal) | Increases client metal debt |
| `metal_cr` | Metal Credit (client paid metal) | Decreases client metal debt |
| `cash_dr` | Cash Debit (client paid cash) | Decreases client cash debt |
| `cash_cr` | Cash Credit (client owes cash) | Increases client cash debt |

**Relationships**: References `clients_master.id`

**Sync**: Yes

---

### 2.12 uchak_inward_vouchers

Small manufacturing (uchak) inward vouchers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Voucher ID |
| `vch_id` | TEXT | UNIQUE NOT NULL | Voucher number |
| `karigar_id` | INTEGER | | Artisan ID |
| `total_weight` | REAL | DEFAULT 0 | Total weight |
| `total_items` | INTEGER | DEFAULT 0 | Total items |
| `status` | TEXT | DEFAULT 'open' | Status |
| `voucher_date` | TEXT | DEFAULT CURRENT_TIMESTAMP | Date |
| `notes` | TEXT | | Notes |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version |
| `local_id` | INTEGER | | Local ID |

**Relationships**: Has many `uchak_inward_items`

**Sync**: Yes

---

### 2.13 uchak_inward_items

Items in uchak inward vouchers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Item ID |
| `voucher_id` | INTEGER | FOREIGN KEY → uchak_inward_vouchers.id | Parent voucher |
| `tag_id` | TEXT | | Tag identifier |
| `product_code` | TEXT | | Product code |
| `weight` | REAL | NOT NULL | Weight |
| `touch` | REAL | NOT NULL | Purity |
| `pieces` | INTEGER | DEFAULT 1 | Pieces |
| `design_code` | TEXT | | Design code |
| `notes` | TEXT | | Notes |
| `device_id` | TEXT | | Sync device identifier |
| `sync_version` | INTEGER | DEFAULT 0 | Sync version |
| `local_id` | INTEGER | | Local ID |

**Sync**: Yes

---

### 2.14 login_log

Login audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Log ID |
| `user_id` | INTEGER | FOREIGN KEY → admin_creds.id | User who logged in |
| `username` | TEXT | NOT NULL | Username |
| `role` | TEXT | NOT NULL | `owner` or `staff` |
| `login_time` | TEXT | DEFAULT CURRENT_TIMESTAMP | Login timestamp |
| `ip_address` | TEXT | | Login IP (if network) |
| `status` | TEXT | DEFAULT 'success' | `success` or `failed` |

---

### 2.15 audit_log

Action audit trail for all significant operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Log ID |
| `timestamp` | TEXT | DEFAULT CURRENT_TIMESTAMP | Action timestamp |
| `user_id` | INTEGER | FOREIGN KEY → admin_creds.id | User who performed action |
| `username` | TEXT | NOT NULL | Username |
| `action` | TEXT | NOT NULL | Action performed |
| `detail` | TEXT | | Detailed description |
| `category` | TEXT | | Action category |
| `ip_address` | TEXT | | IP address |

**Categories**: `auth`, `billing`, `inventory`, `settings`, `security`, `sync`, `system`

---

### 2.16 app_config

Key-value configuration store.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Config ID |
| `key` | TEXT | UNIQUE NOT NULL | Configuration key |
| `value` | TEXT | NOT NULL | Configuration value (JSON or string) |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Common Keys**:
| Key | Description |
|-----|-------------|
| `setup_complete` | Whether initial setup is done (`"true"`/`"false"`) |
| `current_plan` | Active subscription plan |
| `features_enabled` | JSON array of enabled features |
| `license_key` | Encrypted license key |
| `machine_id` | Machine identifier UUID |

---

### 2.17 bastion_events

Security events logged by the Bastion AI system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Event ID |
| `timestamp` | TEXT | DEFAULT CURRENT_TIMESTAMP | Event timestamp |
| `event_type` | TEXT | NOT NULL | Event type |
| `severity` | TEXT | NOT NULL | `info`, `warn`, `critical` |
| `details` | TEXT | | JSON event details |
| `source` | TEXT | | Source thread/module |
| `resolved` | INTEGER | DEFAULT 0 | Whether event was resolved |

**Event Types**: `db_tamper_detected`, `session_invalid`, `fingerprint_mismatch`, `login_anomaly`, `backup_created`, `auto_healed`, `suspension_triggered`, `unlock_success`

---

### 2.18 bastion_alerts

Queued email alerts for delivery.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Alert ID |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Alert creation time |
| `subject` | TEXT | NOT NULL | Email subject |
| `body` | TEXT | NOT NULL | Email body |
| `sent` | INTEGER | DEFAULT 0 | Whether sent |
| `sent_at` | TEXT | | Send timestamp |

---

### 2.19 bastion_learning

Self-learned behavioral thresholds.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Entry ID |
| `metric` | TEXT | UNIQUE NOT NULL | Metric name |
| `threshold` | REAL | NOT NULL | Learned threshold value |
| `confidence` | REAL | DEFAULT 0.5 | Confidence level (0-1) |
| `sample_count` | INTEGER | DEFAULT 0 | Number of samples used |
| `last_updated` | TEXT | | Last learning update |

**Metrics**: `normal_login_hours`, `normal_event_frequency`, `normal_backup_interval`, `normal_db_size`

---

### 2.20 bastion_escalation

Progressive threat escalation state.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Entry ID |
| `current_level` | TEXT | DEFAULT 'normal' | Current escalation level |
| `signal_count` | INTEGER | DEFAULT 0 | Number of corroborating signals |
| `last_signal` | TEXT | | Timestamp of last signal |
| `locked_at` | TEXT | | Time of auto-suspension |
| `unlock_code` | TEXT | | Current unlock code hash |

**Escalation Levels**: `normal` → `warn` → `restrict` → `suspend`

---

### 2.21 logs

General event logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Log ID |
| `timestamp` | TEXT | DEFAULT CURRENT_TIMESTAMP | Log timestamp |
| `level` | TEXT | DEFAULT 'info' | `info`, `warn`, `error` |
| `module` | TEXT | | Source module |
| `message` | TEXT | NOT NULL | Log message |
| `details` | TEXT | | Additional details |

---

### 2.22 device_registry

Permanent PC identity for LAN sync.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Registry ID |
| `device_id` | TEXT | UNIQUE NOT NULL | UUID (MAC-based) |
| `hostname` | TEXT | | Computer hostname |
| `first_seen` | TEXT | DEFAULT CURRENT_TIMESTAMP | First connection time |
| `last_seen` | TEXT | | Last connection time |
| `shop_id` | TEXT | | Shop identifier |

---

### 2.23 sync_state

Per-peer sync version cursors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Entry ID |
| `local_device_id` | TEXT | NOT NULL | This PC's device ID |
| `remote_device_id` | TEXT | NOT NULL | Peer's device ID |
| `table_name` | TEXT | NOT NULL | Synced table name |
| `last_sync_version` | INTEGER | DEFAULT 0 | Last synced version |
| `last_sync_time` | TEXT | | Last sync timestamp |

**Unique Constraint**: `(local_device_id, remote_device_id, table_name)`

---

### 2.24 sync_conflicts

Detected sync anomalies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Conflict ID |
| `timestamp` | TEXT | DEFAULT CURRENT_TIMESTAMP | Detection time |
| `table_name` | TEXT | NOT NULL | Table with conflict |
| `local_id` | INTEGER | | Conflicting local ID |
| `device_id` | TEXT | | Device that caused conflict |
| `conflict_type` | TEXT | NOT NULL | `double_sell`, `version_mismatch`, `orphan_record` |
| `details` | TEXT | | JSON conflict details |
| `resolved` | INTEGER | DEFAULT 0 | Whether resolved |

---

## 3. Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│ categories   │       │ product_master   │       │touch_groups  │
│──────────────│       │──────────────────│       │──────────────│
│ id (PK)      │◀──────│ category_id (FK) │       │ id (PK)      │
│ name         │       │ touch_id (FK)    │──────▶│ name         │
└──────────────┘       │ code (PK)        │       │ touch_value  │
                       │ name             │       │ wastage_pct  │
                       └────────┬─────────┘       └──────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ stock_inventory  │
                       │──────────────────│
                       │ id (PK)          │
                       │ tag_id (UK)      │
                       │ product_code(FK) │
                       │ weight           │
                       │ touch            │
                       └────────┬─────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
    │sales_history │  │katti_vouchers│  │uchak_inward_vou. │
    │──────────────│  │──────────────│  │──────────────────│
    │ id (PK)      │  │ id (PK)      │  │ id (PK)          │
    │ vch_id (UK)  │  │ vch_id (UK)  │  │ vch_id (UK)      │
    │ client_id(FK)│  │ karigar_id   │  │ karigar_id       │
    │ items (JSON) │  └──────┬───────┘  └────────┬─────────┘
    └──────┬───────┘         │                   │
           │                 ▼                   ▼
           │        ┌──────────────┐  ┌──────────────────┐
           │        │katti_voucher │  │uchak_inward_item │
           │        │_items        │  │                  │
           │        │──────────────│  │──────────────────│
           │        │ id (PK)      │  │ id (PK)          │
           │        │ voucher_id   │  │ voucher_id (FK)  │
           │        └──────────────┘  └──────────────────┘
           │
           ▼
    ┌──────────────┐       ┌──────────────────┐
    │clients_master│       │ credit_ledger    │
    │──────────────│       │──────────────────│
    │ id (PK)      │◀──────│ client_id (FK)   │
    │ name         │       │ type             │
    │ metal_bal    │       │ metal_weight     │
    │ cash_bal     │       │ cash_amount      │
    └──────────────┘       └──────────────────┘

    ┌──────────────┐       ┌──────────────────┐
    │ admin_creds  │       │ login_log        │
    │──────────────│       │──────────────────│
    │ id (PK)      │◀──────│ user_id (FK)     │
    │ username     │       │ username         │
    │ password     │       │ login_time       │
    │ is_owner     │       │ status           │
    │ permissions  │       └──────────────────┘
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ audit_log    │
    │──────────────│
    │ id (PK)      │
    │ user_id (FK) │
    │ action       │
    │ detail       │
    └──────────────┘
```

---

## 4. Indexes

For performance, the following indexes are recommended:

```sql
-- Stock inventory
CREATE INDEX idx_stock_tag_id ON stock_inventory(tag_id);
CREATE INDEX idx_stock_product_code ON stock_inventory(product_code);
CREATE INDEX idx_stock_status ON stock_inventory(status);
CREATE INDEX idx_stock_device_id ON stock_inventory(device_id);

-- Sales history
CREATE INDEX idx_sales_vch_id ON sales_history(vch_id);
CREATE INDEX idx_sales_client_id ON sales_history(client_id);
CREATE INDEX idx_sales_date ON sales_history(bill_date);
CREATE INDEX idx_sales_device_id ON sales_history(device_id);

-- Credit ledger
CREATE INDEX idx_ledger_client_id ON credit_ledger(client_id);
CREATE INDEX idx_ledger_type ON credit_ledger(type);
CREATE INDEX idx_ledger_device_id ON credit_ledger(device_id);

-- Katti vouchers
CREATE INDEX idx_katti_vch_id ON katti_vouchers(vch_id);
CREATE INDEX idx_katti_karigar ON katti_vouchers(karigar_id);

-- Login log
CREATE INDEX idx_login_user ON login_log(user_id);
CREATE INDEX idx_login_time ON login_log(login_time);

-- Audit log
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- Bastion
CREATE INDEX idx_bastion_events_type ON bastion_events(event_type);
CREATE INDEX idx_bastion_events_severity ON bastion_events(severity);
CREATE INDEX idx_bastion_learning_metric ON bastion_learning(metric);

-- Sync
CREATE INDEX idx_sync_state_peer ON sync_state(local_device_id, remote_device_id);
CREATE INDEX idx_sync_conflicts_table ON sync_conflicts(table_name);
```

---

## 5. Sync Schema

All syncable tables share these columns:

| Column | Type | Purpose |
|--------|------|---------|
| `device_id` | TEXT | Identifies which PC created/modified the record |
| `sync_version` | INTEGER | Monotonically increasing version number |
| `local_id` | INTEGER | Original ID on the source device |

**Conflict Resolution**: `INSERT OR IGNORE` with `(device_id, local_id)` as the deduplication key.

**Sync Tables**: `stock_inventory`, `sales_history`, `clients_master`, `credit_ledger`, `katti_vouchers`, `katti_voucher_items`, `uchak_inward_vouchers`, `uchak_inward_items`
