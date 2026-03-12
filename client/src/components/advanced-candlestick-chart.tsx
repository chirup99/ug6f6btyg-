import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarIcon, TrendingUp, Maximize2, Minimize2, ZoomIn, ZoomOut, Move, Minus, ChevronUp, ChevronDown, Play, Pause, Square, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import type { MarketData } from '@shared/schema';

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

interface IndicatorSettings {
  ema: {
    enabled: boolean;
    period: number;
    color: string;
  };
  sma: {
    enabled: boolean;
    period: number;
    color: string;
  };
  rsi: {
    enabled: boolean;
    period: number;
    color: string;
  };
}

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

interface DrawingLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

interface ChartState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  isDrawing: boolean;
  currentLine: DrawingLine | null;
  lines: DrawingLine[];
  priceScaleDragging: 'none' | 'top' | 'bottom';
  customPriceRange: { min: number; max: number } | null;
  mouseX: number;
  mouseY: number;
  hoveredCandle: CandleData | null;
  showCrosshair: boolean;
}

interface ReplayState {
  isReplayMode: boolean;
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  intervalId: NodeJS.Timeout | null;
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

// Enhanced candlestick component with zoom support
interface CandlestickProps {
  candle: CandleData;
  x: number;
  width: number;
  maxPrice: number;
  minPrice: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

function Candlestick({ candle, x, width, maxPrice, minPrice, height, zoom, offsetX, offsetY }: CandlestickProps) {
  const priceRange = maxPrice - minPrice;
  const bodyWidth = Math.max(width * 0.8 * zoom, 2);
  const wickWidth = Math.max(2 * zoom, 1);
  
  // Calculate positions with zoom and offset
  const scaledX = (x * zoom) + offsetX;
  const scaledWidth = width * zoom;
  
  const highY = ((maxPrice - candle.high) / priceRange) * height + offsetY;
  const lowY = ((maxPrice - candle.low) / priceRange) * height + offsetY;
  const openY = ((maxPrice - candle.open) / priceRange) * height + offsetY;
  const closeY = ((maxPrice - candle.close) / priceRange) * height + offsetY;
  
  // Determine colors
  const isGreen = candle.close >= candle.open;
  const bodyColor = isGreen ? '#26a69a' : '#ef5350';
  
  // Body coordinates
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);
  
  return (
    <g>
      {/* Upper wick */}
      <line
        x1={scaledX + scaledWidth / 2}
        y1={highY}
        x2={scaledX + scaledWidth / 2}
        y2={bodyTop}
        stroke={bodyColor}
        strokeWidth={wickWidth}
      />
      
      {/* Lower wick */}
      <line
        x1={scaledX + scaledWidth / 2}
        y1={bodyTop + bodyHeight}
        x2={scaledX + scaledWidth / 2}
        y2={lowY}
        stroke={bodyColor}
        strokeWidth={wickWidth}
      />
      
      {/* Body */}
      <rect
        x={scaledX + (scaledWidth - bodyWidth) / 2}
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

// Utility function to validate OHLC data
const isValidOHLCData = (candle: any): boolean => {
  if (!candle) return false;
  
  const values = [candle.open, candle.high, candle.low, candle.close];
  const isValid = values.every(val => 
    val !== null && 
    val !== undefined && 
    typeof val === 'number' && 
    !isNaN(val) && 
    isFinite(val) &&
    val >= 0  // Allow zero values in case of special market conditions
  );
  
  // Additional validation: ensure high >= low and high >= open, high >= close
  if (isValid) {
    const { open, high, low, close } = candle;
    return high >= low && high >= open && high >= close && open >= low && close >= low;
  }
  
  return isValid;
};

interface AdvancedCandlestickChartProps {
  selectedTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
}

export function AdvancedCandlestickChart({ 
  selectedTimeframe: propTimeframe = '1', 
  onTimeframeChange 
}: AdvancedCandlestickChartProps = {}) {
  const [selectedSymbol, setSelectedSymbol] = useState('NSE:INFY-EQ');
  const [selectedTimeframe, setSelectedTimeframe] = useState(propTimeframe);
  
  // Sync internal state with prop when prop changes
  useEffect(() => {
    setSelectedTimeframe(propTimeframe);
  }, [propTimeframe]);
  // Set default dates to a date with available Fyers data
  const getDefaultDate = () => {
    const date = new Date();
    // If today is a weekend or after market hours, use the last trading day
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // Sunday
      date.setDate(date.getDate() - 2); // Go to Friday
    } else if (dayOfWeek === 6) { // Saturday
      date.setDate(date.getDate() - 1); // Go to Friday
    }
    return date;
  };
  
  const [fromDate, setFromDate] = useState<Date | undefined>(getDefaultDate());
  const [toDate, setToDate] = useState<Date | undefined>(getDefaultDate());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  
  // Indicator Settings State
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettings>({
    ema: {
      enabled: false,
      period: 12,
      color: '#FF6B35'
    },
    sma: {
      enabled: false,
      period: 20,
      color: '#6b7280'
    },
    rsi: {
      enabled: false,
      period: 14,
      color: '#6b7280'
    }
  });
  const [replayState, setReplayState] = useState<ReplayState>({
    isReplayMode: false,
    currentIndex: 0,
    isPlaying: false,
    speed: 1000, // milliseconds between candles
    intervalId: null
  });

  // Candle selection mode for replay start point
  const [candleSelectionMode, setCandleSelectionMode] = useState(false);


  
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [chartState, setChartState] = useState<ChartState>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    isDrawing: false,
    currentLine: null,
    lines: [],
    priceScaleDragging: 'none',
    customPriceRange: null,
    mouseX: 0,
    mouseY: 0,
    hoveredCandle: null,
    showCrosshair: false
  });

  const { data: historicalData, isLoading, refetch } = useQuery<HistoricalDataResponse>({
    queryKey: ['/api/historical-data', selectedSymbol, selectedTimeframe, fromDate, toDate],
    queryFn: async () => {
      console.log('🔍 Chart Tab API Call:', {
        symbol: selectedSymbol,
        resolution: selectedTimeframe,
        range_from: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        range_to: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
      });
      
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
      const data = await response.json();
      
      console.log('📊 Chart Tab Raw Response:', {
        symbol: data.symbol,
        resolution: data.resolution,
        candlesCount: data.candles?.length || 0,
        firstCandle: data.candles?.[0]?.timestamp,
        lastCandle: data.candles?.[data.candles?.length - 1]?.timestamp
      });
      
      return data;
    },
    enabled: !!fromDate && !!toDate,
  });

  // Fetch live market data for real-time price overlay
  const { data: liveMarketData } = useQuery<MarketData[]>({
    queryKey: ["/api/market-data"],
    refetchInterval: 700, // 700ms real-time updates
    retry: false,
  });

