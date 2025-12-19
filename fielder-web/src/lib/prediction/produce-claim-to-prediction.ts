/**
 * Produce Claim-to-Prediction Bridge
 *
 * Bridges consumer-level produce claims (PLU codes, trade names, organic stickers)
 * to the SHARE quality predictor.
 *
 * This enables the Flavor App flow:
 *   1. Consumer scans PLU code at store
 *   2. App infers SHARE pillars from minimal data
 *   3. App returns quality prediction with confidence
 *   4. Consumer measures with refractometer (optional)
 *   5. Actual vs predicted builds the data moat
 *
 * KEY INSIGHT: Most produce has minimal labeling - we infer from:
 *   - PLU code (organic prefix 9, product type)
 *   - Trade name (SUMO → Shiranui cultivar)
 *   - Store location + date (origin region inference, seasonality)
 *   - Origin sticker (if visible: "Product of California")
 */

import {
  inferHeritage,
  FLORIDA_SOIL_ZONES,
  REGIONAL_SHIPPING_DAYS,
  CULTIVAR_BRIX_EXPECTATIONS,
  IPM_ADOPTION_RATES,
  type HeritageInference,
  type SoilInference,
  type PracticeInference,
  type TimingInference,
  type QualityInference,
  type ShareInferenceResult,
} from '../constants/inference-chains'
import {
  predictQuality,
  type QualityPredictionInput,
  type QualityPredictionResult,
} from './quality-predictor'

// =============================================================================
// Trade Name → Cultivar Mapping
// =============================================================================

/**
 * Maps trade names (marketing names) to cultivar IDs
 *
 * Trade names are copyrighted marketing terms that map to specific cultivars.
 * This mapping enables H pillar inference from consumer-visible labels.
 */
export const TRADE_NAME_TO_CULTIVAR: Record<
  string,
  {
    cultivarId: string
    cultivarName: string
    cropType: string
    category: string
    expectedBrix?: { min: number; max: number; optimal: number }
    notes?: string
  }
> = {
  // Citrus - Mandarins
  sumo: {
    cultivarId: 'shiranui',
    cultivarName: 'Shiranui/Dekopon',
    cropType: 'tangerine',
    category: 'citrus',
    expectedBrix: { min: 12, max: 16, optimal: 14 },
    notes: 'Japanese cultivar, distinctive knob top, premium positioning',
  },
  cuties: {
    cultivarId: 'clementine_w_murcott',
    cultivarName: 'Clementine/W. Murcott mix',
    cropType: 'mandarin',
    category: 'citrus',
    expectedBrix: { min: 10, max: 13, optimal: 11 },
    notes: 'Sun Pacific brand, seedless mandarins, varies by season',
  },
  halos: {
    cultivarId: 'clementine_w_murcott',
    cultivarName: 'Clementine/W. Murcott mix',
    cropType: 'mandarin',
    category: 'citrus',
    expectedBrix: { min: 10, max: 13, optimal: 11 },
    notes: 'Wonderful Company brand, competes with Cuties',
  },
  pixie: {
    cultivarId: 'pixie_tangerine',
    cultivarName: 'Pixie Tangerine',
    cropType: 'tangerine',
    category: 'citrus',
    expectedBrix: { min: 12, max: 15, optimal: 13 },
    notes: 'Ojai specialty, late season (March-May)',
  },

  // Citrus - Oranges
  cara_cara: {
    cultivarId: 'cara_cara',
    cultivarName: 'Cara Cara Navel',
    cropType: 'orange',
    category: 'citrus',
    expectedBrix: { min: 11, max: 14, optimal: 13 },
    notes: 'Pink-fleshed navel, high lycopene',
  },
  moro: {
    cultivarId: 'moro_blood',
    cultivarName: 'Moro Blood Orange',
    cropType: 'orange',
    category: 'citrus',
    expectedBrix: { min: 10, max: 13, optimal: 12 },
    notes: 'Deep red flesh, anthocyanin-rich',
  },

  // Apples
  cosmic_crisp: {
    cultivarId: 'wa_38',
    cultivarName: 'WA 38 (Cosmic Crisp)',
    cropType: 'apple',
    category: 'pome_fruit',
    expectedBrix: { min: 13, max: 16, optimal: 15 },
    notes: 'WSU cultivar, Honeycrisp × Enterprise cross',
  },
  honeycrisp: {
    cultivarId: 'honeycrisp',
    cultivarName: 'Honeycrisp',
    cropType: 'apple',
    category: 'pome_fruit',
    expectedBrix: { min: 12, max: 15, optimal: 14 },
    notes: 'University of Minnesota cultivar, premium market',
  },
  pink_lady: {
    cultivarId: 'cripps_pink',
    cultivarName: 'Cripps Pink',
    cropType: 'apple',
    category: 'pome_fruit',
    expectedBrix: { min: 13, max: 16, optimal: 14 },
    notes: 'Australian cultivar, tart-sweet balance',
  },
  opal: {
    cultivarId: 'opal_apple',
    cultivarName: 'Opal Apple',
    cropType: 'apple',
    category: 'pome_fruit',
    expectedBrix: { min: 13, max: 16, optimal: 14 },
    notes: 'Non-browning, Topaz × Golden Delicious',
  },
  envy: {
    cultivarId: 'scilate',
    cultivarName: 'Scilate (Envy)',
    cropType: 'apple',
    category: 'pome_fruit',
    expectedBrix: { min: 14, max: 17, optimal: 15 },
    notes: 'New Zealand cultivar, Braeburn × Royal Gala',
  },

  // Stone Fruit
  pluot: {
    cultivarId: 'pluot_generic',
    cultivarName: 'Pluot (plum-apricot hybrid)',
    cropType: 'pluot',
    category: 'stone_fruit',
    expectedBrix: { min: 14, max: 20, optimal: 17 },
    notes: 'Zaiger Genetics hybrid, extremely high Brix potential',
  },
  dinosaur_egg: {
    cultivarId: 'dapple_dandy',
    cultivarName: 'Dapple Dandy Pluot',
    cropType: 'pluot',
    category: 'stone_fruit',
    expectedBrix: { min: 18, max: 24, optimal: 20 },
    notes: 'Spotted skin, one of highest Brix stone fruits',
  },

  // Berries
  driscoll: {
    cultivarId: 'driscoll_proprietary',
    cultivarName: "Driscoll's Proprietary",
    cropType: 'berry',
    category: 'berry',
    expectedBrix: { min: 8, max: 12, optimal: 10 },
    notes: "Driscoll's develops proprietary cultivars, varies by berry type",
  },

  // Grapes
  cotton_candy: {
    cultivarId: 'cotton_candy_grape',
    cultivarName: 'Cotton Candy Grape',
    cropType: 'grape',
    category: 'grape',
    expectedBrix: { min: 18, max: 22, optimal: 20 },
    notes: 'Grapery brand, bred for flavor',
  },
  moon_drops: {
    cultivarId: 'moon_drop_grape',
    cultivarName: 'Moon Drop Grape',
    cropType: 'grape',
    category: 'grape',
    expectedBrix: { min: 16, max: 20, optimal: 18 },
    notes: 'Grapery brand, elongated shape',
  },
}

