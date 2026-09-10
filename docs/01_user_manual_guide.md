# AurumOS - User Manual / Guide

## 1. Introduction

AurumOS is a jewelry shop management desktop application designed for point-of-sale (POS), inventory tracking, billing, accounting, and artisan (karigar) management. It runs as a native Windows desktop application using a web-based interface rendered via Microsoft Edge/WebView2.

### 1.1 Key Features

| Module | Description |
|--------|-------------|
| **Billing (Wholesale)** | Create wholesale bills with item selection, discount/tax, and print |
| **POS Billing** | Quick retail point-of-sale with scale integration |
| **Inventory Management** | Track stock items with tag IDs, weight, touch, HUID, design codes |
| **Client Ledger** | Double-entry credit ledger for metal and cash transactions |
| **Karigar Management** | Track artisan (karigar) jobs, inward/outward items |
| **Katti Vouchers** | Manufacturing job vouchers with item tracking |
| **Cash & Bank** | Cash flow tracking, bank account management |
| **Chart of Accounts** | Full double-entry accounting |
| **Staff Management** | Multi-user access with role-based permissions |
| **Network Mode** | Multi-PC LAN sync for multi-shop setups |
| **AI Support** | Built-in AI assistant powered by Groq (LLaMA 3.3) |
| **Auto Updates** | Automatic version updates from GitHub releases |

---

## 2. Getting Started

### 2.1 First Launch

1. Double-click `AurumOS.exe` to launch the application.
2. The setup wizard will guide you through:
   - Entering your **License Key** (format: `AU-XXXX-XXXX-XXXX-XXXX`)
   - Setting up your **Business Profile** (shop name, address, phone, GSTIN)
   - Creating your **Admin/Owner account** (username + password)
3. Once setup is complete, the dashboard loads automatically.

### 2.2 Login

1. Enter your **username** and **password** on the login screen.
2. Click **Login** or press Enter.
3. After 3 failed login attempts, a **5-minute lockout** is enforced.
4. Owner accounts have full access; Staff accounts have permissions set by the owner.

### 2.3 Navigation

- The **sidebar** (left panel) provides access to all modules.
- Click any module name to navigate.
- The **top bar** shows the current user, shop name, and clock.
- Use the **back button** or sidebar to return to the dashboard.

---

## 3. Billing

### 3.1 Wholesale Billing

1. Navigate to **Billing** from the sidebar.
2. Select a **Client** from the dropdown (or add a new one).
3. Add items:
   - Search by product code, name, or category
   - Enter **weight**, **touch** (purity), and **quantity**
   - The system auto-calculates fine weight and amount
4. Apply **discount** or **tax** if needed.
5. Click **Save Bill** to generate the bill.
6. Click **Print** to print the bill on a connected printer.

### 3.2 POS (Retail) Billing

1. Navigate to **POS Billing** from the sidebar.
2. Scan or search for products.
3. Enter quantities and weights.
4. Select payment method (Cash / UPI / Card).
5. Click **Save & Print** to complete the transaction.

### 3.3 Bill Format

Bills include:
- Shop name and details (from Business Profile)
- Bill number (auto-generated, sequential)
- Date and time
- Item list with weight, touch, rate, and amount
- Subtotal, discount, tax, and grand total
- Payment method and balance

---

## 4. Inventory Management

### 4.1 Adding Stock

1. Navigate to **Inventory** from the sidebar.
2. Click **Add Item**.
3. Fill in:
   - **Tag ID** (unique identifier)
   - **Product Code** (link to product master)
   - **Weight** (in grams)
   - **Touch/Purity** (e.g., 916, 750, 999)
   - **HUID** (Hallmark Unique Identification)
   - **Design Code**
   - **Number of pieces**
4. Click **Save**.

### 4.2 Viewing Stock

- Use **filters** to narrow by category, touch, or design.
- Click on any item to view details.
- **Edit** or **Delete** items as needed.

### 4.3 Stock Reports

- **Stock Summary**: Total items, weight, and value by category.
- **Low Stock Alert**: Items below threshold quantity.
- **Tag-wise Report**: Detailed report by tag ID.

---

## 5. Client Ledger

### 5.1 Adding a Client

1. Navigate to **Client Ledger**.
2. Click **Add Client**.
3. Enter client details:
   - Name, phone number
   - Metal balance limits
   - Cash balance limits
