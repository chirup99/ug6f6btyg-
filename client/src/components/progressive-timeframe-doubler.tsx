import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, Clock, TrendingUp, TrendingDown, BarChart3, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProgressiveAnalysisResult {
  currentTimeframe: number;
  nextTimeframe: number;
  candleCount: number;
  shouldDouble: boolean;
  analysis?: any;
  doubledAnalysis?: any;
  realBreakoutValidation?: any;
  doubledRealBreakoutValidation?: any;
  marketClosed: boolean;
  progressiveLevel: number;
  totalLevels: number;
}

interface ProgressiveTimeframeDoublerProps {
  symbol: string;
  date: string;
  initialTimeframe: string;
}

export function ProgressiveTimeframeDoubler({ symbol, date, initialTimeframe }: ProgressiveTimeframeDoublerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progressiveResults, setProgressiveResults] = useState<ProgressiveAnalysisResult[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check progressive status
  const { data: progressiveStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/battu-scan/intraday/progressive-status', symbol, date, initialTimeframe],
    queryFn: () => apiRequest({
      url: '/api/battu-scan/intraday/progressive-status',
      method: 'POST',
      body: {
        symbol,
        date,
        currentTimeframe: initialTimeframe
      }
    }),
    refetchInterval: 30000, // Check status every 30 seconds
    enabled: !isRunning && !!symbol && !!date && !!initialTimeframe
  });

  // Run progressive analysis
  const runProgressive = useMutation({
    mutationFn: (params: { symbol: string; date: string; initialTimeframe: string; startAfterCandle?: number }) =>
      apiRequest({
        url: '/api/battu-scan/intraday/progressive-timeframe-doubling',
        method: 'POST',
        body: params
      }),
    onSuccess: (data) => {
      console.log('✅ Progressive analysis completed:', data);
      setProgressiveResults(data.results || []);
      setIsRunning(false);
      
      toast({
        title: "Progressive Analysis Complete",
        description: `Analyzed ${data.totalLevels} timeframe levels from ${data.initialTimeframe}min`,
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['/api/battu-scan/intraday/progressive-status'] 
      });
    },
    onError: (error) => {
      console.error('❌ Progressive analysis failed:', error);
      setIsRunning(false);
      
      toast({
        title: "Progressive Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleStartProgressive = () => {
    setIsRunning(true);
    setProgressiveResults([]);
    
    runProgressive.mutate({
      symbol,
      date,
      initialTimeframe,
      startAfterCandle: 6
    });
  };

  const handleStopProgressive = () => {
    setIsRunning(false);
    // In a real implementation, this would cancel the ongoing analysis
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="font-medium">Progressive Monitor</span>
          </div>
          
          {statusLoading ? (
            <Badge variant="outline">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </Badge>
          ) : progressiveStatus?.shouldProgress ? (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              Ready to Progress
            </Badge>
          ) : (
            <Badge variant="outline">
              Continue Monitoring
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button
              onClick={handleStartProgressive}
              disabled={runProgressive.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              {runProgressive.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Progressive
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStopProgressive}
              variant="outline"
              size="sm"
            >
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Current Status */}
      {progressiveStatus && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-1">Current Level</div>
              <div className="text-lg font-bold text-purple-600">Level {progressiveStatus.currentLevel}</div>
              <div className="text-xs text-gray-500">{initialTimeframe}min timeframe</div>
            </div>
            
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-1">Candle Count</div>
              <div className="text-lg font-bold text-blue-600">{progressiveStatus.candleCount}</div>
              <div className="text-xs text-gray-500">Trigger: &gt;6 candles</div>
            </div>
            
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-1">Next Timeframe</div>
              <div className="text-lg font-bold text-green-600">{progressiveStatus.nextTimeframe}min</div>
              <div className="text-xs text-gray-500">
                {progressiveStatus.marketStatus === 'open' ? '🟢 Market Open' : '🔴 Market Closed'}
              </div>
            </div>
          </div>
          
          {/* Enhanced Progressive Rules */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-2">Progressive Rule</div>
                <div className="text-sm text-gray-600 mb-3">{progressiveStatus.progressionRule || 'After 6 candles (60 minutes) → Double timeframe'}</div>
                
                <div className="text-sm font-medium text-gray-700 mb-1">Recommendation</div>
                <div className="text-sm text-blue-600">{progressiveStatus.recommendation || 'Monitor candle count'}</div>
              </div>
              
              <div className="flex-shrink-0">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  progressiveStatus.shouldProgress 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {progressiveStatus.shouldProgress ? 'Ready' : 'Waiting'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {progressiveStatus?.recommendations && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">System Recommendation</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <div><strong>Action:</strong> {progressiveStatus.recommendations.action.replace('_', ' ')}</div>
            <div><strong>Message:</strong> {progressiveStatus.recommendations.message}</div>
            {progressiveStatus.recommendations.marketNote && (
              <div><strong>Market:</strong> {progressiveStatus.recommendations.marketNote}</div>
            )}
          </div>
        </div>
      )}

      {/* Progressive Results */}
      {progressiveResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium">Progressive Analysis Results</span>
            <Badge variant="outline">{progressiveResults.length} Levels</Badge>
          </div>
          
          <div className="space-y-2">
            {progressiveResults.map((result, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Level {result.progressiveLevel}</Badge>
                    <span className="font-medium">{result.currentTimeframe}min</span>
                    {result.shouldDouble && (
                      <span className="text-gray-400">→ {result.nextTimeframe}min</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={result.shouldDouble ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {result.candleCount} candles
                    </Badge>
                    {result.shouldDouble ? (
                      <Badge className="bg-purple-100 text-purple-800">Doubled</Badge>
                    ) : (
                      <Badge variant="outline">Monitor</Badge>
                    )}
                  </div>
                </div>
                
                {/* 4-Candle Rule Analysis Results */}
                {result.analysis && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-purple-400">
                    <div className="text-sm font-medium text-purple-700 mb-2">
                      4-Candle Rule Analysis - {result.currentTimeframe}min Timeframe
                    </div>
                    <div className="space-y-2 text-xs">
                      {result.analysis.uptrend && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-green-700 font-medium">
                            UPTREND: {result.analysis.uptrend.patternName}
                          </span>
                          <span className="text-green-600">
                            ({result.analysis.uptrend.slope?.toFixed(3)} pts/min)
                          </span>
                        </div>
                      )}
                      {result.analysis.downtrend && (
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="text-red-700 font-medium">
                            DOWNTREND: {result.analysis.downtrend.patternName}
                          </span>
                          <span className="text-red-600">
                            ({result.analysis.downtrend.slope?.toFixed(3)} pts/min)
                          </span>
                        </div>
                      )}
                      {result.analysis.uptrend && result.analysis.downtrend && (
                        <div className="text-purple-700 font-medium">
                          ✅ Valid Trade Patterns: Both uptrend and downtrend available
                        </div>
                      )}
                      {(!result.analysis.uptrend || !result.analysis.downtrend) && (
                        <div className="text-orange-600 font-medium">
                        ⚠️ Incomplete patterns at {result.currentTimeframe}min timeframe
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Real Breakout Validation Status */}
                {result.realBreakoutValidation && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <div className="text-sm font-medium text-yellow-700 mb-2">
                      Real Breakout Validation - {result.currentTimeframe}min Timeframe
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="font-medium text-gray-700">5th Candle</div>
                          <div className="text-gray-600">
                            High: {result.realBreakoutValidation.fifthCandle?.high?.toFixed(2) || 'N/A'}
                          </div>
                          <div className="text-gray-600">
                            Low: {result.realBreakoutValidation.fifthCandle?.low?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">6th Candle</div>
                          <div className="text-gray-600">
                            High: {result.realBreakoutValidation.sixthCandle?.high?.toFixed(2) || 'N/A'}
                          </div>
                          <div className="text-gray-600">
                            Low: {result.realBreakoutValidation.sixthCandle?.low?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-yellow-700 font-medium">
                        📊 Real Fyers API Data Retrieved for {result.currentTimeframe}min Analysis
                      </div>
                    </div>
                  </div>
                )}

                {/* Doubled Analysis Results */}
                {result.doubledAnalysis && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="text-sm font-medium text-blue-700 mb-2">
                      4-Candle Rule Analysis - {result.nextTimeframe}min Doubled Timeframe
                    </div>
                    <div className="space-y-2 text-xs">
                      {result.doubledAnalysis.uptrend && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-green-700 font-medium">
                            UPTREND: {result.doubledAnalysis.uptrend.patternName}
                          </span>
                          <span className="text-green-600">
                            ({result.doubledAnalysis.uptrend.slope?.toFixed(3)} pts/min)
                          </span>
                        </div>
                      )}
                      {result.doubledAnalysis.downtrend && (
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="text-red-700 font-medium">
                            DOWNTREND: {result.doubledAnalysis.downtrend.patternName}
                          </span>
                          <span className="text-red-600">
                            ({result.doubledAnalysis.downtrend.slope?.toFixed(3)} pts/min)
                          </span>
                        </div>
                      )}
                      {result.doubledAnalysis.uptrend && result.doubledAnalysis.downtrend && (
                        <div className="text-blue-700 font-medium">
                          ✅ Valid Trade Patterns: Both uptrend and downtrend available
                        </div>
                      )}
                      {(!result.doubledAnalysis.uptrend || !result.doubledAnalysis.downtrend) && (
                        <div className="text-orange-600 font-medium">
                          ⚠️ Incomplete patterns at {result.nextTimeframe}min doubled timeframe
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-1 mt-3">
                  <div><strong>Status:</strong> {result.shouldDouble ? 'Timeframe doubled due to >6 candles' : 'Continuing at current timeframe'}</div>
                  {result.marketClosed && (
                    <div className="text-red-600"><strong>Market:</strong> Closed - analysis stopped</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-green-800 mb-1">Progressive Summary</div>
            <div className="text-xs text-green-700 space-y-1">
              <div><strong>Timeframe Progression:</strong> {progressiveResults.map(r => `${r.currentTimeframe}min`).join(' → ')}</div>
              <div><strong>Final Timeframe:</strong> {progressiveResults[progressiveResults.length - 1]?.nextTimeframe || initialTimeframe}min</div>
              <div><strong>Total Levels:</strong> {progressiveResults.length}</div>
              <div><strong>Market Status:</strong> {progressiveResults[0]?.marketClosed ? 'Closed' : 'Open'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="p-3 bg-gray-50 rounded-lg border">
        <div className="text-sm font-medium text-gray-700 mb-2">How Progressive Timeframe Doubling Works</div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Monitors candle count at current timeframe</div>
          <div>• When &gt;6 candles detected, doubles the timeframe (10min → 20min → 40min)</div>
          <div>• Applies 4-candle rule analysis at each new timeframe level</div>
          <div>• Continues doubling until market close or maximum timeframe reached</div>
          <div>• Provides multi-timeframe perspective for comprehensive analysis</div>
        </div>
      </div>
    </div>
  );
}