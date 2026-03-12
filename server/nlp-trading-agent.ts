/**
 * NLP Trading Agent - Free Open Source Natural Language Understanding
 * Uses NLP.js for intent classification and entity extraction
 * No API costs - runs entirely in Node.js
 */

import { NlpManager } from 'node-nlp';

export interface NLPResult {
  intent: string;
  score: number;
  entities: Array<{
    entity: string;
    value: string;
    accuracy: number;
  }>;
  answer?: string;
  originalQuery: string;
}

class TradingNLPAgent {
  private manager: any;
  private isReady: boolean = false;

  constructor() {
    this.manager = new NlpManager({ 
      languages: ['en'],
      forceNER: true,
      nlu: { log: false },
      autoSave: false,
      ner: { useDuckling: false }
    });
    this.initializeTraining();
  }

  private async initializeTraining() {
    console.log('🤖 [NLP-AGENT] Initializing Trading NLP Agent...');
    
    // Add stock symbol entities (top Indian stocks)
    const stockSymbols = [
      'RELIANCE', 'TCS', 'INFY', 'INFOSYS', 'HDFCBANK', 'ICICIBANK', 
      'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'HINDUNILVR', 'SBIN',
      'BAJFINANCE', 'ASIANPAINT', 'MARUTI', 'TITAN', 'AXISBANK',
      'SUNPHARMA', 'WIPRO', 'HCLTECH', 'ULTRACEMCO', 'NESTLEIND',
      'TATASTEEL', 'POWERGRID', 'NTPC', 'ONGC', 'JSWSTEEL', 'COALINDIA',
      'ADANIENT', 'ADANIPORTS', 'DRREDDY', 'DIVISLAB', 'CIPLA',
      'BAJAJFINSV', 'GRASIM', 'TECHM', 'INDUSINDBK', 'EICHERMOT',
      'NIFTY', 'BANKNIFTY', 'SENSEX'
    ];
    
    stockSymbols.forEach(symbol => {
      this.manager.addNamedEntityText('stock', symbol, ['en'], [symbol, symbol.toLowerCase()]);
    });

    // Add indicator entities
    const indicators = ['RSI', 'MACD', 'EMA', 'SMA', 'VWAP', 'BOLLINGER', 'ATR', 'ADX', 'STOCHASTIC'];
    indicators.forEach(ind => {
      this.manager.addNamedEntityText('indicator', ind, ['en'], [ind, ind.toLowerCase()]);
    });

    // Add timeframe entities
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', 'daily', 'weekly', 'monthly', 'intraday'];
    timeframes.forEach(tf => {
      this.manager.addNamedEntityText('timeframe', tf, ['en'], [tf]);
    });

    // =============== INTENT: Stock Price ===============
    this.manager.addDocument('en', 'what is the price of %stock%', 'stock.price');
    this.manager.addDocument('en', 'show me %stock% price', 'stock.price');
    this.manager.addDocument('en', '%stock% price', 'stock.price');
    this.manager.addDocument('en', '%stock% current price', 'stock.price');
    this.manager.addDocument('en', 'how much is %stock%', 'stock.price');
    this.manager.addDocument('en', '%stock% ltp', 'stock.price');
    this.manager.addDocument('en', 'get %stock% quote', 'stock.price');
    this.manager.addDocument('en', '%stock% stock price today', 'stock.price');

    // =============== INTENT: Stock Analysis ===============
    this.manager.addDocument('en', 'analyze %stock%', 'stock.analysis');
    this.manager.addDocument('en', '%stock% analysis', 'stock.analysis');
    this.manager.addDocument('en', 'tell me about %stock%', 'stock.analysis');
    this.manager.addDocument('en', '%stock% fundamentals', 'stock.analysis');
    this.manager.addDocument('en', 'should i buy %stock%', 'stock.analysis');
    this.manager.addDocument('en', '%stock% overview', 'stock.analysis');
    this.manager.addDocument('en', 'give me %stock% details', 'stock.analysis');
    this.manager.addDocument('en', '%stock% company info', 'stock.analysis');

    // =============== INTENT: Technical Analysis ===============
    this.manager.addDocument('en', '%stock% technical analysis', 'stock.technical');
    this.manager.addDocument('en', 'show %stock% %indicator%', 'stock.technical');
    this.manager.addDocument('en', '%stock% %indicator% value', 'stock.technical');
    this.manager.addDocument('en', 'what is %stock% %indicator%', 'stock.technical');
    this.manager.addDocument('en', '%stock% chart analysis', 'stock.technical');
    this.manager.addDocument('en', '%stock% trend', 'stock.technical');
    this.manager.addDocument('en', 'is %stock% bullish or bearish', 'stock.technical');
    this.manager.addDocument('en', '%stock% support resistance', 'stock.technical');

    // =============== INTENT: News ===============
    this.manager.addDocument('en', '%stock% news', 'stock.news');
    this.manager.addDocument('en', 'latest news on %stock%', 'stock.news');
    this.manager.addDocument('en', 'show me %stock% news', 'stock.news');
    this.manager.addDocument('en', 'what is happening with %stock%', 'stock.news');
    this.manager.addDocument('en', '%stock% recent news', 'stock.news');
    this.manager.addDocument('en', 'market news', 'market.news');
    this.manager.addDocument('en', 'latest market news', 'market.news');
    this.manager.addDocument('en', 'today market news', 'market.news');
    this.manager.addDocument('en', 'stock market updates', 'market.news');

    // =============== INTENT: Quarterly Results ===============
    this.manager.addDocument('en', '%stock% quarterly results', 'stock.quarterly');
    this.manager.addDocument('en', '%stock% q results', 'stock.quarterly');
    this.manager.addDocument('en', '%stock% earnings', 'stock.quarterly');
    this.manager.addDocument('en', '%stock% quarterly report', 'stock.quarterly');
    this.manager.addDocument('en', '%stock% financial results', 'stock.quarterly');

    // =============== INTENT: Shareholding ===============
    this.manager.addDocument('en', '%stock% shareholding pattern', 'stock.shareholding');
    this.manager.addDocument('en', '%stock% promoter holding', 'stock.shareholding');
    this.manager.addDocument('en', 'who owns %stock%', 'stock.shareholding');
    this.manager.addDocument('en', '%stock% fii dii holding', 'stock.shareholding');

    // =============== INTENT: Social Feed ===============
    this.manager.addDocument('en', 'social feed', 'social.feed');
    this.manager.addDocument('en', 'show social feed', 'social.feed');
    this.manager.addDocument('en', 'what are people saying', 'social.feed');
    this.manager.addDocument('en', 'community posts', 'social.feed');
    this.manager.addDocument('en', '%stock% social feed', 'social.stock');
    this.manager.addDocument('en', 'what are people saying about %stock%', 'social.stock');

    // =============== INTENT: Journal/Trades ===============
    this.manager.addDocument('en', 'my trades', 'journal.trades');
    this.manager.addDocument('en', 'show my journal', 'journal.trades');
    this.manager.addDocument('en', 'trading journal', 'journal.trades');
    this.manager.addDocument('en', 'my trading history', 'journal.trades');
    this.manager.addDocument('en', 'show my %stock% trades', 'journal.stock');
    this.manager.addDocument('en', 'my %stock% positions', 'journal.stock');
    this.manager.addDocument('en', 'today trades', 'journal.today');
    this.manager.addDocument('en', 'my trades today', 'journal.today');

    // =============== INTENT: Watchlist ===============
    this.manager.addDocument('en', 'add %stock% to watchlist', 'watchlist.add');
    this.manager.addDocument('en', 'watchlist add %stock%', 'watchlist.add');
    this.manager.addDocument('en', 'show watchlist', 'watchlist.show');
    this.manager.addDocument('en', 'my watchlist', 'watchlist.show');
    this.manager.addDocument('en', 'remove %stock% from watchlist', 'watchlist.remove');

    // =============== INTENT: Market Overview ===============
    this.manager.addDocument('en', 'market overview', 'market.overview');
    this.manager.addDocument('en', 'how is market today', 'market.overview');
    this.manager.addDocument('en', 'nifty status', 'market.overview');
    this.manager.addDocument('en', 'market status', 'market.overview');
    this.manager.addDocument('en', 'indices today', 'market.overview');

    // =============== INTENT: Sector Analysis ===============
    this.manager.addDocument('en', 'banking sector', 'sector.analysis');
    this.manager.addDocument('en', 'it sector stocks', 'sector.analysis');
    this.manager.addDocument('en', 'pharma stocks', 'sector.analysis');
    this.manager.addDocument('en', 'auto sector', 'sector.analysis');
    this.manager.addDocument('en', 'fmcg stocks', 'sector.analysis');

    // =============== INTENT: Help ===============
    this.manager.addDocument('en', 'help', 'general.help');
    this.manager.addDocument('en', 'what can you do', 'general.help');
    this.manager.addDocument('en', 'how to use', 'general.help');
    this.manager.addDocument('en', 'commands', 'general.help');

    // =============== INTENT: Greetings ===============
    this.manager.addDocument('en', 'hello', 'general.greeting');
    this.manager.addDocument('en', 'hi', 'general.greeting');
    this.manager.addDocument('en', 'hey', 'general.greeting');
    this.manager.addDocument('en', 'good morning', 'general.greeting');

    // =============== INTENT: IPO ===============
    this.manager.addDocument('en', 'upcoming ipo', 'ipo.upcoming');
    this.manager.addDocument('en', 'ipo calendar', 'ipo.upcoming');
    this.manager.addDocument('en', 'new ipos', 'ipo.upcoming');
    this.manager.addDocument('en', 'ipo news', 'ipo.upcoming');

    // =============== INTENT: Comparison ===============
    this.manager.addDocument('en', 'compare %stock% with %stock%', 'stock.compare');
    this.manager.addDocument('en', '%stock% vs %stock%', 'stock.compare');
    this.manager.addDocument('en', '%stock% compared to %stock%', 'stock.compare');

    // =============== INTENT: Screener ===============
    this.manager.addDocument('en', '%stock% screener data', 'stock.screener');
    this.manager.addDocument('en', 'screener %stock%', 'stock.screener');
    this.manager.addDocument('en', '%stock% from screener', 'stock.screener');
    this.manager.addDocument('en', 'get %stock% screener info', 'stock.screener');

    // Train the model
    await this.manager.train();
    this.isReady = true;
    console.log('✅ [NLP-AGENT] Trading NLP Agent ready!');
    console.log('   - Trained intents: 25+');
    console.log('   - Stock entities: ' + stockSymbols.length);
    console.log('   - Indicator entities: ' + indicators.length);
  }

