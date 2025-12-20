/**
 * Produce Inference Demo
 *
 * Run with: npx ts-node --transpile-only examples/produce-inference-demo.ts
 */

import {
  inferProduceProfile,
  predictProduceFromScan,
} from '../src/lib/prediction/produce-claim-to-prediction'

console.log('='.repeat(70))
console.log('EXAMPLE 1: SUMO Orange at Whole Foods (February)')
console.log('='.repeat(70))

const sumoResult = predictProduceFromScan({
  tradeName: 'SUMO',
  pluCode: '3286',
  originSticker: 'Product of California',
  storeLocation: { city: 'Chicago', state: 'IL' },
  scanDate: new Date('2025-02-15'),
})

console.log('\n📦 PRODUCT IDENTIFICATION:')
console.log('   Product:', sumoResult.inference.productType)
console.log('   Cultivar:', sumoResult.inference.cultivarName, '(' + sumoResult.inference.cultivarId + ')')
console.log('   Category:', sumoResult.inference.category)

console.log('\n🌱 SHARE PILLAR INFERENCE:')
console.log('   H (Heritage):', sumoResult.inference.heritage.reasoning)
console.log('   S (Soil):', sumoResult.inference.soil.reasoning)
console.log('   A (Agricultural):', sumoResult.inference.agricultural.reasoning)
console.log('   R (Ripen):', sumoResult.inference.timing.reasoning)
console.log('   E (Enrich):', sumoResult.inference.quality.reasoning)

console.log('\n📊 QUALITY EXPECTATIONS:')
const brixRange = sumoResult.inference.expectedBrixRange
console.log('   Expected Brix Range:', brixRange ? brixRange.min + '-' + brixRange.max : 'Unknown')
console.log('   Optimal Brix:', brixRange?.optimal)
console.log('   In Season:', sumoResult.inference.isInSeason ? 'Yes ✓' : 'No')
console.log('   Overall Confidence:', sumoResult.inference.overallConfidence)

console.log('\n🔮 CAN PREDICT:', sumoResult.canPredict ? 'Yes' : 'No')
if (sumoResult.prediction) {
  console.log('   Predicted Brix:', sumoResult.prediction.predictedBrix)
  console.log('   Quality Tier:', sumoResult.prediction.predictedTier)
}

console.log('\n' + '='.repeat(70))
console.log('EXAMPLE 2: Organic vs Conventional Navel Orange')
console.log('='.repeat(70))

const organicOrange = inferProduceProfile({
  pluCode: '94012',  // Organic Navel
  originSticker: 'Indian River, Florida',
  scanDate: new Date('2025-01-15'),
})

const conventionalOrange = inferProduceProfile({
  pluCode: '4012',   // Conventional Navel
  originSticker: 'Indian River, Florida',
  scanDate: new Date('2025-01-15'),
})

console.log('\n📊 ORGANIC (PLU 94012):')
console.log('   Is Organic:', organicOrange.isOrganic)
console.log('   Is Non-GMO:', organicOrange.isNonGmo)
console.log('   Pest Management:', organicOrange.agricultural.pestManagement)
console.log('   Soil Zone:', organicOrange.soil.soilType)
console.log('   Terroir:', organicOrange.soil.terroirEffect)

console.log('\n📊 CONVENTIONAL (PLU 4012):')
console.log('   Is Organic:', conventionalOrange.isOrganic)
console.log('   Is Non-GMO:', conventionalOrange.isNonGmo)
console.log('   Pest Management:', conventionalOrange.agricultural.pestManagement)
console.log('   Reasoning:', conventionalOrange.agricultural.reasoning)

console.log('\n💡 KEY INSIGHT: Both have SAME soil (Indian River Ridge)')
console.log('   → Premium citrus terroir regardless of organic status')
console.log('   → Pesticides are NOT deleterious to nutrition (separate axis)')

console.log('\n' + '='.repeat(70))
console.log('EXAMPLE 3: Consumer Measures Brix with Refractometer')
console.log('='.repeat(70))

const withMeasurement = predictProduceFromScan({
  tradeName: 'Honeycrisp',
  originSticker: 'Washington',
  scanDate: new Date('2025-10-01'),
  brixMeasurement: 15.2,  // Consumer measured!
  measurementMethod: 'refractometer',
})

console.log('\n📦 PRODUCT: Honeycrisp Apple from Washington')
const hcRange = withMeasurement.inference.expectedBrixRange
console.log('   Expected Brix Range:', hcRange ? hcRange.min + '-' + hcRange.max : 'Unknown')
console.log('   Actual Measurement:', withMeasurement.inference.quality.brixEstimate, 'Brix')
console.log('   Quality Score:', withMeasurement.inference.quality.qualityScore)
console.log('   Measurement Source:', withMeasurement.inference.quality.source)

if (withMeasurement.prediction) {
  console.log('\n🔮 PREDICTION (with actual measurement):')
  console.log('   Predicted Brix:', withMeasurement.prediction.predictedBrix)
  console.log('   Basis:', withMeasurement.prediction.predictionBasis)
}

console.log('\n💡 DATA FLYWHEEL: Prediction vs Actual now captured!')
console.log('   → This pair becomes unreplicable IP')
console.log('   → Improves future predictions for this cultivar/region/season')

console.log('\n' + '='.repeat(70))
console.log('EXAMPLE 4: GMO Risk Detection')
console.log('='.repeat(70))

const papaya = inferProduceProfile({ pluCode: '4959' })  // Papaya
const orange = inferProduceProfile({ pluCode: '4012' })  // Orange

console.log('\n🧬 PAPAYA (PLU 4959):')
console.log('   GMO Risk:', papaya.isGmoRisk)
console.log('   Non-GMO Status:', papaya.isNonGmo)
console.log('   Heritage:', papaya.heritage.reasoning)

console.log('\n🍊 ORANGE (PLU 4012):')
console.log('   GMO Risk:', orange.isGmoRisk)
console.log('   Non-GMO Status:', orange.isNonGmo)
console.log('   Heritage:', orange.heritage.reasoning)

console.log('\n💡 Only ~10 GMO crops approved in US:')
console.log('   corn, soy, cotton, canola, sugar beet, papaya, squash,')
console.log('   apple (Arctic), potato, salmon')
