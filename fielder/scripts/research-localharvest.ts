#!/usr/bin/env tsx

/**
 * LocalHarvest Research Assistant
 *
 * Helps with manual collection and validation of LocalHarvest farm data
 *
 * Usage:
 *   npm run research:localharvest queries FL tomatoes
 *   npm run research:localharvest validate FL tomatoes
 *   npm run research:localharvest triangulate FL tomatoes
 */

import {
  generateLocalHarvestSearchQueries,
  validateAgainstStateCalendar,
  triangulateAcrossFarms,
  parseSeasonalAvailability,
  formatMonths,
  type LocalHarvestFarm,
} from '../src/lib/research/localharvest-tool'
import * as fs from 'fs'
import * as path from 'path'

const command = process.argv[2]
const state = process.argv[3]
const product = process.argv[4]

function printHeader(title: string) {
  console.log('\n' + '='.repeat(80))
  console.log(title)
  console.log('='.repeat(80) + '\n')
}

function loadLocalHarvestData() {
  const dataPath = path.join(__dirname, '../data/research/localharvest-farms.json')
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  return data
}

function loadStateCalendarData() {
  const dataPath = path.join(__dirname, '../data/research/state-harvest-calendars.json')
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  return data
}

/**
 * Generate search queries for LocalHarvest
 */
function generateQueries() {
  if (!state) {
    console.error('Usage: npm run research:localharvest queries <STATE> [product]')
    process.exit(1)
  }

  printHeader(`LOCALHARVEST SEARCH QUERIES - ${state.toUpperCase()}`)

  const queries = generateLocalHarvestSearchQueries({
    state: state.toUpperCase(),
    productType: product,
  })

  console.log('Copy these queries into Google Search:\n')
  queries.forEach((query, idx) => {
    console.log(`${idx + 1}. ${query}`)
  })

  console.log('\n' + '-'.repeat(80))
  console.log('MANUAL COLLECTION WORKFLOW:')
  console.log('-'.repeat(80))
  console.log('1. Search LocalHarvest.org or use Google queries above')
  console.log('2. Visit farm profile pages')
  console.log('3. Look for "Products and Crops" or "What We Grow" section')
  console.log('4. Record seasonal availability (Spring/Summer/Fall/Winter)')
  console.log('5. Add to data/research/localharvest-farms.json')
  console.log('6. Run validation command to check against state calendar')
  console.log('')
}

/**
 * Validate LocalHarvest data against state harvest calendar
 */
function validateData() {
  if (!state || !product) {
    console.error('Usage: npm run research:localharvest validate <STATE> <product>')
    process.exit(1)
  }

  const localharvestData = loadLocalHarvestData()
  const stateCalendarData = loadStateCalendarData()

  const stateUpper = state.toUpperCase()
  const productLower = product.toLowerCase()

  printHeader(`VALIDATION - ${stateUpper} ${product}`)

  // Get state calendar data
  const stateData = stateCalendarData.states[stateUpper]
  if (!stateData) {
    console.error(`❌ No state calendar data found for ${stateUpper}`)
    console.log('\nRun: npm run research:state ' + stateUpper)
    process.exit(1)
  }

  const stateProductData = stateData.products[productLower]
  if (!stateProductData) {
    console.error(`❌ Product "${productLower}" not found in ${stateUpper} state calendar`)
    process.exit(1)
  }

  console.log(`State Calendar: ${stateUpper} - ${product}`)
  console.log(`Harvest Months: ${formatMonths(stateProductData.harvestMonths)}`)
  console.log('')

  // Get LocalHarvest farm data
  const stateLocalHarvest = localharvestData.states[stateUpper]
  if (!stateLocalHarvest || !stateLocalHarvest.farms || stateLocalHarvest.farms.length === 0) {
    console.error(`❌ No LocalHarvest farms found for ${stateUpper}`)
    console.log('\nAdd farms to data/research/localharvest-farms.json first')
    process.exit(1)
  }

  console.log(`LocalHarvest Farms: ${stateLocalHarvest.farms.length} farms\n`)
  console.log('-'.repeat(80))

  // Validate each farm
  const farms: LocalHarvestFarm[] = stateLocalHarvest.farms
  let validatedCount = 0
  let invalidCount = 0

  farms.forEach((farm) => {
    const result = validateAgainstStateCalendar({
      farmData: farm,
      stateCalendarMonths: stateProductData.harvestMonths,
      productType: productLower,
    })

    if (result.validated) {
      console.log(`✅ ${farm.farmName} (${farm.location.county || farm.location.city})`)
      console.log(`   ${result.notes}`)
      validatedCount++
    } else if (result.reason === 'Product not found in farm data') {
      // Skip - farm doesn't grow this product
    } else {
      console.log(`⚠️  ${farm.farmName} (${farm.location.county || farm.location.city})`)
      console.log(`   ${result.reason}`)
      console.log(`   ${result.notes}`)
      invalidCount++
    }
  })

  console.log('\n' + '-'.repeat(80))
  console.log('VALIDATION SUMMARY')
  console.log('-'.repeat(80))
  console.log(`✅ Validated: ${validatedCount} farms`)
  console.log(`⚠️  Outliers: ${invalidCount} farms`)
  console.log('')
}

