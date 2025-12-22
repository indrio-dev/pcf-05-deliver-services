# Fielder Inference Model - Specificity Levels

## Core Principle

**We work with whatever level of specificity the data provides.**

The SHARE framework makes predictions at multiple granularity levels:
- Coarse (ProductType only) → Broad quality range
- Medium (Variety known) → Narrower range  
- Fine (Cultivar known) → Precise prediction

## Data Hierarchy

```
ProductType (ALWAYS HAVE)
    ↓
Variety (SOMETIMES HAVE)
    ↓
Cultivar (RARELY HAVE, HIGH VALUE)
```

### Examples:

| Data We Have | Inference Level | Prediction Capability |
|--------------|-----------------|----------------------|
| "apple" from WA | ProductType | Brix: 10-14 (broad), harvest: Aug-Nov |
| "Dessert apple" from WA | Variety | Brix: 11-13 (narrower), harvest: Sept-Oct |
| "Honeycrisp" from WA | Cultivar | Brix: 12-14 (precise), harvest: mid-Sept |

## What the Graph Models

### ProductType Nodes (18) - REQUIRED FOR ALL
- Orange, Apple, Peach, Blueberry, Strawberry, etc.
- Growers link: `(g:Grower)-[:GROWS]->(pt:ProductType {id: "apple"})`
- **This is the minimum viable data**

### Variety Nodes (27) - OPTIONAL, ADDS PRECISION
- Navel Orange, Freestone Peach, Dessert Apple
- When known: `(g)-[:GROWS]->(v:Variety)-[:HAS_CULTIVAR]->(c:Cultivar)`
- **Adds moderate precision**

### Cultivar Nodes (52) - RARE, HIGHEST VALUE
- Washington Navel, Elberta, Honeycrisp
- When known: `(g)-[:GROWS_CULTIVAR]->(c:Cultivar)`
- **Enables precise SHARE predictions**

## SHARE Predictions by Level

### ProductType Level (Coarse but Functional)

**What we can predict:**
- S Pillar: Region's typical soil (WA apples → volcanic loam, good drainage)
- H Pillar: ProductType baseline quality (apple: 10-14 Brix typical)
- A Pillar: Entity attributes (if farm has organic cert, IPM practices)
- R Pillar: Regional harvest window (WA apples: Aug-Nov general window)
- E Pillar: ProductType quality range (apples: 8-16 Brix possible)

**Confidence:** Medium (50-70%)

**Use case:** Consumer scans apple at grocery store, we predict Brix 10-14, suggest peak season Sept-Oct

### Cultivar Level (Precise)

**What we can predict:**
- S Pillar: Same (region's typical soil)
- H Pillar: **Cultivar genetic ceiling** (Honeycrisp: 12-14 Brix, not 8-10)
- A Pillar: Same (entity practices)
- R Pillar: **Cultivar-specific window** (Honeycrisp: mid-Sept, not Aug-Nov)
- E Pillar: **Precise Brix range** (12-14, not 8-16)

**Confidence:** High (75-90%)

**Use case:** Consumer scans Honeycrisp from WA in September, we predict Brix 13.2 ± 0.8

## What We DON'T Require

**We do NOT need cultivar data for every entity.**

Most farms will just have:
- ProductType list (["apple", "peach", "cherry"])
- Maybe variety hints in notes ("grows Honeycrisp and Gala")
- Rarely: explicit cultivar tracking

## The Inference Strategy

### When Cultivar is Unknown (MOST CASES):

```cypher
// Find grower
MATCH (g:Grower {name: "Smith Orchards"})-[:GROWS]->(pt:ProductType {id: "apple"})
// Find region
MATCH (g)-[:LOCATED_IN_STATE]->(s:State)-[:CONTAINS_GROWING_REGION]->(gr:GrowingRegion)
// Infer likely cultivars from region + timing
MATCH (c:Cultivar {productType: "apple"})-[:SUITABLE_FOR_ZONE]->(z:USDAZone)<-[:TYPICALLY_IN_ZONE]-(gr)
// Return possible cultivars with confidence scores
RETURN c.name, c.brixRange, "inferred from region" as source
```

**Result:** "Probably growing Honeycrisp, Fuji, or Gala (common in WA)" → Use average Brix

### When Cultivar is Known (HIGH-VALUE CASES):

```cypher
// Direct lookup
MATCH (g:Grower)-[:GROWS_CULTIVAR]->(c:Cultivar {name: "Honeycrisp"})
MATCH (c)-[:HAS_GENETIC_CEILING]->(ceiling)
RETURN c.brixRange  // Precise: 12-14
```

**Result:** "Definitely Honeycrisp" → Use specific Brix 12-14

## Impact on Data Collection Priorities

### HIGH Priority (ProductType relationships):
- ✅ Entity → ProductType links (GROWS, SELLS) **Already working**
- ✅ ProductType → Region suitability **Exists**
- Next: Harvest windows by ProductType × Region

### MEDIUM Priority (Variety enrichment):
- Parse entity notes for variety mentions
- "Grows Honeycrisp and Gala" → add variety hints
- Improves precision moderately

### LOWER Priority (Cultivar tracking):
- Only for high-value farms (Fielder marketplace partners)
- Direct farm surveys: "Which cultivars do you grow?"
- Lab-verified farms get cultivar tracking
- Adds maximum precision but requires significant effort

## Current State Assessment

**What works NOW (ProductType level):**
- 319 growers with product lists
- Can answer: "Who grows apples?" (111 farms)
- Can infer: "WA apples harvest Aug-Nov" (regional averages)

**What's missing for Cultivar level:**
- GROWS_CULTIVAR relationships (52 cultivars, 0 links)
- This is EXPECTED and OK - cultivar data is rare
- Don't collect cultivar data broadly; target high-value farms only

**Recommendation:**
- Don't try to get cultivar data for all 634 entities
- Focus on ProductType predictions (functional now)
- Add cultivars for ~50 premium farms (Fielder partners, verified sources)
- Use cultivar data as quality differentiator, not requirement

