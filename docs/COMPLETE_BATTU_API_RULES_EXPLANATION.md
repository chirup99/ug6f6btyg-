# Complete Battu API Rules & Steps Explanation

## Overview
The Battu API is a sophisticated trading analysis system that predicts future candles using pattern recognition and slope calculations. It follows a continuous backtesting methodology from market open to close.

## Core Methodology

### Step 1: Initial Setup
- **Starting Point**: 5-minute candles from market open (9:15 AM IST)
- **Wait Condition**: Wait for 4 complete candles
- **Block Formation**: Create initial C1 and C2 blocks

### Step 2: Block Structure
```
C1 Block = C1a + C1b = Total 2 candles (1st and 2nd candles)
C2 Block = C2a + C2b = Total 2 candles (3rd and 4th candles)
```

### Step 3: Battu API Analysis
Apply Battu API rules to predict C3 block using C1 and C2 patterns:
- Extract Point A and Point B from blocks
- Calculate slope between points
- Determine breakout levels
- Apply timing validation rules

---

## Detailed Block Formation Rules

### C1 Block Analysis
- **C1a**: 1st candle (candle index 0)
- **C1b**: 2nd candle (candle index 1)
- **Purpose**: Find extreme points for slope calculation from first 2 candles

### C2 Block Analysis  
- **C2a**: 3rd candle (candle index 2)
- **C2b**: 4th candle (candle index 3)
- **Purpose**: Determine breakout levels and trendlines from next 2 candles

### C3 Block Prediction (After Cycle 1 & Cycle 2)
- **Prediction Target**: Next set of candles after C1+C2 analysis completion
- **Structure**: C3 Block = C3a + C3b (2 candles each)
- **Methodology**: Use C1/C2 block patterns and momentum to predict C3a and C3b
- **Validation**: Compare predicted vs actual C3 values when they become available
- **Size**: C3 block follows same 2-candle structure as C1 and C2 blocks

---

## Point A & Point B Methodology

### Point A (Starting Point)
- **Source**: Lowest low from C1 block (uptrend) or Highest high from C1 block (downtrend)
- **Precision**: Uses 1-minute data to find exact timestamp where extreme occurred
- **Purpose**: Starting point for slope calculation

### Point B (Ending Point)
- **Source**: Highest high from C2 block (uptrend) or Lowest low from C2 block (downtrend)
- **Precision**: Uses 1-minute data to find exact timestamp where extreme occurred
- **Purpose**: Ending point for slope calculation

### Slope Calculation Formula
```
Slope = (Price B - Price A) / (Time B - Time A in minutes)
```

---

## Pattern Recognition Rules

### Pattern Types
1. **1-3 Pattern**: Point A from C1a → Point B from C2a
2. **1-4 Pattern**: Point A from C1a → Point B from C2b
3. **2-3 Pattern**: Point A from C1b → Point B from C2b (slope calculation), breakout at C2a (High Risk - Special Case)
4. **2-4 Pattern**: Point A from C1b → Point B from C2b

### Breakout Level Rules
- **1-3 Pattern**: Breakout at C2a level
- **1-4 Pattern**: Breakout at C2b level
- **2-3 Pattern**: Breakout at C2a level ONLY (Special Exception - slope uses C1b→C2b connection, breakout stays at C2a due to side-by-side nature)
- **2-4 Pattern**: Breakout at C2b level

### High-Risk Pattern Detection
- **2-3 Patterns**: Automatically flagged as high-risk due to "side by side" nature
- **Special 2-3 Rule**: Slope calculation connects C1b → C2b but breakout level remains at C2a only (dual logic due to side-by-side positioning)
- **Risk Management**: Special handling required for these patterns with unique slope vs breakout logic

---

## Timing Validation Rules

### Rule 1: 50% Validation
- **Requirement**: Point A → Point B duration ≥ 50% of total 4-candle duration
- **Formula**: `(Point B time - Point A time) ≥ 0.5 × (Total 4-candle duration)`
- **Purpose**: Ensures sufficient trend development time

### Rule 2: 34% Validation  
- **Requirement**: Point B → Trigger duration ≥ 34% of Point A → Point B duration
- **Formula**: `(Trigger time - Point B time) ≥ 0.34 × (Point B time - Point A time)`
- **Purpose**: Confirms adequate confirmation time before entry

### Individual Candle Validation
- **5th Candle**: Must satisfy both breakout AND timing rules independently
- **6th Candle**: Must satisfy both breakout AND timing rules independently
- **Trade Validity**: Valid when ANY candle (5th OR 6th) meets BOTH conditions

---

## Stop Loss Rules

### Candle-Specific Stop Loss
- **5th Candle Trigger**: Stop Loss = 4th candle low (uptrend) or high (downtrend)
- **6th Candle Trigger**: Stop Loss = 5th candle low (uptrend) or high (downtrend)
- **Purpose**: Risk management based on previous candle support/resistance



---

## Exit Strategy Rules

### Target Calculation
```
Target Price = Breakout Price + (Slope × Duration from Point B)
```



---

## Advanced Rules Integration

### T-Rule (6th Candle Prediction)
- **Input**: C2 block + C3a candles
- **Method**: Apply Step 2 methods to find C3b candles
- **Output**: Complete 6th candle prediction with confidence scoring

### Mini 4-Rule (C3a Prediction)
- **Input**: C2 block (4 candles)
- **Method**: Predict C3a (2 candles) using momentum analysis
- **Output**: C3a prediction leading to complete C3 structure

