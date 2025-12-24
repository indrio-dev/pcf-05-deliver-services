#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify Claims inference system and demonstrate A (Agricultural) pillar queries
 *
 * Claims represent marketing/regulatory terms that appear on labels.
 * Each claim has three perspectives: Regulatory, Marketing, Reality
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY CLAIMS INFERENCE SYSTEM                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: All claims overview
  console.log('Query 1: All Claims Overview')
  console.log('─────────────────────────────────────────────────────────\n')

  const overviewQuery = `
    MATCH (c:Claim)
    RETURN c.name as claim,
           c.category as category,
           c.regulatoryStatus as regulatoryStatus,
           c.qualityCorrelation as qualityCorrelation,
           c.applicableProducts as products
    ORDER BY c.category, c.name
  `

  const overview = await runWriteTransaction(overviewQuery, {})

  for (const row of overview) {
    console.log(`  • ${row.claim} (${row.category})`)
    console.log(`    Regulatory: ${row.regulatoryStatus}`)
    console.log(`    Quality correlation: ${row.qualityCorrelation}`)
    console.log(`    Applies to: ${row.products.join(', ')}`)
    console.log('')
  }

  // Query 2: Complete profile for a specific claim
  console.log('\nQuery 2: Complete Claim Profile (Grass-Fed)')
  console.log('─────────────────────────────────────────────────────────\n')

  const profileQuery = `
    MATCH (c:Claim {id: 'grass_fed'})
    RETURN c
  `

  const profile = await runWriteTransaction(profileQuery, {})

  if (profile.length > 0) {
    const c = profile[0].c.properties
    console.log(`${c.name}\n`)
    console.log(`REGULATORY PERSPECTIVE:`)
    console.log(`  Status: ${c.regulatoryStatus}`)
    console.log(`  Enforcement: ${c.enforcementLevel}`)
    console.log(`  Body: ${c.regulatoryBody}`)
    console.log(`  Definition: ${c.legalDefinition}`)
    if (c.loopholes && c.loopholes.length > 0) {
      console.log(`  Loopholes:`)
      for (const loophole of c.loopholes) {
        console.log(`    - ${loophole}`)
      }
    }
    console.log(`\nMARKETING PERSPECTIVE:`)
    console.log(`  Consumer thinks: ${c.consumerPerception}`)
    console.log(`  Brands use it for: ${c.brandUsage}`)
    console.log(`  Emotional appeal: ${c.emotionalAppeal}`)
    if (c.commonMisconceptions && c.commonMisconceptions.length > 0) {
      console.log(`  Misconceptions:`)
      for (const misconception of c.commonMisconceptions) {
        console.log(`    - ${misconception}`)
      }
    }
    console.log(`\nFIELDER'S REALITY:`)
    console.log(`  Actually means: ${c.actualMeaning}`)
    console.log(`  Quality correlation: ${c.qualityCorrelation}`)
    console.log(`  Assessment: ${c.fielderAssessment}`)
    if (c.omegaRatioMin !== null && c.omegaRatioMax !== null) {
      console.log(`  Omega ratio hint: ${c.omegaRatioMin}:1 - ${c.omegaRatioMax}:1`)
    }
  }

  // Query 3: IMPLIES chain
  console.log('\n\nQuery 3: Claim Implication Chains')
  console.log('─────────────────────────────────────────────────────────\n')

  const impliesQuery = `
    MATCH (c1:Claim)-[:IMPLIES]->(c2:Claim)
    RETURN c1.name as claim,
           collect(c2.name) as implies
    ORDER BY c1.name
  `

  const implies = await runWriteTransaction(impliesQuery, {})

  for (const row of implies) {
    console.log(`  ${row.claim} → ${row.implies.join(', ')}`)
  }

  // Query 4: Claims by quality correlation
  console.log('\n\nQuery 4: Claims by Quality Correlation')
  console.log('─────────────────────────────────────────────────────────\n')

  const qualityQuery = `
    MATCH (c:Claim)
    RETURN c.qualityCorrelation as correlation,
           collect(c.name) as claims
    ORDER BY
      CASE c.qualityCorrelation
        WHEN 'strong' THEN 1
        WHEN 'moderate' THEN 2
        WHEN 'weak' THEN 3
        WHEN 'none' THEN 4
        WHEN 'inverse' THEN 5
        ELSE 6
      END
  `

  const quality = await runWriteTransaction(qualityQuery, {})

  for (const row of quality) {
    console.log(`  ${row.correlation.toUpperCase()}: ${row.claims.join(', ')}`)
  }

  // Query 5: Omega ratio hints (meat quality)
  console.log('\n\nQuery 5: Omega Ratio Hints (Meat Quality Inference)')
  console.log('─────────────────────────────────────────────────────────\n')

  const omegaQuery = `
    MATCH (c:Claim)
    WHERE c.omegaRatioMin IS NOT NULL
    RETURN c.name as claim,
           c.omegaRatioMin as min,
           c.omegaRatioMax as max,
           c.qualityCorrelation as correlation
    ORDER BY c.omegaRatioMin ASC
  `

  const omega = await runWriteTransaction(omegaQuery, {})

  console.log('Expected omega-6:omega-3 ratio by claim:\n')
  for (const row of omega) {
    console.log(`  ${row.claim}: ${row.min}:1 - ${row.max}:1 (${row.correlation} quality correlation)`)
  }

  console.log('\nInterpretation:')
  console.log('  ≤3:1  = True grass-finished (optimal)')
  console.log('  3-7:1 = True pasture (premium)')
  console.log('  8-15:1 = Marketing grass/feedlot-finished (commodity)')
  console.log('  15-20:1 = Natural/commodity (standard feedlot)')

  // Query 6: Red flags
  console.log('\n\nQuery 6: Claims with Red Flag Patterns')
  console.log('─────────────────────────────────────────────────────────\n')

  const redFlagQuery = `
    MATCH (c:Claim)
    WHERE size(c.redFlags) > 0
    RETURN c.name as claim,
           c.redFlags as flags,
           size(c.redFlags) as count
    ORDER BY count DESC
  `

  const redFlags = await runWriteTransaction(redFlagQuery, {})

  for (const row of redFlags) {
    console.log(`  ${row.claim} (${row.count} red flags):`)
    for (const flag of row.flags) {
      console.log(`    ⚠️  ${flag}`)
    }
    console.log('')
  }

  // Query 7: Green flags
  console.log('\nQuery 7: Claims with Green Flag Patterns')
  console.log('─────────────────────────────────────────────────────────\n')

  const greenFlagQuery = `
    MATCH (c:Claim)
    WHERE size(c.greenFlags) > 0
    RETURN c.name as claim,
           c.greenFlags as flags,
           size(c.greenFlags) as count
    ORDER BY count DESC
  `

  const greenFlags = await runWriteTransaction(greenFlagQuery, {})

  for (const row of greenFlags) {
    console.log(`  ${row.claim} (${row.count} green flags):`)
    for (const flag of row.flags) {
      console.log(`    ✅ ${flag}`)
    }
    console.log('')
  }

  // Query 8: SHARE impact analysis
  console.log('\nQuery 8: SHARE Pillar Impact by Claim')
  console.log('─────────────────────────────────────────────────────────\n')

  const shareQuery = `
    MATCH (c:Claim)
    RETURN c.name as claim,
           c.impactSoil as S,
           c.impactHeritage as H,
           c.impactAgricultural as A,
           c.impactRipen as R,
           c.impactEnrich as E
    ORDER BY c.name
  `

  const share = await runWriteTransaction(shareQuery, {})

  console.log('Claim → S | H | A | R | E')
  console.log('─────────────────────────────────────────────────────────')
  for (const row of share) {
    const s = formatImpact(row.S)
    const h = formatImpact(row.H)
    const a = formatImpact(row.A)
    const r = formatImpact(row.R)
    const e = formatImpact(row.E)
    console.log(`${row.claim.padEnd(20)} ${s} | ${h} | ${a} | ${r} | ${e}`)
  }

  // Query 9: Regulatory enforcement levels
  console.log('\n\nQuery 9: Regulatory Enforcement Levels')
  console.log('─────────────────────────────────────────────────────────\n')

  const enforcementQuery = `
    MATCH (c:Claim)
    RETURN c.enforcementLevel as level,
           collect(c.name) as claims,
           count(c) as count
    ORDER BY
      CASE c.enforcementLevel
        WHEN 'strong' THEN 1
        WHEN 'moderate' THEN 2
        WHEN 'weak' THEN 3
        WHEN 'none' THEN 4
      END
  `

  const enforcement = await runWriteTransaction(enforcementQuery, {})

  for (const row of enforcement) {
    console.log(`  ${row.level.toUpperCase()} (${row.count}): ${row.claims.join(', ')}`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  CLAIMS VERIFICATION COMPLETE                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

function formatImpact(impact: string): string {
  const map: Record<string, string> = {
    'positive': '+',
    'neutral': '○',
    'negative': '-',
    'unknown': '?',
    'variable': '~'
  }
  return map[impact] || '?'
}

main().catch(console.error)
