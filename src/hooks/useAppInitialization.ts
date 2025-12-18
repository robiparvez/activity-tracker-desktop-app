import { useState, useEffect } from 'react';

interface Config {
    decryptionKey: string;
    employeeId: string;
}

interface UseAppInitializationReturn {
    dates: string[];
    selectedDate: string | null;
    singleDayData: any;
    multiDayData: any;
    loading: boolean;
    refreshing: boolean;
    refreshError: string | null;
    progress: any;
    config: Config;
    isConfigured: boolean;
    handleDateSelect: (date: string) => Promise<void>;
    handleRefresh: () => Promise<void>;
}

export function useAppInitialization(): UseAppInitializationReturn {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [singleDayData, setSingleDayData] = useState<any>(null);
    const [multiDayData, setMultiDayData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [progress, setProgress] = useState<any>(null);
    const [config, setConfig] = useState<Config>({ decryptionKey: '', employeeId: '' });

    useEffect(() => {
        const cleanup = window.electronAPI.onProgress((data: any) => {
            setProgress(data);
        });
        return cleanup;
    }, []);

    const loadSingleDayData = async (date: string) => {
        const result = await window.electronAPI.analyzeSingleDate(date);
        if (result.success && result.data) {
            setSingleDayData(result.data);
        } else {
            console.error('[Hook] Failed to load single day data:', result.error);
        }
    };

    const loadMultiDayData = async (datesToAnalyze: string[]) => {
        const result = await window.electronAPI.analyzeMultiDate(datesToAnalyze);
        if (result.success && result.data) {
            setMultiDayData(result.data);
        } else {
            console.error('[Hook] Failed to load multi day data:', result.error);
        }
    };

    const initializeApp = async () => {
        setLoading(true);

        try {
            // Load config first to check if settings are configured
            const configResult = await window.electronAPI.initializeConfig();
            if (configResult.success && configResult.config) {
                setConfig({
                    decryptionKey: configResult.config.decryptionKey || '',
                    employeeId: configResult.config.employeeId || ''
                });
            }

            // Discover and export database
            await window.electronAPI.discoverDatabase();
            await window.electronAPI.exportToJson();

            // Load available dates
            const result = await window.electronAPI.getAvailableDates();
            if (result.success && result.dates) {
                setDates(result.dates);
                if (result.dates.length > 0) {
                    // Try to select today's date first
                    const today = new Date().toLocaleDateString('en-CA');
                    const hasToday = result.dates.includes(today);
                    const defaultDate = hasToday ? today : result.dates[0];

                    setSelectedDate(defaultDate);
                    await loadSingleDayData(defaultDate);
                    await loadMultiDayData(result.dates);
                }
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }

        setLoading(false);
    };

    const handleDateSelect = async (date: string) => {
        setSelectedDate(date);
        await loadSingleDayData(date);
    };

    const handleRefresh = async () => {
        if (!selectedDate) return;

        setRefreshing(true);
        const startTime = Date.now();

        try {
            // Only refresh the selected date directly from DB
            const result = await window.electronAPI.analyzeSingleDate(selectedDate);

            // Ensure modal is visible for at least 1.5 seconds for better UX
            const elapsed = Date.now() - startTime;
            if (elapsed < 1500) {
                await new Promise(resolve => setTimeout(resolve, 1500 - elapsed));
            }

            if (result.success && result.data) {
                // 1. Update single day data immediately
                setSingleDayData(result.data);

                // 2. Update multi-day data in-place
                if (multiDayData && multiDayData.dailyBreakdown) {
                    const updatedBreakdown = multiDayData.dailyBreakdown.map((day: any) =>
                        day.date === selectedDate ? {
                            date: result.data.date,
                            activeHours: result.data.activeHours,
                            inactiveHours: result.data.inactiveHours,
                            totalHours: result.data.totalHours,
                            activityRate: result.data.activityRate
                        } : day
                    );

                    // Recalculate multi-day totals
                    let totalActive = 0;
                    let totalTracked = 0;
                    let totalInactive = 0;

                    updatedBreakdown.forEach((day: any) => {
                        totalActive += day.activeHours;
                        totalTracked += day.totalHours;
                        totalInactive += day.inactiveHours;
                    });

                    const totalDays = updatedBreakdown.length;

                    setMultiDayData({
                        ...multiDayData,
                        totalActiveHours: Math.round(totalActive * 100) / 100,
                        totalTrackedHours: Math.round(totalTracked * 100) / 100,
                        totalInactiveHours: Math.round(totalInactive * 100) / 100,
                        averageActiveHours: Math.round((totalActive / totalDays) * 100) / 100,
                        averageTotalHours: Math.round((totalTracked / totalDays) * 100) / 100,
                        averageInactiveHours: Math.round((totalInactive / totalDays) * 100) / 100,
                        overallActivityRate: Math.round((totalActive / totalTracked) * 1000) / 10,
                        dailyBreakdown: updatedBreakdown
                    });
                }
            } else {
                setRefreshError(result.error || 'Failed to refresh data');
                setTimeout(() => setRefreshError(null), 5000);
            }
        } catch (error) {
            console.error('Failed to refresh data:', error);
            setRefreshError((error as Error).message);
            setTimeout(() => setRefreshError(null), 5000);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        initializeApp();
    }, []);

    const isConfigured = config.decryptionKey.trim() !== '' && config.employeeId.trim() !== '';

    return {
        dates,
        selectedDate,
        singleDayData,
        multiDayData,
        loading,
        refreshing,
        refreshError,
        progress,
        config,
        isConfigured,
        handleDateSelect,
        handleRefresh
    };
}
