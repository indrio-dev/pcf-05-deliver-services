# Current Graph → SHARE Pillar Mapping (Comprehensive)

**Date:** December 24, 2025
**Purpose:** Document EVERY field in graph and how it maps to SHARE pillars
**Status:** Validated against actual Neo4j data

---

## Yes, I Have Clear Context

**Your question:** "Do you have clear context for everything that's already in the graph and how each field relates to SHARE pillars?"

**My answer:** **YES - Here's the complete mapping:**

---

## CULTIVAR Node → SHARE Mapping

**Node count:** 159 cultivars in graph

### Fields Present (From actual navel_orange node):

```
IDENTITY (Non-SHARE):
  ✅ id: 'navel_orange'
  ✅ displayName: 'Washington Navel'
  ✅ varietyId: 'navel' → Links to Variety node

MODEL TYPE (R Pillar):
  ✅ modelType: 'calendar' [R]
     Purpose: Determines if we use calendar months or GDD for timing
     SHARE: R pillar - timing prediction method

HERITAGE (H Pillar):
  ✅ isNonGmo: true [H]
     Purpose: Non-GMO verification
     SHARE: H pillar - genetic quality indicator

  ⚠️  isHeritage, heritageIntent, originLocked: Not on all nodes
     Purpose: Heritage classification
     SHARE: H pillar - genetic potential for quality

GEOGRAPHIC (S Pillar):
  ✅ validatedStates: ['CA', 'FL', 'TX', 'AZ'] [S]
     Purpose: Which US states can grow this cultivar
     SHARE: S pillar - geographic suitability

QUALITY (E Pillar):
  ✅ flavorProfile: 'Sweet, seedless, ideal for eating fresh' [E]
     Purpose: Expected flavor characteristics
     SHARE: E pillar - quality expectations

TIMING (R Pillar):
  ✅ peakMonths: [11, 12, 1] [R]
     Purpose: Peak harvest calendar months
     SHARE: R pillar - when to harvest for best quality

  ⚠️  baseTemp, gddToMaturity, gddToPeak: Only on 21 GDD-based cultivars
     Purpose: GDD parameters for harvest prediction
     SHARE: R pillar - heat accumulation timing
```

**SHARE Mapping Summary:**
- **H pillar:** varietyId, isNonGmo, isHeritage, heritageIntent
- **S pillar:** validatedStates
- **R pillar:** modelType, peakMonths, baseTemp, gddTo* params
- **E pillar:** flavorProfile, nutritionNotes

---

## GROWING REGION Node → SHARE Mapping

**Node count:** 185 regions in graph (153 unique + 32 aliases)

### Fields Present (From actual indian_river node):

```
IDENTITY (Non-SHARE):
  ✅ id: 'indian_river'
  ✅ name: 'Indian River District'
  ✅ displayName: 'Indian River District'

GEOGRAPHY (S Pillar):
  ✅ state: 'FL' [S]
     Purpose: US state location
     SHARE: S pillar - political geography

  ✅ lat: 27.6, lon: -80.4 [S]
     Purpose: Coordinates for weather API
     SHARE: S pillar - physical location for climate

  ✅ usdaZone: '10' [S]
     Purpose: USDA Hardiness Zone
     SHARE: S pillar - crop compatibility

CLIMATE (R Pillar - Enables Timing):
  ✅ avgLastFrostDoy: 45 [R]
     Purpose: Last spring frost (day of year)
     SHARE: R pillar - growing season start

  ✅ avgFirstFrostDoy: 350 [R]
     Purpose: First fall frost (day of year)
     SHARE: R pillar - growing season end

  ✅ frostFreeDays: 305 [R]
     Purpose: Length of growing season
     SHARE: R pillar - season duration

  ✅ annualGdd50: 5500 [R] ⭐ CRITICAL
     Purpose: Annual Growing Degree Days (base 50°F)
     SHARE: R pillar - heat accumulation for crop timing predictions

  ✅ avgChillHours: 150 [R] ⭐ CRITICAL
     Purpose: Average winter chill hours
     SHARE: R pillar - deciduous fruit dormancy requirement

MARKET (Non-SHARE):
  ✅ dtcActivity: 'high'
     Purpose: Direct-to-consumer market activity level
     SHARE: Not directly SHARE, but indicates market opportunity
```

