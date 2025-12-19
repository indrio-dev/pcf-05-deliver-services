# Flavor App Feedback Loop - Research & Design

**Date**: December 18, 2025
**Purpose**: Design practical feedback architecture for learning from actual produce quality vs predictions

---

## Executive Summary

The Flavor App feedback loop turns consumer quality measurements (Brix readings) and farmer harvest reports into a self-improving prediction system. This document outlines the data collection architecture, learning system design, and phased implementation strategy.

**Key Insight**: The feedback loop already exists in legacy Python code (`feedback_loop.py`) but was never implemented. We now have TypeScript prediction models and Supabase infrastructure to build it properly.

---

## 1. Current Prediction System

### What Fielder Predicts (Formula-Based)

```typescript
// From harvest-predictor.ts
Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod

// Example: Washington Navel on Carrizo at peak timing
11.5 (cultivar) + 0.6 (rootstock) + 0.0 (prime age) + 0.0 (at peak) = 12.1 Brix
```

**Current predictions include:**
- `harvest_start` / `harvest_end` - GDD-based window
- `optimal_start` / `optimal_end` - Peak quality window (middle 50%)
- `predicted_brix` - Based on cultivar + rootstock + age + timing
- `quality_tier` - Artisan (14-18) / Premium (12-15) / Standard (10-12) / Commodity (8-10)
- `confidence` - 0.5-1.0 based on data availability

### What Can Be Measured (Actuals)

**From Consumers (Flavor App):**
- Actual Brix reading (refractometer)
- Purchase date
- Store location
- Product identifier (PLU/barcode)
- Visual quality assessment

**From Farmers:**
- Actual harvest date
- Actual Brix sample (representative)
- Quality subjective rating
- Weather anomalies
- Management decisions (irrigation, thinning, etc.)

### The Learning Signal

```
Prediction Error = Actual - Predicted

Date Error = Actual Harvest Date - Predicted Peak Center
Brix Error = Actual Brix - Predicted Brix
```

**These errors become calibration adjustments for future predictions.**

---

## 2. Data Collection Points

### 2.1 Consumer Data (Flavor App Scans)

```typescript
interface FlavorAppScan {
  // PRODUCT IDENTIFICATION
  scanType: 'plu' | 'barcode' | 'manual'
  pluCode?: string                    // '4012', '94011' (organic)
  barcode?: string                    // UPC/EAN
  productType: string                 // 'navel_orange', 'strawberry'
  variety?: string                    // 'Washington', 'Sweet Charlie'
  cultivar?: string                   // If identifiable
  isOrganic: boolean                  // From PLU prefix or user input

  // ORIGIN (inferred from packaging/PLU)
  packinghouse?: string               // Sunkist, Dole, etc.
  packingHouseCode?: string           // From sticker
  originRegion?: string               // 'california_central_valley'
  originState?: string                // If region not identified

  // PURCHASE CONTEXT
  storeChain?: string                 // 'Whole Foods', 'Publix'
  storeLocation: {
    lat: number
    lon: number
    city: string
    state: string
  }
  purchaseDate: Date
  daysInTransit?: number              // Consumer estimate

  // QUALITY MEASUREMENT
  brixActual: number                  // Refractometer reading (PRIMARY)
  visualQuality?: 1 | 2 | 3 | 4 | 5   // Optional subjective
  tasteRating?: 1 | 2 | 3 | 4 | 5     // Optional subjective
  flavorNotes?: string                // Optional text
  photoUrl?: string                   // Photo of refractometer

  // PREDICTION AT TIME OF SCAN
  brixPredicted?: number              // What Fielder predicted
  qualityTierPredicted?: string       // What tier Fielder assigned
  confidencePredicted?: number        // Prediction confidence

  // METADATA
  userId?: string                     // If logged in
  deviceId: string                    // Anonymous tracking
  appVersion: string
  scanTimestamp: Date
}
```

**Collection Flow:**
1. User scans PLU at store OR at home after purchase
2. App identifies product via PLU → SHARE inference
3. App makes prediction based on region/season/cultivar
4. User measures Brix with $10 refractometer
5. User enters reading (or app OCRs photo of refractometer)
6. Prediction vs actual captured

**Data Quality Considerations:**
- Refractometer accuracy: ±0.2 Brix (acceptable)
- Consumer technique variation: Can be reduced with in-app training
- Timing variation: Some measure at store, some days later (track this)
- Selection bias: Premium subscribers more likely to scan high-quality produce

### 2.2 Farmer Data (Partner Farm Reports)