// =============================================================================
// PLU Code Database (Common Produce)
// =============================================================================

/**
 * PLU code → product identification
 *
 * PLU codes are 4-5 digit numbers assigned by IFPS (International Federation
 * for Produce Standards). Prefix 9 = organic, prefix 8 = GMO (rarely used).
 *
 * We store the base 4-digit code; organic = prepend 9.
 */
export const PLU_DATABASE: Record<
  string,
  {
    productType: string
    variety?: string
    cropType: string
    category: string
    isGmoRisk: boolean
  }
> = {
  // Citrus
  '4012': { productType: 'Orange', variety: 'Navel', cropType: 'orange', category: 'citrus', isGmoRisk: false },
  '4013': { productType: 'Orange', variety: 'Valencia', cropType: 'orange', category: 'citrus', isGmoRisk: false },
  '3107': { productType: 'Orange', variety: 'Cara Cara', cropType: 'orange', category: 'citrus', isGmoRisk: false },
  '3108': { productType: 'Orange', variety: 'Moro Blood', cropType: 'orange', category: 'citrus', isGmoRisk: false },
  '4453': { productType: 'Tangerine', variety: 'Generic', cropType: 'tangerine', category: 'citrus', isGmoRisk: false },
  '3286': { productType: 'Tangerine', variety: 'SUMO', cropType: 'tangerine', category: 'citrus', isGmoRisk: false },
  '4958': { productType: 'Lemon', variety: 'Regular', cropType: 'lemon', category: 'citrus', isGmoRisk: false },
  '4986': { productType: 'Lemon', variety: 'Meyer', cropType: 'lemon', category: 'citrus', isGmoRisk: false },
  '4048': { productType: 'Lime', variety: 'Persian', cropType: 'lime', category: 'citrus', isGmoRisk: false },
  '4033': { productType: 'Grapefruit', variety: 'Ruby Red', cropType: 'grapefruit', category: 'citrus', isGmoRisk: false },

  // Apples
  '4131': { productType: 'Apple', variety: 'Fuji', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },
  '4017': { productType: 'Apple', variety: 'Granny Smith', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },
  '4015': { productType: 'Apple', variety: 'Red Delicious', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },
  '4021': { productType: 'Apple', variety: 'Golden Delicious', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },
  '3283': { productType: 'Apple', variety: 'Honeycrisp', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },
  '3614': { productType: 'Apple', variety: 'Cosmic Crisp', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },
  '4128': { productType: 'Apple', variety: 'Gala', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },
  '3618': { productType: 'Apple', variety: 'Envy', cropType: 'apple', category: 'pome_fruit', isGmoRisk: false },

  // Stone Fruit
  '4038': { productType: 'Peach', variety: 'Yellow', cropType: 'peach', category: 'stone_fruit', isGmoRisk: false },
  '4401': { productType: 'Peach', variety: 'White', cropType: 'peach', category: 'stone_fruit', isGmoRisk: false },
  '4378': { productType: 'Nectarine', variety: 'Yellow', cropType: 'nectarine', category: 'stone_fruit', isGmoRisk: false },
  '4036': { productType: 'Plum', variety: 'Red', cropType: 'plum', category: 'stone_fruit', isGmoRisk: false },
  '4044': { productType: 'Plum', variety: 'Black', cropType: 'plum', category: 'stone_fruit', isGmoRisk: false },
  '4045': { productType: 'Cherry', variety: 'Bing', cropType: 'cherry', category: 'stone_fruit', isGmoRisk: false },
  '4258': { productType: 'Cherry', variety: 'Rainier', cropType: 'cherry', category: 'stone_fruit', isGmoRisk: false },
  '3037': { productType: 'Apricot', variety: 'Generic', cropType: 'apricot', category: 'stone_fruit', isGmoRisk: false },

  // Berries
  '4116': { productType: 'Strawberry', variety: 'Generic', cropType: 'strawberry', category: 'berry', isGmoRisk: false },
  '4235': { productType: 'Blueberry', variety: 'Generic', cropType: 'blueberry', category: 'berry', isGmoRisk: false },
  '4244': { productType: 'Raspberry', variety: 'Red', cropType: 'raspberry', category: 'berry', isGmoRisk: false },
  '4239': { productType: 'Blackberry', variety: 'Generic', cropType: 'blackberry', category: 'berry', isGmoRisk: false },

  // Tropical
  '4011': { productType: 'Banana', variety: 'Cavendish', cropType: 'banana', category: 'tropical', isGmoRisk: false },
  '4234': { productType: 'Mango', variety: 'Generic', cropType: 'mango', category: 'tropical', isGmoRisk: false },
  '4959': { productType: 'Papaya', variety: 'Generic', cropType: 'papaya', category: 'tropical', isGmoRisk: true },
  '4430': { productType: 'Pineapple', variety: 'Gold', cropType: 'pineapple', category: 'tropical', isGmoRisk: false },
  '4225': { productType: 'Avocado', variety: 'Hass', cropType: 'avocado', category: 'tropical', isGmoRisk: false },

  // Melon
  '4032': { productType: 'Cantaloupe', variety: 'Generic', cropType: 'cantaloupe', category: 'melon', isGmoRisk: false },
  '4340': { productType: 'Honeydew', variety: 'Generic', cropType: 'honeydew', category: 'melon', isGmoRisk: false },
  '4031': { productType: 'Watermelon', variety: 'Seeded', cropType: 'watermelon', category: 'melon', isGmoRisk: false },
  '3421': { productType: 'Watermelon', variety: 'Seedless', cropType: 'watermelon', category: 'melon', isGmoRisk: false },

  // Grapes
  '4023': { productType: 'Grape', variety: 'Green Seedless', cropType: 'grape', category: 'grape', isGmoRisk: false },
  '4056': { productType: 'Grape', variety: 'Red Seedless', cropType: 'grape', category: 'grape', isGmoRisk: false },

  // GMO Risk Items
  '4771': { productType: 'Corn', variety: 'Sweet Yellow', cropType: 'corn', category: 'vegetable', isGmoRisk: true },
  '4186': { productType: 'Squash', variety: 'Zucchini', cropType: 'zucchini', category: 'vegetable', isGmoRisk: true },
}

