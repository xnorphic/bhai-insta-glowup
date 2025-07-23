import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Clock, Save, PenTool, Palette, Video } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ContentOption {
  id: string;
  mainTheme: string;
  textWriteAgent: {
    caption: string;
  };
  artistAgent: {
    imagePrompt: string;
  };
  videoAgent: {
    reelIdea: string;
  };
  reasoning?: string;
  targetGroup?: string;
  intendedFeeling?: string;
  carouselSlides?: {
    slideNumber: number;
    imageGuideline: string;
    textGuideline: string;
  }[];
}

interface ContentGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSaveDraft: (option: ContentOption, formData: any) => void;
}

export const ContentGenerationDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onSaveDraft
}: ContentGenerationDialogProps) => {
  const [platform, setPlatform] = useState<Database['public']['Enums']['platform_type']>("instagram");
  const [contentType, setContentType] = useState<Database['public']['Enums']['calendar_content_type']>("post");
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<ContentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const toneOptions = [
    "Professional",
    "Quirky", 
    "Generic",
    "Dark Humour",
    "Inspirational",
    "Casual",
    "Authoritative"
  ];

  const generateContent = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedOptions([]);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 80));
      }, 200);

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          platform,
          contentType,
          theme,
          tone,
          userId: user?.id
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('API Response:', data);

      if (data?.options && Array.isArray(data.options)) {
        // Ensure the data structure matches our interface
        const processedOptions = data.options.map((option: any) => ({
          id: option.id || Math.random().toString(),
          mainTheme: option.mainTheme || 'Generated Content',
          textWriteAgent: {
            caption: option.textWriteAgent?.caption || option.caption || 'No caption available'
          },
          artistAgent: {
            imagePrompt: option.artistAgent?.imagePrompt || option.imagePrompt || 'No image prompt available'
          },
          videoAgent: {
            reelIdea: option.videoAgent?.reelIdea || 'No video idea available'
          },
          reasoning: option.reasoning,
          targetGroup: option.targetGroup,
          intendedFeeling: option.intendedFeeling,
          carouselSlides: option.carouselSlides
        }));
        
        console.log('Processed Options:', processedOptions);
        setGeneratedOptions(processedOptions);
        
        toast({
          title: "Content Generated",
          description: `Generated ${processedOptions.length} content options successfully.`,
        });
      } else {
        console.error('Invalid response format:', data);
        throw new Error('No valid content options received');
      }

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleSaveDraft = async () => {
    const selected = generatedOptions.find(opt => opt.id === selectedOption);
    if (selected) {
      try {
        const formData = {
          platform,
          contentType,
          theme,
          tone,
          eventDate: selectedDate
        };

        // Get current user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get username from users table
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();

        // Save to drafts table
        const { error } = await supabase
          .from('drafts')
          .insert([{
            user_id: user.id,
            content_data: selected,
            form_data: formData,
            created_by_username: userData?.username || user.email || 'Unknown User'
          }] as any);

        if (error) throw error;

        onSaveDraft(selected, formData);
        onOpenChange(false);
        
        // Reset form
        setGeneratedOptions([]);
        setSelectedOption(null);
        setTheme("");
        setTone("");

        toast({
          title: "Draft Saved",
          description: "Your content has been saved as a draft for review.",
        });
      } catch (error) {
        console.error('Error saving draft:', error);
        toast({
          title: "Error",
          description: "Failed to save draft. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white" aria-describedby="content-generation-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>AI Content Generator</span>
          </DialogTitle>
          <div id="content-generation-description" className="text-muted-foreground">
            {selectedDate ? (
              <>Creating content for {selectedDate.toLocaleDateString()}</>
            ) : (
              <>Generate AI-powered content ideas for your social media</>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={(value: Database['public']['Enums']['platform_type']) => setPlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <Select value={contentType} onValueChange={(value: Database['public']['Enums']['calendar_content_type']) => setContentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <Input
                placeholder="e.g., Career Growth, Job Search Tips"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option} value={option.toLowerCase()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateContent}
            disabled={isGenerating || !theme || !tone}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content Ideas
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Generating content with AI...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Generated Options */}
          {generatedOptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generated Content Options</h3>
              <div className="grid grid-cols-1 gap-4">
                {generatedOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedOption === option.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-sm font-medium">{option.mainTheme}</Badge>
                        <input
                          type="radio"
                          checked={selectedOption === option.id}
                          readOnly
                          className="w-4 h-4"
                        />
                      </div>
                      
                      {/* TextWrite Agent */}
                      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <PenTool className="w-4 h-4 text-blue-600" />
                          <h4 className="font-semibold text-blue-800">TextWrite Agent</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-blue-700">Caption:</p>
                          <p className="text-sm text-blue-600 leading-relaxed">{option.textWriteAgent.caption}</p>
                        </div>
                      </div>

                      {/* Artist Agent */}
                      <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50/50 rounded-r-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Palette className="w-4 h-4 text-purple-600" />
                          <h4 className="font-semibold text-purple-800">Artist Agent</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-purple-700">Image Prompt:</p>
                          <p className="text-sm text-purple-600 leading-relaxed">{option.artistAgent.imagePrompt}</p>
                        </div>
                      </div>

                      {/* Video Agent */}
                      <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Video className="w-4 h-4 text-green-600" />
                          <h4 className="font-semibold text-green-800">Video Agent</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-700">Reel Idea:</p>
                          <p className="text-sm text-green-600 leading-relaxed whitespace-pre-line">{option.videoAgent.reelIdea}</p>
                        </div>
                      </div>

                      {/* Additional Information */}
                      {(option.reasoning || option.targetGroup || option.intendedFeeling) && (
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                          <h4 className="font-medium text-gray-800 mb-2">Strategy Insights</h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            {option.targetGroup && <p><span className="font-medium">Target:</span> {option.targetGroup}</p>}
                            {option.intendedFeeling && <p><span className="font-medium">Emotion:</span> {option.intendedFeeling}</p>}
                            {option.reasoning && <p><span className="font-medium">Why it works:</span> {option.reasoning}</p>}
                          </div>
                        </div>
                      )}

                      {option.carouselSlides && (
                        <div className="border border-orange-200 rounded-lg p-3 bg-orange-50/50">
                          <h4 className="font-medium text-orange-800 mb-2">Carousel Slides:</h4>
                          <div className="space-y-2">
                            {option.carouselSlides.map((slide) => (
                              <div key={slide.slideNumber} className="bg-white p-2 rounded border border-orange-200">
                                <p className="text-xs font-medium text-orange-700">Slide {slide.slideNumber}</p>
                                <p className="text-xs text-orange-600 mt-1">Image: {slide.imageGuideline}</p>
                                <p className="text-xs text-orange-600">Text: {slide.textGuideline}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {selectedOption && (
                <Button
                  onClick={handleSaveDraft}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};