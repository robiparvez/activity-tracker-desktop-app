export interface ElectronAPI {
    discoverDatabase: () => Promise<{ success: boolean; path?: string; error?: string }>
    exportToJson: () => Promise<{ success: boolean; path?: string; error?: string }>
    getAvailableDates: () => Promise<{ success: boolean; dates?: string[]; error?: string }>
    analyzeSingleDate: (date: string) => Promise<{ success: boolean; data?: any; error?: string }>
    analyzeMultiDate: (dates: string[]) => Promise<{ success: boolean; data?: any; error?: string }>
    getConfig: () => Promise<{ success: boolean; config?: any; error?: string }>
    setConfig: (config: any) => Promise<{ success: boolean; error?: string }>
    refreshData: () => Promise<{ success: boolean; dates?: string[]; error?: string }>
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}

export { }
