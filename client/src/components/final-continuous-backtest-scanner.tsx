import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from '@/lib/queryClient';
import { Play, TrendingUp, TrendingDown, BarChart3, Clock, Target, AlertTriangle } from 'lucide-react';

interface CycleResult {
  cycleNumber: number;
  blocks: {
    c1: Array<{ timestamp: string; open: number; high: number; low: number; close: number }>;
    c2: Array<{ timestamp: string; open: number; high: number; low: number; close: number }>;  
    c3: Array<{ timestamp: string; open: number; high: number; low: number; close: number }>;
  };
  battuAnalysis: {
    slopes: Array<{
      pattern: string;
      slope: number;
      pointA: { price: number; timestamp: string; candleName: string };
      pointB: { price: number; timestamp: string; candleName: string };
    }>;
  };
  c3Comparison: {
    predicted: { high: number; low: number };
    actual: { high: number; low: number };
    accuracy: number;
  };
  validationRules: {
    fiftyPercentRule: boolean;
    thirtyFourPercentRule: boolean;
    individualCandleValidation: boolean;
    slOrderTimingValidation: boolean;
    patternValid: boolean;
  };
  profitLossCalculation: {
    predictedPrice: number;
    actualPrice: number;
    profitLoss: number;
    tradeOutcome: 'profit' | 'loss' | 'no_trade';
  };
  mergingDecision: {
    applied: boolean;
    reason: string;
    newBlocks?: {
      c1Count: number;
      c2Count: number;
    };
  };
}

interface FinalBacktestResult {
  symbol: string;
  date: string;
  totalCycles: number;
  cycleResults: CycleResult[];
  overallSummary: {
    totalTrades: number;
    profitableTrades: number;
    totalProfitLoss: number;
    averageAccuracy: number;
    successRate: number;
  };
  marketSession: {
    start: string;
    end: string;
    totalCandles: number;
    candlesProcessed: number;
  };
}

