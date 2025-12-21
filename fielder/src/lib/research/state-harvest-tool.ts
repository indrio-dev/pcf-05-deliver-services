/**
 * State Harvest Calendar Research Tool
 *
 * Phase 1 of the Agricultural Intelligence research workflow.
 * Discovers state-level harvest timing from extension services and USDA sources.
 */

import type {
  StateProductHarvest,
  DataSource,
  DateRange
} from '../types/agricultural-intelligence'

// =============================================================================
// State Agriculture Department URLs (Official Sources)
// =============================================================================

/**
 * State Department of Agriculture official websites
 *
 * These are the PRIMARY sources for harvest calendar data.
 * Priority 1: Look for seasonal availability charts (PDF or web)
 */
export const STATE_AG_DEPARTMENTS: Record<string, {
  name: string
  url: string
  seasonalChartKeywords: string[]
}> = {
  'FL': {
    name: 'Florida Department of Agriculture',
    url: 'https://www.fdacs.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'produce calendar']
  },
  'CA': {
    name: 'California Department of Food & Agriculture',
    url: 'https://www.cdfa.ca.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'farm products calendar']
  },
  'TX': {
    name: 'Texas Department of Agriculture',
    url: 'https://www.texasagriculture.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest guide', 'texas produce']
  },
  'NY': {
    name: 'New York Department of Agriculture',
    url: 'https://agriculture.ny.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'ny produce']
  },
  'OH': {
    name: 'Ohio Department of Agriculture',
    url: 'https://agri.ohio.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'ohio produce']
  },
  'PA': {
    name: 'Pennsylvania Department of Agriculture',
    url: 'https://www.agriculture.pa.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'pa preferred']
  },
  'MI': {
    name: 'Michigan Department of Agriculture',
    url: 'https://www.michigan.gov/mdard',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'michigan grown']
  },
  'NC': {
    name: 'North Carolina Department of Agriculture',
    url: 'https://www.ncagr.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'nc farm fresh']
  },
  'GA': {
    name: 'Georgia Department of Agriculture',
    url: 'http://agr.georgia.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'georgia grown']
  },
  'WA': {
    name: 'Washington State Department of Agriculture',
    url: 'https://agr.wa.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'washington grown']
  },
  'OR': {
    name: 'Oregon Department of Agriculture',
    url: 'https://www.oregon.gov/oda',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'oregon tilth']
  },
  'VA': {
    name: 'Virginia Department of Agriculture',
    url: 'https://www.vdacs.virginia.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'virginia grown']
  },
  'TN': {
    name: 'Tennessee Department of Agriculture',
    url: 'https://www.tn.gov/agriculture',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'pick tennessee']
  },
  'NJ': {
    name: 'New Jersey Department of Agriculture',
    url: 'https://www.nj.gov/agriculture',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'jersey fresh']
  },
  'MA': {
    name: 'Massachusetts Department of Agricultural Resources',
    url: 'https://www.mass.gov/orgs/department-of-agricultural-resources',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'mass grown']
  },
  'WI': {
    name: 'Wisconsin Department of Agriculture',
    url: 'https://datcp.wi.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'something special from wisconsin']
  },
  'MN': {
    name: 'Minnesota Department of Agriculture',
    url: 'https://www.mda.state.mn.us',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'minnesota grown']
  },
  'IN': {
    name: 'Indiana State Department of Agriculture',
    url: 'https://www.in.gov/isda',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'indiana grown']
  },
  'CO': {
    name: 'Colorado Department of Agriculture',
    url: 'https://ag.colorado.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'colorado proud']
  },
  'AL': {
    name: 'Alabama Department of Agriculture',
    url: 'https://www.agi.alabama.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'alabama grown']
  },
  'SC': {
    name: 'South Carolina Department of Agriculture',
    url: 'https://agriculture.sc.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'certified sc grown']
  },
  'KY': {
    name: 'Kentucky Department of Agriculture',
    url: 'https://www.kyagr.com',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'kentucky proud']
  },
  'AR': {
    name: 'Arkansas Department of Agriculture',
    url: 'https://www.agriculture.arkansas.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'arkansas grown']
  },
  'MS': {
    name: 'Mississippi Department of Agriculture',
    url: 'https://www.mdac.ms.gov',
    seasonalChartKeywords: ['seasonal availability', 'harvest calendar', 'genuine ms']
  },
}