```typescript
interface FarmerHarvestReport {
  // FARM CONTEXT
  farmId: string
  fieldId?: string
  blockId?: string                    // Specific orchard block

  // CROP DETAILS
  cultivarId: string
  rootstockId?: string
  treeAgeYears?: number
  acreage?: number

  // HARVEST EVENT
  harvestDate: Date
  harvestType: 'commercial' | 'sample' | 'peak_test'
  quantityHarvested?: number          // Pounds/boxes

  // QUALITY MEASUREMENTS (representative samples)
  brixSamples: number[]               // Multiple readings
  brixAvg: number
  brixStdDev: number
  aciditySamples?: number[]           // If measured
  acidityAvg?: number

  // SUBJECTIVE ASSESSMENT
  qualityRating: 1 | 2 | 3 | 4 | 5    // Farmer's assessment
  flavorNotes?: string

  // CONTEXT & ANOMALIES
  weatherAnomalies?: string           // "Late frost", "drought"
  managementNotes?: string            // "Reduced irrigation", "thinned crop"
  yieldNotes?: string                 // "Heavy crop", "light crop"

  // DESTINATION
  packinghouse?: string
  marketChannel?: 'wholesale' | 'dtc' | 'retail' | 'processing'

  // PREDICTION COMPARISON (filled by system)
  predictedHarvestStart?: Date
  predictedHarvestEnd?: Date
  predictedBrix?: number
  daysFromPredictedPeak?: number      // Calculated
  brixError?: number                  // Calculated

  // METADATA
  reportedBy: string                  // User ID
  reportDate: Date
  verified: boolean                   // Admin review flag
}
```

**Collection Methods:**
- Web form for partner farms
- Mobile app for field reporting
- API integration for packinghouses with lab data
- Manual CSV upload for legacy data

**Incentives for Farmer Participation:**
- Better predictions = better market timing
- Access to aggregated quality data
- Marketing benefits (verified quality)
- Premium marketplace placement

### 2.3 Packinghouse Lab Data (Premium Tier)

```typescript
interface PackinghousLabData {
  // SOURCE
  packinghouse: string
  lotNumber: string
  receiveDate: Date

  // ORIGIN
  farmId?: string                     // If known
  growerId?: string
  originRegion: string
  cultivar: string

  // LAB MEASUREMENTS (representative sample)
  sampleSize: number                  // # of fruit tested
  brixReadings: number[]
  brixAvg: number
  brixMin: number
  brixMax: number
  acidityReadings?: number[]
  acidityAvg?: number
  ratioAvg?: number                   // SSC/TA

  // PHYSICAL QUALITY
  sizeDist?: { [size: string]: number } // Size distribution
  packOut?: number                    // % that met grade
  defects?: { [type: string]: number }

  // METADATA
  labTech: string
  labDate: Date
  certificationStandard?: string      // USDA, organic, etc.
}
```

**Access Strategy:**
- Partner with progressive packinghouses
- API integration where possible
- Aggregate data to protect proprietary info
- Focus on cultivar×region×timing patterns, not specific farms

---

## 3. Feedback Loop Architecture

### 3.1 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   PREDICTION ENGINE (TypeScript)                │
│                                                                 │
│  Input: cultivar, region, rootstock, age, practices            │
│  Output: predicted_brix, harvest_window, quality_tier          │
│  Confidence: 0.5-1.0 based on calibration data availability    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     MAKE PREDICTION                             │
│                                                                 │
│  Store: prediction_id, predicted_brix, predicted_dates,        │
│         confidence, timestamp                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  COLLECT ACTUALS (3 sources)                    │
│                                                                 │
│  1. Consumer Scans: Brix reading, purchase date, location      │
│  2. Farmer Reports: Harvest date, Brix samples, quality notes  │
│  3. Lab Data: Representative Brix, acidity, quality metrics    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CALCULATE ERRORS                               │
│                                                                 │
│  date_error = actual_harvest - predicted_peak                  │
│  brix_error = actual_brix - predicted_brix                     │
│  confidence_check = was prediction in expected range?          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               AGGREGATE TO CALIBRATIONS                         │
│                                                                 │
│  Key: region_id + cultivar_id + (optional: rootstock)         │
│  Stats: mean_error, std_dev, sample_size, years_of_data       │
│  Update: Regional calibration tables                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            APPLY CALIBRATIONS TO NEW PREDICTIONS                │
│                                                                 │
│  adjusted_brix = predicted_brix + calibration_offset           │
│  adjusted_confidence = base_confidence + calibration_boost     │
│  adjusted_window = predicted_window + date_offset              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Loop continues)
```

### 3.2 Calibration Logic (From Legacy Python)

**The system starts with research-based predictions (imperfect).**

```python
# From legacy/python_engine/fielder/services/feedback_loop.py

