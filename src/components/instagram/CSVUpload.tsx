import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CSVUploadProps {
  profiles: Array<{
    profile_id: string;
    username: string;
    full_name?: string;
  }>;
}

interface FieldMapping {
  [csvHeader: string]: string;
}

interface ValidationError {
  row: number;
  field?: string;
  error: string;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({ profiles }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importStatus, setImportStatus] = useState<string>('');
  const [previewData, setPreviewData] = useState<string[][]>([]);

  // Available Instagram media fields for mapping
  const availableFields = [
    { value: 'media_id', label: 'Media ID (Required)', required: true },
    { value: 'media_url', label: 'Media URL (Required)', required: true },
    { value: 'timestamp', label: 'Timestamp (Required)', required: true },
    { value: 'media_type', label: 'Media Type' },
    { value: 'thumbnail_url', label: 'Thumbnail URL' },
    { value: 'permalink', label: 'Permalink' },
    { value: 'caption', label: 'Caption' },
    { value: 'like_count', label: 'Like Count' },
    { value: 'comment_count', label: 'Comment Count' },
    { value: 'share_count', label: 'Share Count' },
    { value: 'view_count', label: 'View Count' },
    { value: 'save_count', label: 'Save Count' },
    { value: 'engagement_rate', label: 'Engagement Rate' },
    { value: 'hashtags', label: 'Hashtags (comma-separated)' },
    { value: 'mentions', label: 'Mentions (comma-separated)' },
    { value: 'location_name', label: 'Location Name' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    parseCSVHeaders(file);
  };

  const parseCSVHeaders = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvHeaders(headers);
        
        // Generate preview data (first 5 rows)
        const preview = lines.slice(0, 6).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );
        setPreviewData(preview);

        // Auto-map common fields
        const autoMapping: FieldMapping = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('id') && lowerHeader.includes('media')) {
            autoMapping[header] = 'media_id';
          } else if (lowerHeader.includes('url') && !lowerHeader.includes('thumb')) {
            autoMapping[header] = 'media_url';
          } else if (lowerHeader.includes('timestamp') || lowerHeader.includes('date')) {
            autoMapping[header] = 'timestamp';
          } else if (lowerHeader.includes('caption')) {
            autoMapping[header] = 'caption';
          } else if (lowerHeader.includes('like')) {
            autoMapping[header] = 'like_count';
          } else if (lowerHeader.includes('comment')) {
            autoMapping[header] = 'comment_count';
          }
        });
        setFieldMapping(autoMapping);
      }
    };
    reader.readAsText(file);
  };

  const handleFieldMappingChange = (csvHeader: string, field: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvHeader]: field
    }));
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'media_id',
      'media_url',
      'timestamp',
      'media_type',
      'caption',
      'like_count',
      'comment_count',
      'hashtags',
      'mentions'
    ];
    
    const sampleData = [
      ['12345_67890', 'https://example.com/image.jpg', '2024-01-15T10:30:00Z', 'image', 'Sample caption #hashtag', '100', '10', 'hashtag,example', 'username1,username2'],
      ['12345_67891', 'https://example.com/video.mp4', '2024-01-16T14:20:00Z', 'video', 'Another post @mention', '250', '25', 'video,content', 'mention']
    ];

    const csvContent = [
      templateHeaders.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'instagram_data_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateMapping = (): boolean => {
    const requiredFields = ['media_id', 'media_url', 'timestamp'];
    const mappedFields = Object.values(fieldMapping);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingRequired.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please map the following required fields: ${missingRequired.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedProfile || !validateMapping()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setValidationErrors([]);
    setImportStatus('Uploading...');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const base64Content = btoa(content);

        setImportStatus('Processing...');
        setUploadProgress(50);

        const { data, error } = await supabase.functions.invoke('instagram-csv-import', {
          body: {
            file: base64Content,
            filename: selectedFile.name,
            profile_id: selectedProfile,
            field_mapping: fieldMapping,
            import_settings: {
              skip_header: true,
              delimiter: ',',
              update_existing: true
            }
          }
        });

        if (error) {
          throw error;
        }

        setUploadProgress(100);
        setImportStatus(data.status === 'validation_failed' ? 'Validation Failed' : 'Import Completed');
        
        if (data.validation_errors && data.validation_errors.length > 0) {
          setValidationErrors(data.validation_errors);
        }

        toast({
          title: data.status === 'validation_failed' ? "Validation issues found" : "Import successful",
          description: `Processed ${data.valid_rows} of ${data.total_rows} rows`,
          variant: data.status === 'validation_failed' ? "destructive" : "default",
        });

      };
      reader.readAsText(selectedFile);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your CSV file.",
        variant: "destructive",
      });
      setImportStatus('Failed');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setCsvHeaders([]);
    setFieldMapping({});
    setValidationErrors([]);
    setImportStatus('');
    setPreviewData([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV Data Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Need a template?</span>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>

        {/* Profile Selection */}
        {profiles.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="profile-select">Target Instagram Profile</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a profile..." />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.profile_id} value={profile.profile_id}>
                    @{profile.username} {profile.full_name && `(${profile.full_name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* CSV Preview and Field Mapping */}
        {csvHeaders.length > 0 && (
          <div className="space-y-4">
            <Separator />
            
            {/* Preview */}
            <div className="space-y-2">
              <Label>CSV Preview</Label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="font-mono text-xs">
                  {previewData.map((row, rowIndex) => (
                    <div key={rowIndex} className={`${rowIndex === 0 ? 'font-bold' : ''}`}>
                      {row.join(' | ')}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Field Mapping */}
            <div className="space-y-2">
              <Label>Field Mapping</Label>
              <div className="grid gap-3">
                {csvHeaders.map((header, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1/3">
                      <Badge variant="outline">{header}</Badge>
                    </div>
                    <div className="w-2/3">
                      <Select
                        value={fieldMapping[header] || ''}
                        onValueChange={(value) => handleFieldMappingChange(header, value)}
                        disabled={isUploading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Skip this column</SelectItem>
                          {availableFields.map((field) => (
                            <SelectItem 
                              key={field.value} 
                              value={field.value}
                              disabled={Object.values(fieldMapping).includes(field.value) && fieldMapping[header] !== field.value}
                            >
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{importStatus}</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Validation Errors ({validationErrors.length})</div>
                <ScrollArea className="h-32">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-xs">
                      Row {error.row}: {error.field && `${error.field} - `}{error.error}
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <div className="text-xs text-muted-foreground">
                      ...and {validationErrors.length - 10} more errors
                    </div>
                  )}
                </ScrollArea>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Import Success */}
        {importStatus === 'Import Completed' && validationErrors.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              CSV data has been successfully imported and processed!
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedProfile || !csvHeaders.length || isUploading}
            className="flex-1"
          >
            {isUploading ? 'Processing...' : 'Upload & Import'}
          </Button>
          {(selectedFile || importStatus) && (
            <Button variant="outline" onClick={reset} disabled={isUploading}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};