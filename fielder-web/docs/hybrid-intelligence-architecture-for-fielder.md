# Hybrid Intelligence Architecture for Fielder
## Adapted from SNDBX Platform Intelligence Layer

**Based on:** `/home/alex/projects/balexbrownii/sndbx_platform/docs/STRATEGIC_BLUEPRINT_RICK_STARR.md`
**Adapted for:** Fielder farm-to-table quality prediction platform
**Date:** December 18, 2025

---

## Executive Summary

SNDBX built a **Hybrid Intelligence Architecture** that routes decisions between deterministic logic (rules that MUST be enforced) and probabilistic AI (decisions that should be OPTIMIZED), with human oversight for exceptions. This pattern is directly applicable to Fielder's agricultural quality prediction system.

**The Core Insight from SNDBX:**

> "The platform currently lacks a true logic layer. We have excellent data structures and user interfaces, but the 'intelligence' that should drive automated decisions doesn't exist yet."

**This is EXACTLY where Fielder is today:**
- Rich data layer: 37 ShareProfiles, 11 cultivars, regional distributions, phenology data
- Prediction algorithms: GDD models, Brix formulas, rootstock modifiers
- Frontend framework: Next.js, product pages, tools
- **Missing:** The intelligence layer that orchestrates predictions, handles uncertainty, learns from feedback

---

## 1. The Intelligence Layer Pattern

### SNDBX Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SNDBX INTELLIGENCE LAYER                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    ORCHESTRATOR                               │   │
│  │    Routes decisions to appropriate engine based on type       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                    │                    │                │
│           ▼                    ▼                    ▼                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │ DETERMINISTIC  │  │ PROBABILISTIC  │  │ EXCEPTION          │    │
│  │ LAYER          │  │ LAYER          │  │ HANDLER            │    │
│  │                │  │                │  │                    │    │
│  │ • Status Engine│  │ • AI Decision  │  │ • Human-in-loop    │    │
│  │ • Rules Engine │  │   Service      │  │ • Override queue   │    │
│  │ • Workflows    │  │ • Optimization │  │ • Audit trail      │    │
│  │                │  │ • Prediction   │  │                    │    │
│  └────────────────┘  └────────────────┘  └────────────────────┘    │
│           │                    │                    │                │
│           └────────────────────┴────────────────────┘                │
│                                │                                     │
│                    ┌───────────▼───────────┐                        │
│                    │    FEEDBACK LOOP      │                        │
│                    │ Record decisions +    │                        │
│                    │ outcomes for learning │                        │
│                    └───────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### How the Orchestrator Routes Decisions

**From SNDBX Blueprint:**

| Decision Type | Goes To | Why |
|--------------|---------|-----|
| **Rules that MUST be enforced** | Deterministic Layer | No ambiguity, immediate execution |
| **Decisions that should be OPTIMIZED** | Probabilistic Layer | AI improves quality over time |
| **Low confidence or edge cases** | Exception Handler | Human judgment required |

**Key Examples from SNDBX:**

| SNDBX Scenario | Layer | Rationale |
|----------------|-------|-----------|
| "When should a player be promoted to competitive tier?" | Probabilistic | Optimization problem, ML improves over time |
| "How do we assign coaches to sessions?" | Probabilistic | Multiple valid solutions, optimize for quality |
| "What's the best schedule to maximize screen utilization?" | Probabilistic | Constraint optimization |
| "Is this enrollment valid per league rules?" | Deterministic | Binary check, must enforce |

---

## 2. Fielder's Intelligence Layer (Adapted)

