# Data Reconciliation Analysis
**Date:** 2025-12-21
**Purpose:** Compare and reconcile data across Fielder codebase, knowledge graph, and identify integration plan

---

## Data Inventory

### 1. Knowledge Graph v3 (`data/research/knowledge-graph-integrated-v3.json`)
- **Size:** 146,210 lines, 3.7MB
- **Cultivars:** 623 total
  - 2 detailed (Cherokee Purple, Floradade)
  - 621 SeedsNow references (minimal detail)
- **Perennial Crops:** 377 (Food Forest data)
- **Data Sources:** 6 defined (FL Dept Agriculture, UF/IFAS, Burpee, Mary's Heirloom, LocalHarvest, Food Forest, SeedsNow)
- **Zones:** 3 (Zone 8, 9, 10 for Florida)
- **States:** 1 (Florida only)

**Structure:**
- Has entity schema (State, Zone, Region, Farm, Product, Cultivar, PlantingWindow, HarvestWindow, DataSource, PerennialCrop)
- Has relationship types defined (HAS_ZONE, GROWS, PLANTED_IN, HARVESTED_IN, VALIDATES, PREDICTS)
- **Missing:** Actual PlantingWindow and HarvestWindow entities (defined in schema but not populated)
- **Missing:** Farm entities
- **Missing:** Detailed cultivar data for most entries

### 2. Fielder Codebase (`src/lib/constants/`)

#### products.ts - CULTIVARS Array
- **Count:** 112 cultivars
- **Coverage:**
  - Citrus: 13 cultivars (navel_orange, cara_cara, valencia, moro_blood_orange, satsuma, ruby_red_grapefruit, rio_star_grapefruit, meyer_lemon, clementine, sumo_citrus, oro_blanco, pummelo, key_lime)
  - Stone Fruit: 8 cultivars (elberta_peach, redhaven_peach, contender_peach, loring_peach, flordaking_peach, flordaprince_peach, lapins_cherry, stella_cherry)
  - Pome Fruit: 8 cultivars (honeycrisp_apple, cosmic_crisp_apple, fuji_apple, gala_apple, granny_smith_apple, arkansas_black_apple, esopus_spitzenburg_apple, winesap_apple)
  - Berries: 8 cultivars (strawberry, blueberry, blackberry, raspberry)
  - Root Vegetables: 10+ cultivars (carrot, beet, radish, turnip, parsnip, rutabaga, etc.)
  - Nightshades: 15+ cultivars (tomato, pepper, eggplant varieties)
  - Brassicas: 10+ cultivars (broccoli, cabbage, kale, cauliflower, brussels_sprouts, etc.)
  - Cucurbits: 8+ cultivars (cucumber, zucchini, butternut_squash, acorn_squash, pumpkin, watermelon, cantaloupe)
  - Legumes: 5+ cultivars (green_beans, lima_beans, snap_peas, snow_peas, etc.)
  - Herbs: 10+ cultivars (basil, cilantro, parsley, dill, etc.)
  - Meat: 10+ cultivars (beef, pork, chicken, lamb varieties)
  - Seafood: 15+ cultivars (fish, crustacean, shellfish)

**Data fields per cultivar:**
- `id`, `productId`, `name`, `varietyId`
- `heritageIntent` (true_heritage, heirloom_quality, modern_flavor, modern_nutrient, commercial)
- `isHeritage`, `organic`, `nonGMO`
- `attributes` (type, size, color, flavor, breeding details)
- `qualityPotential` (brixRange, flavor notes)
- `growingRequirements` (daysToMaturity, heatTolerant, diseaseResistance)
- `validatedStates` - **37 cultivars have this** (restricts generation to verified commercial states)
- `originLocked` - **Some cultivars** (e.g., Vidalia Onion, Kona Coffee - geographic designations)
- **Missing:** GDD data (baseTemp, maxTemp, gddToMaturity, plantingMethod, transplantAge)

#### gdd-targets.ts - GDD Requirements
- **Count:** 55 crop types (not cultivars - these are categories)
- **NEW Enhanced Data (Dec 21):**
  - `maxTemp` - Upper developmental threshold (86°F for most warm season, 75°F for cool season, 95°F for peppers, none for okra)
  - `plantingMethod` - 'direct_seed' | 'transplant' | 'either'
  - `transplantAge` - GDD accumulated indoors before field planting (400-600 GDD typical)

**Coverage by category:**
- Citrus: 5 (navel_orange, valencia, grapefruit, tangerine, satsuma)
- Stone Fruit: 3 (peach, sweet_cherry, tart_cherry)
- Pome Fruit: 2 (apple, pear)
- Berries: 2 (strawberry, blueberry)
- Tropical: 2 (mango, pomegranate)
- Nuts: 1 (pecan)
- Warm Season Vegetables: 23 types
  - Tomatoes: 4 types (early, standard, beefsteak, cherry)
  - Peppers: 2 types (hot, sweet)
  - Beans: 2 types (bush, pole)
  - Squash: 3 types (summer, winter, pumpkin)
  - Cucumbers: 2 types (slicing, pickling)
  - Melons: 2 types (watermelon, cantaloupe)
  - Corn: 2 types (early, standard)
  - Others: okra, eggplant
- Cool Season Vegetables: 17 types
  - Lettuce: 2 types (leafy, head)
  - Brassicas: 4 types (broccoli, cabbage, cauliflower, kale)
  - Roots: 5 types (carrot, beet, radish, turnip, parsnip)
  - Alliums: 3 types (onion_bulb, garlic, leek)
  - Greens: 2 types (spinach, arugula)
  - Peas: 1 type
- Herbs: 2 types (basil, cilantro)

**Data fields per crop:**
- `baseTemp` - Minimum for growth (40-65°F depending on crop)
- `maxTemp` - **NEW** - Upper threshold before heat stress
- `gddToMaturity` - GDD from bloom/planting to harvest
- `gddToPeak` - GDD to optimal quality
- `gddWindow` - GDD range for harvest window
- `chillHoursRequired` - For perennials
- `plantingMethod` - **NEW** - How crop is started
- `transplantAge` - **NEW** - Indoor GDD before field planting
- `notes` - Growing details

#### growing-regions.ts - ALL_GROWING_REGIONS
- **Count:** 121 regions across 11 US states
- **Data per region:**
  - `id`, `name`, `state`, `zones` (USDA hardiness zones)
  - `coordinates` (lat/lon)
  - `elevation`, `typicalSoil`
  - `notes`

#### crop-phenology.ts - Bloom dates and timing
- **Count:** 28 crop × region combinations
- **Data:**
  - Bloom dates by region
  - GDD targets
  - Harvest windows

### 3. Supabase Database (Seeded via migrations)
- **crops:** 15 rows (citrus, stone fruit, berries, tropical, nuts)
- **cultivars:** 12 rows (3 navels, 2 grapefruit, 2 peaches, 2 strawberries, 3 apples)
- **rootstocks:** 12 rows (9 citrus, 3 stone fruit)
- **growing_regions:** 21 rows (Florida + major regions)

---

## Key Reconciliation Issues

### 1. Cultivar Data Fragmentation
- **Graph has:** 623 cultivar IDs (mostly SeedsNow, minimal detail)
- **Codebase has:** 112 detailed cultivars (but missing GDD data)
- **GDD targets has:** 55 crop categories (not specific cultivars)

**Problem:** GDD data is at CROP level, but predictions need CULTIVAR level
- Example: gdd-targets has "tomato_beefsteak" (category), products has "cherokee_purple" (specific cultivar)
- Need to map: Cherokee Purple → tomato_beefsteak → 2900 GDD + maxTemp 86°F + transplant method

### 2. Geographic Coverage Mismatch
- **Graph:** Florida only (zones 8-11)
- **Codebase products.ts:** 37 cultivars have `validatedStates` across 20+ states
- **Growing regions:** 121 regions across 11 states

**Problem:** Graph is Florida-focused, but codebase has multi-state data ready to integrate

### 3. Missing Timing Data in Graph
- **Schema defines:** PlantingWindow and HarvestWindow entity types
- **Schema defines:** PLANTED_IN and HARVESTED_IN relationships
- **Actual data:** ZERO PlantingWindow or HarvestWindow entities exist

**Problem:** The most critical data for "What's at peak near me?" queries is missing

### 4. SHARE Pillar Mapping Incomplete
The codebase has all SHARE data, but graph doesn't structure it by pillars:

**H (Heritage) - Partial**
- ✅ Cultivar entities exist
- ✅ heritageIntent field exists
- ❌ Rootstock relationships not in graph
- ❌ Genetic ceiling (brixRange) not connected to prediction formulas

**R (Ripen) - Missing**
- ❌ GDD requirements not in graph
- ❌ PlantingWindow entities don't exist
- ❌ HarvestWindow entities don't exist
- ❌ No connection between Zone × Cultivar → optimal timing

**S (Soil) - Partial**
- ✅ Region entities with typicalSoil exist
- ❌ Not connected to cultivars or predictions

**A (Agricultural) - Missing**
- ❌ No Farm entities (practice data lives with farms)
- ❌ fertilityStrategy, pestManagement not in graph

**E (Enrich) - Missing**
- ❌ No Prediction entities
- ❌ No Actual measurement entities
- ❌ No Calibration data

---

## Proposed Integration Plan

### Phase 1: Cultivar Integration (Immediate)
**Goal:** Merge codebase CULTIVARS with graph cultivars

For each of the 112 cultivars in products.ts:
1. Check if exists in graph (by ID match)
2. If exists: Enhance with codebase data (heritageIntent, attributes, qualityPotential, validatedStates)
3. If not exists: Add to graph as new Cultivar entity
4. Map to GDD crop category (e.g., Cherokee Purple → tomato_beefsteak)
5. Inherit GDD properties from crop category

**Output:** 112 detailed cultivars in graph with full SHARE H pillar data

### Phase 2: GDD Data Integration (Critical)
**Goal:** Add GDD requirements to each cultivar

For each cultivar:
1. Determine crop category (tomato_beefsteak, pepper_hot, lettuce_leafy, etc.)
2. Pull from gdd-targets.ts:
   - `baseTemp`, `maxTemp`, `gddToMaturity`, `gddToPeak`, `gddWindow`
   - `plantingMethod`, `transplantAge`
   - `chillHoursRequired` (for perennials)
3. Add as cultivar properties in graph

**Special handling:**
- Perennial crops (citrus, stone fruit): GDD from bloom
- Annual vegetables: GDD from planting (adjusted for transplantAge if applicable)

**Output:** Every cultivar has complete GDD prediction data

### Phase 3: Timing Windows (Essential for "At Peak" queries)
**Goal:** Generate PlantingWindow and HarvestWindow entities

For each Cultivar × Zone combination:
1. Calculate planting windows based on:
   - Zone frost dates (lastFrostDate, firstFrostDate)
   - GDD requirements
   - Modified 86/50 method for heat stress
   - Cool season vs warm season
2. Calculate harvest windows based on:
   - Planting date + GDD accumulation
   - Peak window (gddToPeak ± gddWindow/2)
3. Create entities:
   - `PlantingWindow {cultivarId, zoneId, startMonth, endMonth, method}`
   - `HarvestWindow {cultivarId, zoneId, startMonth, endMonth, peakMonths}`
4. Create relationships:
   - `Cultivar --PLANTED_IN--> PlantingWindow`
   - `Cultivar --HARVESTED_IN--> HarvestWindow`

**Example:**
```json
{
  "id": "planting_window:cherokee_purple_zone10",
  "type": "PlantingWindow",
  "cultivarId": "cherokee_purple",
  "zoneId": "10",
  "startMonth": "Aug",
  "endMonth": "Sep",
  "method": "transplant",
  "notes": "Fall planting for winter harvest, avoids summer heat"
},
{
  "id": "harvest_window:cherokee_purple_zone10",
  "type": "HarvestWindow",
  "cultivarId": "cherokee_purple",
  "zoneId": "10",
  "startMonth": "Oct",
  "endMonth": "Jun",
  "peakMonths": ["Nov", "Dec", "Jan", "Feb", "Mar"],
  "notes": "Peak production Nov-Mar, full season harvest Oct-Jun"
}
```

**Output:** Thousands of PlantingWindow + HarvestWindow entities enabling time-aware queries

### Phase 4: Geographic Expansion (Multi-State)
**Goal:** Extend beyond Florida using validatedStates data

For each cultivar with validatedStates:
1. For each state in validatedStates:
   - Find all regions in that state (from growing-regions.ts)
   - Determine zones for each region
   - Generate PlantingWindow and HarvestWindow for each Zone
2. Create State entities for all 20+ states
3. Link: State --HAS_ZONE--> Zone --INCLUDES_REGION--> Region

**Example:** Honeycrisp apple with validatedStates: ['WA', 'NY', 'MI', 'MN', 'NC']
- Generate windows for: Washington zones 6-8, New York zones 5-7, Michigan zones 5-6, Minnesota zones 3-5, North Carolina zones 6-7
- Each zone gets specific timing based on GDD accumulation rates

**Output:** Knowledge graph covers 11 states with ~121 regions

### Phase 5: Farm Integration (Future)
**Goal:** Add actual farms growing specific cultivars

Data sources:
- LocalHarvest farm directory
- State agriculture department listings
- Social media harvest posts
- User-submitted farms (Flavor App)

For each farm:
1. Create Farm entity with location, practices (A pillar)
2. Link: Farm --LOCATED_IN--> Region
3. Link: Farm --GROWS--> Cultivar
4. Add seasonal availability data from farm calendars/social media

**Output:** Real farms discoverable via "What's at peak near me?" queries

---

## Next Steps

### Immediate (This Session)
1. ✅ Create this reconciliation analysis
2. ⬜ Write integration script to merge products.ts CULTIVARS into graph JSON
3. ⬜ Add GDD properties from gdd-targets.ts to each cultivar
4. ⬜ Generate PlantingWindow entities for Florida zones (8-11)
5. ⬜ Generate HarvestWindow entities for Florida zones (8-11)
6. ⬜ Create knowledge-graph-integrated-v4.json with complete data

### Short Term (Next Session)
1. Expand to all validatedStates (11 states, 121 regions)
2. Generate timing windows for all Cultivar × Zone combinations
3. Validate against Burpee/Mary's Heirloom reference data
4. Add DataSource provenance for all timing data

### Medium Term (Research Phase)
1. Use completed graph as training data to learn research pattern
2. Replicate pattern for additional states (Georgia, Texas, California priority)
3. Add farms from LocalHarvest + social media
4. Validate with extension office data (filter commercial vs backyard)

---

## Summary

**Current State:**
- Data exists in 3 places (graph, codebase, database) with significant fragmentation
- Graph has structure but missing critical timing data
- Codebase has detailed cultivar data but not in graph
- NEW GDD enhancements (maxTemp, plantingMethod) not integrated anywhere

**Goal State:**
- Single unified knowledge graph containing ALL Fielder data
- Complete SHARE pillar representation (S, H, A, R, E as graph structure)
- Timing windows generated for all Cultivar × Zone combinations
- Ready for "What's at peak near me?" queries
- Pattern established for replicating to new states

**Critical Path:**
1. Integrate cultivars (Phase 1)
2. Add GDD data (Phase 2)
3. Generate timing windows (Phase 3)
4. → THEN can query "What's at peak in Zone 10 today?"
5. → THEN can learn pattern to replicate for other states
