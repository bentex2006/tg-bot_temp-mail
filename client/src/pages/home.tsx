import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VerificationModal } from "@/components/verification-modal";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Clock, 
  Shield, 
  Lock, 
  Bot, 
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  MessageSquareLock,
  User,
  Star
} from "lucide-react";

interface RegistrationData {
  fullName: string;
  telegramUsername: string;
  telegramId: string;
}

export default function Home() {
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: "",
    telegramUsername: "",
    telegramId: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: () => {
      setShowVerification(true);
      toast({
        title: "Registration Successful",
        description: "Please check your MessageSquareLock for a verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.telegramUsername || !formData.telegramId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms of service.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="text-white h-4 w-4" />
              </div>
              <span className="font-bold text-xl text-slate-900">KalanaAgpur Mail</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection("features")}
                className="text-slate-600 hover:text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection("pricing")}
                className="text-slate-600 hover:text-primary transition-colors"
              >
                Plans
              </button>
              <button 
                onClick={() => scrollToSection("bot")}
                className="text-slate-600 hover:text-primary transition-colors"
              >
                Bot
              </button>
              <Button onClick={() => scrollToSection("signup")}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Email Made Simple with<br />
              <span className="text-sky-200">MessageSquareLock Integration</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Get temporary and permanent email addresses delivered directly to your MessageSquareLock. 
              No passwords, no complexity - just seamless email management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                variant="secondary"
                onClick={() => scrollToSection("signup")}
                className="bg-white text-primary hover:bg-slate-100"
              >
                <MessageSquareLock className="mr-2 h-5 w-5" />
                Start with MessageSquareLock
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                asChild
                className="text-white hover:text-sky-200"
              >
                <a href="https://t.me/skittle_gg" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Contact Developer
                </a>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-sky-200">2</div>
                  <div className="text-sm text-blue-100">Free Permanent Emails</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-sky-200">5</div>
                  <div className="text-sm text-blue-100">Daily Temp Emails</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-sky-200">24h</div>
                  <div className="text-sm text-blue-100">Temp Email Duration</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose KalanaAgpur Mail?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Experience email like never before with our MessageSquareLock-first approach
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6">
                  <MessageSquareLock className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">MessageSquareLock Integration</h3>
                <p className="text-slate-600">
                  Receive all emails directly in your MessageSquareLock chat. No app switching, no notifications chaos.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Temporary Emails</h3>
                <p className="text-slate-600">
                  Generate disposable emails that last 24 hours. Perfect for signups and one-time verifications.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-6">
                  <Shield className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Permanent Emails</h3>
                <p className="text-slate-600">
                  Create lasting email addresses for important accounts and long-term communications.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-6">
                  <Lock className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">No Passwords</h3>
                <p className="text-slate-600">
                  Authenticate using only your MessageSquareLock account. Secure, simple, and hassle-free.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <Bot className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Smart Bot Management</h3>
                <p className="text-slate-600">
                  Manage your emails, check usage, and handle subscriptions directly through our AKI bot.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Instant Setup</h3>
                <p className="text-slate-600">
                  Get started in minutes. Register, connect MessageSquareLock, and start receiving emails immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-slate-600">Start free and upgrade when you need more</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free Plan</CardTitle>
                <div className="text-4xl font-bold text-primary">$0</div>
                <p className="text-slate-600">Perfect for personal use</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>2 Permanent Email Addresses</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>5 Temporary Emails per Day</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>24-hour Temp Email Duration</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>MessageSquareLock Bot Integration</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>Basic Support</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* PRO Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-amber-500 text-slate-900">POPULAR</Badge>
              </div>
              
              <CardHeader className="text-center bg-gradient-to-br from-primary to-secondary text-white rounded-t-lg">
                <CardTitle className="text-2xl">PRO Plan</CardTitle>
                <div className="text-4xl font-bold">Contact Admin</div>
                <p className="text-blue-100">For power users and businesses</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>20 Permanent Email Addresses</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>Unlimited Temporary Emails</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>Priority MessageSquareLock Support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>Advanced Bot Commands</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-emerald-500 mr-3 h-5 w-5" />
                    <span>Premium Support</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <a href="https://t.me/skittle_gg" target="_blank" rel="noopener noreferrer">
                    Contact Admin for Upgrade
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="signup" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-slate-600">
              Connect your MessageSquareLock and start receiving emails instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Register Account</h3>
              <p className="text-slate-600">Fill in your details and create your account</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Connect MessageSquareLock</h3>
              <p className="text-slate-600">Link your MessageSquareLock account for verification</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Start Using</h3>
              <p className="text-slate-600">Create emails and receive them on MessageSquareLock</p>
            </div>
          </div>

          {/* Registration Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="telegramUsername">MessageSquareLock Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">@</span>
                    <Input
                      id="telegramUsername"
                      type="text"
                      placeholder="your_telegram_username"
                      className="pl-8"
                      value={formData.telegramUsername}
                      onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value.replace('@', '') })}
                      required
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    This will be used for verification and email delivery
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="telegramId">MessageSquareLock User ID</Label>
                  <Input
                    id="telegramId"
                    type="text"
                    placeholder="Your MessageSquareLock User ID"
                    value={formData.telegramId}
                    onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                    required
                  />
                  <Card className="mt-2 bg-blue-50 border-blue-200">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-sm text-blue-700 flex items-center">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Don't know your MessageSquareLock ID? Message our bot{" "}
                        <a 
                          href="https://t.me/aki_bot" 
                          className="font-medium underline ml-1" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          @AKI
                        </a>{" "}
                        with /start to get it.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                        I agree to the Terms of Service and understand that this service is managed by{" "}
                        <span className="font-medium text-slate-900">Skittle 𓆩ꨄ𓆪</span> and powered by{" "}
                        <span className="font-medium text-slate-900">kalanaagpur.com</span>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  size="lg"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    "Registering..."
                  ) : (
                    <>
                      <MessageSquareLock className="mr-2 h-5 w-5" />
                      Register & Connect MessageSquareLock
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  After registration, you'll receive a 6-digit verification code in your MessageSquareLock chat
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bot Information Section */}
      <section id="bot" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet AKI - Your Email Assistant</h2>
            <p className="text-xl text-slate-300">Powerful MessageSquareLock bot for complete email management</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Bot Commands</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <code className="text-sky-300">/start</code>
                    <p className="text-slate-300 mt-1">Get started and view user manual</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <code className="text-sky-300">/createtemp</code>
                    <p className="text-slate-300 mt-1">Generate a new temporary email</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <code className="text-sky-300">/myemails</code>
                    <p className="text-slate-300 mt-1">View all your active emails</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <code className="text-sky-300">/usage</code>
                    <p className="text-slate-300 mt-1">Check your current usage limits</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <code className="text-sky-300">/help</code>
                    <p className="text-slate-300 mt-1">Get help and support</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-primary to-secondary border-primary/20">
                <CardHeader>
                  <CardTitle className="text-white">Admin Commands</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <code className="text-sky-100">/userp @username</code>
                    <p className="text-blue-100 mt-1">Promote user to PRO plan</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <code className="text-sky-100">/userinfo @username</code>
                    <p className="text-blue-100 mt-1">Get detailed user information</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <code className="text-sky-100">/ban @username</code>
                    <p className="text-blue-100 mt-1">Ban user from service</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <code className="text-sky-100">/deleteuser @username</code>
                    <p className="text-blue-100 mt-1">Permanently delete user account</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <code className="text-sky-100">/stats</code>
                    <p className="text-blue-100 mt-1">View service statistics</p>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 text-center">
                <Button asChild size="lg" variant="secondary">
                  <a 
                    href="https://t.me/aki_bot" 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquareLock className="mr-3 h-5 w-5" />
                    Start Chat with AKI Bot
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Mail className="text-white h-4 w-4" />
                </div>
                <span className="font-bold text-xl">KalanaAgpur Mail</span>
              </div>
              <p className="text-slate-400 mb-4">
                MessageSquareLock-powered email service for the modern world. Simple, secure, and seamless.
              </p>
              <div className="text-sm text-slate-500">
                Powered by <span className="text-white font-medium">kalanaagpur.com</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => scrollToSection("features")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection("pricing")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection("bot")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Bot Commands
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection("signup")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Get Started
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Developer Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MessageSquareLock className="text-secondary h-5 w-5" />
                  <a 
                    href="https://t.me/skittle_gg" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    @skittle_gg
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="text-secondary h-5 w-5" />
                  <span className="text-slate-400">Skittle 𓆩ꨄ𓆪</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Bot className="text-secondary h-5 w-5" />
                  <a 
                    href="https://t.me/aki_bot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    AKI Bot
                  </a>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-slate-800" />
          
          <div className="text-center">
            <p className="text-slate-500">
              © 2024 KalanaAgpur Mail. All rights reserved. 
              <span className="mx-2">|</span>
              Managed by Cloudflare
            </p>
          </div>
        </div>
      </footer>

      {/* Verification Modal */}
      <VerificationModal 
        open={showVerification}
        onOpenChange={setShowVerification}
        telegramId={formData.telegramId}
      />
    </div>
  );
}
