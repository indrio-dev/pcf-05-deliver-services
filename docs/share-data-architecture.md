# S.H.A.R.E. Data Architecture

Comprehensive data model for the Fielder S.H.A.R.E. quality intelligence system.

---

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TAXONOMY HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Category ──┬── Subcategory ──┬── ProductType ──┬── Variety ──┬── Cultivar     │
│  (fruit)    │   (citrus)      │   (Orange)      │  (Navel)    │  (Washington)  │
│             │                 │                 │             │                │
└─────────────┴─────────────────┴─────────────────┴─────────────┴────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCT INSTANCES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Farm ────────┬──── Product ────────┬──── ProductVariant (SKU)                 │
│               │                     │                                           │
│  Region ──────┘                     └──── ShareProfile (assigned)               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              S.H.A.R.E. FRAMEWORK                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ShareProfile ──┬── ProfileGrid (3 perspectives × 5 pillars)                   │
│                 │                                                               │
│                 ├── EnrichEstimate (E0: profile, E1: predictor)                │
│                 │                                                               │
│                 └── EnrichActual (E2: primary, E3: secondary)                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              REFERENCE DATA                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Region ── RegionalSoilProfile ── RegionalCultivarDistribution                 │
│         ── RegionalPracticeNorms ── RegionalGDDData                            │
│                                                                                 │
│  Rootstock ── RootstockCultivarCompatibility                                   │
│                                                                                 │
│  Lab ── LabTestReport ── NutrientPanel                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. TAXONOMY ENTITIES

### 1.1 Category

Top-level product classification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "fruit") |
| `name` | string | ✓ | Display name (e.g., "Fruit") |
| `description` | string | | Category description |
| `maturityBehavior` | enum | | Default maturity type for category |
| `primaryQualityMetric` | enum | ✓ | Primary E-pillar metric (brix, omega_ratio, etc.) |
| `iconUrl` | string | | Icon for UI |
| `sortOrder` | integer | | Display ordering |
| `isActive` | boolean | ✓ | Whether category is active |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: CategoryId**
```
fruit, vegetable, nut, meat, poultry, eggs, seafood,
dairy, grain, oil, sweetener, beverage, condiment
```

**Enum: PrimaryQualityMetric**
```
brix, omega_ratio, usda_grade, polyphenol_content,
mineral_density, protein_quality, fat_composition
```

---

### 1.2 Subcategory

Second-level classification within a category.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "citrus") |
| `categoryId` | FK → Category | ✓ | Parent category |
| `name` | string | ✓ | Display name (e.g., "Citrus") |
| `description` | string | | |
| `maturityBehavior` | enum | | Override category default |
| `seasonalityPattern` | enum | | Year-round, seasonal, etc. |
| `typicalShelfLifeDays` | integer | | Average shelf life |
| `sortOrder` | integer | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: MaturityBehavior**
```
climacteric, non_climacteric, not_applicable
```

**Enum: SeasonalityPattern**
```
year_round, winter, spring, summer, fall,
winter_spring, summer_fall, short_season
```

**Subcategory Examples by Category:**
```
fruit: citrus, stone_fruit, pome_fruit, berry, melon, tropical, grape
vegetable: leafy, root, nightshade, squash, cruciferous, allium, legume, corn
meat: beef, pork, lamb, game
poultry: chicken, turkey, duck, game_bird
seafood: fish, shellfish, crustacean
dairy: milk, cheese, butter, yogurt, cream
```

---

### 1.3 ProductType

Generic product within a subcategory.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "orange") |
| `subcategoryId` | FK → Subcategory | ✓ | Parent subcategory |
| `name` | string | ✓ | Display name (e.g., "Orange") |
| `pluralName` | string | | Plural form (e.g., "Oranges") |
| `description` | string | | |
| `pluCodeBase` | string | | Base PLU code if applicable |
| `maturityBehavior` | enum | | Override subcategory default |
| `typicalBrixRange` | number[2] | | [min, max] expected Brix |
| `typicalOmegaRange` | number[2] | | [min, max] omega ratio (animal products) |
| `harvestSeasons` | string[] | | Months when typically harvested |
| `primaryGrowingRegions` | FK[] → Region | | Main production regions |
| `sortOrder` | integer | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 1.4 Variety

Named variety within a product type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "navel_orange") |
| `productTypeId` | FK → ProductType | ✓ | Parent product type |
| `name` | string | ✓ | Display name (e.g., "Navel Orange") |
| `alternateNames` | string[] | | Other common names |
| `pluCode` | string | | Specific PLU code |
| `organicPluCode` | string | | Organic PLU (typically 9xxxx) |
| `description` | string | | |
| `brixRangeTypical` | number[2] | | Expected Brix range |
| `peakSeasonMonths` | integer[] | | Peak harvest months (1-12) |
| `isOrganic` | boolean | | If variety-level organic designation |
| `sortOrder` | integer | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 1.5 Cultivar

