import path from 'path'
import fs from 'fs/promises'
import { createWriteStream } from 'fs'
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
    if (Buffer.isBuffer(value)) {
        return value.toString('base64')
    }
    return value
}

export interface ProgressData {
    status: string;
    progress: number;
    total?: number;
    current?: number;
    tableName?: string;
    elapsedMs?: number;
    memoryUsageMb?: number;
}

export class DatabaseService {
    private static instance: DatabaseService;
    private isCancelled: boolean = false;
    private exportPromise: Promise<string> | null = null;

    private constructor() {}

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public cancel() {
        this.isCancelled = true;
    }

    private createConnection(): Database.Database {
        try {
            const db = new Database(DB_PATH, {
                readonly: true,
                timeout: 30000,
                fileMustExist: true
            });
            db.pragma('busy_timeout = 30000');
            return db;
        } catch (error) {
            console.error('[DatabaseService] Connection failed:', error);
            throw error;
        }
    }

    private getThirtyDaysAgoThreshold(): string {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return thirtyDaysAgo.toISOString().split('T')[0];
    }

    private async writeAsync(stream: any, data: string): Promise<void> {
        if (!stream.write(data)) {
            await new Promise(resolve => stream.once('drain', resolve));
        }
    }

    public async exportAllData(onProgress?: (data: ProgressData) => void): Promise<string> {
        if (this.exportPromise) {
            console.log('[DatabaseService] Export already in progress, waiting for it to complete...');
            return this.exportPromise;
        }

        this.exportPromise = (async () => {
            const startTime = Date.now();
            let totalRecordsProcessed = 0;
            this.isCancelled = false;
            this.isCancelled = false;

            let db: Database.Database | null = null;

        try {
            db = this.createConnection();
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;

            const dateThreshold = this.getThirtyDaysAgoThreshold();

            const writeStream = createWriteStream(JSON_OUTPUT_PATH);
            await this.writeAsync(writeStream, '{\n');

            for (let i = 0; i < tables.length; i++) {
                const { name: tableName } = tables[i];
                if (tableName === 'sqlite_sequence') continue;
                if (this.isCancelled) throw new Error('Operation cancelled by user');

                const info = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
                const hasStartTime = info.some(c => c.name === 'start_time');

                let countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
                let selectQuery = `SELECT * FROM ${tableName}`;

                if (hasStartTime) {
                    countQuery += ` WHERE start_time >= '${dateThreshold}'`;
                    selectQuery += ` WHERE start_time >= '${dateThreshold}'`;
                }

                const countResult = db.prepare(countQuery).get() as { count: number };
                const totalRows = countResult.count;

                onProgress?.({
                    status: `Preparing table: ${tableName}`,
                    progress: 0,
                    total: totalRows,
                    current: 0,
                    tableName
                });

                await this.writeAsync(writeStream, `  "${tableName}": [\n`);

                const stmt = db.prepare(selectQuery);
                let count = 0;

                for (const row of stmt.iterate()) {
                    if (this.isCancelled) throw new Error('Operation cancelled by user');

                    const serialized: Record<string, any> = {};
                    for (const [key, value] of Object.entries(row as any)) {
                        serialized[key] = serializeValue(value);
                    }

                    count++;
                    const isLastInTable = count === totalRows;
                    await this.writeAsync(writeStream, `    ${JSON.stringify(serialized)}${isLastInTable ? '' : ','}\n`);

                    if (count % 200 === 0 || isLastInTable) {
                        const progress = totalRows > 0 ? Math.min(100, Math.round((count / totalRows) * 100)) : 100;
                        onProgress?.({
                            status: `Loading ${tableName} (Last 30 Days)...`,
                            progress,
                            total: totalRows,
                            current: count,
                            tableName,
                            elapsedMs: Date.now() - startTime,
                            memoryUsageMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100
                        });
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                totalRecordsProcessed += count;
                const isLastTable = i === tables.length - 1;
                await this.writeAsync(writeStream, `  ]${isLastTable ? '' : ','}\n`);
            }

            await this.writeAsync(writeStream, '}\n');
            await new Promise<void>((resolve, reject) => {
                writeStream.on('finish', () => resolve());
                writeStream.on('error', reject);
                writeStream.end();
            });

            return JSON_OUTPUT_PATH;
        } catch (error) {
            console.error('[DatabaseService] Export failed:', error);
            throw error;
            } finally {
                this.exportPromise = null;
                if (db) db.close();
            }
        })();

        return this.exportPromise;
    }

    public async getActivitiesForDate(date: string, employeeId: string): Promise<any[]> {
        let db: Database.Database | null = null;
        try {
            db = this.createConnection();
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;

            let activityTable = '';
            for (const { name } of tables) {
                const info = db.prepare(`PRAGMA table_info(${name})`).all() as any[];
                if (info.some(c => c.name === 'employee_id') && info.some(c => c.name === 'start_time')) {
                    activityTable = name;
                    break;
                }
            }

            if (!activityTable) return [];

            const dateThreshold = this.getThirtyDaysAgoThreshold();
            const query = `SELECT * FROM ${activityTable} WHERE (employee_id = ? OR employee_id LIKE ?) AND start_time LIKE ? AND start_time >= ?`;
            const rows = db.prepare(query).all(employeeId, `%${employeeId}%`, `${date}%`, dateThreshold) as any[];

            return rows.map(row => {
                const serialized: Record<string, any> = {};
                for (const [key, value] of Object.entries(row)) {
                    serialized[key] = serializeValue(value);
                }
                return serialized;
            });
        } catch (error) {
            console.error('[DatabaseService] Query failed:', error);
            return [];
        } finally {
            if (db) db.close();
        }
    }

    public async getAvailableDates(employeeId: string): Promise<string[]> {
        let db: Database.Database | null = null;
        try {
            db = this.createConnection();
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;

            let activityTable = '';
            for (const { name } of tables) {
                const info = db.prepare(`PRAGMA table_info(${name})`).all() as any[];
                if (info.some(c => c.name === 'employee_id') && info.some(c => c.name === 'start_time')) {
                    activityTable = name;
                    break;
                }
            }

            if (!activityTable) return [];

            const dateThreshold = this.getThirtyDaysAgoThreshold();
            const query = `SELECT DISTINCT SUBSTR(start_time, 1, 10) as date FROM ${activityTable} WHERE (employee_id = ? OR employee_id LIKE ?) AND start_time >= ? ORDER BY date DESC`;
            const rows = db.prepare(query).all(employeeId, `%${employeeId}%`, dateThreshold) as Array<{ date: string }>;

            return rows.map(r => r.date);
        } catch (error) {
            console.error('[DatabaseService] Get dates failed:', error);
            return [];
        } finally {
            if (db) db.close();
        }
    }
}

export async function exportToJson(): Promise<string> {
    return DatabaseService.getInstance().exportAllData();
}

export async function readActivityData(): Promise<any[]> {
    try {
        const content = await fs.readFile(JSON_OUTPUT_PATH, 'utf-8')
        const data = JSON.parse(content)
        return data.activities || data.activity || Object.values(data)[0] || []
    } catch (error) {
        return [];
    }
}

export async function getActivitiesForDate(date: string, employeeId: string): Promise<any[]> {
    return DatabaseService.getInstance().getActivitiesForDate(date, employeeId);
}

export async function getAvailableDatesFromDb(employeeId: string): Promise<string[]> {
    return DatabaseService.getInstance().getAvailableDates(employeeId);
}
