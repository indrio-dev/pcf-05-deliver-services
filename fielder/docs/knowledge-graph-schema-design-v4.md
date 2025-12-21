# Knowledge Graph Schema Design v4 - Polymorphic SHARE Model

**Date:** 2025-12-21
**Purpose:** Complete graph schema modeling ALL farm-to-table product categories with polymorphic SHARE relationships

---

## Executive Summary

This schema models Fielder's complete scope across 80+ product types spanning produce, meat, seafood, dairy, and processed foods. The key insight: **SHARE is polymorphic** - the same 5 pillars have completely different meanings, measurements, and relationship structures per category.

**Core Principle:** The graph models HOW quality is determined across categories, not just WHAT products exist.

---

## I. Cross-Category Foundation

### Universal Entity Types (All Categories)

```graphql
# ============================================================================
# GEOGRAPHIC HIERARCHY (S pillar foundation)
# ============================================================================

type State {
  id: ID!                        # "florida"
  name: String!                  # "Florida"
  code: String!                  # "FL"
  zones: [Zone!]!                # USDA hardiness zones
  regions: [Region!]!            # Growing regions within state
}

type Zone {
  id: ID!                        # "zone_10"
  zoneNumber: String!            # "10a", "10b"
  avgAnnualMinTemp: Float!       # Average annual minimum temperature (°F)
  frostDates: FrostDates!        # Last spring / first fall frost
  avgDailyGDD: Float!            # Average daily GDD accumulation
  heatDays: Int!                 # Days >90°F
  regions: [Region!]!
}

type FrostDates {
  lastSpring: String!            # "Mar 15" (10% probability)
  firstFall: String!             # "Nov 15" (10% probability)
}

type Region {
  id: ID!                        # "indian_river_fl"
  name: String!                  # "Indian River"
  state: State!
  zone: Zone!
  lat: Float!
  lon: Float!

  # S pillar data (varies by category)
  typicalSoil: SoilProfile       # For produce
  waterType: WaterType           # For seafood
  pastureType: PastureType       # For livestock

  # Category-specific relationships
  growsOfferings: [ProduceOffering!]!
  hasAquaculture: [SeafoodOffering!]!
  hasPastureLand: [LivestockFarm!]!
}

# ============================================================================
# MEASUREMENT & VERIFICATION (E pillar)
# ============================================================================

type QualityPrediction {
  id: ID!
  offeringId: ID!                # Links to category-specific offering
  category: ProductCategory!

  # Prediction data (polymorphic by category)
  expectedBrix: Float            # Produce
  expectedOmegaRatio: Float      # Meat/dairy
  expectedOmega3: Float          # Seafood

  qualityTier: QualityTier!      # 'exceptional' | 'excellent' | 'good' | 'standard'
  confidence: Float!             # 0.0 - 1.0

  # SHARE pillar breakdown
  sharePillars: SHAREBreakdown!

  predictedDate: DateTime!
  source: String!                # "gdd_model", "omega_model", "cv_estimate"
}

type QualityMeasurement {
  id: ID!
  predictionId: ID               # Links to prediction (optional)
  offeringId: ID!                # Links to category-specific offering
  category: ProductCategory!

  # Measurement data (polymorphic by category)
  measuredBrix: Float            # Produce (refractometer)
  measuredOmegaRatio: Float      # Meat/dairy (lab test)
  measuredOmega3: Float          # Seafood (lab test)
  measuredMercury: String        # Seafood (lab test)

  # Lab verification
  labVerified: Boolean!
  labName: String                # "Edacious", "Texas A&M", "BioNutrient"
  labTestDate: DateTime

  # Measurement context
  measurementDate: DateTime!
  measurementLocation: Location
  measuredBy: String             # "consumer", "farm", "lab"
}

type Calibration {
  id: ID!
  predictionId: ID!
  measurementId: ID!

  predictedValue: Float!
  actualValue: Float!
  delta: Float!                  # actual - predicted
  percentError: Float!           # (delta / predicted) * 100

  # Feedback loop - improves model
  adjustedConfidence: Float!
  modelVersion: String!
  calibrationDate: DateTime!
}

enum ProductCategory {
  PRODUCE
  MEAT
  SEAFOOD
  DAIRY
  PROCESSED
}

enum QualityTier {
  EXCEPTIONAL                    # Top 5%
  EXCELLENT                      # Top 20%
  GOOD                           # Top 50%
  STANDARD                       # Bottom 50%
  COMMODITY                      # Bottom 20%
}

type SHAREBreakdown {
  s_score: Float!                # Soil/Sea/Pasture quality (0-1)
  h_score: Float!                # Heritage/Breed/Species quality (0-1)
  a_score: Float!                # Agricultural practices quality (0-1)
  r_score: Float!                # Timing/Maturity quality (0-1)
  e_confidence: Float!           # Measurement confidence (0-1)

  overall: Float!                # Weighted average

  # Educational breakdown
  s_description: String!
  h_description: String!
  a_description: String!
  r_description: String!
}

# ============================================================================
# FARM ENTITY (All Categories)
# ============================================================================

type Farm {
  id: ID!
  name: String!
  region: Region!
  lat: Float!
  lon: Float!

  # What this farm produces (polymorphic)
  produceOfferings: [ProduceOffering!]!
  livestockOfferings: [LivestockOffering!]!
  dairyOfferings: [DairyOffering!]!

  # A pillar (varies by what they grow/raise)
  practices: AgriculturalPractices!

  # Verification
  isVerified: Boolean!
  verificationDate: DateTime
  verificationSource: String
}
```