### Fielder-Specific Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FIELDER INTELLIGENCE LAYER                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    ORCHESTRATOR                               │   │
│  │    Routes quality predictions to appropriate engine           │   │
│  │    Decides: Rules-based / AI / Human verification             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                    │                    │                │
│           ▼                    ▼                    ▼                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │ DETERMINISTIC  │  │ PROBABILISTIC  │  │ EXCEPTION          │    │
│  │ LAYER          │  │ LAYER          │  │ HANDLER            │    │
│  │                │  │                │  │                    │    │
│  │ • SHARE Rules  │  │ • Brix ML      │  │ • Conflicting data │    │
│  │ • Claim Logic  │  │ • Omega Est.   │  │ • Lab verification │    │
│  │ • Workflows    │  │ • CV Predict   │  │ • Expert review    │    │
│  │ • Validation   │  │ • Optimization │  │ • Audit trail      │    │
│  └────────────────┘  └────────────────┘  └────────────────────┘    │
│           │                    │                    │                │
│           └────────────────────┴────────────────────┘                │
│                                │                                     │
│                    ┌───────────▼───────────┐                        │
│                    │    FEEDBACK LOOP      │                        │
│                    │ Prediction→Measurement│                        │
│                    │ pairs train models    │                        │
│                    └───────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Fielder Decision Routing

| Fielder Scenario | Layer | Rationale |
|------------------|-------|-----------|
| "PLU prefix 9 → Organic → Non-GMO" | **Deterministic** | Fixed inference chain, no ambiguity |
| "Organic beef → Check feeding regime warning" | **Deterministic** | Rule-based red flag |
| "Carrizo rootstock → +0.6 Brix" | **Deterministic** | Research-backed constant |
| "Predict Brix from cultivar + region + timing" | **Probabilistic** | ML can improve GDD models over time |
| "Estimate omega ratio from claims" | **Probabilistic** | Ranges, confidence levels |
| "Computer vision Brix prediction from photo" | **Probabilistic** | ML-based, improves with training data |
| "Conflicting claims: 'grass-fed' + high omega-6 lab test" | **Exception** | Requires human interpretation |
| "Unknown cultivar from rare farm" | **Exception** | Insufficient data for automated prediction |

---

## 3. Deterministic Layer (Rules That MUST Be Enforced)

### SNDBX Examples

| Component | What It Does | Business Value |
|-----------|--------------|----------------|
| **Status Engine** | Manages entity lifecycles (enrollment: pending → active → completed) | Prevents invalid states, creates audit trail |
| **Rules Engine** | Configurable business logic (pricing, eligibility, validation) | Automates decisions currently made manually |
| **Workflow Engine** | Event-triggered sequences (enrollment → payment → confirmation) | Ensures consistent process execution |

### Fielder Deterministic Layer

#### Component 1: SHARE Rules Engine

**What belongs here:** Fixed relationships, research-backed constants, regulatory definitions

```typescript
// DETERMINISTIC RULES - No ambiguity, always enforced

interface SHARERulesEngine {
  // Heritage (H) - Genetic ceilings
  getCultivarBaseBrix(cultivarId: string): number
  getRootstockModifier(rootstockId: string): number
  getAgeModifier(treeAgeYears: number): number

  // Agricultural (A) - Red flag detection
  checkOrganicBeefWarning(claims: string[]): boolean  // Organic + meat = check grain feeding
  detectGrainFinishingRisk(claims: string[]): boolean  // Missing "grass-finished" = likely CAFO

  // Ripen (R) - Phenology constraints
  isInHarvestWindow(cultivarId: string, regionId: string, date: Date): boolean
  calculateDaysFromPeak(cultivarId: string, regionId: string, date: Date): number

  // Enrich (E) - Validation thresholds
  validateOmegaRatioConsistency(claims: string[], measuredRatio: number): boolean
  // If claims "grass-fed" but ratio >6:1 → flag inconsistency
}
```

**Implementation Example:**

