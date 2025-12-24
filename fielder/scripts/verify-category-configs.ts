#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

/**
 * Verify Category Configs and demonstrate quality metric system
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  VERIFY CATEGORY CONFIGS (QUALITY METRIC SYSTEM)       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Query 1: All category configs
  console.log('Query 1: All Category Configurations')
  console.log('─────────────────────────────────────────────────────────\n')

  const allConfigsQuery = `
    MATCH (c:CategoryConfig)
    RETURN c.id as category,
           c.displayName as name,
           c.primaryQualityMetric as metric,
           c.qualityMetricUnit as unit,
           c.peakTimingMethod as timing
    ORDER BY c.id
  `

  const configs = await runWriteTransaction(allConfigsQuery, {})

  for (const row of configs) {
    console.log(`  • ${row.name} (${row.category})`)
    console.log(`    Quality Metric: ${row.metric} (${row.unit})`)
    console.log(`    Peak Timing: ${row.timing}`)
  }

  // Query 2: Complete config example (Meat)
  console.log('\n\nQuery 2: Complete Config Example (Meat)')
  console.log('─────────────────────────────────────────────────────────\n')

  const meatQuery = `
    MATCH (c:CategoryConfig {id: 'meat'})
    RETURN c
  `

  const meat = await runWriteTransaction(meatQuery, {})

  if (meat.length > 0) {
    const m = meat[0].c.properties
    console.log(`${m.displayName}\n`)
    console.log(`QUALITY METRIC SYSTEM:`)
    console.log(`  Primary: ${m.primaryQualityMetric} (${m.qualityMetricUnit})`)
    console.log(`  Display: ${m.qualityMetricDisplayName}`)
    console.log(`\nPEAK TIMING:`)
    console.log(`  Method: ${m.peakTimingMethod}`)
    console.log(`  Description: ${m.peakTimingDescription}`)
    console.log(`\nSHARE PILLAR LABELS (Category-specific):`)
    console.log(`  S: "${m.labelSoil}"`)
    console.log(`  H: "${m.labelHeritage}"`)
    console.log(`  A: "${m.labelAgricultural}"`)
    console.log(`  R: "${m.labelRipen}"`)
    console.log(`  E: "${m.labelEnrich}"`)
    console.log(`\nDISPLAY PREFERENCES:`)
    console.log(`  Show GDD Prediction: ${m.showGddPrediction}`)
    console.log(`  Show Bloom Date: ${m.showBloomDate}`)
    console.log(`  Show Pasture: ${m.showPasture}`)
    console.log(`  Show Waters: ${m.showWaters}`)
    console.log(`\nNARRATIVE VOCABULARY:`)
    console.log(`  Quality: "${m.vocabularyQualityDescriptor}"`)
    console.log(`  Harvest: "${m.vocabularyHarvestVerb}"`)
    console.log(`  Source: "${m.vocabularySourceNoun}"`)
    console.log(`  Emphasize: ${m.narrativeEmphasize.join(', ')}`)
    console.log(`  Suppress: ${m.narrativeSuppress.join(', ')}`)
  }

  // Query 3: Quality metrics comparison
  console.log('\n\nQuery 3: Quality Metrics by Category')
  console.log('─────────────────────────────────────────────────────────\n')

  const metricsQuery = `
    MATCH (c:CategoryConfig)
    RETURN c.id as category,
           c.primaryQualityMetric as metric,
           c.qualityMetricUnit as unit,
           c.tierThresholdArtisan as artisan,
           c.tierThresholdPremium as premium,
           c.tierThresholdSelect as select
    ORDER BY c.primaryQualityMetric, c.id
  `

  const metrics = await runWriteTransaction(metricsQuery, {})

  console.log('Category → Metric → Thresholds\n')
  for (const row of metrics) {
    const thresholds = row.artisan !== null
      ? `Artisan: ${row.artisan}+, Premium: ${row.premium}+, Select: ${row.select}+`
      : 'No thresholds (qualitative)'
    console.log(`  ${row.category.padEnd(15)} ${row.metric.padEnd(20)} ${row.unit.padEnd(5)} ${thresholds}`)
  }

  // Query 4: ShareProfile→CategoryConfig connections
  console.log('\n\nQuery 4: ShareProfiles Using Each Category Config')
  console.log('─────────────────────────────────────────────────────────\n')

  const profileLinkQuery = `
    MATCH (p:ShareProfile)-[:USES_CATEGORY_CONFIG]->(c:CategoryConfig)
    WITH c.id as category, count(p) as profileCount
    RETURN category, profileCount
    ORDER BY profileCount DESC
  `

  const profileLinks = await runWriteTransaction(profileLinkQuery, {})

  for (const row of profileLinks) {
    console.log(`  ${row.category}: ${row.profileCount} profiles`)
  }

  // Query 5: SHARE label translations
  console.log('\n\nQuery 5: SHARE Pillar Label Translations')
  console.log('(How SHARE translates across product types)')
  console.log('─────────────────────────────────────────────────────────\n')

  const labelQuery = `
    MATCH (c:CategoryConfig)
    WHERE c.id IN ['fruit', 'meat', 'seafood']
    RETURN c.id as category,
           c.labelSoil as S,
           c.labelHeritage as H,
           c.labelAgricultural as A,
           c.labelRipen as R,
           c.labelEnrich as E
    ORDER BY c.id
  `

  const labels = await runWriteTransaction(labelQuery, {})

  console.log('Category  | S | H | A | R | E')
  console.log('───────────────────────────────────────────────────────')
  for (const row of labels) {
    console.log(`${row.category.padEnd(10)} ${row.S} | ${row.H} | ${row.A} | ${row.R} | ${row.E}`)
  }

  // Query 6: Vocabulary comparison
  console.log('\n\nQuery 6: Narrative Vocabulary by Category')
  console.log('─────────────────────────────────────────────────────────\n')

  const vocabQuery = `
    MATCH (c:CategoryConfig)
    WHERE c.id IN ['fruit', 'meat', 'seafood', 'dairy']
    RETURN c.id as category,
           c.vocabularyQualityDescriptor as quality,
           c.vocabularyHarvestVerb as verb,
           c.vocabularySourceNoun as source
    ORDER BY c.id
  `

  const vocab = await runWriteTransaction(vocabQuery, {})

  for (const row of vocab) {
    console.log(`  ${row.category}:`)
    console.log(`    Quality: "${row.quality}"`)
    console.log(`    Harvest: "${row.verb}"`)
    console.log(`    Source: "${row.source}"`)
    console.log(`    → "The ${row.quality} of this product ${row.verb} from ${row.source}"`)
    console.log('')
  }

  // Query 7: Example usage - Get config for a product type
  console.log('\nQuery 7: Get Category Config for Product Type')
  console.log('(How to determine which metric applies)')
  console.log('─────────────────────────────────────────────────────────\n')

  const usageQuery = `
    // Example: User scans "Navel Orange"
    MATCH (cultivar:Cultivar {id: 'navel_orange'})
    MATCH (variety:Variety)<-[:BELONGS_TO_VARIETY]-(cultivar)
    MATCH (product:ProductType)<-[:BELONGS_TO_PRODUCT]-(variety)

    // Get category config for this product type
    // (Would need ProductType.category field or mapping)
    WITH product, cultivar
    MATCH (c:CategoryConfig {id: 'fruit'})  // Hardcoded for demo

    RETURN cultivar.displayName as product,
           c.primaryQualityMetric as useMetric,
           c.qualityMetricUnit as unit,
           c.tierThresholdArtisan as artisanMin,
           c.vocabularyQualityDescriptor as qualityWord
  `

  const usage = await runWriteTransaction(usageQuery, {})

  if (usage.length > 0) {
    const u = usage[0]
    console.log(`  Product: ${u.product}`)
    console.log(`  Use metric: ${u.useMetric} (${u.unit})`)
    console.log(`  Artisan threshold: ${u.artisanMin}+ ${u.unit}`)
    console.log(`  Quality descriptor: "${u.qualityWord}"`)
    console.log(`\n  → For this product, measure Brix and use "sweetness" in narratives`)
  }

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  CATEGORY CONFIG VERIFICATION COMPLETE                 ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await closeDriver()
}

main().catch(console.error)
