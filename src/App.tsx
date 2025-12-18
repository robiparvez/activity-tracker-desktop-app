import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Dashboard from '@/components/Dashboard';
import Summary from '@/components/Summary';
import Settings from '@/components/Settings';
import { Calendar, BarChart3, Info, Activity, RefreshCw } from 'lucide-react';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useDateFormatter } from '@/hooks/useDateFormatter';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const {
        dates,
        selectedDate,
        singleDayData,
        multiDayData,
        loading,
        refreshing,
        refreshError,
        isConfigured,
        handleDateSelect,
        handleRefresh
    } = useAppInitialization();

    const { formatDate } = useDateFormatter();

    useEffect(() => {
        if (!loading && !isConfigured) {
            setActiveTab('settings');
        }
    }, [loading, isConfigured]);

    if (loading) {
        return (
            <div className='flex items-center justify-center h-screen bg-background'>
                <div className='text-center space-y-6 max-w-md px-6'>
                    <Activity className='w-16 h-16 mx-auto animate-pulse text-primary' />
                    <div className='space-y-2'>
                        <p className='text-xl font-semibold'>Loading ActivityTracker...</p>
                        <div className='w-full bg-secondary rounded-full h-2.5 overflow-hidden relative mt-4'>
                            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse'
                                 style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-background'>
            <div className='container mx-auto p-6'>
                {(refreshing || refreshError) && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl transition-all duration-500'>
                        <div className={`bg-card border shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] rounded-3xl p-10 max-w-sm w-full mx-4 text-center space-y-8 animate-in fade-in zoom-in-95 duration-300 ${refreshError ? 'border-destructive/50' : 'border-primary/20'}`}>
                            <div className='relative mx-auto w-20 h-20'>
                                <div className={`absolute inset-0 rounded-full border-4 ${refreshError ? 'border-destructive/20' : 'border-primary/20'}`} />
                                {!refreshError && <div className='absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin' />}
                                <RefreshCw className={`absolute inset-0 m-auto h-8 w-8 ${refreshError ? 'text-destructive' : 'text-primary'}`} />
                            </div>
                            <div className='space-y-2'>
                                <h3 className={`text-xl font-bold ${refreshError ? 'text-destructive' : ''}`}>
                                    {refreshError ? 'Refresh Failed' : 'Refreshing Data'}
                                </h3>
                                {refreshError && (
                                    <p className='text-sm text-muted-foreground'>
                                        {refreshError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
                    <div className='flex items-center justify-between'>
                        <TabsList className={`grid w-full max-w-md ${isConfigured ? 'grid-cols-3' : 'grid-cols-1'}`}>
                            {isConfigured && (
                                <>
                                    <TabsTrigger key='dashboard' value='dashboard' className='flex items-center gap-2'>
                                        <Calendar className='h-4 w-4' />
                                        Daily Analysis
                                    </TabsTrigger>
                                    <TabsTrigger key='summary' value='summary' className='flex items-center gap-2'>
                                        <BarChart3 className='h-4 w-4' />
                                        Summary
                                    </TabsTrigger>
                                </>
                            )}
                            <TabsTrigger key='settings' value='settings' className='flex items-center gap-2'>
                                <Info className='h-4 w-4' />
                                System Info
                            </TabsTrigger>
                        </TabsList>

                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className='ml-auto'
                            title='Refresh Data'
                        >
                            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {isConfigured && activeTab === 'dashboard' && dates.length > 0 && (
                        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
                            <CardContent className='py-4'>
                                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                                    <div className='space-y-1'>
                                        <h2 className='text-xl font-semibold tracking-tight'>Daily Analysis</h2>
                                        <p className='text-sm text-muted-foreground'>
                                            {selectedDate === new Date().toLocaleDateString('en-CA') ? 'Showing today\'s activity' : `Viewing activity for ${formatDate(selectedDate || '')}`}
                                        </p>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <Label htmlFor="date-select" className='text-sm font-medium text-muted-foreground whitespace-nowrap'>Change Date:</Label>
                                        <Select
                                            value={selectedDate || undefined}
                                            onValueChange={handleDateSelect}
                                        >
                                            <SelectTrigger id="date-select" className="w-[180px] bg-background/50">
                                                <SelectValue placeholder="Select date" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...dates].sort((a, b) => a.localeCompare(b)).reverse().map((date) => (
                                                    <SelectItem key={date} value={date}>
                                                        {formatDate(date)}
                                                        {date === new Date().toLocaleDateString('en-CA') && " (Today)"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isConfigured && (
                        <>
                            <TabsContent value='dashboard' className='space-y-4'>
                                <Dashboard
                                    selectedDate={selectedDate}
                                    analysisData={singleDayData}
                                />
                            </TabsContent>

                            <TabsContent value='summary' className='space-y-4'>
                                <Summary dates={dates} multiDayData={multiDayData} />
                            </TabsContent>
                        </>
                    )}

                    <TabsContent value='settings' className='space-y-4'>
                        <Settings />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default App;