class RegionalCalibration:
    """
    Improvement pathway:
    1. Research-based baseline (50-60% accuracy)
    2. Regional calibration from aggregated feedback (70-80%)
    3. Farm-specific patterns for repeat partners (80-90%)
    """

    region_id: str
    cultivar_id: str

    # Date adjustments
    avg_date_error_days: float = 0.0     # Positive = predictions run early
    date_error_std: float = 7.0
    sample_size_dates: int = 0

    # Brix adjustments
    avg_brix_error: float = 0.0          # Positive = predictions run low
    brix_error_std: float = 0.5
    sample_size_brix: int = 0

    @property
    def date_adjustment(self) -> int:
        """Days to adjust predictions."""
        if self.sample_size_dates < 3:
            return 0  # Not enough data
        return round(self.avg_date_error_days)

    @property
    def confidence_boost(self) -> float:
        """How much to boost confidence based on calibration data."""
        if self.sample_size_dates >= 20:
            return 0.2
        elif self.sample_size_dates >= 10:
            return 0.15
        elif self.sample_size_dates >= 5:
            return 0.1
        elif self.sample_size_dates >= 3:
            return 0.05
        return 0.0
```

**Key Insights:**
- Need minimum 3 data points before applying calibration
- Confidence increases with more observations
- Standard deviation narrows with more data (uncertainty reduction)
- 5+ years of data = reliable regional patterns

### 3.3 Database Schema

```sql
-- Predictions table (stores what we predicted)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  cultivar_id TEXT NOT NULL,
  region_id TEXT NOT NULL,
  rootstock_id TEXT,
  year INT NOT NULL,
  season TEXT NOT NULL,  -- 'early', 'mid', 'late'

  -- Prediction values
  predicted_brix DECIMAL(4,2),
  predicted_harvest_start DATE,
  predicted_harvest_end DATE,
  predicted_peak_start DATE,
  predicted_peak_end DATE,
  predicted_quality_tier TEXT,  -- 'artisan', 'premium', 'standard', 'commodity'

  -- Confidence & metadata
  confidence DECIMAL(3,2),
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actuals table (stores what actually happened)
CREATE TABLE actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to prediction (if available)
  prediction_id UUID REFERENCES predictions(id),

  -- Source
  source_type TEXT NOT NULL,  -- 'consumer_scan', 'farmer_report', 'lab_data'
  source_id TEXT,  -- user_id, farm_id, lab_id

  -- Context (same keys as prediction)
  cultivar_id TEXT NOT NULL,
  region_id TEXT NOT NULL,
  rootstock_id TEXT,
  year INT NOT NULL,

  -- Actual measurements
  actual_brix DECIMAL(4,2),
  actual_harvest_date DATE,
  actual_quality_rating INT,  -- 1-5

  -- Consumer-specific
  purchase_date DATE,
  store_location GEOGRAPHY(POINT),
  days_in_transit INT,

  -- Farmer-specific
  harvest_type TEXT,  -- 'commercial', 'sample'
  weather_notes TEXT,
  management_notes TEXT,

  -- Measurement metadata
  measurement_method TEXT,  -- 'refractometer', 'lab', 'subjective'
  photo_url TEXT,
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calibrations table (aggregated learning)
CREATE TABLE regional_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key
  region_id TEXT NOT NULL,
  cultivar_id TEXT NOT NULL,
  rootstock_id TEXT,  -- NULL = applies to all rootstocks

  -- Date calibration
  avg_date_error_days DECIMAL(5,2) DEFAULT 0.0,
  date_error_std DECIMAL(5,2) DEFAULT 7.0,
  sample_size_dates INT DEFAULT 0,

  -- Brix calibration
  avg_brix_error DECIMAL(3,2) DEFAULT 0.0,
  brix_error_std DECIMAL(3,2) DEFAULT 0.5,
  sample_size_brix INT DEFAULT 0,

  -- Metadata
  years_of_data INT DEFAULT 0,
  first_data_year INT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  -- Uniqueness constraint
  UNIQUE(region_id, cultivar_id, rootstock_id)
);

-- Prediction accuracy tracking
CREATE TABLE accuracy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  region_id TEXT NOT NULL,
  cultivar_id TEXT,  -- NULL = all cultivars in region
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,

  -- Date accuracy
  total_date_predictions INT DEFAULT 0,
  within_7_days INT DEFAULT 0,
  within_14_days INT DEFAULT 0,
  mean_absolute_error_days DECIMAL(5,2),

  -- Brix accuracy
  total_brix_predictions INT DEFAULT 0,
  within_0_5_brix INT DEFAULT 0,
  within_1_0_brix INT DEFAULT 0,
  mean_absolute_error_brix DECIMAL(3,2),

  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_predictions_cultivar_region ON predictions(cultivar_id, region_id, year);
