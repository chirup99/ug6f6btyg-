/**
 * CANDLE PROGRESSION MANAGER
 * Handles automatic progression from 4th candle (C2B) completion to 5th and 6th candle monitoring
 * Fixes critical bug where system doesn't automatically move to 5th candle after C2B completion
 */

// import { fyersApi } from "./fyers-api"; // Removed: Fyers API removed
import { Cycle3LiveDataStreamer } from "./cycle3-live-data-streamer";

export interface CandleCompletionStatus {
  candleNumber: number;
  candleName: string;
  isComplete: boolean;
  completionTime: number;
  nextCandleStartTime: number;
  nextCandleName: string;
  timeframeMinutes: number;
}

export interface ProgressionTrigger {
  fromCandle: string;
  toCandle: string;
  triggerTime: number;
  shouldStartMonitoring: boolean;
  pointABUpdated: boolean;
}

export class CandleProgressionManager {
  private progressionTriggers: ProgressionTrigger[] = [];
  private cycle3Streamer: Cycle3LiveDataStreamer;
  private isMonitoringProgression = false;
  private currentTimeframe = 5; // Default 5-minute timeframe
  
  constructor(cycle3Streamer: Cycle3LiveDataStreamer) {
    this.cycle3Streamer = cycle3Streamer;
    console.log('🔄 CANDLE PROGRESSION MANAGER: Initialized for automatic candle progression');
  }

  /**
   * CRITICAL FIX: Detect when 4th candle (C2B) is complete and trigger 5th candle monitoring
   */
  async checkCandleCompletion(
    symbol: string,
    currentTimeframe: number,
    liveData: any[]
  ): Promise<CandleCompletionStatus | null> {
    
    const now = Date.now() / 1000; // Current timestamp in seconds
    this.currentTimeframe = currentTimeframe;
    
    console.log(`🔍 PROGRESSION CHECK: Monitoring candle completion for ${currentTimeframe}min timeframe`);
    
    // Calculate 4th candle (C2B) completion time
    const fourthCandleCompletionTime = this.calculateCandleCompletionTime(4, currentTimeframe);
    const fifthCandleStartTime = fourthCandleCompletionTime;
    const fifthCandleCompletionTime = this.calculateCandleCompletionTime(5, currentTimeframe);
    
    console.log(`⏰ CANDLE TIMING CHECK:`);
    console.log(`   4th Candle (C2B) completes at: ${new Date(fourthCandleCompletionTime * 1000).toLocaleTimeString()}`);
    console.log(`   5th Candle starts at: ${new Date(fifthCandleStartTime * 1000).toLocaleTimeString()}`);
    console.log(`   5th Candle completes at: ${new Date(fifthCandleCompletionTime * 1000).toLocaleTimeString()}`);
    console.log(`   Current time: ${new Date(now * 1000).toLocaleTimeString()}`);
    
    // Check if 4th candle just completed
    const timeSinceC2BCompletion = now - fourthCandleCompletionTime;
    const isC2BJustCompleted = timeSinceC2BCompletion >= 0 && timeSinceC2BCompletion <= 60; // Within 1 minute
    
    if (isC2BJustCompleted && !this.isProgressionTriggered('C2B', '5th')) {
      console.log(`🚨 CRITICAL TRIGGER: 4th candle (C2B) just completed! Starting 5th candle monitoring`);
      
      // Trigger progression to 5th candle
      await this.triggerFifthCandleProgression(symbol, fifthCandleStartTime);
      
      return {
        candleNumber: 4,
        candleName: 'C2B',
        isComplete: true,
        completionTime: fourthCandleCompletionTime,
        nextCandleStartTime: fifthCandleStartTime,
        nextCandleName: '5th Candle',
        timeframeMinutes: currentTimeframe
      };
    }
    
    // Check if 5th candle just completed
    const timeSince5thCompletion = now - fifthCandleCompletionTime;
    const is5thJustCompleted = timeSince5thCompletion >= 0 && timeSince5thCompletion <= 60;
    
    if (is5thJustCompleted && !this.isProgressionTriggered('5th', '6th')) {
      console.log(`🚨 CRITICAL TRIGGER: 5th candle just completed! Starting 6th candle monitoring`);
      
      const sixthCandleStartTime = fifthCandleCompletionTime;
      await this.triggerSixthCandleProgression(symbol, sixthCandleStartTime);
      
      return {
        candleNumber: 5,
        candleName: '5th Candle',
        isComplete: true,
        completionTime: fifthCandleCompletionTime,
        nextCandleStartTime: sixthCandleStartTime,
        nextCandleName: '6th Candle',
        timeframeMinutes: currentTimeframe
      };
    }
    
    return null;
  }

