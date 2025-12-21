# Fielder Full Scope - SHARE Polymorphic Model

**Date:** 2025-12-21
**Purpose:** Map the COMPLETE scope of Fielder across ALL farm-to-table product types and how SHARE translates for each.

---

## What I Was Missing

I was anchored on **produce with GDD models** (tomatoes, oranges) when Fielder is a **complete farm-to-table quality intelligence platform** covering:

- **Produce** (fruit, vegetables, nuts) → 60+ product types
- **Meat** (beef, pork, poultry, game) → 10+ product types
- **Seafood** (fish, shellfish, crustacean) → 15+ product types
- **Dairy/Eggs** → 3 product types
- **Post-Harvest** (juice, syrup, honey, oil, cured meat) → 8+ product types

**Total: 80+ ProductTypes**, each with DIFFERENT SHARE mappings.

---

## The Core Insight: SHARE is Polymorphic

SHARE is NOT a fixed structure - it's a **polymorphic framework** that translates based on product category:

```typescript
interface SHARE<ProductCategory> {
  S: FoundationEnvironment    // Soil | Sea | Pasture (based on category)
  H: GeneticPotential         // Cultivar | Species | Breed
  A: Practices                // Growing | Harvesting | Feeding regime
  R: Timing                   // GDD | Freshness | Age at harvest
  E: Measurement              // Brix | Omega-3 | Omega ratio
}
```

Same pillars, **COMPLETELY different meanings and relationships**.

---

## Product Category SHARE Mappings

### 1. PRODUCE (Fruit, Vegetables, Nuts)

```
S (Soil) → H (Cultivar) → A (Growing practices) → R (GDD timing) → E (Brix)

MODEL: RegionalOffering = Cultivar × Region
  - Region brings: typicalSoil, avgDailyGDD, zones
  - Cultivar brings: heritageIntent, baseTemp, gddToMaturity, brixRange
  - Computed: PlantingWindow, HarvestWindow (based on GDD + zone frost dates)
  - Measured: Actual Brix (refractometer or CV estimate)

RELATIONSHIPS:
  Cultivar --GROWS_IN--> Region
  Cultivar + Region --HAS--> PlantingWindow
  Cultivar + Region --HAS--> HarvestWindow
  HarvestWindow + Timing --PREDICTS--> Expected Brix
  Farm + Cultivar --PRODUCES--> Actual Brix (measurement)

KEY INFERENCE CHAINS:
  - PLU code → Organic → Non-GMO
  - Packinghouse code → Region → typicalSoil
  - Scan date + Region → In-season vs off-season
  - Cultivar + Region + Season → Expected Brix range
```

**Example:** Cherokee Purple tomato in Zone 10
- S: Sandy loam soil, avg 25 GDD/day
- H: True heritage, indeterminate, 8-12oz fruit, Brix 6-8 potential
- A: Organic practices, no-spray
- R: Aug-Sep planting (transplant), Nov-Mar peak harvest
- E: Expected Brix 7.5, measured 7.2 (validation)

---

### 2. LIVESTOCK (Beef, Pork, Lamb, Poultry)

```
S (Pasture) → H (Breed) → A (Feeding regime) × R (Duration) → E (Omega ratio)

MODEL: FarmOffering = Farm + Breed + Feeding Regime + Duration
  - Farm brings: pastureType, grazingPractice
  - Breed brings: Genetic omega baseline (Wagyu +0.8, Grass breeds -1.0)
  - Feeding regime: grass_only, pasture_grain_supp, grain_finished, grain_fed
  - Duration: Months in feedlot (if applicable)
  - Outcome: Omega-6:Omega-3 ratio (3:1 best, 20:1 worst)

RELATIONSHIPS:
  Farm --HAS--> PastureType
  Farm --RAISES--> Breed
  Breed + FeedingRegime + Duration --DETERMINES--> Omega Ratio
  "Grass-fed" label --INFERS--> FeedingRegime (but often misleading)
  Lab test (Edacious) --VALIDATES--> Actual omega ratio

KEY INFERENCE CHAINS:
  - "Grass-fed" + "Grass-finished" → grass_only (3:1 ratio)
  - "Grass-fed" + NO "finished" claim → grain_finished (14:1 ratio)
  - "Pasture-raised" + "No feedlot" → pasture_grain_supp (6:1 ratio)
  - Breed (Wagyu) + Extended grain (12mo) → 20-26:1 (WORST health)
  - Organic meat + NO grass claim → grain_fed with organic grain (still bad omega)

CAFO DETECTION:
  - Silence on finishing = feedlot (grain_finished)
  - "Natural" + no process claims = commodity CAFO
  - Premium price + no grass-finished = extended CAFO (worse omega)
```

