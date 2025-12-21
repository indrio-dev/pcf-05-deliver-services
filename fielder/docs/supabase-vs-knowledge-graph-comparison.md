# Supabase Database vs Knowledge Graph - Structural Comparison

**Date:** 2025-12-21
**Purpose:** Compare Supabase relational database structure with knowledge graph JSON to identify overlaps, gaps, and integration opportunities.

---

## Executive Summary

The Supabase database and knowledge graph serve **different but complementary purposes**:

- **Supabase**: Operational database for real-time farm-to-consumer marketplace (OLTP)
- **Knowledge Graph**: Research dataset and training data for AI pattern learning (OLAP)

**Key Finding:** ~70% conceptual overlap but different modeling approaches. Integration opportunity exists to unify data sources.

---

## Supabase Database Structure

### Tables (9 total)

#### Reference Data (4 tables)
1. **`crops`** (15 rows seeded)
   - Crop types with GDD requirements
   - Base temp, maturity GDD, peak GDD, chill hours
   - Categories: citrus, stone_fruit, pome_fruit, berry, tropical, nut

2. **`cultivars`** (12 rows seeded)
   - Specific varieties within crop types
   - Brix base, timing class (early/mid/late), days offset
   - Links to crops via `crop_id`

3. **`rootstocks`** (12 rows seeded)
   - Rootstock options for perennial crops
   - Brix modifier, vigor (dwarf/semi-dwarf/standard)
   - Links to crops via `crop_id`

4. **`growing_regions`** (21 rows seeded)
   - Geographic regions with climate data
   - Lat/lon, USDA zone, frost dates, annual GDD, chill hours
   - viable_crops array (which crops can grow here)

#### Farm Operations (3 tables)
5. **`farms`**
   - Individual farm profiles
   - Contact info, fulfillment options, admin code
   - Links to growing_regions via `region_id`

6. **`farm_crops`**
   - What each farm grows (join table)
   - Cultivar + rootstock + tree age + acreage
   - Links: farm_id, cultivar_id, rootstock_id

7. **`farm_availability`**
   - Real-time inventory status
   - Status: upcoming, in_season, at_peak, ending_soon, off_season
   - Price per unit, inventory level

#### Computed Data (2 tables)
8. **`crop_phenology`**
   - Bloom dates by cultivar × region
   - Avg bloom day-of-year, variance
   - Used for GDD predictions

9. **`harvest_windows`**
   - Predicted harvest windows by crop × region × year
   - Start/end dates, optimal window, predicted Brix, confidence

#### Daily Predictions (1 table)
10. **`daily_predictions`**
   - Pre-computed daily harvest status for ALL offerings
   - Updated by cron job for fast API queries
   - Denormalized for performance (includes display names, lat/lon)
   - Filters: status, category, region, quality_tier, heritage

### Relationships (Normalized Relational Model)

```
crops (1) ──┬─> (N) cultivars
            └─> (N) rootstocks

growing_regions (1) ──┬─> (N) farms
                      ├─> (N) crop_phenology
                      └─> (N) harvest_windows

farms (1) ──> (N) farm_crops ──> (1) cultivars
                           └─> (1) rootstocks

farm_crops (1) ──> (1) farm_availability
```

### Seeded Data Summary

| Table | Row Count | Coverage |
|-------|-----------|----------|
| crops | 15 | Citrus (5), stone fruit (3), pome (2), berry (2), tropical (2), nut (1) |
| cultivars | 12 | 3 navels, 2 grapefruit, 2 peaches, 2 strawberries, 3 apples |
| rootstocks | 12 | 9 citrus, 3 stone fruit |
| growing_regions | 21 | Florida (5), California (6), Texas (3), other states (7) |

---

## Knowledge Graph Structure

### Entity Types (8 defined, 4 populated)

#### Defined in Schema:
1. **State** - US states with zones
2. **Zone** - USDA hardiness zones (8-11)
3. **Region** - Growing regions within zones
4. **Farm** - Individual farms (NOT YET POPULATED)
5. **Product** - Product types (e.g., "orange", "tomato")
6. **Cultivar** - Specific varieties
7. **PlantingWindow** - Zone-specific planting timing (NOT YET POPULATED)
8. **HarvestWindow** - Zone-specific harvest timing (NOT YET POPULATED)
9. **DataSource** - Origin of timing data
10. **PerennialCrop** - Food Forest perennials with zone compatibility

#### Populated Data:

