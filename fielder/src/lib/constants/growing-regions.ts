/**
 * US Growing Regions - Comprehensive Database
 *
 * ~150 agricultural regions across the United States
 * Organized by macro-region for filtering and SEO
 *
 * Structure: State(s) → Growing Region → County(ies) → Cities
 */

export type MacroRegion =
  | 'west_coast'
  | 'pacific_northwest'
  | 'southwest'
  | 'midwest'
  | 'southeast'
  | 'northeast'
  | 'mid_atlantic'
  | 'mountain_west'

export type DtcActivityLevel = 'high' | 'medium' | 'low'

export interface GrowingRegionExtended {
  id: string
  name: string
  displayName: string
  slug: string // SEO-friendly URL slug
  state: string
  states?: string[] // For multi-state regions
  macroRegion: MacroRegion
  counties: string[]
  primaryCities: string[]
  latitude: number
  longitude: number
  dtcActivity: DtcActivityLevel
  primaryProducts: string[]
  climate: {
    avgLastFrostDoy: number
    avgFirstFrostDoy: number
    frostFreeDays: number
    annualGdd50?: number
    avgChillHours?: number
    usdaZone?: string
  }
  /**
   * Typical soil characteristics for this region (S pillar inference)
   *
   * Regional soil profiles enable SHARE S-pillar estimation when farm-level
   * data is unavailable. Maps to FoundationEnvironment in products.ts.
   *
   * Inference chain: Packinghouse → Region → typicalSoil → S pillar estimate
   */
  typicalSoil?: {
    type: string                    // e.g., 'sandy loam', 'volcanic', 'alluvial', 'oolitic limestone'
    drainage: 'excellent' | 'good' | 'moderate' | 'poor'
    phRange?: [number, number]      // Typical pH range [min, max]
    organicMatterPct?: number       // Typical organic matter %
    mineralNotes?: string           // Notable minerals
    terroirEffect?: string          // How soil affects flavor/quality
    confidence: 'high' | 'medium' | 'low'  // How consistent is soil across region
  }
  notes?: string
}

// ============================================================================
// WEST COAST - CALIFORNIA
// ============================================================================

export const CALIFORNIA_REGIONS: Record<string, GrowingRegionExtended> = {
  sacramento_valley: {
    id: 'sacramento_valley',
    name: 'Sacramento Valley',
    displayName: 'Sacramento Valley',
    slug: 'sacramento-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Glenn', 'Colusa', 'Yuba', 'Sutter', 'Butte', 'Tehama', 'Shasta'],
    primaryCities: ['Sacramento', 'Chico', 'Yuba City', 'Willows', 'Red Bluff'],
    latitude: 39.1,
    longitude: -121.8,
    dtcActivity: 'high',
    primaryProducts: ['rice', 'almonds', 'walnuts', 'pears', 'peaches', 'kiwi', 'persimmons'],
    climate: {
      avgLastFrostDoy: 60,
      avgFirstFrostDoy: 330,
      frostFreeDays: 270,
      annualGdd50: 4800,
      avgChillHours: 800,
      usdaZone: '9'
    },
    typicalSoil: {
      type: 'deep alluvial loam',
      drainage: 'good',
      phRange: [6.0, 7.5],
      organicMatterPct: 2.5,
      mineralNotes: 'Rich Sacramento River delta deposits, excellent water-holding capacity',
      terroirEffect: 'Fertile alluvial soils produce high yields. Deep roots for tree crops. Ideal for rice cultivation with clay subsoils',
      confidence: 'high'
    },
    notes: 'Americas Farm-to-Fork Capital. $12B agricultural economy.'
  },
  san_joaquin_valley_north: {
    id: 'san_joaquin_valley_north',
    name: 'San Joaquin Valley - North',
    displayName: 'Northern San Joaquin',
    slug: 'stockton-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['San Joaquin', 'Stanislaus', 'Merced', 'Madera'],
    primaryCities: ['Stockton', 'Modesto', 'Merced', 'Madera'],
    latitude: 37.5,
    longitude: -121.0,
    dtcActivity: 'medium',
    primaryProducts: ['almonds', 'grapes', 'cherries', 'peaches', 'walnuts', 'dairy'],
    climate: {
      avgLastFrostDoy: 55,
      avgFirstFrostDoy: 335,
      frostFreeDays: 280,
      annualGdd50: 4900,
      avgChillHours: 700,
      usdaZone: '9'
    },
    notes: 'San Joaquin County: $3.14B agricultural value (2024)'
  },
  san_joaquin_valley_central: {
    id: 'san_joaquin_valley_central',
    name: 'San Joaquin Valley - Central',
    displayName: 'Fresno Region',
    slug: 'fresno-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Fresno', 'Kings'],
    primaryCities: ['Fresno', 'Clovis', 'Reedley', 'Hanford'],
    latitude: 36.7,
    longitude: -119.8,
    dtcActivity: 'medium',
    primaryProducts: ['almonds', 'grapes', 'citrus', 'stone_fruit', 'pistachios', 'tomatoes'],
    climate: {
      avgLastFrostDoy: 55,
      avgFirstFrostDoy: 340,
      frostFreeDays: 285,
      annualGdd50: 5100,
      avgChillHours: 650,
      usdaZone: '9'
    },
    notes: 'Fresno County: $8B+ annually. Reedley: Fruit Basket of the World'
  },
  san_joaquin_valley_south: {
    id: 'san_joaquin_valley_south',
    name: 'San Joaquin Valley - South',
    displayName: 'Visalia-Bakersfield',
    slug: 'visalia-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Tulare', 'Kern'],
    primaryCities: ['Visalia', 'Tulare', 'Bakersfield', 'Delano'],
    latitude: 35.8,
    longitude: -119.3,
    dtcActivity: 'medium',
    primaryProducts: ['grapes', 'citrus', 'almonds', 'pistachios', 'stone_fruit', 'dairy'],
    climate: {
      avgLastFrostDoy: 50,
      avgFirstFrostDoy: 340,
      frostFreeDays: 290,
      annualGdd50: 5200,
      avgChillHours: 600,
      usdaZone: '9'
    },
    notes: 'Big 3 counties (Fresno, Tulare, Kern) = half of CA ag value'
  },
  salinas_valley: {
    id: 'salinas_valley',
    name: 'Salinas Valley',
    displayName: 'Salinas Valley',
    slug: 'salinas-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Monterey'],
    primaryCities: ['Salinas', 'Watsonville', 'Monterey', 'Marina'],
    latitude: 36.7,
    longitude: -121.6,
    dtcActivity: 'high',
    primaryProducts: ['lettuce', 'leafy_greens', 'strawberries', 'artichokes', 'broccoli', 'wine_grapes'],
    climate: {
      avgLastFrostDoy: 45,
      avgFirstFrostDoy: 355,
      frostFreeDays: 310,
      annualGdd50: 2600,
      avgChillHours: 900,
      usdaZone: '9'
    },
    notes: 'Salad Bowl of the World. 10,000+ visitors at markets'
  },
  central_coast_north: {
    id: 'central_coast_north',
    name: 'Central Coast - North',
    displayName: 'Santa Cruz',
    slug: 'watsonville-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Santa Cruz'],
    primaryCities: ['Watsonville', 'Santa Cruz', 'Capitola'],
    latitude: 36.9,
    longitude: -121.8,
    dtcActivity: 'high',
    primaryProducts: ['strawberries', 'raspberries', 'blackberries', 'lettuce', 'artichokes', 'apples'],
    climate: {
      avgLastFrostDoy: 45,
      avgFirstFrostDoy: 355,
      frostFreeDays: 310,
      annualGdd50: 2500,
      avgChillHours: 1000,
      usdaZone: '9'
    },
    notes: '$742M agricultural value (2024). Berries = 60% of production'
  },
  central_coast_south: {
    id: 'central_coast_south',
    name: 'Central Coast - South',
    displayName: 'Ventura-Santa Barbara',
    slug: 'ventura-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Ventura', 'Santa Barbara', 'San Luis Obispo'],
    primaryCities: ['Ventura', 'Oxnard', 'Santa Maria', 'San Luis Obispo'],
    latitude: 34.4,
    longitude: -119.7,
    dtcActivity: 'high',
    primaryProducts: ['avocados', 'citrus', 'strawberries', 'vegetables', 'wine_grapes', 'beef'],
    climate: {
      avgLastFrostDoy: 35,
      avgFirstFrostDoy: 350,
      frostFreeDays: 315,
      annualGdd50: 3200,
      avgChillHours: 500,
      usdaZone: '10'
    },
    typicalSoil: {
      type: 'coastal alluvium/loam',
      drainage: 'excellent',
      phRange: [6.5, 7.5],
      organicMatterPct: 2.0,
      mineralNotes: 'Marine sediments mixed with alluvial deposits, mild mineral content',
      terroirEffect: 'Coastal influence + mild temps = ideal for premium citrus (SUMO/Shiranui), avocados. Morning fog moderates stress. Known for exceptionally sweet mandarins',
      confidence: 'high'
    },
    notes: 'Year-round production. Strong farm-to-table movement. Premium citrus (SUMO/Shiranui) epicenter'
  },
  napa_valley: {
    id: 'napa_valley',
    name: 'Napa Valley',
    displayName: 'Napa Valley',
    slug: 'napa-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Napa'],
    primaryCities: ['Napa', 'St. Helena', 'Calistoga', 'Yountville'],
    latitude: 38.5,
    longitude: -122.3,
    dtcActivity: 'high',
    primaryProducts: ['wine_grapes', 'olive_oil', 'vegetables', 'artisan_cheese'],
    climate: {
      avgLastFrostDoy: 60,
      avgFirstFrostDoy: 330,
      frostFreeDays: 270,
      annualGdd50: 3800,
      avgChillHours: 600,
      usdaZone: '9'
    },
    notes: 'Premium wine region. 90% of wineries family-owned'
  },
  sonoma_county: {
    id: 'sonoma_county',
    name: 'Sonoma County',
    displayName: 'Sonoma County',
    slug: 'santa-rosa-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Sonoma'],
    primaryCities: ['Santa Rosa', 'Healdsburg', 'Petaluma', 'Sebastopol'],
    latitude: 38.4,
    longitude: -122.7,
    dtcActivity: 'high',
    primaryProducts: ['wine_grapes', 'dairy', 'apples', 'olives', 'artisan_cheese', 'lamb'],
    climate: {
      avgLastFrostDoy: 65,
      avgFirstFrostDoy: 325,
      frostFreeDays: 260,
      annualGdd50: 3600,
      avgChillHours: 700,
      usdaZone: '9'
    },
    notes: 'Sustainable/organic focus. Strong U-pick operations'
  },
  mendocino_county: {
    id: 'mendocino_county',
    name: 'Mendocino County',
    displayName: 'Mendocino County',
    slug: 'mendocino-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Mendocino'],
    primaryCities: ['Ukiah', 'Fort Bragg', 'Willits', 'Hopland'],
    latitude: 39.2,
    longitude: -123.2,
    dtcActivity: 'medium',
    primaryProducts: ['wine_grapes', 'sheep', 'goat_cheese', 'olive_oil', 'lamb', 'wool'],
    climate: {
      avgLastFrostDoy: 70,
      avgFirstFrostDoy: 320,
      frostFreeDays: 250,
      annualGdd50: 3400,
      avgChillHours: 800,
      usdaZone: '8'
    },
    notes: 'Regenerative farming focus. Farm-to-table memberships'
  },
  imperial_valley: {
    id: 'imperial_valley',
    name: 'Imperial Valley',
    displayName: 'Imperial Valley',
    slug: 'el-centro-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Imperial'],
    primaryCities: ['El Centro', 'Brawley', 'Calexico', 'Imperial'],
    latitude: 32.8,
    longitude: -115.6,
    dtcActivity: 'low',
    primaryProducts: ['winter_vegetables', 'lettuce', 'broccoli', 'cauliflower', 'melons'],
    climate: {
      avgLastFrostDoy: 25,
      avgFirstFrostDoy: 355,
      frostFreeDays: 330,
      annualGdd50: 7000,
      avgChillHours: 150,
      usdaZone: '10'
    },
    notes: '500,000 farmable acres. Primarily wholesale production'
  },
  coachella_valley: {
    id: 'coachella_valley',
    name: 'Coachella Valley',
    displayName: 'Coachella Valley',
    slug: 'palm-springs-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['Riverside'],
    primaryCities: ['Coachella', 'Indio', 'Palm Desert', 'Thermal'],
    latitude: 33.7,
    longitude: -116.2,
    dtcActivity: 'medium',
    primaryProducts: ['dates', 'grapes', 'citrus', 'bell_peppers', 'carrots', 'lettuce'],
    climate: {
      avgLastFrostDoy: 30,
      avgFirstFrostDoy: 350,
      frostFreeDays: 320,
      annualGdd50: 6500,
      avgChillHours: 200,
      usdaZone: '10'
    },
    notes: 'Virtually all US date production. $600M agricultural sector'
  },
  san_diego_county: {
    id: 'san_diego_county',
    name: 'San Diego County',
    displayName: 'San Diego County',
    slug: 'san-diego-ca',
    state: 'CA',
    macroRegion: 'west_coast',
    counties: ['San Diego'],
    primaryCities: ['Escondido', 'Valley Center', 'Vista', 'Fallbrook', 'Julian'],
    latitude: 33.1,
    longitude: -117.1,
    dtcActivity: 'high',
    primaryProducts: ['avocados', 'citrus', 'strawberries', 'eggs', 'nursery', 'apples'],
    climate: {
      avgLastFrostDoy: 30,
      avgFirstFrostDoy: 355,
      frostFreeDays: 325,
      annualGdd50: 4000,
      avgChillHours: 400,
      usdaZone: '10'
    },
    notes: 'Year-round growing. 69% farms are 1-9 acres. 30+ farmers markets'
  }
}

// ============================================================================
// PACIFIC NORTHWEST - OREGON & WASHINGTON
// ============================================================================

