/**
 * useFilters hook - Filter state management for discover page
 */

import { useState, useCallback, useMemo } from 'react'

export interface FilterState {
  maxDistance: number | null  // null = any distance
  status: string[]           // at_peak, in_season, approaching, off_season
  categories: string[]       // fruit, vegetable, nut, meat, dairy, honey, processed
  subcategories: string[]    // citrus, stone_fruit, etc.
}

export const DEFAULT_FILTERS: FilterState = {
  maxDistance: null,
  status: ['at_peak', 'in_season', 'approaching'],  // Show active items by default
  categories: [],  // Empty = all categories
  subcategories: [],
}

export const DISTANCE_OPTIONS = [
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
  { value: 250, label: '250 miles' },
  { value: 500, label: '500 miles' },
  { value: null, label: 'Any distance' },
] as const

export const STATUS_OPTIONS = [
  { value: 'at_peak', label: 'At Peak Now', color: 'green' },
  { value: 'in_season', label: 'In Season', color: 'emerald' },
  { value: 'approaching', label: 'Coming Soon', color: 'amber' },
  { value: 'off_season', label: 'Off Season', color: 'gray' },
] as const

export const CATEGORY_OPTIONS = [
  { value: 'fruit', label: 'Fruits', icon: '🍎' },
  { value: 'vegetable', label: 'Vegetables', icon: '🥬' },
  { value: 'nut', label: 'Nuts', icon: '🥜' },
  { value: 'meat', label: 'Meat & Poultry', icon: '🥩' },
  { value: 'dairy', label: 'Dairy & Eggs', icon: '🥚' },
  { value: 'honey', label: 'Honey', icon: '🍯' },
  { value: 'processed', label: 'Lightly Processed', icon: '🍎' },
] as const

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [isOpen, setIsOpen] = useState(false)

  // Set distance filter
  const setDistance = useCallback((distance: number | null) => {
    setFilters(prev => ({ ...prev, maxDistance: distance }))
  }, [])

  // Toggle a status in the status array
  const toggleStatus = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }))
  }, [])

  // Toggle a category in the categories array
  const toggleCategory = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }))
  }, [])

  // Toggle a subcategory
  const toggleSubcategory = useCallback((subcategory: string) => {
    setFilters(prev => ({
      ...prev,
      subcategories: prev.subcategories.includes(subcategory)
        ? prev.subcategories.filter(s => s !== subcategory)
        : [...prev.subcategories, subcategory],
    }))
  }, [])

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Check if any filters are active (different from defaults)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.maxDistance !== DEFAULT_FILTERS.maxDistance ||
      filters.status.length !== DEFAULT_FILTERS.status.length ||
      !filters.status.every(s => DEFAULT_FILTERS.status.includes(s)) ||
      filters.categories.length > 0 ||
      filters.subcategories.length > 0
    )
  }, [filters])

  // Build query string for API
  const buildQueryString = useCallback((lat: number, lon: number): string => {
    const params = new URLSearchParams()
    params.set('lat', lat.toString())
    params.set('lon', lon.toString())

    if (filters.maxDistance !== null) {
      params.set('maxDistance', filters.maxDistance.toString())
    }

    if (filters.status.length > 0) {
      params.set('status', filters.status.join(','))
    }

    if (filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','))
    }

    if (filters.subcategories.length > 0) {
      params.set('subcategories', filters.subcategories.join(','))
    }

    return params.toString()
  }, [filters])

  // Count active filter count (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.maxDistance !== null) count++
    if (filters.status.length !== DEFAULT_FILTERS.status.length ||
        !filters.status.every(s => DEFAULT_FILTERS.status.includes(s))) count++
    if (filters.categories.length > 0) count++
    if (filters.subcategories.length > 0) count++
    return count
  }, [filters])

  return {
    filters,
    setFilters,
    isOpen,
    setIsOpen,
    setDistance,
    toggleStatus,
    toggleCategory,
    toggleSubcategory,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
    buildQueryString,
  }
}

export type UseFiltersReturn = ReturnType<typeof useFilters>
