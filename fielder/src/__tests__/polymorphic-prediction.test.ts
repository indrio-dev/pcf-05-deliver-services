/**
 * Polymorphic Prediction System Tests
 *
 * Tests for the unified SHARE prediction framework that handles
 * all product categories (produce, livestock, seafood, etc.)
 */

import { predictUnified, classifyOmegaRatio } from '@/lib/prediction/prediction-router'
import {
  getBreed,
  getBreedsBySpecies,
  predictOmegaRatio,
  getOmegaClassification,
  DIET_OMEGA_MODIFIERS,
} from '@/lib/constants/livestock-breeds'
import type {
  ProducePredictionInput,
  LivestockPredictionInput,
  VegetablePredictionInput,
  NutPredictionInput,
  SeafoodPredictionInput,
  HoneyPredictionInput,
  TransformedPredictionInput,
} from '@/lib/prediction/predictor-interface'
import {
  getNutCultivar,
  getOilContentTier,
  NUT_CULTIVARS,
} from '@/lib/prediction/nut-predictor'
import {
  getSeafoodSpecies,
  getOmega3Tier,
  SEAFOOD_SPECIES,
} from '@/lib/prediction/seafood-predictor'
import {
  getHoneyVarietal,
  getDiastaseTier,
  getMoistureQuality,
  HONEY_VARIETALS,
} from '@/lib/prediction/honey-predictor'
import {
  getCoffeeVariety,
  getCoffeeOrigin,
  getProcessingMethod,
  getRoastLevel,
  getCuppingTier,
  COFFEE_VARIETIES,
  COFFEE_ORIGINS,
  PROCESSING_METHODS,
} from '@/lib/prediction/transformation-predictor'

