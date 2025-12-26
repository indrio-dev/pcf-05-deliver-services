#!/usr/bin/env tsx

/**
 * Load Seafood Varieties and Species
 *
 * Creates complete taxonomy for fish, shellfish, and crustaceans
 *
 * For seafood:
 * - Variety = Species family or geographic grouping (Pacific Salmon, Gulf Crustaceans, etc.)
 * - Cultivar = Specific species or regional subspecies (Sockeye, King Salmon, Blue Crab, etc.)
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
// SALMON VARIETIES
// ========================================================================

const SALMON_VARIETIES: Variety[] = [
  {
    id: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Pacific Salmon',
    description: 'Wild-caught Pacific species, Alaska and West Coast'
  },
  {
    id: 'atlantic_salmon',
    productId: 'salmon',
    displayName: 'Atlantic Salmon',
    description: 'Farm-raised and wild, Atlantic species'
  }
]

const SALMON_CULTIVARS: Cultivar[] = [
  // PACIFIC SALMON (7 cultivars)
  {
    id: 'sockeye_salmon',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Sockeye (Red)',
    description: 'Deep red flesh, rich flavor, wild-caught',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.2-0.5:1 (wild omega-3 rich)',
    notes: 'Alaska/BC, anadromous, feeds on krill, highest omega-3'
  },
  {
    id: 'king_salmon',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'King (Chinook)',
    description: 'Largest salmon, high fat, buttery texture',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild, very high omega-3)',
    notes: 'Alaska/BC/OR/WA, highest fat content, premium price'
  },
  {
    id: 'coho_salmon',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Coho (Silver)',
    description: 'Medium fat, bright red flesh, excellent flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild)',
    notes: 'Alaska/BC/OR/WA, silver skin, fall run'
  },
  {
    id: 'pink_salmon',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Pink (Humpback)',
    description: 'Smallest, lightest flavor, lean',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.7:1 (wild, leaner)',
    notes: 'Alaska, most abundant, canning/budget market'
  },
  {
    id: 'chum_salmon',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Chum (Keta/Dog)',
    description: 'Pale flesh, lean, mild flavor, roe prized',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.7:1 (wild, lean)',
    notes: 'Alaska/BC, excellent roe (ikura), lower oil content'
  },
  {
    id: 'copper_river_sockeye',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Copper River Sockeye',
    description: 'Premium Sockeye from Copper River, Alaska',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.2-0.4:1 (exceptional omega-3)',
    notes: 'Copper River AK, May-June only, highest fat for Sockeye, premium market'
  },
  {
    id: 'yukon_river_king',
    varietyId: 'pacific_salmon',
    productId: 'salmon',
    displayName: 'Yukon River King',
    description: 'Premium King from Yukon River, fatty and rich',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.2-0.5:1 (highest omega-3)',
    notes: 'Yukon River AK, longest migration = highest fat'
  },

  // ATLANTIC SALMON (5 cultivars)
  {
    id: 'wild_atlantic',
    varietyId: 'atlantic_salmon',
    productId: 'salmon',
    displayName: 'Wild Atlantic Salmon',
    description: 'Rare wild-caught, critically low populations',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild)',
    notes: 'North Atlantic, critically endangered, rarely available'
  },
  {
    id: 'scottish_farmed',
    varietyId: 'atlantic_salmon',
    productId: 'salmon',
    displayName: 'Scottish Farmed',
    description: 'Farm-raised in Scotland, quality aquaculture',
    omegaBaseline: '1.5-3:1 (farmed, grain-based feed)',
    notes: 'Scotland, open-pen ocean farming, better than most farmed'
  },
  {
    id: 'norwegian_farmed',
    varietyId: 'atlantic_salmon',
    productId: 'salmon',
    displayName: 'Norwegian Farmed',
    description: 'Farm-raised in Norway, large scale aquaculture',
    omegaBaseline: '2-4:1 (farmed, fish meal/grain)',
    notes: 'Norway, largest producer, variable quality'
  },
  {
    id: 'faroe_islands',
    varietyId: 'atlantic_salmon',
    productId: 'salmon',
    displayName: 'Faroe Islands Salmon',
    description: 'Premium farmed, cold clear waters, slower growth',
    omegaBaseline: '1.5-3:1 (quality farmed)',
    notes: 'Faroe Islands, premium positioning, cleaner waters'
  },
  {
    id: 'maine_farmed',
    varietyId: 'atlantic_salmon',
    productId: 'salmon',
    displayName: 'Maine Farmed',
    description: 'US farm-raised, Atlantic species',
    omegaBaseline: '2-4:1 (farmed)',
    notes: 'Maine ocean pens, smaller US production'
  }
]

// ========================================================================
// OTHER FISH VARIETIES
// ========================================================================

const FISH_VARIETIES: Variety[] = [
  // Halibut
  {
    id: 'pacific_halibut_var',
    productId: 'halibut',
    displayName: 'Pacific Halibut',
    description: 'Alaska and West Coast wild-caught'
  },
  // Tuna
  {
    id: 'tuna_species',
    productId: 'tuna',
    displayName: 'Tuna Species',
    description: 'Wild-caught tuna varieties'
  },
  // Trout
  {
    id: 'trout_types',
    productId: 'trout',
    displayName: 'Trout Types',
    description: 'Rainbow, brown, brook, and lake trout'
  },
  // Catfish
  {
    id: 'catfish_types',
    productId: 'catfish',
    displayName: 'Catfish Types',
    description: 'Channel, blue, and flathead catfish'
  }
]

const FISH_CULTIVARS: Cultivar[] = [
  // PACIFIC HALIBUT (5 cultivars - really regional distinctions)
  {
    id: 'alaska_halibut',
    varietyId: 'pacific_halibut_var',
    productId: 'halibut',
    displayName: 'Alaska Halibut',
    description: 'Wild-caught Alaska Pacific halibut, premium',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild white fish)',
    notes: 'Alaska waters, May-November season, largest stocks'
  },
  {
    id: 'bc_halibut',
    varietyId: 'pacific_halibut_var',
    productId: 'halibut',
    displayName: 'British Columbia Halibut',
    description: 'Canadian Pacific halibut, wild-caught',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'BC coastal waters, managed fishery'
  },
  {
    id: 'washington_halibut',
    varietyId: 'pacific_halibut_var',
    productId: 'halibut',
    displayName: 'Washington/Oregon Halibut',
    description: 'Pacific Northwest wild halibut',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'WA/OR waters, smaller allocation than Alaska'
  },
  {
    id: 'california_halibut',
    varietyId: 'pacific_halibut_var',
    productId: 'halibut',
    displayName: 'California Halibut',
    description: 'Different species, California coast',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.6-1.2:1 (wild, different species)',
    notes: 'Paralichthys californicus, technically flounder family, still called halibut'
  },
  {
    id: 'pacific_halibut_premium',
    varietyId: 'pacific_halibut_var',
    productId: 'halibut',
    displayName: 'Premium Line-Caught',
    description: 'Hook and line, handled with care, premium quality',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Line-caught vs trawl, better quality from handling'
  },

  // TUNA (6 cultivars)
  {
    id: 'bluefin_tuna',
    varietyId: 'tuna_species',
    productId: 'tuna',
    displayName: 'Bluefin Tuna',
    description: 'Largest, highest fat, sushi-grade, critically endangered',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild, highest omega-3)',
    notes: 'Pacific/Atlantic, critically overfished, $100+/lb sushi market'
  },
  {
    id: 'yellowfin_tuna',
    varietyId: 'tuna_species',
    productId: 'tuna',
    displayName: 'Yellowfin (Ahi)',
    description: 'Lean, mild, sushi and searing, sustainable',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild, leaner than bluefin)',
    notes: 'Tropical/subtropical, pole-caught preferred'
  },
  {
    id: 'albacore_tuna',
    varietyId: 'tuna_species',
    productId: 'tuna',
    displayName: 'Albacore (White Tuna)',
    description: 'Light flesh, mild, canned "white tuna"',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Pacific/Atlantic, troll-caught West Coast premium'
  },
  {
    id: 'skipjack_tuna',
    varietyId: 'tuna_species',
    productId: 'tuna',
    displayName: 'Skipjack (Light Tuna)',
    description: 'Smallest, darkest, canned "chunk light"',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.6-1.2:1 (wild, leaner)',
    notes: 'Tropical waters, most abundant, lower mercury'
  },
  {
    id: 'bigeye_tuna',
    varietyId: 'tuna_species',
    productId: 'tuna',
    displayName: 'Bigeye Tuna',
    description: 'High fat, sushi-grade, similar to bluefin',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.7:1 (wild, high omega-3)',
    notes: 'Tropical/temperate, sashimi quality, overfished'
  },
  {
    id: 'blackfin_tuna',
    varietyId: 'tuna_species',
    productId: 'tuna',
    displayName: 'Blackfin Tuna',
    description: 'Smaller, Atlantic/Gulf, local fishery',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Atlantic/Gulf, smaller than other tunas, local markets'
  },

  // TROUT (6 cultivars)
  {
    id: 'rainbow_trout',
    varietyId: 'trout_types',
    productId: 'trout',
    displayName: 'Rainbow Trout',
    description: 'Most common, pink flesh, farmed and wild',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '1-2:1 (farmed grain feed), 0.5-1:1 (wild)',
    notes: 'Western US native, most farmed trout, sustainable aquaculture'
  },
  {
    id: 'steelhead_trout',
    varietyId: 'trout_types',
    productId: 'trout',
    displayName: 'Steelhead',
    description: 'Sea-run rainbow, larger, richer flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild anadromous)',
    notes: 'Pacific coast, ocean-going rainbow, larger and fattier'
  },
  {
    id: 'brown_trout',
    varietyId: 'trout_types',
    productId: 'trout',
    displayName: 'Brown Trout',
    description: 'European species, wild and stocked',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.6-1.2:1 (wild)',
    notes: 'European native, introduced to US, wild fishery'
  },
  {
    id: 'brook_trout',
    varietyId: 'trout_types',
    productId: 'trout',
    displayName: 'Brook Trout (Speckled)',
    description: 'Eastern native, cold water, delicate flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Appalachian native, requires pristine cold water'
  },
  {
    id: 'lake_trout',
    varietyId: 'trout_types',
    productId: 'trout',
    displayName: 'Lake Trout',
    description: 'Great Lakes char, large, oily flesh',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Great Lakes/northern lakes, actually a char, high fat'
  },
  {
    id: 'golden_trout',
    varietyId: 'trout_types',
    productId: 'trout',
    displayName: 'Golden Trout',
    description: 'California native, high alpine, rare',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'California Sierra, high elevation, rare catch'
  },

  // CATFISH (5 cultivars)
  {
    id: 'channel_catfish',
    varietyId: 'catfish_types',
    productId: 'catfish',
    displayName: 'Channel Catfish',
    description: 'Most common farmed catfish, mild flavor',
    omegaBaseline: '2-4:1 (farmed grain)',
    notes: 'Southern US farms, Mississippi/Arkansas/Alabama, sustainable'
  },
  {
    id: 'blue_catfish',
    varietyId: 'catfish_types',
    productId: 'catfish',
    displayName: 'Blue Catfish',
    description: 'Largest North American catfish, wild-caught',
    heritageIntent: 'true_heritage',
    omegaBaseline: '1-2:1 (wild)',
    notes: 'Mississippi/Missouri rivers, can exceed 100 lbs'
  },
  {
    id: 'flathead_catfish',
    varietyId: 'catfish_types',
    productId: 'catfish',
    displayName: 'Flathead Catfish',
    description: 'Yellow cat, wild-caught, premium flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '1-2:1 (wild)',
    notes: 'Rivers/lakes, predatory, prized by anglers'
  },
  {
    id: 'white_catfish',
    varietyId: 'catfish_types',
    productId: 'catfish',
    displayName: 'White Catfish',
    description: 'Smaller, Eastern US, mild flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '1-2:1 (wild)',
    notes: 'East Coast rivers, smaller than channel'
  },
  {
    id: 'hybrid_catfish',
    varietyId: 'catfish_types',
    productId: 'catfish',
    displayName: 'Hybrid Catfish',
    description: 'Channel × Blue cross, farmed, disease resistant',
    omegaBaseline: '2-4:1 (farmed)',
    notes: 'Modern aquaculture, combines channel docility + blue size'
  }
]

// ========================================================================
// SHELLFISH VARIETIES
// ========================================================================

const SHELLFISH_VARIETIES: Variety[] = [
  {
    id: 'oyster_types',
    productId: 'oyster',
    displayName: 'Oyster Species',
    description: 'Pacific, Eastern, Kumamoto, and European oysters'
  },
  {
    id: 'clam_types',
    productId: 'clam',
    displayName: 'Clam Types',
    description: 'Hard shell, soft shell, and specialty clams'
  },
  {
    id: 'mussel_types',
    productId: 'mussel',
    displayName: 'Mussel Types',
    description: 'Blue, Mediterranean, and wild mussels'
  },
  {
    id: 'scallop_types',
    productId: 'scallop',
    displayName: 'Scallop Types',
    description: 'Bay and sea scallops'
  }
]

const SHELLFISH_CULTIVARS: Cultivar[] = [
  // OYSTERS (6 cultivars)
  {
    id: 'pacific_oyster',
    varietyId: 'oyster_types',
    productId: 'oyster',
    displayName: 'Pacific Oyster',
    description: 'West Coast standard, farmed and wild',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '0.3-0.6:1 (filter feeder, omega-3 rich)',
    notes: 'Japanese origin, PNW aquaculture, 100+ regional flavor names'
  },
  {
    id: 'eastern_oyster',
    varietyId: 'oyster_types',
    productId: 'oyster',
    displayName: 'Eastern Oyster',
    description: 'Atlantic coast native, farmed and wild',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (filter feeder)',
    notes: 'Atlantic coast native, Apalachicola, Chesapeake, Cape Cod, etc.'
  },
  {
    id: 'kumamoto_oyster',
    varietyId: 'oyster_types',
    productId: 'oyster',
    displayName: 'Kumamoto',
    description: 'Small, sweet, deeply cupped, Pacific Northwest',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (filter feeder)',
    notes: 'Japan origin, now mostly PNW farmed, premium small oyster'
  },
  {
    id: 'european_flat',
    varietyId: 'oyster_types',
    productId: 'oyster',
    displayName: 'European Flat (Belon)',
    description: 'Flat shell, metallic finish, French classic',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (filter feeder)',
    notes: 'France/Europe, introduced to Maine, acquired taste'
  },
  {
    id: 'olympia_oyster',
    varietyId: 'oyster_types',
    productId: 'oyster',
    displayName: 'Olympia Oyster',
    description: 'Native PNW, tiny, sweet, slow growing',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (native wild)',
    notes: 'Pacific Northwest native, thumbnail size, critically rare'
  },
  {
    id: 'virginica_select',
    varietyId: 'oyster_types',
    productId: 'oyster',
    displayName: 'Virginica Selects',
    description: 'Selectively bred Eastern oysters, faster growing',
    omegaBaseline: '0.3-0.6:1 (farmed)',
    notes: 'Bred from Eastern oyster, aquaculture strains'
  },

  // CLAMS (5 cultivars)
  {
    id: 'littleneck_clam',
    varietyId: 'clam_types',
    productId: 'clam',
    displayName: 'Littleneck (Hard Shell)',
    description: 'Smallest hard shell, sweet, raw or steamed',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild/farmed)',
    notes: 'Atlantic/Pacific, smallest market size hard shell'
  },
  {
    id: 'cherrystone_clam',
    varietyId: 'clam_types',
    productId: 'clam',
    displayName: 'Cherrystone (Hard Shell)',
    description: 'Medium hard shell, versatile',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild/farmed)',
    notes: 'Same species as littleneck, just larger/older'
  },
  {
    id: 'steamers',
    varietyId: 'clam_types',
    productId: 'clam',
    displayName: 'Steamers (Soft Shell)',
    description: 'Soft shell, steaming clams, delicate',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'New England, Mya arenaria, sandy beaches'
  },
  {
    id: 'razor_clam',
    varietyId: 'clam_types',
    productId: 'clam',
    displayName: 'Razor Clam',
    description: 'Long thin shell, Pacific Northwest, sweet',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Pacific beaches, recreational clamming, sweet meat'
  },
  {
    id: 'geoduck',
    varietyId: 'clam_types',
    productId: 'clam',
    displayName: 'Geoduck',
    description: 'Giant clam, long siphon, Pacific Northwest delicacy',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild/farmed)',
    notes: 'Pacific Northwest, Puget Sound, largest burrowing clam, long-lived'
  },

  // MUSSELS (5 cultivars)
  {
    id: 'blue_mussel',
    varietyId: 'mussel_types',
    productId: 'mussel',
    displayName: 'Blue Mussel',
    description: 'Common Atlantic mussel, farmed and wild',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (filter feeder, omega-3 rich)',
    notes: 'Atlantic coast, Mytilus edulis, rope-grown farming'
  },
  {
    id: 'mediterranean_mussel',
    varietyId: 'mussel_types',
    productId: 'mussel',
    displayName: 'Mediterranean Mussel',
    description: 'Larger than blue, farmed, sweet flavor',
    omegaBaseline: '0.3-0.6:1 (farmed)',
    notes: 'Mediterranean species, common in aquaculture'
  },
  {
    id: 'california_mussel',
    varietyId: 'mussel_types',
    productId: 'mussel',
    displayName: 'California Mussel',
    description: 'Pacific coast wild mussel, larger',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild)',
    notes: 'Pacific coast, Mytilus californianus, wild harvest'
  },
  {
    id: 'penn_cove_mussel',
    varietyId: 'mussel_types',
    productId: 'mussel',
    displayName: 'Penn Cove Mussel',
    description: 'Washington farmed, blue mussel, premium quality',
    omegaBaseline: '0.3-0.6:1 (farmed)',
    notes: 'Penn Cove WA, suspended culture, clean waters'
  },
  {
    id: 'green_lip_mussel',
    varietyId: 'mussel_types',
    productId: 'mussel',
    displayName: 'Green-Lipped Mussel',
    description: 'New Zealand, large, green shell edge',
    omegaBaseline: '0.3-0.6:1 (farmed)',
    notes: 'New Zealand, Perna canaliculus, medicinal properties claimed'
  },

  // SCALLOPS (5 cultivars)
  {
    id: 'sea_scallop',
    varietyId: 'scallop_types',
    productId: 'scallop',
    displayName: 'Sea Scallop',
    description: 'Large, sweet, Atlantic coast',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Atlantic, diver or dredge caught, U10-U20 premium sizes'
  },
  {
    id: 'bay_scallop',
    varietyId: 'scallop_types',
    productId: 'scallop',
    displayName: 'Bay Scallop',
    description: 'Smaller, sweeter, inshore waters',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Atlantic bays, seasonal, smaller but sweeter than sea'
  },
  {
    id: 'diver_scallop',
    varietyId: 'scallop_types',
    productId: 'scallop',
    displayName: 'Diver Scallop',
    description: 'Hand-harvested, premium quality, pristine',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Hand-picked vs dredged, better quality, higher price'
  },
  {
    id: 'weathervane_scallop',
    varietyId: 'scallop_types',
    productId: 'scallop',
    displayName: 'Weathervane Scallop',
    description: 'Alaska scallop, large, sweet',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Alaska, largest scallop species, premium market'
  },
  {
    id: 'pink_scallop',
    varietyId: 'scallop_types',
    productId: 'scallop',
    displayName: 'Pink Scallop (Singing)',
    description: 'Pacific Northwest, smaller, sweet',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Pacific NW, "singing scallop" from sound when shells close'
  }
]

// ========================================================================
// CRUSTACEAN VARIETIES
// ========================================================================

const CRUSTACEAN_VARIETIES: Variety[] = [
  {
    id: 'crab_species',
    productId: 'crab',
    displayName: 'Crab Species',
    description: 'Dungeness, Blue, King, and specialty crabs'
  },
  {
    id: 'lobster_types',
    productId: 'lobster',
    displayName: 'Lobster Types',
    description: 'Maine, spiny, and specialty lobsters'
  },
  {
    id: 'shrimp_types',
    productId: 'shrimp',
    displayName: 'Shrimp Types',
    description: 'Wild-caught and farmed shrimp varieties'
  },
  {
    id: 'crawfish_types',
    productId: 'crawfish',
    displayName: 'Crawfish Types',
    description: 'Louisiana and regional crawfish'
  }
]

const CRUSTACEAN_CULTIVARS: Cultivar[] = [
  // CRAB (7 cultivars)
  {
    id: 'dungeness_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Dungeness Crab',
    description: 'Pacific coast, sweet meat, winter season',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Alaska/BC/OR/WA/CA, Nov-May season, premium sweet meat'
  },
  {
    id: 'blue_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Blue Crab',
    description: 'Atlantic/Gulf coast, soft shell and hard shell',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Chesapeake, Gulf, soft shell delicacy'
  },
  {
    id: 'king_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'King Crab (Red)',
    description: 'Alaska, enormous legs, premium market',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild, cold water)',
    notes: 'Alaska Bering Sea, largest crab, frozen legs market'
  },
  {
    id: 'snow_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Snow Crab',
    description: 'Alaska/Canada, sweet, smaller legs than king',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Cold northern waters, cluster legs, more affordable than king'
  },
  {
    id: 'jonah_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Jonah Crab',
    description: 'Atlantic coast, sweet meat, growing market',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'New England, similar to rock crab, sustainable'
  },
  {
    id: 'stone_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Stone Crab',
    description: 'Florida specialty, claws only, regenerative harvest',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Florida, Oct-May, claws regenerate, sustainable practice'
  },
  {
    id: 'peekytoe_crab',
    varietyId: 'crab_species',
    productId: 'crab',
    displayName: 'Peekytoe Crab',
    description: 'Maine rock crab, sweet picked meat',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Maine, rock crab marketed as "peekytoe", chef favorite'
  },

  // LOBSTER (5 cultivars)
  {
    id: 'maine_lobster',
    varietyId: 'lobster_types',
    productId: 'lobster',
    displayName: 'Maine Lobster (American)',
    description: 'Clawed lobster, cold water, premium quality',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild)',
    notes: 'Maine/Atlantic Canada, clawed, soft shell summer/hard shell winter'
  },
  {
    id: 'canadian_lobster',
    varietyId: 'lobster_types',
    productId: 'lobster',
    displayName: 'Canadian Lobster',
    description: 'Same species as Maine, Atlantic Canada',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.3-0.6:1 (wild)',
    notes: 'Nova Scotia/New Brunswick, same species, colder waters'
  },
  {
    id: 'spiny_lobster_caribbean',
    varietyId: 'lobster_types',
    productId: 'lobster',
    displayName: 'Caribbean Spiny Lobster',
    description: 'No claws, all tail meat, tropical',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Florida/Caribbean, no claws, warm water'
  },
  {
    id: 'california_spiny',
    varietyId: 'lobster_types',
    productId: 'lobster',
    displayName: 'California Spiny Lobster',
    description: 'Pacific coast spiny, no claws, premium',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Southern California, recreational and commercial'
  },
  {
    id: 'slipper_lobster',
    varietyId: 'lobster_types',
    productId: 'lobster',
    displayName: 'Slipper Lobster',
    description: 'Flattened, Mediterranean and Caribbean',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'Warm waters, smaller market, specialty'
  },

  // SHRIMP (6 cultivars)
  {
    id: 'gulf_white_shrimp',
    varietyId: 'shrimp_types',
    productId: 'shrimp',
    displayName: 'Gulf White Shrimp',
    description: 'Wild-caught Gulf, sweet, firm',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Gulf of Mexico, May-December, premium wild shrimp'
  },
  {
    id: 'gulf_brown_shrimp',
    varietyId: 'shrimp_types',
    productId: 'shrimp',
    displayName: 'Gulf Brown Shrimp',
    description: 'Wild Gulf, stronger flavor, firm texture',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Gulf, June-February, iodine flavor'
  },
  {
    id: 'gulf_pink_shrimp',
    varietyId: 'shrimp_types',
    productId: 'shrimp',
    displayName: 'Gulf Pink Shrimp',
    description: 'Small, sweet, wild Gulf',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Gulf/Atlantic, smaller, salad shrimp'
  },
  {
    id: 'royal_red_shrimp',
    varietyId: 'shrimp_types',
    productId: 'shrimp',
    displayName: 'Royal Red Shrimp',
    description: 'Deep water Gulf, sweet, lobster-like',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild deepwater)',
    notes: 'Gulf deep water, 1000+ ft, sweet like lobster'
  },
  {
    id: 'spot_prawn',
    varietyId: 'shrimp_types',
    productId: 'shrimp',
    displayName: 'Spot Prawn',
    description: 'Pacific Northwest, sweet, premium',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.4-0.8:1 (wild)',
    notes: 'BC/Alaska, largest prawn, sushi-grade sweet'
  },
  {
    id: 'rock_shrimp',
    varietyId: 'shrimp_types',
    productId: 'shrimp',
    displayName: 'Rock Shrimp',
    description: 'Hard shell, sweet meat, lobster texture',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Atlantic/Gulf, hard shell, lobster-like flavor'
  },

  // CRAWFISH (5 cultivars)
  {
    id: 'red_swamp_crawfish',
    varietyId: 'crawfish_types',
    productId: 'crawfish',
    displayName: 'Red Swamp Crawfish',
    description: 'Louisiana standard, farmed and wild',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.6-1.2:1 (wild/farmed freshwater)',
    notes: 'Louisiana, most common, pond-raised and wild'
  },
  {
    id: 'white_river_crawfish',
    varietyId: 'crawfish_types',
    productId: 'crawfish',
    displayName: 'White River Crawfish',
    description: 'Larger, less common than red swamp',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.6-1.2:1 (wild)',
    notes: 'Rivers/streams, wild harvest, larger than red swamp'
  },
  {
    id: 'louisiana_crawfish',
    varietyId: 'crawfish_types',
    productId: 'crawfish',
    displayName: 'Louisiana Crawfish',
    description: 'Pond-raised, controlled harvest, February-June',
    omegaBaseline: '0.8-1.5:1 (farmed)',
    notes: 'Louisiana aquaculture, rice rotation, boil season'
  },
  {
    id: 'texas_crawfish',
    varietyId: 'crawfish_types',
    productId: 'crawfish',
    displayName: 'Texas Crawfish',
    description: 'Wild and farmed, East Texas',
    omegaBaseline: '0.6-1.2:1 (wild/farmed)',
    notes: 'East Texas, smaller aquaculture industry than Louisiana'
  },
  {
    id: 'atchafalaya_wild',
    varietyId: 'crawfish_types',
    productId: 'crawfish',
    displayName: 'Atchafalaya Wild Crawfish',
    description: 'Wild Louisiana basin crawfish, premium',
    heritageIntent: 'true_heritage',
    omegaBaseline: '0.5-1:1 (wild)',
    notes: 'Atchafalaya Basin, wild harvest, variable supply'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD SEAFOOD VARIETIES AND SPECIES')
  console.log('='.repeat(80))
  console.log()

  const allVarieties = [
    ...SALMON_VARIETIES,
    ...FISH_VARIETIES,
    ...SHELLFISH_VARIETIES,
    ...CRUSTACEAN_VARIETIES
  ]

  const allCultivars = [
    ...SALMON_CULTIVARS,
    ...FISH_CULTIVARS,
    ...SHELLFISH_CULTIVARS,
    ...CRUSTACEAN_CULTIVARS
  ]

  console.log(`Total Varieties: ${allVarieties.length}`)
  console.log(`  - Salmon: ${SALMON_VARIETIES.length}`)
  console.log(`  - Other Fish: ${FISH_VARIETIES.length}`)
  console.log(`  - Shellfish: ${SHELLFISH_VARIETIES.length}`)
  console.log(`  - Crustaceans: ${CRUSTACEAN_VARIETIES.length}`)
  console.log()
  console.log(`Total Cultivars: ${allCultivars.length}`)
  console.log(`  - Salmon: ${SALMON_CULTIVARS.length}`)
  console.log(`  - Other Fish: ${FISH_CULTIVARS.length}`)
  console.log(`  - Shellfish: ${SHELLFISH_CULTIVARS.length}`)
  console.log(`  - Crustaceans: ${CRUSTACEAN_CULTIVARS.length}`)
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
          source: 'typescript_seafood',
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
  if (errors > 0) {
    console.log(`  Errors: ${errors}`)
  }
  console.log()

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('='.repeat(80))
  console.log('VERIFICATION BY PRODUCT')
  console.log('='.repeat(80))
  console.log()

  const products = [
    { varieties: SALMON_VARIETIES, name: 'SALMON' },
    { varieties: FISH_VARIETIES, name: 'OTHER FISH' },
    { varieties: SHELLFISH_VARIETIES, name: 'SHELLFISH' },
    { varieties: CRUSTACEAN_VARIETIES, name: 'CRUSTACEANS' }
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
      console.log(`  ${status} ${variety.displayName}: ${count[0].count} species`)
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