/**
 * Triangulate across multiple farms to find consensus
 */
function triangulateFarms() {
  if (!state || !product) {
    console.error('Usage: npm run research:localharvest triangulate <STATE> <product>')
    process.exit(1)
  }

  const localharvestData = loadLocalHarvestData()
  const stateUpper = state.toUpperCase()
  const productLower = product.toLowerCase()

  printHeader(`TRIANGULATION - ${stateUpper} ${product}`)

  const stateLocalHarvest = localharvestData.states[stateUpper]
  if (!stateLocalHarvest || !stateLocalHarvest.farms) {
    console.error(`❌ No LocalHarvest farms found for ${stateUpper}`)
    process.exit(1)
  }

  const result = triangulateAcrossFarms({
    farms: stateLocalHarvest.farms,
    productType: productLower,
    state: stateUpper,
  })

  if (!result.consensus) {
    console.log(`❌ ${result.reason}`)
    process.exit(1)
  }

  console.log(`Product: ${result.productType}`)
  console.log(`State: ${result.state}`)
  console.log(`Farms Reporting: ${result.reportingFarms} / ${result.totalFarms}`)
  console.log('')

  console.log('CONSENSUS HARVEST WINDOW')
  console.log('-'.repeat(80))
  console.log(`Months: ${result.consensus.formatted}`)
  console.log(`Confidence: ${(result.consensus.confidence * 100).toFixed(0)}%`)
  console.log('')

  if (result.outliers && result.outliers.length > 0) {
    console.log('OUTLIERS (farms with harvest outside consensus window)')
    console.log('-'.repeat(80))
    result.outliers.forEach((outlier) => {
      console.log(`- ${outlier.farmName} (${outlier.county})`)
      console.log(`  Months: ${outlier.formatted}`)
    })
    console.log('')
  }

  if (result.farmReports) {
    console.log('INDIVIDUAL FARM REPORTS')
    console.log('-'.repeat(80))
    result.farmReports.forEach((report) => {
      console.log(`- ${report.farmName} (${report.county})`)
      console.log(`  Seasons: ${report.seasons.join(', ')}`)
      console.log(`  Months: ${formatMonths(report.harvestMonths)}`)
    })
  }
}

/**
 * Show example farm data structure
 */
function showExample() {
  printHeader('EXAMPLE FARM DATA STRUCTURE')

  const exampleText = `
Spring: Lettuce, greens, radishes, spinach
Summer: Tomatoes, peppers, squash, cucumbers
Fall: Apples, pumpkins, winter squash
  `.trim()

  console.log('Example seasonal availability text:')
  console.log('-'.repeat(80))
  console.log(exampleText)
  console.log('')

  console.log('Parsed result:')
  console.log('-'.repeat(80))

  const products = parseSeasonalAvailability(exampleText)

  products.forEach((product, key) => {
    console.log(`\n${product.productCategory}`)
    console.log(`  Seasons: ${product.seasons.join(', ')}`)
    console.log(`  Months: ${formatMonths(product.harvestMonths || [])}`)
  })

  console.log('\n' + '-'.repeat(80))
  console.log('JSON structure for localharvest-farms.json:')
  console.log('-'.repeat(80))
  console.log(
    JSON.stringify(
      {
        farmName: 'Heritage Family Farm',
        location: {
          city: 'Athens',
          county: 'Athens County',
          state: 'OH',
        },
        usdaZone: '6a',
        productsAndSeasons: Object.fromEntries(products),
        localharvest_url: 'https://www.localharvest.org/heritage-family-farm',
        scrapedDate: new Date().toISOString().split('T')[0],
      },
      null,
      2
    )
  )
  console.log('')
}

// Main execution
switch (command) {
  case 'queries':
    generateQueries()
    break

  case 'validate':
    validateData()
    break

  case 'triangulate':
    triangulateFarms()
    break

  case 'example':
    showExample()
    break

  default:
    console.error('Invalid command')
    console.log('\nUsage:')
    console.log('  npm run research:localharvest queries <STATE> [product]')
    console.log('  npm run research:localharvest validate <STATE> <product>')
    console.log('  npm run research:localharvest triangulate <STATE> <product>')
    console.log('  npm run research:localharvest example')
    process.exit(1)
}
