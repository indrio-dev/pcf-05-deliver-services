/**
 * Supabase Data Export
 *
 * Static export of Supabase data for Neo4j import.
 * Generated from Supabase MCP queries on 2025-12-21.
 */

// =============================================================================
// GROWING REGIONS (21 rows)
// =============================================================================

export interface SupabaseGrowingRegion {
  id: string
  name: string
  display_name: string
  state: string
  latitude: string
  longitude: string
  usda_zone: string
  avg_last_frost_doy: number
  avg_first_frost_doy: number
  frost_free_days: number
  annual_gdd_50: number
  avg_chill_hours: number
  viable_crops: string[]
}

export const SUPABASE_GROWING_REGIONS: SupabaseGrowingRegion[] = [
  { id: 'california_coastal', name: 'California Central Coast (Watsonville)', display_name: 'CA Central Coast', state: 'CA', latitude: '36.90000', longitude: '-121.80000', usda_zone: '9', avg_last_frost_doy: 45, avg_first_frost_doy: 355, frost_free_days: 310, annual_gdd_50: 2500, avg_chill_hours: 1000, viable_crops: ['strawberry', 'apple'] },
  { id: 'california_central_valley', name: 'California Central Valley (Fresno/Visalia)', display_name: 'CA Central Valley', state: 'CA', latitude: '36.70000', longitude: '-119.80000', usda_zone: '9', avg_last_frost_doy: 60, avg_first_frost_doy: 335, frost_free_days: 275, annual_gdd_50: 5000, avg_chill_hours: 600, viable_crops: ['peach', 'navel_orange', 'pomegranate', 'sweet_cherry', 'apple'] },
  { id: 'california_southern_desert', name: 'California Southern Desert (Coachella)', display_name: 'Coachella Valley', state: 'CA', latitude: '33.70000', longitude: '-116.20000', usda_zone: '10', avg_last_frost_doy: 30, avg_first_frost_doy: 350, frost_free_days: 320, annual_gdd_50: 6500, avg_chill_hours: 200, viable_crops: ['navel_orange', 'grapefruit'] },
  { id: 'central_florida', name: 'Central Florida', display_name: 'Central Florida', state: 'FL', latitude: '28.50000', longitude: '-81.40000', usda_zone: '9', avg_last_frost_doy: 52, avg_first_frost_doy: 340, frost_free_days: 288, annual_gdd_50: 5200, avg_chill_hours: 200, viable_crops: ['navel_orange', 'strawberry', 'blueberry'] },
  { id: 'georgia_piedmont', name: 'Georgia Piedmont (Peach Belt)', display_name: 'Georgia Piedmont', state: 'GA', latitude: '32.80000', longitude: '-83.60000', usda_zone: '8', avg_last_frost_doy: 90, avg_first_frost_doy: 310, frost_free_days: 220, annual_gdd_50: 3800, avg_chill_hours: 700, viable_crops: ['peach', 'blueberry', 'pecan'] },
  { id: 'indian_river', name: 'Indian River District', display_name: 'Indian River District', state: 'FL', latitude: '27.60000', longitude: '-80.40000', usda_zone: '10', avg_last_frost_doy: 45, avg_first_frost_doy: 350, frost_free_days: 305, annual_gdd_50: 5500, avg_chill_hours: 150, viable_crops: ['navel_orange', 'grapefruit', 'tangerine', 'valencia'] },
  { id: 'new_jersey_pine_barrens', name: 'New Jersey Pine Barrens', display_name: 'Pine Barrens', state: 'NJ', latitude: '39.80000', longitude: '-74.50000', usda_zone: '7', avg_last_frost_doy: 115, avg_first_frost_doy: 290, frost_free_days: 175, annual_gdd_50: 2800, avg_chill_hours: 1000, viable_crops: ['blueberry'] },
  { id: 'new_york_finger_lakes', name: 'New York Finger Lakes', display_name: 'Finger Lakes', state: 'NY', latitude: '42.50000', longitude: '-76.50000', usda_zone: '6', avg_last_frost_doy: 125, avg_first_frost_doy: 280, frost_free_days: 155, annual_gdd_50: 2400, avg_chill_hours: 1200, viable_crops: ['apple', 'blueberry', 'tart_cherry'] },
  { id: 'new_york_hudson_valley', name: 'New York Hudson Valley', display_name: 'Hudson Valley', state: 'NY', latitude: '41.70000', longitude: '-73.90000', usda_zone: '6', avg_last_frost_doy: 120, avg_first_frost_doy: 290, frost_free_days: 170, annual_gdd_50: 2600, avg_chill_hours: 1100, viable_crops: ['apple', 'blueberry'] },
  { id: 'pacific_nw_hood_river', name: 'Oregon Hood River Valley', display_name: 'Hood River Valley', state: 'OR', latitude: '45.70000', longitude: '-121.50000', usda_zone: '7', avg_last_frost_doy: 110, avg_first_frost_doy: 290, frost_free_days: 180, annual_gdd_50: 2200, avg_chill_hours: 1100, viable_crops: ['pear', 'apple', 'sweet_cherry'] },
  { id: 'pennsylvania_adams_county', name: 'Pennsylvania Adams County (Gettysburg)', display_name: 'Adams County', state: 'PA', latitude: '39.80000', longitude: '-77.20000', usda_zone: '6', avg_last_frost_doy: 115, avg_first_frost_doy: 290, frost_free_days: 175, annual_gdd_50: 2700, avg_chill_hours: 1000, viable_crops: ['apple', 'peach', 'blueberry'] },
  { id: 'south_florida', name: 'South Florida (Miami-Dade/Homestead)', display_name: 'South Florida', state: 'FL', latitude: '25.50000', longitude: '-80.40000', usda_zone: '10', avg_last_frost_doy: 15, avg_first_frost_doy: 365, frost_free_days: 350, annual_gdd_50: 7000, avg_chill_hours: 50, viable_crops: ['mango'] },
  { id: 'michigan_southwest', name: 'Southwest Michigan (Berrien County)', display_name: 'SW Michigan', state: 'MI', latitude: '42.00000', longitude: '-86.50000', usda_zone: '6', avg_last_frost_doy: 130, avg_first_frost_doy: 280, frost_free_days: 150, annual_gdd_50: 2800, avg_chill_hours: 1200, viable_crops: ['blueberry', 'apple', 'peach'] },
  { id: 'sweet_valley', name: 'Sweet Valley (FL Panhandle / S. Alabama / S. Georgia)', display_name: 'Sweet Valley', state: 'FL', latitude: '30.50000', longitude: '-86.50000', usda_zone: '9', avg_last_frost_doy: 60, avg_first_frost_doy: 330, frost_free_days: 270, annual_gdd_50: 4200, avg_chill_hours: 450, viable_crops: ['satsuma', 'navel_orange', 'pecan', 'blueberry'] },
  { id: 'texas_hill_country', name: 'Texas Hill Country', display_name: 'Texas Hill Country', state: 'TX', latitude: '30.30000', longitude: '-98.50000', usda_zone: '8', avg_last_frost_doy: 80, avg_first_frost_doy: 320, frost_free_days: 240, annual_gdd_50: 4200, avg_chill_hours: 500, viable_crops: ['peach', 'pecan'] },
  { id: 'texas_pecan_belt', name: 'Texas Pecan Belt (Central)', display_name: 'Texas Pecan Belt', state: 'TX', latitude: '31.50000', longitude: '-97.00000', usda_zone: '8', avg_last_frost_doy: 75, avg_first_frost_doy: 320, frost_free_days: 245, annual_gdd_50: 4500, avg_chill_hours: 600, viable_crops: ['pecan'] },
  { id: 'texas_rgv', name: 'Texas Rio Grande Valley', display_name: 'Texas RGV', state: 'TX', latitude: '26.20000', longitude: '-98.20000', usda_zone: '9', avg_last_frost_doy: 35, avg_first_frost_doy: 355, frost_free_days: 320, annual_gdd_50: 6000, avg_chill_hours: 200, viable_crops: ['grapefruit', 'navel_orange', 'tangerine'] },
  { id: 'pacific_nw_wenatchee', name: 'Washington Wenatchee Valley', display_name: 'Wenatchee Valley', state: 'WA', latitude: '47.40000', longitude: '-120.30000', usda_zone: '6', avg_last_frost_doy: 115, avg_first_frost_doy: 285, frost_free_days: 170, annual_gdd_50: 2300, avg_chill_hours: 1300, viable_crops: ['apple', 'sweet_cherry', 'pear'] },
  { id: 'pacific_nw_yakima', name: 'Washington Yakima Valley', display_name: 'Yakima Valley', state: 'WA', latitude: '46.60000', longitude: '-120.50000', usda_zone: '6', avg_last_frost_doy: 120, avg_first_frost_doy: 290, frost_free_days: 170, annual_gdd_50: 2400, avg_chill_hours: 1200, viable_crops: ['apple', 'sweet_cherry', 'pear'] },
  { id: 'michigan_west', name: 'West Michigan (Grand Traverse/Leelanau)', display_name: 'West Michigan', state: 'MI', latitude: '44.80000', longitude: '-85.60000', usda_zone: '5', avg_last_frost_doy: 135, avg_first_frost_doy: 275, frost_free_days: 140, annual_gdd_50: 2600, avg_chill_hours: 1400, viable_crops: ['tart_cherry', 'sweet_cherry', 'apple', 'blueberry'] },
  { id: 'wisconsin_door_county', name: 'Wisconsin Door County', display_name: 'Door County', state: 'WI', latitude: '45.00000', longitude: '-87.20000', usda_zone: '5', avg_last_frost_doy: 140, avg_first_frost_doy: 270, frost_free_days: 130, annual_gdd_50: 2400, avg_chill_hours: 1500, viable_crops: ['tart_cherry', 'apple'] },
]

