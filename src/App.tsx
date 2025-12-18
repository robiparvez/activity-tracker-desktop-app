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
                <div className='text-center space-y-4'>
                    <Activity className='w-16 h-16 mx-auto animate-pulse text-primary' />
                    <p className='text-xl text-muted-foreground'>Loading ActivityTracker...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-background'>
            <div className='border-b'>
                <div className='flex h-16 items-center px-6'>
                    <Activity className='h-6 w-6 mr-2 text-primary' />
                    <h1 className='text-2xl font-bold'>Activity Tracker Analysis</h1>
                </div>
            </div>

            <div className='container mx-auto p-6'>
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
                                            {selectedDate === dates[dates.length - 1] ? 'Showing today\'s activity' : `Viewing activity for ${formatDate(selectedDate || '')}`}
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
                                                        {date === dates[dates.length - 1] && " (Today)"}
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
