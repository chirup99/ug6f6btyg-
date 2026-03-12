import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from "lucide-react";

interface LivePLData {
  type: string;
  timestamp: string;
  currentPrice: number;
  marketTime: string;
  trades: any[];
  totalPL: number;
  unrealizedPL: number;
  realizedPL: number;
  activeTradesCount: number;
  closedTradesCount: number;
}

interface Cycle3LiveData {
  type: string;
  timestamp: string;
  symbol: string;
  timeframe: number;
  currentPrice: number;
  marketTime: string;
  sixthCandle: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    isComplete: boolean;
    remainingTime: number;
    completionPercentage: number;
  };
  trades: {
    active: any[];
    totalUnrealizedPL: number;
    activeCount: number;
  };
}

export function LivePLMonitor() {
  const [isConnected, setIsConnected] = useState(false);
  const [livePLData, setLivePLData] = useState<LivePLData | null>(null);
  const [cycle3Data, setCycle3Data] = useState<Cycle3LiveData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('🔌 Connecting to WebSocket for live P&L streaming:', wsUrl);
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected for live P&L');
      setIsConnected(true);
      setConnectionStatus('connected');
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📊 Live data received:', data);
        
        if (data.type === 'live_pnl') {
          setLivePLData(data);
        } else if (data.type === 'cycle3_live_update') {
          setCycle3Data(data);
          console.log(`🔄 Cycle 3 Update: ${data.timeframe}min timeframe - 6th candle ${data.sixthCandle.completionPercentage.toFixed(1)}% complete`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    wsRef.current.onclose = () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  // Start live P&L streaming on server
  const startStreaming = async () => {
    try {
      const response = await fetch('/api/live-pnl/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('🚀 Live P&L streaming started on server');
        connectWebSocket();
      }
    } catch (error) {
      console.error('Failed to start live P&L streaming:', error);
    }
  };

  // Stop live P&L streaming
  const stopStreaming = async () => {
    try {
      const response = await fetch('/api/live-pnl/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('🛑 Live P&L streaming stopped on server');
        disconnectWebSocket();
      }
    } catch (error) {
      console.error('Failed to stop live P&L streaming:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                Live P&L Monitor
              </CardTitle>
              <CardDescription className="mt-1">
                Real-time profit & loss tracking with 700ms price updates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {connectionStatus.toUpperCase()}
              </Badge>
              {isConnected ? (
                <Button onClick={disconnectWebSocket} size="sm" variant="outline">
                  <WifiOff className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              ) : (
                <Button onClick={connectWebSocket} size="sm">
                  <Wifi className="h-4 w-4 mr-1" />
                  Start Live Streaming
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Live P&L Data Display */}
          {livePLData && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Total P&L */}
                <div className={`p-3 rounded-lg ${
                  livePLData.totalPL >= 0 
                    ? 'bg-green-50 dark:bg-green-950/30' 
                    : 'bg-red-50 dark:bg-red-950/30'
                }`}>
                  <div className={`text-sm ${
                    livePLData.totalPL >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    Total P&L
                  </div>
                  <div className={`text-xl font-bold flex items-center gap-1 ${
                    livePLData.totalPL >= 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {livePLData.totalPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {formatCurrency(Math.abs(livePLData.totalPL))}
                  </div>
                </div>

                {/* Unrealized P&L */}
                <div className={`p-3 rounded-lg ${
                  livePLData.unrealizedPL >= 0 
                    ? 'bg-green-50 dark:bg-green-950/30' 
                    : 'bg-red-50 dark:bg-red-950/30'
                }`}>
                  <div className={`text-sm ${
                    livePLData.unrealizedPL >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    Unrealized P&L
                  </div>
                  <div className={`text-xl font-bold ${
                    livePLData.unrealizedPL >= 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {formatCurrency(Math.abs(livePLData.unrealizedPL))}
                  </div>
                </div>
              </div>

              {/* Active Trades */}
              {livePLData.trades && livePLData.trades.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Active Trades ({livePLData.trades.length})</h4>
                    <div className="text-xs text-gray-500">
                      Closed: {livePLData.closedTradesCount || 0}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {livePLData.trades.map((trade, index) => (
                      <div key={trade.id || index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-blue-400">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{trade.symbol}</span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                trade.side === 'buy' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {trade.side?.toUpperCase()}
                              </span>
                              {trade.pattern && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                  {trade.pattern}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <div>Entry: ₹{trade.entryPrice.toFixed(2)}</div>
                              <div>Current: ₹{trade.currentPrice.toFixed(2)}</div>
                              <div>Qty: {trade.quantity}</div>
                              <div>
                                {trade.entryTime && new Date(trade.entryTime).toLocaleTimeString('en-US', { 
                                  hour12: true, 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </div>
                            <div className={`text-xs ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {((trade.pnl / (trade.entryPrice * trade.quantity)) * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div className="text-xs text-gray-500 mt-3">
                Last updated: {new Date(livePLData.timestamp).toLocaleTimeString('en-US', { 
                  hour12: true, 
                  timeZone: 'Asia/Kolkata' 
                })}
              </div>
            </div>
          )}

          {/* No Data State */}
          {!livePLData && isConnected && (
            <div className="text-center text-gray-500 py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p>Waiting for live P&L data...</p>
              <p className="text-xs">700ms streaming active</p>
            </div>
          )}

          {/* Disconnected State */}
          {!isConnected && (
            <div className="text-center text-gray-500 py-8">
              <WifiOff className="h-8 w-8 mx-auto mb-2" />
              <p>Live P&L streaming not active</p>
              <p className="text-xs">Click "Start Live Streaming" to begin</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cycle 3 Live 6th Candle Streaming */}
      {cycle3Data && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                  Cycle 3: Live 6th Candle
                </CardTitle>
                <CardDescription className="mt-1">
                  Real-time OHLC streaming for {cycle3Data.timeframe}min timeframe completion
                </CardDescription>
              </div>
              <Badge variant={cycle3Data.sixthCandle.isComplete ? "default" : "secondary"} className="text-xs">
                {cycle3Data.sixthCandle.isComplete ? 'COMPLETE' : 'STREAMING'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 6th Candle Progress */}
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">6th Candle Progress</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {cycle3Data.sixthCandle.completionPercentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-orange-400 h-2 rounded-full transition-all duration-700" 
                  style={{ width: `${cycle3Data.sixthCandle.completionPercentage}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Open:</span>
                    <span className="font-medium">₹{cycle3Data.sixthCandle.open.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">High:</span>
                    <span className="font-medium text-green-600">₹{cycle3Data.sixthCandle.high.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Low:</span>
                    <span className="font-medium text-red-600">₹{cycle3Data.sixthCandle.low.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current:</span>
                    <span className="font-medium">₹{cycle3Data.sixthCandle.close.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {!cycle3Data.sixthCandle.isComplete && (
                <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                    <span className="font-medium">
                      {Math.floor(cycle3Data.sixthCandle.remainingTime / 60)}m {cycle3Data.sixthCandle.remainingTime % 60}s
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Trade Updates during Cycle 3 */}
            {cycle3Data.trades.active && cycle3Data.trades.active.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium">Live Trade Updates</h4>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {cycle3Data.trades.activeCount} positions
                  </span>
                </div>
                
                <div className="space-y-2">
                  {cycle3Data.trades.active.map((trade, index) => (
                    <div key={trade.tradeId || index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                      <div className="flex justify-between items-center">
                        <div className="text-xs">
                          <span className="font-medium">Trade #{trade.tradeId}</span>
                          <span className="text-gray-500 ml-2">Entry: ₹{trade.entryPrice}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${trade.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.unrealizedPL >= 0 ? '+' : ''}₹{trade.unrealizedPL.toFixed(2)}
                          </div>
                          <div className={`text-xs ${trade.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.percentageChange >= 0 ? '+' : ''}{trade.percentageChange.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Unrealized P&L:</span>
                    <span className={`text-lg font-bold ${cycle3Data.trades.totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cycle3Data.trades.totalUnrealizedPL >= 0 ? '+' : ''}₹{cycle3Data.trades.totalUnrealizedPL.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Last updated: {cycle3Data.marketTime} • 700ms refresh rate
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}