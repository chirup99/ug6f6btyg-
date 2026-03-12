import { Router } from "express";
// import { fyersApi } from "./fyers-api"; // Removed: Fyers API removed

const router = Router();

// Hybrid data endpoint: Historical data + Live market data for current trading day
router.get("/hybrid-data/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const requestedDate = req.query.date as string;
    const currentDate = new Date().toISOString().split('T')[0];
    const targetDate = requestedDate || currentDate;
    
    console.log(`🔄 HYBRID DATA REQUEST for ${symbol} on ${targetDate}`);
    
    // Check if this is for today's live market
    const isLiveMarketDay = targetDate === currentDate;
    
    if (!isLiveMarketDay) {
      // For historical dates, return only historical data
      console.log(`📚 HISTORICAL ONLY: Fetching complete historical data for ${targetDate}`);
      const historicalData = null; // fyersApi.getHistoricalData({
        symbol,
        resolution: '1',
        range_from: targetDate,
        range_to: targetDate,
        date_format: '1',
        cont_flag: '1'
      });
      
      return res.json({
        success: true,
        symbol,
        date: targetDate,
        dataType: 'historical_complete',
        candles: historicalData,
        totalCandles: historicalData.length,
        lastUpdate: new Date().toISOString(),
        isLiveMarket: false
      });
    }
    
    // For today's live market: Hybrid approach
    console.log(`🔴 LIVE MARKET DAY: Implementing hybrid historical + live data approach`);
    
    // Step 1: Fetch available historical data up to current time
    console.log(`📈 Step 1: Fetching available historical data till current time...`);
    const historicalData = null; // fyersApi.getHistoricalData({
      symbol,
      resolution: '1',
      range_from: targetDate,
      range_to: targetDate,
      date_format: '1',
      cont_flag: '1'
    });
    
    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No historical data available for hybrid processing"
      });
    }
    
    // Step 2: Determine current market time and data coverage
    const currentTime = new Date();
    const istTime = new Date(currentTime.getTime() + (5.5 * 60 * 60 * 1000));
    const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();
    
    // Market hours: 9:15 AM to 3:30 PM IST (555 to 930 minutes)
    const marketStart = 9 * 60 + 15; // 555 minutes (9:15 AM)
    const marketEnd = 15 * 60 + 30;   // 930 minutes (3:30 PM)
    const isMarketOpen = currentMinutes >= marketStart && currentMinutes <= marketEnd;
    
    // Step 3: Analyze data coverage
    const latestHistoricalCandle = historicalData[historicalData.length - 1];
    const latestTimestamp = Array.isArray(latestHistoricalCandle) ? latestHistoricalCandle[0] : latestHistoricalCandle.timestamp;
    const latestTime = new Date(latestTimestamp * 1000);
    const latestTimeIST = new Date(latestTime.getTime() + (5.5 * 60 * 60 * 1000));
    
    const timeDifferenceMinutes = Math.abs(istTime.getTime() - latestTimeIST.getTime()) / (1000 * 60);
    
    console.log(`📊 HYBRID DATA ANALYSIS:`);
    console.log(`   Current IST Time: ${istTime.toLocaleTimeString('en-IN')}`);
    console.log(`   Latest Historical: ${latestTimeIST.toLocaleTimeString('en-IN')}`);
    console.log(`   Time Gap: ${timeDifferenceMinutes.toFixed(1)} minutes`);
    console.log(`   Market Status: ${isMarketOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`   Historical Candles: ${historicalData.length}`);
    
    // Step 4: Decide on live data requirement - ONLY when market is open
    if (!isMarketOpen) {
      console.log(`🛑 MARKET CLOSED: Returning complete historical data without live data merging`);
      return res.json({
        success: true,
        symbol,
        date: targetDate,
        dataType: 'historical_complete_market_closed',
        candles: historicalData,
        totalCandles: historicalData.length,
        lastUpdate: new Date().toISOString(),
        isLiveMarket: false,
        marketStatus: 'CLOSED',
        timeCoverage: {
          historicalUpTo: latestTimeIST.toLocaleTimeString('en-IN'),
          currentTime: istTime.toLocaleTimeString('en-IN'),
          gapMinutes: timeDifferenceMinutes
        },
        message: 'Market is closed - historical data only, no live data merging'
      });
    }
    
    const needsLiveData = timeDifferenceMinutes > 2; // Gap > 2 minutes means we need live data
    
    let hybridResponse: any = {
      success: true,
      symbol,
      date: targetDate,
      dataType: 'historical_current',
      candles: historicalData,
      totalCandles: historicalData.length,
      lastUpdate: new Date().toISOString(),
      isLiveMarket: true,
      marketStatus: 'OPEN',
      timeCoverage: {
        historicalUpTo: latestTimeIST.toLocaleTimeString('en-IN'),
        currentTime: istTime.toLocaleTimeString('en-IN'),
        gapMinutes: timeDifferenceMinutes
      }
    };
    
    if (needsLiveData) {
      console.log(`🚀 LIVE DATA REQUIRED: Gap of ${timeDifferenceMinutes.toFixed(1)} minutes detected`);
      
      try {
        // Fetch current live price to bridge the gap
        const liveQuote = null; // fyersApi.getQuotes([symbol]);
        if (liveQuote && liveQuote.length > 0) {
          const quote = liveQuote[0];
          const currentPrice = (quote as any).lp || (quote as any).close;
          
          // Create a live candle for current minute
          const currentCandle = [
            Math.floor(istTime.getTime() / 1000),
            currentPrice,
            currentPrice,
            currentPrice,
            currentPrice,
            0
          ];
          
          console.log(`📡 LIVE PRICE BRIDGE: Current price ₹${currentPrice} at ${istTime.toLocaleTimeString('en-IN')}`);
          
          hybridResponse.dataType = 'hybrid_historical_live';
          hybridResponse.livePrice = {
            price: currentPrice,
            timestamp: Math.floor(istTime.getTime() / 1000),
            timeIST: istTime.toLocaleTimeString('en-IN')
          };
          hybridResponse.liveBridgeCandle = currentCandle;
          hybridResponse.requiresLiveUpdates = true;
        }
      } catch (liveError) {
        console.log(`⚠️ Live price fetch failed: ${(liveError as any).message || liveError}`);
        hybridResponse.liveDataError = (liveError as any).message || 'Unknown error';
      }
    } else {
      console.log(`✅ HISTORICAL DATA SUFFICIENT: Gap of ${timeDifferenceMinutes.toFixed(1)} minutes is acceptable`);
      hybridResponse.requiresLiveUpdates = false;
    }
    
    return res.json(hybridResponse);
    
  } catch (error: any) {
    console.error(`❌ Error in hybrid data processing for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: `Hybrid data processing failed: ${error.message}`
    });
  }
});

