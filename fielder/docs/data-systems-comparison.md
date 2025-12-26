# Fielder Data Systems - Comprehensive Comparison

**Date:** 2025-12-22
**Purpose:** Reconcile what exists in Neo4j Graph, Supabase DB, and TypeScript Constants

---

## GEOGRAPHIC DATA

### Growing Regions

| System | Count | Fields | Rich Data? | Source |
|--------|-------|--------|------------|--------|
| **TypeScript** | 119 regions | id, name, state, counties[], cities[], lat/lon, climate (frost, GDD, chill hours), **typicalSoil (drainage, pH, minerals, terroir)**, primaryProducts[], dtcActivity | ✅ YES - Most sophisticated | Hand-curated |
| **Supabase** | 21 regions | id, name, state, lat/lon, usda_zone, frost dates, annual_gdd_50, avg_chill_hours, viable_crops[] | ⚠️ PARTIAL - Climate data, no soil | Seeded from subset |
| **Neo4j** | 27 regions | All Supabase fields (16 imported) + simple fields from seed script (11 basic) | ⚠️ MIXED - Has Supabase data but missing 98 TypeScript regions | 16 from SB import, 11 from seed |

**Status:** **FRAGMENTED** - Richest data (119 TypeScript) not in databases

---

### States, Counties, Cities

| System | States | Counties | Cities | Details |
|--------|--------|----------|--------|---------|
| **TypeScript** | 50 | ~500+ (in region.counties[]) | ~1000+ (in region.primaryCities[]) | Embedded in region objects |
| **Supabase** | Via region.state | None | None | Only state codes in regions |
| **Neo4j** | 50 (State nodes) | 0 (not seeded) | 0 (not seeded) | States seeded, counties/cities planned but not created |

**Status:** TypeScript has hierarchical data, databases only have states

---

### USDA Hardiness Zones

| System | Count | Data |
|--------|-------|------|
| **TypeScript** | 18 zones (3a-11b) | minTempF, maxTempF, typicalChillHours, growingSeasonDays, suitableCrops[] |
| **Supabase** | Embedded in regions (usda_zone field) | Single zone per region |
| **Neo4j** | 18 (USDAZone nodes) | Full data, linked to regions via TYPICALLY_IN_ZONE |

**Status:** Neo4j has full zone structure, Supabase has simplified

---

## CROP/CULTIVAR DATA

### Crops

| System | Count | Fields | Notes |
|--------|-------|--------|-------|
| **TypeScript** | ~20 (in gdd-targets.ts, crop-phenology.ts) | base_temp, gdd_to_maturity, gdd_to_peak, gdd_window | Multiple constants files |
| **Supabase** | 15 rows | Same fields in `crops` table | Seeded subset |
| **Neo4j** | 18 (ProductType nodes) | Basic fields | From seed-crops.ts |

**Status:** Similar counts, TypeScript has most comprehensive phenology

---

### Cultivars

| System | Count | Fields | Rich Data? |
|--------|-------|--------|------------|
| **TypeScript** | ~500+ (in products.ts) | name, heritageIntent, brixRange, flavorProfile, originStory, isNonGmo, etc. | ✅ YES - Full SHARE H pillar |
| **Supabase** | 12 rows | id, crop_id, name, brix_base, timing_class | ⚠️ MINIMAL - Subset only |
| **Neo4j** | 49 (Cultivar nodes) | name, productType, heritageIntent, brixBase, gddToPeak, gddToMaturity | ⚠️ PARTIAL - From seed script |

**Status:** **MASSIVE GAP** - TypeScript has 500, databases have ~50

---

### Rootstocks

| System | Count | Data |
|--------|-------|------|
| **TypeScript** | 12 (in rootstocks.ts) | name, brixModifier, vigor, compatibility |
| **Supabase** | 12 rows | Same fields | Seeded |
| **Neo4j** | 16 (Rootstock nodes) | Imported from Supabase + extras | Mixed |

**Status:** Roughly aligned

---

## PHENOLOGY & TIMING

### Crop Phenology (Bloom dates, GDD windows)

| System | Entries | Data Structure |
|--------|---------|----------------|
| **TypeScript** | 28 (crop-phenology.ts) | cropId, region, bloomMonth/Day, gddBase, gddToMaturity, gddToPeak, gddWindow, source, notes |
| **Supabase** | 21 (harvest_windows table) | crop_id, region_id, year, harvest_start/end, optimal_start/end, predicted_brix |
| **Neo4j** | 0 (HarvestWindow nodes not seeded) | Structure exists but empty |

