# Knowledge Graph - Intended Structure (Based on Code)

**Date:** 2025-12-21
**Purpose:** Map the knowledge graph structure INTENDED by products.ts and Supabase schema, not what's currently in the JSON.

---

## The Core Insight: RegionalOffering = Cultivar × Region

The key data structure in your code is **RegionalOffering**:

```typescript
interface RegionalOffering {
  id: string                // `${cultivarId}_${regionId}`
  cultivarId: string        // WHAT is grown
  regionId: string          // WHERE it's grown

  // S (Soil) - Region brings this
  soil?: SoilProfile
  terroirNotes?: string

  // H (Heritage) - Cultivar brings this
  // (inherited from cultivar.heritageIntent, isNonGmo, etc.)

  // A (Agricultural) - Farm/offering brings this
  practices?: AgriculturalPractices
  isOrganic?: boolean
  pestManagement?: string

  // R (Ripen) - Region-specific timing
  gddToMaturityOverride?: number
  peakMonthsOverride?: number[]
  availableMonths?: number[]

  // E (Enrich) - Expected quality
  qualityTier?: 'exceptional' | 'excellent' | 'good'
  flavorNotes?: string
}
```

**This IS the SHARE framework in action**: Cultivar (H) + Region (S) + Practices (A) → Timing (R) → Quality (E)

---

## Graph Structure (Intended)

### Entity Types

```
State
  ↓ HAS_ZONE
Zone
  ↓ INCLUDES_REGION
Region
  ↓ LOCATED_IN
Farm
  ↓ GROWS (with practices)
RegionalOffering ← The KEY entity
  = Cultivar × Region × (optional Farm/practices)
  ↓ HAS_PLANTING_WINDOW
PlantingWindow
  ↓ LEADS_TO
HarvestWindow
  ↓ PRODUCES
QualityMeasurement (E pillar)
```

### Relationships (The Data Structure)

```
┌─────────────────────────────────────────────────────────────────┐
│                     GEOGRAPHIC HIERARCHY                        │
└─────────────────────────────────────────────────────────────────┘

State --HAS_ZONE--> Zone --INCLUDES_REGION--> Region

Region has:
  - typicalSoil (S pillar)
  - avgDailyGDD (R pillar input)
  - zones (climate)
  - lat/lon


┌─────────────────────────────────────────────────────────────────┐
│                     GENETIC HIERARCHY                           │
└─────────────────────────────────────────────────────────────────┘

ProductType --HAS_VARIETY--> Variety --HAS_CULTIVAR--> Cultivar

Cultivar has:
  - heritageIntent (H pillar)
  - flavorProfile (H pillar)
  - baseTemp, gddToMaturity (R pillar baseline)
  - brixRange (E pillar potential)

Cultivar --GRAFTED_ON--> Rootstock (modifies H pillar)


┌─────────────────────────────────────────────────────────────────┐
│         THE KEY RELATIONSHIP: REGIONAL OFFERING                 │
└─────────────────────────────────────────────────────────────────┘

Cultivar + Region = RegionalOffering

RegionalOffering {
  FROM Cultivar:     H pillar (genetics, heritage)
  FROM Region:       S pillar (soil, climate)
  FROM Farm:         A pillar (practices) [optional]
  COMPUTED:          R pillar (timing windows)
  MEASURED:          E pillar (quality outcomes)
}

This is NOT a simple join - it's where SHARE comes together:
  - Region soil + Cultivar genetics → Expected quality potential
  - Region GDD + Cultivar requirements → Timing windows
  - Farm practices + Environment → Actual outcomes


┌─────────────────────────────────────────────────────────────────┐
│                     TEMPORAL RELATIONSHIPS                      │
└─────────────────────────────────────────────────────────────────┘

RegionalOffering --HAS_PLANTING_WINDOW--> PlantingWindow
  - Computed from: Zone frost dates + Cultivar GDD requirements
  - startMonth, endMonth, method (direct_seed vs transplant)

RegionalOffering --HAS_HARVEST_WINDOW--> HarvestWindow
  - Computed from: PlantingWindow + GDD accumulation
  - startMonth, endMonth, peakMonths
  - This is CRITICAL for "What's at peak near me?"


┌─────────────────────────────────────────────────────────────────┐
│                     FARM RELATIONSHIPS                          │
└─────────────────────────────────────────────────────────────────┘

Farm --LOCATED_IN--> Region
Farm --GROWS--> RegionalOffering
  - With: rootstock, treeAge, acreage (from farm_crops)

FarmOffering (specific instance) {
  farm: Farm
  offering: RegionalOffering
  rootstock: Rootstock
  treeAge: number
  practices: AgriculturalPractices  ← A pillar
  availability: Status               ← Real-time
}


┌─────────────────────────────────────────────────────────────────┐
│              MEASUREMENT RELATIONSHIPS (E PILLAR)               │
└─────────────────────────────────────────────────────────────────┘

RegionalOffering --HAS_PREDICTION--> QualityPrediction
  - Expected Brix, quality tier
  - Confidence level
  - Based on: S + H + A + R

FarmOffering --HAS_ACTUAL--> QualityMeasurement
  - Measured Brix, omega ratio, etc.
  - Date of measurement
  - Lab name (if lab-tested)

Prediction + Actual = Calibration
  - Prediction vs actual delta
  - Improves future predictions
  - THIS is the moat (can't be synthesized)
```

---

## Supabase Schema Mirrors This

Looking at Supabase with this understanding:

### crop_phenology table
```sql
cultivar_id × region_id → avg_bloom_doy
```
**This IS the RegionalOffering temporal relationship**
- Same cultivar blooms on different dates in different regions
- This is R pillar (timing) driven by S pillar (region climate)

