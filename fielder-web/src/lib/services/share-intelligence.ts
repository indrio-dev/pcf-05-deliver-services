/**
 * =============================================================================
 * SHARE Quality Intelligence Service
 * =============================================================================
 *
 * Generates SHARE framework analysis from available data using the inference model.
 *
 * KEY INSIGHT: Each pillar is descriptive, not directly additive to Brix.
 * - S: Terroir describes POTENTIAL (what the soil offers)
 * - H: Genetics describes CEILING (what the cultivar can achieve)
 * - A: Practices determine ACTUALIZATION (what the farmer does)
 * - R: Timing affects EXPRESSION (when harvested relative to peak)
 * - E: Quality is the OUTCOME (measured or estimated Brix/nutrition)
 *
 * Without farm-level practice data, we use cultivar baseline for E.
 * We CANNOT claim soil adds Brix without knowing the farmer's practices.
 */

import type { GrowingRegionExtended } from '@/lib/constants/growing-regions'
import type { QualityTier, CultivarQualityProfile, HeritageIntent } from '@/lib/constants/quality-tiers'
import { CULTIVAR_QUALITY_PROFILES, QUALITY_TIER_INFO } from '@/lib/constants/quality-tiers'
import { getRootstock } from '@/lib/constants/rootstocks'
import type { ShareProfile } from '@/lib/constants/share-profiles'
import { getCategoryConfig, type QualityMetricType } from '@/lib/constants/category-config'

// =============================================================================
// TYPES
// =============================================================================

export interface SHAREPillarScore {
  score: number          // Data quality/confidence indicator, NOT Brix modifier
  rating: 'excellent' | 'good' | 'average' | 'below_average' | 'unknown'
  summary: string        // One-liner for display
  details?: string       // Optional longer explanation
  dataSource: 'farm_data' | 'region_data' | 'cultivar_data' | 'claim_inferred' | 'typical' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
}

export interface SHAREAnalysis {
  // Pillar scores (descriptive, not additive)
  soil: SHAREPillarScore
  heritage: SHAREPillarScore
  agricultural: SHAREPillarScore
  ripen: SHAREPillarScore
  enrich: SHAREPillarScore

  // Quality outcome (E pillar result)
  qualityTier: QualityTier

  // Primary quality metric from category config
  primaryQualityMetric: QualityMetricType
  qualityMetricLabel: string  // Human-readable label

  // Brix prediction (produce only - for backward compatibility)
  predictedBrix: number
  brixRange: [number, number]

  // Omega ratio estimate (meat, seafood, eggs, dairy)
  omegaRatioEstimate?: number
  omegaRatioRange?: [number, number]

  // Confidence in the overall analysis
  overallConfidence: 'high' | 'medium' | 'low'
  dataQualityLevel: 'basic' | 'enhanced' | 'profile_lab' | 'product_lab'

  // Educational notes
  insights: string[]
}

export interface SHAREInputs {
  // Region data (S pillar - terroir)
  region?: GrowingRegionExtended

  // Cultivar data (H pillar - genetics)
  cultivarId?: string
  cultivarProfile?: CultivarQualityProfile
  rootstockId?: string
  treeAgeYears?: number

  // Agricultural practices (A pillar) - rarely known without farm data
  practices?: {
    isOrganic?: boolean
    pestManagement?: 'conventional' | 'ipm' | 'organic' | 'no_spray'
    fertilityStrategy?: 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science'
    mineralizedSoil?: boolean
  }

  // Timing data (R pillar)
  timing?: {
    currentDoy: number           // Current day of year
    harvestWindowStart: number   // DOY when harvest starts
    harvestWindowPeak: number    // DOY of peak quality
    harvestWindowEnd: number     // DOY when harvest ends
  }

  // ShareProfile (provides claim-based pillar summaries)
  shareProfile?: ShareProfile | null

  // Category for context (from centralized category-config)
  category?: string
  subcategory?: string
}

// =============================================================================
// S - SOIL/FOUNDATION PILLAR (Terroir)
// =============================================================================