---

## II. PRODUCE Model (GDD-Based)

### Produce-Specific Entities

```graphql
# ============================================================================
# PRODUCE GENETIC HIERARCHY (H pillar)
# ============================================================================

type ProductType {
  id: ID!                        # "orange"
  name: String!                  # "Orange"
  category: String!              # "fruit"
  subcategory: String!           # "citrus"
  varieties: [Variety!]!
}

type Variety {
  id: ID!                        # "navel"
  name: String!                  # "Navel"
  productType: ProductType!
  cultivars: [Cultivar!]!
}

type Cultivar {
  id: ID!                        # "washington_navel"
  displayName: String!           # "Washington Navel"
  variety: Variety!

  # H pillar (Heritage) - Genetic attributes
  heritageIntent: HeritageIntent!
  isNonGmo: Boolean!
  flavorProfile: String!
  nutritionNotes: String

  # H pillar - Quality potential
  brixRange: BrixRange!          # [min, max] genetic potential

  # R pillar (Ripen) - Timing baseline (before region modifier)
  baseTemp: Float!               # GDD base temperature (°F)
  maxTemp: Float                 # Upper developmental threshold
  gddToMaturity: Int!            # GDD from planting/bloom to harvest
  gddToPeak: Int                 # GDD to optimal quality
  gddWindow: Int!                # GDD range for harvest window
  plantingMethod: PlantingMethod # direct_seed | transplant | either
  transplantAge: Int             # Indoor GDD before field (for transplants)
  chillHoursRequired: Int        # For perennials

  # Where it can be grown
  regionalOfferings: [ProduceOffering!]!
  validatedStates: [State!]!
}

type Rootstock {
  id: ID!                        # "carrizo"
  name: String!                  # "Carrizo Citrange"
  scientificName: String!        # "Citrus sinensis × Poncirus trifoliata"

  # H pillar modifier (genetic, not agricultural)
  brixModifier: Float!           # +0.6, -0.7, etc.
  diseaseResistance: [String!]!  # ["CTV", "Phytophthora"]

  usedFor: [Cultivar!]!          # Which cultivars use this rootstock
}

enum HeritageIntent {
  TRUE_HERITAGE                  # Selected for flavor/nutrition over generations
  HEIRLOOM_QUALITY               # Pre-1950 open-pollinated AND high quality
  HEIRLOOM_UTILITY               # Pre-1950 but bred for hardiness (not quality)
  MODERN_NUTRIENT                # Modern breeding with nutrition focus
  MODERN_FLAVOR                  # Modern breeding with flavor focus
  COMMERCIAL                     # Modern yield/shipping/appearance focus
}

enum PlantingMethod {
  DIRECT_SEED
  TRANSPLANT
  EITHER
}

type BrixRange {
  min: Float!
  max: Float!
  typical: Float!
}

# ============================================================================
# PRODUCE OFFERING MODEL: Cultivar × Region
# ============================================================================

type ProduceOffering {
  id: ID!                        # "${cultivarId}_${regionId}"
  cultivar: Cultivar!            # WHAT is grown
  region: Region!                # WHERE it's grown

  # S pillar (Soil) - FROM REGION
  soil: SoilProfile!
  terroirNotes: String

  # H pillar (Heritage) - FROM CULTIVAR + ROOTSTOCK
  rootstock: Rootstock           # For perennials
  heritageScore: Float!          # Computed from cultivar + rootstock

  # A pillar (Agricultural) - FROM FARM (if known)
  practices: AgriculturalPractices

  # R pillar (Ripen) - COMPUTED: Region-specific timing
  plantingWindows: [PlantingWindow!]!
  harvestWindows: [HarvestWindow!]!
  peakMonths: [Int!]!            # 1-12
  availableMonths: [Int!]!       # 1-12

  # E pillar (Enrich) - PREDICTED + MEASURED
  expectedBrix: Float!
  expectedQualityTier: QualityTier!
  predictions: [QualityPrediction!]!
  measurements: [QualityMeasurement!]!

  # Which farms actually grow this
  farms: [FarmOffering!]!
}

# ============================================================================
# PRODUCE S PILLAR: SOIL
# ============================================================================

type SoilProfile {
  soilType: String!              # "Sandy loam", "Clay loam"
  texture: String!               # "Sandy", "Loamy", "Clay"
  drainage: String!              # "Excellent", "Good", "Moderate"
  ph: Float                      # 5.5-8.0
  organicMatter: Float           # Percentage
  cec: Float                     # Cation Exchange Capacity

  # Mineral content (if known)
  nitrogen: String               # "Low", "Medium", "High"
  phosphorus: String
  potassium: String
  calcium: String
  magnesium: String
  sulfur: String

  # Mineralization status (THE quality differentiator)
  isMineralized: Boolean!        # Alternative Ag soil science
  mineralizationNotes: String
}

# ============================================================================
# PRODUCE A PILLAR: PRACTICES
# ============================================================================

type AgriculturalPractices {
  # Fertility strategy (S↔A interconnectivity)
  fertilityStrategy: FertilityStrategy!

  # Pest management (separate axis from nutrition)
  pestManagement: PestManagement!

  # Production details
  irrigationMethod: String       # "Drip", "Sprinkler", "Flood"
  coverCropping: Boolean!
  compostApplication: Boolean!
  cropRotation: Boolean!
  cropLoadManaged: Boolean!      # Fruit thinning for quality

  # Certifications
  isOrganic: Boolean!
  certifications: [String!]!     # "USDA Organic", "Biodynamic", etc.
}

type FertilityStrategy {
  approach: FertilityApproach!
  coverCropping: Boolean!
  compostApplication: Boolean!
  mineralizedSoil: Boolean!      # THE key differentiator

  # If mineralized, what system?
  mineralizationSystem: String   # "Albrecht", "ACRES USA", "BioNutrient"
}

enum FertilityApproach {
  ANNUAL_FERTILITY               # Conventional/IPM - invest in A pillar inputs
  SOIL_BANKING                   # Organic/Regen - invest in S pillar
  MINERALIZED_SOIL_SCIENCE       # Alternative Ag - best S + optimized A
}

enum PestManagement {
  CONVENTIONAL                   # All tools available
  IPM                            # Integrated Pest Management
  ORGANIC                        # OMRI approved inputs only
  NO_SPRAY                       # No pesticides/herbicides
}

# ============================================================================
# PRODUCE R PILLAR: TIMING
# ============================================================================

type PlantingWindow {
  id: ID!
  offering: ProduceOffering!     # Which Cultivar × Region

  # Timing (computed from Zone frost dates + Cultivar GDD)
  startMonth: Int!               # 1-12
  endMonth: Int!                 # 1-12
  startDay: Int                  # Day of year (1-365)
  endDay: Int                    # Day of year (1-365)

  method: PlantingMethod!
  transplantAge: Int             # If transplant method

  # Zone-specific
  zone: Zone!
  frostRiskStart: String         # "Low", "Medium", "High"
  frostRiskEnd: String

  # Confidence
  confidence: Float!             # 0.0 - 1.0
  source: String!                # "gdd_calculation", "uf_ifas_extension", etc.
}

type HarvestWindow {
  id: ID!
  offering: ProduceOffering!     # Which Cultivar × Region
  plantingWindow: PlantingWindow! # Links to planting

  # Timing (computed from PlantingWindow + GDD accumulation)
  startMonth: Int!               # 1-12
  endMonth: Int!                 # 1-12
  peakStartMonth: Int!           # Peak quality begins
  peakEndMonth: Int!             # Peak quality ends

  startDay: Int                  # Day of year (1-365)
  endDay: Int
  peakStartDay: Int
  peakEndDay: Int

  # GDD-based
  gddToStart: Int!               # GDD from planting to first harvest
  gddToPeak: Int!                # GDD to peak quality
  gddToEnd: Int!                 # GDD to end of harvest

  # Quality timing
  expectedBrixAtStart: Float!
  expectedBrixAtPeak: Float!
  expectedBrixAtEnd: Float!

  # Confidence
  confidence: Float!
  source: String!
}

# ============================================================================
# PRODUCE FARM-LEVEL: FarmOffering
# ============================================================================

type FarmOffering {
  id: ID!
  farm: Farm!
  offering: ProduceOffering!     # Which Cultivar × Region combo

  # Farm-specific details (adds precision to offering)
  rootstock: Rootstock           # Actual rootstock used (if perennial)
  treeAge: Int                   # Years (if perennial)
  acreage: Float!
  plantingDate: DateTime         # When actually planted

  # A pillar (farm's actual practices)
  practices: AgriculturalPractices!

  # R pillar (farm's actual timing)
  expectedHarvestDate: DateTime
  actualHarvestDate: DateTime

  # E pillar (farm's actual measurements)
  measurements: [QualityMeasurement!]!

  # Availability (real-time inventory)
  currentAvailability: AvailabilityStatus!
  quantityAvailable: Float       # Pounds, units, etc.
  pricePerUnit: Float
}

enum AvailabilityStatus {
  AVAILABLE_NOW
  AVAILABLE_SOON                 # Within 2 weeks
  PREORDER                       # Accepting orders for future harvest
  OUT_OF_SEASON
  SOLD_OUT
}
```

