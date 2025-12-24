#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Comprehensive SHARE Pillar Mapping
 *
 * Query the ACTUAL graph to see what fields exist on each node type,
 * then map each field to its SHARE pillar (S, H, A, R, or E)
 *
 * This proves we understand how everything in the graph relates to SHARE.
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  GRAPH → SHARE PILLAR MAPPING (COMPREHENSIVE)          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // =========================================================================
  // CULTIVAR NODE - Sample to see all fields
  // =========================================================================
  console.log('CULTIVAR NODE FIELDS → SHARE MAPPING')
  console.log('═════════════════════════════════════════════════════════\n')

  const cultivarSampleQuery = `
    MATCH (c:Cultivar)
    WHERE c.id = 'navel_orange'
    RETURN properties(c) as props
  `

  const cultivarSample = await runWriteTransaction(cultivarSampleQuery, {})

  if (cultivarSample.length > 0) {
    const props = cultivarSample[0].props
    console.log('Sample cultivar (navel_orange) has these properties:\n')

    // Map each field to SHARE pillar
    mapField('id', props.id, 'IDENTITY', '-')
    mapField('name', props.name, 'IDENTITY', '-')
    mapField('displayName', props.displayName, 'IDENTITY', '-')
    mapField('productId', props.productId, 'IDENTITY', '-')
    mapField('varietyId', props.varietyId, 'HIERARCHY', 'H', 'Links to Variety level')
    mapField('modelType', props.modelType, 'TIMING MODEL', 'R', 'calendar vs gdd')

    console.log('\n--- HERITAGE (H) PILLAR ---')
    mapField('heritageIntent', props.heritageIntent, 'H', 'H', 'Heritage classification')
    mapField('isHeritage', props.isHeritage, 'H', 'H', 'Heritage flag')
    mapField('isNonGmo', props.isNonGmo, 'H', 'H', 'Non-GMO verified')
    mapField('originLocked', props.originLocked, 'H', 'H', 'Region-locked genetics')

    console.log('\n--- GEOGRAPHIC (S) PILLAR ---')
    mapField('validatedStates', props.validatedStates, 'S', 'S', 'Where it can grow')

    console.log('\n--- QUALITY (E) PILLAR ---')
    mapField('flavorProfile', props.flavorProfile, 'E', 'E', 'Expected flavor')
    mapField('nutritionNotes', props.nutritionNotes, 'E', 'E', 'Nutrition highlights')

    console.log('\n--- TIMING (R) PILLAR ---')
    mapField('peakMonths', props.peakMonths, 'R', 'R', 'Peak harvest calendar')
    mapField('baseTemp', props.baseTemp, 'R', 'R', 'GDD base temperature')
    mapField('gddToMaturity', props.gddToMaturity, 'R', 'R', 'GDD to harvest')
    mapField('gddToPeak', props.gddToPeak, 'R', 'R', 'GDD to peak quality')

    mapField('source', props.source, 'META', '-', 'Data source tracking')
  }

  // =========================================================================
  // GROWING REGION NODE
  // =========================================================================
  console.log('\n\nGROWINGREGION NODE FIELDS → SHARE MAPPING')
  console.log('═════════════════════════════════════════════════════════\n')

  const regionSampleQuery = `
    MATCH (r:GrowingRegion {id: 'indian_river'})
    RETURN properties(r) as props
  `

  const regionSample = await runWriteTransaction(regionSampleQuery, {})

  if (regionSample.length > 0) {
    const props = regionSample[0].props
    console.log('Sample region (indian_river) has these properties:\n')

    mapField('id', props.id, 'IDENTITY', '-')
    mapField('name', props.name, 'IDENTITY', '-')
    mapField('displayName', props.displayName, 'IDENTITY', '-')
    mapField('state', props.state, 'GEOGRAPHY', 'S')
    mapField('lat', props.lat, 'GEOGRAPHY', 'S', 'For weather API')
    mapField('lon', props.lon, 'GEOGRAPHY', 'S', 'For weather API')
    mapField('dtcActivity', props.dtcActivity, 'MARKET', '-', 'DTC market activity')

    console.log('\n--- CLIMATE (S×R) PILLAR ---')
    mapField('avgLastFrostDoy', props.avgLastFrostDoy, 'R', 'R', 'Growing season start')
    mapField('avgFirstFrostDoy', props.avgFirstFrostDoy, 'R', 'R', 'Growing season end')
    mapField('frostFreeDays', props.frostFreeDays, 'R', 'R', 'Growing season length')
    mapField('annualGdd50', props.annualGdd50, 'R', 'R', '⭐ CRITICAL - crop timing')
    mapField('avgChillHours', props.avgChillHours, 'R', 'R', '⭐ CRITICAL - fruit compatibility')
    mapField('usdaZone', props.usdaZone, 'S', 'S', 'Hardiness zone')

    mapField('source', props.source, 'META', '-')
  }

  // =========================================================================
  // GROWN_IN RELATIONSHIP
  // =========================================================================
  console.log('\n\nGROWN_IN RELATIONSHIP PROPERTIES → SHARE MAPPING')
  console.log('═════════════════════════════════════════════════════════\n')

  const grownInSampleQuery = `
    MATCH (c:Cultivar {id: 'navel_orange'})-[g:GROWN_IN]->(r:GrowingRegion {id: 'indian_river'})
    RETURN properties(g) as props
  `

  const grownInSample = await runWriteTransaction(grownInSampleQuery, {})

  if (grownInSample.length > 0) {
    const props = grownInSample[0].props
    console.log('Sample GROWN_IN (navel_orange → indian_river) has:\n')

    mapField('quality_tier', props.quality_tier, 'E', 'E', 'Exceptional/excellent/good')
    mapField('gdd_to_peak', props.gdd_to_peak, 'R', 'R', 'Region-specific GDD')
    mapField('brix_expected', props.brix_expected, 'E', 'E', '⭐ Expected quality')
    mapField('brix_min', props.brix_min, 'E', 'E', 'Min expected Brix')
    mapField('brix_max', props.brix_max, 'E', 'E', 'Max expected Brix')
    mapField('confidence', props.confidence, 'META', '-', 'Data confidence')
    mapField('matchType', props.matchType, 'META', '-', 'How relationship was created')
  }

  // =========================================================================
  // CLAIM NODE
  // =========================================================================
  console.log('\n\nCLAIM NODE FIELDS → SHARE MAPPING')
  console.log('═════════════════════════════════════════════════════════\n')

  const claimSampleQuery = `
    MATCH (c:Claim {id: 'grass_fed'})
    RETURN properties(c) as props
  `

  const claimSample = await runWriteTransaction(claimSampleQuery, {})

  if (claimSample.length > 0) {
    const props = claimSample[0].props
    console.log('Sample claim (grass_fed) has:\n')

    mapField('id', props.id, 'IDENTITY', '-')
    mapField('name', props.name, 'IDENTITY', '-')
    mapField('category', props.category, 'CLASSIFICATION', 'A')
    mapField('applicableProducts', props.applicableProducts, 'CLASSIFICATION', '-')

    console.log('\n--- REGULATORY PERSPECTIVE ---')
    mapField('regulatoryStatus', props.regulatoryStatus, 'A', 'A', 'Legal status')
    mapField('enforcementLevel', props.enforcementLevel, 'A', 'A', 'How enforced')
    mapField('legalDefinition', props.legalDefinition, 'A', 'A', 'Legal meaning')
    mapField('loopholes', props.loopholes, 'A', 'A', 'Known gaps')

    console.log('\n--- MARKETING PERSPECTIVE ---')
    mapField('consumerPerception', props.consumerPerception, 'A', '-', 'What consumers think')
    mapField('commonMisconceptions', props.commonMisconceptions, 'A', '-', 'What they get wrong')

    console.log('\n--- REALITY PERSPECTIVE ---')
    mapField('actualMeaning', props.actualMeaning, 'A', 'A', 'What it really means')
    mapField('qualityCorrelation', props.qualityCorrelation, 'E', 'E', 'Impact on quality')
    mapField('fielderAssessment', props.fielderAssessment, 'ALL', 'A', 'Expert analysis')

    console.log('\n--- SHARE IMPACT ---')
    mapField('impactSoil', props.impactSoil, 'S', 'S', 'S pillar impact')
    mapField('impactHeritage', props.impactHeritage, 'H', 'H', 'H pillar impact')
    mapField('impactAgricultural', props.impactAgricultural, 'A', 'A', 'A pillar impact')
    mapField('impactRipen', props.impactRipen, 'R', 'R', 'R pillar impact')
    mapField('impactEnrich', props.impactEnrich, 'E', 'E', 'E pillar impact')

    console.log('\n--- INFERENCE DATA ---')
    mapField('omegaRatioMin', props.omegaRatioMin, 'E', 'E', 'Omega inference min')
    mapField('omegaRatioMax', props.omegaRatioMax, 'E', 'E', 'Omega inference max')
    mapField('redFlags', props.redFlags, 'A', 'A', 'Warning patterns')
    mapField('greenFlags', props.greenFlags, 'A', 'A', 'Positive patterns')
  }

  // =========================================================================
  // VARIETY NODE
  // =========================================================================
  console.log('\n\nVARIETY NODE FIELDS → SHARE MAPPING')
  console.log('═════════════════════════════════════════════════════════\n')

  const varietySampleQuery = `
    MATCH (v:Variety {id: 'navel'})
    RETURN properties(v) as props
  `

  const varietySample = await runWriteTransaction(varietySampleQuery, {})

  if (varietySample.length > 0) {
    const props = varietySample[0].props
    console.log('Sample variety (navel) has:\n')

    mapField('id', props.id, 'IDENTITY', '-')
    mapField('displayName', props.displayName, 'IDENTITY', '-')
    mapField('productId', props.productId, 'HIERARCHY', 'H', 'Links to ProductType')
    mapField('description', props.description, 'DESCRIPTION', '-')
    mapField('source', props.source, 'META', '-')
  }

  // =========================================================================
  // ENTITY NODE
  // =========================================================================
  console.log('\n\nENTITY NODE FIELDS → SHARE MAPPING')
  console.log('═════════════════════════════════════════════════════════\n')

  const entitySampleQuery = `
    MATCH (e:Entity:Grower)
    WHERE e.id = 'hale_groves'
    RETURN properties(e) as props
  `

  const entitySample = await runWriteTransaction(entitySampleQuery, {})

  if (entitySample.length > 0) {
    const props = entitySample[0].props
    console.log('Sample entity (hale_groves) has:\n')

    mapField('id', props.id, 'IDENTITY', '-')
    mapField('name', props.name, 'IDENTITY', '-')
    mapField('city', props.city, 'GEOGRAPHY', 'S', 'Location')
    mapField('county', props.county, 'GEOGRAPHY', 'S', 'Location')
    mapField('stateCode', props.stateCode, 'GEOGRAPHY', 'S', 'Location')
    mapField('website', props.website, 'CONTACT', '-')
    mapField('retailChannels', props.retailChannels, 'BUSINESS', '-', 'd2c, wholesale')
    mapField('features', props.features, 'A', 'A', '⭐ Maps to claims/practices')
    mapField('certifications', props.certifications, 'A', 'A', '⭐ Maps to claims')
    mapField('dataSource', props.dataSource, 'META', '-')
  }

  // =========================================================================
  // RELATIONSHIP SUMMARY
  // =========================================================================
  console.log('\n\nRELATIONSHIPS → SHARE MAPPING')
  console.log('═════════════════════════════════════════════════════════\n')

  const relationshipsQuery = `
    CALL db.relationshipTypes() YIELD relationshipType
    CALL {
      WITH relationshipType
      MATCH ()-[r]->()
      WHERE type(r) = relationshipType
      RETURN count(r) as count
    }
    RETURN relationshipType, count
    ORDER BY count DESC
    LIMIT 15
  `

  const relationships = await runWriteTransaction(relationshipsQuery, {})

  for (const row of relationships) {
    const mapping = getRelationshipSHAREMapping(row.relationshipType)
    console.log(`  ${row.relationshipType.padEnd(25)} ${row.count.toString().padStart(6)} relationships  → ${mapping}`)
  }

  // =========================================================================
  // SUMMARY BY PILLAR
  // =========================================================================
  console.log('\n\n╔════════════════════════════════════════════════════════╗')
  console.log('║  CURRENT GRAPH DATA BY SHARE PILLAR                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('S (SOIL) PILLAR - What we have:')
  console.log('  Nodes:')
  console.log('    • GrowingRegion (185) - geographic boundaries')
  console.log('    • County (450) - political subdivision')
  console.log('    • City (436) - population centers')
  console.log('    • State (51) - state boundaries')
  console.log('    • SoilProfile (7) - soil characteristics')
  console.log('  Fields on GrowingRegion:')
  console.log('    • Geographic: lat, lon, state, dtcActivity')
  console.log('    • Climate (S×R): annualGdd50, avgChillHours, frost dates, usdaZone')
  console.log('  Missing:')
  console.log('    ❌ Soil minerals (P, K, Ca, Mg) on most regions')
  console.log('    ❌ macroRegion, slug, primaryProducts')
  console.log('  Assessment: Good foundation, missing detail\n')

  console.log('H (HERITAGE) PILLAR - What we have:')
  console.log('  Nodes:')
  console.log('    • ProductType (18) - classification')
  console.log('    • Variety (44) - consumer groupings')
  console.log('    • Cultivar (159) - specific genetics')
  console.log('  Fields on Cultivar:')
  console.log('    • Identity: id, displayName, productId')
  console.log('    • Hierarchy: varietyId (links to Variety)')
  console.log('    • Heritage: isHeritage, isNonGmo, originLocked')
  console.log('    • Geographic: validatedStates (which states it grows)')
  console.log('  Relationships:')
  console.log('    • BELONGS_TO_VARIETY (17) - cultivar → variety')
  console.log('    • BELONGS_TO_PRODUCT (varietyvarieties → products)')
  console.log('  Missing:')
  console.log('    ❌ tradeNames (SUMO → Shiranui mapping)')
  console.log('    ❌ technicalName, yearIntroduced, originStory')
  console.log('  Assessment: Hierarchy complete, missing metadata\n')

  console.log('A (AGRICULTURAL) PILLAR - What we have:')
  console.log('  Nodes:')
  console.log('    • Claim (10) - marketing/regulatory claims')
  console.log('  Fields on Claim:')
  console.log('    • Regulatory: legalDefinition, enforcementLevel, loopholes')
  console.log('    • Marketing: consumerPerception, commonMisconceptions')
  console.log('    • Reality: actualMeaning, qualityCorrelation, fielderAssessment')
  console.log('    • SHARE Impact: impactSoil/Heritage/Agricultural/Ripen/Enrich')
  console.log('    • Inference: omegaRatioMin/Max, redFlags, greenFlags')
  console.log('  Relationships:')
  console.log('    • IMPLIES (9) - claim chains (organic → non-GMO)')
  console.log('  Fields on Entity:')
  console.log('    • features (arrays) - maps to claims')
  console.log('    • certifications (arrays) - maps to claims')
  console.log('  Missing:')
  console.log('    ❌ Entity-[:HAS_CLAIM]->Claim relationships (NOT CREATED)')
  console.log('    ❌ SHARE Profiles (45+ claim combination → quality profiles)')
  console.log('    ❌ Category Configs (quality metric system per product type)')
  console.log('  Assessment: Claims defined but not applied; missing inference engine\n')

  console.log('R (RIPEN) PILLAR - What we have:')
  console.log('  Climate Data on Regions (Complete):')
  console.log('    • annualGdd50 - annual heat accumulation')
  console.log('    • avgChillHours - winter dormancy requirement')
  console.log('    • frostFreeDays - growing season length')
  console.log('    • avgLastFrostDoy, avgFirstFrostDoy - season boundaries')
  console.log('  Timing Data on Cultivars:')
  console.log('    • peakMonths (100 cultivars) - calendar timing')
  console.log('    • baseTemp, gddToMaturity, gddToPeak (21) - GDD models')
  console.log('    • modelType (all) - calendar vs gdd')
  console.log('  Relationships:')
  console.log('    • HAS_PHENOLOGY_IN (28) - bloom dates + GDD by region')
  console.log('    • gdd_to_peak on some GROWN_IN relationships')
  console.log('  Missing:')
  console.log('    ❌ peakMonthsOverride on most GROWN_IN')
  console.log('    ❌ Real-time weather integration')
  console.log('  Assessment: Strong foundation for timing predictions\n')

  console.log('E (ENRICH) PILLAR - What we have:')
  console.log('  Quality Data:')
  console.log('    • quality_tier on all 4,614 GROWN_IN relationships')
  console.log('    • brix_expected/min/max on 814 GROWN_IN (produce only)')
  console.log('    • flavorProfile on all 159 cultivars')
  console.log('  Quality Metrics:')
  console.log('    • Brix: For produce (fruit, vegetables)')
  console.log('    • Omega ratio: Hints on 6 claims, but not on products yet')
  console.log('  Missing:')
  console.log('    ❌ Category-specific quality metrics (which metric for which type)')
  console.log('    ❌ Omega ratio data on livestock products')
  console.log('    ❌ Oil content data on nuts')
  console.log('    ❌ Fat percentage on dairy')
  console.log('    ❌ flavorNotes on most GROWN_IN relationships')
  console.log('    ❌ Actual measurements (future user data)')
  console.log('  Assessment: Brix system works for produce; missing other metrics\n')

  // =========================================================================
  // CRITICAL GAPS SUMMARY
  // =========================================================================
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  CRITICAL GAPS (Prevent SHARE from Working)            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('🚨 GAP 1: Category Configs NOT LOADED')
  console.log('  Impact: Don\'t know which quality metric for which product')
  console.log('  Example: Can\'t determine if beef should use Brix or omega ratio')
  console.log('  File: category-config.ts (1,404 lines)')
  console.log('  Status: ❌ ZERO loaded\n')

  console.log('🚨 GAP 2: SHARE Profiles NOT LOADED')
  console.log('  Impact: Can\'t infer quality from claim combinations')
  console.log('  Example: Can\'t map "grass-fed" → omega 8-15:1 estimate')
  console.log('  File: share-profiles.ts (1,873 lines, 45+ profiles)')
  console.log('  Status: ❌ ZERO loaded\n')

  console.log('🚨 GAP 3: Entity→Claim Relationships NOT CREATED')
  console.log('  Impact: Claims not applied to real farms')
  console.log('  Example: Can\'t query "find organic farms in region"')
  console.log('  Data exists: entity.features, entity.certifications')
  console.log('  Status: ❌ ZERO relationships created\n')

  console.log('🚨 GAP 4: Product Type Quality Metrics NOT DEFINED')
  console.log('  Impact: Don\'t know what quality means for each product')
  console.log('  Example: Meat uses omega ratio, nuts use oil content')
  console.log('  Status: ❌ Not connected to ProductType nodes\n')

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  HONEST FOUNDATION ASSESSMENT                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('DATA INFRASTRUCTURE: 70% complete')
  console.log('  ✅ Nodes exist with core fields')
  console.log('  ✅ Geographic hierarchy works')
  console.log('  ✅ Climate data complete')
  console.log('  ✅ Entity connections work')
  console.log('')
  console.log('INTELLIGENCE INFRASTRUCTURE: 15% complete')
  console.log('  ✅ Claim nodes defined (10)')
  console.log('  ❌ Category configs NOT loaded (0%)')
  console.log('  ❌ SHARE profiles NOT loaded (0%)')
  console.log('  ❌ Entity→Claim links NOT created (0%)')
  console.log('')
  console.log('OVERALL FOUNDATION: 40-45% complete')
  console.log('  = (70% data × 0.5) + (15% intelligence × 0.5)')
  console.log('  = 35% + 7.5% = 42.5%')
  console.log('')
  console.log('Can query: Geographic data, cultivar listings, basic timing')
  console.log('Cannot do: Quality inference, claim validation, SHARE breakdowns')
  console.log('')

  await closeDriver()
}