// =============================================================================
// CROPS (15 rows)
// =============================================================================

export interface SupabaseCrop {
  id: string
  name: string
  display_name: string
  category: string
  base_temp: string
  gdd_to_maturity: number
  gdd_to_peak: number
  gdd_window: number
  chill_hours_required: number | null
  is_climacteric: boolean
  notes: string | null
}

export const SUPABASE_CROPS: SupabaseCrop[] = [
  { id: 'apple', name: 'apple', display_name: 'Apple', category: 'pome_fruit', base_temp: '43.00', gdd_to_maturity: 2200, gdd_to_peak: 2500, gdd_window: 200, chill_hours_required: 1000, is_climacteric: true, notes: null },
  { id: 'blueberry', name: 'blueberry', display_name: 'Blueberry', category: 'berry', base_temp: '45.00', gdd_to_maturity: 1200, gdd_to_peak: 1400, gdd_window: 100, chill_hours_required: 800, is_climacteric: false, notes: 'Non-climacteric, multiple picks over 4-6 weeks' },
  { id: 'grapefruit', name: 'grapefruit', display_name: 'Grapefruit', category: 'citrus', base_temp: '55.00', gdd_to_maturity: 5500, gdd_to_peak: 7100, gdd_window: 4000, chill_hours_required: null, is_climacteric: false, notes: 'Very long harvest window' },
  { id: 'mango', name: 'mango', display_name: 'Mango', category: 'tropical', base_temp: '60.00', gdd_to_maturity: 2800, gdd_to_peak: 3200, gdd_window: 300, chill_hours_required: 0, is_climacteric: true, notes: 'Climacteric, chill injury below 55F' },
  { id: 'navel_orange', name: 'navel_orange', display_name: 'Navel Orange', category: 'citrus', base_temp: '55.00', gdd_to_maturity: 5100, gdd_to_peak: 6100, gdd_window: 2000, chill_hours_required: null, is_climacteric: false, notes: 'Quality holds well on tree' },
  { id: 'peach', name: 'peach', display_name: 'Peach', category: 'stone_fruit', base_temp: '45.00', gdd_to_maturity: 1800, gdd_to_peak: 2000, gdd_window: 150, chill_hours_required: 650, is_climacteric: true, notes: null },
  { id: 'pear', name: 'pear', display_name: 'Pear', category: 'pome_fruit', base_temp: '40.00', gdd_to_maturity: 2400, gdd_to_peak: 2700, gdd_window: 800, chill_hours_required: 800, is_climacteric: true, notes: 'MUST ripen OFF tree, unique among tree fruits' },
  { id: 'pecan', name: 'pecan', display_name: 'Pecan', category: 'nut', base_temp: '65.00', gdd_to_maturity: 2600, gdd_to_peak: 2900, gdd_window: 400, chill_hours_required: 500, is_climacteric: false, notes: 'Quality = oil content not Brix, alternate bearing' },
  { id: 'pomegranate', name: 'pomegranate', display_name: 'Pomegranate', category: 'tropical', base_temp: '50.00', gdd_to_maturity: 3800, gdd_to_peak: 4500, gdd_window: 1000, chill_hours_required: 150, is_climacteric: false, notes: 'Non-climacteric, stores well' },
  { id: 'satsuma', name: 'satsuma', display_name: 'Satsuma Mandarin', category: 'citrus', base_temp: '55.00', gdd_to_maturity: 4600, gdd_to_peak: 5100, gdd_window: 700, chill_hours_required: null, is_climacteric: false, notes: 'Early season' },
  { id: 'strawberry', name: 'strawberry', display_name: 'Strawberry', category: 'berry', base_temp: '50.00', gdd_to_maturity: 700, gdd_to_peak: 1300, gdd_window: 1100, chill_hours_required: null, is_climacteric: false, notes: 'Non-climacteric, must harvest at full color' },
  { id: 'sweet_cherry', name: 'sweet_cherry', display_name: 'Sweet Cherry', category: 'stone_fruit', base_temp: '40.00', gdd_to_maturity: 1400, gdd_to_peak: 1550, gdd_window: 100, chill_hours_required: 1100, is_climacteric: false, notes: null },
  { id: 'tangerine', name: 'tangerine', display_name: 'Tangerine', category: 'citrus', base_temp: '55.00', gdd_to_maturity: 5300, gdd_to_peak: 5700, gdd_window: 900, chill_hours_required: null, is_climacteric: false, notes: 'Peak for holidays' },
  { id: 'tart_cherry', name: 'tart_cherry', display_name: 'Tart Cherry', category: 'stone_fruit', base_temp: '39.20', gdd_to_maturity: 1000, gdd_to_peak: 1100, gdd_window: 80, chill_hours_required: 954, is_climacteric: false, notes: 'Primarily for processing. Model R²=0.992 phenology (Zavalloni et al. 2006)' },
  { id: 'valencia', name: 'valencia', display_name: 'Valencia Orange', category: 'citrus', base_temp: '55.00', gdd_to_maturity: 8000, gdd_to_peak: 9000, gdd_window: 2200, chill_hours_required: null, is_climacteric: false, notes: 'Late season Mar-Jun' },
]

