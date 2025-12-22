# Inference Chain Examples

## The Problem: Fragmented Data

Farm-to-table data arrives from many sources, each with different completeness:

| Source | What We Get | What's Missing |
|--------|-------------|----------------|
| LocalHarvest | Farm name, city, products | Cultivars, soil, practices |
| Extension services | Cultivar data, GDD requirements | Which farms grow them |
| Lab tests | Brix, omega ratios | Farm practices that caused result |
| Farm websites | Marketing claims | Verification, specifics |
| USDA | Crop statistics by county | Individual farm data |

**The inference engine bridges these gaps.**

---

## Example 1: City-Only Farm Data

### Input (from LocalHarvest scrape)
```json
{
  "farmName": "Happy Acres Citrus",
  "city": "Vero Beach",
  "state": "FL",
  "products": ["oranges", "grapefruit"]
}
```

### Inference Chain

```cypher
// Step 1: Resolve city to full geographic context
MATCH (city:City {name: "Vero Beach", state: "FL"})
MATCH (city)-[:IN_COUNTY]->(county:County)
MATCH (county)-[:IN_STATE]->(state:State)
MATCH (state)-[:IN_REGION]->(region:Region)

// Step 2: Find growing region overlays
MATCH (county)-[:PART_OF_GROWING_REGION]->(growingRegion:GrowingRegion)

// Step 3: Get typical soil zones
OPTIONAL MATCH (growingRegion)-[:CONTAINS_SOIL_ZONE]->(soilZone:SoilZone)

RETURN {
  resolvedLocation: {
    city: city.name,
    county: county.name,
    state: state.code,
    region: region.name,
    growingRegion: growingRegion.id,
    typicalSoilZone: soilZone.id
  },
  inferredContext: {
    climateZone: growingRegion.climateZone,
    avgRainfall: growingRegion.annualRainfallInches,
    primaryCrops: growingRegion.primaryCrops,
    typicalSoilType: soilZone.dominantSoilType,
    drainage: soilZone.drainage,
    naturalMineralization: soilZone.naturalMineralization
  },
  confidences: {
    location: 1.0,        // City name is exact
    growingRegion: 0.95,  // County → region is well-mapped
    soilZone: 0.7         // Typical, not verified for this farm
  }
}
```

### Output
```json
{
  "resolvedLocation": {
    "city": "Vero Beach",
    "county": "Indian River",
    "state": "FL",
    "region": "Southeast",
    "growingRegion": "indian_river_fl",
    "typicalSoilZone": "fl_ridge"
  },
  "inferredContext": {
    "climateZone": "subtropical_humid",
    "avgRainfall": 52,
    "primaryCrops": ["citrus", "blueberry"],
    "typicalSoilType": "sandy_loam",
    "drainage": "excellent",
    "naturalMineralization": "low"
  },
  "confidences": {
    "location": 1.0,
    "growingRegion": 0.95,
    "soilZone": 0.7
  }
}
```

**Now TypeScript has enough context to predict quality**, even though the original data only had city + state.

---

## Example 2: Product Type to Cultivar Inference

### Input (from grocery store scan)
```json
{
  "pluCode": "94012",
  "productLabel": "Organic Naval Oranges",
  "packinghouse": "Indian River Select"
}
```

### Inference Chain

```cypher
// Step 1: Parse PLU code
WITH "94012" AS pluCode
WITH pluCode,
     CASE WHEN left(pluCode, 1) = "9" THEN true ELSE false END AS isOrganic,
     right(pluCode, 4) AS basePlu

// Step 2: Look up PLU → Product Type
MATCH (plu:PLUCode {code: basePlu})-[:IDENTIFIES]->(productType:ProductType)

// Step 3: Get likely cultivars for this product type + region
MATCH (productType)-[:HAS_VARIETY]->(variety)
MATCH (variety)-[:HAS_CULTIVAR]->(cultivar)

// Step 4: Packinghouse → Growing Region
MATCH (packinghouse:Packinghouse {name: "Indian River Select"})
MATCH (packinghouse)-[:SERVES_REGION]->(region:GrowingRegion)

// Step 5: Filter cultivars commonly grown in this region
MATCH (cultivar)-[:COMMONLY_GROWN_IN]->(region)

RETURN {
  parsedPlu: {
    isOrganic: isOrganic,
    basePlu: basePlu
  },
  productType: productType.name,
  likelyCultivars: collect(DISTINCT cultivar.id),
  region: region.id,

  // If only one cultivar is common here, high confidence
  bestGuessCultivar: head(collect(cultivar.id)),
  cultivarConfidence: CASE
    WHEN size(collect(DISTINCT cultivar.id)) = 1 THEN 0.9
    WHEN size(collect(DISTINCT cultivar.id)) <= 3 THEN 0.6
    ELSE 0.3
  END
}
```

