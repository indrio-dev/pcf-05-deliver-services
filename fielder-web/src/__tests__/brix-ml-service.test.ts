/**
 * Brix ML Service Tests
 *
 * F024: Tests for ML feature extraction, A/B testing, and prediction.
 */

import {
  extractFeatures,
  featuresToArray,
  getFeatureNames,
  assignABGroup,
  shouldUseML,
  getMLPrediction,
  FERTILITY_ENCODING,
  PEST_MANAGEMENT_ENCODING,
  DEFAULT_EXPERIMENT,
  type MLFeatures,
  type ABExperiment,
} from '@/lib/intelligence/brix-ml-service'

// =============================================================================
// FEATURE EXTRACTION TESTS
// =============================================================================

describe('Feature Extraction', () => {
  describe('extractFeatures()', () => {
    it('extracts basic cultivar features', () => {
      const features = extractFeatures({
        cultivarId: 'washington_navel',
        baseBrix: 11.5,
        qualityTier: 'premium',
      })

      expect(features.cultivarId).toBe('washington_navel')
      expect(features.baseBrix).toBe(11.5)
      expect(features.qualityTier).toBe('premium')
    })

    it('extracts environmental features', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        regionId: 'indian_river_fl',
        currentGdd: 1200,
        targetGdd: 1500,
      })

      expect(features.regionId).toBe('indian_river_fl')
      expect(features.currentGdd).toBe(1200)
      expect(features.targetGdd).toBe(1500)
      expect(features.gddProgress).toBe(0.8)
    })

    it('calculates GDD progress correctly', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        currentGdd: 750,
        targetGdd: 1500,
      })

      expect(features.gddProgress).toBe(0.5)
    })

    it('handles zero target GDD', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        currentGdd: 100,
        targetGdd: 0,
      })

      // When targetGdd is 0, it defaults to 1500
      // gddProgress = 100 / 1500 = 0.0667
      expect(features.targetGdd).toBe(1500)
      expect(features.gddProgress).toBeCloseTo(0.067, 2)
    })

    it('extracts timing features', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        daysFromPeakCenter: 7,
      })

      expect(features.daysFromPeakCenter).toBe(7)
      expect(typeof features.seasonMonth).toBe('number')
      expect(typeof features.isEarlySeasonDate).toBe('boolean')
      expect(typeof features.isLateSeasonDate).toBe('boolean')
    })

    it('extracts tree features', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        treeAgeYears: 12,
        rootstockId: 'carrizo',
        rootstockModifier: 0.6,
      })

      expect(features.treeAgeYears).toBe(12)
      expect(features.rootstockId).toBe('carrizo')
      expect(features.rootstockModifier).toBe(0.6)
    })

    it('extracts calibration features', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        calibrationOffset: 0.3,
        calibrationSampleCount: 25,
      })

      expect(features.hasCalibration).toBe(true)
      expect(features.calibrationOffset).toBe(0.3)
      expect(features.calibrationSampleCount).toBe(25)
    })

    it('marks no calibration when samples < 5', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        calibrationSampleCount: 3,
      })

      expect(features.hasCalibration).toBe(false)
    })

    it('encodes practice features', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        fertilityApproach: 'mineralized_soil_science',
        pestManagement: 'organic',
        cropLoadManaged: true,
      })

      expect(features.fertilityApproach).toBe(2)
      expect(features.pestManagement).toBe(2)
      expect(features.cropLoadManaged).toBe(true)
    })

    it('handles missing optional fields', () => {
      const features = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
      })

      expect(features.qualityTier).toBe('standard')
      expect(features.regionId).toBe('unknown')
      expect(features.treeAgeYears).toBeUndefined()
      expect(features.rootstockId).toBeUndefined()
      expect(features.fertilityApproach).toBeUndefined()
    })
  })

  describe('featuresToArray()', () => {
    it('converts features to numeric array', () => {
      const features: MLFeatures = {
        cultivarId: 'test',
        baseBrix: 11.5,
        qualityTier: 'premium',
        regionId: 'indian_river_fl',
        currentGdd: 1200,
        targetGdd: 1500,
        gddProgress: 0.8,
        daysFromPeakCenter: 7,
        seasonMonth: 3,
        isEarlySeasonDate: false,
        isLateSeasonDate: false,
        treeAgeYears: 12,
        rootstockModifier: 0.6,
        hasCalibration: true,
        calibrationOffset: 0.3,
        calibrationSampleCount: 25,
        fertilityApproach: 2,
        pestManagement: 2,
        cropLoadManaged: true,
      }

      const array = featuresToArray(features)

      expect(Array.isArray(array)).toBe(true)
      expect(array.length).toBe(16)
      expect(array[0]).toBe(11.5) // baseBrix
      expect(array[1]).toBe(1200) // currentGdd
      expect(array[8]).toBe(12) // treeAgeYears
    })

    it('uses -1 for missing encoded features', () => {
      const features: MLFeatures = {
        cultivarId: 'test',
        baseBrix: 10,
        qualityTier: 'standard',
        regionId: 'unknown',
        currentGdd: 0,
        targetGdd: 1500,
        gddProgress: 0,
        daysFromPeakCenter: 0,
        seasonMonth: 1,
        isEarlySeasonDate: true,
        isLateSeasonDate: false,
        hasCalibration: false,
        calibrationOffset: 0,
        calibrationSampleCount: 0,
        fertilityApproach: undefined,
        pestManagement: undefined,
        cropLoadManaged: false,
      }

      const array = featuresToArray(features)

      expect(array[13]).toBe(-1) // fertilityApproach undefined
      expect(array[14]).toBe(-1) // pestManagement undefined
    })

    it('converts booleans to 0/1', () => {
      const features: MLFeatures = {
        cultivarId: 'test',
        baseBrix: 10,
        qualityTier: 'standard',
        regionId: 'unknown',
        currentGdd: 0,
        targetGdd: 1500,
        gddProgress: 0,
        daysFromPeakCenter: 0,
        seasonMonth: 1,
        isEarlySeasonDate: true,
        isLateSeasonDate: false,
        hasCalibration: true,
        calibrationOffset: 0,
        calibrationSampleCount: 10,
        cropLoadManaged: true,
      }

      const array = featuresToArray(features)

      expect(array[6]).toBe(1) // isEarlySeasonDate = true
      expect(array[7]).toBe(0) // isLateSeasonDate = false
      expect(array[10]).toBe(1) // hasCalibration = true
      expect(array[15]).toBe(1) // cropLoadManaged = true
    })
  })

  describe('getFeatureNames()', () => {
    it('returns correct number of feature names', () => {
      const names = getFeatureNames()
      expect(names.length).toBe(16)
    })

    it('names match feature array order', () => {
      const names = getFeatureNames()
      expect(names[0]).toBe('base_brix')
      expect(names[1]).toBe('current_gdd')
      expect(names[8]).toBe('tree_age_years')
    })
  })
})

