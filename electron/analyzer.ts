import { DuckDBService } from './duckdb-service'
import { Config } from './config'
import * as crypto from 'crypto'

interface DailyAnalysis {
    date: string
    totalHours: number
    activeHours: number
    inactiveHours: number
    afkHours: number
    activityRate: number
    startTime: string
    endTime: string
    productivity: 'excellent' | 'good' | 'needs-improvement'
    productivityEmoji: string
}

interface MultiDayAnalysis {
    totalDays: number
    totalActiveHours: number
    totalTrackedHours: number
    totalInactiveHours: number
    averageActiveHours: number
    averageTotalHours: number
    averageInactiveHours: number
    overallActivityRate: number
    dailyBreakdown: Array<{
        date: string
        activeHours: number
        inactiveHours: number
        totalHours: number
        activityRate: number
    }>
}

function decryptValue(encryptedValue: string, key: string): string {
    try {
        const fernetTokenBase64 = Buffer.from(encryptedValue, 'base64').toString('utf-8')
        const fernetToken = Buffer.from(fernetTokenBase64, 'base64')

        const keyBuffer = Buffer.from(key, 'base64')

        const version = fernetToken.readUInt8(0)
        if (version !== 0x80) {
            throw new Error(`Invalid Fernet version: ${version}`)
        }

        const signingKey = keyBuffer.slice(0, 16)
        const encryptionKey = keyBuffer.slice(16, 32)

        const hmacStart = fernetToken.length - 32
        const dataToVerify = fernetToken.slice(0, hmacStart)
        const providedHmac = fernetToken.slice(hmacStart)

        const hmac = crypto.createHmac('sha256', signingKey)
        hmac.update(dataToVerify)
        const computedHmac = hmac.digest()

        if (!crypto.timingSafeEqual(providedHmac, computedHmac)) {
            throw new Error('HMAC verification failed')
        }

        const iv = fernetToken.slice(9, 25)
        const ciphertext = fernetToken.slice(25, hmacStart)

        const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv)
        let decrypted = decipher.update(ciphertext)
        decrypted = Buffer.concat([decrypted, decipher.final()])

        return decrypted.toString('utf-8')
    } catch (error) {
        throw new Error(`Decryption failed: ${(error as Error).message}`)
    }
}

