import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { AuthButton } from "@/components/auth-button";
import { ConnectionStatus } from "@/components/connection-status";
import { ApiStatistics } from "@/components/api-statistics";
import { ErrorPanel } from "@/components/error-panel";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { AdvancedCandlestickChart } from "@/components/advanced-candlestick-chart";
import { EnhancedTradingViewWidget } from "@/components/enhanced-tradingview-widget";
import { TradingViewStyleChart } from "@/components/tradingview-style-chart";
import { IndicatorCrossingsDisplay } from "@/components/indicator-crossings-display";
import { BattuScanSimulation } from "@/components/battu-scan-simulation";
import { FourCandleRuleScanner } from "@/components/four-candle-rule-scanner";
import NeoFeedSocialFeed from "@/components/neofeed-social-feed";
import SimpleCompleteScanner from "@/components/simple-complete-scanner";
import { BattuDocumentationDisplay } from "@/components/battu-documentation-display";
import { StrategyBuilder } from "@/components/strategy-builder";
import { TradingMaster } from "@/components/trading-master";
import { useTheme } from "@/components/theme-provider";

import ThreeCycleScanner from "@/components/three-cycle-scanner";
import HistoricalTradeSimulator from "@/components/historical-trade-simulator";
import { 
  PriceChangeAnimation, 
  TradeExecutionAnimation, 
  VolumeSpikeAnimation, 
  MarketStatusPulse, 
  ProfitLossAnimation, 
  CandlestickAnimation,
  MarketDataSkeleton 
} from "@/components/micro-animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricalDataStatus } from "@/components/historical-data-status";
import { MonthlyProgressTracker } from "@/components/monthly-progress-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Activity, Calendar, BarChart3, Play, Pause, RotateCcw, DollarSign, Zap, Newspaper, Sun, Moon, GraduationCap, Download, Mic, MessageCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

function NiftyIndex() {
  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['/api/market-data'],
    refetchInterval: 3000, // Refresh every 3 seconds for live data
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading data</div>
        </CardContent>
      </Card>
    );
  }

  // Find NIFTY50 data from the response
  const niftyData = Array.isArray(marketData) ? marketData.find((item: any) => item.symbol === 'NIFTY50') : null;
  
  if (!niftyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div>NIFTY data not available</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = niftyData.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "text-green-600" : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {niftyData.name}
        </CardTitle>
        <CardDescription>Live streaming data from NSE</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">
              {niftyData.ltp?.toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              }) || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Last Traded Price</div>
          </div>
          <div className={`text-right ${trendColor}`}>
            <div className="flex items-center justify-end gap-1">
              <TrendIcon className="h-4 w-4" />
              <span className="text-lg font-semibold">
                {isPositive ? '+' : ''}{niftyData.change?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="text-sm">
              ({isPositive ? '+' : ''}{niftyData.changePercent?.toFixed(2) || 'N/A'}%)
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500">
            Last Updated: {new Date(niftyData.lastUpdate).toLocaleTimeString()}
          </div>
          <div className="text-xs text-gray-500">
            Code: {niftyData.code}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">CB Connect</h1>
            <p className="text-muted-foreground">
              Fyers API Dashboard - Real-time trading data and advanced analytics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <AuthButton />
          </div>
        </div>

        {/* Status Cards - Split into 2 rows */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ConnectionStatus />
          <ApiStatistics />
          <NiftyIndex />
          <HistoricalDataStatus />
        </div>

        {/* Angel One Live Trading Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-full min-h-[300px] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Angel One integration ready</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-full min-h-[300px]"></div>
        </div>
        
        {/* Portfolio and Additional Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹2,45,000</div>
              <p className="text-xs text-muted-foreground">+2.5% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Error Panel */}
        <ErrorPanel />

        {/* Main Content Area */}
        <div className="space-y-6">
          <TradingViewStyleChart />
          <IndicatorCrossingsDisplay />
          
          {/* Progress and Data Windows Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyProgressTracker />
          </div>
        </div>
      </div>
    </div>
  );
}