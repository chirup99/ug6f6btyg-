import axios from 'axios';

export interface InstrumentData {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: number;
  lotsize: number;
  instrumenttype: string;
  exch_seg: string;
  tick_size: string;
}

export interface OptionInstrument {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: number;
  optionType: 'CE' | 'PE';
  lotSize: number;
}

export interface OptionChainStrike {
  strikePrice: number;
  CE?: OptionInstrument & { ltp?: number; volume?: number; oi?: number; change?: number };
  PE?: OptionInstrument & { ltp?: number; volume?: number; oi?: number; change?: number };
}

export interface OptionChainData {
  underlying: string;
  spotPrice: number;
  expiry: string;
  expiryDates: string[];
  strikes: OptionChainStrike[];
  atmStrike: number;
  timestamp: string;
}

class AngelOneInstruments {
  private instruments: InstrumentData[] = [];
  private lastFetch: Date | null = null;
  private fetchIntervalMs = 6 * 60 * 60 * 1000; // Refresh every 6 hours
  private isFetching = false;
  
  private readonly INSTRUMENT_URL = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';
  
  constructor() {
    console.log('📋 [INSTRUMENTS] Angel One Instrument Master service initialized');
  }

  async ensureInstruments(): Promise<void> {
    const now = new Date();
    const needsRefresh = !this.lastFetch || 
      (now.getTime() - this.lastFetch.getTime()) > this.fetchIntervalMs ||
      this.instruments.length === 0;
    
    if (needsRefresh && !this.isFetching) {
      await this.fetchInstruments();
    }
  }

