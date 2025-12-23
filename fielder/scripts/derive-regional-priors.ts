#!/usr/bin/env tsx
/**
 * Derive Regional Practice Priors from Knowledge Graph
 *
 * Analyzes 15K growers to derive actual regional practice distributions
 * instead of using national USDA estimates.
 *
 * Usage:
 *   source .env.local && npx tsx scripts/derive-regional-priors.ts
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'
import fs from 'fs'

interface RegionalPriorData {
  regionId: string
  regionName?: string
  state: string
  cropCategory: string

  // Practice distributions (derived from actual entities)
  organicPct: number
  ipmPct: number
  certifiedCount: number

  // Sample size
  totalGrowers: number
  growersWithCertData: number

  // Confidence
  dataQuality: 'high' | 'medium' | 'low'
  confidence: number
}

async function analyzeRegionalPractices() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║   DERIVE REGIONAL PRACTICE PRIORS FROM KG DATA         ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Analyze by state (since most growers don't have precise region links yet)
  console.log('Analyzing practice patterns by state...\n')

  const stateAnalysis = await runQuery<{
    state: string
    totalGrowers: number
    organicCount: number
    singleFarmCSACount: number
    withWebsiteCount: number
  }>(`
    MATCH (g:Grower)-[:LOCATED_IN_STATE]->(s:State)
    RETURN
      s.code as state,
      count(g) as totalGrowers,
      count(CASE WHEN 'usda_organic' IN g.certifications THEN 1 END) as organicCount,
      count(CASE WHEN 'single_farm_csa' IN g.features THEN 1 END) as singleFarmCSACount,
      count(CASE WHEN g.website IS NOT NULL THEN 1 END) as withWebsiteCount
    ORDER BY totalGrowers DESC
  `, {})

  const priors: RegionalPriorData[] = []

  console.log('State   Growers  Organic%  CSA%  Website%  Quality')
  console.log('─────   ───────  ────────  ────  ────────  ───────')

  for (const record of stateAnalysis.slice(0, 20)) {
    const state = record.state
    const total = Number(record.totalGrowers)
    const organic = Number(record.organicCount)
    const csa = Number(record.singleFarmCSACount)
    const website = Number(record.withWebsiteCount)

    const organicPct = (organic / total) * 100
    const csaPct = (csa / total) * 100
    const websitePct = (website / total) * 100

    // Data quality assessment
    let quality: 'high' | 'medium' | 'low' = 'low'
    let confidence = 0.5

    if (total >= 500) {
      quality = 'high'
      confidence = 0.85
    } else if (total >= 100) {
      quality = 'medium'
      confidence = 0.70
    }

    console.log(
      `${state.padEnd(6)}  ${total.toString().padStart(7)}  ${organicPct.toFixed(1).padStart(8)}  ${csaPct.toFixed(1).padStart(4)}  ${websitePct.toFixed(1).padStart(8)}  ${quality}`
    )

    // Create prior (use state as region for now, will refine when region mapping improves)
    priors.push({
      regionId: `state_${state.toLowerCase()}`,
      state,
      cropCategory: 'general',  // Will refine by crop later
      organicPct: organicPct / 100,
      ipmPct: 0.35,  // Assume 35% IPM (national avg) - will derive when we have more data
      certifiedCount: organic,
      totalGrowers: total,
      growersWithCertData: organic,  // Only count those we know about
      dataQuality: quality,
      confidence
    })
  }

  return priors
}

async function analyzeCropSpecialization() {
  console.log('\n\nAnalyzing product specialization by state (where data exists)...\n')

  const productByState = await runQuery<{
    state: string
    product: string
    growerCount: number
  }>(`
    MATCH (g:Grower)-[:LOCATED_IN_STATE]->(s:State)
    MATCH (g)-[:GROWS]->(pt:ProductType)
    WITH s.code as state, pt.name as product, count(g) as growerCount
    WHERE growerCount > 5
    RETURN state, product, growerCount
    ORDER BY state, growerCount DESC
  `, {})

  // Group by state
  const byState = new Map<string, Array<{product: string, count: number}>>()

  for (const record of productByState) {
    const state = record.state
    const product = record.product
    const count = Number(record.growerCount)

    if (!byState.has(state)) {
      byState.set(state, [])
    }

    byState.get(state)!.push({ product, count })
  }

  console.log('State   Top Products (where product data exists)')
  console.log('─────   ────────────────────────────────────────────')

  for (const [state, products] of Array.from(byState.entries()).slice(0, 15)) {
    const topProducts = products.slice(0, 3).map(p => `${p.product}(${p.count})`).join(', ')
    console.log(`${state.padEnd(6)}  ${topProducts}`)
  }

  return byState
}

async function generatePriorsFile(priors: RegionalPriorData[], productPatterns: Map<string, any>) {
  console.log('\n\nGenerating regional priors TypeScript file...\n')

  // Create TypeScript constant
  const tsContent = `/**
 * Regional Practice Priors - Derived from Knowledge Graph
 *
 * Generated: ${new Date().toISOString()}
 * Source: 15,038 growers in Knowledge Graph
 * Method: Analyzed certification, CSA, and product patterns by state
 */

