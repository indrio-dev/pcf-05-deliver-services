/**
 * Inference Edge Seed Data
 *
 * Creates inference relationships that allow the knowledge graph
 * to derive information from partial data.
 *
 * Examples:
 * - Organic certification implies non-GMO
 * - Heritage cultivars imply certain quality attributes
 * - Growing regions imply USDA zones
 * - Rootstock selection implies quality ceiling
 */

import { runWriteTransaction } from './neo4j'

// =============================================================================
// CERTIFICATION INFERENCES
// =============================================================================

export async function seedCertificationInferences(): Promise<void> {
  console.log('Creating certification inference edges...')

  // Organic implies Non-GMO (USDA organic standard requires non-GMO)
  await runWriteTransaction(`
    MERGE (organic:Certification {id: 'usda_organic'})
    SET organic.name = 'USDA Organic',
        organic.type = 'certification'
    MERGE (nonGmo:Certification {id: 'non_gmo'})
    SET nonGmo.name = 'Non-GMO',
        nonGmo.type = 'implied'
    MERGE (organic)-[:IMPLIES {
      reason: 'USDA organic certification prohibits GMO ingredients',
      confidence: 1.0
    }]->(nonGmo)
  `)

  // Certified Naturally Grown implies organic practices (without certification)
  await runWriteTransaction(`
    MERGE (cng:Certification {id: 'certified_naturally_grown'})
    SET cng.name = 'Certified Naturally Grown',
        cng.type = 'certification'
    MERGE (organicPractices:Certification {id: 'organic_practices'})
    SET organicPractices.name = 'Organic Practices',
        organicPractices.type = 'practice'
    MERGE (cng)-[:IMPLIES {
      reason: 'CNG follows USDA organic standards without certification',
      confidence: 0.95
    }]->(organicPractices)
  `)

  console.log('  ✓ Certification inferences')
}

// =============================================================================
// HERITAGE INTENT INFERENCES
// =============================================================================

export async function seedHeritageInferences(): Promise<void> {
  console.log('Creating heritage intent inference edges...')

  // Link heritage intent types to quality expectations
  await runWriteTransaction(`
    // True heritage cultivars are non-GMO (predate GMO technology)
    MATCH (c:Cultivar)
    WHERE c.heritageIntent IN ['true_heritage', 'heirloom_quality', 'heirloom_utility']
    SET c.isNonGMO = true,
        c.predatesGMO = true
  `)

  await runWriteTransaction(`
    // Quality-focused intents have higher Brix potential floor
    MATCH (c:Cultivar)
    WHERE c.heritageIntent IN ['true_heritage', 'heirloom_quality', 'modern_flavor', 'modern_nutrient']
    SET c.qualityFocused = true
  `)

  console.log('  ✓ Heritage intent inferences')
}

// =============================================================================
// GROWING REGION ↔ USDA ZONE INFERENCES
// =============================================================================

