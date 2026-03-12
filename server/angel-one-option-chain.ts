import { angelOneInstruments, OptionChainData, OptionChainStrike, OptionInstrument } from './angel-one-instruments';
import { angelOneApi } from './angel-one-api';
import { angelOneWebSocket } from './angel-one-websocket';
import axios from 'axios';

interface OptionQuoteData {
  token: string;
  ltp: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  oi?: number;
  change?: number;
  changePercent?: number;
}

export interface OptionChainError {
  code: 'INSTRUMENTS_NOT_LOADED' | 'NO_EXPIRY_DATES' | 'NO_STRIKES' | 'NOT_AUTHENTICATED' | 'UNKNOWN';
  message: string;
}

export interface OptionChainResult {
  success: boolean;
  data?: OptionChainData;
  error?: OptionChainError;
}

class AngelOneOptionChain {
  private priceCache = new Map<string, OptionQuoteData>();
  private lastPriceFetch: Date | null = null;
  private priceCacheTTL = 5000; // 5 seconds cache for prices
  private defaultStrikeRange = 50; // Default to 50 strikes around ATM, set to 0 for all

  constructor() {
    console.log('📊 [OPTION-CHAIN] Angel One Option Chain service initialized');
  }

  async getOptionChain(underlying: string, expiry?: string, strikeRange?: number): Promise<OptionChainData | null> {
    const result = await this.getOptionChainWithError(underlying, expiry, strikeRange);
    return result.success ? result.data! : null;
  }

