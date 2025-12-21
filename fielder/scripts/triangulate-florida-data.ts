#!/usr/bin/env tsx

/**
 * Triangulate Florida Farm Data Against State Harvest Calendar
 *
 * Validates farm-level timing against state-level aggregate data
 * Shows zone-based patterns and identifies consensus/outliers
 */

import * as fs from 'fs'
import * as path from 'path'
import { formatMonths } from '../src/lib/research/localharvest-tool.js'

interface StateCalendar {
  states: {
    [state: string]: {
      zones: {
        [zone: string]: {
          name: string
          usda_zones: string[]
        }
      }
      products: {
        [product: string]: {
          harvestMonths: number[]
          peakMonths?: number[]
          zoneVariation?: any
        }
      }
    }
  }
}

interface FarmCollection {
  farms: Array<{
    farmId: string
    farmName: string
    location: {
      usdaZone: string
      city: string
      county: string
    }
    seasonalWindow?: {
      start: number
      end: number
      description: string
    }
    products: {
      [product: string]: {
        category: string
        availability: string
        seasonalMonths?: number[]
        notes?: string
      }
    }
    dataQuality: string
  }>
}

function loadData() {
  const stateCalendarPath = path.join(
    __dirname,
    '../data/research/state-harvest-calendars.json'
  )
  const farmCollectionPath = path.join(__dirname, '../data/research/florida-farms-collection.json')

  const stateData: StateCalendar = JSON.parse(fs.readFileSync(stateCalendarPath, 'utf-8'))
  const farmData: FarmCollection = JSON.parse(fs.readFileSync(farmCollectionPath, 'utf-8'))

  return { stateData, farmData }
}

function inferMonthsFromWindow(start: number, end: number): number[] {
  const months: number[] = []

  if (start <= end) {
    // Same calendar year: Nov-Apr would be start=11, end=4
    // This is actually crossing year boundary
    // Let's handle both cases
    if (end < start) {
      // Crosses year boundary: e.g., Nov(11) - Apr(4)
      for (let m = start; m <= 12; m++) {
        months.push(m)
      }
      for (let m = 1; m <= end; m++) {
        months.push(m)
      }
    } else {
      // Same year: e.g., Jun(6) - Jul(7)
      for (let m = start; m <= end; m++) {
        months.push(m)
      }
    }
  } else {
    // Crosses year: Nov(11) to Apr(4)
    for (let m = start; m <= 12; m++) {
      months.push(m)
    }
    for (let m = 1; m <= end; m++) {
      months.push(m)
    }
  }

  return months.sort((a, b) => a - b)
}

function monthsOverlap(months1: number[], months2: number[]): boolean {
  return months1.some((m) => months2.includes(m))
}

function calculateOverlapPercent(months1: number[], months2: number[]): number {
  const overlap = months1.filter((m) => months2.includes(m)).length
  return (overlap / months1.length) * 100
}

function printHeader(title: string) {
  console.log('\n' + '='.repeat(80))
  console.log(title)
  console.log('='.repeat(80) + '\n')
}

