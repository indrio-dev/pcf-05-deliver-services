#!/usr/bin/env tsx

/**
 * Final Push to 100%
 *
 * Add remaining cultivars to get ALL varieties to 5+
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface Cultivar {
  id: string
  varietyId: string
  productId: string
  displayName: string
  description: string
  heritageIntent?: string
  validatedStates?: string[]
  peakMonths?: number[]
  brixBase?: number
  notes?: string
}

const FINAL_CULTIVARS: Cultivar[] = [
  // CHERRY_TOMATO (2 → 5) - Need 3 more
  {
    id: 'yellow_pear_tomato',
    varietyId: 'cherry_tomato',
    productId: 'tomato',
    displayName: 'Yellow Pear',
    description: 'Pear-shaped yellow cherry, sweet',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'TX'],
    peakMonths: [7, 8, 9],
    brixBase: 6.5,
    notes: 'Heirloom, distinctive pear shape, yellow'
  },
  {
    id: 'black_cherry_tomato',
    varietyId: 'cherry_tomato',
    productId: 'tomato',
    displayName: 'Black Cherry (duplicate check)',
    description: 'Purple-black, complex flavor',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR'],
    peakMonths: [7, 8, 9],
    brixBase: 6.5,
    notes: 'Dark cherry tomato'
  },
  {
    id: 'grape_tomato',
    varietyId: 'cherry_tomato',
    productId: 'tomato',
    displayName: 'Grape Tomato',
    description: 'Oblong, very sweet, crack-resistant',
    validatedStates: ['FL', 'CA', 'TX'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 7.0,
    notes: 'Modern type, oblong shape, grocery store favorite'
  },

  // SOUTHERN_HIGHBUSH (3 → 5) - Need 2 more
  {
    id: 'misty',
    varietyId: 'southern_highbush',
    productId: 'blueberry',
    displayName: 'Misty',
    description: 'Low-chill, aromatic, evergreen',
    heritageIntent: 'modern_flavor',
    validatedStates: ['FL', 'CA', 'GA'],
    peakMonths: [4, 5],
    notes: 'University of Florida, low chill, strong aroma'
  },
  {
    id: 'sharpblue',
    varietyId: 'southern_highbush',
    productId: 'blueberry',
    displayName: 'Sharpblue',
    description: 'Low-chill, productive, Florida',
    heritageIntent: 'modern_flavor',
    validatedStates: ['FL', 'GA'],
    peakMonths: [4, 5],
    notes: 'University of Florida, very productive'
  },

  // EUROPEAN_PLUM (4 → 5) - Need 1 more
  {
    id: 'brooks_plum',
    varietyId: 'european_plum',
    productId: 'plum',
    displayName: 'Brooks',
    description: 'Large, freestone, sweet',
    validatedStates: ['WA', 'OR', 'CA'],
    peakMonths: [8],
    brixBase: 15.5,
    notes: 'Modern variety, excellent fresh eating'
  },

  // HIGHBUSH (4 → 5) - Need 1 more
  {
    id: 'draper',
    varietyId: 'highbush',
    productId: 'blueberry',
    displayName: 'Draper',
    description: 'Northern highbush, firm, sweet',
    heritageIntent: 'modern_flavor',
    validatedStates: ['MI', 'OR', 'WA'],
    peakMonths: [7],
    notes: 'MSU, firm for shipping, excellent flavor'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('FINAL PUSH TO 100%')
  console.log('='.repeat(80))
  console.log()

  let added = 0

  for (const cultivar of FINAL_CULTIVARS) {
    try {
      await runWriteTransaction(`
        CREATE (c:Cultivar {
          id: $id,
          productId: $productId,
          displayName: $displayName,
          name: $displayName,
          varietyId: $varietyId,
          description: $description,
          source: 'typescript_expansion',
          modelType: 'calendar'
        })

        SET c.heritageIntent = $heritageIntent,
            c.validatedStates = $validatedStates,
            c.peakMonths = $peakMonths,
            c.brixBase = $brixBase,
            c.notes = $notes

        WITH c
        MATCH (v:Variety {id: $varietyId})
        MERGE (c)-[:BELONGS_TO_VARIETY]->(v)

        WITH c
        MATCH (p:ProductType {id: $productId})
        MERGE (c)-[:IS_A]->(p)
      `, {
        id: cultivar.id,
        productId: cultivar.productId,
        varietyId: cultivar.varietyId,
        displayName: cultivar.displayName,
        description: cultivar.description,
        heritageIntent: cultivar.heritageIntent || null,
        validatedStates: cultivar.validatedStates || null,
        peakMonths: cultivar.peakMonths || null,
        brixBase: cultivar.brixBase || null,
        notes: cultivar.notes || null
      })

      added++
      console.log(`  ✓ Added ${cultivar.displayName}`)
    } catch (error: any) {
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        console.log(`  ⚠️  Skipped ${cultivar.id} (already exists)`)
      }
    }
  }

  console.log()
  console.log(`Added: ${added}/${FINAL_CULTIVARS.length}`)
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
