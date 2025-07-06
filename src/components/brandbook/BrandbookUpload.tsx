
import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, RefreshCw } from "lucide-react";

interface BrandbookUploadProps {
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BrandbookUpload: React.FC<BrandbookUploadProps> = ({
  isUploading,
  uploadProgress,
  isAnalyzing,
  onFileUpload
}) => {
  return (
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
            onChange={onFileUpload}
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
  );
};
