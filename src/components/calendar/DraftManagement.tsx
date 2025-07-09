import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Edit3,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Draft {
  id: string;
  content: any;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  createdAt: string;
  eventDate: string;
  platform: string;
  contentType: string;
  managerFeedback?: string;
}

export const DraftManagement = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDrafts();
  }, [user]);

  const fetchDrafts = async () => {
    if (!user) return;
    
    try {
      // Mock data for now - replace with actual Supabase query
      const mockDrafts: Draft[] = [
        {
          id: "1",
          content: {
            mainTheme: "Career Growth & Opportunities",
            caption: "🚀 Ready to take your career to the next level? Discover thousands of opportunities waiting for you on Naukri.com. Your dream job is just a click away! #CareerGrowth #DreamJob #Naukri",
            imagePrompt: "Professional office setting with diverse employees collaborating...",
            platform: "instagram",
            contentType: "post"
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
          eventDate: '2024-01-15',
          platform: 'instagram',
          contentType: 'post'
        },
        {
          id: "2", 
          content: {
            mainTheme: "Skill Development & Learning",
            caption: "💡 Invest in yourself! Upskill with Naukri.com's learning resources...",
            imagePrompt: "Modern learning environment with books, digital devices...",
            platform: "linkedin",
            contentType: "carousel"
          },
          status: 'approved',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          eventDate: '2024-01-14',
          platform: 'linkedin',
          contentType: 'carousel'
        }
      ];
      
      setDrafts(mockDrafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch drafts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveDraft = async (draftId: string) => {
    try {
      // Update draft status to approved
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { ...d, status: 'approved' as const } : d
      ));
      
      toast({
        title: "Draft Approved",
        description: "The content has been approved for publication",
      });
    } catch (error) {
      console.error('Error approving draft:', error);
      toast({
        title: "Error",
        description: "Failed to approve draft",
        variant: "destructive"
      });
    }
  };

  const rejectDraft = async (draftId: string, feedback: string) => {
    try {
      // Update draft status to rejected with feedback
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { 
          ...d, 
          status: 'rejected' as const, 
          managerFeedback: feedback 
        } : d
      ));
      
      toast({
        title: "Draft Rejected",
        description: "Feedback has been sent to the creator",
      });
      
      setShowApprovalDialog(false);
      setFeedback("");
    } catch (error) {
      console.error('Error rejecting draft:', error);
      toast({
        title: "Error",
        description: "Failed to reject draft",
        variant: "destructive"
      });
    }
  };

  const requestRevision = async (draftId: string, feedback: string) => {
    try {
      // Update draft status to revision requested with feedback
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { 
          ...d, 
          status: 'revision_requested' as const, 
          managerFeedback: feedback 
        } : d
      ));
      
      toast({
        title: "Revision Requested",
        description: "Feedback has been sent for revisions",
      });
      
      setShowApprovalDialog(false);
      setFeedback("");
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: "Error", 
        description: "Failed to request revision",
        variant: "destructive"
      });
    }
  };

  const downloadContent = async (draft: Draft) => {
    try {
      // Create downloadable content
      const content = {
        platform: draft.platform,
        contentType: draft.contentType,
        caption: draft.content.caption,
        imagePrompt: draft.content.imagePrompt,
        mainTheme: draft.content.mainTheme,
        eventDate: draft.eventDate,
        carouselSlides: draft.content.carouselSlides
      };

      const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-${draft.platform}-${draft.eventDate}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Content Downloaded",
        description: "Content file has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading content:', error);
      toast({
        title: "Error",
        description: "Failed to download content",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: Draft['status']) => {
    const statusConfig = {
      pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Approved", color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
      revision_requested: { label: "Needs Revision", color: "bg-blue-100 text-blue-800" }
    };
    
    const config = statusConfig[status];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: Draft['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'revision_requested': return <Edit3 className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading drafts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Draft Management</h2>
        <Badge variant="outline">
          {drafts.filter(d => d.status === 'pending').length} Pending Review
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map((draft) => (
          <Card key={draft.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(draft.status)}
                <span className="font-medium text-sm">
                  {draft.platform} • {draft.contentType}
                </span>
              </div>
              {getStatusBadge(draft.status)}
            </div>

            <div>
              <h3 className="font-medium">{draft.content.mainTheme}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Event Date: {new Date(draft.eventDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Created: {new Date(draft.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="text-sm">
              <p className="line-clamp-2">{draft.content.caption}</p>
            </div>

            {draft.managerFeedback && (
              <div className="bg-muted/50 p-2 rounded text-xs">
                <strong>Feedback:</strong> {draft.managerFeedback}
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDraft(draft);
                  setShowDraftDialog(true);
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>

              {draft.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDraft(draft);
                    setShowApprovalDialog(true);
                  }}
                >
                  Review
                </Button>
              )}

              {draft.status === 'approved' && (
                <Button
                  size="sm"
                  onClick={() => downloadContent(draft)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Draft Details Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge variant="outline">{selectedDraft.platform}</Badge>
                <Badge variant="outline">{selectedDraft.contentType}</Badge>
                {getStatusBadge(selectedDraft.status)}
              </div>
              
              <div>
                <h4 className="font-semibold">Main Theme</h4>
                <p>{selectedDraft.content.mainTheme}</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Caption</h4>
                <p className="text-sm">{selectedDraft.content.caption}</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Image Prompt</h4>
                <p className="text-sm">{selectedDraft.content.imagePrompt}</p>
              </div>

              {selectedDraft.content.carouselSlides && (
                <div>
                  <h4 className="font-semibold">Carousel Slides</h4>
                  <div className="space-y-2">
                    {selectedDraft.content.carouselSlides.map((slide: any) => (
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
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Review the content and provide feedback if needed.</p>
            
            <Textarea
              placeholder="Optional feedback for rejection or revision..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            
            <div className="flex space-x-2">
              <Button
                onClick={() => selectedDraft && approveDraft(selectedDraft.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              
              <Button
                variant="outline"
                onClick={() => selectedDraft && requestRevision(selectedDraft.id, feedback)}
                disabled={!feedback.trim()}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Request Revision
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => selectedDraft && rejectDraft(selectedDraft.id, feedback)}
                disabled={!feedback.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};