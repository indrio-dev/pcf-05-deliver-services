/**
 * Precocious Cultivars - Produce quality fruit at young age
 * 
 * Based on Georgia UGA 2021 training data:
 * US Superna produced 14.4°Bx at only 2 years old (no age penalty!)
 */

export interface PrecociousCultivar {
  cultivarId: string
  displayName: string
  noAgePenalty: boolean
  earlyBearingAge: number  // Years to quality production
  notes: string
  source: string
}

export const PRECOCIOUS_CULTIVARS: PrecociousCultivar[] = [
  {
    cultivarId: 'us_superna',
    displayName: 'US Superna (88-2)',
    noAgePenalty: true,
    earlyBearingAge: 2,  // Quality fruit from year 2!
    notes: 'Exceptional precocious mandarin. Georgia data: 14.4°Bx at 2 years old (typical would be 10-11°Bx). No age penalty needed.',
    source: 'georgia_uga_2021',
  },

  // Add more as discovered from training data
]

/**
 * Check if cultivar is precocious (no age penalty)
 */
export function isPrecociousCultivar(cultivarId: string): boolean {
  return PRECOCIOUS_CULTIVARS.some(c => c.cultivarId === cultivarId)
}

/**
 * Get age modifier with precocious check
 */
export function getAgeModifier(cultivarId: string, ageYears: number): number {
  // Check if precocious
  if (isPrecociousCultivar(cultivarId)) {
    return 0.0  // No penalty!
  }

  // Standard age modifiers
  if (ageYears < 3) return -0.8
  if (ageYears < 5) return -0.5
  if (ageYears < 8) return -0.2
  if (ageYears <= 18) return 0.0  // Prime
  if (ageYears <= 25) return -0.2
  return -0.3  // Declining
}
