# Full Audit & Cleanup Plan - 70% → 95%+ Foundation

**Date:** December 24, 2025
**Goal:** Complete, accurate, comprehensive SHARE foundation
**Estimated Effort:** 10-15 hours
**Current State:** 70% complete, structurally correct but incomplete
**Target State:** 95%+ complete, validated against TypeScript source

---

## Audit Findings Summary

**From HONEST_VALIDATION_REPORT.md:**

```
Current: 70% complete
Target: 95%+ complete
Gap: 25% remaining work

By Pillar:
  S (Soil): 85% → 95% (+10%)
  H (Heritage): 70% → 85% (+15%)
  A (Agricultural): 40% → 90% (+50%) ⚠️ Biggest gap
  R (Ripen): 85% → 95% (+10%)
  E (Enrich): 55% → 85% (+30%)
```

---

## Cleanup Tasks (Ranked by Impact)

### PHASE 1: Critical Gaps (10-15% value)

#### Task 1.1: Add Entity→Claim Relationships ⭐⭐⭐
**Impact:** 10% of foundation
**Effort:** 2-3 hours
**Priority:** CRITICAL

**What to do:**
```typescript
// Parse entity.features and entity.certifications
entity.certifications = ['organic', 'gap']
  → Create (entity)-[:HAS_CLAIM]->(Claim {id: 'organic'})

entity.features = ['tree_ripened', 'grass_fed', 'pasture_raised']
  → Map features to claims
  → Create relationships
```

**Enables:**
- "Find organic farms in region"
- "Which growers are grass-finished?"
- Brand validation against farm claims
- Complete A pillar functionality

**Validation:** Can query for farms by claim type

---

#### Task 1.2: Generate Flavor Notes for GROWN_IN ⭐⭐
**Impact:** 5% of foundation
**Effort:** 2 hours
**Priority:** HIGH

**What to do:**
```typescript
// For each GROWN_IN relationship:
flavorNotes = cultivar.flavorProfile + " from " + region.terroir

Example:
Cultivar: "Sweet, seedless, ideal for eating fresh"
Region: "Indian River oolitic limestone soil"
→ flavorNotes: "Sweet, seedless Navels with mineral brightness from Indian River's unique limestone terroir"
```

**Enables:**
- Region-specific tasting notes
- Terroir storytelling
- Premium positioning justification

**Validation:** All 4,614 GROWN_IN have flavorNotes

---

### PHASE 2: Data Quality (5-10% value)

#### Task 2.1: Clean Up Duplicate Nodes ⭐⭐
**Impact:** 3% of foundation
**Effort:** 1 hour
**Priority:** HIGH

**What to do:**
```cypher
// Varieties: Should be 20, currently 44
MATCH (v:Variety)
WHERE v.source = 'duplicate' OR v.source IS NULL
// Identify and merge duplicates

// GrowingRegions: Should be 153, currently 185
MATCH (r:GrowingRegion)
WHERE r.source != 'typescript'
// Clean up aliases and test data
```

**Validation:** Node counts match TypeScript constants

---

#### Task 2.2: Add Soil Mineral Data ⭐
**Impact:** 3% of foundation
**Effort:** 1-2 hours
**Priority:** MEDIUM

**What to do:**
```typescript
// Load from typicalSoil.minerals:
region.typicalSoil = {
  minerals: {
    phosphorus: 'medium',
    potassium: 'high',
    calcium: 'high',
    magnesium: 'medium'
  },
  naturalMineralization: 'high'
}

→ Add to GrowingRegion or SoilProfile nodes
```

**Enables:**
- Advanced soil science queries
- Mineralization assessment
- Alternative Ag methodology validation

**Validation:** 153 regions have mineral data

---

#### Task 2.3: Add Missing Region Fields ⭐
**Impact:** 2% of foundation
**Effort:** 30 minutes
**Priority:** MEDIUM

**What to do:**
```typescript
// Load to GrowingRegion:
- macroRegion ('west_coast', 'southeast', etc.)
- slug (SEO-friendly URLs)
- primaryProducts (array of main crops)
```

**Validation:** All regions have macroRegion and slug

---

### PHASE 3: Relationship Properties (5% value)

#### Task 3.1: Add Peak Months Overrides ⭐
**Impact:** 2% of foundation
**Effort:** 1 hour
**Priority:** MEDIUM

**What to do:**
```typescript
// On GROWN_IN relationships from CURATED_REGIONAL_OFFERINGS:
if (offering.peakMonthsOverride) {
  grownIn.peakMonthsOverride = offering.peakMonthsOverride
}
```

**Currently:** Only loaded on ~20 curated offerings
**Should be:** Check all 4,614 for overrides

**Validation:** Curated offerings have region-specific peak months

---

#### Task 3.2: Add GDD Overrides ⭐
**Impact:** 1% of foundation
**Effort:** 30 minutes
**Priority:** LOW

