# Flavor App Feedback Loop - System Architecture

**Date**: December 18, 2025
**Purpose**: Visual representation of the complete feedback loop system

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLAVOR APP ECOSYSTEM                               │
│                                                                             │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐  │
│  │  CONSUMER APP    │     │   FARMER PORTAL  │     │  LAB INTEGRATION │  │
│  │  (React Native)  │     │   (Web/Mobile)   │     │  (API/CSV)       │  │
│  │                  │     │                  │     │                  │  │
│  │  • PLU Scanner   │     │  • Harvest Report│     │  • Brix Samples  │  │
│  │  • Brix Entry    │     │  • Quality Notes │     │  • Acidity Test  │  │
│  │  • Photo Upload  │     │  • Timing Data   │     │  • Representative│  │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘  │
│           │                       │                         │              │
│           └───────────────────────┴─────────────────────────┘              │
│                                   ↓                                        │
│                        ┌──────────────────────┐                           │
│                        │   FIELDER API        │                           │
│                        │   (Next.js/Supabase) │                           │
│                        │                      │                           │
│                        │  • /api/predict      │                           │
│                        │  • /api/scans        │                           │
│                        │  • /api/calibrate    │                           │
│                        └──────────────────────┘                           │
│                                   ↓                                        │
│                        ┌──────────────────────┐                           │
│                        │   PREDICTION ENGINE  │                           │
│                        │   (TypeScript)       │                           │
│                        │                      │                           │
│                        │  • GDD Calculator    │                           │
│                        │  • Brix Predictor    │                           │
│                        │  • Calibrator        │                           │
│                        └──────────────────────┘                           │
│                                   ↓                                        │
│                        ┌──────────────────────┐                           │
│                        │   SUPABASE DATABASE  │                           │
│                        │                      │                           │
│                        │  • predictions       │                           │
│                        │  • actuals           │                           │
│                        │  • calibrations      │                           │
│                        └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Phase 1: Prediction Generation

```
USER REQUEST
     ↓
┌─────────────────────────────────────────┐
│  1. User scans PLU code (e.g., 4012)   │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  2. Decode PLU → Cultivar + Organic     │
│     PLU 4012 = Washington Navel         │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  3. Infer Region from Store Location    │
│     Publix Tampa → Florida Indian River │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  4. Check for Existing Prediction       │
│     Query: region + cultivar + year     │
└─────────────────────────────────────────┘
     ↓
     ├── Found? → Return cached prediction
     │
     └── Not found? ↓
┌─────────────────────────────────────────┐
│  5. Generate New Prediction             │
│     • Get cultivar base Brix (11.5)     │
│     • Calculate GDD timing              │
│     • Apply rootstock modifier          │
│     • Check for calibration             │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  6. Apply Regional Calibration (if any) │
│     IF calibration exists:              │
│     adjusted = predicted + calibration  │
│     confidence += boost                 │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  7. Store Prediction in Database        │
│     predictions table                   │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  8. Return to User                      │
│     "Estimated Brix: 12.1"              │
│     "Calibrated based on 8 measurements"│
└─────────────────────────────────────────┘
```

### Phase 2: Actual Measurement Collection

```
USER ACTION
     ↓
┌─────────────────────────────────────────┐
│  1. User measures Brix with refractometer│
│     Reading: 11.8                       │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  2. User enters reading in app          │
│     • Brix value: 11.8                  │
│     • Photo of refractometer            │
│     • Store location                    │
│     • Purchase date                     │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  3. Submit to API (/api/scans)          │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  4. Server: Match to Prediction         │
│     Query: region + cultivar + date     │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  5. Calculate Error                     │
│     predicted_brix = 12.1               │
│     actual_brix = 11.8                  │
│     error = 12.1 - 11.8 = +0.3          │
│     (prediction was 0.3 too high)       │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  6. Check for Outliers                  │
│     IF |error| > 3σ from historical:    │
│       - Flag for review                 │
│       - Require photo proof             │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  7. Store in Actuals Table              │
│     Link to prediction_id               │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  8. Return Feedback to User             │
│     "0.3 Brix lower than predicted"     │
│     "Thanks for helping improve!"       │
│     "Your total scans: 12"              │
└─────────────────────────────────────────┘
```

### Phase 3: Calibration Update (MVP = Manual)

