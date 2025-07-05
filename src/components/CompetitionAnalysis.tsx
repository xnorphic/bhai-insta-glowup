
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Heart, MessageCircle, Eye } from "lucide-react";
import { instagramDataLoader } from "@/services/instagramDataLoader";
import { DataLoader } from "@/components/instagram/DataLoader";

export const CompetitionAnalysis = () => {
  const [competitorData, setCompetitorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitorData();
  }, []);

  const loadCompetitorData = async () => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
      
      const data = await instagramDataLoader.getContentForDateRange(
        startDate, 
        endDate, 
        ['swiggyindia', 'naukridotcom']
      );
      
      setCompetitorData(data);
    } catch (error) {
      console.error('Error loading competitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileStats = (profileId: string) => {
    const profilePosts = competitorData.filter(post => post.tracked_profile_id === profileId);
    
    if (profilePosts.length === 0) return null;
    
    const totalLikes = profilePosts.reduce((sum, post) => sum + post.total_likes, 0);
    const totalComments = profilePosts.reduce((sum, post) => sum + post.total_comments, 0);
    const totalViews = profilePosts.reduce((sum, post) => sum + post.total_views, 0);
    const avgEngagement = Math.round((totalLikes + totalComments) / profilePosts.length);
    
    return {
      posts: profilePosts.length,
      totalLikes,
      totalComments,
      totalViews,
      avgEngagement,
      recentPosts: profilePosts.slice(0, 5)
    };
  };

  const naukriStats = getProfileStats('naukridotcom');
  const swiggyStats = getProfileStats('swiggyindia');

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#333333]">Competition Analysis</h1>
        <DataLoader />
        <Card className="p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#333333]">Competition Analysis</h1>
      
      <DataLoader />

      {(naukriStats || swiggyStats) ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="naukri">Naukri.com</TabsTrigger>
            <TabsTrigger value="swiggy">Swiggy India</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {naukriStats && (
                <Card className="p-6 bg-white rounded-2xl shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-[#333333]">Naukri.com</h3>
                      <Badge className="bg-green-100 text-green-800">Owned</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#333333]">{naukriStats.posts}</p>
                        <p className="text-sm text-[#666666]">Posts (60d)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#333333]">{naukriStats.avgEngagement}</p>
                        <p className="text-sm text-[#666666]">Avg Engagement</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center"><Heart className="w-4 h-4 mr-1 text-red-500" />{naukriStats.totalLikes.toLocaleString()}</span>
                      <span className="flex items-center"><MessageCircle className="w-4 h-4 mr-1 text-blue-500" />{naukriStats.totalComments.toLocaleString()}</span>
                      <span className="flex items-center"><Eye className="w-4 h-4 mr-1 text-green-500" />{naukriStats.totalViews.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              )}

              {swiggyStats && (
                <Card className="p-6 bg-white rounded-2xl shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-[#333333]">Swiggy India</h3>
                      <Badge className="bg-orange-100 text-orange-800">Competitor</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#333333]">{swiggyStats.posts}</p>
                        <p className="text-sm text-[#666666]">Posts (60d)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#333333]">{swiggyStats.avgEngagement}</p>
                        <p className="text-sm text-[#666666]">Avg Engagement</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center"><Heart className="w-4 h-4 mr-1 text-red-500" />{swiggyStats.totalLikes.toLocaleString()}</span>
                      <span className="flex items-center"><MessageCircle className="w-4 h-4 mr-1 text-blue-500" />{swiggyStats.totalComments.toLocaleString()}</span>
                      <span className="flex items-center"><Eye className="w-4 h-4 mr-1 text-green-500" />{swiggyStats.totalViews.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {naukriStats && swiggyStats && (
              <Card className="p-6 bg-white rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-[#333333] mb-4">Performance Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-[#666666] mb-1">Posts Published</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Naukri</span>
                        <span className="font-bold">{naukriStats.posts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Swiggy</span>
                        <span className="font-bold">{swiggyStats.posts}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#666666] mb-1">Avg Engagement</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Naukri</span>
                        <span className="font-bold">{naukriStats.avgEngagement}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Swiggy</span>
                        <span className="font-bold">{swiggyStats.avgEngagement}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#666666] mb-1">Total Likes</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Naukri</span>
                        <span className="font-bold">{(naukriStats.totalLikes / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Swiggy</span>
                        <span className="font-bold">{(swiggyStats.totalLikes / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#666666] mb-1">Total Views</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Naukri</span>
                        <span className="font-bold">{(naukriStats.totalViews / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Swiggy</span>
                        <span className="font-bold">{(swiggyStats.totalViews / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="naukri">
            {naukriStats ? (
              <Card className="p-6 bg-white rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-[#333333] mb-4">Naukri.com Recent Posts</h3>
                <div className="space-y-4">
                  {naukriStats.recentPosts.map((post, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <img 
                        src={post.thumbnail_url} 
                        alt="Post thumbnail"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] line-clamp-2 mb-2">
                          {post.caption || 'No caption'}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-[#666666]">
                          <span>❤️ {post.total_likes}</span>
                          <span>💬 {post.total_comments}</span>
                          <span>👁️ {post.total_views}</span>
                          <span>{new Date(post.post_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 bg-white rounded-2xl shadow-lg text-center">
                <h3 className="text-xl font-semibold text-[#333333] mb-2">No Data Available</h3>
                <p className="text-[#666666]">Use the Data Loader above to fetch Naukri.com content</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="swiggy">
            {swiggyStats ? (
              <Card className="p-6 bg-white rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-[#333333] mb-4">Swiggy India Recent Posts</h3>
                <div className="space-y-4">
                  {swiggyStats.recentPosts.map((post, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <img 
                        src={post.thumbnail_url} 
                        alt="Post thumbnail"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-[#333333] line-clamp-2 mb-2">
                          {post.caption || 'No caption'}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-[#666666]">
                          <span>❤️ {post.total_likes}</span>
                          <span>💬 {post.total_comments}</span>
                          <span>👁️ {post.total_views}</span>
                          <span>{new Date(post.post_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 bg-white rounded-2xl shadow-lg text-center">
                <h3 className="text-xl font-semibold text-[#333333] mb-2">No Data Available</h3>
                <p className="text-[#666666]">Use the Data Loader above to fetch Swiggy India content</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="p-8 bg-white rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-[#333333] mb-4">Ready to Load Data</h2>
          <p className="text-[#666666] max-w-2xl mx-auto mb-4">
            Use the Data Loader above to fetch Instagram data for Naukri.com and Swiggy India. 
            This will load the last 60 days of posts for competitive analysis.
          </p>
        </Card>
      )}
    </div>
  );
};