export const PACIFIC_NW_REGIONS: Record<string, GrowingRegionExtended> = {
  willamette_valley: {
    id: 'willamette_valley',
    name: 'Willamette Valley',
    displayName: 'Willamette Valley',
    slug: 'salem-or',
    state: 'OR',
    macroRegion: 'pacific_northwest',
    counties: ['Marion', 'Polk', 'Linn', 'Benton', 'Lane', 'Yamhill', 'Washington', 'Clackamas'],
    primaryCities: ['Portland', 'Salem', 'Eugene', 'Corvallis', 'McMinnville'],
    latitude: 44.9,
    longitude: -123.0,
    dtcActivity: 'high',
    primaryProducts: ['wine_grapes', 'berries', 'hazelnuts', 'vegetables', 'hops', 'apples'],
    climate: {
      avgLastFrostDoy: 100,
      avgFirstFrostDoy: 305,
      frostFreeDays: 205,
      annualGdd50: 2400,
      avgChillHours: 1100,
      usdaZone: '8'
    },
    notes: 'Farmers markets nearly every day. Strong agritourism'
  },
  hood_river_valley: {
    id: 'hood_river_valley',
    name: 'Hood River Valley',
    displayName: 'Hood River Valley',
    slug: 'hood-river-or',
    state: 'OR',
    macroRegion: 'pacific_northwest',
    counties: ['Hood River', 'Wasco'],
    primaryCities: ['Hood River', 'The Dalles', 'Parkdale', 'Odell'],
    latitude: 45.7,
    longitude: -121.5,
    dtcActivity: 'high',
    primaryProducts: ['pears', 'apples', 'cherries', 'berries', 'wine_grapes', 'peaches'],
    climate: {
      avgLastFrostDoy: 110,
      avgFirstFrostDoy: 290,
      frostFreeDays: 180,
      annualGdd50: 2200,
      avgChillHours: 1100,
      usdaZone: '7'
    },
    notes: 'Famous Hood River Fruit Loop. 450M+ lbs fruit annually'
  },
  rogue_valley: {
    id: 'rogue_valley',
    name: 'Rogue Valley',
    displayName: 'Rogue Valley',
    slug: 'medford-or',
    state: 'OR',
    macroRegion: 'pacific_northwest',
    counties: ['Jackson', 'Josephine'],
    primaryCities: ['Medford', 'Ashland', 'Grants Pass', 'Central Point'],
    latitude: 42.3,
    longitude: -122.9,
    dtcActivity: 'high',
    primaryProducts: ['pears', 'wine_grapes', 'berries', 'vegetables', 'cheese', 'meats'],
    climate: {
      avgLastFrostDoy: 105,
      avgFirstFrostDoy: 295,
      frostFreeDays: 190,
      annualGdd50: 2800,
      avgChillHours: 900,
      usdaZone: '8'
    },
    notes: 'Market named top 10 in nation (USA Today). 150+ vendors'
  },
  columbia_gorge: {
    id: 'columbia_gorge',
    name: 'Columbia Gorge',
    displayName: 'Columbia Gorge',
    slug: 'the-dalles-or',
    state: 'OR',
    states: ['OR', 'WA'],
    macroRegion: 'pacific_northwest',
    counties: ['Hood River', 'Wasco', 'Skamania', 'Klickitat'],
    primaryCities: ['Hood River', 'The Dalles', 'White Salmon', 'Stevenson'],
    latitude: 45.6,
    longitude: -121.2,
    dtcActivity: 'high',
    primaryProducts: ['pears', 'apples', 'cherries', 'wine_grapes', 'berries', 'lavender'],
    climate: {
      avgLastFrostDoy: 108,
      avgFirstFrostDoy: 292,
      frostFreeDays: 184,
      annualGdd50: 2300,
      avgChillHours: 1050,
      usdaZone: '7'
    },
    notes: 'Multi-state AVA with 40+ wineries. U-pick, farm stands'
  },
  skagit_valley: {
    id: 'skagit_valley',
    name: 'Skagit Valley',
    displayName: 'Skagit Valley',
    slug: 'mount-vernon-wa',
    state: 'WA',
    macroRegion: 'pacific_northwest',
    counties: ['Skagit'],
    primaryCities: ['Mount Vernon', 'Burlington', 'Anacortes', 'La Conner'],
    latitude: 48.4,
    longitude: -122.3,
    dtcActivity: 'high',
    primaryProducts: ['berries', 'tulips', 'vegetables', 'potatoes', 'dairy'],
    climate: {
      avgLastFrostDoy: 115,
      avgFirstFrostDoy: 290,
      frostFreeDays: 175,
      annualGdd50: 2100,
      avgChillHours: 1200,
      usdaZone: '7'
    },
    notes: '$350M annual. 95% of US tulip/iris bulbs. 20,000 festival visitors'
  },
  yakima_valley: {
    id: 'yakima_valley',
    name: 'Yakima Valley',
    displayName: 'Yakima Valley',
    slug: 'yakima-wa',
    state: 'WA',
    macroRegion: 'pacific_northwest',
    counties: ['Yakima', 'Benton'],
    primaryCities: ['Yakima', 'Selah', 'Sunnyside', 'Prosser', 'Grandview'],
    latitude: 46.6,
    longitude: -120.5,
    dtcActivity: 'medium',
    primaryProducts: ['apples', 'pears', 'hops', 'wine_grapes', 'cherries', 'mint'],
    climate: {
      avgLastFrostDoy: 120,
      avgFirstFrostDoy: 290,
      frostFreeDays: 170,
      annualGdd50: 2400,
      avgChillHours: 1200,
      usdaZone: '6'
    },
    notes: '70% of US apples. 75% of US hops. 50% of WA wine grapes'
  },
  wenatchee_valley: {
    id: 'wenatchee_valley',
    name: 'Wenatchee Valley',
    displayName: 'Wenatchee Valley',
    slug: 'wenatchee-wa',
    state: 'WA',
    macroRegion: 'pacific_northwest',
    counties: ['Chelan', 'Douglas'],
    primaryCities: ['Wenatchee', 'East Wenatchee', 'Chelan', 'Leavenworth', 'Cashmere'],
    latitude: 47.4,
    longitude: -120.3,
    dtcActivity: 'high',
    primaryProducts: ['apples', 'pears', 'cherries', 'peaches', 'wine_grapes'],
    climate: {
      avgLastFrostDoy: 115,
      avgFirstFrostDoy: 285,
      frostFreeDays: 170,
      annualGdd50: 2300,
      avgChillHours: 1300,
      usdaZone: '6'
    },
    notes: 'Apple Capital of the World. Washington Apple Commission HQ'
  },
  walla_walla_valley: {
    id: 'walla_walla_valley',
    name: 'Walla Walla Valley',
    displayName: 'Walla Walla Valley',
    slug: 'walla-walla-wa',
    state: 'WA',
    states: ['WA', 'OR'],
    macroRegion: 'pacific_northwest',
    counties: ['Walla Walla', 'Umatilla'],
    primaryCities: ['Walla Walla', 'College Place', 'Milton-Freewater'],
    latitude: 46.1,
    longitude: -118.3,
    dtcActivity: 'high',
    primaryProducts: ['sweet_onions', 'wine_grapes', 'wheat', 'asparagus'],
    climate: {
      avgLastFrostDoy: 115,
      avgFirstFrostDoy: 290,
      frostFreeDays: 175,
      annualGdd50: 2500,
      avgChillHours: 1100,
      usdaZone: '7'
    },
    notes: 'Walla Walla Sweet Onions (WA state vegetable). Strong wine industry'
  },
  columbia_basin: {
    id: 'columbia_basin',
    name: 'Columbia Basin',
    displayName: 'Columbia Basin',
    slug: 'moses-lake-wa',
    state: 'WA',
    macroRegion: 'pacific_northwest',
    counties: ['Grant', 'Adams', 'Franklin'],
    primaryCities: ['Moses Lake', 'Othello', 'Quincy', 'Pasco'],
    latitude: 46.8,
    longitude: -119.3,
    dtcActivity: 'low',
    primaryProducts: ['potatoes', 'wheat', 'corn', 'wine_grapes', 'onions'],
    climate: {
      avgLastFrostDoy: 120,
      avgFirstFrostDoy: 285,
      frostFreeDays: 165,
      annualGdd50: 2600,
      avgChillHours: 1100,
      usdaZone: '6'
    },
    notes: 'Massive irrigation project. $2.66B crop value. Primarily wholesale'
  }
}

// ============================================================================
// SOUTHEAST - FLORIDA
// ============================================================================

export const FLORIDA_REGIONS: Record<string, GrowingRegionExtended> = {
  indian_river: {
    id: 'indian_river',
    name: 'Indian River District',
    displayName: 'Indian River District',
    slug: 'vero-beach-fl',
    state: 'FL',
    macroRegion: 'southeast',
    counties: ['Brevard', 'Indian River', 'St. Lucie', 'Martin', 'Volusia', 'Palm Beach'],
    primaryCities: ['Vero Beach', 'Fort Pierce', 'Melbourne', 'West Palm Beach'],
    latitude: 27.6,
    longitude: -80.4,
    dtcActivity: 'high',
    primaryProducts: ['grapefruit', 'oranges', 'tangerines', 'citrus'],
    climate: { avgLastFrostDoy: 45, avgFirstFrostDoy: 350, frostFreeDays: 305, annualGdd50: 5500, avgChillHours: 150, usdaZone: '10' },
    typicalSoil: {
      type: 'deep sandy (Ridge soils)',
      drainage: 'excellent',
      phRange: [5.5, 6.5],
      organicMatterPct: 1.5,
      mineralNotes: 'Well-drained ancient dune ridges, low nutrients but excellent root penetration',
      terroirEffect: 'Deep roots, stress-induced sugar concentration, exceptional Brix. The "Ridge" designation = premium citrus',
      confidence: 'high'
    },
    notes: '200-mile coastal strip. World-renowned Indian River citrus. 5-gen family operations. Ridge soils = premium quality'
  },
  plant_city: {
    id: 'plant_city',
    name: 'Plant City Strawberry Belt',
    displayName: 'Plant City Strawberry Belt',
    slug: 'plant-city-fl',
    state: 'FL',
    macroRegion: 'southeast',
    counties: ['Hillsborough'],
    primaryCities: ['Plant City', 'Tampa'],
    latitude: 28.0,
    longitude: -82.1,
    dtcActivity: 'high',
    primaryProducts: ['strawberries', 'citrus'],
    climate: { avgLastFrostDoy: 50, avgFirstFrostDoy: 345, frostFreeDays: 295, annualGdd50: 5300, avgChillHours: 180, usdaZone: '9' },
    notes: '16,000 acres strawberries. $540M industry. Season Nov-March'
  },
  homestead_redland: {
    id: 'homestead_redland',
    name: 'Homestead/Redland Agricultural District',
    displayName: 'Homestead/Redland',
    slug: 'homestead-fl',
    state: 'FL',
    macroRegion: 'southeast',
    counties: ['Miami-Dade'],
    primaryCities: ['Homestead', 'Florida City'],
    latitude: 25.5,
    longitude: -80.4,
    dtcActivity: 'high',
    primaryProducts: ['tropical_fruits', 'mango', 'avocados', 'lychee', 'dragon_fruit'],
    climate: { avgLastFrostDoy: 15, avgFirstFrostDoy: 365, frostFreeDays: 350, annualGdd50: 7000, avgChillHours: 50, usdaZone: '10' },
    typicalSoil: {
      type: 'oolitic limestone (Rockdale)',
      drainage: 'excellent',
      phRange: [7.5, 8.5],
      organicMatterPct: 3.0,
      mineralNotes: 'Calcium-rich coral rock, extremely shallow soil over limestone bedrock. High pH unique in FL',
      terroirEffect: 'Alkaline limestone creates distinctive tropical fruit flavors. Avocados and mangos develop complex mineral notes. Stress from shallow soil = concentrated flavor',
      confidence: 'high'
    },
    notes: 'Unique oolitic limestone soil. One of few continental US tropical regions. Terroir-driven tropical fruit'
  },
  central_florida_citrus: {
    id: 'central_florida_citrus',
    name: 'Central Florida Citrus Belt',
    displayName: 'Central Florida',
    slug: 'lakeland-fl',
    state: 'FL',
    macroRegion: 'southeast',
    counties: ['DeSoto', 'Polk', 'Highlands', 'Hendry', 'Hardee'],
    primaryCities: ['Fort Meade', 'Bartow', 'Sebring', 'Wauchula'],
    latitude: 27.5,
    longitude: -81.5,
    dtcActivity: 'medium',
    primaryProducts: ['oranges', 'grapefruit', 'tangerines', 'sweet_corn'],
    climate: { avgLastFrostDoy: 52, avgFirstFrostDoy: 340, frostFreeDays: 288, annualGdd50: 5200, avgChillHours: 200, usdaZone: '9' },
    typicalSoil: {
      type: 'mixed Ridge/Flatwoods',
      drainage: 'good',
      phRange: [5.0, 6.5],
      organicMatterPct: 2.0,
      mineralNotes: 'Polk/Highlands = Ridge soils (elevated, well-drained). DeSoto/Hendry = Flatwoods (lower, spodic horizon)',
      terroirEffect: 'Ridge groves (Lake Wales Ridge) produce sweeter citrus. Flatwoods are more productive but lower Brix. Farm-level attribution matters here.',
      confidence: 'medium'  // Mixed region - need farm-level data for precision
    },
    notes: '5 counties produce 71% of FL citrus. 88% oranges. Mix of Ridge (premium) and Flatwoods (volume)'
  },
  florida_panhandle: {
    id: 'florida_panhandle',
    name: 'Florida Panhandle',
    displayName: 'Florida Panhandle',
    slug: 'pensacola-fl',
    state: 'FL',
    macroRegion: 'southeast',
    counties: ['Jackson', 'Jefferson', 'Calhoun', 'Holmes', 'Leon', 'Walton', 'Santa Rosa'],
    primaryCities: ['Tallahassee', 'Marianna', 'Quincy'],
    latitude: 30.5,
    longitude: -85.0,
    dtcActivity: 'medium',
    primaryProducts: ['berries', 'vegetables', 'beef', 'poultry'],
    climate: { avgLastFrostDoy: 60, avgFirstFrostDoy: 330, frostFreeDays: 270, annualGdd50: 4200, avgChillHours: 450, usdaZone: '9' },
    notes: '6,594 farms on 1.3M acres. $533M. Berry acreage up 64%'
  },
  florida_keys: {
    id: 'florida_keys',
    name: 'Florida Keys',
    displayName: 'Florida Keys',
    slug: 'key-west-fl',
    state: 'FL',
    macroRegion: 'southeast',
    counties: ['Monroe'],
    primaryCities: ['Key West', 'Key Largo', 'Islamorada', 'Marathon'],
    latitude: 24.6,
    longitude: -81.4,
    dtcActivity: 'high',
    primaryProducts: ['key_lime', 'spiny_lobster', 'shrimp', 'tropical_fruits'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 7500, avgChillHours: 0, usdaZone: '11' },
    notes: 'Key lime origin. Spiny lobster season Aug-Mar. Tropical unique microclimate'
  },
  northeast_florida: {
    id: 'northeast_florida',
    name: 'Northeast Florida',
    displayName: 'Northeast Florida',
    slug: 'st-augustine-fl',
    state: 'FL',
    macroRegion: 'southeast',
    counties: ['St. Johns', 'Flagler', 'Putnam', 'Nassau', 'Duval'],
    primaryCities: ['St. Augustine', 'Palm Coast', 'Palatka', 'Fernandina Beach'],
    latitude: 29.9,
    longitude: -81.3,
    dtcActivity: 'medium',
    primaryProducts: ['datil_pepper', 'blueberries', 'vegetables', 'shrimp'],
    climate: { avgLastFrostDoy: 45, avgFirstFrostDoy: 345, frostFreeDays: 300, annualGdd50: 4800, avgChillHours: 300, usdaZone: '9' },
    notes: 'Datil pepper unique to St. Augustine. Historic seafood industry'
  }
}

