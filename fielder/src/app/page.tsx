'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductGridCard } from '@/components/ProductGridCard'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import { FilterSidebar } from '@/components/FilterSidebar'
import { useGeolocation, DEFAULT_LOCATION } from '@/lib/hooks/useGeolocation'
import { useFilters } from '@/lib/hooks/useFilters'

interface DiscoveryItem {
  id: string
  varietyId: string
  productId: string
  regionId: string
  status: 'at_peak' | 'in_season' | 'approaching' | 'off_season'
  distanceMiles: number
  category: string
  subcategory: string
  qualityTier: string | null
  productDisplayName: string
  varietyDisplayName: string
  regionDisplayName: string
  regionSlug: string
  state: string
}

interface DiscoveryData {
  atPeak: DiscoveryItem[]
  inSeason: DiscoveryItem[]
  approaching: DiscoveryItem[]
  offSeason: DiscoveryItem[]
  totalResults: number
  categoryCounts: Record<string, number>
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const { location, requestLocation } = useGeolocation(true)
  const filterState = useFilters()
  const [data, setData] = useState<DiscoveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [manualLocation, setManualLocation] = useState<{ lat: number; lon: number; name: string } | null>(null)
  const [locationName, setLocationName] = useState<string>('')
  const [zipInput, setZipInput] = useState('')
  const [zipError, setZipError] = useState<string | null>(null)
  const [lookingUpZip, setLookingUpZip] = useState(false)
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false)
  const hasUserLocation = manualLocation !== null || location !== null

  // Handle URL params for lat/lon
  useEffect(() => {
    if (urlParamsProcessed) return
    const urlLat = searchParams.get('lat')
    const urlLon = searchParams.get('lon')
    if (urlLat && urlLon) {
      const lat = parseFloat(urlLat)
      const lon = parseFloat(urlLon)
      if (!isNaN(lat) && !isNaN(lon)) {
        setManualLocation({ lat, lon, name: `${lat.toFixed(2)}, ${lon.toFixed(2)}` })
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          .then(res => res.json())
          .then(data => {
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county
            const state = data.address?.state
            if (city && state) {
              setManualLocation(prev => prev ? { ...prev, name: `${city}, ${state}` } : prev)
            }
          })
          .catch(() => {})
      }
    }
    setUrlParamsProcessed(true)
  }, [searchParams, urlParamsProcessed])

  useEffect(() => {
    if (location && !manualLocation) {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=json`)
        .then(res => res.json())
        .then(data => {
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county
          const state = data.address?.state
          if (city && state) setLocationName(`${city}, ${state}`)
        })
        .catch(() => {})
    }
  }, [location?.lat, location?.lon, manualLocation])

  const activeLocation = useMemo(() => {
    if (manualLocation) return manualLocation
    if (location) return { ...location, name: locationName || 'Your Location' }
    return null
  }, [location?.lat, location?.lon, manualLocation, locationName])

  const apiLocation = activeLocation || { lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon, name: DEFAULT_LOCATION.name }

  const handleZipLookup = useCallback(async () => {
    if (!zipInput || zipInput.length < 5) {
      setZipError('Enter a valid 5-digit ZIP')
      return
    }
    setLookingUpZip(true)
    setZipError(null)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${zipInput}&country=US&format=json&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        setManualLocation({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          name: data[0].display_name.split(',').slice(0, 2).join(',').trim()
        })
        setShowLocationPicker(false)
        setZipInput('')
      } else {
        setZipError('ZIP not found')
      }
    } catch {
      setZipError('Lookup failed')
    } finally {
      setLookingUpZip(false)
    }
  }, [zipInput])

  const handleUseDeviceLocation = useCallback(() => {
    setManualLocation(null)
    setLocationName(DEFAULT_LOCATION.name)
    requestLocation()
    setShowLocationPicker(false)
  }, [requestLocation])

  // Fetch data
  useEffect(() => {
    setLoading(true)
    setError(null)
    const queryString = filterState.buildQueryString(apiLocation.lat, apiLocation.lon)
    fetch(`/api/discover?${queryString}`)
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          setError(result.error)
        } else {
          setData(result)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load data')
        setLoading(false)
      })
  }, [apiLocation.lat, apiLocation.lon, filterState.buildQueryString])

  // Combine all items into one sorted list
  const allItems = useMemo(() => {
    if (!data) return []
    const statusOrder = { at_peak: 0, in_season: 1, approaching: 2, off_season: 3 }
    const combined = [
      ...data.atPeak,
      ...data.inSeason,
      ...data.approaching,
      ...(filterState.filters.status.includes('off_season') ? data.offSeason : []),
    ]
    return combined.sort((a, b) => {
      // Sort by status first, then by distance
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return (a.distanceMiles || 0) - (b.distanceMiles || 0)
    })
  }, [data, filterState.filters.status])

  return (
    <div className="journal-page">
      <JournalHeader />

      {/* Location Bar */}
      <div style={{
        borderBottom: '1px solid var(--color-rule)',
        padding: 'var(--space-sm) 0',
        background: 'var(--color-manila)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              style={{
                background: 'none',
                border: 'none',
                font: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: 0,
              }}
            >
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.8125rem',
                textDecoration: 'underline',
                textDecorationStyle: 'dashed',
                textUnderlineOffset: '3px',
              }}>
                {activeLocation ? activeLocation.name : 'Set location'}
              </span>
            </button>

            {/* Location Picker Dropdown */}
            {showLocationPicker && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setShowLocationPicker(false)}
                />
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: 'var(--space-xs)',
                  zIndex: 50,
                  width: '16rem',
                  background: 'var(--color-manila)',
                  padding: 'var(--space-md)',
                  border: '1px solid var(--color-rule)',
                  boxShadow: '2px 2px 0 var(--color-rule)',
                }}>
                  <div style={{ marginBottom: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <input
                        type="text"
                        value={zipInput}
                        onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="ZIP code"
                        style={{
                          flex: 1,
                          border: '1px solid var(--color-rule)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          background: 'var(--color-manila)',
                          fontFamily: 'var(--font-typewriter)',
                          fontSize: '0.8125rem',
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleZipLookup()}
                      />
                      <button
                        onClick={handleZipLookup}
                        disabled={lookingUpZip}
                        style={{
                          background: 'var(--color-ink)',
                          color: 'var(--color-manila)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          border: 'none',
                          fontFamily: 'var(--font-typewriter)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          cursor: lookingUpZip ? 'wait' : 'pointer',
                        }}
                      >
                        Go
                      </button>
                    </div>
                    {zipError && (
                      <p style={{ marginTop: 'var(--space-xs)', fontSize: '0.75rem', color: 'var(--color-approaching)' }}>
                        {zipError}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleUseDeviceLocation}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 0,
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-typewriter)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Use my location
                  </button>
                </div>
              </>
            )}
          </div>

          <span style={{
            fontFamily: 'var(--font-typewriter)',
            fontSize: '0.75rem',
            color: 'var(--color-ink-muted)',
          }}>
            {data ? `${allItems.length} products` : ''}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main style={{
        display: 'flex',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--space-lg)',
        gap: 'var(--space-lg)',
        minHeight: 'calc(100vh - 200px)',
      }}>
        {/* Filter Sidebar */}
        <FilterSidebar filterState={filterState} categoryCounts={data?.categoryCounts || {}} />

        {/* Product Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-3xl)',
              fontFamily: 'var(--font-typewriter)',
              color: 'var(--color-ink-muted)',
            }}>
              Loading...
            </div>
          )}

          {error && (
            <div style={{
              padding: 'var(--space-xl)',
              textAlign: 'center',
              fontFamily: 'var(--font-typewriter)',
              color: 'var(--color-ink-muted)',
            }}>
              {error}
            </div>
          )}

          {!loading && !error && allItems.length === 0 && (
            <div style={{
              padding: 'var(--space-xl)',
              textAlign: 'center',
              fontFamily: 'var(--font-typewriter)',
            }}>
              <p style={{ color: 'var(--color-ink-muted)', marginBottom: 'var(--space-md)' }}>
                No products found. Try adjusting your filters.
              </p>
              <button
                onClick={() => filterState.resetFilters()}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-typewriter)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Reset filters
              </button>
            </div>
          )}

          {!loading && !error && allItems.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-md)',
            }}>
              {allItems.map((item) => (
                <ProductGridCard
                  key={item.id}
                  title={item.varietyDisplayName}
                  productType={item.productDisplayName}
                  region={item.regionDisplayName}
                  state={item.state}
                  status={item.status}
                  href={`/product/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                  distance={hasUserLocation ? item.distanceMiles : undefined}
                  qualityTier={item.qualityTier || undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <JournalFooter />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="journal-page">
        <JournalHeader />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-3xl)',
          fontFamily: 'var(--font-typewriter)',
          color: 'var(--color-ink-muted)',
        }}>
          Loading...
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
