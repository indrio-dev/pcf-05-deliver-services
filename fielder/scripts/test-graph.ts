/**
 * Test the Fielder Knowledge Graph
 *
 * Runs validation queries to ensure the graph is properly seeded
 * and inference chains work as expected.
 *
 * Usage:
 *   npm run graph:test:full
 */

import {
  testConnection,
  runQuery,
  closeDriver,
} from '../src/lib/graph/index'

interface TestResult {
  name: string
  passed: boolean
  message: string
  data?: unknown
}

const results: TestResult[] = []

function test(name: string, passed: boolean, message: string, data?: unknown) {
  results.push({ name, passed, message, data })
  const icon = passed ? '✓' : '✗'
  console.log(`  ${icon} ${name}: ${message}`)
}

// =============================================================================
// CONNECTIVITY TESTS
// =============================================================================

async function testConnectivity(): Promise<void> {
  console.log('\n=== Connectivity Tests ===\n')

  const conn = await testConnection()
  test(
    'Neo4j Connection',
    conn.connected,
    conn.connected ? `Connected to ${conn.serverVersion}` : `Failed: ${conn.error}`
  )
}

// =============================================================================
// DATA INTEGRITY TESTS
// =============================================================================

async function testDataIntegrity(): Promise<void> {
  console.log('\n=== Data Integrity Tests ===\n')

  // Count nodes by label
  const nodeCounts = await runQuery<{ label: string; count: number }>(`
    CALL db.labels() YIELD label
    CALL apoc.cypher.run('MATCH (n:\`' + label + '\`) RETURN count(n) as count', {}) YIELD value
    RETURN label, value.count as count
    ORDER BY count DESC
  `)

  // If APOC not available, use simpler approach
  if (nodeCounts.length === 0) {
    const simpleCount = await runQuery<{ count: number | bigint }>(`
      MATCH (n) RETURN count(n) as count
    `)
    const totalCount = Number(simpleCount[0]?.count)
    test(
      'Total Nodes',
      totalCount > 200,
      `${totalCount} nodes (expected 200+)`
    )
  } else {
    test(
      'Node Labels',
      nodeCounts.length >= 15,
      `${nodeCounts.length} labels found`
    )
  }

  // Check for required nodes
  const states = await runQuery<{ count: number | bigint }>(`
    MATCH (s:State) RETURN count(s) as count
  `)
  const stateCount = Number(states[0]?.count)
  test('States', stateCount === 50, `${stateCount} states (expected 50)`)

  const zones = await runQuery<{ count: number | bigint }>(`
    MATCH (z:USDAZone) RETURN count(z) as count
  `)
  const zoneCount = Number(zones[0]?.count)
  test('USDA Zones', zoneCount === 18, `${zoneCount} zones (expected 18)`)

  const cultivars = await runQuery<{ count: number | bigint }>(`
    MATCH (c:Cultivar) RETURN count(c) as count
  `)
  const cultivarCount = Number(cultivars[0]?.count)
  test('Cultivars', cultivarCount >= 40, `${cultivarCount} cultivars (expected 40+)`)

  const farms = await runQuery<{ count: number | bigint }>(`
    MATCH (f:Farm) RETURN count(f) as count
  `)
  const farmCount = Number(farms[0]?.count)
  test('Farms', farmCount >= 20, `${farmCount} farms (expected 20+)`)

  const rootstocks = await runQuery<{ count: number | bigint }>(`
    MATCH (r:Rootstock) RETURN count(r) as count
  `)
  const rootstockCount = Number(rootstocks[0]?.count)
  test('Rootstocks', rootstockCount === 16, `${rootstockCount} rootstocks (expected 16)`)

  // Check for orphan nodes (nodes with no relationships)
  // Exclude USDAZone since cold zones (3a-4b) may not have growing regions linked
  const orphans = await runQuery<{ label: string; count: number | bigint }>(`
    MATCH (n)
    WHERE NOT (n)--() AND NOT n:USDAZone
    RETURN labels(n)[0] as label, count(n) as count
  `)
  const orphanCount = orphans.reduce((sum, o) => sum + Number(o.count), 0)
  test(
    'No Orphan Nodes (excl. zones)',
    orphanCount === 0,
    orphanCount === 0 ? 'All nodes connected' : `${orphanCount} orphan nodes found`,
    orphans
  )
}

