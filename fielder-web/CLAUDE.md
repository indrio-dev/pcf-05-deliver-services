# Fielder Project - Claude Code Instructions

## Session Continuity (CRITICAL)

**Before starting work, check for prior session context:**

```bash
ls -la ai_sessions/*.md 2>/dev/null | tail -5
```

If transcripts exist, read the most recent one(s) to restore context:
- These are auto-saved BEFORE context compaction
- They contain full conversation history, decisions, and nuanced discussions
- Fielder has complex domain knowledge that gets lost in summaries

**Key prior sessions to be aware of:**
- `ai_sessions/Fielder Claude Chat Session 12.13.25.docx` - SHARE framework deep dive, agricultural definitions, platform vision
- Legacy Python engine merged Dec 2025 from `fielder_project_python/`

---

## Project Overview

**Fielder** is an AI-powered farm-to-table intelligence platform that applies the **SHARE quality framework** to predict and verify internal food quality (flavor, nutrition) across time and geography.

### The Problem Fielder Solves

**The Nutrient Decline:**
- Produce nutrients have declined ~50% in 50 years
- Cause: Cultivar selection based on yield + appearance (dilution effect)
- USDA grades focus on external appearance, NOT nutrition or flavor
- Farmers get paid for external quality, not internal quality

**The REAL Health Crisis (What's Actually Making People Sick):**

While everyone talks about pesticides, the real reasons people are getting sick and dying are:

1. **Nutrient deficiency** - up to 50% fewer nutrients per piece of produce in 50-70 years
2. **Excessive omega-6 / seed oils** - average American diet is 15-20:1 ratio (was ~4:1 or less 100 years ago; evolutionary ~1:1)

**The root cause of nutrient decline (PRODUCE):**
```
USDA grades on APPEARANCE → Farmers plant for appearance/yield →
Breeders select for yield/shipping → DILUTION EFFECT →
50% less nutrients per piece → Population-wide deficiency
```

This is Albrecht's Chain playing out at scale: Soil deficiency → Plant deficiency → Human deficiency → Human disease

**The root cause of omega-6 crisis (FATS):**
```
Government subsidies for corn/soy (valid food security goals) →
Market distortions → Extremely cheap byproducts →
High fructose corn syrup + Vegetable oils (corn, soy, canola) →
Ubiquitous in processed foods & restaurants →
Population-wide omega-6 excess (15-20:1 vs historical 4:1, evolutionary 1:1)
```

**Key insight**: Omega-6 fatty acids ARE essential - but in tiny quantities. Historically they weren't consumed much because vegetable oils didn't exist! Once cheap subsidized ingredients became available, they became ubiquitous. No one understood the fatty acid profile was dramatically different than historical animal fats and olive oil.

**Research backing:**
- Soybean oil consumption increased >1,000-fold from 1909-1999 ([Blasbalg et al., AJCN 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3076650/))
- Western diet ratio 15:1-16.7:1 vs evolutionary 1:1 ([Simopoulos, Biomed Pharmacother 2002](https://pubmed.ncbi.nlm.nih.gov/12442909/))
- 4:1 ratio = 70% decrease in cardiovascular mortality ([Simopoulos](https://pubmed.ncbi.nlm.nih.gov/12442909/))
- Crisco (1911) was first seed oil marketed as food - vegetable oil went from 0% to 32% of American diet

**The parallel problems Fielder addresses:**
| Problem | Cause | Fielder's Answer |
|---------|-------|------------------|
| Nutrient decline | USDA appearance grading → dilution effect | SHARE framework measures INTERNAL quality |
| Omega-6 excess | Subsidized seed oils in everything | Omega ratio verification (E pillar) for meat/dairy |

**Fielder Platform Rules (Omega-6 Policy):**

This understanding drives concrete platform policies:

1. **Grain finishing/excessive grains penalized** in A pillar scoring
   - `grain_finished`: +0.05 (improves marbling but hurts omega ratio)
   - `grain_fed`: -0.1 (commodity approach, high omega-6)
   - Organic grain warning: organic certification often = grain-fed (red flag)

2. **Omega ratio verified** in E pillar measurements
   - Grass-fed claim + >6:1 ratio = inconsistency warning
   - Lab verification (Edacious, Texas A&M) catches false claims

3. **Seed/vegetable oils PROHIBITED** from Fielder farm-to-table ingredients
   - No corn oil, soybean oil, canola oil, etc.
   - Only traditional fats: butter, tallow, lard, olive oil, coconut oil
   - This is a non-negotiable platform standard

**The Fundamental Misconception (What We're Trying to Fix):**

Today's society equates **"healthy produce"** with **"absence of toxic chemicals"** instead of **"presence of primary nutrition"**. This is backwards.

- People buy organic because they believe it's "pesticide-free" (it's NOT - just synthetic-free)
- People have been told synthetic pesticides are toxic (conflating acute exposure or count-based metrics like EWG "Dirty Dozen" with actual science)
- Ames proved definitively that synthetic residues are toxicologically insignificant
- **Result**: Everyone says "eat organic/regenerative for health" - but it's NOT inherently healthier
- Organic doesn't have higher PRIMARY nutrients (Brix, minerals, vitamins)
- Organic's actual health benefits are SECONDARY nutrition (polyphenols from stress response), NOT reduction of "toxic chemicals"

**The truth no one is telling consumers:**
- A conventional apple with 14 Brix is MORE nutritious than an organic apple with 10 Brix
- The health benefit comes from WHAT'S IN the food, not what's allegedly NOT on it
- Mineralized soil + heritage genetics = highest nutrition, regardless of pesticide approach
- Grass-fed meat (3:1 omega ratio) vs feedlot (20:1) is a BIGGER health factor than any pesticide discussion

**Why omega ratios matter MORE than feed pesticides/glyphosate in meat:**
- People worry about pesticide/glyphosate bioaccumulation in meat from feed
- But pesticides/glyphosate do NOT significantly bioaccumulate - they're metabolized and excreted
- Omega fatty acids DO accumulate in tissue - the animal's fat profile directly reflects its diet
- A grass-fed steak with 3:1 omega ratio vs feedlot 20:1 is a MEASURABLE, SIGNIFICANT health difference
- Theoretical glyphosate traces are toxicologically insignificant (Ames) vs proven inflammatory impact of omega imbalance
- **Focus on what accumulates and matters: fatty acid profile, not pesticide residue fears**

**Real-World Example: Label Reading vs Applied Science**

A food influencer with 9M+ followers shopping at Costco:

| Aisle | His Recommendation | His Reasoning | The Reality |
|-------|-------------------|---------------|-------------|
| Oils | ✅ "Buy this, skip nasty seed oils" | Seed oils = bad | Actually correct (but probably for wrong reasons) |
| Meat | ✅ "Buy organic chicken" | "Non-GMO feed, no glyphosate" | Organic = fed organic GRAINS = the chicken IS a walking seed oil. Same omega-6 problem. |
| Meat | ❌ "Skip the bison" | "Doesn't say grassfed" | Bison: lean, pasture-raised, minimal grain = likely LOWEST omega-6 of all three products |

**The complete cognitive dissonance:**
- Aisle 1: "Seed oils are bad!" ✓
- Aisle 2: Recommends organic chicken that's been fed corn/soy its whole life
- The chicken IS the seed oil - just in animal form
- The grains the chicken ate (corn, soy) ARE the crops that become seed oils
- Meanwhile, rejects the bison which has the best omega profile of all three

**He got it exactly backwards - twice.**

**The problem:** He knows how to read labels. He doesn't understand agriculture as an applied science. And 9M+ people are following this advice.

**The kicker:** He's considered an expert on nutrition and food online.

This is the state of food education in America - the "experts" are label readers, not scientists. They understand marketing claims, not agricultural reality. And millions follow their advice.

This is the gap Fielder fills - moving from label claims to actual quality metrics, from marketing to science, from fear-based ("no glyphosate!") to evidence-based (omega ratios, Brix, mineralization).

**Fielder's Intellectually Honest Position on Pesticides, Herbicides & GMOs:**

We have to tell the truth - even when it's uncomfortable for both sides:

| Topic | The Fear-Based Claim | The Scientific Reality | Fielder's Position |
|-------|---------------------|----------------------|-------------------|
| **Synthetic Pesticides** | "Toxic chemicals poisoning our food" | There are MORE natural pesticides INSIDE produce than synthetic pesticides OUTSIDE. Ames: 99.99% of dietary pesticides are natural, produced by plants themselves. | Not a quality factor - separate axis from nutrition |
| **Glyphosate** | "Causes cancer, bioaccumulates in meat/people" | Doesn't bioaccumulate in animals OR people - metabolized and excreted | Not a quality differentiator |
| **GMOs** | "Frankenfoods destroying our health" | After decades of research, NOT proven harmful to human health | Avoid under PRECAUTIONARY PRINCIPLE, not proven harm |

**The "organic is healthier because fewer toxic pesticides" argument is total BS:**
- Natural pesticides INSIDE the apple > synthetic residues OUTSIDE the apple
- Plants produce their own defense chemicals at far higher concentrations
- The pesticide fear mongering ignores basic chemistry
- Organic's benefits (when they exist) are from SECONDARY nutrition (stress response), not pesticide absence

**The latest fear claim: "Glyphosate alters the shikimate pathway in gut bacteria!"**
- Probably true - glyphosate does inhibit the shikimate pathway (that's how it kills weeds)
- But so does everything else you eat
- Your gut microbiome is constantly being affected by everything you consume
- This is fear-mongering dressed up in scientific language
- It sounds scary because most people don't know what the shikimate pathway is
- Context matters: the dose, the actual impact, comparison to other dietary factors

**THE CRITICAL NUANCE: Dose and context matter both ways**

We're not saying "glyphosate is fine, eat all you want." There's a massive difference:

| Scenario | Exposure Level | Fielder's View |
|----------|---------------|----------------|
| Trace residues on whole produce | Minimal | Not a health concern (Ames) |
| Residues in pastured meat | Minimal, doesn't bioaccumulate | Not a quality differentiator |
| Dessicated GMO oats in Honey Nut Cheerios | 100x higher - glyphosate used as drying agent right before harvest | Avoid this processed garbage |

**The distinction:**
- Incidental residue on whole foods from field application = toxicologically insignificant
- Dessicated grains in processed foods = much higher exposure + seed oils + HFCS + nutrient-void

**Fielder's position:** We focus on whole foods where residue levels are trace. We're not defending industrial processed foods made from dessicated commodity crops. Those have multiple problems - glyphosate levels being just one of them alongside seed oils, added sugars, and zero nutritional value.

Nuance matters. The fear-mongers ignore context. We shouldn't either.

**Why this matters:**
- We can't fix food misinformation by spreading different misinformation
- If we claim GMOs are proven dangerous, we're no better than the label readers
- Intellectual honesty builds trust
- Our REAL arguments (nutrient density, omega ratios, dilution effect) are strong enough - we don't need fear-based claims

**Fielder's GMO position - holistic, pragmatic, realistic:**

| Context | Position | Reasoning |
|---------|----------|-----------|
| **Humans eating GMO produce** | Avoid (precautionary principle) | No proven harm, but why take the chance when heritage cultivars are superior anyway |
| **Animals eating GMO feed** | Acceptable | GMO DNA/proteins are digested by the animal - doesn't magically transfer to humans |
| **Heritage cultivars** | Preferred | Predate GMO technology, higher genetic quality potential (H pillar) |

**The nuance:**
- We don't want humans eating GMO food directly
- But requiring "non-GMO feed" for livestock is not scientifically necessary
- The animal's digestive system processes the feed - GMO traits don't bioaccumulate or transfer
- This is why "organic meat" (requires organic/non-GMO feed) isn't automatically better
- What DOES transfer and accumulate: fatty acid profile (omega ratios)

**The practical reality:**
- In a perfect world, we wouldn't have GMO feed at all
- But ~90% of feed corn/soy is now GMO - that's the agricultural reality
- Requiring non-GMO feed is nearly impossible at scale
- AND it doesn't matter for the end product (doesn't transfer)
- What we CAN control and DOES matter: grass vs grain feeding regime

**Bottom line:** Focus on what actually matters and transfers (omega ratios from feeding regime), not what sounds scary but doesn't (GMO feed "contaminating" the meat). Work with agricultural reality, not idealized scenarios.

### The Solution: Change the World

**The problem we hear constantly:** "I'm just not sure what to eat anymore."

Even educated people are paralyzed - because even when they TRY to eat healthy, they're bombarded with misleading, inaccurate advice from "experts" who read labels instead of understanding science.

**Fielder's mission:**
- SHARE predicts/verifies INTERNAL quality (what actually matters)
- Connects consumers with superior quality, grown in USA
- Farmers get paid for flavor and nutrition
- Shifts the conversation from "absence of bad" to "presence of good"
- Replaces fear-based marketing with evidence-based quality metrics
- Makes the science accessible so people KNOW what to eat

**We want to change the world** - by finally giving people clear, science-backed answers about food quality instead of label-reading theater.

### The Unifying Theory

SHARE is built on the **soil science theory from Alternative Agriculture** (Albrecht, Kempf, Kittredge, Chaboussou) - that perfectly balanced, mineralized soil produces plants that are naturally pest/disease resistant, don't attract weeds, and maximize nutrient density.

**Fielder adds the missing pieces:**

| Pillar | Source | What It Adds |
|--------|--------|--------------|
| **S** | Alternative Ag | Soil science foundation (adopted) |
| **H** | **FIELDER** | Accounts for DILUTION EFFECT - heritage genetics |
| **A** | Trophobiosis | Minimized when S is optimized |
| **R** | **FIELDER** | Accounts for PEAK HARVEST WINDOW - annual timing |
| **E** | BioNutrient | Primary + Secondary nutrition verification |

### The Fielder Thesis (Unique in the World)

**Current state of each camp:**

| Camp | Soil (S) | Genetics (H) | Practices (A) | Enrich (E) Result |
|------|----------|--------------|---------------|-------------------|
| **Organic** | Think it's great, lacks mineralization | Average | Low inputs | High SECONDARY (polyphenols), often LOW PRIMARY (Brix/minerals) |
| **Conventional** | Average + annual fertility | Average | High inputs | Can MEET/EXCEED organic in PRIMARY, lower SECONDARY |
| **Alt Ag** | BEST (mineralized) | Often average (H gap) | Optimized | High PRIMARY, varies on SECONDARY |

**Fielder's synthesis (no one else is doing this):**
```
Best S (Alternative Ag mineralized soil science)
+ Best H (Heritage cultivars - highest genetic potential)
+ Minimal A (best S + best H need fewer inputs)
+ Optimal R (proper harvest timing)
= Highest E in BOTH primary AND secondary nutrition
```

**E (Enrich) has two components:**
- **PRIMARY**: Brix, minerals, vitamins (conventional can match organic here)
- **SECONDARY**: Polyphenols, antioxidants, flavonoids (organic often higher, stress-induced)

### Why Best S Reduces A Inputs (The Science)

**Trophobiosis Theory (Francis Chaboussou):**
- Pests feed on amino acids and simple sugars in plant sap
- Healthy plants convert these into complete proteins + complex carbohydrates
- Pests CANNOT DIGEST complex molecules → "A pest starves on a healthy plant"

**Plant Health Pyramid (John Kempf / Advancing Eco Agriculture):**
| Level | Achievement | Resistance Gained |
|-------|-------------|-------------------|
| 1 | Complete Photosynthesis | Soil fungal diseases |
| 2 | Complete Protein Synthesis | Larval/sucking insects |
| 3 | Lipid Synthesis | Airborne diseases |
| 4 | Secondary Metabolites | Beetles/chewing insects |

**Weeds as Indicators:**
- Weeds are "dynamic accumulators" - draw up minerals soil is deficient in
- They perform a corrective FUNCTION (mechanical or nutritional)
- Balanced soil → weeds not needed → herbicides unnecessary

**Albrecht's Chain:**
```
Soil deficiency → Plant deficiency → Animal deficiency →
Animal disease → Human deficiency → Human disease
```

**The Insight:** Advanced soil health (mineralized, balanced) is THE foundation that:
- Reduces need for pesticides (plants naturally pest-resistant)
- Reduces need for herbicides (weeds don't thrive in balanced soil)
- Minimizes A pillar inputs
- Yet MAXIMIZES E in both primary AND secondary nutrition

**Key Sources:**
- William Albrecht (University of Missouri, ACRES USA founder influence)
- John Kempf (Advancing Eco Agriculture)
- Dan Kittredge (BioNutrient Food Association)
- Francis Chaboussou (Trophobiosis Theory)
- Bruce Ames (UC Berkeley, dietary pesticide research - why synthetic residues are toxicologically insignificant)

### Critical Nuance: Pesticides Are Not Deleterious to Nutrition

**This is counterintuitive but important:**
- Pesticides/herbicides do NOT reduce nutritional quality (Brix, minerals, vitamins)
- They are on a **separate axis** from nutrition
- The choice to use or not use them is about:
  - Consumer preference
  - Environmental concerns
  - Marketing/positioning
  - BUT NOT about the E (Enrich) pillar outcome

**The Science (Bruce Ames Research):**

> **"Dietary pesticides (99.99% all natural)"**
> Ames BN, Profet M, Gold LS. *Proc Natl Acad Sci USA*. 1990;87(19):7777-81
> https://pmc.ncbi.nlm.nih.gov/articles/PMC54831/

- **Bruce Ames** (UC Berkeley biochemist, inventor of the Ames test for mutagens)
- **Key finding**: 99.99% (by weight) of pesticides in the American diet are **natural** - produced by plants themselves as defense compounds
- Plants produce natural pesticides at FAR higher concentrations than synthetic residue levels
- Of 52 natural pesticides tested, ~half were rodent carcinogens - yet we eat them daily in common foods
- **Critical insight**: "Natural and synthetic chemicals are equally likely to be positive in animal cancer tests"
- **Conclusion**: "The comparative hazards of synthetic pesticide residues are insignificant"

**Why this matters for Fielder:**
- Organic's often-higher secondary nutrition (polyphenols) is from stress response, NOT from pesticide absence
- Conventional with good S+H can match/exceed organic in primary nutrition
- IPM practitioners often share the pragmatic, results-focused mindset of Alternative Ag
- Focus on what ACTUALLY matters for nutrition: mineralization, genetics, timing

---

## SHARE Framework

### Hierarchical + Iterative Model: S → H → A → R → E

**GENETIC CEILING (cannot be exceeded):**
| Pillar | Role | Key Insight |
|--------|------|-------------|
| **H** (Heritage) | Genetic ceiling | Cultivar + rootstock sets MAXIMUM potential |

→ Commodity H can't be overcome even with perfect S+A

**COMPENSATORY RELATIONSHIP (S ↔ A):**

S (Soil) and A (Agricultural) can **compensate** for each other to reach similar outcomes:

| Scenario | S (Soil) | A (Inputs) | Result |
|----------|----------|------------|--------|
| Annual precise fertility | Average | High | Good Brix |
| Organic soil banking | Good | Lower | Good Brix |
| Alternative Ag/mineralized | Best | Optimized | **BEST Brix** |

→ Better S = less A inputs needed
→ Lower S = more A inputs needed to compensate
→ Best S (mineralized) = best possible outcome

**TIMING AND VERIFICATION:**
| Pillar | Role | Key Insight |
|--------|------|-------------|
| **R** (Ripen) | Timing | Express or waste the S+H+A potential |
| **E** (Enrich) | Proof | Actual measurement validates/feeds back |

### Pillar Interconnectivity
- **S↔A**: Compensatory - can trade off to reach similar outcomes
- **E→S**: Lab results can inform soil management changes
- **R→E**: Timing affects what E measures

### Fertility Strategy (S↔A Trade-off)
| Strategy | Tendency | Focus |
|----------|----------|-------|
| Annual Fertility | Conventional/IPM | A pillar inputs each season (compensates for lower S) |
| Soil Banking | Organic/Regenerative | S pillar investment (needs fewer A inputs) |
| Mineralized Soil Science | Alternative Ag | Best S + optimized A (ACRES USA, Albrecht, BioNutrient) |

**Annual and soil-banking can both achieve good outcomes** - but the BEST outcome is Alternative Ag (mineralized soil science).

**The fertilityStrategy Input Model:**
```typescript
fertilityStrategy: {
  approach: 'annual_fertility' | 'soil_banking' | 'mineralized_soil_science',
  coverCropping?: boolean,         // S pillar investment
  compostApplication?: boolean,    // S pillar investment
  mineralizedSoil?: boolean,       // THE key differentiator for nutrition
}
```

**Key insight**: The `approach` shows WHERE the grower invests their resources:
- Annual fertility → Invest in A pillar inputs each season
- Soil banking → Invest in S pillar (long-term soil capital)
- Mineralized soil science → Long-term S investment + soil science + mineralization

The approach ALONE doesn't determine nutrition outcomes. **Only `mineralizedSoil: true` actually impacts nutrition.**

### Pest Management (Separate Axis)
```typescript
pestManagement: 'conventional' | 'ipm' | 'organic' | 'no_spray'
```

**Important**: Pest management is on a **SEPARATE axis** from nutrition. None of these choices negatively impact the E (Enrich) pillar:
- `conventional` → No penalty (pesticides don't reduce nutrition)
- `ipm` → Slight positive signal (pragmatic, results-focused mindset)
- `organic` → Slight positive signal (consumer preference)
- `no_spray` → Premium positioning signal

The scoring bonuses are for **mindset/approach signals**, NOT because pesticides hurt nutrition.

### Core Quality Formula
```
Peak Brix = Cultivar_Base + Rootstock_Mod + Age_Mod + Timing_Mod
```

Example: Washington Navel (base 11.5) on Carrizo (+0.6) at prime age (0.0) at peak timing (0.0) = **12.1 Brix genetic ceiling**

---

## Prediction Engine (TypeScript)

The prediction engine was ported from Python (`legacy/python_engine/`) to TypeScript in Dec 2025.

### Key Algorithms

**GDD (Growing Degree Days):**
```
GDD = max(0, (Tmax + Tmin) / 2 - base_temp)
```
- Citrus base temp: 55°F
- Stone fruit base temp: 40-45°F
- Berries base temp: 50°F

**Sugar Accumulation (Logistic/Sigmoid):**
```
SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(GDD - DD50) / s))
```

**Acid Decay (Exponential):**
```
TA = TA0 × exp(-ka × GDD)
```

**Timing Modifier (Parabolic):**
```
penalty = max_penalty × (d / h)²
```
Where d = days from peak center, h = half-width of peak window

### Age Modifiers (Tree Crops)
| Age | Modifier | Notes |
|-----|----------|-------|
| 0-2 years | -0.8 | Young, developing |
| 3-4 years | -0.5 | Coming into bearing |
| 5-7 years | -0.2 | Approaching prime |
| 8-18 years | 0.0 | **Prime production** |
| 19-25 years | -0.2 | Mature |
| 25+ years | -0.3 | Declining |

### Rootstock Brix Modifiers (Citrus)
| Rootstock | Modifier | Notes |
|-----------|----------|-------|
| Carrizo Citrange | +0.6 | High quality, most common |
| C-35 Citrange | +0.6 | Similar to Carrizo, semi-dwarf |
| Sour Orange | +0.5 | Excellent but CTV susceptible |
| Trifoliate | +0.5 | High quality, cold-hardy |
| Cleopatra | +0.2 | Neutral |
| Swingle | -0.5 | High yield, lower quality |
| Rough Lemon | -0.7 | Vigorous, dilutes SSC |
| Macrophylla | -0.8 | Lowest quality |

---

## Data Model Hierarchy

**Taxonomy** (classification for search/inference):
```
Category → Subcategory → ProductType → Variety → Cultivar → Trade Names
'fruit'  → 'citrus'    → 'Orange'    → 'Navel' → 'Cara Cara' → ...
```

**Actual Product** (what gets transacted):
```
Product = Farm + Cultivar + SHARE data + Retail attributes (cut, weight, form)
"Pasture Raised American Wagyu Ribeye 12oz from Everglades Ranch"
```

**Key insight**: For produce, ProductType ≈ Product. For meat, one Cultivar → many Products (cuts).

### Quality Tiers
| Tier | Typical Brix | Description |
|------|-------------|-------------|
| Artisan | 14-18 | Exceptional flavor, boutique cultivars |
| Premium | 12-15 | Heritage/heirloom, bred for flavor |
| Standard | 10-12 | Modern commercial, balanced |
| Commodity | 8-10 | Bred for yield/shipping |

### Heritage Intent Classification

More nuanced than simple isHeritage/isHeirloom boolean flags. Key insight: **"Heritage equals flavor and nutrition, not yield"** - but not ALL old varieties are high quality; some were bred for hardiness.

| Intent | Description | Example |
|--------|-------------|---------|
| `true_heritage` | Selected specifically for flavor/nutrition over generations | Ruby Red Grapefruit |
| `heirloom_quality` | Pre-1950 open-pollinated AND high internal quality | Washington Navel, Elberta Peach |
| `heirloom_utility` | Pre-1950 but bred for hardiness/yield (not quality-focused) | Some canning tomatoes |
| `modern_nutrient` | Modern breeding with nutrition focus | Cara Cara (lycopene), lycopene tomatoes |
| `modern_flavor` | Modern breeding with flavor focus | Honeycrisp, Sweet Charlie |
| `commercial` | Modern yield/shipping/appearance focus | Lane Late, Cosmic Crisp |

**Quality-focused cultivars** include: `true_heritage`, `heirloom_quality`, `modern_nutrient`, `modern_flavor`
**Not quality-focused**: `commercial`, `heirloom_utility`

---

## Key Files

### Prediction Engine (`src/lib/prediction/`)
| File | Purpose |
|------|---------|
| `gdd.ts` | GDD calculation, Brix prediction from GDD, harvest window prediction |
| `quality-predictor.ts` | SHARE quality orchestration, main `predictQuality()` function |
| `confidence.ts` | Uncertainty quantification, confidence levels, Monte Carlo simulation |

### Constants (`src/lib/constants/`)
| File | Purpose |
|------|---------|
| `rootstocks.ts` | 12 rootstocks with Brix modifiers, disease resistance |
| `crop-phenology.ts` | 28 crop×region entries with bloom dates, GDD requirements |
| `quality-tiers.ts` | Quality tier classification, 11 cultivar profiles |
| `gdd-targets.ts` | GDD requirements for 20+ crops |
| `products.ts` | Taxonomy: ProductType, Variety, Cultivar, SHARE types |
| `product-model.ts` | Actual Product (SKU) + Farm interfaces |
| `agricultural-definitions.ts` | 36 farm-to-table term definitions |
| `inference-chains.ts` | SHARE pillar inference logic |
| `growing-regions.ts` | ~150 US regions with typicalSoil profiles |

### Legacy Reference (`legacy/python_engine/`)
Original Python prediction engine preserved for reference:
- `fielder/models/quality.py` - SHARE framework dataclasses
- `fielder/models/crop.py` - Rootstock definitions
- `fielder/services/harvest_predictor.py` - Brix prediction
- `app.py` - CROP_PHENOLOGY with bloom dates

---

## Domain Knowledge (Don't Lose This)

### Nuanced Positions on Production Methods
- **GMO**: Non-GMO for produce/genetics, but GMO feed acceptable for livestock
- **Organic vs Conventional**: DIFFERENT MODELS, not better/worse
  - Organic: Long-term soil banking approach, lower A inputs
  - Conventional: Annual fertility approach, higher A inputs
  - **Neither inherently produces higher nutrition** - ONLY mineralization does that
- **Pesticides/herbicides**: NOT deleterious to nutrition (separate axis from E pillar)
- **IPM practitioners**: Often share the pragmatic, all-tools mindset of Alternative Ag
- **70% of conventional farms use IPM** - don't assume conventional = irresponsible

### Livestock Quality (The Fielder View)
- **Organic meat**: Often signals GRAIN-fed (red flag for quality) - organic certification doesn't require grass
- **Grass-fed vs Grass-finished**: Critical distinction - finishing affects final fatty acid profile
- **Full maturity**: 24mo beef (vs 14-18 commodity), 10-12mo pork (vs 5mo)
- **Omega-6:Omega-3 ratio**: THE measurable proof of feeding regime quality

| Ratio | Classification | What It Means |
|-------|---------------|---------------|
| ≤3:1 | Exceptional | True grass-fed, anti-inflammatory profile |
| 3-6:1 | Premium | Good grass-finished |
| 6-12:1 | Standard | Mixed feeding regime |
| >12:1 | Commodity | Feedlot/grain-fed, pro-inflammatory |

**Lab verification** (e.g., Edacious, Texas A&M): If claimed grass-fed has >6:1 ratio, something's wrong with the claim.

### Climacteric vs Non-Climacteric
- **Climacteric** (apples, peaches, bananas): CAN ripen post-harvest, but early harvest sacrifices quality
- **Non-climacteric** (citrus, berries, cherries): MUST ripen on plant, quality fixed at harvest

### Inference Chains
- PLU prefix 9 → Organic → Non-GMO
- Trade name → Cultivar → Known attributes (SUMO → Shiranui → non-GMO)
- Packinghouse → Region → typicalSoil (FL Ridge vs Flatwoods)
- Organic + Meat → Check feeding regime (often grain-fed)
- Omega ratio → Validates/contradicts feeding regime claims

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Prediction Engine**: GDD-based harvest forecasting (TypeScript)

---

## Fielder Business Model & Vision

### The One-Liner

**Fielder is the S&P Global of food quality - we prove what labels only promise.**

### Corporate Structure

```
FIELDER (Tech/Data Company)
├── Alex Brown: 90%
├── Indrio Fields: 10% (earned via convertible note for shared services)
└── Separate legal entity, tech valuation (15-25x revenue)

INDRIO FIELDS (Operations)
├── Provides shared services to Fielder:
│   ├── Shipping accounts at scale (1M+ packages/year)
│   ├── Ordoro drop shipping software
│   ├── Fulfillment infrastructure (FL East, FL West, TX, CA)
│   ├── Operating capital
│   └── Employee time on Fielder projects
├── Services accrue as note payable to Indrio
├── Note converts to 10% equity at agreed valuation
└── Internal optics: Fielder is "just another Indrio brand"
```

**Why Separate Entities:**
- Fielder gets tech company valuation (15-25x) not food company (2-4x)
- Clean separation for different investors, cap tables, exits
- Indrio gets upside from equity stake
- Fielder can serve other customers beyond Indrio

### Revenue Model

**Fielder is a marketplace, not a certification body.**

| Revenue Stream | Mechanism |
|----------------|-----------|
| **App subscriptions** | Free tier → $9.99/month premium (paywall nutrient data) |
| **Marketplace commission** | 8-10% on farm-to-consumer transactions |
| **Shipping margin** | $1.50-2/order via Indrio's scale accounts |
| **Data/API licensing** | Enterprise, retailers (future) |

**Quality enforcement:** Being on the platform IS the verification. Bad farms get exposed by measurement data and removed. Self-policing through the data layer.

### Market Validation

| Proof Point | Numbers | What It Proves |
|-------------|---------|----------------|
| **Yuka** | 76M users, $20M revenue, <$1M raised | Massive demand for food scanning apps |
| **Seed Oil Scout** | 1M users, $25/year | People pay for ingredient transparency |
| **Angel Acres / Nourish Food Club** | Waitlist, 74% less omega-6 than Vital Farms | Verified quality commands premium pricing |
| **ButcherBox** | $600M revenue, no VC | Subscription + quality story + asset-light scales |
| **Vital Farms testing** | 23.5% omega-6 (worse than canola oil) | Premium labels are meaningless without verification |

### The Verification Gap

**The problem no one else solves:**
- USDA Organic = process audit (paperwork), not nutrition verification
- "Pasture-raised" = marketing claim, no outcome measurement
- "Grass-fed" = often grain-finished, no verification
- Government regulates safety/sanitation, NOT nutritional quality

**No S&P Global for food. No Experian for nutrition. Fielder fills this gap.**

### Competitive Moat

| Asset | Why It's Defensible |
|-------|---------------------|
| **Data moat** | Prediction→measurement pairs can't be synthesized by AI |
| **Indrio infrastructure** | 1M packages/year, decades of logistics expertise |
| **First-mover on verification** | No one else measures outcomes at scale |
| **SHARE framework** | Research-backed, proprietary methodology |
| **Dan Kittredge / BFA relationship** | Direct connection to nutrient density movement leader |
| **Content engine** | "Same Label, Different Nutrition" - legal, viral, devastating |

---

## Dan Kittredge & BioNutrient Food Association

### The Relationship

Alex Brown has a direct personal relationship with Dan Kittredge, founder of the BioNutrient Food Association (BFA). They have had video calls discussing:
- The nutrient density movement's "moment" under new administration
- RFK Jr. and USDA policy changes
- Partnership opportunities between Fielder and BFA

**Library reference:** `2025-11-18_bionutrient-food-association-leadership-insights.md`

### What BFA Has Proven

The BioNutrient Food Association validates Fielder's core thesis:

| BFA Achievement | Fielder Implication |
|-----------------|---------------------|
| **Bionutrient Meter** | Proves handheld nutrient measurement technology works |
| **Nutrient density research** | Scientific backing for quality variation in produce |
| **Farmer education programs** | Community of farmers focused on quality, not just yield |
| **Policy advocacy** | Movement gaining mainstream traction |

### Technology Validation

BFA and academic research have proven these measurement technologies work:

| Method | What It Measures | Form Factor |
|--------|------------------|-------------|
| NIR Spectroscopy | Protein, moisture, vitamins | Lab or portable |
| Raman Spectroscopy | Carotenoids, lycopene, beta-carotene | Lab |
| Colorimetry | Carotenoids, anthocyanins, chlorophyll | Portable |
| Portable NIR devices | On-site nutrient estimation | Handheld |
| **Refractometer** | **Brix (sugar/dissolved solids)** | **$10-30 handheld** |

**Key insight:** The Flavor App builds on proven technology (BFA's meter, spectroscopy research) with a consumer-friendly interface.

---

## Flavor App Architecture

### Overview

The Flavor App is the consumer-facing product that starts the data flywheel. It combines:
1. **Computer vision** Brix prediction from appearance
2. **PLU code scanning** for product identification
3. **$10 refractometer** for actual measurement (sold by Fielder)
4. **Crowdsourced data** feeding prediction models

### User Experience Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONSUMER EXPERIENCE                         │
│                                                                 │
│   1. Download free Flavor App                                  │
│                                                                 │
│   2. AT STORE: Scan PLU code                                   │
│      → App identifies: Meyer Lemon, Organic, Central Valley CA │
│      → App predicts: "Estimated Brix 9.5"                      │
│      → App shows: SHARE breakdown from inference chain         │
│                                                                 │
│   3. Buy $10 refractometer from Fielder                        │
│                                                                 │
│   4. AT HOME: Squeeze drop, look through refractometer         │
│      → Read: 9.2 Brix                                          │
│                                                                 │
│   5. Enter reading in app (or photo capture reads it)          │
│      → App records: Product + Origin + Date + Location + Brix  │
│      → Prediction vs Actual captured = moat deepens            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Collection Layers

```
         EDACIOUS LAB TESTS          ← Gold standard, premium tier
                  ↑
        CONSUMER (Flavor App)        ← Scale, scans + refractometer readings
                  ↑
           FARM-PROVIDED             ← Practices, cultivars, measurements
                  ↑
             INFERENCE               ← AI predictions, GDD models
```

Every prediction→measurement pair = unreplicable IP. The moat deepens with every data point.

### What One PLU Scan Captures (SHARE from Inference)

| SHARE Pillar | Data Source | Example |
|--------------|-------------|---------|
| **S** (Soil) | Packinghouse code → Region → typicalSoil | "Florida Ridge" |
| **H** (Heritage) | PLU → Variety → Cultivar attributes | "Meyer Lemon" |
| **A** (Agricultural) | PLU prefix 9 → Organic | "Organic practices" |
| **R** (Ripen) | Scan date + region + season | "In-season, peak window" |
| **E** (Enrich) | CV estimate + refractometer actual | "Est 9.5, Actual 9.2" |

**That's all 5 SHARE pillars from one scan + measurement.**

### Data Point Structure

```typescript
interface FlavorAppScan {
  // PRODUCT
  productType: string              // 'citrus_meyer_lemon'
  variety?: string                 // 'Meyer'
  cultivar?: string                // If identifiable
  isOrganic: boolean               // From PLU prefix

  // ORIGIN (what we can infer)
  originRegion?: string            // 'california_central_valley'
  originPackinghouse?: string      // From sticker if available
  originFarm?: string              // If known (Fielder purchase)

  // DESTINATION
  storeChain?: string              // 'Whole Foods'
  storeLocation: {
    lat: number
    lon: number
    city: string
    state: string
  }

  // TIME
  scanDate: Date                   // When scanned
  season: string                   // 'peak' | 'early' | 'late'

  // QUALITY
  brixEstimated?: number           // CV prediction
  brixActual?: number              // Refractometer reading
  photoUrl?: string                // Photo of refractometer

  // META
  userId: string                   // Anonymous or logged in
  deviceId: string                 // For deduplication
}
```

### Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 scans/month, basic quality score ("Good/Average/Poor"), blurred nutrient details |
| **Premium** | $9.99/month | Unlimited scans, full nutrient breakdown, omega ratios, Brix data, history, comparisons, alerts |
| **Edacious** | TBD | Full lab panels on demand, verified products for marketplace listing |

### Revenue Math

| Metric | Year 1 | Year 3 | Year 5 |
|--------|--------|--------|--------|
| Downloads | 100K | 2M | 10M |
| Paid subscribers | 10K | 300K | 1M |
| ARPU | $80/year | $80/year | $80/year |
| **App Revenue** | **$800K** | **$24M** | **$80M** |

Add marketplace commission + shipping margin on top.

### The Network Effect

```
More users scanning
         ↓
More location/product data
         ↓
Better predictions
         ↓
Higher consumer trust
         ↓
More users scanning
         ↓
(flywheel accelerates)
```

### Competitive Intelligence Play

**"Same Label, Different Nutrition"**

Buy competitor products (Vital Farms eggs, "grass-fed" beef, etc.), test them, publish results.

- Legal: Publishing lab results is protected
- Viral: Exposing false claims is compelling content
- Devastating: They can't do anything about accurate data
- Moat-building: Every test adds to the database

### Brand Research Framework

**Curated brand database - not dynamic AI scraping.**

Instead of real-time AI agents scraping websites, Fielder builds a curated database:
1. Identify D2C brands, retail brands, grocery brands systematically
2. Research each one: website claims, what they say, what they DON'T say
3. Score against SHARE Profiles based on claim presence/absence
4. Database is populated BEFORE users scan → instant results

This is a competitive intelligence project, not an engineering problem.

### Claim Inference Model - Beef

**Core Principle: Feedlot = CAFO (interchangeable terms)**

**The Binary Rule - Default is CAFO:**

```
CAFO EXCLUSION CLAIMS (any of these = No CAFO):
├── "No feedlot"
├── "No CAFO"
├── "Never confined"
├── "100% grass-fed"
└── "Grass-fed + grass-finished"

EVERYTHING ELSE = ASSUME CAFO
```

**Feedlot Duration Determines Omega Damage:**

| Category | Breeds | Feedlot Duration | Age at Harvest | Omega Ratio |
|----------|--------|------------------|----------------|-------------|
| True Grass | Any | 0 | Varies | 2-3:1 |
| True Pasture | Any | 0 | Varies | 4-6:1 |
| Marketing Grass | Any | 3-4 months (finishing) | 18-24 mo | 8-15:1 |
| Marketing Pasture | Any | 3-6 months | 18-24 mo | 12-18:1 |
| Commodity | Commercial | 6-8 months | 14-18 mo | 15-20:1 |
| "Natural" | Commercial | 6-8 months (same as commodity) | 14-18 mo | 15-20:1 |
| Premium Wagyu | Wagyu crosses | **12+ months** | 24-30+ mo | **20-26:1** |

**SHARE Profiles for Beef:**

| Profile | Required Claims | CAFO? | Omega | Tier |
|---------|-----------------|-------|-------|------|
| **A: True Grass** | "100% grass-fed" OR "grass-fed + grass-finished" | No | 2-3:1 | Premium |
| **B: True Pasture** | "Pasture-raised" + "no feedlot/CAFO" | No | 4-6:1 | Premium |
| **C: Marketing Grass** | "Grass-fed" only (no finishing claim) | Yes | 8-15:1 | Standard |
| **D: Marketing Pasture** | "Pasture-raised" only (no CAFO exclusion) | Yes | 12-18:1 | Standard |
| **E: Commodity** | Generic or no process claims | Yes | 15-20:1 | Commodity |
| **E2: "Natural"** | Commodity + one marketing claim | Yes | 15-20:1 | Commodity |
| **F: Premium CAFO** | Breed/grade only (Wagyu, Prime), no process | Yes | 20-26:1 | **Worst** |

**The "Natural" Marketing Play:**

"Natural" = Commodity beef + one checkbox differentiator. Same feedlot duration, same omega profile.

| "Natural" Claim | What It Means | What It DOESN'T Change |
|-----------------|---------------|------------------------|
| "No antibiotics" | No antibiotics administered | Still CAFO, same omega |
| "No added hormones" | No growth hormones | Still CAFO, same omega |
| "No mRNA vaccines" | Vaccine-free | Still CAFO, same omega |
| "Vegetarian fed" | No animal byproducts in feed | Still grain-fed in CAFO |

**The Silence Signals:**

| If They DON'T Say... | Assume... |
|----------------------|-----------|
| "Grass-finished" or "100%" | Grain-finished in CAFO |
| "No feedlot" / "No CAFO" | CAFO finishing |
| Any process claim at all | Extended CAFO (hiding it intentionally) |

**The Price vs Health Inversion:**

| By Price (Consumer Thinks) | By Health (Omega Reality) |
|---------------------------|---------------------------|
| 1. Premium Wagyu ($$$$$) | 1. 100% Grass-fed (2-3:1) |
| 2. "Grass-fed" ($$$$) | 2. True Pasture-raised (4-6:1) |
| 3. "Pasture-raised" ($$$) | 3. Marketing "Grass-fed" (8-15:1) |
| 4. "Natural" ($$) | 4. Marketing "Pasture-raised" (12-18:1) |
| 5. Commodity ($) | 5. Commodity (15-20:1) |
| — | 6. **Premium Wagyu (20-26:1)** |

**Key Insight:** The most expensive beef (Premium Wagyu) has the worst omega profile because extended CAFO time (12+ months) maximizes omega-6 accumulation. Consumers pay 5x more for beef that's actively worse for them.

**Everglades Ranch Example:**

| Attribute | Everglades Ranch | Snake River Farms |
|-----------|------------------|-------------------|
| Breed | American Wagyu | American Wagyu |
| Marketing | "Pasture-raised" | "American Wagyu" |
| Process claim | "No feedlot" | None (silence) |
| Reality | On pasture, free-choice grain | 12+ months CAFO |
| Omega ratio | ~4-6:1 | ~26:1 |
| SHARE Profile | B: True Pasture | F: Premium CAFO |

Everglades Ranch uses the MORE honest label ("pasture-raised" vs "grass-fed") but produces HEALTHIER beef because no CAFO.

**Inference Engine Logic:**

```typescript
function inferBeefProfile(claims: string[]): SHAREProfile {
  // Check for CAFO exclusion claims
  const noCAFO = claims.some(c =>
    c.includes("100% grass") ||
    c.includes("grass-finished") ||
    c.includes("no feedlot") ||
    c.includes("no cafo") ||
    c.includes("never confined")
  )

  if (noCAFO) {
    if (claims.includes("100% grass-fed") || claims.includes("grass-finished")) {
      return Profile.A_TRUE_GRASS  // Omega 2-3:1
    }
    return Profile.B_TRUE_PASTURE  // Omega 4-6:1
  }

  // CAFO assumed from here down

  if (claims.includes("grass-fed")) {
    return Profile.C_MARKETING_GRASS  // Omega 8-15:1
  }

  if (claims.includes("pasture-raised")) {
    return Profile.D_MARKETING_PASTURE  // Omega 12-18:1
  }

  // Breed/grade only with no process = extended CAFO
  if (claims.some(c => c.includes("wagyu") || c.includes("prime")) &&
      !hasProcessClaim(claims)) {
    return Profile.F_PREMIUM_CAFO  // Omega 20-26:1 (WORST)
  }

  // Check for "Natural" (commodity + one claim)
  if (claims.some(c =>
    c.includes("no antibiotics") ||
    c.includes("no hormones") ||
    c.includes("natural"))) {
    return Profile.E2_NATURAL  // Omega 15-20:1 (same as commodity)
  }

  return Profile.E_COMMODITY  // Omega 15-20:1
}
```

---

### Brand Analysis Data Structure

When researching a brand to add to the database:

```typescript
interface BrandAnalysis {
  brandName: string
  productLine: string
  websiteUrl: string
  category: 'beef' | 'pork' | 'chicken' | 'eggs' | 'dairy' | 'produce'

  // Claims found on website/packaging
  claimsExplicit: string[]       // "Pasture-raised", "No antibiotics"
  claimsMissing: string[]        // "No CAFO exclusion", "No finishing claim"

  // SHARE Profile assignment
  shareProfile: string           // "B_TRUE_PASTURE", "F_PREMIUM_CAFO", etc.
  inferredOmega: string          // "4-6:1", "20-26:1", etc.

  // Red flags detected
  redFlags: string[]             // "Says 'grass-fed' but no finishing claim"

  // Overall assessment
  tier: 'premium' | 'standard' | 'commodity' | 'worst'
  suggestLabTest: boolean        // Flag for Edacious verification

  // Research metadata
  researchedDate: Date
  researchedBy: string
  sources: string[]              // URLs reviewed
}
```

**Key Insight:** Most brands say just enough to market themselves, but not enough to verify quality. The GAPS in their claims are often more telling than the claims themselves.

---

## SHARE Framework Updates

### Rootstock Belongs Under Heritage (H)

Rootstock is a **genetic decision**, not an agricultural practice:

| Aspect | Rootstock | Agricultural Practices |
|--------|-----------|------------------------|
| When decided | One-time at planting | Ongoing each season |
| What it affects | Genetic ceiling (Brix potential) | Growing conditions |
| Can it change? | No (permanent) | Yes (adjusted annually) |
| Examples | Carrizo (+0.6), Rough Lemon (-0.7) | Irrigation, fertilization |

**Updated formula:**
```
Peak Brix = Cultivar_Base + Rootstock_Modifier + Age_Modifier + Timing_Modifier
            └──────────── Heritage (H) ─────────────┘
```

### E (Enrich) Simplified

**Two buckets:**

| Maximize the Good | Minimize the Bad |
|-------------------|------------------|
| Brix / sugar quality | Glyphosate residues |
| Vitamins & minerals | Excess omega-6 |
| Omega-3 fatty acids | High PUFA content |
| Polyphenols & antioxidants | Pesticide residues |
| Phytonutrients | Heavy metals |

**The whole point of Fielder in one line:**

**Maximize the good. Minimize the bad. Prove it with data.**

---

## Research Sources

The prediction engine is backed by peer-reviewed research:

| Source | Data |
|--------|------|
| UF/IFAS | Florida citrus bloom dates, GDD models, rootstock trials |
| UC Davis | California fruit production guides, citrus research |
| MSU/JASHS Zavalloni et al. 2006 | Tart cherry GDD model (R²=0.971) |
| Texas A&M | Rio Grande Valley citrus, pecan research |
| WSU Extension | Washington stone fruit, apples |
| UGA Extension | Georgia peach production |

---

## Using the Prediction Engine

### Basic Produce Prediction
```typescript
import { predictQuality } from '@/lib/prediction/quality-predictor'

const result = predictQuality({
  cultivarId: 'washington_navel',
  regionId: 'indian_river_fl',
  rootstockId: 'carrizo',
  treeAgeYears: 12,
  practices: {
    // Fertility strategy shows S↔A interconnectivity
    fertilityStrategy: {
      approach: 'mineralized_soil_science',  // or 'annual_fertility' | 'soil_banking'
      coverCropping: true,
      compostApplication: true,
      mineralizedSoil: true,  // THE key differentiator for nutrition
    },
    // Pest management is a SEPARATE axis (not deleterious to nutrition)
    pestManagement: 'ipm',  // or 'conventional' | 'organic' | 'no_spray'
    cropLoadManaged: true,
  },
})

console.log(result.predictedBrix)         // 12.1
console.log(result.predictedTier)         // 'premium'
console.log(result.confidence)            // 0.85
console.log(result.harvestWindowStart)    // Date
console.log(result.daysToPeak)            // 45
console.log(result.agricultural.insights) // Educational notes about SHARE interconnectivity
```

### Livestock Prediction (Omega Ratio Focus)
```typescript
import { predictQuality, classifyOmegaRatio } from '@/lib/prediction/quality-predictor'

const beefResult = predictQuality({
  cultivarId: 'american_wagyu',
  regionId: 'texas_hill_country',
  practices: {
    feedingRegime: {
      diet: 'grass_only',  // 'grass_only' | 'pasture_forage' | 'grain_finished' | 'grain_fed'
      isOrganicGrain: false,  // Warning flag - organic meat often = grain-fed
    },
    animalWelfare: 'pasture_raised',
    noAntibiotics: true,
    noHormones: true,
  },
  measurements: {
    omega6To3Ratio: 3.2,  // THE quality differentiator: grass-fed ~3:1, feedlot ~20:1
    labVerified: true,
    labName: 'Edacious',
  },
})

// Omega ratio classification
const omegaClass = classifyOmegaRatio(3.2)
// { tier: 'exceptional', description: 'Optimal grass-fed ratio (≤3:1)', ... }
```

---

*This file is read automatically by Claude Code at session start. Update it when making significant architectural decisions.*

*Last updated: December 14, 2025 - Added Fielder business model, corporate structure (Fielder/Indrio 90/10), Flavor App architecture with AI agent brand scoring system, Dan Kittredge/BFA relationship, market validation (Yuka, Seed Oil Scout, Angel Acres), SHARE framework updates (rootstock under H, Enrich = maximize good/minimize bad)*
