/**
 * Product Types - Core taxonomy definitions
 *
 * IMPORTANT: This file is separate to avoid circular dependencies.
 * It contains only the ProductType definitions with NO imports from products.ts
 *
 * Dependency chain:
 *   product-types.ts (this file) ← regional-offering-generator.ts ← products.ts
 */

// =============================================================================
// Category & Subcategory Types
// =============================================================================

export type ProductCategory = 'fruit' | 'vegetable' | 'nut' | 'meat' | 'seafood' | 'dairy' | 'beverage' | 'post_harvest' | 'grain'

export type ProductSubcategory =
  // Fruits
  | 'citrus' | 'stone_fruit' | 'pome_fruit' | 'berry' | 'melon' | 'tropical'
  // Vegetables
  | 'leafy' | 'root' | 'nightshade' | 'squash' | 'cruciferous' | 'allium' | 'legume' | 'corn' | 'specialty_veg'
  // Nuts
  | 'tree_nut' | 'ground_nut'
  // Animal products
  | 'poultry' | 'red_meat' | 'game'
  | 'eggs' | 'milk'
  // Seafood
  | 'fish' | 'shellfish' | 'crustacean'
  // Grains
  | 'whole_grain' | 'specialty_grain'
  // Beverages
  | 'coffee' | 'tea'
  // Post Harvest (Minimally Processed)
  | 'raw_honey' | 'juice' | 'syrup' | 'oil' | 'cider' | 'cured_meat' | 'preserves'

// =============================================================================
// ProductType Interface
// =============================================================================

/**
 * ProductType definition - the classification level (Orange, Beef, Apple, etc.)
 *
 * Hierarchy: Category → Subcategory → ProductType → Variety → Cultivar → Trade Names
 *
 * This is NOT the actual purchasable product - see product-model.ts for Product (SKU).
 * This is the classification level between Subcategory and Variety.
 */
export interface ProductType {
  id: string
  name: string
  displayName: string
  category: ProductCategory       // 'fruit', 'meat', etc.
  subcategory: ProductSubcategory // 'citrus', 'red_meat', etc.
  description?: string
}

// =============================================================================
// PRODUCT TYPES Array
// =============================================================================