/**
 * S pillar describes the regional TERROIR - what the environment offers.
 * This is POTENTIAL, not outcome. We cannot claim Brix modifiers here.
 */
function scoreSoilPillar(
  region?: GrowingRegionExtended,
  shareProfile?: ShareProfile | null
): SHAREPillarScore {
  // If we have a ShareProfile, use its claim-based summary
  // Note: ShareProfile soil summary is about PRACTICES (mineralization, cover crops)
  // not just terroir - that's the A pillar overlap
  if (shareProfile?.soilPillarSummary && !region?.typicalSoil) {
    return {
      score: 0.5, // Medium confidence from profile
      rating: 'average',
      summary: shareProfile.soilPillarSummary,
      dataSource: 'claim_inferred',
      confidence: 'medium',
    }
  }

  if (!region?.typicalSoil) {
    return {
      score: 0,
      rating: 'unknown',
      summary: 'Regional soil characteristics not available',
      dataSource: 'unknown',
      confidence: 'low',
    }
  }

  const soil = region.typicalSoil

  // Build terroir description (descriptive, not prescriptive)
  let summary = `${soil.type}`
  if (soil.drainage) {
    summary += ` with ${soil.drainage} drainage`
  }
  summary += '.'

  // Add terroir effect if available (educational, not claiming Brix)
  const details = soil.terroirEffect
    ? `Terroir: ${soil.terroirEffect}`
    : soil.mineralNotes
      ? soil.mineralNotes
      : undefined

  // Rating based on data quality, NOT nutritional contribution
  // We're rating how well we understand the terroir, not claiming it adds nutrition
  const hasDetailedData = soil.terroirEffect || soil.mineralNotes || soil.phRange
  const rating: SHAREPillarScore['rating'] = hasDetailedData ? 'good' : 'average'

  return {
    score: hasDetailedData ? 0.7 : 0.4, // Data quality score
    rating,
    summary,
    details,
    dataSource: 'region_data',
    confidence: soil.confidence || 'medium',
  }
}

// =============================================================================
// H - HERITAGE/GENETICS PILLAR
// =============================================================================

/**
 * H pillar describes the genetic CEILING - what the cultivar can achieve.
 * Brix numbers go in E (Enrich), not here. Here we describe the genetics.
 */
function scoreHeritagePillar(
  cultivarId?: string,
  cultivarProfile?: CultivarQualityProfile,
  rootstockId?: string,
  treeAgeYears?: number,
  shareProfile?: ShareProfile | null
): SHAREPillarScore {
  // Try to find profile if not provided
  const profile = cultivarProfile ||
    CULTIVAR_QUALITY_PROFILES.find(p => p.cultivarId === cultivarId)

  // If no cultivar data but we have a ShareProfile, use its summary
  if (!profile && shareProfile?.heritagePillarSummary) {
    return {
      score: 0.5,
      rating: 'average',
      summary: shareProfile.heritagePillarSummary,
      dataSource: 'claim_inferred',
      confidence: 'medium',
    }
  }

  if (!profile) {
    return {
      score: 0,
      rating: 'unknown',
      summary: 'Cultivar genetic data not available',
      dataSource: 'unknown',
      confidence: 'low',
    }
  }

  const insights: string[] = []

  // Describe the heritage intent (WHY this cultivar exists)
  const heritageLabels: Record<HeritageIntent, string> = {
    true_heritage: 'Heritage cultivar selected for flavor and nutrition over generations',
    heirloom_quality: `Heirloom variety${profile.yearIntroduced ? ` (pre-${profile.yearIntroduced})` : ''} bred for quality`,
    modern_nutrient: 'Modern cultivar bred with nutrition focus',
    modern_flavor: 'Modern cultivar bred for flavor characteristics',
    heirloom_utility: 'Historic cultivar bred primarily for hardiness',
    commercial: 'Commercial cultivar optimized for yield and shipping',
  }
  insights.push(heritageLabels[profile.heritageIntent])

  // Add flavor profile if available
  if (profile.flavorProfile) {
    insights.push(profile.flavorProfile)
  }

  // Rootstock info (for tree crops)
  if (rootstockId) {
    const rootstock = getRootstock(rootstockId)
    if (rootstock) {
      insights.push(`Grafted on ${rootstock.name} rootstock`)
    }
  }

  // Tree age context (if provided)
  if (treeAgeYears !== undefined) {
    if (treeAgeYears >= 8 && treeAgeYears <= 18) {
      insights.push('Trees in prime production years')
    } else if (treeAgeYears < 5) {
      insights.push('Young trees still developing')
    } else if (treeAgeYears > 25) {
      insights.push('Mature trees')
    }
  }

  // Rating based on quality tier (genetic potential)
  const tierRatings: Record<QualityTier, SHAREPillarScore['rating']> = {
    artisan: 'excellent',
    premium: 'good',
    standard: 'average',
    commodity: 'below_average',
  }

  return {
    score: profile.qualityTier === 'artisan' ? 0.9 :
           profile.qualityTier === 'premium' ? 0.7 :
           profile.qualityTier === 'standard' ? 0.5 : 0.3,
    rating: tierRatings[profile.qualityTier],
    summary: `${profile.cultivarName}. ${insights[0]}`,
    details: insights.length > 1 ? insights.slice(1).join('. ') : undefined,
    dataSource: 'cultivar_data',
    confidence: 'high',
  }
}

