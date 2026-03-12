# EXACT Direct 10-Minute OHLC Values - July 25th NIFTY

## Real Fyers API 10-Minute Candles (No 1-Minute Splitting)

Here are the EXACT C1A, C1B, C2A, C2B values directly from Fyers API:

### **C1A (9:15-9:25 AM) - First 10-Minute Candle**
- **Timestamp**: 1753415100 (9:15:00 AM)
- **Open**: 24,994.85
- **High**: 24,994.85
- **Low**: 24,907.6
- **Close**: 24,932.85
- **Volume**: 0

### **C1B (9:25-9:35 AM) - Second 10-Minute Candle**
- **Timestamp**: 1753415700 (9:25:00 AM)
- **Open**: 24,931.6
- **High**: 24,993.85
- **Low**: 24,924.35
- **Close**: 24,950.0
- **Volume**: 0

### **C2A (9:35-9:45 AM) - Third 10-Minute Candle**
- **Timestamp**: 1753416300 (9:35:00 AM)
- **Open**: 24,950.15
- **High**: 24,978.75
- **Low**: 24,924.6
- **Close**: 24,926.35
- **Volume**: 0

### **C2B (9:45-9:55 AM) - Fourth 10-Minute Candle**
- **Timestamp**: 1753416900 (9:45:00 AM)
- **Open**: 24,926.6
- **High**: 24,943.35
- **Low**: 24,912.7
- **Close**: 24,923.1
- **Volume**: 0

## Block Analysis with Real OHLC Values

### **C1 Block Combined (C1A + C1B = First 20 minutes)**
- **C1 Block High**: max(24,994.85, 24,993.85) = **24,994.85** (from C1A)
- **C1 Block Low**: min(24,907.6, 24,924.35) = **24,907.6** (from C1A)

### **C2 Block Combined (C2A + C2B = Next 20 minutes)**
- **C2 Block High**: max(24,978.75, 24,943.35) = **24,978.75** (from C2A)
- **C2 Block Low**: min(24,924.6, 24,912.7) = **24,912.7** (from C2B)

## Pattern Classification with Real Values

### **Uptrend Pattern: 1-3**
- **Point A**: C1 Block Low = 24,907.6 (from C1A - Position 1)
- **Point B**: C2 Block High = 24,978.75 (from C2A - Position 3)
- **Price Difference**: 24,978.75 - 24,907.6 = **+71.15 points**
- **Pattern**: **1-3 UPTREND** (positive slope)

### **Downtrend Pattern: 2-4**
- **Point A**: C1 Block High = 24,994.85 (from C1A - Position 1, but it's the high)
- **Point B**: C2 Block Low = 24,912.7 (from C2B - Position 4)
- **Price Difference**: 24,912.7 - 24,994.85 = **-82.15 points**
- **Pattern**: **1-4 DOWNTREND** (negative slope)

## Corrected Pattern Analysis

**Actually, let me correct this:**

### **Uptrend Pattern: 1-3** 
- Point A (C1 Low) = 24,907.6 from C1A
- Point B (C2 High) = 24,978.75 from C2A
- **Positive movement**: +71.15 points

### **Downtrend Pattern: 1-4**
- Point A (C1 High) = 24,994.85 from C1A  
- Point B (C2 Low) = 24,912.7 from C2B
- **Negative movement**: -82.15 points

**Dominant Pattern**: **1-4 Downtrend** (stronger decline than uptrend gain)

These are the exact OHLC values from Fyers API without any 1-minute data processing.