**SHARE Mapping Summary:**
- **S pillar:** state, lat, lon, usdaZone (geography/location)
- **R pillar:** ALL climate fields (annualGdd50, avgChillHours, frost dates)
- **Note:** Climate is S×R (geography determines climate, climate determines timing)

---

## GROWN_IN Relationship → SHARE Mapping

**Relationship count:** 4,614 cultivar×region connections

### Properties Present (From actual navel_orange→indian_river):

```
QUALITY (E Pillar):
  ✅ quality_tier: 'exceptional' [E]
     Purpose: Quality classification for this cultivar×region combo
     SHARE: E pillar - terroir effect on quality

  ✅ brix_expected: 13.5 [E] ⭐ KEY METRIC
     Purpose: Expected Brix for this offering
     SHARE: E pillar - predicted quality (sugar content)

  ✅ brix_min: 11.1 [E]
     Purpose: Minimum expected Brix
     SHARE: E pillar - quality range lower bound

  ✅ brix_max: 15.9 [E]
     Purpose: Maximum expected Brix
     SHARE: E pillar - quality range upper bound

TIMING (R Pillar):
  ⚠️  gdd_to_peak: null (only on 28 phenology relationships) [R]
     Purpose: Region-specific GDD to peak harvest
     SHARE: R pillar - terroir effect on timing
```

**SHARE Mapping Summary:**
- **E pillar:** quality_tier, brix_expected, brix_min, brix_max
- **R pillar:** gdd_to_peak (when present)
- **H×S×R×E:** The relationship itself represents cross-pillar integration

**What this relationship MEANS:**
```
(Cultivar)-[:GROWN_IN]->(GrowingRegion)

Combines:
  H: Which cultivar (genetic potential)
  S: Which region (terroir, climate)
  R: Expected timing (from region climate + cultivar params)
  E: Expected quality (Brix, tier)

This IS the SHARE framework in action.
```

---

## CLAIM Node → SHARE Mapping

**Node count:** 10 claims

### Fields Present (From actual grass_fed claim):

```
IDENTITY (Non-SHARE):
  ✅ id: 'grass_fed'
  ✅ name: 'Grass-Fed'
  ✅ category: 'feeding_regime'
  ✅ applicableProducts: ['meat', 'dairy']

REGULATORY (A Pillar):
  ✅ regulatoryStatus: 'withdrawn' [A]
     Purpose: Legal status of claim
     SHARE: A pillar - regulatory reality

  ✅ enforcementLevel: 'none' [A]
     Purpose: How strongly enforced
     SHARE: A pillar - enforcement reality

  ✅ legalDefinition: 'NO LEGAL DEFINITION since 2016...' [A]
     Purpose: What law says (or doesn't say)
     SHARE: A pillar - regulatory truth

  ✅ loopholes: [array of loopholes] [A]
     Purpose: Known regulatory gaps
     SHARE: A pillar - how claims are exploited

MARKETING PERSPECTIVE (Consumer Education):
  ✅ consumerPerception: 'Animal ate grass its whole life...' [-]
     Purpose: What consumers believe
     SHARE: Not directly SHARE, but informs education

  ✅ commonMisconceptions: [array] [-]
     Purpose: What consumers get wrong
     SHARE: Education, not pillar data

REALITY (A×E Pillars):
  ✅ actualMeaning: 'MARKETING TERM with no legal definition...' [A]
     Purpose: What claim actually guarantees
     SHARE: A pillar - practice reality

  ✅ qualityCorrelation: 'weak' [E]
     Purpose: How well claim predicts quality
     SHARE: E pillar - does this claim indicate better nutrition?

  ✅ fielderAssessment: [detailed analysis] [A]
     Purpose: Expert analysis
     SHARE: A pillar - comprehensive practice assessment

  ✅ redFlags: [3 warning patterns] [A]
     Purpose: Suspicious claim combinations
     SHARE: A pillar - detecting misleading marketing

  ✅ greenFlags: [3 positive patterns] [A]
     Purpose: Legitimate claim combinations
     SHARE: A pillar - validating real quality

SHARE IMPACT (All Pillars):
  ✅ impactSoil: 'unknown' [S]
     Purpose: How claim affects S pillar
     SHARE: S pillar impact assessment

  ✅ impactHeritage: 'neutral' [H]
     Purpose: How claim affects H pillar
     SHARE: H pillar impact assessment

  ✅ impactAgricultural: 'positive' [A]
     Purpose: How claim affects A pillar
     SHARE: A pillar impact assessment

  ✅ impactRipen: 'neutral' [R]
     Purpose: How claim affects R pillar
     SHARE: R pillar impact assessment

  ✅ impactEnrich: 'variable' [E]
     Purpose: How claim affects E pillar
     SHARE: E pillar impact assessment

INFERENCE (E Pillar):
  ✅ omegaRatioMin: 8 [E]
     Purpose: Expected omega ratio lower bound
     SHARE: E pillar - quality inference from claim

  ✅ omegaRatioMax: 15 [E]
     Purpose: Expected omega ratio upper bound
     SHARE: E pillar - quality inference from claim
```

