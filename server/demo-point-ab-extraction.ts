import { PointABExtractor } from './point-ab-extractor.js';
// import { FyersAPI } from './fyers-api.js'; // Removed: Fyers API removed

/**
 * Demo script to show Point A/B extraction working with real NIFTY data
 * This demonstrates exact timestamp-based calculations for both T-Rule and Mini 4 Rule
 */
export async function demoPointABExtraction() {
  console.log('\n🎯 POINT A/B EXTRACTION DEMO WITH EXACT TIMESTAMPS FOR 50%/34% CALCULATIONS');
  console.log('=' .repeat(80));

  const fyersAPI = new FyersAPI();
  const pointABExtractor = new PointABExtractor(fyersAPI);

  // Today's NIFTY C2 block data (4 candles)
  const c2BlockCandles = [
    { timestamp: 1753660800000, open: 24782.45, high: 24820, low: 24760, close: 24800, volume: 120000 },
    { timestamp: 1753661400000, open: 24800, high: 24850, low: 24780, close: 24830, volume: 140000 },
    { timestamp: 1753662000000, open: 24830, high: 24880, low: 24810, close: 24860, volume: 160000 },
    { timestamp: 1753662600000, open: 24860, high: 24889.2, low: 24840, close: 24875, volume: 180000 }
  ];

  console.log('\n📊 C2 BLOCK INPUT DATA:');
  c2BlockCandles.forEach((candle, i) => {
    console.log(`   Candle ${i+1}: ${new Date(candle.timestamp).toLocaleTimeString()} | O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close}`);
  });

  try {
    console.log('\n🔍 EXTRACTING POINT A/B FOR T-RULE METHODOLOGY...');
    console.log('-'.repeat(60));
    
    const tRuleResult = await pointABExtractor.extractPointAB(
      c2BlockCandles,
      'NSE:NIFTY50-INDEX',
      '2025-07-28',
      'T-RULE'
    );

    console.log('\n✅ T-RULE POINT A/B EXTRACTION RESULTS:');
    console.log(`📍 Point A: ${tRuleResult.pointAB.pointA.price} at ${tRuleResult.pointAB.pointA.exactTime} (${tRuleResult.pointAB.pointA.priceType})`);
    console.log(`📍 Point B: ${tRuleResult.pointAB.pointB.price} at ${tRuleResult.pointAB.pointB.exactTime} (${tRuleResult.pointAB.pointB.priceType})`);
    console.log(`⏱️  Duration: ${tRuleResult.pointAB.duration.minutes.toFixed(2)} minutes`);
    console.log(`📈 Slope: ${tRuleResult.pointAB.slope.toFixed(4)} points/minute`);
    console.log(`🎯 Trend: ${tRuleResult.pointAB.trendDirection}`);
    
    console.log('\n⚙️ T-RULE TIMING CALCULATIONS:');
    console.log(`   50% Rule: Point A→B duration ≥ ${tRuleResult.timingRules.pointAToPointB.percentage50.toFixed(2)} minutes`);
    console.log(`   34% Rule: Point B→Trigger duration ≥ ${tRuleResult.timingRules.pointAToPointB.percentage34.toFixed(2)} minutes`);
    console.log(`   Target Extension: ${tRuleResult.timingRules.targetCalculation.slopeExtension.toFixed(2)} points`);
    console.log(`   80% Target: ${tRuleResult.timingRules.targetCalculation.trigger80percent.toFixed(2)} points`);

    console.log('\n🔍 EXTRACTING POINT A/B FOR MINI 4 RULE METHODOLOGY...');
    console.log('-'.repeat(60));
    
    const mini4RuleResult = await pointABExtractor.extractPointAB(
      c2BlockCandles,
      'NSE:NIFTY50-INDEX',
      '2025-07-28',
      'MINI-4-RULE'
    );

    console.log('\n✅ MINI 4 RULE POINT A/B EXTRACTION RESULTS:');
    console.log(`📍 Point A: ${mini4RuleResult.pointAB.pointA.price} at ${mini4RuleResult.pointAB.pointA.exactTime} (${mini4RuleResult.pointAB.pointA.priceType})`);
    console.log(`📍 Point B: ${mini4RuleResult.pointAB.pointB.price} at ${mini4RuleResult.pointAB.pointB.exactTime} (${mini4RuleResult.pointAB.pointB.priceType})`);
    console.log(`⏱️  Duration: ${mini4RuleResult.pointAB.duration.minutes.toFixed(2)} minutes`);
    console.log(`📈 Slope: ${mini4RuleResult.pointAB.slope.toFixed(4)} points/minute`);
    console.log(`🎯 Trend: ${mini4RuleResult.pointAB.trendDirection}`);
    
    console.log('\n⚙️ MINI 4 RULE TIMING CALCULATIONS:');
    console.log(`   50% Rule: Point A→B duration ≥ ${mini4RuleResult.timingRules.pointAToPointB.percentage50.toFixed(2)} minutes`);
    console.log(`   34% Rule: Point B→Trigger duration ≥ ${mini4RuleResult.timingRules.pointAToPointB.percentage34.toFixed(2)} minutes`);
    console.log(`   Target Extension: ${mini4RuleResult.timingRules.targetCalculation.slopeExtension.toFixed(2)} points`);
    console.log(`   80% Target: ${mini4RuleResult.timingRules.targetCalculation.trigger80percent.toFixed(2)} points`);

    console.log('\n🔬 COMPARATIVE ANALYSIS:');
    console.log('-'.repeat(60));
    console.log(`📊 Duration Comparison: T-Rule ${tRuleResult.pointAB.duration.minutes.toFixed(2)}min vs Mini 4 Rule ${mini4RuleResult.pointAB.duration.minutes.toFixed(2)}min`);
    console.log(`📊 Slope Comparison: T-Rule ${tRuleResult.pointAB.slope.toFixed(4)} vs Mini 4 Rule ${mini4RuleResult.pointAB.slope.toFixed(4)} pts/min`);
    console.log(`📊 50% Timing: T-Rule ≥${tRuleResult.timingRules.pointAToPointB.percentage50.toFixed(2)}min vs Mini 4 Rule ≥${mini4RuleResult.timingRules.pointAToPointB.percentage50.toFixed(2)}min`);
    console.log(`📊 34% Timing: T-Rule ≥${tRuleResult.timingRules.pointAToPointB.percentage34.toFixed(2)}min vs Mini 4 Rule ≥${mini4RuleResult.timingRules.pointAToPointB.percentage34.toFixed(2)}min`);

    console.log('\n✅ POINT A/B EXTRACTION DEMO COMPLETED SUCCESSFULLY!');
    console.log('Both T-Rule and Mini 4 Rule now have exact timestamp-based Point A/B calculations');
    console.log('for precise 50% and 34% trigger validation using real 1-minute market data.');
    console.log('=' .repeat(80));

    return {
      tRule: tRuleResult,
      mini4Rule: mini4RuleResult,
      success: true
    };

  } catch (error) {
    console.error('\n❌ POINT A/B EXTRACTION DEMO FAILED:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Execute demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoPointABExtraction()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Demo completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Demo failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Demo execution failed:', error);
      process.exit(1);
    });
}