CREATE INDEX idx_actuals_cultivar_region ON actuals(cultivar_id, region_id, year);
CREATE INDEX idx_actuals_source ON actuals(source_type, source_id);
CREATE INDEX idx_calibrations_lookup ON regional_calibrations(region_id, cultivar_id);
```

---

## 4. Learning System Design

### 4.1 What Type of Model?

**Answer: Start with Statistical Calibration, Not ML**

The legacy Python code got this right: use **statistical adjustments** (mean error + std dev) before jumping to ML.

**Reasons:**
1. **Interpretable**: Farmers and agronomists can understand "predictions ran 5 days early on average"
2. **Sample efficient**: Works with small data (3+ observations)
3. **Trustworthy**: No black box, clear cause/effect
4. **Maintainable**: No model drift, retraining, deployment complexity

**When to graduate to ML:**
- 1000+ prediction-actual pairs per region×cultivar combo
- Complex non-linear patterns emerge
- Need to incorporate weather APIs in real-time
- Ready to invest in MLOps infrastructure

### 4.2 Phase 1: Statistical Calibration (MVP)

```typescript
interface CalibrationEngine {
  /**
   * Update calibration when new actual data arrives
   */
  async updateCalibration(
    actual: ActualMeasurement
  ): Promise<RegionalCalibration> {
    // 1. Fetch prediction that matches this actual
    const prediction = await findMatchingPrediction(actual)

    // 2. Calculate errors
    const dateError = actual.harvest_date - prediction.peak_center
    const brixError = actual.brix - prediction.predicted_brix

    // 3. Fetch existing calibration for region×cultivar
    const cal = await getCalibration(actual.region_id, actual.cultivar_id)

    // 4. Update running statistics
    cal.sample_size_dates += 1
    cal.avg_date_error = updateMean(cal.avg_date_error, dateError, cal.sample_size_dates)
    cal.date_error_std = updateStdDev(cal.date_error_std, dateError, cal.avg_date_error)

    if (actual.brix) {
      cal.sample_size_brix += 1
      cal.avg_brix_error = updateMean(cal.avg_brix_error, brixError, cal.sample_size_brix)
      cal.brix_error_std = updateStdDev(cal.brix_error_std, brixError, cal.avg_brix_error)
    }

    // 5. Save updated calibration
    await saveCalibration(cal)

    return cal
  }

  /**
   * Apply calibration to a new prediction
   */
  applyCalibration(
    prediction: RawPrediction,
    calibration: RegionalCalibration
  ): CalibratedPrediction {
    // Adjust Brix
    let adjustedBrix = prediction.brix
    if (calibration.sample_size_brix >= 3) {
      adjustedBrix = prediction.brix + calibration.avg_brix_error
    }

    // Adjust dates
    let adjustedHarvestStart = prediction.harvest_start
    let adjustedPeakStart = prediction.peak_start
    if (calibration.sample_size_dates >= 3) {
      const offset = calibration.avg_date_error_days
      adjustedHarvestStart = addDays(prediction.harvest_start, offset)
      adjustedPeakStart = addDays(prediction.peak_start, offset)
    }

    // Boost confidence
    let adjustedConfidence = prediction.confidence
    adjustedConfidence += calibration.confidence_boost
    adjustedConfidence = Math.min(0.95, adjustedConfidence)  // Cap at 95%

    return {
      ...prediction,
      brix: adjustedBrix,
      harvest_start: adjustedHarvestStart,
      peak_start: adjustedPeakStart,
      confidence: adjustedConfidence,
      calibration_applied: true,
      calibration_sample_size: calibration.sample_size_dates
    }
  }
}
```

**Key Decision Points:**
- Minimum 3 observations before applying calibration (avoid noise)
- Cap confidence at 95% (never claim certainty)
- Track sample size so users know how much data backs the prediction
- Use rolling window (last 5 years) to adapt to climate shifts

### 4.3 Phase 2: Multi-Factor Calibration

**Once we have 10+ observations per region×cultivar:**

```typescript
interface AdvancedCalibration {
  // Segment calibrations by additional factors
  byRootstock: Map<string, RegionalCalibration>  // Different rootstocks
  byTreeAge: Map<string, RegionalCalibration>    // Young vs prime vs old
  byPractices: Map<string, RegionalCalibration>  // Organic vs conventional vs regenerative
  byWeatherYear: Map<number, RegionalCalibration> // Drought years, frost years
}
```

**This allows refinements like:**
- "Washington Navels on Carrizo in Indian River run 3 days late on average"
- "Young trees (5-7 years) average 0.8 Brix lower than prime trees"
- "Drought years (2022, 2023) ran 10 days early with -1.2 Brix"

### 4.4 Phase 3: ML-Enhanced Predictions (Future)

**When to consider ML:**
- 1000+ observations across multiple years
- Want to incorporate real-time weather APIs
- Non-linear patterns emerge (e.g., temperature×humidity interactions)

**Model Options:**
1. **Gradient Boosting (XGBoost/LightGBM)**
   - Good for tabular data
   - Feature importance interpretability
   - Handles non-linear relationships
   - Can incorporate weather APIs, soil tests, etc.

2. **Gaussian Process Regression**
   - Provides uncertainty estimates (critical for agriculture)
   - Sample efficient
   - Can encode domain knowledge via kernel design

3. **Neural Network (Multi-layer Perceptron)**
   - If patterns are highly complex
   - Need to encode image data (satellite, drone)
   - Requires much more data (10K+ observations)

**Recommended: Start with Gradient Boosting**
- Best balance of accuracy, interpretability, sample efficiency
- Can show feature importance to agronomists
- Scales from 1K to 1M+ observations

**Features for ML Model:**
```python
features = [
    # Genetic factors (H pillar)
    'cultivar_id',
    'cultivar_base_brix',
    'rootstock_id',
    'rootstock_brix_modifier',
    'tree_age_years',

    # Environmental (S pillar)
    'region_id',
    'soil_type',
    'soil_organic_matter',
    'soil_ph',

    # Practices (A pillar)
    'organic_certified',
    'irrigation_type',
    'crop_load_managed',

    # Weather (dynamic)
    'gdd_accumulated',
    'precip_last_30d',
    'temp_avg_last_30d',
    'frost_events',

    # Temporal
    'days_since_bloom',
    'year',
    'season',
]

