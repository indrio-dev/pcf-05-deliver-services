#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CATEGORY_CONFIGS } from '../src/lib/constants/category-config'

/**
 * Load Category Configs - Quality Metric System per Product Type
 *
 * Category Configs define HOW SHARE applies to each product category:
 * - Which quality metric (Brix vs Omega vs Oil%)
 * - Category-specific tier thresholds
 * - Peak timing methods
 * - SHARE pillar label translations
 * - Display preferences (what to show/hide)
 * - Narrative vocabulary (category-appropriate language)
 *
 * This is critical because:
 * - Beef uses omega ratio (lower is better)
 * - Citrus uses Brix (higher is better)
 * - Nuts use oil content %
 * - Different categories have different quality standards
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD CATEGORY CONFIGS (QUALITY METRIC SYSTEM)         ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  const categories = Object.values(CATEGORY_CONFIGS)
  console.log(`Loading ${categories.length} category configurations...\n`)

  let stats = {
    categoriesCreated: 0,
    withTierThresholds: 0,
    withTransformation: 0,
  }

  // =========================================================================
  // STEP 1: Create CategoryConfig nodes
  // =========================================================================
  console.log('STEP 1: Creating CategoryConfig nodes...\n')

  for (const config of categories) {
    const params: Record<string, any> = {
      id: config.id,
      displayName: config.displayName,

      // Quality Metrics
      primaryQualityMetric: config.qualityMetrics.primary,
      qualityMetricDisplayName: config.qualityMetrics.displayName,
      qualityMetricUnit: config.qualityMetrics.unit,

      // Tier thresholds (if defined)
      tierThresholdArtisan: config.qualityMetrics.tierThresholds?.artisan?.min,
      tierThresholdPremium: config.qualityMetrics.tierThresholds?.premium?.min,
      tierThresholdSelect: config.qualityMetrics.tierThresholds?.select?.min,

      // Peak timing
      peakTimingMethod: config.peakTiming.method,
      peakTimingDescription: config.peakTiming.description,
      peakPercentage: config.peakTiming.peakPercentage || null,

      // SHARE Pillar Labels (category-specific translations)
      labelSoil: config.sharePillarLabels.soil,
      labelHeritage: config.sharePillarLabels.heritage,
      labelAgricultural: config.sharePillarLabels.agricultural,
      labelRipen: config.sharePillarLabels.ripen,
      labelEnrich: config.sharePillarLabels.enrich,

      // Display preferences
      showGddPrediction: config.display.showGddPrediction,
      showBloomDate: config.display.showBloomDate,
      showRootstock: config.display.showRootstock,
      showClimate: config.display.showClimate,
      showWaters: config.display.showWaters,
      showPasture: config.display.showPasture,
      showAcreage: config.display.showAcreage,
      showSeasonDates: config.display.showSeasonDates,

      // Narrative
      narrativeEmphasize: config.narrative.emphasize,
      narrativeSuppress: config.narrative.suppress,
      vocabularyQualityDescriptor: config.narrative.vocabulary.qualityDescriptor,
      vocabularyHarvestVerb: config.narrative.vocabulary.harvestVerb,
      vocabularySourceNoun: config.narrative.vocabulary.sourceNoun,

      // Transformation
      hasTransformation: config.transformation?.hasTransformation || false,
      transformationProcessName: config.transformation?.processName || null,
    }

    // Only include tier threshold params if they exist
    const finalParams: Record<string, any> = { ...params }
    if (params.tierThresholdArtisan === undefined) delete finalParams.tierThresholdArtisan
    if (params.tierThresholdPremium === undefined) delete finalParams.tierThresholdPremium
    if (params.tierThresholdSelect === undefined) delete finalParams.tierThresholdSelect
    if (params.peakPercentage === null) delete finalParams.peakPercentage

    await runWriteTransaction(`
      MERGE (c:CategoryConfig {id: $id})
      SET c += $props
    `, {
      id: config.id,
      props: finalParams
    })

    stats.categoriesCreated++

    if (config.qualityMetrics.tierThresholds) {
      stats.withTierThresholds++
    }

    if (config.transformation?.hasTransformation) {
      stats.withTransformation++
    }

    console.log(`  ✓ ${config.id}: ${config.qualityMetrics.primary} (${config.qualityMetrics.unit})`)
  }

  console.log(`\n✓ Created ${stats.categoriesCreated} CategoryConfig nodes\n`)

  // =========================================================================
  // STEP 2: Link ShareProfiles to CategoryConfigs
  // =========================================================================
  console.log('STEP 2: Linking ShareProfiles to CategoryConfigs...\n')

  const linkQuery = `
    MATCH (p:ShareProfile)
    MATCH (c:CategoryConfig {id: p.category})
    MERGE (p)-[:USES_CATEGORY_CONFIG]->(c)
    RETURN count(*) as linked
  `

  const linkResult = await runWriteTransaction(linkQuery, {})
  const linkedProfiles = linkResult[0]?.linked || 0

  console.log(`✓ Linked ${linkedProfiles} ShareProfiles to CategoryConfigs\n`)

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  CATEGORY CONFIGS LOAD COMPLETE                        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`✓ Category configs created: ${stats.categoriesCreated}`)
  console.log(`✓ With tier thresholds: ${stats.withTierThresholds}`)
  console.log(`✓ With transformation: ${stats.withTransformation}`)
  console.log(`✓ ShareProfiles linked: ${linkedProfiles}\n`)

  console.log('Quality metrics by category:')
  for (const config of categories) {
    const metric = config.qualityMetrics.primary
    const unit = config.qualityMetrics.unit
    console.log(`  ${config.displayName}: ${metric} (${unit})`)
  }

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
