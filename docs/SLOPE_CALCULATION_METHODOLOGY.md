# Slope Calculation Methodology - Corrected Formula

## Corrected Slope Formula (User Specification)

```
Slope = (Point B Price - Point A Price) / (Point B Time(1-minute data) - Point A Time(1-minute data))
```

## Key Components

### Point A and Point B Definition
- **Point A**: The starting point for slope calculation
- **Point B**: The ending point for slope calculation
- **Critical**: Both points must have exact timestamps from 1-minute data

### Time Calculation Precision
- **Point A Time**: Exact 1-minute timestamp when Point A price occurred
- **Point B Time**: Exact 1-minute timestamp when Point B price occurred
- **Time Difference**: Calculated in minutes using actual 1-minute data timestamps

## Application in 4-Candle Rule

### Uptrend Slope Calculation
```
Point A = C1 Block Low (lowest price in first 20 minutes)
Point B = C2 Block High (highest price in next 20 minutes)

Slope = (C2 High Price - C1 Low Price) / (C2 High Time(1-min) - C1 Low Time(1-min))
```

### Downtrend Slope Calculation
```
Point A = C1 Block High (highest price in first 20 minutes)  
Point B = C2 Block Low (lowest price in next 20 minutes)

Slope = (C2 Low Price - C1 High Price) / (C2 Low Time(1-min) - C1 High Time(1-min))
```

## Critical Implementation Requirements

1. **1-Minute Data Source**: Both Point A and Point B timestamps must come from exact 1-minute data
2. **Block Scanning**: Scan entire C1 block (20 minutes) and C2 block (20 minutes) to find true extremes
3. **Precise Timing**: Record exact minute when each extreme price occurred
4. **Mathematical Accuracy**: Use actual time differences, not assumed durations

## Real Market Example

**Using July 23rd INFY data:**

**C1 Block Analysis (9:15-9:35 AM):**
- Scan 20 one-minute candles
- C1 High: 1589.6 at timestamp X (exact 1-minute data)
- C1 Low: 1576.3 at timestamp Y (exact 1-minute data)

**C2 Block Analysis (9:35-9:55 AM):**
- Scan 20 one-minute candles  
- C2 High: 1578.6 at timestamp Z (exact 1-minute data)
- C2 Low: 1550.0 at timestamp W (exact 1-minute data)

**Corrected Slope Calculations:**
```
Uptrend Slope = (1578.6 - 1576.3) / (Z - Y) = 2.3 / (exact minutes)
Downtrend Slope = (1550.0 - 1589.6) / (W - X) = -39.6 / (exact minutes)
```

## Advantages of This Methodology

1. **Mathematical Precision**: Uses exact timestamps from 1-minute data
2. **True Market Timing**: Captures actual market timing, not assumptions
3. **Accurate Slopes**: Eliminates duration estimation errors
4. **Real Data Foundation**: Based on authentic Fyers API 1-minute candles
5. **Block-Level Analysis**: Finds true extremes within entire time blocks

This corrected formula ensures slope calculations reflect actual market behavior with precise timing from 1-minute data timestamps.