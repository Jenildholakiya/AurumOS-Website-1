# AurumOS - Security Policy

## 1. Security Overview

AurumOS is designed with security as a core principle, protecting jewelry shop business data including financial records, inventory, client information, and transaction history.

### 1.1 Security Principles

1. **Local-First**: All data stored locally; no cloud dependency for core operations
2. **Defense in Depth**: Multiple security layers (authentication, authorization, monitoring, encryption)
3. **Least Privilege**: Staff accounts have minimal required permissions
4. **Audit Everything**: All significant actions are logged
5. **Self-Protecting**: BASTION AI detects and responds to threats automatically

---

## 2. Data Classification

### 2.1 Data Categories

| Category | Examples | Sensitivity | Protection Level |
|----------|----------|-------------|------------------|
| **Business Critical** | Sales bills, inventory, client ledger | High | Encrypted at rest, access-controlled |
| **Financial** | Credit balances, payment records | High | Encrypted at rest, audit-logged |
| **Personal** | Client names, phone numbers | Medium | Access-controlled, not shared |
| **Authentication** | Passwords, license keys | Critical | Hashed/encrypted, never logged |
| **System** | Config files, logs | Low-Medium | Standard file permissions |
| **Security** | Bastion events, alerts | High | Access-controlled, encrypted |

### 2.2 Data Storage Locations

| Data Type | Location | Format |
|-----------|----------|--------|
| Business data | `database/aurum_local.db` | SQLite |
| License key | `database/.license_key` | XOR-encrypted |
| Session token | Windows registry + temp file | Encrypted string |
| Config | `config.json` | JSON (plaintext) |
| Logs | `logs/*.log` | Plain text |
| Backups | `database/backups/` | SQLite copies |

---

## 3. Authentication

### 3.1 Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum length | 6 characters |
| Storage | SHA-256 hash |
| Hash algorithm | SHA-256 (single pass) |
| Salt | Not currently implemented |
| Rotation | No enforcement (recommended: 90 days) |

### 3.2 Login Security

| Feature | Implementation |
|---------|---------------|
| Max failed attempts | 3 |
| Lockout duration | 5 minutes |
| Lockout reset | After successful login |
| Session token | Generated at startup, stored in registry |
| Session validation | Every 60 seconds (BASTION Session Guard) |
| Concurrent sessions | Single session per PC |

### 3.3 Owner vs Staff Permissions

| Capability | Owner | Staff |
|------------|-------|-------|
| Full module access | Yes | Based on permissions |
| User management | Yes | No |
| Settings modification | Yes | Limited |
| Data export | Yes | Based on permissions |
| Bastion management | Yes | No |
| License management | Yes | No |

---

## 4. Authorization

### 4.1 Role-Based Access Control (RBAC)

Staff permissions are stored as a JSON array in the `admin_creds` table:

```json
["billing", "pos", "inventory", "reports"]
```

### 4.2 Module Permissions

| Module | Permission Key | Description |
|--------|---------------|-------------|
| Wholesale Billing | `billing` | Create and view wholesale bills |
| POS Billing | `pos` | Create retail sales |
| Inventory | `inventory` | View and manage stock |
| Client Ledger | `ledger` | View and manage client accounts |
| Karigar | `karigar` | Manage artisan jobs |
| Accounting | `accounting` | Access chart of accounts, cash/bank |
| Reports | `reports` | View business reports |
| Settings | `settings` | Modify application settings |
| Staff Management | `staff` | Manage user accounts |
| Network | `network` | Configure network sync |

### 4.3 Permission Enforcement

Permissions are checked:
- At the UI level (modules hidden/grayed based on permissions)
- At the API level (bridge methods verify permissions before execution)
- At the database level (audit log records all access)

---

## 5. Encryption

### 5.1 Data Encryption

| Data | Method | Key |
|------|--------|-----|
| License key | XOR cipher | Machine ID (MAC-based UUID) |
| Passwords | SHA-256 hash | N/A (one-way hash) |
| Session tokens | Generated random | Stored in Windows registry |
| Database | Not encrypted | N/A (SQLite limitation) |

### 5.2 License Key Encryption

```
Key: AU-XXXX-XXXX-XXXX-XXXX
Encryption: XOR with machine_id as key
Storage: database/.license_key (binary)
Retrieval: XOR decrypt with machine_id
```

### 5.3 Future Encryption Plans

- AES-256 encryption for database files
- Password salting (PBKDF2)
- Encrypted config file support
- End-to-end encryption for LAN sync

---

## 6. BASTION AI Security System

### 6.1 Overview

BASTION is a 5-thread background security monitor that detects and responds to threats.

### 6.2 Security Threads

