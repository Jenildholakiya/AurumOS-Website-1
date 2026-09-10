# AurumOS - Troubleshooting Guide

## 1. General Issues

### 1.1 Application Won't Start

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Double-click does nothing | Missing WebView2 Runtime | Install [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) |
| Error: "Application failed to initialize" | Missing .NET Framework | Install .NET Framework 4.8+ from Microsoft |
| Error: "api-ms-win-core..." | Missing Visual C++ Redistributable | Install VC++ Redistributable 2015-2022 |
| Black screen on launch | WebView2 GPU acceleration issue | Add `--disable-gpu` to launch arguments |
| Crash immediately on start | Corrupted config.json | Delete `config.json` and restart (defaults will be restored) |

### 1.2 Login Issues

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| "Invalid username or password" | Wrong credentials | Verify username/password; check Caps Lock |
| Locked out for 5 minutes | Too many failed attempts | Wait 5 minutes; contact owner to reset password |
| Login succeeds but dashboard doesn't load | Corrupted session token | Delete `database/.setup_complete` and re-run setup |
| "License key invalid" after login | License expired or revoked | Check license status in Settings; contact support |

---

## 2. Database Issues

### 2.1 Database Errors

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| "Database is locked" | Concurrent write conflict | Close other instances; restart AurumOS |
| "Disk I/O error" | Full disk or corrupted DB | Check disk space; run `PRAGMA integrity_check` |
| "no such table" | Schema migration failed | Restore from backup; contact support |
| "UNIQUE constraint failed" | Duplicate entry | Check for existing records with same key |
| Database file is 0 bytes | Crash during write | Restore from `database/backups/` |

### 2.2 Database Recovery

#### Check Database Integrity
```sql
PRAGMA integrity_check;
```

#### Recover from WAL
```sql
PRAGMA wal_checkpoint(TRUNCATE);
```

#### Manual Backup
1. Stop AurumOS
2. Copy `database/aurum_local.db` to a safe location
3. Also copy `database/aurum_local.db-wal` and `database/aurum_local.db-shm` if they exist

#### Restore from Backup
1. Stop AurumOS
2. Navigate to `database/backups/`
3. Find the most recent backup file
4. Copy it to `database/aurum_local.db`
5. Restart AurumOS

---

## 3. Network / Sync Issues

### 3.1 LAN Discovery

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| PCs can't find each other | Firewall blocking UDP 58902 | Add firewall rule for UDP 58902 |
| Discovery works but sync fails | Firewall blocking TCP 58901 | Add firewall rule for TCP 58901 |
| Intermittent sync failures | Network instability | Check cable/WiFi; reduce sync frequency |
| "Connection refused" | Host PC not running sync server | Ensure `config.json` has `"mode": "server"` on host |

### 3.2 Firewall Rules

```powershell
# Run in Administrator PowerShell
New-NetFirewallRule -DisplayName "AurumOS Sync" -Direction Inbound -LocalPort 58901 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "AurumOS Discovery" -Direction Inbound -LocalPort 58902 -Protocol UDP -Action Allow
New-NetFirewallRule -DisplayName "AurumOS Network" -Direction Inbound -LocalPort 7272 -Protocol TCP -Action Allow
```

### 3.3 Sync Conflicts

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Duplicate records after sync | Concurrent edits on both PCs | Resolve via sync_conflicts table |
| Data missing after sync | Version mismatch | Check `sync_state` table; re-sync |
| "Double sell" conflict | Same item sold on two PCs | Manual resolution required; see conflict details |

### 3.4 Network Mode Issues

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Client can't register | Host not in network mode | Set `"mode": "server"` on host |
| Access denied on client | Permission not granted | Check `brain_guard.py` access rules |
| Nodes can't communicate | Different shop IDs | Ensure all PCs share the same `shop_id` |

---

## 4. Printing Issues

### 4.1 Printer Not Found

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Printer not in dropdown | Driver not installed | Install manufacturer's printer driver |
| Wrong printer selected | Default printer changed | Re-select printer in Settings > Printer |
| Print job goes to wrong printer | Printer name mismatch | Verify printer name in Windows Settings |

### 4.2 Print Quality Issues

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Blurry tag images | Low resolution | Increase tag image size in settings |
| Cropped content | Paper size mismatch | Match paper size in AurumOS and printer settings |
| Thermal printer garbled output | Baud rate mismatch | Adjust baud rate in scale/printer settings |
| QR code not scanning | Image too small | Increase QR code size in tag settings |

### 4.3 Thermal Printer Specific

| Symptom | Solution |
|---------|----------|
| Paper jams | Use correct paper width (58mm or 80mm) |
| Faded print | Replace thermal paper or adjust density |
| Half-printed tags | Check paper alignment |
| Printer not responding | Verify COM port and baud rate |

---

## 5. Weighing Scale Issues

### 5.1 Scale Not Detected

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| No COM ports found | USB adapter not recognized | Install USB-to-Serial driver |
| COM port found but no data | Wrong baud rate | Try different baud rates (4800, 9600, 19200) |
| Intermittent readings | Loose connection | Check cable connections |
| Weight fluctuates wildly | Scale not stable | Ensure scale is on flat surface; wait for stabilization |

### 5.2 Scale Calibration

1. Ensure scale is warmed up (5-10 minutes)
2. Place a known weight on the scale
3. Compare AurumOS reading with scale display
4. If mismatch, check baud rate and data format

---

## 6. License & Subscription Issues

