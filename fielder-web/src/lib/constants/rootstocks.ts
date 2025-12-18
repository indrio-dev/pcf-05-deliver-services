/**
 * =============================================================================
 * ROOTSTOCK DATABASE WITH BRIX MODIFIERS
 * =============================================================================
 *
 * Ported from: legacy/python_engine/fielder/models/crop.py
 *
 * Rootstock affects the cultivar's genetic potential for quality:
 * - Higher quality stocks (Carrizo, Sour Orange): +0.3 to +0.6 Brix
 * - Neutral stocks (Cleopatra): ~0.0 to +0.2 Brix
 * - Lower quality stocks (Swingle, Rough Lemon): -0.5 to -0.8 Brix
 *
 * Research sources:
 * - Castle, W.S. et al. - UF/IFAS rootstock trials
 * - UC Davis citrus rootstock guides
 * - DPI NSW citrus rootstock selection guides
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Crop categories for rootstock classification.
 * More specific than ProductCategory since rootstocks are crop-specific.
 */
export type RootstockCropCategory = 'citrus' | 'stoneFruit' | 'pomeFruit' | 'nut'

export type RootstockVigor = 'dwarfing' | 'semi-dwarfing' | 'medium' | 'vigorous'

export type DiseaseResistanceLevel = 'susceptible' | 'moderate' | 'tolerant' | 'immune'

export interface Rootstock {
  id: string
  name: string
  cropCategories: RootstockCropCategory[]

  // Quality modifiers
  brixModifier: number              // Range: -0.8 to +0.6 - added to cultivar base
  brixModifierRange?: [number, number]  // Min/max observed in trials

  // Growth characteristics
  vigor: RootstockVigor
  coldHardyToF?: number             // Minimum temperature tolerance

  // Disease resistance (citrus-specific)
  diseaseResistance?: {
    ctv?: DiseaseResistanceLevel    // Citrus Tristeza Virus
    phytophthora?: DiseaseResistanceLevel
    nematodes?: DiseaseResistanceLevel
    hlb?: DiseaseResistanceLevel    // Huanglongbing (citrus greening)
  }

  // Additional info
  notes?: string
  sources: string[]
}

// =============================================================================
// CITRUS ROOTSTOCKS
// =============================================================================

/**
 * Citrus rootstock Brix modifiers based on UF/IFAS research.
 *
 * These modifiers are ADDED to the cultivar's base Brix to calculate
 * genetic ceiling:
 *
 *   Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod
 *
 * Example: Navel orange (base 11.0) on Carrizo (+0.6) at prime age (0.0)
 *          at peak timing (0.0) = 11.6 Brix genetic ceiling
 */
export const CITRUS_ROOTSTOCKS: Rootstock[] = [
  // --- HIGH QUALITY STOCKS ---
  {
    id: 'carrizo',
    name: 'Carrizo Citrange',
    cropCategories: ['citrus'],
    brixModifier: 0.6,
    brixModifierRange: [0.4, 0.8],
    vigor: 'medium',
    coldHardyToF: 20,
    diseaseResistance: {
      ctv: 'tolerant',
      phytophthora: 'tolerant',
      nematodes: 'susceptible',
    },
    notes: 'Consistently lifts SSC/internal quality on navels. Most common commercial rootstock.',
    sources: ['UF/IFAS', 'UC Davis', 'Castle et al.']
  },
  {
    id: 'c35',
    name: 'C-35 Citrange',
    cropCategories: ['citrus'],
    brixModifier: 0.6,
    brixModifierRange: [0.4, 0.7],
    vigor: 'semi-dwarfing',
    coldHardyToF: 18,
    diseaseResistance: {
      ctv: 'tolerant',
      phytophthora: 'tolerant',
      nematodes: 'susceptible',
    },
    notes: 'Similar quality to Carrizo with smaller tree size. Good for high-density planting.',
    sources: ['UF/IFAS', 'UC Davis']
  },
  {
    id: 'sour_orange',
    name: 'Sour Orange',
    cropCategories: ['citrus'],
    brixModifier: 0.5,
    brixModifierRange: [0.3, 0.6],
    vigor: 'medium',
    coldHardyToF: 22,
    diseaseResistance: {
      ctv: 'susceptible',  // CTV devastated sour orange in FL
      phytophthora: 'tolerant',
      nematodes: 'moderate',
    },
    notes: 'Excellent quality but CTV susceptible - legacy blocks only. Still used in Texas/Spain.',
    sources: ['UF/IFAS', 'Texas A&M', 'DPI NSW']
  },
  {
    id: 'trifoliate',
    name: 'Trifoliate Orange (Poncirus)',
    cropCategories: ['citrus'],
    brixModifier: 0.5,
    brixModifierRange: [0.3, 0.6],
    vigor: 'dwarfing',
    coldHardyToF: 5,  // Most cold-hardy citrus rootstock
    diseaseResistance: {
      ctv: 'immune',
      phytophthora: 'tolerant',
      nematodes: 'tolerant',
    },
    notes: 'High SSC, smaller fruit. Best cold hardiness. Incompatible with some scion varieties.',
    sources: ['UF/IFAS', 'LSU AgCenter']
  },

  // --- NEUTRAL STOCKS ---
  {
    id: 'cleopatra',
    name: 'Cleopatra Mandarin',
    cropCategories: ['citrus'],
    brixModifier: 0.2,
    brixModifierRange: [0.0, 0.3],
    vigor: 'medium',
    coldHardyToF: 20,
    diseaseResistance: {
      ctv: 'moderate',
      phytophthora: 'susceptible',
      nematodes: 'moderate',
    },
    notes: 'Good SSC but slow to bear. Traditional mandarin rootstock.',
    sources: ['UF/IFAS', 'UC Davis']
  },

  // --- LOWER QUALITY STOCKS ---
  {
    id: 'swingle',
    name: 'Swingle Citrumelo',
    cropCategories: ['citrus'],
    brixModifier: -0.5,
    brixModifierRange: [-0.7, -0.3],
    vigor: 'vigorous',
    coldHardyToF: 18,
    diseaseResistance: {
      ctv: 'tolerant',
      phytophthora: 'tolerant',
      nematodes: 'tolerant',
    },
    notes: 'Lower SSC, granulation risk for navels. High yield, disease resistant.',
    sources: ['UF/IFAS', 'Castle et al.']
  },
  {
    id: 'rough_lemon',
    name: 'Rough Lemon',
    cropCategories: ['citrus'],
    brixModifier: -0.7,
    brixModifierRange: [-0.9, -0.5],
    vigor: 'vigorous',
    coldHardyToF: 26,
    diseaseResistance: {
      ctv: 'moderate',
      phytophthora: 'susceptible',
      nematodes: 'moderate',
    },
    notes: 'Vigorous, dilutes SSC. High yield but lower quality. Sandy soil tolerant.',
    sources: ['UF/IFAS', 'DPI NSW']
  },
  {
    id: 'volkamer',
    name: 'Volkamer Lemon',
    cropCategories: ['citrus'],
    brixModifier: -0.7,
    brixModifierRange: [-0.9, -0.5],
    vigor: 'vigorous',
    coldHardyToF: 24,
    diseaseResistance: {
      ctv: 'moderate',
      phytophthora: 'susceptible',
      nematodes: 'susceptible',
    },
    notes: 'Similar to Rough Lemon. Used for lemons where SSC less critical.',
    sources: ['UF/IFAS', 'UC Davis']
  },
  {
    id: 'macrophylla',
    name: 'Macrophylla (Alemow)',
    cropCategories: ['citrus'],
    brixModifier: -0.8,
    brixModifierRange: [-1.0, -0.6],
    vigor: 'vigorous',
    coldHardyToF: 28,
    diseaseResistance: {
      ctv: 'moderate',
      phytophthora: 'susceptible',
      nematodes: 'susceptible',
    },
    notes: 'Lowest SSC grouping. Fast growing, short-lived. Lemons only.',
    sources: ['UF/IFAS', 'UC Davis']
  },
]

