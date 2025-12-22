/**
 * Explore the Fielder Knowledge Graph
 *
 * Analytical queries to discover insights from the graph data.
 * Organized in sequence: Inventory → Gaps → SHARE Insights → Opportunities
 *
 * Updated for multi-role Entity model (Dec 2025)
 *
 * Usage:
 *   npm run graph:explore
 */

import {
  runQuery,
  closeDriver,
} from '../src/lib/graph/index'

import {
  getSimpleStats,
  getAllEntities,
  getMultiRoleEntities,
  getD2CRetailers,
  getPackinghouses,
  getGrowersOfProduct,
  getGrowingRegionsWithCounts,
  inferEntityAttributes,
} from '../src/lib/graph/queries'

// =============================================================================
// PHASE 1: INVENTORY - What do we have?
// =============================================================================

async function inventoryAnalysis() {
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 1: INVENTORY - What do we have?')
  console.log('='.repeat(70))

  // Quick stats using query layer
  console.log('\n📊 Quick Stats:\n')
  const stats = await getSimpleStats()
  console.log(`  Entities:        ${stats.entities}`)
  console.log(`    ├── Growers:       ${stats.growers}`)
  console.log(`    ├── Packinghouses: ${stats.packinghouses}`)
  console.log(`    └── Retailers:     ${stats.retailers}`)
  console.log(`  Product Types:   ${stats.products}`)
  console.log(`  Growing Regions: ${stats.regions}`)
  console.log(`  Relationships:   ${stats.relationships}`)

  // Node distribution
  console.log('\n📊 Node Distribution by Label:\n')
  const nodeDist = await runQuery<{ label: string; count: number }>(`
    MATCH (n)
    WITH labels(n)[0] as label, count(*) as count
    RETURN label, count
    ORDER BY count DESC
  `)
  nodeDist.forEach(n => {
    const bar = '█'.repeat(Math.min(Number(n.count), 50))
    console.log(`  ${n.label.padEnd(20)} ${String(n.count).padStart(4)} ${bar}`)
  })

  // Relationship distribution
  console.log('\n📊 Relationship Distribution by Type:\n')
  const relDist = await runQuery<{ type: string; count: number }>(`
    MATCH ()-[r]->()
    WITH type(r) as type, count(*) as count
    RETURN type, count
    ORDER BY count DESC
  `)
  relDist.forEach(r => {
    const bar = '█'.repeat(Math.min(Number(r.count) / 2, 50))
    console.log(`  ${r.type.padEnd(25)} ${String(r.count).padStart(4)} ${bar}`)
  })

  // Multi-role entities
  console.log('\n🔄 Multi-Role Entities (2+ roles):\n')
  const multiRole = await getMultiRoleEntities()
  for (const { entity, roleCount } of multiRole) {
    const roleIcons = entity.roles.map(r => {
      switch(r) { case 'Grower': return '🌱'; case 'Packinghouse': return '📦'; case 'Retailer': return '🏪'; default: return r }
    }).join(' ')
    console.log(`  ${roleIcons} ${entity.name} (${entity.stateCode}) - ${roleCount} roles`)
    if (entity.facilityTypes?.length) console.log(`       Facilities: ${entity.facilityTypes.join(', ')}`)
    if (entity.retailChannels?.length) console.log(`       Retail: ${entity.retailChannels.join(', ')}`)
    if (entity.b2bChannels?.length) console.log(`       B2B: ${entity.b2bChannels.join(', ')}`)
  }

  // Geographic coverage (updated for Entity model)
  console.log('\n🗺️  Geographic Coverage:\n')
  const geoCoverage = await runQuery<{ region: string; states: number; growingRegions: number; entities: number }>(`
    MATCH (r:Region)-[:CONTAINS_STATE]->(s:State)
    OPTIONAL MATCH (s)-[:CONTAINS_GROWING_REGION]->(gr:GrowingRegion)
    OPTIONAL MATCH (e:Entity)-[:LOCATED_IN]->(s)
    WITH r.name as region,
         count(DISTINCT s) as states,
         count(DISTINCT gr) as growingRegions,
         count(DISTINCT e) as entities
    RETURN region, states, growingRegions, entities
    ORDER BY entities DESC
  `)
  console.log('  Region               States  GrowingRegions  Entities')
  console.log('  ' + '-'.repeat(55))
  geoCoverage.forEach(g => {
    console.log(`  ${g.region.padEnd(20)} ${String(g.states).padStart(6)}  ${String(g.growingRegions).padStart(14)}  ${String(g.entities).padStart(8)}`)
  })

  // Crop coverage
  console.log('\n🌱 Crop Coverage by Subcategory:\n')
  const cropCoverage = await runQuery<{ subcategory: string; productTypes: number; varieties: number; cultivars: number }>(`
    MATCH (sub:Subcategory)-[:HAS_PRODUCT_TYPE]->(pt:ProductType)
    OPTIONAL MATCH (pt)-[:HAS_VARIETY]->(v:Variety)
    OPTIONAL MATCH (v)-[:HAS_CULTIVAR]->(c:Cultivar)
    WITH sub.name as subcategory,
         count(DISTINCT pt) as productTypes,
         count(DISTINCT v) as varieties,
         count(DISTINCT c) as cultivars
    RETURN subcategory, productTypes, varieties, cultivars
    ORDER BY cultivars DESC
  `)
  console.log('  Subcategory          Products  Varieties  Cultivars')
  console.log('  ' + '-'.repeat(55))
  cropCoverage.forEach(c => {
    console.log(`  ${c.subcategory.padEnd(20)} ${String(c.productTypes).padStart(8)}  ${String(c.varieties).padStart(9)}  ${String(c.cultivars).padStart(9)}`)
  })
}