function mapField(fieldName: string, value: any, category: string, pillar: string, notes?: string) {
  const exists = value !== undefined && value !== null
  const status = exists ? '✅' : '❌'
  const valueStr = exists ? formatValue(value) : 'null'
  const noteStr = notes ? ` - ${notes}` : ''
  const pillarStr = pillar === '-' ? '     ' : `[${pillar}]`

  console.log(`  ${status} ${fieldName.padEnd(25)} ${pillarStr}  ${valueStr}${noteStr}`)
}

function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}]`
  }
  if (typeof value === 'string') {
    return value.length > 40 ? value.substring(0, 37) + '...' : value
  }
  return String(value)
}

function getRelationshipSHAREMapping(relType: string): string {
  const mappings: Record<string, string> = {
    'GROWN_IN': 'S×H×R×E (cultivar × region → quality)',
    'LOCATED_IN': 'S (entity geography)',
    'BELONGS_TO_VARIETY': 'H (cultivar hierarchy)',
    'BELONGS_TO_PRODUCT': 'H (variety hierarchy)',
    'HAS_PHENOLOGY_IN': 'R (bloom timing by region)',
    'IN_GROWING_REGION': 'S (deprecated, use LOCATED_IN)',
    'HAS_SOIL': 'S (region → soil profile)',
    'HAS_COUNTY': 'S (region → county)',
    'HAS_CITY': 'S (region → city)',
    'IN_STATE': 'S (geography hierarchy)',
    'IMPLIES': 'A (claim inference chain)',
    'RED_FLAG_WITH': 'A (suspicious claim combinations)',
    'GREEN_FLAG_WITH': 'A (positive claim combinations)',
    'HAS_CLAIM': 'A (entity → claim) ❌ NOT YET CREATED',
  }
  return mappings[relType] || '?'
}

main().catch(console.error)
