# Activity Tracker Desktop App - Development Notes

## Project Generation

This project was auto-generated following the full development specification for building a cross-platform Activity Tracker Analysis desktop application.

## Architecture Overview

### Electron Main Process (`electron/`)

1. **main.ts** - Application initialization, window management, IPC handlers
2. **db-reader.ts** - Automatic SQLite database discovery and JSON export
3. **analyzer.ts** - Complete analysis engine (port of analysis.py logic)
4. **config.ts** - Configuration management
5. **preload.ts** - Secure context bridge for IPC

### React Frontend (`src/`)

1. **App.tsx** - Main application with tab navigation
2. **Dashboard.tsx** - Single-day detailed analysis view
3. **Summary.tsx** - Multi-day analytics and trends
4. **Settings.tsx** - Configuration management UI
5. **ui/** - shadcn/ui component library

## Key Features Implemented

✅ Automatic ActivityTracker DB discovery
✅ Automated JSON export (no DB Browser needed)
✅ Fernet decryption implementation
✅ Complete analysis metrics calculation
✅ Modern UI with TailwindCSS + shadcn/ui
✅ Interactive charts with Recharts
✅ Dark mode support
✅ Configuration management
✅ Data refresh capability
✅ Windows NSIS installer support

## Running the Application

### Development Mode

```bash
# Install dependencies
npm install

# Rebuild native modules for Electron (required after npm install)
npx electron-rebuild

# Run in development
npm run electron:dev
```

### Production Build

```bash
# Build for Windows
npm run electron:build
```

## Configuration Required

Before first use, configure in Settings:

1. **Decryption Key** - Your Fernet encryption key from ActivityTracker
2. **Hostname** - Your Hostname for data filtering

## Database Structure Expected

The app expects ActivityTracker SQLite database with tables containing:

- date
- employee_id
- duration (encrypted)
- afk (encrypted)
- start_time
- end_time

## IPC Communication

Main ↔ Renderer communication via:

- `db:discover` - Find database path
- `db:export-json` - Export to JSON
- `analysis:get-dates` - Get available dates
- `analysis:run-single-date` - Analyze one day
- `analysis:run-multi-date` - Analyze multiple days
- `config:get` - Get configuration
- `config:set` - Save configuration
- `app:refresh` - Refresh all data

## Build Output

Windows installer created in `release/` with:

- Executable installer (.exe)
- Unpacked application files
- Auto-update support ready

## Security Considerations

- All processing happens locally
- No external network calls
- Decryption key stored locally only
- Context isolation enabled
- Node integration disabled in renderer

## Future Enhancements

Potential additions:

- Export reports to PDF/CSV
- Custom date range selection
- Calendar view for date picking
- More chart types
- Notification system
- Auto-refresh on DB changes (file watcher)
- Multi-employee comparison
- Goals and targets setting

## Troubleshooting

Common issues and solutions documented in DESKTOP-README.md

## Dependencies Summary

**Production:**

- electron - App framework
- react/react-dom - UI library
- better-sqlite3 - Native SQLite interface (requires electron-rebuild)
- fernet - Encryption
- recharts - Charts
- lucide-react - Icons
- date-fns - Date utilities

**Development:**

- vite - Build tool
- typescript - Type safety
- tailwindcss - Styling
- electron-builder - Packaging
- electron-rebuild - Native module compilation
- Various @radix-ui components for shadcn/ui

## Notes

- CSS lint warnings for @tailwind directives are expected (PostCSS plugin handles them)
- The app auto-creates app-config.json in %APPDATA%\activity-tracker-desktop\ on first run
- activity.json is generated automatically from database to %APPDATA%\activity-tracker-desktop\
- Database location: %APPDATA%\Roaming\ActivityTracker\local_activity.db
- better-sqlite3 requires electron-rebuild after npm install
- Python scripts (analysis.py, etc.) remain functional for CLI usage

## Production Build Status

**Current Release**: v1.0.0

**Build Date**: November 2025

**Installer Size**: 91 MB (NSIS), 124 MB (ZIP)

**Test Status**: ✅ All features verified working

**Verified Metrics**:

- Database records: 22,803
- Analysis working: Single-day and multi-day
- Decryption: All encrypted fields processed correctly
- Charts: Recharts displaying properly
- IPC: All channels functional
