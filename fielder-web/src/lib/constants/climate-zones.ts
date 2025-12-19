/**
 * Climate Zone Definitions
 *
 * This file is separate from regional-offering-generator.ts to avoid
 * circular dependencies. It contains only static data with no imports
 * from other product-related files.
 */

// =============================================================================
// Climate Zone Types
// =============================================================================

/**
 * Climate zones based on USDA hardiness and growing characteristics
 */
export type ClimateZone =
  | 'tropical'        // Frost-free, humid (South FL, Hawaii)
  | 'subtropical'     // Rare frost, warm (Central FL, Gulf Coast, South TX)
  | 'warm_temperate'  // Mild winters, hot summers (CA Central Valley, AZ)
  | 'mediterranean'   // Dry summer, wet winter (CA Coast)
  | 'continental'     // Cold winters, hot summers (Midwest, Great Plains)
  | 'humid_continental' // Cold winters, warm summers (Northeast, Great Lakes)
  | 'maritime'        // Mild year-round, wet (Pacific NW)
  | 'high_desert'     // Cold winters, hot dry summers (CO, NM, UT)
  | 'cold'            // Very cold winters (MN, WI, northern states)

// =============================================================================
// Region to Climate Zone Mapping
// =============================================================================

/**
 * Map regions to their primary climate zone
 */
