import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, CheckCircle2, AlertCircle, Plug, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface UpstoxProfile {
  userName: string;
  userEmail: string;
  userId: string;
  broker: string;
}

interface UpstoxStatusData {
  success: boolean;
  connected: boolean;
  authenticated: boolean;
  userName?: string;
  userEmail?: string;
  tokenExpiry?: number;
  tokenExpired?: boolean;
}

export function AuthButtonUpstox() {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: upstoxStatus, isLoading: isStatusLoading } = useQuery<UpstoxStatusData>({
    queryKey: ["/api/upstox/status"],
    refetchInterval: 5000,
  });

  // Get authorization URL and redirect
  const getAuthUrlMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("GET", "/api/upstox/auth-url");
    },
    onSuccess: (data: any) => {
      if (data.authUrl) {
        setIsRedirecting(true);
        toast({
          title: "Redirecting...",
          description: "Opening Upstox login page...",
        });
        // Redirect to Upstox OAuth dialog
        window.location.href = data.authUrl;
      }
    },
    onError: (error: any) => {
      setIsRedirecting(false);
      toast({
        title: "Authorization Failed",
        description: error?.message || "Failed to get authorization URL",
        variant: "destructive",
      });
    },
  });

  // Disconnect/logout
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/upstox/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upstox/status"] });
      toast({
        title: "Disconnected",
        description: "Upstox connection closed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error?.message || "Failed to disconnect",
        variant: "destructive",
      });
    },
  });

  const isConnected = upstoxStatus?.connected && upstoxStatus?.authenticated;
  const userName = upstoxStatus?.userName || "User";

  // Connected state - show status and disconnect button
  if (isConnected) {
    return (
      <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-purple-600 dark:text-purple-400 h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
                Upstox Connected
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-300 truncate">
                User: <span className="font-semibold">{userName}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            variant="outline"
            size="sm"
            className="border-purple-600 dark:border-purple-600 text-purple-600 dark:text-purple-400 flex-shrink-0"
            data-testid="button-upstox-disconnect"
          >
            {disconnectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  // Redirecting state
  if (isRedirecting || getAuthUrlMutation.isPending) {
    return (
      <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-3 py-2">
          <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
          <div>
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
              Connecting to Upstox...
            </h3>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Opening Upstox login page
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error or disconnected state
  return (
    <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
            {getAuthUrlMutation.isError ? (
              <AlertCircle className="text-red-600 dark:text-red-400 h-4 w-4" />
            ) : (
              <Plug className="text-purple-600 dark:text-purple-400 h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
              {getAuthUrlMutation.isError ? 'Connection Failed' : 'Upstox Disconnected'}
            </h3>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {getAuthUrlMutation.isError 
                ? 'Tap Connect to retry' 
                : 'Tap Connect to authenticate'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => getAuthUrlMutation.mutate()}
          disabled={getAuthUrlMutation.isPending || isStatusLoading}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
          data-testid="button-upstox-connect"
        >
          <Key className="mr-2 h-4 w-4" />
          Connect
        </Button>
      </div>
    </div>
  );
}
