/**
 * Claim Inference Engine Tests
 *
 * F014: Tests for PLU inference, beef profile detection, and omega validation.
 */

import {
  inferFromPLU,
  isGMORiskCrop,
  inferBeefProfile,
  checkOrganicBeefWarning,
  validateOmegaClaim,
  type BeefProfile,
} from '@/lib/intelligence/claim-inference'

// =============================================================================
// PLU CODE INFERENCE TESTS
// =============================================================================

describe('PLU Code Inference', () => {
  describe('inferFromPLU()', () => {
    // Organic PLU codes (prefix 9, 5 digits)
    describe('Organic PLU codes (9xxxx)', () => {
      it('identifies organic from 5-digit code starting with 9', () => {
        const result = inferFromPLU('94011')
        expect(result.isOrganic).toBe(true)
        expect(result.isGMO).toBe('no')
        expect(result.confidence).toBe('high')
      })

      it('returns correct PLU code in result', () => {
        const result = inferFromPLU('94225')
        expect(result.pluCode).toBe('94225')
      })

      it('handles various organic codes', () => {
        const organicCodes = ['94011', '94225', '94065', '94430']
        for (const code of organicCodes) {
          const result = inferFromPLU(code)
          expect(result.isOrganic).toBe(true)
          expect(result.isGMO).toBe('no')
        }
      })

      it('organic implies non-GMO by USDA regulation', () => {
        const result = inferFromPLU('94011')
        expect(result.reasoning).toContain('non-GMO')
      })
    })

    // GMO PLU codes (prefix 8, 5 digits)
    describe('GMO PLU codes (8xxxx)', () => {
      it('identifies possible GMO from prefix 8', () => {
        const result = inferFromPLU('84011')
        expect(result.isOrganic).toBe(false)
        expect(result.isGMO).toBe('possible')
        expect(result.confidence).toBe('medium')
      })

      it('notes prefix 8 is rarely used in practice', () => {
        const result = inferFromPLU('84011')
        expect(result.reasoning).toContain('rarely used')
      })
    })

    // Conventional PLU codes (4 digits)
    describe('Conventional PLU codes (4-digit)', () => {
      it('identifies conventional from 4-digit code', () => {
        const result = inferFromPLU('4011')
        expect(result.isOrganic).toBe(false)
        expect(result.isGMO).toBe('unknown')
        expect(result.confidence).toBe('medium')
      })

      it('handles codes starting with 3', () => {
        const result = inferFromPLU('3283')
        expect(result.isOrganic).toBe(false)
        expect(result.confidence).toBe('medium')
      })

      it('handles codes starting with 4', () => {
        const result = inferFromPLU('4065')
        expect(result.isOrganic).toBe(false)
        expect(result.confidence).toBe('medium')
      })

      it('notes GMO status depends on crop type', () => {
        const result = inferFromPLU('4011')
        expect(result.reasoning).toContain('depends on crop')
      })
    })

    // Edge cases
    describe('Edge cases', () => {
      it('handles empty string', () => {
        const result = inferFromPLU('')
        expect(result.isOrganic).toBe(false)
        expect(result.isGMO).toBe('unknown')
        expect(result.confidence).toBe('low')
      })

      it('handles undefined', () => {
        const result = inferFromPLU(undefined)
        expect(result.isOrganic).toBe(false)
        expect(result.confidence).toBe('low')
      })

      it('handles whitespace', () => {
        const result = inferFromPLU('  ')
        expect(result.confidence).toBe('low')
      })

      it('trims whitespace from valid codes', () => {
        const result = inferFromPLU('  94011  ')
        expect(result.pluCode).toBe('94011')
        expect(result.isOrganic).toBe(true)
      })

      it('handles non-standard length codes', () => {
        const result = inferFromPLU('123456')
        expect(result.confidence).toBe('low')
        expect(result.reasoning).toContain('non-standard')
      })

      it('handles 3-digit codes as non-standard', () => {
        const result = inferFromPLU('401')
        expect(result.confidence).toBe('low')
      })
    })
  })

  describe('isGMORiskCrop()', () => {
    it('identifies corn as GMO risk', () => {
      expect(isGMORiskCrop('corn')).toBe(true)
    })

    it('identifies soy/soybean as GMO risk', () => {
      expect(isGMORiskCrop('soy')).toBe(true)
      expect(isGMORiskCrop('soybean')).toBe(true)
    })

    it('identifies canola as GMO risk', () => {
      expect(isGMORiskCrop('canola')).toBe(true)
    })

    it('identifies cotton/cottonseed as GMO risk', () => {
      expect(isGMORiskCrop('cotton')).toBe(true)
      expect(isGMORiskCrop('cottonseed')).toBe(true)
    })

    it('identifies sugar_beet as GMO risk', () => {
      expect(isGMORiskCrop('sugar_beet')).toBe(true)
    })

    it('identifies papaya as GMO risk', () => {
      expect(isGMORiskCrop('papaya')).toBe(true)
    })

    it('identifies squash/zucchini as GMO risk', () => {
      expect(isGMORiskCrop('squash')).toBe(true)
      expect(isGMORiskCrop('zucchini')).toBe(true)
    })

    it('identifies apple as GMO risk (Arctic brand)', () => {
      expect(isGMORiskCrop('apple')).toBe(true)
    })

    it('identifies potato as GMO risk (Innate brand)', () => {
      expect(isGMORiskCrop('potato')).toBe(true)
    })

    it('returns false for non-GMO crops', () => {
      expect(isGMORiskCrop('orange')).toBe(false)
      expect(isGMORiskCrop('strawberry')).toBe(false)
      expect(isGMORiskCrop('peach')).toBe(false)
      expect(isGMORiskCrop('grape')).toBe(false)
    })

    it('is case-insensitive', () => {
      expect(isGMORiskCrop('CORN')).toBe(true)
      expect(isGMORiskCrop('Soy')).toBe(true)
      expect(isGMORiskCrop('CANOLA')).toBe(true)
    })
  })
})

