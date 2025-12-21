# USDA Zones + DTH + GDD: How They Connect

**Understanding the relationship between zone data, days to harvest, and Fielder's prediction engine.**

---

## The Three-Layer System

### Layer 1: USDA Zones (WHERE)

**What it tells you:**
- Average minimum winter temperature
- Last spring frost date
- First fall frost date
- → **Growing season length**

**Examples:**
- **Zone 5** (Michigan): Last frost ~May 15, first frost ~Oct 1 = **140 frost-free days**
- **Zone 8** (North Florida): Last frost ~Mar 15, first frost ~Nov 15 = **245 frost-free days**
- **Zone 10** (South Florida): Minimal frost risk = **Year-round growing**

**In Fielder's data:**
- SeedsNow: 621 cultivars with zone compatibility
- Food Forest: 377 perennials with zone compatibility
- Burpee/Mary's: Zone-specific planting windows

### Layer 2: Days to Harvest / DTH (HOW LONG)

**What it tells you:**
- Days from planting to harvest maturity
- Listed on seed packets
- Assumes optimal growing conditions

**Examples:**
| Crop | DTH | Speed |
|------|-----|-------|
| Radish | 25-30 days | Fast |
| Lettuce | 30-45 days | Fast |
| Bush Beans | 50-60 days | Medium |
| Tomatoes | 70-90 days | Medium-Long |
| Winter Squash | 85-110 days | Long |
| Sweet Corn | 90-100 days | Long |

**Problem with DTH:**
- Assumes consistent temperature
- Doesn't account for seasonal variation
- 80 DTH in summer ≠ 80 DTH in winter

**In Fielder's data:**
- Mary's Heirloom: 23 cultivars with DTH
- SeedsNow: Only 0.5% have DTH (3 of 621)
- **This is the data gap we need to fill**

### Layer 3: GDD / Growing Degree Days (WHEN, precisely)

**What it tells you:**
- Temperature-adjusted maturity prediction
- Accounts for seasonal heat variation
- More accurate than simple DTH

**Formula:**
```
Daily GDD = (Tmax + Tmin) / 2 - base_temp

Harvest when: Σ(Daily GDD) >= GDD_required
```

**Why it's better than DTH:**

| Month | Zone 10 Avg Temp | Daily GDD (base 50°F) | Calendar Days for 100 GDD |
|-------|------------------|----------------------|---------------------------|
| August | 85°F | 25 GDD/day | 4 days |
| October | 78°F | 22 GDD/day | 4.5 days |
| December | 68°F | 18 GDD/day | 5.6 days |

**Same 100 GDD requirement takes different calendar days depending on season!**

**In Fielder:**
- GDD prediction engine in `src/lib/prediction/gdd.ts`
- Crop-specific GDD requirements in `src/lib/constants/gdd-targets.ts`
- Accounts for seasonal temperature variation

---

## How to Use Zone + DTH Together

### Basic Method (What's on Seed Packets)

**Step 1: Know your zone's frost dates**
- Zone 5: Last frost ~May 15, first frost ~Oct 1
- Zone 10: Minimal frost, year-round growing

**Step 2: Check seed packet DTH**
- Tomato: 80 days
- Bean: 55 days

**Step 3: Calculate backwards from frost**

**Example: Zone 5 Spring Planting**
```
First fall frost: October 1
Tomato DTH: 80 days
Latest safe planting: Oct 1 - 80 days = July 13
Add 2-week buffer: July 1 latest planting

Actual safe window: May 15 (after last frost) → July 1
```

**Example: Zone 10 Fall Planting**
```
No hard frost, but summer heat limits growth
Tomato: Best planted Aug-Sep for fall/winter harvest
DTH: 80 days
Planting Aug 15 → Harvest ~Nov 1 (naive calculation)
```

### Advanced Method (Fielder's GDD Model)

**Why use GDD instead of DTH:**
1. **Seasonal variation:** 80 calendar days in summer ≠ 80 days in winter
2. **Temperature matters:** Plant growth is temperature-dependent
3. **Accuracy:** GDD accounts for actual heat accumulation

**Example: Cherokee Purple in Zone 10**

**Seed packet says:** 80 days to harvest