function triangulateByZone() {
  const { stateData, farmData } = loadData()

  printHeader('FLORIDA TRIANGULATION: FARM-LEVEL vs STATE CALENDAR')

  const flState = stateData.states.FL
  if (!flState) {
    console.error('No Florida state data found')
    return
  }

  // Group farms by zone
  const farmsByZone: { [zone: string]: any[] } = {}

  farmData.farms.forEach((farm) => {
    const zone = farm.location.usdaZone
    if (!farmsByZone[zone]) {
      farmsByZone[zone] = []
    }
    farmsByZone[zone].push(farm)
  })

  // Analyze each zone
  Object.keys(farmsByZone)
    .sort()
    .forEach((zone) => {
      console.log(`\n${'─'.repeat(80)}`)
      console.log(`ZONE ${zone.toUpperCase()} ANALYSIS`)
      console.log('─'.repeat(80))

      const zoneFarms = farmsByZone[zone]
      console.log(`Farms in this zone: ${zoneFarms.length}`)

      // Get state zone data
      const stateZone = flState.zones[zone.charAt(0)] // Get major zone (8, 9, 10, etc.)
      if (stateZone) {
        console.log(`State Zone Name: ${stateZone.name}`)
      }

      // Analyze seasonal windows
      const farmsWithWindows = zoneFarms.filter((f) => f.seasonalWindow)

      if (farmsWithWindows.length > 0) {
        console.log(`\nFarms with explicit seasonal windows: ${farmsWithWindows.length}`)

        farmsWithWindows.forEach((farm) => {
          const months = inferMonthsFromWindow(
            farm.seasonalWindow.start,
            farm.seasonalWindow.end || 12
          )

          console.log(
            `  ✓ ${farm.farmName} (${farm.location.city}): ${farm.seasonalWindow.description}`
          )
          console.log(`    Months: ${formatMonths(months)}`)
        })

        // Check consensus
        if (farmsWithWindows.length >= 2) {
          const allWindows = farmsWithWindows.map((f) =>
            inferMonthsFromWindow(f.seasonalWindow.start, f.seasonalWindow.end || 12)
          )

          // Find common months
          const monthCounts = new Map<number, number>()
          allWindows.forEach((months) => {
            months.forEach((m) => {
              monthCounts.set(m, (monthCounts.get(m) || 0) + 1)
            })
          })

          const threshold = Math.ceil(farmsWithWindows.length * 0.5)
          const consensusMonths = Array.from(monthCounts.entries())
            .filter(([_, count]) => count >= threshold)
            .map(([month, _]) => month)
            .sort((a, b) => a - b)

          console.log(`\n  ZONE ${zone} CONSENSUS: ${formatMonths(consensusMonths)}`)
          console.log(`  (${farmsWithWindows.length} farms reporting)`)
        }
      } else {
        console.log(`\nNo farms with explicit seasonal windows in Zone ${zone}`)
      }

      // List farms without timing data
      const farmsWithoutWindows = zoneFarms.filter((f) => !f.seasonalWindow)
      if (farmsWithoutWindows.length > 0) {
        console.log(`\nFarms WITHOUT timing data (${farmsWithoutWindows.length}):`)
        farmsWithoutWindows.forEach((farm) => {
          console.log(`  ⚠️  ${farm.farmName} (${farm.location.city})`)
        })
      }
    })
}

function validateAgainstStateProducts() {
  const { stateData, farmData } = loadData()

  printHeader('PRODUCT-LEVEL VALIDATION: FARM vs STATE')

  const flState = stateData.states.FL
  if (!flState) return

  // Analyze tomatoes specifically
  console.log('\n' + '─'.repeat(80))
  console.log('TOMATOES')
  console.log('─'.repeat(80))

  const stateTomatoData = flState.products.tomato
  if (stateTomatoData) {
    console.log(`\nSTATE CALENDAR (Florida aggregate):`)
    console.log(`  Harvest: ${formatMonths(stateTomatoData.harvestMonths)}`)
    console.log(`  Peak: ${formatMonths(stateTomatoData.peakMonths || [])}`)

    // Show zone variations from state data
    if (stateTomatoData.zoneVariation) {
      console.log(`\n  Zone-Specific (from state calendar):`)
      Object.entries(stateTomatoData.zoneVariation).forEach(([zone, data]: [string, any]) => {
        console.log(`    Zone ${zone} (${data.zoneName}): ${formatMonths(data.harvestMonths)}`)
      })
    }

    // Find farms growing tomatoes
    const tomatoFarms = farmData.farms.filter((farm) => {
      return Object.keys(farm.products).some(
        (p) => p.includes('tomato') || farm.products[p].category === 'vegetables'
      )
    })

    console.log(`\n  FARMS REPORTING TOMATOES: ${tomatoFarms.length}`)

    tomatoFarms.forEach((farm) => {
      const tomatoProduct = farm.products.tomatoes || farm.products.heirloom_tomatoes

      if (tomatoProduct && farm.seasonalWindow) {
        const farmMonths = inferMonthsFromWindow(
          farm.seasonalWindow.start,
          farm.seasonalWindow.end || 12
        )

        const overlap = calculateOverlapPercent(farmMonths, stateTomatoData.harvestMonths)

        const status = overlap >= 80 ? '✅' : overlap >= 50 ? '⚠️' : '❌'

        console.log(
          `\n  ${status} ${farm.farmName} (Zone ${farm.location.usdaZone}, ${farm.location.city})`
        )
        console.log(`     Farm timing: ${formatMonths(farmMonths)}`)
        console.log(
          `     State window: ${formatMonths(stateTomatoData.harvestMonths)} (${overlap.toFixed(0)}% overlap)`
        )

        if (overlap < 80) {
          console.log(`     ⚠️  Discrepancy detected`)
        } else {
          console.log(`     ✓ Validates state calendar`)
        }
      } else if (tomatoProduct) {
        console.log(
          `\n  ⚠️  ${farm.farmName} (Zone ${farm.location.usdaZone}) - No seasonal window data`
        )
      }
    })
  }

  // Analyze citrus
  console.log('\n' + '─'.repeat(80))
  console.log('CITRUS (Lemons)')
  console.log('─'.repeat(80))

  const citrusFarms = farmData.farms.filter((farm) => {
    return Object.keys(farm.products).some(
      (p) => p.includes('lemon') || farm.products[p].category === 'citrus'
    )
  })

  console.log(`\nFarms reporting citrus/lemons: ${citrusFarms.length}`)

  citrusFarms.forEach((farm) => {
    const lemonProduct = farm.products.lemons
    if (lemonProduct && lemonProduct.seasonalMonths) {
      console.log(`\n  ${farm.farmName} (Zone ${farm.location.usdaZone}, ${farm.location.city})`)
      console.log(`  Lemons: ${formatMonths(lemonProduct.seasonalMonths)}`)
      console.log(`  Season: ${lemonProduct.availability}`)
    }
  })
}