  async getOptionChainWithError(underlying: string, expiry?: string, strikeRange?: number): Promise<OptionChainResult> {
    try {
      console.log(`📊 [OPTION-CHAIN] Fetching option chain for ${underlying}${expiry ? ` (${expiry})` : ''}...`);
      
      // Ensure instruments are loaded
      await angelOneInstruments.ensureInstruments();
      
      if (!angelOneInstruments.isLoaded()) {
        return {
          success: false,
          error: { code: 'INSTRUMENTS_NOT_LOADED', message: 'Instrument data not available. Please try again.' }
        };
      }

      // Get expiry dates
      const expiryDates = angelOneInstruments.getExpiryDates(underlying);
      if (expiryDates.length === 0) {
        return {
          success: false,
          error: { code: 'NO_EXPIRY_DATES', message: `No expiry dates found for ${underlying}` }
        };
      }

      // Use provided expiry or nearest one
      const selectedExpiry = expiry || angelOneInstruments.getNearestExpiry(underlying) || expiryDates[0];

      // Build option chain structure
      const strikes = angelOneInstruments.buildOptionChainStructure(underlying, selectedExpiry);
      
      if (strikes.length === 0) {
        return {
          success: false,
          error: { code: 'NO_STRIKES', message: `No option strikes found for ${underlying} expiry ${selectedExpiry}` }
        };
      }

      // Get spot price
      const spotPrice = await this.getSpotPrice(underlying);

      // Calculate ATM strike
      const atmStrike = this.findATMStrike(strikes.map(s => s.strikePrice), spotPrice);

      // Use provided strike range or default (0 means all strikes)
      const effectiveStrikeRange = strikeRange !== undefined ? strikeRange : this.defaultStrikeRange;
      
      // Fetch live prices for options
      const enrichedStrikes = await this.enrichStrikesWithPrices(underlying, strikes, spotPrice, atmStrike, effectiveStrikeRange);

      const optionChainData: OptionChainData = {
        underlying: underlying.toUpperCase(),
        spotPrice,
        expiry: selectedExpiry,
        expiryDates,
        strikes: enrichedStrikes,
        atmStrike,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ [OPTION-CHAIN] Built option chain for ${underlying} with ${enrichedStrikes.length} strikes`);
      return { success: true, data: optionChainData };

    } catch (error: any) {
      console.error(`❌ [OPTION-CHAIN] Error fetching option chain for ${underlying}:`, error.message);
      return {
        success: false,
        error: { code: 'UNKNOWN', message: error.message || 'Unknown error fetching option chain' }
      };
    }
  }

  private async getSpotPrice(underlying: string): Promise<number> {
    const normalizedUnderlying = underlying.toUpperCase().trim();
    
    // Same mappings as paper trading uses
    const indexMappings: { [key: string]: { exchange: string; token: string; symbol: string } } = {
      'NIFTY': { exchange: 'NSE', token: '99926000', symbol: 'Nifty 50' },
      'BANKNIFTY': { exchange: 'NSE', token: '99926009', symbol: 'Nifty Bank' },
      'MIDCPNIFTY': { exchange: 'NSE', token: '99926074', symbol: 'NIFTY MID SELECT' },
      'SENSEX': { exchange: 'BSE', token: '99919000', symbol: 'Sensex' },
    };

    const indexInfo = indexMappings[normalizedUnderlying];
    if (!indexInfo) {
      return 0;
    }

    // Try paper trading's approach: get quotes (which uses getLTP internally)
    try {
      console.log(`📊 [OPTION-CHAIN] Getting spot price for ${normalizedUnderlying} via getQuotes...`);
      const quotes = await angelOneApi.getQuotes([{
        exchange: indexInfo.exchange,
        tradingSymbol: indexInfo.symbol,
        symbolToken: indexInfo.token
      }]);
      
      if (quotes && quotes.length > 0 && quotes[0].ltp > 0) {
        console.log(`📊 [OPTION-CHAIN] ✅ Got price via getQuotes for ${normalizedUnderlying}: ₹${quotes[0].ltp}`);
        return quotes[0].ltp;
      }
    } catch (error: any) {
      console.log(`⚠️ [OPTION-CHAIN] getQuotes failed for ${normalizedUnderlying}: ${error.message}`);
    }

    // Direct LTP call
    try {
      const quote = await angelOneApi.getLTP(indexInfo.exchange, indexInfo.symbol, indexInfo.token);
      if (quote && quote.ltp > 0) {
        console.log(`📊 [OPTION-CHAIN] ✅ Got price via getLTP for ${normalizedUnderlying}: ₹${quote.ltp}`);
        return quote.ltp;
      }
    } catch (error: any) {
      console.log(`⚠️ [OPTION-CHAIN] getLTP failed for ${normalizedUnderlying}: ${error.message}`);
    }

    // Fallback to WebSocket
    try {
      const wsPrices = angelOneWebSocket.getLatestPrices([indexInfo.token]);
      const wsPrice = wsPrices.get(indexInfo.token);
      if (wsPrice && wsPrice.close && wsPrice.close > 0) {
        console.log(`📊 [OPTION-CHAIN] ✅ Got WebSocket price for ${normalizedUnderlying}: ₹${wsPrice.close}`);
        return wsPrice.close;
      }
    } catch (error: any) {
      // Silent fallback
    }

    // Return 0 - UI will show gracefully
    return 0;
  }

  private findATMStrike(strikes: number[], spotPrice: number): number {
    if (strikes.length === 0) return spotPrice;
    
    return strikes.reduce((prev, curr) => 
      Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev
    );
  }

  private async enrichStrikesWithPrices(
    underlying: string,
    strikes: OptionChainStrike[], 
    spotPrice: number,
    atmStrike: number,
    strikeRange: number = 0 // 0 means all strikes
  ): Promise<OptionChainStrike[]> {
    // Filter strikes based on range (0 = all strikes)
    let filteredStrikes: OptionChainStrike[];
    
    if (strikeRange <= 0) {
      // Return all strikes when strikeRange is 0 or negative
      filteredStrikes = strikes;
      console.log(`📊 [OPTION-CHAIN] Using all ${strikes.length} strikes (no range filter)`);
    } else {
      // Filter to +/- strikeRange around ATM
      const atmIndex = strikes.findIndex(s => s.strikePrice === atmStrike);
      filteredStrikes = strikes.filter((strike, index) => {
        return Math.abs(index - atmIndex) <= strikeRange;
      });
      console.log(`📊 [OPTION-CHAIN] Filtered to ${filteredStrikes.length} strikes (±${strikeRange} around ATM)`);
    }

    // Collect all option tokens to fetch prices
    const optionTokens: { token: string; strike: number; type: 'CE' | 'PE' }[] = [];
    
    for (const strike of filteredStrikes) {
      if (strike.CE) {
        optionTokens.push({ token: strike.CE.token, strike: strike.strikePrice, type: 'CE' });
      }
      if (strike.PE) {
        optionTokens.push({ token: strike.PE.token, strike: strike.strikePrice, type: 'PE' });
      }
    }

    // Fetch prices in batches using Angel One API (pass underlying to determine exchange)
    const priceMap = await this.fetchOptionPrices(underlying, optionTokens);

    // Enrich strikes with price data
    const enrichedStrikes = filteredStrikes.map(strike => {
      const enriched: OptionChainStrike = { ...strike };
      
      if (strike.CE) {
        const cePrice = priceMap.get(strike.CE.token);
        enriched.CE = {
          ...strike.CE,
          ltp: cePrice?.ltp || this.calculateTheoreticalPrice(strike.strikePrice, spotPrice, 'CE'),
          volume: cePrice?.volume || 0,
          oi: cePrice?.oi || 0,
          change: cePrice?.change || 0
        };
      }
      
      if (strike.PE) {
        const pePrice = priceMap.get(strike.PE.token);
        enriched.PE = {
          ...strike.PE,
          ltp: pePrice?.ltp || this.calculateTheoreticalPrice(strike.strikePrice, spotPrice, 'PE'),
          volume: pePrice?.volume || 0,
          oi: pePrice?.oi || 0,
          change: pePrice?.change || 0
        };
      }
      
      return enriched;
    });

    return enrichedStrikes;
  }

  private async fetchOptionPrices(
    underlying: string,
    tokens: { token: string; strike: number; type: 'CE' | 'PE' }[]
  ): Promise<Map<string, OptionQuoteData>> {
    const priceMap = new Map<string, OptionQuoteData>();

    if (!angelOneApi.isConnected()) {
      console.log('📊 [OPTION-CHAIN] Angel One not connected, using theoretical prices');
      return priceMap;
    }

    try {
      // Determine exchange based on underlying
      // SENSEX uses BFO (Bombay Futures & Options), others use NFO
      const exchange = underlying.toUpperCase() === 'SENSEX' ? 'BFO' : 'NFO';
      console.log(`📊 [OPTION-CHAIN] Using ${exchange} exchange for ${underlying}`);

      // Batch tokens for API call (Angel One allows up to 50 tokens per request)
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < tokens.length; i += batchSize) {
        batches.push(tokens.slice(i, i + batchSize));
      }

      const session = angelOneApi.getSession();
      const credentials = angelOneApi.getCredentials();
      
      if (!session || !credentials) {
        return priceMap;
      }

      for (const batch of batches) {
        try {
          const tokenList = batch.map(t => t.token);
          
          const response = await axios.post(
            'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/',
            {
              mode: 'FULL',
              exchangeTokens: {
                [exchange]: tokenList
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${session.jwtToken}`,
                'Content-Type': 'application/json',
                'X-UserType': 'USER',
                'X-SourceID': 'WEB',
                'X-ClientLocalIP': '127.0.0.1',
                'X-ClientPublicIP': '127.0.0.1',
                'X-MACAddress': '00:00:00:00:00:00',
                'X-PrivateKey': credentials.apiKey
              },
              timeout: 10000
            }
          );

