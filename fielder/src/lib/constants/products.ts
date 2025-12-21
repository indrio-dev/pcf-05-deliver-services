/**
 * =============================================================================
 * FIELDER PRODUCT TAXONOMY & SHARE FRAMEWORK
 * =============================================================================
 *
 * NOTE: HeritageIntent is the canonical heritage classification type.
 * See quality-tiers.ts for the definition.
 */

import { HeritageIntent } from './quality-tiers'

// Import from product-types.ts to avoid circular dependency with regional-offering-generator
// Re-export types with 'export type' for isolatedModules compatibility
export type { ProductCategory, ProductSubcategory, ProductType } from './product-types'
// Re-export values
export { PRODUCT_TYPES, PRODUCT_TYPES_BY_ID, PRODUCTS, PRODUCTS_BY_ID } from './product-types'

// Also import for local use in this file
import {
  type ProductCategory,
  type ProductSubcategory,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_ID,
  PRODUCTS_BY_ID,
} from './product-types'

/**
 * =============================================================================
 *
 * MISSION: Apply SHARE growing principles to all US farm-to-table products
 * across TIME (seasonality, harvest windows) and GEOGRAPHY (terroir, regions).
 *
 * THE PROBLEM: Grocery stores offer below average → average → above average,
 * but no one knows WHY. Quality is opaque to consumers.
 *
 * OUR ANSWER: Fielder ONLY offers above average because we know WHY.
 * The SHARE framework makes quality transparent and measurable.
 *
 * "The right product, from the right place, at the right time"
 * - backed by science, not just marketing.
 *
 * =============================================================================
 * SHARE FRAMEWORK
 * =============================================================================
 *
 * | SHARE | What It Captures        | Data Model                              |
 * |-------|-------------------------|-----------------------------------------|
 * | S     | Where it grows (terroir)| FoundationEnvironment, GrowingRegion    |
 * | H     | What it is (genetics)   | ProductType → Variety → Cultivar        |
 * | A     | How it's raised         | HarvestingPractices (IPM, organic, etc) |
 * | R     | When it's ready         | TimingProfile, RipeningBehavior         |
 * | E     | Proof of quality        | QualityMetrics (Brix, omega-3, etc)     |
 *
 * =============================================================================
 * DATA HIERARCHY (CORRECTED)
 * =============================================================================
 *
 * TAXONOMY (Classification - for organizing, searching, inferring):
 *   Category → Subcategory → ProductType → Variety → Cultivar → [Trade Names]
 *   'fruit'  → 'citrus'    → 'Orange'    → 'Navel' → 'Cara Cara' → ...
 *
 * ACTUAL PRODUCT (What gets bought and sold - see product-model.ts):
 *   Product = Farm + Cultivar + SHARE data + Retail attributes (cut, weight, form)
 *   "1/8 Bushel Heritage Navels from Hale Groves"
 *   "Pasture Raised American Wagyu Ribeye 12oz from Everglades Ranch"
 *
 * KEY INSIGHT:
 *   - For PRODUCE: ProductType ≈ Product (a Cara Cara orange is a Cara Cara orange)
 *   - For MEAT: One Cultivar → Many Products (one steer → ribeye, strip, brisket, ground...)
 *
 * Examples:
 *   Fruit → Citrus → Orange → Navel → Cara Cara → ... → "Cara Cara 5lb from Hale"
 *   Meat → Red Meat → Beef → Wagyu Cross → Wagyu×Brangus → "American Wagyu" → "Wagyu Ribeye 12oz"
 *
 * The Variety level is the consumer-recognized grouping:
 *   - "Navel Orange" (variety) contains Washington, Cara Cara, Lane Late (cultivars)
 *   - "Blood Orange" (variety) contains Moro, Tarocco, Sanguinelli (cultivars)
 *   - "Honeycrisp" can be both variety and cultivar (1:1 relationship)
 *
 * Cultivar Naming:
 *   - displayName: Cultivar name (e.g., "Cara Cara", "WA 38")
 *   - technicalName: Technical/botanical name if different from displayName
 *   - tradeNames: Marketing names (e.g., ["Cosmic Crisp"], ["Pink Lady"], ["American Wagyu"])
 *
 * Each cultivar can be grown in multiple regions with different:
 *   - GDD accumulation patterns (weather-driven)
 *   - Peak harvest windows
 *   - Expected quality characteristics (terroir effects)
 */

// ProductCategory and ProductSubcategory are now imported from product-types.ts
// See product-types.ts for the full type definitions

export type ModelType = 'gdd' | 'calendar' | 'parent'

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

// =============================================================================
// SHARE QUALITY FRAMEWORK
// =============================================================================
// SHARE = Soil, Heritage, Agricultural Practices, Ripen, Enrich
// This framework ensures superior quality through systematic practices and measurement
//
// The framework translates across product categories:
//
// | SHARE | Produce           | Seafood                    | Meat/Beef                    |
// |-------|-------------------|----------------------------|------------------------------|
// | S     | Soil Health       | Sea (water quality)        | Forage Quality (pasture)     |
// | H     | Heritage Cultivar | Species/Variety            | Breed (genetic potential)    |
// | A     | Ag Practices      | Wild vs Farm, sustainable  | Grass-fed, pasture-raised    |
// | R     | Ripen (harvest)   | Freshness (days since)     | Maturity (24mo) + Aging      |
// | E     | Enrich (Brix)     | Omega-3, fat content       | Marbling, omega ratio        |
//
// S - Foundation Environment: Soil health / Sea quality / Pasture quality
// H - Genetic Potential: Cultivar / Species / Breed - determines flavor & nutrition ceiling
// A - How It's Raised: IPM, organic, regenerative / Wild-caught, sustainable / No feedlots
// R - Timing to Peak: Harvest window, transit / Freshness / Age at harvest + aging
// E - Measurable Proof: Brix, polyphenols / Omega-3 / Marbling score
// =============================================================================

/**
 * S - Foundation Environment (Soil / Sea / Pasture)
 * Translates by category:
 *   - Produce: Soil health
 *   - Seafood: Water/sea environment
 *   - Meat: Pasture/forage quality
 */
export interface FoundationEnvironment {
  // For produce - soil characteristics
  soilType?: string                    // e.g., 'sandy loam', 'volcanic', 'alluvial'
  soilPh?: number                      // pH level
  organicMatterPct?: number            // Organic matter percentage
  drainageType?: 'well-drained' | 'moderate' | 'poor'
  mineralNotes?: string                // Key minerals present

  // For seafood - water environment
  waterType?: 'cold_ocean' | 'warm_ocean' | 'freshwater' | 'brackish' | 'aquaculture'
  waterQuality?: string                // Water quality notes
  waterTemp?: string                   // Temperature range
  habitat?: string                     // e.g., 'deep ocean', 'coastal', 'river', 'farm-raised'

  // For meat - pasture/forage quality
  pastureType?: string                 // e.g., 'mixed grass', 'native prairie', 'managed rotational'
  forageQuality?: string               // What animals eat affects flavor/nutrition
  grazingPractice?: 'rotational' | 'continuous' | 'mob_grazing'

  // Universal
  terroirNotes?: string                // How environment affects flavor/quality
  regionCharacter?: string             // What makes this region's environment special
}

// Alias for backwards compatibility
export type SoilProfile = FoundationEnvironment

/**
 * H - Heritage Cultivar indicators (on Cultivar)
 *
 * Core principle: Heritage = Non-GMO (precautionary principle)
 * Can be heirloom OR newer bred varieties, but always non-GMO.
 * Genetic potential for superior flavor and nutrition.
 *
 * @deprecated Use HeritageIntent from quality-tiers.ts instead.
 * HeritageIntent has more nuanced classification:
 *   - true_heritage: Selected for flavor/nutrition over generations
 *   - heirloom_quality: Pre-1950 AND high internal quality
 *   - heirloom_utility: Pre-1950 but bred for hardiness/yield
 *   - modern_nutrient: Modern with nutrition focus
 *   - modern_flavor: Modern with flavor focus
 *   - commercial: Modern yield/shipping/appearance focus
 *
 * This type is maintained for backwards compatibility.
 */
export type HeritageStatus =
  | 'heirloom'           // Pre-1950s, open-pollinated
  | 'heritage'           // Traditional variety, maintained genetics
  | 'landrace'           // Locally adapted over generations
  | 'modern_quality'     // Modern cultivar bred for quality (not yield/shipping)

/**
 * Mapping from legacy HeritageStatus to canonical HeritageIntent
 */
export const HERITAGE_STATUS_TO_INTENT: Record<HeritageStatus, HeritageIntent> = {
  heirloom: 'heirloom_quality',    // Assume quality unless noted otherwise
  heritage: 'true_heritage',
  landrace: 'true_heritage',        // Landraces are selected for local adaptation
  modern_quality: 'modern_flavor',  // Modern quality-focused = flavor or nutrient
}

// Re-export HeritageIntent for convenience
export type { HeritageIntent }

/**
 * A - Agricultural/Harvesting Practices
 * Translates by category:
 *   - Produce: Growing practices (IPM, organic, regenerative)
 *   - Seafood: Harvesting practices (wild-caught, sustainable, farm-raised)
 *   - Meat: Raising practices (grass-fed, pasture-raised, no feedlots)
 */
export interface HarvestingPractices {
  // === Universal Certifications ===
  isOrganic?: boolean
  isRegenerative?: boolean
  certifications?: string[]            // e.g., ['USDA Organic', 'MSC Certified', 'Animal Welfare Approved']

  // === Produce-specific ===
  pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'
  ipmPractices?: string[]              // Specific IPM practices used
  fertilizerType?: 'synthetic' | 'organic' | 'regenerative' | 'none'
  coverCropping?: boolean
  cropRotation?: boolean

  // === Seafood-specific ===
  harvestMethod?: 'wild_caught' | 'farm_raised' | 'aquaculture'
  fishingMethod?: string               // e.g., 'line-caught', 'net', 'trap', 'trawl'
  isSustainable?: boolean              // Sustainable fishing practices
  mscCertified?: boolean               // Marine Stewardship Council
  byatchMinimized?: boolean            // Bycatch reduction practices

  // === Meat/Dairy/Eggs-specific ===
  // Key principle: Minimize grain feeding → Lower Omega-6 → Better Omega-3:6 ratio
  // Grain-fed animals have high Omega-6 (pro-inflammatory, we minimize this)
  // Grass-fed/pasture-raised have better fatty acid profiles
  animalWelfare?: 'pasture_raised' | 'free_range' | 'cage_free' | 'conventional'
  dietType?: 'grass_only' | 'pasture_forage' | 'minimal_grain' | 'grain_supplemented' | 'grain_fed'
  grassFed?: boolean
  grassFinished?: boolean              // Critical: finished on grass, not grain (affects final fatty acid profile)
  grainFree?: boolean                  // No grain in diet (best for Omega-3:6 ratio)
  noFeedlots?: boolean
  noAntibiotics?: boolean
  noHormones?: boolean
  humaneCertified?: boolean

  // === Universal ===
  practiceNotes?: string
  practiceHighlights?: string[]        // Key differentiators to surface
}

// Alias for backwards compatibility
export type AgriculturalPractices = HarvestingPractices

/**
 * R - Ripen/Ready: Timing to peak quality
 * Translates by category:
 *   - Produce: Harvest timing, ripening behavior, transit
 *   - Seafood: Freshness (days since catch), flash-freeze timing
 *   - Meat: Age at harvest (maturity), aging process (dry-aged, wet-aged)
 */
export type RipeningBehavior =
  | 'non_climacteric'      // Citrus, berries - ripeness locked at harvest, transit = freshness only
  | 'climacteric_ambient'  // Mango, stone fruit - continues ripening post-harvest
  | 'climacteric_cold'     // Apple, pear - cold storage pauses, ambient resumes ripening
  | 'shelf_stable'         // Nuts, honey, cured meats - minimal transit effect
  | 'ultra_perishable'     // Seafood, dairy - freshness degrades rapidly
  | 'aging_improves'       // Beef, cheese, wine - quality improves with proper aging

export type ShippingMode = 'live' | 'fresh' | 'frozen' | 'cold_stored' | 'ambient'

export interface ShippingOption {
  mode: ShippingMode
  shelfLifeDays: number                // How long quality maintained in this mode
  extendsAvailability: boolean         // Does this mode extend beyond harvest window?
  requiresColdChain: boolean
  priceModifier?: number               // Relative to base (e.g., 1.2 = 20% premium)
  notes?: string
}

export interface TimingProfile {
  // === Produce: Harvest timing ===
  harvestMonths?: number[]             // Months when harvested (1-12)
  peakHarvestMonths?: number[]         // Optimal quality window within harvest
  ripeningBehavior?: RipeningBehavior
  daysToRipenAmbient?: number          // For climacteric: days from harvest to peak at room temp
  storageLifeWeeks?: number            // How long CAN quality be maintained with proper storage

