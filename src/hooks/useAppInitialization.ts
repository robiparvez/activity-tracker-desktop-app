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
    config: Config;
    isConfigured: boolean;
    handleDateSelect: (date: string) => Promise<void>;
    handleConfigUpdate: () => Promise<void>;
}

export function useAppInitialization(): UseAppInitializationReturn {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [singleDayData, setSingleDayData] = useState(null);
    const [multiDayData, setMultiDayData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<Config>({ decryptionKey: '', employeeId: '' });

    const loadSingleDayData = async (date: string) => {
        console.log('[Hook] loadSingleDayData called with date:', date);
        const result = await window.electronAPI.analyzeSingleDate(date);
        console.log('[Hook] analyzeSingleDate result:', result);
        if (result.success && result.data) {
            setSingleDayData(result.data);
            console.log('[Hook] Single day data set:', result.data);
        } else {
            console.error('[Hook] Failed to load single day data:', result.error);
        }
    };

    const loadMultiDayData = async (datesToAnalyze: string[]) => {
        console.log('[Hook] loadMultiDayData called with dates:', datesToAnalyze);
        const result = await window.electronAPI.analyzeMultiDate(datesToAnalyze);
        console.log('[Hook] analyzeMultiDate result:', result);
        if (result.success && result.data) {
            setMultiDayData(result.data);
            console.log('[Hook] Multi day data set:', result.data);
        } else {
            console.error('[Hook] Failed to load multi day data:', result.error);
        }
    };

    const initializeApp = async () => {
        setLoading(true);

        try {
            // Load config first to check if settings are configured
            const configResult = await window.electronAPI.getConfig();
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
                    // Select the most recent date by default
                    const mostRecent = result.dates[result.dates.length - 1];
                    setSelectedDate(mostRecent);
                    await loadSingleDayData(mostRecent);
                    await loadMultiDayData(result.dates);
                }
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }

        setLoading(false);
    };

    const handleDateSelect = async (date: string) => {
        console.log('[Hook] handleDateSelect called with date:', date);
        setSelectedDate(date);
        await loadSingleDayData(date);
    };

    const handleConfigUpdate = async () => {
        await initializeApp();
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
        config,
        isConfigured,
        handleDateSelect,
        handleConfigUpdate
    };
}
