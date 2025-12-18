/**
 * SHARE Framework Breakdown Component
 *
 * Displays the 5-pillar SHARE analysis for a product:
 * S - Soil/Foundation (terroir, environment)
 * H - Heritage/Genetics (cultivar, breeding)
 * A - Agricultural Practices (growing methods)
 * R - Ripen/Timing (harvest window)
 * E - Enrich/Quality (measured outcome)
 *
 * Now data-driven: Each pillar shows actual data from region, cultivar, and timing.
 */

import type { SHAREAnalysis, SHAREPillarScore } from '@/lib/services/share-intelligence'
import type { ShareProfile } from '@/lib/constants/share-profiles'
import type { QualityTier } from '@/lib/constants/quality-tiers'

interface PillarLabels {
  soil: string
  heritage: string
  agricultural: string
  ripen: string
  enrich: string
}

interface SHAREBreakdownProps {
  // New: Dynamic SHARE analysis (preferred)
  analysis?: SHAREAnalysis

  // Legacy: Static profile (fallback)
  profile?: ShareProfile | null
  category?: string
  qualityTier?: QualityTier
  brixEstimate?: number | [number, number]
  omegaRatioEstimate?: number | [number, number]
  pillarLabels?: PillarLabels
  className?: string
}

// Pillar icons and colors
const PILLAR_CONFIG = {
  S: {
    label: 'Soil',
    icon: '🌱',
    description: 'Foundation & terroir',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    excellentColor: 'bg-amber-100 border-amber-300',
    goodColor: 'bg-amber-50 border-amber-200',
    averageColor: 'bg-stone-50 border-stone-200',
    belowColor: 'bg-stone-100 border-stone-300',
  },
  H: {
    label: 'Heritage',
    icon: '🧬',
    description: 'Genetics & cultivar',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    excellentColor: 'bg-purple-100 border-purple-300',
    goodColor: 'bg-purple-50 border-purple-200',
    averageColor: 'bg-stone-50 border-stone-200',
    belowColor: 'bg-stone-100 border-stone-300',
  },
  A: {
    label: 'Agricultural',
    icon: '🚜',
    description: 'Growing practices',
    color: 'bg-green-50 border-green-200 text-green-800',
    excellentColor: 'bg-green-100 border-green-300',
    goodColor: 'bg-green-50 border-green-200',
    averageColor: 'bg-stone-50 border-stone-200',
    belowColor: 'bg-stone-100 border-stone-300',
  },
  R: {
    label: 'Ripen',
    icon: '⏰',
    description: 'Harvest timing',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    excellentColor: 'bg-orange-100 border-orange-300',
    goodColor: 'bg-orange-50 border-orange-200',
    averageColor: 'bg-stone-50 border-stone-200',
    belowColor: 'bg-stone-100 border-stone-300',
  },
  E: {
    label: 'Enrich',
    icon: '✨',
    description: 'Measured quality',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    excellentColor: 'bg-blue-100 border-blue-300',
    goodColor: 'bg-blue-50 border-blue-200',
    averageColor: 'bg-stone-50 border-stone-200',
    belowColor: 'bg-stone-100 border-stone-300',
  },
}

// Quality tier badges
const TIER_CONFIG: Record<QualityTier, {
  label: string
  color: string
  description: string
}> = {
  artisan: {
    label: 'Artisan',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Exceptional quality, boutique production',
  },
  premium: {
    label: 'Premium',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'High quality, heritage/regenerative practices',
  },
  standard: {
    label: 'Standard',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Good quality, meets expectations',
  },
  commodity: {
    label: 'Commodity',
    color: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Basic quality, industrial production',
  },
}

// Data quality tier badges
export type DataQualityLevel = 'basic' | 'enhanced' | 'profile_lab' | 'product_lab'

const DATA_QUALITY_CONFIG: Record<DataQualityLevel, { badge: string; label: string; description: string }> = {
  basic: {
    badge: '📊',
    label: 'Inferred',
    description: 'From region & cultivar data',
  },
  enhanced: {
    badge: '🔍',
    label: 'Enhanced',
    description: 'AI-enhanced analysis',
  },
  profile_lab: {
    badge: '🧪',
    label: 'Profile Lab',
    description: 'Representative lab testing',
  },
  product_lab: {
    badge: '✓🧪',
    label: 'Verified',
    description: 'Lab-verified results',
  },
}

function DataQualityBadge({ level }: { level: DataQualityLevel }) {
  const config = DATA_QUALITY_CONFIG[level]
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-stone-100 rounded text-xs" title={config.description}>
      <span>{config.badge}</span>
      <span className="font-medium">{config.label}</span>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-stone-100 text-stone-500',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colors[confidence]}`}>
      {confidence}
    </span>
  )
}

