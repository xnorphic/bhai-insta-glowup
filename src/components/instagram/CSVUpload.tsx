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

  // Enhanced Instagram media fields for mapping (including collaboration & trending data)
  const availableFields = [
    { value: 'profile_id', label: 'Profile ID (Required for multi-profile CSV)', required: false },
    { value: 'username', label: 'Username (Required for multi-profile CSV)', required: false },
    { value: 'post_url', label: 'Post URL (Required)', required: true },
    { value: 'post_date', label: 'Post Date (Required)', required: true },
    { value: 'post_type', label: 'Post Type (Required)', required: true },
    { value: 'caption', label: 'Caption (Required)', required: true },
    { value: 'likes', label: 'Likes' },
    { value: 'comments', label: 'Comments' },
    { value: 'shares', label: 'Shares' },
    { value: 'saves', label: 'Saves' },
    { value: 'views', label: 'Views' },
    { value: 'reach', label: 'Reach' },
    { value: 'impressions', label: 'Impressions' },
    { value: 'engagement_rate', label: 'Engagement Rate' },
    { value: 'follower_count', label: 'Follower Count' },
    { value: 'tags', label: 'Tags (comma-separated)' },
    // Enhanced collaboration fields
    { value: 'og_username', label: 'Original Creator Username' },
    { value: 'collab_with', label: 'Collaboration Partner' },
    // Audio and trending insights
    { value: 'audio_title', label: 'Audio Title' },
    { value: 'audio_artist', label: 'Audio Artist' },
    { value: 'play_count', label: 'Play Count (Reels)' },
    { value: 'reshare_count', label: 'Reshare Count' },
    { value: 'is_trending_in_clips', label: 'Trending in Clips (true/false)' },
    // Additional metrics
    { value: 'is_paid_partnership', label: 'Paid Partnership (true/false)' },
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

        // Enhanced auto-mapping with intelligent field detection
        const autoMapping: FieldMapping = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().replace(/\s+/g, '_');
          
          // Profile identification fields
          if (lowerHeader.includes('profile_id') || lowerHeader.includes('account_id')) {
            autoMapping[header] = 'profile_id';
          } else if (lowerHeader.includes('username') || lowerHeader.includes('handle') || lowerHeader.includes('account_name')) {
            autoMapping[header] = 'username';
          }
          
          // Core required fields
          else if (lowerHeader.includes('post_url') || lowerHeader.includes('url') || lowerHeader.includes('permalink')) {
            autoMapping[header] = 'post_url';
          } else if (lowerHeader.includes('post_date') || lowerHeader.includes('date') || lowerHeader.includes('timestamp')) {
            autoMapping[header] = 'post_date';
          } else if (lowerHeader.includes('post_type') || lowerHeader.includes('type') || lowerHeader.includes('media_type')) {
            autoMapping[header] = 'post_type';
          } else if (lowerHeader.includes('caption') || lowerHeader.includes('description')) {
            autoMapping[header] = 'caption';
          }
          
          // Engagement metrics
          else if (lowerHeader.includes('likes') || lowerHeader === 'like' || lowerHeader === 'like_count') {
            autoMapping[header] = 'likes';
          } else if (lowerHeader.includes('comments') || lowerHeader === 'comment' || lowerHeader === 'comment_count') {
            autoMapping[header] = 'comments';
          } else if (lowerHeader.includes('shares') || lowerHeader === 'share' || lowerHeader === 'share_count') {
            autoMapping[header] = 'shares';
          } else if (lowerHeader.includes('saves') || lowerHeader === 'save' || lowerHeader === 'save_count') {
            autoMapping[header] = 'saves';
          } else if (lowerHeader.includes('views') || lowerHeader === 'view' || lowerHeader === 'view_count') {
            autoMapping[header] = 'views';
          } else if (lowerHeader.includes('reach')) {
            autoMapping[header] = 'reach';
          } else if (lowerHeader.includes('impressions')) {
            autoMapping[header] = 'impressions';
          } else if (lowerHeader.includes('engagement')) {
            autoMapping[header] = 'engagement_rate';
          } else if (lowerHeader.includes('follower')) {
            autoMapping[header] = 'follower_count';
          }
          
          // Enhanced collaboration fields
          else if (lowerHeader.includes('og_username') || lowerHeader.includes('original_username')) {
            autoMapping[header] = 'og_username';
          } else if (lowerHeader.includes('collab_with') || lowerHeader.includes('collaboration') || lowerHeader.includes('partner')) {
            autoMapping[header] = 'collab_with';
          }
          
          // Audio and content insights
          else if (lowerHeader.includes('audio_title') || lowerHeader.includes('music_title') || lowerHeader.includes('sound_title')) {
            autoMapping[header] = 'audio_title';
          } else if (lowerHeader.includes('audio_artist') || lowerHeader.includes('music_artist') || lowerHeader.includes('sound_artist')) {
            autoMapping[header] = 'audio_artist';
          } else if (lowerHeader.includes('play_count') || lowerHeader === 'plays') {
            autoMapping[header] = 'play_count';
          } else if (lowerHeader.includes('reshare') || lowerHeader.includes('repost')) {
            autoMapping[header] = 'reshare_count';
          } else if (lowerHeader.includes('trending') || lowerHeader.includes('viral')) {
            autoMapping[header] = 'is_trending_in_clips';
          }
          
          // Additional insights
          else if (lowerHeader.includes('paid_partnership') || lowerHeader.includes('sponsored')) {
            autoMapping[header] = 'is_paid_partnership';
          } else if (lowerHeader.includes('location')) {
            autoMapping[header] = 'location_name';
          } else if (lowerHeader.includes('tags') || lowerHeader.includes('hashtag')) {
            autoMapping[header] = 'tags';
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
      'Profile ID',
      'Username',
      'Post URL',
      'Post Date',
      'Post Type',
      'Caption',
      'Likes',
      'Comments',
      'Shares',
      'Saves',
      'Views',
      'Reach',
      'Impressions',
      'Engagement Rate',
      'Follower Count',
      'Tags',
      'OG Username',
      'Collab With',
      'Audio Title',
      'Audio Artist', 
      'Play Count',
      'Reshare Count',
      'Is Trending in Clips',
      'Is Paid Partnership',
      'Location Name'
    ];
    
    const sampleData = [
      [
        'profile123',
        'myaccount',
        'https://www.instagram.com/p/ABC123/',
        '2024-01-15',
        'Carousel',
        'Check out our latest product! #newlaunch #innovation',
        '150',
        '12',
        '5',
        '25',
        '1200',
        '800',
        '1500',
        '12.5%',
        '5000',
        'newlaunch,innovation,product',
        '',
        'partneruser',
        'Trending Audio Track',
        'Popular Artist',
        '',
        '8',
        'true',
        'false',
        'New York, NY'
      ],
      [
        'profile456',
        'anotheraccount',
        'https://www.instagram.com/p/DEF456/',
        '2024-01-16',
        'Reel',
        'Behind the scenes content 🎬',
        '320',
        '28',
        '15',
        '45',
        '2800',
        '1500',
        '3200',
        '18.2%',
        '5020',
        'behindthescenes,content,video',
        'originalcreator',
        '',
        'Behind the Scenes Music',
        'Studio Artist',
        '2800',
        '15',
        'false',
        'true',
        'Los Angeles, CA'
      ]
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
    const requiredFields = ['post_url', 'post_date', 'post_type', 'caption'];
    const mappedFields = Object.values(fieldMapping);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    // Check if we have profile identification (either profile_id or username)
    const hasProfileId = mappedFields.includes('profile_id');
    const hasUsername = mappedFields.includes('username');
    
    if (missingRequired.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please map the following required fields: ${missingRequired.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    
    if (!hasProfileId && !hasUsername && !selectedProfile) {
      toast({
        title: "Profile identification required",
        description: "For multi-profile CSV, please map either 'Profile ID' or 'Username' field, or select a single target profile.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile || !validateMapping()) {
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
            profile_id: selectedProfile || null, // Can be null for multi-profile CSV
            field_mapping: fieldMapping,
            import_settings: {
              skip_header: true,
              delimiter: ',',
              update_existing: true,
              multi_profile: !selectedProfile // Indicate if this is a multi-profile upload
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
        <div className="space-y-2">
          <Label htmlFor="profile-select">Target Instagram Profile (Optional for multi-profile CSV)</Label>
          {profiles.length > 0 ? (
            <div className="space-y-2">
              <Select value={selectedProfile} onValueChange={setSelectedProfile} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select single profile (leave empty for multi-profile CSV)..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.profile_id} value={profile.profile_id}>
                      @{profile.username} {profile.full_name && `(${profile.full_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave empty if your CSV contains data for multiple profiles. Make sure to map 'Profile ID' or 'Username' fields.
              </p>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Instagram profiles connected yet. For multi-profile CSV uploads, make sure your CSV includes profile identification fields.
              </AlertDescription>
            </Alert>
          )}
        </div>

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
                          <SelectItem value="skip">Skip this column</SelectItem>
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
            disabled={!selectedFile || !csvHeaders.length || isUploading}
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