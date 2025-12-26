# Fielder Comprehensive System Analysis

**Date:** December 22, 2025, 9:00 AM
**Purpose:** Complete audit of all data systems to determine integration path
**Validated Vision:** Fielder = Google Nearby for Peak Produce (geolocated, time-sensitive discovery)

---

## PART 1: WHAT THE APP NEEDS (From Code Analysis)

### Core User Flow (Primary Use Case)

```
Consumer: "What's at peak near Orlando, FL today?"

App Logic (from /api/predict and quality-predictor.ts):
1. User location → Nearby regions (Indian River, Central FL)
2. Current date → Month 12 (December)
3. For each region:
   - Fetch weather → Calculate current GDD
   - Load phenology: getCropPhenology(crop, region)
   - Check: current GDD in [gddToPeak - window, gddToPeak + window]?
   - Filter: Only show if at optimal GDD
4. Return: Products at peak with distance/quality

Consumer sees:
  "Washington Navel - Indian River (60 mi) - AT PEAK"
  "Strawberries - Plant City (40 mi) - AT PEAK"
```

### Required Data (What App Queries)

**From code in /api/predict/route.ts:**
```typescript
1. getRegion(regionId) → GrowingRegion with lat/lon, climate, soil
2. getCropPhenology(crop, region) → bloom date, gddBase, gddToPeak, gddWindow
3. weatherService.getGddAccumulation() → current GDD
4. predictQuality() → Brix, quality tier, confidence
```

**Data Dependencies:**
- **Growing regions** (119 in TypeScript, 21 in Supabase, 27 in Neo4j)
- **Crop phenology** (28 entries in TypeScript, 21 in Supabase, 0 in Neo4j)
- **Cultivar attributes** (500 in TypeScript, 12 in Supabase, 49 in Neo4j)
- **Real-time weather** (API call, not stored)

---

## PART 2: WHAT EXISTS WHERE (Systematic Audit)

### TypeScript Constants (src/lib/constants/)

**File: growing-regions.ts (2,433 lines)**
- **119 regions** across US
- Structure: `GrowingRegionExtended`
  - counties[], primaryCities[]
  - lat/lon (for weather API)
  - climate: frost dates, GDD, chill hours
  - **typicalSoil: type, drainage, pH, minerals, terroirEffect** (S pillar!)
  - primaryProducts[]
  - dtcActivity level
- **This is what the app uses** (via getRegion())

**File: crop-phenology.ts (617 lines)**
- **28 crop × region entries**
- Structure: `CropPhenology`
  - bloomMonth, bloomDay
  - gddBase, gddToMaturity, gddToPeak, gddWindow
  - source (UF/IFAS, UC Davis, etc.)
- Examples:
  - FL navel: bloom Mar 15, gddToPeak 6100, window Oct-May
  - TX grapefruit: bloom Mar 1, gddToPeak 8500, window Oct-Mar
- **This is THE definitive source** (app calls getCropPhenology())

**File: products.ts (2,322 lines)**
- **~500 cultivars** with full SHARE attributes
- heritageIntent, brixRange, flavorProfile, isNonGmo
- Category → Subcategory → ProductType → Variety → Cultivar hierarchy

**File: regional-distributions.ts (1,096 lines)**
- Cultivar market share by region
- `RegionalCultivarDistribution` interface exists
- INCOMPLETE (needs population)

---

### Supabase Database

**Populated Tables:**
| Table | Rows | Data |
|-------|------|------|
| crops | 15 | Crop types with GDD params |
| cultivars | 12 | Subset: 3 navels, 2 grapefruit, etc. |
| rootstocks | 12 | Brix modifiers |
| growing_regions | 21 | Subset with climate data |
| harvest_windows | 21 | Computed windows |
| nutrients | 107 | Lab test reference |
| gdd_version_performance | 3 | Tonight's enhancement |
| regional_practice_priors | 12 | Tonight's enhancement |
| terminal_market_reports | 0 | Tonight's enhancement (schema only) |

**Empty Tables (Schema Only):**
| Table | Purpose | Status |
|-------|---------|--------|
| farms | Farm profiles | 0 rows - never populated |
| farm_crops | What farms grow | 0 rows |
| farm_availability | Real-time status | 0 rows |
| predictions | Prediction history | 0 rows |
| actuals | Measurements | 0 rows |
| regional_calibrations | Accuracy improvements | 0 rows |

**Supabase Status:** Schema complete, minimally populated reference data, operational tables empty