Specific cultivar/breed (genetic level).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "washington_navel") |
| `varietyId` | FK → Variety | ✓ | Parent variety |
| `name` | string | ✓ | Cultivar name (e.g., "Washington Navel") |
| `alternateNames` | string[] | | Trade names, synonyms |
| `description` | string | | |
| `heritageIntent` | enum | ✓ | Breeding focus classification |
| `qualityTier` | enum | ✓ | Expected quality tier |
| `yearIntroduced` | integer | | Year cultivar was developed/released |
| `breeder` | string | | Who developed it |
| `parentage` | string | | Genetic parentage if known |
| `isHeirloom` | boolean | | Pre-1950 open-pollinated |
| `isHybrid` | boolean | | F1 hybrid |
| `isGMO` | boolean | | Genetically modified |
| `isPatented` | boolean | | Under plant patent |
| `brixBaseline` | number | ✓ | Base Brix potential (optimal conditions) |
| `brixRange` | number[2] | ✓ | [min, max] achievable Brix |
| `acidityBaseline` | number | | Base acidity % |
| `flavorProfile` | string | | Tasting notes |
| `textureProfile` | string | | Texture description |
| `colorDescription` | string | | Color when ripe |
| `sizeCategory` | enum | | small, medium, large, variable |
| `seediness` | enum | | seedless, few_seeds, seeded |
| `peelability` | enum | | easy, moderate, difficult (citrus) |
| `shippingDurability` | enum | | excellent, good, fair, poor |
| `storageLife` | integer | | Days under optimal storage |
| `diseaseResistance` | object | | Resistance ratings by disease |
| `climateAdaptation` | string[] | | Suitable climate zones |
| `compatibleRootstocks` | FK[] → Rootstock | | For tree crops |
| `daysToMaturity` | integer | | From bloom to harvest |
| `chillHoursRequired` | integer | | For deciduous crops |
| `heatUnitsRequired` | integer | | GDD to maturity |
| `yieldPotential` | enum | | low, moderate, high, very_high |
| `sortOrder` | integer | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: HeritageIntent**
```
true_heritage      - Selected for flavor/nutrition over generations
heirloom_quality   - Pre-1950 open-pollinated AND high internal quality
heirloom_utility   - Pre-1950 but bred for hardiness/yield
modern_nutrient    - Modern breeding with nutrition focus
modern_flavor      - Modern breeding with flavor focus
commercial         - Modern yield/shipping/appearance focus
```

**Enum: QualityTier**
```
artisan    - Exceptional (14-18° Brix)
premium    - High quality (12-15° Brix)
standard   - Acceptable (10-12° Brix)
commodity  - Basic (8-10° Brix)
```

---

### 1.6 Rootstock (for tree/vine crops)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "carrizo") |
| `name` | string | ✓ | Rootstock name |
| `alternateNames` | string[] | | |
| `cropCategories` | string[] | ✓ | Compatible crop subcategories |
| `brixModifier` | number | ✓ | Brix impact (-0.8 to +0.6) |
| `vigor` | enum | ✓ | Tree vigor induced |
| `dwarfingEffect` | enum | | Size reduction |
| `coldHardiness` | enum | | Cold tolerance |
| `droughtTolerance` | enum | | |
| `saltTolerance` | enum | | |
| `diseaseResistance` | object | | Resistance by disease |
| `soilAdaptation` | string[] | | Suitable soil types |
| `yearsToProduction` | integer | | Time to first harvest |
| `productiveLifespan` | integer | | Years of production |
| `notes` | string | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: Vigor**
```
dwarfing, semi_dwarfing, medium, semi_vigorous, vigorous
```

---

## 2. GEOGRAPHIC ENTITIES

### 2.1 Region

Growing region definition.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "indian_river_fl") |
| `name` | string | ✓ | Display name |
| `shortName` | string | | Abbreviated name |
| `country` | string | ✓ | Country code (ISO 3166-1) |
| `state` | string | | State/province |
| `description` | string | | Region description |
| `boundingBox` | object | | Geographic bounds {n, s, e, w} |
| `centerCoordinates` | object | | {lat, lng} |
| `climateZone` | string | | USDA hardiness zone |
| `avgAnnualRainfall` | number | | Inches |
| `avgGrowingSeasonDays` | integer | | |
| `primaryCrops` | FK[] → ProductType | | Main crops grown |
| `certifications` | string[] | | Regional certifications (e.g., "Indian River") |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 2.2 RegionalSoilProfile

Soil characteristics by region.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `regionId` | FK → Region | ✓ | |
| `soilType` | string | ✓ | Primary soil classification |
| `soilTexture` | enum | | sandy, loamy, clay, etc. |
| `drainage` | enum | | poor, moderate, well, excessive |
| `phRange` | number[2] | | [min, max] |
| `organicMatterPct` | number | | Typical % organic matter |
| `cecRange` | number[2] | | Cation exchange capacity |
| `mineralProfile` | object | | Typical mineral levels |
| `microbiomeHealth` | enum | | Estimated soil life |
| `notes` | string | | |
| `dataSource` | string | | Source of soil data |
| `lastUpdated` | timestamp | | |

**mineralProfile object:**
```json
{
  "nitrogen_ppm": 25,
  "phosphorus_ppm": 45,
  "potassium_ppm": 180,
  "calcium_ppm": 1200,
  "magnesium_ppm": 150,
  "sulfur_ppm": 20,
  "boron_ppm": 0.8,
  "zinc_ppm": 2.5,
  "iron_ppm": 50,
  "manganese_ppm": 15
}
```

---

### 2.3 RegionalCultivarDistribution

What cultivars are grown where (for inference).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `regionId` | FK → Region | ✓ | |
| `varietyId` | FK → Variety | ✓ | |
| `cultivarId` | FK → Cultivar | ✓ | |
| `marketSharePct` | number | ✓ | % of variety that is this cultivar |
| `acreageEstimate` | number | | Estimated acres |
| `harvestWindowStart` | integer | | Day of year (1-365) |
| `harvestWindowEnd` | integer | | Day of year |
| `peakHarvestStart` | integer | | Peak window start |
| `peakHarvestEnd` | integer | | Peak window end |
| `dataYear` | integer | | Year of estimate |
| `dataSource` | string | | Source of data |
| `confidence` | enum | | high, medium, low |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 2.4 RegionalRootstockDistribution

