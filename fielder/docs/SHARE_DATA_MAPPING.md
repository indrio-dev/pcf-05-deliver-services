# SHARE Pillar Data Mapping - Complete System View

**Date:** December 22, 2025, 9:15 AM
**Framework:** All data organized by SHARE pillar and storage location

---

## S PILLAR - SOIL/FOUNDATION

### What S Pillar Needs
- Regional soil characteristics (type, drainage, pH, minerals)
- Climate data (frost dates, rainfall, GDD accumulation)
- Terroir effects on quality

### Where S Data Lives

**TypeScript (growing-regions.ts) - 119 regions ✅ RICH**
```typescript
{
  regionId: 'indian_river_fl',
  typicalSoil: {
    type: 'coastal flatwoods (sandy over hardpan)',
    drainage: 'moderate',
    pH: '5.5-6.5',
    naturalMineralization: 'low',
    terroirEffect: 'Indian River brand, coastal microclimate'
  },
  climate: {
    frost_free_days: 305,
    annual_gdd_50: 5500,
    avg_chill_hours: 150
  }
}
```

**Supabase (growing_regions table) - 21 regions ⚠️ SUBSET**
- Same structure, minimally populated
- Missing: 98 TypeScript regions
- Missing: Detailed soil profiles (pH, minerals)

**Neo4j (GrowingRegion nodes) - 27 regions ⚠️ MIXED**
- 16 imported from Supabase
- 11 basic from seed script
- Missing: 92 TypeScript regions

**Research Files - NOT LOADED**
- state-harvest-calendars.json has regional climate notes
- Extension data has some soil recommendations

**S Pillar Status:**
- ✅ **Best data:** TypeScript (119 regions with full soil profiles)
- ⚠️ Databases incomplete
- 🎯 **Action:** Keep TypeScript as S pillar source

---

## H PILLAR - HERITAGE/GENETICS

### What H Pillar Needs
- Cultivar identification and attributes
- Heritage intent (true_heritage, heirloom_quality, commercial)
- Brix potential, quality ceiling
- Rootstock data and modifiers

### Where H Data Lives

**TypeScript (products.ts) - ~500 cultivars ✅ COMPREHENSIVE**
```typescript
{
  id: 'washington_navel',
  name: 'Washington Navel',
  productType: 'orange',
  variety: 'navel',
  heritageIntent: 'heirloom_quality',
  brixRange: [11, 13],
  isNonGmo: true,
  originStory: 'Brazil 1870s, California since 1873'
}
```

**TypeScript (rootstocks.ts) - 12 rootstocks ✅**
```typescript
{
  id: 'carrizo',
  name: 'Carrizo Citrange',
  brixModifier: 0.6,
  vigor: 'standard',
  diseaseResistance: ['CTV', 'tristeza']
}
```

**Supabase (cultivars table) - 12 cultivars ⚠️ MINIMAL**
- washington_navel, cara_cara, lane_late (navels)
- rio_red, ruby_red (grapefruit)
- Missing: 488 TypeScript cultivars

**Supabase (rootstocks table) - 12 rootstocks ✅**
- Same as TypeScript (was seeded)

**Neo4j (Cultivar nodes) - 49 cultivars ⚠️ BASIC**
- From seed script
- Missing: Heritage intent, brix ranges, origin stories

**Research Files - HIGH VALUE, NOT LOADED**
- extension-ufifas-florida-cultivars.json: 50+ FL cultivars with timing
- seed-company files: 621 cultivars with zones, days to maturity
- **THIS IS THE MISSING H PILLAR DATA**

**H Pillar Status:**
- ✅ **Best attributes:** TypeScript products.ts (500 cultivars)
- 🔴 **Missing timing:** Extension data not loaded
- 🎯 **Action:** Load extension cultivar timing → crop-phenology.ts

---

## A PILLAR - AGRICULTURAL PRACTICES

### What A Pillar Needs
- Fertility strategy (annual vs soil banking vs mineralized)
- Certifications (organic, GAP, etc.)
- Regional practice patterns (for inference)

### Where A Data Lives

**TypeScript (inference-chains.ts) - Industry statistics ✅**
```typescript
IPM_ADOPTION_RATES = {
  citrus: 0.85,  // 85% of citrus uses IPM
  stone_fruit: 0.75,
  berries: 0.65
}
```

