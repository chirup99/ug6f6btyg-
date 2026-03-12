import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { Play, Square, BarChart3, TrendingUp, TrendingDown, Clock, Target, DollarSign, Activity } from 'lucide-react';

interface FlexibleSystemConfig {
  symbol: string;
  baseTimeframe: number;
  riskAmount: number;
  maxTimeframe: number;
  enableTrading: boolean;
}

interface SystemStatus {
  running: boolean;
  currentTimeframe: number;
  activeTrades: number;
  totalTrades: number;
  totalProfitLoss: number;
  timeframeLevels: {
    timeframe: number;
    candles: number;
    trades: number;
  }[];
}

interface TradeResult {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: number;
  pattern: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  quantity: number;
  status: 'ACTIVE' | 'PROFIT' | 'LOSS' | 'INVALID';
  exitPrice?: number;
  profitLoss?: number;
  duration?: number;
  validationResults: {
    fiftyPercentRule: boolean;
    thirtyFourPercentRule: boolean;
    patternValid: boolean;
    timingValid: boolean;
  };
}

export function CompleteFlexibleTimeframeScanner() {
  const [config, setConfig] = useState<FlexibleSystemConfig>({
    symbol: 'NSE:NIFTY50-INDEX',
    baseTimeframe: 10,
    riskAmount: 1000,
    maxTimeframe: 320,
    enableTrading: false
  });

  const [isSystemRunning, setIsSystemRunning] = useState(false);
  const queryClient = useQueryClient();

  // Query system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ['/api/flexible-timeframe-system/status'],
    refetchInterval: isSystemRunning ? 5000 : false,
    enabled: isSystemRunning
  });

  // Query trade history
  const { data: tradeHistory, isLoading: tradesLoading } = useQuery<{
    trades: TradeResult[];
    summary: any;
  }>({
    queryKey: ['/api/flexible-timeframe-system/trades'],
    refetchInterval: isSystemRunning ? 10000 : false,
    enabled: isSystemRunning
  });

  // Start system mutation
  const startSystemMutation = useMutation({
    mutationFn: async (config: FlexibleSystemConfig) => {
      const response = await fetch('/api/flexible-timeframe-system/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start system');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSystemRunning(true);
      queryClient.invalidateQueries({ queryKey: ['/api/flexible-timeframe-system/status'] });
    }
  });

  // Stop system mutation
  const stopSystemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/flexible-timeframe-system/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to stop system');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSystemRunning(false);
      queryClient.invalidateQueries({ queryKey: ['/api/flexible-timeframe-system/status'] });
    }
  });

  const handleStartSystem = () => {
    startSystemMutation.mutate(config);
  };

  const handleStopSystem = () => {
    stopSystemMutation.mutate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-500';
      case 'PROFIT': return 'bg-green-500';
      case 'LOSS': return 'bg-red-500';
      case 'INVALID': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Complete Flexible Timeframe System
          </CardTitle>
          <CardDescription>
            Real-time market-following system with timeframe doubling, recursive drilling, pattern validation, and actual trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Symbol</label>
              <Select 
                value={config.symbol} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, symbol: value }))}
                disabled={isSystemRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                  <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                  <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                  <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Base Timeframe (min)</label>
              <Select 
                value={config.baseTimeframe.toString()} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, baseTimeframe: parseInt(value) }))}
                disabled={isSystemRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="40">40 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Risk Amount (₹)</label>
              <Input
                type="number"
                value={config.riskAmount}
                onChange={(e) => setConfig(prev => ({ ...prev, riskAmount: parseInt(e.target.value) || 1000 }))}
                disabled={isSystemRunning}
                min={100}
                max={100000}
                step={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Max Timeframe (min)</label>
              <Select 
                value={config.maxTimeframe.toString()} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, maxTimeframe: parseInt(value) }))}
                disabled={isSystemRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="160">160 minutes</SelectItem>
                  <SelectItem value="320">320 minutes</SelectItem>
                  <SelectItem value="640">640 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableTrading"
                checked={config.enableTrading}
                onChange={(e) => setConfig(prev => ({ ...prev, enableTrading: e.target.checked }))}
                disabled={isSystemRunning}
                className="rounded"
              />
              <label htmlFor="enableTrading" className="text-sm font-medium">
                Enable Live Trading
              </label>
            </div>

            <div className="flex gap-2">
              {!isSystemRunning ? (
                <Button 
                  onClick={handleStartSystem}
                  disabled={startSystemMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {startSystemMutation.isPending ? 'Starting...' : 'Start System'}
                </Button>
              ) : (
                <Button 
                  onClick={handleStopSystem}
                  disabled={stopSystemMutation.isPending}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  {stopSystemMutation.isPending ? 'Stopping...' : 'Stop System'}
                </Button>
              )}
            </div>
          </div>

          {/* System Status Alert */}
          {isSystemRunning && (
            <Alert className="border-green-200 bg-green-50">
              <Activity className="h-4 w-4" />
              <AlertDescription>
                <strong>System Running:</strong> Following market progression with {config.symbol} at {config.baseTimeframe}min base timeframe
                {config.enableTrading && <span className="ml-2 text-green-600 font-semibold">• LIVE TRADING ENABLED</span>}
              </AlertDescription>
            </Alert>
          )}

          {/* Errors */}
          {startSystemMutation.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription>
                Failed to start system: {(startSystemMutation.error as any)?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Dashboard */}
      {isSystemRunning && (
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">System Status</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            {systemStatus && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Timeframe</p>
                        <p className="text-2xl font-bold">{systemStatus.currentTimeframe}min</p>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Trades</p>
                        <p className="text-2xl font-bold">{systemStatus.activeTrades}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                        <p className="text-2xl font-bold">{systemStatus.totalTrades}</p>
                      </div>
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                        <p className={`text-2xl font-bold ${systemStatus.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(systemStatus.totalProfitLoss)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Timeframe Levels */}
            {systemStatus?.timeframeLevels && systemStatus.timeframeLevels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Timeframe Progression</CardTitle>
                  <CardDescription>System progression through different timeframes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemStatus.timeframeLevels.map((level) => (
                      <div key={level.timeframe} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={level.timeframe === systemStatus.currentTimeframe ? "default" : "secondary"}>
                            {level.timeframe}min
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {level.candles} candles • {level.trades} trades
                          </span>
                        </div>
                        {level.timeframe === systemStatus.currentTimeframe && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Current
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-4">
            {tradeHistory && (
              <>
                {/* Trade Summary */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold text-blue-600">{tradeHistory.summary.activeTrades}</div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold text-green-600">{tradeHistory.summary.profitableTrades}</div>
                      <div className="text-sm text-muted-foreground">Profit</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold text-red-600">{tradeHistory.summary.lossfulTrades}</div>
                      <div className="text-sm text-muted-foreground">Loss</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold text-gray-600">{tradeHistory.summary.invalidTrades}</div>
                      <div className="text-sm text-muted-foreground">Invalid</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className={`text-2xl font-bold ${tradeHistory.summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(tradeHistory.summary.totalProfitLoss)}
                      </div>
                      <div className="text-sm text-muted-foreground">Net P&L</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trade List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Trade History</CardTitle>
                    <CardDescription>All trades executed by the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tradeHistory.trades.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No trades executed yet
                        </div>
                      ) : (
                        tradeHistory.trades.slice(0, 20).map((trade) => (
                          <div key={trade.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(trade.status)}>
                                  {trade.status}
                                </Badge>
                                <Badge variant="outline">
                                  {trade.timeframe}min
                                </Badge>
                                <span className="font-medium">{trade.pattern}</span>
                                <div className="flex items-center gap-1">
                                  {trade.direction === 'BUY' ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className={trade.direction === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                                    {trade.direction}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(trade.timestamp).toLocaleString()}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Entry</div>
                                <div className="font-medium">₹{trade.entryPrice.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Target</div>
                                <div className="font-medium">₹{trade.targetPrice.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Stop Loss</div>
                                <div className="font-medium">₹{trade.stopLoss.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Quantity</div>
                                <div className="font-medium">{trade.quantity}</div>
                              </div>
                              {trade.exitPrice && (
                                <div>
                                  <div className="text-muted-foreground">Exit</div>
                                  <div className="font-medium">₹{trade.exitPrice.toFixed(2)}</div>
                                </div>
                              )}
                              {trade.profitLoss !== undefined && (
                                <div>
                                  <div className="text-muted-foreground">P&L</div>
                                  <div className={`font-medium ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(trade.profitLoss)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Validation Results */}
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm text-muted-foreground mb-2">Validation Results:</div>
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant={trade.validationResults.fiftyPercentRule ? "default" : "destructive"}>
                                  50% Rule: {trade.validationResults.fiftyPercentRule ? '✓' : '✗'}
                                </Badge>
                                <Badge variant={trade.validationResults.thirtyFourPercentRule ? "default" : "destructive"}>
                                  34% Rule: {trade.validationResults.thirtyFourPercentRule ? '✓' : '✗'}
                                </Badge>
                                <Badge variant={trade.validationResults.patternValid ? "default" : "destructive"}>
                                  Pattern: {trade.validationResults.patternValid ? '✓' : '✗'}
                                </Badge>
                                <Badge variant={trade.validationResults.timingValid ? "default" : "destructive"}>
                                  Timing: {trade.validationResults.timingValid ? '✓' : '✗'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Methodology</CardTitle>
                <CardDescription>Complete flexible timeframe system workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">Step 1: Market Progression Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      System follows market from open to close, monitoring candle completion and market conditions
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold">Step 2: Advanced Methods Application</h4>
                    <p className="text-sm text-muted-foreground">
                      • Missing 4th Candle Method (≥20min) - Recursive drilling to 20min minimum<br/>
                      • 5th Candle Method (≥10min) - Recursive drilling to 10min minimum<br/>
                      • 6th Candle Method (≥10min) - Recursive drilling to 10min minimum
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold">Step 3: Pattern Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      • 50% Rule: Point A→B duration ≥ 50% of 4-candle duration<br/>
                      • 34% Rule: Point B→trigger duration ≥ 34% of Point A→B duration<br/>
                      • Pattern structure and slope validation
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold">Step 4: Timeframe Doubling</h4>
                    <p className="text-sm text-muted-foreground">
                      After 6th candle completion, system doubles timeframe and continues analysis with new block structure
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold">Step 5: Trade Execution & Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      • Automatic order placement with calculated quantities<br/>
                      • Real-time profit/loss tracking<br/>
                      • 80% target partial exits and stop loss management
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}