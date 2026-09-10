# AurumOS - Frequently Asked Questions (FAQ)

## General

### Q: What is AurumOS?
**A:** AurumOS is a jewelry shop management desktop application. It provides point-of-sale (POS) billing, inventory tracking, client ledger management, artisan (karigar) management, accounting, and more - all designed specifically for jewelry businesses.

### Q: What operating system does AurumOS run on?
**A:** AurumOS runs on **Windows 10 (64-bit)** and later, including Windows 11.

### Q: Is AurumOS a web application or desktop application?
**A:** It's a **desktop application** that uses a web-based interface rendered via Microsoft Edge WebView2. Your data stays on your local computer - no cloud storage required.

### Q: Does AurumOS require internet?
**A:** Internet is only required for:
- Initial license activation
- Subscription renewal
- Auto-updates
- AI assistant (optional)

All other features (billing, inventory, printing, etc.) work fully **offline**.

### Q: What is the current version?
**A:** The current version is **1.0.2**. Check Settings > About for your installed version.

---

## Licensing & Subscription

### Q: What license formats does AurumOS use?
**A:** License keys follow the format: `AU-XXXX-XXXX-XXXX-XXXX` (22 characters). You receive this key upon purchase.

### Q: What happens when my subscription expires?
**A:** After expiry, AurumOS enters a **24-hour grace period** where features remain accessible. After 24 hours, the app downgrades to the **Lite plan** with limited features. Renewing restores full access.

### Q: Can I use AurumOS on multiple PCs?
**A:** A single license is valid for **one PC** (machine-locked). For multi-PC setups:
- Use the **LAN Sync** feature with an Enterprise plan
- Each PC needs its own license key
- Or use **Network Mode** (Host/Client) with an Enterprise plan

### Q: What subscription plans are available?

| Plan | Price/Year (INR) | Key Features |
|------|------------------|--------------|
| **Lite** | 3,000 | Billing, stock, basic reports, scale |
| **Pro** | 7,000 | + Karigar, accounting, analytics, year-close |
| **Enterprise** | 15,000 | + LAN sync, cloud backup, AI, fleet management |

### Q: How do I renew my subscription?
**A:** Navigate to **Settings** > **Subscription** > **Renew**. Choose your plan and follow the payment instructions.

### Q: Can I switch between plans?
**A:** Yes. You can upgrade or downgrade at any time. Changes take effect immediately and are prorated.

---

## Billing & POS

### Q: Can I create both wholesale and retail bills?
**A:** Yes. AurumOS has separate interfaces:
- **Billing** (wholesale): Full-featured bills with credit options
- **POS Billing** (retail): Quick point-of-sale with instant payment

### Q: Does AurumOS support GST?
**A:** Yes. You can enter your GSTIN in Settings > Business Profile. GST is calculated and displayed on bills.

### Q: Can I print bills?
**A:** Yes. AurumOS supports:
- Standard printers (inkjet/laser) for A4 bills
- Thermal receipt printers (58mm/80mm) for quick receipts
- Tag printers for jewelry tags with QR codes

### Q: Can I apply discounts and taxes?
**A:** Yes. Both discount and tax can be applied per bill. They are calculated on the subtotal.

### Q: How are bills numbered?
**A:** Bills are auto-numbered sequentially (e.g., BILL-001, BILL-002). The numbering resets optionally at year-close.

---

## Inventory

### Q: What is a Tag ID?
**A:** A Tag ID is a **unique identifier** assigned to each stock item (e.g., TAG-001, TAG-002). It's used to track individual items through sales, returns, and manufacturing.

### Q: What is "Touch"?
**A:** Touch refers to **gold purity** measured in parts per thousand:
- 999 = 24K (pure gold)
- 916 = 22K
- 750 = 18K
- 585 = 14K

AurumOS uses touch values to calculate fine weight from gross weight.

### Q: What is HUID?
**A:** HUID (Hallmark Unique Identification) is a 6-character alphanumeric code stamped on gold jewelry by the Bureau of Indian Standards (BIS). It uniquely identifies each hallmarked item.

### Q: Can I track inventory across multiple locations?
**A:** AurumOS supports a **location field** per stock item, but multi-location inventory management is planned for a future version.

### Q: How do I handle returns?
**A:** Currently, returns can be handled by:
1. Creating a new bill with negative quantities
2. Or adjusting the stock item status back to `in_stock`

Full return management is planned for version 1.1.0.

---

## Client Ledger

### Q: What is the Client Ledger?
**A:** The Client Ledger is a **double-entry credit management system** that tracks:
- **Metal balance**: Gold/silver owed or credit
- **Cash balance**: Cash owed or credit

It's designed for the Indian jewelry market where clients often deal in both metal and cash.

### Q: How does the double-entry system work?
**A:** Every transaction has four possible types:
| Type | Meaning |
|------|---------|
| `metal_dr` | Client owes metal (debit) |
| `metal_cr` | Client paid metal (credit) |
| `cash_dr` | Client paid cash (debit) |
| `cash_cr` | Client owes cash (credit) |

### Q: Can I set credit limits?
**A:** Yes. Each client has configurable `metal_limit` and `cash_limit` that define the maximum credit allowed.

---

## Karigar & Manufacturing

### Q: What is a Karigar?
**A:** A Karigar is an **artisan** or craftsman who makes jewelry. AurumOS tracks jobs assigned to karigars, items sent and received, and manufacturing costs.

### Q: What is a Katti Voucher?
**A:** A Katti Voucher is a **manufacturing job record** that tracks:
- Items sent to a karigar for manufacturing
- Items received back from the karigar
- Weight, touch, and design of each item

