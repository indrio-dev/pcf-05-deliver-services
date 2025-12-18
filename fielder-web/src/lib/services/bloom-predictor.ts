/**
 * Bloom Date Prediction Service
 *
 * Predicts actual bloom dates for the current year using:
 * 1. Chill Hour Model - tracks winter chill accumulation
 * 2. Heat Unit Model - tracks spring heat after dormancy breaks
 * 3. USA National Phenology Network - crosscheck with observed data
 *
 * Key insight: Bloom timing is driven by accumulated chill (dormancy) followed
 * by accumulated heat (bud break). Static "typical" dates miss year-to-year variation.
 */

import { weatherService } from './weather'

// ============================================================================
// Types
// ============================================================================

export interface BloomPrediction {
  cropType: string
  regionId: string
  year: number

  // Predicted bloom date from chill/heat model
  predictedBloomDate: Date
  predictedBloomDoy: number  // Day of year (1-365)

  // Typical/historical bloom date for comparison
  typicalBloomDate: Date
  typicalBloomDoy: number

  // Deviation from typical
  daysFromTypical: number  // Negative = earlier, Positive = later

  // Model inputs
  chillHoursAccumulated: number
  chillHoursRequired: number
  chillRequirementMet: boolean
  chillRequirementMetDate: Date | null

  heatUnitsAccumulated: number
  heatUnitsToBloom: number

  // Confidence and data quality
  confidence: 'high' | 'medium' | 'low'
  dataSource: 'calculated' | 'npn_observed' | 'fallback_typical'

  // NPN crosscheck (if available)
  npnObservedDate?: Date
  npnSpeciesId?: number
}

export interface ChillHeatRequirements {
  cropType: string
  chillHoursRequired: number      // Hours below chillThreshold needed
  chillThreshold: number          // Temperature threshold (typically 45°F)
  chillStartMonth: number         // When to start counting (Nov = 11)
  heatUnitsToBloom: number        // GDD after chill met to bloom
  heatBase: number                // Base temp for heat accumulation
  typicalBloomMonth: number       // Fallback typical month
  typicalBloomDay: number         // Fallback typical day
  npnSpeciesId?: number           // USA-NPN species ID for crosscheck
}

// ============================================================================
// Crop-Specific Chill and Heat Requirements
// ============================================================================

/**
 * Chill and heat requirements by crop type
 *
 * Sources:
 * - UF/IFAS Citrus Production Guide
 * - UC Davis Fruit & Nut Research
 * - USDA Chill Hour Requirements Database
 * - Peer-reviewed phenology literature
 */
