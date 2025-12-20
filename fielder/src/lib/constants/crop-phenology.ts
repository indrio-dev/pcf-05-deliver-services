/**
 * =============================================================================
 * CROP PHENOLOGY DATABASE
 * =============================================================================
 *
 * Ported from: legacy/python_engine/app.py (CROP_PHENOLOGY)
 *
 * Phenology = the study of cyclic and seasonal natural phenomena,
 * especially in relation to climate and plant/animal life.
 *
 * This database stores crop-specific growing parameters by region:
 * - Bloom dates (when GDD clock starts)
 * - GDD requirements to reach maturity, peak, and end of window
 * - Base temperatures for GDD calculation
 *
 * GDD Formula: GDD = max(0, (Tmax + Tmin) / 2 - base_temp)
 *
 * Research sources:
 * - UF/IFAS Flower Bud Induction Advisory (Florida citrus)
 * - UC Davis fruit production guides
 * - MSU/JASHS Zavalloni et al. 2006 (tart cherry validation)
 * - WSU, UGA, Texas A&M extension publications
 */

// =============================================================================
// TYPES
// =============================================================================

export interface CropPhenology {
  cropId: string
  region: string

  // Bloom timing (when GDD accumulation starts)
  bloomMonth: number           // 1-12
  bloomDay: number             // 1-31

  // GDD parameters
  gddBase: number              // Base temperature in Fahrenheit

  // GDD thresholds from bloom
  gddToMaturity: number        // GDD to reach harvest-ready (window opens)
  gddToPeak: number            // GDD to reach peak quality
  gddWindow: number            // Width of harvest window in GDD units

  // Optional chill hour requirement (stone fruit, some berries)
  chillHours?: number

  // Source documentation
  source: string
  notes?: string
}

export interface BloomDateLookup {
  south?: [number, number]     // [month, day] for southern regions
  west?: [number, number]      // [month, day] for western regions
  north?: [number, number]     // [month, day] for northern regions
  default: [number, number]    // Fallback
}

// =============================================================================
// CROP PHENOLOGY DATABASE
// =============================================================================

/**
 * Comprehensive phenology database with GDD parameters by crop × region.
 *
 * Harvest timing calculation:
 * 1. Start GDD accumulation from bloom date
 * 2. gddToMaturity = harvest window opens
 * 3. gddToPeak = optimal quality (center of premium window)
 * 4. gddToMaturity + gddWindow = harvest window closes
 *
 * Typical daily GDD accumulation rates:
 * - Florida citrus: 20-25 GDD/day
 * - California citrus: 18-22 GDD/day
 * - Michigan stone fruit: 15-20 GDD/day
 * - Pacific Northwest: 12-18 GDD/day
 */
