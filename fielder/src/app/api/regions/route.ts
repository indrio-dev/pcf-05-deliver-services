/**
 * GET /api/regions
 *
 * List all growing regions with their climate data
 */

import { NextRequest, NextResponse } from 'next/server'
import { US_GROWING_REGIONS } from '@/lib/constants/regions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')
  const crop = searchParams.get('crop')

  // Build region list
  let regions = Object.values(US_GROWING_REGIONS).map(region => ({
    id: region.id,
    name: region.name,
    displayName: region.displayName,
    state: region.state,
    latitude: region.latitude,
    longitude: region.longitude,
    usdaZone: region.climate.usdaZone,
    frostFreeDays: region.climate.frostFreeDays,
    annualGdd50: region.climate.annualGdd50,
    avgChillHours: region.climate.avgChillHours,
    viableCrops: region.viableCrops
  }))

  // Filter by state if specified
  if (state) {
    regions = regions.filter(r => r.state === state.toUpperCase())
  }

  // Filter by crop if specified
  if (crop) {
    regions = regions.filter(r => r.viableCrops.includes(crop))
  }

  // Group by state for UI
  const byState: Record<string, typeof regions> = {}
  for (const region of regions) {
    if (!byState[region.state]) {
      byState[region.state] = []
    }
    byState[region.state].push(region)
  }

  return NextResponse.json({
    regions,
    byState,
    states: Object.keys(byState).sort(),
    total: regions.length
  })
}
