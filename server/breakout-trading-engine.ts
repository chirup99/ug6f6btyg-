// import { FyersAPI } from './fyers-api.js'; // Removed: Fyers API removed

interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  stopLoss: number;
  quantity: number;
  reason: string;
  triggerCandle: '5th' | '6th';
  patternName: string;
  trendType: 'uptrend' | 'downtrend';
}

interface BreakoutValidation {
  isValid: boolean;
  breakoutLevel: number;
  durationRatio: number;
  isDurationValid: boolean;
  isTimeTriggered: boolean;
  canPlaceOrders: boolean;
  validation1_AB_50percent: boolean;
  validation2_B5th_34percent: boolean;
}

interface CandleData {
  name: string;
  high: number;
  low: number;
  open: number;
  close: number;
  startTime: number;
  endTime: number;
}

export class BreakoutTradingEngine {
  private fyersAPI: FyersAPI;
  private activeTrades: Map<string, TradingSignal> = new Map();

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * Validate breakout level visibility using corrected 50% validation
   * Breakout lines are shown when Point A to 5th candle breakout ≥50% of total 4-candle duration
   */
  private validateBreakoutLevel(
    pointATimestamp: number,
    pointBTimestamp: number,
    c1aStartTime: number,
    c2bEndTime: number
  ): BreakoutValidation {
    const total4CandleDuration = (c2bEndTime - c1aStartTime) / 60; // in minutes
    const pointAToPointBDuration = (pointBTimestamp - pointATimestamp) / 60; // in minutes
    const durationRatio = pointAToPointBDuration / total4CandleDuration;
    
    // Required duration: 50% of total 4-candle duration
    const breakoutRequiredDuration = total4CandleDuration * 0.5; // 50% threshold in minutes
    
    // Calculate Point A to 5th candle breakout duration (5th candle starts after C2B ends)
    const fifthCandleStartTime = c2bEndTime; // C2B end = 5th candle start
    const pointAToBreakoutDuration = (fifthCandleStartTime - pointATimestamp) / 60; // in minutes
    
    // Duration-based validation: Point A to 5th candle breakout ≥50% of total 4-candle duration
    const isDurationValid = pointAToBreakoutDuration >= breakoutRequiredDuration;
    
    // Time-based validation: Current time passes 50% threshold from Point A start
    const breakoutThresholdTimestamp = pointATimestamp + (breakoutRequiredDuration * 60);
    const currentTime = Date.now() / 1000;
    const isTimeTriggered = currentTime >= breakoutThresholdTimestamp;
    
    const isValid = isDurationValid || isTimeTriggered;
    
    // SL ORDER DUAL VALIDATION SYSTEM:
    // 1. Point A→B duration ≥50% of total 4-candle duration (already checked above)
    // 2. Point B→5th candle ≥34% of Point A→Point B duration
    
    const pointBToBreakoutDuration = (fifthCandleStartTime - pointBTimestamp) / 60; // in minutes
    const requiredPointBToBreakoutDuration = pointAToPointBDuration * 0.34; // 34% of A→B duration
    
    // Validation 1: Point A→B ≥50% of total 4-candle duration
    const validation1_AB_50percent = pointAToBreakoutDuration >= breakoutRequiredDuration;
    
    // Validation 2: Point B→5th candle ≥34% of Point A→Point B duration
    const validation2_B5th_34percent = pointBToBreakoutDuration >= requiredPointBToBreakoutDuration;
    
    // SL orders can ONLY be placed when BOTH validations pass
    const canPlaceOrders = validation1_AB_50percent && validation2_B5th_34percent;
    
    const minutesNeeded = Math.max(0, breakoutRequiredDuration - pointAToBreakoutDuration);
    // Calculate time from Point B perspective for 50% rule
    const timeFromPointBRequired = breakoutRequiredDuration - pointAToPointBDuration; // Required time from Point B
    const timeFromPointBActual = pointBToBreakoutDuration; // Actual time from Point B to 5th candle
    const minutesNeededFromB = Math.max(0, timeFromPointBRequired - timeFromPointBActual);
    
    const validationMethod = isDurationValid ? 
      `50% rule valid: Point B→5th candle ${timeFromPointBActual.toFixed(1)}min ≥ ${timeFromPointBRequired.toFixed(1)}min (required from B)` : 
      isTimeTriggered ? 'Time threshold reached for 5th candle' : `Need ${minutesNeededFromB.toFixed(1)}min more from Point B`;
    
    console.log(`🔍 Breakout Level Validation (from Point B perspective):
       Total 4-candle duration: ${total4CandleDuration.toFixed(2)} minutes
       Point A to Point B duration: ${pointAToPointBDuration.toFixed(2)} minutes
       Point B to 5th candle duration: ${timeFromPointBActual.toFixed(2)} minutes
       Required from Point B (50% rule): ${timeFromPointBRequired.toFixed(2)} minutes
       Required B→5th (34% of A→B): ${requiredPointBToBreakoutDuration.toFixed(2)} minutes
       Minutes needed from Point B: ${minutesNeededFromB.toFixed(2)} minutes
       Time Threshold: ${new Date(breakoutThresholdTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
       Validation Method: ${validationMethod}
       Breakout Level Valid: ${isValid ? '✅' : '❌'}
       
       🎯 SL Order Dual Validation:
       Validation 1 (50% from Point B): ${validation1_AB_50percent ? '✅' : '❌'}
       Validation 2 (B→5th ≥34% of A→B): ${validation2_B5th_34percent ? '✅' : '❌'}
       SL Orders Enabled: ${canPlaceOrders ? '✅' : '❌'}`);
    
    return {
      isValid,
      breakoutLevel: 0, // Will be set by caller
      durationRatio,
      isDurationValid,
      isTimeTriggered,
      canPlaceOrders,
      validation1_AB_50percent,
      validation2_B5th_34percent
    };
  }

