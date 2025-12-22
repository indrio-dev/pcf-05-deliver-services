# Knowledge Graph ↔ TypeScript Integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER REQUEST                                       │
│  "What's the quality of oranges from Smith Citrus in Vero Beach?"           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KNOWLEDGE GRAPH (Neo4j)                               │
│                                                                              │
│  1. Resolve partial inputs → complete entities                               │
│  2. Traverse relationships → gather context                                  │
│  3. Apply inference chains → fill gaps                                       │
│  4. Return structured KGContext                                              │
│                                                                              │
│  HANDLES: Relationships, inference, sparse data, entity resolution           │
│  STORES: Farms, cultivars, regions, measurements, inference rules            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ KGContext (structured, complete)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TYPESCRIPT PREDICTION ENGINE                            │
│                                                                              │
│  1. Receive resolved context from graph                                      │
│  2. Calculate GDD, Brix predictions, quality scores                          │
│  3. Apply age modifiers, rootstock modifiers                                 │
│  4. Return QualityPrediction with confidence                                 │
│                                                                              │
│  HANDLES: Math, formulas, real-time calculations, weather integration        │
│  REQUIRES: Complete context (graph provides this)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ QualityPrediction
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KNOWLEDGE GRAPH                                    │
│                                                                              │
│  Store prediction for future validation:                                     │
│  - Create (:Prediction) node linked to (:Farm), (:Cultivar), (:Date)        │
│  - Later: Compare to (:Measurement) to improve models                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Step 1: Request Arrives (Partial Data)

```typescript
// User provides what they know (often incomplete)
interface PredictionRequest {
  // Might only have some of these
  farmId?: string
  farmName?: string
  city?: string
  state?: string
  county?: string

  // Crop info (might be vague)
  crop?: string           // "oranges" - not specific
  cultivar?: string       // "washington_navel" - specific
  variety?: string        // "navel" - somewhat specific

  // Optional specifics
  treeAge?: number
  rootstock?: string
  harvestDate?: Date
}

const request: PredictionRequest = {
  farmName: "Smith Citrus",
  city: "Vero Beach",
  state: "FL",
  crop: "oranges"
  // Missing: cultivar, rootstock, age, practices
}
```

### Step 2: Graph Resolves and Infers

```typescript
// The graph client sends this to Neo4j and processes results
interface KGClient {
  resolveContext(request: PredictionRequest): Promise<KGContext>
}

// The graph returns complete context with inferred values
interface KGContext {
  // === RESOLVED ENTITIES ===
  farm: {
    id: string
    name: string
    location: ResolvedLocation
    verificationLevel: 'unverified' | 'self_reported' | 'lab_verified'
  }

  // === GEOGRAPHIC CONTEXT ===
  location: {
    city: string
    county: string
    state: string
    region: string
    growingRegion: string
    soilZone?: string

    // Inferred climate/soil from region
    climate: {
      zone: string
      avgRainfall?: number
      frostRisk?: string
    }
    soil: {
      type?: string
      drainage?: string
      naturalMineralization?: string
    }
  }

  // === CROP CONTEXT (with fallback chain) ===
  crop: {
    productType: string        // "orange"
    variety?: string           // "navel"
    cultivar?: string          // "washington_navel"
    cultivarConfidence: number // How sure we are

    // Lifecycle (from cultivar or inferred from product type)
    lifecycle: CropLifecycle
    ageCurve: AgeModifierType

    // Genetic ceiling (from cultivar or variety defaults)
    brixPotentialMin: number
    brixPotentialMax: number
  }

  // === SHARE PILLARS (inferred where unknown) ===
  share: {
    s: {
      fertilityStrategy?: 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science'
      mineralizedSoil?: boolean
      coverCropping?: boolean
      confidence: number
      source: 'farm_reported' | 'inferred_from_region' | 'unknown'
    }

    h: {
      cultivar: string
      rootstock?: string
      heritageIntent?: HeritageIntent
      brixModifier: number    // From rootstock
      confidence: number
    }

    a: {
      certifications: string[]
      pestManagement?: PestManagement
      // For livestock
      feedingRegime?: FeedingRegime
      confidence: number
      inferredFrom?: string[]  // ["organic_certification", "region_typical"]
    }

    r: {
      treeAge?: number
      ageModifier: number
      ageStage: MaturityStage
      // GDD context
      gddAccumulated?: number
      gddToMaturity?: number
      harvestWindowStatus?: 'pre' | 'early' | 'peak' | 'late' | 'post'
      confidence: number
    }
  }

  // === METADATA ===
  inference: {
    fieldsInferred: string[]   // ["cultivar", "rootstock", "soilType"]
    confidenceByField: Record<string, number>
    warnings: string[]         // ["Low confidence in soil data"]
    suggestVerification: string[]  // ["Get soil test", "Verify cultivar"]
  }
}
```