// =============================================================================
// Origin Region Inference
// =============================================================================

/**
 * Maps origin indicators to region IDs for prediction
 */
export const ORIGIN_TO_REGION: Record<
  string,
  {
    regionId: string
    regionName: string
    soilZone?: keyof typeof FLORIDA_SOIL_ZONES
    typicalShippingDays: number
  }
> = {
  // Florida - Note: Indian River is coastal flatwoods, NOT Ridge
  indian_river: { regionId: 'indian_river_fl', regionName: 'Indian River, FL', soilZone: 'indian_river', typicalShippingDays: 3 },
  florida: { regionId: 'central_florida', regionName: 'Central Florida', soilZone: 'flatwoods', typicalShippingDays: 4 },
  vero_beach: { regionId: 'indian_river_fl', regionName: 'Indian River, FL', soilZone: 'indian_river', typicalShippingDays: 3 },
  lakeland: { regionId: 'central_florida', regionName: 'Central Florida', soilZone: 'flatwoods', typicalShippingDays: 4 },
  lake_wales: { regionId: 'lake_wales_ridge_fl', regionName: 'Lake Wales Ridge, FL', soilZone: 'ridge', typicalShippingDays: 4 },
  highlands: { regionId: 'highlands_fl', regionName: 'Highlands County, FL', soilZone: 'ridge', typicalShippingDays: 4 },

  // California
  california: { regionId: 'california_central', regionName: 'Central California', typicalShippingDays: 4 },
  central_valley: { regionId: 'california_san_joaquin', regionName: 'San Joaquin Valley, CA', typicalShippingDays: 3 },
  ojai: { regionId: 'california_ventura', regionName: 'Ventura County, CA', typicalShippingDays: 3 },
  ventura: { regionId: 'california_ventura', regionName: 'Ventura County, CA', typicalShippingDays: 3 },
  salinas: { regionId: 'california_salinas', regionName: 'Salinas Valley, CA', typicalShippingDays: 3 },

  // Texas
  texas: { regionId: 'texas_rio_grande', regionName: 'Rio Grande Valley, TX', typicalShippingDays: 3 },
  rio_grande: { regionId: 'texas_rio_grande', regionName: 'Rio Grande Valley, TX', typicalShippingDays: 3 },

  // Washington
  washington: { regionId: 'washington_yakima', regionName: 'Yakima Valley, WA', typicalShippingDays: 3 },
  yakima: { regionId: 'washington_yakima', regionName: 'Yakima Valley, WA', typicalShippingDays: 3 },
  wenatchee: { regionId: 'washington_wenatchee', regionName: 'Wenatchee, WA', typicalShippingDays: 3 },

  // Georgia
  georgia: { regionId: 'georgia_central', regionName: 'Central Georgia', typicalShippingDays: 3 },

  // Michigan
  michigan: { regionId: 'michigan_traverse', regionName: 'Traverse City, MI', typicalShippingDays: 2 },

  // Default
  usa: { regionId: 'unknown_usa', regionName: 'Unknown US Region', typicalShippingDays: 4 },
  unknown: { regionId: 'unknown', regionName: 'Unknown Origin', typicalShippingDays: 5 },
}