export const PRODUCT_TYPES: ProductType[] = [
  // === CITRUS ===
  { id: 'orange', name: 'orange', displayName: 'Orange', category: 'fruit', subcategory: 'citrus', description: 'Sweet citrus fruit' },
  { id: 'grapefruit', name: 'grapefruit', displayName: 'Grapefruit', category: 'fruit', subcategory: 'citrus', description: 'Tangy breakfast citrus' },
  { id: 'tangerine', name: 'tangerine', displayName: 'Tangerine', category: 'fruit', subcategory: 'citrus', description: 'Easy-peel mandarin family' },
  { id: 'lemon', name: 'lemon', displayName: 'Lemon', category: 'fruit', subcategory: 'citrus', description: 'Versatile cooking citrus' },
  { id: 'lime', name: 'lime', displayName: 'Lime', category: 'fruit', subcategory: 'citrus', description: 'Tart tropical citrus' },

  // === STONE FRUIT ===
  { id: 'peach', name: 'peach', displayName: 'Peach', category: 'fruit', subcategory: 'stone_fruit', description: 'Summer stone fruit' },
  { id: 'nectarine', name: 'nectarine', displayName: 'Nectarine', category: 'fruit', subcategory: 'stone_fruit', description: 'Smooth-skinned peach cousin' },
  { id: 'plum', name: 'plum', displayName: 'Plum', category: 'fruit', subcategory: 'stone_fruit', description: 'Sweet and tangy drupes' },
  { id: 'apricot', name: 'apricot', displayName: 'Apricot', category: 'fruit', subcategory: 'stone_fruit', description: 'Early summer stone fruit' },
  { id: 'cherry', name: 'cherry', displayName: 'Cherry', category: 'fruit', subcategory: 'stone_fruit', description: 'Sweet and tart varieties' },

  // === POME FRUIT ===
  { id: 'apple', name: 'apple', displayName: 'Apple', category: 'fruit', subcategory: 'pome_fruit', description: 'Americas favorite fruit' },
  { id: 'pear', name: 'pear', displayName: 'Pear', category: 'fruit', subcategory: 'pome_fruit', description: 'Buttery tree fruit' },
  { id: 'persimmon', name: 'persimmon', displayName: 'Persimmon', category: 'fruit', subcategory: 'pome_fruit', description: 'Sweet fall fruit' },

  // === BERRIES ===
  { id: 'strawberry', name: 'strawberry', displayName: 'Strawberry', category: 'fruit', subcategory: 'berry', description: 'Spring-summer favorite' },
  { id: 'blueberry', name: 'blueberry', displayName: 'Blueberry', category: 'fruit', subcategory: 'berry', description: 'Antioxidant-rich berry' },
  { id: 'raspberry', name: 'raspberry', displayName: 'Raspberry', category: 'fruit', subcategory: 'berry', description: 'Delicate bramble fruit' },
  { id: 'blackberry', name: 'blackberry', displayName: 'Blackberry', category: 'fruit', subcategory: 'berry', description: 'Wild bramble fruit' },
  { id: 'grape', name: 'grape', displayName: 'Grape', category: 'fruit', subcategory: 'berry', description: 'Table and wine varieties' },
  { id: 'cranberry', name: 'cranberry', displayName: 'Cranberry', category: 'fruit', subcategory: 'berry', description: 'Tart bog berry' },

  // === MELONS ===
  { id: 'watermelon', name: 'watermelon', displayName: 'Watermelon', category: 'fruit', subcategory: 'melon', description: 'Summer picnic staple' },
  { id: 'cantaloupe', name: 'cantaloupe', displayName: 'Cantaloupe', category: 'fruit', subcategory: 'melon', description: 'Sweet muskmelon' },
  { id: 'honeydew', name: 'honeydew', displayName: 'Honeydew', category: 'fruit', subcategory: 'melon', description: 'Mild green melon' },

  // === TROPICAL ===
  { id: 'avocado', name: 'avocado', displayName: 'Avocado', category: 'fruit', subcategory: 'tropical', description: 'Creamy fruit-vegetable' },
  { id: 'mango', name: 'mango', displayName: 'Mango', category: 'fruit', subcategory: 'tropical', description: 'King of tropical fruits' },
  { id: 'fig', name: 'fig', displayName: 'Fig', category: 'fruit', subcategory: 'tropical', description: 'Ancient sweet fruit' },
  { id: 'pomegranate', name: 'pomegranate', displayName: 'Pomegranate', category: 'fruit', subcategory: 'tropical', description: 'Jewel-seeded fruit' },

  // === LEAFY GREENS ===
  { id: 'lettuce', name: 'lettuce', displayName: 'Lettuce', category: 'vegetable', subcategory: 'leafy', description: 'Salad foundation' },
  { id: 'spinach', name: 'spinach', displayName: 'Spinach', category: 'vegetable', subcategory: 'leafy', description: 'Nutrient-dense green' },
  { id: 'kale', name: 'kale', displayName: 'Kale', category: 'vegetable', subcategory: 'leafy', description: 'Cold-hardy superfood' },
  { id: 'arugula', name: 'arugula', displayName: 'Arugula', category: 'vegetable', subcategory: 'leafy', description: 'Peppery salad green' },
  { id: 'chard', name: 'chard', displayName: 'Swiss Chard', category: 'vegetable', subcategory: 'leafy', description: 'Colorful cooking green' },
  { id: 'collards', name: 'collards', displayName: 'Collard Greens', category: 'vegetable', subcategory: 'leafy', description: 'Southern staple' },

  // === ROOT VEGETABLES ===
  { id: 'carrot', name: 'carrot', displayName: 'Carrot', category: 'vegetable', subcategory: 'root', description: 'Sweet orange root' },
  { id: 'potato', name: 'potato', displayName: 'Potato', category: 'vegetable', subcategory: 'root', description: 'Versatile tuber' },
  { id: 'sweet_potato', name: 'sweet_potato', displayName: 'Sweet Potato', category: 'vegetable', subcategory: 'root', description: 'Nutritious orange tuber' },
  { id: 'beet', name: 'beet', displayName: 'Beet', category: 'vegetable', subcategory: 'root', description: 'Earthy root vegetable' },
  { id: 'radish', name: 'radish', displayName: 'Radish', category: 'vegetable', subcategory: 'root', description: 'Quick-growing root' },
  { id: 'turnip', name: 'turnip', displayName: 'Turnip', category: 'vegetable', subcategory: 'root', description: 'Cool-weather root' },

  // === NIGHTSHADES ===
  { id: 'tomato', name: 'tomato', displayName: 'Tomato', category: 'vegetable', subcategory: 'nightshade', description: 'Summer garden essential' },
  { id: 'pepper', name: 'pepper', displayName: 'Pepper', category: 'vegetable', subcategory: 'nightshade', description: 'Sweet and hot varieties' },
  { id: 'eggplant', name: 'eggplant', displayName: 'Eggplant', category: 'vegetable', subcategory: 'nightshade', description: 'Purple cooking vegetable' },

  // === SQUASH ===
  { id: 'zucchini', name: 'zucchini', displayName: 'Zucchini', category: 'vegetable', subcategory: 'squash', description: 'Summer squash' },
  { id: 'butternut', name: 'butternut', displayName: 'Butternut Squash', category: 'vegetable', subcategory: 'squash', description: 'Sweet winter squash' },
  { id: 'acorn', name: 'acorn', displayName: 'Acorn Squash', category: 'vegetable', subcategory: 'squash', description: 'Small winter squash' },
  { id: 'pumpkin', name: 'pumpkin', displayName: 'Pumpkin', category: 'vegetable', subcategory: 'squash', description: 'Fall icon' },

  // === CRUCIFEROUS ===
  { id: 'broccoli', name: 'broccoli', displayName: 'Broccoli', category: 'vegetable', subcategory: 'cruciferous', description: 'Nutrient powerhouse' },
  { id: 'cauliflower', name: 'cauliflower', displayName: 'Cauliflower', category: 'vegetable', subcategory: 'cruciferous', description: 'Versatile crucifer' },
  { id: 'cabbage', name: 'cabbage', displayName: 'Cabbage', category: 'vegetable', subcategory: 'cruciferous', description: 'Head vegetable' },
  { id: 'brussels_sprouts', name: 'brussels_sprouts', displayName: 'Brussels Sprouts', category: 'vegetable', subcategory: 'cruciferous', description: 'Mini cabbages' },

  // === ALLIUMS ===
  { id: 'onion', name: 'onion', displayName: 'Onion', category: 'vegetable', subcategory: 'allium', description: 'Cooking foundation' },
  { id: 'garlic', name: 'garlic', displayName: 'Garlic', category: 'vegetable', subcategory: 'allium', description: 'Flavor essential' },
  { id: 'leek', name: 'leek', displayName: 'Leek', category: 'vegetable', subcategory: 'allium', description: 'Mild onion cousin' },

  // === LEGUMES ===
  { id: 'green_bean', name: 'green_bean', displayName: 'Green Bean', category: 'vegetable', subcategory: 'legume', description: 'Snap bean' },
  { id: 'pea', name: 'pea', displayName: 'Pea', category: 'vegetable', subcategory: 'legume', description: 'Sweet garden pea' },

  // === TREE NUTS ===
  { id: 'pecan', name: 'pecan', displayName: 'Pecan', category: 'nut', subcategory: 'tree_nut', description: 'Southern nut' },
  { id: 'walnut', name: 'walnut', displayName: 'Walnut', category: 'nut', subcategory: 'tree_nut', description: 'Brain-shaped nut' },
  { id: 'almond', name: 'almond', displayName: 'Almond', category: 'nut', subcategory: 'tree_nut', description: 'California staple' },
  { id: 'hazelnut', name: 'hazelnut', displayName: 'Hazelnut', category: 'nut', subcategory: 'tree_nut', description: 'Oregon filbert' },
  { id: 'pistachio', name: 'pistachio', displayName: 'Pistachio', category: 'nut', subcategory: 'tree_nut', description: 'Green desert nut' },

  // === GROUND NUTS ===
  { id: 'peanut', name: 'peanut', displayName: 'Peanut', category: 'nut', subcategory: 'ground_nut', description: 'Southern groundnut' },

  // === MEAT ===
  { id: 'beef', name: 'beef', displayName: 'Beef', category: 'meat', subcategory: 'red_meat', description: 'Pasture-raised cattle' },
  { id: 'pork', name: 'pork', displayName: 'Pork', category: 'meat', subcategory: 'red_meat', description: 'Heritage breeds' },
  { id: 'lamb', name: 'lamb', displayName: 'Lamb', category: 'meat', subcategory: 'red_meat', description: 'Spring lamb' },
  { id: 'chicken', name: 'chicken', displayName: 'Chicken', category: 'meat', subcategory: 'poultry', description: 'Pasture-raised poultry' },
  { id: 'turkey', name: 'turkey', displayName: 'Turkey', category: 'meat', subcategory: 'poultry', description: 'Heritage turkey' },

  // === DAIRY/EGGS ===
  { id: 'eggs', name: 'eggs', displayName: 'Eggs', category: 'dairy', subcategory: 'eggs', description: 'Pasture-raised eggs' },
  { id: 'milk', name: 'milk', displayName: 'Milk', category: 'dairy', subcategory: 'milk', description: 'Grass-fed dairy' },
  { id: 'cheese', name: 'cheese', displayName: 'Cheese', category: 'dairy', subcategory: 'milk', description: 'Artisan cheese' },

  // === HONEY ===
  { id: 'honey', name: 'honey', displayName: 'Honey', category: 'post_harvest', subcategory: 'raw_honey', description: 'Raw local honey' },

  // === PROCESSED ===
  { id: 'orange_juice', name: 'orange_juice', displayName: 'Orange Juice', category: 'post_harvest', subcategory: 'juice', description: 'Fresh-squeezed OJ' },
  { id: 'apple_cider', name: 'apple_cider', displayName: 'Apple Cider', category: 'post_harvest', subcategory: 'cider', description: 'Fresh pressed cider' },
  { id: 'maple_syrup', name: 'maple_syrup', displayName: 'Maple Syrup', category: 'post_harvest', subcategory: 'syrup', description: 'Pure maple' },
  { id: 'olive_oil', name: 'olive_oil', displayName: 'Olive Oil', category: 'post_harvest', subcategory: 'oil', description: 'Fresh EVOO' },

  // === SEAFOOD - FISH ===
  { id: 'salmon', name: 'salmon', displayName: 'Salmon', category: 'seafood', subcategory: 'fish', description: 'Wild-caught Pacific salmon' },
  { id: 'halibut', name: 'halibut', displayName: 'Halibut', category: 'seafood', subcategory: 'fish', description: 'Premium white fish' },
  { id: 'catfish', name: 'catfish', displayName: 'Catfish', category: 'seafood', subcategory: 'fish', description: 'Southern farm-raised' },
  { id: 'trout', name: 'trout', displayName: 'Trout', category: 'seafood', subcategory: 'fish', description: 'Freshwater delicacy' },
  { id: 'tuna', name: 'tuna', displayName: 'Tuna', category: 'seafood', subcategory: 'fish', description: 'Fresh-caught tuna' },

  // === SEAFOOD - SHELLFISH ===
  { id: 'oyster', name: 'oyster', displayName: 'Oyster', category: 'seafood', subcategory: 'shellfish', description: 'Farmed and wild oysters' },
  { id: 'clam', name: 'clam', displayName: 'Clam', category: 'seafood', subcategory: 'shellfish', description: 'Hard and soft shell' },
  { id: 'mussel', name: 'mussel', displayName: 'Mussel', category: 'seafood', subcategory: 'shellfish', description: 'Blue and Mediterranean' },
  { id: 'scallop', name: 'scallop', displayName: 'Scallop', category: 'seafood', subcategory: 'shellfish', description: 'Day-boat scallops' },

  // === SEAFOOD - CRUSTACEAN ===
  { id: 'crab', name: 'crab', displayName: 'Crab', category: 'seafood', subcategory: 'crustacean', description: 'Blue, Dungeness, King' },
  { id: 'lobster', name: 'lobster', displayName: 'Lobster', category: 'seafood', subcategory: 'crustacean', description: 'Maine lobster' },
  { id: 'shrimp', name: 'shrimp', displayName: 'Shrimp', category: 'seafood', subcategory: 'crustacean', description: 'Gulf and wild-caught' },
  { id: 'crawfish', name: 'crawfish', displayName: 'Crawfish', category: 'seafood', subcategory: 'crustacean', description: 'Louisiana mudbugs' },

  // === GAME MEATS ===
  { id: 'bison', name: 'bison', displayName: 'Bison', category: 'meat', subcategory: 'game', description: 'Grass-fed American bison' },
  { id: 'elk', name: 'elk', displayName: 'Elk', category: 'meat', subcategory: 'game', description: 'Farm-raised elk' },
  { id: 'venison', name: 'venison', displayName: 'Venison', category: 'meat', subcategory: 'game', description: 'Farm-raised deer' },
  { id: 'duck', name: 'duck', displayName: 'Duck', category: 'meat', subcategory: 'poultry', description: 'Pekin and Muscovy' },
  { id: 'goose', name: 'goose', displayName: 'Goose', category: 'meat', subcategory: 'poultry', description: 'Heritage goose' },
  { id: 'quail', name: 'quail', displayName: 'Quail', category: 'meat', subcategory: 'poultry', description: 'Bobwhite and Coturnix' },
  { id: 'goat', name: 'goat', displayName: 'Goat', category: 'meat', subcategory: 'red_meat', description: 'Cabrito and chevon' },
  { id: 'rabbit', name: 'rabbit', displayName: 'Rabbit', category: 'meat', subcategory: 'game', description: 'Farm-raised rabbit' },

  // === TROPICAL FRUITS (expanded) ===
  { id: 'papaya', name: 'papaya', displayName: 'Papaya', category: 'fruit', subcategory: 'tropical', description: 'Hawaiian and Mexican' },
  { id: 'dragon_fruit', name: 'dragon_fruit', displayName: 'Dragon Fruit', category: 'fruit', subcategory: 'tropical', description: 'Pitaya cactus fruit' },
  { id: 'passion_fruit', name: 'passion_fruit', displayName: 'Passion Fruit', category: 'fruit', subcategory: 'tropical', description: 'Lilikoi' },
  { id: 'guava', name: 'guava', displayName: 'Guava', category: 'fruit', subcategory: 'tropical', description: 'Tropical aromatic fruit' },
  { id: 'lychee', name: 'lychee', displayName: 'Lychee', category: 'fruit', subcategory: 'tropical', description: 'Sweet Asian fruit' },
  { id: 'longan', name: 'longan', displayName: 'Longan', category: 'fruit', subcategory: 'tropical', description: 'Dragons eye fruit' },
  { id: 'starfruit', name: 'starfruit', displayName: 'Starfruit', category: 'fruit', subcategory: 'tropical', description: 'Carambola' },
  { id: 'jackfruit', name: 'jackfruit', displayName: 'Jackfruit', category: 'fruit', subcategory: 'tropical', description: 'Giant tropical fruit' },
  { id: 'mamey', name: 'mamey', displayName: 'Mamey Sapote', category: 'fruit', subcategory: 'tropical', description: 'Cuban favorite' },
  { id: 'sapodilla', name: 'sapodilla', displayName: 'Sapodilla', category: 'fruit', subcategory: 'tropical', description: 'Brown sugar fruit' },
  { id: 'atemoya', name: 'atemoya', displayName: 'Atemoya', category: 'fruit', subcategory: 'tropical', description: 'Custard apple hybrid' },
  { id: 'cherimoya', name: 'cherimoya', displayName: 'Cherimoya', category: 'fruit', subcategory: 'tropical', description: 'Ice cream fruit' },
  { id: 'banana', name: 'banana', displayName: 'Banana', category: 'fruit', subcategory: 'tropical', description: 'Tropical staple' },
  { id: 'plantain', name: 'plantain', displayName: 'Plantain', category: 'fruit', subcategory: 'tropical', description: 'Cooking banana' },
  { id: 'coconut', name: 'coconut', displayName: 'Coconut', category: 'fruit', subcategory: 'tropical', description: 'Young and mature coconut' },
  { id: 'pineapple', name: 'pineapple', displayName: 'Pineapple', category: 'fruit', subcategory: 'tropical', description: 'Hawaiian gold' },
  { id: 'date', name: 'date', displayName: 'Date', category: 'fruit', subcategory: 'tropical', description: 'Desert palm fruit' },

  // === SPECIALTY VEGETABLES ===
  { id: 'hatch_chile', name: 'hatch_chile', displayName: 'Hatch Chile', category: 'vegetable', subcategory: 'specialty_veg', description: 'New Mexico iconic' },
  { id: 'datil_pepper', name: 'datil_pepper', displayName: 'Datil Pepper', category: 'vegetable', subcategory: 'specialty_veg', description: 'St. Augustine specialty' },
  { id: 'vidalia_onion', name: 'vidalia_onion', displayName: 'Vidalia Onion', category: 'vegetable', subcategory: 'specialty_veg', description: 'Georgia sweet onion' },
  { id: 'walla_walla_onion', name: 'walla_walla_onion', displayName: 'Walla Walla Onion', category: 'vegetable', subcategory: 'specialty_veg', description: 'Washington sweet onion' },
  { id: 'ramp', name: 'ramp', displayName: 'Ramp', category: 'vegetable', subcategory: 'specialty_veg', description: 'Wild leek' },
  { id: 'fiddlehead', name: 'fiddlehead', displayName: 'Fiddlehead Fern', category: 'vegetable', subcategory: 'specialty_veg', description: 'Spring delicacy' },
  { id: 'morel', name: 'morel', displayName: 'Morel Mushroom', category: 'vegetable', subcategory: 'specialty_veg', description: 'Wild spring mushroom' },
  { id: 'chanterelle', name: 'chanterelle', displayName: 'Chanterelle', category: 'vegetable', subcategory: 'specialty_veg', description: 'Golden forest mushroom' },
  { id: 'artichoke', name: 'artichoke', displayName: 'Artichoke', category: 'vegetable', subcategory: 'specialty_veg', description: 'California thistle' },
  { id: 'asparagus', name: 'asparagus', displayName: 'Asparagus', category: 'vegetable', subcategory: 'specialty_veg', description: 'Spring perennial' },
  { id: 'taro', name: 'taro', displayName: 'Taro', category: 'vegetable', subcategory: 'root', description: 'Hawaiian poi root' },

  // === ADDITIONAL TREE NUTS ===
  { id: 'macadamia', name: 'macadamia', displayName: 'Macadamia', category: 'nut', subcategory: 'tree_nut', description: 'Hawaiian specialty' },
  { id: 'chestnut', name: 'chestnut', displayName: 'Chestnut', category: 'nut', subcategory: 'tree_nut', description: 'Roasting nut' },
  { id: 'pine_nut', name: 'pine_nut', displayName: 'Pine Nut', category: 'nut', subcategory: 'tree_nut', description: 'Pinyon pine seed' },

  // === COFFEE & TEA ===
  { id: 'coffee', name: 'coffee', displayName: 'Coffee', category: 'beverage', subcategory: 'coffee', description: 'Specialty coffee beans' },
  { id: 'yaupon_tea', name: 'yaupon_tea', displayName: 'Yaupon Tea', category: 'beverage', subcategory: 'tea', description: 'Native American holly' },
  { id: 'cacao', name: 'cacao', displayName: 'Cacao', category: 'beverage', subcategory: 'coffee', description: 'Chocolate bean' },

  // === GRAINS ===
  { id: 'wild_rice', name: 'wild_rice', displayName: 'Wild Rice', category: 'grain', subcategory: 'specialty_grain', description: 'Native grain' },
  { id: 'popcorn', name: 'popcorn', displayName: 'Popcorn', category: 'grain', subcategory: 'specialty_grain', description: 'Specialty popping corn' },
  { id: 'wheat', name: 'wheat', displayName: 'Wheat', category: 'grain', subcategory: 'whole_grain', description: 'Heritage wheat varieties' },
  { id: 'oat', name: 'oat', displayName: 'Oat', category: 'grain', subcategory: 'whole_grain', description: 'Whole grain oats' },
  { id: 'sorghum', name: 'sorghum', displayName: 'Sorghum', category: 'grain', subcategory: 'specialty_grain', description: 'Ancient grain' },

  // === ADDITIONAL DAIRY ===
  { id: 'butter', name: 'butter', displayName: 'Butter', category: 'dairy', subcategory: 'milk', description: 'Cultured butter' },
  { id: 'yogurt', name: 'yogurt', displayName: 'Yogurt', category: 'dairy', subcategory: 'milk', description: 'Artisan yogurt' },
  { id: 'goat_cheese', name: 'goat_cheese', displayName: 'Goat Cheese', category: 'dairy', subcategory: 'milk', description: 'Chevre and aged' },
  { id: 'sheep_cheese', name: 'sheep_cheese', displayName: 'Sheep Cheese', category: 'dairy', subcategory: 'milk', description: 'Manchego style' },

  // === ADDITIONAL SYRUPS & SPECIALTIES ===
  { id: 'birch_syrup', name: 'birch_syrup', displayName: 'Birch Syrup', category: 'post_harvest', subcategory: 'syrup', description: 'Alaskan specialty' },
  { id: 'sorghum_syrup', name: 'sorghum_syrup', displayName: 'Sorghum Syrup', category: 'post_harvest', subcategory: 'syrup', description: 'Southern sweetener' },
  { id: 'agave', name: 'agave', displayName: 'Agave Nectar', category: 'post_harvest', subcategory: 'syrup', description: 'Desert plant sweetener' },

  // === CURED MEATS ===
  { id: 'country_ham', name: 'country_ham', displayName: 'Country Ham', category: 'post_harvest', subcategory: 'cured_meat', description: 'Dry-cured ham' },
  { id: 'bacon', name: 'bacon', displayName: 'Bacon', category: 'post_harvest', subcategory: 'cured_meat', description: 'Artisan smoked bacon' },
  { id: 'jerky', name: 'jerky', displayName: 'Jerky', category: 'post_harvest', subcategory: 'cured_meat', description: 'Beef and game jerky' },
  { id: 'andouille', name: 'andouille', displayName: 'Andouille', category: 'post_harvest', subcategory: 'cured_meat', description: 'Cajun smoked sausage' },
  { id: 'boudin', name: 'boudin', displayName: 'Boudin', category: 'post_harvest', subcategory: 'cured_meat', description: 'Louisiana rice sausage' },

  // === ADDITIONAL BERRIES ===
  { id: 'huckleberry', name: 'huckleberry', displayName: 'Huckleberry', category: 'fruit', subcategory: 'berry', description: 'Wild mountain berry' },
  { id: 'elderberry', name: 'elderberry', displayName: 'Elderberry', category: 'fruit', subcategory: 'berry', description: 'Medicinal berry' },
  { id: 'muscadine', name: 'muscadine', displayName: 'Muscadine', category: 'fruit', subcategory: 'berry', description: 'Southern native grape' },
  { id: 'thimbleberry', name: 'thimbleberry', displayName: 'Thimbleberry', category: 'fruit', subcategory: 'berry', description: 'Michigan UP specialty' },

  // === WINE GRAPES ===
  { id: 'wine_grape', name: 'wine_grape', displayName: 'Wine Grape', category: 'fruit', subcategory: 'berry', description: 'Vitis vinifera' },

  // === ADDITIONAL CITRUS ===
  { id: 'kumquat', name: 'kumquat', displayName: 'Kumquat', category: 'fruit', subcategory: 'citrus', description: 'Tiny whole-eating citrus' },
  { id: 'calamondin', name: 'calamondin', displayName: 'Calamondin', category: 'fruit', subcategory: 'citrus', description: 'Calamansi citrus' },
  { id: 'key_lime', name: 'key_lime', displayName: 'Key Lime', category: 'fruit', subcategory: 'citrus', description: 'Florida Keys lime' },
  { id: 'meyer_lemon', name: 'meyer_lemon', displayName: 'Meyer Lemon', category: 'fruit', subcategory: 'citrus', description: 'Sweet lemon hybrid' },

  // === ADDITIONAL OILS ===
  { id: 'pecan_oil', name: 'pecan_oil', displayName: 'Pecan Oil', category: 'post_harvest', subcategory: 'oil', description: 'Southern nut oil' },
  { id: 'walnut_oil', name: 'walnut_oil', displayName: 'Walnut Oil', category: 'post_harvest', subcategory: 'oil', description: 'California walnut oil' },
  { id: 'avocado_oil', name: 'avocado_oil', displayName: 'Avocado Oil', category: 'post_harvest', subcategory: 'oil', description: 'High heat cooking oil' },
]

// =============================================================================
// Lookup Maps
// =============================================================================

export const PRODUCT_TYPES_BY_ID: Record<string, ProductType> = Object.fromEntries(
  PRODUCT_TYPES.map(p => [p.id, p])
)

// Aliases for backwards compatibility
export const PRODUCTS = PRODUCT_TYPES
export const PRODUCTS_BY_ID = PRODUCT_TYPES_BY_ID
