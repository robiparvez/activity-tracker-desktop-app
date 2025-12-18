import { useMemo } from 'react';

interface DashboardData {
    totalHours: number;
    activeHours: number;
    inactiveHours: number;
    afkHours: number;
    activityRate: number;
    startTime: string;
    endTime: string;
    productivity: string;
    productivityEmoji: string;
}

interface UseDashboardReturn {
    isEmpty: boolean;
    formattedDate: string;
    pieData: Array<{ name: string; value: number }>;
    barData: Array<{ name: string; Active: number; Inactive: number; AFK: number }>;
    data: DashboardData | null;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export function useDashboard(selectedDate: string | null, analysisData: any): UseDashboardReturn {
    const isEmpty = !selectedDate || !analysisData;

    const formattedDate = useMemo(() => {
        if (!selectedDate) return '';
        return new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, [selectedDate]);

    const pieData = useMemo(() => {
        if (!analysisData) return [];
        return [
            { name: 'Active', value: analysisData.activeHours },
            { name: 'Inactive', value: analysisData.inactiveHours },
            { name: 'AFK', value: analysisData.afkHours }
        ];
    }, [analysisData]);

    const barData = useMemo(() => {
        if (!analysisData) return [];
        return [
            {
                name: 'Hours',
                Active: analysisData.activeHours,
                Inactive: analysisData.inactiveHours,
                AFK: analysisData.afkHours
            }
        ];
    }, [analysisData]);

    return {
        isEmpty,
        formattedDate,
        pieData,
        barData,
        data: analysisData
    };
}

export { COLORS };