// =============================================================================
// Consumer Scan Input
// =============================================================================

/**
 * Input from a consumer Flavor App scan
 *
 * This is the minimal data a consumer provides when scanning produce.
 */
export interface ProduceScanInput {
  // At least one of these required
  pluCode?: string       // e.g., "4012" or "94012" (organic)
  tradeName?: string     // e.g., "SUMO", "Cosmic Crisp"

  // Location data (from phone GPS)
  storeLocation?: {
    city: string
    state: string
    lat?: number
    lng?: number
  }

  // Scan timestamp
  scanDate?: Date

  // Optional: origin from sticker
  originSticker?: string  // e.g., "Product of California", "Indian River"

  // Optional: actual measurement
  brixMeasurement?: number
  measurementMethod?: 'refractometer' | 'cv_estimate' | 'lab'
}

// =============================================================================
// Inference Result
// =============================================================================

/**
 * Extended inference result for produce
 */
export interface ProduceInferenceResult {
  // Product identification
  productType: string
  variety?: string
  cultivarId?: string
  cultivarName?: string
  cropType: string
  category: string

  // Quality inference
  isOrganic: boolean
  isNonGmo: boolean | 'inferred' | 'unknown'
  isGmoRisk: boolean

  // Origin inference
  originRegion?: string
  regionId?: string

  // Timing inference
  isInSeason: boolean
  seasonConfidence: 'high' | 'medium' | 'low'
  estimatedDaysSinceHarvest?: number

  // Quality expectations
  expectedBrixRange?: { min: number; max: number; optimal: number }

  // SHARE pillar inferences
  heritage: HeritageInference
  soil: SoilInference
  agricultural: PracticeInference
  timing: TimingInference
  quality: QualityInference

  // Confidence and reasoning
  overallConfidence: 'high' | 'medium' | 'low'
  dataGaps: string[]
  reasoning: string[]
}

// =============================================================================
// Combined Result
// =============================================================================

/**
 * Combined inference + prediction result for produce
 */
export interface ProducePredictionFromScanResult {
  inference: ProduceInferenceResult
  prediction: QualityPredictionResult | null
  canPredict: boolean
  reasonCannotPredict?: string
}

// =============================================================================
// Core Inference Functions
// =============================================================================

/**
 * Parse PLU code to extract organic status and base code
 */
export function parsePLUCode(pluCode: string): {
  baseCode: string
  isOrganic: boolean
  isGmo: boolean
} {
  const cleaned = pluCode.replace(/\D/g, '')  // Remove non-digits

  if (cleaned.length === 5 && cleaned.startsWith('9')) {
    return { baseCode: cleaned.slice(1), isOrganic: true, isGmo: false }
  }
  if (cleaned.length === 5 && cleaned.startsWith('8')) {
    return { baseCode: cleaned.slice(1), isOrganic: false, isGmo: true }
  }
  return { baseCode: cleaned, isOrganic: false, isGmo: false }
}

/**
 * Infer origin region from sticker text or store location
 */
