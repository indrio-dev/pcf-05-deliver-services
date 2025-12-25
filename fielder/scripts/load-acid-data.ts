#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Add acid tracking to GROWN_IN relationships
 *
 * Based on:
 * - Historical Vero Beach test data (2014-2015)
 * - Research-based typical acid levels by cultivar
 * - Calculated Brix/acid ratios for sweetness balance
 */

// Typical acid percentages by citrus type (from Vero Beach + research)
const CITRUS_ACID_RANGES: Record<string, { min: number; typical: number; max: number }> = {
  // Navels (sweet oranges, low acid)
  'navel_orange': { min: 0.60, typical: 0.70, max: 0.85 },
  'cara_cara': { min: 0.55, typical: 0.65, max: 0.75 },  // Lower acid (noted in patent)

  // Valencias (juice oranges, higher acid)
  'valencia_orange': { min: 0.80, typical: 0.95, max: 1.10 },

  // Blood oranges
  'blood_orange': { min: 0.70, typical: 0.85, max: 1.00 },

  // Grapefruit (tart)
  'ruby_red_grapefruit': { min: 1.00, typical: 1.20, max: 1.40 },
  'rio_star_grapefruit': { min: 0.95, typical: 1.15, max: 1.35 },
  'marsh_grapefruit': { min: 1.10, typical: 1.30, max: 1.50 },

  // Tangerines/Mandarins (moderate acid)
  'satsuma': { min: 0.70, typical: 0.85, max: 1.00 },
  'clementine': { min: 0.65, typical: 0.80, max: 0.95 },
  'honey_tangerine': { min: 0.75, typical: 0.90, max: 1.05 },

  // Tangelos (very tart, grapefruit hybrid)
  'minneola': { min: 1.20, typical: 1.45, max: 1.70 },
  'honeybell': { min: 0.75, typical: 0.90, max: 1.05 },  // Less tart than Minneola

  // Lemons (very acidic)
  'eureka_lemon': { min: 5.0, typical: 6.0, max: 7.0 },
  'meyer_lemon': { min: 4.0, typical: 5.0, max: 6.0 },  // Sweeter lemon
}

// Sweetness balance assessment from Brix/acid ratio
function assessSweetnessBalance(brix: number, acid: number): {
  ratio: number
  balance: string
  description: string
} {
  const ratio = acid > 0 ? brix / acid : 0

  // Optimal ranges by citrus type (general)
  if (ratio < 8) {
    return {
      ratio,
      balance: 'very_tart',
      description: 'Extremely tart, high acid dominates sweetness. Suitable for cooking/processing.',
    }
  } else if (ratio < 12) {
    return {
      ratio,
      balance: 'tart',
      description: 'Tart and acidic with some sweetness. Good for juice, balanced tartness.',
    }
  } else if (ratio < 15) {
    return {
      ratio,
      balance: 'balanced_tart',
      description: 'Balanced with noticeable tartness. Classic citrus sweet-tart profile.',
    }
  } else if (ratio < 20) {
    return {
      ratio,
      balance: 'balanced_sweet',
      description: 'Sweet with balanced acidity. Optimal eating orange profile.',
    }
  } else if (ratio < 25) {
    return {
      ratio,
      balance: 'sweet',
      description: 'Noticeably sweet with mild acid. Very pleasant eating fruit.',
    }
  } else {
    return {
      ratio,
      balance: 'very_sweet',
      description: 'Very sweet with minimal acid. May lack tartness for some palates.',
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  ADD ACID TRACKING TO OFFERINGS                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let updated = 0

  // Get all GROWN_IN relationships for citrus
  const getCitrusQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE c.id IN $cultivarIds
      AND g.brix_expected IS NOT NULL
    RETURN c.id as cultivarId,
           r.id as regionId,
           g.brix_expected as brix,
           elementId(g) as relId
  `

  const cultivarIds = Object.keys(CITRUS_ACID_RANGES)

  const relationships = await runWriteTransaction(getCitrusQuery, { cultivarIds })

  console.log(`Found ${relationships.length} citrus offerings to update\n`)
  console.log('Adding acid data and calculating ratios...\n')

  for (const rel of relationships) {
    const cultivarId = rel.cultivarId
    const acidData = CITRUS_ACID_RANGES[cultivarId]

    if (!acidData) continue

    const brix = rel.brix
    const acidTypical = acidData.typical

    // Calculate ratio and assessment
    const balance = assessSweetnessBalance(brix, acidTypical)

    // Update relationship
    await runWriteTransaction(`
      MATCH (c:Cultivar {id: $cultivarId})-[g:GROWN_IN]->(r:GrowingRegion {id: $regionId})
      SET g.acid_typical = $acid,
          g.acid_min = $acidMin,
          g.acid_max = $acidMax,
          g.brix_acid_ratio = $ratio,
          g.sweetness_balance = $balance,
          g.balance_description = $description
      RETURN g
    `, {
      cultivarId: rel.cultivarId,
      regionId: rel.regionId,
      acid: acidTypical,
      acidMin: acidData.min,
      acidMax: acidData.max,
      ratio: Math.round(balance.ratio * 10) / 10,
      balance: balance.balance,
      description: balance.description,
    })

    updated++

    if (updated % 100 === 0) {
      console.log(`  ✓ Updated ${updated} offerings...`)
    }
  }

  console.log(`\n✓ Updated ${updated} offerings with acid data\n`)

  // Verification
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  ACID TRACKING COMPLETE                                ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const verifyQuery = `
    MATCH ()-[g:GROWN_IN]->()
    WHERE g.acid_typical IS NOT NULL
    RETURN count(g) as withAcid,
           avg(g.brix_acid_ratio) as avgRatio,
           min(g.brix_acid_ratio) as minRatio,
           max(g.brix_acid_ratio) as maxRatio
  `

  const stats = await runWriteTransaction(verifyQuery, {})

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`Offerings with acid data: ${s.withAcid}`)
    console.log(`Average Brix/acid ratio: ${s.avgRatio.toFixed(1)}`)
    console.log(`Ratio range: ${s.minRatio.toFixed(1)} - ${s.maxRatio.toFixed(1)}`)
  }

  // Sample offerings by balance
  console.log('\n\nSample offerings by sweetness balance:')
  console.log('─────────────────────────────────────────────────────────\n')

  const sampleQuery = `
    MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
    WHERE g.sweetness_balance IS NOT NULL
    RETURN c.displayName as cultivar,
           r.displayName as region,
           g.brix_expected as brix,
           g.acid_typical as acid,
           g.brix_acid_ratio as ratio,
           g.sweetness_balance as balance
    ORDER BY g.brix_acid_ratio
    LIMIT 20
  `

  const samples = await runWriteTransaction(sampleQuery, {})

  for (const row of samples) {
    console.log(`  • ${row.cultivar} from ${row.region}`)
    console.log(`    ${row.brix}°Bx / ${row.acid}% acid = ${row.ratio} ratio (${row.balance})`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
