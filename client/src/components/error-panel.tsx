import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ActivityLog, ApiStatus } from "@shared/schema";

export function ErrorPanel() {
  const { data: logs } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
    refetchInterval: 10000,
  });

  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

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
        return 'bg-[hsl(122,39%,49%)]';
      case 'info':
        return 'bg-[hsl(207,90%,54%)]';
      case 'warning':
        return 'bg-[hsl(45,93%,47%)]';
      case 'error':
        return 'bg-[hsl(0,84%,60%)]';
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
      
      const diff = Math.floor((now.getTime() - time.getTime()) / 60000); // minutes

      if (diff < 1) return 'just now';
      if (diff < 60) return `${diff} min ago`;
      return `${Math.floor(diff / 60)} hr ago`;
    } catch (error) {
      return 'unknown';
    }
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-green-400">System Status</h3>
          <p className="text-sm text-green-300 mt-1">Error handling and system notifications</p>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Success State */}
          <div className="flex items-center space-x-3 p-4 bg-[hsl(122,39%,49%)]/5 border border-[hsl(122,39%,49%)]/20 rounded-lg">
            <div className="w-8 h-8 bg-[hsl(122,39%,49%)]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="text-[hsl(122,39%,49%)] text-sm" size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {apiStatus?.connected ? 'All Systems Operational' : 'Connection Issues Detected'}
              </p>
              <p className="text-xs text-gray-600">
                {apiStatus?.connected 
                  ? 'API connection stable, no errors detected'
                  : 'Unable to connect to Fyers API, please check credentials'
                }
              </p>
            </div>
            <span className="text-xs text-gray-500">
              {apiStatus?.lastUpdate ? getRelativeTime(apiStatus.lastUpdate) : 'Unknown'}
            </span>
          </div>

          {/* Recent Activity Log */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-green-400 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {logs?.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center space-x-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(log.type)}`}></div>
                  <span className="text-gray-600">{formatTime(log.timestamp)}</span>
                  <span className="text-gray-900">{log.message}</span>
                </div>
              )) || (
                <div className="text-sm text-gray-500">No recent activity</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