          if (response.data?.status && response.data?.data?.fetched) {
            for (const quote of response.data.data.fetched) {
              priceMap.set(quote.symbolToken, {
                token: quote.symbolToken,
                ltp: parseFloat(quote.ltp) || 0,
                open: parseFloat(quote.open) || 0,
                high: parseFloat(quote.high) || 0,
                low: parseFloat(quote.low) || 0,
                close: parseFloat(quote.close) || 0,
                volume: parseInt(quote.tradeVolume) || 0,
                oi: parseInt(quote.opnInterest) || 0,
                change: (parseFloat(quote.ltp) || 0) - (parseFloat(quote.close) || 0)
              });
            }
            console.log(`📊 [OPTION-CHAIN] Fetched ${response.data.data.fetched.length} prices from ${exchange}`);
          } else {
            console.log(`📊 [OPTION-CHAIN] No fetched data in response for ${exchange}:`, response.data?.data);
          }
          
          // Small delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error: any) {
          console.log(`📊 [OPTION-CHAIN] Batch fetch error for ${exchange}:`, error.message);
        }
      }

      console.log(`📊 [OPTION-CHAIN] Fetched prices for ${priceMap.size} options from ${exchange}`);
      
    } catch (error: any) {
      console.error('📊 [OPTION-CHAIN] Error fetching option prices:', error.message);
    }

    return priceMap;
  }

  private calculateTheoreticalPrice(strike: number, spot: number, type: 'CE' | 'PE'): number {
    // Simple intrinsic value calculation for fallback
    if (type === 'CE') {
      return Math.max(0, spot - strike);
    } else {
      return Math.max(0, strike - spot);
    }
  }

  getExpiryDates(underlying: string): string[] {
    return angelOneInstruments.getExpiryDates(underlying);
  }

  async getStatus(): Promise<{
    instrumentsLoaded: boolean;
    instrumentCount: number;
    lastFetch: string | null;
    angelOneConnected: boolean;
  }> {
    return {
      instrumentsLoaded: angelOneInstruments.isLoaded(),
      instrumentCount: angelOneInstruments.getInstrumentCount(),
      lastFetch: angelOneInstruments.getLastFetchTime()?.toISOString() || null,
      angelOneConnected: angelOneApi.isConnected()
    };
  }
}

export const angelOneOptionChain = new AngelOneOptionChain();
