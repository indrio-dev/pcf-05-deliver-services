# Fielder Rule Extraction Map

**SPIKE-B: Rule Extraction Baseline**
**Date:** December 18, 2025
**Purpose:** Document all GDD/Brix calculation locations for F013 Rules Engine extraction

---

## Executive Summary

**Total Rule Locations Found:** 7 files with active calculation logic
**Total Calculation Functions:** 18 distinct rule functions
**Test Coverage (existing):** 55 tests across 2 test files (F008)

**Extraction Candidates for F013:** 12 functions recommended for Rules Engine

---

## 1. Core Calculation Files

### 1.1 `src/lib/services/gdd-calculator.ts` (162 lines)

**Purpose:** Low-level GDD calculation utilities

| Function | Lines | Formula | Extraction Priority |
|----------|-------|---------|---------------------|
| `calculateDailyGdd()` | 33-40 | `GDD = max(0, (Tmax + Tmin) / 2 - baseTemp)` | HIGH |
| `calculateCumulativeGdd()` | 45-52 | Sum of daily GDD | HIGH |
| `calculateProgress()` | 57-63 | `min(100, (currentGdd / targetGdd) * 100)` | MEDIUM |
| `estimateDaysToTarget()` | 68-77 | `ceil((targetGdd - currentGdd) / avgDailyGdd)` | MEDIUM |
| `calculateAvgDailyGdd()` | 82-89 | `totalGdd / days` | LOW |
| `projectGddAccumulation()` | 94-100 | `currentGdd + (avgDailyGdd * daysAhead)` | LOW |
| `calculateForecastGdd()` | 112-126 | Weighted GDD from forecast | MEDIUM |
| `determineHarvestStatus()` | 139-161 | Status enum based on GDD thresholds | HIGH |

**Test Coverage:** 28 tests in `gdd-calculator.test.ts`

---

### 1.2 `src/lib/prediction/gdd.ts` (349 lines)

**Purpose:** GDD-based prediction functions (ported from Python)

| Function | Lines | Formula | Extraction Priority |
|----------|-------|---------|---------------------|
| `calculateDailyGDD()` | 70-77 | Same as gdd-calculator | DUPLICATE |
| `calculateCumulativeGDD()` | 87-118 | Array version with bloom date | HIGH |
| `estimateAverageGDDPerDay()` | 130-154 | Regional lookup table | HIGH |
| `predictHarvestWindow()` | 170-239 | Days to maturity from GDD | HIGH |
| `predictBrixFromGDD()` | 263-301 | **SIGMOID**: `SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(GDD - DD50) / s))` | **CRITICAL** |
| `predictAcidFromGDD()` | 316-323 | **EXPONENTIAL**: `TA = TA0 × exp(-ka × GDD)` | **CRITICAL** |
| `calculateBrixAcidRatio()` | 333-336 | `brix / acid` | HIGH |
| `calculateBrimA()` | 346-348 | `Brix - 4 × TA` (flavor index) | HIGH |

**Test Coverage:** 27 tests in `gdd-prediction.test.ts`

---

### 1.3 `src/lib/services/harvest-predictor.ts` (284 lines)

**Purpose:** High-level prediction service with SHARE modifiers

| Function | Lines | Formula | Extraction Priority |
|----------|-------|---------|---------------------|
| `calculateAgeModifier()` | 70-79 | **LOOKUP TABLE** - Tree age → Brix modifier | **CRITICAL** |
| `calculateTimingModifier()` | 86-99 | **PARABOLIC**: `penalty = -G × (d / H)²` | **CRITICAL** |
| `predictBrix()` | 106-126 | **MASTER**: `Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod` | **CRITICAL** |
| `estimateSugarAcid()` | 134-171 | Combined SSC + TA + ratio + BrimA | HIGH |
| `predictHarvestWindow()` | 176-228 | Harvest window from GDD | HIGH |
| `getHarvestStatus()` | 250-279 | Status with human-readable messages | MEDIUM |

**Test Coverage:** None (needs regression tests)

---

## 2. Reference Data Constants

### 2.1 `src/lib/constants/gdd-targets.ts` (180 lines)

**Purpose:** GDD requirements per crop type

| Data | Count | Extraction Priority |
|------|-------|---------------------|
| `CROP_GDD_TARGETS` | 15 crops | HIGH - migrate to DB (F010) |
| `getGddTargets()` | 1 function | HIGH - wrap in F009 |

**Crops Defined:**
- Citrus (5): navel_orange, valencia, grapefruit, tangerine, satsuma
- Stone Fruit (3): peach, sweet_cherry, tart_cherry
- Pome Fruit (2): apple, pear
- Berries (2): strawberry, blueberry
- Tropical (2): mango, pomegranate
- Nuts (1): pecan

---

### 2.2 `src/lib/constants/rootstocks.ts` (304 lines)

**Purpose:** Rootstock Brix modifiers

