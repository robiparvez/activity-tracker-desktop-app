import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { app } from 'electron'
import Database from 'better-sqlite3'

const DB_PATH = path.join(
    os.homedir(),
    'AppData',
    'Roaming',
    'ActivityTracker',
    'local_activity.db'
)

// Use userData directory for JSON output (writable location)
const JSON_OUTPUT_PATH = path.join(app.getPath('userData'), 'activity.json')

export async function discoverDatabase(): Promise<string> {
    try {
        await fs.access(DB_PATH)
        return DB_PATH
    } catch {
        throw new Error(
            `ActivityTracker database not found at: ${DB_PATH}\n\n` +
            'Please ensure ActivityTracker is installed and has generated data.'
        )
    }
}

function serializeValue(value: any): any {
    // Convert Buffer to base64 string for JSON serialization
    if (Buffer.isBuffer(value)) {
        return value.toString('base64')
    }
    return value
}

export async function exportToJson(): Promise<string> {
    try {
        const dbPath = await discoverDatabase()
        console.log('Exporting database using better-sqlite3...')

        // Open database with better-sqlite3
        const db = new Database(dbPath, { readonly: true })

        // Calculate date 10 days ago for manageable dataset
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
        const tenDaysAgoStr = tenDaysAgo.toISOString().split('T')[0]

        // Get all tables
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>

        const data: Record<string, any[]> = {}

        for (const { name: tableName } of tables) {
            if (tableName === 'sqlite_sequence') {
                continue
            }

            // Check if table has start_time column
            const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
            const hasStartTime = tableInfo.some(col => col.name === 'start_time')

            // Build query
            const query = hasStartTime
                ? `SELECT * FROM ${tableName} WHERE start_time >= ?`
                : `SELECT * FROM ${tableName}`

            // Execute query
            const rows = hasStartTime
                ? db.prepare(query).all(tenDaysAgoStr)
                : db.prepare(query).all()

            // Serialize values (convert buffers to base64)
            data[tableName] = rows.map((row: any) => {
                const serialized: Record<string, any> = {}
                for (const [key, value] of Object.entries(row)) {
                    serialized[key] = serializeValue(value)
                }
                return serialized
            })
        }

        // Close database
        db.close()

        // Write to JSON file
        await fs.writeFile(JSON_OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8')

        console.log('Database export completed:', JSON_OUTPUT_PATH)
        return JSON_OUTPUT_PATH
    } catch (error) {
        console.error('Database export failed:', error)
        throw new Error(`Failed to export database: ${(error as Error).message}`)
    }
}

export async function readActivityData(): Promise<any[]> {
    try {
        const content = await fs.readFile(JSON_OUTPUT_PATH, 'utf-8')
        const data = JSON.parse(content)

        // Assuming the main table is 'activities' or similar
        // Adjust based on actual table name in ActivityTracker DB
        return data.activities || data.activity || Object.values(data)[0] || []
    } catch (error) {
        throw new Error('Failed to read activity data. Please export the database first.')
    }
}
