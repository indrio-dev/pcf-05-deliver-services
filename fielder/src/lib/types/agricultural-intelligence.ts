/**
 * Agricultural Intelligence Knowledge Graph
 *
 * Multi-source, multi-dimensional data model for product-location-season intelligence
 */

// =============================================================================
// Core Dimensions: Product × Geography × Season
// =============================================================================

/**
 * Data source tracking for multi-source triangulation
 */
export interface DataSource {
  type: 'extension' | 'usda' | 'localharvest' | 'social_media' | 'farm_website' | 'user_reported' | 'inference'
  url?: string
  description: string
  capturedDate: Date
  confidence: number  // 0-1 scale
}

/**
 * Date range for harvest windows and peak timing
 */
export interface DateRange {
  start: Date
  end: Date
  year?: number  // Optional: timing can vary by year
}

/**
 * Geographic location
 */
export interface GeoLocation {
  lat: number
  lon: number
  city?: string
  state: string
  regionId?: string  // Links to Fielder's growing regions
}

// =============================================================================
// Level 1: STATE × PRODUCT TYPE (Foundation)
// =============================================================================

/**
 * State-level harvest timing (broad baseline)
 */
export interface StateProductHarvest {
  id: string
  state: string                    // "OH", "FL", etc.
  productType: string              // "tomato", "apple", "strawberry"
  harvestWindow: DateRange         // Observed: when harvest occurs
  sources: DataSource[]
  farmCount?: number               // Optional: how many farms (from LocalHarvest)
  notes?: string
}

/**
 * State-level cultivar information (when available)
 */
export interface StateCultivarData {
  id: string
  state: string
  cultivarId: string               // Links to Fielder cultivar
  harvestWindow?: DateRange        // If state extension provides timing
  recommended: boolean             // Extension recommends for this state
  commercialScale: boolean         // Grown commercially vs specialty only
  sources: DataSource[]
}

// =============================================================================
// Level 2: REGIONAL × PRODUCT (Drill-Down)
// =============================================================================

/**
 * Regional harvest data (county/multi-county level)
 */
export interface RegionalProductHarvest {
  id: string
  regionId: string                 // Links to Fielder's growing regions
  productType: string
  harvestWindow: DateRange
  cultivars?: string[]             // Known cultivars in this region
  sources: DataSource[]
}

// =============================================================================
// Level 3: FARM × PRODUCT × CULTIVAR (Specific)
// =============================================================================

/**
 * Farm entity in knowledge graph
 */
export interface Farm {
  id: string
  name: string
  location: GeoLocation

  // Products grown (category level)
  products: string[]               // ["tomato", "pepper", "strawberry"]

  // Cultivars grown (when known)
  cultivars: FarmCultivar[]

  // Contact information
  contactInfo: {
    website?: string
    facebook?: string
    instagram?: string
    phone?: string
    email?: string
  }

  // Discovery metadata
  discoverySource: DataSource
  lastVerified: Date

  // LocalHarvest data
  localHarvestUrl?: string
  localHarvestId?: string
}

/**
 * Farm grows specific cultivar (verified or inferred)
 */
export interface FarmCultivar {
  farmId: string
  cultivarId: string               // Links to Fielder cultivar

  // Verification level
  verificationLevel: 'confirmed' | 'inferred' | 'prospective'

  // Harvest timing (farm-specific)
  harvestWindow?: DateRange

  // How we know this
  sources: DataSource[]

  // When discovered/verified
  verifiedDate: Date
  lastUpdated: Date
}

/**
 * Farm harvest observation (social media post, CSA schedule, etc.)
 */
export interface HarvestObservation {
  id: string
  farmId: string
  productType?: string             // If only category known
  cultivarId?: string              // If specific cultivar identified
  observedDate: Date               // When harvest was observed
  harvestStart?: Date              // If harvest window mentioned
  harvestEnd?: Date
  source: DataSource
  notes?: string                   // "First tomato harvest", "Cherokee Purple ready"
}

// =============================================================================
// Level 4: QUALITY PREDICTION (Calculated Layer)
// =============================================================================

/**
 * Peak timing prediction (calculated from harvest window + GDD model)
 */
export interface PeakTimingPrediction {
  farmId: string
  cultivarId: string

  // Input: Observed harvest window
  harvestWindow: DateRange

  // Output: Calculated peak quality window (subset of harvest)
  peakWindow: DateRange

  // GDD-based calculation
  gddAtPeak: number
  gddAccumulated: number

  // Confidence in prediction
  confidence: number
}

/**
 * Quality prediction (SHARE framework)
 */
export interface QualityPrediction {
  farmId: string
  cultivarId: string

  // SHARE inputs (if known)
  soilData?: any
  heritageData?: any
  agriculturalPractices?: any
  ripenData?: any

  // Predicted outcomes
  predictedBrix: number
  predictedTier: 'artisan' | 'premium' | 'standard' | 'commodity'

  // Confidence
  confidence: number

  // Model used
  modelVersion: string
}

// =============================================================================
// Knowledge Graph (Connects All Layers)
// =============================================================================

/**
 * Complete agricultural intelligence knowledge graph
 */
export interface AgriculturalKnowledgeGraph {
  // State-level foundation
  stateHarvests: StateProductHarvest[]
  stateCultivars: StateCultivarData[]

  // Regional drill-down
  regionalHarvests: RegionalProductHarvest[]

  // Farm-level specifics
  farms: Farm[]
  farmCultivars: FarmCultivar[]
  harvestObservations: HarvestObservation[]

  // Calculated predictions
  peakPredictions: PeakTimingPrediction[]
  qualityPredictions: QualityPrediction[]

  // Metadata
  lastUpdated: Date
  version: string
}

// =============================================================================
// Research Queue (What to investigate next)
// =============================================================================

/**
 * Research task for expanding knowledge
 */
export interface ResearchTask {
  id: string
  priority: 'high' | 'medium' | 'low'
  type: 'state_harvest' | 'extension_cultivar' | 'farm_verification' | 'social_media_check'

  // What to research
  state?: string
  productType?: string
  cultivarId?: string
  farmId?: string

  // Research instructions
  searchQueries: string[]
  expectedSources: string[]        // URLs or source types to check

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  assignedTo?: string              // Researcher name
  startedDate?: Date
  completedDate?: Date

  // Results
  findings?: any
  sourcesFound: DataSource[]
}

// =============================================================================
// Confidence Tracking
// =============================================================================

/**
 * Confidence level for any data point
 */
export type ConfidenceLevel =
  | 'confirmed'      // Multiple reliable sources
  | 'verified'       // One reliable source
  | 'inferred'       // Educated guess from models
  | 'prospective'    // Possibility, needs verification
  | 'unknown'        // No data

/**
 * Confidence metadata for tracking data quality
 */
export interface ConfidenceMetadata {
  level: ConfidenceLevel
  sourceCount: number
  lastVerified: Date
  needsReview: boolean
  reviewNotes?: string
}
