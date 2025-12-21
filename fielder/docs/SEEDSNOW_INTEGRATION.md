# SeedsNow Integration

**Date:** 2025-12-21
**Knowledge Graph Version:** 3.0.0

## Summary

Successfully integrated **621 cultivars** from SeedsNow into the Fielder knowledge graph, expanding zone compatibility coverage across USDA zones 2-13.

## Data Source Comparison

### What Each Source Provides

| Source | Count | Strength | Zone Data | Timing Data |
|--------|-------|----------|-----------|-------------|
| **Burpee** | 16 | Zone-specific planting calendars | Zones 8-10 | ✅ Planting + Harvest months |
| **Mary's Heirloom** | 23 | Florida-adapted cultivars | FL regions | ✅ Regional timing |
| **SeedsNow** | 621 | Massive cultivar catalog | Zones 2-13 | ❌ Zone compatibility only |
| **Cornell** | 50+ | User ratings, heritage validation | N/A | ❌ Reviews, not timing |
| **Food Forest** | 377 | Perennial crops | Zones 1A-13B | ❌ Zone compatibility only |

### Complementary Strengths

**SeedsNow's Value:**
- **Scale**: 15.9x more cultivars than previous seed companies combined
- **Zone breadth**: Coverage across all USDA zones (2-13)
- **Product diversity**: 558 vegetables + 63 flowers
- **Accessibility**: Direct links to purchase each cultivar

**SeedsNow's Limitation:**
- No planting/harvest timing data (just zone compatibility)
- Minimal days-to-maturity data (0.5%)
- Limited scientific names (14.3%)

**Why This Still Matters:**
- Zone compatibility = "CAN this grow here?"
- Timing data = "WHEN do I plant/harvest here?"
- Both questions are critical - SeedsNow answers the first at scale

## Knowledge Graph Statistics

### Evolution

| Version | Date | Entities | Description |
|---------|------|----------|-------------|
| **v1.0** | 2025-12-20 | 156 | Annual vegetables with four-way triangulation |
| **v2.0** | 2025-12-20 | 533 | + Perennial crops (377) |
| **v3.0** | 2025-12-21 | **1,154** | + SeedsNow cultivars (621) |

### Entity Breakdown (v3.0)

| Entity Type | Count | Source(s) |
|-------------|-------|-----------|
| Annual vegetables (timing) | 156 | State calendars, UF/IFAS, Burpee, Mary's |
| Perennial crops | 377 | Food Forest |
| SeedsNow cultivars | 621 | SeedsNow |
| **Total** | **1,154** | 7 data sources |

### Relationship Counts

| Relationship Type | Count | Purpose |
|-------------------|-------|---------|
| Zone compatibility (perennials) | 1,736 | Which zones perennials can grow |
| Zone compatibility (SeedsNow) | 6,874 | Which zones annuals can grow |
| Timing windows | 412+ | When to plant/harvest |
| **Total** | **9,022+** | Cross-referenced data |

## SeedsNow Cultivar Breakdown

### Crop Types

| Crop | Count | % of Total |
|------|-------|------------|
| Other/Specialty | 227 | 36.6% |
| Flowers | 63 | 10.1% |
| Tomatoes | 54 | 8.7% |
| Peppers (Hot + Sweet) | 51 | 8.2% |
| Sprouting Seeds | 36 | 5.8% |
| Beans | 31 | 5.0% |
| Lettuce | 25 | 4.0% |
| Squash | 25 | 4.0% |
| Garlic | 21 | 3.4% |
| Carrots | 18 | 2.9% |
| Cucumbers | 17 | 2.7% |
| Watermelons | 14 | 2.3% |
| Cabbage | 14 | 2.3% |
| Gourds | 13 | 2.1% |

### Zone Coverage

**Florida Zones (8-11) Coverage:**

| Zone | Cultivars | % of 621 |
|------|-----------|----------|
| Zone 8 | 612 | 98.6% |
| Zone 9 | 621 | 100% |
| Zone 10 | 621 | 100% |
| Zone 11 | 580 | 93.4% |

**All Zones (2-13):**
- Zone 2: 413 cultivars (66.5%)
- Zone 3: 554 cultivars (89.2%)
- Zone 4: 606 cultivars (97.6%)
- Zone 5-10: 610-621 cultivars (98.2-100%)
- Zone 11: 580 cultivars (93.4%)
- Zone 12: 526 cultivars (84.7%)
- Zone 13: 509 cultivars (81.9%)

