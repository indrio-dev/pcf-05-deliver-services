/**
 * Category Icons - Simple SVG icons for food categories
 * Used as placeholders instead of product photos
 */

interface CategoryIconProps {
  category: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  showLabel?: boolean
}

// Color palette for categories
const CATEGORY_COLORS: Record<string, { bg: string; icon: string; text: string }> = {
  citrus: { bg: 'bg-amber-100', icon: 'text-amber-600', text: 'text-amber-800' },
  stone_fruit: { bg: 'bg-rose-100', icon: 'text-rose-500', text: 'text-rose-800' },
  berry: { bg: 'bg-purple-100', icon: 'text-purple-500', text: 'text-purple-800' },
  pome_fruit: { bg: 'bg-red-100', icon: 'text-red-500', text: 'text-red-800' },
  tropical: { bg: 'bg-yellow-100', icon: 'text-yellow-600', text: 'text-yellow-800' },
  melon: { bg: 'bg-green-100', icon: 'text-green-500', text: 'text-green-800' },
  fruit: { bg: 'bg-orange-100', icon: 'text-orange-500', text: 'text-orange-800' },
  leafy_greens: { bg: 'bg-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-800' },
  root_vegetable: { bg: 'bg-orange-100', icon: 'text-orange-600', text: 'text-orange-800' },
  nightshade: { bg: 'bg-red-100', icon: 'text-red-600', text: 'text-red-800' },
  cruciferous: { bg: 'bg-lime-100', icon: 'text-lime-600', text: 'text-lime-800' },
  vegetable: { bg: 'bg-green-100', icon: 'text-green-600', text: 'text-green-800' },
  beef: { bg: 'bg-rose-100', icon: 'text-rose-700', text: 'text-rose-900' },
  pork: { bg: 'bg-pink-100', icon: 'text-pink-600', text: 'text-pink-800' },
  poultry: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-800' },
  meat: { bg: 'bg-rose-100', icon: 'text-rose-700', text: 'text-rose-900' },
  dairy: { bg: 'bg-sky-100', icon: 'text-sky-600', text: 'text-sky-800' },
  eggs: { bg: 'bg-yellow-50', icon: 'text-yellow-500', text: 'text-yellow-800' },
  seafood: { bg: 'bg-cyan-100', icon: 'text-cyan-600', text: 'text-cyan-800' },
  fish: { bg: 'bg-blue-100', icon: 'text-blue-500', text: 'text-blue-800' },
  shellfish: { bg: 'bg-teal-100', icon: 'text-teal-600', text: 'text-teal-800' },
  nuts: { bg: 'bg-amber-100', icon: 'text-amber-700', text: 'text-amber-900' },
  honey: { bg: 'bg-yellow-100', icon: 'text-yellow-600', text: 'text-yellow-800' },
  default: { bg: 'bg-stone-100', icon: 'text-stone-500', text: 'text-stone-700' },
}

// Size classes
const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  full: 'w-full h-full',
}

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  citrus: 'Citrus',
  stone_fruit: 'Stone Fruit',
  berry: 'Berries',
  pome_fruit: 'Pome Fruit',
  tropical: 'Tropical',
  melon: 'Melons',
  fruit: 'Fruit',
  leafy_greens: 'Leafy Greens',
  root_vegetable: 'Root Vegetables',
  nightshade: 'Nightshades',
  cruciferous: 'Cruciferous',
  vegetable: 'Vegetables',
  beef: 'Beef',
  pork: 'Pork',
  poultry: 'Poultry',
  meat: 'Meat',
  dairy: 'Dairy',
  eggs: 'Eggs',
  seafood: 'Seafood',
  fish: 'Fish',
  shellfish: 'Shellfish',
  nuts: 'Nuts',
  honey: 'Honey',
}