**Example:** American Wagyu from Everglades Ranch
- S: Florida pasture, native grasses
- H: Wagyu × Angus (marbling genetics, omega modifier +0.8)
- A: Pasture-raised, NO feedlot, free-choice grain supplement (CONCURRENT)
- R: 24 months age at harvest
- E: Expected omega 4-6:1, measured 4.2:1 (True Pasture tier)

**Counter-Example:** "Grass-Fed" Marketing Beef
- S: Unknown (backgrounded on pasture, finished in feedlot)
- H: Commercial Angus
- A: "Grass-fed" (misleading - grain-FINISHED)
- R: 6 months grain finishing
- E: Expected omega 10-15:1, measured 14:1 (SAME as commodity)

---

### 3. SEAFOOD (Fish, Shellfish, Crustacean)

```
S (Sea/Water) → H (Species) → A (Wild vs Farmed/Harvesting method) → R (Freshness) → E (Omega-3 content)

MODEL: Offering = Species + Harvest Method + Region + Days Since Catch
  - Water quality: cold_ocean, warm_ocean, freshwater, aquaculture
  - Species: Salmon, halibut, shrimp, oyster, etc.
  - Harvest method: Wild-caught, farm-raised, day-boat, long-line
  - Freshness: Days since caught (critical for quality)
  - Omega-3: Cold water fish highest, farm-raised lower

RELATIONSHIPS:
  Species --LIVES_IN--> WaterType
  WaterType + Season --DETERMINES--> Availability
  HarvestMethod --AFFECTS--> Quality
  DaysSinceCatch --DEGRADES--> Freshness
  Species + WaterType --PREDICTS--> Omega-3 content

KEY INFERENCE CHAINS:
  - "Wild-caught Alaskan" → High omega-3, seasonal availability
  - "Farm-raised" → Lower omega-3, year-round availability
  - "Fresh" vs "Previously frozen" → Quality tier
  - Region + shipping time → Estimated days since catch
  - Species + mercury database → Mercury level warning
```

**Example:** Copper River Sockeye Salmon
- S: Cold, pristine Alaskan waters
- H: Sockeye salmon (highest omega-3 of all salmon)
- A: Wild-caught, sustainable fishery
- R: May-June only (short season), 3-5 days since catch
- E: Omega-3 ~2,500mg per serving, mercury "very_low"

---

### 4. DAIRY/EGGS

```
S (Pasture) → H (Breed) → A (Feeding regime) × R (Production system) → E (Fatty acid profile)

MODEL: Similar to meat, but continuous production vs single harvest
  - Pasture quality affects milk/egg composition
  - Feed (grass vs grain) determines omega ratios
  - "Organic" eggs often = grain-fed (misleading)
  - True pasture-raised = better omega, deeper yolk color

RELATIONSHIPS:
  Farm --HAS--> Pasture + Feeding system
  Feeding regime --DETERMINES--> Egg yolk color + Omega ratio
  "Pasture-raised" + grain supplement → Better than grain-only
  "Organic" + NO pasture claim → Grain-fed (high omega-6)

KEY INFERENCE CHAINS:
  - "Pasture-raised" → Better omega, likely 3-6:1 ratio
  - "Organic" + "Vegetarian fed" → Grain-fed, omega 10-15:1
  - "Cage-free" / "Free-range" → Animal welfare, NOT nutrition indicator
  - Deep orange yolk → Pasture-raised (carotenoids from grass)
```

---

### 5. POST-HARVEST (Minimally Processed)