// =============================================================================
// PHASE 2: GAP ANALYSIS - Where are the holes?
// =============================================================================

async function gapAnalysis() {
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 2: GAP ANALYSIS - Where are the holes?')
  console.log('='.repeat(70))

  // States without growing regions
  console.log('\n⚠️  States WITHOUT Growing Regions Defined:\n')
  const statesWithoutRegions = await runQuery<{ state: string; code: string }>(`
    MATCH (s:State)
    WHERE NOT (s)-[:CONTAINS_GROWING_REGION]->()
    RETURN s.name as state, s.code as code
    ORDER BY s.name
  `)
  if (statesWithoutRegions.length === 0) {
    console.log('  ✓ All states with entities have growing regions')
  } else {
    console.log(`  ${statesWithoutRegions.length} states missing growing regions:`)
    console.log(`  ${statesWithoutRegions.map(s => s.code).join(', ')}`)
  }

  // Growing regions without entities
  console.log('\n⚠️  Growing Regions WITHOUT Entities:\n')
  const regionsWithoutEntities = await runQuery<{ region: string; state: string }>(`
    MATCH (gr:GrowingRegion)<-[:CONTAINS_GROWING_REGION]-(s:State)
    WHERE NOT (:Entity)-[:IN_GROWING_REGION]->(gr)
    RETURN gr.name as region, s.code as state
    ORDER BY s.code
  `)
  if (regionsWithoutEntities.length === 0) {
    console.log('  ✓ All growing regions have at least one entity')
  } else {
    console.log(`  ${regionsWithoutEntities.length} regions without entities:`)
    regionsWithoutEntities.forEach(r => console.log(`    - ${r.region} (${r.state})`))
  }

  // Entities without growing region assignment
  console.log('\n⚠️  Entities NOT Linked to Growing Regions:\n')
  const entitiesNoRegion = await runQuery<{ entity: string; state: string }>(`
    MATCH (e:Entity)-[:LOCATED_IN]->(s:State)
    WHERE NOT (e)-[:IN_GROWING_REGION]->()
    RETURN e.name as entity, s.code as state
  `)
  if (entitiesNoRegion.length === 0) {
    console.log('  ✓ All entities linked to growing regions')
  } else {
    console.log(`  ${entitiesNoRegion.length} entities without growing region:`)
    entitiesNoRegion.forEach(e => console.log(`    - ${e.entity} (${e.state})`))
  }

  // Product types without any grower
  console.log('\n⚠️  Product Types NO Entity is Growing:\n')
  const ungrownProducts = await runQuery<{ product: string; subcategory: string }>(`
    MATCH (sub:Subcategory)-[:HAS_PRODUCT_TYPE]->(pt:ProductType)
    WHERE NOT (:Grower)-[:GROWS]->(pt)
    RETURN pt.name as product, sub.name as subcategory
    ORDER BY sub.name, pt.name
  `)
  if (ungrownProducts.length === 0) {
    console.log('  ✓ All products have at least one grower')
  } else {
    console.log(`  ${ungrownProducts.length} products without growers:`)
    ungrownProducts.forEach(p => console.log(`    - ${p.product} (${p.subcategory})`))
  }

  // Packinghouses without B2B channels defined
  console.log('\n⚠️  Packinghouses WITHOUT B2B Channels Defined:\n')
  const packhousesNoB2B = await runQuery<{ entity: string; state: string }>(`
    MATCH (e:Entity:Packinghouse)
    WHERE e.b2bChannels IS NULL OR size(e.b2bChannels) = 0
    RETURN e.name as entity, e.stateCode as state
  `)
  if (packhousesNoB2B.length === 0) {
    console.log('  ✓ All packinghouses have B2B channels defined')
  } else {
    console.log(`  ${packhousesNoB2B.length} packinghouses without B2B channels:`)
    packhousesNoB2B.forEach(p => console.log(`    - ${p.entity} (${p.state})`))
  }

  // Retailers without retail channels defined
  console.log('\n⚠️  Retailers WITHOUT Retail Channels Defined:\n')
  const retailersNoChannels = await runQuery<{ entity: string; state: string }>(`
    MATCH (e:Entity:Retailer)
    WHERE e.retailChannels IS NULL OR size(e.retailChannels) = 0
    RETURN e.name as entity, e.stateCode as state
  `)
  if (retailersNoChannels.length === 0) {
    console.log('  ✓ All retailers have retail channels defined')
  } else {
    console.log(`  ${retailersNoChannels.length} retailers without retail channels:`)
    retailersNoChannels.forEach(r => console.log(`    - ${r.entity} (${r.state})`))
  }
}

