# Knowledge Graph v4 - Integration Summary & Next Steps

**Date:** 2025-12-21
**Status:** Design Complete, Ready for Implementation

---

## What Was Accomplished

This session completed a fundamental reimagining of the Fielder knowledge graph to model the **complete farm-to-table scope** across all product categories, not just produce timing.

### Documents Created

1. **`fielder-full-scope-share-model.md`** - Conceptual model
   - Maps SHARE polymorphism across 80+ product types
   - Shows how same 5 pillars have different meanings per category
   - Explains inference chains and 5-dimensional quality model

2. **`knowledge-graph-schema-design-v4.md`** - Technical schema
   - Complete GraphQL schema for all categories
   - Entity types, relationships, and traversal patterns
   - 150+ pages of comprehensive data modeling

3. **`knowledge-graph-sample-entities-v4.json`** - Concrete examples
   - Real entity instances demonstrating the schema
   - Shows SHARE in action for produce, meat, and seafood
   - Includes predictions, measurements, and calibrations

---

## The Core Insight: SHARE is Polymorphic

The breakthrough understanding from this session:

**Fielder is NOT:**
- A produce availability app with GDD models
- Just about tomatoes and oranges
- Only concerned with PlantingWindows and HarvestWindows

**Fielder IS:**
- A complete farm-to-table quality intelligence platform
- Covering 80+ product types across produce, meat, seafood, dairy, processed
- Applying SHARE framework polymorphically - same pillars, different meanings

### SHARE Translation by Category

| Category | S | H | A | R | E |
|----------|---|---|---|---|---|
| **Produce** | Soil | Cultivar | Growing practices | GDD timing | Brix |
| **Meat** | Pasture | Breed | Feeding regime | Duration | Omega ratio |
| **Seafood** | Sea/Water | Species | Harvest method | Freshness | Omega-3 |
| **Dairy** | Pasture | Breed | Feeding regime | Production system | Fatty acids |
| **Processed** | Parent S | Parent H | Processing method | Parent R + lag | Retained quality |

---

## Schema Structure

### Universal Foundation (All Categories)

- **Geographic Hierarchy:** State → Zone → Region
- **Farms:** Can grow produce OR raise livestock (polymorphic)
- **Measurements:** QualityPrediction, QualityMeasurement, Calibration
- **Inference:** Data attribution levels, confidence scoring

### Category-Specific Models

#### 1. Produce Model (GDD-Based)

```
ProductType → Variety → Cultivar + Rootstock
                          ↓
            Cultivar × Region = ProduceOffering
                          ↓
            PlantingWindow → HarvestWindow → Brix Prediction
                          ↓
            Farm × ProduceOffering = FarmOffering
                          ↓
            Actual Measurements → Calibration
```

**Key Entities:**
- Cultivar (H pillar)
- SoilProfile (S pillar)
- AgriculturalPractices (A pillar)
- PlantingWindow, HarvestWindow (R pillar)
- Brix measurements (E pillar)

#### 2. Livestock Model (Omega-Based)

```
AnimalType → Breed
              ↓
Breed × Farm × FeedingRegime × Duration = LivestockOffering
              ↓
Omega Ratio Prediction (3:1 to 26:1)
              ↓
MeatProducts (cuts) inherit omega ratio
              ↓
Lab Measurements → Validation
```

**Key Entities:**
- Breed (H pillar - ~20% of omega outcome)
- PastureType, PastureQuality (S pillar)
- FeedingRegime (A pillar - ~80% of omega outcome)
- AgeAtHarvest, FeedlotDuration (R pillar)
- OmegaRatio measurements (E pillar)

**Critical Distinction:**
- CONCURRENT feeding (pasture + grain simultaneously) → 6:1 ratio
- SEQUENTIAL feeding (pasture → feedlot) → 14:1 ratio
- This is THE differentiator between True Pasture and Marketing Grass

#### 3. Seafood Model (Freshness-Based)

```
SeafoodType → Species
               ↓
Species × Region × HarvestMethod × Freshness = SeafoodOffering
               ↓
Omega-3 + Mercury Prediction
               ↓
Lab Measurements → Validation
```

**Key Entities:**
- Species (H pillar - omega-3 baseline)
- WaterType, WaterQuality (S pillar)
- HarvestMethod (A pillar - wild vs farm)
- DaysSinceCatch (R pillar - CRITICAL)
- Omega-3, Mercury measurements (E pillar)

---

## Sample Data Summary

The `knowledge-graph-sample-entities-v4.json` file contains complete examples:

