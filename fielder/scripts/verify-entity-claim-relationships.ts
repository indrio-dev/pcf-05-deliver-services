#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify Entity→Claim relationships and demonstrate farm validation queries
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY ENTITY→CLAIM RELATIONSHIPS                     ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Relationship statistics
  console.log('Query 1: Entity→Claim Relationship Statistics')
  console.log('─────────────────────────────────────────────────────────\n')

  const statsQuery = `
    MATCH (e:Entity)-[r:HAS_CLAIM]->(c:Claim)
    RETURN count(DISTINCT e) as entitiesWithClaims,
           count(r) as totalRelationships,
           count(DISTINCT c) as claimsUsed
  `

  const stats = await runWriteTransaction(statsQuery, {})

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`  Entities with claims: ${s.entitiesWithClaims}`)
    console.log(`  Total relationships: ${s.totalRelationships}`)
    console.log(`  Claims represented: ${s.claimsUsed}`)
  }

  // Query 2: Breakdown by claim
  console.log('\n\nQuery 2: Entities by Claim Type')
  console.log('─────────────────────────────────────────────────────────\n')

  const byClaimQuery = `
    MATCH (e:Entity)-[:HAS_CLAIM]->(c:Claim)
    WITH c.name as claim, count(DISTINCT e) as entityCount
    RETURN claim, entityCount
    ORDER BY entityCount DESC
  `

  const byClaim = await runWriteTransaction(byClaimQuery, {})

  for (const row of byClaim) {
    console.log(`  ${row.claim}: ${row.entityCount} entities`)
  }

  // Query 3: Find organic farms
  console.log('\n\nQuery 3: Find Organic Farms')
  console.log('─────────────────────────────────────────────────────────\n')

  const organicQuery = `
    MATCH (e:Entity:Grower)-[:HAS_CLAIM]->(c:Claim {id: 'organic'})
    OPTIONAL MATCH (e)-[:LOCATED_IN]->(r:GrowingRegion)
    RETURN e.name as farm,
           e.city as city,
           r.displayName as region,
           r.state as state
    LIMIT 15
  `

  const organic = await runWriteTransaction(organicQuery, {})

  if (organic.length > 0) {
    console.log('Organic farms found:')
    for (const row of organic) {
      console.log(`  • ${row.farm}`)
      console.log(`    ${row.city || '?'}, ${row.region || '?'}, ${row.state || '?'}`)
    }
  } else {
    console.log('  (No organic farms found - most entities lack explicit organic certification in features)')
  }

  // Query 4: Find organic farms in specific region
  console.log('\n\nQuery 4: Organic Farms in Indian River')
  console.log('─────────────────────────────────────────────────────────\n')

  const organicIndianRiverQuery = `
    MATCH (e:Entity:Grower)-[:HAS_CLAIM]->(c:Claim {id: 'organic'})
    MATCH (e)-[:LOCATED_IN]->(r:GrowingRegion {id: 'indian_river'})
    RETURN e.name as farm,
           e.city as city,
           e.website as website
  `

  const organicIR = await runWriteTransaction(organicIndianRiverQuery, {})

  if (organicIR.length > 0) {
    for (const row of organicIR) {
      console.log(`  • ${row.farm}`)
      console.log(`    ${row.city}`)
      if (row.website) {
        console.log(`    ${row.website}`)
      }
    }
  } else {
    console.log('  (None found in Indian River)')
  }

  // Query 5: Sample entities with claims
  console.log('\n\nQuery 5: Sample Entities with Their Claims')
  console.log('─────────────────────────────────────────────────────────\n')

  const sampleQuery = `
    MATCH (e:Entity)-[:HAS_CLAIM]->(c:Claim)
    WITH e, collect(c.name) as claims
    RETURN e.name as entity,
           e.features as features,
           e.certifications as certifications,
           claims
    LIMIT 10
  `

  const samples = await runWriteTransaction(sampleQuery, {})

  for (const row of samples) {
    console.log(`  • ${row.entity}`)
    console.log(`    Features: ${row.features.join(', ')}`)
    console.log(`    Certifications: ${row.certifications.join(', ') || 'None'}`)
    console.log(`    Claims: ${row.claims.join(', ')}`)
    console.log('')
  }

  // Query 6: Cross-pillar - Organic farms with heritage cultivars
  console.log('\nQuery 6: Cross-Pillar Query')
  console.log('(Organic farms in regions growing heritage citrus)')
  console.log('─────────────────────────────────────────────────────────\n')

  const crossPillarQuery = `
    MATCH (e:Entity:Grower)-[:HAS_CLAIM]->(claim:Claim {id: 'organic'})
    MATCH (e)-[:LOCATED_IN]->(r:GrowingRegion)
    MATCH (c:Cultivar)-[:GROWN_IN]->(r)
    WHERE c.isHeritage = true
      AND c.productId IN ['orange', 'grapefruit', 'tangerine']
    WITH e, r, collect(DISTINCT c.displayName)[0..3] as heritageCitrus
    RETURN e.name as farm,
           r.displayName as region,
           r.state as state,
           heritageCitrus
    LIMIT 10
  `

  const crossPillar = await runWriteTransaction(crossPillarQuery, {})

  if (crossPillar.length > 0) {
    for (const row of crossPillar) {
      console.log(`  • ${row.farm} (${row.region}, ${row.state})`)
      if (row.heritageCitrus.length > 0) {
        console.log(`    Can grow: ${row.heritageCitrus.join(', ')}`)
      }
    }
  } else {
    console.log('  (None found - entity features may not contain explicit "organic")')
  }

  // Query 7: What features didn't match to claims?
  console.log('\n\nQuery 7: Common Features Not Mapped to Claims')
  console.log('(Informational - shows what other attributes entities have)')
  console.log('─────────────────────────────────────────────────────────\n')

  const unmappedQuery = `
    MATCH (e:Entity)
    WHERE size(e.features) > 0
    UNWIND e.features as feature
    WITH feature, count(*) as count
    WHERE NOT feature =~ '(?i).*(organic|grass|pasture|cage|free.?range|gmo).*'
    RETURN feature, count
    ORDER BY count DESC
    LIMIT 20
  `

  const unmapped = await runWriteTransaction(unmappedQuery, {})

  console.log('Top non-claim features (informational/descriptive):')
  for (const row of unmapped) {
    console.log(`  ${row.feature}: ${row.count}`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  ENTITY→CLAIM VERIFICATION COMPLETE                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