```typescript
class SHARERulesEngine {
  // DETERMINISTIC: Rootstock always applies the same modifier
  getRootstockModifier(rootstockId: string): number {
    const modifiers: Record<string, number> = {
      'carrizo': 0.6,
      'c35': 0.6,
      'sour_orange': 0.5,
      'trifoliate': 0.5,
      'cleopatra': 0.2,
      'swingle': -0.5,
      'rough_lemon': -0.7,
      'macrophylla': -0.8,
    }
    return modifiers[rootstockId] ?? 0
  }

  // DETERMINISTIC: Organic + beef = grain warning
  checkOrganicBeefWarning(claims: string[]): boolean {
    const isOrganic = claims.some(c => c.includes('organic'))
    const isBeef = claims.some(c => c.includes('beef'))
    const hasGrassFinished = claims.some(c =>
      c.includes('grass-finished') || c.includes('100% grass-fed')
    )

    // Rule: Organic beef WITHOUT grass-finished claim = likely grain-fed
    return isOrganic && isBeef && !hasGrassFinished
  }

  // DETERMINISTIC: Omega ratio must match feeding regime claims
  validateOmegaRatioConsistency(
    claims: string[],
    measuredRatio: number
  ): { consistent: boolean; warning?: string } {
    const claimsGrassFed = claims.some(c =>
      c.includes('grass-fed') || c.includes('grass-finished')
    )

    if (claimsGrassFed && measuredRatio > 6) {
      return {
        consistent: false,
        warning: `Claimed grass-fed but measured omega ratio ${measuredRatio}:1
                  exceeds expected 2-6:1 range. Verify feeding regime.`
      }
    }

    return { consistent: true }
  }
}
```

#### Component 2: Claim Inference Engine

**What belongs here:** Fixed inference chains, boolean logic, regulatory claim meanings

```typescript
interface ClaimInferenceEngine {
  // PLU code inferences
  inferFromPLU(pluCode: string): {
    isOrganic: boolean
    isGMO: boolean  // Can be false if PLU 9, true if PLU 4, unknown if PLU 3
  }

  // Packinghouse → Region → Soil
  inferRegionFromPackinghouse(packinghouseCode: string): string | null
  inferSoilFromRegion(regionId: string): SoilProfile

  // Claim chain logic
  inferBeefProfile(claims: string[]): SHAREProfile
  // Returns deterministic profile assignment based on presence/absence of claims
}
```

**Implementation Example:**

```typescript
class ClaimInferenceEngine {
  // DETERMINISTIC: PLU prefix 9 = Organic, prefix 4 = Conventional
  inferFromPLU(pluCode: string): { isOrganic: boolean; isGMO: boolean } {
    if (pluCode.startsWith('9')) {
      return { isOrganic: true, isGMO: false }
    }
    if (pluCode.startsWith('4')) {
      return { isOrganic: false, isGMO: true }  // Assume conventional = GMO possible
    }
    return { isOrganic: false, isGMO: false }  // Unknown
  }

  // DETERMINISTIC: Beef profile from claims (no ambiguity)
  inferBeefProfile(claims: string[]): BeefProfile {
    // Check for CAFO exclusion claims
    const noCAFO = claims.some(c =>
      c.includes("100% grass") ||
      c.includes("grass-finished") ||
      c.includes("no feedlot") ||
      c.includes("no cafo")
    )

    if (noCAFO) {
      if (claims.includes("100% grass-fed") || claims.includes("grass-finished")) {
        return {
          profile: 'A_TRUE_GRASS',
          omegaRange: [2, 3],
          tier: 'premium',
          confidence: 'high'
        }
      }
      return {
        profile: 'B_TRUE_PASTURE',
        omegaRange: [4, 6],
        tier: 'premium',
        confidence: 'high'
      }
    }

    // CAFO assumed from here down
    if (claims.includes("grass-fed")) {
      return {
        profile: 'C_MARKETING_GRASS',
        omegaRange: [8, 15],
        tier: 'standard',
        confidence: 'medium'
      }
    }

    // ... (rest of logic from CLAUDE.md)

    return {
      profile: 'E_COMMODITY',
      omegaRange: [15, 20],
      tier: 'commodity',
      confidence: 'high'
    }
  }
}
```

#### Component 3: Validation Engine

**What belongs here:** Data quality checks, constraint enforcement, anomaly detection