### Output
```json
{
  "parsedPlu": {
    "isOrganic": true,
    "basePlu": "4012"
  },
  "productType": "Navel Orange",
  "likelyCultivars": ["washington_navel", "lane_late"],
  "region": "indian_river_fl",
  "bestGuessCultivar": "washington_navel",
  "cultivarConfidence": 0.6
}
```

---

## Example 3: Organic Certification Implies Practices

### Input
```json
{
  "farmId": "uuid-123",
  "certifications": ["USDA Organic"]
}
```

### Inference Chain

```cypher
// Step 1: Get farm with certification
MATCH (farm:Farm {id: "uuid-123"})
MATCH (farm)-[:HAS_CERTIFICATION]->(cert:Certification {name: "USDA Organic"})

// Step 2: Apply organic inference rules
MATCH (cert)-[:IMPLIES]->(implication)
WHERE implication:Practice OR implication:Characteristic

// Step 3: Build inferred practices
WITH farm, collect(implication) AS implications

RETURN {
  farmId: farm.id,
  certifications: ["USDA Organic"],

  inferredFromOrganic: {
    // Organic certification implies these
    syntheticPesticidesAllowed: false,
    syntheticFertilizersAllowed: false,
    gmoAllowed: false,
    irradiationAllowed: false,
    sewageSludgeAllowed: false,

    // What it does NOT imply
    mineralizedSoil: null,      // Organic doesn't require mineralization
    highBrix: null,             // Organic doesn't guarantee quality
    noCAFO: null                // Organic livestock CAN be in CAFO
  },

  warnings: [
    "Organic meat: Check feeding regime - organic doesn't prohibit grain"
  ],

  confidences: {
    practiceInferences: 1.0,    // Organic rules are well-defined
    qualityImplication: 0.0     // Organic doesn't imply higher nutrition
  }
}
```

### Important Nuance

```cypher
// ORGANIC MEAT WARNING: Check for grain feeding
MATCH (farm:Farm)-[:HAS_CERTIFICATION]->(cert:Certification {name: "USDA Organic"})
MATCH (farm)-[:RAISES]->(animal:AnimalType)
WHERE animal.category = "livestock"

// Organic livestock often = grain-fed (just organic grain)
OPTIONAL MATCH (farm)-[:USES_REGIME]->(regime:FeedingRegime)

RETURN farm.name,
       CASE
         WHEN regime.id IN ["grain_finished", "grain_fed"] THEN "RED FLAG: Organic + Grain-Fed"
         WHEN regime IS NULL THEN "WARNING: Feeding regime unknown - assume grain"
         ELSE "OK: " + regime.id
       END AS qualityAssessment
```

---

## Example 4: Livestock Claim Verification

### Input (from brand website scrape)
```json
{
  "brand": "Prairie Fresh Beef",
  "claims": ["grass-fed", "pasture-raised", "no antibiotics"],
  "notMentioned": ["grass-finished", "no feedlot", "100% grass"]
}
```

### Inference Chain

