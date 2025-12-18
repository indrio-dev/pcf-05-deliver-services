/**
 * =============================================================================
 * FIELDER PRODUCT MODEL (Corrected Hierarchy)
 * =============================================================================
 *
 * CLASSIFICATION TAXONOMY (for organizing, searching, inferring):
 *   Category → Subcategory → ProductCategory → Variety → Cultivar → Trade Names
 *
 * ACTUAL PRODUCT (what gets bought and sold):
 *   Product = Farm + Cultivar + SHARE data + Retail attributes
 *
 * The taxonomy enables inference. The Product is the transaction.
 *
 * =============================================================================
 * HIERARCHY EXAMPLE
 * =============================================================================
 *
 * MEAT (Category)
 *   └── RED_MEAT (Subcategory)
 *         └── Beef (ProductCategory)
 *               └── Wagyu Cross (Variety)
 *                     └── Black Wagyu × Brangus (Cultivar)
 *                           └── "American Wagyu" (Trade Name)
 *                                 └── "Pasture Raised American Wagyu Ribeye 12oz
 *                                      from Everglades Ranch" (PRODUCT)
 *
 * FRUIT (Category)
 *   └── CITRUS (Subcategory)
 *         └── Orange (ProductCategory)
 *               └── Navel (Variety)
 *                     └── Washington Navel (Cultivar)
 *                           └── "Heritage Navels" (Trade Name)
 *                                 └── "1/8 Bushel Heritage Navels
 *                                      from Hale Groves" (PRODUCT)
 */

import type {
  HarvestingPractices,
  TimingProfile,
  QualityMetrics,
  RipeningBehavior,
} from './products'
import type { ShareProfileCategory } from './share-profiles'

// =============================================================================
// FARM (Producer Attribution)
// =============================================================================
/**
 * Farm represents the producer/source of products.
 *
 * The Farm provides:
 *   - S pillar inference (via regionId → typicalSoil)
 *   - Default A pillar practices (farm-level defaults)
 *   - Attribution for the product ("from Everglades Ranch")
 */
export interface Farm {
  id: string
  name: string                      // "Everglades Ranch", "Hale Groves"
  displayName: string               // Consumer-facing name

  // Location (S pillar inference)
  regionId: string                  // → GrowingRegion → typicalSoil
  address?: {
    city: string
    state: string
    zip?: string
  }
  coordinates?: {
    lat: number
    lng: number
  }

  // Farm-level SHARE defaults
  // These can be overridden at the Product level
  defaultPractices?: HarvestingPractices  // A pillar defaults
  soilProfile?: {                         // S pillar (if known, overrides regional inference)
    type: string
    drainage: 'excellent' | 'good' | 'moderate' | 'poor'
    phRange?: [number, number]
    organicMatterPct?: number
    notes?: string
  }

  // Certifications (farm-wide)
  certifications?: string[]         // ['USDA Organic', 'Animal Welfare Approved', 'Regenerative Organic']

  // Contact / DTC
  website?: string
  allowsPickup?: boolean
  shipsDirectly?: boolean
  csa?: boolean                     // Offers CSA subscriptions

  // Metadata
  yearEstablished?: number
  acreage?: number
  description?: string
  story?: string                    // Farm's story for marketing
}


// =============================================================================
// PRODUCT (The Actual Purchasable Item)
// =============================================================================
/**
 * Product is the actual purchasable item - what the customer buys.
 *
 * A Product brings together:
 *   - Farm attribution (who grew/raised it) → S inference
 *   - Cultivar reference (genetics) → H pillar
 *   - Actual SHARE data for this specific product (A, R, E)
 *   - Retail attributes (cut, weight, form, packaging)
 *
 * The Product name encodes key SHARE differentiators:
 *   "Pasture Raised American Wagyu Ribeye 12oz from Everglades Ranch"
 *    └── A pillar ──┘ └── H (trade) ─┘ └─ cut ─┘ └── weight ──┘ └── farm ────┘
 */
export interface Product {
  id: string

