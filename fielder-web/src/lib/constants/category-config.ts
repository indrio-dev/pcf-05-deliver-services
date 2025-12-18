/**
 * Category Configuration System
 *
 * Single source of truth for all category-specific behavior.
 * This replaces scattered if-statements checking category strings.
 *
 * IMPORTANT: When adding a new product category, define it here FIRST.
 * All services (discover API, product pages, narratives) read from this config.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Quality metrics vary by product type
 * - brix: Sugar content (citrus, stone fruit, berries, grapes)
 * - omega_ratio: Omega-6:Omega-3 ratio (meat, seafood, eggs, dairy)
 * - oil_content: Fat/oil percentage (nuts, avocados)
 * - moisture: Moisture content (grains, dried goods)
 * - fat_percentage: Butterfat, milk fat (dairy)
 * - none: No primary quality metric (processed goods, honey)
 */
export type QualityMetricType =
  | 'brix'
  | 'omega_ratio'
  | 'oil_content'
  | 'moisture'
  | 'fat_percentage'
  | 'protein_content'
  | 'none'

/**
 * Peak timing calculation methods
 * - middle_50: Peak = middle 50% of harvest window (most produce)
 * - full_season: Entire season is peak (seafood with defined seasons)
 * - year_round: No seasonality, always available (eggs, dairy, honey)
 * - harvest_date: Single harvest event, not a window (grains)
 */
export type PeakTimingMethod =
  | 'middle_50'
  | 'full_season'
  | 'year_round'
  | 'harvest_date'

/**
 * Product category types for type safety
 */
export type ProductCategory =
  | 'fruit'
  | 'vegetable'
  | 'nut'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'eggs'
  | 'honey'
  | 'grain'
  | 'oil'
  | 'post_harvest'
  | 'beverage'

/**
 * Product subcategory types
 */
export type ProductSubcategory =
  // Fruit
  | 'citrus'
  | 'stone_fruit'
  | 'pome_fruit'
  | 'berry'
  | 'melon'
  | 'tropical'
  | 'grape'
  // Vegetable
  | 'leafy_greens'
  | 'root_vegetable'
  | 'nightshade'
  | 'cruciferous'
  | 'allium'
  | 'legume'
  | 'squash'
  // Nuts
  | 'tree_nut'
  // Meat
  | 'beef'
  | 'pork'
  | 'poultry'
  | 'lamb'
  | 'game'
  // Seafood
  | 'fish'
  | 'shellfish'
  | 'crustacean'
  // Dairy
  | 'milk'
  | 'cheese'
  | 'butter'
  // Other
  | 'chicken_eggs'
  | 'duck_eggs'
  | 'raw_honey'
  | 'infused_honey'
  // Beverage
  | 'coffee'     // Coffee cherry (fruit seed) - uses Brix for ripeness
  | 'tea'        // Camellia sinensis leaf - uses flush timing for quality
  | 'cacao'      // Cacao pod (fruit seed) - similar to coffee

// =============================================================================
// CATEGORY CONFIGURATION INTERFACE
// =============================================================================

export interface CategoryConfig {
  /** Category identifier */
  id: ProductCategory

  /** Human-readable category name */
  displayName: string

  // -------------------------------------------------------------------------
  // QUALITY METRICS
  // -------------------------------------------------------------------------

  qualityMetrics: {
    /** Primary quality metric for this category */
    primary: QualityMetricType

    /** Human-readable name for the metric */
    displayName: string

    /** Unit for display (e.g., '°Bx', '%', ':1') */
    unit: string

    /** Quality tier thresholds for this metric (category-specific) */
    tierThresholds?: {
      artisan: { min: number }
      premium: { min: number }
      select: { min: number }
      // Below select = commodity
    }

    /** Secondary metrics that may also apply */
    secondary?: QualityMetricType[]
  }

  // -------------------------------------------------------------------------
  // PEAK TIMING
  // -------------------------------------------------------------------------

  peakTiming: {
    /** How to calculate peak window */
    method: PeakTimingMethod

    /** For middle_50: what percentage of harvest window is "peak" (default 50) */
    peakPercentage?: number

    /** Description of peak logic for narratives */
    description: string
  }

  // -------------------------------------------------------------------------
  // SHARE PILLAR LABELS (Category-specific terminology)
  // -------------------------------------------------------------------------

  sharePillarLabels: {
    soil: string      // "Soil Health" | "Sea Health" | "Pasture"
    heritage: string  // "Genetics" | "Species" | "Breed"
    agricultural: string  // "Growing Practices" | "Catch Method" | "Raising"
    ripen: string     // "Harvest Timing" | "Season" | "Processing"
    enrich: string    // Usually "Quality" for all
  }

  // -------------------------------------------------------------------------
  // DISPLAY CONFIGURATION
  // -------------------------------------------------------------------------

  display: {
    /** Show GDD-based predictions (only for produce with GDD models) */
    showGddPrediction: boolean

    /** Show bloom date (only for tree/bush crops) */
    showBloomDate: boolean

    /** Show rootstock info (only for grafted crops) */
    showRootstock: boolean

    /** Show climate data (GDD, frost dates) */
    showClimate: boolean

    /** Show water conditions (seafood) */
    showWaters: boolean

    /** Show pasture conditions (meat, dairy) */
    showPasture: boolean

    /** Show farm acreage */
    showAcreage: boolean

    /** Show season open/close dates */
    showSeasonDates: boolean
  }

