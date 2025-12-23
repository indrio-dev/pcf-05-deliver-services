-- Enhancement #1: Uncertainty Distributions
--
-- Adds probability distribution columns to predictions for explicit
-- uncertainty quantification and transparent risk assessment.

-- Add distribution columns to predictions table
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS brix_distribution_mean DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_median DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_std_dev DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_p5 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_p25 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_p75 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_p95 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_iqr DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS brix_distribution_method TEXT CHECK (brix_distribution_method IN ('parametric', 'monte_carlo', 'empirical')),
ADD COLUMN IF NOT EXISTS uncertainty_breakdown JSONB;

COMMENT ON COLUMN predictions.brix_distribution_mean IS 'Mean of Brix probability distribution';
COMMENT ON COLUMN predictions.brix_distribution_p25 IS '25th percentile (conservative estimate)';
COMMENT ON COLUMN predictions.brix_distribution_p50 IS 'Median Brix (50th percentile)';
COMMENT ON COLUMN predictions.brix_distribution_p75 IS '75th percentile (optimistic estimate)';
COMMENT ON COLUMN predictions.brix_distribution_iqr IS 'Interquartile range (p75 - p25)';
COMMENT ON COLUMN predictions.uncertainty_breakdown IS 'Variance components: cultivar, region, practice, timing, measurement';

-- Add measurement uncertainty to actuals
ALTER TABLE actuals
ADD COLUMN IF NOT EXISTS measurement_uncertainty DECIMAL(4,2) DEFAULT 0.2;

COMMENT ON COLUMN actuals.measurement_uncertainty IS 'Measurement error (typically ±0.2 Brix for refractometer)';

-- Create index for distribution queries
CREATE INDEX IF NOT EXISTS idx_predictions_p25 ON predictions(brix_distribution_p25);
CREATE INDEX IF NOT EXISTS idx_predictions_iqr ON predictions(brix_distribution_iqr);
