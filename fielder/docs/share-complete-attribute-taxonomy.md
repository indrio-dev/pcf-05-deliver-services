# SHARE Framework - Complete Attribute Taxonomy

**Date:** 2025-12-21
**Purpose:** Document the FULL complexity of each SHARE pillar - dozens of attributes, hundreds of marketing terms, extensive inference relationships

---

## The Complexity Reality

Each SHARE pillar is NOT a single attribute. Each pillar is:
- **Dozens of measurable attributes**
- **Hundreds of marketing terms** that map to combinations of attributes
- **Complex inference chains** from incomplete data
- **Category-specific translations** (polymorphic)
- **Hierarchical relationships** between attributes

**Example:** "Grass-fed" is not an attribute. It's a marketing term that INFERS:
- A pillar attributes (feeding regime, pasture access, grain usage)
- S pillar implications (pasture type, if true claim)
- R pillar timing (age at harvest, feedlot duration)
- E pillar expected outcome (omega ratio prediction)

---

## S PILLAR - Soil / Sea / Pasture (Foundation Environment)

### For Produce: Soil Attributes (40+ attributes)

```typescript
interface SoilAttributes {
  // ========================================
  // PHYSICAL PROPERTIES
  // ========================================
  soilType: string                    // "Sandy loam", "Clay loam", "Silt loam", etc.
  soilSeries: string                  // USDA soil series classification
  texture: {
    sand: number                      // % sand
    silt: number                      // % silt
    clay: number                      // % clay
    classification: string            // "Sandy", "Loamy", "Clay"
  }
  structure: string                   // "Granular", "Blocky", "Platy"
  drainage: string                    // "Excellent", "Good", "Moderate", "Poor"
  waterHoldingCapacity: number        // Inches per foot
  infiltrationRate: number            // Inches per hour
  bulkDensity: number                 // g/cm³
  porosity: number                    // %
  depth: number                       // Inches to bedrock/hardpan
  slope: number                       // % grade
  erosionPotential: string            // "Low", "Moderate", "High"

  // ========================================
  // CHEMICAL PROPERTIES
  // ========================================
  ph: number                          // 4.0-9.0
  phStatus: string                    // "Very acidic", "Acidic", "Neutral", "Alkaline"
  bufferPH: number                    // Lime requirement calculation
  cec: number                         // Cation Exchange Capacity (meq/100g)
  cecStatus: string                   // "Very low", "Low", "Medium", "High", "Very high"
  basesSaturation: number             // % of CEC filled with bases
  salinity: number                    // dS/m (electrical conductivity)
  salinityStatus: string              // "Non-saline", "Slightly saline", "Saline"
  sodicity: number                    // ESP (Exchangeable Sodium Percentage)
  carbonateLevel: string              // "None", "Slight", "Strong" (effervescence test)

  // ========================================
  // ORGANIC MATTER & BIOLOGY
  // ========================================
  organicMatter: number               // % by weight
  organicMatterStatus: string         // "Very low", "Low", "Medium", "High"
  carbon: number                      // % total carbon
  carbonNitrogenRatio: number         // C:N ratio
  microbialBiomass: number            // mg C per kg soil
  fungalBacterialRatio: number        // Fungal:bacterial ratio
  earthwormActivity: string           // "None", "Low", "Moderate", "High"
  aggregateStability: number          // % water-stable aggregates

  // ========================================
  // MACRONUTRIENTS (ppm or lbs/acre)
  // ========================================
  nitrogen: {
    total: number                     // ppm
    nitrate: number                   // NO3-N ppm
    ammonium: number                  // NH4-N ppm
    status: string                    // "Very low", "Low", "Medium", "High", "Very high"
    availability: string              // "Immediate", "Short-term", "Long-term"
  }
  phosphorus: {
    available: number                 // ppm (Mehlich-3, Bray, Olsen)
    total: number
    status: string
    method: string                    // "Mehlich-3", "Bray P-1", "Olsen"
  }
  potassium: {
    available: number                 // ppm
    exchangeable: number
    status: string
  }
  calcium: {
    available: number                 // ppm
    exchangeable: number
    percentOfCEC: number
    status: string
  }
  magnesium: {
    available: number
    exchangeable: number
    percentOfCEC: number
    status: string
  }
  sulfur: {
    available: number                 // ppm
    status: string
  }

  // ========================================
  // MICRONUTRIENTS (ppm)
  // ========================================
  iron: { available: number, status: string }
  manganese: { available: number, status: string }
  zinc: { available: number, status: string }
  copper: { available: number, status: string }
  boron: { available: number, status: string }
  molybdenum: { available: number, status: string }
  chloride: { available: number, status: string }
  nickel: { available: number, status: string }
  cobalt: { available: number, status: string }

  // ========================================
  // MINERALIZATION STATUS (THE KEY)
  // ========================================
  isMineralized: boolean              // THE quality differentiator
  mineralizationSystem: string        // "Albrecht", "ACRES USA", "BioNutrient", "Carey Reams"
  mineralBalance: {
    caToMgRatio: number               // Ideal 7:1
    kToMgRatio: number                // Ideal 1:4 to 1:1
    caToKRatio: number                // Ideal 7:1
    calciumSaturation: number         // % of CEC, ideal 60-70%
    magnesiumSaturation: number       // % of CEC, ideal 10-20%
    potassiumSaturation: number       // % of CEC, ideal 2-5%
    sodiumSaturation: number          // % of CEC, ideal <3%
    hydrogenSaturation: number        // % of CEC (acidity)
    balanceScore: number              // 0.0-1.0
  }
  albDiagram: {
    // Soil fertility diagram (William Albrecht methodology)
    idealRatios: boolean
    limitingFactors: string[]
  }

  // ========================================
  // CLIMATE / ENVIRONMENTAL
  // ========================================
  avgAnnualRainfall: number           // Inches
  avgAnnualTemp: number               // °F
  growingDegreeDays: number           // Cumulative GDD
  frostFreeDays: number               // Days per year
  zone: string                        // USDA Hardiness Zone
  microclimate: string                // Special local conditions
  elevation: number                   // Feet above sea level
  aspect: string                      // "North-facing", "South-facing", etc.
  windExposure: string                // "Protected", "Moderate", "Exposed"

  // ========================================
  // HISTORICAL / MANAGEMENT
  // ========================================
  previousCrop: string
  yearsInProduction: number
  tillageHistory: string              // "No-till", "Reduced till", "Conventional"
  lastSoilTest: Date
  amendmentHistory: {
    date: Date
    amendment: string
    amount: number
    method: string
  }[]
}
```

### For Seafood: Water Attributes (30+ attributes)