### 6.1 License Key Problems

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| "Invalid license key" | Wrong format | Ensure key is `AU-XXXX-XXXX-XXXX-XXXX` (22 chars) |
| "Key already activated" | Key used on another PC | Deactivate on old PC first; contact support |
| "Key revoked" | Key was revoked | Contact support for reactivation |
| License check fails offline | No internet + expired cache | Connect to internet; wait 24h for cache to expire |

### 6.2 Subscription Issues

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Features disabled | Plan expired | Renew subscription via Settings |
| Wrong plan shown | Cache stale | Click "Sync Subscription" in Settings |
| Can't renew | Server unreachable | Check internet; try again later |
| Downgraded to Lite | Subscription expired | Renew to restore Pro/Enterprise features |

### 6.3 Auto-Suspension (Bastion)

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| App suspended with lock screen | Bastion detected a threat | Generate unlock key via Settings > Bastion |
| "Suspension triggered" message | DB tamper or security event | Use one-time unlock code |
| Can't generate unlock key | Nonce exhausted | Contact support for manual unlock |

#### Generating an Unlock Key
1. On a **different, clean PC**, run the unlock key generator
2. Enter the locked PC's machine ID and today's date
3. Generate the unlock code
4. Enter the code on the locked PC's bastion keygen screen

---

## 7. UI / Display Issues

### 7.1 Rendering Problems

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Blank white screen | WebView2 not loading | Reinstall WebView2 Runtime |
| UI elements misaligned | Display scaling issues | Set Windows display scaling to 100% or 125% |
| Fonts look wrong | Missing custom fonts | Ensure `fonts/` folder exists with required fonts |
| Dark mode not working | CSS not loading | Clear browser cache (WebView2 uses Edge cache) |

### 7.2 JavaScript Errors

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| "pywebview.api is undefined" | Boot shim didn't load | Ensure `boot.js` is present in `ui/` folder |
| Actions do nothing | API bridge disconnected | Restart AurumOS |
| "TypeError: Cannot read property" | Page loaded before API ready | Check `boot.js` initialization |

---

## 8. Update Issues

### 8.1 Update Failures

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Update download fails | No internet | Check connection; try manual download |
| Update installs but version unchanged | Staging folder not applied | Delete `_update_staging/` and retry |
| App crashes after update | Corrupted update | Restore from backup; reinstall |
| "Version mismatch" error | Manual file replacement | Ensure all files are from the same version |

### 8.2 Manual Update Procedure

1. Stop AurumOS
2. Back up `database/`, `config.json`, `logs/`
3. Download latest release
4. Replace `AurumOS.exe` and `_internal/` folder
5. **Do NOT** replace protected files
6. Restart AurumOS

---

## 9. Performance Issues

### 9.1 Slow Operation

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| Slow startup | Large database | Vacuum database: `VACUUM;` |
| Slow bill creation | Too many stock items | Add indexes; archive old records |
| High memory usage | Multiple browser windows | Close unused pages |
| Laggy UI | WebView2 GPU issue | Disable hardware acceleration |

### 9.2 Database Optimization

```sql
-- Reclaim space
VACUUM;

-- Analyze for query optimization
ANALYZE;

-- Check database size
SELECT page_count * page_size as size_bytes FROM pragma_page_count(), pragma_page_size();
```

---

## 10. Log Analysis

### 10.1 Finding Relevant Logs

```powershell
# View recent errors
Get-Content "C:\AurumOS\logs\error.log" -Tail 50

# Search for specific errors
Select-String -Path "C:\AurumOS\logs\*.log" -Pattern "ERROR" -Context 2

# Find sync issues
Select-String -Path "C:\AurumOS\logs\sync.log" -Pattern "failed"
```

### 10.2 Common Log Messages

| Message | Meaning | Action |
|---------|---------|--------|
| `Database is locked` | Write conflict | Restart AurumOS |
| `Connection refused` | Peer unreachable | Check network/firewall |
| `Session token expired` | Normal (auto-regenerated) | No action needed |
| `BASTION: DB tamper detected` | External DB edit found | Investigate; may be false positive |
| `Auto-healed: WAL checkpoint` | Normal maintenance | No action needed |

---

## 11. Getting Help

### 11.1 In-App AI

Click the **AI Support** icon in the sidebar for instant help with common questions.

### 11.2 Support Contact

1. Navigate to **Settings** > **Support**
2. Fill in the support form
3. Include:
   - AurumOS version (`1.0.2`)
   - Windows version
   - Description of the issue
   - Screenshots if possible
   - Relevant log excerpts

### 11.3 Information to Provide

When contacting support, always include:
- **AurumOS version**: Found in Settings > About
- **Windows version**: Windows 10/11 + build number
- **Error message**: Exact text of any error
- **Steps to reproduce**: What you did before the error
- **Log files**: From `logs/` folder
- **Database size**: Right-click `aurum_local.db` > Properties

---

## 12. Emergency Procedures

### 12.1 Database Corruption

1. Stop AurumOS immediately
2. Copy `aurum_local.db` to a backup location
3. Try opening with a SQLite browser to check integrity
4. Restore from the most recent backup in `database/backups/`
5. If no backup exists, contact support with the corrupted file

### 12.2 Complete System Failure

1. Install AurumOS on a new PC
2. Copy the `database/` folder from the old PC
3. Copy `config.json` and `db_path.txt`
4. Launch AurumOS - it should recognize the existing database
5. Re-activate license if needed

### 12.3 Ransomware/Malware

1. Disconnect the PC from the network immediately
2. Do NOT pay any ransom
3. Check `database/backups/` for clean backups
4. Scan the backup files with antivirus before restoring
5. Contact support for assistance