  // -------------------------------------------------------------------------
  // NARRATIVE HINTS
  // -------------------------------------------------------------------------

  narrative: {
    /** Key talking points to emphasize */
    emphasize: string[]

    /** Topics to avoid or suppress */
    suppress: string[]

    /** Category-specific vocabulary */
    vocabulary: {
      qualityDescriptor: string  // "sweetness", "richness", "freshness"
      harvestVerb: string        // "picked", "caught", "harvested", "collected"
      sourceNoun: string         // "grove", "waters", "pasture", "orchard"
    }
  }

  // -------------------------------------------------------------------------
  // TRANSFORMATION LAYER (Optional - for products with post-harvest processing)
  // -------------------------------------------------------------------------
  // Some products have a transformation chain where quality can be gained or
  // lost at multiple steps: FARM → PROCESSING → FINAL PRODUCT
  //
  // Examples:
  //   Coffee: Cherry (Brix) → Washed/Natural → Roasted → Cupping Score
  //   Cheese: Milk (Omega) → Cultures/Aging → Flavor Profile
  //   Wine:   Grape (Brix) → Fermentation/Aging → Tasting Notes
  //
  // For these products, SHARE captures ORIGIN quality, and transformation
  // captures what happens after harvest.
  // -------------------------------------------------------------------------

  transformation?: {
    /** Does this product have a transformation chain? */
    hasTransformation: boolean

    /** Human-readable name for the transformation process */
    processName: string  // "Processing", "Aging", "Roasting", "Fermentation"

    /** The stages in the transformation chain */
    stages: TransformationStage[]

    /** Final quality metric after transformation (may differ from origin metric) */
    finalQualityMetric: {
      name: string           // "Cupping Score", "Acidity", "Tasting Notes"
      unit?: string          // "SCA points", "% FFA", etc.
      description: string    // What this metric measures
      tierThresholds?: {
        artisan: { min: number }
        premium: { min: number }
        select: { min: number }
      }
    }

    /** Key quality factors in transformation (for narratives) */
    qualityFactors: string[]  // ["processing method", "fermentation time", "roast profile"]
  }
}

// =============================================================================
// TRANSFORMATION STAGE INTERFACE
// =============================================================================

export interface TransformationStage {
  /** Stage identifier */
  id: string

  /** Human-readable name */
  name: string

  /** What actor typically controls this stage */
  controlledBy: 'farm' | 'mill' | 'processor' | 'roaster' | 'maker' | 'artisan'

  /** Available methods/approaches for this stage */
  methods?: TransformationMethod[]

  /** Key quality variables at this stage */
  qualityVariables?: string[]

  /** Description for narratives */
  description: string
}

export interface TransformationMethod {
  id: string
  name: string
  description: string
  /** Quality impact: positive methods enhance quality, negative degrade it */
  qualityImpact?: 'enhances' | 'neutral' | 'risks'
}

// =============================================================================
// CATEGORY CONFIGURATIONS
// =============================================================================

