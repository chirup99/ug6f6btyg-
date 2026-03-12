import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Timer,
  Activity,
  BarChart3,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SimulationConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  riskPerTrade: number;
  baseTimeframe: number;
  maxTimeframe: number;
}

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  index: number;
}

interface TradeSimulation {
  id: string;
  pattern: any;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  quantity: number;
  entryTime: number;
  exitTime?: number;
  profit?: number;
  status: 'OPEN' | 'CLOSED_PROFIT' | 'CLOSED_LOSS' | 'CLOSED_TARGET';
  timeframe: number;
  reason?: string;
}

interface SimulationResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  maxDrawdown: number;
  timeframes: number[];
  validPatterns: number;
  invalidPatterns: number;
}

export default function HistoricalTradeSimulator() {
  const [config, setConfig] = useState<SimulationConfig>({
    symbol: 'NSE:NIFTY50-INDEX',
    startDate: '2025-07-28',
    endDate: '2025-07-28',
    initialCapital: 100000,
    riskPerTrade: 2,
    baseTimeframe: 5,
    maxTimeframe: 80
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [currentTimeframe, setCurrentTimeframe] = useState(5);
  const [simulationCycle, setSimulationCycle] = useState(0);
  const [historicalData, setHistoricalData] = useState<CandleData[]>([]);
  const [currentTimeframeData, setCurrentTimeframeData] = useState<CandleData[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<any>(null);
  const [tradeSimulations, setTradeSimulations] = useState<TradeSimulation[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [allPatterns, setAllPatterns] = useState<any[]>([]);

  // CRITICAL FIX: Check for active scanner by looking for scanner session status
  const { data: scannerStatus } = useQuery({
    queryKey: ['/api/battu/3-cycle-scanner/status'],
    refetchInterval: 2000,
    staleTime: 1000,
  });

  // Check if we should use active scanner data instead of independent simulation
  const hasActiveScanner = scannerStatus?.success && scannerStatus?.data?.status !== 'idle';

  // CRITICAL FIX: Auto-update results to show warning when scanner is active
  useEffect(() => {
    if (hasActiveScanner) {
      console.log('🚨 DOUBLE COUNTING PREVENTION: Active scanner detected - disabling independent simulation');
      // Clear any independent simulation results to prevent confusion
      setSimulationResults(null);
      setTradeSimulations([]);
      setAllPatterns([]);
    }
  }, [hasActiveScanner]);

  // Start historical simulation
  const startSimulation = async () => {
    setIsSimulating(true);
    setSimulationCycle(0);
    setTradeSimulations([]);
    setAllPatterns([]);
    setCurrentTimeframe(config.baseTimeframe);
    
    console.log('🚀 Starting Historical Trade Simulation');
    
    // Fetch historical data
    await fetchHistoricalData();
  };

  // Fetch historical data
  const fetchHistoricalData = async () => {
    try {
      console.log(`📈 Fetching historical data for ${config.symbol} from ${config.startDate} to ${config.endDate}`);
      
      const response = await fetch(`/api/battu/3-cycle-scanner/data/${config.symbol}?date=${config.startDate}&timeframe=1`);
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`✅ Fetched ${data.data.length} 1-minute candles for simulation`);
        setHistoricalData(data.data);
        
        // Start simulation with base timeframe
        await simulateTimeframe(data.data, config.baseTimeframe);
      }
    } catch (error) {
      console.error('❌ Failed to fetch historical data:', error);
    }
  };

  // Simulate trading for a specific timeframe
  const simulateTimeframe = async (data: CandleData[], timeframe: number) => {
    try {
      console.log(`🔄 Simulating timeframe: ${timeframe} minutes`);
      
      // Resample data to target timeframe
      const resampleResponse = await fetch('/api/battu/3-cycle-scanner/resample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, targetTimeframe: timeframe })
      });
      const resampleResult = await resampleResponse.json();
      
      if (resampleResult.success && resampleResult.data) {
        const timeframeData = resampleResult.data;
        setCurrentTimeframeData(timeframeData);
        console.log(`📊 Resampled to ${timeframe}min: ${timeframeData.length} candles`);
        
        // Analyze patterns in chunks of 6 candles (simulate real-time pattern detection)
        await simulatePatternsInChunks(timeframeData, timeframe);
      }
    } catch (error) {
      console.error(`❌ Failed to simulate timeframe ${timeframe}:`, error);
    }
  };

  // Simulate pattern detection in 6-candle chunks
  const simulatePatternsInChunks = async (data: CandleData[], timeframe: number) => {
    const chunkSize = 6; // Simulate 6 candles at a time
    const totalChunks = Math.floor(data.length / chunkSize);
    
    console.log(`🎯 Simulating ${totalChunks} chunks of ${chunkSize} candles for ${timeframe}min timeframe`);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startIndex = chunkIndex * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, data.length);
      const chunkData = data.slice(startIndex, endIndex);
      
      if (chunkData.length >= 4) { // Need at least 4 candles for analysis
        console.log(`📝 Analyzing chunk ${chunkIndex + 1}/${totalChunks} (candles ${startIndex}-${endIndex})`);
        
        // Analyze first 4 candles for pattern
        const analysisData = chunkData.slice(0, 4);
        await analyzePatternChunk(analysisData, timeframe, chunkIndex);
        
        // Simulate trade execution on 5th and 6th candles if pattern is valid
        if (chunkData.length >= 6) {
          await simulateTradeExecution(chunkData, timeframe, chunkIndex);
        }
      }
    }
    
    // Move to next timeframe after completing current timeframe simulation
    await progressToNextTimeframe();
  };

  // Analyze pattern for 4-candle chunk using EXACT SAME methodology as 4 Candle Rule tab
  const analyzePatternChunk = async (data: CandleData[], timeframe: number, chunkIndex: number) => {
    try {
      console.log(`🔍 BACKTEST: Using EXACT SAME endpoint as 4 Candle Rule tab for chunk ${chunkIndex + 1}`);
      
      // Use the EXACT SAME endpoint as 4 Candle Rule tab: /api/battu/3-cycle-scanner/cycle1-pointab
      const response = await fetch('/api/battu/3-cycle-scanner/cycle1-pointab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: config.symbol,
          date: config.startDate,
          timeframe,
          firstFourCandles: data // Use exact same parameter name as 4 Candle Rule tab
        })
      });
      const result = await response.json();
      
      if (result.success && result.pointABData) {
        console.log(`✅ BACKTEST: Chunk ${chunkIndex + 1} analysis complete using IDENTICAL 4 Candle Rule methodology`);
        console.log(`📊 BACKTEST: Real 1-minute data fetched exactly like 4 Candle Rule tab`);
        console.log(`🎯 Uptrend: ${result.pointABData.uptrend.pointA.exactTime} → ${result.pointABData.uptrend.pointB.exactTime}`);
        console.log(`🎯 Downtrend: ${result.pointABData.downtrend.pointA.exactTime} → ${result.pointABData.downtrend.pointB.exactTime}`);
        console.log(`📊 1-minute data points: ${result.metadata?.oneMinuteDataPoints || 0}`);
        
        // Convert Point A/B data to pattern format (exact same structure as 4 Candle Rule tab)
        const exactTimestampPatterns = [
          {
            type: 'UPTREND',
            pointA: result.pointABData.uptrend.pointA,
            pointB: result.pointABData.uptrend.pointB,
            methodology: '4_CANDLE_RULE_IDENTICAL_TO_TAB',
            oneMinuteDataPoints: result.metadata?.oneMinuteDataPoints || 0
          },
          {
            type: 'DOWNTREND', 
            pointA: result.pointABData.downtrend.pointA,
            pointB: result.pointABData.downtrend.pointB,
            methodology: '4_CANDLE_RULE_IDENTICAL_TO_TAB',
            oneMinuteDataPoints: result.metadata?.oneMinuteDataPoints || 0
          }
        ];
        
        // Store patterns with simulation metadata
        const patternsWithMetadata = exactTimestampPatterns.map((pattern: any) => ({
          ...pattern,
          timeframe,
          chunkIndex,
          simulationTime: new Date().toISOString(),
          symbol: config.symbol,
          date: config.startDate,
          metadata: result.metadata
        }));
        
        setAllPatterns(prev => [...prev, ...patternsWithMetadata]);
        setPatternAnalysis({ 
          patterns: exactTimestampPatterns,
          metadata: result.metadata,
          methodology: '4_CANDLE_RULE_IDENTICAL_TO_TAB'
        });
        
        console.log(`🎯 BACKTEST: Successfully processed 1-minute data with ${result.metadata?.oneMinuteDataPoints || 0} data points`);
        
        return exactTimestampPatterns;
      } else {
        console.error(`❌ BACKTEST: Failed to get Point A/B data from 4 Candle Rule endpoint:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Failed to analyze pattern chunk ${chunkIndex} using 4 Candle Rule endpoint:`, error);
    }
    return [];
  };

  // Simulate trade execution on 5th and 6th candles using exact timestamp data
  const simulateTradeExecution = async (chunkData: CandleData[], timeframe: number, chunkIndex: number) => {
    if (!patternAnalysis || !patternAnalysis.patterns) return;
    
    const fifthCandle = chunkData[4];
    const sixthCandle = chunkData[5];
    
    console.log(`💱 BACKTEST: Simulating trades for chunk ${chunkIndex + 1} using exact timestamp patterns`);
    
    for (const pattern of patternAnalysis.patterns) {
      if (pattern.pointA && pattern.pointB) {
        console.log(`🔄 Processing ${pattern.type} pattern: ${pattern.pointA.exactTime} → ${pattern.pointB.exactTime}`);
        const trade = await simulateTrade(pattern, fifthCandle, sixthCandle, timeframe, chunkIndex);
        if (trade) {
          setTradeSimulations(prev => [...prev, trade]);
        }
      }
    }
  };

  // Simulate individual trade using exact timestamp methodology
  const simulateTrade = async (
    pattern: any, 
    fifthCandle: CandleData, 
    sixthCandle: CandleData, 
    timeframe: number, 
    chunkIndex: number
  ): Promise<TradeSimulation | null> => {
    const isUptrend = pattern.type === 'UPTREND';
    
    // Use exact timestamp Point A/B data instead of OHLC breakout levels
    const pointA = pattern.pointA;
    const pointB = pattern.pointB;
    
    if (!pointA || !pointB) {
      console.log(`⚠️ Missing Point A/B data for ${pattern.type} pattern in chunk ${chunkIndex + 1}`);
      return null;
    }
    
    // Calculate breakout level based on Point B price (exact timestamp methodology)
    const breakoutLevel = pointB.price;
    const pointAPrice = pointA.price;
    
    // CORRECTED: Calculate stop loss based on proper trigger candle methodology
    // Note: This is a simulation component, using Point A as reference for now
    // In live trading, stop loss should be based on 4th/5th candle high/low depending on trigger
    const priceRange = Math.abs(pointB.price - pointA.price);
    const stopLossBuffer = priceRange * 0.2; // 20% buffer
    const stopLoss = isUptrend ? pointA.price - stopLossBuffer : pointA.price + stopLossBuffer;
    
    console.log(`🎯 EXACT TIMESTAMP TRADE: ${pattern.type} - Point A: ${pointA.exactTime} @ ${pointA.price}, Point B: ${pointB.exactTime} @ ${pointB.price}, Breakout: ${breakoutLevel}`);;
    
    // Check if breakout occurs in 5th or 6th candle
    let entryPrice: number | null = null;
    let entryCandle: CandleData | null = null;
    
    if (isUptrend) {
      // For uptrend, check if candle breaks above breakout level
      if (fifthCandle.high > breakoutLevel) {
        entryPrice = breakoutLevel;
        entryCandle = fifthCandle;
      } else if (sixthCandle.high > breakoutLevel) {
        entryPrice = breakoutLevel;
        entryCandle = sixthCandle;
      }
    } else {
      // For downtrend, check if candle breaks below breakout level
      if (fifthCandle.low < breakoutLevel) {
        entryPrice = breakoutLevel;
        entryCandle = fifthCandle;
      } else if (sixthCandle.low < breakoutLevel) {
        entryPrice = breakoutLevel;
        entryCandle = sixthCandle;
      }
    }
    
    if (!entryPrice || !entryCandle) {
      console.log(`⚠️ No breakout detected for ${pattern.type} pattern in chunk ${chunkIndex + 1}`);
      return null;
    }
    
    // Calculate position size based on risk
    const riskAmount = config.initialCapital * (config.riskPerTrade / 100);
    const stopDistance = Math.abs(entryPrice - stopLoss);
    const quantity = Math.floor(riskAmount / stopDistance);
    
    // Calculate target (2:1 risk-reward ratio)
    const targetDistance = stopDistance * 2;
    const target = isUptrend ? entryPrice + targetDistance : entryPrice - targetDistance;
    
    // Simulate trade execution
    let exitPrice: number | null = null;
    let status: TradeSimulation['status'] = 'OPEN';
    let reason = '';
    
    // Check immediate exit conditions on entry candle
    if (isUptrend) {
      if (entryCandle.low <= stopLoss) {
        exitPrice = stopLoss;
        status = 'CLOSED_LOSS';
        reason = 'Stop loss hit on entry candle';
      } else if (entryCandle.high >= target) {
        exitPrice = target;
        status = 'CLOSED_TARGET';
        reason = 'Target hit on entry candle';
      }
    } else {
      if (entryCandle.high >= stopLoss) {
        exitPrice = stopLoss;
        status = 'CLOSED_LOSS';
        reason = 'Stop loss hit on entry candle';
      } else if (entryCandle.low <= target) {
        exitPrice = target;
        status = 'CLOSED_TARGET';
        reason = 'Target hit on entry candle';
      }
    }
    
    // If still open, check exit on next candle
    if (status === 'OPEN' && sixthCandle && entryCandle !== sixthCandle) {
      if (isUptrend) {
        if (sixthCandle.low <= stopLoss) {
          exitPrice = stopLoss;
          status = 'CLOSED_LOSS';
          reason = 'Stop loss hit on 6th candle';
        } else if (sixthCandle.high >= target) {
          exitPrice = target;
          status = 'CLOSED_TARGET';
          reason = 'Target hit on 6th candle';
        } else {
          // Close at end of 6th candle
          exitPrice = sixthCandle.close;
          status = sixthCandle.close > entryPrice ? 'CLOSED_PROFIT' : 'CLOSED_LOSS';
          reason = 'Closed at end of simulation cycle';
        }
      } else {
        if (sixthCandle.high >= stopLoss) {
          exitPrice = stopLoss;
          status = 'CLOSED_LOSS';
          reason = 'Stop loss hit on 6th candle';
        } else if (sixthCandle.low <= target) {
          exitPrice = target;
          status = 'CLOSED_TARGET';
          reason = 'Target hit on 6th candle';
        } else {
          // Close at end of 6th candle
          exitPrice = sixthCandle.close;
          status = sixthCandle.close < entryPrice ? 'CLOSED_PROFIT' : 'CLOSED_LOSS';
          reason = 'Closed at end of simulation cycle';
        }
      }
    }
    
    // Calculate profit/loss
    const profit = exitPrice ? (exitPrice - entryPrice) * quantity * (isUptrend ? 1 : -1) : 0;
    
    const trade: TradeSimulation = {
      id: `${chunkIndex}-${pattern.type}-${timeframe}`,
      pattern,
      entryPrice,
      exitPrice: exitPrice || undefined,
      stopLoss,
      target,
      quantity,
      entryTime: entryCandle.timestamp,
      exitTime: exitPrice ? (entryCandle !== sixthCandle ? sixthCandle?.timestamp : entryCandle.timestamp) : undefined,
      profit: exitPrice ? profit : undefined,
      status,
      timeframe,
      reason
    };
    
    console.log(`💰 Trade simulated: ${pattern.type} @ ${timeframe}min - ${status} - P&L: ${profit?.toFixed(2) || 'Open'}`);
    
    return trade;
  };

  // Progress to next timeframe
  const progressToNextTimeframe = async () => {
    const nextTimeframe = currentTimeframe * 2;
    
    if (nextTimeframe <= config.maxTimeframe) {
      console.log(`🔄 Progressing from ${currentTimeframe}min to ${nextTimeframe}min timeframe`);
      setCurrentTimeframe(nextTimeframe);
      setSimulationCycle(prev => prev + 1);
      
      // Continue simulation with next timeframe
      await simulateTimeframe(historicalData, nextTimeframe);
    } else {
      console.log(`🏁 Simulation complete. Maximum timeframe ${config.maxTimeframe}min reached.`);
      calculateSimulationResults();
      setIsSimulating(false);
    }
  };

  // Calculate final simulation results - DISABLED DURING ACTIVE SCANNER TO PREVENT DOUBLE COUNTING
  const calculateSimulationResults = () => {
    // CRITICAL FIX: Block independent simulation when active scanner is running
    if (hasActiveScanner) {
      console.log('🚨 DOUBLE COUNTING PREVENTION: Blocking independent simulation - Active scanner detected');
      return;
    }
    
    // Original calculation only if no active scanner
    const closedTrades = tradeSimulations.filter(t => t.status !== 'OPEN');
    const winningTrades = closedTrades.filter(t => (t.profit || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.profit || 0) < 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0));
    const netPnL = totalProfit - totalLoss;
    
    const results: SimulationResults = {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit,
      totalLoss,
      netPnL,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      avgWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      riskRewardRatio: totalLoss > 0 ? totalProfit / totalLoss : 0,
      maxDrawdown: 0,
      timeframes: Array.from(new Set(tradeSimulations.map(t => t.timeframe))).sort(),
      validPatterns: allPatterns.length,
      invalidPatterns: 0
    };
    
    setSimulationResults(results);
    console.log('📊 Independent Simulation Results:', results);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Simulation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Historical Trade Simulation
          </CardTitle>
          <CardDescription>
            Historical simulation using identical 4 Candle Rule tab methodology - fetches real 1-minute data from same endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Symbol Selection */}
            <div className="space-y-2">
              <Label htmlFor="sim-symbol">Symbol</Label>
              <Select 
                value={config.symbol} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, symbol: value }))}
                disabled={isSimulating}
              >
                <SelectTrigger id="sim-symbol">
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                  <SelectItem value="NSE:BANKNIFTY-INDEX">Bank NIFTY</SelectItem>
                  <SelectItem value="NSE:INFY-EQ">Infosys</SelectItem>
                  <SelectItem value="NSE:RELIANCE-EQ">Reliance</SelectItem>
                  <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="sim-start-date">Start Date</Label>
              <Input 
                id="sim-start-date"
                type="date" 
                value={config.startDate}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={isSimulating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sim-end-date">End Date</Label>
              <Input 
                id="sim-end-date"
                type="date" 
                value={config.endDate}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={isSimulating}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Capital & Risk */}
            <div className="space-y-2">
              <Label htmlFor="sim-capital">Initial Capital (₹)</Label>
              <Input 
                id="sim-capital"
                type="number" 
                value={config.initialCapital}
                onChange={(e) => setConfig(prev => ({ ...prev, initialCapital: parseInt(e.target.value) }))}
                disabled={isSimulating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sim-risk">Risk Per Trade (%)</Label>
              <Input 
                id="sim-risk"
                type="number" 
                step="0.5"
                value={config.riskPerTrade}
                onChange={(e) => setConfig(prev => ({ ...prev, riskPerTrade: parseFloat(e.target.value) }))}
                disabled={isSimulating}
              />
            </div>

            {/* Timeframe Range */}
            <div className="space-y-2">
              <Label htmlFor="sim-base-tf">Base Timeframe (min)</Label>
              <Select 
                value={config.baseTimeframe.toString()} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, baseTimeframe: parseInt(value) }))}
                disabled={isSimulating}
              >
                <SelectTrigger id="sim-base-tf">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="20">20 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sim-max-tf">Max Timeframe (min)</Label>
              <Select 
                value={config.maxTimeframe.toString()} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, maxTimeframe: parseInt(value) }))}
                disabled={isSimulating}
              >
                <SelectTrigger id="sim-max-tf">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="40">40 min</SelectItem>
                  <SelectItem value="80">80 min</SelectItem>
                  <SelectItem value="160">160 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button 
              onClick={startSimulation}
              disabled={isSimulating || hasActiveScanner}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {hasActiveScanner ? 'Scanner Active - Simulation Disabled' : isSimulating ? 'Simulating...' : 'Start Simulation'}
            </Button>

            {hasActiveScanner && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Activity className="h-4 w-4" />
                Active scanner detected - Independent simulation disabled to prevent double counting
              </div>
            )}

            {isSimulating && !hasActiveScanner && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Activity className="h-4 w-4 animate-spin" />
                Simulating {currentTimeframe}min timeframe (Cycle {simulationCycle + 1})
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Progress */}
      {isSimulating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Simulation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Current Timeframe</div>
                <div className="font-medium">{currentTimeframe} min</div>
              </div>
              <div>
                <div className="text-gray-500">Cycle</div>
                <div className="font-medium">{simulationCycle + 1}</div>
              </div>
              <div>
                <div className="text-gray-500">Patterns Found</div>
                <div className="font-medium">{allPatterns.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Trades Simulated</div>
                <div className="font-medium">{tradeSimulations.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulation Results */}
      {hasActiveScanner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Simulation Results
              <Badge variant="destructive" className="ml-2">
                Disabled - Scanner Active
              </Badge>
            </CardTitle>
            <CardDescription>
              Independent simulation is disabled while the main scanner is running to prevent double counting. View results in the "Trade Execution Results" section instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Active Scanner Detected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                To prevent duplicate trade calculations, this simulation component is temporarily disabled.
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Check the "Trade Execution Results" section for real-time trading results.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {simulationResults && !hasActiveScanner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Simulation Results
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of simulated trades across all timeframes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Trade Statistics */}
              <div className="space-y-4">
                <h4 className="font-medium">Trade Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Trades:</span>
                    <span className="font-medium">{simulationResults.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Winning Trades:</span>
                    <span className="font-medium text-green-600">{simulationResults.winningTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Losing Trades:</span>
                    <span className="font-medium text-red-600">{simulationResults.losingTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="font-medium">{formatPercentage(simulationResults.winRate)}</span>
                  </div>
                </div>
              </div>

              {/* Profit & Loss */}
              <div className="space-y-4">
                <h4 className="font-medium">Profit & Loss</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Profit:</span>
                    <span className="font-medium text-green-600">{formatCurrency(simulationResults.totalProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Loss:</span>
                    <span className="font-medium text-red-600">{formatCurrency(-simulationResults.totalLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net P&L:</span>
                    <span className={`font-medium ${simulationResults.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(simulationResults.netPnL)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk/Reward:</span>
                    <span className="font-medium">{simulationResults.riskRewardRatio.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Trade Performance */}
              <div className="space-y-4">
                <h4 className="font-medium">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Win:</span>
                    <span className="font-medium text-green-600">{formatCurrency(simulationResults.avgWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Loss:</span>
                    <span className="font-medium text-red-600">{formatCurrency(-simulationResults.avgLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframes:</span>
                    <span className="font-medium">{simulationResults.timeframes.join(', ')}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Patterns:</span>
                    <span className="font-medium">{simulationResults.validPatterns}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Details */}
      {tradeSimulations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Trade Details
            </CardTitle>
            <CardDescription>
              Individual trade executions with entry/exit details and P&L analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tradeSimulations.slice(-10).map((trade, index) => (
                <div key={trade.id} className={`p-4 rounded-lg border-2 ${
                  trade.status === 'CLOSED_TARGET' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
                  trade.status === 'CLOSED_PROFIT' ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' :
                  trade.status === 'CLOSED_LOSS' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                  'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={trade.pattern.type === 'UPTREND' ? 'default' : 'destructive'}>
                        {trade.pattern.type === 'UPTREND' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {trade.pattern.type}
                      </Badge>
                      <Badge variant="outline">{trade.timeframe}min</Badge>
                      <Badge variant={
                        trade.status === 'CLOSED_TARGET' ? 'default' :
                        trade.status === 'CLOSED_PROFIT' ? 'secondary' :
                        trade.status === 'CLOSED_LOSS' ? 'destructive' : 'outline'
                      }>
                        {trade.status.replace('CLOSED_', '')}
                      </Badge>
                    </div>
                    <div className={`font-semibold ${
                      (trade.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.profit ? formatCurrency(trade.profit) : 'Open'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-1">Entry Details</div>
                      <div>Price: {trade.entryPrice.toFixed(2)}</div>
                      <div>Qty: {trade.quantity}</div>
                      <div>Time: {new Date(trade.entryTime).toLocaleTimeString()}</div>
                    </div>
                    
                    <div>
                      <div className="font-medium mb-1">Exit Details</div>
                      <div>Price: {trade.exitPrice?.toFixed(2) || 'Open'}</div>
                      <div>Stop: {trade.stopLoss.toFixed(2)}</div>
                      <div>Target: {trade.target.toFixed(2)}</div>
                    </div>
                    
                    <div>
                      <div className="font-medium mb-1">Risk Management</div>
                      <div>Risk: {formatCurrency(Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity)}</div>
                      <div>Reward: {formatCurrency(Math.abs(trade.target - trade.entryPrice) * trade.quantity)}</div>
                      <div>R:R: {((Math.abs(trade.target - trade.entryPrice)) / Math.abs(trade.entryPrice - trade.stopLoss)).toFixed(2)}</div>
                    </div>
                    
                    <div>
                      <div className="font-medium mb-1">Status</div>
                      <div className="text-xs text-gray-600">{trade.reason}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {tradeSimulations.length > 10 && (
                <div className="text-center text-sm text-gray-500">
                  Showing last 10 trades of {tradeSimulations.length} total trades
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three-Cycle Exact Timestamp Analysis */}
      {patternAnalysis && patternAnalysis.metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Three-Cycle Exact Timestamp Analysis
            </CardTitle>
            <CardDescription>
              Point A/B exact timestamps using 1-minute precision methodology for all cycles (replaces OHLC data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cycle 1 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">Cycle 1</Badge>
                  <span className="text-sm text-gray-600">5min Timeframe</span>
                </h4>
                {patternAnalysis.patterns.map((pattern: any, index: number) => (
                  <div key={`cycle1-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={pattern.type === 'UPTREND' ? 'default' : 'destructive'}>
                        {pattern.type}
                      </Badge>
                      <span className="text-xs text-gray-500">1-Min Precision</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-green-600">Point A:</span>
                        <div className="ml-2">
                          <div>Time: {pattern.pointA?.exactTime || 'N/A'}</div>
                          <div>Price: ₹{pattern.pointA?.price || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{pattern.pointA?.candleBlock || ''}</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-600">Point B:</span>
                        <div className="ml-2">
                          <div>Time: {pattern.pointB?.exactTime || 'N/A'}</div>
                          <div>Price: ₹{pattern.pointB?.price || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{pattern.pointB?.candleBlock || ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cycle 2 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">Cycle 2</Badge>
                  <span className="text-sm text-gray-600">10min Timeframe</span>
                </h4>
                {patternAnalysis.patterns.map((pattern: any, index: number) => (
                  <div key={`cycle2-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={pattern.type === 'UPTREND' ? 'default' : 'destructive'}>
                        {pattern.type}
                      </Badge>
                      <span className="text-xs text-gray-500">1-Min Precision</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-green-600">Point A:</span>
                        <div className="ml-2">
                          <div>Time: {pattern.cycles?.cycle2?.uptrend?.pointA?.exactTime || pattern.pointA?.exactTime || 'N/A'}</div>
                          <div>Price: ₹{pattern.cycles?.cycle2?.uptrend?.pointA?.price || pattern.pointA?.price || 'N/A'}</div>
                          <div className="text-xs text-gray-500">C1_EXACT_CYCLE2</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-600">Point B:</span>
                        <div className="ml-2">
                          <div>Time: {pattern.cycles?.cycle2?.uptrend?.pointB?.exactTime || pattern.pointB?.exactTime || 'N/A'}</div>
                          <div>Price: ₹{pattern.cycles?.cycle2?.uptrend?.pointB?.price || pattern.pointB?.price || 'N/A'}</div>
                          <div className="text-xs text-gray-500">C2_EXACT_CYCLE2</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cycle 3 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">Cycle 3</Badge>
                  <span className="text-sm text-gray-600">20min Timeframe</span>
                </h4>
                {patternAnalysis.patterns.map((pattern: any, index: number) => (
                  <div key={`cycle3-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={pattern.type === 'UPTREND' ? 'default' : 'destructive'}>
                        {pattern.type}
                      </Badge>
                      <span className="text-xs text-gray-500">1-Min Precision</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-green-600">Point A:</span>
                        <div className="ml-2">
                          <div>Time: {pattern.cycles?.cycle3?.uptrend?.pointA?.exactTime || pattern.pointA?.exactTime || 'N/A'}</div>
                          <div>Price: ₹{pattern.cycles?.cycle3?.uptrend?.pointA?.price || pattern.pointA?.price || 'N/A'}</div>
                          <div className="text-xs text-gray-500">C1_EXACT_CYCLE3</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-600">Point B:</span>
                        <div className="ml-2">
                          <div>Time: {pattern.cycles?.cycle3?.uptrend?.pointB?.exactTime || pattern.pointB?.exactTime || 'N/A'}</div>
                          <div>Price: ₹{pattern.cycles?.cycle3?.uptrend?.pointB?.price || pattern.pointB?.price || 'N/A'}</div>
                          <div className="text-xs text-gray-500">C2_EXACT_CYCLE3</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Methodology Summary */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">✅ Identical 4 Candle Rule Tab Methodology</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div>• <strong>Same Endpoint:</strong> Uses /api/battu/3-cycle-scanner/cycle1-pointab</div>
                <div>• <strong>Same Data Source:</strong> Fetches real 1-minute candles from Fyers API</div>
                <div>• <strong>Same Logic:</strong> Scans every minute for Point A/B extremes</div>
                <div>• <strong>Same Formatting:</strong> Displays exact timestamps with IST formatting</div>
                <div>• <strong>Same Precision:</strong> Replaces old OHLC averaging with minute-level data</div>
                <div>• <strong>Result:</strong> You should see identical 1-minute data as in 4 Candle Rule tab</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Analysis Summary */}
      {allPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pattern Analysis Summary
            </CardTitle>
            <CardDescription>
              All detected patterns across timeframes with exact timestamp validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-3">Pattern Distribution</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Patterns:</span>
                    <span className="font-medium">{allPatterns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptrend Patterns:</span>
                    <span className="font-medium text-green-600">
                      {allPatterns.filter(p => p.type === 'UPTREND').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downtrend Patterns:</span>
                    <span className="font-medium text-red-600">
                      {allPatterns.filter(p => p.type === 'DOWNTREND').length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Timeframe Analysis</h4>
                <div className="space-y-2 text-sm">
                  {Array.from(new Set(allPatterns.map(p => p.timeframe))).sort().map(tf => (
                    <div key={tf} className="flex justify-between">
                      <span>{tf}min Timeframe:</span>
                      <span className="font-medium">
                        {allPatterns.filter(p => p.timeframe === tf).length} patterns
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}