import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Key, User, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export default function Settings() {
    const { config, dbPath, loading } = useSettings();

    if (loading) {
        return (
            <div className='flex items-center justify-center h-48'>
                <p className='text-muted-foreground animate-pulse'>Loading system information...</p>
            </div>
        );
    }

    const isDbFound = !!dbPath;
    const isKeyFound = !!config.decryptionKey;
    const isHostnameFound = !!config.employeeId;

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='text-3xl font-bold tracking-tight'>System Information</h2>
                <p className='text-muted-foreground'>Automatic configuration status and system details</p>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
                <Card className={isDbFound ? 'border-green-500/50' : 'border-destructive/50'}>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                            <Database className='h-5 w-5' />
                            Database
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center gap-2'>
                            {isDbFound ? (
                                <CheckCircle2 className='h-4 w-4 text-green-500' />
                            ) : (
                                <XCircle className='h-4 w-4 text-destructive' />
                            )}
                            <span className='text-sm font-medium'>
                                {isDbFound ? 'Detected' : 'Not Found'}
                            </span>
                        </div>
                        <p className='text-xs text-muted-foreground mt-2 break-all font-mono'>
                            {dbPath || 'Path not detected'}
                        </p>
                    </CardContent>
                </Card>

                <Card className={isKeyFound ? 'border-green-500/50' : 'border-destructive/50'}>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                            <Key className='h-5 w-5' />
                            Decryption Key
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center gap-2'>
                            {isKeyFound ? (
                                <CheckCircle2 className='h-4 w-4 text-green-500' />
                            ) : (
                                <XCircle className='h-4 w-4 text-destructive' />
                            )}
                            <span className='text-sm font-medium'>
                                {isKeyFound ? 'Loaded' : 'Missing'}
                            </span>
                        </div>
                        <p className='text-xs text-muted-foreground mt-2'>
                            {isKeyFound ? 'Successfully read from agent.key' : 'agent.key not found in ActivityTracker folder'}
                        </p>
                    </CardContent>
                </Card>

                <Card className={isHostnameFound ? 'border-green-500/50' : 'border-destructive/50'}>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                            <User className='h-5 w-5' />
                            Hostname
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center gap-2'>
                            {isHostnameFound ? (
                                <CheckCircle2 className='h-4 w-4 text-green-500' />
                            ) : (
                                <XCircle className='h-4 w-4 text-destructive' />
                            )}
                            <span className='text-sm font-medium'>
                                {isHostnameFound ? config.employeeId : 'Not Detected'}
                            </span>
                        </div>
                        <p className='text-xs text-muted-foreground mt-2'>
                            {isHostnameFound ? 'Auto-detected from system' : 'Failed to detect system hostname'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {!isDbFound || !isKeyFound || !isHostnameFound ? (
                <Card className='border-destructive bg-destructive/5'>
                    <CardContent className='pt-6'>
                        <div className='flex items-start gap-3'>
                            <XCircle className='h-5 w-5 text-destructive shrink-0 mt-0.5' />
                            <div className='space-y-1'>
                                <p className='font-semibold text-destructive'>System Configuration Incomplete</p>
                                <p className='text-sm text-muted-foreground'>
                                    Please ensure ActivityTracker is installed and running. The application requires access to the local database and encryption key to function correctly.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='border-blue-500/50 bg-blue-500/5'>
                    <CardContent className='pt-6'>
                        <div className='flex items-start gap-3'>
                            <Info className='h-5 w-5 text-blue-500 shrink-0 mt-0.5' />
                            <div className='space-y-1'>
                                <p className='font-semibold text-blue-500'>Everything is ready!</p>
                                <p className='text-sm text-muted-foreground'>
                                    The application has automatically configured itself. You can now view your activity analysis in the Summary and Daily Analysis tabs.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
