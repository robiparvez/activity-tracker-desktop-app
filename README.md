# Activity Tracker Analysis

Activity Tracker Analysis is a powerful desktop application designed to provide deep insights into your work habits and productivity. It automatically analyzes data from the "ActivityTracker" local database, offering detailed daily breakdowns and long-term trends.

## 🚀 Key Features

- **Automatic Configuration**: Zero-touch setup! The app automatically detects your:
  - ActivityTracker SQLite database path.
  - Decryption key (`agent.key`) for secure data access.
  - System hostname (Employee ID) for personalized analysis.
- **Deep Daily Analysis**:
  - Track active, inactive, and AFK (Away From Keyboard) hours.
  - Visualize your day with interactive pie and bar charts.
  - Get a productivity rating (Excellent, Good, or Needs Improvement) based on your activity rate and total hours.
- **Multi-Day Summary**:
  - View trends over the **last 30 days**.
  - Analyze activity rates and hours distribution across multiple days.
  - Track your average daily performance.
- **Real-time Data Sync**: Refresh data at any time to get the latest insights directly from your local database.
- **Modern UI/UX**: A sleek, responsive interface built with Tailwind CSS and Shadcn UI, featuring smooth animations and clear data visualizations.

## 🛠️ Technical Stack

### Frontend

- **Framework**: [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend (Electron)

- **Runtime**: [Electron](https://www.electronjs.org/) & [Node.js](https://nodejs.org/)
- **Database**: [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)
- **Decryption**: [Fernet](https://github.com/fernet/fernet-node) (for secure data handling)
- **Build Tool**: [Vite](https://vitejs.dev/) with `vite-plugin-electron`

## 📂 Project Structure

```text
├── electron/               # Main process logic
│   ├── main.ts             # Electron entry point & IPC handlers
│   ├── db-reader.ts        # SQLite database interaction & data export
│   ├── analyzer.ts         # Data analysis & productivity logic
│   ├── config.ts           # Automatic configuration management
│   └── preload.ts          # Preload script for secure IPC
├── src/                    # Frontend React application
│   ├── components/         # UI components (Dashboard, Summary, Settings)
│   ├── hooks/              # Custom React hooks for data & logic
│   ├── lib/                # Utility functions
│   └── App.tsx             # Main application component
└── package.json            # Project dependencies & scripts
```

## ⚙️ Data Analysis Logic

- **30-Day Window**: To ensure performance and relevance, the application focuses on the most recent 30 days of activity.
- **Productivity Metrics**:
  - **Excellent 🟢**: Activity rate ≥ 80% AND total hours ≥ 6.
  - **Good 🟡**: Activity rate ≥ 60% AND total hours ≥ 4.
  - **Needs Improvement 🔴**: Otherwise.

## Development & Build

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/)

### Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

### Run in Development

```bash
npm run electron:dev
```

### Build for Production

```bash
npm run electron:build
```

The installer will be generated in the `release/` directory.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
