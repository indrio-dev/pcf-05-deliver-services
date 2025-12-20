/**
 * SHARE Profile Demo - Typed Pillar Attributes
 *
 * Run with: npx ts-node --transpile-only examples/share-profile-demo.ts
 */

import { getShareProfileFromScan } from '../src/lib/prediction/produce-claim-to-prediction'

// Consumer scans a SUMO orange with their refractometer
const profile = getShareProfileFromScan({
  tradeName: 'SUMO',
  pluCode: '3286',
  originSticker: 'Product of California',
  scanDate: new Date('2025-02-15'),
  brixMeasurement: 14.8,
  measurementMethod: 'refractometer',
})

console.log('='.repeat(65))
console.log('SUMO Orange - Typed ShareProfile')
console.log('='.repeat(65))

console.log('\n┌─────────────────────────────────────────────────────────────────┐')
console.log('│ S (SOIL) - SoilHealthAttributes                                │')
console.log('├─────────────────────────────────────────────────────────────────┤')
console.log('│ pillar:', profile.soilHealth.pillar)
console.log('│ regionId:', profile.soilHealth.regionId)
console.log('│ regionName:', profile.soilHealth.regionName)
console.log('│ drainage:', profile.soilHealth.drainage)
console.log('│ qualityIndicator:', profile.soilHealth.qualityIndicator)
console.log('│ confidence:', profile.soilHealth.confidence)
console.log('└─────────────────────────────────────────────────────────────────┘')

console.log('\n┌─────────────────────────────────────────────────────────────────┐')
console.log('│ H (HERITAGE) - HeritageCultivarsAttributes                     │')
console.log('├─────────────────────────────────────────────────────────────────┤')
console.log('│ pillar:', profile.heritageCultivars.pillar)
console.log('│ productType:', profile.heritageCultivars.productType)
console.log('│ cultivarId:', profile.heritageCultivars.cultivarId)
console.log('│ cultivarName:', profile.heritageCultivars.cultivarName)
console.log('│ geneticCeiling.brixMax:', profile.heritageCultivars.geneticCeiling?.brixMax)
console.log('│ isNonGmo:', profile.heritageCultivars.isNonGmo)
console.log('│ isGmoRisk:', profile.heritageCultivars.isGmoRisk)
console.log('│ confidence:', profile.heritageCultivars.confidence)
console.log('└─────────────────────────────────────────────────────────────────┘')

console.log('\n┌─────────────────────────────────────────────────────────────────┐')
console.log('│ A (AGRICULTURAL) - AgriculturalPracticesAttributes             │')
console.log('├─────────────────────────────────────────────────────────────────┤')
console.log('│ pillar:', profile.agriculturalPractices.pillar)
console.log('│ isOrganic:', profile.agriculturalPractices.isOrganic)
console.log('│ pestManagement:', profile.agriculturalPractices.pestManagement)
console.log('│ ipmProbability:', profile.agriculturalPractices.ipmProbability)
console.log('│ confidence:', profile.agriculturalPractices.confidence)
console.log('└─────────────────────────────────────────────────────────────────┘')

console.log('\n┌─────────────────────────────────────────────────────────────────┐')
console.log('│ R (RIPEN) - RipenAttributes                                     │')
console.log('├─────────────────────────────────────────────────────────────────┤')
console.log('│ pillar:', profile.ripen.pillar)
console.log('│ isInSeason:', profile.ripen.isInSeason)
console.log('│ season:', profile.ripen.season)
console.log('│ estimatedDaysSinceHarvest:', profile.ripen.estimatedDaysSinceHarvest)
console.log('│ freshnessScore:', profile.ripen.freshnessScore)
console.log('│ confidence:', profile.ripen.confidence)
console.log('└─────────────────────────────────────────────────────────────────┘')

console.log('\n┌─────────────────────────────────────────────────────────────────┐')
console.log('│ E (ENRICH) - EnrichAttributes ★ ACTUAL MEASUREMENT              │')
console.log('├─────────────────────────────────────────────────────────────────┤')
console.log('│ pillar:', profile.enrich.pillar)
console.log('│ brixMeasurement:', profile.enrich.brixMeasurement, '★ ACTUAL')
console.log('│ brixEstimate:', profile.enrich.brixEstimate)
console.log('│ brixRange:', profile.enrich.brixRange?.min + '-' + profile.enrich.brixRange?.max)
console.log('│ qualityScore:', profile.enrich.qualityScore)
console.log('│ measurementMethod:', profile.enrich.measurementMethod)
console.log('│ confidence:', profile.enrich.confidence)
console.log('└─────────────────────────────────────────────────────────────────┘')

console.log('\n┌─────────────────────────────────────────────────────────────────┐')
console.log('│ OVERALL ASSESSMENT                                              │')
console.log('├─────────────────────────────────────────────────────────────────┤')
console.log('│ overallConfidence:', profile.overallConfidence)
console.log('│ overallQualityTier:', profile.overallQualityTier)
console.log('│ dataGaps:', profile.dataGaps.length === 0 ? 'None' : profile.dataGaps)
console.log('└─────────────────────────────────────────────────────────────────┘')

console.log('\n' + '='.repeat(65))
console.log('TYPE-SAFE ACCESS EXAMPLES')
console.log('='.repeat(65))
console.log(`
// Each pillar is a typed object:
profile.soilHealth           // SoilHealthAttributes
profile.heritageCultivars    // HeritageCultivarsAttributes
profile.agriculturalPractices // AgriculturalPracticesAttributes
profile.ripen                // RipenAttributes
profile.enrich               // EnrichAttributes

// Common attributes on ALL pillars:
profile.soilHealth.pillar      // 'S'
profile.soilHealth.confidence  // 'high' | 'medium' | 'low'
profile.soilHealth.source      // How data was determined
profile.soilHealth.reasoning   // Human-readable explanation

// Pillar-specific attributes:
profile.heritageCultivars.cultivarId       // 'shiranui'
profile.heritageCultivars.geneticCeiling   // { brixMax: 16 }
profile.enrich.brixMeasurement    // 14.8 (actual refractometer reading)
profile.enrich.measurementMethod  // 'refractometer'
`)