**Status:** TypeScript is definitive source, Supabase has some, Neo4j is empty

---

## ENTITY DATA (Farms, Growers, Packinghouses)

### Farms/Entities

| System | Count | Data | Notes |
|--------|-------|------|-------|
| **TypeScript** | ~300 (in seed-entities.ts before tonight) | Full SHARE data, manually curated, rich attributes | Original research |
| **Supabase** | 0 rows (`farms` table empty) | Schema exists but not populated | Never seeded |
| **Neo4j** | 21,342 (Entity nodes) | 634 curated + 20,708 from USDA tonight | Loaded tonight |

**Status:** Neo4j has entities, Supabase has ZERO, TypeScript has curated subset

---

## PREDICTIONS & MEASUREMENTS

### Predictions

| System | Where | Status |
|--------|-------|--------|
| **TypeScript** | Orchestrator generates | Live calculations |
| **Supabase** | `predictions` table (0 rows) | Schema ready, no data yet |
| **Neo4j** | Not applicable | Graph doesn't store predictions |

**Status:** Predictions calculated but not persisted anywhere

---

### Actuals (Measurements)

| System | Where | Status |
|--------|-------|--------|
| **Supabase** | `actuals` table (0 rows) | Schema ready, waiting for measurements |
| **Neo4j** | Measurement nodes (not seeded) | Structure exists, empty |

**Status:** Both systems ready but no measurement data exists

---

## SUMMARY: WHERE THE RICHEST DATA LIVES

### TypeScript Constants (src/lib/constants/)
**Most Comprehensive:**
- ✅ 119 growing regions (with soil profiles, counties, cities)
- ✅ 28 crop-phenology entries (bloom dates, GDD windows)
- ✅ 500+ cultivars (with SHARE attributes)
- ✅ ~300 curated entities
- ✅ All SHARE logic, inference chains

**This is the PRODUCTION data the app actually uses.**

### Supabase (Database)
**Partial Production:**
- ⚠️ 21 regions (subset of TypeScript's 119)
- ⚠️ 15 crops, 12 cultivars (minimal subset)
- ✅ Schema for predictions, actuals, calibrations (ready but empty)
- ❌ 0 farms/entities (schema exists but not populated)

**Built for production serving but minimally populated.**

### Neo4j (Knowledge Graph - Built Tonight)
**Large but Sparse:**
- ✅ 21,342 entities (15K growers, 790 packinghouses, 20K retailers)
- ⚠️ 16 regions from Supabase + 11 simple regions
- ⚠️ 49 cultivars (from seed script)
- ❌ 95% entities lack products
- ❌ Missing 119 TypeScript regions
- ❌ Missing 500 TypeScript cultivars
- ❌ Harvest windows empty

**Has quantity (21K entities) but lacks quality (SHARE data).**

---

## THE DISCONNECT

**The Problem:**
1. **TypeScript has all the RICH data** (119 regions, 500 cultivars, soil profiles, phenology)
2. **Supabase has MINIMAL data** (21 regions, 12 cultivars)
3. **Neo4j has ENTITIES** (21K) but lacks the rich reference data
4. **They don't talk to each other**

**The app works** because it uses TypeScript constants directly (not databases).

**The graph is sparse** because it doesn't have the TypeScript data loaded.

**Supabase is under-populated** because most data lives in TypeScript.

---

## WHAT NEEDS TO HAPPEN

**Option A: Consolidate on Supabase + Neo4j**
1. Load all 119 TypeScript regions → Supabase
2. Load all 500 TypeScript cultivars → Supabase
3. Re-import Supabase → Neo4j (now gets rich data)
4. Connect 21K entities to enriched reference data

**Option B: Keep TypeScript as Source of Truth**
1. Load TypeScript regions/cultivars → Neo4j directly
2. Connect 21K entities to TypeScript data
3. Keep Supabase minimal (just predictions/actuals)

**Option C: Rethink Architecture**
- Why three systems? What's each for?
- Can we consolidate?

**The real question:** What was the INTENDED architecture before I added the graph tonight?

Were you planning to eventually migrate TypeScript → Supabase → Neo4j?
Or keep them separate for different purposes?
