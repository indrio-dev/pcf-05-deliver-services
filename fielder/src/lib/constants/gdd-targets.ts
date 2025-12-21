/**
 * GDD (Growing Degree Days) targets for each crop type.
 *
 * GDD is the core mechanism for predicting harvest timing.
 * Crops develop based on accumulated heat, not calendar days.
 *
 * GDD = max(0, (Tmax + Tmin) / 2 - baseTemp)
 */

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
    notes: "Quality holds well on tree. Window widened from 2000→3500 based on farm data."
  },
  valencia: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap
    // CALIBRATED: Bloom March → Mature Mar (next yr, 365 days) → Peak May (410 days)
    gddToMaturity: 8000,  // ~365 days, March start of season
    gddToPeak: 9000,      // ~410 days, April-May peak (13-14 months from bloom)
    gddWindow: 2200,      // March-June = ~100 days
    notes: "Late season (Mar-Jun), peak Apr-May, can regreen if left too long"
  },
  grapefruit: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap
    // CALIBRATED: Bloom March → Mature Nov (245 days) → Peak Jan (320 days)
    gddToMaturity: 5500,  // ~245 days
    gddToPeak: 7100,      // ~320 days (mid-January)
    gddWindow: 4000,      // ~180 days window (Nov-May)
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
    notes: "Window widened from 900→1800 GDD based on farm data. Nov-Feb season."
  },
  satsuma: {
    baseTemp: 55.0,
    maxTemp: 94.0,              // Citrus heat cap
    // CALIBRATED: Bloom March → Mature Oct (210 days) → Peak Nov (230 days)
    gddToMaturity: 4600,  // ~210 days
    gddToPeak: 5100,      // ~230 days (early November)
    gddWindow: 700,       // ~30 days (Oct-Nov)
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
    notes: "Non-climacteric. Window widened from 1100→1700 GDD to cover Dec-Apr season."
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
    notes: "Non-climacteric. gddToMaturity increased 900→1050 + window widened to 900 GDD per weather validation."
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
    notes: "Quality = oil content not Brix, alternate bearing"
  },

  // === ANNUAL VEGETABLES - WARM SEASON ===
  // Base temp 50-55F, heat-loving crops
  // Sources: UF/IFAS, UC Davis, Cornell Extension

  // TOMATOES - Multiple cultivar types
  tomato_early: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    gddToMaturity: 2200,         // 55-65 DTH cultivars (Early Girl, Fourth of July)
    gddToPeak: 2400,             // Peak flavor after first flush
    gddWindow: 600,              // ~3-4 week harvest window
    plantingMethod: 'transplant',
    transplantAge: 400,          // 4 weeks indoors (~70°F = 20 GDD/day)
    notes: "Short-season cultivars for cooler zones or succession planting. Typically transplanted at 4 weeks. Climacteric. Poor fruit set >90°F."
  },
  tomato_standard: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    // CALIBRATED 2025-12-21: Florida has BIMODAL seasons (fall + spring)
    // Fall: Sept plant → Nov-Jan harvest; Spring: Jan plant → Mar-May harvest
    gddToMaturity: 2400,         // CALIBRATED: Earlier maturity for extended window
    gddToPeak: 2600,             // Peak production after first set
    gddWindow: 2400,             // CALIBRATED: ~100+ days to cover bimodal Nov-May availability
    plantingMethod: 'transplant',
    transplantAge: 500,          // 5-6 weeks indoors
    notes: "BIMODAL in FL/TX: fall+spring plantings. Window widened 800→2400 GDD. Model needs TWO bloom events per year for warm regions."
  },
  tomato_beefsteak: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    gddToMaturity: 2900,         // 85-100 DTH (Cherokee Purple, Brandywine, Mortgage Lifter)
    gddToPeak: 3100,             // Heritage cultivars need longer season
    gddWindow: 900,              // ~4-6 week harvest window
    plantingMethod: 'transplant',
    transplantAge: 600,          // 6-8 weeks indoors (larger transplants for long-season)
    notes: "Long-season heirlooms. Optimal in Zone 10 fall planting (Aug-Sep). Transplanted at 6-8 weeks for head start. Climacteric, superb flavor. Poor fruit set >90°F."
  },
  tomato_cherry: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method - heat stress above 86°F
    gddToMaturity: 2300,         // 60-70 DTH (Sungold, Sweet 100, Matt's Wild Cherry)
    gddToPeak: 2500,             // Continuous production
    gddWindow: 1000,             // Extended harvest (6-8 weeks)
    plantingMethod: 'transplant',
    transplantAge: 450,          // 4-5 weeks indoors
    notes: "High yield, heat tolerant, continuous production. Typically transplanted at 4-5 weeks. Climacteric. Poor fruit set >90°F."
  },

  // PEPPERS - Hot and sweet types
  pepper_hot: {
    baseTemp: 55.0,              // Higher base temp than tomatoes
    maxTemp: 95.0,               // More heat-tolerant than tomatoes
    gddToMaturity: 2400,         // 70-90 DTH (Jalapeño, Serrano, Cayenne)
    gddToPeak: 2600,             // Peak flavor with full color development
    gddWindow: 1200,             // Very long harvest window (8-10 weeks)
    plantingMethod: 'transplant',
    transplantAge: 600,          // 6-8 weeks indoors (longer than tomatoes)
    notes: "Heat-tolerant, continuous production. Transplanted at 6-8 weeks (slower to germinate). Non-climacteric, harvest at any stage."
  },
  pepper_sweet: {
    baseTemp: 55.0,
    maxTemp: 95.0,               // More heat-tolerant than tomatoes
    gddToMaturity: 2200,         // 65-80 DTH (Bell, California Wonder, Jimmy Nardello)
    gddToPeak: 2500,             // Full color change (green → red/yellow)
    gddWindow: 900,              // ~5-6 week window
    plantingMethod: 'transplant',
    transplantAge: 600,          // 6-8 weeks indoors (same as hot peppers)
    notes: "Can harvest green (early) or full color (late). Transplanted at 6-8 weeks. Non-climacteric."
  },

  // BEANS - Bush and pole types
  bean_bush: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 1300,         // 50-60 DTH (Blue Lake, Provider, Contender)
    gddToPeak: 1400,             // Peak tenderness
    gddWindow: 200,              // ~2 week optimal window
    plantingMethod: 'direct_seed',
    notes: "Direct seed only - beans don't transplant well. Fast-growing. Pick continuously for best yield. Non-climacteric."
  },
  bean_pole: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 1600,         // 60-70 DTH (Kentucky Wonder, Scarlet Runner)
    gddToPeak: 1700,             // Peak production
    gddWindow: 400,              // Longer window than bush (3-4 weeks)
    plantingMethod: 'direct_seed',
    notes: "Direct seed only - beans don't transplant well. Continuous harvest over extended period. Non-climacteric."
  },

  // SQUASH/CUCURBITS
  squash_summer: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 1500,         // 45-55 DTH (Zucchini, Yellow Crookneck, Pattypan)
    gddToPeak: 1600,             // Continuous production
    gddWindow: 600,              // Harvest continuously (4-6 weeks)
    plantingMethod: 'either',    // Can transplant but often direct-seeded
    transplantAge: 200,          // 2-3 weeks if transplanting (not common)
    notes: "Usually direct-seeded, but can transplant if started in pots. Pick young for best quality (6-8 inches). Non-climacteric, fast-growing."
  },
  squash_winter: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 2800,         // 85-110 DTH (Butternut, Acorn, Hubbard)
    gddToPeak: 3000,             // Full maturity for storage
    gddWindow: 400,              // ~3 week harvest window
    plantingMethod: 'either',
    transplantAge: 200,          // 2-3 weeks if transplanting
    notes: "Usually direct-seeded, can transplant for early start. Non-climacteric. Cure after harvest for storage (2 weeks at 80°F)."
  },
  pumpkin: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 3000,         // 90-120 DTH (Jack-o'-lantern, Sugar Pie)
    gddToPeak: 3200,             // Full color and rind hardness
    gddWindow: 400,              // ~3 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded in place. Non-climacteric. Harvest before frost, cure for storage."
  },

  // CUCUMBERS
  cucumber_slicing: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 1600,         // 55-65 DTH (Marketmore, Straight Eight)
    gddToPeak: 1700,             // Peak production
    gddWindow: 400,              // ~3 week continuous harvest
    plantingMethod: 'either',
    transplantAge: 200,          // 2-3 weeks if transplanting
    notes: "Usually direct-seeded, can transplant for early start. Pick continuously for best production. Non-climacteric, 6-8 inch optimal."
  },
  cucumber_pickling: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 1400,         // 50-60 DTH (Boston Pickling, National Pickling)
    gddToPeak: 1500,             // Peak production
    gddWindow: 300,              // ~2-3 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded for pickling cukes. Harvest small (2-4 inches) for pickles. Non-climacteric."
  },

  // MELONS
  watermelon: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 2800,         // 80-95 DTH (Sugar Baby, Crimson Sweet, Charleston Gray)
    gddToPeak: 3000,             // Full sugar development
    gddWindow: 200,              // ~2 week window per cultivar
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded in place. Non-climacteric. Check ground spot, tendril, and hollow sound for ripeness."
  },
  cantaloupe: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method
    gddToMaturity: 2400,         // 70-85 DTH (Hale's Best, Ambrosia)
    gddToPeak: 2600,             // Full slip (separates from vine)
    gddWindow: 150,              // ~10-14 day window
    plantingMethod: 'either',
    transplantAge: 200,          // 2-3 weeks if transplanting
    notes: "Can be transplanted or direct-seeded. Climacteric. Full slip = optimal harvest. Strong aroma when ripe."
  },

  // SWEET CORN
  corn_sweet_early: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method (corn = primary use case)
    gddToMaturity: 2400,         // 65-75 DTH (Earlivee, Early Sunglow)
    gddToPeak: 2500,             // Milk stage = peak sweetness
    gddWindow: 100,              // Very short window (3-5 days)
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded in blocks for pollination. Non-climacteric. Harvest at milk stage (kernels pop, white liquid). Morning best."
  },
  corn_sweet_standard: {
    baseTemp: 50.0,
    maxTemp: 86.0,               // Standard 86/50 method (corn = primary use case)
    gddToMaturity: 2800,         // 80-90 DTH (Silver Queen, Peaches & Cream, Golden Bantam)
    gddToPeak: 2900,             // Milk stage
    gddWindow: 100,              // Very short window (3-5 days)
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded in blocks for pollination. Non-climacteric. Peak sweetness fleeting, convert to cold storage ASAP."
  },

  // OKRA
  okra: {
    baseTemp: 60.0,              // Very heat-loving
    // No maxTemp - okra thrives in extreme heat
    gddToMaturity: 1800,         // 50-65 DTH (Clemson Spineless, Burgundy)
    gddToPeak: 2000,             // Continuous production all summer
    gddWindow: 1500,             // Extended harvest (10+ weeks)
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded in place. Non-climacteric. Harvest young pods (3-4 inches) daily. Extremely heat-tolerant, no upper temp limit."
  },

  // EGGPLANT
  eggplant: {
    baseTemp: 55.0,
    maxTemp: 86.0,               // Standard heat stress threshold
    gddToMaturity: 2400,         // 70-85 DTH (Black Beauty, Japanese, Ichiban)
    gddToPeak: 2600,             // Full size but before seeds harden
    gddWindow: 800,              // ~5-6 week harvest
    plantingMethod: 'transplant',
    transplantAge: 600,          // 6-8 weeks indoors (similar to peppers)
    notes: "Transplanted at 6-8 weeks. Non-climacteric. Harvest when skin is glossy, before dull (overripe)."
  },

  // === ANNUAL VEGETABLES - COOL SEASON ===
  // Base temp 40-45F, frost-tolerant
  // Sources: UF/IFAS, Cornell, MSU Extension

  // LETTUCE - Multiple types
  lettuce_leafy: {
    baseTemp: 40.0,              // Low base temp for cool-season
    maxTemp: 75.0,               // Very heat-sensitive, bolts quickly above 75°F
    gddToMaturity: 800,          // 30-45 DTH (Oak Leaf, Salad Bowl, Black Seeded Simpson)
    gddToPeak: 900,              // Before bolting
    gddWindow: 300,              // ~2-3 week window before bolting
    plantingMethod: 'either',
    transplantAge: 150,          // 2-3 weeks if transplanting
    notes: "Can be direct-seeded or transplanted. Bolts in heat (>80°F). Succession plant every 2 weeks. Non-climacteric."
  },
  lettuce_head: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Very heat-sensitive, bolts quickly above 75°F
    gddToMaturity: 1200,         // 60-75 DTH (Iceberg, Buttercrunch, Romaine)
    gddToPeak: 1300,             // Tight head formation
    gddWindow: 200,              // ~2 week window
    plantingMethod: 'either',
    transplantAge: 200,          // 3-4 weeks if transplanting
    notes: "Can be direct-seeded or transplanted. Needs consistent moisture. Heat-sensitive, bolts easily. Non-climacteric."
  },

  // BRASSICAS - Cabbage family
  broccoli: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Heat-sensitive, poor head formation >75°F
    gddToMaturity: 1600,         // 55-75 DTH (Calabrese, DeCicco, Waltham)
    gddToPeak: 1700,             // Tight buds before flowering
    gddWindow: 150,              // ~10-14 day window per head
    plantingMethod: 'transplant',
    transplantAge: 400,          // 4-6 weeks indoors
    notes: "Transplanted at 4-6 weeks. Harvest main head, side shoots follow. Cool-season crop. Non-climacteric."
  },
  cabbage: {
    baseTemp: 40.0,
    maxTemp: 80.0,               // Slightly more heat-tolerant than broccoli
    gddToMaturity: 2000,         // 70-90 DTH (Early Jersey Wakefield, Copenhagen Market)
    gddToPeak: 2200,             // Firm head
    gddWindow: 400,              // ~3-4 week window, holds well
    plantingMethod: 'transplant',
    transplantAge: 400,          // 4-6 weeks indoors
    notes: "Transplanted at 4-6 weeks. Cold-hardy, can withstand light frost. Stores well. Non-climacteric."
  },
  cauliflower: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // More heat-sensitive than broccoli
    gddToMaturity: 1800,         // 60-80 DTH (Snowball, Amazing)
    gddToPeak: 1900,             // Tight, white curd
    gddWindow: 100,              // ~7-10 day window
    plantingMethod: 'transplant',
    transplantAge: 400,          // 4-6 weeks indoors
    notes: "Transplanted at 4-6 weeks. More heat-sensitive than broccoli. Blanch heads (tie leaves). Non-climacteric."
  },
  kale: {
    baseTemp: 40.0,
    maxTemp: 80.0,               // More heat-tolerant than most brassicas
    gddToMaturity: 1200,         // 50-65 DTH (Lacinato, Red Russian, Winterbor)
    gddToPeak: 1400,             // Sweetens after frost
    gddWindow: 2000,             // Extended harvest (12+ weeks)
    plantingMethod: 'either',
    transplantAge: 250,          // 3-4 weeks if transplanting
    notes: "Can be direct-seeded or transplanted. Very cold-hardy. Harvest outer leaves, plant continues. Non-climacteric."
  },

  // ROOT VEGETABLES
  carrot: {
    baseTemp: 40.0,
    maxTemp: 80.0,               // Reasonable heat tolerance
    gddToMaturity: 1400,         // 60-80 DTH (Nantes, Danvers, Chantenay)
    gddToPeak: 1600,             // Full size development
    gddWindow: 600,              // Long harvest window (5-6 weeks)
    plantingMethod: 'direct_seed',
    notes: "MUST be direct-seeded - taproot sensitive to transplanting. Can leave in ground (living storage). Sweetens after frost. Non-climacteric."
  },
  beet: {
    baseTemp: 40.0,
    maxTemp: 80.0,               // Reasonable heat tolerance
    gddToMaturity: 1200,         // 50-65 DTH (Detroit Dark Red, Golden, Chioggia)
    gddToPeak: 1300,             // 1.5-3 inch diameter optimal
    gddWindow: 400,              // ~3 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded - doesn't transplant well. Harvest young for tenderness. Both root and greens edible. Non-climacteric."
  },
  radish: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Heat-sensitive, becomes pithy >75°F
    gddToMaturity: 600,          // 25-35 DTH (Cherry Belle, French Breakfast, Daikon)
    gddToPeak: 700,              // Before pithy
    gddWindow: 100,              // Very short window (~7 days)
    plantingMethod: 'direct_seed',
    notes: "MUST be direct-seeded - taproot sensitive. Fastest crop. Succession plant every week. Bolts in heat. Non-climacteric."
  },
  turnip: {
    baseTemp: 40.0,
    maxTemp: 80.0,               // Reasonable heat tolerance
    gddToMaturity: 1100,         // 45-60 DTH (Purple Top, Tokyo Cross)
    gddToPeak: 1200,             // 2-3 inch diameter
    gddWindow: 300,              // ~2-3 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded - doesn't transplant well. Both root and greens edible. Cold-hardy. Non-climacteric."
  },

  // PEAS
  pea_garden: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Very heat-sensitive, stops producing >75°F
    gddToMaturity: 1100,         // 55-70 DTH (Green Arrow, Lincoln, Little Marvel)
    gddToPeak: 1200,             // Full pod but tender
    gddWindow: 150,              // ~10-14 day window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded - don't transplant well. Cool-season, heat-sensitive. Pick when pods full but tender. Non-climacteric."
  },
  pea_snap: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Very heat-sensitive, stops producing >75°F
    gddToMaturity: 1200,         // 60-75 DTH (Sugar Snap, Sugar Ann)
    gddToPeak: 1300,             // Full pod development
    gddWindow: 200,              // ~2 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded - don't transplant well. Eat pod and all. Continuous harvest. Cool-season. Non-climacteric."
  },

  // LEAFY GREENS
  spinach: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Very heat-sensitive, bolts quickly >75°F
    gddToMaturity: 900,          // 40-50 DTH (Bloomsdale, Space, Tyee)
    gddToPeak: 1000,             // Before bolting
    gddWindow: 300,              // ~2-3 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded for best results. Very cold-hardy. Bolts in heat/long days. Cut-and-come-again. Non-climacteric."
  },
  swiss_chard: {
    baseTemp: 40.0,
    maxTemp: 85.0,               // More heat-tolerant than most greens
    gddToMaturity: 1200,         // 50-60 DTH (Fordhook Giant, Bright Lights)
    gddToPeak: 1400,             // Full leaf development
    gddWindow: 2000,             // Extended harvest (12+ weeks)
    plantingMethod: 'either',
    transplantAge: 200,          // 2-3 weeks if transplanting
    notes: "Can be direct-seeded or transplanted. Heat-tolerant for a green. Harvest outer leaves continuously. Non-climacteric."
  },
  arugula: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Heat-sensitive, bolts quickly >75°F
    gddToMaturity: 700,          // 30-40 DTH (Astro, Roquette)
    gddToPeak: 800,              // Before bolting
    gddWindow: 200,              // ~2 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded. Fast-growing. Bolts quickly in heat. Succession plant weekly. Non-climacteric."
  },

  // ONIONS/ALLIUMS
  onion_bulb: {
    baseTemp: 40.0,
    maxTemp: 85.0,               // Reasonable heat tolerance during bulbing
    gddToMaturity: 2400,         // 90-120 DTH (Yellow Sweet Spanish, Red Wethersfield)
    gddToPeak: 2600,             // Tops fall over = ready
    gddWindow: 400,              // ~3 week window
    plantingMethod: 'either',    // From seed, sets, or transplants
    transplantAge: 400,          // 4-6 weeks if from transplants
    notes: "Can be grown from seed (direct), sets, or transplants. Day length sensitive (short/long day types). Cure after harvest. Non-climacteric."
  },
  onion_green: {
    baseTemp: 40.0,
    maxTemp: 85.0,               // Reasonable heat tolerance
    gddToMaturity: 1000,         // 60-70 DTH (scallions)
    gddToPeak: 1100,             // Pencil thickness
    gddWindow: 300,              // ~2-3 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded. Fast-growing. Succession plant for continuous harvest. Non-climacteric."
  },
  garlic: {
    baseTemp: 40.0,
    maxTemp: 85.0,               // Summer heat during final maturation is acceptable
    gddToMaturity: 3500,         // 180-240 DTH (depends on variety - hardneck vs softneck)
    gddToPeak: 3800,             // Lower leaves brown, tops still green
    gddWindow: 200,              // ~2 week window
    chillHoursRequired: 400,     // Vernalization requirement for bulbing
    plantingMethod: 'direct_seed',  // Planted from cloves, not seed
    notes: "Planted from cloves (not true seed). Plant fall, harvest summer. Requires cold period. Cure 2-4 weeks after harvest. Non-climacteric."
  },

  // === HERBS (ANNUAL) ===
  basil: {
    baseTemp: 50.0,
    maxTemp: 95.0,               // Heat-loving, thrives in hot weather
    gddToMaturity: 1400,         // 60-90 DTH (Genovese, Thai, Purple)
    gddToPeak: 1600,             // Continuous production
    gddWindow: 1200,             // Extended harvest (8-10 weeks)
    plantingMethod: 'either',
    transplantAge: 300,          // 3-4 weeks if transplanting
    notes: "Can be direct-seeded or transplanted. Pinch flowers to extend harvest. Heat-loving, frost-sensitive. Non-climacteric."
  },
  cilantro: {
    baseTemp: 40.0,
    maxTemp: 75.0,               // Very heat-sensitive, bolts quickly >75°F
    gddToMaturity: 900,          // 45-70 DTH (Santo, Calypso, Slow Bolt)
    gddToPeak: 1000,             // Before bolting
    gddWindow: 200,              // ~2 week window
    plantingMethod: 'direct_seed',
    notes: "Direct-seeded for best results. Bolts quickly in heat. Succession plant every 3 weeks. Non-climacteric."
  },
  dill: {
    baseTemp: 40.0,
    maxTemp: 80.0,               // Reasonable heat tolerance
    gddToMaturity: 1300,         // 60-70 DTH (Bouquet, Mammoth)
    gddToPeak: 1400,             // Before flowering (for leaves)
    gddWindow: 300,              // ~3 week window for leaves
    plantingMethod: 'direct_seed',
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