### Produce Example: Washington Navel Orange
- **Location:** Indian River, Florida (Zone 10a)
- **Cultivar:** Washington Navel (heirloom quality)
- **Rootstock:** Carrizo (+0.6 Brix modifier)
- **Soil:** Sandy loam, mineralized (ACRES USA)
- **Practices:** Organic soil banking
- **Harvest Window:** Dec-Feb peak
- **Predicted Brix:** 12.6
- **Measured Brix:** 12.2 (3.2% error)
- **Overall SHARE Score:** 0.886

### Livestock Example: American Wagyu
- **Location:** Texas Hill Country
- **Breed:** American Wagyu (+0.8 omega modifier)
- **Pasture:** Native grass, rotational, mineralized
- **Feeding:** Pasture + concurrent non-GMO grain (25%)
- **Duration:** 24 months, zero feedlot time
- **Predicted Omega:** 4.5:1
- **Measured Omega:** 4.2:1 (6.7% error, Edacious lab verified)
- **Tier:** True Pasture
- **Overall SHARE Score:** 0.876

### Seafood Example: Copper River Sockeye
- **Location:** Copper River, Alaska
- **Species:** Sockeye Salmon (highest omega-3)
- **Water:** Cold pristine ocean
- **Harvest:** Wild day-boat, MSC certified
- **Season:** May-June only (short window)
- **Freshness:** 3 days since catch
- **Omega-3:** 2,500mg per serving
- **Mercury:** Very Low
- **Overall SHARE Score:** 0.936

---

## Inference Chains Modeled

The schema includes inference logic for estimating SHARE when data is incomplete:

### Produce Inference Examples
- **PLU 9xxxx** → Organic → Non-GMO (H pillar, high confidence)
- **Packinghouse code** → Region → typicalSoil (S pillar, medium confidence)
- **Scan date + Region** → Seasonal pattern (R pillar, high confidence)
- **Cultivar + Season** → Expected Brix range (E pillar, medium confidence)

### Livestock Inference Examples
- **"Grass-fed" claim WITHOUT "grass-finished"** → Grain-finished (A pillar, high confidence)
- **"Organic" + Meat** → Grain-fed with organic grain (A pillar, high confidence - red flag)
- **Extended grain (12mo) + Wagyu** → Omega 20-26:1 (E pillar, high confidence)
- **Silence on finishing** → Feedlot assumed (A pillar, high confidence)

### Seafood Inference Examples
- **"Wild-caught Alaskan"** → Cold water, high omega-3 (S+H pillar, high confidence)
- **Scan date + Region** → In-season vs out-season (R pillar, high confidence)
- **Species + WaterType** → Mercury level (E pillar, high confidence from FDA data)

---

## Integration with Existing Codebase

### What Already Exists

**TypeScript Codebase (`src/lib/constants/`):**
- `products.ts` - 112 cultivars with H pillar data
- `gdd-targets.ts` - 55 crop categories with R pillar data (GDD requirements)
- `rootstocks.ts` - 12 rootstocks with Brix modifiers
- `growing-regions.ts` - ~150 US regions
- `quality-tiers.ts` - 11 cultivar quality profiles
- `agricultural-definitions.ts` - 36 farm-to-table terms
- `inference-chains.ts` - SHARE pillar inference logic

**Reconciliation Script:**
- `scripts/reconcile-cultivar-gdd-data.ts` - Merges products.ts + gdd-targets.ts
- Currently: 15 cultivars (13%) mapped with complete H+R data
- Needs: Expand mapping to cover ~70 more produce cultivars

**Supabase Database:**
- `crops` - 15 rows
- `cultivars` - 12 rows
- `rootstocks` - 12 rows
- `growing_regions` - 21 rows
- `crop_phenology` - Cultivar × Region bloom dates (RegionalOffering concept)
- `farm_crops` - Farm × Cultivar × Rootstock (FarmOffering concept)
- `harvest_windows` - Computed predictions

### What's Missing

**For Produce (70% complete):**
- ⬜ Expand cultivar → GDD mappings (add 70 more)
- ⬜ Generate PlantingWindow entities (thousands)
- ⬜ Generate HarvestWindow entities (thousands)
- ⬜ Expand Region entities to ~150 with SoilProfile data
- ⬜ Connect to Flavor App data collection

**For Livestock (0% complete):**
- ⬜ Create Breed entities
- ⬜ Create FeedingRegime types
- ⬜ Model LivestockOffering relationships
- ⬜ Build omega ratio prediction algorithm
- ⬜ Connect to Edacious lab data
- ⬜ Create MeatProduct entities (cuts)

**For Seafood (0% complete):**
- ⬜ Create Species entities
- ⬜ Create WaterType + HarvestMethod data
- ⬜ Model SeafoodOffering relationships
- ⬜ Integrate FDA mercury database
- ⬜ Build omega-3 prediction model