**GDD calculation:**
```javascript
// Cherokee Purple requirement: 2800 GDD (base 50°F)
// Zone 10 South Florida daily GDD by season:

Aug 15 planting:
├── Aug 15-31: 16 days × 25 GDD/day = 400 GDD
├── Sep 1-30:  30 days × 24 GDD/day = 720 GDD
├── Oct 1-31:  31 days × 22 GDD/day = 682 GDD
├── Nov 1-30:  30 days × 20 GDD/day = 600 GDD
└── Dec 1-20:  20 days × 18 GDD/day = 360 GDD
                                Total: 2762 GDD

Result: ~127 calendar days (not 80!)
Harvest: December 20
```

**This matches Burpee's zone-specific data:**
- Planting: Aug-Sep
- Harvest: Oct-Jun window (peak Nov-Mar)

---

## Fielder's Data Structure

### What We Have

**Zone Compatibility (Scale):**
- SeedsNow: 621 cultivars × 12 zones = 6,874 relationships
- Food Forest: 377 perennials × zones = 1,736 relationships
- **Total: 8,610 "CAN this grow here?" answers**

**Timing Data (Quality):**
- Burpee: 16 cultivars with month-by-month planting/harvest windows
- Mary's Heirloom: 23 cultivars with DTH + regional timing
- UF/IFAS Extension: Regional peak windows
- **Total: 39 cultivars with "WHEN to plant/harvest" answers**

**GDD Model (Precision):**
- Temperature-adjusted harvest prediction
- Accounts for seasonal variation
- More accurate than DTH alone

### The Data Gap

| Data Type | Coverage | What We Need |
|-----------|----------|--------------|
| Zone compatibility | 998 species (100%) | ✅ Complete |
| DTH | 26 cultivars (2.6%) | ❌ Need for 621 SeedsNow cultivars |
| Timing windows | 39 cultivars (3.9%) | ⚠️ Reference data |
| GDD model | Built-in | ✅ Ready to use |

**The solution:**
1. Collect DTH from seed packets (manual or scraping)
2. Use GDD model to calculate zone-specific windows
3. Validate against Burpee/Mary's reference data

---

## Example Queries

### Query 1: Basic Zone Check

**Question:** "Can I grow Cherokee Purple tomatoes in Zone 10?"

**Answer:**
```javascript
// Check SeedsNow compatibility
const cultivar = kg.entities.seedsnowCultivars
  .find(c => c.name.includes('Cherokee Purple'));

cultivar.zones.includes('10'); // true

// Result: YES, it can grow in Zone 10
```

### Query 2: Timing Calculation

**Question:** "When do I plant Cherokee Purple in Zone 10 for winter harvest?"

**Answer:**
```javascript
// Get reference timing from Burpee
const burpee = kg.entities.cultivars.cherokee_purple;
burpee.zoneTiming.zone10;
// { planting: "Aug-Sep", harvest: "Oct-Jun" }

// Or calculate with GDD model
import { predictHarvestDate } from '@/lib/prediction/gdd';

const result = predictHarvestDate({
  cultivar: 'cherokee_purple',
  zone: '10',
  plantingDate: new Date('2025-08-15'),
  gddRequired: 2800,
  baseTemp: 50
});

// Result:
// {
//   harvestDate: new Date('2025-12-20'),
//   daysToHarvest: 127,
//   gddAccumulated: 2762,
//   confidence: 0.88
// }
```

### Query 3: Multiple Succession Plantings

**Question:** "How do I time lettuce for continuous harvest in Zone 10?"

**Answer:**
```javascript
// Lettuce: 30-45 DTH, fast-growing
// Zone 10: Plant every 2-3 weeks Oct-Mar

const plantingSchedule = [
  { plant: 'Oct 1', harvest: 'Nov 1-15' },
  { plant: 'Oct 15', harvest: 'Nov 15-30' },
  { plant: 'Nov 1', harvest: 'Dec 1-15' },
  { plant: 'Nov 15', harvest: 'Dec 15-31' },
  // Continue through March
];

// Continuous harvest Oct-May with 2-week succession planting
```

---

## Integration with SHARE Framework

### R (Ripen) Pillar = Zone + DTH + GDD

From Fielder's SHARE framework:

```
R (Ripen) - TIMING
├── R_maturity: DEGREE of genetic expression
│   └── Tree age: Young (penalty) vs Prime (optimal)
│
└── R_timing: CAPTURE of expressible potential
    ├── GDD accumulation (for annuals)
    ├── Harvest window (peak vs early/late)
    └── Zone-specific frost dates
```

