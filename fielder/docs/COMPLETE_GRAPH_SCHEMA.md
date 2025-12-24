# Complete TypeScript → Neo4j Graph Schema

**Date:** December 22, 2025, 5:45 PM
**Purpose:** Transform ALL TypeScript embedded relationships into graph structure

---

## EXECUTIVE SUMMARY

**TypeScript has 35,450 lines with embedded relationships.**
**Graph needs to make these EXPLICIT for queries/inference.**

**Key Transformations:**

| TypeScript Pattern | Graph Pattern | Example |
|-------------------|---------------|---------|
| `region.counties[]` | (Region)-[:HAS_COUNTY]->(County) | Indian River → 3 counties |
| `region.typicalSoil{}` | (Region)-[:HAS_SOIL]->(SoilProfile) | Indian River → coastal flatwoods |
| `cultivar.productType` | (Cultivar)-[:IS_TYPE_OF]->(ProductType) | Washington Navel → Orange |
| `phenology: crop+region` | (Cultivar)-[:HAS_PHENOLOGY_IN]->(Region) | Navel × FL → bloom Mar 15 |

---

## SECTION 1: COMPLETE NODE TYPES (All TypeScript Data)

### Geographic Nodes (S PILLAR)

| Node Type | Count | Source | Properties |
|-----------|-------|--------|------------|
| **State** | 50 | growing-regions.ts | code, name, macroRegion |
| **MacroRegion** | 8 | growing-regions.ts | id, name (West Coast, Pacific NW, etc.) |
| **GrowingRegion** | 119 | growing-regions.ts | id, name, lat/lon, climate{}, primaryProducts[] |
| **County** | ~500 | Extract from region.counties[] | name, state |
| **City** | ~1000 | Extract from region.primaryCities[] | name, county, state |
| **USDAZone** | 18 | climate-zones.ts | id (9b), minTemp, maxTemp, chillHours |
| **SoilProfile** | 119 | Extract from region.typicalSoil{} | type, drainage, pH, minerals{}, terroir |

### Product Hierarchy Nodes (H PILLAR)

| Node Type | Count | Source | Properties |
|-----------|-------|--------|------------|
| **Category** | ~10 | products.ts | id (fruit, vegetable, meat, dairy) |
| **Subcategory** | ~30 | products.ts | id (citrus, stone_fruit, pome_fruit, berry) |
| **ProductType** | ~50 | products.ts | id (orange, apple, peach), isClimacteric |
| **Variety** | ~100 | products.ts | id (navel, valencia, blood) |
| **Cultivar** | 500 | products.ts | id, heritageIntent, brixRange, isNonGmo |
| **Rootstock** | 12 | rootstocks.ts | id, brixModifier, vigor, diseaseResistance |

### Timing/Phenology Nodes (R PILLAR)

| Node Type | Count | Source | Properties |
|-----------|-------|--------|------------|
| **CropPhenology** | 28 | crop-phenology.ts | cropId, regionId, bloomDate, gddToPeak |
| **RegionalDistribution** | 19 | regional-distributions.ts | cultivarId, regionId, marketSharePct, harvestWindow |

### Entity Nodes (From Tonight)

| Node Type | Count | Source | Properties |
|-----------|-------|--------|------------|
| **Entity** (Multi-role) | 21,342 | USDA + research | name, roles[], location |
| **Grower** | 15,038 | Label on Entity | products[], certifications[] |
| **Packinghouse** | 790 | Label on Entity | facilityTypes[], products[] |
| **Retailer** | 20,693 | Label on Entity | retailChannels[] |

---

## SECTION 2: COMPLETE RELATIONSHIP TYPES

### Geographic Relationships (S PILLAR - FOUNDATION)

