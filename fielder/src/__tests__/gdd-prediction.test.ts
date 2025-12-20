/**
 * GDD Prediction Engine Tests
 *
 * Tests for the harvest prediction and Brix estimation functions.
 * These are the core algorithms for quality prediction.
 */

import {
  calculateDailyGDD,
  calculateCumulativeGDD,
  estimateAverageGDDPerDay,
  predictHarvestWindow,
  predictBrixFromGDD,
  predictAcidFromGDD,
  calculateBrixAcidRatio,
  calculateBrimA,
  DailyWeather,
} from '@/lib/prediction/gdd'

describe('GDD Prediction Engine', () => {
  describe('calculateDailyGDD', () => {
    it('calculates GDD using standard formula', () => {
      // (80 + 60) / 2 - 55 = 70 - 55 = 15
      expect(calculateDailyGDD(80, 60, 55)).toBe(15)
    })

    it('uses default base temp of 55F', () => {
      expect(calculateDailyGDD(80, 60)).toBe(15)
    })

    it('returns 0 for cold days', () => {
      expect(calculateDailyGDD(50, 40, 55)).toBe(0)
    })
  })

  describe('calculateCumulativeGDD', () => {
    it('accumulates GDD from bloom date forward', () => {
      const weather: DailyWeather[] = [
        { date: '2024-03-01', tempMaxF: 80, tempMinF: 60 },  // 15 GDD
        { date: '2024-03-02', tempMaxF: 75, tempMinF: 55 },  // 10 GDD
        { date: '2024-03-03', tempMaxF: 85, tempMinF: 65 },  // 20 GDD
      ]
      const bloomDate = new Date('2024-03-01')

      const results = calculateCumulativeGDD(weather, bloomDate, 55)

      expect(results.length).toBe(3)
      expect(results[0].dailyGDD).toBe(15)
      expect(results[0].cumulativeGDD).toBe(15)
      expect(results[2].cumulativeGDD).toBe(45)  // 15 + 10 + 20
    })

    it('filters data before bloom date', () => {
      const weather: DailyWeather[] = [
        { date: '2024-02-28', tempMaxF: 80, tempMinF: 60 },  // Before bloom
        { date: '2024-03-01', tempMaxF: 80, tempMinF: 60 },  // Bloom day
        { date: '2024-03-02', tempMaxF: 80, tempMinF: 60 },
      ]
      const bloomDate = new Date('2024-03-01')

      const results = calculateCumulativeGDD(weather, bloomDate, 55)

      expect(results.length).toBe(2)  // Only 2 days from bloom
    })

    it('calculates days from bloom correctly', () => {
      const weather: DailyWeather[] = [
        { date: '2024-03-01', tempMaxF: 80, tempMinF: 60 },
        { date: '2024-03-03', tempMaxF: 80, tempMinF: 60 },  // 2 days later
      ]
      const bloomDate = new Date('2024-03-01')

      const results = calculateCumulativeGDD(weather, bloomDate, 55)

      expect(results[0].daysFromBloom).toBe(0)
      expect(results[1].daysFromBloom).toBe(2)
    })
  })

  describe('estimateAverageGDDPerDay', () => {
    it('returns regional estimate for florida in summer', () => {
      const estimate = estimateAverageGDDPerDay('florida', 7)  // July
      expect(estimate).toBe(26)
    })

    it('returns regional estimate for washington in spring', () => {
      const estimate = estimateAverageGDDPerDay('washington', 4)  // April
      expect(estimate).toBe(12)
    })

    it('returns default estimate for unknown region', () => {
      const estimate = estimateAverageGDDPerDay('unknown_region', 6)  // June
      expect(estimate).toBe(24)  // Default June value
    })
  })

  describe('predictHarvestWindow', () => {
    const bloomDate = new Date('2024-03-01')
    const gddToMaturity = 1000
    const gddToPeak = 1200
    const gddWindow = 400
    const avgGDDPerDay = 20

    it('returns pre_season status when early in season', () => {
      const result = predictHarvestWindow(
        bloomDate, 500, gddToMaturity, gddToPeak, gddWindow, avgGDDPerDay
      )

      expect(result.status).toBe('pre_season')
      expect(result.percentToMaturity).toBe(50)
    })

    it('returns approaching status near maturity', () => {
      const result = predictHarvestWindow(
        bloomDate, 900, gddToMaturity, gddToPeak, gddWindow, avgGDDPerDay
      )

      expect(result.status).toBe('approaching')
    })

    it('returns peak status at peak GDD', () => {
      const result = predictHarvestWindow(
        bloomDate, 1200, gddToMaturity, gddToPeak, gddWindow, avgGDDPerDay
      )

      expect(result.status).toBe('peak')
    })

    it('returns post_season when past window', () => {
      const result = predictHarvestWindow(
        bloomDate, 1500, gddToMaturity, gddToPeak, gddWindow, avgGDDPerDay
      )

      expect(result.status).toBe('post_season')
    })

    it('calculates days to harvest correctly', () => {
      const result = predictHarvestWindow(
        bloomDate, 500, gddToMaturity, gddToPeak, gddWindow, avgGDDPerDay
      )

      // Need 500 more GDD at 20/day = 25 days
      expect(result.daysToHarvest).toBe(25)
    })

    it('returns null for daysToHarvest when past maturity', () => {
      const result = predictHarvestWindow(
        bloomDate, 1100, gddToMaturity, gddToPeak, gddWindow, avgGDDPerDay
      )

      expect(result.daysToHarvest).toBeNull()
    })
  })

  describe('predictBrixFromGDD', () => {
    const gddToMaturity = 1000
    const gddToPeak = 1200
    const brixMin = 8
    const brixMax = 14

    it('predicts low Brix early in season', () => {
      const result = predictBrixFromGDD(500, gddToMaturity, gddToPeak, brixMin, brixMax)

      expect(result.predictedBrix).toBeLessThan(10)
      expect(result.confidence).toBe(0.5)
    })

    it('predicts higher Brix near peak', () => {
      const result = predictBrixFromGDD(1200, gddToMaturity, gddToPeak, brixMin, brixMax)

      expect(result.predictedBrix).toBeGreaterThan(12)
      expect(result.confidence).toBe(0.75)  // Post-peak confidence
    })

    it('predicts mid-range Brix at maturity', () => {
      const result = predictBrixFromGDD(1000, gddToMaturity, gddToPeak, brixMin, brixMax)

      // At maturity GDD (DD50), sigmoid = 0.5, so Brix = min + 0.5 * range
      expect(result.predictedBrix).toBeCloseTo(11, 0)
      expect(result.confidence).toBe(0.85)
    })
  })

  describe('predictAcidFromGDD', () => {
    it('predicts initial acid at start', () => {
      const acid = predictAcidFromGDD(0, 2.0, 0.0003)
      expect(acid).toBe(2.0)
    })

    it('predicts declining acid with GDD accumulation', () => {
      const acidAt500 = predictAcidFromGDD(500, 2.0, 0.0003)
      const acidAt1000 = predictAcidFromGDD(1000, 2.0, 0.0003)

      expect(acidAt500).toBeLessThan(2.0)
      expect(acidAt1000).toBeLessThan(acidAt500)
    })

    it('uses default parameters', () => {
      const acid = predictAcidFromGDD(1000)
      expect(acid).toBeLessThan(2.0)
    })
  })

  describe('calculateBrixAcidRatio', () => {
    it('calculates ratio correctly', () => {
      expect(calculateBrixAcidRatio(12, 1.0)).toBe(12)
    })

    it('handles decimal values', () => {
      expect(calculateBrixAcidRatio(11.5, 0.8)).toBe(14.4)  // 11.5/0.8 = 14.375 -> 14.4
    })

    it('returns 0 for zero acid to avoid division error', () => {
      expect(calculateBrixAcidRatio(12, 0)).toBe(0)
    })
  })

  describe('calculateBrimA', () => {
    it('calculates BrimA flavor index', () => {
      // BrimA = Brix - (4 * TA)
      // 12 - (4 * 1.0) = 8
      expect(calculateBrimA(12, 1.0)).toBe(8)
    })

    it('handles low acid values', () => {
      // 14 - (4 * 0.5) = 12
      expect(calculateBrimA(14, 0.5)).toBe(12)
    })

    it('can return negative for very acidic fruit', () => {
      // 8 - (4 * 3.0) = -4
      expect(calculateBrimA(8, 3.0)).toBe(-4)
    })
  })
})