// =============================================================================
// PHASE 3: SHARE INSIGHTS - Quality-focused analysis
// =============================================================================

async function shareInsights() {
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 3: SHARE INSIGHTS - Quality-focused analysis')
  console.log('='.repeat(70))

  // H Pillar: Highest genetic potential cultivars
  console.log('\n🧬 [H] HERITAGE: Top 10 Cultivars by Brix Potential:\n')
  const topBrix = await runQuery<{ cultivar: string; product: string; brixMax: number; heritage: string }>(`
    MATCH (pt:ProductType)-[:HAS_VARIETY]->()-[:HAS_CULTIVAR]->(c:Cultivar)
    WHERE c.brixPotentialMax IS NOT NULL
    RETURN c.name as cultivar, pt.name as product, c.brixPotentialMax as brixMax, c.heritageIntent as heritage
    ORDER BY c.brixPotentialMax DESC
    LIMIT 10
  `)
  console.log('  Cultivar                Product           Brix Max  Heritage')
  console.log('  ' + '-'.repeat(65))
  topBrix.forEach(c => {
    console.log(`  ${c.cultivar.padEnd(22)} ${c.product.padEnd(18)} ${String(c.brixMax).padStart(8)}  ${c.heritage || 'n/a'}`)
  })

  // H Pillar: Premium vs yield rootstock distribution
  console.log('\n🌳 [H] HERITAGE: Rootstock Quality Distribution:\n')
  const rootstockDist = await runQuery<{ tier: string; count: number; avgModifier: number }>(`
    MATCH (r:Rootstock)-[:HAS_QUALITY_TIER]->(t:QualityTier)
    WITH t.name as tier, count(r) as count, avg(r.brixModifier) as avgModifier
    RETURN tier, count, avgModifier
    ORDER BY avgModifier DESC
  `)
  rootstockDist.forEach(r => {
    console.log(`  ${r.tier.padEnd(30)} ${String(r.count).padStart(3)} rootstocks  (avg modifier: ${Number(r.avgModifier).toFixed(2)})`)
  })

  // R Pillar: Zone suitability coverage
  console.log('\n🌡️  [R] RIPEN: Cultivars per USDA Zone:\n')
  const zoneCoverage = await runQuery<{ zone: string; cultivarCount: number; minTemp: number }>(`
    MATCH (z:USDAZone)<-[:SUITABLE_FOR_ZONE]-(c:Cultivar)
    WITH z.zone as zone, z.minTempF as minTemp, count(DISTINCT c) as cultivarCount
    RETURN zone, cultivarCount, minTemp
    ORDER BY minTemp DESC
  `)
  console.log('  Zone   Min Temp   Cultivars')
  console.log('  ' + '-'.repeat(35))
  zoneCoverage.forEach(z => {
    const bar = '█'.repeat(Number(z.cultivarCount))
    console.log(`  ${z.zone.padEnd(6)} ${String(z.minTemp).padStart(6)}°F   ${String(z.cultivarCount).padStart(3)} ${bar}`)
  })

  // S Pillar: Entity concentration by growing region
  console.log('\n🌍 [S] SOIL: Entity Concentration by Growing Region:\n')
  const entityConcentration = await runQuery<{ region: string; state: string; entities: number; products: string[] }>(`
    MATCH (gr:GrowingRegion)<-[:IN_GROWING_REGION]-(e:Entity)
    MATCH (gr)<-[:CONTAINS_GROWING_REGION]-(s:State)
    OPTIONAL MATCH (e)-[:GROWS]->(pt:ProductType)
    WITH gr.name as region, s.code as state, count(DISTINCT e) as entities, collect(DISTINCT pt.name) as products
    RETURN region, state, entities, products
    ORDER BY entities DESC
  `)
  entityConcentration.forEach(r => {
    console.log(`  ${r.region} (${r.state}): ${r.entities} entities`)
    console.log(`    Products: ${r.products.slice(0, 5).join(', ')}`)
  })

  // Cross-pillar: Best region+cultivar combinations
  console.log('\n⭐ CROSS-PILLAR: Top Region+Cultivar Combinations by Potential Brix:\n')
  const bestCombos = await runQuery<{ region: string; cultivar: string; rootstock: string; potentialBrix: number }>(`
    MATCH (gr:GrowingRegion)-[:TYPICALLY_IN_ZONE]->(z:USDAZone)
    MATCH (c:Cultivar)-[:SUITABLE_FOR_ZONE]->(z)
    MATCH (r:Rootstock)-[:HAS_QUALITY_TIER]->(:QualityTier {id: 'premium_rootstock'})
    WHERE c.brixPotentialMax IS NOT NULL
    WITH gr.name as region, c.name as cultivar, r.name as rootstock,
         c.brixPotentialMax + r.brixModifier as potentialBrix
    RETURN region, cultivar, rootstock, potentialBrix
    ORDER BY potentialBrix DESC
    LIMIT 10
  `)
  console.log('  Region                   Cultivar              Rootstock          Brix')
  console.log('  ' + '-'.repeat(75))
  bestCombos.forEach(c => {
    console.log(`  ${c.region.padEnd(25)} ${c.cultivar.padEnd(20)} ${c.rootstock.padEnd(18)} ${Number(c.potentialBrix).toFixed(1)}`)
  })
}

