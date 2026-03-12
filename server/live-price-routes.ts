import { Router, Request, Response } from "express";
// import { fyersApi } from "./fyers-api"; // Removed: Fyers API removed
import { liveWebSocketStreamer } from "./live-websocket-streamer";

const router = Router();

// SSE connections for real-time streaming
const sseConnections = new Set<Response>();

// Health endpoint (define specific routes first)
router.get("/health", (req, res) => {
  const health = liveWebSocketStreamer.getHealthStatus();
  
  res.json({
    success: true,
    health,
    sseConnections: sseConnections.size,
    timestamp: new Date().toISOString()
  });
});

// SSE Streaming endpoint for real-time updates (define before /:symbol)
router.get("/stream", (req: Request, res: Response) => {
  console.log('🌊 SSE client connected for live price streaming');
  
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add connection to set
  sseConnections.add(res);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    status: 'connected',
    message: 'Live price streaming activated',
    timestamp: new Date().toISOString(),
    health: liveWebSocketStreamer.getHealthStatus()
  })}\n\n`);

  // Send initial price data with correct payload shape
  const initialData = liveWebSocketStreamer.getPriceData();
  res.write(`data: ${JSON.stringify({
    type: 'price_update',
    prices: initialData, // Changed from 'data' to 'prices'
    timestamp: new Date().toISOString(),
    health: liveWebSocketStreamer.getHealthStatus()
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log('🌊 SSE client disconnected from live price streaming');
    sseConnections.delete(res);
  });

  req.on('error', (error) => {
    console.error('❌ SSE connection error:', error);
    sseConnections.delete(res);
  });
});

// Live price endpoint for individual symbol - now using WebSocket streamer (define after specific routes)
router.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: "Symbol parameter is required"
      });
    }

    console.log(`📊 Live price request for ${symbol} (using WebSocket streamer)`);

    // Get live data from WebSocket streamer
    const liveData = liveWebSocketStreamer.getSymbolData(symbol);
    
    if (!liveData) {
      return res.status(404).json({
        success: false,
        error: "Symbol not found in live stream"
      });
    }

    // Get OHLC bars for chart display
    const ohlcBars = liveWebSocketStreamer.getOHLCBars(symbol, 100);
    
    console.log(`💰 Live price for ${symbol}: ₹${liveData.price} (${liveData.changePercent >= 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%) via ${liveData.source}`);

    res.json({
      success: true,
      symbol,
      price: liveData.price,
      change: liveData.change,
      changePercent: liveData.changePercent,
      timestamp: liveData.timestamp,
      lastUpdate: liveData.lastUpdate,
      candles: ohlcBars.length,
      historicalData: ohlcBars.map(bar => [
        bar.timestamp,
        bar.open,
        bar.high,
        bar.low,
        bar.close,
        bar.volume
      ]),
      isHistoricalData: false,
      isLiveData: liveData.isLive,
      dataSource: liveData.source,
      health: liveWebSocketStreamer.getHealthStatus()
    });

  } catch (error: any) {
    console.error(`❌ Error fetching live price for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: `Failed to fetch live price: ${error.message}`
    });
  }
});

// REAL-TIME BATCH ENDPOINT - Using WebSocket streamer instead of polling
router.post("/batch", async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Symbols array is required"
      });
    }

    console.log(`🚀 LIVE BATCH: Fetching real-time prices for ${symbols.length} symbols via WebSocket streamer`);
    const results: any = {};
    
    // Get live data from WebSocket streamer
    symbols.forEach((symbol: string) => {
      const liveData = liveWebSocketStreamer.getSymbolData(symbol);
      
      if (liveData) {
        results[symbol] = {
          success: true,
          symbol,
          price: liveData.price,
          change: liveData.change,
          changePercent: liveData.changePercent,
          isPositive: liveData.change >= 0,
          volume: liveData.volume,
          timestamp: liveData.timestamp,
          lastUpdate: liveData.lastUpdate,
          isHistoricalData: false,
          isLiveData: liveData.isLive,
          dataSource: liveData.source
        };
        
        console.log(`🚀 LIVE: ${symbol} = ₹${liveData.price} (${liveData.changePercent >= 0 ? '+' : ''}${liveData.changePercent.toFixed(2)}%) via ${liveData.source}`);
      } else {
        // Fallback if symbol not in streamer
        results[symbol] = {
          success: false,
          symbol,
          error: "Symbol not available in live stream",
          isHistoricalData: false,
          isLiveData: false,
          dataSource: 'error'
        };
      }
    });

    const successCount = Object.values(results).filter((result: any) => result.success).length;
    console.log(`✅ LIVE BATCH COMPLETE: ${successCount}/${symbols.length} symbols successful via WebSocket streamer`);

    res.json({
      success: true,
      results,
      totalSymbols: symbols.length,
      successfulSymbols: successCount,
      timestamp: new Date().toISOString(),
      dataSource: 'websocket_streamer',
      health: liveWebSocketStreamer.getHealthStatus()
    });

  } catch (error: any) {
    console.error(`❌ Batch live price error:`, error.message);
    res.status(500).json({
      success: false,
      error: `Failed to fetch batch live prices: ${error.message}`
    });
  }
});


// NEW: Function to broadcast to SSE clients (called by WebSocket streamer)
export function broadcastToSSEClients(data: any) {
  if (sseConnections.size === 0) {
    return;
  }

  // Use correct payload shape and proper newlines
  const message = `data: ${JSON.stringify({ type: 'price_update', prices: data })}\n\n`;
  
  // Broadcast to all connected SSE clients
  sseConnections.forEach((res) => {
    try {
      res.write(message);
    } catch (error) {
      console.error('❌ Error broadcasting to SSE client:', error);
      sseConnections.delete(res);
    }
  });
}

// Cleanup disconnected SSE connections periodically
setInterval(() => {
  sseConnections.forEach((res) => {
    if (res.destroyed || res.closed) {
      sseConnections.delete(res);
    }
  });
}, 30000); // Clean up every 30 seconds

export default router;