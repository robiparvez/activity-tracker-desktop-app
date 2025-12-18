import { useMemo } from 'react';

interface DailyBreakdown {
    date: string;
    activeHours: number;
    inactiveHours: number;
    totalHours: number;
    activityRate: number;
}

interface MultiDayData {
    totalDays: number;
    totalActiveHours: number;
    totalTrackedHours: number;
    totalInactiveHours: number;
    averageActiveHours: number;
    averageTotalHours: number;
    averageInactiveHours: number;
    overallActivityRate: number;
    dailyBreakdown: DailyBreakdown[];
}

interface TrendDataPoint {
    date: string;
    active: number;
    inactive: number;
    rate: number;
}

interface UseSummaryReturn {
    isEmpty: boolean;
    data: MultiDayData | null;
    trendData: TrendDataPoint[];
    reversedDailyBreakdown: DailyBreakdown[];
    formatDate: (dateString: string) => string;
}

export function useSummary(dates: string[], multiDayData: any): UseSummaryReturn {
    const isEmpty = !multiDayData || dates.length === 0;

    const trendData = useMemo(() => {
        if (!multiDayData?.dailyBreakdown) return [];

        return multiDayData.dailyBreakdown.map((day: DailyBreakdown) => ({
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            active: day.activeHours,
            inactive: day.inactiveHours,
            rate: day.activityRate
        }));
    }, [multiDayData]);

    const reversedDailyBreakdown = useMemo(() => {
        if (!multiDayData?.dailyBreakdown) return [];
        return [...multiDayData.dailyBreakdown].reverse();
    }, [multiDayData]);

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return {
        isEmpty,
        data: multiDayData,
        trendData,
        reversedDailyBreakdown,
        formatDate
    };
}

export { type DailyBreakdown, type TrendDataPoint };
