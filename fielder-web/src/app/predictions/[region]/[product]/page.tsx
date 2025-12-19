/**
 * Product Prediction Detail Page
 * Vintage recipe card / notecard aesthetic
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Header } from '@/components/Header'
import { CategoryIcon, getCategoryFromProduct } from '@/components/CategoryIcon'
import { SHAREBreakdown } from '@/components/SHAREBreakdown'
import {
  ALL_GROWING_REGIONS,
  getRegionBySlug,
  type GrowingRegionExtended,
} from '@/lib/constants/growing-regions'
import {
  REGIONAL_OFFERINGS,
  CULTIVARS_BY_ID,
  PRODUCTS_BY_ID,
  getOfferingDetails,
  type RegionalOffering,
  type Cultivar,
  type ProductType,
} from '@/lib/constants/products'
import {
  calculatePeakWindow,
  getCurrentDayOfYear,
  isDoyInRange,
  daysRemainingInWindow,
  daysUntilDoy,
} from '@/lib/utils/harvest-timing'
import {
  getProfilesByCategory,
  type ShareProfileCategory,
  type ShareProfile,
} from '@/lib/constants/share-profiles'
import {
  findOptimalHarvestTime,
  predictQuality,
  type QualityPredictionResult,
} from '@/lib/prediction/quality-predictor'
import {
  getCropPhenology,
  getBloomDate,
  type CropPhenology,
} from '@/lib/constants/crop-phenology'
import {
  weatherService,
  type CurrentWeather,
} from '@/lib/services/weather'
import {
  predictBloomDate,
  type BloomPrediction,
} from '@/lib/services/bloom-predictor'
import {
  analyzeSHARE,
  type SHAREAnalysis,
} from '@/lib/services/share-intelligence'
import { CULTIVAR_QUALITY_PROFILES } from '@/lib/constants/quality-tiers'

interface Props {
  params: Promise<{ region: string; product: string }>
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/**
 * Convert month (1-12) and day to day of year (1-365)
 */
function dateToDoy(month: number, day: number): number {
  let doy = day
  for (let i = 0; i < month - 1; i++) {
    doy += DAYS_IN_MONTH[i]
  }
  return doy
}

/**
 * Calculate live harvest status based on current date
 * Uses DAY-based calculation (not month-based) for precise peak windows
 */
function calculateLiveStatus(peakMonths: number[] | undefined): {
  status: 'at_peak' | 'approaching' | 'in_season' | 'off_season'
  statusLabel: string
  statusColor: string
  daysInfo?: number
  daysLabel?: string
} {
  if (!peakMonths || peakMonths.length === 0) {
    return {
      status: 'off_season',
      statusLabel: 'Data Unavailable',
      statusColor: 'bg-stone-100 text-stone-600 border-stone-300',
    }
  }

  const currentDoy = getCurrentDayOfYear()

  // Sort months handling year wrap
  const sortedMonths = [...peakMonths].sort((a, b) => {
    if (Math.abs(a - b) > 6) {
      const aAdj = a <= 6 ? a + 12 : a
      const bAdj = b <= 6 ? b + 12 : b
      return aAdj - bAdj
    }
    return a - b
  })

  const firstMonth = sortedMonths[0]
  const lastMonth = sortedMonths[sortedMonths.length - 1]

  // Calculate harvest window DOY (1st of first month to last day of last month)
  const harvestStartDoy = dateToDoy(firstMonth, 1)
  const harvestEndDoy = dateToDoy(lastMonth, DAYS_IN_MONTH[lastMonth - 1])

  // Calculate total days in harvest window
  let totalDays = 0
  for (const month of sortedMonths) {
    totalDays += DAYS_IN_MONTH[month - 1]
  }

  // Calculate peak window: middle 50% in DAYS
  const peakDays = Math.round(totalDays * 0.5)
  const marginDays = Math.round((totalDays - peakDays) / 2)

  // Peak start: harvest start + margin days
  const peakStartDoy = harvestStartDoy + marginDays
  // Peak end: harvest end - margin days
  const peakEndDoy = harvestEndDoy - marginDays

  // Check current status (handle year wrap for comparison)
  const isInRange = (doy: number, start: number, end: number): boolean => {
    if (start <= end) {
      return doy >= start && doy <= end
    } else {
      // Wraps around year boundary
      return doy >= start || doy <= end
    }
  }

  if (isInRange(currentDoy, peakStartDoy, peakEndDoy)) {
    const remaining = daysRemainingInWindow(currentDoy, peakEndDoy)
    return {
      status: 'at_peak',
      statusLabel: 'At Peak Now',
      statusColor: 'bg-green-100 text-green-800 border-green-300',
      daysInfo: remaining,
      daysLabel: `${remaining} days left in peak`,
    }
  }

  if (isInRange(currentDoy, harvestStartDoy, harvestEndDoy)) {
    const daysUntilPeak = daysUntilDoy(currentDoy, peakStartDoy)
    if (daysUntilPeak <= 30) {
      return {
        status: 'approaching',
        statusLabel: 'Peak Soon',
        statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
        daysInfo: daysUntilPeak,
        daysLabel: `${daysUntilPeak} days until peak`,
      }
    }
    return {
      status: 'in_season',
      statusLabel: 'In Season',
      statusColor: 'bg-blue-100 text-blue-800 border-blue-300',
      daysInfo: daysUntilPeak,
      daysLabel: `Peak in ${Math.round(daysUntilPeak / 30)} months`,
    }
  }

  // Off season - calculate days until next harvest
  const daysUntil = daysUntilDoy(currentDoy, harvestStartDoy)
  return {
    status: 'off_season',
    statusLabel: 'Off Season',
    statusColor: 'bg-stone-100 text-stone-600 border-stone-300',
    daysInfo: daysUntil,
    daysLabel: daysUntil > 60 ? `Returns in ${Math.round(daysUntil / 30)} months` : `Returns in ${daysUntil} days`,
  }
}

/**
 * Map product subcategory to SHARE profile category
 */
function mapToShareCategory(subcategory: string, category: string): ShareProfileCategory | null {
  const mapping: Record<string, ShareProfileCategory> = {
    // Produce
    citrus: 'citrus',
    stone_fruit: 'stone_fruit',
    pome_fruit: 'pome_fruit',
    berry: 'berry',
    melon: 'melon',
    tropical: 'tropical',
    leafy_greens: 'leafy_greens',
    root_vegetable: 'root_vegetable',
    nightshade: 'nightshade',
    cruciferous: 'cruciferous',
    // Animal products
    beef: 'beef',
    pork: 'pork',
    poultry: 'poultry',
    chicken: 'poultry',
    eggs: 'eggs',
    dairy: 'dairy',
    seafood: 'seafood',
    fish: 'seafood',
    shellfish: 'seafood',
    // Other
    honey: 'honey',
    nuts: 'nuts',
    grains: 'grains',
    oil: 'oil',
  }

  const key = subcategory.toLowerCase().replace(/-/g, '_')
  const catKey = category.toLowerCase().replace(/-/g, '_')

  return mapping[key] || mapping[catKey] || null
}

// =============================================================================
// CATEGORY-SPECIFIC DISPLAY CONFIGURATION
// =============================================================================

type ProductCategoryType = 'produce' | 'meat' | 'seafood' | 'dairy' | 'eggs' | 'other'

