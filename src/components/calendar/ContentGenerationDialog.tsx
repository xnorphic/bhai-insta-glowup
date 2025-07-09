import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Save } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

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
    
    // Mock generation - replace with actual AI API call
    const mockOptions: ContentOption[] = [
      {
        id: "1",
        mainTheme: "Career Growth & Opportunities",
        caption: "🚀 Ready to take your career to the next level? Discover thousands of opportunities waiting for you on Naukri.com. Your dream job is just a click away! #CareerGrowth #DreamJob #Naukri",
        imagePrompt: "Professional office setting with diverse employees collaborating, modern workspace with Naukri.com branding, bright and motivational lighting, corporate blue and orange color scheme",
        carouselSlides: contentType === "carousel" ? [
          {
            slideNumber: 1,
            imageGuideline: "Hero shot of a professional looking at laptop with job listings",
            textGuideline: "Your Career Journey Starts Here"
          },
          {
            slideNumber: 2,
            imageGuideline: "Multiple job category icons and statistics",
            textGuideline: "10 Million+ Jobs Across Industries"
          },
          {
            slideNumber: 3,
            imageGuideline: "Success story visual with employee testimonial",
            textGuideline: "Join 70 Million+ Job Seekers"
          }
        ] : undefined
      },
      {
        id: "2",
        mainTheme: "Skill Development & Learning",
        caption: "💡 Invest in yourself! Upskill with Naukri.com's learning resources and stay ahead in your career. Knowledge is your competitive advantage. #SkillDevelopment #LearningNeverStops #CareerTips",
        imagePrompt: "Modern learning environment with books, digital devices, and skill icons floating around, professional setting with warm lighting, knowledge and growth theme",
        carouselSlides: contentType === "carousel" ? [
          {
            slideNumber: 1,
            imageGuideline: "Person studying with digital devices and learning materials",
            textGuideline: "Continuous Learning = Career Success"
          },
          {
            slideNumber: 2,
            imageGuideline: "Skill categories and certification badges",
            textGuideline: "100+ Skills to Master"
          },
          {
            slideNumber: 3,
            imageGuideline: "Before/after career progression visual",
            textGuideline: "Transform Your Career Today"
          }
        ] : undefined
      },
      {
        id: "3",
        mainTheme: "Recruitment Solutions",
        caption: "🎯 Looking for top talent? Naukri.com connects you with the best candidates across industries. Streamline your hiring process today! #Recruitment #HiringMadeEasy #TopTalent",
        imagePrompt: "Corporate boardroom with HR professionals reviewing candidate profiles on screens, professional hiring atmosphere, corporate colors with technology integration",
        carouselSlides: contentType === "carousel" ? [
          {
            slideNumber: 1,
            imageGuideline: "HR team discussing candidate profiles",
            textGuideline: "Find the Perfect Match"
          },
          {
            slideNumber: 2,
            imageGuideline: "Resume database visualization",
            textGuideline: "Access 70M+ Resumes"
          },
          {
            slideNumber: 3,
            imageGuideline: "Successful hiring handshake",
            textGuideline: "Hire Faster, Hire Better"
          }
        ] : undefined
      }
    ];

    // Simulate API delay
    setTimeout(() => {
      setGeneratedOptions(mockOptions);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSaveDraft = () => {
    const selected = generatedOptions.find(opt => opt.id === selectedOption);
    if (selected) {
      const formData = {
        platform,
        contentType,
        theme,
        tone,
        eventDate: selectedDate
      };
      onSaveDraft(selected, formData);
      onOpenChange(false);
      // Reset form
      setGeneratedOptions([]);
      setSelectedOption(null);
      setTheme("");
      setTone("");
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