// =============================================================================
// PHASE 4: OPPORTUNITY DISCOVERY - What can we infer or recommend?
// =============================================================================

async function supplyChainAnalysis() {
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 4: SUPPLY CHAIN ANALYSIS - Multi-role entities')
  console.log('='.repeat(70))

  // D2C Retailers
  console.log('\n🏪 D2C Retailers (e-commerce/catalog/call center):\n')
  const d2cRetailers = await getD2CRetailers()
  for (const e of d2cRetailers) {
    const roles = e.roles.map(r => {
      switch(r) { case 'Grower': return '🌱'; case 'Packinghouse': return '📦'; case 'Retailer': return '🏪'; default: return r }
    }).join(' ')
    console.log(`  ${roles} ${e.name} (${e.stateCode})`)
    console.log(`       Products: ${e.products?.join(', ')}`)
    console.log(`       Channels: ${e.retailChannels?.join(', ')}`)
  }

  // Packinghouses by facility type
  console.log('\n📦 Packinghouses by Facility Type:\n')
  const packinghouses = await getPackinghouses()

  const giftRepack = packinghouses.filter(p => p.facilityTypes.includes('gift_repack'))
  const wetPack = packinghouses.filter(p => p.facilityTypes.includes('wet_packinghouse'))
  const processors = packinghouses.filter(p => p.facilityTypes.includes('processor'))

  console.log(`  Gift Repack (D2C assembly): ${giftRepack.length}`)
  giftRepack.forEach(p => console.log(`    - ${p.entity.name} (${p.entity.stateCode})`))

  console.log(`\n  Wet Packinghouse (full processing): ${wetPack.length}`)
  wetPack.forEach(p => {
    const b2b = p.b2bChannels.length ? p.b2bChannels.join(', ') : 'none defined'
    console.log(`    - ${p.entity.name} (${p.entity.stateCode}) → ${b2b}`)
  })

  console.log(`\n  Processors (value-added): ${processors.length}`)
  processors.forEach(p => console.log(`    - ${p.entity.name} (${p.entity.stateCode})`))

  // Who grows what
  console.log('\n🍊 Who Grows Citrus (Oranges)?\n')
  const orangeGrowers = await getGrowersOfProduct('orange')
  orangeGrowers.forEach(g => console.log(`  🌱 ${g.name} (${g.stateCode})`))

  console.log('\n🍑 Who Grows Peaches?\n')
  const peachGrowers = await getGrowersOfProduct('peach')
  peachGrowers.forEach(g => console.log(`  🌱 ${g.name} (${g.stateCode})`))

  console.log('\n🍒 Who Grows Cherries?\n')
  const cherryGrowers = await getGrowersOfProduct('cherry')
  cherryGrowers.forEach(g => console.log(`  🌱 ${g.name} (${g.stateCode})`))

  // Growing regions with entities
  console.log('\n🗺️  Growing Regions by Entity Count:\n')
  const regions = await getGrowingRegionsWithCounts()
  for (const r of regions.filter(r => r.entityCount > 0)) {
    console.log(`  ${r.name} (${r.stateCode}): ${r.entityCount} entities`)
    if (r.products.length > 0) {
      console.log(`     Products: ${r.products.slice(0, 5).join(', ')}${r.products.length > 5 ? '...' : ''}`)
    }
  }
}

