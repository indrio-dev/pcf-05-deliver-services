-- Enhancement #3: Regional Practice Priors
--
-- Stores regional probability distributions for agricultural practices.
-- Used for inference when farm-specific data is missing.

CREATE TABLE IF NOT EXISTS regional_practice_priors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    region_id TEXT NOT NULL,
    crop_category TEXT NOT NULL,

    -- Practice distributions (JSONB for flexibility)
    fertility_strategy_dist JSONB,
    pest_management_dist JSONB,
    feeding_regime_dist JSONB,

    -- Sample metadata
    n_farms_in_sample INTEGER NOT NULL,
    data_source TEXT,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

    -- Versioning
    derived_date TIMESTAMPTZ DEFAULT NOW(),
    derived_by TEXT DEFAULT 'system',

    UNIQUE(region_id, crop_category)
);

COMMENT ON TABLE regional_practice_priors IS 'Regional probability distributions for practice inference';
COMMENT ON COLUMN regional_practice_priors.fertility_strategy_dist IS 'Distribution: annual_fertility, soil_banking, mineralized_soil_science (affects Brix via soil)';
COMMENT ON COLUMN regional_practice_priors.pest_management_dist IS 'DEPRECATED: Pest management does not affect Brix/nutrition (separate axis)';
COMMENT ON COLUMN regional_practice_priors.feeding_regime_dist IS 'Distribution: grass_only, pasture_grain_supp, grain_finished, grain_fed (affects omega ratio)';

CREATE INDEX IF NOT EXISTS idx_regional_priors_region ON regional_practice_priors(region_id);
CREATE INDEX IF NOT EXISTS idx_regional_priors_crop ON regional_practice_priors(crop_category);
CREATE INDEX IF NOT EXISTS idx_regional_priors_confidence ON regional_practice_priors(confidence);

-- Seed national defaults for major crop categories
INSERT INTO regional_practice_priors (region_id, crop_category, fertility_strategy_dist, pest_management_dist, n_farms_in_sample, data_source, confidence)
VALUES
    -- Citrus (national baseline)
    ('national', 'citrus',
     '{"annual_fertility": 0.65, "soil_banking": 0.25, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.40, "ipm": 0.35, "organic": 0.20, "no_spray": 0.05}'::jsonb,
     1000, 'usda_nass_2022', 0.60),

    -- Stone fruit
    ('national', 'stone_fruit',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.35, "ipm": 0.40, "organic": 0.20, "no_spray": 0.05}'::jsonb,
     800, 'usda_nass_2022', 0.60),

    -- Pome fruit (apples, pears)
    ('national', 'pome_fruit',
     '{"annual_fertility": 0.55, "soil_banking": 0.35, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.30, "ipm": 0.45, "organic": 0.20, "no_spray": 0.05}'::jsonb,
     1200, 'usda_nass_2022', 0.60),

    -- Berries
    ('national', 'berries',
     '{"annual_fertility": 0.50, "soil_banking": 0.35, "mineralized_soil_science": 0.15}'::jsonb,
     '{"conventional": 0.25, "ipm": 0.40, "organic": 0.30, "no_spray": 0.05}'::jsonb,
     600, 'usda_nass_2022', 0.60),

    -- General (fallback)
    ('national', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.35, "ipm": 0.40, "organic": 0.20, "no_spray": 0.05}'::jsonb,
     5000, 'usda_nass_2022', 0.60)

ON CONFLICT (region_id, crop_category) DO NOTHING;

-- Seed state-level priors from Knowledge Graph analysis (December 2025)
-- These override national defaults with actual observed patterns
INSERT INTO regional_practice_priors (region_id, crop_category, fertility_strategy_dist, pest_management_dist, n_farms_in_sample, data_source, confidence)
VALUES
    -- Top states with high sample sizes (500+)
    ('state_ny', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.649, "ipm": 0.35, "organic": 0.001}'::jsonb,
     838, 'fielder_kg_2025_12_22', 0.85),

    ('state_ca', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.644, "ipm": 0.35, "organic": 0.006}'::jsonb,
     804, 'fielder_kg_2025_12_22', 0.85),

    ('state_mi', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.649, "ipm": 0.35, "organic": 0.001}'::jsonb,
     737, 'fielder_kg_2025_12_22', 0.85),

    ('state_fl', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.646, "ipm": 0.35, "organic": 0.004}'::jsonb,
     714, 'fielder_kg_2025_12_22', 0.85),

    ('state_nc', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.649, "ipm": 0.35, "organic": 0.001}'::jsonb,
     670, 'fielder_kg_2025_12_22', 0.85),

    ('state_pa', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.650, "ipm": 0.35, "organic": 0.000}'::jsonb,
     623, 'fielder_kg_2025_12_22', 0.85),

    ('state_wi', 'general',
     '{"annual_fertility": 0.60, "soil_banking": 0.30, "mineralized_soil_science": 0.10}'::jsonb,
     '{"conventional": 0.641, "ipm": 0.35, "organic": 0.009}'::jsonb,
     542, 'fielder_kg_2025_12_22', 0.85)

ON CONFLICT (region_id, crop_category) DO NOTHING;
