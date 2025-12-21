/**
 * GDD (Growing Degree Days) targets for each crop type.
 *
 * GDD is the core mechanism for predicting harvest timing.
 * Crops develop based on accumulated heat, not calendar days.
 *
 * GDD = max(0, (Tmax + Tmin) / 2 - baseTemp)
 *
 * LIFECYCLE & R-PILLAR:
 * The R (Ripen) pillar has two components:
 *   - R_maturity: Long-term factor (tree/bush age) - affects genetic expression ceiling
 *   - R_timing: Short-term factor (GDD-based) - seasonal harvest window
 *
 * | Lifecycle        | R_maturity     | R_timing      |
 * |------------------|----------------|---------------|
 * | tree_perennial   | Tree age curve | GDD window    |
 * | bush_perennial   | Bush age curve | GDD window    |
 * | vine_perennial   | Vine age curve | GDD window    |
 * | annual_row       | N/A            | GDD window    |
 * | annual_replanted | N/A            | GDD window    |
 */

import type { CropLifecycle, MaturityProfile } from './products'

export interface GDDTarget {
  baseTemp: number           // Temperature (F) below which no GDD accumulates
  maxTemp?: number          // Upper developmental threshold (86°F standard, 95°F heat-tolerant, 75°F cool season)
  gddToMaturity: number      // GDD from bloom/leaf-out to harvestable
  gddToPeak?: number         // GDD from bloom/leaf-out to peak quality
  gddToGoodFlavor?: number   // GDD to good flavor (citrus-specific)
  gddWindow: number          // GDD range during which quality remains high
  chillHoursRequired?: number // Chill hours needed (stone/pome fruit)
  plantingMethod?: 'direct_seed' | 'transplant' | 'either'  // How crop is typically started
  transplantAge?: number     // GDD accumulated before field planting (for transplants)

  // LIFECYCLE CLASSIFICATION (R-pillar semantics)
  lifecycle?: CropLifecycle  // tree_perennial, bush_perennial, vine_perennial, annual_row, annual_replanted
  maturityProfile?: Partial<MaturityProfile>  // For perennials: age-based quality factors

  notes?: string
}