// ============================================================================
// SOUTHEAST - LOUISIANA & DEEP SOUTH
// ============================================================================

export const DEEP_SOUTH_REGIONS: Record<string, GrowingRegionExtended> = {
  acadiana: {
    id: 'acadiana',
    name: 'Acadiana (Cajun Country)',
    displayName: 'Acadiana',
    slug: 'lafayette-la',
    state: 'LA',
    macroRegion: 'southeast',
    counties: ['Lafayette', 'St. Martin', 'Iberia', 'Vermilion', 'Acadia', 'St. Landry', 'Evangeline'],
    primaryCities: ['Lafayette', 'New Iberia', 'Abbeville', 'Breaux Bridge'],
    latitude: 30.2,
    longitude: -92.0,
    dtcActivity: 'high',
    primaryProducts: ['crawfish', 'rice', 'boudin', 'andouille', 'sugarcane'],
    climate: { avgLastFrostDoy: 45, avgFirstFrostDoy: 340, frostFreeDays: 295, annualGdd50: 5200, avgChillHours: 350, usdaZone: '9' },
    notes: 'Crawfish Capital. 120,000+ acres crawfish ponds. Boudin Trail'
  },
  atchafalaya_basin: {
    id: 'atchafalaya_basin',
    name: 'Atchafalaya Basin',
    displayName: 'Atchafalaya',
    slug: 'breaux-bridge-la',
    state: 'LA',
    macroRegion: 'southeast',
    counties: ['St. Martin', 'Iberia', 'St. Mary', 'Assumption'],
    primaryCities: ['Breaux Bridge', 'Henderson', 'Morgan City'],
    latitude: 30.0,
    longitude: -91.6,
    dtcActivity: 'medium',
    primaryProducts: ['crawfish', 'catfish', 'alligator', 'wild_game'],
    climate: { avgLastFrostDoy: 40, avgFirstFrostDoy: 345, frostFreeDays: 305, annualGdd50: 5400, avgChillHours: 300, usdaZone: '9' },
    notes: 'Largest river swamp in US. Wild crawfish, catfish. Cajun heritage'
  },
  louisiana_gulf_coast: {
    id: 'louisiana_gulf_coast',
    name: 'Louisiana Gulf Coast',
    displayName: 'LA Gulf Coast',
    slug: 'houma-la',
    state: 'LA',
    macroRegion: 'southeast',
    counties: ['Terrebonne', 'Lafourche', 'Plaquemines', 'Jefferson'],
    primaryCities: ['Houma', 'Thibodaux', 'Grand Isle'],
    latitude: 29.6,
    longitude: -90.7,
    dtcActivity: 'high',
    primaryProducts: ['shrimp', 'oysters', 'crab', 'crawfish'],
    climate: { avgLastFrostDoy: 35, avgFirstFrostDoy: 350, frostFreeDays: 315, annualGdd50: 5600, avgChillHours: 250, usdaZone: '9' },
    notes: 'Gulf shrimp, oysters. Sportsmans Paradise. DTC seafood boxes'
  },
  mississippi_delta: {
    id: 'mississippi_delta',
    name: 'Mississippi Delta',
    displayName: 'MS Delta',
    slug: 'greenville-ms',
    state: 'MS',
    macroRegion: 'southeast',
    counties: ['Washington', 'Bolivar', 'Sunflower', 'Leflore', 'Coahoma'],
    primaryCities: ['Greenville', 'Cleveland', 'Clarksdale', 'Greenwood'],
    latitude: 33.4,
    longitude: -91.0,
    dtcActivity: 'medium',
    primaryProducts: ['catfish', 'rice', 'sweet_potatoes', 'cotton'],
    climate: { avgLastFrostDoy: 80, avgFirstFrostDoy: 310, frostFreeDays: 230, annualGdd50: 4400, avgChillHours: 550, usdaZone: '8' },
    notes: 'Catfish Capital of the World. 100,000+ acres catfish ponds'
  },
  alabama_gulf_coast: {
    id: 'alabama_gulf_coast',
    name: 'Alabama Gulf Coast',
    displayName: 'AL Gulf Coast',
    slug: 'mobile-al',
    state: 'AL',
    macroRegion: 'southeast',
    counties: ['Mobile', 'Baldwin'],
    primaryCities: ['Mobile', 'Fairhope', 'Gulf Shores', 'Daphne'],
    latitude: 30.7,
    longitude: -87.9,
    dtcActivity: 'high',
    primaryProducts: ['shrimp', 'oysters', 'pecans', 'satsuma'],
    climate: { avgLastFrostDoy: 50, avgFirstFrostDoy: 335, frostFreeDays: 285, annualGdd50: 5000, avgChillHours: 400, usdaZone: '9' },
    notes: 'Satsuma capital. Gulf seafood. Strong farmers markets'
  }
}

// ============================================================================
// SOUTHEAST - GEORGIA
// ============================================================================

export const GEORGIA_REGIONS: Record<string, GrowingRegionExtended> = {
  vidalia_region: {
    id: 'vidalia_region',
    name: 'Vidalia Onion Region',
    displayName: 'Vidalia Region',
    slug: 'vidalia-ga',
    state: 'GA',
    macroRegion: 'southeast',
    counties: ['Toombs', 'Tattnall', 'Treutlen', 'Bacon', 'Bulloch', 'Candler', 'Evans', 'Appling', 'Jeff Davis', 'Wheeler', 'Telfair', 'Montgomery', 'Emanuel'],
    primaryCities: ['Vidalia', 'Glennville', 'Reidsville'],
    latitude: 32.2,
    longitude: -82.4,
    dtcActivity: 'high',
    primaryProducts: ['vidalia_onions'],
    climate: { avgLastFrostDoy: 75, avgFirstFrostDoy: 320, frostFreeDays: 245, annualGdd50: 4000, avgChillHours: 550, usdaZone: '8' },
    notes: '10,000 acres planted. Legally protected region since 1986. Season starts April 15'
  },
  middle_georgia: {
    id: 'middle_georgia',
    name: 'Middle Georgia',
    displayName: 'Middle Georgia',
    slug: 'fort-valley-ga',
    state: 'GA',
    macroRegion: 'southeast',
    counties: ['Macon', 'Peach', 'Crawford', 'Taylor', 'Houston', 'Bibb'],
    primaryCities: ['Fort Valley', 'Byron', 'Musella', 'Butler', 'Perry'],
    latitude: 32.6,
    longitude: -83.9,
    dtcActivity: 'high',
    primaryProducts: ['peaches', 'pecans', 'blueberries', 'vegetables'],
    climate: { avgLastFrostDoy: 90, avgFirstFrostDoy: 310, frostFreeDays: 220, annualGdd50: 3800, avgChillHours: 700, usdaZone: '8' },
    notes: '80%+ of state peach crop. Clay/sandy soil blend. Dickey Farms 125+ years'
  },
  southwest_georgia: {
    id: 'southwest_georgia',
    name: 'Southwest Georgia',
    displayName: 'Southwest Georgia',
    slug: 'albany-ga',
    state: 'GA',
    macroRegion: 'southeast',
    counties: ['Mitchell', 'Dougherty', 'Lee', 'Baker', 'Decatur', 'Grady', 'Thomas'],
    primaryCities: ['Albany', 'Camilla', 'Moultrie', 'Thomasville', 'Bainbridge'],
    latitude: 31.6,
    longitude: -84.2,
    dtcActivity: 'medium',
    primaryProducts: ['pecans', 'peanuts', 'cotton', 'vegetables'],
    climate: { avgLastFrostDoy: 80, avgFirstFrostDoy: 315, frostFreeDays: 235, annualGdd50: 4100, avgChillHours: 600, usdaZone: '8' },
    notes: '170,000+ acres pecans. 33% of US production. 88M lbs average harvest'
  },
  georgia_piedmont: {
    id: 'georgia_piedmont',
    name: 'Georgia Piedmont',
    displayName: 'Georgia Piedmont',
    slug: 'athens-ga',
    state: 'GA',
    macroRegion: 'southeast',
    counties: ['Clarke', 'Oconee', 'Madison', 'Oglethorpe', 'Morgan', 'Walton'],
    primaryCities: ['Athens', 'Watkinsville', 'Madison', 'Monroe'],
    latitude: 33.9,
    longitude: -83.4,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'beef', 'poultry', 'eggs', 'dairy'],
    climate: { avgLastFrostDoy: 95, avgFirstFrostDoy: 305, frostFreeDays: 210, annualGdd50: 3500, avgChillHours: 750, usdaZone: '7' },
    notes: 'Strong farm-to-table movement. Athens Farmers Market. Many CSA farms'
  }
}

// ============================================================================
// SOUTHEAST - CAROLINAS
// ============================================================================

export const CAROLINAS_REGIONS: Record<string, GrowingRegionExtended> = {
  south_carolina_ridge: {
    id: 'south_carolina_ridge',
    name: 'South Carolina Ridge',
    displayName: 'SC Ridge',
    slug: 'ridge-spring-sc',
    state: 'SC',
    macroRegion: 'southeast',
    counties: ['Saluda', 'Aiken', 'Edgefield', 'Lexington'],
    primaryCities: ['Ridge Spring', 'Monetta', 'Batesburg-Leesville', 'Aiken'],
    latitude: 33.8,
    longitude: -81.7,
    dtcActivity: 'high',
    primaryProducts: ['peaches', 'pecans', 'vegetables', 'beef'],
    climate: { avgLastFrostDoy: 85, avgFirstFrostDoy: 310, frostFreeDays: 225, annualGdd50: 3600, avgChillHours: 900, usdaZone: '7' },
    notes: 'Titan Farms: 6,000 acres, largest in Southeast. SC #2 in US peaches'
  },
  sc_lowcountry: {
    id: 'sc_lowcountry',
    name: 'South Carolina Lowcountry',
    displayName: 'SC Lowcountry',
    slug: 'beaufort-sc',
    state: 'SC',
    macroRegion: 'southeast',
    counties: ['Beaufort', 'Jasper', 'Hampton', 'Colleton'],
    primaryCities: ['Beaufort', 'Bluffton', 'Hilton Head Island'],
    latitude: 32.4,
    longitude: -80.7,
    dtcActivity: 'medium',
    primaryProducts: ['vegetables', 'seafood'],
    climate: { avgLastFrostDoy: 70, avgFirstFrostDoy: 325, frostFreeDays: 255, annualGdd50: 4200, avgChillHours: 500, usdaZone: '8' },
    notes: 'Multiple farmers markets. Strong CSA programs'
  },
  sc_upstate: {
    id: 'sc_upstate',
    name: 'South Carolina Upstate',
    displayName: 'SC Upstate',
    slug: 'greenville-sc',
    state: 'SC',
    macroRegion: 'southeast',
    counties: ['Greenville', 'Spartanburg', 'Anderson', 'Pickens', 'Oconee'],
    primaryCities: ['Greenville', 'Spartanburg', 'Clemson', 'Anderson'],
    latitude: 34.9,
    longitude: -82.4,
    dtcActivity: 'medium',
    primaryProducts: ['peaches', 'poultry', 'vegetables'],
    climate: { avgLastFrostDoy: 95, avgFirstFrostDoy: 305, frostFreeDays: 210, annualGdd50: 3400, avgChillHours: 850, usdaZone: '7' },
    notes: 'Disease-resistant peach varieties. Digital transformation underway'
  },
  nc_piedmont: {
    id: 'nc_piedmont',
    name: 'North Carolina Piedmont',
    displayName: 'NC Piedmont',
    slug: 'durham-nc',
    state: 'NC',
    macroRegion: 'southeast',
    counties: ['Alamance', 'Chatham', 'Durham', 'Orange', 'Person'],
    primaryCities: ['Durham', 'Chapel Hill', 'Burlington', 'Roxboro'],
    latitude: 36.0,
    longitude: -79.1,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'dairy', 'poultry', 'eggs'],
    climate: { avgLastFrostDoy: 100, avgFirstFrostDoy: 300, frostFreeDays: 200, annualGdd50: 3200, avgChillHours: 900, usdaZone: '7' },
    notes: 'Piedmont Farm Tour: 33 farms, 2,000+ visitors. Strong farm-to-table'
  },
  eastern_nc_coastal_plain: {
    id: 'eastern_nc_coastal_plain',
    name: 'Eastern North Carolina Coastal Plain',
    displayName: 'Eastern NC',
    slug: 'wilson-nc',
    state: 'NC',
    macroRegion: 'southeast',
    counties: ['Johnston', 'Nash', 'Edgecombe', 'Sampson', 'Wilson', 'Columbus', 'Cumberland', 'Wayne', 'Pitt'],
    primaryCities: ['Smithfield', 'Wilson', 'Nashville', 'Clinton', 'Goldsboro'],
    latitude: 35.6,
    longitude: -78.1,
    dtcActivity: 'medium',
    primaryProducts: ['sweet_potatoes', 'peanuts', 'blueberries', 'vegetables', 'hogs'],
    climate: { avgLastFrostDoy: 95, avgFirstFrostDoy: 305, frostFreeDays: 210, annualGdd50: 3400, avgChillHours: 800, usdaZone: '7' },
    notes: '77% of US sweet potato production. 300+ farmers with NC Commission'
  },
  nc_mountains: {
    id: 'nc_mountains',
    name: 'North Carolina Mountain Region',
    displayName: 'NC Mountains',
    slug: 'asheville-nc',
    state: 'NC',
    macroRegion: 'southeast',
    counties: ['Buncombe', 'Henderson', 'Madison', 'Haywood', 'Jackson'],
    primaryCities: ['Asheville', 'Boone', 'Hendersonville'],
    latitude: 35.6,
    longitude: -82.6,
    dtcActivity: 'medium',
    primaryProducts: ['trout', 'christmas_trees', 'vegetables', 'apples'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 285, frostFreeDays: 170, annualGdd50: 2800, avgChillHours: 1100, usdaZone: '6' },
    notes: 'Strong agritourism. Recovering from Hurricane Helene'
  }
}