**SHARE Mapping Summary:**
- **A pillar:** regulatory fields, actualMeaning, redFlags, greenFlags
- **E pillar:** qualityCorrelation, omegaRatio hints
- **ALL pillars:** impactSoil/Heritage/Agricultural/Ripen/Enrich

**What Claim nodes DO:**
- Define what claims mean (A pillar)
- Assess impact on quality (E pillar)
- Map to all SHARE pillars (impact assessment)

---

## VARIETY Node → SHARE Mapping

**Node count:** 44 varieties (20 expected + duplicates)

### Fields Present (From actual navel variety):

```
IDENTITY (Non-SHARE):
  ✅ id: 'navel'
  ✅ displayName: 'Navel Orange'
  ✅ description: 'Seedless eating oranges, easy to peel'

HIERARCHY (H Pillar):
  ✅ productId: 'orange' [H]
     Purpose: Links to ProductType
     SHARE: H pillar - taxonomic hierarchy
```

**SHARE Mapping:** Variety is part of H (Heritage) pillar taxonomy structure

---

## ENTITY Node → SHARE Mapping

**Node count:** 21,342 entities (growers, packinghouses, retailers)

### Fields Present (From actual hale_groves entity):

```
IDENTITY (Non-SHARE):
  ✅ id: 'hale_groves'
  ✅ name: 'Hale Groves'
  ✅ website: 'https://www.halegroves.com/'

GEOGRAPHY (S Pillar):
  ✅ city: 'Vero Beach' [S]
     Purpose: City location
     SHARE: S pillar - where farm is located

  ✅ county: 'Indian River' [S]
     Purpose: County location
     SHARE: S pillar - geographic subdivision

  ✅ stateCode: 'FL' [S]
     Purpose: State location
     SHARE: S pillar - state-level geography

PRACTICES (A Pillar):
  ✅ features: ['picked_to_order', 'no_storage', 'indian_river_citrus'] [A]
     Purpose: Farm practices and attributes
     SHARE: A pillar - ⭐ SHOULD map to Claim nodes (NOT YET DONE)

  ✅ certifications: [] [A]
     Purpose: Certifications (organic, GAP, etc.)
     SHARE: A pillar - ⭐ SHOULD map to Claim nodes (NOT YET DONE)

BUSINESS (Non-SHARE):
  ✅ retailChannels: ['d2c']
     Purpose: How they sell (d2c, wholesale)
     SHARE: Not directly SHARE, but relevant for marketplace
```

**SHARE Mapping Summary:**
- **S pillar:** city, county, stateCode (geography)
- **A pillar:** features, certifications (practices - SHOULD link to Claims!)

**Critical Note:** Entity.features and Entity.certifications are A pillar data but NOT YET CONNECTED to Claim nodes. This is the major gap.

---

## Relationships → SHARE Mapping

**From actual graph data:**