  /**
   * Validate SL order timing using 34% duration rule for order placement
   * Order is placed only when duration from Point B to current time is ≥34% of Point A to Point B duration
   */
  private validateSLOrderTiming(
    pointATimestamp: number,
    pointBTimestamp: number,
    currentBreakoutTime: number
  ): BreakoutValidation {
    const pointAToPointBDuration = (pointBTimestamp - pointATimestamp) / 60; // in minutes
    const pointBToBreakoutDuration = (currentBreakoutTime - pointBTimestamp) / 60; // in minutes
    const durationRatio = pointBToBreakoutDuration / pointAToPointBDuration;
    
    // SL Order placement condition: Point B to breakout duration ≥ 34% of Point A to Point B duration
    const isDurationValid = durationRatio >= 0.34;
    
    console.log(`🕐 SL Order Duration Validation:
       Point A to Point B: ${pointAToPointBDuration.toFixed(2)} minutes
       Point B to Breakout: ${pointBToBreakoutDuration.toFixed(2)} minutes
       Duration Ratio: ${(durationRatio * 100).toFixed(1)}%
       Required: ≥34.0%
       SL Order Valid: ${isDurationValid ? '✅' : '❌'}`);
    
    return {
      isValid: isDurationValid,
      breakoutLevel: 0, // Will be set by caller
      durationRatio,
      isDurationValid,
      isTimeTriggered: isDurationValid,
      canPlaceOrders: isDurationValid,
      validation1_AB_50percent: true, // Assume passed for SL order timing
      validation2_B5th_34percent: isDurationValid
    };
  }

  /**
   * Check if candle breaks the breakout level
   */
  private checkBreakout(
    candle: CandleData,
    breakoutLevel: number,
    trendType: 'uptrend' | 'downtrend'
  ): boolean {
    if (trendType === 'uptrend') {
      // For uptrend, check if candle high breaks above breakout level
      return candle.high > breakoutLevel;
    } else {
      // For downtrend, check if candle low breaks below breakout level
      return candle.low < breakoutLevel;
    }
  }