**For Measurements (Foundation exists):**
- ⬜ Expand QualityPrediction to all categories
- ⬜ Expand QualityMeasurement to all categories
- ⬜ Build Calibration logic (prediction vs actual)
- ⬜ Connect to lab APIs (Edacious, BioNutrient, Texas A&M)

---

## Implementation Roadmap

### Phase 1: Complete Produce Model (2-3 weeks)

**Goal:** Make "What's at peak near me?" queries work for all produce

1. **Expand Cultivar Mappings** (1 week)
   - Add 70 more cultivars to `CULTIVAR_TO_GDD_CATEGORY`
   - Target: 70-80% of produce cultivars with GDD data
   - Run reconciliation script to validate

2. **Generate Timing Windows** (1 week)
   - For each Cultivar × Zone combination:
     - Calculate PlantingWindow (based on frost dates + GDD)
     - Calculate HarvestWindow (based on GDD accumulation)
   - Output: Thousands of entities
   - Store in Supabase `harvest_windows` table

3. **Populate Region + Soil Data** (3-5 days)
   - Expand `growing_regions` to ~150 regions
   - Add SoilProfile data for each region
   - Source: USDA soil surveys, state extension services

4. **Integration Testing** (2-3 days)
   - Test "peak near me" queries
   - Validate predictions vs actual measurements
   - Refine GDD models based on feedback

**Deliverable:** Produce model fully operational with timing predictions

### Phase 2: Build Livestock Model (3-4 weeks)

**Goal:** Enable omega ratio predictions and verification for meat/dairy

1. **Create Breed Entities** (3-5 days)
   - Document 20-30 common breeds (beef, pork, lamb, chicken)
   - Research omega baselines per breed
   - Create breed database

2. **Model Feeding Regimes** (1 week)
   - Define all regime types (grass_only, pasture_grain_supp, grain_finished, grain_fed)
   - Research omega outcomes per regime
   - Build regime → omega prediction model
   - Account for duration penalty (+0.5 per month beyond 4 months)

3. **Build Omega Prediction Algorithm** (1 week)
   - Input: Breed, FeedingRegime, Duration
   - Output: Expected omega ratio (3:1 to 26:1)
   - Confidence scoring
   - Account for H pillar (breed) + A pillar (feeding) + R pillar (duration)

4. **Create LivestockOffering Entities** (3-5 days)
   - Model Breed × Farm × FeedingRegime × Duration
   - Link to MeatProduct entities (cuts)
   - Omega ratio inheritance

5. **Connect Lab Data** (3-5 days)
   - Integrate Edacious API (if available)
   - Manual entry for existing lab reports
   - Build Calibration logic (prediction vs actual)

**Deliverable:** Livestock model with omega predictions and lab validation

### Phase 3: Build Seafood Model (2-3 weeks)

**Goal:** Enable omega-3 + mercury predictions for seafood

1. **Create Species Entities** (3-5 days)
   - Document 30-50 common species
   - Research omega-3 baselines (cold water highest)
   - Research mercury levels (FDA database)

2. **Model Water + Harvest** (1 week)
   - WaterType (cold_ocean, warm_ocean, freshwater, aquaculture)
   - HarvestMethod (wild, farm-raised, day-boat)
   - Impact on omega-3 content

3. **Build Prediction Models** (1 week)
   - Omega-3 prediction (Species + WaterType)
   - Freshness degradation (DaysSinceCatch)
   - Mercury lookup (Species → FDA data)

4. **Seasonal Availability** (3-5 days)
   - Research seasonal patterns (wild-caught)
   - Model availability windows
   - Year-round for farm-raised

**Deliverable:** Seafood model with omega-3 + mercury data

### Phase 4: Flavor App Integration (2-3 weeks)

**Goal:** Enable consumer data collection and crowdsourced validation

1. **PLU Scanning** (1 week)
   - Product identification via PLU code
   - Link to ProduceOffering entities
   - Inference chain from PLU → SHARE

2. **Computer Vision Brix Prediction** (1 week)
   - Photo of produce → Brix estimate
   - Confidence scoring
   - Baseline for refractometer comparison

3. **Refractometer Integration** (3-5 days)
   - Manual entry of Brix reading
   - Photo capture + OCR (future)
   - Link to QualityMeasurement entities

4. **Data Flywheel** (3-5 days)
   - Capture: Product × Origin × Destination × Time × Quality
   - Store: FlavorAppScan entities
   - Generate: Prediction → Measurement → Calibration
   - Every scan deepens moat

**Deliverable:** Flavor App data collection operational

### Phase 5: Brand Research Database (Ongoing)

**Goal:** Build competitive intelligence on D2C/retail brands

1. **Curated Brand Database** (not dynamic AI scraping)
   - Research brands systematically
   - Document: What they claim, what they DON'T claim
   - Score against SHARE Profiles