// =============================================================================
// ENCODING TESTS
// =============================================================================

describe('Feature Encodings', () => {
  describe('FERTILITY_ENCODING', () => {
    it('encodes all fertility approaches', () => {
      expect(FERTILITY_ENCODING.annual_fertility).toBe(0)
      expect(FERTILITY_ENCODING.soil_banking).toBe(1)
      expect(FERTILITY_ENCODING.mineralized_soil_science).toBe(2)
    })
  })

  describe('PEST_MANAGEMENT_ENCODING', () => {
    it('encodes all pest management approaches', () => {
      expect(PEST_MANAGEMENT_ENCODING.conventional).toBe(0)
      expect(PEST_MANAGEMENT_ENCODING.ipm).toBe(1)
      expect(PEST_MANAGEMENT_ENCODING.organic).toBe(2)
      expect(PEST_MANAGEMENT_ENCODING.no_spray).toBe(3)
    })
  })
})

// =============================================================================
// A/B TESTING TESTS
// =============================================================================

describe('A/B Testing', () => {
  describe('assignABGroup()', () => {
    it('assigns user to group consistently', () => {
      const assignment1 = assignABGroup('user-123')
      const assignment2 = assignABGroup('user-123')

      expect(assignment1.group).toBe(assignment2.group)
      expect(assignment1.modelVersion).toBe(assignment2.modelVersion)
    })

    it('returns valid group assignment', () => {
      const assignment = assignABGroup('user-123')

      expect(['control', 'treatment']).toContain(assignment.group)
      expect(['formula_v1', 'ml_v1', 'ml_v2']).toContain(assignment.modelVersion)
      expect(assignment.userId).toBe('user-123')
      expect(assignment.experimentId).toBe(DEFAULT_EXPERIMENT.id)
    })

    it('assigns different users to different groups', () => {
      // With enough users, we should see both groups
      const assignments = Array.from({ length: 100 }, (_, i) =>
        assignABGroup(`user-${i}`)
      )

      const groups = new Set(assignments.map(a => a.group))
      expect(groups.size).toBe(2)
    })

    it('respects custom experiment config', () => {
      const experiment: ABExperiment = {
        id: 'custom_exp',
        name: 'Custom Test',
        controlModel: 'formula_v1',
        treatmentModel: 'ml_v2',
        trafficSplit: 0.5, // 50% in treatment
        isActive: true,
        startDate: '2024-01-01',
      }

      const assignment = assignABGroup('user-123', experiment)
      expect(assignment.experimentId).toBe('custom_exp')
    })

    it('respects traffic split', () => {
      const experiment: ABExperiment = {
        ...DEFAULT_EXPERIMENT,
        id: 'split_test',
        trafficSplit: 0.5, // 50-50 split
      }

      const assignments = Array.from({ length: 1000 }, (_, i) =>
        assignABGroup(`user-split-${i}`, experiment)
      )

      const treatmentCount = assignments.filter(a => a.group === 'treatment').length

      // Should be roughly 50% ± 10%
      expect(treatmentCount).toBeGreaterThan(400)
      expect(treatmentCount).toBeLessThan(600)
    })
  })

  describe('shouldUseML()', () => {
    it('returns boolean', () => {
      const result = shouldUseML('user-123')
      expect(typeof result).toBe('boolean')
    })

    it('is consistent for same user', () => {
      const result1 = shouldUseML('user-456')
      const result2 = shouldUseML('user-456')
      expect(result1).toBe(result2)
    })

    it('returns true for treatment group users', () => {
      // Find a user in treatment group
      let treatmentUser: string | null = null
      for (let i = 0; i < 100; i++) {
        const userId = `test-user-${i}`
        const assignment = assignABGroup(userId)
        if (assignment.group === 'treatment') {
          treatmentUser = userId
          break
        }
      }

      if (treatmentUser) {
        expect(shouldUseML(treatmentUser)).toBe(true)
      }
    })
  })

  describe('DEFAULT_EXPERIMENT', () => {
    it('has required fields', () => {
      expect(DEFAULT_EXPERIMENT.id).toBeDefined()
      expect(DEFAULT_EXPERIMENT.name).toBeDefined()
      expect(DEFAULT_EXPERIMENT.controlModel).toBeDefined()
      expect(DEFAULT_EXPERIMENT.treatmentModel).toBeDefined()
      expect(DEFAULT_EXPERIMENT.trafficSplit).toBeDefined()
      expect(DEFAULT_EXPERIMENT.isActive).toBe(true)
    })

    it('has reasonable traffic split', () => {
      expect(DEFAULT_EXPERIMENT.trafficSplit).toBeGreaterThan(0)
      expect(DEFAULT_EXPERIMENT.trafficSplit).toBeLessThanOrEqual(0.5)
    })
  })
})