```cypher
// State hierarchy
(State)-[:IN_MACRO_REGION]->(MacroRegion)

// Region to political geography
(GrowingRegion)-[:IN_STATE]->(State)
(GrowingRegion)-[:HAS_COUNTY]->(County)
(GrowingRegion)-[:HAS_CITY]->(City)

// County/City hierarchy
(County)-[:IN_STATE]->(State)
(City)-[:IN_COUNTY]->(County)
(City)-[:IN_STATE]->(State)

// Climate/Zone
(GrowingRegion)-[:IN_ZONE]->(USDAZone)  // Can be multiple zones
(State)-[:HAS_ZONE]->(USDAZone)

// Soil (S PILLAR DATA)
(GrowingRegion)-[:HAS_TYPICAL_SOIL]->(SoilProfile)
(County)-[:HAS_TYPICAL_SOIL]->(SoilProfile)  // Can have county-level soil

// Products grown
(GrowingRegion)-[:PRODUCES]->(ProductType)  // From region.primaryProducts[]
```

### Product Hierarchy Relationships (H PILLAR - GENETICS)

```cypher
// Taxonomy
(ProductType)-[:IN_CATEGORY]->(Category)
(ProductType)-[:IN_SUBCATEGORY]->(Subcategory)
(Subcategory)-[:IN_CATEGORY]->(Category)

// Variety/Cultivar hierarchy
(Variety)-[:OF_PRODUCT_TYPE]->(ProductType)
(Cultivar)-[:OF_VARIETY]->(Variety)
(Cultivar)-[:OF_PRODUCT_TYPE]->(ProductType)  // Direct link too

// Heritage attributes (H PILLAR)
(Cultivar)-[:HAS_HERITAGE_INTENT]->(HeritageIntent)  // Enum node
(Cultivar)-[:HAS_QUALITY_TIER]->(QualityTier)  // Premium, Standard, etc.

// Rootstock compatibility
(Cultivar)-[:COMPATIBLE_WITH]->(Rootstock)
(Rootstock)-[:FOR_PRODUCT_TYPE]->(ProductType)
```

### Timing/Phenology Relationships (R PILLAR - CRITICAL)

```cypher
// Phenology (bloom + GDD)
(Cultivar)-[:HAS_PHENOLOGY_IN]->(GrowingRegion) {
  bloomMonth: 3,
  bloomDay: 15,
  gddBase: 55,
  gddToPeak: 6100,
  gddWindow: 3500,
  source: 'UF/IFAS'
}

// Regional cultivation (which cultivars grow where)
(Cultivar)-[:GROWN_IN]->(GrowingRegion) {
  marketSharePct: 60,
  harvestWindow: {start: 'Oct', end: 'May'},
  confidence: 0.9
}

// Zone suitability
(Cultivar)-[:SUITABLE_FOR_ZONE]->(USDAZone)
(ProductType)-[:SUITABLE_FOR_ZONE]->(USDAZone)
```

### Entity Location Relationships (Connecting Entities to Geography)

```cypher
// Primary location
(Entity)-[:LOCATED_IN_STATE]->(State)
(Entity)-[:LOCATED_IN_CITY]->(City)  // If known
(Entity)-[:LOCATED_IN_COUNTY]->(County)  // If known
(Entity)-[:IN_GROWING_REGION]->(GrowingRegion)  // CRITICAL for S pillar

// Products
(Grower)-[:GROWS]->(ProductType)  // Generic
(Grower)-[:GROWS_CULTIVAR]->(Cultivar)  // Specific (if known)
(Packinghouse)-[:PACKS]->(ProductType)
(Packinghouse)-[:SOURCES_FROM]->(Grower)  // Supply chain

// Seasonal
(Entity)-[:HARVESTS_IN_MONTH]->(Month {number: 12})  // For filtering
```

---

## SECTION 3: CRITICAL MISSING CONNECTIONS

### What TypeScript HAS but Graph DOESN'T

