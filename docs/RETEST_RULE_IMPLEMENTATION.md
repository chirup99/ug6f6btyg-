# RETEST RULE FOR EARLY BREAKOUTS - AUTOMATIC STOP LIMIT ORDERS

## Overview
The Retest Rule is a critical enhancement to the automatic stop limit order placement system that handles scenarios where candles break out early (before the 34% timing rule is satisfied). Instead of using original breakout levels, the system switches to "retest levels" based on the early breakout candle's OHLC data.

## Original Pattern Rules (No Early Breakout)

### Pattern-Specific Breakout Levels
- **1-3 Pattern**: Breakout at **3rd candle** (C2A)
- **2-3 Pattern**: Breakout at **3rd candle** (C2A) - special case
- **1-4 Pattern**: Breakout at **4th candle** (C2B)
- **2-4 Pattern**: Breakout at **4th candle** (C2B)

### Universal Stop Loss Rule
**Stop Loss is ALWAYS the 4th candle for ALL patterns** - regardless of breakout level differences.

### Original System Summary
- **1-3 Pattern**: Breakout = 3rd candle, Stop Loss = 4th candle
- **2-3 Pattern**: Breakout = 3rd candle, Stop Loss = 4th candle
- **1-4 Pattern**: Breakout = 4th candle, Stop Loss = 4th candle
- **2-4 Pattern**: Breakout = 4th candle, Stop Loss = 4th candle

## Retest Rule Logic (Early Breakout Detected)

### For Downtrend Patterns (Early Breakout)
- **Original Rule**: Pattern-specific breakout level (3rd or 4th candle), Universal 4th candle stop loss
- **Retest Rule**: If 5th or 6th candle breaks early:
  - **New Trigger Price**: 5th candle LOW (becomes the new breakout level)
  - **New Stop Loss**: 5th candle HIGH (tighter risk management)
  - **Timing**: Still wait for 34% timing rule, but use retest levels

### For Uptrend Patterns (Early Breakout)  
- **Original Rule**: Pattern-specific breakout level (3rd or 4th candle), Universal 4th candle stop loss
- **Retest Rule**: If 5th or 6th candle breaks early:
  - **New Trigger Price**: 5th candle HIGH (becomes the new breakout level)
  - **New Stop Loss**: 5th candle LOW (tighter risk management)
  - **Timing**: Still wait for 34% timing rule, but use retest levels

## Implementation Details

### API Endpoint Enhancement
- **Endpoint**: `/api/auto-orders/test`
- **New Fields**: 
  - `earlyBreakout`: boolean flag
  - `earlyBreakoutCandle`: "5th" or "6th"
  - `fifthCandleLow`: number (for downtrend retest trigger)
  - `fifthCandleHigh`: number (for uptrend retest trigger / downtrend retest SL)

### Response Structure Enhancement
Each processed order now includes:
```json
{
  "retestRule": {
    "hasEarlyBreakout": true,
    "earlyBreakoutCandle": "5th",
    "earlyBreakoutLogic": "5th candle broke early - New trigger: 5th candle low, New SL: 5th candle high",
    "originalLevels": {
      "triggerPrice": 24650.0,
      "stopLoss": 24700.0
    },
    "retestLevels": {
      "triggerPrice": 24630.0,
      "stopLoss": 24680.0,
      "explanation": "Downtrend early break: 5th low (24630.0) = new trigger, 5th high (24680.0) = new SL"
    },
    "waitFor34Percent": "Early breakout detected - Wait for 34% timing then place order with RETEST levels",
    "retestRuleActive": true,
    "status": "RETEST_RULE_ACTIVE"
  }
}
```

## Automatic Stop Limit Order Placement

### Order Types Based on Trend Direction

#### Downtrend Patterns
- **Order Type**: SELL Stop Limit Order
- **Trigger Condition**: Price breaks BELOW breakout level
- **Original System**: SELL when price < (3rd or 4th candle level)
- **Retest System**: SELL when price < (5th candle LOW)

#### Uptrend Patterns  
- **Order Type**: BUY Stop Limit Order
- **Trigger Condition**: Price breaks ABOVE breakout level
- **Original System**: BUY when price > (3rd or 4th candle level)
- **Retest System**: BUY when price > (5th candle HIGH)

### Automatic Order Cancellation Rules

#### 98% Timeout Cancellation
- **Rule**: Orders automatically cancelled at 98% of candle timeframe duration
- **Examples**:
  - 5-minute candle: Cancel at 4.9 minutes
  - 10-minute candle: Cancel at 9.8 minutes  
  - 20-minute candle: Cancel at 19.6 minutes
  - 40-minute candle: Cancel at 39.2 minutes

#### Early Breakout Cancellation
- If early breakout detected before 34% timing, original orders are cancelled
- New retest-based orders are scheduled for 34% timing with retest levels

## Practical Example

### Scenario: 2-3 Pattern Downtrend Early Breakout
1. **2-3 Pattern Special Case**:
   - Point A: C1B (2nd candle extreme)
   - Point B: C2B (4th candle extreme) - **adjusted for slope calculation**
   - Breakout level: C2A (3rd candle) - **remains unchanged due to side-by-side nature**
   - Stop loss: C2B (4th candle) - **universal rule**