async function inferenceExamples() {
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 5: INFERENCE EXAMPLES - What can we deduce?')
  console.log('='.repeat(70))

  // Hale Groves inference
  console.log('\n🔍 What can we infer about Hale Groves?\n')
  const haleInf = await inferEntityAttributes('hale_groves')
  if (haleInf.entity) {
    console.log(`  Entity: ${haleInf.entity.name}`)
    console.log(`  Roles: ${haleInf.entity.roles.join(', ')}`)
    console.log(`  Location: ${haleInf.entity.city}, ${haleInf.entity.stateCode}`)
    console.log(`\n  Inferences:`)
    for (const inf of haleInf.inferences) {
      console.log(`    [${inf.type}] ${inf.inference}`)
    }
  }

  // Frog Hollow Farm inference
  console.log('\n🔍 What can we infer about Frog Hollow Farm?\n')
  const frogInf = await inferEntityAttributes('frog_hollow_farm')
  if (frogInf.entity) {
    console.log(`  Entity: ${frogInf.entity.name}`)
    console.log(`  Roles: ${frogInf.entity.roles.join(', ')}`)
    console.log(`  Products: ${frogInf.entity.products?.join(', ')}`)
    console.log(`\n  Inferences:`)
    for (const inf of frogInf.inferences) {
      console.log(`    [${inf.type}] ${inf.inference}`)
    }
  }

  // Cherry Republic inference
  console.log('\n🔍 What can we infer about Cherry Republic?\n')
  const cherryInf = await inferEntityAttributes('cherry_republic')
  if (cherryInf.entity) {
    console.log(`  Entity: ${cherryInf.entity.name}`)
    console.log(`  Roles: ${cherryInf.entity.roles.join(', ')}`)
    console.log(`  Facility: ${cherryInf.entity.facilityTypes?.join(', ')}`)
    console.log(`\n  Inferences:`)
    for (const inf of cherryInf.inferences) {
      console.log(`    [${inf.type}] ${inf.inference}`)
    }
  }
}

