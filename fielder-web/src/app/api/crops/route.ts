/**
 * GET /api/crops
 *
 * List all available crops with their GDD targets
 */

import { NextRequest, NextResponse } from 'next/server'
import { CROP_GDD_TARGETS } from '@/lib/constants/gdd-targets'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  // Define categories for each crop
  const cropCategories: Record<string, string> = {
    navel_orange: 'citrus',
    valencia: 'citrus',
    grapefruit: 'citrus',
    tangerine: 'citrus',
    satsuma: 'citrus',
    peach: 'stone_fruit',
    sweet_cherry: 'stone_fruit',
    tart_cherry: 'stone_fruit',
    apple: 'pome_fruit',
    pear: 'pome_fruit',
    strawberry: 'berry',
    blueberry: 'berry',
    mango: 'tropical',
    pomegranate: 'tropical',
    pecan: 'nut'
  }

  // Build crop list
  const crops = Object.entries(CROP_GDD_TARGETS).map(([id, targets]) => ({
    id,
    name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    category: cropCategories[id] || 'other',
    baseTemp: targets.baseTemp,
    gddToMaturity: targets.gddToMaturity,
    gddToPeak: targets.gddToPeak,
    gddWindow: targets.gddWindow,
    chillHoursRequired: targets.chillHoursRequired,
    notes: targets.notes
  }))

  // Filter by category if specified
  const filtered = category
    ? crops.filter(c => c.category === category)
    : crops

  return NextResponse.json({
    crops: filtered,
    categories: [...new Set(crops.map(c => c.category))].sort(),
    total: filtered.length
  })
}