```typescript
interface ValidationEngine {
  // Data quality
  validateMeasurement(measurement: Measurement): ValidationResult
  checkDataCompleteness(prediction: Prediction): number  // 0-1 confidence penalty

  // Constraint enforcement
  enforcePhysicalConstraints(brixPrediction: number): number  // Clamp to 0-30
  enforceOmegaConstraints(omegaRatio: number): number  // Clamp to 1-30

  // Anomaly detection (deterministic thresholds)
  isAnomalousMeasurement(predicted: number, measured: number): boolean
  // If |predicted - measured| > 3 standard deviations → flag for review
}
```

#### Component 4: Workflow Engine

**What belongs here:** Event-triggered sequences, state transitions

```typescript
interface WorkflowEngine {
  // Flavor App scan workflow
  onScanComplete(scan: FlavorAppScan): void
  // 1. Run deterministic inference (PLU, claims)
  // 2. Route to probabilistic prediction or exception queue
  // 3. If refractometer reading entered → record feedback

  // Brand research workflow
  onBrandAnalyzed(brand: BrandAnalysis): void
  // 1. Run claim inference engine
  // 2. Assign SHARE profile
  // 3. Flag for lab testing if inconsistencies detected

  // Lab test result workflow
  onLabResultReceived(labResult: LabResult): void
  // 1. Validate against predicted profile
  // 2. Update confidence scores
  // 3. Retrain ML models
  // 4. Publish to brand database
}
```

---

## 4. Probabilistic Layer (AI Decision Service)

### SNDBX Examples

| Use Case | Input | Output | Learning |
|----------|-------|--------|----------|
| Coach-session matching | Coach skills, availability, session requirements | Ranked list of coaches | Feedback: Was session successful? |
| Schedule optimization | Screen capacity, session types, time constraints | Optimized schedule | Feedback: Actual utilization rate |
| Player churn prediction | Engagement metrics, attendance, progress | Churn risk score | Feedback: Did player actually churn? |

### Fielder Probabilistic Layer

#### Component 1: Brix ML Service

**What it does:** Improves GDD-based predictions using ML

**Current state:** Deterministic formula (cultivar base + rootstock + age + timing)

**AI enhancement:**
```typescript
interface BrixMLService {
  // ML-enhanced prediction
  predictBrix(input: {
    cultivarId: string
    regionId: string
    rootstockId: string
    treeAge: number
    harvestDate: Date
    soilProfile: SoilProfile
    weatherHistory: WeatherData[]
    farmPractices: AgriculturalPractices
  }): {
    predicted: number
    confidence: number
    contributingFactors: { factor: string; weight: number }[]
  }

  // Learn from feedback
  recordFeedback(prediction: number, actual: number, metadata: any): void
}
```

**Why ML improves this:**
- Weather anomalies affect GDD accumulation (ML learns patterns)
- Soil micronutrient interactions (too complex for formula)
- Farm practice combinations (S↔A compensatory effects)
- Regional climate shifts over time

**Training data:** Prediction→measurement pairs from Flavor App refractometer readings

#### Component 2: Omega Ratio Estimator

**What it does:** Estimates omega ratio from incomplete data (claims only, no lab test)

**Current state:** Fixed ranges per SHARE profile (e.g., "grass-fed" = 2-3:1)

**AI enhancement:**
```typescript
interface OmegaRatioEstimator {
  // Probabilistic estimation
  estimateOmegaRatio(input: {
    claims: string[]
    breed: string
    ageAtHarvest?: number
    feedingRegimeDetails?: string
    farmReputation?: number  // Historical lab test accuracy
  }): {
    estimatedRatio: number
    confidenceInterval: [number, number]
    confidence: number
    reasoning: string[]
  }

  // Learn from lab tests
  recordLabResult(estimation: OmegaEstimation, labResult: number): void
}
```

**Why ML improves this:**
- Some brands consistently test better/worse than claims suggest
- Breed-specific fatty acid profiles
- Nuanced claim language patterns ("pasture-raised" + "grain supplement" = ?)
- Farm practices that correlate with better outcomes