// ============================================================================
// SOUTHWEST - TEXAS
// ============================================================================

export const TEXAS_REGIONS: Record<string, GrowingRegionExtended> = {
  texas_rgv: {
    id: 'texas_rgv',
    name: 'Rio Grande Valley',
    displayName: 'Texas RGV',
    slug: 'mcallen-tx',
    state: 'TX',
    macroRegion: 'southwest',
    counties: ['Hidalgo', 'Cameron', 'Willacy', 'Starr'],
    primaryCities: ['McAllen', 'Brownsville', 'Harlingen', 'Edinburg'],
    latitude: 26.2,
    longitude: -98.2,
    dtcActivity: 'high',
    primaryProducts: ['grapefruit', 'oranges', 'tangerines', 'vegetables'],
    climate: { avgLastFrostDoy: 35, avgFirstFrostDoy: 355, frostFreeDays: 320, annualGdd50: 6000, avgChillHours: 200, usdaZone: '9' },
    notes: '3rd largest US citrus region. 19,000 orchard acres'
  },
  texas_hill_country: {
    id: 'texas_hill_country',
    name: 'Texas Hill Country',
    displayName: 'Texas Hill Country',
    slug: 'fredericksburg-tx',
    state: 'TX',
    macroRegion: 'southwest',
    counties: ['Gillespie', 'Blanco', 'Kendall', 'Kerr'],
    primaryCities: ['Fredericksburg', 'Stonewall', 'Johnson City'],
    latitude: 30.3,
    longitude: -98.9,
    dtcActivity: 'high',
    primaryProducts: ['peaches', 'apricots', 'plums', 'figs', 'wine_grapes', 'pecans'],
    climate: { avgLastFrostDoy: 80, avgFirstFrostDoy: 320, frostFreeDays: 240, annualGdd50: 4200, avgChillHours: 500, usdaZone: '8' },
    notes: '600+ acres peach orchards. 14-15 active farms. Strong roadside culture'
  },
  texas_pecan_belt: {
    id: 'texas_pecan_belt',
    name: 'Texas Pecan Belt',
    displayName: 'Texas Pecan Belt',
    slug: 'san-saba-tx',
    state: 'TX',
    macroRegion: 'southwest',
    counties: ['San Saba', 'Bell', 'Hood', 'Gonzales', 'Guadalupe', 'Brown'],
    primaryCities: ['San Saba', 'Belton', 'Granbury', 'Gonzales'],
    latitude: 31.2,
    longitude: -98.7,
    dtcActivity: 'medium',
    primaryProducts: ['pecans'],
    climate: { avgLastFrostDoy: 75, avgFirstFrostDoy: 320, frostFreeDays: 245, annualGdd50: 4500, avgChillHours: 600, usdaZone: '8' },
    notes: 'Native to 152 counties. 32M lbs forecast 2025'
  },
  east_texas: {
    id: 'east_texas',
    name: 'East Texas',
    displayName: 'East Texas',
    slug: 'tyler-tx',
    state: 'TX',
    macroRegion: 'southwest',
    counties: ['Smith', 'Cherokee', 'Anderson', 'Gregg', 'Panola', 'Harrison'],
    primaryCities: ['Tyler', 'Jacksonville', 'Longview', 'Athens'],
    latitude: 32.3,
    longitude: -95.3,
    dtcActivity: 'high',
    primaryProducts: ['peaches', 'blueberries', 'blackberries', 'strawberries', 'pecans'],
    climate: { avgLastFrostDoy: 85, avgFirstFrostDoy: 315, frostFreeDays: 230, annualGdd50: 3900, avgChillHours: 700, usdaZone: '8' },
    notes: '200+ day growing season. Strong U-pick culture. Near Dallas metro'
  },
  winter_garden: {
    id: 'winter_garden',
    name: 'Winter Garden Region',
    displayName: 'Winter Garden',
    slug: 'crystal-city-tx',
    state: 'TX',
    macroRegion: 'southwest',
    counties: ['Dimmit', 'Zavala', 'Frio', 'LaSalle'],
    primaryCities: ['Carrizo Springs', 'Crystal City', 'Pearsall'],
    latitude: 28.7,
    longitude: -99.8,
    dtcActivity: 'low',
    primaryProducts: ['onions', 'spinach', 'winter_vegetables', 'carrots'],
    climate: { avgLastFrostDoy: 50, avgFirstFrostDoy: 335, frostFreeDays: 285, annualGdd50: 5000, avgChillHours: 350, usdaZone: '9' },
    notes: 'Crystal City: Spinach Capital of the World. Primarily wholesale'
  },
  texas_blackland_prairie: {
    id: 'texas_blackland_prairie',
    name: 'Texas Blackland Prairie',
    displayName: 'Blackland Prairie',
    slug: 'waco-tx',
    state: 'TX',
    macroRegion: 'southwest',
    counties: ['McLennan', 'Bell', 'Hill', 'Falls', 'Limestone', 'Navarro', 'Ellis'],
    primaryCities: ['Waco', 'Temple', 'Hillsboro', 'Corsicana', 'Waxahachie'],
    latitude: 31.5,
    longitude: -97.1,
    dtcActivity: 'medium',
    primaryProducts: ['vegetables', 'pecans', 'cattle', 'hay', 'sorghum', 'cotton'],
    climate: { avgLastFrostDoy: 80, avgFirstFrostDoy: 320, frostFreeDays: 240, annualGdd50: 4100, avgChillHours: 600, usdaZone: '8' },
    notes: 'Rich black soil. Historic cotton belt. Growing local food movement'
  },
  central_texas: {
    id: 'central_texas',
    name: 'Central Texas',
    displayName: 'Central Texas',
    slug: 'austin-tx',
    state: 'TX',
    macroRegion: 'southwest',
    counties: ['Travis', 'Hays', 'Williamson', 'Bastrop', 'Caldwell', 'Burnet'],
    primaryCities: ['Austin', 'Cedar Park', 'Round Rock', 'San Marcos', 'Bastrop'],
    latitude: 30.3,
    longitude: -97.7,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'fruits', 'grass_fed_meats', 'eggs', 'dairy', 'pecans'],
    climate: { avgLastFrostDoy: 75, avgFirstFrostDoy: 325, frostFreeDays: 250, annualGdd50: 4300, avgChillHours: 500, usdaZone: '8' },
    notes: 'Barton Creek Farmers Market (top 10 nationally). Strong CSA culture'
  }
}

// ============================================================================
// SOUTHWEST - NEW MEXICO & ARIZONA
// ============================================================================

export const SW_DESERT_REGIONS: Record<string, GrowingRegionExtended> = {
  hatch_valley: {
    id: 'hatch_valley',
    name: 'Hatch Valley',
    displayName: 'Hatch Valley',
    slug: 'hatch-nm',
    state: 'NM',
    macroRegion: 'southwest',
    counties: ['Doña Ana', 'Sierra', 'Luna'],
    primaryCities: ['Hatch', 'Rincon', 'Deming'],
    latitude: 32.7,
    longitude: -107.2,
    dtcActivity: 'high',
    primaryProducts: ['green_chile', 'red_chile', 'onions'],
    climate: { avgLastFrostDoy: 70, avgFirstFrostDoy: 320, frostFreeDays: 250, annualGdd50: 4500, avgChillHours: 400, usdaZone: '8' },
    notes: 'Chile Capital of the World. Annual Hatch Chile Festival since 1971'
  },
  mesilla_valley: {
    id: 'mesilla_valley',
    name: 'Mesilla Valley',
    displayName: 'Mesilla Valley',
    slug: 'las-cruces-nm',
    state: 'NM',
    macroRegion: 'southwest',
    counties: ['Doña Ana'],
    primaryCities: ['Las Cruces', 'Mesilla', 'Mesilla Park'],
    latitude: 32.3,
    longitude: -106.8,
    dtcActivity: 'high',
    primaryProducts: ['pecans', 'dairy', 'chile', 'onions'],
    climate: { avgLastFrostDoy: 65, avgFirstFrostDoy: 325, frostFreeDays: 260, annualGdd50: 4700, avgChillHours: 350, usdaZone: '8' },
    notes: 'NM #1 pecan producer (surpassed GA 2018). Stahmann Farms: 3,200 acres'
  },
  middle_rio_grande: {
    id: 'middle_rio_grande',
    name: 'Middle Rio Grande Valley',
    displayName: 'Middle Rio Grande',
    slug: 'albuquerque-nm',
    state: 'NM',
    macroRegion: 'southwest',
    counties: ['Bernalillo', 'Sandoval', 'Valencia', 'Socorro'],
    primaryCities: ['Albuquerque', 'Rio Rancho', 'Los Lunas', 'Belen', 'Los Ranchos'],
    latitude: 35.1,
    longitude: -106.6,
    dtcActivity: 'high',
    primaryProducts: ['chile', 'vegetables', 'fruits', 'lavender', 'wine_grapes', 'herbs'],
    climate: { avgLastFrostDoy: 100, avgFirstFrostDoy: 295, frostFreeDays: 195, annualGdd50: 3600, avgChillHours: 700, usdaZone: '7' },
    notes: 'Rail Yards Market: 400+ vendors. Historic acequia irrigation. $150K+ in SNAP benefits distributed'
  },
  northern_nm: {
    id: 'northern_nm',
    name: 'Northern New Mexico',
    displayName: 'Northern NM',
    slug: 'espanola-nm',
    state: 'NM',
    macroRegion: 'southwest',
    counties: ['Rio Arriba', 'Taos', 'Santa Fe'],
    primaryCities: ['Velarde', 'Alcalde', 'Española', 'Dixon'],
    latitude: 36.0,
    longitude: -106.1,
    dtcActivity: 'medium',
    primaryProducts: ['apples', 'pears', 'cherries', 'chile', 'herbs'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 280, frostFreeDays: 165, annualGdd50: 2900, avgChillHours: 900, usdaZone: '6' },
    notes: 'Velarde founded 1598. Historic fruit-growing. Roadside stands common'
  },
  yuma_county: {
    id: 'yuma_county',
    name: 'Yuma County',
    displayName: 'Yuma',
    slug: 'yuma-az',
    state: 'AZ',
    macroRegion: 'southwest',
    counties: ['Yuma'],
    primaryCities: ['Yuma', 'Somerton', 'San Luis'],
    latitude: 32.7,
    longitude: -114.6,
    dtcActivity: 'low',
    primaryProducts: ['lettuce', 'spinach', 'broccoli', 'cauliflower', 'leafy_greens'],
    climate: { avgLastFrostDoy: 30, avgFirstFrostDoy: 355, frostFreeDays: 325, annualGdd50: 7200, avgChillHours: 100, usdaZone: '10' },
    notes: 'Winter Vegetable Capital. 90% of US leafy greens Nov-March. $3.9B impact'
  },
  salt_river_valley: {
    id: 'salt_river_valley',
    name: 'Salt River Valley',
    displayName: 'Salt River Valley',
    slug: 'phoenix-az',
    state: 'AZ',
    macroRegion: 'southwest',
    counties: ['Maricopa', 'Pinal'],
    primaryCities: ['Phoenix', 'Mesa', 'Gilbert', 'Chandler', 'Queen Creek'],
    latitude: 33.4,
    longitude: -112.1,
    dtcActivity: 'high',
    primaryProducts: ['citrus', 'dates', 'vegetables', 'melons', 'grass_fed_beef', 'eggs'],
    climate: { avgLastFrostDoy: 40, avgFirstFrostDoy: 345, frostFreeDays: 305, annualGdd50: 6500, avgChillHours: 150, usdaZone: '10' },
    notes: 'Uptown Farmers Market: 150+ vendors (largest in AZ). Year-round growing. Historic citrus'
  },
  santa_cruz_valley: {
    id: 'santa_cruz_valley',
    name: 'Santa Cruz Valley',
    displayName: 'Santa Cruz Valley',
    slug: 'tucson-az',
    state: 'AZ',
    macroRegion: 'southwest',
    counties: ['Pima', 'Santa Cruz'],
    primaryCities: ['Tucson', 'Green Valley', 'Nogales', 'Tubac'],
    latitude: 32.2,
    longitude: -110.9,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'heritage_crops', 'grass_fed_meats'],
    climate: { avgLastFrostDoy: 50, avgFirstFrostDoy: 340, frostFreeDays: 290, annualGdd50: 5800, avgChillHours: 200, usdaZone: '9' },
    notes: '20+ weekly farmers markets. Heirloom Farmers Markets: 5 locations'
  },
  cochise_county: {
    id: 'cochise_county',
    name: 'Cochise County',
    displayName: 'Cochise County',
    slug: 'willcox-az',
    state: 'AZ',
    macroRegion: 'southwest',
    counties: ['Cochise'],
    primaryCities: ['Willcox', 'Sierra Vista', 'Douglas', 'Bisbee'],
    latitude: 32.0,
    longitude: -109.8,
    dtcActivity: 'medium',
    primaryProducts: ['apples', 'pecans', 'beef', 'lamb', 'wine_grapes'],
    climate: { avgLastFrostDoy: 90, avgFirstFrostDoy: 305, frostFreeDays: 215, annualGdd50: 4000, avgChillHours: 600, usdaZone: '8' },
    notes: 'Willcox at 4,000ft. Heritage apples. Growing tree nut industry'
  }
}

