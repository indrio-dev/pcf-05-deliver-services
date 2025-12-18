/**
 * Harvest Predictor Tests
 *
 * SPIKE-B: Regression tests for harvest-predictor.ts functions.
 * These tests capture the CURRENT behavior as a baseline.
 * F013 Rules Engine must maintain these exact outputs.
 */

import { harvestPredictor } from '@/lib/services/harvest-predictor'

describe('Harvest Predictor', () => {
  // ==========================================================================
  // AGE MODIFIER TESTS
  // ==========================================================================
  describe('calculateAgeModifier', () => {
    it('returns -0.8 for trees 0-2 years old (vegetative phase)', () => {
      expect(harvestPredictor.calculateAgeModifier(0)).toBe(-0.8)
      expect(harvestPredictor.calculateAgeModifier(1)).toBe(-0.8)
      expect(harvestPredictor.calculateAgeModifier(2)).toBe(-0.8)
    })

    it('returns -0.5 for trees 3-4 years old (transition)', () => {
      expect(harvestPredictor.calculateAgeModifier(3)).toBe(-0.5)
      expect(harvestPredictor.calculateAgeModifier(4)).toBe(-0.5)
    })

    it('returns -0.2 for trees 5-7 years old (canopy completion)', () => {
      expect(harvestPredictor.calculateAgeModifier(5)).toBe(-0.2)
      expect(harvestPredictor.calculateAgeModifier(6)).toBe(-0.2)
      expect(harvestPredictor.calculateAgeModifier(7)).toBe(-0.2)
    })

    it('returns 0.0 for trees 8-18 years old (PRIME production)', () => {
      expect(harvestPredictor.calculateAgeModifier(8)).toBe(0.0)
      expect(harvestPredictor.calculateAgeModifier(12)).toBe(0.0)
      expect(harvestPredictor.calculateAgeModifier(18)).toBe(0.0)
    })

    it('returns -0.2 for trees 19-25 years old (mature)', () => {
      expect(harvestPredictor.calculateAgeModifier(19)).toBe(-0.2)
      expect(harvestPredictor.calculateAgeModifier(22)).toBe(-0.2)
      expect(harvestPredictor.calculateAgeModifier(25)).toBe(-0.2)
    })

    it('returns -0.3 for trees >25 years old (declining)', () => {
      expect(harvestPredictor.calculateAgeModifier(26)).toBe(-0.3)
      expect(harvestPredictor.calculateAgeModifier(50)).toBe(-0.3)
      expect(harvestPredictor.calculateAgeModifier(100)).toBe(-0.3)
    })

    it('returns 0.0 for null age (assume prime)', () => {
      expect(harvestPredictor.calculateAgeModifier(null)).toBe(0.0)
    })
  })

  // ==========================================================================
  // TIMING MODIFIER TESTS
  // ==========================================================================
  describe('calculateTimingModifier', () => {
    const peakGdd = 2000
    const gddHalfwidth = 150
    const maxPenalty = 1.0

    it('returns 0 when exactly at peak GDD', () => {
      const mod = harvestPredictor.calculateTimingModifier(2000, 2000, 150, 1.0)
      expect(mod).toBe(0.0)
    })

    it('returns 0 within inner quartile (d <= H/2)', () => {
      // 75 GDD from peak = within H/2 = 75
      const mod = harvestPredictor.calculateTimingModifier(2075, 2000, 150, 1.0)
      expect(mod).toBe(0.0)

      const modMinus = harvestPredictor.calculateTimingModifier(1925, 2000, 150, 1.0)
      expect(modMinus).toBe(0.0)
    })

    it('applies parabolic penalty outside inner quartile', () => {
      // At H (150 GDD from peak): penalty = -1.0 * (150/150)^2 = -1.0
      const modAtH = harvestPredictor.calculateTimingModifier(2150, 2000, 150, 1.0)
      expect(modAtH).toBeCloseTo(-1.0, 1)
    })

    it('caps penalty at 1.5x max penalty', () => {
      // Very far from peak - should cap
      const mod = harvestPredictor.calculateTimingModifier(3000, 2000, 150, 1.0)
      expect(mod).toBe(-1.5)  // Capped at 1.5 * maxPenalty
    })

    it('works with custom halfwidth and penalty', () => {
      // halfwidth=300, maxPenalty=0.8
      // At 300 GDD from peak: penalty = -0.8 * (300/300)^2 = -0.8
      const mod = harvestPredictor.calculateTimingModifier(2300, 2000, 300, 0.8)
      expect(mod).toBeCloseTo(-0.8, 1)
    })
  })

  // ==========================================================================
  // PREDICT BRIX TESTS
  // ==========================================================================
  describe('predictBrix', () => {
    it('calculates Brix with all modifiers at zero (prime age, at peak)', () => {
      // Washington Navel (base 11.5) + Carrizo (+0.6) + prime age (0.0) + at peak (0.0)
      const result = harvestPredictor.predictBrix(11.5, 0.6, 12, 2000, 2000)

      expect(result.predictedBrix).toBeCloseTo(12.1, 1)
      expect(result.cultivarBase).toBe(11.5)
      expect(result.rootstockModifier).toBe(0.6)
      expect(result.ageModifier).toBe(0.0)  // Prime age
      expect(result.timingModifier).toBe(0.0)  // At peak
      expect(result.confidence).toBe(0.8)  // Known age
    })

    it('applies age modifier for young trees', () => {
      // Young tree (2 years) = -0.8 modifier
      const result = harvestPredictor.predictBrix(11.5, 0.6, 2, 2000, 2000)

      expect(result.ageModifier).toBe(-0.8)
      expect(result.predictedBrix).toBeCloseTo(11.3, 1)  // 11.5 + 0.6 - 0.8 = 11.3
    })

    it('applies negative rootstock modifier', () => {
      // Swingle rootstock (-0.5)
      const result = harvestPredictor.predictBrix(11.5, -0.5, 12, 2000, 2000)

      expect(result.rootstockModifier).toBe(-0.5)
      expect(result.predictedBrix).toBeCloseTo(11.0, 1)  // 11.5 - 0.5 = 11.0
    })

    it('applies timing modifier when off-peak', () => {
      // 150 GDD from peak = full penalty (-1.0)
      const result = harvestPredictor.predictBrix(11.5, 0.6, 12, 2150, 2000)

      expect(result.timingModifier).toBeCloseTo(-1.0, 1)
      expect(result.predictedBrix).toBeCloseTo(11.1, 1)  // 11.5 + 0.6 + 0.0 - 1.0 = 11.1
    })

    it('returns lower confidence when age unknown', () => {
      const result = harvestPredictor.predictBrix(11.5, 0.6, null, 2000, 2000)

      expect(result.confidence).toBe(0.6)  // Lower confidence
      expect(result.ageModifier).toBe(0.0)  // Assumes prime
    })

    it('combines all modifiers correctly', () => {
      // Complex scenario: young tree, low-quality rootstock, off-peak
      // Base 11.5 + Rough Lemon (-0.7) + 3yr (-0.5) + off-peak timing
      const result = harvestPredictor.predictBrix(11.5, -0.7, 3, 2150, 2000)

      expect(result.cultivarBase).toBe(11.5)
      expect(result.rootstockModifier).toBe(-0.7)
      expect(result.ageModifier).toBe(-0.5)
      // Timing: 150 from peak = ~-1.0
      expect(result.predictedBrix).toBeLessThan(10)  // Significantly penalized
    })
  })

  // ==========================================================================
  // SUGAR/ACID ESTIMATION TESTS
  // ==========================================================================
  describe('estimateSugarAcid', () => {
    it('returns low SSC and high TA early in season', () => {
      const result = harvestPredictor.estimateSugarAcid(1000)

      expect(result.ssc).toBeLessThan(8)  // Below SSC_max
      expect(result.ta).toBeGreaterThan(1.5)  // Still acidic
      expect(result.ratio).toBeLessThan(6)  // Low ratio
      expect(result.gdd).toBe(1000)
    })

    it('returns high SSC and low TA at peak', () => {
      const result = harvestPredictor.estimateSugarAcid(3000)

      expect(result.ssc).toBeGreaterThan(10)  // Approaching max
      expect(result.ta).toBeLessThan(1.0)  // Low acid
      expect(result.ratio).toBeGreaterThan(10)  // Good eating ratio
    })

    it('uses default parameters correctly', () => {
      // Default: sscMin=6, sscMax=12, dd50=2050, s=350, ta0=3, ka=0.0005
      const result = harvestPredictor.estimateSugarAcid(2050)

      // At DD50, sigmoid = 0.5, so SSC = 6 + 0.5*6 = 9
      expect(result.ssc).toBeCloseTo(9, 0)
      // TA at 2050 GDD: 3 * exp(-0.0005 * 2050) = 3 * 0.358 = 1.07
      expect(result.ta).toBeCloseTo(1.07, 0)
    })

    it('calculates BrimA flavor index', () => {
      const result = harvestPredictor.estimateSugarAcid(2500)

      // BrimA = SSC - 4 * TA
      const expectedBrimA = result.ssc - 4 * result.ta
      expect(result.brimA).toBeCloseTo(expectedBrimA, 1)
    })

    it('accepts custom parameters', () => {
      const result = harvestPredictor.estimateSugarAcid(2000, {
        sscMin: 5,
        sscMax: 15,
        dd50: 2000,
        s: 400,
        ta0: 2.5,
        ka: 0.0004,
      })

      // At DD50 with custom params, sigmoid = 0.5
      expect(result.ssc).toBeCloseTo(10, 0)  // 5 + 0.5*10 = 10
      expect(result.ta).toBeLessThan(2.5)  // Decayed from initial
    })
  })

  // ==========================================================================
  // HARVEST WINDOW PREDICTION TESTS
  // ==========================================================================
  describe('predictHarvestWindow', () => {
    it('predicts harvest window for citrus', () => {
      const window = harvestPredictor.predictHarvestWindow(
        'navel_orange',
        'indian_river',
        3000,  // Current GDD
        22,    // Avg daily GDD
      )

      expect(window.cropId).toBe('navel_orange')
      expect(window.regionId).toBe('indian_river')
      expect(window.harvestStart).toBeInstanceOf(Date)
      expect(window.harvestEnd).toBeInstanceOf(Date)
      expect(window.optimalStart).toBeInstanceOf(Date)
      expect(window.optimalEnd).toBeInstanceOf(Date)
      expect(window.confidence).toBeGreaterThan(0)
      expect(window.confidence).toBeLessThanOrEqual(1)
    })

    it('returns positive days when before maturity', () => {
      const window = harvestPredictor.predictHarvestWindow(
        'navel_orange',
        'indian_river',
        3000,  // Before maturity (5100)
        22,
      )

      // Days to maturity = (5100 - 3000) / 22 = ~95 days
      const today = new Date()
      const daysToHarvest = Math.round(
        (window.harvestStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysToHarvest).toBeGreaterThan(0)
    })

    it('returns past dates when after maturity', () => {
      const window = harvestPredictor.predictHarvestWindow(
        'navel_orange',
        'indian_river',
        6000,  // After maturity
        22,
      )

      const today = new Date()
      // Harvest start should be in the past
      expect(window.harvestStart.getTime()).toBeLessThan(today.getTime())
    })
  })

  // ==========================================================================
  // HARVEST STATUS TESTS
  // ==========================================================================
  describe('getHarvestStatus', () => {
    it('returns pre_season when harvest start is far away', () => {
      const futureStart = new Date()
      futureStart.setDate(futureStart.getDate() + 60)

      const futureEnd = new Date()
      futureEnd.setDate(futureEnd.getDate() + 90)

      const optimalStart = new Date()
      optimalStart.setDate(optimalStart.getDate() + 70)

      const optimalEnd = new Date()
      optimalEnd.setDate(optimalEnd.getDate() + 80)

      const window = {
        cropId: 'test',
        regionId: 'test',
        year: 2024,
        harvestStart: futureStart,
        harvestEnd: futureEnd,
        optimalStart,
        optimalEnd,
        gddAtHarvestStart: 5000,
        gddAtPeak: 6000,
        confidence: 0.8,
      }

      const status = harvestPredictor.getHarvestStatus(window)
      expect(status.status).toBe('pre_season')
      expect(status.daysUntil).toBeGreaterThan(30)
    })

    it('returns at_peak when within optimal window', () => {
      const today = new Date()

      const pastStart = new Date(today)
      pastStart.setDate(today.getDate() - 10)

      const futureEnd = new Date(today)
      futureEnd.setDate(today.getDate() + 30)

      const optimalStart = new Date(today)
      optimalStart.setDate(today.getDate() - 5)

      const optimalEnd = new Date(today)
      optimalEnd.setDate(today.getDate() + 5)

      const window = {
        cropId: 'test',
        regionId: 'test',
        year: 2024,
        harvestStart: pastStart,
        harvestEnd: futureEnd,
        optimalStart,
        optimalEnd,
        gddAtHarvestStart: 5000,
        gddAtPeak: 6000,
        confidence: 0.8,
      }

      const status = harvestPredictor.getHarvestStatus(window)
      expect(status.status).toBe('at_peak')
      expect(status.message).toBe('At peak quality!')
    })

    it('returns ended when past harvest end', () => {
      const pastStart = new Date()
      pastStart.setDate(pastStart.getDate() - 60)

      const pastEnd = new Date()
      pastEnd.setDate(pastEnd.getDate() - 10)

      const window = {
        cropId: 'test',
        regionId: 'test',
        year: 2024,
        harvestStart: pastStart,
        harvestEnd: pastEnd,
        optimalStart: pastStart,
        optimalEnd: pastEnd,
        gddAtHarvestStart: 5000,
        gddAtPeak: 6000,
        confidence: 0.8,
      }

      const status = harvestPredictor.getHarvestStatus(window)
      expect(status.status).toBe('ended')
      expect(status.message).toBe('Season ended')
    })
  })
})
