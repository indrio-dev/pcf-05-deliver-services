# Model Parameter Updates from Training Data

**Based on:** BFA (5,349 samples) + Georgia (40 samples) training data
**Purpose:** Update model parameters with real measurements, not estimates

---

## Updates from BFA Species Baselines

**Species average Brix (10+ samples each):**

```
Species              Mean Brix    Samples    Current Model    Update To
-------------------- ----------   --------   --------------   ----------
Carrot              10.2°Bx      561        10°Bx (generic)  10.2°Bx ✓
Beet                11.8°Bx      375        11°Bx            11.8°Bx ✓
Kale                9.5°Bx       317        9°Bx             9.5°Bx ✓
Lettuce             4.8°Bx       288        4°Bx             4.8°Bx ✓
Spinach             7.8°Bx       173        7°Bx             7.8°Bx ✓
Tomato              6.2°Bx       135        6°Bx             6.2°Bx ✓
Potato              6.5°Bx       651        6°Bx             6.5°Bx ✓
```

**Assessment:** Our generic baselines are VERY CLOSE to BFA actual averages!
- Most within 0.2-0.5°Bx
- Validates our initial estimates were reasonable

**Minor updates recommended** to match BFA averages exactly.

---

## Updates from Georgia Rootstock Data

**Rootstock Effects (from Sugar Belle + Shiranui controlled tests):**

```
Rootstock         Effect vs Avg    Samples    Current Modifier    Update To
---------------- ----------------- --------   -----------------   ----------
Rubidoux         +1.1°Bx          2          Not in database      +1.0°Bx
US-897           +0.7°Bx          2          +0.2 (estimated)     +0.7°Bx
US-942           -0.1°Bx          2          Not in database      +0.0°Bx
US-852           +0.1°Bx          2          Not in database      +0.0°Bx
Swingle          +0.2°Bx          1          -0.5 (current)       +0.2°Bx
Goutou           -0.6°Bx          1          Not in database      -0.6°Bx
X-639            -0.5°Bx          1          Not in database      -0.5°Bx
```

**Key changes:**
- **Rubidoux:** Much better than expected (+1.0°Bx, not neutral!)
- **US-897:** Better than estimated (+0.7°Bx, not +0.2°Bx)
- **Swingle:** Reverse sign! (was -0.5, should be +0.2)
- **US-942, US-852:** Neutral (no effect, +0.0°Bx)

---

## Updates from Age Effects

**From Georgia data (ages 1-13 years):**

```
Age Range    Sample Brix Range    Current Modifier    Observation
-----------  -------------------  ------------------  ---------------------------
1-2 years    9.6-14.4°Bx         -0.8°Bx             US Superna 14.4 (no penalty!)
3-4 years    6.7-13.7°Bx         -0.5°Bx             Wide range, variety-dependent
5-7 years    9.4-13.5°Bx         -0.2°Bx             Approaching prime
8-18 years   8.1-16.1°Bx         0.0°Bx (prime)      At ceiling, wide variety range
```

**Finding:** Age effects are VARIETY-SPECIFIC
- Precocious varieties (US Superna): No penalty even at 2 years
- Standard varieties: Follow age curve
- Low-ceiling varieties: Always low regardless of age

**Update:** Add `isPrecocious` flag to cultivars instead of blanket age penalties

---

## Actual Code Updates Needed

### File 1: `src/lib/constants/genetic-baselines.ts` (NEW FILE)

**Create with BFA-validated baselines:**
```typescript
// Updated from BFA training data (5,349 samples)
export const VEGETABLE_GENETIC_CEILINGS = {
  carrot: {
    baseline: 10.2,  // From BFA average (561 samples)
    range: [6, 16],  // Min-max from data
    source: 'bfa_training_data',
  },

  beet: {
    baseline: 11.8,  // From BFA average (375 samples)
    range: [8, 18],
    source: 'bfa_training_data',
  },

  kale: {
    baseline: 9.5,   // From BFA average (317 samples)
    range: [6, 15],
    source: 'bfa_training_data',
  },

  potato: {
    baseline: 6.5,   // From BFA average (651 samples)
    range: [3, 10],
    source: 'bfa_training_data',
  },

  // ... etc for all BFA species
}
```

---

### File 2: `src/lib/constants/rootstocks.ts` (UPDATE)

**Update existing rootstock modifiers:**
```typescript
export const ROOTSTOCKS = {
  // ... existing ...

  // UPDATES FROM GEORGIA DATA:
  rubidoux: {
    id: 'rubidoux',
    name: 'Rubidoux',
    brixModifier: +1.0,  // Was: not in database, Now: +1.0 (Georgia data)
    source: 'georgia_uga_2021_sugar_belle_test',
  },

  'us-897': {
    id: 'us-897',
    name: 'US-897',
    brixModifier: +0.7,  // Was: +0.2 (estimated), Now: +0.7 (Georgia data)
    source: 'georgia_uga_2021_controlled_test',
  },

  'us-942': {
    id: 'us-942',
    name: 'US-942',
    brixModifier: +0.0,  // Was: not in database, Now: neutral (Georgia data)
    source: 'georgia_uga_2021',
  },

  'us-852': {
    id: 'us-852',
    name: 'US-852',
    brixModifier: +0.0,  // Was: not in database, Now: neutral (Georgia data)
    source: 'georgia_uga_2021',
  },

  swingle: {
    id: 'swingle',
    name: 'Swingle',
    brixModifier: +0.2,  // Was: -0.5, Now: +0.2 (reversed! Georgia data)
    source: 'georgia_uga_2021',
  },

  goutou: {
    id: 'goutou',
    name: 'Goutou',
    brixModifier: -0.6,  // NEW from Georgia data
    source: 'georgia_uga_2021',
  },

  'x-639': {
    id: 'x-639',
    name: 'X-639',
    brixModifier: -0.5,  // NEW from Georgia data
    source: 'georgia_uga_2021',
  },
}
```

---

### File 3: Add Precocious Flag to Cultivars

**For US Superna:**
```typescript
{
  id: 'us_superna',
  displayName: 'US Superna (88-2)',

  // NEW from Georgia data
  isPrecocious: true,  // Produces quality fruit young (14.4°Bx at 2 years!)
  noAgePenalty: true,  // Ignore age modifiers

  geneticCeiling: 14.5,  // From Georgia measurement (2yr tree hit 14.4)
}
```

---

### File 4: Variety-Specific Genetic Ceilings

**For premium varieties:**
```typescript
{
  id: 'fairchild_mandarin',
  displayName: 'Fairchild Mandarin',

  geneticCeiling: 16.0,  // From Georgia data (16.1°Bx at age 12)
  // Not generic 13°Bx!
}

{
  id: 'sugar_belle',
  displayName: 'Sugar Belle',

  geneticCeiling: 14.0,  // From Georgia data (13.7 max, allowing headroom)
}
```

---

## Implementation Plan

**Do you want me to:**

1. **Create genetic-baselines.ts** with BFA species averages?
2. **Update rootstocks.ts** with Georgia validated modifiers?
3. **Add precocious flags** to cultivars showing no age penalty?
4. **Update variety genetic ceilings** for premium cultivars?

**This would make the model TRAINED not ESTIMATED!**

Ready to implement these updates?