```
ADMIN ACTION
     ↓
┌─────────────────────────────────────────┐
│  1. Admin views calibration dashboard   │
│     Shows all region×cultivar combos    │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  2. Select region×cultivar to calibrate │
│     Example: Indian River × Wash Navel  │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  3. View Recent Actuals                 │
│     • 8 measurements                    │
│     • Errors: +0.3, +0.2, +0.4, +0.1... │
│     • Average error: +0.25              │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  4. Calculate Suggested Adjustment      │
│     avg_error = +0.25                   │
│     → Predictions running 0.25 too high │
│     → Suggested adjustment: -0.25       │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  5. Admin approves adjustment           │
│     Enter: -0.25                        │
│     Notes: "Based on 8 consumer scans"  │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  6. Update Calibration Table            │
│     region_id: indian_river_fl          │
│     cultivar_id: washington_navel       │
│     avg_brix_error: -0.25               │
│     sample_size: 8                      │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  7. Future Predictions Adjusted         │
│     Base prediction: 12.0               │
│     + Calibration: -0.25                │
│     = New prediction: 11.75             │
│     Confidence: 0.75 (boosted)          │
└─────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌──────────────────────────────────────┐
│           PREDICTIONS                │
│                                      │
│  • id (PK)                           │
│  • cultivar_id                       │◄────┐
│  • region_id                         │     │
│  • year                              │     │
│  • predicted_brix                    │     │
│  • predicted_harvest_start           │     │
│  • predicted_harvest_end             │     │
│  • confidence                        │     │
│  • created_at                        │     │
└──────────────────────────────────────┘     │
           ▲                                 │
           │ prediction_id (FK)              │
           │                                 │
┌──────────────────────────────────────┐     │
│             ACTUALS                  │     │
│                                      │     │
│  • id (PK)                           │     │
│  • prediction_id (FK) ───────────────┘     │
│  • cultivar_id                       │     │
│  • region_id                         │     │
│  • year                              │     │
│  • actual_brix                       │     │
│  • purchase_date                     │     │
│  • source_type (consumer/farmer/lab) │     │
│  • user_id                           │     │
│  • photo_url                         │     │
│  • verified                          │     │
│  • is_outlier                        │     │
│  • created_at                        │     │
└──────────────────────────────────────┘     │
                                             │
                                             │
┌──────────────────────────────────────┐     │
│      REGIONAL_CALIBRATIONS           │     │
│                                      │     │
│  • id (PK)                           │     │
│  • region_id ────────────────────────┼─────┘
│  • cultivar_id ──────────────────────┘
│  • avg_brix_error                    │
│  • sample_size                       │
│  • avg_date_error_days               │
│  • last_updated                      │
│  • updated_by                        │
│                                      │
│  UNIQUE(region_id, cultivar_id)      │
└──────────────────────────────────────┘
```

**Key Relationships:**

1. **predictions → actuals**: Many-to-many
   - One prediction can have multiple actuals (multiple users scan same product)
   - One actual might match multiple predictions (ambiguous matching)

2. **actuals → calibrations**: Aggregation
   - Many actuals aggregate into one calibration per region×cultivar

3. **calibrations → predictions**: Applied during prediction generation
   - Calibration adjusts future predictions for same region×cultivar

---

## Calibration Evolution Over Time

```
TIMELINE: How accuracy improves with data collection

Month 0: Research-based predictions only
┌────────────────────────────────────────────┐
│ Prediction: 12.0 Brix                      │
│ Confidence: 0.6 (research-based)           │
│ Accuracy: ~50% within 0.5 Brix             │
└────────────────────────────────────────────┘

Month 1: First calibration (3 measurements)
┌────────────────────────────────────────────┐
│ Actuals: 11.7, 11.8, 11.6                 │
│ Avg Error: +0.3 (predictions too high)    │
│ Calibration: -0.3                          │
│                                            │
│ New Prediction: 11.7 Brix                 │
│ Confidence: 0.65 (small boost)            │
│ Accuracy: ~60% within 0.5 Brix            │
└────────────────────────────────────────────┘

Month 3: More data (10 measurements)
┌────────────────────────────────────────────┐
│ Actuals: 11.5-11.9 range                  │
│ Avg Error: +0.25                           │
│ Std Dev: 0.15                              │
│ Calibration: -0.25                         │
│                                            │
│ New Prediction: 11.75 ± 0.3 Brix         │
│ Confidence: 0.75 (moderate boost)         │
│ Accuracy: ~70% within 0.5 Brix            │
└────────────────────────────────────────────┘

Month 6: Strong calibration (30 measurements)
┌────────────────────────────────────────────┐
│ Actuals: 11.6-12.0 range                  │
│ Avg Error: +0.20                           │
│ Std Dev: 0.12                              │
│ Calibration: -0.20                         │
│                                            │
│ New Prediction: 11.80 ± 0.24 Brix        │
│ Confidence: 0.85 (high)                   │
│ Accuracy: ~80% within 0.5 Brix            │
└────────────────────────────────────────────┘

Year 2+: Multi-year patterns (100+ measurements)
┌────────────────────────────────────────────┐
│ Actuals: Multiple seasons                 │
│ Avg Error: +0.15                           │
│ Std Dev: 0.10                              │
│ Weather patterns: Drought years -0.5      │
│                                            │
│ New Prediction: 11.85 ± 0.20 Brix        │
│ Confidence: 0.90 (very high)              │
│ Accuracy: ~85% within 0.5 Brix            │
│                                            │
│ + Weather adjustments                      │
│ + Rootstock segmentation                   │
│ + Age-specific calibrations                │
└────────────────────────────────────────────┘
```

