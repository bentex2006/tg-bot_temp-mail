import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Copy, MoreVertical, Trash2, Clock, Shield, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Email {
  id: number;
  email: string;
  type: 'permanent' | 'temporary';
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface EmailCardProps {
  email: Email;
  onDelete: (id: number) => void;
}

export function EmailCard({ email, onDelete }: EmailCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = () => {
    if (!email.expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(email.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const isExpired = email.expiresAt && new Date(email.expiresAt) < new Date();

  return (
    <>
      <Card className={`${isExpired ? 'opacity-60 border-red-200' : ''} hover:shadow-md transition-shadow`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {email.type === 'permanent' ? (
                  <Shield className="w-4 h-4 text-primary" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
                <Badge variant={email.type === 'permanent' ? 'default' : 'secondary'}>
                  {email.type === 'permanent' ? 'Permanent' : 'Temporary'}
                </Badge>
                {isExpired && <Badge variant="destructive">Expired</Badge>}
              </div>
              
              <div className="font-mono text-sm bg-slate-50 rounded px-3 py-2 mb-3 break-all">
                {email.email}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Created: {new Date(email.createdAt).toLocaleDateString()}</span>
                {email.type === 'temporary' && (
                  <span className={isExpired ? 'text-red-500' : 'text-amber-600'}>
                    {getTimeRemaining()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(email.email)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => copyToClipboard(email.email)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Email
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {email.type === 'temporary' && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                This temporary email will be automatically deleted when it expires.
                All emails sent to this address are forwarded to your Telegram.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{email.email}</strong>? 
              This action cannot be undone and you will no longer receive emails 
              sent to this address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(email.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
