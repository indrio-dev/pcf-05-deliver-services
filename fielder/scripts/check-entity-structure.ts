#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Check current entity structure in Neo4j to understand what needs connecting
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CHECK ENTITY STRUCTURE IN NEO4J                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Count all entity types
  console.log('Query 1: Entity Type Counts')
  console.log('─────────────────────────────────────────────────────────\n')

  const entityCountsQuery = `
    CALL db.labels() YIELD label
    CALL {
      WITH label
      MATCH (n)
      WHERE label IN labels(n)
      RETURN count(n) as count
    }
    RETURN label, count
    ORDER BY count DESC
  `

  const counts = await runWriteTransaction(entityCountsQuery, {})

  for (const row of counts) {
    console.log(`  ${row.label}: ${row.count}`)
  }

  // Query 2: Sample entities with location data
  console.log('\n\nQuery 2: Sample Entities (first 10)')
  console.log('─────────────────────────────────────────────────────────\n')

  const entityTypes = ['Grower', 'Packinghouse', 'Retailer', 'Farm', 'Producer']

  for (const entityType of entityTypes) {
    const sampleQuery = `
      MATCH (n:${entityType})
      RETURN n.name as name,
             n.city as city,
             n.state as state,
             n.lat as lat,
             n.lon as lon,
             labels(n) as labels
      LIMIT 3
    `

    try {
      const samples = await runWriteTransaction(sampleQuery, {})

      if (samples.length > 0) {
        console.log(`\n${entityType} entities (${samples.length} samples):`)
        for (const s of samples) {
          console.log(`  • ${s.name || 'Unknown'}`)
          console.log(`    Location: ${s.city || '?'}, ${s.state || '?'}`)
          console.log(`    Coords: ${s.lat || '?'}, ${s.lon || '?'}`)
          console.log(`    Labels: ${s.labels.join(', ')}`)
        }
      }
    } catch (e) {
      // Entity type doesn't exist
    }
  }

  // Query 3: Check for existing region relationships
  console.log('\n\nQuery 3: Existing Region Relationships')
  console.log('─────────────────────────────────────────────────────────\n')

  const relationshipQuery = `
    MATCH (e)-[r]->(g:GrowingRegion)
    RETURN type(r) as relType,
           labels(e)[0] as entityType,
           count(r) as count
    ORDER BY count DESC
  `

  const rels = await runWriteTransaction(relationshipQuery, {})

  if (rels.length > 0) {
    console.log('Existing entity → GrowingRegion relationships:')
    for (const row of rels) {
      console.log(`  ${row.entityType} -[${row.relType}]-> GrowingRegion: ${row.count}`)
    }
  } else {
    console.log('  No entity → GrowingRegion relationships found yet')
  }

  // Query 4: Entities without region connections
  console.log('\n\nQuery 4: Entities Without Region Connections')
  console.log('─────────────────────────────────────────────────────────\n')

  const orphanQuery = `
    MATCH (n)
    WHERE (n:Grower OR n:Packinghouse OR n:Retailer OR n:Farm OR n:Producer)
      AND NOT (n)-[:LOCATED_IN]->(:GrowingRegion)
      AND NOT (n)-[:IN_REGION]->(:GrowingRegion)
    WITH labels(n)[0] as entityType, count(n) as count
    RETURN entityType, count
    ORDER BY count DESC
  `

  const orphans = await runWriteTransaction(orphanQuery, {})

  if (orphans.length > 0) {
    console.log('Entities not yet connected to regions:')
    for (const row of orphans) {
      console.log(`  ${row.entityType}: ${row.count}`)
    }
  } else {
    console.log('  All entities already connected!')
  }

  // Query 5: Sample entity with all properties
  console.log('\n\nQuery 5: Sample Entity Properties')
  console.log('─────────────────────────────────────────────────────────\n')

  const propsQuery = `
    MATCH (n)
    WHERE n:Grower OR n:Packinghouse OR n:Retailer
    RETURN properties(n) as props, labels(n) as labels
    LIMIT 1
  `

  const props = await runWriteTransaction(propsQuery, {})

  if (props.length > 0) {
    console.log('Sample entity properties:')
    console.log(JSON.stringify(props[0], null, 2))
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  ENTITY STRUCTURE CHECK COMPLETE                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