**1. County → GrowingRegion mapping**
```typescript
// TypeScript: region.counties = ['Indian River', 'St. Lucie']
// Graph NEEDS: (County {name: 'Indian River'})-[:PART_OF_GROWING_REGION]->(GrowingRegion {id: 'indian_river_fl'})
```

**2. City → County mapping**
```typescript
// TypeScript: Vero Beach is in region.primaryCities[]
// Graph NEEDS: (City {name: 'Vero Beach'})-[:IN_COUNTY]->(County {name: 'Indian River'})
```

**3. Cultivar × Region mapping (THE BIG ONE)**
```typescript
// TypeScript: regional-distributions.ts has this BUT it's incomplete (only 19 entries)
// Extension data HAS: 50+ cultivar × region × timing
// Graph NEEDS: Complete cultivar × region relationships
```

**4. Zone → Region mapping**
```typescript
// TypeScript: region.typicalUSDAZones = ['9b', '10a']
// Graph NEEDS: (GrowingRegion)-[:IN_ZONE]->(USDAZone)
```

---

## SECTION 4: TRANSFORMATION SCRIPT DESIGN

### Step 1: Load TypeScript Base Model (Foundation)

```typescript
// scripts/load-typescript-to-graph.ts

async function loadGeographicHierarchy() {
  // Import ALL_GROWING_REGIONS from TypeScript
  const regions = ALL_GROWING_REGIONS

  for (const region of regions) {
    // Create GrowingRegion node
    await createNode('GrowingRegion', {
      id: region.id,
      name: region.name,
      lat: region.latitude,
      lon: region.longitude,
      climate: region.climate,
      primaryProducts: region.primaryProducts
    })

    // Create State relationship
    await createRelationship(
      'GrowingRegion', region.id,
      'IN_STATE',
      'State', region.state
    )

    // Create County nodes and relationships
    for (const county of region.counties) {
      await createNode('County', { name: county, state: region.state })
      await createRelationship(
        'GrowingRegion', region.id,
        'HAS_COUNTY',
        'County', county
      )
      await createRelationship(
        'County', county,
        'IN_STATE',
        'State', region.state
      )
    }

    // Create City nodes and relationships
    for (const city of region.primaryCities) {
      await createNode('City', { name: city, state: region.state })
      await createRelationship(
        'GrowingRegion', region.id,
        'HAS_CITY',
        'City', city
      )
      // Infer city → county (first county in region, or lookup)
      const county = region.counties[0]  // Simplified
      await createRelationship(
        'City', city,
        'IN_COUNTY',
        'County', county
      )
    }

    // Create SoilProfile node
    await createNode('SoilProfile', {
      id: `${region.id}_soil`,
      type: region.typicalSoil.type,
      drainage: region.typicalSoil.drainage,
      ph_min: parseFloat(region.typicalSoil.pH.split('-')[0]),
      ph_max: parseFloat(region.typicalSoil.pH.split('-')[1]),
      organic_matter: region.typicalSoil.organicMatter,
      natural_mineralization: region.typicalSoil.naturalMineralization,
      terroir_effect: region.typicalSoil.terroirEffect
    })

    await createRelationship(
      'GrowingRegion', region.id,
      'HAS_TYPICAL_SOIL',
      'SoilProfile', `${region.id}_soil`
    )

    // Create Zone relationships
    for (const zone of region.typicalUSDAZones) {
      await createRelationship(
        'GrowingRegion', region.id,
        'IN_ZONE',
        'USDAZone', zone
      )
    }
  }
}
```

### Step 2: Load Cultivar Hierarchy