### Q: What is Uchak?
**A:** Uchak refers to **small-scale manufacturing** jobs. It's a simplified version of the katti voucher system for smaller operations.

---

## Multi-PC & Networking

### Q: Can I use AurumOS on multiple PCs?
**A:** Yes, with an **Enterprise plan**:
- **LAN Sync**: Automatic peer-to-peer data synchronization
- **Network Mode**: Host/Client architecture with access control

### Q: How does LAN Sync work?
**A:** 
1. One PC runs in **host mode** (`config.json`: `"mode": "server"`)
2. Other PCs run in **client mode** with the host's IP address
3. Data syncs automatically via UDP discovery + HTTP exchange
4. Conflict detection prevents duplicate entries

### Q: Is LAN Sync real-time?
**A:** Sync occurs:
- **On startup**: Full sync when the app launches
- **On data change**: Partial sync after creating bills, adding inventory, etc.
- **Periodic**: Background sync every few minutes

### Q: What happens if two PCs edit the same record?
**A:** AurumOS uses **INSERT OR IGNORE** with device tracking. The first edit wins; the second is logged as a conflict for manual review.

---

## Security (BASTION)

### Q: What is BASTION?
**A:** BASTION is AurumOS's **AI-powered security system** that runs 5 background threads:
1. DB Watchdog - detects external database edits
2. Session Guard - validates login sessions
3. Auto Healer - fixes common issues automatically
4. Pattern Learns - learns normal behavior patterns
5. Alert Sender - sends security notifications

### Q: What is auto-suspension?
**A:** If BASTION detects confirmed suspicious activity (e.g., database tampering, credential changes), it can **automatically suspend** the application to prevent further damage. The system generates a forensic report and requires a one-time unlock code to resume.

### Q: Is auto-suspension safe? Will I lose data?
**A:** Auto-suspension is a protective measure. Your data is **not lost**. To resume:
1. Generate an unlock code using the Bastion Key Generator
2. Enter the code on the lock screen
3. AurumOS resumes normal operation

### Q: What causes a false positive suspension?
**A:** Common false positive triggers:
- Editing the database with an external tool (e.g., DB Browser for SQLite)
- Running a backup program that locks the database
- Changing system time significantly

---

## Updates

### Q: How do updates work?
**A:** AurumOS checks for updates on startup and every 24 hours. When an update is available:
1. A notification appears
2. Click "Update Now" to download
3. The app restarts with the new version
4. Your data is preserved

### Q: Will updates delete my data?
**A:** No. Updates only replace application files. These are **never overwritten**:
- `database/` folder (all your data)
- `config.json` (your settings)
- `logs/` folder

### Q: Can I skip an update?
**A:** Yes. You can dismiss the update notification. However, we recommend updating for security patches and bug fixes.

### Q: How do I update manually?
**A:** 
1. Download the latest version
2. Stop AurumOS
3. Replace `AurumOS.exe` and `_internal/` folder
4. Do NOT replace `database/`, `config.json`, or `logs/`
5. Restart AurumOS

---

## Printing & Scale

### Q: What printers are supported?
**A:** Any Windows-compatible printer:
- Inkjet/laser printers for A4 bills
- Thermal receipt printers (58mm/80mm) for receipts
- Label printers for tags

### Q: How do I connect a weighing scale?
**A:** 
1. Connect via USB/Serial cable
2. Go to Settings > Scale
3. Click "Detect Port" or manually select the COM port
4. Set the baud rate (usually 9600)
5. Click "Connect"

### Q: The scale shows wrong weight. What do I do?
**A:** 
1. Ensure the scale is warmed up (5-10 minutes)
2. Check the baud rate matches the scale's setting
3. Try a different COM port
4. Verify with a known weight

---

## Data & Backup

### Q: Where is my data stored?
**A:** All data is stored in a local SQLite database at:
```
C:\AurumOS\database\aurum_local.db
```

### Q: How do I backup my data?
**A:** 
- **Manual**: Settings > Backup > Choose location
- **Automatic**: BASTION creates backups in `database/backups/`

### Q: Can I move my data to a new PC?
**A:** Yes. Copy the entire `database/` folder to the new PC. AurumOS will recognize the existing database on first launch.

### Q: Is my data encrypted?
**A:** The database itself is not encrypted (SQLite doesn't support it natively). However:
- License keys are XOR-encrypted
- Session tokens are stored securely in the Windows registry
- Physical access to the PC is required to access data

---

## Troubleshooting

### Q: The app shows a blank white screen
**A:** This is usually a WebView2 issue. Try:
1. Install/update Microsoft Edge WebView2 Runtime
2. Restart your computer
3. Disable GPU acceleration in Windows display settings

### Q: "Database is locked" error
**A:** Another instance of AurumOS or a backup process is accessing the database. Close all instances and restart.

### Q: Can't connect to weighing scale
**A:** See the Weighing Scale section in the Troubleshooting Guide (08_troubleshooting_guide.md).

### Q: LAN sync not working
**A:** Check:
1. Both PCs are on the same network
2. Firewall allows ports 58901 (TCP) and 58902 (UDP)
3. `config.json` has correct mode and IP settings

### Q: AI assistant not responding
**A:** Ensure you have internet connection. The AI uses the Groq API and requires network access.

---

## Support

### Q: How do I contact support?
**A:** 
1. Open AurumOS
2. Go to Settings > Support
3. Fill in the support form with your issue details

### Q: What information should I include in a support request?
**A:** 
- AurumOS version (Settings > About)
- Windows version
- Exact error message
- Steps to reproduce the issue
- Screenshots if possible

### Q: Is there a community forum?
**A:** Currently, support is available through the in-app support form and email. A community forum is planned for the future.
