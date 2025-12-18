/**
 * GET /api/weather/gdd
 *
 * Get GDD accumulation and weather data for a region
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { getRegion, US_GROWING_REGIONS } from '@/lib/constants/regions'
import { getGddTargets } from '@/lib/constants/gdd-targets'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region')
  const crop = searchParams.get('crop')
  const days = parseInt(searchParams.get('days') || '30')

  if (!region) {
    return NextResponse.json(
      { error: 'region query param is required' },
      { status: 400 }
    )
  }

  // Validate region
  const regionData = getRegion(region)
  if (!regionData) {
    return NextResponse.json(
      { error: `Unknown region: ${region}. Valid regions: ${Object.keys(US_GROWING_REGIONS).join(', ')}` },
      { status: 400 }
    )
  }

  try {
    // Determine base temp from crop or use default
    const baseTemp = crop ? getGddTargets(crop).baseTemp : 55

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get weather summary
    const summary = await weatherService.getRegionalSummary(
      region,
      startDate,
      endDate,
      baseTemp
    )

    // Get forecast
    const forecast = await weatherService.getForecast(region, 7)
    const forecastGdd = forecast.reduce((sum, f) => {
      const avg = (f.tempHigh + f.tempLow) / 2
      return sum + Math.max(0, avg - baseTemp)
    }, 0)

    // Get year-to-date GDD
    const jan1 = new Date(endDate.getFullYear(), 0, 1)
    const ytdGdd = await weatherService.getGddAccumulation(region, jan1, baseTemp)

    return NextResponse.json({
      region,
      regionName: regionData.displayName,
      baseTemp,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days
      },
      summary: {
        totalGdd: summary.totalGdd,
        avgDailyGdd: summary.avgDailyGdd,
        avgHigh: summary.avgHigh,
        avgLow: summary.avgLow,
        minTemp: summary.minTemp,
        maxTemp: summary.maxTemp,
        totalPrecipInches: summary.totalPrecipInches,
        rainDays: summary.rainDays,
        frostEvents: summary.frostEvents,
        observationCount: summary.observationCount
      },
      yearToDate: {
        totalGdd: ytdGdd.totalGdd,
        avgDailyGdd: ytdGdd.avgDailyGdd,
        days: ytdGdd.days
      },
      forecast: {
        days: forecast.length,
        projectedGdd: Math.round(forecastGdd),
        data: forecast.map(f => ({
          date: f.date.toISOString().split('T')[0],
          high: Math.round(f.tempHigh),
          low: Math.round(f.tempLow),
          precipProbability: Math.round(f.precipProbability * 100)
        }))
      }
    })

  } catch (error) {
    console.error('Weather/GDD error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
