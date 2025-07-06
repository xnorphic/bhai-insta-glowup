
import React from "react";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { BrandbookCard } from "./BrandbookCard";
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

interface BrandbookListProps {
  brandBooks: BrandBook[];
  onDownload: (brandBook: BrandBook) => void;
  onDelete: (brandBook: BrandBook) => void;
  onViewAnalysis: (brandBook: BrandBook) => void;
}

export const BrandbookList: React.FC<BrandbookListProps> = ({
  brandBooks,
  onDownload,
  onDelete,
  onViewAnalysis
}) => {
  if (brandBooks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No brand books uploaded yet. Upload your first brand book to get started!</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {brandBooks.map((brandBook) => (
        <BrandbookCard
          key={brandBook.id}
          brandBook={brandBook}
          onDownload={onDownload}
          onDelete={onDelete}
          onViewAnalysis={onViewAnalysis}
        />
      ))}
    </div>
  );
};
