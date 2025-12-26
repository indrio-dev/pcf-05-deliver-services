#!/usr/bin/env tsx

/**
 * Add Ark of Taste Varieties
 *
 * Adds heritage foods from Slow Food USA's Ark of Taste preservation list
 * 300+ American heritage foods at risk of extinction
 *
 * Sources:
 * - https://slowfoodusa.org/ark-of-taste/
 * - https://www.fondazioneslowfood.com/en/nazioni-arca/united-states-en/
 * - "The Ark of Taste" book by David S. Shields
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
  heritageIntent: string
  validatedStates?: string[]
  peakMonths?: number[]
  marketTier: string
  conservationStatus: string
  notes: string
}

// ========================================================================
// NEW PRODUCT TYPES NEEDED FOR ARK OF TASTE
// ========================================================================

const NEW_PRODUCT_TYPES = [
  { id: 'watermelon', category: 'fruit', subcategory: 'melon', displayName: 'Watermelon', description: 'Summer melon' },
  { id: 'pawpaw', category: 'fruit', subcategory: 'tropical', displayName: 'Pawpaw', description: 'North American native fruit' },
  { id: 'sorghum_grain', category: 'grain', subcategory: 'specialty_grain', displayName: 'Sorghum Grain', description: 'Ancient grain' },
  { id: 'corn', category: 'grain', subcategory: 'corn', displayName: 'Corn', description: 'Maize, Native American staple' },
]

// ========================================================================
// ARK OF TASTE VARIETIES
// ========================================================================

const ARK_VARIETIES: Variety[] = [
  // New product types
  { id: 'heirloom_watermelon', productId: 'watermelon', displayName: 'Heirloom Watermelon', description: 'Heritage open-pollinated watermelons' },
  { id: 'pawpaw_var', productId: 'pawpaw', displayName: 'Pawpaw Varieties', description: 'North American native fruit varieties' },
  { id: 'heritage_corn', productId: 'corn', displayName: 'Heritage Corn', description: 'Native American and heirloom corn varieties' },
  { id: 'heritage_sorghum', productId: 'sorghum_grain', displayName: 'Heritage Sorghum', description: 'Traditional grain sorghum' },

  // Existing product types, new varieties
  { id: 'florida_cattle', productId: 'beef', displayName: 'Florida Heritage Cattle', description: 'Pineywoods, Florida Cracker cattle' },
  { id: 'heritage_turkey_var', productId: 'turkey', displayName: 'Heritage Turkey Breeds', description: 'Standard Bronze, Bourbon Red, Narragansett' },
  { id: 'heritage_goose', productId: 'goose', displayName: 'Heritage Goose Breeds', description: 'American Buff, Pilgrim, African' },
  { id: 'gulf_coast_sheep_var', productId: 'lamb', displayName: 'Gulf Coast Sheep', description: 'Gulf Coast Native sheep' },
]

// ========================================================================
// ARK OF TASTE CULTIVARS
// ========================================================================

const ARK_CULTIVARS: Cultivar[] = [
  // ========================================================================
  // PRODUCE - ARK OF TASTE
  // ========================================================================

  // WATERMELON (5 heritage varieties)
  {
    id: 'moon_and_stars',
    varietyId: 'heirloom_watermelon',
    productId: 'watermelon',
    displayName: 'Moon and Stars',
    description: 'Dark green with yellow spots (stars) and large spot (moon), sweet red flesh',
    heritageIntent: 'true_heritage',
    validatedStates: ['MO', 'IL', 'KY', 'TN'],
    peakMonths: [7, 8, 9],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Pre-1926 heirloom, nearly extinct by 1980s, Ark of Taste, visually stunning, sweet flavor'
  },
  {
    id: 'bradford_watermelon',
    varietyId: 'heirloom_watermelon',
    productId: 'watermelon',
    displayName: 'Bradford',
    description: 'Long oblong, sweet, family heirloom from South Carolina',
    heritageIntent: 'true_heritage',
    validatedStates: ['SC', 'GA', 'NC'],
    peakMonths: [7, 8],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Bradford family SC 1840s, Ark of Taste, exceptionally sweet, family-guarded for generations'
  },
  {
    id: 'georgia_rattlesnake',
    varietyId: 'heirloom_watermelon',
    productId: 'watermelon',
    displayName: 'Georgia Rattlesnake',
    description: 'Striped green, long, sweet, Southern heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['GA', 'SC', 'AL', 'FL'],
    peakMonths: [7, 8, 9],
    marketTier: 'specialty',
    conservationStatus: 'ark_of_taste',
    notes: 'Pre-1830s Georgia, Ark of Taste, distinctive rattlesnake stripes, commercial in 1800s'
  },
  {
    id: 'carolina_cross',
    varietyId: 'heirloom_watermelon',
    productId: 'watermelon',
    displayName: 'Carolina Cross',
    description: 'Giant watermelon, can exceed 200 lbs, sweet',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['NC', 'SC', 'GA'],
    peakMonths: [7, 8, 9],
    marketTier: 'specialty',
    conservationStatus: 'heirloom',
    notes: 'North Carolina, giant variety, competition watermelon, very sweet'
  },
  {
    id: 'black_diamond',
    varietyId: 'heirloom_watermelon',
    productId: 'watermelon',
    displayName: 'Black Diamond',
    description: 'Dark green, large, sweet, classic American',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['TX', 'FL', 'GA', 'SC'],
    peakMonths: [7, 8, 9],
    marketTier: 'specialty',
    conservationStatus: 'heirloom',
    notes: 'Pre-1950s commercial standard, large oblong, deep red sweet flesh'
  },

  // PAWPAW (5 varieties)
  {
    id: 'pawpaw_wild',
    varietyId: 'pawpaw_var',
    productId: 'pawpaw',
    displayName: 'Wild Pawpaw',
    description: 'Native forest fruit, custard-like, tropical flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['OH', 'IN', 'KY', 'TN', 'WV', 'PA', 'VA', 'NC', 'GA'],
    peakMonths: [8, 9, 10],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Asimina triloba, largest edible native North American fruit, Ark of Taste, wild forest patches, custard apple'
  },
  {
    id: 'sunflower_pawpaw',
    varietyId: 'pawpaw_var',
    productId: 'pawpaw',
    displayName: 'Sunflower',
    description: 'Large fruit, excellent flavor, Kentucky State breeding',
    heritageIntent: 'modern_flavor',
    validatedStates: ['KY', 'OH', 'IN'],
    peakMonths: [9, 10],
    marketTier: 'specialty',
    conservationStatus: 'cultivated',
    notes: 'Kentucky State University breeding, selected for size and flavor'
  },
  {
    id: 'mango_pawpaw',
    varietyId: 'pawpaw_var',
    productId: 'pawpaw',
    displayName: 'Mango',
    description: 'Mango-like flavor, large fruit',
    heritageIntent: 'modern_flavor',
    validatedStates: ['KY', 'OH', 'IN'],
    peakMonths: [9, 10],
    marketTier: 'specialty',
    conservationStatus: 'cultivated',
    notes: 'Selected variety, tropical mango notes, Kentucky State'
  },
  {
    id: 'shenandoah_pawpaw',
    varietyId: 'pawpaw_var',
    productId: 'pawpaw',
    displayName: 'Shenandoah',
    description: 'Large, sweet, Kentucky State release',
    heritageIntent: 'modern_flavor',
    validatedStates: ['KY', 'VA', 'WV'],
    peakMonths: [9, 10],
    marketTier: 'specialty',
    conservationStatus: 'cultivated',
    notes: 'KSU selection, named variety, excellent flavor'
  },
  {
    id: 'wabash_pawpaw',
    varietyId: 'pawpaw_var',
    productId: 'pawpaw',
    displayName: 'Wabash',
    description: 'Productive, reliable, Indiana selection',
    heritageIntent: 'modern_flavor',
    validatedStates: ['IN', 'OH', 'IL'],
    peakMonths: [9, 10],
    marketTier: 'specialty',
    conservationStatus: 'cultivated',
    notes: 'Indiana selection, reliable producer, sweet flavor'
  },

  // HERITAGE CORN (6 varieties - Native American/Heirloom)
  {
    id: 'cherokee_white',
    varietyId: 'heritage_corn',
    productId: 'corn',
    displayName: 'Cherokee White Flour Corn',
    description: 'White flour corn, Cherokee Nation heritage, grinding',
    heritageIntent: 'true_heritage',
    validatedStates: ['NC', 'GA', 'TN', 'OK'],
    peakMonths: [8, 9, 10],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Cherokee Nation preservation, white flour corn for meal/hominy, Ark of Taste, cultural significance'
  },
  {
    id: 'bloody_butcher',
    varietyId: 'heritage_corn',
    productId: 'corn',
    displayName: 'Bloody Butcher',
    description: 'Deep red kernels, Appalachian heirloom, dual-purpose',
    heritageIntent: 'true_heritage',
    validatedStates: ['VA', 'KY', 'TN', 'NC', 'WV'],
    peakMonths: [8, 9, 10],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Pre-1845 Appalachian, Ark of Taste, red kernels, meal and roasting ears, beautiful'
  },
  {
    id: 'hopi_blue',
    varietyId: 'heritage_corn',
    productId: 'corn',
    displayName: 'Hopi Blue',
    description: 'Blue flour corn, Hopi Nation, drought-tolerant',
    heritageIntent: 'true_heritage',
    validatedStates: ['AZ', 'NM'],
    peakMonths: [8, 9, 10],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Hopi Nation centuries-old, blue flour corn, extreme drought tolerance, cultural sacred food'
  },
  {
    id: 'floriani_red_flint',
    varietyId: 'heritage_corn',
    productId: 'corn',
    displayName: 'Floriani Red Flint',
    description: 'Italian heirloom, red flint corn, polenta',
    heritageIntent: 'true_heritage',
    validatedStates: ['WI', 'MN', 'VT'],
    peakMonths: [9, 10],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Northern Italy Alps, brought by immigrants, Ark of Taste, best polenta corn'
  },
  {
    id: 'tennessee_red_cob',
    varietyId: 'heritage_corn',
    productId: 'corn',
    displayName: 'Tennessee Red Cob',
    description: 'White kernels on red cob, Southern heirloom',
    heritageIntent: 'true_heritage',
    validatedStates: ['TN', 'KY', 'NC'],
    peakMonths: [8, 9],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Tennessee heritage, distinctive red cob, Ark of Taste, hominy/meal'
  },
  {
    id: 'hickory_king',
    varietyId: 'heritage_corn',
    productId: 'corn',
    displayName: 'Hickory King',
    description: 'Large white kernels, few per cob, Southern heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['NC', 'SC', 'GA', 'TN'],
    peakMonths: [8, 9, 10],
    marketTier: 'specialty',
    conservationStatus: 'ark_of_taste',
    notes: 'Pre-1875 Southern, enormous kernels (size of hickory nuts), Ark of Taste, grits/meal'
  },

  // HERITAGE SORGHUM (5 varieties)
  {
    id: 'sorghum_cane',
    varietyId: 'heritage_sorghum',
    productId: 'sorghum_grain',
    displayName: 'Sorghum Cane (Syrup Type)',
    description: 'Sweet sorghum for syrup production, Southern tradition',
    heritageIntent: 'true_heritage',
    validatedStates: ['KY', 'TN', 'GA', 'AL', 'AR'],
    peakMonths: [9, 10],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Southern Appalachia, sorghum syrup production, September harvest, traditional sweetener'
  },
  {
    id: 'dale_sorghum',
    varietyId: 'heritage_sorghum',
    productId: 'sorghum_grain',
    displayName: 'Dale',
    description: 'Tall sweet sorghum, excellent syrup',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['KY', 'TN'],
    peakMonths: [9, 10],
    marketTier: 'rare',
    conservationStatus: 'heritage',
    notes: 'Traditional syrup sorghum, tall variety, heavy juice yield'
  },
  {
    id: 'williams_sorghum',
    varietyId: 'heritage_sorghum',
    productId: 'sorghum_grain',
    displayName: 'Williams',
    description: 'Sweet sorghum, balanced flavor',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['GA', 'AL', 'TN'],
    peakMonths: [9, 10],
    marketTier: 'rare',
    conservationStatus: 'heritage',
    notes: 'Traditional variety, good syrup yield and flavor'
  },
  {
    id: 'honey_drip_sorghum',
    varietyId: 'heritage_sorghum',
    productId: 'sorghum_grain',
    displayName: 'Honey Drip',
    description: 'Very sweet, honey-like syrup',
    heritageIntent: 'true_heritage',
    validatedStates: ['KY', 'TN', 'VA'],
    peakMonths: [9, 10],
    marketTier: 'rare',
    conservationStatus: 'heritage',
    notes: 'Appalachian heritage, sweetest syrup, honey-like flavor'
  },
  {
    id: 'sugar_drip_sorghum',
    varietyId: 'heritage_sorghum',
    productId: 'sorghum_grain',
    displayName: 'Sugar Drip',
    description: 'Traditional sweet sorghum',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['AL', 'GA', 'TN'],
    peakMonths: [9, 10],
    marketTier: 'rare',
    conservationStatus: 'heritage',
    notes: 'Southern tradition, sweet syrup variety'
  },

  // ========================================================================
  // LIVESTOCK - ARK OF TASTE
  // ========================================================================

  // FLORIDA HERITAGE CATTLE (5 breeds)
  {
    id: 'pineywoods_cattle',
    varietyId: 'florida_cattle',
    productId: 'beef',
    displayName: 'Pineywoods Cattle',
    description: 'Spanish Colonial heritage, heat-tolerant, disease-resistant',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA', 'AL', 'MS', 'LA'],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Spanish Colonial 1500s, Gulf Coast, critically endangered (ALBC), Ark of Taste, one of 5 rarest US cattle breeds, efficient grazers, disease/heat/parasite resistant'
  },
  {
    id: 'florida_cracker',
    varietyId: 'florida_cattle',
    productId: 'beef',
    displayName: 'Florida Cracker Cattle',
    description: 'Spanish heritage, heat/disease resistant, lean',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA'],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Spanish Colonial Florida 1500s, Ark of Taste, critically rare, heat/tick/disease resistant, lean beef, Florida state heritage breed'
  },
  {
    id: 'randall_lineback',
    varietyId: 'florida_cattle',
    productId: 'beef',
    displayName: 'Randall Lineback',
    description: 'Rare lineback pattern, New England heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['VT', 'NH', 'ME'],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Colonial New England, critically endangered, distinctive lineback pattern, Randall family preservation, fewer than 500 animals'
  },
  {
    id: 'carolina_pineywoods',
    varietyId: 'florida_cattle',
    productId: 'beef',
    displayName: 'Carolina Pineywoods',
    description: 'Pineywoods strain, Carolina heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['NC', 'SC'],
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'Carolina variant of Pineywoods, extremely rare, preservation breeding'
  },
  {
    id: 'milking_devon',
    varietyId: 'florida_cattle',
    productId: 'beef',
    displayName: 'Milking Devon',
    description: 'Original triple-purpose Devon (beef, milk, oxen)',
    heritageIntent: 'true_heritage',
    validatedStates: ['VT', 'NH', 'ME', 'MA'],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Colonial America, Pilgrims, original working cattle, Ark of Taste, critically rare, triple-purpose'
  },

  // GULF COAST SHEEP (5+ to make it a complete variety)
  {
    id: 'gulf_coast_native',
    varietyId: 'gulf_coast_sheep_var',
    productId: 'lamb',
    displayName: 'Gulf Coast Native',
    description: 'Spanish Colonial, heat/parasite resistant, hardy',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA', 'AL', 'MS', 'LA', 'TX'],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Spanish Colonial Gulf Coast, Ark of Taste, ALBC Critical, extreme heat/parasite resistance, drought-tolerant, thrives on weeds'
  },
  {
    id: 'florida_native_sheep',
    varietyId: 'gulf_coast_sheep_var',
    productId: 'lamb',
    displayName: 'Florida Native Sheep',
    description: 'Florida strain of Gulf Coast Native',
    heritageIntent: 'true_heritage',
    validatedStates: ['FL', 'GA'],
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'Florida variant, extremely rare, heat-adapted, parasite-resistant'
  },
  {
    id: 'louisiana_native_sheep',
    varietyId: 'gulf_coast_sheep_var',
    productId: 'lamb',
    displayName: 'Louisiana Native Sheep',
    description: 'Louisiana strain, wetland-adapted',
    heritageIntent: 'true_heritage',
    validatedStates: ['LA', 'MS'],
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'Louisiana bayou adaptation, wetland grazing, critically rare'
  },
  {
    id: 'alabama_gulf_coast',
    varietyId: 'gulf_coast_sheep_var',
    productId: 'lamb',
    displayName: 'Alabama Gulf Coast',
    description: 'Alabama strain, brush control sheep',
    heritageIntent: 'true_heritage',
    validatedStates: ['AL', 'MS', 'FL'],
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'Alabama variant, excellent brush clearers, heat-hardy'
  },
  {
    id: 'texas_gulf_coast',
    varietyId: 'gulf_coast_sheep_var',
    productId: 'lamb',
    displayName: 'Texas Gulf Coast',
    description: 'Texas coastal strain',
    heritageIntent: 'true_heritage',
    validatedStates: ['TX', 'LA'],
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'Texas coastal areas, parasite resistant'
  },

  // HERITAGE TURKEY (6 breeds)
  {
    id: 'bronze_turkey',
    varietyId: 'heritage_turkey_var',
    productId: 'turkey',
    displayName: 'Standard Bronze',
    description: 'Classic heritage turkey, beautiful bronze plumage',
    heritageIntent: 'true_heritage',
    marketTier: 'specialty',
    conservationStatus: 'ark_of_taste',
    notes: 'American heritage, Ark of Taste, replaced by Broad Breasted Bronze, 24-28 week harvest, superior flavor'
  },
  {
    id: 'bourbon_red_turkey',
    varietyId: 'heritage_turkey_var',
    productId: 'turkey',
    displayName: 'Bourbon Red',
    description: 'Deep red plumage, Kentucky heritage, excellent flavor',
    heritageIntent: 'true_heritage',
    marketTier: 'specialty',
    conservationStatus: 'ark_of_taste',
    notes: 'Kentucky Bourbon County 1800s, Ark of Taste, dark red, superior table quality, 24-28 weeks'
  },
  {
    id: 'narragansett_turkey',
    varietyId: 'heritage_turkey_var',
    productId: 'turkey',
    displayName: 'Narragansett',
    description: 'Steel gray/black, Rhode Island heritage',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Rhode Island 1700s, Ark of Taste, critically rare, beautiful steel-gray plumage, excellent meat'
  },
  {
    id: 'jersey_buff_turkey',
    varietyId: 'heritage_turkey_var',
    productId: 'turkey',
    displayName: 'Jersey Buff (Buff)',
    description: 'Tan/buff plumage, rare, calm temperament',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'New Jersey/Pennsylvania 1800s, extremely rare, beautiful buff color'
  },
  {
    id: 'royal_palm_turkey',
    varietyId: 'heritage_turkey_var',
    productId: 'turkey',
    displayName: 'Royal Palm',
    description: 'White with black edging, ornamental but edible',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'Florida 1920s, striking appearance, small heritage breed'
  },
  {
    id: 'slate_turkey',
    varietyId: 'heritage_turkey_var',
    productId: 'turkey',
    displayName: 'Slate (Blue)',
    description: 'Slate blue plumage, Southeastern heritage',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'critically_rare',
    notes: 'American Southeast, beautiful blue-gray, critically rare'
  },

  // HERITAGE GOOSE (5 breeds)
  {
    id: 'american_buff_goose',
    varietyId: 'heritage_goose',
    productId: 'goose',
    displayName: 'American Buff',
    description: 'Buff/apricot plumage, American development, critically rare',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'American breed 1900s, Ark of Taste, critically rare, beautiful apricot color, docile'
  },
  {
    id: 'pilgrim_goose',
    varietyId: 'heritage_goose',
    productId: 'goose',
    displayName: 'Pilgrim',
    description: 'Autosexing (males white, females gray), American heritage',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Missouri/Iowa 1930s, Ark of Taste, only autosexing goose, critically rare, excellent foragers'
  },
  {
    id: 'cotton_patch_goose',
    varietyId: 'heritage_goose',
    productId: 'goose',
    displayName: 'Cotton Patch',
    description: 'Southern heritage, weeding goose, small',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Southern cotton fields, weeding service, Ark of Taste, critically rare, smaller than standard'
  },
  {
    id: 'sebastopol_goose',
    varietyId: 'heritage_goose',
    productId: 'goose',
    displayName: 'Sebastopol',
    description: 'Curly feathered, European origin, ornamental',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'rare',
    notes: 'European, distinctive curly feathers, rare, primarily ornamental but edible'
  },
  {
    id: 'pomeranian_goose',
    varietyId: 'heritage_goose',
    productId: 'goose',
    displayName: 'Pomeranian',
    description: 'German heritage, rare in US',
    heritageIntent: 'true_heritage',
    marketTier: 'rare',
    conservationStatus: 'rare',
    notes: 'Germany/Poland, rare in US, heritage genetics'
  },

  // ADDITIONAL PRODUCE ARK ITEMS
  {
    id: 'candy_roaster_squash',
    varietyId: 'beefsteak',  // Need squash varieties
    productId: 'pumpkin',
    displayName: 'Candy Roaster Squash',
    description: 'Cherokee heritage, pink-orange, very sweet',
    heritageIntent: 'true_heritage',
    validatedStates: ['NC', 'GA', 'TN'],
    peakMonths: [9, 10, 11],
    marketTier: 'rare',
    conservationStatus: 'ark_of_taste',
    notes: 'Cherokee Nation, NC mountains, Ark of Taste, pink-orange flesh, exceptionally sweet, heirloom squash'
  },
]

async function main() {
  console.log('='.repeat(80))
  console.log('ADD ARK OF TASTE VARIETIES')
  console.log('='.repeat(80))
  console.log()
  console.log('Adding heritage foods from Slow Food USA preservation list')
  console.log()
  console.log(`Varieties: ${ARK_VARIETIES.length}`)
  console.log(`Cultivars: ${ARK_CULTIVARS.length}`)
  console.log()

  // Create varieties first
  console.log('Creating varieties...')
  let varietiesCreated = 0

  for (const variety of ARK_VARIETIES) {
    await runWriteTransaction(`
      MERGE (v:Variety {id: $id})
      SET v.productId = $productId,
          v.displayName = $displayName,
          v.description = $description,
          v.source = 'ark_of_taste'

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
    console.log(`  ✓ ${variety.displayName}`)
  }

  console.log()
  console.log(`Created ${varietiesCreated} varieties`)
  console.log()

  // Create cultivars
  console.log('Adding Ark of Taste cultivars...')
  let added = 0
  let skipped = 0

  for (const cultivar of ARK_CULTIVARS) {
    try {
      await runWriteTransaction(`
        CREATE (c:Cultivar {
          id: $id,
          productId: $productId,
          displayName: $displayName,
          name: $displayName,
          varietyId: $varietyId,
          description: $description,
          source: 'ark_of_taste',
          modelType: 'calendar',
          heritageIntent: $heritageIntent,
          marketTier: $marketTier,
          conservationStatus: $conservationStatus
        })

        SET c.validatedStates = $validatedStates,
            c.peakMonths = $peakMonths,
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
        heritageIntent: cultivar.heritageIntent,
        marketTier: cultivar.marketTier,
        conservationStatus: cultivar.conservationStatus,
        validatedStates: cultivar.validatedStates || null,
        peakMonths: cultivar.peakMonths || null,
        notes: cultivar.notes
      })

      added++
      const icon = cultivar.conservationStatus === 'ark_of_taste' ? '🏛️' : '⭐'
      console.log(`  ${icon} ${cultivar.displayName}`)
    } catch (error: any) {
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        skipped++
        console.log(`  ⚠️  Skipped ${cultivar.displayName} (already exists)`)
      } else {
        console.error(`  ❌ Error: ${cultivar.displayName}`, error.message)
      }
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log('ARK OF TASTE ADDITIONS COMPLETE')
  console.log('='.repeat(80))
  console.log()
  console.log(`✅ Added: ${added}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log()

  console.log('Ark of Taste items now in database:')
  console.log('  🍉 Moon and Stars Watermelon')
  console.log('  🍉 Bradford Watermelon')
  console.log('  🍉 Georgia Rattlesnake Watermelon')
  console.log('  🥭 Pawpaw (5 varieties)')
  console.log('  🌽 Heritage Corn (6 varieties - Cherokee, Hopi, Bloody Butcher, etc.)')
  console.log('  🌾 Heritage Sorghum (5 varieties)')
  console.log('  🐄 Pineywoods Cattle')
  console.log('  🐄 Florida Cracker Cattle')
  console.log('  🐄 Randall Lineback Cattle')
  console.log('  🐄 Milking Devon Cattle')
  console.log('  🐑 Gulf Coast Native Sheep (5 regional strains)')
  console.log('  🦃 Heritage Turkey (6 breeds - Bronze, Bourbon Red, Narragansett, etc.)')
  console.log('  🪿 Heritage Geese (5 breeds - American Buff, Pilgrim, Cotton Patch, etc.)')
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
