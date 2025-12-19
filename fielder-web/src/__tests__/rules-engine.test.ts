/**
 * SHARE Rules Engine Tests
 *
 * F013: Comprehensive tests for the deterministic rules engine.
 */

import {
  getAgeModifier,
  calculateAgeModifier,
  getTimingModifier,
  calculateTimingModifier,
  getRootstockModifierSync,
  getCultivarBaseBrixSync,
  calculateSugar,
  calculateAcid,
  calculateRatio,
  calculateBrimA,
  estimateSugarAcid,
  calculateBrixComponentsSync,
  isValidBrix,
  isTypicalBrix,
  clampBrix,
  BRIX_CONSTRAINTS,
  DEFAULT_SUGAR_PARAMS,
  DEFAULT_ACID_PARAMS,
} from '@/lib/intelligence/rules-engine'

describe('SHARE Rules Engine (F013)', () => {
  // ===========================================================================
  // AGE MODIFIER RULES
  // ===========================================================================
  describe('Age Modifier Rules', () => {
    describe('getAgeModifier (with phase info)', () => {
      it('returns juvenile phase for ages 0-2', () => {
        const result = getAgeModifier(1)
        expect(result.modifier).toBe(-0.8)
        expect(result.phase).toBe('juvenile')
      })

      it('returns transition phase for ages 3-4', () => {
        const result = getAgeModifier(4)
        expect(result.modifier).toBe(-0.5)
        expect(result.phase).toBe('transition')
      })

      it('returns developing phase for ages 5-7', () => {
        const result = getAgeModifier(6)
        expect(result.modifier).toBe(-0.2)
        expect(result.phase).toBe('developing')
      })

      it('returns prime phase for ages 8-18', () => {
        const result = getAgeModifier(12)
        expect(result.modifier).toBe(0.0)
        expect(result.phase).toBe('prime')
      })

      it('returns mature phase for ages 19-25', () => {
        const result = getAgeModifier(22)
        expect(result.modifier).toBe(-0.2)
        expect(result.phase).toBe('mature')
      })

      it('returns declining phase for ages >25', () => {
        const result = getAgeModifier(30)
        expect(result.modifier).toBe(-0.3)
        expect(result.phase).toBe('declining')
      })

      it('assumes prime for null age', () => {
        const result = getAgeModifier(null)
        expect(result.modifier).toBe(0.0)
        expect(result.phase).toBe('prime')
      })

      it('assumes prime for undefined age', () => {
        const result = getAgeModifier(undefined)
        expect(result.modifier).toBe(0.0)
      })

      it('handles negative age gracefully', () => {
        const result = getAgeModifier(-5)
        expect(result.modifier).toBe(0.0)
      })
    })

    describe('calculateAgeModifier (simple)', () => {
      it.each([
        [0, -0.8],
        [2, -0.8],
        [3, -0.5],
        [4, -0.5],
        [5, -0.2],
        [7, -0.2],
        [8, 0.0],
        [12, 0.0],
        [18, 0.0],
        [19, -0.2],
        [25, -0.2],
        [26, -0.3],
        [50, -0.3],
      ])('age %d returns modifier %d', (age, expected) => {
        expect(calculateAgeModifier(age)).toBe(expected)
      })
    })
  })

  // ===========================================================================
  // TIMING MODIFIER RULES
  // ===========================================================================
  describe('Timing Modifier Rules', () => {
    const peakGdd = 6100
    const halfwidth = 1000

    describe('getTimingModifier (with zone info)', () => {
      it('returns peak zone when at peak GDD', () => {
        const result = getTimingModifier(6100, 6100, halfwidth)
        expect(result.modifier).toBe(0.0)
        expect(result.zone).toBe('peak')
      })

      it('returns peak zone within 25% of halfwidth', () => {
        const result = getTimingModifier(6200, 6100, halfwidth) // 100 from peak, 10% of halfwidth
        expect(result.modifier).toBe(0.0)
        expect(result.zone).toBe('peak')
      })

      it('returns optimal zone within 50% of halfwidth', () => {
        const result = getTimingModifier(6400, 6100, halfwidth) // 300 from peak, 30% of halfwidth
        expect(result.modifier).toBe(0.0)
        expect(result.zone).toBe('optimal')
      })

      it('returns acceptable zone within halfwidth', () => {
        const result = getTimingModifier(6800, 6100, halfwidth) // 700 from peak, 70% of halfwidth
        expect(result.modifier).toBeLessThan(0)
        expect(result.zone).toBe('acceptable')
      })

      it('returns suboptimal zone beyond halfwidth', () => {
        const result = getTimingModifier(7500, 6100, halfwidth) // 1400 from peak, 140% of halfwidth
        expect(result.modifier).toBeLessThan(0)
        expect(result.zone).toBe('suboptimal')
      })

      it('applies parabolic penalty correctly', () => {
        // At d = h (1000 from peak), penalty = 1.0 * (1000/1000)^2 = 1.0
        const result = getTimingModifier(7100, 6100, 1000, 1.0)
        expect(result.modifier).toBe(-1.0)
      })
    })

    describe('calculateTimingModifier (simple)', () => {
      it('returns 0 at peak', () => {
        expect(calculateTimingModifier(6100, 6100)).toBe(0)
      })

      it('returns negative penalty away from peak', () => {
        const modifier = calculateTimingModifier(7000, 6100, 500, 1.0)
        expect(modifier).toBeLessThan(0)
      })

      it('caps penalty at 1.5x max', () => {
        // Very far from peak
        const modifier = calculateTimingModifier(10000, 6100, 500, 1.0)
        expect(modifier).toBeGreaterThanOrEqual(-1.5)
      })
    })
  })

  // ===========================================================================
  // ROOTSTOCK MODIFIER RULES
  // ===========================================================================
  describe('Rootstock Modifier Rules', () => {
    describe('getRootstockModifierSync', () => {
      it('returns correct modifier for high-quality rootstocks', () => {
        expect(getRootstockModifierSync('carrizo')).toBe(0.6)
        expect(getRootstockModifierSync('c35')).toBe(0.6)
        expect(getRootstockModifierSync('sour_orange')).toBe(0.5)
      })

      it('returns correct modifier for neutral rootstocks', () => {
        expect(getRootstockModifierSync('cleopatra')).toBe(0.2)
      })

      it('returns correct modifier for low-quality rootstocks', () => {
        expect(getRootstockModifierSync('swingle')).toBe(-0.5)
        expect(getRootstockModifierSync('rough_lemon')).toBe(-0.7)
        expect(getRootstockModifierSync('macrophylla')).toBe(-0.8)
      })

      it('returns 0 for unknown rootstock', () => {
        expect(getRootstockModifierSync('unknown')).toBe(0)
      })

      it('returns 0 for undefined', () => {
        expect(getRootstockModifierSync(undefined)).toBe(0)
      })
    })
  })

  // ===========================================================================
  // CULTIVAR BASE BRIX RULES
  // ===========================================================================
  describe('Cultivar Base Brix Rules', () => {
    describe('getCultivarBaseBrixSync', () => {
      it('returns correct base Brix for known cultivars', () => {
        expect(getCultivarBaseBrixSync('washington_navel')).toBe(11.5)
        expect(getCultivarBaseBrixSync('cara_cara')).toBe(12.0)
        expect(getCultivarBaseBrixSync('honeycrisp')).toBe(13.0)
        expect(getCultivarBaseBrixSync('georgia_belle')).toBe(14.0)
      })

      it('returns default 10.0 for unknown cultivar', () => {
        expect(getCultivarBaseBrixSync('unknown_cultivar')).toBe(10.0)
      })
    })
  })

  // ===========================================================================
  // SUGAR/ACID CURVE RULES
  // ===========================================================================
  describe('Sugar/Acid Curve Rules', () => {
    describe('calculateSugar', () => {
      it('returns minimum SSC at 0 GDD', () => {
        const ssc = calculateSugar(0)
        expect(ssc).toBeCloseTo(DEFAULT_SUGAR_PARAMS.sscMin, 0)
      })

      it('returns 50% SSC at DD50', () => {
        const expected = (DEFAULT_SUGAR_PARAMS.sscMin + DEFAULT_SUGAR_PARAMS.sscMax) / 2
        const ssc = calculateSugar(DEFAULT_SUGAR_PARAMS.dd50)
        expect(ssc).toBeCloseTo(expected, 0)
      })

      it('approaches maximum SSC at high GDD', () => {
        const ssc = calculateSugar(10000)
        expect(ssc).toBeCloseTo(DEFAULT_SUGAR_PARAMS.sscMax, 0)
      })

      it('accepts custom parameters', () => {
        const ssc = calculateSugar(1000, { sscMin: 8, sscMax: 14, dd50: 1000, steepness: 200 })
        expect(ssc).toBeCloseTo(11, 0) // Midpoint at dd50
      })
    })

    describe('calculateAcid', () => {
      it('returns initial TA at 0 GDD', () => {
        const ta = calculateAcid(0)
        expect(ta).toBe(DEFAULT_ACID_PARAMS.ta0)
      })

      it('decreases exponentially with GDD', () => {
        const ta1000 = calculateAcid(1000)
        const ta2000 = calculateAcid(2000)
        expect(ta1000).toBeLessThan(DEFAULT_ACID_PARAMS.ta0)
        expect(ta2000).toBeLessThan(ta1000)
      })

      it('approaches 0 at high GDD', () => {
        const ta = calculateAcid(10000)
        expect(ta).toBeLessThan(0.5)
      })
    })

    describe('calculateRatio', () => {
      it('calculates SSC/TA ratio', () => {
        expect(calculateRatio(12, 1)).toBe(12)
        expect(calculateRatio(10, 2)).toBe(5)
      })

      it('returns 0 for zero TA', () => {
        expect(calculateRatio(12, 0)).toBe(0)
      })
    })

    describe('calculateBrimA', () => {
      it('calculates flavor index: SSC - 4*TA', () => {
        expect(calculateBrimA(12, 1)).toBe(8) // 12 - 4*1 = 8
        expect(calculateBrimA(10, 2)).toBe(2) // 10 - 4*2 = 2
      })

      it('can be negative for high acid fruit', () => {
        expect(calculateBrimA(6, 2)).toBe(-2) // 6 - 4*2 = -2
      })
    })

    describe('estimateSugarAcid', () => {
      it('returns complete profile at given GDD', () => {
        const result = estimateSugarAcid(5000)

        expect(result.ssc).toBeGreaterThan(DEFAULT_SUGAR_PARAMS.sscMin)
        expect(result.ta).toBeLessThan(DEFAULT_ACID_PARAMS.ta0)
        expect(result.ratio).toBeGreaterThan(0)
        expect(result.brimA).toBeDefined()
        expect(result.gdd).toBe(5000)
      })

      it('shows progression over season', () => {
        const early = estimateSugarAcid(1000)
        const mid = estimateSugarAcid(3000)
        const late = estimateSugarAcid(5000)

        // Sugar increases
        expect(late.ssc).toBeGreaterThan(mid.ssc)
        expect(mid.ssc).toBeGreaterThan(early.ssc)

        // Acid decreases
        expect(late.ta).toBeLessThan(mid.ta)
        expect(mid.ta).toBeLessThan(early.ta)

        // Ratio increases
        expect(late.ratio).toBeGreaterThan(mid.ratio)
      })
    })
  })

  // ===========================================================================
  // COMPLETE BRIX CALCULATION
  // ===========================================================================
  describe('Complete Brix Calculation', () => {
    describe('calculateBrixComponentsSync', () => {
      it('calculates all components correctly', () => {
        const result = calculateBrixComponentsSync(
          'washington_navel', // base 11.5
          'carrizo',          // modifier +0.6
          12,                 // prime age, modifier 0.0
          6100,               // at peak GDD
          6100,               // peak GDD
          1000
        )

        expect(result.cultivarBase).toBe(11.5)
        expect(result.rootstockModifier).toBe(0.6)
        expect(result.ageModifier).toBe(0.0)
        expect(result.timingModifier).toBe(0.0)
        expect(result.total).toBe(12.1)
      })

      it('applies all modifiers cumulatively', () => {
        const result = calculateBrixComponentsSync(
          'cara_cara',   // base 12.0
          'swingle',     // modifier -0.5
          3,             // transition age, modifier -0.5
          5000,          // away from peak
          6100,
          500
        )

        expect(result.cultivarBase).toBe(12.0)
        expect(result.rootstockModifier).toBe(-0.5)
        expect(result.ageModifier).toBe(-0.5)
        expect(result.timingModifier).toBeLessThan(0)
        expect(result.total).toBeLessThan(11.0)
      })

      it('handles unknown cultivar with default', () => {
        const result = calculateBrixComponentsSync(
          'unknown',
          undefined,
          null,
          6100,
          6100,
          1000
        )

        expect(result.cultivarBase).toBe(10.0) // default
        expect(result.rootstockModifier).toBe(0.0) // no rootstock
        expect(result.ageModifier).toBe(0.0) // unknown age = prime
        expect(result.total).toBe(10.0)
      })
    })
  })

  // ===========================================================================
  // VALIDATION RULES
  // ===========================================================================
  describe('Validation Rules', () => {
    describe('isValidBrix', () => {
      it('accepts values within physical range', () => {
        expect(isValidBrix(0)).toBe(true)
        expect(isValidBrix(15)).toBe(true)
        expect(isValidBrix(30)).toBe(true)
      })

      it('rejects values outside physical range', () => {
        expect(isValidBrix(-1)).toBe(false)
        expect(isValidBrix(31)).toBe(false)
      })
    })

    describe('isTypicalBrix', () => {
      it('accepts values within typical range', () => {
        expect(isTypicalBrix(6)).toBe(true)
        expect(isTypicalBrix(12)).toBe(true)
        expect(isTypicalBrix(18)).toBe(true)
      })

      it('rejects values outside typical range', () => {
        expect(isTypicalBrix(5)).toBe(false)
        expect(isTypicalBrix(19)).toBe(false)
      })
    })

    describe('clampBrix', () => {
      it('returns value within valid range', () => {
        expect(clampBrix(15)).toBe(15)
      })

      it('clamps to minimum', () => {
        expect(clampBrix(-5)).toBe(BRIX_CONSTRAINTS.min)
      })

      it('clamps to maximum', () => {
        expect(clampBrix(50)).toBe(BRIX_CONSTRAINTS.max)
      })
    })
  })

  // ===========================================================================
  // INTEGRATION SCENARIOS
  // ===========================================================================
  describe('Integration Scenarios', () => {
    it('predicts premium Washington Navel on Carrizo at peak', () => {
      const result = calculateBrixComponentsSync(
        'washington_navel',
        'carrizo',
        12,     // prime
        6100,   // at peak
        6100,
        1000
      )

      // Premium Washington Navel on Carrizo should hit 12+ Brix
      expect(result.total).toBeGreaterThanOrEqual(12)
    })

    it('predicts lower quality with commodity rootstock', () => {
      const premium = calculateBrixComponentsSync('washington_navel', 'carrizo', 12, 6100, 6100, 1000)
      const commodity = calculateBrixComponentsSync('washington_navel', 'rough_lemon', 12, 6100, 6100, 1000)

      // Rough lemon should produce lower Brix
      expect(commodity.total).toBeLessThan(premium.total)
      expect(premium.total - commodity.total).toBeCloseTo(1.3, 1) // 0.6 - (-0.7) = 1.3
    })

    it('predicts declining quality in old trees', () => {
      const prime = calculateBrixComponentsSync('honeycrisp', 'lovell', 12, 2500, 2500, 100)
      const old = calculateBrixComponentsSync('honeycrisp', 'lovell', 30, 2500, 2500, 100)

      expect(old.total).toBeLessThan(prime.total)
    })

    it('predicts timing penalty for early harvest', () => {
      const atPeak = calculateBrixComponentsSync('elberta', 'lovell', 10, 2000, 2000, 75)
      const early = calculateBrixComponentsSync('elberta', 'lovell', 10, 1800, 2000, 75)

      expect(early.total).toBeLessThan(atPeak.total)
      expect(early.timingModifier).toBeLessThan(0)
    })
  })
})
