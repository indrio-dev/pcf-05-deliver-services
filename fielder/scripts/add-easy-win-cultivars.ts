#!/usr/bin/env tsx

/**
 * Add Easy Win Cultivars
 *
 * Navel Orange: 4 → 5 (add Powell)
 * Ruby Grapefruit: 4 → 5 (add Star Ruby)
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface NewCultivar {
  id: string
  varietyId: string
  productId: string
  displayName: string
  flavorProfile: string
  peakMonths: number[]
  validatedStates: string[]
  heritageIntent?: string
  isNonGmo: boolean
  brixBase?: number
  notes?: string
}

const NEW_CULTIVARS: NewCultivar[] = [
  // NAVEL ORANGE #5
  {
    id: 'powell_navel',
    varietyId: 'navel',
    productId: 'orange',
    displayName: 'Powell Navel',
    flavorProfile: 'Sweet, seedless, heavy juice content',
    peakMonths: [11, 12, 1, 2], // Nov-Feb
    validatedStates: ['CA', 'AZ'],
    isNonGmo: true,
    brixBase: 11.8,
    notes: 'Australian origin, popular in California, extended harvest window'
  },

  // RUBY GRAPEFRUIT #5
  {
    id: 'star_ruby',
    varietyId: 'ruby_grapefruit',
    productId: 'grapefruit',
    displayName: 'Star Ruby',
    flavorProfile: 'Deep red flesh, sweet-tart, less bitter than Marsh',
    peakMonths: [11, 12, 1, 2, 3, 4], // Nov-Apr
    validatedStates: ['TX', 'FL', 'CA'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 10.5,
    notes: '1970 Texas A&M release, original red grapefruit mutation, needs heat for color'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('ADD EASY WIN CULTIVARS')
  console.log('='.repeat(80))
  console.log()

  let added = 0

  for (const cultivar of NEW_CULTIVARS) {
    console.log(`Adding ${cultivar.displayName} (${cultivar.id}) → ${cultivar.varietyId}`)

    try {
      await runWriteTransaction(`
        // Create Cultivar node
        CREATE (c:Cultivar {
          id: $id,
          productId: $productId,
          displayName: $displayName,
          name: $displayName,
          varietyId: $varietyId,
          flavorProfile: $flavorProfile,
          peakMonths: $peakMonths,
          validatedStates: $validatedStates,
          isNonGmo: $isNonGmo,
          source: 'typescript_expansion',
          modelType: 'calendar'
        })

        // Add optional fields
        SET c.brixBase = $brixBase,
            c.heritageIntent = $heritageIntent,
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
        flavorProfile: cultivar.flavorProfile,
        peakMonths: cultivar.peakMonths,
        validatedStates: cultivar.validatedStates,
        isNonGmo: cultivar.isNonGmo,
        brixBase: cultivar.brixBase || null,
        heritageIntent: cultivar.heritageIntent || null,
        notes: cultivar.notes || null
      })

      added++
      console.log(`  ✅ Added successfully!`)
      console.log()
    } catch (error) {
      console.error(`  ❌ Error:`, error)
      console.log()
    }
  }

  console.log('='.repeat(80))
  console.log(`RESULTS: ${added}/${NEW_CULTIVARS.length} cultivars added`)
  console.log('='.repeat(80))
  console.log()

  // Verify counts
  console.log('Verifying variety counts...')
  console.log()

  const navelCount = await runWriteTransaction<{ count: number }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: 'navel'})
    RETURN count(c) as count
  `)

  const rubyCount = await runWriteTransaction<{ count: number }>(`
    MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: 'ruby_grapefruit'})
    RETURN count(c) as count
  `)

  console.log(`Navel Orange: ${navelCount[0].count} cultivars ${navelCount[0].count >= 5 ? '✅' : '⚠️'}`)
  console.log(`Ruby Grapefruit: ${rubyCount[0].count} cultivars ${rubyCount[0].count >= 5 ? '✅' : '⚠️'}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
