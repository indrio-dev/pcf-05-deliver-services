/**
 * Regional Practice Priors - Derived from Knowledge Graph
 *
 * Generated: 2025-12-23T03:36:29.306Z
 * Source: 15,038 growers in Knowledge Graph
 * Method: Analyzed certification, CSA, and product patterns by state
 */

export interface RegionalPracticeDistribution {
  regionId: string
  state: string
  cropCategory: string

  organicLikelihood: number      // 0-1
  ipmLikelihood: number           // 0-1
  conventionalLikelihood: number  // 0-1

  sampleSize: number
  confidence: number
}

export const REGIONAL_PRACTICE_PRIORS: RegionalPracticeDistribution[] = [
  {
    regionId: 'state_ny',
    state: 'NY',
    cropCategory: 'general',
    organicLikelihood: 0.001,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.649,
    sampleSize: 838,
    confidence: 0.85
  },
  {
    regionId: 'state_ca',
    state: 'CA',
    cropCategory: 'general',
    organicLikelihood: 0.006,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.644,
    sampleSize: 804,
    confidence: 0.85
  },
  {
    regionId: 'state_mi',
    state: 'MI',
    cropCategory: 'general',
    organicLikelihood: 0.001,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.649,
    sampleSize: 737,
    confidence: 0.85
  },
  {
    regionId: 'state_fl',
    state: 'FL',
    cropCategory: 'general',
    organicLikelihood: 0.004,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.646,
    sampleSize: 714,
    confidence: 0.85
  },
  {
    regionId: 'state_nc',
    state: 'NC',
    cropCategory: 'general',
    organicLikelihood: 0.001,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.649,
    sampleSize: 670,
    confidence: 0.85
  },
  {
    regionId: 'state_pa',
    state: 'PA',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 623,
    confidence: 0.85
  },
  {
    regionId: 'state_wi',
    state: 'WI',
    cropCategory: 'general',
    organicLikelihood: 0.009,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.641,
    sampleSize: 542,
    confidence: 0.85
  },
  {
    regionId: 'state_ga',
    state: 'GA',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 515,
    confidence: 0.85
  },
  {
    regionId: 'state_or',
    state: 'OR',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 510,
    confidence: 0.85
  },
  {
    regionId: 'state_tx',
    state: 'TX',
    cropCategory: 'general',
    organicLikelihood: 0.008,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.642,
    sampleSize: 508,
    confidence: 0.85
  },
  {
    regionId: 'state_oh',
    state: 'OH',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 491,
    confidence: 0.70
  },
  {
    regionId: 'state_wa',
    state: 'WA',
    cropCategory: 'general',
    organicLikelihood: 0.002,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.648,
    sampleSize: 475,
    confidence: 0.70
  },
  {
    regionId: 'state_tn',
    state: 'TN',
    cropCategory: 'general',
    organicLikelihood: 0.002,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.648,
    sampleSize: 436,
    confidence: 0.70
  },
  {
    regionId: 'state_va',
    state: 'VA',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 436,
    confidence: 0.70
  },
  {
    regionId: 'state_il',
    state: 'IL',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 394,
    confidence: 0.70
  },
  {
    regionId: 'state_in',
    state: 'IN',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 377,
    confidence: 0.70
  },
  {
    regionId: 'state_ma',
    state: 'MA',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 363,
    confidence: 0.70
  },
  {
    regionId: 'state_nj',
    state: 'NJ',
    cropCategory: 'general',
    organicLikelihood: 0.003,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.647,
    sampleSize: 352,
    confidence: 0.70
  },
  {
    regionId: 'state_ct',
    state: 'CT',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 335,
    confidence: 0.70
  },
  {
    regionId: 'state_mn',
    state: 'MN',
    cropCategory: 'general',
    organicLikelihood: 0.000,
    ipmLikelihood: 0.350,
    conventionalLikelihood: 0.650,
    sampleSize: 323,
    confidence: 0.70
  }
]

/**
 * Get regional practice prior with fallback to national defaults
 */
/**
 * Get regional practice prior - converts to RegionalPracticePriors format
 */
export function getRegionalPracticePrior(
  regionId: string,
  cropCategory: string = 'general'
): any {
  // Try region first
  const regional = REGIONAL_PRACTICE_PRIORS.find(
    p => p.regionId === regionId && p.cropCategory === cropCategory
  )

  if (regional) {
    // Convert to RegionalPracticePriors format with distributions
    return {
      regionId: regional.regionId,
      cropCategory: regional.cropCategory,
      pestManagementDist: {
        'conventional': regional.conventionalLikelihood,
        'ipm': regional.ipmLikelihood,
        'organic': regional.organicLikelihood
      },
      fertilityStrategyDist: {
        'annual_fertility': 0.60,
        'soil_banking': 0.30,
        'mineralized_soil_science': 0.10
      },
      nFarmsInSample: regional.sampleSize,
      dataSource: 'fielder_kg_2025_12_22',
      confidence: regional.confidence
    }
  }

  // Try state fallback
  const stateMatch = regionId.match(/state_([a-z]{2})/)
  if (stateMatch) {
    const stateCode = stateMatch[1].toUpperCase()
    const statePrior = REGIONAL_PRACTICE_PRIORS.find(
      p => p.state === stateCode && p.cropCategory === cropCategory
    )
    if (statePrior) {
      return {
        regionId: statePrior.regionId,
        cropCategory: statePrior.cropCategory,
        pestManagementDist: {
          'conventional': statePrior.conventionalLikelihood,
          'ipm': statePrior.ipmLikelihood,
          'organic': statePrior.organicLikelihood
        },
        fertilityStrategyDist: {
          'annual_fertility': 0.60,
          'soil_banking': 0.30,
          'mineralized_soil_science': 0.10
        },
        nFarmsInSample: statePrior.sampleSize,
        dataSource: 'fielder_kg_2025_12_22',
        confidence: statePrior.confidence * 0.8
      }
    }
  }

  // National default
  return {
    regionId: 'national',
    cropCategory,
    pestManagementDist: {
      'conventional': 0.35,
      'ipm': 0.40,
      'organic': 0.20,
      'no_spray': 0.05
    },
    fertilityStrategyDist: {
      'annual_fertility': 0.60,
      'soil_banking': 0.30,
      'mineralized_soil_science': 0.10
    },
    nFarmsInSample: 15038,
    dataSource: 'fielder_kg_2025_12_22',
    confidence: 0.60
  }
}