target = 'actual_brix'  # or 'days_to_peak'
```

---

## 5. MVP vs Full Vision

### 5.1 MVP (Phase 1): Manual Calibration - 3-6 months

**Scope:**
- Consumer scans with refractometer readings
- Basic prediction engine (already built in TypeScript)
- Manual calibration updates (admin interface)
- 1-2 partner farms reporting harvest data

**Success Metrics:**
- 100+ consumer Brix readings collected
- 10+ farmer harvest reports
- 3+ region×cultivar combos with calibration data
- Demonstrate 10-20% improvement in prediction accuracy

**Implementation:**
```typescript
// Simple calibration update function
async function updateCalibrationManual(
  regionId: string,
  cultivarId: string,
  actual: { brix: number, harvestDate: Date }
) {
  // 1. Fetch current calibration
  const cal = await getCalibration(regionId, cultivarId)

  // 2. Fetch recent predictions for this combo
  const predictions = await getPredictions(regionId, cultivarId, actual.harvestDate)

  // 3. Calculate error
  const error = actual.brix - predictions[0].predicted_brix

  // 4. Update running average
  cal.sample_size += 1
  cal.avg_error = (cal.avg_error * (cal.sample_size - 1) + error) / cal.sample_size

  // 5. Save
  await saveCalibration(cal)

  // 6. Log for review
  console.log(`Updated ${regionId}:${cultivarId} - new avg error: ${cal.avg_error}`)
}
```

**Why Manual First:**
- Validate data quality before automating
- Learn which data points are most valuable
- Identify edge cases and data cleaning needs
- Build confidence in the approach

### 5.2 Phase 2: Automated Statistical Calibration - 6-12 months

**Scope:**
- Automatic calibration updates when actuals arrive
- Confidence intervals and uncertainty quantification
- Accuracy reporting dashboard
- 5-10 partner farms integrated

**New Features:**
- Real-time calibration updates (no admin intervention)
- Prediction accuracy reports by region/cultivar
- Data quality scoring (flag outliers)
- A/B testing: calibrated vs uncalibrated predictions

**Success Metrics:**
- 1000+ consumer Brix readings
- 50+ farmer harvest reports
- 10+ region×cultivar combos with 5+ years of data
- Demonstrate 30-40% improvement in accuracy

### 5.3 Full Vision: ML-Enhanced + Real-Time Weather - 12-24 months

**Scope:**
- Gradient boosting model trained on 10K+ observations
- Real-time weather API integration (OpenWeather, Visual Crossing)
- Farm-specific calibrations for repeat partners
- Packinghouse lab data integration

**Advanced Features:**
- Weather-adjusted predictions ("frost event detected, revising harvest window")
- Uncertainty visualization ("85% confident harvest in next 7 days")
- Comparative analytics ("your farm vs regional average")
- Anomaly detection ("this cultivar performing unusually well")

**Success Metrics:**
- 50K+ consumer Brix readings
- 500+ farmer harvest reports
- 50+ region×cultivar combos fully calibrated
- Prediction accuracy: 70-80% within 7 days, 0.5 Brix

---

## 6. Data Privacy & Quality Controls

### 6.1 Privacy Considerations

**Consumer Data:**
- Anonymous device IDs by default
- Optional account for history/trends
- Aggregate data for public display
- Never share individual readings with farms (without consent)

**Farmer Data:**
- Farm-specific calibrations kept private
- Aggregated regional data shared publicly
- Opt-in for marketplace listing
- Control over what data is published

**Packinghouse Data:**
- Always aggregated, never farm-specific
- Protect proprietary practices
- Focus on cultivar×region patterns
- License data under NDA if needed

### 6.2 Data Quality Controls

**Consumer Scans:**
- Flag outliers (>3 std dev from mean)
- Require photo proof for extreme readings
- Track user reputation (serial outliers flagged)
- Cross-validate with farmer/lab data

**Farmer Reports:**
- Verify farm credentials
- Compare to historical patterns
- Flag inconsistencies for manual review
- Reward consistent, accurate reporting

**Lab Data:**
- Require certification (USDA, state labs)
- Cross-check with farmer reports
- Weight lab data higher than consumer scans
- Track lab reputation over time

### 6.3 Outlier Detection

```typescript
function isOutlier(
  measurement: number,
  historicalData: number[],
  threshold: number = 3.0
): boolean {
  const mean = historicalData.reduce((a, b) => a + b) / historicalData.length
  const stdDev = Math.sqrt(
    historicalData.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / historicalData.length
  )

  const zScore = Math.abs(measurement - mean) / stdDev
  return zScore > threshold
}

