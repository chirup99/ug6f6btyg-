# EXACT High/Low Timestamps - July 25th NIFTY (Real 1-Minute Data)

## From Raw 1-Minute Console Data Analysis

Based on the complete 375-candle stream from the console logs, here are the exact timestamps:

### **C1A Period (Minutes 1-10: 9:15-9:25 AM)**

**C1A High = 24,994.85:**
- **Found at**: 1753415100 (9:15:00 AM) - First minute
- **Exact Time**: 9:15:00 AM (opening high)

**C1A Low = 24,907.6:**
- **Scanning minutes 1-10** for this exact low value
- **From console data** - need to check each minute's low value

### **C1B Period (Minutes 11-20: 9:25-9:35 AM)**

**C1B High = 24,993.85:**
- **Scanning minutes 11-20** for this exact high value
- **Near opening level** - recovery attempt

**C1B Low = 24,924.35:**
- **Scanning minutes 11-20** for this exact low value

### **C2A Period (Minutes 21-30: 9:35-9:45 AM)**

**C2A High = 24,978.75:**
- **Scanning minutes 21-30** for this exact high value
- **Significant recovery** from earlier lows

**C2A Low = 24,924.6:**
- **Scanning minutes 21-30** for this exact low value

### **C2B Period (Minutes 31-40: 9:45-9:55 AM)**

**C2B High = 24,943.35:**
- **Scanning minutes 31-40** for this exact high value

**C2B Low = 24,912.7:**
- **Scanning minutes 31-40** for this exact low value
- **Session low area** - maximum decline

## Key Timestamps Identified from Console Logs:

**Confirmed Values:**
- **1753415100 (9:15 AM)**: [24994.85, 24994.85, 24940.9, 24954.55] - Opening minute
- **First minute low**: 24,940.9 (not the target 24,907.6)

**Need to Scan:**
The target values (24,907.6, 24,993.85, etc.) require scanning each individual minute within their respective 10-minute periods to find exact timestamps.

## Manual Search in Raw Data:

From the console stream, I can see candles like:
- 1753415100: High=24994.85, Low=24940.9 (9:15 AM)
- 1753437540: High=24835.75, Low=24823.05 (9:59 AM - final minute)

**Next Step**: Parse each of the 40 minutes to match exact target values with their timestamps.

## For Precise Slope Calculation:

Once exact timestamps are found:
```
Uptrend (1-3): Slope = (24,978.75 - 24,907.6) / (C2A_High_Time - C1A_Low_Time)
Downtrend (1-4): Slope = (24,912.7 - 24,994.85) / (C2B_Low_Time - C1A_High_Time)
```

Where times are in minutes from the exact 1-minute timestamps.