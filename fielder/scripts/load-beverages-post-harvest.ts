#!/usr/bin/env tsx

/**
 * Load Beverage and Post-Harvest Varieties
 *
 * Completes the final categories in farm-to-table taxonomy
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface Variety {
  id: string
  productId: string
  displayName: string
  description: string
}

interface Cultivar {
  id: string
  varietyId: string
  productId: string
  displayName: string
  description: string
  heritageIntent?: string
  validatedStates?: string[]
  notes?: string
}

// ========================================================================
// BEVERAGE VARIETIES
// ========================================================================

const BEVERAGE_VARIETIES: Variety[] = [
  // Coffee
  { id: 'arabica_coffee', productId: 'coffee', displayName: 'Arabica Coffee', description: 'Premium coffee species, complex flavors' },
  { id: 'robusta_coffee', productId: 'coffee', displayName: 'Robusta Coffee', description: 'Higher caffeine, bitter, commercial blends' },

  // Tea
  { id: 'camellia_tea', productId: 'yaupon_tea', displayName: 'Camellia Sinensis Tea', description: 'Traditional tea plant varieties' },
  { id: 'yaupon_holly', productId: 'yaupon_tea', displayName: 'Yaupon Holly', description: 'Native American caffeine source' },
]

const BEVERAGE_CULTIVARS: Cultivar[] = [
  // ARABICA COFFEE (6)
  {
    id: 'kona_coffee_var',
    varietyId: 'arabica_coffee',
    productId: 'coffee',
    displayName: 'Kona (Hawaiian Typica)',
    description: 'Hawaii Big Island, volcanic soil, premium',
    heritageIntent: 'true_heritage',
    validatedStates: ['HI'],
    notes: 'Kona Hawaii, volcanic terroir, Guatemalan Typica brought 1800s'
  },
  {
    id: 'bourbon_coffee',
    varietyId: 'arabica_coffee',
    productId: 'coffee',
    displayName: 'Bourbon',
    description: 'Réunion Island heritage, sweet, complex',
    heritageIntent: 'true_heritage',
    notes: 'Bourbon Island (Réunion), heirloom Arabica, naturally sweet'
  },
  {
    id: 'typica_coffee',
    varietyId: 'arabica_coffee',
    productId: 'coffee',
    displayName: 'Typica',
    description: 'Original Arabica, complex, lower yield',
    heritageIntent: 'true_heritage',
    notes: 'Ethiopia origin, foundation of all Arabica, excellent cup quality'
  },
  {
    id: 'gesha_coffee',
    varietyId: 'arabica_coffee',
    productId: 'coffee',
    displayName: 'Gesha (Geisha)',
    description: 'Floral, tea-like, highest prices',
    heritageIntent: 'true_heritage',
    notes: 'Ethiopia, Panama fame, $600+/lb auction, jasmine/bergamot notes'
  },
  {
    id: 'caturra_coffee',
    varietyId: 'arabica_coffee',
    productId: 'coffee',
    displayName: 'Caturra',
    description: 'Bourbon mutation, compact, productive',
    heritageIntent: 'heirloom_quality',
    notes: 'Brazil, Bourbon dwarf mutation, Central America common'
  },
  {
    id: 'sl28_coffee',
    varietyId: 'arabica_coffee',
    productId: 'coffee',
    displayName: 'SL28',
    description: 'Kenyan selection, complex, wine-like acidity',
    heritageIntent: 'heirloom_quality',
    notes: 'Kenya, Scott Labs selection, black currant notes, drought-tolerant'
  },

  // ROBUSTA (5)
  {
    id: 'robusta_standard',
    varietyId: 'robusta_coffee',
    productId: 'coffee',
    displayName: 'Standard Robusta',
    description: 'Commercial Robusta, high caffeine, bitter',
    notes: 'Vietnam/Brazil major producers, espresso blends, instant coffee'
  },
  {
    id: 'fine_robusta',
    varietyId: 'robusta_coffee',
    productId: 'coffee',
    displayName: 'Fine Robusta',
    description: 'Specialty Robusta, lower bitterness',
    notes: 'India/Uganda, specialty market, improved cup quality'
  },
  {
    id: 'nganda_robusta',
    varietyId: 'robusta_coffee',
    productId: 'coffee',
    displayName: 'Nganda',
    description: 'Robusta selection, better flavor',
    notes: 'Congo/Uganda selection'
  },
  {
    id: 'erecta_robusta',
    varietyId: 'robusta_coffee',
    productId: 'coffee',
    displayName: 'Erecta',
    description: 'Upright Robusta, easier harvest',
    notes: 'Upright growth habit, commercial production'
  },
  {
    id: 'kouilou_robusta',
    varietyId: 'robusta_coffee',
    productId: 'coffee',
    displayName: 'Kouilou',
    description: 'Robusta variety from Central Africa',
    notes: 'Central African strain, commercial variety'
  },

  // CAMELLIA TEA (6)
  {
    id: 'assam_tea',
    varietyId: 'camellia_tea',
    productId: 'yaupon_tea',
    displayName: 'Assam',
    description: 'Large leaf, malty, black tea standard',
    heritageIntent: 'true_heritage',
    notes: 'Assam India, British discovery, malty flavor, milk tea'
  },
  {
    id: 'china_tea',
    varietyId: 'camellia_tea',
    productId: 'yaupon_tea',
    displayName: 'China (Small Leaf)',
    description: 'Small leaf, delicate, green tea ideal',
    heritageIntent: 'true_heritage',
    notes: 'China origin, smaller leaves, green/white tea, delicate'
  },
  {
    id: 'darjeeling_tea',
    varietyId: 'camellia_tea',
    productId: 'yaupon_tea',
    displayName: 'Darjeeling Clones',
    description: 'High altitude, muscatel notes, champagne of teas',
    heritageIntent: 'true_heritage',
    notes: 'Darjeeling India, Chinese hybrid, high elevation terroir'
  },
  {
    id: 'ceylon_tea',
    varietyId: 'camellia_tea',
    productId: 'yaupon_tea',
    displayName: 'Ceylon',
    description: 'Sri Lankan tea, bright, citrus notes',
    heritageIntent: 'true_heritage',
    notes: 'Sri Lanka, bright cup, iced tea favorite'
  },
  {
    id: 'japanese_sencha',
    varietyId: 'camellia_tea',
    productId: 'yaupon_tea',
    displayName: 'Japanese Cultivars (Yabukita)',
    description: 'Japanese green tea cultivars',
    heritageIntent: 'true_heritage',
    notes: 'Japan, Yabukita most common, steamed green tea'
  },
  {
    id: 'formosa_oolong',
    varietyId: 'camellia_tea',
    productId: 'yaupon_tea',
    displayName: 'Formosa Oolong Cultivars',
    description: 'Taiwan oolong tea varieties',
    heritageIntent: 'true_heritage',
    notes: 'Taiwan, high mountain oolongs, floral complex'
  },

  // YAUPON HOLLY (5)
  {
    id: 'green_yaupon',
    varietyId: 'yaupon_holly',
    productId: 'yaupon_tea',
    displayName: 'Green Yaupon',
    description: 'Native American holly, caffeine, mild',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA', 'SC', 'NC', 'TX'],
    notes: 'Native Southeast US, only caffeine plant native to North America'
  },
  {
    id: 'roasted_yaupon',
    varietyId: 'yaupon_holly',
    productId: 'yaupon_tea',
    displayName: 'Roasted Yaupon',
    description: 'Dark roasted, richer flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'TX', 'NC'],
    notes: 'Same plant as green, roasted processing, deeper flavor'
  },
  {
    id: 'wild_yaupon',
    varietyId: 'yaupon_holly',
    productId: 'yaupon_tea',
    displayName: 'Wild Harvested Yaupon',
    description: 'Forest-grown, wild harvest',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA', 'TX'],
    notes: 'Wild harvest from native stands, variable terroir'
  },
  {
    id: 'cultivated_yaupon',
    varietyId: 'yaupon_holly',
    productId: 'yaupon_tea',
    displayName: 'Cultivated Yaupon',
    description: 'Farmed yaupon, consistent quality',
    validatedStates: ['FL', 'TX', 'NC', 'SC'],
    notes: 'Cultivated for tea production, emerging industry'
  },
  {
    id: 'chocolate_yaupon',
    varietyId: 'yaupon_holly',
    productId: 'yaupon_tea',
    displayName: 'Chocolate Roasted Yaupon',
    description: 'Heavy roast, chocolate notes',
    validatedStates: ['FL', 'TX'],
    notes: 'Dark roasted processing, cocoa-like notes'
  }
]

// ========================================================================
// POST-HARVEST VARIETIES
// ========================================================================

const POST_HARVEST_VARIETIES: Variety[] = [
  // Honey
  { id: 'wildflower_honey_var', productId: 'honey', displayName: 'Wildflower Honey', description: 'Mixed nectar sources, regional' },
  { id: 'monofloral_honey', productId: 'honey', displayName: 'Monofloral Honey', description: 'Single floral source, distinct flavors' },

  // Maple Syrup
  { id: 'maple_syrup_grades', productId: 'maple_syrup', displayName: 'Maple Syrup Grades', description: 'Color and flavor grades' },

  // Cured Meats
  { id: 'country_ham_styles', productId: 'country_ham', displayName: 'Country Ham Styles', description: 'Regional dry-cured hams' },
  { id: 'artisan_bacon', productId: 'bacon', displayName: 'Artisan Bacon', description: 'Heritage breed and specialty bacons' },

  // Olive Oil
  { id: 'evoo_varieties', productId: 'olive_oil', displayName: 'EVOO Varieties', description: 'California olive oil varieties' },
]

const POST_HARVEST_CULTIVARS: Cultivar[] = [
  // WILDFLOWER HONEY (5)
  {
    id: 'southeast_wildflower',
    varietyId: 'wildflower_honey_var',
    productId: 'honey',
    displayName: 'Southeast Wildflower',
    description: 'Mixed southern wildflowers',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA', 'SC', 'NC', 'AL'],
    notes: 'Gallberry, palmetto, seasonal wildflowers'
  },
  {
    id: 'texas_wildflower',
    varietyId: 'wildflower_honey_var',
    productId: 'honey',
    displayName: 'Texas Wildflower',
    description: 'Texas mixed nectar, often mesquite notes',
    heritageIntent: 'true_heritage',
    validatedStates: ['TX'],
    notes: 'Mesquite, bluebonnet, huisache blend'
  },
  {
    id: 'mountain_wildflower',
    varietyId: 'wildflower_honey_var',
    productId: 'honey',
    displayName: 'Mountain Wildflower',
    description: 'High elevation mixed flowers',
    heritageIntent: 'true_heritage',
    validatedStates: ['CO', 'MT', 'WY'],
    notes: 'Alpine/subalpine wildflowers, complex'
  },
  {
    id: 'prairie_wildflower',
    varietyId: 'wildflower_honey_var',
    productId: 'honey',
    displayName: 'Prairie Wildflower',
    description: 'Great Plains mixed flowers',
    heritageIntent: 'true_heritage',
    validatedStates: ['ND', 'SD', 'MN', 'IA'],
    notes: 'Clover, alfalfa, prairie flowers'
  },
  {
    id: 'desert_wildflower',
    varietyId: 'wildflower_honey_var',
    productId: 'honey',
    displayName: 'Desert Wildflower',
    description: 'Southwest desert bloom honey',
    heritageIntent: 'true_heritage',
    validatedStates: ['AZ', 'NM'],
    notes: 'Mesquite, palo verde, desert bloom honey'
  },

  // MONOFLORAL HONEY (7)
  {
    id: 'tupelo_honey_var',
    varietyId: 'monofloral_honey',
    productId: 'honey',
    displayName: 'Tupelo',
    description: 'White Tupelo, Northwest Florida, never crystallizes',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA'],
    notes: 'Apalachicola River basin, white tupelo trees, April-May only, premium price'
  },
  {
    id: 'sourwood_honey_var',
    varietyId: 'monofloral_honey',
    productId: 'honey',
    displayName: 'Sourwood',
    description: 'Appalachian specialty, anise notes',
    heritageIntent: 'true_heritage',
    validatedStates: ['NC', 'TN', 'GA', 'VA'],
    notes: 'Appalachian Mountains, June-July, spicy-anise flavor'
  },
  {
    id: 'orange_blossom',
    varietyId: 'monofloral_honey',
    productId: 'honey',
    displayName: 'Orange Blossom',
    description: 'Citrus honey, light floral, Florida/California',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['FL', 'CA', 'TX'],
    notes: 'Citrus groves, February-April, light citrus notes'
  },
  {
    id: 'clover_honey',
    varietyId: 'monofloral_honey',
    productId: 'honey',
    displayName: 'Clover',
    description: 'Mild, sweet, American standard',
    validatedStates: ['ND', 'SD', 'MT', 'MN'],
    notes: 'White/alsike clover, Midwest/northern plains, mild flavor'
  },
  {
    id: 'sage_honey',
    varietyId: 'monofloral_honey',
    productId: 'honey',
    displayName: 'Sage',
    description: 'California white sage, slow crystallization',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    notes: 'California white sage, slow to crystallize, mild herbal'
  },
  {
    id: 'buckwheat_honey',
    varietyId: 'monofloral_honey',
    productId: 'honey',
    displayName: 'Buckwheat',
    description: 'Dark, strong, molasses notes',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['NY', 'PA', 'OH'],
    notes: 'Northeast, very dark, mineral-rich, medicinal properties'
  },
  {
    id: 'avocado_honey',
    varietyId: 'monofloral_honey',
    productId: 'honey',
    displayName: 'Avocado Blossom',
    description: 'Dark, buttery, California',
    validatedStates: ['CA'],
    notes: 'California avocado groves, dark amber, rich flavor'
  },

  // MAPLE SYRUP GRADES (5)
  {
    id: 'golden_delicate',
    varietyId: 'maple_syrup_grades',
    productId: 'maple_syrup',
    displayName: 'Golden Color, Delicate Taste',
    description: 'Light amber, early season, mild maple',
    heritageIntent: 'true_heritage',
    validatedStates: ['VT', 'NY', 'ME', 'NH', 'WI'],
    notes: 'Formerly Grade A Light Amber, early sap, delicate'
  },
  {
    id: 'amber_rich',
    varietyId: 'maple_syrup_grades',
    productId: 'maple_syrup',
    displayName: 'Amber Color, Rich Taste',
    description: 'Medium amber, classic maple flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['VT', 'NY', 'ME', 'NH', 'WI', 'MI'],
    notes: 'Formerly Grade A Medium Amber, most popular, balanced'
  },
  {
    id: 'dark_robust',
    varietyId: 'maple_syrup_grades',
    productId: 'maple_syrup',
    displayName: 'Dark Color, Robust Taste',
    description: 'Dark amber, strong maple, late season',
    heritageIntent: 'true_heritage',
    validatedStates: ['VT', 'NY', 'ME', 'WI'],
    notes: 'Formerly Grade A Dark Amber/Grade B, baking favorite, intense'
  },
  {
    id: 'very_dark_strong',
    varietyId: 'maple_syrup_grades',
    productId: 'maple_syrup',
    displayName: 'Very Dark, Strong Taste',
    description: 'Darkest grade, very strong maple',
    heritageIntent: 'true_heritage',
    validatedStates: ['VT', 'NY', 'ME'],
    notes: 'Latest season, formerly Grade C, commercial baking'
  },
  {
    id: 'vermont_fancy',
    varietyId: 'maple_syrup_grades',
    productId: 'maple_syrup',
    displayName: 'Vermont Fancy (Heritage)',
    description: 'Lightest grade, premium, early season',
    heritageIntent: 'true_heritage',
    validatedStates: ['VT'],
    notes: 'Vermont traditional grade, lightest possible, premium'
  },

  // YAUPON HOLLY (already defined in beverage cultivars above, but different product)
  // Actually yaupon should be under yaupon_tea product, already handled above

  // COUNTRY HAM (5)
  {
    id: 'virginia_country_ham_var',
    varietyId: 'country_ham_styles',
    productId: 'country_ham',
    displayName: 'Virginia Country Ham',
    description: 'Smithfield style, long cure, salty',
    heritageIntent: 'true_heritage',
    validatedStates: ['VA'],
    notes: 'Smithfield VA, peanut-fed hogs traditional, 6+ month cure'
  },
  {
    id: 'tennessee_country_ham_var',
    varietyId: 'country_ham_styles',
    productId: 'country_ham',
    displayName: 'Tennessee Country Ham',
    description: 'Dry-cured, hickory smoked',
    heritageIntent: 'true_heritage',
    validatedStates: ['TN'],
    notes: 'Tennessee, hickory smoke, shorter cure than Virginia'
  },
  {
    id: 'kentucky_country_ham',
    varietyId: 'country_ham_styles',
    productId: 'country_ham',
    displayName: 'Kentucky Country Ham',
    description: 'Salt cure, aged 6-12 months',
    heritageIntent: 'true_heritage',
    validatedStates: ['KY'],
    notes: 'Kentucky, Col. Bill Newsom, aging in barns'
  },
  {
    id: 'north_carolina_country',
    varietyId: 'country_ham_styles',
    productId: 'country_ham',
    displayName: 'North Carolina Country Ham',
    description: 'Salt and sugar cure, Southern style',
    heritageIntent: 'true_heritage',
    validatedStates: ['NC'],
    notes: 'NC mountains, often sugar in cure, milder than Virginia'
  },
  {
    id: 'missouri_country_ham',
    varietyId: 'country_ham_styles',
    productId: 'country_ham',
    displayName: 'Missouri Country Ham',
    description: 'Dry-cured, Midwest style',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['MO'],
    notes: 'Missouri, dry cure, farm tradition'
  },

  // ARTISAN BACON (5)
  {
    id: 'berkshire_bacon',
    varietyId: 'artisan_bacon',
    productId: 'bacon',
    displayName: 'Berkshire (Kurobuta) Bacon',
    description: 'Heritage pork, exceptional marbling',
    heritageIntent: 'true_heritage',
    notes: 'Berkshire pork, higher fat, rich flavor, premium market'
  },
  {
    id: 'duroc_bacon',
    varietyId: 'artisan_bacon',
    productId: 'bacon',
    displayName: 'Duroc Bacon',
    description: 'Heritage red pig, marbled, sweet',
    heritageIntent: 'heirloom_quality',
    notes: 'Duroc heritage pork, naturally sweet, good marbling'
  },
  {
    id: 'mangalitsa_bacon',
    varietyId: 'artisan_bacon',
    productId: 'bacon',
    displayName: 'Mangalitsa Bacon',
    description: 'Wooly pig, extreme marbling, buttery',
    heritageIntent: 'true_heritage',
    notes: 'Hungarian Mangalitsa, lard-type pig, highest fat content, gourmet'
  },
  {
    id: 'jowl_bacon',
    varietyId: 'artisan_bacon',
    productId: 'bacon',
    displayName: 'Jowl Bacon (Guanciale)',
    description: 'Cheek/jowl, Italian style, very fatty',
    heritageIntent: 'true_heritage',
    notes: 'Italian guanciale, pork cheek, carbonara traditional'
  },
  {
    id: 'double_smoked',
    varietyId: 'artisan_bacon',
    productId: 'bacon',
    displayName: 'Double Smoked Bacon',
    description: 'Extended smoking, intense flavor',
    notes: 'Heritage breeds, extended hickory/applewood smoke'
  },

  // OLIVE OIL (5)
  {
    id: 'mission_evoo',
    varietyId: 'evoo_varieties',
    productId: 'olive_oil',
    displayName: 'Mission Olive Oil',
    description: 'California heritage, Spanish mission origins',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    notes: 'Spanish mission olive, California 1700s, fruity mild'
  },
  {
    id: 'arbequina_evoo',
    varietyId: 'evoo_varieties',
    productId: 'olive_oil',
    displayName: 'Arbequina Olive Oil',
    description: 'Spanish variety, buttery, mild',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    notes: 'Catalonia Spain, buttery smooth, low pungency'
  },
  {
    id: 'koroneiki_evoo',
    varietyId: 'evoo_varieties',
    productId: 'olive_oil',
    displayName: 'Koroneiki Olive Oil',
    description: 'Greek variety, fruity, peppery',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    notes: 'Greece, high polyphenols, fruity-peppery, premium'
  },
  {
    id: 'frantoio_evoo',
    varietyId: 'evoo_varieties',
    productId: 'olive_oil',
    displayName: 'Frantoio Olive Oil',
    description: 'Tuscan variety, robust, peppery',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    notes: 'Tuscany Italy, bold flavor, high polyphenols'
  },
  {
    id: 'picual_evoo',
    varietyId: 'evoo_varieties',
    productId: 'olive_oil',
    displayName: 'Picual Olive Oil',
    description: 'Spanish, robust, high stability',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    notes: 'Spain, most planted variety worldwide, very stable oil'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD BEVERAGES AND POST-HARVEST VARIETIES')
  console.log('='.repeat(80))
  console.log()

  const allVarieties = [...BEVERAGE_VARIETIES, ...POST_HARVEST_VARIETIES]
  const allCultivars = [...BEVERAGE_CULTIVARS, ...POST_HARVEST_CULTIVARS]

  console.log(`Total Varieties: ${allVarieties.length}`)
  console.log(`  - Beverages: ${BEVERAGE_VARIETIES.length}`)
  console.log(`  - Post-Harvest: ${POST_HARVEST_VARIETIES.length}`)
  console.log()
  console.log(`Total Cultivars: ${allCultivars.length}`)
  console.log(`  - Beverages: ${BEVERAGE_CULTIVARS.length}`)
  console.log(`  - Post-Harvest: ${POST_HARVEST_CULTIVARS.length}`)
  console.log()

  // =========================================================================
  // STEP 1: Create Variety nodes
  // =========================================================================
  console.log('STEP 1: Creating varieties...')
  let varietiesCreated = 0

  for (const variety of allVarieties) {
    await runWriteTransaction(`
      MERGE (v:Variety {id: $id})
      SET v.productId = $productId,
          v.displayName = $displayName,
          v.description = $description,
          v.source = 'typescript'

      // Link to ProductType
      WITH v
      MATCH (p:ProductType {id: $productId})
      MERGE (v)-[:BELONGS_TO_PRODUCT]->(p)
    `, {
      id: variety.id,
      productId: variety.productId,
      displayName: variety.displayName,
      description: variety.description
    })

    varietiesCreated++
  }

  console.log(`  Completed: ${varietiesCreated} varieties`)
  console.log()

  // =========================================================================
  // STEP 2: Create Cultivar nodes
  // =========================================================================
  console.log('STEP 2: Creating cultivars...')
  let cultivarsCreated = 0
  let errors = 0

  for (const cultivar of allCultivars) {
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
        notes: cultivar.notes || null
      })

      cultivarsCreated++
    } catch (error: any) {
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        console.log(`  ⚠️  Skipped ${cultivar.id} (already exists)`)
      } else {
        console.error(`  ❌ Error adding ${cultivar.id}:`, error.message)
        errors++
      }
    }
  }

  console.log(`  Completed: ${cultivarsCreated} cultivars`)
  if (errors > 0) {
    console.log(`  Errors: ${errors}`)
  }
  console.log()

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('='.repeat(80))
  console.log('VERIFICATION')
  console.log('='.repeat(80))
  console.log()

  console.log('BEVERAGES:')
  console.log('-'.repeat(80))
  for (const v of BEVERAGE_VARIETIES) {
    const count = await runWriteTransaction<{ count: number }>(`
      MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: $varietyId})
      RETURN count(c) as count
    `, { varietyId: v.id })

    const status = Number(count[0].count) >= 5 ? '✅' : '⚠️'
    console.log(`  ${status} ${v.displayName}: ${count[0].count} cultivars`)
  }
  console.log()

  console.log('POST-HARVEST:')
  console.log('-'.repeat(80))
  for (const v of POST_HARVEST_VARIETIES) {
    const count = await runWriteTransaction<{ count: number }>(`
      MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: $varietyId})
      RETURN count(c) as count
    `, { varietyId: v.id })

    const status = Number(count[0].count) >= 5 ? '✅' : '⚠️'
    console.log(`  ${status} ${v.displayName}: ${count[0].count} varieties`)
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
