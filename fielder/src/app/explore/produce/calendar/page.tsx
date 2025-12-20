'use client'

import { useMemo } from 'react'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'
import { CROP_PHENOLOGY, type CropPhenology } from '@/lib/constants/crop-phenology'

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

interface CalendarEntry {
  cropId: string
  region: string
  cropName: string
  regionName: string
  bloomDate: Date
  harvestStartDate: Date
  harvestEndDate: Date
  peakStartDate: Date
  peakEndDate: Date
  harvestStartDoy: number
  harvestEndDoy: number
  peakStartDoy: number
  peakEndDoy: number
  isCurrentlyPeak: boolean
  isCurrentlyHarvest: boolean
  isPeakSoon: boolean
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Approximate GDD accumulation rates (GDD per day)
const GDD_RATES: Record<string, number> = {
  florida: 22,
  california: 20,
  texas: 25,
  georgia: 20,
  washington: 16,
  washington_oregon: 16,
  michigan: 17,
  new_york: 17,
  new_jersey: 18,
}

// =============================================================================
// UTILITIES
// =============================================================================

function getRegionGddRate(region: string): number {
  return GDD_RATES[region] || 20 // Default 20 GDD/day
}

function addGddDays(bloomDate: Date, gdd: number, gddRate: number): Date {
  const days = Math.round(gdd / gddRate)
  const result = new Date(bloomDate)
  result.setDate(result.getDate() + days)
  return result
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

function formatCropName(cropId: string): string {
  return cropId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatRegionName(region: string): string {
  return region
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function convertPhenologyToCalendar(phenology: CropPhenology, year: number = new Date().getFullYear()): CalendarEntry {
  const bloomDate = new Date(year, phenology.bloomMonth - 1, phenology.bloomDay)
  const gddRate = getRegionGddRate(phenology.region)

  const harvestStartDate = addGddDays(bloomDate, phenology.gddToMaturity, gddRate)
  const harvestEndDate = addGddDays(bloomDate, phenology.gddToMaturity + phenology.gddWindow, gddRate)
  const peakStartDate = addGddDays(bloomDate, phenology.gddToPeak - (phenology.gddWindow / 4), gddRate)
  const peakEndDate = addGddDays(bloomDate, phenology.gddToPeak + (phenology.gddWindow / 4), gddRate)

  // Handle year wraparound for Valencia oranges and other late-season crops
  if (harvestStartDate.getFullYear() > year) {
    harvestStartDate.setFullYear(year + 1)
    harvestEndDate.setFullYear(year + 1)
    peakStartDate.setFullYear(year + 1)
    peakEndDate.setFullYear(year + 1)
  }

  const today = new Date()
  const isCurrentlyHarvest = isDateInRange(today, harvestStartDate, harvestEndDate)
  const isCurrentlyPeak = isDateInRange(today, peakStartDate, peakEndDate)

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const sixtyDaysFromNow = new Date()
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)
  const isPeakSoon = peakStartDate >= thirtyDaysFromNow && peakStartDate <= sixtyDaysFromNow

  return {
    cropId: phenology.cropId,
    region: phenology.region,
    cropName: formatCropName(phenology.cropId),
    regionName: formatRegionName(phenology.region),
    bloomDate,
    harvestStartDate,
    harvestEndDate,
    peakStartDate,
    peakEndDate,
    harvestStartDoy: getDayOfYear(harvestStartDate),
    harvestEndDoy: getDayOfYear(harvestEndDate),
    peakStartDoy: getDayOfYear(peakStartDate),
    peakEndDoy: getDayOfYear(peakEndDate),
    isCurrentlyPeak,
    isCurrentlyHarvest,
    isPeakSoon,
  }
}

function getMonthStartDoy(month: number, year: number): number {
  return getDayOfYear(new Date(year, month, 1))
}

// =============================================================================
// TIMELINE VISUALIZATION
// =============================================================================

function HarvestTimeline({ entry }: { entry: CalendarEntry }) {
  const year = new Date().getFullYear()
  const currentDoy = getDayOfYear(new Date())

  // Calculate positions as percentages (0-100)
  const harvestStart = (entry.harvestStartDoy / 365) * 100
  const harvestEnd = (entry.harvestEndDoy / 365) * 100
  const peakStart = (entry.peakStartDoy / 365) * 100
  const peakEnd = (entry.peakEndDoy / 365) * 100
  const currentPos = (currentDoy / 365) * 100

  // Handle year wraparound display
  const isWrapped = entry.harvestStartDoy > entry.harvestEndDoy

  return (
    <div className="relative h-12 bg-stone-100 border border-stone-200">
      {/* Harvest window (lighter) */}
      {!isWrapped ? (
        <div
          className="absolute top-0 bottom-0 bg-green-200/50"
          style={{
            left: `${harvestStart}%`,
            right: `${100 - harvestEnd}%`,
          }}
        />
      ) : (
        <>
          <div
            className="absolute top-0 bottom-0 bg-green-200/50"
            style={{ left: '0%', right: `${100 - harvestEnd}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-green-200/50"
            style={{ left: `${harvestStart}%`, right: '0%' }}
          />
        </>
      )}

      {/* Peak window (darker) */}
      {!isWrapped ? (
        <div
          className="absolute top-0 bottom-0 bg-green-600/70"
          style={{
            left: `${peakStart}%`,
            right: `${100 - peakEnd}%`,
          }}
        />
      ) : (
        <>
          <div
            className="absolute top-0 bottom-0 bg-green-600/70"
            style={{ left: '0%', right: `${100 - peakEnd}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-green-600/70"
            style={{ left: `${peakStart}%`, right: '0%' }}
          />
        </>
      )}

      {/* Current date indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
        style={{ left: `${currentPos}%` }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full" />
      </div>

      {/* Month grid */}
      {MONTHS.map((month, idx) => {
        const monthDoy = getMonthStartDoy(idx, year)
        const pos = (monthDoy / 365) * 100
        return (
          <div
            key={month}
            className="absolute top-0 bottom-0 border-l border-stone-300/30"
            style={{ left: `${pos}%` }}
          />
        )
      })}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HarvestCalendarPage() {
  const today = new Date()
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const currentDoy = getDayOfYear(today)

  // Convert all phenology data to calendar entries
  const calendarEntries = useMemo(() => {
    return CROP_PHENOLOGY.map(p => convertPhenologyToCalendar(p))
      .sort((a, b) => {
        // Sort by harvest start date
        return a.harvestStartDoy - b.harvestStartDoy
      })
  }, [])

  // Filter for current peak and coming soon
  const peakNow = useMemo(() => {
    return calendarEntries.filter(e => e.isCurrentlyPeak)
  }, [calendarEntries])

  const comingSoon = useMemo(() => {
    return calendarEntries.filter(e => e.isPeakSoon)
  }, [calendarEntries])

  return (
    <div className="min-h-screen bg-[var(--color-manila)]">
      <JournalHeader />

      {/* Hero */}
      <section className="border-b border-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900">
            Harvest Calendar
          </h1>
          <p className="mt-2 font-mono text-sm text-stone-600 uppercase tracking-wider">
            When to buy for peak quality
          </p>
          <div className="mt-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="font-mono text-sm text-stone-700">
              Today: {currentMonth}
            </span>
          </div>
        </div>
      </section>

      {/* Peak Right Now */}
      {peakNow.length > 0 && (
        <section className="border-b border-stone-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)]">
                Peak Right Now
              </span>
              <h2 className="mt-1 font-serif text-2xl text-stone-900">
                Best Quality Available ({peakNow.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {peakNow.map((entry, idx) => (
                <div
                  key={`${entry.cropId}-${entry.region}-${idx}`}
                  className="border-2 border-green-600 bg-[var(--color-manila)] p-4"
                >
                  <h3 className="font-serif text-lg text-stone-900">{entry.cropName}</h3>
                  <p className="font-mono text-xs text-stone-600 uppercase tracking-wide mt-1">
                    {entry.regionName}
                  </p>
                  <dl className="mt-3 space-y-1 font-mono text-xs text-stone-600">
                    <div className="flex justify-between">
                      <dt>Peak Window:</dt>
                      <dd className="text-stone-900 font-medium">
                        {entry.peakStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {entry.peakEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Harvest:</dt>
                      <dd className="text-stone-700">
                        {entry.harvestStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {entry.harvestEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <section className="border-b border-stone-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
                Coming Soon
              </span>
              <h2 className="mt-1 font-serif text-2xl text-stone-900">
                Peak in 30-60 Days ({comingSoon.length})
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((entry, idx) => (
                <div
                  key={`${entry.cropId}-${entry.region}-${idx}`}
                  className="border-2 border-stone-300 bg-[var(--color-manila)] p-4"
                >
                  <h3 className="font-serif text-lg text-stone-900">{entry.cropName}</h3>
                  <p className="font-mono text-xs text-stone-600 uppercase tracking-wide mt-1">
                    {entry.regionName}
                  </p>
                  <dl className="mt-3 space-y-1 font-mono text-xs text-stone-600">
                    <div className="flex justify-between">
                      <dt>Peak Starts:</dt>
                      <dd className="text-stone-900 font-medium">
                        {entry.peakStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Days Away:</dt>
                      <dd className="text-[var(--color-accent)]">
                        {Math.round((entry.peakStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full Calendar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            Annual Calendar
          </span>
          <h2 className="mt-1 font-serif text-2xl text-stone-900">
            All Crops by Region ({calendarEntries.length})
          </h2>
        </div>

        {/* Month axis */}
        <div className="mb-4 flex justify-between font-mono text-xs text-stone-500 uppercase tracking-wider px-1">
          {MONTHS.map(month => (
            <div key={month} className="w-[8.33%] text-center">
              {month}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mb-6 flex items-center gap-6 font-mono text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-green-200/50 border border-stone-300" />
            <span>Harvest Window</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-green-600/70 border border-stone-300" />
            <span>Peak Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-600" />
            <span>Today</span>
          </div>
        </div>

        {/* Timeline rows */}
        <div className="space-y-3">
          {calendarEntries.map((entry, idx) => (
            <div
              key={`${entry.cropId}-${entry.region}-${idx}`}
              className="flex gap-4 items-center"
            >
              {/* Crop label */}
              <div className="w-56 flex-shrink-0">
                <p className="font-serif text-sm text-stone-900">{entry.cropName}</p>
                <p className="font-mono text-xs text-stone-500 uppercase tracking-wide">
                  {entry.regionName}
                </p>
              </div>

              {/* Timeline */}
              <div className="flex-1">
                <HarvestTimeline entry={entry} />
              </div>

              {/* Dates */}
              <div className="w-40 flex-shrink-0 font-mono text-xs text-stone-600">
                <div>
                  Peak: {entry.peakStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {entry.isCurrentlyPeak && (
                  <div className="text-[var(--color-accent)] font-medium uppercase tracking-wide">
                    Peak Now
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 border-2 border-stone-300 bg-[var(--color-manila)] p-4">
          <p className="font-typewriter text-xs text-stone-600">
            <strong>Note:</strong> Harvest dates are calculated from bloom dates and Growing Degree Day (GDD)
            accumulation. Actual dates may vary by ±7-14 days based on weather patterns. Peak quality windows
            are the optimal time to buy for maximum flavor and nutrition.
          </p>
        </div>
      </section>

      <JournalFooter />
    </div>
  )
}