export const BLOOM_REQUIREMENTS: Record<string, ChillHeatRequirements> = {
  // ==========================================================================
  // CITRUS (Low/No Chill - subtropical)
  // Citrus doesn't have true dormancy, but bloom timing correlates with
  // late winter temperatures. Use heat accumulation from Jan 1.
  // ==========================================================================
  navel_orange: {
    cropType: 'navel_orange',
    chillHoursRequired: 0,        // No true chill requirement
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 400,        // GDD (base 55) from Jan 1 to bloom
    heatBase: 55,
    typicalBloomMonth: 3,
    typicalBloomDay: 15,
    npnSpeciesId: 756,            // Citrus sinensis
  },
  valencia: {
    cropType: 'valencia',
    chillHoursRequired: 0,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 450,        // Slightly later than navels
    heatBase: 55,
    typicalBloomMonth: 3,
    typicalBloomDay: 20,
    npnSpeciesId: 756,
  },
  grapefruit: {
    cropType: 'grapefruit',
    chillHoursRequired: 0,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 350,        // Earlier than oranges
    heatBase: 55,
    typicalBloomMonth: 3,
    typicalBloomDay: 1,
    npnSpeciesId: 754,            // Citrus paradisi
  },
  tangerine: {
    cropType: 'tangerine',
    chillHoursRequired: 0,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 380,
    heatBase: 55,
    typicalBloomMonth: 3,
    typicalBloomDay: 10,
    npnSpeciesId: 757,            // Citrus reticulata
  },
  satsuma: {
    cropType: 'satsuma',
    chillHoursRequired: 0,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 350,
    heatBase: 55,
    typicalBloomMonth: 3,
    typicalBloomDay: 5,
    npnSpeciesId: 757,
  },

  // ==========================================================================
  // STONE FRUIT (Moderate to High Chill)
  // ==========================================================================
  peach: {
    cropType: 'peach',
    chillHoursRequired: 800,      // Varies by cultivar (400-1000)
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 350,        // GDD (base 40) after chill met
    heatBase: 40,
    typicalBloomMonth: 3,
    typicalBloomDay: 15,
    npnSpeciesId: 261,            // Prunus persica
  },
  sweet_cherry: {
    cropType: 'sweet_cherry',
    chillHoursRequired: 1000,     // High chill requirement
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 300,
    heatBase: 40,
    typicalBloomMonth: 4,
    typicalBloomDay: 10,
    npnSpeciesId: 244,            // Prunus avium
  },
  tart_cherry: {
    cropType: 'tart_cherry',
    chillHoursRequired: 1200,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 280,
    heatBase: 40,
    typicalBloomMonth: 4,
    typicalBloomDay: 20,
    npnSpeciesId: 245,            // Prunus cerasus
  },

  // ==========================================================================
  // POME FRUIT (Moderate Chill)
  // ==========================================================================
  apple: {
    cropType: 'apple',
    chillHoursRequired: 1000,     // Varies by cultivar (800-1200)
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 400,
    heatBase: 43,
    typicalBloomMonth: 4,
    typicalBloomDay: 25,
    npnSpeciesId: 207,            // Malus domestica
  },
  pear: {
    cropType: 'pear',
    chillHoursRequired: 900,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 350,
    heatBase: 43,
    typicalBloomMonth: 4,
    typicalBloomDay: 15,
    npnSpeciesId: 274,            // Pyrus communis
  },

  // ==========================================================================
  // BERRIES (Low to Moderate Chill)
  // ==========================================================================
  strawberry: {
    cropType: 'strawberry',
    chillHoursRequired: 200,      // Low chill, day-neutral types need less
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 200,
    heatBase: 50,
    typicalBloomMonth: 2,
    typicalBloomDay: 15,
    npnSpeciesId: 97,             // Fragaria × ananassa
  },
  blueberry: {
    cropType: 'blueberry',
    chillHoursRequired: 600,      // Rabbiteye: 400-600, Highbush: 800-1000
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 300,
    heatBase: 45,
    typicalBloomMonth: 3,
    typicalBloomDay: 20,
    npnSpeciesId: 89,             // Vaccinium corymbosum
  },

  // ==========================================================================
  // NUTS
  // ==========================================================================
  pecan: {
    cropType: 'pecan',
    chillHoursRequired: 400,      // Relatively low chill
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 600,        // Late bloomer
    heatBase: 55,
    typicalBloomMonth: 4,
    typicalBloomDay: 15,
    npnSpeciesId: 217,            // Carya illinoinensis
  },

  // ==========================================================================
  // TROPICAL (No Chill)
  // ==========================================================================
  mango: {
    cropType: 'mango',
    chillHoursRequired: 0,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 500,
    heatBase: 60,
    typicalBloomMonth: 2,
    typicalBloomDay: 1,
  },
  pomegranate: {
    cropType: 'pomegranate',
    chillHoursRequired: 200,
    chillThreshold: 45,
    chillStartMonth: 11,
    heatUnitsToBloom: 400,
    heatBase: 50,
    typicalBloomMonth: 4,
    typicalBloomDay: 1,
  },
}

// ============================================================================
// Chill Hour Calculation
// ============================================================================

/**
 * Calculate chill hours from weather data
 * Uses the simple model: hours when temperature is below threshold
 *
 * More sophisticated models exist (Utah, Dynamic) but this is a good start
 */
