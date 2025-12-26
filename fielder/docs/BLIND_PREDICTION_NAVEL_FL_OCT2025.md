# BLIND PREDICTION TEST: Washington Navel, Lee FL, October 31, 2025

**Test Date:** December 24, 2025
**Purpose:** Prove predictions are formula-based, not curve-fitting
**Status:** PREDICTION MADE BEFORE KNOWING ACTUAL BRIX

---

## Given Information (Inputs):

```
Cultivar: Washington Navel Orange
Rootstock: US-897
Tree Age: 7 years old
Location: Lee, FL (Sweet Valley)
Soil: Sandy
Test Date: October 31, 2025

ACTUAL BRIX: ??? (I don't know yet!)
```

---

## PREDICTION (Using Framework Only)

### Step 1: Get Navel GDD Parameters (From Code)

**Source:** `src/lib/constants/gdd-targets.ts` lines 76-89

```typescript
navel_orange: {
  baseTemp: 55.0°F,
  gddToMaturity: 5100,     // Harvest window opens
  gddToPeak: 6100,         // Peak quality (~275 days)
  brixMin: 8°Bx,           // Immature
  brixMax: 16°Bx,          // Genetic ceiling (generic, needs cultivar-specific)
}
```

**These are from the code, not made up.**

---

### Step 2: Rootstock Modifier

**Problem:** US-897 not in our rootstock database!

**Checked:** `src/lib/constants/rootstocks.ts`
**Result:** Only has Carrizo, C-35, Sour Orange, Swingle, Rough Lemon, etc.

**US-897 is a newer University of Florida rootstock (HLB-tolerant)**

**Without data, I'll assume:**
```
US-897: Neutral to slightly positive (0 to +0.3°Bx estimated)
Reason: UF breeds for disease resistance primarily, quality secondary

Conservative estimate: +0.2°Bx
```

**⚠️ This is UNCERTAIN - not in our data**

---

### Step 3: Tree Age Modifier (From Code)

**Source:** `src/lib/constants/gdd-targets.ts` maturityProfile for navel

```
primeAgeRangeYears: [8, 18]
yearsToFirstBearing: 3
```

**Age 7 years:**
- Just before prime (prime starts at 8)
- From typical age modifier pattern:
  - Age 5-7: -0.2°Bx (approaching prime)
  - Age 8-18: 0.0°Bx (prime, full genetic ceiling)

**Age modifier for 7 years: -0.2°Bx**

**This is from the age modifier pattern in the codebase.**

---

### Step 4: Estimate GDD Accumulated

**Location:** Lee, FL (likely Lee County, Southwest Florida)

**From graph data:** Florida has annualGdd50 ~ 5500

**Bloom date estimation for FL Navels:**
```
Florida Navels bloom: Mid to late February (warmer than CA)
Estimated bloom: February 20, 2025
```

**Days from bloom to test:**
```
Feb 20 → Oct 31 = 254 days
```

**GDD accumulation:**
```
FL GDD/day during growing season: ~20 GDD/day
(annualGDD 5500 / 275 active growing days)

October 2025 was likely warm (following warm year pattern)
Estimated: 21 GDD/day

Total GDD: 254 days × 21 GDD/day = 5334 GDD
```

---

### Step 5: Apply Sigmoid Formula (From gdd.ts:178-180)

**Formula from code:**
```typescript
dd50 = gddToMaturity = 5100
slopeFactor = (gddToPeak - gddToMaturity) / 4
            = (6100 - 5100) / 4
            = 250

exponent = -(currentGDD - dd50) / slopeFactor
         = -(5334 - 5100) / 250
         = -234 / 250
         = -0.936

sigmoidValue = 1 / (1 + exp(-0.936))
             = 1 / (1 + exp(-0.936))
             = 1 / (1 + 0.392)
             = 1 / 1.392
             = 0.718

predictedBrix = brixMin + (brixMax - brixMin) × sigmoidValue
              = 8 + (16 - 8) × 0.718
              = 8 + 8 × 0.718
              = 8 + 5.74
              = 13.74°Bx
```

**Base prediction from GDD model: 13.7°Bx**

---

### Step 6: Apply Modifiers

**Rootstock (US-897):**
```
Estimated: +0.2°Bx (neutral, not in database)
⚠️ UNCERTAIN - guessing based on UF breeding goals
```

**Tree Age (7 years):**
```
Modifier: -0.2°Bx (approaching prime, not yet at full ceiling)
From code: primeAge starts at 8 years
```

**October 31 Timing:**
```
Position in window:
- gddToMaturity: 5100 (window opens)
- Current GDD: 5334
- gddToPeak: 6100 (peak)

Position: 234 GDD into maturity→peak window (1000 GDD wide)
Percentage: 23% through peak window

Assessment: Early in harvest window, not yet at peak
Timing modifier: -0.3°Bx (early harvest penalty)
```

---

### Step 7: Soil Impact (Sandy FL Soil)

**Sandy soil characteristics:**
```
Pros: Excellent drainage (citrus needs this)
Cons: Low nutrient retention, low organic matter, leaches minerals

Typical sandy soil Brix impact:
- Without mineralization: -1 to -2°Bx (depleted, leaches N/K)
- With good fertilization: -0.5°Bx (adequate but not optimal)
- With mineralization: +0°Bx (compensates for sand)

Conservative estimate: -0.8°Bx (sandy without mineralization data)
```

---

## FINAL PREDICTION (Before Knowing Answer)

**Calculation:**
```
Base (from sigmoid GDD model): 13.7°Bx
+ Rootstock (US-897 estimated): +0.2°Bx
+ Age (7 years, pre-prime): -0.2°Bx
+ Timing (Oct 31, early window): -0.3°Bx
+ Soil (sandy, likely deficient): -0.8°Bx

= 13.7 + 0.2 - 0.2 - 0.3 - 0.8
= 12.6°Bx
```

---

## MY BLIND PREDICTION: **12.5°Bx**

**Confidence:** Medium (60%)

**Reasoning:**
```
✅ Confident in: GDD calculation (formula-based)
⚠️ Uncertain: Rootstock modifier (US-897 not in database)
⚠️ Uncertain: Soil mineral status (assumed sandy = deficient)
⚠️ Uncertain: Actual bloom date (estimated Feb 20)

If actual is:
- 11-14°Bx: Model is accurate ✓
- 8-10°Bx: Fruit picked too early or severe soil issues
- 15-16°Bx: Tree has excellent mineralization I didn't account for
```

---

## Uncertainty Breakdown:

**What I'm CONFIDENT in:**
- GDD formula is correct (from code)
- Navel parameters are correct (from code)
- Age modifier pattern (from code)
- October 31 is early for FL Navels (from GDD)

**What I'm UNCERTAIN about:**
- Exact rootstock modifier (US-897 not in database)
- Actual soil mineral status (assumed deficient sandy)
- Exact bloom date (estimated, could be ±10 days)
- 2025 actual GDD accumulation (estimated warm year)

---

## How to Prove This Isn't Curve-Fitting:

**Now tell me the ACTUAL Brix.**

**If I'm:**
- **Within 1-2°Bx:** Model is predictive ✓
- **Exactly right (12.5°Bx):** Suspiciously accurate, but lucky!
- **Way off (5+°Bx):** Model needs calibration or missing info

**If I were curve-fitting, I'd wait for the answer before calculating.**

**I calculated 12.5°Bx BEFORE knowing the answer.**

---

**What's the actual Brix?**
