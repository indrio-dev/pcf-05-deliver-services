#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify region climate data and demonstrate R (Ripen) pillar queries
 *
 * Climate data enables:
 * - Crop compatibility matching (GDD requirements, chill hours)
 * - Harvest window predictions (frost dates, growing season)
 * - Cross-pillar SHARE queries (H×S×R)
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY REGION CLIMATE DATA                            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Complete climate profile for a region
  console.log('Query 1: Complete Climate Profile (Yakima Valley, WA)')
  console.log('─────────────────────────────────────────────────────────\n')

  const profileQuery = `
    MATCH (r:GrowingRegion {id: 'pacific_nw_yakima'})
    RETURN r.displayName as name,
           r.state as state,
           r.avgLastFrostDoy as lastFrost,
           r.avgFirstFrostDoy as firstFrost,
           r.frostFreeDays as frostFree,
           r.annualGdd50 as gdd,
           r.avgChillHours as chill,
           r.usdaZone as zone
  `

  const profile = await runWriteTransaction(profileQuery, {})

  if (profile.length > 0) {
    const r = profile[0]
    console.log(`${r.name}, ${r.state}`)
    console.log(`\nGROWING SEASON:`)
    console.log(`  Last Frost: Day ${r.lastFrost} (~${dayOfYearToDate(r.lastFrost)})`)
    console.log(`  First Frost: Day ${r.firstFrost} (~${dayOfYearToDate(r.firstFrost)})`)
    console.log(`  Frost-Free Days: ${r.frostFree}`)
    console.log(`\nHEAT ACCUMULATION:`)
    console.log(`  Annual GDD (base 50°F): ${r.gdd}`)
    console.log(`\nWINTER CHILL:`)
    console.log(`  Avg Chill Hours: ${r.chill}`)
    console.log(`\nUSDA ZONE: ${r.zone}`)
  }

  // Query 2: Find regions by growing season length
  console.log('\n\nQuery 2: Long Growing Season Regions (270+ days)')
  console.log('─────────────────────────────────────────────────────────\n')

  const longSeasonQuery = `
    MATCH (r:GrowingRegion)
    WHERE r.frostFreeDays >= 270
    RETURN r.displayName as region,
           r.state as state,
           r.frostFreeDays as days,
           r.annualGdd50 as gdd
    ORDER BY r.frostFreeDays DESC
    LIMIT 12
  `

  const longSeason = await runWriteTransaction(longSeasonQuery, {})

  for (const row of longSeason) {
    console.log(`  • ${row.region}, ${row.state}`)
    console.log(`    ${row.days} frost-free days, ${row.gdd} GDD`)
  }

  // Query 3: Find regions by chill hours (deciduous fruit)
  console.log('\n\nQuery 3: High-Chill Regions (1000+ hours)')
  console.log('(Ideal for apples, pears, cherries)')
  console.log('─────────────────────────────────────────────────────────\n')

  const highChillQuery = `
    MATCH (r:GrowingRegion)
    WHERE r.avgChillHours >= 1000
    RETURN r.displayName as region,
           r.state as state,
           r.avgChillHours as chill,
           r.annualGdd50 as gdd
    ORDER BY r.avgChillHours DESC
    LIMIT 10
  `

  const highChill = await runWriteTransaction(highChillQuery, {})

  for (const row of highChill) {
    console.log(`  • ${row.region}, ${row.state}`)
    console.log(`    ${row.chill} chill hours, ${row.gdd} GDD`)
  }

  // Query 4: Low-chill regions (subtropical/tropical fruit)
  console.log('\n\nQuery 4: Low-Chill Regions (<300 hours)')
  console.log('(Ideal for citrus, avocado, mango)')
  console.log('─────────────────────────────────────────────────────────\n')

  const lowChillQuery = `
    MATCH (r:GrowingRegion)
    WHERE r.avgChillHours < 300
    RETURN r.displayName as region,
           r.state as state,
           r.avgChillHours as chill,
           r.annualGdd50 as gdd,
           r.frostFreeDays as frostFree
    ORDER BY r.avgChillHours ASC
    LIMIT 10
  `

  const lowChill = await runWriteTransaction(lowChillQuery, {})

  for (const row of lowChill) {
    console.log(`  • ${row.region}, ${row.state}`)
    console.log(`    ${row.chill} chill hours, ${row.gdd} GDD, ${row.frostFree} frost-free days`)
  }

  // Query 5: USDA Zone distribution
  console.log('\n\nQuery 5: USDA Hardiness Zone Distribution')
  console.log('─────────────────────────────────────────────────────────\n')

  const zoneQuery = `
    MATCH (r:GrowingRegion)
    RETURN r.usdaZone as zone, count(r) as regionCount
    ORDER BY zone
  `

  const zones = await runWriteTransaction(zoneQuery, {})

  for (const row of zones) {
    console.log(`  Zone ${row.zone}: ${row.regionCount} regions`)
  }

  // Query 6: Cross-pillar SHARE (H×S×R×E)
  console.log('\n\nQuery 6: Cross-Pillar SHARE Query')
  console.log('(Heritage apples in high-chill regions with long season)')
  console.log('─────────────────────────────────────────────────────────\n')

  const shareQuery = `
    MATCH (c:Cultivar)-[:GROWN_IN]->(r:GrowingRegion)
    WHERE c.isHeritage = true
      AND c.productId = 'apple'
      AND r.avgChillHours >= 800
      AND r.frostFreeDays >= 180
    RETURN DISTINCT c.displayName as cultivar,
           r.displayName as region,
           r.state as state,
           r.avgChillHours as chill,
           c.flavorProfile as flavor
    ORDER BY r.avgChillHours DESC
    LIMIT 10
  `

  const share = await runWriteTransaction(shareQuery, {})

  if (share.length > 0) {
    for (const row of share) {
      console.log(`  • ${row.cultivar} in ${row.region}, ${row.state}`)
      console.log(`    ${row.chill} chill hours`)
      console.log(`    Flavor: ${row.flavor}`)
      console.log('')
    }
  } else {
    console.log('  (No GROWN_IN relationships loaded yet for apples)')
  }

  // Query 7: Find regions compatible with specific GDD requirements
  console.log('\nQuery 7: Regions by GDD Range')
  console.log('(3000-4000 GDD - ideal for stone fruit)')
  console.log('─────────────────────────────────────────────────────────\n')

  const gddQuery = `
    MATCH (r:GrowingRegion)
    WHERE r.annualGdd50 >= 3000
      AND r.annualGdd50 <= 4000
    RETURN r.displayName as region,
           r.state as state,
           r.annualGdd50 as gdd,
           r.avgChillHours as chill
    ORDER BY r.annualGdd50 DESC
    LIMIT 12
  `

  const gddMatch = await runWriteTransaction(gddQuery, {})

  for (const row of gddMatch) {
    console.log(`  • ${row.region}, ${row.state}`)
    console.log(`    GDD: ${row.gdd}, Chill: ${row.chill} hours`)
  }

  // Statistics
  console.log('\n\n╔════════════════════════════════════════════════════════╗')
  console.log('║  CLIMATE DATA STATISTICS                               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const statsQuery = `
    MATCH (r:GrowingRegion)
    RETURN count(r) as total,
           count(r.annualGdd50) as hasGdd,
           count(r.avgChillHours) as hasChill,
           count(r.usdaZone) as hasZone,
           avg(r.annualGdd50) as avgGdd,
           avg(r.avgChillHours) as avgChill,
           avg(r.frostFreeDays) as avgFrostFree,
           min(r.annualGdd50) as minGdd,
           max(r.annualGdd50) as maxGdd,
           min(r.avgChillHours) as minChill,
           max(r.avgChillHours) as maxChill
  `

  const stats = await runWriteTransaction(statsQuery, {})

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`Total Regions: ${s.total}`)
    console.log(`\nField Coverage:`)
    console.log(`  annualGdd50:      ${s.hasGdd} (${Math.round(s.hasGdd / s.total * 100)}%)`)
    console.log(`  avgChillHours:    ${s.hasChill} (${Math.round(s.hasChill / s.total * 100)}%)`)
    console.log(`  usdaZone:         ${s.hasZone} (${Math.round(s.hasZone / s.total * 100)}%)`)
    console.log(`\nClimate Ranges:`)
    console.log(`  GDD Range: ${Math.round(s.minGdd)} - ${Math.round(s.maxGdd)} (avg: ${Math.round(s.avgGdd)})`)
    console.log(`  Chill Hours: ${Math.round(s.minChill)} - ${Math.round(s.maxChill)} (avg: ${Math.round(s.avgChill)})`)
    console.log(`  Frost-Free Days: ${Math.round(s.avgFrostFree)} average`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  REGION CLIMATE DATA VERIFICATION COMPLETE             ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

function dayOfYearToDate(doy: number): string {
  const year = 2024 // Use leap year for consistency
  const date = new Date(year, 0, doy)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

main().catch(console.error)
