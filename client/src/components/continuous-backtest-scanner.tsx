import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BacktestCycle {
  cycleNumber: number;
  C1Block: {
    name: string;
    candles: Array<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    startIndex: number;
    endIndex: number;
    high: { price: number; timestamp: string };
    low: { price: number; timestamp: string };
  };
  C2Block: {
    name: string;
    candles: Array<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    startIndex: number;
    endIndex: number;
    high: { price: number; timestamp: string };
    low: { price: number; timestamp: string };
  };
  C3Block: {
    name: string;
    candles: Array<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    startIndex: number;
    endIndex: number;
    high: { price: number; timestamp: string };
    low: { price: number; timestamp: string };
  };
  backtestResult: {
    analysisType: string;
    c1BlockCount: number;
    c2BlockCount: number;
    c3BlockCount: number;
    cycle: number;
    timestamp: string;
  };
  totalCandlesProcessed: number;
  mergeAction: 'C1+C2→newC1,C3→newC2' | 'C2+C3→newC2,C1same' | 'initial';
}

interface ContinuousBacktestResult {
  symbol: string;
  date: string;
  timeframe: string;
  totalCycles: number;
  completedCycles: BacktestCycle[];
  marketOpenTime: string;
  marketCloseTime: string;
  totalCandles: number;
  processingStatus: string;
}

export function ContinuousBacktestScanner() {
  const [isRunning, setIsRunning] = useState(false);
  const [symbol, setSymbol] = useState('NSE:NIFTY50-INDEX');
  const [date, setDate] = useState('2025-07-25');
  const [timeframe, setTimeframe] = useState('5');
  const [results, setResults] = useState<ContinuousBacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartBacktest = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔄 Starting continuous backtest with params:', { symbol, date, timeframe });
      
      const response = await fetch('/api/battu-scan/continuous-backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, date, timeframe })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json() as ContinuousBacktestResult;

      console.log('✅ Continuous backtest completed:', data);
      setResults(data);
    } catch (err) {
      console.error('❌ Continuous backtest failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Continuous Battu Backtest - Market Open to Close
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symbol" />
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
              <Label htmlFor="date">Analysis Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="timeframe">Timeframe (minutes)</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Minute</SelectItem>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="10">10 Minutes</SelectItem>
                  <SelectItem value="15">15 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleStartBacktest}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Continuous Backtest...
              </>
            ) : (
              'Start Continuous Backtest'
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Backtest Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.totalCycles}</div>
                  <div className="text-sm text-gray-600">Total Cycles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.totalCandles}</div>
                  <div className="text-sm text-gray-600">Total Candles</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-purple-600">{formatTime(results.marketOpenTime)}</div>
                  <div className="text-sm text-gray-600">Market Open</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-orange-600">{formatTime(results.marketCloseTime)}</div>
                  <div className="text-sm text-gray-600">Market Close</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cycles Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Backtesting Cycles</h3>
            {results.completedCycles.map((cycle) => (
              <Card key={cycle.cycleNumber} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Cycle {cycle.cycleNumber}
                    </CardTitle>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(cycle.timestamp)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Block Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-800">C1 Block</div>
                      <div className="text-blue-600">
                        {cycle.C1Block.candles.length} candles
                      </div>
                      <div className="text-xs text-blue-500">
                        Index: {cycle.C1Block.startIndex}-{cycle.C1Block.endIndex}
                      </div>
                      <div className="text-xs text-blue-500">
                        High: {formatPrice(cycle.C1Block.high.price)} | Low: {formatPrice(cycle.C1Block.low.price)}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-green-800">C2 Block</div>
                      <div className="text-green-600">
                        {cycle.C2Block.candles.length} candles
                      </div>
                      <div className="text-xs text-green-500">
                        Index: {cycle.C2Block.startIndex}-{cycle.C2Block.endIndex}
                      </div>
                      <div className="text-xs text-green-500">
                        High: {formatPrice(cycle.C2Block.high.price)} | Low: {formatPrice(cycle.C2Block.low.price)}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-medium text-purple-800">C3 Block (Backtested)</div>
                      <div className="text-purple-600">
                        {cycle.C3Block.candles.length} candles
                      </div>
                      <div className="text-xs text-purple-500">
                        Index: {cycle.C3Block.startIndex}-{cycle.C3Block.endIndex}
                      </div>
                      <div className="text-xs text-purple-500">
                        High: {formatPrice(cycle.C3Block.high.price)} | Low: {formatPrice(cycle.C3Block.low.price)}
                      </div>
                    </div>
                  </div>

                  {/* Backtest Results */}
                  <div className="space-y-2">
                    <div className="font-medium text-gray-800">Backtest Analysis Results</div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-sm space-y-1">
                        <div>Analysis Type: <span className="font-mono">{cycle.backtestResult?.analysisType || 'N/A'}</span></div>
                        <div>C1 Block Count: <span className="font-mono">{cycle.backtestResult?.c1BlockCount || 0}</span></div>
                        <div>C2 Block Count: <span className="font-mono">{cycle.backtestResult?.c2BlockCount || 0}</span></div>
                        <div>C3 Block Count: <span className="font-mono">{cycle.backtestResult?.c3BlockCount || 0}</span></div>
                        <div>Merge Action: <span className="font-mono text-purple-600">{cycle.mergeAction}</span></div>
                        <div>Total Candles Processed: <span className="font-mono">{cycle.totalCandlesProcessed}</span></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}