### farm_crops table
```sql
farm_id × cultivar_id × rootstock_id → FarmOffering
```
**This IS how farms connect to RegionalOfferings**
- Farm grows specific cultivar in their region
- With rootstock (modifies H), tree age (affects R)
- This adds A pillar (farm practices)

### harvest_windows table
```sql
crop_id × region_id × year → predicted timing
```
**This IS the computed HarvestWindow**
- Not just "oranges are in season Dec-Feb"
- But "Washington Navels in Indian River peak Dec 15-Jan 15 THIS YEAR"

---

## What This Means for the Graph

### Current Graph (What I Was Looking At)
```json
{
  "cultivar:cherokee_purple": {
    "type": "Cultivar",
    "name": "Cherokee Purple",
    "gddRequirement": 2800,
    "sources": ["burpee", "johnnys"]
  }
}
```
**This is FLAT data** - just attributes on entities.

### Intended Graph (What the Code Defines)
```json
{
  "offering:cherokee_purple_zone10": {
    "type": "RegionalOffering",
    "cultivar": "cherokee_purple",
    "region": "zone10",

    "h_pillar": {
      "heritageIntent": "true_heritage",
      "flavorProfile": "Rich, smoky, sweet",
      "brixRange": [6, 8]
    },

    "s_pillar": {
      "region": "Zone 10 (South Florida)",
      "typicalSoil": "Sandy loam",
      "avgDailyGDD": 25
    },

    "r_pillar": {
      "plantingWindow": {
        "startMonth": "Aug",
        "endMonth": "Sep",
        "method": "transplant"
      },
      "harvestWindow": {
        "startMonth": "Nov",
        "endMonth": "Jun",
        "peakMonths": ["Dec", "Jan", "Feb", "Mar"]
      }
    },

    "e_pillar": {
      "expectedQualityTier": "excellent",
      "expectedBrix": 7.5,
      "confidence": 0.85
    }
  }
}
```

**This is RELATIONAL data** - shows how SHARE pillars connect.

---

## The 4,626 RegionalOfferings

Your code generates **4,626 RegionalOffering combinations**:
- 112 cultivars × ~40 compatible regions (filtered by validatedStates)

Each RegionalOffering represents:
- **WHERE** that cultivar can be grown (geographic compatibility)
- **WHEN** it can be planted/harvested (temporal relationships)
- **WHAT** quality to expect (terroir effects)

This is NOT about counting cultivars - it's about modeling **Cultivar × Region combinations**.

---

## What the Graph Should Contain (Structure)

### Level 1: Entities (Current Focus - Partially Done)
- [x] State (1 Florida)
- [x] Zone (3: 8, 9, 10)
- [ ] Region (0 - should be ~20 from growing-regions.ts)
- [x] Cultivar (623 - but need enhanced with SHARE data)
- [ ] Rootstock (0 - should be 12 from Supabase)
- [ ] Farm (0 - will populate as marketplace launches)

### Level 2: Relationships (CRITICAL - Not Done)
- [ ] **RegionalOffering** (0 - should be 4,626+)
  - THIS is the key entity where SHARE comes together
- [ ] PlantingWindow (0 - should be thousands)
- [ ] HarvestWindow (0 - should be thousands)
- [ ] SoilProfile per region (0)
- [ ] AgriculturalPractices per farm (0)

### Level 3: Measurements (Future - E Pillar)
- [ ] QualityPrediction (expected outcomes)
- [ ] QualityMeasurement (actual outcomes)
- [ ] Calibration (prediction vs actual)

---

## Integration Path (Corrected Understanding)

### Phase 1: Entity Population ✅ (Mostly Done)
- Enhanced cultivars with H + R pillar data
- Ready to add to graph

### Phase 2: Add Core Relationships (NEXT)
- **RegionalOffering entities** (4,626+)
  - Cultivar × Region combinations
  - This is WHERE SHARE pillars connect
- **Region entities** with typicalSoil (S pillar)
- **Rootstock entities** (H pillar modifiers)

### Phase 3: Add Temporal Relationships (CRITICAL)
- **PlantingWindow** for each RegionalOffering
- **HarvestWindow** for each RegionalOffering
- Relationships: RegionalOffering → PlantingWindow → HarvestWindow

### Phase 4: Add Farm Relationships (As Marketplace Grows)
- **Farm entities** (real farms)
- **FarmOffering** = Farm × RegionalOffering (adds A pillar)
- **Availability status** (real-time inventory)

### Phase 5: Add Measurement Relationships (E Pillar)
- **Predictions** on RegionalOfferings
- **Actual measurements** from FarmOfferings
- **Calibration** (prediction vs actual → improves model)

---

## Key Insight

The graph is NOT about storing flat cultivar data.

The graph is about modeling **HOW cultivars, regions, farms, and timing interact to produce quality**.

**RegionalOffering = Cultivar × Region** is the KEY entity where SHARE framework operates.

Your code already defines this structure:
- `RegionalOffering` interface in products.ts
- `crop_phenology` table in Supabase (Cultivar × Region bloom dates)
- `farm_crops` table in Supabase (Farm × Cultivar × Rootstock)

The knowledge graph should MODEL these relationships, not just list entities.

---

## What I Missed

I was comparing:
- "Graph has 623 cultivars, Supabase has 12"

I should have been analyzing:
- "Graph should model RegionalOffering (Cultivar × Region) relationships"
- "Graph should connect SHARE pillars through relationships, not just store attributes"
- "The 4,626 offerings ARE the data structure"

The number of cultivars doesn't matter. The RELATIONSHIPS between cultivars, regions, timing, and quality matter.

That's what your code is building. That's what the graph should represent.
