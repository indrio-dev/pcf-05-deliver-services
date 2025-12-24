#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify SHARE Profiles and demonstrate inference engine
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY SHARE PROFILES (INFERENCE ENGINE)              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: Profile counts
  console.log('Query 1: Profile Statistics')
  console.log('─────────────────────────────────────────────────────────\n')

  const statsQuery = `
    MATCH (p:ShareProfile)
    RETURN count(p) as total,
           p.profileType as profileType,
           count(*) as count
    ORDER BY count DESC
  `

  const statsGrouped = await runWriteTransaction(`
    MATCH (p:ShareProfile)
    WITH p.profileType as profileType, count(p) as count
    RETURN profileType, count
    ORDER BY count DESC
  `, {})

  console.log('By profile type:')
  for (const row of statsGrouped) {
    console.log(`  ${row.profileType}: ${row.count}`)
  }

  const categoryGrouped = await runWriteTransaction(`
    MATCH (p:ShareProfile)
    WITH p.category as category, count(p) as count
    RETURN category, count
    ORDER BY count DESC
  `, {})

  console.log('\nBy category:')
  for (const row of categoryGrouped) {
    console.log(`  ${row.category}: ${row.count}`)
  }

  // Query 2: Complete profile example (Beef True Grass)
  console.log('\n\nQuery 2: Complete Profile Example (True Grass-Fed Beef)')
  console.log('─────────────────────────────────────────────────────────\n')

  const profileQuery = `
    MATCH (p:ShareProfile {id: 'beef_true_grass'})
    OPTIONAL MATCH (p)-[:REQUIRES_CLAIM]->(rc:Claim)
    OPTIONAL MATCH (p)-[:EXCLUDES_CLAIM]->(ec:Claim)
    RETURN p,
           collect(DISTINCT rc.name) as requiredClaims,
           collect(DISTINCT ec.name) as excludedClaims
  `

  const profile = await runWriteTransaction(profileQuery, {})

  if (profile.length > 0) {
    const p = profile[0].p.properties
    console.log(`${p.name} (${p.code})\n`)
    console.log(`CLASSIFICATION:`)
    console.log(`  Category: ${p.category}`)
    console.log(`  Profile Type: ${p.profileType}`)
    console.log(`  Quality Tier: ${p.qualityTier}`)
    console.log(`  Quality Rank: ${p.qualityRank} (1 = best in category)\n`)

    console.log(`QUALITY ESTIMATE:`)
    console.log(`  Metric: ${p.primaryQualityMetric}`)
    console.log(`  Omega Ratio: ${p.estimatedOmegaMin}-${p.estimatedOmegaMax}:1 (midpoint: ${p.omegaMidpoint}:1)`)
    console.log(`  Feeding Regime: ${p.feedingRegime}`)
    console.log(`  CAFO Exclusion: ${p.hasCAFOExclusion}\n`)

    console.log(`CLAIMS:`)
    console.log(`  Required: ${profile[0].requiredClaims.join(', ') || 'None mapped (need claim text matching)'}`)
    console.log(`  Excluded: ${profile[0].excludedClaims.join(', ') || 'None mapped'}\n`)

    console.log(`SHARE PILLAR SUMMARIES:`)
    console.log(`  S (Soil): ${p.soilPillarSummary}`)
    console.log(`  H (Heritage): ${p.heritagePillarSummary}`)
    console.log(`  A (Agricultural): ${p.agriculturalPillarSummary}`)
    console.log(`  R (Ripen): ${p.ripenPillarSummary}`)
    console.log(`  E (Enrich): ${p.enrichPillarSummary}\n`)

    if (p.notes) {
      console.log(`NOTES: ${p.notes}\n`)
    }

    if (p.redFlags && p.redFlags.length > 0) {
      console.log(`RED FLAGS:`)
      for (const flag of p.redFlags) {
        console.log(`  ⚠️  ${flag}`)
      }
    }
  }

  // Query 3: Compare beef profiles by omega ratio
  console.log('\n\nQuery 3: Beef Profiles Ranked by Quality (Omega Ratio)')
  console.log('─────────────────────────────────────────────────────────\n')

  const beefQuery = `
    MATCH (p:ShareProfile)
    WHERE p.category = 'beef'
    RETURN p.name as profile,
           p.code as code,
           p.omegaMidpoint as omega,
           p.qualityTier as tier,
           p.qualityRank as rank
    ORDER BY p.qualityRank ASC
  `

  const beefProfiles = await runWriteTransaction(beefQuery, {})

  for (const row of beefProfiles) {
    const omega = row.omega ? `${row.omega}:1` : 'N/A'
    console.log(`  ${row.rank}. ${row.profile} (${row.code})`)
    console.log(`     Omega: ${omega}  Tier: ${row.tier}`)
  }

  // Query 4: Citrus profiles by Brix
  console.log('\n\nQuery 4: Citrus Profiles Ranked by Brix')
  console.log('─────────────────────────────────────────────────────────\n')

  const citrusQuery = `
    MATCH (p:ShareProfile)
    WHERE p.category = 'citrus'
    RETURN p.name as profile,
           p.code as code,
           p.brixMidpoint as brix,
           p.estimatedBrixMin as brixMin,
           p.estimatedBrixMax as brixMax,
           p.qualityTier as tier
    ORDER BY p.brixMidpoint DESC
  `

  const citrusProfiles = await runWriteTransaction(citrusQuery, {})

  for (const row of citrusProfiles) {
    const brix = row.brix ? `${row.brix}°Bx (${row.brixMin}-${row.brixMax}°Bx)` : 'N/A'
    console.log(`  • ${row.profile} (${row.code})`)
    console.log(`    Brix: ${brix}  Tier: ${row.tier}`)
  }

  // Query 5: Profiles with CAFO exclusion (quality indicator for meat)
  console.log('\n\nQuery 5: Meat Profiles with CAFO Exclusion')
  console.log('(True quality vs feedlot-finished)')
  console.log('─────────────────────────────────────────────────────────\n')

  const cafoQuery = `
    MATCH (p:ShareProfile)
    WHERE p.profileType = 'animal_fresh'
    RETURN p.name as profile,
           p.category as category,
           p.hasCAFOExclusion as noCAFO,
           p.omegaMidpoint as omega,
           p.feedingRegime as regime
    ORDER BY p.omegaMidpoint ASC
  `

  const cafoProfiles = await runWriteTransaction(cafoQuery, {})

  for (const row of cafoProfiles) {
    const cafoStatus = row.noCAFO ? '✅ No CAFO' : '❌ Feedlot'
    const omega = row.omega ? `${row.omega}:1` : 'N/A'
    console.log(`  • ${row.profile} (${row.category})`)
    console.log(`    ${cafoStatus}  Omega: ${omega}  Regime: ${row.regime}`)
  }

  // Query 6: Profile claim relationships
  console.log('\n\nQuery 6: Profile→Claim Relationships')
  console.log('─────────────────────────────────────────────────────────\n')

  const claimRelsQuery = `
    MATCH (p:ShareProfile)-[r:REQUIRES_CLAIM|EXCLUDES_CLAIM]->(c:Claim)
    WITH type(r) as relType, count(r) as count
    RETURN relType, count
  `

  const claimRels = await runWriteTransaction(claimRelsQuery, {})

  for (const row of claimRels) {
    console.log(`  ${row.relType}: ${row.count}`)
  }

  // Query 7: Example profile with full claim connections
  console.log('\n\nQuery 7: Profile with Claim Requirements (Grass-Finished)')
  console.log('─────────────────────────────────────────────────────────\n')

  const grassFinishedQuery = `
    MATCH (p:ShareProfile {id: 'beef_grass_finished'})
    OPTIONAL MATCH (p)-[:REQUIRES_CLAIM]->(rc:Claim)
    OPTIONAL MATCH (p)-[:EXCLUDES_CLAIM]->(ec:Claim)
    RETURN p.name as profile,
           p.omegaMidpoint as omega,
           collect(DISTINCT rc.name) as requires,
           collect(DISTINCT ec.name) as excludes
  `

  const grassFinished = await runWriteTransaction(grassFinishedQuery, {})

  if (grassFinished.length > 0) {
    const gf = grassFinished[0]
    console.log(`  Profile: ${gf.profile}`)
    console.log(`  Omega: ${gf.omega}:1`)
    console.log(`  Requires: ${gf.requires.join(', ') || 'None (claim text matching needed)'}`)
    console.log(`  Excludes: ${gf.excludes.join(', ') || 'None'}`)
  }

  // Query 8: Find profiles by quality tier
  console.log('\n\nQuery 8: Profiles by Quality Tier')
  console.log('─────────────────────────────────────────────────────────\n')

  const tierQuery = `
    MATCH (p:ShareProfile)
    WITH p.qualityTier as tier, count(p) as count
    RETURN tier, count
    ORDER BY
      CASE tier
        WHEN 'artisan' THEN 1
        WHEN 'premium' THEN 2
        WHEN 'standard' THEN 3
        WHEN 'commodity' THEN 4
      END
  `

  const tiers = await runWriteTransaction(tierQuery, {})

  for (const row of tiers) {
    console.log(`  ${row.tier}: ${row.count} profiles`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  SHARE PROFILES VERIFICATION COMPLETE                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
