import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailCard } from "@/components/email-card";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Plus, 
  Clock, 
  Shield, 
  Star, 
  BarChart3,
  ExternalLink,
  MessageSquareLock,
  User,
  Settings
} from "lucide-react";

interface User {
  id: number;
  fullName: string;
  telegramUsername: string;
  telegramId: string;
  isPro: boolean;
  isActive: boolean;
  isBanned: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface Email {
  id: number;
  userId: number;
  email: string;
  type: 'permanent' | 'temporary';
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface UsageStats {
  tempEmailsCreated: number;
  permanentEmailsCreated: number;
}

interface EmailData {
  emails: Email[];
  usage: UsageStats | null;
  limits: {
    permanent: number;
    temporary: number;
  };
}

interface Domain {
  id: number;
  domain: string;
  isPremium: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const [telegramId, setTelegramId] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [emailType, setEmailType] = useState<'permanent' | 'temporary'>('temporary');
  const [customPrefix, setCustomPrefix] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get telegram ID from localStorage or URL params
    const storedId = localStorage.getItem('telegramId');
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('telegramId');
    
    if (paramId) {
      setTelegramId(paramId);
      localStorage.setItem('telegramId', paramId);
    } else if (storedId) {
      setTelegramId(storedId);
    }
  }, []);

  const { data: user, isLoading: userLoading, error: userError } = useQuery<{ user: User }>({
    queryKey: [`/api/user/${telegramId}`],
    enabled: !!telegramId,
  });

  const { data: emailData, isLoading: emailsLoading, error: emailsError } = useQuery<EmailData>({
    queryKey: [`/api/emails/${telegramId}`],
    enabled: !!telegramId,
  });

  const { data: domainsData } = useQuery<{ domains: Domain[] }>({
    queryKey: [`/api/domains/${telegramId}`],
    enabled: !!telegramId,
  });

