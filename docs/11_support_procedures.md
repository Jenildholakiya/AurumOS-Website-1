# AurumOS - Support Procedures

## 1. Support Overview

This document outlines the procedures for handling customer support tickets, escalations, and issue resolution for AurumOS.

### 1.1 Support Channels

| Channel | Availability | Response Time |
|---------|-------------|---------------|
| In-App AI Assistant | 24/7 | Instant |
| Email Support | Business hours | 24-48 hours |
| Phone Support | Business hours (Enterprise) | 1-4 hours |
| Emergency Line | 24/7 (critical issues) | 1 hour |

### 1.2 Support Tiers

| Tier | Handled By | Scope |
|------|-----------|-------|
| **Tier 1** | AI Assistant / Junior Support | Common questions, basic troubleshooting |
| **Tier 2** | Senior Support | Complex issues, configuration problems |
| **Tier 3** | Engineering | Bugs, data corruption, security incidents |

---

## 2. Ticket Handling Process

### 2.1 Ticket Reception

When a support request arrives:

1. **Log the ticket** in the tracking system
2. **Collect initial information**:
   - Customer name and contact
   - AurumOS version (Settings > About)
   - Windows version
   - Issue description
   - Screenshots or error messages
   - Log files (from `logs/` folder)
3. **Assign priority** based on severity matrix
4. **Acknowledge receipt** within SLA timeframe

### 2.2 Ticket Classification

| Category | Examples | Priority |
|----------|----------|----------|
| **Billing Issue** | Wrong amount, print failure | High |
| **Data Loss** | Missing records, corrupted DB | Critical |
| **Security** | Unauthorized access, suspension | Critical |
| **Installation** | Won't start, missing dependencies | Medium |
| **Feature Request** | New functionality needed | Low |
| **Configuration** | Setup, network, printer | Medium |
| **Performance** | Slow operation, crashes | High |

### 2.3 Priority Levels

| Priority | Description | Response Time | Resolution Target |
|----------|-------------|---------------|-------------------|
| **P1 - Critical** | Data loss, security breach, app unusable | 1 hour | 4 hours |
| **P2 - High** | Major feature broken, billing impact | 4 hours | 24 hours |
| **P3 - Medium** | Non-critical feature issue, workaround available | 24 hours | 72 hours |
| **P4 - Low** | Feature request, minor inconvenience | 48 hours | 1 week |

---

## 3. Troubleshooting Procedures

### 3.1 Standard Diagnostic Checklist

Before escalating, collect:

```
[ ] AurumOS version: ___________
[ ] Windows version: ___________
[ ] Error message (exact text): ___________
[ ] Steps to reproduce: ___________
[ ] Screenshots attached: Yes / No
[ ] Log files attached: Yes / No
[ ] Database size: ___________
[ ] Issue reproducible: Yes / No
```

### 3.2 Common Issue Resolution

#### Issue: Application Won't Start

1. Check Windows version (requires Windows 10 64-bit+)
2. Verify WebView2 Runtime is installed
3. Check if `.NET Framework 4.8+` is installed
4. Look for crash logs in `logs/error.log`
5. Try running as Administrator
6. Check if another instance is already running

**Resolution Steps**:
```
1. Install WebView2 Runtime: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
2. Install .NET Framework 4.8: https://dotnet.microsoft.com/download/dotnet-framework/net48
3. Restart PC
4. Launch AurumOS
```

#### Issue: Database Locked

1. Check if multiple AurumOS instances are running
2. Check if a backup process is accessing the DB
3. Check if another application has the DB file open

**Resolution Steps**:
```
1. Open Task Manager (Ctrl+Shift+Esc)
2. End all "AurumOS.exe" processes
3. Wait 10 seconds
4. Restart AurumOS
```

#### Issue: License Key Invalid

1. Verify key format: `AU-XXXX-XXXX-XXXX-XXXX`
2. Check for typos (case-sensitive)
3. Verify the key hasn't been used on another PC
4. Check server connectivity

**Resolution Steps**:
```
1. Ensure internet connection
2. Re-enter the key carefully
3. If "already activated", contact support for deactivation
4. If server unreachable, try again later
```

#### Issue: LAN Sync Not Working

1. Verify both PCs are on the same network
2. Check firewall rules for ports 58901 (TCP) and 58902 (UDP)
3. Verify `config.json` settings
4. Test network connectivity (ping)

**Resolution Steps**:
```
1. On host PC: Set "mode": "server" in config.json
2. On client PC: Set "mode": "client" and server_ip
3. Add firewall rules:
   New-NetFirewallRule -DisplayName "AurumOS Sync" -Direction Inbound -LocalPort 58901 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "AurumOS Discovery" -Direction Inbound -LocalPort 58902 -Protocol UDP -Action Allow
4. Restart AurumOS on both PCs
```

