/**
 * Knowledge Graph Gap Analysis
 * Identifies missing data and relationships in the graph
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function analyzeGaps() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         KNOWLEDGE GRAPH GAP ANALYSIS                       ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // 1. Growing regions without entities
  const emptyRegions = await runQuery(`
    MATCH (gr:GrowingRegion)
    WHERE NOT EXISTS { MATCH (:Entity)-[:IN_GROWING_REGION]->(gr) }
    RETURN gr.id AS id, gr.name AS name, gr.state AS state
    ORDER BY gr.state, gr.name
  `)
  console.log('📍 Growing Regions Without Entities:', emptyRegions.length)
  emptyRegions.forEach((r: any) => console.log('   -', r.name, '(' + r.state + ')'))

  // 2. Entities without growing region
  const noRegion = await runQuery(`
    MATCH (e:Entity)
    WHERE NOT EXISTS { MATCH (e)-[:IN_GROWING_REGION]->(:GrowingRegion) }
    RETURN e.id AS id, e.name AS name, e.state AS state
  `)
  console.log('\n🏭 Entities Without Growing Region:', noRegion.length)
  noRegion.forEach((r: any) => console.log('   -', r.name, '(' + r.state + ')'))

  // 3. Packinghouses without B2B channels
  const noB2B = await runQuery(`
    MATCH (e:Entity:Packinghouse)
    WHERE e.b2bChannels IS NULL OR size(e.b2bChannels) = 0
    RETURN e.id AS id, e.name AS name, e.facilityType AS facility
    ORDER BY e.name
  `)
  console.log('\n📦 Packinghouses Without B2B Channels:', noB2B.length)
  noB2B.forEach((r: any) => console.log('   -', r.name, '(' + (r.facility || 'unknown') + ')'))

  // 4. Retailers without retail channels
  const noRetail = await runQuery(`
    MATCH (e:Entity:Retailer)
    WHERE e.retailChannels IS NULL OR size(e.retailChannels) = 0
    RETURN e.id AS id, e.name AS name
    ORDER BY e.name
  `)
  console.log('\n🏪 Retailers Without Retail Channels:', noRetail.length)
  noRetail.forEach((r: any) => console.log('   -', r.name))

  // 5. Entities without certifications
  const noCerts = await runQuery(`
    MATCH (e:Entity)
    WHERE NOT EXISTS { MATCH (e)-[:HAS_CERTIFICATION]->(:Certification) }
    RETURN count(e) AS count
  `)
  console.log('\n📜 Entities Without Certifications:', noCerts[0].count)

  // 6. SOURCES_FROM relationships (supply chain)
  const sourcesFrom = await runQuery(`
    MATCH ()-[r:SOURCES_FROM]->()
    RETURN count(r) AS count
  `)
  console.log('\n🔗 SOURCES_FROM Relationships:', sourcesFrom[0].count)

  // 7. Product types without any growers
  const orphanProducts = await runQuery(`
    MATCH (pt:ProductType)
    WHERE NOT EXISTS { MATCH (:Entity)-[:GROWS]->(pt) }
    RETURN pt.id AS id, pt.name AS name
    ORDER BY pt.name
  `)
  console.log('\n🍎 Product Types Without Growers:', orphanProducts.length)
  orphanProducts.forEach((r: any) => console.log('   -', r.name))

  // 8. Cultivars not linked to any entity products
  const orphanCultivars = await runQuery(`
    MATCH (c:Cultivar)
    WHERE NOT EXISTS { MATCH (:Entity)-[:GROWS]->(:ProductType)-[:HAS_CULTIVAR]->(c) }
    RETURN c.id AS id, c.name AS name
    ORDER BY c.name
    LIMIT 15
  `)
  const totalOrphanCultivars = await runQuery(`
    MATCH (c:Cultivar)
    WHERE NOT EXISTS { MATCH (:Entity)-[:GROWS]->(:ProductType)-[:HAS_CULTIVAR]->(c) }
    RETURN count(c) AS count
  `)
  console.log('\n🌿 Cultivars Not Grown by Any Entity:', totalOrphanCultivars[0].count)
  if (orphanCultivars.length > 0) {
    console.log('   (showing first 15)')
    orphanCultivars.forEach((r: any) => console.log('   -', r.name))
  }

  // 9. Growers without any GROWS relationships
  const noGrows = await runQuery(`
    MATCH (e:Entity:Grower)
    WHERE NOT EXISTS { MATCH (e)-[:GROWS]->(:ProductType) }
    RETURN e.id AS id, e.name AS name
    ORDER BY e.name
  `)
  console.log('\n🌱 Growers Without GROWS Relationships:', noGrows.length)
  noGrows.forEach((r: any) => console.log('   -', r.name))

  // 10. States without any entities
  const emptyStates = await runQuery(`
    MATCH (s:State)
    WHERE NOT EXISTS { MATCH (:Entity)-[:LOCATED_IN]->(s) }
    RETURN s.code AS code, s.name AS name
    ORDER BY s.name
  `)
  console.log('\n🗺️  States Without Entities:', emptyStates.length)
  if (emptyStates.length <= 20) {
    emptyStates.forEach((r: any) => console.log('   -', r.name, '(' + r.code + ')'))
  } else {
    console.log('   (too many to list - showing count only)')
  }

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('SUMMARY')
  console.log('═'.repeat(60))
  console.log('Critical gaps (need attention):')
  if (noRegion.length > 0) console.log('  ⚠️  ' + noRegion.length + ' entities missing growing region')
  if (noGrows.length > 0) console.log('  ⚠️  ' + noGrows.length + ' growers without GROWS relationships')
  if (noRetail.length > 0) console.log('  ⚠️  ' + noRetail.length + ' retailers without retail channels')
  if (noRegion.length === 0 && noGrows.length === 0 && noRetail.length === 0) {
    console.log('  ✅ No critical gaps!')
  }
  console.log('\nExpected gaps (future work):')
  console.log('  ℹ️  ' + noCerts[0].count + ' entities need certification data')
  console.log('  ℹ️  ' + sourcesFrom[0].count + ' SOURCES_FROM relationships (supply chain TBD)')
  console.log('  ℹ️  ' + emptyStates.length + ' states without entities (expand coverage)')
  console.log('  ℹ️  ' + orphanProducts.length + ' product types without growers')

  await closeDriver()
}

analyzeGaps().catch(console.error)