export const REGION_CLIMATE_ZONES: Record<string, ClimateZone> = {
  // === FLORIDA ===
  indian_river: 'subtropical',
  central_florida: 'subtropical',
  south_florida: 'tropical',
  florida_keys: 'tropical',
  gulf_coast_citrus: 'subtropical',
  florida_plant_city: 'subtropical',
  north_florida: 'subtropical',
  plant_city: 'subtropical',
  homestead_redland: 'tropical',
  central_florida_citrus: 'subtropical',
  florida_panhandle: 'subtropical',
  northeast_florida: 'subtropical',

  // === TEXAS ===
  texas_rgv: 'subtropical',
  texas_hill_country: 'warm_temperate',
  texas_high_plains: 'continental',
  texas_gulf_coast: 'subtropical',
  east_texas: 'humid_continental',
  texas_pecan_belt: 'warm_temperate',
  winter_garden: 'subtropical',
  texas_blackland_prairie: 'humid_continental',
  central_texas: 'warm_temperate',

  // === CALIFORNIA ===
  california_central_valley: 'warm_temperate',
  california_coastal: 'mediterranean',
  california_central_coast: 'mediterranean',
  california_desert: 'warm_temperate',
  california_sierra_foothills: 'mediterranean',
  napa_valley: 'mediterranean',
  sonoma: 'mediterranean',
  san_joaquin: 'warm_temperate',
  ventura: 'mediterranean',
  sacramento_valley: 'warm_temperate',
  san_joaquin_valley_north: 'warm_temperate',
  san_joaquin_valley_central: 'warm_temperate',
  san_joaquin_valley_south: 'warm_temperate',
  salinas_valley: 'mediterranean',
  central_coast_north: 'mediterranean',
  central_coast_south: 'mediterranean',
  sonoma_county: 'mediterranean',
  mendocino_county: 'mediterranean',
  imperial_valley: 'warm_temperate',
  coachella_valley: 'warm_temperate',
  san_diego_county: 'mediterranean',

  // === PACIFIC NORTHWEST ===
  pacific_nw_yakima: 'maritime',
  pacific_nw_willamette: 'maritime',
  pacific_nw_wenatchee: 'maritime',
  puget_sound: 'maritime',
  hood_river: 'maritime',
  columbia_gorge: 'maritime',
  willamette_valley: 'maritime',
  hood_river_valley: 'maritime',
  rogue_valley: 'maritime',
  skagit_valley: 'maritime',
  yakima_valley: 'maritime',
  wenatchee_valley: 'maritime',
  walla_walla_valley: 'continental',
  columbia_basin: 'continental',

  // === SOUTHEAST (Georgia, SC, NC, VA) ===
  georgia_piedmont: 'humid_continental',
  georgia_coastal: 'subtropical',
  vidalia_region: 'subtropical',
  middle_georgia: 'humid_continental',
  southwest_georgia: 'subtropical',
  south_carolina_ridge: 'humid_continental',
  south_carolina_lowcountry: 'subtropical',
  sc_lowcountry: 'subtropical',
  sc_upstate: 'humid_continental',
  north_carolina_piedmont: 'humid_continental',
  north_carolina_mountains: 'humid_continental',
  nc_piedmont: 'humid_continental',
  eastern_nc_coastal_plain: 'humid_continental',
  nc_mountains: 'humid_continental',
  virginia_shenandoah: 'humid_continental',
  virginia_piedmont: 'humid_continental',
  shenandoah_valley: 'humid_continental',

  // === NORTHEAST ===
  new_york_finger_lakes: 'humid_continental',
  new_york_hudson_valley: 'humid_continental',
  new_york_long_island: 'humid_continental',
  hudson_valley: 'humid_continental',
  finger_lakes: 'humid_continental',
  long_island: 'humid_continental',
  new_england: 'humid_continental',
  new_jersey: 'humid_continental',
  pine_barrens_nj: 'humid_continental',
  central_jersey: 'humid_continental',
  pennsylvania: 'humid_continental',
  adams_county_pa: 'humid_continental',
  lancaster_county_pa: 'humid_continental',
  pioneer_valley_ma: 'humid_continental',
  berkshires_ma: 'humid_continental',
  cape_cod_ma: 'humid_continental',
  maine: 'cold',
  maine_aroostook: 'cold',
  maine_blueberry: 'cold',
  maine_midcoast: 'cold',
  vermont: 'cold',
  vermont_champlain: 'cold',
  vermont_statewide: 'cold',
  new_hampshire: 'cold',
  connecticut: 'humid_continental',
  rhode_island: 'humid_continental',

  // === GREAT LAKES / MIDWEST ===
  michigan_west: 'humid_continental',
  michigan_traverse: 'humid_continental',
  michigan_upper_peninsula: 'cold',
  northwest_michigan: 'humid_continental',
  southwest_michigan: 'humid_continental',
  ohio: 'humid_continental',
  ohio_lake_erie: 'humid_continental',
  ohio_amish_country: 'humid_continental',
  central_ohio: 'humid_continental',
  indiana: 'humid_continental',
  central_indiana: 'humid_continental',
  northern_indiana_amish: 'humid_continental',
  illinois: 'continental',
  northern_illinois: 'continental',
  wisconsin: 'cold',
  door_county: 'cold',
  wisconsin_driftless: 'cold',
  wisconsin_cranberry: 'cold',
  minnesota: 'cold',
  central_minnesota: 'cold',
  minnesota_apples: 'cold',
  minnesota_wild_rice: 'cold',
  iowa: 'continental',
  iowa_northeast: 'continental',

  // === SOUTHWEST ===
  arizona_yuma: 'warm_temperate',
  arizona_phoenix: 'warm_temperate',
  yuma_county: 'warm_temperate',
  salt_river_valley: 'warm_temperate',
  santa_cruz_valley: 'warm_temperate',
  cochise_county: 'high_desert',
  new_mexico: 'high_desert',
  hatch_valley: 'high_desert',
  mesilla_valley: 'high_desert',
  middle_rio_grande: 'high_desert',
  northern_nm: 'high_desert',
  colorado_western_slope: 'high_desert',
  palisade_colorado: 'high_desert',
  utah: 'high_desert',
  wasatch_front: 'high_desert',
  nevada: 'high_desert',

  // === MOUNTAIN / PLAINS ===
  idaho: 'continental',
  snake_river_valley: 'continental',
  montana: 'continental',
  western_montana: 'continental',
  wyoming: 'continental',
  nebraska: 'continental',
  kansas: 'continental',
  oklahoma: 'continental',
  missouri: 'humid_continental',

  // === SOUTH CENTRAL ===
  arkansas: 'humid_continental',
  louisiana: 'subtropical',
  acadiana: 'subtropical',
  atchafalaya_basin: 'subtropical',
  louisiana_gulf_coast: 'subtropical',
  mississippi: 'subtropical',
  mississippi_delta: 'subtropical',
  alabama: 'subtropical',
  alabama_gulf_coast: 'subtropical',
  tennessee: 'humid_continental',
  east_tennessee: 'humid_continental',
  middle_tennessee: 'humid_continental',
  kentucky: 'humid_continental',
  kentucky_bluegrass: 'humid_continental',

  // === MID-ATLANTIC ===
  maryland_eastern_shore: 'humid_continental',
  delaware: 'humid_continental',
  wv_eastern_panhandle: 'humid_continental',

  // === HAWAII ===
  hawaii_kona: 'tropical',
  hawaii_maui: 'tropical',
  hawaii_oahu: 'tropical',
  kona_coast: 'tropical',
  hamakua_coast: 'tropical',
  puna_district: 'tropical',
  maui_upcountry: 'tropical',
  north_shore_oahu: 'tropical',
}