### Step 3: TypeScript Calculates

```typescript
// prediction-service.ts
import { predictQuality } from '@/lib/prediction/quality-predictor'
import { calculateGDD } from '@/lib/prediction/gdd'

async function getPrediction(request: PredictionRequest): Promise<QualityPrediction> {
  // 1. Get context from graph
  const context = await kgClient.resolveContext(request)

  // 2. Check if we have enough to predict
  if (!context.crop.cultivar && context.crop.cultivarConfidence < 0.3) {
    throw new InsufficientDataError('Cannot determine cultivar')
  }

  // 3. Get current weather for GDD calculation
  const weather = await weatherService.getHistorical(
    context.location.lat,
    context.location.lon,
    context.share.r.seasonStart
  )

  // 4. Calculate GDD
  const gddResult = calculateGDD({
    baseTemp: context.crop.gddBase,
    weatherData: weather,
    startDate: context.share.r.seasonStart
  })

  // 5. Run quality prediction
  const prediction = predictQuality({
    // H pillar (from graph context)
    cultivarId: context.crop.cultivar,
    rootstockId: context.share.h.rootstock,
    brixPotential: context.crop.brixPotentialMax,

    // R pillar (from graph + calculated)
    treeAgeYears: context.share.r.treeAge,
    gddAccumulated: gddResult.accumulated,
    gddToMaturity: context.crop.gddToMaturity,

    // S pillar (from graph inference)
    soilContext: context.share.s,

    // A pillar (from graph inference)
    practices: context.share.a
  })

  // 6. Adjust confidence based on inference quality
  const overallConfidence = Math.min(
    prediction.confidence,
    context.share.h.confidence,
    context.share.r.confidence
  )

  return {
    ...prediction,
    confidence: overallConfidence,
    basedOn: context.inference.fieldsInferred,
    warnings: context.inference.warnings
  }
}
```

### Step 4: Store Result in Graph

```typescript
// After prediction, store it for future validation
async function storePrediction(
  context: KGContext,
  prediction: QualityPrediction
): Promise<void> {
  await kgClient.createPrediction({
    farmId: context.farm.id,
    cultivarId: context.crop.cultivar,
    predictionDate: new Date(),

    // The prediction
    predictedBrix: prediction.predictedBrix,
    predictedTier: prediction.predictedTier,
    confidence: prediction.confidence,

    // Context snapshot (for debugging/learning)
    gddAtPrediction: context.share.r.gddAccumulated,
    ageModifierApplied: context.share.r.ageModifier,
    rootstockModifierApplied: context.share.h.brixModifier,

    // Inference metadata
    inferredFields: context.inference.fieldsInferred
  })
}

// Later, when measurement arrives, link it
async function recordMeasurement(
  predictionId: string,
  measurement: Measurement
): Promise<ValidationResult> {
  // Link measurement to prediction
  await kgClient.linkMeasurement(predictionId, measurement)

  // Calculate accuracy
  const prediction = await kgClient.getPrediction(predictionId)
  const accuracy = 1 - Math.abs(prediction.predictedBrix - measurement.brix) / prediction.predictedBrix

  // If accuracy is poor, flag for model review
  if (accuracy < 0.8) {
    await kgClient.flagForReview(predictionId, {
      reason: 'prediction_deviation',
      predictedBrix: prediction.predictedBrix,
      actualBrix: measurement.brix,
      deviation: measurement.brix - prediction.predictedBrix
    })
  }

  return { accuracy, predictionId, measurementId: measurement.id }
}
```

---

## API Contracts

### KGContext Interface (Full Definition)

