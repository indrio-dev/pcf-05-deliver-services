#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { CROP_PHENOLOGY } from '../src/lib/constants/crop-phenology'

async function main() {
  console.log(`\nLoading ${CROP_PHENOLOGY.length} phenology entries (H×S×R with timing)...\n`)

  for (const entry of CROP_PHENOLOGY) {
    // Create phenology relationship between crop/cultivar and region
    await runWriteTransaction(`
      MERGE (c:Cultivar {id: $cropId})
      MERGE (r:GrowingRegion {id: $regionId})
      MERGE (c)-[p:HAS_PHENOLOGY_IN]->(r)
      SET p.bloom_month = $bloomMonth,
          p.bloom_day = $bloomDay,
          p.gdd_base = $gddBase,
          p.gdd_to_maturity = $gddToMaturity,
          p.gdd_to_peak = $gddToPeak,
          p.gdd_window = $gddWindow,
          p.source = $source
    `, {
      cropId: entry.cropId,
      regionId: entry.region,
      bloomMonth: entry.bloomMonth,
      bloomDay: entry.bloomDay,
      gddBase: entry.gddBase,
      gddToMaturity: entry.gddToMaturity,
      gddToPeak: entry.gddToPeak,
      gddWindow: entry.gddWindow,
      source: entry.source
    })
  }

  console.log(`✅ ${CROP_PHENOLOGY.length} phenology relationships created\n`)
}

main().then(() => closeDriver()).catch(console.error)