```
Parent Product SHARE → Processing → Derived Product

MODEL: Inherits timing from parent, adds processing date
  - Orange juice inherits: Cultivar, region, harvest timing from oranges
  - Maple syrup inherits: Tree species, region, tapping season
  - Honey inherits: Floral source, region, harvest timing
  - Cured meat inherits: Animal SHARE + aging/curing process

RELATIONSHIPS:
  Juice --MADE_FROM--> Cultivar (parent)
  Juice timing = Parent harvest window + processing lag
  Syrup --MADE_FROM--> Maple trees + tapping season
  Honey --MADE_FROM--> Floral source + bee forage region
  Cured meat --MADE_FROM--> Fresh meat + aging duration

KEY INFERENCE CHAINS:
  - Fresh-squeezed OJ → Parent orange cultivar + harvest date
  - "Olio Nuovo" EVOO → Within 3 months of olive harvest
  - Raw honey → Floral source determines flavor + seasonality
  - Country ham → Breed + diet + aging duration
```

---

## The Inference Engine

Fielder has a **5-dimensional inference model**:

```
Product × Origin × Destination × Time × Quality = SHARE
```

### Data Attribution Levels (Highest to Lowest Confidence)

1. **Farm-level**: Direct from farmer (H, S, A, R, E all known)
2. **Packinghouse-level**: Packer → Region inference (S, R inferred from region)
3. **Region-level**: Growing region known (S from typicalSoil, R from seasonal patterns)
4. **State-level**: Only state origin (Low confidence S, R)
5. **Unknown**: "Product of USA" only (Category-level assumptions)

### Example Inference Flow

**Scenario:** Consumer scans PLU 94011 orange at Whole Foods in Boston on Dec 15

```
INPUTS:
  - PLU: 94011 (prefix 9 = organic)
  - Product: Orange
  - Scan location: Boston, MA
  - Scan date: Dec 15

INFERENCE CHAINS:

H (Heritage):
  - PLU 9xxxx → Organic → Non-GMO (high confidence)
  - No cultivar identified → Assume common variety (medium confidence)

S (Soil):
  - December oranges → Likely Florida or Texas
  - No packinghouse code → State-level inference only (low confidence)

A (Agricultural):
  - PLU 9xxxx → USDA Organic certified (high confidence)
  - Organic → No synthetic pesticides, likely IPM-style management

R (Ripen):
  - Dec 15 + Florida → Peak navel season (high confidence)
  - Boston location → 3-5 days shipping time
  - Total freshness: 5-8 days since harvest (medium confidence)

E (Enrich):
  - Navel orange baseline: 10-14 Brix
  - December peak → Upper range expected (12-14 Brix)
  - CV estimate: 12.5 Brix (medium confidence)
  - Consumer scans with refractometer: 12.2 Brix (high confidence)

OVERALL SHARE ASSESSMENT:
  - Confidence: Medium (no farm/packinghouse data, but season + organic verified)
  - Expected quality: Good to Excellent (peak season, organic)
  - Data gaps: Cultivar ID, exact region, harvest date would improve confidence
```

---

## Knowledge Graph Structure (What It Should Model)

The knowledge graph should MODEL these polymorphic SHARE relationships:

### Entity Types Needed

**Geographic Hierarchy:**
- State → Zone → Region
- Region has: typicalSoil (produce), waterType (seafood), pastureType (meat)

**Product Hierarchy:**
- ProductType → Variety → Cultivar (produce)
- ProductType → Species (seafood)
- ProductType → Breed (meat)

**Core Relationship Entity:**
- **RegionalOffering** = Product × Region (produce, seafood)
- **FarmOffering** = Farm × Breed × Practices (meat, dairy)

**Temporal Entities:**
- PlantingWindow (produce)
- HarvestWindow (produce, also applies to seafood seasons)
- AgingWindow (meat, cheese)

**Measurement Entities:**
- QualityPrediction (expected outcome based on S+H+A+R)
- QualityMeasurement (actual outcome - E pillar)
- Calibration (prediction vs actual → improves model)

### Relationships Needed

