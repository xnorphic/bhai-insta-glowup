
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, Plus, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
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

export const InstagramConnect = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

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
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Instagram className="w-6 h-6 mr-2 text-pink-500" />
              Instagram Connections
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
      </Card>

      {connections && connections.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            🎉 Great! Your Instagram account is connected. You can now view your analytics dashboard with real data.
            Use the "Sync" button to update your content data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
