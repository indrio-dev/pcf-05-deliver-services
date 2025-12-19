/**
 * Transformation Predictor - Coffee, Tea, Cacao, Olive Oil
 *
 * Implements the CategoryPredictor interface for transformed products
 * that undergo processing to achieve final quality.
 *
 * Primary focus: COFFEE (Cupping Score as primary metric)
 *
 * THEORETICAL FRAMEWORK (see seed-nutrition-theory.ts):
 *
 * 1. FRUIT-SEED CORRELATION: Cherry Brix correlates with bean nutrient accumulation
 *    because they're parallel sinks from the same photosynthetic source.
 *    A tree accumulating well fills BOTH fruit and seed.
 *
 * 2. TWO-STAGE TRANSFORMATION MODEL:
 *    Stage 1 (Farm/Mill): Cherry Brix × Processing Method → Green Bean Quality
 *    Stage 2 (Roaster): Green Bean Quality × Roast Level → Cupping Score
 *
 * 3. PROCESSING AS BRIX UTILIZATION:
 *    - Natural process: 90-95% of cherry Brix contributes to bean quality
 *    - Washed process: 5-10% (cherry sugars removed before drying)
 *    - Honey process: 35-85% (variable mucilage retention)
 *
 * 4. SHARE Framework for Coffee:
 *    - Soil: Terroir (altitude, volcanic soil, microclimate)
 *    - Heritage: Coffee variety (Gesha, Bourbon, Typica, etc.)
 *    - Agricultural: Processing method (washed, natural, honey)
 *    - Ripen: Tree maturity + cherry ripeness at harvest (fruit Brix)
 *    - Enrich: Cupping score (SCA 0-100 scale)
 *
 * SCA Cupping Score Scale:
 * - 90-100: Outstanding (Specialty - World class)
 * - 85-89.99: Excellent (Specialty - Top tier)
 * - 80-84.99: Very Good (Specialty threshold)
 * - 70-79.99: Good (Premium commercial)
 * - 60-69.99: Fair (Commercial grade)
 * - <60: Not specialty grade
 *
 * Research sources:
 * - Specialty Coffee Association (SCA) Cupping Protocols
 * - World Coffee Research Arabica Variety Catalog
 * - Cup of Excellence scoring methodology
 * - Cacao pod maturity → bean polyphenol correlation (PMC, 2018)
 * - Plant source-sink physiology (BioNutrient Food Association)
 */

import type {
  CategoryPredictor,
  PredictionInput,
  PredictionResult,
  ProductCategory,
  PrimaryMetricType,
  TransformedPredictionInput,
  SoilContribution,
  HeritageContribution,
  AgriculturalContribution,
  RipenContribution,
  EnrichContribution,
  ModelValidationStatus,
} from './predictor-interface'

import type { QualityTier } from '../constants/quality-tiers'

import {
  PROCESSING_BRIX_UTILIZATION,
  estimateSeedTierFromFruitBrix,
  getTreeMaturityStage,
  calculateGreenBeanQuality,
  type TreeMaturityModel,
} from './seed-nutrition-theory'

// =============================================================================
// COFFEE VARIETY DATABASE
// =============================================================================

/**
 * Coffee variety data with quality characteristics
 */
export interface CoffeeVariety {
  id: string
  name: string
  species: 'arabica' | 'robusta' | 'liberica'

  // Genetic lineage
  parentage?: string
  heritageIntent: 'heirloom' | 'selection' | 'hybrid' | 'mutation' | 'introgressed'

  // Quality potential (cupping score range)
  cuppingPotential: {
    min: number
    max: number
    typical: number
  }

  // Flavor characteristics
  flavorProfile: string
  acidity: 'low' | 'medium' | 'high' | 'very_high'
  body: 'light' | 'medium' | 'full' | 'heavy'

  // Growing characteristics
  altitudeOptimal: { min: number; max: number } // meters
  yieldLevel: 'low' | 'medium' | 'high'
  diseaseResistance: 'low' | 'medium' | 'high'

  // Quality tier baseline
  qualityTier: QualityTier
  notes?: string
}

/**
 * Coffee variety database
 */
