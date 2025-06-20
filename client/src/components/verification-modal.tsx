import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquareLock, CheckCircle } from "lucide-react";

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telegramId: string;
}

export function VerificationModal({ open, onOpenChange, telegramId }: VerificationModalProps) {
  const [code, setCode] = useState("");
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (data: { telegramId: string; code: string }) => {
      const response = await apiRequest("POST", "/api/verify", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Successful!",
        description: "Your account has been activated. Redirecting to dashboard...",
      });
      // Store telegram ID and redirect to dashboard
      localStorage.setItem('telegramId', telegramId);
      setTimeout(() => {
        window.location.href = `/dashboard`;
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, you'd have a resend endpoint
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your MessageSquareLock.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    verifyMutation.mutate({ telegramId, code });
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquareLock className="text-white h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl">Verify Your MessageSquareLock</DialogTitle>
          <p className="text-slate-600">
            We've sent a 6-digit code to your Telegram chat (@akimailb3xbot)
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={verifyMutation.isPending || code.length !== 6}
          >
            {verifyMutation.isPending ? (
              "Verifying..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify & Complete Registration
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost"
            className="w-full"
            onClick={() => resendCodeMutation.mutate()}
            disabled={resendCodeMutation.isPending}
          >
            {resendCodeMutation.isPending ? "Sending..." : "Didn't receive code? Resend"}
          </Button>
        </form>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-3 pb-3">
            <p className="text-sm text-blue-700 text-center">
              Check your Telegram chat with @akimailb3xbot for the verification code.
              The code expires in 10 minutes.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