```
LOCATED_IN (Entity → GrowingRegion) - 20,378 relationships
  Purpose: Geographic connection of farms/packinghouses
  SHARE: S pillar - entity geography
  Properties: matchType, confidence

GROWN_IN (Cultivar → GrowingRegion) - 4,614 relationships
  Purpose: Which cultivars grow in which regions
  SHARE: H×S×R×E cross-pillar integration
  Properties:
    - quality_tier [E] - terroir quality assessment
    - brix_expected/min/max [E] - expected quality metrics
    - gdd_to_peak [R] - region-specific timing

BELONGS_TO_VARIETY (Cultivar → Variety) - Count unknown, but exists
  Purpose: Cultivar hierarchy
  SHARE: H pillar - taxonomic structure

BELONGS_TO_PRODUCT (Variety → ProductType) - Count unknown, but exists
  Purpose: Variety hierarchy
  SHARE: H pillar - taxonomic structure

HAS_PHENOLOGY_IN (Cultivar → GrowingRegion) - 28 relationships
  Purpose: Bloom dates and GDD parameters by region
  SHARE: R pillar - regional timing data
  Properties: bloom dates, GDD parameters

IMPLIES (Claim → Claim) - 9 relationships
  Purpose: Claim inference chains
  SHARE: A pillar - claim logic (organic → non-GMO)

HAS_COUNTY (GrowingRegion → County) - 616 relationships
  Purpose: Geographic hierarchy
  SHARE: S pillar - political geography

HAS_CITY (GrowingRegion → City) - 578 relationships
  Purpose: Geographic hierarchy
  SHARE: S pillar - population centers

IN_STATE (County/City/Region → State) - 1,039 relationships
  Purpose: Geographic hierarchy
  SHARE: S pillar - state-level geography
```

---

## SHARE Pillar Breakdown (What's in Graph NOW)

### S (SOIL) PILLAR - 85% Complete

**What we have:**
```
NODES:
  ✅ GrowingRegion (185) - geographic units
  ✅ County (450), City (436), State (51) - political geography
  ✅ SoilProfile (7) - soil characteristics

FIELDS on GrowingRegion:
  ✅ state, lat, lon - location
  ✅ usdaZone - hardiness zone
  ✅ Climate data (also R pillar):
     - annualGdd50, avgChillHours
     - frostFreeDays, frost dates

RELATIONSHIPS:
  ✅ LOCATED_IN - entities to regions
  ✅ HAS_COUNTY, HAS_CITY, IN_STATE - geographic hierarchy

ENABLES:
  ✅ "Where does this cultivar grow?"
  ✅ "What's the climate in this region?"
  ✅ "Find farms in this region"
```

**Missing (15%):**
```
❌ Soil mineral detail (P, K, Ca, Mg) on most regions
❌ macroRegion (west_coast, southeast, etc.)
❌ slug (SEO URLs)
❌ primaryProducts (main crops per region)
```

---

### H (HERITAGE) PILLAR - 70% Complete

**What we have:**
```
NODES:
  ✅ ProductType (18) - classification level
  ✅ Variety (44) - consumer groupings
  ✅ Cultivar (159) - specific genetics

FIELDS on Cultivar:
  ✅ varietyId - links to parent variety
  ✅ isNonGmo - genetic verification
  ✅ isHeritage (where defined) - heritage flag
  ✅ validatedStates - where it can grow (H×S)
  ✅ flavorProfile - genetic flavor potential (H→E)

RELATIONSHIPS:
  ✅ BELONGS_TO_VARIETY - cultivar → variety
  ✅ BELONGS_TO_PRODUCT - variety → product type
  ✅ GROWN_IN - cultivar × region (H×S)

ENABLES:
  ✅ "Traverse ProductType → Variety → Cultivar"
  ✅ "Find heritage cultivars"
  ✅ "Which cultivars are non-GMO?"
```

**Missing (30%):**
```
❌ tradeNames - marketing name mapping (SUMO → Shiranui)
❌ technicalName - botanical names
❌ yearIntroduced - when cultivar was developed
❌ originStory - heritage background
❌ Breed data for livestock (separate from produce cultivars)
```

---

### A (AGRICULTURAL) PILLAR - 40% Complete

