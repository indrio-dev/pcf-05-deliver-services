# TypeScript Data Model - Complete Deep Dive

**Date:** December 22, 2025, 5:34 PM
**Purpose:** Systematic analysis for proper graph integration
**Method:** Analyze all 20 TypeScript constants files (35,450 lines)

---

## OBJECTIVES

1. Extract ALL data structures and relationships
2. Map every field to SHARE pillars
3. Identify embedded relationships (what should be graph edges)
4. Design TypeScript → Neo4j transformation
5. Create integration execution plan

---

## Part 1: TypeScript Files Inventory

| File | Lines | Primary Purpose | SHARE Pillar |
|------|-------|-----------------|--------------|
| growing-regions.ts | 2,433 | Geographic hierarchy, soil profiles | **S** |
| products.ts | 2,322 | Cultivar taxonomy, heritage attributes | **H** |
| share-profiles.ts | 1,873 | SHARE pillar summaries by profile | **ALL** |
| category-config.ts | 1,404 | Product categories, quality metrics | **E** |
| regional-distributions.ts | 1,096 | Cultivar market share by region | **H×S** |
| claims.ts | 1,035 | Marketing claim → SHARE inference | **A** |
| agricultural-definitions.ts | 903 | Farm-to-table terminology | **A** |
| quality-tiers.ts | 887 | Cultivar quality classification | **H** |
| gdd-targets.ts | 840 | GDD requirements by crop | **R** |
| brands.ts | 733 | Brand profiles and claims | **A** |
| packing-houses.ts | 672 | Packinghouse entities | **S×H** (location + products) |
| livestock-breeds.ts | 668 | Breed genetics, omega baselines | **H** (livestock) |
| ripening-methodology.ts | 656 | Climacteric behavior, ripening | **R** |
| transformation-profiles.ts | 640 | Value-added processing | **E** |
| crop-phenology.ts | 617 | Bloom dates, GDD windows | **R** |
| product-model.ts | 549 | SKU structure, retail | **E** |
| enrich-measurements.ts | 515 | Nutrient baselines | **E** |
| inference-chains.ts | 508 | SHARE inference logic | **ALL** |
| profile-grids.ts | 458 | Quality grid mappings | **E** |
| climate-zones.ts | 354 | USDA zones, climate | **S×R** |

**Total:** 20 files, 35,450 lines

---

## Part 2: GEOGRAPHIC MODEL (S PILLAR)

### growing-regions.ts - Deep Structure Analysis

**Primary Interface:**
```typescript
export interface GrowingRegionExtended {
  // Identity
  id: string                    // 'indian_river_fl'
  name: string                  // 'Indian River District'
  displayName: string
  slug: string                  // SEO URL

  // Political geography (EMBEDDED RELATIONSHIPS)
  state: string                 // 'FL' → Should link to State node
  states?: string[]             // Multi-state regions
  counties: string[]            // ['Indian River', 'St. Lucie'] → County nodes
  primaryCities: string[]       // ['Vero Beach'] → City nodes
  macroRegion: MacroRegion      // 'southeast' → Region node

  // Location (for weather API)
  latitude: number
  longitude: number

  // Climate data (S+R pillar)
  climate: {
    avgLastFrostDoy: number     // Day of year
    avgFirstFrostDoy: number
    frostFreeDays: number
    typicalFirstFrost: string   // 'Dec 15'
    typicalLastFrost: string    // 'Feb 15'
    annualGDD50: number         // Total GDD base 50
    avgChillHours: number       // For fruit trees
    avgRainfallInches: number
    growingSeasonDays: number
  }

  // Soil characteristics (S PILLAR - CRITICAL)
  typicalSoil: {
    type: string                // 'coastal flatwoods'
    drainage: string            // 'excellent' | 'good' | 'moderate'
    pH: string                  // '5.5-6.5'
    texture: string             // 'sandy loam'
    organicMatter: string       // 'low' | 'medium' | 'high'
    cec: string                 // Cation exchange capacity
    minerals: {
      phosphorus: string
      potassium: string
      calcium: string
      magnesium: string
      micronutrients: string
    }
    naturalMineralization: string  // 'low' | 'medium' | 'high'
    terroirEffect: string       // Flavor/quality impact description
  }

  // Products (H PILLAR connection)
  primaryProducts: string[]     // ['citrus', 'blueberry'] → ProductType nodes

  // Market activity
  dtcActivity: DtcActivityLevel // Direct-to-consumer farms density
}
```

**Total Regions:** 119

**Graph Nodes Needed:**
- GrowingRegion (119)
- County (~500 from all regions.counties[])
- City (~1000 from all regions.primaryCities[])
- State (50)
- MacroRegion (8: West Coast, Pacific NW, Southwest, etc.)
- SoilProfile (119, one per region)
- USDAZone (18)

**Graph Relationships Needed:**
- (GrowingRegion)-[:IN_STATE]->(State)
- (GrowingRegion)-[:IN_MACRO_REGION]->(MacroRegion)
- (GrowingRegion)-[:HAS_COUNTY]->(County)
- (GrowingRegion)-[:HAS_CITY]->(City)
- (GrowingRegion)-[:IN_ZONE]->(USDAZone)
- (GrowingRegion)-[:HAS_SOIL_PROFILE]->(SoilProfile)
- (GrowingRegion)-[:PRODUCES]->(ProductType)
- (County)-[:IN_STATE]->(State)
- (City)-[:IN_COUNTY]->(County)

**This creates the COMPLETE geographic hierarchy for S pillar queries.**

---

## Part 3: CONTINUING ANALYSIS

Working through remaining files systematically...

**products.ts analysis in progress...**
**crop-phenology.ts analysis in progress...**
**regional-distributions.ts analysis in progress...**

*This document will be expanded as analysis continues*

---

**Status:** Deep dive started, documenting findings incrementally