### Produce Relationship Summary

```
State --HAS_ZONE--> Zone --INCLUDES_REGION--> Region

ProductType --HAS_VARIETY--> Variety --HAS_CULTIVAR--> Cultivar
Cultivar --GRAFTED_ON--> Rootstock (H pillar modifier)

Cultivar + Region = ProduceOffering (THE KEY RELATIONSHIP)
  ├── Inherits H from Cultivar + Rootstock
  ├── Inherits S from Region → SoilProfile
  ├── Gets A from Farm (if known)
  ├── Computes R: PlantingWindow + HarvestWindow
  └── Measures E: Predictions + Measurements

Farm --LOCATED_IN--> Region
Farm --GROWS--> ProduceOffering (via FarmOffering)
FarmOffering = Farm + ProduceOffering + Practices + Timing + Measurements
```

---

## III. LIVESTOCK Model (Omega-Based)

### Livestock-Specific Entities

```graphql
# ============================================================================
# LIVESTOCK GENETIC HIERARCHY (H pillar)
# ============================================================================

type AnimalType {
  id: ID!                        # "beef_cattle"
  name: String!                  # "Beef Cattle"
  category: String!              # "meat"
  subcategory: String!           # "red_meat"
  breeds: [Breed!]!
}

type Breed {
  id: ID!                        # "american_wagyu"
  displayName: String!           # "American Wagyu"
  animalType: AnimalType!

  # H pillar (Heritage/Genetics)
  origin: String!                # "Japan × USA"
  heritageIntent: String!        # "Marbling genetics"

  # H pillar - Quality baseline
  omegaModifier: Float!          # +0.8 (Wagyu), -1.0 (Heritage grass breeds)
  marblingPotential: String!     # "Exceptional", "High", "Moderate"

  # Typical characteristics
  typicalMaturityAge: Int!       # Months to full maturity (24 for beef)
  typicalHarvestAge: Int!        # Months at typical harvest

  # Where it's raised
  farms: [LivestockFarm!]!
}

# ============================================================================
# LIVESTOCK OFFERING MODEL: Breed × Farm × Practices
# ============================================================================

type LivestockOffering {
  id: ID!
  breed: Breed!                  # WHAT breed
  farm: LivestockFarm!           # WHERE raised

  # S pillar (Pasture) - FROM FARM
  pastureType: PastureType!
  pastureQuality: PastureQuality!

  # H pillar (Heritage) - FROM BREED
  omegaBaseline: Float!          # Breed's genetic omega baseline

  # A pillar (Agricultural) - FROM FARM (CRITICAL for omega)
  feedingRegime: FeedingRegime!  # 80% of omega outcome

  # R pillar (Duration) - FROM FARM
  ageAtHarvest: Int!             # Months (24 vs 14-18 commodity)
  feedlotDuration: Int!          # Months in feedlot (0 = no feedlot)
  durationPenalty: Float!        # +0.5 per month beyond 4 months

  # E pillar (Omega Ratio) - PREDICTED + MEASURED
  expectedOmegaRatio: Float!     # 3:1 to 26:1
  omegaTier: OmegaTier!
  predictions: [QualityPrediction!]!
  measurements: [QualityMeasurement!]!

  # Products (cuts) derived from this offering
  products: [MeatProduct!]!
}

# ============================================================================
# LIVESTOCK S PILLAR: PASTURE
# ============================================================================

type PastureType {
  type: String!                  # "Native grass", "Improved pasture", "Feedlot"
  primaryForage: [String!]!      # ["Bahia grass", "Clover"]
  pastureSystem: PastureSystem!
  rotationalGrazing: Boolean!
  acresPerAnimal: Float          # Stocking density
}

enum PastureSystem {
  PASTURE_ONLY                   # 100% on pasture
  PASTURE_WITH_SUPPLEMENT        # Pasture + free-choice grain (concurrent)
  BACKGROUNDED_THEN_FEEDLOT      # Pasture → Feedlot (sequential)
  FEEDLOT_ONLY                   # CAFO
}

type PastureQuality {
  forageDiversity: String!       # "High", "Moderate", "Low"
  mineralizedSoil: Boolean!      # Alternative Ag for pasture
  seasonalRotation: Boolean!
  qualityScore: Float!           # 0.0 - 1.0
}

# ============================================================================
# LIVESTOCK A PILLAR: FEEDING REGIME (80% of omega outcome)
# ============================================================================

type FeedingRegime {
  diet: Diet!                    # THE critical factor
  isOrganicGrain: Boolean!       # Warning flag (organic often = grain-fed)

  # Feeding sequence (CRITICAL distinction)
  sequence: FeedingSequence!

  # Grain details (if applicable)
  grainType: [String!]           # ["Corn", "Soy"]
  grainStartAge: Int             # Months when grain introduced
  grainPercentage: Float         # % of diet (if concurrent)

  # Process exclusions (only these matter for omega)
  noFeedlot: Boolean!            # CAFO exclusion claim
  noCAFO: Boolean!               # CAFO exclusion claim
  neverConfined: Boolean!        # CAFO exclusion claim

  # Other attributes (separate from omega)
  noAntibiotics: Boolean!
  noHormones: Boolean!
  noVaccines: Boolean!
}

enum Diet {
  GRASS_ONLY                     # 100% grass, ~3:1 omega
  PASTURE_GRAIN_SUPP             # Concurrent grass + grain, ~6:1 omega
  GRAIN_FINISHED                 # Sequential: pasture → feedlot, ~14:1 omega
  GRAIN_FED                      # Extended feedlot, ~20:1 omega
}

enum FeedingSequence {
  GRASS_ONLY                     # Never grain
  CONCURRENT                     # Grass + grain simultaneously (stays on pasture)
  SEQUENTIAL                     # Grass first, THEN grain (removed to feedlot)
}

# ============================================================================
# LIVESTOCK E PILLAR: OMEGA RATIO
# ============================================================================

enum OmegaTier {
  TRUE_GRASS                     # ≤3:1 - Exceptional
  TRUE_PASTURE                   # 3-7:1 - Premium (Indrio model)
  MARKETING_GRASS                # 10-20:1 - Same as commodity
  COMMODITY                      # 10-20:1 - Feedlot standard
  PREMIUM_CAFO                   # 20-26:1 - Extended feedlot (WORST)
}

type OmegaRatioMeasurement {
  ratio: Float!                  # 3.2:1 → 3.2
  omega6: Float!                 # g per 100g
  omega3: Float!                 # g per 100g
  tier: OmegaTier!

  # Lab verification
  labVerified: Boolean!
  labName: String
  testDate: DateTime
}

# ============================================================================
# LIVESTOCK PRODUCTS (Cuts)
# ============================================================================

type MeatProduct {
  id: ID!
  offering: LivestockOffering!   # Parent offering

  # Product details
  cut: String!                   # "Ribeye", "Ground Beef", "Tenderloin"
  weightOz: Float!               # Typical package weight

  # SHARE inherited from offering
  inheritedOmegaRatio: Float!
  inheritedTier: OmegaTier!

  # Retail
  pricePerLb: Float!
  availability: AvailabilityStatus!
}

# ============================================================================
# LIVESTOCK FARM
# ============================================================================

type LivestockFarm {
  id: ID!
  name: String!
  region: Region!

  # S pillar
  pastureType: PastureType!
  pastureAcres: Float!
  pastureQuality: PastureQuality!

  # A pillar (farm's practices)
  feedingRegime: FeedingRegime!
  animalWelfare: AnimalWelfareStandard!

  # What they raise
  offerings: [LivestockOffering!]!
}

type AnimalWelfareStandard {
  housingType: String!           # "Pasture", "Barn", "Feedlot"
  outdoorAccess: Boolean!
  spacePer Animal: Float         # Sq ft
  enrichment: [String!]          # Activities provided
}
```

