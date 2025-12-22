#!/usr/bin/env tsx
/**
 * Collect USDA Local Food Portal Data
 *
 * Retrieves farm, market, and food hub data from USDA Local Food Portal API
 * across all 5 directories:
 * - Agritourism
 * - CSA
 * - Farmers Market
 * - Food Hub
 * - On-farm Market
 *
 * Usage:
 *   npx tsx scripts/collect-usda-local-food.ts --state CA
 *   npx tsx scripts/collect-usda-local-food.ts --all-states
 *   npx tsx scripts/collect-usda-local-food.ts --states CA,FL,TX,WA,NY
 */

import fs from 'fs'
import path from 'path'

const API_KEY = 'PpW0VAZRXq'
const BASE_URL = 'https://www.usdalocalfoodportal.com/api'

const DIRECTORIES = [
  'agritourism',
  'csa',
  'farmersmarket',
  'foodhub',
  'onfarmmarket',
] as const

const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

interface USDAListing {
  listing_name: string
  media_website?: string
  location_state: string
  location_city?: string
  location_zipcode?: string
  location_address?: string
  location_county?: string
  [key: string]: any
}

async function fetchDirectory(directory: typeof DIRECTORIES[number], state: string): Promise<USDAListing[]> {
  const url = `${BASE_URL}/${directory}/?apikey=${API_KEY}&state=${state}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`  ❌ ${directory} (${state}): HTTP ${response.status}`)
      return []
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      console.error(`  ❌ ${directory} (${state}): Invalid response format`)
      return []
    }

    return data
  } catch (error) {
    console.error(`  ❌ ${directory} (${state}): ${error}`)
    return []
  }
}

async function collectForState(state: string): Promise<Record<string, USDAListing[]>> {
  console.log(`\n📍 Collecting ${state}...`)

  const results: Record<string, USDAListing[]> = {}

  for (const directory of DIRECTORIES) {
    const data = await fetchDirectory(directory, state)

    if (data.length > 0) {
      results[directory] = data
      console.log(`  ✓ ${directory}: ${data.length} listings`)
    } else {
      console.log(`  - ${directory}: 0 listings`)
    }

    // Rate limit: 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

async function main() {
  const args = process.argv.slice(2)

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║     USDA LOCAL FOOD PORTAL DATA COLLECTION             ║')
  console.log('╚════════════════════════════════════════════════════════╝')

  // Parse arguments
  let targetStates: string[] = []

  if (args.includes('--all-states')) {
    targetStates = ALL_STATES
    console.log(`\n🌎 Collecting all 50 states (5 directories each = 250 API calls)`)
    console.log(`   Estimated time: ~2 minutes (500ms rate limit)\n`)
  } else if (args.includes('--states')) {
    const statesArg = args[args.indexOf('--states') + 1]
    targetStates = statesArg.split(',').map(s => s.trim().toUpperCase())
    console.log(`\n📍 Collecting ${targetStates.length} states: ${targetStates.join(', ')}\n`)
  } else if (args.includes('--state')) {
    const state = args[args.indexOf('--state') + 1].toUpperCase()
    targetStates = [state]
    console.log(`\n📍 Collecting single state: ${state}\n`)
  } else {
    console.log('\n❌ Usage:')
    console.log('   npx tsx scripts/collect-usda-local-food.ts --state CA')
    console.log('   npx tsx scripts/collect-usda-local-food.ts --states CA,FL,TX')
    console.log('   npx tsx scripts/collect-usda-local-food.ts --all-states\n')
    process.exit(1)
  }

  // Collect data
  const allData: Record<string, Record<string, USDAListing[]>> = {}
  let totalListings = 0

  for (const state of targetStates) {
    const stateData = await collectForState(state)
    allData[state] = stateData

    // Count
    for (const directory in stateData) {
      totalListings += stateData[directory].length
    }
  }

  // Save results
  const outputDir = 'data/collected/usda-local-food'
  fs.mkdirSync(outputDir, { recursive: true })

  const timestamp = new Date().toISOString().split('T')[0]
  const outputFile = path.join(outputDir, `usda-local-food-${timestamp}.json`)

  const output = {
    collectedAt: new Date().toISOString(),
    apiKey: 'PpW0VAZRXq',
    states: targetStates,
    directories: DIRECTORIES,
    totalListings,
    data: allData,
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2))

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║                  COLLECTION COMPLETE                   ║')
  console.log('╠════════════════════════════════════════════════════════╣')
  console.log(`║  States collected:      ${targetStates.length.toString().padStart(4)}                           ║`)
  console.log(`║  Total listings:        ${totalListings.toString().padStart(4)}                           ║`)
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`💾 Saved to: ${outputFile}`)
  console.log('')

  // Breakdown by directory
  const directoryCounts: Record<string, number> = {}
  for (const state in allData) {
    for (const directory in allData[state]) {
      directoryCounts[directory] = (directoryCounts[directory] || 0) + allData[state][directory].length
    }
  }

  console.log('Breakdown by directory:')
  for (const directory of DIRECTORIES) {
    const count = directoryCounts[directory] || 0
    console.log(`  ${directory.padEnd(20)} ${count.toString().padStart(5)}`)
  }

  console.log('')
  console.log('Next: Parse and integrate into Knowledge Graph')
  console.log('')
}

main().catch(error => {
  console.error('Collection failed:', error)
  process.exit(1)
})