```cypher
// Step 1: Check for CAFO exclusion claims
WITH ["grass-fed", "pasture-raised", "no antibiotics"] AS claims,
     ["grass-finished", "no feedlot", "100% grass", "never confined"] AS cafoExclusions

WITH claims,
     [c IN cafoExclusions WHERE c IN claims] AS foundExclusions

// Step 2: Apply inference rules
WITH claims, foundExclusions,
     CASE
       WHEN size(foundExclusions) > 0 THEN false
       ELSE true  // DEFAULT: Assume CAFO if no exclusion claim
     END AS assumeCAFO

// Step 3: Classify feeding regime
WITH claims, assumeCAFO,
     CASE
       WHEN "100% grass" IN claims OR "grass-finished" IN claims THEN "A_TRUE_GRASS"
       WHEN NOT assumeCAFO AND "pasture-raised" IN claims THEN "B_TRUE_PASTURE"
       WHEN assumeCAFO AND "grass-fed" IN claims THEN "C_MARKETING_GRASS"
       WHEN assumeCAFO AND "pasture-raised" IN claims THEN "D_MARKETING_PASTURE"
       WHEN "no antibiotics" IN claims OR "natural" IN claims THEN "E2_NATURAL"
       ELSE "E_COMMODITY"
     END AS shareProfile

// Step 4: Look up expected omega range for this profile
MATCH (profile:SHAREProfile {id: shareProfile})

RETURN {
  brand: "Prairie Fresh Beef",
  explicitClaims: claims,
  silentOn: ["grass-finished", "no feedlot"],  // These absences are telling

  inference: {
    assumeCAFO: assumeCAFO,
    shareProfile: shareProfile,
    expectedOmegaRange: profile.expectedOmegaRange,
    tier: profile.tier
  },

  reasoning: CASE shareProfile
    WHEN "C_MARKETING_GRASS" THEN
      "Says 'grass-fed' but NOT 'grass-finished'. Likely fed grass THEN finished in feedlot. Omega ~8-15:1."
    WHEN "D_MARKETING_PASTURE" THEN
      "Says 'pasture-raised' without CAFO exclusion. Likely pastured THEN finished in feedlot. Omega ~12-18:1."
    ELSE "Classification based on claim pattern"
  END,

  suggestLabTest: true  // Verify with Edacious test
}
```

### Output
```json
{
  "brand": "Prairie Fresh Beef",
  "explicitClaims": ["grass-fed", "pasture-raised", "no antibiotics"],
  "silentOn": ["grass-finished", "no feedlot"],

  "inference": {
    "assumeCAFO": true,
    "shareProfile": "C_MARKETING_GRASS",
    "expectedOmegaRange": [8, 15],
    "tier": "marketing"
  },

  "reasoning": "Says 'grass-fed' but NOT 'grass-finished'. Likely fed grass THEN finished in feedlot. Omega ~8-15:1.",

  "suggestLabTest": true
}
```

---

## Example 5: Bidirectional Traversal - Farm Discovery

Sometimes we start from measurements and work backward.

### Input (from Edacious lab results)
```json
{
  "sampleId": "ED-2024-1234",
  "product": "ribeye steak",
  "omega6To3Ratio": 4.2,
  "packagingLabel": "Everglades Ranch American Wagyu"
}
```

### Inference Chain

```cypher
// Step 1: The ratio tells us about feeding regime
WITH 4.2 AS measuredRatio

WITH measuredRatio,
     CASE
       WHEN measuredRatio <= 3.0 THEN "A_TRUE_GRASS"
       WHEN measuredRatio <= 7.0 THEN "B_TRUE_PASTURE"
       WHEN measuredRatio <= 20.0 THEN "C-E_FEEDLOT"
       ELSE "F_PREMIUM_CAFO"
     END AS impliedProfile

// Step 2: Find or create farm node
MERGE (farm:Farm {name: "Everglades Ranch"})

// Step 3: Update farm with verified data
SET farm.verifiedOmegaRange = [4.0, 5.0]  // Based on this + historical tests
SET farm.feedingRegime = "pasture_grain_supp"  // Inferred from ratio
SET farm.verificationLevel = "lab_verified"

// Step 4: Look up Everglades Ranch location for full context
OPTIONAL MATCH (farm)-[:LOCATED_IN_STATE]->(state)
WITH farm, impliedProfile, state

// Step 5: If we don't know location, work backward from product distribution
OPTIONAL MATCH (product:Product)-[:GROWN_BY]->(farm)
OPTIONAL MATCH (product)-[:SOLD_AT]->(retailer)
OPTIONAL MATCH (retailer)-[:LOCATED_IN]->(city)

RETURN {
  labResult: {
    measuredRatio: 4.2,
    impliedProfile: "B_TRUE_PASTURE",
    tier: "premium"
  },

  farmUpdate: {
    name: "Everglades Ranch",
    inferredFeedingRegime: "pasture_grain_supp",
    verificationLevel: "lab_verified"
  },

  validation: CASE
    WHEN farm.claimedFeedingRegime IS NULL THEN "No prior claim to validate"
    WHEN farm.claimedFeedingRegime = "pasture_grain_supp" THEN "CONSISTENT: Claim matches lab result"
    WHEN farm.claimedFeedingRegime = "grass_only" THEN "INCONSISTENT: Claims 100% grass but ratio suggests grain supplementation"
    ELSE "Needs investigation"
  END
}
```