  async fetchInstruments(): Promise<void> {
    if (this.isFetching) {
      console.log('📋 [INSTRUMENTS] Already fetching, skipping...');
      return;
    }

    this.isFetching = true;
    try {
      console.log('📋 [INSTRUMENTS] Fetching instrument master from Angel One...');
      const startTime = Date.now();
      
      const response = await axios.get(this.INSTRUMENT_URL, {
        timeout: 60000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        this.instruments = response.data;
        this.lastFetch = new Date();
        const duration = Date.now() - startTime;
        console.log(`✅ [INSTRUMENTS] Loaded ${this.instruments.length} instruments in ${duration}ms`);
      } else {
        throw new Error('Invalid instrument data format');
      }
    } catch (error: any) {
      console.error('❌ [INSTRUMENTS] Failed to fetch instruments:', error.message);
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  getOptionInstruments(underlying: string, expiry?: string): OptionInstrument[] {
    const normalizedUnderlying = underlying.toUpperCase().trim();
    
    const options = this.instruments
      .filter(inst => {
        const isOption = inst.instrumenttype === 'OPTIDX' || inst.instrumenttype === 'OPTSTK';
        const isNFO = ["NFO", "BFO"].includes(inst.exch_seg);
        
        // Check if instrument matches the underlying - try multiple fields
        // For NIFTY, BANKNIFTY: name field contains the underlying
        // For stocks: symbol field starts with the underlying (e.g., RELIANCE25NOV1450CE)
        const matchesUnderlying = 
          inst.name === normalizedUnderlying ||
          inst.name?.includes(normalizedUnderlying) ||
          inst.symbol?.startsWith(normalizedUnderlying) ||
          inst.name?.toUpperCase() === normalizedUnderlying;
        
        const matchesExpiry = !expiry || inst.expiry === expiry;
        
        return isOption && isNFO && matchesUnderlying && matchesExpiry;
      })
      .map(inst => {
        const optionType = inst.symbol.endsWith('CE') ? 'CE' : 'PE';
        // Angel One stores strike prices multiplied by 100 (e.g., 2400000 instead of 24000)
        // Normalize by dividing by 100 to get actual strike price
        const normalizedStrike = inst.strike / 100;
        return {
          token: inst.token,
          symbol: inst.symbol,
          name: inst.name,
          expiry: inst.expiry,
          strike: normalizedStrike,
          optionType: optionType as 'CE' | 'PE',
          lotSize: inst.lotsize
        };
      })
      .sort((a, b) => a.strike - b.strike);

    if (options.length === 0) {
      console.log(`⚠️ [INSTRUMENTS] No options found for ${normalizedUnderlying}${expiry ? ` expiry ${expiry}` : ''}. Sample instruments:`, 
        this.instruments.filter(i => i.instrumenttype === 'OPTIDX' || i.instrumenttype === 'OPTSTK').slice(0, 3));
    } else {
      console.log(`📋 [INSTRUMENTS] Found ${options.length} options for ${normalizedUnderlying}${expiry ? ` expiry ${expiry}` : ''}`);
    }
    return options;
  }

  getExpiryDates(underlying: string): string[] {
    const normalizedUnderlying = underlying.toUpperCase().trim();
    
    const expiries = new Set<string>();
    
    this.instruments.forEach(inst => {
      const isOption = inst.instrumenttype === 'OPTIDX' || inst.instrumenttype === 'OPTSTK';
      const isNFO = ["NFO", "BFO"].includes(inst.exch_seg);
      const matchesUnderlying = inst.name === normalizedUnderlying;
      
      if (isOption && isNFO && matchesUnderlying && inst.expiry) {
        expiries.add(inst.expiry);
      }
    });

    const sortedExpiries = Array.from(expiries).sort((a, b) => {
      const dateA = this.parseExpiryDate(a);
      const dateB = this.parseExpiryDate(b);
      return dateA.getTime() - dateB.getTime();
    });

    console.log(`📋 [INSTRUMENTS] Found ${sortedExpiries.length} expiry dates for ${normalizedUnderlying}`);
    return sortedExpiries;
  }

  private parseExpiryDate(expiry: string): Date {
    // Angel One format: 28NOV2024 or similar
    const months: { [key: string]: number } = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    
    const day = parseInt(expiry.substring(0, 2));
    const monthStr = expiry.substring(2, 5).toUpperCase();
    const year = parseInt(expiry.substring(5));
    
    return new Date(year, months[monthStr] || 0, day);
  }

  getNearestExpiry(underlying: string): string | null {
    const expiries = this.getExpiryDates(underlying);
    const now = new Date();
    
    for (const expiry of expiries) {
      const expiryDate = this.parseExpiryDate(expiry);
      if (expiryDate >= now) {
        return expiry;
      }
    }
    
    return expiries[0] || null;
  }

  getUnderlyingToken(underlying: string): string | null {
    const normalizedUnderlying = underlying.toUpperCase().trim();
    
    // Map common underlying names to their index tokens
    const indexMappings: { [key: string]: { symbol: string; token: string } } = {
      'NIFTY': { symbol: 'Nifty 50', token: '99926000' },
      'BANKNIFTY': { symbol: 'Nifty Bank', token: '99926009' },
      'FINNIFTY': { symbol: 'Nifty Fin Service', token: '99926037' },
      'MIDCPNIFTY': { symbol: 'NIFTY MID SELECT', token: '99926074' }
    };
    
    if (indexMappings[normalizedUnderlying]) {
      return indexMappings[normalizedUnderlying].token;
    }

    // Try to find in instruments
    const instrument = this.instruments.find(inst => 
      inst.exch_seg === 'NSE' && 
      (inst.symbol === normalizedUnderlying || inst.name === normalizedUnderlying)
    );
    
    return instrument?.token || null;
  }

  buildOptionChainStructure(underlying: string, expiry?: string): OptionChainStrike[] {
    const options = this.getOptionInstruments(underlying, expiry);
    const strikeMap = new Map<number, OptionChainStrike>();

    for (const opt of options) {
      if (!strikeMap.has(opt.strike)) {
        strikeMap.set(opt.strike, { strikePrice: opt.strike });
      }

      const strike = strikeMap.get(opt.strike)!;
      if (opt.optionType === 'CE') {
        strike.CE = opt;
      } else {
        strike.PE = opt;
      }
    }

    return Array.from(strikeMap.values()).sort((a, b) => a.strikePrice - b.strikePrice);
  }

  getInstrumentCount(): number {
    return this.instruments.length;
  }

  getLastFetchTime(): Date | null {
    return this.lastFetch;
  }

  isLoaded(): boolean {
    return this.instruments.length > 0;
  }
}

export const angelOneInstruments = new AngelOneInstruments();
