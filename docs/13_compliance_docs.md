# AurumOS - Compliance Documentation

## 1. Compliance Overview

This document outlines AurumOS's compliance posture with respect to data protection regulations, industry standards, and best practices for jewelry shop management software.

### 1.1 Regulatory Landscape

AurumOS primarily operates in the **Indian market** and is subject to:

| Regulation | Jurisdiction | Relevance |
|------------|-------------|-----------|
| **Information Technology Act, 2000** | India | Electronic records, data protection |
| **IT Rules, 2011** | India | Reasonable security practices |
| **Digital Personal Data Protection Act, 2023** | India | Personal data processing |
| **Goods and Services Tax Act, 2017** | India | Tax record retention |
| **Indian Penal Sections** | India | Data theft, fraud |

### 1.2 International Considerations

| Regulation | Jurisdiction | Relevance |
|------------|-------------|-----------|
| **GDPR** | EU/EEA | If serving EU customers |
| **CCPA/CPRA** | California, USA | If serving California residents |
| **SOC 2** | USA | Enterprise customer requirement |

---

## 2. Digital Personal Data Protection Act, 2023 (DPDP Act)

### 2.1 Applicability

The DPDP Act applies to AurumOS as it processes personal data of data principals (clients, staff) within India.

### 2.2 Key Provisions Compliance

| DPDP Provision | AurumOS Implementation |
|----------------|----------------------|
| **Consent** (Section 6) | Staff consent obtained during account creation; client data collected for business purposes |
| **Purpose Limitation** (Section 5) | Data used only for jewelry shop management operations |
| **Data Minimization** (Section 5) | Only necessary data collected (name, phone, transactions) |
| **Accuracy** (Section 5) | Data entry by authorized users; audit trail for changes |
| **Storage Limitation** (Section 5) | Retention policies defined; old logs rotated |
| **Security Safeguards** (Section 8) | BASTION AI, encryption, access controls, audit logging |
| **Breach Notification** (Section 8) | Incident response procedures; user notification capability |

### 2.3 Data Principal Rights

| Right | Implementation |
|-------|---------------|
| **Right to Access** (Section 11) | Users can view their data via the UI; export capability |
| **Right to Correction** (Section 11) | Data can be modified by authorized users |
| **Right to Erasure** (Section 11) | Database deletion capability (with backup) |
| **Right to Grievance** (Section 11) | Support contact in Settings > Support |

### 2.4 Data Fiduciary Obligations

| Obligation | AurumOS Compliance |
|------------|-------------------|
| Reasonable security practices | BASTION AI, encryption, access controls |
| Data protection officer | Not required (SME exemption) |
| Record of processing | Audit log maintains processing records |
| Cross-border transfer | Not applicable (local storage only) |

---

## 3. Information Technology Act, 2000

### 3.1 Section 43A - Reasonable Security Practices

AurumOS implements the following security practices:

| Practice | Implementation |
|----------|---------------|
| Access control | Role-based access (Owner/Staff) |
| Authentication | Password-based with lockout |
| Encryption | License key encryption, session tokens |
| Audit logging | Complete action audit trail |
| Intrusion detection | BASTION AI monitoring |
| Disaster recovery | Auto-backup, restore capability |

### 3.2 Section 72A - Data Protection

| Requirement | Implementation |
|-------------|---------------|
| Lawful purpose | Business management only |
| Authorized processing | Owner/Staff with defined permissions |
| Data security | BASTION AI, encryption, access controls |

### 3.3 Section 79 - Intermediary Liability

Not applicable: AurumOS is a desktop application, not an intermediary platform.

---

## 4. Goods and Services Tax (GST) Act, 2017

### 4.1 GST Record Keeping

| Requirement | AurumOS Implementation |
|-------------|----------------------|
| Invoice retention | Bills stored indefinitely in `sales_history` |
| GSTIN capture | Business profile includes GSTIN field |
| Invoice format | Bills include GST-compliant fields |
| Digital records | SQLite database with audit trail |
| Record period | 6 years minimum (recommended) |

### 4.2 GST Report Generation

AurumOS provides:
- **GSTR-1**: Sales register export
- **GSTR-3B**: Summary of sales and purchases
- **Invoice register**: Searchable bill history

### 4.3 Data Retention for GST

| Data Type | Minimum Retention | AurumOS Default |
|-----------|------------------|-----------------|
| Sales invoices | 6 years | Indefinite |
| Purchase invoices | 6 years | Indefinite |
| Credit/debit notes | 6 years | Indefinite |
| Stock records | 6 years | Indefinite |

---

## 5. GDPR Compliance (Optional)

### 5.1 Applicability

GDPR applies if AurumOS processes personal data of EU/EEA residents. Currently, AurumOS primarily serves the Indian market.

