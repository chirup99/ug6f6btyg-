import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarIcon, TrendingUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HistoricalDataResponse {
  symbol: string;
  resolution: string;
  range_from: string;
  range_to: string;
  candles: CandleData[];
}

const timeframes = [
  { value: '1', label: '1 min' },
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '40', label: '40 min' },
  { value: '60', label: '1 hour' },
  { value: '80', label: '80 min' },
  { value: '120', label: '2 hours' },
  { value: '160', label: '160 min' },
  { value: '240', label: '4 hours' },
  { value: '320', label: '320 min' },
  { value: '1D', label: '1 day' },
];

const symbols = [
  { value: 'NSE:NIFTY50-INDEX', label: 'NIFTY 50' },
  { value: 'NSE:INFY-EQ', label: 'INFOSYS' },
  { value: 'NSE:RELIANCE-EQ', label: 'RELIANCE' },
  { value: 'NSE:TCS-EQ', label: 'TCS' },
];

export function CandlestickChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState('NSE:INFY-EQ');
  const [selectedTimeframe, setSelectedTimeframe] = useState('40');
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)); // 3 days ago
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  // Fetch historical data
  const { data: historicalData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/historical-data', selectedSymbol, selectedTimeframe, fromDate, toDate],
    queryFn: async (): Promise<HistoricalDataResponse> => {
      if (!fromDate || !toDate) throw new Error('Date range is required');
      
      const response = await fetch('/api/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          resolution: selectedTimeframe,
          range_from: format(fromDate, 'yyyy-MM-dd'),
          range_to: format(toDate, 'yyyy-MM-dd'),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!fromDate && !!toDate,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#e1e1e1' },
          horzLines: { color: '#e1e1e1' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#e1e1e1',
        },
        timeScale: {
          borderColor: '#e1e1e1',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350', 
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          chart.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, []);

  // Update chart data when historical data changes
  useEffect(() => {
    if (!historicalData?.candles || !candlestickSeriesRef.current) return;

    const chartData: CandlestickData[] = historicalData.candles.map(candle => ({
      time: (candle.timestamp) as any,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })).sort((a, b) => (a.time as number) - (b.time as number));

    candlestickSeriesRef.current.setData(chartData);
    
    // Fit content to show all data
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [historicalData]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Candlestick Chart
            </CardTitle>
            <CardDescription>
              Real-time OHLC data visualization from Fyers API
            </CardDescription>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading} size="sm">
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Symbol</label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value}>
                    {symbol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Timeframe</label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((timeframe) => (
                  <SelectItem key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-40 justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "MMM dd, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-40 justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "MMM dd, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-red-500 mb-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            Error loading chart data: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {historicalData && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {historicalData.candles.length} candles for {historicalData.symbol} 
            ({historicalData.resolution} timeframe) from {historicalData.range_from} to {historicalData.range_to}
          </div>
        )}

        <div className="relative">
          <div
            ref={chartContainerRef}
            className="w-full h-[400px] border rounded-lg"
            style={{ minHeight: '400px' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  );
}