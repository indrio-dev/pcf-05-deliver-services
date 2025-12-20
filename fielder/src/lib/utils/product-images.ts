/**
 * Category-level placeholder images
 * Uses high-quality generic images per food category rather than specific products
 */

// Category-level placeholder images from Unsplash
// These are generic enough to represent any product in the category
export const CATEGORY_IMAGES: Record<string, string> = {
  // Produce - Fruits
  citrus: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800&h=600&fit=crop&q=80',
  stone_fruit: 'https://images.unsplash.com/photo-1629226182803-39e0fbeb0c37?w=800&h=600&fit=crop&q=80',
  berry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop&q=80',
  pome_fruit: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&h=600&fit=crop&q=80',
  tropical: 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=800&h=600&fit=crop&q=80',
  melon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop&q=80',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&h=600&fit=crop&q=80',

  // Produce - Vegetables
  leafy_greens: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop&q=80',
  root_vegetable: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&h=600&fit=crop&q=80',
  nightshade: 'https://images.unsplash.com/photo-1546470427-227c7369a9b6?w=800&h=600&fit=crop&q=80',
  cruciferous: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&h=600&fit=crop&q=80',
  allium: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&h=600&fit=crop&q=80',
  vegetable: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&h=600&fit=crop&q=80',

  // Animal Products
  beef: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800&h=600&fit=crop&q=80',
  pork: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800&h=600&fit=crop&q=80',
  poultry: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&h=600&fit=crop&q=80',
  meat: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800&h=600&fit=crop&q=80',

  // Dairy & Eggs
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&h=600&fit=crop&q=80',
  eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&h=600&fit=crop&q=80',

  // Seafood
  seafood: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=800&h=600&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=800&h=600&fit=crop&q=80',
  shellfish: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop&q=80',

  // Other
  nuts: 'https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=800&h=600&fit=crop&q=80',
  grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop&q=80',
  honey: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop&q=80',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&h=600&fit=crop&q=80',

  // Generic fallback
  default: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop&q=80',
}

// Map specific product types to their category
const PRODUCT_TO_CATEGORY: Record<string, string> = {
  // Citrus
  orange: 'citrus',
  navel_orange: 'citrus',
  valencia_orange: 'citrus',
  blood_orange: 'citrus',
  grapefruit: 'citrus',
  ruby_red_grapefruit: 'citrus',
  rio_star_grapefruit: 'citrus',
  lemon: 'citrus',
  meyer_lemon: 'citrus',
  lime: 'citrus',
  tangerine: 'citrus',
  mandarin: 'citrus',

  // Stone fruit
  peach: 'stone_fruit',
  nectarine: 'stone_fruit',
  plum: 'stone_fruit',
  apricot: 'stone_fruit',
  cherry: 'stone_fruit',

  // Pome fruit
  apple: 'pome_fruit',
  pear: 'pome_fruit',

  // Berries
  strawberry: 'berry',
  blueberry: 'berry',
  raspberry: 'berry',
  blackberry: 'berry',

  // Vegetables
  tomato: 'nightshade',
  pepper: 'nightshade',
  eggplant: 'nightshade',
  carrot: 'root_vegetable',
  potato: 'root_vegetable',
  beet: 'root_vegetable',
  onion: 'allium',
  garlic: 'allium',
  lettuce: 'leafy_greens',
  spinach: 'leafy_greens',
  kale: 'leafy_greens',
  broccoli: 'cruciferous',
  cauliflower: 'cruciferous',
  cabbage: 'cruciferous',

  // Meats
  beef: 'beef',
  steak: 'beef',
  ground_beef: 'beef',
  pork: 'pork',
  bacon: 'pork',
  ham: 'pork',
  chicken: 'poultry',
  turkey: 'poultry',
  duck: 'poultry',

  // Dairy/Eggs
  milk: 'dairy',
  cheese: 'dairy',
  butter: 'dairy',
  yogurt: 'dairy',
  eggs: 'eggs',
  pasture_eggs: 'eggs',

  // Seafood
  salmon: 'fish',
  tuna: 'fish',
  cod: 'fish',
  shrimp: 'shellfish',
  crab: 'shellfish',
  lobster: 'shellfish',

  // Nuts
  pecan: 'nuts',
  walnut: 'nuts',
  almond: 'nuts',

  // Other
  honey: 'honey',
  maple_syrup: 'honey',
}

/**
 * Get a category-level placeholder image
 *
 * Returns a generic image appropriate for the food category,
 * not a specific product image.
 */
export function getProductImage(
  varietyId: string,
  productId: string,
  category: string,
  _uniqueId?: string  // Kept for API compatibility but not used
): string {
  const varietyKey = varietyId.toLowerCase().replace(/-/g, '_')
  const productKey = productId.toLowerCase().replace(/-/g, '_')
  const categoryKey = category.toLowerCase().replace(/-/g, '_')

  // Try to find the category for this product
  const mappedCategory = PRODUCT_TO_CATEGORY[varietyKey]
    || PRODUCT_TO_CATEGORY[productKey]
    || categoryKey

  // Return the category image, or fall back through the hierarchy
  return CATEGORY_IMAGES[mappedCategory]
    || CATEGORY_IMAGES[categoryKey]
    || CATEGORY_IMAGES.default
}

/**
 * Get image directly by category name
 */
export function getCategoryImage(category: string): string {
  const key = category.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')
  return CATEGORY_IMAGES[key] || CATEGORY_IMAGES.default
}
