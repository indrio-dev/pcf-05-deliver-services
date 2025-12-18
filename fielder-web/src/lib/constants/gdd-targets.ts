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
  gddToMaturity: number      // GDD from bloom/leaf-out to harvestable
  gddToPeak?: number         // GDD from bloom/leaf-out to peak quality
  gddToGoodFlavor?: number   // GDD to good flavor (citrus-specific)
  gddWindow: number          // GDD range during which quality remains high
  chillHoursRequired?: number // Chill hours needed (stone/pome fruit)
  notes?: string
}

export const CROP_GDD_TARGETS: Record<string, GDDTarget> = {
  // === CITRUS ===
  // Base temp 55F for all citrus
  // Long development period (9-12 months from bloom to harvest)
  navel_orange: {
    baseTemp: 55.0,
    // CALIBRATED for actual Florida weather: ~22 GDD/day average
    // Bloom mid-March → Mature Nov 1 (230 days) → Peak Dec 15 (275 days)
    gddToMaturity: 5100,        // ~230 days, SSC >= 8, ratio >= 9:1
    gddToGoodFlavor: 5600,      // ~250 days, BrimA >= 7.5
    gddToPeak: 6100,            // ~275 days, SSC ~12, TA ~1.0
    gddWindow: 2000,            // ~90 day window (Nov 1 - Jan 31)
    notes: "Quality holds well on tree, entire Nov-Jan window is optimal"
  },
  valencia: {
    baseTemp: 55.0,
    // CALIBRATED: Bloom March → Mature Mar (next yr, 365 days) → Peak May (410 days)
    gddToMaturity: 8000,  // ~365 days, March start of season
    gddToPeak: 9000,      // ~410 days, April-May peak (13-14 months from bloom)
    gddWindow: 2200,      // March-June = ~100 days
    notes: "Late season (Mar-Jun), peak Apr-May, can regreen if left too long"
  },
  grapefruit: {
    baseTemp: 55.0,
    // CALIBRATED: Bloom March → Mature Nov (245 days) → Peak Jan (320 days)
    gddToMaturity: 5500,  // ~245 days
    gddToPeak: 7100,      // ~320 days (mid-January)
    gddWindow: 4000,      // ~180 days window (Nov-May)
    notes: "Very long harvest window, holds well on tree"
  },
  tangerine: {
    baseTemp: 55.0,
    // CALIBRATED: Bloom March → Mature Nov (240 days) → Peak Dec (260 days)
    gddToMaturity: 5300,  // ~240 days
    gddToPeak: 5700,      // ~260 days (mid-December)
    gddWindow: 900,       // ~40 days (Nov-Dec)
    notes: "Shorter season than oranges, peak for holidays"
  },
  satsuma: {
    baseTemp: 55.0,
    // CALIBRATED: Bloom March → Mature Oct (210 days) → Peak Nov (230 days)
    gddToMaturity: 4600,  // ~210 days
    gddToPeak: 5100,      // ~230 days (early November)
    gddWindow: 700,       // ~30 days (Oct-Nov)
    notes: "Early season, cold-tolerant, seedless"
  },

  // === STONE FRUIT ===
  // Base temp 40-45F, bloom to harvest 90-150 days
  peach: {
    baseTemp: 45.0,
    gddToMaturity: 1800,
    gddToPeak: 2000,
    gddWindow: 150,              // ~7-14 day window per cultivar
    chillHoursRequired: 650,    // Typical for commercial cultivars
    notes: "Climacteric, continue ripening after harvest"
  },
  sweet_cherry: {
    baseTemp: 40.0,
    gddToMaturity: 1400,
    gddToPeak: 1550,
    gddWindow: 100,              // Very short window (7-10 days)
    chillHoursRequired: 1100,
    notes: "Non-climacteric, must pick at peak"
  },
  tart_cherry: {
    // VALIDATED: Zavalloni et al. 2006, J. Amer. Soc. Hort. Sci. 131(5):601-607
    baseTemp: 39.2,              // 4°C - validated by Eisensmith et al.
    gddToMaturity: 1000,         // ~1000 GDD base 4°C from full bloom
    gddToPeak: 1100,             // Full fruit development
    gddWindow: 80,               // Very short window (7-10 days)
    chillHoursRequired: 954,
    notes: "Primarily for processing. Model R²=0.992 phenology"
  },

  // === POME FRUIT ===
  // Base temp 40-43F, 130-180 days bloom to harvest
  apple: {
    baseTemp: 43.0,
    gddToMaturity: 2200,
    gddToPeak: 2500,
    gddWindow: 200,              // 2-3 week window, varies by cultivar
    chillHoursRequired: 1000,
    notes: "Climacteric, starch converts to sugar post-harvest"
  },
  pear: {
    baseTemp: 40.0,
    gddToMaturity: 2400,
    gddToPeak: 2700,
    gddWindow: 800,              // Aug-Oct (Bartlett through Comice)
    chillHoursRequired: 800,
    notes: "MUST ripen OFF tree, unique among tree fruits"
  },

  // === BERRIES ===
  strawberry: {
    baseTemp: 50.0,
    // Florida: Dec-Mar harvest, Jan-Feb peak (from Oct 1 planting)
    gddToMaturity: 700,          // ~65 days to December harvest start
    gddToPeak: 1300,             // ~120 days to Jan-Feb peak
    gddWindow: 1100,             // Dec-Mar = ~105 days
    notes: "Non-climacteric, must harvest at full color"
  },
  blueberry: {
    baseTemp: 45.0,
    gddToMaturity: 1200,
    gddToPeak: 1400,
    gddWindow: 100,
    chillHoursRequired: 800,     // Varies greatly by cultivar
    notes: "Non-climacteric, multiple picks over 4-6 weeks"
  },

  // === TROPICAL/SUBTROPICAL ===
  mango: {
    baseTemp: 60.0,
    gddToMaturity: 2800,
    gddToPeak: 3200,
    gddWindow: 300,              // Varies by cultivar
    chillHoursRequired: 0,
    notes: "Climacteric, chill injury below 55F"
  },
  pomegranate: {
    baseTemp: 50.0,
    // California: Sept-Nov harvest, Oct-Nov peak (from April 15 bloom)
    gddToMaturity: 3800,         // ~138 days to September start
    gddToPeak: 4500,             // ~165 days to Oct-Nov peak
    gddWindow: 1000,             // Sept-Nov = ~75 days
    chillHoursRequired: 150,
    notes: "Non-climacteric, stores well"
  },

  // === NUTS ===
  pecan: {
    baseTemp: 65.0,
    gddToMaturity: 2600,         // Shuck split
    gddToPeak: 2900,             // Full oil development
    gddWindow: 400,              // Harvest window generous
    chillHoursRequired: 500,
    notes: "Quality = oil content not Brix, alternate bearing"
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
