#!/usr/bin/env tsx

/**
 * Map Fielder Growing Regions to USDA Zones
 *
 * Reads growing-regions.ts and extracts all regions with their USDA zones,
 * then organizes them by zone for the USDA zone index.
 */

import * as fs from 'fs'
import * as path from 'path'

// Import all region data
import {
  CALIFORNIA_REGIONS,
  FLORIDA_REGIONS,
  TEXAS_REGIONS,
  PACIFIC_NORTHWEST_REGIONS,
  SOUTHWEST_REGIONS,
  MIDWEST_REGIONS,
  SOUTHEAST_REGIONS,
  NORTHEAST_REGIONS,
  MID_ATLANTIC_REGIONS,
  type GrowingRegionExtended
} from '../src/lib/constants/growing-regions'

interface RegionsByZone {
  [zone: string]: {
    regionId: string
    name: string
    state: string
    macroRegion: string
  }[]
}

function mapRegionsToZones(): RegionsByZone {
  const byZone: RegionsByZone = {}

  // Combine all region objects
  const allRegions = {
    ...CALIFORNIA_REGIONS,
    ...FLORIDA_REGIONS,
    ...TEXAS_REGIONS,
    ...PACIFIC_NORTHWEST_REGIONS,
    ...SOUTHWEST_REGIONS,
    ...MIDWEST_REGIONS,
    ...SOUTHEAST_REGIONS,
    ...NORTHEAST_REGIONS,
    ...MID_ATLANTIC_REGIONS
  }

  // Group by USDA zone
  for (const [regionId, region] of Object.entries(allRegions)) {
    const zone = region.climate.usdaZone

    if (!zone) {
      console.warn(`⚠️  Region ${regionId} has no USDA zone assigned`)
      continue
    }

    if (!byZone[zone]) {
      byZone[zone] = []
    }

    byZone[zone].push({
      regionId,
      name: region.name,
      state: region.state,
      macroRegion: region.macroRegion
    })
  }

  return byZone
}

function printReport(byZone: RegionsByZone) {
  console.log('\n' + '='.repeat(80))
  console.log('FIELDER GROWING REGIONS → USDA ZONE MAPPING')
  console.log('='.repeat(80))

  const zones = Object.keys(byZone).sort((a, b) => parseInt(a) - parseInt(b))

  for (const zone of zones) {
    const regions = byZone[zone]
    console.log(`\n## ZONE ${zone} (${regions.length} regions)`)
    console.log('-'.repeat(80))

    regions.forEach(region => {
      console.log(`  ${region.regionId.padEnd(30)} ${region.state.padEnd(4)} ${region.name}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))

  zones.forEach(zone => {
    console.log(`  Zone ${zone}: ${byZone[zone].length} regions`)
  })

  const totalRegions = zones.reduce((sum, zone) => sum + byZone[zone].length, 0)
  console.log(`\n  Total: ${totalRegions} regions mapped`)
}

function generateZoneIndexUpdate(byZone: RegionsByZone): any {
  const zones = Object.keys(byZone).sort((a, b) => parseInt(a) - parseInt(b))

  const update: any = {}

  for (const zone of zones) {
    const regionIds = byZone[zone].map(r => r.regionId)
    update[zone] = {
      fielderRegions: regionIds,
      regionCount: regionIds.length
    }
  }

  return update
}

function saveZoneMapping(byZone: RegionsByZone) {
  const outputPath = path.join(__dirname, '../data/research/region-zone-mapping.json')

  const output = {
    version: '1.0.0',
    generatedDate: new Date().toISOString(),
    description: 'Fielder Growing Regions mapped to USDA zones',
    source: 'Extracted from src/lib/constants/growing-regions.ts',
    totalRegions: Object.values(byZone).reduce((sum, regions) => sum + regions.length, 0),
    zones: byZone
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n✅ Saved mapping to: ${outputPath}`)
}

// Main execution
const byZone = mapRegionsToZones()
printReport(byZone)
saveZoneMapping(byZone)

// Generate update for usda-zone-index.json
const zoneUpdate = generateZoneIndexUpdate(byZone)
console.log('\n' + '='.repeat(80))
console.log('UPDATE FOR usda-zone-index.json')
console.log('='.repeat(80))
console.log('\nAdd these fielderRegions arrays to each zone:')
console.log(JSON.stringify(zoneUpdate, null, 2))
