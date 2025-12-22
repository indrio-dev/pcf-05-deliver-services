# Fielder Knowledge Graph Schema

## Design Philosophy

**The data landscape is fragmented.** Farm-to-table product data, growing information, and quality metrics don't exist in any single source. We can't just call an API and get complete records.

**The solution: Extensive nodes + inference chains.**
1. Define comprehensive node structures with many optional properties
2. Populate what we CAN from various sources (farms, labs, extension services, USDA, etc.)
3. Use inference edges to fill gaps based on relationships and rules

**What the graph handles vs. TypeScript:**
- **Graph**: Relationships, inference, traversal, sparse data → complete picture
- **TypeScript**: Computation (GDD math, Brix formulas), real-time predictions

---

## Geographic Hierarchy

Farm-to-table data often arrives with partial geographic information. We need bidirectional traversal to complete the picture.

### Node Types

```cypher
// Political Geography (stable, well-defined)
(:Country {
  code: "US",
  name: "United States"
})

(:Region {
  id: "southeast",
  name: "Southeast",
  states: ["FL", "GA", "AL", "SC", "NC", "TN", "MS", "LA"]
})

(:State {
  code: "FL",
  name: "Florida",
  fips: "12"
})

(:County {
  fips: "12061",        // Full FIPS (state + county)
  name: "Indian River",
  state: "FL"
})

(:City {
  name: "Vero Beach",
  county: "Indian River",
  state: "FL",
  lat: 27.6386,
  lon: -80.3973,
  zip?: "32960"         // Optional - many sources don't have this
})
```

### Political Edges (Well-Defined)

```cypher
(country)-[:CONTAINS_REGION]->(region)
(region)-[:CONTAINS_STATE]->(state)
(state)-[:CONTAINS_COUNTY]->(county)
(county)-[:CONTAINS_CITY]->(city)
```

These edges support **bidirectional traversal**:
- Top-down: "What cities are in Indian River County?"
- Bottom-up: "City Vero Beach → County Indian River → State FL → Region Southeast"

### Agricultural Overlays

Agricultural concepts overlay political geography but don't align perfectly.

```cypher
(:GrowingRegion {
  id: "indian_river_fl",
  name: "Indian River District",
  description: "Florida's premium citrus belt",
  primaryCrops: ["citrus", "blueberry"],

  // Climate characteristics (for inference)
  climateZone: "subtropical_humid",
  avgFirstFrost?: "rarely",
  avgLastFrost?: "rarely",
  annualRainfallInches?: 52,

  // Soil characteristics (S pillar inference)
  dominantSoilType?: "sandy_loam",
  typicalPh?: [5.5, 6.5],
  naturalMineralization?: "moderate"
})

(:SoilZone {
  id: "fl_ridge",
  name: "Florida Ridge",
  description: "Ancient sand dune with excellent drainage",

  // Soil specifics (for S pillar)
  drainage: "excellent",
  organicMatter: "low",
  naturalMineralization: "low",
  typicalPh: [5.0, 6.0],

  // Inference: crops that thrive here
  wellSuitedCrops: ["citrus", "blueberry", "strawberry"]
})

(:USDAZone {
  zone: "9b",
  name: "USDA Hardiness Zone 9b",

  // Temperature bounds (what defines the zone)
  minTempF: 25,
  maxTempF: 30,

  // R pillar: Chill hours (critical for fruit trees)
  typicalChillHours: [100, 300],   // Range for this zone
  chillHoursReliability: "low",    // FL 9b is marginal for stone fruit

  // R pillar: Frost dates
  avgLastFrostDate?: "Feb 15",
  avgFirstFrostDate?: "Dec 15",
  frostFreeDays?: 300,

  // R pillar: Growing season
  growingSeasonDays: [280, 320],

  // Inference: What can grow here
  suitableCrops: ["citrus", "subtropical_fruit", "low_chill_stone_fruit"],
  marginalCrops: ["apple", "cherry"],  // Need >500 chill hours
  unsuitableCrops: ["high_chill_varieties"]
})
```

### Agricultural Overlay Edges

