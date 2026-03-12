import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ApiStatus } from "@shared/schema";

export function ApiStatistics() {
  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  const responseTimePercentage = Math.min((apiStatus?.responseTime || 0) / 100 * 100, 100);
  const successRatePercentage = apiStatus?.successRate || 0;
  const throughputValue = parseFloat(apiStatus?.throughput?.split(' ')[0] || '0');
  const throughputPercentage = Math.min(throughputValue / 5 * 100, 100); // Assuming max 5 MB/s

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900">API Statistics</h3>
        <p className="text-sm text-gray-600 mt-1">Real-time API performance metrics</p>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Response Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Average Response Time</span>
              <span className="text-sm text-gray-900">{apiStatus?.responseTime || 0}ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[hsl(122,39%,49%)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(responseTimePercentage, 5)}%` }}
              ></div>
            </div>
          </div>

          {/* Success Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
              <span className="text-sm text-gray-900">{apiStatus?.successRate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[hsl(122,39%,49%)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${successRatePercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Data Throughput */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Data Throughput</span>
              <span className="text-sm text-gray-900">{apiStatus?.throughput || '0 MB/s'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[hsl(207,90%,54%)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(throughputPercentage, 5)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{apiStatus?.activeSymbols || 0}</p>
            <p className="text-xs text-gray-600">Active Symbols</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{apiStatus?.updatesPerSec?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-600">Updates/sec</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{apiStatus?.uptime || 0}%</p>
            <p className="text-xs text-gray-600">Uptime</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{apiStatus?.latency || 0}ms</p>
            <p className="text-xs text-gray-600">Avg Latency</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