---

## Error Propagation & Handling

```
CONSUMER SCAN SUBMISSION
         ↓
    ┌────────┐
    │ Valid? │
    └────────┘
         ↓
    ┌─────────────────────────────────┐
    │ YES → Process normally          │
    │  • Store in actuals             │
    │  • Calculate error              │
    │  • Update aggregates            │
    └─────────────────────────────────┘

         ↓
    ┌─────────────────────────────────┐
    │ NO → Handle error gracefully    │
    └─────────────────────────────────┘
         │
         ├─ PLU not recognized
         │  → Show "Unknown product" message
         │  → Suggest manual entry
         │
         ├─ Brix reading implausible (e.g., 50)
         │  → Flag as potential error
         │  → Ask user to verify
         │  → Require photo
         │
         ├─ Outlier detected (>3σ)
         │  → Accept but flag for review
         │  → Don't use for calibration yet
         │  → Admin reviews later
         │
         ├─ Location unavailable
         │  → Allow manual region selection
         │  → Lower confidence
         │
         └─ Photo upload failed
            → Accept without photo
            → Mark as "unverified"
```

---

## User Experience Flow Chart

```
                    START
                      ↓
            ┌─────────────────┐
            │ Download App    │
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ See Tutorial    │
            │ • What is Brix  │
            │ • Why measure   │
            │ • How to use    │
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ Scan First PLU  │
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ View Prediction │
            │ "Est: 12.1 Brix"│
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ Measure Actual  │
            │ "Reads: 11.8"   │
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ Submit Reading  │
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ See Comparison  │
            │ "0.3 lower"     │
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ Earn Badge      │
            │ "First Scan!"   │
            └─────────────────┘
                      ↓
            ┌─────────────────┐
            │ See Impact      │
            │ "Helped improve │
            │  predictions"   │
            └─────────────────┘
                      ↓
         ┌────────────────────────┐
         │ Continue?              │
         └────────────────────────┘
              ↓              ↓
          ┌────┐        ┌────────┐
          │ Yes│        │ No     │
          └────┘        └────────┘
             ↓               ↓
    ┌─────────────┐    ┌──────────┐
    │ Scan Again  │    │ End      │
    │ (repeat)    │    └──────────┘
    └─────────────┘
```

---

## Network Effects Visualization

```
                   FIELDER FLYWHEEL

                 More Consumer Scans
                         ↓
                   More Brix Data
                         ↓
                Better Regional Calibrations
                         ↓
               More Accurate Predictions
                         ↓
              Higher User Trust & Satisfaction
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
  More Premium Subscribers        More Marketplace Buyers
         ↓                               ↓
  More Subscription Revenue       More Commission Revenue
         ↓                               ↓
         └───────────────┬───────────────┘
                         ↓
              More Farmer Participation
               (revenue opportunity)
                         ↓
            More Farmer Harvest Reports
                         ↓
          Even More Accurate Predictions
                         ↓
                   (Loop back to top)


         THE MOAT DEEPENS WITH EVERY DATA POINT
```

---

## API Request/Response Examples

### 1. Get Prediction

**Request:**
```http
GET /api/predict?plu=4012&lat=27.9506&lon=-82.4572
```

