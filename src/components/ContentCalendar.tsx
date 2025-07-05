import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, Sparkles, Save, Plus, Star, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

interface ImportantDate {
  id: string;
  date_month: string;
  name: string;
  occasion_type: string;
  region_notes?: string;
  is_fixed_date: boolean;
}

interface CalendarEvent {
  id: string;
  event_date: string;
  platform: Database['public']['Enums']['platform_type'];
  content_type: Database['public']['Enums']['calendar_content_type'];
  post_category: Database['public']['Enums']['post_category'];
  user_input_focus?: string;
  ai_generated_post_ideas: string;
  ai_generated_captions?: any;
  ai_generated_image_prompts?: string;
  ai_reasoning: string;
  is_saved: boolean;
}

export const ContentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Form states
  const [platform, setPlatform] = useState<Database['public']['Enums']['platform_type']>("instagram");
  const [contentType, setContentType] = useState<Database['public']['Enums']['calendar_content_type']>("post");
  const [postCategory, setPostCategory] = useState<Database['public']['Enums']['post_category']>("festival");
  const [userFocus, setUserFocus] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchImportantDates();
    fetchCalendarEvents();
  }, []);

  const fetchImportantDates = async () => {
    try {
      const { data, error } = await supabase
        .from('important_dates')
        .select('*')
        .order('date_month');
      
      if (error) throw error;
      setImportantDates(data || []);
    } catch (error) {
      console.error('Error fetching important dates:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('content_calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      setCalendarEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const generatePostIdeas = async () => {
    if (!selectedDate || !user) return;

    setIsGenerating(true);
    try {
      // Find relevant important dates for the selected date
      const dateStr = format(selectedDate, 'MMMM d');
      const monthStr = format(selectedDate, 'MMMM');
      
      const relevantDates = importantDates.filter(date => 
        date.date_month.includes(dateStr) || 
        date.date_month.includes(monthStr) ||
        date.date_month.includes('(varies)')
      );

      // Generate AI post ideas (mock implementation - you can integrate with OpenAI later)
      const aiPostIdeas = `Based on ${selectedDate.toDateString()} and ${relevantDates.length > 0 ? relevantDates[0].name : 'the selected date'}, here are some content ideas:

1. Create a celebratory post about ${relevantDates.length > 0 ? relevantDates[0].name : 'this special day'}
2. Share behind-the-scenes content related to your brand
3. Engage with trending topics of the day
4. Educational content about your industry
5. User-generated content showcase`;

      const aiReasoning = `Selected this content mix to balance celebration of ${relevantDates.length > 0 ? relevantDates[0].name : 'the day'} with brand promotion and audience engagement.`;

      const aiCaptions = {
        primary: `🎉 Celebrating ${relevantDates.length > 0 ? relevantDates[0].name : 'this special day'}! ✨ #celebration #brand`,
        alternative: `Today's all about ${relevantDates.length > 0 ? relevantDates[0].name : 'making memories'}! Share your thoughts below 👇`,
        hashtags: "#celebration #brand #community #special"
      };

      const aiImagePrompts = `Create vibrant, celebratory images featuring ${relevantDates.length > 0 ? relevantDates[0].name : 'the occasion'} with brand colors and festive elements`;

      // Save to database
      const { data, error } = await supabase
        .from('content_calendar_events')
        .insert({
          user_id: user.id,
          event_date: format(selectedDate, 'yyyy-MM-dd'),
          platform,
          content_type: contentType,
          post_category: postCategory,
          user_input_focus: userFocus || null,
          ai_generated_post_ideas: aiPostIdeas,
          ai_generated_captions: aiCaptions,
          ai_generated_image_prompts: aiImagePrompts,
          ai_reasoning: aiReasoning,
          is_saved: false
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedEvent(data);
      setShowEventDialog(true);
      fetchCalendarEvents();
      
      toast({
        title: "AI Ideas Generated!",
        description: "Your personalized content ideas are ready to review.",
      });

    } catch (error) {
      console.error('Error generating post ideas:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate post ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveEvent = async (event: CalendarEvent) => {
    try {
      const { error } = await supabase
        .from('content_calendar_events')
        .update({ is_saved: true })
        .eq('id', event.id);

      if (error) throw error;

      fetchCalendarEvents();
      toast({
        title: "Event Saved!",
        description: "Content idea saved to your calendar.",
      });
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarEvents.filter(event => event.event_date === dateStr);
  };

  const getImportantDatesForDate = (date: Date) => {
    const dateStr = format(date, 'MMMM d');
    const monthStr = format(date, 'MMMM');
    
    return importantDates.filter(importantDate => 
      importantDate.date_month.includes(dateStr) || 
      (importantDate.date_month.includes(monthStr) && importantDate.date_month.includes('(varies)'))
    );
  };

  const renderCalendarCell = (date: Date) => {
    const events = getEventsForDate(date);
    const importantDatesForDay = getImportantDatesForDate(date);
    const savedEvents = events.filter(e => e.is_saved);

    return (
      <div className="relative w-full h-full">
        {importantDatesForDay.length > 0 && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full"></div>
        )}
        {savedEvents.length > 0 && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full"></div>
        )}
        {events.length > savedEvents.length && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-400 rounded-full"></div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-3">
        <CalendarDays className="w-8 h-8 text-[#8B5CF6]" />
        <h1 className="text-3xl font-bold text-[#333333]">AI Content Calendar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#333333]">Calendar View</h2>
                <div className="flex space-x-2 text-sm">
                  <Badge variant="outline" className="text-orange-600">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mr-1"></div>
                    Important Dates
                  </Badge>
                  <Badge variant="outline" className="text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Saved Ideas
                  </Badge>
                  <Badge variant="outline" className="text-blue-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                    Draft Ideas
                  </Badge>
                </div>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                components={{
                  DayContent: ({ date }) => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{date.getDate()}</span>
                      {renderCalendarCell(date)}
                    </div>
                  )
                }}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          {/* Content Generator */}
          <Card className="p-6 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white rounded-2xl shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-semibold">AI Content Generator</h3>
              </div>
              
              <div className="space-y-3">
                <Select value={platform} onValueChange={(value: Database['public']['Enums']['platform_type']) => setPlatform(value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={contentType} onValueChange={(value: Database['public']['Enums']['calendar_content_type']) => setContentType(value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
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

                <Select value={postCategory} onValueChange={(value: Database['public']['Enums']['post_category']) => setPostCategory(value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="launch">Product Launch</SelectItem>
                    <SelectItem value="branding">Branding</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="meme">Meme</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Optional: Brand focus or theme"
                  value={userFocus}
                  onChange={(e) => setUserFocus(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/60"
                />

                <Button
                  onClick={generatePostIdeas}
                  disabled={isGenerating || !selectedDate}
                  className="w-full bg-white text-[#8B5CF6] hover:bg-white/90"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Ideas
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Selected Date Info */}
          {selectedDate && (
            <Card className="p-4 bg-white rounded-2xl shadow-lg">
              <h3 className="font-semibold text-[#333333] mb-3">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              
              {getImportantDatesForDate(selectedDate).map((date) => (
                <div key={date.id} className="mb-2 p-2 bg-orange-50 rounded-lg">
                  <div className="font-medium text-orange-800">{date.name}</div>
                  <div className="text-sm text-orange-600">
                    {date.occasion_type}
                    {date.region_notes && ` • ${date.region_notes}`}
                  </div>
                </div>
              ))}

              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="mb-2 p-2 bg-blue-50 rounded-lg cursor-pointer"
                     onClick={() => { setSelectedEvent(event); setShowEventDialog(true); }}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-blue-800 capitalize">
                      {event.platform} {event.content_type}
                    </div>
                    {event.is_saved && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                  </div>
                  <div className="text-sm text-blue-600 capitalize">{event.post_category}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              <span>AI Generated Content Ideas</span>
            </DialogTitle>
            <DialogDescription>
              Generated for {selectedEvent?.event_date && format(new Date(selectedEvent.event_date), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Badge variant="outline" className="capitalize">{selectedEvent.platform}</Badge>
                <Badge variant="outline" className="capitalize">{selectedEvent.content_type}</Badge>
                <Badge variant="outline" className="capitalize">{selectedEvent.post_category}</Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">💡 Post Ideas</h4>
                <div className="p-3 bg-blue-50 rounded-lg whitespace-pre-line">
                  {selectedEvent.ai_generated_post_ideas}
                </div>
              </div>

              {selectedEvent.ai_generated_captions && (
                <div>
                  <h4 className="font-semibold mb-2">📝 Ready-to-use Captions</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Primary Caption:</div>
                      <div className="text-green-700">{selectedEvent.ai_generated_captions.primary}</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-yellow-800">Alternative:</div>
                      <div className="text-yellow-700">{selectedEvent.ai_generated_captions.alternative}</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800">Hashtags:</div>
                      <div className="text-purple-700">{selectedEvent.ai_generated_captions.hashtags}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.ai_generated_image_prompts && (
                <div>
                  <h4 className="font-semibold mb-2">🎨 Image Prompts</h4>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    {selectedEvent.ai_generated_image_prompts}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">🤖 AI Reasoning</h4>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {selectedEvent.ai_reasoning}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                {!selectedEvent.is_saved && (
                  <Button onClick={() => saveEvent(selectedEvent)} className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
                    <Save className="w-4 h-4 mr-2" />
                    Save to Calendar
                  </Button>
                )}
                {selectedEvent.is_saved && (
                  <Badge variant="outline" className="text-green-600">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Saved
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
