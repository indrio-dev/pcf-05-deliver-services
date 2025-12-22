/**
 * Crop Taxonomy and Cultivar Seed Data
 *
 * Seeds the knowledge graph with:
 * - Categories (fruit, vegetable, nut, herb)
 * - Subcategories (citrus, stone_fruit, berry, etc.)
 * - Product types (orange, peach, blueberry, etc.)
 * - Varieties and Cultivars with GDD data
 * - Rootstocks with quality modifiers
 */

import { runWriteTransaction } from './neo4j'

// =============================================================================
// CROP TAXONOMY
// =============================================================================

interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  lifecycle: string
  productTypes: ProductType[]
}

interface ProductType {
  id: string
  name: string
  scientificName?: string
  varieties?: Variety[]
}

interface Variety {
  id: string
  name: string
  cultivars?: Cultivar[]
}

interface Cultivar {
  id: string
  name: string
  tradeName?: string
  heritageIntent?: string
  lifecycle: string
  // GDD data
  baseTemp: number
  maxTemp?: number
  gddToMaturity: number
  gddToPeak?: number
  gddWindow: number
  chillHoursRequired?: number
  // Quality
  brixPotentialMin?: number
  brixPotentialMax?: number
  // Maturity
  primeAgeRangeYears?: [number, number]
  yearsToFirstBearing?: number
  productiveLifespanYears?: number
}

