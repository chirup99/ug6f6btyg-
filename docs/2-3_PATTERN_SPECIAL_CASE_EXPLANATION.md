# 2-3 Pattern Special Case Explanation

## User Correction (July 31, 2025)

### CORRECTED 2-3 Pattern Logic:

**Pattern Connection:**
- Uses **2nd candle's extreme point** → **3rd candle's extreme point** (C1B → C2A)

**Special 2-3 Pattern Rule:**
- Point A in C1B, Point B in C2A 
- This creates the "side by side" nature where Point B is used for both slope calculation AND breakout level

## Summary

**CORRECTED Pattern Classifications:**
- **1-3 Pattern**: Point A in C1A, Point B in C2A (breakout at C2A)
- **1-4 Pattern**: Point A in C1A, Point B in C2B (breakout at C2B)  
- **2-3 Pattern**: Point A in C1B, Point B in C2A (breakout at C2A)
- **2-4 Pattern**: Point A in C1B, Point B in C2B (breakout at C2B)

**Universal Stop Loss Rule:**
- ALL patterns use 4th candle (C2B) for stop loss regardless of breakout level

This unique behavior makes 2-3 patterns high-risk due to their "side by side" characteristic where the connection and breakout points are different candles.

## Implementation Status
- Documentation updated in COMPLETE_BATTU_API_RULES_EXPLANATION.md
- Code implementation verified in flexible-timeframe-doubler.ts
- Special case handling confirmed in trendline-chart.tsx