---

### Neo4j Knowledge Graph

**Populated Tonight:**
| Node Type | Count | Source |
|-----------|-------|--------|
| Entity | 21,342 | 634 curated + 20,708 USDA |
| - Grower | 15,038 | LocalHarvest, USDA CSA/agritourism |
| - Packinghouse | 790 | Agent swarm + prior research |
| - Retailer | 20,693 | USDA markets, multi-farm CSAs |
| State | 50 | Seed script |
| GrowingRegion | 27 | 16 from Supabase + 11 seed |
| USDAZone | 18 | Seed script |
| ProductType | 18 | Seed script |
| Cultivar | 49 | Seed script |
| Rootstock | 16 | Seed script |

**Key Relationships:**
- Entity → State: 21,342 (all entities)
- Entity → GrowingRegion: 157 (0.7% - mostly unmapped)
- Entity → ProductType: 1,781 (8% - from product arrays)

**Neo4j Status:** Large entity catalog but sparse SHARE connections

---

### Research Data (data/research/)

**Extension Service Data:**
| File | Size | Content |
|------|------|---------|
| extension-ufifas-florida-cultivars.json | 39KB | UF/IFAS cultivar timing by season/region |
| extension-cornell-cultivars.json | 17KB | Cornell variety recommendations |
| extension-validation-results.json | 5KB | Validation comparisons |

**Seed Company Data:**
| File | Size | Content |
|------|------|---------|
| seed-company-burpee-florida.json | 23KB | Cultivar timing for FL zones |
| seed-company-johnnys-florida.json | 13KB | Same |
| seed-company-marys-florida.json | 21KB | Heirloom varieties |
| seed-company-seedsnow-zone10.json | 860KB | 621 cultivars with zones |

**Farm Data:**
| File | Size | Content |
|------|------|---------|
| localharvest-farms.json | 169KB | 266 farms with productsAndSeasons |
| florida-farms-collection.json | 19KB | Farm details |

**Integrated Knowledge Graph:**
| File | Size | Content |
|------|------|---------|
| knowledge-graph-integrated-v3.json | 3.8MB | 1,154 entities, 412 relationships, reconciled from 4 sources |

**Research Status:** Collected and reconciled, NOT loaded into app

---

## PART 3: THE GAP ANALYSIS

### What App Has vs What App Needs

**App Currently Uses:**
- getRegion() → TypeScript constants (119 regions)
- getCropPhenology() → TypeScript constants (28 entries)
- predictQuality() → Uses above data + real-time GDD

**App Can Show Today:**
- 28 generic crop × region combinations
- IF at optimal GDD → mark "at peak"
- Examples: "FL navels at peak", "CA cherries at peak"

**App CANNOT Show:**
- Cultivar-specific (Washington Navel vs Valencia)
- County-level precision (Hidalgo County vs Cameron County)
- Extended coverage (only 28 combinations, not 584+)

**The Gap:**
| Data Type | Exists In | Loaded to App? |
|-----------|-----------|----------------|
| 119 regions with soil | TypeScript | ✅ YES |
| 28 phenology entries | TypeScript | ✅ YES |
| 500 cultivars | TypeScript | ✅ YES |
| Extension cultivar timing | data/research/ | ❌ NO |
| Seed company timing | data/research/ | ❌ NO |
| LocalHarvest seasonal | data/research/ | ❌ NO (entities, not app) |
| 584 extracted patterns | Tonight's work | ❌ NO |

---

## PART 4: DATA QUALITY ASSESSMENT

### Extension Service Data (UF/IFAS)

**What it has:**
```json
"tomato": {
  "spring_season": {
    "region": "north_florida",
    "varieties": [
      {"name": "Tasti-Lee", "maturity": "late midseason"},
      {"name": "Florida 47", "maturity": "late midseason"}
    ],
    "planting_months": ["March", "April", "May"]
  }
}
```

**Quality:** HIGH - Specific cultivars, regions, seasons
**Usability:** Needs transformation to app format (CropPhenology structure)

### LocalHarvest Farm Data

**What it has:**
```json
"The Orange Shop, Citra, FL, Zone 9a": {
  "citrus_orange": {
    "harvestMonths": [10,11,12,1,2,3,4,5],
    "notes": "Legacy and heirloom varieties"
  }
}
```

**Quality:** MEDIUM - Generic "oranges", harvest window (not peak)
**Issue:** Product-level, not cultivar-level
**Value:** Validates regional timing, but needs cultivar inference

