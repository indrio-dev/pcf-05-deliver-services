# ADR-001: ML Architecture for Fielder Intelligence Layer

**Status:** Accepted
**Date:** December 18, 2025
**Decision Makers:** Claude Code (architect), Alex Brown (owner)

---

## Context

Fielder's Hybrid Intelligence Architecture includes a **Probabilistic Layer** that enhances deterministic GDD/Brix calculations with machine learning. We need to decide:

1. Where ML inference and training run (hosting)
2. How models are trained (pipeline)
3. Where model artifacts are stored
4. How we compare formula vs ML predictions (A/B testing)

### Current State

- **Deterministic predictions**: GDD formulas, rootstock modifiers, age curves (all TypeScript)
- **Training data**: Not yet collected (F017-F021 will enable feedback loop)
- **ML complexity**: Low initially (regional calibration), growing to CV Brix prediction

### Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Sub-200ms inference latency | HIGH | Consumer app responsiveness |
| Support TypeScript/JavaScript inference | HIGH | Existing Next.js codebase |
| Python training capability | MEDIUM | Standard ML tooling |
| Model versioning | MEDIUM | A/B testing, rollback |
| Cost efficiency at scale | LOW | Start simple, optimize later |

---

## Decision 1: ML Hosting

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Supabase Edge Functions only** | Integrated, simple deployment, low latency | Deno runtime limits, no Python, limited ML libraries |
| **Separate Python service (AWS Lambda/Fargate)** | Full ML stack, GPU support, training + inference | Additional infrastructure, latency, cost |
| **Hybrid: Edge for inference, Python for training** | Best of both worlds | Complexity in model transfer |
| **Vercel Edge Functions** | Already on Vercel, integrated | Same Deno/V8 limitations |

### Decision: **Hybrid Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     ML HOSTING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │  INFERENCE LAYER        │    │  TRAINING LAYER             │ │
│  │  (Next.js / Edge)       │    │  (Python / Scheduled Job)   │ │
│  │                         │    │                             │ │
│  │  • Simple models in TS  │    │  • sklearn/statsmodels      │ │
│  │  • Linear calibrations  │    │  • Batch training           │ │
│  │  • Lookup tables        │    │  • Model export to JSON     │ │
│  │  • ONNX.js for complex  │    │  • Validation pipeline      │ │
│  │                         │    │                             │ │
│  │  Runs on: Vercel Edge   │    │  Runs on: GitHub Actions    │ │
│  │           or serverless │    │           or Supabase Cron  │ │
│  └─────────────────────────┘    └─────────────────────────────┘ │
│              │                              │                    │
│              │                              │                    │
│              ▼                              ▼                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SUPABASE (Model Storage + Data)              │   │
│  │                                                           │   │
│  │  • model_versions table (metadata)                        │   │
│  │  • calibrations table (regional offsets)                  │   │
│  │  • predictions table (for training)                       │   │
│  │  • actuals table (ground truth)                           │   │
│  │  • Storage bucket (larger model artifacts if needed)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Rationale

1. **Start with TypeScript inference**: Our initial ML needs (regional calibration, confidence adjustments) are simple enough for TypeScript
2. **Python for training**: Standard ML tooling, easier to iterate on models
3. **Avoid premature complexity**: No separate ML service until we need GPU or real-time training
4. **ONNX.js escape hatch**: If we need complex models in browser/edge, ONNX.js can run them

### Implementation Path

| Phase | ML Capability | Hosting |
|-------|---------------|---------|
| **Phase 1 (F020)** | Regional calibration (mean + stddev offsets) | TypeScript in Next.js |
| **Phase 2 (F024)** | Brix ML with weather features | TypeScript + ONNX.js |
| **Phase 3 (Future)** | CV Brix prediction | Python service (if needed) |

---

## Decision 2: Training Pipeline

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Online learning** | Real-time updates, always fresh | Unstable, hard to validate, drift |
| **Batch (daily/weekly)** | Stable, auditable, standard | Delayed learning |
| **Hybrid (batch + online adjustments)** | Fresh + stable | Complex |

