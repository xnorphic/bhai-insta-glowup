import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Download, Calendar, Users, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CSVExportProps {
  connectedProfiles: Array<{
    id: string;
    username: string;
    displayName: string;
  }>;
}

export const CSVExport: React.FC<CSVExportProps> = ({ connectedProfiles }) => {
  const [exportType, setExportType] = useState<string>('content');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleProfileToggle = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProfiles.length === connectedProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(connectedProfiles.map(p => p.id));
    }
  };

  const downloadCSV = async () => {
    if (exportType === 'content' && selectedProfiles.length === 0) {
      toast.error('Please select at least one profile to export content data');
      return;
    }

    setIsExporting(true);
    
    try {
      const requestBody: any = {
        export_type: exportType
      };

      if (exportType === 'content' && selectedProfiles.length > 0) {
        requestBody.profile_ids = selectedProfiles;
      }

      if (dateRange.start || dateRange.end) {
        requestBody.date_range = {
          start: dateRange.start || null,
          end: dateRange.end || null
        };
      }

      const { data, error } = await supabase.functions.invoke('instagram-csv-export', {
        body: requestBody
      });

      if (error) {
        throw error;
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `instagram_${exportType}_${timestamp}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CSV file downloaded successfully!');
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Instagram Data
        </CardTitle>
        <CardDescription>
          Download your Instagram analytics data as CSV files for further analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="export-type">Data Type</Label>
          <Select value={exportType} onValueChange={setExportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select data type to export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="content">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content Data (posts, metrics, engagement)
                </div>
              </SelectItem>
              <SelectItem value="profiles">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Profile Data (connections, follower counts)
                </div>
              </SelectItem>
              <SelectItem value="sync_logs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sync Logs (sync history, API usage)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile Selection (for content export) */}
        {exportType === 'content' && connectedProfiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Profiles</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                type="button"
              >
                {selectedProfiles.length === connectedProfiles.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {connectedProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={profile.id}
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={() => handleProfileToggle(profile.id)}
                  />
                  <Label
                    htmlFor={profile.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    @{profile.username} ({profile.displayName})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Selection */}
        {exportType === 'content' && (
          <div className="space-y-3">
            <Label>Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={downloadCSV}
          disabled={isExporting || (exportType === 'content' && selectedProfiles.length === 0)}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : `Export ${exportType === 'content' ? 'Content' : exportType === 'profiles' ? 'Profiles' : 'Sync Logs'} CSV`}
        </Button>

        {/* Info Text */}
        <div className="text-sm text-muted-foreground">
          {exportType === 'content' && (
            <p>Content data includes post details, engagement metrics, hashtags, and performance analytics.</p>
          )}
          {exportType === 'profiles' && (
            <p>Profile data includes connection details, follower counts, and account information.</p>
          )}
          {exportType === 'sync_logs' && (
            <p>Sync logs include data refresh history, API usage statistics, and sync status information.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};