2. **Original Setup**: 
   - Breakout at 24650.0 (3rd candle - C2A) 
   - Stop loss at 24700.0 (4th candle - C2B)
   - Order type: SELL Stop Limit when price < 24650.0
   - Pattern connection: C1B → C2B (for slope), breakout at C2A
3. **5th Candle Early Break**: Price drops to 24630.0 before 34% timing
4. **Retest Rule Activation**:
   - New trigger price: 24630.0 (5th candle low)  
   - New stop loss: 24680.0 (5th candle high)
   - New order type: SELL Stop Limit when price < 24630.0
   - Order placement: Still wait for 34% timing but use retest levels
   - Risk management: Tighter stop loss (50 points between trigger and SL)

### Risk Management Benefits
- **Tighter Stop Loss**: Uses actual early breakout candle levels
- **More Accurate Entry**: Reflects real market movement
- **Better Risk-Reward**: Adjusts to actual market conditions
- **Timing Consistency**: Maintains 34% rule timing discipline

## System Integration

### Stop Limit Order Specifications

#### Order Parameters
```typescript
// SELL Stop Limit (Downtrend)
{
  type: "STOP_LIMIT",
  side: "SELL",
  stopPrice: triggerPrice,    // Stop price = trigger level
  limitPrice: triggerPrice,   // Limit price = same as stop price
  quantity: calculatedQuantity,
  validity: "DAY",
  productType: "INTRADAY"
}

// BUY Stop Limit (Uptrend) 
{
  type: "STOP_LIMIT", 
  side: "BUY",
  stopPrice: triggerPrice,    // Stop price = trigger level
  limitPrice: triggerPrice,   // Limit price = same as stop price
  quantity: calculatedQuantity,
  validity: "DAY", 
  productType: "INTRADAY"
}
```

#### 2-3 Pattern Point B Adjustment Logic
```typescript
// Special 2-3 Pattern handling
if (pattern === "2-3_PATTERN") {
  // Point A: C1B (2nd candle extreme)
  // Point B: C2B (4th candle extreme) - for slope calculation
  // Breakout: C2A (3rd candle) - unchanged due to side-by-side nature
  
  pointA = C1B_extreme;
  pointB = C2B_extreme;  // Adjusted for slope
  breakoutLevel = C2A_extreme;  // Remains at 3rd candle
  stopLoss = C2B_extreme;  // Universal 4th candle rule
}
```

### Order Placement Logic
```typescript
if (hasEarlyBreakout) {
  if (isDowntrend) {
    retestTriggerPrice = pattern.fifthCandleLow;
    retestStopLoss = pattern.fifthCandleHigh;
  } else {
    retestTriggerPrice = pattern.fifthCandleHigh;  
    retestStopLoss = pattern.fifthCandleLow;
  }
}

### Quantity Calculation with 2-3 Pattern Adjustment

#### Standard Patterns (1-3, 1-4, 2-4)
```typescript
stopLossDistance = Math.abs(triggerPrice - stopLoss);
quantity = Math.floor(riskAmount / stopLossDistance);
```

#### 2-3 Pattern Special Calculation
```typescript
// For 2-3 patterns: Point B adjusted to C2B for slope, breakout stays at C2A
if (pattern === "2-3_PATTERN") {
  triggerPrice = C2A_level;  // Breakout at 3rd candle
  stopLoss = C2B_level;      // Universal 4th candle stop loss
  
  // Risk calculation uses actual breakout and stop loss levels
  stopLossDistance = Math.abs(triggerPrice - stopLoss);
  quantity = Math.floor(riskAmount / stopLossDistance);
  
  // Note: Slope calculated using C1B → C2B for trend analysis
  // But order placement uses C2A breakout level
}
```

#### Retest Rule Quantity Calculation
```typescript
// When retest rule is active (early breakout)
if (hasEarlyBreakout) {
  retestStopLossDistance = Math.abs(retestTriggerPrice - retestStopLoss);
  retestQuantity = Math.floor(riskAmount / retestStopLossDistance);
}
```

## Status Indicators
- **RETEST_RULE_ACTIVE**: Early breakout detected, using retest levels
- **ORIGINAL_RULE_ACTIVE**: No early breakout, using original levels
- **SCHEDULED_FOR_RETEST_PLACEMENT**: Order scheduled with retest pricing

## User Benefits
1. **Adaptive Trading**: System adjusts to real market conditions
2. **Better Risk Management**: Tighter stops based on actual price action
3. **Maintained Discipline**: 34% timing rule still enforced
4. **Automatic Detection**: No manual intervention required
5. **Clear Transparency**: Full explanation of rule application

## Implementation Status: ✅ COMPLETE
- Server-side logic implemented in `server/routes.ts`
- API endpoint `/api/auto-orders/test` fully operational
- Response structure includes comprehensive retest rule details
- Timing rules demonstration updated with retest logic
- System capabilities enhanced with retest rule support

## Test Example
```bash
curl -X POST "http://localhost:5000/api/auto-orders/test" \
  -H "Content-Type: application/json" \
  -d '{
    "patterns": [{
      "trend": "DOWNTREND",
      "earlyBreakout": true,
      "earlyBreakoutCandle": "5th",
      "fifthCandleLow": 24630.0,
      "fifthCandleHigh": 24680.0
    }]
  }'
```

This retest rule ensures the automatic order placement system adapts intelligently to early breakouts while maintaining the disciplined 34% timing approach.