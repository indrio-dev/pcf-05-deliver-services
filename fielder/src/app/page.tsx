'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { CategoryIcon, getCategoryFromProduct } from '@/components/CategoryIcon'
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

const SEASON_MESSAGES: Record<string, string> = {
  winter: "Cold nights concentrate sugars in the groves. Citrus season is at its sweetest.",
  spring: "Tender greens and early berries emerge as the earth warms.",
  summer: "Stone fruits at their sun-ripened best. Peaches, cherries, and melons abound.",
  fall: "Harvest time brings apples from the orchard and the year's final bounty.",
}

export default function Home() {
  const { location: geoLocation, error: geoError, requestLocation } = useGeolocation(true)
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
      setError('Unable to load fresh produce data')
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
      // Use OpenStreetMap Nominatim to geocode zip code
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}&country=US&format=json&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)

        // Get city name from display_name (e.g., "32789, Orlando, Orange County, Florida, United States")
        const parts = result.display_name.split(', ')
        const cityName = parts[1] && parts[3] ? `${parts[1]}, ${STATE_ABBREVS[parts[3]] || parts[3]}` : `Zip ${zipCode}`

        setManualLocation({ lat, lon, name: cityName })
        setShowLocationInput(false)
        setZipCode('')
      } else {
        setZipError('Zip code not found. Please try again.')
      }
    } catch {
      setZipError('Unable to look up zip code. Please try again.')
    } finally {
      setZipLoading(false)
    }
  }

  const handleUseMyLocation = () => {
    requestLocation()
    setShowLocationInput(false)
  }

  const atPeakDisplay = atPeak.slice(0, 6)
  const inSeasonDisplay = inSeason.slice(0, 6)
  const approachingDisplay = approaching.slice(0, 4)

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Header />

      {/* Hero Section */}
      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-3">
              {currentSeason} Harvest
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 leading-tight">
              What&apos;s Fresh Near{' '}
              <button
                onClick={() => setShowLocationInput(!showLocationInput)}
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-dark)] transition-colors border-b-2 border-dashed border-[var(--color-accent)]/40 hover:border-[var(--color-accent)]"
              >
                {locationName}
              </button>
            </h1>
            <p className="mt-4 font-serif text-lg text-stone-600 leading-relaxed">
              {SEASON_MESSAGES[currentSeason] || SEASON_MESSAGES.winter}
            </p>
          </div>

          {/* Zip Code Input */}
          {showLocationInput && (
            <div className="mt-6 p-6 bg-[var(--color-cream)] border border-stone-300 shadow-md max-w-sm">
              <p className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-4">Enter your zip code</p>
              <form onSubmit={handleZipSubmit} className="space-y-3">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="e.g., 32789"
                  className="w-full px-4 py-3 border border-stone-300 bg-white font-mono text-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                  maxLength={5}
                  pattern="[0-9]{5}"
                  inputMode="numeric"
                />
                {zipError && (
                  <p className="text-sm text-red-600">{zipError}</p>
                )}
                <button
                  type="submit"
                  disabled={zipCode.length !== 5 || zipLoading}
                  className="w-full py-3 bg-[var(--color-accent)] text-white font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {zipLoading ? 'Looking up...' : 'Update Location'}
                </button>
              </form>
              <button
                onClick={handleUseMyLocation}
                className="mt-4 w-full text-center font-mono text-sm text-[var(--color-accent)] hover:underline"
              >
                Use my current location
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchDiscoveryData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon)} />
        ) : (
          <div className="space-y-16">
            {/* At Peak Section */}
            {atPeakDisplay.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-8">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)]">
                      At Peak Now
                    </span>
                    <h2 className="mt-1 font-serif text-2xl text-stone-900">
                      Best of the Season
                    </h2>
                  </div>
                  {atPeak.length > 6 && (
                    <Link href="/discover?status=at_peak" className="font-mono text-xs uppercase tracking-wider text-[var(--color-accent)] hover:underline">
                      View all
                    </Link>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {atPeakDisplay.map((item) => (
                    <ProductCard key={item.id} item={item} showPeakBadge />
                  ))}
                </div>
              </section>
            )}

            {/* In Season Section */}
            {inSeasonDisplay.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-8">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
                      In Season
                    </span>
                    <h2 className="mt-1 font-serif text-2xl text-stone-900">
                      Available Now
                    </h2>
                  </div>
                  {inSeason.length > 6 && (
                    <Link href="/discover?status=in_season" className="font-mono text-xs uppercase tracking-wider text-[var(--color-accent)] hover:underline">
                      View all
                    </Link>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {inSeasonDisplay.map((item) => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Coming Soon Section */}
            {approachingDisplay.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-8">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
                      Coming Soon
                    </span>
                    <h2 className="mt-1 font-serif text-2xl text-stone-900">
                      On the Horizon
                    </h2>
                  </div>
                  {approaching.length > 4 && (
                    <Link href="/discover?status=approaching" className="font-mono text-xs uppercase tracking-wider text-[var(--color-accent)] hover:underline">
                      View all
                    </Link>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {approachingDisplay.map((item) => (
                    <ProductCardSmall key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {atPeak.length === 0 && inSeason.length === 0 && approaching.length === 0 && (
              <div className="text-center py-16">
                <p className="font-serif text-lg text-stone-600">No produce data available for this location yet.</p>
                <Link href="/predictions" className="mt-4 inline-block font-mono text-sm text-[var(--color-accent)] hover:underline">
                  Browse by region
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Browse More */}
        {!loading && (atPeak.length > 0 || inSeason.length > 0) && (
          <section className="mt-20 py-16 border-t border-dashed border-stone-300">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl text-stone-900">
                Explore More
              </h2>
              <p className="mt-3 font-serif text-stone-600">
                Browse all growing regions or search by what you&apos;re looking for.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center px-8 py-3 bg-[var(--color-accent)] text-white font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors"
                >
                  Browse All Products
                </Link>
                <Link
                  href="/predictions"
                  className="inline-flex items-center justify-center px-8 py-3 border border-stone-400 text-stone-700 font-mono text-sm uppercase tracking-wider hover:bg-stone-100 transition-colors"
                >
                  View Regions
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <span className="font-serif text-xl text-white">Fielder</span>
              <p className="mt-2 text-sm text-stone-400">Fresh produce at peak quality.</p>
            </div>
            <div className="flex gap-8 font-mono text-xs uppercase tracking-wider">
              <Link href="/discover" className="text-stone-400 hover:text-white transition-colors">
                Discover
              </Link>
              <Link href="/predictions" className="text-stone-400 hover:text-white transition-colors">
                Regions
              </Link>
              <Link href="/farm" className="text-stone-400 hover:text-white transition-colors">
                For Farms
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-800">
            <p className="font-mono text-xs text-stone-500">
              &copy; {new Date().getFullYear()} Fielder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ProductCard({ item, showPeakBadge }: { item: DiscoveryItem; showPeakBadge?: boolean }) {
  const href = `/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`
  const iconCategory = getCategoryFromProduct(item.varietyId, item.productId, item.category)

  return (
    <Link href={href} className="group block bg-[var(--color-cream)] border border-stone-300 shadow-sm hover:shadow-md transition-shadow">
      {/* Card with padding around icon */}
      <div className="p-3">
        {/* Inset Icon */}
        <div className="relative aspect-[4/3] overflow-hidden bg-white border border-stone-200 flex items-center justify-center">
          <CategoryIcon
            category={iconCategory}
            size="lg"
            showLabel={false}
            className="transition-transform duration-500 group-hover:scale-110"
          />
          {/* Peak Badge */}
          {showPeakBadge && (
            <div className="absolute top-2 left-2">
              <span className="font-mono text-xs uppercase tracking-wider px-2 py-1 bg-[var(--color-accent)] text-white">
                Peak
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content - Notecard Style */}
      <div className="px-4 pb-4">
        {/* Title */}
        <h3 className="font-serif text-lg text-stone-900 group-hover:text-[var(--color-accent)] transition-colors">
          {item.varietyDisplayName}
        </h3>

        {/* Specs - Typewriter style */}
        <dl className="mt-3 space-y-1 font-mono text-xs text-stone-500">
          <div className="flex">
            <dt className="w-16 uppercase tracking-wide">Cultivar</dt>
            <dd className="text-stone-700">{item.productDisplayName}</dd>
          </div>
          <div className="flex">
            <dt className="w-16 uppercase tracking-wide">Origin</dt>
            <dd className="text-stone-700">{item.regionDisplayName}, {item.state}</dd>
          </div>
          <div className="flex">
            <dt className="w-16 uppercase tracking-wide">Distance</dt>
            <dd className="text-stone-700">{item.distanceMiles} mi</dd>
          </div>
        </dl>

        {/* Flavor */}
        {item.flavorProfile && (
          <p className="mt-3 font-serif text-sm text-stone-600 italic line-clamp-2">
            &ldquo;{item.flavorProfile}&rdquo;
          </p>
        )}
      </div>
    </Link>
  )
}

function ProductCardSmall({ item }: { item: DiscoveryItem }) {
  const href = `/predictions/${item.regionSlug}/${item.varietyId.replace(/_/g, '-').toLowerCase()}`
  const iconCategory = getCategoryFromProduct(item.varietyId, item.productId, item.category)

  return (
    <Link href={href} className="group block bg-[var(--color-cream)] border border-stone-300 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-2">
        <div className="relative aspect-square overflow-hidden bg-white border border-stone-200 flex items-center justify-center">
          <CategoryIcon
            category={iconCategory}
            size="md"
            showLabel={false}
            className="transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </div>
      <div className="px-3 pb-3">
        <h3 className="font-serif text-sm text-stone-900 group-hover:text-[var(--color-accent)] transition-colors">
          {item.varietyDisplayName}
        </h3>
        <p className="font-mono text-xs text-stone-500 uppercase tracking-wide">
          {item.regionDisplayName}
        </p>
      </div>
    </Link>
  )
}

function LoadingState() {
  return (
    <div className="space-y-16">
      <section>
        <div className="mb-8">
          <div className="h-3 w-24 bg-stone-200 animate-pulse" />
          <div className="mt-2 h-7 w-40 bg-stone-200 animate-pulse" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--color-cream)] border border-stone-300 p-3 animate-pulse">
              <div className="aspect-[4/3] bg-stone-200" />
              <div className="mt-4 h-5 w-3/4 bg-stone-200" />
              <div className="mt-2 h-4 w-1/2 bg-stone-100" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="font-serif text-lg text-stone-600 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-6 py-3 bg-[var(--color-accent)] text-white font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors"
      >
        Try Again
      </button>
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
