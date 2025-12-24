#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { ALL_CLAIMS } from '../src/lib/constants/claims'

/**
 * Load Claims inference system to Neo4j (A pillar)
 *
 * Claims are marketing/regulatory terms like "Organic", "Grass-Fed", "Pasture-Raised"
 * that appear on product labels. Each claim has:
 *
 * 1. REGULATORY perspective (legal definition, enforcement)
 * 2. MARKETING perspective (consumer perception, misconceptions)
 * 3. REALITY perspective (Fielder's assessment, actual quality impact)
 * 4. INFERENCE rules (implied claims, red flags, omega hints)
 *
 * Graph structure:
 * - Claim nodes with all perspectives and assessments
 * - IMPLIES relationships (organic → non-GMO)
 * - RED_FLAG_WITH relationships (grass-fed + USDA Prime)
 * - GREEN_FLAG_WITH relationships (grass-fed + grass-finished)
 * - IMPACTS_<PILLAR> properties showing SHARE effects
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD CLAIMS INFERENCE SYSTEM (A PILLAR)               ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
  console.log(`Processing ${ALL_CLAIMS.length} claims...\n`)

  let claimsCreated = 0
  let impliesRelationships = 0
  let redFlagRelationships = 0
  let greenFlagRelationships = 0

  // =========================================================================
  // STEP 1: Create Claim nodes
  // =========================================================================
  console.log('STEP 1: Creating Claim nodes...\n')

  for (const claim of ALL_CLAIMS) {
    // Build dynamic SET clause and params based on what's defined
    const params: Record<string, any> = {
      id: claim.id,
      name: claim.name,
      alternativeNames: claim.alternativeNames,
      category: claim.category,
      applicableProducts: claim.applicableProducts,

      // Regulatory
      regulatoryStatus: claim.regulatory.status,
      enforcementLevel: claim.regulatory.enforcementLevel,
      regulatoryBody: claim.regulatory.regulatoryBody || '',
      legalDefinition: claim.regulatory.legalDefinition || '',
      requirements: claim.regulatory.requirements || [],
      loopholes: claim.regulatory.loopholes || [],
      penaltiesExist: claim.regulatory.penaltiesExist,

      // Marketing
      consumerPerception: claim.marketing.consumerPerception,
      brandUsage: claim.marketing.brandUsage,
      premiumJustification: claim.marketing.premiumJustification,
      commonMisconceptions: claim.marketing.commonMisconceptions,
      emotionalAppeal: claim.marketing.emotionalAppeal,

      // Reality
      actualMeaning: claim.reality.actualMeaning,
      nutritionalImpact: claim.reality.nutritionalImpact,
      qualityCorrelation: claim.reality.qualityCorrelation,
      fielderAssessment: claim.reality.fielderAssessment,
      redFlags: claim.reality.redFlags || [],
      greenFlags: claim.reality.greenFlags || [],

      // SHARE Impact
      impactSoil: claim.reality.shareImpact.soil || 'unknown',
      impactHeritage: claim.reality.shareImpact.heritage || 'unknown',
      impactAgricultural: claim.reality.shareImpact.agricultural || 'unknown',
      impactRipen: claim.reality.shareImpact.ripen || 'unknown',
      impactEnrich: claim.reality.shareImpact.enrich || 'unknown',

      // Meta
      confidenceLevel: claim.confidenceLevel,
    }

    // Add omega ratio if defined
    const omegaSetClause = claim.inference.omegaRatioHint
      ? `c.omegaRatioMin = $omegaRatioMin,
          c.omegaRatioMax = $omegaRatioMax,`
      : ''

    if (claim.inference.omegaRatioHint) {
      params.omegaRatioMin = claim.inference.omegaRatioHint[0]
      params.omegaRatioMax = claim.inference.omegaRatioHint[1]
    }

    // Add brix impact if defined
    const brixSetClause = claim.inference.brixImpact
      ? 'c.brixImpact = $brixImpact,'
      : ''

    if (claim.inference.brixImpact) {
      params.brixImpact = claim.inference.brixImpact
    }

    await runWriteTransaction(`
      MERGE (c:Claim {id: $id})
      SET c.name = $name,
          c.alternativeNames = $alternativeNames,
          c.category = $category,
          c.applicableProducts = $applicableProducts,

          // Regulatory
          c.regulatoryStatus = $regulatoryStatus,
          c.enforcementLevel = $enforcementLevel,
          c.regulatoryBody = $regulatoryBody,
          c.legalDefinition = $legalDefinition,
          c.requirements = $requirements,
          c.loopholes = $loopholes,
          c.penaltiesExist = $penaltiesExist,

          // Marketing
          c.consumerPerception = $consumerPerception,
          c.brandUsage = $brandUsage,
          c.premiumJustification = $premiumJustification,
          c.commonMisconceptions = $commonMisconceptions,
          c.emotionalAppeal = $emotionalAppeal,

          // Reality (Fielder's Assessment)
          c.actualMeaning = $actualMeaning,
          c.nutritionalImpact = $nutritionalImpact,
          c.qualityCorrelation = $qualityCorrelation,
          c.fielderAssessment = $fielderAssessment,
          c.redFlags = $redFlags,
          c.greenFlags = $greenFlags,

          // SHARE Impact
          c.impactSoil = $impactSoil,
          c.impactHeritage = $impactHeritage,
          c.impactAgricultural = $impactAgricultural,
          c.impactRipen = $impactRipen,
          c.impactEnrich = $impactEnrich,

          // Inference (conditional)
          ${omegaSetClause}
          ${brixSetClause}

          // Meta
          c.confidenceLevel = $confidenceLevel,
          c.source = 'typescript'
    `, params)

    claimsCreated++
    console.log(`  ✓ Created claim: ${claim.name}`)
  }

  console.log(`\n✓ Created ${claimsCreated} Claim nodes\n`)

  // =========================================================================
  // STEP 2: Create IMPLIES relationships
  // =========================================================================
  console.log('STEP 2: Creating IMPLIES relationships...\n')

  for (const claim of ALL_CLAIMS) {
    for (const impliedClaimId of claim.inference.impliedClaims) {
      await runWriteTransaction(`
        MATCH (c1:Claim {id: $claimId})
        MATCH (c2:Claim {id: $impliedClaimId})
        MERGE (c1)-[:IMPLIES]->(c2)
      `, {
        claimId: claim.id,
        impliedClaimId: impliedClaimId
      })

      impliesRelationships++
      console.log(`  ✓ ${claim.name} IMPLIES ${impliedClaimId}`)
    }
  }

  if (impliesRelationships === 0) {
    console.log('  (No IMPLIES relationships defined yet)')
  }

  console.log(`\n✓ Created ${impliesRelationships} IMPLIES relationships\n`)

  // =========================================================================
  // STEP 3: Create RED_FLAG_WITH relationships
  // =========================================================================
  console.log('STEP 3: Creating RED_FLAG_WITH relationships...\n')

  for (const claim of ALL_CLAIMS) {
    if (claim.inference.suspiciousWith) {
      for (const suspiciousClaimId of claim.inference.suspiciousWith) {
        // Try to find matching claim by ID
        const targetClaim = ALL_CLAIMS.find(c => c.id === suspiciousClaimId)

        if (targetClaim) {
          await runWriteTransaction(`
            MATCH (c1:Claim {id: $claimId})
            MATCH (c2:Claim {id: $suspiciousClaimId})
            MERGE (c1)-[:RED_FLAG_WITH]->(c2)
          `, {
            claimId: claim.id,
            suspiciousClaimId: suspiciousClaimId
          })

          redFlagRelationships++
          console.log(`  ⚠️  ${claim.name} RED_FLAG_WITH ${targetClaim.name}`)
        }
      }
    }

    // Also create red flags from reality.redFlags (text descriptions)
    if (claim.reality.redFlags && claim.reality.redFlags.length > 0) {
      console.log(`  📝 ${claim.name} has ${claim.reality.redFlags.length} red flag patterns`)
    }
  }

  console.log(`\n✓ Created ${redFlagRelationships} RED_FLAG_WITH relationships\n`)

  // =========================================================================
  // STEP 4: Create GREEN_FLAG_WITH relationships
  // =========================================================================
  console.log('STEP 4: Creating GREEN_FLAG_WITH relationships...\n')

  for (const claim of ALL_CLAIMS) {
    if (claim.reality.greenFlags && claim.reality.greenFlags.length > 0) {
      console.log(`  ✅ ${claim.name} has ${claim.reality.greenFlags.length} green flag patterns`)
    }
  }

  console.log(`\n✓ Green flag patterns stored in Claim nodes\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CLAIMS INFERENCE LOAD COMPLETE                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`✓ Claims created: ${claimsCreated}`)
  console.log(`✓ IMPLIES relationships: ${impliesRelationships}`)
  console.log(`✓ RED_FLAG_WITH relationships: ${redFlagRelationships}`)
  console.log(`✓ GREEN_FLAG_WITH relationships: ${greenFlagRelationships}`)

  console.log('\nClaims by category:')
  const byCategory = ALL_CLAIMS.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count}`)
  }

  console.log('\nClaims with omega ratio hints:')
  const withOmega = ALL_CLAIMS.filter(c => c.inference.omegaRatioHint)
  for (const claim of withOmega) {
    const [min, max] = claim.inference.omegaRatioHint!
    console.log(`  ${claim.name}: ${min}:1 - ${max}:1`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