export const COFFEE_VARIETIES: Record<string, CoffeeVariety> = {
  // === PREMIUM HEIRLOOM VARIETIES ===
  gesha: {
    id: 'gesha',
    name: 'Gesha (Geisha)',
    species: 'arabica',
    parentage: 'Ethiopian landrace from Gesha village',
    heritageIntent: 'heirloom',
    cuppingPotential: { min: 86, max: 96, typical: 90 },
    flavorProfile: 'Jasmine, bergamot, tropical fruit, tea-like',
    acidity: 'very_high',
    body: 'light',
    altitudeOptimal: { min: 1600, max: 2200 },
    yieldLevel: 'low',
    diseaseResistance: 'low',
    qualityTier: 'artisan',
    notes: 'The most prized coffee variety. Record auction prices. Panama made it famous.',
  },

  bourbon: {
    id: 'bourbon',
    name: 'Bourbon',
    species: 'arabica',
    parentage: 'Natural mutation of Typica on Bourbon Island (Réunion)',
    heritageIntent: 'heirloom',
    cuppingPotential: { min: 82, max: 90, typical: 85 },
    flavorProfile: 'Caramel, chocolate, fruit, balanced sweetness',
    acidity: 'high',
    body: 'medium',
    altitudeOptimal: { min: 1200, max: 2000 },
    yieldLevel: 'medium',
    diseaseResistance: 'low',
    qualityTier: 'premium',
    notes: 'Foundation variety. Many quality selections derived from it.',
  },

  typica: {
    id: 'typica',
    name: 'Typica',
    species: 'arabica',
    parentage: 'Original cultivated Arabica from Ethiopia via Yemen',
    heritageIntent: 'heirloom',
    cuppingPotential: { min: 82, max: 89, typical: 84 },
    flavorProfile: 'Clean, sweet, balanced, elegant',
    acidity: 'medium',
    body: 'medium',
    altitudeOptimal: { min: 1200, max: 2000 },
    yieldLevel: 'low',
    diseaseResistance: 'low',
    qualityTier: 'premium',
    notes: 'The original. All other Arabica descended from Typica or Bourbon.',
  },

  ethiopian_heirloom: {
    id: 'ethiopian_heirloom',
    name: 'Ethiopian Heirloom',
    species: 'arabica',
    parentage: 'Diverse Ethiopian landraces',
    heritageIntent: 'heirloom',
    cuppingPotential: { min: 84, max: 94, typical: 88 },
    flavorProfile: 'Floral, citrus, berry, wine-like complexity',
    acidity: 'very_high',
    body: 'light',
    altitudeOptimal: { min: 1500, max: 2200 },
    yieldLevel: 'low',
    diseaseResistance: 'medium',
    qualityTier: 'artisan',
    notes: 'Thousands of wild varieties. Birthplace of coffee. Yirgacheffe, Sidamo, Harrar.',
  },

  // === QUALITY SELECTIONS ===
  sl28: {
    id: 'sl28',
    name: 'SL28',
    species: 'arabica',
    parentage: 'Selection from Tanganyika (Tanzania) by Scott Labs',
    heritageIntent: 'selection',
    cuppingPotential: { min: 84, max: 92, typical: 87 },
    flavorProfile: 'Blackcurrant, citrus, complex, wine-like',
    acidity: 'very_high',
    body: 'medium',
    altitudeOptimal: { min: 1400, max: 2100 },
    yieldLevel: 'medium',
    diseaseResistance: 'low',
    qualityTier: 'artisan',
    notes: 'Kenyan specialty. Famous for blackcurrant notes.',
  },

  sl34: {
    id: 'sl34',
    name: 'SL34',
    species: 'arabica',
    parentage: 'Selection from French Mission by Scott Labs',
    heritageIntent: 'selection',
    cuppingPotential: { min: 83, max: 90, typical: 86 },
    flavorProfile: 'Stone fruit, citrus, heavy body',
    acidity: 'high',
    body: 'full',
    altitudeOptimal: { min: 1400, max: 2000 },
    yieldLevel: 'medium',
    diseaseResistance: 'medium',
    qualityTier: 'premium',
    notes: 'Excellent at lower altitudes than SL28.',
  },

  pacamara: {
    id: 'pacamara',
    name: 'Pacamara',
    species: 'arabica',
    parentage: 'Pacas × Maragogipe (El Salvador)',
    heritageIntent: 'hybrid',
    cuppingPotential: { min: 84, max: 92, typical: 87 },
    flavorProfile: 'Floral, citrus, chocolate, complex',
    acidity: 'high',
    body: 'full',
    altitudeOptimal: { min: 1200, max: 1800 },
    yieldLevel: 'low',
    diseaseResistance: 'low',
    qualityTier: 'artisan',
    notes: 'Large beans. Cup of Excellence winner.',
  },

  caturra: {
    id: 'caturra',
    name: 'Caturra',
    species: 'arabica',
    parentage: 'Natural mutation of Bourbon (Brazil)',
    heritageIntent: 'mutation',
    cuppingPotential: { min: 80, max: 87, typical: 83 },
    flavorProfile: 'Citrus, bright, clean, medium sweetness',
    acidity: 'high',
    body: 'medium',
    altitudeOptimal: { min: 1200, max: 1800 },
    yieldLevel: 'high',
    diseaseResistance: 'medium',
    qualityTier: 'premium',
    notes: 'Compact plant. High yield with good quality.',
  },

  catuai: {
    id: 'catuai',
    name: 'Catuai',
    species: 'arabica',
    parentage: 'Caturra × Mundo Novo (Brazil)',
    heritageIntent: 'hybrid',
    cuppingPotential: { min: 79, max: 85, typical: 82 },
    flavorProfile: 'Nutty, chocolate, balanced, mild',
    acidity: 'medium',
    body: 'medium',
    altitudeOptimal: { min: 1000, max: 1600 },
    yieldLevel: 'high',
    diseaseResistance: 'medium',
    qualityTier: 'standard',
    notes: 'Workhorse variety. Good balance of yield and quality.',
  },

  // === DISEASE-RESISTANT (Often Lower Quality) ===
  castillo: {
    id: 'castillo',
    name: 'Castillo',
    species: 'arabica',
    parentage: 'Caturra × Timor Hybrid (Colombia)',
    heritageIntent: 'introgressed',
    cuppingPotential: { min: 78, max: 84, typical: 81 },
    flavorProfile: 'Clean, sweet, mild acidity',
    acidity: 'medium',
    body: 'medium',
    altitudeOptimal: { min: 1000, max: 1800 },
    yieldLevel: 'high',
    diseaseResistance: 'high',
    qualityTier: 'standard',
    notes: 'Colombian rust-resistant. Quality improving with newer generations.',
  },

  colombia: {
    id: 'colombia',
    name: 'Colombia (Variedad Colombia)',
    species: 'arabica',
    parentage: 'Caturra × Timor Hybrid',
    heritageIntent: 'introgressed',
    cuppingPotential: { min: 77, max: 83, typical: 80 },
    flavorProfile: 'Balanced, mild, clean',
    acidity: 'medium',
    body: 'medium',
    altitudeOptimal: { min: 1000, max: 1700 },
    yieldLevel: 'high',
    diseaseResistance: 'high',
    qualityTier: 'standard',
    notes: 'Predecessor to Castillo. Good commercial variety.',
  },

  catimor: {
    id: 'catimor',
    name: 'Catimor',
    species: 'arabica',
    parentage: 'Caturra × Timor Hybrid',
    heritageIntent: 'introgressed',
    cuppingPotential: { min: 74, max: 82, typical: 78 },
    flavorProfile: 'Earthy, herbal, can be harsh',
    acidity: 'low',
    body: 'full',
    altitudeOptimal: { min: 800, max: 1500 },
    yieldLevel: 'high',
    diseaseResistance: 'high',
    qualityTier: 'commodity',
    notes: 'High yield, disease resistant, but quality often suffers.',
  },

  // === ROBUSTA (For Completeness) ===
  robusta: {
    id: 'robusta',
    name: 'Robusta (Canephora)',
    species: 'robusta',
    heritageIntent: 'heirloom',
    cuppingPotential: { min: 60, max: 75, typical: 68 },
    flavorProfile: 'Earthy, rubbery, high caffeine, bitter',
    acidity: 'low',
    body: 'heavy',
    altitudeOptimal: { min: 0, max: 800 },
    yieldLevel: 'high',
    diseaseResistance: 'high',
    qualityTier: 'commodity',
    notes: 'Different species. Used in blends and instant coffee. Fine Robusta emerging.',
  },
}

/**
 * Get a coffee variety by ID
 */
export function getCoffeeVariety(varietyId: string): CoffeeVariety | undefined {
  return COFFEE_VARIETIES[varietyId]
}

// =============================================================================
// PROCESSING METHOD DATABASE
// =============================================================================

export interface ProcessingMethod {
  id: string
  name: string
  description: string
  cuppingModifier: number // Impact on score
  flavorImpact: string
  clarityImpact: 'enhances' | 'neutral' | 'reduces'
  bodyImpact: 'lighter' | 'neutral' | 'fuller'
  riskLevel: 'low' | 'medium' | 'high'
  /**
   * How much of the cherry's Brix contributes to bean quality
   * Natural = high (sugars ferment into bean), Washed = low (sugars removed)
   */
  brixUtilization: number
}

