#!/usr/bin/env tsx

/**
 * State Harvest Research Script
 *
 * Executable script to research state-level harvest timing from official sources.
 *
 * Usage:
 *   npm run research:state FL
 *   npm run research:state OH tomato
 *   npm run research:state all         # All states
 */

import {
  STATE_AG_DEPARTMENTS,
  generateOfficialChartQueries,
  generateExtensionQueries,
  TOP_AGRICULTURAL_STATES,
  PRIORITY_PRODUCTS,
} from '../src/lib/research/state-harvest-tool'

// =============================================================================
// Research Execution
// =============================================================================

interface ResearchResult {
  state: string
  product?: string
  officialChartUrl?: string
  extensionUrls: string[]
  harvestWindow?: {
    start: string
    end: string
  }
  farmCount?: number
  sources: Array<{
    url: string
    type: string
    confidence: number
  }>
  notes: string[]
}

/**
 * Research a single state's seasonal availability
 */
async function researchState(state: string): Promise<ResearchResult> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`RESEARCHING: ${state} - ${STATE_AG_DEPARTMENTS[state]?.name || 'Unknown'}`)
  console.log('='.repeat(60))

  const result: ResearchResult = {
    state,
    extensionUrls: [],
    sources: [],
    notes: []
  }

  // Step 1: Generate search queries for official chart
  const chartQueries = generateOfficialChartQueries(state)

  console.log('\n📋 Official Chart Search Queries:')
  chartQueries.forEach((q, i) => console.log(`  ${i + 1}. ${q}`))

  result.notes.push('Execute these searches manually or via WebSearch API')
  result.notes.push('Look for PDFs with "seasonal availability" or "harvest calendar"')

  // Step 2: Document expected chart patterns
  const dept = STATE_AG_DEPARTMENTS[state]
  if (dept) {
    console.log(`\n🎯 Expected Chart Patterns:`)
    dept.seasonalChartKeywords.forEach(keyword => {
      console.log(`  - "${keyword}"`)
    })

    console.log(`\n🌐 Official Website: ${dept.url}`)

    result.notes.push(`Check ${dept.url} directly for:`)
    result.notes.push(`- "Resources" or "Publications" section`)
    result.notes.push(`- "For Consumers" or "Buy Local" section`)
    result.notes.push(`- Search site for "harvest calendar" or "seasonal"`)
  }

  // Step 3: Example data structure for manual entry
  console.log('\n📝 Data Entry Format (after finding chart):')
  console.log(JSON.stringify({
    state,
    products: [
      {
        name: 'tomato',
        harvestMonths: [6, 7, 8, 9], // June-September
      },
      {
        name: 'apple',
        harvestMonths: [8, 9, 10, 11], // Aug-Nov
      },
      {
        name: 'strawberry',
        harvestMonths: [4, 5, 6], // Apr-June
      }
    ],
    source: {
      url: 'https://example.gov/harvest-calendar.pdf',
      title: 'Seasonal Availability Chart',
      capturedDate: new Date().toISOString()
    }
  }, null, 2))

  return result
}

/**
 * Research a specific state × product combination
 */
async function researchStateProduct(
  state: string,
  product: string
): Promise<ResearchResult> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`RESEARCHING: ${state} ${product}`)
  console.log('='.repeat(60))

  const result: ResearchResult = {
    state,
    product,
    extensionUrls: [],
    sources: [],
    notes: []
  }

  // Extension service queries (for specific product detail)
  const extensionQueries = generateExtensionQueries(state, product)

  console.log('\n🎓 Extension Service Queries:')
  extensionQueries.forEach((q, i) => console.log(`  ${i + 1}. ${q}`))

  result.notes.push('These queries target cultivar recommendations and detailed timing')
  result.notes.push('May find variety trial results and commercial production guides')

  return result
}

/**
 * Generate research checklist for all priority states
 */