**Training data:** Brand claims + Edacious lab test results

#### Component 3: Computer Vision Brix Predictor

**What it does:** Estimates Brix from photo appearance

**Current state:** Not built yet

**AI design:**
```typescript
interface CVBrixPredictor {
  // Predict from photo
  predictFromPhoto(input: {
    photo: ImageData
    productType: string  // 'orange', 'peach', 'strawberry'
    metadata?: {
      lightingConditions?: string
      skinCondition?: string
    }
  }): {
    estimatedBrix: number
    confidence: number
    visualFeatures: { feature: string; contribution: number }[]
  }

  // Learn from refractometer readings
  recordGroundTruth(photo: ImageData, measuredBrix: number): void
}
```

**Why ML works for this:**
- Color saturation correlates with sugar content
- Skin texture indicates maturity
- Size/density relationships vary by cultivar
- Lighting/angle variations need learned normalization

**Training data:** Flavor App photo + refractometer reading pairs

#### Component 4: Harvest Window Optimizer

**What it does:** Recommends optimal purchase timing

**Current state:** Deterministic phenology calendar (peak window = fixed dates)

**AI enhancement:**
```typescript
interface HarvestWindowOptimizer {
  // Dynamic window prediction
  optimizeHarvestWindow(input: {
    cultivarId: string
    regionId: string
    currentDate: Date
    weatherForecast: WeatherData[]
    historicalQuality: MeasurementHistory[]
  }): {
    optimalStart: Date
    optimalEnd: Date
    peakDate: Date
    qualityForecast: { date: Date; predictedBrix: number }[]
    confidence: number
  }
}
```

**Why ML improves this:**
- Early/late seasons shift windows by weeks
- Weather patterns affect ripening rate
- Regional climate trends over years
- Real-time quality measurements refine predictions

**Training data:** Phenology calendar + actual measurements + weather history

---

## 5. Exception Handler (Human-in-Loop)

### SNDBX Approach

**From SNDBX Blueprint:**

> "Exception Workbench: Human review queue for low-confidence decisions. Maintains oversight, builds trust."

**Key insight:** AI shouldn't make high-stakes decisions with low confidence. Route to humans.

### Fielder Exception Handler

#### What Gets Routed to Human Review

```typescript
interface ExceptionHandler {
  // Decision triggers
  shouldEscalate(decision: Decision): boolean

  // Queue for review
  addToReviewQueue(item: ReviewItem): void

  // Human decision
  recordHumanOverride(itemId: string, decision: HumanDecision): void
}

// Escalation triggers
const ESCALATION_RULES = {
  // Low confidence prediction
  lowConfidence: (confidence: number) => confidence < 0.5,

  // Conflicting data
  conflictingClaims: (prediction: Prediction) =>
    prediction.claimConsistency === false,

  // Anomalous measurement
  anomalousMeasurement: (predicted: number, measured: number) =>
    Math.abs(predicted - measured) > 3 * stdDev,

  // Unknown cultivar
  unknownCultivar: (cultivarId: string) =>
    !CULTIVAR_DATABASE.has(cultivarId),

  // First-time farm
  newFarmNoHistory: (farmId: string) =>
    FARM_HISTORY[farmId]?.measurementCount === 0,
}
```

#### Exception Workbench UI

**What the human reviewer sees:**