export function calculateChillHours(
  observations: Array<{ tempHigh: number; tempLow: number; tempAvg: number }>,
  threshold: number = 45
): number {
  let chillHours = 0

  for (const obs of observations) {
    // Estimate hours below threshold using daily high/low
    // If avg temp < threshold, assume most of day was below
    // If only low < threshold, estimate partial hours

    if (obs.tempAvg <= threshold) {
      // Most of the day was below threshold
      chillHours += 18  // ~18 hours of effective chill
    } else if (obs.tempLow <= threshold) {
      // Only part of the day was below threshold
      // Estimate based on how close avg is to threshold
      const chillPortion = Math.max(0, (threshold - obs.tempLow) / (obs.tempHigh - obs.tempLow))
      chillHours += Math.round(chillPortion * 12)  // Up to 12 hours
    }
  }

  return chillHours
}

/**
 * Calculate heat units (GDD) from weather data
 */
export function calculateHeatUnits(
  observations: Array<{ tempHigh: number; tempLow: number }>,
  baseTemp: number
): number {
  let heatUnits = 0

  for (const obs of observations) {
    const avgTemp = (obs.tempHigh + obs.tempLow) / 2
    const gdd = Math.max(0, avgTemp - baseTemp)
    heatUnits += gdd
  }

  return Math.round(heatUnits)
}

// ============================================================================
// USA National Phenology Network API
// ============================================================================

interface NPNObservation {
  observation_id: number
  individual_id: number
  phenophase_id: number
  observation_date: string
  day_of_year: number
  phenophase_status: number  // 1 = yes, 0 = no, -1 = uncertain
}

/**
 * Fetch bloom observations from USA National Phenology Network
 * API docs: https://www.usanpn.org/results/rnpn_webservices
 */
async function fetchNPNBloomObservations(
  speciesId: number,
  year: number,
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<NPNObservation[]> {
  // NPN phenophase IDs for bloom
  const bloomPhenophaseIds = [
    501,  // Open flowers
    502,  // Full bloom
    503,  // End of flowering
  ]

  const url = new URL('https://www.usanpn.org/npn_portal/observations/getObservations.json')
  url.searchParams.set('species_id', String(speciesId))
  url.searchParams.set('start_date', `${year}-01-01`)
  url.searchParams.set('end_date', `${year}-06-30`)
  url.searchParams.set('phenophase_id', bloomPhenophaseIds.join(','))
  // Geographic filter
  url.searchParams.set('bottom_left_x1', String(longitude - 1))
  url.searchParams.set('bottom_left_y1', String(latitude - 1))
  url.searchParams.set('upper_right_x2', String(longitude + 1))
  url.searchParams.set('upper_right_y2', String(latitude + 1))

  try {
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }  // Cache for 24 hours
    })

    if (!response.ok) {
      console.warn('NPN API error:', response.status)
      return []
    }

    const data = await response.json()
    return data.observations || []
  } catch (error) {
    console.warn('NPN fetch error:', error)
    return []
  }
}

/**
 * Get median observed bloom date from NPN data
 */
function getMedianBloomDate(observations: NPNObservation[], year: number): Date | null {
  // Filter to positive bloom observations
  const positiveObs = observations.filter(o => o.phenophase_status === 1)

  if (positiveObs.length === 0) return null

  // Sort by day of year
  positiveObs.sort((a, b) => a.day_of_year - b.day_of_year)

  // Get median
  const medianIdx = Math.floor(positiveObs.length / 2)
  const medianDoy = positiveObs[medianIdx].day_of_year

  // Convert DOY to date
  const date = new Date(year, 0, 1)
  date.setDate(medianDoy)
  return date
}

// ============================================================================
// Main Bloom Prediction Function
// ============================================================================

/**
 * Predict bloom date for a crop in a region for the current year
 *
 * Algorithm:
 * 1. Fetch winter weather data (Nov 1 - present)
 * 2. Calculate accumulated chill hours
 * 3. Once chill requirement met, calculate heat units
 * 4. Predict bloom when heat units reach threshold
 * 5. Crosscheck with NPN observed data if available
 */
