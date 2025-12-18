-- Daily Predictions Table
-- Pre-computed harvest status for all offering × region combinations
-- Updated daily via cron job for fast consumer API queries

-- ============================================================================
-- DAILY PREDICTIONS (computed by cron, queried by API)
-- ============================================================================

CREATE TABLE daily_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Offering identification (matches products.ts RegionalOffering)
    offering_id TEXT NOT NULL,           -- e.g., 'honeycrisp_pacific_northwest'
    variety_id TEXT NOT NULL,            -- e.g., 'honeycrisp'
    product_id TEXT NOT NULL,            -- e.g., 'apple'
    region_id TEXT NOT NULL,             -- e.g., 'pacific_northwest'

    -- Rootstock (optional - affects harvest timing)
    rootstock_id TEXT,                   -- e.g., 'mm111', 'carrizo_citrange'
    rootstock_name TEXT,                 -- Display name
    rootstock_vigor TEXT,                -- 'dwarf', 'semi-dwarf', 'standard'
    -- Rootstock can shift harvest window +/- days
    rootstock_days_offset INTEGER DEFAULT 0,

    -- Computed date (predictions are date-specific)
    computed_date DATE NOT NULL,

    -- Status
    status TEXT NOT NULL CHECK (status IN ('at_peak', 'in_season', 'approaching', 'off_season')),
    status_message TEXT,
    days_until_start INTEGER,            -- NULL if already started
    days_until_peak INTEGER,             -- NULL if already at/past peak
    days_until_end INTEGER,              -- NULL if ended

    -- Harvest window dates
    harvest_start DATE,
    harvest_end DATE,
    optimal_start DATE,
    optimal_end DATE,

    -- GDD data (for GDD-based products)
    current_gdd INTEGER,
    gdd_to_maturity INTEGER,
    avg_daily_gdd DECIMAL(5,2),

    -- Quality indicators
    quality_tier TEXT CHECK (quality_tier IN ('exceptional', 'excellent', 'good')),
    brix DECIMAL(4,1),
    acidity DECIMAL(4,2),
    brix_acid_ratio DECIMAL(5,1),

    -- Product categorization (denormalized for filtering)
    category TEXT NOT NULL,              -- 'fruit', 'vegetable', 'nut', etc.
    subcategory TEXT NOT NULL,           -- 'citrus', 'stone_fruit', etc.
    model_type TEXT NOT NULL,            -- 'gdd', 'calendar', 'parent'

    -- Variety flags (denormalized for filtering)
    is_heritage BOOLEAN DEFAULT FALSE,
    is_non_gmo BOOLEAN DEFAULT FALSE,

    -- Display info (denormalized for API response)
    product_display_name TEXT NOT NULL,
    variety_display_name TEXT NOT NULL,
    region_display_name TEXT NOT NULL,
    state TEXT NOT NULL,
    region_lat DECIMAL(8,5) NOT NULL,
    region_lon DECIMAL(8,5) NOT NULL,
    flavor_profile TEXT,
    flavor_notes TEXT,

    -- Prediction confidence
    confidence DECIMAL(3,2) DEFAULT 0.80,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one prediction per offering per day
    UNIQUE(offering_id, computed_date)
);

-- ============================================================================
-- INDEXES for fast filtering
-- ============================================================================

-- Primary query pattern: today's predictions, filtered by status
CREATE INDEX idx_predictions_date_status ON daily_predictions(computed_date, status);

-- Filter by category/subcategory
CREATE INDEX idx_predictions_category ON daily_predictions(computed_date, category);
CREATE INDEX idx_predictions_subcategory ON daily_predictions(computed_date, subcategory);

-- Filter by region/state
CREATE INDEX idx_predictions_region ON daily_predictions(computed_date, region_id);
CREATE INDEX idx_predictions_state ON daily_predictions(computed_date, state);

-- Filter by product type
CREATE INDEX idx_predictions_product ON daily_predictions(computed_date, product_id);
CREATE INDEX idx_predictions_variety ON daily_predictions(computed_date, variety_id);

-- Quality tier filtering
CREATE INDEX idx_predictions_quality ON daily_predictions(computed_date, quality_tier);

-- Heritage/Non-GMO filtering
CREATE INDEX idx_predictions_heritage ON daily_predictions(computed_date, is_heritage) WHERE is_heritage = TRUE;
CREATE INDEX idx_predictions_non_gmo ON daily_predictions(computed_date, is_non_gmo) WHERE is_non_gmo = TRUE;

-- Cleanup: remove old predictions (keep 7 days for debugging)
CREATE INDEX idx_predictions_cleanup ON daily_predictions(computed_date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get current season based on date
CREATE OR REPLACE FUNCTION get_season(check_date DATE)
RETURNS TEXT AS $$
DECLARE
    month_num INTEGER;
BEGIN
    month_num := EXTRACT(MONTH FROM check_date);
    CASE
        WHEN month_num IN (3, 4, 5) THEN RETURN 'spring';
        WHEN month_num IN (6, 7, 8) THEN RETURN 'summer';
        WHEN month_num IN (9, 10, 11) THEN RETURN 'fall';
        ELSE RETURN 'winter';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to cleanup old predictions (called by cron)
CREATE OR REPLACE FUNCTION cleanup_old_predictions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM daily_predictions
    WHERE computed_date < CURRENT_DATE - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (optional - enable if needed)
-- ============================================================================

-- ALTER TABLE daily_predictions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON daily_predictions FOR SELECT USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE daily_predictions IS 'Pre-computed daily harvest predictions for consumer discovery API';
COMMENT ON COLUMN daily_predictions.offering_id IS 'Unique identifier matching RegionalOffering in products.ts';
COMMENT ON COLUMN daily_predictions.status IS 'Current harvest status: at_peak (best quality), in_season (available), approaching (within 30 days), off_season';
COMMENT ON COLUMN daily_predictions.quality_tier IS 'Expected quality for this variety in this region: exceptional, excellent, good';
COMMENT ON COLUMN daily_predictions.model_type IS 'Prediction model type: gdd (Growing Degree Days), calendar (fixed seasonal), parent (derived from parent product)';
