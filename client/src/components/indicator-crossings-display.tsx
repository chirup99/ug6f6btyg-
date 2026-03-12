import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CandleData {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CrossingEvent {
  timestamp: number;
  time: string;
  price: number;
  type: 'EMA_CROSS_ABOVE' | 'EMA_CROSS_BELOW' | 'SMA_CROSS_ABOVE' | 'SMA_CROSS_BELOW' | 'RSI_OVERBOUGHT' | 'RSI_OVERSOLD';
  indicator: string;
  indicatorValue: number;
}

interface IndicatorCrossingsDisplayProps {
  selectedSymbol?: string;
  selectedDate?: string;
  selectedToDate?: string;
  selectedTimeframe?: string;
}

// EMA Calculation Function
function calculateEMA(prices: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const emaArray: (number | null)[] = [];
  
  if (prices.length === 0) return emaArray;
  
  // Fill initial values with null
  for (let i = 0; i < period - 1; i++) {
    emaArray.push(null);
  }
  
  // First EMA value is simple average of first 'period' values
  if (prices.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    emaArray.push(sum / period);
    
    // Calculate EMA for the rest
    for (let i = period; i < prices.length; i++) {
      const prevEMA = emaArray[i - 1] as number;
      emaArray.push(prices[i] * k + prevEMA * (1 - k));
    }
  }
  
  return emaArray;
}

// SMA Calculation Function
function calculateSMA(prices: number[], period: number): (number | null)[] {
  const smaArray: (number | null)[] = [];
  
  if (prices.length === 0 || period <= 0) return smaArray;
  
  // Fill initial values with null
  for (let i = 0; i < period - 1; i++) {
    smaArray.push(null);
  }
  
  // Calculate SMA values
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    smaArray.push(sum / period);
  }
  
  return smaArray;
}

// RSI Calculation Function
function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
  const rsiArray: (number | null)[] = [];
  
  if (prices.length === 0 || period <= 0) return rsiArray;
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Fill initial values with null (need period + 1 for RSI since we lose one value for price change)
  for (let i = 0; i < period; i++) {
    rsiArray.push(null);
  }
  
  if (gains.length >= period) {
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    // Calculate first RSI value
    const rs = avgGain / (avgLoss || 0.0001); // Avoid division by zero
    rsiArray.push(100 - (100 / (1 + rs)));
    
    // Calculate subsequent RSI values using smoothed averages
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      const rs = avgGain / (avgLoss || 0.0001);
      rsiArray.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsiArray;
}