export async function predictBloomDate(
  cropType: string,
  regionId: string,
  year: number = new Date().getFullYear()
): Promise<BloomPrediction | null> {
  // Get crop requirements
  const requirements = BLOOM_REQUIREMENTS[cropType]
  if (!requirements) {
    console.warn(`No bloom requirements for crop: ${cropType}`)
    return null
  }

  // Get region coordinates for NPN lookup
  let latitude = 28.0  // Default to central Florida
  let longitude = -81.0

  try {
    // Try to get actual coordinates from region
    const { REGION_COORDINATES } = await import('../constants/regions')
    const coords = REGION_COORDINATES[regionId]
    if (coords) {
      latitude = coords.lat
      longitude = coords.lon
    }
  } catch {
    // Use defaults
  }

  // Calculate typical bloom date
  const typicalBloomDate = new Date(year, requirements.typicalBloomMonth - 1, requirements.typicalBloomDay)
  const typicalBloomDoy = dateToDoy(requirements.typicalBloomMonth, requirements.typicalBloomDay)

  // ==========================================================================
  // Step 1: Fetch winter/spring weather data
  // ==========================================================================
  const chillStartDate = new Date(year - 1, requirements.chillStartMonth - 1, 1)
  const today = new Date()

  let observations: Array<{ tempHigh: number; tempLow: number; tempAvg: number; date: Date }> = []

  try {
    const rawObs = await weatherService.getHistorical(regionId, chillStartDate, today)
    observations = rawObs.map(o => ({
      tempHigh: o.tempHigh,
      tempLow: o.tempLow,
      tempAvg: o.tempAvg,
      date: o.date,
    }))
  } catch (error) {
    console.warn('Weather fetch failed for bloom prediction:', error)
    // Fall back to typical date
    return {
      cropType,
      regionId,
      year,
      predictedBloomDate: typicalBloomDate,
      predictedBloomDoy: typicalBloomDoy,
      typicalBloomDate,
      typicalBloomDoy,
      daysFromTypical: 0,
      chillHoursAccumulated: 0,
      chillHoursRequired: requirements.chillHoursRequired,
      chillRequirementMet: false,
      chillRequirementMetDate: null,
      heatUnitsAccumulated: 0,
      heatUnitsToBloom: requirements.heatUnitsToBloom,
      confidence: 'low',
      dataSource: 'fallback_typical',
    }
  }

  // ==========================================================================
  // Step 2: Calculate chill hours
  // ==========================================================================
  // Filter to chill accumulation period (Nov 1 - Feb 28)
  const chillEndDate = new Date(year, 1, 28)  // Feb 28
  const chillObs = observations.filter(o =>
    o.date >= chillStartDate && o.date <= chillEndDate
  )

  const chillHoursAccumulated = calculateChillHours(chillObs, requirements.chillThreshold)
  const chillRequirementMet = chillHoursAccumulated >= requirements.chillHoursRequired

  // Find when chill requirement was met
  let chillRequirementMetDate: Date | null = null
  let runningChill = 0

  for (const obs of chillObs) {
    if (obs.tempAvg <= requirements.chillThreshold) {
      runningChill += 18
    } else if (obs.tempLow <= requirements.chillThreshold) {
      const chillPortion = Math.max(0, (requirements.chillThreshold - obs.tempLow) / (obs.tempHigh - obs.tempLow))
      runningChill += Math.round(chillPortion * 12)
    }

    if (runningChill >= requirements.chillHoursRequired && !chillRequirementMetDate) {
      chillRequirementMetDate = obs.date
      break
    }
  }

  // For crops with no chill requirement, start heat accumulation Jan 1
  if (requirements.chillHoursRequired === 0) {
    chillRequirementMetDate = new Date(year, 0, 1)
  }

  // ==========================================================================
  // Step 3: Calculate heat units after chill satisfied
  // ==========================================================================
  let heatUnitsAccumulated = 0
  let predictedBloomDate = typicalBloomDate
  let predictedBloomDoy = typicalBloomDoy

  if (chillRequirementMetDate) {
    const heatObs = observations.filter(o => o.date >= chillRequirementMetDate!)
    heatUnitsAccumulated = calculateHeatUnits(heatObs, requirements.heatBase)

    // Predict bloom date
    if (heatUnitsAccumulated >= requirements.heatUnitsToBloom) {
      // Bloom has already occurred - find the date
      let runningHeat = 0
      for (const obs of heatObs) {
        const avgTemp = (obs.tempHigh + obs.tempLow) / 2
        runningHeat += Math.max(0, avgTemp - requirements.heatBase)

        if (runningHeat >= requirements.heatUnitsToBloom) {
          predictedBloomDate = obs.date
          predictedBloomDoy = dateToDoy(obs.date.getMonth() + 1, obs.date.getDate())
          break
        }
      }
    } else {
      // Bloom hasn't occurred yet - extrapolate
      const remainingHeat = requirements.heatUnitsToBloom - heatUnitsAccumulated

      // Estimate days until bloom based on recent heat accumulation rate
      const recentObs = heatObs.slice(-14)  // Last 2 weeks
      const recentHeat = calculateHeatUnits(recentObs, requirements.heatBase)
      const avgDailyHeat = recentObs.length > 0 ? recentHeat / recentObs.length : 15

      const daysUntilBloom = Math.ceil(remainingHeat / avgDailyHeat)
      predictedBloomDate = new Date(today)
      predictedBloomDate.setDate(today.getDate() + daysUntilBloom)
      predictedBloomDoy = dateToDoy(predictedBloomDate.getMonth() + 1, predictedBloomDate.getDate())
    }
  }

  const daysFromTypical = predictedBloomDoy - typicalBloomDoy

  // ==========================================================================
  // Step 4: Crosscheck with NPN observed data
  // ==========================================================================
  let npnObservedDate: Date | undefined
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  let dataSource: 'calculated' | 'npn_observed' | 'fallback_typical' = 'calculated'

  if (requirements.npnSpeciesId) {
    try {
      const npnObs = await fetchNPNBloomObservations(
        requirements.npnSpeciesId,
        year,
        latitude,
        longitude
      )

      npnObservedDate = getMedianBloomDate(npnObs, year) || undefined

      if (npnObservedDate) {
        // If NPN data is close to our prediction (within 7 days), high confidence
        const npnDoy = dateToDoy(npnObservedDate.getMonth() + 1, npnObservedDate.getDate())
        const diff = Math.abs(npnDoy - predictedBloomDoy)

        if (diff <= 7) {
          confidence = 'high'
          dataSource = 'calculated'  // Our model agrees with observations
        } else if (diff <= 14) {
          confidence = 'medium'
          // Average our prediction with NPN
          const avgDoy = Math.round((predictedBloomDoy + npnDoy) / 2)
          predictedBloomDate = doyToDate(avgDoy, year)
          predictedBloomDoy = avgDoy
        } else {
          // Large discrepancy - trust NPN observations over model
          confidence = 'medium'
          dataSource = 'npn_observed'
          predictedBloomDate = npnObservedDate
          predictedBloomDoy = npnDoy
        }
      }
    } catch (error) {
      console.warn('NPN crosscheck failed:', error)
      // Continue with calculated prediction
    }
  }

  // Determine confidence based on data quality
  if (observations.length < 30) {
    confidence = 'low'
  } else if (observations.length >= 90 && chillRequirementMet) {
    confidence = confidence === 'high' ? 'high' : 'medium'
  }

  return {
    cropType,
    regionId,
    year,
    predictedBloomDate,
    predictedBloomDoy,
    typicalBloomDate,
    typicalBloomDoy,
    daysFromTypical,
    chillHoursAccumulated,
    chillHoursRequired: requirements.chillHoursRequired,
    chillRequirementMet,
    chillRequirementMetDate,
    heatUnitsAccumulated,
    heatUnitsToBloom: requirements.heatUnitsToBloom,
    confidence,
    dataSource,
    npnObservedDate,
    npnSpeciesId: requirements.npnSpeciesId,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function dateToDoy(month: number, day: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let doy = day
  for (let i = 0; i < month - 1; i++) {
    doy += daysInMonth[i]
  }
  return doy
}

function doyToDate(doy: number, year: number): Date {
  const date = new Date(year, 0, 1)
  date.setDate(doy)
  return date
}

/**
 * Get bloom requirements for a crop type
 */
export function getBloomRequirements(cropType: string): ChillHeatRequirements | null {
  return BLOOM_REQUIREMENTS[cropType] || null
}

/**
 * Check if bloom prediction is available for a crop
 */
export function hasBloomPrediction(cropType: string): boolean {
  return cropType in BLOOM_REQUIREMENTS
}
