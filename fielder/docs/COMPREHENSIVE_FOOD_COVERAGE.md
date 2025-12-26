# Comprehensive Edible Food Coverage Strategy

**Goal:** Include EVERY edible food someone might encounter, from mass-market to rare heritage to permaculture

**Market tier classification exists to ORGANIZE, not LIMIT what we include**

---

## Coverage Philosophy

```
FIELDER FOOD UNIVERSE = Everything Edible
├── Mass Market (Kroger, Walmart) - Filter for mainstream consumers
├── Commercial (Widely available) - Filter for general shoppers
├── Regional (Strong locally) - Filter for regional specialties
├── Specialty (Whole Foods, farmers markets) - Filter for food enthusiasts
└── Rare (Ark of Taste, permaculture, preservation) - Filter for deep exploration

ALL TIERS INCLUDED. Market tier = metadata for filtering, not exclusion criteria.
```

---

## Current State

**What we have (609 cultivars):**
✅ Mass market leaders (Gala, Russet Burbank, Black Angus)
✅ Commercial varieties (Royal Gala, Cosmic Crisp, Berkshire pork)
✅ Heritage heirlooms (Brandywine tomato, Red Fife wheat, Galloway cattle)
✅ Some rare breeds (Ossabaw pig, Guinea Hog, Ancient White Park cattle)

**What we're missing:**
❌ Slow Food USA Ark of Taste varieties (systematic preservation list)
❌ Permaculture foods (perennial vegetables, unusual edibles)
❌ Regional heritage varieties (state-specific, local preservation)
❌ Wild foods (forageables that farms cultivate)
❌ Indigenous varieties (Native American preservation)
❌ International imports (varieties available in US from global sources)

---

## Expansion Categories

### 1. Ark of Taste (Slow Food USA)

**What it is:** Curated list of heritage foods at risk of extinction

**Examples to add:**
- **Produce:** Carolina Gold Rice, Sea Island Red Peas, Ozette Potato, Moon and Stars Watermelon, Navajo-Churro Lamb, Pineywoods Cattle
- **Grains:** Red Fife Wheat (we have ✅), Bloody Butcher Corn, Floriani Red Flint Corn
- **Livestock:** Ossabaw Island Hog (we have ✅), Mulefoot Hog (we have ✅), Gulf Coast Native Sheep
- **Seafood:** Olympia Oyster (we have ✅)
- **Post-Harvest:** Sorghum Syrup, Bourbon Barrel-Aged Sorghum

**Research source:** https://www.slowfoodusa.org/ark-of-taste

### 2. Permaculture Foods

**Perennial Vegetables:**
- Asparagus (we might have seeds)
- Rhubarb (missing)
- Jerusalem Artichoke/Sunchoke (missing)
- Tree Collards (perennial kale, rare)
- Sea Kale (European perennial)
- Good King Henry (perennial spinach)
- Ostrich Fern (Fiddleheads - we might have)
- Sorrel (perennial, lemony green)

**Unusual Edibles:**
- Paw Paw (North American native fruit - missing)
- Persimmon (American vs Asian - have ProductType, need varieties)
- Jujube (Chinese date)
- Hardy Kiwi (vs fuzzy kiwi)
- Honeyberry (Haskap)
- Goji Berry
- Mulberry
- Serviceberry (Juneberry)
- Elderberry (might have)

**Nuts:**
- Chinquapin (American chestnut relative)
- Heartnut (Japanese walnut)
- Hickory (native American)
- Butternut (white walnut)

### 3. Native American Varieties

**Three Sisters:**
- Corn: Cherokee White, Hopi Blue, Bloody Butcher, Seneca, Haudenosaunee
- Beans: Hidatsa Red, Arikara Yellow, Tepary
- Squash: Seminole Pumpkin, Cushaw, Hubbard

**Other:**
- Manoomin (Wild Rice - we have ✅)
- Tule Potatoes
- Wild onions
- Camas bulbs (if cultivated)

### 4. Regional Heritage Varieties

