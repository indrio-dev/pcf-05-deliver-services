/**
 * Produce Predictor - Brix-based quality prediction for tree fruit, berries, melons
 *
 * Wraps the legacy quality-predictor.ts with the CategoryPredictor interface.
 * This is the most mature predictor in the system, backed by GDD models and
 * extensive cultivar research data.
 */

import type {
  CategoryPredictor,
  ProducePredictionInput,
  PredictionResult,
  PredictionInput,
  PrimaryMetricType,
} from './predictor-interface'

import { predictQuality, type QualityPredictionInput } from './quality-predictor'

// =============================================================================
// Produce Predictor Implementation
// =============================================================================

export const producePredictor: CategoryPredictor = {
  category: 'produce',
  validationStatus: 'validated', // Produce model is the most mature

  canHandle(input: PredictionInput): boolean {
    return input.category === 'produce'
  },

  getPrimaryMetricType(): PrimaryMetricType {
    return 'brix'
  },

  predict(input: PredictionInput): PredictionResult {
    const produceInput = input as ProducePredictionInput

    // Convert to legacy input format
    const legacyInput: QualityPredictionInput = {
      cultivarId: produceInput.cultivarId,
      regionId: produceInput.regionId || 'unknown',
      rootstockId: produceInput.rootstockId,
      treeAgeYears: produceInput.treeAgeYears,
      currentGDD: produceInput.currentGDD,
      currentDate: produceInput.currentDate || new Date(),
      bloomDate: produceInput.bloomDate,
      soil: produceInput.soil,
      practices: produceInput.practices
        ? {
            fertilityStrategy: produceInput.practices.fertilityStrategy?.approach
              ? {
                  approach: produceInput.practices.fertilityStrategy.approach,
                  coverCropping: produceInput.practices.fertilityStrategy.coverCropping,
                  compostApplication: produceInput.practices.fertilityStrategy.compostApplication,
                  mineralizedSoil: produceInput.practices.fertilityStrategy.mineralizedSoil,
                }
              : undefined,
            pestManagement: produceInput.practices.pestManagement,
            cropLoadManaged: produceInput.practices.cropLoadManaged,
          }
        : undefined,
    }

    // Call existing predictor
    const legacyResult = predictQuality(legacyInput)

    // Extract insights from legacy result
    const agriculturalInsights = legacyResult.agricultural?.insights || []

    // Convert to unified result format
    return {
      qualityScore: normalizeProduceBrixToScore(legacyResult.predictedBrix),
      qualityTier: legacyResult.predictedTier,
      confidence: legacyResult.confidence,

      primaryMetric: {
        type: 'brix',
        value: legacyResult.predictedBrix,
        unit: '°Bx',
        displayName: 'Brix',
        lowerIsBetter: false,
      },

      soil: {
        modifier: legacyResult.soil?.modifier || 0,
        confidence: legacyResult.soil?.confidence || 0.5,
        details: {
          regionId: produceInput.regionId,
          organicMatterPct: produceInput.soil?.organicMatterPct,
          ph: produceInput.soil?.ph,
          drainageClass: produceInput.soil?.drainageClass,
        },
        insights: [],
      },

      heritage: {
        modifier: legacyResult.heritage?.rootstockModifier || 0,
        confidence: legacyResult.heritage?.confidence || 0.8,
        details: {
          cultivarId: legacyResult.heritage?.cultivarId,
          cultivarName: legacyResult.heritage?.cultivarName,
          baseBrix: legacyResult.heritage?.baseBrix,
          rootstockId: legacyResult.heritage?.rootstockId,
          rootstockModifier: legacyResult.heritage?.rootstockModifier,
        },
        insights: [],
      },

      agricultural: {
        modifier: legacyResult.agricultural?.modifier || 0,
        confidence: legacyResult.agricultural?.confidence || 0.5,
        details: {
          fertilityStrategy: produceInput.practices?.fertilityStrategy?.approach,
          pestManagement: produceInput.practices?.pestManagement,
          cropLoadManaged: produceInput.practices?.cropLoadManaged,
          coverCropping: produceInput.practices?.fertilityStrategy?.coverCropping,
        },
        insights: agriculturalInsights,
      },

      ripen: {
        timingModifier: legacyResult.ripen?.timingModifier || 0,
        confidence: legacyResult.ripen?.confidence || 0.7,
        details: {
          currentGDD: legacyResult.ripen?.currentGDD,
          targetGDD: legacyResult.ripen?.gddToPeak,
          gddToMaturity: legacyResult.ripen?.gddToMaturity,
          gddToPeak: legacyResult.ripen?.gddToPeak,
          percentToMaturity: legacyResult.ripen?.percentToMaturity,
          daysToHarvest: legacyResult.ripen?.daysToHarvest || legacyResult.ripen?.daysToPeak,
          harvestStatus: mapHarvestStatus(legacyResult.ripen?.harvestStatus),
        },
        insights: [],
      },

      enrich: {
        verified: false,
        confidence: legacyResult.confidence,
        details: {
          primaryMetric: {
            type: 'brix',
            value: legacyResult.predictedBrix,
            unit: '°Bx',
            displayName: 'Brix',
            lowerIsBetter: false,
          },
        },
        insights: [
          `Predicted Brix: ${legacyResult.predictedBrix.toFixed(1)}°Bx`,
          `Quality Tier: ${legacyResult.predictedTier}`,
        ],
      },

      modelInfo: {
        category: 'produce',
        validationStatus: 'validated',
        warnings: [],
        lastUpdated: new Date('2024-12-15'),
      },
    }
  },
}

// =============================================================================
// Helper Functions
// =============================================================================

function normalizeProduceBrixToScore(brix: number): number {
  // 8 Brix = 0, 18 Brix = 100
  return Math.min(100, Math.max(0, ((brix - 8) / 10) * 100))
}

function mapHarvestStatus(
  status?: string
): 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak' {
  const mapping: Record<string, 'not_ready' | 'early' | 'optimal' | 'peak' | 'late' | 'past_peak'> = {
    not_ready: 'not_ready',
    too_early: 'early',
    early: 'early',
    approaching_maturity: 'early',
    at_maturity: 'optimal',
    optimal: 'optimal',
    peak: 'peak',
    past_peak: 'past_peak',
    late: 'late',
    overripe: 'past_peak',
  }
  return mapping[status?.toLowerCase() || ''] || 'optimal'
}