// Simple SVG icons for each category
function CategorySVG({ category, className }: { category: string; className?: string }) {
  const iconClass = `${className || 'w-full h-full'}`

  switch (category) {
    case 'citrus':
      // Orange slice
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18M6.3 6.3l11.4 11.4M6.3 17.7l11.4-11.4" />
        </svg>
      )

    case 'stone_fruit':
    case 'pome_fruit':
    case 'fruit':
      // Apple/fruit shape
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2c-1 0-2 .5-2 2M17 8c3 1 4 4 4 6 0 4-3 7-6 7-1.5 0-2.5-.5-3-1-.5.5-1.5 1-3 1-3 0-6-3-6-7 0-2 1-5 4-6 1-.3 2-.3 3 0 1-.3 2-.3 3 0z" />
          <path d="M12 2c0 2 2 4 4 4" />
        </svg>
      )

    case 'berry':
      // Berry cluster
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="14" r="4" />
          <circle cx="16" cy="14" r="4" />
          <circle cx="12" cy="8" r="4" />
          <path d="M12 4V2M10 4l-1-2M14 4l1-2" />
        </svg>
      )

    case 'tropical':
    case 'melon':
      // Pineapple/tropical
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="14" rx="6" ry="7" />
          <path d="M12 7V3M9 5l-2-3M15 5l2-3M7 7l-3-2M17 7l3-2" />
          <path d="M9 11l6 6M9 17l6-6" />
        </svg>
      )

    case 'leafy_greens':
    case 'vegetable':
      // Leaf
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 21c4-4 6-9 6-14 0 5 2 10 6 14" />
          <path d="M12 7c-2 4-2 8 0 12" />
          <path d="M4 12c2-1 4-1 6 0" />
          <path d="M14 12c2-1 4-1 6 0" />
        </svg>
      )

    case 'root_vegetable':
      // Carrot shape
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 4c-1 0-2 1-2 2s1 2 2 2c1 0 2-1 2-2s-1-2-2-2z" />
          <path d="M8 6c-1-1-2-1-3 0M16 6c1-1 2-1 3 0" />
          <path d="M12 8l-2 13M12 8l2 13M12 8v13" />
        </svg>
      )

    case 'nightshade':
      // Tomato
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 5c-1-2-3-2-4-1M12 5c1-2 3-2 4-1" />
          <path d="M8 5c-1-1-2 0-2 1M16 5c1-1 2 0 2 1" />
        </svg>
      )

    case 'cruciferous':
      // Broccoli
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="3" />
          <circle cx="8" cy="10" r="3" />
          <circle cx="16" cy="10" r="3" />
          <path d="M12 14v7M10 16l2-2 2 2" />
        </svg>
      )

    case 'beef':
    case 'meat':
      // Steak
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="12" rx="9" ry="7" />
          <ellipse cx="12" cy="12" rx="5" ry="3" />
          <path d="M9 10c0 1 .5 2 1.5 2M15 10c0 1-.5 2-1.5 2" />
        </svg>
      )

    case 'pork':
      // Ham/pork
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="12" rx="8" ry="6" />
          <path d="M4 12c0-2 1-4 3-5M20 12c0-2-1-4-3-5" />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
        </svg>
      )

    case 'poultry':
      // Drumstick
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="14" cy="8" rx="5" ry="4" />
          <path d="M10 11l-5 8M8 17l4 2M5 19l2 2" />
        </svg>
      )

    case 'dairy':
      // Milk drop
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3c-4 5-6 8-6 11a6 6 0 0012 0c0-3-2-6-6-11z" />
        </svg>
      )

    case 'eggs':
      // Egg
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="13" rx="7" ry="8" />
          <ellipse cx="12" cy="11" rx="5" ry="6" strokeDasharray="2 2" />
        </svg>
      )

    case 'seafood':
    case 'fish':
      // Fish
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12c3-4 7-6 12-6 2 0 4 1 6 2l-3 4 3 4c-2 1-4 2-6 2-5 0-9-2-12-6z" />
          <circle cx="16" cy="10" r="1" fill="currentColor" />
          <path d="M8 10c1 1 1 3 0 4" />
        </svg>
      )

    case 'shellfish':
      // Shell
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 18c2-8 6-12 8-12s6 4 8 12" />
          <path d="M6 18l6-10 6 10" />
          <path d="M8 18l4-6 4 6" />
          <path d="M4 18h16" />
        </svg>
      )

    case 'nuts':
      // Nut
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="14" rx="6" ry="5" />
          <path d="M8 10c0-3 2-5 4-5s4 2 4 5" />
          <path d="M12 9v2" />
        </svg>
      )

    case 'honey':
      // Honeycomb
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l4 3v5l-4 3-4-3V5l4-3z" />
          <path d="M12 13l4 3v5l-4 3-4-3v-5l4-3z" />
          <path d="M4 7l4 3v5l-4 3" />
          <path d="M20 7l-4 3v5l4 3" />
        </svg>
      )

    default:
      // Generic food icon
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      )
  }
}

export function CategoryIcon({ category, className, size = 'full', showLabel = true }: CategoryIconProps) {
  const normalizedCategory = category.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')
  const colors = CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.default
  const label = CATEGORY_LABELS[normalizedCategory] || category
  const sizeClass = SIZE_CLASSES[size]

  return (
    <div className={`${colors.bg} ${className || ''} flex flex-col items-center justify-center p-4`}>
      <div className={`${sizeClass} ${colors.icon}`}>
        <CategorySVG category={normalizedCategory} />
      </div>
      {showLabel && (
        <span className={`mt-2 font-mono text-xs uppercase tracking-wider ${colors.text}`}>
          {label}
        </span>
      )}
    </div>
  )
}

// For use in place of Image components - returns a data URL or renders directly
export function CategoryPlaceholder({
  category,
  alt,
  className
}: {
  category: string
  alt?: string
  className?: string
}) {
  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <CategoryIcon category={category} showLabel={true} />
    </div>
  )
}

// Get category from product/variety ID
export function getCategoryFromProduct(varietyId: string, productId: string, category: string): string {
  const varietyKey = varietyId.toLowerCase().replace(/-/g, '_')
  const productKey = productId.toLowerCase().replace(/-/g, '_')

  // Map products to categories
  const productToCategory: Record<string, string> = {
    // Citrus
    orange: 'citrus', navel_orange: 'citrus', valencia_orange: 'citrus',
    grapefruit: 'citrus', ruby_red_grapefruit: 'citrus', rio_star_grapefruit: 'citrus',
    lemon: 'citrus', meyer_lemon: 'citrus', lime: 'citrus', tangerine: 'citrus',
    // Stone fruit
    peach: 'stone_fruit', cherry: 'stone_fruit', plum: 'stone_fruit',
    apricot: 'stone_fruit', nectarine: 'stone_fruit',
    // Berries
    strawberry: 'berry', blueberry: 'berry', raspberry: 'berry', blackberry: 'berry',
    // Pome
    apple: 'pome_fruit', pear: 'pome_fruit',
    // Vegetables
    tomato: 'nightshade', pepper: 'nightshade',
    carrot: 'root_vegetable', potato: 'root_vegetable',
    // Meats
    beef: 'beef', steak: 'beef', pork: 'pork', chicken: 'poultry',
    // Other
    eggs: 'eggs', salmon: 'fish', shrimp: 'shellfish',
  }

  return productToCategory[varietyKey] || productToCategory[productKey] || category || 'fruit'
}

export default CategoryIcon
