#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify the Variety hierarchy is correctly loaded and working
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY VARIETY HIERARCHY                              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Full hierarchy traversal
  console.log('Query 1: Complete hierarchy (ProductType → Variety → Cultivar)')
  console.log('─────────────────────────────────────────────────────────\n')

  const hierarchyQuery = `
    MATCH (p:ProductType)<-[:BELONGS_TO_PRODUCT]-(v:Variety)<-[:BELONGS_TO_VARIETY]-(c:Cultivar)
    RETURN p.displayName as product,
           v.id as varietyId,
           v.displayName as variety,
           collect(c.displayName) as cultivars,
           count(c) as cultivarCount
    ORDER BY p.displayName, v.displayName
  `

  const hierarchy = await runWriteTransaction(hierarchyQuery, {})

  for (const row of hierarchy) {
    console.log(`📦 ${row.product || 'Unknown'}`)
    console.log(`  ├─ Variety: ${row.variety} (${row.varietyId})`)
    console.log(`  └─ Cultivars (${row.cultivarCount}):`)
    for (const cultivar of row.cultivars) {
      console.log(`      • ${cultivar}`)
    }
    console.log('')
  }

  // Query 2: Navel orange specific example
  console.log('\nQuery 2: Navel Orange variety with all cultivars')
  console.log('─────────────────────────────────────────────────────────\n')

  const navelQuery = `
    MATCH (v:Variety {id: 'navel'})<-[:BELONGS_TO_VARIETY]-(c:Cultivar)
    RETURN v.displayName as variety,
           collect({
             id: c.id,
             name: c.displayName,
             varietyId: c.varietyId
           }) as cultivars
  `

  const navelResult = await runWriteTransaction(navelQuery, {})

  if (navelResult.length > 0) {
    const navel = navelResult[0]
    console.log(`Variety: ${navel.variety}`)
    console.log(`Cultivars:`)
    for (const c of navel.cultivars) {
      console.log(`  • ${c.name} (id: ${c.id}, varietyId: ${c.varietyId})`)
    }
  } else {
    console.log('⚠️  No navel orange variety found')
  }

  // Query 3: Verify ProductType → Variety → Cultivar chain
  console.log('\n\nQuery 3: Verify complete chain for a specific cultivar')
  console.log('─────────────────────────────────────────────────────────\n')

  const chainQuery = `
    MATCH (c:Cultivar {id: 'cara_cara'})-[:BELONGS_TO_VARIETY]->(v:Variety)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
    RETURN p.displayName as product,
           v.displayName as variety,
           c.displayName as cultivar
  `

  const chain = await runWriteTransaction(chainQuery, {})

  if (chain.length > 0) {
    const c = chain[0]
    console.log(`Complete chain for Cara Cara:`)
    console.log(`  ProductType: ${c.product}`)
    console.log(`  └─ Variety: ${c.variety}`)
    console.log(`     └─ Cultivar: ${c.cultivar}`)
  } else {
    console.log('⚠️  Chain not found')
  }

  // Query 4: Count statistics
  console.log('\n\nQuery 4: Hierarchy statistics')
  console.log('─────────────────────────────────────────────────────────\n')

  const statsQuery = `
    MATCH (v:Variety)
    OPTIONAL MATCH (v)<-[:BELONGS_TO_VARIETY]-(c:Cultivar)
    WITH count(DISTINCT v) as varietyCount, count(c) as linkedCultivarCount
    MATCH (allCultivars:Cultivar)
    WITH varietyCount, linkedCultivarCount, count(allCultivars) as totalCultivars
    RETURN varietyCount,
           linkedCultivarCount,
           totalCultivars,
           (totalCultivars - linkedCultivarCount) as orphanedCultivars
  `

  const stats = await runWriteTransaction(statsQuery, {})

  if (stats.length > 0) {
    const s = stats[0]
    console.log(`Total Varieties: ${s.varietyCount}`)
    console.log(`Total Cultivars: ${s.totalCultivars}`)
    console.log(`Cultivars linked to varieties: ${s.linkedCultivarCount}`)
    console.log(`Cultivars without variety links: ${s.orphanedCultivars}`)
    console.log(`\nNote: Orphaned cultivars are expected for products that don't have`)
    console.log(`varieties defined yet (meat, seafood, vegetables, etc.)`)
  }

  // Query 5: Show which varieties are 1:1 with cultivars vs 1:many
  console.log('\n\nQuery 5: Variety cardinality (1:1 vs 1:many)')
  console.log('─────────────────────────────────────────────────────────\n')

  const cardinalityQuery = `
    MATCH (v:Variety)<-[:BELONGS_TO_VARIETY]-(c:Cultivar)
    WITH v, count(c) as cultivarCount
    ORDER BY cultivarCount DESC, v.displayName
    RETURN v.displayName as variety,
           cultivarCount,
           CASE
             WHEN cultivarCount = 1 THEN '1:1 (variety = cultivar)'
             ELSE '1:many (variety has multiple cultivars)'
           END as relationship
  `

  const cardinality = await runWriteTransaction(cardinalityQuery, {})

  for (const row of cardinality) {
    console.log(`  ${row.variety}: ${row.cultivarCount} cultivar(s) - ${row.relationship}`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFICATION COMPLETE                                 ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