// =============================================================================
// ML PREDICTION TESTS
// =============================================================================

describe('ML Prediction', () => {
  describe('getMLPrediction()', () => {
    const mockFeatures: MLFeatures = {
      cultivarId: 'washington_navel',
      baseBrix: 11.5,
      qualityTier: 'premium',
      regionId: 'indian_river_fl',
      currentGdd: 1400,
      targetGdd: 1500,
      gddProgress: 0.93,
      daysFromPeakCenter: 3,
      seasonMonth: 3,
      isEarlySeasonDate: false,
      isLateSeasonDate: false,
      treeAgeYears: 12,
      rootstockModifier: 0.6,
      hasCalibration: true,
      calibrationOffset: 0.3,
      calibrationSampleCount: 25,
      fertilityApproach: 2,
      pestManagement: 2,
      cropLoadManaged: true,
    }

    it('returns prediction object', async () => {
      const prediction = await getMLPrediction(mockFeatures, 12.0)

      expect(prediction).toBeDefined()
      expect(typeof prediction.predictedBrix).toBe('number')
      expect(typeof prediction.confidence).toBe('number')
      expect(prediction.modelVersion).toBeDefined()
      expect(prediction.features).toBeDefined()
    })

    it('includes features in prediction', async () => {
      const prediction = await getMLPrediction(mockFeatures, 12.0)

      expect(prediction.features.cultivarId).toBe('washington_navel')
      expect(prediction.features.baseBrix).toBe(11.5)
    })

    it('returns formula version for control group', async () => {
      // Find a control user
      let controlUser: string | null = null
      for (let i = 0; i < 100; i++) {
        const userId = `control-test-${i}`
        const assignment = assignABGroup(userId)
        if (assignment.group === 'control') {
          controlUser = userId
          break
        }
      }

      if (controlUser) {
        const prediction = await getMLPrediction(mockFeatures, 12.0, controlUser)
        expect(prediction.modelVersion).toBe('formula_v1')
      }
    })

    it('confidence is between 0 and 1', async () => {
      const prediction = await getMLPrediction(mockFeatures, 12.0)

      expect(prediction.confidence).toBeGreaterThan(0)
      expect(prediction.confidence).toBeLessThanOrEqual(1)
    })

    it('returns reasonable Brix value', async () => {
      const prediction = await getMLPrediction(mockFeatures, 12.0)

      expect(prediction.predictedBrix).toBeGreaterThan(0)
      expect(prediction.predictedBrix).toBeLessThan(30)
    })

    it('handles missing userId', async () => {
      const prediction = await getMLPrediction(mockFeatures, 12.0)

      expect(prediction).toBeDefined()
      expect(prediction.modelVersion).toBe('formula_v1') // No A/B without user
    })
  })
})

