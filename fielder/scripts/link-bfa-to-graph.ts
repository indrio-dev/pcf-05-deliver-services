#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Link BFA measurements to the SHARE framework
 *
 * Creates:
 * 1. BFA→Cultivar relationships (by species match)
 * 2. BFA→Region relationships (by state/county)
 * 3. BFA→Claim relationships (from practices)
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LINK BFA MEASUREMENTS TO SHARE FRAMEWORK              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let stats = {
    cultivarLinks: 0,
    regionLinks: 0,
    claimLinks: 0,
  }

  // =========================================================================
  // STEP 1: Link to Cultivars by Species
  // =========================================================================
  console.log('STEP 1: Linking BFA measurements to cultivars by species...\n')

  const cultivarLinkQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.species IS NOT NULL
      AND NOT (m)-[:MEASURED_FROM]->()

    MATCH (c:Cultivar)
    WHERE c.productId = m.species
       OR toLower(c.displayName) CONTAINS m.species
       OR toLower(c.name) CONTAINS m.species

    WITH m, c
    ORDER BY m.id,
      CASE
        WHEN c.productId = m.species THEN 1
        ELSE 2
      END
    LIMIT 1

    MERGE (m)-[:MEASURED_FROM]->(c)
    RETURN count(*) as linked
  `

  const cultivarResult = await runWriteTransaction(cultivarLinkQuery, {})
  stats.cultivarLinks = cultivarResult[0]?.linked || 0

  console.log(`  ✓ Created ${stats.cultivarLinks} BFA→Cultivar relationships\n`)

  // =========================================================================
  // STEP 2: Link to Regions by State
  // =========================================================================
  console.log('STEP 2: Linking BFA measurements to regions by state...\n')

  const regionLinkQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.state IS NOT NULL
      AND NOT (m)-[:FROM_REGION]->()

    MATCH (r:GrowingRegion)
    WHERE toLower(r.state) = m.state
      AND r.dtcActivity = 'high'  // Prefer high-activity regions

    WITH m, r
    LIMIT 1

    MERGE (m)-[:FROM_REGION]->(r)
    RETURN count(*) as linked
  `

  const regionResult = await runWriteTransaction(regionLinkQuery, {})
  stats.regionLinks = regionResult[0]?.linked || 0

  console.log(`  ✓ Created ${stats.regionLinks} BFA→Region relationships\n`)

  // =========================================================================
  // STEP 3: Link to Claims from Practices
  // =========================================================================
  console.log('STEP 3: Linking BFA measurements to claims from practices...\n')

  // Link organic
  const organicLinkQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.farmPractices IS NOT NULL
      AND (m.farmPractices CONTAINS 'organic'
           OR m.farmPractices CONTAINS 'certified_organic')

    MATCH (c:Claim {id: 'organic'})
    MERGE (m)-[:HAS_PRACTICE]->(c)
    RETURN count(*) as linked
  `

  const organicResult = await runWriteTransaction(organicLinkQuery, {})
  stats.claimLinks += organicResult[0]?.linked || 0

  // Link regenerative
  const regenLinkQuery = `
    MATCH (m:BFAMeasurement)
    WHERE m.farmPractices IS NOT NULL
      AND m.farmPractices CONTAINS 'regenerative'

    MATCH (c:Claim {id: 'regenerative'})
    MERGE (m)-[:HAS_PRACTICE]->(c)
    RETURN count(*) as linked
  `

  const regenResult = await runWriteTransaction(regenLinkQuery, {})
  stats.claimLinks += regenResult[0]?.linked || 0

  console.log(`  ✓ Created ${stats.claimLinks} BFA→Claim relationships\n`)

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  BFA INTEGRATION COMPLETE                              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Relationships created:`)
  console.log(`  BFA→Cultivar: ${stats.cultivarLinks}`)
  console.log(`  BFA→Region: ${stats.regionLinks}`)
  console.log(`  BFA→Claim: ${stats.claimLinks}`)

  // Show sample integrated query
  console.log('\n\nSample integrated query (carrot Brix by region):\n')

  const sampleQuery = `
    MATCH (m:BFAMeasurement)-[:MEASURED_FROM]->(c:Cultivar)
    MATCH (m)-[:FROM_REGION]->(r:GrowingRegion)
    WHERE c.productId = 'carrot'
      AND m.brix IS NOT NULL
    RETURN c.displayName as cultivar,
           r.displayName as region,
           r.state as state,
           avg(m.brix) as avgBrix,
           count(m) as samples
    ORDER BY avgBrix DESC
    LIMIT 10
  `

  const sampleResult = await runWriteTransaction(sampleQuery, {})

  if (sampleResult.length > 0) {
    console.log('Carrot Brix by region (from BFA data):')
    for (const row of sampleResult) {
      console.log(`  ${row.region || 'Unknown'}, ${row.state}: ${row.avgBrix.toFixed(1)}°Bx (${row.samples} samples)`)
    }
  } else {
    console.log('  (No fully-linked carrot measurements found)')
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