// =============================================================================
// RELATIONSHIP TRAVERSAL TESTS
// =============================================================================

async function testRelationshipTraversal(): Promise<void> {
  console.log('\n=== Relationship Traversal Tests ===\n')

  // Test: Country → Region → State path
  const countryToState = await runQuery<{ path: string }>(`
    MATCH (c:Country {code: 'US'})-[:CONTAINS_REGION]->(r:Region)-[:CONTAINS_STATE]->(s:State {code: 'FL'})
    RETURN c.name + ' → ' + r.name + ' → ' + s.name as path
  `)
  test(
    'Country→Region→State',
    countryToState.length > 0,
    countryToState[0]?.path || 'Path not found'
  )

  // Test: State → GrowingRegion path (linked via CONTAINS_GROWING_REGION relationship)
  const growingRegions = await runQuery<{ name: string }>(`
    MATCH (s:State {code: 'FL'})-[:CONTAINS_GROWING_REGION]->(gr:GrowingRegion)
    RETURN gr.name as name
  `)
  test(
    'Florida Growing Regions',
    growingRegions.length >= 3,
    `${growingRegions.length} regions: ${growingRegions.map(r => r.name).join(', ')}`
  )

  // Test: Category → Subcategory → ProductType → Variety → Cultivar
  const taxonomyPath = await runQuery<{ path: string }>(`
    MATCH (cat:Category {id: 'fruit'})
          -[:HAS_SUBCATEGORY]->(sub:Subcategory {id: 'citrus'})
          -[:HAS_PRODUCT_TYPE]->(pt:ProductType {id: 'orange'})
          -[:HAS_VARIETY]->(v:Variety {id: 'navel'})
          -[:HAS_CULTIVAR]->(c:Cultivar {id: 'washington_navel'})
    RETURN cat.name + ' → ' + sub.name + ' → ' + pt.name + ' → ' + v.name + ' → ' + c.name as path
  `)
  test(
    'Taxonomy Path',
    taxonomyPath.length > 0,
    taxonomyPath[0]?.path || 'Path not found'
  )

  // Test: Farm → State and Farm → GrowingRegion
  const farmLinks = await runQuery<{ farm: string; state: string; region: string }>(`
    MATCH (f:Farm {id: 'hale_groves'})-[:LOCATED_IN]->(s:State)
    OPTIONAL MATCH (f)-[:IN_GROWING_REGION]->(gr:GrowingRegion)
    RETURN f.name as farm, s.name as state, gr.name as region
  `)
  test(
    'Farm Relationships',
    farmLinks.length > 0 && farmLinks[0]?.state !== null,
    farmLinks[0] ? `${farmLinks[0].farm} in ${farmLinks[0].state}, ${farmLinks[0].region}` : 'Not found'
  )

  // Test: Farm → ProductType (GROWS relationship)
  const farmProducts = await runQuery<{ farm: string; products: string[] }>(`
    MATCH (f:Farm {id: 'hale_groves'})-[:GROWS]->(pt:ProductType)
    RETURN f.name as farm, collect(pt.name) as products
  `)
  test(
    'Farm Products',
    farmProducts[0]?.products?.length >= 2,
    farmProducts[0] ? `${farmProducts[0].farm} grows: ${farmProducts[0].products.join(', ')}` : 'Not found'
  )
}

// =============================================================================
// INFERENCE CHAIN TESTS
// =============================================================================

