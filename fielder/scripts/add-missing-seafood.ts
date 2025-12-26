#!/usr/bin/env tsx

/**
 * Add Missing Seafood Cultivars to Reach 5 Minimum
 *
 * Pacific Salmon: 4 → 5
 * Oyster: 4 → 5
 * Crab: 3 → 5
 * Lobster: 4 → 5
 * Crawfish: 4 → 5
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface Cultivar {
  id: string
  varietyId: string
  productId: string
  displayName: string
  description: string
  heritageIntent?: string
  omegaBaseline?: string
  notes?: string
}

const MISSING_CULTIVARS: Cultivar[] = [
  // PACIFIC SALMON - Need 1 more (add Columbia River Spring Chinook)
  {
    id: 'columbia_spring_chinook',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Columbia River Spring Chinook',
    description: 'Spring run King from Columbia, premium quality',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.2-0.5:1 (wild, high omega-3)',
    notes: 'Columbia River OR/WA, spring run (May-June), highest fat content, premium market'
  },

  // OYSTER - Need 1 more
  {
    id: 'wellfleet_oyster',
    varietyId: 'oyster_types',
    productId: 'oyster',
    displayName: 'Wellfleet Oyster',
    description: 'Cape Cod Eastern oyster, briny and sweet',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (filter feeder)',
    notes: 'Wellfleet MA, Cape Cod Bay, Eastern oyster with distinct terroir'
  },

  // CRAB - Need 2 more
  {
    id: 'golden_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Golden Crab',
    description: 'Deep water Atlantic, sweet white meat',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild deepwater)',
    notes: 'Atlantic deep water (600-2000ft), Florida/Caribbean, sweet like king crab'
  },
  {
    id: 'rock_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Rock Crab',
    description: 'New England, sweet picked meat',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Atlantic coast, marketed as "peekytoe" in Maine, sweet meat'
  },

  // LOBSTER - Need 1 more
  {
    id: 'rock_lobster',
    varietyId: 'lobster_types',
    productId: 'lobster',
    displayName: 'Rock Lobster (Spiny)',
    description: 'General term for spiny lobsters, no claws',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Warm waters worldwide, all tail meat, multiple species'
  },

  // CRAWFISH - Need 1 more
  {
    id: 'wild_swamp_crawfish',
    varietyId: 'crawfish_types',
    productId: 'crawfish',
    displayName: 'Wild Swamp Crawfish',
    description: 'Wild harvest from Louisiana swamps and bayous',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Louisiana wild harvest, variable supply, premium over pond-raised'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('ADD MISSING SEAFOOD CULTIVARS')
  console.log('='.repeat(80))
  console.log()
  console.log(`Adding ${MISSING_CULTIVARS.length} cultivars to reach 5 minimum...`)
  console.log()

  let added = 0
  let errors = 0

  for (const cultivar of MISSING_CULTIVARS) {
    try {
      await runWriteTransaction(`
        CREATE (c:Cultivar {
          id: $id,
          productId: $productId,
          displayName: $displayName,
          name: $displayName,
          varietyId: $varietyId,
          description: $description,
          source: 'typescript_seafood',
          modelType: 'parent'
        })

        // Add optional fields
        SET c.heritageIntent = $heritageIntent,
            c.omegaBaseline = $omegaBaseline,
            c.notes = $notes

        // Link to Variety
        WITH c
        MATCH (v:Variety {id: $varietyId})
        MERGE (c)-[:BELONGS_TO_VARIETY]->(v)

        // Link to ProductType
        WITH c
        MATCH (p:ProductType {id: $productId})
        MERGE (c)-[:IS_A]->(p)

        RETURN c.displayName as name
      `, {
        id: cultivar.id,
        productId: cultivar.productId,
        varietyId: cultivar.varietyId,
        displayName: cultivar.displayName,
        description: cultivar.description,
        heritageIntent: cultivar.heritageIntent || null,
        omegaBaseline: cultivar.omegaBaseline || null,
        notes: cultivar.notes || null
      })

      added++
      console.log(`  ✓ Added ${cultivar.displayName}`)
    } catch (error: any) {
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        console.log(`  ⚠️  Skipped ${cultivar.id} (already exists)`)
      } else {
        console.error(`  ❌ Error adding ${cultivar.id}:`, error.message)
        errors++
      }
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`RESULTS: ${added}/${MISSING_CULTIVARS.length} cultivars added`)
  if (errors > 0) {
    console.log(`Errors: ${errors}`)
  }
  console.log('='.repeat(80))
  console.log()

  // Verify final counts
  console.log('Verifying final counts...')
  console.log()

  const varieties = [
    { id: 'pacific_salmon', name: 'Pacific Salmon' },
    { id: 'oyster_types', name: 'Oyster Species' },
    { id: 'crab_species', name: 'Crab Species' },
    { id: 'lobster_types', name: 'Lobster Types' },
    { id: 'crawfish_types', name: 'Crawfish Types' }
  ]

  for (const variety of varieties) {
    const count = await runWriteTransaction<{ count: number }>(`
      MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: $varietyId})
      RETURN count(c) as count
    `, { varietyId: variety.id })

    const status = Number(count[0].count) >= 5 ? '✅' : '⚠️'
    console.log(`${status} ${variety.name}: ${count[0].count} species`)
  }

  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