```typescript
interface WaterAttributes {
  // ========================================
  // WATER TYPE
  // ========================================
  waterType: string                   // "Cold ocean", "Warm ocean", "Freshwater", "Aquaculture", "Estuary"
  salinity: number                    // ppt (parts per thousand)
  salinityClass: string               // "Freshwater", "Brackish", "Saltwater"
  temperature: number                 // °F
  temperatureClass: string            // "Cold", "Moderate", "Warm"
  depth: string                       // "Surface", "Mid-water", "Deep"
  waterMovement: string               // "Flowing", "Tidal", "Still"

  // ========================================
  // WATER QUALITY
  // ========================================
  dissolvedOxygen: number             // mg/L
  ph: number
  turbidity: number                   // NTU (Nephelometric Turbidity Units)
  clarity: string                     // "Crystal clear", "Clear", "Cloudy", "Murky"

  // Nutrients
  nitrogen: number                    // mg/L (nitrate, nitrite, ammonia)
  phosphorus: number                  // mg/L
  eutrophicationStatus: string        // "Oligotrophic", "Mesotrophic", "Eutrophic"

  // ========================================
  // POLLUTION / CONTAMINANTS
  // ========================================
  pollutionLevel: string              // "Pristine", "Clean", "Moderate", "Polluted"
  industrialProximity: boolean
  agriculturalRunoff: boolean
  urbanRunoff: boolean
  sewageDischarge: boolean

  // Heavy metals
  mercury: number                     // ppb
  lead: number
  cadmium: number
  arsenic: number

  // Organic pollutants
  pcbs: number                        // ppb
  dioxins: number
  pesticides: number
  pharmaceuticals: number

  // Microplastics
  microplasticConcentration: number   // particles per m³
  microplasticTypes: string[]

  // ========================================
  // HABITAT QUALITY
  // ========================================
  habitatHealth: string               // "Excellent", "Good", "Fair", "Poor", "Degraded"
  biodiversity: string                // "High", "Moderate", "Low"
  coralReefHealth: string             // If applicable
  kelpForestHealth: string            // If applicable
  seagrassHealth: string              // If applicable
  algalBloomRisk: string              // "Low", "Moderate", "High"

  // ========================================
  // GEOGRAPHIC / ENVIRONMENTAL
  // ========================================
  location: {
    ocean: string                     // "North Pacific", "Atlantic", "Mediterranean", etc.
    region: string                    // "Alaska", "North Sea", "Great Lakes", etc.
    specificWaters: string            // "Copper River", "Gulf of Maine", etc.
  }
  latitude: number
  longitude: number
  distance FromShore: number          // Miles
  upwellingZone: boolean              // Nutrient-rich cold water upwelling
  currentPattern: string              // "Strong", "Moderate", "Weak"
  seasonalVariation: string           // "High", "Moderate", "Low"

  // ========================================
  // AQUACULTURE-SPECIFIC
  // ========================================
  aquacultureType: string             // "Open pen", "Closed recirculating", "Pond"
  stockingDensity: number             // Fish per m³
  waterExchangeRate: number           // % per day
  feedQuality: string
  antibioticUse: boolean
  diseaseHistory: string[]
}
```

### For Livestock: Pasture Attributes (35+ attributes)

```typescript
interface PastureAttributes {
  // ========================================
  // PASTURE TYPE
  // ========================================
  pastureType: string                 // "Native grass", "Improved pasture", "Feedlot", "Barn"
  pastureSystem: string               // "Pasture-only", "Pasture with supplement", "Feedlot"
  acresPerAnimal: number              // Stocking density
  totalPastureAcres: number

  // ========================================
  // FORAGE COMPOSITION
  // ========================================
  forageSpecies: {
    grasses: string[]                 // "Bahia", "Bermuda", "Fescue", "Timothy", "Orchardgrass"
    legumes: string[]                 // "Clover", "Alfalfa", "Vetch"
    forbs: string[]                   // Broadleaf plants
    browse: string[]                  // Woody plants
  }
  forageDiversity: string             // "High" (10+ species), "Moderate" (5-9), "Low" (<5)
  dominantSpecies: string
  invasiveSpecies: string[]

  // ========================================
  // FORAGE QUALITY
  // ========================================
  forageHeight: number                // Inches (optimal 4-8" for grazing)
  forageMaturity: string              // "Vegetative", "Stem elongation", "Flowering", "Seed"
  crudeProtein: number                // % dry matter
  tdn: number                         // Total Digestible Nutrients %
  ndf: number                         // Neutral Detergent Fiber % (cell wall)
  adf: number                         // Acid Detergent Fiber % (lignin + cellulose)
  relativeForageQuality: number       // RFQ score
  energyDensity: number               // Mcal/lb

  // ========================================
  // GRAZING MANAGEMENT
  // ========================================
  grazingMethod: string               // "Continuous", "Rotational", "Mob grazing", "Strip grazing"
  rotationFrequency: number           // Days per paddock
  restPeriod: number                  // Days between grazings
  paddockCount: number
  grazingPressure: string             // "Light", "Moderate", "Heavy"
  utilizationRate: number             // % of available forage consumed
  residualHeight: number              // Inches left after grazing

  // ========================================
  // PASTURE SOIL (subset of produce soil attributes)
  // ========================================
  soilType: string
  soilPH: number
  organicMatter: number
  isMineralized: boolean
  fertility: {
    nitrogen: number
    phosphorus: number
    potassium: number
    calcium: number
    magnesium: number
    sulfur: number
  }
  compaction: string                  // "None", "Light", "Moderate", "Severe"

  // ========================================
  // PASTURE HEALTH
  // ========================================
  groundCover: number                 // % vegetative cover
  bareGround: number                  // % exposed soil
  erosionLevel: string                // "None", "Light", "Moderate", "Severe"
  weedPressure: string                // "None", "Light", "Moderate", "Heavy"
  pestPressure: string                // Flies, ticks, etc.
  diseaseRisk: string                 // Endophyte fungus, etc.

  // ========================================
  // INFRASTRUCTURE
  // ========================================
  waterSources: string[]              // "Pond", "Well", "Creek", "Automatic waterers"
  waterQuality: string
  shade: string                       // "Natural", "Artificial", "None"
  shadePercentage: number             // % of pasture with shade
  windbreak: boolean
  fence Type: string                  // "Electric", "Barbed wire", "Woven wire"

  // ========================================
  // SEASONAL MANAGEMENT
  // ========================================
  winterFeeding: string               // "Hay", "Silage", "Grain", "Stockpile grazing"
  hayQuality: string                  // If supplementing
  haySource: string                   // "Own production", "Purchased local", "Purchased commodity"
  seasonalRotation: boolean
  frostSeededing: boolean             // Overseeding in late winter
  dormantSeason: string               // Months pasture is not grazed

  // ========================================
  // CERTIFICATIONS / VERIFICATION
  // ========================================
  certifiedOrganic: boolean
  awhVerified: boolean                // Animal Welfare Approved
  certifiedGrassF ed: boolean         // AGA Certified Grass Fed
  regenagVerified: boolean            // Regenerative Organic Certified
  birdFriendly: boolean               // Bird-friendly certification
}
```

---

## H PILLAR - Heritage / Breed / Species (Genetic Potential)

### For Produce: Cultivar Attributes (50+ attributes)