| Entity Type | Count | Notes |
|-------------|-------|-------|
| **State** | 1 | Florida only |
| **Zone** | 3 | Zones 8, 9, 10 (Florida) |
| **Region** | 0 | Schema exists, not populated |
| **Farm** | 0 | Schema exists, not populated |
| **Product** | ~50 | Inferred from cultivars |
| **Cultivar** | 623 | 2 detailed (Cherokee Purple, Floradade), 621 SeedsNow minimal |
| **PlantingWindow** | 0 | **CRITICAL GAP** |
| **HarvestWindow** | 0 | **CRITICAL GAP** |
| **DataSource** | 6 | FL Dept Ag, UF/IFAS, Burpee, Mary's, LocalHarvest, Food Forest |
| **PerennialCrop** | 377 | Food Forest layer data (canopy, understory, etc.) |

### Relationships (Graph Model)

```
State --HAS_ZONE--> Zone --INCLUDES_REGION--> Region

Farm --LOCATED_IN--> Region
Farm --IN_ZONE--> Zone
Farm --GROWS--> Cultivar

Cultivar --IS_VARIETY_OF--> Product
Cultivar --PLANTED_IN--> PlantingWindow (MISSING)
Cultivar --HARVESTED_IN--> HarvestWindow (MISSING)

DataSource --VALIDATES--> (Planting|Harvest)Window
DataSource --TRIANGULATES_WITH--> DataSource

Zone + Cultivar --PREDICTS--> HarvestWindow

PerennialCrop --GROWS_IN_ZONE--> Zone
PerennialCrop --COMPLEMENTS--> Cultivar
```

### Sample Cultivar Structure (Graph)

```json
{
  "id": "cultivar:cherokee_purple",
  "type": "Cultivar",
  "name": "Cherokee Purple",
  "product": "tomato",
  "heritageIntent": "true_heritage",
  "origin": "Tennessee (Cherokee Nation heritage)",
  "attributes": {
    "type": "indeterminate",
    "fruitSize": "8-12 oz",
    "flavor": "Rich, smoky, sweet"
  },
  "growingRequirements": {
    "daysToMaturity": {
      "burpee": 80,
      "johnnys": 72,
      "marys": 85,
      "consensus": 80
    },
    "gddRequirement": 2800
  },
  "sources": ["burpee", "johnnys", "marys"]
}
```

---

## Comparison Matrix

### What Supabase Has That Graph Doesn't

| Feature | Supabase | Graph | Gap Severity |
|---------|----------|-------|--------------|
| **Rootstock data** | ✅ 12 rootstocks with Brix modifiers | ❌ Not present | HIGH |
| **Farm entities** | ✅ Schema + operations ready | ❌ Schema defined but 0 populated | HIGH |
| **Availability status** | ✅ Real-time inventory | ❌ Not applicable (research data) | Medium |
| **Crop phenology** | ✅ Bloom dates by region | ❌ Not present | HIGH |
| **Computed predictions** | ✅ harvest_windows, daily_predictions | ❌ Not present | Medium |
| **Normalized structure** | ✅ Relational integrity | ❌ Flat JSON entities | Low (by design) |
| **Geographic precision** | ✅ Lat/lon coordinates | ✅ Has lat/lon | Equal |

### What Graph Has That Supabase Doesn't

| Feature | Graph | Supabase | Gap Severity |
|---------|-------|----------|--------------|
| **Volume of cultivars** | ✅ 623 cultivars | ❌ 12 cultivars | **CRITICAL** |
| **Data source tracking** | ✅ 6 sources with triangulation | ❌ Not tracked | HIGH |
| **Heritage classification** | ✅ heritageIntent taxonomy | ❌ Not captured | HIGH |
| **Perennial crops** | ✅ 377 Food Forest species | ❌ Not present | Medium |
| **Multi-source validation** | ✅ Consensus mechanism (3+ sources) | ❌ Single-source | HIGH |
| **Research provenance** | ✅ Tracks where data came from | ❌ Not tracked | HIGH |
| **PlantingWindow entities** | ✅ Schema defined | ❌ Not in schema | **CRITICAL** |
| **HarvestWindow entities** | ✅ Schema defined | ❌ harvest_windows exists (similar) | Medium |

### Overlapping Concepts (Different Models)

| Concept | Supabase Model | Graph Model | Difference |
|---------|----------------|-------------|------------|
| **Cultivar** | Normalized table, 12 rows, crop_id FK | Flat entities, 623 entries | Graph has 50x more data |
| **Region** | growing_regions table, 21 rows, normalized | Zone entity, 3 populated | Supabase more detailed |
| **GDD Requirements** | In crops table (baseTemp, gddToMaturity) | In cultivar.growingRequirements | Supabase at crop level, graph at cultivar |
| **Harvest Window** | harvest_windows table (crop × region × year) | HarvestWindow entity type (0 populated) | Supabase operational, graph structural |
| **Product Type** | Crop with category field | Product entity (~50 inferred) | Similar concept, different granularity |

