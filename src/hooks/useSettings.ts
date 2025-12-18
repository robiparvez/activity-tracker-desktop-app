import { useState, useEffect } from 'react';

interface Config {
    decryptionKey: string;
    employeeId: string;
    dbPath?: string;
}

interface ValidationErrors {
    decryptionKey: string;
    employeeId: string;
}

interface UseSettingsReturn {
    config: Config;
    dbPath: string;
    loading: boolean;
    message: string;
    errors: ValidationErrors;
    handleConfigChange: (field: keyof Config, value: string) => void;
    handleSave: () => Promise<void>;
    handleRefresh: () => Promise<void>;
}

export function useSettings(
    onConfigUpdate: () => void,
    onTabChange?: (tab: string) => void
): UseSettingsReturn {
    const [config, setConfig] = useState<Config>({ decryptionKey: '', employeeId: '', dbPath: '' });
    const [dbPath, setDbPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({ decryptionKey: '', employeeId: '' });

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

    const validateConfig = (): boolean => {
        const newErrors: ValidationErrors = { decryptionKey: '', employeeId: '' };
        let hasErrors = false;

        if (!config.decryptionKey.trim()) {
            newErrors.decryptionKey = 'Decryption key is required';
            hasErrors = true;
        }

        if (!config.employeeId.trim()) {
            newErrors.employeeId = 'Hostname is required';
            hasErrors = true;
        }

        setErrors(newErrors);

        if (hasErrors) {
            setMessage('Please fill in all required fields');
        }

        return !hasErrors;
    };

    const handleConfigChange = (field: keyof Config, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        if (field === 'decryptionKey' || field === 'employeeId') {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSave = async () => {
        if (!validateConfig()) return;

        setLoading(true);
        setMessage('');

        const result = await window.electronAPI.setConfig(config);

        if (result.success) {
            setMessage('Configuration saved successfully!');
            onConfigUpdate();
            setTimeout(() => {
                if (onTabChange) onTabChange('summary');
            }, 500);
        } else {
            setMessage(`Error: ${result.error}`);
        }

        setLoading(false);
    };

    const handleRefresh = async () => {
        setLoading(true);
        setMessage('');

        const result = await window.electronAPI.refreshData();

        if (result.success) {
            setMessage('Data refreshed successfully!');
            onConfigUpdate();
            setTimeout(() => {
                if (onTabChange) onTabChange('summary');
            }, 500);
        } else {
            setMessage(`Error: ${result.error}`);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadConfig();
        discoverDb();
    }, []);

    return {
        config,
        dbPath,
        loading,
        message,
        errors,
        handleConfigChange,
        handleSave,
        handleRefresh
    };
}
