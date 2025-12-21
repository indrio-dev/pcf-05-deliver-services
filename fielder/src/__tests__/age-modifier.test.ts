/**
 * Age Modifier Tests
 *
 * Tests for lifecycle-aware age modifiers (R_maturity component).
 * Validates that tree, bush, vine, and annual crops use appropriate age curves.
 */

import {
  getLifecycleAgeModifier,
  requiresAgeModifier,
  getPrimeAgeRange,
} from '../lib/prediction/age-modifier'
import { CROP_GDD_TARGETS } from '../lib/constants/gdd-targets'

describe('Age Modifier (R_maturity)', () => {
  // ===========================================================================
  // TREE STANDARD CURVE
  // ===========================================================================
  describe('Tree Standard Curve', () => {
    const treeLifecycle = 'tree_perennial'

    it('pre-bearing stage (0-2 years) has -0.8 modifier', () => {
      const result = getLifecycleAgeModifier(1, treeLifecycle)
      expect(result.modifier).toBe(-0.8)
      expect(result.stage).toBe('pre_bearing')
      expect(result.reproductiveAllocation).toBe(0)
    })

    it('juvenile stage (3-4 years) has -0.5 modifier', () => {
      const result = getLifecycleAgeModifier(3, treeLifecycle)
      expect(result.modifier).toBe(-0.5)
      expect(result.stage).toBe('juvenile')
      expect(result.reproductiveAllocation).toBe(20)
    })

    it('developing stage (5-7 years) has -0.2 modifier', () => {
      const result = getLifecycleAgeModifier(6, treeLifecycle)
      expect(result.modifier).toBe(-0.2)
      expect(result.stage).toBe('developing')
      expect(result.reproductiveAllocation).toBe(50)
    })

    it('prime stage (8-18 years) has 0.0 modifier', () => {
      const result = getLifecycleAgeModifier(12, treeLifecycle)
      expect(result.modifier).toBe(0.0)
      expect(result.stage).toBe('prime')
      expect(result.reproductiveAllocation).toBe(85)
    })

    it('mature stage (19-25 years) has -0.2 modifier', () => {
      const result = getLifecycleAgeModifier(22, treeLifecycle)
      expect(result.modifier).toBe(-0.2)
      expect(result.stage).toBe('mature')
    })

    it('declining stage (25+ years) has -0.3 modifier with paradox', () => {
      const result = getLifecycleAgeModifier(30, treeLifecycle)
      expect(result.modifier).toBe(-0.3)
      expect(result.stage).toBe('declining')
      expect(result.decliningParadox).toBe(true)
    })
  })

  // ===========================================================================
  // BUSH STANDARD CURVE
  // ===========================================================================
  describe('Bush Standard Curve', () => {
    const bushLifecycle = 'bush_perennial'

    it('pre-bearing stage (<1 year) has -0.8 modifier', () => {
      const result = getLifecycleAgeModifier(0.5, bushLifecycle)
      expect(result.modifier).toBe(-0.8)
      expect(result.stage).toBe('pre_bearing')
    })

    it('juvenile stage (1-2 years) has -0.5 modifier', () => {
      const result = getLifecycleAgeModifier(2, bushLifecycle)
      expect(result.modifier).toBe(-0.5)
      expect(result.stage).toBe('juvenile')
    })

    it('prime stage (3-5 years) has 0.0 modifier', () => {
      const result = getLifecycleAgeModifier(4, bushLifecycle)
      expect(result.modifier).toBe(0.0)
      expect(result.stage).toBe('prime')
    })

    it('mature stage (6-10 years) has -0.1 modifier', () => {
      const result = getLifecycleAgeModifier(8, bushLifecycle)
      expect(result.modifier).toBe(-0.1)
      expect(result.stage).toBe('mature')
    })

    it('declining stage (10+ years) has -0.3 modifier', () => {
      const result = getLifecycleAgeModifier(15, bushLifecycle)
      expect(result.modifier).toBe(-0.3)
      expect(result.stage).toBe('declining')
    })
  })

  // ===========================================================================
  // VINE STANDARD CURVE
  // ===========================================================================
  describe('Vine Standard Curve', () => {
    const vineLifecycle = 'vine_perennial'

    it('pre-bearing stage (0-2 years) has -0.8 modifier', () => {
      const result = getLifecycleAgeModifier(1, vineLifecycle)
      expect(result.modifier).toBe(-0.8)
      expect(result.stage).toBe('pre_bearing')
    })

    it('juvenile stage (3-4 years) has -0.4 modifier', () => {
      const result = getLifecycleAgeModifier(4, vineLifecycle)
      expect(result.modifier).toBe(-0.4)
      expect(result.stage).toBe('juvenile')
    })

    it('prime stage (5-10 years) has 0.0 modifier', () => {
      const result = getLifecycleAgeModifier(7, vineLifecycle)
      expect(result.modifier).toBe(0.0)
      expect(result.stage).toBe('prime')
    })

    it('mature stage (11-25 years) has -0.1 modifier', () => {
      const result = getLifecycleAgeModifier(18, vineLifecycle)
      expect(result.modifier).toBe(-0.1)
      expect(result.stage).toBe('mature')
    })

    it('old vine stage (25+ years) has -0.2 modifier with paradox', () => {
      const result = getLifecycleAgeModifier(35, vineLifecycle)
      expect(result.modifier).toBe(-0.2)
      expect(result.stage).toBe('declining')
      expect(result.decliningParadox).toBe(true)
    })
  })

  // ===========================================================================
  // ANNUAL CROPS (NO AGE MODIFIER)
  // ===========================================================================
  describe('Annual Crops (No Age Modifier)', () => {
    it('annual_row has 0.0 modifier regardless of age', () => {
      const result = getLifecycleAgeModifier(5, 'annual_row')
      expect(result.modifier).toBe(0)
      expect(result.stage).toBe('prime')
      expect(result.reproductiveAllocation).toBe(100)
      expect(result.confidence).toBe(1.0)
    })

    it('annual_replanted has 0.0 modifier regardless of age', () => {
      const result = getLifecycleAgeModifier(3, 'annual_replanted')
      expect(result.modifier).toBe(0)
      expect(result.stage).toBe('prime')
    })

    it('tomato (annual) returns no age modifier', () => {
      const result = getLifecycleAgeModifier(1, 'tomato_standard')
      expect(result.modifier).toBe(0)
      expect(result.insight).toContain('Annual crop')
    })
  })

  // ===========================================================================
  // CROP ID LOOKUP
  // ===========================================================================
  describe('Crop ID Lookup', () => {
    it('navel_orange uses tree curve', () => {
      const result = getLifecycleAgeModifier(12, 'navel_orange')
      expect(result.modifier).toBe(0.0)
      expect(result.stage).toBe('prime')
    })

    it('blueberry uses bush curve', () => {
      const result = getLifecycleAgeModifier(4, 'blueberry')
      expect(result.modifier).toBe(0.0) // Prime for bush is 3-5
    })

    it('strawberry (annual_replanted) returns no modifier', () => {
      const result = getLifecycleAgeModifier(2, 'strawberry')
      expect(result.modifier).toBe(0)
    })

    it('peach uses tree curve', () => {
      const result = getLifecycleAgeModifier(1, 'peach')
      expect(result.modifier).toBe(-0.8) // Pre-bearing
    })

    it('apple uses tree curve', () => {
      const result = getLifecycleAgeModifier(10, 'apple')
      expect(result.modifier).toBe(0.0) // Prime
    })
  })

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================
  describe('Helper Functions', () => {
    describe('requiresAgeModifier()', () => {
      it('returns true for tree_perennial', () => {
        expect(requiresAgeModifier('tree_perennial')).toBe(true)
      })

      it('returns true for bush_perennial', () => {
        expect(requiresAgeModifier('bush_perennial')).toBe(true)
      })

      it('returns true for vine_perennial', () => {
        expect(requiresAgeModifier('vine_perennial')).toBe(true)
      })

      it('returns false for annual_row', () => {
        expect(requiresAgeModifier('annual_row')).toBe(false)
      })

      it('returns false for annual_replanted', () => {
        expect(requiresAgeModifier('annual_replanted')).toBe(false)
      })
    })

    describe('getPrimeAgeRange()', () => {
      it('returns [8, 18] for tree_perennial', () => {
        expect(getPrimeAgeRange('tree_perennial')).toEqual([8, 18])
      })

      it('returns [3, 5] for bush_perennial', () => {
        expect(getPrimeAgeRange('bush_perennial')).toEqual([3, 5])
      })

      it('returns [5, 10] for vine_perennial', () => {
        expect(getPrimeAgeRange('vine_perennial')).toEqual([5, 10])
      })

      it('returns undefined for annual_row', () => {
        expect(getPrimeAgeRange('annual_row')).toBeUndefined()
      })

      it('uses maturityProfile from GDD targets when available', () => {
        // Check that explicit maturity profiles are respected
        const orangeRange = getPrimeAgeRange('navel_orange')
        expect(orangeRange).toEqual([8, 18])
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================
  describe('Edge Cases', () => {
    it('handles undefined age gracefully', () => {
      const result = getLifecycleAgeModifier(undefined, 'navel_orange')
      expect(result.modifier).toBe(0)
      expect(result.confidence).toBe(0.5)
      expect(result.insight).toContain('unknown')
    })

    it('handles zero age', () => {
      const result = getLifecycleAgeModifier(0, 'tree_perennial')
      expect(result.stage).toBe('pre_bearing')
      expect(result.modifier).toBe(-0.8)
    })

    it('handles very old trees', () => {
      const result = getLifecycleAgeModifier(100, 'tree_perennial')
      expect(result.stage).toBe('declining')
      expect(result.decliningParadox).toBe(true)
    })

    it('handles unknown crop ID by inferring from name', () => {
      // Should infer tree_perennial from "orange" in name
      const result = getLifecycleAgeModifier(12, 'blood_orange')
      expect(result.stage).toBe('prime')
      expect(result.modifier).toBe(0.0)
    })
  })

  // ===========================================================================
  // LIFECYCLE CLASSIFICATION VALIDATION
  // ===========================================================================
  describe('Lifecycle Classification Validation', () => {
    it('all citrus crops have tree_perennial lifecycle', () => {
      const citrusCrops = ['navel_orange', 'valencia', 'grapefruit', 'tangerine', 'satsuma']
      for (const cropId of citrusCrops) {
        const target = CROP_GDD_TARGETS[cropId]
        expect(target.lifecycle).toBe('tree_perennial')
      }
    })

    it('all stone fruit have tree_perennial lifecycle', () => {
      const stoneFruit = ['peach', 'sweet_cherry', 'tart_cherry']
      for (const cropId of stoneFruit) {
        const target = CROP_GDD_TARGETS[cropId]
        expect(target.lifecycle).toBe('tree_perennial')
      }
    })

    it('blueberry has bush_perennial lifecycle', () => {
      expect(CROP_GDD_TARGETS.blueberry.lifecycle).toBe('bush_perennial')
    })

    it('blackberry has bush_perennial lifecycle', () => {
      expect(CROP_GDD_TARGETS.blackberry.lifecycle).toBe('bush_perennial')
      expect(CROP_GDD_TARGETS.blackberry.maturityProfile?.ageModifierType).toBe('bush_standard')
    })

    it('raspberry has bush_perennial lifecycle', () => {
      expect(CROP_GDD_TARGETS.raspberry.lifecycle).toBe('bush_perennial')
      expect(CROP_GDD_TARGETS.raspberry.maturityProfile?.yearsToFirstBearing).toBe(1)
    })

    it('strawberry has annual_replanted lifecycle', () => {
      expect(CROP_GDD_TARGETS.strawberry.lifecycle).toBe('annual_replanted')
    })

    it('tomato has annual_row lifecycle', () => {
      expect(CROP_GDD_TARGETS.tomato_standard.lifecycle).toBe('annual_row')
    })

    it('grape_table has vine_perennial lifecycle', () => {
      expect(CROP_GDD_TARGETS.grape_table.lifecycle).toBe('vine_perennial')
      expect(CROP_GDD_TARGETS.grape_table.maturityProfile?.ageModifierType).toBe('vine_standard')
    })

    it('grape_wine has vine_perennial lifecycle', () => {
      expect(CROP_GDD_TARGETS.grape_wine.lifecycle).toBe('vine_perennial')
      expect(CROP_GDD_TARGETS.grape_wine.maturityProfile?.primeAgeRangeYears).toEqual([8, 30])
    })

    it('kiwi has vine_perennial lifecycle', () => {
      expect(CROP_GDD_TARGETS.kiwi.lifecycle).toBe('vine_perennial')
      expect(CROP_GDD_TARGETS.kiwi.maturityProfile?.ageModifierType).toBe('vine_standard')
      expect(CROP_GDD_TARGETS.kiwi.maturityProfile?.yearsToFirstBearing).toBe(4)
    })
  })

  // ===========================================================================
  // VINE CROP AGE MODIFIER INTEGRATION
  // ===========================================================================
  describe('Vine Crop Age Modifier Integration', () => {
    it('grape_table uses vine age curve', () => {
      // Young vine (3 years) - juvenile
      const young = getLifecycleAgeModifier(3, 'grape_table')
      expect(young.modifier).toBe(-0.4)
      expect(young.stage).toBe('juvenile')

      // Prime vine (8 years)
      const prime = getLifecycleAgeModifier(8, 'grape_table')
      expect(prime.modifier).toBe(0.0)
      expect(prime.stage).toBe('prime')
    })

    it('old wine grape vines have declining paradox', () => {
      // Old vine (30 years) - prized for quality
      const old = getLifecycleAgeModifier(30, 'grape_wine')
      expect(old.modifier).toBe(-0.2)
      expect(old.stage).toBe('declining')
      expect(old.decliningParadox).toBe(true)
      expect(old.insight).toContain('Old vine')
    })

    it('kiwi uses vine age curve', () => {
      // Pre-bearing (2 years)
      const young = getLifecycleAgeModifier(2, 'kiwi')
      expect(young.modifier).toBe(-0.8)
      expect(young.stage).toBe('pre_bearing')

      // Prime vine (10 years)
      const prime = getLifecycleAgeModifier(10, 'kiwi')
      expect(prime.modifier).toBe(0.0)
      expect(prime.stage).toBe('prime')
    })

    it('blackberry and raspberry use bush age curve', () => {
      // Blackberry prime (4 years)
      const blackberryPrime = getLifecycleAgeModifier(4, 'blackberry')
      expect(blackberryPrime.modifier).toBe(0.0)
      expect(blackberryPrime.stage).toBe('prime')

      // Raspberry young (1 year) - already bearing!
      const raspberryYoung = getLifecycleAgeModifier(1, 'raspberry')
      expect(raspberryYoung.modifier).toBe(-0.5)
      expect(raspberryYoung.stage).toBe('juvenile')

      // Raspberry declining (12 years)
      const raspberryOld = getLifecycleAgeModifier(12, 'raspberry')
      expect(raspberryOld.modifier).toBe(-0.3)
      expect(raspberryOld.stage).toBe('declining')
    })
  })
})