### Progressive Timeframe Doubling
- **Trigger**: When >6 candles detected in current timeframe
- **Action**: Double timeframe (10min → 20min → 40min → 80min)
- **Limit**: Maximum 80 minutes for Indian market optimization

---

## Continuous Backtest Methodology

### Initial Phase
1. **Start**: 5-minute candles from market open
2. **Wait**: For 4 complete candles
3. **Create**: C1 block (2 candles: C1a+C1b) + C2 block (2 candles: C2a+C2b)

### Cycle Processing
1. **Apply Battu API**: Analyze C1+C2 → Predict C3
2. **Validation**: Compare prediction with actual C3 data
3. **Count Check**: Determine merging based on count equality



### Continuation
- **Repeat**: Continue cycles until insufficient candles remain
- **Coverage**: Complete market session from open to close
- **Output**: Comprehensive analysis of all trading patterns

---

## Breakout Detection Rules

### Uptrend Breakout
- **Condition**: Current price > Point B high
- **Validation**: Must occur within timing constraints
- **Confirmation**: Both breakout AND timing rules satisfied

### Downtrend Breakout
- **Condition**: Current price < Point B low  
- **Validation**: Must occur within timing constraints
- **Confirmation**: Both breakout AND timing rules satisfied

### Real-Time Monitoring
- **Data Source**: Live 5th and 6th candle OHLC from Fyers API
- **Frequency**: Continuous monitoring during candle formation
- **Status**: Clear indicators for break/no-break status

---

## Order Placement Rules

### Automatic SL Order Conditions
- **Trigger**: Only when NO breakout occurs in 5th AND 6th candles
- **Timing**: At 34% of Point A→B duration from Point B
- **Prevention**: No automatic orders if breakout detected

### Manual Order Requirements
- **Condition**: Breakout detected in either 5th or 6th candle
- **Validation**: Both timing rules must be satisfied
- **Authorization**: Individual candle authorization for SL orders

### Risk Management
- **Quantity**: Based on user-defined risk amount and stop-loss distance
- **Price**: Exact breakout level with proper buy/sell action
- **Timestamp**: Precise order placement at breakout moment

---

## Quality Assurance Rules

### Data Integrity
- **Source**: Only authentic Fyers API data, no demo/fallback data
- **Validation**: Comprehensive OHLC validation and timestamp checks
- **Filtering**: Market hours only (9:15 AM - 3:30 PM IST)

### Error Handling
- **Authentication**: Clear error states when API unavailable
- **Validation**: Step-by-step validation with detailed logging
- **Recovery**: Graceful handling of incomplete data scenarios

### Performance Monitoring
- **Speed**: Real-time processing with minimal latency
- **Accuracy**: Mathematical precision in all calculations
- **Reliability**: Consistent results across multiple timeframes

---

## CYCLE 3: Progressive Timeframe Doubling with Missing 4th Candle Logic

### Timeframe Doubling Trigger
- **After 6th candle completion** at current timeframe
- **Transformation**: 6 completed 5-minute candles → 3 completed 10-minute candles
- **Problem**: Only 3 candles available, need 4 for Battu API analysis

### Missing 4th Candle Detection
```
Available: [10min-C1, 10min-C2, 10min-C3]
Missing: [10min-C4]
Action: Find/predict the 4th candle
```

### Minimum Duration Constraint
- **Requirement**: Minimum 20-minute candle duration for valid analysis
- **Current Problem**: 10-minute timeframe insufficient (< 20min minimum)
- **Solution**: Wait for 4th candle completion

### Wait Strategy
```
Current State: 10min timeframe (insufficient)
Wait for: 4th candle to complete  
Then: Have 4 completed 10-minute candles
Duration: 4 × 10min = 40 minutes total (satisfies ≥20min requirement)
```

### Block Formation After Wait
Once 4th candle completes:
```
C1 Block = 10min-C1 + 10min-C2 (20 minutes) ✅ ≥20min
C2 Block = 10min-C3 + 10min-C4 (20 minutes) ✅ ≥20min
```

### Find 5th/6th Candles at 10min Scale
After 4th candle completion:
- Use the 4 completed 10-minute candles for analysis
- Apply Battu API methodology (Point A/B, patterns, slopes)
- Find/predict 5th and 6th candles at 10-minute timeframe

### Progressive Timeframe Sequence
```
5min (6 candles) → 10min (3→4 candles) → 20min (2→4 candles) → 40min (1→4 candles) → 80min (max)
```

### Power Hierarchy
- **80min patterns** > **40min patterns** > **20min patterns** > **10min patterns** > **5min patterns**
- Higher timeframes provide stronger trading signals after minimum duration validation

---

## Summary Workflow

1. **Market Open**: Start with 5-minute candles
2. **Block Formation**: Create C1(2) + C2(2) blocks from first 4 candles
3. **Battu Analysis**: Apply all rules to predict C3
4. **C3 Prediction**: Use C1/C2 patterns to forecast C3 block (C3a + C3b)
5. **Validation**: Compare prediction vs reality
6. **Merging**: Apply count-based merging logic
7. **Cycle**: Repeat until market close
8. **Output**: Complete trading session analysis with C3 predictions

This comprehensive system provides precise, rule-based trading analysis with mathematical accuracy and real-time validation throughout the entire market session.