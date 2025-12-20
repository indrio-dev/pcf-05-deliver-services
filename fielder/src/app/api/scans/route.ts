/**
 * Consumer Scan API
 *
 * F021: POST /api/scans - Accept consumer refractometer readings from Flavor App.
 *
 * This endpoint is the primary entry point for consumer-generated data:
 * 1. Consumer scans PLU at store
 * 2. Consumer measures Brix with $10 refractometer at home
 * 3. Consumer submits reading via Flavor App
 * 4. Data feeds calibration loop
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { inferFromPLU, isGMORiskCrop } from '@/lib/intelligence/claim-inference'
import { enforcePhysicalBrix, assessDataQuality } from '@/lib/intelligence/validation-engine'

// =============================================================================
// TYPES
// =============================================================================

interface ScanRequest {
  // Product identification
  pluCode?: string
  cultivarId?: string
  productName?: string

  // Measurements
  actualBrix: number
  actualTa?: number

  // Location
  storeName?: string
  storeCity?: string
  storeState?: string
  storeLat?: number
  storeLng?: number

  // Context
  measurementDate?: string
  purchaseDate?: string

  // User identification (anonymous)
  userId?: string
  deviceId?: string

  // Photo evidence
  photoUrl?: string
  refractometerPhotoUrl?: string
}

interface ScanResponse {
  success: boolean
  scanId?: string
  message?: string
  validation?: {
    isValid: boolean
    warnings: string[]
    errors: string[]
  }
  pluInference?: {
    isOrganic: boolean
    isGMO: string
    confidence: string
  }
  dataQuality?: {
    score: number
    issues: string[]
  }
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// =============================================================================
// VALIDATION
// =============================================================================

function validateScanRequest(body: unknown): { valid: boolean; errors: string[]; data?: ScanRequest } {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const data = body as Record<string, unknown>

  // actualBrix is required
  if (data.actualBrix === undefined || data.actualBrix === null) {
    errors.push('actualBrix is required')
  } else if (typeof data.actualBrix !== 'number') {
    errors.push('actualBrix must be a number')
  }

  // Validate PLU format if provided
  if (data.pluCode !== undefined && data.pluCode !== null) {
    if (typeof data.pluCode !== 'string') {
      errors.push('pluCode must be a string')
    } else if (data.pluCode.length > 0 && !/^\d{4,5}$/.test(data.pluCode.trim())) {
      errors.push('pluCode must be 4-5 digits')
    }
  }

  // Validate date format if provided
  if (data.measurementDate !== undefined && data.measurementDate !== null) {
    if (typeof data.measurementDate !== 'string') {
      errors.push('measurementDate must be a string')
    } else {
      const date = new Date(data.measurementDate)
      if (isNaN(date.getTime())) {
        errors.push('measurementDate must be a valid date')
      }
    }
  }

  // Validate coordinates if provided
  if (data.storeLat !== undefined && (typeof data.storeLat !== 'number' || data.storeLat < -90 || data.storeLat > 90)) {
    errors.push('storeLat must be a number between -90 and 90')
  }
  if (data.storeLng !== undefined && (typeof data.storeLng !== 'number' || data.storeLng < -180 || data.storeLng > 180)) {
    errors.push('storeLng must be a number between -180 and 180')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors: [],
    data: data as unknown as ScanRequest,
  }
}

// =============================================================================
// POST HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ScanResponse>> {
  try {
    // Parse request body
    const body = await request.json()

    // Validate request
    const validation = validateScanRequest(body)
    if (!validation.valid || !validation.data) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        validation: {
          isValid: false,
          warnings: [],
          errors: validation.errors,
        },
      }, { status: 400 })
    }

    const data = validation.data

    // Validate Brix using validation engine
    const brixValidation = enforcePhysicalBrix(data.actualBrix)
    if (!brixValidation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Brix value',
        validation: {
          isValid: false,
          warnings: brixValidation.warnings.map(w => w.message),
          errors: brixValidation.errors.map(e => e.message),
        },
      }, { status: 400 })
    }

    // Collect warnings
    const warnings = brixValidation.warnings.map(w => w.message)

    // Infer from PLU if provided
    let pluInference
    if (data.pluCode) {
      const inference = inferFromPLU(data.pluCode)
      pluInference = {
        isOrganic: inference.isOrganic,
        isGMO: inference.isGMO,
        confidence: inference.confidence,
      }
    }

    // Assess data quality
    const quality = assessDataQuality({
      brix: data.actualBrix,
      ta: data.actualTa,
      source: 'consumer',
      timestamp: data.measurementDate ? new Date(data.measurementDate) : new Date(),
    })

    // Store in database
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      // If Supabase not configured, return success without storing
      return NextResponse.json({
        success: true,
        message: 'Scan processed (database not configured)',
        validation: {
          isValid: true,
          warnings,
          errors: [],
        },
        pluInference,
        dataQuality: {
          score: quality.score,
          issues: quality.issues,
        },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Insert into actuals table
    const { data: actual, error } = await supabase
      .from('actuals')
      .insert({
        plu_code: data.pluCode,
        cultivar_id: data.cultivarId,
        actual_brix: data.actualBrix,
        actual_ta: data.actualTa,
        source_type: 'consumer',
        store_name: data.storeName,
        store_location_city: data.storeCity,
        store_location_state: data.storeState,
        store_lat: data.storeLat,
        store_lng: data.storeLng,
        measurement_date: data.measurementDate || new Date().toISOString().split('T')[0],
        user_id: data.userId,
        device_id: data.deviceId,
        photo_url: data.photoUrl,
        refractometer_photo_url: data.refractometerPhotoUrl,
        data_quality_score: quality.score,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to store scan',
        validation: {
          isValid: true,
          warnings,
          errors: [error.message],
        },
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      scanId: actual.id,
      message: 'Scan recorded successfully',
      validation: {
        isValid: true,
        warnings,
        errors: [],
      },
      pluInference,
      dataQuality: {
        score: quality.score,
        issues: quality.issues,
      },
    })

  } catch (error) {
    console.error('Scan API error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

// =============================================================================
// GET HANDLER (for testing)
// =============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Consumer Scan API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Submit a consumer refractometer reading',
        required: ['actualBrix'],
        optional: [
          'pluCode',
          'cultivarId',
          'productName',
          'actualTa',
          'storeName',
          'storeCity',
          'storeState',
          'storeLat',
          'storeLng',
          'measurementDate',
          'purchaseDate',
          'userId',
          'deviceId',
          'photoUrl',
          'refractometerPhotoUrl',
        ],
      },
    },
  })
}
