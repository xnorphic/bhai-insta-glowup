import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const APICredentials = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const handleVerifyCredentials = async () => {
    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      // Test with a well-known public Instagram account
      const testUsername = 'instagram'; // Official Instagram account, always exists
      
      const { data, error } = await supabase.functions.invoke('instagram-starapi', {
        body: { 
          action: 'verify_credentials', 
          username: testUsername 
        }
      });

      if (error) {
        console.error('API verification failed:', error);
        setVerificationStatus('failed');
        setErrorMessage(error.message || 'Failed to verify API credentials');
        toast({
          title: "API Verification Failed",
          description: "There was an issue verifying your StarAPI credentials. Please check your configuration.",
          variant: "destructive",
        });
      } else if (data?.error) {
        console.error('StarAPI error:', data.error);
        setVerificationStatus('failed');
        setErrorMessage(data.error);
        toast({
          title: "StarAPI Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setVerificationStatus('success');
        toast({
          title: "API Verification Successful",
          description: "Your StarAPI credentials are working correctly.",
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationStatus('failed');
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast({
        title: "Verification Error",
        description: error.message || "An unexpected error occurred during verification.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Credentials
        </CardTitle>
        <CardDescription>
          Verify your StarAPI credentials to ensure Instagram data sync is working properly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {verificationStatus === 'pending' && (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-gray-400" />
              </div>
            )}
            {verificationStatus === 'success' && (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            )}
            {verificationStatus === 'failed' && (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">StarAPI Connection</h3>
              <p className="text-sm text-muted-foreground">
                {verificationStatus === 'pending' && 'Not verified'}
                {verificationStatus === 'success' && 'Credentials verified and working'}
                {verificationStatus === 'failed' && 'Verification failed'}
              </p>
              {errorMessage && (
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              )}
            </div>
          </div>
          <Button
            onClick={handleVerifyCredentials}
            disabled={isVerifying}
            variant={verificationStatus === 'success' ? 'outline' : 'default'}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              <>
                {verificationStatus === 'success' ? 'Re-verify' : 'Verify'}
              </>
            )}
          </Button>
        </div>
        
        {verificationStatus === 'failed' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Troubleshooting Steps:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Check if your StarAPI subscription is active</li>
              <li>• Verify your API key in the Supabase secrets</li>
              <li>• Ensure your plan includes Instagram endpoints</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Your API credentials are working correctly. You can now connect Instagram accounts and sync data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};