```typescript
// types/kg-context.ts

export interface KGContext {
  // === IDENTITY ===
  requestId: string
  timestamp: Date

  // === FARM ===
  farm: ResolvedFarm

  // === LOCATION (complete after inference) ===
  location: ResolvedLocation

  // === CROP (complete after inference) ===
  crop: ResolvedCrop

  // === SHARE PILLARS ===
  share: {
    s: SoilContext
    h: HeritageContext
    a: AgriculturalContext
    r: RipenContext
  }

  // === INFERENCE METADATA ===
  inference: InferenceMetadata
}

export interface ResolvedFarm {
  id: string
  name: string
  website?: string
  verificationLevel: VerificationLevel
  dataSource: string
  lastUpdated: Date
}

export interface ResolvedLocation {
  // Political
  city?: string
  county: string
  state: string
  region: string

  // Agricultural overlays
  growingRegion: string
  soilZone?: string
  usdaZone?: string          // "9b", "7a", etc.

  // Coordinates (for weather)
  lat?: number
  lon?: number

  // Inferred characteristics
  climate: ClimateContext
  soil: SoilCharacteristics
  hardinessZone: HardinessContext
}

export interface HardinessContext {
  zone: string                        // "9b"
  minTempF: number                    // 25
  maxTempF: number                    // 30

  // R pillar: Chill hours
  typicalChillHours: [number, number] // [100, 300]
  chillHoursReliability: 'high' | 'medium' | 'low'

  // R pillar: Frost dates
  avgLastFrostDate?: string           // "Feb 15"
  avgFirstFrostDate?: string          // "Dec 15"
  frostFreeDays?: number              // 300

  // Crop suitability
  suitableCrops: string[]
  marginalCrops: string[]
  unsuitableCrops: string[]
}

export interface ResolvedCrop {
  // Taxonomy (from coarse to specific)
  category: string           // "fruit"
  subcategory: string        // "citrus"
  productType: string        // "orange"
  variety?: string           // "navel"
  cultivar?: string          // "washington_navel"

  // Confidence in cultivar identification
  cultivarConfidence: number

  // Lifecycle (for age modifiers)
  lifecycle: CropLifecycle
  ageCurve: AgeModifierType

  // GDD parameters
  gddBase: number
  gddToMaturity: number
  gddToPeak: number
  gddWindow: number

  // Quality potential
  brixPotentialMin: number
  brixPotentialMax: number
}

export interface SoilContext {
  fertilityStrategy?: FertilityStrategy
  mineralizedSoil?: boolean
  coverCropping?: boolean
  compostApplication?: boolean

  // From soil zone inference
  typicalSoilType?: string
  typicalDrainage?: string

  // Metadata
  confidence: number
  source: 'farm_reported' | 'inferred_from_region' | 'inferred_from_practices' | 'unknown'
}

export interface HeritageContext {
  cultivar?: string
  rootstock?: string
  heritageIntent?: HeritageIntent

  // Modifiers (calculated from cultivar + rootstock)
  cultivarBrixBase: number
  rootstockModifier: number

  // Metadata
  confidence: number
}

export interface AgriculturalContext {
  certifications: string[]
  pestManagement?: PestManagement

  // Livestock-specific
  feedingRegime?: FeedingRegime
  animalWelfare?: string

  // Metadata
  confidence: number
  inferredFrom: string[]
}

export interface RipenContext {
  // Age (for perennials)
  treeAge?: number
  ageModifier: number
  ageStage: MaturityStage

  // Timing (GDD-based)
  seasonStart?: Date
  gddAccumulated?: number
  daysToPeak?: number
  harvestWindowStatus?: HarvestWindowStatus

  // Metadata
  confidence: number
}

export interface InferenceMetadata {
  fieldsInferred: string[]
  confidenceByField: Record<string, number>
  warnings: string[]
  suggestVerification: string[]
  inferenceChainUsed: string[]  // For debugging
}

// Enums
export type VerificationLevel = 'unverified' | 'self_reported' | 'lab_verified' | 'audited'
export type FertilityStrategy = 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science'
export type PestManagement = 'conventional' | 'ipm' | 'organic' | 'no_spray'
export type FeedingRegime = 'grass_only' | 'pasture_grain_supp' | 'grain_finished' | 'grain_fed'
export type HarvestWindowStatus = 'pre' | 'early' | 'peak' | 'late' | 'post'
export type CropLifecycle = 'tree_perennial' | 'bush_perennial' | 'vine_perennial' | 'annual_row' | 'annual_replanted'
export type AgeModifierType = 'tree_standard' | 'bush_standard' | 'vine_standard' | 'none'
export type MaturityStage = 'pre_bearing' | 'juvenile' | 'developing' | 'prime' | 'mature' | 'declining'
export type HeritageIntent = 'true_heritage' | 'heirloom_quality' | 'heirloom_utility' | 'modern_nutrient' | 'modern_flavor' | 'commercial'
```

---

## Graph Query Examples

### Cypher: Full Context Resolution

