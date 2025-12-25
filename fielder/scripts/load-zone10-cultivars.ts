#!/usr/bin/env tsx
import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Load Zone 10 cultivars from SeedsNow collection
 *
 * Data: 621 cultivars (558 vegetables, 63 flowers) all Zone 10 compatible
 * Source: data/research/seed-company-seedsnow-zone10.json
 */

interface SeedsNowCultivar {
  name: string
  crop: string // 'vegetable', 'flower'
  scientificName: string | null
  daysToMaturity: number | null
  packSizes: string[]
  productUrl: string
  notes: string
  productType: string
  vendor: string
  tags: string[]
}

interface SeedsNowData {
  source: string
  collectionDate: string
  zone: string
  url: string
  totalCultivars: number
  cultivars: SeedsNowCultivar[]
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  LOAD ZONE 10 CULTIVARS FROM SEEDSNOW                  ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Load data
  const dataPath = path.join(__dirname, '../data/research/seed-company-seedsnow-zone10.json')
  const data: SeedsNowData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  console.log(`Source: ${data.source}`)
  console.log(`Collection date: ${data.collectionDate}`)
  console.log(`Total cultivars: ${data.totalCultivars}`)
  console.log(`Zone: ${data.zone}\n`)

  let stats = {
    created: 0,
    updated: 0,
    vegetables: 0,
    flowers: 0,
    byType: {} as Record<string, number>,
  }

  // Process each cultivar
  for (const cultivar of data.cultivars) {
    // Create cultivar ID (sanitize name)
    const id = cultivar.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 100)

    // Extract USDA zones from tags
    const usdaZones = cultivar.tags
      .filter(t => t.startsWith('US Zone '))
      .map(t => parseInt(t.replace('US Zone ', '')))
      .filter(z => !isNaN(z))
      .sort((a, b) => a - b)

    const zoneMin = usdaZones.length > 0 ? Math.min(...usdaZones) : null
    const zoneMax = usdaZones.length > 0 ? Math.max(...usdaZones) : null

    // Determine product type
    const productType = cultivar.productType || cultivar.crop || 'vegetable'

    // Create cultivar node
    await runWriteTransaction(`
      MERGE (c:Cultivar {id: $id})
      SET c.displayName = $displayName,
          c.name = $displayName,
          c.scientificName = $scientificName,
          c.productId = $productType,
          c.category = $category,
          c.daysToMaturity = $daysToMaturity,
          c.usdaZoneMin = $zoneMin,
          c.usdaZoneMax = $zoneMax,
          c.usdaZones = $usdaZones,
          c.source = 'seedsnow_zone10',
          c.sourceUrl = $sourceUrl,
          c.vendor = $vendor,
          c.collectionDate = $collectionDate

      WITH c
      WHERE $zoneMin IS NOT NULL
      MERGE (z:USDAZone {zone: '10'})
      MERGE (c)-[:COMPATIBLE_WITH_ZONE {source: 'seedsnow'}]->(z)

      RETURN c.id as id
    `, {
      id,
      displayName: cultivar.name,
      scientificName: cultivar.scientificName,
      productType: productType.toLowerCase().replace(/[^a-z]/g, '_'),
      category: cultivar.crop,
      daysToMaturity: cultivar.daysToMaturity,
      zoneMin,
      zoneMax,
      usdaZones,
      sourceUrl: cultivar.productUrl,
      vendor: cultivar.vendor,
      collectionDate: data.collectionDate,
    })

    stats.created++

    if (cultivar.crop === 'vegetable') stats.vegetables++
    if (cultivar.crop === 'flower') stats.flowers++

    const type = productType || 'unknown'
    stats.byType[type] = (stats.byType[type] || 0) + 1

    if (stats.created % 50 === 0) {
      console.log(`  ✓ Loaded ${stats.created} cultivars...`)
    }
  }

  console.log(`\n✓ Loaded ${stats.created} cultivars\n`)

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  ZONE 10 CULTIVARS LOAD COMPLETE                       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`Total cultivars: ${stats.created}`)
  console.log(`  Vegetables: ${stats.vegetables}`)
  console.log(`  Flowers: ${stats.flowers}\n`)

  console.log('By product type (top 20):')
  const sorted = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])
  for (const [type, count] of sorted.slice(0, 20)) {
    console.log(`  ${type}: ${count}`)
  }

  // Verify Zone 10 connections
  console.log('\n\nVerification:')
  const verifyQuery = `
    MATCH (z:USDAZone {zone: '10'})
    MATCH (c:Cultivar)-[:COMPATIBLE_WITH_ZONE]->(z)
    RETURN count(c) as zone10Cultivars
  `

  const verify = await runWriteTransaction(verifyQuery, {})
  console.log(`  Zone 10 compatible cultivars in graph: ${verify[0]?.zone10Cultivars || 0}`)

  console.log('\n')

  await closeDriver()
}

main().catch(console.error)
