import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { app } from 'electron'

export interface Config {
    decryptionKey: string
    employeeId: string
    dbPath?: string
}

// Store config in user's AppData folder instead of Program Files
const CONFIG_PATH = path.join(app.getPath('userData'), 'app-config.json')
const AGENT_KEY_PATH = path.join(
    os.homedir(),
    'AppData',
    'Roaming',
    'ActivityTracker',
    'agent.key'
)

const DEFAULT_CONFIG: Config = {
    decryptionKey: '',
    employeeId: '',
}

export async function getConfig(): Promise<Config> {
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf-8')
        return { ...DEFAULT_CONFIG, ...JSON.parse(content) }
    } catch {
        // Return defaults if file doesn't exist
        return DEFAULT_CONFIG
    }
}

export async function setConfig(newConfig: Partial<Config>): Promise<void> {
    const currentConfig = await getConfig()
    const updatedConfig = { ...currentConfig, ...newConfig }
    await fs.writeFile(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2))
}

export async function initializeConfig(): Promise<Config> {
    console.log('[Config] Initializing configuration...')
    const currentConfig = await getConfig()
    let updated = false

    // 1. Auto-detect Hostname (Employee ID)
    if (!currentConfig.employeeId) {
        try {
            currentConfig.employeeId = os.hostname()
            updated = true
            console.log('[Config] Auto-detected hostname:', currentConfig.employeeId)
        } catch (error) {
            console.error('[Config] Failed to detect hostname:', error)
        }
    }

    // 2. Auto-detect Decryption Key from agent.key
    if (!currentConfig.decryptionKey) {
        try {
            await fs.access(AGENT_KEY_PATH)
            const key = await fs.readFile(AGENT_KEY_PATH, 'utf-8')
            if (key && key.trim()) {
                currentConfig.decryptionKey = key.trim()
                updated = true
                console.log('[Config] Auto-detected decryption key from agent.key')
            }
        } catch (error) {
            console.warn('[Config] agent.key not found or inaccessible at:', AGENT_KEY_PATH)
        }
    }

    if (updated) {
        await setConfig(currentConfig)
    }

    return currentConfig
}
