# Perennial Crops Integration

**Date:** 2025-12-20
**Knowledge Graph Version:** 2.0.0

## Summary

Successfully integrated **377 perennial food crops** into the Fielder knowledge graph, expanding from annual vegetables to include permanent tree crops, shrubs, vines, and other perennial species organized by permaculture design layers.

## Data Sources Combined

### Annual Vegetables (Existing)
- **156 entities**: Tomatoes, peppers, melons, etc.
- **Sources**: State calendars, UF/IFAS extension, Burpee Seeds, Mary's Heirloom, Cornell cultivars, LocalHarvest farms
- **Focus**: Planting/harvest timing windows by zone
- **Validation**: Four-way triangulation with confidence scoring

### Perennial Crops (New)
- **377 entities**: Trees, shrubs, vines, root crops, mushrooms
- **Source**: Food Forest Plant Options (permaculture design spreadsheet)
- **Focus**: USDA zone compatibility (which zones each plant can grow in)
- **Organization**: 9 permaculture layers

## Knowledge Graph Statistics

| Metric | Value |
|--------|-------|
| **Total Entities** | 533 |
| Annual vegetables | 156 |
| Perennial crops | 377 |
| **Florida-Suitable Perennials** | 324 |
| **Zone Compatibility Relationships** | 1,736 |
| **Permaculture Layers** | 9 |
| **Relationship Collections** | 5 |

## Permaculture Layer Breakdown

| Layer | Plant Count | Height/Type | Examples |
|-------|-------------|-------------|----------|
| **Canopy Layer** | 82 | 20+ ft tall | Avocado, Mango, Apple, Pecan |
| **Understory Layer** | 41 | 10-20 ft | Citrus, Lychee, Dwarf fruit trees |
| **Shrub Layer** | 50 | 2-10 ft | Blueberry, Fig, Blackberry |
| **Herbaceous Layer** | 62 | Non-woody | (Annual vegetables fit here) |
| **Vertical/Climber Layer** | 22 | Vines | Grape, Passion fruit, Hops |
| **Groundcover Layer** | 27 | <2 ft | Strawberry, Sweet potato |
| **Rhizosphere Layer** | 26 | Root crops | Ginger, Turmeric, Cassava |
| **Aquatic Layer** | 15 | Water plants | Taro, Watercress |
| **Fungal Layer** | 52 | Mushrooms | Shiitake, Oyster, Lion's mane |

## New Entity Types

### PerennialCrop
```typescript
{
  id: "perennial:avocado_tree",
  type: "PerennialCrop",
  commonName: "Avocado Tree",
  scientificName: "Persea americana",
  layer: "Canopy Layer",
  zones: ["9a", "9b", "10a", "10b", "11a", "11b"],
  growingGuide: "https://...",
  floridaCompatible: true,
  isTreeCrop: true
}
```

## New Relationships

### GROWS_IN_ZONE
Connects perennials to zones where they can grow:

```json
{
  "from": "perennial:avocado_tree",
  "to": "zone:10",
  "type": "GROWS_IN_ZONE",
  "details": {
    "subzone": "10a",
    "layer": "Canopy Layer",
    "confidence": 0.90
  }
}
```

**Total:** 1,736 zone compatibility relationships for Florida zones (8a-11b)

## Integration Examples

### 1. Zone 10 Year-Round Food System

**Perennial Canopy** (Year-round production):
- Avocado Tree
- Mango Tree
- Lychee Tree

**Annual Vegetables** (Seasonal rotation):
- Cherokee Purple Tomato (Aug-Sep planting, Nov-Apr harvest)
- Florida-adapted crops

**Integration Benefit:**
- Perennial trees provide shade, nitrogen fixing, soil building
- Annual vegetables rotate in understory for peak seasonal nutrition
- Regenerative system reduces inputs over time

### 2. Florida Citrus Belt (Zones 9-10)

**Perennials:** Sweet Orange, Grapefruit, Meyer Lemon
**Annuals:** Tomatoes (fall), Strawberries (winter), Peppers (spring)

**Benefit:** Maximize land use, diversify income, improve soil health, extend harvest season

### 3. Subtropical Food Forest (9-Layer Design)

```
Canopy (20+ ft):      Avocado, Mango, Macadamia
Understory (10-20):   Citrus, Lychee, Longan
Shrub (2-10 ft):      Blueberry, Fig, Blackberry
Herbaceous:           Tomatoes, Peppers (seasonal rotation)
Vertical:             Passion fruit, Grape, Chayote
Groundcover:          Strawberry, Sweet potato
Rhizosphere:          Ginger, Turmeric, Cassava
Aquatic:              Taro, Watercress (if water feature)
Fungal:               Shiitake, Oyster mushrooms
```

**Benefit:** Maximum production per sq ft, natural pest control, soil regeneration, microclimate creation

## Query Examples

### Find all tree crops for Zone 10A
```javascript
const zone10Trees = Object.values(kg.entities.perennialCrops)
  .filter(p =>
    p.zones.includes('10a') &&
    p.isTreeCrop
  );
// Returns: Avocado, Mango, Citrus, Lychee, etc.
```

### Find all Florida-suitable perennials by layer
```javascript
const floridaByLayer = Object.values(kg.entities.perennialCrops)
  .filter(p => p.floridaCompatible)
  .reduce((acc, plant) => {
    acc[plant.layer] = acc[plant.layer] || [];
    acc[plant.layer].push(plant.commonName);
    return acc;
  }, {});
```

