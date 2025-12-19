/**
 * Admin Rate Limits API
 *
 * F029: Rate limit monitoring for admin dashboard.
 *
 * GET /api/admin/rate-limits - Get rate limit statistics and recent events
 */

import { NextResponse } from 'next/server'
import { getRateLimitStats, getRateLimitEvents, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export async function GET(): Promise<NextResponse> {
  try {
    const stats = getRateLimitStats()
    const recentEvents = getRateLimitEvents(50)

    // Get only blocked events
    const blockedEvents = recentEvents.filter(e => !e.allowed)

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents: stats.totalEvents,
        blockedCount: stats.blockedCount,
        blockedPercentage: Math.round(stats.blockedPercentage * 10) / 10,
        topBlockedIdentifiers: stats.topBlockedIdentifiers,
      },
      recentBlocked: blockedEvents.slice(0, 20),
      configs: {
        consumer: {
          maxRequests: RATE_LIMIT_CONFIGS.consumer.maxRequests,
          windowMs: RATE_LIMIT_CONFIGS.consumer.windowMs,
        },
        prediction: {
          maxRequests: RATE_LIMIT_CONFIGS.prediction.maxRequests,
          windowMs: RATE_LIMIT_CONFIGS.prediction.windowMs,
        },
        admin: {
          maxRequests: RATE_LIMIT_CONFIGS.admin.maxRequests,
          windowMs: RATE_LIMIT_CONFIGS.admin.windowMs,
        },
        global: {
          maxRequests: RATE_LIMIT_CONFIGS.global.maxRequests,
          windowMs: RATE_LIMIT_CONFIGS.global.windowMs,
        },
      },
    })
  } catch (error) {
    console.error('Rate limits API error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}