export const CROP_PHENOLOGY: CropPhenology[] = [
  // ==========================================================================
  // CITRUS (base temp 55°F / 12.8°C)
  // ==========================================================================
  // Florida citrus bloom: mid-Feb to mid-March (UF/IFAS Flower Bud Induction Advisory)
  // 2024-25 predicted blooms: Umatilla Mar 8/17, Immokalee Mar 14/26, St. Lucie Mar 14/25

  // NAVEL ORANGE
  {
    cropId: 'navel_orange',
    region: 'florida',
    bloomMonth: 3,
    bloomDay: 15,
    gddBase: 55,
    gddToMaturity: 5100,        // ~Nov 1 at 22 GDD/day = 230 days
    gddToPeak: 6100,            // ~Dec 15 peak quality
    gddWindow: 2000,            // Nov 1-Jan 31 = ~90 days * 22 GDD/day
    source: 'UF/IFAS, validated against actual harvest dates',
    notes: 'Mid-March bloom per 2024-25 UF/IFAS prediction'
  },
  {
    cropId: 'navel_orange',
    region: 'california',
    bloomMonth: 3,
    bloomDay: 1,
    gddBase: 55,
    gddToMaturity: 4800,
    gddToPeak: 5800,
    gddWindow: 1500,            // Longer CA window
    source: 'UC Davis Citrus'
  },

  // VALENCIA ORANGE
  {
    cropId: 'valencia',
    region: 'florida',
    bloomMonth: 3,
    bloomDay: 1,
    gddBase: 55,
    gddToMaturity: 8000,        // ~13 months to March harvest
    gddToPeak: 9000,            // April-May peak (14 months)
    gddWindow: 2200,            // March-June = long window (~100 days)
    source: 'UF/IFAS - Valencia is LATE season (13-14 months)',
    notes: 'Valencia requires 13-14 months from bloom to harvest'
  },

  // GRAPEFRUIT
  {
    cropId: 'grapefruit',
    region: 'florida',
    bloomMonth: 3,
    bloomDay: 1,
    gddBase: 55,
    gddToMaturity: 5400,        // November start
    gddToPeak: 7800,            // Feb 15 peak (center of Jan-Mar)
    gddWindow: 4400,            // Nov-May = 180 days
    source: 'UF/IFAS',
    notes: 'FL grapefruit: bloom March, harvest Nov-May, PEAK Jan-Mar'
  },
  {
    cropId: 'grapefruit',
    region: 'texas',
    bloomMonth: 3,
    bloomDay: 1,
    gddBase: 55,
    gddToMaturity: 5200,        // October start (210 days)
    gddToPeak: 8500,            // Jan 15 peak (320 days at 25 GDD/day)
    gddWindow: 5000,            // Oct-Mar = 180 days
    source: 'Texas A&M AgriLife',
    notes: 'Warmer climate, faster GDD accumulation ~25 GDD/day'
  },

  // SATSUMA
  {
    cropId: 'satsuma',
    region: 'florida',
    bloomMonth: 3,
    bloomDay: 15,
    gddBase: 55,
    gddToMaturity: 4600,        // Early - October start (~210 days)
    gddToPeak: 5100,            // Oct-Nov peak (~230 days)
    gddWindow: 700,             // Shorter window (~30 days)
    source: 'UF/IFAS - Early season citrus'
  },

  // TANGERINE
  {
    cropId: 'tangerine',
    region: 'florida',
    bloomMonth: 3,
    bloomDay: 20,
    gddBase: 55,
    gddToMaturity: 5300,        // November start (~240 days)
    gddToPeak: 5700,            // December peak (~260 days)
    gddWindow: 900,             // ~40 days
    source: 'UF/IFAS'
  },

  // ==========================================================================
  // STONE FRUIT (base temp 40-45°F)
  // ==========================================================================

  // PEACH
  {
    cropId: 'peach',
    region: 'georgia',
    bloomMonth: 3,
    bloomDay: 15,
    gddBase: 45,
    gddToMaturity: 1800,        // ~90-100 days at ~20 GDD/day
    gddToPeak: 2000,
    gddWindow: 400,
    chillHours: 850,
    source: 'UGA Extension'
  },
  {
    cropId: 'peach',
    region: 'california',
    bloomMonth: 3,
    bloomDay: 1,
    gddBase: 45,
    gddToMaturity: 1700,
    gddToPeak: 1900,
    gddWindow: 600,
    chillHours: 600,
    source: 'UC Davis'
  },
  {
    cropId: 'peach',
    region: 'texas',
    bloomMonth: 3,
    bloomDay: 1,
    gddBase: 45,
    gddToMaturity: 1600,
    gddToPeak: 1800,
    gddWindow: 500,
    chillHours: 550,
    source: 'Texas A&M'
  },

  // SWEET CHERRY
  {
    cropId: 'sweet_cherry',
    region: 'washington',
    bloomMonth: 4,
    bloomDay: 10,
    gddBase: 40,
    gddToMaturity: 1200,        // ~60 days
    gddToPeak: 1400,
    gddWindow: 300,             // Short window
    chillHours: 800,
    source: 'WSU Extension'
  },
  {
    cropId: 'sweet_cherry',
    region: 'california',
    bloomMonth: 3,
    bloomDay: 15,
    gddBase: 40,
    gddToMaturity: 1100,
    gddToPeak: 1300,
    gddWindow: 250,
    chillHours: 700,
    source: 'UC Davis'
  },
  {
    cropId: 'sweet_cherry',
    region: 'michigan',
    bloomMonth: 5,
    bloomDay: 1,
    gddBase: 40,
    gddToMaturity: 1000,
    gddToPeak: 1200,
    gddWindow: 200,
    chillHours: 1000,
    source: 'MSU Extension'
  },

  // TART CHERRY - VALIDATED MODEL
  {
    cropId: 'tart_cherry',
    region: 'michigan',
    bloomMonth: 5,
    bloomDay: 8,
    gddBase: 39.2,              // 4°C - Eisensmith et al. 1980, 1982
    gddToMaturity: 850,         // ~85% of final size from full bloom
    gddToPeak: 1000,            // 100% final size at ~1000 GDD from full bloom
    gddWindow: 150,             // Short window - tart cherries processed quickly
    chillHours: 1200,
    source: 'MSU/JASHS Zavalloni et al. 2006 - validated model',
    notes: 'Montmorency sour cherry, R²=0.971 for fruit growth model'
  },

  // ==========================================================================
  // POME FRUIT (base temp 40-43°F)
  // ==========================================================================

  // APPLE
  {
    cropId: 'apple',
    region: 'washington',
    bloomMonth: 4,
    bloomDay: 20,
    gddBase: 43,
    gddToMaturity: 2000,        // ~120 days
    gddToPeak: 2400,
    gddWindow: 600,
    chillHours: 1000,
    source: 'WSU Extension'
  },
  {
    cropId: 'apple',
    region: 'michigan',
    bloomMonth: 5,
    bloomDay: 1,
    gddBase: 43,
    gddToMaturity: 1900,
    gddToPeak: 2200,
    gddWindow: 500,
    chillHours: 1100,
    source: 'MSU Extension'
  },
  {
    cropId: 'apple',
    region: 'new_york',
    bloomMonth: 5,
    bloomDay: 1,
    gddBase: 43,
    gddToMaturity: 1900,
    gddToPeak: 2200,
    gddWindow: 500,
    chillHours: 1100,
    source: 'Cornell Extension'
  },

  // PEAR
  {
    cropId: 'pear',
    region: 'washington_oregon',
    bloomMonth: 4,
    bloomDay: 5,
    gddBase: 40,
    gddToMaturity: 2400,        // Mid-August (Bartlett)
    gddToPeak: 2700,            // Late Aug/early Sept optimal
    gddWindow: 800,             // Aug-Oct window (Bartlett through Comice)
    chillHours: 900,
    source: 'OSU/WSU Extension - Hood River Valley',
    notes: 'Hood River: bloom early April, Bartlett harvest mid-Aug, Anjou Sept-Oct'
  },
  {
    cropId: 'pear',
    region: 'california',
    bloomMonth: 3,
    bloomDay: 15,
    gddBase: 40,
    gddToMaturity: 2200,
    gddToPeak: 2500,
    gddWindow: 700,
    chillHours: 700,
    source: 'UC Davis'
  },

  // ==========================================================================
  // BERRIES
  // ==========================================================================

  // STRAWBERRY
  {
    cropId: 'strawberry',
    region: 'florida',
    bloomMonth: 10,             // Fall planting
    bloomDay: 1,
    gddBase: 50,
    gddToMaturity: 660,         // December 1 start (~60 days)
    gddToPeak: 1485,            // Feb 15 = center of Jan-Feb peak (135 days)
    gddWindow: 1400,            // Dec-Mar = ~127 days wide
    source: 'UF/IFAS - Plant City region',
    notes: 'FL strawberries: Plant Sept, first harvest Dec, peak Jan-Feb, ends March'
  },
  {
    cropId: 'strawberry',
    region: 'california',
    bloomMonth: 2,
    bloomDay: 1,
    gddBase: 50,
    gddToMaturity: 900,
    gddToPeak: 1100,
    gddWindow: 800,             // Long CA season
    source: 'UC Davis'
  },

  // BLUEBERRY
  {
    cropId: 'blueberry',
    region: 'florida',
    bloomMonth: 3,
    bloomDay: 1,
    gddBase: 45,
    gddToMaturity: 600,         // Early crop
    gddToPeak: 800,
    gddWindow: 300,
    source: 'UF/IFAS'
  },
  {
    cropId: 'blueberry',
    region: 'michigan',
    bloomMonth: 5,
    bloomDay: 15,
    gddBase: 45,
    gddToMaturity: 1000,
    gddToPeak: 1200,
    gddWindow: 400,
    chillHours: 800,
    source: 'MSU Extension'
  },
  {
    cropId: 'blueberry',
    region: 'new_jersey',
    bloomMonth: 5,
    bloomDay: 1,
    gddBase: 45,
    gddToMaturity: 900,
    gddToPeak: 1100,
    gddWindow: 350,
    chillHours: 700,
    source: 'Rutgers Extension'
  },

  // ==========================================================================
  // TROPICAL / SUBTROPICAL
  // ==========================================================================

  // MANGO
  {
    cropId: 'mango',
    region: 'florida',
    bloomMonth: 2,
    bloomDay: 15,
    gddBase: 60,                // Higher base for tropical
    gddToMaturity: 2500,
    gddToPeak: 3000,
    gddWindow: 600,
    source: 'UF/IFAS - Homestead region'
  },

  // POMEGRANATE
  {
    cropId: 'pomegranate',
    region: 'california',
    bloomMonth: 4,
    bloomDay: 15,
    gddBase: 50,
    gddToMaturity: 3800,        // September start (138 days)
    gddToPeak: 4500,            // October-November peak
    gddWindow: 1000,            // Sept-Nov = ~75 days
    source: 'UC Davis',
    notes: 'Bloom mid-April, harvest Sept-Nov, peak Oct-Nov'
  },

  // ==========================================================================
  // NUTS
  // ==========================================================================

  // PECAN
  {
    cropId: 'pecan',
    region: 'texas',
    bloomMonth: 4,
    bloomDay: 1,
    gddBase: 65,                // High base temp for pecans
    gddToMaturity: 2400,
    gddToPeak: 2800,
    gddWindow: 600,
    source: 'Texas A&M'
  },
  {
    cropId: 'pecan',
    region: 'georgia',
    bloomMonth: 4,
    bloomDay: 1,
    gddBase: 65,
    gddToMaturity: 2300,
    gddToPeak: 2700,
    gddWindow: 550,
    source: 'UGA Extension'
  },
]