const CROP_TAXONOMY: Category[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    subcategories: [
      {
        id: 'citrus',
        name: 'Citrus',
        lifecycle: 'tree_perennial',
        productTypes: [
          {
            id: 'orange',
            name: 'Orange',
            scientificName: 'Citrus sinensis',
            varieties: [
              {
                id: 'navel',
                name: 'Navel Orange',
                cultivars: [
                  { id: 'washington_navel', name: 'Washington Navel', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5100, gddToPeak: 6100, gddWindow: 3500, brixPotentialMin: 11, brixPotentialMax: 14, primeAgeRangeYears: [8, 18], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                  { id: 'cara_cara', name: 'Cara Cara', heritageIntent: 'modern_nutrient', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5200, gddToPeak: 6200, gddWindow: 3000, brixPotentialMin: 11, brixPotentialMax: 14, primeAgeRangeYears: [8, 18], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                  { id: 'lane_late', name: 'Lane Late', heritageIntent: 'commercial', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 6000, gddToPeak: 7000, gddWindow: 2500, brixPotentialMin: 10, brixPotentialMax: 12, primeAgeRangeYears: [8, 18], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                ]
              },
              {
                id: 'valencia',
                name: 'Valencia Orange',
                cultivars: [
                  { id: 'valencia', name: 'Valencia', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 8000, gddToPeak: 9000, gddWindow: 2200, brixPotentialMin: 11, brixPotentialMax: 13, primeAgeRangeYears: [8, 18], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                ]
              },
              {
                id: 'blood_orange',
                name: 'Blood Orange',
                cultivars: [
                  { id: 'moro', name: 'Moro', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5500, gddToPeak: 6500, gddWindow: 2000, brixPotentialMin: 10, brixPotentialMax: 13, primeAgeRangeYears: [8, 18], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                  { id: 'tarocco', name: 'Tarocco', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5600, gddToPeak: 6600, gddWindow: 2000, brixPotentialMin: 11, brixPotentialMax: 14, primeAgeRangeYears: [8, 18], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                ]
              }
            ]
          },
          {
            id: 'grapefruit',
            name: 'Grapefruit',
            scientificName: 'Citrus × paradisi',
            varieties: [
              {
                id: 'red_grapefruit',
                name: 'Red Grapefruit',
                cultivars: [
                  { id: 'ruby_red', name: 'Ruby Red', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5500, gddToPeak: 7100, gddWindow: 4000, brixPotentialMin: 9, brixPotentialMax: 12, primeAgeRangeYears: [8, 20], yearsToFirstBearing: 4, productiveLifespanYears: 60 },
                  { id: 'rio_red', name: 'Rio Red', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5500, gddToPeak: 7100, gddWindow: 4000, brixPotentialMin: 9, brixPotentialMax: 12, primeAgeRangeYears: [8, 20], yearsToFirstBearing: 4, productiveLifespanYears: 60 },
                ]
              },
              {
                id: 'white_grapefruit',
                name: 'White Grapefruit',
                cultivars: [
                  { id: 'marsh', name: 'Marsh', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5500, gddToPeak: 7100, gddWindow: 4000, brixPotentialMin: 8, brixPotentialMax: 11, primeAgeRangeYears: [8, 20], yearsToFirstBearing: 4, productiveLifespanYears: 60 },
                ]
              }
            ]
          },
          {
            id: 'tangerine',
            name: 'Tangerine/Mandarin',
            scientificName: 'Citrus reticulata',
            varieties: [
              {
                id: 'mandarin',
                name: 'Mandarin',
                cultivars: [
                  { id: 'satsuma', name: 'Satsuma', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 4600, gddToPeak: 5100, gddWindow: 700, brixPotentialMin: 10, brixPotentialMax: 13, primeAgeRangeYears: [6, 15], yearsToFirstBearing: 2, productiveLifespanYears: 40 },
                  { id: 'clementine', name: 'Clementine', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 4800, gddToPeak: 5500, gddWindow: 1500, brixPotentialMin: 11, brixPotentialMax: 14, primeAgeRangeYears: [6, 15], yearsToFirstBearing: 2, productiveLifespanYears: 40 },
                  { id: 'shiranui', name: 'Shiranui', tradeName: 'SUMO', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 5000, gddToPeak: 5800, gddWindow: 1200, brixPotentialMin: 13, brixPotentialMax: 16, primeAgeRangeYears: [6, 15], yearsToFirstBearing: 3, productiveLifespanYears: 40 },
                ]
              }
            ]
          },
          {
            id: 'lemon',
            name: 'Lemon',
            scientificName: 'Citrus limon',
            varieties: [
              {
                id: 'lemon_standard',
                name: 'Standard Lemon',
                cultivars: [
                  { id: 'eureka', name: 'Eureka', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 4000, gddToPeak: 5000, gddWindow: 5000, brixPotentialMin: 6, brixPotentialMax: 9, primeAgeRangeYears: [6, 20], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                  { id: 'lisbon', name: 'Lisbon', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 4000, gddToPeak: 5000, gddWindow: 5000, brixPotentialMin: 6, brixPotentialMax: 9, primeAgeRangeYears: [6, 20], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                  { id: 'meyer', name: 'Meyer', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 94, gddToMaturity: 3500, gddToPeak: 4500, gddWindow: 4000, brixPotentialMin: 8, brixPotentialMax: 11, primeAgeRangeYears: [5, 15], yearsToFirstBearing: 2, productiveLifespanYears: 40 },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'stone_fruit',
        name: 'Stone Fruit',
        lifecycle: 'tree_perennial',
        productTypes: [
          {
            id: 'peach',
            name: 'Peach',
            scientificName: 'Prunus persica',
            varieties: [
              {
                id: 'freestone_peach',
                name: 'Freestone Peach',
                cultivars: [
                  { id: 'elberta', name: 'Elberta', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 45, maxTemp: 86, gddToMaturity: 1800, gddToPeak: 2200, gddWindow: 1800, chillHoursRequired: 850, brixPotentialMin: 11, brixPotentialMax: 15, primeAgeRangeYears: [5, 15], yearsToFirstBearing: 3, productiveLifespanYears: 25 },
                  { id: 'redhaven', name: 'Redhaven', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 45, maxTemp: 86, gddToMaturity: 1600, gddToPeak: 2000, gddWindow: 1600, chillHoursRequired: 950, brixPotentialMin: 12, brixPotentialMax: 15, primeAgeRangeYears: [5, 15], yearsToFirstBearing: 3, productiveLifespanYears: 25 },
                ]
              },
              {
                id: 'low_chill_peach',
                name: 'Low-Chill Peach',
                cultivars: [
                  { id: 'tropic_beauty', name: 'TropicBeauty', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 45, maxTemp: 86, gddToMaturity: 1400, gddToPeak: 1800, gddWindow: 1400, chillHoursRequired: 150, brixPotentialMin: 11, brixPotentialMax: 14, primeAgeRangeYears: [4, 12], yearsToFirstBearing: 2, productiveLifespanYears: 20 },
                  { id: 'florda_prince', name: 'FlordaPrince', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 45, maxTemp: 86, gddToMaturity: 1300, gddToPeak: 1700, gddWindow: 1300, chillHoursRequired: 150, brixPotentialMin: 11, brixPotentialMax: 14, primeAgeRangeYears: [4, 12], yearsToFirstBearing: 2, productiveLifespanYears: 20 },
                ]
              }
            ]
          },
          {
            id: 'cherry',
            name: 'Cherry',
            scientificName: 'Prunus avium',
            varieties: [
              {
                id: 'sweet_cherry',
                name: 'Sweet Cherry',
                cultivars: [
                  { id: 'bing', name: 'Bing', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 40, maxTemp: 86, gddToMaturity: 1100, gddToPeak: 1500, gddWindow: 900, chillHoursRequired: 1100, brixPotentialMin: 16, brixPotentialMax: 22, primeAgeRangeYears: [7, 20], yearsToFirstBearing: 4, productiveLifespanYears: 30 },
                  { id: 'rainier', name: 'Rainier', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 40, maxTemp: 86, gddToMaturity: 1000, gddToPeak: 1400, gddWindow: 800, chillHoursRequired: 900, brixPotentialMin: 18, brixPotentialMax: 24, primeAgeRangeYears: [7, 20], yearsToFirstBearing: 4, productiveLifespanYears: 30 },
                ]
              },
              {
                id: 'tart_cherry',
                name: 'Tart Cherry',
                cultivars: [
                  { id: 'montmorency', name: 'Montmorency', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 39.2, maxTemp: 86, gddToMaturity: 1000, gddToPeak: 1100, gddWindow: 80, chillHoursRequired: 954, brixPotentialMin: 12, brixPotentialMax: 16, primeAgeRangeYears: [8, 25], yearsToFirstBearing: 4, productiveLifespanYears: 35 },
                ]
              }
            ]
          },
          {
            id: 'plum',
            name: 'Plum',
            scientificName: 'Prunus domestica',
            varieties: [
              {
                id: 'european_plum',
                name: 'European Plum',
                cultivars: [
                  { id: 'stanley', name: 'Stanley', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 45, maxTemp: 86, gddToMaturity: 1400, gddToPeak: 1800, gddWindow: 600, chillHoursRequired: 800, brixPotentialMin: 14, brixPotentialMax: 20, primeAgeRangeYears: [6, 18], yearsToFirstBearing: 4, productiveLifespanYears: 30 },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'pome_fruit',
        name: 'Pome Fruit',
        lifecycle: 'tree_perennial',
        productTypes: [
          {
            id: 'apple',
            name: 'Apple',
            scientificName: 'Malus domestica',
            varieties: [
              {
                id: 'dessert_apple',
                name: 'Dessert Apple',
                cultivars: [
                  { id: 'honeycrisp', name: 'Honeycrisp', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 43, maxTemp: 86, gddToMaturity: 2400, gddToPeak: 2900, gddWindow: 1600, chillHoursRequired: 1000, brixPotentialMin: 13, brixPotentialMax: 17, primeAgeRangeYears: [10, 30], yearsToFirstBearing: 4, productiveLifespanYears: 50 },
                  { id: 'fuji', name: 'Fuji', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 43, maxTemp: 86, gddToMaturity: 2600, gddToPeak: 3100, gddWindow: 1400, chillHoursRequired: 900, brixPotentialMin: 14, brixPotentialMax: 18, primeAgeRangeYears: [10, 30], yearsToFirstBearing: 4, productiveLifespanYears: 50 },
                  { id: 'gala', name: 'Gala', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 43, maxTemp: 86, gddToMaturity: 2200, gddToPeak: 2700, gddWindow: 1400, chillHoursRequired: 800, brixPotentialMin: 13, brixPotentialMax: 16, primeAgeRangeYears: [10, 30], yearsToFirstBearing: 4, productiveLifespanYears: 50 },
                ]
              },
              {
                id: 'heirloom_apple',
                name: 'Heirloom Apple',
                cultivars: [
                  { id: 'gravenstein', name: 'Gravenstein', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 43, maxTemp: 86, gddToMaturity: 2000, gddToPeak: 2400, gddWindow: 800, chillHoursRequired: 700, brixPotentialMin: 12, brixPotentialMax: 15, primeAgeRangeYears: [10, 40], yearsToFirstBearing: 5, productiveLifespanYears: 100 },
                  { id: 'arkansas_black', name: 'Arkansas Black', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 43, maxTemp: 86, gddToMaturity: 2800, gddToPeak: 3300, gddWindow: 1200, chillHoursRequired: 900, brixPotentialMin: 14, brixPotentialMax: 18, primeAgeRangeYears: [10, 40], yearsToFirstBearing: 5, productiveLifespanYears: 100 },
                ]
              }
            ]
          },
          {
            id: 'pear',
            name: 'Pear',
            scientificName: 'Pyrus communis',
            varieties: [
              {
                id: 'european_pear',
                name: 'European Pear',
                cultivars: [
                  { id: 'bartlett', name: 'Bartlett', heritageIntent: 'heirloom_quality', lifecycle: 'tree_perennial', baseTemp: 40, maxTemp: 86, gddToMaturity: 2800, gddToPeak: 3300, gddWindow: 1200, chillHoursRequired: 800, brixPotentialMin: 12, brixPotentialMax: 16, primeAgeRangeYears: [8, 25], yearsToFirstBearing: 4, productiveLifespanYears: 75 },
                  { id: 'bosc', name: 'Bosc', heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 40, maxTemp: 86, gddToMaturity: 2900, gddToPeak: 3400, gddWindow: 1000, chillHoursRequired: 900, brixPotentialMin: 13, brixPotentialMax: 17, primeAgeRangeYears: [8, 25], yearsToFirstBearing: 4, productiveLifespanYears: 75 },
                  { id: 'anjou', name: "d'Anjou", heritageIntent: 'true_heritage', lifecycle: 'tree_perennial', baseTemp: 40, maxTemp: 86, gddToMaturity: 2700, gddToPeak: 3200, gddWindow: 1100, chillHoursRequired: 850, brixPotentialMin: 12, brixPotentialMax: 15, primeAgeRangeYears: [8, 25], yearsToFirstBearing: 4, productiveLifespanYears: 75 },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'berry',
        name: 'Berry',
        lifecycle: 'bush_perennial',
        productTypes: [
          {
            id: 'blueberry',
            name: 'Blueberry',
            scientificName: 'Vaccinium corymbosum',
            varieties: [
              {
                id: 'highbush',
                name: 'Highbush Blueberry',
                cultivars: [
                  { id: 'duke', name: 'Duke', heritageIntent: 'modern_flavor', lifecycle: 'bush_perennial', baseTemp: 50, maxTemp: 86, gddToMaturity: 900, gddToPeak: 1100, gddWindow: 400, chillHoursRequired: 1000, brixPotentialMin: 12, brixPotentialMax: 16, primeAgeRangeYears: [3, 5], yearsToFirstBearing: 2, productiveLifespanYears: 20 },
                  { id: 'bluecrop', name: 'Bluecrop', heritageIntent: 'commercial', lifecycle: 'bush_perennial', baseTemp: 50, maxTemp: 86, gddToMaturity: 1000, gddToPeak: 1200, gddWindow: 500, chillHoursRequired: 1000, brixPotentialMin: 11, brixPotentialMax: 14, primeAgeRangeYears: [3, 5], yearsToFirstBearing: 2, productiveLifespanYears: 20 },
                ]
              },
              {
                id: 'southern_highbush',
                name: 'Southern Highbush Blueberry',
                cultivars: [
                  { id: 'emerald', name: 'Emerald', heritageIntent: 'modern_flavor', lifecycle: 'bush_perennial', baseTemp: 50, maxTemp: 86, gddToMaturity: 800, gddToPeak: 1000, gddWindow: 500, chillHoursRequired: 250, brixPotentialMin: 12, brixPotentialMax: 15, primeAgeRangeYears: [3, 5], yearsToFirstBearing: 2, productiveLifespanYears: 15 },
                  { id: 'jewel', name: 'Jewel', heritageIntent: 'modern_flavor', lifecycle: 'bush_perennial', baseTemp: 50, maxTemp: 86, gddToMaturity: 850, gddToPeak: 1050, gddWindow: 450, chillHoursRequired: 200, brixPotentialMin: 13, brixPotentialMax: 16, primeAgeRangeYears: [3, 5], yearsToFirstBearing: 2, productiveLifespanYears: 15 },
                ]
              }
            ]
          },
          {
            id: 'strawberry',
            name: 'Strawberry',
            scientificName: 'Fragaria × ananassa',
            varieties: [
              {
                id: 'june_bearing',
                name: 'June-Bearing Strawberry',
                cultivars: [
                  { id: 'chandler', name: 'Chandler', heritageIntent: 'commercial', lifecycle: 'annual_replanted', baseTemp: 50, maxTemp: 86, gddToMaturity: 700, gddToPeak: 900, gddWindow: 600, brixPotentialMin: 7, brixPotentialMax: 11 },
                  { id: 'sweet_charlie', name: 'Sweet Charlie', heritageIntent: 'modern_flavor', lifecycle: 'annual_replanted', baseTemp: 50, maxTemp: 86, gddToMaturity: 650, gddToPeak: 850, gddWindow: 550, brixPotentialMin: 9, brixPotentialMax: 13 },
                ]
              }
            ]
          },
          {
            id: 'blackberry',
            name: 'Blackberry',
            scientificName: 'Rubus fruticosus',
            varieties: [
              {
                id: 'thornless_blackberry',
                name: 'Thornless Blackberry',
                cultivars: [
                  { id: 'natchez', name: 'Natchez', heritageIntent: 'modern_flavor', lifecycle: 'bush_perennial', baseTemp: 50, maxTemp: 86, gddToMaturity: 1100, gddToPeak: 1400, gddWindow: 600, brixPotentialMin: 10, brixPotentialMax: 14, primeAgeRangeYears: [3, 5], yearsToFirstBearing: 1, productiveLifespanYears: 15 },
                ]
              }
            ]
          },
          {
            id: 'raspberry',
            name: 'Raspberry',
            scientificName: 'Rubus idaeus',
            varieties: [
              {
                id: 'red_raspberry',
                name: 'Red Raspberry',
                cultivars: [
                  { id: 'heritage', name: 'Heritage', heritageIntent: 'heirloom_quality', lifecycle: 'bush_perennial', baseTemp: 50, maxTemp: 86, gddToMaturity: 900, gddToPeak: 1100, gddWindow: 400, brixPotentialMin: 10, brixPotentialMax: 14, primeAgeRangeYears: [3, 5], yearsToFirstBearing: 1, productiveLifespanYears: 12 },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'vine_fruit',
        name: 'Vine Fruit',
        lifecycle: 'vine_perennial',
        productTypes: [
          {
            id: 'grape',
            name: 'Grape',
            scientificName: 'Vitis vinifera',
            varieties: [
              {
                id: 'table_grape',
                name: 'Table Grape',
                cultivars: [
                  { id: 'thompson_seedless', name: 'Thompson Seedless', heritageIntent: 'commercial', lifecycle: 'vine_perennial', baseTemp: 50, maxTemp: 90, gddToMaturity: 2400, gddToPeak: 2800, gddWindow: 800, chillHoursRequired: 200, brixPotentialMin: 16, brixPotentialMax: 22, primeAgeRangeYears: [5, 10], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                  { id: 'concord', name: 'Concord', heritageIntent: 'true_heritage', lifecycle: 'vine_perennial', baseTemp: 50, maxTemp: 90, gddToMaturity: 2200, gddToPeak: 2600, gddWindow: 600, chillHoursRequired: 400, brixPotentialMin: 14, brixPotentialMax: 20, primeAgeRangeYears: [5, 10], yearsToFirstBearing: 3, productiveLifespanYears: 50 },
                ]
              },
              {
                id: 'wine_grape',
                name: 'Wine Grape',
                cultivars: [
                  { id: 'cabernet_sauvignon', name: 'Cabernet Sauvignon', heritageIntent: 'true_heritage', lifecycle: 'vine_perennial', baseTemp: 50, maxTemp: 90, gddToMaturity: 2400, gddToPeak: 2800, gddWindow: 800, chillHoursRequired: 400, brixPotentialMin: 22, brixPotentialMax: 28, primeAgeRangeYears: [8, 30], yearsToFirstBearing: 3, productiveLifespanYears: 80 },
                  { id: 'pinot_noir', name: 'Pinot Noir', heritageIntent: 'true_heritage', lifecycle: 'vine_perennial', baseTemp: 50, maxTemp: 90, gddToMaturity: 2000, gddToPeak: 2400, gddWindow: 600, chillHoursRequired: 500, brixPotentialMin: 21, brixPotentialMax: 26, primeAgeRangeYears: [8, 30], yearsToFirstBearing: 3, productiveLifespanYears: 80 },
                ]
              }
            ]
          },
          {
            id: 'kiwi',
            name: 'Kiwi',
            scientificName: 'Actinidia deliciosa',
            varieties: [
              {
                id: 'fuzzy_kiwi',
                name: 'Fuzzy Kiwi',
                cultivars: [
                  { id: 'hayward', name: 'Hayward', heritageIntent: 'commercial', lifecycle: 'vine_perennial', baseTemp: 50, maxTemp: 86, gddToMaturity: 3000, gddToPeak: 3500, gddWindow: 800, chillHoursRequired: 800, brixPotentialMin: 12, brixPotentialMax: 16, primeAgeRangeYears: [5, 10], yearsToFirstBearing: 4, productiveLifespanYears: 50 },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'tropical',
        name: 'Tropical Fruit',
        lifecycle: 'tree_perennial',
        productTypes: [
          {
            id: 'avocado',
            name: 'Avocado',
            scientificName: 'Persea americana',
            varieties: [
              {
                id: 'hass_type',
                name: 'Hass Type',
                cultivars: [
                  { id: 'hass', name: 'Hass', heritageIntent: 'commercial', lifecycle: 'tree_perennial', baseTemp: 55, maxTemp: 95, gddToMaturity: 5000, gddToPeak: 6000, gddWindow: 3000, brixPotentialMin: 6, brixPotentialMax: 10, primeAgeRangeYears: [5, 15], yearsToFirstBearing: 4, productiveLifespanYears: 50 },
                ]
              }
            ]
          },
          {
            id: 'mango',
            name: 'Mango',
            scientificName: 'Mangifera indica',
            varieties: [
              {
                id: 'florida_mango',
                name: 'Florida Mango',
                cultivars: [
                  { id: 'tommy_atkins', name: 'Tommy Atkins', heritageIntent: 'commercial', lifecycle: 'tree_perennial', baseTemp: 60, maxTemp: 100, gddToMaturity: 3500, gddToPeak: 4000, gddWindow: 1000, brixPotentialMin: 12, brixPotentialMax: 18, primeAgeRangeYears: [6, 20], yearsToFirstBearing: 4, productiveLifespanYears: 40 },
                  { id: 'kent', name: 'Kent', heritageIntent: 'modern_flavor', lifecycle: 'tree_perennial', baseTemp: 60, maxTemp: 100, gddToMaturity: 3600, gddToPeak: 4100, gddWindow: 900, brixPotentialMin: 15, brixPotentialMax: 22, primeAgeRangeYears: [6, 20], yearsToFirstBearing: 4, productiveLifespanYears: 40 },
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'vegetable',
    name: 'Vegetable',
    subcategories: [
      {
        id: 'nightshade',
        name: 'Nightshade',
        lifecycle: 'annual_row',
        productTypes: [
          {
            id: 'tomato',
            name: 'Tomato',
            scientificName: 'Solanum lycopersicum',
            varieties: [
              {
                id: 'beefsteak',
                name: 'Beefsteak Tomato',
                cultivars: [
                  { id: 'brandywine', name: 'Brandywine', heritageIntent: 'true_heritage', lifecycle: 'annual_row', baseTemp: 50, maxTemp: 86, gddToMaturity: 2000, gddToPeak: 2300, gddWindow: 600, brixPotentialMin: 5, brixPotentialMax: 8 },
                ]
              },
              {
                id: 'cherry_tomato',
                name: 'Cherry Tomato',
                cultivars: [
                  { id: 'sungold', name: 'Sungold', heritageIntent: 'modern_flavor', lifecycle: 'annual_row', baseTemp: 50, maxTemp: 86, gddToMaturity: 1700, gddToPeak: 2000, gddWindow: 500, brixPotentialMin: 8, brixPotentialMax: 12 },
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]

// =============================================================================
// ROOTSTOCKS
// =============================================================================

interface Rootstock {
  id: string
  name: string
  cropTypes: string[]  // What crops it's compatible with
  brixModifier: number
  vigor: string
  diseaseResistance: string[]
  coldHardyZone?: number
  notes?: string
}

const ROOTSTOCKS: Rootstock[] = [
  // Citrus rootstocks
  { id: 'carrizo', name: 'Carrizo Citrange', cropTypes: ['citrus'], brixModifier: 0.6, vigor: 'moderate', diseaseResistance: ['CTV', 'phytophthora'], coldHardyZone: 9, notes: 'Most common commercial rootstock, excellent quality' },
  { id: 'c35', name: 'C-35 Citrange', cropTypes: ['citrus'], brixModifier: 0.6, vigor: 'moderate', diseaseResistance: ['CTV', 'phytophthora'], coldHardyZone: 9, notes: 'Semi-dwarf, good quality' },
  { id: 'sour_orange', name: 'Sour Orange', cropTypes: ['citrus'], brixModifier: 0.5, vigor: 'moderate', diseaseResistance: ['phytophthora'], coldHardyZone: 9, notes: 'Excellent quality but CTV susceptible' },
  { id: 'trifoliate', name: 'Trifoliate', cropTypes: ['citrus'], brixModifier: 0.5, vigor: 'dwarfing', diseaseResistance: ['CTV', 'phytophthora', 'nematodes'], coldHardyZone: 7, notes: 'Most cold-hardy, excellent quality' },
  { id: 'cleopatra', name: 'Cleopatra Mandarin', cropTypes: ['citrus'], brixModifier: 0.2, vigor: 'moderate', diseaseResistance: ['CTV'], coldHardyZone: 9, notes: 'Neutral quality, good for mandarins' },
  { id: 'swingle', name: 'Swingle Citrumelo', cropTypes: ['citrus'], brixModifier: -0.5, vigor: 'vigorous', diseaseResistance: ['CTV', 'phytophthora', 'nematodes'], coldHardyZone: 8, notes: 'High yield but lower quality' },
  { id: 'rough_lemon', name: 'Rough Lemon', cropTypes: ['citrus'], brixModifier: -0.7, vigor: 'very_vigorous', diseaseResistance: [], coldHardyZone: 10, notes: 'Very vigorous, dilutes SSC' },
  { id: 'macrophylla', name: 'Macrophylla', cropTypes: ['citrus'], brixModifier: -0.8, vigor: 'very_vigorous', diseaseResistance: [], coldHardyZone: 10, notes: 'Lowest quality, mainly for lemons' },

  // Apple rootstocks
  { id: 'm9', name: 'M.9', cropTypes: ['apple'], brixModifier: 0.3, vigor: 'dwarfing', diseaseResistance: ['fire_blight_moderate'], coldHardyZone: 5, notes: 'Standard dwarf, excellent fruit quality' },
  { id: 'm26', name: 'M.26', cropTypes: ['apple'], brixModifier: 0.2, vigor: 'semi_dwarfing', diseaseResistance: [], coldHardyZone: 5, notes: 'Semi-dwarf, good quality' },
  { id: 'mm111', name: 'MM.111', cropTypes: ['apple'], brixModifier: 0.0, vigor: 'semi_vigorous', diseaseResistance: ['woolly_aphid'], coldHardyZone: 4, notes: 'Drought tolerant, standard quality' },
  { id: 'geneva_41', name: 'Geneva 41 (G.41)', cropTypes: ['apple'], brixModifier: 0.4, vigor: 'dwarfing', diseaseResistance: ['fire_blight', 'replant_disease'], coldHardyZone: 4, notes: 'Fire blight resistant, excellent quality' },

  // Stone fruit rootstocks
  { id: 'lovell', name: 'Lovell', cropTypes: ['peach', 'nectarine'], brixModifier: 0.0, vigor: 'standard', diseaseResistance: [], coldHardyZone: 5, notes: 'Standard peach rootstock' },
  { id: 'nemaguard', name: 'Nemaguard', cropTypes: ['peach', 'nectarine'], brixModifier: 0.0, vigor: 'vigorous', diseaseResistance: ['nematodes'], coldHardyZone: 7, notes: 'Nematode resistant, warm climates' },
  { id: 'mazzard', name: 'Mazzard', cropTypes: ['cherry'], brixModifier: 0.0, vigor: 'vigorous', diseaseResistance: [], coldHardyZone: 4, notes: 'Standard cherry rootstock' },
  { id: 'gisela_5', name: 'Gisela 5', cropTypes: ['cherry'], brixModifier: 0.2, vigor: 'dwarfing', diseaseResistance: [], coldHardyZone: 5, notes: 'Dwarf cherry, improved fruit quality' },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

export async function seedCategories(): Promise<void> {
  console.log('Seeding categories...')
  for (const category of CROP_TAXONOMY) {
    await runWriteTransaction(`
      MERGE (c:Category {id: $id})
      SET c.name = $name
    `, { id: category.id, name: category.name })
    console.log(`  ✓ ${category.name}`)
  }
}

export async function seedSubcategories(): Promise<void> {
  console.log('Seeding subcategories...')
  for (const category of CROP_TAXONOMY) {
    for (const subcategory of category.subcategories) {
      await runWriteTransaction(`
        MATCH (c:Category {id: $categoryId})
        MERGE (s:Subcategory {id: $id})
        SET s.name = $name, s.lifecycle = $lifecycle
        MERGE (c)-[:HAS_SUBCATEGORY]->(s)
      `, {
        categoryId: category.id,
        id: subcategory.id,
        name: subcategory.name,
        lifecycle: subcategory.lifecycle
      })
    }
  }
  console.log(`  ✓ ${CROP_TAXONOMY.flatMap(c => c.subcategories).length} subcategories`)
}

export async function seedProductTypes(): Promise<void> {
  console.log('Seeding product types...')
  let count = 0
  for (const category of CROP_TAXONOMY) {
    for (const subcategory of category.subcategories) {
      for (const productType of subcategory.productTypes) {
        await runWriteTransaction(`
          MATCH (s:Subcategory {id: $subcategoryId})
          MERGE (pt:ProductType {id: $id})
          SET pt.name = $name, pt.scientificName = $scientificName
          MERGE (s)-[:HAS_PRODUCT_TYPE]->(pt)
        `, {
          subcategoryId: subcategory.id,
          id: productType.id,
          name: productType.name,
          scientificName: productType.scientificName || null
        })
        count++
      }
    }
  }
  console.log(`  ✓ ${count} product types`)
}

export async function seedVarieties(): Promise<void> {
  console.log('Seeding varieties...')
  let count = 0
  for (const category of CROP_TAXONOMY) {
    for (const subcategory of category.subcategories) {
      for (const productType of subcategory.productTypes) {
        for (const variety of productType.varieties || []) {
          await runWriteTransaction(`
            MATCH (pt:ProductType {id: $productTypeId})
            MERGE (v:Variety {id: $id})
            SET v.name = $name
            MERGE (pt)-[:HAS_VARIETY]->(v)
          `, {
            productTypeId: productType.id,
            id: variety.id,
            name: variety.name
          })
          count++
        }
      }
    }
  }
  console.log(`  ✓ ${count} varieties`)
}

export async function seedCultivars(): Promise<void> {
  console.log('Seeding cultivars...')
  let count = 0
  for (const category of CROP_TAXONOMY) {
    for (const subcategory of category.subcategories) {
      for (const productType of subcategory.productTypes) {
        for (const variety of productType.varieties || []) {
          for (const cultivar of variety.cultivars || []) {
            await runWriteTransaction(`
              MATCH (v:Variety {id: $varietyId})
              MERGE (c:Cultivar {id: $id})
              SET c.name = $name,
                  c.tradeName = $tradeName,
                  c.heritageIntent = $heritageIntent,
                  c.lifecycle = $lifecycle,
                  c.baseTemp = $baseTemp,
                  c.maxTemp = $maxTemp,
                  c.gddToMaturity = $gddToMaturity,
                  c.gddToPeak = $gddToPeak,
                  c.gddWindow = $gddWindow,
                  c.chillHoursRequired = $chillHoursRequired,
                  c.brixPotentialMin = $brixPotentialMin,
                  c.brixPotentialMax = $brixPotentialMax,
                  c.primeAgeRangeYears = $primeAgeRangeYears,
                  c.yearsToFirstBearing = $yearsToFirstBearing,
                  c.productiveLifespanYears = $productiveLifespanYears
              MERGE (v)-[:HAS_CULTIVAR]->(c)
            `, {
              varietyId: variety.id,
              id: cultivar.id,
              name: cultivar.name,
              tradeName: cultivar.tradeName || null,
              heritageIntent: cultivar.heritageIntent || null,
              lifecycle: cultivar.lifecycle,
              baseTemp: cultivar.baseTemp,
              maxTemp: cultivar.maxTemp || null,
              gddToMaturity: cultivar.gddToMaturity,
              gddToPeak: cultivar.gddToPeak || null,
              gddWindow: cultivar.gddWindow,
              chillHoursRequired: cultivar.chillHoursRequired || null,
              brixPotentialMin: cultivar.brixPotentialMin || null,
              brixPotentialMax: cultivar.brixPotentialMax || null,
              primeAgeRangeYears: cultivar.primeAgeRangeYears || null,
              yearsToFirstBearing: cultivar.yearsToFirstBearing || null,
              productiveLifespanYears: cultivar.productiveLifespanYears || null
            })
            count++
          }
        }
      }
    }
  }
  console.log(`  ✓ ${count} cultivars`)
}

export async function seedRootstocks(): Promise<void> {
  console.log('Seeding rootstocks...')
  for (const rootstock of ROOTSTOCKS) {
    await runWriteTransaction(`
      MERGE (r:Rootstock {id: $id})
      SET r.name = $name,
          r.cropTypes = $cropTypes,
          r.brixModifier = $brixModifier,
          r.vigor = $vigor,
          r.diseaseResistance = $diseaseResistance,
          r.coldHardyZone = $coldHardyZone,
          r.notes = $notes
    `, rootstock)
  }
  console.log(`  ✓ ${ROOTSTOCKS.length} rootstocks`)

  // Link rootstocks to compatible product types
  console.log('Linking rootstocks to product types...')
  for (const rootstock of ROOTSTOCKS) {
    for (const cropType of rootstock.cropTypes) {
      // Find all product types in matching subcategory
      await runWriteTransaction(`
        MATCH (r:Rootstock {id: $rootstockId})
        MATCH (s:Subcategory {id: $subcategoryId})
        MATCH (s)-[:HAS_PRODUCT_TYPE]->(pt:ProductType)
        MERGE (pt)-[:COMPATIBLE_WITH]->(r)
      `, { rootstockId: rootstock.id, subcategoryId: cropType })
    }
  }
  console.log('  ✓ Rootstock compatibility linked')
}

/**
 * Run all crop seeding.
 */
export async function seedCrops(): Promise<void> {
  console.log('\n=== Seeding Crop Taxonomy ===\n')
  await seedCategories()
  await seedSubcategories()
  await seedProductTypes()
  await seedVarieties()
  await seedCultivars()
  await seedRootstocks()
  console.log('\n=== Crop seeding complete ===\n')
}