export function inferOriginRegion(
  originSticker?: string,
  storeLocation?: ProduceScanInput['storeLocation'],
  category?: string
): { regionId: string; regionName: string; confidence: 'high' | 'medium' | 'low' } {
  // Try to match origin sticker
  if (originSticker) {
    const normalized = originSticker.toLowerCase().replace(/[^a-z]/g, '_')
    for (const [key, value] of Object.entries(ORIGIN_TO_REGION)) {
      if (normalized.includes(key)) {
        return { regionId: value.regionId, regionName: value.regionName, confidence: 'high' }
      }
    }
    // Check for state names
    if (normalized.includes('florida') || normalized.includes('fl')) {
      return { regionId: 'central_florida', regionName: 'Florida', confidence: 'medium' }
    }
    if (normalized.includes('california') || normalized.includes('ca')) {
      return { regionId: 'california_central', regionName: 'California', confidence: 'medium' }
    }
    if (normalized.includes('washington') || normalized.includes('wa')) {
      return { regionId: 'washington_yakima', regionName: 'Washington', confidence: 'medium' }
    }
    if (normalized.includes('texas') || normalized.includes('tx')) {
      return { regionId: 'texas_rio_grande', regionName: 'Texas', confidence: 'medium' }
    }
  }

  // Infer from category + season + store location
  // This is a simplification - real system would have more sophisticated logic
  if (storeLocation && category) {
    // Florida stores in winter → likely FL citrus
    const month = new Date().getMonth()
    if (category === 'citrus' && storeLocation.state === 'FL' && month >= 10 || month <= 3) {
      return { regionId: 'indian_river_fl', regionName: 'Indian River, FL (inferred)', confidence: 'low' }
    }
  }

  return { regionId: 'unknown', regionName: 'Unknown', confidence: 'low' }
}

/**
 * Determine if product is in season based on category, region, and date
 */
export function inferSeasonality(
  category: string,
  regionId: string,
  scanDate: Date
): { isInSeason: boolean; confidence: 'high' | 'medium' | 'low'; reasoning: string } {
  const month = scanDate.getMonth() // 0-11

  // Simplified season logic - real system would use crop phenology
  const seasonRules: Record<string, { peakMonths: number[]; region?: string }> = {
    citrus: { peakMonths: [11, 0, 1, 2, 3] },  // Nov-Mar
    stone_fruit: { peakMonths: [5, 6, 7, 8] }, // Jun-Sep
    berry: { peakMonths: [4, 5, 6, 7] },       // May-Aug
    pome_fruit: { peakMonths: [8, 9, 10] },    // Sep-Nov
    melon: { peakMonths: [5, 6, 7, 8] },       // Jun-Sep
    tropical: { peakMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, // Year-round (imported)
    grape: { peakMonths: [6, 7, 8, 9, 10] },   // Jul-Nov
  }

  const rule = seasonRules[category]
  if (!rule) {
    return { isInSeason: true, confidence: 'low', reasoning: 'Unknown category seasonality' }
  }

  const isInSeason = rule.peakMonths.includes(month)
  return {
    isInSeason,
    confidence: isInSeason ? 'high' : 'medium',
    reasoning: isInSeason
      ? `${category} is in peak season (${formatMonth(month)})`
      : `${category} is out of peak season (${formatMonth(month)})`
  }
}

function formatMonth(month: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]
}

// =============================================================================
// Main Inference Function
// =============================================================================

/**
 * Infer produce profile from consumer scan data
 *
 * This is the produce equivalent of `inferBeefProfile` for livestock.
 */
