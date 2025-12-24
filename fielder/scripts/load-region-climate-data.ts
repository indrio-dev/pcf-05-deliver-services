#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { ALL_GROWING_REGIONS } from '../src/lib/constants/growing-regions'

/**
 * Load complete climate data for all GrowingRegion nodes
 *
 * Climate data is CRITICAL for the R (Ripen) pillar - enables GDD-based
 * harvest predictions and crop compatibility matching.
 *
 * Fields loaded:
 * - avgLastFrostDoy: Average last frost date (day of year)
 * - avgFirstFrostDoy: Average first frost date (day of year)
 * - frostFreeDays: Length of growing season
 * - annualGdd50: Annual Growing Degree Days (base 50°F) - CRITICAL for crop timing
 * - avgChillHours: Average winter chill hours - CRITICAL for deciduous fruit
 * - usdaZone: USDA Hardiness Zone - crop compatibility
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD REGION CLIMATE DATA TO NEO4J                     ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const regions = Object.values(ALL_GROWING_REGIONS)
  console.log(`Processing ${regions.length} regions...\n`)

  let updated = 0
  let fieldsAdded = {
    avgLastFrostDoy: 0,
    avgFirstFrostDoy: 0,
    frostFreeDays: 0,
    annualGdd50: 0,
    avgChillHours: 0,
    usdaZone: 0,
  }

  for (const region of regions) {
    if (!region.climate) continue

    const climate = region.climate
    const setFields: string[] = []
    const params: Record<string, any> = { id: region.id }

    // === FROST DATES (R PILLAR - TIMING) ===
    if (climate.avgLastFrostDoy !== undefined) {
      setFields.push('r.avgLastFrostDoy = $avgLastFrostDoy')
      params.avgLastFrostDoy = climate.avgLastFrostDoy
      fieldsAdded.avgLastFrostDoy++
    }

    if (climate.avgFirstFrostDoy !== undefined) {
      setFields.push('r.avgFirstFrostDoy = $avgFirstFrostDoy')
      params.avgFirstFrostDoy = climate.avgFirstFrostDoy
      fieldsAdded.avgFirstFrostDoy++
    }

    if (climate.frostFreeDays !== undefined) {
      setFields.push('r.frostFreeDays = $frostFreeDays')
      params.frostFreeDays = climate.frostFreeDays
      fieldsAdded.frostFreeDays++
    }

    // === GDD (R PILLAR - CRITICAL FOR CROP TIMING) ===
    if (climate.annualGdd50 !== undefined) {
      setFields.push('r.annualGdd50 = $annualGdd50')
      params.annualGdd50 = climate.annualGdd50
      fieldsAdded.annualGdd50++
    }

    // === CHILL HOURS (R PILLAR - CRITICAL FOR DECIDUOUS FRUIT) ===
    if (climate.avgChillHours !== undefined) {
      setFields.push('r.avgChillHours = $avgChillHours')
      params.avgChillHours = climate.avgChillHours
      fieldsAdded.avgChillHours++
    }

    // === USDA ZONE (S PILLAR - CROP COMPATIBILITY) ===
    if (climate.usdaZone !== undefined) {
      setFields.push('r.usdaZone = $usdaZone')
      params.usdaZone = climate.usdaZone
      fieldsAdded.usdaZone++
    }

    // Execute update if we have fields to set
    if (setFields.length > 0) {
      const setClause = setFields.join(',\n          ')

      await runWriteTransaction(`
        MATCH (r:GrowingRegion {id: $id})
        SET ${setClause}
        RETURN r.id as id
      `, params)

      updated++

      // Show progress
      if (updated % 20 === 0) {
        console.log(`  ✓ Updated ${updated}/${regions.length} regions`)
      }
    }
  }

  console.log(`\n✓ Updated ${updated} regions with climate data\n`)

  // === SUMMARY OF FIELDS ADDED ===
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CLIMATE FIELD COVERAGE                                ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('FROST DATES (Growing Season):')
  console.log(`  avgLastFrostDoy:  ${fieldsAdded.avgLastFrostDoy}`)
  console.log(`  avgFirstFrostDoy: ${fieldsAdded.avgFirstFrostDoy}`)
  console.log(`  frostFreeDays:    ${fieldsAdded.frostFreeDays}`)

  console.log('\nGROWING DEGREE DAYS (Crop Timing):')
  console.log(`  annualGdd50:      ${fieldsAdded.annualGdd50} ⭐ CRITICAL`)

  console.log('\nCHILL HOURS (Deciduous Fruit):')
  console.log(`  avgChillHours:    ${fieldsAdded.avgChillHours} ⭐ CRITICAL`)

  console.log('\nUSDA ZONE (Compatibility):')
  console.log(`  usdaZone:         ${fieldsAdded.usdaZone}`)

  // === VERIFICATION QUERY ===
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFICATION                                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const verifyQuery = `
    MATCH (r:GrowingRegion {id: 'indian_river'})
    RETURN r.id as id,
           r.displayName as name,
           r.avgLastFrostDoy as lastFrost,
           r.avgFirstFrostDoy as firstFrost,
           r.frostFreeDays as frostFree,
           r.annualGdd50 as annualGdd50,
           r.avgChillHours as chillHours,
           r.usdaZone as zone
  `

  const result = await runWriteTransaction(verifyQuery, {})

  if (result.length > 0) {
    const r = result[0]
    console.log('Sample region (Indian River, FL):')
    console.log(`  ID: ${r.id}`)
    console.log(`  Name: ${r.name}`)
    console.log(`  Last Frost (DOY): ${r.lastFrost}`)
    console.log(`  First Frost (DOY): ${r.firstFrost}`)
    console.log(`  Frost-Free Days: ${r.frostFree}`)
    console.log(`  Annual GDD50: ${r.annualGdd50}`)
    console.log(`  Chill Hours: ${r.chillHours}`)
    console.log(`  USDA Zone: ${r.zone}`)
  }

  // === CROP COMPATIBILITY EXAMPLE ===
  console.log('\n\n╔════════════════════════════════════════════════════════╗')
  console.log('║  EXAMPLE: GDD-Based Crop Matching                      ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const compatibilityQuery = `
    // Find regions that can grow peaches (need 800-1000 chill hours, 2000+ GDD)
    MATCH (r:GrowingRegion)
    WHERE r.avgChillHours >= 800
      AND r.avgChillHours <= 1000
      AND r.annualGdd50 >= 2000
    RETURN r.displayName as region,
           r.state as state,
           r.annualGdd50 as gdd,
           r.avgChillHours as chill
    ORDER BY r.annualGdd50 DESC
    LIMIT 10
  `

  const compatible = await runWriteTransaction(compatibilityQuery, {})

  console.log('Regions suitable for peaches (800-1000 chill, 2000+ GDD):')
  console.log('─────────────────────────────────────────────────────────')
  for (const row of compatible) {
    console.log(`  • ${row.region}, ${row.state}`)
    console.log(`    GDD: ${row.gdd}, Chill: ${row.chill} hours`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  REGION CLIMATE DATA LOAD COMPLETE                     ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
