# Edacious Nutrient Profile Schema Design

## Overview

Schema to store comprehensive lab nutrient analysis from [Edacious](https://www.edacious.com/food-lab/catalog) and similar labs (Texas A&M, BioNutrient Food Association).

**Edacious measures 100+ nutrients** including:
- Proximates (moisture, ash, fat, calories, carbs, protein)
- 50+ fatty acids (grouped: SFA, MUFA, PUFA, omega-3, omega-6)
- Fat-soluble vitamins (A, D, E) + cholesterol
- B vitamins (B1, B2, B3, B5, B6, B7, optional B12)
- 13 minerals (Ca, Co, Cu, Fe, Ni, Mg, Mn, P, K, Se, Na, S, Zn)
- Sugars (total, glucose, fructose, lactose, maltose, sucrose)
- Fiber (total, insoluble, soluble)
- Heavy metals (As, Cd, Pb, Hg)
- Optional: Amino acids (18), Vitamin K, Carotenoids (7), Phenolics (15), Flavonoids (6)

## Design Goals

1. **Flexible** - Store any nutrient without schema changes
2. **Comparable** - Enable cross-sample comparison and scoring
3. **Linked** - Connect to existing actuals/predictions tables
4. **Hierarchical** - Support nutrient groupings (fatty acids → omega-3 → DHA)
5. **Traceable** - Full lab provenance (report ID, method, accreditation)

## Schema Design

### Option A: Normalized (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                        lab_reports                               │
│  One row per sample submitted to a lab                          │
├─────────────────────────────────────────────────────────────────┤
│  id, actual_id (FK), sample_date, lab_name, report_id,          │
│  analysis_type, food_category, sample_description,              │
│  cost_usd, turnaround_days, accreditation                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ 1:many
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      nutrient_values                             │
│  One row per nutrient measured                                  │
├─────────────────────────────────────────────────────────────────┤
│  id, lab_report_id (FK), nutrient_id, value, unit,              │
│  detection_limit, below_detection, method, uncertainty          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     nutrients (reference)                        │
│  Master list of all measurable nutrients                        │
├─────────────────────────────────────────────────────────────────┤
│  id, name, display_name, category, subcategory,                 │
│  default_unit, typical_range_min, typical_range_max,            │
│  is_beneficial, is_contaminant                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Option B: Hybrid (JSONB for flexibility)

```
┌─────────────────────────────────────────────────────────────────┐
│                        lab_reports                               │
├─────────────────────────────────────────────────────────────────┤
│  id, actual_id, sample_date, lab_name, report_id                │
│  proximates JSONB        -- {moisture, ash, fat, protein, ...}  │
│  vitamins JSONB          -- {a, d, e, b1, b2, ...}              │
│  minerals JSONB          -- {calcium, iron, zinc, ...}          │
│  fatty_acids JSONB       -- {sfa_total, mufa_total, omega3, ...}│
│  sugars JSONB            -- {total, glucose, fructose, ...}     │
│  fiber JSONB             -- {total, insoluble, soluble}         │
│  heavy_metals JSONB      -- {arsenic, cadmium, lead, mercury}   │
│  phytochemicals JSONB    -- {carotenoids, phenolics, ...}       │
│  amino_acids JSONB       -- {leucine, lysine, ...}              │
│  contaminants JSONB      -- {glyphosate, pesticide_count, ...}  │
│  calculated_scores JSONB -- {nutrient_density_score, ...}       │
└─────────────────────────────────────────────────────────────────┘
```

## Recommended: Option A (Normalized)

More queryable, easier to aggregate across reports, supports evolution.

---

## Table Definitions

### 1. lab_reports

Master table for each lab submission.

```sql
CREATE TABLE lab_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to existing tables
  actual_id UUID REFERENCES actuals(id),
  listing_id UUID,  -- Future: link to marketplace listing

  -- Sample identification
  sample_date DATE NOT NULL,
  sample_description TEXT,
  food_category TEXT NOT NULL CHECK (food_category IN (
    'produce', 'meat', 'poultry', 'seafood', 'eggs', 'dairy',
    'nuts', 'grains', 'honey', 'oils', 'other'
  )),

  -- Cultivar/breed tracking (for comparison)
  cultivar_id TEXT,
  breed_id TEXT,
  region_id TEXT,
  farm_id UUID,

  -- Lab information
  lab_name TEXT NOT NULL,  -- 'edacious', 'texas_a&m', 'bionutrient_institute'
  lab_report_id TEXT,      -- Lab's internal report number
  analysis_type TEXT NOT NULL CHECK (analysis_type IN (
    'nutrient_density',    -- Edacious full panel
    'discovery',           -- Edacious 6-pack
    'fatty_acid_only',     -- Omega ratio focused
    'mineral_panel',       -- Minerals only
    'custom',              -- Custom selection
    'bionutrient_meter'    -- Handheld device reading
  )),
  accreditation TEXT,      -- 'ISO_17025', etc.

  -- Costs and timing
  cost_usd NUMERIC(10,2),
  sample_received_date DATE,
  report_completed_date DATE,
  turnaround_days INTEGER GENERATED ALWAYS AS (
    report_completed_date - sample_received_date
  ) STORED,

  -- Documents
  report_pdf_url TEXT,
  certificate_url TEXT,

  -- Calculated scores (denormalized for fast queries)
  nutrient_density_score NUMERIC(5,2),  -- 0-100 composite
  omega_ratio NUMERIC(5,2),             -- Calculated from fatty acids
  mineral_score NUMERIC(5,2),
  vitamin_score NUMERIC(5,2),
  contaminant_score NUMERIC(5,2),       -- Lower is better

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'received', 'processing', 'completed', 'failed'
  )),

  -- Metadata
  submitted_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lab_reports_actual ON lab_reports(actual_id);
CREATE INDEX idx_lab_reports_cultivar ON lab_reports(cultivar_id);
CREATE INDEX idx_lab_reports_lab ON lab_reports(lab_name);
CREATE INDEX idx_lab_reports_date ON lab_reports(sample_date);
CREATE INDEX idx_lab_reports_category ON lab_reports(food_category);
```

### 2. nutrients (Reference Table)

Master list of all measurable nutrients with metadata.

```sql
CREATE TABLE nutrients (
  id TEXT PRIMARY KEY,  -- 'vitamin_a', 'omega_3_dha', 'calcium'

  -- Display
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  abbreviation TEXT,    -- 'DHA', 'Ca', 'B12'

  -- Classification
  category TEXT NOT NULL CHECK (category IN (
    'proximate',        -- moisture, ash, fat, protein, carbs, calories
    'vitamin',          -- A, D, E, K, B-complex
    'mineral',          -- macro and trace minerals
    'fatty_acid',       -- all 50+ fatty acids
    'sugar',            -- glucose, fructose, etc.
    'fiber',            -- total, soluble, insoluble
    'amino_acid',       -- 18 amino acids
    'phytochemical',    -- carotenoids, phenolics, flavonoids
    'heavy_metal',      -- As, Cd, Pb, Hg
    'contaminant',      -- glyphosate, pesticides
    'other'
  )),
  subcategory TEXT,     -- 'b_vitamin', 'omega_3', 'carotenoid', etc.
  parent_nutrient_id TEXT REFERENCES nutrients(id),  -- For hierarchy

  -- Units and ranges
  default_unit TEXT NOT NULL,  -- 'mg/100g', 'ug/100g', 'g/100g', '%', 'ratio'
  typical_range_min NUMERIC,
  typical_range_max NUMERIC,
  detection_limit NUMERIC,

  -- Quality interpretation
  is_beneficial BOOLEAN DEFAULT true,  -- false for heavy metals
  is_essential BOOLEAN DEFAULT false,  -- essential nutrients
  daily_value NUMERIC,                 -- FDA daily value if applicable
  daily_value_unit TEXT,

  -- Food type applicability
  applies_to_produce BOOLEAN DEFAULT true,
  applies_to_meat BOOLEAN DEFAULT true,
  applies_to_dairy BOOLEAN DEFAULT true,
  applies_to_eggs BOOLEAN DEFAULT true,
  applies_to_seafood BOOLEAN DEFAULT true,

  -- Metadata
  cas_number TEXT,      -- Chemical Abstracts Service number
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create hierarchy index
CREATE INDEX idx_nutrients_parent ON nutrients(parent_nutrient_id);
CREATE INDEX idx_nutrients_category ON nutrients(category);
```

### 3. nutrient_values

Individual measurements from lab reports.

```sql
CREATE TABLE nutrient_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
  nutrient_id TEXT NOT NULL REFERENCES nutrients(id),

  -- Measurement
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,

  -- Quality indicators
  below_detection_limit BOOLEAN DEFAULT false,
  detection_limit NUMERIC,
  uncertainty NUMERIC,          -- ± value
  uncertainty_pct NUMERIC,      -- ± percentage

  -- Method
  analysis_method TEXT,         -- 'ICP-MS', 'HPLC', 'GC-FID', etc.

  -- Comparison (denormalized for fast queries)
  percentile_vs_category NUMERIC,  -- Where this falls vs same food category
  percentile_vs_cultivar NUMERIC,  -- Where this falls vs same cultivar

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE (lab_report_id, nutrient_id)
);

-- Indexes
CREATE INDEX idx_nutrient_values_report ON nutrient_values(lab_report_id);
CREATE INDEX idx_nutrient_values_nutrient ON nutrient_values(nutrient_id);
CREATE INDEX idx_nutrient_values_value ON nutrient_values(value);
```

### 4. fatty_acid_details (Optional: Dedicated Table)

For the 50+ fatty acids, a dedicated table enables better omega calculations.

```sql
CREATE TABLE fatty_acid_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,

  -- Individual fatty acids (g/100g fat or mg/100g food)
  -- Saturated (SFA)
  c4_0_butyric NUMERIC,
  c6_0_caproic NUMERIC,
  c8_0_caprylic NUMERIC,
  c10_0_capric NUMERIC,
  c12_0_lauric NUMERIC,
  c14_0_myristic NUMERIC,
  c16_0_palmitic NUMERIC,
  c18_0_stearic NUMERIC,
  c20_0_arachidic NUMERIC,
  c22_0_behenic NUMERIC,
  c24_0_lignoceric NUMERIC,

  -- Monounsaturated (MUFA)
  c16_1_palmitoleic NUMERIC,
  c18_1_oleic NUMERIC,
  c20_1_eicosenoic NUMERIC,
  c22_1_erucic NUMERIC,
  c24_1_nervonic NUMERIC,

  -- Polyunsaturated Omega-6
  c18_2_linoleic NUMERIC,          -- LA (parent omega-6)
  c18_3_gamma_linolenic NUMERIC,   -- GLA
  c20_2_eicosadienoic NUMERIC,
  c20_3_dihomo_gamma_linolenic NUMERIC,  -- DGLA
  c20_4_arachidonic NUMERIC,       -- AA (inflammatory)
  c22_4_adrenic NUMERIC,
  c22_5_n6_docosapentaenoic NUMERIC,

  -- Polyunsaturated Omega-3
  c18_3_alpha_linolenic NUMERIC,   -- ALA (parent omega-3)
  c18_4_stearidonic NUMERIC,       -- SDA
  c20_4_eicosatetraenoic NUMERIC,
  c20_5_eicosapentaenoic NUMERIC,  -- EPA (anti-inflammatory)
  c22_5_n3_docosapentaenoic NUMERIC,  -- DPA
  c22_6_docosahexaenoic NUMERIC,   -- DHA (brain health)

  -- Trans fats
  trans_total NUMERIC,

  -- Calculated totals
  sfa_total NUMERIC,
  mufa_total NUMERIC,
  pufa_total NUMERIC,
  omega_3_total NUMERIC,
  omega_6_total NUMERIC,
  omega_9_total NUMERIC,

  -- THE KEY RATIO
  omega_6_to_3_ratio NUMERIC GENERATED ALWAYS AS (
    CASE WHEN omega_3_total > 0 THEN omega_6_total / omega_3_total END
  ) STORED,

  -- Units
  unit TEXT DEFAULT 'g/100g',  -- or 'mg/100g', '% of fat'

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (lab_report_id)
);

CREATE INDEX idx_fatty_acid_report ON fatty_acid_details(lab_report_id);
CREATE INDEX idx_fatty_acid_omega_ratio ON fatty_acid_details(omega_6_to_3_ratio);
```

---

## Nutrient Reference Data (Seed)

### Categories and Subcategories

```typescript
const NUTRIENT_CATEGORIES = {
  proximate: {
    subcategories: ['macronutrient', 'energy'],
    nutrients: ['moisture', 'ash', 'total_fat', 'protein', 'carbohydrates', 'calories']
  },
  vitamin: {
    subcategories: ['fat_soluble', 'b_vitamin', 'other_vitamin'],
    nutrients: ['vitamin_a', 'vitamin_d', 'vitamin_e', 'vitamin_k1', 'vitamin_k2',
                'thiamin_b1', 'riboflavin_b2', 'niacin_b3', 'pantothenic_b5',
                'pyridoxine_b6', 'biotin_b7', 'folate_b9', 'cobalamin_b12', 'vitamin_c']
  },
  mineral: {
    subcategories: ['macro_mineral', 'trace_mineral'],
    nutrients: ['calcium', 'phosphorus', 'potassium', 'sodium', 'magnesium', 'sulfur',
                'iron', 'zinc', 'copper', 'manganese', 'selenium', 'cobalt', 'nickel',
                'iodine', 'chromium', 'molybdenum', 'boron']
  },
  fatty_acid: {
    subcategories: ['saturated', 'monounsaturated', 'omega_3', 'omega_6', 'omega_9', 'trans'],
    nutrients: ['sfa_total', 'mufa_total', 'pufa_total', 'omega_3_total', 'omega_6_total',
                'ala', 'epa', 'dha', 'linoleic', 'arachidonic', 'oleic']
  },
  sugar: {
    subcategories: ['simple_sugar'],
    nutrients: ['total_sugars', 'glucose', 'fructose', 'sucrose', 'lactose', 'maltose']
  },
  fiber: {
    subcategories: ['dietary_fiber'],
    nutrients: ['total_fiber', 'soluble_fiber', 'insoluble_fiber']
  },
  amino_acid: {
    subcategories: ['essential', 'non_essential', 'conditional'],
    nutrients: ['leucine', 'isoleucine', 'valine', 'lysine', 'methionine', 'phenylalanine',
                'threonine', 'tryptophan', 'histidine', 'alanine', 'arginine', 'asparagine',
                'aspartic_acid', 'cysteine', 'glutamic_acid', 'glutamine', 'glycine',
                'proline', 'serine', 'tyrosine']
  },
  phytochemical: {
    subcategories: ['carotenoid', 'phenolic', 'flavonoid', 'anthocyanin'],
    nutrients: ['beta_carotene', 'alpha_carotene', 'lycopene', 'lutein', 'zeaxanthin',
                'beta_cryptoxanthin', 'total_carotenoids', 'total_phenolics',
                'total_flavonoids', 'total_anthocyanins', 'quercetin', 'kaempferol',
                'chlorogenic_acid', 'caffeic_acid', 'ferulic_acid']
  },
  heavy_metal: {
    subcategories: ['toxic_metal'],
    nutrients: ['arsenic', 'cadmium', 'lead', 'mercury']
  },
  contaminant: {
    subcategories: ['pesticide', 'herbicide'],
    nutrients: ['glyphosate', 'pesticide_residue_count', 'total_pesticide_load']
  }
}
```

---

## API Integration

### Submit Lab Report

```typescript
interface LabReportSubmission {
  actual_id?: string
  sample_date: string
  food_category: FoodCategory
  cultivar_id?: string
  breed_id?: string
  region_id?: string

  lab_name: 'edacious' | 'texas_a_m' | 'bionutrient' | string
  lab_report_id?: string
  analysis_type: AnalysisType

  // Nutrient values
  nutrients: {
    nutrient_id: string
    value: number
    unit: string
    below_detection?: boolean
  }[]

  // Or fatty acid profile
  fatty_acids?: FattyAcidProfile

  // Documents
  report_pdf_url?: string
}
```

### Query Examples

```sql
-- Average omega ratio by breed
SELECT
  lr.breed_id,
  AVG(fad.omega_6_to_3_ratio) as avg_omega_ratio,
  COUNT(*) as sample_count
FROM lab_reports lr
JOIN fatty_acid_details fad ON lr.id = fad.lab_report_id
WHERE lr.food_category = 'meat'
GROUP BY lr.breed_id
ORDER BY avg_omega_ratio;

-- Nutrient density comparison: organic vs conventional
SELECT
  n.display_name,
  AVG(CASE WHEN a.marketing_claims_observed @> ARRAY['organic']
      THEN nv.value END) as organic_avg,
  AVG(CASE WHEN NOT (a.marketing_claims_observed @> ARRAY['organic'])
      THEN nv.value END) as conventional_avg
FROM nutrient_values nv
JOIN lab_reports lr ON nv.lab_report_id = lr.id
JOIN actuals a ON lr.actual_id = a.id
JOIN nutrients n ON nv.nutrient_id = n.id
WHERE n.category = 'mineral'
GROUP BY n.display_name;

-- Top 10 most nutrient-dense samples
SELECT
  lr.id,
  lr.sample_description,
  lr.cultivar_id,
  lr.region_id,
  lr.nutrient_density_score
FROM lab_reports lr
WHERE lr.food_category = 'produce'
  AND lr.status = 'completed'
ORDER BY lr.nutrient_density_score DESC
LIMIT 10;
```

---

## Calculated Scores

### Nutrient Density Score

Composite score (0-100) based on:

```typescript
function calculateNutrientDensityScore(report: LabReport): number {
  const weights = {
    minerals: 0.30,      // Mineral density
    vitamins: 0.25,      // Vitamin content
    phytochemicals: 0.20, // Polyphenols, carotenoids
    omega_ratio: 0.15,   // Lower omega-6:3 is better
    contaminants: 0.10   // Penalty for heavy metals
  }

  // Each subscore is 0-100, normalized to percentile vs category
  const mineralScore = calculateMineralScore(report)
  const vitaminScore = calculateVitaminScore(report)
  const phytoScore = calculatePhytochemicalScore(report)
  const omegaScore = calculateOmegaScore(report)  // 100 for ≤3:1, 0 for ≥20:1
  const contaminantPenalty = calculateContaminantPenalty(report)

  return (
    mineralScore * weights.minerals +
    vitaminScore * weights.vitamins +
    phytoScore * weights.phytochemicals +
    omegaScore * weights.omega_ratio -
    contaminantPenalty * weights.contaminants
  )
}
```

---

## Migration Path

1. **Create tables**: lab_reports, nutrients, nutrient_values, fatty_acid_details
2. **Seed nutrients**: 150+ reference nutrients with metadata
3. **Add link**: Update actuals table with `lab_report_id` FK
4. **Create API**: POST /api/lab-reports for submission
5. **Build UI**: Admin interface for entering lab results

---

## Sources

- [Edacious Analysis Catalog](https://www.edacious.com/food-lab/catalog)
- [Edacious Nutrient Density Analysis](https://www.edacious.com/food-lab/nutrient-density-analysis)
- [Edacious $8.1M Funding](https://agfundernews.com/edacious-raises-8-1m-seed-round-to-break-the-cycle-of-commoditization-by-measuring-and-mapping-nutrient-density-in-whole-foods)
