import { useState, useEffect } from 'react';

interface Config {
    decryptionKey: string;
    employeeId: string;
    dbPath?: string;
}

interface UseSettingsReturn {
    config: Config;
    dbPath: string;
    loading: boolean;
}

export function useSettings(): UseSettingsReturn {
    const [config, setConfig] = useState<Config>({ decryptionKey: '', employeeId: '', dbPath: '' });
    const [dbPath, setDbPath] = useState('');
    const [loading, setLoading] = useState(true);

    const loadConfig = async () => {
        const result = await window.electronAPI.getConfig();
        if (result.success && result.config) {
            setConfig(result.config);
        }
    };

    const discoverDb = async () => {
        const result = await window.electronAPI.discoverDatabase();
        if (result.success && result.path) {
            setDbPath(result.path);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([loadConfig(), discoverDb()]);
            setLoading(false);
        };
        init();
    }, []);

    return {
        config,
        dbPath,
        loading
    };
}