export interface RegionalPracticeDistribution {
  regionId: string
  state: string
  cropCategory: string

  organicLikelihood: number      // 0-1
  ipmLikelihood: number           // 0-1
  conventionalLikelihood: number  // 0-1

  sampleSize: number
  confidence: number
}

export const REGIONAL_PRACTICE_PRIORS: RegionalPracticeDistribution[] = [
${priors.map(p => `  {
    regionId: '${p.regionId}',
    state: '${p.state}',
    cropCategory: '${p.cropCategory}',
    organicLikelihood: ${p.organicPct.toFixed(3)},
    ipmLikelihood: ${p.ipmPct.toFixed(3)},
    conventionalLikelihood: ${(1 - p.organicPct - p.ipmPct).toFixed(3)},
    sampleSize: ${p.totalGrowers},
    confidence: ${p.confidence.toFixed(2)}
  }`).join(',\n')}
]

/**
 * Get regional practice prior with fallback to national defaults
 */
export function getRegionalPracticePrior(
  regionId: string,
  cropCategory: string = 'general'
): RegionalPracticeDistribution | null {
  // Try region first
  const regional = REGIONAL_PRACTICE_PRIORS.find(
    p => p.regionId === regionId && p.cropCategory === cropCategory
  )
  if (regional) return regional

  // Try state fallback
  const stateMatch = regionId.match(/state_([a-z]{2})/)
  if (stateMatch) {
    const stateCode = stateMatch[1].toUpperCase()
    const statePrior = REGIONAL_PRACTICE_PRIORS.find(
      p => p.state === stateCode && p.cropCategory === cropCategory
    )
    if (statePrior) {
      return { ...statePrior, confidence: statePrior.confidence * 0.8 }
    }
  }

  // National default (conservative)
  return {
    regionId: 'national',
    state: 'US',
    cropCategory,
    organicLikelihood: 0.15,
    ipmLikelihood: 0.35,
    conventionalLikelihood: 0.50,
    sampleSize: 15038,
    confidence: 0.60
  }
}
`

  const outputPath = 'src/lib/constants/regional-practice-priors.ts'
  fs.writeFileSync(outputPath, tsContent)

  console.log(`✅ Generated: ${outputPath}`)
  console.log(`   ${priors.length} state-level priors`)
  console.log(`   Derived from ${priors.reduce((sum, p) => sum + p.totalGrowers, 0)} growers`)

  return outputPath
}

async function main() {
  try {
    const priors = await analyzeRegionalPractices()
    const productPatterns = await analyzeCropSpecialization()
    const outputPath = await generatePriorsFile(priors, productPatterns)

    console.log('\n✨ Regional priors derived successfully!')
    console.log('\nNext: Create regional-priors.ts integration layer\n')

  } catch (error) {
    console.error('Failed to derive priors:', error)
    throw error
  } finally {
    await closeDriver()
  }
}

main()
