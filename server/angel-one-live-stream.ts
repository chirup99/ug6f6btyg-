import { angelOneApi } from './angel-one-api';
import { Response } from 'express';

export interface LivePrice {
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
  isLive?: boolean;
  isMarketOpen?: boolean;
}

interface SSEClient {
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
  lastUpdate: number;
  sentClosedMarketData: boolean; // Track if we've already sent closed market data
}

interface InitialCandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

class AngelOneLiveStream {
  private clients: Map<string, SSEClient> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private currentCandle: Map<string, LivePrice> = new Map();
  private lastSuccessfulCandle: Map<string, LivePrice> = new Map();
  private initialChartCandle: Map<string, InitialCandleData> = new Map();
  private failureCount: Map<string, number> = new Map();

  constructor() {
    console.log('🔴 Angel One Live Stream Service initialized');
  }

  // Check if NSE market is currently open (9:15 AM - 3:30 PM IST, Mon-Fri)
  private isMarketOpen(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const dayOfWeek = istTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Market hours: 9:15 AM to 3:30 PM IST
    const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
    const marketEnd = 15 * 60 + 30;  // 3:30 PM in minutes
    const currentTime = hour * 60 + minute;

    return currentTime >= marketStart && currentTime <= marketEnd;
  }

  setInitialChartData(symbol: string, symbolToken: string, candleData: InitialCandleData): void {
    const key = `${symbol}_${symbolToken}`;
    this.initialChartCandle.set(key, candleData);
    console.log(`📊 [SSE] Initial chart data set for ${symbol}: O:${candleData.open} H:${candleData.high} L:${candleData.low} C:${candleData.close}`);
  }

  addClient(clientId: string, res: Response, symbol: string, symbolToken: string, exchange: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.clients.set(clientId, {
      res,
      symbol,
      symbolToken,
      exchange,
      lastUpdate: Date.now(),
      sentClosedMarketData: false
    });

    console.log(`🔴 [SSE] Client ${clientId} connected for ${symbol}`);

    const key = `${symbol}_${symbolToken}`;
    if (!this.currentCandle.has(key)) {
      const initialData = this.initialChartCandle.get(key);
      const now = Math.floor(Date.now() / 1000);
      
      if (initialData && initialData.close > 0) {
        this.currentCandle.set(key, {
          ltp: initialData.close,
          open: initialData.open,
          high: initialData.high,
          low: initialData.low,
          close: initialData.close,
          time: now,
          isLive: false,
          isMarketOpen: this.isMarketOpen()
        });
        console.log(`📊 [SSE] Using chart data as initial OHLC for ${symbol}`);
      } else {
        this.currentCandle.set(key, {
          ltp: 0,
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          time: now,
          isLive: false,
          isMarketOpen: this.isMarketOpen()
        });
      }
    }

    this.failureCount.set(key, 0);
    this.startPolling(symbol, symbolToken, exchange);

    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`🔴 [SSE] Client ${clientId} disconnected`);

      const key = `${client.symbol}_${client.symbolToken}`;
      const hasOtherClients = Array.from(this.clients.values()).some(
        c => `${c.symbol}_${c.symbolToken}` === key
      );

