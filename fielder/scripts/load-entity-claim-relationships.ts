#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Create Entity→Claim relationships based on entity features and certifications
 *
 * Maps entity.features and entity.certifications arrays to Claim nodes
 *
 * Examples:
 * - entity.certifications includes 'organic' → HAS_CLAIM(organic)
 * - entity.features includes 'grass_fed' → HAS_CLAIM(grass_fed)
 * - entity.features includes 'pasture_raised' → HAS_CLAIM(pasture_raised)
 */

// Feature/certification strings → Claim ID mapping
const FEATURE_TO_CLAIM_MAP: Record<string, string> = {
  // Certifications (exact matches)
  'organic': 'organic',
  'usda_organic': 'organic',
  'certified_organic': 'organic',
  'non_gmo': 'non_gmo',
  'non-gmo': 'non_gmo',
  'nongmo': 'non_gmo',

  // Feeding practices
  'grass_fed': 'grass_fed',
  'grassfed': 'grass_fed',
  'grass-fed': 'grass_fed',
  'grass_finished': 'grass_finished',
  'grass-finished': 'grass_finished',
  'pasture_raised': 'pasture_raised',
  'pasture-raised': 'pasture_raised',
  'pasture': 'pasture_raised',

  // Animal welfare
  'cage_free': 'cage_free',
  'cage-free': 'cage_free',
  'cagefree': 'cage_free',
  'free_range': 'free_range',
  'free-range': 'free_range',
  'freerange': 'free_range',

  // Processing
  'natural': 'natural',
  'all_natural': 'natural',

  // Antibiotics/hormones
  'no_antibiotics': 'no_antibiotics',
  'antibiotic_free': 'no_antibiotics',
  'no_hormones': 'no_hormones',
  'hormone_free': 'no_hormones',
}

// Partial match patterns (for features like "pasture_raised_eggs")
const PARTIAL_PATTERNS: Array<{ pattern: RegExp; claimId: string }> = [
  { pattern: /organic/i, claimId: 'organic' },
  { pattern: /grass.?fed/i, claimId: 'grass_fed' },
  { pattern: /grass.?finish/i, claimId: 'grass_finished' },
  { pattern: /pasture/i, claimId: 'pasture_raised' },
  { pattern: /cage.?free/i, claimId: 'cage_free' },
  { pattern: /free.?range/i, claimId: 'free_range' },
  { pattern: /non.?gmo/i, claimId: 'non_gmo' },
]

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CREATE ENTITY→CLAIM RELATIONSHIPS                     ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let stats = {
    entitiesProcessed: 0,
    relationshipsCreated: 0,
    byClaim: {} as Record<string, number>,
  }

  // =========================================================================
  // STEP 1: Get all entities with features or certifications
  // =========================================================================
  console.log('STEP 1: Finding entities with features/certifications...\n')

  const getEntitiesQuery = `
    MATCH (e:Entity)
    WHERE size(e.features) > 0 OR size(e.certifications) > 0
    RETURN e.id as id,
           e.name as name,
           e.features as features,
           e.certifications as certifications
  `

  const entities = await runWriteTransaction(getEntitiesQuery, {})

  console.log(`Found ${entities.length} entities with features/certifications\n`)

  // =========================================================================
  // STEP 2: Map features/certifications to claims
  // =========================================================================
  console.log('STEP 2: Creating Entity→Claim relationships...\n')

  for (const entity of entities) {
    const entityId = entity.id
    const features = entity.features || []
    const certifications = entity.certifications || []
    const allAttributes = [...features, ...certifications]

    const matchedClaims = new Set<string>()

    // Try exact matches first
    for (const attr of allAttributes) {
      const normalized = attr.toLowerCase().trim().replace(/\s+/g, '_')
      const claimId = FEATURE_TO_CLAIM_MAP[normalized]

      if (claimId) {
        matchedClaims.add(claimId)
      }
    }

    // Try partial pattern matches
    for (const attr of allAttributes) {
      for (const { pattern, claimId } of PARTIAL_PATTERNS) {
        if (pattern.test(attr) && !matchedClaims.has(claimId)) {
          matchedClaims.add(claimId)
        }
      }
    }

    // Create relationships for matched claims
    for (const claimId of matchedClaims) {
      const createRelQuery = `
        MATCH (e:Entity {id: $entityId})
        MATCH (c:Claim {id: $claimId})
        MERGE (e)-[:HAS_CLAIM]->(c)
        RETURN count(*) as created
      `

      try {
        await runWriteTransaction(createRelQuery, {
          entityId,
          claimId,
        })

        stats.relationshipsCreated++
        stats.byClaim[claimId] = (stats.byClaim[claimId] || 0) + 1
      } catch (error) {
        // Claim might not exist, skip
      }
    }

    stats.entitiesProcessed++

    if (stats.entitiesProcessed % 1000 === 0) {
      console.log(`  ✓ Processed ${stats.entitiesProcessed} entities, created ${stats.relationshipsCreated} relationships`)
    }
  }

  console.log(`\n✓ Processed ${stats.entitiesProcessed} entities`)
  console.log(`✓ Created ${stats.relationshipsCreated} Entity→Claim relationships\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  ENTITY→CLAIM RELATIONSHIPS COMPLETE                   ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Relationships by claim:`)
  const sorted = Object.entries(stats.byClaim).sort((a, b) => b[1] - a[1])
  for (const [claimId, count] of sorted) {
    console.log(`  ${claimId}: ${count} entities`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