#### Issue: Bastion Auto-Suspension

1. Check `bastion_events` table for the trigger
2. Verify if it's a false positive
3. Generate unlock code if legitimate

**Resolution Steps**:
```
1. Identify the trigger event in bastion_events
2. If false positive (e.g., external DB edit):
   - On a different PC, run generate_unlock_keys.py
   - Enter the locked PC's machine ID
   - Generate the unlock code
   - Enter code on the lock screen
3. If legitimate security event:
   - Investigate the cause
   - Take corrective action
   - Then unlock
```

---

## 4. Escalation Procedures

### 4.1 Escalation Matrix

| Condition | Escalate To | Method |
|-----------|-------------|--------|
| Tier 1 can't resolve in 30 min | Tier 2 | Transfer ticket + notes |
| Tier 2 can't resolve in 4 hours | Tier 3 | Engineering ticket + all logs |
| Data corruption confirmed | Tier 3 + Management | Immediate escalation |
| Security breach confirmed | Security Team | Immediate escalation |
| Customer threatens legal action | Management | Immediate escalation |

### 4.2 Escalation Template

```
ESCALATION TICKET

Customer: [Name]
Contact: [Phone/Email]
Version: [AurumOS version]
Priority: [P1/P2/P3/P4]
Category: [Issue category]

ISSUE SUMMARY:
[2-3 sentence description]

TROUBLESHOOTING DONE:
1. [Step 1 and result]
2. [Step 2 and result]
3. [Step 3 and result]

ATTACHED:
- [ ] Log files
- [ ] Screenshots
- [ ] Database backup (if applicable)

REQUESTED ACTION:
[What needs to be done]
```

---

## 5. Data Recovery Procedures

### 5.1 Database Recovery

**Scenario**: Customer reports missing or corrupted data.

**Procedure**:
1. Stop AurumOS immediately
2. Back up the current database (even if corrupted)
3. Check `database/backups/` for recent backups
4. Compare backup date with data loss date
5. If backup exists:
   - Restore from backup
   - Verify data integrity
   - Inform customer of data loss window
6. If no backup:
   - Try SQLite recovery tools
   - Attempt `PRAGMA integrity_check`
   - Contact Tier 3 for advanced recovery

### 5.2 Backup Restoration Steps

```
1. Stop AurumOS
2. Navigate to: C:\AurumOS\database\backups\
3. Sort by date (most recent first)
4. Copy the backup file
5. Rename current aurum_local.db to aurum_local.db.corrupt
6. Paste backup as aurum_local.db
7. Also copy .db-wal and .db-shm if they exist
8. Restart AurumOS
9. Verify data is restored
```

### 5.3 Emergency Data Export

If the database is partially readable:

```sql
-- Export all tables to CSV
.mode csv
.output stock_inventory.csv
SELECT * FROM stock_inventory;
.output sales_history.csv
SELECT * FROM sales_history;
.output clients_master.csv
SELECT * FROM clients_master;
.output credit_ledger.csv
SELECT * FROM credit_ledger;
```

---

## 6. Security Incident Response

### 6.1 Incident Classification

| Level | Description | Response |
|-------|-------------|----------|
| **Low** | Suspicious activity detected | Log and monitor |
| **Medium** | Unauthorized access attempt | Investigate and secure |
| **High** | Confirmed unauthorized access | Immediate containment |
| **Critical** | Data breach or ransomware | Emergency response |

### 6.2 Incident Response Steps

#### For Bastion Auto-Suspension Events:
1. **Identify**: What triggered the suspension?
2. **Contain**: The app is already suspended (contained)
3. **Investigate**: Review `bastion_events` and `audit_log`
4. **Determine**: False positive or real threat?
5. **Resolve**: Generate unlock code if safe; restore from backup if compromised
6. **Document**: Record the incident and resolution

#### For Suspected Data Breach:
1. **Isolate**: Disconnect PC from network
2. **Preserve**: Do not delete any files
3. **Document**: Record all findings
4. **Escalate**: Contact security team immediately
5. **Notify**: Inform affected customers if required
6. **Remediate**: Restore from clean backup; change all credentials

### 6.3 Forensic Report Analysis

When BASTION generates a forensic PDF:
1. Open the report in `Reports/` folder
2. Review the timeline of events
3. Identify the trigger event
4. Check for corroborating evidence
5. Determine if action is needed

---

## 7. Customer Communication Templates

### 7.1 Initial Response

