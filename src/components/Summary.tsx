import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Activity, Clock } from 'lucide-react';
import { useSummary } from '@/hooks/useSummary';

interface SummaryProps {
    dates: string[];
    multiDayData: any;
}

export default function Summary({ dates, multiDayData }: SummaryProps) {
    const { isEmpty, data, trendData, reversedDailyBreakdown, formatDate } = useSummary(dates, multiDayData);

    if (isEmpty) {
        return (
            <div className='flex items-center justify-center h-full'>
                <div className='text-center space-y-4'>
                    <Calendar className='w-16 h-16 mx-auto text-muted-foreground' />
                    <p className='text-xl text-muted-foreground'>No data available for summary</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='text-3xl font-bold tracking-tight'>Multi-Day Summary</h2>
                <p className='text-muted-foreground'>Analysis of {data?.totalDays} days of activity</p>
            </div>

            {/* Summary Cards */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Active Hours</CardTitle>
                        <Activity className='h-4 w-4 text-green-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-green-500'>{data?.totalActiveHours}h</div>
                        <p className='text-xs text-muted-foreground'>Across {data?.totalDays} days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Average Per Day</CardTitle>
                        <Clock className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{data?.averageActiveHours}h</div>
                        <p className='text-xs text-muted-foreground'>Active hours daily</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Overall Activity Rate</CardTitle>
                        <TrendingUp className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{data?.overallActivityRate}%</div>
                        <p className='text-xs text-muted-foreground'>Productivity metric</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Tracked</CardTitle>
                        <Calendar className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{data?.totalTrackedHours}h</div>
                        <p className='text-xs text-muted-foreground'>All recorded time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className='grid gap-4'>
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Activity Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={300}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='date' />
                                <YAxis />
                                <Tooltip />
                                <Line type='monotone' dataKey='active' stroke='#10b981' strokeWidth={2} name='Active Hours' />
                                <Line type='monotone' dataKey='inactive' stroke='#f59e0b' strokeWidth={2} name='Inactive Hours' />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity Rate by Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={300}>
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='date' />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey='rate' fill='#10b981' name='Activity Rate %' />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Breakdown Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-2'>
                        {reversedDailyBreakdown.map(day => (
                            <div key={day.date} className='flex items-center justify-between p-3 border rounded-lg'>
                                <div>
                                    <p className='font-medium'>
                                        {formatDate(day.date)}
                                    </p>
                                    <p className='text-sm text-muted-foreground'>
                                        {day.activeHours}h active • {day.inactiveHours}h inactive
                                    </p>
                                </div>
                                <div className='text-right'>
                                    <p className='text-2xl font-bold'>{day.activityRate}%</p>
                                    <p className='text-xs text-muted-foreground'>activity rate</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