export const PROCESSING_METHODS: Record<string, ProcessingMethod> = {
  washed: {
    id: 'washed',
    name: 'Washed (Wet Process)',
    description: 'Cherry skin and mucilage removed before drying',
    cuppingModifier: 0,
    flavorImpact: 'Clean, bright, allows terroir and variety to shine',
    clarityImpact: 'enhances',
    bodyImpact: 'lighter',
    riskLevel: 'low',
    brixUtilization: 0.10, // Cherry sugars removed - minimal contribution
  },

  natural: {
    id: 'natural',
    name: 'Natural (Dry Process)',
    description: 'Whole cherry dried with fruit intact',
    cuppingModifier: 1,
    flavorImpact: 'Fruity, wine-like, fermented notes, heavy body',
    clarityImpact: 'reduces',
    bodyImpact: 'fuller',
    riskLevel: 'high',
    brixUtilization: 0.95, // Maximum sugar contact - ferments into bean
  },

  honey: {
    id: 'honey',
    name: 'Honey Process',
    description: 'Skin removed, some mucilage left during drying',
    cuppingModifier: 0.5,
    flavorImpact: 'Sweet, balanced between washed and natural',
    clarityImpact: 'neutral',
    bodyImpact: 'neutral',
    riskLevel: 'medium',
    brixUtilization: 0.50, // Moderate mucilage retention
  },

  black_honey: {
    id: 'black_honey',
    name: 'Black Honey',
    description: 'Most mucilage retained (80-100%)',
    cuppingModifier: 1,
    flavorImpact: 'Very sweet, fruit-forward, complex fermentation',
    clarityImpact: 'reduces',
    bodyImpact: 'fuller',
    riskLevel: 'high',
    brixUtilization: 0.85, // Near-maximum mucilage
  },

  red_honey: {
    id: 'red_honey',
    name: 'Red Honey',
    description: 'Moderate mucilage retained (50-75%)',
    cuppingModifier: 0.75,
    flavorImpact: 'Sweet, fruit notes, medium body',
    clarityImpact: 'neutral',
    bodyImpact: 'neutral',
    riskLevel: 'medium',
    brixUtilization: 0.65, // Good mucilage retention
  },

  yellow_honey: {
    id: 'yellow_honey',
    name: 'Yellow Honey',
    description: 'Less mucilage retained (25-50%)',
    cuppingModifier: 0.25,
    flavorImpact: 'Clean with hint of sweetness',
    clarityImpact: 'enhances',
    bodyImpact: 'lighter',
    riskLevel: 'low',
    brixUtilization: 0.35, // Lower mucilage
  },

  anaerobic: {
    id: 'anaerobic',
    name: 'Anaerobic Fermentation',
    description: 'Fermented in sealed tanks without oxygen',
    cuppingModifier: 1.5,
    flavorImpact: 'Intense fruit, wine, unique fermentation flavors',
    clarityImpact: 'neutral',
    bodyImpact: 'fuller',
    riskLevel: 'high',
    brixUtilization: 0.70, // Variable but significant
  },

  carbonic_maceration: {
    id: 'carbonic_maceration',
    name: 'Carbonic Maceration',
    description: 'CO2-injected fermentation (wine technique)',
    cuppingModifier: 1.5,
    flavorImpact: 'Vibrant fruit, candy-like sweetness',
    clarityImpact: 'neutral',
    bodyImpact: 'neutral',
    riskLevel: 'high',
    brixUtilization: 0.75, // Good fermentation contact
  },
}

export function getProcessingMethod(methodId: string): ProcessingMethod | undefined {
  return PROCESSING_METHODS[methodId]
}

// =============================================================================
// ORIGIN REGION DATABASE
// =============================================================================

export interface CoffeeOrigin {
  id: string
  name: string
  country: string
  altitude: { min: number; max: number }
  flavorProfile: string
  typicalVarieties: string[]
  harvestMonths: string[] // Peak harvest months
  qualityTier: QualityTier
  notes?: string
}

export const COFFEE_ORIGINS: Record<string, CoffeeOrigin> = {
  ethiopia_yirgacheffe: {
    id: 'ethiopia_yirgacheffe',
    name: 'Yirgacheffe',
    country: 'Ethiopia',
    altitude: { min: 1700, max: 2200 },
    flavorProfile: 'Floral, citrus, tea-like, bergamot',
    typicalVarieties: ['ethiopian_heirloom'],
    harvestMonths: ['10', '11', '12', '1'],
    qualityTier: 'artisan',
    notes: 'Birthplace of coffee. Renowned for floral, complex coffees.',
  },

  ethiopia_sidamo: {
    id: 'ethiopia_sidamo',
    name: 'Sidamo',
    country: 'Ethiopia',
    altitude: { min: 1500, max: 2200 },
    flavorProfile: 'Berry, wine, citrus, floral',
    typicalVarieties: ['ethiopian_heirloom'],
    harvestMonths: ['10', '11', '12', '1'],
    qualityTier: 'artisan',
  },

  kenya_nyeri: {
    id: 'kenya_nyeri',
    name: 'Nyeri',
    country: 'Kenya',
    altitude: { min: 1400, max: 2000 },
    flavorProfile: 'Blackcurrant, tomato, grapefruit, complex acidity',
    typicalVarieties: ['sl28', 'sl34'],
    harvestMonths: ['10', '11', '12'],
    qualityTier: 'artisan',
    notes: 'Known for SL28/SL34 and intense, complex flavors.',
  },

  panama_boquete: {
    id: 'panama_boquete',
    name: 'Boquete',
    country: 'Panama',
    altitude: { min: 1200, max: 1900 },
    flavorProfile: 'Jasmine, tropical fruit, clean, elegant',
    typicalVarieties: ['gesha', 'caturra', 'catuai'],
    harvestMonths: ['1', '2', '3'],
    qualityTier: 'artisan',
    notes: 'Home of Hacienda La Esmeralda Gesha. Record auction prices.',
  },

  colombia_huila: {
    id: 'colombia_huila',
    name: 'Huila',
    country: 'Colombia',
    altitude: { min: 1200, max: 2000 },
    flavorProfile: 'Caramel, citrus, clean, balanced',
    typicalVarieties: ['caturra', 'castillo', 'bourbon'],
    harvestMonths: ['4', '5', '10', '11'],
    qualityTier: 'premium',
    notes: 'Most awarded Colombian department in Cup of Excellence.',
  },

  colombia_narino: {
    id: 'colombia_narino',
    name: 'Nariño',
    country: 'Colombia',
    altitude: { min: 1500, max: 2300 },
    flavorProfile: 'Bright, complex, citrus, floral',
    typicalVarieties: ['caturra', 'castillo', 'typica'],
    harvestMonths: ['4', '5', '6'],
    qualityTier: 'artisan',
    notes: 'High altitude, equatorial. Intense flavors.',
  },

  guatemala_antigua: {
    id: 'guatemala_antigua',
    name: 'Antigua',
    country: 'Guatemala',
    altitude: { min: 1500, max: 1700 },
    flavorProfile: 'Chocolate, spice, balanced, smoky',
    typicalVarieties: ['bourbon', 'caturra', 'catuai'],
    harvestMonths: ['12', '1', '2', '3'],
    qualityTier: 'premium',
    notes: 'Volcanic soil. Historic coffee region.',
  },

  costa_rica_tarrazu: {
    id: 'costa_rica_tarrazu',
    name: 'Tarrazú',
    country: 'Costa Rica',
    altitude: { min: 1200, max: 1900 },
    flavorProfile: 'Bright acidity, honey, citrus, clean',
    typicalVarieties: ['caturra', 'catuai'],
    harvestMonths: ['11', '12', '1', '2'],
    qualityTier: 'premium',
    notes: 'Honey processing pioneers. Clean, bright coffees.',
  },

  brazil_cerrado: {
    id: 'brazil_cerrado',
    name: 'Cerrado Mineiro',
    country: 'Brazil',
    altitude: { min: 800, max: 1200 },
    flavorProfile: 'Nutty, chocolate, low acidity, full body',
    typicalVarieties: ['catuai', 'bourbon', 'mundo_novo'],
    harvestMonths: ['5', '6', '7', '8'],
    qualityTier: 'standard',
    notes: 'Largest coffee producer. Good for espresso blends.',
  },

  sumatra_aceh: {
    id: 'sumatra_aceh',
    name: 'Aceh (Gayo)',
    country: 'Indonesia',
    altitude: { min: 1100, max: 1600 },
    flavorProfile: 'Earthy, herbal, full body, low acidity, spicy',
    typicalVarieties: ['typica', 'catimor'],
    harvestMonths: ['9', '10', '11', '12'],
    qualityTier: 'standard',
    notes: 'Wet-hulled processing creates distinctive earthy profile.',
  },
}

