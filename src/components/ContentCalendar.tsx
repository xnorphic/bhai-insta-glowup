import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, Star, Plus, Sparkles, Upload, Download } from "lucide-react";
import { format, isToday, isAfter, startOfDay } from "date-fns";
import { Database } from "@/integrations/supabase/types";
import { useCalendar } from "@/hooks/useCalendar";
import { useDrafts } from "@/hooks/useDrafts";
import { ContentGenerationDialog } from "@/components/calendar/ContentGenerationDialog";
import { DraftManagement } from "@/components/calendar/DraftManagement";
import { supabase } from "@/integrations/supabase/client";

export const ContentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [selectedTabEvent, setSelectedTabEvent] = useState<any>(null);
  const [importingCsv, setImportingCsv] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { events, importantDates, loading, refreshEvents } = useCalendar();
  const { drafts } = useDrafts();

  // CSV Import functionality
  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').slice(1); // Skip header row
      const importedDates = [];

      for (const line of lines) {
        const [date_month, name, occasion_type, region_notes] = line.split(',').map(s => s.trim().replace(/"/g, ''));
        if (date_month && name && occasion_type) {
          importedDates.push({
            date_month,
            name,
            occasion_type,
            region_notes: region_notes || null,
            is_fixed_date: !date_month.includes('varies')
          });
        }
      }

      if (importedDates.length > 0) {
        const { error } = await supabase
          .from('important_dates')
          .insert(importedDates);

        if (error) throw error;

        await refreshEvents();
        toast({
          title: "CSV Imported Successfully",
          description: `Imported ${importedDates.length} important dates.`,
        });
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import CSV. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setImportingCsv(false);
      event.target.value = ''; // Reset input
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "date_month,name,occasion_type,region_notes\n" +
      "January 1,New Year's Day,Holiday,Global\n" +
      "February 14,Valentine's Day,Holiday,Western cultures\n" +
      "March (varies),Mother's Day,Holiday,Varies by country\n" +
      "December 25,Christmas Day,Holiday,Christian countries";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'important_dates_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get upcoming important dates (today and later)
  const getUpcomingImportantDates = () => {
    const today = startOfDay(new Date());
    
    return importantDates.filter(importantDate => {
      // Handle fixed dates
      if (importantDate.is_fixed_date && !importantDate.date_month.includes('varies')) {
        try {
          const dateStr = importantDate.date_month;
          const currentYear = new Date().getFullYear();
          const parsedDate = new Date(`${dateStr}, ${currentYear}`);
          
          if (isNaN(parsedDate.getTime())) return false;
          
          return isToday(parsedDate) || isAfter(parsedDate, today);
        } catch {
          return false;
        }
      }
      
      // For varying dates, show them all as they could be relevant
      return true;
    }).slice(0, 5); // Limit to next 5 events
  };

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
        {/* Pending drafts count - show number in orange circle */}
        {pendingDrafts.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {pendingDrafts.length}
          </div>
        )}
        
        {/* Important Dates Indicator */}
        {importantDatesForDay.length > 0 && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full"></div>
        )}
      </div>
    );
  };

  const getDayClassName = (date: Date) => {
    const draftsForDay = getDraftsForDate(date);
    const approvedDrafts = draftsForDay.filter(d => d.status === 'approved');
    
    let baseClasses = "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 p-0 font-normal aria-selected:opacity-100 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer border border-border";
    
    // Green background for dates with approved drafts
    if (approvedDrafts.length > 0) {
      baseClasses += " bg-green-100 hover:bg-green-200 border-green-300";
    } else {
      baseClasses += " bg-card/50";
    }
    
    return baseClasses;
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
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI Content Calendar</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Generate and manage your content with AI assistance</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowGenerationDialog(true)}
            className="bg-gradient-primary hover:opacity-90 shrink-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Quick </span>Generate
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-fit grid-cols-2 bg-card/60 backdrop-blur-sm border-border">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-card">
              <span className="hidden sm:inline">Calendar </span>View
            </TabsTrigger>
            <TabsTrigger value="drafts" className="data-[state=active]:bg-card">
              <span className="hidden sm:inline">Draft </span>Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Calendar */}
              <div className="lg:col-span-2">
                <Card className="p-6 lg:p-8 bg-card/80 backdrop-blur-sm shadow-elevated border-border">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground">Content Calendar</h2>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                        <Badge variant="outline" className="text-warning border-warning/20 bg-warning/10">
                          <div className="w-2 h-2 bg-warning rounded-full mr-2"></div>
                          <span className="hidden sm:inline">Important </span>Dates ({importantDates.length})
                        </Badge>
                        <Badge variant="outline" className="text-success border-success/20 bg-success/10">
                          <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                          <span className="hidden sm:inline">Approved </span>Content ({drafts.filter(d => d.status === 'approved').length})
                        </Badge>
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">
                          <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                          <span className="hidden sm:inline">Draft </span>Ideas ({drafts.filter(d => d.status === 'draft').length})
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="calendar-container">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="w-full mx-auto"
                        classNames={{
                          table: "w-full border-collapse border-spacing-2",
                          head_row: "flex justify-between mb-4 gap-2",
                          head_cell: "text-muted-foreground rounded-md flex-1 font-semibold text-sm uppercase tracking-wide text-center min-w-[60px]",
                          row: "flex w-full justify-between gap-2 mb-2",
                          cell: "flex-1 text-center focus-within:relative focus-within:z-20 min-w-[60px]",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                        components={{
                          DayContent: ({ date }) => {
                            const draftsForDay = getDraftsForDate(date);
                            const importantDatesForDay = getImportantDatesForDate(date);
                            const approvedDrafts = draftsForDay.filter(d => d.status === 'approved');
                            const pendingDrafts = draftsForDay.filter(d => d.status === 'draft');
                            
                            let bgColor = "bg-card/50 hover:bg-card/70";
                            if (approvedDrafts.length > 0) {
                              bgColor = "bg-green-100 hover:bg-green-200 border-green-300";
                            }
                            
                            return (
                              <div 
                                className={`relative w-full aspect-square max-w-[80px] mx-auto ${bgColor} rounded-lg border border-border flex items-center justify-center cursor-pointer transition-all hover:scale-105`}
                                onClick={() => handleDateClick(date)}
                              >
                                <span className="text-base font-medium">{date.getDate()}</span>
                                
                                {/* Pending drafts indicator */}
                                {pendingDrafts.length > 0 && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                    {pendingDrafts.length}
                                  </div>
                                )}
                                
                                {/* Important dates indicator */}
                                {importantDatesForDay.length > 0 && (
                                  <div className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                                )}
                              </div>
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Generator Card */}
                <Card className="p-4 sm:p-6 bg-gradient-primary text-primary-foreground shadow-elevated border-border">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                      <h3 className="text-lg sm:text-xl font-semibold">AI Generator</h3>
                    </div>
                    
                    <p className="text-primary-foreground/90 text-sm">
                      Click any date on the calendar to generate AI-powered content ideas with multiple options and detailed guidelines.
                    </p>

                    <Button
                      onClick={() => setShowGenerationDialog(true)}
                      className="w-full bg-card text-card-foreground hover:bg-card/90 font-medium"
                      size="sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content Now
                    </Button>
                  </div>
                </Card>

                {/* CSV Import & Important Dates */}
                <Card className="p-4 sm:p-6 bg-card/80 backdrop-blur-sm shadow-card border-border">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      <h3 className="text-lg sm:text-xl font-semibold text-card-foreground">Important Dates</h3>
                    </div>
                    
                    {/* CSV Import Section */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          onClick={downloadCsvTemplate}
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </Button>
                        <Label htmlFor="csv-upload" className="w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center"
                            disabled={importingCsv}
                            asChild
                          >
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              {importingCsv ? 'Importing...' : 'Import CSV'}
                            </span>
                          </Button>
                          <Input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleCsvImport}
                            className="hidden"
                          />
                        </Label>
                      </div>
                    </div>

                    {/* Upcoming Important Dates */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Upcoming Events</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {getUpcomingImportantDates().map((date) => (
                          <div key={date.id} className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                            <div className="text-sm font-medium text-orange-800 leading-tight break-words">{date.name}</div>
                            <div className="text-xs text-orange-600 mt-1 leading-relaxed break-words">
                              <span className="block">{date.date_month}</span>
                              <span className="block">{date.occasion_type}</span>
                            </div>
                          </div>
                        ))}
                        {getUpcomingImportantDates().length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <p className="text-sm">No upcoming events</p>
                            <p className="text-xs mt-1">Import dates using CSV above</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Selected Date Info */}
                {selectedDate && (
                  <Card className="p-4 sm:p-6 bg-card/80 backdrop-blur-sm shadow-card border-border">
                    <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">
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