```cypher
// Input: farmId and cropType
// Output: Complete KGContext

// Parameters
WITH $farmId AS farmId, $cropType AS cropType

// Step 1: Get farm
MATCH (farm:Farm {id: farmId})

// Step 2: Resolve location (bidirectional traversal)
OPTIONAL MATCH (farm)-[:LOCATED_IN_CITY]->(city:City)
OPTIONAL MATCH (city)-[:IN_COUNTY]->(county:County)
OPTIONAL MATCH (farm)-[:LOCATED_IN_COUNTY]->(directCounty:County)
WITH farm, city, COALESCE(county, directCounty) AS county
MATCH (county)-[:IN_STATE]->(state:State)
MATCH (state)-[:IN_REGION]->(region:Region)
MATCH (county)-[:PART_OF_GROWING_REGION]->(growingRegion:GrowingRegion)
OPTIONAL MATCH (growingRegion)-[:CONTAINS_SOIL_ZONE]->(soilZone:SoilZone)

// Step 3: Resolve crop (with fallback chain)
MATCH (pt:ProductType {id: cropType})
OPTIONAL MATCH (farm)-[:GROWS]->(cultivar:Cultivar)
  -[:IS_TYPE]->(pt)
OPTIONAL MATCH (cultivar)-[:HAS_VARIETY]->(variety:Variety)
OPTIONAL MATCH (farm)-[:USES_ROOTSTOCK]->(rootstock:Rootstock)
  WHERE (cultivar)-[:COMPATIBLE_WITH]->(rootstock)

// Step 4: Get certifications
OPTIONAL MATCH (farm)-[:HAS_CERTIFICATION]->(cert:Certification)

// Step 5: Build response
RETURN {
  farm: {
    id: farm.id,
    name: farm.name,
    verificationLevel: COALESCE(farm.verificationLevel, 'unverified')
  },

  location: {
    city: city.name,
    county: county.name,
    state: state.code,
    region: region.name,
    growingRegion: growingRegion.id,
    soilZone: soilZone.id,
    climate: {
      zone: growingRegion.climateZone
    },
    soil: {
      type: soilZone.dominantSoilType,
      drainage: soilZone.drainage
    }
  },

  crop: {
    productType: pt.id,
    variety: variety.id,
    cultivar: cultivar.id,
    cultivarConfidence: CASE
      WHEN cultivar IS NOT NULL THEN 1.0
      WHEN variety IS NOT NULL THEN 0.7
      ELSE 0.4
    END,
    lifecycle: COALESCE(cultivar.lifecycle, pt.defaultLifecycle),
    brixPotentialMax: COALESCE(cultivar.brixPotentialMax, variety.avgBrixMax, pt.genericBrixMax)
  },

  share: {
    h: {
      cultivar: cultivar.id,
      rootstock: rootstock.id,
      rootstockModifier: COALESCE(rootstock.brixModifier, 0)
    },
    a: {
      certifications: collect(DISTINCT cert.name)
    },
    s: {
      fertilityStrategy: farm.fertilityStrategy,
      mineralizedSoil: farm.mineralizedSoil,
      confidence: CASE
        WHEN farm.fertilityStrategy IS NOT NULL THEN 0.8
        ELSE 0.3
      END
    }
  },

  inference: {
    fieldsInferred: CASE
      WHEN cultivar IS NULL THEN ['cultivar']
      ELSE []
    END +
    CASE
      WHEN rootstock IS NULL THEN ['rootstock']
      ELSE []
    END +
    CASE
      WHEN farm.fertilityStrategy IS NULL THEN ['fertilityStrategy']
      ELSE []
    END
  }
} AS context
```

---

## Implementation Notes

### Neo4j Driver Setup

```typescript
// lib/graph/client.ts
import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
)

export class KGClient {
  async resolveContext(request: PredictionRequest): Promise<KGContext> {
    const session = driver.session()
    try {
      const result = await session.run(RESOLVE_CONTEXT_QUERY, {
        farmId: request.farmId,
        cropType: request.crop
      })
      return this.mapToKGContext(result.records[0])
    } finally {
      await session.close()
    }
  }

  async createPrediction(prediction: PredictionRecord): Promise<string> {
    // Store prediction node linked to farm, cultivar, date
  }

  async linkMeasurement(predictionId: string, measurement: Measurement): Promise<void> {
    // Create measurement node and link to prediction
  }
}
```

### Supabase Integration Option

If using Supabase PostgreSQL instead of Neo4j, use recursive CTEs for graph traversal:

```sql
-- Recursive CTE for geographic hierarchy
WITH RECURSIVE geo_chain AS (
  -- Base: start from city
  SELECT id, name, 'city' as level, county_id as parent_id
  FROM cities WHERE name = 'Vero Beach' AND state = 'FL'

  UNION ALL

  -- Recurse up to county
  SELECT c.id, c.name, 'county', c.state_id
  FROM counties c
  JOIN geo_chain gc ON gc.parent_id = c.id AND gc.level = 'city'

  UNION ALL

  -- Recurse up to state
  SELECT s.id, s.name, 'state', s.region_id
  FROM states s
  JOIN geo_chain gc ON gc.parent_id = s.id AND gc.level = 'county'
)
SELECT * FROM geo_chain;
```

---

## Next Steps

1. **Choose graph database**: Neo4j vs Supabase with recursive queries
2. **Seed initial data**: Geographic hierarchy, crop taxonomy
3. **Implement KGClient**: TypeScript client for graph queries
4. **Update quality-predictor.ts**: Accept KGContext instead of raw inputs
5. **Build inference rules**: Populate edge types for common inferences
