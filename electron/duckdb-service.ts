import { Database } from 'duckdb-async';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const DB_PATH = path.join(
    os.homedir(),
    'AppData',
    'Roaming',
    'ActivityTracker',
    'local_activity.db'
);

export class DuckDBService {
    private static instance: DuckDBService;
    private db: Database | null = null;
    private isInitialized = false;

    private constructor() { }

    public static getInstance(): DuckDBService {
        if (!DuckDBService.instance) {
            DuckDBService.instance = new DuckDBService();
        }
        return DuckDBService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Initialize in-memory DuckDB
            this.db = await Database.create(':memory:');

            // Install and load sqlite extension
            // Note: In some environments, these might be pre-installed or require specific handling
            // For now, we attempt to install/load. If it fails, we might need a different approach.
            await this.db.exec('INSTALL sqlite; LOAD sqlite;');

            this.isInitialized = true;
            console.log('[DuckDB] Initialized successfully');
        } catch (error) {
            console.error('[DuckDB] Initialization failed:', error);
            throw error;
        }
    }

    public async discoverDatabase(): Promise<string> {
        try {
            await fs.access(DB_PATH);
            return DB_PATH;
        } catch {
            throw new Error(
                `ActivityTracker database not found at: ${DB_PATH}\n\n` +
                'Please ensure ActivityTracker is installed and has generated data.'
            );
        }
    }

    public async attachDatabase(): Promise<void> {
        if (!this.db) await this.initialize();

        try {
            // Check if already attached
            const databases = await this.db!.all("SELECT * FROM pragma_database_list WHERE name = 'sqlite_db'");
            if (databases.length > 0) {
                console.log('[DuckDB] Database already attached (checked)');
                return;
            }

            const dbPath = await this.discoverDatabase();
            // Attach the SQLite database
            // We use 'sqlite_db' as the alias for the attached database
            await this.db!.exec(`ATTACH '${dbPath.replace(/\\/g, '/')}' AS sqlite_db (TYPE SQLITE);`);
            console.log('[DuckDB] Attached SQLite database:', dbPath);
        } catch (error: any) {
            const errorMessage = error.message || error.toString();
            if (errorMessage.includes('already exists')) {
                console.log('[DuckDB] Database already attached');
            } else {
                console.error('[DuckDB] Failed to attach database:', error);
                console.error('[DuckDB] Error message:', errorMessage);
                throw error;
            }
        }
    }

    public async getRawActivities(employeeId: string, date?: string): Promise<any[]> {
        if (!this.db) throw new Error('DuckDB not initialized');

        try {
            // Find the correct table name dynamically
            // We look for a table that has 'employee_id' and 'start_time' columns
            const tables = await this.db.all("SELECT table_name as name FROM information_schema.tables WHERE table_catalog = 'sqlite_db'");

            let activityTable = '';
            for (const { name } of tables) {
                // Check columns for this table
                const columns = await this.db.all(`SELECT column_name as name FROM information_schema.columns WHERE table_catalog = 'sqlite_db' AND table_name = '${name}'`);
                const hasEmployeeId = columns.some((c: any) => c.name === 'employee_id');
                const hasStartTime = columns.some((c: any) => c.name === 'start_time');

                if (hasEmployeeId && hasStartTime) {
                    activityTable = name;
                    break;
                }
            }

            if (!activityTable) {
                console.warn('[DuckDB] No valid activity table found');
                return [];
            }

            let query = `
                SELECT
                    start_time,
                    duration_seconds,
                    is_afk
                FROM sqlite_db.${activityTable}
                WHERE (employee_id = ? OR employee_id LIKE ?)
            `;

            const params: any[] = [employeeId, `%${employeeId}%`];

            if (date) {
                query += ` AND start_time LIKE ?`;
                params.push(`${date}%`);
            }

            // Order by start_time
            query += ` ORDER BY start_time ASC`;

            const rows = await this.db.all(query, ...params);
            return rows;

        } catch (error) {
            console.error('[DuckDB] Query failed:', error);
            throw error;
        }
    }

    public async getAvailableDates(employeeId: string): Promise<string[]> {
        if (!this.db) throw new Error('DuckDB not initialized');

        try {
            // Find the correct table name dynamically
            const tables = await this.db.all("SELECT table_name as name FROM information_schema.tables WHERE table_catalog = 'sqlite_db'");

            let activityTable = '';
            for (const { name } of tables) {
                const columns = await this.db.all(`SELECT column_name as name FROM information_schema.columns WHERE table_catalog = 'sqlite_db' AND table_name = '${name}'`);
                const hasEmployeeId = columns.some((c: any) => c.name === 'employee_id');
                const hasStartTime = columns.some((c: any) => c.name === 'start_time');

                if (hasEmployeeId && hasStartTime) {
                    activityTable = name;
                    break;
                }
            }

            if (!activityTable) return [];

            const query = `
                SELECT DISTINCT strftime(CAST(start_time AS TIMESTAMP), '%Y-%m-%d') as date
                FROM sqlite_db.${activityTable}
                WHERE (employee_id = ? OR employee_id LIKE ?)
                ORDER BY date DESC
            `;

            const rows = await this.db.all(query, employeeId, `%${employeeId}%`);
            return rows.map((r: any) => r.date);

        } catch (error) {
            console.error('[DuckDB] Get dates failed:', error);
            return [];
        }
    }
}
