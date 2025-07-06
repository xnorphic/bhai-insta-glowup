
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Instagram, Plus, X, Crown, Target, Mail, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectedAccount {
  id: string;
  username: string;
  type: 'owned' | 'competitor';
  profilePicture?: string;
  followerCount?: number;
}

export const CompetitionInstagramConnect = () => {
  const { toast } = useToast();
  const [credits, setCredits] = useState(2); // Starting with 2 credits for demo
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    {
      id: '1',
      username: 'naukridotcom',
      type: 'owned',
      profilePicture: 'https://via.placeholder.com/48',
      followerCount: 850000
    }
  ]);
  const [newUsername, setNewUsername] = useState('');
  const [accountType, setAccountType] = useState<'owned' | 'competitor'>('owned');
  const [isConnecting, setIsConnecting] = useState(false);

  const maxAccounts = 3;
  const creditCost = 90; // USD per credit

  const handleConnectAccount = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter an Instagram username",
        variant: "destructive",
      });
      return;
    }

    if (connectedAccounts.length >= maxAccounts) {
      toast({
        title: "Account Limit Reached",
        description: `You can only connect up to ${maxAccounts} accounts`,
        variant: "destructive",
      });
      return;
    }

    if (credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need 1 credit to add an account. Please purchase more credits.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newAccount: ConnectedAccount = {
        id: Date.now().toString(),
        username: newUsername.trim().replace('@', ''),
        type: accountType,
        profilePicture: 'https://via.placeholder.com/48',
        followerCount: Math.floor(Math.random() * 1000000) + 100000
      };

      setConnectedAccounts([...connectedAccounts, newAccount]);
      setCredits(credits - 1);
      setNewUsername('');
      setIsConnecting(false);

      toast({
        title: "Account Connected!",
        description: `Successfully connected @${newAccount.username}. ${credits - 1} credits remaining.`,
      });
    }, 2000);
  };

  const handleRemoveAccount = (accountId: string) => {
    const account = connectedAccounts.find(acc => acc.id === accountId);
    setConnectedAccounts(connectedAccounts.filter(acc => acc.id !== accountId));
    
    toast({
      title: "Account Removed",
      description: `@${account?.username} has been removed. Credits are not refunded.`,
    });
  };

  const handlePurchaseCredits = () => {
    const subject = "Request for Competition Analysis Credits";
    const body = `Hi,

I would like to purchase credits for Competition Analysis feature.

Current Credits: ${credits}
Credits Needed: Please let me know available packages

Account Details:
- Current connected accounts: ${connectedAccounts.length}/${maxAccounts}

Please provide payment instructions and credit packages.

Thank you!`;

    const mailtoLink = `mailto:support@yourdomain.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    toast({
      title: "Email Client Opened",
      description: "Please send the email to purchase more credits.",
    });
  };

  const ownedAccounts = connectedAccounts.filter(acc => acc.type === 'owned');
  const competitorAccounts = connectedAccounts.filter(acc => acc.type === 'competitor');

  return (
    <div className="space-y-6">
      {/* Credits and Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Instagram className="w-6 h-6 mr-2 text-pink-500" />
              Competition Analysis - Instagram Connect
            </h3>
            <p className="text-gray-600 mt-1">
              Connect your own account and competitor accounts for detailed analysis
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-semibold">{credits} Credits</span>
            </div>
            <p className="text-sm text-gray-500">
              {connectedAccounts.length}/{maxAccounts} accounts connected
            </p>
          </div>
        </div>

        {credits === 0 && (
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              You're out of credits! Each account requires 1 credit (${creditCost} USD).{' '}
              <Button variant="link" className="p-0 h-auto" onClick={handlePurchaseCredits}>
                Click here to purchase more credits
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Connect New Account */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Connect New Account</h4>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button
              variant={accountType === 'owned' ? 'default' : 'outline'}
              onClick={() => setAccountType('owned')}
              className="flex items-center space-x-2"
            >
              <Crown className="w-4 h-4" />
              <span>Own Account</span>
            </Button>
            <Button
              variant={accountType === 'competitor' ? 'default' : 'outline'}
              onClick={() => setAccountType('competitor')}
              className="flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Competitor</span>
            </Button>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="username">Instagram Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username (e.g., swiggyindia)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnectAccount()}
                disabled={isConnecting || connectedAccounts.length >= maxAccounts}
              />
            </div>
            <div className="flex items-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    disabled={isConnecting || connectedAccounts.length >= maxAccounts || credits < 1}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isConnecting ? (
                      <>Connecting...</>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Connect (1 Credit)
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Account Connection</DialogTitle>
                    <DialogDescription>
                      You're about to connect <strong>@{newUsername}</strong> as a{' '}
                      <strong>{accountType === 'owned' ? 'owned' : 'competitor'}</strong> account.
                      <br /><br />
                      This will cost <strong>1 credit (${creditCost} USD)</strong>. 
                      You currently have <strong>{credits} credits</strong> left.
                      <br /><br />
                      <em>Note: Credits are not refunded when accounts are removed.</em>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setNewUsername('')}>Cancel</Button>
                    <Button onClick={handleConnectAccount}>
                      Confirm Connection
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </Card>

      {/* Owned Accounts Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            Your Accounts ({ownedAccounts.length})
          </h4>
        </div>
        
        {ownedAccounts.length > 0 ? (
          <div className="space-y-3">
            {ownedAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex items-center space-x-3">
                  <img
                    src={account.profilePicture}
                    alt={`@${account.username}`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h5 className="font-medium">@{account.username}</h5>
                    <p className="text-sm text-gray-600">
                      {account.followerCount?.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveAccount(account.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No owned accounts connected</p>
        )}
      </Card>

      {/* Competitor Accounts Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold flex items-center">
            <Target className="w-5 h-5 mr-2 text-red-500" />
            Competitor Accounts ({competitorAccounts.length})
          </h4>
        </div>
        
        {competitorAccounts.length > 0 ? (
          <div className="space-y-3">
            {competitorAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                <div className="flex items-center space-x-3">
                  <img
                    src={account.profilePicture}
                    alt={`@${account.username}`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h5 className="font-medium">@{account.username}</h5>
                    <p className="text-sm text-gray-600">
                      {account.followerCount?.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveAccount(account.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No competitor accounts connected</p>
        )}
      </Card>

      {/* Purchase Credits */}
      {credits < 3 && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-blue-900">Need More Credits?</h4>
              <p className="text-blue-700 mt-1">
                Each credit costs ${creditCost} USD and allows you to connect one account.
                <br />
                Credits are not refunded when accounts are removed.
              </p>
            </div>
            <Button 
              onClick={handlePurchaseCredits}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Purchase Credits
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