export function FinalContinuousBacktestScanner() {
  const [symbol, setSymbol] = useState('NSE:NIFTY50-INDEX');
  const [date, setDate] = useState('2025-07-25');
  const [timeframe, setTimeframe] = useState('5');
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (params: { symbol: string; date: string; timeframe?: string }) => {
      return apiRequest(`/api/battu-scan/final-continuous-backtest`, {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-continuous-backtest'] });
    }
  });

  const handleScan = () => {
    scanMutation.mutate({ symbol, date, timeframe });
  };

  const result = scanMutation.data as FinalBacktestResult | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <BarChart3 className="h-6 w-6" />
            Final Corrected Continuous Battu Backtest
          </CardTitle>
          <CardDescription className="text-indigo-700">
            CORRECTED METHODOLOGY: Start 5-min candles → wait 4 candles → C1(C1a+C1b=2+2) + C2(C2a+C2b=2+2) → 
            Apply Battu API → Compare with real C3 → Count-based merging → Continue till market close
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scan Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
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
              <Label htmlFor="date">Date</Label>
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleScan} 
            disabled={scanMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Play className="mr-2 h-4 w-4" />
            {scanMutation.isPending ? 'Running Final Corrected Backtest...' : 'Start Final Corrected Backtest'}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {scanMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {scanMutation.error instanceof Error ? scanMutation.error.message : 'Scan failed'}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overall Summary */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Overall Backtest Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{result.totalCycles}</div>
                  <div className="text-sm text-green-600">Total Cycles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{result.overallSummary.totalTrades}</div>
                  <div className="text-sm text-blue-600">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{result.overallSummary.profitableTrades}</div>
                  <div className="text-sm text-purple-600">Profitable</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-700">{result.overallSummary.averageAccuracy.toFixed(1)}%</div>
                  <div className="text-sm text-indigo-600">Avg Accuracy</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${result.overallSummary.totalProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {result.overallSummary.totalProfitLoss > 0 ? '+' : ''}{result.overallSummary.totalProfitLoss.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">P&L</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Success Rate</span>
                  <span>{result.overallSummary.successRate.toFixed(1)}%</span>
                </div>
                <Progress value={result.overallSummary.successRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Market Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Market Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Session Start</div>
                  <div className="font-medium">{new Date(result.marketSession.start).toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Session End</div>
                  <div className="font-medium">{new Date(result.marketSession.end).toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Candles</div>
                  <div className="font-medium">{result.marketSession.totalCandles}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Processed</div>
                  <div className="font-medium">{result.marketSession.candlesProcessed}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cycle Results */}
          <Card>
            <CardHeader>
              <CardTitle>Cycle-by-Cycle Results</CardTitle>
              <CardDescription>Click on a cycle to view detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.cycleResults.map((cycle) => (
                  <Card 
                    key={cycle.cycleNumber}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedCycle === cycle.cycleNumber ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                    }`}
                    onClick={() => setSelectedCycle(selectedCycle === cycle.cycleNumber ? null : cycle.cycleNumber)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Cycle {cycle.cycleNumber}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Blocks:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline">C1({cycle.blocks.c1.length})</Badge>
                          <Badge variant="outline">C2({cycle.blocks.c2.length})</Badge>
                          <Badge variant="outline">C3({cycle.blocks.c3.length})</Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Accuracy:</span>
                        <Badge variant={cycle.c3Comparison.accuracy > 80 ? "default" : "secondary"}>
                          {cycle.c3Comparison.accuracy.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">P&L:</span>
                        <Badge variant={cycle.profitLossCalculation.profitLoss >= 0 ? "default" : "destructive"}>
                          {cycle.profitLossCalculation.profitLoss > 0 ? '+' : ''}{cycle.profitLossCalculation.profitLoss.toFixed(2)}
                        </Badge>
                      </div>
                      
                      {cycle.mergingDecision.applied && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          Merging Applied: {cycle.mergingDecision.reason}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Cycle View */}
          {selectedCycle !== null && (
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Cycle {selectedCycle} - Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const cycle = result.cycleResults.find(c => c.cycleNumber === selectedCycle);
                  if (!cycle) return null;

                  return (
                    <div className="space-y-6">
                      {/* Block Structure */}
                      <div>
                        <h4 className="font-medium mb-3">Block Structure</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-blue-50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">C1 Block ({cycle.blocks.c1.length} candles)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-xs space-y-1">
                                {cycle.blocks.c1.map((candle, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{new Date(candle.timestamp).toLocaleTimeString()}</span>
                                    <span>{candle.close.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-green-50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">C2 Block ({cycle.blocks.c2.length} candles)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-xs space-y-1">
                                {cycle.blocks.c2.map((candle, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{new Date(candle.timestamp).toLocaleTimeString()}</span>
                                    <span>{candle.close.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-purple-50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">C3 Block ({cycle.blocks.c3.length} candles)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-xs space-y-1">
                                {cycle.blocks.c3.map((candle, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{new Date(candle.timestamp).toLocaleTimeString()}</span>
                                    <span>{candle.close.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Battu Analysis */}
                      <div>
                        <h4 className="font-medium mb-3">Battu Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cycle.battuAnalysis.slopes.map((slope, idx) => (
                            <Card key={idx} className={slope.slope > 0 ? 'bg-green-50' : 'bg-red-50'}>
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {slope.slope > 0 ? 
                                    <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  }
                                  <span className="font-medium">{slope.pattern}</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div>Slope: <span className="font-medium">{slope.slope.toFixed(4)} pts/min</span></div>
                                  <div>Point A: {slope.pointA.price.toFixed(2)} ({slope.pointA.candleName})</div>
                                  <div>Point B: {slope.pointB.price.toFixed(2)} ({slope.pointB.candleName})</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Validation Rules */}
                      <div>
                        <h4 className="font-medium mb-3">Validation Rules</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <Badge variant={cycle.validationRules.fiftyPercentRule ? "default" : "secondary"}>
                            50% Rule: {cycle.validationRules.fiftyPercentRule ? 'PASS' : 'FAIL'}
                          </Badge>
                          <Badge variant={cycle.validationRules.thirtyFourPercentRule ? "default" : "secondary"}>
                            34% Rule: {cycle.validationRules.thirtyFourPercentRule ? 'PASS' : 'FAIL'}
                          </Badge>
                          <Badge variant={cycle.validationRules.individualCandleValidation ? "default" : "secondary"}>
                            Individual: {cycle.validationRules.individualCandleValidation ? 'PASS' : 'FAIL'}
                          </Badge>
                          <Badge variant={cycle.validationRules.slOrderTimingValidation ? "default" : "secondary"}>
                            SL Timing: {cycle.validationRules.slOrderTimingValidation ? 'PASS' : 'FAIL'}
                          </Badge>
                          <Badge variant={cycle.validationRules.patternValid ? "default" : "secondary"}>
                            Pattern: {cycle.validationRules.patternValid ? 'VALID' : 'INVALID'}
                          </Badge>
                        </div>
                      </div>

                      {/* C3 Comparison */}
                      <div>
                        <h4 className="font-medium mb-3">C3 Prediction vs Actual</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="bg-blue-50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Predicted</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1 text-sm">
                                <div>High: {cycle.c3Comparison.predicted.high.toFixed(2)}</div>
                                <div>Low: {cycle.c3Comparison.predicted.low.toFixed(2)}</div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-orange-50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Actual</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-1 text-sm">
                                <div>High: {cycle.c3Comparison.actual.high.toFixed(2)}</div>
                                <div>Low: {cycle.c3Comparison.actual.low.toFixed(2)}</div>
                                <div className="font-medium">Accuracy: {cycle.c3Comparison.accuracy.toFixed(1)}%</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}