export async function seedZoneInferences(): Promise<void> {
  console.log('Creating zone inference edges...')

  // Link growing regions to their typical USDA zones
  const regionZones = [
    // Florida
    { regionId: 'indian_river_fl', zones: ['9b', '10a'] },
    { regionId: 'central_fl', zones: ['9a', '9b'] },
    { regionId: 'plant_city_fl', zones: ['9b'] },
    { regionId: 'south_fl', zones: ['10b', '11a'] },

    // California
    { regionId: 'central_valley_ca', zones: ['9a', '9b'] },
    { regionId: 'napa_valley_ca', zones: ['9a', '9b'] },
    { regionId: 'salinas_valley_ca', zones: ['9a', '9b'] },
    { regionId: 'southern_ca', zones: ['10a', '10b'] },

    // Texas
    { regionId: 'rio_grande_tx', zones: ['9b', '10a'] },
    { regionId: 'hill_country_tx', zones: ['8a', '8b'] },

    // Georgia
    { regionId: 'middle_ga', zones: ['8a', '8b'] },

    // Washington
    { regionId: 'yakima_valley_wa', zones: ['6b', '7a'] },
    { regionId: 'wenatchee_wa', zones: ['6a', '6b'] },

    // Michigan
    { regionId: 'traverse_city_mi', zones: ['5b', '6a'] },
    { regionId: 'southwest_mi', zones: ['5b', '6a'] },

    // New York
    { regionId: 'hudson_valley_ny', zones: ['5b', '6a'] },
    { regionId: 'finger_lakes_ny', zones: ['5b', '6a'] },

    // Oregon
    { regionId: 'willamette_valley_or', zones: ['8a', '8b'] },
    { regionId: 'hood_river_or', zones: ['6b', '7a'] },
  ]

  for (const { regionId, zones } of regionZones) {
    for (const zone of zones) {
      await runWriteTransaction(`
        MATCH (gr:GrowingRegion {id: $regionId})
        MATCH (z:USDAZone {zone: $zone})
        MERGE (gr)-[:TYPICALLY_IN_ZONE]->(z)
      `, { regionId, zone })
    }
  }

  console.log(`  ✓ ${regionZones.length} region→zone links`)
}

// =============================================================================
// CULTIVAR ↔ ZONE SUITABILITY INFERENCES
// =============================================================================

export async function seedCultivarZoneInferences(): Promise<void> {
  console.log('Creating cultivar→zone suitability edges...')

  // Citrus cultivars require zones 9+
  await runWriteTransaction(`
    MATCH (sc:Subcategory {id: 'citrus'})-[:HAS_PRODUCT_TYPE]->(pt)-[:HAS_VARIETY]->(v)-[:HAS_CULTIVAR]->(c:Cultivar)
    MATCH (z:USDAZone)
    WHERE z.minTempF >= 20  // Zone 9a and above
    MERGE (c)-[:SUITABLE_FOR_ZONE {
      suitability: 'recommended',
      reason: 'Citrus requires frost-free climate'
    }]->(z)
  `)

  // Stone fruit cultivars work in zones 5-8 (need chill hours but not extreme cold)
  await runWriteTransaction(`
    MATCH (sc:Subcategory {id: 'stone_fruit'})-[:HAS_PRODUCT_TYPE]->(pt)-[:HAS_VARIETY]->(v)-[:HAS_CULTIVAR]->(c:Cultivar)
    WHERE c.chillHoursRequired IS NOT NULL AND c.chillHoursRequired > 500
    MATCH (z:USDAZone)
    WHERE z.minTempF >= -20 AND z.minTempF <= 20  // Zones 5-8
    MERGE (c)-[:SUITABLE_FOR_ZONE {
      suitability: 'recommended',
      reason: 'Stone fruit needs adequate chill hours'
    }]->(z)
  `)

  // Low-chill peaches work in zones 8-9
  await runWriteTransaction(`
    MATCH (v:Variety {id: 'low_chill_peach'})-[:HAS_CULTIVAR]->(c:Cultivar)
    MATCH (z:USDAZone)
    WHERE z.minTempF >= 10 AND z.minTempF <= 25  // Zones 8-9
    MERGE (c)-[:SUITABLE_FOR_ZONE {
      suitability: 'recommended',
      reason: 'Low-chill peaches bred for warm climates'
    }]->(z)
  `)

  // Southern highbush blueberries work in zones 7-9
  await runWriteTransaction(`
    MATCH (v:Variety {id: 'southern_highbush'})-[:HAS_CULTIVAR]->(c:Cultivar)
    MATCH (z:USDAZone)
    WHERE z.minTempF >= 0 AND z.minTempF <= 25  // Zones 7-9
    MERGE (c)-[:SUITABLE_FOR_ZONE {
      suitability: 'recommended',
      reason: 'Southern highbush bred for low-chill regions'
    }]->(z)
  `)

  // Tropical fruit requires zone 10+
  await runWriteTransaction(`
    MATCH (sc:Subcategory {id: 'tropical'})-[:HAS_PRODUCT_TYPE]->(pt)-[:HAS_VARIETY]->(v)-[:HAS_CULTIVAR]->(c:Cultivar)
    MATCH (z:USDAZone)
    WHERE z.minTempF >= 30  // Zone 10a and above
    MERGE (c)-[:SUITABLE_FOR_ZONE {
      suitability: 'recommended',
      reason: 'Tropical fruit requires frost-free climate'
    }]->(z)
  `)

  console.log('  ✓ Cultivar→zone suitability edges')
}