export function getCoffeeOrigin(originId: string): CoffeeOrigin | undefined {
  return COFFEE_ORIGINS[originId]
}

// =============================================================================
// ROAST LEVEL IMPACT
// =============================================================================

export interface RoastLevel {
  id: string
  name: string
  cuppingModifier: number
  preservesOrigin: boolean
  description: string
}

export const ROAST_LEVELS: Record<string, RoastLevel> = {
  light: {
    id: 'light',
    name: 'Light Roast',
    cuppingModifier: 0,
    preservesOrigin: true,
    description: 'Preserves origin character. Bright acidity. Best for high-quality beans.',
  },
  medium_light: {
    id: 'medium_light',
    name: 'Medium-Light',
    cuppingModifier: 0,
    preservesOrigin: true,
    description: 'Balanced. Still shows origin with some roast development.',
  },
  medium: {
    id: 'medium',
    name: 'Medium Roast',
    cuppingModifier: -0.5,
    preservesOrigin: true,
    description: 'Balanced acidity and body. Origin still evident.',
  },
  medium_dark: {
    id: 'medium_dark',
    name: 'Medium-Dark',
    cuppingModifier: -1,
    preservesOrigin: false,
    description: 'Roast character emerging. Origin becomes secondary.',
  },
  dark: {
    id: 'dark',
    name: 'Dark Roast',
    cuppingModifier: -2,
    preservesOrigin: false,
    description: 'Roast dominates. Masks origin character. Higher body.',
  },
  very_dark: {
    id: 'very_dark',
    name: 'Very Dark (French/Italian)',
    cuppingModifier: -4,
    preservesOrigin: false,
    description: 'Burnt, smoky. Origin indistinguishable. Not for specialty.',
  },
}

export function getRoastLevel(roastId: string): RoastLevel | undefined {
  return ROAST_LEVELS[roastId]
}

// =============================================================================
// CUPPING SCORE TIER CLASSIFICATION
// =============================================================================

/**
 * SCA Cupping Score Quality Tiers
 */
export function getCuppingTier(score: number): {
  tier: QualityTier
  scaGrade: string
  description: string
} {
  if (score >= 90) {
    return {
      tier: 'artisan',
      scaGrade: 'Outstanding',
      description: 'World-class specialty (90+ SCA)',
    }
  }
  if (score >= 85) {
    return {
      tier: 'artisan',
      scaGrade: 'Excellent',
      description: 'Top-tier specialty (85-89.99 SCA)',
    }
  }
  if (score >= 80) {
    return {
      tier: 'premium',
      scaGrade: 'Very Good',
      description: 'Specialty grade (80-84.99 SCA)',
    }
  }
  if (score >= 70) {
    return {
      tier: 'standard',
      scaGrade: 'Good',
      description: 'Premium commercial (70-79.99 SCA)',
    }
  }
  return {
    tier: 'commodity',
    scaGrade: 'Below Specialty',
    description: 'Commercial grade (<70 SCA)',
  }
}

// =============================================================================
// TRANSFORMATION PREDICTOR IMPLEMENTATION
// =============================================================================

export class TransformationPredictor implements CategoryPredictor {
  category: ProductCategory = 'transformed'
  validationStatus: ModelValidationStatus = 'inferred'

  canHandle(input: PredictionInput): boolean {
    return input.category === 'transformed'
  }

  getPrimaryMetricType(): PrimaryMetricType {
    return 'cupping_score'
  }

  predict(input: PredictionInput): PredictionResult {
    const transformedInput = input as TransformedPredictionInput

    // Route to appropriate predictor based on product type
    switch (transformedInput.productType) {
      case 'coffee':
        return this.predictCoffee(transformedInput)
      case 'cacao':
        return this.predictCacao(transformedInput)
      case 'tea':
      case 'olive_oil':
      default:
        return this.createPlaceholder(transformedInput)
    }
  }

  // ===========================================================================
  // Coffee Prediction
  // ===========================================================================

  private predictCoffee(input: TransformedPredictionInput): PredictionResult {
    // Get variety data
    const variety = input.variety
      ? getCoffeeVariety(input.variety)
      : undefined

    // Get origin data
    const origin = input.originRegion
      ? getCoffeeOrigin(input.originRegion)
      : undefined

    // Get processing method
    const processing = input.processingMethod
      ? getProcessingMethod(input.processingMethod)
      : undefined

    // Get roast level
    const roast = input.roastLevel
      ? getRoastLevel(input.roastLevel)
      : undefined

    // Calculate SHARE pillar contributions
    const soil = this.calculateCoffeeSoil(input, origin)
    const heritage = this.calculateCoffeeHeritage(input, variety)
    const agricultural = this.calculateCoffeeAgricultural(input, processing)
    const ripen = this.calculateCoffeeRipen(input, variety, origin)

    // Calculate predicted cupping score
    const predictedScore = this.calculateCuppingScore(input, variety, origin, processing, roast)

    // Use actual measurement if available
    const finalScore = input.measurements?.cuppingScore ?? predictedScore

    // Get quality tier
    const tierInfo = getCuppingTier(finalScore)

    // Calculate confidence
    const confidence = this.calculateCoffeeConfidence(input, variety, origin)

    // Create Enrich pillar
    const enrich = this.calculateCoffeeEnrich(input, finalScore, predictedScore, roast, processing)

    // Calculate overall quality score (normalized 0-100)
    const qualityScore = this.cuppingToScore(finalScore)

    // Collect warnings
    const warnings = this.collectCoffeeWarnings(input, variety, origin, processing, roast)

    return {
      qualityScore,
      qualityTier: tierInfo.tier,
      confidence,

      primaryMetric: {
        type: 'cupping_score',
        value: finalScore,
        unit: 'pts',
        displayName: 'SCA Cupping Score',
        lowerIsBetter: false,
      },

      soil,
      heritage,
      agricultural,
      ripen,
      enrich,

      modelInfo: {
        category: 'transformed',
        validationStatus: this.validationStatus,
        warnings,
        lastUpdated: new Date('2024-12-18'),
      },
    }
  }

  // ===========================================================================
  // SHARE Pillar Calculations (Coffee)
  // ===========================================================================

  private calculateCoffeeSoil(
    input: TransformedPredictionInput,
    origin?: CoffeeOrigin
  ): SoilContribution {
    const insights: string[] = []
    let modifier = 0

    if (origin) {
      insights.push(`Origin: ${origin.name}, ${origin.country}`)
      insights.push(`Altitude: ${origin.altitude.min}-${origin.altitude.max}m`)
      insights.push(`Terroir profile: ${origin.flavorProfile}`)

      // High altitude bonus
      if (origin.altitude.max >= 1800) {
        insights.push('High altitude (1800m+): Slower cherry development, denser beans, more complex sugars')
        modifier = 2
      } else if (origin.altitude.max >= 1400) {
        insights.push('Medium-high altitude (1400-1800m): Good complexity development')
        modifier = 1
      }
    } else if (input.regionId) {
      insights.push(`Region: ${input.regionId}`)
    } else {
      insights.push('Origin not specified - terroir impact unknown')
    }

    return {
      modifier,
      confidence: origin ? 0.7 : 0.3,
      details: {
        regionId: origin?.id || input.regionId,
        soilType: origin ? 'volcanic' : undefined,
      },
      insights,
    }
  }

