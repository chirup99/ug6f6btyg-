import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  Clock,
  Target,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap,
  LineChart,
  PieChart,
  Filter,
  Download,
  Share2,
  Bookmark,
  Bell,
  X,
  ShoppingCart,
  Wallet,
  History,
  Plus,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface StrategyConfig {
  symbol: string;
  timeframe: string;
  indicators: {
    rsi: { enabled: boolean; period: number; oversold: number; overbought: number };
    ema: { enabled: boolean; period: number };
    sma: { enabled: boolean; period: number };
    macd: { enabled: boolean };
  };
  entryConditions: {
    priceAbove: string;
    priceBelow: string;
    rsiAbove: string;
    rsiBelow: string;
    volumeAbove: string;
  };
  exitConditions: {
    targetProfit: string;
    stopLoss: string;
    timeBasedExit: string;
  };
  backtestPeriod: {
    fromDate: string;
    toDate: string;
  };
}

interface Trade {
  id: string;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  pnl: number;
  pnlPercent: number;
  reason: string;
  duration: string;
}

interface BacktestResult {
  trades: Trade[];
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    totalPnLPercent: number;
    maxDrawdown: number;
    avgTradeReturn: number;
    sharpeRatio: number;
  };
  performance: {
    bestTrade: Trade | null;
    worstTrade: Trade | null;
    longestTrade: Trade | null;
    shortestTrade: Trade | null;
  };
}

interface OrderEntry {
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'DAY' | 'GTC' | 'IOC';
}

interface ActiveOrder {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: string;
  quantity: number;
  filledQuantity: number;
  price: number;
  status: 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';
  timestamp: string;
}

interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: 'LONG' | 'SHORT';
  timestamp: string;
}

interface OrderHistory {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: string;
  quantity: number;
  filledQuantity: number;
  price: number;
  filledPrice?: number;
  status: 'FILLED' | 'CANCELLED' | 'REJECTED';
  timestamp: string;
  completedAt: string;
}

const STOCK_SYMBOLS = [
  'NSE:TCS-EQ', 'NSE:INFY-EQ', 'NSE:RELIANCE-EQ', 'NSE:HDFCBANK-EQ',
  'NSE:ICICIBANK-EQ', 'NSE:KOTAKBANK-EQ', 'NSE:LT-EQ', 'NSE:SBIN-EQ',
  'NSE:ITC-EQ', 'NSE:HINDUNILVR-EQ', 'NSE:BHARTIARTL-EQ', 'NSE:BAJFINANCE-EQ'
];

const TIMEFRAMES = [
  { value: '1', label: '1M' },
  { value: '5', label: '5M' },
  { value: '15', label: '15M' },
  { value: '30', label: '30M' },
  { value: '60', label: '1H' },
  { value: 'D', label: '1D' }
];