```cypher
// Growing regions span counties (M:N relationship)
(county)-[:PART_OF_GROWING_REGION]->(growingRegion)
(growingRegion)-[:INCLUDES_COUNTY]->(county)

// Soil zones are more granular, within growing regions
(growingRegion)-[:CONTAINS_SOIL_ZONE]->(soilZone)
(farm)-[:LOCATED_IN_SOIL_ZONE]->(soilZone)

// USDA zones overlay at zip/county level
(county)-[:IN_USDA_ZONE]->(usdaZone)      // Most counties are single zone
(city)-[:IN_USDA_ZONE]->(usdaZone)         // More precise when available
(farm)-[:IN_USDA_ZONE]->(usdaZone)         // Most precise - from coordinates

// Some counties span zone boundaries
(county)-[:SPANS_USDA_ZONES]->(usdaZone)   // M:N for border counties
```

### Partial Data Inference Example

```cypher
// DATA: We only know a farm is in "Vero Beach, FL"
// INFERENCE CHAIN:
(:Farm {name: "Smith Citrus"})
  -[:LOCATED_IN]->(:City {name: "Vero Beach"})
  -[:IN_COUNTY]->(:County {name: "Indian River"})
  -[:PART_OF_GROWING_REGION]->(:GrowingRegion {id: "indian_river_fl"})
  -[:CONTAINS_SOIL_ZONE]->(:SoilZone {id: "fl_ridge"})

// USDA Zone inference (from city or county)
(:City {name: "Vero Beach"})
  -[:IN_USDA_ZONE]->(:USDAZone {zone: "9b"})

// Now we can INFER:
// - S pillar hints: sandy_loam, excellent drainage, low organic matter
// - R pillar hints: Zone 9b → 100-300 chill hours, ~300 frost-free days
// - Climate: subtropical_humid, minimal frost risk
// - Expected crops: citrus excellent, low-chill stone fruit possible, high-chill varieties unsuitable
// - Chill hour validation: If they claim peaches, must be low-chill varieties (TropicBeauty, FlordaPrince)
```

---

## Crop Hierarchy

### Node Types

```cypher
(:Category {
  id: "fruit",
  name: "Fruit"
})

(:Subcategory {
  id: "citrus",
  name: "Citrus",
  lifecycle: "tree_perennial"
})

(:ProductType {
  id: "orange",
  name: "Orange",
  scientificName: "Citrus sinensis"
})

(:Variety {
  id: "navel",
  name: "Navel Orange",
  characteristics: ["seedless", "easy_peel"],

  // Partial data - filled from various sources
  avgBrixBase?: 11.0,
  harvestSeasonNorth?: ["Nov", "Dec", "Jan", "Feb"],
  harvestSeasonFlorida?: ["Oct", "Nov", "Dec", "Jan"]
})

(:Cultivar {
  id: "washington_navel",
  name: "Washington Navel",
  tradeName?: "Navel Orange",

  // H pillar data (genetic ceiling)
  brixPotentialMin: 11.0,
  brixPotentialMax: 14.0,
  heritageIntent: "heirloom_quality",  // or 'commercial', 'modern_flavor', etc.
  yearIntroduced?: 1870,
  origin?: "Brazil via USDA",

  // GDD requirements (R pillar)
  gddBase?: 55,
  gddToMaturity?: 2800,
  gddToPeak?: 3200,

  // Maturity profile (for age modifiers)
  lifecycle: "tree_perennial",
  yearsToFirstBearing?: 3,
  primeAgeRange?: [8, 18],
  productiveLifespan?: 50
})

(:Rootstock {
  id: "carrizo",
  name: "Carrizo Citrange",

  // H pillar modifier
  brixModifier: 0.6,

  // Disease resistance (A pillar implications)
  ctvResistant: true,
  phytophthoraResistant: true,
  coldHardyZone?: 9,

  // Agronomic characteristics
  vigor: "moderate",
  treeSize: "standard",
  yieldPotential: "high"
})
```

### Crop Hierarchy Edges

```cypher
(category)-[:HAS_SUBCATEGORY]->(subcategory)
(subcategory)-[:HAS_PRODUCT_TYPE]->(productType)
(productType)-[:HAS_VARIETY]->(variety)
(variety)-[:HAS_CULTIVAR]->(cultivar)
(cultivar)-[:COMPATIBLE_WITH]->(rootstock)  // Valid combinations
```

---

## Farm Node (The Core Entity)

Farms are sparse by default - we populate what we find.

