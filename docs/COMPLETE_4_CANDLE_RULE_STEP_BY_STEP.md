# Complete 4-Candle Rule: Step-by-Step Process Till Target Exit

## Overview
The 4-candle rule is a comprehensive trading methodology that analyzes 4 consecutive candles to identify Point A and Point B, calculate slope patterns, detect breakout levels, validate timing rules, and execute trades with precise target calculations.

## Complete Process Flow

### STEP 1: Data Collection & Candle Formation
**Objective**: Collect 4 consecutive candles for analysis

1. **Fetch Historical Data**: Get 4 candles (C1A, C1B, C2A, C2B) for selected symbol, date, and timeframe
2. **Candle Validation**: Ensure all 4 candles have complete OHLC data
3. **Time Window Setup**: Establish exact start/end times for each candle
4. **1-Minute Data Collection**: Fetch detailed 1-minute candles within each 4-candle period for exact timing analysis

**Example**: NIFTY 4 × 10min candles = 40-minute analysis window (9:15-9:55 AM)

---

### STEP 2: Point A & Point B Detection (Exact Timing Method)
**Objective**: Find exact timestamps where price extremes occurred

#### 2.1 C1 Block Analysis (C1A + C1B)
- **C1 Block High**: Max(C1A.high, C1B.high) with source tracking
- **C1 Block Low**: Min(C1A.low, C1B.low) with source tracking
- **1-Minute Precision**: Scan 1-minute data to find exact timestamps

#### 2.2 C2 Block Analysis (C2A + C2B)  
- **C2 Block High**: Max(C2A.high, C2B.high) with source tracking
- **C2 Block Low**: Min(C2A.low, C2B.low) with source tracking
- **1-Minute Precision**: Scan 1-minute data to find exact timestamps

#### 2.3 Point Assignment
**Uptrend Pattern**:
- Point A = C1 Block Low (lowest price between C1A & C1B)
- Point B = C2 Block High (highest price between C2A & C2B)

**Downtrend Pattern**:
- Point A = C1 Block High (highest price between C1A & C1B)  
- Point B = C2 Block Low (lowest price between C2A & C2B)

**Example Result**:
- Uptrend: Point A = 24907.6 (C1A at 9:22 AM) → Point B = 24978.75 (C2A at 9:38 AM)
- Downtrend: Point A = 24994.85 (C1A at 9:15 AM) → Point B = 24912.7 (C2B at 9:49 AM)

---

### STEP 3: Slope Calculation & Pattern Classification
**Objective**: Calculate mathematical slopes and classify patterns

#### 3.1 Slope Formula
```
Slope = (Point B Price - Point A Price) / (Point B Time - Point A Time in minutes)
```

#### 3.2 Pattern Classification
Based on Point A and Point B sources:
- **1-3 Pattern**: Point A from C1 block, Point B from C2A
- **1-4 Pattern**: Point A from C1 block, Point B from C2B  
- **2-3 Pattern**: Point A from C1B, Point B from C2A
- **2-4 Pattern**: Point A from C1B, Point B from C2B

#### 3.3 Dominant Trend Selection
- Compare absolute slope values
- Select stronger slope as dominant trend
- Assign risk levels (2-3 patterns = high risk)

**Example Calculation**:
- Uptrend Slope: (24978.75 - 24907.6) / 16 min = +4.45 pts/min
- Downtrend Slope: (24912.7 - 24994.85) / 34 min = -2.42 pts/min
- Dominant: Uptrend (stronger absolute slope)

---

### STEP 4: Breakout Level Determination
**Objective**: Set exact breakout levels for trade triggers

#### 4.1 Breakout Rules by Pattern
- **1-3 & 1-4 Patterns**: Breakout level = Point B price
- **2-3 Pattern**: Breakout level = C2A price (special case)
- **2-4 Pattern**: Breakout level = Point B price

#### 4.2 Breakout Direction
- **Uptrend**: Price must break ABOVE breakout level
- **Downtrend**: Price must break BELOW breakout level

**Example**:
- Pattern: 1-3 Uptrend
- Breakout Level: 24978.75 (Point B high)
- Trigger: Price > 24978.75

---

### STEP 5: 5th & 6th Candle Monitoring
**Objective**: Monitor subsequent candles for breakout occurrence

#### 5.1 Real-Time Data Fetching
- Fetch actual 5th and 6th candle OHLC data
- Combine 1-minute candles into target timeframe periods
- Track exact breakout timestamps

#### 5.2 Breakout Detection Logic
```javascript
// Uptrend Breakout
if (candle.high > breakoutLevel) {
  breakoutDetected = true;
  breakoutTimestamp = exact_timestamp;
}

// Downtrend Breakout  
if (candle.low < breakoutLevel) {
  breakoutDetected = true;
  breakoutTimestamp = exact_timestamp;
}
```

---

### STEP 6: Dual Timing Validation Rules
**Objective**: Validate trade timing requirements before order placement

#### 6.1 Rule 1: 50% Duration Rule
```
Point A → Point B duration ≥ 50% of total 4-candle duration
```
- Calculate: Point A to Point B time difference
- Compare: Against 50% of full 4-candle period
- Status: PASS/FAIL with exact percentages