// =============================================================================
// TYPICAL BLOOM DATES (Simplified lookup by region type)
// =============================================================================

/**
 * Legacy bloom date lookup for backwards compatibility.
 * Use getCropPhenology() for full parameters.
 */
export const TYPICAL_BLOOM_DATES: Record<string, BloomDateLookup> = {
  navel_orange: { south: [3, 15], default: [3, 10] },
  valencia: { south: [3, 1], default: [3, 1] },
  grapefruit: { south: [3, 1], default: [3, 5] },
  tangerine: { south: [3, 20], default: [3, 15] },
  satsuma: { south: [3, 15], default: [3, 10] },
  peach: { south: [3, 1], default: [4, 1] },
  sweet_cherry: { west: [4, 1], default: [4, 15] },
  tart_cherry: { north: [5, 5], default: [5, 1] },
  cherry: { west: [4, 1], default: [4, 15] },
  apple: { north: [5, 1], west: [4, 20], default: [4, 15] },
  pear: { west: [4, 1], default: [4, 10] },
  strawberry: { south: [10, 1], default: [4, 1] },
  blueberry: { south: [3, 1], default: [5, 1] },
  mango: { south: [2, 15], default: [3, 1] },
  pomegranate: { west: [4, 15], default: [4, 20] },
  pecan: { south: [4, 1], default: [4, 15] },
}

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get phenology parameters for a crop in a specific region.
 * Returns undefined if not found.
 */