export function StrategyBuilder() {
  const queryClient = useQueryClient();
  
  // Set default dates (last 30 days)
  const defaultToDate = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);

  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    symbol: 'NSE:TCS-EQ',
    timeframe: '5',
    indicators: {
      rsi: { enabled: true, period: 14, oversold: 30, overbought: 70 },
      ema: { enabled: true, period: 20 },
      sma: { enabled: false, period: 50 },
      macd: { enabled: false }
    },
    entryConditions: {
      priceAbove: '',
      priceBelow: '',
      rsiAbove: '',
      rsiBelow: '30',
      volumeAbove: ''
    },
    exitConditions: {
      targetProfit: '2',
      stopLoss: '1',
      timeBasedExit: '60'
    },
    backtestPeriod: {
      fromDate: format(defaultFromDate, 'yyyy-MM-dd'),
      toDate: format(defaultToDate, 'yyyy-MM-dd')
    }
  });

  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestProgress, setBacktestProgress] = useState(0);

  // Trade Order Management State
  const [orderEntry, setOrderEntry] = useState<OrderEntry>({
    symbol: 'NSE:TCS-EQ',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 1,
    timeInForce: 'DAY'
  });

  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Live Strategy State
  const [isLiveStrategyRunning, setIsLiveStrategyRunning] = useState(false);
  const [livePerformance, setLivePerformance] = useState({
    totalTrades: 0,
    winningTrades: 0,
    totalPnL: 0,
    winRate: 0,
    runningTime: 0
  });
  const [strategySignals, setStrategySignals] = useState<{
    rsi?: number;
    ema?: number;
    sma?: number;
    signal?: 'BUY' | 'SELL' | 'HOLD';
    timestamp: string;
  }>({ timestamp: new Date().toISOString() });
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Run backtest mutation
  const backtestMutation = useMutation({
    mutationFn: async (config: StrategyConfig) => {
      const response = await apiRequest({
        url: '/api/strategy-backtest',
        method: 'POST',
        body: config
      });
      return response;
    },
    onMutate: () => {
      setIsBacktesting(true);
      setBacktestProgress(0);
    },
    onSuccess: (data) => {
      setIsBacktesting(false);
      setBacktestProgress(100);
    },
    onError: (error) => {
      setIsBacktesting(false);
      setBacktestProgress(0);
      console.error('Backtest failed:', error);
    }
  });

  // Simulate progress during backtesting
  useEffect(() => {
    if (isBacktesting) {
      const interval = setInterval(() => {
        setBacktestProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isBacktesting]);

  // Sync order entry symbol with strategy config
  useEffect(() => {
    setOrderEntry(prev => ({ ...prev, symbol: strategyConfig.symbol }));
  }, [strategyConfig.symbol]);

  // Simulate current price updates
  useEffect(() => {
    const basePrice = 1000 + Math.random() * 3000; // Random base price between 1000-4000
    setCurrentPrice(basePrice);
    
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 20; // ±10 price change
        return Math.max(100, prev + change); // Minimum price of 100
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [strategyConfig.symbol]);

  // Live Strategy Execution Loop
  useEffect(() => {
    if (!isLiveStrategyRunning) return;
    
    const executeStrategy = async () => {
      try {
        // Fetch live 1-minute data
        const liveData = await fetchLiveData();
        
        if (liveData.length > 20) {
          // Calculate technical indicators
          const indicators = calculateIndicators(liveData);
          
          // Update strategy signals display
          setStrategySignals({
            rsi: indicators.rsi,
            ema: indicators.ema,
            sma: indicators.sma,
            signal: evaluateStrategySignal(indicators, currentPrice),
            timestamp: new Date().toISOString()
          });
          
          // Execute trading signal if strategy conditions are met
          const signal = evaluateStrategySignal(indicators, currentPrice);
          if (signal !== 'HOLD') {
            await executeStrategySignal(signal);
          }
        }
      } catch (error) {
        console.error('Live strategy execution error:', error);
      }
    };
    
    // Execute strategy immediately and then every 30 seconds
    executeStrategy();
    const interval = setInterval(executeStrategy, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [isLiveStrategyRunning, strategyConfig]);

  // Update live performance tracking
  useEffect(() => {
    if (!isLiveStrategyRunning) return;
    
    const updatePerformance = () => {
      const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0) + 
                      orderHistory.reduce((sum, order) => {
                        if (order.status === 'FILLED' && order.filledPrice) {
                          const pnl = order.side === 'BUY' 
                            ? (currentPrice - order.filledPrice) * order.filledQuantity
                            : (order.filledPrice - currentPrice) * order.filledQuantity;
                          return sum + pnl;
                        }
                        return sum;
                      }, 0);
      
      const completedTrades = orderHistory.filter(order => order.status === 'FILLED').length;
      const winningTrades = orderHistory.filter(order => {
        if (order.status === 'FILLED' && order.filledPrice) {
          const pnl = order.side === 'BUY' 
            ? (currentPrice - order.filledPrice) * order.filledQuantity
            : (order.filledPrice - currentPrice) * order.filledQuantity;
          return pnl > 0;
        }
        return false;
      }).length;
      
      setLivePerformance(prev => ({
        ...prev,
        totalPnL,
        winningTrades,
        winRate: completedTrades > 0 ? (winningTrades / completedTrades) * 100 : 0
      }));
    };
    
    const interval = setInterval(updatePerformance, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [isLiveStrategyRunning, positions, orderHistory, currentPrice]);

  const handleRunBacktest = () => {
    backtestMutation.mutate(strategyConfig);
  };

  const updateStrategyConfig = (section: keyof StrategyConfig, updates: any) => {
    setStrategyConfig(prev => {
      const currentSection = prev[section];
      const newSection = typeof updates === 'function' ? updates(currentSection) : 
        (typeof currentSection === 'object' && currentSection !== null) 
          ? { ...currentSection, ...updates } 
          : updates;
      
      return {
        ...prev,
        [section]: newSection
      };
    });
  };

  // Order Management Functions
  const placeOrder = async () => {
    try {
      const orderId = `ORD_${Date.now()}`;
      const newOrder: ActiveOrder = {
        orderId,
        symbol: orderEntry.symbol,
        side: orderEntry.side,
        orderType: orderEntry.orderType,
        quantity: orderEntry.quantity,
        filledQuantity: 0,
        price: orderEntry.price || currentPrice,
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };
      
      setActiveOrders(prev => [...prev, newOrder]);
      
      // Simulate order execution for market orders
      if (orderEntry.orderType === 'MARKET') {
        setTimeout(() => {
          setActiveOrders(prev => prev.filter(order => order.orderId !== orderId));
          
          const historyOrder: OrderHistory = {
            ...newOrder,
            status: 'FILLED',
            filledQuantity: orderEntry.quantity,
            filledPrice: currentPrice,
            completedAt: new Date().toISOString()
          };
          
          setOrderHistory(prev => [historyOrder, ...prev]);
          
          // Update positions
          updatePosition(orderEntry.symbol, orderEntry.side, orderEntry.quantity, currentPrice);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  const cancelOrder = (orderId: string) => {
    const order = activeOrders.find(o => o.orderId === orderId);
    if (order) {
      setActiveOrders(prev => prev.filter(o => o.orderId !== orderId));
      
      const historyOrder: OrderHistory = {
        ...order,
        status: 'CANCELLED',
        filledQuantity: order.filledQuantity,
        completedAt: new Date().toISOString()
      };
      
      setOrderHistory(prev => [historyOrder, ...prev]);
    }
  };

  const updatePosition = (symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number) => {
    setPositions(prev => {
      const existingPosition = prev.find(p => p.symbol === symbol);
      
      if (existingPosition) {
        const newQuantity = side === 'BUY' 
          ? existingPosition.quantity + quantity 
          : existingPosition.quantity - quantity;
          
        if (newQuantity === 0) {
          return prev.filter(p => p.symbol !== symbol);
        }
        
        const totalValue = (existingPosition.averagePrice * existingPosition.quantity) + 
                          (side === 'BUY' ? price * quantity : -price * quantity);
        const newAveragePrice = totalValue / newQuantity;
        
        return prev.map(p => p.symbol === symbol ? {
          ...p,
          quantity: newQuantity,
          averagePrice: newAveragePrice,
          side: newQuantity > 0 ? 'LONG' : 'SHORT',
          unrealizedPnL: (currentPrice - newAveragePrice) * newQuantity,
          unrealizedPnLPercent: ((currentPrice - newAveragePrice) / newAveragePrice) * 100
        } : p);
      } else {
        const newPosition: Position = {
          symbol,
          quantity: side === 'BUY' ? quantity : -quantity,
          averagePrice: price,
          currentPrice,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          side: side === 'BUY' ? 'LONG' : 'SHORT',
          timestamp: new Date().toISOString()
        };
        
        return [...prev, newPosition];
      }
    });
  };

  // Live Strategy Engine Functions
  const fetchLiveData = async () => {
    try {
      // Get real-time 1-minute data from your Fyers API
      const response = await apiRequest({
        url: `/api/stock-chart-data/${strategyConfig.symbol.replace('NSE:', '').replace('-EQ', '')}`,
        method: 'GET',
        params: { timeframe: '1D' } // Get 1-minute intraday data
      });
      
      if (response && Array.isArray(response) && response.length > 0) {
        setHistoricalData(response);
        
        // Get latest price
        const latestCandle = response[response.length - 1];
        const latestPrice = latestCandle.close || latestCandle.price;
        setCurrentPrice(latestPrice);
        
        return response;
      }
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    }
    return [];
  };

  const calculateIndicators = (data: any[]) => {
    if (data.length < 20) return {};
    
    const closes = data.map(candle => candle.close || candle.price);
    const indicators: any = {};
    
    // Calculate RSI
    if (strategyConfig.indicators.rsi.enabled) {
      const rsiPeriod = strategyConfig.indicators.rsi.period;
      const rsi = calculateRSI(closes, rsiPeriod);
      indicators.rsi = rsi[rsi.length - 1];
    }
    
    // Calculate EMA
    if (strategyConfig.indicators.ema.enabled) {
      const emaPeriod = strategyConfig.indicators.ema.period;
      const ema = calculateEMA(closes, emaPeriod);
      indicators.ema = ema[ema.length - 1];
    }
    
    // Calculate SMA
    if (strategyConfig.indicators.sma.enabled) {
      const smaPeriod = strategyConfig.indicators.sma.period;
      const sma = calculateSMA(closes, smaPeriod);
      indicators.sma = sma[sma.length - 1];
    }
    
    return indicators;
  };

  const calculateRSI = (prices: number[], period: number): number[] => {
    const rsi = [];
    for (let i = period; i < prices.length; i++) {
      let gains = 0;
      let losses = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const change = prices[j] - prices[j - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
  };

  const calculateEMA = (prices: number[], period: number): number[] => {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);
    
    // Calculate subsequent EMAs
    for (let i = period; i < prices.length; i++) {
      const emaValue = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(emaValue);
    }
    return ema;
  };

  const calculateSMA = (prices: number[], period: number): number[] => {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      sma.push(sum / period);
    }
    return sma;
  };

  const evaluateStrategySignal = (indicators: any, currentPrice: number): 'BUY' | 'SELL' | 'HOLD' => {
    // RSI-based entry signals
    if (indicators.rsi !== undefined) {
      const rsiOversold = strategyConfig.indicators.rsi.oversold || 30;
      const rsiOverbought = strategyConfig.indicators.rsi.overbought || 70;
      
      if (indicators.rsi < rsiOversold) {
        return 'BUY'; // Oversold condition
      }
      if (indicators.rsi > rsiOverbought) {
        return 'SELL'; // Overbought condition
      }
    }
    
    // EMA crossover signals
    if (indicators.ema && indicators.sma && strategyConfig.indicators.ema.enabled && strategyConfig.indicators.sma.enabled) {
      if (currentPrice > indicators.ema && indicators.ema > indicators.sma) {
        return 'BUY'; // Uptrend
      }
      if (currentPrice < indicators.ema && indicators.ema < indicators.sma) {
        return 'SELL'; // Downtrend
      }
    }
    
    return 'HOLD';
  };

  const executeStrategySignal = async (signal: 'BUY' | 'SELL') => {
    if (signal === 'HOLD') return;
    
    // Auto-place order based on strategy signal
    const autoOrder: OrderEntry = {
      symbol: strategyConfig.symbol,
      side: signal,
      orderType: 'MARKET',
      quantity: 1, // Default quantity
      timeInForce: 'DAY'
    };
    
    setOrderEntry(autoOrder);
    await placeOrder();
    
    // Update live performance
    setLivePerformance(prev => ({
      ...prev,
      totalTrades: prev.totalTrades + 1
    }));
  };

  const startLiveStrategy = async () => {
    setIsLiveStrategyRunning(true);
    setLivePerformance({
      totalTrades: 0,
      winningTrades: 0,
      totalPnL: 0,
      winRate: 0,
      runningTime: 0
    });
  };

  const stopLiveStrategy = () => {
    setIsLiveStrategyRunning(false);
  };

  const backtestResult: BacktestResult | null = backtestMutation.data as BacktestResult || null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-muted to-background">
      {/* Header Section */}
      <div className="bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Strategy Builder</h1>
                <p className="text-muted-foreground">Build, backtest & deploy trading strategies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                onClick={handleRunBacktest}
                disabled={isBacktesting}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6"
              >
                {isBacktesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Backtest
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          {isBacktesting && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Running backtest...</span>
                <span>{Math.round(backtestProgress)}%</span>
              </div>
              <Progress value={backtestProgress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Strategy Configuration */}
          <div className="col-span-4 space-y-6">
            {/* Market Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  Market Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Stock Symbol</Label>
                  <Select value={strategyConfig.symbol} onValueChange={(value) => updateStrategyConfig('symbol', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_SYMBOLS.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol.replace('NSE:', '').replace('-EQ', '')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Timeframe</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {TIMEFRAMES.map((tf) => (
                      <Button
                        key={tf.value}
                        variant={strategyConfig.timeframe === tf.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStrategyConfig('timeframe', tf.value)}
                        className={`text-xs ${
                          strategyConfig.timeframe === tf.value 
                            ? "bg-orange-600 text-white hover:bg-orange-700" 
                            : ""
                        }`}
                      >
                        {tf.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Indicators */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-500" />
                  Technical Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* RSI */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={strategyConfig.indicators.rsi.enabled}
                      onCheckedChange={(checked) => updateStrategyConfig('indicators', (prev: any) => ({
                        ...prev,
                        rsi: { ...prev.rsi, enabled: checked }
                      }))}
                    />
                    <div>
                      <p className="font-medium text-sm">RSI</p>
                      <p className="text-muted-foreground text-xs">Relative Strength Index</p>
                    </div>
                  </div>
                  {strategyConfig.indicators.rsi.enabled && (
                    <Input
                      type="number"
                      value={strategyConfig.indicators.rsi.period}
                      onChange={(e) => updateStrategyConfig('indicators', (prev: any) => ({
                        ...prev,
                        rsi: { ...prev.rsi, period: parseInt(e.target.value) }
                      }))}
                      className="w-16 h-8 text-center"
                      placeholder="14"
                    />
                  )}
                </div>

                {/* EMA */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={strategyConfig.indicators.ema.enabled}
                      onCheckedChange={(checked) => updateStrategyConfig('indicators', (prev: any) => ({
                        ...prev,
                        ema: { ...prev.ema, enabled: checked }
                      }))}
                    />
                    <div>
                      <p className="font-medium text-sm">EMA</p>
                      <p className="text-muted-foreground text-xs">Exponential Moving Average</p>
                    </div>
                  </div>
                  {strategyConfig.indicators.ema.enabled && (
                    <Input
                      type="number"
                      value={strategyConfig.indicators.ema.period}
                      onChange={(e) => updateStrategyConfig('indicators', (prev: any) => ({
                        ...prev,
                        ema: { ...prev.ema, period: parseInt(e.target.value) }
                      }))}
                      className="w-16 h-8 text-center"
                      placeholder="20"
                    />
                  )}
                </div>

                {/* SMA */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={strategyConfig.indicators.sma.enabled}
                      onCheckedChange={(checked) => updateStrategyConfig('indicators', (prev: any) => ({
                        ...prev,
                        sma: { ...prev.sma, enabled: checked }
                      }))}
                    />
                    <div>
                      <p className="font-medium text-sm">SMA</p>
                      <p className="text-muted-foreground text-xs">Simple Moving Average</p>
                    </div>
                  </div>
                  {strategyConfig.indicators.sma.enabled && (
                    <Input
                      type="number"
                      value={strategyConfig.indicators.sma.period}
                      onChange={(e) => updateStrategyConfig('indicators', (prev: any) => ({
                        ...prev,
                        sma: { ...prev.sma, period: parseInt(e.target.value) }
                      }))}
                      className="w-16 h-8 text-center"
                      placeholder="50"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Entry & Exit Rules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Trading Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Entry Conditions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="RSI Below"
                      value={strategyConfig.entryConditions.rsiBelow}
                      onChange={(e) => updateStrategyConfig('entryConditions', { rsiBelow: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Volume Above"
                      value={strategyConfig.entryConditions.volumeAbove}
                      onChange={(e) => updateStrategyConfig('entryConditions', { volumeAbove: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Exit Conditions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="Target %"
                      value={strategyConfig.exitConditions.targetProfit}
                      onChange={(e) => updateStrategyConfig('exitConditions', { targetProfit: e.target.value })}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Stop Loss %"
                      value={strategyConfig.exitConditions.stopLoss}
                      onChange={(e) => updateStrategyConfig('exitConditions', { stopLoss: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Backtest Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">From Date</Label>
                  <Input
                    type="date"
                    value={strategyConfig.backtestPeriod.fromDate}
                    onChange={(e) => updateStrategyConfig('backtestPeriod', { fromDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">To Date</Label>
                  <Input
                    type="date"
                    value={strategyConfig.backtestPeriod.toDate}
                    onChange={(e) => updateStrategyConfig('backtestPeriod', { toDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Results & Charts */}
          <div className="col-span-5 space-y-6">
            {/* Performance Metrics */}
            {backtestResult && (
              <div className="grid grid-cols-4 gap-4">
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">Total P&L</p>
                        <p className="text-2xl font-bold text-foreground">
                          ₹{backtestResult.summary.totalPnL?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Win Rate</p>
                        <p className="text-2xl font-bold text-foreground">
                          {backtestResult.summary.winRate?.toFixed(1) || '0'}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Total Trades</p>
                        <p className="text-2xl font-bold text-foreground">
                          {backtestResult.summary.totalTrades || '0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 dark:border-orange-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Max Drawdown</p>
                        <p className="text-2xl font-bold text-foreground">
                          {backtestResult.summary.maxDrawdown?.toFixed(2) || '0'}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Equity Curve Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Equity Curve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {backtestResult ? "Equity curve visualization" : "Run backtest to see equity curve"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Performance */}
            {backtestResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Trade Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Win/Loss Distribution</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground">Winning Trades</span>
                          <span className="text-green-600 dark:text-green-400">{backtestResult.summary.winningTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground">Losing Trades</span>
                          <span className="text-red-600 dark:text-red-400">{backtestResult.summary.losingTrades}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Performance Metrics</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-foreground">Sharpe Ratio</span>
                          <span className="text-foreground">{backtestResult.summary.sharpeRatio?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground">Avg Return</span>
                          <span className="text-foreground">{backtestResult.summary.avgTradeReturn?.toFixed(2) || 'N/A'}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Trade Order Windows */}
          <div className="col-span-3 space-y-6">
            {/* Live Strategy Control Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  Live Strategy Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={startLiveStrategy}
                    disabled={isLiveStrategyRunning}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-start-live-strategy"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Live Strategy
                  </Button>
                  <Button
                    onClick={stopLiveStrategy}
                    disabled={!isLiveStrategyRunning}
                    variant="destructive"
                    className="flex-1"
                    data-testid="button-stop-live-strategy"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Strategy
                  </Button>
                </div>

                {/* Live Strategy Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${isLiveStrategyRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isLiveStrategyRunning ? 'Running' : 'Stopped'}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-3 w-3 text-blue-500" />
                      <span className="text-sm font-medium">Signal</span>
                    </div>
                    <p className={`text-xs font-medium ${
                      strategySignals.signal === 'BUY' ? 'text-green-600' :
                      strategySignals.signal === 'SELL' ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {strategySignals.signal || 'HOLD'}
                    </p>
                  </div>
                </div>

                {/* Live Performance Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-muted/20 rounded">
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-sm font-bold">{livePerformance.totalTrades}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded">
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="text-sm font-bold">{livePerformance.winRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded col-span-2">
                    <p className="text-xs text-muted-foreground">Live P&L</p>
                    <p className={`text-sm font-bold ${livePerformance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{livePerformance.totalPnL.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Strategy Signals Display */}
                {isLiveStrategyRunning && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Live Indicators</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {strategySignals.rsi && (
                        <div className="text-center p-1 bg-muted/20 rounded">
                          <p className="text-muted-foreground">RSI</p>
                          <p className="font-medium">{strategySignals.rsi.toFixed(1)}</p>
                        </div>
                      )}
                      {strategySignals.ema && (
                        <div className="text-center p-1 bg-muted/20 rounded">
                          <p className="text-muted-foreground">EMA</p>
                          <p className="font-medium">₹{strategySignals.ema.toFixed(0)}</p>
                        </div>
                      )}
                      {strategySignals.sma && (
                        <div className="text-center p-1 bg-muted/20 rounded">
                          <p className="text-muted-foreground">SMA</p>
                          <p className="font-medium">₹{strategySignals.sma.toFixed(0)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Price Display */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-xl font-bold">₹{currentPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Symbol</p>
                    <p className="text-sm font-medium">{strategyConfig.symbol.replace('NSE:', '').replace('-EQ', '')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Order Windows */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                    Trade Orders
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    data-testid="button-import-trades"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="entry" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="entry" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Entry
                    </TabsTrigger>
                    <TabsTrigger value="active" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Active
                    </TabsTrigger>
                    <TabsTrigger value="positions" className="text-xs">
                      <Wallet className="h-3 w-3 mr-1" />
                      Positions
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">
                      <History className="h-3 w-3 mr-1" />
                      History
                    </TabsTrigger>
                  </TabsList>

                  {/* Order Entry Tab */}
                  <TabsContent value="entry" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={orderEntry.side === 'BUY' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOrderEntry(prev => ({ ...prev, side: 'BUY' }))}
                        className={orderEntry.side === 'BUY' ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        data-testid="button-buy"
                      >
                        BUY
                      </Button>
                      <Button
                        variant={orderEntry.side === 'SELL' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOrderEntry(prev => ({ ...prev, side: 'SELL' }))}
                        className={orderEntry.side === 'SELL' ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                        data-testid="button-sell"
                      >
                        SELL
                      </Button>
                    </div>

                    <div>
                      <Label className="text-xs">Order Type</Label>
                      <Select value={orderEntry.orderType} onValueChange={(value: any) => setOrderEntry(prev => ({ ...prev, orderType: value }))}>
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKET">Market</SelectItem>
                          <SelectItem value="LIMIT">Limit</SelectItem>
                          <SelectItem value="STOP">Stop</SelectItem>
                          <SelectItem value="STOP_LIMIT">Stop Limit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={orderEntry.quantity}
                        onChange={(e) => setOrderEntry(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        className="mt-1 h-8"
                        placeholder="1"
                        data-testid="input-quantity"
                      />
                    </div>

                    {(orderEntry.orderType === 'LIMIT' || orderEntry.orderType === 'STOP_LIMIT') && (
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          value={orderEntry.price || ''}
                          onChange={(e) => setOrderEntry(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                          className="mt-1 h-8"
                          placeholder={currentPrice.toFixed(2)}
                          data-testid="input-price"
                        />
                      </div>
                    )}

                    {(orderEntry.orderType === 'STOP' || orderEntry.orderType === 'STOP_LIMIT') && (
                      <div>
                        <Label className="text-xs">Stop Price</Label>
                        <Input
                          type="number"
                          value={orderEntry.stopPrice || ''}
                          onChange={(e) => setOrderEntry(prev => ({ ...prev, stopPrice: parseFloat(e.target.value) }))}
                          className="mt-1 h-8"
                          placeholder={currentPrice.toFixed(2)}
                          data-testid="input-stop-price"
                        />
                      </div>
                    )}

                    <Button
                      onClick={placeOrder}
                      className={`w-full h-8 ${orderEntry.side === 'BUY' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'} text-white`}
                      disabled={!orderEntry.quantity}
                      data-testid="button-place-order"
                    >
                      Place {orderEntry.side} Order
                    </Button>
                  </TabsContent>

                  {/* Active Orders Tab */}
                  <TabsContent value="active" className="mt-4">
                    <ScrollArea className="h-48">
                      {activeOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No active orders</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeOrders.map((order) => (
                            <div key={order.orderId} className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant={order.side === 'BUY' ? "default" : "destructive"} className="text-xs">
                                  {order.side}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => cancelOrder(order.orderId)}
                                  className="h-6 w-6 p-0"
                                  data-testid={`button-cancel-${order.orderId}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Qty: {order.quantity} @ ₹{order.price.toFixed(2)}</div>
                                <div>Status: {order.status}</div>
                                <div>{format(new Date(order.timestamp), 'MMM dd, HH:mm')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Positions Tab */}
                  <TabsContent value="positions" className="mt-4">
                    <ScrollArea className="h-48">
                      {positions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wallet className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No open positions</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {positions.map((position, index) => (
                            <div key={index} className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant={position.side === 'LONG' ? "default" : "destructive"} className="text-xs">
                                  {position.side}
                                </Badge>
                                <span className={`text-sm font-medium ${position.unrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {position.unrealizedPnL >= 0 ? '+' : ''}₹{position.unrealizedPnL.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Qty: {Math.abs(position.quantity)} @ ₹{position.averagePrice.toFixed(2)}</div>
                                <div>Current: ₹{currentPrice.toFixed(2)}</div>
                                <div>P&L%: {position.unrealizedPnLPercent.toFixed(2)}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Order History Tab */}
                  <TabsContent value="history" className="mt-4">
                    <ScrollArea className="h-48">
                      {orderHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No order history</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {orderHistory.map((order) => (
                            <div key={order.orderId} className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge 
                                  variant={order.status === 'FILLED' ? "default" : "secondary"} 
                                  className="text-xs"
                                >
                                  {order.status}
                                </Badge>
                                <Badge variant={order.side === 'BUY' ? "outline" : "destructive"} className="text-xs">
                                  {order.side}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Qty: {order.filledQuantity}/{order.quantity}</div>
                                <div>Price: ₹{(order.filledPrice || order.price).toFixed(2)}</div>
                                <div>{format(new Date(order.completedAt), 'MMM dd, HH:mm')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-8"
                  data-testid="button-export-results"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-8"
                  data-testid="button-set-alerts"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Set Alerts
                </Button>
                <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white h-8"
                  data-testid="button-deploy-live"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Deploy Live
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}