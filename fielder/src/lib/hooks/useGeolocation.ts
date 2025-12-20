'use client'

import { useState, useCallback, useEffect } from 'react'

interface GeolocationState {
  location: { lat: number; lon: number } | null
  error: string | null
  loading: boolean
}

interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => void
  clearError: () => void
}

/**
 * Hook for browser geolocation with graceful error handling
 */
export function useGeolocation(autoRequest = true): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: autoRequest,
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          error: null,
          loading: false,
        })
      },
      (error) => {
        let errorMessage = 'Unable to get your location'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }

        setState({
          location: null,
          error: errorMessage,
          loading: false,
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Auto-request on mount if enabled
  useEffect(() => {
    if (autoRequest) {
      requestLocation()
    }
  }, [autoRequest, requestLocation])

  return {
    ...state,
    requestLocation,
    clearError,
  }
}

/**
 * Default coordinates for fallback (Orlando, FL - central to produce regions)
 */
export const DEFAULT_LOCATION = {
  lat: 28.5383,
  lon: -81.3792,
  name: 'Orlando, FL',
}

/**
 * Major US cities for manual selection fallback
 */
export const FALLBACK_CITIES = [
  { name: 'Orlando, FL', lat: 28.5383, lon: -81.3792 },
  { name: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
  { name: 'Atlanta, GA', lat: 33.749, lon: -84.388 },
  { name: 'Houston, TX', lat: 29.7604, lon: -95.3698 },
  { name: 'Dallas, TX', lat: 32.7767, lon: -96.797 },
  { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
  { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Portland, OR', lat: 45.5152, lon: -122.6784 },
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
  { name: 'Detroit, MI', lat: 42.3314, lon: -83.0458 },
  { name: 'New York, NY', lat: 40.7128, lon: -74.006 },
  { name: 'Philadelphia, PA', lat: 39.9526, lon: -75.1652 },
  { name: 'Boston, MA', lat: 42.3601, lon: -71.0589 },
]
