/**
 * Livestock Omega Model Tests
 *
 * Tests the statistical model for predicting omega-6:omega-3 ratio
 * from SHARE pillar inputs (H, A, R).
 */

import {
  predictOmegaRatio,
  runAmericanWagyuScenarios,
  AMERICAN_WAGYU_SCENARIOS,
  type DietType,
} from '../lib/prediction/livestock-omega-model'

describe('American Wagyu Omega Prediction Model', () => {
  describe('Scenario Comparison', () => {
    it('demonstrates the SHARE pillar relationships with real data', () => {
      const results = runAmericanWagyuScenarios()

      console.log('\n' + '='.repeat(75))
      console.log(' AMERICAN WAGYU: Diet Sequence → Omega Ratio Prediction')
      console.log(' Model: E_omega = f(H_breed, A_diet_sequence, R_duration)')
      console.log('='.repeat(75))

      // H Pillar baseline
      console.log('\n┌─────────────────────────────────────────────────────────────────────────┐')
      console.log('│ H (Heritage Cultivars) - GENETIC BASELINE                               │')
      console.log('├─────────────────────────────────────────────────────────────────────────┤')
      console.log('│ American Wagyu breed baseline: 18:1 omega ratio                         │')
      console.log('│ (Genetics favor fat accumulation, including omega-6)                    │')
      console.log('│ Maturity target: 28 months                                              │')
      console.log('└─────────────────────────────────────────────────────────────────────────┘')

      console.log('\n┌─────────────────────────────────────────────────────────────────────────┐')
      console.log('│ SCENARIO RESULTS: Same Breed, Different A×R = Different E               │')
      console.log('├─────────────────────────────────────────────────────────────────────────┤')

      const scenarios = [
        { key: 'trueGrassFed', label: '1. True Grass-Fed (30mo grass only)' },
        { key: 'evergladesRanch', label: '2. EVERGLADES RANCH (18mo grass → 5mo pasture+grain)' },
        { key: 'grassFinished', label: '3. "Grass-fed" + grain finish (12mo grass + 6mo feedlot)' },
        { key: 'extendedGrain', label: '4. Luxury Wagyu (6mo grass + 12mo feedlot)' },
        { key: 'fullCAFO', label: '5. Commodity Beef (10mo grass + 8mo feedlot)' },
      ]

      for (const { key, label } of scenarios) {
        const result = results[key]
        console.log(`│                                                                         │`)
        console.log(`│ ${label.padEnd(55)}│`)
        console.log(`│   Predicted Ratio: ${result.predictedRatio.toFixed(1)}:1`.padEnd(74) + '│')
        console.log(`│   Tier: ${result.tier.toUpperCase()} - ${result.tierDescription.substring(0, 40)}`.padEnd(74) + '│')
        console.log(`│   95% CI: [${result.confidenceInterval.low.toFixed(1)}, ${result.confidenceInterval.high.toFixed(1)}]`.padEnd(74) + '│')
        console.log(`│   Finishing Diet: ${result.breakdown.A.finishingDiet} (baseline ${result.breakdown.A.finishingOmegaBaseline}:1)`.padEnd(74) + '│')
        console.log('│─────────────────────────────────────────────────────────────────────────│')
      }

      console.log('└─────────────────────────────────────────────────────────────────────────┘')

      console.log('\n┌─────────────────────────────────────────────────────────────────────────┐')
      console.log('│ KEY INSIGHT: FINISHING DIET DETERMINES OMEGA                            │')
      console.log('├─────────────────────────────────────────────────────────────────────────┤')
      console.log('│                                                                         │')
      console.log('│   FINISHING DIET              OMEGA RESULT                              │')
      console.log('│   ─────────────────────────────────────────────────────────────────     │')
      console.log('│   grass_only (pasture)        ~3:1 (exceptional) ✓                      │')
      console.log('│   pasture_grain_supplemented  ~6:1 (premium) ← EVERGLADES RANCH         │')
      console.log('│   grain_finished (feedlot)    ~12:1 (standard)                          │')
      console.log('│   grain_fed (full CAFO)       ~18:1 (commodity) ✗                       │')
      console.log('│                                                                         │')
      console.log('│   The LAST diet phase (finishing) = 75% of omega outcome                │')
      console.log('│   Everglades: Still on PASTURE during grain supplement = good omega     │')
      console.log('│   Snake River: In FEEDLOT during grain finish = poor omega              │')
      console.log('└─────────────────────────────────────────────────────────────────────────┘')
      console.log('')

      // Verify ordering makes sense
      expect(results.trueGrassFed.predictedRatio).toBeLessThan(results.evergladesRanch.predictedRatio)
      expect(results.evergladesRanch.predictedRatio).toBeLessThan(results.grassFinished.predictedRatio)
      expect(results.grassFinished.predictedRatio).toBeLessThan(results.fullCAFO.predictedRatio)  // Commodity
      // KEY INSIGHT: Luxury Wagyu (extendedGrain) is WORSE than commodity beef!
      // Extended grain finishing (12mo = 50% of life) > commodity (8mo = 33% of life)
      expect(results.fullCAFO.predictedRatio).toBeLessThan(results.extendedGrain.predictedRatio)
    })
  })

  describe('Model Behavior', () => {
    it('true grass-fed should achieve good omega ratio despite Wagyu genetics', () => {
      const result = predictOmegaRatio(AMERICAN_WAGYU_SCENARIOS.trueGrassFed)

      // Should be in premium or exceptional tier
      expect(['exceptional', 'premium']).toContain(result.tier)
      expect(result.predictedRatio).toBeLessThan(8)
      expect(result.breakdown.H.breedName).toBe('American Wagyu')
      expect(result.breakdown.A.finishingDiet).toBe('grass_only')  // Grass finishing = good
      expect(result.breakdown.A.finishingOmegaBaseline).toBe(3)    // Grass baseline
    })

    it('extended grain feeding should produce worst omega despite premium price', () => {
      const result = predictOmegaRatio(AMERICAN_WAGYU_SCENARIOS.extendedGrain)

      expect(result.tier).toBe('commodity')
      expect(result.predictedRatio).toBeGreaterThan(12)
      expect(result.breakdown.A.finishingDiet).toBe('grain_fed')   // Grain finishing = bad
      expect(result.breakdown.A.finishingOmegaBaseline).toBe(22)   // Grain baseline (calibrated to Snake River = 26:1)
    })

    it('grass-finished should be middle ground', () => {
      const result = predictOmegaRatio(AMERICAN_WAGYU_SCENARIOS.grassFinished)

      // Better than extended grain, worse than true grass-fed
      expect(result.predictedRatio).toBeGreaterThan(
        predictOmegaRatio(AMERICAN_WAGYU_SCENARIOS.trueGrassFed).predictedRatio
      )
      expect(result.predictedRatio).toBeLessThan(
        predictOmegaRatio(AMERICAN_WAGYU_SCENARIOS.extendedGrain).predictedRatio
      )
    })

    it('maturity factor should affect prediction', () => {
      // Same diet, different harvest age
      const matureResult = predictOmegaRatio({
        breedId: 'american_wagyu',
        dietSequence: [
          { dietType: 'grass_only' as DietType, durationMonths: 28 },
        ],
        ageAtHarvestMonths: 28,  // Fully mature
      })

      const youngResult = predictOmegaRatio({
        breedId: 'american_wagyu',
        dietSequence: [
          { dietType: 'grass_only' as DietType, durationMonths: 18 },
        ],
        ageAtHarvestMonths: 18,  // Young, not fully mature
      })

      // Mature animal should express more of the diet benefit
      expect(matureResult.breakdown.R.maturityFactor).toBeGreaterThan(youngResult.breakdown.R.maturityFactor)
      expect(matureResult.breakdown.R.isFullyMature).toBe(true)
      expect(youngResult.breakdown.R.isFullyMature).toBe(false)
    })

    it('should provide uncertainty bounds', () => {
      const result = predictOmegaRatio(AMERICAN_WAGYU_SCENARIOS.trueGrassFed)

      expect(result.confidenceInterval.low).toBeLessThan(result.predictedRatio)
      expect(result.confidenceInterval.high).toBeGreaterThan(result.predictedRatio)
      expect(result.confidence).toBe('high')  // Good breed + complete history
    })

    it('should flag unknown breed with increased uncertainty', () => {
      const result = predictOmegaRatio({
        breedId: 'unknown_breed',
        dietSequence: [
          { dietType: 'grass_only' as DietType, durationMonths: 24 },
        ],
        ageAtHarvestMonths: 24,
      })

      expect(result.dataQuality).toContain('Unknown breed - using default baseline')
      expect(result.confidence).toBe('low')
      // Uncertainty should be wider
      const spread = result.confidenceInterval.high - result.confidenceInterval.low
      expect(spread).toBeGreaterThan(4)  // Wider than normal
    })
  })

  describe('SHARE Pillar Breakdown', () => {
    it('should provide clear H, A, R breakdown', () => {
      const result = predictOmegaRatio(AMERICAN_WAGYU_SCENARIOS.extendedGrain)

      console.log('\n' + '='.repeat(65))
      console.log(' SHARE Pillar Breakdown: Extended Grain Wagyu')
      console.log('='.repeat(65))

      console.log('\n│ H (Heritage): Breed characteristics')
      console.log(`│   Breed: ${result.breakdown.H.breedName}`)
      console.log(`│   Marbling Potential: ${result.breakdown.H.marblingPotential}/12`)
      console.log(`│   Note: ${result.breakdown.H.note}`)

      console.log('\n│ A (Agricultural): Diet sequence → finishing diet dominates')
      console.log(`│   Finishing Diet: ${result.breakdown.A.finishingDiet}`)
      console.log(`│   Finishing Omega Baseline: ${result.breakdown.A.finishingOmegaBaseline}:1`)
      console.log(`│   Early Diet Average: ${result.breakdown.A.earlyDietAverage}:1`)
      console.log('│   Phases:')
      for (const phase of result.breakdown.A.phases) {
        console.log(`│     - ${phase.dietType}: ${phase.durationMonths}mo (weight: ${phase.weight.toFixed(2)})`)
      }

      console.log('\n│ R (Ripen): Maturity')
      console.log(`│   Age at harvest: ${result.breakdown.R.ageAtHarvest} months`)
      console.log(`│   Maturity factor: ${result.breakdown.R.maturityFactor}`)
      console.log(`│   Fully mature: ${result.breakdown.R.isFullyMature}`)

      console.log('\n│ E (Enrich): Final prediction')
      console.log(`│   Predicted ratio: ${result.predictedRatio}:1`)
      console.log(`│   Tier: ${result.tier}`)
      console.log('')

      // Verify structure
      expect(result.breakdown.H).toBeDefined()
      expect(result.breakdown.H.breedName).toBe('American Wagyu')
      expect(result.breakdown.A).toBeDefined()
      expect(result.breakdown.A.finishingDiet).toBe('grain_fed')
      expect(result.breakdown.R).toBeDefined()
      expect(result.breakdown.A.phases.length).toBe(3)  // milk, grass, grain
    })
  })
})

