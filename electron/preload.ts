import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    discoverDatabase: () => ipcRenderer.invoke('db:discover'),
    exportToJson: () => ipcRenderer.invoke('db:export-json'),
    getAvailableDates: () => ipcRenderer.invoke('analysis:get-dates'),
    analyzeSingleDate: (date: string) => ipcRenderer.invoke('analysis:run-single-date', date),
    analyzeMultiDate: (dates: string[]) => ipcRenderer.invoke('analysis:run-multi-date', dates),
    getConfig: () => ipcRenderer.invoke('config:get'),
    setConfig: (config: any) => ipcRenderer.invoke('config:set', config),
    refreshData: () => ipcRenderer.invoke('app:refresh'),
})