What rootstocks are used where.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `regionId` | FK → Region | ✓ | |
| `cultivarId` | FK → Cultivar | ✓ | |
| `rootstockId` | FK → Rootstock | ✓ | |
| `marketSharePct` | number | ✓ | % of cultivar on this rootstock |
| `dataYear` | integer | | |
| `dataSource` | string | | |
| `confidence` | enum | | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 2.5 RegionalPracticeNorms

Typical agricultural practices by region.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `regionId` | FK → Region | ✓ | |
| `productTypeId` | FK → ProductType | ✓ | |
| `conventionalPct` | number | | % conventional |
| `ipmPct` | number | | % IPM |
| `organicPct` | number | | % certified organic |
| `regenerativePct` | number | | % regenerative |
| `irrigationType` | enum | | Most common irrigation |
| `fertilizerApproach` | enum | | annual, soil_banking, etc. |
| `dataYear` | integer | | |
| `dataSource` | string | | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 2.6 RegionalGDDData

Growing degree day accumulation by region.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `regionId` | FK → Region | ✓ | |
| `year` | integer | ✓ | |
| `dayOfYear` | integer | ✓ | 1-365 |
| `date` | date | ✓ | Actual date |
| `gddDaily` | number | ✓ | GDD accumulated that day |
| `gddCumulative` | number | ✓ | Season-to-date GDD |
| `baseTemp` | number | ✓ | Base temp used (e.g., 55°F for citrus) |
| `highTemp` | number | | Daily high |
| `lowTemp` | number | | Daily low |
| `precipitation` | number | | Daily precip (inches) |
| `dataSource` | string | | |
| `createdAt` | timestamp | ✓ | |

---

## 3. PRODUCER ENTITIES

### 3.1 Farm

Producer/farm entity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `name` | string | ✓ | Legal/business name |
| `displayName` | string | ✓ | Consumer-facing name |
| `description` | string | | |
| `regionId` | FK → Region | ✓ | Primary growing region |
| `address` | object | | {street, city, state, zip, country} |
| `coordinates` | object | | {lat, lng} |
| `website` | string | | |
| `phone` | string | | |
| `email` | string | | |
| `yearEstablished` | integer | | |
| `acreage` | number | | Total farm acreage |
| `ownershipType` | enum | | family, corporate, cooperative |
| `generationsOperating` | integer | | If family farm |
| `certifications` | string[] | | Active certifications |
| `practiceProfile` | FK → AgriculturalPracticeProfile | | Default practices |
| `soilProfile` | object | | Farm-specific soil data if known |
| `primaryProducts` | FK[] → ProductType | | Main products |
| `sellsDirect` | boolean | | D2C sales |
| `sellsWholesale` | boolean | | |
| `distributionChannels` | string[] | | How products reach market |
| `packingHouseId` | FK → PackingHouse | | Associated packing house |
| `isVerified` | boolean | | Fielder verified |
| `verificationDate` | date | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 3.2 PackingHouse

Processing/packing facility.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `name` | string | ✓ | |
| `regionId` | FK → Region | ✓ | |
| `address` | object | | |
| `coordinates` | object | | |
| `certifications` | string[] | | |
| `handlesOrganic` | boolean | | |
| `coldChainCapable` | boolean | | |
| `avgTransitDays` | object | | Transit times to major markets |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

## 4. PRODUCT INSTANCE ENTITIES

### 4.1 Product

A product from a specific farm (not yet a SKU).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `farmId` | FK → Farm | ✓ | Source farm |
| `cultivarId` | FK → Cultivar | ✓ | Specific cultivar |
| `rootstockId` | FK → Rootstock | | For tree crops |
| `name` | string | ✓ | Product name |
| `displayName` | string | ✓ | Consumer-facing |
| `description` | string | | |
| `shareProfileId` | FK → ShareProfile | ✓ | Assigned S.H.A.R.E. profile |
| `practiceProfileId` | FK → AgriculturalPracticeProfile | | Product-specific practices |
| `blockId` | string | | Specific orchard block if known |
| `treeAge` | integer | | Average tree age |
| `plantingYear` | integer | | Year planted |
| `harvestMethod` | enum | | hand, mechanical, etc. |
| `isOrganic` | boolean | | |
| `isRegenerative` | boolean | | |
| `customAttributes` | object | | Additional product-specific data |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 4.2 ProductVariant (SKU)

Sellable unit (specific pack/cut/size).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `productId` | FK → Product | ✓ | Parent product |
| `sku` | string | ✓ | Stock keeping unit |
| `upc` | string | | Universal product code |
| `name` | string | ✓ | Variant name |
| `displayName` | string | ✓ | |
| `description` | string | | |
| `form` | enum | ✓ | fresh, frozen, dried, etc. |
| `cut` | string | | For meat (ribeye, strip, etc.) |
| `size` | enum | | small, medium, large, jumbo |
| `weight` | number | | |
| `weightUnit` | enum | | oz, lb, kg, g |
| `count` | integer | | Number of items |
| `packaging` | string | | Packaging description |
| `priceUsd` | number | | Retail price |
| `pricePerUnit` | number | | Price per lb/oz/each |
| `shelfLifeDays` | integer | | |
| `storageInstructions` | string | | |
| `seasonAvailability` | integer[] | | Months available (1-12) |
| `status` | enum | ✓ | available, low_stock, seasonal, discontinued |
| `brandId` | FK → Brand | | If sold under a brand |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: ProductForm**
```
fresh, frozen, cured, smoked, dried, juiced,
preserved, canned, fermented, live
```