// Combine all Southwest regions
export const SOUTHWEST_REGIONS: Record<string, GrowingRegionExtended> = {
  ...TEXAS_REGIONS,
  ...SW_DESERT_REGIONS
}

// Combine all Southeast regions
export const SOUTHEAST_REGIONS: Record<string, GrowingRegionExtended> = {
  ...FLORIDA_REGIONS,
  ...GEORGIA_REGIONS,
  ...CAROLINAS_REGIONS
}

// ============================================================================
// MIDWEST
// ============================================================================

export const MIDWEST_REGIONS: Record<string, GrowingRegionExtended> = {
  michigan_upper_peninsula: {
    id: 'michigan_upper_peninsula',
    name: 'Michigan Upper Peninsula',
    displayName: 'Michigan UP',
    slug: 'marquette-mi',
    state: 'MI',
    macroRegion: 'midwest',
    counties: ['Marquette', 'Houghton', 'Keweenaw', 'Delta', 'Menominee', 'Baraga', 'Gogebic'],
    primaryCities: ['Marquette', 'Houghton', 'Escanaba', 'Hancock'],
    latitude: 46.5,
    longitude: -87.4,
    dtcActivity: 'medium',
    primaryProducts: ['maple_syrup', 'thimbleberries', 'apples', 'vegetables', 'honey', 'pasties'],
    climate: { avgLastFrostDoy: 145, avgFirstFrostDoy: 260, frostFreeDays: 115, annualGdd50: 2000, avgChillHours: 1600, usdaZone: '4' },
    notes: 'Unique thimbleberry production. Strong local food culture. Short but intense growing season'
  },
  northwest_michigan: {
    id: 'northwest_michigan',
    name: 'Northwest Michigan',
    displayName: 'Traverse City',
    slug: 'traverse-city-mi',
    state: 'MI',
    macroRegion: 'midwest',
    counties: ['Grand Traverse', 'Leelanau', 'Benzie', 'Antrim', 'Emmet', 'Charlevoix'],
    primaryCities: ['Traverse City', 'Petoskey', 'Charlevoix', 'Suttons Bay'],
    latitude: 44.8,
    longitude: -85.6,
    dtcActivity: 'high',
    primaryProducts: ['tart_cherries', 'sweet_cherries', 'apples', 'wine_grapes', 'hops'],
    climate: { avgLastFrostDoy: 135, avgFirstFrostDoy: 275, frostFreeDays: 140, annualGdd50: 2600, avgChillHours: 1400, usdaZone: '5' },
    notes: 'Cherry Capital of the World. 75% of US tart cherries. Strong agritourism'
  },
  southwest_michigan: {
    id: 'southwest_michigan',
    name: 'Southwest Michigan',
    displayName: 'Southwest Michigan',
    slug: 'south-haven-mi',
    state: 'MI',
    macroRegion: 'midwest',
    counties: ['Van Buren', 'Allegan', 'Berrien', 'Kalamazoo', 'St. Joseph', 'Cass'],
    primaryCities: ['South Haven', 'Benton Harbor', 'Kalamazoo', 'St. Joseph'],
    latitude: 42.4,
    longitude: -86.3,
    dtcActivity: 'high',
    primaryProducts: ['blueberries', 'peaches', 'grapes', 'apples', 'vegetables', 'asparagus'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 280, frostFreeDays: 150, annualGdd50: 2800, avgChillHours: 1200, usdaZone: '6' },
    notes: 'Leading blueberry producer. 20,000+ acres. Lake Michigan effect'
  },
  door_county: {
    id: 'door_county',
    name: 'Door County Peninsula',
    displayName: 'Door County',
    slug: 'sturgeon-bay-wi',
    state: 'WI',
    macroRegion: 'midwest',
    counties: ['Door'],
    primaryCities: ['Sturgeon Bay', 'Sister Bay', 'Fish Creek', 'Egg Harbor'],
    latitude: 45.0,
    longitude: -87.2,
    dtcActivity: 'high',
    primaryProducts: ['tart_cherries', 'sweet_cherries', 'apples', 'wine_grapes'],
    climate: { avgLastFrostDoy: 140, avgFirstFrostDoy: 270, frostFreeDays: 130, annualGdd50: 2400, avgChillHours: 1500, usdaZone: '5' },
    notes: '10M lbs cherries/year. Strong agritourism with tasting rooms'
  },
  wisconsin_driftless: {
    id: 'wisconsin_driftless',
    name: 'Wisconsin Driftless Region',
    displayName: 'Wisconsin Driftless',
    slug: 'viroqua-wi',
    state: 'WI',
    macroRegion: 'midwest',
    counties: ['Vernon', 'Crawford', 'Richland', 'La Crosse', 'Monroe'],
    primaryCities: ['Viroqua', 'La Crosse', 'Prairie du Chien'],
    latitude: 43.6,
    longitude: -90.9,
    dtcActivity: 'high',
    primaryProducts: ['organic_vegetables', 'grass_fed_beef', 'organic_dairy', 'apples', 'maple_syrup'],
    climate: { avgLastFrostDoy: 125, avgFirstFrostDoy: 280, frostFreeDays: 155, annualGdd50: 2600, avgChillHours: 1300, usdaZone: '5' },
    notes: 'Organic Valley HQ. WI #2 in organic farms nationally'
  },
  wisconsin_cranberry: {
    id: 'wisconsin_cranberry',
    name: 'Central Wisconsin Cranberry Country',
    displayName: 'Wisconsin Cranberry',
    slug: 'warrens-wi',
    state: 'WI',
    macroRegion: 'midwest',
    counties: ['Wood', 'Monroe', 'Jackson', 'Juneau', 'Adams'],
    primaryCities: ['Wisconsin Rapids', 'Warrens', 'Tomah'],
    latitude: 44.1,
    longitude: -90.0,
    dtcActivity: 'medium',
    primaryProducts: ['cranberries'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 275, frostFreeDays: 145, annualGdd50: 2500, avgChillHours: 1400, usdaZone: '4' },
    notes: '60% of world cranberry production. WI #1 since 1995'
  },
  ohio_lake_erie: {
    id: 'ohio_lake_erie',
    name: 'Lake Erie Shore',
    displayName: 'Lake Erie Shore',
    slug: 'sandusky-oh',
    state: 'OH',
    macroRegion: 'midwest',
    counties: ['Erie', 'Ottawa', 'Sandusky', 'Lorain', 'Ashtabula'],
    primaryCities: ['Sandusky', 'Port Clinton', 'Vermilion', 'Conneaut'],
    latitude: 41.4,
    longitude: -82.7,
    dtcActivity: 'medium',
    primaryProducts: ['wine_grapes', 'vegetables', 'tomatoes', 'strawberries'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2700, avgChillHours: 1100, usdaZone: '6' },
    notes: 'Lake Erie AVA (largest east of Rockies). 320+ wineries'
  },
  ohio_amish_country: {
    id: 'ohio_amish_country',
    name: 'Ohio Amish Country',
    displayName: 'Ohio Amish Country',
    slug: 'millersburg-oh',
    state: 'OH',
    macroRegion: 'midwest',
    counties: ['Holmes', 'Wayne', 'Tuscarawas', 'Coshocton', 'Stark'],
    primaryCities: ['Millersburg', 'Berlin', 'Sugarcreek', 'Walnut Creek'],
    latitude: 40.6,
    longitude: -81.9,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'cheese', 'baked_goods', 'apples', 'meats'],
    climate: { avgLastFrostDoy: 120, avgFirstFrostDoy: 285, frostFreeDays: 165, annualGdd50: 2600, avgChillHours: 1150, usdaZone: '6' },
    notes: '60,000+ Amish (Holmes = largest community). Roadside stands, auctions'
  },
  central_ohio: {
    id: 'central_ohio',
    name: 'Central Ohio',
    displayName: 'Central Ohio',
    slug: 'columbus-oh',
    state: 'OH',
    macroRegion: 'midwest',
    counties: ['Franklin', 'Delaware', 'Fairfield', 'Pickaway', 'Madison', 'Licking', 'Union'],
    primaryCities: ['Columbus', 'Dublin', 'Westerville', 'Newark', 'Lancaster'],
    latitude: 40.0,
    longitude: -83.0,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'fruits', 'honey', 'eggs', 'meats', 'corn', 'soybeans'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2800, avgChillHours: 1050, usdaZone: '6' },
    notes: 'North Market since 1876. 312 markets statewide (3rd in nation)'
  },
  central_indiana: {
    id: 'central_indiana',
    name: 'Central Indiana',
    displayName: 'Central Indiana',
    slug: 'indianapolis-in',
    state: 'IN',
    macroRegion: 'midwest',
    counties: ['Marion', 'Hamilton', 'Hendricks', 'Johnson', 'Hancock', 'Boone', 'Morgan', 'Shelby'],
    primaryCities: ['Indianapolis', 'Carmel', 'Fishers', 'Noblesville', 'Greenwood'],
    latitude: 39.8,
    longitude: -86.2,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'eggs', 'poultry', 'grass_fed_meats', 'melons', 'corn'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2900, avgChillHours: 1000, usdaZone: '6' },
    notes: 'Strong farm-to-table scene. Indiana Grown initiative'
  },
  northern_indiana_amish: {
    id: 'northern_indiana_amish',
    name: 'Northern Indiana Amish Country',
    displayName: 'Northern Indiana',
    slug: 'shipshewana-in',
    state: 'IN',
    macroRegion: 'midwest',
    counties: ['Elkhart', 'LaGrange', 'Noble', 'Kosciusko'],
    primaryCities: ['Elkhart', 'Goshen', 'Shipshewana', 'Nappanee'],
    latitude: 41.7,
    longitude: -85.8,
    dtcActivity: 'high',
    primaryProducts: ['apples', 'vegetables', 'eggs', 'baked_goods', 'maple_syrup'],
    climate: { avgLastFrostDoy: 125, avgFirstFrostDoy: 280, frostFreeDays: 155, annualGdd50: 2700, avgChillHours: 1150, usdaZone: '5' },
    notes: 'LaGrange among largest Amish communities. Year-round markets'
  },
  northern_illinois: {
    id: 'northern_illinois',
    name: 'Northern Illinois',
    displayName: 'Northern Illinois',
    slug: 'dekalb-il',
    state: 'IL',
    macroRegion: 'midwest',
    counties: ['DeKalb', 'Kane', 'McHenry', 'Boone', 'Ogle', 'Lee', 'Kendall'],
    primaryCities: ['DeKalb', 'St. Charles', 'Woodstock', 'Geneva', 'Sycamore'],
    latitude: 41.9,
    longitude: -88.7,
    dtcActivity: 'high',
    primaryProducts: ['corn', 'soybeans', 'vegetables', 'pumpkins', 'apples', 'dairy'],
    climate: { avgLastFrostDoy: 120, avgFirstFrostDoy: 285, frostFreeDays: 165, annualGdd50: 2700, avgChillHours: 1100, usdaZone: '5' },
    notes: 'Strong agritourism. Many farm markets and U-pick operations. Link Up doubles SNAP'
  },
  central_minnesota: {
    id: 'central_minnesota',
    name: 'Central Minnesota',
    displayName: 'Central Minnesota',
    slug: 'st-cloud-mn',
    state: 'MN',
    macroRegion: 'midwest',
    counties: ['Stearns', 'Wright', 'Sherburne', 'Benton', 'Morrison', 'Mille Lacs'],
    primaryCities: ['St. Cloud', 'Willmar', 'Little Falls', 'Sauk Centre'],
    latitude: 45.5,
    longitude: -94.2,
    dtcActivity: 'medium',
    primaryProducts: ['dairy', 'vegetables', 'corn', 'soybeans', 'poultry', 'eggs'],
    climate: { avgLastFrostDoy: 135, avgFirstFrostDoy: 270, frostFreeDays: 135, annualGdd50: 2400, avgChillHours: 1400, usdaZone: '4' },
    notes: 'Strong dairy tradition. Growing organic movement. 700+ certified organic farms statewide'
  },
  minnesota_apples: {
    id: 'minnesota_apples',
    name: 'Minnesota Apple Regions',
    displayName: 'MN Apple Country',
    slug: 'stillwater-mn',
    state: 'MN',
    macroRegion: 'midwest',
    counties: ['Washington', 'Dakota', 'Hennepin', 'Goodhue', 'Olmsted'],
    primaryCities: ['Stillwater', 'Hastings', 'Northfield', 'Rochester'],
    latitude: 44.8,
    longitude: -92.8,
    dtcActivity: 'high',
    primaryProducts: ['apples', 'cider', 'honey'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 275, frostFreeDays: 145, annualGdd50: 2500, avgChillHours: 1400, usdaZone: '4' },
    notes: 'Birthplace of Honeycrisp (MN state fruit). 115+ retail orchards'
  },
  minnesota_wild_rice: {
    id: 'minnesota_wild_rice',
    name: 'Wild Rice Country',
    displayName: 'MN Wild Rice',
    slug: 'bemidji-mn',
    state: 'MN',
    macroRegion: 'midwest',
    counties: ['Aitkin', 'Cass', 'Crow Wing', 'Itasca', 'St. Louis'],
    primaryCities: ['Park Rapids', 'Bemidji', 'Grand Rapids'],
    latitude: 47.0,
    longitude: -94.5,
    dtcActivity: 'medium',
    primaryProducts: ['wild_rice'],
    climate: { avgLastFrostDoy: 145, avgFirstFrostDoy: 260, frostFreeDays: 115, annualGdd50: 2100, avgChillHours: 1600, usdaZone: '3' },
    notes: 'MN top global producer. 64,000 acres. Tribal hand-harvesting'
  },
  iowa_northeast: {
    id: 'iowa_northeast',
    name: 'Northeast Iowa (Driftless)',
    displayName: 'NE Iowa',
    slug: 'decorah-ia',
    state: 'IA',
    macroRegion: 'midwest',
    counties: ['Winneshiek', 'Allamakee', 'Clayton', 'Fayette', 'Howard'],
    primaryCities: ['Decorah', 'Postville', 'Waukon'],
    latitude: 43.3,
    longitude: -91.8,
    dtcActivity: 'medium',
    primaryProducts: ['trout', 'organic_dairy', 'vegetables', 'apples'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 275, frostFreeDays: 145, annualGdd50: 2500, avgChillHours: 1350, usdaZone: '4' },
    notes: 'Part of 4-state Driftless. World-class trout streams'
  }
}

