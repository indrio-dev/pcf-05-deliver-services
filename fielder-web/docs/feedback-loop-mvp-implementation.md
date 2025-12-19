# Feedback Loop MVP - Implementation Guide

**Date**: December 18, 2025
**Goal**: Ship working feedback loop in 2-4 weeks
**Scope**: Manual calibration with 1-2 crops, 2-3 regions, basic consumer scanning

---

## MVP Definition

**What we're building:**
A simple system where consumers can scan produce, measure Brix, and we manually update predictions based on the difference between predicted and actual.

**What we're NOT building (yet):**
- Automated calibration updates
- ML models
- Real-time weather integration
- Complex multi-factor calibrations
- Farmer portal

**Success criteria:**
- 50+ consumer Brix readings collected
- 3+ region×cultivar combos with data
- Manual calibration applied and tested
- Measurable improvement in prediction accuracy (10-20%)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FLAVOR APP (React Native)                │
│                                                             │
│  1. User scans PLU code                                    │
│  2. App identifies: Navel Orange, FL Indian River         │
│  3. App fetches prediction: "Estimated Brix 12.1"         │
│  4. User measures actual Brix: 11.8                        │
│  5. User submits reading (with photo)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ POST /api/scans
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
│                                                             │
│  predictions (what we predicted)                           │
│  actuals (what users measured)                             │
│  calibrations (regional adjustments)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  ADMIN CALIBRATION UI                       │
│                                                             │
│  View: Recent scans, prediction errors                     │
│  Action: Update regional calibration                       │
│  Result: Future predictions adjusted                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (MVP)

```sql
-- Table 1: Store predictions we make
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  cultivar_id TEXT NOT NULL,
  region_id TEXT NOT NULL,
  rootstock_id TEXT,
  year INT NOT NULL,

  -- What we predicted
  predicted_brix DECIMAL(4,2),
  predicted_harvest_start DATE,
  predicted_harvest_end DATE,
  predicted_peak_start DATE,
  predicted_peak_end DATE,

  -- Confidence
  confidence DECIMAL(3,2),

  -- When we made this prediction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Store actual measurements from users
CREATE TABLE actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link back to prediction (if possible)
  prediction_id UUID REFERENCES predictions(id),

  -- Context (same keys as prediction)
  cultivar_id TEXT NOT NULL,
  region_id TEXT NOT NULL,
  year INT NOT NULL,

  -- Source
  source_type TEXT NOT NULL,  -- 'consumer_scan' | 'farmer_report'
  user_id TEXT,               -- Anonymous device ID or user ID

  -- Actual measurement
  actual_brix DECIMAL(4,2) NOT NULL,
  purchase_date DATE,
  measurement_date DATE DEFAULT CURRENT_DATE,

  -- Location
  store_chain TEXT,
  store_location GEOGRAPHY(POINT),

  -- Proof
  photo_url TEXT,

  -- Quality flags
  verified BOOLEAN DEFAULT FALSE,
  is_outlier BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Regional calibrations (manually updated)
CREATE TABLE regional_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key
  region_id TEXT NOT NULL,
  cultivar_id TEXT NOT NULL,

  -- Brix adjustment (what we add/subtract to predictions)
  avg_brix_error DECIMAL(3,2) DEFAULT 0.0,  -- Predicted - Actual
  sample_size INT DEFAULT 0,

  -- Date adjustment (days to shift predictions)
  avg_date_error_days DECIMAL(5,2) DEFAULT 0.0,

  -- When we last updated this
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,

  UNIQUE(region_id, cultivar_id)
);

-- Indexes
CREATE INDEX idx_predictions_lookup ON predictions(cultivar_id, region_id, year);
CREATE INDEX idx_actuals_lookup ON actuals(cultivar_id, region_id, year);
CREATE INDEX idx_actuals_unmatched ON actuals(prediction_id) WHERE prediction_id IS NULL;
```

**Why this schema:**
- Simple: Just 3 tables
- Links predictions to actuals
- Stores manual calibration adjustments
- Can be queried to show errors and accuracy

---

## API Endpoints (MVP)

### 1. Submit Consumer Scan

