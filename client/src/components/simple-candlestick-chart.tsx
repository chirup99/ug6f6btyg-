import { useState } from 'react';
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

// Simple SVG candlestick component
interface CandlestickProps {
  candle: CandleData;
  x: number;
  width: number;
  maxPrice: number;
  minPrice: number;
  height: number;
}

function Candlestick({ candle, x, width, maxPrice, minPrice, height }: CandlestickProps) {
  const priceRange = maxPrice - minPrice;
  const bodyWidth = width * 0.8;
  const wickWidth = 2;
  
  // Calculate positions
  const highY = ((maxPrice - candle.high) / priceRange) * height;
  const lowY = ((maxPrice - candle.low) / priceRange) * height;
  const openY = ((maxPrice - candle.open) / priceRange) * height;
  const closeY = ((maxPrice - candle.close) / priceRange) * height;
  
  // Determine colors
  const isGreen = candle.close >= candle.open;
  const bodyColor = isGreen ? '#26a69a' : '#ef5350';
  const wickColor = isGreen ? '#26a69a' : '#ef5350';
  
  // Body coordinates
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);
  
  return (
    <g>
      {/* Upper wick */}
      <line
        x1={x + width / 2}
        y1={highY}
        x2={x + width / 2}
        y2={bodyTop}
        stroke={wickColor}
        strokeWidth={wickWidth}
      />
      
      {/* Lower wick */}
      <line
        x1={x + width / 2}
        y1={bodyTop + bodyHeight}
        x2={x + width / 2}
        y2={lowY}
        stroke={wickColor}
        strokeWidth={wickWidth}
      />
      
      {/* Body */}
      <rect
        x={x + (width - bodyWidth) / 2}
        y={bodyTop}
        width={bodyWidth}
        height={Math.max(bodyHeight, 1)}
        fill={isGreen ? bodyColor : bodyColor}
        stroke={bodyColor}
        strokeWidth={1}
      />
    </g>
  );
}

export function SimpleCandlestickChart() {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:INFY-EQ');
  const [selectedTimeframe, setSelectedTimeframe] = useState('40');
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)); // 3 days ago
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  const { data: historicalData, isLoading, refetch } = useQuery<HistoricalDataResponse>({
    queryKey: ['/api/historical-data', selectedSymbol, selectedTimeframe, fromDate, toDate],
    queryFn: async () => {
      const response = await fetch('/api/historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          resolution: selectedTimeframe,
          range_from: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
          range_to: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch historical data');
      return response.json();
    },
    enabled: !!fromDate && !!toDate,
  });

  const handleFetchData = () => {
    refetch();
  };

  // Calculate price range for scaling
  let maxPrice = 0;
  let minPrice = Infinity;
  
  if (historicalData?.candles) {
    historicalData.candles.forEach(candle => {
      maxPrice = Math.max(maxPrice, candle.high);
      minPrice = Math.min(minPrice, candle.low);
    });
    
    // Add some padding
    const padding = (maxPrice - minPrice) * 0.1;
    maxPrice += padding;
    minPrice -= padding;
  }

  const chartHeight = 400;
  const chartWidth = 800;
  const candleWidth = historicalData?.candles?.length ? Math.max(chartWidth / historicalData.candles.length, 3) : 10;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Real-Time Candlestick Chart
        </CardTitle>
        <CardDescription>
          Interactive candlestick chart powered by live Fyers API data - No mock data, 100% authentic market information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Symbol</label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select symbol" />
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Timeframe</label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select timeframe" />
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

          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-32 pl-3 text-left font-normal", !fromDate && "text-muted-foreground")}
                >
                  {fromDate ? format(fromDate, "MMM dd") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-32 pl-3 text-left font-normal", !toDate && "text-muted-foreground")}
                >
                  {toDate ? format(toDate, "MMM dd") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleFetchData} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Fetch Data'}
          </Button>
        </div>

        {/* Chart Status */}
        {historicalData && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              Live Data • {historicalData.candles?.length || 0} candles loaded for {historicalData.symbol} 
              ({historicalData.resolution} timeframe) from {historicalData.range_from} to {historicalData.range_to}
            </span>
          </div>
        )}

        {/* Simple SVG Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            {historicalData?.candles && historicalData.candles.length > 0 ? (
              <svg width={chartWidth} height={chartHeight} className="border rounded-lg bg-white">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Price axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const price = minPrice + (maxPrice - minPrice) * (1 - ratio);
                  const y = ratio * chartHeight;
                  return (
                    <g key={i}>
                      <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="#e0e0e0" strokeWidth={1} />
                      <text x={chartWidth - 5} y={y - 5} textAnchor="end" fontSize="12" fill="#666">
                        {price.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
                
                {/* Candlesticks */}
                {historicalData.candles.map((candle, index) => (
                  <Candlestick
                    key={index}
                    candle={candle}
                    x={index * candleWidth}
                    width={candleWidth}
                    maxPrice={maxPrice}
                    minPrice={minPrice}
                    height={chartHeight}
                  />
                ))}
              </svg>
            ) : (
              <div className="h-[400px] border rounded-lg flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">
                    {isLoading ? 'Loading chart data...' : 'No chart data available'}
                  </p>
                  {!isLoading && (
                    <p className="text-sm text-gray-400">
                      Select symbol, timeframe, and date range, then click "Fetch Data"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        {historicalData?.candles && historicalData.candles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Recent Candle Data (Last 10)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">Time</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">Open</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">High</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">Low</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">Close</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.candles.slice(-10).reverse().map((candle, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2">
                        {new Date(candle.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        {candle.open.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        {candle.high.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        {candle.low.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        {candle.close.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right">
                        {candle.volume.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}