export function inferProduceProfile(input: ProduceScanInput): ProduceInferenceResult {
  const dataGaps: string[] = []
  const reasoning: string[] = []

  // === PRODUCT IDENTIFICATION ===
  let productType = 'Unknown'
  let variety: string | undefined
  let cultivarId: string | undefined
  let cultivarName: string | undefined
  let cropType = 'unknown'
  let category = 'unknown'
  let isOrganic = false
  let isGmoRisk = false
  let expectedBrixRange: { min: number; max: number; optimal: number } | undefined

  // Try trade name first (more specific)
  if (input.tradeName) {
    const normalizedTrade = input.tradeName.toLowerCase().replace(/[^a-z]/g, '_')
    const tradeMatch = TRADE_NAME_TO_CULTIVAR[normalizedTrade]
    if (tradeMatch) {
      cultivarId = tradeMatch.cultivarId
      cultivarName = tradeMatch.cultivarName
      cropType = tradeMatch.cropType
      category = tradeMatch.category
      expectedBrixRange = tradeMatch.expectedBrix
      productType = tradeMatch.cropType.charAt(0).toUpperCase() + tradeMatch.cropType.slice(1)
      reasoning.push(`Trade name "${input.tradeName}" mapped to ${cultivarName} cultivar`)
    } else {
      reasoning.push(`Trade name "${input.tradeName}" not in database`)
      dataGaps.push('Unknown trade name - using generic inference')
    }
  }

  // Try PLU code
  if (input.pluCode) {
    const plu = parsePLUCode(input.pluCode)
    isOrganic = plu.isOrganic

    if (plu.isOrganic) {
      reasoning.push(`PLU prefix 9 indicates organic certification`)
    }

    const pluMatch = PLU_DATABASE[plu.baseCode]
    if (pluMatch) {
      productType = pluMatch.productType
      variety = pluMatch.variety
      cropType = pluMatch.cropType
      category = pluMatch.category
      isGmoRisk = pluMatch.isGmoRisk
      reasoning.push(`PLU ${input.pluCode} identified as ${productType} (${variety || 'generic'})`)
    } else {
      reasoning.push(`PLU ${input.pluCode} not in database`)
      dataGaps.push('Unknown PLU code')
    }
  }

  // === ORIGIN INFERENCE ===
  const origin = inferOriginRegion(input.originSticker, input.storeLocation, category)
  if (origin.confidence === 'low') {
    dataGaps.push('Origin unknown - soil and timing estimates less accurate')
  } else {
    reasoning.push(`Origin inferred: ${origin.regionName}`)
  }

  // === SEASONALITY INFERENCE ===
  const scanDate = input.scanDate ?? new Date()
  const seasonality = inferSeasonality(category, origin.regionId, scanDate)
  reasoning.push(seasonality.reasoning)

  // === HERITAGE INFERENCE (H) ===
  const heritage = inferHeritage(
    category,
    input.pluCode,
    input.tradeName,
    isOrganic
  )

  // === SOIL INFERENCE (S) ===
  let soil: SoilInference
  const floridaSoilZone = Object.entries(FLORIDA_SOIL_ZONES).find(
    ([key, zone]) => zone.regions.some(r => origin.regionId.includes(r))
  )
  if (floridaSoilZone) {
    const [zoneName, zone] = floridaSoilZone
    soil = {
      source: 'region_typical',
      soilType: zone.soilType,
      drainage: zone.drainage,
      terroirEffect: zone.terroirEffect,
      confidence: origin.confidence === 'high' ? 'high' : 'medium',
      reasoning: `${origin.regionName} is in Florida ${zoneName} zone: ${zone.terroirEffect}`,
    }
  } else {
    soil = {
      source: 'state_general',
      confidence: 'low',
      reasoning: `Region ${origin.regionName} soil profile unknown - using general estimates`,
    }
    dataGaps.push('Soil type unknown for region')
  }

  // === AGRICULTURAL INFERENCE (A) ===
  let agricultural: PracticeInference
  if (isOrganic) {
    agricultural = {
      source: 'certification',
      isOrganic: true,
      pestManagement: 'organic',
      confidence: 'high',
      reasoning: 'Organic certification verified by PLU prefix 9',
    }
  } else {
    // Use IPM adoption rate for category
    const ipmRate = IPM_ADOPTION_RATES[category as keyof typeof IPM_ADOPTION_RATES] ?? IPM_ADOPTION_RATES.default
    agricultural = {
      source: 'industry_statistics',
      isOrganic: false,
      pestManagement: ipmRate >= 0.7 ? 'ipm' : 'conventional',
      confidence: 'medium',
      reasoning: `Conventional produce - ${Math.round(ipmRate * 100)}% of ${category} growers use IPM`,
    }
  }

  // === TIMING INFERENCE (R) ===
  const shippingDays = ORIGIN_TO_REGION[origin.regionId]?.typicalShippingDays ?? 4
  const timing: TimingInference = {
    source: seasonality.isInSeason ? 'seasonal_assumption' : 'shipping_estimated',
    estimatedDaysSinceHarvest: shippingDays + 1,  // +1 for store handling
    isInPeakSeason: seasonality.isInSeason,
    freshnessScore: seasonality.isInSeason ? 'optimal' : 'good',
    confidence: seasonality.confidence,
    reasoning: `${seasonality.reasoning}. Estimated ${shippingDays} shipping days from ${origin.regionName}.`,
  }

  // === QUALITY INFERENCE (E) ===
  let quality: QualityInference
  if (input.brixMeasurement !== undefined) {
    const source = input.measurementMethod === 'lab' ? 'lab_tested'
      : input.measurementMethod === 'refractometer' ? 'refractometer'
      : 'cv_estimated'
    quality = {
      source,
      brixEstimate: input.brixMeasurement,
      qualityScore: input.brixMeasurement >= 14 ? 'exceptional'
        : input.brixMeasurement >= 12 ? 'excellent'
        : input.brixMeasurement >= 10 ? 'good'
        : 'average',
      confidence: source === 'lab_tested' ? 'high' : source === 'refractometer' ? 'medium' : 'low',
      reasoning: `Actual Brix measurement: ${input.brixMeasurement}`,
    }
  } else if (expectedBrixRange) {
    quality = {
      source: 'cultivar_expected',
      brixRange: [expectedBrixRange.min, expectedBrixRange.max],
      brixEstimate: expectedBrixRange.optimal,
      qualityScore: expectedBrixRange.optimal >= 14 ? 'excellent' : 'good',
      confidence: 'medium',
      reasoning: `${cultivarName} typical Brix range: ${expectedBrixRange.min}-${expectedBrixRange.max}`,
    }
  } else {
    quality = {
      source: 'region_seasonal',
      confidence: 'low',
      reasoning: 'No cultivar-specific quality data available',
    }
    dataGaps.push('No Brix measurement or cultivar-specific expectations')
  }

  // === OVERALL CONFIDENCE ===
  const confidenceScores = [heritage.confidence, soil.confidence, agricultural.confidence, timing.confidence, quality.confidence]
  const avgConfidence = confidenceScores.filter(c => c === 'high').length / confidenceScores.length
  const overallConfidence: 'high' | 'medium' | 'low' =
    avgConfidence >= 0.6 ? 'high' : avgConfidence >= 0.3 ? 'medium' : 'low'

  // === DETERMINE NON-GMO STATUS ===
  let isNonGmo: boolean | 'inferred' | 'unknown' = 'unknown'
  if (isOrganic) {
    isNonGmo = true  // Organic requires non-GMO
  } else if (isGmoRisk) {
    isNonGmo = 'unknown'  // Category has GMO varieties
  } else {
    isNonGmo = 'inferred'  // Most produce is non-GMO
  }

  return {
    productType,
    variety,
    cultivarId,
    cultivarName,
    cropType,
    category,
    isOrganic,
    isNonGmo,
    isGmoRisk,
    originRegion: origin.regionName,
    regionId: origin.regionId,
    isInSeason: seasonality.isInSeason,
    seasonConfidence: seasonality.confidence,
    estimatedDaysSinceHarvest: timing.estimatedDaysSinceHarvest,
    expectedBrixRange,
    heritage,
    soil,
    agricultural,
    timing,
    quality,
    overallConfidence,
    dataGaps,
    reasoning,
  }
}

