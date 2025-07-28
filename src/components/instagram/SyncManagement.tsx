import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { RefreshCw, Clock, AlertCircle, CheckCircle, Database, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SyncLog {
  id: string;
  profile_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_processed: number;
  records_updated: number;
  records_created: number;
  api_calls_made: number;
  error_message: string | null;
}

export const SyncManagement: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch recent sync logs
  const { data: syncLogs, isLoading } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SyncLog[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async (syncType: string) => {
      const { data, error } = await supabase.functions.invoke('instagram-cron-sync', {
        body: { sync_type: syncType }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sync completed: ${data.successful} profiles synced successfully`);
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-analytics'] });
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Sync failed. Please try again.');
    }
  });

  const handleManualSync = async (syncType: string) => {
    setIsSyncing(true);
    try {
      await syncMutation.mutateAsync(syncType);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'running':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Data Synchronization
          </CardTitle>
          <CardDescription>
            Manually trigger data sync or view automatic sync schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleManualSync('profile')}
              disabled={isSyncing || syncMutation.isPending}
              variant="outline"
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Sync Profiles Only
            </Button>
            <Button
              onClick={() => handleManualSync('content')}
              disabled={isSyncing || syncMutation.isPending}
              variant="outline"
              className="w-full"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Sync Content Only
            </Button>
            <Button
              onClick={() => handleManualSync('full')}
              disabled={isSyncing || syncMutation.isPending}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Full Sync
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Automatic Schedule:</strong> Data syncs automatically twice daily (8 AM & 8 PM UTC)</p>
            <p><strong>Profile Sync:</strong> Updates follower counts and basic profile information</p>
            <p><strong>Content Sync:</strong> Fetches latest posts and engagement metrics</p>
            <p><strong>Full Sync:</strong> Updates both profile information and content data</p>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Sync Activity
          </CardTitle>
          <CardDescription>
            View the history of data synchronization operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading sync history...</span>
            </div>
          ) : syncLogs && syncLogs.length > 0 ? (
            <div className="space-y-4">
              {syncLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="font-medium">
                        {log.profile_id === 'SYSTEM_CRON' ? 'Scheduled Sync' : `Profile: ${log.profile_id}`}
                      </span>
                      <Badge variant="outline" className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <Badge variant="secondary">
                        {log.sync_type}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(log.started_at)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Processed:</span>
                      <span className="ml-1 font-medium">{log.records_processed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="ml-1 font-medium">{log.records_updated}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-1 font-medium">{log.records_created}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">API Calls:</span>
                      <span className="ml-1 font-medium">{log.api_calls_made}</span>
                    </div>
                  </div>
                  
                  {log.error_message && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      <strong>Error:</strong> {log.error_message}
                    </div>
                  )}
                  
                  {log.completed_at && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Completed: {formatDate(log.completed_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No sync history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};