// =============================================================================
// A - AGRICULTURAL PRACTICES PILLAR
// =============================================================================

/**
 * A pillar describes PRACTICES - what the farmer does.
 * This is where mineralization, cover cropping, etc. would enhance nutrition.
 *
 * INFERENCE MODEL: Even without farm-level data, we infer from:
 * - Category → Industry standard practices
 * - IPM adoption rates (85% for citrus, 70% overall)
 * - Organic claim presence/absence
 * - ShareProfile claim-based context
 */
function scoreAgriculturalPillar(
  practices?: SHAREInputs['practices'],
  region?: GrowingRegionExtended,
  shareProfile?: ShareProfile | null,
  category?: string,
  isOrganic?: boolean
): SHAREPillarScore {
  // If we have farm-level practice data (rare but best)
  if (practices) {
    const insights: string[] = []

    // Mineralized soil is THE key differentiator for nutrition
    if (practices.mineralizedSoil) {
      insights.push('Mineralized soil science practices')
    }

    // Fertility strategy
    if (practices.fertilityStrategy === 'mineralized_soil_science') {
      insights.push('Alternative agriculture approach (soil biology focus)')
    } else if (practices.fertilityStrategy === 'soil_banking') {
      insights.push('Soil banking approach (long-term soil capital)')
    } else if (practices.fertilityStrategy === 'annual_fertility') {
      insights.push('Annual fertility program')
    }

    // Organic status
    if (practices.isOrganic) {
      insights.push('Certified organic')
    }

    return {
      score: practices.mineralizedSoil ? 0.9 : 0.5,
      rating: practices.mineralizedSoil ? 'excellent' : 'average',
      summary: insights[0] || 'Farm-level practices known',
      details: insights.length > 1 ? insights.slice(1).join('. ') : undefined,
      dataSource: 'farm_data',
      confidence: 'high',
    }
  }

  // Use ShareProfile claim-based summary if available
  if (shareProfile?.agriculturalPillarSummary) {
    const tierRatings: Record<QualityTier, SHAREPillarScore['rating']> = {
      artisan: 'excellent',
      premium: 'good',
      standard: 'average',
      commodity: 'below_average',
    }

    return {
      score: shareProfile.qualityTier === 'artisan' ? 0.8 :
             shareProfile.qualityTier === 'premium' ? 0.6 : 0.4,
      rating: tierRatings[shareProfile.qualityTier],
      summary: shareProfile.agriculturalPillarSummary,
      dataSource: 'claim_inferred',
      confidence: 'medium',
    }
  }

  // INFER practices from category and available signals
  // This is the inference model - we make educated assumptions

  // IPM adoption rates by category (from USDA NASS data)
  const ipmRates: Record<string, number> = {
    citrus: 0.85,
    stone_fruit: 0.75,
    pome_fruit: 0.70,
    berry: 0.65,
    tropical: 0.60,
    default: 0.70,
  }

  const categoryKey = category?.toLowerCase() || 'default'
  const ipmRate = ipmRates[categoryKey] || ipmRates.default
  const likelyIpm = ipmRate >= 0.70

  // Build inferred practice description
  let summary: string
  let details: string

  if (isOrganic) {
    summary = 'Organic practices (no synthetic pesticides or fertilizers)'
    details = 'Certified organic implies soil banking approach and organic-approved inputs'
  } else {
    // Conventional - infer based on industry norms
    const pestApproach = likelyIpm
      ? `IPM (Integrated Pest Management) - ${Math.round(ipmRate * 100)}% of ${category || 'produce'} uses IPM`
      : 'Conventional pest management'

    summary = `Conventional commercial practices. ${pestApproach}`
    details = 'Annual fertility program typical. Standard commercial approach focused on yield and consistency.'
  }

  return {
    score: isOrganic ? 0.5 : 0.4, // Organic slightly higher but neither is mineralized
    rating: 'average', // Without mineralization, practices are average for nutrition
    summary,
    details,
    dataSource: 'typical',
    confidence: 'medium', // Medium because we're inferring from industry statistics
  }
}