  // === NAMING ===
  name: string                      // URL-safe: "pasture-raised-american-wagyu-ribeye-12oz"
  displayName: string               // "Pasture Raised American Wagyu Ribeye 12oz"
  shortName?: string                // "American Wagyu Ribeye" (for cards)
  description?: string

  // === TAXONOMY REFERENCE ===
  // Links this product to the classification hierarchy
  productCategoryId: string         // → "beef" (was Product.id)
  varietyId?: string                // → "wagyu_cross"
  cultivarId: string                // → "wagyu_brangus" (H pillar baseline)

  // === SHARE PROFILE ASSIGNMENT ===
  // Links to a ShareProfile for claim-based inference and grid display
  // Assigned via claim matching (see share-profiles.ts matchClaimsToProfile)
  shareProfileId?: string           // → "beef_true_grass", "eggs_pasture_raised", etc.
  shareProfileCategory?: ShareProfileCategory // For quick category lookup

  // === FARM ATTRIBUTION ===
  farmId: string                    // → "everglades_ranch"
  // S pillar: Inferred from Farm → Region → typicalSoil
  // Can be overridden if farm provides specific soil data

  // === H - HERITAGE (from cultivar + any overrides) ===
  // Mostly inherited from Cultivar, but can surface trade name
  tradeName?: string                // "American Wagyu" (for display)
  heritageNotes?: string            // Any product-specific heritage notes

  // === A - AGRICULTURAL PRACTICES ===
  // The actual practices for THIS product (may differ from farm defaults)
  practices: {
    // Universal
    isOrganic?: boolean
    isRegenerative?: boolean
    certifications?: string[]

    // Produce-specific
    pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'

    // Meat/Dairy/Eggs-specific
    animalWelfare?: 'pasture_raised' | 'free_range' | 'cage_free' | 'conventional'
    dietType?: 'grass_only' | 'pasture_forage' | 'grass_supplemented' | 'grain_supplemented' | 'grain_fed'
    grassFed?: boolean
    grassFinished?: boolean         // Critical distinction
    grainFree?: boolean
    noFeedlots?: boolean
    noAntibiotics?: boolean
    noHormones?: boolean

    // Seafood-specific
    harvestMethod?: 'wild_caught' | 'farm_raised'
    fishingMethod?: string
    isSustainable?: boolean

    // Notes
    practiceNotes?: string
    practiceHighlights?: string[]   // Key differentiators for marketing
  }

  // === R - RIPEN / TIMING ===
  // Timing to peak quality for THIS product
  timing: {
    // Produce: Harvest timing
    harvestDate?: string            // Actual harvest date if known
    harvestWindow?: {
      start: string                 // "2025-01-15"
      end: string                   // "2025-03-30"
    }
    ripeningBehavior?: RipeningBehavior
    daysToRipenAmbient?: number

    // Meat: Maturity and aging
    monthsToMaturity?: number       // 24 for quality beef
    agingMethod?: 'dry_aged' | 'wet_aged' | 'fresh' | 'hung'
    agingDays?: number              // 21 days dry-aged

    // Seafood: Freshness
    daysFresh?: number              // Days since catch
    flashFrozen?: boolean
    flashFreezeDate?: string

    // Availability
    seasonalAvailability?: number[] // Months available (1-12)
    isPreOrder?: boolean            // Available for pre-order
    estimatedShipDate?: string
  }

  // === E - ENRICH / QUALITY METRICS ===
  // Measurable quality for THIS product
  quality: {
    // Produce: Brix and compounds
    brixMeasured?: number           // Actual measured Brix
    brixExpected?: [number, number] // Expected range
    acidityPct?: number
    brixAcidRatio?: number

    // Meat: Marbling and fatty acids
    usdaGrade?: 'prime' | 'choice' | 'select'
    marblingScore?: number          // 100-1200 scale
    omega6To3Ratio?: string         // "6:1" - lower is better
    claContent?: string             // CLA levels

    // Oil-bearing (avocado, olive oil, nuts)
    oilContent?: number
    oleicAcidPct?: number
    polyphenolsMgKg?: number

    // Seafood
    omega3Content?: string
    fatPercentage?: number
    mercuryLevel?: 'very_low' | 'low' | 'moderate'

    // Lab testing
    labTested?: boolean
    testDate?: string
    testingLab?: string

    // Contaminant-free
    pesticideFree?: boolean
    antibioticFree?: boolean
    hormoneFree?: boolean

    // Highlights for marketing
    qualityHighlights?: string[]
  }