```typescript
interface CultivarAttributes {
  // ========================================
  // IDENTITY
  // ========================================
  id: string                          // "cherokee_purple"
  displayName: string                 // "Cherokee Purple"
  scientificName: string              // "Solanum lycopersicum 'Cherokee Purple'"
  synonyms: string[]                  // Alternative names
  tradeNames: string[]                // Brand names
  patentNumber: string                // If patented
  pvrNumber: string                   // Plant Variety Rights

  // ========================================
  // TAXONOMY
  // ========================================
  kingdom: string                     // "Plantae"
  family: string                      // "Solanaceae"
  genus: string                       // "Solanum"
  species: string                     // "lycopersicum"
  subspecies: string
  variety: string                     // Botanical variety
  cultivar: string                    // Cultivated variety

  // ========================================
  // GENETIC CLASSIFICATION
  // ========================================
  heritageIntent: string              // "true_heritage", "heirloom_quality", "commercial", etc.
  heritageIntentDetails: {
    classification: string
    bredFor: string[]                 // "Flavor", "Nutrition", "Yield", "Shipping", etc.
    breedingMethod: string            // "Open-pollinated", "Hybrid", "F1", "GMO"
    yearIntroduced: number
    originCountry: string
    originRegion: string
    culturalSignificance: string
  }

  isHeirloom: boolean                 // Pre-1950 open-pollinated
  isHeritage: boolean                 // Selected for flavor/nutrition
  isNonGmo: boolean
  isOpenPollinated: boolean
  isHybrid: boolean
  hybridType: string                  // "F1", "F2", etc.
  parentalLineage: {
    parent1: string
    parent2: string
    crossDate: number
  }

  // ========================================
  // FLAVOR & SENSORY
  // ========================================
  flavorProfile: {
    primaryFlavors: string[]          // "Sweet", "Acidic", "Savory", "Bitter"
    secondaryFlavors: string[]        // "Fruity", "Earthy", "Smoky", "Floral"
    intensityScore: number            // 1-10
    complexityScore: number           // 1-10
    description: string               // Full tasting notes
  }
  texture: string                     // "Firm", "Tender", "Crisp", "Juicy", "Mealy"
  aromaticCompounds: string[]         // Specific volatiles if known

  // ========================================
  // NUTRITION BASELINE
  // ========================================
  brixRange: {
    min: number
    max: number
    typical: number
    geneticCeiling: number            // Maximum possible with perfect S+A+R
  }
  nutritionBaseline: {
    // Compared to USDA reference
    vitaminCMultiplier: number        // 1.0 = average, 1.5 = 50% higher
    mineralDensityScore: number       // 0.0-1.0
    phytonutrientPotential: string    // "Low", "Moderate", "High", "Exceptional"
    antioxidantCapacity: number       // ORAC baseline
  }

  // ========================================
  // GROWING CHARACTERISTICS
  // ========================================
  plantHabit: {
    type: string                      // "Determinate", "Indeterminate", "Bush", "Vine", "Tree"
    height: number                    // Feet
    spread: number                    // Feet
    rootDepth: number                 // Feet
    rootSpread: number                // Feet
  }
  vigor: string                       // "Low", "Moderate", "High", "Very high"
  productivityClass: string           // "Light bearer", "Moderate", "Heavy bearer"

  // ========================================
  // TIMING CHARACTERISTICS (R pillar baseline)
  // ========================================
  baseTemp: number                    // °F
  maxTemp: number                     // °F (heat stress threshold)
  gddToMaturity: number               // Growing Degree Days
  gddToPeak: number
  gddWindow: number
  plantingMethod: string              // "Direct seed", "Transplant", "Either"
  transplantAge: number               // GDD indoors before field
  daysToMaturity: number              // Approximate (climate-dependent)
  chillHoursRequired: number          // For perennials
  vernalizationRequired: boolean      // Needs cold period
  photoperiodsensitive: boolean       // Day length affects flowering

  // ========================================
  // CLIMATE ADAPTATION
  // ========================================
  hardiness: {
    zones: string[]                   // USDA zones
    minTemp: number                   // °F minimum survival
    maxTemp: number                   // °F maximum productivity
    heatTolerance: string             // "Low", "Moderate", "High"
    coldTolerance: string
    frostTolerance: string
    droughtTolerance: string
    humidityTolerance: string
  }
  validatedStates: string[]           // Commercial production regions
  optimalRegions: string[]            // Where it performs best

  // ========================================
  // DISEASE/PEST RESISTANCE
  // ========================================
  diseaseResistance: {
    resistantTo: string[]             // Specific diseases
    tolerantTo: string[]              // Moderate resistance
    susceptibleTo: string[]           // Known weaknesses
    geneticResistance: string[]       // R-genes
  }
  pestResistance: {
    resistantTo: string[]
    tolerantTo: []
    susceptibleTo: string[]
  }

  // ========================================
  // FRUIT/YIELD CHARACTERISTICS
  // ========================================
  fruitSize: {
    typical: string                   // "Cherry", "Grape", "Plum", "Medium", "Beefsteak"
    weightOz: number
    dimensions: string
  }
  fruitShape: string                  // "Round", "Oblong", "Pear", "Blocky"
  fruitColor: {
    exterior: string[]
    interior: string[]
    maturityIndicator: string         // How color changes at ripeness
  }
  seedCount: string                   // "Seedless", "Few", "Many"
  yieldPotential: {
    lbsPerPlant: number
    lbsPerAcre: number
    classification: string            // "Light", "Moderate", "Heavy", "Very heavy"
  }

  // ========================================
  // POST-HARVEST
  // ========================================
  climacteric: boolean                // Can ripen off-plant
  shelfLife: {
    fresh: number                     // Days
    refrigerated: number
    frozen: number
  }
  handlingCharacteristics: {
    skinThickness: string             // "Thin", "Medium", "Thick"
    bruiseResistance: string          // "Delicate", "Moderate", "Tough"
    shippingQuality: string           // "Poor", "Fair", "Good", "Excellent"
  }

  // ========================================
  // USE CASES
  // ========================================
  bestUses: string[]                  // "Fresh eating", "Cooking", "Canning", "Juice", "Drying"
  culinaryNotes: string
  processingSuitability: {
    juice: boolean
    sauce: boolean
    paste: boolean
    canning: boolean
    freezing: boolean
    drying: boolean
  }

  // ========================================
  // ROOTSTOCK (for perennials)
  // ========================================
  rootstockCompatibility: string[]    // Compatible rootstocks
  commonRootstocks: string[]          // Typically used

  // ========================================
  // MARKET / COMMERCIAL
  // ========================================
  availability: string                // "Rare", "Limited", "Common", "Very common"
  seedSources: string[]               // Companies selling seeds
  pluCodes: string[]                  // Associated PLU codes
  marketClass: string                 // "Specialty", "Gourmet", "Standard", "Commodity"
  pricePoint: string                  // "Ultra-premium", "Premium", "Standard", "Economy"
  consumerAppeal: {
    visual: string                    // "Eye-catching", "Attractive", "Ordinary"
    marketability: string
  }
}
```

### For Livestock: Breed Attributes (40+ attributes)