### 5.2 GDPR Principles

| Principle | Implementation |
|-----------|---------------|
| **Lawfulness, fairness, transparency** | Data collected for business purposes; users informed via setup |
| **Purpose limitation** | Data used only for jewelry shop management |
| **Data minimization** | Only necessary data collected |
| **Accuracy** | Data editable by users; audit trail |
| **Storage limitation** | Retention policies; log rotation |
| **Integrity & confidentiality** | BASTION AI, encryption, access controls |
| **Accountability** | Audit logs, security documentation |

### 5.3 Data Subject Rights

| Right | Implementation |
|-------|---------------|
| **Right of access** | UI displays all user data; export capability |
| **Right to rectification** | Users can edit their data |
| **Right to erasure** | Database records can be deleted |
| **Right to data portability** | Export to CSV/JSON capability |
| **Right to object** | Users can request data processing cessation |
| **Automated decision-making** | Not applicable (no automated decisions with legal effect) |

### 5.4 Data Protection Impact Assessment (DPIA)

**Not currently required** as AurumOS:
- Processes data locally (no cloud storage)
- Primarily serves Indian market
- Does not process data at scale
- Does not engage in profiling

---

## 6. SOC 2 Compliance (Future)

### 6.1 SOC 2 Trust Service Criteria

| Criterion | Current Status | Target |
|-----------|---------------|--------|
| **Security** | Partial (BASTION AI) | Full implementation |
| **Availability** | Partial (auto-backup) | 99.9% uptime |
| **Processing Integrity** | Partial (audit trail) | Full validation |
| **Confidentiality** | Partial (encryption) | Full encryption |
| **Privacy** | Partial (access controls) | Full privacy controls |

### 6.2 SOC 2 Readiness Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| Phase 1 | Q1 2027 | Security controls documentation |
| Phase 2 | Q2 2027 | Access control audit |
| Phase 3 | Q3 2027 | Encryption at rest and in transit |
| Phase 4 | Q4 2027 | SOC 2 Type I audit |

---

## 7. PCI DSS Compliance

### 7.1 Applicability

AurumOS **does not process, store, or transmit** card payment data. All payment processing is handled by:
- Cash transactions (no card data)
- UPI payments (handled by third-party apps)
- Card payments (handled by external POS terminals)

### 7.2 PCI DSS Requirements

| Requirement | Status |
|-------------|--------|
| Build and maintain a secure network | Not applicable |
| Protect cardholder data | Not applicable (no card data) |
| Maintain a vulnerability management program | Partial (BASTION AI) |
| Implement strong access control measures | Implemented |
| Regularly monitor and test networks | Partial (audit logging) |
| Maintain an information security policy | Documented |

**Conclusion**: PCI DSS compliance is **not required** for AurumOS as it does not handle card data.

---

## 8. Data Processing Agreement

### 8.1 Data Processing Overview

| Aspect | Details |
|--------|---------|
| **Data Controller** | Jewelry shop owner (user) |
| **Data Processor** | AurumOS (application) |
| **Data Subjects** | Staff, clients, artisans |
| **Processing Purpose** | Jewelry shop management |
| **Processing Location** | Local PC (no cloud transfer) |
| **Processing Methods** | Automated (software) + Manual (user input) |

### 8.2 Data Categories Processed

| Category | Examples | Sensitivity |
|----------|----------|-------------|
| **Identity** | Staff names, client names | Medium |
| **Contact** | Phone numbers, addresses | Medium |
| **Financial** | Transaction amounts, balances | High |
| **Business** | Inventory, bills, vouchers | High |
| **Authentication** | Usernames, password hashes | Critical |

### 8.3 Sub-Processors

| Sub-Processor | Purpose | Data Shared | Location |
|---------------|---------|-------------|----------|
| Groq API | AI assistant | User queries (anonymized) | USA |
| GitHub | Auto-updates | Version check | USA |
| Vercel | License server | Machine ID, license key | USA |
| Gmail SMTP | Security alerts | Alert content | USA |

---

## 9. Data Retention Policy

### 9.1 Retention Schedule

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| Sales invoices | Indefinite (min 6 years) | GST Act |
| Credit ledger | Indefinite (min 6 years) | GST Act |
| Stock inventory | Indefinite | Business need |
| Client data | Until deletion requested | DPDP Act |
| Staff accounts | Until employment ends | Employment law |
| Audit logs | 3 years | Security best practice |
| Login logs | 90 days | Security best practice |
| Bastion events | 1 year | Security monitoring |
| System logs | 30 days | Operational need |
| Backups | 30 days (auto-rotated) | Disaster recovery |

### 9.2 Data Deletion Procedures

