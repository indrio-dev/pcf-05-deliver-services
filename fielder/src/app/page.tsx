'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { NoteCard, NoteCardCompact } from '@/components/NoteCard'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import { useGeolocation, DEFAULT_LOCATION } from '@/lib/hooks/useGeolocation'

interface DiscoveryItem {
  id: string
  offeringId: string
  varietyId: string
  productId: string
  regionId: string
  status: 'at_peak' | 'in_season' | 'approaching' | 'off_season'
  statusMessage: string
  harvestStart?: string | null
  harvestEnd?: string | null
  optimalStart?: string | null
  optimalEnd?: string | null
  daysUntilStart?: number | null
  confidence: number
  distanceMiles: number
  category: string
  subcategory: string
  modelType: string
  qualityTier?: string
  productDisplayName: string
  varietyDisplayName: string
  regionDisplayName: string
  regionSlug: string
  state: string
  flavorProfile?: string
  flavorNotes?: string | null
  seasons: string[]
}

interface DiscoveryResponse {
  atPeak: DiscoveryItem[]
  inSeason: DiscoveryItem[]
  approaching: DiscoveryItem[]
  offSeason: DiscoveryItem[]
  totalResults: number
  categoryCounts: Record<string, number>
  seasonCounts: Record<string, number>
  currentSeason: string
  source: string
  timestamp: string
}

const SEASON_NOTES: Record<string, string> = {
  winter: "Cold nights concentrate sugars in the groves. Citrus is at its sweetest.",
  spring: "Early berries and tender greens emerge as the earth warms.",
  summer: "Stone fruits at their sun-ripened peak. Peaches, cherries, melons.",
  fall: "Harvest brings apples from the orchard and the year's final bounty.",
}