  // === Seafood: Freshness timing ===
  seasonalRun?: string                 // e.g., 'Copper River run', 'soft shell season'
  daysFreshOptimal?: number            // Optimal days from catch to consumption (fresh)
  flashFreezeWindow?: number           // Hours post-catch for optimal flash freeze

  // === Meat: Maturity and aging ===
  monthsToMaturity?: number            // Age at harvest (e.g., 24 months for quality beef vs 14 for commodity)
  agingMethod?: 'dry_aged' | 'wet_aged' | 'fresh' | 'hung'
  agingDays?: number                   // Days of aging for optimal quality
  agingNotes?: string                  // e.g., '21-day dry-aged for optimal tenderness'

  // === Universal: Availability ===
  availableMonths?: number[]           // Platform decision on availability window
  shippingModes?: ShippingOption[]
}

// Alias for backwards compatibility
export type RipenProfile = TimingProfile

/**
 * E - Enrich: Measurable quality indicators
 *
 * Core principle: MAXIMIZE the good (nutrition, flavor) + MINIMIZE the bad (contaminants)
 *
 * Translates by category:
 *   - Produce: Brix, polyphenols, vitamins, firmness
 *   - Seafood: Omega-3 content, fat percentage, freshness indicators
 *   - Meat: Marbling score, fatty acid profile, omega ratio, CLA content
 */
export interface QualityMetrics {
  // === Produce: Sugar & Compounds (most fruits/veg) ===
  // Brix is a proxy for: carbohydrates, minerals, vitamins (primary)
  // Secondary indicators: antioxidants, polyphenols
  brixMin?: number                     // Minimum acceptable Brix
  brixTarget?: number                  // Target/optimal Brix
  brixMax?: number                     // Maximum typical Brix
  acidityPct?: number                  // Acidity percentage (citrus, tomatoes)
  brixAcidRatio?: number               // Brix:acid ratio (citrus quality indicator)
  polyphenolsNote?: string             // Qualitative polyphenol content
  antioxidantNote?: string             // Antioxidant profile
  lycopeneNote?: string                // Lycopene content (tomatoes)
  anthocyaninNote?: string             // Anthocyanin content (berries, red produce)
  firmnessAtHarvest?: number           // Penetrometer reading (lbs)
  firmnessAtPeak?: number              // Optimal eating firmness

  // === Produce: Oil-bearing (avocado, olives, nuts) ===
  oilContent?: number                  // Oil percentage
  oleicAcidPct?: number                // Oleic acid % (monounsaturated fat quality)
  freefattyAcidPct?: number            // Free fatty acid % (EVOO: <0.8% = extra virgin)
  peroxideValue?: number               // Peroxide value (freshness/oxidation indicator)
  polyphenolsMgKg?: number             // Polyphenols mg/kg (EVOO: 250+ is high quality)

  // === Seafood: Fat & Freshness ===
  omega3Content?: string               // Omega-3 levels (e.g., 'high', '2.5g per serving')
  omega3To6Ratio?: string              // Omega-3 to Omega-6 ratio
  fatPercentage?: number               // Fat content percentage
  mercuryLevel?: 'very_low' | 'low' | 'moderate'  // Mercury content
  freshnessGrade?: string              // Freshness grading if applicable

  // === Meat/Dairy/Eggs: Marbling & Fatty Acid Profile ===
  // A→E connection: Grain feeding → High Omega-6 (BAD), Grass/pasture → High Omega-3 (GOOD)
  // We MAXIMIZE: Omega-3, CLA, fat-soluble vitamins
  // We MINIMIZE: Omega-6 (pro-inflammatory from grain feeding)
  marblingScore?: number               // USDA marbling score (100-1200 scale)
  usdaGrade?: 'prime' | 'choice' | 'select' | 'standard'  // USDA beef grade
  fatContent?: string                  // Fat percentage or description
  fattyAcidProfile?: string            // Fatty acid composition (saturated, mono, poly)
  claContent?: string                  // Conjugated Linoleic Acid (grass-fed indicator, MAXIMIZE)
  omega3Note?: string                  // Omega-3 content (MAXIMIZE - grass-fed is higher)
  omega6Note?: string                  // Omega-6 content (MINIMIZE - grain-fed is higher)
  omega3To6RatioMeat?: string          // Ratio (grass-fed ≈1:3 GOOD, feedlot ≈1:20 BAD)

  // === Universal: Nutrients ===
  vitaminHighlights?: string[]         // Key vitamins (e.g., ['Vitamin C', 'Vitamin A'])
  mineralHighlights?: string[]         // Key minerals (e.g., ['Potassium', 'Iron'])
  proteinContent?: string              // Protein per serving
  nutrientDensityScore?: number        // If using a scoring system

  // === Contaminant-Free Indicators (meat, seafood, produce) ===
  // Minimize the bad: pesticides, herbicides, heavy metals, antibiotics, hormones
  heavyMetalsFree?: boolean            // Tested for heavy metals (lead, cadmium, arsenic)
  pesticideFree?: boolean              // Tested for pesticide residue
  herbicideFree?: boolean              // Tested for herbicide residue (glyphosate, etc.)
  antibioticFree?: boolean             // No antibiotic residue
  hormoneFree?: boolean                // No added hormones
  contaminantTestNotes?: string        // Testing details/results

  // === Verification ===
  labTested?: boolean
  testDate?: string                    // When tested
  testingLab?: string                  // Which lab
  testingNotes?: string
  qualityHighlights?: string[]         // Key quality differentiators to surface
}

// Alias for backwards compatibility
export type EnrichMetrics = QualityMetrics

// ProductType interface is now defined in product-types.ts
// See product-types.ts for the interface definition
//
// HIERARCHY:
//   Category → Subcategory → ProductType → Variety → Cultivar → Trade Names → PRODUCT (SKU)
//   'fruit'  →  'citrus'   →  'Orange'   → 'Navel' → 'Cara Cara' → ... → "Cara Cara 5lb from Hale"

/**
 * Variety definition - the consumer-recognized grouping within a ProductType
 *
 * Hierarchy: ProductType → Variety → Cultivar → Trade Names → Listing (SKU)
 *
 * Examples:
 *   - Orange (ProductType) → Navel (variety) → Washington, Cara Cara (cultivars)
 *   - Orange (ProductType) → Blood (variety) → Moro, Tarocco (cultivars)
 *   - Apple (ProductType) → Honeycrisp (variety = cultivar, 1:1 relationship)
 *
 * When variety name = cultivar name (Honeycrisp), it's a 1:1 mapping.
 * This gives us a universal model that scales.
 */
export interface Variety {
  id: string
  productId: string              // References ProductType.id
  displayName: string        // Consumer-facing name (Navel, Valencia, Blood, Honeycrisp)
  description?: string       // What defines this variety
}

/**
 * Cultivar definition - the specific genetic selection within a variety
 *
 * Hierarchy: ProductType → Variety → Cultivar → Trade Names
 *
 * Examples:
 *   - Navel → Washington Navel, Cara Cara, Lane Late, Fukumoto
 *   - Blood → Moro, Tarocco, Sanguinelli
 *   - Honeycrisp → Honeycrisp (1:1 when variety = cultivar)
 *   - WA 38 (cultivar) → Cosmic Crisp (trade name)
 *   - Cripps Pink (cultivar) → Pink Lady (trade name)
 */
export interface Cultivar {
  id: string
  productId: string
  varietyId?: string         // Links to parent variety (e.g., 'navel', 'blood', 'honeycrisp')

  // Naming
  displayName: string        // Cultivar name (Washington Navel, Cara Cara, Moro)
  technicalName?: string     // Technical/botanical name if different (e.g., "WA 38", "Cripps Pink")
  tradeNames?: string[]      // Marketing names (e.g., ["Cosmic Crisp"], ["Pink Lady"])

  modelType: ModelType

  // === H - HERITAGE (SHARE) ===
  // Genetic potential for superior flavor AND nutrition
  heritageIntent?: HeritageIntent  // Canonical: true_heritage, heirloom_quality, heirloom_utility, modern_nutrient, modern_flavor, commercial
  /** @deprecated Use heritageIntent instead */
  heritageStatus?: HeritageStatus  // Legacy: heirloom, heritage, landrace, modern_quality
  isHeritage?: boolean             // Legacy field - true if heirloom/heritage/landrace
  isNonGmo?: boolean               // Non-GMO verified
  originLocked?: boolean           // True = only appears in curated origin regions (e.g., Kona Coffee, Vidalia Onion)
  validatedStates?: string[]       // US states where commercially grown (verified via USDA/extension data)
  yearIntroduced?: number          // Year cultivar was developed/released
  originStory?: string             // Heritage/breeding background

  // Characteristics
  flavorProfile?: string           // Tasting notes
  nutritionNotes?: string          // Key nutritional highlights

  // === R - RIPEN (SHARE) ===
  // Peak season timing, harvest window, transit characteristics
  ripen?: RipenProfile             // Full ripening profile (optional, can use individual fields)

  // Ripening behavior
  ripeningBehavior?: RipeningBehavior  // non_climacteric, climacteric_ambient, climacteric_cold, shelf_stable
  daysToRipenAmbient?: number      // For climacteric: days from harvest to peak at room temp
  storageLifeWeeks?: number        // How long CAN quality be maintained

  // For GDD-based cultivars (baseline - can be overridden per region)
  baseTemp?: number         // Base temperature for GDD calculation (°F)
  gddToMaturity?: number    // GDD to start of harvest window
  gddToPeak?: number        // GDD to peak quality
  gddWindow?: number        // Duration of harvest window in GDD

  // For calendar-based products (meat, honey, seafood)
  harvestMonths?: number[]         // Months when actually harvested (1-12)
  peakHarvestMonths?: number[]     // Optimal quality window within harvest
  peakMonths?: number[]            // Legacy field - alias for harvestMonths
  peakSeasons?: Season[]

  // For processed products
  parentCultivarId?: string // Source cultivar for processing timing
  parentVarietyId?: string  // Alias for parentCultivarId (backwards compat)

  // === E - ENRICH (SHARE) ===
  // Expected quality metrics for this cultivar (baseline - region can override)
  enrich?: EnrichMetrics           // Full metrics profile
  brixRange?: [number, number]     // Expected Brix range [min, max]
  brixOptimal?: number             // Target/peak Brix

  description?: string
}

/**
 * Region-specific offering (e.g., "Honeycrisp Apple from Washington")
 * This is the actual "product" consumers interact with
 *
 * Same cultivar in different regions produces different results due to:
 * - Climate (GDD accumulation rate)
 * - Terroir (soil, elevation, microclimate)
 * - Growing practices
 */
export interface RegionalOffering {
  id: string                // Unique: `${cultivarId}_${regionId}`
  cultivarId?: string       // References Cultivar.id (preferred)
  varietyId?: string        // Alias for cultivarId (backwards compat)
  regionId: string          // References US_GROWING_REGIONS

  // Region-specific GDD overrides (microclimates, elevation, etc.)
  gddToMaturityOverride?: number
  gddToPeakOverride?: number
  gddWindowOverride?: number
  baseTempOverride?: number

  // Region-specific calendar overrides
  peakMonthsOverride?: number[]

  // Expected quality for this region (terroir effect)
  qualityTier?: 'exceptional' | 'excellent' | 'good'
  flavorNotes?: string      // Region-specific tasting notes (e.g., "Texas soil adds sweetness")

  // Availability tracking
  isActive: boolean         // Currently being tracked in system
  availableFrom?: string    // Typical season start (month name)
  availableTo?: string      // Typical season end (month name)

  // === S - SOIL (SHARE) ===
  // Region/farm-specific soil characteristics
  soil?: SoilProfile               // Full soil profile for this offering
  terroirNotes?: string            // How this region's terroir affects quality

  // === A - AGRICULTURAL PRACTICES (SHARE) ===
  // Farm-level growing practices for this offering
  practices?: AgriculturalPractices  // Full practices profile
  isOrganic?: boolean              // Quick flag for organic
  isRegenerative?: boolean         // Quick flag for regenerative
  pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'

  // === R - RIPEN (SHARE) ===
  // Region-specific harvest timing and shipping
  harvestMonthsOverride?: number[]   // Override cultivar's harvest months for this region
  peakHarvestMonthsOverride?: number[] // Override peak harvest for this region
  availableMonths?: number[]         // Editorial: how long we choose to offer (may extend beyond harvest)
  shippingModes?: ShippingOption[]   // Available shipping options for this offering

  // === E - ENRICH (SHARE) ===
  // Region-specific quality metrics (terroir effect on measurable quality)
  enrich?: EnrichMetrics           // Full metrics for this region
  brixExpected?: number            // Expected Brix for this region (terroir effect)
  brixRange?: [number, number]     // Region-specific Brix range
}

// Backwards compatibility alias
export type { RegionalOffering as Offering }

