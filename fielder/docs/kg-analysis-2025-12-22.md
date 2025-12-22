# Knowledge Graph Analysis - December 22, 2025

## Overview

After tonight's data integration, the Fielder Knowledge Graph contains **21,342 entities** including **15,038 growers** across all 50 US states.

---

## Key Pattern Discoveries

### 1. Geographic Distribution - Balanced Nationwide ✅

**No concentration risk** - Top states represent only 3-6% each:

| State | Growers | % of Total | Notes |
|-------|---------|------------|-------|
| NY | 838 | 6% | Finger Lakes, Hudson Valley |
| CA | 804 | 5% | Central Valley, wine country |
| MI | 737 | 5% | Cherry belt, lake effect fruit |
| FL | 714 | 5% | Citrus, tropical fruit |
| NC | 670 | 4% | Diverse agriculture |
| PA | 623 | 4% | Apples, specialty |
| WI | 542 | 4% | Dairy, fruit |

**Insight:** Comprehensive US coverage enables nationwide predictions. Not dependent on single regions.

---

### 2. Product Coverage - Sparse but Patterned 📊

**Current state:**
- **677 growers with products (5%)**
- **14,360 growers need research (95%)**

**Top products where data exists:**
- Plum: 477 growers
- Cherry: 449 growers
- Pear: 387 growers
- Apple: 254 growers

**Why these products dominate:** CSA directory has product field; on-farm markets don't. CSAs tend to grow stone fruit, pome fruit, berries.

**Critical insight:** The 95% gap is **not a data quality issue** - it's a schema difference between USDA directories. Products exist (farms grow things) but aren't captured in the dataset.

**Implication:** Inference model will be essential. Can't rely on explicit product data for all entities.

---

### 3. Multi-Role Prevalence - Farm→Consumer Direct ✅

**15,012 of 15,038 growers (99.9%) are ALSO retailers**

Breakdown:
- Grower + Retailer: 15,012 (CSA, farm stand, agritourism)
- Grower + Packinghouse: 21 (vertically integrated)
- Grower + Retailer + Packinghouse: 3 (full vertical)

**What this means:**
- Most farms sell directly to consumers (no intermediaries)
- Aligns with Fielder's transparency model (farm → consumer)
- High-value for marketplace (direct relationships)
- Quality control (grower manages full chain)

**For SHARE predictions:** Multi-role entities are IDEAL because:
- Grower knows cultivation practices (S, H, A, R)
- Retailer controls timing/handling (R, E)
- No quality loss through intermediaries

---

### 4. Data Source Distribution

**USDA dominates (95% of growers):**
- Agritourism: 9,727 (65%)
- On-farm markets: 4,459 (30%)
- CSA: 552 (4%)
- LocalHarvest/Research: 263 (2%)

**Implication:** USDA is the backbone; LocalHarvest/research adds detail layer (product data, timing).

---

### 5. Website Coverage - Critical Blocker ⚠️

**Only 114 growers have websites (0.8%)**

This is the REAL constraint for product research:
- Can't scrape non-existent websites
- Most are small farms without web presence
- Traditional methods (phone, mail, in-person) required