```typescript
// POST /api/scans
// Body:
{
  plu_code: '4012',                   // PLU scanned
  actual_brix: 11.8,                  // Refractometer reading
  purchase_date: '2025-12-18',
  store_chain: 'Publix',
  store_location: {
    lat: 27.9506,
    lon: -82.4572
  },
  photo_url: 'https://...',           // Optional
  device_id: 'abc123'                 // Anonymous device ID
}

// Response:
{
  success: true,
  actual_id: 'uuid',
  prediction_match: {
    predicted_brix: 12.1,
    error: -0.3,                      // You measured 0.3 lower than predicted
    message: 'Thanks! This helps improve predictions.'
  },
  user_stats: {
    total_scans: 12,
    rank: 'Regional Contributor'
  }
}
```

**Logic:**
1. Decode PLU → identify cultivar (e.g., 4012 = Navel Orange)
2. Infer region from store location
3. Fetch or create prediction for this cultivar×region×date
4. Calculate error: predicted_brix - actual_brix
5. Store in `actuals` table
6. Return feedback to user

### 2. Get Prediction for Product

```typescript
// GET /api/predict?plu=4012&region=indian_river_fl
// Response:
{
  cultivar: {
    id: 'washington_navel',
    name: 'Washington Navel Orange',
    quality_tier: 'premium'
  },
  region: {
    id: 'indian_river_fl',
    name: 'Indian River, Florida'
  },
  prediction: {
    brix: 12.1,
    harvest_window: {
      start: '2025-11-15',
      end: '2026-02-15',
      peak_start: '2025-12-15',
      peak_end: '2026-01-15'
    },
    confidence: 0.75,
    calibrated: true,              // Was regional calibration applied?
    calibration_sample_size: 8     // Based on 8 prior measurements
  },
  status: 'at_peak',                // 'approaching' | 'at_peak' | 'past_peak' | 'off_season'
  message: 'In peak harvest window - expect excellent flavor!'
}
```

**Logic:**
1. Identify cultivar from PLU
2. Identify region from query param or location
3. Check if regional calibration exists
4. Apply calibration if available (brix + adjustment)
5. Return prediction with confidence and status

### 3. Admin: View Calibration Dashboard

```typescript
// GET /api/admin/calibrations
// Response:
{
  calibrations: [
    {
      region: 'indian_river_fl',
      cultivar: 'washington_navel',
      sample_size: 8,
      avg_brix_error: -0.3,          // Predictions running 0.3 Brix high
      predictions: [
        { date: '2025-12-15', predicted: 12.1, actual: 11.8, error: -0.3 },
        { date: '2025-12-18', predicted: 12.0, actual: 11.9, error: -0.1 },
        // ...
      ],
      suggested_adjustment: -0.3,
      current_adjustment: -0.2,      // What's currently applied
      needs_update: true
    }
  ]
}
```

### 4. Admin: Update Calibration

```typescript
// POST /api/admin/calibrations/update
// Body:
{
  region_id: 'indian_river_fl',
  cultivar_id: 'washington_navel',
  brix_adjustment: -0.3,             // Subtract 0.3 from future predictions
  date_adjustment_days: 0,
  notes: 'Based on 8 consumer scans showing consistent -0.3 Brix error'
}

// Response:
{
  success: true,
  calibration_id: 'uuid',
  affected_predictions: 12          // How many future predictions this impacts
}
```

---

## Core Functions (TypeScript)

### 1. PLU Decoder

```typescript
// src/lib/services/plu-decoder.ts

interface PLUData {
  cultivarId: string
  cultivarName: string
  cropType: string
  isOrganic: boolean
}

export function decodePLU(pluCode: string): PLUData | null {
  // Remove prefix 9 if organic
  const isOrganic = pluCode.startsWith('9')
  const basePLU = isOrganic ? pluCode.slice(1) : pluCode

  // PLU lookup table
  const PLU_MAP: Record<string, Omit<PLUData, 'isOrganic'>> = {
    '4012': {
      cultivarId: 'washington_navel',
      cultivarName: 'Navel Orange',
      cropType: 'navel_orange'
    },
    '3108': {
      cultivarId: 'cara_cara',
      cultivarName: 'Cara Cara Navel',
      cropType: 'navel_orange'
    },
    '4036': {
      cultivarId: 'rio_red',
      cultivarName: 'Rio Red Grapefruit',
      cropType: 'grapefruit'
    },
    '4046': {
      cultivarId: 'honeycrisp',
      cultivarName: 'Honeycrisp Apple',
      cropType: 'apple'
    },
    // ... more PLUs
  }

  const pluData = PLU_MAP[basePLU]
  if (!pluData) return null

  return {
    ...pluData,
    isOrganic
  }
}
```

### 2. Prediction Fetcher

