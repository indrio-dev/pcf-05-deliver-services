'use client'

/**
 * FilterSidebar - Responsive filter component with journal aesthetic
 *
 * - Mobile: Floating filter button + slide-in drawer
 * - Desktop: Fixed left sidebar (280px)
 */

import {
  DISTANCE_OPTIONS,
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  type UseFiltersReturn,
} from '@/lib/hooks/useFilters'

interface FilterSidebarProps {
  filterState: UseFiltersReturn
  categoryCounts?: Record<string, number>
}

export function FilterSidebar({ filterState, categoryCounts = {} }: FilterSidebarProps) {
  const {
    filters,
    isOpen,
    setIsOpen,
    setDistance,
    toggleStatus,
    toggleCategory,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = filterState

  return (
    <>
      {/* Mobile: Floating Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: 'var(--space-lg)',
          right: 'var(--space-lg)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--color-ink)',
          color: 'var(--color-manila)',
          border: 'none',
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: 'pointer',
        }}
      >
        <FilterIcon style={{ width: '1rem', height: '1rem' }} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.25rem',
            height: '1.25rem',
            background: 'var(--color-manila)',
            color: 'var(--color-ink)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            borderRadius: '50%',
          }}>
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile: Drawer Overlay */}
      {isOpen && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile: Slide-in Drawer */}
      <div
        className="lg:hidden"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          width: '20rem',
          maxWidth: '100%',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          background: 'var(--color-manila)',
          borderRight: '1px solid var(--color-rule)',
          transition: 'transform 0.3s ease',
        }}
      >
        <FilterContent
          filters={filters}
          setDistance={setDistance}
          toggleStatus={toggleStatus}
          toggleCategory={toggleCategory}
          resetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
          categoryCounts={categoryCounts}
          onClose={() => setIsOpen(false)}
          isMobile
        />
      </div>

      {/* Desktop: Fixed Sidebar */}
      <aside className="hidden lg:block" style={{ width: '16rem', flexShrink: 0 }}>
        <div style={{
          position: 'sticky',
          top: 'var(--space-xl)',
          padding: 'var(--space-lg)',
          background: 'var(--color-manila)',
          border: '1px solid var(--color-rule)',
        }}>
          <FilterContent
            filters={filters}
            setDistance={setDistance}
            toggleStatus={toggleStatus}
            toggleCategory={toggleCategory}
            resetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
            categoryCounts={categoryCounts}
          />
        </div>
      </aside>
    </>
  )
}

interface FilterContentProps {
  filters: UseFiltersReturn['filters']
  setDistance: UseFiltersReturn['setDistance']
  toggleStatus: UseFiltersReturn['toggleStatus']
  toggleCategory: UseFiltersReturn['toggleCategory']
  resetFilters: UseFiltersReturn['resetFilters']
  hasActiveFilters: boolean
  categoryCounts: Record<string, number>
  onClose?: () => void
  isMobile?: boolean
}

function FilterContent({
  filters,
  setDistance,
  toggleStatus,
  toggleCategory,
  resetFilters,
  hasActiveFilters,
  categoryCounts,
  onClose,
  isMobile,
}: FilterContentProps) {
  return (
    <div style={{ height: isMobile ? '100%' : 'auto', overflow: isMobile ? 'auto' : 'visible' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-lg)',
        paddingBottom: isMobile ? 'var(--space-md)' : 0,
        borderBottom: isMobile ? '1px solid var(--color-rule)' : 'none',
        padding: isMobile ? 'var(--space-md) var(--space-lg)' : 0,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: 0,
        }}>
          Filters
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-typewriter)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              style={{
                marginLeft: 'var(--space-sm)',
                background: 'none',
                border: 'none',
                padding: 'var(--space-xs)',
                cursor: 'pointer',
              }}
            >
              <CloseIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: isMobile ? '0 var(--space-lg) var(--space-lg)' : 0 }}>
        {/* Distance Filter */}
        <FilterSection title="Distance">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {DISTANCE_OPTIONS.map(option => (
              <label
                key={option.label}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="distance"
                  checked={filters.maxDistance === option.value}
                  onChange={() => setDistance(option.value)}
                  style={{ accentColor: 'var(--color-ink)' }}
                />
                <span style={{ fontSize: '0.875rem' }}>
                  {option.value === null ? 'Any distance' : `Within ${option.label}`}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Status Filter */}
        <FilterSection title="Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {STATUS_OPTIONS.map(option => (
              <label
                key={option.value}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={() => toggleStatus(option.value)}
                  style={{ accentColor: 'var(--color-ink)' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: '0.875rem' }}>
                  <StatusDot color={option.color} />
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Category Filter */}
        <FilterSection title="Product Type">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {CATEGORY_OPTIONS.map(option => {
              const count = categoryCounts[option.value] || 0
              return (
                <label
                  key={option.value}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(option.value)}
                    onChange={() => toggleCategory(option.value)}
                    style={{ accentColor: 'var(--color-ink)' }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: '0.875rem' }}>
                    <span>{option.icon}</span>
                    {option.label}
                    {count > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>({count})</span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        </FilterSection>
      </div>

      {/* Mobile: Apply Button */}
      {isMobile && onClose && (
        <div style={{
          borderTop: '1px solid var(--color-rule)',
          padding: 'var(--space-md) var(--space-lg)',
          background: 'var(--color-manila)',
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--color-ink)',
              color: 'var(--color-manila)',
              border: 'none',
              fontFamily: 'var(--font-typewriter)',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <h4 style={{
        marginBottom: 'var(--space-sm)',
        fontFamily: 'var(--font-typewriter)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--color-ink-muted)',
      }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function StatusDot({ color }: { color: string }) {
  const colorMap: Record<string, string> = {
    green: 'var(--color-peak)',
    emerald: 'var(--color-season)',
    amber: 'var(--color-approaching)',
    gray: 'var(--color-off)',
  }

  return (
    <span style={{
      width: '0.5rem',
      height: '0.5rem',
      borderRadius: '50%',
      background: colorMap[color] || 'var(--color-ink-muted)',
    }} />
  )
}

function FilterIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  )
}

function CloseIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

export default FilterSidebar
