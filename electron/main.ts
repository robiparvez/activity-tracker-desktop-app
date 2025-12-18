import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { DuckDBService } from './duckdb-service'
import { analyzeSingleDate, analyzeMultiDate, getAvailableDates } from './analyzer'
import { getConfig, setConfig, initializeConfig, Config } from './config'

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Activity Tracker Analysis',
        backgroundColor: '#0f172a',
        show: false,
    })

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show()
    })

    // VITE_DEV_SERVER_URL is set by vite-plugin-electron
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
        mainWindow.webContents.openDevTools()
    } else {
        // In production, load from dist folder
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(async () => {
    createWindow()

    // Initialize DuckDB
    try {
        await DuckDBService.getInstance().attachDatabase()
    } catch (error) {
        console.error('Failed to initialize DuckDB:', error)
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// IPC Handlers
ipcMain.handle('db:discover', async () => {
    try {
        const dbPath = await DuckDBService.getInstance().discoverDatabase()
        // Ensure it's attached
        await DuckDBService.getInstance().attachDatabase()
        return { success: true, path: dbPath }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})



ipcMain.handle('analysis:get-dates', async () => {
    try {
        const config = await getConfig()
        const dates = await getAvailableDates(config)
        return { success: true, dates }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('analysis:run-single-date', async (_event, date: string) => {
    try {
        const config = await getConfig()
        const result = await analyzeSingleDate(date, config)
        return { success: true, data: result }
    } catch (error) {
        console.error('[IPC] analysis:run-single-date error:', error)
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('analysis:run-multi-date', async (_event, dates: string[]) => {
    try {
        const config = await getConfig()
        const result = await analyzeMultiDate(dates, config)
        return { success: true, data: result }
    } catch (error) {
        console.error('[IPC] analysis:run-multi-date error:', error)
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('config:get', async () => {
    try {
        const config = await getConfig()
        return { success: true, config }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('config:initialize', async () => {
    try {
        const config = await initializeConfig()
        return { success: true, config }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('config:set', async (_event, newConfig: Partial<Config>) => {
    try {
        await setConfig(newConfig)
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('app:refresh', async () => {
    try {
        // Re-attach DB to ensure we have latest data (if file changed)
        await DuckDBService.getInstance().attachDatabase()

        const config = await getConfig()
        const dates = await getAvailableDates(config)
        return { success: true, dates }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})
