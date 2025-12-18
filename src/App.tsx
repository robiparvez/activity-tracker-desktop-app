import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Dashboard from '@/components/Dashboard';
import Summary from '@/components/Summary';
import Settings from '@/components/Settings';
import { Calendar, BarChart3, Settings as SettingsIcon, Activity } from 'lucide-react';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useDateFormatter } from '@/hooks/useDateFormatter';

function App() {
    const [activeTab, setActiveTab] = useState('settings');

    const {
        dates,
        selectedDate,
        singleDayData,
        multiDayData,
        loading,
        isConfigured,
        handleDateSelect,
        handleConfigUpdate
    } = useAppInitialization();

    const { formatDate } = useDateFormatter();

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
                    <TabsList className={`grid w-full max-w-md ${isConfigured ? 'grid-cols-3' : 'grid-cols-1'}`}>
                        <TabsTrigger key='settings' value='settings' className='flex items-center gap-2'>
                            <SettingsIcon className='h-4 w-4' />
                            Settings
                        </TabsTrigger>
                        {isConfigured && (
                            <>
                                <TabsTrigger key='summary' value='summary' className='flex items-center gap-2'>
                                    <BarChart3 className='h-4 w-4' />
                                    Summary
                                </TabsTrigger>
                                <TabsTrigger key='dashboard' value='dashboard' className='flex items-center gap-2'>
                                    <Calendar className='h-4 w-4' />
                                    Daily Analysis
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    <TabsContent value='settings' className='space-y-4'>
                        <Settings onConfigUpdate={handleConfigUpdate} onTabChange={setActiveTab} />
                    </TabsContent>

                    {isConfigured && activeTab === 'dashboard' && dates.length > 0 && (
                        <Card>
                            <CardContent className='pt-6'>
                                <div className='flex items-center gap-2 mb-4'>
                                    <Calendar className='h-4 w-4 text-muted-foreground' />
                                    <span className='text-sm font-medium'>Select Date:</span>
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    {dates.slice(-10).map(date => (
                                        <Button
                                            key={date}
                                            variant={selectedDate === date ? 'default' : 'outline'}
                                            size='sm'
                                            onClick={() => handleDateSelect(date)}
                                        >
                                            {formatDate(date)}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isConfigured && (
                        <>
                            <TabsContent value='dashboard' className='space-y-4'>
                                <Dashboard selectedDate={selectedDate} analysisData={singleDayData} />
                            </TabsContent>

                            <TabsContent value='summary' className='space-y-4'>
                                <Summary dates={dates} multiDayData={multiDayData} />
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
        </div>
    );
}

export default App;