  // === RETAIL ATTRIBUTES ===
  // The physical product configuration
  retail: {
    // Cut (meat/seafood)
    cut?: string                    // 'ribeye', 'ny_strip', 'fillet', 'whole'

    // Form
    form: 'fresh' | 'frozen' | 'cured' | 'smoked' | 'dried' | 'juiced' | 'preserved' | 'live'

    // Weight/Size
    weight?: number
    weightUnit?: 'oz' | 'lb' | 'kg' | 'g'
    count?: number                  // For "each" items (6 oranges)
    size?: 'small' | 'medium' | 'large' | 'jumbo'  // For produce sizing

    // Packaging
    packaging?: string              // "vacuum sealed", "gift box", "bushel basket"
    unitsPerCase?: number           // For wholesale

    // Pricing
    priceUsd?: number
    pricePerUnit?: string           // "$12.99/lb"
  }

  // === INVENTORY & STATUS ===
  status: 'available' | 'low_stock' | 'pre_order' | 'sold_out' | 'seasonal'
  inventoryCount?: number
  maxOrderQuantity?: number

  // === MEDIA ===
  images?: {
    primary: string                 // Main product image
    farm?: string                   // Farm/source context image
    gallery?: string[]              // Additional images
  }

  // === METADATA ===
  createdAt?: string
  updatedAt?: string
  isActive: boolean
}


// =============================================================================
// PRODUCT NAME BUILDER
// =============================================================================
/**
 * Builds a product display name from its components.
 *
 * Pattern: [A Modifiers] [Trade Name/Cultivar] [Cut] [Weight] from [Farm]
 *
 * Examples:
 *   - "Pasture Raised American Wagyu Ribeye 12oz from Everglades Ranch"
 *   - "Organic Cara Cara Oranges 5lb from Hale Groves"
 *   - "Wild Caught Copper River King Salmon Fillet 8oz"
 *   - "Grass Finished Heritage Beef Brisket 4lb from Texas Ranch"
 */
export function buildProductDisplayName(product: {
  practices?: {
    isOrganic?: boolean
    animalWelfare?: string
    grassFinished?: boolean
    harvestMethod?: string
  }
  tradeName?: string
  cultivarDisplayName?: string
  cut?: string
  weight?: number
  weightUnit?: string
  farmName?: string
}): string {
  const parts: string[] = []

  // A pillar modifiers (practices that go in the name)
  if (product.practices?.harvestMethod === 'wild_caught') {
    parts.push('Wild Caught')
  } else if (product.practices?.grassFinished) {
    parts.push('Grass Finished')
  } else if (product.practices?.animalWelfare === 'pasture_raised') {
    parts.push('Pasture Raised')
  } else if (product.practices?.isOrganic) {
    parts.push('Organic')
  }

  // H pillar (trade name or cultivar)
  if (product.tradeName) {
    parts.push(product.tradeName)
  } else if (product.cultivarDisplayName) {
    parts.push(product.cultivarDisplayName)
  }

  // Cut (for meat/seafood)
  if (product.cut) {
    parts.push(product.cut)
  }

  // Weight
  if (product.weight && product.weightUnit) {
    parts.push(`${product.weight}${product.weightUnit}`)
  }

  // Farm attribution
  if (product.farmName) {
    parts.push(`from ${product.farmName}`)
  }

  return parts.join(' ')
}


// =============================================================================
// EXAMPLE PRODUCTS
// =============================================================================