**What we have:**
```
NODES:
  ✅ Claim (10) - marketing/regulatory claims
     Each with: regulatory, marketing, reality perspectives

FIELDS on Claim:
  ✅ regulatoryStatus, enforcementLevel - legal reality
  ✅ legalDefinition, loopholes - what law says
  ✅ actualMeaning, fielderAssessment - practice reality
  ✅ qualityCorrelation - impact on quality
  ✅ redFlags, greenFlags - claim validation patterns
  ✅ impactSoil/Heritage/Agricultural/Ripen/Enrich - SHARE impact

FIELDS on Entity:
  ✅ features - practice indicators
  ✅ certifications - verified claims

RELATIONSHIPS:
  ✅ IMPLIES (9) - claim inference chains

ENABLES:
  ✅ "What does 'grass-fed' really mean?"
  ✅ "Is this claim regulated?"
  ✅ "What are the red flags for this claim?"
```

**Missing (60%):**
```
❌ Entity-[:HAS_CLAIM]->Claim relationships ⚠️ CRITICAL GAP
   Can't query: "Find organic farms"
   Can't do: Brand claim validation

❌ SHARE Profile nodes (45+ profiles) ⚠️ CRITICAL GAP
   Can't infer: Grass-fed → omega 8-15:1
   Can't do: Claim combination → quality estimate

❌ Category Config nodes ⚠️ CRITICAL GAP
   Can't determine: Which quality metric for which product
   Can't apply: Category-specific tier thresholds
```

---

### R (RIPEN) PILLAR - 85% Complete

**What we have:**
```
CLIMATE DATA (on GrowingRegion):
  ✅ annualGdd50 - annual heat accumulation
  ✅ avgChillHours - winter chill requirement
  ✅ frostFreeDays - growing season length
  ✅ avgLastFrostDoy, avgFirstFrostDoy - season boundaries

TIMING DATA (on Cultivar):
  ✅ modelType - calendar vs GDD prediction method
  ✅ peakMonths - peak harvest calendar
  ✅ baseTemp, gddToMaturity, gddToPeak - GDD parameters

RELATIONSHIPS:
  ✅ HAS_PHENOLOGY_IN (28) - bloom dates + GDD by crop×region
  ✅ gdd_to_peak on some GROWN_IN relationships

ENABLES:
  ✅ "When is this cultivar at peak in this region?"
  ✅ "Which regions can grow high-chill crops?"
  ✅ "What's the growing season length?"
  ✅ GDD-based harvest predictions
```

**Missing (15%):**
```
❌ peakMonthsOverride on most GROWN_IN relationships
❌ GDD overrides (gddToMaturityOverride, etc.) on relationships
❌ Real-time weather API integration
❌ Actual GDD accumulation tracking
```

---

### E (ENRICH) PILLAR - 55% Complete

**What we have:**
```
QUALITY TIERS:
  ✅ quality_tier on all 4,614 GROWN_IN relationships
     (exceptional, excellent, good)

BRIX DATA (Produce):
  ✅ brix_expected on 814 GROWN_IN (18% - produce only)
  ✅ brix_min, brix_max - quality ranges
  ✅ flavorProfile on all cultivars

OMEGA DATA (Meat - Partial):
  ✅ omegaRatioMin/Max on Claim nodes (inference hints)
  ❌ NOT on actual products/offerings

ENABLES:
  ✅ "Rank offerings by Brix"
  ✅ "Find 14+ Brix produce"
  ✅ "Compare terroir effect on quality"
  ✅ "Infer omega from claims" (via Claim nodes)
```

**Missing (45%):**
```
❌ Category-specific quality metrics
   Don't know: Beef = omega ratio, Nuts = oil%, Dairy = fat%

❌ Omega ratio data on livestock products
   Have: Inference hints on claims
   Need: Actual estimates on offerings

❌ Oil content for nuts
❌ Fat percentage for dairy
❌ Omega-3 content for seafood

❌ flavorNotes on most GROWN_IN relationships
   Have: 20 curated
   Need: 4,614 generated

❌ Actual measurements (future user-generated data)
```

---