      if (!hasOtherClients) {
        this.stopPolling(key);
      }
    }
  }

  private startPolling(symbol: string, symbolToken: string, exchange: string): void {
    const key = `${symbol}_${symbolToken}`;
    
    if (this.pollingIntervals.has(key)) {
      return;
    }

    console.log(`📡 [POLL] Starting live price polling for ${symbol} at 700ms intervals`);

    const interval = setInterval(async () => {
      const marketOpen = this.isMarketOpen();
      
      // If market is closed, don't stream new candles - only send status once
      if (!marketOpen) {
        this.handleMarketClosed(key);
        return;
      }

      try {
        if (!angelOneApi.isConnected()) {
          // Market is open but API not connected - don't generate fake data
          console.log(`⏳ [POLL] Market open but Angel One not connected for ${symbol}`);
          return;
        }

        const ltp = await angelOneApi.getLTP(exchange, symbol, symbolToken);
        
        if (ltp && ltp.ltp > 0) {
          this.failureCount.set(key, 0);
          
          let candle = this.currentCandle.get(key);
          const now = Math.floor(Date.now() / 1000);
          
          if (!candle || candle.open === 0) {
            candle = {
              ltp: ltp.ltp,
              open: ltp.open || ltp.ltp,
              high: ltp.high || ltp.ltp,
              low: ltp.low || ltp.ltp,
              close: ltp.ltp,
              time: now,
              isLive: true,
              isMarketOpen: true
            };
          } else {
            candle.high = Math.max(candle.high, ltp.ltp);
            candle.low = candle.low > 0 ? Math.min(candle.low, ltp.ltp) : ltp.ltp;
            candle.close = ltp.ltp;
            candle.ltp = ltp.ltp;
            candle.time = now;
            candle.isLive = true;
            candle.isMarketOpen = true;
          }

          this.currentCandle.set(key, candle);
          this.lastSuccessfulCandle.set(key, { ...candle });
          this.broadcastUpdate(key, candle);
          
          // Reset the closed market flag for all clients when market is open
          this.clients.forEach((client) => {
            const clientKey = `${client.symbol}_${client.symbolToken}`;
            if (clientKey === key) {
              client.sentClosedMarketData = false;
            }
          });
        } else {
          // API returned no data but market is open - don't fake it
          console.log(`⚠️ [POLL] No data from Angel One for ${symbol} (market open)`);
        }
      } catch (error: any) {
        // API error during market hours - don't generate fake candles
        console.log(`⚠️ [POLL] API error for ${symbol}: ${error.message}`);
      }
    }, 700);

    this.pollingIntervals.set(key, interval);
  }

  // Handle market closed state - send last known data once, then stop streaming
  private handleMarketClosed(key: string): void {
    // Check if we've already sent closed market data to all clients for this key
    let allClientsSent = true;
    this.clients.forEach((client) => {
      const clientKey = `${client.symbol}_${client.symbolToken}`;
      if (clientKey === key && !client.sentClosedMarketData) {
        allClientsSent = false;
      }
    });

    // If all clients have received the closed market data, don't send again
    if (allClientsSent) {
      return;
    }

    // Get last known data (don't create new candles with new timestamps)
    const candle = this.lastSuccessfulCandle.get(key) || this.currentCandle.get(key);
    
    if (candle && candle.close > 0) {
      // Send with original timestamp and isLive: false, isMarketOpen: false
      const closedMarketCandle: LivePrice = {
        ...candle,
        isLive: false,
        isMarketOpen: false
        // Don't update time - keep original historical timestamp
      };
      
      // Broadcast to clients who haven't received closed market data yet
      this.clients.forEach((client) => {
        const clientKey = `${client.symbol}_${client.symbolToken}`;
        if (clientKey === key && !client.sentClosedMarketData) {
          try {
            client.res.write(`data: ${JSON.stringify(closedMarketCandle)}\n\n`);
            client.sentClosedMarketData = true;
            console.log(`🔴 [SSE] Sent closed market data to client for ${client.symbol} (no more streaming until market opens)`);
          } catch (error) {
            console.debug(`[SSE] Failed to send closed market data to client`);
          }
        }
      });
    }
  }

  private stopPolling(key: string): void {
    const interval = this.pollingIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
      console.log(`📡 [POLL] Stopped polling for ${key}`);
    }
  }

  private broadcastUpdate(key: string, candle: LivePrice): void {
    this.clients.forEach((client) => {
      const clientKey = `${client.symbol}_${client.symbolToken}`;
      if (clientKey === key) {
        try {
          client.res.write(`data: ${JSON.stringify(candle)}\n\n`);
        } catch (error) {
          console.debug(`[SSE] Failed to send to client`);
        }
      }
    });
  }

  getStatus(): { activeClients: number; activePolls: number; symbols: string[]; isMarketOpen: boolean } {
    return {
      activeClients: this.clients.size,
      activePolls: this.pollingIntervals.size,
      symbols: Array.from(this.pollingIntervals.keys()),
      isMarketOpen: this.isMarketOpen()
    };
  }
}

export const angelOneLiveStream = new AngelOneLiveStream();