```typescript
interface BreedAttributes {
  // ========================================
  // IDENTITY
  // ========================================
  id: string                          // "american_wagyu"
  displayName: string                 // "American Wagyu"
  scientificName: string              // "Bos taurus"
  breedRegistry: string               // "American Wagyu Association"
  registryStandards: string

  // ========================================
  // GENETIC ORIGIN
  // ========================================
  origin: {
    country: string
    region: string
    yearEstablished: number
    foundationStock: string[]
  }
  heritageIntent: string              // What the breed was selected for
  parentBreeds: string[]              // If crossbred/composite
  crossbreedingHistory: string

  // ========================================
  // BREED PURPOSE
  // ========================================
  primaryPurpose: string              // "Beef", "Dairy", "Dual-purpose", "Draft"
  temperament: string                 // "Docile", "Calm", "Active", "Nervous"
  managementDifficulty: string        // "Easy", "Moderate", "Difficult"

  // ========================================
  // PHYSICAL CHARACTERISTICS
  // ========================================
  size: {
    matureWeightLbs: number           // Average mature weight
    frameSize: string                 // "Small", "Medium", "Large"
    heightInches: number              // At shoulder
  }
  bodyType: {
    structure: string                 // "Angular", "Moderate", "Thick"
    muscularity: string               // "Light", "Moderate", "Heavy"
    boneStructure: string             // "Fine", "Moderate", "Heavy"
  }
  color: string[]                     // Coat colors
  polledness: boolean                 // Naturally hornless

  // ========================================
  // GROWTH CHARACTERISTICS
  // ========================================
  growthRate: {
    rate: string                      // "Slow", "Moderate", "Fast"
    birthWeightLbs: number
    weaningWeightLbs: number          // At 205 days
    yearlingWeightLbs: number         // At 365 days
    adgLbs: number                    // Average Daily Gain
  }
  maturityAge: {
    sexual: number                    // Months to breeding age
    physical: number                  // Months to full size
    optimal: number                   // Months to optimal harvest
  }

  // ========================================
  // MEAT QUALITY GENETICS (THE KEY FOR E PILLAR)
  // ========================================
  meatQuality: {
    // Marbling (intramuscular fat)
    marblingPotential: string         // "Minimal", "Modest", "Moderate", "Abundant", "Exceptional"
    marblingGenes: string[]           // Known genetic markers

    // Fatty acid genetics
    omegaModifier: number             // Genetic adjustment to baseline omega ratio
    omegaExplanation: string          // Why this breed has modifier

    // Example modifiers:
    // Wagyu: +0.8 (more marbling = more fat storage = slightly higher omega-6)
    // Heritage grass breeds (Galloway, Highland): -1.0 (evolved on 100% grass)
    // Commercial breeds (Angus, Hereford): 0.0 (neutral baseline)

    // Tenderness
    tendernessScore: string           // "Tough", "Moderate", "Tender", "Very tender"
    calpainGenes: boolean             // Genetic markers for tenderness

    // Flavor
    flavorProfile: string
    beefiness: string                 // "Mild", "Moderate", "Strong"
  }

  // ========================================
  // CARCASS CHARACTERISTICS
  // ========================================
  carcassTraits: {
    dressingPercentage: number        // % of live weight as carcass
    ribeye AreaInches: number
    backfatInches: number
    yieldGrade: number                // 1-5
    qualityGradeRange: string[]       // ["Select", "Choice", "Prime"]
    cutability: string                // "Low", "Average", "High"
  }

  // ========================================
  // FEED EFFICIENCY
  // ========================================
  feedEfficiency: {
    feedConversionRatio: number       // Lbs feed per lb gain
    residualFeedIntake: number        // Genetic feed efficiency
    grazingEfficiency: string         // "Poor", "Average", "Excellent"
    forageConversion: string          // Ability to convert grass to gain
  }

  // ========================================
  // CLIMATE ADAPTATION
  // ========================================
  climateAdaptation: {
    heatTolerance: string             // "Poor", "Moderate", "Good", "Excellent"
    coldTolerance: string
    humidityTolerance: string
    parasiteResistance: string
    diseaseResistance: string[]
    altitudeAdaptation: string        // "Lowland", "Mixed", "Highland"
    forageAdaptation: string[]        // Types of forage they thrive on
  }

  // ========================================
  // REPRODUCTION
  // ========================================
  reproduction: {
    fertility: string                 // "Low", "Average", "High"
    birthingEase: string              // "Difficult", "Moderate", "Easy"
    calfVigor: string                 // "Weak", "Average", "Strong"
    maternalAbility: string           // Mothering instincts
    milkProduction: string            // If dual-purpose
    breedingSeason: string            // "Year-round", "Seasonal"
  }

  // ========================================
  // ECONOMIC TRAITS
  // ========================================
  economic: {
    marketDemand: string              // "Niche", "Specialty", "Mainstream"
    premiumPotential: string          // "None", "Modest", "Significant", "High"
    breedingStockValue: string        // "Economy", "Average", "Premium"
    hybridVigor: string               // If used in crossbreeding
    heterosis: string                 // Hybrid vigor percentage
  }

  // ========================================
  // REGULATORY / CERTIFICATIONS
  // ========================================
  certifications: string[]            // "Certified Angus Beef", "American Wagyu Association"
  dnaVerification: boolean            // Can be DNA-verified
  breedPurity: string                 // "Purebred", "Fullblood", "Crossbred", "Composite"
}
```

### For Seafood: Species Attributes (35+ attributes)

```typescript
interface SpeciesAttributes {
  // Similar extensive breakdown for seafood species
  // ... (would include taxonomy, habitat, lifecycle, migration patterns, etc.)
}
```

---

## A PILLAR - Agricultural Practices (Methods & Inputs)

### For Produce: Practice Attributes (60+ attributes)

