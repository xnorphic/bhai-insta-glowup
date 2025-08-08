import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram, Settings, Key, Activity, BarChart3, Upload } from 'lucide-react';
import { APICredentials } from './instagram/APICredentials';
import { InstagramConnect } from './instagram/InstagramConnect';
import { SyncManagement } from './instagram/SyncManagement';
import { CSVUpload } from './instagram/CSVUpload';
import { ImportHistory } from './instagram/ImportHistory';
import { supabase } from '@/integrations/supabase/client';

export const InstagramManagement = () => {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('instagram_profiles')
        .select('profile_id, username, full_name')
        .eq('is_active', true);
      
      if (data) {
        setProfiles(data);
      }
    };

    fetchProfiles();
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instagram Setup</h1>
          <p className="text-muted-foreground">
            Configure your Instagram integrations, verify API credentials, and manage data sync
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="connect" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Connect
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="csv-import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            CSV Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  API Status
                </CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Pending</div>
                <p className="text-xs text-muted-foreground">
                  Verify credentials in Credentials tab
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Connected Accounts
                </CardTitle>
                <Instagram className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Connect accounts in Connect tab
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Last Sync
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Never</div>
                <p className="text-xs text-muted-foreground">
                  No sync performed yet
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Setup Checklist</CardTitle>
              <CardDescription>Complete these steps to start analyzing your Instagram data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full border-2 border-orange-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Verify API Credentials</p>
                  <p className="text-sm text-muted-foreground">Test your StarAPI connection</p>
                </div>
                <span className="text-sm text-orange-600 font-medium">Pending</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Connect Instagram Account</p>
                  <p className="text-sm text-muted-foreground">Link your Instagram profile for analytics</p>
                </div>
                <span className="text-sm text-gray-500 font-medium">Waiting</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">First Data Sync</p>
                  <p className="text-sm text-muted-foreground">Fetch your Instagram posts and analytics</p>
                </div>
                <span className="text-sm text-gray-500 font-medium">Waiting</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connect" className="space-y-6">
          <InstagramConnect />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <APICredentials />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <SyncManagement />
        </TabsContent>

        <TabsContent value="csv-import" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">CSV Data Import</h2>
              <p className="text-muted-foreground">
                Import Instagram data from CSV files as an alternative to API synchronization.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CSVUpload profiles={profiles} />
              <ImportHistory />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};