async function opportunityDiscovery() {
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 6: OPPORTUNITY DISCOVERY - What can we recommend?')
  console.log('='.repeat(70))

  // Underserved growing regions (have suitable cultivars but few entities)
  console.log('\n💡 Underserved Regions (Many Suitable Cultivars, Few Entities):\n')
  const underserved = await runQuery<{ region: string; state: string; entities: number; suitableCultivars: number }>(`
    MATCH (gr:GrowingRegion)-[:TYPICALLY_IN_ZONE]->(z:USDAZone)
    MATCH (gr)<-[:CONTAINS_GROWING_REGION]-(s:State)
    OPTIONAL MATCH (c:Cultivar)-[:SUITABLE_FOR_ZONE]->(z)
    OPTIONAL MATCH (e:Entity)-[:IN_GROWING_REGION]->(gr)
    WITH gr.name as region, s.code as state,
         count(DISTINCT e) as entities,
         count(DISTINCT c) as suitableCultivars
    WHERE suitableCultivars > 5
    RETURN region, state, entities, suitableCultivars
    ORDER BY suitableCultivars DESC, entities ASC
    LIMIT 10
  `)
  console.log('  Region                    State  Entities  Suitable Cultivars  Opportunity')
  console.log('  ' + '-'.repeat(75))
  underserved.forEach(u => {
    const score = Number(u.entities) === 0 ? 'HIGH' : Number(u.entities) < 3 ? 'MEDIUM' : 'LOW'
    console.log(`  ${u.region.padEnd(27)} ${u.state.padEnd(6)} ${String(u.entities).padStart(8)}  ${String(u.suitableCultivars).padStart(18)}  ${score}`)
  })

  // Heritage cultivar opportunities
  console.log('\n💡 Heritage Cultivars NOT Being Grown by Any Entity:\n')
  const heritageMissing = await runQuery<{ cultivar: string; product: string; brixMax: number }>(`
    MATCH (pt:ProductType)-[:HAS_VARIETY]->()-[:HAS_CULTIVAR]->(c:Cultivar)
    WHERE c.heritageIntent IN ['true_heritage', 'heirloom_quality']
    AND c.brixPotentialMax IS NOT NULL
    AND NOT (:Grower)-[:GROWS]->(pt)
    RETURN c.name as cultivar, pt.name as product, c.brixPotentialMax as brixMax
    ORDER BY c.brixPotentialMax DESC
    LIMIT 10
  `)
  if (heritageMissing.length === 0) {
    console.log('  ✓ All heritage cultivar product types have growers')
  } else {
    console.log('  Heritage cultivars with no growers growing their product type:')
    heritageMissing.forEach(c => {
      console.log(`    - ${c.cultivar} (${c.product}) - up to ${c.brixMax} Brix`)
    })
  }

  // Certification tracking opportunities
  console.log('\n💡 Entities That Could Benefit from Certification Tracking:\n')
  const certOpportunities = await runQuery<{ entity: string; state: string; hasCert: boolean }>(`
    MATCH (e:Entity)
    RETURN e.name as entity, e.stateCode as state,
           size(e.certifications) > 0 as hasCert
    ORDER BY hasCert, e.name
  `)
  const withCert = certOpportunities.filter(e => e.hasCert)
  const withoutCert = certOpportunities.filter(e => !e.hasCert)
  console.log(`  Entities with certifications: ${withCert.length}`)
  console.log(`  Entities without certifications: ${withoutCert.length}`)
  if (withoutCert.length > 0) {
    console.log(`\n  Entities to research for certifications:`)
    withoutCert.slice(0, 10).forEach(e => console.log(`    - ${e.entity} (${e.state})`))
  }
}

// =============================================================================
// PHASE 7: NETWORK ANALYSIS - Graph structure insights
// =============================================================================