  /**
   * CRITICAL FIX: Trigger 5th candle monitoring after C2B completion
   */
  private async triggerFifthCandleProgression(symbol: string, fifthCandleStartTime: number): Promise<void> {
    console.log(`🚀 FIFTH CANDLE PROGRESSION: Starting 5th candle monitoring`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   5th Candle Start: ${new Date(fifthCandleStartTime * 1000).toLocaleString()}`);
    console.log(`   Timeframe: ${this.currentTimeframe} minutes`);
    
    // Record this progression trigger
    this.recordProgressionTrigger('C2B', '5th', fifthCandleStartTime, true);
    
    // Start 5th candle live monitoring
    await this.cycle3Streamer.start5thCandleValidation(
      symbol,
      this.currentTimeframe,
      fifthCandleStartTime
    );
    
    // Update Point A/B Analysis for 5th candle
    await this.updatePointABAnalysisFor5thCandle(symbol);
    
    console.log(`✅ FIFTH CANDLE PROGRESSION: 5th candle monitoring activated successfully`);
  }

  /**
   * CRITICAL FIX: Trigger 6th candle monitoring after 5th candle completion
   */
  private async triggerSixthCandleProgression(symbol: string, sixthCandleStartTime: number): Promise<void> {
    console.log(`🚀 SIXTH CANDLE PROGRESSION: Starting 6th candle monitoring`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   6th Candle Start: ${new Date(sixthCandleStartTime * 1000).toLocaleString()}`);
    console.log(`   Timeframe: ${this.currentTimeframe} minutes`);
    
    // Record this progression trigger
    this.recordProgressionTrigger('5th', '6th', sixthCandleStartTime, true);
    
    // Start 6th candle live monitoring
    await this.cycle3Streamer.startCycle3Streaming(
      symbol,
      this.currentTimeframe,
      sixthCandleStartTime
    );
    
    // Update Point A/B Analysis for 6th candle
    await this.updatePointABAnalysisFor6thCandle(symbol);
    
    console.log(`✅ SIXTH CANDLE PROGRESSION: 6th candle monitoring activated successfully`);
  }

  /**
   * Update Point A/B Analysis for 5th candle progression
   */
  private async updatePointABAnalysisFor5thCandle(symbol: string): Promise<void> {
    console.log(`🔄 POINT A/B UPDATE: Updating analysis for 5th candle progression`);
    
    try {
      // Fetch fresh 1-minute data for Point A/B recalculation
      const currentDate = new Date().toISOString().split('T')[0];
      const oneMinuteData = null; // fyersApi.getHistoricalData({
        symbol: symbol,
        resolution: '1',
        date_format: "1",
        range_from: currentDate,
        range_to: currentDate,
        cont_flag: "1"
      });

