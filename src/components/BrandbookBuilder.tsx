
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BrandbookUpload } from "./brandbook/BrandbookUpload";
import { BrandbookList } from "./brandbook/BrandbookList";
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
      startAIAnalysis(bookData.id, uploadData.path);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload brand book');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const startAIAnalysis = async (brandBookId: string, fileUrl: string) => {
    setIsAnalyzing(true);
    try {
      // First, extract text from the PDF
      const extractResponse = await supabase.functions.invoke('extract-pdf-text', {
        body: { brandBookId, fileUrl }
      });

      if (extractResponse.error) {
        throw extractResponse.error;
      }

      const { extractedText } = extractResponse.data;

      // Then, analyze the extracted text with AI
      const analyzeResponse = await supabase.functions.invoke('analyze-brandbook', {
        body: { brandBookId, extractedText }
      });

      if (analyzeResponse.error) {
        throw analyzeResponse.error;
      }

      toast.success('AI analysis completed!');
      fetchBrandBooks();
    } catch (error) {
      console.error('Error in AI analysis:', error);
      toast.error('AI analysis failed: ' + (error.message || 'Unknown error'));
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

  const handleViewAnalysis = (brandBook: BrandBook) => {
    setSelectedBrandBook(brandBook);
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

      <BrandbookUpload
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isAnalyzing={isAnalyzing}
        onFileUpload={handleFileUpload}
      />

      <div className="grid gap-6">
        <h2 className="text-2xl font-semibold text-[#333333]">Your Brand Books</h2>
        
        <BrandbookList
          brandBooks={brandBooks}
          onDownload={downloadBrandBook}
          onDelete={deleteBrandBook}
          onViewAnalysis={handleViewAnalysis}
        />
      </div>
    </div>
  );
};