**TypeScript (regional-practice-priors.ts) - 20 states ✅ NEW**
```typescript
{
  regionId: 'state_ny',
  fertilityStrategyDist: {
    'annual_fertility': 0.60,
    'soil_banking': 0.30,
    'mineralized_soil_science': 0.10
  },
  confidence: 0.85,  // Based on 838 growers
  dataSource: 'fielder_kg_2025_12_22'
}
```

**Supabase (regional_practice_priors table) - 12 rows ✅ NEW**
- Seeded from tonight's enhancement
- National defaults + top 7 states

**Neo4j (Entity properties) - Sparse ⚠️**
- Entity.certifications: 20 have data
- Entity.features: Some have indicators
- Missing: Practice data for 99% of entities

**A Pillar Status:**
- ✅ **Inference works:** Regional priors from tonight's KG analysis
- ⚠️ Entity-level practices mostly unknown
- 🎯 **Action:** Use regional priors for inference (already built)

---

## R PILLAR - RIPEN/TIMING

### What R Pillar Needs
- Bloom dates by cultivar × region
- GDD parameters (gddToPeak, gddWindow)
- Harvest windows (start, end, peak)
- Age modifiers for perennials

### Where R Data Lives

**TypeScript (crop-phenology.ts) - 28 entries ⚠️ SPARSE**
```typescript
{
  cropId: 'navel_orange',
  region: 'florida',
  bloomMonth: 3,
  bloomDay: 15,
  gddBase: 55,
  gddToPeak: 6100,
  gddWindow: 3500,
  source: 'UF/IFAS FL620'
}
```

**Supabase (harvest_windows table) - 21 rows ⚠️**
- Computed windows with dates
- Linked to crops (not cultivars)

**Neo4j - 0 HarvestWindow nodes 🔴 EMPTY**
- Schema exists, never populated

**Research Files - GOLD MINE, NOT LOADED 🔴**

**extension-ufifas-florida-cultivars.json:**
```json
"tomato": {
  "spring_season": {
    "region": "north_florida",
    "planting_months": ["March", "April", "May"],
    "varieties": [
      {"name": "Tasti-Lee", "maturity": "late midseason"},
      {"name": "Florida 47", "maturity": "late midseason"}
    ]
  }
}
```

**localharvest-farms.json:**
```json
"The Orange Shop, Citra, FL": {
  "citrus_orange": {
    "harvestMonths": [10,11,12,1,2,3,4,5],
    "productCategory": "Oranges"
  }
}
```

**seed-company-burpee-florida.json:**
- Days to maturity for 621 cultivars
- Can convert to GDD estimates

**R Pillar Status:**
- 🔴 **CRITICAL GAP:** Only 28 phenology entries loaded
- ✅ **Data exists:** Extension files have 50+ FL cultivars
- 🎯 **ACTION NEEDED:** Load extension → crop-phenology.ts (PRIORITY 1)

---

## E PILLAR - ENRICH/QUALITY

### What E Pillar Needs
- Brix measurements (actual)
- Lab test results (nutrients, omega ratios)
- Quality validation data

### Where E Data Lives

**Supabase (actuals table) - 0 rows 🔴 EMPTY**
- Schema ready for measurements
- Consumer scans, refractometer readings
- Lab reports
- **Waiting for data collection**

**Supabase (lab_reports table) - 0 rows 🔴 EMPTY**
- Schema ready for Edacious integration
- Nutrient panels, omega ratios
- **Waiting for integration**

**Supabase (nutrient_values table) - 0 rows 🔴**
- Links to lab_reports
- Individual nutrient measurements

**Neo4j (Measurement nodes) - 0 🔴 EMPTY**
- Schema exists, not populated

**TypeScript (Constants) - Expected ranges only**
- CULTIVAR_BRIX_EXPECTATIONS in inference-chains.ts
- Baseline ranges, not actual measurements

**E Pillar Status:**
- 🔴 **No measurement data yet** (future data collection)
- ✅ **Infrastructure ready** (Supabase tables, schema)
- ⏳ **Waiting for:** Consumer app launch, Edacious integration

---

## CROSS-PILLAR: CULTIVAR × REGION × TIMING (The Core)