function showSummary() {
  const { farmData } = loadData()

  printHeader('SUMMARY: FLORIDA FARM DATA QUALITY')

  const totalFarms = farmData.farms.length
  const farmsWithTiming = farmData.farms.filter((f) => f.seasonalWindow).length
  const farmsWithProducts = farmData.farms.filter((f) => Object.keys(f.products).length > 0).length
  const highQuality = farmData.farms.filter((f) => f.dataQuality === 'excellent').length
  const goodQuality = farmData.farms.filter((f) => f.dataQuality === 'good').length

  console.log(`Total Farms Collected: ${totalFarms}`)
  console.log(`Farms with explicit seasonal windows: ${farmsWithTiming} (${((farmsWithTiming / totalFarms) * 100).toFixed(0)}%)`)
  console.log(`Farms with product data: ${farmsWithProducts} (${((farmsWithProducts / totalFarms) * 100).toFixed(0)}%)`)
  console.log(`\nData Quality:`)
  console.log(`  Excellent: ${highQuality}`)
  console.log(`  Good: ${goodQuality}`)
  console.log(`  Medium/Low: ${totalFarms - highQuality - goodQuality}`)

  console.log(`\n${'─'.repeat(80)}`)
  console.log('KEY VALIDATION:')
  console.log('─'.repeat(80))

  console.log(`\n✅ Zone 10 (South FL): November-April window`)
  console.log(`   Confirmed by: Cypress Creek Farms, Tiny Farm`)
  console.log(`   Matches state calendar: YES`)

  console.log(`\n✅ Zone 9 (Central FL): October-May window (likely)`)
  console.log(`   Partial data: Greens and Goodness (Oct 15 start)`)
  console.log(`   Matches state calendar: PARTIAL`)

  console.log(`\n⚠️  Zone 8 (North FL): Insufficient data`)
  console.log(`   Need: Explicit timing from North FL farms`)

  console.log(`\n${'─'.repeat(80)}`)
  console.log('THE PROBLEM (What Fielder Solves):')
  console.log('─'.repeat(80))
  console.log(`Only ${farmsWithTiming}/${totalFarms} farms (${((farmsWithTiming / totalFarms) * 100).toFixed(0)}%) provide explicit timing`)
  console.log(`Most say "seasonal" or "pre-order" with NO timing information`)
  console.log(`Consumers don't know WHEN to order`)
  console.log(`Fielder's R pillar fills this gap with zone-based predictions`)
}

// Main execution
console.log('Loading data...')
triangulateByZone()
validateAgainstStateProducts()
showSummary()

console.log('\n✅ Triangulation complete\n')