---

### 4.3 Harvest (Lot/Batch)

Specific harvest event for traceability.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `productId` | FK → Product | ✓ | |
| `harvestDate` | date | ✓ | |
| `lotNumber` | string | | Lot/batch identifier |
| `blockId` | string | | Orchard block |
| `estimatedVolume` | number | | Lbs or units |
| `gddAtHarvest` | number | | GDD accumulation |
| `daysFromBloom` | integer | | For tree crops |
| `inPeakWindow` | boolean | | Was it peak timing? |
| `daysFromPeakCenter` | integer | | How close to optimal |
| `weatherConditions` | object | | Weather at harvest |
| `brixAtHarvest` | number | | If measured |
| `acidityAtHarvest` | number | | If measured |
| `packDate` | date | | When packed |
| `packingHouseId` | FK → PackingHouse | | |
| `notes` | string | | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

## 5. S.H.A.R.E. PROFILE ENTITIES

### 5.1 ShareProfile

A distinct claim-combination classification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "beef_true_grass") |
| `code` | string | ✓ | Short code (e.g., "B-A") |
| `name` | string | ✓ | Display name (e.g., "True Grass-Fed Beef") |
| `description` | string | | |
| `categoryId` | FK → Category | ✓ | Applicable category |
| `subcategoryId` | FK → Subcategory | | Applicable subcategory (if specific) |
| `productTypeId` | FK → ProductType | | Applicable product type (if specific) |
| `requiredClaims` | string[] | ✓ | Claims that define this profile |
| `excludedClaims` | string[] | | Claims that exclude from this profile |
| `qualityTier` | enum | ✓ | Expected quality tier |
| `soilPillarSummary` | string | ✓ | S pillar summary |
| `heritagePillarSummary` | string | ✓ | H pillar summary |
| `agriculturalPillarSummary` | string | ✓ | A pillar summary |
| `ripenPillarSummary` | string | ✓ | R pillar summary |
| `enrichPillarSummary` | string | ✓ | E pillar summary |
| `estimatedBrixRange` | number[2] | | E0 estimate for produce |
| `estimatedOmegaRange` | number[2] | | E0 estimate for animal products |
| `estimatedQualityScore` | number | | 0-100 overall score |
| `confidenceLevel` | enum | ✓ | Profile confidence |
| `representativeSampleCount` | integer | | Lab-tested samples |
| `lastValidated` | date | | Last validation date |
| `sortOrder` | integer | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: ConfidenceLevel**
```
high, medium, low, unvalidated
```

---

### 5.2 ShareProfileGrid

The 3×5 grid for a profile (Regulation/Marketing/Reality × S.H.A.R.E.).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `shareProfileId` | FK → ShareProfile | ✓ | |
| `perspective` | enum | ✓ | regulation, marketing, reality |
| `soilContent` | string | ✓ | S pillar content |
| `heritageContent` | string | ✓ | H pillar content |
| `agriculturalContent` | string | ✓ | A pillar content |
| `ripenContent` | string | ✓ | R pillar content |
| `enrichContent` | string | ✓ | E pillar content |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: GridPerspective**
```
regulation  - What USDA/government requires
marketing   - What the label implies to consumers
reality     - Fielder's honest assessment
```

---

### 5.3 AgriculturalPracticeProfile

Detailed A-pillar practices.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `name` | string | ✓ | Profile name |
| `practiceType` | enum | ✓ | Overall classification |
| `isOrganic` | boolean | | USDA Organic certified |
| `isRegenerative` | boolean | | Regenerative certified |
| `isBiodynamic` | boolean | | Demeter certified |
| `certifications` | string[] | | All certifications |
| `pestManagement` | enum | | |
| `fertilizerApproach` | enum | | |
| `irrigationType` | enum | | |
| `tillageType` | enum | | |
| `coverCropping` | boolean | | |
| `cropRotation` | boolean | | |
| `animalWelfare` | enum | | For animal products |
| `dietType` | enum | | For animal products |
| `feedlotExclusion` | boolean | | No CAFO |
| `antibioticFree` | boolean | | |
| `hormoneFree` | boolean | | |
| `customPractices` | object | | Additional practices |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: PracticeType**
```
conventional, ipm, organic, regenerative, biodynamic,
pasture_raised, cafo, wild_harvested, hydroponic
```

**Enum: PestManagement**
```
conventional, ipm, organic_approved, no_spray, biological
```

**Enum: FertilizerApproach**
```
synthetic_annual, organic_annual, soil_banking,
mineralized_science, compost_only, none
```

**Enum: AnimalWelfare**
```
conventional_cafo, cage_free, free_range, pasture_raised,
pasture_raised_certified, wild
```

**Enum: DietType**
```
grain_fed, grass_supplemented, grass_only, pasture_forage,
grain_finished, grass_finished, wild_forage
```

---

## 6. ENRICH MEASUREMENT ENTITIES

### 6.1 EnrichEstimate