### Decision: **Batch Training with Scheduled Retraining**

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRAINING PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRIGGER: Cron (weekly) or manual                                │
│                                                                  │
│  1. EXTRACT ──────────────────────────────────────────────────── │
│     │  Query predictions + actuals from Supabase                 │
│     │  Filter: last 30 days, min 100 samples per region          │
│     ▼                                                            │
│  2. VALIDATE ─────────────────────────────────────────────────── │
│     │  Check data quality (outliers, completeness)               │
│     │  Log anomalies for Exception Handler                       │
│     ▼                                                            │
│  3. TRAIN ────────────────────────────────────────────────────── │
│     │  Fit model (initially: regional offset + stddev)           │
│     │  Cross-validate, compute metrics (MAE, RMSE)               │
│     ▼                                                            │
│  4. EVALUATE ─────────────────────────────────────────────────── │
│     │  Compare to baseline (deterministic formula)               │
│     │  If ML worse → keep baseline, alert                        │
│     ▼                                                            │
│  5. DEPLOY ───────────────────────────────────────────────────── │
│     │  Export model to JSON (coefficients, thresholds)           │
│     │  Insert into model_versions table                          │
│     │  Update active_model pointer                               │
│     ▼                                                            │
│  6. MONITOR ──────────────────────────────────────────────────── │
│        Track prediction accuracy over next period                │
│        Rollback if degradation detected                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Rationale

1. **Batch is simpler**: Easier to debug, validate, and audit
2. **Agricultural data is slow-changing**: Seasonal patterns, not real-time
3. **Quality over speed**: Bad model is worse than stale model
4. **Weekly cadence**: Enough data accumulation, frequent enough for seasonal adaptation

### Implementation

**Phase 1**: Python script run manually or via GitHub Actions
**Phase 2**: Supabase pg_cron for scheduled database function
**Phase 3**: Full CI/CD pipeline with automated validation gates

---

## Decision 3: Model Storage

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Supabase tables** | Integrated, queryable, simple | Limited to structured data |
| **Supabase Storage** | Can store blobs, integrated | Manual management |
| **S3** | Industry standard, versioning | Additional service, complexity |
| **Git (model files)** | Versioned with code | Size limits, not dynamic |

### Decision: **Supabase Tables + Storage (with S3 fallback)**

### Schema

```sql
-- Model metadata and small coefficients in tables
CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL,  -- 'regional_calibration', 'brix_ml', 'cv_brix'
  version TEXT NOT NULL,     -- Semantic version
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Status
  status TEXT DEFAULT 'staging',  -- 'staging', 'active', 'deprecated'

  -- Performance metrics
  training_mae FLOAT,
  training_rmse FLOAT,
  validation_mae FLOAT,
  validation_rmse FLOAT,
  sample_count INT,

  -- Model payload (for small models)
  coefficients JSONB,  -- { "indian_river": { "offset": 0.3, "stddev": 0.8 }, ... }

  -- For larger models
  artifact_path TEXT,  -- Path in Supabase Storage or S3

  -- Audit
  training_config JSONB,  -- Hyperparameters, data range
  notes TEXT
);

-- Regional calibrations (quick lookup, denormalized from model)
CREATE TABLE regional_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id TEXT NOT NULL,
  cultivar_id TEXT,  -- NULL = region-wide

  -- Calibration values
  brix_offset FLOAT DEFAULT 0,
  brix_stddev FLOAT DEFAULT 1,
  sample_count INT DEFAULT 0,

  -- Model reference
  model_version_id UUID REFERENCES model_versions(id),

  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(region_id, cultivar_id)
);
```

### Storage Strategy

| Model Type | Size | Storage |
|------------|------|---------|
| Regional calibrations | ~1KB | Supabase table (coefficients JSONB) |
| Brix ML (linear/tree) | ~10KB | Supabase table (coefficients JSONB) |
| CV Brix (neural net) | ~10MB+ | Supabase Storage → S3 if needed |

### Rationale

1. **Keep simple models in tables**: Queryable, auditable, integrated
2. **Use Storage for blobs**: ONNX files, TensorFlow.js models
3. **S3 only if needed**: Avoid premature infrastructure complexity
4. **Versioning in database**: Full audit trail, easy rollback

---

## Decision 4: A/B Testing Framework

### Requirements

1. **Traffic splitting**: Route X% to formula, Y% to ML-enhanced
2. **Consistent assignment**: Same user/product gets same variant
3. **Metrics collection**: Track prediction accuracy per variant
4. **Statistical significance**: Know when winner is confident

### Decision: **Database-Driven A/B with Feature Flags**

