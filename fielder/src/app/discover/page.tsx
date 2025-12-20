'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NoteCard, NoteCardCompact } from '@/components/NoteCard'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import { useGeolocation, DEFAULT_LOCATION } from '@/lib/hooks/useGeolocation'
import { useFilters } from '@/lib/hooks/useFilters'
import { FilterSidebar } from '@/components/FilterSidebar'

interface DiscoveryItem {
  id: string
  offeringId: string
  varietyId: string
  productId: string
  regionId: string
  status: 'at_peak' | 'in_season' | 'approaching' | 'off_season'
  statusMessage: string | null
  harvestStart: string | null
  harvestEnd: string | null
  optimalStart: string | null
  optimalEnd: string | null
  daysUntilStart: number | null
  confidence: number
  distanceMiles: number
  category: string
  subcategory: string
  modelType: string
  qualityTier: string | null
  brix: number | null
  acidity: number | null
  brixAcidRatio: number | null
  isHeritage: boolean
  isNonGmo: boolean
  productDisplayName: string
  varietyDisplayName: string
  regionDisplayName: string
  regionSlug: string
  state: string
  flavorProfile: string | null
  flavorNotes: string | null
  regionLat: number
  regionLon: number
}

interface DiscoveryData {
  atPeak: DiscoveryItem[]
  inSeason: DiscoveryItem[]
  approaching: DiscoveryItem[]
  offSeason: DiscoveryItem[]
  totalResults: number
  categoryCounts: Record<string, number>
  source: string
  timestamp: string
}

