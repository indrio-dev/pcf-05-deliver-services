# Fielder Business Model

## The One-Liner

**Fielder is the S&P Global of food quality - we prove what labels only promise.**

Freemium app (like Yuka) + marketplace commerce (like ButcherBox) + verification data moat.

---

## Revenue Model

### Three-Layer Flywheel

```
LAYER 1: FREE (Cost Center → Data Asset)
├── User gets: Scan anything, quality scores, nutrient estimates
├── Fielder gets: Scans + Brix entries = unreplicable data moat
└── Economics: We PAY (servers, dev) but we GET free data

                    ↓ "I want the good stuff" ↓

LAYER 2: PREMIUM - $9.99/mo (Revenue Center)
├── User gets: WHERE TO BUY + complete nutrient profiles
├── Fielder gets: Subscription revenue
└── Economics: ~$100/year per subscriber

                    ↓ "I'm buying through Fielder" ↓

LAYER 3: COMMERCE (Transaction Revenue)
├── User gets: Verified quality, convenient sourcing
├── Fielder gets: 8-10% commission + shipping margin
└── Economics: $50-100/year additional per active buyer
```

**Fully engaged premium buyer: $150-200/year LTV**

---

## Freemium Tier Structure

| Feature | Free | Premium ($9.99/mo) |
|---------|------|-------------------|
| **Scans** | 5-10/week | Unlimited |
| **Basic Profile** (claim inference) | ✓ | ✓ |
| **Enhanced Estimate** (AI brand research) | Blurred/teaser | Full access |
| **Profile Lab Data** (representative testing) | ✗ | ✓ |
| **Product Lab Data** (specific brand tested) | ✗ | ✓ |
| **WHERE TO BUY** | Hidden | Full sourcing |
| **History & trends** | ✗ | ✓ |
| **Peak season alerts** | ✗ | ✓ |
| **Edacious lab reports** | ✗ | Add-on or included |

---

## Data Quality Tiers

Different levels of data depth depending on what's available:

| Tier | What It Is | Source | Badge |
|------|-----------|--------|-------|
| **1. Basic Profile** | SHARE profile inference from claims | Fielder inference model | 📊 |
| **2. Enhanced Estimate** | Brand-specific AI research | AI pulls additional signals | 🔍 |
| **3. Profile Lab Data** | Representative lab data for that SHARE profile type | Edacious test of profile archetype | 🧪 |
| **4. Product Lab Data** | Actual lab results for THAT specific product | Edacious test of that brand | ✓🧪 |

### Example: Scanning Vital Farms Eggs

**Free user sees:**
```
PASTURE-RAISED EGGS
Basic Profile Score: B+

Estimated Omega Ratio: 8-12:1
What "pasture-raised" means: [explanation]
What to look for: [tips]

┌─────────────────────────────────────────┐
│ 🔒 UNLOCK ENHANCED PROFILE              │
│ See Vital Farms-specific analysis,      │
│ lab data, and refined nutrient estimate │
│                                         │
│ [Upgrade to Premium →]                  │
└─────────────────────────────────────────┘
```

**Premium user sees:**
```
VITAL FARMS PASTURE-RAISED EGGS
Enhanced Profile Score: B-

Data Available:
├── 📊 Basic Profile      ✓
├── 🔍 Enhanced Estimate  ✓
├── 🧪 Profile Lab Data   ✓
└── ✓🧪 Product Lab Data  ✓

Lab-Verified Omega-6: 23.5%
Refined Omega Ratio: 10-14:1

✓ No antibiotics
✓ Outdoor access
⚠ No soy-free claim (likely soy in feed)
⚠ Lab test shows higher omega-6 than marketing implies

BETTER ALTERNATIVES NEAR YOU:
→ Angel Acres (74% less omega-6) - 12 mi
→ Local farm CSA - 8 mi

[Buy verified eggs →]
```

---

## Produce vs. Animal Products

### Animal Products (Meat, Eggs, Dairy)
Lab data is relatively stable per brand (same farm, same practices). The four-tier model applies directly.

### Produce
Quality varies by packinghouse, lot, harvest date, and growing conditions.

| Tier | Produce Equivalent |
|------|-------------------|
| Basic Profile | Cultivar quality ceiling + regional baseline |
| Enhanced Estimate | GDD model + timing + region-specific adjustments |
| Profile Lab Data | Representative Brix for that cultivar×region combo |
| Product Lab Data | Actual refractometer reading (crowdsourced or verified) |

**For produce, Tier 4 is the Brix entry flywheel** - users entering readings IS the product-level data.

---

## Unique Value Proposition

Fielder is the only app that decodes claims AND estimates nutrients across ALL farm-to-table categories:

| Category | What Scanning Reveals |
|----------|----------------------|
| **Beef** | Decodes "grass-fed" vs "grass-finished," estimates omega ratio (2:1 → 26:1), flags CAFO exposure |
| **Pork** | Heritage vs commercial, pasture vs confinement, estimated omega profile |
| **Chicken** | "Pasture-raised" vs "free-range" vs "cage-free" (massive difference), omega estimate |
| **Eggs** | Omega ratio, pasture vs marketing claims |
| **Dairy** | Grass-fed, A2/A2, raw, estimated CLA content |
| **Produce** | Brix estimate, cultivar quality tier, harvest timing, heritage vs commercial |

**No one else does this.** Yuka scores additives. EWG scores pesticides. Fielder scores *actual nutrition*.

---

## The Paywall Psychology

**Free tier creates awareness + desire:**
> "Washington Navels from Indian River are at PEAK right now. Estimated Brix: ████. Quality: **Excellent**. [Upgrade to see details and where to buy →]"

**Premium tier delivers sourcing + depth:**
The thing behind the paywall (WHERE TO BUY) directly enables the transaction revenue.

---

## Competitive Moats

| Asset | Why Defensible |
|-------|----------------|
| **Data moat** | Prediction→measurement pairs from scans + Brix entries |
| **Indrio infrastructure** | 1M packages/year, decades of logistics expertise |
| **First-mover on verification** | No one else measures outcomes at scale |
| **SHARE framework** | Research-backed, proprietary methodology |
| **Claim decoder across categories** | Comprehensive farm-to-table coverage |

---

## Market Validation

| Proof Point | Numbers | Relevance |
|-------------|---------|-----------|
| **Yuka** | 76M users, $20M revenue, <$1M raised | Freemium food scanning works |
| **Seed Oil Scout** | 1M users, $25/year | People pay for ingredient transparency |
| **America's Test Kitchen** | 80% digital renewal, 60% subscriptions | Trust-based media model |
| **Consumer Reports** | $35-55/year tiers, 111K new members in 8 weeks | Tiered verification model |
| **ButcherBox** | $600M revenue, no VC | Subscription + quality + asset-light |

---

## Unit Economics

| User Type | Cost to Fielder | Revenue | Data Value |
|-----------|-----------------|---------|------------|
| Free | ~$2-5/year | $0 | High (scans, Brix) |
| Premium (browser) | ~$5-10/year | $100/year | Higher |
| Premium (buyer) | ~$10-15/year | $150-200/year | Highest |

---

## What's Free vs. Paid (Summary)

**MUST BE FREE (feeds flywheel):**
- Scanning (limited to 5-10/week)
- Brix entry (unlimited)
- Basic profile scores
- What's in season near me

**BEHIND PAYWALL:**
- Unlimited scanning
- Enhanced brand-specific estimates
- Full nutrient breakdowns
- WHERE TO BUY / sourcing
- Profile and product lab data
- History, trends, alerts

---

*Last updated: December 2024*