**For Annual Vegetables:**
```
Zone frost dates (R_timing)
  +
Cultivar GDD requirement (genetics)
  +
Current date (actual conditions)
  =
Optimal planting window prediction
```

**For Perennials:**
```
Zone compatibility (can it survive winter?)
  +
Tree age (R_maturity)
  +
Bloom date + GDD to fruit
  =
Harvest window prediction
```

---

## Real-World Example: Florida Fall Tomato Production

### The Challenge

**Zone 10 South Florida:**
- No hard frost (year-round growing possible)
- Summer: Too hot for tomatoes (95°F+ = poor fruit set)
- Fall/Winter: Perfect conditions (70-80°F)
- **Optimal planting: Aug-Sep for Oct-Mar harvest**

### Using All Three Layers

**Layer 1: Zone (WHERE)**
```javascript
// Confirm Zone 10 compatibility
seedsnowCultivars.filter(c =>
  c.cropType === 'tomato' &&
  c.zones.includes('10')
);
// Returns: 54 tomato varieties
```

**Layer 2: DTH (HOW LONG)**
```javascript
// Get DTH from Mary's Heirloom
const floradade = {
  cultivar: 'Floradade',
  daysToMaturity: 75,
  floridaAdapted: true
};

// Naive calculation:
// Plant Aug 15 + 75 days = Oct 29 harvest
```

**Layer 3: GDD (WHEN, precisely)**
```javascript
// Apply GDD model for accuracy
const prediction = predictHarvestDate({
  cultivar: 'floradade',
  zone: '10',
  plantingDate: new Date('2025-08-15'),
  gddRequired: 2600, // Lower than most tomatoes
  baseTemp: 50
});

// Result:
// {
//   harvestDate: new Date('2025-11-15'),
//   daysToHarvest: 92, // Not 75!
//   gddAccumulated: 2598,
//   peakHarvestWindow: 'Nov-Feb'
// }
```

**Validation:**
```javascript
// Check against Burpee reference data
burpee.tomato.zoneTiming.zone10;
// { planting: "Aug-Sep", harvest: "Oct-Jun" }

// ✅ Our prediction (Nov 15) falls within Oct-Jun window
// ✅ Confidence: 0.90
```

---

## Action Items for Fielder

### 1. Fill DTH Data Gap

**Current:** 26 cultivars with DTH (2.6%)
**Target:** 621 SeedsNow cultivars with DTH

**Methods:**
- A. Scrape individual product pages (621 requests)
- B. Manual data entry from seed catalogs
- C. Infer from similar cultivars (lower confidence)

### 2. Expand Reference Timing Data

**Current sources:**
- Burpee: 16 cultivars
- Mary's: 23 cultivars
- UF/IFAS: Regional guides

**Expand to:**
- More seed companies with timing calendars
- Extension services (Texas A&M, UC Davis)
- Farm observations (LocalHarvest data)

### 3. Validate GDD Model

**Test predictions against:**
- Burpee's zone-specific calendars
- Mary's Florida timing data
- Farm harvest records

**Adjust GDD requirements if needed**

### 4. Build Timing Inference System

**For cultivars without timing data:**
```javascript
// Use crop type + zone to infer timing
function inferTiming(cultivar, zone) {
  // Find similar cultivars with timing data
  const references = getCultivarsWithTiming({
    cropType: cultivar.cropType,
    zone: zone
  });

  // Average their GDD requirements
  const avgGDD = references.reduce((sum, r) =>
    sum + r.gddRequired, 0) / references.length;

  // Apply to target cultivar
  return {
    inferredGDD: avgGDD,
    confidence: 0.70, // Lower than direct data
    referencesUsed: references.length
  };
}
```

---

## Summary

**The relationship:**
```
USDA Zone → Frost Dates → Growing Season Length
              ↓
           DTH (Days to Harvest)
              ↓
        GDD (Temperature-Adjusted)
              ↓
    Zone-Specific Planting Window
```

**Fielder's advantage:**
- Most tools stop at Zone + DTH
- Fielder uses GDD for temperature correction
- Result: More accurate predictions

**Current state:**
- ✅ Zone compatibility: 998 species
- ⚠️ DTH data: 26 cultivars (need 621)
- ✅ GDD model: Built and ready
- ⚠️ Timing windows: 39 cultivars (reference)

**Next steps:**
1. Collect DTH for SeedsNow cultivars
2. Validate GDD predictions against reference data
3. Build timing inference for cultivars without direct data
4. Expand to all Florida zones (8-11)