  private calculateCoffeeHeritage(
    input: TransformedPredictionInput,
    variety?: CoffeeVariety
  ): HeritageContribution {
    const insights: string[] = []
    let modifier = 0

    if (variety) {
      insights.push(`Variety: ${variety.name}`)
      insights.push(`Lineage: ${variety.heritageIntent}`)
      insights.push(`Flavor profile: ${variety.flavorProfile}`)
      insights.push(
        `Cupping potential: ${variety.cuppingPotential.min}-${variety.cuppingPotential.max} SCA`
      )

      // Heritage variety bonus
      if (variety.heritageIntent === 'heirloom') {
        insights.push('Heirloom variety: Genetic purity, complex flavor development')
        modifier = 3
      } else if (variety.heritageIntent === 'selection') {
        insights.push('Quality selection: Bred for cup quality')
        modifier = 2
      }

      if (variety.notes) {
        insights.push(variety.notes)
      }
    } else {
      insights.push('Variety not specified - using generic baseline')
    }

    return {
      modifier,
      confidence: variety ? 0.8 : 0.4,
      details: {
        cultivarId: variety?.id,
        cultivarName: variety?.name,
        heritageIntent: variety?.heritageIntent,
      },
      insights,
    }
  }

  private calculateCoffeeAgricultural(
    input: TransformedPredictionInput,
    processing?: ProcessingMethod
  ): AgriculturalContribution {
    const insights: string[] = []
    let modifier = 0

    if (processing) {
      insights.push(`Processing: ${processing.name}`)
      insights.push(processing.description)
      insights.push(`Flavor impact: ${processing.flavorImpact}`)
      insights.push(`Risk level: ${processing.riskLevel}`)

      // Brix utilization insight (key to two-stage model)
      const brixUtilPct = Math.round(processing.brixUtilization * 100)
      insights.push(`Brix utilization: ${brixUtilPct}% of cherry sugar contributes to bean quality`)

      if (processing.brixUtilization >= 0.8) {
        insights.push('✓ High Brix utilization: Cherry sugars ferment into bean, adding sweetness')
      } else if (processing.brixUtilization <= 0.2) {
        insights.push('Note: Low Brix utilization - variety/terroir shine through, less processing influence')
      }

      modifier = processing.cuppingModifier

      if (processing.riskLevel === 'high') {
        insights.push('High-risk processing: Quality depends heavily on execution')
      }

      // If we have fruitBrix, explain the transformation
      if (input.fruitBrix !== undefined) {
        const effectiveBrix = input.fruitBrix * processing.brixUtilization
        insights.push(
          `Cherry Brix ${input.fruitBrix}°Bx → ${effectiveBrix.toFixed(1)}°Bx effective contribution`
        )
      }
    } else {
      insights.push('Processing method not specified')
    }

    return {
      modifier,
      confidence: processing ? 0.7 : 0.4,
      details: {
        fertilityStrategy: processing?.id,
      },
      insights,
    }
  }

  private calculateCoffeeRipen(
    input: TransformedPredictionInput,
    variety?: CoffeeVariety,
    origin?: CoffeeOrigin
  ): RipenContribution {
    const insights: string[] = []
    let timingModifier = 0
    let confidence = 0.5

    // Cherry ripeness is critical for coffee
    insights.push('Cherry ripeness at harvest determines sugar development')

    // Tree maturity affects reproductive allocation (R pillar)
    if (input.treeAgeYears !== undefined) {
      const maturity = getTreeMaturityStage(input.treeAgeYears, 'coffee')

      insights.push(`Tree age: ${input.treeAgeYears} years (${maturity.stage} stage)`)
      insights.push(`Reproductive allocation: ${maturity.reproductiveAllocation}% of tree energy to fruit/seed`)

      // Apply timing modifier based on tree maturity
      switch (maturity.stage) {
        case 'seedling':
          timingModifier = -2 // Too young for quality production
          insights.push('⚠️ Tree too young for quality coffee production')
          break
        case 'juvenile':
          timingModifier = -0.5
          insights.push('Young tree: Still developing, fruit competes with vegetation')
          break
        case 'mature':
          timingModifier = 0.5
          insights.push('Mature tree: Good reproductive allocation, quality improving')
          break
        case 'prime':
          timingModifier = 1
          insights.push('✓ Prime production: Optimized reproductive allocation')
          break
        case 'declining':
          timingModifier = 0.5 // Still good per-piece quality
          insights.push('Declining tree paradox: Fewer cherries but each receives more energy')
          if (maturity.decliningParadox) {
            insights.push('Natural thinning may increase per-cherry quality')
          }
          break
      }

      confidence += 0.15
    }

    // Cherry Brix as R pillar indicator (harvest timing/ripeness)
    if (input.fruitBrix !== undefined) {
      insights.push(`Cherry Brix at harvest: ${input.fruitBrix}°Bx`)

      const seedTier = estimateSeedTierFromFruitBrix(input.fruitBrix, 'coffee')

      if (seedTier.expectedSeedTier === 'exceptional') {
        timingModifier += 1
        insights.push('✓ Exceptional cherry ripeness: Optimal harvest timing')
      } else if (seedTier.expectedSeedTier === 'premium') {
        timingModifier += 0.5
        insights.push('✓ Premium cherry ripeness: Good harvest timing')
      } else if (seedTier.expectedSeedTier === 'commodity') {
        timingModifier -= 0.5
        insights.push('⚠️ Low cherry Brix: May indicate early harvest or poor conditions')
      }

      confidence += 0.2
    }

    if (variety) {
      insights.push(`Optimal altitude for ${variety.name}: ${variety.altitudeOptimal.min}-${variety.altitudeOptimal.max}m`)
    }

    if (origin) {
      const harvestStr = origin.harvestMonths.join(', ')
      insights.push(`Peak harvest months: ${harvestStr}`)
    }

    // Assume optimal harvest if not specified otherwise
    insights.push('Ripe cherry selection: Only red (ripe) cherries should be picked')

    return {
      timingModifier,
      confidence: Math.min(0.9, confidence),
      details: {
        harvestStatus: input.fruitBrix && input.fruitBrix >= 22 ? 'peak' : 'optimal',
        percentToMaturity: input.treeAgeYears
          ? Math.min(100, (input.treeAgeYears / 6) * 100)
          : undefined,
      },
      insights,
    }
  }