/**
 * Generate search queries prioritizing official state agriculture charts
 */
export function generateOfficialChartQueries(state: string): string[] {
  const dept = STATE_AG_DEPARTMENTS[state]

  if (!dept) {
    // Fallback for states not in our database
    return [
      `${state} department of agriculture seasonal availability chart`,
      `${state} produce harvest calendar`,
      `${state} farm products seasonal guide`,
    ]
  }

  return [
    // Priority 1: Direct search for official chart
    `site:${new URL(dept.url).hostname} seasonal availability chart`,
    `site:${new URL(dept.url).hostname} harvest calendar`,
    `site:${new URL(dept.url).hostname} produce calendar PDF`,

    // Priority 2: General state searches
    `${dept.name} seasonal availability chart`,
    `${state} agriculture department harvest calendar`,
  ]
}

/**
 * Generate extension service search queries for state × product research
 *
 * These are SECONDARY sources after official state charts
 */
export function generateExtensionQueries(
  state: string,
  productType: string
): string[] {
  return [
    // Extension harvest calendars
    `${state} ${productType} harvest calendar extension`,
    `${state} state university ${productType} production guide`,
    `${state} cooperative extension ${productType} harvest timing`,

    // State agriculture departments (product-specific)
    `${state} department agriculture ${productType} season`,
    `${state} ${productType} growing season dates`,

    // Commercial grower guides
    `${state} commercial ${productType} harvest schedule`,
    `${productType} production ${state} best practices`,
  ]
}

/**
 * Generate USDA NASS search queries for state production data
 */
export function generateUSDAQueries(
  state: string,
  productType: string
): string[] {
  return [
    `USDA NASS ${state} ${productType} production statistics`,
    `${state} ${productType} acreage USDA census`,
    `USDA ${productType} harvest dates ${state}`,
  ]
}

// =============================================================================
// URL Pattern Recognition
// =============================================================================

/**
 * Identify high-quality sources from URLs
 */
export function classifySourceQuality(url: string): {
  type: DataSource['type']
  confidence: number
  description: string
} {
  const urlLower = url.toLowerCase()

  // Extension services (highest confidence)
  if (urlLower.includes('.edu')) {
    if (urlLower.includes('extension') || urlLower.includes('ifas') ||
        urlLower.includes('cooperative')) {
      return {
        type: 'extension',
        confidence: 0.9,
        description: 'University Extension Service'
      }
    }
    return {
      type: 'extension',
      confidence: 0.8,
      description: 'Academic Institution'
    }
  }

  // USDA sources
  if (urlLower.includes('usda.gov') || urlLower.includes('nass.usda')) {
    return {
      type: 'usda',
      confidence: 0.95,
      description: 'USDA Official Data'
    }
  }

  // State agriculture departments
  if (urlLower.includes('agriculture') &&
      (urlLower.includes('.gov') || urlLower.includes('state.'))) {
    return {
      type: 'extension',
      confidence: 0.85,
      description: 'State Agriculture Department'
    }
  }

  // Commercial/industry sources (lower confidence)
  return {
    type: 'inference',
    confidence: 0.5,
    description: 'Commercial Source'
  }
}

// =============================================================================
// Harvest Window Parsing
// =============================================================================

/**
 * Month name to number mapping
 */
const MONTHS: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
}

/**
 * Parse harvest window from text
 *
 * Patterns to detect:
 * - "June through September"
 * - "Harvest: July-October"
 * - "Available May to August"
 * - "Peak season: June, July, August"
 */