// =============================================================================
// Bridge to Predictor
// =============================================================================

/**
 * Convert inference result to QualityPredictionInput
 */
export function inferenceToProducePredictorInput(
  inference: ProduceInferenceResult,
  scanDate?: Date
): QualityPredictionInput | null {
  // Need at least cultivarId and regionId for prediction
  if (!inference.cultivarId || !inference.regionId || inference.regionId === 'unknown') {
    return null
  }

  const input: QualityPredictionInput = {
    cultivarId: inference.cultivarId,
    regionId: inference.regionId,
    currentDate: scanDate ?? new Date(),

    practices: {
      pestManagement: inference.agricultural.pestManagement === 'organic' ? 'organic'
        : inference.agricultural.pestManagement === 'ipm' ? 'ipm'
        : 'conventional',
    },
  }

  // Add Brix measurement if available
  if (inference.quality.brixEstimate) {
    input.measurements = {
      brix: inference.quality.brixEstimate,
      daysSinceHarvest: inference.estimatedDaysSinceHarvest,
    }
  }

  return input
}

/**
 * Main entry point: Predict quality from consumer scan
 *
 * This is the produce equivalent of `predictFromClaims` for livestock.
 */
export function predictProduceFromScan(
  input: ProduceScanInput
): ProducePredictionFromScanResult {
  // First, infer the produce profile
  const inference = inferProduceProfile(input)

  // Try to convert to predictor input
  const predictorInput = inferenceToProducePredictorInput(inference, input.scanDate)

  if (!predictorInput) {
    return {
      inference,
      prediction: null,
      canPredict: false,
      reasonCannotPredict: inference.cultivarId
        ? 'Unknown origin region - cannot run GDD-based prediction'
        : 'Unknown cultivar - cannot determine genetic quality ceiling',
    }
  }

  // Run the prediction
  const prediction = predictQuality(predictorInput)

  return {
    inference,
    prediction,
    canPredict: true,
  }
}

// =============================================================================
// Quick Lookup Helpers
// =============================================================================

/**
 * Quick cultivar lookup from trade name
 */
export function getCultivarFromTradeName(tradeName: string): string | null {
  const normalized = tradeName.toLowerCase().replace(/[^a-z]/g, '_')
  return TRADE_NAME_TO_CULTIVAR[normalized]?.cultivarId ?? null
}

/**
 * Quick product lookup from PLU
 */
export function getProductFromPLU(pluCode: string): {
  productType: string
  variety?: string
  isOrganic: boolean
} | null {
  const plu = parsePLUCode(pluCode)
  const match = PLU_DATABASE[plu.baseCode]
  if (!match) return null
  return {
    productType: match.productType,
    variety: match.variety,
    isOrganic: plu.isOrganic,
  }
}

// =============================================================================
// TYPED SHARE PROFILE CONVERSION
// =============================================================================

import type {
  ShareProfile,
  SoilHealthAttributes,
  HeritageCultivarsAttributes,
  AgriculturalPracticesAttributes,
  RipenAttributes,
  EnrichAttributes,
  Confidence,
} from '../types/share-pillar-attributes'

/**
 * Convert ProduceInferenceResult to typed ShareProfile
 */
