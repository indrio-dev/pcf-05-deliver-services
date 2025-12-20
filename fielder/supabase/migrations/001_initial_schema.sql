-- Fielder Database Schema
-- Initial migration: Core tables for crops, regions, and farms

-- ============================================================================
-- REFERENCE DATA (seeded from Python DataLoader)
-- ============================================================================

-- Crops
CREATE TABLE crops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'citrus', 'stone_fruit', 'pome_fruit', 'berry', 'tropical', 'nut'
    base_temp DECIMAL(5,2) NOT NULL, -- GDD base temperature (F)
    gdd_to_maturity INTEGER NOT NULL,
    gdd_to_peak INTEGER,
    gdd_window INTEGER NOT NULL,
    chill_hours_required INTEGER,
    is_climacteric BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cultivars (varieties)
CREATE TABLE cultivars (
    id TEXT PRIMARY KEY,
    crop_id TEXT NOT NULL REFERENCES crops(id),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    brix_base DECIMAL(4,1) NOT NULL, -- Base Brix potential
    timing_class TEXT NOT NULL CHECK (timing_class IN ('early', 'mid', 'late')),
    days_offset INTEGER DEFAULT 0, -- Days earlier/later than standard
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rootstocks
CREATE TABLE rootstocks (
    id TEXT PRIMARY KEY,
    crop_id TEXT NOT NULL REFERENCES crops(id),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    brix_modifier DECIMAL(3,1) DEFAULT 0, -- +/- Brix points
    vigor TEXT CHECK (vigor IN ('dwarf', 'semi-dwarf', 'standard')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Growing Regions
CREATE TABLE growing_regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DECIMAL(8,5) NOT NULL,
    longitude DECIMAL(8,5) NOT NULL,
    usda_zone TEXT,
    avg_last_frost_doy INTEGER, -- Day of year (1-365)
    avg_first_frost_doy INTEGER,
    frost_free_days INTEGER,
    annual_gdd_50 INTEGER,
    avg_chill_hours INTEGER,
    viable_crops TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crop Phenology (bloom dates by cultivar/region)
CREATE TABLE crop_phenology (
    id SERIAL PRIMARY KEY,
    crop_id TEXT NOT NULL REFERENCES crops(id),
    cultivar_id TEXT REFERENCES cultivars(id),
    region_id TEXT NOT NULL REFERENCES growing_regions(id),
    avg_bloom_doy INTEGER, -- Day of year for average bloom
    bloom_variance_days INTEGER DEFAULT 14, -- +/- days variance
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crop_id, cultivar_id, region_id)
);

-- ============================================================================
-- FARM DATA (user-managed)
-- ============================================================================

-- Farms
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region_id TEXT NOT NULL REFERENCES growing_regions(id),
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    address TEXT,
    fulfillment_options TEXT[] DEFAULT '{}', -- 'pickup', 'delivery', 'shipping'
    admin_code TEXT, -- Simple auth for MVP (hashed in production)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farm Crops (what each farm grows)
CREATE TABLE farm_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    cultivar_id TEXT NOT NULL REFERENCES cultivars(id),
    rootstock_id TEXT REFERENCES rootstocks(id),
    tree_age_years INTEGER,
    acres DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farm Availability (real-time inventory status)
CREATE TABLE farm_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_crop_id UUID NOT NULL REFERENCES farm_crops(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'off_season'
        CHECK (status IN ('upcoming', 'in_season', 'at_peak', 'ending_soon', 'off_season')),
    price_per_unit DECIMAL(8,2),
    unit TEXT, -- 'lb', 'box', 'flat', etc.
    inventory_level TEXT CHECK (inventory_level IN ('high', 'medium', 'low', 'sold_out')),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farm_crop_id)
);

-- ============================================================================
-- PREDICTIONS (computed/cached)
-- ============================================================================

-- Harvest Windows (predicted by season)
CREATE TABLE harvest_windows (
    id SERIAL PRIMARY KEY,
    crop_id TEXT NOT NULL REFERENCES crops(id),
    region_id TEXT NOT NULL REFERENCES growing_regions(id),
    year INTEGER NOT NULL,
    harvest_start DATE,
    harvest_end DATE,
    optimal_start DATE,
    optimal_end DATE,
    predicted_brix DECIMAL(4,1),
    confidence DECIMAL(3,2), -- 0.0 to 1.0
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crop_id, region_id, year)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_cultivars_crop ON cultivars(crop_id);
CREATE INDEX idx_rootstocks_crop ON rootstocks(crop_id);
CREATE INDEX idx_regions_state ON growing_regions(state);
CREATE INDEX idx_phenology_region ON crop_phenology(region_id);
CREATE INDEX idx_farms_region ON farms(region_id);
CREATE INDEX idx_farm_crops_farm ON farm_crops(farm_id);
CREATE INDEX idx_farm_crops_cultivar ON farm_crops(cultivar_id);
CREATE INDEX idx_availability_status ON farm_availability(status);
CREATE INDEX idx_harvest_windows_year ON harvest_windows(year);
CREATE INDEX idx_harvest_windows_region_year ON harvest_windows(region_id, year);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on farms
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER availability_updated_at
    BEFORE UPDATE ON farm_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
