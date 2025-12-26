#!/usr/bin/env tsx

/**
 * Complete Remaining Varieties to 5 Cultivars
 *
 * These are berry/fruit varieties that need expansion
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

const REMAINING_CULTIVARS: Cultivar[] = [
  // TART CHERRY (1 → 5) - Need 4 more
  {
    id: 'balaton',
    varietyId: 'tart_cherry',
    productId: 'cherry',
    displayName: 'Balaton',
    description: 'Hungarian tart, darker than Montmorency',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['MI', 'NY', 'WI'],
    peakMonths: [7],
    brixBase: 14.0,
    notes: 'Hungary, dark juice, pie cherry'
  },
  {
    id: 'meteor',
    varietyId: 'tart_cherry',
    productId: 'cherry',
    displayName: 'Meteor',
    description: 'Genetic dwarf, tart, cold-hardy',
    validatedStates: ['MI', 'MN', 'WI'],
    peakMonths: [7],
    brixBase: 13.5,
    notes: 'Naturally dwarf tree, cold-hardy'
  },
  {
    id: 'north_star',
    varietyId: 'tart_cherry',
    productId: 'cherry',
    displayName: 'North Star',
    description: 'Genetic dwarf, very tart',
    validatedStates: ['MI', 'MN', 'WI'],
    peakMonths: [7],
    brixBase: 13.0,
    notes: 'Minnesota, dwarf tree, intense tart flavor'
  },
  {
    id: 'evans',
    varietyId: 'tart_cherry',
    productId: 'cherry',
    displayName: 'Evans (Bali)',
    description: 'Very cold-hardy, productive',
    validatedStates: ['ND', 'MN', 'WI'],
    peakMonths: [7, 8],
    brixBase: 13.2,
    notes: 'Canadian, extreme cold tolerance, later harvest'
  },

  // EUROPEAN PLUM (1 → 5) - Need 4 more
  {
    id: 'italian_prune',
    varietyId: 'european_plum',
    productId: 'plum',
    displayName: 'Italian Prune',
    description: 'Freestone, oval, sweet, drying',
    heritageIntent: 'true_heritage',
    validatedStates: ['WA', 'OR', 'ID', 'CA'],
    peakMonths: [8, 9],
    brixBase: 15.0,
    notes: 'European heritage, drying plum, freestone'
  },
  {
    id: 'damson',
    varietyId: 'european_plum',
    productId: 'plum',
    displayName: 'Damson',
    description: 'Small, tart, preserves plum',
    heritageIntent: 'true_heritage',
    validatedStates: ['NY', 'PA', 'MI'],
    peakMonths: [9],
    brixBase: 12.0,
    notes: 'Ancient Europe, Damascus origin, jam/jelly plum'
  },
  {
    id: 'stanley',
    varietyId: 'european_plum',
    productId: 'plum',
    displayName: 'Stanley',
    description: 'Large prune plum, sweet',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['NY', 'MI'],
    peakMonths: [8, 9],
    brixBase: 16.0,
    notes: 'New York 1926, excellent fresh or dried'
  },
  {
    id: 'french_prune',
    varietyId: 'european_plum',
    productId: 'plum',
    displayName: 'French Prune (Agen)',
    description: 'California standard drying plum',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    peakMonths: [8, 9],
    brixBase: 16.5,
    notes: 'France Agen region, California 1856, 99% of dried prunes'
  },

  // SWEET CHERRY (2 → 5) - Need 3 more
  {
    id: 'lapins',
    varietyId: 'sweet_cherry',
    productId: 'cherry',
    displayName: 'Lapins',
    description: 'Dark red, self-fertile, firm',
    heritageIntent: 'modern_flavor',
    validatedStates: ['WA', 'OR', 'CA'],
    peakMonths: [6, 7],
    brixBase: 19.0,
    notes: 'Canada 1960s, self-fertile (rare for cherries), firm shipping'
  },
  {
    id: 'sweetheart',
    varietyId: 'sweet_cherry',
    productId: 'cherry',
    displayName: 'Sweetheart',
    description: 'Late harvest, very sweet, firm',
    heritageIntent: 'modern_flavor',
    validatedStates: ['WA', 'OR', 'CA'],
    peakMonths: [7, 8],
    brixBase: 19.5,
    notes: 'Canada, latest sweet cherry, extends season'
  },
  {
    id: 'brooks',
    varietyId: 'sweet_cherry',
    productId: 'cherry',
    displayName: 'Brooks',
    description: 'Early season, dark red, sweet',
    heritageIntent: 'modern_flavor',
    validatedStates: ['WA', 'OR', 'CA'],
    peakMonths: [6],
    brixBase: 18.5,
    notes: 'Early variety, before Bing, Washington State'
  },

  // DESSERT APPLE (2 → 5) - Need 3 more
  {
    id: 'ambrosia',
    varietyId: 'dessert_apple',
    productId: 'apple',
    displayName: 'Ambrosia',
    description: 'Very sweet, low acid, honey notes',
    heritageIntent: 'modern_flavor',
    validatedStates: ['WA', 'CA'],
    peakMonths: [10, 11],
    brixBase: 14.5,
    notes: 'BC Canada 1990s discovery, naturally very sweet'
  },
  {
    id: 'kanzi',
    varietyId: 'dessert_apple',
    productId: 'apple',
    displayName: 'Kanzi',
    description: 'Sweet-tart, crisp, European',
    heritageIntent: 'modern_flavor',
    validatedStates: ['WA', 'NY'],
    peakMonths: [10, 11],
    brixBase: 13.5,
    notes: 'Belgium, Gala × Braeburn, balanced sweet-tart'
  },
  {
    id: 'opal',
    varietyId: 'dessert_apple',
    productId: 'apple',
    displayName: 'Opal',
    description: 'Yellow, sweet, slow to brown',
    heritageIntent: 'modern_flavor',
    validatedStates: ['WA'],
    peakMonths: [10],
    brixBase: 13.8,
    notes: 'Czech, Golden Delicious × Topaz, non-browning'
  },

  // HEIRLOOM APPLE (1 → 5) - Need 4 more
  {
    id: 'ashmead_kernel',
    varietyId: 'heirloom_apple',
    productId: 'apple',
    displayName: "Ashmead's Kernel",
    description: 'English russet, complex, cider apple',
    heritageIntent: 'true_heritage',
    validatedStates: ['OR', 'WA', 'NY'],
    peakMonths: [10, 11],
    brixBase: 13.0,
    notes: 'England 1700s, russeted skin, intense flavor, cider'
  },
  {
    id: 'roxbury_russet',
    varietyId: 'heirloom_apple',
    productId: 'apple',
    displayName: 'Roxbury Russet',
    description: 'Oldest American apple, russet, storage',
    heritageIntent: 'true_heritage',
    validatedStates: ['MA', 'NY', 'VT'],
    peakMonths: [10, 11],
    brixBase: 12.5,
    notes: 'Massachusetts 1600s, oldest American variety, stores until spring'
  },
  {
    id: 'winesap',
    varietyId: 'heirloom_apple',
    productId: 'apple',
    displayName: 'Winesap',
    description: 'Dark red, tart-sweet, wine notes',
    heritageIntent: 'true_heritage',
    validatedStates: ['VA', 'NC', 'AR'],
    peakMonths: [10, 11],
    brixBase: 13.5,
    notes: 'Colonial Virginia, wine-like tang, excellent storage'
  },
  {
    id: 'spitzenburg',
    varietyId: 'heirloom_apple',
    productId: 'apple',
    displayName: 'Esopus Spitzenburg',
    description: "Thomas Jefferson's favorite, complex",
    heritageIntent: 'true_heritage',
    validatedStates: ['NY', 'VA', 'OR'],
    peakMonths: [10, 11],
    brixBase: 14.0,
    notes: 'New York 1700s, Jefferson favorite, complex spicy-sweet'
  },

  // HIGHBUSH BLUEBERRY (2 → 5) - Need 3 more
  {
    id: 'legacy',
    varietyId: 'highbush',
    productId: 'blueberry',
    displayName: 'Legacy',
    description: 'Northern highbush, aromatic, productive',
    heritageIntent: 'modern_flavor',
    validatedStates: ['MI', 'NJ', 'OR'],
    peakMonths: [7],
    notes: 'USDA, compact bush, excellent flavor'
  },
  {
    id: 'elliott',
    varietyId: 'highbush',
    productId: 'blueberry',
    displayName: 'Elliott',
    description: 'Latest northern highbush',
    validatedStates: ['MI', 'NJ', 'OR'],
    peakMonths: [8],
    notes: 'Very late season, extends harvest'
  },
  {
    id: 'jersey',
    varietyId: 'highbush',
    productId: 'blueberry',
    displayName: 'Jersey',
    description: 'Classic northern highbush, old standard',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['NJ', 'MI', 'OR'],
    peakMonths: [7],
    notes: 'New Jersey, old commercial standard, reliable'
  },

  // SOUTHERN HIGHBUSH (1 → 5) - Need 4 more
  {
    id: 'emerald',
    varietyId: 'southern_highbush',
    productId: 'blueberry',
    displayName: 'Emerald',
    description: 'Low-chill, evergreen, Florida-adapted',
    heritageIntent: 'modern_flavor',
    validatedStates: ['FL', 'GA', 'CA'],
    peakMonths: [4, 5],
    notes: 'University of Florida, very low chill hours, evergreen'
  },
  {
    id: 'jewel',
    varietyId: 'southern_highbush',
    productId: 'blueberry',
    displayName: 'Jewel',
    description: 'Low-chill, very sweet, large berries',
    heritageIntent: 'modern_flavor',
    validatedStates: ['FL', 'CA'],
    peakMonths: [4, 5],
    notes: 'University of Florida, excellent fresh eating'
  },
  {
    id: 'star',
    varietyId: 'southern_highbush',
    productId: 'blueberry',
    displayName: 'Star',
    description: 'Early southern highbush, large, aromatic',
    heritageIntent: 'modern_flavor',
    validatedStates: ['FL', 'GA', 'CA'],
    peakMonths: [4, 5],
    notes: 'University of Florida, early season'
  },
  {
    id: 'springhigh',
    varietyId: 'southern_highbush',
    productId: 'blueberry',
    displayName: 'Springhigh',
    description: 'Very early, low-chill',
    validatedStates: ['FL', 'GA'],
    peakMonths: [4, 5],
    notes: 'Early variety, low chill requirement'
  },

  // MANDARIN (3 → 5) - Need 2 more
  {
    id: 'cuties',
    varietyId: 'mandarin',
    productId: 'tangerine',
    displayName: 'Cuties (W. Murcott)',
    description: 'Seedless, very sweet, easy peel',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'FL'],
    peakMonths: [1, 2, 3, 4],
    brixBase: 13.0,
    notes: 'W. Murcott afourer, trademark name, sweet'
  },
  {
    id: 'page',
    varietyId: 'mandarin',
    productId: 'tangerine',
    displayName: 'Page',
    description: 'Minneola × Clementine, sweet, few seeds',
    heritageIntent: 'modern_flavor',
    validatedStates: ['FL', 'CA'],
    peakMonths: [1, 2, 3],
    brixBase: 12.5,
    notes: 'University of California, hybrid mandarin'
  },

  // BEEFSTEAK TOMATO (4 → 5) - Need 1 more (Oxheart already added, might be duplicate)
  {
    id: 'beef_steak_classic',
    varietyId: 'beefsteak',
    productId: 'tomato',
    displayName: 'Classic Beefsteak',
    description: 'Large red slicing tomato, commercial',
    validatedStates: ['CA', 'FL', 'TX', 'NJ'],
    peakMonths: [7, 8, 9],
    brixBase: 4.8,
    notes: 'Generic beefsteak type, commercial standard'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('COMPLETE REMAINING VARIETIES TO 5 CULTIVARS')
  console.log('='.repeat(80))
  console.log()
  console.log(`Adding ${REMAINING_CULTIVARS.length} cultivars...`)
  console.log()

  let added = 0
  let errors = 0

  for (const cultivar of REMAINING_CULTIVARS) {
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

        // Add optional fields
        SET c.heritageIntent = $heritageIntent,
            c.validatedStates = $validatedStates,
            c.peakMonths = $peakMonths,
            c.brixBase = $brixBase,
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
      } else {
        console.error(`  ❌ Error adding ${cultivar.id}:`, error.message)
        errors++
      }
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`RESULTS: ${added}/${REMAINING_CULTIVARS.length} cultivars added`)
  if (errors > 0) {
    console.log(`Errors: ${errors}`)
  }
  console.log('='.repeat(80))
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