---

## Example 6: USDA Zone → Chill Hours Validation

### Input
```json
{
  "farmId": "uuid-789",
  "city": "Vero Beach",
  "state": "FL",
  "claimedCrops": ["peach", "apple", "blueberry"]
}
```

### Inference Chain

```cypher
// Step 1: Get USDA zone from location
MATCH (city:City {name: "Vero Beach", state: "FL"})
MATCH (city)-[:IN_USDA_ZONE]->(zone:USDAZone)

// Step 2: Get chill hour requirements for claimed crops
WITH zone, ["peach", "apple", "blueberry"] AS claimedCrops
UNWIND claimedCrops AS cropName
MATCH (crop:ProductType {name: cropName})

// Step 3: Compare zone chill hours to crop requirements
WITH zone, crop,
     zone.typicalChillHours[1] AS maxZoneChillHours,
     crop.minChillHoursRequired AS cropChillReq

RETURN {
  usdaZone: zone.zone,
  zoneChillHours: zone.typicalChillHours,

  cropValidation: collect({
    crop: crop.name,
    requiredChillHours: cropChillReq,
    status: CASE
      WHEN cropChillReq IS NULL THEN "unknown_requirement"
      WHEN cropChillReq <= maxZoneChillHours THEN "suitable"
      WHEN cropChillReq <= maxZoneChillHours * 1.3 THEN "marginal"
      ELSE "unsuitable"
    END,
    recommendation: CASE
      WHEN crop.name = "peach" AND zone.zone STARTS WITH "9" THEN
        "Must use low-chill varieties: TropicBeauty (150hr), FlordaPrince (150hr), UFSun (100hr)"
      WHEN crop.name = "apple" AND zone.zone STARTS WITH "9" THEN
        "Must use low-chill varieties: Anna (200hr), Dorsett Golden (100hr), TropicSweet (300hr)"
      WHEN crop.name = "blueberry" THEN
        "Southern Highbush varieties suitable: Emerald, Jewel, Star"
      ELSE null
    END
  })
}
```

### Output
```json
{
  "usdaZone": "9b",
  "zoneChillHours": [100, 300],

  "cropValidation": [
    {
      "crop": "peach",
      "requiredChillHours": 850,
      "status": "unsuitable",
      "recommendation": "Must use low-chill varieties: TropicBeauty (150hr), FlordaPrince (150hr), UFSun (100hr)"
    },
    {
      "crop": "apple",
      "requiredChillHours": 800,
      "status": "unsuitable",
      "recommendation": "Must use low-chill varieties: Anna (200hr), Dorsett Golden (100hr), TropicSweet (300hr)"
    },
    {
      "crop": "blueberry",
      "requiredChillHours": 150,
      "status": "suitable",
      "recommendation": "Southern Highbush varieties suitable: Emerald, Jewel, Star"
    }
  ]
}
```

**Key Insight**: The farm claims to grow peaches and apples in Zone 9b. This is only possible with specific low-chill cultivars. The graph flags this for verification - either they're using the right varieties, or their claims are incorrect.

---

## Example 7: Cultivar → Age Curve Inference

### Input
```json
{
  "farmId": "uuid-456",
  "crop": "blueberry",
  "plantAge": 4
}
```

### Inference Chain