```typescript
async function loadCultivarHierarchy() {
  // Import CULTIVARS from products.ts
  const cultivars = CULTIVARS

  for (const cultivar of cultivars) {
    // Create Cultivar node with all H pillar attributes
    await createNode('Cultivar', {
      id: cultivar.id,
      name: cultivar.name,
      heritage_intent: cultivar.heritageIntent,
      brix_min: cultivar.brixRange[0],
      brix_max: cultivar.brixRange[1],
      is_non_gmo: cultivar.isNonGmo,
      flavor_profile: cultivar.flavorProfile,
      origin_story: cultivar.originStory
    })

    // Link to ProductType
    await createRelationship(
      'Cultivar', cultivar.id,
      'OF_PRODUCT_TYPE',
      'ProductType', cultivar.productType
    )

    // Link to Variety (if applicable)
    if (cultivar.variety) {
      await createRelationship(
        'Cultivar', cultivar.id,
        'OF_VARIETY',
        'Variety', cultivar.variety
      )
    }
  }
}
```

### Step 3: Load Phenology (R PILLAR - Cultivar × Region × Timing)

```typescript
async function loadPhenology() {
  // Import CROP_PHENOLOGY
  const phenology = CROP_PHENOLOGY

  for (const entry of phenology) {
    // Create relationship with timing as properties
    await createRelationship(
      'Cultivar', entry.cropId,  // Actually cultivar or generic crop
      'HAS_PHENOLOGY_IN',
      'GrowingRegion', entry.region,
      {
        bloom_month: entry.bloomMonth,
        bloom_day: entry.bloomDay,
        gdd_base: entry.gddBase,
        gdd_to_maturity: entry.gddToMaturity,
        gdd_to_peak: entry.gddToPeak,
        gdd_window: entry.gddWindow,
        source: entry.source,
        notes: entry.notes
      }
    )
  }
}
```

### Step 4: Load Regional Distributions (Cultivar × Region Market Share)

```typescript
async function loadRegionalDistributions() {
  // Import ALL_CULTIVAR_DISTRIBUTIONS
  const distributions = ALL_CULTIVAR_DISTRIBUTIONS

  for (const dist of distributions) {
    await createRelationship(
      'Cultivar', dist.cultivarId,
      'GROWN_IN',
      'GrowingRegion', dist.regionId,
      {
        market_share_pct: dist.marketSharePct,
        acreage: dist.acreage,
        harvest_window_start: dist.harvestWindow.typicalStart,
        harvest_window_end: dist.harvestWindow.typicalEnd,
        peak_start: dist.harvestWindow.peakStart,
        peak_end: dist.harvestWindow.peakEnd,
        typical_brix_min: dist.typicalBrixRange[0],
        typical_brix_max: dist.typicalBrixRange[1],
        quality_tier: dist.expectedQualityTier,
        confidence: dist.confidence
      }
    )
  }
}
```

### Step 5: Connect Entities to Geography

```typescript
async function connectEntitiesToGeography() {
  // For each of the 21,342 entities

  // Entities already have: stateCode, city
  // Need to INFER: county, growingRegion

  // Pattern:
  // 1. Entity.city → Find City node
  // 2. City → County (via relationship)
  // 3. County → GrowingRegion (via HAS_COUNTY backlink)
  // 4. Create Entity → GrowingRegion link

  const entities = await getAllEntities()

  for (const entity of entities) {
    if (entity.city && entity.stateCode) {
      // Query: Which growing region has this city?
      const region = await query(`
        MATCH (c:City {name: $city, state: $state})
        MATCH (r:GrowingRegion)-[:HAS_CITY]->(c)
        RETURN r.id as regionId
      `, { city: entity.city, state: entity.stateCode })

      if (region) {
        // Link entity to region
        await createRelationship(
          'Entity', entity.id,
          'IN_GROWING_REGION',
          'GrowingRegion', region.regionId
        )
      }
    }
  }
}
```

---

## SECTION 5: QUERY PATTERNS ENABLED

### After Complete Integration

