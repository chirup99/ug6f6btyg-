import { AnalysisStep, AnalysisMetadata } from '@shared/schema';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ProcessingContext {
  data: any[];
  variables: Record<string, any>;
  metadata: AnalysisMetadata;
}

export class AnalysisProcessor {
  
  /**
   * Main function to process market data according to step-by-step instructions
   */
  async processInstructions(
    data: CandleData[],
    instructions: AnalysisStep[]
  ): Promise<{ result: any; metadata: AnalysisMetadata }> {
    const startTime = Date.now();
    const context: ProcessingContext = {
      data: [...data],
      variables: {},
      metadata: {
        executionTime: 0,
        dataPoints: data.length,
        errors: [],
        warnings: []
      }
    };

    try {
      console.log(`🔄 Starting analysis with ${instructions.length} steps on ${data.length} data points`);
      
      for (const [index, step] of instructions.entries()) {
        console.log(`📊 Executing step ${index + 1}: ${step.name} (${step.type})`);
        
        try {
          await this.executeStep(step, context);
        } catch (error) {
          const errorMsg = `Step ${index + 1} (${step.name}) failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          context.metadata.errors?.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          
          // Continue with next steps unless it's a critical error
          if (step.parameters?.stopOnError) {
            break;
          }
        }
      }
      
      context.metadata.executionTime = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${context.metadata.executionTime}ms`);
      
      return {
        result: context.data,
        metadata: context.metadata
      };
      
    } catch (error) {
      context.metadata.executionTime = Date.now() - startTime;
      context.metadata.errors?.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        result: context.data,
        metadata: context.metadata
      };
    }
  }

