// import { fyersApi } from "./fyers-api"; // Removed: Fyers API removed
import { storage } from "./storage";
import { WebSocket } from "ws";

export interface LiveOHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isComplete: boolean;
}

export interface LiveTradeUpdate {
  tradeId: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPL: number;
  percentageChange: number;
  lastUpdate: string;
  symbol: string;
  side: string;
  quantity: number;
  candlePhase: '5th Candle' | '6th Candle';
  pointsChange: number;
  entryTime: string;
  exitEligible: string[];
}

export class Cycle3LiveDataStreamer {
  private connections = new Set<WebSocket>();
  private streamingInterval: NodeJS.Timeout | null = null;
  private isStreaming = false;
  
  // Track current 6th candle data
  private current6thCandleData: LiveOHLCData | null = null;
  private activeTrades: any[] = [];

  // 5th Candle Live Validation
  private fifthCandleValidation = {
    isActive: false,
    candleStartTime: 0,
    candleEndTime: 0,
    timeframeMinutes: 5,
    symbol: 'NSE:NIFTY50-INDEX',
    initialOHLC: { open: 0, high: 0, low: 0, close: 0, volume: 0 },
    liveOHLC: { open: 0, high: 0, low: 0, close: 0, volume: 0 },
    completionPercentage: 0,
    remainingSeconds: 0
  };

  // CRITICAL FIX: Progression tracking
  private progressionCallbacks: ((type: string, data: any) => void)[] = [];

  constructor() {
    console.log('🚀 Cycle 3 Live Data Streamer initialized');
    console.log('🎯 5th Candle Live Validation ready for 700ms streaming');
  }

  addConnection(ws: WebSocket) {
    this.connections.add(ws);
    console.log(`📡 Client connected to live data stream. Total connections: ${this.connections.size}`);
    
    // Send initial connection confirmation
    this.sendToClient(ws, {
      type: 'connection',
      status: 'connected',
      message: 'Live 6th candle OHLC streaming activated'
    });
  }

  removeConnection(ws: WebSocket) {
    this.connections.delete(ws);
    console.log(`📡 Client disconnected from live data stream. Total connections: ${this.connections.size}`);
    
    // Stop streaming if no connections
    if (this.connections.size === 0) {
      this.stopStreaming();
    }
  }

  private sendToClient(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  broadcast(data: any) {
    this.connections.forEach(ws => {
      this.sendToClient(ws, data);
    });
  }

  async startCycle3Streaming(symbol: string, timeframeMinutes: number, sixthCandleStartTime: number) {
    if (this.isStreaming) {
      console.log('🔄 Cycle 3 streaming already active, updating parameters');
    }

    this.isStreaming = true;
    console.log(`🚀 Starting Cycle 3 live streaming for ${symbol} - ${timeframeMinutes}min timeframe`);
    console.log(`📊 6th candle start time: ${new Date(sixthCandleStartTime * 1000).toLocaleString()}`);

    // Initialize 6th candle tracking
    this.current6thCandleData = {
      timestamp: sixthCandleStartTime,
      open: 0,
      high: 0,
      low: Number.MAX_VALUE,
      close: 0,
      volume: 0,
      isComplete: false
    };

    // Load active trades
    await this.loadActiveTrades();

    // Start streaming with 700ms intervals
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
    }

    this.streamingInterval = setInterval(async () => {
      await this.updateLiveData(symbol, timeframeMinutes, sixthCandleStartTime);
    }, 700); // 700ms as requested

    console.log(`⏰ Live streaming started with 700ms intervals for ${timeframeMinutes}min 6th candle`);
  }

  private async loadActiveTrades() {
    try {
      const allTrades = await storage.getAllTrades();
      this.activeTrades = allTrades.filter(trade => trade.status === 'open');
      console.log(`📊 Loaded ${this.activeTrades.length} active trades for P&L tracking`);
    } catch (error) {
      console.error('Error loading active trades:', error);
      this.activeTrades = [];
    }
  }

