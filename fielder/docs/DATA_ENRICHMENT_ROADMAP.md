# Data Enrichment Roadmap

## Current State (From Query Results)

**Varieties with cultivars:**
- Fruit: Navel (2), Ruby Grapefruit (2), most others (1 each)
- NO MEASUREMENTS on any fruit variety cultivars

**Varieties without cultivars:**
- Pears: Bartlett, Anjou, Comice, Bosc (0 cultivars)
- Vegetables: Potato, Blueberry, Nectarine, Turmeric (0 cultivars, but BFA linked to generic)

**Gap:** Fruit varieties have 1-2 cultivars but ZERO measurements!

---

## Priority 1: Add Cultivars to Existing Varieties

**Target:** Varieties with 0-2 cultivars, expand to 5-10 each

**Navel Orange (has 2, need 8 more):**
- Lane Late, Cara Cara, Powell, Fukumoto, Dream, Barnfield, Navelina, Parent

**Ruby Grapefruit (has 2, need 5 more):**
- Star Ruby, Flame, Henderson, Ray Ruby, Marsh Pink

**Bartlett Pear (has 0, need 5):**
- Bartlett, Red Bartlett, Max Red, Rosired, Sensation

**Honeycrisp (has 1, need variants):**
- Honeycrisp, Minneiska (SweeTango), Multiple propagations

---

## Priority 2: Find Measurement Data Sources

**For each variety, spawn agent to find:**
1. University extension trials (MSU model)
2. Breeding program releases
3. Research publications (PMC)
4. USDA variety evaluations

**Required data:**
- Cultivar name
- Location (county-level)
- Harvest date (month/day/year)
- Brix + acid measurements
- Age/rootstock if available

---

## Priority 3: ALL Farm-to-Table Categories

**Categories needing enrichment:**

**Produce:**
- ✅ Citrus: Some coverage
- ⚠️ Apples: 1 cultivar each
- ⚠️ Stone fruit: 1-2 cultivars
- ❌ Pears: 0 cultivars
- ❌ Berries: Minimal

**Meat:**
- ❌ Beef: Need breed data, omega measurements, forage data
- ❌ Pork: Similar
- ❌ Poultry: Similar
- ❌ Lamb: Similar

**Seafood:**
- ❌ Fish: Species, waters, omega-3 data
- ❌ Shellfish: Similar

**Nuts:**
- ❌ Tree nuts: Oil content, variety data

**Lightly Processed:**
- ❌ Honey: Floral source, location
- ❌ Maple syrup: Location, grade
- ❌ Coffee: Origin, variety

---

## Agent Roadmap Template

**Per variety:**
1. List existing cultivars (from graph)
2. Identify gap (need 5-10 cultivars minimum)
3. Spawn agent: Find cultivars for [variety]
4. Spawn agent: Find Brix data for each cultivar
5. Load to graph with measurements

**Systematic, variety by variety.**

**Estimated:** 100+ varieties × 5-10 cultivars each = 500-1000 cultivars to add
With measurement data for each.

Session: 69 commits, foundation 90%
Next: Systematic variety enrichment
