#!/usr/bin/env tsx

/**
 * Load Eggs, Pork, Lamb, and Chicken (Meat) Varieties and Breeds
 *
 * Creates complete taxonomy for these livestock products
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
  omegaBaseline?: string
  notes?: string
}

// ========================================================================
// EGG VARIETIES (Chicken Breed Families for Laying)
// ========================================================================

const EGG_VARIETIES: Variety[] = [
  {
    id: 'brown_egg_layers',
    productId: 'eggs',
    displayName: 'Brown Egg Layers',
    description: 'Breeds that lay brown eggs, typically heritage or dual-purpose'
  },
  {
    id: 'white_egg_layers',
    productId: 'eggs',
    displayName: 'White Egg Layers',
    description: 'Commercial white egg breeds, high production'
  },
  {
    id: 'heritage_layers',
    productId: 'eggs',
    displayName: 'Heritage Layers',
    description: 'Traditional American breeds, dual-purpose, slower maturity'
  },
  {
    id: 'blue_green_egg',
    productId: 'eggs',
    displayName: 'Blue/Green Egg Layers',
    description: 'Breeds laying blue, green, or olive eggs'
  },
  {
    id: 'specialty_layers',
    productId: 'eggs',
    displayName: 'Specialty Layers',
    description: 'Dark chocolate eggs, speckled, or unique shell colors'
  }
]

const EGG_CULTIVARS: Cultivar[] = [
  // BROWN EGG LAYERS (6 cultivars)
  {
    id: 'rhode_island_red_layer',
    varietyId: 'brown_egg_layers',
    productId: 'eggs',
    displayName: 'Rhode Island Red',
    description: 'Heritage dual-purpose, brown eggs, excellent layers',
    heritageIntent: 'true_heritage',
    notes: 'Rhode Island, 1890s, American classic, 250+ eggs/year'
  },
  {
    id: 'plymouth_rock',
    varietyId: 'brown_egg_layers',
    productId: 'eggs',
    displayName: 'Plymouth Rock (Barred Rock)',
    description: 'Black and white barred, dual-purpose, brown eggs',
    heritageIntent: 'true_heritage',
    notes: 'Massachusetts 1869, cold-hardy, 200+ eggs/year'
  },
  {
    id: 'sex_link_red',
    varietyId: 'brown_egg_layers',
    productId: 'eggs',
    displayName: 'Red Sex Link',
    description: 'Hybrid layer, brown eggs, very productive',
    heritageIntent: 'modern_flavor',
    notes: 'Commercial hybrid, 280+ eggs/year, chicks sexed by color'
  },
  {
    id: 'isa_brown',
    varietyId: 'brown_egg_layers',
    productId: 'eggs',
    displayName: 'ISA Brown',
    description: 'Commercial brown layer, exceptional production',
    notes: 'Institut de Sélection Animale, France, 300+ eggs/year'
  },
  {
    id: 'golden_comet',
    varietyId: 'brown_egg_layers',
    productId: 'eggs',
    displayName: 'Golden Comet',
    description: 'Red sex link, brown eggs, gentle temperament',
    notes: 'Commercial hybrid, 280+ eggs/year, backyard favorite'
  },
  {
    id: 'new_hampshire_red',
    varietyId: 'brown_egg_layers',
    productId: 'eggs',
    displayName: 'New Hampshire Red',
    description: 'Heritage dual-purpose, brown eggs, earlier maturity than RIR',
    heritageIntent: 'heirloom_quality',
    notes: 'New Hampshire, 1915, RIR descendant, 200+ eggs/year'
  },

  // WHITE EGG LAYERS (5 cultivars)
  {
    id: 'white_leghorn',
    varietyId: 'white_egg_layers',
    productId: 'eggs',
    displayName: 'White Leghorn',
    description: 'Commercial standard, white eggs, exceptional production',
    heritageIntent: 'heirloom_quality',
    notes: 'Italy origin, refined in US, 300+ eggs/year, most commercial eggs'
  },
  {
    id: 'brown_leghorn',
    varietyId: 'white_egg_layers',
    productId: 'eggs',
    displayName: 'Brown Leghorn',
    description: 'Brown plumage, white eggs, high production',
    heritageIntent: 'heirloom_quality',
    notes: 'Italian Leghorn color variant, 280+ eggs/year'
  },
  {
    id: 'california_white',
    varietyId: 'white_egg_layers',
    productId: 'eggs',
    displayName: 'California White',
    description: 'White eggs, calm temperament, productive',
    notes: 'Leghorn hybrid, 300+ eggs/year'
  },
  {
    id: 'ancona',
    varietyId: 'white_egg_layers',
    productId: 'eggs',
    displayName: 'Ancona',
    description: 'Mottled black/white, white eggs, active foragers',
    heritageIntent: 'heirloom_quality',
    notes: 'Italy, 1850s, 200+ eggs/year, cold-hardy'
  },
  {
    id: 'hamburg',
    varietyId: 'white_egg_layers',
    productId: 'eggs',
    displayName: 'Hamburg',
    description: 'White eggs, beautiful plumage, excellent foragers',
    heritageIntent: 'true_heritage',
    notes: 'Germany/Holland, pre-1700s, 200+ eggs/year'
  },

  // HERITAGE LAYERS (6 cultivars)
  {
    id: 'rhode_island_red_heritage',
    varietyId: 'heritage_layers',
    productId: 'eggs',
    displayName: 'Heritage Rhode Island Red',
    description: 'True heritage strain, slower maturing, superior flavor',
    heritageIntent: 'true_heritage',
    notes: 'Original RIR genetics, not production-bred'
  },
  {
    id: 'wyandotte',
    varietyId: 'heritage_layers',
    productId: 'eggs',
    displayName: 'Wyandotte',
    description: 'Brown eggs, cold-hardy, beautiful laced feathers',
    heritageIntent: 'true_heritage',
    notes: 'New York 1870s, multiple color varieties, 200+ eggs/year'
  },
  {
    id: 'orpington',
    varietyId: 'heritage_layers',
    productId: 'eggs',
    displayName: 'Buff Orpington',
    description: 'Golden buff color, gentle, brown eggs, dual-purpose',
    heritageIntent: 'true_heritage',
    notes: 'England 1880s, broody, excellent mothers, 180+ eggs/year'
  },
  {
    id: 'brahma',
    varietyId: 'heritage_layers',
    productId: 'eggs',
    displayName: 'Brahma',
    description: 'Large, feathered feet, brown eggs, gentle giants',
    heritageIntent: 'true_heritage',
    notes: 'Asian origin, 1850s America, 150+ eggs/year, cold-hardy'
  },
  {
    id: 'dominique',
    varietyId: 'heritage_layers',
    productId: 'eggs',
    displayName: 'Dominique',
    description: 'Oldest American breed, brown eggs, barred feathers',
    heritageIntent: 'true_heritage',
    notes: 'Colonial America, first US breed, 230+ eggs/year'
  },
  {
    id: 'australorp',
    varietyId: 'heritage_layers',
    productId: 'eggs',
    displayName: 'Australorp',
    description: 'Black, brown eggs, world record layers',
    heritageIntent: 'heirloom_quality',
    notes: 'Australia 1920s from Orpingtons, 300+ eggs/year record'
  },

  // BLUE/GREEN EGG LAYERS (5 cultivars)
  {
    id: 'ameraucana',
    varietyId: 'blue_green_egg',
    productId: 'eggs',
    displayName: 'Ameraucana',
    description: 'Blue eggs, muffs and beard, cold-hardy',
    heritageIntent: 'modern_flavor',
    notes: 'American from Araucana, 1970s, 200+ blue eggs/year'
  },
  {
    id: 'araucana',
    varietyId: 'blue_green_egg',
    productId: 'eggs',
    displayName: 'Araucana',
    description: 'Blue eggs, rumpless, ear tufts',
    heritageIntent: 'true_heritage',
    notes: 'Chile, indigenous, 180+ blue eggs/year, no tail'
  },
  {
    id: 'easter_egger',
    varietyId: 'blue_green_egg',
    productId: 'eggs',
    displayName: 'Easter Egger',
    description: 'Blue, green, pink, or olive eggs, mixed genetics',
    notes: 'Ameraucana crosses, 200+ eggs/year, rainbow colors'
  },
  {
    id: 'olive_egger',
    varietyId: 'blue_green_egg',
    productId: 'eggs',
    displayName: 'Olive Egger',
    description: 'Olive green eggs, blue gene × dark brown gene',
    notes: 'Ameraucana × Marans cross, 200+ olive eggs/year'
  },
  {
    id: 'cream_legbar',
    varietyId: 'blue_green_egg',
    productId: 'eggs',
    displayName: 'Cream Legbar',
    description: 'Blue eggs, crested, autosexing, productive',
    heritageIntent: 'heirloom_quality',
    notes: 'England 1930s, 200+ blue eggs/year, chicks sexed by color'
  },

  // SPECIALTY LAYERS (5 cultivars)
  {
    id: 'marans',
    varietyId: 'specialty_layers',
    productId: 'eggs',
    displayName: 'Marans (Cuckoo/Black Copper)',
    description: 'Dark chocolate brown eggs, French heritage',
    heritageIntent: 'true_heritage',
    notes: 'France, Marans region, darkest brown eggs, 180+ eggs/year'
  },
  {
    id: 'welsummer',
    varietyId: 'specialty_layers',
    productId: 'eggs',
    displayName: 'Welsummer',
    description: 'Speckled terracotta brown eggs, beautiful birds',
    heritageIntent: 'true_heritage',
    notes: 'Netherlands, 1900s, 180+ eggs/year, roosters are show quality'
  },
  {
    id: 'penedesenca',
    varietyId: 'specialty_layers',
    productId: 'eggs',
    displayName: 'Penedesenca',
    description: 'Very dark brown eggs, Spanish rarity',
    heritageIntent: 'true_heritage',
    notes: 'Catalonia Spain, critically rare, 150+ eggs/year'
  },
  {
    id: 'barnevelder',
    varietyId: 'specialty_layers',
    productId: 'eggs',
    displayName: 'Barnevelder',
    description: 'Dark brown eggs, double-laced feathers, Dutch',
    heritageIntent: 'true_heritage',
    notes: 'Netherlands, 1850s, 180+ eggs/year, beautiful plumage'
  },
  {
    id: 'favaucana',
    varietyId: 'specialty_layers',
    productId: 'eggs',
    displayName: 'Favaucana',
    description: 'Olive eggs, Faverolles × Ameraucana cross',
    notes: 'Modern hybrid, unique olive color, 200+ eggs/year'
  }
]

// ========================================================================
// PORK VARIETIES (Pig Breed Families)
// ========================================================================

const PORK_VARIETIES: Variety[] = [
  {
    id: 'heritage_pork',
    productId: 'pork',
    displayName: 'Heritage Pork',
    description: 'Traditional breeds, slower growing, superior flavor and fat quality'
  },
  {
    id: 'commercial_pork',
    productId: 'pork',
    displayName: 'Commercial Pork',
    description: 'Modern production breeds, fast growing, lean'
  },
  {
    id: 'specialty_pork',
    productId: 'pork',
    displayName: 'Specialty Pork',
    description: 'Unique breeds: Mangalitsa, Ossabaw Island, Red Wattle'
  }
]

const PORK_CULTIVARS: Cultivar[] = [
  // HERITAGE PORK (7 cultivars)
  {
    id: 'berkshire',
    varietyId: 'heritage_pork',
    productId: 'pork',
    displayName: 'Berkshire (Kurobuta)',
    description: 'Black with white points, exceptional marbling and flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '8-12:1 (heritage genetics, better than commercial)',
    notes: 'England 1600s, Japanese "Kurobuta", premium pork, Snake River Farms'
  },
  {
    id: 'duroc',
    varietyId: 'heritage_pork',
    productId: 'pork',
    displayName: 'Duroc',
    description: 'Red, excellent marbling, fast growing heritage',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '10-14:1 (heritage but often grain-finished)',
    notes: 'New York/New Jersey 1800s, prized for flavor'
  },
  {
    id: 'hampshire',
    varietyId: 'heritage_pork',
    productId: 'pork',
    displayName: 'Hampshire',
    description: 'Black with white belt, lean, muscular',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '10-14:1 (lean heritage)',
    notes: 'Kentucky 1800s, excellent hams'
  },
  {
    id: 'tamworth',
    varietyId: 'heritage_pork',
    productId: 'pork',
    displayName: 'Tamworth',
    description: 'Red/ginger, bacon breed, excellent grazers',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (pasture-suitable, leaner)',
    notes: 'England, Tamworth, best bacon breed, grazing specialists'
  },
  {
    id: 'gloucestershire_old_spots',
    varietyId: 'heritage_pork',
    productId: 'pork',
    displayName: 'Gloucestershire Old Spots',
    description: 'White with black spots, orchard pig, sweet pork',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (orchard forage, traditional)',
    notes: 'England, Gloucestershire, "orchard pig", feeds on windfall apples'
  },
  {
    id: 'large_black',
    varietyId: 'heritage_pork',
    productId: 'pork',
    displayName: 'Large Black',
    description: 'Black, lop ears, excellent grazers, hardy',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (pasture breed)',
    notes: 'England, critically rare, superior outdoor breed'
  },
  {
    id: 'hereford_pork',
    varietyId: 'heritage_pork',
    productId: 'pork',
    displayName: 'Hereford',
    description: 'Red with white face/feet, like Hereford cattle',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '8-12:1 (heritage)',
    notes: 'Missouri/Iowa 1920s, docile, efficient grazers'
  },

  // COMMERCIAL PORK (5 cultivars)
  {
    id: 'yorkshire',
    varietyId: 'commercial_pork',
    productId: 'pork',
    displayName: 'Yorkshire (Large White)',
    description: 'White, commercial standard, lean, prolific',
    omegaBaseline: '12-18:1 (commodity grain feeding)',
    notes: 'England, most common commercial breed, 5-6 month finish'
  },
  {
    id: 'landrace',
    varietyId: 'commercial_pork',
    productId: 'pork',
    displayName: 'Landrace',
    description: 'White, lop ears, long bodies, excellent mothers',
    omegaBaseline: '12-18:1 (commercial grain)',
    notes: 'Denmark, maternal line in commercial crosses'
  },
  {
    id: 'pietrain',
    varietyId: 'commercial_pork',
    productId: 'pork',
    displayName: 'Pietrain',
    description: 'White/black spotted, very lean, heavily muscled',
    omegaBaseline: '10-16:1 (extremely lean)',
    notes: 'Belgium, terminal sire for lean carcasses'
  },
  {
    id: 'commercial_cross',
    varietyId: 'commercial_pork',
    productId: 'pork',
    displayName: 'Commercial Cross',
    description: 'Yorkshire×Landrace×Duroc or similar, industry standard',
    omegaBaseline: '12-18:1 (commodity)',
    notes: 'Most US pork, 3-breed terminal cross, 5-6 months'
  },
  {
    id: 'spot',
    varietyId: 'commercial_pork',
    productId: 'pork',
    displayName: 'Spot (Spotted Poland)',
    description: 'White with black spots, lean, fast growing',
    omegaBaseline: '12-16:1 (commercial)',
    notes: 'Indiana 1800s, commercial lines selected for leanness'
  },

  // SPECIALTY PORK (5 cultivars)
  {
    id: 'mangalitsa',
    varietyId: 'specialty_pork',
    productId: 'pork',
    displayName: 'Mangalitsa',
    description: 'Wooly coat, lard-type pig, extreme marbling',
    heritageIntent: 'true_heritage',
    omegaBaseline: '8-14:1 (high fat, better omega than commercial)',
    notes: 'Hungary, curly wool coat, lard pig, 10-12 month finish, gourmet market'
  },
  {
    id: 'ossabaw_island',
    varietyId: 'specialty_pork',
    productId: 'pork',
    displayName: 'Ossabaw Island',
    description: 'Feral Spanish heritage, dark meat, intensely flavored',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (feral foraging genetics)',
    notes: 'Georgia barrier island, 400+ year feral population, critically rare'
  },
  {
    id: 'red_wattle',
    varietyId: 'specialty_pork',
    productId: 'pork',
    displayName: 'Red Wattle',
    description: 'Red, distinctive wattles, excellent grazers',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (pasture breed)',
    notes: 'Origin uncertain, possibly New Caledonia, critically rare, hardwood forest pig'
  },
  {
    id: 'mulefoot',
    varietyId: 'specialty_pork',
    productId: 'pork',
    displayName: 'Mulefoot',
    description: 'Solid hoof (not cloven), black, critically rare',
    heritageIntent: 'true_heritage',
    omegaBaseline: '8-12:1 (heritage)',
    notes: 'American breed, single hoof mutation, critically endangered'
  },
  {
    id: 'guinea_hog',
    varietyId: 'specialty_pork',
    productId: 'pork',
    displayName: 'American Guinea Hog',
    description: 'Small, black, lard type, homestead favorite',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (pasture/forage)',
    notes: 'American South, critically rare, 150-250 lbs, excellent grazers'
  }
]

// ========================================================================
// LAMB VARIETIES (Sheep Breed Families)
// ========================================================================

const LAMB_VARIETIES: Variety[] = [
  {
    id: 'hair_sheep',
    productId: 'lamb',
    displayName: 'Hair Sheep',
    description: 'Naturally shedding, no wool, heat-tolerant, parasite-resistant'
  },
  {
    id: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Heritage Wool Breeds',
    description: 'Traditional dual-purpose breeds, wool and meat'
  },
  {
    id: 'terminal_sire',
    productId: 'lamb',
    displayName: 'Terminal Sire Breeds',
    description: 'Meat-focused breeds, fast growing, muscular'
  },
  {
    id: 'fine_wool',
    productId: 'lamb',
    displayName: 'Fine Wool Breeds',
    description: 'Merino family, exceptional wool, smaller frames'
  }
]

const LAMB_CULTIVARS: Cultivar[] = [
  // HAIR SHEEP (6 cultivars)
  {
    id: 'katahdin',
    varietyId: 'hair_sheep',
    productId: 'lamb',
    displayName: 'Katahdin',
    description: 'White/mixed, American hair sheep, excellent mothers',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '4-8:1 (grass-fed suitable)',
    notes: 'Maine 1950s, most popular hair sheep, low maintenance'
  },
  {
    id: 'dorper',
    varietyId: 'hair_sheep',
    productId: 'lamb',
    displayName: 'Dorper',
    description: 'White body with black head, South African, fast growing',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '5-9:1 (grass-fed typical)',
    notes: 'South Africa 1930s, Dorset×Blackhead Persian, drought-hardy'
  },
  {
    id: 'white_dorper',
    varietyId: 'hair_sheep',
    productId: 'lamb',
    displayName: 'White Dorper',
    description: 'All white, same Dorper genetics',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '5-9:1 (grass-fed)',
    notes: 'White variant of Dorper, heat-tolerant'
  },
  {
    id: 'barbados_blackbelly',
    varietyId: 'hair_sheep',
    productId: 'lamb',
    displayName: 'Barbados Blackbelly',
    description: 'Brown with black belly, Caribbean heritage',
    heritageIntent: 'true_heritage',
    omegaBaseline: '4-8:1 (tropical foraging breed)',
    notes: 'Caribbean, feral ancestry, parasite-resistant, small frame'
  },
  {
    id: 'st_croix',
    varietyId: 'hair_sheep',
    productId: 'lamb',
    displayName: 'St. Croix',
    description: 'White, parasite-resistant, multiple births',
    heritageIntent: 'true_heritage',
    omegaBaseline: '4-8:1 (tropical grass-fed)',
    notes: 'Virgin Islands, heat/parasite resistance, excellent mothers'
  },
  {
    id: 'royal_white',
    varietyId: 'hair_sheep',
    productId: 'lamb',
    displayName: 'Royal White',
    description: 'Large white hair sheep, developed from St. Croix',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '5-9:1 (grass-fed)',
    notes: 'Texas development, larger frame than Caribbean types'
  },

  // HERITAGE WOOL (6 cultivars)
  {
    id: 'southdown',
    varietyId: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Southdown',
    description: 'Compact, fine wool, exceptional meat quality',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (traditional grass-fed)',
    notes: 'England, Sussex Downs, oldest Down breed, gourmet lamb'
  },
  {
    id: 'shropshire',
    varietyId: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Shropshire',
    description: 'Black face, docile, dual-purpose',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (grass-fed heritage)',
    notes: 'England, Shropshire, 1800s, colonial America favorite'
  },
  {
    id: 'jacob',
    varietyId: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Jacob',
    description: 'Multi-horned, spotted, biblical heritage',
    heritageIntent: 'true_heritage',
    omegaBaseline: '5-9:1 (primitive foraging breed)',
    notes: 'Middle East origin, biblical Jacob flock, unique appearance'
  },
  {
    id: 'icelandic',
    varietyId: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Icelandic',
    description: 'Multi-colored, primitive, exceptional flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '4-8:1 (Viking-era genetics, grass-only)',
    notes: 'Iceland, Viking settlement, isolated 1000+ years, purest genetics'
  },
  {
    id: 'navajo_churro',
    varietyId: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Navajo-Churro',
    description: 'Multi-colored, long wool, desert-adapted',
    heritageIntent: 'true_heritage',
    omegaBaseline: '5-9:1 (desert forage)',
    notes: 'Spanish colonial, Navajo Nation, critically rare, 400+ year lineage'
  },
  {
    id: 'shetland',
    varietyId: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Shetland',
    description: 'Small, primitive, fine wool, multiple colors',
    heritageIntent: 'true_heritage',
    omegaBaseline: '4-8:1 (northern European primitive)',
    notes: 'Scotland, Shetland Islands, 1000+ years, small frame'
  },
  {
    id: 'romney',
    varietyId: 'heritage_wool',
    productId: 'lamb',
    displayName: 'Romney',
    description: 'White, dual-purpose, wet climate adapted',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '6-10:1 (traditional)',
    notes: 'England, Romney Marsh, New Zealand popular'
  },

  // TERMINAL SIRE (5 cultivars)
  {
    id: 'suffolk',
    varietyId: 'terminal_sire',
    productId: 'lamb',
    displayName: 'Suffolk',
    description: 'Black face/legs, fast growing, lean meat',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '8-12:1 (commercial feeding)',
    notes: 'England, Suffolk, most popular meat breed, terminal cross sire'
  },
  {
    id: 'hampshire_sheep',
    varietyId: 'terminal_sire',
    productId: 'lamb',
    displayName: 'Hampshire',
    description: 'Black with white band, muscular, quality carcass',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '8-12:1 (commercial)',
    notes: 'England, Hampshire, terminal sire in commercial operations'
  },
  {
    id: 'texel',
    varietyId: 'terminal_sire',
    productId: 'lamb',
    displayName: 'Texel',
    description: 'White, extremely muscular, low fat, Dutch',
    omegaBaseline: '8-14:1 (very lean)',
    notes: 'Netherlands, Texel Island, leanest breed, terminal cross'
  },
  {
    id: 'dorset',
    varietyId: 'terminal_sire',
    productId: 'lamb',
    displayName: 'Dorset',
    description: 'White, year-round breeding, fast growing',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '8-12:1 (commercial)',
    notes: 'England, Dorset, can breed out of season'
  },
  {
    id: 'montadale',
    varietyId: 'terminal_sire',
    productId: 'lamb',
    displayName: 'Montadale',
    description: 'White, dual-purpose, American development',
    omegaBaseline: '8-12:1 (commercial)',
    notes: 'Missouri 1930s, Columbia×Cheviot cross'
  },

  // FINE WOOL (5 cultivars)
  {
    id: 'merino',
    varietyId: 'fine_wool',
    productId: 'lamb',
    displayName: 'Merino',
    description: 'Finest wool in world, smaller meat yield',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (smaller frame)',
    notes: 'Spain, prized for superfine wool, smaller carcass'
  },
  {
    id: 'rambouillet',
    varietyId: 'fine_wool',
    productId: 'lamb',
    displayName: 'Rambouillet',
    description: 'French Merino, larger frame, fine wool',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (fine wool genetics)',
    notes: 'France, from Spanish Merino, western US range sheep'
  },
  {
    id: 'cormo',
    varietyId: 'fine_wool',
    productId: 'lamb',
    displayName: 'Cormo',
    description: 'Australian fine wool, compact, dual-purpose',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '6-10:1',
    notes: 'Australia 1960s, Corriedale×Merino, fine wool + meat'
  },
  {
    id: 'bond',
    varietyId: 'fine_wool',
    productId: 'lamb',
    displayName: 'Bond',
    description: 'Australian fine wool, large frame, both wool and meat',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '6-10:1',
    notes: 'Australia 1950s, Merino-based, larger meat yield than Merino'
  },
  {
    id: 'delaine_merino',
    varietyId: 'fine_wool',
    productId: 'lamb',
    displayName: 'Delaine Merino',
    description: 'American Merino strain, smooth-bodied, fine wool',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '6-10:1',
    notes: 'USA from Spanish Merino, fewer wrinkles, easier to shear'
  }
]

// ========================================================================
// CHICKEN (Meat) VARIETIES
// ========================================================================

const CHICKEN_VARIETIES: Variety[] = [
  {
    id: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Heritage Meat Breeds',
    description: 'Traditional dual-purpose breeds, slower growing, superior flavor'
  },
  {
    id: 'modern_meat',
    productId: 'chicken',
    displayName: 'Modern Meat Breeds',
    description: 'Fast-growing commercial hybrids and Cornish crosses'
  },
  {
    id: 'slow_growth',
    productId: 'chicken',
    displayName: 'Slow Growth Breeds',
    description: 'Intermediate growth, Label Rouge style, pastured production'
  }
]

const CHICKEN_CULTIVARS: Cultivar[] = [
  // HERITAGE MEAT (7 cultivars)
  {
    id: 'rhode_island_red_meat',
    varietyId: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Rhode Island Red',
    description: 'Classic dual-purpose, excellent flavor, red plumage',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (pasture-raised heritage)',
    notes: 'Rhode Island 1890s, 5-6 month harvest, superior flavor'
  },
  {
    id: 'plymouth_rock_meat',
    varietyId: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Plymouth Rock (Barred Rock)',
    description: 'Dual-purpose, black/white barred, excellent meat',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (heritage pasture)',
    notes: 'Massachusetts 1869, 5-6 month harvest, classic American'
  },
  {
    id: 'wyandotte_meat',
    varietyId: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Wyandotte',
    description: 'Dual-purpose, beautiful laced feathers, cold-hardy',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (heritage)',
    notes: 'New York 1870s, multiple colors, 5-6 month harvest'
  },
  {
    id: 'orpington_meat',
    varietyId: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Buff Orpington',
    description: 'Large, golden buff, gentle, excellent meat',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (heritage)',
    notes: 'England 1880s, 6 month harvest, superior flavor'
  },
  {
    id: 'brahma_meat',
    varietyId: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Brahma',
    description: 'Very large, feathered feet, slow growing, flavorful',
    heritageIntent: 'true_heritage',
    omegaBaseline: '6-10:1 (heritage)',
    notes: 'Asian origin, 1850s America, 7-8 month harvest, gentle giants'
  },
  {
    id: 'jersey_giant',
    varietyId: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Jersey Giant',
    description: 'Largest chicken breed, black/white, slow growing',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '8-12:1 (heritage, larger frame)',
    notes: 'New Jersey 1870s, 8-9 month harvest, 10+ lbs'
  },
  {
    id: 'delaware',
    varietyId: 'heritage_meat',
    productId: 'chicken',
    displayName: 'Delaware',
    description: 'White with black barring, dual-purpose, fast for heritage',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '6-10:1 (heritage)',
    notes: 'Delaware 1940s, broiler industry before Cornish Cross'
  },

  // MODERN MEAT (5 cultivars)
  {
    id: 'cornish_cross',
    varietyId: 'modern_meat',
    productId: 'chicken',
    displayName: 'Cornish Cross (Broiler)',
    description: 'White, extremely fast growing, commercial standard',
    omegaBaseline: '12-18:1 (5-7 week finish, grain-fed)',
    notes: 'Cornish×White Rock hybrid, 6-8 week harvest, 99% of US chicken'
  },
  {
    id: 'jumbo_cornish_cross',
    varietyId: 'modern_meat',
    productId: 'chicken',
    displayName: 'Jumbo Cornish Cross',
    description: 'Larger frame Cornish Cross, roaster size',
    omegaBaseline: '12-18:1 (commercial)',
    notes: '8-10 week harvest, 8-10 lbs, roasting chickens'
  },
  {
    id: 'red_ranger',
    varietyId: 'modern_meat',
    productId: 'chicken',
    displayName: 'Red Ranger',
    description: 'Red feathers, faster than heritage, slower than Cornish',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '10-14:1 (intermediate)',
    notes: 'European genetics, 10-12 week harvest, pastured friendly'
  },
  {
    id: 'kosher_king',
    varietyId: 'modern_meat',
    productId: 'chicken',
    displayName: 'Kosher King',
    description: 'Slower than Cornish Cross, better flavor',
    omegaBaseline: '10-14:1 (intermediate)',
    notes: '10-11 week harvest, active foragers'
  },
  {
    id: 'silver_cross',
    varietyId: 'modern_meat',
    productId: 'chicken',
    displayName: 'Silver Cross',
    description: 'Gray/silver plumage, commercial hybrid',
    omegaBaseline: '12-18:1 (commercial)',
    notes: 'Commercial hybrid, similar to Cornish Cross'
  },

  // SLOW GROWTH (5 cultivars)
  {
    id: 'freedom_ranger',
    varietyId: 'slow_growth',
    productId: 'chicken',
    displayName: 'Freedom Ranger',
    description: 'Label Rouge genetics, red/tricolor, pastured ideal',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '8-12:1 (pasture-raised, slower)',
    notes: 'French Label Rouge program, 12 week harvest, excellent foragers'
  },
  {
    id: 'poulet_rouge',
    varietyId: 'slow_growth',
    productId: 'chicken',
    displayName: 'Poulet Rouge',
    description: 'French red chicken, Label Rouge certified genetics',
    heritageIntent: 'true_heritage',
    omegaBaseline: '8-12:1 (Label Rouge pasture standards)',
    notes: 'France, 12 week minimum, pasture + non-GMO grain'
  },
  {
    id: 'sasso',
    varietyId: 'slow_growth',
    productId: 'chicken',
    displayName: 'Sasso',
    description: 'French colored breeds, slow growth, robust',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '8-12:1 (pasture)',
    notes: 'France, multiple color strains, 11-12 week harvest'
  },
  {
    id: 'rowan_ranger',
    varietyId: 'slow_growth',
    productId: 'chicken',
    displayName: 'Rowan Ranger',
    description: 'Colored feathers, active foragers, good flavor',
    omegaBaseline: '8-12:1 (pasture)',
    notes: '10-11 week harvest, similar to Freedom Ranger'
  },
  {
    id: 'hubbard_jA57',
    varietyId: 'slow_growth',
    productId: 'chicken',
    displayName: 'Hubbard JA57',
    description: 'Slow-growing colored bird, European genetics',
    omegaBaseline: '8-12:1 (pasture)',
    notes: 'Hubbard breeding, 12+ week harvest, pastured production'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD EGGS, PORK, LAMB, AND CHICKEN VARIETIES')
  console.log('='.repeat(80))
  console.log()

  const allVarieties = [...EGG_VARIETIES, ...PORK_VARIETIES, ...LAMB_VARIETIES, ...CHICKEN_VARIETIES]
  const allCultivars = [...EGG_CULTIVARS, ...PORK_CULTIVARS, ...LAMB_CULTIVARS, ...CHICKEN_CULTIVARS]

  console.log(`Total Varieties: ${allVarieties.length}`)
  console.log(`  - Eggs: ${EGG_VARIETIES.length}`)
  console.log(`  - Pork: ${PORK_VARIETIES.length}`)
  console.log(`  - Lamb: ${LAMB_VARIETIES.length}`)
  console.log(`  - Chicken: ${CHICKEN_VARIETIES.length}`)
  console.log()
  console.log(`Total Cultivars: ${allCultivars.length}`)
  console.log(`  - Eggs: ${EGG_CULTIVARS.length}`)
  console.log(`  - Pork: ${PORK_CULTIVARS.length}`)
  console.log(`  - Lamb: ${LAMB_CULTIVARS.length}`)
  console.log(`  - Chicken: ${CHICKEN_CULTIVARS.length}`)
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
    if (varietiesCreated % 5 === 0) {
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
          source: 'typescript_livestock',
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

      cultivarsCreated++
      if (cultivarsCreated % 10 === 0) {
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
  console.log()

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('='.repeat(80))
  console.log('VERIFICATION BY PRODUCT')
  console.log('='.repeat(80))
  console.log()

  const products = [
    { id: 'eggs', varieties: EGG_VARIETIES, name: 'EGGS' },
    { id: 'pork', varieties: PORK_VARIETIES, name: 'PORK' },
    { id: 'lamb', varieties: LAMB_VARIETIES, name: 'LAMB' },
    { id: 'chicken', varieties: CHICKEN_VARIETIES, name: 'CHICKEN (MEAT)' }
  ]

  for (const product of products) {
    console.log(`${product.name}:`)
    console.log('-'.repeat(80))

    for (const variety of product.varieties) {
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