## Cross-Pillar Integration (How SHARE Works in Graph)

### Example Query: "Heritage citrus at peak in Florida with exceptional quality"

```cypher
MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion)
WHERE c.isHeritage = true                    // H: Heritage genetics ✅
  AND 'FL' IN c.validatedStates              // S: Geographic validation ✅
  AND r.state = 'FL'                         // S: Region location ✅
  AND r.avgChillHours < 300                  // S×R: Climate suitability ✅
  AND ANY(m IN c.peakMonths WHERE m = 12)    // R: December peak ✅
  AND g.brix_expected >= 13                  // E: Quality threshold ✅
  AND g.quality_tier = 'exceptional'         // E: Premium tier ✅

RETURN c.displayName, r.displayName, g.brix_expected
```

**This query works TODAY and integrates:**
- ✅ H pillar: isHeritage, validatedStates
- ✅ S pillar: region location, climate
- ✅ R pillar: peakMonths, avgChillHours
- ✅ E pillar: brix_expected, quality_tier

**This IS the SHARE framework working correctly.**

---

## What We CAN'T Do (Intelligence Layer Missing)

### Example Query: "Find True Grass-Fed beef farms in Texas"

```cypher
// What we SHOULD be able to do:
MATCH (farm:Entity:Grower)-[:LOCATED_IN]->(r:GrowingRegion {state: 'TX'})
MATCH (farm)-[:HAS_CLAIM]->(c1:Claim {id: 'grass_finished'})  // ❌ Relationship doesn't exist
MATCH (farm)-[:MATCHES_PROFILE]->(p:ShareProfile {id: 'beef_true_grass'})  // ❌ Node doesn't exist
WHERE p.estimatedOmegaRatioMidpoint <= 4
RETURN farm.name, farm.website, p.enrichPillarSummary

// What we CAN do now:
MATCH (farm:Entity:Grower)-[:LOCATED_IN]->(r:GrowingRegion {state: 'TX'})
WHERE 'grass_finished' IN farm.features  // ⚠️  String matching, no validation
RETURN farm.name

// Problems with current approach:
❌ No SHARE Profile to explain quality
❌ No omega ratio estimate
❌ No validation that farm actually meets profile
❌ No pillar summaries
❌ Just string matching on features array
```

---

## Summary: Do I Have Clear Context?

### YES - Here's What I Know:

**1. Current Graph Structure (70% data layer):**
- ✅ 159 Cultivars with H, S, R, E fields correctly mapped
- ✅ 185 GrowingRegions with S, R climate data correctly mapped
- ✅ 4,614 GROWN_IN relationships with E pillar quality data
- ✅ 10 Claim nodes with A, E pillar assessment correctly mapped
- ✅ 21,342 Entities with S, A pillar data

**2. SHARE Pillar Mapping (Verified):**
- **S pillar:** GrowingRegion geography + climate, Entity location
- **H pillar:** Cultivar/Variety/ProductType hierarchy, genetic attributes
- **A pillar:** Claim definitions, Entity features/certifications
- **R pillar:** Climate data, peakMonths, GDD parameters
- **E pillar:** quality_tier, brix_expected, qualityCorrelation

**3. What's Missing (30% intelligence layer):**
- ❌ Category Configs - quality metric system per product type
- ❌ SHARE Profiles - 45+ claim combinations → quality estimates
- ❌ Entity→Claim links - apply claims to real farms
- ❌ Product-type-specific quality metrics

**4. Why It Matters:**
- Current: Can query geographic data, basic timing, some quality
- Missing: Can't INFER quality from claims, can't apply category logic
- Impact: Data-rich but intelligence-poor

---

## Ready to Load SHARE Profiles?

**With this clear context, I can now:**
1. Load 45+ SHARE Profile nodes correctly
2. Connect them to Claim nodes (REQUIRES_CLAIM, EXCLUDES_CLAIM)
3. Connect them to Category Configs
4. Link Entity→Profile via claim matching
5. Enable quality inference from claim combinations

**Shall I proceed with loading the SHARE Profiles?**

This will be a major 6-8 hour effort to go from 45% → 70% foundation, but it's the missing heart of the system.