export const EXAMPLE_PRODUCTS: Product[] = [
  {
    id: 'everglades-wagyu-ribeye-12oz',
    name: 'pasture-raised-american-wagyu-ribeye-12oz',
    displayName: 'Pasture Raised American Wagyu Ribeye 12oz',
    shortName: 'American Wagyu Ribeye',
    description: 'Premium American Wagyu ribeye from pasture-raised cattle in Fort Pierce, FL',

    productCategoryId: 'beef',
    varietyId: 'wagyu_cross',
    cultivarId: 'wagyu_brangus',
    farmId: 'everglades_ranch',

    tradeName: 'American Wagyu',

    practices: {
      animalWelfare: 'pasture_raised',
      dietType: 'grass_supplemented',   // Grass with supplemental feed
      grassFed: true,
      grassFinished: false,             // NOT 100% grass finished
      noFeedlots: true,
      noAntibiotics: true,
      noHormones: true,
      practiceHighlights: ['Pasture Raised', 'No Feedlots', 'No Antibiotics']
    },

    timing: {
      monthsToMaturity: 24,             // Full maturity
      agingMethod: 'dry_aged',
      agingDays: 21
    },

    quality: {
      usdaGrade: 'prime',
      marblingScore: 700,
      omega6To3Ratio: '6:1',            // Good but not great (grass-only ~3:1)
      qualityHighlights: ['Prime Grade', 'High Marbling', '24-Month Maturity']
    },

    retail: {
      cut: 'ribeye',
      form: 'fresh',
      weight: 12,
      weightUnit: 'oz',
      packaging: 'vacuum sealed',
      priceUsd: 49.99
    },

    status: 'available',
    isActive: true
  },

  {
    id: 'hale-heritage-navels-eighth-bushel',
    name: 'heritage-navels-eighth-bushel',
    displayName: 'Heritage Navels 1/8 Bushel',
    shortName: 'Heritage Navels',
    description: 'Premium Washington Navel oranges from the Indian River district',

    productCategoryId: 'orange',
    varietyId: 'navel',
    cultivarId: 'washington_navel',
    farmId: 'hale_groves',

    tradeName: 'Heritage Navels',

    practices: {
      pestManagement: 'ipm',
      practiceHighlights: ['IPM Grown', 'Indian River Certified']
    },

    timing: {
      harvestWindow: {
        start: '2024-11-15',
        end: '2025-03-15'
      },
      ripeningBehavior: 'non_climacteric',
      seasonalAvailability: [11, 12, 1, 2, 3]
    },

    quality: {
      brixExpected: [11, 14],
      brixAcidRatio: 12,
      qualityHighlights: ['High Brix', 'Indian River Terroir']
    },

    retail: {
      form: 'fresh',
      packaging: '1/8 bushel gift box',
      count: 12,
      size: 'large',
      priceUsd: 34.99
    },

    status: 'available',
    isActive: true
  }
]


// =============================================================================
// SHARE SUMMARY FOR PRODUCT
// =============================================================================
/**
 * Generates a SHARE summary for a product, combining:
 *   - S: Inferred from farm → region → typicalSoil (or farm-specific if known)
 *   - H: From cultivar + trade name
 *   - A: From product.practices
 *   - R: From product.timing
 *   - E: From product.quality
 */
export interface ProductShareSummary {
  productId: string

  soil: {
    source: 'farm_specific' | 'region_inferred'
    summary: string                 // "Ridge soils, Fort Pierce FL"
    confidence: 'high' | 'medium' | 'low'
  }

  heritage: {
    cultivar: string                // "Black Wagyu × Brangus"
    tradeName?: string              // "American Wagyu"
    isNonGmo: boolean | 'inferred'
    summary: string                 // "American Wagyu (Wagyu × Brangus cross)"
  }

  agricultural: {
    highlights: string[]            // ["Pasture Raised", "No Feedlots"]
    summary: string                 // "Pasture raised on grass with supplemental feed"
  }

  ripen: {
    summary: string                 // "24-month maturity, 21-day dry aged"
    isInSeason: boolean
  }

  enrich: {
    highlights: string[]            // ["Prime Grade", "6:1 Omega Ratio"]
    summary: string                 // "USDA Prime, exceptional marbling"
    confidence: 'measured' | 'expected'
  }
}
