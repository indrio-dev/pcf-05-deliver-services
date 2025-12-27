# Fielder - Next Priorities

**Current Status:** Foundation complete, validation functional, measurement collection in progress

---

## Completed This Session

✅ **Complete taxonomy** - 9 categories, 135 varieties, 736 cultivars
✅ **Commercial coverage** - 80-100% on 6 major products
✅ **Ark of Taste** - 28 heritage preservation items
✅ **Market tier classification** - All cultivars organized (mass market → rare)
✅ **University measurements** - 82 complete measurements (Location + Time + Brix)
✅ **SHARE validation** - All 5 pillars validated, MAE 1.42°Bx
✅ **Modifiers implemented** - Timing, late-season citrus, growing method

---

## In Progress

🔄 **Measurement data expansion** - 3 research agents active:
   - Peach variety trials (UGA, MSU, Clemson, Rutgers)
   - Blueberry variety trials (UF/IFAS, USDA, MSU, WSU)
   - Grapefruit variety trials (Texas A&M, UF/IFAS, UC Riverside)

**When agents complete:**
1. Review collected data for complete Location + Time + Brix
2. Load to Neo4j using load-expanded-measurements.ts
3. Re-run validation with larger dataset
4. Check if accuracy improves with more data

---

## Priority 1: Complete Measurement Collection (1-2 weeks)

### Critical Geographic Gaps

**Florida Data (HIGHEST PRIORITY):**
- ❌ 70% of US citrus, ZERO measurements
- ❌ 10% of US strawberries, limited data
- **Action:** Contact UF/IFAS CREC directly
  - Request Valencia, Hamlin, Washington Navel FL trials
  - Request Florida strawberry variety data (Florida Beauty, Strawberry Festival, Florida Radiance)
  - These are commercial varieties, data should exist

**Washington Apple Data:**
- ❌ 65% of US fresh apples, only have Cosmic Crisp
- **Action:** Contact WSU Tree Fruit Extension
  - Request Gala, Honeycrisp, Fuji variety comparison trials
  - WA data critical for apple validation

**Texas Grapefruit:**
- ❌ Dominant red grapefruit producer, no variety data yet
- **Action:** Texas A&M Citrus Center (agent researching now)
  - Rio Star, Rio Red, Flame, Ruby Red trials

### Product Expansion

**High value, likely data available:**
1. ✅ Peaches - UGA/MSU/Clemson (agent researching)
2. ✅ Blueberries - UF/IFAS/USDA (agent researching)
3. ✅ Grapefruits - Texas A&M (agent researching)
4. ⏳ Cherries - WSU Tree Fruit Extension
5. ⏳ Raspberries - WSU trials
6. ⏳ Tomatoes - Limited commercial trial data (home garden focus)
7. ⏳ Potatoes - Idaho, USDA trials

**Goal:** 150-200 university measurements across 10+ products

---

## Priority 2: Model Refinement (After More Data)

### Accuracy Targets (Realistic Given Natural Variation)

**Natural biological variability:** ±1-2°Bx for same fruit, same farm, same date

**Realistic targets:**
- 🎯 Primary: MAE ≤1.2°Bx
- 🎯 Secondary: 70%+ within ±1.0°Bx
- 🎯 Tertiary: 90%+ within ±2.0°Bx

**Current:** MAE 1.42°Bx, 45% within ±1.0°Bx, 73% within ±2.0°Bx

### Tuning Adjustments Identified

**From error pattern analysis:**
1. Increase late-season citrus bonus: +3.0 → +4.5°Bx (Powell still under-predicted)
2. Adjust Powell Navel brixBase: 11.8 → 13.0°Bx (late-season variety)
3. Add regional terroir modifiers:
   - Best MI counties: +0.3-0.5°Bx (Berrien County)
   - Best CA regions: +0.3-0.5°Bx (Riverside vs Coachella)
4. Refine timing detection (early vs peak vs late harvest)

**Expected improvement:** MAE 1.42 → 1.0-1.2°Bx

---

## Priority 3: Florida Data Campaign (Critical)

**Why critical:**
- Florida = 70% of US citrus production
- Florida = Major strawberry producer
- Florida = Unique terroir (different from California)
- Validates S pillar (geographic/soil effects)