export function parseHarvestWindow(text: string): DateRange | null {
  const textLower = text.toLowerCase()

  // Pattern 1: "Month through Month" or "Month to Month" or "Month-Month"
  const rangePattern = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s*(?:through|to|-|–|—)\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/i

  const rangeMatch = textLower.match(rangePattern)
  if (rangeMatch) {
    const startMonth = MONTHS[rangeMatch[1].toLowerCase()]
    const endMonth = MONTHS[rangeMatch[2].toLowerCase()]

    if (startMonth && endMonth) {
      const currentYear = new Date().getFullYear()
      return {
        start: new Date(currentYear, startMonth - 1, 1),
        end: new Date(currentYear, endMonth, 0), // Last day of end month
        year: currentYear
      }
    }
  }

  // Pattern 2: "Month, Month, Month" (consecutive months)
  const monthListPattern = /(?:harvest|available|season|peak).*?:\s*([a-z,\s]+)/i
  const listMatch = textLower.match(monthListPattern)

  if (listMatch) {
    const monthNames = listMatch[1].split(/,\s*/)
    const months = monthNames
      .map(m => MONTHS[m.trim()])
      .filter(Boolean)
      .sort((a, b) => a - b)

    if (months.length >= 2) {
      const currentYear = new Date().getFullYear()
      return {
        start: new Date(currentYear, months[0] - 1, 1),
        end: new Date(currentYear, months[months.length - 1], 0),
        year: currentYear
      }
    }
  }

  return null
}

/**
 * Extract state harvest data from search result text
 */
export function extractHarvestData(
  state: string,
  productType: string,
  text: string,
  url: string
): Partial<StateProductHarvest> | null {
  const harvestWindow = parseHarvestWindow(text)

  if (!harvestWindow) {
    return null
  }

  const sourceQuality = classifySourceQuality(url)

  return {
    state,
    productType,
    harvestWindow,
    sources: [{
      type: sourceQuality.type,
      url,
      description: sourceQuality.description,
      capturedDate: new Date(),
      confidence: sourceQuality.confidence
    }]
  }
}

// =============================================================================
// Farm Count Estimation (from text)
// =============================================================================

/**
 * Extract farm count mentions from text
 *
 * Patterns:
 * - "over 500 farms"
 * - "approximately 1,200 growers"
 * - "300+ producers"
 */
export function extractFarmCount(text: string): number | null {
  const patterns = [
    /(\d+[,\d]*)\s*(?:\+|over|approximately)?\s*(?:farms|growers|producers)/i,
    /(?:over|approximately)\s*(\d+[,\d]*)\s*(?:farms|growers|producers)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const numStr = match[1].replace(/,/g, '')
      const num = parseInt(numStr, 10)
      if (!isNaN(num)) {
        return num
      }
    }
  }

  return null
}

// =============================================================================
// Multi-Source Triangulation
// =============================================================================

/**
 * Combine multiple harvest window findings into single consolidated result
 *
 * Strategy:
 * - Use earliest start date across sources
 * - Use latest end date across sources
 * - Weight by source confidence
 */
export function triangulateHarvestWindows(
  findings: Partial<StateProductHarvest>[]
): StateProductHarvest | null {
  if (findings.length === 0) {
    return null
  }

  // Aggregate all sources
  const allSources: DataSource[] = []
  findings.forEach(f => {
    if (f.sources) {
      allSources.push(...f.sources)
    }
  })

  // Find consensus window (earliest start, latest end)
  const windows = findings
    .map(f => f.harvestWindow)
    .filter((w): w is DateRange => w !== undefined)

  if (windows.length === 0) {
    return null
  }

  const starts = windows.map(w => w.start.getTime())
  const ends = windows.map(w => w.end.getTime())

  const consensusWindow: DateRange = {
    start: new Date(Math.min(...starts)),
    end: new Date(Math.max(...ends)),
    year: windows[0].year
  }

  // Aggregate farm counts (take highest)
  const farmCounts = findings
    .map(f => f.farmCount)
    .filter((c): c is number => c !== undefined)

  const farmCount = farmCounts.length > 0
    ? Math.max(...farmCounts)
    : undefined

  const first = findings[0]

  return {
    id: `${first.state}_${first.productType}_${new Date().getFullYear()}`,
    state: first.state!,
    productType: first.productType!,
    harvestWindow: consensusWindow,
    sources: allSources,
    farmCount,
    notes: `Triangulated from ${findings.length} sources`
  }
}