async function testInferenceChains(): Promise<void> {
  console.log('\n=== Inference Chain Tests ===\n')

  // Test: Organic → Non-GMO inference
  const organicImplies = await runQuery<{ from: string; to: string; reason: string }>(`
    MATCH (o:Certification {id: 'usda_organic'})-[i:IMPLIES]->(n:Certification)
    RETURN o.name as from, n.name as to, i.reason as reason
  `)
  test(
    'Organic→Non-GMO Inference',
    organicImplies.length > 0,
    organicImplies[0] ? `${organicImplies[0].from} implies ${organicImplies[0].to}` : 'Not found'
  )

  // Test: Heritage cultivars flagged as non-GMO
  const heritageCultivars = await runQuery<{ name: string; isNonGMO: boolean }>(`
    MATCH (c:Cultivar)
    WHERE c.heritageIntent IN ['true_heritage', 'heirloom_quality']
    RETURN c.name as name, c.isNonGMO as isNonGMO
    LIMIT 5
  `)
  const allNonGMO = heritageCultivars.every(c => c.isNonGMO === true)
  test(
    'Heritage = Non-GMO',
    allNonGMO,
    allNonGMO ? 'All heritage cultivars marked non-GMO' : 'Some heritage cultivars missing non-GMO flag'
  )

  // Test: Growing region → USDA zone inference
  const regionZones = await runQuery<{ region: string; zones: string[] }>(`
    MATCH (gr:GrowingRegion {id: 'indian_river_fl'})-[:TYPICALLY_IN_ZONE]->(z:USDAZone)
    RETURN gr.name as region, collect(z.zone) as zones
  `)
  test(
    'Region→Zone Inference',
    regionZones[0]?.zones?.length >= 1,
    regionZones[0] ? `${regionZones[0].region} in zones: ${regionZones[0].zones.join(', ')}` : 'Not found'
  )

  // Test: Cultivar → Zone suitability
  const cultivarZones = await runQuery<{ cultivar: string; zones: string[] }>(`
    MATCH (c:Cultivar {id: 'washington_navel'})-[:SUITABLE_FOR_ZONE]->(z:USDAZone)
    RETURN c.name as cultivar, collect(z.zone) as zones
    LIMIT 1
  `)
  test(
    'Cultivar→Zone Suitability',
    cultivarZones[0]?.zones?.length >= 1,
    cultivarZones[0] ? `${cultivarZones[0].cultivar} suitable for ${cultivarZones[0].zones.length} zones` : 'Not found'
  )

  // Test: Rootstock quality tiers
  const premiumRootstocks = await runQuery<{ name: string; modifier: number }>(`
    MATCH (r:Rootstock)-[:HAS_QUALITY_TIER]->(t:QualityTier {id: 'premium_rootstock'})
    RETURN r.name as name, r.brixModifier as modifier
  `)
  test(
    'Premium Rootstocks',
    premiumRootstocks.length >= 2,
    `${premiumRootstocks.length} premium rootstocks: ${premiumRootstocks.map(r => r.name).join(', ')}`
  )
}

// =============================================================================
// USE CASE TESTS
// =============================================================================

