
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { instagramDataLoader, type InstagramProfile } from "@/services/instagramDataLoader";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_PROFILES: InstagramProfile[] = [
  {
    username: 'naukridotcom',
    displayName: 'Naukri.com',
    type: 'owned'
  },
  {
    username: 'swiggyindia',
    displayName: 'Swiggy India',
    type: 'competitor'
  }
];

export const DataLoader = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    setProgress(0);
    setResults([]);

    try {
      toast({
        title: "Loading Instagram Data",
        description: "Fetching data for the last 60 days...",
      });

      const profiles = DEFAULT_PROFILES;
      const totalProfiles = profiles.length;
      
      const loadResults = [];
      
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        setProgress(((i) / totalProfiles) * 100);
        
        try {
          console.log(`Loading ${profile.type} profile: ${profile.username}`);
          const result = await instagramDataLoader.loadProfileData(profile.username);
          
          loadResults.push({
            username: profile.username,
            displayName: profile.displayName,
            type: profile.type,
            success: true,
            data: result
          });
          
          toast({
            title: `✅ ${profile.displayName}`,
            description: `Loaded ${result.synced_posts || 0} posts successfully`,
          });
          
        } catch (error) {
          console.error(`Failed to load ${profile.username}:`, error);
          loadResults.push({
            username: profile.username,
            displayName: profile.displayName,
            type: profile.type,
            success: false,
            error: error.message
          });
          
          toast({
            title: `❌ ${profile.displayName}`,
            description: `Failed to load data: ${error.message}`,
            variant: "destructive"
          });
        }
      }
      
      setProgress(100);
      setResults(loadResults);
      
      const successCount = loadResults.filter(r => r.success).length;
      toast({
        title: "Data Loading Complete",
        description: `Successfully loaded data for ${successCount}/${totalProfiles} profiles`,
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load Instagram data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white rounded-2xl shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#333333]">Instagram Data Loader</h3>
            <p className="text-[#666666] text-sm">Load last 60 days of data for analysis</p>
          </div>
          <Button 
            onClick={loadData} 
            disabled={loading}
            className="bg-[hsl(240,70%,70%)] hover:bg-[hsl(240,70%,60%)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load Data'
            )}
          </Button>
        </div>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-[#666666] text-center">{Math.round(progress)}% complete</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-[#333333]">Loading Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium text-[#333333]">{result.displayName}</p>
                    <p className="text-sm text-[#666666]">@{result.username} • {result.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {result.success ? (
                    <p className="text-sm font-medium text-green-600">
                      {result.data?.synced_posts || 0} posts loaded
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">Failed</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-[#333333] mb-2">Profiles to Load:</h4>
          <div className="space-y-2">
            {DEFAULT_PROFILES.map((profile, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="font-medium">{profile.displayName}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  profile.type === 'owned' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {profile.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