---

## SHARE Pillar Coverage Comparison

### Supabase SHARE Coverage

| Pillar | Coverage | Details |
|--------|----------|---------|
| **S (Soil)** | ✅ Partial | growing_regions has lat/lon, zones, BUT missing typicalSoil |
| **H (Heritage)** | ❌ Missing | No heritage classification, brix_base exists but not heritageIntent |
| **A (Agricultural)** | ❌ Missing | No farm practices data (fertility, pest management) |
| **R (Ripen)** | ✅ Strong | GDD in crops, bloom dates in phenology, harvest_windows computed |
| **E (Enrich)** | ✅ Partial | Brix prediction in harvest_windows, but no actual measurements |

### Knowledge Graph SHARE Coverage

| Pillar | Coverage | Details |
|--------|----------|---------|
| **S (Soil)** | ❌ Missing | Zone defined, Region schema exists but not populated with typicalSoil |
| **H (Heritage)** | ✅ Strong | heritageIntent, origin, flavorProfile, 623 cultivars |
| **A (Agricultural)** | ❌ Missing | Farm schema exists but 0 farms populated |
| **R (Ripen)** | ⚠️ Partial | GDD in some cultivars, PlantingWindow/HarvestWindow schema but 0 populated |
| **E (Enrich)** | ❌ Missing | No Brix measurements, no verification data |

---

## Integration Opportunities

### 1. Merge Cultivar Data (HIGH PRIORITY)

**Problem:** Graph has 623 cultivars (SeedsNow), Supabase has 12 detailed cultivars

**Solution:**
1. Export enhanced cultivars from products.ts (112 detailed)
2. Merge into knowledge graph (Phase 1 already complete)
3. Import into Supabase cultivars table
4. Result: Supabase gets 100+ production-ready cultivars

**Impact:** Supabase becomes usable for real marketplace operations

### 2. Add PlantingWindow/HarvestWindow to Both (CRITICAL)

**Problem:** Graph schema exists but 0 populated. Supabase has harvest_windows but not planting.

**Solution:**
1. Generate PlantingWindow entities in graph (Phase 4)
2. Generate HarvestWindow entities in graph (Phase 4)
3. Create Supabase table `planting_windows` (mirror structure)
4. Sync computed windows to both systems

**Impact:** Enables "What's at peak near me?" queries in both systems

### 3. Add Rootstock Data to Graph (HIGH PRIORITY)

**Problem:** Supabase has 12 rootstocks with Brix modifiers, graph has NONE

**Solution:**
1. Export Supabase rootstocks
2. Create Rootstock entity type in graph
3. Add relationships: Cultivar --GRAFTED_ON--> Rootstock
4. Enhance H pillar with rootstock genetic modifiers

**Impact:** More accurate Brix predictions in graph

### 4. Add Data Source Tracking to Supabase (MEDIUM)

**Problem:** Supabase doesn't track where data came from (provenance)

**Solution:**
1. Add `data_sources` table
2. Add `source_id` FK to crops, cultivars, regions tables
3. Track research provenance for data quality

**Impact:** Enables data validation and triangulation in operational system

### 5. Sync Farm Data Bi-Directionally (FUTURE)

**Problem:** Supabase has farm operations schema, graph has Farm entity schema (both empty)

**Solution:**
1. When farms added to Supabase (marketplace operations)
2. Export to knowledge graph (research dataset)
3. Graph learns patterns from real farm data
4. Predictions improve both systems

**Impact:** Operational data feeds research, research improves operations

### 6. Unify GDD Enhancements (IMMEDIATE)

**Problem:** New GDD enhancements (maxTemp, plantingMethod, transplantAge) not in Supabase

**Solution:**
1. Add columns to Supabase crops table:
   - `max_temp DECIMAL(5,2)`
   - `planting_method TEXT CHECK (planting_method IN ('direct_seed', 'transplant', 'either'))`
   - `transplant_age INTEGER`
2. Backfill from gdd-targets.ts
3. Update prediction engine to use modified 86/50 method

**Impact:** Florida summer predictions become accurate in production system

---

## Data Model Philosophy Differences

### Supabase (Relational/Normalized)

**Strengths:**
- Referential integrity (foreign keys)
- Efficient updates (change once, reflects everywhere)
- Query performance (indexed joins)
- Production-ready (ACID transactions)