// =============================================================================
// R - RIPEN/TIMING PILLAR
// =============================================================================

/**
 * R pillar describes TIMING - harvest window and current position.
 * Timing significantly affects quality expression.
 */
function scoreRipenPillar(
  timing?: SHAREInputs['timing'],
  shareProfile?: ShareProfile | null
): SHAREPillarScore {
  if (!timing) {
    // Use ShareProfile if available
    if (shareProfile?.ripenPillarSummary) {
      return {
        score: 0.5,
        rating: 'average',
        summary: shareProfile.ripenPillarSummary,
        dataSource: 'claim_inferred',
        confidence: 'low',
      }
    }
    return {
      score: 0,
      rating: 'unknown',
      summary: 'Harvest timing data not available',
      dataSource: 'unknown',
      confidence: 'low',
    }
  }

  const { currentDoy, harvestWindowStart, harvestWindowPeak, harvestWindowEnd } = timing

  // Calculate position in harvest window
  const windowLength = harvestWindowEnd - harvestWindowStart
  const peakWidth = Math.round(windowLength * 0.3)  // Peak is ~30% of window
  const peakStart = harvestWindowPeak - Math.round(peakWidth / 2)
  const peakEnd = harvestWindowPeak + Math.round(peakWidth / 2)

  let rating: SHAREPillarScore['rating'] = 'average'
  let summary = ''
  let score = 0.5

  if (currentDoy < harvestWindowStart) {
    // Before harvest
    const daysUntil = harvestWindowStart - currentDoy
    score = 0.2
    rating = 'below_average'
    summary = `${daysUntil} days until harvest begins`
  } else if (currentDoy >= peakStart && currentDoy <= peakEnd) {
    // At peak
    score = 1.0
    rating = 'excellent'
    summary = 'Currently at peak harvest quality'
  } else if (currentDoy >= harvestWindowStart && currentDoy < peakStart) {
    // Early in window, approaching peak
    const daysUntilPeak = peakStart - currentDoy
    score = 0.7
    rating = 'good'
    summary = `In season, ${daysUntilPeak} days until peak`
  } else if (currentDoy > peakEnd && currentDoy <= harvestWindowEnd) {
    // Late in window, past peak
    const daysPastPeak = currentDoy - peakEnd
    score = 0.6
    rating = 'good'
    summary = `In season, ${daysPastPeak} days past peak`
  } else {
    // Off season
    score = 0.2
    rating = 'below_average'
    summary = 'Outside harvest window'
  }

  return {
    score,
    rating,
    summary,
    dataSource: 'region_data',
    confidence: 'high',
  }
}