2. **"Same Label, Different Nutrition"** Content
   - Buy competitor products
   - Lab test them (Edacious)
   - Publish results
   - Legal, viral, devastating

3. **Claim Inference Engine**
   - Build inference rules per category
   - Example (Beef): "Grass-fed" + NO "grass-finished" = Grain-finished
   - Instant SHARE Profile assignment

**Deliverable:** Competitive intelligence database powering Flavor App scans

---

## Technical Considerations

### Graph Database vs Relational

**Current:** Supabase (PostgreSQL)
- ✅ Works well for current produce-focused model
- ✅ Handles farm inventory, predictions, measurements
- ⚠️ Polymorphic relationships get complex with SQL

**Future:** Consider graph database (Neo4j, Amazon Neptune)
- ✅ Natural SHARE traversals (S → H → A → R → E paths)
- ✅ Polymorphic queries (same structure, different node types)
- ✅ Inference chain modeling (path-based reasoning)
- ✅ Similarity matching ("Find offerings like this")
- ⚠️ Additional infrastructure complexity

**Recommendation:** Start with Supabase, evaluate graph database as polymorphic model expands.

### Data Sources

| Category | Data Source | Status |
|----------|-------------|--------|
| **Produce GDD** | UF/IFAS, UC Davis, WSU, MSU extension | Available |
| **Produce Brix** | Flavor App crowdsourced + farm-provided | Building |
| **Rootstocks** | UF/IFAS, USDA research | Available |
| **Soil Profiles** | USDA soil surveys, state extensions | Available |
| **Breed Omega** | Research literature, breed associations | Needs research |
| **Omega Measurements** | Edacious lab, Texas A&M | Needs API integration |
| **Seafood Omega-3** | USDA nutrient database, research literature | Available |
| **Mercury Levels** | FDA fish database | Available |
| **Seasonal Patterns** | NOAA, state fisheries | Available |

### API Integrations Needed

1. **Edacious Labs** - Omega ratio testing
2. **BioNutrient Food Association** - Nutrient density meter data
3. **Texas A&M** - Livestock fatty acid testing
4. **USDA Nutrient Database** - Baseline nutrition data
5. **FDA Fish Mercury Database** - Seafood mercury levels

---

## Success Metrics

### Phase 1 (Produce)
- ✅ 70+ cultivars with complete GDD data
- ✅ Thousands of PlantingWindow entities generated
- ✅ Thousands of HarvestWindow entities generated
- ✅ "What's at peak near me?" queries working
- ✅ <10% prediction error on Brix

### Phase 2 (Livestock)
- ✅ 20+ breeds modeled
- ✅ Omega prediction algorithm validated
- ✅ <15% prediction error on omega ratios
- ✅ Lab verification catching false "grass-fed" claims

### Phase 3 (Seafood)
- ✅ 30+ species modeled
- ✅ Omega-3 + mercury data complete
- ✅ Seasonal availability accurate
- ✅ Freshness tracking operational

### Phase 4 (Flavor App)
- ✅ 100K+ scans collected
- ✅ Prediction → Measurement pairs accumulating
- ✅ Network effect accelerating (more scans → better predictions)
- ✅ Moat deepening with unreplicable data

---

## The Moat

Every prediction → measurement pair captured through the Flavor App is **unreplicable IP**:

- **Cannot be synthesized by AI** - Real-world measurements from farms and consumers
- **Improves prediction accuracy** - Calibration feedback loop
- **Network effects** - More users → more data → better predictions → more users
- **First-mover advantage** - No one else is building this measurement layer at scale

The knowledge graph is the **data structure** that captures and organizes this moat.

---

## Conclusion

This session fundamentally reimagined the Fielder knowledge graph from "produce timing app" to "comprehensive farm-to-table quality intelligence platform."

**What changed:**
- Understanding of SHARE polymorphism (same pillars, different meanings)
- Recognition of full scope (80+ product types, not just produce)
- Schema design for ALL categories (produce, meat, seafood, dairy, processed)
- Inference chains for incomplete data (5 attribution levels)
- Measurement validation across categories (Brix, omega ratios, omega-3)

**What stays the same:**
- SHARE framework as foundation (S → H → A → R → E)
- Quality emerges from relationships (not just attributes)
- Measurement validation as moat (predictions vs actuals)

**What's next:**
- Phase 1: Complete produce model (timing windows)
- Phase 2: Build livestock model (omega predictions)
- Phase 3: Build seafood model (omega-3 + mercury)
- Phase 4: Integrate Flavor App (data flywheel)
- Phase 5: Build brand research database (competitive intelligence)

**The vision is clear. The path is defined. Time to build.**
