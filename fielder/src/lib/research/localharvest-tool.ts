/**
 * LocalHarvest Integration Tool
 *
 * Extracts seasonal availability data from LocalHarvest farm listings.
 * LocalHarvest has 30,000+ farms with products listed by season.
 *
 * KEY INSIGHT: season = harvest season = harvest months (user confirmed)
 *
 * Even "gross harvest months" (Spring/Summer/Fall/Winter categories) provide
 * valuable bottom-up validation of state-level harvest calendars.
 */

export interface LocalHarvestFarm {
  farmName: string
  location: {
    city: string
    county?: string
    state: string
    lat?: number
    lon?: number
  }
  usdaZone?: string // Can be mapped from lat/lon
  productsAndSeasons: {
    [productCategory: string]: SeasonalAvailability
  }
  contact?: {
    website?: string
    phone?: string
    email?: string
  }
  localharvest_url: string
  scrapedDate: Date
}

export interface SeasonalAvailability {
  productCategory: string // 'Tomatoes', 'Apples', 'Eggs', etc.
  seasons: Season[]
  harvestMonths?: number[] // Inferred from seasons
  notes?: string
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'year-round'

/**
 * Map seasons to approximate month ranges
 * (These are Northern Hemisphere temperate zone approximations)
 */
export const SEASON_TO_MONTHS: Record<Season, number[]> = {
  spring: [3, 4, 5], // March, April, May
  summer: [6, 7, 8], // June, July, August
  fall: [9, 10, 11], // September, October, November
  winter: [12, 1, 2], // December, January, February
  'year-round': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

/**
 * Parse seasonal availability text from LocalHarvest farm listing
 *
 * Example input text:
 * "Spring: Lettuce, greens, radishes
 *  Summer: Tomatoes, peppers, squash
 *  Fall: Apples, pumpkins, winter squash"
 */
export function parseSeasonalAvailability(text: string): Map<string, SeasonalAvailability> {
  const products = new Map<string, SeasonalAvailability>()

  // Split by season headers
  const seasonPattern = /(Spring|Summer|Fall|Winter|Year-?round):\s*([^\n]+)/gi
  let match

  while ((match = seasonPattern.exec(text)) !== null) {
    const season = match[1].toLowerCase().replace('-', '-') as Season
    const productList = match[2]

    // Split products by comma
    const productItems = productList.split(',').map((p) => p.trim())

    productItems.forEach((productName) => {
      if (!productName) return

      const key = normalizeProductName(productName)

      if (products.has(key)) {
        // Add season to existing product
        const existing = products.get(key)!
        if (!existing.seasons.includes(season)) {
          existing.seasons.push(season)
          existing.harvestMonths = inferMonthsFromSeasons(existing.seasons)
        }
      } else {
        // New product
        products.set(key, {
          productCategory: productName,
          seasons: [season],
          harvestMonths: SEASON_TO_MONTHS[season],
        })
      }
    })
  }

  return products
}

/**
 * Normalize product names for consistent matching
 * "Heirloom Tomatoes" → "tomatoes"
 * "Heritage Apples" → "apples"
 */
export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(heirloom|heritage|organic|fresh|local)\b/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

/**
 * Infer month ranges from multiple seasons
 * Example: ['spring', 'summer'] → [3,4,5,6,7,8]
 */
export function inferMonthsFromSeasons(seasons: Season[]): number[] {
  const months = new Set<number>()

  seasons.forEach((season) => {
    SEASON_TO_MONTHS[season].forEach((month) => months.add(month))
  })

  return Array.from(months).sort((a, b) => a - b)
}

/**
 * Generate LocalHarvest search queries by region/state
 */
export function generateLocalHarvestSearchQueries(params: {
  state?: string
  county?: string
  city?: string
  usdaZone?: string
  productType?: string
}): string[] {
  const queries: string[] = []
  const baseUrl = 'site:localharvest.org'

  // By location
  if (params.state) {
    queries.push(`${baseUrl} farms ${params.state}`)

    if (params.county) {
      queries.push(`${baseUrl} farms "${params.county}" ${params.state}`)
    }

    if (params.city) {
      queries.push(`${baseUrl} farms "${params.city}" ${params.state}`)
    }
  }

  // By USDA zone (indirect - search regions in that zone)
  if (params.usdaZone) {
    // Would need to map zone → regions first
    queries.push(`${baseUrl} farms zone ${params.usdaZone}`)
  }

  // By product type
  if (params.productType) {
    queries.push(`${baseUrl} farms ${params.productType}`)

    if (params.state) {
      queries.push(`${baseUrl} "${params.productType}" farms ${params.state}`)
    }
  }

  return queries
}

/**
 * Validate LocalHarvest data against state harvest calendar
 */
export function validateAgainstStateCalendar(params: {
  farmData: LocalHarvestFarm
  stateCalendarMonths: number[] // From state-harvest-calendars.json
  productType: string
}): ValidationResult {
  const { farmData, stateCalendarMonths, productType } = params

  // Find product in farm data
  const farmProduct = farmData.productsAndSeasons[productType]
  if (!farmProduct || !farmProduct.harvestMonths) {
    return {
      validated: false,
      reason: 'Product not found in farm data',
    }
  }

  const farmMonths = farmProduct.harvestMonths

  // Check if farm months are subset of state months
  const allMonthsValid = farmMonths.every((month) => stateCalendarMonths.includes(month))

  if (allMonthsValid) {
    return {
      validated: true,
      confidence: 0.85,
      notes: `Farm harvest months ${formatMonths(farmMonths)} confirmed within state window ${formatMonths(stateCalendarMonths)}`,
    }
  } else {
    const invalidMonths = farmMonths.filter((month) => !stateCalendarMonths.includes(month))

    return {
      validated: false,
      confidence: 0.5,
      reason: `Farm reports harvest in months ${formatMonths(invalidMonths)} which are outside state calendar window`,
      notes: 'Could indicate microclimate, protected cultivation, or data error',
    }
  }
}

export interface ValidationResult {
  validated: boolean
  confidence?: number
  reason?: string
  notes?: string
}

/**
 * Format months array for display
 * [6,7,8] → "Jun-Aug"
 * [10,11,12,1,2,3] → "Oct-Mar"
 */
export function formatMonths(months: number[]): string {
  if (months.length === 0) return ''

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const sorted = [...months].sort((a, b) => a - b)

  if (sorted.length === 12) return 'Year-round'

  if (sorted.length === 1) return monthNames[sorted[0] - 1]

  // Check if consecutive
  const isConsecutive = sorted.every((month, idx) => {
    if (idx === 0) return true
    const prev = sorted[idx - 1]
    return month === prev + 1 || (prev === 12 && month === 1)
  })

  if (isConsecutive) {
    return `${monthNames[sorted[0] - 1]}-${monthNames[sorted[sorted.length - 1] - 1]}`
  }

  // Non-consecutive, show all
  return sorted.map((m) => monthNames[m - 1]).join(', ')
}

/**
 * Compare LocalHarvest farm data across multiple farms for same product
 * Identifies consensus and outliers
 */
export function triangulateAcrossFarms(params: {
  farms: LocalHarvestFarm[]
  productType: string
  state: string
}): TriangulationResult {
  const { farms, productType, state } = params

  const farmReports: FarmReport[] = []

  farms.forEach((farm) => {
    const product = farm.productsAndSeasons[productType]
    if (product && product.harvestMonths) {
      farmReports.push({
        farmName: farm.farmName,
        county: farm.location.county,
        harvestMonths: product.harvestMonths,
        seasons: product.seasons,
      })
    }
  })

  if (farmReports.length === 0) {
    return {
      productType,
      state,
      consensus: null,
      reason: 'No farms reporting this product',
    }
  }

  // Count month occurrences
  const monthCounts = new Map<number, number>()

  farmReports.forEach((report) => {
    report.harvestMonths.forEach((month) => {
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1)
    })
  })

  // Consensus = months reported by >50% of farms
  const threshold = Math.ceil(farmReports.length * 0.5)
  const consensusMonths = Array.from(monthCounts.entries())
    .filter(([_, count]) => count >= threshold)
    .map(([month, _]) => month)
    .sort((a, b) => a - b)

  // Find outliers (farms reporting months outside consensus)
  const outliers = farmReports.filter((report) => {
    const hasOutlierMonths = report.harvestMonths.some(
      (month) => !consensusMonths.includes(month)
    )
    return hasOutlierMonths
  })

  return {
    productType,
    state,
    totalFarms: farms.length,
    reportingFarms: farmReports.length,
    consensus: {
      months: consensusMonths,
      formatted: formatMonths(consensusMonths),
      confidence: farmReports.length >= 5 ? 0.85 : 0.70,
    },
    outliers: outliers.map((o) => ({
      farmName: o.farmName,
      county: o.county,
      months: o.harvestMonths,
      formatted: formatMonths(o.harvestMonths),
    })),
    farmReports,
  }
}

interface FarmReport {
  farmName: string
  county?: string
  harvestMonths: number[]
  seasons: Season[]
}

export interface TriangulationResult {
  productType: string
  state: string
  totalFarms?: number
  reportingFarms?: number
  consensus: {
    months: number[]
    formatted: string
    confidence: number
  } | null
  outliers?: Array<{
    farmName: string
    county?: string
    months: number[]
    formatted: string
  }>
  farmReports?: FarmReport[]
  reason?: string
}

/**
 * Research Plan: LocalHarvest Data Collection
 *
 * PHASE 1: Proof of Concept (Florida)
 * - Manually collect 20-30 Florida farms from LocalHarvest
 * - Extract seasonal availability for key products (tomatoes, strawberries, citrus)
 * - Validate against Florida state harvest calendar (already collected)
 * - Map farms to USDA zones (8, 9, 10, 11)
 *
 * PHASE 2: State-by-State Expansion
 * - California (500+ farms)
 * - Texas (300+ farms)
 * - New York (250+ farms)
 * - Ohio, Pennsylvania, Michigan (200+ farms each)
 *
 * PHASE 3: Automated Scraping (if manual proves valuable)
 * - Build respectful scraper (follows robots.txt, rate limiting)
 * - Systematic collection by state → county → farm
 * - Database storage for query/comparison
 *
 * KEY METRICS:
 * - 30,000 farms on LocalHarvest (total available)
 * - Target: 5,000+ farms with seasonal data (first year)
 * - Products tracked: 50+ categories
 * - States covered: All 50 (focus on top 20 ag states)
 *
 * DATA VALUE:
 * - Bottom-up validation of state harvest calendars
 * - Zone-based pattern detection
 * - Microclimate/regional variation identification
 * - Real farm-level timing vs theoretical predictions
 */

/**
 * Example Usage:
 *
 * const exampleText = `
 *   Spring: Lettuce, greens, radishes
 *   Summer: Tomatoes (June-Sept), peppers, squash
 *   Fall: Apples (Sept-Nov), pumpkins, winter squash
 * `
 *
 * const products = parseSeasonalAvailability(exampleText)
 *
 * // Result:
 * // Map {
 * //   'tomatoes' => { productCategory: 'Tomatoes (June-Sept)', seasons: ['summer'], harvestMonths: [6,7,8] }
 * //   'apples' => { productCategory: 'Apples (Sept-Nov)', seasons: ['fall'], harvestMonths: [9,10,11] }
 * // }
 */
