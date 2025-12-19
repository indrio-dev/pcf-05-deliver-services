/**
 * Rate Limiting Tests
 *
 * F029: Tests for API rate limiting functionality.
 */

import {
  checkRateLimit,
  getRateLimitConfig,
  getIdentifier,
  clearRateLimitStore,
  RATE_LIMIT_CONFIGS,
  logRateLimitEvent,
  getRateLimitEvents,
  getRateLimitStats,
  stopCleanup,
} from '@/lib/rate-limit'

describe('Rate Limit Module', () => {
  beforeEach(() => {
    clearRateLimitStore()
  })

  afterAll(() => {
    stopCleanup()
  })

  describe('checkRateLimit', () => {
    it('allows requests under the limit', () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      const result1 = checkRateLimit('test-user', config)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = checkRateLimit('test-user', config)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('blocks requests over the limit', () => {
      const config = { windowMs: 60000, maxRequests: 3 }

      // Use up all requests
      checkRateLimit('test-user', config)
      checkRateLimit('test-user', config)
      checkRateLimit('test-user', config)

      // This one should be blocked
      const result = checkRateLimit('test-user', config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('separates limits by identifier', () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      // Use up requests for user1
      checkRateLimit('user1', config)
      checkRateLimit('user1', config)

      // user1 should be blocked
      expect(checkRateLimit('user1', config).allowed).toBe(false)

      // user2 should still be allowed
      expect(checkRateLimit('user2', config).allowed).toBe(true)
    })

    it('uses key prefix when provided', () => {
      const config1 = { windowMs: 60000, maxRequests: 2, keyPrefix: 'consumer' }
      const config2 = { windowMs: 60000, maxRequests: 2, keyPrefix: 'admin' }

      // Use up consumer quota
      checkRateLimit('user1', config1)
      checkRateLimit('user1', config1)

      // Consumer blocked
      expect(checkRateLimit('user1', config1).allowed).toBe(false)

      // Admin still works (different prefix)
      expect(checkRateLimit('user1', config2).allowed).toBe(true)
    })

    it('resets after window expires', () => {
      const config = { windowMs: 100, maxRequests: 2 } // 100ms window

      checkRateLimit('test-user', config)
      checkRateLimit('test-user', config)
      expect(checkRateLimit('test-user', config).allowed).toBe(false)

      // Wait for window to expire
      return new Promise<void>(resolve => {
        setTimeout(() => {
          const result = checkRateLimit('test-user', config)
          expect(result.allowed).toBe(true)
          expect(result.remaining).toBe(1)
          resolve()
        }, 150)
      })
    })

    it('returns reset timestamp', () => {
      const config = { windowMs: 60000, maxRequests: 5 }
      const before = Date.now()

      const result = checkRateLimit('test-user', config)

      expect(result.resetAt).toBeGreaterThanOrEqual(before + config.windowMs)
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + config.windowMs + 100)
    })
  })

  describe('getRateLimitConfig', () => {
    it('returns consumer config for /api/scans', () => {
      const config = getRateLimitConfig('/api/scans')
      expect(config).toBe(RATE_LIMIT_CONFIGS.consumer)
    })

    it('returns admin config for /api/admin/* paths', () => {
      expect(getRateLimitConfig('/api/admin/exceptions')).toBe(RATE_LIMIT_CONFIGS.admin)
      expect(getRateLimitConfig('/api/admin/accuracy')).toBe(RATE_LIMIT_CONFIGS.admin)
      expect(getRateLimitConfig('/api/admin/models')).toBe(RATE_LIMIT_CONFIGS.admin)
    })

    it('returns prediction config for /api/predict', () => {
      const config = getRateLimitConfig('/api/predict')
      expect(config).toBe(RATE_LIMIT_CONFIGS.prediction)
    })

    it('returns prediction config for /api/discover', () => {
      const config = getRateLimitConfig('/api/discover')
      expect(config).toBe(RATE_LIMIT_CONFIGS.prediction)
    })

    it('returns prediction config for weather endpoints', () => {
      const config = getRateLimitConfig('/api/weather/gdd')
      expect(config).toBe(RATE_LIMIT_CONFIGS.prediction)
    })

    it('returns global config for unknown paths', () => {
      const config = getRateLimitConfig('/api/unknown')
      expect(config).toBe(RATE_LIMIT_CONFIGS.global)
    })
  })

  describe('getIdentifier', () => {
    it('uses userId from header if available', () => {
      const headers = new Headers()
      headers.set('x-user-id', 'user123')

      const identifier = getIdentifier(headers)
      expect(identifier).toBe('user:user123')
    })

    it('uses userId from query if no header', () => {
      const headers = new Headers()
      const params = new URLSearchParams()
      params.set('userId', 'user456')

      const identifier = getIdentifier(headers, params)
      expect(identifier).toBe('user:user456')
    })

    it('uses deviceId if no userId', () => {
      const headers = new Headers()
      headers.set('x-device-id', 'device789')

      const identifier = getIdentifier(headers)
      expect(identifier).toBe('device:device789')
    })

    it('uses x-forwarded-for IP if no user/device', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1')

      const identifier = getIdentifier(headers)
      expect(identifier).toBe('ip:192.168.1.1')
    })

    it('uses x-real-ip as fallback', () => {
      const headers = new Headers()
      headers.set('x-real-ip', '10.0.0.2')

      const identifier = getIdentifier(headers)
      expect(identifier).toBe('ip:10.0.0.2')
    })

    it('returns unknown if no identifiers available', () => {
      const headers = new Headers()
      const identifier = getIdentifier(headers)
      expect(identifier).toBe('ip:unknown')
    })

    it('prioritizes userId over deviceId', () => {
      const headers = new Headers()
      headers.set('x-user-id', 'user123')
      headers.set('x-device-id', 'device789')

      const identifier = getIdentifier(headers)
      expect(identifier).toBe('user:user123')
    })

    it('prioritizes deviceId over IP', () => {
      const headers = new Headers()
      headers.set('x-device-id', 'device789')
      headers.set('x-forwarded-for', '192.168.1.1')

      const identifier = getIdentifier(headers)
      expect(identifier).toBe('device:device789')
    })
  })

  describe('RATE_LIMIT_CONFIGS', () => {
    it('has consumer config with appropriate limits', () => {
      expect(RATE_LIMIT_CONFIGS.consumer.maxRequests).toBe(30)
      expect(RATE_LIMIT_CONFIGS.consumer.windowMs).toBe(60000)
    })

    it('has prediction config with higher limits', () => {
      expect(RATE_LIMIT_CONFIGS.prediction.maxRequests).toBe(60)
    })

    it('has admin config with highest limits', () => {
      expect(RATE_LIMIT_CONFIGS.admin.maxRequests).toBe(120)
    })

    it('has strict config with lowest limits', () => {
      expect(RATE_LIMIT_CONFIGS.strict.maxRequests).toBe(10)
    })

    it('has global config as default', () => {
      expect(RATE_LIMIT_CONFIGS.global.maxRequests).toBe(100)
    })
  })

  describe('Logging', () => {
    beforeEach(() => {
      clearRateLimitStore()
    })

    it('logs rate limit events', () => {
      const config = { windowMs: 60000, maxRequests: 5, keyPrefix: 'test' }
      const result = checkRateLimit('test-user', config)

      logRateLimitEvent('test-user', '/api/test', result, config)

      const events = getRateLimitEvents(10)
      expect(events.length).toBeGreaterThan(0)

      const lastEvent = events[events.length - 1]
      expect(lastEvent.identifier).toBe('test-user')
      expect(lastEvent.path).toBe('/api/test')
      expect(lastEvent.allowed).toBe(true)
      expect(lastEvent.config).toBe('test')
    })

    it('tracks blocked requests', () => {
      const config = { windowMs: 60000, maxRequests: 1, keyPrefix: 'block-test' }

      // First request - allowed
      const result1 = checkRateLimit('block-user', config)
      logRateLimitEvent('block-user', '/api/test', result1, config)

      // Second request - blocked
      const result2 = checkRateLimit('block-user', config)
      logRateLimitEvent('block-user', '/api/test', result2, config)

      const events = getRateLimitEvents(10)
      const blockedEvent = events.find(e => !e.allowed && e.identifier === 'block-user')

      expect(blockedEvent).toBeDefined()
      expect(blockedEvent?.retryAfter).toBeGreaterThan(0)
    })

    it('provides statistics', () => {
      const config = { windowMs: 60000, maxRequests: 1, keyPrefix: 'stats-test' }

      // Generate some events
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(`user-${i}`, config)
        logRateLimitEvent(`user-${i}`, '/api/test', result, config)

        // Second request for each user will be blocked
        const result2 = checkRateLimit(`user-${i}`, config)
        logRateLimitEvent(`user-${i}`, '/api/test', result2, config)
      }

      const stats = getRateLimitStats()
      expect(stats.totalEvents).toBeGreaterThan(0)
      expect(stats.blockedCount).toBeGreaterThan(0)
      expect(stats.blockedPercentage).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid consecutive requests', () => {
      const config = { windowMs: 60000, maxRequests: 100 }

      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit('rapid-user', config)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(99 - i)
      }

      // 101st should be blocked
      const blocked = checkRateLimit('rapid-user', config)
      expect(blocked.allowed).toBe(false)
    })

    it('handles many different identifiers', () => {
      const config = { windowMs: 60000, maxRequests: 5 }

      // Create many different users
      for (let i = 0; i < 50; i++) {
        const result = checkRateLimit(`user-${i}`, config)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4)
      }
    })

    it('handles empty identifier', () => {
      const config = { windowMs: 60000, maxRequests: 5 }
      const result = checkRateLimit('', config)
      expect(result.allowed).toBe(true)
    })

    it('returns correct retryAfter seconds', () => {
      const config = { windowMs: 30000, maxRequests: 1 } // 30 second window

      checkRateLimit('retry-test', config)
      const blocked = checkRateLimit('retry-test', config)

      expect(blocked.allowed).toBe(false)
      expect(blocked.retryAfter).toBeGreaterThan(0)
      expect(blocked.retryAfter).toBeLessThanOrEqual(30)
    })
  })
})