// =============================================================================
// Subcategory Climate Compatibility
// =============================================================================

/**
 * Which climate zones each crop subcategory can grow in
 */
export const SUBCATEGORY_CLIMATE_COMPATIBILITY: Record<string, ClimateZone[]> = {
  // Citrus - needs frost-free or near frost-free
  citrus: ['tropical', 'subtropical', 'warm_temperate', 'mediterranean'],

  // Stone fruit - needs chill hours but not extreme cold
  stone_fruit: ['warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'high_desert'],

  // Pome fruit (apples, pears) - needs chill hours
  pome_fruit: ['humid_continental', 'maritime', 'continental', 'high_desert', 'cold', 'mediterranean'],

  // Berries - varies by type but generally adaptable
  berry: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'cold'],

  // Melons - needs heat
  melon: ['subtropical', 'warm_temperate', 'mediterranean', 'continental', 'humid_continental'],

  // Tropical fruits - frost-free only
  tropical: ['tropical', 'subtropical'],

  // Leafy greens - cool season, very adaptable
  leafy: ['tropical', 'subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert', 'cold'],

  // Root vegetables - very adaptable
  root: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert', 'cold'],

  // Nightshades (tomatoes, peppers) - needs warmth
  nightshade: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental'],

  // Squash - needs warmth
  squash: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental'],

  // Cruciferous - cool season
  cruciferous: ['warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'cold'],

  // Alliums - very adaptable
  allium: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert'],

  // Legumes - warm season
  legume: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental'],

  // Tree nuts - varies
  tree_nut: ['warm_temperate', 'mediterranean', 'humid_continental', 'high_desert'],

  // Ground nuts
  ground_nut: ['subtropical', 'warm_temperate', 'humid_continental'],

  // Specialty vegetables
  specialty_veg: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime'],

  // Red meat (beef, pork, lamb, goat) - all regions with pasture
  red_meat: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert', 'cold'],

  // Poultry - all regions
  poultry: ['tropical', 'subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert', 'cold'],

  // Game meats
  game: ['humid_continental', 'maritime', 'continental', 'high_desert', 'cold'],

  // Eggs - all regions
  eggs: ['tropical', 'subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert', 'cold'],

  // Dairy
  milk: ['humid_continental', 'maritime', 'continental', 'cold'],

  // Fish
  fish: ['tropical', 'subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'cold'],

  // Shellfish
  shellfish: ['subtropical', 'maritime', 'humid_continental', 'cold'],

  // Crustacean
  crustacean: ['subtropical', 'warm_temperate', 'maritime', 'humid_continental'],

  // Coffee - tropical only
  coffee: ['tropical'],

  // Tea
  tea: ['subtropical', 'humid_continental'],

  // Honey - everywhere flowers bloom
  raw_honey: ['tropical', 'subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert'],

  // Post-harvest products follow their source crop
  juice: ['subtropical', 'warm_temperate', 'mediterranean'],
  cider: ['humid_continental', 'maritime', 'continental'],
  syrup: ['humid_continental', 'cold'],
  oil: ['mediterranean', 'warm_temperate'],

  // Grains
  specialty_grain: ['humid_continental', 'continental', 'cold'],

  // Cured/processed meats - same as red meat (produced from livestock)
  cured_meat: ['subtropical', 'warm_temperate', 'mediterranean', 'humid_continental', 'maritime', 'continental', 'high_desert', 'cold'],
}

// =============================================================================
// Premium Region × Crop Combinations
// =============================================================================

/**
 * Premium region × crop combinations (known for exceptional quality)
 */
export const PREMIUM_COMBINATIONS: Record<string, string[]> = {
  // Citrus premium regions
  citrus: ['indian_river', 'texas_rgv'],

  // Apple premium regions
  pome_fruit: ['pacific_nw_yakima', 'pacific_nw_wenatchee', 'new_york_finger_lakes', 'michigan_traverse'],

  // Stone fruit premium regions
  stone_fruit: ['georgia_piedmont', 'south_carolina_ridge', 'california_central_valley'],

  // Berry premium regions
  berry: ['pacific_nw_willamette', 'california_central_coast', 'michigan_traverse'],

  // Beef premium regions
  red_meat: ['texas_hill_country', 'montana', 'colorado_western_slope'],
}
