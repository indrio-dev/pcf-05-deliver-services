/**
 * GDD Calculator Tests
 *
 * Tests for the Growing Degree Day calculation utilities.
 * GDD is the core mechanism for predicting crop development timing.
 */

import {
  calculateDailyGdd,
  calculateCumulativeGdd,
  calculateProgress,
  estimateDaysToTarget,
  calculateAvgDailyGdd,
  projectGddAccumulation,
  calculateForecastGdd,
  determineHarvestStatus,
  DailyWeather,
  ForecastDay,
} from '@/lib/services/gdd-calculator'

describe('GDD Calculator', () => {
  describe('calculateDailyGdd', () => {
    it('calculates GDD for temperatures above base temp', () => {
      // High: 80F, Low: 60F, Base: 55F
      // Average = 70F, GDD = 70 - 55 = 15
      expect(calculateDailyGdd(80, 60, 55)).toBe(15)
    })

    it('returns 0 when average is below base temp', () => {
      // High: 50F, Low: 40F, Base: 55F
      // Average = 45F, GDD = max(0, 45 - 55) = 0
      expect(calculateDailyGdd(50, 40, 55)).toBe(0)
    })

    it('uses default base temp of 55F', () => {
      // High: 75F, Low: 65F, default base: 55F
      // Average = 70F, GDD = 15
      expect(calculateDailyGdd(75, 65)).toBe(15)
    })

    it('handles edge case when average equals base temp', () => {
      // High: 60F, Low: 50F, Base: 55F
      // Average = 55F, GDD = 0
      expect(calculateDailyGdd(60, 50, 55)).toBe(0)
    })

    it('works with different base temperatures', () => {
      // High: 70F, Low: 50F, Base: 40F (stone fruit)
      // Average = 60F, GDD = 20
      expect(calculateDailyGdd(70, 50, 40)).toBe(20)
    })
  })

  describe('calculateCumulativeGdd', () => {
    const sampleWeather: DailyWeather[] = [
      { date: new Date('2024-04-01'), tempHighF: 80, tempLowF: 60 },
      { date: new Date('2024-04-02'), tempHighF: 75, tempLowF: 55 },
      { date: new Date('2024-04-03'), tempHighF: 85, tempLowF: 65 },
    ]

    it('calculates cumulative GDD from weather array', () => {
      // Day 1: (80+60)/2 - 55 = 15
      // Day 2: (75+55)/2 - 55 = 10
      // Day 3: (85+65)/2 - 55 = 20
      // Total: 45
      expect(calculateCumulativeGdd(sampleWeather, 55)).toBe(45)
    })

    it('returns 0 for empty weather array', () => {
      expect(calculateCumulativeGdd([], 55)).toBe(0)
    })

    it('handles cold days with 0 GDD contribution', () => {
      const coldWeather: DailyWeather[] = [
        { date: new Date('2024-01-01'), tempHighF: 50, tempLowF: 30 },
        { date: new Date('2024-01-02'), tempHighF: 45, tempLowF: 35 },
      ]
      expect(calculateCumulativeGdd(coldWeather, 55)).toBe(0)
    })
  })

  describe('calculateProgress', () => {
    it('calculates percentage progress toward target', () => {
      expect(calculateProgress(500, 1000)).toBe(50)
    })

    it('returns 100 when current exceeds target', () => {
      expect(calculateProgress(1200, 1000)).toBe(100)
    })

    it('returns 0 when no GDD accumulated', () => {
      expect(calculateProgress(0, 1000)).toBe(0)
    })

    it('handles edge case of zero target', () => {
      expect(calculateProgress(500, 0)).toBe(100)
    })
  })

  describe('estimateDaysToTarget', () => {
    it('estimates days to reach GDD target', () => {
      // Need 500 more GDD at 20 GDD/day = 25 days
      expect(estimateDaysToTarget(500, 1000, 20)).toBe(25)
    })

    it('returns 0 when already at or past target', () => {
      expect(estimateDaysToTarget(1000, 1000, 20)).toBe(0)
      expect(estimateDaysToTarget(1100, 1000, 20)).toBe(0)
    })

    it('returns -1 when average is 0 or negative', () => {
      expect(estimateDaysToTarget(500, 1000, 0)).toBe(-1)
    })

    it('rounds up partial days', () => {
      // Need 15 more GDD at 20 GDD/day = 0.75 days -> 1 day
      expect(estimateDaysToTarget(985, 1000, 20)).toBe(1)
    })
  })

  describe('calculateAvgDailyGdd', () => {
    const sampleWeather: DailyWeather[] = [
      { date: new Date('2024-04-01'), tempHighF: 80, tempLowF: 60 }, // 15 GDD
      { date: new Date('2024-04-02'), tempHighF: 75, tempLowF: 55 }, // 10 GDD
      { date: new Date('2024-04-03'), tempHighF: 85, tempLowF: 65 }, // 20 GDD
    ]

    it('calculates average daily GDD', () => {
      // Total 45 GDD / 3 days = 15
      expect(calculateAvgDailyGdd(sampleWeather, 55)).toBe(15)
    })

    it('returns 0 for empty array', () => {
      expect(calculateAvgDailyGdd([], 55)).toBe(0)
    })
  })

  describe('projectGddAccumulation', () => {
    it('projects future GDD accumulation', () => {
      // Current 500 + (20 GDD/day * 10 days) = 700
      expect(projectGddAccumulation(500, 20, 10)).toBe(700)
    })

    it('handles zero projection days', () => {
      expect(projectGddAccumulation(500, 20, 0)).toBe(500)
    })
  })

  describe('calculateForecastGdd', () => {
    const forecast: ForecastDay[] = [
      { date: new Date('2024-04-01'), tempHighF: 80, tempLowF: 60, confidence: 1.0 },
      { date: new Date('2024-04-02'), tempHighF: 75, tempLowF: 55, confidence: 0.8 },
      { date: new Date('2024-04-03'), tempHighF: 85, tempLowF: 65, confidence: 0.6 },
    ]

    it('calculates total and weighted GDD from forecast', () => {
      const result = calculateForecastGdd(forecast, 55)

      // Total: 15 + 10 + 20 = 45
      expect(result.totalGdd).toBe(45)

      // Weighted: 15*1.0 + 10*0.8 + 20*0.6 = 15 + 8 + 12 = 35
      expect(result.weightedGdd).toBe(35)
    })

    it('handles empty forecast', () => {
      const result = calculateForecastGdd([], 55)
      expect(result.totalGdd).toBe(0)
      expect(result.weightedGdd).toBe(0)
    })
  })

  describe('determineHarvestStatus', () => {
    const gddToMaturity = 1000
    const gddToPeak = 1200
    const gddWindow = 400

    it('returns pre_season when well below maturity', () => {
      expect(determineHarvestStatus(500, gddToMaturity, gddToPeak, gddWindow)).toBe('pre_season')
    })

    it('returns approaching when close to maturity', () => {
      expect(determineHarvestStatus(950, gddToMaturity, gddToPeak, gddWindow)).toBe('approaching')
    })

    it('returns in_window early in harvest window', () => {
      expect(determineHarvestStatus(1050, gddToMaturity, gddToPeak, gddWindow)).toBe('in_window')
    })

    it('returns at_peak near peak GDD', () => {
      expect(determineHarvestStatus(1200, gddToMaturity, gddToPeak, gddWindow)).toBe('at_peak')
    })

    it('returns past_peak after peak but before window end', () => {
      expect(determineHarvestStatus(1350, gddToMaturity, gddToPeak, gddWindow)).toBe('past_peak')
    })

    it('returns season_ended after harvest window', () => {
      expect(determineHarvestStatus(1500, gddToMaturity, gddToPeak, gddWindow)).toBe('season_ended')
    })
  })
})