// =============================================================================
// State Priority Lists
// =============================================================================

/**
 * US states ordered by agricultural production value (top producers first)
 */
export const TOP_AGRICULTURAL_STATES = [
  'CA', 'IA', 'TX', 'NE', 'MN', 'IL', 'KS', 'NC', 'WI', 'IN',
  'OH', 'FL', 'WA', 'CO', 'PA', 'MI', 'GA', 'SD', 'AR', 'NY'
]

/**
 * Priority products for initial research (high-value, common crops)
 */
export const PRIORITY_PRODUCTS = [
  'tomato',
  'apple',
  'strawberry',
  'peach',
  'sweet_corn',
  'blueberry',
  'lettuce',
  'pepper',
  'cucumber',
  'watermelon'
]

// =============================================================================
// Research Task Queue
// =============================================================================

/**
 * Generate prioritized research queue for state harvest research
 */
export function generateResearchQueue(
  products: string[] = PRIORITY_PRODUCTS,
  states: string[] = TOP_AGRICULTURAL_STATES
): Array<{ state: string; product: string; priority: number }> {
  const queue: Array<{ state: string; product: string; priority: number }> = []

  // Priority = inverse of (state_index + product_index)
  // Earlier states + earlier products = higher priority
  for (let s = 0; s < states.length; s++) {
    for (let p = 0; p < products.length; p++) {
      queue.push({
        state: states[s],
        product: products[p],
        priority: 1 / (s + p + 2) // Avoid division by zero
      })
    }
  }

  return queue.sort((a, b) => b.priority - a.priority)
}

// =============================================================================
// Example Usage
// =============================================================================

/**
 * Example: Research Ohio tomato harvest timing
 */
export async function exampleStateResearch(): Promise<void> {
  const state = 'OH'
  const product = 'tomato'

  console.log(`\n=== STATE HARVEST RESEARCH: ${state} ${product} ===\n`)

  // Step 1: Generate search queries
  const extensionQueries = generateExtensionQueries(state, product)
  const usdaQueries = generateUSDAQueries(state, product)

  console.log('Extension Queries:')
  extensionQueries.forEach((q, i) => console.log(`  ${i + 1}. ${q}`))

  console.log('\nUSDA Queries:')
  usdaQueries.forEach((q, i) => console.log(`  ${i + 1}. ${q}`))

  // Step 2: Execute searches (would use WebSearch in real implementation)
  console.log('\n→ Execute searches via WebSearch tool')
  console.log('→ Parse results for harvest windows')
  console.log('→ Extract farm counts if available')

  // Step 3: Example parsed result
  const exampleResult: StateProductHarvest = {
    id: `${state}_${product}_2025`,
    state,
    productType: product,
    harvestWindow: {
      start: new Date(2025, 6, 1), // July 1
      end: new Date(2025, 9, 15),  // October 15
      year: 2025
    },
    sources: [
      {
        type: 'extension',
        url: 'https://ohioline.osu.edu/factsheet/example',
        description: 'Ohio State University Extension',
        capturedDate: new Date(),
        confidence: 0.9
      }
    ],
    farmCount: 1200,
    notes: 'Peak season July-September'
  }

  console.log('\nExample Result:')
  console.log(JSON.stringify(exampleResult, null, 2))
}