// Example: Flag Brix reading if >3σ from historical for that cultivar×region
if (isOutlier(actual.brix, historicalBrixReadings)) {
  await flagForReview({
    actual_id: actual.id,
    reason: 'outlier_brix',
    z_score: zScore,
    requires_photo: true
  })
}
```

---

## 7. User Incentives & Gamification

### 7.1 Consumer Incentives

**Why would consumers measure Brix?**

1. **Immediate value**: "Was this fruit worth the price?"
2. **Discovery**: "This variety is better than that variety"
3. **Accountability**: "Prove that 'organic' is/isn't better"
4. **Community**: "Compare your readings with others"
5. **Education**: "Learn what good produce tastes like"

**Gamification Elements:**
- **Badges**: "100 scans", "Regional expert", "Quality detective"
- **Leaderboards**: Top contributors by region
- **Impact stats**: "Your data improved predictions for 1000 users"
- **Rewards**: Free refractometer for 50+ quality scans
- **Challenges**: "Scan 5 varieties this month"

### 7.2 Farmer Incentives

**Why would farmers report harvest data?**

1. **Better predictions**: Their own future harvests predicted more accurately
2. **Market timing**: Data helps them time market peaks
3. **Quality verification**: Prove their produce is superior
4. **Premium placement**: Featured in marketplace with verified data
5. **Competitive intelligence**: Compare to regional averages

**Compensation Models:**
- Free premium subscription for reporting farms
- Revenue share on marketplace sales
- Grant access to aggregated competitive data
- Verification badge ("Data-verified quality")

### 7.3 Network Effects

```
More consumer scans
         ↓
More regional data
         ↓
Better predictions
         ↓
Higher consumer trust
         ↓
More premium subscribers
         ↓
More marketplace purchases
         ↓
More farmer participation (revenue opportunity)
         ↓
More farmer harvest reports
         ↓
Even better predictions
         ↓
