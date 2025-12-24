#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Load Brix ranges to GROWN_IN relationships (RegionalOfferings)
 *
 * Brix (°Bx) measures total dissolved solids (primarily sugars) and is
 * THE key metric for internal quality assessment (E pillar).
 *
 * This script estimates Brix ranges based on:
 * 1. Cultivar base Brix (research-based typical values)
 * 2. Quality tier modifier (exceptional/excellent/good)
 * 3. Terroir effects (region can add or subtract)
 *
 * Fields added to GROWN_IN relationships:
 * - brix_expected: Expected Brix for this cultivar×region
 * - brix_min: Minimum expected Brix
 * - brix_max: Maximum expected Brix
 */

// Research-based typical Brix ranges for major crops
const CULTIVAR_BASE_BRIX: Record<string, { base: number, range: number }> = {
  // === CITRUS ===
  // Navels: 10-14 typical, premium 12-15
  'navel_orange': { base: 12, range: 2 },
  'cara_cara': { base: 12.5, range: 2 },

  // Valencia: 10-13 typical (juicing)
  'valencia_orange': { base: 11.5, range: 1.5 },

  // Blood oranges: 11-13
  'blood_orange': { base: 12, range: 1.5 },

  // Grapefruit: Ruby 9-12, Rio Star 10-13 (sweeter)
  'ruby_red_grapefruit': { base: 10.5, range: 1.5 },
  'rio_star_grapefruit': { base: 11.5, range: 1.5 },
  'marsh_grapefruit': { base: 10, range: 1.5 },

  // Tangerines/Mandarins: 11-15 (very sweet)
  'satsuma': { base: 13, range: 2 },
  'clementine': { base: 12.5, range: 2 },
  'honey_tangerine': { base: 14, range: 2 },

  // Lemons: 5-8 (acidic)
  'eureka_lemon': { base: 6.5, range: 1.5 },
  'meyer_lemon': { base: 7.5, range: 1.5 },  // Sweeter

  // === APPLES ===
  // Most apples: 12-16, premium can hit 17-18
  'honeycrisp': { base: 14, range: 2 },
  'fuji': { base: 15, range: 2 },  // Very sweet
  'gala': { base: 13.5, range: 2 },
  'granny_smith': { base: 12, range: 1.5 },  // Tart
  'pink_lady': { base: 14, range: 2 },
  'cosmic_crisp': { base: 14.5, range: 2 },
  'arkansas_black': { base: 13.5, range: 2 },

  // === STONE FRUIT ===
  // Peaches: 10-16, premium 14-17
  'elberta_peach': { base: 13, range: 2 },
  'georgia_belle': { base: 14, range: 2 },
  'redhaven': { base: 12.5, range: 2 },
  'white_lady': { base: 14.5, range: 2 },  // White peaches sweeter

  // Cherries: 16-24 (very sweet)
  'bing_cherry': { base: 18, range: 3 },
  'rainier_cherry': { base: 17, range: 3 },
  'montmorency': { base: 14, range: 2 },  // Tart cherry

  // === BERRIES ===
  // Strawberries: 7-12, premium 10-14
  'chandler_strawberry': { base: 10, range: 2 },
  'seascape': { base: 9.5, range: 2 },
  'florida_brilliance': { base: 9, range: 2 },
  'sweet_sensation': { base: 10.5, range: 2 },

  // Blueberries: 10-15
  'duke_blueberry': { base: 12, range: 2 },
  'bluecrop': { base: 11.5, range: 2 },
  'rabbiteye': { base: 11, range: 2 },

  // === GRAPES ===
  // Table grapes: 16-22, wine grapes: 18-28
  'scuppernong': { base: 16, range: 3 },
  'carlos_muscadine': { base: 15, range: 3 },
}