### Tonight's Entity Patterns (584 extracted)

**What I extracted:**
- Product × County × HarvestMonths
- Sample sizes (confidence from multiple sources)
- Example: "grapefruit, Hidalgo County TX, [10-5], 23 sources"

**Quality:** LOW - Generic products, wide windows
**Issue:** "Oranges Oct-May" conflates Navel (Oct-Dec) + Valencia (Mar-Jun)
**Not usable as-is:** Needs validation, cultivar splitting

---

## PART 5: THE INFERENCE SYSTEM YOU BUILT

### From inference-chains.ts

**Your inference model:**
```typescript
// EXAMPLE: SUMO orange scan
INPUT: PLU "3456", trade name "SUMO", scan in Chicago

INFERENCE CHAIN:
H: "SUMO" → Shiranui cultivar (trade name lookup)
S: Chicago + "California" → Ventura region → coastal alluvium
A: PLU prefix 3 → Conventional → 85% IPM (industry stat)
R: Feb 15 scan → Peak season + CA→Chicago 3 days transit
E: Shiranui cultivar → Brix 12-16 expected

OUTPUT: Full SHARE prediction from minimal input
```

**What this reveals:**
- Trade name → Cultivar mapping EXISTS
- Region → Soil inference EXISTS  
- Industry statistics (IPM rates) EXISTS
- Shipping time tables EXIST
- THIS IS SOPHISTICATED, BUILT, WORKING

### From products.ts (Taxonomy)

**Your hierarchy:**
```
Category: Fruit
  ↓
Subcategory: Citrus
  ↓
ProductType: Orange
  ↓
Variety: Navel, Valencia, Blood
  ↓
Cultivar: 
  - Navel → Washington Navel, Lane Late, Cara Cara
  - Valencia → Valencia (1:1)
  - Blood → Moro, Tarocco
```

**What this enables:**
- "Oranges" → Could be 3 varieties (Navel, Valencia, Blood)
- Timing inference: Oct-Dec = Navel, Mar-Jun = Valencia
- Quality prediction: Washington Navel (brix 11-13) vs Lane Late (brix 10-12)

---

## PART 6: THE INTEGRATION PROBLEM

### What kg-typescript-integration.md Documented

**Planned flow:**
```
1. User request → KGClient.resolveContext()
2. Graph returns: farm, location, cultivar, SHARE pillars
3. TypeScript calculates: GDD, Brix, quality
4. Store prediction in graph
```

**What's missing:**
- KGClient class (not implemented)
- resolveContext() (not implemented)
- Graph doesn't have cultivar × region data loaded
- No connection between app and graph

**Status:** DESIGN document, not implementation

### What Actually Happens Today

**App flow:**
```
1. User calls /api/predict with crop + region
2. App loads: getRegion() → TypeScript
3. App loads: getCropPhenology() → TypeScript
4. App calculates: weather API → GDD → predict
5. Returns: Generic prediction ("FL navels at peak")
```

**Data source:** TypeScript constants only
**Database usage:** None (Supabase not queried, Neo4j not connected)
**Works but:** Limited to 28 crop × region, no cultivar specificity

---

## PART 7: ROOT CAUSE ANALYSIS

### Why Systems Are Fragmented

**Timeline reconstruction:**

1. **Weeks 1-2:** Built TypeScript prediction engine
   - Created constants: regions (119), phenology (28), cultivars (500)
   - App uses these directly (fast, no DB)

2. **Weeks 3-4:** Created Supabase schema
   - Seeded SUBSET: 21 regions, 12 cultivars
   - Built predictions/actuals tables for operations
   - But never migrated full TypeScript → Supabase

3. **Yesterday (Dec 21):** Researched extension/seed company data
   - Collected UF/IFAS cultivar timing
   - Collected seed company calendars
   - Saved to data/research/
   - Created integrated-v3.json
   - **Never loaded into app**

4. **Last night (Dec 21-22):** Built Neo4j graph
   - Added 21K entities (names, locations)
   - Minimal SHARE connections
   - **Not connected to app**

**Result:** Three systems with overlapping but incomplete data

---

## PART 8: WHAT NEEDS TO HAPPEN (No Assumptions)

### Immediate (Get App Working with Cultivar-Level)

**The gap:** App has 28 generic entries, needs cultivar-specific