// =============================================================================
// CULTIVARS (12 rows)
// =============================================================================

export interface SupabaseCultivar {
  id: string
  crop_id: string
  name: string
  display_name: string
  brix_base: string
  timing_class: string
  days_offset: number
  notes: string | null
}

export const SUPABASE_CULTIVARS: SupabaseCultivar[] = [
  { id: 'arkansas_black', crop_id: 'apple', name: 'arkansas_black', display_name: 'Arkansas Black', brix_base: '14.5', timing_class: 'late', days_offset: 170, notes: 'Heirloom (1870), artisan tier, exceptional flavor' },
  { id: 'cara_cara', crop_id: 'navel_orange', name: 'cara_cara', display_name: 'Cara Cara Navel', brix_base: '12.0', timing_class: 'mid', days_offset: 260, notes: 'Modern nutrient focus (1976), lycopene-rich pink flesh' },
  { id: 'cosmic_crisp', crop_id: 'apple', name: 'cosmic_crisp', display_name: 'Cosmic Crisp', brix_base: '12.0', timing_class: 'late', days_offset: 150, notes: 'Commercial (2019), bred for shipping/storage' },
  { id: 'elberta', crop_id: 'peach', name: 'elberta', display_name: 'Elberta Peach', brix_base: '12.5', timing_class: 'mid', days_offset: 95, notes: 'Heirloom (1870), premium tier, freestone' },
  { id: 'florida_radiance', crop_id: 'strawberry', name: 'florida_radiance', display_name: 'Florida Radiance', brix_base: '7.5', timing_class: 'early', days_offset: 50, notes: 'Commercial (2008), bred for yield/disease resistance' },
  { id: 'georgia_belle', crop_id: 'peach', name: 'georgia_belle', display_name: 'Georgia Belle Peach', brix_base: '14.0', timing_class: 'mid', days_offset: 100, notes: 'Heirloom (1870), artisan tier, exceptional white peach' },
  { id: 'honeycrisp', crop_id: 'apple', name: 'honeycrisp', display_name: 'Honeycrisp', brix_base: '13.0', timing_class: 'mid', days_offset: 135, notes: 'Modern flavor focus (1991), premium tier' },
  { id: 'lane_late', crop_id: 'navel_orange', name: 'lane_late', display_name: 'Lane Late Navel', brix_base: '10.5', timing_class: 'late', days_offset: 310, notes: 'Commercial variety (1950), good for shipping' },
  { id: 'rio_red', crop_id: 'grapefruit', name: 'rio_red', display_name: 'Rio Red Grapefruit', brix_base: '10.0', timing_class: 'mid', days_offset: 290, notes: 'Modern nutrient focus (1984), lycopene-rich red flesh' },
  { id: 'ruby_red', crop_id: 'grapefruit', name: 'ruby_red', display_name: 'Ruby Red Grapefruit', brix_base: '9.5', timing_class: 'mid', days_offset: 280, notes: 'True heritage (1929), classic grapefruit flavor' },
  { id: 'sweet_charlie', crop_id: 'strawberry', name: 'sweet_charlie', display_name: 'Sweet Charlie', brix_base: '8.5', timing_class: 'early', days_offset: 55, notes: 'Modern flavor focus (1992), premium tier' },
  { id: 'washington_navel', crop_id: 'navel_orange', name: 'washington_navel', display_name: 'Washington Navel', brix_base: '11.5', timing_class: 'mid', days_offset: 270, notes: 'Pre-1870 heirloom, premium tier, classic navel flavor' },
]