E0/E1 estimates (profile-based and predictor-based).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `estimateType` | enum | ✓ | profile (E0) or predictor (E1) |
| `targetType` | enum | ✓ | What this estimate is for |
| `targetId` | string | ✓ | FK to profile, product, or variant |
| `shareProfileId` | FK → ShareProfile | | Source profile for E0 |
| `predictorModelId` | string | | Model used for E1 |
| `predictorVersion` | string | | Model version |
| `brixEstimated` | number | | Point estimate |
| `brixRangeLow` | number | | Lower bound |
| `brixRangeHigh` | number | | Upper bound |
| `brixConfidence` | number | | 0-1 confidence |
| `acidityEstimated` | number | | |
| `acidityRange` | number[2] | | |
| `omegaRatioEstimated` | number | | |
| `omegaRatioRange` | number[2] | | |
| `qualityScoreEstimated` | number | | 0-100 |
| `qualityScoreRange` | number[2] | | |
| `inputAttributes` | object | | E1: inputs used for prediction |
| `estimatedAt` | timestamp | ✓ | |
| `validUntil` | timestamp | | Expiration of estimate |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: EstimateType**
```
profile    - E0: Based on S.H.A.R.E. profile classification only
predictor  - E1: Based on Fielder crop predictor with S+H+A+R inputs
```

**Enum: EstimateTargetType**
```
share_profile, product, product_variant, harvest
```

**inputAttributes object (for E1):**
```json
{
  "cultivarId": "washington_navel",
  "rootstockId": "carrizo",
  "regionId": "indian_river_fl",
  "harvestDate": "2025-01-15",
  "treeAge": 12,
  "gddAccumulated": 2847,
  "daysFromPeakCenter": 3,
  "practiceType": "conventional"
}
```

---

### 6.2 EnrichPrimaryActual

E2: Field-measurable actual values.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `targetType` | enum | ✓ | What was measured |
| `targetId` | string | ✓ | FK to product, variant, or harvest |
| `sampleId` | string | | Sample identifier |
| `measurementDate` | date | ✓ | |
| `measuredBy` | enum | ✓ | Who took measurement |
| `measuredByUserId` | string | | If consumer/user |
| `measuredByFarmId` | FK → Farm | | If farm |
| `instrumentType` | string | | Refractometer model, etc. |
| `brix` | number | | Measured Brix |
| `acidity` | number | | Measured acidity % |
| `brixAcidRatio` | number | | Calculated ratio |
| `ph` | number | | |
| `omegaRatio` | number | | Omega-6:3 ratio |
| `omega3Mg` | number | | Total omega-3 (mg/100g) |
| `omega6Mg` | number | | Total omega-6 |
| `usdaGrade` | string | | USDA grade if applicable |
| `marblingScore` | number | | BMS score for beef |
| `fatContent` | number | | % fat |
| `moistureContent` | number | | % moisture |
| `colorScore` | number | | Color measurement |
| `firmness` | number | | Firmness measurement |
| `notes` | string | | |
| `photoUrls` | string[] | | Photos of measurement |
| `isVerified` | boolean | | Fielder verified |
| `verificationNotes` | string | | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: MeasuredBy**
```
farmer, consumer, fielder_staff, third_party_lab, retailer
```

---

### 6.3 EnrichSecondaryActual

E3: Full lab nutrient panel.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `targetType` | enum | ✓ | |
| `targetId` | string | ✓ | |
| `sampleId` | string | ✓ | Lab sample ID |
| `labId` | FK → Lab | ✓ | Testing laboratory |
| `testDate` | date | ✓ | |
| `reportDate` | date | | |
| `reportNumber` | string | | Lab report number |
| `reportUrl` | string | | Link to full report |
| `testMethodology` | string | | Testing methods used |
| `servingSize` | number | | Serving size for values |
| `servingUnit` | string | | g, oz, etc. |
| `calories` | number | | |
| `protein` | number | | g |
| `totalFat` | number | | g |
| `saturatedFat` | number | | g |
| `monounsaturatedFat` | number | | g |
| `polyunsaturatedFat` | number | | g |
| `transFat` | number | | g |
| `cholesterol` | number | | mg |
| `carbohydrates` | number | | g |
| `fiber` | number | | g |
| `sugars` | number | | g |
| `sodium` | number | | mg |
| `vitamins` | object | | Full vitamin panel |
| `minerals` | object | | Full mineral panel |
| `fattyAcids` | object | | Full fatty acid profile |
| `aminoAcids` | object | | Full amino acid profile |
| `antioxidants` | object | | Antioxidant measurements |
| `phytonutrients` | object | | Phytonutrient measurements |
| `contaminants` | object | | Heavy metals, pesticides |
| `rawLabData` | object | | Full lab JSON if available |
| `isVerified` | boolean | | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**vitamins object:**
```json
{
  "vitamin_a_iu": 500,
  "vitamin_a_rae_mcg": 150,
  "vitamin_c_mg": 53,
  "vitamin_d_iu": 0,
  "vitamin_e_mg": 0.2,
  "vitamin_k_mcg": 0,
  "thiamin_mg": 0.09,
  "riboflavin_mg": 0.04,
  "niacin_mg": 0.3,
  "vitamin_b6_mg": 0.06,
  "folate_mcg": 30,
  "vitamin_b12_mcg": 0,
  "biotin_mcg": null,
  "pantothenic_acid_mg": 0.25
}
```

**minerals object:**
```json
{
  "calcium_mg": 40,
  "iron_mg": 0.1,
  "magnesium_mg": 10,
  "phosphorus_mg": 14,
  "potassium_mg": 181,
  "sodium_mg": 0,
  "zinc_mg": 0.07,
  "copper_mg": 0.05,
  "manganese_mg": 0.03,
  "selenium_mcg": 0.5,
  "iodine_mcg": null
}
```

**fattyAcids object:**
```json
{
  "omega3_total_mg": 120,
  "ala_mg": 50,
  "epa_mg": 30,
  "dha_mg": 40,
  "omega6_total_mg": 350,
  "linoleic_acid_mg": 320,
  "arachidonic_acid_mg": 30,
  "omega6_to_omega3_ratio": 2.9,
  "cla_mg": 38
}
```

