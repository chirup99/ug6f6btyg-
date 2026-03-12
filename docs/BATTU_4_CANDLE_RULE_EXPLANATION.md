# Battu API 4-Candle Rule: Complete Explanation

## Overview

The Battu API 4-candle rule is a corrected technical analysis methodology that uses **block-level analysis** instead of individual candle analysis for accurate slope calculations. It processes real market data from Fyers API to identify trend patterns and calculate precise slopes.

## Core Methodology

### Step 1: Data Foundation
- Fetches authentic 1-minute market data from Fyers API v3
- Retrieves 375 candles for a full trading day (9:15 AM - 3:30 PM IST)
- Uses real OHLC data with exact timestamps

### Step 2: 4-Candle Block Creation
From 375 one-minute candles, creates 4 blocks of 10 minutes each:

```
C1A Block: Minutes 1-10   (9:15-9:25 AM)
C1B Block: Minutes 11-20  (9:25-9:35 AM) 
C2A Block: Minutes 21-30  (9:35-9:45 AM)
C2B Block: Minutes 31-40  (9:45-9:55 AM)
```

### Step 3: Block-Level Analysis (CORRECTED METHODOLOGY)

**Traditional Wrong Approach:**
- Use individual candle highs/lows
- Assume fixed 20-minute durations
- Miss true market extremes

**Corrected Block Approach:**
- Scan ALL 1-minute data within each block
- Find true highest/lowest prices across entire block
- Record exact timestamps when extremes occurred

#### C1 Block Analysis (C1A + C1B combined)
- Scans 20 one-minute candles (minutes 1-20)
- **C1 Block High**: Highest price across all 20 minutes
- **C1 Block Low**: Lowest price across all 20 minutes
- Records exact minute when each extreme occurred

#### C2 Block Analysis (C2A + C2B combined)  
- Scans 20 one-minute candles (minutes 21-40)
- **C2 Block High**: Highest price across all 20 minutes
- **C2 Block Low**: Lowest price across all 20 minutes
- Records exact minute when each extreme occurred

### Step 4: Corrected Slope Calculations

#### Correct Slope Formula
```
Slope = (Point B Price - Point A Price) / (Point B Time - Point A Time)
```

Where:
- **Point A Time**: Exact 1-minute timestamp when Point A price occurred
- **Point B Time**: Exact 1-minute timestamp when Point B price occurred
- **Time Difference**: Calculated in minutes using actual 1-minute data timestamps

#### Uptrend Slope (Point A = C1 Low, Point B = C2 High)
```
Slope = (C2 High Price - C1 Low Price) / (C2 High Timestamp - C1 Low Timestamp)
```

#### Downtrend Slope (Point A = C1 High, Point B = C2 Low)
```
Slope = (C2 Low Price - C1 High Price) / (C2 Low Timestamp - C1 High Timestamp)
```

**Key Correction**: Uses exact 1-minute data timestamps for both Point A and Point B, ensuring mathematical precision.

### Step 5: Trend Analysis
- **Trend Strength Ratio**: Compares uptrend vs downtrend slopes
- **Dominant Trend**: Identifies stronger trend direction
- **Confidence Level**: Based on slope magnitude differences

## Real Market Example

**Using July 23rd INFY data from Fyers API:**

**C1 Block (9:15-9:35 AM):**
- C1 Block High: 1589.6 at 9:33 AM (exact timestamp)
- C1 Block Low: 1576.3 at 9:15 AM (exact timestamp)

**C2 Block (9:35-9:55 AM):**
- C2 Block High: 1578.6 at 9:45 AM (exact timestamp)
- C2 Block Low: 1550.0 at 9:52 AM (exact timestamp)

**Corrected Slopes:**
- Uptrend: (1578.6 - 1576.3) / (C2 High Timestamp - C1 Low Timestamp) = slope per minute
- Downtrend: (1550.0 - 1589.6) / (C2 Low Timestamp - C1 High Timestamp) = slope per minute
- **Result**: Uses exact 1-minute data timestamps for precise calculation

## API Usage

### Endpoint
```
POST /api/battu-scan/intraday/corrected-four-candle-rule
```

### Request
```json
{
  "symbol": "NSE:NIFTY50-INDEX",
  "date": "2025-07-25"
}
```

### Response Structure
```json
{
  "success": true,
  "methodology": "CORRECTED_BLOCK_LEVEL_ANALYSIS",
  "baseData": {
    "totalCandles": 375,
    "marketHours": {...}
  },
  "analysis": {
    "fourCandleBlock": [...],
    "oneMinuteData": {
      "C1A": [10 candles],
      "C1B": [10 candles], 
      "C2A": [10 candles],
      "C2B": [10 candles]
    },
    "blockAnalysis": {
      "C1": {
        "high": {"price": X, "timestamp": "exact_time"},
        "low": {"price": Y, "timestamp": "exact_time"}
      },
      "C2": {
        "high": {"price": Z, "timestamp": "exact_time"},
        "low": {"price": W, "timestamp": "exact_time"}
      }
    },
    "slopeAnalysis": {
      "uptrend": {"slope": A, "duration": B},
      "downtrend": {"slope": C, "duration": D},
      "dominantTrend": "uptrend|downtrend",
      "strengthRatio": E
    }
  }
}
```

## Key Advantages

1. **Authentic Data**: Uses real market movements from Fyers API
2. **Block-Level Precision**: Scans entire 20-minute blocks, not just endpoints
3. **Exact Timing**: Uses actual timestamps from 1-minute data
4. **Mathematical Accuracy**: Eliminates duration assumptions
5. **True Market Behavior**: Captures actual price extremes and timing
6. **Zero Synthetic Data**: 100% authentic market data processing

## Supported Symbols
- NSE:NIFTY50-INDEX
- NSE:INFY-EQ  
- NSE:RELIANCE-EQ
- NSE:TCS-EQ
- Any NSE symbol supported by Fyers API

This methodology provides accurate trend analysis based on real market behavior rather than theoretical assumptions.