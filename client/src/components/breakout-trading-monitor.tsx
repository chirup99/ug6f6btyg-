import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Shield, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  stopLoss: number;
  quantity: number;
  reason: string;
  triggerCandle: '5th' | '6th';
  patternName: string;
  trendType: 'uptrend' | 'downtrend';
}

interface BreakoutMonitorResponse {
  symbol: string;
  date: string;
  timeframe: number;
  patternsAnalyzed: number;
  tradingSignals: TradingSignal[];
  activeTrades: TradingSignal[];
  slopeAnalysis: any;
}

export function BreakoutTradingMonitor() {
  const [symbol, setSymbol] = useState('NSE:INFY-EQ');
  const [date, setDate] = useState('2025-01-25');
  const [timeframe, setTimeframe] = useState('40');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for active trades
  const { data: activeTrades, isLoading: tradesLoading } = useQuery({
    queryKey: ['/api/breakout-trading/active-trades'],
    refetchInterval: 10000 // Refresh every 10 seconds
  }) as { data: { activeTrades: TradingSignal[] } | undefined, isLoading: boolean };

  // Mutation for monitoring breakouts
  const monitorBreakouts = useMutation({
    mutationFn: async (params: { symbol: string; date: string; timeframe: string }) => {
      const response = await fetch('/api/breakout-trading/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to monitor breakouts');
      }
      
      return response.json() as Promise<BreakoutMonitorResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Breakout Monitoring Complete",
        description: `Found ${data.tradingSignals.length} trading signals from ${data.patternsAnalyzed} patterns`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breakout-trading/active-trades'] });
    },
    onError: (error) => {
      toast({
        title: "Monitoring Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for updating stop losses
  const updateStopLosses = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/breakout-trading/update-stop-losses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update stop losses');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Stop Losses Updated",
        description: `Updated stop losses for ${data.activeTrades.length} trades`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breakout-trading/active-trades'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleMonitor = () => {
    monitorBreakouts.mutate({ symbol, date, timeframe });
  };

  const handleUpdateStopLosses = () => {
    updateStopLosses.mutate();
  };

  const getTrendIcon = (trendType: 'uptrend' | 'downtrend') => {
    return trendType === 'uptrend' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getActionColor = (action: 'BUY' | 'SELL') => {
    return action === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                             : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Breakout Trading Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                  <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                  <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                  <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe (minutes)</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 min</SelectItem>
                  <SelectItem value="40">40 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="80">80 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleMonitor} 
              disabled={monitorBreakouts.isPending}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              {monitorBreakouts.isPending ? 'Monitoring...' : 'Monitor Breakouts'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleUpdateStopLosses} 
              disabled={updateStopLosses.isPending}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {updateStopLosses.isPending ? 'Updating...' : 'Update Stop Losses'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Latest Monitoring Results */}
      {monitorBreakouts.data && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Monitoring Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{monitorBreakouts.data.patternsAnalyzed}</div>
                <div className="text-sm text-gray-600">Patterns Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{monitorBreakouts.data.tradingSignals.length}</div>
                <div className="text-sm text-gray-600">Trading Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{monitorBreakouts.data.activeTrades.length}</div>
                <div className="text-sm text-gray-600">Active Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{monitorBreakouts.data.timeframe}min</div>
                <div className="text-sm text-gray-600">Timeframe</div>
              </div>
            </div>

            {/* Trading Signals */}
            {monitorBreakouts.data.tradingSignals.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Generated Trading Signals</h4>
                {monitorBreakouts.data.tradingSignals.map((signal, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(signal.trendType)}
                        <Badge className={getActionColor(signal.action)}>
                          {signal.action}
                        </Badge>
                        <Badge variant="outline">{signal.patternName}</Badge>
                        <Badge variant="secondary">{signal.triggerCandle} Candle</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{signal.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Entry Price</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Stop Loss</div>
                        <div className="font-semibold flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          ₹{signal.stopLoss.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Quantity</div>
                        <div className="font-semibold flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {signal.quantity}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Risk</div>
                        <div className="font-semibold">
                          ₹{(Math.abs(signal.price - signal.stopLoss) * signal.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-700">{signal.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Active Trades
            {!tradesLoading && activeTrades?.activeTrades?.length > 0 && (
              <Badge variant="secondary">{activeTrades.activeTrades.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tradesLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading active trades...</div>
            </div>
          ) : !activeTrades?.activeTrades || activeTrades.activeTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <div>No active trades</div>
              <div className="text-sm">Monitor breakouts to generate trading signals</div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrades.activeTrades.map((trade: TradingSignal, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trade.trendType)}
                      <Badge className={getActionColor(trade.action)}>
                        {trade.action}
                      </Badge>
                      <Badge variant="outline">{trade.patternName}</Badge>
                      <span className="font-semibold">{trade.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{trade.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Entry Price</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Stop Loss</div>
                      <div className="font-semibold text-red-600">₹{trade.stopLoss.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Quantity</div>
                      <div className="font-semibold">{trade.quantity}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Trigger</div>
                      <div className="font-semibold">{trade.triggerCandle} Candle</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Risk</div>
                      <div className="font-semibold">
                        ₹{(Math.abs(trade.price - trade.stopLoss) * trade.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {monitorBreakouts.error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Monitoring Error</span>
            </div>
            <div className="mt-2 text-red-700">
              {monitorBreakouts.error.message}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}