// =============================================================================
// BEEF PROFILE INFERENCE TESTS
// =============================================================================

describe('Beef Profile Inference', () => {
  describe('inferBeefProfile()', () => {
    // Profile A: True Grass-Fed
    describe('Profile A: True Grass-Fed', () => {
      it('assigns A_TRUE_GRASS for "100% grass-fed"', () => {
        const result = inferBeefProfile(['100% grass-fed'])
        expect(result.profile).toBe('A_TRUE_GRASS')
        expect(result.isCAFO).toBe(false)
        expect(result.tier).toBe('premium')
      })

      it('assigns A_TRUE_GRASS for "grass-finished"', () => {
        const result = inferBeefProfile(['grass-fed', 'grass-finished'])
        expect(result.profile).toBe('A_TRUE_GRASS')
        expect(result.isCAFO).toBe(false)
      })

      it('assigns A_TRUE_GRASS for "pasture-finished"', () => {
        const result = inferBeefProfile(['pasture finished'])
        expect(result.profile).toBe('A_TRUE_GRASS')
        expect(result.isCAFO).toBe(false)
      })

      it('expects omega ratio 2-3:1 for true grass-fed', () => {
        const result = inferBeefProfile(['100% grass-fed'])
        expect(result.expectedOmegaRatio).toBe('2-3:1')
      })

      it('has high confidence for clear claims', () => {
        const result = inferBeefProfile(['100% grass-fed', 'grass-finished'])
        expect(result.confidence).toBeGreaterThanOrEqual(0.9)
      })
    })

    // Profile B: True Pasture-Raised
    describe('Profile B: True Pasture-Raised', () => {
      it('assigns B_TRUE_PASTURE for CAFO exclusion without grass-finished', () => {
        const result = inferBeefProfile(['no feedlot', 'pasture-raised'])
        expect(result.profile).toBe('B_TRUE_PASTURE')
        expect(result.isCAFO).toBe(false)
        expect(result.tier).toBe('premium')
      })

      it('assigns B_TRUE_PASTURE for "no CAFO"', () => {
        const result = inferBeefProfile(['no cafo', 'humanely raised'])
        expect(result.profile).toBe('B_TRUE_PASTURE')
      })

      it('assigns B_TRUE_PASTURE for "never confined"', () => {
        const result = inferBeefProfile(['never confined'])
        expect(result.profile).toBe('B_TRUE_PASTURE')
      })

      it('expects omega ratio 4-6:1 for true pasture', () => {
        const result = inferBeefProfile(['no feedlot'])
        expect(result.expectedOmegaRatio).toBe('4-6:1')
      })
    })

    // Profile C: Marketing Grass-Fed
    describe('Profile C: Marketing Grass-Fed', () => {
      it('assigns C_MARKETING_GRASS for "grass-fed" only', () => {
        const result = inferBeefProfile(['grass-fed'])
        expect(result.profile).toBe('C_MARKETING_GRASS')
        expect(result.isCAFO).toBe(true)
        expect(result.tier).toBe('standard')
      })

      it('assigns C_MARKETING_GRASS for "grassfed" (no hyphen)', () => {
        const result = inferBeefProfile(['grassfed'])
        expect(result.profile).toBe('C_MARKETING_GRASS')
      })

      it('warns about likely grain-finishing', () => {
        const result = inferBeefProfile(['grass-fed'])
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings[0]).toContain('grain-finished')
      })

      it('expects omega ratio 8-15:1 for marketing grass', () => {
        const result = inferBeefProfile(['grass-fed'])
        expect(result.expectedOmegaRatio).toBe('8-15:1')
      })
    })

    // Profile D: Marketing Pasture-Raised
    describe('Profile D: Marketing Pasture-Raised', () => {
      it('assigns D_MARKETING_PASTURE for "pasture-raised" only', () => {
        const result = inferBeefProfile(['pasture-raised'])
        expect(result.profile).toBe('D_MARKETING_PASTURE')
        expect(result.isCAFO).toBe(true)
      })

      it('assigns D_MARKETING_PASTURE for "pastured"', () => {
        const result = inferBeefProfile(['pastured'])
        expect(result.profile).toBe('D_MARKETING_PASTURE')
      })

      it('warns about likely feedlot finishing', () => {
        const result = inferBeefProfile(['pasture-raised'])
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings[0]).toContain('feedlot')
      })

      it('expects omega ratio 12-18:1', () => {
        const result = inferBeefProfile(['pasture-raised'])
        expect(result.expectedOmegaRatio).toBe('12-18:1')
      })
    })

    // Profile E: Commodity
    describe('Profile E: Commodity', () => {
      it('assigns E_COMMODITY for empty claims', () => {
        const result = inferBeefProfile([])
        expect(result.profile).toBe('E_COMMODITY')
        expect(result.isCAFO).toBe(true)
        expect(result.tier).toBe('commodity')
      })

      it('assigns E_COMMODITY for unrecognized claims', () => {
        const result = inferBeefProfile(['fresh', 'premium'])
        expect(result.profile).toBe('E_COMMODITY')
      })

      it('expects omega ratio 15-20:1', () => {
        const result = inferBeefProfile([])
        expect(result.expectedOmegaRatio).toBe('15-20:1')
      })
    })

    // Profile E2: "Natural" Marketing
    describe('Profile E2: Natural Marketing', () => {
      it('assigns E2_NATURAL for "natural"', () => {
        const result = inferBeefProfile(['natural'])
        expect(result.profile).toBe('E2_NATURAL')
        expect(result.isCAFO).toBe(true)
        expect(result.tier).toBe('commodity')
      })

      it('assigns E2_NATURAL for "no antibiotics"', () => {
        const result = inferBeefProfile(['no antibiotics'])
        expect(result.profile).toBe('E2_NATURAL')
      })

      it('assigns E2_NATURAL for "no hormones"', () => {
        const result = inferBeefProfile(['no hormones'])
        expect(result.profile).toBe('E2_NATURAL')
      })

      it('assigns E2_NATURAL for "hormone free"', () => {
        const result = inferBeefProfile(['hormone free'])
        expect(result.profile).toBe('E2_NATURAL')
      })

      it('assigns E2_NATURAL for "antibiotic free"', () => {
        const result = inferBeefProfile(['antibiotic free'])
        expect(result.profile).toBe('E2_NATURAL')
      })

      it('assigns E2_NATURAL for "no mRNA"', () => {
        const result = inferBeefProfile(['no mrna'])
        expect(result.profile).toBe('E2_NATURAL')
      })

      it('warns that "Natural" is just marketing', () => {
        const result = inferBeefProfile(['natural'])
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings[0]).toContain('marketing')
      })

      it('has same omega as commodity (15-20:1)', () => {
        const result = inferBeefProfile(['natural'])
        expect(result.expectedOmegaRatio).toBe('15-20:1')
      })
    })

    // Profile F: Premium CAFO
    describe('Profile F: Premium CAFO', () => {
      it('assigns F_PREMIUM_CAFO for Wagyu without process claims', () => {
        const result = inferBeefProfile(['wagyu'])
        expect(result.profile).toBe('F_PREMIUM_CAFO')
        expect(result.isCAFO).toBe(true)
        expect(result.tier).toBe('worst')
      })

      it('assigns F_PREMIUM_CAFO for Prime without process claims', () => {
        const result = inferBeefProfile(['prime'])
        expect(result.profile).toBe('F_PREMIUM_CAFO')
      })

      it('assigns F_PREMIUM_CAFO for Angus without process claims', () => {
        const result = inferBeefProfile(['angus'])
        expect(result.profile).toBe('F_PREMIUM_CAFO')
      })

      it('assigns F_PREMIUM_CAFO for American Wagyu', () => {
        const result = inferBeefProfile(['american wagyu'])
        expect(result.profile).toBe('F_PREMIUM_CAFO')
      })

      it('warns about extended CAFO (worst omega)', () => {
        const result = inferBeefProfile(['wagyu'])
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings[0]).toContain('worst omega')
      })

      it('expects omega ratio 20-26:1 (worst)', () => {
        const result = inferBeefProfile(['wagyu'])
        expect(result.expectedOmegaRatio).toBe('20-26:1')
      })

      it('does NOT assign F_PREMIUM_CAFO if process claims present', () => {
        const result = inferBeefProfile(['wagyu', 'grass-fed'])
        expect(result.profile).not.toBe('F_PREMIUM_CAFO')
      })
    })

    // Claim normalization
    describe('Claim normalization', () => {
      it('is case-insensitive', () => {
        const result1 = inferBeefProfile(['GRASS-FED'])
        const result2 = inferBeefProfile(['grass-fed'])
        expect(result1.profile).toBe(result2.profile)
      })

      it('handles extra spaces', () => {
        const result = inferBeefProfile(['  grass fed  '])
        expect(result.profile).toBe('C_MARKETING_GRASS')
      })

      it('handles punctuation variations', () => {
        const result = inferBeefProfile(['grass-fed!'])
        expect(result.profile).toBe('C_MARKETING_GRASS')
      })
    })

    // Priority/precedence tests
    describe('Claim precedence', () => {
      it('CAFO exclusion takes priority over grass-fed claim', () => {
        // "grass-fed" + "no feedlot" = Profile A or B (not C)
        const result = inferBeefProfile(['grass-fed', 'no feedlot'])
        expect(result.isCAFO).toBe(false)
      })

      it('grass-finished with CAFO exclusion = Profile A', () => {
        const result = inferBeefProfile(['grass-finished', 'pasture-raised'])
        expect(result.profile).toBe('A_TRUE_GRASS')
      })

      it('breed claims with process claims follow process logic', () => {
        // Wagyu + grass-fed = marketing grass (not F)
        const result = inferBeefProfile(['wagyu', 'grass-fed'])
        expect(result.profile).toBe('C_MARKETING_GRASS')
      })
    })
  })
})