**For Produce:**
```
Cultivar --GROWS_IN--> Region
Cultivar + Region = RegionalOffering
RegionalOffering --HAS--> PlantingWindow
RegionalOffering --HAS--> HarvestWindow
RegionalOffering --PREDICTS--> Expected Brix
Farm --GROWS--> RegionalOffering (with practices)
Farm + RegionalOffering --MEASURES--> Actual Brix
```

**For Meat:**
```
Breed --RAISED_ON--> PastureType
Farm --HAS--> PastureType + Feeding Regime
Farm + Breed + FeedingRegime + Duration = FarmOffering
FarmOffering --PREDICTS--> Omega Ratio
Lab --TESTS--> FarmOffering --MEASURES--> Actual Omega Ratio
"Grass-fed" claim --INFERS--> FeedingRegime (often wrong)
Actual omega --VALIDATES/CONTRADICTS--> Marketing claim
```

**For Seafood:**
```
Species --LIVES_IN--> WaterType
Region + Season --DETERMINES--> Availability
HarvestMethod + DaysSinceCatch --DETERMINES--> Quality
Species + WaterType --PREDICTS--> Omega-3 content
```

**For Post-Harvest:**
```
Juice --DERIVED_FROM--> Cultivar (parent)
Juice --INHERITS_TIMING--> Parent HarvestWindow
Processing date + Parent harvest --DETERMINES--> Freshness
Syrup --MADE_FROM--> Tree species + Region + Season
Honey --MADE_FROM--> Floral source + Region + Season
```

---

## Why This Matters for the Graph

I was thinking: "Graph needs 623 cultivars with PlantingWindow/HarvestWindow"

**What it actually needs:**

1. **Product Type polymorphism** - 80+ product types, each with different SHARE mapping
2. **RegionalOffering/FarmOffering entities** - Where SHARE pillars connect
3. **Inference chains** - How to estimate SHARE when data is incomplete
4. **Category-specific relationships**:
   - Produce: Cultivar × Region × GDD → Timing windows
   - Meat: Breed × Feeding × Duration → Omega ratio
   - Seafood: Species × Water × Freshness → Quality
   - Post-harvest: Parent product × Processing → Derived quality
5. **Measurement validation** - Predictions vs actuals for ALL categories

The graph is NOT about produce timing windows. It's about **modeling farm-to-table quality intelligence across ALL food categories**.

---

## Integration with Supabase

Supabase schema reflects THIS full scope:

**Tables that handle produce:**
- crops, cultivars, rootstocks
- crop_phenology (Cultivar × Region bloom dates)
- harvest_windows (predicted timing)

**Tables that handle ALL categories:**
- farms (can grow produce OR raise meat/seafood)
- farm_crops (what farms produce - ANY category)
- farm_availability (real-time inventory - ANY product)
- daily_predictions (pre-computed offerings - ALL categories)

**Missing from Supabase (but needed):**
- Breed table (meat/dairy)
- FeedingRegime/Practices tracking
- Species table (seafood)
- WaterType/Habitat data
- OmegaRatio measurements (E pillar for meat/seafood)

---

## Next Steps (Corrected Understanding)

1. **Map product type ontology** - ALL 80+ types with SHARE translations
2. **Create polymorphic interfaces** - RegionalOffering (produce), FarmOffering (meat), etc.
3. **Model category-specific relationships** - Not just PlantingWindow, but FeedingRegime, HarvestMethod, etc.
4. **Build inference engines** - One for each category with appropriate chains
5. **Populate graph with ALL categories** - Not just cultivars, but breeds, species, practices
6. **Connect to measurement layer** - Brix, omega ratios, omega-3, all E pillar data

The knowledge graph should model **how Fielder thinks about quality across the entire farm-to-table spectrum**, not just produce timing.

---

## Conclusion

Fielder is NOT a "produce availability app with GDD models."

Fielder is a **comprehensive farm-to-table quality intelligence platform** that:
- Handles 80+ product types across produce, meat, seafood, dairy, processed
- Applies SHARE framework polymorphically (different meaning per category)
- Uses inference chains to estimate quality when data is incomplete
- Validates with measurements (Brix, omega ratios, omega-3)
- Exposes false marketing claims (omega ratio catches "grass-fed" lies)

The knowledge graph should represent THIS complete system, not just a subset.