**Query 1: Full S Pillar Resolution**
```cypher
// Input: Entity in "Vero Beach, FL"
MATCH (e:Entity {city: 'Vero Beach', stateCode: 'FL'})
MATCH path = (e)-[:IN_GROWING_REGION]->(r:GrowingRegion)
              -[:HAS_TYPICAL_SOIL]->(soil:SoilProfile)
RETURN {
  entity: e.name,
  region: r.name,
  soil_type: soil.type,
  drainage: soil.drainage,
  ph_range: [soil.ph_min, soil.ph_max],
  terroir: soil.terroir_effect
}
```

**Query 2: Which Cultivars Grow in Region**
```cypher
// Input: "indian_river_fl"
MATCH (c:Cultivar)-[g:GROWN_IN]->(r:GrowingRegion {id: 'indian_river_fl'})
RETURN c.name, g.market_share_pct, g.harvest_window_start, g.harvest_window_end
ORDER BY g.market_share_pct DESC
```

**Query 3: What's at Peak Today (THE CRITICAL QUERY)**
```cypher
// Input: Date (Dec 22), User location (Orlando), Radius (50 miles)
WITH date('2025-12-22') as today, 12 as currentMonth

// Find nearby regions
MATCH (r:GrowingRegion)
WHERE distance(
  point({latitude: 28.5, longitude: -81.4}),  // Orlando
  point({latitude: r.lat, longitude: r.lon})
) < 50000  // meters

// Find cultivars with phenology in those regions
MATCH (c:Cultivar)-[p:HAS_PHENOLOGY_IN]->(r)

// CALCULATE current GDD (would be real-time from weather API)
// For demo, assume we have current GDD stored or calculated
WITH c, r, p, 2900 as currentGDD  // Example

// Check if at peak (within GDD window)
WHERE currentGDD >= (p.gdd_to_peak - p.gdd_window/2)
  AND currentGDD <= (p.gdd_to_peak + p.gdd_window/2)

RETURN
  c.name as cultivar,
  r.name as region,
  distance(point({latitude: 28.5, longitude: -81.4}), point({latitude: r.lat, longitude: r.lon})) / 1000 as km,
  currentGDD,
  p.gdd_to_peak as optimalGDD,
  'AT PEAK' as status
ORDER BY km
```

**This query finds products at peak near the user - THE CORE FEATURE.**

---

## SECTION 6: DATA SOURCES TO LOAD

### Priority Order

**P1: TypeScript Base Model (Foundation)**
- growing-regions.ts (119 regions with counties, cities, soil)
- products.ts (500 cultivars with hierarchy)
- crop-phenology.ts (28 existing entries)
- regional-distributions.ts (19 existing entries)

**P2: Extension Service Data (R PILLAR EXPANSION)**
- extension-ufifas-florida-cultivars.json (50+ cultivars × FL regions)
- extension-cornell-cultivars.json (30+ cultivars × NY regions)
- Add as CropPhenology and RegionalDistribution entries

**P3: Entity Connections**
- Link 21,342 entities to geographic nodes
- Infer region from city
- Link products to ProductType/Cultivar nodes

---

## SECTION 7: EXECUTION PLAN

### Phase 1: Load TypeScript Base (Week 1)

**Day 1-2: Geographic Hierarchy**
```
1. Parse growing-regions.ts (119 regions)
2. Create: State, MacroRegion, GrowingRegion, County, City, USDAZone, SoilProfile nodes
3. Create: All geographic relationships
4. Result: Complete S pillar geography
```

**Day 3-4: Product Hierarchy**
```
1. Parse products.ts (500 cultivars)
2. Create: Category, Subcategory, ProductType, Variety, Cultivar nodes
3. Create: Taxonomy relationships
4. Result: Complete H pillar genetics
```

**Day 5: Phenology & Distributions**
```
1. Parse crop-phenology.ts (28 entries)
2. Parse regional-distributions.ts (19 entries)
3. Create: HAS_PHENOLOGY_IN, GROWN_IN relationships
4. Result: R pillar timing foundations
```

### Phase 2: Load Extension Data (Week 2)