```typescript
// src/lib/services/prediction-fetcher.ts

import { harvestPredictor } from './harvest-predictor'
import { supabase } from '../supabase/client'

export async function getOrCreatePrediction(
  cultivarId: string,
  regionId: string,
  date: Date = new Date()
): Promise<Prediction> {
  const year = date.getFullYear()

  // 1. Check if prediction exists in database
  const { data: existing } = await supabase
    .from('predictions')
    .select('*')
    .eq('cultivar_id', cultivarId)
    .eq('region_id', regionId)
    .eq('year', year)
    .single()

  if (existing) {
    return existing
  }

  // 2. Generate new prediction using prediction engine
  const cultivarProfile = getCultivarProfile(cultivarId)
  const regionData = getRegionData(regionId)

  // Get current GDD
  const currentGdd = await calculateCurrentGdd(regionId, date)

  // Predict harvest window
  const window = harvestPredictor.predictHarvestWindow(
    cultivarProfile.cropType,
    regionId,
    currentGdd,
    regionData.avgDailyGdd
  )

  // Predict Brix
  const brixPrediction = harvestPredictor.predictBrix(
    cultivarProfile.researchAvgBrix || 11.0,
    0.0,  // No rootstock for now
    null, // Unknown tree age
    currentGdd,
    window.gddAtPeak
  )

  // 3. Check for regional calibration
  const calibration = await getCalibration(regionId, cultivarId)
  let adjustedBrix = brixPrediction.predictedBrix
  let confidence = 0.6  // Base confidence

  if (calibration && calibration.sample_size >= 3) {
    adjustedBrix = brixPrediction.predictedBrix + calibration.avg_brix_error
    confidence = Math.min(0.9, confidence + (calibration.sample_size * 0.05))
  }

  // 4. Store prediction in database
  const { data: newPrediction } = await supabase
    .from('predictions')
    .insert({
      cultivar_id: cultivarId,
      region_id: regionId,
      year,
      predicted_brix: adjustedBrix,
      predicted_harvest_start: window.harvestStart,
      predicted_harvest_end: window.harvestEnd,
      predicted_peak_start: window.optimalStart,
      predicted_peak_end: window.optimalEnd,
      confidence
    })
    .select()
    .single()

  return newPrediction
}
```

### 3. Calibration Getter

```typescript
// src/lib/services/calibration.ts

interface RegionalCalibration {
  region_id: string
  cultivar_id: string
  avg_brix_error: number
  sample_size: number
  avg_date_error_days: number
  last_updated: Date
}

export async function getCalibration(
  regionId: string,
  cultivarId: string
): Promise<RegionalCalibration | null> {
  const { data } = await supabase
    .from('regional_calibrations')
    .select('*')
    .eq('region_id', regionId)
    .eq('cultivar_id', cultivarId)
    .single()

  return data
}

export async function updateCalibration(
  regionId: string,
  cultivarId: string,
  brixAdjustment: number,
  dateAdjustment: number = 0,
  notes?: string
): Promise<void> {
  // Fetch all actuals for this region×cultivar
  const { data: actuals } = await supabase
    .from('actuals')
    .select('*')
    .eq('region_id', regionId)
    .eq('cultivar_id', cultivarId)
    .not('is_outlier', 'eq', true)  // Exclude outliers

  const sampleSize = actuals?.length || 0

  // Upsert calibration
  await supabase
    .from('regional_calibrations')
    .upsert({
      region_id: regionId,
      cultivar_id: cultivarId,
      avg_brix_error: brixAdjustment,
      avg_date_error_days: dateAdjustment,
      sample_size: sampleSize,
      last_updated: new Date(),
      updated_by: 'admin'
    })

  console.log(`Updated calibration for ${regionId}:${cultivarId}`)
  console.log(`  Brix adjustment: ${brixAdjustment}`)
  console.log(`  Sample size: ${sampleSize}`)
}
```

### 4. Error Calculator