```typescript
interface AgriculturalPractices {
  // ========================================
  // FERTILITY STRATEGY (THE KEY DISTINCTION)
  // ========================================
  fertilityStrategy: {
    approach: string                  // "annual_fertility", "soil_banking", "mineralized_soil_science"
    philosophy: string                // Explanation

    // Mineralization details (THE quality differentiator)
    isMineralized: boolean
    mineralizationSystem: string      // "Albrecht", "ACRES USA", "BioNutrient", "Carey Reams"
    soilTestingFrequency: string      // "Annual", "Biannual", "Per-season"
    soilTestLab: string
    soilTestMethod: string            // "Mehlich-3", "Morgan", "Albrecht"

    // Long-term soil investment
    coverCropping: boolean
    coverCropSpecies: string[]
    coverCropTiming: string

    compostApplication: boolean
    compostSource: string             // "On-farm", "Commercial", "Municipal"
    compostQuality: string
    compostApplicationRate: number    // Tons per acre
    compostApplicationTiming: string

    greenManure: boolean
    cropRotation: boolean
    rotationCycle: string

    // Soil amendments
    amendments: {
      type: string                    // "Lime", "Gypsum", "Rock phosphate", "Kelp", etc.
      amount: number
      frequency: string
      reason: string                  // What imbalance it addresses
    }[]
  }

  // ========================================
  // NUTRIENT MANAGEMENT
  // ========================================
  fertilization: {
    // Macronutrients
    nitrogen: {
      source: string[]                // "Compost", "Manure", "Synthetic", "Legume fixation", "None"
      amount: number                  // Lbs N per acre per year
      timing: string[]                // "Pre-plant", "Side-dress", "Foliar"
      method: string                  // "Broadcast", "Banded", "Fertigated", "Foliar"
    }
    phosphorus: {
      source: string[]
      amount: number
      timing: string[]
    }
    potassium: {
      source: string[]
      amount: number
      timing: string[]
    }
    calcium: {
      source: string[]                // "Lime", "Gypsum", "Calcium nitrate"
      amount: number
    }
    sulfur: {
      source: string[]
      amount: number
    }

    // Micronutrients
    micronutrients: {
      element: string                 // "Fe", "Mn", "Zn", "Cu", "B", "Mo"
      source: string
      application: string
    }[]

    // Organic vs synthetic split
    organicPercentage: number         // % of nutrients from organic sources
  }

  // ========================================
  // PEST MANAGEMENT (SEPARATE AXIS FROM NUTRITION)
  // ========================================
  pestManagement: {
    approach: string                  // "conventional", "ipm", "organic", "no_spray"
    philosophy: string

    // Insect management
    insecticides: {
      used: boolean
      types: string[]                 // "Synthetic", "Organic", "Biological"
      products: string[]              // Specific products
      frequency: string
      thresholds: boolean             // Spray only when pest pressure reaches threshold
    }

    // Disease management
    fungicides: {
      used: boolean
      types: string[]
      products: string[]
      frequency: string
    }
    bactericides: {
      used: boolean
      types: string[]
      products: string[]
    }

    // Weed management
    herbicides: {
      used: boolean
      types: string[]
      products: string[]
      glyphosate: boolean             // Specific tracking
      preEmergent: boolean
      postEmergent: boolean
    }
    mechanicalWeedControl: boolean    // Cultivation, mowing
    mulching: boolean
    mulchType: string                 // "Plastic", "Organic", "Living"

    // IPM practices
    scouting: boolean
    trapCrops: boolean
    beneficialInsects: boolean
    pheromoneTraps: boolean
    biologicalControls: string[]

    // Resistance management
    rotateChemistries: boolean
    sprayThresholds: boolean
    refugeAreas: boolean
  }

  // ========================================
  // IRRIGATION
  // ========================================
  irrigation: {
    method: string                    // "Drip", "Sprinkler", "Flood", "Furrow", "Micro-sprinkler", "Pivot", "None"
    waterSource: string               // "Well", "Surface water", "Municipal", "Recycled", "Rainwater"
    scheduling: string                // "Calendar", "Soil moisture sensors", "ET-based", "Visual"
    efficiency: string                // "Low", "Moderate", "High"
    volumeInches: number              // Acre-inches per season
    fertigation: boolean              // Fertilizer through irrigation
  }

  // ========================================
  // TILLAGE / SOIL MANAGEMENT
  // ========================================
  tillage: {
    system: string                    // "No-till", "Reduced till", "Strip till", "Conventional"
    implements: string[]              // "Plow", "Disc", "Chisel", "Cultivator"
    depthInches: number
    frequency: string                 // "Per crop", "Seasonal", "As needed"
    timing: string                    // "Fall", "Spring", "Both"

    // Erosion control
    contouring: boolean
    terracing: boolean
    grassedWaterways: boolean
    windbreaks: boolean
  }

  // ========================================
  // CROP MANAGEMENT (crop-specific)
  // ========================================
  cropManagement: {
    // Planting
    plantingDate: Date
    plantingMethod: string            // "Transplant", "Direct seed", "Grafted"
    plantingDepth: number
    spacing: {
      betweenPlants: number           // Inches
      betweenRows: number
    }
    population: number                // Plants per acre

    // Tree/perennial specifics
    treeAge: number                   // Years
    pruningSystem: string             // "Open center", "Central leader", "Espalier"
    pruningFrequency: string
    trainingMethod: string

    // Quality management
    fruitThinning: boolean            // Crop load management
    thinningMethod: string            // "Hand", "Chemical", "Mechanical"
    targetFruitsPerBranch: number

    bagging: boolean                  // Individual fruit bags
    netting: boolean                  // Bird/pest protection
    reflectiveMulch: boolean          // Light/heat management

    // Harvest management
    harvestMethod: string             // "Hand", "Mechanical"
    harvestMaturity: string           // "Early", "Optimal", "Late"
    harvestFrequency: string          // "Once", "Multiple picks"
    postHarvestHandling: string
  }

  // ========================================
  // CERTIFICATIONS
  // ========================================
  certifications: {
    organic: {
      certified: boolean
      certifier: string               // "USDA", "Oregon Tilth", etc.
      certNumber: string
      yearsOrganic: number
      inTransition: boolean
      transitionYear: number
    }

    regenerative: {
      certified: boolean
      standard: string                // "ROC", "Land to Market", etc.
      certifier: string
    }

    biodynamic: {
      certified: boolean
      demeterCertified: boolean
    }

    others: string[]                  // "Fair Trade", "Rainforest Alliance", "Bird Friendly"
  }

  // ========================================
  // LABOR / SOCIAL
  // ========================================
  labor: {
    laborType: string                 // "Family", "Hired", "H2A", "Mixed"
    payStructure: string              // "Hourly", "Piece rate", "Salary"
    fairLaborPractices: boolean
    housingProvided: boolean
    benefitsProvided: string[]
  }
}
```

### For Livestock: Practice Attributes (50+ attributes)

```typescript
interface LivestockPractices {
  // ========================================
  // FEEDING REGIME (80% OF OMEGA OUTCOME - THE KEY)
  // ========================================
  feedingRegime: {
    diet: string                      // "grass_only", "pasture_grain_supp", "grain_finished", "grain_fed"
    sequence: string                  // "grass_only", "concurrent", "sequential"

    // Sequence explanation (CRITICAL):
    // - grass_only: Never grain
    // - concurrent: Grass + grain AT THE SAME TIME (animal stays on pasture)
    // - sequential: Grass THEN grain (animal removed to feedlot)

    // Grass/forage details
    grassAccess: {
      percentage: number              // % of time on grass (0-100)
      continuous: boolean             // Always available vs seasonal
      quality: string                 // From pasture attributes
      diversity: string               // Species diversity
    }

    // Grain details (if applicable)
    grainIntroduced: boolean
    grainType: string[]               // "Corn", "Soy", "Barley", "Oats"
    grainSource: string               // "Own production", "Local", "Commodity"
    isOrganicGrain: boolean           // WARNING FLAG: organic ≠ grass-fed
    isNonGmoGrain: boolean

    grainStartAge: number             // Months when grain introduced
    grainPercentage: number           // % of total diet
    grainAmountLbs: number            // Lbs per day

    // Feedlot details (if applicable)
    feedlotUsed: boolean
    feedlotDuration: number           // Months (CRITICAL for omega)
    feedlotType: string               // "Backgrounding", "Finishing", "Extended"
    feedlotDiet: string               // Composition

    // Duration penalty calculation
    durationPenalty: number           // +0.5 per month beyond 4 months
    // Example: 12 months grain = +4.0 to omega ratio

    // Supplements
    supplements: {
      minerals: boolean               // Free-choice minerals
      vitaminE: boolean               // Common in feedlots
      antibioticImplants: boolean     // Growth promoters
      ionophores: boolean             // Rumensin, Bovatec (feed efficiency)
      betaAgonists: boolean           // Zilmax, Optaflexx (muscle growth)
    }

    // Process exclusion claims (only these matter for omega)
    noFeedlot: boolean                // CAFO exclusion
    noCAFO: boolean                   // CAFO exclusion
    neverConfined: boolean            // CAFO exclusion

    // 100% grass verification
    grassFed100Percent: boolean       // AGA Certified 100% Grass Fed
    grassFinished: boolean            // Explicitly finished on grass (not grain)

    // Other claims (separate from omega)
    noAntibiotics: boolean
    noHormones: boolean
    noVaccines: boolean
    noGMOFeed: boolean
  }

  // ========================================
  // PASTURE MANAGEMENT (S pillar overlap)
  // ========================================
  pastureManagement: {
    // From pasture attributes
    system: string
    acresPerAnimal: number
    rotationalGrazing: boolean
    paddockCount: number
    restPeriod: number

    // Seasonal management
    winterFeeding: string             // "Hay", "Silage", "Grain", "Stockpile grazing"
    hayQuality: string
    haySource: string
    haySeason: string                 // Months on hay vs grass

    // Pasture improvement
    seeding: boolean
    fertilization: boolean
    liming: boolean
    weedControl: boolean
  }

  // ========================================
  // ANIMAL WELFARE
  // ========================================
  animalWelfare: {
    housingType: string               // "Pasture", "Barn", "Feedlot", "Combination"
    housingQuality: string

    outdoorAccess: boolean
    outdoorHoursPerDay: number
    outdoorMonthsPerYear: number

    spacePerAnimal: number            // Square feet
    groupHousing: boolean             // Social structure maintained
    individualPens: boolean

    beddingType: string               // "Straw", "Sawdust", "Sand", "Dirt", "Concrete"
    beddingFrequency: string

    enrichment: string[]              // "Foraging", "Social", "Shade", "Scratching posts"

    // Handling
    lowStress: boolean                // Low-stress handling protocols
    temperHandling: boolean           // Temple Grandin methods

    // Welfare certifications
    awhVerified: boolean              // Animal Welfare Approved
    gaVerified: boolean               // Global Animal Partnership
    certifiedHumane: boolean
  }

  // ========================================
  // HEALTH MANAGEMENT
  // ========================================
  healthManagement: {
    veterinaryCare: string            // "Preventive", "As needed", "Routine"
    vetVisitFrequency: string

    vaccinationProgram: boolean
    vaccines: string[]

    antibioticUse: {
      therapeutic: boolean            // For sick animals only
      subtherapeutic: boolean         // Growth promotion (bad)
      frequency: string
      types: string[]
      withdrawalPeriod: boolean       // Respected before harvest
    }

    parasiteControl: {
      method: string                  // "Rotational grazing", "Chemical", "Biological", "None"
      deworming: boolean
      frequency: string
    }

    diseaseMonitoring: boolean
    herdHealthPlan: boolean
    biosecurity: string               // "Strict", "Moderate", "Minimal"
  }

  // ========================================
  // BREEDING / GENETICS
  // ========================================
  breeding: {
    breedingStock: string             // "Purebred", "Crossbred", "Composite"
    selectionCriteria: string[]       // "Marbling", "Grass efficiency", "Temperament"

    artificialInsemination: boolean
    embryoTransfer: boolean
    cloning: boolean

    retainmentRate: number            // % of heifers kept for breeding
    replacementSource: string         // "Own herd", "Purchased", "Lease"
  }

  // ========================================
  // HARVEST / PROCESSING
  // ========================================
  harvest: {
    ageAtHarvest: number              // Months (CRITICAL for omega - R pillar)
    weightAtHarvest: number           // Lbs

    stressReduction: boolean          // Temple Grandin protocols
    onFarmHarvest: boolean            // Mobile processing unit
    plantDistance: number             // Miles to processing plant
    transportDuration: number         // Hours

    hangingTime: number               // Days aged
    agingMethod: string               // "Wet", "Dry", "None"
    cutAndWrap: string                // "USDA", "Custom exempt"
  }

  // ========================================
  // CERTIFICATIONS
  // ========================================
  certifications: {
    organic: {
      certified: boolean
      certifier: string
      yearsOrganic: number
      note: string                    // "Organic meat often = grain-fed with organic grain"
    }

    grassFed: {
      certified: boolean
      standard: string                // "AGA Certified 100% Grass Fed", "USDA Grass Fed"
      note: string                    // "USDA Grass Fed allows grain finishing"
    }

    regenerative: {
      certified: boolean
      standard: string                // "ROC", "Land to Market", "EOV"
    }

    animalWelfare: {
      certified: boolean
      standard: string                // "AWA", "Certified Humane", "GAP"
    }

    others: string[]
  }
}
```

