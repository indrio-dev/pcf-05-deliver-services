/**
 * Admin Accuracy API
 *
 * F023: Endpoints for accuracy reporting and monitoring.
 *
 * GET /api/admin/accuracy - Get accuracy reports
 * POST /api/admin/accuracy - Generate new accuracy report
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateReport,
  getReportHistory,
  getAlertedReports,
  type ReportPeriod,
  type SourceType,
  type PredictionLayer,
} from '@/lib/analytics/accuracy-reporter'

// =============================================================================
// GET - Retrieve accuracy reports
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams

    // Check if requesting alerts only
    const alertsOnly = searchParams.get('alerts') === 'true'
    if (alertsOnly) {
      const limit = parseInt(searchParams.get('limit') || '10')
      const reports = await getAlertedReports(limit)
      return NextResponse.json({
        success: true,
        reports,
        count: reports.length,
      })
    }

    // Get report history
    const options: {
      period?: ReportPeriod
      cultivarId?: string
      regionId?: string
      limit?: number
    } = {}

    const period = searchParams.get('period')
    if (period && isValidPeriod(period)) {
      options.period = period
    }

    const cultivarId = searchParams.get('cultivarId')
    if (cultivarId) {
      options.cultivarId = cultivarId
    }

    const regionId = searchParams.get('regionId')
    if (regionId) {
      options.regionId = regionId
    }

    const limit = searchParams.get('limit')
    if (limit) {
      options.limit = parseInt(limit)
    }

    const reports = await getReportHistory(options)

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
      filters: {
        period: options.period || 'all',
        cultivarId: options.cultivarId || null,
        regionId: options.regionId || null,
      },
    })
  } catch (error) {
    console.error('Accuracy API GET error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

// =============================================================================
// POST - Generate new accuracy report
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate and build options
    const options: {
      period?: ReportPeriod
      cultivarId?: string
      regionId?: string
      predictionLayer?: PredictionLayer
      sourceType?: SourceType
      startDate?: string
      endDate?: string
    } = {}

    // Period
    if (body.period && isValidPeriod(body.period)) {
      options.period = body.period
    }

    // Cultivar filter
    if (body.cultivarId && typeof body.cultivarId === 'string') {
      options.cultivarId = body.cultivarId
    }

    // Region filter
    if (body.regionId && typeof body.regionId === 'string') {
      options.regionId = body.regionId
    }

    // Prediction layer filter
    if (body.predictionLayer && isValidLayer(body.predictionLayer)) {
      options.predictionLayer = body.predictionLayer
    }

    // Source type filter
    if (body.sourceType && isValidSourceType(body.sourceType)) {
      options.sourceType = body.sourceType
    }

    // Date range
    if (body.startDate && typeof body.startDate === 'string') {
      options.startDate = body.startDate
    }
    if (body.endDate && typeof body.endDate === 'string') {
      options.endDate = body.endDate
    }

    // Generate report
    const report = await generateReport(options)

    if (!report) {
      return NextResponse.json({
        success: false,
        message: 'No data available for the specified period and filters',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      report,
      message: 'Accuracy report generated successfully',
    })
  } catch (error) {
    console.error('Accuracy API POST error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function isValidPeriod(period: string): period is ReportPeriod {
  return ['daily', 'weekly', 'monthly', 'seasonal', 'all_time'].includes(period)
}

function isValidLayer(layer: string): layer is PredictionLayer {
  return ['deterministic', 'probabilistic', 'exception'].includes(layer)
}

function isValidSourceType(source: string): source is SourceType {
  return ['consumer', 'farm', 'lab', 'all'].includes(source)
}