**Insight:** Most cultivars work across zones 5-11, showing broad adaptability.

## Integration Strategy

### How Data Sources Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                    FIELDER INTELLIGENCE                     │
└─────────────────────────────────────────────────────────────┘

QUESTION 1: "What CAN grow in my zone?"
├── SeedsNow: 621 cultivars × 12 zones = 6,874 zone relationships
├── Food Forest: 377 perennials × zones = 1,736 relationships
└── Answer: "These 800+ cultivars are compatible with Zone 10"

                          ↓

QUESTION 2: "WHEN do I plant/harvest in my zone?"
├── Burpee: 16 cultivars with month-by-month calendars
├── Mary's: 23 Florida-adapted cultivars with regional timing
├── UF/IFAS: Extension research for peak windows
└── Answer: "Plant tomatoes Aug-Sep, harvest Nov-Apr in Zone 10"

                          ↓

QUESTION 3: "What's the quality/heritage intent?"
├── Cornell: 50+ cultivars with user ratings
├── Mary's: 5 Florida-adapted heritage cultivars flagged
└── Answer: "Cherokee Purple: 5★ rating, true heritage"
```

### Query Example: Zone 10 Tomato Selection

**Step 1: Find compatible cultivars (SeedsNow)**
```javascript
const zone10Tomatoes = Object.values(kg.entities.seedsnowCultivars)
  .filter(c =>
    c.cropType === 'tomato' &&
    c.zones.includes('10')
  );
// Returns: 54 tomato cultivars
```

**Step 2: Get timing data (Burpee/Mary's)**
```javascript
const cherokeePurple = kg.entities.cultivars.cherokee_purple;
const zone10Timing = cherokeePurple.zoneTiming.zone10;
// Returns: { planting: "Aug-Sep", harvest: "Oct-Jun" }
```

**Step 3: Validate quality (Cornell)**
```javascript
const cornellRating = kg.entities.cornellCultivars.cherokee_purple;
// Returns: { rating: 5.0, reviews: "Excellent flavor, true heirloom" }
```

**Result:** "54 tomatoes can grow in Zone 10. Cherokee Purple is heritage-rated, plant Aug-Sep for Oct-Jun harvest."

## Use Cases

### 1. First-Time Gardener (Zone 10)

**Question:** "I'm in South Florida (Zone 10). What can I grow?"

**Answer:**
- **621 SeedsNow cultivars** compatible with Zone 10
- **324 perennial crops** compatible with Zone 10
- **Total: 945 options**

**Next Step:** Filter by season/difficulty, get timing data from Burpee/Mary's for specific crops.

### 2. Experienced Gardener (Zone 9B)

**Question:** "I want to grow heirloom tomatoes. What are my options and when do I plant?"

**Answer:**
1. SeedsNow shows 54 tomato cultivars compatible with Zone 9
2. Filter for heirlooms (Mary's has 5 Florida-adapted)
3. Get planting window from Burpee: Aug-Sep in Zone 9
4. Cornell validates Cherokee Purple as top-rated

### 3. Diversification Planning

**Question:** "I have 5 acres in Zone 10. Design a year-round production system."

**Answer:**
- **Perennials (Food Forest):** Avocado, Mango, Citrus trees (year-round structure)
- **Fall/Winter Annuals (SeedsNow + Burpee):** Tomatoes, Peppers, Lettuce (Aug-Feb planting)
- **Spring/Summer Annuals:** Melons, Squash, Beans (Feb-Jun planting)
- **Result:** Continuous harvest, diversified income streams

### 4. Seed Company Selection

**Question:** "Which seed company should I buy from for Zone 10?"

**Answer:**
| Need | Recommended Source |
|------|-------------------|
| Maximum variety | SeedsNow (621 options) |
| Florida-adapted heritage | Mary's Heirloom (23 cultivars, 5 FL-specific) |
| Zone-specific timing | Burpee (16 with calendars) |
| User-validated quality | Cornell database → cross-shop any company |

## Technical Notes

### Zone Normalization

Different sources use different zone formats:
- SeedsNow: "US Zone 10" (tags)
- USDA standard: "10a", "10b" (subzones)
- Knowledge graph: `zone:10` (entity ID)

**Normalization logic:**
```javascript
// Input: "US Zone 10" → Output: "10"
const zoneNum = tag.replace('US Zone ', '').toLowerCase();

