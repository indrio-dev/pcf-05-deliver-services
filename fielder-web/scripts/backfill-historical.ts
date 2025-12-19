/**
 * Historical Data Backfill Script
 *
 * F030: Generate historical predictions, actuals, and calibrations
 * for ML training and system testing.
 *
 * Usage:
 *   npx ts-node scripts/backfill-historical.ts
 *
 * Options:
 *   --dry-run      Preview without writing to database
 *   --seasons=N    Number of past seasons to generate (default: 3)
 *   --samples=N    Samples per cultivar/region/season (default: 10)
 */

import { createClient } from '@supabase/supabase-js'

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Parse command line arguments
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SEASONS = parseInt(args.find(a => a.startsWith('--seasons='))?.split('=')[1] || '3')
const SAMPLES_PER_COMBO = parseInt(args.find(a => a.startsWith('--samples='))?.split('=')[1] || '10')

// Cultivar-region mappings (which cultivars grow in which regions)
const CULTIVAR_REGIONS: Record<string, string[]> = {
  // Citrus - Florida and Texas
  washington_navel: ['indian_river', 'central_florida', 'texas_rgv'],
  cara_cara: ['indian_river', 'central_florida', 'california_central_valley'],
  lane_late: ['indian_river', 'central_florida', 'texas_rgv'],
  ruby_red: ['indian_river', 'texas_rgv'],
  rio_red: ['texas_rgv', 'indian_river'],

  // Peaches - Georgia and California
  georgia_belle: ['georgia_piedmont', 'texas_hill_country'],
  elberta: ['georgia_piedmont', 'california_central_valley', 'texas_hill_country'],

  // Strawberries - Florida and California
  florida_radiance: ['central_florida', 'sweet_valley'],
  sweet_charlie: ['central_florida', 'california_coastal'],

  // Apples - Pacific Northwest and Northeast
  honeycrisp: ['pacific_nw_wenatchee', 'pacific_nw_yakima', 'michigan_west', 'new_york_finger_lakes'],
  arkansas_black: ['pacific_nw_wenatchee', 'pacific_nw_hood_river', 'pennsylvania_adams_county'],
  cosmic_crisp: ['pacific_nw_wenatchee', 'pacific_nw_yakima'],
}

// Rootstocks by crop type
const CROP_ROOTSTOCKS: Record<string, string[]> = {
  navel_orange: ['carrizo', 'swingle', 'c35', 'sour_orange'],
  grapefruit: ['carrizo', 'swingle', 'sour_orange'],
  peach: ['lovell', 'guardian', 'nemaguard'],
  strawberry: [], // No rootstock
  apple: [], // Using own roots for simplicity
}

// Harvest seasons by crop (month ranges for peak season)
const HARVEST_SEASONS: Record<string, { start: number; end: number }> = {
  navel_orange: { start: 11, end: 2 },    // Nov - Feb
  grapefruit: { start: 10, end: 3 },       // Oct - Mar
  peach: { start: 6, end: 8 },             // Jun - Aug
  strawberry: { start: 12, end: 4 },       // Dec - Apr (FL winter)
  apple: { start: 9, end: 11 },            // Sep - Nov
}

// Base Brix by cultivar (from database)
const CULTIVAR_BRIX: Record<string, number> = {
  washington_navel: 11.5,
  cara_cara: 12.0,
  lane_late: 10.5,
  ruby_red: 9.5,
  rio_red: 10.0,
  georgia_belle: 14.0,
  elberta: 12.5,
  florida_radiance: 7.5,
  sweet_charlie: 8.5,
  honeycrisp: 13.0,
  arkansas_black: 14.5,
  cosmic_crisp: 12.0,
}