### What's Needed for "At Peak" Discovery

**The essential mapping:**
```
Washington Navel × Indian River → {
  S: coastal flatwoods soil,
  H: heirloom_quality, brix 11-13,
  R: bloom Mar 15, gddToPeak 6100, harvest Oct-May,
  A: (infer from regional priors),
  E: (measure from consumers)
}
```

### Where This Data Lives NOW

**FRAGMENTED:**

| Component | TypeScript | Supabase | Neo4j | Research |
|-----------|-----------|----------|-------|----------|
| **Cultivar (H)** | 500 cultivars | 12 cultivars | 49 cultivars | 50+ in extensions |
| **Region (S)** | 119 regions | 21 regions | 27 regions | - |
| **Timing (R)** | 28 phenology | 21 windows | 0 | 50+ in extensions |
| **Linkage** | Via code | Via FK | Via relationships | In JSON |

**WHAT'S MISSING:** The CONNECTIONS

| Connection | Status |
|------------|--------|
| Cultivar → Region (which grow where) | ❌ Not in TypeScript |
| Cultivar → Region (which grow where) | ❌ Not in Supabase |
| Cultivar → Region (which grow where) | ❌ Not in Neo4j |
| Cultivar → Region (which grow where) | ✅ In research files! |

**THE PROBLEM:**
- TypeScript has cultivars (500) and regions (119) BUT NOT THE MAPPING
- Extension data HAS the mapping (Washington Navel in FL, timing data)
- **It's in data/research/, not in the app**

---

## THE CRITICAL REALIZATION

### What crop-phenology.ts Actually IS

**Current 28 entries are:**
```typescript
{ cropId: 'navel_orange', region: 'florida', ... }
```

**This is PRODUCT × REGION, not CULTIVAR × REGION**

**It should be:**
```typescript
{ cropId: 'washington_navel', region: 'indian_river_fl', ... }
{ cropId: 'valencia', region: 'central_florida', ... }
{ cropId: 'cara_cara', region: 'ventura_ca', ... }
```

**CULTIVAR-SPECIFIC, not generic.**

### What Extension Data Provides

**UF/IFAS has exactly this:**
- Tasti-Lee tomato × North Florida → timing
- Florida 47 tomato × North Florida → timing
- Celebrity tomato × North Florida → timing

**Cultivar × Region × Timing** (the missing link!)

---

## THE DATA INTEGRATION MAP (SHARE-Centric)

```
S PILLAR (Soil/Region):
  ✅ TypeScript: 119 regions with typicalSoil (COMPLETE)
  ⚠️ Supabase: 21 regions (incomplete migration)
  ⚠️ Neo4j: 27 regions (incomplete migration)
  → **Keep TypeScript as S source**

H PILLAR (Heritage/Cultivar):
  ✅ TypeScript: 500 cultivars with attributes (COMPLETE)
  ⚠️ Supabase: 12 cultivars (incomplete)
  ⚠️ Neo4j: 49 cultivars (incomplete)
  → **Keep TypeScript as H source**

R PILLAR (Timing):
  🔴 TypeScript: 28 generic entries (INCOMPLETE)
  🔴 Supabase: 21 generic windows (INCOMPLETE)
  🔴 Neo4j: 0 entries (EMPTY)
  ✅ Extension files: 50+ cultivar × region entries (COMPLETE BUT NOT LOADED)
  → **LOAD extension → TypeScript crop-phenology.ts**

A PILLAR (Practices):
  ✅ TypeScript: Regional priors (NEW, tonight)
  ✅ Supabase: Regional priors seeded (NEW, tonight)
  ⚠️ Neo4j: Entity-level sparse
  → **Use regional priors for inference (working)**

E PILLAR (Measurements):
  🔴 Supabase: 0 actuals, 0 lab reports (EMPTY, awaiting data)
  🔴 Neo4j: 0 measurements (EMPTY)
  → **Future: Consumer scans, Edacious integration**

CONNECTIONS (Cultivar × Region):
  🔴 TypeScript: Not mapped (cultivars and regions separate)
  🔴 Supabase: Not mapped
  🔴 Neo4j: Not mapped
  ✅ Extension files: HAS THE MAPPINGS (not loaded)
  → **CRITICAL: Load extension data to create mappings**
```

