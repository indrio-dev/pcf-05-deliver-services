'use client'

import Link from 'next/link'

export interface ProductGridCardProps {
  title: string
  productType: string
  region: string
  state: string
  status: 'at_peak' | 'in_season' | 'approaching' | 'off_season'
  href: string
  distance?: number
  qualityTier?: string
}

const STATUS_CONFIG = {
  at_peak: { label: 'Peak', color: 'var(--color-peak)', bg: 'rgba(34, 197, 94, 0.1)' },
  in_season: { label: 'Season', color: 'var(--color-season)', bg: 'rgba(16, 185, 129, 0.1)' },
  approaching: { label: 'Soon', color: 'var(--color-approaching)', bg: 'rgba(245, 158, 11, 0.1)' },
  off_season: { label: 'Off', color: 'var(--color-off)', bg: 'rgba(120, 113, 108, 0.1)' },
}

export function ProductGridCard({
  title,
  productType,
  region,
  state,
  status,
  href,
  distance,
  qualityTier,
}: ProductGridCardProps) {
  const statusConfig = STATUS_CONFIG[status]

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 'var(--space-md)',
        border: '1px solid var(--color-rule)',
        background: 'var(--color-manila)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-ink)'
        e.currentTarget.style.boxShadow = '2px 2px 0 var(--color-rule)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-rule)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header: Status badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-sm)',
      }}>
        <span style={{
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.625rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--color-ink-muted)',
        }}>
          {productType}
        </span>
        <span style={{
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.625rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '2px 6px',
          background: statusConfig.bg,
          color: statusConfig.color,
          fontWeight: 600,
        }}>
          {statusConfig.label}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-typewriter)',
        fontSize: '0.9375rem',
        fontWeight: 400,
        margin: 0,
        marginBottom: 'var(--space-xs)',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {title}
      </h3>

      {/* Location */}
      <div style={{
        fontFamily: 'var(--font-typewriter)',
        fontSize: '0.75rem',
        color: 'var(--color-ink-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {region}, {state}
        {distance !== undefined && (
          <span style={{ marginLeft: 'var(--space-xs)' }}>
            · {Math.round(distance)} mi
          </span>
        )}
      </div>

      {/* Quality tier if available */}
      {qualityTier && (
        <div style={{
          marginTop: 'var(--space-xs)',
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.625rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: qualityTier === 'exceptional' ? 'var(--color-peak)' : 'var(--color-ink-muted)',
        }}>
          {qualityTier}
        </div>
      )}
    </Link>
  )
}

export default ProductGridCard