describe('Polymorphic Prediction System', () => {
  describe('Prediction Router', () => {
    it('routes produce predictions to produce fallback', () => {
      const input: ProducePredictionInput = {
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'florida',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
      }

      const result = predictUnified(input)

      expect(result.primaryMetric.type).toBe('brix')
      expect(result.modelInfo.category).toBe('produce')
      expect(result.modelInfo.validationStatus).toBe('validated')
    })

    it('routes livestock predictions to livestock predictor', () => {
      const input: LivestockPredictionInput = {
        category: 'livestock',
        species: 'beef',
        breedId: 'angus',
        feedingRegime: {
          diet: 'grass_only',
        },
      }

      const result = predictUnified(input)

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.modelInfo.category).toBe('livestock')
      // Should use the full livestock predictor now
      expect(result.modelInfo.validationStatus).toBe('calibrated')
    })

    it('routes eggs to livestock predictor with omega metric', () => {
      const input: LivestockPredictionInput = {
        category: 'eggs',
        species: 'poultry',
        feedingRegime: {
          diet: 'pasture_forage',
        },
      }

      const result = predictUnified(input)

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.modelInfo.category).toBe('eggs')
    })

    it('routes dairy to livestock predictor', () => {
      const input: LivestockPredictionInput = {
        category: 'dairy',
        species: 'dairy',
        breedId: 'jersey',
        feedingRegime: {
          diet: 'grass_only',
        },
      }

      const result = predictUnified(input)

      expect(result.primaryMetric.type).toBe('omega_ratio')
      expect(result.modelInfo.category).toBe('dairy')
    })

    it('routes seafood predictions to seafood predictor', () => {
      const result = predictUnified({
        category: 'seafood',
        speciesId: 'wild_salmon',
        sourceType: 'wild_caught',
      })

      expect(result.primaryMetric.type).toBe('omega_3')
      expect(result.modelInfo.category).toBe('seafood')
      expect(result.modelInfo.validationStatus).toBe('inferred')
    })

    it('routes honey predictions to honey predictor', () => {
      const result = predictUnified({
        category: 'honey',
        varietalType: 'tupelo',
        isRaw: true,
      })

      expect(result.primaryMetric.type).toBe('diastase')
      expect(result.modelInfo.category).toBe('honey')
      expect(result.modelInfo.validationStatus).toBe('inferred')
    })
  })

  describe('Livestock Omega Predictor', () => {
    describe('Diet Impact on Omega Ratio', () => {
      it('grass-only diet produces lowest omega ratio (~3:1)', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          feedingRegime: {
            diet: 'grass_only',
          },
        }

        const result = predictUnified(input)

        // Angus baseline (14) + grass_only (-12) = ~2:1
        expect(result.primaryMetric.value).toBeLessThanOrEqual(4)
        expect(result.qualityTier).toBe('artisan')
      })

      it('pasture-forage diet produces good omega ratio (~5:1)', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          feedingRegime: {
            diet: 'pasture_forage',
          },
        }

        const result = predictUnified(input)

        // Angus baseline (14) + pasture_forage (-10) = ~4:1
        expect(result.primaryMetric.value).toBeLessThanOrEqual(6)
        expect(result.qualityTier).toMatch(/artisan|premium/)
      })

      it('grain-finished diet produces elevated omega ratio', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          feedingRegime: {
            diet: 'grain_finished',
          },
        }

        const result = predictUnified(input)

        // grain_finished baseline is 14:1, which falls in 'standard' tier (7-20:1)
        // 'commodity' tier is reserved for >20:1 (extended feedlot like Premium Wagyu)
        expect(result.primaryMetric.value).toBeGreaterThan(12)
        expect(result.qualityTier).toBe('standard')
      })

      it('grain-fed diet produces highest omega ratio', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          feedingRegime: {
            diet: 'grain_fed',
          },
        }

        const result = predictUnified(input)

        // Angus baseline (14) + grain_fed (0) = ~14:1
        expect(result.primaryMetric.value).toBeGreaterThan(12)
        expect(result.qualityTier).toBe('commodity')
      })
    })

    describe('Finishing Duration Penalty', () => {
      it('3 months grain finishing adds ~7.5 to omega ratio', () => {
        const baseInput: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          feedingRegime: {
            diet: 'grain_finished',
            finishingMonths: 0,
          },
        }

        const finishedInput: LivestockPredictionInput = {
          ...baseInput,
          feedingRegime: {
            diet: 'grain_finished',
            finishingMonths: 3,
          },
        }

        const baseResult = predictUnified(baseInput)
        const finishedResult = predictUnified(finishedInput)

        // Finishing penalty = 3 months * 2.5 = 7.5
        const difference = finishedResult.primaryMetric.value - baseResult.primaryMetric.value
        expect(difference).toBeCloseTo(7.5, 1)
      })
    })

    describe('Breed Impact', () => {
      it('same diet = same omega ratio regardless of breed (diet is 100%)', () => {
        // CORRECTED MODEL: Breed genetics affect fat AMOUNT (marbling), NOT fat COMPOSITION (omega ratio)
        // Proof: Snake River Wagyu (26:1) vs Everglades Ranch Wagyu (6:1) = same genetics, different diet

        // Galloway - heritage grass specialist
        const gallowayInput: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'galloway',
          feedingRegime: { diet: 'grass_only' },
        }

        // Wagyu - high marbling, but same omega on same diet
        const wagyuInput: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'american_wagyu',
          feedingRegime: { diet: 'grass_only' },
        }

        const gallowayResult = predictUnified(gallowayInput)
        const wagyuResult = predictUnified(wagyuInput)

        // CORRECTED: Same diet = SAME omega ratio regardless of breed
        // Both should achieve grass_only baseline (~3:1)
        expect(gallowayResult.primaryMetric.value).toBe(wagyuResult.primaryMetric.value)
        expect(gallowayResult.qualityTier).toBe(wagyuResult.qualityTier)
      })

      it('unknown breed uses default baseline', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'unknown_breed',
          feedingRegime: { diet: 'grass_only' },
        }

        const result = predictUnified(input)

        // Should still produce a valid result
        expect(result.primaryMetric.value).toBeGreaterThan(0)
        expect(result.modelInfo.warnings).toContain(
          'Breed not specified - using generic omega baseline'
        )
      })
    })

    describe('Lab Verification', () => {
      it('uses measured omega ratio when provided', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          feedingRegime: { diet: 'grass_only' },
          measurements: {
            omega6To3Ratio: 2.8,
            labVerified: true,
            labName: 'Edacious',
          },
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBe(2.8)
        expect(result.enrich.verified).toBe(true)
        expect(result.confidence).toBeGreaterThanOrEqual(0.9)
      })

      it('detects mismatch between measured and predicted', () => {
        // Claim grass-fed but measured ratio suggests otherwise
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          feedingRegime: { diet: 'grass_only' },
          measurements: {
            omega6To3Ratio: 18, // Way too high for true grass-fed
            labVerified: true,
          },
        }

        const result = predictUnified(input)

        // Should use the measured value but flag the discrepancy
        expect(result.primaryMetric.value).toBe(18)
        expect(result.modelInfo.warnings.length).toBeGreaterThan(0)
      })
    })

    describe('SHARE Pillar Breakdown', () => {
      it('provides full SHARE breakdown for livestock', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          breedId: 'angus',
          ageMonths: 24,
          feedingRegime: {
            diet: 'grass_only',
            forageType: 'native_grassland',
          },
          practices: {
            animalWelfare: 'pasture_raised',
            noAntibiotics: true,
            noHormones: true,
          },
        }

        const result = predictUnified(input)

        // Soil (forage quality)
        expect(result.soil.details.forageType).toBe('native_grassland')

        // Heritage (breed)
        expect(result.heritage.details.breedId).toBe('angus')

        // Agricultural (feeding regime)
        expect(result.agricultural.details.feedingRegime).toBe('grass_only')
        expect(result.agricultural.details.noAntibiotics).toBe(true)

        // Ripen (age)
        expect(result.ripen.details.ageMonths).toBe(24)

        // Enrich (omega metric)
        expect(result.enrich.details.primaryMetric.type).toBe('omega_ratio')
      })
    })

    describe('Organic Warning', () => {
      it('warns when organic + grain-fed (common misconception)', () => {
        const input: LivestockPredictionInput = {
          category: 'livestock',
          species: 'beef',
          feedingRegime: { diet: 'grain_fed' },
          practices: {
            isCertifiedOrganic: true,
          },
        }

        const result = predictUnified(input)

        // Should have warning about organic + grain
        const hasOrganicWarning = result.agricultural.insights.some(
          (insight) => insight.includes('Organic') || insight.includes('organic')
        )
        expect(hasOrganicWarning).toBe(true)
      })
    })
  })

  describe('Breed Database', () => {
    it('contains breeds for all livestock species', () => {
      expect(getBreedsBySpecies('beef').length).toBeGreaterThan(5)
      expect(getBreedsBySpecies('pork').length).toBeGreaterThan(3)
      expect(getBreedsBySpecies('poultry').length).toBeGreaterThan(3)
      expect(getBreedsBySpecies('dairy').length).toBeGreaterThan(2)
      expect(getBreedsBySpecies('lamb').length).toBeGreaterThan(2)
    })

    it('provides omega baselines for all breeds', () => {
      const beefBreeds = getBreedsBySpecies('beef')

      for (const breed of beefBreeds) {
        expect(breed.omegaBaseline).toBeGreaterThan(0)
        expect(breed.omegaBaseline).toBeLessThan(30)
      }
    })

    it('correctly predicts omega ratio from breed + diet', () => {
      // Angus (baseline 14) + grass_only (-12) = 2
      const angusGrass = predictOmegaRatio('angus', 'grass_only', 0)
      expect(angusGrass).toBeCloseTo(2, 0)

      // Angus (baseline 14) + grain_fed (0) = 14
      const angusGrain = predictOmegaRatio('angus', 'grain_fed', 0)
      expect(angusGrain).toBeCloseTo(14, 0)

      // With 4 months finishing penalty: 14 + 4*2.5 = 24
      const angusFinished = predictOmegaRatio('angus', 'grain_fed', 4)
      expect(angusFinished).toBeCloseTo(24, 0)
    })

    it('heritage breeds are tagged correctly', () => {
      const galloway = getBreed('galloway')
      const devon = getBreed('devon')
      const holsteinBeef = getBreed('holstein_beef')

      expect(galloway?.heritageIntent).toBe('heritage')
      expect(devon?.heritageIntent).toBe('heritage')
      expect(holsteinBeef?.heritageIntent).toBe('commercial')
    })
  })

  describe('Omega Classification', () => {
    it('classifies exceptional ratio correctly (≤3:1)', () => {
      const result = classifyOmegaRatio(2.5)
      expect(result.tier).toBe('artisan')
      expect(result.score).toBeGreaterThan(90)
    })

    it('classifies premium ratio correctly (3-6:1)', () => {
      const result = classifyOmegaRatio(4.5)
      expect(result.tier).toBe('premium')
      expect(result.score).toBeGreaterThan(70)
      expect(result.score).toBeLessThan(90)
    })

    it('classifies standard ratio correctly (6-12:1)', () => {
      const result = classifyOmegaRatio(9)
      expect(result.tier).toBe('standard')
      expect(result.score).toBeGreaterThan(40)
      expect(result.score).toBeLessThan(70)
    })

    it('classifies commodity ratio correctly (>12:1)', () => {
      const result = classifyOmegaRatio(18)
      expect(result.tier).toBe('commodity')
      expect(result.score).toBeLessThan(40)
    })

    it('handles extreme ratios', () => {
      const excellent = classifyOmegaRatio(1.5)
      const terrible = classifyOmegaRatio(30)

      expect(excellent.tier).toBe('artisan')
      expect(excellent.score).toBeGreaterThanOrEqual(94)

      expect(terrible.tier).toBe('commodity')
      expect(terrible.score).toBeLessThanOrEqual(10)
    })
  })

  describe('Diet Modifiers', () => {
    it('grass_only provides maximum benefit', () => {
      expect(DIET_OMEGA_MODIFIERS.grass_only).toBeLessThan(
        DIET_OMEGA_MODIFIERS.pasture_forage
      )
    })

    it('grain_fed provides no benefit', () => {
      expect(DIET_OMEGA_MODIFIERS.grain_fed).toBe(0)
    })

    it('diet modifiers are ordered correctly', () => {
      expect(DIET_OMEGA_MODIFIERS.grass_only).toBeLessThan(
        DIET_OMEGA_MODIFIERS.pasture_forage
      )
      expect(DIET_OMEGA_MODIFIERS.pasture_forage).toBeLessThan(
        DIET_OMEGA_MODIFIERS.grain_finished
      )
      expect(DIET_OMEGA_MODIFIERS.grain_finished).toBeLessThan(
        DIET_OMEGA_MODIFIERS.grain_fed
      )
    })
  })

  describe('Produce Predictions via Router', () => {
    it('maintains backward compatibility with produce predictions', () => {
      const input: ProducePredictionInput = {
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'florida',
        currentGDD: 5500,
        currentDate: new Date('2024-12-15'),
      }

      const result = predictUnified(input)

      // Should return Brix-based prediction
      expect(result.primaryMetric.type).toBe('brix')
      expect(result.primaryMetric.value).toBeGreaterThan(0)
      expect(result.primaryMetric.lowerIsBetter).toBe(false)

      // Should have proper SHARE breakdown
      expect(result.soil).toBeDefined()
      expect(result.heritage).toBeDefined()
      expect(result.agricultural).toBeDefined()
      expect(result.ripen).toBeDefined()
      expect(result.enrich).toBeDefined()
    })
  })

  describe('Vegetable Predictor', () => {
    describe('Routing', () => {
      it('routes vegetable predictions to vegetable predictor', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'tomato',
          subcategory: 'nightshade',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.type).toBe('brix')
        expect(result.modelInfo.category).toBe('vegetables')
        expect(result.modelInfo.validationStatus).toBe('inferred')
      })
    })

    describe('Freshness-Based Quality (Leafy, Cruciferous, Legume)', () => {
      it('leafy greens at harvest have high freshness score', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'spinach',
          subcategory: 'leafy',
          daysSinceHarvest: 0,
          storageConditions: 'refrigerated',
        }

        const result = predictUnified(input)

        // Just harvested = high freshness
        expect(result.primaryMetric.value).toBeGreaterThan(90)
        expect(result.qualityTier).toBe('artisan')
      })

      it('leafy greens degrade quickly without refrigeration', () => {
        const freshInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'lettuce',
          subcategory: 'leafy',
          daysSinceHarvest: 0,
          storageConditions: 'ambient',
        }

        const oldInput: VegetablePredictionInput = {
          ...freshInput,
          daysSinceHarvest: 5,
        }

        const freshResult = predictUnified(freshInput)
        const oldResult = predictUnified(oldInput)

        expect(freshResult.primaryMetric.value).toBeGreaterThan(
          oldResult.primaryMetric.value
        )
        // 5 days at ambient for leafy = significant decay
        expect(oldResult.primaryMetric.value).toBeLessThan(60)
      })

      it('refrigeration extends freshness for leafy greens', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'spinach',
          subcategory: 'leafy',
          daysSinceHarvest: 3,
        }

        const ambientResult = predictUnified({
          ...input,
          storageConditions: 'ambient',
        })
        const refrigResult = predictUnified({
          ...input,
          storageConditions: 'refrigerated',
        })

        expect(refrigResult.primaryMetric.value).toBeGreaterThan(
          ambientResult.primaryMetric.value
        )
      })

      it('cruciferous vegetables have slower decay than leafy', () => {
        const leafyInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'spinach',
          subcategory: 'leafy',
          daysSinceHarvest: 3,
          storageConditions: 'ambient',
        }

        const crucInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'broccoli',
          subcategory: 'cruciferous',
          daysSinceHarvest: 3,
          storageConditions: 'ambient',
        }

        const leafyResult = predictUnified(leafyInput)
        const crucResult = predictUnified(crucInput)

        // Cruciferous more resilient
        expect(crucResult.primaryMetric.value).toBeGreaterThan(
          leafyResult.primaryMetric.value
        )
      })

      it('legumes degrade due to sugar->starch conversion', () => {
        const freshInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'peas',
          subcategory: 'legume',
          daysSinceHarvest: 0,
        }

        const oldInput: VegetablePredictionInput = {
          ...freshInput,
          daysSinceHarvest: 4,
        }

        const freshResult = predictUnified(freshInput)
        const oldResult = predictUnified(oldInput)

        // Fresh peas are sweet, older peas become starchy
        expect(freshResult.primaryMetric.value).toBeGreaterThan(
          oldResult.primaryMetric.value
        )
      })
    })

    describe('Brix-Based Quality (Root, Nightshade)', () => {
      it('nightshade vegetables (tomatoes) use Brix metric', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'tomato',
          subcategory: 'nightshade',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.displayName).toBe('Brix')
        expect(result.primaryMetric.unit).toBe('°Bx')
      })

      it('uses measured Brix when provided', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'tomato',
          subcategory: 'nightshade',
          measurements: {
            brix: 7.5,
          },
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBe(7.5)
      })

      it('root vegetables sweeten with cold storage', () => {
        const freshInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'carrot',
          subcategory: 'root',
          daysSinceHarvest: 0,
          storageConditions: 'cold_storage',
        }

        const storedInput: VegetablePredictionInput = {
          ...freshInput,
          daysSinceHarvest: 28, // 4 weeks cold storage
        }

        const freshResult = predictUnified(freshInput)
        const storedResult = predictUnified(storedInput)

        // Cold storage converts starch to sugar
        expect(storedResult.primaryMetric.value).toBeGreaterThan(
          freshResult.primaryMetric.value
        )
      })

      it('parsnips sweeten dramatically with cold storage', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'parsnip',
          subcategory: 'root',
          daysSinceHarvest: 21, // 3 weeks
          storageConditions: 'cold_storage',
        }

        const result = predictUnified(input)

        // Parsnips have high cold storage Brix increase
        expect(result.primaryMetric.value).toBeGreaterThan(7)
      })
    })

    describe('Storage-Based Quality (Allium, Squash)', () => {
      it('onions require curing for optimal storage quality', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'onion',
          subcategory: 'allium',
          daysSinceHarvest: 7, // Not yet fully cured
        }

        const result = predictUnified(input)

        // Still curing
        expect(result.ripen.details.harvestStatus).toBe('early')
        expect(result.ripen.insights).toContainEqual(
          expect.stringContaining('curing')
        )
      })

      it('winter squash quality improves with proper curing', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'butternut',
          subcategory: 'squash',
          daysSinceHarvest: 30, // Fully cured
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.displayName).toBe('Storage Quality')
        expect(result.primaryMetric.value).toBeGreaterThan(80)
      })
    })

    describe('SHARE Pillar Breakdown', () => {
      it('provides soil insights for vegetables', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'tomato',
          subcategory: 'nightshade',
          practices: {
            fertilityStrategy: {
              approach: 'mineralized_soil_science',
            },
          },
        }

        const result = predictUnified(input)

        expect(result.soil.modifier).toBeGreaterThan(0)
        expect(result.soil.insights).toContainEqual(
          expect.stringContaining('Mineralized')
        )
      })

      it('provides agricultural insights by subcategory', () => {
        const leafyInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'spinach',
          subcategory: 'leafy',
        }

        const storageInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'onion',
          subcategory: 'allium',
        }

        const leafyResult = predictUnified(leafyInput)
        const storageResult = predictUnified(storageInput)

        // Different insights for different subcategories
        expect(leafyResult.agricultural.insights).toContainEqual(
          expect.stringContaining('quickly')
        )
        expect(storageResult.agricultural.insights).toContainEqual(
          expect.stringContaining('curing')
        )
      })
    })

    describe('Confidence Calculation', () => {
      it('higher confidence with measured Brix', () => {
        const unmeasuredInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'tomato',
          subcategory: 'nightshade',
        }

        const measuredInput: VegetablePredictionInput = {
          ...unmeasuredInput,
          measurements: {
            brix: 6.0,
          },
        }

        const unmeasuredResult = predictUnified(unmeasuredInput)
        const measuredResult = predictUnified(measuredInput)

        expect(measuredResult.confidence).toBeGreaterThan(
          unmeasuredResult.confidence
        )
      })

      it('higher confidence with known days since harvest', () => {
        const unknownInput: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'spinach',
          subcategory: 'leafy',
        }

        const knownInput: VegetablePredictionInput = {
          ...unknownInput,
          daysSinceHarvest: 2,
        }

        const unknownResult = predictUnified(unknownInput)
        const knownResult = predictUnified(knownInput)

        expect(knownResult.confidence).toBeGreaterThan(
          unknownResult.confidence
        )
      })
    })

    describe('Warnings', () => {
      it('warns when days since harvest unknown for freshness crops', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'spinach',
          subcategory: 'leafy',
          // daysSinceHarvest not provided
        }

        const result = predictUnified(input)

        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('harvest')
        )
      })

      it('warns when using estimated Brix', () => {
        const input: VegetablePredictionInput = {
          category: 'vegetables',
          varietyId: 'tomato',
          subcategory: 'nightshade',
          // no measurements.brix
        }

        const result = predictUnified(input)

        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('estimated Brix')
        )
      })
    })
  })

  describe('Nut Predictor', () => {
    describe('Routing', () => {
      it('routes nut predictions to nut predictor', () => {
        const input: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'desirable_pecan',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.type).toBe('oil_content')
        expect(result.modelInfo.category).toBe('nuts')
        expect(result.modelInfo.validationStatus).toBe('inferred')
      })
    })

    describe('Oil Content by Cultivar', () => {
      it('pecans have high oil content (~70-74%)', () => {
        const input: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'desirable_pecan',
          treeAgeYears: 20, // Prime age
          harvestTiming: 'optimal',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(68)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(76)
        expect(result.qualityTier).toMatch(/artisan|premium/)
      })

      it('macadamias have highest oil content (~75-80%)', () => {
        const input: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'hawaii_macadamia',
          treeAgeYears: 15,
          harvestTiming: 'optimal',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(74)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(82)
      })

      it('almonds have moderate oil content (~50-56%)', () => {
        const input: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'nonpareil_almond',
          treeAgeYears: 10,
          harvestTiming: 'optimal',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(50)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(58)
      })

      it('chestnuts are starch-based with very low oil (<3%)', () => {
        const input: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'colossal_chestnut',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeLessThan(5)
        // Should warn about starch-based quality
        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('starch')
        )
      })
    })

    describe('Tree Age Maturity Curve', () => {
      it('young trees have lower oil content', () => {
        const youngInput: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'desirable_pecan',
          treeAgeYears: 8, // Before prime
          harvestTiming: 'optimal',
        }

        const primeInput: NutPredictionInput = {
          ...youngInput,
          treeAgeYears: 40, // In prime (15-75 years for pecans)
        }

        const youngResult = predictUnified(youngInput)
        const primeResult = predictUnified(primeInput)

        expect(primeResult.primaryMetric.value).toBeGreaterThan(
          youngResult.primaryMetric.value
        )
      })

      it('pecans have very long prime years (15-75+)', () => {
        const cultivar = getNutCultivar('desirable_pecan')

        expect(cultivar?.maturityYears.prime.min).toBe(15)
        expect(cultivar?.maturityYears.prime.max).toBeGreaterThanOrEqual(75)
      })

      it('almonds have shorter prime years (6-25)', () => {
        const cultivar = getNutCultivar('nonpareil_almond')

        expect(cultivar?.maturityYears.prime.min).toBe(6)
        expect(cultivar?.maturityYears.prime.max).toBeLessThanOrEqual(30)
      })
    })

    describe('Water Stress Impact', () => {
      it('mild water stress concentrates oil content', () => {
        const irrigatedInput: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'chandler_walnut',
          waterStress: false,
        }

        const stressedInput: NutPredictionInput = {
          ...irrigatedInput,
          waterStress: true,
        }

        const irrigatedResult = predictUnified(irrigatedInput)
        const stressedResult = predictUnified(stressedInput)

        // Water stress should increase oil concentration
        expect(stressedResult.primaryMetric.value).toBeGreaterThan(
          irrigatedResult.primaryMetric.value
        )
      })
    })

    describe('Harvest Timing', () => {
      it('early harvest reduces oil content', () => {
        const earlyInput: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'kerman_pistachio',
          harvestTiming: 'early',
        }

        const optimalInput: NutPredictionInput = {
          ...earlyInput,
          harvestTiming: 'optimal',
        }

        const earlyResult = predictUnified(earlyInput)
        const optimalResult = predictUnified(optimalInput)

        expect(optimalResult.primaryMetric.value).toBeGreaterThan(
          earlyResult.primaryMetric.value
        )
      })

      it('late harvest slightly reduces quality', () => {
        const optimalInput: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'barcelona_hazelnut',
          harvestTiming: 'optimal',
        }

        const lateInput: NutPredictionInput = {
          ...optimalInput,
          harvestTiming: 'late',
        }

        const optimalResult = predictUnified(optimalInput)
        const lateResult = predictUnified(lateInput)

        expect(optimalResult.primaryMetric.value).toBeGreaterThan(
          lateResult.primaryMetric.value
        )
      })
    })

    describe('Lab Verification', () => {
      it('uses measured oil content when provided', () => {
        const input: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'desirable_pecan',
          measurements: {
            oilContentPct: 72.5,
            labVerified: true,
          },
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBe(72.5)
        expect(result.enrich.verified).toBe(true)
        expect(result.confidence).toBeGreaterThanOrEqual(0.9)
      })
    })

    describe('SHARE Pillar Breakdown', () => {
      it('provides full SHARE breakdown for nuts', () => {
        const input: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'desirable_pecan',
          treeAgeYears: 25,
          regionId: 'georgia_piedmont',
          harvestTiming: 'optimal',
          waterStress: true,
        }

        const result = predictUnified(input)

        // Heritage
        expect(result.heritage.details.cultivarId).toBe('desirable_pecan')
        expect(result.heritage.insights.length).toBeGreaterThan(0)

        // Ripen (age + timing)
        expect(result.ripen.details.harvestStatus).toBe('peak')
        expect(result.ripen.insights).toContainEqual(
          expect.stringContaining('years')
        )

        // Agricultural (water stress)
        expect(result.agricultural.insights).toContainEqual(
          expect.stringContaining('irrigation')
        )

        // Enrich
        expect(result.enrich.details.primaryMetric.type).toBe('oil_content')
      })
    })

    describe('Confidence Calculation', () => {
      it('higher confidence with more input data', () => {
        const minimalInput: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'chandler_walnut',
        }

        const fullInput: NutPredictionInput = {
          ...minimalInput,
          treeAgeYears: 15,
          harvestTiming: 'optimal',
          waterStress: false,
          measurements: {
            oilContentPct: 66.0,
            labVerified: true,
          },
        }

        const minimalResult = predictUnified(minimalInput)
        const fullResult = predictUnified(fullInput)

        expect(fullResult.confidence).toBeGreaterThan(minimalResult.confidence)
      })

      it('unknown cultivar reduces confidence', () => {
        const knownInput: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'desirable_pecan',
        }

        const unknownInput: NutPredictionInput = {
          category: 'nuts',
          cultivarId: 'unknown_variety',
        }

        const knownResult = predictUnified(knownInput)
        const unknownResult = predictUnified(unknownInput)

        expect(knownResult.confidence).toBeGreaterThan(unknownResult.confidence)
        expect(unknownResult.modelInfo.warnings).toContainEqual(
          expect.stringContaining('not specified')
        )
      })
    })
  })

  describe('Nut Cultivar Database', () => {
    it('contains all major nut types', () => {
      expect(getNutCultivar('desirable_pecan')).toBeDefined()
      expect(getNutCultivar('chandler_walnut')).toBeDefined()
      expect(getNutCultivar('nonpareil_almond')).toBeDefined()
      expect(getNutCultivar('barcelona_hazelnut')).toBeDefined()
      expect(getNutCultivar('hawaii_macadamia')).toBeDefined()
      expect(getNutCultivar('kerman_pistachio')).toBeDefined()
      expect(getNutCultivar('virginia_peanut')).toBeDefined()
    })

    it('all cultivars have valid oil content ranges', () => {
      for (const cultivar of Object.values(NUT_CULTIVARS)) {
        expect(cultivar.minOilPct).toBeLessThan(cultivar.maxOilPct)
        expect(cultivar.baseOilPct).toBeGreaterThanOrEqual(cultivar.minOilPct)
        expect(cultivar.baseOilPct).toBeLessThanOrEqual(cultivar.maxOilPct)
      }
    })

    it('tree nuts have GDD or calendar harvest method', () => {
      for (const cultivar of Object.values(NUT_CULTIVARS)) {
        if (cultivar.nutType === 'tree_nut') {
          expect(['shaking', 'hand_harvest', 'calendar']).toContain(
            cultivar.harvestMethod
          )
        }
      }
    })
  })

  describe('Oil Content Tier Classification', () => {
    it('classifies generic oil content correctly', () => {
      expect(getOilContentTier(75).tier).toBe('artisan')
      expect(getOilContentTier(70).tier).toBe('premium')
      expect(getOilContentTier(65).tier).toBe('standard')
      expect(getOilContentTier(55).tier).toBe('commodity')
    })

    it('classifies relative to cultivar potential', () => {
      const pecan = getNutCultivar('desirable_pecan')!
      const almond = getNutCultivar('nonpareil_almond')!

      // 70% is artisan for almond (way above max) but standard for pecan
      expect(getOilContentTier(70, almond).tier).toBe('artisan')

      // 53% is artisan for almond (at base) but commodity for pecan
      expect(getOilContentTier(53, almond).tier).toMatch(/premium|standard/)
      expect(getOilContentTier(53, pecan).tier).toBe('commodity')
    })
  })

  describe('Seafood Predictor', () => {
    describe('Routing', () => {
      it('routes seafood predictions to seafood predictor', () => {
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'wild_salmon',
          sourceType: 'wild_caught',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.type).toBe('omega_3')
        expect(result.modelInfo.category).toBe('seafood')
        expect(result.modelInfo.validationStatus).toBe('inferred')
      })
    })

    describe('Omega-3 Content by Species', () => {
      it('mackerel has highest omega-3 content (~2500-3000mg)', () => {
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'atlantic_mackerel',
          sourceType: 'wild_caught',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(2500)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(3200)
        expect(result.qualityTier).toBe('artisan')
      })

      it('wild salmon has high omega-3 content (~1500-2200mg)', () => {
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'wild_salmon',
          sourceType: 'wild_caught',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(1500)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(2400)
        expect(result.qualityTier).toBe('artisan')
      })

      it('tilapia has very low omega-3 content (<200mg)', () => {
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'tilapia',
          sourceType: 'farm_raised',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeLessThan(200)
        expect(result.qualityTier).toBe('commodity')
        // Should have warning about low omega-3
        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('low omega-3')
        )
      })

      it('cod is lean fish with moderate omega-3', () => {
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'cod',
          sourceType: 'wild_caught',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(200)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(400)
        expect(result.qualityTier).toBe('commodity')
      })
    })

    describe('Wild vs Farm-Raised Impact', () => {
      it('wild-caught has better omega profile than farmed', () => {
        const wildInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'farmed_salmon',
          sourceType: 'wild_caught',
        }

        const farmedInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'farmed_salmon',
          sourceType: 'farm_raised',
        }

        const wildResult = predictUnified(wildInput)
        const farmedResult = predictUnified(farmedInput)

        // Wild should have higher omega-3
        expect(wildResult.primaryMetric.value).toBeGreaterThan(
          farmedResult.primaryMetric.value
        )
      })

      it('farm-raised warnings about omega-6 ratio', () => {
        // Use tilapia which has omega ratio > 1 (farmed: 3.0)
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'tilapia',
          sourceType: 'farm_raised',
        }

        const result = predictUnified(input)

        // Should warn about higher omega-6 ratio
        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('omega-6')
        )
      })

      it('fish-based feed improves farmed omega-3', () => {
        const grainFedInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'rainbow_trout',
          sourceType: 'farm_raised',
          farmFeedType: 'soy-based',
        }

        const fishFedInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'rainbow_trout',
          sourceType: 'farm_raised',
          farmFeedType: 'fish meal',
        }

        const grainResult = predictUnified(grainFedInput)
        const fishResult = predictUnified(fishFedInput)

        expect(fishResult.primaryMetric.value).toBeGreaterThan(
          grainResult.primaryMetric.value
        )
      })
    })

    describe('Seasonal Variation', () => {
      it('cold water season increases omega-3 content', () => {
        const summerInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'herring',
          sourceType: 'wild_caught',
          catchSeason: '7', // July
        }

        const winterInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'herring',
          sourceType: 'wild_caught',
          catchSeason: '12', // December (cold water)
        }

        const summerResult = predictUnified(summerInput)
        const winterResult = predictUnified(winterInput)

        expect(winterResult.primaryMetric.value).toBeGreaterThan(
          summerResult.primaryMetric.value
        )
        expect(winterResult.ripen.insights).toContainEqual(
          expect.stringContaining('Cold water')
        )
      })
    })

    describe('Lab Verification', () => {
      it('uses measured omega-3 when provided', () => {
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'wild_salmon',
          sourceType: 'wild_caught',
          measurements: {
            omega3ContentMg: 2100,
            labVerified: true,
          },
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBe(2100)
        expect(result.enrich.verified).toBe(true)
        expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      })
    })

    describe('SHARE Pillar Breakdown', () => {
      it('provides full SHARE breakdown for seafood', () => {
        const input: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'sardines',
          sourceType: 'wild_caught',
          regionId: 'pacific_northwest',
          catchSeason: '6',
          catchMethod: 'purse_seine',
        }

        const result = predictUnified(input)

        // Soil (water ecosystem)
        expect(result.soil.insights).toContainEqual(
          expect.stringContaining('Wild-caught')
        )

        // Heritage (species)
        expect(result.heritage.details.speciesId).toBe('sardines')

        // Agricultural (source type)
        expect(result.agricultural.details.sourceType).toBe('wild_caught')

        // Ripen (season)
        expect(result.ripen.details.catchSeason).toBe('6')

        // Enrich
        expect(result.enrich.details.primaryMetric.type).toBe('omega_3')
      })
    })

    describe('Confidence Calculation', () => {
      it('higher confidence with more input data', () => {
        const minimalInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'cod',
          sourceType: 'wild_caught',
        }

        const fullInput: SeafoodPredictionInput = {
          ...minimalInput,
          sourceType: 'wild_caught',
          catchSeason: '11',
          catchMethod: 'line_caught',
          measurements: {
            omega3ContentMg: 290,
            labVerified: true,
          },
        }

        const minimalResult = predictUnified(minimalInput)
        const fullResult = predictUnified(fullInput)

        expect(fullResult.confidence).toBeGreaterThan(minimalResult.confidence)
      })

      it('unknown species reduces confidence', () => {
        const knownInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'wild_salmon',
          sourceType: 'wild_caught',
        }

        const unknownInput: SeafoodPredictionInput = {
          category: 'seafood',
          speciesId: 'unknown_fish',
          sourceType: 'wild_caught',
        }

        const knownResult = predictUnified(knownInput)
        const unknownResult = predictUnified(unknownInput)

        expect(knownResult.confidence).toBeGreaterThan(unknownResult.confidence)
        expect(unknownResult.modelInfo.warnings).toContainEqual(
          expect.stringContaining('Species not specified')
        )
      })
    })
  })

  describe('Seafood Species Database', () => {
    it('contains major seafood categories', () => {
      // Fatty fish
      expect(getSeafoodSpecies('atlantic_mackerel')).toBeDefined()
      expect(getSeafoodSpecies('wild_salmon')).toBeDefined()
      expect(getSeafoodSpecies('sardines')).toBeDefined()
      expect(getSeafoodSpecies('herring')).toBeDefined()

      // Lean fish
      expect(getSeafoodSpecies('cod')).toBeDefined()
      expect(getSeafoodSpecies('tilapia')).toBeDefined()

      // Shellfish
      expect(getSeafoodSpecies('shrimp')).toBeDefined()
      expect(getSeafoodSpecies('oysters')).toBeDefined()
      expect(getSeafoodSpecies('lobster')).toBeDefined()
    })

    it('all species have valid omega-3 ranges', () => {
      for (const species of Object.values(SEAFOOD_SPECIES)) {
        expect(species.omega3.wild.min).toBeLessThan(species.omega3.wild.max)
        expect(species.omega3.wild.typical).toBeGreaterThanOrEqual(species.omega3.wild.min)
        expect(species.omega3.wild.typical).toBeLessThanOrEqual(species.omega3.wild.max)
      }
    })

    it('fatty fish have omega-3 > 800mg', () => {
      const fattyFish = Object.values(SEAFOOD_SPECIES).filter(
        s => s.category === 'fatty_fish'
      )

      for (const fish of fattyFish) {
        expect(fish.omega3.wild.typical).toBeGreaterThan(800)
      }
    })
  })

  describe('Omega-3 Tier Classification', () => {
    it('classifies artisan tier correctly (≥1500mg)', () => {
      const result = getOmega3Tier(1800)
      expect(result.tier).toBe('artisan')
      expect(result.description).toContain('Exceptional')
    })

    it('classifies premium tier correctly (800-1500mg)', () => {
      const result = getOmega3Tier(1000)
      expect(result.tier).toBe('premium')
      expect(result.description).toContain('High')
    })

    it('classifies standard tier correctly (400-800mg)', () => {
      const result = getOmega3Tier(600)
      expect(result.tier).toBe('standard')
      expect(result.description).toContain('Moderate')
    })

    it('classifies commodity tier correctly (<400mg)', () => {
      const result = getOmega3Tier(200)
      expect(result.tier).toBe('commodity')
      expect(result.description).toContain('Low')
    })
  })

  describe('Honey Predictor', () => {
    describe('Routing', () => {
      it('routes honey predictions to honey predictor', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'wildflower',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.type).toBe('diastase')
        expect(result.modelInfo.category).toBe('honey')
        expect(result.modelInfo.validationStatus).toBe('inferred')
      })
    })

    describe('Diastase by Varietal', () => {
      it('buckwheat honey has high diastase (~22 DN)', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'buckwheat',
          isRaw: true,
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(18)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(35)
        expect(result.qualityTier).toMatch(/artisan|premium/)
      })

      it('sourwood honey has high diastase (~20 DN)', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'sourwood',
          isRaw: true,
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(15)
        expect(result.qualityTier).toMatch(/artisan|premium/)
      })

      it('blended honey has lower diastase (~8 DN)', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'blended',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeLessThanOrEqual(15)
        // Should warn about blended honey
        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('Blended')
        )
      })
    })

    describe('Raw vs Processed Impact', () => {
      it('raw honey has higher diastase than processed', () => {
        const rawInput: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'clover',
          isRaw: true,
        }

        const processedInput: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'clover',
          isRaw: false,
        }

        const rawResult = predictUnified(rawInput)
        const processedResult = predictUnified(processedInput)

        expect(rawResult.primaryMetric.value).toBeGreaterThan(
          processedResult.primaryMetric.value
        )
      })

      it('raw status unknown triggers warning', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'wildflower',
          // isRaw not specified
        }

        const result = predictUnified(input)

        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('Raw/processed')
        )
      })

      it('raw honey has insight about enzyme retention', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'acacia',
          isRaw: true,
        }

        const result = predictUnified(input)

        expect(result.agricultural.insights).toContainEqual(
          expect.stringContaining('enzymes')
        )
      })
    })

    describe('Moisture Quality', () => {
      it('excellent moisture (≤17%) is best quality', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'tupelo',
          measurements: {
            moisturePct: 16.5,
            labVerified: true,
          },
        }

        const result = predictUnified(input)

        expect(result.enrich.insights).toContainEqual(
          expect.stringContaining('16.5%')
        )
      })

      it('high moisture (>20%) triggers fermentation warning', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'wildflower',
          measurements: {
            moisturePct: 21,
            labVerified: true,
          },
        }

        const result = predictUnified(input)

        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('fermentation')
        )
      })
    })

    describe('Premium Varietals', () => {
      it('manuka honey is premium varietal', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'manuka',
          isRaw: true,
        }

        const result = predictUnified(input)

        expect(result.heritage.details.isPremiumVarietal).toBe(true)
        expect(result.heritage.modifier).toBeGreaterThan(0)
      })

      it('tupelo honey is premium varietal', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'tupelo',
          isRaw: true,
        }

        const result = predictUnified(input)

        expect(result.heritage.details.isPremiumVarietal).toBe(true)
        expect(result.qualityTier).toMatch(/artisan|premium/)
      })
    })

    describe('Lab Verification', () => {
      it('uses measured diastase when provided', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'sourwood',
          measurements: {
            diastaseNumber: 25,
            labVerified: true,
          },
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBe(25)
        expect(result.enrich.verified).toBe(true)
        expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      })
    })

    describe('SHARE Pillar Breakdown', () => {
      it('provides full SHARE breakdown for honey', () => {
        const input: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'orange_blossom',
          regionId: 'florida',
          harvestSeason: 'spring',
          isRaw: true,
        }

        const result = predictUnified(input)

        // Soil (floral ecosystem)
        expect(result.soil.details.floralSource).toContain('Citrus')

        // Heritage (varietal)
        expect(result.heritage.details.varietalId).toBe('orange_blossom')

        // Agricultural (raw/processed)
        expect(result.agricultural.details.isRaw).toBe(true)

        // Ripen (harvest season)
        expect(result.ripen.details.harvestSeason).toBe('spring')

        // Enrich
        expect(result.enrich.details.primaryMetric.type).toBe('diastase')
      })
    })

    describe('Confidence Calculation', () => {
      it('higher confidence with more input data', () => {
        const minimalInput: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'clover',
        }

        const fullInput: HoneyPredictionInput = {
          ...minimalInput,
          isRaw: true,
          harvestSeason: 'early_summer',
          measurements: {
            diastaseNumber: 18,
            moisturePct: 17,
            labVerified: true,
          },
        }

        const minimalResult = predictUnified(minimalInput)
        const fullResult = predictUnified(fullInput)

        expect(fullResult.confidence).toBeGreaterThan(minimalResult.confidence)
      })

      it('unknown varietal reduces confidence', () => {
        const knownInput: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'tupelo',
          isRaw: true,
        }

        const unknownInput: HoneyPredictionInput = {
          category: 'honey',
          varietalType: 'unknown_type',
          isRaw: true,
        }

        const knownResult = predictUnified(knownInput)
        const unknownResult = predictUnified(unknownInput)

        expect(knownResult.confidence).toBeGreaterThan(unknownResult.confidence)
        expect(unknownResult.modelInfo.warnings).toContainEqual(
          expect.stringContaining('Varietal not specified')
        )
      })
    })
  })

  describe('Honey Varietal Database', () => {
    it('contains premium varietals', () => {
      expect(getHoneyVarietal('manuka')).toBeDefined()
      expect(getHoneyVarietal('tupelo')).toBeDefined()
      expect(getHoneyVarietal('sourwood')).toBeDefined()
      expect(getHoneyVarietal('acacia')).toBeDefined()
    })

    it('contains standard varietals', () => {
      expect(getHoneyVarietal('clover')).toBeDefined()
      expect(getHoneyVarietal('wildflower')).toBeDefined()
      expect(getHoneyVarietal('alfalfa')).toBeDefined()
    })

    it('all varietals have valid diastase ranges', () => {
      for (const varietal of Object.values(HONEY_VARIETALS)) {
        expect(varietal.typicalDiastase.min).toBeLessThan(varietal.typicalDiastase.max)
        expect(varietal.typicalDiastase.typical).toBeGreaterThanOrEqual(
          varietal.typicalDiastase.min
        )
        expect(varietal.typicalDiastase.typical).toBeLessThanOrEqual(
          varietal.typicalDiastase.max
        )
      }
    })

    it('premium varietals are flagged correctly', () => {
      const premiumVarietals = Object.values(HONEY_VARIETALS).filter(
        v => v.isPremiumVarietal
      )

      expect(premiumVarietals.length).toBeGreaterThan(5)
      for (const varietal of premiumVarietals) {
        expect(varietal.qualityTier).toMatch(/artisan|premium/)
      }
    })
  })

  describe('Diastase Tier Classification', () => {
    it('classifies artisan tier correctly (≥20 DN)', () => {
      const result = getDiastaseTier(25)
      expect(result.tier).toBe('artisan')
      expect(result.description).toContain('truly raw')
    })

    it('classifies premium tier correctly (12-20 DN)', () => {
      const result = getDiastaseTier(15)
      expect(result.tier).toBe('premium')
      expect(result.description).toContain('minimally processed')
    })

    it('classifies standard tier correctly (8-12 DN)', () => {
      const result = getDiastaseTier(10)
      expect(result.tier).toBe('standard')
    })

    it('classifies commodity tier correctly (<8 DN)', () => {
      const result = getDiastaseTier(5)
      expect(result.tier).toBe('commodity')
      expect(result.description).toContain('processed')
    })
  })

  describe('Moisture Quality Classification', () => {
    it('classifies excellent moisture (≤17%)', () => {
      const result = getMoistureQuality(16)
      expect(result.quality).toBe('excellent')
      expect(result.fermentationRisk).toBe(false)
    })

    it('classifies good moisture (≤18.6%)', () => {
      const result = getMoistureQuality(18)
      expect(result.quality).toBe('good')
      expect(result.fermentationRisk).toBe(false)
    })

    it('classifies acceptable moisture (≤20%)', () => {
      const result = getMoistureQuality(19.5)
      expect(result.quality).toBe('acceptable')
      expect(result.fermentationRisk).toBe(false)
    })

    it('classifies poor moisture (>20%)', () => {
      const result = getMoistureQuality(21)
      expect(result.quality).toBe('poor')
      expect(result.fermentationRisk).toBe(true)
    })
  })

  describe('Coffee Predictor (Transformation)', () => {
    describe('Routing', () => {
      it('routes coffee predictions to transformation predictor', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
          originRegion: 'colombia_huila',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.type).toBe('cupping_score')
        expect(result.modelInfo.category).toBe('transformed')
        expect(result.modelInfo.validationStatus).toBe('inferred')
      })

      it('uses placeholder for non-coffee transformed products', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'tea',
        }

        const result = predictUnified(input)

        expect(result.modelInfo.validationStatus).toBe('placeholder')
        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('not yet implemented')
        )
      })
    })

    describe('Cupping Score by Variety', () => {
      it('gesha has highest cupping potential (86-96 SCA)', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'gesha',
          originRegion: 'panama_boquete',
          processingMethod: 'washed',
          roastLevel: 'light',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(88)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(99)
        expect(result.qualityTier).toBe('artisan')
      })

      it('ethiopian heirloom has excellent cupping potential', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'ethiopian_heirloom',
          originRegion: 'ethiopia_yirgacheffe',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(86)
        expect(result.qualityTier).toBe('artisan')
      })

      it('bourbon has premium cupping potential (82-90 SCA)', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
          originRegion: 'guatemala_antigua',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(80)
        expect(result.primaryMetric.value).toBeLessThanOrEqual(92)
        expect(result.qualityTier).toMatch(/artisan|premium/)
      })

      it('robusta scores lower than arabica', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'robusta',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeLessThan(80)
        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('Robusta')
        )
      })
    })

    describe('Origin Impact on Quality', () => {
      it('artisan origins boost cupping score', () => {
        const artisanInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'caturra',
          originRegion: 'ethiopia_yirgacheffe',
        }

        const standardInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'caturra',
          originRegion: 'brazil_cerrado',
        }

        const artisanResult = predictUnified(artisanInput)
        const standardResult = predictUnified(standardInput)

        expect(artisanResult.primaryMetric.value).toBeGreaterThan(
          standardResult.primaryMetric.value
        )
      })

      it('high altitude origins noted in Soil pillar', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'sl28',
          originRegion: 'kenya_nyeri',
        }

        const result = predictUnified(input)

        expect(result.soil.insights).toContainEqual(
          expect.stringContaining('Altitude')
        )
      })
    })

    describe('Processing Method Impact', () => {
      it('natural processing adds sweetness and body', () => {
        const washedInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
          processingMethod: 'washed',
        }

        const naturalInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
          processingMethod: 'natural',
        }

        const washedResult = predictUnified(washedInput)
        const naturalResult = predictUnified(naturalInput)

        // Natural processing typically adds 1 point
        expect(naturalResult.primaryMetric.value).toBeGreaterThan(
          washedResult.primaryMetric.value
        )
        expect(naturalResult.agricultural.insights).toContainEqual(
          expect.stringContaining('Natural')
        )
      })

      it('experimental processing is flagged as high-risk', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
          processingMethod: 'anaerobic',
        }

        const result = predictUnified(input)

        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('high-risk')
        )
      })
    })

    describe('Roast Level Impact', () => {
      it('light roast preserves origin character', () => {
        const lightInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'gesha',
          originRegion: 'panama_boquete',
          roastLevel: 'light',
        }

        const darkInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'gesha',
          originRegion: 'panama_boquete',
          roastLevel: 'dark',
        }

        const lightResult = predictUnified(lightInput)
        const darkResult = predictUnified(darkInput)

        // Dark roast degrades score
        expect(lightResult.primaryMetric.value).toBeGreaterThan(
          darkResult.primaryMetric.value
        )
      })

      it('dark roast on artisan coffee triggers warning', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'gesha',
          roastLevel: 'dark',
        }

        const result = predictUnified(input)

        expect(result.modelInfo.warnings).toContainEqual(
          expect.stringContaining('masks')
        )
      })
    })

    describe('Lab Verification', () => {
      it('uses measured cupping score when provided', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
          measurements: {
            cuppingScore: 87.5,
          },
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBe(87.5)
        expect(result.enrich.verified).toBe(true)
        expect(result.confidence).toBeGreaterThanOrEqual(0.8)
      })

      it('includes secondary metrics when provided', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'ethiopian_heirloom',
          measurements: {
            cuppingScore: 90,
            acidity: 8.5,
            body: 7.0,
          },
        }

        const result = predictUnified(input)

        expect(result.enrich.details.secondaryMetrics).toContainEqual(
          expect.objectContaining({ name: 'Acidity', value: 8.5 })
        )
      })
    })

    describe('SHARE Pillar Breakdown', () => {
      it('provides full SHARE breakdown for coffee', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'sl28',
          originRegion: 'kenya_nyeri',
          processingMethod: 'washed',
          roastLevel: 'medium_light',
        }

        const result = predictUnified(input)

        // Soil (terroir)
        expect(result.soil.details.regionId).toBe('kenya_nyeri')
        expect(result.soil.insights).toContainEqual(
          expect.stringContaining('Kenya')
        )

        // Heritage (variety)
        expect(result.heritage.details.cultivarId).toBe('sl28')
        expect(result.heritage.insights).toContainEqual(
          expect.stringContaining('SL28')
        )

        // Agricultural (processing)
        expect(result.agricultural.insights).toContainEqual(
          expect.stringContaining('Washed')
        )

        // Ripen (harvest)
        expect(result.ripen.insights).toContainEqual(
          expect.stringContaining('cherry')
        )

        // Enrich
        expect(result.enrich.details.primaryMetric.type).toBe('cupping_score')
      })
    })

    describe('Confidence Calculation', () => {
      it('higher confidence with more input data', () => {
        const minimalInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
        }

        const fullInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
          originRegion: 'colombia_huila',
          processingMethod: 'washed',
          roastLevel: 'medium',
          measurements: {
            cuppingScore: 85,
          },
        }

        const minimalResult = predictUnified(minimalInput)
        const fullResult = predictUnified(fullInput)

        expect(fullResult.confidence).toBeGreaterThan(minimalResult.confidence)
      })

      it('unknown variety reduces confidence', () => {
        const knownInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'bourbon',
        }

        const unknownInput: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'unknown_variety',
        }

        const knownResult = predictUnified(knownInput)
        const unknownResult = predictUnified(unknownInput)

        expect(knownResult.confidence).toBeGreaterThan(unknownResult.confidence)
        expect(unknownResult.modelInfo.warnings).toContainEqual(
          expect.stringContaining('Variety not specified')
        )
      })
    })

    describe('Specialty Grade Threshold', () => {
      it('80+ SCA is specialty grade', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'caturra',
          originRegion: 'costa_rica_tarrazu',
          processingMethod: 'honey',
        }

        const result = predictUnified(input)

        expect(result.primaryMetric.value).toBeGreaterThanOrEqual(80)
        expect(result.enrich.insights).toContainEqual(
          expect.stringContaining('specialty')
        )
      })

      it('below 80 SCA is commercial grade', () => {
        const input: TransformedPredictionInput = {
          category: 'transformed',
          productType: 'coffee',
          variety: 'catimor',
          originRegion: 'brazil_cerrado',
        }

        const result = predictUnified(input)

        // Catimor typically scores 74-82, may fall below specialty
        if (result.primaryMetric.value < 80) {
          expect(result.enrich.insights).toContainEqual(
            expect.stringContaining('commercial')
          )
        }
      })
    })
  })

  describe('Coffee Variety Database', () => {
    it('contains premium heirloom varieties', () => {
      expect(getCoffeeVariety('gesha')).toBeDefined()
      expect(getCoffeeVariety('bourbon')).toBeDefined()
      expect(getCoffeeVariety('typica')).toBeDefined()
      expect(getCoffeeVariety('ethiopian_heirloom')).toBeDefined()
    })

    it('contains quality selections', () => {
      expect(getCoffeeVariety('sl28')).toBeDefined()
      expect(getCoffeeVariety('sl34')).toBeDefined()
      expect(getCoffeeVariety('pacamara')).toBeDefined()
    })

    it('all varieties have valid cupping potential ranges', () => {
      for (const variety of Object.values(COFFEE_VARIETIES)) {
        expect(variety.cuppingPotential.min).toBeLessThan(variety.cuppingPotential.max)
        expect(variety.cuppingPotential.typical).toBeGreaterThanOrEqual(
          variety.cuppingPotential.min
        )
        expect(variety.cuppingPotential.typical).toBeLessThanOrEqual(
          variety.cuppingPotential.max
        )
      }
    })

    it('heirloom varieties have highest quality tiers', () => {
      const heirlooms = Object.values(COFFEE_VARIETIES).filter(
        v => v.heritageIntent === 'heirloom' && v.species === 'arabica'
      )

      for (const variety of heirlooms) {
        expect(variety.qualityTier).toMatch(/artisan|premium/)
      }
    })
  })

  describe('Coffee Origin Database', () => {
    it('contains major coffee origins', () => {
      expect(getCoffeeOrigin('ethiopia_yirgacheffe')).toBeDefined()
      expect(getCoffeeOrigin('kenya_nyeri')).toBeDefined()
      expect(getCoffeeOrigin('panama_boquete')).toBeDefined()
      expect(getCoffeeOrigin('colombia_huila')).toBeDefined()
      expect(getCoffeeOrigin('guatemala_antigua')).toBeDefined()
    })

    it('all origins have valid altitude ranges', () => {
      for (const origin of Object.values(COFFEE_ORIGINS)) {
        expect(origin.altitude.min).toBeLessThan(origin.altitude.max)
        expect(origin.altitude.min).toBeGreaterThan(0)
      }
    })

    it('high-altitude origins are artisan tier', () => {
      const highAltitude = Object.values(COFFEE_ORIGINS).filter(
        o => o.altitude.max >= 2000
      )

      expect(highAltitude.length).toBeGreaterThan(3)
      for (const origin of highAltitude) {
        expect(origin.qualityTier).toMatch(/artisan|premium/)
      }
    })
  })

  describe('Processing Method Database', () => {
    it('contains all major processing methods', () => {
      expect(getProcessingMethod('washed')).toBeDefined()
      expect(getProcessingMethod('natural')).toBeDefined()
      expect(getProcessingMethod('honey')).toBeDefined()
      expect(getProcessingMethod('anaerobic')).toBeDefined()
    })

    it('all processing methods have valid modifiers', () => {
      for (const method of Object.values(PROCESSING_METHODS)) {
        expect(method.cuppingModifier).toBeGreaterThanOrEqual(-1)
        expect(method.cuppingModifier).toBeLessThanOrEqual(2)
      }
    })
  })

  describe('Roast Level Impact', () => {
    it('light roast has no negative modifier', () => {
      const light = getRoastLevel('light')
      expect(light?.cuppingModifier).toBe(0)
      expect(light?.preservesOrigin).toBe(true)
    })

    it('dark roast has negative modifier', () => {
      const dark = getRoastLevel('dark')
      expect(dark?.cuppingModifier).toBeLessThan(0)
      expect(dark?.preservesOrigin).toBe(false)
    })
  })

  describe('Cupping Score Tier Classification', () => {
    it('classifies outstanding (≥90 SCA)', () => {
      const result = getCuppingTier(92)
      expect(result.tier).toBe('artisan')
      expect(result.scaGrade).toBe('Outstanding')
    })

    it('classifies excellent (85-89.99 SCA)', () => {
      const result = getCuppingTier(87)
      expect(result.tier).toBe('artisan')
      expect(result.scaGrade).toBe('Excellent')
    })

    it('classifies very good (80-84.99 SCA)', () => {
      const result = getCuppingTier(82)
      expect(result.tier).toBe('premium')
      expect(result.scaGrade).toBe('Very Good')
    })

    it('classifies good (70-79.99 SCA)', () => {
      const result = getCuppingTier(75)
      expect(result.tier).toBe('standard')
      expect(result.scaGrade).toBe('Good')
    })

    it('classifies below specialty (<70 SCA)', () => {
      const result = getCuppingTier(65)
      expect(result.tier).toBe('commodity')
      expect(result.scaGrade).toBe('Below Specialty')
    })
  })
})