  const createEmailMutation = useMutation({
    mutationFn: async (data: { telegramId: string; type: string; customPrefix?: string; domain: string }) => {
      const response = await apiRequest("POST", "/api/emails", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/emails/${telegramId}`] });
      setShowCreateDialog(false);
      setCustomPrefix("");
      setSelectedDomain("");
      toast({
        title: "Email Created",
        description: "Your new email address has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create email address.",
        variant: "destructive",
      });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const response = await apiRequest("DELETE", `/api/emails/${emailId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/emails/${telegramId}`] });
      toast({
        title: "Email Deleted",
        description: "Email address has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete email address.",
        variant: "destructive",
      });
    },
  });

  const handleCreateEmail = () => {
    createEmailMutation.mutate({
      telegramId,
      type: emailType,
      customPrefix: emailType === 'permanent' ? customPrefix : undefined,
      domain: 'kalanaagpur.com',
    });
  };

  // Show loading state while checking for telegramId
  if (!telegramId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center">Access Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="telegramId">Enter your Telegram ID</Label>
                <Input
                  id="telegramId"
                  type="text"
                  placeholder="Your Telegram User ID"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => {
                  if (telegramId.trim()) {
                    localStorage.setItem('telegramId', telegramId.trim());
                    setTelegramId(telegramId.trim());
                  }
                }}
                className="w-full"
                disabled={!telegramId.trim()}
              >
                Access Dashboard
              </Button>
              <p className="text-sm text-slate-500 text-center">
                Don't know your ID? Message <a href="https://t.me/akimailb3xbot" className="underline" target="_blank" rel="noopener noreferrer">@akimailb3xbot</a> with /start
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userLoading || emailsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-slate-400">Telegram ID: {telegramId}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-4">Account Not Found</h2>
            <p className="text-slate-600 mb-4">
              Please register first or check your MessageSquareLock ID.
            </p>
            <Button asChild>
              <a href="/">Go to Registration</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emails = emailData?.emails || [];
  const usage = emailData?.usage || { tempEmailsCreated: 0, permanentEmailsCreated: 0 };
  const limits = emailData?.limits || { permanent: 2, temporary: 5 };
  const domains = domainsData?.domains || [];

  // Show error state if user not found
  if (userError && !userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-red-600">User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-slate-600">
                No account found with Telegram ID: {telegramId}
              </p>
              <p className="text-sm text-slate-500">
                Please register first or check your Telegram ID
              </p>
              <Button 
                onClick={() => {
                  localStorage.removeItem('telegramId');
                  window.location.href = '/';
                }}
                className="w-full"
              >
                Go to Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const permanentEmails = emails.filter(e => e.type === 'permanent');
  const temporaryEmails = emails.filter(e => e.type === 'temporary');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="text-white h-4 w-4" />
              </div>
              <span className="font-bold text-xl text-slate-900">B3X Mail</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={user.user.isPro ? "default" : "secondary"}>
                {user.user.isPro ? <><Star className="w-3 h-3 mr-1" /> PRO</> : "FREE"}
              </Badge>
              <Button variant="outline" asChild>
                <a href="https://t.me/akimailb3xbot" target="_blank" rel="noopener noreferrer">
                  <MessageSquareLock className="w-4 h-4 mr-2" />
                  Open Bot
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <User className="text-white h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.user.fullName}</h1>
                  <p className="text-slate-600">@{user.user.telegramUsername}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Member since</div>
                <div className="font-medium">{new Date(user.user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Permanent Emails</p>
                  <p className="text-2xl font-bold">{permanentEmails.length}/{limits.permanent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-amber-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Today's Temp Emails</p>
                  <p className="text-2xl font-bold">
                    {usage.tempEmailsCreated}/{limits.temporary === Infinity ? '∞' : limits.temporary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-emerald-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Active</p>
                  <p className="text-2xl font-bold">{emails.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Account Type</p>
                  <p className="text-2xl font-bold">{user.user.isPro ? 'PRO' : 'FREE'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Email Dialog */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Your Email Addresses</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Email Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select value={emailType} onValueChange={(value: 'permanent' | 'temporary') => setEmailType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temporary">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Temporary (24 hours)
                        </div>
                      </SelectItem>
                      <SelectItem value="permanent">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Permanent
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="domain">Email Domain</Label>
                  <Select value="kalanaagpur.com" disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kalanaagpur.com">kalanaagpur.com</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500 mt-1">
                    Other premium domains coming soon for PRO users!
                  </p>
                </div>

                {emailType === 'permanent' && (
                  <div>
                    <Label htmlFor="customPrefix">Custom Prefix (Optional)</Label>
                    <Input
                      id="customPrefix"
                      type="text"
                      placeholder="myemail"
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Will create: {customPrefix || 'auto-generated'}@kalanaagpur.com
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Current Usage:</h4>
                  <div className="space-y-1 text-sm">
                    <div>Permanent: {permanentEmails.length}/{limits.permanent}</div>
                    <div>
                      Temporary (today): {usage.tempEmailsCreated}/{limits.temporary === Infinity ? '∞' : limits.temporary}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateEmail}
                  disabled={createEmailMutation.isPending}
                  className="w-full"
                >
                  {createEmailMutation.isPending ? "Creating..." : "Create Email"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Email Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Permanent Emails */}
          <div>
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-xl font-bold">Permanent Emails</h3>
              <Badge variant="outline" className="ml-2">
                {permanentEmails.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {permanentEmails.length > 0 ? (
                permanentEmails.map((email) => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    onDelete={(id) => deleteEmailMutation.mutate(id)}
                  />
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No permanent emails yet</p>
                    <p className="text-sm text-slate-400">Create permanent emails for long-term use</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Temporary Emails */}
          <div>
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-amber-500 mr-2" />
              <h3 className="text-xl font-bold">Temporary Emails</h3>
              <Badge variant="outline" className="ml-2">
                {temporaryEmails.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {temporaryEmails.length > 0 ? (
                temporaryEmails.map((email) => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    onDelete={(id) => deleteEmailMutation.mutate(id)}
                  />
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No temporary emails yet</p>
                    <p className="text-sm text-slate-400">Create temp emails for quick signups</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Notice for Free Users */}
        {!user.user.isPro && (
          <Card className="mt-8 bg-gradient-to-br from-primary to-secondary text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Upgrade to PRO</h3>
                  <p className="text-blue-100 mb-4">
                    Get 20 permanent emails and unlimited temporary emails!
                  </p>
                  <ul className="space-y-1 text-sm text-blue-100">
                    <li>• 20 permanent email addresses</li>
                    <li>• Unlimited temporary emails</li>
                    <li>• Priority support</li>
                    <li>• Advanced bot features</li>
                  </ul>
                </div>
                <Button variant="secondary" asChild>
                  <a href="https://t.me/skittle_gg" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Contact Admin
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