```
┌─────────────────────────────────────────────────────────────────┐
│  FIELDER EXCEPTION REVIEW QUEUE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ITEM #3421 - CONFLICTING OMEGA RATIO                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│  Brand: "Snake River Farms"                                    │
│  Product: "American Wagyu Ribeye"                              │
│                                                                 │
│  CLAIMS FOUND:                                                 │
│    • "American Wagyu"                                          │
│    • "USDA Prime"                                              │
│    • No feeding regime claims (silence)                        │
│                                                                 │
│  AI PREDICTION:                                                │
│    Profile: F - Premium CAFO                                   │
│    Estimated Omega: 20-26:1                                    │
│    Confidence: 0.75                                            │
│                                                                 │
│  LAB TEST RESULT:                                              │
│    Measured Omega: 22.3:1                                      │
│    Lab: Edacious                                               │
│    Date: 2025-12-15                                            │
│                                                                 │
│  ISSUE:                                                        │
│    Lab test CONFIRMS AI prediction (within range).             │
│    BUT: Brand reputation is "premium" - should we publish?     │
│                                                                 │
│  HUMAN DECISION:                                               │
│    [ ] Accept AI prediction, publish result                    │
│    [ ] Override - need more data                               │
│    [ ] Flag for legal review (defamation risk)                │
│                                                                 │
│  NOTES:                                                        │
│  [                                                            ] │
│                                                                 │
│  [Submit Decision]                                             │
└─────────────────────────────────────────────────────────────────┘
```

#### When to Escalate vs. Auto-Decide

| Scenario | Confidence | Action |
|----------|-----------|--------|
| Known cultivar, in-season, standard practices | 0.85+ | **Auto-publish** |
| Known cultivar, out-of-season, limited data | 0.60-0.85 | **Show with disclaimer** |
| New cultivar, inference from similar | 0.40-0.60 | **Escalate to review** |
| Conflicting claims + lab test | Any | **Escalate to review** |
| Legal risk (brand reputation harm) | Any | **Escalate + legal review** |

---

## 6. Feedback Loop (The Data Moat)

### SNDBX Approach

**From SNDBX Blueprint:**

> "Feedback Loop: Records decisions and outcomes for learning. Creates proprietary training data over time."

### Fielder Feedback Loop

#### What Gets Recorded

```typescript
interface FeedbackRecord {
  // Decision metadata
  decisionId: string
  decisionType: 'brix_prediction' | 'omega_estimation' | 'cv_prediction' | 'claim_inference'
  timestamp: Date

  // Input data
  inputData: {
    cultivarId?: string
    regionId?: string
    claims?: string[]
    photo?: string  // S3 URL
    // ... all inputs used
  }

  // Prediction
  prediction: {
    value: number
    confidence: number
    method: 'deterministic' | 'ml' | 'hybrid'
    modelVersion?: string
  }

  // Actual outcome (when available)
  actual?: {
    value: number
    measurementType: 'refractometer' | 'lab_test' | 'consumer_rating'
    verificationSource: string
    timestamp: Date
  }

  // Model performance
  error?: number  // |predicted - actual|
  feedbackRecorded: boolean
}
```

#### Feedback Collection Points

| Source | What It Provides | Frequency |
|--------|------------------|-----------|
| **Flavor App refractometer readings** | Brix ground truth | Daily (1000s) |
| **Edacious lab tests** | Omega ratio, nutrient panels | Weekly (10s) |
| **Brand research database** | Claim analysis outcomes | Ongoing |
| **CV predictions** | Photo→Brix pairs | Daily (1000s) |
| **User corrections** | "This doesn't look right" flags | As needed |

#### Model Retraining Triggers

```typescript
interface ModelRetrainingService {
  // Continuous learning
  shouldRetrain(modelId: string): boolean

  // Retraining triggers
  checkRetrainingCriteria(): {
    newDataThreshold: boolean      // >1000 new feedback records
    performanceDegradation: boolean // RMSE increased by >10%
    scheduledRetrain: boolean       // Monthly cadence
  }

  // Execute retraining
  retrainModel(modelId: string, newData: FeedbackRecord[]): void
}
```

---

## 7. Implementation Roadmap for Fielder

### Phase 1: Deterministic Foundation (Weeks 1-4)

**Build the rules layer that doesn't require ML:**

| Week | Component | Deliverables |
|------|-----------|--------------|
| 1 | SHARE Rules Engine | Rootstock modifiers, age curves, claim inference |
| 2 | Claim Inference Engine | PLU logic, beef profile assignment, red flag detection |
| 3 | Validation Engine | Data quality checks, constraint enforcement |
| 4 | Workflow Engine | Flavor App scan flow, brand research flow |

