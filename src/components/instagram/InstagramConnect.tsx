
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
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

interface InstagramConnection {
  id: string;
  username: string;
  profile_picture_url: string | null;
  follower_count: number | null;
  is_business_account: boolean | null;
  connected_at: string;
  is_active: boolean;
}

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
    }
  ]);
  const [newUsername, setNewUsername] = useState('');
  const [accountType, setAccountType] = useState<'owned' | 'competitor'>('owned');
  const [isConnectingCompetition, setIsConnectingCompetition] = useState(false);

  const maxAccounts = 3;
  const creditCost = 90;

  // Fetch user's Instagram connections
  const { data: connections, isLoading } = useQuery({
    queryKey: ['instagram-connections'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('instagram_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      return data as InstagramConnection[];
    },
    enabled: !!user,
  });

  // Connect Instagram profile using StarAPI
  const connectInstagram = useMutation({
    mutationFn: async (instagramUsername: string) => {
      if (!user || !instagramUsername.trim()) {
        throw new Error('Username is required');
      }
      
      console.log('Connecting to Instagram profile:', instagramUsername);

      const { data, error } = await supabase.functions.invoke('instagram-starapi', {
        body: { 
          action: 'connect_profile', 
          username: instagramUsername.trim().replace('@', '') 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to connect profile');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-connections'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['content-list'] });
      toast({
        title: "Profile Connected!",
        description: `Successfully connected @${data.connection.username}`,
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
    mutationFn: async (profileUsername: string) => {
      const { data, error } = await supabase.functions.invoke('instagram-starapi', {
        body: { 
          action: 'sync_content', 
          username: profileUsername 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to sync content');

      return data;
    },
    onSuccess: (data, profileUsername) => {
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['content-list'] });
      queryClient.invalidateQueries({ queryKey: ['performance-by-type'] });
      toast({
        title: "Content Synced!",
        description: `Synced ${data.synced_posts} posts from @${profileUsername}`,
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

  const handleSync = async (profileUsername: string) => {
    await syncContent.mutateAsync(profileUsername);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics">Analytics Connections</TabsTrigger>
          <TabsTrigger value="competition">Competition Analysis</TabsTrigger>
        </TabsList>

        {/* Analytics Connections Tab */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Instagram className="w-6 h-6 mr-2 text-pink-500" />
                  Instagram Analytics Connections
                </h3>
                <p className="text-gray-600 mt-1">
                  Connect your Instagram accounts to start tracking analytics
                </p>
              </div>
            </div>

            {/* Connection Form */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Instagram Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username (e.g., naukridotcom)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                    disabled={isConnecting}
                  />
                </div>
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting || !username.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Profile
                    </>
                  )}
                </Button>
              </div>
            </div>

            {connectInstagram.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {connectInstagram.error.message}
                </AlertDescription>
              </Alert>
            )}

            {connections && connections.length > 0 ? (
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={connection.profile_picture_url || 'https://via.placeholder.com/48'}
                        alt={`@${connection.username}`}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">@{connection.username}</h4>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span>{connection.follower_count?.toLocaleString() || 0} followers</span>
                          {connection.is_business_account && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Business
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(connection.username)}
                        disabled={syncContent.isPending}
                      >
                        {syncContent.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="ml-1">Sync</span>
                      </Button>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h4>
                <p className="text-gray-600 mb-6">
                  Enter an Instagram username above to start analyzing content performance
                </p>
              </div>
            )}

            {connections && connections.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎉 Great! Your Instagram account is connected. You can now view your analytics dashboard with real data.
                  Use the "Sync" button to update your content data.
                </AlertDescription>
              </Alert>
            )}
          </Card>
        </TabsContent>

        {/* Competition Analysis Tab */}
        <TabsContent value="competition">
          <div className="space-y-6">
            {/* Credits and Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Target className="w-6 h-6 mr-2 text-red-500" />
                    Competition Analysis - Connect Accounts
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Connect your own account and competitor accounts for detailed analysis
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span className="text-lg font-semibold">{credits} Credits</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {connectedAccounts.length}/{maxAccounts} accounts connected
                  </p>
                </div>
              </div>

              {credits === 0 && (
                <Alert className="mb-4">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    You're out of credits! Each account requires 1 credit (${creditCost} USD).{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={handlePurchaseCredits}>
                      Click here to purchase more credits
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            {/* Connect New Account */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4">Connect New Account</h4>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <Button
                    variant={accountType === 'owned' ? 'default' : 'outline'}
                    onClick={() => setAccountType('owned')}
                    className="flex items-center space-x-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Own Account</span>
                  </Button>
                  <Button
                    variant={accountType === 'competitor' ? 'default' : 'outline'}
                    onClick={() => setAccountType('competitor')}
                    className="flex items-center space-x-2"
                  >
                    <Target className="w-4 h-4" />
                    <span>Competitor</span>
                  </Button>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="competition-username">Instagram Username</Label>
                    <Input
                      id="competition-username"
                      type="text"
                      placeholder="Enter username (e.g., swiggyindia)"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleConnectCompetitionAccount()}
                      disabled={isConnectingCompetition || connectedAccounts.length >= maxAccounts}
                    />
                  </div>
                  <div className="flex items-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          disabled={isConnectingCompetition || connectedAccounts.length >= maxAccounts || credits < 1}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          {isConnectingCompetition ? (
                            <>Connecting...</>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Connect (1 Credit)
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Account Connection</DialogTitle>
                          <DialogDescription>
                            You're about to connect <strong>@{newUsername}</strong> as a{' '}
                            <strong>{accountType === 'owned' ? 'owned' : 'competitor'}</strong> account.
                            <br /><br />
                            This will cost <strong>1 credit (${creditCost} USD)</strong>. 
                            You currently have <strong>{credits} credits</strong> left.
                            <br /><br />
                            <em>Note: Credits are not refunded when accounts are removed.</em>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setNewUsername('')}>Cancel</Button>
                          <Button onClick={handleConnectCompetitionAccount}>
                            Confirm Connection
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </Card>

            {/* Owned Accounts Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Your Accounts ({ownedAccounts.length})
                </h4>
              </div>
              
              {ownedAccounts.length > 0 ? (
                <div className="space-y-3">
                  {ownedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex items-center space-x-3">
                        <img
                          src={account.profilePicture}
                          alt={`@${account.username}`}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h5 className="font-medium">@{account.username}</h5>
                          <p className="text-sm text-gray-600">
                            {account.followerCount?.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No owned accounts connected</p>
              )}
            </Card>

            {/* Competitor Accounts Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold flex items-center">
                  <Target className="w-5 h-5 mr-2 text-red-500" />
                  Competitor Accounts ({competitorAccounts.length})
                </h4>
              </div>
              
              {competitorAccounts.length > 0 ? (
                <div className="space-y-3">
                  {competitorAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                      <div className="flex items-center space-x-3">
                        <img
                          src={account.profilePicture}
                          alt={`@${account.username}`}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h5 className="font-medium">@{account.username}</h5>
                          <p className="text-sm text-gray-600">
                            {account.followerCount?.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No competitor accounts connected</p>
              )}
            </Card>

            {/* Purchase Credits */}
            {credits < 3 && (
              <Card className="p-6 border-blue-200 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900">Need More Credits?</h4>
                    <p className="text-blue-700 mt-1">
                      Each credit costs ${creditCost} USD and allows you to connect one account.
                      <br />
                      Credits are not refunded when accounts are removed.
                    </p>
                  </div>
                  <Button 
                    onClick={handlePurchaseCredits}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Purchase Credits
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