| Data | Count | Extraction Priority |
|------|-------|---------------------|
| `CITRUS_ROOTSTOCKS` | 9 stocks | HIGH - migrate to DB (F012) |
| `STONE_FRUIT_ROOTSTOCKS` | 3 stocks | HIGH - migrate to DB (F012) |
| `getRootstockBrixModifier()` | 1 function | HIGH - wrap in F009 |

**Citrus Rootstock Brix Modifiers:**
| Rootstock | Modifier | Notes |
|-----------|----------|-------|
| Carrizo Citrange | +0.6 | High quality, most common |
| C-35 Citrange | +0.6 | Semi-dwarf, similar to Carrizo |
| Sour Orange | +0.5 | Excellent but CTV susceptible |
| Trifoliate | +0.5 | Cold-hardy, high SSC |
| Cleopatra | +0.2 | Neutral |
| Swingle | -0.5 | High yield, lower quality |
| Rough Lemon | -0.7 | Vigorous, dilutes SSC |
| Macrophylla | -0.8 | Lowest quality |

---

### 2.3 `src/lib/constants/quality-tiers.ts` (577 lines)

**Purpose:** Cultivar quality profiles and Brix baselines

| Data | Count | Extraction Priority |
|------|-------|---------------------|
| `CULTIVAR_QUALITY_PROFILES` | 12 cultivars | HIGH - migrate to DB (F011) |
| `getCultivarProfile()` | 1 function | HIGH - wrap in F009 |
| `inferTierFromBrix()` | 1 function | MEDIUM - Rules Engine |

**Cultivar Base Brix Values:**
| Cultivar | Crop | Research Peak | Research Avg | Tier |
|----------|------|---------------|--------------|------|
| Washington Navel | navel_orange | 12.5 | 11.5 | premium |
| Cara Cara | navel_orange | 13.0 | 12.0 | premium |
| Lane Late | navel_orange | 11.5 | 10.5 | standard |
| Ruby Red | grapefruit | 10.5 | 9.5 | premium |
| Rio Red | grapefruit | 11.0 | 10.0 | premium |
| Elberta | peach | 14.0 | 12.5 | premium |
| Georgia Belle | peach | 16.0 | 14.0 | artisan |
| Sweet Charlie | strawberry | 10.0 | 8.5 | premium |
| Florida Radiance | strawberry | 9.0 | 7.5 | standard |
| Honeycrisp | apple | 14.5 | 13.0 | premium |
| Arkansas Black | apple | 16.0 | 14.5 | artisan |

---

## 3. API Route Usage

### 3.1 `src/app/api/predict/route.ts`
- Uses: `getGddTargets()`, `harvestPredictor.predictBrix()`, `harvestPredictor.estimateSugarAcid()`
- GDD data from weather service

### 3.2 `src/app/api/cron/compute-predictions/route.ts`
- Uses: All GDD functions for batch prediction
- Stores results in Supabase `predictions` table

### 3.3 `src/app/api/discover/route.ts`
- Uses: Estimated GDD from climate data (not live weather)
- Simplified for timeout avoidance

---

## 4. Formula Reference

### 4.1 GDD Calculation (Core)
```
GDD = max(0, (Tmax + Tmin) / 2 - baseTemp)
```
- Citrus base temp: 55°F
- Stone fruit base temp: 40-45°F
- Berries base temp: 50°F

### 4.2 Sugar Accumulation (Sigmoid)
```
SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(GDD - DD50) / s))
```
Where:
- SSC_min: Minimum Brix at start of window (~6.0)
- SSC_max: Maximum Brix (genetic ceiling, ~12.0)
- DD50: GDD at 50% sugar development (~2050)
- s: Slope factor (~350)

### 4.3 Acid Decay (Exponential)
```
TA = TA0 × exp(-ka × GDD)
```
Where:
- TA0: Initial acidity (~3.0%)
- ka: Decay rate (~0.0005)

### 4.4 Quality Indices
```
Brix:Acid Ratio = Brix / TA
BrimA (Flavor Index) = Brix - 4 × TA
```

### 4.5 Peak Brix Prediction (SHARE)
```
Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod
```

### 4.6 Age Modifier (Lookup)
| Age | Modifier | Notes |
|-----|----------|-------|
| 0-2 years | -0.8 | Vegetative phase |
| 3-4 years | -0.5 | Transition |
| 5-7 years | -0.2 | Canopy completion |
| 8-18 years | 0.0 | **Prime production** |
| 19-25 years | -0.2 | Mature |
| >25 years | -0.3 | Declining |

### 4.7 Timing Modifier (Parabolic)
```
Timing_Mod = -G × (d / H)²
```
Where:
- G: Max penalty (1.0)
- d: Days from peak center
- H: Half-width of peak window (~150 GDD)

---

## 5. Extraction Candidates for F013 Rules Engine

### 5.1 CRITICAL (Must Extract)
| Function | Current Location | Why Critical |
|----------|------------------|--------------|
| `predictBrixFromGDD()` | gdd.ts:263 | Core quality prediction |
| `predictAcidFromGDD()` | gdd.ts:316 | Acid model |
| `calculateAgeModifier()` | harvest-predictor.ts:70 | SHARE pillar logic |
| `calculateTimingModifier()` | harvest-predictor.ts:86 | SHARE pillar logic |
| `predictBrix()` | harvest-predictor.ts:106 | Master Brix formula |

