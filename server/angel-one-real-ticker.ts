import { Response } from 'express';
import { angelOneApi } from './angel-one-api';
import { angelOneWebSocket } from './angel-one-websocket';

// Exchange-specific trading hours configuration (IST)
interface TradingSession {
  openTime: number;   // Minutes from midnight (e.g., 9*60 + 15 = 555)
  closeTime: number;  // Minutes from midnight (e.g., 15*60 + 30 = 930)
}

const EXCHANGE_TRADING_HOURS: Record<string, TradingSession> = {
  // NSE - Cash & Equity (exch_seg: 'NSE' or '1')
  'NSE': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },      // 9:15 AM - 3:30 PM
  '1': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },        // 9:15 AM - 3:30 PM
  
  // NFO - NSE Futures & Options (exch_seg: 'NFO' or '2')
  'NFO': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },      // 9:15 AM - 3:30 PM
  '2': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },        // 9:15 AM - 3:30 PM
  
  // MCX - Commodities (exch_seg: 'MCX' or '3')
  'MCX': { openTime: 9 * 60 + 0, closeTime: 23 * 60 + 55 },       // 9:00 AM - 11:55 PM
  '3': { openTime: 9 * 60 + 0, closeTime: 23 * 60 + 55 },         // 9:00 AM - 11:55 PM
  
  // NCDEX - Agri Commodities (exch_seg: 'NCDEX' or '5')
  'NCDEX': { openTime: 9 * 60 + 0, closeTime: 20 * 60 + 0 },      // 9:00 AM - 8:00 PM
  '5': { openTime: 9 * 60 + 0, closeTime: 20 * 60 + 0 },          // 9:00 AM - 8:00 PM
  
  // BSE - Cash & Equity (exch_seg: 'BSE' or '6')
  'BSE': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },      // 9:15 AM - 3:30 PM
  '6': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },        // 9:15 AM - 3:30 PM
  
  // BFO - BSE Futures & Options (exch_seg: 'BFO' or '7')
  'BFO': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },      // 9:15 AM - 3:30 PM
  '7': { openTime: 9 * 60 + 15, closeTime: 15 * 60 + 30 },        // 9:15 AM - 3:30 PM
};

export interface RealLivePrice {
  symbol: string;
  symbolToken: string;
  exchange: string;
  tradingSymbol: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  ltp: number;
  volume: number;
  isRealTime?: boolean;
  marketStatus?: 'live' | 'delayed' | 'closed';
}

interface RealClientConnection {
  id: string;
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
  tradingSymbol: string;
  lastPrice: RealLivePrice | null;
  initialOhlc: { open: number; high: number; low: number; close: number; volume: number; ltp?: number };
  fallbackCount: number;
  webSocketSubscribed: boolean; // Track WebSocket subscription status
  // Candle OHLC tracking - tracks OHL for current candle interval based on LTP ticks
  candleOhlc: { open: number; high: number; low: number; close: number; candleStartTime: number; intervalSeconds: number };
}

class AngelOneRealTicker {
  private clients = new Map<string, RealClientConnection>();
  private broadcastInterval: NodeJS.Timeout | null = null;
  private lastRealDataTime: number = 0;