// =============================================================================
// SCENARIO TESTS
// =============================================================================

describe('ML Service Scenarios', () => {
  describe('Full prediction workflow', () => {
    it('extracts features and gets prediction', async () => {
      // 1. Extract features from context
      const features = extractFeatures({
        cultivarId: 'washington_navel',
        baseBrix: 11.5,
        qualityTier: 'premium',
        regionId: 'indian_river_fl',
        currentGdd: 1400,
        targetGdd: 1500,
        daysFromPeakCenter: 3,
        treeAgeYears: 12,
        rootstockModifier: 0.6,
        calibrationOffset: 0.3,
        calibrationSampleCount: 25,
        fertilityApproach: 'mineralized_soil_science',
        pestManagement: 'organic',
      })

      // 2. Get formula prediction (simulated)
      const formulaPrediction = 12.1

      // 3. Get ML-enhanced prediction
      const prediction = await getMLPrediction(features, formulaPrediction)

      // Assertions
      expect(features.gddProgress).toBeCloseTo(0.93, 1)
      expect(features.hasCalibration).toBe(true)
      expect(prediction.predictedBrix).toBeGreaterThan(10)
    })
  })

  describe('A/B assignment distribution', () => {
    it('maintains consistent assignment across calls', () => {
      const userId = 'consistent-test-user'

      const assignments = Array.from({ length: 10 }, () =>
        assignABGroup(userId)
      )

      const uniqueGroups = new Set(assignments.map(a => a.group))
      expect(uniqueGroups.size).toBe(1) // All same
    })
  })

  describe('Feature encoding consistency', () => {
    it('encodes practices consistently', () => {
      const features1 = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        fertilityApproach: 'mineralized_soil_science',
        pestManagement: 'ipm',
      })

      const features2 = extractFeatures({
        cultivarId: 'test',
        baseBrix: 10,
        fertilityApproach: 'mineralized_soil_science',
        pestManagement: 'ipm',
      })

      expect(features1.fertilityApproach).toBe(features2.fertilityApproach)
      expect(features1.pestManagement).toBe(features2.pestManagement)
    })
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('handles empty string userId', () => {
    const assignment = assignABGroup('')
    expect(assignment.userId).toBe('')
    expect(['control', 'treatment']).toContain(assignment.group)
  })

  it('handles very long userId', () => {
    const longUserId = 'a'.repeat(1000)
    const assignment = assignABGroup(longUserId)
    expect(assignment.userId).toBe(longUserId)
  })

  it('handles special characters in userId', () => {
    const assignment = assignABGroup('user@email.com!#$%')
    expect(['control', 'treatment']).toContain(assignment.group)
  })

  it('handles zero GDD values', async () => {
    const features = extractFeatures({
      cultivarId: 'test',
      baseBrix: 10,
      currentGdd: 0,
      targetGdd: 0,
    })

    expect(features.gddProgress).toBe(0)

    const prediction = await getMLPrediction(features, 10.0)
    expect(prediction.predictedBrix).toBeGreaterThan(0)
  })

  it('handles negative daysFromPeakCenter', () => {
    const features = extractFeatures({
      cultivarId: 'test',
      baseBrix: 10,
      daysFromPeakCenter: -14,
    })

    expect(features.daysFromPeakCenter).toBe(-14)
  })
})
