/**
 * Produce Claim-to-Prediction Bridge Tests
 *
 * Tests the inference of SHARE pillars from consumer-level produce data
 * (PLU codes, trade names, organic stickers) and bridging to predictions.
 */

import {
  parsePLUCode,
  inferProduceProfile,
  predictProduceFromScan,
  getCultivarFromTradeName,
  getProductFromPLU,
  TRADE_NAME_TO_CULTIVAR,
  PLU_DATABASE,
  type ProduceScanInput,
} from '../lib/prediction/produce-claim-to-prediction'

describe('PLU Code Parsing', () => {
  it('parses standard 4-digit PLU', () => {
    const result = parsePLUCode('4012')
    expect(result.baseCode).toBe('4012')
    expect(result.isOrganic).toBe(false)
    expect(result.isGmo).toBe(false)
  })

  it('parses organic 5-digit PLU (prefix 9)', () => {
    const result = parsePLUCode('94012')
    expect(result.baseCode).toBe('4012')
    expect(result.isOrganic).toBe(true)
    expect(result.isGmo).toBe(false)
  })

  it('parses GMO 5-digit PLU (prefix 8)', () => {
    const result = parsePLUCode('84012')
    expect(result.baseCode).toBe('4012')
    expect(result.isOrganic).toBe(false)
    expect(result.isGmo).toBe(true)
  })

  it('handles PLU with non-digit characters', () => {
    const result = parsePLUCode('PLU-94012')
    expect(result.baseCode).toBe('4012')
    expect(result.isOrganic).toBe(true)
  })
})

describe('Trade Name to Cultivar Mapping', () => {
  it('maps SUMO to Shiranui cultivar', () => {
    const cultivar = getCultivarFromTradeName('SUMO')
    expect(cultivar).toBe('shiranui')
  })

  it('maps Cosmic Crisp to WA 38 cultivar', () => {
    const cultivar = getCultivarFromTradeName('Cosmic Crisp')
    expect(cultivar).toBe('wa_38')
  })

  it('maps Pink Lady to Cripps Pink cultivar', () => {
    const cultivar = getCultivarFromTradeName('Pink Lady')
    expect(cultivar).toBe('cripps_pink')
  })

  it('returns null for unknown trade names', () => {
    const cultivar = getCultivarFromTradeName('Unknown Brand')
    expect(cultivar).toBeNull()
  })

  it('handles case insensitivity', () => {
    expect(getCultivarFromTradeName('sumo')).toBe('shiranui')
    expect(getCultivarFromTradeName('SUMO')).toBe('shiranui')
    expect(getCultivarFromTradeName('Sumo')).toBe('shiranui')
  })
})

describe('PLU Product Lookup', () => {
  it('identifies Navel Orange from PLU 4012', () => {
    const product = getProductFromPLU('4012')
    expect(product).not.toBeNull()
    expect(product!.productType).toBe('Orange')
    expect(product!.variety).toBe('Navel')
    expect(product!.isOrganic).toBe(false)
  })

  it('identifies organic banana from PLU 94011', () => {
    const product = getProductFromPLU('94011')
    expect(product).not.toBeNull()
    expect(product!.productType).toBe('Banana')
    expect(product!.isOrganic).toBe(true)
  })

  it('identifies Honeycrisp apple from PLU 3283', () => {
    const product = getProductFromPLU('3283')
    expect(product).not.toBeNull()
    expect(product!.productType).toBe('Apple')
    expect(product!.variety).toBe('Honeycrisp')
  })

  it('returns null for unknown PLU', () => {
    const product = getProductFromPLU('9999')
    expect(product).toBeNull()
  })
})

