import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Clock, 
  Play,
  CheckCircle,
  Activity,
  DollarSign
} from 'lucide-react';

interface ValidTrade {
  symbol: string;
  date: string;
  timeframe: string;
  pattern: string;
  pointA: { price: number; timestamp: string; candle: string };
  pointB: { price: number; timestamp: string; candle: string };
  slope: { value: number; direction: 'uptrend' | 'downtrend'; duration: number };
  timingRules: {
    rule50Percent: { required: number; actual: number; valid: boolean };
    rule34Percent: { required: number; actual: number; valid: boolean };
  };
  triggerPoint: { price: number; timestamp: string; candle: string };
  exitPoint: { price: number; timestamp: string; method: string };
  tRule: { applied: boolean; c3Block: any[]; prediction: any };
  mini4Rule: { applied: boolean; c2Block: any[]; c3aPrediction: any };
  profitLoss: number;
  confidence: number;
}

export default function SimpleCompleteScanner() {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:NIFTY50-INDEX');
  const [selectedDate, setSelectedDate] = useState('2025-01-29');
  const [selectedTimeframe, setSelectedTimeframe] = useState('10');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [validTrades, setValidTrades] = useState<ValidTrade[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  // Complete Battu Scanner API Mutation
  const completeScanMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 Starting Complete Battu Scanner API call...');
      
      // Simulate progress updates during API call
      const steps = [
        { message: 'Fetching market session data...', progress: 20 },
        { message: 'Applying corrected slope calculation...', progress: 40 },
        { message: 'Extracting Point A/B with exact timestamps...', progress: 60 },
        { message: 'Validating 50%/34% timing rules...', progress: 80 }
      ];

      for (const step of steps) {
        setCurrentStep(step.message);
        setScanProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      const response = await apiRequest({
        url: '/api/battu-scan/complete-scanner',
        method: 'POST',
        body: {
          symbol: selectedSymbol,
          date: selectedDate,
          timeframe: selectedTimeframe,
          includeTimingRules: true,
          includeTRule: true,
          includeMini4Rule: true,
          marketOpenToClose: true
        }
      });
      console.log('✅ Complete Scanner API Response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('🎉 Complete Scanner Success:', data);
      setValidTrades(data.validTrades || []);
      setIsScanning(false);
      setScanProgress(100);
      setCurrentStep(`Complete scan finished - Found ${data.validTrades?.length || 0} valid trades!`);
    },
    onError: (error) => {
      console.error('❌ Complete Scanner Error:', error);
      setIsScanning(false);
      setCurrentStep('Scan failed - Check console for details');
    }
  });

  const runCompleteScanner = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setValidTrades([]);
    setCurrentStep('Initializing Complete Battu Scanner...');

    try {
      // Real API call to Complete Battu Scanner
      await completeScanMutation.mutateAsync();
    } catch (error) {
      console.error('Complete Scanner failed:', error);
      setCurrentStep('Scanner failed - Check API connection');
      setIsScanning(false);
    }
  };

  const getTotalProfitLoss = () => {
    return validTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  };

  const getAverageConfidence = () => {
    if (validTrades.length === 0) return 0;
    return Math.round(validTrades.reduce((sum, trade) => sum + trade.confidence, 0) / validTrades.length);
  };

  const getUptrendCount = () => validTrades.filter(t => t.slope.direction === 'uptrend').length;
  const getDowntrendCount = () => validTrades.filter(t => t.slope.direction === 'downtrend').length;

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Activity className="h-5 w-5" />
            Complete Battu Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Symbol</Label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                  <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                  <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Timeframe (minutes)</Label>
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
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              onClick={runCompleteScanner} 
              disabled={isScanning}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isScanning ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Complete Scanner
                </>
              )}
            </Button>

            {isScanning && (
              <div className="space-y-2">
                <Progress value={scanProgress} className="w-full" />
                <p className="text-sm text-gray-600">{currentStep}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scanner Results Summary */}
      {validTrades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Valid Trades</p>
                  <p className="text-2xl font-bold text-green-800">{validTrades.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">Uptrends/Downtrends</p>
                  <p className="text-2xl font-bold text-blue-800">{getUptrendCount()}/{getDowntrendCount()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700">Avg Confidence</p>
                  <p className="text-2xl font-bold text-purple-800">{getAverageConfidence()}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${getTotalProfitLoss() >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className={`h-5 w-5 ${getTotalProfitLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className={`text-sm ${getTotalProfitLoss() >= 0 ? 'text-green-700' : 'text-red-700'}`}>Total P&L</p>
                  <p className={`text-2xl font-bold ${getTotalProfitLoss() >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    ₹{getTotalProfitLoss().toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Valid Trades List */}
      {validTrades.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Valid Trades with Complete Analysis</h3>
          {validTrades.map((trade, index) => (
            <Card key={index} className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {trade.slope.direction === 'uptrend' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    {trade.pattern}
                  </CardTitle>
                  <Badge variant={trade.confidence >= 85 ? "default" : "secondary"}>
                    {trade.confidence}% confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Point A/B Analysis */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Point A/B Pattern</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Point A:</span> ₹{trade.pointA.price} at {trade.pointA.timestamp} ({trade.pointA.candle})</p>
                      <p><span className="font-medium">Point B:</span> ₹{trade.pointB.price} at {trade.pointB.timestamp} ({trade.pointB.candle})</p>
                      <p><span className="font-medium">Slope:</span> {trade.slope.value.toFixed(2)} pts/min ({trade.slope.duration}min)</p>
                    </div>
                  </div>

                  {/* Timing Rules */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Timing Rules (50%/34%)</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.timingRules.rule50Percent.valid ? "default" : "destructive"}>
                          50% Rule: {trade.timingRules.rule50Percent.valid ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.timingRules.rule34Percent.valid ? "default" : "destructive"}>
                          34% Rule: {trade.timingRules.rule34Percent.valid ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Trade Execution</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Trigger:</span> ₹{trade.triggerPoint.price} at {trade.triggerPoint.timestamp}</p>
                      <p><span className="font-medium">Exit:</span> ₹{trade.exitPoint.price} ({trade.exitPoint.method})</p>
                      <p className={`font-medium ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        P&L: ₹{trade.profitLoss.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advanced Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">T-Rule Analysis</h4>
                    <div className="text-sm">
                      <Badge variant={trade.tRule.applied ? "default" : "secondary"}>
                        {trade.tRule.applied ? 'Applied' : 'Not Applied'}
                      </Badge>
                      {trade.tRule.applied && (
                        <span className="ml-2 text-gray-600">
                          6th candle prediction: {(trade.tRule.prediction?.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Mini 4-Rule Analysis</h4>
                    <div className="text-sm">
                      <Badge variant={trade.mini4Rule.applied ? "default" : "secondary"}>
                        {trade.mini4Rule.applied ? 'Applied' : 'Not Applied'}
                      </Badge>
                      {trade.mini4Rule.applied && (
                        <span className="ml-2 text-gray-600">
                          C3a prediction: {(trade.mini4Rule.c3aPrediction?.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isScanning && validTrades.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
            <p className="text-gray-600">Run the Complete Battu Scanner to analyze valid trades with Point A/B patterns, timing rules, T-rule, and Mini 4-rule analysis.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}