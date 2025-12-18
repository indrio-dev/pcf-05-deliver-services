'use client'

/**
 * FilterSidebar - Responsive filter component
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
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-sm bg-[var(--color-accent)] px-5 py-3 text-white shadow-lg hover:bg-[var(--color-accent-dark)] transition-all active:scale-[0.98]"
      >
        <FilterIcon className="h-5 w-5" />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--color-accent)]">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile: Drawer Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile: Slide-in Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-full transform bg-[var(--color-cream)] shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
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
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 rounded-sm bg-[var(--color-cream)] p-6 border border-stone-200">
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
    <div className={`${isMobile ? 'h-full overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? 'border-b border-stone-200 px-6 py-4' : 'mb-6'}`}>
        <h3 className="font-serif text-lg font-normal text-stone-900">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-dark)] font-medium transition-colors"
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="ml-2 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className={isMobile ? 'px-6 py-4 space-y-6' : 'space-y-6'}>
        {/* Distance Filter */}
        <FilterSection title="Distance">
          <div className="space-y-2">
            {DISTANCE_OPTIONS.map(option => (
              <label
                key={option.label}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="distance"
                  checked={filters.maxDistance === option.value}
                  onChange={() => setDistance(option.value)}
                  className="h-4 w-4 border-stone-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0"
                />
                <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                  {option.value === null ? 'Any distance' : `Within ${option.label}`}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Status Filter */}
        <FilterSection title="Status">
          <div className="space-y-2">
            {STATUS_OPTIONS.map(option => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={() => toggleStatus(option.value)}
                  className="h-4 w-4 rounded border-stone-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0"
                />
                <span className="flex items-center gap-2 text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                  <StatusDot color={option.color} />
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Category Filter */}
        <FilterSection title="Product Type">
          <div className="space-y-2">
            {CATEGORY_OPTIONS.map(option => {
              const count = categoryCounts[option.value] || 0
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(option.value)}
                    onChange={() => toggleCategory(option.value)}
                    className="h-4 w-4 rounded border-stone-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0"
                  />
                  <span className="flex items-center gap-2 text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                    <span>{option.icon}</span>
                    {option.label}
                    {count > 0 && (
                      <span className="text-xs text-stone-400">({count})</span>
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
        <div className="border-t border-stone-200 px-6 py-4 bg-[var(--color-cream)]">
          <button
            onClick={onClose}
            className="w-full rounded-sm bg-[var(--color-accent)] py-3 text-sm font-medium text-white shadow-lg hover:bg-[var(--color-accent-dark)] transition-all active:scale-[0.98]"
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
    <div>
      <h4 className="mb-3 font-mono text-xs uppercase tracking-wider text-stone-500">{title}</h4>
      {children}
    </div>
  )
}

function StatusDot({ color }: { color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-[var(--color-peak)]',
    emerald: 'bg-[var(--color-season)]',
    amber: 'bg-[var(--color-approaching)]',
    gray: 'bg-[var(--color-off)]',
  }

  return (
    <span className={`h-2 w-2 rounded-full ${colorClasses[color] || 'bg-stone-400'}`} />
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