```cypher
(:Farm {
  id: "uuid",
  name: "Smith Citrus Grove",

  // === LOCATION (may be partial) ===
  address?: "1234 Orange Blossom Trail",
  city?: "Vero Beach",
  county?: "Indian River",
  state: "FL",                   // Often the only thing we know
  zip?: "32960",
  lat?: 27.6386,
  lon?: -80.3973,

  // === S PILLAR (Soil) - Often unknown ===
  soilType?: "sandy_loam",
  soilPh?: 5.8,
  organicMatter?: 2.1,
  fertilityStrategy?: "mineralized_soil_science",  // or 'annual_fertility', 'soil_banking'
  coverCropping?: true,
  compostApplication?: true,
  mineralizedSoil?: null,        // KEY field - often unknown, huge impact

  // === A PILLAR (Agricultural) - Partially known ===
  certifications?: ["organic", "gmo_free"],
  pestManagement?: "ipm",        // or 'organic', 'conventional', 'no_spray'
  irrigationType?: "drip",

  // For livestock
  feedingRegime?: "grass_only",  // or 'pasture_grain_supp', 'grain_finished', 'grain_fed'
  animalWelfare?: "pasture_raised",
  noAntibiotics?: true,
  noHormones?: true,

  // === METADATA ===
  website?: "https://smithcitrus.com",
  dataSource?: "manual_research",
  verificationLevel?: "unverified",  // or 'self_reported', 'lab_verified', 'audited'
  lastUpdated?: "2024-12-20",

  // === INFERENCE FLAGS ===
  inferredFromCity?: true,       // Track what was inferred vs. known
  inferredSoilZone?: "fl_ridge"
})
```

### Farm Edges

```cypher
// Location (multiple possible entry points)
(farm)-[:LOCATED_IN_CITY]->(city)
(farm)-[:LOCATED_IN_COUNTY]->(county)
(farm)-[:LOCATED_IN_STATE]->(state)
(farm)-[:IN_GROWING_REGION]->(growingRegion)
(farm)-[:IN_SOIL_ZONE]->(soilZone)

// What they grow
(farm)-[:GROWS]->(cultivar)
(farm)-[:USES_ROOTSTOCK]->(rootstock)

// Verification
(farm)-[:HAS_CERTIFICATION]->(certification)
(farm)-[:VERIFIED_BY]->(lab)
```

---

## Product & Measurement Nodes

```cypher
(:Product {
  id: "uuid",
  sku?: "SMITH-NAVEL-10LB",
  name: "Smith Citrus Washington Navel Oranges",

  // Links to taxonomy
  cultivarId: "washington_navel",
  rootstockId?: "carrizo",
  farmId: "smith_citrus_uuid",

  // Retail attributes
  weight?: 10,
  weightUnit?: "lb",
  pricePerUnit?: 45.00,

  // H pillar
  treeAgeYears?: 12,

  // R pillar (for this product batch)
  harvestDate?: "2024-12-01",
  gddAtHarvest?: 3150
})

(:Measurement {
  id: "uuid",
  productId: "product_uuid",
  measurementDate: "2024-12-15",

  // E pillar - Primary nutrition
  brix?: 12.3,
  acidity?: 0.72,
  brixAcidRatio?: 17.1,

  // E pillar - For livestock
  omega6To3Ratio?: null,

  // E pillar - Secondary nutrition
  vitaminC?: 53.2,
  lycopene?: null,
  betaCarotene?: null,

  // Verification
  measurementMethod: "refractometer",  // or 'lab_nir', 'lab_full_panel'
  labName?: "Edacious",
  isVerified: true,

  // Source
  measuredBy: "consumer",  // or 'farm', 'lab', 'fielder_staff'
  deviceId?: "uuid"
})
```

### Product & Measurement Edges

```cypher
(product)-[:GROWN_BY]->(farm)
(product)-[:IS_CULTIVAR]->(cultivar)
(product)-[:USES_ROOTSTOCK]->(rootstock)
(measurement)-[:MEASURES]->(product)
(measurement)-[:VERIFIED_BY]->(lab)
```

---

## Inference Chains (The Magic)

Inference edges encode rules that let us derive missing data.

### Inference Edge Types

