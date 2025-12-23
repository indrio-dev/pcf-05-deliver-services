# Fielder Inference Model - What's Calculated vs What's Inferred

**Date:** 2025-12-22
**Purpose:** Clarify calculation vs inference after implementation

---

## Key Distinction

**CALCULATED** = Deterministic from inputs (weather, formulas)
**INFERRED** = Probabilistic from patterns (when data missing)

---

## What We CALCULATE (Inputs → Deterministic Outputs)

### GDD (Growing Degree Days)
**NOT inferred - CALCULATED from weather data**

```
Input: Daily weather (tMax, tMin) + base temperature
Formula: max(0, (tMax + tMin) / 2 - baseTemp)
Output: GDD value (e.g., 3200)
```

**Source:** Weather API (Open-Meteo, Visual Crossing, etc.)
**Versioning:** v1, v2 (heat cap), v3 (water stress)
**Purpose:** Measures accumulated heat units → predicts phenological stage

**GDD is a measurement tool, not a prediction target.**

---

## What We INFER (Missing Data → Probabilistic Estimates)

### 1. Fertility Strategy (Enhancement #3: Regional Priors)

**When farm doesn't provide practice data:**

```
Input: Farm in NY, no practices specified
Query: What do OTHER NY farms do?
Find: 60% annual_fertility, 30% soil_banking, 10% mineralized
Infer: → Likely annual_fertility (most common)
Confidence: 0.85 (based on 838 NY grower sample)
```

**Why this matters:** Fertility strategy affects soil quality → affects Brix

**What we DON'T infer:** Pest management (doesn't affect Brix - separate axis)

### 2. Cultivar Identity (Enhancement #4: Temporal Inference)

**When terminal report says "CA NAVEL" (no specific cultivar):**

```
Input: Date (Dec 22), Current GDD (3200), Variety (Navel)
Available: Washington Navel (optimal 3200), Lane Late (optimal 4500)
Calculate: GDD proximity (Washington: Δ0, Lane Late: Δ1300)
Infer: → 100% Washington Navel (at peak)
```

**Why this matters:** Different cultivars have different Brix potentials

**Key:** Inference changes with GDD (dynamic, not static market share)

### 3. Uncertainty Range (Enhancement #1: Distributions)

**When prediction has incomplete SHARE data:**

```
Input: Predicted Brix 12.0
Missing: Specific cultivar (±0.5), Exact timing (±0.6), Farm practices (±0.5)
Calculate: Total variance = √(0.5² + 0.3² + 0.5² + 0.6²) = ±1.0
Infer: → Range [11.0 - 13.0] with percentiles
```

**Why this matters:** Honest about uncertainty from incomplete data

**Transparency:** Show which components contribute to variance

---

## What We DON'T Infer (Removed After Clarification)

### ❌ Pest Management Practices
**Reason:** Doesn't affect Brix or nutrition (on separate axis)
**Decision:** Removed from regional priors (Enhancement #3 updated)

### ❌ GDD Values
**Reason:** GDD is calculated from weather, not predicted/inferred
**Clarification:** GDD is an **input** to cultivar inference, not an output

---

## Data Flow (Clarified)

```
CALCULATE:
  Weather data → GDD formula (v1/v2/v3) → GDD value

USE GDD AS INPUT:
  GDD value + Date → Temporal inference → Cultivar probability

INFER WHEN MISSING:
  No farm practices → Regional prior → Fertility strategy
  No cultivar specified → Temporal inference → Cultivar identity
  Incomplete data → Variance components → Uncertainty range
```

---

## What Actually Has Value for SHARE Predictions

| Pillar | What Matters | Can We Infer? | Status |
|--------|--------------|---------------|--------|
| **S (Soil)** | Fertility strategy (mineralized vs annual) | ✅ YES (regional priors) | Working |
| **H (Heritage)** | Cultivar identity | ✅ YES (temporal inference) | Working |
| **A (Agricultural)** | Fertility approach (NOT pesticides) | ✅ YES (regional priors) | Updated |
| **R (Ripen)** | GDD accumulation, harvest timing | ❌ NO (calculate from weather) | Need weather API |
| **E (Enrich)** | Brix measurement | ❌ NO (measure, don't infer) | Need Edacious |

---

## Corrections Made

1. **Removed pest management from priors** (doesn't affect quality)
2. **Clarified GDD is calculated** (not inferred)
3. **Kept temporal inference** (has value)
4. **Added transparency note** (show why range is wide)

The inference systems now focus on **what actually predicts quality**, not irrelevant factors.

---

**Next:** Should we update the regional priors to remove organic/conventional percentages (not useful) and focus only on fertility strategy distribution?