| Data Type | Deletion Method |
|-----------|----------------|
| Sales bills | UI delete (soft) → Manual DB cleanup |
| Client records | UI delete (cascading) |
| Staff accounts | Settings > Staff Management > Delete |
| Audit logs | Automatic rotation (90 days) |
| System logs | Automatic rotation (30 days) |
| Backups | Automatic rotation (30 days) |

---

## 10. Security Audit Trail

### 10.1 Audit Log Schema

```sql
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    category TEXT,
    ip_address TEXT
);
```

### 10.2 Logged Events

| Category | Events Logged |
|----------|--------------|
| **Authentication** | Login success/failure, logout, password change |
| **Billing** | Bill created, modified, deleted, printed |
| **Inventory** | Item added, modified, deleted, tag printed |
| **Client** | Client added, modified, deleted, ledger entry |
| **Settings** | Configuration changed, user added/modified |
| **Security** | Bastion event, unlock attempt, suspension |
| **System** | Startup, shutdown, update, backup/restore |

### 10.3 Audit Log Immutability

- Audit logs are **append-only** (no UPDATE/DELETE operations)
- Log files are **rotated** but not modified
- BASTION monitors audit log integrity
- External tampering triggers security alerts

---

## 11. Business Continuity

### 11.1 Recovery Time Objective (RTO)

| Scenario | Target RTO |
|----------|-----------|
| Application crash | < 5 minutes |
| Database corruption | < 30 minutes |
| Hardware failure | < 4 hours |
| Data loss | < 24 hours |

### 11.2 Recovery Point Objective (RPO)

| Scenario | Target RPO |
|----------|-----------|
| Auto-backup | < 24 hours |
| Manual backup | < 7 days (user-dependent) |
| LAN sync | Real-time (when connected) |

### 11.3 Backup Strategy

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Auto (BASTION) | On startup + periodic | 30 backups | `database/backups/` |
| Manual | User-initiated | Indefinite | User-chosen location |
| LAN sync | Real-time | N/A | Peer PCs |

---

## 12. Accessibility Compliance

### 12.1 WCAG 2.1 Compliance

| Level | Status |
|-------|--------|
| **Level A** | Partial |
| **Level AA** | Not targeted |
| **Level AAA** | Not targeted |

### 12.2 Accessibility Features

| Feature | Implementation |
|---------|---------------|
| Keyboard navigation | Supported (Tab, Enter, Escape) |
| Screen reader | Limited (no ARIA labels) |
| Color contrast | Standard (no special styling) |
| Font sizing | Default (no user scaling) |
| Alternative text | Not implemented |

**Note**: Accessibility is a planned improvement for future versions.

---

## 13. Environmental Compliance

### 13.1 E-Waste Management

AurumOS is a software application and does not directly produce e-waste. However:
- Hardware requirements are minimal (runs on existing PCs)
- No proprietary hardware required
- Software updates extend hardware lifespan

### 13.2 Carbon Footprint

| Factor | Impact |
|--------|--------|
| Local processing | Low (no cloud compute) |
| Network sync | Minimal (LAN only) |
| Updates | Periodic (not continuous) |
| AI features | Moderate (Groq API calls) |

---

## 14. Audit & Certification Roadmap

### 14.1 Planned Certifications

| Certification | Timeline | Purpose |
|--------------|----------|---------|
| IT Act 2000 compliance | Current | Legal requirement |
| DPDP Act 2023 compliance | Q4 2026 | Data protection |
| SOC 2 Type I | Q4 2027 | Enterprise trust |
| ISO 27001 | 2028 | Information security |

### 14.2 Internal Audits

| Audit Type | Frequency | Scope |
|------------|-----------|-------|
| Security audit | Quarterly | BASTION logs, access controls |
| Data integrity audit | Monthly | Database consistency |
| Compliance review | Semi-annually | Policy adherence |
| Access review | Quarterly | User permissions |

---

## 15. Documentation & Records

### 15.1 Compliance Documents

| Document | Location | Last Updated |
|----------|----------|-------------|
| Security Policy | `docs/12_security_policy.md` | Current |
| Privacy Policy | `docs/privacy_policy.md` | Planned |
| Terms of Service | `docs/terms_of_service.md` | Planned |
| Data Processing Agreement | `docs/dpa.md` | Planned |

### 15.2 Record Keeping

All compliance-related records are maintained for:
- **Minimum 3 years** (security logs)
- **Minimum 6 years** (financial records)
- **Indefinite** (audit trail)

---

## 16. Contact

For compliance-related inquiries:

- **Email**: compliance@aurumos.com
- **Phone**: +91-XXXXXXXXXX
- **Address**: [Company Address]

For data protection officer (when required):
- **Email**: dpo@aurumos.com