// Cultivar to crop type mapping
const CULTIVAR_CROP: Record<string, string> = {
  washington_navel: 'navel_orange',
  cara_cara: 'navel_orange',
  lane_late: 'navel_orange',
  ruby_red: 'grapefruit',
  rio_red: 'grapefruit',
  georgia_belle: 'peach',
  elberta: 'peach',
  florida_radiance: 'strawberry',
  sweet_charlie: 'strawberry',
  honeycrisp: 'apple',
  arkansas_black: 'apple',
  cosmic_crisp: 'apple',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function randomGaussian(mean: number, stddev: number): number {
  // Box-Muller transform
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z * stddev
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getRandomDateInSeason(
  year: number,
  seasonStart: number,
  seasonEnd: number
): Date {
  let startDate: Date
  let endDate: Date

  if (seasonStart > seasonEnd) {
    // Season crosses year boundary (e.g., Nov-Feb)
    if (Math.random() < 0.5) {
      // Fall part (start year)
      startDate = new Date(year, seasonStart - 1, 1)
      endDate = new Date(year, 11, 31)
    } else {
      // Winter part (next year)
      startDate = new Date(year + 1, 0, 1)
      endDate = new Date(year + 1, seasonEnd - 1, 28)
    }
  } else {
    startDate = new Date(year, seasonStart - 1, 1)
    endDate = new Date(year, seasonEnd - 1, 28)
  }

  const startTime = startDate.getTime()
  const endTime = endDate.getTime()
  const randomTime = startTime + Math.random() * (endTime - startTime)

  return new Date(randomTime)
}

function getSeasonYear(date: Date): number {
  // For crops with fall/winter seasons, use the earlier year
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  if (month <= 3) {
    return year - 1 // Jan-Mar belongs to previous year's season
  }
  return year
}

// =============================================================================
// DATA GENERATION
// =============================================================================

interface PredictionRecord {
  cultivar_id: string
  region_id: string
  rootstock_id: string | null
  prediction_date: string
  predicted_brix: number
  quality_tier: string
  confidence: number
  prediction_layer: string
  source: string
  tree_age_years: number | null
  current_gdd: number
  peak_gdd: number
  brix_components: object
}

interface ActualRecord {
  prediction_id?: string
  cultivar_id: string
  region_id: string
  measurement_date: string
  actual_brix: number
  source_type: string
  data_quality_score: number
}

interface CalibrationRecord {
  cultivar_id: string
  region_id: string
  season_year: number
  sample_count: number
  brix_offset_mean: number
  brix_offset_stddev: number
  brix_offset_min: number
  brix_offset_max: number
  confidence_boost: number
}

function generatePrediction(
  cultivarId: string,
  regionId: string,
  date: Date
): PredictionRecord {
  const baseBrix = CULTIVAR_BRIX[cultivarId] || 10
  const cropType = CULTIVAR_CROP[cultivarId]
  const rootstocks = CROP_ROOTSTOCKS[cropType] || []
  const rootstockId = rootstocks.length > 0
    ? rootstocks[Math.floor(Math.random() * rootstocks.length)]
    : null

  // Add some variation to base brix
  const rootstockMod = rootstockId ? (Math.random() * 0.8 - 0.2) : 0  // -0.2 to +0.6
  const timingMod = Math.random() * 0.4 - 0.2  // -0.2 to +0.2
  const ageMod = Math.random() < 0.7 ? 0 : (Math.random() * -0.5)  // Most are prime age

  const predictedBrix = clamp(baseBrix + rootstockMod + timingMod + ageMod, 5, 20)

  // Determine quality tier
  let qualityTier: string
  if (predictedBrix >= 14) qualityTier = 'artisan'
  else if (predictedBrix >= 12) qualityTier = 'premium'
  else if (predictedBrix >= 10) qualityTier = 'standard'
  else qualityTier = 'commodity'

  // Tree age (for tree crops)
  const treeAge = ['apple', 'navel_orange', 'grapefruit', 'peach'].includes(cropType)
    ? Math.floor(Math.random() * 20) + 5  // 5-25 years
    : null

  // GDD values
  const peakGdd = 2000 + Math.random() * 1000
  const currentGdd = peakGdd * (0.8 + Math.random() * 0.4)  // 80-120% of peak

  return {
    cultivar_id: cultivarId,
    region_id: regionId,
    rootstock_id: rootstockId,
    prediction_date: date.toISOString().split('T')[0],
    predicted_brix: Math.round(predictedBrix * 100) / 100,
    quality_tier: qualityTier,
    confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,  // 0.70-0.95
    prediction_layer: 'deterministic',
    source: 'batch',
    tree_age_years: treeAge,
    current_gdd: Math.round(currentGdd),
    peak_gdd: Math.round(peakGdd),
    brix_components: {
      base: baseBrix,
      rootstock: Math.round(rootstockMod * 100) / 100,
      timing: Math.round(timingMod * 100) / 100,
      age: Math.round(ageMod * 100) / 100,
    },
  }
}

function generateActual(
  prediction: PredictionRecord,
  predictionId?: string
): ActualRecord {
  // Actual is prediction + random error (simulating real measurement)
  const error = randomGaussian(0, 0.5)  // Mean 0, stddev 0.5 Brix
  const actualBrix = clamp(prediction.predicted_brix + error, 0, 30)

  // Randomize source type
  const sources = ['consumer', 'consumer', 'consumer', 'farm', 'lab']  // Weighted toward consumer
  const sourceType = sources[Math.floor(Math.random() * sources.length)]

  // Data quality based on source
  const qualityBase = sourceType === 'lab' ? 0.95 : sourceType === 'farm' ? 0.85 : 0.7
  const dataQuality = clamp(qualityBase + (Math.random() * 0.1 - 0.05), 0, 1)

  return {
    prediction_id: predictionId,
    cultivar_id: prediction.cultivar_id,
    region_id: prediction.region_id,
    measurement_date: prediction.prediction_date,
    actual_brix: Math.round(actualBrix * 100) / 100,
    source_type: sourceType,
    data_quality_score: Math.round(dataQuality * 100) / 100,
  }
}

function calculateCalibration(
  cultivarId: string,
  regionId: string,
  seasonYear: number,
  predictions: PredictionRecord[],
  actuals: ActualRecord[]
): CalibrationRecord | null {
  // Match predictions and actuals
  const pairs: { predicted: number; actual: number }[] = []

  for (const pred of predictions) {
    const actual = actuals.find(
      a => a.cultivar_id === pred.cultivar_id &&
           a.region_id === pred.region_id &&
           a.measurement_date === pred.prediction_date
    )
    if (actual) {
      pairs.push({
        predicted: pred.predicted_brix,
        actual: actual.actual_brix,
      })
    }
  }

  if (pairs.length < 5) return null

  // Calculate offset statistics
  const offsets = pairs.map(p => p.actual - p.predicted)
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length
  const variance = offsets.reduce((a, b) => a + (b - mean) ** 2, 0) / offsets.length
  const stddev = Math.sqrt(variance)
  const min = Math.min(...offsets)
  const max = Math.max(...offsets)

  // Confidence boost based on sample count
  const confidenceBoost = Math.min(0.1, pairs.length / 500)

  return {
    cultivar_id: cultivarId,
    region_id: regionId,
    season_year: seasonYear,
    sample_count: pairs.length,
    brix_offset_mean: Math.round(mean * 1000) / 1000,
    brix_offset_stddev: Math.round(stddev * 1000) / 1000,
    brix_offset_min: Math.round(min * 1000) / 1000,
    brix_offset_max: Math.round(max * 1000) / 1000,
    confidence_boost: Math.round(confidenceBoost * 1000) / 1000,
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('Historical Data Backfill Script')
  console.log('='.repeat(60))
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no database writes)' : 'LIVE'}`)
  console.log(`Seasons: ${SEASONS}`)
  console.log(`Samples per combo: ${SAMPLES_PER_COMBO}`)
  console.log('')

  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
    console.error('ERROR: Supabase environment variables not set')
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const currentYear = new Date().getFullYear()

  // Collect all data
  const allPredictions: PredictionRecord[] = []
  const allActuals: ActualRecord[] = []
  const allCalibrations: CalibrationRecord[] = []

  // Generate data for each cultivar-region combination
  for (const [cultivarId, regions] of Object.entries(CULTIVAR_REGIONS)) {
    const cropType = CULTIVAR_CROP[cultivarId]
    const season = HARVEST_SEASONS[cropType]

    if (!season) {
      console.log(`Skipping ${cultivarId}: no harvest season defined`)
      continue
    }

    for (const regionId of regions) {
      console.log(`Generating data for ${cultivarId} in ${regionId}...`)

      // Generate for past N seasons
      for (let i = 0; i < SEASONS; i++) {
        const year = currentYear - i - 1  // Start from last year
        const seasonPredictions: PredictionRecord[] = []
        const seasonActuals: ActualRecord[] = []

        // Generate N samples per season
        for (let j = 0; j < SAMPLES_PER_COMBO; j++) {
          const date = getRandomDateInSeason(year, season.start, season.end)
          const prediction = generatePrediction(cultivarId, regionId, date)
          const actual = generateActual(prediction)

          seasonPredictions.push(prediction)
          seasonActuals.push(actual)
          allPredictions.push(prediction)
          allActuals.push(actual)
        }

        // Calculate calibration for this season
        const calibration = calculateCalibration(
          cultivarId,
          regionId,
          year,
          seasonPredictions,
          seasonActuals
        )
        if (calibration) {
          allCalibrations.push(calibration)
        }
      }
    }
  }

  // Summary
  console.log('')
  console.log('='.repeat(60))
  console.log('Generated Data Summary')
  console.log('='.repeat(60))
  console.log(`Predictions: ${allPredictions.length}`)
  console.log(`Actuals: ${allActuals.length}`)
  console.log(`Calibrations: ${allCalibrations.length}`)
  console.log('')

  if (DRY_RUN) {
    console.log('DRY RUN - No data written to database')
    console.log('')
    console.log('Sample prediction:')
    console.log(JSON.stringify(allPredictions[0], null, 2))
    console.log('')
    console.log('Sample actual:')
    console.log(JSON.stringify(allActuals[0], null, 2))
    console.log('')
    console.log('Sample calibration:')
    console.log(JSON.stringify(allCalibrations[0], null, 2))
    return
  }

  // Create Supabase client (only in non-dry-run mode)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Insert predictions
  console.log('Inserting predictions...')
  const predictionBatches = []
  for (let i = 0; i < allPredictions.length; i += 100) {
    predictionBatches.push(allPredictions.slice(i, i + 100))
  }

  const predictionIds: string[] = []
  for (const batch of predictionBatches) {
    const { data, error } = await supabase
      .from('predictions')
      .insert(batch)
      .select('id')

    if (error) {
      console.error('Error inserting predictions:', error.message)
    } else if (data) {
      predictionIds.push(...data.map(d => d.id))
    }
  }
  console.log(`Inserted ${predictionIds.length} predictions`)

  // Update actuals with prediction IDs and insert
  console.log('Inserting actuals...')
  for (let i = 0; i < allActuals.length; i++) {
    if (predictionIds[i]) {
      allActuals[i].prediction_id = predictionIds[i]
    }
  }

  const actualBatches = []
  for (let i = 0; i < allActuals.length; i += 100) {
    actualBatches.push(allActuals.slice(i, i + 100))
  }

  let actualCount = 0
  for (const batch of actualBatches) {
    const { error } = await supabase
      .from('actuals')
      .insert(batch)

    if (error) {
      console.error('Error inserting actuals:', error.message)
    } else {
      actualCount += batch.length
    }
  }
  console.log(`Inserted ${actualCount} actuals`)

  // Insert calibrations (upsert to handle existing)
  console.log('Inserting calibrations...')
  let calibrationCount = 0
  for (const cal of allCalibrations) {
    const { error } = await supabase
      .from('regional_calibrations')
      .upsert(cal, {
        onConflict: 'cultivar_id,region_id,season_year',
      })

    if (error) {
      // May fail due to unique constraint - that's OK
      if (!error.message.includes('duplicate')) {
        console.error('Error inserting calibration:', error.message)
      }
    } else {
      calibrationCount++
    }
  }
  console.log(`Inserted/updated ${calibrationCount} calibrations`)

  console.log('')
  console.log('='.repeat(60))
  console.log('Backfill complete!')
  console.log('='.repeat(60))
}

// Run
main().catch(console.error)