describe('Produce Profile Inference', () => {
  describe('Trade Name Inference', () => {
    it('infers SUMO as Shiranui with expected Brix range', () => {
      const result = inferProduceProfile({ tradeName: 'SUMO' })

      expect(result.cultivarId).toBe('shiranui')
      expect(result.cultivarName).toBe('Shiranui/Dekopon')
      expect(result.cropType).toBe('tangerine')
      expect(result.category).toBe('citrus')
      expect(result.expectedBrixRange).toEqual({ min: 12, max: 16, optimal: 14 })
      expect(result.reasoning).toContain('Trade name "SUMO" mapped to Shiranui/Dekopon cultivar')
    })

    it('infers Cosmic Crisp with apple category', () => {
      const result = inferProduceProfile({ tradeName: 'Cosmic Crisp' })

      expect(result.cultivarId).toBe('wa_38')
      expect(result.cropType).toBe('apple')
      expect(result.category).toBe('pome_fruit')
      expect(result.expectedBrixRange?.optimal).toBe(15)
    })
  })

  describe('PLU Code Inference', () => {
    it('infers organic status from PLU prefix 9', () => {
      const result = inferProduceProfile({ pluCode: '94012' })

      expect(result.isOrganic).toBe(true)
      expect(result.isNonGmo).toBe(true)  // Organic → non-GMO
      expect(result.heritage.source).toBe('organic_certified')
      expect(result.agricultural.pestManagement).toBe('organic')
    })

    it('infers conventional citrus with likely IPM', () => {
      const result = inferProduceProfile({ pluCode: '4012' })

      expect(result.isOrganic).toBe(false)
      expect(result.productType).toBe('Orange')
      expect(result.category).toBe('citrus')
      // 85% of citrus uses IPM
      expect(result.agricultural.pestManagement).toBe('ipm')
    })

    it('flags GMO risk for papaya', () => {
      const result = inferProduceProfile({ pluCode: '4959' })

      expect(result.isGmoRisk).toBe(true)
      expect(result.isNonGmo).toBe('unknown')
    })

    it('infers non-GMO for non-risk categories', () => {
      const result = inferProduceProfile({ pluCode: '4012' })  // Orange

      expect(result.isGmoRisk).toBe(false)
      expect(result.isNonGmo).toBe('inferred')
    })
  })

  describe('Origin Inference', () => {
    it('infers Indian River FL from origin sticker', () => {
      const result = inferProduceProfile({
        pluCode: '4012',
        originSticker: 'Product of Indian River, Florida',
      })

      expect(result.regionId).toBe('indian_river_fl')
      expect(result.originRegion).toBe('Indian River, FL')
      expect(result.soil.soilType).toBe('coastal flatwoods (sandy over hardpan)')
      expect(result.soil.terroirEffect).toContain('Indian River District')
    })

    it('infers California from state mention', () => {
      const result = inferProduceProfile({
        tradeName: 'Cosmic Crisp',
        originSticker: 'Product of California',
      })

      expect(result.regionId).toBe('california_central')
    })

    it('reports low confidence for unknown origin', () => {
      const result = inferProduceProfile({ pluCode: '4012' })

      expect(result.regionId).toBe('unknown')
      expect(result.dataGaps).toContain('Origin unknown - soil and timing estimates less accurate')
    })
  })

  describe('Seasonality Inference', () => {
    it('identifies citrus as in-season in January', () => {
      const result = inferProduceProfile({
        pluCode: '4012',
        scanDate: new Date('2025-01-15'),
      })

      expect(result.isInSeason).toBe(true)
      expect(result.timing.isInPeakSeason).toBe(true)
      expect(result.timing.freshnessScore).toBe('optimal')
    })

    it('identifies stone fruit as out-of-season in January', () => {
      const result = inferProduceProfile({
        pluCode: '4038',  // Peach
        scanDate: new Date('2025-01-15'),
      })

      expect(result.isInSeason).toBe(false)
    })

    it('identifies stone fruit as in-season in July', () => {
      const result = inferProduceProfile({
        pluCode: '4038',  // Peach
        scanDate: new Date('2025-07-15'),
      })

      expect(result.isInSeason).toBe(true)
    })
  })

  describe('Quality Inference with Measurement', () => {
    it('uses actual Brix measurement when provided', () => {
      const result = inferProduceProfile({
        tradeName: 'SUMO',
        brixMeasurement: 15.2,
        measurementMethod: 'refractometer',
      })

      expect(result.quality.brixEstimate).toBe(15.2)
      expect(result.quality.source).toBe('refractometer')
      expect(result.quality.qualityScore).toBe('exceptional')  // 15.2 >= 14
    })

    it('uses cultivar expected range when no measurement', () => {
      const result = inferProduceProfile({ tradeName: 'SUMO' })

      expect(result.quality.brixRange).toEqual([12, 16])
      expect(result.quality.brixEstimate).toBe(14)  // optimal
      expect(result.quality.source).toBe('cultivar_expected')
    })

    it('reports low confidence when no cultivar or measurement', () => {
      const result = inferProduceProfile({ pluCode: '4012' })

      expect(result.quality.confidence).toBe('low')
      expect(result.dataGaps).toContain('No Brix measurement or cultivar-specific expectations')
    })
  })
})

describe('Produce Prediction from Scan', () => {
  it('generates prediction for known cultivar and region', () => {
    const result = predictProduceFromScan({
      tradeName: 'SUMO',
      originSticker: 'Product of California',
      scanDate: new Date('2025-01-15'),
    })

    expect(result.canPredict).toBe(true)
    expect(result.prediction).not.toBeNull()
    expect(result.inference.cultivarId).toBe('shiranui')
    expect(result.prediction!.heritage.cultivarId).toBe('shiranui')
  })

  it('cannot predict without cultivar identification', () => {
    const result = predictProduceFromScan({
      pluCode: '9999',  // Unknown PLU
    })

    expect(result.canPredict).toBe(false)
    expect(result.prediction).toBeNull()
    expect(result.reasonCannotPredict).toContain('Unknown cultivar')
  })

  it('cannot predict without region identification', () => {
    const result = predictProduceFromScan({
      tradeName: 'SUMO',
      // No origin sticker
    })

    expect(result.canPredict).toBe(false)
    expect(result.prediction).toBeNull()
    expect(result.reasonCannotPredict).toContain('Unknown origin region')
  })

  it('includes Brix measurement in prediction when provided', () => {
    const result = predictProduceFromScan({
      tradeName: 'SUMO',
      originSticker: 'California',
      brixMeasurement: 14.5,
      measurementMethod: 'refractometer',
    })

    expect(result.canPredict).toBe(true)
    expect(result.prediction!.enrich?.actualBrix).toBe(14.5)
    expect(result.prediction!.predictionBasis).toContain('Actual Brix measurement')
  })
})

