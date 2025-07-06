import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Download, Eye, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface BrandBook {
  id: string;
  original_filename: string;
  file_url: string;
  upload_timestamp: string;
  version: number;
  extracted_text?: string;
  what_we_do?: string;
  strategy_pillars?: string;
  brand_colors_fonts?: string;
  addressed_market?: string;
  aspiration_market?: string;
  content_ips?: string;
  tonality?: string;
  what_not_to_do?: string;
  customer_personas?: string;
  customer_strengths?: string;
  customer_weaknesses?: string;
  missing_information?: Json;
  is_analysis_complete?: boolean;
  ai_generated_playbook?: string;
}

export const BrandbookBuilder = () => {
  const { user } = useAuth();
  const [brandBooks, setBrandBooks] = useState<BrandBook[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedBrandBook, setSelectedBrandBook] = useState<BrandBook | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBrandBooks();
    }
  }, [user]);

  const fetchBrandBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_books')
        .select('*')
        .order('upload_timestamp', { ascending: false });

      if (error) throw error;
      setBrandBooks(data || []);
    } catch (error) {
      console.error('Error fetching brand books:', error);
      toast.error('Failed to load brand books');
    }
  };

  // Helper function to safely convert Json to string array
  const getMissingInformationArray = (missingInfo: Json | undefined): string[] => {
    if (!missingInfo) return [];
    if (Array.isArray(missingInfo)) {
      return missingInfo.filter(item => typeof item === 'string') as string[];
    }
    return [];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique filename with user ID folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand-books')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get the next version number for this user
      const { data: existingBooks } = await supabase
        .from('brand_books')
        .select('version')
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = (existingBooks?.[0]?.version || 0) + 1;

      // Create database record
      const { data: bookData, error: dbError } = await supabase
        .from('brand_books')
        .insert({
          user_id: user.id,
          original_filename: file.name,
          file_url: uploadData.path,
          uploaded_by_username: user.email || 'Unknown',
          version: nextVersion,
          posts_scanned_for_playbook: 0
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast.success('Brand book uploaded successfully!');
      
      // Refresh the list
      fetchBrandBooks();
      
      // Start AI analysis
      startAIAnalysis(bookData.id);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload brand book');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const startAIAnalysis = async (brandBookId: string) => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update with mock AI analysis results
      const { error } = await supabase
        .from('brand_books')
        .update({
          extracted_text: 'Sample extracted text from the PDF...',
          what_we_do: 'We are a innovative tech company focused on creating user-friendly solutions.',
          strategy_pillars: 'Innovation, User Experience, Quality, Sustainability',
          brand_colors_fonts: 'Primary: #FF6B35, Secondary: #004E89, Font: Montserrat',
          addressed_market: 'Tech-savvy millennials and Gen-Z consumers',
          aspiration_market: 'Global market leaders in digital solutions',
          content_ips: 'Educational content, Product demos, Behind-the-scenes',
          tonality: 'Friendly, Professional, Innovative, Approachable',
          what_not_to_do: 'Avoid overly technical jargon, dont use outdated references',
          customer_personas: 'Tech Enthusiast (25-35), Busy Professional (30-45), Creative Freelancer (20-40)',
          customer_strengths: 'Tech-savvy, Early adopters, Value quality',
          customer_weaknesses: 'Price sensitive, Short attention span',
          missing_information: ['Target demographics details', 'Competitor analysis', 'Budget constraints'],
          is_analysis_complete: true,
          ai_generated_playbook: 'Based on your brand book analysis, here are key recommendations for your content strategy...'
        })
        .eq('id', brandBookId);

      if (error) throw error;
      
      toast.success('AI analysis completed!');
      fetchBrandBooks();
    } catch (error) {
      console.error('Error in AI analysis:', error);
      toast.error('AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadBrandBook = async (brandBook: BrandBook) => {
    try {
      const { data, error } = await supabase.storage
        .from('brand-books')
        .download(brandBook.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = brandBook.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download brand book');
    }
  };

  const deleteBrandBook = async (brandBook: BrandBook) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brand-books')
        .remove([brandBook.file_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('brand_books')
        .delete()
        .eq('id', brandBook.id);

      if (dbError) throw dbError;

      toast.success('Brand book deleted successfully');
      fetchBrandBooks();
    } catch (error) {
      console.error('Error deleting brand book:', error);
      toast.error('Failed to delete brand book');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#333333]">Brand Book Builder</h1>
        <Button onClick={fetchBrandBooks} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Upload Section */}
      <Card className="p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-4">
          <Upload className="w-12 h-12 text-purple-600 mx-auto" />
          <h2 className="text-2xl font-semibold text-[#333333]">Upload Brand Book</h2>
          <p className="text-[#666666] max-w-2xl mx-auto">
            Upload your PDF brand book to extract key information and generate AI-powered insights for your content strategy.
          </p>
          
          <div className="max-w-md mx-auto">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            
            {isUploading && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-[#666666]">Uploading... {uploadProgress}%</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-purple-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI is analyzing your brand book...</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Brand Books List */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-semibold text-[#333333]">Your Brand Books</h2>
        
        {brandBooks.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No brand books uploaded yet. Upload your first brand book to get started!</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {brandBooks.map((brandBook) => {
              const missingInfoArray = getMissingInformationArray(brandBook.missing_information);
              
              return (
                <Card key={brandBook.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-[#333333]">{brandBook.original_filename}</h3>
                        <p className="text-sm text-[#666666]">
                          Version {brandBook.version} • Uploaded {new Date(brandBook.upload_timestamp).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {brandBook.is_analysis_complete ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Analysis Complete
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Processing
                            </Badge>
                          )}
                          
                          {missingInfoArray.length > 0 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Missing Info
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedBrandBook(brandBook)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Analysis
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Brand Book Analysis - {brandBook.original_filename}</DialogTitle>
                          </DialogHeader>
                          
                          {selectedBrandBook && (
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                                <TabsTrigger value="audience">Audience</TabsTrigger>
                                <TabsTrigger value="playbook">Playbook</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">What We Do</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.what_we_do || 'Not analyzed yet'}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Brand Colors & Fonts</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.brand_colors_fonts || 'Not analyzed yet'}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Tonality</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.tonality || 'Not analyzed yet'}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="strategy" className="space-y-4">
                                <div className="grid gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Strategy Pillars</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.strategy_pillars || 'Not analyzed yet'}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Content IPs</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.content_ips || 'Not analyzed yet'}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">What Not To Do</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.what_not_to_do || 'Not analyzed yet'}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="audience" className="space-y-4">
                                <div className="grid gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Customer Personas</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.customer_personas || 'Not analyzed yet'}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Addressed Market</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.addressed_market || 'Not analyzed yet'}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Aspiration Market</h3>
                                    <p className="text-sm text-gray-600">{selectedBrandBook.aspiration_market || 'Not analyzed yet'}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="playbook" className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-2">AI Generated Playbook</h3>
                                  <Textarea 
                                    value={selectedBrandBook.ai_generated_playbook || 'Playbook not generated yet'} 
                                    readOnly 
                                    className="min-h-[200px]"
                                  />
                                </div>
                                
                                {getMissingInformationArray(selectedBrandBook.missing_information).length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-2 text-orange-600">Missing Information</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                      {getMissingInformationArray(selectedBrandBook.missing_information).map((item, index) => (
                                        <li key={index} className="text-sm text-gray-600">{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadBrandBook(brandBook)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteBrandBook(brandBook)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