**antioxidants object:**
```json
{
  "orac_score": 1200,
  "total_polyphenols_mg": 42,
  "flavonoids_mg": 25,
  "anthocyanins_mg": 0,
  "lycopene_mcg": 0,
  "beta_carotene_mcg": 180,
  "lutein_zeaxanthin_mcg": 50,
  "resveratrol_mcg": 0
}
```

---

### 6.4 Lab

Testing laboratory reference.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `name` | string | ✓ | Lab name |
| `shortName` | string | | |
| `website` | string | | |
| `address` | object | | |
| `accreditations` | string[] | | ISO, etc. |
| `testTypes` | string[] | | Types of tests offered |
| `turnaroundDays` | integer | | Typical turnaround |
| `priceRange` | string | | Typical cost range |
| `notes` | string | | |
| `isPreferred` | boolean | | Fielder preferred lab |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

## 7. CLAIM ENTITIES

### 7.1 Claim

Food label claim definition.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key (e.g., "grass_fed") |
| `name` | string | ✓ | Claim name |
| `displayName` | string | ✓ | Consumer-facing |
| `description` | string | | |
| `claimType` | enum | ✓ | Category of claim |
| `regulatoryStatus` | enum | ✓ | How regulated |
| `regulatoryBody` | string | | USDA, FDA, third-party |
| `enforcementLevel` | enum | ✓ | |
| `meaningfulness` | enum | ✓ | Fielder assessment |
| `usdaDefinition` | string | | Official USDA definition |
| `commonInterpretation` | string | | What consumers think |
| `fielderPosition` | string | | Our assessment |
| `appliesTo` | string[] | | Which categories/products |
| `impliesPillar` | string[] | | Which S.H.A.R.E. pillars affected |
| `excludesProfile` | string[] | | Profiles this claim excludes |
| `requiresProfile` | string[] | | Profiles this claim requires |
| `sortOrder` | integer | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: ClaimType**
```
origin, animal_welfare, feeding_practice, certification,
production_method, environmental, quality_grade, health_claim
```

**Enum: RegulatoryStatus**
```
usda_regulated, fda_regulated, third_party_certified,
self_certified, no_legal_definition
```

**Enum: EnforcementLevel**
```
strong, moderate, weak, none
```

**Enum: Meaningfulness**
```
meaningful, somewhat_meaningful, marketing, misleading, unregulated
```

---

## 8. INFERENCE ENGINE ENTITIES

### 8.1 InferenceRequest

Log of inference requests for analytics.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `requestType` | enum | ✓ | scan, lookup, manual |
| `inputType` | enum | ✓ | plu, upc, manual_entry |
| `inputValue` | string | ✓ | The input code/text |
| `scanLocation` | object | | {lat, lng, store} |
| `scanDate` | timestamp | ✓ | |
| `userId` | string | | If logged in user |
| `sessionId` | string | | Anonymous session |
| `inferredCategoryId` | FK → Category | | |
| `inferredProductTypeId` | FK → ProductType | | |
| `inferredVarietyId` | FK → Variety | | |
| `inferredCultivarId` | FK → Cultivar | | |
| `inferredRegionId` | FK → Region | | |
| `inferredShareProfileId` | FK → ShareProfile | | |
| `enrichEstimateId` | FK → EnrichEstimate | | Generated estimate |
| `confidenceScore` | number | | 0-1 overall confidence |
| `inferenceChain` | object | | Steps taken to infer |
| `processingTimeMs` | integer | | |
| `createdAt` | timestamp | ✓ | |

**Enum: InferenceInputType**
```
plu_code, upc_barcode, qr_code, manual_product,
manual_variety, brand_product_lookup
```

---

### 8.2 InferenceRule

Rules for inference engine.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `name` | string | ✓ | Rule name |
| `description` | string | | |
| `ruleType` | enum | ✓ | Type of rule |
| `priority` | integer | ✓ | Execution order |
| `conditions` | object | ✓ | When rule applies |
| `inference` | object | ✓ | What to infer |
| `confidence` | number | ✓ | Confidence of this rule |
| `effectiveDate` | date | | |
| `expirationDate` | date | | |
| `dataSource` | string | | Source of rule |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: RuleType**
```
plu_mapping, seasonal_origin, regional_cultivar,
claim_to_profile, brand_mapping, default_fallback
```

**Example rule (conditions/inference):**
```json
{
  "conditions": {
    "pluCode": "4012",
    "scanMonth": [11, 12, 1, 2, 3],
    "scanRegion": "US"
  },
  "inference": {
    "productTypeId": "orange",
    "varietyId": "navel_orange",
    "likelyOrigins": ["indian_river_fl", "central_valley_ca"],
    "originWeights": [0.6, 0.4]
  }
}
```

---

## 9. USER & INTERACTION ENTITIES

### 9.1 User

User account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `email` | string | ✓ | |
| `passwordHash` | string | | |
| `firstName` | string | | |
| `lastName` | string | | |
| `displayName` | string | | |
| `role` | enum | ✓ | |
| `farmId` | FK → Farm | | If farmer user |
| `location` | object | | User location |
| `preferences` | object | | User preferences |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Enum: UserRole**
```
consumer, farmer, retailer, admin, researcher
```

---

### 9.2 UserMeasurement

