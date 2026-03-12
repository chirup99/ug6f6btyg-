import { useQuery, useMutation } from "@tanstack/react-query";
import { BarChart3, University, Building2, Laptop, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MarketData, ApiStatus } from "@shared/schema";

const getSymbolIcon = (symbol: string) => {
  switch (symbol) {
    case 'NIFTY50':
      return BarChart3;
    case 'BANKNIFTY':
      return University;
    case 'RELIANCE':
      return Building2;
    case 'TCS':
      return Laptop;
    default:
      return BarChart3;
  }
};

export function MarketDataDisplay() {
  const { data: marketData, isLoading, error } = useQuery<MarketData[]>({
    queryKey: ["/api/market-data"],
    refetchInterval: 700, // 700ms streaming interval for real-time updates
    retry: false, // Don't retry failed requests to avoid fake data
  });
  
  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/market-data/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/market-data"] });
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader className="border-b border-red-200 pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-red-700">Live Market Data Unavailable</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-red-600">Offline</span>
            </div>
          </div>
          <p className="text-sm text-red-600 mt-1">Authentication required for live streaming</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Please authenticate with Fyers API to access real-time market data
            </p>
            <Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/market-data"] })}
            >
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Market Data</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(122,39%,49%)] animate-pulse"></div>
            <span className="text-xs text-gray-600">Live Streaming</span>
            <span className="text-xs text-gray-500">• 700ms</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">Real-time prices from Fyers API v3</p>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          {marketData?.map((symbol) => {
            const IconComponent = getSymbolIcon(symbol.symbol);
            const isPositive = (symbol.change || 0) >= 0;
            
            return (
              <div
                key={symbol.symbol}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[hsl(207,90%,54%)]/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="text-[hsl(207,90%,54%)]" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{symbol.name}</p>
                    <p className="text-xs text-gray-600">{symbol.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {symbol.ltp.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                  <p className={`text-xs flex items-center ${
                    isPositive ? 'text-[hsl(122,39%,49%)]' : 'text-[hsl(0,84%,60%)]'
                  }`}>
                    {isPositive ? '↗' : '↘'}
                    <span className="ml-1">
                      {isPositive ? '+' : ''}
                      {(symbol.change || 0).toFixed(2)} ({(symbol.changePercent || 0).toFixed(2)}%)
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full border-[hsl(207,90%,54%)] text-[hsl(207,90%,54%)] hover:bg-[hsl(207,90%,54%)]/10"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add More Symbols
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