// =============================================================================
// ROOTSTOCK QUALITY INFERENCES
// =============================================================================

export async function seedRootstockInferences(): Promise<void> {
  console.log('Creating rootstock quality inference edges...')

  // Create quality tier nodes for rootstocks
  await runWriteTransaction(`
    MERGE (premium:QualityTier {id: 'premium_rootstock'})
    SET premium.name = 'Premium Quality Rootstock',
        premium.brixModifierMin = 0.3,
        premium.description = 'Rootstocks that enhance fruit quality'

    MERGE (standard:QualityTier {id: 'standard_rootstock'})
    SET standard.name = 'Standard Quality Rootstock',
        standard.brixModifierMin = -0.2,
        standard.brixModifierMax = 0.3,
        standard.description = 'Neutral to slight quality impact'

    MERGE (yield:QualityTier {id: 'yield_rootstock'})
    SET yield.name = 'Yield-Focused Rootstock',
        yield.brixModifierMax = -0.2,
        yield.description = 'Rootstocks that prioritize yield over quality'
  `)

  // Link rootstocks to quality tiers
  await runWriteTransaction(`
    MATCH (r:Rootstock)
    WHERE r.brixModifier >= 0.3
    MATCH (tier:QualityTier {id: 'premium_rootstock'})
    MERGE (r)-[:HAS_QUALITY_TIER]->(tier)
  `)

  await runWriteTransaction(`
    MATCH (r:Rootstock)
    WHERE r.brixModifier >= -0.2 AND r.brixModifier < 0.3
    MATCH (tier:QualityTier {id: 'standard_rootstock'})
    MERGE (r)-[:HAS_QUALITY_TIER]->(tier)
  `)

  await runWriteTransaction(`
    MATCH (r:Rootstock)
    WHERE r.brixModifier < -0.2
    MATCH (tier:QualityTier {id: 'yield_rootstock'})
    MERGE (r)-[:HAS_QUALITY_TIER]->(tier)
  `)

  console.log('  ✓ Rootstock quality tier edges')
}

// =============================================================================
// FARM CERTIFICATION INFERENCES
// =============================================================================

export async function seedFarmCertificationInferences(): Promise<void> {
  console.log('Creating farm certification inference edges...')

  // Link farms with organic certification to certification nodes
  await runWriteTransaction(`
    MATCH (f:Farm)
    WHERE 'usda_organic' IN f.certifications
    MATCH (cert:Certification {id: 'usda_organic'})
    MERGE (f)-[:HAS_CERTIFICATION]->(cert)
  `)

  // Infer non-GMO for organic-certified farms
  await runWriteTransaction(`
    MATCH (f:Farm)-[:HAS_CERTIFICATION]->(:Certification {id: 'usda_organic'})
    SET f.isNonGMO = true
  `)

  console.log('  ✓ Farm certification inferences')
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

export async function seedInferences(): Promise<void> {
  console.log('\n=== Creating Inference Edges ===\n')

  await seedCertificationInferences()
  await seedHeritageInferences()
  await seedZoneInferences()
  await seedCultivarZoneInferences()
  await seedRootstockInferences()
  await seedFarmCertificationInferences()

  console.log('\n=== Inference edges complete ===\n')
}