// =============================================================================
// ORGANIC BEEF WARNING TESTS
// =============================================================================

describe('Organic Beef Warning', () => {
  describe('checkOrganicBeefWarning()', () => {
    it('returns no warning for non-organic', () => {
      const result = checkOrganicBeefWarning(false, [])
      expect(result.hasWarning).toBe(false)
      expect(result.severity).toBe('none')
    })

    it('returns critical warning for organic without grass claims', () => {
      const result = checkOrganicBeefWarning(true, [])
      expect(result.hasWarning).toBe(true)
      expect(result.severity).toBe('critical')
      expect(result.message).toContain('ORGANIC MEAT WARNING')
    })

    it('explains organic often means grain-fed', () => {
      const result = checkOrganicBeefWarning(true, [])
      expect(result.reasoning).toContain('organic feed')
    })

    it('returns warning for organic + grass but no CAFO exclusion', () => {
      const result = checkOrganicBeefWarning(true, ['grass-fed'])
      expect(result.hasWarning).toBe(true)
      expect(result.severity).toBe('warning')
      expect(result.message).toContain('verify finishing')
    })

    it('returns no warning for organic + grass + CAFO exclusion', () => {
      const result = checkOrganicBeefWarning(true, ['grass-fed', '100% grass'])
      expect(result.hasWarning).toBe(false)
      expect(result.severity).toBe('info')
    })

    it('returns no warning for organic + pasture + CAFO exclusion', () => {
      const result = checkOrganicBeefWarning(true, ['pasture-raised', 'no feedlot'])
      expect(result.hasWarning).toBe(false)
    })

    it('treats "pasture" as grass claim', () => {
      const result = checkOrganicBeefWarning(true, ['pasture-raised'])
      expect(result.severity).toBe('warning') // Not critical, but warning
    })
  })
})