### Contacts Needed

**UF/IFAS CREC (Citrus Research & Education Center):**
- Dr. [Citrus researcher] - Valencia, Hamlin rootstock trials
- Request published variety trial data
- Indian River vs Ridge vs Flatwoods regional data

**UF/IFAS Strawberry Breeding:**
- Dr. [Strawberry breeder] - Florida Beauty, Strawberry Festival, Florida Radiance trials
- Commercial variety evaluation data

### Expected Data

If successful contact with UF/IFAS:
- +30-50 citrus measurements (Valencia, Hamlin, FL Navels)
- +20-30 strawberry measurements (FL varieties)
- Geographic validation (FL vs CA terroir)
- **Would dramatically improve validation dataset**

---

## Priority 4: Flavor App Integration (After Validation)

**Once model is validated (MAE ≤1.2°Bx):**

1. **Computer vision integration:**
   - Train CV model to estimate Brix from appearance
   - Use validated SHARE model as ground truth
   - Combine CV estimate + SHARE prediction

2. **PLU code scanning:**
   - Map PLU codes to cultivars
   - Infer SHARE parameters from PLU metadata
   - Provide instant quality estimate

3. **Refractometer data collection:**
   - Users measure actual Brix ($10 refractometer)
   - Prediction→Measurement pairs = deepens moat
   - Unreplicable data asset

4. **Crowdsourced validation:**
   - Users scan, predict, measure, submit
   - Continuously improve model
   - Geographic coverage expands organically

---

## Priority 5: Heritage Expansion (After Commercial Validated)

**Once commercial model proven:**

1. **Expand Ark of Taste:** 28 → 100-150 items
   - Systematic addition from Slow Food USA list (300+ items)
   - Heritage beans, squash, grains, livestock
   - Regional specialties

2. **Permaculture foods:**
   - Perennial vegetables (asparagus, rhubarb, Jerusalem artichoke)
   - Unusual fruits (pawpaw, persimmon varieties, hardy kiwi)
   - Forest garden species

3. **Collect heritage measurements:**
   - Partner with heritage farms
   - Edacious lab tests for heirlooms
   - Build heritage quality database

---

## Priority 6: Livestock Omega Validation

**For meat/dairy SHARE validation:**

1. **Partner with Edacious Labs:**
   - Test grass-fed vs grain-fed samples
   - Validate omega ratio predictions
   - Build omega database by breed + feeding regime

2. **Partner with heritage ranchers:**
   - Everglades Ranch (American Wagyu pasture-raised)
   - Heritage breed farms (Galloway, Highland, etc.)
   - Collect feeding regime + lab test data

3. **Validate omega predictions:**
   - Feed regime (A pillar) → Omega ratio (E pillar)
   - Breed modifier (H pillar) small effect
   - Duration (R pillar) penalty for extended grain

---

## Immediate Next Steps (This Week)

**When research agents complete:**
1. Review peach/blueberry/grapefruit data collected
2. Validate Location + Time + Brix completeness
3. Load to Neo4j
4. Re-run validation with expanded dataset (82 → 120-150 measurements)
5. Check accuracy improvement

**University contacts:**
1. Draft email to UF/IFAS CREC requesting FL citrus data
2. Draft email to UF/IFAS strawberry breeding
3. Draft email to WSU requesting WA apple variety data

**Model tuning:**
1. Adjust late-citrus bonus based on Powell/Lane Late errors
2. Consider regional modifiers if geographic patterns clear
3. Re-validate and document improvements

---

## Long-Term Vision

**3-6 months:**
- 200-300 university measurements (robust validation)
- MAE ≤1.2°Bx achieved
- Florida geographic data integrated
- Commercial model production-ready

**6-12 months:**
- Flavor App beta launch
- Crowdsourced measurement collection begins
- Heritage varieties expanded (100-200 Ark of Taste items)
- Livestock omega database started

**12+ months:**
- 1000+ measurements (university + crowdsourced)
- Full SHARE framework validated across all categories
- Geographic coverage nationwide
- Heritage depth mission-complete

---

**Current session complete. Ready to continue measurement expansion or move to different priority.**
