import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ImportRecord {
  id: string;
  filename: string;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  status: string;
  started_at: string;
  completed_at?: string;
  validation_errors: any[] | null;
  processing_errors: any[] | null;
}

export const ImportHistory: React.FC = () => {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_csv_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImports((data as ImportRecord[]) || []);
    } catch (error) {
      console.error('Error fetching imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { variant: 'default' as const, icon: Clock, text: 'Processing' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: 'Failed' },
      validation_failed: { variant: 'destructive' as const, icon: AlertCircle, text: 'Validation Failed' },
      validated: { variant: 'secondary' as const, icon: CheckCircle, text: 'Validated' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import History
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchImports}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No import history found
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {imports.map((importRecord) => (
                <div key={importRecord.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{importRecord.filename}</div>
                    {getStatusBadge(importRecord.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Rows</div>
                      <div className="font-medium">{importRecord.total_rows}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Successful</div>
                      <div className="font-medium text-green-600">{importRecord.successful_rows}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Failed</div>
                      <div className="font-medium text-red-600">{importRecord.failed_rows}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Started</div>
                      <div className="font-medium">
                        {format(new Date(importRecord.started_at), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>

                  {((importRecord.validation_errors?.length || 0) > 0 || (importRecord.processing_errors?.length || 0) > 0) && (
                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground mb-1">Issues:</div>
                      <div className="text-xs text-red-600 space-y-1">
                        {importRecord.validation_errors?.slice(0, 3).map((error, index) => (
                          <div key={index}>Row {error.row}: {error.error}</div>
                        ))}
                        {importRecord.processing_errors?.slice(0, 3).map((error, index) => (
                          <div key={index}>{error.error}</div>
                        ))}
                        {((importRecord.validation_errors?.length || 0) + (importRecord.processing_errors?.length || 0)) > 3 && (
                          <div className="text-muted-foreground">
                            ...and {((importRecord.validation_errors?.length || 0) + (importRecord.processing_errors?.length || 0)) - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};