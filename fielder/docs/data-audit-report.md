# Fielder Data Audit Report

**SPIKE-A: Data Audit**
**Date:** December 18, 2025
**Purpose:** Understand data state before F009-F012 migration work

---

## Executive Summary

**Critical Finding:** Massive data duplication between TypeScript constants (17,459 lines across 20 files) and Supabase database (9 tables, only 2 seeded). The constants contain 6x more regions than the database, and core tables (cultivars, rootstocks) have schema defined but zero data.

**Recommendation:** Database should become the single source of truth. Constants should be deprecated via feature flag pattern (F009).

---

## 1. Database State (Supabase)

### Schema Defined (9 Tables)

| Table | Primary Key | Seeded | Notes |
|-------|-------------|--------|-------|
| `crops` | TEXT | ✅ 15 rows | Citrus, stone fruit, berries, tropical, nuts |
| `cultivars` | TEXT | ❌ 0 rows | Schema only, no data |
| `rootstocks` | TEXT | ❌ 0 rows | Schema only, no data |
| `growing_regions` | TEXT | ✅ 21 rows | US regions (FL, CA, TX, GA, WA, etc.) |
| `crop_phenology` | SERIAL | ❌ 0 rows | GDD data not migrated |
| `farms` | UUID | ❌ 0 rows | No farm registrations yet |
| `farm_crops` | UUID | ❌ 0 rows | Junction table |
| `farm_availability` | UUID | ❌ 0 rows | Inventory tracking |
| `harvest_windows` | UUID | ❌ 0 rows | Computed windows |

### Seed Data Summary

**Crops (15 total):**
- Citrus (5): Navel, Valencia, Grapefruit, Tangerine, Lemon
- Stone Fruit (3): Peach, Nectarine, Cherry
- Pome Fruit (2): Apple, Pear
- Berries (2): Strawberry, Blueberry
- Tropical (2): Mango, Avocado
- Nuts (1): Pecan

**Growing Regions (21 total):**
- Florida (3): Indian River, Ridge, Southwest
- California (4): Central Valley, Coachella, San Joaquin, Coastal
- Texas (3): Rio Grande, Hill Country, East Texas
- Washington (2): Yakima, Wenatchee
- Georgia (2): Middle Georgia, South Georgia
- Michigan (2): Grand Traverse, Southwest Michigan
- Other states: Oregon (2), Arizona (1), South Carolina (1), North Carolina (1)

---

## 2. TypeScript Constants State

### File Inventory (20 Files, 17,459 Total Lines)

| File | Lines | Entries | DB Table Equivalent | Status |
|------|-------|---------|---------------------|--------|
| `rootstocks.ts` | 303 | 14 | `rootstocks` | **Migrate to DB** |
| `quality-tiers.ts` | 576 | 11+ | `cultivars` | **Migrate to DB** |
| `crop-phenology.ts` | 608 | 33 | `crop_phenology` | **Migrate to DB** |
| `growing-regions.ts` | 2,433 | 122 | `growing_regions` | **Migrate to DB** |
| `gdd-targets.ts` | 443 | 20 | `crops.gdd_*` columns | **Already in crops** |
| `share-profiles.ts` | 1,873 | 47 | None (new table needed) | Future: F013+ |
| `brands.ts` | 733 | 7 | None (new table needed) | Future: Flavor App |
| `packing-houses.ts` | 672 | 13 | None (new table needed) | Future: Inference |
| `citrus-production.ts` | 689 | - | Reference/static | Keep as constants |
| `products.ts` | 1,122 | - | Taxonomy definitions | Keep as constants |
| `product-model.ts` | 312 | - | TypeScript interfaces | Keep as interfaces |
| `agricultural-definitions.ts` | 1,054 | 36 | Reference/static | Keep as constants |
| `inference-chains.ts` | 487 | - | Business logic | Keep as code |
| `regions.ts` | 516 | - | Legacy, overlaps | **Deprecate** |
| Other files | ~6,637 | - | Various | Mixed |

### Critical Discrepancies

| Data Type | Constants | Database | Delta |
|-----------|-----------|----------|-------|
| Growing Regions | 122 | 21 | **6x more in constants!** |
| Rootstocks | 14 | 0 | All in constants only |
| Cultivars | 11+ | 0 | All in constants only |
| Crop Phenology | 33 | 0 | All in constants only |
| Crops (GDD) | 20 | 15 | 5 crops only in constants |

---

## 3. Data Quality Issues

### Issue 1: Region Data Inconsistency
**Severity:** HIGH

The database has 21 regions, constants have 122. This creates:
- Prediction failures when user selects a region not in DB
- Duplicate/conflicting definitions
- Two files defining regions (`growing-regions.ts` and `regions.ts`)

**Root Cause:** Constants were ported from Python, DB seed was manually created with subset.

### Issue 2: Empty Core Tables
**Severity:** HIGH