| Thread | Interval | Function |
|--------|----------|----------|
| **DB Watchdog** | 30 seconds | Hashes table row counts to detect external edits |
| **Session Guard** | 60 seconds | Validates session token in Windows registry |
| **Auto Healer** | 5 minutes | Fixes stale backups, WAL files, corrupted tokens |
| **Pattern Learner** | 24 hours | Analyzes 30-day event history for anomalies |
| **Alert Sender** | 5 minutes | Sends queued email alerts via Gmail SMTP |

### 6.3 Threat Detection

| Threat | Detection Method | Response |
|--------|-----------------|----------|
| External DB edit | Row count hash change | WARN → RESTRICT → SUSPEND |
| Session token tampering | Registry validation failure | Regenerate token |
| Login anomaly | Unusual login time/frequency | Log and alert |
| Fingerprint mismatch | Hardware serial change | WARN → SUSPEND |
| Credential change | Unauthorized password modification | WARN → RESTRICT |

### 6.4 Progressive Escalation

```
Normal → WARN (1st signal)
       → RESTRICT (2nd corroboration)
       → SUSPEND (3rd confirmation)
```

**Corroboration requirement**: 2+ independent signals required before SUSPEND action.

### 6.5 Auto-Suspension

When SUSPEND is triggered:
1. Application locks with Bastion Key screen
2. Forensic PDF report generated in `Reports/`
3. Email alert queued (if internet available)
4. Health dashboard event pushed
5. System awaits one-time unlock code

### 6.6 One-Time Unlock Keys

- Generated externally using `generate_unlock_keys.py`
- Uses nonce-based authentication (date-sensitive)
- 12-character regular keys / 16-character bastion keys
- Each key can only be used once

---

## 7. Hardware Identity

### 7.1 Machine ID

- **Source**: MAC address
- **Format**: UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- **Usage**: License binding, sync identity, session tokens
- **Regeneration**: None (fixed per machine)

### 7.2 Hardware Fingerprint

- **Source**: Motherboard serial number
- **Algorithm**: SHA-256 hash
- **Usage**: Integrity verification, tamper detection
- **Regeneration**: None (hardware-bound)

### 7.3 Device Registry