// Quality tier modifiers (added to base)
const QUALITY_TIER_MODIFIER = {
  'exceptional': +1.5,  // Best terroir, practices
  'excellent': +0.5,
  'good': 0,
  // No entry for commodity (not in curated offerings)
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD BRIX RANGES TO REGIONAL OFFERINGS                ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query all GROWN_IN relationships with quality tier
  const queryRelationships = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    RETURN c.id as cultivarId,
           r.id as regionId,
           g.quality_tier as qualityTier,
           elementId(g) as relId
  `

  const relationships = await runWriteTransaction(queryRelationships, {})

  console.log(`Found ${relationships.length} GROWN_IN relationships\n`)

  let updated = 0
  let skipped = 0
  const stats = {
    hasBrixData: 0,
    noBrixData: 0,
    exceptional: 0,
    excellent: 0,
    good: 0,
  }

  for (const rel of relationships) {
    const cultivarId = rel.cultivarId
    const qualityTier = rel.qualityTier || 'good'

    // Get base Brix for this cultivar
    const brixData = CULTIVAR_BASE_BRIX[cultivarId]

    if (!brixData) {
      skipped++
      stats.noBrixData++
      continue
    }

    stats.hasBrixData++

    // Calculate expected Brix with quality tier modifier
    const tierModifier = QUALITY_TIER_MODIFIER[qualityTier as keyof typeof QUALITY_TIER_MODIFIER] || 0
    const brixExpected = brixData.base + tierModifier

    // Calculate range (base range ± a bit more for exceptional quality)
    const rangeMultiplier = qualityTier === 'exceptional' ? 1.2 : 1.0
    const adjustedRange = brixData.range * rangeMultiplier

    const brixMin = Math.round((brixExpected - adjustedRange) * 10) / 10
    const brixMax = Math.round((brixExpected + adjustedRange) * 10) / 10

    // Update relationship with Brix data
    await runWriteTransaction(`
      MATCH (c:Cultivar {id: $cultivarId})-[g:GROWN_IN]->(r:GrowingRegion {id: $regionId})
      SET g.brix_expected = $brixExpected,
          g.brix_min = $brixMin,
          g.brix_max = $brixMax
      RETURN g
    `, {
      cultivarId: rel.cultivarId,
      regionId: rel.regionId,
      brixExpected: Math.round(brixExpected * 10) / 10,
      brixMin,
      brixMax,
    })

    updated++

    // Track quality tier stats
    if (qualityTier === 'exceptional') stats.exceptional++
    else if (qualityTier === 'excellent') stats.excellent++
    else stats.good++

    // Show progress
    if (updated % 100 === 0) {
      console.log(`  ✓ Updated ${updated} relationships...`)
    }
  }

  console.log(`\n✓ Updated ${updated} GROWN_IN relationships with Brix data`)
  console.log(`  Skipped ${skipped} (no Brix data defined for cultivar)\n`)

  // === SUMMARY ===
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BRIX DATA COVERAGE                                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Relationships with Brix: ${stats.hasBrixData}`)
  console.log(`Relationships without:   ${stats.noBrixData}\n`)

  console.log('By Quality Tier:')
  console.log(`  Exceptional: ${stats.exceptional} (+1.5 Brix modifier)`)
  console.log(`  Excellent:   ${stats.excellent} (+0.5 Brix modifier)`)
  console.log(`  Good:        ${stats.good} (base Brix)`)

  // === VERIFICATION QUERIES ===
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFICATION EXAMPLES                                 ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Example 1: High Brix offerings
  console.log('Query 1: Highest Expected Brix (Top 10)')
  console.log('─────────────────────────────────────────────────────────\n')

  const highBrixQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.brix_expected IS NOT NULL
    RETURN c.displayName as cultivar,
           r.displayName as region,
           g.brix_expected as brix,
           g.quality_tier as tier
    ORDER BY g.brix_expected DESC
    LIMIT 10
  `

  const highBrix = await runWriteTransaction(highBrixQuery, {})

  for (const row of highBrix) {
    console.log(`  • ${row.cultivar} from ${row.region}`)
    console.log(`    Expected Brix: ${row.brix}°Bx (${row.tier})`)
  }

  // Example 2: Indian River citrus
  console.log('\n\nQuery 2: Indian River Citrus Brix Ranges')
  console.log('─────────────────────────────────────────────────────────\n')

  const indianRiverQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion {id: 'indian_river'})
    WHERE g.brix_expected IS NOT NULL
    RETURN c.displayName as cultivar,
           g.brix_expected as expected,
           g.brix_min as min,
           g.brix_max as max,
           g.quality_tier as tier
    ORDER BY g.brix_expected DESC
  `

  const indianRiver = await runWriteTransaction(indianRiverQuery, {})

  for (const row of indianRiver) {
    console.log(`  • ${row.cultivar}`)
    console.log(`    Expected: ${row.expected}°Bx  Range: ${row.min}-${row.max}°Bx  (${row.tier})`)
  }

  // Example 3: Compare regions for same cultivar
  console.log('\n\nQuery 3: Honeycrisp Across Regions')
  console.log('─────────────────────────────────────────────────────────\n')

  const honeyCrispQuery = `
    MATCH (c:Cultivar {id: 'honeycrisp'})-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.brix_expected IS NOT NULL
    RETURN r.displayName as region,
           r.state as state,
           g.brix_expected as brix,
           g.quality_tier as tier
    ORDER BY g.brix_expected DESC
  `

  const honeycrisp = await runWriteTransaction(honeyCrispQuery, {})

  if (honeycrisp.length > 0) {
    for (const row of honeycrisp) {
      console.log(`  • ${row.region}, ${row.state}: ${row.brix}°Bx (${row.tier})`)
    }
  } else {
    console.log('  (No Honeycrisp GROWN_IN relationships found)')
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  BRIX RANGES LOAD COMPLETE                             ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