function OmegaRatioScale({ ratio }: { ratio: number | [number, number] }) {
  const midpoint = Array.isArray(ratio) ? (ratio[0] + ratio[1]) / 2 : ratio
  const position = Math.min(100, (midpoint / 30) * 100)

  let color = '#DC2626' // red (worst)
  let tier = 'Pro-inflammatory'
  if (midpoint <= 3) {
    color = '#16A34A' // green (best)
    tier = 'Anti-inflammatory'
  } else if (midpoint <= 6) {
    color = '#65A30D' // lime
    tier = 'Good'
  } else if (midpoint <= 12) {
    color = '#CA8A04' // yellow
    tier = 'Moderate'
  } else if (midpoint <= 20) {
    color = '#EA580C' // orange
    tier = 'Poor'
  }

  const displayValue = Array.isArray(ratio) ? `${ratio[0]}–${ratio[1]}:1` : `${ratio}:1`

  return (
    <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Omega-6:3 Ratio
          </p>
          <p className="text-xs text-stone-400">{tier}</p>
        </div>
        <span className="font-mono text-2xl font-bold" style={{ color }}>
          {displayValue}
        </span>
      </div>
      <div className="relative h-3 bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-600 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-5 bg-stone-900 rounded shadow-md border border-white"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-stone-400 font-mono">
        <span>1:1</span>
        <span>6:1</span>
        <span>12:1</span>
        <span>20:1</span>
        <span>30:1</span>
      </div>
    </div>
  )
}

function BrixScale({ brix, breakdown }: { brix: number | [number, number]; breakdown?: string }) {
  const midpoint = Array.isArray(brix) ? (brix[0] + brix[1]) / 2 : brix
  const position = Math.min(100, Math.max(0, ((midpoint - 6) / (18 - 6)) * 100))

  let color = '#DC2626' // red
  let tier = 'Commodity'
  if (midpoint >= 14) {
    color = '#16A34A' // green
    tier = 'Artisan'
  } else if (midpoint >= 12) {
    color = '#65A30D' // lime
    tier = 'Premium'
  } else if (midpoint >= 10) {
    color = '#CA8A04' // yellow
    tier = 'Standard'
  }

  const displayValue = Array.isArray(brix) ? `${brix[0]}–${brix[1]}°` : `${brix}°`

  return (
    <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Predicted Brix
          </p>
          <p className="text-xs text-stone-400">{tier} tier</p>
        </div>
        <span className="font-mono text-2xl font-bold" style={{ color }}>
          {displayValue}
        </span>
      </div>
      <div className="relative h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-5 bg-stone-900 rounded shadow-md border border-white"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-stone-400 font-mono">
        <span>6°</span>
        <span>10°</span>
        <span>12°</span>
        <span>14°</span>
        <span>18°</span>
      </div>
      {breakdown && (
        <p className="mt-2 text-xs text-stone-500 border-t border-stone-200 pt-2">
          {breakdown}
        </p>
      )}
    </div>
  )
}

/**
 * Render a single SHARE pillar with dynamic data
 */