export function toShareProfile(inference: ProduceInferenceResult): ShareProfile {
  // S - Soil Health
  const soilHealth: SoilHealthAttributes = {
    pillar: 'S',
    regionId: inference.regionId ?? 'unknown',
    regionName: inference.originRegion ?? 'Unknown',
    soilType: inference.soil.soilType,
    drainage: inference.soil.drainage ?? 'unknown',
    terroirEffect: inference.soil.terroirEffect,
    qualityIndicator: inference.soil.soilType?.includes('Ridge')
      ? 'premium'
      : inference.soil.soilType?.includes('flatwoods')
        ? inference.soil.terroirEffect?.includes('famous brand') ? 'premium' : 'standard'
        : 'unknown',
    confidence: inference.soil.confidence,
    source: inference.soil.source,
    reasoning: inference.soil.reasoning,
  }

  // H - Heritage Cultivars
  const heritageCultivars: HeritageCultivarsAttributes = {
    pillar: 'H',
    productType: inference.productType,
    variety: inference.variety,
    cropType: inference.cropType,
    category: inference.category,
    cultivarId: inference.cultivarId,
    cultivarName: inference.cultivarName,
    geneticCeiling: inference.expectedBrixRange
      ? { brixMax: inference.expectedBrixRange.max }
      : undefined,
    isNonGmo: inference.isNonGmo,
    isGmoRisk: inference.isGmoRisk,
    confidence: inference.heritage.confidence,
    source: inference.heritage.source,
    reasoning: inference.heritage.reasoning,
  }

  // A - Agricultural Practices
  const agriculturalPractices: AgriculturalPracticesAttributes = {
    pillar: 'A',
    isOrganic: inference.isOrganic,
    pestManagement: inference.agricultural.pestManagement ?? 'unknown',
    ipmProbability: inference.agricultural.source === 'industry_statistics'
      ? (IPM_ADOPTION_RATES[inference.category as keyof typeof IPM_ADOPTION_RATES] ?? 0.7)
      : undefined,
    confidence: inference.agricultural.confidence,
    source: inference.agricultural.source,
    reasoning: inference.agricultural.reasoning,
  }

  // R - Ripen
  const ripen: RipenAttributes = {
    pillar: 'R',
    isInSeason: inference.isInSeason,
    isInPeakSeason: inference.timing.isInPeakSeason,
    season: inference.isInSeason ? 'peak' : 'off_season',
    estimatedDaysSinceHarvest: inference.estimatedDaysSinceHarvest,
    freshnessScore: inference.timing.freshnessScore ?? 'unknown',
    confidence: inference.timing.confidence,
    source: inference.timing.source,
    reasoning: inference.timing.reasoning,
  }

  // E - Enrich
  const enrich: EnrichAttributes = {
    pillar: 'E',
    brixMeasurement: inference.quality.source === 'refractometer' || inference.quality.source === 'lab_tested'
      ? inference.quality.brixEstimate
      : undefined,
    brixEstimate: inference.quality.brixEstimate,
    brixRange: inference.expectedBrixRange,
    qualityScore: mapQualityScore(inference.quality.qualityScore),
    measurementMethod: mapMeasurementMethod(inference.quality.source),
    confidence: inference.quality.confidence,
    source: inference.quality.source ?? 'unknown',
    reasoning: inference.quality.reasoning ?? 'No quality data available',
  }

  return {
    soilHealth,
    heritageCultivars,
    agriculturalPractices,
    ripen,
    enrich,
    overallConfidence: inference.overallConfidence,
    overallQualityTier: enrich.brixEstimate
      ? enrich.brixEstimate >= 14 ? 'artisan'
        : enrich.brixEstimate >= 12 ? 'premium'
        : enrich.brixEstimate >= 10 ? 'standard'
        : 'commodity'
      : undefined,
    dataGaps: inference.dataGaps,
    reasoning: inference.reasoning,
  }
}

function mapQualityScore(score?: string): 'exceptional' | 'good' | 'fair' | 'poor' | 'unknown' {
  switch (score) {
    case 'exceptional': return 'exceptional'
    case 'excellent': return 'exceptional'
    case 'good': return 'good'
    case 'average': return 'fair'
    case 'poor': return 'poor'
    default: return 'unknown'
  }
}

function mapMeasurementMethod(source?: string): 'refractometer' | 'cv_estimate' | 'lab_analysis' | 'cultivar_expected' | 'unknown' {
  switch (source) {
    case 'refractometer': return 'refractometer'
    case 'cv_estimated': return 'cv_estimate'
    case 'lab_tested': return 'lab_analysis'
    case 'cultivar_expected': return 'cultivar_expected'
    default: return 'unknown'
  }
}

/**
 * Get a SHARE profile directly from a consumer scan
 *
 * This is the main entry point for getting typed SHARE pillar attributes
 * from a consumer scan.
 */
export function getShareProfileFromScan(input: ProduceScanInput): ShareProfile {
  const inference = inferProduceProfile(input)
  return toShareProfile(inference)
}