```typescript
// src/lib/services/error-calculator.ts

interface PredictionError {
  brixError: number           // Predicted - Actual (positive = overestimated)
  dateError: number | null    // Days from peak center
  percentError: number        // Brix error as percentage
}

export function calculateError(
  predicted: Prediction,
  actual: Actual
): PredictionError {
  const brixError = predicted.predicted_brix - actual.actual_brix
  const percentError = (brixError / predicted.predicted_brix) * 100

  let dateError: number | null = null
  if (actual.purchase_date && predicted.predicted_peak_start && predicted.predicted_peak_end) {
    // Calculate center of peak window
    const peakCenter = new Date(
      (predicted.predicted_peak_start.getTime() + predicted.predicted_peak_end.getTime()) / 2
    )
    const diffMs = actual.purchase_date.getTime() - peakCenter.getTime()
    dateError = Math.round(diffMs / (1000 * 60 * 60 * 24))
  }

  return {
    brixError,
    dateError,
    percentError
  }
}

export function isOutlier(
  actual: number,
  predicted: number,
  historicalErrors: number[]
): boolean {
  if (historicalErrors.length < 3) return false  // Not enough data

  const error = predicted - actual
  const mean = historicalErrors.reduce((a, b) => a + b) / historicalErrors.length
  const variance = historicalErrors.reduce((sq, e) => sq + Math.pow(e - mean, 2), 0) / historicalErrors.length
  const stdDev = Math.sqrt(variance)

  const zScore = Math.abs(error - mean) / stdDev
  return zScore > 3.0  // Flag if >3 standard deviations from mean
}
```

---

## Flavor App UI (React Native MVP)

### Screen 1: PLU Scanner

```tsx
// src/screens/ScanScreen.tsx

import React, { useState } from 'react'
import { Camera } from 'react-native-vision-camera'
import { decodePLU } from '../lib/plu-decoder'

export function ScanScreen() {
  const [pluCode, setPluCode] = useState('')
  const [scanning, setScanning] = useState(false)

  const handleBarcode = (barcode: string) => {
    setPluCode(barcode)
    setScanning(false)

    // Navigate to prediction screen
    navigation.navigate('Prediction', { pluCode: barcode })
  }

  return (
    <View>
      <Text>Scan PLU Code</Text>

      {scanning ? (
        <Camera onBarcode={handleBarcode} />
      ) : (
        <View>
          <Button onPress={() => setScanning(true)}>
            Scan with Camera
          </Button>

          <Text>Or enter manually:</Text>
          <TextInput
            placeholder="4012"
            value={pluCode}
            onChangeText={setPluCode}
            keyboardType="numeric"
          />
          <Button onPress={() => navigation.navigate('Prediction', { pluCode })}>
            Continue
          </Button>
        </View>
      )}
    </View>
  )
}
```

### Screen 2: Prediction Display

```tsx
// src/screens/PredictionScreen.tsx

import React, { useEffect, useState } from 'react'
import { decodePLU } from '../lib/plu-decoder'
import { getPrediction } from '../lib/api'

export function PredictionScreen({ route }) {
  const { pluCode } = route.params
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrediction() {
      const pluData = decodePLU(pluCode)
      if (!pluData) {
        alert('PLU not recognized')
        return
      }

      // Get user location
      const location = await getCurrentLocation()
      const region = inferRegionFromLocation(location)

      // Fetch prediction
      const pred = await getPrediction(pluData.cultivarId, region)
      setPrediction(pred)
      setLoading(false)
    }

    fetchPrediction()
  }, [pluCode])

  if (loading) return <LoadingSpinner />

  return (
    <View>
      <Text style={styles.title}>{prediction.cultivar.name}</Text>
      <Text>{prediction.region.name}</Text>

      <View style={styles.brixBox}>
        <Text style={styles.brixLabel}>Estimated Brix</Text>
        <Text style={styles.brixValue}>{prediction.prediction.brix}</Text>
        {prediction.prediction.calibrated && (
          <Text style={styles.calibratedBadge}>
            ✓ Calibrated (based on {prediction.prediction.calibration_sample_size} measurements)
          </Text>
        )}
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.status}>{prediction.status}</Text>
        <Text>{prediction.message}</Text>
      </View>

      <Button onPress={() => navigation.navigate('MeasureBrix', { prediction })}>
        Measure Actual Brix →
      </Button>
    </View>
  )
}
```

### Screen 3: Brix Measurement