export function getCropPhenology(
  cropId: string,
  region: string
): CropPhenology | undefined {
  // Normalize inputs
  const normalizedCrop = cropId.toLowerCase().replace(/\s+/g, '_')
  const normalizedRegion = region.toLowerCase().replace(/\s+/g, '_')

  // Direct match
  let result = CROP_PHENOLOGY.find(
    p => p.cropId === normalizedCrop && p.region === normalizedRegion
  )

  if (result) return result

  // Try partial region match (e.g., "indian_river_fl" → "florida")
  const regionMappings: Record<string, string> = {
    indian_river: 'florida',
    indian_river_fl: 'florida',
    ridge_fl: 'florida',
    plant_city: 'florida',
    homestead: 'florida',
    rio_grande_valley: 'texas',
    central_valley: 'california',
    hood_river: 'washington_oregon',
    wenatchee: 'washington',
    yakima: 'washington',
    traverse_city: 'michigan',
    finger_lakes: 'new_york',
  }

  const mappedRegion = regionMappings[normalizedRegion]
  if (mappedRegion) {
    result = CROP_PHENOLOGY.find(
      p => p.cropId === normalizedCrop && p.region === mappedRegion
    )
    if (result) return result
  }

  // Fall back to first available region for this crop
  return CROP_PHENOLOGY.find(p => p.cropId === normalizedCrop)
}

