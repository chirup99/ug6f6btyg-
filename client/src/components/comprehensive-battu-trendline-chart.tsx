import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Clock, 
  Zap, 
  Database,
  Calculator,
  Layers,
  GitBranch,
  LineChart,
  Eye,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface BattuStep {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
  color: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  data?: any;
  trendlines?: any[];
  candles?: any[];
}

interface ComprehensiveBattuTrendlineChartProps {}

export default function ComprehensiveBattuTrendlineChart({}: ComprehensiveBattuTrendlineChartProps) {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:NIFTY50-INDEX');
  const [selectedDate, setSelectedDate] = useState('2025-07-25');
  const [selectedTimeframe, setSelectedTimeframe] = useState('10');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Define all Battu API workflow steps
  const [battuSteps, setBattuSteps] = useState<BattuStep[]>([
    {
      id: 'step1-base-data',
      title: 'Step 1: Fetch 1-Minute Base Data',
      description: 'Fetch complete 1-minute OHLC data for market session foundation',
      endpoint: '/api/battu-scan/intraday/fetch-one-minute-data',
      icon: <Database className="h-4 w-4" />,
      color: 'bg-blue-500',
      status: 'pending'
    },
    {
      id: 'step2-corrected-slope',
      title: 'Step 2: Corrected Slope Calculation',
      description: 'NEW 6-candle block methodology with exact Point A/B timestamps',
      endpoint: '/api/battu-scan/intraday/corrected-slope-calculation',
      icon: <Calculator className="h-4 w-4" />,
      color: 'bg-green-600',
      status: 'pending'
    },
    {
      id: 'step3-point-ab-extraction',
      title: 'Step 3: Point A/B Extraction',
      description: 'Extract exact timestamps from complete market session data',
      endpoint: '/api/battu-scan/point-ab/extract-from-session',
      icon: <Target className="h-4 w-4" />,
      color: 'bg-purple-600',
      status: 'pending'
    },
    {
      id: 'step4-progressive-analysis',
      title: 'Step 4: Progressive Timeframe Analysis',
      description: 'Progressive timeframe doubling and multi-level analysis',
      endpoint: '/api/battu-scan/intraday/progressive-timeframe-doubling',
      icon: <Layers className="h-4 w-4" />,
      color: 'bg-orange-600',
      status: 'pending'
    },
    {
      id: 'step5-t-rule',
      title: 'Step 5: T-Rule Implementation',
      description: 'C2 block + C3a methodology for 6th candle detection',
      endpoint: '/api/battu-scan/intraday/t-rule',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'bg-red-600',
      status: 'pending'
    },
    {
      id: 'step6-mini-4-rule',
      title: 'Step 6: Mini 4 Rule C3A Prediction',
      description: 'C2 block to predict C3a candles using Mini 4 Rule methodology',
      endpoint: '/api/battu-scan/intraday/find-c3a-from-c2',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-indigo-600',
      status: 'pending'
    },
    {
      id: 'step7-live-scanner',
      title: 'Step 7: Live Scanner Integration',
      description: 'Complete automated Battu live scanner system',
      endpoint: '/api/battu-scan/live/status',
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-cyan-600',
      status: 'pending'
    }
  ]);

  // Execute individual step
  const executeStep = async (step: BattuStep) => {
    setBattuSteps(prev => prev.map(s => 
      s.id === step.id ? { ...s, status: 'loading' } : s
    ));

    try {
      let response;
      const requestBody = {
        symbol: selectedSymbol,
        date: selectedDate,
        timeframe: parseInt(selectedTimeframe)
      };

      if (step.endpoint.includes('live/status')) {
        response = await fetch(step.endpoint);
      } else {
        response = await fetch(step.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      setBattuSteps(prev => prev.map(s => 
        s.id === step.id ? { 
          ...s, 
          status: 'completed', 
          data,
          trendlines: extractTrendlines(data),
          candles: extractCandles(data)
        } : s
      ));

      setCompletedSteps(prev => [...prev, step.id]);
      
    } catch (error) {
      console.error(`Step ${step.id} failed:`, error);
      setBattuSteps(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'error' } : s
      ));
    }
  };

  // Extract trendline data from API response
  const extractTrendlines = (data: any): any[] => {
    const trendlines: any[] = [];
    
    if (data?.slopes) {
      data.slopes.forEach((slope: any) => {
        trendlines.push({
          type: 'slope',
          trend: slope.trendType,
          pointA: slope.pointA,
          pointB: slope.pointB,
          slope: slope.slope,
          pattern: slope.patternName
        });
      });
    }

    if (data?.activeTrendlines) {
      Object.values(data.activeTrendlines).forEach((trendline: any) => {
        trendlines.push({
          type: 'active',
          trend: trendline.trend || (trendline.type === 'uptrend' ? 'uptrend' : 'downtrend'),
          startPoint: trendline.startPoint,
          endPoint: trendline.endPoint,
          slope: trendline.slope,
          pattern: trendline.pattern
        });
      });
    }

    if (data?.uptrend || data?.downtrend) {
      if (data.uptrend) {
        trendlines.push({
          type: 'prediction',
          trend: 'uptrend',
          startPoint: data.uptrend.startPoint,
          endPoint: data.uptrend.endPoint,
          confidence: data.uptrend.confidence,
          pattern: data.uptrend.pattern
        });
      }
      if (data.downtrend) {
        trendlines.push({
          type: 'prediction',
          trend: 'downtrend',
          startPoint: data.downtrend.startPoint,
          endPoint: data.downtrend.endPoint,
          confidence: data.downtrend.confidence,
          pattern: data.downtrend.pattern
        });
      }
    }

    return trendlines;
  };

  // Extract candle data from API response
  const extractCandles = (data: any): any[] => {
    const candles: any[] = [];
    
    if (data?.candleBlocks) {
      data.candleBlocks.forEach((block: any) => {
        candles.push({
          type: 'base',
          name: block.name,
          open: block.open,
          high: block.high,
          low: block.low,
          close: block.close,
          timestamp: block.startTime
        });
      });
    }

    if (data?.predictions) {
      Object.entries(data.predictions).forEach(([key, prediction]: [string, any]) => {
        candles.push({
          type: 'predicted',
          name: key,
          open: prediction.predictedOpen,
          high: prediction.predictedHigh,
          low: prediction.predictedLow,
          close: prediction.predictedClose,
          confidence: prediction.confidence
        });
      });
    }

    return candles;
  };

  // Execute all steps sequentially
  const executeAllSteps = async () => {
    setIsRunning(true);
    setCompletedSteps([]);
    
    for (let i = 0; i < battuSteps.length; i++) {
      setCurrentStep(i);
      await executeStep(battuSteps[i]);
      // Small delay between steps for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  // Reset all steps
  const resetSteps = () => {
    setBattuSteps(prev => prev.map(step => ({ ...step, status: 'pending', data: undefined })));
    setCompletedSteps([]);
    setCurrentStep(0);
  };

  // Comprehensive SVG Chart Component
  const ComprehensiveTrendlineChart = () => {
    const chartWidth = 1200;
    const chartHeight = 600;
    const padding = 80;
    
    // Collect all trendlines from completed steps
    const allTrendlines = battuSteps
      .filter(step => step.status === 'completed' && step.trendlines)
      .flatMap(step => step.trendlines || []);

    // Collect all candles from completed steps
    const allCandles = battuSteps
      .filter(step => step.status === 'completed' && step.candles)
      .flatMap(step => step.candles || []);

    if (allTrendlines.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Execute analysis steps to see trendline chart</p>
          </div>
        </div>
      );
    }

    // Calculate price range from all data points
    const allPrices = [
      ...allTrendlines.flatMap(t => [
        typeof t.pointA === 'object' ? t.pointA.price : t.startPoint,
        typeof t.pointB === 'object' ? t.pointB.price : t.endPoint
      ]).filter(p => p && !isNaN(p)),
      ...allCandles.flatMap(c => [c.high, c.low, c.open, c.close]).filter(p => p && !isNaN(p))
    ];

    if (allPrices.length === 0) return null;

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const priceBuffer = priceRange * 0.1;
    const scaledMinPrice = minPrice - priceBuffer;
    const scaledMaxPrice = maxPrice + priceBuffer;
    const scaledPriceRange = scaledMaxPrice - scaledMinPrice;

    // Price to Y coordinate conversion
    const priceToY = (price: number) => {
      return padding + ((scaledMaxPrice - price) / scaledPriceRange) * (chartHeight - 2 * padding);
    };

    // Time to X coordinate conversion (simplified for now)
    const timeToX = (index: number) => {
      return padding + (index * (chartWidth - 2 * padding)) / Math.max(allTrendlines.length - 1, 1);
    };

    return (
      <div className="w-full bg-white rounded-lg border p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Comprehensive Battu API Trendline Analysis</h3>
          <p className="text-sm text-gray-600">
            Complete workflow visualization showing all {completedSteps.length} analysis steps
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Price axis labels */}
            {Array.from({ length: 6 }, (_, i) => {
              const price = scaledMaxPrice - (scaledPriceRange * i / 5);
              const y = priceToY(price);
              return (
                <g key={i}>
                  <line x1={padding - 10} y1={y} x2={padding} y2={y} stroke="#666" strokeWidth="1" />
                  <text x={padding - 15} y={y + 4} textAnchor="end" fontSize="12" fill="#666">
                    {price.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Draw trendlines */}
            {allTrendlines.map((trendline, index) => {
              const startPrice = typeof trendline.pointA === 'object' ? trendline.pointA.price : trendline.startPoint;
              const endPrice = typeof trendline.pointB === 'object' ? trendline.pointB.price : trendline.endPoint;
              
              if (!startPrice || !endPrice || isNaN(startPrice) || isNaN(endPrice)) return null;

              const x1 = timeToX(index);
              const y1 = priceToY(startPrice);
              const x2 = timeToX(index + 1);
              const y2 = priceToY(endPrice);
              
              const color = trendline.trend === 'uptrend' ? '#22c55e' : '#ef4444';
              const strokeWidth = trendline.type === 'slope' ? 3 : 2;
              const strokeDasharray = trendline.type === 'predicted' ? '5,5' : '0';

              return (
                <g key={index}>
                  {/* Trendline */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    opacity={0.8}
                  />
                  
                  {/* Point markers */}
                  <circle cx={x1} cy={y1} r="4" fill={color} />
                  <circle cx={x2} cy={y2} r="4" fill={color} />
                  
                  {/* Labels */}
                  <text x={x1} y={y1 - 8} textAnchor="middle" fontSize="10" fill={color} fontWeight="bold">
                    A
                  </text>
                  <text x={x2} y={y2 - 8} textAnchor="middle" fontSize="10" fill={color} fontWeight="bold">
                    B
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span>Uptrend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span>Downtrend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-500 border-dashed border-2"></div>
            <span>Predicted</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Comprehensive Battu API Trendline Chart
          </CardTitle>
          <CardDescription>
            Complete visualization of all Battu API analysis steps with trendline charts displaying Point A/B methodology, slope calculations, and predictive analysis
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Symbol</label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
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
              <label className="text-sm font-medium mb-2 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                onClick={executeAllSteps} 
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute All
                  </>
                )}
              </Button>
              <Button 
                onClick={resetSteps} 
                variant="outline"
                disabled={isRunning}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow">Workflow Steps</TabsTrigger>
          <TabsTrigger value="chart">Trendline Chart</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-4">
          <div className="grid gap-4">
            {battuSteps.map((step, index) => (
              <Card key={step.id} className={`transition-all duration-300 ${
                step.status === 'completed' ? 'border-green-200 bg-green-50' :
                step.status === 'loading' ? 'border-blue-200 bg-blue-50' :
                step.status === 'error' ? 'border-red-200 bg-red-50' :
                'border-gray-200'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${step.color} text-white`}>
                        {step.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'loading' ? 'secondary' :
                        step.status === 'error' ? 'destructive' :
                        'outline'
                      }>
                        {step.status === 'completed' ? '✓ Complete' :
                         step.status === 'loading' ? '⏳ Loading' :
                         step.status === 'error' ? '✗ Error' :
                         '⏸ Pending'}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeStep(step)}
                        disabled={isRunning}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {step.trendlines && step.trendlines.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        {step.trendlines.length} trendline(s) detected
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardContent className="pt-6">
              <ComprehensiveTrendlineChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {battuSteps
            .filter(step => step.status === 'completed' && step.data)
            .map(step => (
              <Card key={step.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {step.icon}
                    {step.title} - Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}