      if (oneMinuteData && oneMinuteData.length > 0) {
        console.log(`📊 POINT A/B UPDATE: Fetched ${oneMinuteData.length} 1-minute candles for recalculation`);
        
        // Trigger Point A/B recalculation with fresh data
        // This will be broadcast to frontend to update the analysis
        this.broadcastPointABUpdate('5th_candle_progression', oneMinuteData);
      }
      
    } catch (error) {
      console.error('❌ POINT A/B UPDATE ERROR:', error);
    }
  }

  /**
   * Update Point A/B Analysis for 6th candle progression
   */
  private async updatePointABAnalysisFor6thCandle(symbol: string): Promise<void> {
    console.log(`🔄 POINT A/B UPDATE: Updating analysis for 6th candle progression`);
    
    try {
      // Fetch fresh 1-minute data for Point A/B recalculation
      const currentDate = new Date().toISOString().split('T')[0];
      const oneMinuteData = null; // fyersApi.getHistoricalData({
        symbol: symbol,
        resolution: '1',
        date_format: "1",
        range_from: currentDate,
        range_to: currentDate,
        cont_flag: "1"
      });

      if (oneMinuteData && oneMinuteData.length > 0) {
        console.log(`📊 POINT A/B UPDATE: Fetched ${oneMinuteData.length} 1-minute candles for recalculation`);
        
        // Trigger Point A/B recalculation with fresh data
        this.broadcastPointABUpdate('6th_candle_progression', oneMinuteData);
      }
      
    } catch (error) {
      console.error('❌ POINT A/B UPDATE ERROR:', error);
    }
  }

  /**
   * Broadcast Point A/B analysis update to frontend
   */
  private broadcastPointABUpdate(trigger: string, data: any[]): void {
    console.log(`📡 BROADCASTING: Point A/B analysis update (${trigger})`);
    
    const updateMessage = {
      type: 'point_ab_analysis_update',
      trigger: trigger,
      timestamp: new Date().toISOString(),
      dataCount: data.length,
      message: `Point A/B Analysis updated due to ${trigger.replace('_', ' ')}`
    };
    
    // Send to all connected WebSocket clients
    this.cycle3Streamer.broadcast(updateMessage);
  }

  /**
   * Calculate when a specific candle completes based on market open and timeframe
   */
  private calculateCandleCompletionTime(candleNumber: number, timeframeMinutes: number): number {
    // Market opens at 9:15 AM IST
    const today = new Date();
    const marketOpenIST = new Date(today.toDateString() + ' 09:15:00 GMT+0530');
    const marketOpenTimestamp = marketOpenIST.getTime() / 1000;
    
    // Calculate when the specified candle completes
    const candleCompletionTime = marketOpenTimestamp + (candleNumber * timeframeMinutes * 60);
    
    return candleCompletionTime;
  }

  /**
   * Record progression trigger to prevent duplicate triggers
   */
  private recordProgressionTrigger(
    fromCandle: string,
    toCandle: string,
    triggerTime: number,
    shouldStartMonitoring: boolean
  ): void {
    const trigger: ProgressionTrigger = {
      fromCandle,
      toCandle,
      triggerTime,
      shouldStartMonitoring,
      pointABUpdated: true
    };
    
    this.progressionTriggers.push(trigger);
    console.log(`📝 PROGRESSION TRIGGER RECORDED: ${fromCandle} → ${toCandle} at ${new Date(triggerTime * 1000).toLocaleTimeString()}`);
  }

  /**
   * Check if a specific progression has already been triggered
   */
  private isProgressionTriggered(fromCandle: string, toCandle: string): boolean {
    return this.progressionTriggers.some(trigger => 
      trigger.fromCandle === fromCandle && trigger.toCandle === toCandle
    );
  }

  /**
   * Start monitoring for candle progression
   */
  public startProgressionMonitoring(symbol: string, timeframe: number): void {
    if (this.isMonitoringProgression) {
      console.log('🔄 PROGRESSION MONITORING: Already active, updating parameters');
      this.currentTimeframe = timeframe;
      return;
    }

    this.isMonitoringProgression = true;
    this.currentTimeframe = timeframe;
    
    console.log(`🚀 PROGRESSION MONITORING: Started for ${symbol} at ${timeframe}min timeframe`);
    console.log(`   Monitoring for C2B → 5th candle progression`);
    console.log(`   Monitoring for 5th → 6th candle progression`);
  }

  /**
   * Stop monitoring for candle progression
   */
  public stopProgressionMonitoring(): void {
    this.isMonitoringProgression = false;
    this.progressionTriggers = [];
    console.log('🛑 PROGRESSION MONITORING: Stopped');
  }

  /**
   * Get current progression status
   */
  public getProgressionStatus(): any {
    return {
      isMonitoring: this.isMonitoringProgression,
      currentTimeframe: this.currentTimeframe,
      triggersRecorded: this.progressionTriggers.length,
      triggers: this.progressionTriggers
    };
  }
}