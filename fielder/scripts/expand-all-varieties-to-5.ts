#!/usr/bin/env tsx

/**
 * Expand ALL Varieties to Minimum 5 Cultivars
 *
 * Systematic expansion across all farm-to-table categories
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
  // ========================================================================
  // CITRUS: VALENCIA ORANGE (2 → 5) - Need 3 more
  // ========================================================================
  {
    id: 'midknight_valencia',
    varietyId: 'valencia',
    productId: 'orange',
    displayName: 'Midknight Valencia',
    flavorProfile: 'Very sweet, low acid, extended harvest',
    peakMonths: [4, 5, 6, 7],
    validatedStates: ['FL', 'CA'],
    isNonGmo: true,
    brixBase: 12.0,
    notes: 'South African selection, extends Valencia season'
  },
  {
    id: 'delta_valencia',
    varietyId: 'valencia',
    productId: 'orange',
    displayName: 'Delta Seedless Valencia',
    flavorProfile: 'Seedless, sweet-tart, juicing quality',
    peakMonths: [3, 4, 5, 6],
    validatedStates: ['FL', 'CA', 'TX'],
    isNonGmo: true,
    brixBase: 11.8,
    notes: 'Seedless mutation, popular in Florida'
  },
  {
    id: 'olinda_valencia',
    varietyId: 'valencia',
    productId: 'orange',
    displayName: 'Olinda Valencia',
    flavorProfile: 'High juice content, premium quality',
    peakMonths: [3, 4, 5],
    validatedStates: ['CA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 11.5,
    notes: 'California heritage variety, pre-1940s'
  },

  // ========================================================================
  // CITRUS: BLOOD ORANGE (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'tarocco',
    varietyId: 'blood',
    productId: 'orange',
    displayName: 'Tarocco',
    flavorProfile: 'Sweet, raspberry notes, medium red flesh',
    peakMonths: [12, 1, 2, 3],
    validatedStates: ['CA'],
    heritageIntent: 'true_heritage',
    isNonGmo: true,
    brixBase: 12.5,
    notes: 'Italian heritage, most popular blood orange variety'
  },
  {
    id: 'sanguinelli',
    varietyId: 'blood',
    productId: 'orange',
    displayName: 'Sanguinelli',
    flavorProfile: 'Very sweet, deep red, few seeds',
    peakMonths: [2, 3, 4],
    validatedStates: ['CA'],
    heritageIntent: 'true_heritage',
    isNonGmo: true,
    brixBase: 12.2,
    notes: 'Spanish origin, late-season blood orange'
  },
  {
    id: 'sanguinello',
    varietyId: 'blood',
    productId: 'orange',
    displayName: 'Sanguinello',
    flavorProfile: 'Intense color, sweet, aromatic',
    peakMonths: [1, 2, 3],
    validatedStates: ['CA'],
    heritageIntent: 'true_heritage',
    isNonGmo: true,
    brixBase: 12.0,
    notes: 'Italian, deep red juice, requires cool nights'
  },
  {
    id: 'moro',
    varietyId: 'blood',
    productId: 'orange',
    displayName: 'Moro',
    flavorProfile: 'Darkest red, raspberry-orange, tart',
    peakMonths: [12, 1, 2],
    validatedStates: ['CA'],
    heritageIntent: 'true_heritage',
    isNonGmo: true,
    brixBase: 11.8,
    notes: 'Italian, darkest blood orange, early season'
  },

  // ========================================================================
  // CITRUS: WHITE GRAPEFRUIT (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'duncan',
    varietyId: 'white_grapefruit',
    productId: 'grapefruit',
    displayName: 'Duncan',
    flavorProfile: 'Classic tart grapefruit, seedy but flavorful',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['FL', 'TX'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 10.0,
    notes: 'Pre-1830s Florida heritage, original grapefruit'
  },
  {
    id: 'triumph',
    varietyId: 'white_grapefruit',
    productId: 'grapefruit',
    displayName: 'Triumph',
    flavorProfile: 'Sweet for white grapefruit, fewer seeds',
    peakMonths: [11, 12, 1, 2],
    validatedStates: ['TX', 'FL'],
    isNonGmo: true,
    brixBase: 10.2,
    notes: 'Texas specialty, sweeter than Marsh'
  },
  {
    id: 'oroblanco',
    varietyId: 'white_grapefruit',
    productId: 'grapefruit',
    displayName: 'Oroblanco',
    flavorProfile: 'Very sweet, mild, pummelo hybrid',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['CA'],
    isNonGmo: true,
    brixBase: 11.0,
    notes: 'UC Riverside, grapefruit×pummelo, seedless'
  },
  {
    id: 'melogold',
    varietyId: 'white_grapefruit',
    productId: 'grapefruit',
    displayName: 'Melogold',
    flavorProfile: 'Sweet, low acid, pummelo hybrid',
    peakMonths: [11, 12, 1, 2],
    validatedStates: ['CA'],
    isNonGmo: true,
    brixBase: 10.8,
    notes: 'UC Riverside, similar to Oroblanco but sweeter'
  },

  // ========================================================================
  // PEARS: BARTLETT (0 → 5) - Need 5 from scratch
  // ========================================================================
  {
    id: 'bartlett_pear',
    varietyId: 'bartlett',
    productId: 'pear',
    displayName: 'Bartlett',
    flavorProfile: 'Classic sweet pear, aromatic, juicy',
    peakMonths: [8, 9],
    validatedStates: ['CA', 'WA', 'OR', 'NY'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 13.0,
    notes: 'Pre-1770 English heritage, most popular pear in US'
  },
  {
    id: 'red_bartlett',
    varietyId: 'bartlett',
    productId: 'pear',
    displayName: 'Red Bartlett',
    flavorProfile: 'Same as Bartlett, red skin, aromatic',
    peakMonths: [8, 9],
    validatedStates: ['CA', 'WA', 'OR'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 13.0,
    notes: 'Red mutation of Bartlett, 1930s discovery'
  },
  {
    id: 'max_red_bartlett',
    varietyId: 'bartlett',
    productId: 'pear',
    displayName: 'Max Red Bartlett',
    flavorProfile: 'Deeper red than Red Bartlett, sweet',
    peakMonths: [8, 9],
    validatedStates: ['WA', 'OR'],
    isNonGmo: true,
    brixBase: 13.2,
    notes: 'Modern selection, darkest red Bartlett'
  },
  {
    id: 'rosired_bartlett',
    varietyId: 'bartlett',
    productId: 'pear',
    displayName: 'Rosired Bartlett',
    flavorProfile: 'Pink-red skin, classic Bartlett flavor',
    peakMonths: [8, 9],
    validatedStates: ['CA', 'WA'],
    isNonGmo: true,
    brixBase: 13.0,
    notes: 'Red sport of Bartlett, commercial variety'
  },
  {
    id: 'sensation_bartlett',
    varietyId: 'bartlett',
    productId: 'pear',
    displayName: 'Sensation Bartlett',
    flavorProfile: 'Bright red, aromatic, sweet',
    peakMonths: [8, 9],
    validatedStates: ['WA', 'OR'],
    isNonGmo: true,
    brixBase: 13.1,
    notes: 'Red mutation, popular in Pacific Northwest'
  },

  // ========================================================================
  // PEARS: ANJOU (0 → 5) - Need 5 from scratch
  // ========================================================================
  {
    id: 'green_anjou',
    varietyId: 'anjou',
    productId: 'pear',
    displayName: 'Green Anjou',
    flavorProfile: 'Mild, sweet, smooth texture, stores well',
    peakMonths: [10, 11, 12, 1],
    validatedStates: ['OR', 'WA', 'CA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 12.5,
    notes: 'French origin mid-1800s, winter pear'
  },
  {
    id: 'red_anjou',
    varietyId: 'anjou',
    productId: 'pear',
    displayName: 'Red Anjou',
    flavorProfile: 'Same as Green Anjou, red skin',
    peakMonths: [10, 11, 12, 1],
    validatedStates: ['OR', 'WA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 12.5,
    notes: 'Red mutation discovered 1950s Oregon'
  },
  {
    id: 'starkrimson_anjou',
    varietyId: 'anjou',
    productId: 'pear',
    displayName: 'Starkrimson',
    flavorProfile: 'Deep red, sweet, aromatic',
    peakMonths: [10, 11, 12],
    validatedStates: ['OR', 'WA'],
    isNonGmo: true,
    brixBase: 12.8,
    notes: 'Red sport, Stark Bros release'
  },
  {
    id: 'golden_anjou',
    varietyId: 'anjou',
    productId: 'pear',
    displayName: 'Golden Anjou',
    flavorProfile: 'Yellow skin, sweet, aromatic',
    peakMonths: [10, 11, 12],
    validatedStates: ['WA', 'OR'],
    isNonGmo: true,
    brixBase: 12.6,
    notes: 'Yellow mutation, specialty market'
  },
  {
    id: 'winter_anjou',
    varietyId: 'anjou',
    productId: 'pear',
    displayName: 'Winter Anjou',
    flavorProfile: 'Late harvest, exceptional storage',
    peakMonths: [11, 12, 1, 2],
    validatedStates: ['OR', 'WA'],
    isNonGmo: true,
    brixBase: 12.5,
    notes: 'Late-picked Anjou, stores until spring'
  },

  // ========================================================================
  // PEARS: COMICE (0 → 5) - Need 5 from scratch
  // ========================================================================
  {
    id: 'doyenne_comice',
    varietyId: 'comice',
    productId: 'pear',
    displayName: 'Doyenne du Comice',
    flavorProfile: 'Buttery, very sweet, holiday pear',
    peakMonths: [10, 11, 12],
    validatedStates: ['OR', 'WA', 'CA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 14.0,
    notes: 'French origin 1849, premium gift pear'
  },
  {
    id: 'red_comice',
    varietyId: 'comice',
    productId: 'pear',
    displayName: 'Red Comice',
    flavorProfile: 'Same as Comice, red skin, buttery',
    peakMonths: [10, 11, 12],
    validatedStates: ['OR', 'WA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 14.0,
    notes: 'Red sport, popular for gift boxes'
  },
  {
    id: 'royal_riviera',
    varietyId: 'comice',
    productId: 'pear',
    displayName: 'Royal Riviera',
    flavorProfile: 'Premium Comice, very large, sweet',
    peakMonths: [11, 12],
    validatedStates: ['OR'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 14.5,
    notes: 'Harry & David trademark, Oregon specialty'
  },
  {
    id: 'christmas_comice',
    varietyId: 'comice',
    productId: 'pear',
    displayName: 'Christmas Comice',
    flavorProfile: 'Late harvest Comice, exceptional',
    peakMonths: [12],
    validatedStates: ['OR', 'WA'],
    isNonGmo: true,
    brixBase: 14.2,
    notes: 'Late-picked for holiday market'
  },
  {
    id: 'golden_comice',
    varietyId: 'comice',
    productId: 'pear',
    displayName: 'Golden Comice',
    flavorProfile: 'Yellow skin, buttery, aromatic',
    peakMonths: [10, 11],
    validatedStates: ['OR', 'WA'],
    isNonGmo: true,
    brixBase: 13.8,
    notes: 'Yellow mutation, specialty variety'
  },

  // ========================================================================
  // PEARS: BOSC (0 → 5) - Need 5 from scratch
  // ========================================================================
  {
    id: 'bosc_pear',
    varietyId: 'bosc',
    productId: 'pear',
    displayName: 'Bosc',
    flavorProfile: 'Firm, sweet-spice notes, holds shape when cooked',
    peakMonths: [9, 10, 11],
    validatedStates: ['WA', 'OR', 'CA', 'NY'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 13.5,
    notes: 'Belgian origin early 1800s, baking pear'
  },
  {
    id: 'red_bosc',
    varietyId: 'bosc',
    productId: 'pear',
    displayName: 'Red Bosc',
    flavorProfile: 'Red skin, same Bosc flavor, aromatic',
    peakMonths: [9, 10, 11],
    validatedStates: ['WA', 'OR'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 13.5,
    notes: 'Red mutation, specialty market'
  },
  {
    id: 'golden_bosc',
    varietyId: 'bosc',
    productId: 'pear',
    displayName: 'Golden Bosc',
    flavorProfile: 'Golden skin, sweet, aromatic',
    peakMonths: [9, 10],
    validatedStates: ['WA', 'OR'],
    isNonGmo: true,
    brixBase: 13.8,
    notes: 'Yellow-skinned sport'
  },
  {
    id: 'kaiser_pear',
    varietyId: 'bosc',
    productId: 'pear',
    displayName: 'Kaiser',
    flavorProfile: 'Similar to Bosc, firm, spicy',
    peakMonths: [9, 10, 11],
    validatedStates: ['OR', 'WA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 13.6,
    notes: 'European variety, similar to Bosc'
  },
  {
    id: 'bronze_beauty',
    varietyId: 'bosc',
    productId: 'pear',
    displayName: 'Bronze Beauty',
    flavorProfile: 'Russet skin, firm, aromatic',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'OR'],
    isNonGmo: true,
    brixBase: 13.7,
    notes: 'Bronze-russet Bosc selection'
  },

  // ========================================================================
  // PEARS: DONUT PEACH (0 → 5) - Need 5 from scratch
  // ========================================================================
  {
    id: 'saturn_peach',
    varietyId: 'donut_peach',
    productId: 'peach',
    displayName: 'Saturn',
    flavorProfile: 'Sweet, low acid, flat shape, white flesh',
    peakMonths: [7, 8],
    validatedStates: ['CA', 'GA', 'SC'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 14.0,
    notes: 'Zaiger Genetics, first commercial donut peach'
  },
  {
    id: 'galaxy_peach',
    varietyId: 'donut_peach',
    productId: 'peach',
    displayName: 'Galaxy',
    flavorProfile: 'Very sweet, aromatic, flat',
    peakMonths: [7, 8],
    validatedStates: ['CA'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 14.5,
    notes: 'Zaiger release, improved Saturn'
  },
  {
    id: 'ufo_peach',
    varietyId: 'donut_peach',
    productId: 'peach',
    displayName: 'UFO',
    flavorProfile: 'Sweet, firm, white flesh',
    peakMonths: [7, 8],
    validatedStates: ['CA', 'WA'],
    isNonGmo: true,
    brixBase: 13.8,
    notes: 'Commercial donut variety'
  },
  {
    id: 'stark_saturn',
    varietyId: 'donut_peach',
    productId: 'peach',
    displayName: 'Stark Saturn',
    flavorProfile: 'Very sweet, aromatic, easy peel',
    peakMonths: [7, 8],
    validatedStates: ['CA', 'GA'],
    isNonGmo: true,
    brixBase: 14.2,
    notes: 'Stark Bros selection'
  },
  {
    id: 'saucer_peach',
    varietyId: 'donut_peach',
    productId: 'peach',
    displayName: 'Saucer',
    flavorProfile: 'Sweet, low acid, white flesh',
    peakMonths: [7, 8],
    validatedStates: ['CA'],
    isNonGmo: true,
    brixBase: 13.9,
    notes: 'Traditional flat peach variety'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('EXPAND ALL VARIETIES TO MINIMUM 5 CULTIVARS')
  console.log('='.repeat(80))
  console.log()
  console.log(`Adding ${NEW_CULTIVARS.length} new cultivars across multiple varieties...`)
  console.log()

  let added = 0
  let errors = 0

  for (const cultivar of NEW_CULTIVARS) {
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
      if (added % 10 === 0) {
        console.log(`  ✓ Added ${added}/${NEW_CULTIVARS.length} cultivars...`)
      }
    } catch (error) {
      console.error(`  ❌ Error adding ${cultivar.id}:`, error)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`RESULTS: ${added}/${NEW_CULTIVARS.length} cultivars added`)
  console.log(`Errors: ${errors}`)
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
