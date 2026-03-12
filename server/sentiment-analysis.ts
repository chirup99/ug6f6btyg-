import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CandleSentiment {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  score: number; // -1 to 1 (negative = bearish, positive = bullish)
  reasoning: string;
  volume_analysis: string;
  trend_strength: number; // 0-100
}

export interface SentimentAnalysisRequest {
  candles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  symbol: string;
}

export class SentimentAnalyzer {
  /**
   * Analyze OHLC and volume data for sentiment using Gemini AI
   */
  public async analyzeCandleSentiment(
    currentCandle: any,
    previousCandles: any[] = [],
    symbol: string
  ): Promise<CandleSentiment> {
    try {
      // Prepare candle data context
      const candleContext = this.prepareCandleContext(currentCandle, previousCandles);
      
      const prompt = `
You are a professional trading sentiment analyst. Analyze the following OHLC and volume data for ${symbol} and provide trading sentiment.

Current Candle:
Open: ${currentCandle.open}
High: ${currentCandle.high} 
Low: ${currentCandle.low}
Close: ${currentCandle.close}
Volume: ${currentCandle.volume}

Previous Context: ${candleContext}

Analyze this data and provide:
1. Trading Signal: BUY, SELL, or HOLD
2. Confidence Level: 0-100 (how confident you are in the signal)
3. Sentiment Score: -1 to 1 (negative = bearish, positive = bullish)
4. Brief reasoning for the signal
5. Volume analysis insight
6. Trend strength: 0-100

Consider:
- Price action (open vs close, body size, wicks)
- Volume patterns (high/low volume significance)
- Momentum (comparing with previous candles)
- Support/resistance levels
- Market microstructure

Respond with JSON in this exact format:
{
  "signal": "BUY|SELL|HOLD",
  "confidence": number,
  "score": number,
  "reasoning": "brief explanation",
  "volume_analysis": "volume insight",
  "trend_strength": number
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              signal: { type: "string", enum: ["BUY", "SELL", "HOLD"] },
              confidence: { type: "number" },
              score: { type: "number" },
              reasoning: { type: "string" },
              volume_analysis: { type: "string" },
              trend_strength: { type: "number" }
            },
            required: ["signal", "confidence", "score", "reasoning", "volume_analysis", "trend_strength"]
          }
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (rawJson) {
        const sentiment: CandleSentiment = JSON.parse(rawJson);
        return sentiment;
      } else {
        throw new Error("Empty response from Gemini AI");
      }
    } catch (error) {
      console.error(`❌ Sentiment analysis failed for ${symbol}:`, error);
      
      // Fallback to technical analysis
      return this.fallbackTechnicalSentiment(currentCandle, previousCandles);
    }
  }

  /**
   * Prepare context from previous candles
   */
  private prepareCandleContext(currentCandle: any, previousCandles: any[]): string {
    if (previousCandles.length === 0) return "No previous context available";
    
    const recent = previousCandles.slice(-3); // Last 3 candles
    return recent.map((candle, i) => 
      `Candle-${i+1}: O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close} V:${candle.volume}`
    ).join(', ');
  }

  /**
   * Fallback technical analysis when Gemini API fails
   */
  private fallbackTechnicalSentiment(currentCandle: any, previousCandles: any[]): CandleSentiment {
    const { open, high, low, close, volume } = currentCandle;
    
    // Calculate basic technical indicators
    const bodySize = Math.abs(close - open);
    const totalRange = high - low;
    const bodyRatio = totalRange > 0 ? bodySize / totalRange : 0;
    
    const isGreen = close > open;
    const upperWick = high - Math.max(open, close);
    const lowerWick = Math.min(open, close) - low;
    
    // Volume analysis
    const avgVolume = previousCandles.length > 0 ? 
      previousCandles.reduce((sum, c) => sum + c.volume, 0) / previousCandles.length : volume;
    const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1;
    
    // Determine sentiment
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let score = 0;
    let confidence = 50;
    
    // Strong green candle with high volume
    if (isGreen && bodyRatio > 0.6 && volumeRatio > 1.2) {
      signal = 'BUY';
      score = 0.7;
      confidence = 75;
    }
    // Strong red candle with high volume
    else if (!isGreen && bodyRatio > 0.6 && volumeRatio > 1.2) {
      signal = 'SELL';
      score = -0.7;
      confidence = 75;
    }
    // Doji or small body
    else if (bodyRatio < 0.3) {
      signal = 'HOLD';
      score = 0;
      confidence = 40;
    }
    // Default based on color
    else {
      signal = isGreen ? 'BUY' : 'SELL';
      score = isGreen ? 0.3 : -0.3;
      confidence = 55;
    }
    
    return {
      signal,
      confidence,
      score,
      reasoning: `Technical: ${isGreen ? 'Green' : 'Red'} candle, Body:${(bodyRatio*100).toFixed(0)}%, Volume:${volumeRatio.toFixed(1)}x`,
      volume_analysis: volumeRatio > 1.5 ? 'High volume' : volumeRatio < 0.8 ? 'Low volume' : 'Normal volume',
      trend_strength: Math.min(confidence + (volumeRatio > 1.2 ? 15 : 0), 100)
    };
  }

  /**
   * Analyze multiple candles in batch with optimized cumulative context
   */
  public async analyzeBatchSentiment(request: SentimentAnalysisRequest): Promise<CandleSentiment[]> {
    const results: CandleSentiment[] = [];
    
    // For large datasets, process in chunks for better performance
    const chunkSize = Math.min(50, request.candles.length); // Process up to 50 candles at a time
    
    for (let i = 0; i < request.candles.length; i++) {
      const currentCandle = request.candles[i];
      
      // Use recent context window (last 20 candles) for efficiency while maintaining accuracy
      const contextStart = Math.max(0, i - 20);
      const previousCandles = request.candles.slice(contextStart, i);
      
      const sentiment = await this.analyzeCandleSentiment(
        currentCandle, 
        previousCandles, 
        request.symbol
      );
      
      results.push(sentiment);
      
      // Batch processing: only add delay every chunk to improve performance
      if (i % chunkSize === 0 && i < request.candles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay
      }
    }
    
    console.log(`✅ Processed ${results.length} candles with cumulative sentiment analysis for ${request.symbol}`);
    return results;
  }

  /**
   * Optimized batch analysis using sliding window approach for large datasets
   */
  public async analyzeOptimizedBatchSentiment(request: SentimentAnalysisRequest): Promise<CandleSentiment[]> {
    if (request.candles.length <= 10) {
      // For small datasets, use full context
      return this.analyzeBatchSentiment(request);
    }

    const results: CandleSentiment[] = [];
    const windowSize = 5; // Analyze every 5th candle for large datasets
    
    // First, analyze key candles with full context
    const keyIndices = [
      0, // First candle
      Math.floor(request.candles.length * 0.25), // 25% point
      Math.floor(request.candles.length * 0.5),  // 50% point
      Math.floor(request.candles.length * 0.75), // 75% point
      request.candles.length - 1 // Last candle
    ];

    for (const index of keyIndices) {
      const currentCandle = request.candles[index];
      const previousCandles = request.candles.slice(Math.max(0, index - 10), index);
      
      const sentiment = await this.analyzeCandleSentiment(
        currentCandle,
        previousCandles,
        request.symbol
      );
      
      results[index] = sentiment;
    }

    // Fill in the gaps with interpolated or technical analysis
    for (let i = 0; i < request.candles.length; i++) {
      if (!results[i]) {
        // Use fallback technical analysis for non-key candles
        const currentCandle = request.candles[i];
        const previousCandles = request.candles.slice(Math.max(0, i - 5), i);
        results[i] = this.fallbackTechnicalSentiment(currentCandle, previousCandles);
      }
    }

    console.log(`✅ Optimized processing: ${keyIndices.length} AI-analyzed + ${request.candles.length - keyIndices.length} technical analysis for ${request.symbol}`);
    return results;
  }
}

export const sentimentAnalyzer = new SentimentAnalyzer();