`cultivars` and `rootstocks` tables have schema but no data. All prediction logic relies on constants:
- `quality-tiers.ts` for cultivar Brix bases
- `rootstocks.ts` for rootstock modifiers

**Impact:** F009 (Reference Data Service) cannot use DB until F011, F012 complete.

### Issue 3: Duplicate Type Definitions
**Severity:** MEDIUM

TypeScript interfaces exist in both:
- `src/lib/constants/` (product-model.ts, products.ts)
- Database schema (SQL types)

No single source of truth for type definitions.

### Issue 4: Hardcoded GDD in Multiple Locations
**Severity:** MEDIUM

GDD requirements appear in:
- `gdd-targets.ts` (full list)
- `crop-phenology.ts` (partial, with bloom dates)
- `crops` table (15 rows with gdd_* columns)

**Finding from SPIKE-B prep:** `grep -r "GDD\|Brix\|degree.*day"` shows calculations spread across 6+ files.

---

## 4. Migration Scope Estimate

### Immediate Priorities (F010-F012)

| Feature | Work Required | Estimated Effort |
|---------|---------------|------------------|
| F010: Seed Crops | Merge gdd-targets.ts (20) with crops table (15) | Small - 5 new inserts |
| F011: Seed Cultivars | Port quality-tiers.ts to cultivars table | Medium - 11+ rows + schema validation |
| F012: Seed Rootstocks | Port rootstocks.ts to rootstocks table | Small - 14 rows |

### Deferred Work (Post-MVP)

| Task | Complexity | Notes |
|------|------------|-------|
| Merge 122 regions → DB | Large | Need to decide: all 122 or curated subset? |
| Add crop_phenology data | Medium | 33 entries with bloom dates, regional variations |
| SHARE profiles to DB | Large | 47 profiles, complex structure, may need new tables |
| Brands/packing houses | Large | Future Flavor App requirement |

---

## 5. Recommended Migration Strategy

### Phase 1: Foundation (F009-F012)
```
1. F009: Create reference-data.ts with dual-mode (DB + constants fallback)
2. F010: Seed crops with 5 missing entries
3. F011: Seed cultivars (11+) with brix_base, timing_class
4. F012: Seed rootstocks (14) with brix_modifier, vigor
```

### Phase 2: Deprecate Constants
```
1. Enable USE_DATABASE_REFERENCE_DATA feature flag
2. Add deprecation warnings to constant imports
3. Update prediction engine to use reference-data.ts
4. Write migration tests comparing DB vs constant output
```

### Phase 3: Full Migration (Future)
```
1. Migrate all 122 regions (or curated list)
2. Migrate crop_phenology data
3. Add SHARE profiles table and migrate 47 profiles
4. Remove deprecated constant files
```

---

## 6. Files to Migrate (Priority Order)

### Must Migrate (F010-F012)
1. `rootstocks.ts` → `rootstocks` table (14 rows)
2. `quality-tiers.ts` → `cultivars` table (11+ rows)
3. `gdd-targets.ts` → merge into `crops` table (5 new rows)

### Should Migrate (Later)
4. `growing-regions.ts` → `growing_regions` table (101 new rows)
5. `crop-phenology.ts` → `crop_phenology` table (33 rows)

### Keep as Constants
- `products.ts` - Taxonomy definitions (reference)
- `product-model.ts` - TypeScript interfaces
- `agricultural-definitions.ts` - Static reference content
- `inference-chains.ts` - Business logic (code, not data)

### Deprecate
- `regions.ts` - Overlaps with growing-regions.ts

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DB migration breaks predictions | Medium | High | Feature flag fallback to constants |
| Missing data in DB causes 500 errors | Medium | High | Graceful degradation, logging |
| Schema mismatch during migration | Low | Medium | Validate types in F009 tests |
| Performance regression (DB vs in-memory) | Low | Low | Add caching layer in F009 |

---

## 8. Success Criteria for Migration

- [ ] All prediction API endpoints work with DB data
- [ ] Feature flag allows instant rollback to constants
- [ ] Test coverage for reference-data.ts > 90%
- [ ] No prediction value changes (regression tests from SPIKE-B)
- [ ] Constants files marked deprecated
- [ ] Documentation updated

---

## Appendix: Raw Data Counts

### TypeScript Constant Entry Counts (via grep)

```
rootstocks.ts:          14 entries (id: patterns)
quality-tiers.ts:       11 cultivar profiles
crop-phenology.ts:      33 crop×region entries
growing-regions.ts:     122 region entries
share-profiles.ts:      47 SHARE profiles
brands.ts:              7 brand entries
packing-houses.ts:      13 packing house entries
gdd-targets.ts:         20 crop GDD targets
```

### Database Row Counts (from seed files)

```
crops:           15 rows
growing_regions: 21 rows
cultivars:       0 rows
rootstocks:      0 rows
crop_phenology:  0 rows
farms:           0 rows
```

---

*Report generated as part of SPIKE-A: Data Audit*
*Next: SPIKE-B (Rule Extraction Baseline) or F009 (Reference Data Service)*