  // 🔴 Angel One Live Streaming State - 700ms OHLC Updates
  const [liveCandle, setLiveCandle] = useState<CandleData | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);

  // 🔴 Connect to Angel One Live Stream (700ms OHLC updates)
  useEffect(() => {
    // Symbol to Angel One token mapping
    const angelOneMapping: { [key: string]: { symbol: string; token: string; exchange: string } } = {
      'NSE:NIFTY50-INDEX': { symbol: 'NIFTY50', token: '99926000', exchange: 'NSE' },
      'NSE:INFY-EQ': { symbol: 'INFY', token: '1594', exchange: 'NSE' },
      'NSE:RELIANCE-EQ': { symbol: 'RELIANCE', token: '2885', exchange: 'NSE' },
      'NSE:TCS-EQ': { symbol: 'TCS', token: '11536', exchange: 'NSE' },
    };

    const tokenData = angelOneMapping[selectedSymbol];
    if (!tokenData) {
      console.log('⚠️ No Angel One mapping for', selectedSymbol);
      return;
    }

    const { symbol, token, exchange } = tokenData;
    const url = `/api/angelone/live-stream?symbol=${symbol}&symbolToken=${token}&exchange=${exchange}`;
    
    console.log('🔴 [SSE] Connecting to Angel One live stream:', {
      symbol,
      token,
      exchange,
      url
    });

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if market is open and data is live - only update candles if market is open
        const marketOpen = data.isMarketOpen === true || data.isLive === true;
        setIsMarketOpen(marketOpen);
        
        // Only set live candle if market is actually open
        if (marketOpen) {
          const newCandle: CandleData = {
            timestamp: data.time * 1000, // Convert seconds to milliseconds
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: 0 // Angel One doesn't provide volume in live stream
          };
          
          setLiveCandle(newCandle);
          console.log('🔴 [700ms] Live candle update:', {
            time: new Date(newCandle.timestamp).toLocaleTimeString(),
            open: newCandle.open,
            high: newCandle.high,
            low: newCandle.low,
            close: newCandle.close,
            marketOpen: true
          });
        } else {
          // Market is closed - don't update live candle (show only historical data)
          setLiveCandle(null);
          console.log('🔴 [SSE] Market closed - not streaming new candles');
        }
      } catch (error) {
        console.error('🔴 [SSE] Parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('🔴 [SSE] Connection error:', error);
      eventSource.close();
    };

    return () => {
      console.log('🔴 [SSE] Disconnecting from live stream');
      eventSource.close();
    };
  }, [selectedSymbol]);

  // Get current live price for selected symbol
  const getCurrentLivePrice = (): number | null => {
    if (!liveMarketData) return null;
    
    // Map chart symbols to market data symbols
    const symbolMapping: { [key: string]: string } = {
      'NSE:NIFTY50-INDEX': 'NIFTY50',
      'NSE:INFY-EQ': 'INFOSYS',
      'NSE:RELIANCE-EQ': 'RELIANCE',
      'NSE:TCS-EQ': 'TCS',
    };
    
    const marketSymbol = symbolMapping[selectedSymbol];
    if (!marketSymbol) return null;
    
    const liveData = liveMarketData.find(item => item.symbol === marketSymbol);
    return liveData?.ltp || null;
  };

  const handleFetchData = () => {
    refetch();
  };

  // Clear crosshair state when date range changes to prevent stale timestamp display
  useEffect(() => {
    setChartState(prev => ({
      ...prev,
      showCrosshair: false,
      hoveredCandle: null,
      mouseX: 0,
      mouseY: 0
    }));
    console.log('Date range changed - cleared crosshair state:', {
      fromDate: fromDate?.toLocaleDateString(),
      toDate: toDate?.toLocaleDateString(),
      selectedSymbol,
      selectedTimeframe
    });
  }, [fromDate, toDate, selectedSymbol, selectedTimeframe]);

  // Handle candle click for replay start selection
  const handleCandleClick = useCallback((candleIndex: number) => {
    if (candleSelectionMode && historicalData?.candles) {
      setReplayState(prev => ({
        ...prev,
        isReplayMode: true,
        currentIndex: candleIndex,
        isPlaying: false
      }));
      setCandleSelectionMode(false);
    }
  }, [candleSelectionMode, historicalData?.candles]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setChartState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  }, []);

  const zoomOut = useCallback(() => {
    setChartState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  }, []);

  const resetZoom = useCallback(() => {
    setChartState(prev => ({ ...prev, zoom: 1, offsetX: 0, offsetY: 0, customPriceRange: null }));
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Handle candle selection mode
    if (candleSelectionMode && historicalData?.candles) {
      const calculatedCandleWidth = Math.max((finalChartWidth - 80) / historicalData.candles.length, 2);
      const candleIndex = Math.floor((x - chartState.offsetX) / calculatedCandleWidth);
      if (candleIndex >= 0 && candleIndex < historicalData.candles.length) {
        handleCandleClick(candleIndex);
      }
      return;
    }
    
    // Check if clicking on price scale drag areas
    const dragZoneHeight = 20;
    if (x > rect.width - 80) { // Right side where price labels are
      if (y < dragZoneHeight) {
        // Top price scale drag area
        setChartState(prev => ({
          ...prev,
          priceScaleDragging: 'top',
          dragStart: { x, y }
        }));
        return;
      } else if (y > rect.height - dragZoneHeight) {
        // Bottom price scale drag area
        setChartState(prev => ({
          ...prev,
          priceScaleDragging: 'bottom',
          dragStart: { x, y }
        }));
        return;
      }
    }
    
    if (drawingMode) {
      const newLine: DrawingLine = {
        id: Date.now().toString(),
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: '#ff6b6b'
      };
      setChartState(prev => ({
        ...prev,
        isDrawing: true,
        currentLine: newLine
      }));
    } else {
      setChartState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: { x, y }
      }));
    }
  }, [drawingMode, candleSelectionMode, chartState.offsetX, historicalData?.candles, handleCandleClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !historicalData?.candles) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (chartState.priceScaleDragging !== 'none') {
      // Calculate current price range
      let currentMaxPrice = 0;
      let currentMinPrice = Infinity;
      
      historicalData.candles.forEach(candle => {
        currentMaxPrice = Math.max(currentMaxPrice, candle.high);
        currentMinPrice = Math.min(currentMinPrice, candle.low);
      });
      
      const padding = (currentMaxPrice - currentMinPrice) * 0.1;
      const defaultMaxPrice = currentMaxPrice + padding;
      const defaultMinPrice = currentMinPrice - padding;
      
      // Use custom range if available
      const maxPrice = chartState.customPriceRange?.max || defaultMaxPrice;
      const minPrice = chartState.customPriceRange?.min || defaultMinPrice;
      const priceRange = maxPrice - minPrice;
      
      const deltaY = y - chartState.dragStart.y;
      const priceChange = (deltaY / rect.height) * priceRange;
      
      if (chartState.priceScaleDragging === 'top') {
        const newMaxPrice = Math.max(maxPrice - priceChange, minPrice + priceRange * 0.1);
        setChartState(prev => ({
          ...prev,
          customPriceRange: {
            min: prev.customPriceRange?.min || defaultMinPrice,
            max: newMaxPrice
          },
          dragStart: { x, y }
        }));
      } else if (chartState.priceScaleDragging === 'bottom') {
        const newMinPrice = Math.min(minPrice - priceChange, maxPrice - priceRange * 0.1);
        setChartState(prev => ({
          ...prev,
          customPriceRange: {
            min: newMinPrice,
            max: prev.customPriceRange?.max || defaultMaxPrice
          },
          dragStart: { x, y }
        }));
      }
    } else if (chartState.isDrawing && chartState.currentLine) {
      setChartState(prev => ({
        ...prev,
        currentLine: prev.currentLine ? {
          ...prev.currentLine,
          endX: x,
          endY: y
        } : null
      }));
    } else if (chartState.isDragging) {
      const deltaX = x - chartState.dragStart.x;
      const deltaY = y - chartState.dragStart.y;
      
      setChartState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        dragStart: { x, y }
      }));
    }

    // Update crosshair position and find hovered candle (only when not dragging)
    if (!chartState.isDragging && !chartState.isDrawing && !drawingMode && candlesToDisplay && candlesToDisplay.length > 0) {
      // Use the same width calculation as the rendered candles for perfect synchronization
      const calculatedCandleWidth = candlesToDisplay.length ? Math.max(finalChartWidth / candlesToDisplay.length, 3) : 10;
      const adjustedX = x - chartState.offsetX;
      
      // Session-aware candle detection - find the closest candle by pixel position
      let hoveredCandle = null;
      let bestCandleIndex = -1;
      let minDistance = Infinity;
      
      // Check each candle's actual rendered position
      for (let i = 0; i < candlesToDisplay.length; i++) {
        const candleX = i * calculatedCandleWidth + (calculatedCandleWidth / 2); // Center of candle
        const distance = Math.abs(adjustedX - candleX);
        
        // If this candle is closer than the previous best, and within reasonable bounds
        if (distance < minDistance && distance <= calculatedCandleWidth) {
          minDistance = distance;
          bestCandleIndex = i;
        }
      }
      
      // Get the hovered candle if we found a valid match
      if (bestCandleIndex >= 0 && bestCandleIndex < candlesToDisplay.length) {
        hoveredCandle = candlesToDisplay[bestCandleIndex];
        
        // Validate timestamp freshness for new date ranges
        if (hoveredCandle && hoveredCandle.timestamp && fromDate) {
          const candleTime = new Date(hoveredCandle.timestamp * 1000);
          const selectedStartDate = new Date(fromDate);
          const selectedEndDate = new Date(toDate || fromDate);
          
          // Add one day to end date to include full day range
          selectedEndDate.setHours(23, 59, 59, 999);
          
          // Ensure candle timestamp is within selected date range
          const isCandleInRange = candleTime >= selectedStartDate && candleTime <= selectedEndDate;
          
          if (!isCandleInRange) {
            // Clear stale timestamp data - don't show outdated candle info
            console.warn('Timestamp mismatch - clearing stale data:', {
              candleTime: candleTime.toLocaleDateString(),
              selectedStartDate: selectedStartDate.toLocaleDateString(), 
              selectedEndDate: selectedEndDate.toLocaleDateString(),
              candleIndex: bestCandleIndex,
              timestamp: hoveredCandle.timestamp
            });
            hoveredCandle = null;
          }
        }
        
        // Advanced session break detection and timestamp validation
        if (hoveredCandle && hoveredCandle.timestamp) {
          const candleTime = new Date(hoveredCandle.timestamp * 1000);
          const isWithinTradingHours = (
            candleTime.getHours() >= 9 && candleTime.getHours() < 16 && // 9 AM to 4 PM
            candleTime.getDay() >= 1 && candleTime.getDay() <= 5 // Monday to Friday
          );
          
          // Check for session breaks by analyzing timestamp gaps
          if (bestCandleIndex > 0) {
            const prevCandle = candlesToDisplay[bestCandleIndex - 1];
            if (prevCandle && prevCandle.timestamp) {
              const timeDiff = hoveredCandle.timestamp - prevCandle.timestamp;
              const expectedDiff = parseInt(selectedTimeframe) * 60; // Convert minutes to seconds
              
              // Detect session break (gap > 2x expected timeframe)
              const isSessionBreak = timeDiff > (expectedDiff * 2);
              
              // For session breaks or non-trading hours, find closest valid candle
              if (isSessionBreak || !isWithinTradingHours) {
                let closestValidCandle = hoveredCandle;
                let closestValidIndex = bestCandleIndex;
                
                // Search within reasonable range for valid trading candle
                const searchRange = Math.min(3, candlesToDisplay.length - 1);
                for (let offset = 1; offset <= searchRange; offset++) {
                  // Check backward first (prefer most recent valid candle)
                  if (bestCandleIndex - offset >= 0) {
                    const backCandle = candlesToDisplay[bestCandleIndex - offset];
                    if (backCandle && backCandle.timestamp) {
                      const backTime = new Date(backCandle.timestamp * 1000);
                      if (backTime.getHours() >= 9 && backTime.getHours() < 16 && 
                          backTime.getDay() >= 1 && backTime.getDay() <= 5) {
                        closestValidCandle = backCandle;
                        closestValidIndex = bestCandleIndex - offset;
                        break;
                      }
                    }
                  }
                }
                
                hoveredCandle = closestValidCandle;
                bestCandleIndex = closestValidIndex;
              }
            }
          }
        }
      }
      
      // Debug logging for session-aware crosshair system
      if (hoveredCandle) {
        const isValid = isValidOHLCData(hoveredCandle);
        if (!isValid) {
          console.warn('Invalid OHLC candle data detected:', {
            bestCandleIndex,
            open: hoveredCandle.open,
            high: hoveredCandle.high,  
            low: hoveredCandle.low,
            close: hoveredCandle.close,
            timestamp: hoveredCandle.timestamp,
            symbol: selectedSymbol
          });
        }
        
        // Enhanced session debugging with gap detection
        if (bestCandleIndex >= candlesToDisplay.length - 5) {
          const candleTime = hoveredCandle.timestamp ? new Date(hoveredCandle.timestamp * 1000) : null;
          let sessionGap = null;
          
          if (bestCandleIndex > 0) {
            const prevCandle = candlesToDisplay[bestCandleIndex - 1];
            if (prevCandle && prevCandle.timestamp) {
              const timeDiff = hoveredCandle.timestamp - prevCandle.timestamp;
              const expectedDiff = parseInt(selectedTimeframe) * 60;
              sessionGap = {
                actualGap: timeDiff,
                expectedGap: expectedDiff,
                gapRatio: timeDiff / expectedDiff,
                isSessionBreak: timeDiff > (expectedDiff * 2)
              };
            }
          }
          
          console.log('Session-aware crosshair with break detection:', {
            bestCandleIndex,
            totalCandles: candlesToDisplay.length,
            minDistance: Math.round(minDistance * 100) / 100,
            timestamp: hoveredCandle.timestamp,
            formattedTime: candleTime ? candleTime.toLocaleString() : 'Invalid',
            tradingHours: candleTime ? (candleTime.getHours() >= 9 && candleTime.getHours() < 16) : false,
            weekday: candleTime ? (candleTime.getDay() >= 1 && candleTime.getDay() <= 5) : false,
            sessionGap
          });
        }
      }
      
      setChartState(prev => ({
        ...prev,
        mouseX: x,
        mouseY: y,
        hoveredCandle,
        showCrosshair: true
      }));
    }
  }, [chartState.isDrawing, chartState.isDragging, chartState.priceScaleDragging, chartState.dragStart, chartState.currentLine, chartState.customPriceRange, historicalData, fromDate, toDate, selectedTimeframe]);

  const handleMouseUp = useCallback(() => {
    if (chartState.isDrawing && chartState.currentLine) {
      setChartState(prev => ({
        ...prev,
        isDrawing: false,
        lines: [...prev.lines, prev.currentLine!],
        currentLine: null
      }));
    } else {
      setChartState(prev => ({
        ...prev,
        isDragging: false,
        priceScaleDragging: 'none'
      }));
    }
  }, [chartState.isDrawing, chartState.currentLine]);

  // Helper function to convert Y position to price
  const getYPosition = useCallback((y: number, minPrice: number, maxPrice: number, height: number) => {
    const normalizedY = (height - y - 30) / (height - 30); // Account for time scale space
    return minPrice + (normalizedY * (maxPrice - minPrice));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setChartState(prev => ({
      ...prev,
      showCrosshair: false,
      hoveredCandle: null
    }));
  }, []);

  // Replay control functions
  const startReplay = useCallback(() => {
    if (!historicalData?.candles) return;
    
    setReplayState(prev => ({
      ...prev,
      isReplayMode: true,
      currentIndex: 0,
      isPlaying: false
    }));
  }, [historicalData]);

  const playReplay = useCallback(() => {
    if (!historicalData?.candles || replayState.isPlaying) return;
    
    const intervalId = setInterval(() => {
      setReplayState(prev => {
        if (prev.currentIndex >= historicalData.candles.length - 1) {
          if (prev.intervalId) clearInterval(prev.intervalId);
          return { ...prev, isPlaying: false, intervalId: null };
        }
        return { ...prev, currentIndex: prev.currentIndex + 1 };
      });
    }, replayState.speed);

    setReplayState(prev => ({
      ...prev,
      isPlaying: true,
      intervalId
    }));
  }, [historicalData, replayState.speed, replayState.isPlaying]);

  const pauseReplay = useCallback(() => {
    if (replayState.intervalId) {
      clearInterval(replayState.intervalId);
    }
    setReplayState(prev => ({
      ...prev,
      isPlaying: false,
      intervalId: null
    }));
  }, [replayState.intervalId]);

  const stopReplay = useCallback(() => {
    if (replayState.intervalId) {
      clearInterval(replayState.intervalId);
    }
    setReplayState(prev => ({
      ...prev,
      isReplayMode: false,
      currentIndex: 0,
      isPlaying: false,
      intervalId: null
    }));
  }, [replayState.intervalId]);

  const stepForward = useCallback(() => {
    if (!historicalData?.candles) return;
    setReplayState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, historicalData.candles.length - 1)
    }));
  }, [historicalData]);

  const stepBackward = useCallback(() => {
    setReplayState(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0)
    }));
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
    setReplayState(prev => ({ ...prev, speed: newSpeed }));
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (replayState.intervalId) {
        clearInterval(replayState.intervalId);
      }
    };
  }, [replayState.intervalId]);

  // Mathematical validation: Calculate expected candles for market hours
  const calculateExpectedCandles = useCallback((timeframeMinutes: number) => {
    // NSE market hours: 9:15 AM to 3:30 PM = 375 minutes
    const marketMinutes = 375;
    return Math.floor(marketMinutes / timeframeMinutes);
  }, []);

  // Calculate indicator values for current data
  const indicatorValues = useMemo(() => {
    if (!historicalData?.candles || historicalData.candles.length === 0) {
      return { ema: [], sma: [], rsi: [] };
    }
    
    const closePrices = historicalData.candles.map(candle => candle.close);
    
    return {
      ema: indicatorSettings.ema.enabled ? calculateEMA(closePrices, indicatorSettings.ema.period) : [],
      sma: indicatorSettings.sma.enabled ? calculateSMA(closePrices, indicatorSettings.sma.period) : [],
      rsi: indicatorSettings.rsi.enabled ? calculateRSI(closePrices, indicatorSettings.rsi.period) : []
    };
  }, [historicalData?.candles, 
      indicatorSettings.ema.enabled, indicatorSettings.ema.period,
      indicatorSettings.sma.enabled, indicatorSettings.sma.period,
      indicatorSettings.rsi.enabled, indicatorSettings.rsi.period]);

  // Get candles to display (either all or up to current replay index)
  const candlesToDisplay = useMemo(() => {
    if (!historicalData?.candles) return [];
    
    // Mathematical duplicate detection
    const timeframeMinutes = parseInt(selectedTimeframe);
    const expectedCandles = calculateExpectedCandles(timeframeMinutes);
    const actualCandles = historicalData.candles.length;
    
    console.log('🧮 Mathematical Candle Validation:', {
      timeframe: `${timeframeMinutes} min`,
      expectedCandles: expectedCandles,
      actualCandles: actualCandles,
      isDuplicated: actualCandles > expectedCandles,
      excessCandles: actualCandles - expectedCandles,
      symbol: selectedSymbol
    });
    
    if (replayState.isReplayMode) {
      return historicalData.candles.slice(0, replayState.currentIndex + 1);
    }
    
    // Remove duplicates first
    const uniqueCandles = historicalData.candles.filter((candle, index, array) => {
      return index === array.findIndex(c => c.timestamp === candle.timestamp);
    });
    
    // Then apply hard limit to exact expected count
    const finalCandles = uniqueCandles.slice(0, expectedCandles);
    
    // 🔴 Append live candle if available (700ms Angel One updates) - ONLY if market is open
    if (liveCandle && !replayState.isReplayMode && isMarketOpen) {
      // Check if live candle is newer than last historical candle
      const lastHistoricalCandle = finalCandles[finalCandles.length - 1];
      if (!lastHistoricalCandle || liveCandle.timestamp > lastHistoricalCandle.timestamp) {
        finalCandles.push(liveCandle);
        console.log('🔴 [LIVE] Appended live candle to chart:', {
          liveTime: new Date(liveCandle.timestamp).toLocaleTimeString(),
          lastHistoricalTime: lastHistoricalCandle ? new Date(lastHistoricalCandle.timestamp).toLocaleTimeString() : 'none',
          totalCandles: finalCandles.length,
          isMarketOpen: true
        });
      } else if (lastHistoricalCandle && liveCandle.timestamp === lastHistoricalCandle.timestamp) {
        // Update the last candle with live data
        finalCandles[finalCandles.length - 1] = liveCandle;
        console.log('🔴 [LIVE] Updated last candle with live data');
      }
    }
    
    console.warn('🔧 Mathematical Candle Limiting:', {
      original: actualCandles,
      afterDeduplication: uniqueCandles.length,
      expected: expectedCandles,
      finalDisplayed: finalCandles.length,
      liveCandle: liveCandle ? 'present' : 'none',
      isMarketOpen: isMarketOpen,
      status: isMarketOpen ? 'LIVE_STREAMING' : 'MARKET_CLOSED'
    });
    
    return finalCandles;
  }, [historicalData?.candles, replayState.isReplayMode, replayState.currentIndex, selectedSymbol, selectedTimeframe, calculateExpectedCandles, liveCandle, isMarketOpen]);

  // Wheel event for zoom
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  // Clear all lines
  const clearLines = useCallback(() => {
    setChartState(prev => ({ ...prev, lines: [], currentLine: null }));
  }, []);

  // Price scale zoom functions
  const zoomInPriceScale = useCallback(() => {
    if (!historicalData?.candles) return;
    
    let currentMaxPrice = 0;
    let currentMinPrice = Infinity;
    
    historicalData.candles.forEach(candle => {
      currentMaxPrice = Math.max(currentMaxPrice, candle.high);
      currentMinPrice = Math.min(currentMinPrice, candle.low);
    });
    
    const padding = (currentMaxPrice - currentMinPrice) * 0.1;
    const defaultMaxPrice = currentMaxPrice + padding;
    const defaultMinPrice = currentMinPrice - padding;
    
    const maxPrice = chartState.customPriceRange?.max || defaultMaxPrice;
    const minPrice = chartState.customPriceRange?.min || defaultMinPrice;
    const priceRange = maxPrice - minPrice;
    const center = (maxPrice + minPrice) / 2;
    
    // Zoom in by 20% (reduce range by 20%)
    const newRange = priceRange * 0.8;
    const newMaxPrice = center + newRange / 2;
    const newMinPrice = center - newRange / 2;
    
    setChartState(prev => ({
      ...prev,
      customPriceRange: {
        max: newMaxPrice,
        min: newMinPrice
      }
    }));
  }, [historicalData, chartState.customPriceRange]);

  const zoomOutPriceScale = useCallback(() => {
    if (!historicalData?.candles) return;
    
    let currentMaxPrice = 0;
    let currentMinPrice = Infinity;
    
    historicalData.candles.forEach(candle => {
      currentMaxPrice = Math.max(currentMaxPrice, candle.high);
      currentMinPrice = Math.min(currentMinPrice, candle.low);
    });
    
    const padding = (currentMaxPrice - currentMinPrice) * 0.1;
    const defaultMaxPrice = currentMaxPrice + padding;
    const defaultMinPrice = currentMinPrice - padding;
    
    const maxPrice = chartState.customPriceRange?.max || defaultMaxPrice;
    const minPrice = chartState.customPriceRange?.min || defaultMinPrice;
    const priceRange = maxPrice - minPrice;
    const center = (maxPrice + minPrice) / 2;
    
    // Zoom out by 25% (increase range by 25%)
    const newRange = priceRange * 1.25;
    const newMaxPrice = center + newRange / 2;
    const newMinPrice = center - newRange / 2;
    
    setChartState(prev => ({
      ...prev,
      customPriceRange: {
        max: newMaxPrice,
        min: newMinPrice
      }
    }));
  }, [historicalData, chartState.customPriceRange]);

  // Calculate price range for scaling
  let maxPrice = 0;
  let minPrice = Infinity;
  
  if (candlesToDisplay.length > 0) {
    candlesToDisplay.forEach(candle => {
      maxPrice = Math.max(maxPrice, candle.high);
      minPrice = Math.min(minPrice, candle.low);
    });
    
    const padding = (maxPrice - minPrice) * 0.1;
    const defaultMaxPrice = maxPrice + padding;
    const defaultMinPrice = minPrice - padding;
    
    // Use custom price range if available
    maxPrice = chartState.customPriceRange?.max || defaultMaxPrice;
    minPrice = chartState.customPriceRange?.min || defaultMinPrice;
  }

  const finalChartHeight = isFullscreen ? window.innerHeight - 200 : 400;
  const finalChartWidth = isFullscreen ? window.innerWidth - 100 : 800;
  const finalCandleWidth = candlesToDisplay.length ? Math.max(finalChartWidth / candlesToDisplay.length, 3) : 10;

  const chartComponent = (
    <Card className={cn("w-full", isFullscreen && "fixed inset-0 z-50 bg-white")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <div>
              <CardTitle>Advanced Interactive Chart</CardTitle>
              <CardDescription>
                Real Fyers API data with zoom, pan, drawing tools, and fullscreen mode
              </CardDescription>
            </div>
          </div>
          
          {/* Chart Controls */}
          <div className="flex items-center gap-2">
            {/* Chart Zoom */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                title="Zoom In Chart"
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                title="Zoom Out Chart"
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Price Scale Zoom */}
            <div className="flex items-center gap-1 border rounded-md p-1 bg-gray-50 dark:bg-gray-700 transition-colors duration-300">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomInPriceScale}
                title="Zoom In Price Scale"
                className="h-7 w-7 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOutPriceScale}
                title="Zoom Out Price Scale"
                className="h-7 w-7 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              title="Reset All Zoom"
            >
              Reset
            </Button>
            <Button
              variant={drawingMode ? "default" : "outline"}
              size="sm"
              onClick={() => setDrawingMode(!drawingMode)}
              title="Drawing Mode"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLines}
              title="Clear Lines"
            >
              Clear
            </Button>
            
            {/* Technical Indicator Controls */}
            <div className="flex items-center space-x-2 border-l pl-2 ml-2">
              {/* EMA Indicator */}
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
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="21">21</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* SMA Indicator */}
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
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* RSI Indicator */}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {/* Replay Controls */}
            {!replayState.isReplayMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startReplay}
                  title="Start Replay Mode for Backtesting"
                  disabled={!historicalData?.candles}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Replay
                </Button>
                <Button
                  variant={candleSelectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCandleSelectionMode(!candleSelectionMode)}
                  title={candleSelectionMode ? "Cancel Candle Selection" : "Click on a candle to start replay from that point"}
                  disabled={!historicalData?.candles}
                >
                  <Target className="h-4 w-4 mr-1" />
                  {candleSelectionMode ? "Cancel" : "Select Start"}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1 border rounded-md p-1 bg-orange-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stepBackward}
                  title="Step Backward"
                  className="h-7 w-7 p-0"
                  disabled={replayState.currentIndex <= 0}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                
                {replayState.isPlaying ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={pauseReplay}
                    title="Pause Replay"
                    className="h-7 w-7 p-0"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playReplay}
                    title="Play Replay"
                    className="h-7 w-7 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stepForward}
                  title="Step Forward"
                  className="h-7 w-7 p-0"
                  disabled={replayState.currentIndex >= (historicalData?.candles?.length || 1) - 1}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopReplay}
                  title="Stop Replay"
                  className="h-7 w-7 p-0"
                >
                  <Square className="h-3 w-3" />
                </Button>
                
                <span className="text-xs px-2 text-orange-600">
                  {replayState.currentIndex + 1}/{historicalData?.candles?.length || 0}
                </span>
                
                <Select value={replayState.speed.toString()} onValueChange={(value) => changeSpeed(Number(value))}>
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">0.5s</SelectItem>
                    <SelectItem value="1000">1s</SelectItem>
                    <SelectItem value="2000">2s</SelectItem>
                    <SelectItem value="5000">5s</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
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
            <Select value={selectedTimeframe} onValueChange={(value) => {
              setSelectedTimeframe(value);
              onTimeframeChange?.(value);
            }}>
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
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600 rounded-lg">
            <div className={cn("w-2 h-2 rounded-full", 
              replayState.isReplayMode ? "bg-orange-500" : "bg-green-500 animate-pulse"
            )}></div>
            <span className="text-sm font-medium text-green-700 dark:text-gray-200">
              {replayState.isReplayMode ? (
                <>
                  Replay Mode • {candlesToDisplay.length}/{historicalData.candles?.length || 0} candles
                  {replayState.isPlaying && ` • Playing at ${replayState.speed}ms intervals`}
                </>
              ) : (
                <>
                  Live Data • {historicalData.candles?.length || 0} candles [Chart Tab] • Expected: {calculateExpectedCandles(parseInt(selectedTimeframe))}
                  {getCurrentLivePrice() && ` • Live Price: ₹${getCurrentLivePrice()?.toFixed(2)} • Streaming: 700ms`}
                </>
              )}
              • Chart Zoom: {chartState.zoom.toFixed(1)}x 
              • {chartState.customPriceRange ? 'Custom Price Scale' : 'Auto Price Scale'}
              • {drawingMode ? 'Drawing Mode Active' : 'Pan Mode'}
              {indicatorSettings.ema.enabled && (
                <>
                  • EMA-{indicatorSettings.ema.period}: {indicatorValues.ema.length > 0 ? `${indicatorValues.ema.length} values calculated` : 'calculating...'}
                  {indicatorValues.ema.length > 0 && candlesToDisplay.length > 0 && indicatorValues.ema[indicatorValues.ema.length - 1] && (
                    <> • Current EMA: ₹{indicatorValues.ema[indicatorValues.ema.length - 1]?.toFixed(2)}</>
                  )}
                </>
              )}
              {indicatorSettings.sma.enabled && (
                <>
                  • SMA-{indicatorSettings.sma.period}: {indicatorValues.sma.length > 0 ? `${indicatorValues.sma.length} values calculated` : 'calculating...'}
                  {indicatorValues.sma.length > 0 && candlesToDisplay.length > 0 && indicatorValues.sma[indicatorValues.sma.length - 1] && (
                    <> • Current SMA: ₹{indicatorValues.sma[indicatorValues.sma.length - 1]?.toFixed(2)}</>
                  )}
                </>
              )}
              {indicatorSettings.rsi.enabled && (
                <>
                  • RSI-{indicatorSettings.rsi.period}: {indicatorValues.rsi.length > 0 ? `${indicatorValues.rsi.length} values calculated` : 'calculating...'}
                  {indicatorValues.rsi.length > 0 && candlesToDisplay.length > 0 && indicatorValues.rsi[indicatorValues.rsi.length - 1] && (
                    <> • Current RSI: {indicatorValues.rsi[indicatorValues.rsi.length - 1]?.toFixed(2)}</>
                  )}
                </>
              )}
            </span>
          </div>
        )}

        {/* Interactive SVG Chart */}
        <div className="w-full overflow-hidden border rounded-lg bg-white dark:bg-gray-800" style={{ height: finalChartHeight + 'px' }}>
          {candlesToDisplay && candlesToDisplay.length > 0 ? (
            <svg 
              ref={svgRef}
              width={finalChartWidth} 
              height={finalChartHeight} 
              className={cn("cursor-crosshair", chartState.isDragging && "cursor-grabbing", drawingMode && "cursor-crosshair", candleSelectionMode && "cursor-pointer")}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
            >
              {/* Grid pattern */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Price axis labels with drag zones */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const price = minPrice + (maxPrice - minPrice) * (1 - ratio);
                const y = ratio * finalChartHeight + chartState.offsetY;
                const isDragZone = i === 0 || i === 4; // Top and bottom
                
                return (
                  <g key={i}>
                    <line x1={0} y1={y} x2={finalChartWidth} y2={y} stroke="#e0e0e0" strokeWidth={1} />
                    
                    {/* Price scale drag zones */}
                    {isDragZone && (
                      <rect
                        x={finalChartWidth - 80}
                        y={y - 10}
                        width={80}
                        height={20}
                        fill={chartState.priceScaleDragging === (i === 0 ? 'top' : 'bottom') ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}
                        stroke={isDragZone ? '#3b82f6' : 'transparent'}
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        className="cursor-ns-resize"
                        style={{ opacity: 0.7 }}
                      />
                    )}
                    
                    <text 
                      x={finalChartWidth - 5} 
                      y={y - 5} 
                      textAnchor="end" 
                      fontSize="12" 
                      fill={isDragZone ? "#3b82f6" : "#666"}
                      className={isDragZone ? "cursor-ns-resize font-medium" : ""}
                    >
                      {price.toFixed(2)}
                      {isDragZone && (i === 0 ? ' ↕' : ' ↕')}
                    </text>
                  </g>
                );
              })}
              
              {/* Candlesticks */}
              {candlesToDisplay.map((candle, index) => (
                <Candlestick
                  key={index}
                  candle={candle}
                  x={index * finalCandleWidth}
                  width={finalCandleWidth}
                  maxPrice={maxPrice}
                  minPrice={minPrice}
                  height={finalChartHeight}
                  zoom={chartState.zoom}
                  offsetX={chartState.offsetX}
                  offsetY={chartState.offsetY}
                />
              ))}
              
              {/* Technical Indicator Lines */}
              {/* EMA Line */}
              {indicatorSettings.ema.enabled && indicatorValues.ema.length > 0 && candlesToDisplay.length > 0 && (() => {
                let pathSegments: string[] = [];
                let currentPath = '';
                
                for (let i = 0; i < indicatorValues.ema.length && i < candlesToDisplay.length; i++) {
                  const emaValue = indicatorValues.ema[i];
                  
                  if (emaValue !== null && emaValue !== undefined) {
                    const x = (i * finalCandleWidth) + (finalCandleWidth / 2);
                    const scaledX = (x * chartState.zoom) + chartState.offsetX;
                    const y = ((maxPrice - emaValue) / (maxPrice - minPrice)) * finalChartHeight + chartState.offsetY;
                    
                    if (currentPath === '') {
                      currentPath = `M ${scaledX} ${y}`;
                    } else {
                      currentPath += ` L ${scaledX} ${y}`;
                    }
                  } else if (currentPath !== '') {
                    pathSegments.push(currentPath);
                    currentPath = '';
                  }
                }
                
                if (currentPath !== '') {
                  pathSegments.push(currentPath);
                }
                
                return pathSegments.length > 0 ? (
                  <g>
                    {pathSegments.map((pathData, index) => (
                      <path
                        key={index}
                        d={pathData}
                        stroke={indicatorSettings.ema.color}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="none"
                        opacity="0.8"
                      />
                    ))}
                  </g>
                ) : null;
              })()}

              {/* SMA Line */}
              {indicatorSettings.sma.enabled && indicatorValues.sma.length > 0 && candlesToDisplay.length > 0 && (() => {
                let pathSegments: string[] = [];
                let currentPath = '';
                
                for (let i = 0; i < indicatorValues.sma.length && i < candlesToDisplay.length; i++) {
                  const smaValue = indicatorValues.sma[i];
                  
                  if (smaValue !== null && smaValue !== undefined) {
                    const x = (i * finalCandleWidth) + (finalCandleWidth / 2);
                    const scaledX = (x * chartState.zoom) + chartState.offsetX;
                    const y = ((maxPrice - smaValue) / (maxPrice - minPrice)) * finalChartHeight + chartState.offsetY;
                    
                    if (currentPath === '') {
                      currentPath = `M ${scaledX} ${y}`;
                    } else {
                      currentPath += ` L ${scaledX} ${y}`;
                    }
                  } else if (currentPath !== '') {
                    pathSegments.push(currentPath);
                    currentPath = '';
                  }
                }
                
                if (currentPath !== '') {
                  pathSegments.push(currentPath);
                }
                
                return pathSegments.length > 0 ? (
                  <g>
                    {pathSegments.map((pathData, index) => (
                      <path
                        key={index}
                        d={pathData}
                        stroke={indicatorSettings.sma.color}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="5,5"
                        opacity="0.8"
                      />
                    ))}
                  </g>
                ) : null;
              })()}

              {/* RSI Line with Overbought/Oversold Levels */}
              {indicatorSettings.rsi.enabled && indicatorValues.rsi.length > 0 && candlesToDisplay.length > 0 && (() => {
                // Scale RSI to chart height (0-100 scale mapped to chart height)
                const rsiChartHeight = finalChartHeight * 0.2; // Use bottom 20% of chart for RSI
                const rsiOffsetY = finalChartHeight * 0.8; // Start RSI at 80% down the chart
                
                // Calculate overbought (70) and oversold (30) line positions
                const overboughtY = rsiOffsetY + ((100 - 70) / 100) * rsiChartHeight + chartState.offsetY;
                const oversoldY = rsiOffsetY + ((100 - 30) / 100) * rsiChartHeight + chartState.offsetY;
                
                let pathSegments: string[] = [];
                let currentPath = '';
                
                for (let i = 0; i < indicatorValues.rsi.length && i < candlesToDisplay.length; i++) {
                  const rsiValue = indicatorValues.rsi[i];
                  
                  if (rsiValue !== null && rsiValue !== undefined) {
                    const x = (i * finalCandleWidth) + (finalCandleWidth / 2);
                    const scaledX = (x * chartState.zoom) + chartState.offsetX;
                    // Scale RSI from 0-100 to fit in the bottom portion of chart
                    const y = rsiOffsetY + ((100 - rsiValue) / 100) * rsiChartHeight + chartState.offsetY;
                    
                    if (currentPath === '') {
                      currentPath = `M ${scaledX} ${y}`;
                    } else {
                      currentPath += ` L ${scaledX} ${y}`;
                    }
                  } else if (currentPath !== '') {
                    pathSegments.push(currentPath);
                    currentPath = '';
                  }
                }
                
                if (currentPath !== '') {
                  pathSegments.push(currentPath);
                }
                
                return (
                  <g>
                    {/* RSI Overbought Line (70) */}
                    <line
                      x1={0}
                      y1={overboughtY}
                      x2={finalChartWidth}
                      y2={overboughtY}
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.6"
                    />
                    
                    {/* RSI Oversold Line (30) */}
                    <line
                      x1={0}
                      y1={oversoldY}
                      x2={finalChartWidth}
                      y2={oversoldY}
                      stroke="#10b981"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.6"
                    />
                    
                    {/* RSI Value Line */}
                    {pathSegments.length > 0 && pathSegments.map((pathData, index) => (
                      <path
                        key={index}
                        d={pathData}
                        stroke={indicatorSettings.rsi.color}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="10,3"
                        opacity="0.7"
                      />
                    ))}
                    
                    {/* RSI Level Labels */}
                    <text
                      x={finalChartWidth - 30}
                      y={overboughtY - 5}
                      fill="#ef4444"
                      fontSize="10"
                      opacity="0.7"
                    >
                      70
                    </text>
                    <text
                      x={finalChartWidth - 30}
                      y={oversoldY - 5}
                      fill="#10b981"
                      fontSize="10"
                      opacity="0.7"
                    >
                      30
                    </text>
                  </g>
                );
              })()}
              
              {/* Live Price Line */}
              {(() => {
                const livePrice = getCurrentLivePrice();
                if (livePrice && livePrice >= minPrice && livePrice <= maxPrice) {
                  const livePriceY = ((maxPrice - livePrice) / (maxPrice - minPrice)) * finalChartHeight + chartState.offsetY;
                  const isPositive = historicalData?.candles && historicalData.candles.length > 0 && livePrice >= historicalData.candles[historicalData.candles.length - 1].close;
                  
                  return (
                    <g>
                      {/* Live price horizontal line */}
                      <line
                        x1={0}
                        y1={livePriceY}
                        x2={finalChartWidth - 90}
                        y2={livePriceY}
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth={2}
                        strokeDasharray="8,4"
                        opacity={0.8}
                      />
                      
                      {/* Live price label */}
                      <rect
                        x={finalChartWidth - 85}
                        y={livePriceY - 12}
                        width={80}
                        height={24}
                        fill={isPositive ? "#10b981" : "#ef4444"}
                        rx={4}
                        opacity={0.9}
                      />
                      
                      <text
                        x={finalChartWidth - 45}
                        y={livePriceY + 4}
                        textAnchor="middle"
                        fontSize="12"
                        fill="white"
                        fontWeight="bold"
                      >
                        {livePrice.toFixed(2)}
                      </text>
                      
                      {/* Live price indicator dot */}
                      <circle
                        cx={finalChartWidth - 90}
                        cy={livePriceY}
                        r={4}
                        fill={isPositive ? "#10b981" : "#ef4444"}
                        opacity={0.9}
                      >
                        <animate
                          attributeName="r"
                          values="4;6;4"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  );
                }
                return null;
              })()}
              
              {/* Drawing lines */}
              {chartState.lines.map((line) => (
                <line
                  key={line.id}
                  x1={line.startX}
                  y1={line.startY}
                  x2={line.endX}
                  y2={line.endY}
                  stroke={line.color}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              ))}
              
              {/* Current drawing line */}
              {chartState.currentLine && (
                <line
                  x1={chartState.currentLine.startX}
                  y1={chartState.currentLine.startY}
                  x2={chartState.currentLine.endX}
                  y2={chartState.currentLine.endY}
                  stroke={chartState.currentLine.color}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}

              {/* Crosshair lines */}
              {chartState.showCrosshair && chartState.hoveredCandle && (
                <g>
                  {/* Vertical crosshair line */}
                  <line
                    x1={chartState.mouseX}
                    y1={0}
                    x2={chartState.mouseX}
                    y2={finalChartHeight - 30}
                    stroke="#666"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.7"
                  />
                  {/* Horizontal crosshair line */}
                  <line
                    x1={0}
                    y1={chartState.mouseY}
                    x2={finalChartWidth - 80}
                    y2={chartState.mouseY}
                    stroke="#666"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.7"
                  />
                  
                  {/* Price indicator on right axis */}
                  {chartState.hoveredCandle && isValidOHLCData(chartState.hoveredCandle) && (
                    <g>
                      <rect
                        x={finalChartWidth - 78}
                        y={chartState.mouseY - 10}
                        width="76"
                        height="20"
                        fill="#333"
                        stroke="#666"
                        rx="3"
                      />
                      <text
                        x={finalChartWidth - 40}
                        y={chartState.mouseY + 4}
                        fill="white"
                        fontSize="12"
                        textAnchor="middle"
                      >
                        {getYPosition(chartState.mouseY, minPrice, maxPrice, finalChartHeight).toFixed(2)}
                      </text>
                    </g>
                  )}
                  
                  {/* Enhanced Time indicator positioned directly above price scale with zero spacing */}
                  {chartState.hoveredCandle && chartState.hoveredCandle.timestamp && isValidOHLCData(chartState.hoveredCandle) && (
                    <g>
                      <rect
                        x={chartState.mouseX - 55}
                        y={finalChartHeight - (candleSelectionMode ? 32 : 24) - 30}
                        width="110"
                        height={candleSelectionMode ? "32" : "24"}
                        fill={candleSelectionMode ? "#1f2937" : "#1f2937"}
                        stroke={candleSelectionMode ? "#f59e0b" : "#374151"}
                        strokeWidth={candleSelectionMode ? "2" : "1"}
                        rx="6"
                        opacity="0.98"
                        filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))"
                      />
                      {candleSelectionMode && (
                        <rect
                          x={chartState.mouseX - 53}
                          y={finalChartHeight - 30 - 28}
                          width="106"
                          height="28"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="1"
                          rx="4"
                          opacity="0.9"
                        />
                      )}
                      <text
                        x={chartState.mouseX}
                        y={finalChartHeight - 30 - (candleSelectionMode ? 18 : 12)}
                        fill={candleSelectionMode ? "#fbbf24" : "#f3f4f6"}
                        fontSize="12"
                        textAnchor="middle"
                        fontWeight={candleSelectionMode ? "700" : "600"}
                      >
                        {new Date(chartState.hoveredCandle.timestamp * 1000).toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </text>
                      {candleSelectionMode && (
                        <text
                          x={chartState.mouseX}
                          y={finalChartHeight - 30 - 6}
                          fill="#f59e0b"
                          fontSize="10"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          Click to start replay
                        </text>
                      )}
                    </g>
                  )}
                </g>
              )}

              {/* Date/Time scale at bottom */}
              <g>
                {/* Background for time scale */}
                <rect
                  x={0}
                  y={finalChartHeight - 30}
                  width={finalChartWidth - 80}
                  height="30"
                  fill="#f8f9fa"
                  stroke="#e9ecef"
                />
                
                {/* Time scale labels */}
                {candlesToDisplay && Array.from({ length: Math.min(6, candlesToDisplay.length) }, (_, i) => {
                  const index = Math.floor((i * candlesToDisplay.length) / 6);
                  const candle = candlesToDisplay[index];
                  if (!candle) return null;
                  
                  const x = (index * finalCandleWidth) + chartState.offsetX + (finalCandleWidth / 2);
                  if (x < 0 || x > finalChartWidth - 80) return null;
                  
                  return (
                    <g key={`time-scale-${index}-${candle.timestamp}-${i}`}>
                      <line
                        x1={x}
                        y1={finalChartHeight - 30}
                        x2={x}
                        y2={finalChartHeight - 25}
                        stroke="#666"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={finalChartHeight - 8}
                        fill="#666"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {new Date(candle.timestamp * 1000).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </text>
                      <text
                        x={x}
                        y={finalChartHeight - 18}
                        fill="#666"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* OHLC Compact Display - Top Corner */}
              {chartState.showCrosshair && chartState.hoveredCandle && isValidOHLCData(chartState.hoveredCandle) && (
                <text
                  x={10}
                  y={16}
                  fill="#666"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  O{chartState.hoveredCandle.open.toFixed(2)} H{chartState.hoveredCandle.high.toFixed(2)} L{chartState.hoveredCandle.low.toFixed(2)} C{chartState.hoveredCandle.close.toFixed(2)}
                </text>
              )}
            </svg>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
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

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Controls:</strong></p>
          <p>• Mouse wheel: Zoom chart in/out • Click and drag: Pan chart • Drawing mode: Click and drag to draw lines</p>
          <p>• Price scale: Drag top/bottom labels (↕) or use up/down arrow buttons to zoom price range</p>
          <p>• Two zoom types: Chart zoom (magnifying glass) and Price scale zoom (up/down arrows)</p>
        </div>
      </CardContent>
    </Card>
  );

  return chartComponent;
}