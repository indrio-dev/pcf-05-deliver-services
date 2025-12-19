/**
 * Rate Limiting Module
 *
 * F029: API rate limiting with per-user and global limits.
 *
 * Uses sliding window algorithm with in-memory storage.
 * For production scale, replace with Redis-based implementation.
 */

// =============================================================================
// TYPES
// =============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
  firstRequestAt: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

interface RateLimitConfig {
  windowMs: number       // Time window in milliseconds
  maxRequests: number    // Max requests per window
  keyPrefix?: string     // Prefix for cache keys
}

// =============================================================================
// CONFIGURATION
// =============================================================================

export const RATE_LIMIT_CONFIGS = {
  // Consumer APIs (scans, discover)
  consumer: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 requests per minute
    keyPrefix: 'consumer',
  },

  // Prediction APIs (predict, quality)
  prediction: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute
    keyPrefix: 'prediction',
  },

  // Admin APIs
  admin: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 120,         // 120 requests per minute
    keyPrefix: 'admin',
  },

  // Strict limit for sensitive endpoints
  strict: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 requests per minute
    keyPrefix: 'strict',
  },

  // Global limit (fallback)
  global: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute
    keyPrefix: 'global',
  },
} as const

// =============================================================================
// IN-MEMORY STORE
// =============================================================================

// Rate limit entries: key -> entry
const rateLimitStore = new Map<string, RateLimitEntry>()

// Global request counter
let globalRequestCount = 0
let globalResetAt = Date.now() + 60000

const GLOBAL_MAX_REQUESTS = 1000  // 1000 requests per minute globally

// Cleanup interval for expired entries
const CLEANUP_INTERVAL_MS = 60000  // 1 minute
let cleanupInterval: NodeJS.Timeout | null = null

/**
 * Start the cleanup interval for expired rate limit entries
 */
export function startCleanup(): void {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
}

/**
 * Stop the cleanup interval (for testing)
 */
export function stopCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear()
  globalRequestCount = 0
  globalResetAt = Date.now() + 60000
}

// =============================================================================
// RATE LIMITER
// =============================================================================

/**
 * Check if a request is allowed under rate limits
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.global
): RateLimitResult {
  const now = Date.now()
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier

  // Check global limit first
  if (globalResetAt <= now) {
    globalRequestCount = 0
    globalResetAt = now + 60000
  }

  if (globalRequestCount >= GLOBAL_MAX_REQUESTS) {
    const retryAfter = Math.ceil((globalResetAt - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetAt: globalResetAt,
      retryAfter,
    }
  }

  // Check per-user limit
  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt <= now) {
    // Create new entry
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
      firstRequestAt: now,
    }
  }

  // Check if over limit
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    }
  }

  // Increment counters
  entry.count++
  globalRequestCount++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get the appropriate rate limit config for a path
 */
export function getRateLimitConfig(path: string): RateLimitConfig {
  // Admin endpoints
  if (path.startsWith('/api/admin/')) {
    return RATE_LIMIT_CONFIGS.admin
  }

  // Consumer scan endpoint (needs rate limiting most)
  if (path === '/api/scans') {
    return RATE_LIMIT_CONFIGS.consumer
  }

  // Prediction endpoints
  if (path === '/api/predict' || path === '/api/quality') {
    return RATE_LIMIT_CONFIGS.prediction
  }

  // Discovery/browse endpoints
  if (path === '/api/discover' || path === '/api/crops' || path === '/api/regions') {
    return RATE_LIMIT_CONFIGS.prediction
  }

  // Weather/GDD endpoints
  if (path.startsWith('/api/weather/')) {
    return RATE_LIMIT_CONFIGS.prediction
  }

  // Default to global
  return RATE_LIMIT_CONFIGS.global
}

/**
 * Extract identifier from request for rate limiting
 * Prioritizes: userId > deviceId > IP address
 */
export function getIdentifier(
  headers: Headers,
  searchParams?: URLSearchParams
): string {
  // Check for user ID in header or query
  const userId = headers.get('x-user-id') || searchParams?.get('userId')
  if (userId) return `user:${userId}`

  // Check for device ID
  const deviceId = headers.get('x-device-id') || searchParams?.get('deviceId')
  if (deviceId) return `device:${deviceId}`

  // Fall back to IP address
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim()
    return `ip:${ip}`
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) return `ip:${realIp}`

  // Fallback to generic identifier
  return 'ip:unknown'
}

// =============================================================================
// LOGGING
// =============================================================================

interface RateLimitEvent {
  timestamp: string
  identifier: string
  path: string
  allowed: boolean
  remaining: number
  config: string
  retryAfter?: number
}

// Recent rate limit events for monitoring
const rateLimitEvents: RateLimitEvent[] = []
const MAX_EVENTS = 1000

/**
 * Log a rate limit event
 */
export function logRateLimitEvent(
  identifier: string,
  path: string,
  result: RateLimitResult,
  config: RateLimitConfig
): void {
  const event: RateLimitEvent = {
    timestamp: new Date().toISOString(),
    identifier,
    path,
    allowed: result.allowed,
    remaining: result.remaining,
    config: config.keyPrefix || 'global',
    retryAfter: result.retryAfter,
  }

  rateLimitEvents.push(event)

  // Keep only recent events
  if (rateLimitEvents.length > MAX_EVENTS) {
    rateLimitEvents.shift()
  }

  // Log blocked requests to console
  if (!result.allowed) {
    console.warn(`[Rate Limit] Blocked: ${identifier} on ${path} - retry after ${result.retryAfter}s`)
  }
}

/**
 * Get recent rate limit events (for monitoring)
 */
export function getRateLimitEvents(limit: number = 100): RateLimitEvent[] {
  return rateLimitEvents.slice(-limit)
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalEvents: number
  blockedCount: number
  blockedPercentage: number
  topBlockedIdentifiers: Array<{ identifier: string; count: number }>
} {
  const blocked = rateLimitEvents.filter(e => !e.allowed)
  const identifierCounts = new Map<string, number>()

  for (const event of blocked) {
    const count = identifierCounts.get(event.identifier) || 0
    identifierCounts.set(event.identifier, count + 1)
  }

  const topBlocked = Array.from(identifierCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([identifier, count]) => ({ identifier, count }))

  return {
    totalEvents: rateLimitEvents.length,
    blockedCount: blocked.length,
    blockedPercentage: rateLimitEvents.length > 0
      ? (blocked.length / rateLimitEvents.length) * 100
      : 0,
    topBlockedIdentifiers: topBlocked,
  }
}

// Start cleanup on module load
if (typeof window === 'undefined') {
  startCleanup()
}
