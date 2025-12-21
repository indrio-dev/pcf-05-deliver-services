# Agricultural Intelligence Research Workflow

## Overview

This document describes the systematic research framework for building Fielder's agricultural intelligence knowledge graph. The workflow follows a **top-down, multi-source triangulation** approach:

```
State-level (days) → Regional (weeks) → Farm-level (months) → Quality verification (ongoing)
```

## The Layered Approach

Each layer provides value independently. Incomplete data is acceptable - the system improves iteratively:

| Layer | Data Source | Time to Build | Value Provided |
|-------|-------------|---------------|----------------|
| **1. State × Product** | Official ag dept charts | Days | Baseline harvest timing, geographic coverage |
| **2. Regional × Cultivar** | Extension services | Weeks | Recommended varieties, trial results |
| **3. Farm Discovery** | LocalHarvest validation | Weeks | Actual farm locations, product offerings |
| **4. Farm Verification** | Direct contact, social media | Months | Specific cultivars, harvest schedules |
| **5. Quality Data** | Lab tests, measurements | Ongoing | Brix, omega ratios, SHARE validation |

## Phase 1: State-Level Foundation (START HERE)

### Goal

Establish baseline harvest timing at **State × Product Type** level for all major agricultural states, with **sub-state zone variations** where significant.

### Why This First?

- **Fast**: Official charts already exist for most states
- **Comprehensive**: Covers entire product category (all tomatoes, all apples)
- **Authoritative**: Government-published, high confidence
- **Foundation**: Everything else builds on this baseline

### Critical Nuance: Intra-State Agricultural Zones

**States have multiple growing zones that are NOT the same as Fielder's growing regions.**

#### Example: Florida Has 3 Agricultural Zones