  private calculateCoffeeEnrich(
    input: TransformedPredictionInput,
    finalScore: number,
    predictedScore: number,
    roast?: RoastLevel,
    processing?: ProcessingMethod
  ): EnrichContribution {
    const tierInfo = getCuppingTier(finalScore)
    const insights: string[] = []

    insights.push(`SCA Cupping Score: ${finalScore.toFixed(1)} pts (${tierInfo.scaGrade})`)
    insights.push(tierInfo.description)

    // Two-stage transformation model breakdown
    if (input.fruitBrix !== undefined && processing) {
      const brixUtilization = processing.brixUtilization
      const effectiveBrix = input.fruitBrix * brixUtilization

      insights.push('── Two-Stage Transformation Model ──')
      insights.push(
        `Stage 1: Cherry Brix ${input.fruitBrix}°Bx × ${processing.name} (${Math.round(brixUtilization * 100)}% utilization)`
      )
      insights.push(`         → Effective Brix contribution: ${effectiveBrix.toFixed(1)}°Bx`)

      if (input.measurements?.greenBeanScore !== undefined) {
        insights.push(`         → Green bean quality: ${input.measurements.greenBeanScore} pts (measured)`)
      }

      if (roast) {
        insights.push(`Stage 2: Green bean × ${roast.name} (${roast.cuppingModifier >= 0 ? '+' : ''}${roast.cuppingModifier} pts)`)
        insights.push(`         → Final cupping score: ${finalScore.toFixed(1)} pts`)
      }
    }

    if (roast) {
      insights.push(`Roast level: ${roast.name}`)
      if (!roast.preservesOrigin) {
        insights.push('Note: Darker roasts mask origin characteristics')
      }
    }

    if (input.measurements?.cuppingScore) {
      insights.push('Score from professional cupping evaluation')
      if (Math.abs(finalScore - predictedScore) > 3) {
        insights.push(
          `Note: Measured differs significantly from predicted (${predictedScore.toFixed(1)})`
        )
      }
    }

    // Specialty threshold note
    if (finalScore >= 80) {
      insights.push('Meets SCA specialty grade threshold (80+)')
    } else {
      insights.push('Below specialty grade threshold - commercial quality')
    }

    // Secondary metrics including green bean quality if available
    const secondaryMetrics: { name: string; value: number; unit: string }[] = []

    if (input.measurements?.greenBeanScore !== undefined) {
      secondaryMetrics.push({
        name: 'Green Bean Quality',
        value: input.measurements.greenBeanScore,
        unit: 'pts',
      })
    }

    if (input.fruitBrix !== undefined) {
      secondaryMetrics.push({
        name: 'Cherry Brix',
        value: input.fruitBrix,
        unit: '°Bx',
      })
    }

    if (input.measurements?.acidity !== undefined) {
      secondaryMetrics.push({
        name: 'Acidity',
        value: input.measurements.acidity,
        unit: '/10',
      })
    }

    if (input.measurements?.body !== undefined) {
      secondaryMetrics.push({
        name: 'Body',
        value: input.measurements.body,
        unit: '/10',
      })
    }

    return {
      verified: input.measurements?.cuppingScore !== undefined,
      confidence: input.measurements?.cuppingScore
        ? 0.95
        : input.fruitBrix !== undefined
          ? 0.75
          : 0.6,
      details: {
        primaryMetric: {
          type: 'cupping_score',
          value: finalScore,
          unit: 'pts',
          displayName: 'SCA Cupping Score',
          lowerIsBetter: false,
        },
        secondaryMetrics: secondaryMetrics.length > 0 ? secondaryMetrics : undefined,
      },
      insights,
    }
  }

  // ===========================================================================
  // Calculation Helpers (Coffee)
  // ===========================================================================

  /**
   * Calculate cupping score using Two-Stage Transformation Model
   *
   * Stage 1: Cherry Brix × Processing Method → Green Bean Quality
   * Stage 2: Green Bean Quality × Roast Level → Final Cupping Score
   *
   * When cherry Brix is available, we use the full correlation model.
   * When not available, we fall back to variety baseline + modifiers.
   */
  private calculateCuppingScore(
    input: TransformedPredictionInput,
    variety?: CoffeeVariety,
    origin?: CoffeeOrigin,
    processing?: ProcessingMethod,
    roast?: RoastLevel
  ): number {
    // ==== STAGE 1: Calculate Green Bean Quality ====

    // Start with variety baseline or generic
    const varietyBaseline = variety?.cuppingPotential.typical ?? 80

    // Origin quality modifier
    let originModifier = 0
    if (origin) {
      if (origin.qualityTier === 'artisan') originModifier = 2
      else if (origin.qualityTier === 'premium') originModifier = 1
    }

    // Altitude bonus (variety at optimal altitude)
    let altitudeBonus = 0
    if (variety && origin) {
      const avgAltitude = (origin.altitude.min + origin.altitude.max) / 2
      if (
        avgAltitude >= variety.altitudeOptimal.min &&
        avgAltitude <= variety.altitudeOptimal.max
      ) {
        altitudeBonus = 1
      }
    }

    // Tree maturity modifier
    let treeMaturityModifier = 0
    if (input.treeAgeYears !== undefined) {
      const maturity = getTreeMaturityStage(input.treeAgeYears, 'coffee')
      switch (maturity.stage) {
        case 'seedling':
          treeMaturityModifier = -2
          break
        case 'juvenile':
          treeMaturityModifier = -0.5
          break
        case 'mature':
          treeMaturityModifier = 0.5
          break
        case 'prime':
          treeMaturityModifier = 1
          break
        case 'declining':
          treeMaturityModifier = 0.5
          break
      }
    }

    // Calculate green bean quality
    let greenBeanQuality: number

    if (input.fruitBrix !== undefined && processing) {
      // TWO-STAGE MODEL: Use cherry Brix × processing method
      // The calculateGreenBeanQuality helper handles the Brix utilization
      greenBeanQuality = calculateGreenBeanQuality(
        input.fruitBrix,
        processing.id,
        varietyBaseline + originModifier + altitudeBonus + treeMaturityModifier
      )
    } else {
      // FALLBACK: Traditional calculation without cherry Brix
      greenBeanQuality =
        varietyBaseline +
        originModifier +
        altitudeBonus +
        treeMaturityModifier +
        (processing?.cuppingModifier ?? 0)
    }

    // Use provided green bean score if available (more accurate than prediction)
    if (input.measurements?.greenBeanScore !== undefined) {
      greenBeanQuality = input.measurements.greenBeanScore
    }

    // ==== STAGE 2: Apply Roast Level ====

    // Roast level modifier (darker = lower score preservation)
    const roastModifier = roast?.cuppingModifier ?? 0

    // Final cupping score = green bean quality + roast impact
    let finalScore = greenBeanQuality + roastModifier

    // Clamp to reasonable range
    if (variety) {
      finalScore = Math.max(
        variety.cuppingPotential.min - 5,
        Math.min(variety.cuppingPotential.max + 3, finalScore)
      )
    } else {
      finalScore = Math.max(65, Math.min(95, finalScore))
    }

    return Math.round(finalScore * 10) / 10 // Round to 1 decimal
  }

  private calculateCoffeeConfidence(
    input: TransformedPredictionInput,
    variety?: CoffeeVariety,
    origin?: CoffeeOrigin
  ): number {
    let confidence = 0.3

    if (variety) confidence += 0.2
    if (origin) confidence += 0.15
    if (input.processingMethod) confidence += 0.1
    if (input.roastLevel) confidence += 0.05

    // Farm-level quality indicators boost confidence significantly
    if (input.fruitBrix !== undefined) confidence += 0.15 // Cherry Brix is powerful signal
    if (input.treeAgeYears !== undefined) confidence += 0.05 // Tree maturity adds context

    // Measured values trump predictions
    if (input.measurements?.greenBeanScore !== undefined) confidence += 0.2
    if (input.measurements?.cuppingScore !== undefined) confidence += 0.35

    return Math.min(0.95, confidence)
  }

  private cuppingToScore(cuppingScore: number): number {
    // 60-100 SCA scale maps to 0-100
    return Math.min(100, Math.max(0, ((cuppingScore - 60) / 40) * 100))
  }