// =============================================================================
// ROOTSTOCKS (12 rows)
// =============================================================================

export interface SupabaseRootstock {
  id: string
  crop_id: string
  name: string
  display_name: string
  brix_modifier: string
  vigor: string
  notes: string | null
}

export const SUPABASE_ROOTSTOCKS: SupabaseRootstock[] = [
  { id: 'c35', crop_id: 'navel_orange', name: 'c35', display_name: 'C-35 Citrange', brix_modifier: '0.6', vigor: 'semi-dwarf', notes: 'Similar quality to Carrizo, smaller tree. Good for high-density.' },
  { id: 'carrizo', crop_id: 'navel_orange', name: 'carrizo', display_name: 'Carrizo Citrange', brix_modifier: '0.6', vigor: 'standard', notes: 'Consistently lifts SSC. Most common commercial rootstock. CTV tolerant.' },
  { id: 'citation', crop_id: 'peach', name: 'citation', display_name: 'Citation', brix_modifier: '0.2', vigor: 'semi-dwarf', notes: 'Semi-dwarf interstock. Better fruit color, may improve Brix.' },
  { id: 'cleopatra', crop_id: 'navel_orange', name: 'cleopatra', display_name: 'Cleopatra Mandarin', brix_modifier: '0.2', vigor: 'standard', notes: 'Good SSC but slow to bear. Traditional mandarin rootstock.' },
  { id: 'guardian', crop_id: 'peach', name: 'guardian', display_name: 'Guardian (BY520-9)', brix_modifier: '0.0', vigor: 'standard', notes: 'PTSL resistant. Southeast preferred.' },
  { id: 'lovell', crop_id: 'peach', name: 'lovell', display_name: 'Lovell', brix_modifier: '0.0', vigor: 'standard', notes: 'Standard peach rootstock. Good vigor and adaptability.' },
  { id: 'macrophylla', crop_id: 'navel_orange', name: 'macrophylla', display_name: 'Macrophylla (Alemow)', brix_modifier: '-0.8', vigor: 'standard', notes: 'Lowest SSC grouping. Fast growing, short-lived. Lemons only.' },
  { id: 'rough_lemon', crop_id: 'navel_orange', name: 'rough_lemon', display_name: 'Rough Lemon', brix_modifier: '-0.7', vigor: 'standard', notes: 'Vigorous, dilutes SSC. High yield but lower quality.' },
  { id: 'sour_orange', crop_id: 'navel_orange', name: 'sour_orange', display_name: 'Sour Orange', brix_modifier: '0.5', vigor: 'standard', notes: 'Excellent quality but CTV susceptible. Legacy blocks only.' },
  { id: 'swingle', crop_id: 'navel_orange', name: 'swingle', display_name: 'Swingle Citrumelo', brix_modifier: '-0.5', vigor: 'standard', notes: 'Lower SSC, granulation risk for navels. High yield, disease resistant.' },
  { id: 'trifoliate', crop_id: 'navel_orange', name: 'trifoliate', display_name: 'Trifoliate Orange (Poncirus)', brix_modifier: '0.5', vigor: 'dwarf', notes: 'High SSC, smaller fruit. Best cold hardiness (5F). CTV immune.' },
  { id: 'volkamer', crop_id: 'navel_orange', name: 'volkamer', display_name: 'Volkamer Lemon', brix_modifier: '-0.7', vigor: 'standard', notes: 'Similar to Rough Lemon. Used for lemons where SSC less critical.' },
]

// =============================================================================
// HARVEST WINDOWS (21 rows)
// =============================================================================

export interface SupabaseHarvestWindow {
  id: number
  crop_id: string
  region_id: string
  year: number
  harvest_start: string
  harvest_end: string
  optimal_start: string
  optimal_end: string
  predicted_brix: string
  confidence: string
}