function parseTime(timestamp: number): string {
    const date = new Date(timestamp * 1000)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function calculateProductivity(activityRate: number, totalHours: number): {
    level: 'excellent' | 'good' | 'needs-improvement'
    emoji: string
} {
    if (activityRate >= 80 && totalHours >= 6) {
        return { level: 'excellent', emoji: '🟢' }
    } else if (activityRate >= 60 && totalHours >= 4) {
        return { level: 'good', emoji: '🟡' }
    } else {
        return { level: 'needs-improvement', emoji: '🔴' }
    }
}

export async function getAvailableDates(config: Config): Promise<string[]> {
    try {
        return await DuckDBService.getInstance().getAvailableDates(config.employeeId)
    } catch (error) {
        console.error('Failed to get available dates:', error)
        return []
    }
}

export async function analyzeSingleDate(
    date: string,
    config: Config
): Promise<DailyAnalysis> {
    const dayRecords = await DuckDBService.getInstance().getRawActivities(config.employeeId, date)

    if (dayRecords.length === 0) {
        console.warn('[Analyzer] No data found for date:', date)
        throw new Error(`No data found for date: ${date}`)
    }

    let totalSeconds = 0
    let activeSeconds = 0
    let afkSeconds = 0
    let minTime = Infinity
    let maxTime = 0

    for (const record of dayRecords) {
        const durationStr = config.decryptionKey
            ? decryptValue(record.duration_seconds, config.decryptionKey)
            : record.duration_seconds

        const duration = parseFloat(durationStr)
        totalSeconds += duration

        const afkStr = config.decryptionKey
            ? decryptValue(record.is_afk, config.decryptionKey)
            : record.is_afk

        const isAfk = afkStr === '1' || afkStr === 'true' || afkStr === 'True'

        if (isAfk) {
            afkSeconds += duration
        } else {
            activeSeconds += duration
        }

        if (record.start_time) {
            const startTimestamp = new Date(record.start_time).getTime()
            const endTimestamp = startTimestamp + (duration * 1000)
            minTime = Math.min(minTime, startTimestamp)
            maxTime = Math.max(maxTime, endTimestamp)
        }
    }

    const totalHours = totalSeconds / 3600
    const activeHours = activeSeconds / 3600
    const afkHours = afkSeconds / 3600
    const inactiveHours = totalHours - activeHours
    const activityRate = totalHours > 0 ? (activeHours / totalHours) * 100 : 0

    const productivity = calculateProductivity(activityRate, totalHours)

    const result = {
        date,
        totalHours: Math.round(totalHours * 100) / 100,
        activeHours: Math.round(activeHours * 100) / 100,
        inactiveHours: Math.round(inactiveHours * 100) / 100,
        afkHours: Math.round(afkHours * 100) / 100,
        activityRate: Math.round(activityRate * 10) / 10,
        startTime: minTime !== Infinity ? parseTime(minTime / 1000) : 'N/A',
        endTime: maxTime !== 0 ? parseTime(maxTime / 1000) : 'N/A',
        productivity: productivity.level,
        productivityEmoji: productivity.emoji,
    }

    return result
}

export async function analyzeMultiDate(
    dates: string[],
    config: Config
): Promise<MultiDayAnalysis> {
    // Optimization: Fetch ALL data at once if we are analyzing many dates
    // However, for now, we can stick to parallel single-date analysis
    // because DuckDB is fast enough to handle concurrent queries.
    // If dates array is very large (e.g. all time), we might want to fetch all and group by date in JS.

    // Let's try fetching all data for the employee and processing it in memory
    // This is much faster than 1000 SQL queries
    const allRecords = await DuckDBService.getInstance().getRawActivities(config.employeeId)

    // Group by date
    const recordsByDate: Record<string, any[]> = {}
    for (const record of allRecords) {
        const date = record.start_time.substring(0, 10)
        if (dates.includes(date)) {
            if (!recordsByDate[date]) recordsByDate[date] = []
            recordsByDate[date].push(record)
        }
    }

    const dailyAnalyses: DailyAnalysis[] = []

    for (const date of dates) {
        const dayRecords = recordsByDate[date] || []
        if (dayRecords.length === 0) continue

        let totalSeconds = 0
        let activeSeconds = 0
        let afkSeconds = 0

        for (const record of dayRecords) {
            try {
                const durationStr = config.decryptionKey
                    ? decryptValue(record.duration_seconds, config.decryptionKey)
                    : record.duration_seconds

                const duration = parseFloat(durationStr)
                totalSeconds += duration

                const afkStr = config.decryptionKey
                    ? decryptValue(record.is_afk, config.decryptionKey)
                    : record.is_afk

                const isAfk = afkStr === '1' || afkStr === 'true' || afkStr === 'True'

                if (isAfk) {
                    afkSeconds += duration
                } else {
                    activeSeconds += duration
                }
            } catch (e) {
                // Skip malformed records
                continue
            }
        }

        const totalHours = totalSeconds / 3600
        const activeHours = activeSeconds / 3600
        const afkHours = afkSeconds / 3600
        const inactiveHours = totalHours - activeHours
        const activityRate = totalHours > 0 ? (activeHours / totalHours) * 100 : 0
        const productivity = calculateProductivity(activityRate, totalHours)

        dailyAnalyses.push({
            date,
            totalHours: Math.round(totalHours * 100) / 100,
            activeHours: Math.round(activeHours * 100) / 100,
            inactiveHours: Math.round(inactiveHours * 100) / 100,
            afkHours: Math.round(afkHours * 100) / 100,
            activityRate: Math.round(activityRate * 10) / 10,
            startTime: 'N/A', // Not needed for summary
            endTime: 'N/A',   // Not needed for summary
            productivity: productivity.level,
            productivityEmoji: productivity.emoji,
        })
    }

    let totalActiveHours = 0
    let totalTrackedHours = 0
    let totalInactiveHours = 0

    const dailyBreakdown = dailyAnalyses.map((analysis) => {
        totalActiveHours += analysis.activeHours
        totalTrackedHours += analysis.totalHours
        totalInactiveHours += analysis.inactiveHours

        return {
            date: analysis.date,
            activeHours: analysis.activeHours,
            inactiveHours: analysis.inactiveHours,
            totalHours: analysis.totalHours,
            activityRate: analysis.activityRate,
        }
    })

    const totalDays = dailyBreakdown.length
    const averageActiveHours = totalDays > 0 ? totalActiveHours / totalDays : 0
    const averageTotalHours = totalDays > 0 ? totalTrackedHours / totalDays : 0
    const averageInactiveHours = totalDays > 0 ? totalInactiveHours / totalDays : 0
    const overallActivityRate = totalTrackedHours > 0 ? (totalActiveHours / totalTrackedHours) * 100 : 0

    return {
        totalDays,
        totalActiveHours: Math.round(totalActiveHours * 100) / 100,
        totalTrackedHours: Math.round(totalTrackedHours * 100) / 100,
        totalInactiveHours: Math.round(totalInactiveHours * 100) / 100,
        averageActiveHours: Math.round(averageActiveHours * 100) / 100,
        averageTotalHours: Math.round(averageTotalHours * 100) / 100,
        averageInactiveHours: Math.round(averageInactiveHours * 100) / 100,
        overallActivityRate: Math.round(overallActivityRate * 10) / 10,
        dailyBreakdown,
    }
}