// ============================================================================
// NORTHEAST
// ============================================================================

export const NORTHEAST_REGIONS: Record<string, GrowingRegionExtended> = {
  hudson_valley: {
    id: 'hudson_valley',
    name: 'Hudson Valley',
    displayName: 'Hudson Valley',
    slug: 'poughkeepsie-ny',
    state: 'NY',
    macroRegion: 'northeast',
    counties: ['Ulster', 'Dutchess', 'Orange', 'Rockland', 'Columbia', 'Greene', 'Putnam'],
    primaryCities: ['Poughkeepsie', 'Kingston', 'Newburgh', 'Beacon'],
    latitude: 41.7,
    longitude: -73.9,
    dtcActivity: 'high',
    primaryProducts: ['apples', 'berries', 'dairy', 'cheese', 'honey', 'vegetables'],
    climate: { avgLastFrostDoy: 120, avgFirstFrostDoy: 290, frostFreeDays: 170, annualGdd50: 2600, avgChillHours: 1100, usdaZone: '6' },
    notes: '2,280 farms, $301M sales. $1B+ unmet demand for local products'
  },
  finger_lakes: {
    id: 'finger_lakes',
    name: 'Finger Lakes',
    displayName: 'Finger Lakes',
    slug: 'geneva-ny',
    state: 'NY',
    macroRegion: 'northeast',
    counties: ['Ontario', 'Wayne', 'Seneca', 'Yates', 'Cayuga', 'Monroe', 'Livingston'],
    primaryCities: ['Rochester', 'Geneva', 'Canandaigua', 'Ithaca'],
    latitude: 42.5,
    longitude: -77.0,
    dtcActivity: 'high',
    primaryProducts: ['wine_grapes', 'apples', 'cherries', 'berries', 'vegetables', 'dairy'],
    climate: { avgLastFrostDoy: 125, avgFirstFrostDoy: 280, frostFreeDays: 155, annualGdd50: 2400, avgChillHours: 1200, usdaZone: '6' },
    notes: 'Leads NY with $2.34B ag sales. 85 wineries. Windmill Market (largest rural)'
  },
  long_island: {
    id: 'long_island',
    name: 'Long Island',
    displayName: 'Long Island',
    slug: 'riverhead-ny',
    state: 'NY',
    macroRegion: 'northeast',
    counties: ['Suffolk', 'Nassau'],
    primaryCities: ['Riverhead', 'Southampton', 'Southold'],
    latitude: 40.9,
    longitude: -72.7,
    dtcActivity: 'high',
    primaryProducts: ['wine_grapes', 'potatoes', 'vegetables', 'nursery', 'eggs'],
    climate: { avgLastFrostDoy: 110, avgFirstFrostDoy: 295, frostFreeDays: 185, annualGdd50: 2900, avgChillHours: 950, usdaZone: '7' },
    notes: '60+ wineries (Top 10 Wine Region). Only NY region gaining farms. $373M sales'
  },
  adams_county_pa: {
    id: 'adams_county_pa',
    name: 'Adams County (South Mountain)',
    displayName: 'Adams County',
    slug: 'gettysburg-pa',
    state: 'PA',
    macroRegion: 'northeast',
    counties: ['Adams'],
    primaryCities: ['Gettysburg', 'Biglerville'],
    latitude: 39.8,
    longitude: -77.2,
    dtcActivity: 'high',
    primaryProducts: ['apples', 'peaches', 'cherries', 'berries', 'vegetables'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2700, avgChillHours: 1000, usdaZone: '6' },
    notes: 'Largest PA apple/peach producer, 6th nationally. 20,000+ orchard acres'
  },
  lancaster_county_pa: {
    id: 'lancaster_county_pa',
    name: 'Lancaster County',
    displayName: 'Lancaster County',
    slug: 'lancaster-pa',
    state: 'PA',
    macroRegion: 'northeast',
    counties: ['Lancaster'],
    primaryCities: ['Lancaster', 'Strasburg'],
    latitude: 40.0,
    longitude: -76.3,
    dtcActivity: 'high',
    primaryProducts: ['dairy', 'poultry', 'eggs', 'vegetables', 'meats'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2800, avgChillHours: 1000, usdaZone: '6' },
    notes: '$1.5B market value. 99% family-owned. Green Dragon market (80+ years)'
  },
  pine_barrens_nj: {
    id: 'pine_barrens_nj',
    name: 'New Jersey Pine Barrens',
    displayName: 'Pine Barrens',
    slug: 'hammonton-nj',
    state: 'NJ',
    macroRegion: 'northeast',
    counties: ['Atlantic', 'Burlington', 'Ocean', 'Cape May', 'Cumberland'],
    primaryCities: ['Hammonton', 'Toms River'],
    latitude: 39.6,
    longitude: -74.8,
    dtcActivity: 'medium',
    primaryProducts: ['blueberries', 'cranberries', 'honey'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2800, avgChillHours: 1000, usdaZone: '7' },
    notes: 'NJ #2 nationally for blueberries. 4,000 acres cranberry bogs'
  },
  central_jersey: {
    id: 'central_jersey',
    name: 'Central Jersey',
    displayName: 'Central Jersey',
    slug: 'princeton-nj',
    state: 'NJ',
    macroRegion: 'northeast',
    counties: ['Mercer', 'Middlesex', 'Monmouth', 'Somerset', 'Hunterdon'],
    primaryCities: ['Trenton', 'New Brunswick', 'Princeton'],
    latitude: 40.3,
    longitude: -74.7,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'strawberries', 'blueberries', 'apples', 'peaches'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2800, avgChillHours: 1000, usdaZone: '7' },
    notes: 'Extensive U-pick operations. Strong CSA networks'
  },
  pioneer_valley_ma: {
    id: 'pioneer_valley_ma',
    name: 'Pioneer Valley',
    displayName: 'Pioneer Valley',
    slug: 'northampton-ma',
    state: 'MA',
    macroRegion: 'northeast',
    counties: ['Hampshire', 'Franklin', 'Hampden'],
    primaryCities: ['Northampton', 'Amherst', 'Springfield'],
    latitude: 42.3,
    longitude: -72.6,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'berries', 'heritage_grains', 'meats'],
    climate: { avgLastFrostDoy: 125, avgFirstFrostDoy: 280, frostFreeDays: 155, annualGdd50: 2500, avgChillHours: 1150, usdaZone: '5' },
    notes: 'CISA Buy Local hub. Heritage grain revival. UMass ag programs'
  },
  berkshires_ma: {
    id: 'berkshires_ma',
    name: 'Berkshires',
    displayName: 'Berkshires',
    slug: 'pittsfield-ma',
    state: 'MA',
    macroRegion: 'northeast',
    counties: ['Berkshire'],
    primaryCities: ['Pittsfield', 'Great Barrington', 'North Adams'],
    latitude: 42.4,
    longitude: -73.2,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'apples', 'dairy', 'cheese', 'maple_syrup'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 275, frostFreeDays: 145, annualGdd50: 2400, avgChillHours: 1200, usdaZone: '5' },
    notes: 'Berkshire Grown network. Markets almost daily. 100% producer-only'
  },
  cape_cod_ma: {
    id: 'cape_cod_ma',
    name: 'Cape Cod and Southeast MA',
    displayName: 'Cape Cod',
    slug: 'hyannis-ma',
    state: 'MA',
    macroRegion: 'northeast',
    counties: ['Barnstable', 'Plymouth', 'Bristol'],
    primaryCities: ['Hyannis', 'Plymouth', 'New Bedford'],
    latitude: 41.7,
    longitude: -70.3,
    dtcActivity: 'medium',
    primaryProducts: ['cranberries', 'seafood'],
    climate: { avgLastFrostDoy: 110, avgFirstFrostDoy: 295, frostFreeDays: 185, annualGdd50: 2600, avgChillHours: 1000, usdaZone: '7' },
    notes: '11,500+ acres cranberry bogs. MA #2 nationally. $1.7B economic impact'
  },
  vermont_champlain: {
    id: 'vermont_champlain',
    name: 'Champlain Valley',
    displayName: 'Champlain Valley',
    slug: 'burlington-vt',
    state: 'VT',
    macroRegion: 'northeast',
    counties: ['Addison', 'Chittenden', 'Grand Isle', 'Franklin'],
    primaryCities: ['Burlington', 'Middlebury', 'St. Albans'],
    latitude: 44.5,
    longitude: -73.2,
    dtcActivity: 'high',
    primaryProducts: ['dairy', 'maple_syrup', 'apples', 'cheese', 'vegetables'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 275, frostFreeDays: 145, annualGdd50: 2400, avgChillHours: 1300, usdaZone: '5' },
    notes: 'Lake Champlain moderates climate. Strong dairy/maple heritage'
  },
  vermont_statewide: {
    id: 'vermont_statewide',
    name: 'Vermont Statewide',
    displayName: 'Vermont',
    slug: 'montpelier-vt',
    state: 'VT',
    macroRegion: 'northeast',
    counties: ['All 14 counties'],
    primaryCities: ['Montpelier', 'Rutland', 'Brattleboro'],
    latitude: 44.0,
    longitude: -72.7,
    dtcActivity: 'high',
    primaryProducts: ['maple_syrup', 'dairy', 'cheese', 'apples', 'vegetables'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 270, frostFreeDays: 140, annualGdd50: 2200, avgChillHours: 1400, usdaZone: '5' },
    notes: '53% of US maple syrup. 500+ dairy farms. 25%+ farms sell direct'
  },
  maine_aroostook: {
    id: 'maine_aroostook',
    name: 'Aroostook County',
    displayName: 'Aroostook County',
    slug: 'presque-isle-me',
    state: 'ME',
    macroRegion: 'northeast',
    counties: ['Aroostook'],
    primaryCities: ['Presque Isle', 'Caribou', 'Fort Kent'],
    latitude: 46.7,
    longitude: -68.0,
    dtcActivity: 'medium',
    primaryProducts: ['potatoes', 'soybeans', 'grains', 'dairy'],
    climate: { avgLastFrostDoy: 145, avgFirstFrostDoy: 260, frostFreeDays: 115, annualGdd50: 2000, avgChillHours: 1700, usdaZone: '4' },
    notes: '90% of state potatoes. $291M ag products. Leading certified seed producer'
  },
  maine_blueberry: {
    id: 'maine_blueberry',
    name: 'Downeast/Blueberry Barrens',
    displayName: 'Maine Blueberries',
    slug: 'machias-me',
    state: 'ME',
    macroRegion: 'northeast',
    counties: ['Washington', 'Hancock'],
    primaryCities: ['Machias', 'Ellsworth', 'Bar Harbor'],
    latitude: 44.7,
    longitude: -67.5,
    dtcActivity: 'medium',
    primaryProducts: ['wild_blueberries', 'lobster', 'seafood'],
    climate: { avgLastFrostDoy: 135, avgFirstFrostDoy: 265, frostFreeDays: 130, annualGdd50: 2200, avgChillHours: 1500, usdaZone: '5' },
    notes: 'Wild blueberry barrens. Commercial harvesting since 1840s'
  },
  maine_midcoast: {
    id: 'maine_midcoast',
    name: 'Midcoast Maine',
    displayName: 'Midcoast Maine',
    slug: 'rockland-me',
    state: 'ME',
    macroRegion: 'northeast',
    counties: ['Knox', 'Lincoln', 'Waldo', 'Sagadahoc'],
    primaryCities: ['Rockland', 'Camden', 'Belfast'],
    latitude: 44.1,
    longitude: -69.1,
    dtcActivity: 'high',
    primaryProducts: ['lobster', 'oysters', 'mussels', 'kelp', 'vegetables'],
    climate: { avgLastFrostDoy: 125, avgFirstFrostDoy: 275, frostFreeDays: 150, annualGdd50: 2300, avgChillHours: 1300, usdaZone: '5' },
    notes: 'Major aquaculture cluster. Kelp farming concentration'
  },
  new_hampshire: {
    id: 'new_hampshire',
    name: 'New Hampshire Statewide',
    displayName: 'New Hampshire',
    slug: 'concord-nh',
    state: 'NH',
    macroRegion: 'northeast',
    counties: ['Rockingham', 'Strafford', 'Cheshire', 'Hillsborough', 'Merrimack'],
    primaryCities: ['Portsmouth', 'Dover', 'Keene', 'Concord'],
    latitude: 43.2,
    longitude: -71.5,
    dtcActivity: 'high',
    primaryProducts: ['apples', 'dairy', 'maple_syrup', 'vegetables'],
    climate: { avgLastFrostDoy: 125, avgFirstFrostDoy: 280, frostFreeDays: 155, annualGdd50: 2400, avgChillHours: 1200, usdaZone: '5' },
    notes: '4,100 farms. 70+ community farmers markets. Strong CSA networks'
  },
  connecticut: {
    id: 'connecticut',
    name: 'Connecticut Statewide',
    displayName: 'Connecticut',
    slug: 'hartford-ct',
    state: 'CT',
    macroRegion: 'northeast',
    counties: ['Hartford', 'New Haven', 'Fairfield', 'Litchfield', 'Middlesex'],
    primaryCities: ['Hartford', 'New Haven', 'Bridgeport', 'Stamford'],
    latitude: 41.6,
    longitude: -72.7,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'fruits', 'dairy', 'meats', 'eggs'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2700, avgChillHours: 1050, usdaZone: '6' },
    notes: 'Hale Homestead (states largest market). 30+ SNAP-doubling markets'
  },
  rhode_island: {
    id: 'rhode_island',
    name: 'Rhode Island Statewide',
    displayName: 'Rhode Island',
    slug: 'providence-ri',
    state: 'RI',
    macroRegion: 'northeast',
    counties: ['Providence', 'Kent', 'Washington', 'Bristol', 'Newport'],
    primaryCities: ['Providence', 'Warwick', 'Cranston'],
    latitude: 41.6,
    longitude: -71.5,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'tomatoes', 'corn', 'blueberries', 'seafood'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 290, frostFreeDays: 175, annualGdd50: 2700, avgChillHours: 1000, usdaZone: '6' },
    notes: 'Farm Fresh RI coordinates markets. RI Grown branding. Year-round markets'
  }
}