**What to do:**
```typescript
// From RegionalOffering interface:
- gddToMaturityOverride
- gddWindowOverride
- baseTempOverride
```

**Currently:** Only gdd_to_peak on 28 phenology entries
**Should be:** Load from TypeScript where defined

---

### PHASE 4: Polish (5% value)

#### Task 4.1: Add Trade Names (When Available) ⭐
**Impact:** 2% of foundation
**Effort:** 2-3 hours (need to populate TypeScript first)
**Priority:** MEDIUM

**Current state:** Not in TypeScript CULTIVARS data yet
**What to do:**
1. Research trade names (SUMO → Shiranui, Pink Lady → Cripps Pink)
2. Add to TypeScript
3. Load to graph
4. Create inference mapping

**Enables:** Trade name → cultivar lookup for Flavor App

---

#### Task 4.2: Load Agricultural Definitions ⭐
**Impact:** 1% of foundation
**Effort:** 1 hour
**Priority:** LOW

**What to do:**
```
Load 36 agricultural definitions from agricultural-definitions.ts (903 lines)
as AgDefinition nodes

Different from Claims - these are educational definitions
Example: "Cage Free", "Free Range", "Product of USA"
```

**Enables:** Consumer education content, glossary

---

#### Task 4.3: Consolidate SoilProfile Nodes ⭐
**Impact:** 1% of foundation
**Effort:** 1 hour
**Priority:** LOW

**Current state:** Inconsistent
- Some regions have separate SoilProfile nodes (7)
- Most have soil as embedded properties

**What to do:** Standardize one approach

---

### PHASE 5: Future (Out of Scope for Now)

- Omega ratios for livestock (need research data)
- Real-time weather API integration
- Actual measurements (user-generated data)
- Origin stories (need content research)

---

## Execution Plan

### Session 1: Critical Gaps (3-4 hours) → 70% to 85%

**Task Sequence:**
1. Add Entity→Claim relationships (2-3 hours)
2. Generate flavor notes for all GROWN_IN (1 hour)
3. Validate and commit

**Result:** A pillar functional, E pillar improved

---

### Session 2: Data Quality (2-3 hours) → 85% to 92%

**Task Sequence:**
1. Clean up duplicate nodes (1 hour)
2. Add soil mineral data (1-2 hours)
3. Add missing region fields (30 min)
4. Validate and commit

**Result:** Clean data, complete region foundation

---

### Session 3: Relationship Properties (1-2 hours) → 92% to 95%

**Task Sequence:**
1. Add peak months overrides (1 hour)
2. Add GDD overrides (30 min)
3. Final validation

**Result:** Complete relationship data

---

### Session 4: Polish (Optional, 3-5 hours) → 95% to 98%

**Task Sequence:**
1. Research and add trade names (2-3 hours)
2. Load agricultural definitions (1 hour)
3. Consolidate soil profiles (1 hour)
4. Final comprehensive validation

**Result:** Production-ready, comprehensive foundation

---

## Validation Criteria (How We'll Know We're Done)

### 70% → 85% (Session 1 Complete)
```
✅ Entity→Claim relationships exist
✅ Can query "Find organic farms in region"
✅ All GROWN_IN have flavorNotes
✅ Brand validation queries work
```

### 85% → 92% (Session 2 Complete)
```
✅ No duplicate Variety nodes (exactly 20)
✅ No duplicate GrowingRegion nodes (exactly 153)
✅ All regions have soil mineral data
✅ All regions have macroRegion, slug, primaryProducts
```

### 92% → 95% (Session 3 Complete)
```
✅ Curated offerings have peak months overrides
✅ Phenology entries have complete GDD overrides
✅ All relationship properties from TypeScript loaded
```

### 95% → 98% (Session 4 Complete - Optional)
```
✅ Trade names on cultivars (where researched)
✅ Agricultural definitions as nodes
✅ Consistent soil profile strategy
✅ Comprehensive validation passes
```

---

## Progress Tracking

**Start:** 70% complete (after honest validation)

**Milestones:**
- [ ] Phase 1: 85% (Entity→Claim + flavor notes)
- [ ] Phase 2: 92% (Data quality + soil minerals)
- [ ] Phase 3: 95% (Relationship properties)
- [ ] Phase 4: 98% (Polish + trade names)

**Target:** 95%+ before building API

---

## Why This Matters

**Your question revealed the right concern:**
- I was conflating "loaded available data" with "comprehensive"
- I counted node creation as pillar completion
- I didn't validate against TypeScript interface completeness

**This plan ensures:**
- Every TypeScript field is accounted for
- Missing data is explicitly called out
- Mapping correctness is validated
- Percentages are honest and verifiable

**Let's do this right.**

Ready to start Phase 1: Entity→Claim relationships + flavor notes?
