# BATTU System: Patterns, Slopes, Breakouts & Pattern Comparison

## Overview
Our system uses 4 core pattern types (1-3, 1-4, 2-3, 2-4) with slope calculations, breakout detection, and multi-timeframe pattern comparison to predict 5th and 6th candles accurately.

## 1. Pattern Types Explained

### Pattern 1-3 (Uptrend)
- **Definition**: Price moves from Point A (low) to Point B (high) 
- **Structure**: C1A low → C2A high (crosses C1 block boundary)
- **Signal**: Strong upward momentum across timeframes
- **Example**: If C1A low = 24,800, C2A high = 24,950 → 1-3 Uptrend

### Pattern 1-4 (Uptrend) 
- **Definition**: Price moves from Point A (low) to Point B (high)
- **Structure**: C1A low → C2B high (spans entire 4-candle block)
- **Signal**: Sustained uptrend with stronger momentum
- **Example**: If C1A low = 24,800, C2B high = 25,000 → 1-4 Uptrend

### Pattern 2-3 (Downtrend)
- **Definition**: Price moves from Point A (high) to Point B (low)
- **Structure**: C1B high → C2A low (crosses C1 block boundary)
- **Signal**: Strong downward pressure
- **Example**: If C1B high = 25,000, C2A low = 24,850 → 2-3 Downtrend

### Pattern 2-4 (Downtrend)
- **Definition**: Price moves from Point A (high) to Point B (low)  
- **Structure**: C1B high → C2B low (spans entire 4-candle block)
- **Signal**: Sustained downtrend with stronger momentum
- **Example**: If C1B high = 25,000, C2B low = 24,750 → 2-4 Downtrend

## 2. Slope Calculations

### Slope Formula
```
Slope = (Point B - Point A) / Time Distance
```

### 40min Timeframe Example:
- **Pattern 1-3**: (C2A_high - C1A_low) / 2 candles = (24,950 - 24,800) / 2 = +75 points/candle
- **Pattern 2-4**: (C2B_low - C1B_high) / 3 candles = (24,750 - 25,000) / 3 = -83.33 points/candle

### Slope Strength Classification:
- **Strong Uptrend**: Slope > +50 points/candle
- **Moderate Uptrend**: Slope +20 to +50 points/candle  
- **Weak Uptrend**: Slope 0 to +20 points/candle
- **Strong Downtrend**: Slope < -50 points/candle
- **Moderate Downtrend**: Slope -20 to -50 points/candle
- **Weak Downtrend**: Slope 0 to -20 points/candle

## 3. Breakout Detection

### 5th Candle Breakout (Logic 1 - Deep Pattern Analysis)
**Analysis Window**: C2 block (10:35-11:55 AM)
**Breakout Time**: 5th candle (11:55 AM-12:35 PM)

#### Uptrend Breakout:
- **Trigger Level**: C2 block high (highest point in 3rd,4th candles)
- **Breakout**: 5th candle high > C2 block high
- **Example**: If C2 high = 24,950, breakout when 5th candle > 24,950

#### Downtrend Breakout:
- **Trigger Level**: C2 block low (lowest point in 3rd,4th candles)
- **Breakout**: 5th candle low < C2 block low  
- **Example**: If C2 low = 24,820, breakout when 5th candle < 24,820

### 6th Candle Breakout (Logic 2 - Deep T Analysis)
**Analysis Window**: 4th,5th candles (11:15 AM-12:35 PM)
**Breakout Time**: 6th candle (12:35-1:15 PM)

#### Process:
1. Split 4th,5th candles into 4 × 20-min sub-candles
2. Apply C2 methodology on sub-candles 3,4
3. Calculate breakout levels from sub-candle analysis
4. 6th candle breakout = when price crosses sub-C2 levels

## 4. Pattern Comparison Across Timeframes

### Multi-Timeframe Analysis Example (40min target):

#### 40min Main Timeframe:
- **1-3 Pattern**: Score = 2 (weak, limited data)
- **2-4 Pattern**: Score = 1 (weak, limited data)
- **Winner**: 1-3 Uptrend (Score: 2)

#### 20min Sub-timeframe (from C2 breakdown):
- **1-3 Pattern**: Score = 5 (strong momentum)
- **1-4 Pattern**: Score = 4 (good momentum)  
- **2-3 Pattern**: Score = 2 (weak counter-trend)
- **2-4 Pattern**: Score = 1 (minimal counter-trend)
- **Winner**: 1-3 Uptrend (Score: 5)

#### 10min Sub-timeframe (from C2 breakdown):
- **1-3 Pattern**: Score = 7 (very strong)
- **1-4 Pattern**: Score = 6 (strong)
- **2-3 Pattern**: Score = 3 (moderate counter)
- **2-4 Pattern**: Score = 2 (weak counter)
- **Winner**: 1-3 Uptrend (Score: 7)

#### 5min Sub-timeframe (from C2 breakdown):
- **1-3 Pattern**: Score = 4 (good momentum)
- **1-4 Pattern**: Score = 3 (moderate momentum)
- **2-3 Pattern**: Score = 5 (strong counter-trend)
- **2-4 Pattern**: Score = 4 (good counter-trend)
- **Winner**: 2-3 Downtrend (Score: 5)

### Final Pattern Comparison:
```
Uptrend Total: 40min(2) + 20min(5) + 10min(7) + 5min(4) = 18 points
Downtrend Total: 40min(1) + 20min(2) + 10min(3) + 5min(5) = 11 points

RESULT: Uptrend wins → 5th candle predicted as UPTREND
Confidence: 18/(18+11) = 62%
```

## 5. Real Implementation in Deep Pattern & Deep T Analysis

### Deep Pattern Analysis (5th Candle):
1. **Extract C2 Block**: 10:35-11:55 AM (80 minutes)
2. **Create Sub-timeframes**: 20min, 10min, 5min from C2 data
3. **Pattern Detection**: Find all 4 patterns in each timeframe
4. **Score Calculation**: Weight patterns by strength and timeframe
5. **Breakout Calculation**: Determine breakout levels for 5th candle
6. **Prediction**: Direction, levels, confidence for 11:55 AM-12:35 PM

### Deep T Analysis (6th Candle):
1. **Extract 4th,5th Candles**: 11:15 AM-12:35 PM (80 minutes)
2. **Sub-candle Creation**: 4 × 20-minute sub-candles
3. **C2 Methodology**: Apply to sub-candles 3,4 (last 40 minutes)
4. **Recursive Analysis**: Create 10min, 5min timeframes from sub-C2
5. **Pattern Comparison**: Compare patterns across all levels
6. **6th Candle Prediction**: Direction, levels, confidence for 12:35-1:15 PM

## 6. Breakout Validation & Trading Signals

### Entry Rules:
- **Uptrend Breakout**: Enter long when 5th/6th candle breaks above resistance
- **Downtrend Breakout**: Enter short when 5th/6th candle breaks below support

### Stop Loss Rules:
- **5th Candle**: Use 4th candle high/low as stop loss
- **6th Candle**: Use 5th candle high/low as stop loss

### Target Calculation:
- **Target 1**: Breakout + (Point A to Point B distance)
- **Target 2**: Breakout + 1.5 × (Point A to Point B distance)

This comprehensive system ensures accurate pattern detection, slope analysis, breakout identification, and multi-timeframe pattern comparison for precise 5th and 6th candle predictions.