function SHAREPillar({
  pillar,
  label,
  score,
}: {
  pillar: 'S' | 'H' | 'A' | 'R' | 'E'
  label: string
  score: SHAREPillarScore
}) {
  const config = PILLAR_CONFIG[pillar]

  // Color based on rating
  const bgColor =
    score.rating === 'excellent' ? config.excellentColor :
    score.rating === 'good' ? config.goodColor :
    score.rating === 'below_average' ? config.belowColor :
    config.averageColor

  return (
    <div className={`p-3 rounded-lg border ${bgColor} ${config.color}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="font-mono text-xs uppercase tracking-wider font-medium">
            {pillar} – {label}
          </span>
        </div>
        <ConfidenceBadge confidence={score.confidence} />
      </div>
      <p className="text-sm">{score.summary}</p>
      {score.details && (
        <p className="text-xs text-stone-500 mt-1">{score.details}</p>
      )}
    </div>
  )
}

export function SHAREBreakdown({
  analysis,
  profile,
  category,
  qualityTier,
  brixEstimate,
  omegaRatioEstimate,
  pillarLabels,
  className,
}: SHAREBreakdownProps) {
  // Determine quality tier - prefer analysis, then prop, then profile
  const tier: QualityTier = analysis?.qualityTier || qualityTier || profile?.qualityTier || 'standard'

  // Get tier config with fallback
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.standard

  // Use custom pillar labels if provided, otherwise use defaults
  const labels = {
    soil: pillarLabels?.soil || PILLAR_CONFIG.S.label,
    heritage: pillarLabels?.heritage || PILLAR_CONFIG.H.label,
    agricultural: pillarLabels?.agricultural || PILLAR_CONFIG.A.label,
    ripen: pillarLabels?.ripen || PILLAR_CONFIG.R.label,
    enrich: pillarLabels?.enrich || PILLAR_CONFIG.E.label,
  }

  // Determine primary quality metric
  const showBrix = brixEstimate !== undefined || analysis?.predictedBrix !== undefined || profile?.estimatedBrixRange
  const showOmega = omegaRatioEstimate !== undefined || profile?.estimatedOmegaRatioRange

  // Get Brix value
  const brixValue = analysis?.brixRange || brixEstimate || profile?.estimatedBrixRange
  const brixBreakdown = analysis?.enrich.details

  // Get omega value
  const omegaValue = omegaRatioEstimate || profile?.estimatedOmegaRatioMidpoint || profile?.estimatedOmegaRatioRange

  // Data quality level
  const dataLevel = analysis?.dataQualityLevel || 'basic'

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Quality Tier Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-mono uppercase tracking-wider border ${tierConfig.color}`}>
            {tierConfig.label}
          </span>
          <DataQualityBadge level={dataLevel} />
        </div>
        {profile?.code && (
          <span className="font-mono text-xs text-stone-400">
            Profile: {profile.code}
          </span>
        )}
      </div>

      {/* Primary Quality Metric */}
      {showBrix && brixValue && (
        <BrixScale
          brix={brixValue as number | [number, number]}
          breakdown={brixBreakdown}
        />
      )}
      {showOmega && omegaValue && (
        <OmegaRatioScale ratio={omegaValue as number | [number, number]} />
      )}

      {/* SHARE Pillars - Dynamic or Static */}
      <div className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-stone-400">
          SHARE Framework Analysis
        </h3>

        <div className="grid gap-3">
          {analysis ? (
            // Dynamic pillars from analysis
            <>
              <SHAREPillar pillar="S" label={labels.soil} score={analysis.soil} />
              <SHAREPillar pillar="H" label={labels.heritage} score={analysis.heritage} />
              <SHAREPillar pillar="A" label={labels.agricultural} score={analysis.agricultural} />
              <SHAREPillar pillar="R" label={labels.ripen} score={analysis.ripen} />
              <SHAREPillar pillar="E" label={labels.enrich} score={analysis.enrich} />
            </>
          ) : (
            // Static pillars from profile (legacy)
            <>
              <div className={`p-3 rounded-lg border ${PILLAR_CONFIG.S.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{PILLAR_CONFIG.S.icon}</span>
                  <span className="font-mono text-xs uppercase tracking-wider font-medium">
                    S – {labels.soil}
                  </span>
                </div>
                <p className="text-sm">
                  {profile?.soilPillarSummary || `${labels.soil} data not available`}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${PILLAR_CONFIG.H.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{PILLAR_CONFIG.H.icon}</span>
                  <span className="font-mono text-xs uppercase tracking-wider font-medium">
                    H – {labels.heritage}
                  </span>
                </div>
                <p className="text-sm">
                  {profile?.heritagePillarSummary || `${labels.heritage} data not available`}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${PILLAR_CONFIG.A.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{PILLAR_CONFIG.A.icon}</span>
                  <span className="font-mono text-xs uppercase tracking-wider font-medium">
                    A – {labels.agricultural}
                  </span>
                </div>
                <p className="text-sm">
                  {profile?.agriculturalPillarSummary || `${labels.agricultural} data not available`}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${PILLAR_CONFIG.R.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{PILLAR_CONFIG.R.icon}</span>
                  <span className="font-mono text-xs uppercase tracking-wider font-medium">
                    R – {labels.ripen}
                  </span>
                </div>
                <p className="text-sm">
                  {profile?.ripenPillarSummary || `${labels.ripen} data not available`}
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${PILLAR_CONFIG.E.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{PILLAR_CONFIG.E.icon}</span>
                  <span className="font-mono text-xs uppercase tracking-wider font-medium">
                    E – {labels.enrich}
                  </span>
                </div>
                <p className="text-sm">
                  {profile?.enrichPillarSummary || `${labels.enrich} data not available`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Insights */}
      {analysis?.insights && analysis.insights.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-mono text-xs uppercase tracking-wider text-blue-700 mb-2">
            Quality Insights
          </h4>
          <ul className="space-y-1">
            {analysis.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-500">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Red Flags (legacy profile) */}
      {profile?.redFlags && profile.redFlags.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-mono text-xs uppercase tracking-wider text-red-700 mb-2">
            Red Flags to Watch
          </h4>
          <ul className="space-y-1">
            {profile.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                <span className="text-red-500">⚠</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes (legacy profile) */}
      {profile?.notes && (
        <p className="text-sm text-stone-600 italic border-l-2 border-stone-200 pl-3">
          {profile.notes}
        </p>
      )}
    </div>
  )
}

export default SHAREBreakdown