  /**
   * Execute a single analysis step
   */
  private async executeStep(step: AnalysisStep, context: ProcessingContext): Promise<void> {
    switch (step.type) {
      case 'filter':
        await this.executeFilter(step, context);
        break;
      case 'calculate':
        await this.executeCalculation(step, context);
        break;
      case 'aggregate':
        await this.executeAggregation(step, context);
        break;
      case 'transform':
        await this.executeTransformation(step, context);
        break;
      case 'condition':
        await this.executeCondition(step, context);
        break;
      case 'pattern':
        await this.executePatternDetection(step, context);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * FILTER: Filter data based on conditions
   */
  private async executeFilter(step: AnalysisStep, context: ProcessingContext): Promise<void> {
    const { field, operator, value, timeRange } = step.parameters;
    
    let filteredData = [...context.data];
    
    // Time-based filtering
    if (timeRange) {
      const { start, end } = timeRange;
      filteredData = filteredData.filter(candle => {
        const timestamp = candle.timestamp * 1000;
        return timestamp >= new Date(start).getTime() && timestamp <= new Date(end).getTime();
      });
    }
    
    // Field-based filtering
    if (field && operator && value !== undefined) {
      filteredData = filteredData.filter(candle => {
        const fieldValue = this.getFieldValue(candle, field);
        return this.evaluateCondition(fieldValue, operator, value);
      });
    }
    
    context.data = filteredData;
    if (step.output) {
      context.variables[step.output] = filteredData.length;
    }
    
    console.log(`🔍 Filter applied: ${context.data.length} records remaining`);
  }

  /**
   * CALCULATE: Perform calculations on data
   */
  private async executeCalculation(step: AnalysisStep, context: ProcessingContext): Promise<void> {
    const { operation, field, period, outputField } = step.parameters;
    
    const results = [];
    
    for (let i = 0; i < context.data.length; i++) {
      const candle = context.data[i];
      let calculatedValue: number | null = null;
      
      switch (operation) {
        case 'sma': // Simple Moving Average
          calculatedValue = this.calculateSMA(context.data, i, field, period);
          break;
        case 'ema': // Exponential Moving Average
          calculatedValue = this.calculateEMA(context.data, i, field, period);
          break;
        case 'rsi': // Relative Strength Index
          calculatedValue = this.calculateRSI(context.data, i, period);
          break;
        case 'macd': // MACD
          calculatedValue = this.calculateMACD(context.data, i, step.parameters);
          break;
        case 'bollinger': // Bollinger Bands
          calculatedValue = this.calculateBollingerBands(context.data, i, field, period, step.parameters.stdDev || 2);
          break;
        case 'volume_avg': // Volume Average
          calculatedValue = this.calculateSMA(context.data, i, 'volume', period);
          break;
        case 'price_change': // Price Change %
          calculatedValue = this.calculatePriceChange(context.data, i, field, period);
          break;
        default:
          throw new Error(`Unknown calculation operation: ${operation}`);
      }
      
      const resultCandle = { ...candle };
      if (outputField && calculatedValue !== null) {
        resultCandle[outputField] = calculatedValue;
      }
      
      results.push(resultCandle);
    }
    
    context.data = results;
    console.log(`📈 Calculation '${operation}' applied to ${results.length} records`);
  }

  /**
   * AGGREGATE: Aggregate data into summaries
   */
  private async executeAggregation(step: AnalysisStep, context: ProcessingContext): Promise<void> {
    const { operation, field, groupBy, outputField } = step.parameters;
    
    let result: any;
    
    switch (operation) {
      case 'sum':
        result = context.data.reduce((sum, candle) => sum + this.getFieldValue(candle, field), 0);
        break;
      case 'average':
        result = context.data.reduce((sum, candle) => sum + this.getFieldValue(candle, field), 0) / context.data.length;
        break;
      case 'min':
        result = Math.min(...context.data.map(candle => this.getFieldValue(candle, field)));
        break;
      case 'max':
        result = Math.max(...context.data.map(candle => this.getFieldValue(candle, field)));
        break;
      case 'count':
        result = context.data.length;
        break;
      case 'group':
        result = this.groupData(context.data, groupBy, field, operation);
        break;
      default:
        throw new Error(`Unknown aggregation operation: ${operation}`);
    }
    
    if (step.output) {
      context.variables[step.output] = result;
    }
    
    // Replace data with aggregated result if specified
    if (outputField === 'replace') {
      context.data = [{ [field]: result, timestamp: Date.now() / 1000 }];
    }
    
    console.log(`📊 Aggregation '${operation}' completed: ${JSON.stringify(result).substring(0, 100)}...`);
  }

  /**
   * TRANSFORM: Transform data structure or values
   */
  private async executeTransformation(step: AnalysisStep, context: ProcessingContext): Promise<void> {
    const { operation, mapping, outputFormat } = step.parameters;
    
    switch (operation) {
      case 'normalize':
        context.data = this.normalizeData(context.data, step.parameters);
        break;
      case 'map_fields':
        context.data = context.data.map(candle => this.mapFields(candle, mapping));
        break;
      case 'pivot':
        context.data = this.pivotData(context.data, step.parameters);
        break;
      case 'flatten':
        context.data = this.flattenData(context.data);
        break;
      case 'sort':
        context.data = this.sortData(context.data, step.parameters);
        break;
      default:
        throw new Error(`Unknown transformation operation: ${operation}`);
    }
    
    console.log(`🔄 Transformation '${operation}' applied to ${context.data.length} records`);
  }

  /**
   * CONDITION: Apply conditional logic
   */
  private async executeCondition(step: AnalysisStep, context: ProcessingContext): Promise<void> {
    const { condition, trueAction, falseAction } = step.parameters;
    
    const conditionResult = this.evaluateComplexCondition(condition, context);
    const actionToExecute = conditionResult ? trueAction : falseAction;
    
    if (actionToExecute) {
      await this.executeStep(actionToExecute, context);
    }
    
    if (step.output) {
      context.variables[step.output] = conditionResult;
    }
    
    console.log(`🔀 Condition evaluated: ${conditionResult}, executed: ${actionToExecute?.name || 'none'}`);
  }

  /**
   * PATTERN: Detect patterns in the data
   */
  private async executePatternDetection(step: AnalysisStep, context: ProcessingContext): Promise<void> {
    const { pattern, parameters } = step.parameters;
    
    let patternResults: any[] = [];
    
    switch (pattern) {
      case 'candlestick_patterns':
        patternResults = this.detectCandlestickPatterns(context.data, parameters);
        break;
      case 'trend_detection':
        patternResults = this.detectTrends(context.data, parameters);
        break;
      case 'support_resistance':
        patternResults = this.detectSupportResistance(context.data, parameters);
        break;
      case 'breakout':
        patternResults = this.detectBreakouts(context.data, parameters);
        break;
      case 'divergence':
        patternResults = this.detectDivergence(context.data, parameters);
        break;
      default:
        throw new Error(`Unknown pattern type: ${pattern}`);
    }
    
    if (step.output) {
      context.variables[step.output] = patternResults;
    }
    
    // Add pattern results to data
    context.data = context.data.map((candle, index) => ({
      ...candle,
      patterns: patternResults.filter(p => p.index === index)
    }));
    
    console.log(`🎯 Pattern '${pattern}' detection completed: ${patternResults.length} patterns found`);
  }

  // Helper Methods
  private getFieldValue(candle: any, field: string): number {
    const parts = field.split('.');
    let value = candle;
    for (const part of parts) {
      value = value?.[part];
    }
    return typeof value === 'number' ? value : 0;
  }

  private evaluateCondition(fieldValue: number, operator: string, value: number): boolean {
    switch (operator) {
      case '>': return fieldValue > value;
      case '<': return fieldValue < value;
      case '>=': return fieldValue >= value;
      case '<=': return fieldValue <= value;
      case '==': return fieldValue === value;
      case '!=': return fieldValue !== value;
      default: return false;
    }
  }

  private evaluateComplexCondition(condition: any, context: ProcessingContext): boolean {
    // Implement complex condition evaluation logic
    // This is a simplified version - you can expand based on needs
    return true;
  }

  // Technical Analysis Calculations
  private calculateSMA(data: any[], currentIndex: number, field: string, period: number): number | null {
    if (currentIndex < period - 1) return null;
    
    let sum = 0;
    for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
      sum += this.getFieldValue(data[i], field);
    }
    return sum / period;
  }

  private calculateEMA(data: any[], currentIndex: number, field: string, period: number): number | null {
    if (currentIndex < period - 1) return null;
    
    const k = 2 / (period + 1);
    const prices = data.slice(0, currentIndex + 1).map(item => this.getFieldValue(item, field));
    
    if (prices.length < period) return null;
    
    // First EMA value is simple average of first 'period' values
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    let ema = sum / period;
    
    // Calculate EMA for the rest
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  }

  private calculateRSI(data: any[], currentIndex: number, period: number = 14): number | null {
    if (currentIndex < period) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
      const change = data[i].close - data[i - 1]?.close || 0;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(data: any[], currentIndex: number, params: any): number | null {
    const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = params;
    
    const fastEMA = this.calculateEMA(data, currentIndex, 'close', fastPeriod);
    const slowEMA = this.calculateEMA(data, currentIndex, 'close', slowPeriod);
    
    if (fastEMA === null || slowEMA === null) return null;
    return fastEMA - slowEMA;
  }

  private calculateBollingerBands(data: any[], currentIndex: number, field: string, period: number, stdDev: number): any {
    const sma = this.calculateSMA(data, currentIndex, field, period);
    if (sma === null) return null;
    
    // Calculate standard deviation
    let variance = 0;
    for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
      const diff = this.getFieldValue(data[i], field) - sma;
      variance += diff * diff;
    }
    const stdDeviation = Math.sqrt(variance / period);
    
    return {
      middle: sma,
      upper: sma + (stdDeviation * stdDev),
      lower: sma - (stdDeviation * stdDev)
    };
  }

  private calculatePriceChange(data: any[], currentIndex: number, field: string, period: number): number | null {
    if (currentIndex < period) return null;
    
    const currentValue = this.getFieldValue(data[currentIndex], field);
    const previousValue = this.getFieldValue(data[currentIndex - period], field);
    
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  // Data transformation methods
  private normalizeData(data: any[], params: any): any[] {
    // Implement normalization logic
    return data;
  }

  private mapFields(candle: any, mapping: Record<string, string>): any {
    const mapped: any = {};
    for (const [oldField, newField] of Object.entries(mapping)) {
      mapped[newField] = candle[oldField];
    }
    return { ...candle, ...mapped };
  }

  private pivotData(data: any[], params: any): any[] {
    // Implement pivot logic
    return data;
  }

  private flattenData(data: any[]): any[] {
    // Implement flatten logic
    return data;
  }

  private sortData(data: any[], params: any): any[] {
    const { field, direction = 'asc' } = params;
    return data.sort((a, b) => {
      const aVal = this.getFieldValue(a, field);
      const bVal = this.getFieldValue(b, field);
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  private groupData(data: any[], groupBy: string, field: string, operation: string): any {
    // Implement grouping logic
    return {};
  }

  // Pattern detection methods
  private detectCandlestickPatterns(data: any[], params: any): any[] {
    const patterns: any[] = [];
    
    // Example: Detect Doji patterns
    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const totalRange = candle.high - candle.low;
      
      if (bodySize / totalRange < 0.1) { // Doji threshold
        patterns.push({
          index: i,
          pattern: 'doji',
          confidence: 1 - (bodySize / totalRange),
          timestamp: candle.timestamp
        });
      }
    }
    
    return patterns;
  }

  private detectTrends(data: any[], params: any): any[] {
    // Implement trend detection
    return [];
  }

  private detectSupportResistance(data: any[], params: any): any[] {
    // Implement support/resistance detection
    return [];
  }

  private detectBreakouts(data: any[], params: any): any[] {
    // Implement breakout detection
    return [];
  }

  private detectDivergence(data: any[], params: any): any[] {
    // Implement divergence detection
    return [];
  }
}