```cypher
// Organic certification implies no synthetic pesticides
(:Certification {name: "organic"})
  -[:IMPLIES {
    confidence: 1.0,
    rule: "organic_implies_practices"
  }]->(:Practice {pestManagement: "organic"})

// Organic also implies non-GMO
(:Certification {name: "organic"})
  -[:IMPLIES {confidence: 1.0}]->(:Characteristic {nonGMO: true})

// Region implies typical soil
(:GrowingRegion {id: "indian_river_fl"})
  -[:TYPICALLY_HAS {confidence: 0.7}]->(:SoilZone {id: "fl_ridge"})

// Cultivar implies lifecycle and age curve
(:Cultivar {id: "washington_navel"})
  -[:HAS_LIFECYCLE {confidence: 1.0}]->(:Lifecycle {type: "tree_perennial"})

// Lifecycle implies age modifier type
(:Lifecycle {type: "tree_perennial"})
  -[:USES_AGE_CURVE {confidence: 1.0}]->(:AgeCurve {type: "tree_standard"})

// Trade name implies cultivar
(:TradeName {name: "SUMO"})
  -[:IS_TRADE_NAME_FOR {confidence: 1.0}]->(:Cultivar {id: "shiranui"})

// PLU prefix implies certification
(:PLUPrefix {code: "9"})
  -[:INDICATES {confidence: 1.0}]->(:Certification {name: "organic"})
```

### Inference Example: Filling Gaps

```cypher
// INPUT: We only know these facts about a farm
(:Farm {name: "Mystery Citrus", state: "FL", city: "Fort Pierce"})
  -[:GROWS]->(:Cultivar {id: "washington_navel"})

// INFERENCE CHAIN 1: Geographic
// Fort Pierce → St. Lucie County → Indian River District → FL Ridge soil zone
// INFERRED: S pillar hints (sandy_loam, excellent drainage)

// INFERENCE CHAIN 2: Crop lifecycle
// washington_navel → tree_perennial → uses tree_standard age curve
// INFERRED: Prime age 8-18 years, pre-bearing modifier -0.8

// INFERENCE CHAIN 3: Regional norms
// Indian River District → typical practices → often IPM, quality-focused
// INFERRED: A pillar hints (likely careful growers, not commodity)

// OUTPUT: We can now make predictions even with sparse input
```

---

## Livestock-Specific Nodes

```cypher
(:Breed {
  id: "american_wagyu",
  name: "American Wagyu",
  category: "beef",

  // H pillar - genetic impact on omega
  omegaModifier: 0.8,  // Wagyu tends higher omega-6 due to marbling
  marblingPotential: "exceptional",

  // Typical raising
  typicalFinishing?: "grain_finished",  // Default assumption
  daysToMarketMin?: 600,
  daysToMarketMax?: 900
})

(:FeedingRegime {
  id: "grass_only",
  name: "100% Grass-Fed/Finished",

  // A pillar definition
  requiresNoGrain: true,
  requiresNoFeedlot: true,
  typicalDuration: "18-24 months",

  // E pillar expected outcome
  expectedOmegaRatio: [2.0, 4.0],

  // Inference implications
  impliesNaturalBehavior: true
})
```

### Livestock Inference Edges

```cypher
// "Grass-fed" label WITHOUT "grass-finished" implies grain finishing
(:Label {claim: "grass-fed"})
  -[:IMPLIES_WITHOUT {
    missingClaim: "grass-finished",
    confidence: 0.85
  }]->(:FeedingRegime {id: "grain_finished"})

// Extended feedlot duration worsens omega ratio
(:FeedingRegime {id: "grain_finished"})
  -[:MODIFIED_BY {
    factor: "duration",
    formula: "+0.5 ratio per month beyond 4"
  }]->(:OmegaImpact)

// Breed + Feeding Regime → Expected Omega (for verification)
(:Breed {id: "american_wagyu"})
  -[:WITH_REGIME]->(:FeedingRegime {id: "grass_only"})
  -[:EXPECTS_OMEGA {range: [3.0, 5.0]}]->(:OmegaRange)
```

---

## Data Source Tracking

Every node should track where its data came from.

```cypher
(:DataSource {
  id: "uf_ifas",
  name: "UF/IFAS Extension",
  type: "academic",
  reliability: "high",
  url: "https://edis.ifas.ufl.edu/"
})

(:DataSource {
  id: "farm_self_report",
  name: "Farm Self-Reported",
  type: "self_report",
  reliability: "medium",  // Needs verification
  verificationMethod: "lab_test"
})

(:DataSource {
  id: "edacious_lab",
  name: "Edacious Lab Testing",
  type: "lab",
  reliability: "verified",
  testsProvided: ["omega_ratio", "nutrient_panel"]
})
```

### Provenance Edges