**Weaknesses:**
- Complex joins for deep relationships
- Harder to version/snapshot
- Schema changes require migrations

**Use Case:** Operational marketplace (OLTP - Online Transaction Processing)

### Knowledge Graph (Denormalized/Flexible)

**Strengths:**
- Flexible schema (add attributes anytime)
- Easy to version (snapshot entire graph)
- Natural for AI training (embedding-friendly)
- Research-friendly (explore relationships)

**Weaknesses:**
- No referential integrity (can have dangling references)
- Data duplication (cultivar attributes repeated)
- Update complexity (change one thing → update many entities)

**Use Case:** Research dataset, AI training, pattern learning (OLAP - Online Analytical Processing)

---

## Recommended Integration Architecture

### Two-System Strategy (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│                   KNOWLEDGE GRAPH                        │
│                  (Research & Training)                   │
│                                                          │
│  - 623 cultivars (SeedsNow + enhanced)                  │
│  - 377 perennial crops                                  │
│  - Data source triangulation                            │
│  - PlantingWindow / HarvestWindow entities              │
│  - Pattern learning for new states                      │
│                                                          │
└────────────────────┬───────────────────────────────────┘
                     │
                     │ ETL Pipeline (Sync)
                     │ - Export enhanced cultivars
                     │ - Computed windows
                     │ - Research findings
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                      │
│                (Production Operations)                   │
│                                                          │
│  - Farm profiles & inventory                            │
│  - Real-time availability                               │
│  - Daily predictions (cached)                           │
│  - Consumer API queries                                 │
│  - Marketplace transactions                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Sync Strategy

**Weekly:**
- Export new cultivars from graph → Import to Supabase
- Export rootstocks from Supabase → Import to graph
- Sync GDD enhancements bidirectionally

**Daily:**
- Compute predictions using graph patterns
- Update Supabase daily_predictions table
- Cache for fast API queries

**Real-time:**
- Farm updates only in Supabase (operational)
- Periodic export to graph for research

---

## Migration Path

### Phase 1: Merge Cultivar Data ✅ (DONE)
- Enhanced 112 cultivars with GDD data
- Ready to import to Supabase

### Phase 2: Add GDD Enhancements to Supabase (NEXT)
- Add maxTemp, plantingMethod, transplantAge columns to crops table
- Backfill from gdd-targets.ts (55 crop types)
- Update prediction engine

### Phase 3: Generate Timing Windows
- Create PlantingWindow/HarvestWindow entities in graph
- Add planting_windows table to Supabase
- Sync computed windows

### Phase 4: Add Rootstocks to Graph
- Export 12 rootstocks from Supabase
- Create Rootstock entity type
- Link to cultivars

### Phase 5: Sync Production Data
- ETL pipeline: Graph → Supabase (weekly)
- Operational data: Supabase → Graph (periodic)
- Unified SHARE data model

---

## Key Metrics

| Metric | Supabase | Graph | Integration Target |
|--------|----------|-------|-------------------|
| **Cultivars** | 12 | 623 | 700+ (merge both) |
| **Regions** | 21 | 0 | 121 (from growing-regions.ts) |
| **Zones** | Implicit | 3 | 11 (all FL zones + expand) |
| **Farms** | 0 | 0 | 50+ (marketplace launch) |
| **PlantingWindows** | 0 | 0 | 5,000+ (cultivar × zone) |
| **HarvestWindows** | 0 (table exists) | 0 | 5,000+ (cultivar × zone) |
| **Rootstocks** | 12 | 0 | 20+ (expand both) |

---

## Conclusion

**Current State:**
- Supabase: Production-ready operational database with minimal data (15 crops, 12 cultivars)
- Knowledge Graph: Research dataset with extensive cultivar catalog (623) but missing timing data

**Gap Analysis:**
- Supabase needs MORE DATA (cultivars, windows) from graph
- Graph needs MORE STRUCTURE (rootstocks, phenology) from Supabase
- Both need PlantingWindow/HarvestWindow populated

**Integration Value:**
- Combining both → 700+ cultivars with complete SHARE data
- Graph patterns → Supabase predictions (daily_predictions table)
- Operational data → Graph research (learning from real farms)

**Next Steps:**
1. ✅ Cultivar reconciliation (DONE - Phase 1)
2. ⬜ Add GDD enhancements to Supabase schema
3. ⬜ Generate timing windows (both systems)
4. ⬜ ETL pipeline for ongoing sync
5. ⬜ Unified SHARE data model across both

The systems are **complementary, not redundant**. Integration creates a virtuous cycle: research informs operations, operations validate research.