4. Click **Save**.

### 5.2 Recording Transactions

1. Select the client from the list.
2. Click **New Entry**.
3. Choose transaction type:
   - **Metal Debit/Credit**: Gold/silver transactions with weight and touch
   - **Cash Debit/Credit**: Cash in/out
4. Enter amount and description.
5. Click **Save**.

### 5.3 Viewing Ledger

- The ledger shows all transactions chronologically.
- Running balances for both metal and cash are displayed.
- Use **date range filters** to view specific periods.

---

## 6. Karigar (Artisan) Management

### 6.1 Managing Karigars

1. Navigate to **Karigar** from the sidebar.
2. Add new karigars with their contact details and specialization.
3. Track assigned jobs and returns.

### 6.2 Katti Vouchers

1. Navigate to **Katti Entry**.
2. Create a new voucher:
   - Select the karigar
   - Add items with weight, touch, and design
   - Mark as inward (received from karigar) or outward (sent to karigar)
3. Save the voucher.

---

## 7. Cash & Bank Management

### 7.1 Cash Entries

1. Navigate to **Cash & Bank**.
2. Record cash inflows and outflows.
3. Categorize entries (e.g., rent, salary, purchase, sale).

### 7.2 Bank Transactions

1. Add bank accounts.
2. Record transfers, deposits, and withdrawals.
3. Reconcile with bank statements.

---

## 8. Weighing Scale Integration

### 8.1 Connecting the Scale

1. Connect your weighing scale via USB/Serial cable.
2. Navigate to **Settings** > **Scale**.
3. Click **Detect Port** to find the COM port.
4. Select the correct port and click **Connect**.

### 8.2 Using the Scale

- Once connected, the scale widget appears on billing pages.
- Weight readings are **real-time** and auto-populated in the weight field.
- Click **Capture Weight** to lock the current reading.

---

## 9. Printing Tags

### 9.1 Generating Tags

1. Select items in inventory.
2. Click **Print Tag**.
3. Preview the tag image (includes QR code, item details).
4. Send to thermal printer.

### 9.2 Batch Printing

1. Select multiple items.
2. Click **Print Multiple Tags**.
3. All tags are sent to the printer sequentially.

---

## 10. Network Mode (Multi-PC)

### 10.1 Host Setup

1. Navigate to **Settings** > **Network Manager**.
2. Enable **Host Mode**.
3. Note the **Shop ID** displayed.
4. Other PCs connect using this Shop ID.

### 10.2 Client Node Setup

1. On the client PC, navigate to **Settings** > **Network Manager**.
2. Enter the **Host PC IP** and **Shop ID**.
3. Click **Connect**.
4. Data syncs automatically over LAN.

---

## 11. AI Support Assistant

### 11.1 Accessing the AI

1. Click the **AI Support** icon in the sidebar.
2. Type your question in the chat box.
3. The AI responds with helpful answers about jewelry shop operations, AurumOS features, or general business guidance.

### 11.2 AI Capabilities

- Answer questions about AurumOS features
- Provide jewelry industry knowledge
- Help with billing and accounting queries
- General business advice

---

## 12. Settings

### 12.1 Business Profile

- Shop name, address, phone, email
- GSTIN (GST Identification Number)
- Owner name
- Logo upload

### 12.2 Printer Settings

- Default printer selection
- Tag format customization
- Paper size configuration

### 12.3 User Management

- Add/edit/remove staff accounts
- Set permissions per module
- Reset passwords

### 12.4 Backup & Restore

- **Backup**: Creates a copy of the database to a chosen location.
- **Restore**: Loads a previously saved backup.
- Backups are recommended **daily**.

---

## 13. Auto Updates

1. When an update is available, a notification appears.
2. Click **Update Now** to download and install.
3. The application restarts automatically after the update.
4. Your data is preserved during updates.

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit form / Confirm action |
| `Esc` | Close modal / Cancel |
| `Ctrl + P` | Print current page |
| `Ctrl + S` | Save current form |
| `Ctrl + N` | New entry |

---

## 15. Support

- **In-App AI**: Click the AI Support icon for instant help.
- **Email**: Contact support through the Settings page.
- **Documentation**: Refer to this manual for detailed instructions.
