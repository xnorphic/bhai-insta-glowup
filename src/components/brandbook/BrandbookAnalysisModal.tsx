
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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

interface BrandbookAnalysisModalProps {
  brandBook: BrandBook;
}

export const BrandbookAnalysisModal: React.FC<BrandbookAnalysisModalProps> = ({ brandBook }) => {
  const getMissingInformationArray = (missingInfo: Json | undefined): string[] => {
    if (!missingInfo) return [];
    if (Array.isArray(missingInfo)) {
      return missingInfo.filter(item => typeof item === 'string') as string[];
    }
    return [];
  };

  return (
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
            <p className="text-sm text-gray-600">{brandBook.what_we_do || 'Not analyzed yet'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Brand Colors & Fonts</h3>
            <p className="text-sm text-gray-600">{brandBook.brand_colors_fonts || 'Not analyzed yet'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tonality</h3>
            <p className="text-sm text-gray-600">{brandBook.tonality || 'Not analyzed yet'}</p>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="strategy" className="space-y-4">
        <div className="grid gap-4">
          <div>
            <h3 className="font-semibold mb-2">Strategy Pillars</h3>
            <p className="text-sm text-gray-600">{brandBook.strategy_pillars || 'Not analyzed yet'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Content IPs</h3>
            <p className="text-sm text-gray-600">{brandBook.content_ips || 'Not analyzed yet'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What Not To Do</h3>
            <p className="text-sm text-gray-600">{brandBook.what_not_to_do || 'Not analyzed yet'}</p>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="audience" className="space-y-4">
        <div className="grid gap-4">
          <div>
            <h3 className="font-semibold mb-2">Customer Personas</h3>
            <p className="text-sm text-gray-600">{brandBook.customer_personas || 'Not analyzed yet'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Addressed Market</h3>
            <p className="text-sm text-gray-600">{brandBook.addressed_market || 'Not analyzed yet'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Aspiration Market</h3>
            <p className="text-sm text-gray-600">{brandBook.aspiration_market || 'Not analyzed yet'}</p>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="playbook" className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">AI Generated Playbook</h3>
          <Textarea 
            value={brandBook.ai_generated_playbook || 'Playbook not generated yet'} 
            readOnly 
            className="min-h-[200px]"
          />
        </div>
        
        {getMissingInformationArray(brandBook.missing_information).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-orange-600">Missing Information</h3>
            <ul className="list-disc list-inside space-y-1">
              {getMissingInformationArray(brandBook.missing_information).map((item, index) => (
                <li key={index} className="text-sm text-gray-600">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