```
Subject: AurumOS Support - Ticket #[TICKET_NUMBER]

Dear [Customer Name],

Thank you for contacting AurumOS support.

We have received your support request regarding [brief description of issue].
Your ticket number is: #[TICKET_NUMBER]

Our team is reviewing your case and will respond within [SLA timeframe].

In the meantime, please ensure:
- Your AurumOS is updated to the latest version
- You have a recent backup of your database
- You can access your log files (C:\AurumOS\logs\)

If this is an urgent issue, please reply with "URGENT" in the subject line.

Best regards,
AurumOS Support Team
```

### 7.2 Resolution Confirmation

```
Subject: AurumOS Support - Ticket #[TICKET_NUMBER] - RESOLVED

Dear [Customer Name],

Your support ticket #[TICKET_NUMBER] has been resolved.

Issue: [Brief description]
Resolution: [What was done to fix it]

Please verify the fix by [specific action]. If you experience any further issues, 
reply to this email or create a new support request.

Thank you for your patience.

Best regards,
AurumOS Support Team
```

### 7.3 Escalation Notification

```
Subject: AurumOS Support - Ticket #[TICKET_NUMBER] - ESCALATED

Dear [Customer Name],

Your support ticket #[TICKET_NUMBER] has been escalated to our senior support team 
for further investigation.

Reason: [Why it was escalated]
Expected response: [New SLA timeframe]

Our senior team will contact you directly. We apologize for the inconvenience and 
are working to resolve this as quickly as possible.

Best regards,
AurumOS Support Team
```

---

## 8. Support Metrics & Reporting

### 8.1 Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Response Time | < 4 hours | Time from ticket creation to first human response |
| Resolution Time | < 24 hours (P1-P2) | Time from ticket creation to resolution |
| Customer Satisfaction | > 90% | Post-resolution survey |
| First Contact Resolution | > 70% | Issues resolved without escalation |
| Ticket Volume | Trending down | Monthly ticket count |

### 8.2 Weekly Report Template

```
WEEKLY SUPPORT REPORT

Week: [Date Range]
Total Tickets: [Number]
Resolved: [Number]
Escalated: [Number]
Open: [Number]

BY PRIORITY:
- P1 (Critical): [Number] resolved, [Number] open
- P2 (High): [Number] resolved, [Number] open
- P3 (Medium): [Number] resolved, [Number] open
- P4 (Low): [Number] resolved, [Number] open

TOP ISSUES:
1. [Issue type]: [Number] tickets
2. [Issue type]: [Number] tickets
3. [Issue type]: [Number] tickets

ACTIONS NEEDED:
- [Action item 1]
- [Action item 2]
```

---

## 9. Knowledge Base Management

### 9.1 Adding New Articles

When a new issue is frequently reported:
1. Document the issue and resolution
2. Add to the FAQ (09_faq.md)
3. Add to the Troubleshooting Guide (08_troubleshooting_guide.md)
4. Update training materials if needed
5. Brief the support team

### 9.2 Article Template

```
## [Issue Title]

### Symptoms
[What the user sees]

### Cause
[Why it happens]

### Resolution
[Step-by-step fix]

### Prevention
[How to avoid it in the future]

### Related Articles
- [Link to related docs]
```

---

## 10. Tools & Resources

### 10.1 Support Tools

| Tool | Purpose | Location |
|------|---------|----------|
| SQLite Browser | Database inspection | https://sqlitebrowser.org |
| Process Explorer | Running process analysis | Microsoft Sysinternals |
| Wireshark | Network traffic analysis | https://www.wireshark.org |
| Putty | SSH/Telnet testing | https://www.putty.org |

### 10.2 Useful SQL Queries

```sql
-- Check database integrity
PRAGMA integrity_check;

-- List all tables
SELECT name FROM sqlite_master WHERE type='table';

-- Check stock inventory count
SELECT COUNT(*) FROM stock_inventory;

-- Check recent sales
SELECT * FROM sales_history ORDER BY bill_date DESC LIMIT 10;

-- Check login attempts
SELECT * FROM login_log ORDER BY login_time DESC LIMIT 20;

-- Check bastion events
SELECT * FROM bastion_events ORDER BY timestamp DESC LIMIT 20;

-- Database size
SELECT page_count * page_size / 1024 / 1024 as size_mb FROM pragma_page_count(), pragma_page_size();
```

### 10.3 Contact Information

| Contact | Details |
|---------|---------|
| Support Email | support@aurumos.com |
| Emergency Line | +91-XXXXXXXXXX |
| GitHub Issues | https://github.com/Jenildholakiya/AurumOS/issues |
| Documentation | C:\AurumOS\docs\ |
