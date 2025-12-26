#!/usr/bin/env tsx

/**
 * Load Vegetables, Nuts, and Grains Varieties and Cultivars
 *
 * Completes the farm-to-table taxonomy
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
  peakMonths?: number[]
  brixBase?: number
  notes?: string
}

// ========================================================================
// VEGETABLE VARIETIES
// ========================================================================

const VEGETABLE_VARIETIES: Variety[] = [
  // Tomatoes (expand beyond existing 3)
  { id: 'beefsteak_tomato_var', productId: 'tomato', displayName: 'Beefsteak Tomato', description: 'Large slicing tomatoes' },
  { id: 'cherry_tomato_var', productId: 'tomato', displayName: 'Cherry Tomato', description: 'Small sweet snacking tomatoes' },
  { id: 'roma_tomato', productId: 'tomato', displayName: 'Roma/Paste Tomato', description: 'Meaty, low moisture, sauce tomatoes' },
  { id: 'heirloom_tomato', productId: 'tomato', displayName: 'Heirloom Tomato', description: 'Heritage open-pollinated varieties' },

  // Potatoes
  { id: 'russet_potato', productId: 'potato', displayName: 'Russet Potato', description: 'Baking potatoes, high starch' },
  { id: 'yellow_potato', productId: 'potato', displayName: 'Yellow Potato', description: 'Waxy, buttery, all-purpose' },
  { id: 'red_potato', productId: 'potato', displayName: 'Red Potato', description: 'Waxy, holds shape, roasting' },
  { id: 'fingerling_potato', productId: 'potato', displayName: 'Fingerling Potato', description: 'Small, waxy, gourmet' },
  { id: 'purple_potato', productId: 'potato', displayName: 'Purple Potato', description: 'Anthocyanin-rich, specialty' },

  // Carrots
  { id: 'nantes_carrot_var', productId: 'carrot', displayName: 'Nantes Carrot', description: 'Sweet cylindrical carrots' },
  { id: 'imperator_carrot', productId: 'carrot', displayName: 'Imperator Carrot', description: 'Long tapered commercial carrots' },

  // Lettuce
  { id: 'romaine_lettuce', productId: 'lettuce', displayName: 'Romaine Lettuce', description: 'Upright, crisp, Caesar salad' },
  { id: 'butterhead_lettuce', productId: 'lettuce', displayName: 'Butterhead Lettuce', description: 'Soft, buttery, bibb/boston' },
  { id: 'loose_leaf', productId: 'lettuce', displayName: 'Loose Leaf Lettuce', description: 'No head, continuous harvest' },

  // Onions
  { id: 'sweet_onion', productId: 'onion', displayName: 'Sweet Onion', description: 'Low sulfur, mild, raw-eating' },
  { id: 'storage_onion', productId: 'onion', displayName: 'Storage Onion', description: 'Pungent, long-keeping' },
]

const VEGETABLE_CULTIVARS: Cultivar[] = [
  // BEEFSTEAK TOMATO (5)
  {
    id: 'brandywine_tomato',
    varietyId: 'beefsteak_tomato_var',
    productId: 'tomato',
    displayName: 'Brandywine',
    description: 'Large pink beefsteak, exceptional flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['PA', 'OH', 'VA', 'NC'],
    peakMonths: [7, 8, 9],
    brixBase: 5.5,
    notes: 'Amish heirloom, pre-1885, considered best-tasting tomato'
  },
  {
    id: 'cherokee_purple_tomato',
    varietyId: 'beefsteak_tomato_var',
    productId: 'tomato',
    displayName: 'Cherokee Purple',
    description: 'Purple-brown beefsteak, rich smoky flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['TN', 'NC', 'GA'],
    peakMonths: [7, 8, 9],
    brixBase: 5.2,
    notes: 'Cherokee Nation heritage, pre-1890'
  },
  {
    id: 'mortgage_lifter',
    varietyId: 'beefsteak_tomato_var',
    productId: 'tomato',
    displayName: 'Mortgage Lifter',
    description: 'Very large pink beefsteak, sweet',
    heritageIntent: 'true_heritage',
    validatedStates: ['WV', 'VA', 'OH'],
    peakMonths: [7, 8, 9],
    brixBase: 5.0,
    notes: 'M.C. Byles West Virginia 1930s, legend says sales paid off mortgage'
  },
  {
    id: 'big_beef',
    varietyId: 'beefsteak_tomato_var',
    productId: 'tomato',
    displayName: 'Big Beef',
    description: 'Large hybrid, disease resistant, flavorful',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'FL', 'TX', 'GA'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 4.8,
    notes: 'Modern hybrid, AAS winner, commercial quality with heirloom flavor'
  },
  {
    id: 'beefmaster',
    varietyId: 'beefsteak_tomato_var',
    productId: 'tomato',
    displayName: 'Beefmaster',
    description: 'Very large hybrid beefsteak',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'TX', 'FL'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 4.5,
    notes: 'Hybrid, can exceed 2 lbs, commercial variety'
  },

  // CHERRY TOMATO (5)
  {
    id: 'sungold_tomato',
    varietyId: 'cherry_tomato_var',
    productId: 'tomato',
    displayName: 'Sungold',
    description: 'Orange cherry, extremely sweet',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'FL', 'TX'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 8.0,
    notes: 'Japanese hybrid, highest Brix for tomatoes, candy-sweet'
  },
  {
    id: 'sweet_100',
    varietyId: 'cherry_tomato_var',
    productId: 'tomato',
    displayName: 'Sweet 100',
    description: 'Red cherry, very sweet, prolific',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'FL', 'TX', 'GA'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 7.0,
    notes: 'Hybrid, indeterminate, produces hundreds per plant'
  },
  {
    id: 'black_cherry',
    varietyId: 'cherry_tomato_var',
    productId: 'tomato',
    displayName: 'Black Cherry',
    description: 'Purple-black cherry, complex flavor',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR', 'WA'],
    peakMonths: [7, 8, 9],
    brixBase: 6.5,
    notes: 'Heirloom, intense flavor, purple anthocyanins'
  },
  {
    id: 'sun_sugar',
    varietyId: 'cherry_tomato_var',
    productId: 'tomato',
    displayName: 'Sun Sugar',
    description: 'Golden orange cherry, ultra-sweet',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'FL'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 8.5,
    notes: 'Japanese hybrid, even sweeter than Sungold'
  },
  {
    id: 'chocolate_cherry',
    varietyId: 'cherry_tomato_var',
    productId: 'tomato',
    displayName: 'Chocolate Cherry',
    description: 'Dark brown cherry, rich flavor',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'TX'],
    peakMonths: [7, 8, 9],
    brixBase: 6.8,
    notes: 'Heirloom, complex smoky-sweet flavor'
  },

  // ROMA/PASTE TOMATO (5)
  {
    id: 'san_marzano_tomato',
    varietyId: 'roma_tomato',
    productId: 'tomato',
    displayName: 'San Marzano',
    description: 'Italian paste tomato, gold standard for sauce',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'FL', 'TX'],
    peakMonths: [7, 8, 9],
    brixBase: 5.5,
    notes: 'Campania Italy, DOP protected, low moisture, sweet'
  },
  {
    id: 'roma_vf',
    varietyId: 'roma_tomato',
    productId: 'tomato',
    displayName: 'Roma VF',
    description: 'Disease-resistant Roma, commercial standard',
    validatedStates: ['CA', 'FL', 'TX', 'GA'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 4.5,
    notes: 'Modern Roma, verticillium/fusarium resistant'
  },
  {
    id: 'amish_paste',
    varietyId: 'roma_tomato',
    productId: 'tomato',
    displayName: 'Amish Paste',
    description: 'Large paste tomato, heirloom, sweet',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['PA', 'OH', 'WI'],
    peakMonths: [7, 8, 9],
    brixBase: 5.2,
    notes: 'Amish heirloom, larger than Roma, excellent sauce'
  },
  {
    id: 'juliet',
    varietyId: 'roma_tomato',
    productId: 'tomato',
    displayName: 'Juliet',
    description: 'Grape-shaped, sweet, crack-resistant',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA', 'FL', 'TX'],
    peakMonths: [6, 7, 8, 9],
    brixBase: 6.0,
    notes: 'AAS winner, hybrid, mini-Roma shape'
  },
  {
    id: 'opalka',
    varietyId: 'roma_tomato',
    productId: 'tomato',
    displayName: 'Opalka',
    description: 'Polish paste, banana-shaped, meaty',
    heritageIntent: 'true_heritage',
    validatedStates: ['NY', 'PA', 'MI'],
    peakMonths: [7, 8, 9],
    brixBase: 5.0,
    notes: 'Polish heirloom, elongated, dry flesh for paste'
  },

  // HEIRLOOM TOMATO (5)
  {
    id: 'black_krim',
    varietyId: 'heirloom_tomato',
    productId: 'tomato',
    displayName: 'Black Krim',
    description: 'Dark purple-brown, salty-sweet, Crimean',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'OR', 'WA'],
    peakMonths: [7, 8, 9],
    brixBase: 5.8,
    notes: 'Crimea/Black Sea, intense complex flavor'
  },
  {
    id: 'green_zebra',
    varietyId: 'heirloom_tomato',
    productId: 'tomato',
    displayName: 'Green Zebra',
    description: 'Green with yellow stripes, tangy-sweet',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR'],
    peakMonths: [7, 8, 9],
    brixBase: 5.5,
    notes: '1983 Tom Wagner, stays green when ripe, citrus notes'
  },
  {
    id: 'striped_german',
    varietyId: 'heirloom_tomato',
    productId: 'tomato',
    displayName: 'Striped German',
    description: 'Red/yellow marbled, very sweet, large',
    heritageIntent: 'true_heritage',
    validatedStates: ['VA', 'NC', 'TN'],
    peakMonths: [7, 8, 9],
    brixBase: 6.0,
    notes: 'German heritage via Virginia, beautiful interior, fruity-sweet'
  },
  {
    id: 'aunt_ruby_german_green',
    varietyId: 'heirloom_tomato',
    productId: 'tomato',
    displayName: "Aunt Ruby's German Green",
    description: 'Large green beefsteak, sweet when ripe',
    heritageIntent: 'true_heritage',
    validatedStates: ['TN', 'KY'],
    peakMonths: [7, 8, 9],
    brixBase: 5.5,
    notes: 'German heritage via Tennessee, lime-green when ripe, very sweet'
  },
  {
    id: 'pineapple_tomato',
    varietyId: 'heirloom_tomato',
    productId: 'tomato',
    displayName: 'Pineapple',
    description: 'Red/yellow bicolor, large, fruity',
    heritageIntent: 'true_heritage',
    validatedStates: ['KY', 'OH', 'IL'],
    peakMonths: [7, 8, 9],
    brixBase: 5.8,
    notes: 'Kentucky heirloom, can exceed 2 lbs, tropical fruit notes'
  },

  // POTATOES - 5 varieties defined above, need cultivars for each

  // CARROTS - 2 varieties defined above

  // LETTUCE - 3 varieties defined above

  // ONIONS - 2 varieties defined above

  // RUSSET POTATO (5)
  {
    id: 'russet_burbank',
    varietyId: 'russet_potato',
    productId: 'potato',
    displayName: 'Russet Burbank',
    description: 'Classic Idaho baker, commercial standard',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['ID', 'WA', 'OR', 'CO', 'ME'],
    peakMonths: [8, 9, 10],
    notes: 'Luther Burbank 1876, 95% of French fries, high starch'
  },
  {
    id: 'russet_norkotah',
    varietyId: 'russet_potato',
    productId: 'potato',
    displayName: 'Russet Norkotah',
    description: 'Early russet, smooth skin, all-purpose',
    validatedStates: ['ND', 'MN', 'ID', 'WA'],
    peakMonths: [8, 9],
    notes: 'North Dakota, earlier than Burbank, smooth skin'
  },
  {
    id: 'umatilla_russet',
    varietyId: 'russet_potato',
    productId: 'potato',
    displayName: 'Umatilla Russet',
    description: 'High yield, baking quality',
    validatedStates: ['OR', 'ID', 'WA'],
    peakMonths: [9, 10],
    notes: 'Oregon, similar to Burbank, higher yield'
  },
  {
    id: 'ranger_russet',
    varietyId: 'russet_potato',
    productId: 'potato',
    displayName: 'Ranger Russet',
    description: 'Scab resistant, processing potato',
    validatedStates: ['ID', 'WA', 'OR'],
    peakMonths: [9, 10],
    notes: 'Texas A&M/Colorado State, disease resistant'
  },
  {
    id: 'canela_russet',
    varietyId: 'russet_potato',
    productId: 'potato',
    displayName: 'Canela Russet',
    description: 'Cinnamon skin, baking russet',
    validatedStates: ['CO', 'ID'],
    peakMonths: [9, 10],
    notes: 'Colorado bred, unique cinnamon-russet skin'
  },

  // YELLOW POTATO (5)
  {
    id: 'yukon_gold_potato',
    varietyId: 'yellow_potato',
    productId: 'potato',
    displayName: 'Yukon Gold',
    description: 'Golden flesh, buttery, all-purpose favorite',
    heritageIntent: 'modern_flavor',
    validatedStates: ['ME', 'WI', 'MI', 'NY', 'ID'],
    peakMonths: [8, 9, 10],
    notes: 'Canada 1980s, most popular yellow potato'
  },
  {
    id: 'yellow_finn',
    varietyId: 'yellow_potato',
    productId: 'potato',
    displayName: 'Yellow Finn',
    description: 'Deep yellow, buttery, Finnish heritage',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['WA', 'OR', 'CA'],
    peakMonths: [8, 9],
    notes: 'Finnish heritage, rich flavor, waxy texture'
  },
  {
    id: 'german_butterball',
    varietyId: 'yellow_potato',
    productId: 'potato',
    displayName: 'German Butterball',
    description: 'Golden, very buttery, round',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['ME', 'WI', 'MI'],
    peakMonths: [8, 9, 10],
    notes: 'German heirloom, exceptional buttery flavor'
  },
  {
    id: 'carola',
    varietyId: 'yellow_potato',
    productId: 'potato',
    displayName: 'Carola',
    description: 'German yellow, smooth, excellent flavor',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['NY', 'ME'],
    peakMonths: [8, 9],
    notes: 'German variety, gourmet market'
  },
  {
    id: 'bintje',
    varietyId: 'yellow_potato',
    productId: 'potato',
    displayName: 'Bintje',
    description: 'Dutch yellow, European favorite',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['WA', 'OR'],
    peakMonths: [8, 9],
    notes: 'Netherlands 1910, European standard for frites'
  },

  // RED POTATO (5)
  {
    id: 'red_pontiac',
    varietyId: 'red_potato',
    productId: 'potato',
    displayName: 'Red Pontiac',
    description: 'Round red, waxy, holds shape',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['FL', 'ME', 'WI', 'CA'],
    peakMonths: [6, 7, 8, 9],
    notes: 'USDA 1938, most popular red potato'
  },
  {
    id: 'red_lasoda',
    varietyId: 'red_potato',
    productId: 'potato',
    displayName: 'Red LaSoda',
    description: 'Southern red, heat-tolerant',
    validatedStates: ['FL', 'TX', 'LA'],
    peakMonths: [5, 6, 7],
    notes: 'Louisiana State, heat-tolerant, Southern favorite'
  },
  {
    id: 'norland',
    varietyId: 'red_potato',
    productId: 'potato',
    displayName: 'Norland',
    description: 'Early red, smooth, northern climates',
    validatedStates: ['ME', 'ND', 'MN', 'WI'],
    peakMonths: [7, 8],
    notes: 'North Dakota, early season, cold climate'
  },
  {
    id: 'red_bliss',
    varietyId: 'red_potato',
    productId: 'potato',
    displayName: 'Red Bliss',
    description: 'Small to medium red, thin skin, waxy',
    validatedStates: ['ME', 'FL', 'CA'],
    peakMonths: [6, 7, 8],
    notes: 'Generic name for small red potatoes, multiple varieties'
  },
  {
    id: 'mountain_rose',
    varietyId: 'red_potato',
    productId: 'potato',
    displayName: 'Mountain Rose',
    description: 'Red skin and pink flesh, novelty',
    validatedStates: ['CO', 'ID'],
    peakMonths: [8, 9],
    notes: 'Colorado State, pink interior, specialty market'
  },

  // FINGERLING POTATO (5)
  {
    id: 'russian_banana',
    varietyId: 'fingerling_potato',
    productId: 'potato',
    displayName: 'Russian Banana',
    description: 'Yellow fingerling, waxy, rich flavor',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['WA', 'OR', 'CA'],
    peakMonths: [8, 9],
    notes: 'Baltic heritage, crescent-shaped, exceptional flavor'
  },
  {
    id: 'french_fingerling',
    varietyId: 'fingerling_potato',
    productId: 'potato',
    displayName: 'French Fingerling',
    description: 'Red skin, yellow flesh, nutty',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA', 'OR', 'WA'],
    peakMonths: [8, 9],
    notes: 'French heirloom, gourmet standard'
  },
  {
    id: 'rose_finn_apple',
    varietyId: 'fingerling_potato',
    productId: 'potato',
    displayName: 'Rose Finn Apple',
    description: 'Pink skin, yellow flesh, waxy',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['WA', 'OR'],
    peakMonths: [8, 9],
    notes: 'European heirloom, exceptional waxy texture'
  },
  {
    id: 'la_ratte',
    varietyId: 'fingerling_potato',
    productId: 'potato',
    displayName: 'La Ratte',
    description: 'French gourmet, chestnut flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'OR'],
    peakMonths: [8, 9],
    notes: 'France, gourmet standard, chestnut/nutty flavor'
  },
  {
    id: 'purple_peruvian_fingerling',
    varietyId: 'fingerling_potato',
    productId: 'potato',
    displayName: 'Purple Peruvian',
    description: 'Deep purple skin and flesh, nutty',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA', 'OR', 'CO'],
    peakMonths: [8, 9],
    notes: 'Peruvian Andes heritage, purple anthocyanins'
  },

  // PURPLE POTATO (5)
  {
    id: 'purple_majesty',
    varietyId: 'purple_potato',
    productId: 'potato',
    displayName: 'Purple Majesty',
    description: 'Deep purple throughout, high anthocyanins',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CO', 'ID', 'WA'],
    peakMonths: [8, 9, 10],
    notes: 'Colorado State, high antioxidants, stays purple when cooked'
  },
  {
    id: 'all_blue',
    varietyId: 'purple_potato',
    productId: 'potato',
    displayName: 'All Blue',
    description: 'Blue-purple skin and flesh, South American',
    heritageIntent: 'true_heritage',
    validatedStates: ['CO', 'OR', 'CA'],
    peakMonths: [8, 9],
    notes: 'South American heritage, striking blue color'
  },
  {
    id: 'adirondack_blue',
    varietyId: 'purple_potato',
    productId: 'potato',
    displayName: 'Adirondack Blue',
    description: 'Purple skin and flesh, nutty flavor',
    heritageIntent: 'modern_flavor',
    validatedStates: ['NY', 'ME', 'VT'],
    peakMonths: [8, 9],
    notes: 'Cornell breeding, high anthocyanins'
  },
  {
    id: 'purple_viking',
    varietyId: 'purple_potato',
    productId: 'potato',
    displayName: 'Purple Viking',
    description: 'Purple skin, white flesh with purple, early',
    validatedStates: ['ND', 'MN', 'WI'],
    peakMonths: [7, 8],
    notes: 'North Dakota, early season, cold climate'
  },
  {
    id: 'purple_passion',
    varietyId: 'purple_potato',
    productId: 'potato',
    displayName: 'Purple Passion',
    description: 'Dark purple, fingerling shape',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CO', 'CA'],
    peakMonths: [8, 9],
    notes: 'Modern specialty variety, intense purple'
  }
]

// ========================================================================
// NUT VARIETIES
// ========================================================================

const NUT_VARIETIES: Variety[] = [
  { id: 'southern_pecan', productId: 'pecan', displayName: 'Southern Pecan', description: 'Classic large paper-shell pecans' },
  { id: 'native_pecan', productId: 'pecan', displayName: 'Native Pecan', description: 'Wild and seedling pecans' },

  { id: 'english_walnut', productId: 'walnut', displayName: 'English Walnut', description: 'Persian walnut, thin-shelled' },
  { id: 'black_walnut', productId: 'walnut', displayName: 'Black Walnut', description: 'Native American, thick-shelled, intense flavor' },

  { id: 'california_almond', productId: 'almond', displayName: 'California Almond', description: 'Commercial almonds, various types' },

  { id: 'european_hazelnut', productId: 'hazelnut', displayName: 'European Hazelnut', description: 'Commercial hazelnuts' },

  { id: 'california_pistachio', productId: 'pistachio', displayName: 'California Pistachio', description: 'Kerman and modern varieties' },
]

const NUT_CULTIVARS: Cultivar[] = [
  // SOUTHERN PECAN (6)
  {
    id: 'desirable',
    varietyId: 'southern_pecan',
    productId: 'pecan',
    displayName: 'Desirable',
    description: 'Large, excellent quality, commercial standard',
    heritageIntent: 'modern_flavor',
    validatedStates: ['GA', 'AL', 'FL', 'TX'],
    peakMonths: [10, 11],
    notes: 'Most widely planted, 1955 USDA release, excellent kernel'
  },
  {
    id: 'stuart',
    varietyId: 'southern_pecan',
    productId: 'pecan',
    displayName: 'Stuart',
    description: 'Large, thin shell, old commercial variety',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['MS', 'LA', 'TX', 'FL'],
    peakMonths: [10, 11],
    notes: 'Pre-1900, Mississippi, commercial standard for decades'
  },
  {
    id: 'elliott',
    varietyId: 'southern_pecan',
    productId: 'pecan',
    displayName: 'Elliott',
    description: 'Small, very sweet, excellent quality',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['FL', 'GA', 'AL'],
    peakMonths: [11, 12],
    notes: 'Florida, late harvest, scab resistant, small but flavorful'
  },
  {
    id: 'pawnee',
    varietyId: 'southern_pecan',
    productId: 'pecan',
    displayName: 'Pawnee',
    description: 'Early harvest, medium size, excellent quality',
    heritageIntent: 'modern_flavor',
    validatedStates: ['TX', 'OK', 'KS'],
    peakMonths: [9, 10],
    notes: 'USDA 1963, earliest commercial variety'
  },
  {
    id: 'cape_fear',
    varietyId: 'southern_pecan',
    productId: 'pecan',
    displayName: 'Cape Fear',
    description: 'Disease resistant, good quality, reliable',
    validatedStates: ['NC', 'SC', 'GA'],
    peakMonths: [10, 11],
    notes: 'North Carolina State, scab resistant, eastern climate'
  },
  {
    id: 'kiowa',
    varietyId: 'southern_pecan',
    productId: 'pecan',
    displayName: 'Kiowa',
    description: 'Very large nuts, excellent quality',
    heritageIntent: 'modern_flavor',
    validatedStates: ['OK', 'TX', 'KS'],
    peakMonths: [10, 11],
    notes: 'USDA 1976, largest pecan variety'
  },

  // NATIVE PECAN (5)
  {
    id: 'texas_native',
    varietyId: 'native_pecan',
    productId: 'pecan',
    displayName: 'Texas Native',
    description: 'Wild seedling pecans, variable',
    heritageIntent: 'true_heritage',
    validatedStates: ['TX', 'OK'],
    peakMonths: [10, 11, 12],
    notes: 'Native riparian pecans, genetic diversity'
  },
  {
    id: 'kanza',
    varietyId: 'native_pecan',
    productId: 'pecan',
    displayName: 'Kanza',
    description: 'Native selection, consistent, cold-hardy',
    heritageIntent: 'modern_flavor',
    validatedStates: ['KS', 'MO', 'OK'],
    peakMonths: [10, 11],
    notes: 'Kansas native selection, northern adaptation'
  },
  {
    id: 'mohawk',
    varietyId: 'native_pecan',
    productId: 'pecan',
    displayName: 'Mohawk',
    description: 'Northern native, hardy',
    validatedStates: ['KS', 'MO', 'IL'],
    peakMonths: [10, 11],
    notes: 'USDA, northern climate adaptation'
  },
  {
    id: 'lakota',
    varietyId: 'native_pecan',
    productId: 'pecan',
    displayName: 'Lakota',
    description: 'Native selection, good kernel',
    validatedStates: ['KS', 'OK'],
    peakMonths: [10, 11],
    notes: 'Native pecan breeding program'
  },
  {
    id: 'osage',
    varietyId: 'native_pecan',
    productId: 'pecan',
    displayName: 'Osage',
    description: 'Native selection, cold-hardy',
    validatedStates: ['KS', 'MO'],
    peakMonths: [10, 11],
    notes: 'Native breeding, northern climates'
  },

  // ENGLISH WALNUT (5)
  {
    id: 'chandler',
    varietyId: 'english_walnut',
    productId: 'walnut',
    displayName: 'Chandler',
    description: 'Light kernel, large, commercial standard',
    heritageIntent: 'modern_flavor',
    validatedStates: ['CA'],
    peakMonths: [9, 10],
    notes: 'UC Davis 1979, 50%+ of California production'
  },
  {
    id: 'hartley',
    varietyId: 'english_walnut',
    productId: 'walnut',
    displayName: 'Hartley',
    description: 'Old California standard, reliable',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA'],
    peakMonths: [9, 10],
    notes: 'California, decades of production history'
  },
  {
    id: 'howard',
    varietyId: 'english_walnut',
    productId: 'walnut',
    displayName: 'Howard',
    description: 'Light kernel, good quality',
    validatedStates: ['CA'],
    peakMonths: [9, 10],
    notes: 'UC Davis, commercial variety'
  },
  {
    id: 'tulare',
    varietyId: 'english_walnut',
    productId: 'walnut',
    displayName: 'Tulare',
    description: 'Large, light kernel, early harvest',
    validatedStates: ['CA'],
    peakMonths: [9],
    notes: 'UC Davis, early variety'
  },
  {
    id: 'franquette',
    varietyId: 'english_walnut',
    productId: 'walnut',
    displayName: 'Franquette',
    description: 'French walnut, cold-hardy, rich flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['OR', 'WA', 'CA'],
    peakMonths: [10, 11],
    notes: 'French heritage, late harvest, northern climates'
  },

  // BLACK WALNUT (5)
  {
    id: 'thomas_black',
    varietyId: 'black_walnut',
    productId: 'walnut',
    displayName: 'Thomas',
    description: 'Improved black walnut, thinner shell',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['PA', 'OH', 'IN', 'IL'],
    peakMonths: [9, 10],
    notes: 'Pennsylvania, easier to crack than wild'
  },
  {
    id: 'emma_k',
    varietyId: 'black_walnut',
    productId: 'walnut',
    displayName: 'Emma K',
    description: 'Large kernel, quality meat',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['IN', 'OH'],
    peakMonths: [9, 10],
    notes: 'Indiana selection, named variety'
  },
  {
    id: 'ohio_native_black',
    varietyId: 'black_walnut',
    productId: 'walnut',
    displayName: 'Ohio Native',
    description: 'Wild black walnut, intense flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['OH', 'IN', 'IL', 'MO'],
    peakMonths: [9, 10, 11],
    notes: 'Native Appalachian, wild harvest, variable quality'
  },
  {
    id: 'kwik_krop',
    varietyId: 'black_walnut',
    productId: 'walnut',
    displayName: 'Kwik Krop',
    description: 'Early bearing, productive',
    validatedStates: ['IA', 'IL', 'MO'],
    peakMonths: [9, 10],
    notes: 'Iowa selection, early production'
  },
  {
    id: 'sparrow',
    varietyId: 'black_walnut',
    productId: 'walnut',
    displayName: 'Sparrow',
    description: 'Thin shell for black walnut',
    validatedStates: ['MO', 'IL'],
    peakMonths: [9, 10],
    notes: 'Missouri, thinner shell, easier cracking'
  },

  // CALIFORNIA ALMOND (5)
  {
    id: 'nonpareil',
    varietyId: 'california_almond',
    productId: 'almond',
    displayName: 'Nonpareil',
    description: 'Thin shell, sweet kernel, industry standard',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA'],
    peakMonths: [8, 9],
    notes: 'California standard, 40% of production, excellent quality'
  },
  {
    id: 'carmel',
    varietyId: 'california_almond',
    productId: 'almond',
    displayName: 'Carmel',
    description: 'Medium shell, good quality, pollenizer',
    validatedStates: ['CA'],
    peakMonths: [8, 9],
    notes: 'UC Davis, pollenizes Nonpareil, 2nd most planted'
  },
  {
    id: 'monterey',
    varietyId: 'california_almond',
    productId: 'almond',
    displayName: 'Monterey',
    description: 'Similar to Nonpareil, pollenizer',
    validatedStates: ['CA'],
    peakMonths: [8, 9],
    notes: 'UC Davis, pollenizes Nonpareil'
  },
  {
    id: 'butte',
    varietyId: 'california_almond',
    productId: 'almond',
    displayName: 'Butte',
    description: 'Medium soft shell, pollenizer',
    validatedStates: ['CA'],
    peakMonths: [8, 9],
    notes: 'UC Davis, 3rd most planted'
  },
  {
    id: 'mission',
    varietyId: 'california_almond',
    productId: 'almond',
    displayName: 'Mission',
    description: 'Hard shell, late bloom, heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['CA'],
    peakMonths: [9, 10],
    notes: 'Spanish mission heritage, hardiest variety'
  },

  // EUROPEAN HAZELNUT (5)
  {
    id: 'barcelona',
    varietyId: 'european_hazelnut',
    productId: 'hazelnut',
    displayName: 'Barcelona',
    description: 'Large, round, commercial standard',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['OR', 'WA'],
    peakMonths: [9, 10],
    notes: 'Spain origin, Oregon standard, 60%+ of production'
  },
  {
    id: 'ennis',
    varietyId: 'european_hazelnut',
    productId: 'hazelnut',
    displayName: 'Ennis',
    description: 'Very large, high quality',
    validatedStates: ['OR', 'WA'],
    peakMonths: [9, 10],
    notes: 'Oregon, large kernel, excellent flavor'
  },
  {
    id: 'jefferson',
    varietyId: 'european_hazelnut',
    productId: 'hazelnut',
    displayName: 'Jefferson',
    description: 'Disease resistant, large, high quality',
    heritageIntent: 'modern_flavor',
    validatedStates: ['OR', 'WA'],
    peakMonths: [9, 10],
    notes: 'OSU, blight resistant, modern breeding'
  },
  {
    id: 'yamhill',
    varietyId: 'european_hazelnut',
    productId: 'hazelnut',
    displayName: 'Yamhill',
    description: 'Round kernel, disease resistant',
    heritageIntent: 'modern_flavor',
    validatedStates: ['OR', 'WA'],
    peakMonths: [9, 10],
    notes: 'OSU, blight resistant, round shape'
  },
  {
    id: 'lewis',
    varietyId: 'european_hazelnut',
    productId: 'hazelnut',
    displayName: 'Lewis',
    description: 'Long kernel, blight resistant',
    heritageIntent: 'modern_flavor',
    validatedStates: ['OR', 'WA'],
    peakMonths: [9, 10],
    notes: 'OSU, modern variety, disease resistance'
  },

  // CALIFORNIA PISTACHIO (5)
  {
    id: 'kerman',
    varietyId: 'california_pistachio',
    productId: 'pistachio',
    displayName: 'Kerman',
    description: 'California standard, large, excellent quality',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['CA'],
    peakMonths: [9, 10],
    notes: 'Iranian origin, 98% of California production'
  },
  {
    id: 'golden_hills',
    varietyId: 'california_pistachio',
    productId: 'pistachio',
    displayName: 'Golden Hills',
    description: 'Early harvest, lighter color',
    validatedStates: ['CA'],
    peakMonths: [9],
    notes: 'Modern variety, earlier than Kerman'
  },
  {
    id: 'lost_hills',
    varietyId: 'california_pistachio',
    productId: 'pistachio',
    displayName: 'Lost Hills',
    description: 'High yield, good quality',
    validatedStates: ['CA'],
    peakMonths: [9, 10],
    notes: 'Modern variety, commercial production'
  },
  {
    id: 'peters',
    varietyId: 'california_pistachio',
    productId: 'pistachio',
    displayName: 'Peters',
    description: 'Male pollenizer, essential for Kerman',
    validatedStates: ['CA'],
    peakMonths: [9],
    notes: 'Male variety, pollenizes Kerman (95% of orchards)'
  },
  {
    id: 'randy',
    varietyId: 'california_pistachio',
    productId: 'pistachio',
    displayName: 'Randy',
    description: 'Alternative pollenizer',
    validatedStates: ['CA'],
    peakMonths: [9],
    notes: 'Male variety, pollenizer for Kerman'
  }
]

// ========================================================================
// GRAIN VARIETIES
// ========================================================================

const GRAIN_VARIETIES: Variety[] = [
  { id: 'hard_red_wheat', productId: 'wheat', displayName: 'Hard Red Wheat', description: 'High protein, bread wheat' },
  { id: 'soft_white_wheat', productId: 'wheat', displayName: 'Soft White Wheat', description: 'Lower protein, pastry wheat' },
  { id: 'heritage_wheat', productId: 'wheat', displayName: 'Heritage Wheat', description: 'Ancient and landrace wheats' },

  { id: 'common_oat', productId: 'oat', displayName: 'Common Oat', description: 'Rolled oats, oatmeal' },
  { id: 'specialty_oat', productId: 'oat', displayName: 'Specialty Oat', description: 'Hull-less, colored, heritage' },

  { id: 'minnesota_wild_rice', productId: 'wild_rice', displayName: 'Minnesota Wild Rice', description: 'True wild rice, native harvest' },
]

const GRAIN_CULTIVARS: Cultivar[] = [
  // HARD RED WHEAT (5)
  {
    id: 'turkey_red',
    varietyId: 'hard_red_wheat',
    productId: 'wheat',
    displayName: 'Turkey Red',
    description: 'Hard red winter, Mennonite heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['KS', 'OK', 'TX', 'NE'],
    peakMonths: [6, 7],
    notes: 'Russian Mennonite 1874, transformed Kansas, high protein'
  },
  {
    id: 'red_fife',
    varietyId: 'hard_red_wheat',
    productId: 'wheat',
    displayName: 'Red Fife',
    description: 'Canadian heritage, nutty flavor, high protein',
    heritageIntent: 'true_heritage',
    validatedStates: ['MT', 'ND', 'MN'],
    peakMonths: [7, 8],
    notes: 'Ukraine via Canada 1842, artisan bread favorite'
  },
  {
    id: 'marquis',
    varietyId: 'hard_red_wheat',
    productId: 'wheat',
    displayName: 'Marquis',
    description: 'Early maturing, high quality',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['ND', 'MT', 'MN'],
    peakMonths: [7],
    notes: 'Canadian 1903, transformed northern wheat production'
  },
  {
    id: 'jagger',
    varietyId: 'hard_red_wheat',
    productId: 'wheat',
    displayName: 'Jagger',
    description: 'Modern hard red winter, disease resistant',
    validatedStates: ['KS', 'OK', 'TX'],
    peakMonths: [6, 7],
    notes: 'Modern commercial variety, high yield'
  },
  {
    id: 'overland',
    varietyId: 'hard_red_wheat',
    productId: 'wheat',
    displayName: 'Overland',
    description: 'Hard white wheat, modern',
    validatedStates: ['KS', 'CO'],
    peakMonths: [6, 7],
    notes: 'Modern variety, white kernel hard wheat'
  },

  // SOFT WHITE WHEAT (5)
  {
    id: 'stephens',
    varietyId: 'soft_white_wheat',
    productId: 'wheat',
    displayName: 'Stephens',
    description: 'Pacific Northwest soft white standard',
    validatedStates: ['OR', 'WA', 'ID'],
    peakMonths: [7, 8],
    notes: 'Oregon State, PNW standard for decades'
  },
  {
    id: 'madsen',
    varietyId: 'soft_white_wheat',
    productId: 'wheat',
    displayName: 'Madsen',
    description: 'High yield soft white',
    validatedStates: ['OR', 'WA'],
    peakMonths: [7, 8],
    notes: 'Oregon State, replaced Stephens in many areas'
  },
  {
    id: 'eltan',
    varietyId: 'soft_white_wheat',
    productId: 'wheat',
    displayName: 'Eltan',
    description: 'Soft white winter, pastry quality',
    validatedStates: ['WA', 'OR', 'ID'],
    peakMonths: [7, 8],
    notes: 'WSU, excellent pastry quality'
  },
  {
    id: 'tubbs',
    varietyId: 'soft_white_wheat',
    productId: 'wheat',
    displayName: 'Tubbs',
    description: 'Club wheat, ultra-soft',
    validatedStates: ['WA', 'OR'],
    peakMonths: [7, 8],
    notes: 'Club wheat type, specialty cakes/pastries'
  },
  {
    id: 'goetze',
    varietyId: 'soft_white_wheat',
    productId: 'wheat',
    displayName: 'Goetze',
    description: 'Modern soft white',
    validatedStates: ['OR', 'WA'],
    peakMonths: [7, 8],
    notes: 'Modern variety, disease resistant'
  },

  // HERITAGE WHEAT (6)
  {
    id: 'einkorn',
    varietyId: 'heritage_wheat',
    productId: 'wheat',
    displayName: 'Einkorn',
    description: 'Ancient diploid wheat, earliest cultivated',
    heritageIntent: 'true_heritage',
    validatedStates: ['MT', 'ID'],
    peakMonths: [7, 8],
    notes: '10,000 years old, diploid genetics, lower gluten'
  },
  {
    id: 'emmer',
    varietyId: 'heritage_wheat',
    productId: 'wheat',
    displayName: 'Emmer (Farro)',
    description: 'Ancient tetraploid, nutty flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['MT', 'ID', 'OR'],
    peakMonths: [7, 8],
    notes: 'Ancient Mesopotamia, Italian farro, nutty flavor'
  },
  {
    id: 'spelt',
    varietyId: 'heritage_wheat',
    productId: 'wheat',
    displayName: 'Spelt',
    description: 'Ancient hulled wheat, European heritage',
    heritageIntent: 'true_heritage',
    validatedStates: ['OR', 'WA', 'OH'],
    peakMonths: [7, 8],
    notes: 'Ancient Europe, hulled, nutty flavor, artisan bread'
  },
  {
    id: 'khorasan',
    varietyId: 'heritage_wheat',
    productId: 'wheat',
    displayName: 'Khorasan (Kamut)',
    description: 'Ancient large-kernel wheat',
    heritageIntent: 'true_heritage',
    validatedStates: ['MT', 'ND'],
    peakMonths: [7, 8],
    notes: 'Ancient Egypt/Persia, Kamut® trademark, large kernels, buttery'
  },
  {
    id: 'polish_wheat',
    varietyId: 'heritage_wheat',
    productId: 'wheat',
    displayName: 'Polish Wheat',
    description: 'Ancient wheat, very long kernels',
    heritageIntent: 'true_heritage',
    validatedStates: ['MT', 'ID'],
    peakMonths: [7, 8],
    notes: 'Ancient, not from Poland, Mediterranean origin'
  },
  {
    id: 'rouge_de_bordeaux',
    varietyId: 'heritage_wheat',
    productId: 'wheat',
    displayName: 'Rouge de Bordeaux',
    description: 'French heritage, red wheat',
    heritageIntent: 'true_heritage',
    validatedStates: ['OR', 'WA'],
    peakMonths: [7, 8],
    notes: 'French landrace, artisan bread, complex flavor'
  },

  // COMMON OAT (5)
  {
    id: 'ogle',
    varietyId: 'common_oat',
    productId: 'oat',
    displayName: 'Ogle',
    description: 'White oat, commercial standard',
    validatedStates: ['IA', 'IL', 'WI', 'MN'],
    peakMonths: [7, 8],
    notes: 'Illinois, commercial oatmeal variety'
  },
  {
    id: 'jim',
    varietyId: 'common_oat',
    productId: 'oat',
    displayName: 'Jim',
    description: 'High yield, disease resistant',
    validatedStates: ['SD', 'ND', 'MN'],
    peakMonths: [7, 8],
    notes: 'South Dakota State, commercial variety'
  },
  {
    id: 'prairie',
    varietyId: 'common_oat',
    productId: 'oat',
    displayName: 'Prairie',
    description: 'Northern adaptation, reliable',
    validatedStates: ['ND', 'MN', 'WI'],
    peakMonths: [7, 8],
    notes: 'Northern plains variety'
  },
  {
    id: 'souris',
    varietyId: 'common_oat',
    productId: 'oat',
    displayName: 'Souris',
    description: 'Canadian variety, cold-hardy',
    validatedStates: ['ND', 'MN', 'MT'],
    peakMonths: [7, 8],
    notes: 'Canadian breeding, northern climates'
  },
  {
    id: 'armor',
    varietyId: 'common_oat',
    productId: 'oat',
    displayName: 'Armor',
    description: 'Disease resistant, commercial',
    validatedStates: ['IA', 'IL', 'WI'],
    peakMonths: [7, 8],
    notes: 'Modern commercial variety'
  },

  // SPECIALTY OAT (5)
  {
    id: 'hull_less_oat',
    varietyId: 'specialty_oat',
    productId: 'oat',
    displayName: 'Hull-less Oat',
    description: 'No hull, easier processing, groats',
    validatedStates: ['MT', 'ND', 'SD'],
    peakMonths: [7, 8],
    notes: 'Genetic mutation, hull-less, specialty market'
  },
  {
    id: 'black_oat',
    varietyId: 'specialty_oat',
    productId: 'oat',
    displayName: 'Black Oat',
    description: 'Black kernel, high anthocyanins',
    heritageIntent: 'heirloom_quality',
    validatedStates: ['MT', 'WI'],
    peakMonths: [7, 8],
    notes: 'Heritage variety, purple-black, antioxidants'
  },
  {
    id: 'paul_oat',
    varietyId: 'specialty_oat',
    productId: 'oat',
    displayName: 'Paul',
    description: 'Specialty naked oat',
    validatedStates: ['ND', 'MT'],
    peakMonths: [7, 8],
    notes: 'Hull-less specialty variety'
  },
  {
    id: 'streaker',
    varietyId: 'specialty_oat',
    productId: 'oat',
    displayName: 'Streaker',
    description: 'Hull-less, high protein',
    validatedStates: ['ND', 'SD'],
    peakMonths: [7, 8],
    notes: 'Modern hull-less, specialty market'
  },
  {
    id: 'certified_organic_oat',
    varietyId: 'specialty_oat',
    productId: 'oat',
    displayName: 'Certified Organic Varieties',
    description: 'Various varieties grown organically',
    validatedStates: ['WI', 'MN', 'MT'],
    peakMonths: [7, 8],
    notes: 'Multiple varieties, organic certification focus'
  },

  // MINNESOTA WILD RICE (5)
  {
    id: 'hand_harvested_manoomin',
    varietyId: 'minnesota_wild_rice',
    productId: 'wild_rice',
    displayName: 'Hand-Harvested Manoomin',
    description: 'Traditional Ojibwe harvest, true wild',
    heritageIntent: 'true_heritage',
    validatedStates: ['MN', 'WI', 'MI'],
    peakMonths: [8, 9],
    notes: 'Native harvest from canoes, Ojibwe sacred food, most authentic'
  },
  {
    id: 'lake_wild_rice',
    varietyId: 'minnesota_wild_rice',
    productId: 'wild_rice',
    displayName: 'Lake Wild Rice',
    description: 'Wild from natural lakes, mechanically harvested',
    heritageIntent: 'true_heritage',
    validatedStates: ['MN', 'WI'],
    peakMonths: [8, 9],
    notes: 'Natural lake stands, mechanical harvest vs hand'
  },
  {
    id: 'paddy_cultivated',
    varietyId: 'minnesota_wild_rice',
    productId: 'wild_rice',
    displayName: 'Paddy Cultivated',
    description: 'Farmed wild rice, consistent supply',
    validatedStates: ['MN', 'CA'],
    peakMonths: [9, 10],
    notes: 'Cultivated in paddies, less intense flavor than wild'
  },
  {
    id: 'canadian_wild_rice',
    varietyId: 'minnesota_wild_rice',
    productId: 'wild_rice',
    displayName: 'Canadian Wild Rice',
    description: 'Ontario lake harvest',
    heritageIntent: 'true_heritage',
    validatedStates: ['MN'],
    peakMonths: [8, 9],
    notes: 'Ontario lakes, wild harvest, imported to US'
  },
  {
    id: 'black_wild_rice',
    varietyId: 'minnesota_wild_rice',
    productId: 'wild_rice',
    displayName: 'Black Wild Rice',
    description: 'Darkest variety, intense flavor',
    heritageIntent: 'true_heritage',
    validatedStates: ['MN', 'WI'],
    peakMonths: [9],
    notes: 'Specialty, darkest kernels, strongest flavor'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD VEGETABLES, NUTS, AND GRAINS')
  console.log('='.repeat(80))
  console.log()

  const allVarieties = [...VEGETABLE_VARIETIES, ...NUT_VARIETIES, ...GRAIN_VARIETIES]
  const allCultivars = [...VEGETABLE_CULTIVARS, ...NUT_CULTIVARS, ...GRAIN_CULTIVARS]

  console.log(`Total Varieties: ${allVarieties.length}`)
  console.log(`  - Vegetables: ${VEGETABLE_VARIETIES.length}`)
  console.log(`  - Nuts: ${NUT_VARIETIES.length}`)
  console.log(`  - Grains: ${GRAIN_VARIETIES.length}`)
  console.log()
  console.log(`Total Cultivars: ${allCultivars.length}`)
  console.log(`  - Vegetables: ${VEGETABLE_CULTIVARS.length}`)
  console.log(`  - Nuts: ${NUT_CULTIVARS.length}`)
  console.log(`  - Grains: ${GRAIN_CULTIVARS.length}`)
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
    if (varietiesCreated % 10 === 0) {
      console.log(`  ✓ Created ${varietiesCreated}/${allVarieties.length} varieties...`)
    }
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

      cultivarsCreated++
      if (cultivarsCreated % 20 === 0) {
        console.log(`  ✓ Created ${cultivarsCreated}/${allCultivars.length} cultivars...`)
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

  const categories = [
    { varieties: VEGETABLE_VARIETIES, name: 'VEGETABLES' },
    { varieties: NUT_VARIETIES, name: 'NUTS' },
    { varieties: GRAIN_VARIETIES, name: 'GRAINS' }
  ]

  for (const category of categories) {
    console.log(`${category.name}:`)
    console.log('-'.repeat(80))

    for (const variety of category.varieties) {
      const count = await runWriteTransaction<{ count: number }>(`
        MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: $varietyId})
        RETURN count(c) as count
      `, { varietyId: variety.id })

      const status = Number(count[0].count) >= 5 ? '✅' : '⚠️'
      console.log(`  ${status} ${variety.displayName}: ${count[0].count} cultivars`)
    }
    console.log()
  }

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
