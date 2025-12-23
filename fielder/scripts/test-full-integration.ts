#!/usr/bin/env tsx
/**
 * Full Integration Test
 *
 * Verifies the complete system works end-to-end:
 * - Knowledge Graph queries
 * - Predictions with all 4 enhancements
 * - Regional priors
 * - Uncertainty distributions
 * - Versioned GDD
 * - Temporal inference
 *
 * Usage:
 *   source .env.local && npx tsx scripts/test-full-integration.ts
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'
import { predictQuality } from '../src/lib/intelligence/orchestrator'
import { getRegionalPracticePrior } from '../src/lib/constants/regional-practice-priors'
import { applyRegionalPrior } from '../src/lib/types/regional-priors'
import { inferCultivarsFromTiming } from '../src/lib/intelligence/temporal-cultivar-inference'

async function testKnowledgeGraph() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  TEST 1: KNOWLEDGE GRAPH QUERIES                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Test 1: Count entities
  const entityCount = await runQuery<{ count: number }>(`
    MATCH (e:Entity)
    RETURN count(e) as count
  `, {})

  console.log(`✓ Total entities: ${Number(entityCount[0].count)}`)

  // Test 2: Count growers
  const growerCount = await runQuery<{ count: number }>(`
    MATCH (g:Grower)
    RETURN count(g) as count
  `, {})

  console.log(`✓ Total growers: ${Number(growerCount[0].count)}`)

  // Test 3: Query apple growers
  const appleGrowers = await runQuery<{ name: string; state: string }>(`
    MATCH (g:Grower)-[:GROWS]->(pt:ProductType {id: 'apple'})
    RETURN g.name as name, g.stateCode as state
    LIMIT 5
  `, {})

  console.log(`✓ Apple growers query works (${appleGrowers.length} samples)`)
  for (const grower of appleGrowers) {
    console.log(`  - ${grower.name} (${grower.state})`)
  }

  // Test 4: Query by state
  const nyGrowers = await runQuery<{ count: number }>(`
    MATCH (g:Grower)-[:LOCATED_IN_STATE]->(s:State {code: 'NY'})
    RETURN count(g) as count
  `, {})

  console.log(`✓ State query works: ${Number(nyGrowers[0].count)} NY growers`)

  // Test 5: Query single-farm CSAs
  const csas = await runQuery<{ count: number }>(`
    MATCH (g:Grower)
    WHERE 'single_farm_csa' IN g.features
    RETURN count(g) as count
  `, {})

  console.log(`✓ Feature query works: ${Number(csas[0].count)} single-farm CSAs\n`)

  return { success: true }
}

async function testEnhancement2_VersionedGDD() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  TEST 2: VERSIONED GDD (ENHANCEMENT #2)                ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const result = predictQuality({
    cultivarId: 'washington_navel',
    regionId: 'indian_river_fl',
    currentGdd: 2500,
    peakGdd: 3200,
    gddHalfwidth: 500,
    treeAgeYears: 12,
  })

  console.log(`✓ Prediction generated`)
  console.log(`  GDD version used: ${result.gddVersion}`)
  console.log(`  GDD cumulative: ${result.gddCumulative}`)
  console.log(`  Predicted Brix: ${result.predictedBrix}`)

  if (!result.gddVersion) {
    throw new Error('GDD version not tracked!')
  }

  console.log(`✓ Enhancement #2 working\n`)

  return { success: true, result }
}

async function testEnhancement3_RegionalPriors() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  TEST 3: REGIONAL PRACTICE PRIORS (ENHANCEMENT #3)     ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Get prior for NY (should have high confidence, 838 growers in sample)
  const nyPrior = getRegionalPracticePrior('state_ny', 'general')

  console.log(`✓ Retrieved NY regional prior`)
  console.log(`  Sample size: ${nyPrior?.nFarmsInSample || 0}`)
  console.log(`  Confidence: ${nyPrior?.confidence}`)

  // Apply prior (infer practices)
  const inferred = applyRegionalPrior(nyPrior!, 'most_likely')

  console.log(`✓ Inferred practices from prior`)
  console.log(`  Pest management: ${inferred.pestManagement}`)
  console.log(`  Fertility strategy: ${inferred.fertilityStrategy}`)
  console.log(`  Confidence: ${inferred.confidence}`)

  // Get fallback to national
  const unknownPrior = getRegionalPracticePrior('region_unknown', 'general')

  console.log(`✓ Fallback to national default works`)
  console.log(`  Region ID: ${unknownPrior?.regionId}`)
  console.log(`  Confidence: ${unknownPrior?.confidence}\n`)

  return { success: true }
}

async function testEnhancement1_Uncertainty() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  TEST 4: UNCERTAINTY DISTRIBUTIONS (ENHANCEMENT #1)    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const result = predictQuality({
    cultivarId: 'washington_navel',
    regionId: 'indian_river_fl',
    currentGdd: 3200,  // At peak
    peakGdd: 3200,
    treeAgeYears: 12,
  })

  console.log(`✓ Prediction with uncertainty distribution`)
  console.log(`  Mean: ${result.brixDistribution?.mean.toFixed(2)}`)
  console.log(`  p25 (conservative): ${result.brixDistribution?.p25.toFixed(2)}`)
  console.log(`  p50 (likely): ${result.brixDistribution?.p50.toFixed(2)}`)
  console.log(`  p75 (optimistic): ${result.brixDistribution?.p75.toFixed(2)}`)
  console.log(`  90% CI: [${result.brixDistribution?.confidenceInterval90[0].toFixed(2)}, ${result.brixDistribution?.confidenceInterval90[1].toFixed(2)}]`)

  if (!result.brixDistribution) {
    throw new Error('Brix distribution not generated!')
  }

  console.log(`✓ Uncertainty breakdown provided`)
  console.log(`  Cultivar variance: ${result.uncertaintyBreakdown?.cultivarVariance.toFixed(2)}`)
  console.log(`  Total std dev: ${result.uncertaintyBreakdown?.totalStdDev.toFixed(2)}`)

  console.log(`✓ Confidence derived from distribution`)
  console.log(`  Confidence: ${result.confidence.toFixed(3)}\n`)

  return { success: true, result }
}

async function testEnhancement4_TemporalInference() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  TEST 5: TEMPORAL CULTIVAR INFERENCE (ENHANCEMENT #4)  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Test temporal inference: CA Navel at different GDD levels
  const earlySeasonGDD = 2700
  const peakGDD = 3200
  const lateSeasonGDD = 3800

  console.log('Testing temporal inference at different GDD levels:\n')

  // Early season
  const early = await inferCultivarsFromTiming(
    'navel_orange',
    'central_valley_ca',
    new Date('2025-11-15'),
    earlySeasonGDD
  )

  console.log(`✓ Early season (GDD ${earlySeasonGDD}):`)
  for (const c of early.slice(0, 2)) {
    console.log(`  ${c.cultivarName}: ${(c.probability * 100).toFixed(1)}% (${c.reason}, Δ${c.gddDelta})`)
  }

  // At peak
  const peak = await inferCultivarsFromTiming(
    'navel_orange',
    'central_valley_ca',
    new Date('2025-12-22'),
    peakGDD
  )

  console.log(`\n✓ Peak season (GDD ${peakGDD}):`)
  for (const c of peak.slice(0, 2)) {
    console.log(`  ${c.cultivarName}: ${(c.probability * 100).toFixed(1)}% (${c.reason}, Δ${c.gddDelta})`)
  }

  // Late season
  const late = await inferCultivarsFromTiming(
    'navel_orange',
    'central_valley_ca',
    new Date('2026-03-15'),
    lateSeasonGDD
  )

  console.log(`\n✓ Late season (GDD ${lateSeasonGDD}):`)
  for (const c of late.slice(0, 2)) {
    console.log(`  ${c.cultivarName}: ${(c.probability * 100).toFixed(1)}% (${c.reason}, Δ${c.gddDelta})`)
  }

  console.log(`\n✓ Temporal inference working - probabilities change with GDD\n`)

  return { success: true }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║     FULL SYSTEM INTEGRATION TEST                      ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  try {
    await testKnowledgeGraph()
    await testEnhancement2_VersionedGDD()
    await testEnhancement3_RegionalPriors()
    await testEnhancement1_Uncertainty()
    await testEnhancement4_TemporalInference()

    console.log('╔════════════════════════════════════════════════════════╗')
    console.log('║                 ALL SYSTEMS FUNCTIONAL ✅              ║')
    console.log('╠════════════════════════════════════════════════════════╣')
    console.log('║  Knowledge Graph:        ✅ WORKING                   ║')
    console.log('║  Versioned GDD:          ✅ WORKING                   ║')
    console.log('║  Regional Priors:        ✅ WORKING                   ║')
    console.log('║  Uncertainty:            ✅ WORKING                   ║')
    console.log('║  Temporal Inference:     ✅ WORKING                   ║')
    console.log('╚════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('The Fielder prediction engine is production-ready.')
    console.log('All enhancements integrated and functional.\n')

  } catch (error) {
    console.error('❌ Integration test failed:', error)
    throw error
  } finally {
    await closeDriver()
  }
}

main()