### Livestock Relationship Summary

```
AnimalType --HAS_BREED--> Breed

Breed + LivestockFarm + FeedingRegime + Duration = LivestockOffering (THE KEY RELATIONSHIP)
  ├── Inherits H from Breed (omega baseline ~20% of outcome)
  ├── Inherits S from Farm → PastureType + PastureQuality
  ├── Gets A from FeedingRegime (diet sequence ~80% of outcome)
  ├── Gets R from Duration (ageAtHarvest, feedlotDuration, durationPenalty)
  └── Measures E: Omega ratio (3:1 to 26:1)

LivestockOffering --HAS_PRODUCTS--> MeatProduct (cuts inherit omega ratio)

Farm --RAISES--> Breed
Farm --HAS--> FeedingRegime
Farm --PRODUCES--> LivestockOffering
```

---

## IV. SEAFOOD Model (Freshness-Based)

### Seafood-Specific Entities

```graphql
# ============================================================================
# SEAFOOD GENETIC HIERARCHY (H pillar)
# ============================================================================

type SeafoodType {
  id: ID!                        # "salmon"
  name: String!                  # "Salmon"
  category: String!              # "seafood"
  subcategory: String!           # "fish"
  species: [Species!]!
}

type Species {
  id: ID!                        # "sockeye_salmon"
  displayName: String!           # "Sockeye Salmon"
  scientificName: String!        # "Oncorhynchus nerka"
  seafoodType: SeafoodType!

  # H pillar (Genetics/Species)
  omega3Baseline: Float!         # mg per serving (Sockeye: ~2500mg)
  mercuryLevel: MercuryLevel!    # Based on FDA data

  # Habitat
  nativeWaters: [String!]!       # ["North Pacific", "Alaska"]
  depthRange: String             # "Surface to 200m"
  waterTypeRequired: WaterType!

  # Lifecycle
  migratory: Boolean!
  spawningLocation: String

  # Where it's caught/farmed
  offerings: [SeafoodOffering!]!
}

enum MercuryLevel {
  VERY_LOW                       # <0.05 ppm (Salmon, Sardines)
  LOW                            # 0.05-0.15 ppm (Trout, Herring)
  MODERATE                       # 0.15-0.5 ppm (Halibut, Mahi)
  HIGH                           # >0.5 ppm (Tuna, Swordfish)
}

# ============================================================================
# SEAFOOD OFFERING MODEL: Species × Water × Harvest
# ============================================================================

type SeafoodOffering {
  id: ID!
  species: Species!              # WHAT species
  region: Region!                # WHERE caught/farmed

  # S pillar (Sea/Water)
  waterType: WaterType!
  waterQuality: WaterQuality!

  # H pillar (Species)
  omega3Baseline: Float!         # Inherited from species
  mercuryLevel: MercuryLevel!

  # A pillar (Harvest method)
  harvestMethod: HarvestMethod!
  isSustainable: Boolean!
  certifications: [String!]      # "MSC", "ASC"

  # R pillar (Freshness)
  seasonalAvailability: [Int!]!  # Months 1-12 (if wild-caught)
  typicalDaysToDock: Int!        # Days from catch to port
  typicalDaysToMarket: Int!      # Days from dock to retail

  # E pillar (Quality)
  expectedOmega3: Float!
  expectedQuality: QualityTier!
  measurements: [QualityMeasurement!]!
}

# ============================================================================
# SEAFOOD S PILLAR: WATER
# ============================================================================

enum WaterType {
  COLD_OCEAN                     # Alaska, North Atlantic (highest omega-3)
  WARM_OCEAN                     # Tropical, temperate
  FRESHWATER                     # Lakes, rivers
  AQUACULTURE                    # Farm-raised (controlled)
  ESTUARY                        # Brackish water
}

type WaterQuality {
  temperature: String!           # "Cold", "Moderate", "Warm"
  salinity: String               # "Fresh", "Brackish", "Saltwater"
  pollutionLevel: String!        # "Pristine", "Clean", "Moderate", "Polluted"
  habitatHealth: String!         # "Excellent", "Good", "Fair", "Poor"
  qualityScore: Float!           # 0.0 - 1.0
}

# ============================================================================
# SEAFOOD A PILLAR: HARVEST METHOD
# ============================================================================

enum HarvestMethod {
  WILD_DAY_BOAT                  # Best quality (same-day landing)
  WILD_LONG_LINE                 # Traditional fishing
  WILD_TRAWL                     # Net fishing
  FARM_RAISED                    # Aquaculture (lower omega-3)
  FARM_RAISED_ORGANIC            # Organic aquaculture
}

# ============================================================================
# SEAFOOD R PILLAR: FRESHNESS
# ============================================================================

type FreshnessTracking {
  catchDate: DateTime!
  dockDate: DateTime!
  marketDate: DateTime

  daysSinceCatch: Int!           # CRITICAL for quality
  freshnessGrade: FreshnessGrade!

  # Temperature tracking
  maintainedColdChain: Boolean!
  temperatureLog: [TemperatureReading!]
}

enum FreshnessGrade {
  SAME_DAY                       # <24 hours (exceptional)
  FRESH_1_3_DAYS                 # 1-3 days (excellent)
  FRESH_4_7_DAYS                 # 4-7 days (good)
  PREVIOUSLY_FROZEN              # Was frozen (standard)
  FROZEN                         # Sold frozen
}

type TemperatureReading {
  timestamp: DateTime!
  temperatureF: Float!
  location: String
}
```