// Live streaming endpoint with 700ms refresh for real-time updates
router.get("/live-stream/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📡 LIVE STREAM REQUEST for ${symbol}`);
    
    // Fetch current live quote
    const liveQuote = null; // fyersApi.getQuotes([symbol]);
    if (!liveQuote || liveQuote.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No live quote available"
      });
    }
    
    const quote = liveQuote[0];
    const currentTime = new Date();
    const istTime = new Date(currentTime.getTime() + (5.5 * 60 * 60 * 1000));
    
    const liveData = {
      success: true,
      symbol,
      price: (quote as any).lp || (quote as any).close,
      open: (quote as any).open_price,
      high: (quote as any).high_price,
      low: (quote as any).low_price,
      volume: (quote as any).volume,
      change: (quote as any).ch,
      changePercent: (quote as any).chp,
      timestamp: Math.floor(istTime.getTime() / 1000),
      timeIST: istTime.toLocaleTimeString('en-IN'),
      lastUpdate: new Date().toISOString(),
      refreshInterval: 700 // 700ms as requested
    };
    
    console.log(`📊 LIVE STREAM: ${symbol} @ ₹${liveData.price} (${liveData.timeIST})`);
    
    res.json(liveData);
    
  } catch (error: any) {
    console.error(`❌ Error in live stream for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: `Live stream failed: ${error.message}`
    });
  }
});

export default router;