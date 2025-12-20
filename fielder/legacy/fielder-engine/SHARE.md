# SHARE: The Quality Framework

## The Problem We're Solving

**Produce nutrients have declined ~50% in 50 years.**

The cause is NOT soil depletion (a myth). The cause is **cultivar selection**:
- Farmers choose varieties based on **yield** and **appearance**
- Because that's how they get paid (USDA grades focus on external quality)
- This creates "dilution effect" - bigger, faster-growing produce with less nutrition per piece

**The USDA grades produce on external appearance:**
- Size
- Color
- Freedom from defects
- Shape conformity

**They do NOT measure what matters:**
- Brix (sugar/flavor)
- Nutrient density
- Antioxidant content
- Internal quality

## Our Solution

SHARE predicts and verifies **internal quality** - flavor and nutrition.

We want farmers to get paid for quality, not just quantity.

## The SHARE Causal Chain

```
S → H → A → R → E
Soil → Heritage → Agricultural → Ripen → Enrich
```

Each stage affects the quality ceiling and realized potential.

### S - Soil Health (Foundation)

The foundation everything builds on.

**What it determines:**
- Nutrient availability for plant uptake
- Microbial activity supporting plant health
- The baseline that all other factors build upon

**Key insight:** Good soil is necessary but not sufficient. You can't overcome bad genetics with great soil.

### H - Heritage Cultivars (Genetic Ceiling)

The cultivar + rootstock combination sets the **maximum possible** Brix, nutrition, and flavor.

**What it determines:**
- Maximum potential Brix
- Nutrient density ceiling
- Flavor profile
- For tree crops: minimum age before potential is reachable

**Key insight:** This is why modern produce is less nutritious. Cultivars selected for yield/appearance have LOWER genetic ceilings than heritage varieties selected for flavor/nutrition.

**Rootstock effects (citrus example):**
| Rootstock | Brix Modifier | Notes |
|-----------|---------------|-------|
| Carrizo/C-35 | +0.6 | High quality |
| Sour Orange | +0.5 | High quality, CTV risk |
| Trifoliate | +0.5 | High quality, smaller fruit |
| Cleopatra | +0.2 | Good, slow to bear |
| Swingle | -0.5 | Lower quality |
| Rough Lemon | -0.7 | Vigorous, dilutes quality |
| Macrophylla | -0.8 | Lowest quality |

**Tree age modifier:**
| Age | Modifier | Phase |
|-----|----------|-------|
| 0-2 yrs | -0.8 | Vegetative |
| 3-4 yrs | -0.5 | Transition |
| 5-7 yrs | -0.2 | Canopy completion |
| **8-18 yrs** | **0.0** | **Prime** |
| 19-25 yrs | -0.2 | Aging |
| >25 yrs | -0.3 | Old |

### A - Agricultural Practices (Tertiary Modifier)

Fertilizer, irrigation, pest management - the inputs and practices.

**What it determines:**
- +/- adjustment on top of genetic ceiling
- Can help or hurt realized quality
- CANNOT overcome bad S or H

**Key insight:** This is where organic/regenerative practices matter, but they're a modifier, not a foundation.

### R - Ripen (Timing = Harvest + Transit)

Harvest at peak → Rush to consumer.

**What it determines:**
- When to harvest for peak quality
- Transit time to maintain freshness
- Total time from tree/vine to table

**Key concepts:**
- **Peak window:** Middle 50% of harvest window
- **GDD (Growing Degree Days):** Heat accumulation determines maturity, not calendar days
- **Transit:** Every day after harvest degrades quality

**Crop behavior matters:**
- **Non-climacteric** (citrus, berries): MUST ripen on plant. Quality fixed at harvest.
- **Climacteric** (tomatoes, bananas): CAN ripen after harvest, but vine-ripened is ALWAYS superior.

### E - Enrich (Measurement/Proof)

The actual measurement that proves the system worked.

**What we measure:**
- **Brix:** Sugar content (flavor indicator)
- **Titratable Acid:** Acid content (balance)
- **Brix:Acid Ratio:** Sweet/tart balance (legal standard + flavor)
- **BrimA:** Brix - 4×TA (flavor index)
- **Nutrition:** Vitamins, antioxidants (lab tested)
- **Freshness:** Days since harvest

**Key insight:** E feeds back to improve S-H-A-R predictions over time.

## The Algorithm

For citrus (base temp 55°F):

```
Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod

Where:
- Cultivar_Base: Genetic ceiling (e.g., 12.0 for Washington Navel)
- Rootstock_Mod: See table above
- Age_Mod: See table above
- Timing_Mod: Penalty for picking outside peak window
```

Sugar development:
```
SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(GDD - DD50) / s))
```

Acid decline:
```
TA = TA0 × exp(-ka × GDD)
```

## The Promise

**To Consumers:**
- Superior flavor and nutrition
- Grown in the USA
- Supporting farmers and ranchers
- Know exactly where your food comes from

**To Farmers:**
- Get paid for quality, not just quantity
- Premium pricing for premium produce
- Direct connection to customers who value quality

**To the Industry:**
- The data stream that doesn't exist: product-centric, geo-centric, date-aware farm-to-table
- "What's in season near me?" with actual farms
- The infrastructure layer for local food discovery