### 5.2 HIGH Priority
| Function | Current Location | Why Important |
|----------|------------------|---------------|
| `calculateDailyGDD()` | gdd.ts:70 | Foundation calculation |
| `calculateCumulativeGDD()` | gdd.ts:87 | Tracking logic |
| `determineHarvestStatus()` | gdd-calculator.ts:139 | Status determination |
| `calculateBrixAcidRatio()` | gdd.ts:333 | Quality index |
| `calculateBrimA()` | gdd.ts:346 | Flavor index |
| `getGddTargets()` | gdd-targets.ts:166 | Reference data |
| `getRootstockBrixModifier()` | rootstocks.ts:279 | Reference data |

### 5.3 MEDIUM Priority (Post-F013)
| Function | Current Location | Notes |
|----------|------------------|-------|
| `inferTierFromBrix()` | quality-tiers.ts:549 | Quality classification |
| `estimateAverageGDDPerDay()` | gdd.ts:130 | Regional estimates |
| `getHarvestStatus()` | harvest-predictor.ts:250 | UI helper |

---

## 6. Regression Test Requirements

### 6.1 Existing Tests (55 total)
- `gdd-calculator.test.ts`: 28 tests
- `gdd-prediction.test.ts`: 27 tests

### 6.2 Missing Test Coverage
| File | Functions Needing Tests |
|------|------------------------|
| harvest-predictor.ts | `calculateAgeModifier()`, `calculateTimingModifier()`, `predictBrix()`, `estimateSugarAcid()` |
| quality-tiers.ts | `inferTierFromBrix()`, `getExpectedBrixRange()` |
| rootstocks.ts | `getRootstockBrixModifier()` |

### 6.3 Regression Test Scenarios (To Add)

**Age Modifier Tests:**
```typescript
// Verify lookup table values
expect(calculateAgeModifier(1)).toBe(-0.8)   // Young
expect(calculateAgeModifier(5)).toBe(-0.2)   // Coming into bearing
expect(calculateAgeModifier(12)).toBe(0.0)   // Prime
expect(calculateAgeModifier(30)).toBe(-0.3)  // Old
expect(calculateAgeModifier(null)).toBe(0.0) // Unknown = prime
```

**Timing Modifier Tests:**
```typescript
// At peak = no penalty
expect(calculateTimingModifier(2000, 2000)).toBe(0.0)
// 75 GDD from peak (inner quartile) = no penalty
expect(calculateTimingModifier(2075, 2000, 150)).toBe(0.0)
// 150 GDD from peak = full penalty
expect(calculateTimingModifier(2150, 2000, 150)).toBeCloseTo(-1.0)
```

**Brix Prediction Tests:**
```typescript
// Washington Navel on Carrizo at prime age at peak
const result = predictBrix(11.5, 0.6, 12, 2000, 2000)
expect(result.predictedBrix).toBeCloseTo(12.1)
expect(result.cultivarBase).toBe(11.5)
expect(result.rootstockModifier).toBe(0.6)
expect(result.ageModifier).toBe(0.0)
expect(result.timingModifier).toBe(0.0)
```

**Rootstock Modifier Tests:**
```typescript
expect(getRootstockBrixModifier('carrizo')).toBe(0.6)
expect(getRootstockBrixModifier('swingle')).toBe(-0.5)
expect(getRootstockBrixModifier('unknown')).toBe(0)
expect(getRootstockBrixModifier(undefined)).toBe(0)
```

---

## 7. Duplicate Code Issues

### 7.1 GDD Calculation Duplication
| Function | gdd-calculator.ts | gdd.ts |
|----------|-------------------|--------|
| `calculateDailyGdd` | Lines 33-40 | Lines 70-77 |
| `calculateCumulativeGdd` | Lines 45-52 | Lines 87-118 |

**Recommendation:** Consolidate into single source in F013 Rules Engine.

### 7.2 Harvest Status Duplication
| Function | gdd-calculator.ts | gdd.ts | harvest-predictor.ts |
|----------|-------------------|--------|---------------------|
| `determineHarvestStatus` | Lines 139-161 | - | - |
| `predictHarvestWindow.status` | - | Lines 202-215 | - |
| `getHarvestStatus` | - | - | Lines 250-279 |

**Recommendation:** Single status determination function with options for output format.

---

## 8. Next Steps

1. **Add Missing Tests** - Write regression tests for harvest-predictor.ts functions
2. **Verify Test Baselines** - Ensure current tests capture exact output values
3. **F009 Wrapper** - Create reference-data.ts that wraps constants with DB fallback
4. **F013 Extraction** - Move CRITICAL functions to rules-engine.ts
5. **Deprecate Duplicates** - Remove duplicate functions, use single source

---

*Report generated as part of SPIKE-B: Rule Extraction Baseline*
*Next: Add regression tests for harvest-predictor.ts, then mark SPIKE-B complete*
