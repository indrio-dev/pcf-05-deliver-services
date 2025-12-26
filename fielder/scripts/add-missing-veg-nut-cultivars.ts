#!/usr/bin/env tsx

/**
 * Add Missing Vegetable and Nut Cultivars
 *
 * Complete the varieties that are short of 5 cultivars
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

const MISSING_CULTIVARS: Cultivar[] = [
  // BEEFSTEAK TOMATO - Need 1 more
  {
    id: 'oxheart',
    varietyId: 'beefsteak_tomato_var',
    productId: 'tomato',
    displayName: 'Oxheart',
    description: 'Heart-shaped, large, meaty, few seeds',
    heritageIntent: 'true_heritage',
    validatedStates: ['OH', 'PA', 'NY'],
    peakMonths: [7, 8, 9],
    brixBase: 5.3,
    notes: 'European heirloom, can exceed 2 lbs, heart shape'
  },

  // ENGLISH WALNUT - Need 1 more
  {
    id: 'serr',
    varietyId: 'english_walnut',
    productId: 'walnut',
    displayName: 'Serr',
    description: 'Early harvest, lateral bearing, commercial',
    validatedStates: ['CA'],
    peakMonths: [9],
    notes: 'UC Davis, early variety, bears on lateral branches'
  },

  // NANTES CARROT (5 from scratch)
  {
    id: 'scarlet_nantes',
    varietyId: 'nantes_carrot_var',
    productId: 'carrot',
    displayName: 'Scarlet Nantes',
    description: 'Classic sweet cylindrical carrot',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'WA', 'MI', 'TX'],
    peakMonths: [6, 7, 8, 9, 10],
    brixBase: 7.0,
    notes: 'French 1850s, sweet, coreless, most popular carrot type'
  },
  {
    id: 'mokum',
    varietyId: 'nantes_carrot_var',
    productId: 'carrot',
    displayName: 'Mokum',
    description: 'Sweet mini Nantes, early harvest',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'OR', 'WA'],
    peakMonths: [5, 6, 7, 8],
    brixBase: 7.5,
    notes: 'Dutch hybrid, extra sweet, baby carrot'
  },
  {
    id: 'bolero',
    varietyId: 'nantes_carrot_var',
    productId: 'carrot',
    displayName: 'Bolero',
    description: 'Disease resistant Nantes, sweet',
    validatedStates: ['CA', 'TX', 'FL'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 7.2,
    notes: 'Modern hybrid, nematode resistant'
  },
  {
    id: 'yaya',
    varietyId: 'nantes_carrot_var',
    productId: 'carrot',
    displayName: 'Yaya',
    description: 'Extra sweet Nantes, mini',
    validatedStates: ['CA', 'OR'],
    peakMonths: [6, 7, 8],
    brixBase: 8.0,
    notes: 'Modern specialty, very sweet, small'
  },
  {
    id: 'touchon',
    varietyId: 'nantes_carrot_var',
    productId: 'carrot',
    displayName: 'Touchon',
    description: 'French Nantes, coreless, sweet',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['OR', 'WA', 'CA'],
    peakMonths: [6, 7, 8],
    brixBase: 7.3,
    notes: 'French heirloom, completely coreless'
  },

  // IMPERATOR CARROT (5 from scratch)
  {
    id: 'imperator_58',
    varietyId: 'imperator_carrot',
    productId: 'carrot',
    displayName: 'Imperator 58',
    description: 'Commercial standard, long tapered',
    validatedStates: ['CA', 'TX', 'FL', 'WA'],
    peakMonths: [6, 7, 8, 9, 10],
    brixBase: 6.5,
    notes: 'Commercial standard, most common fresh market carrot'
  },
  {
    id: 'tendersweet',
    varietyId: 'imperator_carrot',
    productId: 'carrot',
    displayName: 'Tendersweet',
    description: 'Sweet Imperator type',
    validatedStates: ['CA', 'TX'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 6.8,
    notes: 'Sweeter Imperator selection'
  },
  {
    id: 'orlando_gold',
    varietyId: 'imperator_carrot',
    productId: 'carrot',
    displayName: 'Orlando Gold',
    description: 'Heat-tolerant Imperator',
    validatedStates: ['FL', 'TX', 'CA'],
    peakMonths: [4, 5, 6, 7, 8],
    brixBase: 6.5,
    notes: 'Heat-tolerant, southern climates'
  },
  {
    id: 'apache',
    varietyId: 'imperator_carrot',
    productId: 'carrot',
    displayName: 'Apache',
    description: 'Disease resistant, commercial',
    validatedStates: ['CA', 'TX'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 6.5,
    notes: 'Modern hybrid, disease resistance'
  },
  {
    id: 'sugarsnax',
    varietyId: 'imperator_carrot',
    productId: 'carrot',
    displayName: 'Sugarsnax',
    description: 'Extra sweet, long storage',
    validatedStates: ['CA', 'WA', 'OR'],
    peakMonths: [7, 8, 9, 10],
    brixBase: 7.8,
    notes: 'Hybrid, very sweet, stores well'
  },

  // ROMAINE LETTUCE (5 from scratch)
  {
    id: 'parris_island_cos',
    varietyId: 'romaine_lettuce',
    productId: 'lettuce',
    displayName: 'Parris Island Cos',
    description: 'Classic romaine, heat-tolerant',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'AZ', 'FL'],
    peakMonths: [4, 5, 6, 9, 10, 11],
    notes: 'Heirloom, slow to bolt, southern favorite'
  },
  {
    id: 'little_gem',
    varietyId: 'romaine_lettuce',
    productId: 'lettuce',
    displayName: 'Little Gem',
    description: 'Mini romaine, sweet, crisp',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR', 'NY'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'British heritage, baby romaine, chef favorite'
  },
  {
    id: 'rouge_d_hiver',
    varietyId: 'romaine_lettuce',
    productId: 'lettuce',
    displayName: "Rouge d'Hiver",
    description: 'Red romaine, cold-hardy, French',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'OR', 'WA'],
    peakMonths: [3, 4, 5, 10, 11],
    notes: 'French heirloom, winter lettuce, burgundy leaves'
  },
  {
    id: 'jericho',
    varietyId: 'romaine_lettuce',
    productId: 'lettuce',
    displayName: 'Jericho',
    description: 'Heat-tolerant, disease resistant',
    validatedStates: ['CA', 'AZ', 'TX'],
    peakMonths: [4, 5, 6, 7, 8, 9],
    notes: 'Israeli breeding, extreme heat tolerance'
  },
  {
    id: 'green_towers',
    varietyId: 'romaine_lettuce',
    productId: 'lettuce',
    displayName: 'Green Towers',
    description: 'Tall upright romaine',
    validatedStates: ['CA', 'OR', 'WA'],
    peakMonths: [5, 6, 9, 10],
    notes: 'Very upright, excellent for Caesar'
  },

  // BUTTERHEAD LETTUCE (5 from scratch)
  {
    id: 'bibb',
    varietyId: 'butterhead_lettuce',
    productId: 'lettuce',
    displayName: 'Bibb (Limestone)',
    description: 'Classic butterhead, tender, sweet',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['KY', 'VA', 'NC'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'Kentucky limestone soil, John Bibb 1850s, gourmet standard'
  },
  {
    id: 'boston',
    varietyId: 'butterhead_lettuce',
    productId: 'lettuce',
    displayName: 'Boston (Buttercrunch)',
    description: 'Soft leaves, buttery texture',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'MA', 'NY'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'Classic butterhead, Boston market'
  },
  {
    id: 'buttercrunch',
    varietyId: 'butterhead_lettuce',
    productId: 'lettuce',
    displayName: 'Buttercrunch',
    description: 'Crisp butterhead, slow bolting',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR', 'WA', 'NY'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'Cornell breeding, compact, excellent flavor'
  },
  {
    id: 'tom_thumb',
    varietyId: 'butterhead_lettuce',
    productId: 'lettuce',
    displayName: 'Tom Thumb',
    description: 'Tiny butterhead, single-serving',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'Victorian England, mini butterhead, tennis ball size'
  },
  {
    id: 'mignonette',
    varietyId: 'butterhead_lettuce',
    productId: 'lettuce',
    displayName: 'Mignonette',
    description: 'Bronze-tinted butterhead, French',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'OR'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'French heirloom, bronze leaves, small heads'
  },

  // LOOSE LEAF LETTUCE (5 from scratch)
  {
    id: 'black_seeded_simpson',
    varietyId: 'loose_leaf',
    productId: 'lettuce',
    displayName: 'Black Seeded Simpson',
    description: 'Light green leaf, fast growing',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR', 'WA', 'MI'],
    peakMonths: [4, 5, 6, 7, 8, 9],
    notes: 'Pre-1850 heirloom, cut-and-come-again, continuous harvest'
  },
  {
    id: 'red_sails',
    varietyId: 'loose_leaf',
    productId: 'lettuce',
    displayName: 'Red Sails',
    description: 'Burgundy leaf, slow bolting',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'TX', 'AZ'],
    peakMonths: [4, 5, 6, 7, 8, 9],
    notes: 'AAS winner, heat-tolerant, beautiful color'
  },
  {
    id: 'oakleaf',
    varietyId: 'loose_leaf',
    productId: 'lettuce',
    displayName: 'Oakleaf',
    description: 'Oak-shaped leaves, tender',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR', 'NY'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'French heirloom, distinctive oak-leaf shape'
  },
  {
    id: 'lollo_rosso',
    varietyId: 'loose_leaf',
    productId: 'lettuce',
    displayName: 'Lollo Rosso',
    description: 'Frilly red Italian lettuce',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'Italian, very frilly red leaves, beautiful'
  },
  {
    id: 'salad_bowl',
    varietyId: 'loose_leaf',
    productId: 'lettuce',
    displayName: 'Salad Bowl',
    description: 'Deeply lobed green leaves',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR', 'WA'],
    peakMonths: [4, 5, 6, 9, 10],
    notes: 'Heirloom, oak-leaf type, slow bolting'
  },

  // SWEET ONION (5 from scratch)
  {
    id: 'vidalia_onion_var',
    varietyId: 'sweet_onion',
    productId: 'onion',
    displayName: 'Vidalia',
    description: 'Georgia sweet onion, low sulfur soil',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['GA'],
    peakMonths: [4, 5, 6],
    notes: 'Georgia, protected designation, low sulfur soil = sweet'
  },
  {
    id: 'walla_walla_onion_var',
    varietyId: 'sweet_onion',
    productId: 'onion',
    displayName: 'Walla Walla',
    description: 'Washington sweet onion, French heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['WA'],
    peakMonths: [6, 7],
    notes: 'French soldier brought seeds 1900, Walla Walla Valley'
  },
  {
    id: 'texas_1015',
    varietyId: 'sweet_onion',
    productId: 'onion',
    displayName: 'Texas 1015',
    description: 'Texas sweet, short-day type',
    validatedStates: ['TX'],
    peakMonths: [4, 5],
    notes: 'Texas A&M, plant Oct 15 = 1015, spring harvest'
  },
  {
    id: 'maui',
    varietyId: 'sweet_onion',
    productId: 'onion',
    displayName: 'Maui',
    description: 'Hawaiian sweet onion, very mild',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['HI'],
    peakMonths: [4, 5, 6],
    notes: 'Maui Hawaii, volcanic soil, very sweet'
  },
  {
    id: 'sweet_candy',
    varietyId: 'sweet_onion',
    productId: 'onion',
    displayName: 'Candy',
    description: 'Extra-sweet hybrid',
    validatedStates: ['GA', 'TX', 'CA'],
    peakMonths: [5, 6],
    notes: 'Modern hybrid, ultra-sweet, short storage'
  },

  // STORAGE ONION (5 from scratch)
  {
    id: 'yellow_globe',
    varietyId: 'storage_onion',
    productId: 'onion',
    displayName: 'Yellow Globe',
    description: 'Standard storage onion, pungent',
    validatedStates: ['OR', 'ID', 'CO', 'MI'],
    peakMonths: [8, 9, 10],
    notes: 'Commercial standard, stores 6+ months'
  },
  {
    id: 'red_wing',
    varietyId: 'storage_onion',
    productId: 'onion',
    displayName: 'Red Wing',
    description: 'Red storage onion, sharp flavor',
    validatedStates: ['OR', 'ID', 'CO'],
    peakMonths: [8, 9, 10],
    notes: 'Red variety, long storage, pungent'
  },
  {
    id: 'copra',
    varietyId: 'storage_onion',
    productId: 'onion',
    displayName: 'Copra',
    description: 'Excellent storage, thick skin',
    validatedStates: ['OR', 'ID', 'WA'],
    peakMonths: [8, 9, 10],
    notes: 'Stores up to 12 months, commercial variety'
  },
  {
    id: 'stuttgarter',
    varietyId: 'storage_onion',
    productId: 'onion',
    displayName: 'Stuttgarter',
    description: 'German heirloom, flat shape, pungent',
    heritageIntent: 'true_heritage',
    validatedStates: ['NY', 'OH', 'MI'],
    peakMonths: [8, 9],
    notes: 'German heirloom, flattened globe, excellent storage'
  },
  {
    id: 'red_baron',
    varietyId: 'storage_onion',
    productId: 'onion',
    displayName: 'Red Baron',
    description: 'Deep red, stores well',
    validatedStates: ['OR', 'ID', 'MI'],
    peakMonths: [8, 9, 10],
    notes: 'Hybrid, deep red color, good storage'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('ADD MISSING VEGETABLE AND NUT CULTIVARS')
  console.log('='.repeat(80))
  console.log()
  console.log(`Adding ${MISSING_CULTIVARS.length} cultivars...`)
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
      if (added % 10 === 0) {
        console.log(`  ✓ Added ${added}/${MISSING_CULTIVARS.length} cultivars...`)
      }
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

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
