# Activity Tracker Desktop Application

This folder contains the Electron + React desktop application for Activity Tracker analysis.

## Quick Start

### Prerequisites

- Node.js 18+ required

### Installation

```bash
npm install
```

### Development

```bash
npm run electron:dev
```

### Build

```bash
npm run electron:build
```

The installer will be created in the `release/` directory.

## Documentation

- **README.md** - This file (quick start)
- **INSTALLATION-GUIDE.md** - Detailed setup instructions
- **DEVELOPMENT-NOTES.md** - Technical architecture details

## Configuration

On first run, configure your settings:

1. Open Settings tab
2. Enter your Fernet decryption key
3. Enter your Hostname
4. Save configuration

## Project Structure

```text
├── electron/              # Electron main process
│   ├── main.ts           # App initialization & IPC
│   ├── preload.ts        # Context bridge
│   ├── db-reader.ts      # SQLite database handler
│   ├── analyzer.ts       # Analysis logic
│   └── config.ts         # Configuration management
├── src/                   # React frontend
│   ├── components/       # React components
│   │   ├── Dashboard.tsx
│   │   ├── Summary.tsx
│   │   ├── Settings.tsx
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── package.json          # Dependencies
├── vite.config.ts        # Build configuration
├── tsconfig.json         # TypeScript config
└── index.html           # HTML entry point
```

## Features

- 🔍 Automatic ActivityTracker database discovery
- 📊 Modern dashboard with interactive charts
- 📈 Multi-day analytics and trends
- ⚙️ Easy configuration interface
- 🎨 Beautiful UI with TailwindCSS + shadcn/ui
- 🔄 One-click data refresh

## Tech Stack

**Frontend:** React 18 + TypeScript + TailwindCSS + shadcn/ui
**Backend:** Electron + Node.js + better-sqlite3
**Charts:** Recharts
**Build:** Vite + electron-builder

## Support

See the documentation files for detailed information or check the parent directory's README.md for Python CLI alternative.
