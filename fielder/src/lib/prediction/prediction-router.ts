/**
 * Prediction Router - Routes predictions to category-specific predictors
 *
 * This is the main entry point for the polymorphic SHARE prediction system.
 * It determines the appropriate predictor based on input category and
 * delegates to category-specific implementations.
 *
 * Usage:
 *   import { predictUnified } from '@/lib/prediction/prediction-router'
 *
 *   // Produce prediction
 *   const result = predictUnified({
 *     category: 'produce',
 *     cultivarId: 'washington_navel',
 *     regionId: 'florida',
 *     currentGDD: 5500,
 *   })
 *
 *   // Livestock prediction
 *   const beefResult = predictUnified({
 *     category: 'livestock',
 *     species: 'beef',
 *     breedId: 'angus',
 *     feedingRegime: { diet: 'grass_only' },
 *   })
 */

import type {
  ProductCategory,
  PredictionInput,
  PredictionResult,
  CategoryPredictor,
  ProducePredictionInput,
  LivestockPredictionInput,
  LivestockSpecies,
} from './predictor-interface'

// Import category-specific predictors
import { producePredictor } from './produce-predictor'
import {
  livestockPredictor,
  eggsPredictor,
  dairyPredictor,
} from './livestock-predictor'
import { vegetablePredictor } from './vegetable-predictor'
import { nutPredictor } from './nut-predictor'
import { seafoodPredictor } from './seafood-predictor'
import { honeyPredictor } from './honey-predictor'
import { transformationPredictor } from './transformation-predictor'

// =============================================================================
// Predictor Registry
// =============================================================================

/**
 * Registry of available category predictors
 * Predictors are registered as they are implemented
 */
const predictorRegistry: Map<ProductCategory, CategoryPredictor> = new Map()

/**
 * Register a category predictor
 */
export function registerPredictor(predictor: CategoryPredictor): void {
  predictorRegistry.set(predictor.category, predictor)
}

/**
 * Get a predictor for a category
 */
export function getPredictor(category: ProductCategory): CategoryPredictor | undefined {
  return predictorRegistry.get(category)
}

/**
 * Check if a category has a registered predictor
 */
export function hasPredictor(category: ProductCategory): boolean {
  return predictorRegistry.has(category)
}

/**
 * Get all registered categories
 */
export function getRegisteredCategories(): ProductCategory[] {
  return Array.from(predictorRegistry.keys())
}

// =============================================================================
// Auto-Register Implemented Predictors
// =============================================================================

// Register produce predictor (wraps legacy quality-predictor.ts)
registerPredictor(producePredictor)

// Register livestock predictors
registerPredictor(livestockPredictor)
registerPredictor(eggsPredictor)
registerPredictor(dairyPredictor)

// Register vegetable predictor
registerPredictor(vegetablePredictor)

// Register nut predictor
registerPredictor(nutPredictor)

// Register seafood predictor
registerPredictor(seafoodPredictor)

// Register honey predictor
registerPredictor(honeyPredictor)

// Register transformation predictor (coffee, tea, cacao)
registerPredictor(transformationPredictor)

// =============================================================================
// Main Prediction Function
// =============================================================================

/**
 * Unified prediction entry point
 *
 * Routes to the appropriate category predictor based on input.
 * All categories must have a registered predictor.
 */
export function predictUnified(input: PredictionInput): PredictionResult {
  const predictor = predictorRegistry.get(input.category)

  if (predictor && predictor.canHandle(input)) {
    return predictor.predict(input)
  }

  throw new Error(`No predictor available for category: ${input.category}`)
}

// =============================================================================
// Helper Functions
// =============================================================================

function classifyOmegaRatio(ratio: number): { tier: 'artisan' | 'premium' | 'standard' | 'commodity'; score: number } {
  if (ratio <= 3) {
    return { tier: 'artisan', score: 90 + (3 - ratio) * 3.33 }
  }
  if (ratio <= 6) {
    return { tier: 'premium', score: 70 + (6 - ratio) * 6.67 }
  }
  if (ratio <= 12) {
    return { tier: 'standard', score: 40 + (12 - ratio) * 5 }
  }
  return { tier: 'commodity', score: Math.max(0, 40 - (ratio - 12) * 2) }
}

// =============================================================================
// Exports
// =============================================================================

// Functions are already exported via `export function` declarations above
// Export additional helper function that wasn't exported inline
export { classifyOmegaRatio }

// Re-export types for convenience
export type {
  PredictionInput,
  PredictionResult,
  ProductCategory,
  CategoryPredictor,
  ProducePredictionInput,
  LivestockPredictionInput,
  LivestockSpecies,
}
