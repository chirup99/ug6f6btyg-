import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ProgressiveStepResult {
  step: 1 | 2 | 3;
  timeframe: number;
  c1Block: any[];
  c2Block: any[];
  c3Block?: any[];
  stepDescription: string;
  canProceedToNext: boolean;
  nextStepAction?: string;
  iterationNumber?: number;
  marketStatus?: string;
}

interface ContinuousProgressiveResult {
  totalIterations: number;
  allResults: ProgressiveStepResult[];
  finalStatus: string;
  marketCloseTime: string;
  executionStartTime: string;
  executionEndTime: string;
}

interface MarketStatus {
  marketOpen: boolean;
  marketCloseTime: string;
  currentTime: string;
  timeUntilClose: number;
}

export function ProgressiveThreeStepAnalyzer() {
  const [symbol, setSymbol] = useState('NSE:NIFTY50-INDEX');
  const [date, setDate] = useState('2025-07-25');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 'complete' | null>(null);
  const [stepResults, setStepResults] = useState<ProgressiveStepResult[]>([]);
  const [completeResults, setCompleteResults] = useState<any>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [continuousResults, setContinuousResults] = useState<ContinuousProgressiveResult | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  // Step 1 Mutation
  const step1Mutation = useMutation({
    mutationFn: async () => {
      return fetch('/api/battu-scan/progressive/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, date })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      console.log('🚀 [STEP 1] Success:', data);
      setStepResults([data.result]);
      setCurrentStep(2);
    },
    onError: (error) => {
      console.error('❌ [STEP 1] Failed:', error);
    }
  });

  // Step 2 Mutation
  const step2Mutation = useMutation({
    mutationFn: async () => {
      const step1Result = stepResults[0];
      return fetch('/api/battu-scan/progressive/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step1Result })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      console.log('🚀 [STEP 2] Success:', data);
      setStepResults(prev => [...prev, data.result]);
      
      // Check if we need Step 3
      const step1Result = stepResults[0];
      const c1Count = step1Result.c1Block.length;
      const c2Count = step1Result.c2Block.length;
      
      if (c1Count !== c2Count) {
        setCurrentStep(3);
      } else {
        setCurrentStep('complete');
      }
    },
    onError: (error) => {
      console.error('❌ [STEP 2] Failed:', error);
    }
  });

  // Step 3 Mutation
  const step3Mutation = useMutation({
    mutationFn: async () => {
      const step2Result = stepResults[1];
      return fetch('/api/battu-scan/progressive/step3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step2Result })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      console.log('🚀 [STEP 3] Success:', data);
      setStepResults(prev => [...prev, data.result]);
      setCurrentStep('complete');
    },
    onError: (error) => {
      console.error('❌ [STEP 3] Failed:', error);
    }
  });

  // Complete Analysis Mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      return fetch('/api/battu-scan/progressive/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, date })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      console.log('🌟 [COMPLETE] Success:', data);
      setCompleteResults(data);
      setCurrentStep('complete');
    },
    onError: (error) => {
      console.error('❌ [COMPLETE] Failed:', error);
    }
  });

  // Continuous Progressive Monitoring Mutation
  const continuousMutation = useMutation({
    mutationFn: async () => {
      return fetch('/api/battu-scan/progressive/continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, date })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      console.log('🔄 [CONTINUOUS] Success:', data);
      setContinuousResults(data);
      setContinuousMode(false);
    },
    onError: (error) => {
      console.error('❌ [CONTINUOUS] Failed:', error);
      setContinuousMode(false);
    }
  });

  // Market Status Check Mutation
  const marketStatusMutation = useMutation({
    mutationFn: async () => {
      return fetch('/api/battu-scan/progressive/market-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      console.log('📊 [MARKET-STATUS] Success:', data);
      setMarketStatus(data);
    },
    onError: (error) => {
      console.error('❌ [MARKET-STATUS] Failed:', error);
    }
  });

  const resetAnalysis = () => {
    setCurrentStep(null);
    setStepResults([]);
    setCompleteResults(null);
    setContinuousResults(null);
    setContinuousMode(false);
  };

  const startContinuousMonitoring = () => {
    setContinuousMode(true);
    resetAnalysis();
    continuousMutation.mutate();
  };

  const checkMarketStatus = () => {
    marketStatusMutation.mutate();
  };

  const executeStep1 = () => {
    setCurrentStep(1);
    step1Mutation.mutate();
  };

  const executeStep2 = () => {
    step2Mutation.mutate();
  };

  const executeStep3 = () => {
    step3Mutation.mutate();
  };

  const executeComplete = () => {
    resetAnalysis();
    completeMutation.mutate();
  };

  const isStepActive = (step: number) => currentStep === step;
  const isStepCompleted = (step: number) => stepResults.length >= step;
  const isStepPending = (step: number) => currentStep !== null && typeof currentStep === 'number' && currentStep < step;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
          Progressive 3-Step Block Analysis
        </h2>
        <p className="text-purple-700 dark:text-purple-300">
          Complete 3-step progressive methodology with block combinations
        </p>
      </div>

      {/* Input Controls */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-800 dark:text-purple-200">
            Analysis Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Symbol
              </label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="NSE:NIFTY50-INDEX"
                className="border-purple-300 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-purple-300 focus:border-purple-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={executeComplete}
              disabled={completeMutation.isPending || continuousMode}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Complete Analysis
                </>
              )}
            </Button>
            
            <Button
              onClick={startContinuousMonitoring}
              disabled={continuousMutation.isPending || continuousMode}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {continuousMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Until Market Close
                </>
              )}
            </Button>
            
            <Button
              onClick={checkMarketStatus}
              disabled={marketStatusMutation.isPending}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {marketStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Market Status"
              )}
            </Button>
            
            <Button
              onClick={resetAnalysis}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Status Display */}
      {marketStatus && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              Market Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    marketStatus.marketOpen ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">
                    {marketStatus.marketOpen ? 'Market Open' : 'Market Closed'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current Time: {new Date(marketStatus.currentTime).toLocaleTimeString()}
                </p>
                {marketStatus.marketOpen && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {marketStatus.timeUntilClose} minutes until close
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Market Close: {new Date(marketStatus.marketCloseTime).toLocaleTimeString()}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Continuous monitoring: {marketStatus.recommendations?.canStartContinuous ? '✅ Available' : '❌ Not available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continuous Monitoring Results */}
      {continuousResults && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              Continuous Monitoring Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {continuousResults.totalIterations}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Total Iterations
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {continuousResults.allResults.length}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Steps Completed
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {continuousResults.finalStatus}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Final Status
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Execution Period:</strong> {new Date(continuousResults.executionStartTime).toLocaleTimeString()} - {new Date(continuousResults.executionEndTime).toLocaleTimeString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Market Close:</strong> {new Date(continuousResults.marketCloseTime).toLocaleTimeString()}
              </p>
            </div>

            {continuousResults.allResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Progressive Steps Summary
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {continuousResults.allResults.map((result, index) => (
                    <div key={index} className="p-3 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="text-xs mb-1">
                            Iteration {result.iterationNumber || index + 1} - Step {result.step}
                          </Badge>
                          <p className="text-sm font-medium">{result.stepDescription}</p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            C1: {result.c1Block.length}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            C2: {result.c2Block.length}
                          </Badge>
                          {result.c3Block && (
                            <Badge variant="outline" className="text-xs">
                              C3: {result.c3Block.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <Card className={`${
          isStepActive(1) ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' :
          isStepCompleted(1) ? 'border-green-500 bg-green-50 dark:bg-green-950' :
          'border-gray-200 dark:border-gray-700'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isStepCompleted(1) ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <div className={`w-4 h-4 rounded-full ${
                  isStepActive(1) ? 'bg-purple-600' : 'bg-gray-300'
                }`} />
              )}
              Step 1: 5-min Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Start with 5-min timeframe, 4 candles, wait for 5th and 6th
            </p>
            {stepResults[0] && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    C1: {stepResults[0].c1Block.length}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    C2: {stepResults[0].c2Block.length}
                  </Badge>
                  {stepResults[0].c3Block && (
                    <Badge variant="outline" className="text-xs">
                      C3: {stepResults[0].c3Block.length}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stepResults[0].stepDescription}
                </p>
              </div>
            )}
            {!isStepCompleted(1) && (
              <Button
                size="sm"
                onClick={executeStep1}
                disabled={step1Mutation.isPending || currentStep !== null}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {step1Mutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Execute Step 1'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className={`${
          isStepActive(2) ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' :
          isStepCompleted(2) ? 'border-green-500 bg-green-50 dark:bg-green-950' :
          isStepPending(2) ? 'border-orange-300 bg-orange-50 dark:bg-orange-950' :
          'border-gray-200 dark:border-gray-700'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isStepCompleted(2) ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <div className={`w-4 h-4 rounded-full ${
                  isStepActive(2) ? 'bg-purple-600' :
                  isStepPending(2) ? 'bg-orange-400' : 'bg-gray-300'
                }`} />
              )}
              Step 2: Count Equality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              If C1 count = C2 count: combine C1+C2 → new C1, C3 → new C2
            </p>
            {stepResults[1] && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    NEW C1: {stepResults[1].c1Block.length}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    NEW C2: {stepResults[1].c2Block.length}
                  </Badge>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stepResults[1].stepDescription}
                </p>
              </div>
            )}
            {isStepActive(2) && (
              <Button
                size="sm"
                onClick={executeStep2}
                disabled={step2Mutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {step2Mutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Execute Step 2'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className={`${
          isStepActive(3) ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' :
          isStepCompleted(3) ? 'border-green-500 bg-green-50 dark:bg-green-950' :
          isStepPending(3) ? 'border-orange-300 bg-orange-50 dark:bg-orange-950' :
          'border-gray-200 dark:border-gray-700'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isStepCompleted(3) ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <div className={`w-4 h-4 rounded-full ${
                  isStepActive(3) ? 'bg-purple-600' :
                  isStepPending(3) ? 'bg-orange-400' : 'bg-gray-300'
                }`} />
              )}
              Step 3: C2+C3 Combination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              If C1 count ≠ C2 count: combine C2+C3 → new C2, C1 unchanged
            </p>
            {stepResults[2] && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    C1: {stepResults[2].c1Block.length}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    NEW C2: {stepResults[2].c2Block.length}
                  </Badge>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {stepResults[2].stepDescription}
                </p>
              </div>
            )}
            {isStepActive(3) && (
              <Button
                size="sm"
                onClick={executeStep3}
                disabled={step3Mutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {step3Mutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Execute Step 3'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete Results */}
      {completeResults && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Complete Progressive Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {completeResults.steps}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Steps Completed
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {completeResults.symbol}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Symbol Analyzed
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {completeResults.date}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Analysis Date
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  5min
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Base Timeframe
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                Progressive Steps Executed:
              </h4>
              {completeResults.results?.map((result: ProgressiveStepResult, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Step {result.step}
                  </Badge>
                  <ArrowRight className="w-3 h-3 text-green-600" />
                  <span className="text-green-700 dark:text-green-300">
                    {result.stepDescription}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Methodology:</strong> {completeResults.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Methodology Info */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            Progressive 3-Step Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Step 1: 5-min Analysis</h4>
              <ul className="text-blue-600 dark:text-blue-400 space-y-1 text-xs">
                <li>• Start with 5-min timeframe</li>
                <li>• Analyze 4 candles initially</li>
                <li>• Wait for 5th and 6th candle completion</li>
                <li>• C1 Block = candles 1,2</li>
                <li>• C2 Block = candles 3,4</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Step 2: Count Equality</h4>
              <ul className="text-blue-600 dark:text-blue-400 space-y-1 text-xs">
                <li>• Check if count(C1) = count(C2)</li>
                <li>• If YES: C1+C2 → new C1</li>
                <li>• C3 (5th,6th) → new C2</li>
                <li>• If NO: proceed to Step 3</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Step 3: C2+C3 Combination</h4>
              <ul className="text-blue-600 dark:text-blue-400 space-y-1 text-xs">
                <li>• If count(C1) ≠ count(C2)</li>
                <li>• C2+C3 → new C2</li>
                <li>• C1 remains unchanged</li>
                <li>• Critical: C3 count = C2 count</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}