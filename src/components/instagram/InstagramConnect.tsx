import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Instagram, Plus, CheckCircle, AlertCircle, Loader2, RefreshCw, Crown, Target, X, Mail, CreditCard } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CSVExport } from './CSVExport';
import { SyncManagement } from './SyncManagement';
import { triggerManualSync } from '@/utils/manualSync';
import type { Database } from "@/integrations/supabase/types";

type InstagramProfile = Database['public']['Tables']['instagram_profiles']['Row'];

interface ConnectedAccount {
  id: string;
  username: string;
  type: 'owned' | 'competitor';
  profilePicture?: string;
  followerCount?: number;
}

export const InstagramConnect = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");

  // Competition Analysis State
  const [credits, setCredits] = useState(2);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    {
      id: '1',
      username: 'naukridotcom',
      type: 'owned',
      profilePicture: 'https://via.placeholder.com/48',
      followerCount: 850000
    },
    {
      id: '2',
      username: 'swiggyindia',
      type: 'competitor',
      profilePicture: 'https://via.placeholder.com/48',
      followerCount: 1200000
    }
  ]);
  const [newUsername, setNewUsername] = useState('');
  const [accountType, setAccountType] = useState<'owned' | 'competitor'>('owned');
  const [isConnectingCompetition, setIsConnectingCompetition] = useState(false);

  const maxAccounts = 3;
  const creditCost = 90;

  // Fetch user's Instagram profiles
  const { data: connections, isLoading } = useQuery({
    queryKey: ['instagram-profiles'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('instagram_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      return data as InstagramProfile[];
    },
    enabled: !!user,
  });

  // Connect Instagram profile using enhanced sync
  const connectInstagram = useMutation({
    mutationFn: async (instagramUsername: string) => {
      if (!user || !instagramUsername.trim()) {
        throw new Error('Username is required');
      }
      
      console.log('Connecting to Instagram profile:', instagramUsername);

      const { data, error } = await supabase.functions.invoke('instagram-enhanced-sync', {
        body: { 
          action: 'sync_profile', 
          profile_id: instagramUsername.trim().replace('@', ''),
          sync_type: 'profile' 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to connect profile');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['content-list'] });
      toast({
        title: "Profile Connected!",
        description: `Successfully connected ${data.profile_id}`,
      });
      setUsername('');
    },
    onError: (error: any) => {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Instagram profile. Please check the username and try again.",
        variant: "destructive",
      });
    }
  });

  // Sync content for a connected profile
  const syncContent = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke('instagram-enhanced-sync', {
        body: { 
          action: 'sync_full', 
          profile_id: profileId,
          sync_type: 'full'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to sync content');

      return data;
    },
    onSuccess: (data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['content-list'] });
      queryClient.invalidateQueries({ queryKey: ['performance-by-type'] });
      toast({
        title: "Content Synced!",
        description: `Successfully synced content for ${profileId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleConnect = async () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter an Instagram username",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      await connectInstagram.mutateAsync(username);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async (profileId: string) => {
    await syncContent.mutateAsync(profileId);
  };

  // Competition Analysis Functions
  const handleConnectCompetitionAccount = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter an Instagram username",
        variant: "destructive",
      });
      return;
    }

    if (connectedAccounts.length >= maxAccounts) {
      toast({
        title: "Account Limit Reached",
        description: `You can only connect up to ${maxAccounts} accounts`,
        variant: "destructive",
      });
      return;
    }

    if (credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need 1 credit to add an account. Please purchase more credits.",
        variant: "destructive",
      });
      return;
    }

    setIsConnectingCompetition(true);
    
    // Simulate API call
    setTimeout(() => {
      const newAccount: ConnectedAccount = {
        id: Date.now().toString(),
        username: newUsername.trim().replace('@', ''),
        type: accountType,
        profilePicture: 'https://via.placeholder.com/48',
        followerCount: Math.floor(Math.random() * 1000000) + 100000
      };

      setConnectedAccounts([...connectedAccounts, newAccount]);
      setCredits(credits - 1);
      setNewUsername('');
      setIsConnectingCompetition(false);

      toast({
        title: "Account Connected!",
        description: `Successfully connected @${newAccount.username}. ${credits - 1} credits remaining.`,
      });
    }, 2000);
  };

  const handleRemoveAccount = (accountId: string) => {
    const account = connectedAccounts.find(acc => acc.id === accountId);
    setConnectedAccounts(connectedAccounts.filter(acc => acc.id !== accountId));
    
    toast({
      title: "Account Removed",
      description: `@${account?.username} has been removed. Credits are not refunded.`,
    });
  };

  const handlePurchaseCredits = () => {
    const subject = "Request for Competition Analysis Credits";
    const body = `Hi,

I would like to purchase credits for Competition Analysis feature.

Current Credits: ${credits}
Credits Needed: Please let me know available packages

Account Details:
- Current connected accounts: ${connectedAccounts.length}/${maxAccounts}

Please provide payment instructions and credit packages.

Thank you!`;

    const mailtoLink = `mailto:support@yourdomain.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    toast({
      title: "Email Client Opened",
      description: "Please send the email to purchase more credits.",
    });
  };

  const ownedAccounts = connectedAccounts.filter(acc => acc.type === 'owned');
  const competitorAccounts = connectedAccounts.filter(acc => acc.type === 'competitor');

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instagram Connect</h1>
          <p className="text-muted-foreground">Connect your Instagram accounts for analytics and competition analysis</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Analytics Connections
          </TabsTrigger>
          <TabsTrigger value="competition" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Competition Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Connect New Instagram Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Connect Instagram Account
              </CardTitle>
              <CardDescription>
                Connect your Instagram account to access analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="username">Instagram Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter username (without @)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting || !username.trim()}
                    className="min-w-[100px]"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          {connections && connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Connected Accounts ({connections.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {connection.profile_picture_url ? (
                            <img 
                              src={connection.profile_picture_url} 
                              alt={connection.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            connection.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">@{connection.username}</h3>
                          <p className="text-sm text-muted-foreground">
                            {connection.follower_count?.toLocaleString()} followers
                            {connection.is_business_account && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Business
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Connected {new Date(connection.connected_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(connection.profile_id)}
                          disabled={syncContent.isPending}
                        >
                          {syncContent.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Sync
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CSV Export */}
          <CSVExport 
            connectedProfiles={connections?.map(conn => ({
              id: conn.profile_id,
              username: conn.username,
              displayName: conn.full_name || conn.username
            })) || []} 
          />

          {/* Sync Management */}
          <SyncManagement />
        </TabsContent>

        <TabsContent value="competition" className="space-y-6">
          {/* Credits Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Competition Analysis Credits
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{credits}</span>
                  <span className="text-sm text-muted-foreground">credits remaining</span>
                </div>
              </CardTitle>
              <CardDescription>
                Each competitor account connection costs 1 credit. Credits expire after 30 days.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Competition Accounts Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Owned Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Your Accounts ({ownedAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ownedAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {ownedAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <img 
                            src={account.profilePicture} 
                            alt={account.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">@{account.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.followerCount?.toLocaleString()} followers
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAccount(account.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No owned accounts connected yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Competitor Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-500" />
                  Competitor Accounts ({competitorAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competitorAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {competitorAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <img 
                            src={account.profilePicture} 
                            alt={account.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">@{account.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.followerCount?.toLocaleString()} followers
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAccount(account.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No competitor accounts added yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add New Competition Account */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Account</CardTitle>
              <CardDescription>
                Connect an owned account (free) or track a competitor (1 credit)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newUsername">Instagram Username</Label>
                  <Input
                    id="newUsername"
                    placeholder="Enter username (without @)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <select
                    id="accountType"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as 'owned' | 'competitor')}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="owned">Your Account (Free)</option>
                    <option value="competitor">Competitor (1 Credit)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Cost: {accountType === 'competitor' ? '1 credit' : 'Free'}
                  {accountType === 'competitor' && credits < 1 && (
                    <span className="text-red-500 ml-2">Insufficient credits</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePurchaseCredits}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Purchase Credits
                  </Button>
                  <Button
                    onClick={handleConnectCompetitionAccount}
                    disabled={
                      isConnectingCompetition || 
                      !newUsername.trim() || 
                      (accountType === 'competitor' && credits < 1) ||
                      connectedAccounts.length >= maxAccounts
                    }
                  >
                    {isConnectingCompetition ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};