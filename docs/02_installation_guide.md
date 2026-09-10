# AurumOS - Installation Guide

## 1. System Requirements

### 1.1 Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 10 (64-bit) or later |
| **Processor** | Intel Core i3 or equivalent |
| **RAM** | 4 GB minimum |
| **Storage** | 500 MB free disk space |
| **Display** | 1280 x 720 resolution |
| **Internet** | Required for license activation and updates |
| **.NET Runtime** | .NET Framework 4.8+ or .NET 6+ (for WebView2) |

### 1.2 Recommended Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 11 (64-bit) |
| **Processor** | Intel Core i5 or equivalent |
| **RAM** | 8 GB |
| **Storage** | 1 GB free disk space |
| **Display** | 1920 x 1080 resolution |
| **Internet** | Broadband connection |
| **Printer** | Thermal receipt printer (USB/Serial) |
| **Scale** | Digital weighing scale with COM port output |

---

## 2. Installation Steps

### 2.1 Download

1. Download `AurumOS.exe` from the official release source or installation media.
2. Ensure the download completes without interruption.
3. Verify the file size (approximately 200-400 MB).

### 2.2 First-Time Setup

1. Create an installation folder:
   ```
   C:\AurumOS\
   ```
2. Copy `AurumOS.exe` and the `_internal/` folder to `C:\AurumOS\`.
3. Double-click `AurumOS.exe` to launch.

### 2.3 License Activation

1. On first launch, the **License Activation** screen appears.
2. Enter your **License Key** in the format:
   ```
   AU-XXXX-XXXX-XXXX-XXXX
   ```
3. Click **Activate**.
4. The application validates the key with the license server.
5. Upon successful activation, the Setup Wizard begins.

### 2.4 Initial Configuration

The Setup Wizard guides you through:

#### Step 1: Business Profile
- **Shop Name**: Your business name
- **Phone Number**: Primary contact number
- **Address**: Full business address
- **GSTIN**: GST Identification Number (optional)
- **Owner Name**: Primary owner's name

#### Step 2: Admin Account
- **Username**: Your login username
- **Password**: Strong password (min 6 characters)
- **Confirm Password**: Re-enter password

#### Step 3: Database Location
- Default: `C:\AurumOS\database\aurum_local.db`
- Can be changed to a custom location (e.g., network drive)

#### Step 4: Printer Setup
- Select default printer (can be changed later)
- Configure paper size and margins

---

## 3. Configuration Files

### 3.1 config.json

Located at `C:\AurumOS\config.json`:

```json
{
  "mode": "local",
  "server_ip": "",
  "server_port": 58901,
  "api_base_url": "https://aurum-os-admin.vercel.app"
}
```

| Key | Description | Default |
|-----|-------------|---------|
| `mode` | `"local"` (standalone) or `"server"` (network host) | `"local"` |
| `server_ip` | IP address of the network host (client mode only) | `""` |
| `server_port` | Port for LAN sync server | `58901` |
| `api_base_url` | Remote API server URL | Vercel URL |

### 3.2 version.json

Located at `C:\AurumOS\version.json`:

```json
{
  "version": "1.0.2",
  "download_url": "https://github.com/...",
  "sha256": "..."
}
```

This file is used by the auto-updater to check for new versions.

### 3.3 Database Path File

Located at `C:\AurumOS\db_path.txt`:

Contains the full path to the SQLite database file. Useful when the database is stored on a network drive.

---

## 4. Network Configuration (Multi-PC)

### 4.1 Host PC Setup

1. Open `config.json`.
2. Set `"mode": "server"`.
3. Save and restart AurumOS.
4. The LAN sync server starts on port **58901**.
5. UDP discovery beacon broadcasts on port **58902**.

### 4.2 Client PC Setup

1. Open `config.json` on the client PC.
2. Set:
   ```json
   {
     "mode": "client",
     "server_ip": "192.168.1.100",
     "server_port": 58901
   }
   ```
3. Save and restart AurumOS.
4. The client connects to the host and begins syncing.

### 4.3 Firewall Configuration

Ensure these ports are open on the host PC:

| Port | Protocol | Purpose |
|------|----------|---------|
| 58901 | TCP | HTTP sync server |
| 58902 | UDP | LAN discovery beacon |
| 7272 | TCP | Network mode (Brain/Client) |

---

## 5. Weighing Scale Setup

### 5.1 Supported Scales

Any digital weighing scale that outputs weight via COM/Serial port (RS-232) with configurable baud rate.

### 5.2 Connection Steps

1. Connect the scale via USB-to-Serial adapter (if needed).
2. Open **Device Manager** to identify the COM port.
3. In AurumOS, navigate to **Settings** > **Scale**.
4. Click **Detect Port** or manually select the COM port.
5. Set the baud rate (typically 9600 or 4800).
6. Click **Connect**.

### 5.3 Verification

- The scale widget should display real-time weight.
- Place an item on the scale to verify readings update.

---

## 6. Printer Setup

### 6.1 Supported Printers

- Any Windows-compatible printer (inkjet, laser, thermal)
- Thermal receipt printers (58mm/80mm) recommended for tags
- Label printers for barcode/QR code tags

### 6.2 Installation

1. Install the printer driver from the manufacturer.
2. Ensure the printer appears in Windows **Devices and Printers**.
3. In AurumOS, navigate to **Settings** > **Printer**.
4. Select the printer from the dropdown.
5. Configure paper size and print test page.

---

## 7. Updating AurumOS

### 7.1 Automatic Updates

1. When a new version is available, a notification appears.
2. Click **Update Now**.
3. The updater downloads the new version from GitHub.
4. The application restarts with the new version.
5. Your database and settings are preserved.

### 7.2 Manual Update

1. Download the latest `AurumOS.exe` and `_internal/` folder.
2. Stop the running AurumOS application.
3. Replace the old files with the new ones.
4. **Do NOT** replace the `database/` folder, `config.json`, or `logs/` folder.
5. Launch `AurumOS.exe`.

### 7.3 Update Exclusions

These files/folders are **never overwritten** during updates:
- `database/` (all data files)
- `config.json`
- `logs/`
- `exe_trusted_hash.txt`
- `version.lock`

---

## 8. Backup & Recovery

### 8.1 Manual Backup

1. Navigate to **Settings** > **Backup**.
2. Choose a backup location (external drive recommended).
3. Click **Backup Now**.
4. A copy of `aurum_local.db` is saved.

### 8.2 Automated Backup

The BASTION AI system creates automatic backups:
- **Location**: `database/backups/`
- **Retention**: Last 30 backups
- **Trigger**: On startup and periodically

### 8.3 Recovery

1. Navigate to **Settings** > **Restore**.
2. Browse to the backup file.
3. Click **Restore**.
4. The application restarts with the restored database.

---

## 9. Uninstallation

1. Stop the AurumOS application if running.
2. Delete the `C:\AurumOS\` folder.
3. Optionally, delete the database folder if no longer needed.
4. Remove any AurumOS shortcuts from Desktop and Start Menu.

**Note**: Uninstalling does NOT automatically delete your database. Back up your data before removing the installation folder.

---

## 10. Troubleshooting

### 10.1 Common Installation Issues

| Issue | Solution |
|-------|----------|
| "WebView2 not found" | Install Microsoft Edge WebView2 Runtime from Microsoft |
| "Access denied" during install | Run as Administrator |
| App won't start | Ensure `.NET Framework 4.8+` is installed |
| License key rejected | Check internet connection and key format |

### 10.2 Getting Help

- Check the **Troubleshooting Guide** (08_troubleshooting_guide.md)
- Use the **In-App AI Support** assistant
- Contact support through the Settings page