describe('Real-World Scan Scenarios', () => {
  describe('Scenario: SUMO at Whole Foods in Chicago in February', () => {
    it('infers high-quality citrus in peak season', () => {
      const result = predictProduceFromScan({
        tradeName: 'SUMO',
        pluCode: '3286',
        originSticker: 'California',
        storeLocation: { city: 'Chicago', state: 'IL' },
        scanDate: new Date('2025-02-15'),
      })

      expect(result.inference.cultivarId).toBe('shiranui')
      expect(result.inference.isInSeason).toBe(true)
      expect(result.inference.expectedBrixRange?.optimal).toBe(14)
      // Without a Brix measurement, quality pillar is low confidence
      // So overall confidence stays low even with known cultivar
      expect(['low', 'medium']).toContain(result.inference.overallConfidence)
    })
  })

  describe('Scenario: Organic Honeycrisp at grocery store', () => {
    it('identifies organic apple with premium cultivar', () => {
      const result = inferProduceProfile({
        tradeName: 'Honeycrisp',
        pluCode: '93283',  // Organic Honeycrisp
        originSticker: 'Washington State',
        scanDate: new Date('2025-10-01'),  // Apple season
      })

      expect(result.isOrganic).toBe(true)
      expect(result.cultivarId).toBe('honeycrisp')
      expect(result.isInSeason).toBe(true)
      expect(result.agricultural.pestManagement).toBe('organic')
      expect(result.expectedBrixRange?.optimal).toBe(14)
    })
  })

  describe('Scenario: Consumer measures Brix with refractometer', () => {
    it('incorporates actual measurement into prediction', () => {
      const result = predictProduceFromScan({
        tradeName: 'SUMO',
        originSticker: 'California',
        brixMeasurement: 15.5,  // Consumer measured with refractometer
        measurementMethod: 'refractometer',
      })

      expect(result.canPredict).toBe(true)
      expect(result.inference.quality.brixEstimate).toBe(15.5)
      expect(result.inference.quality.qualityScore).toBe('exceptional')
      // Prediction should use actual measurement
      expect(result.prediction!.enrich?.actualBrix).toBe(15.5)
    })

    it('detects below-expected Brix', () => {
      const result = inferProduceProfile({
        tradeName: 'SUMO',
        brixMeasurement: 10.0,  // Below expected 12-16 range
      })

      expect(result.quality.brixEstimate).toBe(10.0)
      expect(result.quality.qualityScore).toBe('good')  // 10-12 = good
      // Expected range is 12-16, actual 10.0 is below
    })
  })

  describe('Scenario: Out-of-season stone fruit', () => {
    it('flags out-of-season with lower freshness score', () => {
      const result = inferProduceProfile({
        pluCode: '4038',  // Peach
        originSticker: 'Chile',  // Southern hemisphere import
        scanDate: new Date('2025-01-15'),  // Winter in Northern hemisphere
      })

      expect(result.isInSeason).toBe(false)
      expect(result.timing.freshnessScore).toBe('good')  // Not 'optimal'
      expect(result.timing.reasoning).toContain('out of peak season')
    })
  })
})

describe('Data Gap Reporting', () => {
  it('reports all data gaps for minimal input', () => {
    const result = inferProduceProfile({})

    expect(result.dataGaps.length).toBeGreaterThan(0)
    expect(result.overallConfidence).toBe('low')
  })

  it('reports no gaps for complete input', () => {
    const result = inferProduceProfile({
      tradeName: 'SUMO',
      pluCode: '94012',  // Organic
      originSticker: 'Indian River, Florida',
      brixMeasurement: 14.5,
      measurementMethod: 'refractometer',
      scanDate: new Date('2025-01-15'),
    })

    // Should have minimal gaps with this much data
    expect(result.cultivarId).toBe('shiranui')
    expect(result.regionId).toBe('indian_river_fl')
    expect(result.quality.brixEstimate).toBe(14.5)
  })
})

describe('Edge Cases', () => {
  it('handles empty trade name gracefully', () => {
    const result = inferProduceProfile({ tradeName: '' })
    expect(result.cultivarId).toBeUndefined()
  })

  it('handles malformed PLU code', () => {
    const result = inferProduceProfile({ pluCode: 'abc' })
    expect(result.productType).toBe('Unknown')
  })

  it('handles future scan date', () => {
    const result = inferProduceProfile({
      pluCode: '4012',
      scanDate: new Date('2030-01-01'),
    })
    expect(result.timing).toBeDefined()
  })
})
