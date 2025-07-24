import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Image, Square, LayoutGrid, Play, Sparkles, Download, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  size: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'image';
  content: string;
  image?: GeneratedImage;
  timestamp: Date;
}

export const ImageGeneration = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState("1024x1024");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [chatInput, setChatInput] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeOptions = [
    {
      value: "1024x1024",
      label: "Square Post",
      icon: Square,
      description: "Instagram/Facebook Post"
    },
    {
      value: "1080x1350",
      label: "Portrait Post", 
      icon: LayoutGrid,
      description: "Instagram Carousel"
    },
    {
      value: "1080x1920",
      label: "Story/Reel",
      icon: Play,
      description: "Instagram Story/Reel"
    }
  ];

  const generateImage = async (imagePrompt: string, isModification = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate images.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: imagePrompt,
          size: selectedSize,
          userId: user.id
        }
      });

      if (error) throw error;

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        prompt: imagePrompt,
        size: selectedSize,
        timestamp: new Date()
      };

      setCurrentImage(newImage);

      // Add image to chat
      const imageMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'image',
        content: `Generated image: ${imagePrompt}`,
        image: newImage,
        timestamp: new Date()
      };

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I've generated your image! Would you like to save it or would you like me to make any modifications?",
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, imageMessage, assistantMessage]);

      if (!isModification) {
        // Clear the main prompt after successful generation
        setPrompt("");
      }

      toast({
        title: "Image Generated",
        description: "Your image has been created successfully!",
      });

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInitialGeneration = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for image generation.",
        variant: "destructive",
      });
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setChatMessages([userMessage]);
    generateImage(prompt);
  };

  const handleChatMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Check if user wants to save or modify
    const input = chatInput.toLowerCase();
    if (input.includes('save') || input.includes('download')) {
      handleSaveImage();
    } else {
      // Treat as modification request
      const modificationPrompt = currentImage ? 
        `${currentImage.prompt}, ${chatInput}` : 
        chatInput;
      generateImage(modificationPrompt, true);
    }

    setChatInput("");
  };

  const handleSaveImage = async () => {
    if (!currentImage) return;

    try {
      // Here you would implement saving to your storage/database
      toast({
        title: "Image Saved",
        description: "Your image has been saved successfully!",
      });

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "Great! Your image has been saved. You can generate a new image anytime!",
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSizeIcon = (size: string) => {
    const option = sizeOptions.find(opt => opt.value === size);
    return option ? option.icon : Square;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
          <Image className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI Image Generator</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Create stunning social media images with AI</p>
        </div>
      </div>

      {/* Chat Messages */}
      {chatMessages.length > 0 && (
        <Card className="p-6 bg-card/80 backdrop-blur-sm shadow-card border-border">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'image'
                      ? 'bg-gradient-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {message.type === 'image' && message.image ? (
                    <div className="space-y-3">
                      <img
                        src={message.image.url}
                        alt={message.image.prompt}
                        className="w-full rounded-lg"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-90">Size: {message.image.size}</span>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(message.image!.url, '_blank')}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSaveImage}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Generation Interface */}
      {chatMessages.length === 0 && (
        <Card className="p-6 lg:p-8 bg-card/80 backdrop-blur-sm shadow-elevated border-border">
          <div className="space-y-6">
            <div>
              <Label htmlFor="prompt" className="text-base font-semibold text-card-foreground">
                Image Prompt
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Describe the image you want to create in detail
              </p>
              <Textarea
                id="prompt"
                placeholder="e.g., A vibrant Instagram post featuring a modern workspace with a laptop, coffee cup, and plants, bright and professional lighting, clean minimalist style..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isGenerating}
              />
            </div>

            <div>
              <Label className="text-base font-semibold text-card-foreground">
                Image Size & Format
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose the format for your social media platform
              </p>
              <RadioGroup
                value={selectedSize}
                onValueChange={setSelectedSize}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {sizeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option.value}
                        className="flex-1 flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:border-primary transition-colors"
                      >
                        <IconComponent className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-card-foreground">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                          <div className="text-xs text-muted-foreground font-mono">{option.value}</div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <Button
              onClick={handleInitialGeneration}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Generating Image...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Chat Interface (shown after first generation) */}
      {chatMessages.length > 0 && (
        <Card className="p-4 bg-card/80 backdrop-blur-sm shadow-card border-border">
          <div className="flex space-x-2">
            <Input
              placeholder="Ask for modifications or type 'save' to save the image..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button
              onClick={handleChatMessage}
              disabled={isGenerating || !chatInput.trim()}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveImage}
              disabled={!currentImage}
            >
              <Save className="w-3 h-3 mr-1" />
              Save Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChatMessages([]);
                setCurrentImage(null);
                setChatInput("");
              }}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              New Image
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};