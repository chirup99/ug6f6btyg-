/**
 * CANDLE PROGRESSION INTEGRATION
 * Integrates the Candle Progression Manager with the Three Cycle Scanner
 * Provides automatic progression from C2B -> 5th -> 6th candle monitoring
 * Fixes the critical bug where Point A/B Analysis stops updating after 4th candle completion
 */

import { CandleProgressionManager } from './candle-progression-manager';
import { cycle3LiveStreamer } from './cycle3-live-data-streamer';

export class CandleProgressionIntegration {
  private progressionManager: CandleProgressionManager;
  private isIntegrated = false;

  constructor() {
    this.progressionManager = new CandleProgressionManager(cycle3LiveStreamer);
    console.log('🔗 CANDLE PROGRESSION INTEGRATION: Initialized');
  }

  /**
   * Integrate the progression manager with the three cycle scanner
   */
  public integrate(): void {
    if (this.isIntegrated) {
      console.log('🔗 CANDLE PROGRESSION INTEGRATION: Already integrated');
      return;
    }

    // Add progression callbacks to cycle 3 live streamer
    cycle3LiveStreamer.addProgressionCallback((type: string, data: any) => {
      this.handleProgressionEvent(type, data);
    });

    this.isIntegrated = true;
    console.log('✅ CANDLE PROGRESSION INTEGRATION: Successfully integrated with Three Cycle Scanner');
  }

  /**
   * Start progression monitoring for a specific symbol and timeframe
   */
  public startProgressionMonitoring(symbol: string, timeframe: number): void {
    this.progressionManager.startProgressionMonitoring(symbol, timeframe);
    console.log(`🚀 CANDLE PROGRESSION INTEGRATION: Started monitoring ${symbol} at ${timeframe}min`);
  }

  /**
   * Stop progression monitoring
   */
  public stopProgressionMonitoring(): void {
    this.progressionManager.stopProgressionMonitoring();
    console.log('🛑 CANDLE PROGRESSION INTEGRATION: Stopped monitoring');
  }

  /**
   * Handle progression events from the live streamer
   */
  private handleProgressionEvent(type: string, data: any): void {
    console.log(`📡 CANDLE PROGRESSION EVENT: ${type}`, data);

    switch (type) {
      case '5th_candle_started':
        this.handle5thCandleStarted(data);
        break;
      case '5th_to_6th_progression':
        this.handle5thTo6thProgression(data);
        break;
      case '6th_candle_complete':
        this.handle6thCandleComplete(data);
        break;
      default:
        console.log(`🔍 CANDLE PROGRESSION EVENT: Unknown event type ${type}`);
    }
  }

  /**
   * Handle 5th candle started event
   */
  private handle5thCandleStarted(data: any): void {
    console.log('🚀 CANDLE PROGRESSION: 5th candle monitoring started');
    console.log(`   Symbol: ${data.symbol}`);
    console.log(`   Timeframe: ${data.timeframe} minutes`);
    console.log(`   Start Time: ${new Date(data.candleStartTime * 1000).toLocaleString()}`);
    console.log(`   End Time: ${new Date(data.candleEndTime * 1000).toLocaleString()}`);
  }

  /**
   * Handle 5th to 6th candle progression
   */
  private handle5thTo6thProgression(data: any): void {
    console.log('🎯 CANDLE PROGRESSION: Automatic progression from 5th to 6th candle');
    console.log(`   5th Candle Complete: ${data.fifthCandleComplete}`);
    console.log(`   6th Candle Start: ${new Date(data.sixthCandleStartTime * 1000).toLocaleString()}`);
    console.log(`   Timeframe: ${data.timeframe} minutes`);

    // Trigger Point A/B Analysis update for 6th candle
    this.triggerPointABUpdate('6th_candle_progression');
  }

  /**
   * Handle 6th candle completion
   */
  private handle6thCandleComplete(data: any): void {
    console.log('✅ CANDLE PROGRESSION: 6th candle completed');
    console.log(`   Symbol: ${data.symbol}`);
    console.log(`   Completion Time: ${new Date(data.completionTime * 1000).toLocaleString()}`);

    // Check if timeframe doubling should occur
    this.checkTimeframeDoubling(data);
  }

  /**
   * Trigger Point A/B Analysis update
   */
  private triggerPointABUpdate(trigger: string): void {
    console.log(`🔄 POINT A/B UPDATE TRIGGER: ${trigger}`);
    
    // Broadcast update message to all connected clients
    const updateMessage = {
      type: 'point_ab_analysis_update',
      trigger: trigger,
      timestamp: new Date().toISOString(),
      message: `Point A/B Analysis updated due to ${trigger.replace('_', ' ')}`
    };

    cycle3LiveStreamer.broadcast(updateMessage);
  }

  /**
   * Check if timeframe doubling should occur after 6th candle completion
   */
  private checkTimeframeDoubling(data: any): void {
    const currentTimeframe = data.timeframe || 5;
    const nextTimeframe = currentTimeframe * 2;

    if (nextTimeframe <= 80) {
      console.log(`🔄 TIMEFRAME DOUBLING: ${currentTimeframe}min → ${nextTimeframe}min`);
      
      // Notify about timeframe doubling
      const doublingMessage = {
        type: 'timeframe_doubling',
        currentTimeframe: currentTimeframe,
        nextTimeframe: nextTimeframe,
        timestamp: new Date().toISOString(),
        message: `Timeframe doubled from ${currentTimeframe}min to ${nextTimeframe}min`
      };

      cycle3LiveStreamer.broadcast(doublingMessage);
    } else {
      console.log(`🔚 TIMEFRAME LIMIT: ${currentTimeframe}min reached maximum (80min)`);
      
      // Notify about completion
      const completionMessage = {
        type: 'analysis_complete',
        finalTimeframe: currentTimeframe,
        timestamp: new Date().toISOString(),
        message: `Analysis complete at ${currentTimeframe}min timeframe`
      };

      cycle3LiveStreamer.broadcast(completionMessage);
    }
  }

  /**
   * Manually trigger candle completion check
   */
  public async checkCandleCompletion(
    symbol: string,
    timeframe: number,
    liveData: any[]
  ): Promise<any> {
    return await this.progressionManager.checkCandleCompletion(symbol, timeframe, liveData);
  }

  /**
   * Get current progression status
   */
  public getProgressionStatus(): any {
    return {
      isIntegrated: this.isIntegrated,
      progressionManager: this.progressionManager.getProgressionStatus()
    };
  }

  /**
   * Disconnect integration
   */
  public disconnect(): void {
    if (this.isIntegrated) {
      // Remove progression callbacks
      // Note: This would require cycle3LiveStreamer to have a removeProgressionCallback method
      this.isIntegrated = false;
      console.log('🔗 CANDLE PROGRESSION INTEGRATION: Disconnected');
    }
  }
}

// Export singleton instance
export const candleProgressionIntegration = new CandleProgressionIntegration();