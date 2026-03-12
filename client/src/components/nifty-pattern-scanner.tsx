import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Search, 
  Clock, 
  Target, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  LineChart,
  Zap,
  Timer,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface PatternResult {
  pattern: string;
  timeframe: string;
  confidence: number;
  breakoutLevel: number;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'uptrend' | 'downtrend';
  trendlineDetails?: {
    slope: number;
    breakLevel: number;
    isSpecialPattern?: boolean;
  };
  c1Block?: any;
  c2Block?: any;
}

interface ScanResult {
  symbol: string;
  timestamp: string;
  patterns: PatternResult[];
  marketStatus: 'open' | 'closed';
  nextAnalysisTime?: string;
}

export function NiftyPatternScanner() {
  const [fromDate, setFromDate] = useState(format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTimeframe, setSelectedTimeframe] = useState('40');
  const [scanMode, setScanMode] = useState<'manual' | 'auto'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [activePatterns, setActivePatterns] = useState<PatternResult[]>([]);
  const queryClient = useQueryClient();

  // Available timeframes for pattern analysis
  const timeframes = [
    { value: '10', label: '10 Minutes' },
    { value: '20', label: '20 Minutes' },
    { value: '40', label: '40 Minutes' },
    { value: '80', label: '80 Minutes' },
    { value: '160', label: '160 Minutes' },
    { value: '320', label: '320 Minutes' }
  ];

  // Pattern analysis types
  const analysisTypes = [
    { key: 'four-candle', name: '4-Candle Rule', endpoint: '/api/battu-scan/intraday/four-candle-rule' },
    { key: 'extended-four', name: 'Extended 4-Candle', endpoint: '/api/battu-scan/intraday/extended-four-candle-rule' },
    { key: 'fractal', name: 'Fractal Analysis', endpoint: '/api/battu-scan/intraday/fractal-four-candle-rule' },
    { key: 'three-candle', name: '3-Candle Rule', endpoint: '/api/battu-scan/intraday/3-candle-rule' },
    { key: 't-rule', name: 'T-Rule Analysis', endpoint: '/api/battu-scan/intraday/t-rule' },
    { key: 'step4', name: 'Step 4 Progressive', endpoint: '/api/battu-scan/intraday/step4-progressive-analysis' }
  ];

  // Perform pattern scan mutation
  const performScan = useMutation({
    mutationFn: async (analysisType: string) => {
      const endpoint = analysisTypes.find(t => t.key === analysisType)?.endpoint;
      if (!endpoint) throw new Error('Invalid analysis type');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: 'NSE:NIFTY50-INDEX',
          fromDate,
          toDate,
          timeframe: parseInt(selectedTimeframe),
          startTimeframe: parseInt(selectedTimeframe),
          maxDepth: 3,
          fractalDepth: 3,
          initialTimeframe: parseInt(selectedTimeframe)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to perform ${analysisType} analysis`);
      }
      
      return response.json();
    },
    onSuccess: (data, analysisType) => {
      // Process and format the results
      const patterns = extractPatternsFromResult(data, analysisType);
      const newResult: ScanResult = {
        symbol: 'NIFTY50',
        timestamp: new Date().toISOString(),
        patterns,
        marketStatus: 'open' // TODO: Add real market status check
      };
      
      setScanResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
      setActivePatterns(patterns);
    },
  });

  // Extract patterns from API response
  const extractPatternsFromResult = (data: any, analysisType: string): PatternResult[] => {
    const patterns: PatternResult[] = [];
    
    try {
      if (data.uptrend) {
        patterns.push({
          pattern: `${analysisType.toUpperCase()} Uptrend`,
          timeframe: `${selectedTimeframe}min`,
          confidence: data.uptrend.confidence || 75,
          breakoutLevel: data.uptrend.breakLevel || data.uptrend.trendline?.breakLevel || 0,
          riskLevel: data.uptrend.isHighRisk ? 'high' : 'medium',
          trend: 'uptrend',
          trendlineDetails: data.uptrend.trendlineDetails,
          c1Block: data.c1Block,
          c2Block: data.c2Block
        });
      }
      
      if (data.downtrend) {
        patterns.push({
          pattern: `${analysisType.toUpperCase()} Downtrend`,
          timeframe: `${selectedTimeframe}min`,
          confidence: data.downtrend.confidence || 75,
          breakoutLevel: data.downtrend.breakLevel || data.downtrend.trendline?.breakLevel || 0,
          riskLevel: data.downtrend.isHighRisk ? 'high' : 'medium',
          trend: 'downtrend',
          trendlineDetails: data.downtrend.trendlineDetails,
          c1Block: data.c1Block,
          c2Block: data.c2Block
        });
      }

      // Handle progressive analysis results
      if (data.progressiveAnalysis && Array.isArray(data.progressiveAnalysis)) {
        data.progressiveAnalysis.forEach((analysis: any, index: number) => {
          if (analysis.uptrend || analysis.downtrend) {
            const trendData = analysis.uptrend || analysis.downtrend;
            patterns.push({
              pattern: `Progressive ${analysis.uptrend ? 'Uptrend' : 'Downtrend'} L${index + 1}`,
              timeframe: `${analysis.timeframe || selectedTimeframe}min`,
              confidence: trendData.confidence || 70,
              breakoutLevel: trendData.breakLevel || 0,
              riskLevel: 'medium',
              trend: analysis.uptrend ? 'uptrend' : 'downtrend'
            });
          }
        });
      }

      // Handle fractal analysis results
      if (data.fractalLevels && Array.isArray(data.fractalLevels)) {
        data.fractalLevels.forEach((level: any, index: number) => {
          if (level.uptrend || level.downtrend) {
            const trendData = level.uptrend || level.downtrend;
            patterns.push({
              pattern: `Fractal ${level.uptrend ? 'Uptrend' : 'Downtrend'} L${index + 1}`,
              timeframe: `${level.timeframe || selectedTimeframe}min`,
              confidence: trendData.confidence || 70,
              breakoutLevel: trendData.breakLevel || 0,
              riskLevel: 'low',
              trend: level.uptrend ? 'uptrend' : 'downtrend'
            });
          }
        });
      }

    } catch (error) {
      console.error('Error extracting patterns:', error);
    }
    
    return patterns;
  };

  // Auto-scan functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (scanMode === 'auto' && isScanning) {
      interval = setInterval(() => {
        // Rotate through different analysis types
        const currentType = analysisTypes[Math.floor(Date.now() / 30000) % analysisTypes.length];
        performScan.mutate(currentType.key);
      }, 30000); // Every 30 seconds
    }
    
    return () => clearInterval(interval);
  }, [scanMode, isScanning]);

  // Manual scan function
  const handleManualScan = (analysisType: string) => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    
    performScan.mutate(analysisType);
  };

  // Get risk color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get trend color and icon
  const getTrendDisplay = (trend: string) => {
    if (trend === 'uptrend') {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-green-600',
        bg: 'bg-green-50'
      };
    } else {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        color: 'text-red-600',
        bg: 'bg-red-50'
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            NIFTY Index Pattern Scanner
          </CardTitle>
          <CardDescription>
            Advanced pattern detection using Battu API logic with breakout timeframe rules
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Scan Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scan-mode">Scan Mode</Label>
              <Select value={scanMode} onValueChange={(value: 'manual' | 'auto') => setScanMode(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="auto">Auto (30s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={() => setIsScanning(!isScanning)}
                className="w-full"
                variant={isScanning ? "destructive" : "default"}
              >
                {isScanning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar for scanning */}
          {performScan.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Scanning patterns...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Type Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pattern Analysis Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="four-candle" className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-4">
              {analysisTypes.map((type) => (
                <TabsTrigger key={type.key} value={type.key} className="text-xs">
                  {type.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {analysisTypes.map((type) => (
              <TabsContent key={type.key} value={type.key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{type.name}</h3>
                    <p className="text-sm text-gray-600">
                      {type.key === 'four-candle' && 'Classic 4-candle pattern detection with C1/C2 block analysis'}
                      {type.key === 'extended-four' && 'Extended analysis with C3 block methodology for 6th candle prediction'}
                      {type.key === 'fractal' && 'Recursive multi-timeframe analysis with configurable depth'}
                      {type.key === 'three-candle' && 'Advanced 3-candle rule with dual trendline system'}
                      {type.key === 't-rule' && 'Advanced extended rule with 10min minimum and fractal analysis'}
                      {type.key === 'step4' && 'Progressive multi-timeframe analysis with timeframe doubling'}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleManualScan(type.key)}
                    disabled={performScan.isPending}
                    size="sm"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Patterns */}
      {activePatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Active Patterns Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePatterns.map((pattern, index) => {
                const trendDisplay = getTrendDisplay(pattern.trend);
                return (
                  <Card key={index} className={`border-l-4 ${pattern.trend === 'uptrend' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`flex items-center gap-2 ${trendDisplay.color}`}>
                          {trendDisplay.icon}
                          <span className="font-semibold">{pattern.pattern}</span>
                        </div>
                        <Badge className={getRiskColor(pattern.riskLevel)}>
                          {pattern.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timeframe:</span>
                          <span className="font-medium">{pattern.timeframe}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{pattern.confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Breakout Level:</span>
                          <span className="font-medium">{pattern.breakoutLevel.toFixed(2)}</span>
                        </div>
                        {pattern.trendlineDetails && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Slope:</span>
                            <span className="font-medium">{pattern.trendlineDetails.slope.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scan History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scans performed yet. Start a scan to see pattern detection results.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scanResults.slice(0, 5).map((result, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{result.symbol}</span>
                        <Badge variant="outline">{result.marketStatus}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(result.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.patterns.map((pattern, pIndex) => {
                        const trendDisplay = getTrendDisplay(pattern.trend);
                        return (
                          <Badge
                            key={pIndex}
                            variant="outline"
                            className={`${trendDisplay.color} ${trendDisplay.bg} border-current`}
                          >
                            {pattern.pattern} ({pattern.confidence}%)
                          </Badge>
                        );
                      })}
                      {result.patterns.length === 0 && (
                        <span className="text-sm text-gray-500 italic">No patterns detected</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {performScan.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Scan Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {(performScan.error as Error)?.message || 'An error occurred during pattern scanning'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}