export const SUPABASE_HARVEST_WINDOWS: SupabaseHarvestWindow[] = [
  { id: 21, crop_id: 'apple', region_id: 'california_central_valley', year: 2025, harvest_start: '2025-08-01', harvest_end: '2025-10-15', optimal_start: '2025-08-15', optimal_end: '2025-09-30', predicted_brix: '12.5', confidence: '0.80' },
  { id: 18, crop_id: 'apple', region_id: 'michigan_west', year: 2025, harvest_start: '2025-09-01', harvest_end: '2025-11-15', optimal_start: '2025-09-15', optimal_end: '2025-10-31', predicted_brix: '13.0', confidence: '0.85' },
  { id: 20, crop_id: 'apple', region_id: 'new_york_finger_lakes', year: 2025, harvest_start: '2025-09-01', harvest_end: '2025-11-15', optimal_start: '2025-09-15', optimal_end: '2025-10-31', predicted_brix: '13.0', confidence: '0.85' },
  { id: 19, crop_id: 'apple', region_id: 'new_york_hudson_valley', year: 2025, harvest_start: '2025-09-01', harvest_end: '2025-11-15', optimal_start: '2025-09-15', optimal_end: '2025-10-31', predicted_brix: '13.0', confidence: '0.85' },
  { id: 17, crop_id: 'apple', region_id: 'pacific_nw_wenatchee', year: 2025, harvest_start: '2025-08-20', harvest_end: '2025-11-15', optimal_start: '2025-09-15', optimal_end: '2025-10-31', predicted_brix: '13.5', confidence: '0.90' },
  { id: 16, crop_id: 'apple', region_id: 'pacific_nw_yakima', year: 2025, harvest_start: '2025-08-15', harvest_end: '2025-10-31', optimal_start: '2025-09-01', optimal_end: '2025-10-15', predicted_brix: '13.5', confidence: '0.90' },
  { id: 8, crop_id: 'grapefruit', region_id: 'california_southern_desert', year: 2025, harvest_start: '2024-11-01', harvest_end: '2025-05-31', optimal_start: '2025-01-01', optimal_end: '2025-03-31', predicted_brix: '9.5', confidence: '0.75' },
  { id: 6, crop_id: 'grapefruit', region_id: 'indian_river', year: 2025, harvest_start: '2024-10-01', harvest_end: '2025-06-30', optimal_start: '2024-12-15', optimal_end: '2025-03-15', predicted_brix: '10.5', confidence: '0.90' },
  { id: 7, crop_id: 'grapefruit', region_id: 'texas_rgv', year: 2025, harvest_start: '2024-10-15', harvest_end: '2025-05-31', optimal_start: '2024-12-01', optimal_end: '2025-03-31', predicted_brix: '10.0', confidence: '0.85' },
  { id: 4, crop_id: 'navel_orange', region_id: 'california_central_valley', year: 2025, harvest_start: '2024-11-15', harvest_end: '2025-03-31', optimal_start: '2025-01-01', optimal_end: '2025-02-28', predicted_brix: '11.8', confidence: '0.80' },
  { id: 5, crop_id: 'navel_orange', region_id: 'california_southern_desert', year: 2025, harvest_start: '2024-11-01', harvest_end: '2025-03-15', optimal_start: '2024-12-01', optimal_end: '2025-02-15', predicted_brix: '11.5', confidence: '0.75' },
  { id: 2, crop_id: 'navel_orange', region_id: 'central_florida', year: 2025, harvest_start: '2024-11-15', harvest_end: '2025-03-15', optimal_start: '2025-01-01', optimal_end: '2025-02-15', predicted_brix: '11.8', confidence: '0.85' },
  { id: 1, crop_id: 'navel_orange', region_id: 'indian_river', year: 2025, harvest_start: '2024-11-01', harvest_end: '2025-01-31', optimal_start: '2024-11-21', optimal_end: '2025-01-07', predicted_brix: '12.1', confidence: '0.90' },
  { id: 3, crop_id: 'navel_orange', region_id: 'texas_rgv', year: 2025, harvest_start: '2024-11-01', harvest_end: '2025-03-31', optimal_start: '2024-12-15', optimal_end: '2025-02-28', predicted_brix: '11.5', confidence: '0.80' },
  { id: 13, crop_id: 'peach', region_id: 'california_central_valley', year: 2025, harvest_start: '2025-06-01', harvest_end: '2025-08-31', optimal_start: '2025-06-15', optimal_end: '2025-07-31', predicted_brix: '12.8', confidence: '0.80' },
  { id: 11, crop_id: 'peach', region_id: 'georgia_piedmont', year: 2025, harvest_start: '2025-06-15', harvest_end: '2025-08-15', optimal_start: '2025-07-01', optimal_end: '2025-07-31', predicted_brix: '13.0', confidence: '0.90' },
  { id: 14, crop_id: 'peach', region_id: 'michigan_southwest', year: 2025, harvest_start: '2025-07-15', harvest_end: '2025-09-15', optimal_start: '2025-08-01', optimal_end: '2025-08-31', predicted_brix: '13.0', confidence: '0.85' },
  { id: 15, crop_id: 'peach', region_id: 'pennsylvania_adams_county', year: 2025, harvest_start: '2025-07-15', harvest_end: '2025-09-15', optimal_start: '2025-08-01', optimal_end: '2025-08-31', predicted_brix: '12.5', confidence: '0.80' },
  { id: 12, crop_id: 'peach', region_id: 'texas_hill_country', year: 2025, harvest_start: '2025-05-15', harvest_end: '2025-07-15', optimal_start: '2025-06-01', optimal_end: '2025-06-30', predicted_brix: '12.5', confidence: '0.85' },
  { id: 10, crop_id: 'strawberry', region_id: 'california_coastal', year: 2025, harvest_start: '2025-04-01', harvest_end: '2025-11-30', optimal_start: '2025-05-01', optimal_end: '2025-06-30', predicted_brix: '8.0', confidence: '0.80' },
  { id: 9, crop_id: 'strawberry', region_id: 'central_florida', year: 2025, harvest_start: '2024-12-01', harvest_end: '2025-04-30', optimal_start: '2025-01-15', optimal_end: '2025-03-31', predicted_brix: '8.5', confidence: '0.90' },
]

// =============================================================================
// NUTRIENTS (107 rows) - Categories only for brevity, full list in separate export
// =============================================================================

export interface SupabaseNutrient {
  id: string
  name: string
  display_name: string
  abbreviation: string | null
  category: string
  subcategory: string
  default_unit: string
  is_beneficial: boolean
  is_essential: boolean
  daily_value: string | null
  daily_value_unit: string | null
  applies_to_produce: boolean
  applies_to_meat: boolean
  applies_to_dairy: boolean
  applies_to_eggs: boolean
  applies_to_seafood: boolean
  notes: string | null
}

// Categories for summary:
// - amino_acid: 20 (essential, conditional, non-essential)
// - contaminant: 3 (herbicide, pesticide)
// - fatty_acid: 17 (omega_3, omega_6, omega_9, CLA, MUFA, PUFA, SFA, trans, sterol)
// - fiber: 3 (dietary_fiber)
// - heavy_metal: 4 (toxic_metal)
// - mineral: 18 (macro_mineral, trace_mineral)
// - other: 1 (quality_indicator - Brix)
// - phytochemical: 16 (anthocyanin, carotenoid, flavonoid, phenolic)
// - proximate: 6 (composition, energy, macronutrient)
// - sugar: 6 (simple_sugar)
// - vitamin: 13 (b_vitamin, fat_soluble, water_soluble, other_vitamin)

