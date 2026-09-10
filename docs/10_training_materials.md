# AurumOS - Training Materials

## 1. Onboarding Overview

This guide is designed for new users learning to use AurumOS for the first time. It covers the essential workflows for daily jewelry shop operations.

### 1.1 Who Should Read This

- Shop owners setting up AurumOS for the first time
- Staff members who will use the billing and inventory features
- Accountants using the ledger and accounting modules

### 1.2 Prerequisites

- AurumOS installed on a Windows PC (see Installation Guide)
- Basic computer skills
- License key activated
- Initial setup completed

---

## 2. Day 1: Setup & First Use

### 2.1 Complete the Setup Wizard

1. Launch AurumOS
2. Enter your **License Key** when prompted
3. Fill in your **Business Profile**:
   - Shop name (e.g., "Gems & Jewels")
   - Phone number
   - Address
   - GSTIN (if applicable)
   - Owner name
4. Create your **Admin Account**:
   - Choose a username (e.g., your name)
   - Set a strong password
5. Click **Finish Setup**

### 2.2 Familiarize Yourself with the Dashboard

After login, you'll see the **Dashboard** with:
- **Quick stats**: Today's sales, total inventory, pending payments
- **Navigation sidebar**: Access to all modules
- **Top bar**: Shop name, user, clock

Spend 5 minutes clicking through each module in the sidebar to see what's available.

---

## 3. Day 2: Adding Products & Inventory

### 3.1 Create Product Categories

1. Navigate to **Inventory** > **Categories**
2. Click **Add Category**
3. Create categories like:
   - Rings
   - Necklaces
   - Bracelets
   - Earrings
   - Chains
4. Save each category

### 3.2 Set Up Touch Groups

1. Navigate to **Inventory** > **Touch Groups**
2. Add your purity groups:
   - **22K Gold** (Touch: 916, Wastage: 3%)
   - **18K Gold** (Touch: 750, Wastage: 5%)
   - **Silver** (Touch: 999, Wastage: 2%)
3. Save each group

### 3.3 Add Products to the Master Catalog

1. Navigate to **Inventory** > **Product Master**
2. Click **Add Product**
3. Fill in:
   - **Code**: Unique code (e.g., "RING-22K-001")
   - **Name**: Product name (e.g., "Gold Ring with Diamond")
   - **Category**: Select from dropdown
   - **Touch Group**: Select purity
   - **Making Charge**: Per gram charge
4. Save the product

### 3.4 Add Stock Items

1. Navigate to **Inventory** > **Stock**
2. Click **Add Item**
3. Fill in:
   - **Tag ID**: Unique tag (e.g., "TAG-001")
   - **Product Code**: Select from product master
   - **Weight**: Gross weight in grams
   - **Touch**: Purity value
   - **HUID**: Hallmark code (if available)
   - **Pieces**: Number of pieces
   - **Design Code**: Design identifier
4. Save the item
5. Repeat for all stock items

**Tip**: Use the **Print Tag** button to generate a tag with QR code for each item.

---

## 4. Day 3: Billing

### 4.1 Create Your First Wholesale Bill

1. Navigate to **Billing**
2. Select a **Client** (or add new one)
3. Add items:
   - Search by tag ID or product code
   - Enter weight and quantity
   - The system calculates fine weight automatically
4. Review the bill:
   - Check item list
   - Verify subtotal
   - Add discount or tax if needed
5. Click **Save Bill**
6. Click **Print** to print the bill

### 4.2 Create a POS (Retail) Bill

1. Navigate to **POS Billing**
2. Scan or search for products
3. Enter quantities
4. Select payment method (Cash/UPI/Card)
5. Click **Save & Print**

### 4.3 Understanding Bill Calculations

For each item:
```
Fine Weight = Gross Weight × (Touch / 1000)
Amount = Fine Weight × Rate per Gram
```

Example:
- Weight: 10 grams
- Touch: 916 (22K)
- Rate: ₹5,500/gram
- Fine: 10 × (916/1000) = 9.16 grams
- Amount: 9.16 × ₹5,500 = ₹50,380

---

## 5. Day 4: Client Management

### 5.1 Add Clients

1. Navigate to **Client Ledger**
2. Click **Add Client**
3. Fill in:
   - Name
   - Phone number
   - Metal credit limit (max metal owed)
   - Cash credit limit (max cash owed)
4. Save the client

### 5.2 Record Transactions

1. Select the client
2. Click **New Entry**
3. Choose transaction type:
   - **Metal Debit**: Client takes metal (owes you)
   - **Metal Credit**: Client returns metal (pays you)
   - **Cash Debit**: Client pays cash
   - **Cash Credit**: Client takes cash (owes you)
4. Enter amount and description
5. Save

### 5.3 View Client Statements

1. Select the client
2. View the ledger with running balances
3. Filter by date range
4. Print the statement if needed

---

## 6. Day 5: Advanced Features

### 6.1 Weighing Scale Integration

1. Connect your scale via USB
2. Go to Settings > Scale
3. Click **Detect Port**
4. Select the correct COM port
5. Click **Connect**
6. The scale widget now shows real-time weight on billing pages

### 6.2 Tag Printing

1. In Inventory, select items
2. Click **Print Tag**
3. Preview the tag (includes QR code)
4. Send to printer
5. For batch printing, select multiple items and click **Print Multiple Tags**