  private async updateLiveData(symbol: string, timeframeMinutes: number, sixthCandleStartTime: number) {
    try {
      // Try to get live price using multiple methods for reliability
      let currentPrice: number = 0;
      
      try {
        const liveQuotes = null; // fyersApi.getQuotes([symbol]);
        if (liveQuotes && liveQuotes.length > 0) {
          currentPrice = liveQuotes[0].lp;
        }
      } catch (quoteError) {
        console.log('📊 Live quotes failed, trying historical data fallback...');
        
        // Fallback: Use most recent historical data point
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const historicalData = null; // fyersApi.getHistoricalData({
            symbol: symbol,
            resolution: "1",
            date_format: "1", 
            range_from: todayStr,
            range_to: todayStr,
            cont_flag: "1"
          });
          
          if (historicalData && historicalData.length > 0) {
            const latestCandle = historicalData[historicalData.length - 1];
            currentPrice = latestCandle[4]; // Close price
            console.log(`📊 Using latest historical price: ₹${currentPrice}`);
          }
        } catch (historicalError) {
          console.warn('⚠️ Both live quotes and historical fallback failed');
          return;
        }
      }

      if (currentPrice === 0) {
        console.warn('⚠️ No valid price data available');
        return;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      console.log(`📊 Live update: ${symbol} @ ₹${currentPrice} | Time: ${currentTime}`);

      // Handle 5th Candle Live Validation
      if (this.fifthCandleValidation.isActive) {
        const fifthCandleElapsed = currentTime - this.fifthCandleValidation.candleStartTime;
        const fifthCandleDuration = this.fifthCandleValidation.timeframeMinutes * 60;
        
        // Initialize 5th candle OHLC on first update
        if (this.fifthCandleValidation.liveOHLC.open === 0) {
          this.fifthCandleValidation.liveOHLC.open = currentPrice;
          this.fifthCandleValidation.initialOHLC.open = currentPrice;
        }
        
        // Update live OHLC for 5th candle
        this.fifthCandleValidation.liveOHLC.high = Math.max(this.fifthCandleValidation.liveOHLC.high || currentPrice, currentPrice);
        this.fifthCandleValidation.liveOHLC.low = Math.min(this.fifthCandleValidation.liveOHLC.low || currentPrice, currentPrice);
        this.fifthCandleValidation.liveOHLC.close = currentPrice;
        this.fifthCandleValidation.completionPercentage = Math.min(100, (fifthCandleElapsed / fifthCandleDuration) * 100);
        this.fifthCandleValidation.remainingSeconds = Math.max(0, fifthCandleDuration - fifthCandleElapsed);
        
        // Broadcast 5th candle live update
        const fifthCandleUpdate = {
          type: 'fifth_candle_live_update',
          timestamp: new Date().toISOString(),
          symbol: this.fifthCandleValidation.symbol,
          timeframe: this.fifthCandleValidation.timeframeMinutes,
          currentPrice: currentPrice,
          marketTime: new Date().toLocaleTimeString('en-US', { 
            hour12: true, 
            timeZone: 'Asia/Kolkata' 
          }),
          fifthCandle: {
            timestamp: this.fifthCandleValidation.candleStartTime,
            open: this.fifthCandleValidation.liveOHLC.open,
            high: this.fifthCandleValidation.liveOHLC.high,
            low: this.fifthCandleValidation.liveOHLC.low,
            close: this.fifthCandleValidation.liveOHLC.close,
            volume: this.fifthCandleValidation.liveOHLC.volume,
            isComplete: fifthCandleElapsed >= fifthCandleDuration,
            remainingTime: this.fifthCandleValidation.remainingSeconds,
            completionPercentage: this.fifthCandleValidation.completionPercentage
          }
        };
        
        this.broadcast(fifthCandleUpdate);
        
        // Auto-complete 5th candle validation if time is up
        if (fifthCandleElapsed >= fifthCandleDuration) {
          console.log(`✅ 5th candle validation completed for ${timeframeMinutes}min timeframe`);
          
          // CRITICAL FIX: Trigger progression to 6th candle automatically
          const sixthCandleStartTime = this.fifthCandleValidation.candleEndTime;
          console.log(`🚀 AUTO PROGRESSION: 5th candle complete, starting 6th candle at ${new Date(sixthCandleStartTime * 1000).toLocaleTimeString()}`);
          
          // Stop 5th candle validation
          this.stop5thCandleValidation();
          
          // Auto-start 6th candle monitoring
          await this.startCycle3Streaming(symbol, timeframeMinutes, sixthCandleStartTime);
          
          // Notify progression callbacks
          this.notifyProgressionCallbacks('5th_to_6th_progression', {
            fifthCandleComplete: true,
            sixthCandleStartTime: sixthCandleStartTime,
            timeframe: timeframeMinutes
          });
        }
      }
      
      // Calculate 6th candle completion
      const sixthCandleEndTime = sixthCandleStartTime + (timeframeMinutes * 60);
      const isComplete = currentTime >= sixthCandleEndTime;
      
      // Update 6th candle OHLC data
      if (this.current6thCandleData) {
        if (this.current6thCandleData.open === 0) {
          this.current6thCandleData.open = currentPrice; // Set open price on first update
        }
        
        this.current6thCandleData.high = Math.max(this.current6thCandleData.high, currentPrice);
        this.current6thCandleData.low = Math.min(this.current6thCandleData.low, currentPrice);
        this.current6thCandleData.close = currentPrice;
        this.current6thCandleData.isComplete = isComplete;
      }

      // Calculate live P&L for active trades (5th & 6th candle monitoring)
      const tradeUpdates: LiveTradeUpdate[] = [];
      let totalUnrealizedPL = 0;

      for (const trade of this.activeTrades) {
        const entryPrice = trade.entryPrice || 0;
        const quantity = trade.quantity || 1;
        let unrealizedPL = 0;
        
        // Calculate P&L based on trade direction
        if (trade.side === 'buy') {
          unrealizedPL = (currentPrice - entryPrice) * quantity;
        } else if (trade.side === 'sell') {
          unrealizedPL = (entryPrice - currentPrice) * quantity;
        }

        const percentageChange = ((unrealizedPL / (entryPrice * quantity)) * 100);
        totalUnrealizedPL += unrealizedPL;

        // Determine if trade is in 5th or 6th candle phase
        const tradeTimestamp = trade.entryTimestamp || 0;
        const candlePhase = currentTime < (sixthCandleStartTime) ? '5th Candle' : '6th Candle';
        
        // Check if trade should have been closed in 5th candle
        const shouldTrack = trade.status === 'open' || trade.status === 'active';

        // Only track P&L for open trades - exit scenarios check will close trades automatically
        if (shouldTrack) {
          const eligibleExits = this.checkExitScenarios(trade, currentPrice, candlePhase);
          
          // Only add to updates if trade is still active after exit check
          if (trade.status === 'open' || trade.status === 'active') {
            tradeUpdates.push({
              tradeId: trade.id,
              entryPrice: entryPrice,
              currentPrice: currentPrice,
              unrealizedPL: unrealizedPL,
              percentageChange: percentageChange,
              lastUpdate: new Date().toISOString(),
              symbol: trade.symbol,
              side: trade.side,
              quantity: quantity,
              candlePhase: candlePhase,
              pointsChange: Math.abs(currentPrice - entryPrice),
              entryTime: new Date(tradeTimestamp * 1000).toLocaleTimeString('en-US', { 
                hour12: true, 
                timeZone: 'Asia/Kolkata' 
              }),
              exitEligible: eligibleExits
            });
          }
        }
      }

      // Broadcast live update to all connected clients
      const liveUpdate = {
        type: 'cycle3_live_update',
        timestamp: new Date().toISOString(),
        symbol: symbol,
        timeframe: timeframeMinutes,
        currentPrice: currentPrice,
        marketTime: new Date().toLocaleTimeString('en-US', { 
          hour12: true, 
          timeZone: 'Asia/Kolkata' 
        }),
        sixthCandle: {
          ...this.current6thCandleData,
          remainingTime: Math.max(0, sixthCandleEndTime - currentTime),
          completionPercentage: Math.min(100, ((currentTime - sixthCandleStartTime) / (timeframeMinutes * 60)) * 100)
        },
        trades: {
          active: tradeUpdates,
          totalUnrealizedPL: totalUnrealizedPL,
          activeCount: this.activeTrades.length
        }
      };

      this.broadcast(liveUpdate);

      // Log every 10th update to reduce console spam
      if (Math.random() < 0.1) {
        console.log(`📊 Live update: ${symbol} @ ₹${currentPrice} | 6th candle ${isComplete ? 'COMPLETE' : 'in progress'} | ${this.activeTrades.length} active trades`);
      }

      // Auto-stop if 6th candle is complete and no active trades
      if (isComplete && this.activeTrades.length === 0) {
        console.log('✅ 6th candle complete and no active trades - stopping live streaming');
        this.stopStreaming();
      }

    } catch (error) {
      console.error('❌ Error updating live data:', error);
    }
  }

  // Check which exit scenarios are triggered and execute immediate trade closure
  private checkExitScenarios(trade: any, currentPrice: number, candlePhase: string): string[] {
    const eligibleExits: string[] = [];
    const entryPrice = trade.entryPrice || 0;
    const unrealizedPL = trade.side === 'buy' ? 
      (currentPrice - entryPrice) : (entryPrice - currentPrice);

    // All 6 Exit Scenarios with immediate closure logic
    let shouldCloseTrade = false;
    let exitReason = '';

    // Scenario A: Fast Trending (Real-time slope exceeds current price)
    if (Math.abs(unrealizedPL) > 20) {
      eligibleExits.push('A-Fast Trending');
      shouldCloseTrade = true;
      exitReason = 'A-Fast Trending';
    }

    // Scenario B: 80% Target Achievement
    const targetPL = trade.targetPL || 50; // Default target
    if (unrealizedPL >= (targetPL * 0.8)) {
      eligibleExits.push('B-80% Target');
      shouldCloseTrade = true;
      exitReason = 'B-80% Target';
    }

    // Scenario C: Market Close Protection (95% candle duration or market close)
    const currentTime = Math.floor(Date.now() / 1000);
    const candleStartTime = trade.candleStartTime || currentTime;
    const timeframeSeconds = (trade.timeframe || 20) * 60;
    const candleDuration = currentTime - candleStartTime;
    const completionPercentage = (candleDuration / timeframeSeconds) * 100;

    if (completionPercentage >= 95 || this.isMarketClose()) {
      eligibleExits.push('C-Market Close');
      shouldCloseTrade = true;
      exitReason = 'C-Market Close';
    }

    // Scenario D: Stop Loss (4th/5th candle extremes)
    const stopLoss = trade.stopLoss || 15; // Default stop
    if (unrealizedPL <= -stopLoss) {
      eligibleExits.push('D-Stop Loss');
      shouldCloseTrade = true;
      exitReason = 'D-Stop Loss';
    }

    // Scenario E: Target-Based Risk Elimination (50% target = risk-free)
    if (unrealizedPL >= (targetPL * 0.5)) {
      eligibleExits.push('E-Risk Free');
      // Move stop to entry but don't close yet
      trade.stopLoss = 0; // Risk-free position
    }

    // Scenario F: Duration-Based Dynamic Stop (50% duration = trailing stop)
    if (completionPercentage >= 50) {
      eligibleExits.push('F-Duration Stop');
      // Update trailing stop loss based on recent candle extremes
      const trailingStop = trade.side === 'buy' ? 
        (currentPrice - 10) : (currentPrice + 10); // 10 point trailing
      if (trade.side === 'buy' && currentPrice <= trailingStop) {
        shouldCloseTrade = true;
        exitReason = 'F-Duration Stop';
      } else if (trade.side === 'sell' && currentPrice >= trailingStop) {
        shouldCloseTrade = true;
        exitReason = 'F-Duration Stop';
      }
    }

    // Execute immediate trade closure if any exit scenario triggers
    if (shouldCloseTrade) {
      this.closeTrade(trade, currentPrice, exitReason, candlePhase);
    }

    return eligibleExits;
  }

  // Close trade immediately when exit scenario triggers
  private closeTrade(trade: any, exitPrice: number, exitReason: string, candlePhase: string) {
    const finalPL = trade.side === 'buy' ? 
      (exitPrice - trade.entryPrice) * trade.quantity : 
      (trade.entryPrice - exitPrice) * trade.quantity;

    console.log(`🔥 TRADE CLOSED: ${trade.symbol} at ₹${exitPrice}`);
    console.log(`   Entry: ₹${trade.entryPrice} | Exit: ₹${exitPrice}`);
    console.log(`   P&L: ₹${finalPL} | Reason: ${exitReason} | Phase: ${candlePhase}`);
    console.log(`   Duration: ${Math.floor((Date.now() - (trade.entryTimestamp * 1000)) / 60000)} minutes`);

    // Update trade status to closed
    trade.status = 'closed';
    trade.exitPrice = exitPrice;
    trade.exitReason = exitReason;
    trade.exitTimestamp = Math.floor(Date.now() / 1000);
    trade.finalPL = finalPL;

    // Remove from active trades tracking
    this.activeTrades = this.activeTrades.filter(t => t.id !== trade.id);

    // Broadcast trade closure
    this.broadcast({
      type: 'trade_closed',
      trade: {
        id: trade.id,
        symbol: trade.symbol,
        entryPrice: trade.entryPrice,
        exitPrice: exitPrice,
        finalPL: finalPL,
        exitReason: exitReason,
        candlePhase: candlePhase,
        duration: Math.floor((Date.now() - (trade.entryTimestamp * 1000)) / 60000)
      }
    });
  }

  // Check if market is closing (3:25 PM IST onwards)
  private isMarketClose(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    
    // Market closes at 3:30 PM, start exit at 3:25 PM
    return (hours === 15 && minutes >= 25) || hours > 15;
  }

  // Start 5th Candle Live Validation
  async start5thCandleValidation(symbol: string, timeframeMinutes: number, fifthCandleStartTime: number) {
    console.log(`🎯 Starting 5th candle live validation for ${symbol} (${timeframeMinutes}min)`);
    
    this.fifthCandleValidation = {
      isActive: true,
      candleStartTime: fifthCandleStartTime,
      candleEndTime: fifthCandleStartTime + (timeframeMinutes * 60),
      timeframeMinutes,
      symbol,
      initialOHLC: { open: 0, high: 0, low: 0, close: 0, volume: 0 },
      liveOHLC: { open: 0, high: 0, low: 0, close: 0, volume: 0 },
      completionPercentage: 0,
      remainingSeconds: timeframeMinutes * 60
    };

    // Start live streaming for 5th candle
    this.startStreaming();
    
    this.broadcast({
      type: 'fifth_candle_validation_started',
      symbol,
      timeframe: timeframeMinutes,
      startTime: fifthCandleStartTime,
      message: `5th candle live validation started - ${timeframeMinutes}min timeframe`
    });

    // CRITICAL FIX: Notify progression callbacks
    this.notifyProgressionCallbacks('5th_candle_started', {
      candleStartTime: fifthCandleStartTime,
      candleEndTime: this.fifthCandleValidation.candleEndTime,
      timeframe: timeframeMinutes,
      symbol: symbol
    });
  }

  // Stop 5th Candle Live Validation
  stop5thCandleValidation() {
    console.log('🛑 Stopping 5th candle live validation');
    
    this.fifthCandleValidation.isActive = false;
    
    this.broadcast({
      type: 'fifth_candle_validation_stopped',
      message: '5th candle live validation completed'
    });
  }

  stopStreaming() {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
    
    this.isStreaming = false;
    this.current6thCandleData = null;
    
    // Stop 5th candle validation if active
    if (this.fifthCandleValidation.isActive) {
      this.stop5thCandleValidation();
    }
    
    // Notify all clients that streaming has stopped
    this.broadcast({
      type: 'streaming_stopped',
      message: 'Live data streaming has been stopped',
      timestamp: new Date().toISOString()
    });
    
    console.log('🛑 Cycle 3 live data streaming stopped');
  }

  // Manually update active trades (called when new trades are opened/closed)
  async refreshActiveTrades() {
    await this.loadActiveTrades();
    console.log(`🔄 Refreshed active trades: ${this.activeTrades.length} open positions`);
  }

  isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }

  getConnectedClientsCount(): number {
    return this.connections.size;
  }

  // CRITICAL FIX: Add progression callback methods
  private notifyProgressionCallbacks(type: string, data: any): void {
    console.log(`📡 PROGRESSION CALLBACK: ${type}`, data);
    this.progressionCallbacks.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('❌ Progression callback error:', error);
      }
    });
  }

  public addProgressionCallback(callback: (type: string, data: any) => void): void {
    this.progressionCallbacks.push(callback);
    console.log(`📝 PROGRESSION CALLBACK: Added callback (${this.progressionCallbacks.length} total)`);
  }

  public removeProgressionCallback(callback: (type: string, data: any) => void): void {
    const index = this.progressionCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressionCallbacks.splice(index, 1);
      console.log(`🗑️ PROGRESSION CALLBACK: Removed callback (${this.progressionCallbacks.length} remaining)`);
    }
  }
}

// Export singleton instance
export const cycle3LiveStreamer = new Cycle3LiveDataStreamer();