  private collectCoffeeWarnings(
    input: TransformedPredictionInput,
    variety?: CoffeeVariety,
    origin?: CoffeeOrigin,
    processing?: ProcessingMethod,
    roast?: RoastLevel
  ): string[] {
    const warnings: string[] = []

    if (!variety) {
      warnings.push('Variety not specified - using generic baseline')
    }

    if (!origin) {
      warnings.push('Origin not specified - terroir impact unknown')
    }

    // Variety/origin mismatch warning
    if (variety && origin) {
      if (!origin.typicalVarieties.includes(variety.id)) {
        warnings.push(`${variety.name} is not typical for ${origin.name} - may be experimental`)
      }
    }

    // High-risk processing warning
    if (processing?.riskLevel === 'high') {
      warnings.push(`${processing.name} is high-risk - quality varies significantly by execution`)
    }

    // Dark roast on premium coffee warning
    if (roast && variety) {
      if (!roast.preservesOrigin && variety.qualityTier === 'artisan') {
        warnings.push(`Dark roast masks the exceptional origin character of ${variety.name}`)
      }
    }

    // Robusta warning
    if (variety?.species === 'robusta') {
      warnings.push('Robusta species typically scores lower than Arabica')
    }

    // Tree maturity warnings
    if (input.treeAgeYears !== undefined) {
      if (input.treeAgeYears < 3) {
        warnings.push('Young tree (< 3 years) - not yet at quality production stage')
      } else if (input.treeAgeYears > 25) {
        warnings.push('Mature tree (25+ years) - reduced yield but potentially high per-cherry quality')
      }
    }

    // Cherry Brix consistency warnings
    if (input.fruitBrix !== undefined && processing) {
      // High Brix with washed processing - some quality potential is wasted
      if (input.fruitBrix >= 24 && processing.brixUtilization <= 0.2) {
        warnings.push(
          `High cherry Brix (${input.fruitBrix}°Bx) with ${processing.name} - only ${Math.round(processing.brixUtilization * 100)}% of sugars utilized`
        )
      }

      // Low Brix with natural processing - results may disappoint
      if (input.fruitBrix < 18 && processing.brixUtilization >= 0.8) {
        warnings.push(
          `Low cherry Brix (${input.fruitBrix}°Bx) with ${processing.name} - limited sugar for fermentation`
        )
      }
    }

    // Model validation warning if using two-stage model
    if (input.fruitBrix !== undefined) {
      warnings.push('Using fruit-seed correlation model (inferred, needs validation)')
    }

    return warnings
  }

  // ===========================================================================
  // CACAO PREDICTOR (Demonstrates Seed-Based Product Framework)
  // ===========================================================================

  /**
   * Cacao follows the same two-stage transformation model as coffee:
   *
   * Stage 1: Pod Brix × Fermentation Method → Bean Quality
   * Stage 2: Bean Quality × Roast/Conching → Final Chocolate Quality
   *
   * Key differences from coffee:
   * - Pod Brix range is lower (12-18 vs 18-26 for coffee cherries)
   * - Fermentation is more critical (5-7 days vs coffee's 12-72 hours)
   * - Bean polyphenols are the primary quality indicator
   * - Theobromine/caffeine ratio matters for flavor
   */
  private predictCacao(input: TransformedPredictionInput): PredictionResult {
    const insights: string[] = []
    const warnings: string[] = []

    // Base quality estimate
    let qualityScore = 75 // Default for unknown cacao

    // Variety impact (H pillar)
    const heritageInsights: string[] = []
    let varietyModifier = 0
    if (input.variety) {
      const variety = this.getCacaoVariety(input.variety)
      if (variety) {
        heritageInsights.push(`Variety: ${variety.name}`)
        heritageInsights.push(`Flavor profile: ${variety.flavorProfile}`)
        varietyModifier = variety.qualityModifier
        qualityScore = variety.baseQuality
      } else {
        heritageInsights.push(`Unknown variety: ${input.variety}`)
        warnings.push('Variety not in database - using generic baseline')
      }
    } else {
      heritageInsights.push('Variety not specified')
    }

    // Tree maturity (R pillar) - same as coffee
    let treeMaturityModifier = 0
    const ripenInsights: string[] = []
    ripenInsights.push('Pod ripeness at harvest determines sugar development')

    if (input.treeAgeYears !== undefined) {
      const maturity = getTreeMaturityStage(input.treeAgeYears, 'cacao')
      ripenInsights.push(`Tree age: ${input.treeAgeYears} years (${maturity.stage} stage)`)
      ripenInsights.push(`Reproductive allocation: ${maturity.reproductiveAllocation}%`)

      switch (maturity.stage) {
        case 'seedling':
          treeMaturityModifier = -5
          warnings.push('Tree too young for quality production')
          break
        case 'juvenile':
          treeMaturityModifier = -2
          break
        case 'mature':
          treeMaturityModifier = 2
          break
        case 'prime':
          treeMaturityModifier = 5
          ripenInsights.push('✓ Prime production: Optimized reproductive allocation')
          break
        case 'declining':
          treeMaturityModifier = 3
          ripenInsights.push('Declining tree paradox: Fewer pods but higher concentration')
          break
      }
    }

    // Pod Brix (R pillar - harvest timing indicator)
    let brixContribution = 0
    if (input.fruitBrix !== undefined) {
      ripenInsights.push(`Pod Brix at harvest: ${input.fruitBrix}°Bx`)

      const seedTier = estimateSeedTierFromFruitBrix(input.fruitBrix, 'cacao')
      ripenInsights.push(`Expected bean quality tier: ${seedTier.expectedSeedTier}`)

      // Cacao Brix contribution (different scale than coffee)
      // Pod Brix 14 is baseline, each point above/below affects quality
      brixContribution = (input.fruitBrix - 14) * 2
    }

    // Processing/Fermentation (A pillar)
    const agriculturalInsights: string[] = []
    let processingModifier = 0

    if (input.processingMethod) {
      const fermentation = this.getCacaoFermentation(input.processingMethod)
      if (fermentation) {
        agriculturalInsights.push(`Fermentation: ${fermentation.name}`)
        agriculturalInsights.push(fermentation.description)
        agriculturalInsights.push(`Polyphenol retention: ${Math.round(fermentation.polyphenolRetention * 100)}%`)
        processingModifier = fermentation.qualityModifier

        if (input.fruitBrix !== undefined) {
          const effectiveBrix = input.fruitBrix * fermentation.brixUtilization
          agriculturalInsights.push(
            `Pod Brix ${input.fruitBrix}°Bx × ${Math.round(fermentation.brixUtilization * 100)}% = ${effectiveBrix.toFixed(1)}°Bx contribution`
          )
        }
      }
    } else {
      agriculturalInsights.push('Fermentation method not specified')
    }

    // Calculate final quality score
    qualityScore = Math.min(
      100,
      Math.max(
        50,
        qualityScore + varietyModifier + treeMaturityModifier + brixContribution + processingModifier
      )
    )

    // Determine quality tier
    let qualityTier: QualityTier
    if (qualityScore >= 85) qualityTier = 'artisan'
    else if (qualityScore >= 70) qualityTier = 'premium'
    else if (qualityScore >= 55) qualityTier = 'standard'
    else qualityTier = 'commodity'

    // Calculate confidence
    let confidence = 0.3
    if (input.variety) confidence += 0.15
    if (input.originRegion) confidence += 0.1
    if (input.processingMethod) confidence += 0.15
    if (input.fruitBrix !== undefined) confidence += 0.2
    if (input.treeAgeYears !== undefined) confidence += 0.1

    insights.push('Cacao predictor uses fruit-seed correlation model')
    warnings.push('Cacao model is inferred - needs validation with actual bean quality data')

    return {
      qualityScore,
      qualityTier,
      confidence: Math.min(0.85, confidence),

      primaryMetric: {
        type: 'cupping_score',
        value: qualityScore,
        unit: 'pts',
        displayName: 'Bean Quality Score',
        lowerIsBetter: false,
      },

      soil: {
        modifier: 0,
        confidence: input.originRegion ? 0.6 : 0.3,
        details: {
          regionId: input.originRegion,
        },
        insights: input.originRegion
          ? [`Origin: ${input.originRegion}`, 'Terroir affects flavor complexity']
          : ['Origin not specified'],
      },

      heritage: {
        modifier: varietyModifier,
        confidence: input.variety ? 0.7 : 0.3,
        details: {
          cultivarId: input.variety,
        },
        insights: heritageInsights,
      },

      agricultural: {
        modifier: processingModifier,
        confidence: input.processingMethod ? 0.7 : 0.3,
        details: {
          fertilityStrategy: input.processingMethod,
        },
        insights: agriculturalInsights,
      },

      ripen: {
        timingModifier: treeMaturityModifier + brixContribution,
        confidence: input.fruitBrix !== undefined ? 0.75 : 0.4,
        details: {
          harvestStatus: input.fruitBrix && input.fruitBrix >= 15 ? 'peak' : 'optimal',
          percentToMaturity: input.treeAgeYears
            ? Math.min(100, (input.treeAgeYears / 8) * 100)
            : undefined,
        },
        insights: ripenInsights,
      },

      enrich: {
        verified: false,
        confidence: 0.5,
        details: {
          primaryMetric: {
            type: 'cupping_score',
            value: qualityScore,
            unit: 'pts',
            displayName: 'Bean Quality Score',
            lowerIsBetter: false,
          },
          secondaryMetrics: input.fruitBrix !== undefined
            ? [{ name: 'Pod Brix', value: input.fruitBrix, unit: '°Bx' }]
            : undefined,
        },
        insights: [
          `Estimated bean quality: ${qualityScore.toFixed(0)} pts`,
          ...(input.fruitBrix !== undefined
            ? ['── Two-Stage Transformation Model ──', `Stage 1: Pod Brix → Bean polyphenol accumulation`]
            : []),
        ],
      },

      modelInfo: {
        category: 'transformed',
        validationStatus: 'inferred',
        warnings,
        lastUpdated: new Date('2024-12-19'),
      },
    }
  }