### 6.3 Reports

Navigate to **Reports** to view:
- **Sales Summary**: Daily/weekly/monthly sales
- **Stock Report**: Current inventory by category
- **Client Balance**: Outstanding balances
- **Profit & Loss**: Revenue vs costs

---

## 7. Week 2: Staff & Permissions

### 7.1 Add Staff Members

1. Navigate to **Settings** > **Staff Management**
2. Click **Add Staff**
3. Enter username and password
4. Set **Role**: Staff (not Owner)
5. Set **Permissions**: Check modules the staff can access
6. Save

### 7.2 Understanding Permissions

| Module | What Staff Can Do |
|--------|-------------------|
| **Billing** | Create and view bills |
| **POS** | Create retail sales |
| **Inventory** | View stock (add/edit based on permission) |
| **Client Ledger** | View and add entries |
| **Settings** | Limited access (no user management) |

### 7.3 Login Audit Trail

All logins are recorded in **Login Log** (visible to owners):
- Who logged in
- When they logged in
- From which IP (if network)
- Success or failure

---

## 8. Week 3: Multi-PC Setup

### 8.1 Setting Up Network Sync

**On the Host PC:**
1. Open `config.json`
2. Set `"mode": "server"`
3. Restart AurumOS
4. Note the Shop ID displayed

**On Client PCs:**
1. Open `config.json`
2. Set:
   ```json
   {
     "mode": "client",
     "server_ip": "192.168.1.100",
     "server_port": 58901
   }
   ```
3. Restart AurumOS
4. Data syncs automatically

### 8.2 Verifying Sync

1. On the host PC, add a new stock item
2. On the client PC, wait a moment
3. Check if the item appears in the client's inventory
4. Both PCs should now have the same data

---

## 9. Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit form / Confirm |
| `Escape` | Close modal / Cancel |
| `Ctrl + S` | Save current form |
| `Ctrl + P` | Print current page |
| `Ctrl + N` | New entry |
| `Tab` | Move to next field |
| `Shift + Tab` | Move to previous field |

---

## 10. Common Tasks Quick Reference

### Creating a Bill
```
Billing → Select Client → Add Items → Review → Save → Print
```

### Adding Inventory
```
Inventory → Stock → Add Item → Fill Details → Save → Print Tag
```

### Recording a Payment
```
Client Ledger → Select Client → New Entry → Cash Debit → Enter Amount → Save
```

### Checking Stock
```
Inventory → Stock → Filter by Category/Touch → View Items
```

### Viewing Reports
```
Reports → Select Report Type → Set Date Range → View/Export
```

### Printing Tags
```
Inventory → Select Items → Print Tag → Preview → Print
```

---

## 11. Best Practices

### 11.1 Daily Routine

1. **Start of day**: Login, check dashboard for pending items
2. **During day**: Create bills as sales happen, record payments
3. **End of day**: Review daily sales, check stock levels
4. **Weekly**: Backup database, review client balances

### 11.2 Data Entry Tips

- Always use **Tag IDs** for inventory tracking
- Enter **HUID** for hallmarked items
- Use consistent **design codes** for similar items
- Add **notes** for special instructions or agreements

### 11.3 Backup Schedule

- **Daily**: Automatic backup via BASTION
- **Weekly**: Manual backup to external drive
- **Monthly**: Full backup with database export

### 11.4 Security Reminders

- **Never share** your admin password
- **Lock the screen** when stepping away (Ctrl+L or close the window)
- **Review login logs** regularly for unauthorized access
- **Keep AurumOS updated** for security patches

---

## 12. Training Exercises

### Exercise 1: Setup Practice
1. Create a new category called "Watches"
2. Add a touch group for "Steel" (Touch: 999)
3. Add a product "Steel Watch" in the Watches category

### Exercise 2: Inventory Practice
1. Add 3 stock items with different weights and touches
2. Print tags for all 3 items
3. Mark one item as "sold"

### Exercise 3: Billing Practice
1. Create a new client
2. Create a wholesale bill with 2 items
3. Apply a 5% discount
4. Print the bill

### Exercise 4: Ledger Practice
1. Record a metal debit of 10g (22K) for the client
2. Record a cash credit of ₹50,000
3. View the client's balance

### Exercise 5: Reports Practice
1. View today's sales summary
2. Check inventory by category
3. Export a stock report

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Touch** | Gold purity measured in parts per thousand (e.g., 916 = 22K) |
| **Fine Weight** | Pure gold weight after accounting for purity |
| **HUID** | Hallmark Unique Identification - BIS code on gold items |
| **Tag ID** | Unique identifier for each stock item |
| **Katti** | Manufacturing job tracking system |
| **Uchak** | Small-scale manufacturing jobs |
| **Karigar** | Artisan or craftsman |
| **Voucher** | Transaction document (bill, katti, etc.) |
| **Wastage** | Gold lost during manufacturing |
| **Making Charge** | Fee charged for crafting jewelry |

---

## 14. Next Steps

After completing this training:

1. **Explore advanced features**: AI assistant, network mode
2. **Customize settings**: Printer, scale, business profile
3. **Set up multi-PC**: If you have multiple workstations
4. **Review reports**: Understand your business metrics
5. **Contact support**: For questions not covered here