  async process(query: string): Promise<NLPResult> {
    if (!this.isReady) {
      // Wait for training to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!this.isReady) {
        return {
          intent: 'system.loading',
          score: 1,
          entities: [],
          originalQuery: query,
          answer: 'Agent is still initializing. Please try again in a moment.'
        };
      }
    }

    const result = await this.manager.process('en', query);
    
    // Extract entities from the result
    const entities = (result.entities || []).map((e: any) => ({
      entity: e.entity,
      value: e.option || e.sourceText || e.utteranceText,
      accuracy: e.accuracy || 1
    }));

    // Try to extract stock symbol if not found by NER
    if (!entities.find((e: any) => e.entity === 'stock')) {
      const extractedStock = this.extractStockFromQuery(query);
      if (extractedStock) {
        entities.push({
          entity: 'stock',
          value: extractedStock,
          accuracy: 0.8
        });
      }
    }

    return {
      intent: result.intent || 'none',
      score: result.score || 0,
      entities,
      originalQuery: query
    };
  }

  private extractStockFromQuery(query: string): string | null {
    const upperQuery = query.toUpperCase();
    const knownSymbols = [
      'RELIANCE', 'TCS', 'INFY', 'INFOSYS', 'HDFCBANK', 'ICICIBANK',
      'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'HINDUNILVR', 'SBIN',
      'BAJFINANCE', 'ASIANPAINT', 'MARUTI', 'TITAN', 'AXISBANK',
      'SUNPHARMA', 'WIPRO', 'HCLTECH', 'NIFTY', 'BANKNIFTY', 'SENSEX',
      'TATASTEEL', 'ADANI', 'ADANIENT', 'ADANIPORTS', 'ZOMATO', 'PAYTM'
    ];

    for (const symbol of knownSymbols) {
      if (upperQuery.includes(symbol)) {
        return symbol;
      }
    }

    // Try to find any capitalized word that could be a stock symbol
    const words = query.split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (clean.length >= 2 && clean.length <= 15 && /^[A-Z]+$/.test(clean)) {
        // Could be a stock symbol
        if (!['THE', 'AND', 'FOR', 'WITH', 'WHAT', 'HOW', 'SHOW', 'GET', 'IS', 'ARE', 'MY', 'ME', 'TO', 'OF', 'IN', 'ON', 'AT'].includes(clean)) {
          return clean;
        }
      }
    }

    return null;
  }

  isInitialized(): boolean {
    return this.isReady;
  }
}

// Singleton instance
export const tradingNLPAgent = new TradingNLPAgent();