export default function Home() {
  const { location: geoLocation, requestLocation } = useGeolocation(true)
  const [atPeak, setAtPeak] = useState<DiscoveryItem[]>([])
  const [inSeason, setInSeason] = useState<DiscoveryItem[]>([])
  const [approaching, setApproaching] = useState<DiscoveryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSeason, setCurrentSeason] = useState<string>('winter')
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION.name)
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [zipCode, setZipCode] = useState('')
  const [zipError, setZipError] = useState<string | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [manualLocation, setManualLocation] = useState<{ lat: number; lon: number; name: string } | null>(null)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)

  const fetchDiscoveryData = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        status: 'at_peak,in_season,approaching',
      })

      const response = await fetch(`/api/discover?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: DiscoveryResponse = await response.json()
      setAtPeak(data.atPeak || [])
      setInSeason(data.inSeason || [])
      setApproaching(data.approaching || [])
      setCurrentSeason(data.currentSeason || 'winter')
    } catch {
      setError('Unable to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedInitial) {
      setHasLoadedInitial(true)
      fetchDiscoveryData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon)
    }
  }, [hasLoadedInitial, fetchDiscoveryData])

  useEffect(() => {
    if (manualLocation) {
      fetchDiscoveryData(manualLocation.lat, manualLocation.lon)
      setLocationName(manualLocation.name)
    }
  }, [manualLocation, fetchDiscoveryData])

  useEffect(() => {
    if (geoLocation && !manualLocation) {
      fetchDiscoveryData(geoLocation.lat, geoLocation.lon)
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${geoLocation.lat}&lon=${geoLocation.lon}&format=json`)
        .then(res => res.json())
        .then(data => {
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county
          const state = data.address?.state
          if (city && state) {
            const stateAbbr = STATE_ABBREVS[state] || state
            setLocationName(`${city}, ${stateAbbr}`)
          }
        })
        .catch(() => {})
    }
  }, [geoLocation, manualLocation, fetchDiscoveryData])

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!zipCode.trim()) return

    setZipError(null)
    setZipLoading(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}&country=US&format=json&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)
        const parts = result.display_name.split(', ')
        const cityName = parts[1] && parts[3] ? `${parts[1]}, ${STATE_ABBREVS[parts[3]] || parts[3]}` : `Zip ${zipCode}`

        setManualLocation({ lat, lon, name: cityName })
        setShowLocationInput(false)
        setZipCode('')
      } else {
        setZipError('Zip code not found')
      }
    } catch {
      setZipError('Unable to look up zip code')
    } finally {
      setZipLoading(false)
    }
  }

  const handleUseMyLocation = () => {
    requestLocation()
    setShowLocationInput(false)
  }

  return (
    <div className="journal-page">
      <JournalHeader />

      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--color-rule)', padding: 'var(--space-2xl) 0' }}>
        <div className="journal-container">
          <p className="journal-meta" style={{ marginBottom: 'var(--space-sm)' }}>
            {currentSeason} Notes
          </p>
          <h1 style={{ marginBottom: 'var(--space-md)' }}>
            Fresh Near{' '}
            <button
              onClick={() => setShowLocationInput(!showLocationInput)}
              style={{
                background: 'none',
                border: 'none',
                font: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationStyle: 'dashed',
                textUnderlineOffset: '4px',
                padding: 0,
              }}
            >
              {locationName}
            </button>
          </h1>
          <p className="journal-description" style={{ maxWidth: '32rem' }}>
            {SEASON_NOTES[currentSeason] || SEASON_NOTES.winter}
          </p>

          {/* Location Input */}
          {showLocationInput && (
            <div style={{ marginTop: 'var(--space-lg)', maxWidth: '20rem' }}>
              <form onSubmit={handleZipSubmit}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem' }}>
                  Enter zip code:
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="e.g., 32789"
                    style={{
                      flex: 1,
                      padding: 'var(--space-sm) var(--space-md)',
                      border: '1px solid var(--color-rule)',
                      background: 'var(--color-manila)',
                      font: 'inherit',
                      fontSize: '1rem',
                    }}
                    maxLength={5}
                    inputMode="numeric"
                  />
                  <button
                    type="submit"
                    disabled={zipCode.length !== 5 || zipLoading}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      border: '1px solid var(--color-ink)',
                      background: 'var(--color-ink)',
                      color: 'var(--color-manila)',
                      font: 'inherit',
                      fontSize: '0.875rem',
                      cursor: zipCode.length === 5 && !zipLoading ? 'pointer' : 'not-allowed',
                      opacity: zipCode.length === 5 && !zipLoading ? 1 : 0.5,
                    }}
                  >
                    {zipLoading ? '...' : 'Go'}
                  </button>
                </div>
                {zipError && (
                  <p style={{ marginTop: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-approaching)' }}>
                    {zipError}
                  </p>
                )}
              </form>
              <button
                onClick={handleUseMyLocation}
                style={{
                  marginTop: 'var(--space-sm)',
                  background: 'none',
                  border: 'none',
                  font: 'inherit',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Use my current location
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="journal-container" style={{ padding: 'var(--space-2xl) var(--space-lg)' }}>
        {loading ? (
          <div className="journal-loading">Loading field notes...</div>
        ) : error ? (
          <div className="journal-empty">
            <p>{error}</p>
            <button
              onClick={() => fetchDiscoveryData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon)}
              style={{
                marginTop: 'var(--space-md)',
                background: 'none',
                border: 'none',
                font: 'inherit',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* At Peak */}
            {atPeak.length > 0 && (
              <section>
                <div className="journal-section-header">
                  At Peak Now
                  {atPeak.length > 6 && (
                    <Link
                      href="/discover?status=at_peak"
                      style={{ float: 'right', textTransform: 'none', letterSpacing: 'normal' }}
                    >
                      View all ({atPeak.length})
                    </Link>
                  )}
                </div>
                <div>
                  {atPeak.slice(0, 6).map((item) => (
                    <NoteCard
                      key={item.id}
                      id={item.id}
                      title={item.varietyDisplayName}
                      category={item.category}
                      subcategory={item.subcategory}
                      region={item.regionDisplayName}
                      state={item.state}
                      status={item.status}
                      statusMessage={item.statusMessage}
                      href={`/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                      distance={item.distanceMiles}
                      qualityTier={item.qualityTier}
                      flavorProfile={item.flavorProfile}
                      flavorNotes={item.flavorNotes}
                      productType={item.productDisplayName}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* In Season */}
            {inSeason.length > 0 && (
              <section style={{ marginTop: 'var(--space-2xl)' }}>
                <div className="journal-section-header">
                  In Season
                  {inSeason.length > 6 && (
                    <Link
                      href="/discover?status=in_season"
                      style={{ float: 'right', textTransform: 'none', letterSpacing: 'normal' }}
                    >
                      View all ({inSeason.length})
                    </Link>
                  )}
                </div>
                <div>
                  {inSeason.slice(0, 6).map((item) => (
                    <NoteCard
                      key={item.id}
                      id={item.id}
                      title={item.varietyDisplayName}
                      category={item.category}
                      subcategory={item.subcategory}
                      region={item.regionDisplayName}
                      state={item.state}
                      status={item.status}
                      statusMessage={item.statusMessage}
                      href={`/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                      distance={item.distanceMiles}
                      qualityTier={item.qualityTier}
                      flavorProfile={item.flavorProfile}
                      flavorNotes={item.flavorNotes}
                      productType={item.productDisplayName}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Coming Soon */}
            {approaching.length > 0 && (
              <section style={{ marginTop: 'var(--space-2xl)' }}>
                <div className="journal-section-header">
                  Coming Soon
                  {approaching.length > 4 && (
                    <Link
                      href="/discover?status=approaching"
                      style={{ float: 'right', textTransform: 'none', letterSpacing: 'normal' }}
                    >
                      View all ({approaching.length})
                    </Link>
                  )}
                </div>
                <div>
                  {approaching.slice(0, 4).map((item) => (
                    <NoteCardCompact
                      key={item.id}
                      title={item.varietyDisplayName}
                      category={item.category}
                      region={item.regionDisplayName}
                      state={item.state}
                      status={item.status}
                      href={`/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`}
                      distance={item.distanceMiles}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {atPeak.length === 0 && inSeason.length === 0 && approaching.length === 0 && (
              <div className="journal-empty">
                <p>No produce data available for this location yet.</p>
                <Link href="/predictions" style={{ marginTop: 'var(--space-md)', display: 'inline-block' }}>
                  Browse by region
                </Link>
              </div>
            )}

            {/* Explore More */}
            {(atPeak.length > 0 || inSeason.length > 0) && (
              <hr className="journal-divider" style={{ marginTop: 'var(--space-3xl)' }} />
            )}
            {(atPeak.length > 0 || inSeason.length > 0) && (
              <section style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: 'var(--space-md)', color: 'var(--color-ink-muted)' }}>
                  Browse all regions or search by what you&apos;re looking for.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center' }}>
                  <Link href="/discover">Browse All</Link>
                  <Link href="/predictions">View Regions</Link>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <JournalFooter />
    </div>
  )
}

const STATE_ABBREVS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
}