### Complement annual vegetables with perennials
```javascript
// For a Zone 10 farm growing tomatoes in fall/winter:
const zone = '10a';
const season = 'fall';

// Get annual vegetable timing
const tomatoWindow = kg.entities.cultivars.cherokee_purple.harvestWindows[zone];
// Nov-Apr harvest

// Get complementary perennials
const perennialFruits = Object.values(kg.entities.perennialCrops)
  .filter(p =>
    p.zones.includes(zone) &&
    (p.isTreeCrop || p.isShrub)
  );
// Returns: Avocado (year-round), Citrus (winter peak), etc.
```

## Use Cases

### 1. Farm Planning
**Query:** "What perennial crops can I plant in Zone 9B that will provide year-round food alongside my seasonal vegetable rotation?"

**Answer:** Knowledge graph returns tree crops (avocado, citrus, mango), shrubs (blueberry, blackberry), and vines (passion fruit) compatible with Zone 9B, plus annual vegetable timing windows for that zone.

### 2. Crop Diversification
**Query:** "I have a citrus orchard in Zone 10A. What understory crops can I add to maximize land use?"

**Answer:**
- **Understory trees:** Smaller citrus varieties, lychee
- **Shrubs:** Blueberry, fig
- **Annuals:** Tomatoes (fall), strawberries (winter)
- **Groundcover:** Sweet potato

### 3. Regenerative Design
**Query:** "Design a 9-layer food forest for South Florida (Zone 10B) with continuous harvest."

**Answer:** Knowledge graph provides species for all 9 layers that are compatible with Zone 10B, showing how perennials provide permanent structure while annuals rotate seasonally.

### 4. Heritage Cultivar Selection
**Query:** "Which heritage cultivars work best with perennial food forest systems?"

**Answer:** Cross-reference Cornell cultivar database (user-rated heritage varieties) with zone compatibility and growing conditions under tree canopy.

## Technical Notes

### Zone Representation
- Perennial data uses uppercase zone notation: `10A`, `10B`
- Knowledge graph normalizes to lowercase: `10a`, `10b`
- Zone numbers stripped for entity linking: `zone:10`

### Confidence Scoring
- Perennial zone compatibility: **0.90** (based on USDA zone temperature ranges)
- Annual vegetable timing: **0.85-0.95** (varies by source triangulation)

### Data Completeness
| Attribute | Coverage |
|-----------|----------|
| Common name | 100% (377/377) |
| Scientific name | 100% (377/377) |
| Zone compatibility | 100% (377/377) |
| Growing guide URL | 100% (377/377) |
| Layer classification | 100% (377/377) |
| Florida compatibility | 86% (324/377) |

## Future Enhancements

### 1. Add Timing Data for Perennials
Currently, perennials only have **zone compatibility** (yes/no). Future enhancement:
- **Harvest windows** for fruit trees (e.g., "Avocado: Aug-Feb in Zone 10A")
- **Bloom dates** (for pollination planning)
- **Yield curves** (first fruit year 3, peak years 8-18)

### 2. Cross-Reference with Seed Companies
- SeedsNow has 600+ cultivars for Zone 10 with zone compatibility
- Integrate SeedsNow data to expand annual vegetable coverage
- Add cultivar-specific notes on shade tolerance (for understory planting)

### 3. Companion Planting Relationships
```json
{
  "from": "perennial:avocado_tree",
  "to": "cultivar:cherokee_purple",
  "type": "COMPLEMENTS",
  "details": {
    "benefit": "Avocado provides afternoon shade, reducing heat stress on tomatoes",
    "season": "fall_winter",
    "confidence": 0.85
  }
}
```

### 4. Integrate with BioNutrient Data
- Dan Kittredge / BioNutrient Food Association research
- Nutrient density measurements for perennial crops
- Compare soil mineralization impact on tree fruit Brix vs annual vegetable Brix

### 5. Add Rootstock Data for Tree Crops
Similar to citrus rootstock modifiers in existing KG:
```typescript
{
  rootstock: "Carrizo Citrange",
  brixModifier: +0.6,
  diseaseResistance: ["citrus_tristeza_virus"],
  soilAdaptation: ["well_drained", "slightly_acidic"]
}
```

## Files

| File | Purpose | Size |
|------|---------|------|
| `data/research/food-forest-perennials.json` | Raw perennial data | 377 plants |
| `data/research/knowledge-graph-integrated.json` | Original KG (annuals only) | 156 entities |
| `data/research/knowledge-graph-integrated-v2.json` | **Integrated KG (annuals + perennials)** | 533 entities |
| `scripts/integrate-perennials.js` | Integration script | Node.js |

## Related Documents

- `docs/INTEGRATED_KNOWLEDGE_GRAPH.md` - Investor documentation for original KG
- `data/research/seed-company-burpee-florida.json` - Burpee cultivar data
- `data/research/seed-company-marys-florida.json` - Mary's Heirloom data
- `data/research/extension-cornell-cultivars.json` - Cornell cultivar ratings
- `CLAUDE.md` - Fielder project documentation

## Conclusion

The integration of perennial crops expands Fielder's agricultural intelligence from **seasonal vegetables** (planting/harvest timing) to **permanent food systems** (zone compatibility for trees, shrubs, vines).

This enables:
- **Farm planning:** Design multi-layer food forests with annual + perennial integration
- **Crop diversification:** Identify understory crops for existing orchards
- **Regenerative agriculture:** Show how perennials improve soil over time
- **Year-round harvest:** Combine seasonal annuals with year-round perennials

**Knowledge graph now covers:** Annual vegetables (156) + Perennial crops (377) = **533 total food crops** with USDA zone compatibility and growing data.