// ============================================================================
// MID-ATLANTIC & MOUNTAIN WEST
// ============================================================================

export const MID_ATLANTIC_REGIONS: Record<string, GrowingRegionExtended> = {
  shenandoah_valley: {
    id: 'shenandoah_valley',
    name: 'Shenandoah Valley',
    displayName: 'Shenandoah Valley',
    slug: 'winchester-va',
    state: 'VA',
    macroRegion: 'mid_atlantic',
    counties: ['Frederick', 'Clarke', 'Warren', 'Shenandoah', 'Page', 'Rockingham', 'Augusta'],
    primaryCities: ['Winchester', 'Harrisonburg', 'Staunton', 'Waynesboro'],
    latitude: 39.2,
    longitude: -78.2,
    dtcActivity: 'high',
    primaryProducts: ['apples', 'peaches', 'cherries', 'cider', 'honey'],
    climate: { avgLastFrostDoy: 110, avgFirstFrostDoy: 290, frostFreeDays: 180, annualGdd50: 2800, avgChillHours: 1000, usdaZone: '6' },
    notes: 'Winchester: Apple Capital of the World. VA 6th largest apple producer'
  },
  virginia_piedmont: {
    id: 'virginia_piedmont',
    name: 'Virginia Piedmont',
    displayName: 'Virginia Piedmont',
    slug: 'charlottesville-va',
    state: 'VA',
    macroRegion: 'mid_atlantic',
    counties: ['Albemarle', 'Culpeper', 'Fauquier', 'Madison', 'Orange', 'Nelson'],
    primaryCities: ['Charlottesville', 'Warrenton', 'Culpeper'],
    latitude: 38.0,
    longitude: -78.5,
    dtcActivity: 'high',
    primaryProducts: ['wine_grapes', 'apples', 'peaches', 'vegetables', 'beef'],
    climate: { avgLastFrostDoy: 110, avgFirstFrostDoy: 295, frostFreeDays: 185, annualGdd50: 3000, avgChillHours: 950, usdaZone: '7' },
    notes: 'Wine Enthusiast Wine Region of the Year. 40+ wineries. Monticello Trail'
  },
  maryland_eastern_shore: {
    id: 'maryland_eastern_shore',
    name: 'Maryland Eastern Shore',
    displayName: 'Eastern Shore MD',
    slug: 'salisbury-md',
    state: 'MD',
    macroRegion: 'mid_atlantic',
    counties: ['Caroline', 'Cecil', 'Dorchester', 'Kent', 'Queen Anne', 'Somerset', 'Talbot', 'Wicomico', 'Worcester'],
    primaryCities: ['Salisbury', 'Easton', 'Cambridge', 'Ocean City'],
    latitude: 38.4,
    longitude: -75.6,
    dtcActivity: 'medium',
    primaryProducts: ['poultry', 'corn', 'soybeans', 'blue_crab', 'seafood', 'vegetables'],
    climate: { avgLastFrostDoy: 105, avgFirstFrostDoy: 295, frostFreeDays: 190, annualGdd50: 3100, avgChillHours: 900, usdaZone: '7' },
    notes: '86.9% of MD broilers. Delmarva Peninsula = $4.8B poultry'
  },
  delaware: {
    id: 'delaware',
    name: 'Delaware/Delmarva',
    displayName: 'Delaware',
    slug: 'dover-de',
    state: 'DE',
    macroRegion: 'mid_atlantic',
    counties: ['Sussex', 'Kent', 'New Castle'],
    primaryCities: ['Dover', 'Milford', 'Lewes', 'Seaford'],
    latitude: 39.0,
    longitude: -75.5,
    dtcActivity: 'high',
    primaryProducts: ['poultry', 'corn', 'soybeans', 'vegetables', 'fruits'],
    climate: { avgLastFrostDoy: 110, avgFirstFrostDoy: 290, frostFreeDays: 180, annualGdd50: 2900, avgChillHours: 950, usdaZone: '7' },
    notes: 'Sussex = largest broiler county in US. $4.5M farmers market sales (2024 record)'
  },
  wv_eastern_panhandle: {
    id: 'wv_eastern_panhandle',
    name: 'West Virginia Eastern Panhandle',
    displayName: 'WV Eastern Panhandle',
    slug: 'martinsburg-wv',
    state: 'WV',
    macroRegion: 'mid_atlantic',
    counties: ['Berkeley', 'Jefferson', 'Morgan', 'Hampshire'],
    primaryCities: ['Martinsburg', 'Charles Town', 'Shepherdstown'],
    latitude: 39.5,
    longitude: -77.9,
    dtcActivity: 'medium',
    primaryProducts: ['apples', 'peaches', 'vegetables', 'poultry'],
    climate: { avgLastFrostDoy: 115, avgFirstFrostDoy: 285, frostFreeDays: 170, annualGdd50: 2700, avgChillHours: 1050, usdaZone: '6' },
    notes: '95% of WV apple/peach production. 4,848 farms'
  },
  kentucky_bluegrass: {
    id: 'kentucky_bluegrass',
    name: 'Kentucky Bluegrass Region',
    displayName: 'Bluegrass Region',
    slug: 'lexington-ky',
    state: 'KY',
    macroRegion: 'mid_atlantic',
    counties: ['Fayette', 'Bourbon', 'Woodford', 'Scott', 'Clark', 'Jessamine'],
    primaryCities: ['Lexington', 'Paris', 'Versailles', 'Georgetown'],
    latitude: 38.0,
    longitude: -84.5,
    dtcActivity: 'medium',
    primaryProducts: ['horses', 'beef', 'tobacco', 'corn', 'dairy'],
    climate: { avgLastFrostDoy: 110, avgFirstFrostDoy: 290, frostFreeDays: 180, annualGdd50: 2900, avgChillHours: 950, usdaZone: '6' },
    notes: 'Thoroughbred Capital of the World. Fertile limestone soil'
  },
  east_tennessee: {
    id: 'east_tennessee',
    name: 'East Tennessee',
    displayName: 'East Tennessee',
    slug: 'knoxville-tn',
    state: 'TN',
    macroRegion: 'mid_atlantic',
    counties: ['Knox', 'Sevier', 'Blount', 'Greene', 'Cocke', 'Loudon'],
    primaryCities: ['Knoxville', 'Gatlinburg', 'Maryville'],
    latitude: 35.9,
    longitude: -83.9,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'eggs', 'honey', 'beef', 'fruits'],
    climate: { avgLastFrostDoy: 105, avgFirstFrostDoy: 295, frostFreeDays: 190, annualGdd50: 3200, avgChillHours: 850, usdaZone: '7' },
    notes: 'East TN Local Food Guide covers 33 counties. Strong CSA presence'
  },
  middle_tennessee: {
    id: 'middle_tennessee',
    name: 'Middle Tennessee',
    displayName: 'Middle Tennessee',
    slug: 'nashville-tn',
    state: 'TN',
    macroRegion: 'mid_atlantic',
    counties: ['Davidson', 'Williamson', 'Rutherford', 'Wilson', 'Sumner'],
    primaryCities: ['Nashville', 'Murfreesboro', 'Franklin', 'Brentwood'],
    latitude: 36.2,
    longitude: -86.8,
    dtcActivity: 'high',
    primaryProducts: ['vegetables', 'fruits', 'meats', 'eggs', 'poultry'],
    climate: { avgLastFrostDoy: 100, avgFirstFrostDoy: 300, frostFreeDays: 200, annualGdd50: 3400, avgChillHours: 800, usdaZone: '7' },
    notes: 'Nashville Farmers Market at Rosa Parks Blvd. Markets grown 300%+ since 1994'
  }
}

export const MOUNTAIN_WEST_REGIONS: Record<string, GrowingRegionExtended> = {
  snake_river_valley: {
    id: 'snake_river_valley',
    name: 'Snake River Valley',
    displayName: 'Snake River Valley',
    slug: 'boise-id',
    state: 'ID',
    macroRegion: 'mountain_west',
    counties: ['Canyon', 'Ada', 'Twin Falls', 'Jerome', 'Gooding', 'Bingham'],
    primaryCities: ['Boise', 'Nampa', 'Twin Falls', 'Idaho Falls'],
    latitude: 43.6,
    longitude: -116.2,
    dtcActivity: 'medium',
    primaryProducts: ['potatoes', 'dairy', 'onions', 'wheat', 'wine_grapes'],
    climate: { avgLastFrostDoy: 125, avgFirstFrostDoy: 275, frostFreeDays: 150, annualGdd50: 2600, avgChillHours: 1200, usdaZone: '6' },
    notes: '32% of US potatoes. Volcanic soil. Hot days/cool nights ideal'
  },
  palisade_colorado: {
    id: 'palisade_colorado',
    name: 'Western Slope/Palisade',
    displayName: 'Palisade',
    slug: 'palisade-co',
    state: 'CO',
    macroRegion: 'mountain_west',
    counties: ['Mesa', 'Delta', 'Montrose', 'Garfield'],
    primaryCities: ['Grand Junction', 'Palisade', 'Fruita', 'Delta'],
    latitude: 39.1,
    longitude: -108.4,
    dtcActivity: 'high',
    primaryProducts: ['peaches', 'wine_grapes', 'apples', 'cherries', 'pears'],
    climate: { avgLastFrostDoy: 105, avgFirstFrostDoy: 290, frostFreeDays: 185, annualGdd50: 3200, avgChillHours: 900, usdaZone: '7' },
    notes: 'Peach Capital. World-famous peaches. 39+ wineries. First Peach Day 1909'
  },
  wasatch_front: {
    id: 'wasatch_front',
    name: 'Wasatch Front',
    displayName: 'Wasatch Front',
    slug: 'salt-lake-city-ut',
    state: 'UT',
    macroRegion: 'mountain_west',
    counties: ['Cache', 'Weber', 'Davis', 'Salt Lake', 'Utah'],
    primaryCities: ['Salt Lake City', 'Ogden', 'Provo', 'Logan'],
    latitude: 40.8,
    longitude: -111.9,
    dtcActivity: 'medium',
    primaryProducts: ['dairy', 'apples', 'cherries', 'peaches', 'vegetables'],
    climate: { avgLastFrostDoy: 120, avgFirstFrostDoy: 280, frostFreeDays: 160, annualGdd50: 2700, avgChillHours: 1100, usdaZone: '6' },
    notes: 'Utah County = half state fruit. Cache County dairy processing hub'
  },
  western_montana: {
    id: 'western_montana',
    name: 'Western Montana Valleys',
    displayName: 'Western Montana',
    slug: 'missoula-mt',
    state: 'MT',
    macroRegion: 'mountain_west',
    counties: ['Flathead', 'Gallatin', 'Missoula', 'Ravalli', 'Lake'],
    primaryCities: ['Kalispell', 'Bozeman', 'Missoula', 'Whitefish'],
    latitude: 47.0,
    longitude: -114.0,
    dtcActivity: 'medium',
    primaryProducts: ['vegetables', 'dairy', 'wheat', 'beef', 'lamb'],
    climate: { avgLastFrostDoy: 130, avgFirstFrostDoy: 265, frostFreeDays: 135, annualGdd50: 2200, avgChillHours: 1400, usdaZone: '5' },
    notes: 'Irrigated market gardens around Flathead Lake. 1 in 6 workers in ag'
  }
}

// ============================================================================
// HAWAII
// ============================================================================

export const HAWAII_REGIONS: Record<string, GrowingRegionExtended> = {
  kona_coast: {
    id: 'kona_coast',
    name: 'Kona Coast',
    displayName: 'Kona',
    slug: 'kona-hi',
    state: 'HI',
    macroRegion: 'west_coast',
    counties: ['Hawaii'],
    primaryCities: ['Kailua-Kona', 'Captain Cook', 'Holualoa'],
    latitude: 19.6,
    longitude: -156.0,
    dtcActivity: 'high',
    primaryProducts: ['coffee', 'macadamia_nuts', 'tropical_fruits', 'honey', 'vanilla'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 8000, avgChillHours: 0, usdaZone: '11' },
    notes: 'World-renowned Kona coffee. 800+ farms in the coffee belt. Premium DTC market'
  },
  hamakua_coast: {
    id: 'hamakua_coast',
    name: 'Hamakua Coast',
    displayName: 'Hamakua',
    slug: 'honokaa-hi',
    state: 'HI',
    macroRegion: 'west_coast',
    counties: ['Hawaii'],
    primaryCities: ['Honokaa', 'Paauilo', 'Laupahoehoe'],
    latitude: 20.1,
    longitude: -155.5,
    dtcActivity: 'medium',
    primaryProducts: ['mushrooms', 'tropical_fruits', 'taro', 'vegetables', 'macadamia_nuts'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 7500, avgChillHours: 0, usdaZone: '11' },
    notes: 'Former sugar plantation land. Hamakua Mushrooms. Diverse small farms'
  },
  puna_district: {
    id: 'puna_district',
    name: 'Puna District',
    displayName: 'Puna',
    slug: 'pahoa-hi',
    state: 'HI',
    macroRegion: 'west_coast',
    counties: ['Hawaii'],
    primaryCities: ['Pahoa', 'Keaau', 'Mountain View'],
    latitude: 19.5,
    longitude: -154.9,
    dtcActivity: 'medium',
    primaryProducts: ['papaya', 'bananas', 'tropical_fruits', 'cacao', 'coffee'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 7800, avgChillHours: 0, usdaZone: '11' },
    notes: 'Rainbow papaya capital. Heavy rainfall. Volcanic soil'
  },
  maui_upcountry: {
    id: 'maui_upcountry',
    name: 'Maui Upcountry',
    displayName: 'Upcountry Maui',
    slug: 'kula-hi',
    state: 'HI',
    macroRegion: 'west_coast',
    counties: ['Maui'],
    primaryCities: ['Kula', 'Makawao', 'Pukalani'],
    latitude: 20.8,
    longitude: -156.3,
    dtcActivity: 'high',
    primaryProducts: ['onions', 'strawberries', 'vegetables', 'lavender', 'protea', 'wine_grapes'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 5500, avgChillHours: 50, usdaZone: '10' },
    notes: 'Kula onions world-famous. Ali\'i Kula Lavender. High elevation (3,000-4,000 ft)'
  },
  north_shore_oahu: {
    id: 'north_shore_oahu',
    name: 'North Shore Oahu',
    displayName: 'North Shore Oahu',
    slug: 'haleiwa-hi',
    state: 'HI',
    macroRegion: 'west_coast',
    counties: ['Honolulu'],
    primaryCities: ['Haleiwa', 'Waialua', 'Kahuku'],
    latitude: 21.6,
    longitude: -158.1,
    dtcActivity: 'high',
    primaryProducts: ['shrimp', 'tropical_fruits', 'coffee', 'cacao', 'vegetables'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 7500, avgChillHours: 0, usdaZone: '11' },
    notes: 'Kahuku shrimp farms famous. Dole pineapple plantation. Strong agritourism'
  },
  kauai: {
    id: 'kauai',
    name: 'Kauai',
    displayName: 'Kauai',
    slug: 'lihue-hi',
    state: 'HI',
    macroRegion: 'west_coast',
    counties: ['Kauai'],
    primaryCities: ['Lihue', 'Kapaa', 'Kilauea', 'Poipu'],
    latitude: 22.0,
    longitude: -159.4,
    dtcActivity: 'medium',
    primaryProducts: ['coffee', 'tropical_fruits', 'taro', 'vanilla', 'cacao'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 7200, avgChillHours: 0, usdaZone: '11' },
    notes: 'Kauai Coffee Company (largest in US). Strong farm tours. Taro cultivation'
  }
}

