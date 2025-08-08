import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  TrendingUp, 
  Users, 
  Music, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  Target
} from 'lucide-react';
import { CSVUpload } from './CSVUpload';
import { CollaborationInsights } from '../analytics/CollaborationInsights';
import { ViralContentInsights } from '../analytics/ViralContentInsights';
import { AudioInsights } from '../analytics/AudioInsights';
import { useQuery } from '@tanstack/react-query';
import { instagramService } from '@/services/instagramService';

interface UnifiedCSVUploadProps {
  profiles: Array<{
    profile_id: string;
    username: string;
    full_name?: string;
  }>;
}

export const UnifiedCSVUpload: React.FC<UnifiedCSVUploadProps> = ({ profiles }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadCompleted, setUploadCompleted] = useState(false);

  // Fetch latest analytics after upload
  const { data: analyticsSummary, refetch: refetchAnalytics } = useQuery({
    queryKey: ['instagram-analytics-summary'],
    queryFn: () => instagramService.getAnalyticsSummary(),
    enabled: uploadCompleted,
  });

  const handleUploadSuccess = () => {
    setUploadCompleted(true);
    setActiveTab('insights');
    refetchAnalytics();
  };

  const features = [
    {
      icon: Upload,
      title: "Smart CSV Upload",
      description: "Auto-mapping with enhanced field detection",
      items: ["Collaboration tracking", "Audio insights", "Viral content analysis"]
    },
    {
      icon: TrendingUp,
      title: "Instant Analytics",
      description: "See your insights immediately after upload",
      items: ["Performance metrics", "Trend analysis", "Growth insights"]
    },
    {
      icon: Users,
      title: "Collaboration Intelligence",
      description: "Understand your partnership performance",
      items: ["Partner analysis", "UGC tracking", "Sponsored content ROI"]
    },
    {
      icon: Target,
      title: "Content Strategy",
      description: "AI-powered recommendations for better performance",
      items: ["Best posting times", "Trending audio", "Viral content patterns"]
    }
  ];

  const uploadSteps = [
    { step: 1, title: "Upload CSV", description: "Select and map your Instagram data" },
    { step: 2, title: "Auto-Process", description: "Enhanced transformation with AI insights" },
    { step: 3, title: "Get Insights", description: "Instant analytics and recommendations" },
    { step: 4, title: "Plan Content", description: "Use insights for strategic planning" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Unified Instagram Analytics
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your CSV data and get instant insights into collaboration performance, viral content trends, and strategic recommendations.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                <ul className="space-y-1">
                  {feature.items.map((item, index) => (
                    <li key={index} className="text-xs flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {uploadSteps.map((step, index) => (
              <div key={step.step} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                  {index < uploadSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-4 hidden md:block" />
                  )}
                </div>
                <h3 className="font-medium mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights
            {uploadCompleted && <Badge variant="destructive" className="ml-1">New</Badge>}
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Audio Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <CSVUpload profiles={profiles} />
          
          {uploadCompleted && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Upload Successful!</p>
                    <p className="text-sm text-green-600">Your data has been processed. Check the insights tabs for detailed analysis.</p>
                  </div>
                  <Button 
                    onClick={() => setActiveTab('insights')}
                    className="ml-auto"
                    size="sm"
                  >
                    View Insights
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {analyticsSummary ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ViralContentInsights 
                  viralStats={analyticsSummary.viralStats}
                  totalPosts={analyticsSummary.totalPosts}
                />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analyticsSummary.totalPosts}</div>
                        <div className="text-sm text-muted-foreground">Total Posts</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analyticsSummary.totalLikes.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Likes</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analyticsSummary.collaborationStats.collaborations}</div>
                        <div className="text-sm text-muted-foreground">Collaborations</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{analyticsSummary.viralStats.trendingClips}</div>
                        <div className="text-sm text-muted-foreground">Trending</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Upload your CSV data to see insights here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          {analyticsSummary?.collaborationStats ? (
            <CollaborationInsights 
              collaborationStats={analyticsSummary.collaborationStats}
              totalPosts={analyticsSummary.totalPosts}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Upload your CSV data to see collaboration insights</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          {analyticsSummary?.topAudioTracks ? (
            <AudioInsights topAudioTracks={analyticsSummary.topAudioTracks} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Upload your CSV data with audio information to see trends</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};