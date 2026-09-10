# AurumOS - Release Notes

## Version 1.0.2 (Current)

**Release Date**: August 2026

### New Features
- **BASTION AI Security System**: 5-thread background security monitor with auto-suspension
- **Forensic PDF Reports**: Automatic report generation on security events
- **One-Time Unlock Keys**: Nonce-based unlock system for recovering from auto-suspension
- **Self-Learning Thresholds**: BASTION learns normal behavior patterns over 30 days
- **Health Dashboard**: Remote monitoring endpoint for fleet management

### Improvements
- **Improved sync reliability**: Better conflict detection and resolution in LAN sync
- **Scale widget**: Real-time weight display with auto-baud detection
- **Tag generation**: Faster thermal printer output with QR code support
- **AI assistant**: Upgraded to LLaMA 3.3 70B via Groq API

### Bug Fixes
- Fixed crash when WebView2 async operations fail (.NET exception suppression)
- Fixed UTF-8 encoding issues on Windows systems with non-English locales
- Fixed registry session token corruption causing false login prompts
- Fixed WAL file growth issue in SQLite during heavy sync operations

### Security
- Added hardware fingerprinting (motherboard serial hash)
- Added progressive threat escalation (WARN → RESTRICT → SUSPEND)
- Added DB watchdog for detecting external database modifications
- Added session guard for registry token validation

---

## Version 1.0.1

**Release Date**: July 2026

### New Features
- **Multi-PC LAN Sync**: Real-time data synchronization between multiple computers
- **Network Mode**: Host/Client architecture for multi-shop management
- **UDP Discovery**: Automatic peer detection on local network
- **Subscription Plans**: Lite, Pro, and Enterprise tiers

### Improvements
- **Faster startup**: Optimized database initialization and config loading
- **Better error handling**: Graceful degradation when server is unreachable
- **Offline grace period**: 24-hour subscription cache for offline use

### Bug Fixes
- Fixed duplicate bill numbering when multiple PCs sync simultaneously
- Fixed stock conflict detection for items sold on different PCs
- Fixed printer selection not persisting across sessions

---

## Version 1.0.0

**Release Date**: June 2026

### Initial Release

#### Core Features
- **Wholesale Billing**: Full-featured bill creation with item selection, discount, tax
- **POS Billing**: Quick retail point-of-sale
- **Inventory Management**: Stock tracking with tag IDs, weight, touch, HUID
- **Client Ledger**: Double-entry credit ledger (metal + cash)
- **Karigar Management**: Artisan job tracking
- **Katti Vouchers**: Manufacturing job vouchers
- **Cash & Bank**: Cash flow and bank account management
- **Chart of Accounts**: Double-entry accounting
- **Staff Management**: Multi-user with role-based permissions

#### Infrastructure
- **SQLite Database**: Local-first data storage with WAL mode
- **pywebview UI**: Native desktop window with web-based frontend
- **Thermal Printer Support**: Tag printing with QR codes
- **Weighing Scale Integration**: Real-time COM port weight reading
- **Auto Updates**: GitHub-based version management

#### Security
- **License Key System**: Machine-locked license validation
- **Login Lockout**: 5-minute lockout after 3 failed attempts
- **Session Management**: Windows registry-based session tokens
- **Database Encryption**: XOR-encrypted license key storage

---

## Version Roadmap

### Version 1.1.0 (Planned)

- Cloud backup integration
- Enhanced reporting with PDF export
- Barcode scanning support
- Multi-currency support
- Tax invoice templates

### Version 1.2.0 (Planned)

- Mobile app companion (Android/iOS)
- SMS/WhatsApp bill delivery
- Customer portal for balance inquiries
- Advanced analytics dashboard
- Inventory valuation methods (FIFO, weighted average)

### Version 2.0.0 (Future)

- Full ERP suite integration
- Multi-location inventory
- Supply chain management
- E-commerce integration
- AI-powered sales forecasting

---

## Upgrade Notes

### Upgrading from 1.0.1 to 1.0.2

1. Back up your database before upgrading.
2. Download the new `AurumOS.exe` and `_internal/` folder.
3. Replace old files (do NOT replace `database/`, `config.json`, or `logs/`).
4. The database schema is automatically migrated on first launch.
5. BASTION AI starts learning your patterns from day one.

### Upgrading from 1.0.0 to 1.0.1

1. Back up your database.
2. Replace application files.
3. If using multi-PC, configure `config.json` with network settings.
4. No schema migration required.

---

## Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| Scale widget may not detect COM ports on some USB adapters | Open | Try different USB ports; use native serial port |
| Thermal printer alignment may vary by model | Open | Adjust margins in Settings > Printer |
| BASTION may false-positive on first-time external DB edits | Open | Use the unlock code system to restore |
| LAN sync may lag during heavy concurrent edits | Open | Use Host/Client mode with defined roles |

---

## Support

- **Documentation**: See `docs/` folder
- **In-App AI**: Use the AI Support assistant
- **Email**: Contact through Settings > Support
- **GitHub**: Report issues at the project repository