**Alternative approaches:**
- Regional inference (if 20 MI farms grow cherries, neighboring farms probably do too)
- Extension service recommendations (what's suitable for each zone/region)
- Aggregate sources (farmers market vendor lists, CSA share descriptions)

---

### 6. Regional Specialization - Clear Patterns 🗺️

**Where product data exists, specialization is obvious:**

| State | Dominant Products | Pattern |
|-------|------------------|---------|
| MI | Plum (38), Cherry (33), Pear (33), Apple (21) | Lake effect fruit belt |
| NY | Cherry (36), Plum (36), Pear (33) | Finger Lakes specialization |
| WI | Plum (27), Pear (26), Cherry (26) | Similar to MI (lake effect) |
| CA | Pear (22), Apple (22), Plum (20) | Diverse (Central Valley) |

**Inference opportunity:**
- MI grower with no products → Infer: "Likely plum, cherry, pear, or apple"
- Confidence: Medium (70-80%) based on regional norms
- Better than nothing; can refine with zone/timing data

---

### 7. Growing Region Mapping - CRITICAL GAP 🎯

**Only 58 growers (0.4%) linked to precise growing regions**

**Impact:**
- **S pillar blocked** for 99.6% of growers (can't infer soil characteristics)
- Can only predict at state level, not region level
- Quality differentiation limited (Indian River FL vs Central FL = different soil)

**This is the #1 infrastructure priority.**

Solution: Build comprehensive city→region mapping table
- Currently: 130 cities mapped
- Needed: ~10,000+ cities (most grower cities)
- Effort: Systematic research or geographic dataset

---

### 8. Single-Farm CSAs - Quality Tier 🌟

**552 single-farm CSAs identified** (`num_supplyfarms=1`)

**Why they matter:**
- Verified growers (not aggregators)
- Subscription model = customer relationships = quality focus
- Often organic/sustainable practices
- ~48% have product data already

**Recommendation:** These are prime candidates for:
- Full SHARE attribute tracking
- Lab verification (Edacious)
- Marketplace partnerships
- Cultivar-level data collection

---

## Actionable Insights

### Pattern 1: Inference Can Work
With only 5% explicit product data, we see clear regional specializations. This validates the inference approach - if we know location, we can predict products with medium confidence.

### Pattern 2: City→Region Mapping is Foundational
99.6% of growers can't use S pillar without precise region links. This blocks soil-based quality predictions. **Must prioritize.**

### Pattern 3: Multi-Role is the Norm
Treating grower/retailer as separate is wrong for local food. They're integrated. The SHARE model handles this correctly (same entity, full chain visibility).

### Pattern 4: Scale Enables Inference
15K entities create density - enough to learn regional patterns, cluster behaviors, product correlations. The sparsity becomes strength via network effects.

### Pattern 5: Quality Tiers Emerge
- Tier 1: Single-farm CSAs (552) - Verified, often have products, quality-focused
- Tier 2: Growers with websites (114) - Researchable
- Tier 3: Growers in quality regions (58) - Soil inference possible
- Tier 4: All others (14,314) - Require inference or bulk research

---

## Recommended Next Steps (Priority Order)

### 1. Build Comprehensive City→Region Mapping (Week 1)
**Impact:** Unlocks S pillar for 14,980 growers
**Method:** Systematic geographic research, county→region lookup tables
**Effort:** 40 hours (manual research + validation)

### 2. Regional Product Inference Model (Week 2)
**Impact:** Infer products for 14,360 growers (medium confidence)
**Method:** ML/rules on 677 known → predict for unknown based on location
**Effort:** 30 hours (model building + validation)

### 3. Extension Service Harvest Timing (Week 3-4)
**Impact:** Complete R pillar (when products peak)
**Method:** State extension services (UF/IFAS, UC Davis, WSU, etc.)
**Effort:** 40 hours (5 major states × 8 hours each)

### 4. Targeted Product Research (Ongoing)
**Impact:** High-confidence data for quality tier
**Method:**
- 552 single-farm CSAs: Website research, phone calls
- 114 with websites: Automated scraping
- Quality regions: Focus on Indian River, Central Valley, Yakima
**Effort:** 2-5 hours per entity (prioritize by ROI)

---

## Conclusion

The 15K grower dataset is **structurally sound** for Fielder's inference-driven approach:
- Geographic coverage: Complete
- Network density: High
- Regional patterns: Visible
- Multi-role alignment: Perfect for farm→consumer model

**The sparsity (95% without products) is expected and manageable** through:
1. Inference from regional patterns
2. Targeted research on high-value subset
3. Extension service data for regional norms

**The graph is now production-ready** for building the inference layer.

---

**Analysis Date:** December 22, 2025
**Graph Size:** 21,342 entities, 21,731 nodes, 26,366 relationships
**Growers Analyzed:** 15,038
