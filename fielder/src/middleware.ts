/**
 * Next.js Middleware
 *
 * F029: API rate limiting middleware.
 *
 * Applies rate limiting to all API routes:
 * - Per-user limits based on userId, deviceId, or IP
 * - Global limits to prevent server overload
 * - Returns 429 with Retry-After header when exceeded
 * - Logs rate limit events for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  getRateLimitConfig,
  getIdentifier,
  logRateLimitEvent,
} from '@/lib/rate-limit'

/**
 * Middleware configuration
 * Only match API routes that need rate limiting
 */
export const config = {
  matcher: [
    // Consumer APIs
    '/api/scans/:path*',
    '/api/discover/:path*',

    // Prediction APIs
    '/api/predict/:path*',
    '/api/quality/:path*',

    // Reference data APIs
    '/api/crops/:path*',
    '/api/regions/:path*',

    // Weather APIs
    '/api/weather/:path*',

    // Admin APIs (higher limits)
    '/api/admin/:path*',

    // Cron jobs (excluded from user limits, only global)
    '/api/cron/:path*',
  ],
}

/**
 * Paths that should skip rate limiting
 */
const SKIP_RATE_LIMIT_PATHS = [
  '/api/cron/', // Cron jobs are internal
]

/**
 * Check if path should skip rate limiting
 */
function shouldSkipRateLimit(path: string): boolean {
  return SKIP_RATE_LIMIT_PATHS.some(skip => path.startsWith(skip))
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest): NextResponse {
  const path = request.nextUrl.pathname

  // Skip rate limiting for certain paths
  if (shouldSkipRateLimit(path)) {
    return NextResponse.next()
  }

  // Get rate limit configuration for this path
  const config = getRateLimitConfig(path)

  // Get identifier for rate limiting
  const searchParams = request.nextUrl.searchParams
  const identifier = getIdentifier(request.headers, searchParams)

  // Check rate limit
  const result = checkRateLimit(identifier, config)

  // Log the event
  logRateLimitEvent(identifier, path, result, config)

  // If blocked, return 429
  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please retry after ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    )
  }

  // Allow request with rate limit headers
  const response = NextResponse.next()

  // Add rate limit headers to response
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

  return response
}