export const SUPABASE_NUTRIENTS: SupabaseNutrient[] = [
  // Amino Acids - Essential (9)
  { id: 'histidine', name: 'Histidine', display_name: 'Histidine', abbreviation: 'His', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'isoleucine', name: 'Isoleucine', display_name: 'Isoleucine', abbreviation: 'Ile', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'leucine', name: 'Leucine', display_name: 'Leucine', abbreviation: 'Leu', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'lysine', name: 'Lysine', display_name: 'Lysine', abbreviation: 'Lys', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'methionine', name: 'Methionine', display_name: 'Methionine', abbreviation: 'Met', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'phenylalanine', name: 'Phenylalanine', display_name: 'Phenylalanine', abbreviation: 'Phe', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'threonine', name: 'Threonine', display_name: 'Threonine', abbreviation: 'Thr', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'tryptophan', name: 'Tryptophan', display_name: 'Tryptophan', abbreviation: 'Trp', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'valine', name: 'Valine', display_name: 'Valine', abbreviation: 'Val', category: 'amino_acid', subcategory: 'essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Amino Acids - Conditional (6)
  { id: 'arginine', name: 'Arginine', display_name: 'Arginine', abbreviation: 'Arg', category: 'amino_acid', subcategory: 'conditional', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'cysteine', name: 'Cysteine', display_name: 'Cysteine', abbreviation: 'Cys', category: 'amino_acid', subcategory: 'conditional', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'glutamine', name: 'Glutamine', display_name: 'Glutamine', abbreviation: 'Gln', category: 'amino_acid', subcategory: 'conditional', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'glycine', name: 'Glycine', display_name: 'Glycine', abbreviation: 'Gly', category: 'amino_acid', subcategory: 'conditional', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'proline', name: 'Proline', display_name: 'Proline', abbreviation: 'Pro', category: 'amino_acid', subcategory: 'conditional', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'tyrosine', name: 'Tyrosine', display_name: 'Tyrosine', abbreviation: 'Tyr', category: 'amino_acid', subcategory: 'conditional', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Amino Acids - Non-essential (5)
  { id: 'alanine', name: 'Alanine', display_name: 'Alanine', abbreviation: 'Ala', category: 'amino_acid', subcategory: 'non_essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'asparagine', name: 'Asparagine', display_name: 'Asparagine', abbreviation: 'Asn', category: 'amino_acid', subcategory: 'non_essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'aspartic_acid', name: 'Aspartic Acid', display_name: 'Aspartic Acid', abbreviation: 'Asp', category: 'amino_acid', subcategory: 'non_essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'glutamic_acid', name: 'Glutamic Acid', display_name: 'Glutamic Acid', abbreviation: 'Glu', category: 'amino_acid', subcategory: 'non_essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'serine', name: 'Serine', display_name: 'Serine', abbreviation: 'Ser', category: 'amino_acid', subcategory: 'non_essential', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Fatty Acids - Omega 3 (5)
  { id: 'omega_3_total', name: 'Omega-3', display_name: 'Total Omega-3 Fatty Acids', abbreviation: 'n-3', category: 'fatty_acid', subcategory: 'omega_3', default_unit: 'g/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'ala', name: 'Alpha-Linolenic Acid', display_name: 'ALA (18:3 n-3)', abbreviation: 'ALA', category: 'fatty_acid', subcategory: 'omega_3', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'epa', name: 'Eicosapentaenoic Acid', display_name: 'EPA (20:5 n-3)', abbreviation: 'EPA', category: 'fatty_acid', subcategory: 'omega_3', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'dpa_n3', name: 'Docosapentaenoic Acid (n-3)', display_name: 'DPA n-3 (22:5 n-3)', abbreviation: 'DPA', category: 'fatty_acid', subcategory: 'omega_3', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'dha', name: 'Docosahexaenoic Acid', display_name: 'DHA (22:6 n-3)', abbreviation: 'DHA', category: 'fatty_acid', subcategory: 'omega_3', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Fatty Acids - Omega 6 (4)
  { id: 'omega_6_total', name: 'Omega-6', display_name: 'Total Omega-6 Fatty Acids', abbreviation: 'n-6', category: 'fatty_acid', subcategory: 'omega_6', default_unit: 'g/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'linoleic', name: 'Linoleic Acid', display_name: 'LA (18:2 n-6)', abbreviation: 'LA', category: 'fatty_acid', subcategory: 'omega_6', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'gla', name: 'Gamma-Linolenic Acid', display_name: 'GLA (18:3 n-6)', abbreviation: 'GLA', category: 'fatty_acid', subcategory: 'omega_6', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'arachidonic', name: 'Arachidonic Acid', display_name: 'AA (20:4 n-6)', abbreviation: 'AA', category: 'fatty_acid', subcategory: 'omega_6', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Fatty Acids - Other (8)
  { id: 'omega_9_total', name: 'Omega-9', display_name: 'Total Omega-9 Fatty Acids', abbreviation: 'n-9', category: 'fatty_acid', subcategory: 'omega_9', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'oleic', name: 'Oleic Acid', display_name: 'Oleic (18:1 n-9)', abbreviation: null, category: 'fatty_acid', subcategory: 'omega_9', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'sfa_total', name: 'Saturated Fat', display_name: 'Total Saturated Fatty Acids', abbreviation: 'SFA', category: 'fatty_acid', subcategory: 'saturated', default_unit: 'g/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'mufa_total', name: 'Monounsaturated Fat', display_name: 'Total Monounsaturated Fatty Acids', abbreviation: 'MUFA', category: 'fatty_acid', subcategory: 'monounsaturated', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'pufa_total', name: 'Polyunsaturated Fat', display_name: 'Total Polyunsaturated Fatty Acids', abbreviation: 'PUFA', category: 'fatty_acid', subcategory: 'polyunsaturated', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'trans_total', name: 'Trans Fat', display_name: 'Total Trans Fatty Acids', abbreviation: 'TFA', category: 'fatty_acid', subcategory: 'trans', default_unit: 'g/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'cholesterol', name: 'Cholesterol', display_name: 'Cholesterol', abbreviation: 'Chol', category: 'fatty_acid', subcategory: 'sterol', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'cla_total', name: 'Conjugated Linoleic Acid', display_name: 'Total CLA', abbreviation: 'CLA', category: 'fatty_acid', subcategory: 'cla', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Higher in grass-fed ruminant products' },
  // Minerals - Macro (6)
  { id: 'calcium', name: 'Calcium', display_name: 'Calcium', abbreviation: 'Ca', category: 'mineral', subcategory: 'macro_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '1300', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'phosphorus', name: 'Phosphorus', display_name: 'Phosphorus', abbreviation: 'P', category: 'mineral', subcategory: 'macro_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '1250', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'potassium', name: 'Potassium', display_name: 'Potassium', abbreviation: 'K', category: 'mineral', subcategory: 'macro_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '4700', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'sodium', name: 'Sodium', display_name: 'Sodium', abbreviation: 'Na', category: 'mineral', subcategory: 'macro_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '2300', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'magnesium', name: 'Magnesium', display_name: 'Magnesium', abbreviation: 'Mg', category: 'mineral', subcategory: 'macro_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '420', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'sulfur', name: 'Sulfur', display_name: 'Sulfur', abbreviation: 'S', category: 'mineral', subcategory: 'macro_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Minerals - Trace (12)
  { id: 'iron', name: 'Iron', display_name: 'Iron', abbreviation: 'Fe', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '18', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'zinc', name: 'Zinc', display_name: 'Zinc', abbreviation: 'Zn', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '11', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'copper', name: 'Copper', display_name: 'Copper', abbreviation: 'Cu', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '0.9', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'manganese', name: 'Manganese', display_name: 'Manganese', abbreviation: 'Mn', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '2.3', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'selenium', name: 'Selenium', display_name: 'Selenium', abbreviation: 'Se', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '55', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'iodine', name: 'Iodine', display_name: 'Iodine', abbreviation: 'I', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '150', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'chromium', name: 'Chromium', display_name: 'Chromium', abbreviation: 'Cr', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '35', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'molybdenum', name: 'Molybdenum', display_name: 'Molybdenum', abbreviation: 'Mo', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '45', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'boron', name: 'Boron', display_name: 'Boron', abbreviation: 'B', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'cobalt', name: 'Cobalt', display_name: 'Cobalt', abbreviation: 'Co', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'nickel', name: 'Nickel', display_name: 'Nickel', abbreviation: 'Ni', category: 'mineral', subcategory: 'trace_mineral', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Vitamins - Fat Soluble (5)
  { id: 'vitamin_a', name: 'Vitamin A', display_name: 'Vitamin A', abbreviation: 'Vit A', category: 'vitamin', subcategory: 'fat_soluble', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '900', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'vitamin_d', name: 'Vitamin D', display_name: 'Vitamin D', abbreviation: 'Vit D', category: 'vitamin', subcategory: 'fat_soluble', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '20', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'vitamin_e', name: 'Vitamin E', display_name: 'Vitamin E', abbreviation: 'Vit E', category: 'vitamin', subcategory: 'fat_soluble', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '15', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'vitamin_k1', name: 'Vitamin K1', display_name: 'Vitamin K1 (Phylloquinone)', abbreviation: 'K1', category: 'vitamin', subcategory: 'fat_soluble', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '120', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'vitamin_k2', name: 'Vitamin K2', display_name: 'Vitamin K2 (Menaquinone)', abbreviation: 'K2', category: 'vitamin', subcategory: 'fat_soluble', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Vitamins - B Vitamins (8)
  { id: 'thiamin_b1', name: 'Thiamin', display_name: 'Vitamin B1 (Thiamin)', abbreviation: 'B1', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '1.2', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'riboflavin_b2', name: 'Riboflavin', display_name: 'Vitamin B2 (Riboflavin)', abbreviation: 'B2', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '1.3', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'niacin_b3', name: 'Niacin', display_name: 'Vitamin B3 (Niacin)', abbreviation: 'B3', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '16', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'pantothenic_b5', name: 'Pantothenic Acid', display_name: 'Vitamin B5 (Pantothenic Acid)', abbreviation: 'B5', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '5', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'pyridoxine_b6', name: 'Pyridoxine', display_name: 'Vitamin B6 (Pyridoxine)', abbreviation: 'B6', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '1.7', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'biotin_b7', name: 'Biotin', display_name: 'Vitamin B7 (Biotin)', abbreviation: 'B7', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '30', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'folate_b9', name: 'Folate', display_name: 'Vitamin B9 (Folate)', abbreviation: 'B9', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '400', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'cobalamin_b12', name: 'Cobalamin', display_name: 'Vitamin B12 (Cobalamin)', abbreviation: 'B12', category: 'vitamin', subcategory: 'b_vitamin', default_unit: 'ug/100g', is_beneficial: true, is_essential: true, daily_value: '2.4', daily_value_unit: 'ug', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Vitamins - Other (2)
  { id: 'vitamin_c', name: 'Vitamin C', display_name: 'Vitamin C (Ascorbic Acid)', abbreviation: 'Vit C', category: 'vitamin', subcategory: 'water_soluble', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '90', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'choline', name: 'Choline', display_name: 'Choline', abbreviation: null, category: 'vitamin', subcategory: 'other_vitamin', default_unit: 'mg/100g', is_beneficial: true, is_essential: true, daily_value: '550', daily_value_unit: 'mg', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Proximate (6)
  { id: 'moisture', name: 'Moisture', display_name: 'Moisture', abbreviation: null, category: 'proximate', subcategory: 'composition', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'ash', name: 'Ash', display_name: 'Ash (Minerals)', abbreviation: null, category: 'proximate', subcategory: 'composition', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'calories', name: 'Calories', display_name: 'Energy', abbreviation: 'kcal', category: 'proximate', subcategory: 'energy', default_unit: 'kcal/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'protein', name: 'Protein', display_name: 'Protein', abbreviation: null, category: 'proximate', subcategory: 'macronutrient', default_unit: 'g/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'total_fat', name: 'Total Fat', display_name: 'Total Fat', abbreviation: null, category: 'proximate', subcategory: 'macronutrient', default_unit: 'g/100g', is_beneficial: true, is_essential: true, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'carbohydrates', name: 'Carbohydrates', display_name: 'Carbohydrates', abbreviation: 'Carbs', category: 'proximate', subcategory: 'macronutrient', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Fiber (3)
  { id: 'total_fiber', name: 'Total Dietary Fiber', display_name: 'Total Fiber', abbreviation: null, category: 'fiber', subcategory: 'dietary_fiber', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: '28', daily_value_unit: 'g', applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'soluble_fiber', name: 'Soluble Fiber', display_name: 'Soluble Fiber', abbreviation: null, category: 'fiber', subcategory: 'dietary_fiber', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'insoluble_fiber', name: 'Insoluble Fiber', display_name: 'Insoluble Fiber', abbreviation: null, category: 'fiber', subcategory: 'dietary_fiber', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Sugar (6)
  { id: 'total_sugars', name: 'Total Sugars', display_name: 'Total Sugars', abbreviation: null, category: 'sugar', subcategory: 'simple_sugar', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'glucose', name: 'Glucose', display_name: 'Glucose', abbreviation: 'Glu', category: 'sugar', subcategory: 'simple_sugar', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'fructose', name: 'Fructose', display_name: 'Fructose', abbreviation: 'Fru', category: 'sugar', subcategory: 'simple_sugar', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'sucrose', name: 'Sucrose', display_name: 'Sucrose', abbreviation: 'Suc', category: 'sugar', subcategory: 'simple_sugar', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'lactose', name: 'Lactose', display_name: 'Lactose', abbreviation: 'Lac', category: 'sugar', subcategory: 'simple_sugar', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'maltose', name: 'Maltose', display_name: 'Maltose', abbreviation: 'Mal', category: 'sugar', subcategory: 'simple_sugar', default_unit: 'g/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Phytochemicals - Carotenoids (7)
  { id: 'total_carotenoids', name: 'Total Carotenoids', display_name: 'Total Carotenoids', abbreviation: null, category: 'phytochemical', subcategory: 'carotenoid', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'beta_carotene', name: 'Beta-Carotene', display_name: 'Beta-Carotene', abbreviation: 'β-Car', category: 'phytochemical', subcategory: 'carotenoid', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'alpha_carotene', name: 'Alpha-Carotene', display_name: 'Alpha-Carotene', abbreviation: 'α-Car', category: 'phytochemical', subcategory: 'carotenoid', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'beta_cryptoxanthin', name: 'Beta-Cryptoxanthin', display_name: 'Beta-Cryptoxanthin', abbreviation: 'β-Cry', category: 'phytochemical', subcategory: 'carotenoid', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'lycopene', name: 'Lycopene', display_name: 'Lycopene', abbreviation: 'Lyc', category: 'phytochemical', subcategory: 'carotenoid', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'lutein', name: 'Lutein', display_name: 'Lutein', abbreviation: 'Lut', category: 'phytochemical', subcategory: 'carotenoid', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'zeaxanthin', name: 'Zeaxanthin', display_name: 'Zeaxanthin', abbreviation: 'Zea', category: 'phytochemical', subcategory: 'carotenoid', default_unit: 'ug/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Phytochemicals - Flavonoids & Phenolics (8)
  { id: 'total_phenolics', name: 'Total Phenolics', display_name: 'Total Phenolic Compounds', abbreviation: 'TPC', category: 'phytochemical', subcategory: 'phenolic', default_unit: 'mg GAE/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'total_flavonoids', name: 'Total Flavonoids', display_name: 'Total Flavonoids', abbreviation: 'TFC', category: 'phytochemical', subcategory: 'flavonoid', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'total_anthocyanins', name: 'Total Anthocyanins', display_name: 'Total Anthocyanins', abbreviation: 'TAC', category: 'phytochemical', subcategory: 'anthocyanin', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'quercetin', name: 'Quercetin', display_name: 'Quercetin', abbreviation: 'Que', category: 'phytochemical', subcategory: 'flavonoid', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'kaempferol', name: 'Kaempferol', display_name: 'Kaempferol', abbreviation: 'Kae', category: 'phytochemical', subcategory: 'flavonoid', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'chlorogenic_acid', name: 'Chlorogenic Acid', display_name: 'Chlorogenic Acid', abbreviation: 'CGA', category: 'phytochemical', subcategory: 'phenolic', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'caffeic_acid', name: 'Caffeic Acid', display_name: 'Caffeic Acid', abbreviation: null, category: 'phytochemical', subcategory: 'phenolic', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  { id: 'ferulic_acid', name: 'Ferulic Acid', display_name: 'Ferulic Acid', abbreviation: null, category: 'phytochemical', subcategory: 'phenolic', default_unit: 'mg/100g', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: null },
  // Contaminants (3)
  { id: 'glyphosate', name: 'Glyphosate', display_name: 'Glyphosate Residue', abbreviation: null, category: 'contaminant', subcategory: 'herbicide', default_unit: 'ug/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Herbicide residue' },
  { id: 'total_pesticide_load', name: 'Total Pesticide Load', display_name: 'Total Pesticide Residue', abbreviation: null, category: 'contaminant', subcategory: 'pesticide', default_unit: 'ug/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Sum of all pesticide residues' },
  { id: 'pesticide_count', name: 'Pesticide Residue Count', display_name: 'Number of Pesticides Detected', abbreviation: null, category: 'contaminant', subcategory: 'pesticide', default_unit: 'count', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Number of different pesticide compounds detected' },
  // Heavy Metals (4)
  { id: 'lead', name: 'Lead', display_name: 'Lead', abbreviation: 'Pb', category: 'heavy_metal', subcategory: 'toxic_metal', default_unit: 'ug/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Toxic heavy metal - lower is better' },
  { id: 'cadmium', name: 'Cadmium', display_name: 'Cadmium', abbreviation: 'Cd', category: 'heavy_metal', subcategory: 'toxic_metal', default_unit: 'ug/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Toxic heavy metal - lower is better' },
  { id: 'mercury', name: 'Mercury', display_name: 'Mercury', abbreviation: 'Hg', category: 'heavy_metal', subcategory: 'toxic_metal', default_unit: 'ug/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Toxic heavy metal - lower is better' },
  { id: 'arsenic', name: 'Arsenic', display_name: 'Arsenic', abbreviation: 'As', category: 'heavy_metal', subcategory: 'toxic_metal', default_unit: 'ug/100g', is_beneficial: false, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Toxic heavy metal - lower is better' },
  // Quality Indicator (1)
  { id: 'brix', name: 'Brix', display_name: 'Degrees Brix (Soluble Solids)', abbreviation: '°Bx', category: 'other', subcategory: 'quality_indicator', default_unit: 'degrees', is_beneficial: true, is_essential: false, daily_value: null, daily_value_unit: null, applies_to_produce: true, applies_to_meat: true, applies_to_dairy: true, applies_to_eggs: true, applies_to_seafood: true, notes: 'Primary quality indicator for produce - measured by refractometer' },
]