async function networkAnalysis() {
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 7: NETWORK ANALYSIS - Graph structure insights')
  console.log('='.repeat(70))

  // Most connected nodes (hubs)
  console.log('\n🔗 Most Connected Nodes (Hub Analysis):\n')
  const hubs = await runQuery<{ name: string; label: string; connections: number }>(`
    MATCH (n)
    WHERE NOT n:Country AND NOT n:Region
    WITH n, labels(n)[0] as label, COUNT { (n)--() } as connections
    WHERE connections > 3
    RETURN
      CASE
        WHEN n.name IS NOT NULL THEN n.name
        WHEN n.id IS NOT NULL THEN n.id
        ELSE 'unnamed'
      END as name,
      label,
      connections
    ORDER BY connections DESC
    LIMIT 15
  `)
  console.log('  Node                          Type            Connections')
  console.log('  ' + '-'.repeat(60))
  hubs.forEach(h => {
    const bar = '█'.repeat(Math.min(Number(h.connections), 30))
    console.log(`  ${String(h.name).padEnd(30)} ${h.label.padEnd(15)} ${String(h.connections).padStart(3)} ${bar}`)
  })

  // Shortest path examples
  console.log('\n🛤️  Example Inference Paths:\n')

  // Farm to Cultivar quality prediction path
  const farmToCultivar = await runQuery<{ path: string }>(`
    MATCH path = (f:Farm {id: 'hale_groves'})-[:IN_GROWING_REGION]->(gr:GrowingRegion)-[:TYPICALLY_IN_ZONE]->(z:USDAZone)<-[:SUITABLE_FOR_ZONE]-(c:Cultivar)
    WHERE c.brixPotentialMax IS NOT NULL
    WITH f, gr, z, c, c.brixPotentialMax as brix
    ORDER BY brix DESC
    LIMIT 1
    RETURN f.name + ' → ' + gr.name + ' → Zone ' + z.zone + ' → ' + c.name + ' (Brix: ' + brix + ')' as path
  `)
  console.log('  Farm → Region → Zone → Best Cultivar:')
  console.log(`    ${farmToCultivar[0]?.path || 'No path found'}`)

  // Certification implication chain
  const certChain = await runQuery<{ chain: string }>(`
    MATCH (c1:Certification {id: 'usda_organic'})-[i:IMPLIES]->(c2:Certification)
    RETURN c1.name + ' → IMPLIES → ' + c2.name + ' (' + i.reason + ')' as chain
  `)
  console.log('\n  Certification Implication Chain:')
  certChain.forEach(c => console.log(`    ${c.chain}`))

  // Graph density
  console.log('\n📈 Graph Density Metrics:\n')
  const density = await runQuery<{ nodes: number; relationships: number; avgDegree: number }>(`
    MATCH (n)
    WITH count(n) as nodes
    MATCH ()-[r]->()
    WITH nodes, count(r) as relationships
    RETURN nodes, relationships, toFloat(relationships) / nodes as avgDegree
  `)
  if (density[0]) {
    console.log(`  Total Nodes: ${density[0].nodes}`)
    console.log(`  Total Relationships: ${density[0].relationships}`)
    console.log(`  Average Degree: ${Number(density[0].avgDegree).toFixed(2)} relationships per node`)
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗')
  console.log('║         FIELDER KNOWLEDGE GRAPH EXPLORATION                        ║')
  console.log('║         Multi-Role Entity Model Analysis                           ║')
  console.log('╚════════════════════════════════════════════════════════════════════╝')

  try {
    await inventoryAnalysis()      // Phase 1: What do we have?
    await gapAnalysis()            // Phase 2: Where are the holes?
    await shareInsights()          // Phase 3: SHARE quality analysis
    await supplyChainAnalysis()    // Phase 4: Supply chain / multi-role entities
    await inferenceExamples()      // Phase 5: What can we deduce?
    await opportunityDiscovery()   // Phase 6: What can we recommend?
    await networkAnalysis()        // Phase 7: Graph structure insights

    console.log('\n' + '='.repeat(70))
    console.log('EXPLORATION COMPLETE')
    console.log('='.repeat(70))
    console.log('\nNext steps:')
    console.log('  1. Fill gaps identified in Phase 2')
    console.log('  2. Add entities in underserved regions')
    console.log('  3. Research certifications for uncertified entities')
    console.log('  4. Add SOURCES_FROM relationships between entities')
    console.log('  5. Add more cultivar→zone suitability data')
    console.log('')

  } catch (error) {
    console.error('Exploration failed:', error)
  } finally {
    await closeDriver()
  }
}

main()
