#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify that Cultivar nodes have complete field data loaded
 * Demonstrates useful SHARE queries across the complete data model
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY COMPLETE CULTIVAR FIELDS                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Show complete data for a specific cultivar
  console.log('Query 1: Complete Cultivar Profile (Cara Cara)')
  console.log('─────────────────────────────────────────────────────────\n')

  const profileQuery = `
    MATCH (c:Cultivar {id: 'cara_cara'})
    OPTIONAL MATCH (c)-[:BELONGS_TO_VARIETY]->(v:Variety)
    OPTIONAL MATCH (v)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    RETURN c, v.displayName as variety, p.displayName as product
  `

  const profile = await runWriteTransaction(profileQuery, {})

  if (profile.length > 0) {
    const c = profile[0].c.properties
    console.log(`Product: ${profile[0].product}`)
    console.log(`Variety: ${profile[0].variety}`)
    console.log(`Cultivar: ${c.displayName}\n`)
    console.log(`IDENTITY:`)
    console.log(`  id: ${c.id}`)
    console.log(`  modelType: ${c.modelType}`)
    console.log(`\nHERITAGE (H PILLAR):`)
    console.log(`  isNonGmo: ${c.isNonGmo}`)
    console.log(`  isHeritage: ${c.isHeritage || 'N/A'}`)
    console.log(`\nGEOGRAPHIC (S PILLAR):`)
    console.log(`  validatedStates: ${c.validatedStates?.join(', ') || 'N/A'}`)
    console.log(`\nQUALITY (E PILLAR):`)
    console.log(`  flavorProfile: ${c.flavorProfile}`)
    console.log(`\nTIMING (R PILLAR):`)
    console.log(`  peakMonths: ${c.peakMonths?.join(', ')}`)
  }

  // Query 2: Find all Non-GMO cultivars
  console.log('\n\nQuery 2: All Non-GMO Cultivars')
  console.log('─────────────────────────────────────────────────────────\n')

  const nonGmoQuery = `
    MATCH (c:Cultivar)
    WHERE c.isNonGmo = true
    RETURN c.displayName as name, c.productId as product
    ORDER BY c.productId, c.displayName
    LIMIT 20
  `

  const nonGmo = await runWriteTransaction(nonGmoQuery, {})

  for (const row of nonGmo) {
    console.log(`  • ${row.name} (${row.product})`)
  }

  // Query 3: Find cultivars by validated state
  console.log('\n\nQuery 3: Cultivars Validated for Florida')
  console.log('─────────────────────────────────────────────────────────\n')

  const flQuery = `
    MATCH (c:Cultivar)
    WHERE 'FL' IN c.validatedStates
    RETURN c.displayName as name, c.validatedStates as states
    ORDER BY c.displayName
    LIMIT 15
  `

  const florida = await runWriteTransaction(flQuery, {})

  for (const row of florida) {
    console.log(`  • ${row.name} (${row.states.join(', ')})`)
  }

  // Query 4: Show peak harvest timing
  console.log('\n\nQuery 4: Peak Harvest Calendar (Winter Months)')
  console.log('─────────────────────────────────────────────────────────\n')

  const winterQuery = `
    MATCH (c:Cultivar)
    WHERE ANY(m IN c.peakMonths WHERE m IN [11, 12, 1, 2])
    RETURN c.displayName as name, c.peakMonths as months, c.flavorProfile as flavor
    ORDER BY c.peakMonths[0]
    LIMIT 12
  `

  const winter = await runWriteTransaction(winterQuery, {})

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (const row of winter) {
    const monthsStr = row.months.map((m: number) => monthNames[m]).join(', ')
    console.log(`  • ${row.name}`)
    console.log(`    Peak: ${monthsStr}`)
    console.log(`    Flavor: ${row.flavor}`)
    console.log('')
  }

  // Query 5: Heritage cultivars
  console.log('\nQuery 5: Heritage Cultivars')
  console.log('─────────────────────────────────────────────────────────\n')

  const heritageQuery = `
    MATCH (c:Cultivar)
    WHERE c.isHeritage = true
    RETURN c.displayName as name, c.productId as product, c.flavorProfile as flavor
    ORDER BY c.productId, c.displayName
  `

  const heritage = await runWriteTransaction(heritageQuery, {})

  for (const row of heritage) {
    console.log(`  • ${row.name} (${row.product})`)
    console.log(`    ${row.flavor}`)
  }

  // Query 6: GDD-based cultivars (advanced timing models)
  console.log('\n\nQuery 6: GDD-Based Cultivars (Advanced Timing)')
  console.log('─────────────────────────────────────────────────────────\n')

  const gddQuery = `
    MATCH (c:Cultivar)
    WHERE c.baseTemp IS NOT NULL
    RETURN c.displayName as name,
           c.baseTemp as baseTemp,
           c.gddToMaturity as gddToMaturity,
           c.gddToPeak as gddToPeak
    ORDER BY c.displayName
    LIMIT 10
  `

  const gdd = await runWriteTransaction(gddQuery, {})

  for (const row of gdd) {
    console.log(`  • ${row.name}`)
    console.log(`    Base Temp: ${row.baseTemp}°F`)
    console.log(`    GDD to Maturity: ${row.gddToMaturity}`)
    console.log(`    GDD to Peak: ${row.gddToPeak}`)
    console.log('')
  }

  // Query 7: Cross-pillar SHARE query (H×S×R)
  console.log('\nQuery 7: Cross-Pillar SHARE Query')
  console.log('(Heritage cultivars grown in California, peak winter)')
  console.log('─────────────────────────────────────────────────────────\n')

  const shareQuery = `
    MATCH (c:Cultivar)
    WHERE c.isHeritage = true
      AND 'CA' IN c.validatedStates
      AND ANY(m IN c.peakMonths WHERE m IN [11, 12, 1, 2])
    RETURN c.displayName as name,
           c.flavorProfile as flavor,
           c.peakMonths as peak
    ORDER BY c.displayName
  `

  const share = await runWriteTransaction(shareQuery, {})

  for (const row of share) {
    const monthsStr = row.peak.map((m: number) => monthNames[m]).join(', ')
    console.log(`  • ${row.name}`)
    console.log(`    Flavor: ${row.flavor}`)
    console.log(`    Peak: ${monthsStr}`)
    console.log('')
  }

  // Statistics
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  FIELD COMPLETENESS STATISTICS                         ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const statsQuery = `
    MATCH (c:Cultivar)
    RETURN count(c) as total,
           count(c.displayName) as hasDisplayName,
           count(c.modelType) as hasModelType,
           count(c.isNonGmo) as hasIsNonGmo,
           count(c.validatedStates) as hasValidatedStates,
           count(c.flavorProfile) as hasFlavorProfile,
           count(c.peakMonths) as hasPeakMonths,
           count(c.baseTemp) as hasGDD
  `

  const stats = await runWriteTransaction(statsQuery, {})

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`Total Cultivars: ${s.total}`)
    console.log(`\nField Coverage:`)
    console.log(`  displayName:      ${s.hasDisplayName} (${Math.round(s.hasDisplayName / s.total * 100)}%)`)
    console.log(`  modelType:        ${s.hasModelType} (${Math.round(s.hasModelType / s.total * 100)}%)`)
    console.log(`  isNonGmo:         ${s.hasIsNonGmo} (${Math.round(s.hasIsNonGmo / s.total * 100)}%)`)
    console.log(`  validatedStates:  ${s.hasValidatedStates} (${Math.round(s.hasValidatedStates / s.total * 100)}%)`)
    console.log(`  flavorProfile:    ${s.hasFlavorProfile} (${Math.round(s.hasFlavorProfile / s.total * 100)}%)`)
    console.log(`  peakMonths:       ${s.hasPeakMonths} (${Math.round(s.hasPeakMonths / s.total * 100)}%)`)
    console.log(`  GDD params:       ${s.hasGDD} (${Math.round(s.hasGDD / s.total * 100)}%)`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  CULTIVAR FIELDS VERIFICATION COMPLETE                 ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