/**
 * Rootstock (ONLY for tree crops - fruit trees, nut trees)
 *
 * NOT applicable to:
 * - Row crops (tomatoes, peppers, squash)
 * - Root vegetables (carrots, potatoes, beets)
 * - Berries (strawberries, blueberries - mostly own-root)
 * - Leafy greens
 * - Animal products
 *
 * Applicable to:
 * - Citrus (oranges, grapefruit, lemons)
 * - Pome fruit (apples, pears)
 * - Stone fruit (peaches, cherries, plums)
 * - Tree nuts (pecans, walnuts, almonds)
 * - Grapes (wine and table)
 */
export interface Rootstock {
  id: string
  name: string
  displayName: string

  // Which products this rootstock is used for
  compatibleProducts: string[]  // Product IDs (e.g., ['apple', 'pear'])

  // Effects on harvest
  vigor: 'dwarf' | 'semi-dwarf' | 'standard'
  harvestDaysOffset: number     // +/- days relative to standard timing

  // Effects on fruit quality
  fruitSizeEffect?: 'smaller' | 'standard' | 'larger'
  brixModifier?: number         // +/- Brix points

  // Characteristics
  diseaseResistance?: string[]  // e.g., ['fire_blight', 'collar_rot']
  coldHardiness?: 'low' | 'medium' | 'high'

  notes?: string
}

// Products that can have rootstocks (tree crops only)
export const GRAFTED_PRODUCT_CATEGORIES: ProductSubcategory[] = [
  'citrus',
  'stone_fruit',
  'pome_fruit',
  'tree_nut',
  // Note: 'berry' includes grapes which ARE grafted, but also strawberries which are NOT
  // Handle grape separately
]

export function isGraftedProduct(subcategory: ProductSubcategory, productId?: string): boolean {
  if (GRAFTED_PRODUCT_CATEGORIES.includes(subcategory)) return true
  // Grapes are grafted but in 'berry' subcategory
  if (productId === 'grape' || productId === 'wine_grape') return true
  return false
}

// =============================================================================
// PRODUCT TYPES - NOW IN product-types.ts
// =============================================================================
// PRODUCT_TYPES array has been moved to product-types.ts to avoid circular
// dependency with regional-offering-generator.ts
// Re-exported from the top of this file for backwards compatibility.
//
// IMPORTANT: Do NOT add PRODUCT_TYPES entries here - add them to product-types.ts

// =============================================================================
// VARIETIES (consumer-recognized groupings within a product)
// =============================================================================
// Variety is the name consumers search for: "Navel Orange", "Blood Orange", "Honeycrisp"
// Cultivars are the specific selections within each variety

export const VARIETIES: Variety[] = [
  // === ORANGE VARIETIES ===
  { id: 'navel', productId: 'orange', displayName: 'Navel Orange', description: 'Seedless eating oranges, easy to peel' },
  { id: 'valencia', productId: 'orange', displayName: 'Valencia Orange', description: 'Juicing oranges, summer harvest' },
  { id: 'blood', productId: 'orange', displayName: 'Blood Orange', description: 'Red flesh, berry notes, Mediterranean origin' },

  // === GRAPEFRUIT VARIETIES ===
  { id: 'ruby_grapefruit', productId: 'grapefruit', displayName: 'Ruby Grapefruit', description: 'Red flesh, sweet-tart balance' },
  { id: 'white_grapefruit', productId: 'grapefruit', displayName: 'White Grapefruit', description: 'Pale flesh, more tart' },

  // === LEMON VARIETIES ===
  { id: 'eureka_lemon', productId: 'lemon', displayName: 'Eureka Lemon', description: 'Classic lemon, year-round' },
  { id: 'meyer_lemon', productId: 'lemon', displayName: 'Meyer Lemon', description: 'Sweeter, less acidic, orange notes' },

  // === APPLE VARIETIES (1:1 with cultivar for most) ===
  { id: 'honeycrisp', productId: 'apple', displayName: 'Honeycrisp', description: 'Sweet-tart, exceptionally crisp' },
  { id: 'cosmic_crisp', productId: 'apple', displayName: 'Cosmic Crisp', description: 'Large, crisp, slow to brown' },
  { id: 'fuji', productId: 'apple', displayName: 'Fuji', description: 'Very sweet, dense, stores well' },
  { id: 'gala', productId: 'apple', displayName: 'Gala', description: 'Mild, sweet, aromatic' },
  { id: 'pink_lady', productId: 'apple', displayName: 'Pink Lady', description: 'Sweet-tart, crunchy, late harvest' },
  { id: 'granny_smith', productId: 'apple', displayName: 'Granny Smith', description: 'Tart, green, firm' },

  // === PEACH VARIETIES ===
  { id: 'yellow_peach', productId: 'peach', displayName: 'Yellow Peach', description: 'Classic sweet peach, yellow flesh' },
  { id: 'white_peach', productId: 'peach', displayName: 'White Peach', description: 'Sweeter, less acidic, white flesh' },
  { id: 'donut_peach', productId: 'peach', displayName: 'Donut Peach', description: 'Flat shape, sweet, low acid' },

  // === PEAR VARIETIES ===
  { id: 'bartlett', productId: 'pear', displayName: 'Bartlett Pear', description: 'Classic sweet pear, aromatic' },
  { id: 'anjou', productId: 'pear', displayName: 'Anjou Pear', description: 'Mild flavor, smooth texture' },
  { id: 'comice', productId: 'pear', displayName: 'Comice Pear', description: 'Buttery, sweet, holiday favorite' },
  { id: 'bosc', productId: 'pear', displayName: 'Bosc Pear', description: 'Firm, sweet-spice notes, good for baking' },

  // More varieties can be added as needed...
]

// =============================================================================
// CULTIVARS (specific genetic selections within varieties)
// =============================================================================