export const CROP_GDD_TARGETS: Record<string, GDDTarget> = {
  // === CITRUS ===
  // Base temp 55F for all citrus
  // MaxTemp 94F - photosynthesis optimal at 86F, declines above, stomata issues above 94F
  // Source: Citrus Industry Magazine, UF/IFAS research
  // Long development period (9-12 months from bloom to harvest)
  navel_orange: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap - photosynthesis declines >86F, stops ~94F
    // CALIBRATED 2025-12-21: Farm data shows Oct-May availability (8 months)
    // Bloom mid-March → Mature Oct (210 days) → Peak Dec (275 days)
    gddToMaturity: 5100,        // ~230 days, SSC >= 8, ratio >= 9:1
    gddToGoodFlavor: 5600,      // ~250 days, BrimA >= 7.5
    gddToPeak: 6100,            // ~275 days, SSC ~12, TA ~1.0
    gddWindow: 3500,            // CALIBRATED: ~160 day window (Oct-May) from farm validation
    lifecycle: 'tree_perennial',
    maturityProfile: {
      lifecycle: 'tree_perennial',
      primeAgeRangeYears: [8, 18],
      yearsToFirstBearing: 3,
      productiveLifespanYears: 50,
      ageModifierType: 'tree_standard',
    },
    notes: "Quality holds well on tree. Window widened from 2000→3500 based on farm data."
  },
  valencia: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap
    // CALIBRATED: Bloom March → Mature Mar (next yr, 365 days) → Peak May (410 days)
    gddToMaturity: 8000,  // ~365 days, March start of season
    gddToPeak: 9000,      // ~410 days, April-May peak (13-14 months from bloom)
    gddWindow: 2200,      // March-June = ~100 days
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [8, 18], yearsToFirstBearing: 3, productiveLifespanYears: 50, ageModifierType: 'tree_standard' },
    notes: "Late season (Mar-Jun), peak Apr-May, can regreen if left too long"
  },
  grapefruit: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap
    // CALIBRATED: Bloom March → Mature Nov (245 days) → Peak Jan (320 days)
    gddToMaturity: 5500,  // ~245 days
    gddToPeak: 7100,      // ~320 days (mid-January)
    gddWindow: 4000,      // ~180 days window (Nov-May)
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [8, 20], yearsToFirstBearing: 4, productiveLifespanYears: 60, ageModifierType: 'tree_standard' },
    notes: "Very long harvest window, holds well on tree"
  },
  tangerine: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap
    // CALIBRATED 2025-12-21: Farm data shows Nov-Feb availability (4 months)
    // Bloom March → Mature Nov (210 days) → Peak Dec-Jan (260 days)
    gddToMaturity: 4800,  // CALIBRATED: Earlier maturity start for Nov harvest
    gddToPeak: 5700,      // ~260 days (mid-December)
    gddWindow: 1800,      // CALIBRATED: ~80 day window (Nov-Feb) from farm validation
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [6, 15], yearsToFirstBearing: 2, productiveLifespanYears: 40, ageModifierType: 'tree_standard' },
    notes: "Window widened from 900→1800 GDD based on farm data. Nov-Feb season."
  },
  satsuma: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap
    // CALIBRATED: Bloom March → Mature Oct (210 days) → Peak Nov (230 days)
    gddToMaturity: 4600,  // ~210 days
    gddToPeak: 5100,      // ~230 days (early November)
    gddWindow: 700,       // ~30 days (Oct-Nov)
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [6, 15], yearsToFirstBearing: 2, productiveLifespanYears: 40, ageModifierType: 'tree_standard' },
    notes: "Early season, cold-tolerant, seedless"
  },

  // === STONE FRUIT ===
  // Base temp 40-45F, bloom to harvest 90-150 days
  // MaxTemp 86F - standard upper threshold per MSU GDD models
  // Source: MSU Extension, Anderson et al. 1986
  peach: {
    baseTemp: 45.0,
    maxTemp: 86.0,               // Standard stone fruit heat cap (MSU)
    // CALIBRATED 2025-12-21: Farm data shows May-Sept availability (5 months)
    // Multiple cultivars stagger harvest across full season
    // 2025-12-21 v2: Increased gddToMaturity 1600→1800 to extend window into Aug-Sept
    gddToMaturity: 1800,         // CALIBRATED: Shifted later based on weather validation
    gddToPeak: 2200,
    gddWindow: 1800,             // CALIBRATED: ~5 month window (May-Sept) for cultivar staggering
    chillHoursRequired: 650,    // Typical for commercial cultivars
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [5, 15], yearsToFirstBearing: 3, productiveLifespanYears: 25, ageModifierType: 'tree_standard' },
    notes: "Climacteric. gddToMaturity increased 1600→1800 + window widened to 1800 GDD for full May-Sept coverage."
  },
  sweet_cherry: {
    baseTemp: 40.0,
    maxTemp: 86.0,               // Standard stone fruit heat cap (MSU)
    // CALIBRATED 2025-12-21: Farm data shows Jun-Aug availability (3 months)
    // 2025-12-21 v2: Widened window 600→900 to cover Jun-Aug with actual weather
    gddToMaturity: 1100,         // Keep maturity start at June
    gddToPeak: 1500,
    gddWindow: 900,              // CALIBRATED: Wider window for Jun-Aug coverage
    chillHoursRequired: 1100,
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [7, 20], yearsToFirstBearing: 4, productiveLifespanYears: 30, ageModifierType: 'tree_standard' },
    notes: "Non-climacteric. Window widened 600→900 GDD to cover Jun-Aug with actual weather data."
  },
  tart_cherry: {
    // VALIDATED: Zavalloni et al. 2006, J. Amer. Soc. Hort. Sci. 131(5):601-607
    baseTemp: 39.2,              // 4°C - validated by Eisensmith et al.
    maxTemp: 86.0,               // Standard stone fruit heat cap (MSU)
    gddToMaturity: 1000,         // ~1000 GDD base 4°C from full bloom
    gddToPeak: 1100,             // Full fruit development
    gddWindow: 80,               // Very short window (7-10 days)
    chillHoursRequired: 954,
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [8, 25], yearsToFirstBearing: 4, productiveLifespanYears: 35, ageModifierType: 'tree_standard' },
    notes: "Primarily for processing. Model R²=0.992 phenology"
  },

  // === POME FRUIT ===
  // Base temp 40-43F, 130-180 days bloom to harvest
  // MaxTemp 86F - standard upper threshold per MSU GDD models
  // Source: MSU Extension apple/cherry GDD models
  apple: {
    baseTemp: 43.0,
    maxTemp: 86.0,               // Standard pome fruit heat cap (MSU)
    // CALIBRATED 2025-12-21: Farm data shows Aug-Nov HARVEST (4 months)
    // NOTE: Farm availability extends to Jan-May via cold storage (separate model)
    // 2025-12-21 v3: Increased gddToMaturity 2100→2400 for MI late harvest (Sep-Nov)
    // v3 addresses POOR overlap (20%) in Michigan where temps are cooler
    gddToMaturity: 2400,         // CALIBRATED v3: Shifted later for MI (was Aug, now Sep)
    gddToPeak: 2900,
    gddWindow: 1600,             // CALIBRATED v3: Wider window for regional variation
    chillHoursRequired: 1000,
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [10, 30], yearsToFirstBearing: 4, productiveLifespanYears: 50, ageModifierType: 'tree_standard' },
    notes: "Climacteric. v3: gddToMaturity 2100→2400, window 1400→1600 for MI late harvest."
  },
  pear: {
    baseTemp: 40.0,
    maxTemp: 86.0,               // Standard pome fruit heat cap (MSU)
    // CALIBRATED 2025-12-21: Farm data shows Aug-Oct availability (3 months)
    // 2025-12-21 v3: Increased gddToMaturity 2500→2800 for WA late harvest
    // v3 addresses POOR overlap (25%) in Washington
    gddToMaturity: 2800,         // CALIBRATED v3: Shifted later for WA (was Jul, now Aug)
    gddToPeak: 3300,
    gddWindow: 1200,             // CALIBRATED v3: Wider window for regional variation
    chillHoursRequired: 800,
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [8, 25], yearsToFirstBearing: 4, productiveLifespanYears: 75, ageModifierType: 'tree_standard' },
    notes: "MUST ripen OFF tree. v3: gddToMaturity 2500→2800, window 1000→1200 for WA late harvest."
  },

  // === BERRIES ===
  // MaxTemp 86F - strawberries are heat-sensitive, photosynthesis declines >86F
  // MaxTemp 86F for blueberries - optimal 68-77F, reduced productivity above 85F
  strawberry: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Heat-sensitive, photosynthesis declines >86F
    // CALIBRATED 2025-12-21: Farm data shows Dec-Apr availability (5 months)
    // Florida: Oct planting → Dec start → Feb-Mar peak → Apr end
    gddToMaturity: 700,          // ~65 days to December harvest start
    gddToPeak: 1300,             // ~120 days to Feb-Mar peak
    gddWindow: 1700,             // CALIBRATED: Dec-Apr = ~150 days from farm validation
    lifecycle: 'annual_replanted',  // Perennial plant grown as annual (FL/CA model)
    // No maturityProfile needed - plants are replaced annually
    notes: "Non-climacteric. annual_replanted: technically perennial but replanted each season in commercial production."
  },
  blueberry: {
    baseTemp: 45.0,
    maxTemp: 86.0,               // Heat-sensitive, optimal 68-77F, reduced productivity >85F
    // CALIBRATED 2025-12-21: Farm data shows Jul-Sept (MI) or Jun-Aug (NJ) availability
    // 2025-12-21 v2: Increased gddToMaturity 900→1050 to shift from Jun→Jul start (MI)
    gddToMaturity: 1050,         // CALIBRATED: Shifted later based on weather validation
    gddToPeak: 1350,
    gddWindow: 900,              // CALIBRATED: Wider window to cover Jul-Sept (MI) or Jun-Aug (NJ)
    chillHoursRequired: 800,     // Varies greatly by cultivar
    lifecycle: 'bush_perennial',
    maturityProfile: { lifecycle: 'bush_perennial', primeAgeRangeYears: [3, 8], yearsToFirstBearing: 2, productiveLifespanYears: 20, ageModifierType: 'bush_standard' },
    notes: "Non-climacteric. bush_perennial with different age curve than trees."
  },
  blackberry: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Heat-sensitive, quality declines >85F
    // Blackberry: bloom May → harvest Jun-Aug depending on region/variety
    gddToMaturity: 1100,         // ~60 days from bloom to first ripe fruit
    gddToPeak: 1400,             // Peak flavor ~75 days
    gddWindow: 800,              // ~40 day harvest window (multiple flushes)
    chillHoursRequired: 400,     // Varies 200-800 by cultivar
    lifecycle: 'bush_perennial',
    maturityProfile: {
      lifecycle: 'bush_perennial',
      primeAgeRangeYears: [3, 8],
      yearsToFirstBearing: 2,
      productiveLifespanYears: 15,
      ageModifierType: 'bush_standard',
    },
    notes: "Non-climacteric. Primocane vs floricane varieties have different timing. bush_perennial."
  },
  raspberry: {
    baseTemp: 45.0,
    maxTemp: 80.0,               // Very heat-sensitive, prefers cool summers
    // Raspberry: bloom May → harvest Jun-Jul (summer) or Aug-Oct (everbearing)
    gddToMaturity: 900,          // ~50 days from bloom to first ripe fruit
    gddToPeak: 1100,             // Peak flavor ~60 days
    gddWindow: 700,              // ~35 day harvest window per flush
    chillHoursRequired: 800,     // Most varieties need significant chill
    lifecycle: 'bush_perennial',
    maturityProfile: {
      lifecycle: 'bush_perennial',
      primeAgeRangeYears: [2, 6],
      yearsToFirstBearing: 1,
      productiveLifespanYears: 12,
      ageModifierType: 'bush_standard',
    },
    notes: "Non-climacteric. Very perishable. Primocane (fall) vs floricane (summer) varieties. bush_perennial."
  },

  // === VINE CROPS ===
  // Grapes: Base temp 50°F, vine_perennial with long productive lifespan
  // Old vines (25+ years) are prized in wine grapes for concentrated flavors
  grape_table: {
    baseTemp: 50.0,
    maxTemp: 95.0,               // Heat-tolerant, but quality declines at extremes
    // Table grapes: bloom May → veraison Aug → harvest Sept-Oct
    gddToMaturity: 2200,         // ~120 days from bloom to harvest
    gddToPeak: 2500,             // Peak sugar/flavor ~135 days
    gddWindow: 600,              // ~30 day harvest window
    chillHoursRequired: 100,     // Low-chill table varieties (Thompson, Flame)
    lifecycle: 'vine_perennial',
    maturityProfile: {
      lifecycle: 'vine_perennial',
      primeAgeRangeYears: [5, 25],
      yearsToFirstBearing: 3,
      productiveLifespanYears: 50,
      ageModifierType: 'vine_standard',
    },
    notes: "Table grapes. vine_perennial with long productive lifespan. Old vines produce concentrated flavors."
  },
  grape_wine: {
    baseTemp: 50.0,
    maxTemp: 90.0,               // Wine grapes more sensitive to heat stress
    // Wine grapes: longer hang time for flavor development
    // Bloom May → veraison Aug → harvest Sept-Nov depending on variety
    gddToMaturity: 2400,         // ~130 days, earlier-ripening varieties
    gddToPeak: 2800,             // Peak complexity for mid-season varieties
    gddWindow: 800,              // ~40 day window, winemaker timing preference
    chillHoursRequired: 400,     // Most wine varieties need moderate chill
    lifecycle: 'vine_perennial',
    maturityProfile: {
      lifecycle: 'vine_perennial',
      primeAgeRangeYears: [8, 30],
      yearsToFirstBearing: 3,
      productiveLifespanYears: 80,
      ageModifierType: 'vine_standard',
    },
    notes: "Wine grapes. Longer hang time than table. Old vines (vieilles vignes) 25+ years prized for quality."
  },
  kiwi: {
    baseTemp: 45.0,
    maxTemp: 85.0,               // Prefers mild temps, heat stress reduces fruit size
    // Kiwi: bloom May-Jun → harvest Oct-Nov (150-180 days)
    gddToMaturity: 2800,         // ~150 days from bloom
    gddToPeak: 3200,             // Peak sugar/flavor ~170 days
    gddWindow: 600,              // ~30 day harvest window
    chillHoursRequired: 600,     // Hayward variety; ranges 400-800 by cultivar
    lifecycle: 'vine_perennial',
    maturityProfile: {
      lifecycle: 'vine_perennial',
      primeAgeRangeYears: [5, 25],
      yearsToFirstBearing: 4,
      productiveLifespanYears: 50,
      ageModifierType: 'vine_standard',
    },
    notes: "Kiwifruit. vine_perennial requiring male/female plants. Long establishment period but 50+ year lifespan."
  },

  // === TROPICAL/SUBTROPICAL ===
  // Mango: Very heat-tolerant, but extreme heat (>104F) causes fruit sunburn
  // Pomegranate: Extremely heat-tolerant, thrives in desert climates
  mango: {
    baseTemp: 60.0,
    maxTemp: 95.0,               // Heat-tolerant but extreme heat >104F causes stress
    gddToMaturity: 2800,
    gddToPeak: 3200,
    gddWindow: 300,              // Varies by cultivar
    chillHoursRequired: 0,
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [10, 30], yearsToFirstBearing: 5, productiveLifespanYears: 100, ageModifierType: 'tree_standard' },
    notes: "Climacteric, chill injury below 55F"
  },
  pomegranate: {
    baseTemp: 50.0,
    maxTemp: 100.0,              // Very heat-tolerant, thrives in hot climates
    // California: Sept-Nov harvest, Oct-Nov peak (from April 15 bloom)
    gddToMaturity: 3800,         // ~138 days to September start
    gddToPeak: 4500,             // ~165 days to Oct-Nov peak
    gddWindow: 1000,             // Sept-Nov = ~75 days
    chillHoursRequired: 150,
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [5, 20], yearsToFirstBearing: 3, productiveLifespanYears: 30, ageModifierType: 'tree_standard' },
    notes: "Non-climacteric, stores well"
  },

  // === NUTS ===
  // Pecan: Heat-tolerant but >95F can cause "kernel shrivel"
  pecan: {
    baseTemp: 65.0,
    maxTemp: 95.0,               // Hot weather >95F causes kernel shrivel
    gddToMaturity: 2600,         // Shuck split
    gddToPeak: 2900,             // Full oil development
    gddWindow: 400,              // Harvest window generous
    chillHoursRequired: 500,
    lifecycle: 'tree_perennial',
    maturityProfile: { lifecycle: 'tree_perennial', primeAgeRangeYears: [15, 40], yearsToFirstBearing: 8, productiveLifespanYears: 100, ageModifierType: 'tree_standard' },
    notes: "Quality = oil content not Brix, alternate bearing"
  },

  // === ANNUAL VEGETABLES - WARM SEASON ===
  // Base temp 50-55F, heat-loving crops
  // Sources: UF/IFAS, UC Davis, Cornell Extension

  // TOMATOES - Multiple cultivar types
  // All tomatoes are annual_row: no age factor, only R_timing (GDD) applies
  tomato_early: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    gddToMaturity: 2200,         // 55-65 DTH cultivars (Early Girl, Fourth of July)
    gddToPeak: 2400,             // Peak flavor after first flush
    gddWindow: 600,              // ~3-4 week harvest window
    plantingMethod: 'transplant',
    transplantAge: 400,          // 4 weeks indoors (~70°F = 20 GDD/day)
    lifecycle: 'annual_row',
    notes: "Short-season cultivars. Climacteric. Poor fruit set >90°F."
  },
  tomato_standard: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    // CALIBRATED 2025-12-21: Florida has BIMODAL seasons (fall + spring)
    gddToMaturity: 2400,         // CALIBRATED: Earlier maturity for extended window
    gddToPeak: 2600,             // Peak production after first set
    gddWindow: 2400,             // CALIBRATED: ~100+ days to cover bimodal Nov-May availability
    plantingMethod: 'transplant',
    transplantAge: 500,          // 5-6 weeks indoors
    lifecycle: 'annual_row',
    notes: "BIMODAL in FL/TX: fall+spring plantings. Window widened 800→2400 GDD."
  },
  tomato_beefsteak: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    gddToMaturity: 2900,         // 85-100 DTH (Cherokee Purple, Brandywine, Mortgage Lifter)
    gddToPeak: 3100,             // Heritage cultivars need longer season
    gddWindow: 900,              // ~4-6 week harvest window
    plantingMethod: 'transplant',
    transplantAge: 600,          // 6-8 weeks indoors
    lifecycle: 'annual_row',
    notes: "Long-season heirlooms. Climacteric, superb flavor. Poor fruit set >90°F."
  },
  tomato_cherry: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    gddToMaturity: 2300,         // 60-70 DTH (Sungold, Sweet 100, Matt's Wild Cherry)
    gddToPeak: 2500,             // Continuous production
    gddWindow: 1000,             // Extended harvest (6-8 weeks)
    plantingMethod: 'transplant',
    transplantAge: 450,          // 4-5 weeks indoors
    lifecycle: 'annual_row',
    notes: "High yield, heat tolerant, continuous production. Climacteric. Poor fruit set >90°F."
  },

  // PEPPERS - Hot and sweet types
  // All peppers are annual_row
  pepper_hot: {
    baseTemp: 55.0,              // Higher base temp than tomatoes
    maxTemp: 95.0,               // More heat-tolerant than tomatoes
    gddToMaturity: 2400,         // 70-90 DTH (Jalapeño, Serrano, Cayenne)
    gddToPeak: 2600,             // Peak flavor with full color development
    gddWindow: 1200,             // Very long harvest window (8-10 weeks)
    plantingMethod: 'transplant',
    transplantAge: 600,          // 6-8 weeks indoors
    lifecycle: 'annual_row',
    notes: "Heat-tolerant, continuous production. Non-climacteric, harvest at any stage."
  },
  pepper_sweet: {
    baseTemp: 55.0,
    maxTemp: 95.0,               // More heat-tolerant than tomatoes
    gddToMaturity: 2200,         // 65-80 DTH (Bell, California Wonder, Jimmy Nardello)
    gddToPeak: 2500,             // Full color change (green → red/yellow)
    gddWindow: 900,              // ~5-6 week window
    plantingMethod: 'transplant',
    transplantAge: 600,          // 6-8 weeks indoors
    lifecycle: 'annual_row',
    notes: "Can harvest green (early) or full color (late). Non-climacteric."
  },

  // BEANS - Bush and pole types
  // All beans are annual_row
  bean_bush: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 1300,         // 50-60 DTH (Blue Lake, Provider, Contender)
    gddToPeak: 1400,             // Peak tenderness
    gddWindow: 200,              // ~2 week optimal window
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct seed only. Fast-growing. Pick continuously. Non-climacteric."
  },
  bean_pole: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 1600,         // 60-70 DTH (Kentucky Wonder, Scarlet Runner)
    gddToPeak: 1700,             // Peak production
    gddWindow: 400,              // Longer window than bush (3-4 weeks)
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct seed only. Continuous harvest over extended period. Non-climacteric."
  },

  // SQUASH/CUCURBITS - all annual_row
  squash_summer: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 1500,
    gddToPeak: 1600,
    gddWindow: 600,
    plantingMethod: 'either',
    transplantAge: 200,
    lifecycle: 'annual_row',
    notes: "Pick young (6-8 inches). Non-climacteric, fast-growing."
  },
  squash_winter: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 2800,
    gddToPeak: 3000,
    gddWindow: 400,
    plantingMethod: 'either',
    transplantAge: 200,
    lifecycle: 'annual_row',
    notes: "Non-climacteric. Cure after harvest for storage (2 weeks at 80°F)."
  },
  pumpkin: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 3000,
    gddToPeak: 3200,
    gddWindow: 400,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct-seeded. Non-climacteric. Harvest before frost, cure for storage."
  },

  // CUCUMBERS - all annual_row
  cucumber_slicing: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 1600,
    gddToPeak: 1700,
    gddWindow: 400,
    plantingMethod: 'either',
    transplantAge: 200,
    lifecycle: 'annual_row',
    notes: "Pick continuously. Non-climacteric, 6-8 inch optimal."
  },
  cucumber_pickling: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 1400,
    gddToPeak: 1500,
    gddWindow: 300,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Harvest small (2-4 inches) for pickles. Non-climacteric."
  },

  // MELONS - all annual_row
  watermelon: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 2800,
    gddToPeak: 3000,
    gddWindow: 200,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Non-climacteric. Check ground spot, tendril, and hollow sound for ripeness."
  },
  cantaloupe: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 2400,
    gddToPeak: 2600,
    gddWindow: 150,
    plantingMethod: 'either',
    transplantAge: 200,
    lifecycle: 'annual_row',
    notes: "Climacteric. Full slip = optimal harvest. Strong aroma when ripe."
  },

  // SWEET CORN - all annual_row
  corn_sweet_early: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 2400,
    gddToPeak: 2500,
    gddWindow: 100,              // Very short window (3-5 days)
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct-seeded in blocks. Harvest at milk stage. Non-climacteric."
  },
  corn_sweet_standard: {
    baseTemp: 50.0,
    maxTemp: 86.0,
    gddToMaturity: 2800,
    gddToPeak: 2900,
    gddWindow: 100,              // Very short window (3-5 days)
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Peak sweetness fleeting, cold storage ASAP. Non-climacteric."
  },

  // OKRA - annual_row
  okra: {
    baseTemp: 60.0,              // Very heat-loving
    // No maxTemp - okra thrives in extreme heat
    gddToMaturity: 1800,
    gddToPeak: 2000,
    gddWindow: 1500,             // Extended harvest (10+ weeks)
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Harvest young pods (3-4 inches) daily. Extremely heat-tolerant. Non-climacteric."
  },

  // EGGPLANT - annual_row
  eggplant: {
    baseTemp: 55.0,
    maxTemp: 86.0,
    gddToMaturity: 2400,
    gddToPeak: 2600,
    gddWindow: 800,
    plantingMethod: 'transplant',
    transplantAge: 600,
    lifecycle: 'annual_row',
    notes: "Harvest when skin is glossy. Non-climacteric."
  },

  // === ANNUAL VEGETABLES - COOL SEASON ===
  // Base temp 40-45F, frost-tolerant
  // Sources: UF/IFAS, Cornell, MSU Extension

  // LETTUCE - annual_row
  lettuce_leafy: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 800,
    gddToPeak: 900,
    gddWindow: 300,
    plantingMethod: 'either',
    transplantAge: 150,
    lifecycle: 'annual_row',
    notes: "Bolts in heat (>80°F). Succession plant every 2 weeks. Non-climacteric."
  },
  lettuce_head: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 1200,
    gddToPeak: 1300,
    gddWindow: 200,
    plantingMethod: 'either',
    transplantAge: 200,
    lifecycle: 'annual_row',
    notes: "Heat-sensitive, bolts easily. Non-climacteric."
  },

  // BRASSICAS - all annual_row
  broccoli: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 1600,
    gddToPeak: 1700,
    gddWindow: 150,
    plantingMethod: 'transplant',
    transplantAge: 400,
    lifecycle: 'annual_row',
    notes: "Harvest main head, side shoots follow. Non-climacteric."
  },
  cabbage: {
    baseTemp: 40.0,
    maxTemp: 80.0,
    gddToMaturity: 2000,
    gddToPeak: 2200,
    gddWindow: 400,
    plantingMethod: 'transplant',
    transplantAge: 400,
    lifecycle: 'annual_row',
    notes: "Cold-hardy, stores well. Non-climacteric."
  },
  cauliflower: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 1800,
    gddToPeak: 1900,
    gddWindow: 100,
    plantingMethod: 'transplant',
    transplantAge: 400,
    lifecycle: 'annual_row',
    notes: "Heat-sensitive. Blanch heads. Non-climacteric."
  },
  kale: {
    baseTemp: 40.0,
    maxTemp: 80.0,
    gddToMaturity: 1200,
    gddToPeak: 1400,
    gddWindow: 2000,
    plantingMethod: 'either',
    transplantAge: 250,
    lifecycle: 'annual_row',
    notes: "Very cold-hardy. Sweetens after frost. Harvest outer leaves. Non-climacteric."
  },

  // ROOT VEGETABLES - all annual_row
  carrot: {
    baseTemp: 40.0,
    maxTemp: 80.0,
    gddToMaturity: 1400,
    gddToPeak: 1600,
    gddWindow: 600,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct-seed only (taproot). Living storage. Sweetens after frost. Non-climacteric."
  },
  beet: {
    baseTemp: 40.0,
    maxTemp: 80.0,
    gddToMaturity: 1200,
    gddToPeak: 1300,
    gddWindow: 400,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct-seeded. Root and greens edible. Non-climacteric."
  },
  radish: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 600,
    gddToPeak: 700,
    gddWindow: 100,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Fastest crop. Succession plant weekly. Non-climacteric."
  },
  turnip: {
    baseTemp: 40.0,
    maxTemp: 80.0,
    gddToMaturity: 1100,
    gddToPeak: 1200,
    gddWindow: 300,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Root and greens edible. Cold-hardy. Non-climacteric."
  },

  // PEAS - all annual_row
  pea_garden: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 1100,
    gddToPeak: 1200,
    gddWindow: 150,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Cool-season, heat-sensitive. Non-climacteric."
  },
  pea_snap: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 1200,
    gddToPeak: 1300,
    gddWindow: 200,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Eat pod and all. Cool-season. Non-climacteric."
  },

  // LEAFY GREENS - all annual_row
  spinach: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 900,
    gddToPeak: 1000,
    gddWindow: 300,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Very cold-hardy. Bolts in heat. Cut-and-come-again. Non-climacteric."
  },
  swiss_chard: {
    baseTemp: 40.0,
    maxTemp: 85.0,
    gddToMaturity: 1200,
    gddToPeak: 1400,
    gddWindow: 2000,
    plantingMethod: 'either',
    transplantAge: 200,
    lifecycle: 'annual_row',
    notes: "Heat-tolerant for a green. Harvest outer leaves continuously. Non-climacteric."
  },
  arugula: {
    baseTemp: 40.0,
    maxTemp: 75.0,
    gddToMaturity: 700,
    gddToPeak: 800,
    gddWindow: 200,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Fast-growing. Bolts in heat. Succession plant weekly. Non-climacteric."
  },

  // ONIONS/ALLIUMS - all annual_row
  onion_bulb: {
    baseTemp: 40.0,
    maxTemp: 85.0,
    gddToMaturity: 2400,
    gddToPeak: 2600,
    gddWindow: 400,
    plantingMethod: 'either',
    transplantAge: 400,
    lifecycle: 'annual_row',
    notes: "Day length sensitive. Cure after harvest. Non-climacteric."
  },
  onion_green: {
    baseTemp: 40.0,
    maxTemp: 85.0,
    gddToMaturity: 1000,
    gddToPeak: 1100,
    gddWindow: 300,
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Fast-growing. Succession plant. Non-climacteric."
  },
  garlic: {
    baseTemp: 40.0,
    maxTemp: 85.0,
    gddToMaturity: 3500,
    gddToPeak: 3800,
    gddWindow: 200,
    chillHoursRequired: 400,     // Vernalization requirement for bulbing
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',     // Technically a perennial bulb but grown as annual
    notes: "Plant fall, harvest summer. Cure 2-4 weeks after harvest. Non-climacteric."
  },

  // === HERBS (ANNUAL) === - all annual_row
  basil: {
    baseTemp: 50.0,
    maxTemp: 95.0,
    gddToMaturity: 1400,
    gddToPeak: 1600,
    gddWindow: 1200,
    plantingMethod: 'either',
    transplantAge: 300,
    lifecycle: 'annual_row',
    notes: "Heat-loving. Pinch flowers to extend harvest. Frost-sensitive. Non-climacteric."
  },
  cilantro: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Very heat-sensitive, bolts quickly >75°F
    gddToMaturity: 900,          // 45-70 DTH (Santo, Calypso, Slow Bolt)
    gddToPeak: 1000,             // Before bolting
    gddWindow: 200,              // ~2 week window
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct-seeded for best results. Bolts quickly in heat. Succession plant every 3 weeks. Non-climacteric."
  },
  dill: {
    baseTemp: 40.0,
    maxTemp: 80.0,               // Reasonable heat tolerance
    gddToMaturity: 1300,         // 60-70 DTH (Bouquet, Mammoth)
    gddToPeak: 1400,             // Before flowering (for leaves)
    gddWindow: 300,              // ~3 week window for leaves
    plantingMethod: 'direct_seed',
    lifecycle: 'annual_row',
    notes: "Direct-seeded. Harvest leaves early, or let flower for seeds. Self-seeds readily. Non-climacteric."
  },
}

/**
 * Get GDD targets for a crop.
 * Falls back to reasonable defaults if crop not in database.
 */
export function getGddTargets(cropId: string): GDDTarget {
  if (cropId in CROP_GDD_TARGETS) {
    return CROP_GDD_TARGETS[cropId]
  }

  // Default values for unknown crops
  return {
    baseTemp: 50.0,
    gddToMaturity: 1800,
    gddToPeak: 2100,
    gddWindow: 200,
    notes: "Default values - crop-specific data not available"
  }
}
