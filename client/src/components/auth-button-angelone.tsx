import { useMutation, useQuery } from "@tanstack/react-query";
import { Key, CheckCircle2, Shield, Clock, RefreshCw, CheckCircle, LogOut, Loader2, AlertCircle, Plug, Wifi, WifiOff, TrendingUp, TrendingDown, Activity, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface AngelOneProfile {
  name: string;
  email: string;
  clientCode: string;
  broker: string;
}

interface AngelOneStatusData {
  success: boolean;
  connected: boolean;
  authenticated: boolean;
  clientCode?: string;
  tokenExpiry?: number;
  tokenExpired?: boolean;
}

interface AngelOneApiStats {
  connected: boolean;
  authenticated: boolean;
  version: string;
  dailyLimit: number;
  requestsUsed: number;
  lastUpdate: string | null;
  websocketActive: boolean;
  responseTime: number;
  successRate: number;
  throughput: string;
  activeSymbols: number;
  updatesPerSec: number;
  uptime: number;
  latency: number;
  clientCode: string | null;
}

interface AngelOneActivityLog {
  id: number;
  timestamp: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  endpoint?: string;
}

interface LiveIndexData {
  symbol: string;
  name: string;
  token: string;
  exchange: string;
  marketOpen: boolean;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isLive: boolean;
  lastUpdate: string | null;
}

interface LiveIndicesResponse {
  success: boolean;
  connected: boolean;
  websocketActive: boolean;
  timestamp?: string;
  error?: string;
  indices: LiveIndexData[];
}

import { useAngelOneAutoconnect } from "@/hooks/useAngelOneAutoconnect";

// Simple Auth Button - Auto-connect using backend environment variables
export function AuthButtonAngelOne() {
  const { isConnected, isConnecting, status: angelStatus } = useAngelOneAutoconnect();
  const { toast } = useToast();
  const [hasWarnedAboutExpiry, setHasWarnedAboutExpiry] = useState(false);
  
  const [manualClientCode, setManualClientCode] = useState("");
  const [manualPin, setManualPin] = useState("");
  const [manualTotpSecret, setManualTotpSecret] = useState("");

  const { data: profileData } = useQuery<{ success: boolean; profile: AngelOneProfile }>({
    queryKey: ["/api/angelone/profile"],
    enabled: !!(angelStatus?.connected && angelStatus?.authenticated),
    refetchInterval: 30000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/angelone/connect-env");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
      setHasWarnedAboutExpiry(false);
    },
    onError: (error: any) => {
      toast({ title: "Connection Failed", description: error?.message || "Failed to connect. Check environment credentials.", variant: "destructive" });
    },
  });

  const manualLoginMutation = useMutation({
    mutationFn: async (credentials: { clientCode: string; pin: string; totpSecret: string }) => {
      const response = await fetch("/api/angelone/user-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Manual login failed");
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("angel_one_token", data.token);
      localStorage.setItem("angel_one_feed_token", data.feedToken);
      localStorage.setItem("angel_one_client_code", data.clientCode);
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
    },
    onError: (error: any) => {
      toast({ title: "Manual Login Failed", description: error?.message || "Check your credentials.", variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/angelone/disconnect");
    },
    onSuccess: () => {
      localStorage.removeItem("angel_one_token");
      localStorage.removeItem("angel_one_feed_token");
      localStorage.removeItem("angel_one_client_code");
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to disconnect.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (angelStatus?.tokenExpired && !hasWarnedAboutExpiry) {
      setHasWarnedAboutExpiry(true);
      toast({ title: "Session Expired", description: "Your Angel One session has expired.", variant: "destructive" });
    }
  }, [angelStatus?.tokenExpired]);

  const isStatusLoading = isConnecting;


  useEffect(() => {
    if (angelStatus?.tokenExpired && !hasWarnedAboutExpiry) {
      setHasWarnedAboutExpiry(true);
      toast({ title: "Session Expired", description: "Your Angel One session has expired.", variant: "destructive" });
    }
  }, [angelStatus?.tokenExpired]);

  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (angelStatus?.connected && angelStatus?.authenticated) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-900 dark:text-green-200">Angel One Connected</h3>
              <p className="text-xs text-green-700 dark:text-green-300">{profileData?.profile?.name || angelStatus.clientCode || 'Authenticated User'}</p>
            </div>
          </div>
          <Button onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30">
            {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogOut className="mr-2 h-4 w-4" />Disconnect</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-none bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="auto" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">System</TabsTrigger>
          <TabsTrigger value="manual" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">Personal</TabsTrigger>
        </TabsList>
        <TabsContent value="auto" className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-full mt-1">
              <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">System Auto-Login</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pre-configured system credentials.</p>
            </div>
          </div>
          <Button onClick={() => { setHasAttemptedAutoConnect(true); connectMutation.mutate(); }} disabled={connectMutation.isPending} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            {connectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}Connect System
          </Button>
        </TabsContent>
        <TabsContent value="manual" className="p-4 space-y-3">
          <div className="space-y-3">
            <Input placeholder="Client Code" value={manualClientCode} onChange={(e) => setManualClientCode(e.target.value.toUpperCase())} className="h-9" />
            <Input type="password" placeholder="MPIN" value={manualPin} onChange={(e) => setManualPin(e.target.value)} className="h-9" />
            <Input type="password" placeholder="TOTP Secret" value={manualTotpSecret} onChange={(e) => setManualTotpSecret(e.target.value)} className="h-9" />
            <Button onClick={() => manualLoginMutation.mutate({ clientCode: manualClientCode, pin: manualPin, totpSecret: manualTotpSecret })} disabled={manualLoginMutation.isPending} className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900">
              {manualLoginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}Connect Personal
            </Button>
            <p className="text-[10px] text-slate-500 text-center italic">*Direct SmartAPI authentication</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Status Display Component
export function AngelOneStatus() {
  const { toast } = useToast();

  const { data: angelStatus } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 30000,
  });

  const { data: profileData } = useQuery<{ success: boolean; profile: AngelOneProfile }>({
    queryKey: ["/api/angelone/profile"],
    enabled: !!(angelStatus?.connected && angelStatus?.authenticated),
    refetchInterval: 30000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/angelone/status/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/activity-logs"] });
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh Angel One API connection status.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/angelone/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
      // Removed: toast({ title: "Disconnected", description: "Angel One connection has been closed." });
    },
    onError: () => {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect from Angel One.",
        variant: "destructive",
      });
    },
  });

  const isConnected = angelStatus?.connected;
  const isAuthenticated = angelStatus?.authenticated;
  const userName = profileData?.profile?.name || angelStatus?.clientCode || "Not connected";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isConnected && isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          Angel One Connection
        </h4>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || disconnectMutation.isPending}
            size="sm"
            variant="ghost"
            className="h-8"
            data-testid="button-angelone-refresh"
            title="Refresh connection status"
          >
            <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
          {isConnected && isAuthenticated && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to disconnect from Angel One?')) {
                  disconnectMutation.mutate();
                }
              }}
              disabled={disconnectMutation.isPending || refreshMutation.isPending}
              size="sm"
              variant="ghost"
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              data-testid="button-angelone-disconnect"
              title="Disconnect from Angel One"
            >
              <LogOut className={`h-4 w-4 ${disconnectMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isConnected ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <CheckCircle className={`h-4 w-4 ${
              isConnected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
            <p className="text-xs text-gray-500">API Status</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isAuthenticated ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <Shield className={`h-4 w-4 ${
              isAuthenticated ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {isAuthenticated ? 'Authenticated' : 'Not Auth'}
            </p>
            <p className="text-xs text-gray-500">Auth Status</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-[80px]">
              {userName}
            </p>
            <p className="text-xs text-gray-500">User</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// API Statistics Component
export function AngelOneApiStatistics() {
  const { data: stats } = useQuery<{ success: boolean } & AngelOneApiStats>({
    queryKey: ["/api/angelone/statistics"],
    refetchInterval: 5000,
  });

  const responseTimePercentage = Math.min((stats?.responseTime || 0) / 100 * 100, 100);
  const successRatePercentage = stats?.successRate || 0;
  const throughputValue = parseFloat(stats?.throughput?.split(' ')[0] || '0');
  const throughputPercentage = Math.min(throughputValue / 5 * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Angel One API Statistics</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time API performance metrics</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Response Time</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{stats?.responseTime || 0}ms</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(responseTimePercentage, 5)}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{stats?.successRate || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${successRatePercentage}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Throughput</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{stats?.throughput || '0 MB/s'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(throughputPercentage, 5)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.activeSymbols || 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Active Symbols</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.updatesPerSec?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Updates/sec</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.uptime || 0}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.latency || 0}ms</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Avg Latency</p>
        </div>
      </div>
    </div>
  );
}

// System Status Component
export function AngelOneSystemStatus() {
  const { data: stats } = useQuery<{ success: boolean } & AngelOneApiStats>({
    queryKey: ["/api/angelone/statistics"],
    refetchInterval: 5000,
  });

  const { data: logsData } = useQuery<{ success: boolean; logs: AngelOneActivityLog[] }>({
    queryKey: ["/api/angelone/activity-logs"],
    refetchInterval: 10000,
  });

  const logs = logsData?.logs || [];

  const formatTime = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'info':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getRelativeTime = (timestamp: string | Date) => {
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      if (isNaN(time.getTime())) {
        return 'unknown';
      }
      
      const diff = Math.floor((now.getTime() - time.getTime()) / 60000);

      if (diff < 1) return 'just now';
      if (diff < 60) return `${diff} min ago`;
      return `${Math.floor(diff / 60)} hr ago`;
    } catch (error) {
      return 'unknown';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Angel One System Status</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Error handling and system notifications</p>
      </div>

      <div className={`flex items-center space-x-3 p-4 rounded-lg ${
        stats?.connected 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          stats?.connected ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
        }`}>
          <CheckCircle className={`h-4 w-4 ${
            stats?.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {stats?.connected ? 'All Systems Operational' : 'Connection Issues Detected'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {stats?.connected 
              ? 'Angel One API connection stable, no errors detected'
              : 'Unable to connect to Angel One API, please check credentials'
            }
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {stats?.lastUpdate ? getRelativeTime(stats.lastUpdate) : 'Unknown'}
        </span>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">Recent Activity</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {logs.length > 0 ? (
            logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center space-x-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(log.type)}`}></div>
                <span className="text-gray-600 dark:text-gray-400 text-xs w-20">{formatTime(log.timestamp)}</span>
                <span className="text-gray-900 dark:text-gray-100 text-xs flex-1 truncate">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Live Market Prices Component - Shows BANKNIFTY, SENSEX, GOLD with WebSocket status
export function AngelOneLiveMarketPrices() {
  const [isVisible, setIsVisible] = useState(true);

  // Track window visibility - only fetch when dashboard is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const { data: indicesData, isLoading, isError } = useQuery<LiveIndicesResponse>({
    queryKey: ["/api/angelone/live-indices"],
    refetchInterval: isVisible ? 700 : false, // Only fetch when window is visible, stop when in background
    retry: isVisible ? 2 : 0, // No retries when not visible
    staleTime: 0,
    enabled: isVisible // Disable query when window is not visible
  });

  const formatPrice = (price: number) => {
    if (price === 0) return '--';
    return price.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const formatChange = (change: number, changePercent: number) => {
    if (change === 0 && changePercent === 0) return '--';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const getExchangeColor = (exchange: string, marketOpen: boolean) => {
    if (!marketOpen) return 'bg-gray-100 dark:bg-gray-700 text-gray-500';
    switch (exchange) {
      case 'NSE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'BSE': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'MCX': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-500';
    }
  };

  // Default empty indices structure
  const defaultIndices = [
    { symbol: 'BANKNIFTY', name: 'Bank Nifty', token: '99926009', exchange: 'NSE', marketOpen: false, ltp: 0, change: 0, changePercent: 0, isLive: false, open: 0, high: 0, low: 0, close: 0, volume: 0, lastUpdate: null },
    { symbol: 'SENSEX', name: 'Sensex', token: '99919000', exchange: 'BSE', marketOpen: false, ltp: 0, change: 0, changePercent: 0, isLive: false, open: 0, high: 0, low: 0, close: 0, volume: 0, lastUpdate: null },
    { symbol: 'GOLD', name: 'Gold', token: '99920003', exchange: 'MCX', marketOpen: false, ltp: 0, change: 0, changePercent: 0, isLive: false, open: 0, high: 0, low: 0, close: 0, volume: 0, lastUpdate: null }
  ];

  const connected = indicesData?.connected ?? false;
  const websocketActive = indicesData?.websocketActive ?? false;
  const displayIndices = indicesData?.indices && indicesData.indices.length > 0 ? indicesData.indices : defaultIndices;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Live Market Prices</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {websocketActive ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-xs font-medium ${websocketActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {websocketActive ? 'WebSocket Active' : 'WebSocket Off'}
              </span>
            </div>
            {(isLoading || isError) && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {connected ? 'Real-time 700ms tick data from Angel One API' : 'Waiting for Angel One connection...'}
        </p>
        {isError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">Error fetching prices, retrying...</p>}
      </div>

      <div className="space-y-3">
        {displayIndices.map((idx) => (
          <div 
            key={idx.symbol}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
            data-testid={`live-price-${idx.symbol.toLowerCase()}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{idx.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0 ${getExchangeColor(idx.exchange, idx.marketOpen)}`}
                  >
                    {idx.exchange}
                  </Badge>
                  {idx.isLive && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs text-green-600 dark:text-green-400">LIVE</span>
                    </span>
                  )}
                  {!idx.isLive && idx.ltp > 0 && (
                    <span className="text-xs text-gray-500">Last Close</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {idx.marketOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                {idx.change !== 0 && (
                  idx.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )
                )}
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {formatPrice(idx.ltp)}
                </span>
              </div>
              <span className={`text-sm font-medium ${
                idx.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatChange(idx.change, idx.changePercent)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Exchange Status Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-gray-600 dark:text-gray-400">NSE {indicesData?.indices?.[0]?.marketOpen ? 'Open' : 'Closed'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="text-gray-600 dark:text-gray-400">BSE {indicesData?.indices?.[1]?.marketOpen ? 'Open' : 'Closed'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-gray-600 dark:text-gray-400">MCX {indicesData?.indices?.[2]?.marketOpen ? 'Open' : 'Closed'}</span>
            </div>
          </div>
          {indicesData?.timestamp && (
            <span className="text-xs text-gray-500">
              Updated: {new Date(indicesData.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Global Auto-Connect Component - Now functional with environment credentials
export function AngelOneGlobalAutoConnect() {
  const { data: angelStatus, isLoading } = useQuery<AngelOneStatusData>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 5000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/angelone/connect-env");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/angelone/profile"] });
    },
  });

  // Auto-connect on app load if not connected
  useEffect(() => {
    if (!isLoading && angelStatus && !angelStatus.connected && !connectMutation.isPending) {
      console.log('🔶 [Angel One] Global auto-connect with environment credentials...');
      connectMutation.mutate();
    }
  }, [isLoading, angelStatus?.connected]);

  return null;
}