async function testUseCases(): Promise<void> {
  console.log('\n=== Use Case Tests ===\n')

  // Use Case 1: "What citrus cultivars are suitable for Indian River, FL?"
  const indianRiverCitrus = await runQuery<{ cultivar: string; brixMin: number; brixMax: number }>(`
    MATCH (gr:GrowingRegion {id: 'indian_river_fl'})-[:TYPICALLY_IN_ZONE]->(z:USDAZone)
    MATCH (c:Cultivar)-[:SUITABLE_FOR_ZONE]->(z)
    MATCH (sub:Subcategory {id: 'citrus'})-[:HAS_PRODUCT_TYPE]->()-[:HAS_VARIETY]->()-[:HAS_CULTIVAR]->(c)
    RETURN DISTINCT c.name as cultivar, c.brixPotentialMin as brixMin, c.brixPotentialMax as brixMax
    ORDER BY c.brixPotentialMax DESC
    LIMIT 5
  `)
  test(
    'Use Case: Indian River Citrus',
    indianRiverCitrus.length >= 1,
    `${indianRiverCitrus.length} cultivars found`,
    indianRiverCitrus
  )

  // Use Case 2: "What farms grow oranges in Florida?"
  const floridaOrangeFarms = await runQuery<{ farm: string; website: string }>(`
    MATCH (f:Farm)-[:LOCATED_IN]->(s:State {code: 'FL'})
    MATCH (f)-[:GROWS]->(pt:ProductType {id: 'orange'})
    RETURN f.name as farm, f.website as website
  `)
  test(
    'Use Case: FL Orange Farms',
    floridaOrangeFarms.length >= 3,
    `${floridaOrangeFarms.length} farms: ${floridaOrangeFarms.map(f => f.farm).join(', ')}`
  )

  // Use Case 3: "What's the Brix potential for Washington Navel on Carrizo rootstock?"
  const brixPotential = await runQuery<{ cultivar: string; rootstock: string; baseMin: number; baseMax: number; modifier: number; adjustedMin: number; adjustedMax: number }>(`
    MATCH (c:Cultivar {id: 'washington_navel'})
    MATCH (r:Rootstock {id: 'carrizo'})
    RETURN
      c.name as cultivar,
      r.name as rootstock,
      c.brixPotentialMin as baseMin,
      c.brixPotentialMax as baseMax,
      r.brixModifier as modifier,
      c.brixPotentialMin + r.brixModifier as adjustedMin,
      c.brixPotentialMax + r.brixModifier as adjustedMax
  `)
  test(
    'Use Case: Brix Calculation',
    brixPotential.length > 0,
    brixPotential[0]
      ? `${brixPotential[0].cultivar} on ${brixPotential[0].rootstock}: ${brixPotential[0].adjustedMin}-${brixPotential[0].adjustedMax} Brix`
      : 'Not found'
  )

  // Use Case 4: "What zones have adequate chill hours for Honeycrisp apples?"
  const honeycrisp = await runQuery<{ cultivar: string; chillRequired: number; zones: string[] }>(`
    MATCH (c:Cultivar {id: 'honeycrisp'})
    MATCH (z:USDAZone)
    WHERE z.typicalChillHours[0] >= c.chillHoursRequired
    RETURN c.name as cultivar, c.chillHoursRequired as chillRequired, collect(z.zone) as zones
  `)
  test(
    'Use Case: Honeycrisp Chill Hours',
    honeycrisp[0]?.zones?.length >= 1,
    honeycrisp[0]
      ? `${honeycrisp[0].cultivar} needs ${honeycrisp[0].chillRequired} hrs, suitable in ${honeycrisp[0].zones.length} zones`
      : 'Not found'
  )

  // Use Case 5: "Traverse from Hale Groves to all connected nodes"
  const haleGroves = await runQuery<{ type: string; name: string }>(`
    MATCH (f:Farm {id: 'hale_groves'})-[r]-(connected)
    RETURN type(r) as type,
           CASE
             WHEN connected:State THEN connected.name
             WHEN connected:GrowingRegion THEN connected.name
             WHEN connected:ProductType THEN connected.name
             ELSE labels(connected)[0]
           END as name
  `)
  test(
    'Use Case: Farm Graph Traversal',
    haleGroves.length >= 4,
    `${haleGroves.length} connections: ${haleGroves.map(h => `${h.type}→${h.name}`).join(', ')}`
  )
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         FIELDER KNOWLEDGE GRAPH TESTS                      ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  try {
    await testConnectivity()
    await testDataIntegrity()
    await testRelationshipTraversal()
    await testInferenceChains()
    await testUseCases()

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    TEST SUMMARY                            ║')
    console.log('╠════════════════════════════════════════════════════════════╣')

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const total = results.length

    console.log(`║  Passed: ${passed.toString().padStart(3)}                                            ║`)
    console.log(`║  Failed: ${failed.toString().padStart(3)}                                            ║`)
    console.log(`║  Total:  ${total.toString().padStart(3)}                                            ║`)
    console.log('╚════════════════════════════════════════════════════════════╝')

    if (failed > 0) {
      console.log('\nFailed tests:')
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  ✗ ${r.name}: ${r.message}`)
        if (r.data) console.log(`    Data: ${JSON.stringify(r.data)}`)
      })
      process.exit(1)
    }

  } catch (error) {
    console.error('Test failed with error:', error)
    process.exit(1)
  } finally {
    await closeDriver()
  }
}

main()