/**
 * Get all phenology entries for a crop (all regions).
 */
export function getAllPhenologyForCrop(cropId: string): CropPhenology[] {
  const normalizedCrop = cropId.toLowerCase().replace(/\s+/g, '_')
  return CROP_PHENOLOGY.filter(p => p.cropId === normalizedCrop)
}

/**
 * Get all phenology entries for a region (all crops).
 */
export function getAllPhenologyForRegion(region: string): CropPhenology[] {
  const normalizedRegion = region.toLowerCase().replace(/\s+/g, '_')
  return CROP_PHENOLOGY.filter(p => p.region === normalizedRegion)
}

/**
 * Get bloom date for a crop in a region.
 * Returns Date object for the current or specified year.
 */
export function getBloomDate(
  cropId: string,
  region: string,
  year?: number
): Date | undefined {
  const phenology = getCropPhenology(cropId, region)
  if (!phenology) return undefined

  const bloomYear = year ?? new Date().getFullYear()
  return new Date(bloomYear, phenology.bloomMonth - 1, phenology.bloomDay)
}

/**
 * Get list of all unique crops in the phenology database.
 */
export function getAvailableCrops(): string[] {
  const crops = new Set(CROP_PHENOLOGY.map(p => p.cropId))
  return Array.from(crops).sort()
}

/**
 * Get list of all unique regions in the phenology database.
 */
export function getAvailableRegions(): string[] {
  const regions = new Set(CROP_PHENOLOGY.map(p => p.region))
  return Array.from(regions).sort()
}

/**
 * Get default/fallback phenology parameters for unknown crop × region.
 */
export function getDefaultPhenology(cropId: string): CropPhenology {
  return {
    cropId,
    region: 'default',
    bloomMonth: 4,
    bloomDay: 1,
    gddBase: 50,
    gddToMaturity: 2000,
    gddToPeak: 2300,
    gddWindow: 400,
    source: 'Generic defaults'
  }
}