**Examples:**
- **Texas:** Uvalde Honey (honey variety), Texas Longhorn beef (we have ✅), Attoyac Blackeye Peas
- **Appalachian:** Stack Cake apples, Candy Roaster squash, October beans, Greasy beans
- **Louisiana:** Creole tomatoes, Creole cream cheese, Louisiana crawfish (we have ✅)
- **Southwest:** Hatch chile (we have ✅), Navajo-Churro (we have ✅), Desert tepary beans
- **California:** Olallieberry, Oro Blanco grapefruit (we have ✅), Mission figs

### 5. Wild-Cultivated Foods

**Foraged foods that farms also cultivate:**
- Ramps (we might have)
- Morel mushrooms (we have as ProductType)
- Chanterelles (we have as ProductType)
- Fiddlehead ferns (we have as ProductType)
- Elderberries (might have)
- Wild blueberries/huckleberries
- Beach plums
- Wild blackberries vs cultivated

---

## Implementation Plan

### Phase 1: Add Ark of Taste Varieties (PRIORITY)

Research Slow Food USA Ark of Taste, systematically add:
1. All produce varieties
2. All heritage livestock breeds
3. All heritage grains
4. All specialty/processed products

**Estimate:** 100-200 additional cultivars

### Phase 2: Add Permaculture Foods

Create new ProductTypes if needed:
- Pawpaw, Persimmon varieties, Hardy Kiwi, Honeyberry, etc.
- Perennial vegetables
- Unusual fruits/nuts

**Estimate:** 50-100 additional cultivars

### Phase 3: Add Regional Heritage

State-by-state heritage variety research:
- Texas heritage foods
- Appalachian varieties
- Louisiana Creole varieties
- Southwest indigenous foods
- California specialties

**Estimate:** 100-200 additional cultivars

### Phase 4: Wild-Cultivated Foods

Varieties of foraged foods that farms also grow:
- Multiple morel varieties
- Ramp varieties
- Wild berry varieties

**Estimate:** 30-50 additional cultivars

---

## Market Tier Usage After Expansion

**With comprehensive coverage, market tier becomes a FILTER:**

User wants mainstream:
  → Filter: marketTier = 'mass_market' OR 'commercial'
  → Shows: Gala, Honeycrisp, Russet Burbank, Black Angus

User wants heritage depth:
  → Filter: marketTier = 'specialty' OR 'rare'
  → Shows: Brandywine, Arkansas Black, Ossabaw Island Hog, Pawpaw

User wants EVERYTHING:
  → No filter
  → Shows: All 700-1,000 cultivars across all tiers

---

## Data Structure Enhancement

Each cultivar should have:

```typescript
interface Cultivar {
  // Existing...
  marketTier: 'mass_market' | 'commercial' | 'regional' | 'specialty' | 'rare'

  // ADD:
  conservationStatus?: 'ark_of_taste' | 'critically_rare' | 'endangered' | 'common'
  culturalSignificance?: string[]  // ['native_american', 'creole', 'mennonite', etc.]
  permacultureUse?: boolean  // True for perennial/low-maintenance crops
  availableFrom?: string[]  // ['grocery', 'farmers_market', 'heritage_farm', 'wild_forage']
}
```

---

## Why This Matters for Fielder

**The Vision:** "Same label, different nutrition" + "Foods you didn't know existed"

**Two use cases:**

1. **Mainstream Consumer:**
   - Filter to mass_market + commercial
   - "Help me pick the best Gala apple at Kroger"
   - SHARE helps them choose quality within what they already know

2. **Food Enthusiast:**
   - Show specialty + rare
   - "What heritage varieties can I get at the farmers market?"
   - "What did Thomas Jefferson grow that I can taste?"
   - SHARE helps them discover foods they never knew existed

**Both users served by same database, different filters.**

---

## Next Steps

1. **Finish market tier classification** (in progress)
2. **Research Ark of Taste** - Systematically add all US Ark of Taste foods
3. **Add permaculture foods** - Perennials, unusual edibles
4. **Add regional heritage** - State by state, cultural preservation
5. **Tag conservation status** - Which ones are endangered/preservation priorities

This gives Fielder:
- ✅ Commercial coverage (can compete with grocery apps)
- ✅ Heritage depth (differentiation, mission alignment)
- ✅ Educational value (introduce people to foods they've never heard of)
- ✅ Preservation support (Slow Food, heritage breed associations)

**Goal:** Be the COMPLETE source for farm-to-table food quality data, from Walmart to Ark of Taste.
