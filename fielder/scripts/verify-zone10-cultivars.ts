#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify Zone 10 cultivars are loaded and queryable
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY ZONE 10 CULTIVARS                              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Total Zone 10 cultivars
  console.log('Query 1: Total Zone 10 Compatible Cultivars')
  console.log('─────────────────────────────────────────────────────────\n')

  const totalQuery = `
    MATCH (c:Cultivar)
    WHERE c.usdaZoneMin <= 10 AND c.usdaZoneMax >= 10
    RETURN count(c) as total
  `

  const total = await runWriteTransaction(totalQuery, {})
  console.log(`  Total cultivars that can grow in Zone 10: ${total[0].total}\n`)

  // Query 2: By category
  console.log('Query 2: Zone 10 Cultivars by Category')
  console.log('─────────────────────────────────────────────────────────\n')

  const categoryQuery = `
    MATCH (c:Cultivar)
    WHERE c.usdaZoneMin <= 10 AND c.usdaZoneMax >= 10
    WITH c.category as category, count(c) as count
    RETURN category, count
    ORDER BY count DESC
  `

  const categories = await runWriteTransaction(categoryQuery, {})
  for (const row of categories) {
    console.log(`  ${row.category || 'unknown'}: ${row.count}`)
  }

  // Query 3: Sample vegetables
  console.log('\n\nQuery 3: Sample Zone 10 Vegetables')
  console.log('─────────────────────────────────────────────────────────\n')

  const veggiesQuery = `
    MATCH (c:Cultivar)
    WHERE c.category = 'vegetable'
      AND c.usdaZoneMin <= 10
      AND c.usdaZoneMax >= 10
    RETURN c.displayName as name,
           c.usdaZoneMin as zoneMin,
           c.usdaZoneMax as zoneMax,
           c.daysToMaturity as days
    ORDER BY c.displayName
    LIMIT 20
  `

  const veggies = await runWriteTransaction(veggiesQuery, {})
  for (const row of veggies) {
    const zones = `Zones ${row.zoneMin}-${row.zoneMax}`
    const days = row.days ? `${row.days} days` : 'N/A'
    console.log(`  • ${row.name}`)
    console.log(`    ${zones}, ${days}`)
  }

  // Query 4: Tomato varieties for Zone 10
  console.log('\n\nQuery 4: Tomato Varieties Compatible with Zone 10')
  console.log('─────────────────────────────────────────────────────────\n')

  const tomatoQuery = `
    MATCH (c:Cultivar)
    WHERE c.displayName CONTAINS 'Tomato'
      AND c.usdaZoneMin <= 10
      AND c.usdaZoneMax >= 10
    RETURN c.displayName as name,
           c.usdaZones as zones,
           c.daysToMaturity as days
    ORDER BY c.displayName
    LIMIT 15
  `

  const tomatoes = await runWriteTransaction(tomatoQuery, {})
  console.log(`  Found ${tomatoes.length} tomato varieties:\n`)
  for (const row of tomatoes) {
    const days = row.days || 'N/A'
    console.log(`  • ${row.name} (${days} days)`)
  }

  // Query 5: Pepper varieties
  console.log('\n\nQuery 5: Pepper Varieties Compatible with Zone 10')
  console.log('─────────────────────────────────────────────────────────\n')

  const pepperQuery = `
    MATCH (c:Cultivar)
    WHERE (c.displayName CONTAINS 'Pepper' OR c.displayName CONTAINS 'Chile')
      AND c.usdaZoneMin <= 10
      AND c.usdaZoneMax >= 10
    RETURN c.displayName as name
    ORDER BY c.displayName
    LIMIT 15
  `

  const peppers = await runWriteTransaction(pepperQuery, {})
  console.log(`  Found ${peppers.length} pepper varieties:\n`)
  for (const row of peppers) {
    console.log(`  • ${row.name}`)
  }

  // Query 6: Can NOW query Zone 10
  console.log('\n\nQuery 6: Direct Zone 10 Query Test')
  console.log('─────────────────────────────────────────────────────────\n')

  const zoneQueryTest = `
    MATCH (z:USDAZone {zone: '10'})
    MATCH (c:Cultivar)-[:COMPATIBLE_WITH_ZONE]->(z)
    WHERE c.category = 'vegetable'
    RETURN count(c) as vegetables
  `

  const zoneTest = await runWriteTransaction(zoneQueryTest, {})
  console.log(`  Vegetables with Zone 10 relationship: ${zoneTest[0].vegetables}`)
  console.log(`  ✅ Can now query: "Find all Zone 10 compatible vegetables"`)

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  ZONE 10 VERIFICATION COMPLETE                         ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