### Seafood Relationship Summary

```
SeafoodType --HAS_SPECIES--> Species

Species + Region + HarvestMethod + Freshness = SeafoodOffering (THE KEY RELATIONSHIP)
  ├── Inherits H from Species (omega-3 baseline, mercury level)
  ├── Inherits S from Region → WaterType + WaterQuality
  ├── Gets A from HarvestMethod (wild vs farmed)
  ├── Gets R from FreshnessTracking (daysSinceCatch)
  └── Measures E: Omega-3 content + mercury

Cold water + Wild-caught + <3 days = Highest quality
Warm water + Farm-raised + >7 days = Lower quality
```

---

## V. POST-HARVEST Model (Derived Products)

### Post-Harvest Entity

```graphql
# ============================================================================
# POST-HARVEST PRODUCTS (Inherit from parent)
# ============================================================================

type ProcessedProduct {
  id: ID!
  name: String!                  # "Fresh-squeezed Orange Juice"
  category: String!              # "beverage"

  # Parent relationship (inherits SHARE)
  parentProduct: Cultivar        # For juice → Orange cultivar
  parentOffering: ProduceOffering # For juice → Specific region/season

  # Processing
  processingMethod: String!      # "Cold-pressed", "Pasteurized"
  processingDate: DateTime!

  # SHARE inheritance
  inheritedH: String!            # Parent cultivar heritage
  inheritedS: String!            # Parent region soil
  inheritedR: String!            # Parent harvest timing

  # R pillar addition
  daysSinceHarvest: Int!         # Freshness penalty
  shelfLife: Int!                # Days

  # E pillar (quality retained)
  expectedBrix: Float!           # Lower than parent fruit
  retentionPercentage: Float!    # % of parent nutrition retained

  measurements: [QualityMeasurement!]!
}

# Examples:
# - Orange Juice → Inherits from Navel Orange cultivar + Region + Harvest timing
# - Maple Syrup → Inherits from Maple tree species + Region + Tapping season
# - Raw Honey → Inherits from Floral source + Region + Harvest timing
# - Country Ham → Inherits from Breed + Diet + Aging duration
```

