/**
 * Admin Models API
 *
 * F028: Model version statistics for dashboard.
 *
 * GET /api/admin/models - Get all model versions with stats
 */

import { NextResponse } from 'next/server'
import { getAllModelVersions } from '@/lib/intelligence/brix-ml-service'

export async function GET(): Promise<NextResponse> {
  try {
    const versions = await getAllModelVersions('brix')

    const models = versions.map(v => ({
      version: v.version,
      mae: v.mae,
      sampleCount: v.sampleCount,
      trafficPct: v.trafficPercentage,
      isProduction: v.isProduction,
      isActive: v.isActive,
      trainedAt: v.trainedAt,
    }))

    return NextResponse.json({
      success: true,
      models,
    })
  } catch (error) {
    console.error('Models API error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
