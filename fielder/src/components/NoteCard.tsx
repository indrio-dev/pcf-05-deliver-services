'use client'

import Link from 'next/link'

export interface NoteCardProps {
  /** Unique identifier */
  id: string
  /** Main title (variety name) */
  title: string
  /** Category label (e.g., "Citrus", "Stone Fruit") */
  category: string
  /** Subcategory if applicable */
  subcategory?: string
  /** Region name */
  region: string
  /** State abbreviation */
  state: string
  /** Status: at_peak, in_season, approaching, off_season */
  status: 'at_peak' | 'in_season' | 'approaching' | 'off_season'
  /** Status message */
  statusMessage?: string
  /** Link destination */
  href: string
  /** Distance in miles */
  distance?: number
  /** Quality tier */
  qualityTier?: string
  /** Flavor profile description */
  flavorProfile?: string
  /** Additional flavor notes */
  flavorNotes?: string | null
  /** Product type (e.g., "Orange", "Beef") */
  productType?: string
  /** Days until harvest starts (for approaching) */
  daysUntilStart?: number | null
}

const STATUS_LABELS: Record<string, string> = {
  'at_peak': 'At Peak',
  'in_season': 'In Season',
  'approaching': 'Coming Soon',
  'off_season': 'Off Season',
}

const STATUS_CLASSES: Record<string, string> = {
  'at_peak': 'journal-status-peak',
  'in_season': 'journal-status-season',
  'approaching': 'journal-status-approaching',
  'off_season': 'journal-status-off',
}

export function NoteCard({
  title,
  category,
  subcategory,
  region,
  state,
  status,
  statusMessage,
  href,
  distance,
  qualityTier,
  flavorProfile,
  flavorNotes,
  productType,
  daysUntilStart,
}: NoteCardProps) {
  const categoryDisplay = subcategory
    ? `${category} · ${subcategory}`
    : category

  return (
    <Link href={href} className="journal-entry block">
      {/* Metadata line */}
      <div className="journal-meta">
        {categoryDisplay}
        <span className={`journal-status ${STATUS_CLASSES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Title */}
      <h3 className="journal-title">{title}</h3>

      {/* Specs */}
      <div className="journal-specs">
        {productType && (
          <div className="journal-specs-row">
            <span className="journal-specs-label">Type</span>
            <span className="journal-specs-value">{productType}</span>
          </div>
        )}
        <div className="journal-specs-row">
          <span className="journal-specs-label">Origin</span>
          <span className="journal-specs-value">{region}, {state}</span>
        </div>
        {distance !== undefined && (
          <div className="journal-specs-row">
            <span className="journal-specs-label">Distance</span>
            <span className="journal-specs-value">{Math.round(distance)} miles</span>
          </div>
        )}
        {qualityTier && (
          <div className="journal-specs-row">
            <span className="journal-specs-label">Quality</span>
            <span className="journal-specs-value" style={{ textTransform: 'capitalize' }}>{qualityTier}</span>
          </div>
        )}
        {daysUntilStart && status === 'approaching' && (
          <div className="journal-specs-row">
            <span className="journal-specs-label">Arrives</span>
            <span className="journal-specs-value">~{daysUntilStart} days</span>
          </div>
        )}
      </div>

      {/* Description */}
      {(flavorProfile || flavorNotes || statusMessage) && (
        <p className="journal-description">
          {flavorNotes || flavorProfile || statusMessage}
        </p>
      )}
    </Link>
  )
}

/**
 * Compact version for lists with many items
 */
export function NoteCardCompact({
  title,
  category,
  region,
  state,
  status,
  href,
  distance,
}: Pick<NoteCardProps, 'title' | 'category' | 'region' | 'state' | 'status' | 'href' | 'distance'>) {
  return (
    <Link href={href} className="journal-entry block" style={{ padding: 'var(--space-md) 0' }}>
      <div className="journal-meta" style={{ marginBottom: '0.25rem' }}>
        {category}
        <span className={`journal-status ${STATUS_CLASSES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <h3 className="journal-title" style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>
        {title}
      </h3>
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
        {region}, {state}
        {distance !== undefined && ` · ${Math.round(distance)} mi`}
      </div>
    </Link>
  )
}

export default NoteCard
