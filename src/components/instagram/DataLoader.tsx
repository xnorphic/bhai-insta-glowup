
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { triggerManualSync } from "@/utils/manualSync";
import { useToast } from "@/hooks/use-toast";

export const DataLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      const result = await triggerManualSync();
      setLastSync(new Date());
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${result.profiles_processed || 0} profiles`,
      });
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Failed to sync Instagram data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Data Synchronization
        </CardTitle>
        <CardDescription>
          Sync your latest Instagram data to get updated analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {lastSync ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Last synced: {lastSync.toLocaleString()}
                </span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">
                  No recent sync data available
                </span>
              </>
            )}
          </div>
          <Button 
            onClick={handleManualSync}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Syncing will fetch the latest posts and metrics from your connected Instagram profiles. 
            This may take a few minutes depending on the amount of content.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