export const CULTIVARS: Cultivar[] = [
  // === ORANGE VARIETIES ===
  // Citrus uses calendar model - perennial crops with predictable harvest windows
  // validatedStates based on USDA NASS citrus production data
  {
    id: 'navel_orange',
    productId: 'orange',
    displayName: 'Washington Navel',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['CA', 'FL', 'TX', 'AZ'], // All major citrus states
    flavorProfile: 'Sweet, seedless, ideal for eating fresh',
    peakMonths: [11, 12, 1], // Nov-Jan
  },
  {
    id: 'cara_cara',
    productId: 'orange',
    displayName: 'Cara Cara',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['CA'], // Specialty navel, primarily California
    flavorProfile: 'Pink flesh, low acid, berry notes',
    peakMonths: [12, 1, 2], // Dec-Feb
  },
  {
    id: 'valencia_orange',
    productId: 'orange',
    displayName: 'Valencia',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['CA', 'FL', 'TX'], // Major juicing orange
    flavorProfile: 'Premier juicing orange, sweet-tart balance',
    peakMonths: [3, 4, 5, 6], // Mar-Jun
  },
  {
    id: 'blood_orange',
    productId: 'orange',
    displayName: 'Moro Blood Orange',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['CA'], // Needs cool nights for color development
    flavorProfile: 'Deep red flesh, raspberry-citrus notes',
    peakMonths: [12, 1, 2, 3], // Dec-Mar
  },

  // === GRAPEFRUIT VARIETIES ===
  {
    id: 'ruby_red_grapefruit',
    productId: 'grapefruit',
    displayName: 'Ruby Red',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['TX', 'FL', 'CA', 'AZ'], // TX famous for Ruby Red
    flavorProfile: 'Sweet-tart, deep pink flesh',
    peakMonths: [11, 12, 1, 2, 3, 4, 5], // Nov-May
  },
  {
    id: 'rio_star_grapefruit',
    productId: 'grapefruit',
    displayName: 'Rio Star',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['TX'], // Texas Rio Grande Valley specialty
    flavorProfile: 'Very sweet, red flesh, Texas favorite',
    peakMonths: [11, 12, 1, 2, 3], // Nov-Mar
  },
  {
    id: 'marsh_grapefruit',
    productId: 'grapefruit',
    displayName: 'Marsh White',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['FL', 'TX', 'CA', 'AZ'], // Heritage variety, all citrus states
    flavorProfile: 'Classic tart grapefruit, white flesh',
    peakMonths: [11, 12, 1, 2, 3, 4, 5], // Nov-May
  },

  // === TANGERINE/MANDARIN VARIETIES ===
  {
    id: 'satsuma',
    productId: 'tangerine',
    displayName: 'Owari Satsuma',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['CA', 'FL', 'LA', 'AL', 'TX'], // Gulf Coast satsuma belt + CA
    flavorProfile: 'Very sweet, seedless, easy peel',
    peakMonths: [10, 11, 12], // Oct-Dec
  },
  {
    id: 'clementine',
    productId: 'tangerine',
    displayName: 'Clementine',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['CA'], // Primarily California
    flavorProfile: 'Sweet, seedless, perfect snack size',
    peakMonths: [11, 12, 1], // Nov-Jan
  },
  {
    id: 'honey_tangerine',
    productId: 'tangerine',
    displayName: 'Honey Tangerine (Murcott)',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['FL', 'CA'], // Florida specialty, some CA
    flavorProfile: 'Intensely sweet, rich flavor, some seeds',
    peakMonths: [1, 2, 3, 4], // Jan-Apr
  },

  // === LEMON VARIETIES ===
  // Lemons produce year-round in warm climates, peak winter
  {
    id: 'eureka_lemon',
    productId: 'lemon',
    displayName: 'Eureka',
    modelType: 'calendar',
    validatedStates: ['CA', 'AZ'], // CA coastal, AZ desert
    flavorProfile: 'Classic lemon, true sour, year-round',
    peakMonths: [11, 12, 1, 2, 3], // Nov-Mar peak, available year-round
  },
  {
    id: 'meyer_lemon',
    productId: 'lemon',
    displayName: 'Meyer Lemon',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['CA', 'TX', 'FL'], // CA primarily, some TX/FL
    flavorProfile: 'Sweet-tart, floral, thin skin',
    peakMonths: [11, 12, 1, 2, 3], // Nov-Mar
  },

  // === APPLE VARIETIES ===
  // Apples - perennial tree fruit, calendar-based harvest
  // USDA tracks top states: WA, NY, MI, PA, VA, CA, OR, NC (Henderson County)
  {
    id: 'honeycrisp',
    productId: 'apple',
    displayName: 'Honeycrisp',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['WA', 'NY', 'MI', 'MN', 'NC'], // MN origin, top apple states + NC mountains
    flavorProfile: 'Explosive crunch, honey-sweet with tang',
    nutritionNotes: 'High in fiber and vitamin C',
    peakMonths: [9, 10], // September-October
  },
  {
    id: 'fuji',
    productId: 'apple',
    displayName: 'Fuji',
    modelType: 'calendar',
    validatedStates: ['WA', 'CA'], // West Coast production
    flavorProfile: 'Very sweet, dense, long storage',
    peakMonths: [10, 11], // October-November
  },
  {
    id: 'gala',
    productId: 'apple',
    displayName: 'Gala',
    modelType: 'calendar',
    validatedStates: ['WA', 'NY', 'MI', 'PA', 'VA', 'NC'], // Major apple states + NC mountains
    flavorProfile: 'Mild sweet, crisp, kids favorite',
    peakMonths: [8, 9], // August-September (early variety)
  },
  {
    id: 'granny_smith',
    productId: 'apple',
    displayName: 'Granny Smith',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['WA', 'CA'], // West Coast, needs long season
    flavorProfile: 'Tart, firm, excellent for baking',
    peakMonths: [10, 11], // October-November
  },
  {
    id: 'pink_lady',
    productId: 'apple',
    displayName: 'Pink Lady (Cripps Pink)',
    modelType: 'calendar',
    validatedStates: ['WA', 'CA'], // West Coast, needs warm days/cool nights
    flavorProfile: 'Sweet-tart balance, effervescent',
    peakMonths: [10, 11, 12], // October-December (late variety)
  },
  {
    id: 'arkansas_black',
    productId: 'apple',
    displayName: 'Arkansas Black',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['AR', 'VA', 'CA', 'NC'], // Heritage, limited production, Appalachian states
    flavorProfile: 'Deep purple, complex, improves in storage',
    peakMonths: [10, 11], // October-November
  },
  {
    id: 'cosmic_crisp',
    productId: 'apple',
    displayName: 'Cosmic Crisp',
    modelType: 'calendar',
    isNonGmo: true,
    validatedStates: ['WA'], // WSU exclusive variety, Washington only
    flavorProfile: 'Ultra crisp, balanced sweet-acid, slow browning',
    peakMonths: [10, 11], // October-November
  },

  // === PEACH VARIETIES ===
  // Peaches - perennial stone fruit, calendar-based harvest
  // CA 75% of US production, SC and GA are #2/#3
  {
    id: 'elberta_peach',
    productId: 'peach',
    displayName: 'Elberta',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['CA', 'GA', 'SC', 'NJ'], // Heritage, widely grown
    flavorProfile: 'Classic peach flavor, freestone, great for canning',
    peakMonths: [7, 8], // July-August
  },
  {
    id: 'georgia_belle',
    productId: 'peach',
    displayName: 'Georgia Belle',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['GA', 'SC'], // Southern specialty
    flavorProfile: 'White flesh, incredibly sweet and aromatic',
    peakMonths: [7, 8], // July-August
  },
  {
    id: 'redhaven',
    productId: 'peach',
    displayName: 'Redhaven',
    modelType: 'calendar',
    validatedStates: ['CA', 'GA', 'SC', 'MI', 'NJ'], // Widely grown, early variety
    flavorProfile: 'Bright red skin, firm yellow flesh, balanced flavor',
    peakMonths: [6, 7], // June-July (early variety)
  },
  {
    id: 'white_lady',
    productId: 'peach',
    displayName: 'White Lady',
    modelType: 'calendar',
    validatedStates: ['CA', 'GA'], // Primarily California
    flavorProfile: 'White flesh, sub-acid, intensely sweet',
    peakMonths: [7, 8], // July-August
  },

  // === CHERRY VARIETIES ===
  // Cherries - perennial stone fruit, calendar-based harvest
  // Sweet: WA, OR, CA (Pacific Northwest dominates)
  // Tart: MI, WI, NY, UT
  {
    id: 'bing_cherry',
    productId: 'cherry',
    displayName: 'Bing',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['WA', 'OR', 'CA'], // Pacific Northwest + CA
    flavorProfile: 'Deep red, firm, intensely sweet',
    peakMonths: [6, 7], // June-July
  },
  {
    id: 'rainier_cherry',
    productId: 'cherry',
    displayName: 'Rainier',
    modelType: 'calendar',
    validatedStates: ['WA', 'OR'], // Pacific Northwest specialty
    flavorProfile: 'Yellow-red blush, delicate, ultra-sweet',
    peakMonths: [6, 7], // June-July
  },
  {
    id: 'montmorency',
    productId: 'cherry',
    displayName: 'Montmorency',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['MI', 'WI', 'NY', 'UT'], // Tart cherry states
    flavorProfile: 'Tart, bright red, perfect for pies',
    peakMonths: [7], // July
  },

  // === STRAWBERRY VARIETIES ===
  // Strawberries - calendar-based (varies by region)
  // CA ~90% of US production, FL ~8% (winter crop Dec-Mar), minor: NC, OR
  // UF/IFAS breeding program (Plant City) since 1948 - major FL cultivar source

  // --- California Cultivars (UC Davis) ---
  {
    id: 'chandler_strawberry',
    productId: 'strawberry',
    displayName: 'Chandler',
    modelType: 'calendar',
    validatedStates: ['CA'], // UC Davis origin, dominated CA 1983-mid90s
    flavorProfile: 'Large, very sweet, excellent flavor',
    peakMonths: [3, 4, 5, 6], // March-June
  },
  {
    id: 'seascape',
    productId: 'strawberry',
    displayName: 'Seascape',
    modelType: 'calendar',
    validatedStates: ['CA'], // UC Davis day-neutral, California coastal production
    flavorProfile: 'Day-neutral, complex flavor, long season',
    peakMonths: [5, 6, 7, 8, 9], // May-September (day-neutral, long season)
  },

  // --- Florida Cultivars (UF/IFAS Gulf Coast Research Center) ---
  {
    id: 'florida_brilliance',
    productId: 'strawberry',
    displayName: 'Florida Brilliance',
    modelType: 'calendar',
    validatedStates: ['FL'], // UF/IFAS 2017, ~60% of FL acreage, current market leader
    flavorProfile: 'Firm, bright red, excellent shelf life',
    peakMonths: [12, 1, 2, 3], // Dec-Mar (FL winter crop)
  },
  {
    id: 'sweet_sensation',
    productId: 'strawberry',
    displayName: 'Sweet Sensation (Florida127)',
    modelType: 'calendar',
    validatedStates: ['FL'], // UF/IFAS 2013, ~20% of FL acreage, exceptional sweetness
    flavorProfile: 'Very sweet, fruity aroma, excellent size',
    peakMonths: [12, 1, 2, 3], // Dec-Mar (FL winter crop)
  },
  {
    id: 'florida_medallion',
    productId: 'strawberry',
    displayName: 'Florida Medallion',
    modelType: 'calendar',
    validatedStates: ['FL'], // UF/IFAS 2020, ~20% of FL acreage, best flavor
    flavorProfile: 'Exceptionally sweet, fruity aroma, FL best-tasting',
    peakMonths: [12, 1, 2, 3], // Dec-Mar (FL winter crop)
  },
  {
    id: 'florida_radiance',
    productId: 'strawberry',
    displayName: 'Florida Radiance',
    modelType: 'calendar',
    validatedStates: ['FL'], // UF/IFAS 2008, was #1 until Brilliance, attractive luster
    flavorProfile: 'Attractive luster, balanced sweet-tart',
    peakMonths: [12, 1, 2, 3], // Dec-Mar (FL winter crop)
  },
  {
    id: 'sweet_charlie',
    productId: 'strawberry',
    displayName: 'Sweet Charlie',
    modelType: 'calendar',
    isHeritage: true,
    validatedStates: ['FL'], // UF/IFAS 1992, early release, still grown
    flavorProfile: 'Very sweet, soft, aromatic',
    peakMonths: [12, 1, 2, 3], // Dec-Mar (FL winter crop)
  },

  // --- East Coast Cultivars (USDA Beltsville) ---
  {
    id: 'earliglow',
    productId: 'strawberry',
    displayName: 'Earliglow',
    modelType: 'calendar',
    validatedStates: ['MD', 'NJ', 'PA', 'NY', 'NC', 'VA'], // USDA Beltsville origin (1975), East Coast
    flavorProfile: 'Exceptional flavor, early season',
    peakMonths: [5, 6], // May-June
  },

  // === BLUEBERRY VARIETIES ===
  // Blueberries - perennial shrubs, calendar-based harvest
  // Top states: WA, OR, GA, MI, NJ, FL, NC
  {
    id: 'duke_blueberry',
    productId: 'blueberry',
    displayName: 'Duke',
    modelType: 'calendar',
    validatedStates: ['NJ', 'MI', 'OR', 'WA'], // USDA Beltsville (1987), northern highbush
    flavorProfile: 'Mild sweet, firm, early season',
    peakMonths: [6, 7], // June-July (early)
  },
  {
    id: 'bluecrop',
    productId: 'blueberry',
    displayName: 'Bluecrop',
    modelType: 'calendar',
    validatedStates: ['NJ', 'MI', 'OR', 'WA'], // Most widely grown northern highbush
    flavorProfile: 'Classic blueberry flavor, reliable producer',
    peakMonths: [7, 8], // July-August (mid-season)
  },
  {
    id: 'rabbiteye',
    productId: 'blueberry',
    displayName: 'Rabbiteye',
    modelType: 'calendar',
    validatedStates: ['GA', 'FL', 'AL', 'MS'], // Native to SE US, Tifton GA breeding program
    flavorProfile: 'Heat-tolerant, sweet, southern variety',
    peakMonths: [6, 7, 8], // June-August (southern variety)
  },

  // === TOMATO VARIETIES ===
  // Summer crops - typically July-September harvest
  {
    id: 'brandywine',
    productId: 'tomato',
    displayName: 'Brandywine',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Pink, rich, complex heirloom flavor',
    baseTemp: 50, gddToMaturity: 1600, gddToPeak: 1800, gddWindow: 400,
    peakMonths: [7, 8, 9], // July-Sept
  },
  {
    id: 'cherokee_purple',
    productId: 'tomato',
    displayName: 'Cherokee Purple',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Deep purple, smoky-sweet, pre-Columbian origin',
    baseTemp: 50, gddToMaturity: 1500, gddToPeak: 1700, gddWindow: 400,
    peakMonths: [7, 8, 9], // July-Sept
  },
  {
    id: 'san_marzano',
    productId: 'tomato',
    displayName: 'San Marzano',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Paste tomato, low acid, sweet, Italian classic',
    baseTemp: 50, gddToMaturity: 1400, gddToPeak: 1600, gddWindow: 350,
    peakMonths: [7, 8, 9], // July-Sept
  },
  {
    id: 'sungold',
    productId: 'tomato',
    displayName: 'Sungold Cherry',
    modelType: 'gdd',
    flavorProfile: 'Orange cherry, intensely sweet, tropical notes',
    baseTemp: 50, gddToMaturity: 1200, gddToPeak: 1400, gddWindow: 400,
    peakMonths: [6, 7, 8, 9], // June-Sept (early cherry)
  },

  // === PEPPER VARIETIES ===
  // Late summer/fall crops - typically July-October
  {
    id: 'jimmy_nardello',
    productId: 'pepper',
    displayName: 'Jimmy Nardello',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Sweet frying pepper, Italian heirloom',
    baseTemp: 55, gddToMaturity: 1200, gddToPeak: 1400, gddWindow: 350,
    peakMonths: [7, 8, 9, 10], // July-Oct
  },
  {
    id: 'shishito',
    productId: 'pepper',
    displayName: 'Shishito',
    modelType: 'gdd',
    flavorProfile: 'Mild, blistering pepper, occasional heat',
    baseTemp: 55, gddToMaturity: 1100, gddToPeak: 1300, gddWindow: 400,
    peakMonths: [7, 8, 9, 10], // July-Oct
  },
  {
    id: 'hatch_chile',
    productId: 'pepper',
    displayName: 'Hatch Green Chile',
    modelType: 'gdd',
    isHeritage: true,
    originLocked: true, // Hatch Chile = New Mexico only (geographic designation)
    flavorProfile: 'Medium heat, earthy, roasting chile',
    baseTemp: 55, gddToMaturity: 1300, gddToPeak: 1500, gddWindow: 350,
    peakMonths: [8, 9], // Aug-Sept (Hatch season)
  },

  // === CARROT VARIETIES ===
  // Cool-season crops - spring and fall harvests
  {
    id: 'nantes_carrot',
    productId: 'carrot',
    displayName: 'Nantes',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Sweet, tender, cylindrical',
    baseTemp: 40, gddToMaturity: 1100, gddToPeak: 1250, gddWindow: 300,
    peakMonths: [6, 7, 10, 11], // Early summer and fall harvests
  },
  {
    id: 'purple_haze',
    productId: 'carrot',
    displayName: 'Purple Haze',
    modelType: 'gdd',
    flavorProfile: 'Purple exterior, orange core, sweet',
    nutritionNotes: 'High in anthocyanins',
    baseTemp: 40, gddToMaturity: 1150, gddToPeak: 1300, gddWindow: 300,
    peakMonths: [6, 7, 10, 11], // Early summer and fall harvests
  },

  // === POTATO VARIETIES ===
  // Summer harvest - typically July-September
  {
    id: 'yukon_gold',
    productId: 'potato',
    displayName: 'Yukon Gold',
    modelType: 'gdd',
    flavorProfile: 'Buttery, golden, all-purpose',
    baseTemp: 45, gddToMaturity: 1400, gddToPeak: 1600, gddWindow: 400,
    peakMonths: [7, 8, 9], // July-Sept
  },
  {
    id: 'fingerling',
    productId: 'potato',
    displayName: 'Fingerling',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Nutty, firm, waxy texture',
    baseTemp: 45, gddToMaturity: 1500, gddToPeak: 1700, gddWindow: 400,
    peakMonths: [8, 9, 10], // Aug-Oct
  },
  {
    id: 'purple_peruvian',
    productId: 'potato',
    displayName: 'Purple Peruvian',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Deep purple, earthy, antioxidant-rich',
    nutritionNotes: 'High in anthocyanins',
    baseTemp: 45, gddToMaturity: 1600, gddToPeak: 1800, gddWindow: 400,
    peakMonths: [8, 9, 10], // Aug-Oct
  },

  // === ONION VARIETIES ===
  // Spring harvest for sweet onions
  {
    id: 'vidalia_onion',
    productId: 'onion',
    displayName: 'Vidalia',
    modelType: 'gdd',
    originLocked: true, // Vidalia = Georgia only (legally protected designation)
    flavorProfile: 'Exceptionally sweet, low sulfur',
    baseTemp: 40, gddToMaturity: 1400, gddToPeak: 1600, gddWindow: 350,
    peakMonths: [4, 5, 6], // Apr-June (Vidalia season)
  },
  {
    id: 'walla_walla',
    productId: 'onion',
    displayName: 'Walla Walla',
    modelType: 'gdd',
    isHeritage: true,
    originLocked: true, // Walla Walla = Washington only (geographic designation)
    flavorProfile: 'Sweet, mild, Pacific Northwest treasure',
    baseTemp: 40, gddToMaturity: 1500, gddToPeak: 1700, gddWindow: 350,
    peakMonths: [6, 7, 8], // June-Aug (WA season)
  },

  // === GARLIC VARIETIES ===
  // Summer harvest - typically July-August
  {
    id: 'music_garlic',
    productId: 'garlic',
    displayName: 'Music (Hardneck)',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Robust, complex, large cloves',
    baseTemp: 35, gddToMaturity: 1800, gddToPeak: 2000, gddWindow: 400,
    peakMonths: [7, 8], // July-Aug
  },
  {
    id: 'inchelium_red',
    productId: 'garlic',
    displayName: 'Inchelium Red (Softneck)',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Mild, creamy, excellent for roasting',
    baseTemp: 35, gddToMaturity: 1700, gddToPeak: 1900, gddWindow: 400,
    peakMonths: [7, 8], // July-Aug
  },

  // === MEAT VARIETIES ===
  // Most meat is year-round (no peakMonths) - livestock is raised continuously
  // Exception: Spring Lamb is genuinely seasonal
  {
    id: 'grass_fed_beef',
    productId: 'beef',
    displayName: 'Grass-Fed Beef',
    modelType: 'calendar',
    flavorProfile: 'Lean, rich, true beef flavor',
    nutritionNotes: 'Higher omega-3s than grain-fed',
    // Year-round - cattle raised continuously
  },
  {
    id: 'heritage_pork',
    productId: 'pork',
    displayName: 'Heritage Pork',
    modelType: 'calendar',
    isHeritage: true,
    flavorProfile: 'Berkshire/Duroc, marbled, exceptional flavor',
    // Year-round - pigs raised continuously
  },
  {
    id: 'spring_lamb',
    productId: 'lamb',
    displayName: 'Spring Lamb',
    modelType: 'calendar',
    flavorProfile: 'Tender, mild, milk-fed',
    peakMonths: [4, 5, 6],
    peakSeasons: ['spring'],
    // Genuinely seasonal - lambs born in spring
  },
  {
    id: 'pasture_chicken',
    productId: 'chicken',
    displayName: 'Pasture-Raised Chicken',
    modelType: 'calendar',
    flavorProfile: 'Rich, firm texture, true chicken flavor',
    // Year-round - chickens raised continuously
  },
  {
    id: 'heritage_turkey',
    productId: 'turkey',
    displayName: 'Heritage Turkey',
    modelType: 'calendar',
    isHeritage: true,
    flavorProfile: 'Bourbon Red/Narragansett, deep flavor',
    // Year-round (though traditional demand peaks at Thanksgiving)
  },

  // === DAIRY/EGGS ===
  {
    id: 'pasture_eggs',
    productId: 'eggs',
    displayName: 'Pasture-Raised Eggs',
    modelType: 'calendar',
    flavorProfile: 'Deep orange yolks, rich flavor',
    nutritionNotes: '2x omega-3s, 3x vitamin E vs conventional',
    peakMonths: [3, 4, 5, 6, 7, 8, 9],
    peakSeasons: ['spring', 'summer', 'fall'],
  },
  {
    id: 'grass_milk',
    productId: 'milk',
    displayName: '100% Grass-Fed Milk',
    modelType: 'calendar',
    flavorProfile: 'Rich, seasonal variation in flavor',
    nutritionNotes: 'Higher CLA and omega-3s during grazing',
    peakMonths: [4, 5, 6, 7, 8, 9, 10],
    peakSeasons: ['spring', 'summer', 'fall'],
  },

  // === HONEY ===
  {
    id: 'wildflower_honey',
    productId: 'honey',
    displayName: 'Wildflower Honey',
    modelType: 'calendar',
    flavorProfile: 'Complex, varies by region and season',
    peakMonths: [5, 6, 7, 8, 9],
    peakSeasons: ['spring', 'summer'],
  },
  {
    id: 'tupelo_honey',
    productId: 'honey',
    displayName: 'Tupelo Honey',
    modelType: 'calendar',
    flavorProfile: 'Buttery, mild, never crystallizes',
    peakMonths: [4, 5],
    peakSeasons: ['spring'],
  },
  {
    id: 'sourwood_honey',
    productId: 'honey',
    displayName: 'Sourwood Honey',
    modelType: 'calendar',
    flavorProfile: 'Buttery, gingerbread notes, Appalachian',
    peakMonths: [7, 8],
    peakSeasons: ['summer'],
  },

  // === TREE NUTS ===
  // Fall harvest - typically September-November
  {
    id: 'pecan',
    productId: 'pecan',
    displayName: 'Desirable Pecan',
    modelType: 'gdd',
    flavorProfile: 'Rich, buttery, classic pecan flavor',
    baseTemp: 50, gddToMaturity: 2800, gddToPeak: 3200, gddWindow: 600,
    peakMonths: [10, 11], // Oct-Nov
  },
  {
    id: 'walnut',
    productId: 'walnut',
    displayName: 'Chandler Walnut',
    modelType: 'gdd',
    flavorProfile: 'Mild, versatile, light-colored',
    baseTemp: 50, gddToMaturity: 2600, gddToPeak: 3000, gddWindow: 500,
    peakMonths: [9, 10], // Sept-Oct
  },
  {
    id: 'almond',
    productId: 'almond',
    displayName: 'Nonpareil Almond',
    modelType: 'gdd',
    flavorProfile: 'Sweet, delicate, paper-thin shell',
    baseTemp: 50, gddToMaturity: 2400, gddToPeak: 2800, gddWindow: 400,
    peakMonths: [8, 9], // Aug-Sept
  },
  {
    id: 'hazelnut',
    productId: 'hazelnut',
    displayName: 'Barcelona Hazelnut',
    modelType: 'gdd',
    isHeritage: true,
    flavorProfile: 'Intense flavor, Oregon classic',
    baseTemp: 45, gddToMaturity: 2200, gddToPeak: 2600, gddWindow: 500,
    peakMonths: [9, 10], // Sept-Oct
  },
  {
    id: 'pistachio',
    productId: 'pistachio',
    displayName: 'Kerman Pistachio',
    modelType: 'gdd',
    flavorProfile: 'Rich, green, California grown',
    baseTemp: 55, gddToMaturity: 3200, gddToPeak: 3600, gddWindow: 500,
    peakMonths: [9, 10], // Sept-Oct
  },

  // === PROCESSED ===
  {
    id: 'fresh_squeezed_oj',
    productId: 'orange_juice',
    displayName: 'Fresh-Squeezed Orange Juice',
    modelType: 'parent',
    parentVarietyId: 'valencia_orange',
    flavorProfile: 'Bright, fresh, unpasteurized',
  },
  {
    id: 'fresh_cider',
    productId: 'apple_cider',
    displayName: 'Fresh Apple Cider',
    modelType: 'parent',
    parentVarietyId: 'honeycrisp',
    flavorProfile: 'Unfiltered, fresh-pressed, complex apple',
  },
  {
    id: 'grade_a_maple',
    productId: 'maple_syrup',
    displayName: 'Grade A Amber Maple Syrup',
    modelType: 'calendar',
    flavorProfile: 'Rich maple flavor, mid-season run',
    peakMonths: [2, 3, 4],
    peakSeasons: ['winter', 'spring'],
  },
  {
    id: 'fresh_evoo',
    productId: 'olive_oil',
    displayName: 'Fresh EVOO (Olio Nuovo)',
    modelType: 'parent',
    parentVarietyId: 'olive',
    flavorProfile: 'Peppery, grassy, unfiltered first press',
  },

  // === SALMON VARIETIES ===
  {
    id: 'sockeye_salmon',
    productId: 'salmon',
    displayName: 'Sockeye Salmon',
    modelType: 'calendar',
    flavorProfile: 'Rich, deep red flesh, firm texture',
    peakMonths: [6, 7, 8],
    peakSeasons: ['summer'],
  },
  {
    id: 'king_salmon',
    productId: 'salmon',
    displayName: 'King Salmon (Chinook)',
    modelType: 'calendar',
    flavorProfile: 'Highest fat content, buttery, prized',
    peakMonths: [5, 6, 7],
    peakSeasons: ['spring', 'summer'],
  },
  {
    id: 'coho_salmon',
    productId: 'salmon',
    displayName: 'Coho Salmon (Silver)',
    modelType: 'calendar',
    flavorProfile: 'Milder than sockeye, excellent smoked',
    peakMonths: [7, 8, 9, 10],
    peakSeasons: ['summer', 'fall'],
  },
  {
    id: 'copper_river_salmon',
    productId: 'salmon',
    displayName: 'Copper River Salmon',
    modelType: 'calendar',
    flavorProfile: 'Premium Alaska sockeye, high oil content',
    peakMonths: [5, 6],
    peakSeasons: ['spring'],
  },

  // === HALIBUT VARIETIES ===
  {
    id: 'pacific_halibut',
    productId: 'halibut',
    displayName: 'Pacific Halibut',
    modelType: 'calendar',
    flavorProfile: 'Firm white flesh, mild, sweet',
    peakMonths: [3, 4, 5, 6, 7, 8, 9],
    peakSeasons: ['spring', 'summer', 'fall'],
  },

  // === CRAB VARIETIES ===
  {
    id: 'dungeness_crab',
    productId: 'crab',
    displayName: 'Dungeness Crab',
    modelType: 'calendar',
    flavorProfile: 'Sweet, delicate, Pacific Northwest',
    peakMonths: [12, 1, 2, 3],
    peakSeasons: ['winter'],
  },
  {
    id: 'blue_crab',
    productId: 'crab',
    displayName: 'Blue Crab',
    modelType: 'calendar',
    flavorProfile: 'Sweet, Chesapeake Bay classic',
    peakMonths: [5, 6, 7, 8, 9],
    peakSeasons: ['spring', 'summer', 'fall'],
  },
  {
    id: 'king_crab',
    productId: 'crab',
    displayName: 'Alaskan King Crab',
    modelType: 'calendar',
    flavorProfile: 'Sweet, rich, massive legs',
    peakMonths: [10, 11, 12, 1],
    peakSeasons: ['fall', 'winter'],
  },
  {
    id: 'stone_crab',
    productId: 'crab',
    displayName: 'Florida Stone Crab',
    modelType: 'calendar',
    flavorProfile: 'Dense, sweet claw meat',
    peakMonths: [10, 11, 12, 1, 2, 3, 4, 5],
    peakSeasons: ['fall', 'winter', 'spring'],
  },

  // === LOBSTER VARIETIES ===
  {
    id: 'maine_lobster',
    productId: 'lobster',
    displayName: 'Maine Lobster',
    modelType: 'calendar',
    flavorProfile: 'Sweet, tender, cold water',
    peakMonths: [7, 8, 9, 10],
    peakSeasons: ['summer', 'fall'],
  },
  {
    id: 'spiny_lobster',
    productId: 'lobster',
    displayName: 'Florida Spiny Lobster',
    modelType: 'calendar',
    flavorProfile: 'Firm tail meat, sweet',
    peakMonths: [8, 9, 10, 11, 12, 1, 2, 3],
    peakSeasons: ['fall', 'winter', 'spring'],
  },

  // === OYSTER VARIETIES ===
  {
    id: 'apalachicola_oyster',
    productId: 'oyster',
    displayName: 'Apalachicola Oyster',
    modelType: 'calendar',
    flavorProfile: 'Briny, plump, Gulf Coast',
    peakMonths: [10, 11, 12, 1, 2, 3],
    peakSeasons: ['fall', 'winter', 'spring'],
  },
  {
    id: 'pacific_oyster',
    productId: 'oyster',
    displayName: 'Pacific Oyster',
    modelType: 'calendar',
    flavorProfile: 'Creamy, sweet, cucumber finish',
    peakMonths: [9, 10, 11, 12, 1, 2, 3, 4],
    peakSeasons: ['fall', 'winter', 'spring'],
  },
  {
    id: 'kumamoto_oyster',
    productId: 'oyster',
    displayName: 'Kumamoto Oyster',
    modelType: 'calendar',
    flavorProfile: 'Small, sweet, fruity, melon finish',
    peakMonths: [9, 10, 11, 12, 1, 2, 3, 4],
    peakSeasons: ['fall', 'winter', 'spring'],
  },

  // === COFFEE VARIETIES ===
  {
    id: 'kona_coffee',
    productId: 'coffee',
    displayName: 'Kona Coffee',
    modelType: 'calendar',
    originLocked: true, // Kona Coffee = Hawaii only (geographic designation)
    flavorProfile: 'Smooth, low acid, nutty, chocolate notes',
    peakMonths: [8, 9, 10, 11, 12],
    peakSeasons: ['fall', 'winter'],
  },
  {
    id: 'puerto_rico_coffee',
    productId: 'coffee',
    displayName: 'Puerto Rican Coffee',
    modelType: 'calendar',
    flavorProfile: 'Balanced, sweet, fruity, chocolate',
    peakMonths: [9, 10, 11, 12, 1],
    peakSeasons: ['fall', 'winter'],
  },
  {
    id: 'california_coffee',
    productId: 'coffee',
    displayName: 'California-Grown Coffee',
    modelType: 'calendar',
    flavorProfile: 'Unique terroir, citrus notes',
    peakMonths: [10, 11, 12],
    peakSeasons: ['fall', 'winter'],
  },
  {
    id: 'kauai_coffee',
    productId: 'coffee',
    displayName: 'Kauai Coffee',
    modelType: 'calendar',
    flavorProfile: 'Medium body, caramel, honey',
    peakMonths: [9, 10, 11, 12, 1],
    peakSeasons: ['fall', 'winter'],
  },

  // === BISON ===
  {
    id: 'grass_fed_bison',
    productId: 'bison',
    displayName: 'Grass-Fed Bison',
    modelType: 'calendar',
    flavorProfile: 'Lean, rich, slightly sweet',
    peakSeasons: ['fall', 'winter'],
  },

  // === TROPICAL FRUIT CULTIVARS ===
  {
    id: 'rainbow_papaya',
    productId: 'papaya',
    displayName: 'Rainbow Papaya',
    modelType: 'calendar',
    flavorProfile: 'Sweet, orange flesh, Hawaiian',
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: 'red_dragon_fruit',
    productId: 'dragon_fruit',
    displayName: 'Red Dragon Fruit',
    modelType: 'calendar',
    flavorProfile: 'Magenta flesh, mildly sweet, kiwi-like',
    peakMonths: [6, 7, 8, 9, 10, 11],
    peakSeasons: ['summer', 'fall'],
  },
  {
    id: 'brewster_lychee',
    productId: 'lychee',
    displayName: 'Brewster Lychee',
    modelType: 'calendar',
    flavorProfile: 'Sweet, floral, grape-like',
    peakMonths: [5, 6, 7],
    peakSeasons: ['spring', 'summer'],
  },
  {
    id: 'mamey_colorado',
    productId: 'mamey',
    displayName: 'Mamey Sapote',
    modelType: 'calendar',
    flavorProfile: 'Sweet potato meets pumpkin pie',
    peakMonths: [5, 6, 7, 8, 9],
    peakSeasons: ['spring', 'summer', 'fall'],
  },

  // === SPECIALTY CHILE CULTIVARS ===
  {
    id: 'hatch_green',
    productId: 'hatch_chile',
    displayName: 'Hatch Green Chile',
    modelType: 'calendar',
    originLocked: true, // Hatch Chile = New Mexico only
    flavorProfile: 'Earthy, smoky, medium heat',
    peakMonths: [8, 9],
    peakSeasons: ['summer', 'fall'],
  },
  {
    id: 'hatch_red',
    productId: 'hatch_chile',
    displayName: 'Hatch Red Chile',
    modelType: 'calendar',
    originLocked: true, // Hatch Chile = New Mexico only
    flavorProfile: 'Sweeter, deeper flavor, dried pods',
    peakMonths: [9, 10],
    peakSeasons: ['fall'],
  },
  {
    id: 'datil_hot',
    productId: 'datil_pepper',
    displayName: 'Datil Pepper',
    modelType: 'calendar',
    flavorProfile: 'Sweet heat, fruity, habanero cousin',
    peakMonths: [7, 8, 9, 10],
    peakSeasons: ['summer', 'fall'],
  },

  // === SHRIMP ===
  {
    id: 'gulf_shrimp',
    productId: 'shrimp',
    displayName: 'Gulf Wild Shrimp',
    modelType: 'calendar',
    flavorProfile: 'Sweet, firm, wild-caught',
    peakMonths: [5, 6, 7, 8, 9, 10],
    peakSeasons: ['spring', 'summer', 'fall'],
  },
  {
    id: 'royal_red_shrimp',
    productId: 'shrimp',
    displayName: 'Royal Red Shrimp',
    modelType: 'calendar',
    flavorProfile: 'Sweet like lobster, deep water',
    peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },

  // === CRAWFISH ===
  {
    id: 'louisiana_crawfish',
    productId: 'crawfish',
    displayName: 'Louisiana Crawfish',
    modelType: 'calendar',
    flavorProfile: 'Sweet, Cajun tradition',
    peakMonths: [3, 4, 5, 6],
    peakSeasons: ['spring'],
  },

  // === MACADAMIA ===
  {
    id: 'hawaii_macadamia',
    productId: 'macadamia',
    displayName: 'Hawaiian Macadamia',
    modelType: 'calendar',
    flavorProfile: 'Buttery, rich, creamy',
    peakMonths: [9, 10, 11, 12, 1],
    peakSeasons: ['fall', 'winter'],
  },

  // === WILD RICE ===
  {
    id: 'minnesota_wild_rice',
    productId: 'wild_rice',
    displayName: 'Minnesota Wild Rice',
    modelType: 'calendar',
    originLocked: true, // Minnesota Wild Rice = Minnesota/Great Lakes only (native tradition)
    flavorProfile: 'Nutty, earthy, hand-harvested',
    peakMonths: [9, 10],
    peakSeasons: ['fall'],
  },

  // === MAPLE SYRUP (additional grades) ===
  {
    id: 'grade_a_dark',
    productId: 'maple_syrup',
    displayName: 'Grade A Dark Robust',
    modelType: 'calendar',
    flavorProfile: 'Strong maple, late season run',
    peakMonths: [3, 4],
    peakSeasons: ['spring'],
  },
  {
    id: 'grade_a_golden',
    productId: 'maple_syrup',
    displayName: 'Grade A Golden Delicate',
    modelType: 'calendar',
    flavorProfile: 'Light, delicate, first run',
    peakMonths: [2, 3],
    peakSeasons: ['winter', 'spring'],
  },

  // === BIRCH SYRUP ===
  {
    id: 'alaska_birch_syrup',
    productId: 'birch_syrup',
    displayName: 'Alaska Birch Syrup',
    modelType: 'calendar',
    originLocked: true, // Alaska Birch Syrup = Alaska only
    flavorProfile: 'Molasses-like, complex, earthy',
    peakMonths: [4, 5],
    peakSeasons: ['spring'],
  },

  // === YAUPON TEA ===
  {
    id: 'yaupon_green',
    productId: 'yaupon_tea',
    displayName: 'Green Yaupon',
    modelType: 'calendar',
    flavorProfile: 'Smooth, earthy, naturally caffeinated',
    peakSeasons: ['spring', 'summer', 'fall'],
  },
  {
    id: 'yaupon_roasted',
    productId: 'yaupon_tea',
    displayName: 'Roasted Yaupon',
    modelType: 'calendar',
    flavorProfile: 'Dark, bold, coffee-like',
    peakSeasons: ['spring', 'summer', 'fall'],
  },

  // === COUNTRY HAM ===
  {
    id: 'virginia_country_ham',
    productId: 'country_ham',
    displayName: 'Virginia Country Ham',
    modelType: 'calendar',
    flavorProfile: 'Salt-cured, smoky, aged',
    peakSeasons: ['fall', 'winter'],
  },
  {
    id: 'tennessee_country_ham',
    productId: 'country_ham',
    displayName: 'Tennessee Country Ham',
    modelType: 'calendar',
    flavorProfile: 'Hickory smoked, dry-cured',
    peakSeasons: ['fall', 'winter'],
  },

  // === MUSCADINE ===
  {
    id: 'scuppernong',
    productId: 'muscadine',
    displayName: 'Scuppernong',
    modelType: 'calendar',
    flavorProfile: 'Bronze, sweet, musky, historic',
    peakMonths: [8, 9, 10],
    peakSeasons: ['summer', 'fall'],
  },
  {
    id: 'carlos_muscadine',
    productId: 'muscadine',
    displayName: 'Carlos Muscadine',
    modelType: 'calendar',
    flavorProfile: 'Bronze, sweet, wine grape',
    peakMonths: [8, 9, 10],
    peakSeasons: ['summer', 'fall'],
  },
]