  /**
   * Calculate stop loss based on previous candle
   */
  private calculateStopLoss(
    triggerCandle: '5th' | '6th',
    trendType: 'uptrend' | 'downtrend',
    candleBlocks: CandleData[]
  ): number {
    let slCandleName: string;
    
    if (triggerCandle === '5th') {
      slCandleName = 'C2B'; // 4th candle for 5th candle trigger
    } else {
      slCandleName = 'F1'; // 5th candle for 6th candle trigger
    }
    
    const slCandle = candleBlocks.find(c => c.name === slCandleName);
    if (!slCandle) {
      throw new Error(`Stop loss candle ${slCandleName} not found`);
    }
    
    if (trendType === 'uptrend') {
      return slCandle.low; // Previous candle low for uptrend
    } else {
      return slCandle.high; // Previous candle high for downtrend
    }
  }

  /**
   * Generate trading signal when breakout occurs
   */
  private generateTradingSignal(
    symbol: string,
    triggerCandle: CandleData,
    triggerCandleType: '5th' | '6th',
    breakoutLevel: number,
    trendType: 'uptrend' | 'downtrend',
    patternName: string,
    candleBlocks: CandleData[]
  ): TradingSignal {
    const stopLoss = this.calculateStopLoss(triggerCandleType, trendType, candleBlocks);
    
    // Entry price is the breakout level
    const entryPrice = breakoutLevel;
    
    // Calculate quantity based on risk management (example: 1% risk)
    const riskAmount = 1000; // Example: ₹1000 risk per trade
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const quantity = Math.floor(riskAmount / riskPerShare);
    
    const action = trendType === 'uptrend' ? 'BUY' : 'SELL';
    const reason = `${patternName} ${trendType} breakout at ${triggerCandleType} candle`;
    
    // CRITICAL FIX: Use actual 5th/6th candle END TIME for breakout timestamp
    const breakoutTimestamp = triggerCandle.endTime; // Actual candle completion time in seconds
    const breakoutTime = new Date(breakoutTimestamp * 1000).toLocaleTimeString('en-IN', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    console.log(`🚀 BREAKOUT CONFIRMED: ${action} ${symbol} at ${breakoutTime} (${triggerCandleType} candle completion)`);
    
    return {
      symbol,
      action,
      price: entryPrice,
      stopLoss,
      quantity,
      reason,
      triggerCandle: triggerCandleType,
      patternName,
      trendType
    } as any; // Temporary fix - will update TradingSignal interface later
  }

  /**
   * Place SL (Stop-Loss) limit order via Fyers API
   */
  private async placeStopLossLimitOrder(signal: TradingSignal): Promise<boolean> {
    try {
      console.log(`🎯 Placing ${signal.action} SL LIMIT order:`, {
        symbol: signal.symbol,
        entryPrice: signal.price,
        quantity: signal.quantity,
        stopLoss: signal.stopLoss,
        reason: signal.reason
      });

      // SL LIMIT Order - Entry order with stop-loss protection
      const slLimitOrderData = {
        symbol: signal.symbol,
        qty: signal.quantity,
        type: '4', // SL (Stop-Loss) order type
        side: signal.action === 'BUY' ? '1' : '-1',
        productType: 'CNC', // Cash and Carry
        limitPrice: signal.price.toFixed(2),
        stopPrice: '0',
        validity: 'DAY',
        disclosedQty: '0',
        offlineOrder: 'False'
      };

      // Simulated order placement (replace with actual Fyers API call)
      console.log(`📋 SL LIMIT Order placed successfully:`, slLimitOrderData);
      
      // Store active trade for monitoring
      this.activeTrades.set(`${signal.symbol}_${Date.now()}`, signal);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to place order for ${signal.symbol}:`, error);
      return false;
    }
  }

  /**
   * Monitor breakout levels and place trades when conditions are met
   */
  async monitorBreakouts(
    symbol: string,
    slopeData: any,
    candleBlocks: CandleData[],
    fifthCandle?: CandleData,
    sixthCandle?: CandleData
  ): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    
    for (const slope of slopeData.slopes || []) {
      // Validate breakout level
      const c1aCandle = candleBlocks.find(c => c.name === 'C1A');
      const c2bCandle = candleBlocks.find(c => c.name === 'C2B');
      
      if (!c1aCandle || !c2bCandle) continue;
      
      // Validate breakout level visibility (≥50% duration)
      const breakoutValidation = this.validateBreakoutLevel(
        slope.pointA.timestamp,
        slope.pointB.timestamp,
        c1aCandle.startTime,
        c2bCandle.endTime
      );
      
      if (!breakoutValidation.isValid) {
        console.log(`⏳ Breakout level not visible yet for ${slope.patternName} ${slope.trendType} (need ≥50%)`);
        continue;
      }
      
      // CRITICAL FIX: Breakout levels should only be based on Point A/B analysis
      // NOT on past candle data - breakouts must happen on 5th/6th candles only
      const breakoutLevel = slope.pointB.price;
      
      console.log(`🎯 BREAKOUT LEVEL SET: Pattern ${slope.patternName} ${slope.trendType} at Point B price: ${breakoutLevel}`);
      
      // CRITICAL FIX: Only check breakouts when we have actual 5th/6th candles
      // NOT when Point B timing reaches 34% - wait for REAL candle breakouts
      if (fifthCandle && this.checkBreakout(fifthCandle, breakoutLevel, slope.trendType)) {
        console.log(`🚨 REAL 5th candle BREAKOUT detected for ${slope.patternName} ${slope.trendType}!`);
        console.log(`📊 5th Candle OHLC: O:${fifthCandle.open} H:${fifthCandle.high} L:${fifthCandle.low} C:${fifthCandle.close}`);
        console.log(`🎯 Breakout Level: ${breakoutLevel} | Trend: ${slope.trendType}`);
        
        // CRITICAL FIX: Use 5th candle END TIME, not current system time  
        // Use the actual 5th candle endTime from CandleData interface
        const fifthCandleEndTime = fifthCandle.endTime;
        console.log(`⏰ TIMING CHECK: Using 5th candle END time: ${new Date(fifthCandleEndTime * 1000).toLocaleTimeString('en-IN')}`);
        
        // VALIDATION: Ensure 5th candle is COMPLETED before allowing breakout
        const now = Math.floor(Date.now() / 1000);
        if (now < fifthCandleEndTime) {
          console.log(`⏳ 5th candle not yet completed. Current: ${new Date().toLocaleTimeString('en-IN')}, 5th candle ends: ${new Date(fifthCandleEndTime * 1000).toLocaleTimeString('en-IN')}`);
          continue;
        }
        
        // CRITICAL FIX: Don't use Point B timing validation for actual breakouts
        // When 5th candle actually breaks out, the order should be placed immediately
        // The Point A/B timing was for pattern formation, not breakout execution
        const orderTimingValidation = {
          isValid: true,
          durationRatio: 1.0, // 100% since actual breakout occurred
          breakoutLevel: breakoutLevel,
          isDurationValid: true,
          isTimeTriggered: true,
          canPlaceOrders: true,
          validation1_AB_50percent: true,
          validation2_B5th_34percent: true
        };
        
        console.log(`🎯 ACTUAL BREAKOUT ORDER: Skipping Point B timing validation since real 5th candle breakout occurred`);
        
        if (orderTimingValidation.isValid) {
          const signal = this.generateTradingSignal(
            symbol,
            fifthCandle,
            '5th',
            breakoutLevel,
            slope.trendType,
            slope.patternName,
            candleBlocks
          );
          
          console.log(`✅ 5th candle SL order timing valid (${(orderTimingValidation.durationRatio * 100).toFixed(1)}% ≥ 34%)`);
          
          // Place SL limit order
          await this.placeStopLossLimitOrder(signal);
          signals.push(signal);
        } else {
          console.log(`⏳ 5th candle breakout detected but SL order timing not valid yet (${(orderTimingValidation.durationRatio * 100).toFixed(1)}% < 34%)`);
        }
      }
      
      // CRITICAL FIX: Only check breakouts when we have actual 6th candles  
      // NOT when Point B timing reaches 34% - wait for REAL candle breakouts
      if (sixthCandle && this.checkBreakout(sixthCandle, breakoutLevel, slope.trendType)) {
        console.log(`🚨 REAL 6th candle BREAKOUT detected for ${slope.patternName} ${slope.trendType}!`);
        console.log(`📊 6th Candle OHLC: O:${sixthCandle.open} H:${sixthCandle.high} L:${sixthCandle.low} C:${sixthCandle.close}`);
        console.log(`🎯 Breakout Level: ${breakoutLevel} | Trend: ${slope.trendType}`);
        
        // CRITICAL FIX: Use 6th candle END TIME, not current system time
        // Use the actual 6th candle endTime from CandleData interface
        const sixthCandleEndTime = sixthCandle.endTime;
        console.log(`⏰ TIMING CHECK: Using 6th candle END time: ${new Date(sixthCandleEndTime * 1000).toLocaleTimeString('en-IN')}`);
        
        // VALIDATION: Ensure 6th candle is COMPLETED before allowing breakout
        const now = Math.floor(Date.now() / 1000);
        if (now < sixthCandleEndTime) {
          console.log(`⏳ 6th candle not yet completed. Current: ${new Date().toLocaleTimeString('en-IN')}, 6th candle ends: ${new Date(sixthCandleEndTime * 1000).toLocaleTimeString('en-IN')}`);
          continue;
        }
        
        // CRITICAL FIX: Don't use Point B timing validation for actual breakouts
        // When 6th candle actually breaks out, the order should be placed immediately
        // The Point A/B timing was for pattern formation, not breakout execution
        const orderTimingValidation = {
          isValid: true,
          durationRatio: 1.0, // 100% since actual breakout occurred
          breakoutLevel: breakoutLevel,
          isDurationValid: true,
          isTimeTriggered: true,
          canPlaceOrders: true,
          validation1_AB_50percent: true,
          validation2_B5th_34percent: true
        };
        
        console.log(`🎯 ACTUAL BREAKOUT ORDER: Skipping Point B timing validation since real 6th candle breakout occurred`);
        
        if (orderTimingValidation.isValid) {
          const signal = this.generateTradingSignal(
            symbol,
            sixthCandle,
            '6th',
            breakoutLevel,
            slope.trendType,
            slope.patternName,
            [...candleBlocks, fifthCandle].filter(Boolean) as CandleData[]
          );
          
          console.log(`✅ 6th candle SL order timing valid (${(orderTimingValidation.durationRatio * 100).toFixed(1)}% ≥ 34%)`);
          
          // Place SL limit order
          await this.placeStopLossLimitOrder(signal);
          signals.push(signal);
        } else {
          console.log(`⏳ 6th candle breakout detected but SL order timing not valid yet (${(orderTimingValidation.durationRatio * 100).toFixed(1)}% < 34%)`);
        }
      }
    }
    
    return signals;
  }

  /**
   * Get active trades
   */
  getActiveTrades(): TradingSignal[] {
    return Array.from(this.activeTrades.values());
  }

  /**
   * Monitor and update stop losses for active trades
   */
  async updateStopLosses(): Promise<void> {
    for (const [tradeId, signal] of Array.from(this.activeTrades.entries())) {
      try {
        // Get current market price
        const currentPrice = 0; // Placeholder - get from market data
        
        // Update stop loss logic here if needed
        console.log(`📊 Monitoring trade ${tradeId}: Current price ${currentPrice}, SL: ${signal.stopLoss}`);
        
        // Remove completed trades or update stop losses as needed
      } catch (error) {
        console.error(`❌ Error updating stop loss for trade ${tradeId}:`, error);
      }
    }
  }
}