// =============================================================================
// OMEGA RATIO VALIDATION TESTS
// =============================================================================

describe('Omega Ratio Validation', () => {
  describe('validateOmegaClaim()', () => {
    // Profile A: True Grass (expected 1-4:1)
    describe('Profile A validation', () => {
      it('validates ratio within expected range', () => {
        const result = validateOmegaClaim('A_TRUE_GRASS', 2.5)
        expect(result.isConsistent).toBe(true)
        expect(result.message).toContain('consistent')
      })

      it('validates ratio better than expected', () => {
        const result = validateOmegaClaim('A_TRUE_GRASS', 0.8)
        expect(result.isConsistent).toBe(true)
        expect(result.message).toContain('BETTER')
      })

      it('flags ratio worse than expected', () => {
        const result = validateOmegaClaim('A_TRUE_GRASS', 6)
        expect(result.isConsistent).toBe(false)
        expect(result.message).toContain('WARNING')
        expect(result.message).toContain('WORSE')
      })

      it('flags suspicious grass-fed claim with high ratio', () => {
        const result = validateOmegaClaim('A_TRUE_GRASS', 10)
        expect(result.isConsistent).toBe(false)
        expect(result.message).toContain('misleading')
      })
    })

    // Profile B: True Pasture (expected 3-7:1)
    describe('Profile B validation', () => {
      it('validates ratio within expected range', () => {
        const result = validateOmegaClaim('B_TRUE_PASTURE', 5)
        expect(result.isConsistent).toBe(true)
      })

      it('flags ratio worse than expected', () => {
        const result = validateOmegaClaim('B_TRUE_PASTURE', 10)
        expect(result.isConsistent).toBe(false)
      })
    })

    // Profile C: Marketing Grass (expected 7-16:1)
    describe('Profile C validation', () => {
      it('validates typical marketing grass ratio', () => {
        const result = validateOmegaClaim('C_MARKETING_GRASS', 12)
        expect(result.isConsistent).toBe(true)
      })

      it('flags when better than marketing claim should produce', () => {
        const result = validateOmegaClaim('C_MARKETING_GRASS', 4)
        expect(result.isConsistent).toBe(true)
        expect(result.message).toContain('BETTER')
      })
    })

    // Profile E: Commodity (expected 14-22:1)
    describe('Profile E validation', () => {
      it('validates typical commodity ratio', () => {
        const result = validateOmegaClaim('E_COMMODITY', 18)
        expect(result.isConsistent).toBe(true)
      })
    })

    // Profile F: Premium CAFO (expected 18-30:1)
    describe('Profile F validation', () => {
      it('validates typical premium CAFO ratio (worst)', () => {
        const result = validateOmegaClaim('F_PREMIUM_CAFO', 24)
        expect(result.isConsistent).toBe(true)
      })

      it('flags unusually good ratio for premium CAFO', () => {
        const result = validateOmegaClaim('F_PREMIUM_CAFO', 10)
        expect(result.isConsistent).toBe(true)
        expect(result.message).toContain('BETTER')
      })

      it('flags extreme ratio even for F profile', () => {
        const result = validateOmegaClaim('F_PREMIUM_CAFO', 35)
        expect(result.isConsistent).toBe(false)
      })
    })

    // All profiles
    describe('All profile validation', () => {
      const profiles: BeefProfile[] = [
        'A_TRUE_GRASS',
        'B_TRUE_PASTURE',
        'C_MARKETING_GRASS',
        'D_MARKETING_PASTURE',
        'E_COMMODITY',
        'E2_NATURAL',
        'F_PREMIUM_CAFO',
      ]

      it.each(profiles)('returns a message for %s', (profile) => {
        const result = validateOmegaClaim(profile, 10)
        expect(result.message).toBeDefined()
        expect(result.message.length).toBeGreaterThan(0)
      })
    })
  })
})