---

## Marketing Terms → SHARE Attribute Mappings

### Hundreds of Marketing Terms

Each marketing term maps to MULTIPLE SHARE attributes across pillars. Here are representative examples:

```typescript
interface MarketingTermMapping {
  term: string
  category: string[]                  // Which product categories term applies to

  // What the term IMPLIES across SHARE pillars
  sPillarImplications: {
    attribute: string
    value: any
    confidence: string                // "high", "medium", "low", "misleading"
  }[]

  hPillarImplications: {
    attribute: string
    value: any
    confidence: string
  }[]

  aPillarImplications: {
    attribute: string
    value: any
    confidence: string
  }[]

  rPillarImplications: {
    attribute: string
    value: any
    confidence: string
  }[]

  ePillarExpectedOutcomes: {
    measurement: string
    expectedValue: any
    confidence: string
  }[]

  // What the term DOESN'T tell you (gaps)
  gaps: string[]

  // Common misunderstandings
  consumerMisconception: string
  actualReality: string

  // Verification needed
  verifiable: boolean
  verificationMethod: string
}

// EXAMPLES:

const MARKETING_TERMS: MarketingTermMapping[] = [
  {
    term: "Grass-fed",
    category: ["beef", "lamb", "dairy"],

    sPillarImplications: [
      { attribute: "pastureAccess", value: true, confidence: "high" },
      { attribute: "pastureQuality", value: "unknown", confidence: "low" }
    ],

    hPillarImplications: [],          // Term doesn't specify breed

    aPillarImplications: [
      { attribute: "grassAccess", value: ">50%", confidence: "medium" },
      { attribute: "grainFinished", value: "LIKELY", confidence: "high" },  // KEY INSIGHT
      { attribute: "feedlotDuration", value: "3-6 months", confidence: "high" }
    ],

    rPillarImplications: [
      { attribute: "ageAtHarvest", value: "18-24 months", confidence: "medium" }
    ],

    ePillarExpectedOutcomes: [
      { measurement: "omegaRatio", expectedValue: "10-15:1", confidence: "high" }  // SAME AS COMMODITY
    ],

    gaps: [
      "Doesn't specify grass-FINISHED",
      "Doesn't exclude feedlot",
      "No duration specified",
      "No omega verification"
    ],

    consumerMisconception: "Grass-fed = healthy omega ratio, no feedlot",
    actualReality: "Grass-fed WITHOUT grass-finished = grain-finished in feedlot. Same omega as commodity.",

    verifiable: true,
    verificationMethod: "Omega ratio lab test (Edacious, Texas A&M)"
  },

  {
    term: "Grass-fed + Grass-finished",
    category: ["beef", "lamb", "dairy"],

    sPillarImplications: [
      { attribute: "pastureAccess", value: true, confidence: "high" },
      { attribute: "pastureQuality", value: "moderate-high", confidence: "medium" }
    ],

    hPillarImplications: [],

    aPillarImplications: [
      { attribute: "grassAccess", value: "100%", confidence: "high" },
      { attribute: "grainFinished", value: false, confidence: "high" },
      { attribute: "feedlotUsed", value: false, confidence: "high" },
      { attribute: "noCAFO", value: true, confidence: "high" }
    ],

    rPillarImplications: [
      { attribute: "ageAtHarvest", value: "24-30 months", confidence: "high" },
      { attribute: "feedlotDuration", value: 0, confidence: "high" }
    ],

    ePillarExpectedOutcomes: [
      { measurement: "omegaRatio", expectedValue: "2-4:1", confidence: "high" },
      { measurement: "cla", expectedValue: ">0.4", confidence: "high" }
    ],

    gaps: [
      "Doesn't specify pasture quality",
      "Doesn't specify breed",
      "No omega verification"
    ],

    consumerMisconception: "None - this is the real thing",
    actualReality: "This term combination actually means 100% grass diet, no feedlot.",

    verifiable: true,
    verificationMethod: "Omega ratio lab test should show ≤4:1"
  },

  {
    term: "Pasture-raised",
    category: ["beef", "pork", "chicken", "eggs"],

    sPillarImplications: [
      { attribute: "pastureAccess", value: true, confidence: "high" },
      { attribute: "outdoorAccess", value: true, confidence: "high" }
    ],

    aPillarImplications: [
      { attribute: "grassAccess", value: ">25%", confidence: "medium" },  // Very vague
      { attribute: "grainSupplement", value: "LIKELY", confidence: "high" },
      { attribute: "feedlotFinishing", value: "POSSIBLE", confidence: "medium" }
    ],

    gaps: [
      "Doesn't specify finishing diet",
      "Doesn't exclude feedlot",
      "Doesn't specify pasture quality or duration",
      "Much vaguer than 'grass-fed + grass-finished'"
    ],

    consumerMisconception: "Pasture-raised = no feedlot, healthy omega",
    actualReality: "Pasture-raised WITHOUT 'no feedlot' claim = likely feedlot-finished. Test omega ratio.",

    verifiable: true,
    verificationMethod: "Omega ratio lab test"
  },

  {
    term: "Organic" (meat/dairy),
    category: ["beef", "pork", "chicken", "dairy", "eggs"],

    sPillarImplications: [],          // Doesn't specify pasture

    hPillarImplications: [
      { attribute: "isNonGmo", value: true, confidence: "high" }  // Feed must be non-GMO
    ],

    aPillarImplications: [
      { attribute: "isOrganicGrain", value: true, confidence: "high" },  // RED FLAG
      { attribute: "grainFed", value: "LIKELY", confidence: "high" },    // RED FLAG
      { attribute: "noAntibiotics", value: true, confidence: "high" },
      { attribute: "noSyntheticHormones", value: true, confidence: "high" },
      { attribute: "pesticidesInFeed", value: false, confidence: "high" }
    ],

    ePillarExpectedOutcomes: [
      { measurement: "omegaRatio", expectedValue: "15-20:1", confidence: "high" }  // WORSE than grass-fed
    ],

    gaps: [
      "Doesn't require grass",
      "Doesn't exclude feedlot",
      "Doesn't specify pasture access",
      "Organic certification allows 100% grain diet"
    ],

    consumerMisconception: "Organic meat = healthy, grass-fed, high quality",
    actualReality: "Organic meat is often grain-fed with organic grain. Omega ratio often WORSE than conventional grass-fed.",

    verifiable: true,
    verificationMethod: "Omega ratio lab test. Organic + high omega ratio (>10:1) = grain-fed confirmation."
  },

  {
    term: "Natural" (meat),
    category: ["beef", "pork", "chicken"],

    aPillarImplications: [
      { attribute: "minimallyProcessed", value: true, confidence: "high" },
      { attribute: "noArtificialIngredients", value: true, confidence: "high" },
      { attribute: "feedlotFinished", value: "LIKELY", confidence: "high" }  // KEY: "Natural" ≠ grass
    ],

    gaps: [
      "Doesn't specify diet",
      "Doesn't exclude feedlot",
      "Doesn't exclude antibiotics",
      "Doesn't exclude hormones",
      "USDA 'Natural' only means minimally processed - nothing about how animal was raised"
    ],

    consumerMisconception: "'Natural' means healthier, better raised",
    actualReality: "'Natural' is a processing term only. Commodity feedlot beef + no processing = can be labeled 'Natural'.",

    verifiable: false,
    verificationMethod: "Term is too vague to verify anything meaningful"
  },

  {
    term: "Heritage" (produce),
    category: ["produce"],

    hPillarImplications: [
      { attribute: "heritageIntent", value: "true_heritage OR heirloom_quality", confidence: "high" },
      { attribute: "isOpenPollinated", value: true, confidence: "high" },
      { attribute: "bredForFlavor", value: true, confidence: "high" }
    ],

    ePillarExpectedOutcomes: [
      { measurement: "brix", expectedValue: "higher_than_commercial", confidence: "medium" },
      { measurement: "flavorComplexity", expectedValue: "high", confidence: "high" }
    ],

    gaps: [
      "Doesn't specify soil quality",
      "Doesn't specify practices",
      "Doesn't specify timing"
    ],

    consumerMisconception: "Heritage = automatically higher quality",
    actualReality: "Heritage cultivar has POTENTIAL for higher quality, but needs good S+A+R to express it.",

    verifiable: true,
    verificationMethod: "Brix measurement, sensory evaluation"
  },

  {
    term: "Organic" (produce),
    category: ["produce"],

    hPillarImplications: [
      { attribute: "isNonGmo", value: true, confidence: "high" }
    ],

    aPillarImplications: [
      { attribute: "fertilityStrategy", value: "soil_banking OR annual_organic", confidence: "high" },
      { attribute: "syntheticPesticides", value: false, confidence: "high" },
      { attribute: "mineralizedSoil", value: "unknown", confidence: "low" }  // KEY GAP
    ],

    ePillarExpectedOutcomes: [
      { measurement: "brix", expectedValue: "unknown", confidence: "low" },
      { measurement: "secondaryNutrition", expectedValue: "higher", confidence: "medium" },  // Stress response
      { measurement: "primaryNutrition", expectedValue: "unknown", confidence: "low" }       // No correlation
    ],

    gaps: [
      "Doesn't require mineralization",
      "Doesn't specify cultivar quality",
      "Doesn't specify harvest timing",
      "Doesn't guarantee higher primary nutrition"
    ],

    consumerMisconception: "Organic = higher nutrition, better flavor",
    actualReality: "Organic's benefit is higher SECONDARY nutrition (polyphenols from stress), not primary (Brix, minerals). Mineralization matters more.",

    verifiable: true,
    verificationMethod: "Brix + nutrient panel. Conventional with mineralized soil often has higher primary nutrition than organic without."
  },

  {
    term: "Regenerative",
    category: ["produce", "meat", "dairy"],

    sPillarImplications: [
      { attribute: "soilBuildingPractices", value: true, confidence: "high" },
      { attribute: "soilHealthImproving", value: true, confidence: "high" }
    ],

    aPillarImplications: [
      { attribute: "coverCropping", value: true, confidence: "high" },
      { attribute: "reducedTillage", value: true, confidence: "high" },
      { attribute: "diversification", value: true, confidence: "high" },
      { attribute: "mineralizedSoil", value: "possible", confidence: "medium" }  // Not required
    ],

    gaps: [
      "Doesn't specify cultivar/breed quality",
      "Doesn't specify harvest timing",
      "Doesn't require mineralization",
      "Standard is evolving (ROC, Land to Market, etc.)"
    ],

    consumerMisconception: "Regenerative = highest quality",
    actualReality: "Regenerative focuses on soil HEALTH and BUILDING, which is great for long-term. Doesn't guarantee immediate quality without H+R+E.",

    verifiable: true,
    verificationMethod: "Soil tests showing improvement over time + quality measurements (Brix, omega)"
  },

  // ... hundreds more terms with similar detailed mappings
]
```