// Link to entity
const entityId = `zone:${zoneNum}`;
```

### Confidence Scoring

| Data Type | Confidence | Reasoning |
|-----------|-----------|-----------|
| SeedsNow zone compatibility | 0.95 | Direct from seed company tags |
| Burpee timing windows | 0.90 | Zone-specific calendars |
| Mary's Florida adaptation | 0.93 | Regionally tested |
| Food Forest zone compatibility | 0.90 | USDA zone temperature ranges |

### Data Quality Flags

Each SeedsNow cultivar includes:
```javascript
{
  scientificName: null,          // 85.7% missing
  daysToMaturity: null,          // 99.5% missing
  zones: ["9", "10", "11"],      // 100% present
  heritageIntent: "commercial",  // Inferred from tags
  isOrganic: false               // 2.4% organic
}
```

**Why still valuable:** Zone compatibility + product availability + direct purchase links.

## Future Enhancements

### 1. Collect Additional Zones

SeedsNow organizes by zone - could collect:
- Zone 8 (North Florida, North Carolina)
- Zone 9 (Central Florida, Texas)
- Zone 11 (South Florida, Hawaii)

**Benefit:** Complete Florida coverage (Zones 8-11), expand to adjacent states.

### 2. Individual Product Page Scraping

**Current limitation:** 99.5% missing days-to-maturity data (only in API).

**Solution:** Scrape individual product pages for 621 cultivars.

**Trade-off:**
- Pro: Get DTM data, full descriptions, customer reviews
- Con: 621 web requests (rate limiting, time)

**Recommendation:** Do this selectively for high-priority crops (tomatoes, peppers).

### 3. Cross-Reference with Cornell

**Goal:** Validate SeedsNow cultivars against Cornell user ratings.

**Method:**
```javascript
// Find matching cultivars by name
const cornellMatch = cornellDatabase.find(c =>
  c.cultivarName === seedsnowCultivar.name
);

if (cornellMatch) {
  seedsnowCultivar.userRating = cornellMatch.rating;
  seedsnowCultivar.reviewCount = cornellMatch.reviews;
}
```

**Impact:** Add third-party quality validation to SeedsNow's catalog.

### 4. Timing Data Inference

**Hypothesis:** If we have timing data for Cherokee Purple (Zone 10), we can infer similar timing for other tomato cultivars in Zone 10.

**Method:**
```javascript
// Find timing from Burpee
const referenceTiming = burpeeTomato.zoneTiming.zone10;
// { planting: "Aug-Sep", harvest: "Oct-Jun" }

// Apply to SeedsNow tomatoes
seedsnowTomatoes.forEach(t => {
  if (!t.timing) {
    t.inferredTiming = referenceTiming;
    t.confidence = 0.75; // Lower than direct data
  }
});
```

**Caveat:** Days-to-maturity varies by cultivar, so inferred timing has uncertainty.

### 5. Add More Seed Companies

**Candidates:**
- Johnny's Seeds (temperature thresholds, needs correlation)
- Baker Creek Heirloom Seeds (heritage focus)
- High Mowing Seeds (organic, cold-hardy)
- Southern Exposure Seed Exchange (Southern/humid climates)

**Strategy:** Target companies with zone-based organization like SeedsNow.

## Files

| File | Purpose | Size |
|------|---------|------|
| `data/research/seed-company-seedsnow-zone10.json` | Raw SeedsNow data | 861 KB |
| `data/research/knowledge-graph-integrated-v3.json` | **Integrated KG** | ~5 MB |
| `scripts/integrate-seedsnow.js` | Integration script | Node.js |
| `scripts/analyze-seedsnow.js` | Analysis script | Node.js |

## Conclusion

The integration of SeedsNow's 621 cultivars provides **scale and breadth** to Fielder's knowledge graph:

**Before SeedsNow:**
- Strong timing data (Burpee, Mary's)
- Limited cultivar options (39 total)
- Deep but narrow

**After SeedsNow:**
- Maintained timing data quality (Burpee, Mary's still present)
- Massive cultivar expansion (621 new options)
- **Wide AND deep**

**The trade-off:**
- SeedsNow: Zone compatibility (CAN it grow?) - HIGH coverage
- Burpee/Mary's: Timing windows (WHEN to plant?) - HIGH quality

**Together:** Answer both "what" and "when" questions for Zone 10 gardening.

---

**Knowledge Graph Coverage:**
- **Annual vegetables:** 156 with timing + 621 with zone compatibility = 777 total
- **Perennial crops:** 377 with zone compatibility
- **Total:** 1,154 food crops across all USDA zones
