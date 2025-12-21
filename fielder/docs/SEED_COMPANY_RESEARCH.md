# Seed Company Research Guide

## Overview

**Seed companies have already done the work: cultivar × zone × timing.**

Every seed catalog and packet includes USDA zone-based planting recommendations. This is **commercially validated** data refined over decades of customer feedback.

## Why Seed Company Data Matters

| What They Provide | Why It's Valuable |
|-------------------|-------------------|
| **Days to Maturity** | Cultivar-specific GDD requirement (implicitly) |
| **Zone Recommendations** | Geographic limits (where cultivar succeeds) |
| **Planting Dates by Zone** | Zone-specific timing windows |
| **Multiple Planting Windows** | Season extensions, succession planting |
| **Heritage Cultivar Focus** | Heirloom companies = Fielder's target cultivars |

**The beauty:** This maps directly to USDA zones, which we already use as primary key.

## Major Seed Companies (Priority Order)

### Tier 1: Heritage/Heirloom Specialists

These companies focus on flavor-focused cultivars (Fielder's target market):

| Company | Focus | Why Priority |
|---------|-------|--------------|
| **Johnny's Selected Seeds** | Professional growers, detailed data | Most rigorous zone/timing data |
| **Baker Creek Heirloom** | Rare heirlooms, heritage varieties | Slow Food Ark overlap |
| **Seed Savers Exchange** | Heirloom preservation | Heritage cultivar focus |
| **Southern Exposure Seed** | Heirlooms, open-pollinated | Southeast/South cultivation data |
| **Territorial Seed** | Pacific Northwest focus | Zone 8-9 specialty |

### Tier 2: Major Commercial (High Volume)

Large catalogs, comprehensive data:

| Company | Strengths |
|---------|-----------|
| **Burpee** | Largest selection, detailed zone guides |
| **Park Seed** | 150 years data, comprehensive catalog |
| **Harris Seeds** | Professional grower focus |
| **Jung Seed** | Upper Midwest specialization |

### Tier 3: Regional Specialists

Zone-specific expertise:

| Company | Region | Zones |
|---------|--------|-------|
| **Renee's Garden** | California, Southwest | 8-10 |
| **Fedco Seeds** | Northeast | 3-5 |
| **High Mowing Seeds** | Northern tier | 3-6 |
| **Sow True Seed** | Southeast | 7-9 |

## Data Collection Process

### Step 1: Identify Target Cultivars

Start with cultivars already in Fielder database (`products.ts`):

**Priority cultivars:**
- Heritage tomatoes: Cherokee Purple, Brandywine, Arkansas Black
- Heritage apples: Honeycrisp, Arkansas Black, Winesap
- Strawberries: Florida varieties (UF/IFAS bred)
- Slow Food Ark varieties (226 total, 161 produce)

### Step 2: Find Seed Company Listing

**Search pattern:**
```
"[Cultivar Name] seed" site:johnnyseeds.com
"Cherokee Purple" site:rareseeds.com
"[Cultivar Name]" site:burpee.com
```

### Step 3: Extract Zone Data

**Look for these fields on product pages:**

```json
{
  "cultivarName": "Cherokee Purple",
  "seedCompany": "Johnny's Selected Seeds",
  "url": "https://...",
  "daysToMaturity": "80-85 days",
  "zonePlanting": {
    "3-4": {
      "indoor": "Feb-Mar",
      "transplant": "May-Jun",
      "harvestWindow": "Aug-Sep"
    },
    "5-6": {
      "indoor": "Mar-Apr",
      "transplant": "Apr-May",
      "harvestWindow": "Jul-Aug"
    },
    "7-8": {
      "directSeed": "Apr-May",
      "harvestWindow": "Jun-Jul (spring), Oct-Nov (fall)"
    },
    "9-10": {
      "plantWindows": ["Aug-Sep (fall)", "Jan-Mar (spring)"],
      "harvestWindow": "Oct-Jun"
    },
    "11": {
      "plantWindows": ["Year-round"],
      "harvestWindow": "Year-round"
    }
  },
  "notes": "Heirloom, indeterminate, excellent flavor",
  "capturedDate": "2025-12-20"
}
```

### Step 4: Triangulate with Other Sources

Cross-validate seed company timing with:

1. **Extension services** (academic validation)
2. **State harvest calendars** (aggregate confirmation)
3. **Other seed companies** (commercial consensus)

**Example triangulation - Cherokee Purple in Zone 8:**

| Source | Zone 8 Planting | Zone 8 Harvest | Confidence |
|--------|-----------------|----------------|------------|
| Johnny's Seeds | Mar-Apr, Aug | Jun-Jul, Oct-Nov | 0.90 |
| Baker Creek | Mar-May | Jun-Aug | 0.85 |
| North FL Extension | Mar-Apr, Aug-Sep | May-Jul, Oct-Nov | 0.95 |
| FL Harvest Calendar | (aggregated) | May-Nov | 0.95 |

**Consensus:** Zone 8 = Spring planting (Mar-Apr) + Fall planting (Aug), Harvest windows confirmed.

## Data Storage Structure

```json
{
  "cultivarZoneTiming": {
    "cherokee_purple": {
      "cultivarId": "cherokee_purple",
      "displayName": "Cherokee Purple",
      "daysToMaturity": 82,
      "seedCompanySources": [
        {
          "company": "Johnny's Selected Seeds",
          "url": "https://www.johnnyseeds.com/...",
          "daysToMaturity": "80-85",
          "confidence": 0.90
        },
        {
          "company": "Baker Creek Heirloom Seeds",
          "url": "https://www.rareseeds.com/...",
          "daysToMaturity": "80-90",
          "confidence": 0.85
        }
      ],
      "zoneTimings": {
        "8": {
          "plantingWindows": [
            {
              "season": "spring",
              "indoor": "Feb-Mar",
              "transplant": "Apr-May",
              "directSeed": "Apr-May",
              "sources": ["Johnny's", "Baker Creek"]
            },
            {
              "season": "fall",
              "indoor": "Jul-Aug",
              "transplant": "Aug-Sep",
              "directSeed": "Aug",
              "sources": ["UF/IFAS Extension"]
            }
          ],
          "harvestWindows": [
            {
              "season": "spring",
              "months": [6, 7],
              "notes": "Plant spring for early summer harvest"
            },
            {
              "season": "fall",
              "months": [10, 11],
              "notes": "Plant late summer for fall harvest"
            }
          ],
          "gddAccumulation": {
            "avgDailyGdd": 18,
            "totalRequired": 2800,
            "calculatedDays": 85
          }
        },
        "10": {
          "plantingWindows": [
            {
              "season": "fall-winter",
              "directSeed": "Aug-Sep",
              "notes": "Main commercial planting window"
            },
            {
              "season": "spring",
              "directSeed": "Jan-Mar",
              "notes": "Second season planting"
            }
          ],
          "harvestWindows": [
            {
              "months": [10, 11, 12, 1, 2, 3, 4, 5, 6],
              "peak": [12, 1, 2, 3],
              "notes": "Extended harvest, winter peak"
            }
          ],
          "gddAccumulation": {
            "avgDailyGdd": 22,
            "totalRequired": 2800,
            "calculatedDays": 75
          }
        }
      }
    }
  }
}
```

## Research Workflow Integration

### Phase 1: Bulk Catalog Scraping

**Goal:** Get zone recommendations for 100+ cultivars quickly

**Method:**
1. Identify top seed companies (Johnny's, Burpee, Baker Creek)
2. Download PDF catalogs (often available)
3. Extract cultivar × zone data systematically
4. Store in structured format

**Tools:**
- PDF parsing (if catalogs are PDFs)
- Web scraping (respectfully, following robots.txt)
- Manual data entry for priority cultivars

### Phase 2: Cultivar-Specific Deep Dive

**Goal:** Get detailed timing for Fielder priority cultivars

**Method:**
1. Look up each Fielder cultivar in 3-5 seed company catalogs
2. Extract zone-by-zone planting and harvest data
3. Triangulate across sources
4. Document consensus vs outliers

**Priority cultivars** (start here):
- All cultivars in `products.ts` with `isHeritage: true`
- Slow Food Ark varieties
- State extension-recommended varieties

### Phase 3: Validation with Extension Data

**Goal:** Cross-validate seed company recommendations with academic sources

**Method:**
1. Find extension variety trials for cultivar
2. Compare recommended zones
3. Compare days to maturity
4. Document any discrepancies

**Example:**
- Johnny's says "Cherokee Purple: 80-85 days"
- OSU Extension says "Cherokee Purple: 85-90 days in Ohio trials"
- Consensus: 85 days (split the difference)

## Expected Outcomes

### Coverage Goals

| Timeframe | Cultivars Mapped | Zones Covered |
|-----------|------------------|---------------|
| Week 1 | 50 (priority) | 8, 9, 10 (FL focus) |
| Month 1 | 200 (Fielder database) | 5-10 (major zones) |
| Quarter 1 | 500+ (expanded) | 3-11 (all zones) |

### Data Quality

**High confidence** (0.90+):
- Multiple seed companies agree
- Extension data confirms
- Commercially proven cultivars

**Medium confidence** (0.70-0.89):
- 1-2 seed companies
- Limited extension data
- Less common cultivars

**Low confidence** (0.50-0.69):
- Single source
- New/rare cultivars
- Conflicting data

## Integration with SHARE Framework

### How Seed Company Data Feeds SHARE

**H (Heritage):**
- Seed companies document which cultivars are heirloom vs hybrid
- Heritage intent classification validated
- Genetic ceiling established (days to maturity = GDD requirement)

**R (Ripen):**
- Zone-based planting dates = timing foundation
- Days to maturity + zone = harvest window
- Multiple planting windows = succession planting opportunities

**Validation:**
- Seed company data (commercial) + Extension data (academic) + State calendars (aggregate) = Three-way validation
- When all three align → High confidence harvest timing

## Priority Tasks

1. **Scrape Johnny's Seeds catalog** for zone data on 50 priority cultivars
2. **Document Cherokee Purple** across 5 seed companies (proof of concept)
3. **Create data schema** for cultivar × zone timing
4. **Build comparison tool** to show seed co vs extension vs state data
5. **Validate GDD calculations** against seed company "days to maturity"

## Resources

**Seed Company Websites:**
- Johnny's: https://www.johnnyseeds.com/
- Baker Creek: https://www.rareseeds.com/
- Seed Savers: https://www.seedsavers.org/
- Burpee: https://www.burpee.com/
- Territorial: https://territorialseed.com/

**Zone-Based Planting Calendars:**
- Most seed companies publish free downloadable planting calendars
- Organized by zone
- Include succession planting recommendations

**Extension Integration:**
- Cross-reference with extension variety trials
- Extension often cites seed company data
- Creates closed validation loop

---

**Bottom Line:** Seed companies have spent decades validating cultivar × zone timing. We don't need to recreate this - we need to systematically collect, structure, and integrate it with our USDA zone primary key architecture.