---

## Inference Relationship Examples

### Complex Multi-Hop Inference Chains

```typescript
// Example 1: PLU Code → Complete SHARE Inference

INPUT: PLU 94011 scanned at Whole Foods in Boston on December 15

INFERENCE CHAIN:

// H Pillar
PLU 94011
  → prefix "9" = Organic
    → USDA Organic = Non-GMO (high confidence)
    → Product code "4011" = Banana
      → Common variety = Cavendish (medium confidence)
        → Cavendish heritageIntent = "commercial" (optimized for yield/shipping)

// S Pillar
Banana + December + Boston
  → Not local (no banana production in Northeast)
  → Likely origin: Central America OR Ecuador (high confidence)
  → packinghouse code on sticker (if available)
    → Specific plantation region
      → typicalSoil for that region
  → If no packinghouse: Assume typical commercial conditions (low confidence)

// A Pillar
Organic certification
  → No synthetic pesticides (high confidence)
  → Organic fertility program (high confidence)
  → Mineralized soil: Unknown (low confidence)

// R Pillar
December + 3000 miles shipping
  → Harvested 7-10 days ago (medium confidence)
  → Shipped green, ripening in transit (high confidence)
  → Boston warehouse ripening room (likely)
  → Days from optimal harvest: ~10-14 days (medium confidence)

// E Pillar
Cavendish + Organic + 10-14 days post-harvest
  → Expected Brix: 18-22 (medium confidence)
  → Expected vitamin C: 10-15% degraded from fresh (medium confidence)
  → Actual Brix: User measures 19.5 (high confidence)
  → Comparison: Within expected range, validates model

OVERALL CONFIDENCE: Medium (no farm data, but strong category inferences)

---

// Example 2: "Grass-fed" Beef Label → Omega Prediction

INPUT: Package labeled "Grass-fed Angus Beef" at $15.99/lb

INFERENCE CHAIN:

// H Pillar
"Angus Beef"
  → Breed: Angus or Angus-cross (high confidence)
  → omegaModifier: 0.0 (neutral, no genetic advantage/disadvantage)
  → marblingPotential: "Moderate" (Angus known for marbling)

// A Pillar - THE CRITICAL INFERENCE
"Grass-fed"
  → grassAccess: >50% of life (high confidence)
  → BUT: "Grass-fed" WITHOUT "Grass-finished"
    → INFERENCE: Grain-finished in feedlot (high confidence)
      → Why? If they were 100% grass, they would say "grass-finished"
      → Silence on finishing = grain finishing (industry standard)

  → feedlotDuration: 3-6 months (high confidence)
  → diet sequence: SEQUENTIAL (grass → feedlot)

// R Pillar
"Grass-fed" marketing
  → ageAtHarvest: 18-24 months (medium confidence)
  → feedlotDuration: 4-6 months likely (medium confidence)
  → durationPenalty: +0.5 to +1.0 (medium confidence)

// E Pillar - OMEGA PREDICTION
Base omega (grain-finished): 14:1
+ Breed modifier (Angus): +0.0
+ Duration penalty (5 months): +0.5
= Predicted omega ratio: 14.5:1

TIER CLASSIFICATION: Marketing Grass / Commodity
  → Same omega outcome as conventional commodity beef
  → Consumer paid premium ($15.99 vs $8.99) for identical health profile

VERIFICATION NEEDED: Edacious lab test
EXPECTED RESULT: Omega ratio 12-16:1 (validates grain-finishing inference)

CONSUMER IMPACT: "Grass-fed" label charged 80% premium but delivered commodity omega ratio. Marketing vs. reality.

---

// Example 3: "Organic Pasture-Raised Chicken Breast" → Full SHARE Inference

INPUT: Package at $12.99/lb

INFERENCE CHAIN:

// H Pillar
"Chicken"
  → Species: Gallus gallus domesticus (obvious)
  → Breed: Unknown (not specified)
    → If conventional size: Likely Cornish Cross (fast-growing commercial)
    → If smaller: Possible heritage breed (Slower-growing)
  → Confidence: Low (need breed specification)

// S Pillar
"Pasture-raised"
  → Outdoor access: Yes (high confidence)
  → Pasture quality: Unknown (low confidence)
  → Primary habitat: Could be mostly indoor with outdoor access (medium confidence)

// A Pillar - COMPLEX INFERENCE
"Organic" + "Pasture-raised" (chicken)
  → Organic certification requires organic feed (high confidence)
  → Organic feed = Organic GRAIN (corn, soy) (high confidence)
  → "Pasture-raised" + chicken = Some outdoor access, but chickens scratch/forage, don't GRAZE like ruminants
  → Diet: Predominantly grain (organic grain) + some pasture foraging (high confidence)

  → Feeding breakdown estimate:
    - 80-90% organic grain (corn, soy)
    - 10-20% pasture foraging (bugs, grasses, seeds)

  → omega expectation from grain-based diet: HIGH omega-6 (high confidence)

// E Pillar - OMEGA PREDICTION
Chicken + 80-90% grain diet (even organic)
  → Omega-6 dominant (high confidence)
  → Expected omega ratio: 10-15:1 (high confidence)
  → PRIMARY FAT SOURCE IN DIET: Soy (very high omega-6)

COMPARISON TO TRUE PASTURE:
  → True pasture-raised (majority forage): 3-6:1 ratio
  → This chicken: 10-15:1 ratio (similar to conventional)

CONSUMER IMPACT:
  → Paid premium ($12.99 vs $3.99 conventional)
  → Received: Organic grain = no GMO, no pesticides in feed
  → Did NOT receive: Better omega ratio (grain is grain, organic or not)

VERIFICATION: Edacious test would show high omega-6 from grain diet

KEY INSIGHT: Organic chicken ≠ better fatty acid profile. Grain-fed is grain-fed, whether organic or conventional.

---

// Example 4: Silence Inference - "American Wagyu Ribeye" (no process claims)

INPUT: Steak at $45/lb, label says only "American Wagyu" + "Prime Grade"

INFERENCE CHAIN:

// What IS said:
"American Wagyu"
  → Breed: Wagyu × Angus cross (high confidence)
  → omegaModifier: +0.8 (genetic marbling tendency)
  → marblingPotential: "Exceptional"

"Prime Grade"
  → USDA marbling level: Top 2% (high confidence)
  → Indicates abundant intramuscular fat

// What is NOT said (THE KEY):
NO mention of:
  - "Grass-fed"
  - "Pasture-raised"
  - "No feedlot"
  - "No CAFO"
  - ANY process claims

INFERENCE FROM SILENCE:
  → Extended feedlot finishing (high confidence)
  → Why? Premium Wagyu = extended grain to maximize marbling
  → Duration: 12-18 months grain feeding (high confidence)

// A Pillar
diet: grain_fed (extended)
feedlotDuration: 12-18 months
sequence: SEQUENTIAL (backgrounded on pasture → extended feedlot)

// R Pillar
ageAtHarvest: 28-36 months (high confidence)
feedlotDuration: 12-18 months (high confidence)
durationPenalty: +4.0 to +7.0 (MASSIVE)

// E Pillar - OMEGA PREDICTION (THE PROBLEM)
Base omega (extended grain): 20:1
+ Breed modifier (Wagyu): +0.8
+ Duration penalty (15 months avg): +5.5
= Predicted omega ratio: 26.3:1

TIER CLASSIFICATION: Premium CAFO (WORST health profile)

PRICE VS HEALTH INVERSION:
  → Highest price: $45/lb (450% vs commodity $10/lb)
  → WORST omega ratio: 26:1 (9x worse than grass-finished 3:1)
  → Consumer paid 450% premium for meat that's 900% worse for health

THE SILENCE TOLD THE STORY:
  → No process claims = Extended CAFO
  → Premium Wagyu marketing = Hide the feedlot
  → Marbling ≠ Health

VERIFICATION: Edacious test would confirm omega 20-26:1

FIELDER INSIGHT: "Premium" beef can be the WORST for health. Silence on process = intentional omission.
```

---

## Conclusion

This document barely scratches the surface. Each SHARE pillar has:

- **40-60+ measurable attributes**
- **Hundreds of marketing terms** mapping to combinations of attributes
- **Complex inference chains** with confidence scoring
- **Category-specific translations** (polymorphic)
- **Hierarchical relationships** between attributes
- **Temporal dynamics** (changes over time/season)
- **Verification requirements** (what can be proven vs claimed)

The knowledge graph must model ALL of this complexity to power:
- Fielder's inference engine (incomplete data → SHARE estimates)
- Competitive intelligence (brand claims → expected outcomes → lab verification)
- Consumer education (marketing terms → actual reality)
- Flavor App (PLU scan → complete SHARE breakdown)
- Quality predictions (S+H+A+R → E outcomes)

**This is why Fielder is defensible:** The depth and complexity of SHARE modeling across 80+ product types cannot be replicated without years of domain expertise, research, and measurement data.