interface CategoryDisplayConfig {
  type: ProductCategoryType
  showGddPrediction: boolean           // GDD only applies to produce
  showBloomDate: boolean               // Only tree/bush crops
  showRootstock: boolean               // Only grafted crops
  primaryQualityMetric: 'brix' | 'omega_ratio' | 'usda_grade' | 'none'
  sharePillarLabels: {
    soil: string                       // "Soil Health" or "Sea Health" or "Pasture"
    heritage: string                   // "Genetics" or "Species" or "Breed"
    agricultural: string               // "Growing Practices" or "Catch Method" or "Raising"
    ripen: string                      // "Harvest Timing" or "Catch Season" or "Processing"
    enrich: string                     // "Quality Metrics" (universal)
  }
  regionDisplayFields: {
    showClimate: boolean               // GDD, frost dates (produce)
    showWaters: boolean                // Water temp, currents (seafood)
    showPasture: boolean               // Grazing season (meat)
    showAcreage: boolean               // Farm acreage (produce, meat)
    showSeasonDates: boolean           // Season open/close (seafood, hunting)
  }
  qualityDescriptor: string            // "Sweetness" (produce), "Omega Profile" (meat/seafood), etc.
}

function getCategoryDisplayConfig(category: string, subcategory: string): CategoryDisplayConfig {
  // Seafood categories
  if (category === 'seafood' || ['fish', 'shellfish', 'crustacean'].includes(subcategory)) {
    return {
      type: 'seafood',
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      primaryQualityMetric: 'omega_ratio',
      sharePillarLabels: {
        soil: 'Sea Health',
        heritage: 'Species',
        agricultural: 'Catch Method',
        ripen: 'Season & Handling',
        enrich: 'Quality',
      },
      regionDisplayFields: {
        showClimate: false,
        showWaters: true,
        showPasture: false,
        showAcreage: false,
        showSeasonDates: true,
      },
      qualityDescriptor: 'Omega Profile',
    }
  }

  // Meat categories
  if (category === 'meat' || ['beef', 'pork', 'poultry', 'chicken', 'game', 'lamb'].includes(subcategory)) {
    return {
      type: 'meat',
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      primaryQualityMetric: 'omega_ratio',
      sharePillarLabels: {
        soil: 'Pasture',
        heritage: 'Breed',
        agricultural: 'Raising Practices',
        ripen: 'Processing',
        enrich: 'Quality',
      },
      regionDisplayFields: {
        showClimate: true,
        showWaters: false,
        showPasture: true,
        showAcreage: true,
        showSeasonDates: false,
      },
      qualityDescriptor: 'Omega Ratio',
    }
  }

  // Dairy
  if (category === 'dairy' || subcategory === 'dairy') {
    return {
      type: 'dairy',
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      primaryQualityMetric: 'omega_ratio',
      sharePillarLabels: {
        soil: 'Pasture',
        heritage: 'Breed',
        agricultural: 'Farming Practices',
        ripen: 'Processing',
        enrich: 'Quality',
      },
      regionDisplayFields: {
        showClimate: true,
        showWaters: false,
        showPasture: true,
        showAcreage: true,
        showSeasonDates: false,
      },
      qualityDescriptor: 'CLA & Omega Profile',
    }
  }

  // Eggs
  if (category === 'eggs' || subcategory === 'eggs') {
    return {
      type: 'eggs',
      showGddPrediction: false,
      showBloomDate: false,
      showRootstock: false,
      primaryQualityMetric: 'omega_ratio',
      sharePillarLabels: {
        soil: 'Pasture',
        heritage: 'Breed',
        agricultural: 'Raising Practices',
        ripen: 'Handling',
        enrich: 'Quality',
      },
      regionDisplayFields: {
        showClimate: true,
        showWaters: false,
        showPasture: true,
        showAcreage: false,
        showSeasonDates: false,
      },
      qualityDescriptor: 'Omega Ratio',
    }
  }

  // Default: Produce (fruit, vegetable)
  return {
    type: 'produce',
    showGddPrediction: true,
    showBloomDate: true,
    showRootstock: true,
    primaryQualityMetric: 'brix',
    sharePillarLabels: {
      soil: 'Soil Health',
      heritage: 'Genetics',
      agricultural: 'Growing Practices',
      ripen: 'Harvest Timing',
      enrich: 'Quality',
    },
    regionDisplayFields: {
      showClimate: true,
      showWaters: false,
      showPasture: false,
      showAcreage: true,
      showSeasonDates: false,
    },
    qualityDescriptor: 'Brix (Sweetness)',
  }
}

function getProductSlug(cultivarId: string): string {
  return cultivarId.replace(/_/g, '-').toLowerCase()
}

function getCultivarFromSlug(slug: string): Cultivar | undefined {
  const normalizedSlug = slug.replace(/-/g, '_').toLowerCase()
  return CULTIVARS_BY_ID[normalizedSlug]
}

/**
 * Find offering by region slug and cultivar ID
 * Handles legacy region aliases by checking all regions with matching slug
 */
