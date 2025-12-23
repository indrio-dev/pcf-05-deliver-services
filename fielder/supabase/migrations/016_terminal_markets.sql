-- Enhancement #4: Terminal Market Integration
--
-- Creates tables for USDA AMS terminal market data, commodity quality
-- predictions, and harvest observations.

-- Terminal market reports (raw USDA data)
CREATE TABLE IF NOT EXISTS terminal_market_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    report_date DATE NOT NULL,
    terminal_market TEXT NOT NULL,

    -- Product
    commodity TEXT NOT NULL,
    variety TEXT,
    cultivar_specified BOOLEAN NOT NULL DEFAULT FALSE,
    cultivar_explicit TEXT,

    -- Origin
    origin_state TEXT NOT NULL,
    origin_region TEXT,

    -- Package/sizing
    package_type TEXT NOT NULL,
    size_class TEXT,

    -- USDA grading
    usda_grade TEXT,
    quality_descriptor TEXT,

    -- Pricing
    price_low DECIMAL(8,2),
    price_high DECIMAL(8,2),
    price_most_low DECIMAL(8,2),
    price_most_high DECIMAL(8,2),

    -- Market signals
    volume_indicator TEXT,
    market_trend TEXT,

    -- Transit
    estimated_harvest_date DATE,
    estimated_transit_days INTEGER,

    -- Raw data
    report_text TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(report_date, terminal_market, commodity, variety, cultivar_explicit, origin_state, package_type, size_class)
);

COMMENT ON TABLE terminal_market_reports IS 'USDA AMS terminal market price and availability reports';

CREATE INDEX IF NOT EXISTS idx_terminal_date ON terminal_market_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_terminal_origin ON terminal_market_reports(origin_state, commodity);
CREATE INDEX IF NOT EXISTS idx_terminal_cultivar_specified ON terminal_market_reports(cultivar_specified);
CREATE INDEX IF NOT EXISTS idx_terminal_market ON terminal_market_reports(terminal_market);

-- Commodity quality predictions (inferred from terminal reports)
CREATE TABLE IF NOT EXISTS commodity_quality_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    terminal_report_id UUID NOT NULL REFERENCES terminal_market_reports(id) ON DELETE CASCADE,

    -- Inference results
    inferred_region_id TEXT NOT NULL,
    inferred_cultivar_id TEXT NOT NULL,
    inference_method TEXT CHECK (inference_method IN ('temporal_gdd_proximity', 'static_market_share', 'explicit_cultivar')),
    cultivar_probability DECIMAL(3,2),
    inference_reasoning TEXT,

    -- GDD
    calculated_gdd DECIMAL(8,1),
    gdd_version TEXT,

    -- Predictions
    predicted_brix DECIMAL(4,2),
    predicted_brix_distribution JSONB,
    predicted_quality_tier TEXT,

    -- Assumptions (terminal reports lack farm details)
    assumed_practices JSONB,
    assumed_rootstock TEXT,
    assumed_tree_age INTEGER,

    prediction_date TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(terminal_report_id, inferred_cultivar_id)
);

COMMENT ON TABLE commodity_quality_predictions IS 'Quality predictions for commodity shipments using temporal inference';

CREATE INDEX IF NOT EXISTS idx_commodity_pred_cultivar ON commodity_quality_predictions(inferred_cultivar_id);
CREATE INDEX IF NOT EXISTS idx_commodity_pred_region ON commodity_quality_predictions(inferred_region_id);
CREATE INDEX IF NOT EXISTS idx_commodity_pred_date ON commodity_quality_predictions(prediction_date);

-- Harvest observations (extracted from terminal reports)
CREATE TABLE IF NOT EXISTS harvest_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    cultivar_id TEXT NOT NULL,
    region_id TEXT NOT NULL,
    season_year INTEGER NOT NULL,

    observation_date DATE NOT NULL,
    observation_type TEXT CHECK (observation_type IN ('first_harvest', 'peak_start', 'peak_end', 'last_harvest')),
    observation_source TEXT CHECK (observation_source IN ('terminal_market', 'farm_report', 'extension_service')),

    terminal_report_id UUID REFERENCES terminal_market_reports(id) ON DELETE SET NULL,

    confidence DECIMAL(3,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(cultivar_id, region_id, season_year, observation_type, observation_source)
);

COMMENT ON TABLE harvest_observations IS 'Observed harvest timing events for calibrating R pillar predictions';

CREATE INDEX IF NOT EXISTS idx_harvest_obs_cultivar_region ON harvest_observations(cultivar_id, region_id);
CREATE INDEX IF NOT EXISTS idx_harvest_obs_season ON harvest_observations(season_year);
CREATE INDEX IF NOT EXISTS idx_harvest_obs_type ON harvest_observations(observation_type);
