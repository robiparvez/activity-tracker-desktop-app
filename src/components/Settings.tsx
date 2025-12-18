import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Key, User, RefreshCw } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

interface SettingsProps {
    onConfigUpdate: () => void;
    onTabChange?: (tab: string) => void;
}

export default function Settings({ onConfigUpdate, onTabChange }: SettingsProps) {
    const { config, dbPath, loading, message, errors, handleConfigChange, handleSave, handleRefresh } = useSettings(onConfigUpdate, onTabChange);

    // Calculate agent.key path from database path
    const agentKeyPath = dbPath ? dbPath.replace('local_activity.db', 'agent.key') : '';

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='text-3xl font-bold tracking-tight'>Settings</h2>
                <p className='text-muted-foreground'>Configure your ActivityTracker analysis parameters</p>
            </div>

            <div className='grid gap-6'>
                <div className='grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <RefreshCw className='h-5 w-5' />
                                Data Management
                            </CardTitle>
                            <CardDescription>Refresh data from ActivityTracker database</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <Button onClick={handleRefresh} disabled={loading || !dbPath} className='w-full' variant='outline'>
                                    <RefreshCw className='mr-2 h-4 w-4' />
                                    Refresh
                                </Button>
                                <p className='text-xs text-muted-foreground'>Click to re-export the latest data from ActivityTracker database.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Database className='h-5 w-5' />
                                Database Location
                            </CardTitle>
                            <CardDescription>ActivityTracker database path (auto-detected)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <Input value={dbPath} readOnly className='font-mono text-sm' placeholder='Database not found' />
                                {!dbPath && <p className='text-sm text-destructive'>⚠️ Database not found. Please ensure ActivityTracker is installed and has generated data.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Key className='h-5 w-5' />
                                Decryption Key
                            </CardTitle>
                            <CardDescription>Fernet encryption key for decrypting activity data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <Label htmlFor='decryption-key'>
                                    Decryption Key <span className='text-destructive'>*</span>
                                </Label>
                                <Input id='decryption-key' type='password' value={config.decryptionKey} onChange={e => handleConfigChange('decryptionKey', e.target.value)} placeholder='Enter your Fernet decryption key' className={errors.decryptionKey ? 'border-destructive' : ''} />
                                {errors.decryptionKey && <p className='text-sm text-destructive'>{errors.decryptionKey}</p>}
                                <p className='text-xs text-muted-foreground'>This key is required to decrypt duration and AFK status from your activity data.</p>
                                {agentKeyPath && (
                                    <p className='text-xs text-muted-foreground'>
                                        Find it at: <code className='bg-muted px-1 py-0.5 rounded text-xs break-all'>{agentKeyPath}</code>
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <User className='h-5 w-5' />
                                Hostname
                            </CardTitle>
                            <CardDescription>Your hostname for filtering data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <Label htmlFor='employee-id'>
                                    Hostname <span className='text-destructive'>*</span>
                                </Label>
                                <Input id='employee-id' value={config.employeeId} onChange={e => handleConfigChange('employeeId', e.target.value)} placeholder='Enter your hostname' className={errors.employeeId ? 'border-destructive' : ''} />
                                {errors.employeeId && <p className='text-sm text-destructive'>{errors.employeeId}</p>}
                                <p className='text-xs text-muted-foreground'>
                                    Run <code className='bg-muted px-1 py-0.5 rounded'>hostname</code> command in CMD to find your hostname.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {message && (
                    <Card className={message.includes('Error') ? 'border-destructive' : 'border-green-500'}>
                        <CardContent className='pt-6'>
                            <p className={message.includes('Error') ? 'text-destructive' : 'text-green-500'}>{message}</p>
                        </CardContent>
                    </Card>
                )}

                <div className='flex gap-4'>
                    <Button onClick={handleSave} disabled={loading} className='flex-1'>
                        {loading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
