import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Clock, Save } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContentOption {
  id: string;
  mainTheme: string;
  caption: string;
  imagePrompt: string;
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
          tone
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      if (data?.options) {
        setGeneratedOptions(data.options);
      } else {
        throw new Error('No content options received');
      }

      toast({
        title: "Content Generated",
        description: `Generated ${data.options.length} content options successfully.`,
      });

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>AI Content Generator</span>
          </DialogTitle>
          {selectedDate && (
            <p className="text-muted-foreground">
              Creating content for {selectedDate.toLocaleDateString()}
            </p>
          )}
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{option.mainTheme}</Badge>
                        <input
                          type="radio"
                          checked={selectedOption === option.id}
                          readOnly
                          className="w-4 h-4"
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Caption:</h4>
                        <p className="text-sm text-muted-foreground">{option.caption}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Image Prompt:</h4>
                        <p className="text-sm text-muted-foreground">{option.imagePrompt}</p>
                      </div>

                      {option.carouselSlides && (
                        <div>
                          <h4 className="font-medium mb-2">Carousel Slides:</h4>
                          <div className="space-y-2">
                            {option.carouselSlides.map((slide) => (
                              <div key={slide.slideNumber} className="bg-muted/30 p-2 rounded">
                                <p className="text-xs font-medium">Slide {slide.slideNumber}</p>
                                <p className="text-xs">Image: {slide.imageGuideline}</p>
                                <p className="text-xs">Text: {slide.textGuideline}</p>
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