**Option A: Load Extension Data → TypeScript (Fast Path)**
```
1. Parse extension-ufifas-florida-cultivars.json
2. Generate CropPhenology entries:
   {
     cropId: 'tasti_lee_tomato',  // Cultivar-specific
     region: 'north_florida',
     bloomMonth: 3,
     bloomDay: 15,
     gddToPeak: 2800,
     harvestWindow: [4,5,6],  // From extension data
     source: 'UF/IFAS'
   }
3. Add to crop-phenology.ts (28 → 80+ entries)
4. App immediately uses (no code changes, just more data)
```

**Pros:** Works today, no architecture changes
**Cons:** TypeScript constants keep growing

**Option B: Load Extension Data → Supabase (Intended Architecture)**
```
1. Parse extension data
2. INSERT INTO harvest_windows (crop_id, region_id, harvest_start, harvest_end, optimal_start, optimal_end)
3. Flip USE_DATABASE_REFERENCE_DATA = true
4. App queries Supabase instead of TypeScript
```

**Pros:** Scalable, queryable, intended design
**Cons:** Requires migration of TypeScript → Supabase

---

## PART 9: WHAT THE GRAPH IS FOR (Clarified)

### Original Design (kg-typescript-integration.md)

**Purpose:** Entity resolution + inference
- Resolve partial inputs (city → county → region → soil)
- Infer missing SHARE data (practices, cultivar)
- Return complete context for prediction

### What You Clarified Tonight

**Purpose:** Research + pattern extraction
- Mine entities for cultivar × region patterns
- Extract seasonal timing from farms/packinghouses
- Build reference data (not production serving)

### Reconciliation

**Both are true, different phases:**

**Phase 1 (Current - Reference Building):**
- Graph = Research tool
- Extract patterns from 21K entities
- Build cultivar × region × timing reference
- Populate crop-phenology or harvest_windows

**Phase 2 (Future - Production Serving):**
- Graph = Query engine
- "What's at peak near me?" → Graph query
- Filter entities by timing/GDD
- Return specific products

**Current need:** Phase 1 (extract and populate reference data)

---

## PART 10: THE ACTUAL DATA INVENTORY

### Cultivar × Region × Timing Data Available

**Source 1: crop-phenology.ts (TypeScript)**
- 28 entries
- Quality: HIGH (validated, GDD-based)
- Coverage: Sparse (major crops only)

**Source 2: Extension data (data/research/)**
- UF/IFAS: 50+ cultivars for FL
- Cornell: 30+ cultivars for NY
- Quality: HIGH (official sources)
- Coverage: State-specific
- **Status:** Collected, not integrated

**Source 3: Seed companies (data/research/)**
- Burpee, Johnny's, Mary's: ~100 varieties
- SeedsNow: 621 cultivars with zones
- Quality: MEDIUM (commercial, sometimes conservative)
- Coverage: Zone-based
- **Status:** Collected, not integrated

**Source 4: LocalHarvest farms (266)**
- Product-level (not cultivar)
- HarvestMonths arrays (window, not peak)
- Quality: MEDIUM (ground truth but generic)
- **Status:** In Neo4j, not in app

**Source 5: Packinghouses (349)**
- Some variety mentions (15 have specifics)
- Quality: VARIABLE
- **Status:** In Neo4j, minimally extracted

---

## PART 11: FINDINGS & RECOMMENDATIONS

### Finding 1: TypeScript IS the Production System

**Evidence:**
- App imports TypeScript constants directly
- No database queries in critical path
- 119 regions, 500 cultivars, 28 phenology entries
- **This is what works TODAY**

**Recommendation:** TypeScript = production source of truth (for now)

### Finding 2: Extension Data is Highest Quality Unused Asset

**Evidence:**
- UF/IFAS has 50+ cultivar-specific entries
- Seed companies have 621 cultivars with zones
- Already collected and validated
- **Sitting in data/research/ unused**

**Recommendation:** Load extension data → crop-phenology.ts IMMEDIATELY

### Finding 3: Graph is Research Layer, Not Production

**Evidence:**
- 21K entities are sparse (95% no products)
- Not connected to app
- Intended for pattern extraction

**Recommendation:** 
- Extract cultivar mentions from 15 packinghouses with specifics
- Use to validate/extend extension data
- Don't try to serve from graph directly

### Finding 4: Supabase is Under-Utilized

**Evidence:**
- Schema complete
- Only 21 regions vs TypeScript's 119
- Operational tables (predictions, actuals) empty
- **Built for scale but not populated**