Permanent PC identity stored in `device_registry` table:
- Device ID (UUID)
- Hostname
- Shop ID (shared by same shop's PCs)
- First seen / last seen timestamps

---

## 8. Network Security

### 8.1 LAN Sync Security

| Aspect | Implementation |
|--------|---------------|
| Discovery | UDP broadcast (unencrypted) |
| Data exchange | HTTP (unencrypted JSON) |
| Authentication | Device ID verification |
| Conflict resolution | INSERT OR IGNORE with device tracking |

### 8.2 Network Mode Security

| Aspect | Implementation |
|--------|---------------|
| Access control | `brain_guard.py` permission checks |
| Registration | POST `/brain/register` with device info |
| Authorization | POST `/brain/check-access` per action |

### 8.3 Security Recommendations

For production LAN sync:
1. Use a dedicated VLAN for AurumOS PCs
2. Enable Windows Firewall with strict rules
3. Consider VPN for remote sync
4. Monitor network traffic for anomalies
5. Regular security audits

### 8.4 Future Network Security

- TLS encryption for sync traffic
- Mutual authentication (certificate-based)
- Encrypted data payloads
- Rate limiting on sync endpoints

---

## 9. Audit Trail

### 9.1 Login Audit (login_log)

| Field | Description |
|-------|-------------|
| User ID | Who logged in |
| Username | Login name |
| Role | Owner or Staff |
| Login time | Timestamp |
| IP address | Source IP (if network) |
| Status | Success or Failed |

### 9.2 Action Audit (audit_log)

| Field | Description |
|-------|-------------|
| User ID | Who performed action |
| Action | What was done |
| Detail | Detailed description |
| Category | Action category |
| Timestamp | When it happened |
| IP address | Source IP |

### 9.3 Audit Categories

| Category | Examples |
|----------|----------|
| `auth` | Login, logout, password change |
| `billing` | Bill created, modified, deleted |
| `inventory` | Item added, modified, deleted |
| `settings` | Configuration changed |
| `security` | Bastion event, unlock attempt |
| `sync` | Data sync, conflict detected |
| `system` | Startup, shutdown, update |

---

## 10. File Protection

### 10.1 Protected Files

| File/Folder | Protection Method |
|-------------|------------------|
| Source code | XOR encryption + marshal + zlib |
| License key | XOR encryption with machine ID |
| Session token | Windows registry storage |
| Database | WAL mode + auto-backup |
| Config | Not overwritten on update |
| EXE integrity | Trusted hash verification |

### 10.2 Build Obfuscation

The build process applies:
1. Python compilation → `.pyc`
2. Marshal serialization
3. zlib compression
4. XOR symmetric encryption
5. base85 encoding

**Obfuscated files**: `main.py`, `db_manager.py`, `tag_engine.py`, `updater.py`

### 10.3 Update Protection

These files are **never overwritten** during updates:
- `database/` folder
- `config.json`
- `logs/` folder
- `exe_trusted_hash.txt`

---

## 11. Vulnerability Management

### 1.1 Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| SHA-256 without salt | Vulnerable to rainbow tables | Physical access protection |
| No database encryption | Data readable if file accessed | File system permissions |
| Unencrypted LAN sync | MITM possible on local network | Dedicated VLAN |
| Single-session only | No multi-device access | By design (license binding) |

### 1.2 Planned Security Improvements

| Improvement | Priority | Target Version |
|-------------|----------|----------------|
| PBKDF2 password hashing | High | 1.1.0 |
| Database encryption (SQLCipher) | High | 1.1.0 |
| TLS for LAN sync | Medium | 1.2.0 |
| Two-factor authentication | Medium | 1.2.0 |
| Encrypted config files | Low | 2.0.0 |

---

## 12. Incident Response

### 12.1 Security Incident Classification

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | Data breach, ransomware | Immediate |
| **High** | Unauthorized access, data tampering | 1 hour |
| **Medium** | Suspicious activity, failed attacks | 4 hours |
| **Low** | Policy violations, anomalies | 24 hours |

### 12.2 Incident Response Steps

1. **Detect**: BASTION alerts, user reports, log analysis
2. **Contain**: Auto-suspension, network isolation
3. **Investigate**: Review logs, bastion events, audit trail
4. **Eradicate**: Remove threat, restore from backup
5. **Recover**: Verify system integrity, resume operations
6. **Document**: Record incident, update procedures

### 12.3 Forensic Report

BASTION generates forensic PDF reports on auto-suspension:
- Timeline of events
- Trigger identification
- Corroborating evidence
- System state at time of incident
- Recommended actions

Reports stored in `Reports/` folder.

---

## 13. Physical Security

### 13.1 Recommendations

1. **Lock workstation** when unattended (Windows + L)
2. **Restrict physical access** to the PC running AurumOS
3. **Enable Windows BitLocker** for disk encryption
4. **Disable USB ports** if not needed for scale/printer
5. **Secure backups** in a locked location
6. **Regular audits** of physical access logs

### 13.2 Database File Protection

- Store database on an **NTFS partition** with proper permissions
- Set **file system ACLs** to restrict access to AurumOS user only
- Enable **Windows BitLocker** for full disk encryption
- Regular backups to **encrypted external drives**

---

## 14. Compliance Considerations

### 14.1 Data Protection

| Regulation | Relevance | AurumOS Compliance |
|------------|-----------|-------------------|
| **IT Act 2000** (India) | Electronic records | Audit trail, data integrity |
| **GST Act** (India) | Tax records | Bill storage, GST reports |
| **DPDP Act 2023** (India) | Personal data | Client data protection |
| **PCI DSS** | Payment data | No card data stored locally |

### 14.2 Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Sales bills | Indefinite (recommended: 7 years) |
| Audit logs | 1 year (recommended: 3 years) |
| Login logs | 90 days |
| Bastion events | 1 year |
| Backups | 30 days (auto-rotated) |
| System logs | 30 days |

---

## 15. Security Best Practices for Users

### 15.1 Password Security

- Use **strong passwords** (8+ characters, mix of letters/numbers/symbols)
- **Don't share** passwords with unauthorized persons
- **Change passwords** regularly (every 90 days)
- **Don't reuse** passwords from other systems

### 15.2 System Security

- Keep **Windows updated** with latest security patches
- Use **Windows Defender** or reputable antivirus
- Enable **Windows Firewall** with strict rules
- **Don't install** suspicious software on the AurumOS PC

### 15.3 Data Security

- **Backup regularly** (daily automatic + weekly manual)
- Store backups in a **secure location**
- **Don't edit** the database with external tools
- **Report suspicious** activity immediately

### 15.4 Network Security

- Use **WPA3** or WPA2 for WiFi
- **Don't use public WiFi** for LAN sync
- **Monitor network** for unauthorized devices
- **Change default router** passwords

---

## 16. Security Contact

For security issues or vulnerability reports:

- **Email**: security@aurumos.com
- **Emergency**: +91-XXXXXXXXXX
- **GitHub**: Report via private issue

**Responsible Disclosure**: We request 90 days to address confirmed vulnerabilities before public disclosure.