  addClient(clientId: string, res: Response, symbol: string, symbolToken: string, exchange: string, tradingSymbol: string, initialOhlc?: { open: number; high: number; low: number; close: number; volume: number; ltp?: number }, intervalSecondsParam?: number): void {
    // Set SSE headers with CORS
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    // Initialize with last known candle data
    const ohlc = initialOhlc || { open: 0, high: 0, low: 0, close: 0, volume: 0, ltp: 0 };

    // Use interval from frontend, default to 15 min if not provided
    const intervalSeconds = intervalSecondsParam || 900;
    const now = Math.floor(Date.now() / 1000);
    const candleStartTime = Math.floor(now / intervalSeconds) * intervalSeconds;
    console.log(`📡 [REAL-TICKER] Using ${intervalSeconds}s candle interval for ${symbol}`);

    // Store client
    const client: RealClientConnection = {
      id: clientId,
      res,
      symbol,
      symbolToken,
      exchange,
      tradingSymbol,
      lastPrice: null,
      initialOhlc: ohlc,
      fallbackCount: 0,
      webSocketSubscribed: false,
      // Initialize candle OHLC with initial values from historical data
      candleOhlc: {
        open: ohlc.open,
        high: ohlc.high,
        low: ohlc.low,
        close: ohlc.close,
        candleStartTime,
        intervalSeconds
      }
    };

    this.clients.set(clientId, client);
    console.log(`📡 [REAL-TICKER] Client connected: ${clientId} for ${symbol} (Total: ${this.clients.size})`);

    // Subscribe to WebSocket for real-time tick-by-tick updates
    this.subscribeToWebSocket(client);

    // Start broadcast if not running
    if (!this.broadcastInterval) {
      this.startBroadcast();
    }

    // Handle disconnect
    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  private normalizeExchange(exchange: string): string {
    // Normalize exchange codes to canonical form
    // Handles composite codes like MCX_COMM, NSE_EQ, etc.
    const upperExchange = exchange.toUpperCase();
    
    // Direct match first
    if (EXCHANGE_TRADING_HOURS[upperExchange]) {
      return upperExchange;
    }
    
    // Extract base exchange from composite codes
    if (upperExchange.startsWith('NSE')) return 'NSE';
    if (upperExchange.startsWith('BSE')) return 'BSE';
    if (upperExchange.startsWith('MCX')) return 'MCX';
    if (upperExchange.startsWith('NFO')) return 'NFO';
    if (upperExchange.startsWith('BFO')) return 'BFO';
    if (upperExchange.startsWith('NCDEX')) return 'NCDEX';
    
    // Default to NSE if unknown
    return 'NSE';
  }

  private isMarketOpen(exchange: string): boolean {
    // Normalize exchange code first
    const normalizedExchange = this.normalizeExchange(exchange);
    
    // Get exchange-specific trading hours
    const session = EXCHANGE_TRADING_HOURS[normalizedExchange] || EXCHANGE_TRADING_HOURS['NSE'];
    
    // Check if market is open based on exchange-specific hours (Monday-Friday)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    
    const dayOfWeek = istTime.getUTCDay();
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    return dayOfWeek >= 1 && dayOfWeek <= 5 && timeInMinutes >= session.openTime && timeInMinutes <= session.closeTime;
  }

  private subscribeToWebSocket(client: RealClientConnection): void {
    // Subscribe to WebSocket for tick-by-tick updates
    const key = `${client.symbol}_${client.symbolToken}`;
    
    const tickCallback = (wsData: any) => {
      const currentTime = Math.floor(Date.now() / 1000);
      const ltp = wsData.close || wsData.ltp || client.initialOhlc.close;
      
      if (ltp <= 0) return; // Skip invalid prices
      
      
      // CRITICAL FIX: Check if market is open BEFORE processing candle updates
      const marketOpenEarly = this.isMarketOpen(client.exchange);
      
      // If market is closed, only send last known price - DO NOT create new candles
      if (!marketOpenEarly) {
        const closedPrice: RealLivePrice = {
          symbol: client.symbol,
          symbolToken: client.symbolToken,
          exchange: client.exchange,
          tradingSymbol: client.tradingSymbol,
          time: currentTime,
          open: client.candleOhlc.open,
          high: client.candleOhlc.high,
          low: client.candleOhlc.low,
          close: client.candleOhlc.close,
          ltp: ltp,
          volume: wsData.volume || 0,
          isRealTime: false,
          marketStatus: 'closed',
          candleStartTime: client.candleOhlc.candleStartTime,
          isNewCandle: false,
          isMarketOpen: false
        } as any;
        client.lastPrice = closedPrice;
        if (client.res.writable) {
          client.res.write(`data: ${JSON.stringify(closedPrice)}\n\n`);
        }
        return; // Skip all candle processing when market is closed
      }
      // Calculate current candle's start time
      const currentCandleStart = Math.floor(currentTime / client.candleOhlc.intervalSeconds) * client.candleOhlc.intervalSeconds;
      
      // Determine if this is a new candle BEFORE updating the candleOhlc
      const isNewCandle = currentCandleStart > client.candleOhlc.candleStartTime;
      
      // Check if we've moved to a new candle interval
      if (isNewCandle) {
        // New candle! Reset OHLC with current LTP as the new candle's open
        console.log(`🕯️ [CANDLE-NEW] ${client.symbol}: New candle started at ${new Date(currentCandleStart * 1000).toLocaleTimeString()} (${client.candleOhlc.intervalSeconds}s interval)`);
        client.candleOhlc = {
          open: ltp,
          high: ltp,
          low: ltp,
          close: ltp,
          candleStartTime: currentCandleStart,
          intervalSeconds: client.candleOhlc.intervalSeconds
        };
      } else {
        // Same candle - update HLC based on LTP
        client.candleOhlc.high = Math.max(client.candleOhlc.high, ltp);
        client.candleOhlc.low = Math.min(client.candleOhlc.low, ltp);
        client.candleOhlc.close = ltp;
      }
      
      // Send candle data with properly tracked OHLC (not day's OHLC)
      // CRITICAL FIX: Check if market is actually open before marking as 'live'
      const marketOpen = this.isMarketOpen(client.exchange);
      const livePrice: RealLivePrice = {
        symbol: client.symbol,
        symbolToken: client.symbolToken,
        exchange: client.exchange,
        tradingSymbol: client.tradingSymbol,
        time: currentTime,
        open: client.candleOhlc.open,
        high: client.candleOhlc.high,
        low: client.candleOhlc.low,
        close: client.candleOhlc.close,
        ltp: ltp,
        volume: wsData.volume || 0,
        isRealTime: marketOpen,
        marketStatus: marketOpen ? 'live' : 'closed',
        // Include candle timing info for frontend
        candleStartTime: client.candleOhlc.candleStartTime,
        isNewCandle: isNewCandle,
        isMarketOpen: marketOpen
      } as any;
      
      client.lastPrice = livePrice;
      if (client.res.writable) {
        client.res.write(`data: ${JSON.stringify(livePrice)}\n\n`);
      }
    };

    // Subscribe using Angel One API
    angelOneApi.subscribeToWebSocket(
      client.exchange,
      client.symbolToken,
      client.tradingSymbol,
      tickCallback
    );
    
    client.webSocketSubscribed = true;
    console.log(`📡 [REAL-TICKER] WebSocket subscribed for ${client.symbol}`);
  }

  private startBroadcast(): void {
    console.log(`📡 [REAL-TICKER] Starting broadcast loop for fallback data (700ms interval)`);
    
    let broadcastCount = 0;
    
    this.broadcastInterval = setInterval(() => {
      broadcastCount++;
      
      // Log status periodically
      if (broadcastCount % 50 === 1) {
        const activeClients = this.clients.size;
        // Check market status for active exchanges
        const exchanges = Array.from(new Set(Array.from(this.clients.values()).map(c => c.exchange)));
        const marketStatuses = exchanges.map(ex => `${ex}:${this.isMarketOpen(ex) ? 'OPEN' : 'CLOSED'}`).join(', ');
        console.log(`📡 [REAL-TICKER] Cycle ${broadcastCount} | ${activeClients} clients | Markets: ${marketStatuses || 'NONE'}`);
      }

      // For each client, send fallback data if WebSocket hasn't provided live data
      const clientEntries = Array.from(this.clients.entries());
      for (const [clientId, client] of clientEntries) {
        try {
          // If no live price yet, use fallback data (will be overridden by WebSocket)
          if (!client.lastPrice) {
            // CRITICAL FIX: Include isMarketOpen in fallback data too
            const marketOpen = this.isMarketOpen(client.exchange);
            const fallbackPrice: RealLivePrice = {
              symbol: client.symbol,
              symbolToken: client.symbolToken,
              exchange: client.exchange,
              tradingSymbol: client.tradingSymbol,
              time: Math.floor(Date.now() / 1000),
              open: client.initialOhlc.open,
              high: client.initialOhlc.high,
              low: client.initialOhlc.low,
              close: client.initialOhlc.close,
              ltp: client.initialOhlc.close,
              volume: client.initialOhlc.volume,
              isRealTime: false,
              marketStatus: marketOpen ? 'delayed' : 'closed',
              isMarketOpen: marketOpen
            } as any;

            client.fallbackCount++;
            if (client.fallbackCount === 1) {
              console.log(`📊 [REAL-TICKER] Waiting for WebSocket data: ${client.symbol}`);
            }

            if (client.res.writable) {
              client.lastPrice = fallbackPrice;
              client.res.write(`data: ${JSON.stringify(fallbackPrice)}\n\n`);
            }
          }
        } catch (error) {
          if (broadcastCount % 100 === 1) {
            console.error(`❌ [REAL-TICKER] Error for ${client.symbol}:`, error instanceof Error ? error.message : String(error));
          }
        }
      }
    }, 700); // 700ms interval - fallback only, WebSocket provides live updates
  }

  private removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`📡 [REAL-TICKER] Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);

    if (this.clients.size === 0 && this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log('📡 [REAL-TICKER] Broadcast stopped (no active clients)');
    }
  }

  getStatus(): any {
    return {
      activeClients: this.clients.size,
      isStreaming: this.broadcastInterval !== null,
      lastRealDataTime: this.lastRealDataTime,
      clients: Array.from(this.clients.values()).map(c => ({
        id: c.id,
        symbol: c.symbol,
        usingFallback: c.fallbackCount > 0,
        fallbackCount: c.fallbackCount,
        lastPrice: c.lastPrice
      }))
    };
  }
}

export const angelOneRealTicker = new AngelOneRealTicker();