**Success criteria:** All deterministic predictions work correctly, no ML required

### Phase 2: Probabilistic Layer MVP (Weeks 5-8)

**Add AI where it improves outcomes:**

| Week | Component | Deliverables |
|------|-----------|--------------|
| 5 | Brix ML Service | Enhanced GDD prediction with weather/soil factors |
| 6 | Omega Ratio Estimator | Probabilistic ranges from claims |
| 7 | Feedback Loop Infrastructure | Database schema, recording service |
| 8 | Exception Handler | Review queue, escalation rules |

**Success criteria:** ML predictions available, feedback recording works, humans can review exceptions

### Phase 3: Computer Vision (Weeks 9-12)

**Flavor App photo analysis:**

| Week | Component | Deliverables |
|------|-----------|--------------|
| 9 | CV model training pipeline | Image preprocessing, feature extraction |
| 10 | CV Brix Predictor | Photo→Brix estimation |
| 11 | CV feedback loop | Ground truth collection from refractometer |
| 12 | Production deployment | Flavor App integration |

**Success criteria:** Users can photograph produce and get Brix estimate

### Phase 4: Optimization & Learning (Weeks 13-16)

**Continuous improvement:**

| Week | Component | Deliverables |
|------|-----------|--------------|
| 13 | Harvest Window Optimizer | Dynamic timing recommendations |
| 14 | Model retraining automation | Scheduled retraining, A/B testing |
| 15 | Advanced analytics | Confidence calibration, uncertainty quantification |
| 16 | Dashboard & monitoring | Model performance tracking |

**Success criteria:** Models improve over time, confidence scores are well-calibrated

---

## 8. Key Differences: SNDBX vs. Fielder

### What Transfers Directly

| SNDBX Pattern | Fielder Application |
|---------------|---------------------|
| **Orchestrator routing** | Route quality predictions to rules/AI/human |
| **Deterministic for rules** | SHARE framework logic, claim inference |
| **Probabilistic for optimization** | Brix ML, omega estimation, CV prediction |
| **Exception handler** | Conflicting data, low confidence, legal risk |
| **Feedback loop** | Prediction→measurement pairs train models |

### What's Different

| Aspect | SNDBX | Fielder |
|--------|-------|---------|
| **Decision frequency** | Real-time operational (schedule coaches, assign sessions) | Batch prediction + on-demand (app scans, product pages) |
| **Uncertainty** | Low (known coaches, known sessions) | High (variable weather, farm practices, genetics) |
| **Feedback latency** | Immediate (session happened, was it good?) | Days to weeks (harvest→measurement→lab) |
| **Human expertise** | Regional managers, operations staff | Agricultural scientists, lab technicians |
| **Data volume** | 100s-1000s users per location | Millions of scans, 1000s of products |

### Agricultural-Specific Challenges

| Challenge | How Fielder Handles It |
|-----------|------------------------|
| **Seasonal variation** | Probabilistic layer learns year-over-year patterns |
| **Weather unpredictability** | Exception handler escalates anomalies, ML learns resilience |
| **Limited ground truth** | Deterministic layer provides baseline, ML improves incrementally |
| **Long feedback loops** | Some predictions (cultivar Brix) have fast feedback (refractometer), others (omega ratio) are slower (lab tests) |
| **Physical constraints** | Validation engine enforces biological limits (Brix 0-30, omega 1-30) |

---

## 9. Technical Architecture

### Database Schema