---

## VI. Cross-Category Inference Chains

### Inference Engine Structure

```graphql
# ============================================================================
# INFERENCE CHAINS (How to estimate SHARE when data incomplete)
# ============================================================================

type InferenceChain {
  id: ID!
  category: ProductCategory!
  pillar: SHAREPillar!

  # Input → Output mapping
  input: InferenceInput!
  output: InferenceOutput!

  confidence: ConfidenceLevel!
  source: String!                # "plu_lookup", "region_typical", "seasonal_pattern"
}

enum SHAREPillar {
  S_SOIL
  H_HERITAGE
  A_AGRICULTURAL
  R_RIPEN
  E_ENRICH
}

type InferenceInput {
  inputType: String!             # "plu_code", "packinghouse_code", "scan_date"
  inputValue: String!
}

type InferenceOutput {
  pillar: SHAREPillar!
  estimatedValue: String!
  reasoning: String!
}

enum ConfidenceLevel {
  HIGH                           # Farm-level data
  MEDIUM                         # Packinghouse or region data
  LOW                            # State-level or category assumptions
  VERY_LOW                       # Unknown origin
}

# ============================================================================
# DATA ATTRIBUTION LEVELS (Highest to Lowest Confidence)
# ============================================================================

enum DataAttributionLevel {
  FARM_LEVEL                     # All SHARE pillars known (H, S, A, R, E)
  PACKINGHOUSE_LEVEL             # Packer → Region inference (S, R inferred)
  REGION_LEVEL                   # Growing region known (S from typicalSoil, R from seasonal)
  STATE_LEVEL                    # Only state origin (Low confidence S, R)
  UNKNOWN                        # "Product of USA" only (Category assumptions)
}

# Example Inference Chains:
#
# PRODUCE:
#   PLU 9xxxx → Organic → Non-GMO (H pillar, high confidence)
#   Packinghouse "Indian River" → Region → Sandy loam soil (S pillar, medium confidence)
#   Scan date Dec 15 + Florida → Peak navel season (R pillar, high confidence)
#   Navel baseline + peak season → Expected Brix 12-14 (E pillar, medium confidence)
#
# LIVESTOCK:
#   "Grass-fed" + NO "grass-finished" → Grain-finished (A pillar, high confidence)
#   "Organic" + Meat → Grain-fed with organic grain (A pillar, high confidence)
#   Extended grain (12mo) + Wagyu → Omega 20-26:1 (E pillar, high confidence)
#
# SEAFOOD:
#   "Wild-caught Alaskan" → Cold water, high omega-3 (H+S pillar, high confidence)
#   Dec scan + Copper River → Out of season (R pillar, high confidence)
#   Species + WaterType → Mercury level (E pillar, high confidence)
```

