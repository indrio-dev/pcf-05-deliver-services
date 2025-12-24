#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { VARIETIES, CULTIVARS, PRODUCT_TYPES_BY_ID } from '../src/lib/constants/products'

/**
 * Load Variety nodes to Neo4j and create the complete hierarchy:
 * ProductType → Variety → Cultivar
 *
 * This script:
 * 1. Creates Variety nodes from TypeScript VARIETIES array
 * 2. Maps cultivars to their varieties using intelligent matching
 * 3. Updates Cultivar nodes with varietyId property
 * 4. Creates BELONGS_TO_VARIETY relationships
 */

// Intelligent cultivar → variety mapping
// Some are obvious (cara_cara → navel), others are 1:1 (honeycrisp → honeycrisp)
const CULTIVAR_TO_VARIETY_MAP: Record<string, string> = {
  // === NAVEL ORANGES ===
  'navel_orange': 'navel',
  'cara_cara': 'navel',
  'lane_late': 'navel',

  // === VALENCIA ORANGES ===
  'valencia_orange': 'valencia',

  // === BLOOD ORANGES ===
  'blood_orange': 'blood',
  'moro_blood_orange': 'blood',
  'tarocco_blood_orange': 'blood',

  // === RUBY GRAPEFRUIT ===
  'ruby_red_grapefruit': 'ruby_grapefruit',
  'rio_star_grapefruit': 'ruby_grapefruit',

  // === WHITE GRAPEFRUIT ===
  'marsh_grapefruit': 'white_grapefruit',

  // === EUREKA LEMON ===
  'eureka_lemon': 'eureka_lemon',

  // === MEYER LEMON ===
  'meyer_lemon': 'meyer_lemon',

  // === APPLES (mostly 1:1) ===
  'honeycrisp': 'honeycrisp',
  'cosmic_crisp': 'cosmic_crisp',
  'fuji': 'fuji',
  'gala': 'gala',
  'pink_lady': 'pink_lady',
  'granny_smith': 'granny_smith',

  // === PEACHES ===
  'elberta_peach': 'yellow_peach',
  'georgia_belle': 'white_peach',
  'saturn_peach': 'donut_peach',

  // === PEARS ===
  'bartlett': 'bartlett',
  'anjou': 'anjou',
  'comice': 'comice',
  'bosc': 'bosc',

  // Add more mappings as needed
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD VARIETY HIERARCHY TO NEO4J                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
  console.log(`Processing ${VARIETIES.length} varieties...\n`)

  let varietiesCreated = 0
  let cultivarVarietyLinksCreated = 0
  let relationshipsCreated = 0

  // =========================================================================
  // STEP 1: Create Variety nodes
  // =========================================================================
  console.log('STEP 1: Creating Variety nodes...')

  for (const variety of VARIETIES) {
    await runWriteTransaction(`
      MERGE (v:Variety {id: $id})
      SET v.productId = $productId,
          v.displayName = $displayName,
          v.description = $description,
          v.source = 'typescript'

      // Link to ProductType
      MERGE (p:ProductType {id: $productId})
      MERGE (v)-[:BELONGS_TO_PRODUCT]->(p)
    `, {
      id: variety.id,
      productId: variety.productId,
      displayName: variety.displayName,
      description: variety.description || ''
    })

    varietiesCreated++

    // Show progress
    if (varietiesCreated % 5 === 0) {
      console.log(`  ✓ Created ${varietiesCreated}/${VARIETIES.length} varieties`)
    }
  }

  console.log(`  ✓ Completed: ${varietiesCreated} varieties\n`)

  // =========================================================================
  // STEP 2: Update Cultivar nodes with varietyId and create relationships
  // =========================================================================
  console.log('STEP 2: Linking cultivars to varieties...')

  for (const cultivar of CULTIVARS) {
    // Get varietyId from mapping, or check if cultivar.id matches a variety.id (1:1 case)
    const varietyId = CULTIVAR_TO_VARIETY_MAP[cultivar.id] ||
                      (VARIETIES.find(v => v.id === cultivar.id)?.id)

    if (!varietyId) {
      console.log(`  ⚠️  No variety mapping for cultivar: ${cultivar.id}`)
      continue
    }

    // Update Cultivar node with varietyId and create relationship
    await runWriteTransaction(`
      MERGE (c:Cultivar {id: $cultivarId})
      SET c.varietyId = $varietyId

      // Create relationship to Variety
      MERGE (v:Variety {id: $varietyId})
      MERGE (c)-[:BELONGS_TO_VARIETY]->(v)
    `, {
      cultivarId: cultivar.id,
      varietyId: varietyId
    })

    cultivarVarietyLinksCreated++
    relationshipsCreated++

    // Show progress
    if (cultivarVarietyLinksCreated % 10 === 0) {
      console.log(`  ✓ Linked ${cultivarVarietyLinksCreated} cultivars to varieties`)
    }
  }

  console.log(`  ✓ Completed: ${cultivarVarietyLinksCreated} cultivar→variety links\n`)

  // =========================================================================
  // STEP 3: Verify hierarchy
  // =========================================================================
  console.log('STEP 3: Verifying hierarchy...\n')

  const hierarchyQuery = `
    MATCH (p:ProductType)<-[:BELONGS_TO_PRODUCT]-(v:Variety)<-[:BELONGS_TO_VARIETY]-(c:Cultivar)
    RETURN p.displayName as product,
           v.displayName as variety,
           count(c) as cultivarCount
    ORDER BY p.displayName, v.displayName
  `

  const result = await runWriteTransaction(hierarchyQuery, {})

  console.log('Hierarchy verification:')
  console.log('─────────────────────────────────────────────────────────')
  for (const row of result) {
    console.log(`  ${row.product} → ${row.variety} (${row.cultivarCount} cultivars)`)
  }

  // Count orphaned cultivars (no variety link)
  const orphanQuery = `
    MATCH (c:Cultivar)
    WHERE NOT (c)-[:BELONGS_TO_VARIETY]->()
    RETURN count(c) as orphanCount
  `
  const orphanResult = await runWriteTransaction(orphanQuery, {})
  const orphanCount = orphanResult[0]?.orphanCount || 0

  if (orphanCount > 0) {
    console.log(`\n  ⚠️  ${orphanCount} cultivars without variety links`)
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  VARIETY HIERARCHY LOAD COMPLETE                       ║')
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log(`\n✓ Varieties created: ${varietiesCreated}`)
  console.log(`✓ Cultivar→Variety links: ${cultivarVarietyLinksCreated}`)
  console.log(`✓ BELONGS_TO_VARIETY relationships: ${relationshipsCreated}`)
  if (orphanCount > 0) {
    console.log(`⚠️  Orphaned cultivars: ${orphanCount}`)
  }
  console.log('\nHierarchy now complete:')
  console.log('  ProductType → Variety → Cultivar → [Trade Names]')
  console.log('')

  await closeDriver()
}

main().catch(console.error)
