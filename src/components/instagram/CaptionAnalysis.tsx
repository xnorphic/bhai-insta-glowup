import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CaptionAnalysisProps {
  profileId: string;
  onComplete?: () => void;
}

interface AnalysisResult {
  media_id: string;
  caption: string;
  generated_tags: string[];
  confidence: number;
  analysis: string;
  status: 'pending' | 'completed' | 'error';
  error?: string;
}

export const CaptionAnalysis: React.FC<CaptionAnalysisProps> = ({ profileId, onComplete }) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');
  const [totalPosts, setTotalPosts] = useState(0);
  const [processedPosts, setProcessedPosts] = useState(0);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setIsPaused(false);
    setProgress(0);
    setResults([]);
    setProcessedPosts(0);

    try {
      // Fetch posts without tags or with minimal tags
      const { data: posts, error } = await supabase
        .from('instagram_media')
        .select('media_id, caption, hashtags')
        .eq('profile_id', profileId)
        .not('caption', 'is', null)
        .neq('caption', '')
        .order('timestamp', { ascending: false })
        .limit(50); // Process up to 50 posts at a time

      if (error) {
        throw error;
      }

      if (!posts || posts.length === 0) {
        toast({
          title: "No posts to analyze",
          description: "No posts with captions found for this profile.",
          variant: "default",
        });
        return;
      }

      setTotalPosts(posts.length);
      setCurrentAnalysis('Initializing analysis...');

      // Process posts one by one to avoid rate limiting
      for (let i = 0; i < posts.length; i++) {
        if (isPaused) {
          setCurrentAnalysis('Analysis paused');
          break;
        }

        const post = posts[i];
        setCurrentAnalysis(`Analyzing post ${i + 1} of ${posts.length}: ${post.caption.substring(0, 50)}...`);

        try {
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-caption-tags', {
            body: {
              caption: post.caption,
              existing_tags: post.hashtags || []
            }
          });

          if (analysisError) {
            throw analysisError;
          }

          const result: AnalysisResult = {
            media_id: post.media_id,
            caption: post.caption,
            generated_tags: analysisData.tags || [],
            confidence: analysisData.confidence || 0,
            analysis: analysisData.analysis || '',
            status: 'completed'
          };

          // Update the post with new tags (merge with existing hashtags)
          const existingTags = post.hashtags || [];
          const allTags = [...new Set([...existingTags, ...analysisData.tags])];

          await supabase
            .from('instagram_media')
            .update({ hashtags: allTags })
            .eq('media_id', post.media_id)
            .eq('profile_id', profileId);

          setResults(prev => [...prev, result]);
          setProcessedPosts(i + 1);
          setProgress(((i + 1) / posts.length) * 100);

          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error analyzing post ${post.media_id}:`, error);
          
          const errorResult: AnalysisResult = {
            media_id: post.media_id,
            caption: post.caption,
            generated_tags: [],
            confidence: 0,
            analysis: '',
            status: 'error',
            error: error.message
          };

          setResults(prev => [...prev, errorResult]);
          setProcessedPosts(i + 1);
          setProgress(((i + 1) / posts.length) * 100);
        }
      }

      setCurrentAnalysis('Analysis completed');
      toast({
        title: "Analysis completed",
        description: `Processed ${processedPosts} posts with AI-generated tags.`,
        variant: "default",
      });

      onComplete?.();

    } catch (error) {
      console.error('Caption analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing captions.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysis('');
    }
  };

  const pauseAnalysis = () => {
    setIsPaused(true);
    setIsAnalyzing(false);
  };

  const resumeAnalysis = () => {
    setIsPaused(false);
    setIsAnalyzing(true);
  };

  const completedResults = results.filter(r => r.status === 'completed');
  const errorResults = results.filter(r => r.status === 'error');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Caption Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {!isAnalyzing && !isPaused && (
              <Button onClick={startAnalysis} disabled={isAnalyzing}>
                <Play className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            )}
            {isAnalyzing && (
              <Button variant="outline" onClick={pauseAnalysis}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {isPaused && (
              <Button onClick={resumeAnalysis}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
          </div>

          {/* Progress */}
          {(isAnalyzing || isPaused || results.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentAnalysis || 'Ready'}</span>
                <span>{processedPosts} / {totalPosts}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Summary */}
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{completedResults.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">{errorResults.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {completedResults.reduce((sum, r) => sum + r.generated_tags.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Tags Generated</div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Analysis Results</h3>
            <ScrollArea className="h-96 border rounded-md p-4">
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={result.media_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {result.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">Post {index + 1}</span>
                      {result.status === 'completed' && (
                        <span className="text-xs text-muted-foreground">
                          Confidence: {(result.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <strong>Caption:</strong> {result.caption.substring(0, 150)}
                      {result.caption.length > 150 && '...'}
                    </div>

                    {result.status === 'completed' && result.generated_tags.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Generated Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {result.generated_tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {result.analysis && (
                          <div className="text-xs text-muted-foreground">
                            <strong>AI Analysis:</strong> {result.analysis}
                          </div>
                        )}
                      </div>
                    )}

                    {result.status === 'error' && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {result.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};