export const CATEGORY_CONFIGS: Record<ProductCategory, CategoryConfig> = {
  // ---------------------------------------------------------------------------
  // FRUIT
  // ---------------------------------------------------------------------------
  fruit: {
    id: 'fruit',
    displayName: 'Fruit',
    qualityMetrics: {
      primary: 'brix',
      displayName: 'Brix (Sugar Content)',
      unit: '°Bx',
      tierThresholds: {
        artisan: { min: 14 },
        premium: { min: 12 },
        select: { min: 10 },
      },
      secondary: ['omega_ratio'], // Some fruits have relevant omega profiles
    },
    peakTiming: {
      method: 'middle_50',
      peakPercentage: 50,
      description: 'Peak quality occurs during the middle portion of the harvest window',
    },
    sharePillarLabels: {
      soil: 'Soil Health',
      heritage: 'Genetics',
      agricultural: 'Growing Practices',
      ripen: 'Harvest Timing',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: true,
      showBloomDate: true,
      showRootstock: true,
      showClimate: true,
      showWaters: false,
      showPasture: false,
      showAcreage: true,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['sweetness', 'flavor', 'freshness', 'nutrition'],
      suppress: [],
      vocabulary: {
        qualityDescriptor: 'sweetness',
        harvestVerb: 'picked',
        sourceNoun: 'orchard',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // VEGETABLE
  // ---------------------------------------------------------------------------
  vegetable: {
    id: 'vegetable',
    displayName: 'Vegetable',
    qualityMetrics: {
      primary: 'brix',
      displayName: 'Brix (Sugar Content)',
      unit: '°Bx',
      tierThresholds: {
        artisan: { min: 12 },
        premium: { min: 8 },
        select: { min: 6 },
      },
    },
    peakTiming: {
      method: 'middle_50',
      peakPercentage: 50,
      description: 'Peak quality occurs during the middle portion of the harvest window',
    },
    sharePillarLabels: {
      soil: 'Soil Health',
      heritage: 'Genetics',
      agricultural: 'Growing Practices',
      ripen: 'Harvest Timing',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: true,
      showBloomDate: false,
      showRootstock: false,
      showClimate: true,
      showWaters: false,
      showPasture: false,
      showAcreage: true,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['freshness', 'flavor', 'nutrition', 'texture'],
      suppress: [],
      vocabulary: {
        qualityDescriptor: 'freshness',
        harvestVerb: 'harvested',
        sourceNoun: 'field',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // NUT
  // ---------------------------------------------------------------------------
  nut: {
    id: 'nut',
    displayName: 'Tree Nut',
    qualityMetrics: {
      primary: 'oil_content',
      displayName: 'Oil Content',
      unit: '%',
      tierThresholds: {
        artisan: { min: 72 },
        premium: { min: 68 },
        select: { min: 64 },
      },
    },
    peakTiming: {
      method: 'middle_50',
      peakPercentage: 50,
      description: 'Nuts reach optimal oil content during peak harvest',
    },
    sharePillarLabels: {
      soil: 'Soil Health',
      heritage: 'Cultivar',
      agricultural: 'Growing Practices',
      ripen: 'Harvest Timing',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: true,
      showBloomDate: true,
      showRootstock: true,
      showClimate: true,
      showWaters: false,
      showPasture: false,
      showAcreage: true,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['richness', 'oil content', 'kernel quality', 'freshness'],
      suppress: ['brix', 'sweetness'],
      vocabulary: {
        qualityDescriptor: 'richness',
        harvestVerb: 'harvested',
        sourceNoun: 'orchard',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // MEAT
  // ---------------------------------------------------------------------------
  meat: {
    id: 'meat',
    displayName: 'Meat',
    qualityMetrics: {
      primary: 'omega_ratio',
      displayName: 'Omega-6:Omega-3 Ratio',
      unit: ':1',
      tierThresholds: {
        artisan: { min: 0 },  // Lower is better for omega ratio
        premium: { min: 0 },
        select: { min: 0 },
      },
    },
    peakTiming: {
      method: 'year_round',
      description: 'Quality depends on raising practices, not seasonality',
    },
    sharePillarLabels: {
      soil: 'Pasture',
      heritage: 'Breed',
      agricultural: 'Raising Practices',
      ripen: 'Processing',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      showClimate: true,
      showWaters: false,
      showPasture: true,
      showAcreage: true,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['grass-fed', 'pasture-raised', 'omega profile', 'breed'],
      suppress: ['brix', 'sweetness'],
      vocabulary: {
        qualityDescriptor: 'richness',
        harvestVerb: 'raised',
        sourceNoun: 'ranch',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // SEAFOOD
  // ---------------------------------------------------------------------------
  seafood: {
    id: 'seafood',
    displayName: 'Seafood',
    qualityMetrics: {
      primary: 'omega_ratio',
      displayName: 'Omega Profile',
      unit: ':1',
      tierThresholds: {
        artisan: { min: 0 },
        premium: { min: 0 },
        select: { min: 0 },
      },
    },
    peakTiming: {
      method: 'full_season',
      description: 'Harvest season defines quality - the entire season is peak',
    },
    sharePillarLabels: {
      soil: 'Sea Health',
      heritage: 'Species',
      agricultural: 'Catch Method',
      ripen: 'Season & Handling',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      showClimate: false,
      showWaters: true,
      showPasture: false,
      showAcreage: false,
      showSeasonDates: true,
    },
    narrative: {
      emphasize: ['wild-caught', 'sustainable', 'freshness', 'season'],
      suppress: ['brix', 'sweetness', 'soil'],
      vocabulary: {
        qualityDescriptor: 'freshness',
        harvestVerb: 'caught',
        sourceNoun: 'waters',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // DAIRY
  // ---------------------------------------------------------------------------
  dairy: {
    id: 'dairy',
    displayName: 'Dairy',
    qualityMetrics: {
      primary: 'fat_percentage',
      displayName: 'Fat Content',
      unit: '%',
      tierThresholds: {
        artisan: { min: 4.5 },
        premium: { min: 4.0 },
        select: { min: 3.5 },
      },
      secondary: ['omega_ratio'],
    },
    peakTiming: {
      method: 'year_round',
      description: 'Quality depends on pasture conditions and breed, not strict seasonality',
    },
    sharePillarLabels: {
      soil: 'Pasture',
      heritage: 'Breed',
      agricultural: 'Farming Practices',
      ripen: 'Processing',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      showClimate: true,
      showWaters: false,
      showPasture: true,
      showAcreage: true,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['grass-fed', 'pasture-raised', 'CLA content', 'omega profile'],
      suppress: ['brix', 'sweetness'],
      vocabulary: {
        qualityDescriptor: 'richness',
        harvestVerb: 'produced',
        sourceNoun: 'dairy',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // EGGS
  // ---------------------------------------------------------------------------
  eggs: {
    id: 'eggs',
    displayName: 'Eggs',
    qualityMetrics: {
      primary: 'omega_ratio',
      displayName: 'Omega Ratio',
      unit: ':1',
      tierThresholds: {
        artisan: { min: 0 },
        premium: { min: 0 },
        select: { min: 0 },
      },
    },
    peakTiming: {
      method: 'year_round',
      description: 'Eggs are available year-round with consistent quality',
    },
    sharePillarLabels: {
      soil: 'Pasture',
      heritage: 'Breed',
      agricultural: 'Raising Practices',
      ripen: 'Handling',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      showClimate: true,
      showWaters: false,
      showPasture: true,
      showAcreage: false,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['pasture-raised', 'omega profile', 'yolk color', 'freshness'],
      suppress: ['brix', 'sweetness'],
      vocabulary: {
        qualityDescriptor: 'richness',
        harvestVerb: 'collected',
        sourceNoun: 'farm',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // HONEY
  // ---------------------------------------------------------------------------
  honey: {
    id: 'honey',
    displayName: 'Honey',
    qualityMetrics: {
      primary: 'none',
      displayName: 'Varietal Purity',
      unit: '',
      // Honey quality is about source/varietal, not a numeric metric
    },
    peakTiming: {
      method: 'full_season',
      description: 'Honey harvest aligns with bloom periods of source plants',
    },
    sharePillarLabels: {
      soil: 'Forage Area',
      heritage: 'Varietal',
      agricultural: 'Beekeeping Practices',
      ripen: 'Harvest & Processing',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: false,
      showBloomDate: true, // Bloom matters for honey varietals
      showRootstock: false,
      showClimate: true,
      showWaters: false,
      showPasture: false,
      showAcreage: false,
      showSeasonDates: true,
    },
    narrative: {
      emphasize: ['raw', 'unfiltered', 'varietal', 'local'],
      suppress: ['brix', 'omega'],
      vocabulary: {
        qualityDescriptor: 'purity',
        harvestVerb: 'harvested',
        sourceNoun: 'apiary',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // GRAIN
  // ---------------------------------------------------------------------------
  grain: {
    id: 'grain',
    displayName: 'Grain',
    qualityMetrics: {
      primary: 'protein_content',
      displayName: 'Protein Content',
      unit: '%',
      tierThresholds: {
        artisan: { min: 14 },
        premium: { min: 12 },
        select: { min: 10 },
      },
      secondary: ['moisture'],
    },
    peakTiming: {
      method: 'harvest_date',
      description: 'Single harvest event when grain reaches optimal moisture',
    },
    sharePillarLabels: {
      soil: 'Soil Health',
      heritage: 'Variety',
      agricultural: 'Growing Practices',
      ripen: 'Harvest & Drying',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: true,
      showBloomDate: false,
      showRootstock: false,
      showClimate: true,
      showWaters: false,
      showPasture: false,
      showAcreage: true,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['heritage', 'stone-ground', 'whole grain', 'freshness'],
      suppress: ['brix', 'omega'],
      vocabulary: {
        qualityDescriptor: 'quality',
        harvestVerb: 'harvested',
        sourceNoun: 'field',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // OIL
  // ---------------------------------------------------------------------------
  oil: {
    id: 'oil',
    displayName: 'Oil',
    qualityMetrics: {
      primary: 'none',
      displayName: 'Extraction Quality',
      unit: '',
      // Oil quality is about extraction method, freshness
    },
    peakTiming: {
      method: 'year_round',
      description: 'Quality depends on source freshness and extraction method',
    },
    sharePillarLabels: {
      soil: 'Source Quality',
      heritage: 'Variety',
      agricultural: 'Growing Practices',
      ripen: 'Extraction & Processing',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      showClimate: false,
      showWaters: false,
      showPasture: false,
      showAcreage: false,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['cold-pressed', 'first press', 'unrefined', 'freshness'],
      suppress: ['brix', 'omega'],
      vocabulary: {
        qualityDescriptor: 'purity',
        harvestVerb: 'pressed',
        sourceNoun: 'mill',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // POST_HARVEST (Processed goods)
  // ---------------------------------------------------------------------------
  post_harvest: {
    id: 'post_harvest',
    displayName: 'Artisan Goods',
    qualityMetrics: {
      primary: 'none',
      displayName: 'Artisan Quality',
      unit: '',
    },
    peakTiming: {
      method: 'year_round',
      description: 'Availability depends on production schedule',
    },
    sharePillarLabels: {
      soil: 'Source Quality',
      heritage: 'Recipe',
      agricultural: 'Sourcing Practices',
      ripen: 'Production',
      enrich: 'Quality',
    },
    display: {
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      showClimate: false,
      showWaters: false,
      showPasture: false,
      showAcreage: false,
      showSeasonDates: false,
    },
    narrative: {
      emphasize: ['artisan', 'small-batch', 'handcrafted', 'traditional'],
      suppress: ['brix', 'omega', 'GDD'],
      vocabulary: {
        qualityDescriptor: 'quality',
        harvestVerb: 'crafted',
        sourceNoun: 'producer',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // BEVERAGE (Coffee & Tea) - defaults to coffee; tea has subcategory override
  // ---------------------------------------------------------------------------
  // Coffee: Seed from coffee cherry fruit. Cherry Brix (18-22°) indicates ripeness.
  //         Final quality measured by SCA cupping score (80+ = specialty grade).
  //         Altitude affects sugar development (slower maturation = higher Brix).
  // Tea:    Leaf harvest from Camellia sinensis. Quality = flush timing + leaf grade.
  //         First flush (spring) = delicate/floral. Second flush (summer) = robust/muscatel.
  //         NO Brix measurement - completely different quality paradigm.
  // ---------------------------------------------------------------------------
  beverage: {
    id: 'beverage',
    displayName: 'Coffee & Tea',
    qualityMetrics: {
      // Default to coffee metrics (Brix for cherry ripeness)
      // Tea uses subcategory override with 'none' metric (flush-based quality)
      primary: 'brix',
      displayName: 'Cherry Brix',
      unit: '°Bx',
      tierThresholds: {
        // Coffee cherry Brix thresholds (higher than typical fruit)
        // 18-22° optimal for specialty coffee
        artisan: { min: 22 },  // Exceptional ripeness, complex flavor potential
        premium: { min: 20 },  // Specialty grade
        select: { min: 18 },   // Acceptable for quality coffee
      },
    },
    peakTiming: {
      // Coffee harvest is calendar-based by region
      // US-grown coffee (Hawaii, Puerto Rico, California) harvests fall/winter
      method: 'full_season',
      description: 'Coffee cherries are picked at peak ripeness during harvest season',
    },
    sharePillarLabels: {
      soil: 'Terroir',
      heritage: 'Varietal',
      agricultural: 'Growing Practices',
      ripen: 'Harvest Timing',
      enrich: 'Cupping Score',  // SCA 80+ = specialty grade
    },
    display: {
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      showClimate: true,   // Altitude matters hugely for coffee
      showWaters: false,
      showPasture: false,
      showAcreage: true,
      showSeasonDates: true,
    },
    narrative: {
      emphasize: ['origin', 'altitude', 'terroir', 'varietal', 'processing', 'roast', 'cupping score'],
      suppress: ['GDD', 'omega'],
      vocabulary: {
        qualityDescriptor: 'cup complexity',
        harvestVerb: 'harvested',
        sourceNoun: 'farm',
      },
    },
  },
}

// =============================================================================
// SUBCATEGORY OVERRIDES
// =============================================================================

/**
 * Some subcategories need different settings than their parent category.
 * These overrides are merged with the parent category config.
 */
export const SUBCATEGORY_OVERRIDES: Partial<Record<ProductSubcategory, Partial<CategoryConfig>>> = {
  // Citrus has different Brix thresholds than general fruit
  citrus: {
    qualityMetrics: {
      primary: 'brix',
      displayName: 'Brix (Sugar Content)',
      unit: '°Bx',
      tierThresholds: {
        artisan: { min: 13 },  // Citrus-specific thresholds
        premium: { min: 11 },
        select: { min: 9 },
      },
    },
    narrative: {
      emphasize: ['sweetness', 'acidity balance', 'freshness', 'grove-fresh'],
      suppress: [],
      vocabulary: {
        qualityDescriptor: 'sweetness',
        harvestVerb: 'picked',
        sourceNoun: 'grove',
      },
    },
  },

  // Berries have lower Brix thresholds
  berry: {
    qualityMetrics: {
      primary: 'brix',
      displayName: 'Brix (Sugar Content)',
      unit: '°Bx',
      tierThresholds: {
        artisan: { min: 12 },
        premium: { min: 10 },
        select: { min: 8 },
      },
    },
  },

  // Stone fruit has specific thresholds
  stone_fruit: {
    qualityMetrics: {
      primary: 'brix',
      displayName: 'Brix (Sugar Content)',
      unit: '°Bx',
      tierThresholds: {
        artisan: { min: 14 },
        premium: { min: 12 },
        select: { min: 10 },
      },
    },
  },

  // Shellfish (oysters, etc.) - full season is peak
  shellfish: {
    peakTiming: {
      method: 'full_season',
      description: 'The harvest season defines quality - traditional "R months" for oysters',
    },
  },

  // Beef has specific omega ratio guidance
  beef: {
    qualityMetrics: {
      primary: 'omega_ratio',
      displayName: 'Omega-6:Omega-3 Ratio',
      unit: ':1',
      // For omega ratio, LOWER is better (inverted from other metrics)
      // Grass-fed: ~3:1, Feedlot: ~20:1
    },
    narrative: {
      emphasize: ['grass-fed', 'grass-finished', 'pasture-raised', 'omega profile', 'breed'],
      suppress: ['brix', 'sweetness'],
      vocabulary: {
        qualityDescriptor: 'richness',
        harvestVerb: 'raised',
        sourceNoun: 'ranch',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // COFFEE - seed from coffee cherry fruit
  // ---------------------------------------------------------------------------
  // ORIGIN QUALITY: Cherry Brix (18-22° optimal) at harvest
  // TRANSFORMATION: Processing → Drying → Milling → Roasting
  // FINAL QUALITY: SCA cupping score (80+ = specialty grade)
  //
  // Core principle: You should TASTE THE HARVEST
  // Each transformation step should preserve/enhance cherry quality, not mask it
  // ---------------------------------------------------------------------------
  coffee: {
    qualityMetrics: {
      primary: 'brix',
      displayName: 'Cherry Brix',
      unit: '°Bx',
      tierThresholds: {
        artisan: { min: 22 },  // Exceptional ripeness
        premium: { min: 20 },  // Specialty grade target
        select: { min: 18 },   // Minimum for quality coffee
      },
    },
    sharePillarLabels: {
      soil: 'Terroir',
      heritage: 'Varietal',       // Typica, Bourbon, Gesha, SL28, etc.
      agricultural: 'Growing Practices',
      ripen: 'Harvest Timing',    // Cherry ripeness at pick
      enrich: 'Origin Quality',   // Brix at harvest captures farm's contribution
    },
    narrative: {
      emphasize: ['origin', 'altitude', 'terroir', 'varietal', 'processing', 'roast', 'cupping score'],
      suppress: ['GDD', 'omega', 'flush'],
      vocabulary: {
        qualityDescriptor: 'cup complexity',
        harvestVerb: 'harvested',
        sourceNoun: 'farm',
      },
    },
    // TRANSFORMATION LAYER: Post-harvest processing chain
    transformation: {
      hasTransformation: true,
      processName: 'Coffee Processing',
      stages: [
        {
          id: 'processing',
          name: 'Cherry Processing',
          controlledBy: 'mill',
          description: 'How the fruit is removed from the seed affects flavor development',
          qualityVariables: ['fermentation time', 'water quality', 'temperature'],
          methods: [
            { id: 'washed', name: 'Washed/Wet Process', description: 'Fruit removed before drying - clean, bright acidity', qualityImpact: 'enhances' },
            { id: 'natural', name: 'Natural/Dry Process', description: 'Dried in cherry - fruity, complex, wine-like', qualityImpact: 'enhances' },
            { id: 'honey', name: 'Honey Process', description: 'Partial mucilage left - sweet, balanced', qualityImpact: 'enhances' },
            { id: 'anaerobic', name: 'Anaerobic Fermentation', description: 'Controlled oxygen-free fermentation - exotic flavors', qualityImpact: 'enhances' },
          ],
        },
        {
          id: 'drying',
          name: 'Drying',
          controlledBy: 'mill',
          description: 'Reducing moisture to 10-12% for stability',
          qualityVariables: ['drying method', 'time', 'final moisture %'],
          methods: [
            { id: 'patio', name: 'Patio/Sun Dried', description: 'Traditional sun drying on patios - slow, even', qualityImpact: 'enhances' },
            { id: 'raised_beds', name: 'Raised Beds', description: 'African beds for airflow - consistent quality', qualityImpact: 'enhances' },
            { id: 'mechanical', name: 'Mechanical Dryer', description: 'Machine drying - faster but risks over-drying', qualityImpact: 'neutral' },
          ],
        },
        {
          id: 'milling',
          name: 'Milling & Grading',
          controlledBy: 'mill',
          description: 'Removing parchment, sorting by size/density, defect removal',
          qualityVariables: ['screen size', 'density sorting', 'defect count'],
        },
        {
          id: 'roasting',
          name: 'Roasting',
          controlledBy: 'roaster',
          description: 'Heat transformation - develops flavor from origin potential',
          qualityVariables: ['roast level', 'development time', 'roast date freshness'],
          methods: [
            { id: 'light', name: 'Light Roast', description: 'Origin-forward, bright acidity, preserves terroir', qualityImpact: 'enhances' },
            { id: 'medium', name: 'Medium Roast', description: 'Balanced origin + roast character', qualityImpact: 'enhances' },
            { id: 'dark', name: 'Dark Roast', description: 'Roast-forward, can mask origin quality', qualityImpact: 'risks' },
          ],
        },
      ],
      finalQualityMetric: {
        name: 'Cupping Score',
        unit: 'SCA points',
        description: 'Specialty Coffee Association scoring (80+ = specialty grade). Reflects entire chain from farm to cup.',
        tierThresholds: {
          artisan: { min: 87 },   // Exceptional
          premium: { min: 84 },   // Specialty
          select: { min: 80 },    // Specialty threshold
        },
      },
      qualityFactors: ['origin terroir', 'varietal genetics', 'processing method', 'roast profile', 'freshness'],
    },
  },

  // ---------------------------------------------------------------------------
  // TEA - leaf harvest from Camellia sinensis (or Yaupon - Ilex vomitoria)
  // ---------------------------------------------------------------------------
  // ORIGIN QUALITY: Flush timing + leaf grade (no numeric metric)
  //   - First flush (spring): delicate, floral, higher catechins/L-theanine
  //   - Second flush (summer): robust, muscatel, higher tannins
  // TRANSFORMATION: Withering → Rolling → Oxidation → Drying
  // FINAL QUALITY: Leaf grade + character profile
  //
  // Core principle: You should TASTE THE HARVEST
  // Oxidation level determines tea type (green→oolong→black) but should
  // preserve the terroir and flush character of the leaf
  // ---------------------------------------------------------------------------
  tea: {
    qualityMetrics: {
      primary: 'none',  // No numeric metric - quality is flush-based
      displayName: 'Leaf Grade',
      unit: '',
      // No tier thresholds - quality determined by flush timing and leaf selection
    },
    peakTiming: {
      method: 'full_season',  // First flush vs second flush determines character
      description: 'First flush (spring) = delicate/floral; Second flush (summer) = robust/muscatel',
    },
    sharePillarLabels: {
      soil: 'Terroir',
      heritage: 'Cultivar',       // var. sinensis vs var. assamica, or Yaupon
      agricultural: 'Growing Practices',
      ripen: 'Flush Timing',      // First, second, or autumnal flush
      enrich: 'Leaf Grade',       // Bud + leaf count at harvest
    },
    narrative: {
      emphasize: ['flush', 'terroir', 'cultivar', 'processing', 'leaf grade', 'oxidation'],
      suppress: ['GDD', 'omega', 'brix', 'cupping'],
      vocabulary: {
        qualityDescriptor: 'character',
        harvestVerb: 'plucked',
        sourceNoun: 'garden',
      },
    },
    // TRANSFORMATION LAYER: Post-harvest processing chain
    transformation: {
      hasTransformation: true,
      processName: 'Tea Processing',
      stages: [
        {
          id: 'withering',
          name: 'Withering',
          controlledBy: 'processor',
          description: 'Reducing moisture and beginning enzyme activity',
          qualityVariables: ['duration', 'temperature', 'humidity'],
        },
        {
          id: 'rolling',
          name: 'Rolling/Shaping',
          controlledBy: 'processor',
          description: 'Breaking cell walls to release enzymes, shaping the leaf',
          qualityVariables: ['pressure', 'duration', 'leaf style'],
        },
        {
          id: 'oxidation',
          name: 'Oxidation',
          controlledBy: 'processor',
          description: 'Enzyme-driven browning that determines tea type',
          qualityVariables: ['oxidation level', 'time', 'temperature'],
          methods: [
            { id: 'unoxidized', name: 'Unoxidized (Green)', description: '0% oxidation - grassy, vegetal, preserves catechins', qualityImpact: 'enhances' },
            { id: 'light', name: 'Light Oxidation (White)', description: '5-10% - delicate, subtle, minimal processing', qualityImpact: 'enhances' },
            { id: 'partial', name: 'Partial Oxidation (Oolong)', description: '20-80% - complex, floral to roasted range', qualityImpact: 'enhances' },
            { id: 'full', name: 'Full Oxidation (Black)', description: '90-100% - bold, malty, robust', qualityImpact: 'enhances' },
            { id: 'post_fermented', name: 'Post-Fermented (Pu-erh)', description: 'Microbial fermentation - earthy, aged', qualityImpact: 'enhances' },
          ],
        },
        {
          id: 'drying',
          name: 'Drying/Firing',
          controlledBy: 'processor',
          description: 'Halting oxidation and reducing final moisture',
          qualityVariables: ['method', 'temperature', 'final moisture %'],
          methods: [
            { id: 'pan_fired', name: 'Pan-Fired', description: 'Wok-fired - toasty, nutty notes', qualityImpact: 'enhances' },
            { id: 'steamed', name: 'Steamed', description: 'Japanese style - vegetal, umami', qualityImpact: 'enhances' },
            { id: 'sun_dried', name: 'Sun-Dried', description: 'Traditional - gentle, preserves character', qualityImpact: 'enhances' },
            { id: 'charcoal', name: 'Charcoal Roasted', description: 'Traditional Taiwanese - deep, complex', qualityImpact: 'enhances' },
          ],
        },
      ],
      finalQualityMetric: {
        name: 'Character Profile',
        description: 'Combination of flush character, oxidation level, and processing quality. No universal numeric score - quality is context-dependent.',
      },
      qualityFactors: ['flush timing', 'leaf grade', 'terroir', 'oxidation level', 'processing skill', 'freshness'],
    },
  },

  // ---------------------------------------------------------------------------
  // CACAO - seed from cacao pod
  // ---------------------------------------------------------------------------
  // ORIGIN QUALITY: Pod ripeness, genetic variety (Criollo > Trinitario > Forastero)
  // TRANSFORMATION: Fermentation → Drying → Roasting → Conching
  // FINAL QUALITY: Flavor profile, % cacao
  //
  // Core principle: You should TASTE THE HARVEST
  // Fine chocolate should express origin terroir, not just cocoa intensity
  // ---------------------------------------------------------------------------
  cacao: {
    qualityMetrics: {
      primary: 'brix',
      displayName: 'Pulp Brix',
      unit: '°Bx',
      tierThresholds: {
        artisan: { min: 18 },
        premium: { min: 16 },
        select: { min: 14 },
      },
    },
    sharePillarLabels: {
      soil: 'Terroir',
      heritage: 'Genetic Origin',  // Criollo, Forastero, Trinitario
      agricultural: 'Growing Practices',
      ripen: 'Pod Ripeness',
      enrich: 'Origin Quality',
    },
    narrative: {
      emphasize: ['origin', 'terroir', 'genetics', 'fermentation', 'single-origin', 'bean-to-bar'],
      suppress: ['GDD', 'omega', 'flush'],
      vocabulary: {
        qualityDescriptor: 'flavor complexity',
        harvestVerb: 'harvested',
        sourceNoun: 'plantation',
      },
    },
    // TRANSFORMATION LAYER: Post-harvest processing chain
    transformation: {
      hasTransformation: true,
      processName: 'Cacao Processing',
      stages: [
        {
          id: 'fermentation',
          name: 'Fermentation',
          controlledBy: 'farm',
          description: 'Microbial transformation that develops chocolate flavor precursors',
          qualityVariables: ['duration (5-7 days)', 'temperature', 'turning frequency'],
          methods: [
            { id: 'heap', name: 'Heap Fermentation', description: 'Traditional pile method - variable results', qualityImpact: 'neutral' },
            { id: 'box', name: 'Box Fermentation', description: 'Controlled wooden boxes - consistent quality', qualityImpact: 'enhances' },
            { id: 'cascade', name: 'Cascade/Stepped', description: 'Moving between boxes - optimal aeration', qualityImpact: 'enhances' },
          ],
        },
        {
          id: 'drying',
          name: 'Drying',
          controlledBy: 'farm',
          description: 'Reducing moisture to 6-7% for storage stability',
          qualityVariables: ['method', 'duration', 'final moisture %'],
          methods: [
            { id: 'sun', name: 'Sun Drying', description: 'Traditional on patios - slow, develops flavor', qualityImpact: 'enhances' },
            { id: 'raised', name: 'Raised Beds', description: 'Better airflow - more consistent', qualityImpact: 'enhances' },
            { id: 'mechanical', name: 'Mechanical Dryer', description: 'Faster but risks smoke taint', qualityImpact: 'risks' },
          ],
        },
        {
          id: 'roasting',
          name: 'Roasting',
          controlledBy: 'maker',
          description: 'Heat transformation that develops final chocolate flavor',
          qualityVariables: ['temperature', 'time', 'roast profile'],
          methods: [
            { id: 'light', name: 'Light Roast', description: 'Origin-forward, fruity, bright', qualityImpact: 'enhances' },
            { id: 'medium', name: 'Medium Roast', description: 'Balanced origin + roast character', qualityImpact: 'enhances' },
            { id: 'dark', name: 'Dark Roast', description: 'Roast-forward, can mask origin', qualityImpact: 'risks' },
          ],
        },
        {
          id: 'conching',
          name: 'Conching',
          controlledBy: 'maker',
          description: 'Extended mixing that develops texture and refines flavor',
          qualityVariables: ['duration', 'temperature', 'aeration'],
        },
      ],
      finalQualityMetric: {
        name: 'Flavor Profile',
        description: 'Combination of origin character, fermentation quality, and processing skill. Fine chocolate rated on complexity, not just % cacao.',
      },
      qualityFactors: ['genetic variety', 'terroir', 'fermentation quality', 'roast profile', 'conching time'],
    },
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the full configuration for a category, with optional subcategory overrides
 */
export function getCategoryConfig(
  category: string,
  subcategory?: string
): CategoryConfig {
  // Get base category config
  const baseConfig = CATEGORY_CONFIGS[category as ProductCategory]

  if (!baseConfig) {
    // Fall back to fruit config for unknown categories
    console.warn(`Unknown category: ${category}, falling back to fruit config`)
    return CATEGORY_CONFIGS.fruit
  }

  // Check for subcategory overrides
  if (subcategory && SUBCATEGORY_OVERRIDES[subcategory as ProductSubcategory]) {
    const overrides = SUBCATEGORY_OVERRIDES[subcategory as ProductSubcategory]!
    return mergeCategoryConfig(baseConfig, overrides as Partial<CategoryConfig>)
  }

  return baseConfig
}

/**
 * Get the peak timing method for a category/subcategory
 */
export function getPeakTimingMethod(
  category: string,
  subcategory?: string
): PeakTimingMethod {
  const config = getCategoryConfig(category, subcategory)
  return config.peakTiming.method
}

/**
 * Get the primary quality metric for a category/subcategory
 */
export function getPrimaryQualityMetric(
  category: string,
  subcategory?: string
): QualityMetricType {
  const config = getCategoryConfig(category, subcategory)
  return config.qualityMetrics.primary
}

/**
 * Check if a category uses Brix as its primary metric
 */
export function usesBrix(category: string, subcategory?: string): boolean {
  return getPrimaryQualityMetric(category, subcategory) === 'brix'
}

/**
 * Check if a category uses omega ratio as its primary metric
 */
export function usesOmegaRatio(category: string, subcategory?: string): boolean {
  return getPrimaryQualityMetric(category, subcategory) === 'omega_ratio'
}

/**
 * Get quality tier thresholds for a category's primary metric
 * Returns undefined if the category doesn't have numeric thresholds
 */
export function getQualityThresholds(
  category: string,
  subcategory?: string
): CategoryConfig['qualityMetrics']['tierThresholds'] | undefined {
  const config = getCategoryConfig(category, subcategory)
  return config.qualityMetrics.tierThresholds
}

/**
 * Deep merge utility for combining configs with overrides
 * Specifically typed for CategoryConfig to handle nested objects
 */
function mergeCategoryConfig(
  base: CategoryConfig,
  overrides: Partial<CategoryConfig>
): CategoryConfig {
  const result = { ...base }

  // Merge qualityMetrics if present
  if (overrides.qualityMetrics) {
    result.qualityMetrics = {
      ...base.qualityMetrics,
      ...overrides.qualityMetrics,
      // Deep merge tierThresholds if present
      tierThresholds: overrides.qualityMetrics.tierThresholds
        ? {
            ...base.qualityMetrics.tierThresholds,
            ...overrides.qualityMetrics.tierThresholds,
          }
        : base.qualityMetrics.tierThresholds,
    }
  }

  // Merge peakTiming if present
  if (overrides.peakTiming) {
    result.peakTiming = {
      ...base.peakTiming,
      ...overrides.peakTiming,
    }
  }

  // Merge sharePillarLabels if present
  if (overrides.sharePillarLabels) {
    result.sharePillarLabels = {
      ...base.sharePillarLabels,
      ...overrides.sharePillarLabels,
    }
  }

  // Merge display if present
  if (overrides.display) {
    result.display = {
      ...base.display,
      ...overrides.display,
    }
  }

  // Merge narrative if present
  if (overrides.narrative) {
    result.narrative = {
      ...base.narrative,
      ...overrides.narrative,
      vocabulary: overrides.narrative.vocabulary
        ? {
            ...base.narrative.vocabulary,
            ...overrides.narrative.vocabulary,
          }
        : base.narrative.vocabulary,
    }
  }

  return result
}
