#!/usr/bin/env tsx

/**
 * Expand Apples, Lemons, and Peaches to 5 Cultivars Each
 *
 * Part 2 of systematic variety expansion
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
  // LEMONS: EUREKA (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'lisbon_lemon',
    varietyId: 'eureka_lemon',
    productId: 'lemon',
    displayName: 'Lisbon',
    flavorProfile: 'Classic tart lemon, similar to Eureka',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['CA', 'AZ'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 7.5,
    notes: 'Portuguese origin, more cold-hardy than Eureka'
  },
  {
    id: 'ponderosa_lemon',
    varietyId: 'eureka_lemon',
    productId: 'lemon',
    displayName: 'Ponderosa',
    flavorProfile: 'Very large, very acidic, thick skin',
    peakMonths: [11, 12, 1, 2],
    validatedStates: ['CA', 'FL', 'TX'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 7.0,
    notes: 'Lemon-citron hybrid, ornamental and culinary'
  },
  {
    id: 'variegated_pink_lemon',
    varietyId: 'eureka_lemon',
    productId: 'lemon',
    displayName: 'Variegated Pink',
    flavorProfile: 'Pink flesh, less acidic, sweet-tart',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['CA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 8.0,
    notes: 'Eureka sport, pink flesh and variegated skin'
  },
  {
    id: 'avalon_lemon',
    varietyId: 'eureka_lemon',
    productId: 'lemon',
    displayName: 'Avalon',
    flavorProfile: 'Premium Eureka, consistent quality',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['CA'],
    isNonGmo: true,
    brixBase: 7.8,
    notes: 'Modern Eureka selection, commercial variety'
  },

  // ========================================================================
  // LEMONS: MEYER (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'improved_meyer',
    varietyId: 'meyer_lemon',
    productId: 'lemon',
    displayName: 'Improved Meyer',
    flavorProfile: 'Sweeter than regular Meyer, virus-free',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['CA', 'TX', 'FL'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 8.5,
    notes: 'USDA release 1975, virus-free Meyer'
  },
  {
    id: 'pink_meyer',
    varietyId: 'meyer_lemon',
    productId: 'lemon',
    displayName: 'Pink Meyer',
    flavorProfile: 'Pink flesh, sweeter, less acidic',
    peakMonths: [11, 12, 1, 2],
    validatedStates: ['CA'],
    isNonGmo: true,
    brixBase: 8.8,
    notes: 'Pink-fleshed Meyer sport'
  },
  {
    id: 'sweet_meyer',
    varietyId: 'meyer_lemon',
    productId: 'lemon',
    displayName: 'Sweet Meyer',
    flavorProfile: 'Very sweet, low acid, floral',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['CA', 'TX'],
    isNonGmo: true,
    brixBase: 9.0,
    notes: 'Extra-sweet Meyer selection'
  },
  {
    id: 'dwarf_meyer',
    varietyId: 'meyer_lemon',
    productId: 'lemon',
    displayName: 'Dwarf Meyer',
    flavorProfile: 'Same as Meyer, compact tree',
    peakMonths: [11, 12, 1, 2, 3],
    validatedStates: ['CA', 'TX', 'FL'],
    isNonGmo: true,
    brixBase: 8.5,
    notes: 'Compact tree, same fruit as standard Meyer'
  },

  // ========================================================================
  // APPLES: HONEYCRISP (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'sweetango',
    varietyId: 'honeycrisp',
    productId: 'apple',
    displayName: 'SweeTango',
    flavorProfile: 'Honeycrisp offspring, sweet-tart, very crisp',
    peakMonths: [9],
    validatedStates: ['MN', 'WA', 'NY', 'MI'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 14.5,
    notes: 'Honeycrisp × Zestar, University of Minnesota'
  },
  {
    id: 'honeygold',
    varietyId: 'honeycrisp',
    productId: 'apple',
    displayName: 'Honeygold',
    flavorProfile: 'Sweet, crisp, Golden Delicious relative',
    peakMonths: [9, 10],
    validatedStates: ['MN', 'WI', 'MI'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.8,
    notes: 'Golden Delicious × Haralson, Minnesota'
  },
  {
    id: 'snowsweet',
    varietyId: 'honeycrisp',
    productId: 'apple',
    displayName: 'SnowSweet',
    flavorProfile: 'Very sweet, slow to brown, crisp',
    peakMonths: [9, 10],
    validatedStates: ['MN', 'WI', 'MI', 'NY'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 14.0,
    notes: 'Sharon × Connell Red, University of Minnesota'
  },
  {
    id: 'zestar',
    varietyId: 'honeycrisp',
    productId: 'apple',
    displayName: 'Zestar',
    flavorProfile: 'Crisp, sweet-tart, early season',
    peakMonths: [8, 9],
    validatedStates: ['MN', 'WI', 'MI'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.5,
    notes: 'University of Minnesota, SweeTango parent'
  },

  // ========================================================================
  // APPLES: COSMIC CRISP (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'enterprise',
    varietyId: 'cosmic_crisp',
    productId: 'apple',
    displayName: 'Enterprise',
    flavorProfile: 'Sweet-tart, crisp, disease resistant',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'OR', 'VA'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.0,
    notes: 'Purdue-Rutgers-Illinois cooperative breeding'
  },
  {
    id: 'pixie_crunch',
    varietyId: 'cosmic_crisp',
    productId: 'apple',
    displayName: 'Pixie Crunch',
    flavorProfile: 'Very crisp, sweet, small-medium size',
    peakMonths: [9, 10],
    validatedStates: ['WA', 'OR'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.8,
    notes: 'Honeycrisp offspring, Washington State'
  },
  {
    id: 'envy',
    varietyId: 'cosmic_crisp',
    productId: 'apple',
    displayName: 'Envy',
    flavorProfile: 'Sweet, dense, slow to brown',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'NY'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 14.2,
    notes: 'New Zealand, Braeburn × Royal Gala'
  },
  {
    id: 'jazz',
    varietyId: 'cosmic_crisp',
    productId: 'apple',
    displayName: 'Jazz',
    flavorProfile: 'Crisp, sweet-tart, aromatic',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'NY'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.5,
    notes: 'New Zealand, Braeburn × Royal Gala'
  },

  // ========================================================================
  // APPLES: FUJI (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'beni_shogun',
    varietyId: 'fuji',
    productId: 'apple',
    displayName: 'Beni Shogun',
    flavorProfile: 'Red Fuji sport, very sweet, dense',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'CA'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 15.0,
    notes: 'Red-skinned Fuji mutation, Japan'
  },
  {
    id: 'nagafu',
    varietyId: 'fuji',
    productId: 'apple',
    displayName: 'Nagafu',
    flavorProfile: 'Classic Fuji, very sweet, stores well',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'CA'],
    isNonGmo: true,
    brixBase: 14.8,
    notes: 'Japanese Fuji strain, commercial variety'
  },
  {
    id: 'raku_raku',
    varietyId: 'fuji',
    productId: 'apple',
    displayName: 'Raku Raku',
    flavorProfile: 'Extra-sweet Fuji, dense, crisp',
    peakMonths: [10, 11],
    validatedStates: ['WA'],
    isNonGmo: true,
    brixBase: 15.2,
    notes: 'Japanese premium Fuji selection'
  },
  {
    id: 'aztec',
    varietyId: 'fuji',
    productId: 'apple',
    displayName: 'Aztec',
    flavorProfile: 'Red Fuji, sweet, late harvest',
    peakMonths: [11, 12],
    validatedStates: ['WA', 'CA'],
    isNonGmo: true,
    brixBase: 14.5,
    notes: 'Red-skinned Fuji sport'
  },

  // ========================================================================
  // APPLES: GALA (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'royal_gala',
    varietyId: 'gala',
    productId: 'apple',
    displayName: 'Royal Gala',
    flavorProfile: 'Deeper red than Gala, same sweet flavor',
    peakMonths: [8, 9],
    validatedStates: ['WA', 'NY', 'MI', 'NC'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.0,
    notes: 'Red mutation of Gala, most popular strain'
  },
  {
    id: 'imperial_gala',
    varietyId: 'gala',
    productId: 'apple',
    displayName: 'Imperial Gala',
    flavorProfile: 'Darker red, sweet, crisp',
    peakMonths: [8, 9],
    validatedStates: ['WA', 'NY'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.2,
    notes: 'Premium red Gala strain'
  },
  {
    id: 'annaglo',
    varietyId: 'gala',
    productId: 'apple',
    displayName: 'Annaglo',
    flavorProfile: 'Solid red color, sweet, aromatic',
    peakMonths: [8, 9],
    validatedStates: ['WA', 'MI'],
    isNonGmo: true,
    brixBase: 13.0,
    notes: 'Gala sport, solid red coloration'
  },
  {
    id: 'tenroy',
    varietyId: 'gala',
    productId: 'apple',
    displayName: 'Tenroy',
    flavorProfile: 'Bright red, sweet, early season',
    peakMonths: [8, 9],
    validatedStates: ['WA', 'NY'],
    isNonGmo: true,
    brixBase: 12.8,
    notes: 'Royal Gala sport, early coloring'
  },

  // ========================================================================
  // APPLES: PINK LADY (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'cripps_pink',
    varietyId: 'pink_lady',
    productId: 'apple',
    displayName: 'Cripps Pink',
    flavorProfile: 'Sweet-tart, effervescent, late harvest',
    peakMonths: [10, 11, 12],
    validatedStates: ['WA', 'CA'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.5,
    notes: 'Australian, Pink Lady trademark name'
  },
  {
    id: 'lady_in_red',
    varietyId: 'pink_lady',
    productId: 'apple',
    displayName: 'Lady in Red',
    flavorProfile: 'Deeper red, sweet-tart, crisp',
    peakMonths: [10, 11, 12],
    validatedStates: ['WA'],
    isNonGmo: true,
    brixBase: 13.8,
    notes: 'Red sport of Cripps Pink'
  },
  {
    id: 'rosy_glow',
    varietyId: 'pink_lady',
    productId: 'apple',
    displayName: 'Rosy Glow',
    flavorProfile: 'Pink-red, sweet, aromatic',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'CA'],
    isNonGmo: true,
    brixBase: 13.6,
    notes: 'Cripps Pink sport, intense color'
  },
  {
    id: 'pink_blush',
    varietyId: 'pink_lady',
    productId: 'apple',
    displayName: 'Pink Blush',
    flavorProfile: 'Sweet-tart balance, late season',
    peakMonths: [11, 12],
    validatedStates: ['CA'],
    isNonGmo: true,
    brixBase: 13.4,
    notes: 'Cripps Pink selection'
  },

  // ========================================================================
  // APPLES: GRANNY SMITH (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'granny',
    varietyId: 'granny_smith',
    productId: 'apple',
    displayName: 'Granny',
    flavorProfile: 'Very tart, firm, green, baking apple',
    peakMonths: [10, 11],
    validatedStates: ['WA', 'CA', 'NY'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 11.0,
    notes: 'Australian heritage 1868, Maria Ann Smith'
  },
  {
    id: 'smith_cling',
    varietyId: 'granny_smith',
    productId: 'apple',
    displayName: 'Smith Cling',
    flavorProfile: 'Similar to Granny, firm, tart',
    peakMonths: [10, 11],
    validatedStates: ['CA', 'WA'],
    isNonGmo: true,
    brixBase: 11.2,
    notes: 'Granny Smith selection, commercial'
  },
  {
    id: 'crispin',
    varietyId: 'granny_smith',
    productId: 'apple',
    displayName: 'Crispin (Mutsu)',
    flavorProfile: 'Large, sweet-tart, Japanese origin',
    peakMonths: [10, 11],
    validatedStates: ['NY', 'WA', 'MI'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 12.5,
    notes: 'Golden Delicious × Indo, Japan 1930s'
  },
  {
    id: 'mutsu',
    varietyId: 'granny_smith',
    productId: 'apple',
    displayName: 'Mutsu',
    flavorProfile: 'Large, sweet, crisp, yellow-green',
    peakMonths: [10, 11],
    validatedStates: ['NY', 'MI'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 12.8,
    notes: 'Same as Crispin, Japanese name'
  },

  // ========================================================================
  // PEACHES: YELLOW PEACH (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'elberta_yellow',
    varietyId: 'yellow_peach',
    productId: 'peach',
    displayName: 'Elberta',
    flavorProfile: 'Classic yellow peach, sweet, juicy, freestone',
    peakMonths: [7, 8],
    validatedStates: ['GA', 'SC', 'CA', 'MI'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 12.5,
    notes: 'Georgia heritage 1875, most famous peach'
  },
  {
    id: 'redhaven_yellow',
    varietyId: 'yellow_peach',
    productId: 'peach',
    displayName: 'Redhaven',
    flavorProfile: 'Sweet, firm, red blush, freestone',
    peakMonths: [7, 8],
    validatedStates: ['MI', 'GA', 'SC', 'CA'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 12.8,
    notes: 'Michigan State 1940, commercial standard'
  },
  {
    id: 'loring',
    varietyId: 'yellow_peach',
    productId: 'peach',
    displayName: 'Loring',
    flavorProfile: 'Very sweet, low acid, large, freestone',
    peakMonths: [7, 8],
    validatedStates: ['GA', 'SC', 'CA'],
    isNonGmo: true,
    brixBase: 13.0,
    notes: 'North Carolina, popular commercial variety'
  },
  {
    id: 'flameprince',
    varietyId: 'yellow_peach',
    productId: 'peach',
    displayName: 'Flameprince',
    flavorProfile: 'Sweet, firm, excellent canning, freestone',
    peakMonths: [8],
    validatedStates: ['NJ', 'PA', 'MI'],
    isNonGmo: true,
    brixBase: 12.5,
    notes: 'Rutgers release, northern states'
  },

  // ========================================================================
  // PEACHES: WHITE PEACH (1 → 5) - Need 4 more
  // ========================================================================
  {
    id: 'white_lady_peach',
    varietyId: 'white_peach',
    productId: 'peach',
    displayName: 'White Lady',
    flavorProfile: 'Very sweet, low acid, white flesh, freestone',
    peakMonths: [7, 8],
    validatedStates: ['CA', 'GA', 'SC'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.5,
    notes: 'California specialty, premium white peach'
  },
  {
    id: 'babcock',
    varietyId: 'white_peach',
    productId: 'peach',
    displayName: 'Babcock',
    flavorProfile: 'Ultra-sweet, low acid, white, freestone',
    peakMonths: [7],
    validatedStates: ['CA'],
    heritageIntent: 'heirloom_quality',
    isNonGmo: true,
    brixBase: 14.0,
    notes: 'California heirloom, E.A. Babcock 1930s'
  },
  {
    id: 'arctic_supreme',
    varietyId: 'white_peach',
    productId: 'peach',
    displayName: 'Arctic Supreme',
    flavorProfile: 'White flesh, slow browning, sweet',
    peakMonths: [7, 8],
    validatedStates: ['CA'],
    heritageIntent: 'modern_flavor',
    isNonGmo: true,
    brixBase: 13.2,
    notes: 'Zaiger Genetics, non-browning white peach'
  },
  {
    id: 'snow_giant',
    varietyId: 'white_peach',
    productId: 'peach',
    displayName: 'Snow Giant',
    flavorProfile: 'Large, very sweet, white, freestone',
    peakMonths: [8],
    validatedStates: ['CA'],
    isNonGmo: true,
    brixBase: 13.8,
    notes: 'California, large premium white peach'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('EXPAND APPLES, LEMONS, AND PEACHES TO 5 CULTIVARS')
  console.log('='.repeat(80))
  console.log()
  console.log(`Adding ${NEW_CULTIVARS.length} new cultivars...`)
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
    } catch (error: any) {
      // Check if it's a duplicate error
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
