import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle, Shield, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ApiStatus } from "@shared/schema";

export function ConnectionStatus() {
  const { toast } = useToast();

  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/status/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh API connection status.",
        variant: "destructive",
      });
    },
  });

  const formatLastUpdate = (date: string | Date) => {
    const now = new Date();
    const update = new Date(date);
    const diff = Math.floor((now.getTime() - update.getTime()) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  return (
    <div className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fyers API Connection</h2>
            <div className="flex items-center space-x-2">
              {(!apiStatus?.authenticated || !apiStatus?.connected) && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Authentication Required
                </span>
              )}
              <Button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(207,90%,44%)]"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh Connection
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                apiStatus?.connected ? 'bg-[hsl(122,39%,49%)]/10' : 'bg-gray-100'
              }`}>
                <CheckCircle className={`${
                  apiStatus?.connected ? 'text-[hsl(122,39%,49%)]' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {apiStatus?.connected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-xs text-gray-600">API Status</p>
              </div>
            </div>

            {/* Authentication */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                apiStatus?.authenticated ? 'bg-[hsl(122,39%,49%)]/10' : 'bg-gray-100'
              }`}>
                <Shield className={`${
                  apiStatus?.authenticated ? 'text-[hsl(122,39%,49%)]' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {apiStatus?.authenticated ? 'Authenticated' : 'Not Authenticated'}
                </p>
                <p className="text-xs text-gray-600">Auth Status</p>
              </div>
            </div>

            {/* Last Update */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="text-[hsl(207,90%,54%)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {apiStatus?.lastUpdate ? formatLastUpdate(apiStatus.lastUpdate) : 'Never'}
                </p>
                <p className="text-xs text-gray-600">Last Update</p>
              </div>
            </div>
          </div>

          {/* API Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">API Version</p>
                <p className="font-medium">{apiStatus?.version || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-600">Daily Limit</p>
                <p className="font-medium">{apiStatus?.dailyLimit?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-gray-600">Requests Used</p>
                <p className="font-medium">{apiStatus?.requestsUsed?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-gray-600">WebSocket</p>
                <p className={`font-medium ${
                  apiStatus?.websocketActive ? 'text-[hsl(122,39%,49%)]' : 'text-gray-400'
                }`}>
                  {apiStatus?.websocketActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
