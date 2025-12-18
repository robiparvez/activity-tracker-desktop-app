import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboard, COLORS } from '@/hooks/useDashboard';

interface DashboardProps {
    selectedDate: string | null;
    analysisData: any;
}

export default function Dashboard({ selectedDate, analysisData }: DashboardProps) {
    const { isEmpty, formattedDate, pieData, barData, data } = useDashboard(selectedDate, analysisData);

    if (isEmpty) {
        return (
            <div className='flex items-center justify-center h-full'>
                <div className='text-center space-y-4'>
                    <Activity className='w-16 h-16 mx-auto text-muted-foreground' />
                    <p className='text-xl text-muted-foreground'>Select a date to view analytics</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Daily Analysis</h2>
                    <p className='text-muted-foreground'>{formattedDate}</p>
                </div>
                <div className='text-right'>
                    <div className='text-4xl font-bold'>{data?.productivityEmoji}</div>
                    <p className='text-sm text-muted-foreground capitalize'>{data?.productivity}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Hours</CardTitle>
                        <Clock className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{data?.totalHours}h</div>
                        <p className='text-xs text-muted-foreground'>
                            {data?.startTime} - {data?.endTime}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Active Time</CardTitle>
                        <Activity className='h-4 w-4 text-green-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-green-500'>{data?.activeHours}h</div>
                        <p className='text-xs text-muted-foreground'>Productive work time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Activity Rate</CardTitle>
                        <TrendingUp className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{data?.activityRate}%</div>
                        <p className='text-xs text-muted-foreground'>Overall productivity</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Inactive Time</CardTitle>
                        <Calendar className='h-4 w-4 text-orange-500' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-orange-500'>{data?.inactiveHours}h</div>
                        <p className='text-xs text-muted-foreground'>Including {data?.afkHours}h AFK</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                    <CardHeader>
                        <CardTitle>Time Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={300}>
                            <PieChart>
                                <Pie data={pieData} cx='50%' cy='50%' labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill='#8884d8' dataKey='value'>
                                    {pieData?.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hours Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={300}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='name' />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey='Active' fill='#10b981' />
                                <Bar dataKey='Inactive' fill='#f59e0b' />
                                <Bar dataKey='AFK' fill='#ef4444' />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