**Response:**
```json
{
  "cultivar": {
    "id": "washington_navel",
    "name": "Washington Navel Orange",
    "quality_tier": "premium"
  },
  "region": {
    "id": "indian_river_fl",
    "name": "Indian River, Florida"
  },
  "prediction": {
    "brix": 11.75,
    "harvest_window": {
      "start": "2025-11-15",
      "end": "2026-02-15",
      "peak_start": "2025-12-15",
      "peak_end": "2026-01-15"
    },
    "confidence": 0.75,
    "calibrated": true,
    "calibration_sample_size": 8
  },
  "status": "at_peak",
  "message": "In peak harvest window - expect excellent flavor!"
}
```

### 2. Submit Scan

**Request:**
```http
POST /api/scans
Content-Type: application/json

{
  "plu_code": "4012",
  "actual_brix": 11.8,
  "purchase_date": "2025-12-18",
  "store_chain": "Publix",
  "store_location": {
    "lat": 27.9506,
    "lon": -82.4572
  },
  "photo_url": "https://...",
  "device_id": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "actual_id": "uuid-1234",
  "prediction_match": {
    "predicted_brix": 11.75,
    "actual_brix": 11.8,
    "error": -0.05,
    "message": "Great match! Your measurement confirms our prediction."
  },
  "user_stats": {
    "total_scans": 12,
    "rank": "Regional Contributor",
    "badges": ["First Scan", "10 Scans", "Quality Detective"]
  }
}
```

### 3. Admin: View Calibration

**Request:**
```http
GET /api/admin/calibrations/indian_river_fl/washington_navel
```

**Response:**
```json
{
  "region_id": "indian_river_fl",
  "cultivar_id": "washington_navel",
  "calibration": {
    "avg_brix_error": -0.25,
    "sample_size": 8,
    "avg_date_error_days": 0,
    "last_updated": "2025-12-15T10:30:00Z"
  },
  "recent_actuals": [
    {
      "date": "2025-12-18",
      "predicted": 12.0,
      "actual": 11.8,
      "error": -0.2,
      "source": "consumer_scan"
    },
    {
      "date": "2025-12-15",
      "predicted": 12.0,
      "actual": 11.7,
      "error": -0.3,
      "source": "consumer_scan"
    }
    // ... more
  ],
  "suggested_adjustment": -0.25,
  "confidence": "medium"
}
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCTION                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  React Native    │         │  Next.js Admin   │
│  Flavor App      │         │  Dashboard       │
│                  │         │                  │
│  • iOS/Android   │         │  • Vercel        │
│  • App Store     │         │  • Calibration   │
│  • Play Store    │         │    Management    │
└──────────────────┘         └──────────────────┘
        │                             │
        └─────────────┬───────────────┘
                      ↓
            ┌──────────────────┐
            │   VERCEL CDN     │
            │   (Next.js API)  │
            └──────────────────┘
                      ↓
            ┌──────────────────┐
            │   SUPABASE       │
            │   (PostgreSQL)   │
            │                  │
            │  • Database      │
            │  • Auth          │
            │  • Storage       │
            │  • Functions     │
            └──────────────────┘
```

**Hosting:**
- **Flavor App**: iOS App Store + Google Play Store
- **Admin Dashboard**: Vercel (vercel.com)
- **API**: Next.js API routes on Vercel
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage (for refractometer photos)

**Why this stack:**
- Fast deployment
- Serverless scaling
- Low operational overhead
- Pay-as-you-grow pricing
- Built-in auth, storage, database

---

## Monitoring & Analytics

```
METRICS TO TRACK

User Engagement:
├─ Daily Active Users (DAU)
├─ Scans per user
├─ Retention (day 1, day 7, day 30)
├─ Time to first scan
└─ Refractometer purchase rate

Data Quality:
├─ Outlier rate
├─ Photo attachment rate
├─ Geographic coverage
├─ Cultivar coverage
└─ Verification rate

Prediction Accuracy:
├─ Mean Absolute Error (MAE)
├─ Mean Absolute Percentage Error (MAPE)
├─ Within 0.5 Brix rate
├─ Within 1.0 Brix rate
└─ Improvement over baseline

Calibrations:
├─ Total calibrated combinations
├─ Average sample size
├─ Calibration update frequency
├─ Confidence distribution
└─ Accuracy gain per calibration

Business:
├─ Free → Premium conversion
├─ Premium → Marketplace conversion
├─ Average order value
├─ Customer lifetime value (LTV)
└─ Data moat depth (total pairs)
```

---

**Document Status**: Architecture Diagram Complete
**Purpose**: Visual reference for system design and data flow
**Owner**: Fielder Engineering Team
**Last Updated**: December 18, 2025