Consumer-submitted measurements.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `userId` | FK → User | ✓ | |
| `enrichPrimaryActualId` | FK → EnrichPrimaryActual | ✓ | The measurement |
| `productVariantId` | FK → ProductVariant | | If known product |
| `inferenceRequestId` | FK → InferenceRequest | | If from scan |
| `purchaseLocation` | string | | Where bought |
| `purchaseDate` | date | | |
| `purchasePrice` | number | | |
| `userRating` | integer | | 1-5 star rating |
| `userNotes` | string | | |
| `photoUrls` | string[] | | |
| `isPublic` | boolean | | Share with community |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

## 10. BRAND ENTITIES

### 10.1 Brand

Consumer brand.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `name` | string | ✓ | Brand name |
| `displayName` | string | ✓ | |
| `description` | string | | |
| `website` | string | | |
| `logoUrl` | string | | |
| `parentCompanyId` | FK → Company | | |
| `ownedFarmIds` | FK[] → Farm | | Farms owned by brand |
| `defaultShareProfileId` | FK → ShareProfile | | Default profile |
| `claimsAsserted` | string[] | | Claims the brand makes |
| `certifications` | string[] | | Brand-level certifications |
| `isVerified` | boolean | | Fielder verified |
| `verificationDate` | date | | |
| `verificationNotes` | string | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

### 10.2 BrandProduct

Brand's product offerings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Primary key |
| `brandId` | FK → Brand | ✓ | |
| `productVariantId` | FK → ProductVariant | | If linked to known variant |
| `name` | string | ✓ | Product name as sold |
| `upc` | string | | |
| `pluCode` | string | | |
| `description` | string | | |
| `shareProfileId` | FK → ShareProfile | | Assigned profile |
| `claimsAsserted` | string[] | | Product-level claims |
| `sourceFarmIds` | FK[] → Farm | | Known source farms |
| `sourceRegionIds` | FK[] → Region | | Known source regions |
| `seasonAvailability` | integer[] | | |
| `isActive` | boolean | ✓ | |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

---

## RELATIONSHIP SUMMARY

### Primary Relationships

```
Category (1) ─────────────── (N) Subcategory
Subcategory (1) ──────────── (N) ProductType
ProductType (1) ──────────── (N) Variety
Variety (1) ───────────────── (N) Cultivar

Region (1) ────────────────── (N) Farm
Farm (1) ──────────────────── (N) Product
Product (1) ───────────────── (N) ProductVariant
Product (1) ───────────────── (N) Harvest

ShareProfile (1) ─────────── (N) Product (assigned)
ShareProfile (1) ─────────── (3) ShareProfileGrid (one per perspective)
ShareProfile (1) ─────────── (N) EnrichEstimate (E0 estimates)

Product (1) ───────────────── (N) EnrichEstimate (E1 estimates)
Product/Variant/Harvest (1) ─ (N) EnrichPrimaryActual (E2 measurements)
Product/Variant/Harvest (1) ─ (N) EnrichSecondaryActual (E3 lab tests)

Region (1) ────────────────── (1) RegionalSoilProfile
Region (1) ────────────────── (N) RegionalCultivarDistribution
Region (1) ────────────────── (N) RegionalRootstockDistribution
Region (1) ────────────────── (N) RegionalPracticeNorms
Region (1) ────────────────── (N) RegionalGDDData

Brand (1) ─────────────────── (N) BrandProduct
BrandProduct (N) ─────────── (1) ShareProfile

User (1) ──────────────────── (N) UserMeasurement
UserMeasurement (1) ───────── (1) EnrichPrimaryActual
```

### Foreign Key Index

| Entity | Foreign Keys |
|--------|--------------|
| Subcategory | categoryId |
| ProductType | subcategoryId |
| Variety | productTypeId |
| Cultivar | varietyId |
| Farm | regionId, practiceProfileId |
| Product | farmId, cultivarId, rootstockId, shareProfileId, practiceProfileId |
| ProductVariant | productId, brandId |
| Harvest | productId, packingHouseId |
| ShareProfile | categoryId, subcategoryId, productTypeId |
| ShareProfileGrid | shareProfileId |
| EnrichEstimate | shareProfileId |
| EnrichPrimaryActual | (polymorphic: targetType + targetId) |
| EnrichSecondaryActual | (polymorphic: targetType + targetId), labId |
| RegionalCultivarDistribution | regionId, varietyId, cultivarId |
| RegionalRootstockDistribution | regionId, cultivarId, rootstockId |
| RegionalPracticeNorms | regionId, productTypeId |
| RegionalGDDData | regionId |
| BrandProduct | brandId, productVariantId, shareProfileId |
| UserMeasurement | userId, enrichPrimaryActualId, productVariantId, inferenceRequestId |
| InferenceRequest | (multiple inferred FKs) |

---

## APPENDIX A: Complete Enum Reference

### Category/Product Enums
```typescript
type CategoryId = 'fruit' | 'vegetable' | 'nut' | 'meat' | 'poultry' | 'eggs' |
  'seafood' | 'dairy' | 'grain' | 'oil' | 'sweetener' | 'beverage' | 'condiment';

type PrimaryQualityMetric = 'brix' | 'omega_ratio' | 'usda_grade' |
  'polyphenol_content' | 'mineral_density' | 'protein_quality' | 'fat_composition';

type MaturityBehavior = 'climacteric' | 'non_climacteric' | 'not_applicable';

type SeasonalityPattern = 'year_round' | 'winter' | 'spring' | 'summer' | 'fall' |
  'winter_spring' | 'summer_fall' | 'short_season';

type HeritageIntent = 'true_heritage' | 'heirloom_quality' | 'heirloom_utility' |
  'modern_nutrient' | 'modern_flavor' | 'commercial';

type QualityTier = 'artisan' | 'premium' | 'standard' | 'commodity';

type ProductForm = 'fresh' | 'frozen' | 'cured' | 'smoked' | 'dried' | 'juiced' |
  'preserved' | 'canned' | 'fermented' | 'live';

type ProductStatus = 'available' | 'low_stock' | 'seasonal' | 'pre_order' |
  'sold_out' | 'discontinued';

type SizeCategory = 'small' | 'medium' | 'large' | 'jumbo' | 'variable';
```

