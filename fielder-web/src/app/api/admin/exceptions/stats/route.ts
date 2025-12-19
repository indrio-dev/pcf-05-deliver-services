/**
 * Admin Exception Stats API
 *
 * F026: Get exception queue statistics.
 *
 * GET /api/admin/exceptions/stats - Get queue stats
 */

import { NextResponse } from 'next/server'
import { getExceptionStats } from '@/lib/intelligence/exception-handler'

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getExceptionStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Exception stats API error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