---

## VII. Graph Traversal Examples

### Example 1: "Show me peak oranges near Tampa in January"

```graphql
query PeakOrangesNearTampa {
  # Find region
  region(name: "Tampa Bay") {
    # Get all produce offerings
    produceOfferings(
      productType: "orange"
      currentMonth: 1              # January
    ) {
      cultivar { displayName }

      # Filter by peak timing
      harvestWindows(isPeak: true, month: 1) {
        peakStartDay
        peakEndDay
        expectedBrixAtPeak
      }

      # Get farms actually growing this
      farms {
        farm { name }
        currentAvailability
        pricePerUnit

        # Get their measurements
        measurements(recent: true) {
          measuredBrix
          measurementDate
        }
      }
    }
  }
}

# RESULT:
# - Washington Navels (peak Jan 1-31, Brix 12-14)
# - Valencia Oranges (peak Jan 15-Feb 28, Brix 11-13)
# - Cara Cara (peak Dec 15-Feb 15, Brix 11-13)
# With actual farms, availability, and verified Brix measurements
```

### Example 2: "Find grass-fed beef verified by omega ratio <5:1"

```graphql
query VerifiedGrassFedBeef {
  # Find livestock offerings
  livestockOfferings(
    animalType: "beef_cattle"
    feedingRegime_diet: GRASS_ONLY
  ) {
    breed { displayName }
    farm { name, region { name } }

    # Verify feeding regime
    feedingRegime {
      diet
      noFeedlot
      sequence
    }

    # Check omega measurements
    measurements(labVerified: true) {
      measuredOmegaRatio
      tier
      labName
      testDate
    }

    # Filter: only omega <5:1
    filter: { measuredOmegaRatio_lt: 5.0 }
  }
}

# RESULT:
# - Everglades Ranch American Wagyu (Omega 4.2:1, Edacious verified)
# - White Oak Pastures Red Angus (Omega 2.8:1, Texas A&M verified)
# - etc.
```

### Example 3: "Copper River Sockeye availability and freshness"

```graphql
query CopperRiverSalmon {
  # Find seafood offering
  seafoodOffering(
    species: "sockeye_salmon"
    region: "Copper River, Alaska"
  ) {
    species {
      displayName
      omega3Baseline
      mercuryLevel
    }

    # Seasonal availability
    seasonalAvailability  # [5, 6] = May-June only

    # Current freshness
    freshnessTracking(current: true) {
      catchDate
      daysSinceCatch
      freshnessGrade
      maintainedColdChain
    }

    # Quality measurements
    measurements(recent: true) {
      measuredOmega3
      labName
    }
  }
}

# RESULT:
# - Available: May-June only (short season)
# - Current freshness: 3 days since catch (excellent)
# - Omega-3: 2,500mg per serving
# - Mercury: Very Low
```

---

## VIII. Schema Implementation Notes