```tsx
// src/screens/MeasureBrixScreen.tsx

import React, { useState } from 'react'
import { submitScan } from '../lib/api'

export function MeasureBrixScreen({ route }) {
  const { prediction } = route.params
  const [brix, setBrix] = useState('')
  const [photo, setPhoto] = useState(null)

  const handleSubmit = async () => {
    const location = await getCurrentLocation()

    const result = await submitScan({
      plu_code: prediction.plu,
      actual_brix: parseFloat(brix),
      purchase_date: new Date().toISOString(),
      store_location: location,
      photo_url: photo,
      device_id: getDeviceId()
    })

    // Show result
    navigation.navigate('Result', { result })
  }

  return (
    <View>
      <Text style={styles.title}>Measure with Refractometer</Text>

      <View style={styles.instructions}>
        <Text>1. Squeeze drop of juice onto refractometer</Text>
        <Text>2. Close cover and look through eyepiece</Text>
        <Text>3. Read number where blue meets white</Text>
        <Image source={require('../assets/refractometer-tutorial.png')} />
      </View>

      <TextInput
        style={styles.brixInput}
        placeholder="12.5"
        value={brix}
        onChangeText={setBrix}
        keyboardType="decimal-pad"
      />

      <Button onPress={() => takePhoto().then(setPhoto)}>
        Take Photo of Reading
      </Button>

      <Button onPress={handleSubmit} disabled={!brix}>
        Submit Measurement
      </Button>
    </View>
  )
}
```

### Screen 4: Result Display

```tsx
// src/screens/ResultScreen.tsx

import React from 'react'

export function ResultScreen({ route }) {
  const { result } = route.params
  const { prediction_match, user_stats } = result

  const errorMessage = prediction_match.error > 0
    ? `${Math.abs(prediction_match.error).toFixed(1)} Brix sweeter than predicted!`
    : `${Math.abs(prediction_match.error).toFixed(1)} Brix less sweet than predicted`

  return (
    <View>
      <Text style={styles.title}>Thanks for Contributing!</Text>

      <View style={styles.comparisonBox}>
        <View style={styles.column}>
          <Text style={styles.label}>Predicted</Text>
          <Text style={styles.value}>{prediction_match.predicted_brix}</Text>
        </View>
        <Text style={styles.vs}>vs</Text>
        <View style={styles.column}>
          <Text style={styles.label}>Your Measurement</Text>
          <Text style={styles.value}>{prediction_match.actual_brix}</Text>
        </View>
      </View>

      <Text style={styles.errorMessage}>{errorMessage}</Text>
      <Text style={styles.helpText}>
        {prediction_match.message}
      </Text>

      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Your Impact</Text>
        <Text>Total scans: {user_stats.total_scans}</Text>
        <Text>Rank: {user_stats.rank}</Text>
      </View>

      <Button onPress={() => navigation.navigate('Scan')}>
        Scan Another Product
      </Button>
    </View>
  )
}
```

---

## Admin Calibration UI (Next.js)

### Page: Calibration Dashboard

```tsx
// src/app/admin/calibrations/page.tsx

import { supabase } from '@/lib/supabase/client'

export default async function CalibrationsPage() {
  // Fetch all calibrations with recent actuals
  const { data: calibrations } = await supabase
    .from('regional_calibrations')
    .select(`
      *,
      actuals:actuals(*)
    `)
    .order('last_updated', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Regional Calibrations</h1>

      <div className="grid gap-6">
        {calibrations.map(cal => (
          <CalibrationCard key={cal.id} calibration={cal} />
        ))}
      </div>
    </div>
  )
}

function CalibrationCard({ calibration }) {
  const needsUpdate = Math.abs(calibration.avg_brix_error) > 0.3
    && calibration.sample_size >= 5

  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">
            {calibration.region_id} × {calibration.cultivar_id}
          </h3>
          <p className="text-sm text-gray-600">
            {calibration.sample_size} measurements
          </p>
        </div>
        {needsUpdate && (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
            Needs Update
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Avg Brix Error</p>
          <p className="text-xl font-bold">
            {calibration.avg_brix_error > 0 ? '+' : ''}
            {calibration.avg_brix_error.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Current Adjustment</p>
          <p className="text-xl font-bold">
            {calibration.avg_brix_error.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="text-xl font-bold">
            {calibration.sample_size >= 10 ? 'High' : 'Medium'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Link href={`/admin/calibrations/${cal.id}`}>
          <Button>View Details & Update</Button>
        </Link>
      </div>
    </div>
  )
}
```

---

## Testing Plan

### 1. Unit Tests

```typescript
// __tests__/plu-decoder.test.ts
describe('PLU Decoder', () => {
  it('should decode standard PLU', () => {
    const result = decodePLU('4012')
    expect(result.cultivarId).toBe('washington_navel')
    expect(result.isOrganic).toBe(false)
  })

  it('should decode organic PLU', () => {
    const result = decodePLU('94012')
    expect(result.cultivarId).toBe('washington_navel')
    expect(result.isOrganic).toBe(true)
  })
})

// __tests__/error-calculator.test.ts
describe('Error Calculator', () => {
  it('should calculate Brix error correctly', () => {
    const predicted = { predicted_brix: 12.0 }
    const actual = { actual_brix: 11.5 }
    const error = calculateError(predicted, actual)

    expect(error.brixError).toBe(0.5)  // Predicted 0.5 higher
    expect(error.percentError).toBeCloseTo(4.17)
  })
})
```

