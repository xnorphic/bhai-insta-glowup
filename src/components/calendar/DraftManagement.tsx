import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye, Trash2, CheckCircle, XCircle, Calendar, User, Clock } from "lucide-react";
import { useDrafts } from "@/hooks/useDrafts";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const DraftManagement = () => {
  const { drafts, loading, deleteDraft, updateDraftStatus } = useDrafts();
  const { toast } = useToast();
  const [selectedDraft, setSelectedDraft] = useState<any>(null);

  const handleDelete = async (draftId: string) => {
    const success = await deleteDraft(draftId);
    if (success) {
      toast({
        title: "Draft Deleted",
        description: "The draft has been successfully deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (draftId: string, status: 'approved' | 'rejected') => {
    const success = await updateDraftStatus(draftId, status);
    if (success) {
      toast({
        title: `Draft ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `The draft has been ${status}.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update draft status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Draft Management</h2>
        <Badge variant="outline" className="text-slate-600">
          {drafts.length} Draft{drafts.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {drafts.length === 0 ? (
        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm rounded-2xl">
          <div className="text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No drafts yet</p>
            <p className="text-sm">Generated content will appear here for review</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={draft.status === 'approved' ? 'default' : draft.status === 'rejected' ? 'destructive' : 'secondary'}
                  >
                    {draft.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {draft.form_data?.platform} • {draft.form_data?.contentType}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2">
                    {draft.content_data?.mainTheme || 'Untitled Draft'}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                    {draft.content_data?.caption || 'No caption available'}
                  </p>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {draft.created_by_username}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(draft.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedDraft(draft)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          {selectedDraft?.content_data?.mainTheme || 'Draft Content'}
                        </DialogTitle>
                      </DialogHeader>
                      
                      {selectedDraft && (
                        <ScrollArea className="h-[70vh] pr-4">
                          <div className="space-y-6">
                            {/* Draft Metadata */}
                            <Card className="p-4 bg-slate-50">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Created by:</span>
                                  <p className="text-slate-600">{selectedDraft.created_by_username}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Created at:</span>
                                  <p className="text-slate-600">
                                    {format(new Date(selectedDraft.created_at), 'MMMM d, yyyy at HH:mm')}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">Platform:</span>
                                  <p className="text-slate-600 capitalize">{selectedDraft.form_data?.platform}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Content Type:</span>
                                  <p className="text-slate-600 capitalize">{selectedDraft.form_data?.contentType}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Theme:</span>
                                  <p className="text-slate-600">{selectedDraft.form_data?.theme}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Tone:</span>
                                  <p className="text-slate-600 capitalize">{selectedDraft.form_data?.tone}</p>
                                </div>
                              </div>
                            </Card>

                            {/* Content Details */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Caption:</h4>
                                <p className="text-slate-700 whitespace-pre-wrap">
                                  {selectedDraft.content_data?.caption}
                                </p>
                              </div>

                              <Separator />

                              <div>
                                <h4 className="font-semibold mb-2">Image Prompt:</h4>
                                <p className="text-slate-700 whitespace-pre-wrap">
                                  {selectedDraft.content_data?.imagePrompt}
                                </p>
                              </div>

                              {selectedDraft.content_data?.reasoning && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="font-semibold mb-2">Reasoning:</h4>
                                    <p className="text-slate-700">{selectedDraft.content_data.reasoning}</p>
                                  </div>
                                </>
                              )}

                              {selectedDraft.content_data?.targetGroup && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="font-semibold mb-2">Target Group:</h4>
                                    <p className="text-slate-700">{selectedDraft.content_data.targetGroup}</p>
                                  </div>
                                </>
                              )}

                              {selectedDraft.content_data?.intendedFeeling && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="font-semibold mb-2">Intended Feeling:</h4>
                                    <p className="text-slate-700">{selectedDraft.content_data.intendedFeeling}</p>
                                  </div>
                                </>
                              )}

                              {selectedDraft.content_data?.carouselSlides && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="font-semibold mb-2">Carousel Slides:</h4>
                                    <div className="space-y-3">
                                      {selectedDraft.content_data.carouselSlides.map((slide: any) => (
                                        <Card key={slide.slideNumber} className="p-3 bg-slate-50">
                                          <h5 className="font-medium">Slide {slide.slideNumber}</h5>
                                          <p className="text-sm text-slate-600 mt-1">
                                            <span className="font-medium">Image:</span> {slide.imageGuideline}
                                          </p>
                                          <p className="text-sm text-slate-600">
                                            <span className="font-medium">Text:</span> {slide.textGuideline}
                                          </p>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </ScrollArea>
                      )}
                    </DialogContent>
                  </Dialog>

                  {draft.status === 'draft' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(draft.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleStatusUpdate(draft.id, 'rejected')}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </>
                  )}

                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(draft.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};