### Geographic/Practice Enums
```typescript
type Vigor = 'dwarfing' | 'semi_dwarfing' | 'medium' | 'semi_vigorous' | 'vigorous';

type SoilTexture = 'sandy' | 'loamy' | 'clay' | 'silty' | 'peaty' | 'chalky';

type Drainage = 'poor' | 'moderate' | 'well' | 'excessive';

type PracticeType = 'conventional' | 'ipm' | 'organic' | 'regenerative' |
  'biodynamic' | 'pasture_raised' | 'cafo' | 'wild_harvested' | 'hydroponic';

type PestManagement = 'conventional' | 'ipm' | 'organic_approved' | 'no_spray' | 'biological';

type FertilizerApproach = 'synthetic_annual' | 'organic_annual' | 'soil_banking' |
  'mineralized_science' | 'compost_only' | 'none';

type IrrigationType = 'drip' | 'sprinkler' | 'flood' | 'dry_farmed' | 'none';

type TillageType = 'conventional' | 'reduced' | 'no_till' | 'strip_till';

type AnimalWelfare = 'conventional_cafo' | 'cage_free' | 'free_range' |
  'pasture_raised' | 'pasture_raised_certified' | 'wild';

type DietType = 'grain_fed' | 'grass_supplemented' | 'grass_only' |
  'pasture_forage' | 'grain_finished' | 'grass_finished' | 'wild_forage';
```

### S.H.A.R.E. Enums
```typescript
type GridPerspective = 'regulation' | 'marketing' | 'reality';

type EstimateType = 'profile' | 'predictor';

type EstimateTargetType = 'share_profile' | 'product' | 'product_variant' | 'harvest';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unvalidated';

type MeasuredBy = 'farmer' | 'consumer' | 'fielder_staff' | 'third_party_lab' | 'retailer';
```

### Claim Enums
```typescript
type ClaimType = 'origin' | 'animal_welfare' | 'feeding_practice' | 'certification' |
  'production_method' | 'environmental' | 'quality_grade' | 'health_claim';

type RegulatoryStatus = 'usda_regulated' | 'fda_regulated' | 'third_party_certified' |
  'self_certified' | 'no_legal_definition';

type EnforcementLevel = 'strong' | 'moderate' | 'weak' | 'none';

type Meaningfulness = 'meaningful' | 'somewhat_meaningful' | 'marketing' |
  'misleading' | 'unregulated';
```

### User/Inference Enums
```typescript
type UserRole = 'consumer' | 'farmer' | 'retailer' | 'admin' | 'researcher';

type InferenceInputType = 'plu_code' | 'upc_barcode' | 'qr_code' |
  'manual_product' | 'manual_variety' | 'brand_product_lookup';

type InferenceRuleType = 'plu_mapping' | 'seasonal_origin' | 'regional_cultivar' |
  'claim_to_profile' | 'brand_mapping' | 'default_fallback';
```

---

## APPENDIX B: Index Recommendations

### Primary Indexes
- All primary keys (id fields)
- All foreign key relationships

### Search/Filter Indexes
- `Category.isActive`
- `Product.farmId` + `Product.isActive`
- `ProductVariant.sku`
- `ProductVariant.upc`
- `Variety.pluCode`
- `ShareProfile.categoryId` + `ShareProfile.isActive`
- `EnrichPrimaryActual.targetType` + `EnrichPrimaryActual.targetId`
- `EnrichSecondaryActual.targetType` + `EnrichSecondaryActual.targetId`
- `RegionalGDDData.regionId` + `RegionalGDDData.date`
- `InferenceRequest.scanDate`
- `UserMeasurement.userId` + `UserMeasurement.createdAt`

### Composite Indexes
- `RegionalCultivarDistribution(regionId, varietyId)`
- `RegionalRootstockDistribution(regionId, cultivarId)`
- `Harvest(productId, harvestDate)`

---

## APPENDIX C: Data Validation Rules

### Required Relationships
- Every `Subcategory` must have a valid `Category`
- Every `ProductType` must have a valid `Subcategory`
- Every `Variety` must have a valid `ProductType`
- Every `Cultivar` must have a valid `Variety`
- Every `Product` must have a valid `Farm` and `Cultivar`
- Every `ProductVariant` must have a valid `Product`
- Every `ShareProfile` must have a valid `Category`

### Value Constraints
- `brixRange[0]` < `brixRange[1]`
- `omegaRatioRange[0]` < `omegaRatioRange[1]`
- `qualityScore` between 0 and 100
- `confidenceScore` between 0 and 1
- `harvestWindowStart` < `harvestWindowEnd`
- `peakHarvestStart` >= `harvestWindowStart`
- `peakHarvestEnd` <= `harvestWindowEnd`

### Business Rules
- A `Product` can only be assigned one `ShareProfile`
- `EnrichPrimaryActual` measurements must have at least one metric (brix, omega, etc.)
- `EnrichSecondaryActual` must have a valid `Lab` reference
- `ShareProfileGrid` must have exactly 3 rows (one per perspective)

---

*Document Version: 1.0*
*Last Updated: 2025-12-17*
*Author: Fielder Data Architecture*