// ============================================================================
// ALASKA
// ============================================================================

export const ALASKA_REGIONS: Record<string, GrowingRegionExtended> = {
  matanuska_valley: {
    id: 'matanuska_valley',
    name: 'Matanuska-Susitna Valley',
    displayName: 'Mat-Su Valley',
    slug: 'palmer-ak',
    state: 'AK',
    macroRegion: 'pacific_northwest',
    counties: ['Matanuska-Susitna Borough'],
    primaryCities: ['Palmer', 'Wasilla', 'Big Lake'],
    latitude: 61.6,
    longitude: -149.1,
    dtcActivity: 'high',
    primaryProducts: ['giant_vegetables', 'potatoes', 'carrots', 'cabbage', 'dairy'],
    climate: { avgLastFrostDoy: 145, avgFirstFrostDoy: 255, frostFreeDays: 110, annualGdd50: 1400, avgChillHours: 2000, usdaZone: '4' },
    notes: 'Famous giant vegetables (100lb+ cabbages). 20-hour summer days. Alaska State Fair'
  },
  kenai_peninsula: {
    id: 'kenai_peninsula',
    name: 'Kenai Peninsula',
    displayName: 'Kenai Peninsula',
    slug: 'homer-ak',
    state: 'AK',
    macroRegion: 'pacific_northwest',
    counties: ['Kenai Peninsula Borough'],
    primaryCities: ['Homer', 'Soldotna', 'Kenai', 'Seward'],
    latitude: 59.6,
    longitude: -151.5,
    dtcActivity: 'high',
    primaryProducts: ['salmon', 'halibut', 'oysters', 'vegetables', 'berries'],
    climate: { avgLastFrostDoy: 140, avgFirstFrostDoy: 260, frostFreeDays: 120, annualGdd50: 1200, avgChillHours: 1800, usdaZone: '5' },
    notes: 'Homer: Halibut Fishing Capital. Kachemak Bay oysters. Strong seafood DTC'
  },
  fairbanks_tanana: {
    id: 'fairbanks_tanana',
    name: 'Fairbanks-Tanana Valley',
    displayName: 'Interior Alaska',
    slug: 'fairbanks-ak',
    state: 'AK',
    macroRegion: 'pacific_northwest',
    counties: ['Fairbanks North Star Borough'],
    primaryCities: ['Fairbanks', 'North Pole', 'Ester'],
    latitude: 64.8,
    longitude: -147.7,
    dtcActivity: 'medium',
    primaryProducts: ['vegetables', 'potatoes', 'birch_syrup', 'berries', 'reindeer'],
    climate: { avgLastFrostDoy: 145, avgFirstFrostDoy: 245, frostFreeDays: 100, annualGdd50: 1600, avgChillHours: 2200, usdaZone: '2' },
    notes: 'Midnight sun growing. University of Alaska agriculture research. Birch syrup unique'
  },
  southeast_alaska: {
    id: 'southeast_alaska',
    name: 'Southeast Alaska',
    displayName: 'SE Alaska',
    slug: 'juneau-ak',
    state: 'AK',
    macroRegion: 'pacific_northwest',
    counties: ['Juneau Borough', 'Sitka Borough', 'Ketchikan Gateway Borough'],
    primaryCities: ['Juneau', 'Sitka', 'Ketchikan', 'Petersburg'],
    latitude: 58.3,
    longitude: -134.4,
    dtcActivity: 'high',
    primaryProducts: ['salmon', 'crab', 'halibut', 'kelp', 'berries', 'shellfish'],
    climate: { avgLastFrostDoy: 135, avgFirstFrostDoy: 275, frostFreeDays: 140, annualGdd50: 1100, avgChillHours: 1600, usdaZone: '7' },
    notes: 'Premium wild salmon. Dungeness crab. Emerging kelp farming. Strong seafood DTC'
  },
  bristol_bay: {
    id: 'bristol_bay',
    name: 'Bristol Bay',
    displayName: 'Bristol Bay',
    slug: 'dillingham-ak',
    state: 'AK',
    macroRegion: 'pacific_northwest',
    counties: ['Bristol Bay Borough', 'Dillingham Census Area'],
    primaryCities: ['Dillingham', 'Naknek', 'King Salmon'],
    latitude: 59.0,
    longitude: -158.5,
    dtcActivity: 'medium',
    primaryProducts: ['sockeye_salmon', 'wild_salmon'],
    climate: { avgLastFrostDoy: 150, avgFirstFrostDoy: 250, frostFreeDays: 100, annualGdd50: 900, avgChillHours: 1800, usdaZone: '4' },
    notes: 'World largest sockeye salmon fishery. 40+ million fish annually. Premium wild salmon'
  }
}

// ============================================================================
// PUERTO RICO
// ============================================================================

export const PUERTO_RICO_REGIONS: Record<string, GrowingRegionExtended> = {
  central_mountains_pr: {
    id: 'central_mountains_pr',
    name: 'Puerto Rico Central Mountains',
    displayName: 'Central Mountains',
    slug: 'utuado-pr',
    state: 'PR',
    macroRegion: 'southeast',
    counties: ['Utuado', 'Adjuntas', 'Jayuya', 'Lares'],
    primaryCities: ['Utuado', 'Adjuntas', 'Jayuya', 'Lares'],
    latitude: 18.3,
    longitude: -66.7,
    dtcActivity: 'high',
    primaryProducts: ['coffee', 'citrus', 'bananas', 'plantains', 'avocados'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 6500, avgChillHours: 0, usdaZone: '12' },
    notes: 'Premium Puerto Rican coffee region. Hacienda San Pedro, Alto Grande. UNESCO heritage'
  },
  western_pr: {
    id: 'western_pr',
    name: 'Western Puerto Rico',
    displayName: 'Western PR',
    slug: 'mayaguez-pr',
    state: 'PR',
    macroRegion: 'southeast',
    counties: ['Mayaguez', 'Cabo Rojo', 'San German', 'Lajas'],
    primaryCities: ['Mayaguez', 'Cabo Rojo', 'San German'],
    latitude: 18.2,
    longitude: -67.1,
    dtcActivity: 'medium',
    primaryProducts: ['mangoes', 'avocados', 'pineapples', 'tropical_fruits', 'coffee'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 7500, avgChillHours: 0, usdaZone: '12' },
    notes: 'Prime mango growing region. Research university. Strong local markets'
  },
  southern_coastal_pr: {
    id: 'southern_coastal_pr',
    name: 'Southern Coastal Puerto Rico',
    displayName: 'Southern PR',
    slug: 'ponce-pr',
    state: 'PR',
    macroRegion: 'southeast',
    counties: ['Ponce', 'Guayanilla', 'Yauco', 'Guanica'],
    primaryCities: ['Ponce', 'Yauco', 'Guayanilla'],
    latitude: 18.0,
    longitude: -66.6,
    dtcActivity: 'medium',
    primaryProducts: ['coffee', 'citrus', 'vegetables', 'tropical_fruits'],
    climate: { avgLastFrostDoy: 0, avgFirstFrostDoy: 365, frostFreeDays: 365, annualGdd50: 7800, avgChillHours: 0, usdaZone: '12' },
    notes: 'Yauco coffee heritage. Dry climate ideal for certain crops'
  }
}

// ============================================================================
// MASTER EXPORTS
// ============================================================================

/** All growing regions combined */
const BASE_REGIONS: Record<string, GrowingRegionExtended> = {
  ...CALIFORNIA_REGIONS,
  ...PACIFIC_NW_REGIONS,
  ...FLORIDA_REGIONS,
  ...GEORGIA_REGIONS,
  ...CAROLINAS_REGIONS,
  ...TEXAS_REGIONS,
  ...SW_DESERT_REGIONS,
  ...MIDWEST_REGIONS,
  ...NORTHEAST_REGIONS,
  ...MID_ATLANTIC_REGIONS,
  ...MOUNTAIN_WEST_REGIONS,
  ...DEEP_SOUTH_REGIONS,
  ...HAWAII_REGIONS,
  ...ALASKA_REGIONS,
  ...PUERTO_RICO_REGIONS
}

/**
 * Backwards compatibility aliases for legacy region IDs
 * Maps old IDs used in products.ts to new comprehensive region IDs
 */
const LEGACY_ALIASES: Record<string, string> = {
  // California
  california_central_valley: 'san_joaquin_valley_central',
  california_coastal: 'central_coast_north',
  california_southern_desert: 'coachella_valley',
  // Pacific Northwest
  pacific_nw_yakima: 'yakima_valley',
  pacific_nw_wenatchee: 'wenatchee_valley',
  pacific_nw_hood_river: 'hood_river_valley',
  // Florida
  central_florida: 'central_florida_citrus',
  south_florida: 'homestead_redland',
  sweet_valley: 'florida_panhandle',
  // Georgia - old crop-named regions
  georgia_peach_belt: 'middle_georgia',
  south_georgia_pecan: 'southwest_georgia',
  atlanta_metro: 'georgia_piedmont',
  // Texas
  dallas_fort_worth: 'texas_blackland_prairie',
  austin_metro: 'central_texas',
  // Michigan - old crop-named regions
  nw_michigan_cherry: 'northwest_michigan',
  sw_michigan_fruit: 'southwest_michigan',
  michigan_west: 'northwest_michigan',
  michigan_southwest: 'southwest_michigan',
  // Wisconsin
  wisconsin_door_county: 'door_county',
  // New York
  new_york_hudson_valley: 'hudson_valley',
  new_york_finger_lakes: 'finger_lakes',
  // Pennsylvania
  pennsylvania_adams_county: 'adams_county_pa',
  // New Jersey
  new_jersey_pine_barrens: 'pine_barrens_nj',
  // Gulf Coast
  gulf_coast_citrus: 'florida_panhandle',
  // New England (generic)
  new_england: 'vermont_statewide',
  // South Carolina - old crop-named region
  sc_peach_ridge: 'south_carolina_ridge',
  // North Carolina - old crop-named region
  nc_sweet_potato: 'eastern_nc_coastal_plain',
  // Southwest - old metro-named regions
  albuquerque_metro: 'middle_rio_grande',
  phoenix_metro: 'salt_river_valley',
  tucson_metro: 'santa_cruz_valley',
  // Midwest - old metro-named regions
  columbus_metro: 'central_ohio',
  indianapolis_metro: 'central_indiana',
  chicago_metro: 'northern_illinois',
  twin_cities_metro: 'central_minnesota',
}

/**
 * Create alias entries that reference the canonical regions
 */
function createAliasRegion(aliasId: string, canonicalId: string): GrowingRegionExtended {
  const canonical = BASE_REGIONS[canonicalId]
  if (!canonical) {
    throw new Error(`Canonical region ${canonicalId} not found for alias ${aliasId}`)
  }
  // Return a copy with the alias ID
  return {
    ...canonical,
    id: aliasId,
    // Keep the same slug (points to canonical region's slug)
  }
}

/** All growing regions with backwards-compatible aliases */
export const ALL_GROWING_REGIONS: Record<string, GrowingRegionExtended> = {
  ...BASE_REGIONS,
  // Add legacy aliases
  ...Object.fromEntries(
    Object.entries(LEGACY_ALIASES).map(([aliasId, canonicalId]) => [
      aliasId,
      createAliasRegion(aliasId, canonicalId)
    ])
  )
}

/** West Coast regions (CA + PNW) */
export const WEST_COAST_REGIONS: Record<string, GrowingRegionExtended> = {
  ...CALIFORNIA_REGIONS,
  ...PACIFIC_NW_REGIONS
}

/** Get region by ID */
export function getRegionById(id: string): GrowingRegionExtended | undefined {
  return ALL_GROWING_REGIONS[id]
}

/** Get region by slug */
export function getRegionBySlug(slug: string): GrowingRegionExtended | undefined {
  return Object.values(ALL_GROWING_REGIONS).find(r => r.slug === slug)
}

/** Get all regions for a state */
export function getRegionsByState(state: string): GrowingRegionExtended[] {
  return Object.values(ALL_GROWING_REGIONS).filter(
    r => r.state === state || r.states?.includes(state)
  )
}

/** Get all regions for a macro region */
export function getRegionsByMacroRegion(macro: MacroRegion): GrowingRegionExtended[] {
  return Object.values(ALL_GROWING_REGIONS).filter(r => r.macroRegion === macro)
}

/** Get regions with high DTC activity */
export function getHighDtcRegions(): GrowingRegionExtended[] {
  return Object.values(ALL_GROWING_REGIONS).filter(r => r.dtcActivity === 'high')
}

/** Total region count */
export const TOTAL_REGION_COUNT = Object.keys(ALL_GROWING_REGIONS).length

/** Export region coordinates for weather API */
export const REGION_COORDINATES: Record<string, { lat: number; lon: number }> = Object.fromEntries(
  Object.entries(ALL_GROWING_REGIONS).map(([id, region]) => [
    id,
    { lat: region.latitude, lon: region.longitude }
  ])
)
