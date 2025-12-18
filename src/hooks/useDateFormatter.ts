import { useMemo } from 'react';

interface UseDateFormatterReturn {
    formatDate: (date: string) => string;
    isValidDate: (date: string) => boolean;
}

export function useDateFormatter(): UseDateFormatterReturn {
    const formatDate = useMemo(() => {
        return (date: string): string => {
            const dateObj = new Date(date + 'T00:00:00');
            const isValid = !isNaN(dateObj.getTime());

            if (!isValid) return date;

            return dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        };
    }, []);

    const isValidDate = useMemo(() => {
        return (date: string): boolean => {
            const dateObj = new Date(date + 'T00:00:00');
            return !isNaN(dateObj.getTime());
        };
    }, []);

    return {
        formatDate,
        isValidDate
    };
}