// =============================================================================
// REGIONAL OFFERINGS (Variety × Region combinations)
// =============================================================================

// Import generator function (NOT pre-computed constant to avoid circular deps)
import { generateRegionalOfferings } from './regional-offering-generator'

/**
 * Curated regional offerings with hand-crafted flavor notes and quality tiers.
 * These take precedence over generated offerings when merging.
 */
const CURATED_REGIONAL_OFFERINGS: RegionalOffering[] = [
  // === CITRUS - Florida ===
  { id: 'navel_orange_indian_river', varietyId: 'navel_orange', regionId: 'indian_river', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Sweet, optimal Brix from Indian River soil' },
  { id: 'navel_orange_central_florida', varietyId: 'navel_orange', regionId: 'central_florida', isActive: true, qualityTier: 'excellent' },
  { id: 'valencia_orange_indian_river', varietyId: 'valencia_orange', regionId: 'indian_river', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Premium juice orange' },
  { id: 'valencia_orange_central_florida', varietyId: 'valencia_orange', regionId: 'central_florida', isActive: true, qualityTier: 'excellent' },
  { id: 'ruby_red_grapefruit_indian_river', varietyId: 'ruby_red_grapefruit', regionId: 'indian_river', isActive: true, qualityTier: 'exceptional' },
  { id: 'satsuma_gulf_coast', varietyId: 'satsuma', regionId: 'gulf_coast_citrus', isActive: true, qualityTier: 'excellent', flavorNotes: 'Cold-hardy, early season' },
  { id: 'honey_tangerine_central_florida', varietyId: 'honey_tangerine', regionId: 'central_florida', isActive: true, qualityTier: 'exceptional' },

  // === CITRUS - Texas ===
  { id: 'rio_star_grapefruit_rio_grande', varietyId: 'rio_star_grapefruit', regionId: 'texas_rgv', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Texas terroir, extra sweet' },
  { id: 'ruby_red_grapefruit_rio_grande', varietyId: 'ruby_red_grapefruit', regionId: 'texas_rgv', isActive: true, qualityTier: 'excellent' },

  // === CITRUS - California ===
  { id: 'navel_orange_central_valley_south', varietyId: 'navel_orange', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'cara_cara_central_valley_south', varietyId: 'cara_cara', regionId: 'california_central_valley', isActive: true, qualityTier: 'exceptional' },
  { id: 'blood_orange_central_valley_south', varietyId: 'blood_orange', regionId: 'california_central_valley', isActive: true, qualityTier: 'exceptional' },
  { id: 'eureka_lemon_ventura', varietyId: 'eureka_lemon', regionId: 'california_coastal', isActive: true, qualityTier: 'exceptional' },
  { id: 'meyer_lemon_central_valley_south', varietyId: 'meyer_lemon', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },

  // === APPLES - Washington ===
  { id: 'honeycrisp_pacific_northwest', varietyId: 'honeycrisp', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Cool nights enhance sweetness and crunch' },
  { id: 'fuji_pacific_northwest', varietyId: 'fuji', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'excellent' },
  { id: 'gala_pacific_northwest', varietyId: 'gala', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'excellent' },
  { id: 'cosmic_crisp_pacific_northwest', varietyId: 'cosmic_crisp', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Washington-bred variety' },

  // === APPLES - Northeast ===
  { id: 'honeycrisp_finger_lakes', varietyId: 'honeycrisp', regionId: 'new_york_finger_lakes', isActive: true, qualityTier: 'excellent', flavorNotes: 'Shorter season, intense flavor' },
  { id: 'honeycrisp_new_england', varietyId: 'honeycrisp', regionId: 'new_england', isActive: true, qualityTier: 'excellent' },
  { id: 'granny_smith_new_england', varietyId: 'granny_smith', regionId: 'new_england', isActive: true, qualityTier: 'good' },

  // === APPLES - Michigan ===
  { id: 'honeycrisp_great_lakes', varietyId: 'honeycrisp', regionId: 'michigan_west', isActive: true, qualityTier: 'excellent' },
  { id: 'fuji_great_lakes', varietyId: 'fuji', regionId: 'michigan_west', isActive: true, qualityTier: 'excellent' },

  // === PEACHES - Georgia ===
  { id: 'elberta_georgia_piedmont', varietyId: 'elberta_peach', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Georgia terroir, classic Southern peach' },
  { id: 'georgia_belle_georgia_piedmont', varietyId: 'georgia_belle', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'exceptional' },
  { id: 'redhaven_georgia_piedmont', varietyId: 'redhaven', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },

  // === PEACHES - South Carolina ===
  { id: 'elberta_south_carolina', varietyId: 'elberta_peach', regionId: 'south_carolina_ridge', isActive: true, qualityTier: 'excellent' },
  { id: 'white_lady_south_carolina', varietyId: 'white_lady', regionId: 'south_carolina_ridge', isActive: true, qualityTier: 'exceptional' },

  // === PEACHES - California ===
  { id: 'elberta_central_valley_north', varietyId: 'elberta_peach', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent', gddToMaturityOverride: 2300 },
  { id: 'redhaven_central_valley_north', varietyId: 'redhaven', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },

  // === CHERRIES - Washington/Oregon ===
  { id: 'bing_pacific_northwest', varietyId: 'bing_cherry', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'exceptional' },
  { id: 'rainier_pacific_northwest', varietyId: 'rainier_cherry', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Premium, handle with care' },
  { id: 'bing_willamette', varietyId: 'bing_cherry', regionId: 'pacific_nw_hood_river', isActive: true, qualityTier: 'excellent' },

  // === CHERRIES - Michigan ===
  { id: 'montmorency_great_lakes', varietyId: 'montmorency', regionId: 'michigan_west', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Tart cherry capital of the world' },
  { id: 'bing_great_lakes', varietyId: 'bing_cherry', regionId: 'michigan_west', isActive: true, qualityTier: 'excellent' },

  // === STRAWBERRIES ===
  { id: 'chandler_central_valley_south', varietyId: 'chandler_strawberry', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'chandler_ventura', varietyId: 'chandler_strawberry', regionId: 'california_coastal', isActive: true, qualityTier: 'exceptional' },
  { id: 'seascape_ventura', varietyId: 'seascape', regionId: 'california_coastal', isActive: true, qualityTier: 'excellent' },
  { id: 'earliglow_new_england', varietyId: 'earliglow', regionId: 'new_england', isActive: true, qualityTier: 'excellent' },
  { id: 'chandler_central_florida', varietyId: 'chandler_strawberry', regionId: 'central_florida', isActive: true, qualityTier: 'excellent', flavorNotes: 'Winter strawberries', peakMonthsOverride: [12, 1, 2, 3] }, // Dec-Mar for Florida winter crop

  // === BLUEBERRIES ===
  { id: 'duke_pacific_northwest', varietyId: 'duke_blueberry', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'excellent' },
  { id: 'bluecrop_great_lakes', varietyId: 'bluecrop', regionId: 'michigan_west', isActive: true, qualityTier: 'exceptional' },
  { id: 'bluecrop_new_england', varietyId: 'bluecrop', regionId: 'new_england', isActive: true, qualityTier: 'excellent' },
  { id: 'rabbiteye_georgia_piedmont', varietyId: 'rabbiteye', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },

  // === TOMATOES ===
  { id: 'brandywine_georgia_piedmont', varietyId: 'brandywine', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'exceptional' },
  { id: 'brandywine_central_valley_south', varietyId: 'brandywine', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'cherokee_purple_georgia_piedmont', varietyId: 'cherokee_purple', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Cherokee heritage, Southern terroir' },
  { id: 'san_marzano_central_valley_south', varietyId: 'san_marzano', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'sungold_central_valley_south', varietyId: 'sungold', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'sungold_new_england', varietyId: 'sungold', regionId: 'new_england', isActive: true, qualityTier: 'excellent' },

  // === PEPPERS ===
  { id: 'jimmy_nardello_central_valley_south', varietyId: 'jimmy_nardello', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'hatch_chile_rio_grande', varietyId: 'hatch_chile', regionId: 'texas_rgv', isActive: true, qualityTier: 'exceptional', flavorNotes: 'True Hatch, NM terroir' },
  { id: 'shishito_central_valley_south', varietyId: 'shishito', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },

  // === ROOT VEGETABLES ===
  { id: 'nantes_carrot_central_valley_south', varietyId: 'nantes_carrot', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'nantes_carrot_willamette', varietyId: 'nantes_carrot', regionId: 'pacific_nw_hood_river', isActive: true, qualityTier: 'excellent' },
  { id: 'yukon_gold_pacific_northwest', varietyId: 'yukon_gold', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'excellent' },
  { id: 'fingerling_finger_lakes', varietyId: 'fingerling', regionId: 'new_york_finger_lakes', isActive: true, qualityTier: 'excellent' },

  // === ONIONS ===
  { id: 'vidalia_georgia_piedmont', varietyId: 'vidalia_onion', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'exceptional', flavorNotes: 'True Vidalia, Georgia terroir required' },
  { id: 'walla_walla_pacific_northwest', varietyId: 'walla_walla', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'exceptional' },

  // === GARLIC ===
  { id: 'music_garlic_finger_lakes', varietyId: 'music_garlic', regionId: 'new_york_finger_lakes', isActive: true, qualityTier: 'excellent' },
  { id: 'music_garlic_willamette', varietyId: 'music_garlic', regionId: 'pacific_nw_hood_river', isActive: true, qualityTier: 'excellent' },
  { id: 'inchelium_red_pacific_northwest', varietyId: 'inchelium_red', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'exceptional' },

  // === NUTS ===
  { id: 'pecan_georgia_piedmont', varietyId: 'pecan', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },
  { id: 'pecan_hill_country', varietyId: 'pecan', regionId: 'texas_hill_country', isActive: true, qualityTier: 'excellent' },
  { id: 'walnut_central_valley_north', varietyId: 'walnut', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },
  { id: 'almond_central_valley_south', varietyId: 'almond', regionId: 'california_central_valley', isActive: true, qualityTier: 'exceptional' },
  { id: 'hazelnut_willamette', varietyId: 'hazelnut', regionId: 'pacific_nw_hood_river', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Oregon filberts, world-class' },
  { id: 'pistachio_central_valley_south', varietyId: 'pistachio', regionId: 'california_central_valley', isActive: true, qualityTier: 'exceptional' },

  // === MEAT ===
  { id: 'grass_fed_beef_hill_country', varietyId: 'grass_fed_beef', regionId: 'texas_hill_country', isActive: true, qualityTier: 'excellent' },
  { id: 'grass_fed_beef_pacific_northwest', varietyId: 'grass_fed_beef', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'excellent' },
  { id: 'heritage_pork_georgia_piedmont', varietyId: 'heritage_pork', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },
  { id: 'heritage_pork_new_england', varietyId: 'heritage_pork', regionId: 'new_england', isActive: true, qualityTier: 'excellent' },
  { id: 'spring_lamb_hill_country', varietyId: 'spring_lamb', regionId: 'texas_hill_country', isActive: true, qualityTier: 'excellent' },
  { id: 'pasture_chicken_georgia_piedmont', varietyId: 'pasture_chicken', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },
  { id: 'heritage_turkey_new_england', varietyId: 'heritage_turkey', regionId: 'new_england', isActive: true, qualityTier: 'exceptional' },

  // === DAIRY/EGGS ===
  { id: 'pasture_eggs_georgia_piedmont', varietyId: 'pasture_eggs', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },
  { id: 'pasture_eggs_pacific_northwest', varietyId: 'pasture_eggs', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'excellent' },
  { id: 'grass_milk_new_england', varietyId: 'grass_milk', regionId: 'new_england', isActive: true, qualityTier: 'excellent' },
  { id: 'grass_milk_pacific_northwest', varietyId: 'grass_milk', regionId: 'pacific_nw_yakima', isActive: true, qualityTier: 'excellent' },

  // === HONEY ===
  { id: 'wildflower_honey_georgia_piedmont', varietyId: 'wildflower_honey', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },
  { id: 'tupelo_honey_gulf_coast', varietyId: 'tupelo_honey', regionId: 'gulf_coast_citrus', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Rare, only from Gulf Coast swamps' },
  { id: 'sourwood_honey_georgia_piedmont', varietyId: 'sourwood_honey', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'exceptional' },

  // === PROCESSED ===
  { id: 'fresh_oj_indian_river', varietyId: 'fresh_squeezed_oj', regionId: 'indian_river', isActive: true, qualityTier: 'exceptional' },
  { id: 'fresh_cider_new_england', varietyId: 'fresh_cider', regionId: 'new_england', isActive: true, qualityTier: 'excellent' },
  { id: 'fresh_cider_finger_lakes', varietyId: 'fresh_cider', regionId: 'new_york_finger_lakes', isActive: true, qualityTier: 'excellent' },
  { id: 'maple_syrup_new_england', varietyId: 'grade_a_maple', regionId: 'new_england', isActive: true, qualityTier: 'exceptional' },
  { id: 'maple_syrup_finger_lakes', varietyId: 'grade_a_maple', regionId: 'new_york_finger_lakes', isActive: true, qualityTier: 'excellent' },
  { id: 'evoo_central_valley_south', varietyId: 'fresh_evoo', regionId: 'california_central_valley', isActive: true, qualityTier: 'excellent' },

  // === ALASKA SALMON ===
  { id: 'sockeye_salmon_bristol_bay', varietyId: 'sockeye_salmon', regionId: 'bristol_bay', isActive: true, qualityTier: 'exceptional', flavorNotes: 'World\'s largest sockeye run, premium wild' },
  { id: 'sockeye_salmon_kenai', varietyId: 'sockeye_salmon', regionId: 'kenai_peninsula', isActive: true, qualityTier: 'exceptional' },
  { id: 'sockeye_salmon_southeast', varietyId: 'sockeye_salmon', regionId: 'southeast_alaska', isActive: true, qualityTier: 'excellent' },
  { id: 'king_salmon_kenai', varietyId: 'king_salmon', regionId: 'kenai_peninsula', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Prized Chinook, highest fat content' },
  { id: 'king_salmon_southeast', varietyId: 'king_salmon', regionId: 'southeast_alaska', isActive: true, qualityTier: 'exceptional' },
  { id: 'copper_river_salmon_southeast', varietyId: 'copper_river_salmon', regionId: 'southeast_alaska', isActive: true, qualityTier: 'exceptional', flavorNotes: 'First of season, premium pricing' },
  { id: 'coho_salmon_kenai', varietyId: 'coho_salmon', regionId: 'kenai_peninsula', isActive: true, qualityTier: 'excellent', flavorNotes: 'Silver salmon, excellent smoked' },
  { id: 'coho_salmon_southeast', varietyId: 'coho_salmon', regionId: 'southeast_alaska', isActive: true, qualityTier: 'excellent' },

  // === ALASKA HALIBUT ===
  { id: 'halibut_kenai', varietyId: 'pacific_halibut', regionId: 'kenai_peninsula', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Homer: Halibut Capital of the World' },
  { id: 'halibut_southeast', varietyId: 'pacific_halibut', regionId: 'southeast_alaska', isActive: true, qualityTier: 'excellent' },

  // === CRAB ===
  { id: 'dungeness_crab_southeast', varietyId: 'dungeness_crab', regionId: 'southeast_alaska', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Cold water, sweet meat' },
  { id: 'king_crab_southeast', varietyId: 'king_crab', regionId: 'southeast_alaska', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Alaskan King, massive legs' },
  { id: 'blue_crab_maryland', varietyId: 'blue_crab', regionId: 'maryland_eastern_shore', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Chesapeake Bay classic, crab cakes' },
  { id: 'stone_crab_florida_keys', varietyId: 'stone_crab', regionId: 'florida_keys', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Dense claw meat, sustainable harvest' },
  { id: 'stone_crab_homestead', varietyId: 'stone_crab', regionId: 'homestead_redland', isActive: true, qualityTier: 'exceptional' },

  // === LOBSTER ===
  { id: 'maine_lobster_midcoast', varietyId: 'maine_lobster', regionId: 'maine_midcoast', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Cold water, sweet, tender' },
  { id: 'spiny_lobster_florida_keys', varietyId: 'spiny_lobster', regionId: 'florida_keys', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Warm water, firm tail meat' },

  // === OYSTERS ===
  { id: 'apalachicola_oyster_panhandle', varietyId: 'apalachicola_oyster', regionId: 'florida_panhandle', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Gulf Coast briny, plump' },
  { id: 'pacific_oyster_kenai', varietyId: 'pacific_oyster', regionId: 'kenai_peninsula', isActive: true, qualityTier: 'excellent', flavorNotes: 'Kachemak Bay, cold water' },
  { id: 'kumamoto_oyster_kenai', varietyId: 'kumamoto_oyster', regionId: 'kenai_peninsula', isActive: true, qualityTier: 'excellent' },

  // === GULF SEAFOOD ===
  { id: 'gulf_shrimp_louisiana', varietyId: 'gulf_shrimp', regionId: 'louisiana_gulf_coast', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Wild-caught Gulf shrimp' },
  { id: 'gulf_shrimp_alabama', varietyId: 'gulf_shrimp', regionId: 'alabama_gulf_coast', isActive: true, qualityTier: 'excellent' },
  { id: 'royal_red_shrimp_alabama', varietyId: 'royal_red_shrimp', regionId: 'alabama_gulf_coast', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Deep water, lobster-like sweetness' },

  // === CRAWFISH ===
  { id: 'crawfish_acadiana', varietyId: 'louisiana_crawfish', regionId: 'acadiana', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Crawfish Capital, Cajun tradition' },
  { id: 'crawfish_atchafalaya', varietyId: 'louisiana_crawfish', regionId: 'atchafalaya_basin', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Wild swamp crawfish' },

  // === COFFEE ===
  { id: 'kona_coffee_kona', varietyId: 'kona_coffee', regionId: 'kona_coast', isActive: true, qualityTier: 'exceptional', flavorNotes: 'World-famous Kona, volcanic soil' },
  { id: 'kauai_coffee_kauai', varietyId: 'kauai_coffee', regionId: 'kauai', isActive: true, qualityTier: 'excellent', flavorNotes: 'Largest US coffee estate' },
  { id: 'pr_coffee_central_mountains', varietyId: 'puerto_rico_coffee', regionId: 'central_mountains_pr', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Hacienda heritage, balanced' },

  // === TROPICAL FRUITS - HAWAII ===
  { id: 'rainbow_papaya_puna', varietyId: 'rainbow_papaya', regionId: 'puna_district', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Rainbow papaya capital' },
  { id: 'dragon_fruit_puna', varietyId: 'red_dragon_fruit', regionId: 'puna_district', isActive: true, qualityTier: 'excellent' },
  { id: 'macadamia_kona', varietyId: 'hawaii_macadamia', regionId: 'kona_coast', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Buttery, premium nuts' },
  { id: 'macadamia_hamakua', varietyId: 'hawaii_macadamia', regionId: 'hamakua_coast', isActive: true, qualityTier: 'excellent' },

  // === TROPICAL FRUITS - FLORIDA ===
  { id: 'lychee_homestead', varietyId: 'brewster_lychee', regionId: 'homestead_redland', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Florida lychee season, brief window' },
  { id: 'mamey_homestead', varietyId: 'mamey_colorado', regionId: 'homestead_redland', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Cuban favorite, Miami specialty' },

  // === SPECIALTY CHILES ===
  { id: 'hatch_green_hatch_valley', varietyId: 'hatch_green', regionId: 'hatch_valley', isActive: true, qualityTier: 'exceptional', flavorNotes: 'True Hatch, NM terroir required' },
  { id: 'hatch_red_hatch_valley', varietyId: 'hatch_red', regionId: 'hatch_valley', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Dried ristras, deep flavor' },
  { id: 'datil_pepper_northeast_fl', varietyId: 'datil_hot', regionId: 'northeast_florida', isActive: true, qualityTier: 'exceptional', flavorNotes: 'St. Augustine exclusive, 400+ years' },

  // === COUNTRY HAM ===
  { id: 'virginia_ham_shenandoah', varietyId: 'virginia_country_ham', regionId: 'shenandoah_valley', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Salt-cured Virginia tradition' },
  { id: 'virginia_ham_piedmont', varietyId: 'virginia_country_ham', regionId: 'virginia_piedmont', isActive: true, qualityTier: 'excellent' },

  // === MUSCADINE GRAPES ===
  { id: 'scuppernong_georgia', varietyId: 'scuppernong', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent', flavorNotes: 'America\'s first cultivated grape' },
  { id: 'scuppernong_nc', varietyId: 'scuppernong', regionId: 'eastern_nc_coastal_plain', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Mother Vine heritage' },
  { id: 'carlos_muscadine_georgia', varietyId: 'carlos_muscadine', regionId: 'georgia_piedmont', isActive: true, qualityTier: 'excellent' },

  // === WILD RICE ===
  { id: 'wild_rice_minnesota', varietyId: 'minnesota_wild_rice', regionId: 'minnesota_wild_rice', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Hand-harvested, native tradition' },

  // === BIRCH SYRUP ===
  { id: 'birch_syrup_fairbanks', varietyId: 'alaska_birch_syrup', regionId: 'fairbanks_tanana', isActive: true, qualityTier: 'exceptional', flavorNotes: 'Unique Alaska specialty' },

  // === YAUPON TEA ===
  { id: 'yaupon_texas_hill', varietyId: 'yaupon_green', regionId: 'texas_hill_country', isActive: true, qualityTier: 'excellent', flavorNotes: 'Native caffeinated holly' },
  { id: 'yaupon_roasted_texas', varietyId: 'yaupon_roasted', regionId: 'texas_hill_country', isActive: true, qualityTier: 'excellent', flavorNotes: 'Dark roast, coffee alternative' },

  // === BISON ===
  { id: 'bison_montana', varietyId: 'grass_fed_bison', regionId: 'western_montana', isActive: true, qualityTier: 'excellent', flavorNotes: 'Range-raised, lean, rich' },
  { id: 'bison_colorado', varietyId: 'grass_fed_bison', regionId: 'palisade_colorado', isActive: true, qualityTier: 'excellent' },

  // === MAPLE SYRUP (Additional grades) ===
  { id: 'maple_dark_new_england', varietyId: 'grade_a_dark', regionId: 'new_england', isActive: true, qualityTier: 'excellent', flavorNotes: 'Late season, robust' },
  { id: 'maple_golden_new_england', varietyId: 'grade_a_golden', regionId: 'new_england', isActive: true, qualityTier: 'exceptional', flavorNotes: 'First run, delicate' },
]

/**
 * Merged regional offerings: Generated + Curated (curated takes precedence)
 *
 * - generateRegionalOfferings(): ~8,300 offerings from climate-based generator
 * - CURATED_REGIONAL_OFFERINGS: ~140 hand-crafted offerings with flavor notes
 *
 * When IDs match, curated overrides generated to preserve flavorNotes and qualityTier.
 *
 * NOTE: Uses lazy initialization to avoid circular dependency issues.
 * The actual merging happens on first access, not at module load time.
 */
let _cachedRegionalOfferings: RegionalOffering[] | null = null

/**
 * Get merged regional offerings (lazy initialization)
 * Use this function if you need the offerings before REGIONAL_OFFERINGS is initialized.
 */
export function getRegionalOfferings(): RegionalOffering[] {
  if (_cachedRegionalOfferings !== null) {
    return _cachedRegionalOfferings
  }

  const generatedOfferings = generateRegionalOfferings(CULTIVARS)
  const merged: RegionalOffering[] = []
  const seenIds = new Set<string>()

  // First, add all curated offerings (they have priority)
  for (const offering of CURATED_REGIONAL_OFFERINGS) {
    merged.push(offering)
    seenIds.add(offering.id)
  }

  // Then add generated offerings that don't conflict
  for (const offering of generatedOfferings) {
    if (!seenIds.has(offering.id)) {
      merged.push(offering)
      seenIds.add(offering.id)
    }
  }

  _cachedRegionalOfferings = merged
  return merged
}

// REGIONAL_OFFERINGS is the merged array of curated + generated offerings
export const REGIONAL_OFFERINGS: RegionalOffering[] = getRegionalOfferings()

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

// PRODUCT_TYPES_BY_ID, PRODUCTS, and PRODUCTS_BY_ID are now
// re-exported from product-types.ts at the top of this file

export const VARIETIES_BY_ID: Record<string, Variety> = Object.fromEntries(
  VARIETIES.map(v => [v.id, v])
)

export const CULTIVARS_BY_ID: Record<string, Cultivar> = Object.fromEntries(
  CULTIVARS.map(c => [c.id, c])
)

export const OFFERINGS_BY_ID: Record<string, RegionalOffering> = Object.fromEntries(
  REGIONAL_OFFERINGS.map(o => [o.id, o])
)

// Group cultivars by variety
export const CULTIVARS_BY_VARIETY: Record<string, Cultivar[]> = CULTIVARS.reduce(
  (acc, c) => {
    const key = c.varietyId || c.id // Fall back to cultivar id if no varietyId
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  },
  {} as Record<string, Cultivar[]>
)

// Group varieties by product
export const VARIETIES_BY_PRODUCT: Record<string, Variety[]> = VARIETIES.reduce(
  (acc, v) => {
    if (!acc[v.productId]) acc[v.productId] = []
    acc[v.productId].push(v)
    return acc
  },
  {} as Record<string, Variety[]>
)

export const CULTIVARS_BY_PRODUCT: Record<string, Cultivar[]> = CULTIVARS.reduce((acc, c) => {
  if (!acc[c.productId]) acc[c.productId] = []
  acc[c.productId].push(c)
  return acc
}, {} as Record<string, Cultivar[]>)

// Note: REGIONAL_OFFERINGS uses `varietyId` field for backwards compatibility
// but conceptually this is the cultivarId
export const OFFERINGS_BY_CULTIVAR: Record<string, RegionalOffering[]> = REGIONAL_OFFERINGS.reduce((acc, o) => {
  // Use varietyId for now (backwards compat) - treat as cultivarId
  const cultivarId = (o as { varietyId?: string; cultivarId?: string }).varietyId || o.cultivarId
  if (!cultivarId) return acc
  if (!acc[cultivarId]) acc[cultivarId] = []
  acc[cultivarId].push(o)
  return acc
}, {} as Record<string, RegionalOffering[]>)

// Backwards compatibility alias
export const OFFERINGS_BY_VARIETY = OFFERINGS_BY_CULTIVAR

export const OFFERINGS_BY_REGION: Record<string, RegionalOffering[]> = REGIONAL_OFFERINGS.reduce((acc, o) => {
  if (!acc[o.regionId]) acc[o.regionId] = []
  acc[o.regionId].push(o)
  return acc
}, {} as Record<string, RegionalOffering[]>)

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Calendar seasons (not astronomical):
 * - Winter: December, January, February (12, 1, 2)
 * - Spring: March, April, May (3, 4, 5)
 * - Summer: June, July, August (6, 7, 8)
 * - Fall: September, October, November (9, 10, 11)
 */
export function getSeasonsFromMonths(months: number[] | undefined): Season[] {
  if (!months || months.length === 0) return []

  const seasons = new Set<Season>()

  for (const month of months) {
    if (month === 12 || month === 1 || month === 2) {
      seasons.add('winter')
    } else if (month >= 3 && month <= 5) {
      seasons.add('spring')
    } else if (month >= 6 && month <= 8) {
      seasons.add('summer')
    } else if (month >= 9 && month <= 11) {
      seasons.add('fall')
    }
  }

  // Return in seasonal order
  const seasonOrder: Season[] = ['spring', 'summer', 'fall', 'winter']
  return seasonOrder.filter(s => seasons.has(s))
}

/**
 * Get the current calendar season
 */
export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1 // 1-12
  if (month === 12 || month === 1 || month === 2) return 'winter'
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  return 'fall'
}

/**
 * Get complete offering info with product, variety, and region data merged
 */
export function getOfferingDetails(offeringId: string) {
  const offering = OFFERINGS_BY_ID[offeringId]
  if (!offering) return null

  // Support both varietyId (legacy) and cultivarId
  const cultivarId = offering.varietyId || offering.cultivarId
  if (!cultivarId) return null

  // Look up the cultivar (using CULTIVARS_BY_ID, not VARIETIES_BY_ID)
  const cultivar = CULTIVARS_BY_ID[cultivarId]
  if (!cultivar) return null

  const product = PRODUCTS_BY_ID[cultivar.productId]
  if (!product) return null

  const peakMonths = offering.peakMonthsOverride ?? cultivar.peakMonths
  const seasons = getSeasonsFromMonths(peakMonths)

  return {
    ...offering,
    // Note: 'variety' key kept for backwards compatibility, but this is the cultivar
    variety: cultivar,
    cultivar,
    product,
    // Merge GDD values (offering overrides > cultivar defaults)
    gddToMaturity: offering.gddToMaturityOverride ?? cultivar.gddToMaturity,
    gddToPeak: offering.gddToPeakOverride ?? cultivar.gddToPeak,
    gddWindow: offering.gddWindowOverride ?? cultivar.gddWindow,
    baseTemp: offering.baseTempOverride ?? cultivar.baseTemp,
    // For calendar-based
    peakMonths,
    // Derived seasons from peakMonths
    seasons,
  }
}

/**
 * Get all active offerings for a region
 */
export function getActiveOfferingsForRegion(regionId: string): RegionalOffering[] {
  return (OFFERINGS_BY_REGION[regionId] || []).filter(o => o.isActive)
}

/**
 * Get all offerings for a product (all varieties, all regions)
 */
export function getOfferingsForProduct(productId: string): RegionalOffering[] {
  const varieties = VARIETIES_BY_PRODUCT[productId] || []
  return varieties.flatMap(v => OFFERINGS_BY_VARIETY[v.id] || [])
}

// Category display names
export const CATEGORY_DISPLAY_NAMES: Record<ProductCategory, string> = {
  fruit: 'Fruits',
  vegetable: 'Vegetables',
  nut: 'Nuts',
  meat: 'Meat & Poultry',
  seafood: 'Seafood',
  dairy: 'Dairy & Eggs',
  beverage: 'Coffee & Tea',
  grain: 'Grains',
  post_harvest: 'Post Harvest (Minimally Processed)',
}

// Counts
export const TOTAL_PRODUCT_TYPES = PRODUCT_TYPES.length
export const TOTAL_CULTIVARS = CULTIVARS.length
export const TOTAL_VARIETIES = TOTAL_CULTIVARS // Backwards compat alias
export const TOTAL_OFFERINGS = REGIONAL_OFFERINGS.length

// Backwards compat alias
export const TOTAL_PRODUCTS = TOTAL_PRODUCT_TYPES
