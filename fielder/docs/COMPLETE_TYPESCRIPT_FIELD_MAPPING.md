# Complete TypeScript Field Mapping to Graph

**Date:** December 22, 2025, 7:00 PM
**Purpose:** Comprehensive documentation of EVERY field in TypeScript model
**Status:** What's loaded vs what needs to be loaded

---

## CULTIVAR (H×E Pillar) - 20+ Fields

### TypeScript Interface (products.ts)
```typescript
interface Cultivar {
  // Identity
  id: string                        ✅ LOADED
  productId: string                 ✅ LOADED (as productType)
  varietyId: string                 ❌ NOT LOADED - Links to Variety!
  displayName: string               ❌ NOT LOADED
  technicalName: string             ❌ NOT LOADED
  tradeNames: string[]              ❌ NOT LOADED - "SUMO" → Shiranui inference!

  // Model type
  modelType: ModelType              ❌ NOT LOADED

  // Heritage (H pillar)
  heritageIntent: HeritageIntent    ✅ LOADED
  heritageStatus: HeritageStatus    ❌ NOT LOADED
  isHeritage: boolean               ❌ NOT LOADED
  isNonGmo: boolean                 ❌ NOT LOADED
  originLocked: boolean             ❌ NOT LOADED
  yearIntroduced: number            ❌ NOT LOADED
  originStory: string               ❌ NOT LOADED

  // Geographic (S pillar connection)
  validatedStates: string[]         ❌ NOT LOADED - Which states it grows in!

  // Quality (E pillar)
  brixRange: [number, number]       ❌ NOT LOADED - Expected Brix!
  qualityMetrics: QualityMetrics    ❌ NOT LOADED
  flavorProfile: object             ❌ NOT LOADED
  nutritionBaseline: object         ❌ NOT LOADED

  // Timing (R pillar)
  maturityProfile: MaturityProfile  ❌ NOT LOADED
  harvestingPractices: object       ❌ NOT LOADED

  // Foundation (S pillar needs)
  foundationEnvironment: FoundationEnvironment  ❌ NOT LOADED

  // Shipping
  shippingOptions: ShippingOption[] ❌ NOT LOADED
}
```

**Loaded:** 5 fields (id, name, productType, heritageIntent, source)
**Missing:** 15+ fields including critical Brix, trade names, variety link

---

## VARIETY (ENTIRE LEVEL MISSING)

### TypeScript Interface
```typescript
interface Variety {
  id: string                    ❌ NOT LOADED - No Variety nodes!
  productId: string             ❌ NOT LOADED
  displayName: string           ❌ NOT LOADED
  description: string           ❌ NOT LOADED
  cultivarCount: number         ❌ NOT LOADED
}
```

**Status:** ENTIRE HIERARCHY LEVEL MISSING

**Impact:** Can't traverse: ProductType → Variety → Cultivar
Only have: ProductType → Cultivar (skipped middle level)

---

## REGIONAL OFFERING (H×S×R×E) - 15+ Fields

### TypeScript Interface
```typescript
interface RegionalOffering {
  id: string                        ✅ LOADED (as relationship)
  cultivarId: string                ✅ LOADED
  regionId: string                  ✅ LOADED

  // Region-specific GDD overrides (R pillar)
  gddToMaturityOverride: number     ❌ NOT LOADED
  gddToPeakOverride: number         ⚠️  LOADED (as gdd_to_peak)
  gddWindowOverride: number         ❌ NOT LOADED
  baseTempOverride: number          ❌ NOT LOADED

  // Calendar overrides (R pillar)
  peakMonthsOverride: number[]      ❌ NOT LOADED

  // Expected quality (E pillar)
  qualityTier: string               ✅ LOADED
  flavorNotes: string               ❌ NOT LOADED

  // Availability
  isActive: boolean                 ✅ LOADED
}
```

**Loaded:** 5 fields
**Missing:** 10+ fields including peak months, flavor notes, GDD overrides

---

## GROWING REGION (S Pillar) - 30+ Fields

### TypeScript Interface (growing-regions.ts)
```typescript
interface GrowingRegionExtended {
  // Identity
  id: string                    ✅ LOADED
  name: string                  ✅ LOADED
  displayName: string           ✅ LOADED
  slug: string                  ❌ NOT LOADED

  // Political
  state: string                 ✅ LOADED
  states: string[]              ❌ NOT LOADED
  counties: string[]            ✅ LOADED (as County nodes)
  primaryCities: string[]       ✅ LOADED (as City nodes)
  macroRegion: MacroRegion      ❌ NOT LOADED

  // Location
  latitude: number              ✅ LOADED
  longitude: number             ✅ LOADED

  // Climate (S×R pillar)
  climate: {
    avgLastFrostDoy: number     ❌ NOT LOADED
    avgFirstFrostDoy: number    ❌ NOT LOADED
    frostFreeDays: number       ❌ NOT LOADED
    annualGDD50: number         ❌ NOT LOADED - Critical for timing!
    avgChillHours: number       ❌ NOT LOADED
    avgRainfallInches: number   ❌ NOT LOADED
    growingSeasonDays: number   ❌ NOT LOADED
  }

  // Soil (S pillar)
  typicalSoil: {
    type: string                ✅ LOADED
    drainage: string            ✅ LOADED
    pH: string                  ✅ LOADED
    texture: string             ❌ NOT LOADED
    organicMatter: string       ❌ NOT LOADED
    cec: string                 ❌ NOT LOADED
    minerals: {                 ❌ NOT LOADED
      phosphorus: string
      potassium: string
      calcium: string
      magnesium: string
    }
    naturalMineralization: string  ❌ NOT LOADED
    terroirEffect: string       ✅ LOADED
  }

  // Products
  primaryProducts: string[]     ❌ NOT LOADED as relationships

  // Market
  dtcActivity: string           ✅ LOADED
}
```

