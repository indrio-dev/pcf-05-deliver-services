/**
 * Terminal Market Types
 *
 * Data structures for USDA AMS terminal market integration
 */

/**
 * Raw terminal market report entry
 */
export interface TerminalMarketReport {
  id?: string
  reportDate: Date
  terminalMarket: string  // 'Los Angeles', 'New York', 'Chicago', etc.

  // Product identification
  commodity: string       // 'Orange', 'Grapefruit', 'Apple', etc.
  variety: string | null  // 'Navel', 'Red Delicious', etc.
  cultivarSpecified: boolean
  cultivarExplicit: string | null  // 'Cara Cara', 'Honeycrisp', etc.

  // Origin
  originState: string     // 'CA', 'FL', 'WA', etc.
  originRegion?: string   // More specific if available

  // Package/sizing
  packageType: string     // 'Carton 40 lb', 'Tray pack 25 lb', etc.
  sizeClass: string | null  // '88s', '113s', 'Jumbo', etc.

  // USDA grading
  usdaGrade: string | null  // 'US Fancy', 'US No. 1', 'US No. 2'
  qualityDescriptor: string | null  // 'Good', 'Fair', 'Ordinary'

  // Pricing (per package unit)
  priceLow: number | null
  priceHigh: number | null
  priceMostLow: number | null   // "Most" = typical/common range
  priceMostHigh: number | null

  // Market signals
  volumeIndicator: string | null  // 'Light', 'Moderate', 'Heavy'
  marketTrend: string | null      // 'Higher', 'Lower', 'Steady'

  // Estimated timing
  estimatedHarvestDate?: Date
  estimatedTransitDays?: number

  // Raw data
  reportText?: string

  createdAt?: Date
}

/**
 * Commodity quality prediction from terminal report
 */
export interface CommodityQualityPrediction {
  id?: string
  terminalReportId: string

  // Inference results
  inferredRegionId: string
  inferredCultivarId: string
  inferenceMethod: 'temporal_gdd_proximity' | 'static_market_share' | 'explicit_cultivar'
  cultivarProbability: number
  inferenceReasoning: string

  // GDD calculation
  calculatedGDD: number
  gddVersion: string

  // Quality prediction
  predictedBrix: number
  predictedBrixDistribution?: any  // JSONB
  predictedQualityTier: string

  // Assumed parameters (since terminal reports lack farm details)
  assumedPractices: any  // JSONB
  assumedRootstock: string | null
  assumedTreeAge: number | null

  predictionDate?: Date
}

/**
 * Harvest observation (extracted from terminal reports)
 */
export interface HarvestObservation {
  id?: string
  cultivarId: string
  regionId: string
  seasonYear: number

  observationDate: Date
  observationType: 'first_harvest' | 'peak_start' | 'peak_end' | 'last_harvest'
  observationSource: 'terminal_market' | 'farm_report' | 'extension_service'

  terminalReportId?: string
  confidence: number

  createdAt?: Date
}