**Source**: USDA Plant Hardiness Zone Map (https://planthardiness.ars.usda.gov/)

| Zone | USDA Zones | Counties (Examples) | Temp Range | Growing Pattern |
|------|------------|---------------------|------------|-----------------|
| **North FL** | 8a-9a | Escambia, Leon, Duval, Jacksonville | 10-20°F min | Spring + Fall seasons (like GA/SC) |
| **Central FL** | 9a-10a | Hillsborough, Orange, Brevard, Polk | 20-35°F min | Extended seasons, citrus belt |
| **South FL** | 10a-11a | Collier, Miami-Dade, Palm Beach, Monroe | 30-40°F+ min | Year-round, winter veg capital |

**Florida spans 7 USDA zones** (8a → 11a) across ~450 miles north-south.

**Why USDA zones matter for research:**
1. **Objective, measurable**: Based on 30-year average minimum winter temperatures
2. **Predicts what survives**: Zone 8a = hard freezes, Zone 11a = no frost ever
3. **Maps to counties**: County → USDA zone → Agricultural zone → Harvest timing
4. **Explains timing differences**: Zone 8a tomatoes (spring/fall only) vs Zone 10b (year-round)

**How to use USDA zone maps during research:**

When researching a state, reference the official USDA map:
1. Identify the zone range (e.g., Florida: 8a-11a)
2. Look for zone "breaks" where growing patterns change significantly
3. Group zones into agricultural zones based on crop timing patterns
4. Document counties in each zone (for farm location mapping)

**Zone breaks indicate different growing strategies:**
- **Zones 8-9**: Frost risk, two-season crops (spring + fall)
- **Zones 9-10**: Transition zone, extended seasons, some year-round
- **Zones 10-11**: Tropical, year-round warm-season crops

**Same crop, DIFFERENT timing by zone:**

**Florida Tomatoes**:
- **State-level data**: "Oct-Jun harvest" ✓ (accurate for FL overall)
- **North FL reality**: May-Jul + Oct-Nov (two distinct seasons)
- **South FL reality**: Oct-Jun year-round (winter commercial production)

**Why zone data matters:**
1. **Accuracy**: State averages hide significant variation
2. **Farmer guidance**: "Plant tomatoes in Florida" is too vague - WHEN depends on WHERE in Florida
3. **Supply chain**: South FL supplies winter markets, North FL supplies summer
4. **Quality prediction**: Same cultivar, different timing = different GDD accumulation = different Brix

#### How Zones Relate to Fielder's Growing Regions

**Fielder's growing regions** (`growing-regions.ts`): ~150 regions based on soil/climate for SHARE predictions

**State agricultural zones**: Simpler divisions based on harvest timing patterns

**Relationship:**
```
State Zones (harvest timing)
    ↓
    Maps to multiple Fielder Growing Regions
    ↓
    Which have typicalSoil profiles for SHARE
```

**Example Mapping - Florida**:

| State Zone | Fielder Growing Regions (from growing-regions.ts) | Primary Use |
|------------|---------------------------------------------------|-------------|
| **North FL** | `north_florida`, `tallahassee_region` | Spring/Fall timing, temperate crops |
| **Central FL** | `central_florida_ridge`, `tampa_bay_area`, `space_coast_fl` | Citrus, extended seasons |
| **South FL** | `indian_river_fl`, `southwest_fl`, `everglades_ag_area`, `miami_dade_ag` | Winter vegetables, tropical fruit, year-round |

**The hierarchy in action:**

```
State: "Florida"
  ↓
State Zone: "South Florida" (Oct-Jun tomatoes)
  ↓
Fielder Growing Region: "southwest_fl"
    - typicalSoil: "sandy loam, well-drained"
    - Climate: Tropical, frost-free
    - Harvest window: Oct-Jun (from state zone)
  ↓
Farm: "Heritage Family Farm, Naples FL"
    - Location confirms: Southwest FL zone ✓
    - Cultivars: Cherokee Purple, Brandywine
    - SHARE predictions use: southwest_fl soil + cultivar genetics
```

**Why this matters:**
1. **Research efficiency**: Start broad (state zones), drill down to Fielder regions
2. **Harvest timing**: State zone provides the window
3. **Quality prediction**: Fielder region provides soil/climate for Brix
4. **Farm validation**: Farm location maps to both zone (timing) and region (soil)

**Typical correlation**: One state zone = 2-5 Fielder growing regions

### Data Sources: Multiple Validated Systems

#### 1. USDA Zone-Based GDD Models (ALREADY EXIST)

**The user is correct: We don't need to calculate GDD from scratch. Agricultural research institutions have decades of zone-based data.**

**Sources:**
- University Extension Services publish GDD accumulation tables by zone
- USDA Agricultural Research Service has zone-based climate data
- Regional agricultural research stations track GDD by zone annually

**Example Resources:**
- Michigan State University: "GDD Accumulation by USDA Zone"
- University of California: "Growing Degree Days for California Zones"
- NOAA/NWS: Historical GDD data by weather station → mapped to zones

**What this provides:**
- Expected GDD accumulation rate for each zone
- Historical averages (30-year data matches USDA zone definition)
- Seasonal GDD curves (early vs late season accumulation)
- Validation data for prediction models

#### 2. Seed Company Planting Guides (COMMERCIAL VALIDATION)

**Every seed packet has "Plant in Zone X: [dates]" - seed companies have already mapped cultivar × zone.**

**Major Seed Companies with Zone-Based Data:**
- **Johnny's Selected Seeds**: Detailed planting calendars by zone
- **Burpee**: Zone-based planting dates for every cultivar
- **Park Seed**: Days to maturity + zone recommendations
- **Baker Creek**: Heirloom varieties with zone timing
- **Territorial Seed**: Regional planting guides (zones grouped)

**What seed companies provide:**
```
Cherokee Purple Tomato (Example):
- Days to Maturity: 80-85 days
- Zone 3-4: Start indoors Feb-Mar, transplant May-June
- Zone 5-6: Start indoors Mar-Apr, transplant April-May
- Zone 7-8: Direct seed April-May OR Start indoors Feb-Mar
- Zone 9-10: Plant Aug-Sept (fall) OR Jan-Mar (spring)
- Zone 11: Year-round planting possible
```

**This is GOLD because:**
- Commercially validated (seed companies stake reputation on accuracy)
- Cultivar-specific (not just generic "tomato" - actual variety timing)
- Already researched (decades of customer feedback refined these dates)
- Free and public (seed catalogs, websites)

#### 3. State Agriculture Department Charts (Aggregate Validation)

Every state publishes seasonal availability guides. Example:

**Florida Harvest Calendars**:
- https://ccmedia.fdacs.gov/content/download/16790/file/florida-produce-seasonal-availability-chart.pdf
- https://www.fdacs.gov/consumer-resources/buy-fresh-from-florida/crops-in-season

These charts show:
- All major crops grown in the state
- Month-by-month availability
- Peak vs shoulder seasons

#### Validation: Planting Guides (Inverse Data)

Planting guides provide **inverse validation** of harvest windows:

**Florida Planting Guide**: https://growincrazyacres.com/florida-planting-guide/

**How Planting Guides Validate Harvest Data**:

```
Planting Date + Days to Maturity = Expected Harvest Date
```

**Example - Florida Tomatoes**:
- **Planting guide says**: Plant Aug-Sept, also Jan-Mar
- **Days to maturity**: ~75-85 days
- **Expected harvest**: Oct-Nov (fall plant) + Mar-Jun (spring plant)
- **Harvest calendar confirms**: Oct-Jun availability ✓

**Why multiple planting windows matter**:
- Explains extended harvest seasons
- Shows succession planting patterns
- Reveals climate advantages (Florida's year-round growing)

**Data confidence**: Planting guides are lower confidence (0.70) than official harvest charts (0.95) because:
- Often from farm/blog sources vs government
- Recommendations vary by specific location
- BUT: Provides valuable cross-validation when dates + DTM match harvest windows

### Research Process

#### Step 1: Generate Research Queries

```bash
npm run research:state FL
```

This outputs:
- Search queries targeting the official chart
- Expected chart patterns
- Data entry format

#### Step 2: Find the Official Chart

Execute the search queries (manually or via WebSearch API). Look for:
- PDFs with "seasonal availability" or "harvest calendar"
- Usually found in:
  - Department of Agriculture "Resources" section
  - "For Consumers" or "Buy Local" programs
  - Agricultural marketing programs (e.g., "Florida Fresh", "Jersey Fresh")

#### Step 3: Extract Harvest Timing

From the chart, identify:
- **harvestMonths**: All months with availability
- **peakMonths**: Highest volume/quality period
- **Regional notes**: Important geographic distinctions within the state

#### Step 4: Identify Sub-State Zones (If Significant)

**Look for clues in planting guides and extension resources:**

Indicators that zones matter:
- ✅ Planting guide shows different dates by region ("North FL: plant March", "South FL: plant January")
- ✅ USDA hardiness zones span 3+ zones within state
- ✅ State has major geographic/climate divisions (mountains, coast, desert, etc.)
- ✅ Extension resources reference "northern region" vs "southern region"

**States where zones definitely matter:**
- **CA**: Coast vs Central Valley vs Southern CA (completely different climates)
- **FL**: North vs Central vs South (subtropical to tropical gradient)
- **TX**: West Texas (arid) vs East Texas (humid) vs Rio Grande Valley (subtropical)
- **NY**: Long Island vs Upstate vs Finger Lakes
- **NC**: Mountains vs Piedmont vs Coastal Plain

**States where state-level data is probably sufficient:**
- Small states with uniform climate (DE, RI, CT)
- States dominated by one agricultural region (IA, KS - mostly uniform corn/soy belt)

**When to capture zone variation:**
- If planting/harvest dates differ by 4+ weeks between regions
- If commercial production concentrated in specific zone (e.g., FL winter tomatoes = South FL only)
- If extension resources explicitly break out regional recommendations

#### Step 5: Enter Data

Add to `data/research/state-harvest-calendars.json`:

```json
{
  "states": {
    "OH": {
      "name": "Ohio",
      "department": "Ohio Department of Agriculture",
      "source": {
        "url": "https://agri.ohio.gov/harvest-calendar.pdf",
        "type": "official",
        "title": "Ohio Seasonal Availability",
        "capturedDate": "2025-12-20",
        "confidence": 0.95
      },
      "products": {
        "tomato": {
          "harvestMonths": [7, 8, 9, 10],
          "peakMonths": [8, 9],
          "notes": "Summer crop, multiple plantings extend season"
        },
        "apple": {
          "harvestMonths": [8, 9, 10, 11],
          "peakMonths": [9, 10],
          "notes": "Major varieties: Honeycrisp, Gala, Rome"
        }
      }
    }
  }
}
```

### Priority States (In Order)

1. **CA** - Largest agricultural producer, year-round growing
2. **FL** - Winter vegetables, citrus (COMPLETED ✓)
3. **TX** - Large diverse production
4. **NY** - Apples, dairy, vegetables
5. **OH** - Tomatoes, corn, apples
6. **PA** - Mushrooms, apples, dairy
7. **MI** - Cherries, blueberries, apples
8. **NC** - Sweet potatoes, tobacco, apples
9. **GA** - Peaches, pecans, peanuts
10. **WA** - Apples, berries, hops

(See `state-harvest-tool.ts` for complete list of 20 states)

### Expected Timeline

- **Per state**: 5-10 minutes (find chart, extract major crops)
- **20 states**: 2-3 hours total
- **Result**: Baseline coverage for all major US agricultural regions

### Tools

```bash
# Research a single state
npm run research:state OH

# Generate full research checklist
npm run research:state checklist

# See Florida example (completed)
npm run research:state florida-example
```

## Phase 2: Seed Company Zone Mapping (NEW - PRIORITY)

### Goal

Extract **cultivar × zone timing** from seed company catalogs - this data already exists and is commercially validated.

### Why This First (Before Extension Research)

**Seed companies have done the work:**
- Every seed packet: "Plant in Zone X: [dates]"
- Days to maturity documented for each cultivar
- Zone-specific planting windows
- Decades of customer feedback validation

**This is faster and more comprehensive than extension research:**
- One Johnny's Seeds catalog = 500+ cultivars with zone data
- Burpee, Baker Creek, Park Seed = thousands more
- All organized by USDA zone (matches our primary key)
- Cultivar-specific (not just "tomato" - actual varieties)

### Data Sources (Priority Order)

1. **Johnny's Selected Seeds** - Most rigorous data, professional grower focus
2. **Baker Creek Heirloom Seeds** - Heritage varieties (Fielder's target)
3. **Burpee** - Largest catalog, comprehensive zone guides
4. **Seed Savers Exchange** - Heirloom preservation
5. **Park Seed** - 150 years of data

### Research Process

**See detailed guide:** `docs/SEED_COMPANY_RESEARCH.md`

**Quick process:**
1. Look up cultivar in seed company catalog
2. Extract: Days to maturity + zone recommendations + planting dates
3. Repeat for 3-5 seed companies (triangulation)
4. Store in `cultivar-zone-timing.json`

**Example - Cherokee Purple:**
```json
{
  "cultivarId": "cherokee_purple",
  "daysToMaturity": 82,
  "zoneTimings": {
    "8": {
      "plantWindows": ["Mar-Apr (spring)", "Aug (fall)"],
      "harvestWindows": ["Jun-Jul", "Oct-Nov"]
    },
    "10": {
      "plantWindows": ["Aug-Sep", "Jan-Mar"],
      "harvestWindows": ["Oct-Jun"]
    }
  }
}
```

### Expected Timeline

- **Per cultivar**: 10-20 minutes (look up 3-5 catalogs)
- **50 cultivars**: 1 week
- **200 cultivars**: 1 month
- **Result**: Cultivar-specific timing for all USDA zones

### Integration with USDA Zone Index

Seed company data **validates zone-based GDD models:**
- "Days to maturity" = GDD requirement (implicit)
- Zone recommendations = where cultivar succeeds
- Planting dates by zone = timing windows

**Top-Down vs Bottom-Up Validation (CRITICAL):**

We now have TWO independent methods that should produce the SAME harvest windows:

| Method | Source | Level | Example |
|--------|--------|-------|---------|
| **Top-Down** | State harvest calendars | Aggregate | "Zone 10 tomatoes: Oct-Jun" |
| **Bottom-Up** | Seed cultivar data + GDD | Specific | "Cherokee Purple: 75 days from Aug = Oct harvest" |

**When they match → Bulletproof validation:**

```
TOP-DOWN (State aggregate):
  Florida Zone 10 tomatoes → Oct-Jun harvest window

BOTTOM-UP (Cultivar-specific):
  Cherokee Purple in Zone 10:
    - Plant: Aug-Sep (seed company recommendation)
    - Days to maturity: 75 days (seed company)
    - GDD requirement: 2800 (calculated from DTM)
    - Zone 10 GDD rate: 22/day (extension data)
    - Calculated harvest: Oct-Nov (75 days from Aug)

  ✓ Oct-Nov falls within Oct-Jun aggregate window
  ✓ Bottom-up validates top-down
  ✓ High confidence prediction
```

**When they DON'T match → Investigation needed:**
- Error in state data?
- Unusual cultivar for that zone?
- Microclimatic variation?
- Data entry mistake?

**This creates a closed validation loop:**
1. **Seed company** (commercial validation)
2. **Extension services** (academic validation)
3. **State harvest calendars** (aggregate validation)
4. **Bottom-up calculation** (physics-based GDD model)

When all four align → Maximum confidence predictions.

## Phase 3: Extension Cultivar Mapping

### Goal

Identify **recommended cultivars** for each State × Product combination and validate seed company data with academic trials.

### Data Sources

1. **University Extension Services**
   - OSU Extension, UF/IFAS, UC Davis, etc.
   - Production guides and variety trials
   - Recommended cultivar lists

2. **Extension Publications**
   - "Recommended Varieties for [State]"
   - "Variety Trial Results [Year]"
   - "Commercial Production Guides"

### Search Patterns

```bash
npm run research:state OH tomato
```

Generates queries like:
- "Ohio State University Extension tomato recommended varieties"
- "OSU tomato variety trial results"
- "Ohio commercial tomato cultivars"

### What To Extract

- **Cultivar names**: Specific variety recommendations
- **Harvest timing**: If provided (more specific than state-level)
- **Growing regions**: Within-state geographic recommendations
- **Trial data**: Performance metrics, disease resistance

### Example Extension Finding

**Source**: Ohio State University Extension Bulletin HYG-1624

> "Recommended tomato varieties for Ohio home gardens and market growers:
> - **Cherokee Purple**: 80 days, heirloom, excellent flavor
> - **Big Beef**: 73 days, hybrid, disease resistant
> - **Sun Gold**: 57 days, cherry, high Brix"

**Data Entry**:

```json
{
  "OH_tomato_extension": {
    "source": {
      "url": "https://ohioline.osu.edu/factsheet/hyg-1624",
      "type": "extension",
      "institution": "Ohio State University",
      "confidence": 0.9
    },
    "recommendedCultivars": [
      {
        "id": "cherokee_purple",
        "name": "Cherokee Purple",
        "daysToMaturity": 80,
        "type": "heirloom",
        "notes": "Excellent flavor, dark purple-red"
      },
      {
        "id": "big_beef",
        "name": "Big Beef",
        "daysToMaturity": 73,
        "type": "hybrid",
        "notes": "Disease resistant, reliable"
      }
    ]
  }
}
```

### Expected Timeline

- **Per State × Product**: 10-30 minutes
- **10 products × 20 states**: 200 combinations = 40-100 hours
- **Prioritization**: Start with top products in top states

## Phase 3: LocalHarvest Farm Discovery (UPGRADED - PRIMARY DATA SOURCE)

### Goal

Extract **farm-level harvest timing** directly from LocalHarvest seasonal availability data.

### Data Source

LocalHarvest.org (~30,000 farms)

### CRITICAL INSIGHT: LocalHarvest Has Seasonal Data

**Each farm's product listing includes seasonal availability!**

**What LocalHarvest Actually Provides:**

✅ **Farm location** → Can map to USDA zone
✅ **Products grown** → Product categories (tomatoes, apples, etc.)
✅ **Seasonal availability** → "Available: June, July, August" (HARVEST TIMING!)
✅ **Contact information** → Website, phone, social media
✅ **Farm type** → CSA, farmers market, U-pick, farm stand

**Example LocalHarvest Farm Listing:**
```
Heritage Family Farm
Athens County, OH

Products and Crops by Season:
  Spring: Lettuce, greens, radishes
  Summer: Tomatoes (June-Sept), peppers, squash
  Fall: Apples (Sept-Nov), pumpkins, winter squash
  Winter: (none listed)

Contact: heritagefamilyfarm.com
```

### Why This Is Game-Changing

**LocalHarvest is now a PRIMARY data source for:**

1. **Farm-level harvest windows** (actual timing from farmers themselves)
2. **Zone validation** (farm location → zone → confirms timing patterns)
3. **Geographic coverage** (30,000 farms with real data)
4. **Seasonal patterns** (see which months farmers report availability)

**This provides bottom-up validation of state-level data:**

```
STATE LEVEL (Top-Down):
  "Ohio tomatoes: June-October"

LOCALHARVEST FARMS (Bottom-Up):
  Heritage Farm (Athens County): "Tomatoes June-Sept"
  Green Acres (Franklin County): "Tomatoes July-Oct"
  Amish Farm (Holmes County): "Tomatoes July-Sept"

  ✓ All farms confirm June-October window
  ✓ Geographic variation visible (Athens earlier than Holmes)
  ✓ Zone correlation: Athens is warmer microclimate
```

### Search Strategy

```typescript
// Example search results aggregation
{
  "OH_tomato_localharvest": {
    "searchQuery": "tomato Ohio",
    "farmCount": 156,
    "topRegions": [
      { "region": "Athens County", "count": 12 },
      { "region": "Franklin County", "count": 18 },
      { "region": "Ashtabula County", "count": 9 }
    ],
    "notes": "Concentrated in southeast (Athens) and urban areas (Columbus)"
  }
}
```

### Integration with Phase 1 & 2

```
Phase 1: Ohio tomato harvest July-October (state ag dept)
Phase 2: Recommended cultivars: Cherokee Purple, Big Beef (OSU Extension)
Phase 3: 156 farms grow tomatoes in Ohio (LocalHarvest validation)
         → Geographic clusters identified for targeted outreach
```

### Expected Timeline

- **Per State × Product**: 5-10 minutes (search, count, note clusters)
- **10 products × 20 states**: 200 searches = 20-40 hours
- **Can be parallelized**: Multiple researchers working different states

## Phase 4: Farm-Level Verification

### Goal

Identify **specific cultivars** grown by individual farms.

### Research Methods

1. **Farm websites**: Many farms list varieties they grow
2. **Social media**: Facebook/Instagram posts about "Cherokee Purple harvest starting"
3. **CSA newsletters**: Weekly harvest lists often name cultivars
4. **Farmers market signage**: "Honeycrisp Apples Now Available"
5. **Direct contact**: Email/phone asking "Which apple varieties do you grow?"

### Detection Patterns

Social media posts to look for:
- "First Cherokee Purple tomatoes ready!"
- "Honeycrisp harvest underway"
- "Our Brandywine tomatoes are at peak"
- Photos of harvest with variety names visible

### Data Entry

```json
{
  "farm_cultivar_observations": [
    {
      "farmId": "heritage_family_farm_oh",
      "farmName": "Heritage Family Farm",
      "location": {
        "city": "Athens",
        "state": "OH",
        "lat": 39.3292,
        "lon": -82.1013
      },
      "cultivarsObserved": [
        {
          "cultivarId": "cherokee_purple",
          "productType": "tomato",
          "source": {
            "type": "social_media",
            "platform": "facebook",
            "url": "https://facebook.com/heritagefamilyfarm/posts/123",
            "date": "2025-07-15",
            "quote": "First Cherokee Purple harvest today!"
          },
          "verificationLevel": "confirmed",
          "harvestObservation": {
            "date": "2025-07-15",
            "stage": "harvest_start"
          }
        }
      ]
    }
  ]
}
```

### Expected Timeline

- **Per farm**: 5-30 minutes depending on available info
- **Target**: 50-100 farms per state (top producers)
- **Iterative**: Build database over months/years
- **User contributions**: Fielder users can report/verify farms

## Phase 5: Quality Verification (Ongoing)

### Goal

Measure actual quality metrics to validate SHARE predictions.

### Measurement Types

| Measurement | Cost | Who Does It | Purpose |
|-------------|------|-------------|---------|
| **Brix (Refractometer)** | $10-30 | Consumers via Flavor App | Validate sugar content predictions |
| **Lab Panels (Edacious)** | $50-200 | Fielder, farms | Full nutrient + omega + pesticide |
| **Visual Inspection** | Free | Anyone | Verify external appearance claims |

### Data Flywheel

```
1. User scans produce in Flavor App
2. App predicts Brix from CV + SHARE inference
3. User measures actual Brix with refractometer
4. Prediction vs Actual recorded
5. Model improves with each data point
6. Better predictions → more users → more data → better predictions
```

### Livestock Verification (Critical)

For meat/dairy, **omega ratio is THE quality differentiator**:

- Grass-fed claim → Expect ≤3:1 ratio
- "Pasture-raised" → Expect 3-7:1 ratio
- Feedlot/commodity → Expect 10-20:1 ratio

**Lab verification catches false claims**:
- Brand claims "grass-fed" but tests at 15:1 → Grain-finished (feedlot)
- Publish results: "Same Label, Different Nutrition"

## Research Priorities

### By Value Impact

1. **High Volume × High Value**: Tomatoes, strawberries, apples
2. **Heritage Focus**: Slow Food Ark of Taste varieties (226 total, 161 produce)
3. **Geographic Gaps**: States with limited data
4. **Quality Variation**: Products where SHARE predicts large deltas

### By Effort Required

**Quick Wins** (Do First):
- Phase 1: State charts (hours)
- LocalHarvest counts (hours)

**Medium Effort**:
- Phase 2: Extension cultivar lists (weeks)
- Farm website research (weeks)

**Long-Term Investment**:
- Farm verification (months)
- Quality measurement (ongoing)

## Data Governance

### Source Attribution

Every data point tracks:
- `source.url`: Where data came from
- `source.type`: 'extension' | 'usda' | 'localharvest' | 'social_media' | 'farm_website' | 'user_reported'
- `source.confidence`: 0-1 scale
- `source.capturedDate`: When data was collected

### Multi-Source Triangulation

When multiple sources provide data:
- Take **earliest start date** for harvest windows
- Take **latest end date** for harvest windows
- Store **all sources** for transparency
- Weight by `confidence` score

### Confidence Levels

| Level | Definition | Example |
|-------|------------|---------|
| **0.95** | Official government publication | State ag dept chart |
| **0.90** | University extension service | OSU production guide |
| **0.85** | State government (non-ag dept) | Tourism board |
| **0.70** | Industry association | Tomato growers cooperative |
| **0.60** | Farm direct claim | Farm website "we grow X" |
| **0.50** | Social media observation | Facebook post |
| **0.30** | Inference from other data | "State grows tomatoes → farm in state likely grows tomatoes" |

### User-Contributed Data

Fielder users can:
- Report farms growing specific cultivars
- Upload harvest timing observations
- Submit Brix measurements
- Verify/dispute existing data

User data starts at confidence 0.40, increases with:
- Multiple reports (same finding)
- Lab verification
- Cross-validation with other sources

## Tools & Scripts

### Research Script

```bash
# State-level research
npm run research:state FL              # Florida overview
npm run research:state OH tomato       # Ohio tomato detail
npm run research:state checklist       # Full research plan
npm run research:state florida-example # See completed example
```

### Data Files

```
data/research/
├── state-harvest-calendars.json      # Phase 1: State × Product timing
├── extension-cultivars.json          # Phase 2: Recommended varieties
├── localharvest-counts.json          # Phase 3: Farm counts by region
└── farm-cultivar-observations.json   # Phase 4: Specific farm data
```

### Type Definitions

```
src/lib/types/agricultural-intelligence.ts
```

All interfaces for the knowledge graph.

### Workflow Code

```
src/lib/research/
├── workflow.ts              # Orchestration classes
├── state-harvest-tool.ts    # Phase 1 tools
└── extension-parser.ts      # Phase 2 tools (TODO)
```

## Integration with SHARE Framework

The research workflow populates the knowledge graph which feeds SHARE predictions:

### S (Soil)

- Regional data → `typicalSoil` inference
- Farm location → Growing region → Soil type

### H (Heritage)

- Cultivar identification → Genetic ceiling determination
- Extension recommendations → Heritage vs commercial classification

### A (Agricultural)

- Organic certification from source data
- Farming practices from farm websites/direct contact

### R (Ripen)

- **Harvest windows from Phase 1** → GDD model inputs
- Farm-specific timing from Phase 4 → Validation data

### E (Enrich)

- Lab measurements → Ground truth
- User Brix readings → Prediction validation
- Omega ratios → Feeding regime verification

## Success Metrics

### Phase 1 Complete When:
- ✅ 20 states have official harvest calendars entered
- ✅ 10 priority products covered per state
- ✅ All data has source attribution

### Phase 2 Complete When:
- ✅ Top 5 states × Top 5 products have extension cultivar lists
- ✅ Recommended cultivars identified for each combination
- ✅ Links to Fielder cultivar database established

### Phase 3 Complete When:
- ✅ LocalHarvest farm counts for all State × Product combinations
- ✅ Geographic clusters identified for targeted outreach
- ✅ Prospective farm list generated

### Phase 4 Ongoing:
- 📈 Grow farm database by 50-100 farms/month
- 📈 Increase cultivar verification rate
- 📈 Improve confidence scores with multi-source validation

### Phase 5 Ongoing:
- 📈 Collect 1,000+ user Brix measurements/month
- 📈 Lab test 10-20 products/month
- 📈 Achieve <10% prediction error for Brix

## Next Steps

1. **Start with Florida** (already completed as example)
2. **Complete California** (largest producer, year-round)
3. **Run checklist** to see full scope
4. **Parallelize research** across team members
5. **Build iteratively** - value at every layer

## Questions?

See `src/lib/research/workflow.ts` for implementation details or review `docs/ai_sessions/` for design discussions.