**Loaded:** 12 fields
**Missing:** 18+ fields including critical climate (annualGDD50!) and soil minerals

---

## CROP PHENOLOGY (R Pillar)

### TypeScript Interface
```typescript
interface CropPhenology {
  cropId: string                ✅ LOADED
  region: string                ✅ LOADED
  bloomMonth: number            ✅ LOADED
  bloomDay: number              ✅ LOADED
  gddBase: number               ✅ LOADED
  gddToMaturity: number         ✅ LOADED
  gddToPeak: number             ✅ LOADED
  gddWindow: number             ✅ LOADED
  chillHours: number            ❌ NOT LOADED
  source: string                ✅ LOADED
  notes: string                 ❌ NOT LOADED
}
```

**Status:** Mostly loaded (8/11 fields)

---

## CLAIMS (A Pillar) - ENTIRE FILE NOT LOADED

### TypeScript Structure (claims.ts - 1,035 lines)
```typescript
interface Claim {
  id: string
  name: string
  category: ClaimCategory

  // Regulatory perspective
  regulatory: {
    status: RegulatoryStatus
    legalDefinition: string
    loopholes: string[]
    enforcementLevel: string
  }

  // Marketing perspective
  marketing: {
    consumerPerception: string
    commonMisconceptions: string[]
  }

  // Reality (Fielder assessment)
  reality: {
    actualMeaning: string
    nutritionalImpact: string
    shareImplications: {
      s: string  // Soil implications
      h: string  // Heritage implications
      a: string  // Practice implications
      r: string  // Timing implications
      e: string  // Quality implications
    }
  }
}

// 9 major claims defined:
CLAIM_ORGANIC
CLAIM_GRASS_FED
CLAIM_GRASS_FINISHED
CLAIM_PASTURE_RAISED
CLAIM_CAGE_FREE
CLAIM_FREE_RANGE
CLAIM_NATURAL
CLAIM_NO_HORMONES
CLAIM_NO_ANTIBIOTICS
```

**Status:** ❌ COMPLETELY NOT LOADED
**Impact:** No claim→SHARE inference in graph

---

## AGRICULTURAL DEFINITIONS (A Pillar) - NOT LOADED

### TypeScript (agricultural-definitions.ts - 903 lines)

36 farm-to-table term definitions with:
- Legal definition
- Practical reality
- Loopholes
- Fielder requirements
- Consumer takeaways
- Better alternatives

**Status:** ❌ NOT LOADED
**Impact:** Inference logic not available in graph

---

## WHAT WAS ACTUALLY LOADED (Honest Assessment)

### Geographic (S Pillar)
**Loaded:** ✅ Complete hierarchy (regions, counties, cities, soil profiles)
**Missing:** Climate fields (annualGDD50, chill hours), minerals detail

### Cultivars (H Pillar)
**Loaded:** ⚠️ Basic fields (id, name, heritageIntent)
**Missing:** Variety link, Brix ranges, trade names, origin stories, 15+ fields

### Relationships (Cross-Pillar)
**Loaded:** ✅ GROWN_IN (4,614), HAS_PHENOLOGY_IN (28)
**Missing:** Many relationship properties, Variety level

### Entities
**Loaded:** ✅ 21,342 entities
**Missing:** Connections to cultivar/region foundation

### Inference Logic (A Pillar)
**Loaded:** ❌ None
**Missing:** All claim mappings, agricultural definitions

---

## COMPLETE LOADING PLAN (For Next Session)

### Priority 1: Complete Cultivar Fields
Load ALL 20+ fields from Cultivar interface
- Variety links
- Brix ranges (E pillar)
- Trade names (inference)
- Origin stories
- Validated states (S pillar)

### Priority 2: Load Variety Level
Create complete hierarchy:
- ProductType nodes
- Variety nodes (NEW)
- Cultivar → Variety → ProductType links

### Priority 3: Load Claims
Transform claims.ts (1,035 lines) into:
- Claim nodes with regulatory/marketing/reality
- shareImplications connections

### Priority 4: Complete Region Climate
Load climate fields:
- annualGDD50 (critical!)
- Chill hours
- Frost dates
- Rainfall

### Priority 5: Connect Entities
Link 21K entities to:
- Geographic base (city → region)
- Products/cultivars (if product data exists)

---

## HONEST STATUS

**What works:**
- Geographic traversal (city → county → region → soil)
- Basic cultivar×region links
- Query infrastructure

**What's incomplete:**
- Most cultivar fields
- Entire Variety level
- All claim inference logic
- Most region climate data
- Entity connections

**Estimated completion:** 60-80% more work needed

---

**This is the honest assessment you deserve.**

Next session: Systematic field-by-field load, not subset sampling.
