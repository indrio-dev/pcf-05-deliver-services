/**
 * Produce Inference Examples - SHARE Pillar Format
 *
 * Every data point maps to a SHARE pillar:
 *   S (Soil)       - Origin → region → soil type
 *   H (Heritage)   - Trade name/PLU → cultivar → genetic ceiling
 *   A (Agricultural) - PLU prefix → organic/conventional → pest management
 *   R (Ripen)      - Scan date + origin → season + days since harvest
 *   E (Enrich)     - Brix measurement OR cultivar expected range
 */

import {
  inferProduceProfile,
  predictProduceFromScan,
  getShareProfileFromScan,
} from '../lib/prediction/produce-claim-to-prediction'
import type { ShareProfile } from '../lib/types/share-pillar-attributes'

describe('Produce Inference Examples (SHARE Format)', () => {

  it('EXAMPLE: SUMO Orange - All SHARE Pillars from Consumer Scan', () => {
    const result = predictProduceFromScan({
      tradeName: 'SUMO',
      pluCode: '3286',
      originSticker: 'Product of California',
      storeLocation: { city: 'Chicago', state: 'IL' },
      scanDate: new Date('2025-02-15'),
    })

    console.log('\n' + '='.repeat(65))
    console.log(' SUMO Orange Scanned at Grocery Store')
    console.log(' Input: PLU 3286, "SUMO" sticker, "Product of California"')
    console.log('='.repeat(65))

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ S (SOIL) - Foundation                                          │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Origin:', result.inference.originRegion?.padEnd(53) + '│')
    console.log('│ Soil Type:', (result.inference.soil.soilType || 'Unknown').toString().padEnd(50) + '│')
    console.log('│ Drainage:', (result.inference.soil.drainage || 'Unknown').toString().padEnd(51) + '│')
    console.log('│ Terroir:', (result.inference.soil.terroirEffect || 'Unknown').toString().substring(0, 50).padEnd(52) + '│')
    console.log('│ Confidence:', result.inference.soil.confidence.toString().padEnd(49) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ H (HERITAGE) - Genetic Ceiling                                  │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Trade Name: SUMO                                               │')
    console.log('│ Cultivar:', (result.inference.cultivarName || 'Unknown').padEnd(51) + '│')
    console.log('│ Cultivar ID:', (result.inference.cultivarId || 'Unknown').padEnd(48) + '│')
    console.log('│ Non-GMO:', result.inference.isNonGmo.toString().padEnd(52) + '│')
    console.log('│ Confidence:', result.inference.heritage.confidence.padEnd(49) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ A (AGRICULTURAL) - Practices                                    │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Organic:', result.inference.isOrganic.toString().padEnd(52) + '│')
    console.log('│ Pest Management:', (result.inference.agricultural.pestManagement || 'Unknown').padEnd(44) + '│')
    console.log('│ Reasoning:', result.inference.agricultural.reasoning.substring(0, 50).padEnd(50) + '│')
    console.log('│ Confidence:', result.inference.agricultural.confidence.padEnd(49) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ R (RIPEN) - Timing                                              │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ In Season:', result.inference.isInSeason.toString().padEnd(50) + '│')
    console.log('│ Days Since Harvest:', (result.inference.estimatedDaysSinceHarvest?.toString() || '?').padEnd(41) + '│')
    console.log('│ Freshness:', (result.inference.timing.freshnessScore || 'Unknown').padEnd(50) + '│')
    console.log('│ Confidence:', result.inference.timing.confidence.padEnd(49) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ E (ENRICH) - Quality Proof                                      │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    const brixRange = result.inference.expectedBrixRange
    console.log('│ Expected Brix:', (brixRange ? `${brixRange.min}-${brixRange.max}` : 'Unknown').padEnd(46) + '│')
    console.log('│ Optimal Brix:', (brixRange?.optimal?.toString() || 'Unknown').padEnd(47) + '│')
    console.log('│ Actual Brix:', (result.inference.quality.brixEstimate?.toString() || 'Not measured').padEnd(48) + '│')
    console.log('│ Source:', (result.inference.quality.source || 'Unknown').padEnd(53) + '│')
    console.log('│ Confidence:', result.inference.quality.confidence.padEnd(49) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('')

    // Assertions
    expect(result.inference.cultivarId).toBe('shiranui')
    expect(result.inference.isInSeason).toBe(true)
  })

  it('EXAMPLE: Consumer Measures Brix - E Pillar Gets Actual Data', () => {
    const result = predictProduceFromScan({
      tradeName: 'Honeycrisp',
      originSticker: 'Washington',
      scanDate: new Date('2025-10-01'),
      brixMeasurement: 15.2,
      measurementMethod: 'refractometer',
    })

    console.log('\n' + '='.repeat(65))
    console.log(' Honeycrisp Apple WITH Refractometer Measurement')
    console.log(' Consumer measured 15.2 Brix')
    console.log('='.repeat(65))

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ S (SOIL)                                                        │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Origin:', (result.inference.originRegion || 'Unknown').padEnd(53) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ H (HERITAGE)                                                    │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Trade Name: Honeycrisp                                         │')
    console.log('│ Cultivar:', (result.inference.cultivarName || 'Unknown').padEnd(51) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ A (AGRICULTURAL)                                                │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Organic:', result.inference.isOrganic.toString().padEnd(52) + '│')
    console.log('│ Pest Management:', (result.inference.agricultural.pestManagement || 'Unknown').padEnd(44) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ R (RIPEN)                                                       │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ In Season:', result.inference.isInSeason.toString().padEnd(50) + '│')
    console.log('│ Freshness:', (result.inference.timing.freshnessScore || 'Unknown').padEnd(50) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ E (ENRICH) ★ ACTUAL MEASUREMENT ★                              │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    const brixRange = result.inference.expectedBrixRange
    console.log('│ Expected Brix Range:', (brixRange ? `${brixRange.min}-${brixRange.max}` : 'Unknown').padEnd(40) + '│')
    console.log('│ ★ ACTUAL BRIX:', result.inference.quality.brixEstimate?.toString().padEnd(45) + '│')
    console.log('│ Measurement Method:', (result.inference.quality.source || 'Unknown').padEnd(41) + '│')
    console.log('│ Quality Score:', (result.inference.quality.qualityScore || 'Unknown').padEnd(46) + '│')
    console.log('│ Confidence:', result.inference.quality.confidence.padEnd(49) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n💡 DATA FLYWHEEL: E pillar now has ACTUAL measurement!')
    console.log('   Cultivar (H) + Region (S) + Season (R) + Actual Brix (E)')
    console.log('   = Unreplicable prediction→measurement pair')
    console.log('')

    // Assertions
    expect(result.inference.quality.brixEstimate).toBe(15.2)
    expect(result.inference.quality.source).toBe('refractometer')
    expect(result.prediction?.enrich?.actualBrix).toBe(15.2)
  })

  it('EXAMPLE: Indian River vs Lake Wales Ridge - Same State, Different S Pillar', () => {
    const indianRiver = inferProduceProfile({
      pluCode: '4012',
      originSticker: 'Indian River, Florida',
      scanDate: new Date('2025-01-15'),
    })

    const lakeWales = inferProduceProfile({
      pluCode: '4012',
      originSticker: 'Lake Wales, Florida',
      scanDate: new Date('2025-01-15'),
    })

    console.log('\n' + '='.repeat(65))
    console.log(' Same Product, Different S (Soil) Pillar')
    console.log(' Both: PLU 4012 (Navel Orange), January 2025')
    console.log('='.repeat(65))

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ INDIAN RIVER - S (SOIL) PILLAR                                  │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Region:', (indianRiver.originRegion || 'Unknown').padEnd(53) + '│')
    console.log('│ Soil Type:', (indianRiver.soil.soilType || 'Unknown').toString().padEnd(50) + '│')
    console.log('│ Drainage:', (indianRiver.soil.drainage || 'Unknown').toString().padEnd(51) + '│')
    console.log('│ Terroir:', (indianRiver.soil.terroirEffect || 'Unknown').toString().substring(0, 50).padEnd(52) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ LAKE WALES RIDGE - S (SOIL) PILLAR                              │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Region:', (lakeWales.originRegion || 'Unknown').padEnd(53) + '│')
    console.log('│ Soil Type:', (lakeWales.soil.soilType || 'Unknown').toString().padEnd(50) + '│')
    console.log('│ Drainage:', (lakeWales.soil.drainage || 'Unknown').toString().padEnd(51) + '│')
    console.log('│ Terroir:', (lakeWales.soil.terroirEffect || 'Unknown').toString().substring(0, 50).padEnd(52) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n💡 KEY INSIGHT:')
    console.log('   Indian River = coastal flatwoods (famous brand, moderate drainage)')
    console.log('   Lake Wales Ridge = interior Ridge (deep sandy, excellent drainage)')
    console.log('   Same state, different S pillar, different quality potential')
    console.log('')

    // Indian River should be indian_river zone, not ridge
    expect(indianRiver.soil.soilType).toContain('flatwoods')
  })

  it('EXAMPLE: Organic vs Conventional - A Pillar Difference', () => {
    const organic = inferProduceProfile({
      pluCode: '94012',  // Prefix 9 = organic
      originSticker: 'California',
    })

    const conventional = inferProduceProfile({
      pluCode: '4012',   // No prefix = conventional
      originSticker: 'California',
    })

    console.log('\n' + '='.repeat(65))
    console.log(' Organic vs Conventional - A (Agricultural) Pillar')
    console.log(' Same product (Navel Orange), same origin (California)')
    console.log('='.repeat(65))

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ ORGANIC (PLU 94012) - A (AGRICULTURAL) PILLAR                   │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Organic:', organic.isOrganic.toString().padEnd(52) + '│')
    console.log('│ Pest Management:', (organic.agricultural.pestManagement || 'Unknown').padEnd(44) + '│')
    console.log('│ Non-GMO (via H):', organic.isNonGmo.toString().padEnd(44) + '│')
    console.log('│ Reasoning:', organic.agricultural.reasoning.substring(0, 50).padEnd(50) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ CONVENTIONAL (PLU 4012) - A (AGRICULTURAL) PILLAR               │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ Organic:', conventional.isOrganic.toString().padEnd(52) + '│')
    console.log('│ Pest Management:', (conventional.agricultural.pestManagement || 'Unknown').padEnd(44) + '│')
    console.log('│ Non-GMO (via H):', conventional.isNonGmo.toString().padEnd(44) + '│')
    console.log('│ Reasoning:', conventional.agricultural.reasoning.substring(0, 50).padEnd(50) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    console.log('\n💡 KEY INSIGHT:')
    console.log('   Organic = A pillar attribute (pest management: organic)')
    console.log('   Organic → Non-GMO = H pillar implication (regulatory requirement)')
    console.log('   Pesticides NOT deleterious to nutrition (separate axis from E)')
    console.log('')

    expect(organic.isOrganic).toBe(true)
    expect(organic.agricultural.pestManagement).toBe('organic')
    expect(conventional.isOrganic).toBe(false)
    expect(conventional.agricultural.pestManagement).toBe('ipm')
  })

  it('EXAMPLE: Typed ShareProfile - Clean Attribute Access', () => {
    // Use getShareProfileFromScan for typed attribute access
    const profile: ShareProfile = getShareProfileFromScan({
      tradeName: 'SUMO',
      pluCode: '3286',
      originSticker: 'Product of California',
      scanDate: new Date('2025-02-15'),
      brixMeasurement: 14.8,
      measurementMethod: 'refractometer',
    })

    console.log('\n' + '='.repeat(65))
    console.log(' TYPED ShareProfile - Clean Pillar Attribute Access')
    console.log('='.repeat(65))

    // S - Soil Health
    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ S (Soil Health)                                                 │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ profile.soilHealth.pillar:', profile.soilHealth.pillar.padEnd(35) + '│')
    console.log('│ profile.soilHealth.regionId:', (profile.soilHealth.regionId).padEnd(33) + '│')
    console.log('│ profile.soilHealth.regionName:', (profile.soilHealth.regionName).padEnd(31) + '│')
    console.log('│ profile.soilHealth.drainage:', (profile.soilHealth.drainage).padEnd(33) + '│')
    console.log('│ profile.soilHealth.qualityIndicator:', (profile.soilHealth.qualityIndicator).padEnd(24) + '│')
    console.log('│ profile.soilHealth.confidence:', (profile.soilHealth.confidence).padEnd(31) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    // H - Heritage Cultivars
    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ H (Heritage Cultivars)                                          │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ profile.heritageCultivars.pillar:', profile.heritageCultivars.pillar.padEnd(28) + '│')
    console.log('│ profile.heritageCultivars.productType:', (profile.heritageCultivars.productType).padEnd(23) + '│')
    console.log('│ profile.heritageCultivars.cultivarId:', (profile.heritageCultivars.cultivarId || '').padEnd(24) + '│')
    console.log('│ profile.heritageCultivars.cultivarName:', (profile.heritageCultivars.cultivarName || '').padEnd(22) + '│')
    console.log('│ profile.heritageCultivars.geneticCeiling.brixMax:', (profile.heritageCultivars.geneticCeiling?.brixMax?.toString() || '').padEnd(12) + '│')
    console.log('│ profile.heritageCultivars.isNonGmo:', (profile.heritageCultivars.isNonGmo?.toString() || '').padEnd(26) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    // A - Agricultural Practices
    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ A (Agricultural Practices)                                      │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ profile.agriculturalPractices.pillar:', profile.agriculturalPractices.pillar.padEnd(24) + '│')
    console.log('│ profile.agriculturalPractices.isOrganic:', (profile.agriculturalPractices.isOrganic.toString()).padEnd(21) + '│')
    console.log('│ profile.agriculturalPractices.pestManagement:', (profile.agriculturalPractices.pestManagement || '').padEnd(16) + '│')
    console.log('│ profile.agriculturalPractices.ipmProbability:', (profile.agriculturalPractices.ipmProbability?.toFixed(2) || 'N/A').padEnd(16) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    // R - Ripen
    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ R (Ripen)                                                       │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ profile.ripen.pillar:', profile.ripen.pillar.padEnd(40) + '│')
    console.log('│ profile.ripen.isInSeason:', (profile.ripen.isInSeason.toString()).padEnd(36) + '│')
    console.log('│ profile.ripen.season:', (profile.ripen.season || '').padEnd(40) + '│')
    console.log('│ profile.ripen.estimatedDaysSinceHarvest:', (profile.ripen.estimatedDaysSinceHarvest?.toString() || '').padEnd(20) + '│')
    console.log('│ profile.ripen.freshnessScore:', (profile.ripen.freshnessScore).padEnd(32) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    // E - Enrich
    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ E (Enrich)                                                      │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ profile.enrich.pillar:', profile.enrich.pillar.padEnd(39) + '│')
    console.log('│ profile.enrich.brixMeasurement:', (profile.enrich.brixMeasurement?.toString() || '').padEnd(30) + '│')
    console.log('│ profile.enrich.brixEstimate:', (profile.enrich.brixEstimate?.toString() || '').padEnd(33) + '│')
    console.log('│ profile.enrich.brixRange:', (profile.enrich.brixRange ? `${profile.enrich.brixRange.min}-${profile.enrich.brixRange.max}` : '').padEnd(36) + '│')
    console.log('│ profile.enrich.qualityScore:', (profile.enrich.qualityScore).padEnd(33) + '│')
    console.log('│ profile.enrich.measurementMethod:', (profile.enrich.measurementMethod || '').padEnd(28) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')

    // Overall
    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│ OVERALL                                                         │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    console.log('│ profile.overallConfidence:', (profile.overallConfidence).padEnd(35) + '│')
    console.log('│ profile.overallQualityTier:', (profile.overallQualityTier || 'unknown').padEnd(34) + '│')
    console.log('└─────────────────────────────────────────────────────────────────┘')
    console.log('')

    // Assertions
    expect(profile.soilHealth.pillar).toBe('S')
    expect(profile.heritageCultivars.pillar).toBe('H')
    expect(profile.agriculturalPractices.pillar).toBe('A')
    expect(profile.ripen.pillar).toBe('R')
    expect(profile.enrich.pillar).toBe('E')
    expect(profile.heritageCultivars.cultivarId).toBe('shiranui')
    expect(profile.enrich.brixMeasurement).toBe(14.8)
    expect(profile.enrich.measurementMethod).toBe('refractometer')
  })
})