// =============================================================================
// STONE FRUIT ROOTSTOCKS (Future expansion)
// =============================================================================

export const STONE_FRUIT_ROOTSTOCKS: Rootstock[] = [
  // Peach rootstocks - quality impact less studied than citrus
  {
    id: 'lovell',
    name: 'Lovell',
    cropCategories: ['stoneFruit'],
    brixModifier: 0.0,  // Reference standard
    vigor: 'vigorous',
    coldHardyToF: -15,
    notes: 'Standard peach rootstock. Good vigor and adaptability.',
    sources: ['UC Davis', 'UGA Extension']
  },
  {
    id: 'guardian',
    name: 'Guardian (BY520-9)',
    cropCategories: ['stoneFruit'],
    brixModifier: 0.0,
    vigor: 'vigorous',
    coldHardyToF: -10,
    notes: 'Peach tree short life (PTSL) resistant. Southeast preferred.',
    sources: ['Clemson Extension', 'USDA']
  },
  {
    id: 'citation',
    name: 'Citation',
    cropCategories: ['stoneFruit'],
    brixModifier: 0.2,
    vigor: 'semi-dwarfing',
    coldHardyToF: -5,
    notes: 'Semi-dwarf interstock. Better fruit color, may improve Brix.',
    sources: ['UC Davis', 'Dave Wilson Nursery']
  },
]

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get rootstock by ID.
 */
export function getRootstock(id: string): Rootstock | undefined {
  return [...CITRUS_ROOTSTOCKS, ...STONE_FRUIT_ROOTSTOCKS].find(r => r.id === id)
}

/**
 * Get Brix modifier for a rootstock ID.
 * Returns 0 if rootstock not found (neutral impact).
 */
export function getRootstockBrixModifier(rootstockId: string | undefined): number {
  if (!rootstockId) return 0
  const rootstock = getRootstock(rootstockId)
  return rootstock?.brixModifier ?? 0
}

/**
 * Get rootstocks by crop category.
 */
export function getRootstocksForCategory(category: RootstockCropCategory): Rootstock[] {
  return [...CITRUS_ROOTSTOCKS, ...STONE_FRUIT_ROOTSTOCKS].filter(
    r => r.cropCategories.includes(category)
  )
}

/**
 * Get rootstocks sorted by Brix modifier (highest to lowest).
 */
export function getRootstocksByQuality(category?: RootstockCropCategory): Rootstock[] {
  let stocks = [...CITRUS_ROOTSTOCKS, ...STONE_FRUIT_ROOTSTOCKS]
  if (category) {
    stocks = stocks.filter(r => r.cropCategories.includes(category))
  }
  return stocks.sort((a, b) => b.brixModifier - a.brixModifier)
}