### 2. Integration Tests

```typescript
// __tests__/calibration-flow.test.ts
describe('Calibration Flow', () => {
  it('should update calibration when new actuals arrive', async () => {
    // 1. Create prediction
    const prediction = await createPrediction({
      cultivar_id: 'washington_navel',
      region_id: 'indian_river_fl',
      predicted_brix: 12.0
    })

    // 2. Submit actual
    await submitActual({
      prediction_id: prediction.id,
      actual_brix: 11.5
    })

    // 3. Calculate calibration
    const cal = await recalculateCalibration('indian_river_fl', 'washington_navel')

    // 4. Verify adjustment
    expect(cal.avg_brix_error).toBeCloseTo(0.5)
  })
})
```

### 3. End-to-End Tests (Manual)

**Test Case 1: Consumer scans and submits Brix**
1. Open Flavor App
2. Scan PLU 4012 (Navel Orange)
3. View prediction (should show ~12.0 Brix)
4. Enter actual Brix: 11.8
5. Submit
6. Verify: actual stored in database
7. Verify: prediction_id linked correctly

**Test Case 2: Admin updates calibration**
1. Open admin dashboard
2. View Indian River × Washington Navel
3. See 5 measurements, avg error -0.2
4. Update calibration to -0.2
5. Create new prediction for same cultivar×region
6. Verify: new prediction = 11.8 (12.0 - 0.2)

**Test Case 3: Calibration improves accuracy**
1. Collect 10 actuals for a region×cultivar
2. Calculate mean error
3. Apply calibration
4. Collect 10 more actuals
5. Compare: mean absolute error before vs after
6. Target: 10-20% improvement

---

## Launch Checklist

### Week 1: Database & API
- [ ] Create Supabase tables (predictions, actuals, calibrations)
- [ ] Implement PLU decoder
- [ ] Build `/api/predict` endpoint
- [ ] Build `/api/scans` endpoint
- [ ] Write error calculation functions
- [ ] Write calibration getter/setter

### Week 2: Flavor App
- [ ] Setup React Native project
- [ ] Build PLU scanner screen
- [ ] Build prediction display screen
- [ ] Build Brix measurement screen
- [ ] Build result display screen
- [ ] Test on iOS/Android

### Week 3: Admin UI
- [ ] Build calibration dashboard
- [ ] Build calibration detail page
- [ ] Build calibration update form
- [ ] Test manual calibration flow

### Week 4: Testing & Refinement
- [ ] Recruit 10-20 beta testers
- [ ] Collect 50+ Brix readings
- [ ] Apply first calibrations
- [ ] Measure accuracy improvement
- [ ] Fix bugs, improve UX
- [ ] Launch to 100 users

---

## Success Metrics (First Month)

| Metric | Target |
|--------|--------|
| Consumer scans | 50+ |
| Brix readings | 50+ |
| Calibrated region×cultivar combos | 3+ |
| Prediction accuracy improvement | 10-20% |
| User retention (scan 2+ times) | 30% |
| Admin calibration updates | 3+ |

---

## What's Next After MVP

Once MVP is working and we have 50+ measurements:

1. **Automate calibration updates** (no manual admin intervention)
2. **Add farmer reporting** (harvest date, Brix samples)
3. **Expand to 5-10 crops** (apples, strawberries, grapes)
4. **Build accuracy dashboard** (show before/after calibration)
5. **Implement gamification** (badges, leaderboards)
6. **Graduate to Phase 2** (automated statistical calibration)

---

## Questions to Answer During MVP

1. **Data quality**: Are consumer Brix readings accurate enough? (compare to lab data)
2. **Sample size**: How many measurements needed for reliable calibration? (test 3 vs 5 vs 10)
3. **Outliers**: What % of readings are outliers? (establish thresholds)
4. **Timing**: Does measurement date matter? (at store vs days later)
5. **User behavior**: Will people actually measure Brix? (test incentives)
6. **Accuracy gain**: How much does calibration help? (measure before/after)

---

**Document Status**: Implementation Guide Complete
**Next Step**: Create database schema and start building API endpoints
**Owner**: Fielder Engineering Team
**Last Updated**: December 18, 2025