// =============================================================================
// E - ENRICH/QUALITY PILLAR (Outcome)
// =============================================================================

/**
 * E pillar is the OUTCOME - measured or estimated quality.
 * This is where Brix prediction lives.
 *
 * Without farm-level practice data, we use cultivar baseline.
 * We only adjust from baseline when we KNOW practices (mineralization, etc.)
 */
function calculateEnrichPillar(
  soilScore: SHAREPillarScore,
  heritageScore: SHAREPillarScore,
  agriculturalScore: SHAREPillarScore,
  ripenScore: SHAREPillarScore,
  cultivarProfile?: CultivarQualityProfile,
  shareProfile?: ShareProfile | null,
  hasFarmPractices?: boolean
): { enrich: SHAREPillarScore; predictedBrix: number; brixRange: [number, number]; qualityTier: QualityTier } {

  // Get base Brix from cultivar genetic potential or ShareProfile
  let baseBrix: number
  let brixSource: string

  if (cultivarProfile?.researchAvgBrix) {
    baseBrix = cultivarProfile.researchAvgBrix
    brixSource = `${cultivarProfile.cultivarName} cultivar baseline`
  } else if (cultivarProfile?.researchPeakBrix) {
    baseBrix = cultivarProfile.researchPeakBrix * 0.9 // Use 90% of peak as average
    brixSource = `${cultivarProfile.cultivarName} cultivar estimate`
  } else if (shareProfile && 'estimatedBrixRange' in shareProfile) {
    baseBrix = (shareProfile.estimatedBrixRange[0] + shareProfile.estimatedBrixRange[1]) / 2
    brixSource = `${shareProfile.name} profile baseline`
  } else {
    baseBrix = 10 // Default fallback
    brixSource = 'Category average estimate'
  }

  // Build the explanation
  const explanationParts: string[] = []
  explanationParts.push(`Base: ${baseBrix.toFixed(1)}° (${brixSource})`)

  // Timing adjustment (we CAN apply this - it's based on known data)
  let timingAdjustment = 0
  if (ripenScore.rating === 'excellent') {
    timingAdjustment = 0.5
    explanationParts.push('Peak timing: +0.5°')
  } else if (ripenScore.rating === 'below_average') {
    timingAdjustment = -0.5
    explanationParts.push('Off-peak timing: -0.5°')
  }

  // Practice adjustment ONLY if we have farm-level data
  let practiceAdjustment = 0
  if (hasFarmPractices && agriculturalScore.rating === 'excellent') {
    practiceAdjustment = 1.0 // Mineralized soil can add up to 1° Brix
    explanationParts.push('Verified practices: +1.0°')
  } else if (!hasFarmPractices) {
    explanationParts.push('Practices: unknown (using baseline)')
  }

  // Final prediction
  const predictedBrix = Math.round((baseBrix + timingAdjustment + practiceAdjustment) * 10) / 10

  // Calculate confidence-based range
  const confidenceScores = [
    heritageScore.confidence === 'high' ? 1 : heritageScore.confidence === 'medium' ? 0.5 : 0,
    agriculturalScore.confidence === 'high' ? 1 : agriculturalScore.confidence === 'medium' ? 0.5 : 0,
    ripenScore.confidence === 'high' ? 1 : ripenScore.confidence === 'medium' ? 0.5 : 0,
  ]
  const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / 3
  const uncertainty = avgConfidence >= 0.75 ? 0.5 : avgConfidence >= 0.5 ? 1.0 : 1.5

  const brixRange: [number, number] = [
    Math.round((predictedBrix - uncertainty) * 10) / 10,
    Math.round((predictedBrix + uncertainty) * 10) / 10,
  ]

  // Determine quality tier: Use cultivar's genetic tier if available, otherwise infer from Brix
  // This is important because different crops have different Brix scales
  // (grapefruit peaks at ~11° while oranges can hit 14°)
  let qualityTier: QualityTier
  if (cultivarProfile?.qualityTier) {
    // Use the cultivar's defined genetic quality tier
    qualityTier = cultivarProfile.qualityTier
  } else {
    // Fall back to Brix-based inference for unknown cultivars
    qualityTier = 'commodity'
    if (predictedBrix >= 14) qualityTier = 'artisan'
    else if (predictedBrix >= 12) qualityTier = 'premium'
    else if (predictedBrix >= 10) qualityTier = 'standard'
  }

  // Use ShareProfile enrichment summary if available, otherwise build from data
  let summary: string
  if (shareProfile?.enrichPillarSummary && !cultivarProfile) {
    summary = shareProfile.enrichPillarSummary
  } else {
    const tierLabel = QUALITY_TIER_INFO[qualityTier].name
    summary = `${tierLabel} quality. Estimated ${brixRange[0]}–${brixRange[1]}° Brix.`
  }

  const enrich: SHAREPillarScore = {
    score: (predictedBrix - 8) / 10, // Normalize: 8=0, 18=1
    rating: qualityTier === 'artisan' ? 'excellent' :
            qualityTier === 'premium' ? 'good' :
            qualityTier === 'standard' ? 'average' : 'below_average',
    summary,
    details: explanationParts.join('. ') + '.',
    dataSource: cultivarProfile ? 'cultivar_data' : shareProfile ? 'claim_inferred' : 'typical',
    confidence: avgConfidence >= 0.75 ? 'high' : avgConfidence >= 0.5 ? 'medium' : 'low',
  }

  return { enrich, predictedBrix, brixRange, qualityTier }
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

/**
 * Generate complete SHARE analysis from available data
 * Now category-aware using centralized config from /lib/constants/category-config.ts
 */
export function analyzeSHARE(inputs: SHAREInputs): SHAREAnalysis {
  // Get category config for category-appropriate quality metrics
  const categoryConfig = getCategoryConfig(inputs.category || 'fruit', inputs.subcategory)
  const primaryQualityMetric = categoryConfig.qualityMetrics.primary
  const qualityMetricLabel = categoryConfig.qualityMetrics.displayName

  // Find cultivar profile if not provided
  const cultivarProfile = inputs.cultivarProfile ||
    CULTIVAR_QUALITY_PROFILES.find(p => p.cultivarId === inputs.cultivarId)

  // Get ShareProfile for claim-based context
  const shareProfile = inputs.shareProfile

  // Score each pillar (descriptive, not additive)
  const soil = scoreSoilPillar(inputs.region, shareProfile)
  const heritage = scoreHeritagePillar(
    inputs.cultivarId,
    cultivarProfile,
    inputs.rootstockId,
    inputs.treeAgeYears,
    shareProfile
  )
  const agricultural = scoreAgriculturalPillar(
    inputs.practices,
    inputs.region,
    shareProfile,
    inputs.category,
    inputs.practices?.isOrganic
  )
  const ripen = scoreRipenPillar(inputs.timing, shareProfile)

  // Calculate E pillar (the outcome) - includes quality tier determination
  const hasFarmPractices = inputs.practices?.mineralizedSoil !== undefined
  const enrichResult = calculateEnrichPillar(
    soil, heritage, agricultural, ripen,
    cultivarProfile, shareProfile, hasFarmPractices
  )
  const { enrich, predictedBrix, brixRange, qualityTier } = enrichResult

  // Overall confidence
  const confidenceScores = [soil.confidence, heritage.confidence, agricultural.confidence, ripen.confidence]
  const highCount = confidenceScores.filter(c => c === 'high').length
  const overallConfidence = highCount >= 3 ? 'high' : highCount >= 2 ? 'medium' : 'low'

  // Generate insights (category-aware)
  const insights: string[] = []

  if (agricultural.confidence === 'low') {
    insights.push('Farm-level practices unknown; using cultivar baseline')
  }
  if (ripen.rating === 'excellent') {
    insights.push('Peak harvest timing maximizes quality expression')
  }
  if (heritage.rating === 'excellent' && cultivarProfile?.isHeritage) {
    insights.push('Heritage genetics offer superior flavor potential')
  }
  if (soil.dataSource === 'region_data' && inputs.region?.typicalSoil?.terroirEffect) {
    insights.push('Regional terroir known; actual impact depends on farm practices')
  }

  // Calculate omega ratio estimate for meat/seafood/eggs/dairy
  let omegaRatioEstimate: number | undefined
  let omegaRatioRange: [number, number] | undefined

  if (primaryQualityMetric === 'omega_ratio' && shareProfile && 'estimatedOmegaRatioMidpoint' in shareProfile) {
    omegaRatioEstimate = shareProfile.estimatedOmegaRatioMidpoint
    // Calculate range based on feeding regime variance
    const variance = shareProfile.qualityTier === 'artisan' ? 1 :
                     shareProfile.qualityTier === 'premium' ? 2 : 4
    omegaRatioRange = [
      Math.max(1, omegaRatioEstimate - variance),
      omegaRatioEstimate + variance
    ]
  }

  return {
    soil,
    heritage,
    agricultural,
    ripen,
    enrich,
    qualityTier,
    primaryQualityMetric,
    qualityMetricLabel,
    predictedBrix,
    brixRange,
    omegaRatioEstimate,
    omegaRatioRange,
    overallConfidence,
    dataQualityLevel: hasFarmPractices ? 'enhanced' : 'basic',
    insights,
  }
}

/**
 * Get quality tier from Brix value (produce)
 */
export function getQualityTierFromBrix(brix: number): QualityTier {
  if (brix >= 14) return 'artisan'
  if (brix >= 12) return 'premium'
  if (brix >= 10) return 'standard'
  return 'commodity'
}

/**
 * Get quality tier from omega ratio (meat, seafood, eggs, dairy)
 * NOTE: For omega ratio, LOWER is better (unlike Brix where higher is better)
 * - ≤3:1 is exceptional (grass-fed)
 * - 3-6:1 is premium
 * - 6-12:1 is standard
 * - >12:1 is commodity (feedlot)
 */
export function getQualityTierFromOmegaRatio(ratio: number): QualityTier {
  if (ratio <= 3) return 'artisan'
  if (ratio <= 6) return 'premium'
  if (ratio <= 12) return 'standard'
  return 'commodity'
}

/**
 * Get quality tier based on category-appropriate metric
 */
export function getQualityTier(
  metricType: QualityMetricType,
  value: number
): QualityTier {
  switch (metricType) {
    case 'brix':
      return getQualityTierFromBrix(value)
    case 'omega_ratio':
      return getQualityTierFromOmegaRatio(value)
    case 'oil_content':
      // For nuts: higher oil content = better
      if (value >= 72) return 'artisan'
      if (value >= 68) return 'premium'
      if (value >= 64) return 'standard'
      return 'commodity'
    case 'fat_percentage':
      // For dairy: higher fat = better (butterfat)
      if (value >= 4.5) return 'artisan'
      if (value >= 4.0) return 'premium'
      if (value >= 3.5) return 'standard'
      return 'commodity'
    case 'protein_content':
      // For grains: higher protein = better
      if (value >= 14) return 'artisan'
      if (value >= 12) return 'premium'
      if (value >= 10) return 'standard'
      return 'commodity'
    default:
      return 'standard' // Default for 'none' or unknown
  }
}

/**
 * Format heritage intent for display
 */
export function formatHeritageIntent(intent: HeritageIntent): string {
  const labels: Record<HeritageIntent, string> = {
    true_heritage: 'Heritage (Flavor/Nutrition Selected)',
    heirloom_quality: 'Heirloom (Pre-1950, Quality)',
    heirloom_utility: 'Historic (Hardiness/Yield)',
    modern_nutrient: 'Modern (Nutrition-Bred)',
    modern_flavor: 'Modern (Flavor-Bred)',
    commercial: 'Commercial (Yield/Shipping)',
  }
  return labels[intent] || intent
}
