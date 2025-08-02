import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Copy, Key, Activity, CreditCard, FileText, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  plan: string;
  limits: {
    daily: number;
    monthly: number;
  };
  usage: {
    daily: number;
    monthly: number;
  };
  subscription: {
    status: string;
    stripeCustomerId: string | null;
  };
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  isActive: boolean;
  lastUsed: string | null;
  usageCount: number;
  createdAt: string;
}

interface Conversion {
  id: string;
  toolType: string;
  toolName: string;
  status: string;
  inputFilename: string;
  outputFilename: string | null;
  downloadUrl: string | null;
  processingTime: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/auth/profile'],
  });

  // Fetch API keys
  const { data: apiKeysData } = useQuery({
    queryKey: ['/api/auth/api-keys'],
  });

  // Fetch usage statistics
  const { data: usageData } = useQuery({
    queryKey: ['/api/usage'],
  });

  // Fetch conversions
  const { data: conversionsData } = useQuery({
    queryKey: ['/api/conversions'],
  });

  // Generate API key mutation
  const generateApiKey = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('POST', '/api/auth/api-keys', { name });
    },
    onSuccess: (data) => {
      toast({
        title: 'API Key Generated',
        description: 'Your new API key has been created successfully.',
      });
      setNewApiKeyName('');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/api-keys'] });
      
      // Show the new API key (only shown once)
      navigator.clipboard.writeText(data.apiKey.key);
      toast({
        title: 'API Key Copied',
        description: 'The new API key has been copied to your clipboard. Save it securely - it won\'t be shown again.',
        duration: 10000,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate API key',
        variant: 'destructive',
      });
    },
  });

  // Deactivate API key mutation
  const deactivateApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      return await apiRequest('DELETE', `/api/auth/api-keys/${keyId}`);
    },
    onSuccess: () => {
      toast({
        title: 'API Key Deactivated',
        description: 'The API key has been deactivated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/api-keys'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate API key',
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const user = profile?.user as User;
  const apiKeys = apiKeysData?.apiKeys as ApiKey[] || [];
  const usage = usageData;
  const conversions = conversionsData?.conversions as Conversion[] || [];

  const dailyProgress = user ? (user.usage.daily / user.limits.daily) * 100 : 0;
  const monthlyProgress = user ? (user.usage.monthly / user.limits.monthly) * 100 : 0;

  if (profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
          </p>
        </div>
        <Badge variant={user?.plan === 'free' ? 'secondary' : 'default'} className="text-sm">
          {user?.plan?.toUpperCase()} Plan
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user?.usage.daily || 0} / {user?.limits.daily || 0}
                </div>
                <Progress value={dailyProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.max(0, (user?.limits.daily || 0) - (user?.usage.daily || 0))} remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {user?.usage.monthly || 0} / {user?.limits.monthly || 0}
                </div>
                <Progress value={monthlyProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.max(0, (user?.limits.monthly || 0) - (user?.usage.monthly || 0))} remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiKeys.length}</div>
                <p className="text-xs text-muted-foreground">
                  {apiKeys.filter(k => k.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {conversions.filter(c => c.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>Your latest file conversions</CardDescription>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No conversions yet. Start by using your API key to convert files.
                </p>
              ) : (
                <div className="space-y-2">
                  {conversions.slice(0, 5).map((conversion) => (
                    <div key={conversion.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{conversion.toolName}</p>
                        <p className="text-sm text-muted-foreground">{conversion.inputFilename}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            conversion.status === 'completed' ? 'default' : 
                            conversion.status === 'failed' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {conversion.status}
                        </Badge>
                        {conversion.status === 'completed' && conversion.downloadUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(conversion.downloadUrl!, '_blank')}
                          >
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
              <CardDescription>
                Create a new API key for accessing the conversion tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="api-key-name">API Key Name</Label>
                  <Input
                    id="api-key-name"
                    placeholder="e.g., Production API, Test Key"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => generateApiKey.mutate(newApiKeyName || 'Default API Key')}
                    disabled={generateApiKey.isPending}
                  >
                    {generateApiKey.isPending ? 'Generating...' : 'Generate Key'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for accessing the conversion service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No API keys yet. Generate your first API key above.
                </p>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{apiKey.name}</h3>
                          <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                            {apiKey.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {apiKey.keyPreview}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Used {apiKey.usageCount} times</span>
                          <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                          {apiKey.lastUsed && (
                            <span>Last used {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(apiKey.keyPreview, 'API key preview')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {apiKey.isActive && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deactivateApiKey.mutate(apiKey.id)}
                            disabled={deactivateApiKey.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
              <CardDescription>
                View all your file conversions with detailed status information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No conversions yet. Use your API key to start converting files.
                </p>
              ) : (
                <div className="space-y-4">
                  {conversions.map((conversion) => (
                    <div key={conversion.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{conversion.toolName}</h3>
                            <Badge 
                              variant={
                                conversion.status === 'completed' ? 'default' : 
                                conversion.status === 'failed' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {conversion.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Input: {conversion.inputFilename}
                          </p>
                          {conversion.outputFilename && (
                            <p className="text-sm text-muted-foreground">
                              Output: {conversion.outputFilename}
                            </p>
                          )}
                          {conversion.errorMessage && (
                            <p className="text-sm text-red-600 mt-1">
                              Error: {conversion.errorMessage}
                            </p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                            <span>Created {new Date(conversion.createdAt).toLocaleString()}</span>
                            {conversion.processingTime && (
                              <span>Processed in {(conversion.processingTime / 1000).toFixed(1)}s</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {conversion.status === 'completed' && conversion.downloadUrl && (
                            <Button
                              size="sm"
                              onClick={() => window.open(conversion.downloadUrl!, '_blank')}
                            >
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and subscription information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label>Plan</Label>
                  <div className="flex items-center gap-2">
                    <Input value={user?.plan?.toUpperCase() || ''} disabled />
                    <Button size="sm" variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Daily Limit</Label>
                  <Input value={user?.limits.daily || 0} disabled />
                </div>
                <div>
                  <Label>Monthly Limit</Label>
                  <Input value={user?.limits.monthly || 0} disabled />
                </div>
              </div>
              <div>
                <Label>Member Since</Label>
                <Input 
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} 
                  disabled 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}