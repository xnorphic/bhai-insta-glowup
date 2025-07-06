
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Eye, Download, Trash2, AlertCircle } from "lucide-react";
import { BrandbookAnalysisModal } from "./BrandbookAnalysisModal";
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

interface BrandbookCardProps {
  brandBook: BrandBook;
  onDownload: (brandBook: BrandBook) => void;
  onDelete: (brandBook: BrandBook) => void;
  onViewAnalysis: (brandBook: BrandBook) => void;
}

export const BrandbookCard: React.FC<BrandbookCardProps> = ({
  brandBook,
  onDownload,
  onDelete,
  onViewAnalysis
}) => {
  const getMissingInformationArray = (missingInfo: Json | undefined): string[] => {
    if (!missingInfo) return [];
    if (Array.isArray(missingInfo)) {
      return missingInfo.filter(item => typeof item === 'string') as string[];
    }
    return [];
  };

  const missingInfoArray = getMissingInformationArray(brandBook.missing_information);

  return (
    <Card className="p-6">
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
                onClick={() => onViewAnalysis(brandBook)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Brand Book Analysis - {brandBook.original_filename}</DialogTitle>
              </DialogHeader>
              <BrandbookAnalysisModal brandBook={brandBook} />
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDownload(brandBook)}
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(brandBook)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
