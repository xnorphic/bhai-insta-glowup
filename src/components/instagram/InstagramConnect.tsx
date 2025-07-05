
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const queryClient = useQueryClient();
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

  // Mock Instagram connection - In a real app, this would handle OAuth flow
  const connectInstagram = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock Instagram data - In production, this would come from Instagram API
      const mockInstagramData = {
        user_id: user.id,
        instagram_user_id: `ig_${Date.now()}`,
        username: 'demo_account',
        access_token: 'mock_access_token',
        profile_picture_url: 'https://via.placeholder.com/150',
        follower_count: 1250,
        following_count: 450,
        media_count: 89,
        is_business_account: true,
        account_type: 'business',
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      };

      const { data, error } = await supabase
        .from('instagram_connections')
        .insert([mockInstagramData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-connections'] });
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectInstagram.mutateAsync();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
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
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Connect Account
              </>
            )}
          </Button>
        </div>

        {connectInstagram.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect Instagram account. Please try again.
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
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h4>
            <p className="text-gray-600 mb-6">
              Connect your Instagram account to start analyzing your content performance
            </p>
          </div>
        )}
      </Card>

      {connections && connections.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            🎉 Great! Your Instagram account is connected. You can now view your analytics dashboard with real data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