### Database Mapping (Supabase)

Current Supabase tables align with this schema:

| Supabase Table | Graph Entity | Notes |
|----------------|--------------|-------|
| `states` | State | Geographic foundation |
| `zones` | Zone | USDA hardiness zones |
| `growing_regions` | Region | ~21 rows, needs expansion to ~150 |
| `crops` | ProductType | 15 rows |
| `cultivars` | Cultivar | 12 rows, needs expansion to 112+ |
| `rootstocks` | Rootstock | 12 rows |
| `crop_phenology` | ProduceOffering timing | Cultivar × Region bloom dates |
| `farms` | Farm | Farm entities (all categories) |
| `farm_crops` | FarmOffering | Farm × Cultivar × Rootstock |
| `farm_availability` | FarmOffering availability | Real-time inventory |
| `harvest_windows` | HarvestWindow | Pre-computed predictions |
| `daily_predictions` | QualityPrediction | Pre-computed offerings |

**Missing tables needed:**
- `breeds` (livestock)
- `feeding_regimes` (livestock practices)
- `livestock_offerings` (livestock equivalent of produce_offerings)
- `species` (seafood)
- `seafood_offerings`
- `omega_measurements` (E pillar for meat/dairy)
- `omega3_measurements` (E pillar for seafood)

### Graph Database Advantages

Using a graph database (Neo4j, Amazon Neptune, etc.) would enable:

1. **Natural SHARE traversals**: Follow S → H → A → R → E path
2. **Polymorphic queries**: Same query structure, different node/edge types per category
3. **Inference chains**: Path-based reasoning (PLU → Organic → Non-GMO)
4. **Similarity matching**: "Find offerings similar to this one"
5. **Network effects**: Farms that grow similar cultivars, share practices

Example Cypher query:
```cypher
// Find all offerings where S (mineralized soil) + H (heritage cultivar) combine
MATCH (c:Cultivar)-[:GROWS_IN]->(r:Region)-[:HAS_SOIL]->(s:SoilProfile)
WHERE s.isMineralized = true
  AND c.heritageIntent IN ['true_heritage', 'heirloom_quality']
RETURN c, r, s
```

---

## IX. Next Steps

### Phase 1: Complete Produce Model ✅ (Mostly Done)
- ✅ 112 cultivars with H pillar data
- ✅ 15 cultivars with R pillar (GDD) data
- ⬜ Generate PlantingWindow entities (Cultivar × Zone)
- ⬜ Generate HarvestWindow entities (Cultivar × Zone)
- ⬜ Add 150 Region entities with SoilProfile (S pillar)

### Phase 2: Add Livestock Model (Next Priority)
- ⬜ Create Breed entities (H pillar)
- ⬜ Create FeedingRegime types (A pillar - THE critical factor)
- ⬜ Model LivestockOffering = Breed × Farm × FeedingRegime × Duration
- ⬜ Add omega ratio prediction algorithm
- ⬜ Connect to Edacious lab measurement data

### Phase 3: Add Seafood Model
- ⬜ Create Species entities (H pillar)
- ⬜ Create WaterType + HarvestMethod (S + A pillars)
- ⬜ Model SeafoodOffering = Species × Water × Harvest × Freshness
- ⬜ Add FDA mercury database integration
- ⬜ Add omega-3 prediction model

### Phase 4: Add Post-Harvest Model
- ⬜ Create ProcessedProduct entities
- ⬜ Model parent product inheritance (SHARE from parent)
- ⬜ Add processing date + freshness tracking
- ⬜ Model retention percentages (how much nutrition survives processing)

### Phase 5: Implement Inference Chains
- ⬜ Build inference engine for each category
- ⬜ Create data attribution confidence scoring
- ⬜ Build PLU → SHARE inference pipeline
- ⬜ Build claim analysis → SHARE profile mapping (competitive intelligence)

### Phase 6: Integrate Flavor App Data Collection
- ⬜ Schema for FlavorAppScan entities
- ⬜ Link scans to ProduceOfferings (Product × Origin × Destination × Time)
- ⬜ Capture prediction → measurement pairs
- ⬜ Build Calibration entities (moat deepens with each data point)

---

## X. Conclusion

This schema design models Fielder's complete vision: **a polymorphic SHARE framework across all farm-to-table product categories**.

**Key innovations:**

1. **Polymorphic SHARE** - Same 5 pillars, different meanings per category
2. **Category-specific offerings** - ProduceOffering, LivestockOffering, SeafoodOffering
3. **Relationship-based quality** - Quality emerges from HOW pillars connect
4. **Measurement validation** - Predictions vs actuals = unreplicable moat
5. **Inference chains** - Estimate SHARE when data incomplete

**The schema supports:**
- Produce: GDD timing → Brix predictions
- Meat: Feeding regime × Duration → Omega ratio predictions
- Seafood: Freshness × Species → Omega-3 + Mercury
- Processed: Parent inheritance → Derived quality
- All categories: Prediction → Measurement → Calibration

**This is NOT a produce timing app. This is a comprehensive farm-to-table quality intelligence platform.**

The knowledge graph should model THIS system, not just list cultivars.
