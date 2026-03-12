import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, CheckCircle2, AlertCircle, Plug, Loader2, LogOut, Copy, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FyersStatusData {
  connected: boolean;
  authenticated: boolean;
  userName?: string;
  userEmail?: string;
}

interface AuthButtonFyersProps {
  externalAppId?: string;
  externalSecretId?: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function AuthButtonFyers({ externalAppId, externalSecretId, onSuccess, onClose }: AuthButtonFyersProps) {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const { data: fyersStatus, isLoading: isStatusLoading } = useQuery<FyersStatusData>({
    queryKey: ["/api/fyers/status"],
    refetchInterval: 5000,
  });

  const [internalAppId, setAppId] = useState(() => localStorage.getItem("fyers_app_id") || "");
  const [internalSecretId, setSecretId] = useState(() => localStorage.getItem("fyers_secret_id") || "");

  useEffect(() => {
    if (internalAppId) localStorage.setItem("fyers_app_id", internalAppId);
  }, [internalAppId]);

  useEffect(() => {
    if (internalSecretId) localStorage.setItem("fyers_secret_id", internalSecretId);
  }, [internalSecretId]);

  const effectiveAppId = externalAppId || internalAppId;
  const effectiveSecretId = externalSecretId || internalSecretId;

  const getAuthUrlMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/fyers/auth-url", { 
        appId: effectiveAppId, 
        secretId: effectiveSecretId 
      });
    },
    onSuccess: (data: any) => {
      if (data.url) {
        setIsRedirecting(true);
        toast({
          title: "Redirecting...",
          description: "Opening Fyers login page...",
        });
        if (onSuccess) onSuccess();
        window.location.href = data.url;
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

  const isConnected = fyersStatus?.connected && fyersStatus?.authenticated;
  const userName = fyersStatus?.userName || "User";

  if (isConnected) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-blue-600 dark:text-blue-400 h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Fyers Connected
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logged in as <span className="font-medium text-blue-600 dark:text-blue-400">{userName}</span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 h-9"
            onClick={() => {
              apiRequest("POST", "/api/fyers/disconnect").then(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/fyers/status"] });
                toast({ title: "Disconnected", description: "Fyers account disconnected" });
              });
            }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw" alt="Fyers" className="h-5 rounded-full" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Connect Fyers Broker</h3>
        </div>
      </div>
      
      <div className="space-y-4 py-4">
        {!externalAppId && (
          <div className="space-y-2">
            <Label htmlFor="fyers-app-id" className="text-slate-700 dark:text-slate-300">App ID</Label>
            <Input
              id="fyers-app-id"
              placeholder="Enter your Fyers App ID"
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              value={internalAppId}
              onChange={(e) => setAppId(e.target.value)}
              data-testid="input-fyers-app-id"
            />
          </div>
        )}
        {!externalSecretId && (
          <div className="space-y-2">
            <Label htmlFor="fyers-secret-id" className="text-slate-700 dark:text-slate-300">Secret ID</Label>
            <div className="relative">
              <Input
                id="fyers-secret-id"
                type={showSecret ? "text" : "password"}
                placeholder="Enter your Fyers Secret ID"
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                value={internalSecretId}
                onChange={(e) => setSecretId(e.target.value)}
                data-testid="input-fyers-secret-id"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-transparent"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 w-full group hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors overflow-hidden">
            <span className="text-[10px] text-slate-500 font-medium shrink-0">Redirect URL:</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold truncate block max-w-[200px]">{window.location.protocol}//{window.location.host}/api/fyers/callback</code>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/fyers/callback`);
                toast({
                  title: "Copied",
                  description: "Redirect URL copied",
                });
              }}
            >
              <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Button>
          </div>

          <p className="text-[10px] text-slate-500">
            Generate API keys at:{" "}
            <a 
              href="https://myapi.fyers.in/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
            >
              https://myapi.fyers.in/dashboard
            </a>
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => onClose?.()}>
          Cancel
        </Button>
        <Button
          onClick={() => getAuthUrlMutation.mutate()}
          disabled={getAuthUrlMutation.isPending || isStatusLoading || isRedirecting || !effectiveAppId || !effectiveSecretId}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {getAuthUrlMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Connect Account
        </Button>
      </div>
    </div>
  );
}