function DiscoverPageContent() {
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
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)
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
          if (city && state) {
            setLocationName(`${city}, ${state}`)
          }
        })
        .catch(() => {})
    }
  }, [location?.lat, location?.lon, manualLocation])

  const activeLocation = useMemo(() => {
    if (manualLocation) return manualLocation
    if (location) return { ...location, name: locationName || 'Your Location' }
    return null
  }, [location?.lat, location?.lon, manualLocation, locationName])

  const apiLocation = activeLocation || { lat: 39.8283, lon: -98.5795, name: 'United States' }

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

  useEffect(() => {
    if (!hasLoadedInitial) {
      setHasLoadedInitial(true)
    }
  }, [hasLoadedInitial])

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
          if (!hasUserLocation) {
            const sortAlpha = (items: DiscoveryItem[]) =>
              [...items].sort((a, b) => a.varietyDisplayName.localeCompare(b.varietyDisplayName))
            setData({
              ...result,
              atPeak: sortAlpha(result.atPeak),
              inSeason: sortAlpha(result.inSeason),
              approaching: sortAlpha(result.approaching),
              offSeason: sortAlpha(result.offSeason),
            })
          } else {
            setData(result)
          }
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load data')
        setLoading(false)
      })
  }, [apiLocation.lat, apiLocation.lon, filterState.buildQueryString, hasUserLocation])

  return (
    <div className="journal-page">
      <JournalHeader />

      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--color-rule)', padding: 'var(--space-2xl) 0' }}>
        <div className="journal-container">
          <p className="journal-meta" style={{ marginBottom: 'var(--space-sm)' }}>
            Field Notes
          </p>
          <h1 style={{ marginBottom: 'var(--space-md)' }}>
            Discover Fresh Produce
          </h1>

          {/* Location */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
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
                textDecoration: 'underline',
                textDecorationStyle: 'dashed',
                textUnderlineOffset: '4px',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: '0.05em',
              }}>
                {activeLocation ? activeLocation.name : 'Set your location'}
              </span>
            </button>

            {/* Location Picker */}
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
                  marginTop: 'var(--space-sm)',
                  zIndex: 50,
                  width: '18rem',
                  background: 'var(--color-manila)',
                  padding: 'var(--space-md)',
                  border: '1px solid var(--color-rule)',
                }}>
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <input
                        type="text"
                        value={zipInput}
                        onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="ZIP code"
                        style={{
                          flex: 1,
                          border: '1px solid var(--color-rule)',
                          padding: 'var(--space-sm) var(--space-md)',
                          background: 'var(--color-manila)',
                          font: 'inherit',
                          fontSize: '0.875rem',
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleZipLookup()}
                      />
                      <button
                        onClick={handleZipLookup}
                        disabled={lookingUpZip}
                        style={{
                          background: 'var(--color-ink)',
                          color: 'var(--color-manila)',
                          padding: 'var(--space-sm) var(--space-md)',
                          border: 'none',
                          font: 'inherit',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
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
                      padding: 'var(--space-sm) 0',
                      background: 'none',
                      border: 'none',
                      font: 'inherit',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Use my current location
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-xl) var(--space-lg)' }}>
        {/* Filter Sidebar */}
        <FilterSidebar filterState={filterState} categoryCounts={data?.categoryCounts || {}} />

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 'var(--journal-max-width)', marginLeft: 'var(--space-xl)' }}>
          {/* Loading */}
          {loading && (
            <div className="journal-loading">Loading field notes...</div>
          )}

          {/* Error */}
          {error && (
            <div className="journal-empty">
              <p>{error}</p>
            </div>
          )}

          {/* Results */}
          {data && !loading && (
            <>
              {/* At Peak */}
              {data.atPeak.length > 0 && (
                <section>
                  <div className="journal-section-header">
                    At Peak Now ({data.atPeak.length})
                  </div>
                  <div>
                    {data.atPeak.map((item) => (
                      <NoteCard
                        key={item.id}
                        id={item.id}
                        title={item.varietyDisplayName}
                        category={item.category}
                        subcategory={item.subcategory}
                        region={item.regionDisplayName}
                        state={item.state}
                        status={item.status}
                        statusMessage={item.statusMessage || undefined}
                        href={`/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                        distance={hasUserLocation ? item.distanceMiles : undefined}
                        qualityTier={item.qualityTier || undefined}
                        flavorProfile={item.flavorProfile || undefined}
                        flavorNotes={item.flavorNotes}
                        productType={item.productDisplayName}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* In Season */}
              {data.inSeason.length > 0 && (
                <section style={{ marginTop: 'var(--space-2xl)' }}>
                  <div className="journal-section-header">
                    In Season ({data.inSeason.length})
                  </div>
                  <div>
                    {data.inSeason.map((item) => (
                      <NoteCard
                        key={item.id}
                        id={item.id}
                        title={item.varietyDisplayName}
                        category={item.category}
                        subcategory={item.subcategory}
                        region={item.regionDisplayName}
                        state={item.state}
                        status={item.status}
                        statusMessage={item.statusMessage || undefined}
                        href={`/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                        distance={hasUserLocation ? item.distanceMiles : undefined}
                        qualityTier={item.qualityTier || undefined}
                        flavorProfile={item.flavorProfile || undefined}
                        flavorNotes={item.flavorNotes}
                        productType={item.productDisplayName}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Approaching */}
              {data.approaching.length > 0 && (
                <section style={{ marginTop: 'var(--space-2xl)' }}>
                  <div className="journal-section-header">
                    Coming Soon ({data.approaching.length})
                  </div>
                  <div>
                    {data.approaching.map((item) => (
                      <NoteCardCompact
                        key={item.id}
                        title={item.varietyDisplayName}
                        category={item.category}
                        region={item.regionDisplayName}
                        state={item.state}
                        status={item.status}
                        href={`/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                        distance={hasUserLocation ? item.distanceMiles : undefined}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Off Season */}
              {data.offSeason.length > 0 && filterState.filters.status.includes('off_season') && (
                <section style={{ marginTop: 'var(--space-2xl)' }}>
                  <div className="journal-section-header" style={{ color: 'var(--color-ink-muted)' }}>
                    Off Season ({data.offSeason.length})
                  </div>
                  <div style={{ opacity: 0.6 }}>
                    {data.offSeason.map((item) => (
                      <NoteCardCompact
                        key={item.id}
                        title={item.varietyDisplayName}
                        category={item.category}
                        region={item.regionDisplayName}
                        state={item.state}
                        status={item.status}
                        href={`/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                        distance={hasUserLocation ? item.distanceMiles : undefined}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty */}
              {data.totalResults === 0 && (
                <div className="journal-empty">
                  <p>No results found. Try adjusting your filters.</p>
                  <button
                    onClick={() => filterState.resetFilters()}
                    style={{
                      marginTop: 'var(--space-md)',
                      background: 'none',
                      border: 'none',
                      font: 'inherit',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <JournalFooter />
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="journal-page">
        <JournalHeader />
        <div className="journal-loading" style={{ padding: 'var(--space-3xl)' }}>
          Loading field notes...
        </div>
      </div>
    }>
      <DiscoverPageContent />
    </Suspense>
  )
}