describe('Cross-Breed Comparison', () => {
  it('demonstrates that DIET (not breed) determines omega ratio', () => {
    const grassDiet = [
      { dietType: 'milk' as DietType, durationMonths: 6 },
      { dietType: 'grass_only' as DietType, durationMonths: 24 },
    ]

    const breeds = ['galloway', 'devon', 'angus', 'american_wagyu', 'japanese_wagyu']
    const results = breeds.map(breedId => ({
      breedId,
      result: predictOmegaRatio({
        breedId,
        dietSequence: grassDiet,
        ageAtHarvestMonths: 30,
      }),
    }))

    console.log('\n' + '='.repeat(75))
    console.log(' Same Diet (30mo grass), Different Breeds')
    console.log(' DIET determines omega ratio. Breed affects fat AMOUNT (marbling), not composition.')
    console.log('='.repeat(75))
    console.log('')
    console.log(' Breed            | Marbling | Predicted | Tier       ')
    console.log(' ─────────────────┼──────────┼───────────┼────────────')

    for (const { breedId, result } of results) {
      const marbling = result.breakdown.H.marblingPotential.toString().padStart(2)
      console.log(` ${breedId.padEnd(17)}| ${marbling}/12     | ${result.predictedRatio.toFixed(1).padStart(5)}:1   | ${result.tier}`)
    }
    console.log('')
    console.log(' KEY INSIGHT: Same diet = SAME omega ratio regardless of breed')
    console.log(' - All breeds on grass achieve ~3:1 (the grass diet baseline)')
    console.log(' - Wagyu has MORE fat at that ratio (higher marbling)')
    console.log(' - But fat COMPOSITION is identical because diet is identical')
    console.log(' - PROOF: Snake River (26:1) vs Everglades Ranch (6:1) = SAME Wagyu genetics, DIFFERENT diet')
    console.log('')

    // KEY INSIGHT: Same diet = SAME omega ratios regardless of breed
    // All should achieve similar ratios because diet is the only determinant
    const baseRatio = results[0].result.predictedRatio
    for (const { result } of results) {
      expect(result.predictedRatio).toBe(baseRatio)  // All breeds = same ratio on same diet
      expect(['exceptional', 'premium']).toContain(result.tier)
    }

    // Breed affects marbling (fat AMOUNT), not composition (omega ratio)
    const wagyuMarbling = results.find(r => r.breedId === 'american_wagyu')?.result.breakdown.H.marblingPotential ?? 0
    const angusMarbling = results.find(r => r.breedId === 'angus')?.result.breakdown.H.marblingPotential ?? 0
    expect(wagyuMarbling).toBeGreaterThan(angusMarbling)  // Wagyu has more fat, but same omega ratio
  })
})
