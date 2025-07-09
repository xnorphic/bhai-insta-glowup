import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, Star, Plus, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";
import { useCalendar } from "@/hooks/useCalendar";
import { useDrafts } from "@/hooks/useDrafts";
import { ContentGenerationDialog } from "@/components/calendar/ContentGenerationDialog";
import { DraftManagement } from "@/components/calendar/DraftManagement";

export const ContentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [selectedTabEvent, setSelectedTabEvent] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { events, importantDates, loading } = useCalendar();
  const { drafts } = useDrafts();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowGenerationDialog(true);
  };

  const handleSaveDraft = async (option: any, formData: any) => {
    try {
      // This would save to a drafts table
      toast({
        title: "Draft Saved",
        description: "Your content has been saved as a draft for manager review.",
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.event_date === dateStr);
  };

  const getImportantDatesForDate = (date: Date) => {
    const dateStr = format(date, 'MMMM d');
    const monthStr = format(date, 'MMMM');
    
    return importantDates.filter(importantDate => {
      // Check for exact date match
      if (importantDate.date_month === dateStr) return true;
      
      // Check for month + "varies" (like "December (varies)")
      if (importantDate.date_month.includes(monthStr) && importantDate.date_month.includes('(varies)')) {
        return true;
      }
      
      return false;
    });
  };

  const getDraftsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return drafts.filter(draft => {
      const eventDate = draft.form_data?.eventDate;
      if (!eventDate) return false;
      return format(new Date(eventDate), 'yyyy-MM-dd') === dateStr;
    });
  };

  const renderCalendarCell = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const importantDatesForDay = getImportantDatesForDate(date);
    const draftsForDay = getDraftsForDate(date);
    const approvedDrafts = draftsForDay.filter(d => d.status === 'approved');
    const pendingDrafts = draftsForDay.filter(d => d.status === 'draft');

    return (
      <div className="relative w-full h-full">
        {/* Important Dates Indicator */}
        {importantDatesForDay.length > 0 && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full"></div>
        )}
        
        {/* Approved Content Indicator */}
        {approvedDrafts.length > 0 && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full"></div>
        )}
        
        {/* Draft Ideas Indicator */}
        {pendingDrafts.length > 0 && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-400 rounded-full"></div>
        )}

        {/* Count badges for multiple items */}
        {importantDatesForDay.length > 1 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
            {importantDatesForDay.length}
          </div>
        )}
        
        {(approvedDrafts.length > 1 || pendingDrafts.length > 1) && (
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
            {approvedDrafts.length + pendingDrafts.length}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">AI Content Calendar</h1>
              <p className="text-slate-600">Generate and manage your content with AI assistance</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowGenerationDialog(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Generate
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-fit grid-cols-2 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-white">
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="drafts" className="data-[state=active]:bg-white">
              Draft Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Main Calendar */}
              <div className="xl:col-span-3">
                <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-slate-800">Content Calendar</h2>
                      <div className="flex space-x-3 text-sm">
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                          Important Dates ({importantDates.length})
                        </Badge>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Approved Content ({drafts.filter(d => d.status === 'approved').length})
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                          Draft Ideas ({drafts.filter(d => d.status === 'draft').length})
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="calendar-container">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="w-full p-6 text-lg [&_.rdp-day]:h-16 [&_.rdp-day]:w-16 [&_.rdp-cell]:p-1"
                        classNames={{
                          table: "w-full border-collapse space-y-2",
                          head_row: "flex justify-between mb-4",
                          head_cell: "text-slate-600 rounded-md w-16 font-semibold text-sm uppercase tracking-wide",
                          row: "flex w-full mt-3 justify-between",
                          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                          day: "h-16 w-16 p-0 font-normal aria-selected:opacity-100 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer border border-slate-100 bg-white/50",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                        components={{
                          DayContent: ({ date }) => (
                            <div 
                              className="relative w-full h-full flex items-center justify-center hover:bg-primary/5 rounded-xl transition-colors"
                              onClick={() => handleDateClick(date)}
                            >
                              <span className="text-lg font-medium">{date.getDate()}</span>
                              {renderCalendarCell(date)}
                            </div>
                          )
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Generator Card */}
                <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl shadow-xl border-0">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-6 h-6" />
                      <h3 className="text-xl font-semibold">AI Generator</h3>
                    </div>
                    
                    <p className="text-white/90 text-sm">
                      Click any date on the calendar to generate AI-powered content ideas with multiple options and detailed guidelines.
                    </p>

                    <Button
                      onClick={() => setShowGenerationDialog(true)}
                      className="w-full bg-white text-primary hover:bg-white/90 font-medium"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content Now
                    </Button>
                  </div>
                </Card>

                {/* Selected Date Info */}
                {selectedDate && (
                  <Card className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    
                     <div className="space-y-3">
                       {getImportantDatesForDate(selectedDate).map((date) => (
                         <div key={date.id} className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                           <div className="font-medium text-orange-800">{date.name}</div>
                           <div className="text-sm text-orange-600">
                             {date.occasion_type}
                             {date.region_notes && ` • ${date.region_notes}`}
                           </div>
                         </div>
                       ))}

                       {getDraftsForDate(selectedDate).map((draft) => (
                         <div 
                           key={draft.id} 
                           className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                             draft.status === 'approved' 
                               ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-150' 
                               : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-150'
                           }`}
                         >
                           <div className="flex items-center justify-between">
                             <div className={`font-medium capitalize ${
                               draft.status === 'approved' ? 'text-green-800' : 'text-blue-800'
                             }`}>
                               {draft.form_data?.platform} • {draft.form_data?.contentType}
                             </div>
                             <Badge 
                               variant={draft.status === 'approved' ? 'default' : 'secondary'}
                               className="text-xs"
                             >
                               {draft.status}
                             </Badge>
                           </div>
                           <div className={`text-sm ${draft.status === 'approved' ? 'text-green-600' : 'text-blue-600'}`}>
                             {draft.content_data?.mainTheme}
                           </div>
                         </div>
                       ))}

                       {getEventsForDate(selectedDate).map((event) => (
                         <div 
                           key={event.id} 
                           className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 cursor-pointer hover:from-slate-100 hover:to-slate-150 transition-colors"
                           onClick={() => setSelectedTabEvent(event)}
                         >
                           <div className="flex items-center justify-between">
                             <div className="font-medium text-slate-800 capitalize">
                               {event.platform} • {event.content_type}
                             </div>
                             {event.is_saved && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                           </div>
                           <div className="text-sm text-slate-600 capitalize">{event.post_category}</div>
                         </div>
                       ))}

                       {getImportantDatesForDate(selectedDate).length === 0 && 
                        getDraftsForDate(selectedDate).length === 0 && 
                        getEventsForDate(selectedDate).length === 0 && (
                         <div className="text-center py-8 text-slate-500">
                           <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                           <p className="text-sm">No events for this date</p>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="mt-3"
                             onClick={() => setShowGenerationDialog(true)}
                           >
                             Create Content
                           </Button>
                         </div>
                       )}
                     </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            <DraftManagement />
          </TabsContent>
        </Tabs>

        {/* Content Generation Dialog */}
        <ContentGenerationDialog
          open={showGenerationDialog}
          onOpenChange={setShowGenerationDialog}
          selectedDate={selectedDate}
          onSaveDraft={handleSaveDraft}
        />
      </div>
    </div>
  );
};