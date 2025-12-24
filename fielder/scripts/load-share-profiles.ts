#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { ALL_SHARE_PROFILES } from '../src/lib/constants/share-profiles'

/**
 * Load all 45+ SHARE Profiles to Neo4j (THE INFERENCE ENGINE)
 *
 * SHARE Profiles are the core intelligence layer that maps claim combinations
 * to quality estimates. Each profile represents a distinct way to produce
 * a product category, with unique SHARE characteristics.
 *
 * Profile Types:
 * - Produce: Fruits/vegetables (uses Brix)
 * - AnimalFresh: Meat/dairy/eggs (uses omega ratio)
 * - Seafood: Fish/shellfish (uses omega-3)
 * - Nut: Tree nuts (uses oil content)
 * - PostHarvest: Honey/syrup (minimal processing)
 * - Transformed: Coffee/tea (transformation chain)
 *
 * Each profile includes:
 * - Required/excluded claims
 * - Quality estimate (Brix range, omega range, etc.)
 * - All 5 SHARE pillar summaries
 * - Red flags, quality tier, ranking
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD 45+ SHARE PROFILES (INFERENCE ENGINE)            ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
  console.log(`Loading ${ALL_SHARE_PROFILES.length} profiles...\n`)

  let stats = {
    profilesCreated: 0,
    requiresClaimRels: 0,
    excludesClaimRels: 0,
    byType: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  }

  // =========================================================================
  // STEP 1: Create ShareProfile nodes
  // =========================================================================
  console.log('STEP 1: Creating ShareProfile nodes...\n')

  for (const profile of ALL_SHARE_PROFILES) {
    const profileType = (profile as any).profileType || 'unknown'

    // Build base parameters
    const baseParams: Record<string, any> = {
      id: profile.id,
      code: profile.code,
      name: profile.name,
      category: profile.category,
      subcategory: (profile as any).subcategory || null,
      profileType: profileType,

      // Quality classification
      qualityTier: profile.qualityTier,
      qualityRank: profile.qualityRank,

      // SHARE Pillar Summaries (ALL 5 PILLARS)
      soilPillarSummary: profile.soilPillarSummary,
      heritagePillarSummary: profile.heritagePillarSummary,
      agriculturalPillarSummary: profile.agriculturalPillarSummary,
      ripenPillarSummary: profile.ripenPillarSummary,
      enrichPillarSummary: profile.enrichPillarSummary,

      // Claims (stored as arrays, relationships created separately)
      requiredClaims: profile.requiredClaims,
      optionalClaims: (profile as any).optionalClaims || [],
      excludedClaims: profile.excludedClaims,

      // Meta
      notes: profile.notes || '',
      redFlags: (profile as any).redFlags || [],
      isActive: profile.isActive,
      sortOrder: profile.sortOrder,
    }

    // Add profile-type-specific fields
    if (profileType === 'produce') {
      const p = profile as any
      baseParams.primaryQualityMetric = 'brix'
      baseParams.estimatedBrixMin = p.estimatedBrixRange?.[0]
      baseParams.estimatedBrixMax = p.estimatedBrixRange?.[1]
      baseParams.brixMidpoint = p.brixMidpoint
      baseParams.optimalHarvestWindow = p.optimalHarvestWindow || ''
      baseParams.rootstockConsiderations = p.rootstockConsiderations || ''
    }

    if (profileType === 'animal_fresh') {
      const p = profile as any
      baseParams.primaryQualityMetric = 'omega_ratio'
      baseParams.estimatedOmegaMin = p.estimatedOmegaRatioRange?.[0]
      baseParams.estimatedOmegaMax = p.estimatedOmegaRatioRange?.[1]
      baseParams.omegaMidpoint = p.estimatedOmegaRatioMidpoint
      baseParams.feedingRegime = p.feedingRegime
      baseParams.hasCAFOExclusion = p.hasCAFOExclusion || false
      baseParams.maturityConsiderations = p.maturityConsiderations || ''
      baseParams.agingProfile = p.agingProfile || ''
    }

    if (profileType === 'nut') {
      const p = profile as any
      baseParams.primaryQualityMetric = 'oil_content'
      baseParams.estimatedOilContentMin = p.estimatedOilContentRange?.[0]
      baseParams.estimatedOilContentMax = p.estimatedOilContentRange?.[1]
      baseParams.oilContentMidpoint = p.oilContentMidpoint
      baseParams.kernelPercentage = p.kernelPercentage
      baseParams.shellType = p.shellType || ''
      baseParams.treeMaturityConsiderations = p.treeMaturityConsiderations || ''
    }

    if (profileType === 'seafood') {
      const p = profile as any
      baseParams.primaryQualityMetric = 'omega_ratio'
      baseParams.estimatedOmega3Content = p.estimatedOmega3Content
      baseParams.estimatedOmegaMin = p.estimatedOmegaRatioRange?.[0]
      baseParams.estimatedOmegaMax = p.estimatedOmegaRatioRange?.[1]
      baseParams.catchMethod = p.catchMethod
      baseParams.waterType = p.waterType || ''
      baseParams.seasonality = p.seasonality || ''
    }

    if (profileType === 'post_harvest') {
      const p = profile as any
      baseParams.primaryQualityMetric = p.primaryQualityMetric || 'none'
      baseParams.processingLevel = p.processingLevel
      baseParams.qualityIndicators = p.qualityIndicators || []
    }

    if (profileType === 'transformed') {
      const p = profile as any
      baseParams.primaryQualityMetric = p.primaryQualityMetric || 'none'
      baseParams.hasTransformation = true
      baseParams.transformationCategory = p.transformationCategory || ''
    }

    // Create the node
    await runWriteTransaction(`
      MERGE (p:ShareProfile {id: $id})
      SET p += $props
    `, {
      id: profile.id,
      props: baseParams
    })

    stats.profilesCreated++
    stats.byType[profileType] = (stats.byType[profileType] || 0) + 1
    stats.byCategory[profile.category] = (stats.byCategory[profile.category] || 0) + 1

    if (stats.profilesCreated % 10 === 0) {
      console.log(`  ✓ Created ${stats.profilesCreated} profiles...`)
    }
  }

  console.log(`\n✓ Created ${stats.profilesCreated} ShareProfile nodes\n`)

  // =========================================================================
  // STEP 2: Create REQUIRES_CLAIM relationships
  // =========================================================================
  console.log('STEP 2: Creating REQUIRES_CLAIM relationships...\n')

  for (const profile of ALL_SHARE_PROFILES) {
    for (const claimText of profile.requiredClaims) {
      // Try to match to existing Claim nodes by name/id
      const matchQuery = `
        MATCH (p:ShareProfile {id: $profileId})
        MATCH (c:Claim)
        WHERE c.id = $claimId
           OR c.name = $claimName
           OR $claimText IN c.alternativeNames
        MERGE (p)-[:REQUIRES_CLAIM {claimText: $claimText}]->(c)
        RETURN count(*) as created
      `

      // Try common claim ID patterns
      const claimId = claimText.toLowerCase().replace(/[^a-z0-9]/g, '_')

      const result = await runWriteTransaction(matchQuery, {
        profileId: profile.id,
        claimId: claimId,
        claimName: claimText,
        claimText: claimText,
      })

      if (result[0]?.created > 0) {
        stats.requiresClaimRels++
      }
    }
  }

  console.log(`✓ Created ${stats.requiresClaimRels} REQUIRES_CLAIM relationships\n`)

  // =========================================================================
  // STEP 3: Create EXCLUDES_CLAIM relationships
  // =========================================================================
  console.log('STEP 3: Creating EXCLUDES_CLAIM relationships...\n')

  for (const profile of ALL_SHARE_PROFILES) {
    for (const claimText of profile.excludedClaims) {
      const claimId = claimText.toLowerCase().replace(/[^a-z0-9]/g, '_')

      const matchQuery = `
        MATCH (p:ShareProfile {id: $profileId})
        MATCH (c:Claim)
        WHERE c.id = $claimId
           OR c.name = $claimText
           OR $claimText IN c.alternativeNames
        MERGE (p)-[:EXCLUDES_CLAIM {claimText: $claimText}]->(c)
        RETURN count(*) as created
      `

      const result = await runWriteTransaction(matchQuery, {
        profileId: profile.id,
        claimId: claimId,
        claimText: claimText,
      })

      if (result[0]?.created > 0) {
        stats.excludesClaimRels++
      }
    }
  }

  console.log(`✓ Created ${stats.excludesClaimRels} EXCLUDES_CLAIM relationships\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  SHARE PROFILES LOAD COMPLETE                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`✓ Profiles created: ${stats.profilesCreated}`)
  console.log(`✓ REQUIRES_CLAIM relationships: ${stats.requiresClaimRels}`)
  console.log(`✓ EXCLUDES_CLAIM relationships: ${stats.excludesClaimRels}\n`)

  console.log('By profile type:')
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`  ${type}: ${count}`)
  }

  console.log('\nBy category:')
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${category}: ${count}`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