  // Cacao variety database (simplified)
  private getCacaoVariety(
    varietyId: string
  ): { name: string; baseQuality: number; qualityModifier: number; flavorProfile: string } | undefined {
    const varieties: Record<
      string,
      { name: string; baseQuality: number; qualityModifier: number; flavorProfile: string }
    > = {
      criollo: {
        name: 'Criollo',
        baseQuality: 85,
        qualityModifier: 5,
        flavorProfile: 'Delicate, floral, fruity, low bitterness',
      },
      nacional: {
        name: 'Nacional (Arriba)',
        baseQuality: 82,
        qualityModifier: 4,
        flavorProfile: 'Floral, jasmine, complex aromatics',
      },
      trinitario: {
        name: 'Trinitario',
        baseQuality: 78,
        qualityModifier: 2,
        flavorProfile: 'Balanced, fruity, mild bitterness',
      },
      forastero: {
        name: 'Forastero',
        baseQuality: 70,
        qualityModifier: 0,
        flavorProfile: 'Bold, earthy, classic chocolate',
      },
      ccn51: {
        name: 'CCN-51',
        baseQuality: 65,
        qualityModifier: -2,
        flavorProfile: 'Bitter, acidic, high yield commodity',
      },
    }
    return varieties[varietyId.toLowerCase()]
  }

  // Cacao fermentation database
  private getCacaoFermentation(
    methodId: string
  ): { name: string; description: string; qualityModifier: number; polyphenolRetention: number; brixUtilization: number } | undefined {
    const methods: Record<
      string,
      { name: string; description: string; qualityModifier: number; polyphenolRetention: number; brixUtilization: number }
    > = {
      box_fermentation: {
        name: 'Box Fermentation',
        description: 'Traditional 5-7 day fermentation in wooden boxes',
        qualityModifier: 3,
        polyphenolRetention: 0.65,
        brixUtilization: 0.85,
      },
      heap_fermentation: {
        name: 'Heap Fermentation',
        description: 'Beans piled and covered with banana leaves',
        qualityModifier: 2,
        polyphenolRetention: 0.60,
        brixUtilization: 0.80,
      },
      basket_fermentation: {
        name: 'Basket Fermentation',
        description: 'Traditional African method in woven baskets',
        qualityModifier: 1,
        polyphenolRetention: 0.55,
        brixUtilization: 0.75,
      },
      controlled_fermentation: {
        name: 'Controlled Fermentation',
        description: 'Temperature and humidity controlled environment',
        qualityModifier: 4,
        polyphenolRetention: 0.75,
        brixUtilization: 0.90,
      },
      sun_dried_unfermented: {
        name: 'Sun Dried (Unfermented)',
        description: 'No fermentation - bitter, astringent',
        qualityModifier: -5,
        polyphenolRetention: 0.95, // High but astringent
        brixUtilization: 0.20,
      },
    }
    return methods[methodId.toLowerCase()]
  }

  // ===========================================================================
  // Placeholder for Other Transformed Products (Tea, Olive Oil)
  // ===========================================================================

  private createPlaceholder(input: TransformedPredictionInput): PredictionResult {
    return {
      qualityScore: 50,
      qualityTier: 'standard',
      confidence: 0.2,

      primaryMetric: {
        type: 'cupping_score',
        value: 80,
        unit: 'pts',
        displayName: 'Quality Score',
        lowerIsBetter: false,
      },

      soil: {
        modifier: 0,
        confidence: 0.2,
        details: {},
        insights: [`${input.productType} predictor not yet implemented`],
      },

      heritage: {
        modifier: 0,
        confidence: 0.2,
        details: {},
        insights: ['Variety data not available'],
      },

      agricultural: {
        modifier: 0,
        confidence: 0.2,
        details: {},
        insights: ['Processing data not available'],
      },

      ripen: {
        timingModifier: 0,
        confidence: 0.2,
        details: {
          harvestStatus: 'optimal',
        },
        insights: ['Harvest data not available'],
      },

      enrich: {
        verified: false,
        confidence: 0.2,
        details: {
          primaryMetric: {
            type: 'cupping_score',
            value: 80,
            unit: 'pts',
            displayName: 'Quality Score',
            lowerIsBetter: false,
          },
        },
        insights: ['Using placeholder values'],
      },

      modelInfo: {
        category: 'transformed',
        validationStatus: 'placeholder',
        warnings: [`${input.productType} predictor not yet implemented - using placeholder`],
        lastUpdated: new Date('2024-12-18'),
      },
    }
  }
}

// =============================================================================
// Export Predictor Instance
// =============================================================================

export const transformationPredictor = new TransformationPredictor()