#### 6.2 Rule 2: 34% Wait Rule  
```
Point B → Breakout duration ≥ 34% of Point A → Point B duration
```
- Calculate: Point B to breakout trigger time
- Compare: Against 34% of Point A→B duration
- Status: PASS/FAIL with countdown timer

**Example Validation**:
- Point A→B Duration: 16 minutes
- Rule 1: 16 min ≥ 50% of 40 min (20 min) = FAIL
- Rule 2: Wait time ≥ 34% of 16 min (5.44 min) = PASS/FAIL based on timing

---

### STEP 7: Target Price Calculation
**Objective**: Calculate precise target prices using slope extrapolation

#### 7.1 Target Formula
```
Target Price = Breakout Price + (Slope × Trigger Duration)
```

#### 7.2 Trigger Duration Calculation
- **5th Candle**: Point B → 5th candle end time
- **6th Candle**: Point B → 6th candle end time

#### 7.3 80% Exit Calculation (CORRECTED)
```
80% Exit = Breakout Price + (0.8 × Projected Value)
Projected Value = Slope × Trigger Duration
```

**Example Target Calculation**:
- Slope: +4.45 pts/min
- 5th Candle Duration: 10 minutes from Point B
- Projected Value: 4.45 × 10 = 44.5 points
- Target: 24978.75 + 44.5 = 25023.25
- 80% Exit: 24978.75 + (0.8 × 44.5) = 25014.35

---

### STEP 8: Automatic SL Order Placement
**Objective**: Place stop-loss orders when conditions are met

#### 8.1 Order Placement Conditions
- Breakout detected at exact timestamp
- Both timing rules (50% + 34%) validated as PASS
- Individual candle (5th OR 6th) meets all requirements

#### 8.2 Conditional Logic
```javascript
if (NO_BREAKOUT_in_5th_AND_6th_candles) {
  // Place automatic SL order at 34% timing
  setTimeout(() => placeSLOrder(), 34_percent_duration);
} else {
  // Manual decision required - breakout detected
  cancelAutomaticTimer();
}
```

#### 8.3 Order Parameters
- **Symbol**: Target trading symbol
- **Action**: BUY (uptrend) / SELL (downtrend)
- **Entry Price**: Breakout level
- **Stop Loss**: Calculated risk-based level
- **Quantity**: Based on risk amount and SL distance
- **Order Type**: SL Limit Order

---

### STEP 9: Trade Execution & Monitoring
**Objective**: Execute trade and monitor progress to target

#### 9.1 Entry Confirmation
- Verify order fill at breakout price
- Confirm direction matches pattern analysis
- Start target monitoring

#### 9.2 Target Monitoring
- Track price movement toward calculated target
- Monitor 80% exit level for profit-taking
- Watch for reversal signals

#### 9.3 Exit Strategies
1. **80% Target Hit**: Take partial/full profit
2. **Full Target Hit**: Complete profit realization  
3. **Stop Loss Hit**: Cut losses as planned
4. **Time-based Exit**: Close at predetermined time

---

### STEP 10: Progressive Timeframe Analysis (Advanced)
**Objective**: Continue analysis at higher timeframes after 6th candle

#### 10.1 Timeframe Doubling Trigger
- After 6th candle completion
- Double current timeframe (10min → 20min → 40min → 80min max)
- Continue until market close

#### 10.2 6-to-3 Candle Consolidation
- Consolidate 6 completed candles into 3 candles at doubled timeframe
- Apply 4-candle rule at new timeframe level
- Repeat process with enhanced analysis

---

## Risk Management Guidelines

### Position Sizing
- Risk per trade: 1-2% of capital
- Calculate quantity based on SL distance
- Never exceed maximum position limits

### Stop Loss Management
- Initial SL: Based on pattern analysis
- Trailing SL: Move with profitable price action
- Time-based SL: Exit if no movement within timeframe

### Target Management
- Take partial profits at 80% target
- Full exit at calculated target price
- Consider multiple exit levels for larger positions

---

## Success Metrics & Validation

### Pattern Success Rate
- Track win/loss ratio by pattern type
- Monitor dominant trend accuracy
- Analyze breakout timing effectiveness

### Timing Rule Impact
- Compare trades with/without timing validation
- Measure improvement in success rate
- Optimize timing percentages based on results

### Target Achievement
- Track percentage of targets reached
- Monitor 80% vs full target performance
- Analyze slope accuracy in price prediction

---

## Complete Example: NIFTY 4-Candle Analysis

**Data Collection**: 4 × 10min candles (9:15-9:55 AM)
**Point Detection**: A=24907.6@9:22, B=24978.75@9:38 (1-3 uptrend)
**Slope Calculation**: +4.45 pts/min over 16 minutes
**Breakout Level**: 24978.75 (uptrend trigger)
**Timing Rules**: Rule 1 FAIL (40%), Rule 2 depends on breakout timing
**5th Candle Target**: 25023.25 (breakout + 44.5 pts)
**80% Exit**: 25014.35 (breakout + 35.6 pts)
**Trade Decision**: Wait for both timing rules to pass before order placement

This complete methodology ensures systematic, rule-based trading with precise entry, exit, and risk management parameters.