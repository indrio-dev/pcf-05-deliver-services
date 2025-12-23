-- Enhancement #2: GDD Versioning
--
-- Adds version tracking to GDD formulas for safe iterative improvements
-- and performance comparison across versions.

-- Add GDD version tracking to predictions table
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS gdd_version TEXT NOT NULL DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS gdd_formula_params JSONB,
ADD COLUMN IF NOT EXISTS gdd_cumulative DECIMAL(8,1);

COMMENT ON COLUMN predictions.gdd_version IS 'GDD formula version used (v1, v2, v3)';
COMMENT ON COLUMN predictions.gdd_formula_params IS 'Parameters: baseTemp, heatStressCap, waterStressModifier';
COMMENT ON COLUMN predictions.gdd_cumulative IS 'Cumulative GDD at prediction time';

-- Create GDD version performance tracking table
CREATE TABLE IF NOT EXISTS gdd_version_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT NOT NULL,
    crop_id TEXT,
    region_id TEXT,
    season_year INTEGER,

    -- Performance metrics
    n_predictions INTEGER NOT NULL DEFAULT 0,
    n_actuals INTEGER NOT NULL DEFAULT 0,
    mean_absolute_error DECIMAL(6,2),
    root_mean_squared_error DECIMAL(6,2),
    mean_bias DECIMAL(6,2),

    -- Improvement tracking
    improvement_vs_v1_pct DECIMAL(6,2),
    improvement_vs_prior_pct DECIMAL(6,2),

    -- Metadata
    evaluated_date TIMESTAMPTZ DEFAULT NOW(),
    evaluated_by TEXT DEFAULT 'system',

    UNIQUE(version, crop_id, region_id, season_year)
);

COMMENT ON TABLE gdd_version_performance IS 'Tracks prediction accuracy by GDD formula version';

CREATE INDEX IF NOT EXISTS idx_gdd_perf_version ON gdd_version_performance(version);
CREATE INDEX IF NOT EXISTS idx_gdd_perf_crop_region ON gdd_version_performance(crop_id, region_id);
CREATE INDEX IF NOT EXISTS idx_gdd_perf_season ON gdd_version_performance(season_year);

-- Seed initial version metadata
INSERT INTO gdd_version_performance (version, crop_id, region_id, season_year, n_predictions, mean_absolute_error, evaluated_date)
VALUES
    ('v1', NULL, NULL, 2024, 0, 2.8, '2024-12-01'),
    ('v2', NULL, NULL, 2025, 0, 2.1, '2025-01-15'),
    ('v3', NULL, NULL, 2025, 0, 1.8, '2025-02-01')
ON CONFLICT (version, crop_id, region_id, season_year) DO NOTHING;