export function IndicatorCrossingsDisplay({ selectedSymbol = 'NSE:INFY-EQ', selectedDate, selectedToDate, selectedTimeframe = '1' }: IndicatorCrossingsDisplayProps) {
  const [crossings, setCrossings] = useState<CrossingEvent[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingStrategy, setIsTestingStrategy] = useState(false);
  
  // Indicator Settings State (same as Advanced Interactive Chart)
  const [indicatorSettings, setIndicatorSettings] = useState({
    ema: {
      enabled: true,
      period: 12,
      color: '#FF6B35'
    },
    sma: {
      enabled: true,
      period: 20,
      color: '#00BCD4'
    },
    rsi: {
      enabled: true,
      period: 14,
      color: '#9C27B0'
    }
  });

  // Use the same date format and range as TradingMaster
  const currentFromDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const currentToDate = selectedToDate || currentFromDate;

  // Fetch historical data using same date range approach as TradingMaster
  const { data: candleData, isLoading } = useQuery({
    queryKey: ['/api/historical-data', selectedSymbol, currentFromDate, currentToDate, selectedTimeframe],
    queryFn: async () => {
      const response = await fetch('/api/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          resolution: selectedTimeframe,
          range_from: currentFromDate,
          range_to: currentToDate
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      return response.json();
    }
  });

  useEffect(() => {
    if (!candleData?.candles || candleData.candles.length === 0) {
      setCrossings([]);
      return;
    }

    const candles: CandleData[] = candleData.candles;
    const closePrices = candles.map(c => c.close);
    
    // Calculate indicators using user-configurable periods
    const emaValues = indicatorSettings.ema.enabled ? calculateEMA(closePrices, indicatorSettings.ema.period) : [];
    const smaValues = indicatorSettings.sma.enabled ? calculateSMA(closePrices, indicatorSettings.sma.period) : [];
    const rsiValues = indicatorSettings.rsi.enabled ? calculateRSI(closePrices, indicatorSettings.rsi.period) : [];
    
    const detectedCrossings: CrossingEvent[] = [];
    
    // Detect crossings
    for (let i = 1; i < candles.length; i++) {
      const currentCandle = candles[i];
      const prevCandle = candles[i - 1];
      
      // EMA Crossings (only if enabled)
      if (indicatorSettings.ema.enabled && emaValues[i] !== null && emaValues[i - 1] !== null) {
        const currentEMA = emaValues[i] as number;
        const prevEMA = emaValues[i - 1] as number;
        
        // Price crosses above EMA
        if (prevCandle.close <= prevEMA && currentCandle.close > currentEMA) {
          detectedCrossings.push({
            timestamp: currentCandle.timestamp,
            time: format(new Date(currentCandle.timestamp * 1000), 'HH:mm:ss'),
            price: currentCandle.close,
            type: 'EMA_CROSS_ABOVE',
            indicator: `EMA-${indicatorSettings.ema.period}`,
            indicatorValue: currentEMA
          });
        }
        
        // Price crosses below EMA
        if (prevCandle.close >= prevEMA && currentCandle.close < currentEMA) {
          detectedCrossings.push({
            timestamp: currentCandle.timestamp,
            time: format(new Date(currentCandle.timestamp * 1000), 'HH:mm:ss'),
            price: currentCandle.close,
            type: 'EMA_CROSS_BELOW',
            indicator: `EMA-${indicatorSettings.ema.period}`,
            indicatorValue: currentEMA
          });
        }
      }
      
      // SMA Crossings (only if enabled)
      if (indicatorSettings.sma.enabled && smaValues[i] !== null && smaValues[i - 1] !== null) {
        const currentSMA = smaValues[i] as number;
        const prevSMA = smaValues[i - 1] as number;
        
        // Price crosses above SMA
        if (prevCandle.close <= prevSMA && currentCandle.close > currentSMA) {
          detectedCrossings.push({
            timestamp: currentCandle.timestamp,
            time: format(new Date(currentCandle.timestamp * 1000), 'HH:mm:ss'),
            price: currentCandle.close,
            type: 'SMA_CROSS_ABOVE',
            indicator: `SMA-${indicatorSettings.sma.period}`,
            indicatorValue: currentSMA
          });
        }
        
        // Price crosses below SMA
        if (prevCandle.close >= prevSMA && currentCandle.close < currentSMA) {
          detectedCrossings.push({
            timestamp: currentCandle.timestamp,
            time: format(new Date(currentCandle.timestamp * 1000), 'HH:mm:ss'),
            price: currentCandle.close,
            type: 'SMA_CROSS_BELOW',
            indicator: `SMA-${indicatorSettings.sma.period}`,
            indicatorValue: currentSMA
          });
        }
      }
      
      // RSI Overbought/Oversold (only if enabled)
      if (indicatorSettings.rsi.enabled && rsiValues[i] !== null && rsiValues[i - 1] !== null) {
        const currentRSI = rsiValues[i] as number;
        const prevRSI = rsiValues[i - 1] as number;
        
        // RSI crosses above 70 (overbought)
        if (prevRSI <= 70 && currentRSI > 70) {
          detectedCrossings.push({
            timestamp: currentCandle.timestamp,
            time: format(new Date(currentCandle.timestamp * 1000), 'HH:mm:ss'),
            price: currentCandle.close,
            type: 'RSI_OVERBOUGHT',
            indicator: `RSI-${indicatorSettings.rsi.period}`,
            indicatorValue: currentRSI
          });
        }
        
        // RSI crosses below 30 (oversold)
        if (prevRSI >= 30 && currentRSI < 30) {
          detectedCrossings.push({
            timestamp: currentCandle.timestamp,
            time: format(new Date(currentCandle.timestamp * 1000), 'HH:mm:ss'),
            price: currentCandle.close,
            type: 'RSI_OVERSOLD',
            indicator: `RSI-${indicatorSettings.rsi.period}`,
            indicatorValue: currentRSI
          });
        }
      }
    }
    
    // Sort by timestamp
    detectedCrossings.sort((a, b) => a.timestamp - b.timestamp);
    setCrossings(detectedCrossings);
    
  }, [candleData, indicatorSettings.ema.enabled, indicatorSettings.ema.period,
      indicatorSettings.sma.enabled, indicatorSettings.sma.period,
      indicatorSettings.rsi.enabled, indicatorSettings.rsi.period]);

  const handleTestStrategy = async () => {
    setIsTestingStrategy(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Testing strategy: indicator-ema with EMA indicator');
      
      // Use the same crossings data that's already calculated
      const testResultData = {
        strategy: 'indicator-ema',
        crossings: crossings,
        totalSignals: crossings.length,
        indicators: {
          ema: indicatorSettings.ema,
          sma: indicatorSettings.sma,
          rsi: indicatorSettings.rsi
        },
        symbol: selectedSymbol,
        date: new Date().toISOString().split('T')[0],
        timeframe: selectedTimeframe
      };
      
      setTestResults(testResultData);
      console.log('✅ Strategy test completed:', testResultData);
      
    } catch (error) {
      console.error('❌ Strategy test failed:', error);
      setTestResults({ error: 'Strategy test failed' });
    } finally {
      setIsTestingStrategy(false);
    }
  };

  const getEventColor = (type: CrossingEvent['type']) => {
    switch (type) {
      case 'EMA_CROSS_ABOVE':
      case 'SMA_CROSS_ABOVE':
        return 'text-green-400';
      case 'EMA_CROSS_BELOW':
      case 'SMA_CROSS_BELOW':
        return 'text-red-400';
      case 'RSI_OVERBOUGHT':
        return 'text-orange-400';
      case 'RSI_OVERSOLD':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getEventDescription = (crossing: CrossingEvent) => {
    switch (crossing.type) {
      case 'EMA_CROSS_ABOVE':
        return `Price crossed ABOVE ${crossing.indicator}`;
      case 'EMA_CROSS_BELOW':
        return `Price crossed BELOW ${crossing.indicator}`;
      case 'SMA_CROSS_ABOVE':
        return `Price crossed ABOVE ${crossing.indicator}`;
      case 'SMA_CROSS_BELOW':
        return `Price crossed BELOW ${crossing.indicator}`;
      case 'RSI_OVERBOUGHT':
        return `RSI entered OVERBOUGHT zone (>70)`;
      case 'RSI_OVERSOLD':
        return `RSI entered OVERSOLD zone (<30)`;
      default:
        return 'Unknown crossing';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Indicator Line Crossings
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading crossings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Indicator Line Crossings
        </h3>
        <span className="text-sm text-gray-500">
          {selectedSymbol} - {new Date().toLocaleDateString()}
        </span>
      </div>
      
      {/* Indicator Controls (same as Advanced Interactive Chart) */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex flex-wrap gap-2 items-center">
          {/* EMA Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIndicatorSettings(prev => ({ 
                ...prev, 
                ema: { ...prev.ema, enabled: !prev.ema.enabled } 
              }))}
              variant={indicatorSettings.ema.enabled ? "default" : "outline"}
              size="sm"
              data-testid="button-toggle-ema"
              title={`Toggle EMA-${indicatorSettings.ema.period} Indicator`}
            >
              EMA-{indicatorSettings.ema.period} {indicatorSettings.ema.enabled ? 'ON' : 'OFF'}
            </Button>
            {indicatorSettings.ema.enabled && (
              <Select 
                value={indicatorSettings.ema.period.toString()} 
                onValueChange={(value) => setIndicatorSettings(prev => ({ 
                  ...prev, 
                  ema: { ...prev.ema, period: parseInt(value) } 
                }))}
                data-testid="select-ema-period"
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* SMA Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIndicatorSettings(prev => ({ 
                ...prev, 
                sma: { ...prev.sma, enabled: !prev.sma.enabled } 
              }))}
              variant={indicatorSettings.sma.enabled ? "default" : "outline"}
              size="sm"
              data-testid="button-toggle-sma"
              title={`Toggle SMA-${indicatorSettings.sma.period} Indicator`}
            >
              SMA-{indicatorSettings.sma.period} {indicatorSettings.sma.enabled ? 'ON' : 'OFF'}
            </Button>
            {indicatorSettings.sma.enabled && (
              <Select 
                value={indicatorSettings.sma.period.toString()} 
                onValueChange={(value) => setIndicatorSettings(prev => ({ 
                  ...prev, 
                  sma: { ...prev.sma, period: parseInt(value) } 
                }))}
                data-testid="select-sma-period"
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* RSI Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIndicatorSettings(prev => ({ 
                ...prev, 
                rsi: { ...prev.rsi, enabled: !prev.rsi.enabled } 
              }))}
              variant={indicatorSettings.rsi.enabled ? "default" : "outline"}
              size="sm"
              data-testid="button-toggle-rsi"
              title={`Toggle RSI-${indicatorSettings.rsi.period} Indicator`}
            >
              RSI-{indicatorSettings.rsi.period} {indicatorSettings.rsi.enabled ? 'ON' : 'OFF'}
            </Button>
            {indicatorSettings.rsi.enabled && (
              <Select 
                value={indicatorSettings.rsi.period.toString()} 
                onValueChange={(value) => setIndicatorSettings(prev => ({ 
                  ...prev, 
                  rsi: { ...prev.rsi, period: parseInt(value) } 
                }))}
                data-testid="select-rsi-period"
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                  <SelectItem value="21">21</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Test Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleTestStrategy}
              variant="secondary"
              size="sm"
              disabled={isTestingStrategy}
              data-testid="button-test-strategy"
              title="Test current indicator strategy"
            >
              {isTestingStrategy ? 'Testing...' : 'Test'}
            </Button>
          </div>
        </div>
      </div>
      
      {crossings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No indicator crossings detected for this date.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {crossings.map((crossing, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`font-medium ${getEventColor(crossing.type)}`}>
                    {getEventDescription(crossing)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Time: {crossing.time} | Price: ₹{crossing.price.toFixed(2)}
                  </div>
                  {crossing.type.includes('RSI') ? (
                    <div className="text-xs text-gray-500 mt-1">
                      RSI Value: {crossing.indicatorValue.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">
                      {crossing.indicator} Value: ₹{crossing.indicatorValue.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    crossing.type.includes('ABOVE') || crossing.type === 'RSI_OVERSOLD'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : crossing.type.includes('BELOW') || crossing.type === 'RSI_OVERBOUGHT'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {crossing.type.includes('ABOVE') || crossing.type === 'RSI_OVERSOLD' ? 'BULLISH' : 'BEARISH'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {crossings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total crossings detected: {crossings.length}
          </div>
        </div>
      )}

      {/* Test Results Display */}
      {testResults && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
            Strategy Test Results
          </h4>
          {testResults.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {testResults.error}
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Total signals detected: {testResults.totalSignals || 0}
              </div>
              
              {testResults.crossings && testResults.crossings.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {testResults.crossings.map((crossing: CrossingEvent, index: number) => (
                    <div
                      key={index}
                      className="border border-blue-200 dark:border-blue-600 rounded-lg p-3 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`font-medium ${getEventColor(crossing.type)}`}>
                            {getEventDescription(crossing)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Time: {crossing.time} | Price: ₹{crossing.price.toFixed(2)}
                          </div>
                          {crossing.type.includes('RSI') ? (
                            <div className="text-xs text-gray-500 mt-1">
                              RSI Value: {crossing.indicatorValue.toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1">
                              {crossing.indicator} Value: ₹{crossing.indicatorValue.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            crossing.type.includes('ABOVE') || crossing.type === 'RSI_OVERSOLD'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : crossing.type.includes('BELOW') || crossing.type === 'RSI_OVERBOUGHT'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {crossing.type.includes('ABOVE') || crossing.type === 'RSI_OVERSOLD' ? 'BULLISH' : 
                             crossing.type.includes('BELOW') || crossing.type === 'RSI_OVERBOUGHT' ? 'BEARISH' : 'NEUTRAL'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No indicator crossings detected for test.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}