```cypher
// Step 1: Resolve crop to cultivar/lifecycle
MATCH (crop:ProductType {name: "blueberry"})
OPTIONAL MATCH (crop)-[:HAS_VARIETY]->()-[:HAS_CULTIVAR]->(cultivar)

// Step 2: Get lifecycle from cultivar or crop type
WITH crop, cultivar,
     COALESCE(cultivar.lifecycle, crop.defaultLifecycle) AS lifecycle

// Step 3: Lifecycle → Age curve
MATCH (lc:Lifecycle {type: lifecycle})-[:USES_AGE_CURVE]->(curve:AgeCurve)

// Step 4: Look up modifier for this age
WITH lifecycle, curve, 4 AS plantAge

RETURN {
  crop: "blueberry",
  resolvedLifecycle: lifecycle,  // "bush_perennial"
  ageCurve: curve.type,          // "bush_standard"

  ageModifier: CASE curve.type
    WHEN "bush_standard" THEN
      CASE
        WHEN plantAge < 1 THEN {modifier: -0.8, stage: "pre_bearing"}
        WHEN plantAge <= 2 THEN {modifier: -0.5, stage: "juvenile"}
        WHEN plantAge <= 5 THEN {modifier: 0.0, stage: "prime"}
        WHEN plantAge <= 10 THEN {modifier: -0.1, stage: "mature"}
        ELSE {modifier: -0.3, stage: "declining"}
      END
    ELSE {modifier: 0.0, stage: "prime"}  // Default for unknown
  END,

  insight: CASE
    WHEN plantAge >= 3 AND plantAge <= 5 THEN "Prime production years for blueberry"
    WHEN plantAge < 3 THEN "Still developing, expect improving quality each year"
    ELSE "Past prime but still productive"
  END
}
```

### Output
```json
{
  "crop": "blueberry",
  "resolvedLifecycle": "bush_perennial",
  "ageCurve": "bush_standard",

  "ageModifier": {
    "modifier": 0.0,
    "stage": "prime"
  },

  "insight": "Prime production years for blueberry"
}
```

---

## Confidence Propagation

When chaining inferences, confidence compounds:

```cypher
// Multi-hop inference with confidence tracking
MATCH path = (farm:Farm)-[:LOCATED_IN_CITY]->(city)
              -[:IN_COUNTY]->(county)
              -[:PART_OF_GROWING_REGION]->(region)
              -[:CONTAINS_SOIL_ZONE]->(soil)

WITH farm, city, county, region, soil,
     1.0 AS cityConf,           // Exact match
     0.95 AS countyConf,        // Well-mapped
     0.85 AS regionConf,        // Some counties span regions
     0.7 AS soilConf            // Typical, not verified

// Compound confidence = product of steps
WITH farm, soil,
     cityConf * countyConf * regionConf * soilConf AS compoundConfidence

RETURN farm.name,
       soil.id AS inferredSoilZone,
       compoundConfidence,       // 0.57 = still usable but flagged
       CASE
         WHEN compoundConfidence > 0.8 THEN "HIGH"
         WHEN compoundConfidence > 0.5 THEN "MEDIUM"
         ELSE "LOW - needs verification"
       END AS confidenceLevel
```

---

## Integration Pattern

The inference engine returns structured context for TypeScript:

```typescript
interface InferenceResult {
  // Resolved entities
  farm: ResolvedFarm
  cultivar: ResolvedCultivar
  region: ResolvedRegion

  // Inferred SHARE context
  share: {
    s: SoilContext & { confidence: number }
    h: HeritageContext & { confidence: number }
    a: AgriculturalContext & { confidence: number }
    r: RipenContext & { confidence: number }
  }

  // Metadata
  inferredFields: string[]
  confidenceByField: Record<string, number>
  warnings: string[]
  suggestVerification: string[]
}

// TypeScript uses this for predictions
async function predictQuality(farmId: string): Promise<QualityPrediction> {
  // 1. Query graph for inference result
  const context = await graphClient.inferContext(farmId)

  // 2. Check confidence thresholds
  if (context.share.s.confidence < 0.5) {
    context.warnings.push("Low confidence in soil data - consider soil test")
  }

  // 3. Run TypeScript predictions with inferred context
  const prediction = calculatePrediction(context)

  // 4. Return with provenance
  return {
    ...prediction,
    basedOn: context.inferredFields,
    confidence: Math.min(...Object.values(context.confidenceByField))
  }
}
```