```sql
-- Deterministic predictions (cached)
CREATE TABLE deterministic_predictions (
  id UUID PRIMARY KEY,
  prediction_type VARCHAR(50) NOT NULL,
  input_hash VARCHAR(64) NOT NULL,  -- Hash of input params for caching
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_type, input_hash)
);

-- Probabilistic predictions
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY,
  model_id VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  input_data JSONB NOT NULL,
  prediction JSONB NOT NULL,
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback records
CREATE TABLE prediction_feedback (
  id UUID PRIMARY KEY,
  prediction_id UUID REFERENCES ml_predictions(id),
  actual_value DECIMAL(6,2) NOT NULL,
  measurement_type VARCHAR(50) NOT NULL,
  verification_source VARCHAR(100),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  error DECIMAL(6,2)  -- |predicted - actual|
);

-- Exception queue
CREATE TABLE exception_queue (
  id UUID PRIMARY KEY,
  item_type VARCHAR(50) NOT NULL,
  item_data JSONB NOT NULL,
  escalation_reason VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, reviewed, resolved
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Human decisions
CREATE TABLE human_decisions (
  id UUID PRIMARY KEY,
  exception_id UUID REFERENCES exception_queue(id),
  reviewer_id UUID REFERENCES users(id),
  decision JSONB NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Design

```typescript
// Orchestrator service
interface OrchestrationService {
  // Main entry point
  predictQuality(request: QualityRequest): Promise<QualityResult>

  // Routes to appropriate layer
  private routeToLayer(request: QualityRequest): 'deterministic' | 'probabilistic' | 'exception'
}

// Layer interfaces
interface DeterministicLayer {
  predict(request: QualityRequest): QualityResult
}

interface ProbabilisticLayer {
  predict(request: QualityRequest): Promise<QualityResult>
  recordFeedback(predictionId: string, actual: number): Promise<void>
}

interface ExceptionHandler {
  escalate(request: QualityRequest, reason: string): Promise<ReviewItem>
  resolveException(itemId: string, decision: HumanDecision): Promise<void>
}
```

---

## 10. Success Metrics

### SNDBX Metrics (for reference)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Decisions automated | 80% | Reduces manual operations |
| Exception escalation rate | <5% | Most decisions are confident |
| Human override rate | <2% | AI decisions are accurate |
| Decision latency | <100ms | Real-time operations |

### Fielder Intelligence Layer Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Prediction RMSE (Brix)** | <1.0° Brix | Useful for consumer decisions |
| **Prediction RMSE (Omega)** | <2.0 ratio units | Confidence in health claims |
| **Confidence calibration** | >0.90 | Confidence scores are honest |
| **Exception rate** | <10% | Most predictions are confident |
| **Feedback coverage** | >50% | Enough data to train ML |
| **Model improvement rate** | -5% RMSE/quarter | Continuous learning works |
| **Human override rate** | <5% | AI decisions are trustworthy |

---

## 11. Conclusion: Why This Matters

### The SNDBX Insight

> "The platform, not the theaters, is the real asset. Physical locations can be replicated. Tournament software is commodity. But an intelligent platform that captures player development data, optimizes operations through AI, and creates network effects across regions—that's defensible intellectual property."

### The Fielder Equivalent

**The prediction engine, not the product database, is the real asset.**

- Product listings can be replicated (anyone can list farms)
- Quality scores are commodity (Yuka does this)
- But an intelligent platform that:
  - Captures prediction→measurement pairs across geographies and seasons
  - Learns from millions of consumer scans
  - Optimizes predictions through AI feedback loops
  - Creates a data moat that CANNOT be synthesized by competitors

**That's defensible intellectual property. That's the S&P Global of food quality.**

### What We Build Next

1. **Deterministic foundation** - SHARE rules, claim inference, validation
2. **Probabilistic layer** - ML-enhanced predictions, confidence scoring
3. **Exception handling** - Human review for edge cases, legal risks
4. **Feedback loop** - Every scan, every measurement, every lab test trains the models
5. **Continuous improvement** - Models get better every week

**This is how Fielder becomes the intelligence layer for farm-to-table quality.**

---

*Document prepared by Alex Brown, Strategic Advisor*
*Based on SNDBX Platform Intelligence Layer architecture*
*Adapted for Fielder agricultural quality prediction use case*
*December 18, 2025*