```cypher
// Track which source populated which property
(farm)-[:PROPERTY_FROM {
  property: "soilType",
  value: "sandy_loam",
  confidence: 0.7,
  dateCollected: "2024-12-01"
}]->(dataSource)

// Multiple sources can contribute to same node
(cultivar)-[:PROPERTY_FROM {property: "brixPotentialMax"}]->(source1)
(cultivar)-[:PROPERTY_FROM {property: "gddToMaturity"}]->(source2)
```

---

## Query Patterns

### Bottom-Up Geographic Lookup

```cypher
// Given only a city, find everything up to region and soil zone
MATCH (city:City {name: "Vero Beach", state: "FL"})
MATCH (city)-[:IN_COUNTY]->(county)
MATCH (county)-[:PART_OF_GROWING_REGION]->(region)
MATCH (region)-[:IN_STATE]->(state)
MATCH (state)-[:IN_REGION]->(usRegion)
OPTIONAL MATCH (region)-[:CONTAINS_SOIL_ZONE]->(soil)
RETURN city, county, region, state, usRegion, soil
```

### Farm Quality Inference

```cypher
// Given a farm with partial data, infer SHARE pillar hints
MATCH (farm:Farm {id: $farmId})

// S pillar: from location → soil zone → typical soil
OPTIONAL MATCH (farm)-[:IN_GROWING_REGION]->(region)
OPTIONAL MATCH (region)-[:CONTAINS_SOIL_ZONE]->(soil)

// H pillar: from what they grow
MATCH (farm)-[:GROWS]->(cultivar)
OPTIONAL MATCH (cultivar)-[:COMPATIBLE_WITH]->(rootstock)
WHERE (farm)-[:USES_ROOTSTOCK]->(rootstock)

// A pillar: from certifications and practices
OPTIONAL MATCH (farm)-[:HAS_CERTIFICATION]->(cert)

RETURN farm, region, soil, cultivar, rootstock, cert
```

### Validate Feeding Regime Claim

```cypher
// Does claimed omega ratio match expected range for regime?
MATCH (farm:Farm {id: $farmId})-[:RAISES]->(breed:Breed)
MATCH (farm)-[:USES_REGIME]->(regime:FeedingRegime)
MATCH (product:Product)-[:GROWN_BY]->(farm)
MATCH (measurement:Measurement)-[:MEASURES]->(product)
WHERE measurement.omega6To3Ratio IS NOT NULL

WITH farm, regime, measurement,
     regime.expectedOmegaRatio[0] AS expectedMin,
     regime.expectedOmegaRatio[1] AS expectedMax

RETURN farm.name,
       regime.name AS claimedRegime,
       measurement.omega6To3Ratio AS actualRatio,
       CASE
         WHEN measurement.omega6To3Ratio <= expectedMax THEN "consistent"
         ELSE "inconsistent - investigate claim"
       END AS verification
```

---

## Integration with TypeScript Engine

The knowledge graph complements the TypeScript prediction engine:

| Step | System | What Happens |
|------|--------|--------------|
| 1 | Graph | Resolve partial inputs → complete context |
| 2 | Graph | Apply inference chains → fill gaps |
| 3 | TypeScript | Calculate GDD, Brix, quality scores |
| 4 | Graph | Store prediction + measurement |
| 5 | Graph | Feed back for improved inference |

### API Boundary

```typescript
interface KGContext {
  // Geographic (after inference)
  growingRegion: string
  soilZone?: string
  climateZone: string

  // Crop (after inference)
  cultivar: Cultivar
  rootstock?: Rootstock
  lifecycle: CropLifecycle

  // Farm (after inference)
  fertilityStrategy?: FertilityStrategy
  pestManagement?: PestManagement
  mineralizedSoil?: boolean

  // Inference metadata
  inferredFields: string[]
  confidenceScores: Record<string, number>
}

// TypeScript receives resolved context, does computation
function predictQuality(context: KGContext): QualityPrediction {
  // Use context.cultivar.brixPotentialMax
  // Use context.rootstock?.brixModifier
  // Apply GDD formulas
  // Return prediction
}
```

---

## Next Steps

1. **Seed geographic data**: Counties, cities, growing regions, soil zones
2. **Seed crop taxonomy**: Categories → cultivars with known attributes
3. **Implement inference engine**: Rules for filling gaps
4. **Build farm collection pipeline**: Populate from research
5. **Create verification loop**: Measurement → validate/update inference rules