---

## RECOMMENDED DATA STRUCTURE (SHARE-Aligned)

### Single Source of Truth per Pillar

| SHARE Pillar | Primary Source | Format | Size |
|--------------|---------------|--------|------|
| **S (Soil)** | TypeScript growing-regions.ts | Constants | 119 regions |
| **H (Heritage)** | TypeScript products.ts | Constants | 500 cultivars |
| **R (Timing)** | **SHOULD BE:** TypeScript crop-phenology.ts | Constants | **CURRENTLY:** 28, **NEEDS:** 80+ from extensions |
| **A (Practices)** | TypeScript regional-practice-priors.ts | Constants | 20 states |
| **E (Measurements)** | Supabase actuals, lab_reports | Database | 0 (future) |
| **Connections** | **MISSING:** Cultivar × Region linkage | **SHOULD BE:** TypeScript regional-distributions.ts | **NEEDS:** Extension data |

### Operational/Time-Series Data

| Data Type | Storage | Purpose |
|-----------|---------|---------|
| Predictions | Supabase | Track accuracy over time |
| Actuals | Supabase | Consumer measurements |
| Calibrations | Supabase | Improve predictions |
| Regional GDD | Supabase | Cache daily calculations |

### Research/Entity Catalog

| Data Type | Storage | Purpose |
|-----------|---------|---------|
| 21K Entities | Neo4j | Market intelligence, pattern validation |
| Farm locations | Neo4j | Future farm discovery |
| Supply chain | Neo4j | Sourcing intelligence |

---

## THE INTEGRATION ACTIONS (SHARE-Prioritized)

### Priority 1: R PILLAR (Timing) - CRITICAL GAP

**Problem:** Only 28 generic entries, need cultivar-specific

**Solution:**
```
Load: data/research/extension-ufifas-florida-cultivars.json
Parse: Cultivar timing by region/season
Generate: CropPhenology entries (cultivar-specific)
Output: crop-phenology.ts (28 → 80+ entries)
```

**Impact:** App can show cultivar-level peaks (Washington Navel vs Valencia)

### Priority 2: R PILLAR Connections

**Problem:** No cultivar × region mappings

**Solution:**
```
Load: Extension data + seed company data
Build: RegionalCultivarDistribution entries
Populate: regional-distributions.ts
```

**Impact:** Inference engine knows which cultivars grow where

### Priority 3: Validate with Entity Data

**Problem:** Extension data needs validation

**Solution:**
```
Query: Neo4j packinghouses with cultivar mentions
Extract: Variety names from notes
Cross-check: Against extension data
Update: Confidence scores
```

**Impact:** Higher confidence in reference data

---

## THE ANSWER TO YOUR QUESTION

**Where should data live, organized by SHARE:**

### Reference Data (S, H, R baselines, A defaults)
**→ TypeScript Constants**
- Fast (no DB latency)
- Git-versioned (track changes)
- Works offline
- Currently: S ✅, H ✅, R 🔴, A ✅

### Operational Data (E measurements, predictions)
**→ Supabase**
- Time-series data
- User-generated
- Queryable for analytics
- Currently: All empty (future)

### Entity Catalog (Who/What/Where)
**→ Neo4j**
- 21K entities for market intelligence
- Pattern validation
- Future: Farm discovery
- Currently: Research use only

### Real-Time Calculated (Current GDD)
**→ Computed on-demand**
- Weather API calls
- Cached in Supabase (daily_predictions table)
- Not stored permanently

---

## IMMEDIATE NEXT STEP (No Ambiguity)

**Load extension data into crop-phenology.ts:**

1. Parse `data/research/extension-ufifas-florida-cultivars.json`
2. For each cultivar × region × season:
   - Extract: planting months, maturity, variety name
   - Calculate: Estimated bloom date, GDD requirements
   - Generate: CropPhenology entry
3. Append to crop-phenology.ts
4. Result: 28 → 80+ cultivar-specific entries

**This completes R pillar for Florida.**

**Then repeat for:**
- Cornell data (NY cultivars)
- Other extension services (CA, TX, WA, MI)

**Expected final:** 120-150 cultivar × region × timing entries

---

**Should I proceed with loading extension data into crop-phenology.ts now?**
