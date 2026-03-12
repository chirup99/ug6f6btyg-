#!/usr/bin/env node

/**
 * Point A/B Analysis Demo for Dynamic Block Rotation
 * Demonstrates how to find Point A and Point B for NEW C1 and NEW C2 blocks
 * after dynamic block rotation with dual validation requirements
 */

console.log('🔍 POINT A/B ANALYSIS FOR NEW BLOCKS - TODAY\'S NIFTY DATA');
console.log('==================================================================');

// Simulate current block structure before rotation
const currentBlocks = {
  C1: {
    name: 'C1 BLOCK',
    candles: [
      { timestamp: '09:15:00', high: 24889.2, low: 24782.45, close: 24850.5 },
      { timestamp: '09:20:00', high: 24870.1, low: 24720.3, close: 24750.8 }
    ],
    count: 2
  },
  C2: {
    name: 'C2 BLOCK', 
    candles: [
      { timestamp: '09:25:00', high: 24780.5, low: 24646.6, close: 24680.9 },
      { timestamp: '09:30:00', high: 24720.3, low: 24650.2, close: 24700.1 }
    ],
    count: 2
  },
  C3: {
    name: 'C3 BLOCK',
    candles: [
      { timestamp: '09:35:00', high: 24750.8, low: 24680.9, close: 24720.5 },
      { timestamp: '09:40:00', high: 24780.2, low: 24700.1, close: 24750.3 }
    ],
    count: 2
  }
};

console.log('📊 CURRENT BLOCK STRUCTURE (Before Rotation):');
console.log('C1 BLOCK count:', currentBlocks.C1.count);
console.log('C2 BLOCK count:', currentBlocks.C2.count);
console.log('C3 BLOCK count:', currentBlocks.C3.count);
console.log();

// Check dual validation requirements
const rotationCondition = currentBlocks.C1.count === currentBlocks.C2.count;
const equalCountCondition = currentBlocks.C2.count === currentBlocks.C3.count;

console.log('🔍 DUAL VALIDATION CHECK:');
console.log(`Rotation Condition: count(C1) == count(C2) ? ${currentBlocks.C1.count} == ${currentBlocks.C2.count} = ${rotationCondition}`);
console.log(`Equal Count Validation: count(C2) == count(C3) ? ${currentBlocks.C2.count} == ${currentBlocks.C3.count} = ${equalCountCondition}`);
console.log();

