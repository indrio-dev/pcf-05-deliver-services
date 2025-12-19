/**
 * POST /api/predict/unified
 *
 * POLYMORPHIC PREDICTION API
 *
 * Routes predictions to category-specific predictors via the unified router.
 * Supports all product categories: produce, livestock, eggs, dairy, vegetables,
 * nuts, seafood, honey, and transformed products (coffee, tea, cacao).
 *
 * Each category has different input requirements and quality metrics.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  predictUnified,
  getRegisteredCategories,
  type PredictionInput,
  type ProductCategory,
} from '@/lib/prediction/prediction-router'

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, ...rest } = body

    // Validate category
    if (!category) {
      return NextResponse.json(
        {
          error: 'category is required',
          validCategories: getRegisteredCategories(),
        },
        { status: 400 }
      )
    }

    const validCategories = getRegisteredCategories()
    if (!validCategories.includes(category as ProductCategory)) {
      return NextResponse.json(
        {
          error: `Invalid category: ${category}`,
          validCategories,
        },
        { status: 400 }
      )
    }

    // Build prediction input
    const input: PredictionInput = {
      category: category as ProductCategory,
      ...rest,
    }

    // Validate category-specific required fields
    const validationError = validateCategoryInput(category, rest)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Run prediction
    const result = predictUnified(input)

    return NextResponse.json({
      success: true,
      category,
      prediction: {
        qualityScore: result.qualityScore,
        qualityTier: result.qualityTier,
        confidence: result.confidence,
        primaryMetric: result.primaryMetric,
      },
      share: {
        soil: result.soil,
        heritage: result.heritage,
        agricultural: result.agricultural,
        ripen: result.ripen,
        enrich: result.enrich,
      },
      modelInfo: result.modelInfo,
    })
  } catch (error) {
    console.error('Unified prediction error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Prediction failed', details: message },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET Handler - Documentation
// =============================================================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/predict/unified',
    method: 'POST',
    description: 'Polymorphic SHARE prediction for all product categories',
    categories: getRegisteredCategories(),
    examples: {
      produce: {
        category: 'produce',
        cultivarId: 'washington_navel',
        regionId: 'indian_river_fl',
        rootstockId: 'carrizo',
        treeAgeYears: 12,
        currentGDD: 5500,
      },
      livestock: {
        category: 'livestock',
        species: 'beef',
        breedId: 'angus',
        feedingRegime: {
          diet: 'grass_only',
          finishingMonths: 0,
        },
      },
      eggs: {
        category: 'eggs',
        breedId: 'heritage_layers',
        feedingRegime: {
          diet: 'pasture_forage',
          isOrganic: true,
        },
      },
      vegetables: {
        category: 'vegetables',
        subcategory: 'leafy',
        varietyId: 'romaine',
        daysSinceHarvest: 2,
      },
      nuts: {
        category: 'nuts',
        nutType: 'pecan',
        cultivarId: 'stuart',
        treeAgeYears: 25,
      },
      seafood: {
        category: 'seafood',
        speciesId: 'wild_salmon',
        sourceType: 'wild_caught',
        catchSeason: 'summer',
      },
      honey: {
        category: 'honey',
        varietalId: 'clover',
        isRaw: true,
        regionId: 'midwest',
      },
      transformed: {
        category: 'transformed',
        productType: 'coffee',
        varietyId: 'bourbon',
        originId: 'ethiopia_yirgacheffe',
        processingMethod: 'washed',
        roastLevel: 'light',
      },
    },
  })
}

// =============================================================================
// Validation
// =============================================================================

function validateCategoryInput(
  category: string,
  input: Record<string, unknown>
): string | null {
  switch (category) {
    case 'produce':
      if (!input.cultivarId) return 'cultivarId is required for produce'
      break

    case 'livestock':
      if (!input.species) return 'species is required for livestock (beef, pork, poultry)'
      if (!input.feedingRegime) return 'feedingRegime is required for livestock'
      break

    case 'eggs':
      if (!input.feedingRegime) return 'feedingRegime is required for eggs'
      break

    case 'dairy':
      if (!input.feedingRegime) return 'feedingRegime is required for dairy'
      break

    case 'vegetables':
      if (!input.subcategory) return 'subcategory is required for vegetables (leafy, root, cruciferous, etc.)'
      break

    case 'nuts':
      if (!input.nutType) return 'nutType is required for nuts'
      break

    case 'seafood':
      if (!input.speciesId) return 'speciesId is required for seafood'
      if (!input.sourceType) return 'sourceType is required for seafood (wild_caught or farm_raised)'
      break

    case 'honey':
      // Honey has sensible defaults, no required fields
      break

    case 'transformed':
      if (!input.productType) return 'productType is required for transformed (coffee, tea, cacao)'
      break
  }

  return null
}