**Recommendation:** 
- Either: Migrate TypeScript → Supabase (big effort)
- Or: Keep TypeScript, use Supabase for operations only
- Don't duplicate data

---

## PART 12: ACTIONABLE INTEGRATION PLAN

### Immediate (This Week)

**Goal:** Expand from 28 to 80+ phenology entries using collected research

**Steps:**
1. Load extension-ufifas-florida-cultivars.json
   - Parse cultivar timing data
   - Generate CropPhenology entries
   - Add to crop-phenology.ts

2. Load seed company data (high-confidence only)
   - Burpee, Johnny's, Mary's (not SeedsNow - too generic)
   - Cross-validate with extension data
   - Add where confidence high

3. Extract cultivar mentions from 15 packinghouses
   - Mine notes for variety names
   - Add to regional-distributions.ts
   - Validate market share estimates

**Output:** crop-phenology.ts with 80+ cultivar × region entries

### Near-term (Next 2 Weeks)

**Goal:** Connect graph for pattern validation

**Steps:**
1. Query graph: "Growers in Indian River with 'orange' products"
2. Count: How many? (validates regional importance)
3. Extract: Any cultivar mentions in notes?
4. Use: Validate extension data, fill gaps

**Output:** Higher confidence in reference data

### Long-term (Weeks 3-4)

**Goal:** Enable geolocated discovery

**Steps:**
1. Build API endpoint: /api/peak-products?lat=28.5&lng=-81.4&radius=50
2. Logic:
   - Calculate current GDD for regions in radius
   - Filter phenology entries where GDD optimal
   - Return: Products at peak with distance
3. UI: Map view showing peak products nearby

**Output:** "Google Nearby for Peak Produce" working

---

## PART 13: ARCHITECTURAL DECISION

### The Three-System Reality

**TypeScript Constants:**
- Purpose: Fast reference data (regions, cultivars, phenology)
- Pros: Zero latency, git-versioned, works offline
- Cons: Not queryable, growing large (35K lines)
- **Decision:** Keep for now, migrate to DB later if needed

**Supabase:**
- Purpose: Operational data (predictions, measurements, calibrations)
- Pros: Relational, ACID, queryable
- Cons: Under-populated reference data
- **Decision:** Use for operations, optionally for reference

**Neo4j:**
- Purpose: Research, pattern extraction, entity catalog
- Pros: Graph queries, inference, relationships
- Cons: Not connected to app, sparse data
- **Decision:** Research tool, not production serving (yet)

### Recommended Data Flow

```
REFERENCE DATA:
  Extension/Seed Research → crop-phenology.ts (TypeScript)
  App imports directly (fast, no DB)

ENTITY CATALOG (Future):
  Graph maintains 21K entities
  Used for: pattern extraction, market analysis
  Not yet: production serving

OPERATIONAL DATA:
  predictions, actuals → Supabase
  Tracking, calibration, improvement

REAL-TIME:
  Weather API → GDD calculation
  Combined with reference → "at peak" filter
```

---

## PART 14: EXPLICIT NEXT ACTIONS

### What to Do Right Now

**Priority 1: Load Extension Data**
```
File: data/research/extension-ufifas-florida-cultivars.json
Action: Parse and add to crop-phenology.ts
Output: 28 → 80+ entries
Time: 2-3 hours
```

**Priority 2: Load Seed Company Data**
```
Files: burpee, johnnys, marys JSON files
Action: Cross-validate with extension, add high-confidence
Output: 80 → 120+ entries
Time: 2-3 hours
```

**Priority 3: Extract Cultivar Mentions from Graph**
```
Query: 15 packinghouses with variety mentions
Action: Mine notes for specific cultivar names
Output: Populate regional-distributions.ts
Time: 1-2 hours
```

**Do NOT:**
- Try to serve from graph directly
- Create new data structures
- Rebuild what exists

**DO:**
- Use collected research data
- Populate existing structures
- Make app show more products

---

## PART 15: VALIDATION QUESTIONS

Before proceeding, validate my understanding:

1. **Is TypeScript the intended production source for reference data?**
   (Or should I migrate to Supabase first?)

2. **Should I load extension data into crop-phenology.ts now?**
   (This gets you from 28 to 80+ entries immediately)

3. **Is the graph for research/extraction only?**
   (Not for production serving yet?)

4. **Is the goal to show generic "Washington Navel at peak in Indian River"?**
   (Not "Smith Farm has Washington Navels in stock" - that's Phase 2?)

**Please confirm or correct these four points before I proceed.**