**Day 1-3: Extension Service Integration**
```
1. Parse extension-ufifas-florida-cultivars.json
2. For each cultivar × region × season:
   - Create Cultivar node (if not exists)
   - Create HAS_PHENOLOGY_IN relationship
   - Create GROWN_IN relationship
3. Repeat for Cornell, other extensions
4. Result: 28 → 80+ phenology entries in graph
```

### Phase 3: Connect Entities (Week 2)

**Day 4-5: Entity Geographic Links**
```
1. For each entity with city:
   - Match city → county → region (via graph traversal)
   - Create IN_GROWING_REGION relationship
2. For entities with products:
   - Match product name → ProductType
   - Create GROWS or PACKS relationship
3. Result: 21K entities linked to geography and products
```

---

## SECTION 8: THE UNIFIED MODEL (After Integration)

### Complete Query Example

```cypher
// "What Washington Navels are at peak near Orlando today?"

// 1. User context
WITH date('2025-12-22') as today,
     point({latitude: 28.5, longitude: -81.4}) as userLocation,
     50000 as radiusMeters

// 2. Find nearby regions
MATCH (r:GrowingRegion)
WHERE distance(point({latitude: r.lat, longitude: r.lon}), userLocation) < radiusMeters

// 3. Find Washington Navel in these regions
MATCH (c:Cultivar {id: 'washington_navel'})-[p:HAS_PHENOLOGY_IN]->(r)

// 4. Get soil profile (S pillar)
MATCH (r)-[:HAS_TYPICAL_SOIL]->(soil:SoilProfile)

// 5. Check if at peak (would calculate real GDD from weather)
WITH c, r, p, soil, 2900 as currentGDD  // Example current GDD

WHERE currentGDD >= (p.gdd_to_peak - p.gdd_window/2)
  AND currentGDD <= (p.gdd_to_peak + p.gdd_window/2)

// 6. Return complete SHARE context
RETURN {
  cultivar: c.name,
  region: r.name,
  distance_km: distance(point({latitude: r.lat, longitude: r.lon}), userLocation) / 1000,

  // S pillar
  soil: {
    type: soil.type,
    drainage: soil.drainage,
    terroir: soil.terroir_effect
  },

  // H pillar
  heritage: {
    intent: c.heritage_intent,
    brix_potential: [c.brix_min, c.brix_max]
  },

  // R pillar
  timing: {
    current_gdd: currentGDD,
    optimal_gdd: p.gdd_to_peak,
    status: 'AT PEAK',
    bloom_date: date({year: year(today), month: p.bloom_month, day: p.bloom_day})
  }
} as result
```

**This single query provides complete SHARE context for "at peak" discovery.**

---

## SECTION 9: IMMEDIATE ACTIONS

### What to Do First

**Priority 1: Load TypeScript Geographic Base**
- Transform growing-regions.ts (119 regions)
- Create complete County/City/Soil hierarchy
- **Impact:** S pillar fully queryable

**Priority 2: Load Cultivar Base**
- Transform products.ts (500 cultivars)
- Create Product taxonomy
- **Impact:** H pillar fully queryable

**Priority 3: Load Extension Phenology**
- Parse research files
- Create cultivar × region × timing relationships
- **Impact:** R pillar from 28 → 80+ entries

**Priority 4: Connect Entities**
- Link 21K entities to geography
- **Impact:** Entity catalog usable

**Expected Timeline:** 2-3 weeks for complete integration

---

## CONCLUSION

**The graph's purpose:**
1. **Unify fragmented data** (TypeScript, Supabase, Research)
2. **Make relationships explicit** (counties, zones, cultivars × regions)
3. **Enable complex queries** (geographic + timing + quality filters)
4. **Support SHARE inference** (traverse relationships to fill gaps)

**Current state:** TypeScript has the data, graph doesn't have the connections

**Next step:** Execute the transformation scripts to create the complete linked model

---

**Ready to proceed with loading TypeScript base model into graph?**