if (rotationCondition && equalCountCondition) {
  console.log('✅ BOTH CONDITIONS SATISFIED - APPLYING DYNAMIC BLOCK ROTATION');
  console.log();
  
  // Apply rotation: NEW C1 = old(C1+C2), NEW C2 = old(C3)
  const newBlocks = {
    C1: {
      name: 'NEW C1 BLOCK (old C1+C2)',
      candles: [...currentBlocks.C1.candles, ...currentBlocks.C2.candles],
      count: currentBlocks.C1.count + currentBlocks.C2.count
    },
    C2: {
      name: 'NEW C2 BLOCK (old C3)',
      candles: [...currentBlocks.C3.candles],
      count: currentBlocks.C3.count
    }
  };
  
  console.log('🔄 NEW BLOCK STRUCTURE (After Rotation):');
  console.log(`NEW C1 BLOCK: ${newBlocks.C1.count} candles (${newBlocks.C1.candles[0].timestamp} - ${newBlocks.C1.candles[newBlocks.C1.count-1].timestamp})`);
  console.log(`NEW C2 BLOCK: ${newBlocks.C2.count} candles (${newBlocks.C2.candles[0].timestamp} - ${newBlocks.C2.candles[newBlocks.C2.count-1].timestamp})`);
  console.log();
  
  // Apply C1A/C1B division for NEW C1 BLOCK
  const c1Mid = Math.ceil(newBlocks.C1.count / 2);
  const c1A = newBlocks.C1.candles.slice(0, c1Mid);
  const c1B = newBlocks.C1.candles.slice(c1Mid);
  
  console.log('📊 NEW C1 BLOCK DIVISION:');
  console.log(`C1A = candles [1,${c1Mid}]: ${c1A[0].timestamp} - ${c1A[c1A.length-1].timestamp}`);
  console.log(`C1B = candles [${c1Mid+1},${newBlocks.C1.count}]: ${c1B[0].timestamp} - ${c1B[c1B.length-1].timestamp}`);
  console.log();
  
  // Apply C2A/C2B division for NEW C2 BLOCK
  const c2Mid = Math.ceil(newBlocks.C2.count / 2);
  const c2A = newBlocks.C2.candles.slice(0, c2Mid);
  const c2B = newBlocks.C2.candles.slice(c2Mid);
  
  console.log('📊 NEW C2 BLOCK DIVISION (C2A/C2B Structure):');
  console.log(`C2A = candles [1,${c2Mid}]: ${c2A[0].timestamp} - ${c2A[c2A.length-1].timestamp}`);
  console.log(`C2B = candles [${c2Mid+1},${newBlocks.C2.count}]: ${c2B[0].timestamp} - ${c2B[c2B.length-1].timestamp}`);
  console.log();
  
  // Find Point A and Point B for NEW BLOCKS
  console.log('🎯 POINT A/B IDENTIFICATION FOR NEW BLOCKS:');
  console.log('==================================================');
  
  // Method 1: C1A vs C1B analysis for Point A
  const c1AHigh = Math.max(...c1A.map(c => c.high));
  const c1ALow = Math.min(...c1A.map(c => c.low));
  const c1BHigh = Math.max(...c1B.map(c => c.high));
  const c1BLow = Math.min(...c1B.map(c => c.low));
  
  console.log('📈 C1 BLOCK ANALYSIS:');
  console.log(`C1A: High=${c1AHigh}, Low=${c1ALow}`);
  console.log(`C1B: High=${c1BHigh}, Low=${c1BLow}`);
  
  let pointA, pointASource;
  if (c1AHigh > c1BHigh) {
    pointA = { price: c1AHigh, type: 'HIGH', timestamp: c1A.find(c => c.high === c1AHigh).timestamp };
    pointASource = 'C1A';
  } else {
    pointA = { price: c1BHigh, type: 'HIGH', timestamp: c1B.find(c => c.high === c1BHigh).timestamp };
    pointASource = 'C1B';
  }
  
  console.log(`🎯 POINT A: ${pointA.price} (${pointA.type}) at ${pointA.timestamp} from ${pointASource}`);
  console.log();
  
  // Method 2: C2A vs C2B analysis for Point B
  const c2AHigh = Math.max(...c2A.map(c => c.high));
  const c2ALow = Math.min(...c2A.map(c => c.low));
  const c2BHigh = Math.max(...c2B.map(c => c.high));
  const c2BLow = Math.min(...c2B.map(c => c.low));
  
  console.log('📈 C2 BLOCK ANALYSIS:');
  console.log(`C2A: High=${c2AHigh}, Low=${c2ALow}`);
  console.log(`C2B: High=${c2BHigh}, Low=${c2BLow}`);
  
  let pointB, pointBSource;
  if (c2ALow < c2BLow) {
    pointB = { price: c2ALow, type: 'LOW', timestamp: c2A.find(c => c.low === c2ALow).timestamp };
    pointBSource = 'C2A';
  } else {
    pointB = { price: c2BLow, type: 'LOW', timestamp: c2B.find(c => c.low === c2BLow).timestamp };
    pointBSource = 'C2B';
  }
  
  console.log(`🎯 POINT B: ${pointB.price} (${pointB.type}) at ${pointB.timestamp} from ${pointBSource}`);
  console.log();
  
  // Calculate slope between Point A and Point B
  const timeA = new Date(`2025-01-28 ${pointA.timestamp}`);
  const timeB = new Date(`2025-01-28 ${pointB.timestamp}`);
  const timeDiffMinutes = Math.abs(timeB - timeA) / (1000 * 60);
  const slope = (pointB.price - pointA.price) / timeDiffMinutes;
  
  console.log('📐 SLOPE CALCULATION FOR NEW BLOCKS:');
  console.log(`Point A: ${pointA.price} at ${pointA.timestamp}`);
  console.log(`Point B: ${pointB.price} at ${pointB.timestamp}`);
  console.log(`Time Duration: ${timeDiffMinutes} minutes`);
  console.log(`Slope: (${pointB.price} - ${pointA.price}) / ${timeDiffMinutes} = ${slope.toFixed(3)} points/minute`);
  console.log();
  
  // Determine trend direction
  const trendDirection = slope > 0 ? 'UPTREND' : 'DOWNTREND';
  console.log(`📊 TREND ANALYSIS: ${trendDirection} (${slope.toFixed(3)} points/minute)`);
  console.log();
  
  console.log('🚀 READY FOR NEW C3 BLOCK PREDICTION');
  console.log('Using NEW C1 BLOCK (C1A+C1B) and NEW C2 BLOCK (C2A+C2B) to predict NEW C3 BLOCK');
  
} else {
  const failureReason = !rotationCondition 
    ? `count(C1) ${currentBlocks.C1.count} != count(C2) ${currentBlocks.C2.count}` 
    : `count(C2) ${currentBlocks.C2.count} != count(C3) ${currentBlocks.C3.count}`;
  
  console.log('❌ ROTATION CONDITIONS NOT MET');
  console.log('Failure Reason:', failureReason);
  console.log('Continue with existing C1/C2 blocks for next cycle');
}

console.log();
console.log('==================================================================');
console.log('✅ POINT A/B ANALYSIS COMPLETE FOR NEW BLOCKS');