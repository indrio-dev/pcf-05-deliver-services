#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { REGIONAL_OFFERINGS } from '../src/lib/constants/products'

async function main() {
  const offerings = REGIONAL_OFFERINGS || []
  console.log(`\nLoading ${offerings.length} regional offerings (H×S×R relationships)...\n`)

  let loaded = 0

  for (const offering of offerings) {
    const cultivarId = offering.cultivarId || offering.varietyId
    if (!cultivarId) continue

    // Create cross-pillar relationship
    await runWriteTransaction(`
      MERGE (c:Cultivar {id: $cultivarId})
      MERGE (r:GrowingRegion {id: $regionId})
      MERGE (c)-[rel:GROWN_IN]->(r)
      SET rel.gdd_to_peak = $gddToPeak,
          rel.quality_tier = $qualityTier,
          rel.is_active = $isActive
    `, {
      cultivarId,
      regionId: offering.regionId,
      gddToPeak: offering.gddToPeakOverride || null,
      qualityTier: offering.qualityTier || null,
      isActive: offering.isActive
    })

    loaded++
    if (loaded % 200 === 0) console.log(`  ${loaded}/${offerings.length}...`)
  }

  console.log(`\n✅ ${loaded} H×S×R relationships created\n`)
}

main().then(() => closeDriver()).catch(console.error)