```typescript
// A/B test configuration
interface ABTest {
  id: string
  name: string                    // 'brix_ml_v1'
  status: 'draft' | 'running' | 'concluded'

  // Traffic allocation
  variants: {
    control: { weight: number; model: 'formula' }
    treatment: { weight: number; model: string }  // model_version_id
  }

  // Assignment
  assignmentKey: 'user_id' | 'region_id' | 'cultivar_id'

  // Success metrics
  primaryMetric: 'mae' | 'rmse' | 'within_1_brix'
  minimumSampleSize: number

  // Results
  startedAt: Date
  endedAt?: Date
  winner?: 'control' | 'treatment'
  pValue?: number
}
```

### Implementation

```typescript
// In orchestrator.ts
async function predictBrix(input: BrixInput): Promise<BrixPrediction> {
  // 1. Check for active A/B test
  const abTest = await getActiveABTest('brix_prediction')

  // 2. Assign variant (consistent hashing)
  const variant = abTest
    ? assignVariant(abTest, input.regionId)
    : 'control'

  // 3. Route to appropriate model
  let prediction: BrixPrediction
  if (variant === 'control') {
    prediction = formulaPredict(input)  // Deterministic
  } else {
    prediction = await mlPredict(input, abTest.variants.treatment.model)
  }

  // 4. Log for analysis
  await logPrediction({
    ...prediction,
    abTestId: abTest?.id,
    variant,
  })

  return prediction
}

// Variant assignment (consistent)
function assignVariant(test: ABTest, key: string): 'control' | 'treatment' {
  const hash = murmurhash(key + test.id)
  const bucket = hash % 100

  if (bucket < test.variants.control.weight * 100) {
    return 'control'
  }
  return 'treatment'
}
```

### Analysis Query

```sql
-- Compare A/B test variants
SELECT
  ab_test_id,
  variant,
  COUNT(*) as predictions,
  AVG(ABS(predicted_brix - actual_brix)) as mae,
  SQRT(AVG(POWER(predicted_brix - actual_brix, 2))) as rmse,
  SUM(CASE WHEN ABS(predicted_brix - actual_brix) <= 1 THEN 1 ELSE 0 END)::FLOAT
    / COUNT(*) as within_1_brix
FROM predictions p
JOIN actuals a ON p.id = a.prediction_id
WHERE ab_test_id = 'test_123'
GROUP BY ab_test_id, variant;
```

### Rationale

1. **Database-driven**: No code deploy to change test parameters
2. **Consistent assignment**: Hash-based, reproducible
3. **Simple metrics**: MAE, RMSE, % within threshold
4. **Manual conclusion**: Human reviews results, decides winner

---

## Consequences

### Positive

- **Low complexity start**: TypeScript inference, no separate ML service
- **Clear upgrade path**: ONNX.js → Python service when needed
- **Full audit trail**: All models versioned, all predictions logged
- **Safe experimentation**: A/B testing prevents bad model rollout

### Negative

- **Limited initial ML**: No GPU, no real-time training
- **Manual model deployment**: Not fully automated initially
- **TypeScript ML limitations**: May hit performance ceiling

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| TypeScript too slow | ONNX.js, Web Workers, or Python service |
| Model storage grows large | S3 migration path defined |
| A/B test takes too long | Start with high-traffic regions |
| Bad model deployed | Automated rollback on accuracy degradation |

---

## Implementation Checklist

### Phase 1: Foundation (F017-F020)
- [ ] F017: predictions table migration
- [ ] F018: actuals table migration
- [ ] F019: calibrations table migration
- [ ] F020: Calibration engine (TypeScript)

### Phase 2: A/B Framework (F024, F027)
- [ ] F024: Brix ML service (TypeScript + ONNX.js)
- [ ] F027: model_versions table + version routing
- [ ] A/B test configuration table
- [ ] Variant assignment logic in orchestrator

### Phase 3: Training Pipeline (F030)
- [ ] Python training script
- [ ] GitHub Actions workflow for batch training
- [ ] Model export to JSON/ONNX
- [ ] Validation gates before deployment

### Phase 4: Observability (F023, F028)
- [ ] F023: Accuracy reporting
- [ ] F028: Observability dashboard
- [ ] A/B test results visualization
- [ ] Automated alerts for accuracy degradation

---

## References

- [Hybrid Intelligence Architecture for Fielder](./hybrid-intelligence-architecture-for-fielder.md)
- [Flavor App Feedback Loop Research](./flavor-app-feedback-loop-research.md)
- [SNDBX Platform Intelligence Layer](../../balexbrownii/sndbx_platform/docs/STRATEGIC_BLUEPRINT_RICK_STARR.md)
- [ONNX.js Documentation](https://onnxruntime.ai/docs/tutorials/web/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

*ADR created as part of SPIKE-C: ML Architecture Decision*
