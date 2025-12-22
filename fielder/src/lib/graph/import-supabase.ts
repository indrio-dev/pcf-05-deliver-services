/**
 * Import Supabase Data into Neo4j Knowledge Graph
 *
 * One-time import to enrich the Neo4j graph with Supabase data:
 * - Nutrients (107 rows) - entirely new to Neo4j
 * - Growing regions with enriched data (lat/lon, frost dates, GDD, chill hours)
 * - Harvest windows as relationships
 * - Crops/cultivars/rootstocks - merge with existing
 *
 * Run with: npm run graph:import-supabase
 */

import { runWriteTransaction } from './neo4j'
import {
  SUPABASE_NUTRIENTS,
  SUPABASE_GROWING_REGIONS,
  SUPABASE_CROPS,
  SUPABASE_CULTIVARS,
  SUPABASE_ROOTSTOCKS,
  SUPABASE_HARVEST_WINDOWS,
} from './supabase-data'

// =============================================================================
// ID RECONCILIATION MAPS
// =============================================================================

/**
 * Maps Supabase growing_region IDs to Neo4j GrowingRegion IDs.
 * null = create new node with Supabase ID
 */
const REGION_ID_MAP: Record<string, string | null> = {
  'california_coastal': 'salinas_valley_ca',
  'california_central_valley': 'central_valley_ca',
  'california_southern_desert': 'southern_ca',
  'central_florida': 'central_fl',
  'georgia_piedmont': 'middle_ga',
  'indian_river': 'indian_river_fl',
  'new_jersey_pine_barrens': null,  // New - create with Supabase ID
  'new_york_finger_lakes': 'finger_lakes_ny',
  'new_york_hudson_valley': 'hudson_valley_ny',
  'pacific_nw_hood_river': 'hood_river_or',
  'pennsylvania_adams_county': null,  // New
  'south_florida': 'south_fl',
  'michigan_southwest': 'southwest_mi',
  'sweet_valley': null,  // New
  'texas_hill_country': 'hill_country_tx',
  'texas_pecan_belt': null,  // New
  'texas_rgv': 'rio_grande_tx',
  'pacific_nw_wenatchee': 'wenatchee_wa',
  'pacific_nw_yakima': 'yakima_valley_wa',
  'michigan_west': 'traverse_city_mi',
  'wisconsin_door_county': null,  // New
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

/**
 * Import nutrients - entirely new to Neo4j (E pillar)
 */
export async function importNutrients(): Promise<number> {
  console.log('Importing nutrients...')

  for (const nutrient of SUPABASE_NUTRIENTS) {
    await runWriteTransaction(`
      MERGE (n:Nutrient {id: $id})
      SET n.name = $name,
          n.displayName = $display_name,
          n.abbreviation = $abbreviation,
          n.category = $category,
          n.subcategory = $subcategory,
          n.defaultUnit = $default_unit,
          n.isBeneficial = $is_beneficial,
          n.isEssential = $is_essential,
          n.dailyValue = $daily_value,
          n.dailyValueUnit = $daily_value_unit,
          n.appliesToProduce = $applies_to_produce,
          n.appliesToMeat = $applies_to_meat,
          n.appliesToDairy = $applies_to_dairy,
          n.appliesToEggs = $applies_to_eggs,
          n.appliesToSeafood = $applies_to_seafood,
          n.notes = $notes,
          n.source = 'supabase'
    `, {
      id: nutrient.id,
      name: nutrient.name,
      display_name: nutrient.display_name,
      abbreviation: nutrient.abbreviation,
      category: nutrient.category,
      subcategory: nutrient.subcategory,
      default_unit: nutrient.default_unit,
      is_beneficial: nutrient.is_beneficial,
      is_essential: nutrient.is_essential,
      daily_value: nutrient.daily_value,
      daily_value_unit: nutrient.daily_value_unit,
      applies_to_produce: nutrient.applies_to_produce,
      applies_to_meat: nutrient.applies_to_meat,
      applies_to_dairy: nutrient.applies_to_dairy,
      applies_to_eggs: nutrient.applies_to_eggs,
      applies_to_seafood: nutrient.applies_to_seafood,
      notes: nutrient.notes,
    })
  }

  // Create category grouping relationships
  await runWriteTransaction(`
    MATCH (n:Nutrient)
    WITH n.category AS cat, collect(n) AS nutrients
    MERGE (c:NutrientCategory {id: cat})
    SET c.name = cat
    WITH c, nutrients
    UNWIND nutrients AS n
    MERGE (c)-[:CONTAINS]->(n)
  `)

  console.log(`  ✓ ${SUPABASE_NUTRIENTS.length} nutrients imported`)
  return SUPABASE_NUTRIENTS.length
}

/**
 * Import/merge growing regions with Supabase's enriched data
 */
export async function importGrowingRegions(): Promise<{ updated: number; created: number }> {
  console.log('Importing growing regions...')

  let updated = 0
  let created = 0

  for (const region of SUPABASE_GROWING_REGIONS) {
    const neo4jId = REGION_ID_MAP[region.id]
    const targetId = neo4jId || region.id

    if (neo4jId) {
      // Update existing Neo4j node with enriched Supabase data
      await runWriteTransaction(`
        MATCH (gr:GrowingRegion {id: $targetId})
        SET gr.supabaseId = $supabaseId,
            gr.latitude = $latitude,
            gr.longitude = $longitude,
            gr.usdaZone = $usda_zone,
            gr.avgLastFrostDoy = $avg_last_frost_doy,
            gr.avgFirstFrostDoy = $avg_first_frost_doy,
            gr.frostFreeDays = $frost_free_days,
            gr.annualGdd50 = $annual_gdd_50,
            gr.avgChillHours = $avg_chill_hours,
            gr.viableCrops = $viable_crops,
            gr.enrichedFromSupabase = true
      `, {
        targetId,
        supabaseId: region.id,
        latitude: parseFloat(region.latitude),
        longitude: parseFloat(region.longitude),
        usda_zone: region.usda_zone,
        avg_last_frost_doy: region.avg_last_frost_doy,
        avg_first_frost_doy: region.avg_first_frost_doy,
        frost_free_days: region.frost_free_days,
        annual_gdd_50: region.annual_gdd_50,
        avg_chill_hours: region.avg_chill_hours,
        viable_crops: region.viable_crops || [],
      })
      updated++
      console.log(`  ✓ Updated: ${region.name} → ${targetId}`)
    } else {
      // Create new node - first find the state
      await runWriteTransaction(`
        MATCH (s:State {code: $stateCode})
        MERGE (gr:GrowingRegion {id: $id})
        SET gr.name = $name,
            gr.displayName = $display_name,
            gr.supabaseId = $id,
            gr.latitude = $latitude,
            gr.longitude = $longitude,
            gr.usdaZone = $usda_zone,
            gr.avgLastFrostDoy = $avg_last_frost_doy,
            gr.avgFirstFrostDoy = $avg_first_frost_doy,
            gr.frostFreeDays = $frost_free_days,
            gr.annualGdd50 = $annual_gdd_50,
            gr.avgChillHours = $avg_chill_hours,
            gr.viableCrops = $viable_crops,
            gr.source = 'supabase'
        MERGE (s)-[:CONTAINS_GROWING_REGION]->(gr)
      `, {
        id: region.id,
        name: region.name,
        display_name: region.display_name,
        stateCode: region.state,
        latitude: parseFloat(region.latitude),
        longitude: parseFloat(region.longitude),
        usda_zone: region.usda_zone,
        avg_last_frost_doy: region.avg_last_frost_doy,
        avg_first_frost_doy: region.avg_first_frost_doy,
        frost_free_days: region.frost_free_days,
        annual_gdd_50: region.annual_gdd_50,
        avg_chill_hours: region.avg_chill_hours,
        viable_crops: region.viable_crops || [],
      })

      // Link to USDA zone
      await runWriteTransaction(`
        MATCH (gr:GrowingRegion {id: $regionId})
        MATCH (z:USDAZone {zone: $zone})
        MERGE (gr)-[:TYPICALLY_IN_ZONE]->(z)
      `, { regionId: region.id, zone: region.usda_zone })

      created++
      console.log(`  ✓ Created: ${region.name} (${region.id})`)
    }
  }

  console.log(`  → ${updated} updated, ${created} created`)
  return { updated, created }
}

/**
 * Import crops from Supabase - creates Crop nodes with GDD parameters
 */
export async function importCrops(): Promise<number> {
  console.log('Importing crops...')

  for (const crop of SUPABASE_CROPS) {
    await runWriteTransaction(`
      MERGE (c:Crop {id: $id})
      SET c.name = $name,
          c.displayName = $display_name,
          c.category = $category,
          c.baseTemp = $base_temp,
          c.gddToMaturity = $gdd_to_maturity,
          c.gddToPeak = $gdd_to_peak,
          c.gddWindow = $gdd_window,
          c.chillHoursRequired = $chill_hours_required,
          c.isClimacteric = $is_climacteric,
          c.notes = $notes,
          c.source = 'supabase'
    `, {
      id: crop.id,
      name: crop.name,
      display_name: crop.display_name,
      category: crop.category,
      base_temp: parseFloat(crop.base_temp),
      gdd_to_maturity: crop.gdd_to_maturity,
      gdd_to_peak: crop.gdd_to_peak,
      gdd_window: crop.gdd_window,
      chill_hours_required: crop.chill_hours_required,
      is_climacteric: crop.is_climacteric,
      notes: crop.notes,
    })

    // Link Crop to existing ProductType if there's a match
    await runWriteTransaction(`
      MATCH (c:Crop {id: $cropId})
      MATCH (pt:ProductType)
      WHERE toLower(pt.id) CONTAINS toLower($cropName)
         OR toLower(pt.name) CONTAINS toLower($cropName)
      MERGE (c)-[:MODELS]->(pt)
    `, { cropId: crop.id, cropName: crop.name })
  }

  console.log(`  ✓ ${SUPABASE_CROPS.length} crops imported`)
  return SUPABASE_CROPS.length
}

/**
 * Import cultivars from Supabase
 */
export async function importCultivars(): Promise<number> {
  console.log('Importing cultivars...')

  for (const cultivar of SUPABASE_CULTIVARS) {
    // Create or update cultivar
    await runWriteTransaction(`
      MERGE (cv:Cultivar {id: $id})
      SET cv.name = $name,
          cv.displayName = $display_name,
          cv.cropId = $crop_id,
          cv.brixBase = $brix_base,
          cv.timingClass = $timing_class,
          cv.daysOffset = $days_offset,
          cv.notes = $notes,
          cv.source = 'supabase'
    `, {
      id: cultivar.id,
      name: cultivar.name,
      display_name: cultivar.display_name,
      crop_id: cultivar.crop_id,
      brix_base: parseFloat(cultivar.brix_base),
      timing_class: cultivar.timing_class,
      days_offset: cultivar.days_offset,
      notes: cultivar.notes,
    })
  }

  // Link cultivars to their crops
  await runWriteTransaction(`
    MATCH (cv:Cultivar)
    WHERE cv.cropId IS NOT NULL
    MATCH (c:Crop {id: cv.cropId})
    MERGE (c)-[:HAS_CULTIVAR]->(cv)
  `)

  console.log(`  ✓ ${SUPABASE_CULTIVARS.length} cultivars imported`)
  return SUPABASE_CULTIVARS.length
}

/**
 * Import rootstocks from Supabase
 */
export async function importRootstocks(): Promise<number> {
  console.log('Importing rootstocks...')

  for (const rs of SUPABASE_ROOTSTOCKS) {
    await runWriteTransaction(`
      MERGE (r:Rootstock {id: $id})
      SET r.name = $name,
          r.displayName = $display_name,
          r.cropId = $crop_id,
          r.brixModifier = $brix_modifier,
          r.vigor = $vigor,
          r.notes = $notes,
          r.source = 'supabase'
    `, {
      id: rs.id,
      name: rs.name,
      display_name: rs.display_name,
      crop_id: rs.crop_id,
      brix_modifier: parseFloat(rs.brix_modifier),
      vigor: rs.vigor,
      notes: rs.notes,
    })
  }

  // Link rootstocks to their crops
  await runWriteTransaction(`
    MATCH (rs:Rootstock)
    WHERE rs.cropId IS NOT NULL
    MATCH (c:Crop {id: rs.cropId})
    MERGE (c)-[:HAS_ROOTSTOCK]->(rs)
  `)

  console.log(`  ✓ ${SUPABASE_ROOTSTOCKS.length} rootstocks imported`)
  return SUPABASE_ROOTSTOCKS.length
}

/**
 * Import harvest windows as relationships (R pillar)
 */
export async function importHarvestWindows(): Promise<number> {
  console.log('Importing harvest windows...')

  let imported = 0

  for (const hw of SUPABASE_HARVEST_WINDOWS) {
    // Get the Neo4j region ID
    const neo4jRegionId = REGION_ID_MAP[hw.region_id] || hw.region_id

    // Create HarvestWindow node and link to Crop and GrowingRegion
    await runWriteTransaction(`
      MATCH (c:Crop {id: $cropId})
      MATCH (gr:GrowingRegion)
      WHERE gr.id = $regionId OR gr.supabaseId = $supabaseRegionId
      MERGE (hw:HarvestWindow {id: $hwId})
      SET hw.year = $year,
          hw.harvestStart = date($harvest_start),
          hw.harvestEnd = date($harvest_end),
          hw.optimalStart = date($optimal_start),
          hw.optimalEnd = date($optimal_end),
          hw.predictedBrix = $predicted_brix,
          hw.confidence = $confidence,
          hw.source = 'supabase'
      MERGE (c)-[:HAS_HARVEST_WINDOW]->(hw)
      MERGE (hw)-[:IN_REGION]->(gr)
    `, {
      hwId: `${hw.crop_id}_${hw.region_id}_${hw.year}`,
      cropId: hw.crop_id,
      regionId: neo4jRegionId,
      supabaseRegionId: hw.region_id,
      year: hw.year,
      harvest_start: hw.harvest_start,
      harvest_end: hw.harvest_end,
      optimal_start: hw.optimal_start,
      optimal_end: hw.optimal_end,
      predicted_brix: parseFloat(hw.predicted_brix),
      confidence: parseFloat(hw.confidence),
    })
    imported++
  }

  console.log(`  ✓ ${imported} harvest windows imported`)
  return imported
}

/**
 * Run the complete Supabase import
 */
export async function runSupabaseImport(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         SUPABASE → NEO4J IMPORT                            ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  const results = {
    nutrients: 0,
    regions: { updated: 0, created: 0 },
    crops: 0,
    cultivars: 0,
    rootstocks: 0,
    harvestWindows: 0,
  }

  // Import in order of dependencies
  results.nutrients = await importNutrients()
  results.regions = await importGrowingRegions()
  results.crops = await importCrops()
  results.cultivars = await importCultivars()
  results.rootstocks = await importRootstocks()
  results.harvestWindows = await importHarvestWindows()

  console.log('')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                 IMPORT COMPLETE                            ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║  Nutrients:       ${results.nutrients.toString().padStart(4)} imported                         ║`)
  console.log(`║  Growing Regions: ${results.regions.updated.toString().padStart(4)} updated, ${results.regions.created.toString().padStart(4)} created           ║`)
  console.log(`║  Crops:           ${results.crops.toString().padStart(4)} imported                         ║`)
  console.log(`║  Cultivars:       ${results.cultivars.toString().padStart(4)} imported                         ║`)
  console.log(`║  Rootstocks:      ${results.rootstocks.toString().padStart(4)} imported                         ║`)
  console.log(`║  Harvest Windows: ${results.harvestWindows.toString().padStart(4)} imported                         ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
}
