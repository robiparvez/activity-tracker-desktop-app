import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { discoverDatabase, exportToJson } from './db-reader'
import { analyzeSingleDate, analyzeMultiDate, getAvailableDates } from './analyzer'
import { getConfig, setConfig, Config } from './config'

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

app.whenReady().then(() => {
    createWindow()

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
        const dbPath = await discoverDatabase()
        return { success: true, path: dbPath }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('db:export-json', async () => {
    try {
        const jsonPath = await exportToJson()
        return { success: true, path: jsonPath }
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
        console.log('[IPC] analysis:run-single-date called with date:', date)
        const config = await getConfig()
        console.log('[IPC] Config loaded:', { employeeId: config.employeeId, hasDecryptionKey: !!config.decryptionKey })
        const result = await analyzeSingleDate(date, config)
        console.log('[IPC] Analysis result:', result)
        return { success: true, data: result }
    } catch (error) {
        console.error('[IPC] analysis:run-single-date error:', error)
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('analysis:run-multi-date', async (_event, dates: string[]) => {
    try {
        console.log('[IPC] analysis:run-multi-date called with dates:', dates)
        const config = await getConfig()
        const result = await analyzeMultiDate(dates, config)
        console.log('[IPC] Multi-date analysis result:', result)
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
        await exportToJson()
        const config = await getConfig()
        const dates = await getAvailableDates(config)
        return { success: true, dates }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})
