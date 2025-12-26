#!/usr/bin/env tsx

/**
 * Fix Beef Breed Data - Separate Genetics from Feeding Practices
 *
 * CORRECTED MODEL:
 * - H (Heritage/Breed) = Marbling tendency, MUFA content, frame size (GENETIC)
 * - A (Agricultural) = Feed regime (grass vs grain) → Determines omega ratio
 *
 * Omega-6:omega-3 ratio is FEED-DRIVEN, not breed-driven.
 * Breed affects MUFA content and marbling amount, not PUFA ratio.
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface BreedUpdate {
  id: string
  marblingTendency: 'extreme' | 'high' | 'moderate' | 'low' | 'very_lean'
  mufaContent: 'very_high' | 'high' | 'moderate' | 'low'
  frameSize: 'large' | 'medium' | 'small'
  typicalProductionSystem: string // Observational context only
  notes: string // Updated to clarify genetics vs feeding
}

const BEEF_BREED_UPDATES: BreedUpdate[] = [
  // ========================================================================
  // ANGUS FAMILY
  // ========================================================================
  {
    id: 'black_angus',
    marblingTendency: 'high',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Versatile - feedlot most common, grass-finishing increasing',
    notes: 'Aberdeen Scotland. GENETICS: Naturally marble well, moderate frame. FEEDING: Performs well on either grass or grain. Most US Angus are feedlot-finished (15-20:1 omega), but grass-finished Angus exist (~3:1 omega). The omega ratio is determined by feed, not genetics.'
  },
  {
    id: 'red_angus',
    marblingTendency: 'high',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Versatile - same as Black Angus',
    notes: 'Red recessive gene, same Aberdeen genetics as Black Angus. Same marbling and MUFA genetics. Feed determines omega ratio.'
  },
  {
    id: 'certified_angus',
    marblingTendency: 'high',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Feedlot (extended for marbling)',
    notes: 'Brand program (top 1/3 of Angus), not a separate breed. GENETICS: Same as Angus. FEEDING: Extended feedlot typical to meet marbling standards. High marbling from extended grain = higher total fat, but omega ratio still feed-driven.'
  },
  {
    id: 'lowline_angus',
    marblingTendency: 'high',
    mufaContent: 'moderate',
    frameSize: 'small',
    typicalProductionSystem: 'Grass-fed friendly (smaller frame = less grain needed)',
    notes: 'Australian miniature Angus, 60% size. GENETICS: Same marbling tendency as standard Angus but smaller frame. FEEDING: Smaller frame makes grass-finishing more economical. Feed determines omega ratio.'
  },
  {
    id: 'angus_cross',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Commercial feedlot typical',
    notes: 'Hybrid vigor crosses. GENETICS: Varies by cross. FEEDING: Commercial operations typically feedlot-finish. Omega ratio determined by feed regime.'
  },
  {
    id: 'angus_dairy_cross',
    marblingTendency: 'low',
    mufaContent: 'low',
    frameSize: 'large',
    typicalProductionSystem: 'Commercial feedlot (dairy genetics need grain)',
    notes: 'Angus bull on Holstein cow. GENETICS: Dairy genetics = leaner (low marbling/MUFA). FEEDING: Typically feedlot to add any marbling. Omega ratio from feed, not genetics.'
  },

  // ========================================================================
  // WAGYU FAMILY
  // ========================================================================
  {
    id: 'japanese_black',
    marblingTendency: 'extreme',
    mufaContent: 'very_high',
    frameSize: 'medium',
    typicalProductionSystem: 'Extended feedlot (24-36mo, marbling obsession)',
    notes: 'Japanese Kuroge. GENETICS: Extreme marbling capacity, very high oleic acid (MUFA) = buttery texture. FEEDING: Japanese A5 system = 12-36 month grain finish for maximum marbling. High total fat and MUFA are genetic; omega-6:omega-3 ratio is from the grain feeding (12+ months feedlot = 20-26:1 regardless of breed).'
  },
  {
    id: 'american_wagyu',
    marblingTendency: 'high',
    mufaContent: 'high',
    frameSize: 'medium',
    typicalProductionSystem: 'VARIES - Snake River (feedlot) vs Everglades (pasture)',
    notes: 'Wagyu×Angus cross (typically 50% F1). GENETICS: High marbling, high MUFA (from Wagyu parent). FEEDING VARIES: Snake River Farms = 12+ month feedlot (26:1 omega), Everglades Ranch = pasture + free-choice grain (4-6:1 omega). SAME GENETICS, different omega outcomes from different feeding. Proves omega ratio is feed-driven.'
  },
  {
    id: 'fullblood_wagyu',
    marblingTendency: 'extreme',
    mufaContent: 'very_high',
    frameSize: 'medium',
    typicalProductionSystem: 'Extended feedlot typical',
    notes: '100% Wagyu genetics, no crossbreeding. GENETICS: Maximum marbling capacity, highest MUFA. FEEDING: Most producers do extended grain finishing for maximum marbling. Omega ratio determined by feed duration.'
  },
  {
    id: 'wagyu_f1',
    marblingTendency: 'high',
    mufaContent: 'high',
    frameSize: 'medium',
    typicalProductionSystem: 'Feedlot common, but grass-finishing possible',
    notes: '50% Wagyu, first-generation cross. GENETICS: Moderate-high marbling, elevated MUFA. FEEDING: Versatile - can be grass or grain finished. Omega ratio from feed choice.'
  },
  {
    id: 'wagyu_purebred',
    marblingTendency: 'extreme',
    mufaContent: 'very_high',
    frameSize: 'medium',
    typicalProductionSystem: 'Extended feedlot typical',
    notes: '93.75%+ Wagyu (multiple generations back-crossed). GENETICS: Near-fullblood marbling/MUFA. FEEDING: Extended grain typical. Omega ratio feed-driven.'
  },
  {
    id: 'kobe_style',
    marblingTendency: 'extreme',
    mufaContent: 'very_high',
    frameSize: 'medium',
    typicalProductionSystem: 'Extended feedlot (mimicking Kobe protocols)',
    notes: 'US-raised mimicking Kobe. GENETICS: Wagyu (can\'t legally be "Kobe" outside Hyogo). FEEDING: Extended grain to mimic Japanese system. The 20-26:1 omega is from 12+ month grain, not the Wagyu genetics.'
  },

  // ========================================================================
  // HEREFORD FAMILY
  // ========================================================================
  {
    id: 'hereford_traditional',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Versatile - efficient on grass, feedlot common',
    notes: 'English Herefordshire 1700s. GENETICS: Moderate marbling, efficient grazers. FEEDING: Historically grass cattle, modern production often includes feedlot. Omega ratio from feed choice.'
  },
  {
    id: 'polled_hereford',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Versatile',
    notes: 'Hornless mutation, same Hereford genetics. FEEDING: Versatile. Omega ratio feed-driven.'
  },
  {
    id: 'miniature_hereford',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'small',
    typicalProductionSystem: 'Grass-fed friendly (smaller frame)',
    notes: 'Bred down for small farms. GENETICS: Same Hereford traits, smaller frame. FEEDING: Smaller frame makes grass-finishing economical. Feed determines omega.'
  },
  {
    id: 'hereford_cross',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Commercial feedlot typical',
    notes: 'Hereford×Angus or Hereford×Continental common. GENETICS: Hybrid vigor. FEEDING: Commercial feedlot typical. Omega from feed.'
  },
  {
    id: 'miniature_polled_hereford',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'small',
    typicalProductionSystem: 'Grass-fed ideal',
    notes: 'Combines polled + miniature traits. GENETICS: Small frame, hornless. FEEDING: Grass-finishing economical. Omega from feed.'
  },

  // ========================================================================
  // CONTINENTAL BREEDS (European - Lean and Muscular)
  // ========================================================================
  {
    id: 'charolais',
    marblingTendency: 'low',
    mufaContent: 'low',
    frameSize: 'large',
    typicalProductionSystem: 'Feedlot (lean genetics need grain for any marbling)',
    notes: 'French Charolles. GENETICS: Very lean, muscular, large frame, low MUFA. FEEDING: Feedlot common to add any marbling. Even grain-fed stays relatively lean. Omega ratio from feed.'
  },
  {
    id: 'limousin',
    marblingTendency: 'low',
    mufaContent: 'low',
    frameSize: 'large',
    typicalProductionSystem: 'Feedlot',
    notes: 'French Limousin. GENETICS: Extremely lean (70%+ retail cuts), low MUFA. FEEDING: Feedlot typical. Stays lean regardless. Omega from feed.'
  },
  {
    id: 'simmental',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'large',
    typicalProductionSystem: 'Versatile',
    notes: 'Swiss dual-purpose origin (milk+meat). GENETICS: Larger frame, moderate marbling for Continental. FEEDING: Versatile. Omega from feed.'
  },
  {
    id: 'gelbvieh',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Versatile',
    notes: 'German Bavaria. GENETICS: Moderate marbling, maternal traits. FEEDING: Versatile. Omega from feed.'
  },
  {
    id: 'chianina',
    marblingTendency: 'very_lean',
    mufaContent: 'low',
    frameSize: 'large',
    typicalProductionSystem: 'Grass-fed or minimal grain',
    notes: 'Italian Chiana Valley, tallest cattle. GENETICS: Extremely lean, ancient breed, minimal marbling capacity. FEEDING: Stays lean regardless. Omega from feed.'
  },

  // ========================================================================
  // HERITAGE BREEDS (Grass-Optimized Genetics)
  // ========================================================================
  {
    id: 'galloway',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Grass-finished typical (aligned with breed strengths)',
    notes: 'Scottish Galloway. GENETICS: Moderate marbling, efficient grass conversion, cold-hardy, moderate MUFA. TYPICAL FEEDING: Heritage breeders typically grass-finish because breed excels on grass. The 2-4:1 omega is from GRASS-FINISHING, not from Galloway genetics. A feedlot-finished Galloway would have 15-20:1 omega like any other breed on grain.'
  },
  {
    id: 'belted_galloway',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Grass-finished typical',
    notes: '"Oreo cow" with white belt. GENETICS: Same as Galloway - efficient grazer, moderate marbling. FEEDING: Typically grass-finished. Omega from feed, not belt pattern.'
  },
  {
    id: 'devon',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Grass-finished typical',
    notes: 'English Devon, "Red Ruby". GENETICS: Triple-purpose heritage (beef, milk, oxen), moderate marbling. FEEDING: Colonial America grass cattle. Modern producers typically grass-finish. Omega from feed.'
  },
  {
    id: 'highland',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Grass-finished (browse/graze specialist)',
    notes: 'Scottish Highlands, long horns, shaggy coat. GENETICS: Cold-hardy, browse and graze, moderate marbling. FEEDING: Naturally suited to rough forage. Typically grass-finished. Omega from feed.'
  },
  {
    id: 'texas_longhorn',
    marblingTendency: 'low',
    mufaContent: 'low',
    frameSize: 'medium',
    typicalProductionSystem: 'Grass-fed (lean genetics)',
    notes: 'Spanish colonial, American West icon. GENETICS: Very lean, efficient on poor forage, low MUFA. FEEDING: Naturally suited to grass/browse. Omega from feed.'
  },
  {
    id: 'ancient_white_park',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Grass-finished (rare, heritage breeders)',
    notes: 'British medieval, critically rare. GENETICS: Ancient genetics, moderate marbling. FEEDING: Heritage producers grass-finish. Omega from feed.'
  },

  // ========================================================================
  // COMPOSITE BREEDS (Hybrid Development)
  // ========================================================================
  {
    id: 'brangus',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Commercial feedlot',
    notes: '3/8 Brahman, 5/8 Angus. GENETICS: Heat/insect tolerance from Brahman, marbling from Angus, moderate MUFA. FEEDING: Commercial feedlot typical. Omega from feed.'
  },
  {
    id: 'beefmaster',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'large',
    typicalProductionSystem: 'Versatile',
    notes: 'Hereford×Shorthorn×Brahman, Texas Lasater Ranch 1930s. GENETICS: Heat-tolerant, moderate marbling. FEEDING: Versatile. Omega from feed.'
  },
  {
    id: 'santa_gertrudis',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'large',
    typicalProductionSystem: 'Versatile',
    notes: 'Shorthorn×Brahman, King Ranch Texas, 3/8 Brahman. GENETICS: Heat-hardy, moderate marbling. FEEDING: Versatile. Omega from feed.'
  },
  {
    id: 'braford',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Versatile',
    notes: 'Hereford×Brahman. GENETICS: Combines Hereford quality + Brahman hardiness. FEEDING: Versatile. Omega from feed.'
  },
  {
    id: 'red_brangus',
    marblingTendency: 'moderate',
    mufaContent: 'moderate',
    frameSize: 'medium',
    typicalProductionSystem: 'Commercial feedlot',
    notes: 'Red Angus×Brahman. GENETICS: Same as Brangus but red coat. FEEDING: Commercial typical. Omega from feed.'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('FIX BEEF BREED DATA - SEPARATE GENETICS FROM FEEDING')
  console.log('='.repeat(80))
  console.log()
  console.log('Correcting model: Remove omegaBaseline, add genetic attributes')
  console.log()

  let updated = 0
  let errors = 0

  for (const breed of BEEF_BREED_UPDATES) {
    try {
      await runWriteTransaction(`
        MATCH (c:Cultivar {id: $id})
        WHERE c.productId = 'beef'

        // Remove misleading omega baseline
        REMOVE c.omegaBaseline

        // Add proper genetic attributes
        SET c.marblingTendency = $marblingTendency,
            c.mufaContent = $mufaContent,
            c.frameSize = $frameSize,
            c.typicalProductionSystem = $typicalProductionSystem,
            c.notes = $notes

        RETURN c.displayName as name
      `, {
        id: breed.id,
        marblingTendency: breed.marblingTendency,
        mufaContent: breed.mufaContent,
        frameSize: breed.frameSize,
        typicalProductionSystem: breed.typicalProductionSystem,
        notes: breed.notes
      })

      updated++
      console.log(`  ✓ Fixed ${breed.id}`)
    } catch (error: any) {
      console.error(`  ❌ Error updating ${breed.id}:`, error.message)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`RESULTS: ${updated}/${BEEF_BREED_UPDATES.length} breeds updated`)
  if (errors > 0) {
    console.log(`Errors: ${errors}`)
  }
  console.log('='.repeat(80))
  console.log()

  // Verify changes
  console.log('Verifying genetic attributes on sample breeds...')
  console.log()

  const samples = ['american_wagyu', 'galloway', 'black_angus', 'charolais']

  for (const breedId of samples) {
    const result = await runWriteTransaction<any>(`
      MATCH (c:Cultivar {id: $id})
      RETURN c.displayName as name,
             c.marblingTendency as marbling,
             c.mufaContent as mufa,
             c.frameSize as frame,
             c.omegaBaseline as omegaBaseline
    `, { id: breedId })

    if (result.length > 0) {
      const r = result[0]
      console.log(`${r.name}:`)
      console.log(`  Marbling: ${r.marbling}`)
      console.log(`  MUFA: ${r.mufa}`)
      console.log(`  Frame: ${r.frame}`)
      console.log(`  omegaBaseline removed: ${r.omegaBaseline === null || r.omegaBaseline === undefined ? '✅' : '❌ STILL PRESENT'}`)
      console.log()
    }
  }

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