function findOfferingBySlug(
  regionSlug: string,
  cultivarId: string
): { offering: RegionalOffering; region: GrowingRegionExtended } | undefined {
  // Find all region IDs that have this slug (includes aliases)
  const matchingRegionIds = Object.entries(ALL_GROWING_REGIONS)
    .filter(([_, region]) => region.slug === regionSlug)
    .map(([id, _]) => id)

  // Search offerings for any matching region ID
  for (const regionId of matchingRegionIds) {
    const offering = REGIONAL_OFFERINGS.find(
      (o) => o.regionId === regionId && o.varietyId === cultivarId && o.isActive
    )
    if (offering) {
      const region = ALL_GROWING_REGIONS[regionId]
      return { offering, region }
    }
  }

  return undefined
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: regionSlug, product: productSlug } = await params

  const region = getRegionBySlug(regionSlug)
  const cultivar = getCultivarFromSlug(productSlug)
  if (!region || !cultivar) return { title: 'Product Not Found' }

  const product = PRODUCTS_BY_ID[cultivar.productId]
  if (!product) return { title: 'Product Not Found' }

  const title = `${cultivar.displayName} from ${region.displayName} | Fielder`
  const description = `Fresh ${cultivar.displayName} harvest predictions for ${region.displayName}, ${region.state}. ${cultivar.flavorProfile || product.description || ''}`

  return {
    title,
    description,
    openGraph: {
      title: `${cultivar.displayName} from ${region.displayName}`,
      description,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  const params: { region: string; product: string }[] = []

  for (const offering of REGIONAL_OFFERINGS) {
    if (!offering.isActive) continue

    const region = ALL_GROWING_REGIONS[offering.regionId]
    const cultivar = CULTIVARS_BY_ID[offering.varietyId || '']

    if (region && cultivar) {
      params.push({
        region: region.slug,
        product: getProductSlug(cultivar.id),
      })
    }
  }

  return params
}

function ProductSchema({
  cultivar,
  product,
  region,
  offering,
}: {
  cultivar: Cultivar
  product: ProductType
  region: GrowingRegionExtended
  offering: RegionalOffering
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${cultivar.displayName} from ${region.displayName}`,
    description:
      cultivar.flavorProfile ||
      `Fresh ${cultivar.displayName} from ${region.displayName}, ${region.state}`,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: region.displayName,
    },
    isAccessoryOrSparePartFor: {
      '@type': 'Place',
      name: region.displayName,
      address: {
        '@type': 'PostalAddress',
        addressRegion: region.state,
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: region.latitude,
        longitude: region.longitude,
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Product Type',
        value: product.displayName,
      },
      {
        '@type': 'PropertyValue',
        name: 'Cultivar',
        value: cultivar.displayName,
      },
      {
        '@type': 'PropertyValue',
        name: 'Growing Region',
        value: region.displayName,
      },
      ...(offering.qualityTier
        ? [{ '@type': 'PropertyValue', name: 'Quality Tier', value: offering.qualityTier }]
        : []),
      ...(cultivar.isHeritage
        ? [{ '@type': 'PropertyValue', name: 'Heritage Variety', value: 'true' }]
        : []),
      ...(cultivar.isNonGmo
        ? [{ '@type': 'PropertyValue', name: 'Non-GMO', value: 'true' }]
        : []),
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function ProductPredictionPage({ params }: Props) {
  const { region: regionSlug, product: productSlug } = await params

  const cultivar = getCultivarFromSlug(productSlug)
  if (!cultivar) notFound()

  const product = PRODUCTS_BY_ID[cultivar.productId]
  if (!product) notFound()

  // Use the new helper that handles legacy aliases
  const result = findOfferingBySlug(regionSlug, cultivar.id)
  if (!result) notFound()

  const { offering, region } = result
  const details = getOfferingDetails(offering.id)
  // Get category for icon display
  const iconCategory = getCategoryFromProduct(cultivar.id, cultivar.productId, product.category)

  // ==========================================================================
  // CATEGORY-SPECIFIC DISPLAY CONFIGURATION
  // ==========================================================================
  const categoryConfig = getCategoryDisplayConfig(product.category, product.subcategory)

  // ==========================================================================
  // GDD PREDICTION ENGINE (only for produce)
  // ==========================================================================
  // Get crop phenology data for this cultivar × region
  // The phenology database uses crop types like 'navel_orange', 'grapefruit', etc.
  // We need to map from cultivar ID to crop type
  const cropTypeMapping: Record<string, string> = {
    // =========================================================================
    // IDENTITY MAPPINGS (for cultivar IDs that match phenology crop types)
    // =========================================================================
    navel_orange: 'navel_orange',
    valencia: 'valencia',
    grapefruit: 'grapefruit',
    satsuma: 'satsuma',
    tangerine: 'tangerine',
    peach: 'peach',
    sweet_cherry: 'sweet_cherry',
    tart_cherry: 'tart_cherry',
    apple: 'apple',
    pear: 'pear',
    strawberry: 'strawberry',
    blueberry: 'blueberry',
    mango: 'mango',
    pomegranate: 'pomegranate',
    pecan: 'pecan',

    // =========================================================================
    // CULTIVAR-SPECIFIC MAPPINGS (map specific cultivars to crop types)
    // =========================================================================
    // Citrus - Navels
    washington_navel: 'navel_orange',
    cara_cara: 'navel_orange',
    lane_late: 'navel_orange',
    // Citrus - Grapefruit
    ruby_red_grapefruit: 'grapefruit',
    rio_star_grapefruit: 'grapefruit',
    marsh_grapefruit: 'grapefruit',
    // Citrus - Valencia
    valencia_orange: 'valencia',
    // Citrus - Blood oranges (use navel timing as approximation)
    moro_blood_orange: 'navel_orange',
    // Citrus - Mandarins
    owari_satsuma: 'satsuma',
    murcott_tangerine: 'tangerine',
    honey_tangerine: 'tangerine',
    // Stone fruit - Peaches
    elberta_peach: 'peach',
    freestone_peach: 'peach',
    // Stone fruit - Cherries
    bing_cherry: 'sweet_cherry',
    rainier_cherry: 'sweet_cherry',
    montmorency_cherry: 'tart_cherry',
    // Pome fruit - Apples
    honeycrisp_apple: 'apple',
    fuji_apple: 'apple',
    gala_apple: 'apple',
    cosmic_crisp: 'apple',
    // Pome fruit - Pears
    bartlett_pear: 'pear',
    anjou_pear: 'pear',
    comice_pear: 'pear',
    // Berries - Strawberries
    sweet_charlie_strawberry: 'strawberry',
    chandler_strawberry: 'strawberry',
    festival_strawberry: 'strawberry',
    // Berries - Blueberries
    duke_blueberry: 'blueberry',
    bluecrop_blueberry: 'blueberry',
    // Nuts - Pecans
    stuart_pecan: 'pecan',
    desirable_pecan: 'pecan',
    // Tropical
    tommy_atkins_mango: 'mango',
    kent_mango: 'mango',
    wonderful_pomegranate: 'pomegranate',
  }

  // Get crop type from cultivar
  const cropType = cropTypeMapping[cultivar.id] || cultivar.productId?.replace(/_/g, '')?.toLowerCase() || cultivar.id

  // Map region slug to phenology region
  const regionMapping: Record<string, string> = {
    'vero-beach-fl': 'florida',
    'indian-river-fl': 'florida',
    'lakeland-fl': 'florida',
    'plant-city-fl': 'florida',
    'homestead-fl': 'florida',
    'mcallen-tx': 'texas',
    'weslaco-tx': 'texas',
    'fredericksburg-tx': 'texas',
    'san-joaquin-valley-ca': 'california',
    'fresno-ca': 'california',
    'wenatchee-wa': 'washington',
    'yakima-wa': 'washington',
    'hood-river-or': 'washington_oregon',
    'traverse-city-mi': 'michigan',
    'grand-rapids-mi': 'michigan',
    'finger-lakes-ny': 'new_york',
    'atlanta-ga': 'georgia',
    'fort-valley-ga': 'georgia',
  }

  const phenologyRegion = regionMapping[region.slug] || region.state?.toLowerCase() || 'florida'

  // Get phenology data from the database
  const phenology = getCropPhenology(cropType, phenologyRegion)

  // Get GDD targets (must be defined before weather/bloom fetching)
  const gddToMaturity = phenology?.gddToMaturity || details?.gddToMaturity || 2000
  const gddToPeak = phenology?.gddToPeak || gddToMaturity + 500
  const gddWindow = phenology?.gddWindow || details?.gddWindow || 500
  const gddBase = phenology?.gddBase || details?.baseTemp || 50

  // ==========================================================================
  // DYNAMIC BLOOM DATE PREDICTION
  // ==========================================================================
  // Instead of using static "typical" bloom dates, predict actual bloom date
  // for this year based on chill hours + heat units from real weather data
  const currentYear = new Date().getFullYear()
  let bloomPrediction: BloomPrediction | null = null
  let bloomDate: Date | null = null
  let typicalBloomDate: Date | null = null

  if (categoryConfig.showGddPrediction && region.id) {
    try {
      bloomPrediction = await predictBloomDate(cropType, region.id, currentYear)
      if (bloomPrediction) {
        bloomDate = bloomPrediction.predictedBloomDate
        typicalBloomDate = bloomPrediction.typicalBloomDate
      }
    } catch (error) {
      console.error('Bloom prediction error:', error)
    }
  }

  // Fallback to static phenology bloom date if prediction unavailable
  if (!bloomDate && phenology) {
    bloomDate = new Date(currentYear, phenology.bloomMonth - 1, phenology.bloomDay)
    typicalBloomDate = bloomDate
  }

  // Calculate days since bloom
  const today = new Date()
  const daysSinceBloom = bloomDate
    ? Math.floor((today.getTime() - bloomDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // ==========================================================================
  // REAL-TIME WEATHER DATA (Open-Meteo API)
  // ==========================================================================
  // Fetch current weather and actual GDD accumulation from real weather data
  let currentWeather: CurrentWeather | null = null
  let actualGddAccumulation: { totalGdd: number; avgDailyGdd: number; days: number } | null = null

  // Only fetch weather for produce categories (GDD-based predictions)
  if (categoryConfig.showGddPrediction && region.id) {
    try {
      // Fetch current weather conditions (live temp, humidity, conditions)
      currentWeather = await weatherService.getCurrentWeather(region.id, gddBase)

      // Fetch actual GDD accumulation from bloom date
      if (bloomDate && daysSinceBloom > 0) {
        actualGddAccumulation = await weatherService.getGddAccumulation(
          region.id,
          bloomDate,
          gddBase
        )
      }
    } catch (error) {
      console.error('Weather fetch error:', error)
      // Continue with estimated GDD if weather fetch fails
    }
  }

  // Use actual GDD if available, otherwise fall back to estimate
  const avgGddPerDay = actualGddAccumulation?.avgDailyGdd
    || (phenology?.gddBase && phenology.gddBase >= 55
      ? 22  // Citrus regions (Florida, Texas, California)
      : phenology?.gddBase && phenology.gddBase >= 50
      ? 18  // Moderate regions
      : 16) // Northern regions

  // Use actual accumulated GDD if available, otherwise estimate
  const actualCurrentGDD = actualGddAccumulation?.totalGdd || null
  const estimatedCurrentGDD = daysSinceBloom > 0 ? daysSinceBloom * avgGddPerDay : 0
  const currentGDD = actualCurrentGDD ?? estimatedCurrentGDD
  const isUsingRealWeather = actualGddAccumulation !== null

  // Calculate predicted harvest dates using GDD
  const calculateGDDHarvestDates = () => {
    if (!bloomDate || daysSinceBloom < 0) {
      // Bloom hasn't happened yet or no bloom date
      return null
    }

    // Days from bloom to each milestone
    const daysToMaturity = Math.ceil(gddToMaturity / avgGddPerDay)
    const daysToPeak = Math.ceil(gddToPeak / avgGddPerDay)
    const daysToWindowEnd = Math.ceil((gddToMaturity + gddWindow) / avgGddPerDay)

    // Calculate actual dates
    const harvestStart = new Date(bloomDate)
    harvestStart.setDate(bloomDate.getDate() + daysToMaturity)

    const harvestEnd = new Date(bloomDate)
    harvestEnd.setDate(bloomDate.getDate() + daysToWindowEnd)

    // Peak is middle 50% of window
    const peakMarginDays = Math.round((daysToWindowEnd - daysToMaturity) * 0.25)
    const peakStart = new Date(bloomDate)
    peakStart.setDate(bloomDate.getDate() + daysToMaturity + peakMarginDays)

    const peakEnd = new Date(bloomDate)
    peakEnd.setDate(bloomDate.getDate() + daysToWindowEnd - peakMarginDays)

    // Calculate current status using actual or estimated GDD
    const percentToMaturity = Math.min(100, Math.round((currentGDD / gddToMaturity) * 100))
    const percentToPeak = Math.min(100, Math.round((currentGDD / gddToPeak) * 100))

    // Determine status based on current GDD (actual or estimated)
    let status: 'pre_season' | 'approaching' | 'harvest_window' | 'peak' | 'late_season' | 'post_season'
    if (currentGDD < gddToMaturity * 0.8) {
      status = 'pre_season'
    } else if (currentGDD < gddToMaturity) {
      status = 'approaching'
    } else if (currentGDD < gddToPeak - (gddWindow * 0.25)) {
      status = 'harvest_window'
    } else if (currentGDD < gddToPeak + (gddWindow * 0.25)) {
      status = 'peak'
    } else if (currentGDD < gddToMaturity + gddWindow) {
      status = 'late_season'
    } else {
      status = 'post_season'
    }

    return {
      harvestStart,
      harvestEnd,
      peakStart,
      peakEnd,
      daysToMaturity,
      daysToPeak,
      daysToWindowEnd,
      percentToMaturity,
      percentToPeak,
      status,
    }
  }

  const gddPrediction = calculateGDDHarvestDates()

  // ==========================================================================
  // UNIFIED QUALITY PREDICTION (Single Source of Truth)
  // ==========================================================================
  // Use the canonical predictQuality() function to ensure consistency
  // across all pages, API routes, and prediction displays
  const qualityPrediction = predictQuality({
    cultivarId: cultivar.id,
    regionId: phenologyRegion,
    currentGDD: currentGDD,
    currentDate: new Date(),
    bloomDate: bloomDate || undefined,
  })

  // Use the canonical predicted Brix from the unified predictor
  const predictedBrix = qualityPrediction.predictedBrix

  // Format date for display
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Calculate peak window (fallback to static months if no phenology)
  const peakWindow = calculatePeakWindow(details?.peakMonths)

  // Calculate live status based on GDD prediction or static months
  const liveStatus = gddPrediction
    ? {
        status: gddPrediction.status === 'peak' ? 'at_peak' as const
          : gddPrediction.status === 'approaching' ? 'approaching' as const
          : gddPrediction.status === 'harvest_window' || gddPrediction.status === 'late_season' ? 'in_season' as const
          : 'off_season' as const,
        statusLabel: gddPrediction.status === 'peak' ? 'At Peak Now'
          : gddPrediction.status === 'approaching' ? 'Peak Soon'
          : gddPrediction.status === 'harvest_window' ? 'In Season'
          : gddPrediction.status === 'late_season' ? 'Late Season'
          : gddPrediction.status === 'pre_season' ? 'Pre-Season'
          : 'Off Season',
        statusColor: gddPrediction.status === 'peak' ? 'bg-green-100 text-green-800 border-green-300'
          : gddPrediction.status === 'approaching' ? 'bg-amber-100 text-amber-800 border-amber-300'
          : gddPrediction.status === 'harvest_window' || gddPrediction.status === 'late_season' ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-stone-100 text-stone-600 border-stone-300',
        daysInfo: gddPrediction.status === 'peak' ? undefined : undefined,
        daysLabel: gddPrediction.status === 'peak'
          ? `${gddPrediction.percentToPeak}% to peak`
          : gddPrediction.status === 'approaching'
          ? `${100 - gddPrediction.percentToMaturity}% to harvest`
          : undefined,
      }
    : calculateLiveStatus(details?.peakMonths)

  // Find SHARE profile for this product category
  // Map product subcategory to SHARE profile category
  const shareCategory = mapToShareCategory(product.subcategory, product.category)
  const shareProfiles = shareCategory ? getProfilesByCategory(shareCategory) : []

  // Select SHARE profile based on actual practice flags
  // IMPORTANT: Quality tier describes expected OUTCOME, not farming PRACTICES
  // If no practice flags are set, default to conventional regardless of quality tier
  // A conventional farm in Indian River can produce exceptional fruit
  const selectShareProfile = () => {
    if (!shareProfiles.length) return null

    // Only use non-conventional profiles if we have EXPLICIT practice flags
    // These flags indicate actual farming practices, not just quality expectations
    if (offering.isRegenerative) {
      return shareProfiles.find(p => p.id.includes('regenerative'))
    }
    if (offering.isOrganic || offering.pestManagement === 'organic') {
      return shareProfiles.find(p => p.id.includes('organic'))
    }
    if (offering.pestManagement === 'ipm') {
      return shareProfiles.find(p => p.id.includes('ipm'))
    }
    if (offering.pestManagement === 'no_spray') {
      return shareProfiles.find(p => p.id.includes('regenerative') || p.id.includes('organic'))
    }

    // No practice flags = assume conventional (the default for most produce)
    // Quality tier does NOT imply special farming practices
    // It indicates expected outcome based on terroir + genetics, not practices
    return shareProfiles.find(p => p.id.includes('conventional')) || shareProfiles.find(p => p.qualityTier === 'standard') || shareProfiles[0]
  }

  const shareProfile = selectShareProfile()

  // Get Brix estimate from cultivar data
  const brixEstimate = cultivar.brixRange || cultivar.brixOptimal
    ? (cultivar.brixRange || [cultivar.brixOptimal! - 1, cultivar.brixOptimal! + 1])
    : (shareProfile as any)?.estimatedBrixRange

  // ==========================================================================
  // SHARE QUALITY ANALYSIS
  // ==========================================================================
  // Generate data-driven SHARE analysis from actual region, cultivar, and timing
  // This replaces the static profile-based approach with quantitative calculations

  // Find cultivar quality profile for genetics data
  const cultivarQualityProfile = CULTIVAR_QUALITY_PROFILES.find(
    p => p.cultivarId === cultivar.id ||
         p.cultivarName.toLowerCase() === cultivar.displayName.toLowerCase() ||
         p.cropType === cropType
  )

  // Calculate timing data for R pillar
  const currentDayOfYear = getCurrentDayOfYear()
  const timingData = peakWindow ? {
    currentDoy: currentDayOfYear,
    harvestWindowStart: dateToDoy(peakWindow.harvestStartDate.month, peakWindow.harvestStartDate.day),
    harvestWindowPeak: dateToDoy(peakWindow.peakStartDate.month, peakWindow.peakStartDate.day),
    harvestWindowEnd: dateToDoy(peakWindow.harvestEndDate.month, peakWindow.harvestEndDate.day),
  } : undefined

  // Generate SHARE analysis with actual data
  // Pass shareProfile for claim-based context when specific data unavailable
  const shareAnalysis: SHAREAnalysis | undefined = categoryConfig.primaryQualityMetric === 'brix'
    ? analyzeSHARE({
        region: region,
        cultivarId: cultivar.id,
        cultivarProfile: cultivarQualityProfile,
        timing: timingData,
        shareProfile: shareProfile,
        category: product.category,
      })
    : undefined

  return (
    <>
      <ProductSchema
        cultivar={cultivar}
        product={product}
        region={region}
        offering={offering}
      />

      <div className="min-h-screen bg-[var(--color-cream)]">
        <Header />

        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb - typewriter style */}
          <nav className="mb-8 font-mono text-xs uppercase tracking-wider text-stone-500">
            <Link href="/predictions" className="hover:text-[var(--color-accent)] transition-colors">
              Regions
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/predictions/${region.slug}`} className="hover:text-[var(--color-accent)] transition-colors">
              {region.displayName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-stone-800">{cultivar.displayName}</span>
          </nav>

          {/* Main Recipe Card */}
          <article className="bg-[var(--color-parchment)] border border-stone-300 shadow-md p-6 sm:p-10">
            {/* Card Header - lined paper effect */}
            <div className="border-b-2 border-[var(--color-accent)] pb-4 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl text-stone-900">
                    {cultivar.displayName}
                  </h1>
                  <p className="mt-1 font-mono text-sm uppercase tracking-wider text-stone-500">
                    {product.displayName}
                  </p>
                </div>
                {/* Live Status Badge */}
                <div className={`px-4 py-2 rounded-lg border ${liveStatus.statusColor} ${liveStatus.status === 'at_peak' ? 'ring-2 ring-green-300 ring-opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    {liveStatus.status === 'at_peak' ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        liveStatus.status === 'approaching' ? 'bg-amber-500 animate-pulse' :
                        liveStatus.status === 'in_season' ? 'bg-blue-500' : 'bg-stone-400'
                      }`} />
                    )}
                    <span className="font-mono text-sm font-medium uppercase tracking-wider">
                      {liveStatus.status === 'at_peak' ? (
                        <span className="animate-pulse">Harvesting Now</span>
                      ) : liveStatus.statusLabel}
                    </span>
                    {isUsingRealWeather && categoryConfig.showGddPrediction && (
                      <span className="text-xs opacity-60 font-normal normal-case">• Live</span>
                    )}
                  </div>
                  {liveStatus.daysLabel && (
                    <p className="text-xs mt-1 opacity-80">{liveStatus.daysLabel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Category Icon - clean placeholder */}
            <div className="mb-8 p-2 bg-white border border-stone-200">
              <div className="aspect-[4/3] overflow-hidden">
                <CategoryIcon
                  category={iconCategory}
                  size="full"
                  showLabel={false}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Live Weather Display (produce only) */}
            {categoryConfig.showGddPrediction && currentWeather && (
              <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-blue-800 font-semibold">
                    Live Weather in {region.displayName}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="font-mono text-2xl font-bold text-blue-900">
                      {Math.round(currentWeather.temperature)}°F
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Current Temp
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-2xl font-bold text-blue-900">
                      {currentWeather.tempHighToday}°/{currentWeather.tempLowToday}°
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      High/Low Today
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-2xl font-bold text-amber-600">
                      +{currentWeather.todayGdd}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      GDD Today
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-sm font-medium text-blue-900 capitalize">
                      {currentWeather.weatherDescription}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {currentWeather.humidity}% humidity
                    </div>
                  </div>
                </div>
                {isUsingRealWeather && actualGddAccumulation && (
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">
                        <span className="font-semibold">{actualGddAccumulation.totalGdd.toLocaleString()}</span> GDD accumulated since bloom
                      </span>
                      <span className="text-blue-500">
                        Avg: {actualGddAccumulation.avgDailyGdd} GDD/day over {actualGddAccumulation.days} days
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specs Grid - Typewriter Index Card Style */}
            <div className="grid gap-6 sm:grid-cols-2 mb-8">
              {/* Origin */}
              <div className="border-l-2 border-stone-300 pl-4">
                <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                  Origin
                </dt>
                <dd className="font-serif text-lg text-stone-900">
                  {region.displayName}, {region.state}
                </dd>
              </div>

              {/* Category */}
              <div className="border-l-2 border-stone-300 pl-4">
                <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                  Category
                </dt>
                <dd className="font-serif text-lg text-stone-900 capitalize">
                  {product.subcategory.replace(/_/g, ' ')}
                </dd>
              </div>

              {/* Regional Quality Potential */}
              {offering.qualityTier && (
                <div className="border-l-2 border-[var(--color-accent)] pl-4">
                  <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                    Regional Quality
                  </dt>
                  <dd className="font-serif text-lg text-[var(--color-accent)] capitalize">
                    {offering.qualityTier}
                  </dd>
                  <p className="font-mono text-xs text-stone-400 mt-1">
                    Terroir potential
                  </p>
                </div>
              )}

              {/* GDD-Based Harvest Prediction (Primary Display) */}
              {gddPrediction && (
                <div className="border-l-2 border-stone-300 pl-4">
                  <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                    Predicted Harvest
                  </dt>
                  <dd className="font-serif text-lg text-stone-900">
                    {formatDate(gddPrediction.harvestStart)} – {formatDate(gddPrediction.harvestEnd)}
                  </dd>
                  <p className="font-mono text-xs text-stone-400 mt-1">
                    Based on GDD accumulation
                  </p>
                </div>
              )}

              {/* GDD-Based Peak Quality (Primary Display) */}
              {gddPrediction && (
                <div className="border-l-2 border-[var(--color-accent)] pl-4">
                  <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                    Peak Quality
                  </dt>
                  <dd className="font-serif text-lg text-[var(--color-accent)]">
                    {formatDate(gddPrediction.peakStart)} – {formatDate(gddPrediction.peakEnd)}
                  </dd>
                  <p className="font-mono text-xs text-stone-400 mt-1">
                    Middle 50% of harvest window
                  </p>
                </div>
              )}

              {/* Fallback to static months if no GDD prediction */}
              {!gddPrediction && peakWindow && (
                <>
                  <div className="border-l-2 border-stone-300 pl-4">
                    <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                      Harvest Season
                    </dt>
                    <dd className="font-serif text-lg text-stone-900">
                      {peakWindow.harvestStart} – {peakWindow.harvestEnd}
                    </dd>
                    <p className="font-mono text-xs text-stone-400 mt-1">
                      {peakWindow.totalDays} days
                    </p>
                  </div>
                  <div className="border-l-2 border-[var(--color-accent)] pl-4">
                    <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                      Peak Quality
                    </dt>
                    <dd className="font-serif text-lg text-[var(--color-accent)]">
                      {peakWindow.peakStart} – {peakWindow.peakEnd}
                    </dd>
                    <p className="font-mono text-xs text-stone-400 mt-1">
                      Middle {peakWindow.peakDays} days of {peakWindow.totalDays}-day window
                    </p>
                  </div>
                </>
              )}

              {/* Predicted Brix (produce only) */}
              {categoryConfig.primaryQualityMetric === 'brix' && predictedBrix > 0 && (
                <div className="border-l-2 border-amber-400 pl-4">
                  <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                    Predicted Brix
                  </dt>
                  <dd className="font-serif text-lg text-amber-700">
                    {predictedBrix}°Bx
                  </dd>
                  <p className="font-mono text-xs text-stone-400 mt-1">
                    Sugar content (sigmoid model)
                  </p>
                </div>
              )}

              {/* Season Info (seafood/non-produce) */}
              {categoryConfig.type !== 'produce' && cultivar.peakMonths && (
                <div className="border-l-2 border-blue-400 pl-4">
                  <dt className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                    Season
                  </dt>
                  <dd className="font-serif text-lg text-blue-700">
                    {peakWindow ? `${peakWindow.harvestStart} – ${peakWindow.harvestEnd}` : 'Year-round'}
                  </dd>
                  <p className="font-mono text-xs text-stone-400 mt-1">
                    {categoryConfig.type === 'seafood' ? 'Catch season' : 'Availability'}
                  </p>
                </div>
              )}
            </div>

            {/* Badges - Heritage / Non-GMO */}
            {(cultivar.isHeritage || cultivar.isNonGmo) && (
              <div className="flex gap-3 mb-8">
                {cultivar.isHeritage && (
                  <span className="font-mono text-xs uppercase tracking-widest px-3 py-1.5 border border-stone-400 text-stone-600">
                    Heritage Variety
                  </span>
                )}
                {cultivar.isNonGmo && (
                  <span className="font-mono text-xs uppercase tracking-widest px-3 py-1.5 border border-stone-400 text-stone-600">
                    Non-GMO
                  </span>
                )}
              </div>
            )}

            {/* Flavor Profile */}
            {cultivar.flavorProfile && (
              <div className="mb-8 p-6 bg-[var(--color-cream)] border-l-4 border-[var(--color-accent)]">
                <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-2">
                  Flavor Profile
                </p>
                <p className="font-serif text-lg text-stone-800 italic leading-relaxed">
                  "{cultivar.flavorProfile}"
                </p>
              </div>
            )}

            {/* Tasting Notes */}
            {offering.flavorNotes && (
              <div className="mb-8">
                <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-2">
                  Tasting Notes
                </p>
                <p className="font-serif text-stone-700 leading-relaxed">
                  {offering.flavorNotes}
                </p>
              </div>
            )}

            {/* GDD Prediction Section (produce only) */}
            {categoryConfig.showGddPrediction && phenology ? (
              <>
                {/* Divider before GDD section */}
                <hr className="border-t border-dashed border-stone-300 my-8" />
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
                    Harvest Prediction Algorithm
                  </h2>
                  {isUsingRealWeather && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-mono uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Live Data
                    </span>
                  )}
                </div>
                <div className={`border rounded-lg p-6 ${isUsingRealWeather ? 'bg-gradient-to-br from-green-50/50 to-stone-50 border-green-200' : 'bg-stone-50 border-stone-200'}`}>
                  {/* Algorithm Explanation */}
                  <p className="font-mono text-xs text-stone-500 mb-4">
                    Growing Degree Days (GDD) predict harvest timing based on accumulated heat, not calendar days.
                    <br />
                    Formula: <code className="bg-white px-1 py-0.5 rounded">GDD = max(0, (T<sub>max</sub> + T<sub>min</sub>) / 2 - {gddBase}°F)</code>
                  </p>

                  {/* Step-by-Step Calculation */}
                  <div className="space-y-4">
                    {/* Step 1: Bloom Date */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 ${bloomPrediction ? 'bg-green-600' : 'bg-[var(--color-accent)]'} text-white rounded-full flex items-center justify-center font-mono text-sm font-bold`}>1</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-sm font-semibold text-stone-800 uppercase tracking-wider">Bloom Date</h3>
                          {bloomPrediction && bloomPrediction.dataSource !== 'fallback_typical' && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">
                              {bloomPrediction.dataSource === 'npn_observed' ? 'NPN OBSERVED' : 'PREDICTED'}
                            </span>
                          )}
                        </div>
                        {bloomPrediction && bloomPrediction.dataSource !== 'fallback_typical' ? (
                          <div className="text-sm text-stone-600 mt-1">
                            <p>
                              {cropType.replace(/_/g, ' ')} in {phenologyRegion} bloomed{' '}
                              <span className="font-bold text-green-700">
                                {bloomDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                              </span>
                              {bloomPrediction.daysFromTypical !== 0 && (
                                <span className={`ml-1 ${bloomPrediction.daysFromTypical < 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                                  ({bloomPrediction.daysFromTypical > 0 ? '+' : ''}{bloomPrediction.daysFromTypical} days vs typical)
                                </span>
                              )}
                            </p>
                            {typicalBloomDate && (
                              <p className="text-xs text-stone-400 mt-1">
                                Typical: {typicalBloomDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                              </p>
                            )}
                            {bloomPrediction.chillHoursRequired > 0 && (
                              <p className="text-xs text-stone-400 mt-1">
                                Chill hours: {bloomPrediction.chillHoursAccumulated.toLocaleString()} / {bloomPrediction.chillHoursRequired.toLocaleString()} required
                                {bloomPrediction.chillRequirementMet ? ' ✓' : ' (accumulating)'}
                              </p>
                            )}
                            <p className="text-xs text-stone-400 mt-1">
                              Confidence: {bloomPrediction.confidence}
                              {bloomPrediction.npnObservedDate && (
                                <span> • NPN crosscheck: {bloomPrediction.npnObservedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="text-sm text-stone-600 mt-1">
                            <p>
                              {cropType.replace(/_/g, ' ')} in {phenologyRegion} blooms around{' '}
                              <span className="font-semibold">
                                {bloomDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                              </span>
                            </p>
                            <p className="text-xs text-stone-400 mt-1">
                              Source: {phenology?.source || 'Historical average'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 2: GDD Accumulation */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 ${isUsingRealWeather ? 'bg-green-600' : 'bg-[var(--color-accent)]'} text-white rounded-full flex items-center justify-center font-mono text-sm font-bold`}>2</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-sm font-semibold text-stone-800 uppercase tracking-wider">GDD Accumulation</h3>
                          {isUsingRealWeather && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">
                              FROM WEATHER API
                            </span>
                          )}
                        </div>
                        {daysSinceBloom > 0 ? (
                          isUsingRealWeather && actualGddAccumulation ? (
                            <div className="text-sm text-stone-600 mt-1">
                              <p>
                                <span className="font-semibold">{actualGddAccumulation.days} days</span> of actual weather data ×{' '}
                                <span className="font-semibold">{actualGddAccumulation.avgDailyGdd} GDD/day</span> (measured) ={' '}
                                <span className="font-bold text-green-700">{actualGddAccumulation.totalGdd.toLocaleString()} GDD</span>
                              </p>
                              <p className="text-xs text-stone-400 mt-2">
                                vs estimated: ~{estimatedCurrentGDD.toLocaleString()} GDD ({Math.round(avgGddPerDay)} GDD/day × {daysSinceBloom} days)
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-stone-600 mt-1">
                              <span className="font-semibold">{daysSinceBloom} days</span> since bloom ×{' '}
                              <span className="font-semibold">{avgGddPerDay} GDD/day</span> (est.) ={' '}
                              <span className="font-semibold text-[var(--color-accent)]">~{estimatedCurrentGDD.toLocaleString()} GDD</span>
                            </p>
                          )
                        ) : (
                          <p className="text-sm text-stone-600 mt-1">
                            Bloom hasn&apos;t occurred yet this season (or just occurred)
                          </p>
                        )}
                        <p className="text-xs text-stone-400 mt-1">
                          Base temperature: {gddBase}°F (below this, no GDD accumulates)
                        </p>
                      </div>
                    </div>

                    {/* Step 3: GDD Targets */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center font-mono text-sm font-bold">3</div>
                      <div className="flex-1">
                        <h3 className="font-mono text-sm font-semibold text-stone-800 uppercase tracking-wider">GDD Targets</h3>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div className="text-center p-3 bg-white rounded border border-stone-200">
                            <div className="font-mono text-lg font-bold text-stone-900">{gddToMaturity.toLocaleString()}</div>
                            <div className="text-xs text-stone-500 uppercase tracking-wider">To Maturity</div>
                            <div className="text-xs text-stone-400">Harvest opens</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded border border-[var(--color-accent)]">
                            <div className="font-mono text-lg font-bold text-[var(--color-accent)]">{gddToPeak.toLocaleString()}</div>
                            <div className="text-xs text-stone-500 uppercase tracking-wider">To Peak</div>
                            <div className="text-xs text-stone-400">Best quality</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded border border-stone-200">
                            <div className="font-mono text-lg font-bold text-stone-900">{gddWindow.toLocaleString()}</div>
                            <div className="text-xs text-stone-500 uppercase tracking-wider">Window</div>
                            <div className="text-xs text-stone-400">GDD range</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Progress */}
                    {gddPrediction && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center font-mono text-sm font-bold">4</div>
                        <div className="flex-1">
                          <h3 className="font-mono text-sm font-semibold text-stone-800 uppercase tracking-wider">Current Progress</h3>
                          <div className="mt-2">
                            {/* Progress to Maturity */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-stone-500 mb-1">
                                <span>Progress to Maturity</span>
                                <span>{gddPrediction.percentToMaturity}%</span>
                              </div>
                              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-stone-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, gddPrediction.percentToMaturity)}%` }}
                                />
                              </div>
                            </div>
                            {/* Progress to Peak */}
                            <div>
                              <div className="flex justify-between text-xs text-stone-500 mb-1">
                                <span>Progress to Peak Quality</span>
                                <span>{gddPrediction.percentToPeak}%</span>
                              </div>
                              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, gddPrediction.percentToPeak)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Brix Prediction */}
                    {predictedBrix > 0 && (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-mono text-sm font-bold">5</div>
                        <div className="flex-1">
                          <h3 className="font-mono text-sm font-semibold text-stone-800 uppercase tracking-wider">Brix Prediction</h3>
                          <p className="text-sm text-stone-600">
                            Based on GDD position using sigmoid curve:{' '}
                            <span className="font-semibold text-amber-700">{predictedBrix}°Bx</span>
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            Cultivar range: {cultivar.brixRange?.[0] || 8}-{cultivar.brixRange?.[1] || cultivar.brixOptimal || 12}°Bx
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data Source Note */}
                  {isUsingRealWeather ? (
                    <div className="mt-6 pt-4 border-t border-green-200">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-700 font-medium">
                          Using live weather data from Open-Meteo API
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        GDD calculated from actual daily high/low temperatures since bloom date.
                        Data refreshes every hour.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 mt-6 pt-4 border-t border-stone-200">
                      Note: This prediction uses estimated GDD accumulation (~{avgGddPerDay} GDD/day average for {phenologyRegion}).
                      Actual GDD varies with daily weather.
                    </p>
                  )}
                </div>
              </div>
              </>
            ) : categoryConfig.showGddPrediction ? (
              // Fallback for produce when phenology data isn't available
              <div className="mb-8">
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-2">
                    Harvest Timing
                  </p>
                  <p className="text-sm text-stone-600">
                    GDD-based prediction not yet available for {cropType.replace(/_/g, ' ')} in {phenologyRegion}.
                    Harvest timing is based on historical seasonal data.
                  </p>
                  {peakWindow && (
                    <div className="mt-4 pt-4 border-t border-stone-200">
                      <p className="text-sm text-stone-700">
                        <span className="font-semibold">Typical harvest:</span> {peakWindow.harvestStart} – {peakWindow.harvestEnd}
                        <br />
                        <span className="font-semibold">Peak quality:</span> {peakWindow.peakStart} – {peakWindow.peakEnd}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Non-produce: show category-appropriate season info
              <div className="mb-8">
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-2">
                    {categoryConfig.type === 'seafood' ? 'Season & Availability' : 'Availability'}
                  </p>
                  {peakWindow ? (
                    <div className="text-sm text-stone-700">
                      <p>
                        <span className="font-semibold">
                          {categoryConfig.type === 'seafood' ? 'Season:' : 'Available:'}
                        </span>{' '}
                        {peakWindow.harvestStart} – {peakWindow.harvestEnd}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">Peak quality:</span> {peakWindow.peakStart} – {peakWindow.peakEnd}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-600">
                      {categoryConfig.type === 'seafood'
                        ? 'Check local regulations for current season dates.'
                        : 'Available year-round from this region.'}
                    </p>
                  )}
                  {categoryConfig.type === 'seafood' && (
                    <p className="text-xs text-stone-400 mt-4 pt-4 border-t border-stone-200">
                      Seafood availability depends on local regulations, weather conditions, and sustainable catch limits.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Divider before SHARE section */}
            <hr className="border-t border-dashed border-stone-300 my-8" />

            {/* SHARE Framework Analysis */}
            <div className="mb-8">
              <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-4">
                Quality Intelligence
              </h2>
              <SHAREBreakdown
                analysis={shareAnalysis}
                profile={shareProfile}
                category={product.category}
                qualityTier={shareAnalysis?.qualityTier || shareProfile?.qualityTier}
                brixEstimate={
                  categoryConfig.primaryQualityMetric === 'brix'
                    ? (shareAnalysis
                        ? [shareAnalysis.brixRange[0], shareAnalysis.brixRange[1]] as [number, number]
                        : brixEstimate as number | [number, number] | undefined)
                    : undefined
                }
                omegaRatioEstimate={categoryConfig.primaryQualityMetric === 'omega_ratio' ? (shareProfile as any)?.estimatedOmegaRatioMidpoint : undefined}
                pillarLabels={categoryConfig.sharePillarLabels}
              />
            </div>

            {/* WHERE TO BUY - Paywall Trigger */}
            <div className="mb-8 p-6 bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 border border-[var(--color-accent)]/30 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg text-stone-900 mb-1">
                    Where to Buy {cultivar.displayName}
                  </h3>
                  <p className="text-sm text-stone-600 mb-3">
                    Get sourcing recommendations for verified quality {product.displayName.toLowerCase()} from {region.displayName}.
                  </p>
                  <button className="inline-flex items-center px-4 py-2 bg-[var(--color-accent)] text-white font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors rounded">
                    Unlock with Premium
                  </button>
                  <p className="text-xs text-stone-500 mt-2">
                    Premium members get unlimited access to sourcing data and full SHARE analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-t border-dashed border-stone-300 my-8" />

            {/* Region Info (category-aware) */}
            <div className="mb-8">
              <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-4">
                About {categoryConfig.type === 'seafood' ? 'the Waters' : 'the Region'}
              </h2>
              {region.notes && (
                <p className="font-serif text-stone-700 leading-relaxed mb-4">{region.notes}</p>
              )}
              <dl className="grid gap-4 sm:grid-cols-2 font-mono text-sm">
                <div>
                  <dt className="text-stone-400 uppercase tracking-wider">Location</dt>
                  <dd className="text-stone-800">{region.primaryCities[0]}, {region.state}</dd>
                </div>

                {/* Produce/Meat: Growing season info */}
                {categoryConfig.regionDisplayFields.showClimate && (
                  <>
                    <div>
                      <dt className="text-stone-400 uppercase tracking-wider">
                        {categoryConfig.type === 'meat' ? 'Grazing Season' : 'Growing Season'}
                      </dt>
                      <dd className="text-stone-800">{region.climate.frostFreeDays} frost-free days</dd>
                    </div>
                    {region.climate.usdaZone && (
                      <div>
                        <dt className="text-stone-400 uppercase tracking-wider">USDA Zone</dt>
                        <dd className="text-stone-800">{region.climate.usdaZone}</dd>
                      </div>
                    )}
                  </>
                )}

                {/* Produce only: GDD info */}
                {categoryConfig.showGddPrediction && region.climate.annualGdd50 && (
                  <div>
                    <dt className="text-stone-400 uppercase tracking-wider">
                      Annual GDD (base {phenology?.gddBase || 50}°F)
                    </dt>
                    <dd className="text-stone-800">
                      {phenology?.gddBase && phenology.gddBase !== 50
                        ? `~${Math.round(region.climate.annualGdd50 * ((100 - (phenology.gddBase - 50) * 2) / 100)).toLocaleString()}`
                        : region.climate.annualGdd50.toLocaleString()}
                    </dd>
                  </div>
                )}

                {/* Seafood: Water-related info */}
                {categoryConfig.regionDisplayFields.showWaters && (
                  <>
                    <div>
                      <dt className="text-stone-400 uppercase tracking-wider">Waters</dt>
                      <dd className="text-stone-800">
                        {region.state === 'FL' && region.slug.includes('key')
                          ? 'Gulf of Mexico & Atlantic'
                          : region.state === 'AK'
                          ? 'North Pacific / Gulf of Alaska'
                          : region.state === 'ME'
                          ? 'North Atlantic'
                          : region.state === 'LA' || region.state === 'AL' || region.state === 'MS'
                          ? 'Gulf of Mexico'
                          : 'Coastal Waters'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-400 uppercase tracking-wider">Water Type</dt>
                      <dd className="text-stone-800">
                        {region.state === 'AK' || region.state === 'ME' ? 'Cold water' : 'Warm water'}
                      </dd>
                    </div>
                  </>
                )}

                {/* Seafood: Season dates */}
                {categoryConfig.regionDisplayFields.showSeasonDates && peakWindow && (
                  <div>
                    <dt className="text-stone-400 uppercase tracking-wider">Typical Season</dt>
                    <dd className="text-stone-800">{peakWindow.harvestStart} – {peakWindow.harvestEnd}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/discover?lat=${region.latitude}&lon=${region.longitude}`}
                className="inline-flex items-center px-6 py-3 bg-[var(--color-accent)] text-white font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors"
              >
                View Live Status
              </Link>
              <Link
                href={`/predictions/${region.slug}`}
                className="inline-flex items-center px-6 py-3 border border-stone-400 text-stone-700 font-mono text-sm uppercase tracking-wider hover:bg-stone-100 transition-colors"
              >
                All {region.displayName} Products
              </Link>
            </div>
          </article>
        </main>

        {/* Footer */}
        <footer className="bg-stone-900 mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <span className="font-serif text-xl text-white">Fielder</span>
                <p className="mt-2 text-sm text-stone-400">Fresh produce at peak quality.</p>
              </div>
              <div className="flex gap-8 font-mono text-xs uppercase tracking-wider">
                <Link href="/discover" className="text-stone-400 hover:text-white transition-colors">
                  Discover
                </Link>
                <Link href="/predictions" className="text-stone-400 hover:text-white transition-colors">
                  Regions
                </Link>
                <Link href="/farm" className="text-stone-400 hover:text-white transition-colors">
                  For Farms
                </Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-stone-800">
              <p className="font-mono text-xs text-stone-500">
                &copy; {new Date().getFullYear()} Fielder. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
