# Fielder

**Farm Intelligence Expected Latent Delivery Enrichment Realization**

A geo-centric, product-centric, date-aware farm-to-table discovery platform.

## The Problem

There is no source of product-centric, geo-centric farm-to-table products that are date-location aware. You can't Google "local tomatoes in season near me" and find actual farms selling them.

Meanwhile:
- Produce nutrients have declined ~50% in 50 years
- Cause: Cultivar selection based on yield + appearance (dilution effect)
- Farmers get paid for external quality, not internal quality (Brix, nutrition)
- USDA grades focus on appearance, not flavor or nutrition

## The Solution

Build the **definitive database** that predicts:
1. **What crops** can grow **where** (zone/climate)
2. **When** they hit peak quality (GDD-driven harvest windows)
3. **Who** is actually growing them (farms claim crops)

Then surface this to consumers as a shoppable data stream.

## Core Components

### Crop Possibility Engine
Maps every crop × every region × every season with predicted peak quality windows.

### SHARE Quality Framework
Analytical model for predicting internal quality (not external appearance):
- **S**oil Health - Foundation (important but typically unknown)
- **H**eritage Cultivars - Genetic ceiling for quality
- **A**gricultural Practices - Tertiary modifier
- **R**ipen - Harvest timing + transit to consumer
- **E**nrich - Measurement/verification of quality

See [SHARE.md](SHARE.md) for complete framework documentation.

### Cultivar Database
Researchable data that drives quality predictions:
- Cultivar Brix research (genetic potential)
- Rootstock effects on quality
- Bloom dates by region
- Days to maturity / GDD requirements

### Farm Network
Farms claim crops in their region → become discoverable when in season.

### Geo-Search
Consumer-facing discovery: "What's at peak quality near me?"

## Project Structure

```
fielder_project/
├── fielder/
│   ├── __init__.py
│   ├── models/
│   │   ├── crop.py              # Crop, Cultivar, Rootstock
│   │   ├── region.py            # GrowingRegion, Location
│   │   ├── harvest.py           # HarvestWindow, SeasonalAvailability
│   │   ├── weather.py           # GDD tracking
│   │   ├── farm.py              # Farm, FarmCrop
│   │   ├── quality.py           # SHARE framework models
│   │   └── cultivar_database.py # Research data
│   └── services/
│       ├── crop_engine.py       # Crop Possibility Engine
│       ├── harvest_predictor.py # GDD-based harvest prediction
│       ├── quality_predictor.py # SHARE-based quality prediction
│       └── geo_search.py        # Location-based farm discovery
├── data/                        # Cultivar research data
├── config/                      # Configuration
├── tests/                       # Tests
├── SHARE.md                     # Quality framework documentation
└── README.md
```

## Key Concepts

### GDD (Growing Degree Days)
Crops develop based on accumulated heat, not calendar days.

```
GDD = max(0, (Tmax + Tmin) / 2 - base_temp)
```

For citrus, base temp is 55°F. Cumulative GDD from bloom predicts maturity.

### Quality Tiers
- **Premium**: Heritage/heirloom varieties bred for flavor/nutrition
- **Standard**: Modern commercial, balanced
- **Commodity**: Bred for yield/shipping, lower quality ceiling

### Climacteric vs Non-Climacteric
- **Non-climacteric** (citrus, berries): MUST ripen on plant
- **Climacteric** (tomatoes, bananas): CAN ripen post-harvest (but vine-ripened is superior)

## The Promise

**To Consumers:**
- Superior flavor and nutrition
- Grown in the USA
- Supporting farmers and ranchers

**To Farmers:**
- Get paid for quality, not just quantity
- Premium pricing for premium produce

**To the Industry:**
- The data infrastructure that doesn't exist
- "Google Maps of seasonal agriculture"

## Development Status

This is the foundational skeleton. Next steps:
1. Populate cultivar database with research data
2. Add regional bloom/harvest data
3. Build API layer
4. Create consumer discovery interface
5. Onboard farm partners