(flywheel accelerates)
```

**The moat:** Every prediction→measurement pair is proprietary training data that can't be replicated by competitors.

---

## 8. Technical Implementation Roadmap

### 8.1 Backend (Supabase + TypeScript)

**Immediate (Week 1-2):**
- [ ] Create `predictions`, `actuals`, `regional_calibrations` tables
- [ ] Port Python `FeedbackCollector` class to TypeScript
- [ ] Port Python `PredictionCalibrator` class to TypeScript
- [ ] Write calibration update functions

**Short-term (Month 1-2):**
- [ ] Build consumer scan submission API
- [ ] Build farmer harvest report API
- [ ] Create admin calibration review dashboard
- [ ] Implement outlier detection
- [ ] Write accuracy report generator

**Medium-term (Month 3-6):**
- [ ] Automate calibration updates (no manual review)
- [ ] Build prediction accuracy dashboard
- [ ] Implement confidence interval calculations
- [ ] Add A/B testing framework

### 8.2 Flavor App (Consumer Interface)

**Immediate (Week 1-2):**
- [ ] PLU code scanner (camera + manual entry)
- [ ] Product identification (PLU → cultivar)
- [ ] Brix entry form (with photo upload)
- [ ] Basic prediction display

**Short-term (Month 1-2):**
- [ ] Refractometer tutorial (in-app)
- [ ] Photo OCR for Brix reading
- [ ] Scan history (show prediction vs actual)
- [ ] Community leaderboard

**Medium-term (Month 3-6):**
- [ ] Gamification (badges, points)
- [ ] Comparison view (product A vs B)
- [ ] Regional quality maps
- [ ] Social sharing

### 8.3 Farmer Portal

**Immediate (Week 1-2):**
- [ ] Basic harvest report form
- [ ] Brix sample entry
- [ ] View own prediction accuracy

**Short-term (Month 1-2):**
- [ ] Mobile app for field reporting
- [ ] CSV upload for bulk data
- [ ] View regional benchmarks
- [ ] Quality verification badge

**Medium-term (Month 3-6):**
- [ ] Real-time prediction updates
- [ ] Weather anomaly detection
- [ ] Comparative analytics
- [ ] Marketplace integration

---

## 9. Success Metrics & KPIs

### 9.1 Data Collection Metrics

| Metric | MVP (Month 3) | Phase 2 (Month 12) | Full Vision (Month 24) |
|--------|---------------|-------------------|------------------------|
| Consumer scans | 100+ | 1,000+ | 50,000+ |
| Farmer reports | 10+ | 50+ | 500+ |
| Calibrated region×cultivar combos | 3+ | 10+ | 50+ |
| Lab data integrations | 0 | 1-2 | 5+ |

### 9.2 Accuracy Metrics

| Metric | Baseline (Research) | MVP (Month 3) | Phase 2 (Month 12) | Full Vision (Month 24) |
|--------|---------------------|---------------|-------------------|------------------------|
| Date accuracy (within 7 days) | 50% | 60% | 70% | 80% |
| Date accuracy (within 14 days) | 70% | 80% | 85% | 90% |
| Brix accuracy (within 0.5) | 40% | 50% | 60% | 70% |
| Brix accuracy (within 1.0) | 70% | 75% | 85% | 90% |
| Mean absolute error (days) | 10 | 8 | 6 | 4 |
| Mean absolute error (Brix) | 1.5 | 1.2 | 0.8 | 0.5 |

### 9.3 Business Metrics

| Metric | MVP (Month 3) | Phase 2 (Month 12) | Full Vision (Month 24) |
|--------|---------------|-------------------|------------------------|
| Premium conversions (scan → subscribe) | 1% | 3% | 5% |
| Farmer partners | 2 | 10 | 50 |
| Marketplace GMV (monthly) | $0 | $10K | $100K |
| Data moat (proprietary pairs) | 100 | 1,000 | 50,000 |

---

## 10. Risks & Mitigations

### 10.1 Data Quality Risks

**Risk**: Consumer Brix readings are inaccurate or noisy
**Mitigation**:
- In-app tutorial on proper refractometer use
- Require photo proof for outliers
- Cross-validate with farmer/lab data
- Weight readings by user reputation

**Risk**: Farmers report biased data (overestimate quality)
**Mitigation**:
- Cross-check with packinghouse data
- Flag systematic biases
- Reward accuracy, not high numbers
- Blind validation with consumer scans

**Risk**: Sample size too small for statistical significance
**Mitigation**:
- Start with high-volume crops (citrus, apples)
- Focus on major regions first
- Aggregate across similar cultivars if needed
- Show confidence intervals transparently

### 10.2 User Adoption Risks

**Risk**: Consumers won't buy refractometers
**Mitigation**:
- Subsidize cost ($10 vs $30 retail)
- Bundle with premium subscription
- Gamify the measurement experience
- Show immediate value ("this was a good purchase")

**Risk**: Farmers won't report data
**Mitigation**:
- Demonstrate value (better predictions)
- Offer premium features for free
- Revenue share from marketplace
- Start with Indrio's partner farms

**Risk**: Paywall limits data collection
**Mitigation**:
- Keep basic scanning free
- Only paywall advanced features
- Allow refund for active data contributors
- Grandfather early adopters

### 10.3 Technical Risks

**Risk**: Prediction-actual matching is ambiguous
**Mitigation**:
- Store predictions with wide context (region×cultivar×date range)
- Allow manual matching for edge cases
- Use temporal proximity + location as matching heuristic
- Flag ambiguous matches for review

**Risk**: Calibration overfits to noisy data
**Mitigation**:
- Require minimum 3 observations
- Use rolling window (last 5 years)
- Apply outlier detection before calibration
- Show sample size to users

**Risk**: System drift (climate change invalidates old data)
**Mitigation**:
- Weight recent years more heavily
- Track year-over-year trends
- Detect anomalies (e.g., "2023 was 10 days early")
- Integrate weather APIs for real-time adjustments

---

## 11. Competitive Advantages

### 11.1 What Makes This Unique

**No one else is doing this:**
- Yuka scores additives (not nutrition)
- EWG scores pesticides (not quality)
- BioNutrient Meter is $$$$ lab equipment
- USDA grades appearance (not flavor)

**Fielder is the only platform that:**
1. Predicts internal quality (Brix, nutrition)
2. Measures actual outcomes at scale
3. Learns from prediction errors
4. Improves predictions over time
5. Connects consumers to verified quality

### 11.2 The Data Moat

**Why this is defensible:**

| Asset | Replicability | Time to Build |
|-------|--------------|---------------|
| Prediction models | Medium (research-based) | 1-2 years |
| Regional calibrations | **Impossible** (requires data) | 3-5 years |
| Consumer scan data | **Impossible** (proprietary) | 5+ years |
| Farmer relationships | Hard (requires trust) | 2-3 years |
| Packinghouse integrations | Hard (requires scale) | 3-5 years |

**The moat deepens with every data point.**

A competitor starting today would be 3-5 years behind even if they copied our code, because they can't replicate the prediction→measurement pairs we've collected.

### 11.3 Network Effects

**Supply-side (Farmers):**
- More farmers reporting → Better regional predictions
- Better predictions → More farmer value
- More farmer value → More farmers join

**Demand-side (Consumers):**
- More consumer scans → More regional data
- More regional data → Better predictions
- Better predictions → Higher trust
- Higher trust → More premium subscribers

**Cross-side:**
- More consumer demand → Higher marketplace prices
- Higher prices → More farmer participation
- More farmers → Better sourcing for consumers

**Winner-take-most dynamics:** The platform with the most data makes the best predictions, which attracts the most users, which generates more data.

---

## 12. Next Steps

### Immediate Actions (This Week)

1. **Review with team**: Validate approach, refine scope
2. **Prioritize MVP**: Pick 2-3 crops and 2-3 regions to start
3. **Design database schema**: Finalize `predictions`, `actuals`, `calibrations` tables
4. **Prototype Flavor App**: Basic PLU scanner + Brix entry
5. **Recruit pilot farmers**: Start with 1-2 Indrio partners

### Short-term (Next Month)

1. **Build calibration engine**: Port Python logic to TypeScript
2. **Launch consumer beta**: 10-20 users testing Flavor App
3. **Collect first data**: Target 50-100 Brix readings
4. **Manual calibration**: Update predictions based on actuals
5. **Validate improvement**: Compare calibrated vs uncalibrated accuracy

### Medium-term (Next Quarter)

1. **Automate calibration**: Remove manual review step
2. **Scale consumer app**: 500+ users, 1000+ scans
3. **Partner with farms**: 5-10 farms reporting harvest data
4. **Accuracy dashboard**: Track and report prediction performance
5. **Optimize UX**: Refine based on user feedback

---

## 13. Conclusion

The Flavor App feedback loop is **the most defensible part of Fielder's business model**. It transforms consumer curiosity ("how good is this fruit?") and farmer reporting into an unreplicable data asset that compounds over time.

**Key Success Factors:**
1. **Start simple**: Statistical calibration before ML
2. **Focus quality**: 100 good measurements > 1000 noisy ones
3. **Incentivize participation**: Clear value for consumers and farmers
4. **Transparent uncertainty**: Show confidence intervals, don't oversell
5. **Long-term mindset**: The moat builds over 3-5 years, not months

**The Vision:**
By 2030, Fielder has 10M+ consumer scans and 5,000+ farmer reports, covering every major crop and region in the US. Our predictions are 80% accurate within 7 days and 0.5 Brix. No competitor can catch up because they lack the historical data. We become **the S&P Global of food quality** - the trusted source of verified nutrition data that governments, retailers, and consumers rely on.

**The moat is measured in data points, and the flywheel starts with a $10 refractometer.**

---

**Document Status**: Research & Design Complete
**Next Milestone**: MVP Database Schema + Calibration Engine Prototype
**Owner**: Alex Brown / Fielder Team
**Last Updated**: December 18, 2025