async function generateResearchChecklist(): Promise<void> {
  console.log('\n' + '='.repeat(80))
  console.log('STATE HARVEST RESEARCH CHECKLIST')
  console.log('='.repeat(80))

  console.log('\n📊 States to Research:', TOP_AGRICULTURAL_STATES.length)
  console.log('🌾 Priority Products:', PRIORITY_PRODUCTS.length)
  console.log('📋 Total State×Product Combinations:',
    TOP_AGRICULTURAL_STATES.length * PRIORITY_PRODUCTS.length)

  console.log('\n\n## PHASE 1: State-Level Baseline (Fast)')
  console.log('\nGoal: Get official seasonal availability charts for each state')
  console.log('Expected time: 1-2 hours (5-10 min per state)')
  console.log('\nStates:')

  TOP_AGRICULTURAL_STATES.forEach((state, i) => {
    const dept = STATE_AG_DEPARTMENTS[state]
    console.log(`\n${i + 1}. ${state} - ${dept?.name || 'Unknown'}`)
    if (dept) {
      console.log(`   URL: ${dept.url}`)
      console.log(`   Look for: ${dept.seasonalChartKeywords[0]}`)
    }
    console.log(`   [ ] Chart found`)
    console.log(`   [ ] Data entered`)
  })

  console.log('\n\n## PHASE 2: Product-Specific Detail (Drill-Down)')
  console.log('\nGoal: Get cultivar recommendations and detailed timing for priority crops')
  console.log('Expected time: Days-weeks (research intensive)')

  console.log('\n\nPriority Products:')
  PRIORITY_PRODUCTS.forEach((product, i) => {
    console.log(`${i + 1}. ${product}`)
  })

  console.log('\n\nFor each State × Product:')
  console.log('  [ ] Extension guide found')
  console.log('  [ ] Recommended cultivars identified')
  console.log('  [ ] Harvest timing extracted')
  console.log('  [ ] Farm count estimated (if available)')
}

/**
 * Generate Florida example (since we have the actual PDF)
 */
async function showFloridaExample(): Promise<void> {
  console.log('\n' + '='.repeat(80))
  console.log('FLORIDA EXAMPLE (Actual Data Source)')
  console.log('='.repeat(80))

  console.log('\n📄 Official Chart:')
  console.log('https://ccmedia.fdacs.gov/content/download/16790/file/florida-produce-seasonal-availability-chart.pdf')

  console.log('\n📊 This chart shows:')
  console.log('  - All major produce categories')
  console.log('  - Month-by-month availability')
  console.log('  - Peak vs shoulder seasons')

  console.log('\n💡 Research Process:')
  console.log('  1. Download PDF')
  console.log('  2. Extract month columns for each product')
  console.log('  3. Map to DateRange objects')
  console.log('  4. Store in database with source attribution')

  console.log('\n🎯 Expected Data Structure:')
  console.log(JSON.stringify({
    state: 'FL',
    products: {
      tomato: {
        harvestMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6],
        peakMonths: [12, 1, 2, 3],
        notes: 'Year-round with winter peak'
      },
      strawberry: {
        harvestMonths: [11, 12, 1, 2, 3, 4],
        peakMonths: [12, 1, 2, 3],
        notes: 'Winter crop, Plant City region'
      },
      blueberry: {
        harvestMonths: [3, 4, 5],
        peakMonths: [4],
        notes: 'Early spring, rabbiteye varieties'
      }
    },
    source: {
      url: 'https://ccmedia.fdacs.gov/content/download/16790/file/florida-produce-seasonal-availability-chart.pdf',
      type: 'official',
      department: 'Florida Department of Agriculture and Consumer Services',
      confidence: 0.95,
      capturedDate: new Date().toISOString()
    }
  }, null, 2))
}

// =============================================================================
// CLI Interface
// =============================================================================

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('\nUsage:')
    console.log('  npm run research:state <STATE>')
    console.log('  npm run research:state <STATE> <PRODUCT>')
    console.log('  npm run research:state checklist')
    console.log('  npm run research:state florida-example')
    console.log('\nExamples:')
    console.log('  npm run research:state FL')
    console.log('  npm run research:state OH tomato')
    console.log('  npm run research:state checklist')
    console.log('  npm run research:state florida-example')
    return
  }

  const command = args[0].toUpperCase()

  if (command === 'CHECKLIST') {
    await generateResearchChecklist()
    return
  }

  if (command === 'FLORIDA-EXAMPLE') {
    await showFloridaExample()
    return
  }

  if (command === 'ALL') {
    console.log('\nGenerating research plan for all states...\n')
    await generateResearchChecklist()
    return
  }

  const state = command
  const product = args[1]?.toLowerCase()

  if (!STATE_AG_DEPARTMENTS[state]) {
    console.log(`\n⚠️  State '${state}' not yet in database.`)
    console.log(`\nSupported states: ${Object.keys(STATE_AG_DEPARTMENTS).join(', ')}`)
    return
  }

  if (product) {
    await researchStateProduct(state, product)
  } else {
    await researchState(state)
  }

  console.log('\n\n💡 Next Steps:')
  console.log('  1. Execute the search queries above (manually or via WebSearch API)')
  console.log('  2. Download any PDFs or save web pages found')
  console.log('  3. Extract harvest timing data')
  console.log('  4. Enter into database using the format shown')
  console.log('  5. Commit data with source attribution\n')
}

main()