// =============================================================================
// INTEGRATION / REAL-WORLD SCENARIO TESTS
// =============================================================================

describe('Real-World Scenarios', () => {
  describe('Everglades Ranch (True Pasture)', () => {
    it('correctly classifies Everglades Ranch claims', () => {
      const claims = ['pasture-raised', 'no feedlot', 'American Wagyu']
      const result = inferBeefProfile(claims)
      // Has CAFO exclusion + pasture-raised = Profile B
      expect(result.profile).toBe('B_TRUE_PASTURE')
      expect(result.isCAFO).toBe(false)
      expect(result.expectedOmegaRatio).toBe('4-6:1')
    })
  })

  describe('Snake River Farms (Premium CAFO)', () => {
    it('correctly classifies Snake River Farms claims', () => {
      // Only breed claims, no process claims
      const claims = ['American Wagyu', 'A5 graded']
      const result = inferBeefProfile(claims)
      expect(result.profile).toBe('F_PREMIUM_CAFO')
      expect(result.isCAFO).toBe(true)
      expect(result.tier).toBe('worst')
    })
  })

  describe('Store brand "Natural" beef', () => {
    it('correctly classifies Natural claims as commodity-equivalent', () => {
      const claims = ['all natural', 'no antibiotics ever', 'no added hormones']
      const result = inferBeefProfile(claims)
      expect(result.profile).toBe('E2_NATURAL')
      expect(result.isCAFO).toBe(true)
      expect(result.expectedOmegaRatio).toBe('15-20:1')
    })
  })

  describe('Whole Foods "Grass-Fed" beef', () => {
    it('correctly classifies marketing grass-fed', () => {
      // "Grass-fed" without finishing = likely grain-finished
      const claims = ['grass-fed', 'no antibiotics']
      const result = inferBeefProfile(claims)
      expect(result.profile).toBe('C_MARKETING_GRASS')
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('True grass-fed brand', () => {
    it('correctly classifies complete grass-fed claims', () => {
      const claims = ['100% grass-fed', 'grass-finished', 'pasture-raised', 'no feedlot']
      const result = inferBeefProfile(claims)
      expect(result.profile).toBe('A_TRUE_GRASS')
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })
  })

  describe('Organic chicken concern', () => {
    it('flags organic meat without grass claims', () => {
      const warning = checkOrganicBeefWarning(true, ['organic', 'cage-free'])
      expect(warning.hasWarning).toBe(true)
      expect(warning.severity).toBe('critical')
      // The key insight: organic chicken fed organic corn is a walking seed oil
      expect(warning.reasoning).toContain('organic corn')
    })
  })

  describe('PLU + Organic inference chain', () => {
    it('infers organic from PLU code', () => {
      const plu = inferFromPLU('94011') // Organic banana
      expect(plu.isOrganic).toBe(true)
      expect(plu.isGMO).toBe('no')
    })
  })

  describe('Lab verification scenario', () => {
    it('flags misleading grass-fed claim via omega test', () => {
      // Brand claims grass-fed but lab shows 15:1 ratio
      const profile = inferBeefProfile(['grass-fed'])
      const validation = validateOmegaClaim(profile.profile, 15)

      // C_MARKETING_GRASS expects 8-15:1, so 15:1 is within range
      expect(validation.isConsistent).toBe(true)

      // But if they claimed "100% grass-fed"...
      const trueGrassValidation = validateOmegaClaim('A_TRUE_GRASS', 15)
      expect(trueGrassValidation.isConsistent).toBe(false)
      expect(trueGrassValidation.message).toContain('misleading')
    })
  })
})
