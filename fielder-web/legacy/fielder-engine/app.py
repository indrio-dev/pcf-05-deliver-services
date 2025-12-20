#!/usr/bin/env python3
"""
Fielder Web Application - Consumer Discovery Interface

A simple Flask app for discovering what's in season near you.

The key insight: Consumers don't know bloom dates. They want to know:
- "What's at peak quality RIGHT NOW in my region?"
- "When will X be in season?"

We use typical bloom dates + regional weather to predict harvest windows.

Run: python app.py
Then open: http://localhost:5000
"""

from datetime import date, timedelta
from flask import Flask, render_template_string, request, jsonify
import sys

sys.path.insert(0, '/home/alex/projects/fielder_project')

from fielder.services import WeatherService, QualityPredictor
from fielder.services.data_loader import DataLoader
from fielder.models import CROP_GDD_TARGETS, get_gdd_targets
from fielder.models.region import US_GROWING_REGIONS
from fielder.models.cultivar_database import CultivarDatabase

app = Flask(__name__)


# =============================================================================
# BLOOM DATES AND GDD THRESHOLDS - Extension data + research
# =============================================================================
# Bloom dates: From UF/IFAS Flower Bud Induction Advisory and extension sources
# GDD thresholds: From agricultural research (base temps vary by crop)
#
# The prediction model:
# 1. Start from observed/predicted bloom date
# 2. Fetch actual weather data from bloom to today
# 3. Calculate GDD accumulation
# 4. Compare to established GDD thresholds for maturity/peak
# 5. Project forward using forecast + climatology
#
# Sources:
# - UF/IFAS: https://crec.ifas.ufl.edu/research/citrus-production/flower-bud-induction/
# - NSW DPI: https://www.dpi.nsw.gov.au/agriculture/horticulture/citrus/
# - UC Davis: Various citrus/stone fruit publications
#
# Format: crop -> region_type -> {
#     bloom: (month, day),           # Predicted/typical bloom date
#     gdd_base: float,               # Base temperature for GDD calculation (F)
#     gdd_to_maturity: int,          # GDD from bloom to harvestable
#     gdd_to_peak: int,              # GDD from bloom to peak quality
#     gdd_window: int,               # GDD range for harvest window
#     source: str                    # Data source
# }

# Crop phenology data: bloom dates + GDD requirements from research
# GDD calculated from bloom date using actual weather data
CROP_PHENOLOGY = {
    # === CITRUS (base temp 55°F / 12.8°C) ===
    # Florida citrus bloom: mid-Feb to mid-March (UF/IFAS Flower Bud Induction Advisory)
    # 2024-25 predicted blooms: Umatilla Mar 8/17, Immokalee Mar 14/26, St. Lucie Mar 14/25
    "navel_orange": {
        "florida": {
            "bloom": (3, 15),           # Mid-March (UF/IFAS 2024-25 prediction)
            "gdd_base": 55.0,           # Standard citrus base temp
            "gdd_to_maturity": 5100,    # ~Nov 1 at 22 GDD/day = 230 days
            "gdd_to_peak": 6100,        # ~Dec 15 peak quality
            "gdd_window": 2000,         # Nov 1-Jan 31 = ~90 days * 22 GDD/day = 2000 GDD
            "source": "UF/IFAS, validated against actual harvest dates"
        },
        "california": {
            "bloom": (3, 1),
            "gdd_base": 55.0,
            "gdd_to_maturity": 4800,
            "gdd_to_peak": 5800,
            "gdd_window": 1500,         # Longer CA window
            "source": "UC Davis Citrus"
        }
    },
    "valencia": {
        "florida": {
            "bloom": (3, 1),            # Early March
            "gdd_base": 55.0,
            "gdd_to_maturity": 8000,    # ~13 months to March harvest
            "gdd_to_peak": 9000,        # April-May peak (14 months)
            "gdd_window": 2200,         # March-June = long window (~100 days)
            "source": "UF/IFAS - Valencia is LATE season (13-14 months)"
        }
    },
    "grapefruit": {
        "florida": {
            # FL grapefruit: bloom March, harvest Nov-May, PEAK Jan-Mar (Feb center)
            # At 22 GDD/day: Nov 1 = 245 days = 5390 GDD, Feb 1 = 337 days = 7400 GDD
            # Optimal window is middle 50%, so peak should be ~Feb 15 (center of Jan-Mar)
            "bloom": (3, 1),
            "gdd_base": 55.0,
            "gdd_to_maturity": 5400,    # November start
            "gdd_to_peak": 7800,        # Feb 15 peak (center of Jan-Mar)
            "gdd_window": 4400,         # Nov-May = 180 days
            "source": "UF/IFAS"
        },
        "texas": {
            # Texas grapefruit: Oct-Mar harvest, peak Dec-Feb (Jan center)
            # Warmer climate, faster accumulation ~25 GDD/day
            # Need optimal window to start in December, center in January
            "bloom": (3, 1),
            "gdd_base": 55.0,
            "gdd_to_maturity": 5200,    # October start (210 days)
            "gdd_to_peak": 8500,        # Jan 15 peak (320 days at 25 GDD/day)
            "gdd_window": 5000,         # Oct-Mar = 180 days
            "source": "Texas A&M AgriLife"
        }
    },
    "satsuma": {
        "florida": {
            "bloom": (3, 15),
            "gdd_base": 55.0,
            "gdd_to_maturity": 4600,    # Early - October start (~210 days)
            "gdd_to_peak": 5100,        # Oct-Nov peak (~230 days)
            "gdd_window": 700,          # Shorter window (~30 days)
            "source": "UF/IFAS - Early season citrus"
        }
    },
    "tangerine": {
        "florida": {
            "bloom": (3, 20),
            "gdd_base": 55.0,
            "gdd_to_maturity": 5300,    # November start (~240 days)
            "gdd_to_peak": 5700,        # December peak (~260 days)
            "gdd_window": 900,          # ~40 days
            "source": "UF/IFAS"
        }
    },

    # === STONE FRUIT (base temp 40-45°F) ===
    "peach": {
        "georgia": {
            "bloom": (3, 15),
            "gdd_base": 45.0,
            "gdd_to_maturity": 1800,    # ~90-100 days at ~20 GDD/day
            "gdd_to_peak": 2000,
            "gdd_window": 400,
            "source": "UGA Extension"
        },
        "california": {
            "bloom": (3, 1),
            "gdd_base": 45.0,
            "gdd_to_maturity": 1700,
            "gdd_to_peak": 1900,
            "gdd_window": 600,
            "source": "UC Davis"
        },
        "texas": {
            "bloom": (3, 1),
            "gdd_base": 45.0,
            "gdd_to_maturity": 1600,
            "gdd_to_peak": 1800,
            "gdd_window": 500,
            "source": "Texas A&M"
        }
    },
    "sweet_cherry": {
        "washington": {
            "bloom": (4, 10),
            "gdd_base": 40.0,
            "gdd_to_maturity": 1200,    # ~60 days
            "gdd_to_peak": 1400,
            "gdd_window": 300,          # Short window
            "source": "WSU Extension"
        },
        "california": {
            "bloom": (3, 15),
            "gdd_base": 40.0,
            "gdd_to_maturity": 1100,
            "gdd_to_peak": 1300,
            "gdd_window": 250,
            "source": "UC Davis"
        },
        "michigan": {
            "bloom": (5, 1),
            "gdd_base": 40.0,
            "gdd_to_maturity": 1000,
            "gdd_to_peak": 1200,
            "gdd_window": 200,
            "source": "MSU Extension"
        }
    },
    "tart_cherry": {
        "michigan": {
            # VALIDATED: Zavalloni et al. 2006, J. Amer. Soc. Hort. Sci. 131(5):601-607
            # 'Montmorency' sour cherry, base 4°C (39.2°F), R²=0.971 for fruit growth
            "bloom": (5, 8),            # Full bloom ~ May 8 (120 GDD from Mar 1 + 123 GDD to bloom)
            "gdd_base": 39.2,           # 4°C - Eisensmith et al. 1980, 1982
            "gdd_to_maturity": 850,     # ~85% of final size from full bloom
            "gdd_to_peak": 1000,        # 100% final size at ~1000 GDD from full bloom
            "gdd_window": 150,          # Short window - tart cherries processed quickly
            "source": "MSU/JASHS Zavalloni et al. 2006 - validated model"
        }
    },

    # === POME FRUIT (base temp 40-43°F) ===
    "apple": {
        "washington": {
            "bloom": (4, 20),
            "gdd_base": 43.0,
            "gdd_to_maturity": 2000,    # ~120 days
            "gdd_to_peak": 2400,
            "gdd_window": 600,
            "source": "WSU Extension"
        },
        "michigan": {
            "bloom": (5, 1),
            "gdd_base": 43.0,
            "gdd_to_maturity": 1900,
            "gdd_to_peak": 2200,
            "gdd_window": 500,
            "source": "MSU Extension"
        },
        "new_york": {
            "bloom": (5, 1),
            "gdd_base": 43.0,
            "gdd_to_maturity": 1900,
            "gdd_to_peak": 2200,
            "gdd_window": 500,
            "source": "Cornell Extension"
        }
    },
    "pear": {
        "washington_oregon": {
            # Hood River: bloom early April, Bartlett harvest mid-Aug, Anjou Sept-Oct
            # ~140 days bloom to harvest at ~18 GDD/day (base 40F) = 2520 GDD
            "bloom": (4, 5),
            "gdd_base": 40.0,
            "gdd_to_maturity": 2400,        # Mid-August (Bartlett)
            "gdd_to_peak": 2700,            # Late Aug/early Sept optimal
            "gdd_window": 800,              # Aug-Oct window (Bartlett through Comice)
            "source": "OSU/WSU Extension - Hood River Valley"
        },
        "california": {
            # Sacramento Valley: earlier bloom, earlier harvest
            "bloom": (3, 15),
            "gdd_base": 40.0,
            "gdd_to_maturity": 2200,
            "gdd_to_peak": 2500,
            "gdd_window": 700,
            "source": "UC Davis"
        }
    },

    # === BERRIES ===
    "strawberry": {
        "florida": {
            # FL strawberries: Plant Sept, first harvest Dec, peak Jan-Feb, ends March
            # Central FL winter: avg high 72F, low 50F → avg 61F → ~11 GDD/day (base 50)
            # Oct 1 to Dec 1 = 60 days × 11 = 660 GDD
            # Oct 1 to Jan 15 = 105 days × 11 = 1155 GDD
            # Oct 1 to Feb 1 = 122 days × 11 = 1342 GDD
            # Oct 1 to Feb 15 = 135 days × 11 = 1485 GDD (center of Jan-Feb peak)
            # Oct 1 to Mar 15 = 165 days × 11 = 1815 GDD
            # Optimal = middle 50% of window, so if peak is Feb 15, window needs to extend to Jan-Mar
            "bloom": (10, 1),           # Fall planting
            "gdd_base": 50.0,
            "gdd_to_maturity": 660,     # December 1 start (~60 days)
            "gdd_to_peak": 1485,        # Feb 15 = center of Jan-Feb peak (135 days)
            "gdd_window": 1400,         # Dec-Mar = ~127 days wide
            "source": "UF/IFAS - Plant City region"
        },
        "california": {
            "bloom": (2, 1),
            "gdd_base": 50.0,
            "gdd_to_maturity": 900,
            "gdd_to_peak": 1100,
            "gdd_window": 800,          # Long CA season
            "source": "UC Davis"
        }
    },
    "blueberry": {
        "florida": {
            "bloom": (3, 1),
            "gdd_base": 45.0,
            "gdd_to_maturity": 600,     # Early crop
            "gdd_to_peak": 800,
            "gdd_window": 300,
            "source": "UF/IFAS"
        },
        "michigan": {
            "bloom": (5, 15),
            "gdd_base": 45.0,
            "gdd_to_maturity": 1000,
            "gdd_to_peak": 1200,
            "gdd_window": 400,
            "source": "MSU Extension"
        },
        "new_jersey": {
            "bloom": (5, 1),
            "gdd_base": 45.0,
            "gdd_to_maturity": 900,
            "gdd_to_peak": 1100,
            "gdd_window": 350,
            "source": "Rutgers Extension"
        }
    },

    # === TROPICAL/SUBTROPICAL ===
    "mango": {
        "florida": {
            "bloom": (2, 15),
            "gdd_base": 60.0,           # Higher base for tropical
            "gdd_to_maturity": 2500,
            "gdd_to_peak": 3000,
            "gdd_window": 600,
            "source": "UF/IFAS - Homestead region"
        }
    },
    "pomegranate": {
        "california": {
            # Bloom mid-April, harvest Sept-Nov, peak Oct-Nov
            # Central Valley: May-Aug avg high 95F, low 60F → avg 77.5F → ~27.5 GDD/day (base 50)
            # Sept-Nov: avg high 80F, low 50F → avg 65F → ~15 GDD/day
            # Apr 15 to Sep 1 = 138 days × 27.5 = 3795 GDD (but hot months are ~30 GDD)
            # Apr 15 to Oct 15 = 183 days → ~4300 GDD
            # Apr 15 to Nov 15 = 214 days → ~4800 GDD
            "bloom": (4, 15),
            "gdd_base": 50.0,
            "gdd_to_maturity": 3800,    # September start (138 days)
            "gdd_to_peak": 4500,        # October-November peak
            "gdd_window": 1000,         # Sept-Nov = ~75 days
            "source": "UC Davis"
        }
    },

    # === NUTS ===
    "pecan": {
        "texas": {
            "bloom": (4, 1),
            "gdd_base": 65.0,           # High base temp for pecans
            "gdd_to_maturity": 2400,
            "gdd_to_peak": 2800,
            "gdd_window": 600,
            "source": "Texas A&M"
        },
        "georgia": {
            "bloom": (4, 1),
            "gdd_base": 65.0,
            "gdd_to_maturity": 2300,
            "gdd_to_peak": 2700,
            "gdd_window": 550,
            "source": "UGA Extension"
        }
    },
}


def get_region_harvest_type(region_id: str) -> str:
    """Map region_id to harvest window lookup key."""
    region_mapping = {
        # Florida
        "indian_river": "florida",
        "central_florida": "florida",
        "south_florida": "florida",
        "sweet_valley": "florida",
        # Texas
        "texas_rgv": "texas",
        "texas_hill_country": "texas",
        "texas_pecan_belt": "texas",
        # California
        "california_central_valley": "california",
        "california_coastal": "california",
        "california_southern_desert": "california",
        # Pacific NW
        "pacific_nw_yakima": "washington",
        "pacific_nw_wenatchee": "washington",
        "pacific_nw_hood_river": "washington_oregon",
        # Midwest
        "michigan_west": "michigan",
        "michigan_southwest": "michigan",
        "wisconsin_door_county": "michigan",
        # Northeast
        "new_york_hudson_valley": "new_york",
        "new_york_finger_lakes": "new_york",
        "pennsylvania_adams_county": "new_york",
        "new_jersey_pine_barrens": "new_jersey",
        # Georgia
        "georgia_piedmont": "georgia",
    }
    return region_mapping.get(region_id, "default")


def get_crop_phenology(crop_id: str, region_id: str) -> dict:
    """
    Get crop phenology data (bloom date + GDD thresholds) for a crop/region.

    Returns dict with: bloom, gdd_base, gdd_to_maturity, gdd_to_peak, gdd_window, source
    Falls back to generic GDD targets if no region-specific data exists.
    """
    harvest_type = get_region_harvest_type(region_id)

    if crop_id in CROP_PHENOLOGY:
        crop_data = CROP_PHENOLOGY[crop_id]

        # Try exact match first
        if harvest_type in crop_data:
            return crop_data[harvest_type]

        # Try first available region as fallback
        if crop_data:
            first_key = list(crop_data.keys())[0]
            return crop_data[first_key]

    # Fallback to generic GDD targets from weather.py
    targets = get_gdd_targets(crop_id)
    return {
        "bloom": (4, 1),  # Default April 1
        "gdd_base": targets.get("base_temp", 50.0),
        "gdd_to_maturity": targets.get("gdd_to_maturity", 2000),
        "gdd_to_peak": targets.get("gdd_to_peak", 2300),
        "gdd_window": targets.get("gdd_window", 400),
        "source": "Generic defaults"
    }


# Legacy bloom dates for backward compatibility (derived from established windows)
TYPICAL_BLOOM_DATES = {
    "navel_orange": {"south": (3, 15), "default": (3, 10)},
    "valencia": {"south": (3, 1), "default": (3, 1)},
    "grapefruit": {"south": (3, 1), "default": (3, 5)},
    "tangerine": {"south": (3, 20), "default": (3, 15)},
    "satsuma": {"south": (3, 15), "default": (3, 10)},
    "peach": {"south": (3, 1), "default": (4, 1)},
    "sweet_cherry": {"west": (4, 1), "default": (4, 15)},
    "tart_cherry": {"north": (5, 5), "default": (5, 1)},
    "cherry": {"west": (4, 1), "default": (4, 15)},
    "apple": {"north": (5, 1), "west": (4, 20), "default": (4, 15)},
    "pear": {"west": (4, 1), "default": (4, 10)},
    "strawberry": {"south": (10, 1), "default": (4, 1)},
    "blueberry": {"south": (3, 1), "default": (5, 1)},
    "mango": {"south": (2, 15), "default": (3, 1)},
    "pomegranate": {"west": (4, 15), "default": (4, 20)},
    "pecan": {"south": (4, 1), "default": (4, 15)},
}


def get_region_type(region_id: str) -> str:
    """Classify region for bloom date lookup."""
    region = US_GROWING_REGIONS.get(region_id)
    if not region:
        return "default"

    lat = region.latitude
    state = region.state

    if state in ["FL", "TX"] or lat < 32:
        return "south"
    elif state in ["CA", "OR", "WA"]:
        return "west"
    elif lat > 42:
        return "north"
    return "default"


def get_typical_bloom_date(crop_id: str, region_id: str, year: int = None) -> date:
    """Get typical bloom date for a crop in a region."""
    if year is None:
        year = date.today().year

    bloom_info = TYPICAL_BLOOM_DATES.get(crop_id, {"default": (4, 15)})
    region_type = get_region_type(region_id)

    # Get month/day for this region type, or default
    month, day = bloom_info.get(region_type, bloom_info.get("default", (4, 15)))

    return date(year, month, day)


def estimate_avg_daily_gdd(crop_id: str, region_id: str) -> float:
    """
    Estimate average daily GDD for a crop in a region.

    Uses the region's annual_gdd_50 from ClimateData and scales based on
    known crop development times. Calibrated against actual harvest timing.

    Key calibration points:
    - Citrus in Florida (Zone 10): bloom March, peak December = ~270 days for 2300 GDD = 8.5/day
    - Peaches in Georgia (Zone 8): bloom March, harvest July = ~120 days for 2000 GDD = 16.7/day
    - Apples in WA (Zone 6): bloom April, harvest October = ~180 days for 2500 GDD = 13.9/day
    """
    targets = get_gdd_targets(crop_id)
    crop_base_temp = targets.get("base_temp", 50.0)
    gdd_to_peak = targets.get("gdd_to_peak", 2000)
    region = US_GROWING_REGIONS.get(region_id)

    if not region:
        return 10.0  # Safe default

    # Use the region's annual GDD (base 50F) from climate data
    annual_gdd_50 = region.climate.annual_gdd_50 or 2500
    frost_free_days = region.climate.frost_free_days or 200
    usda_zone = region.climate.usda_zone

    # Get zone number for calibration
    zone_num = int(usda_zone.value) if usda_zone else 7

    # Base daily GDD varies by zone (warmer zones = higher GDD potential)
    # These are calibrated for base 50F
    zone_base_gdd = {
        5: 12.0, 6: 14.0, 7: 16.0, 8: 18.0, 9: 20.0, 10: 22.0
    }
    daily_gdd_50 = zone_base_gdd.get(zone_num, annual_gdd_50 / frost_free_days)

    # Adjust for crop base temperature
    # Each 5°F above 50 reduces effective GDD by about 5 per day
    base_diff = crop_base_temp - 50.0
    crop_daily_gdd = daily_gdd_50 - base_diff

    # Citrus correction: high base temp + very long development (6-14 months)
    # Citrus develops through fall/winter when daily GDD is much lower
    if crop_base_temp >= 55.0:
        # Satsumas: bloom Mar, peak Oct-Nov = 210-240 days, need 1900 GDD = 8-9/day
        # Navels: bloom Mar, peak Dec = 270 days, need 2330 GDD = 8.6/day
        # Valencia: bloom Mar, peak Apr(next yr) = 390 days, need 2800 GDD = 7.2/day
        if gdd_to_peak >= 2600:  # Valencia and late citrus
            crop_daily_gdd = 7.2
        elif gdd_to_peak >= 2000:  # Navels and mid-season citrus
            crop_daily_gdd = 8.6
        else:  # Early citrus like satsumas
            crop_daily_gdd = 8.0

    return max(5.0, crop_daily_gdd)  # Minimum 5 GDD/day


def get_current_season_bloom(crop_id: str, region_id: str) -> date:
    """
    Get bloom date for the CURRENT season.

    For crops now being harvested, returns the bloom date that led to current harvest.
    For crops not yet in season, returns upcoming bloom.
    """
    today = date.today()
    this_year_bloom = get_typical_bloom_date(crop_id, region_id, today.year)
    last_year_bloom = get_typical_bloom_date(crop_id, region_id, today.year - 1)

    # Get GDD targets and realistic daily GDD for this crop/region
    targets = get_gdd_targets(crop_id)
    gdd_to_peak = targets.get("gdd_to_peak", 2000)
    gdd_window = targets.get("gdd_window", 200)

    # Use crop-specific GDD rate
    avg_gdd_per_day = estimate_avg_daily_gdd(crop_id, region_id)
    days_to_harvest = gdd_to_peak / avg_gdd_per_day
    days_window = gdd_window / avg_gdd_per_day

    this_year_harvest = this_year_bloom + timedelta(days=days_to_harvest)
    last_year_harvest = last_year_bloom + timedelta(days=days_to_harvest)

    # Use whichever season we're currently in
    # Check if we're in last year's harvest window
    last_year_window_end = last_year_harvest + timedelta(days=days_window / 2)

    if today <= last_year_window_end and today >= last_year_bloom:
        # We're in last year's crop harvest window
        return last_year_bloom
    elif today >= this_year_bloom:
        # After this year's bloom
        return this_year_bloom
    else:
        # Before this year's bloom - check if last year's crop still viable
        if today <= last_year_window_end:
            return last_year_bloom
        else:
            # Off-season, show upcoming
            return this_year_bloom


# HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fielder - What's In Season?</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%);
            min-height: 100vh;
            padding: 1.5rem;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        header {
            text-align: center;
            margin-bottom: 2rem;
            color: white;
        }
        header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .card h2 {
            color: #1a5f2a;
            margin-bottom: 1rem;
            font-size: 1.3rem;
            border-bottom: 2px solid #e8f5e9;
            padding-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        label {
            display: block;
            margin-bottom: 0.3rem;
            font-weight: 600;
            color: #555;
        }
        select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
            background: white;
        }
        select:focus {
            outline: none;
            border-color: #2d8a3e;
        }
        button {
            background: #2d8a3e;
            color: white;
            border: none;
            padding: 0.85rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
        }
        button:hover:not(:disabled) {
            background: #1a5f2a;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        button.loading {
            position: relative;
            color: transparent;
        }
        button.loading::after {
            content: "";
            position: absolute;
            width: 20px;
            height: 20px;
            top: 50%;
            left: 50%;
            margin: -10px 0 0 -10px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .results {
            display: none;
        }
        .results.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .prediction {
            background: #e8f5e9;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 0;
        }
        .prediction-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
        }
        .prediction-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a5f2a;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        .status-peak {
            background: linear-gradient(135deg, #4caf50, #8bc34a);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            font-size: 1.2rem;
            font-weight: bold;
        }
        .status-off-season {
            background: linear-gradient(135deg, #78909c, #546e7a);
            color: white;
        }
        .status-next-season {
            background: linear-gradient(135deg, #5c6bc0, #3f51b5);
            color: white;
        }
        .quality-bar {
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        .quality-fill {
            height: 100%;
            background: linear-gradient(90deg, #4caf50, #8bc34a);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        .in-season-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 1rem;
        }
        .season-item {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #4caf50;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        .season-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .season-item.peak {
            border-left-color: #ff9800;
            background: #fff8e1;
        }
        .season-item.off-season {
            border-left-color: #9e9e9e;
            background: #fafafa;
            opacity: 0.8;
        }
        .season-item h3 {
            color: #1a5f2a;
            margin-bottom: 0.3rem;
            font-size: 1rem;
        }
        .season-item .region {
            font-size: 0.8rem;
            color: #666;
        }
        .season-item .status {
            font-weight: 600;
            margin-top: 0.5rem;
            font-size: 0.85rem;
        }
        .badge {
            display: inline-block;
            padding: 0.15rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-peak {
            background: #ff9800;
            color: white;
        }
        .badge-optimal {
            background: #4caf50;
            color: white;
        }
        .badge-coming {
            background: #2196f3;
            color: white;
        }
        footer {
            text-align: center;
            color: rgba(255,255,255,0.7);
            padding: 2rem 0 1rem;
            font-size: 0.85rem;
        }
        footer a {
            color: rgba(255,255,255,0.9);
            text-decoration: none;
        }
        footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) {
            body { padding: 1rem; }
            header h1 { font-size: 2rem; }
            .grid { grid-template-columns: 1fr; }
            .in-season-list { grid-template-columns: 1fr; }
            .prediction-value { font-size: 1.3rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Fielder</h1>
            <p>Discover What's At Peak Quality Near You</p>
        </header>

        <div class="card">
            <h2>Find Fresh Produce</h2>
            <form id="prediction-form">
                <div class="form-group">
                    <label for="region">Your Growing Region</label>
                    <select id="region" name="region" required onchange="updateCropOptions()">
                        <option value="">Select a region...</option>
                        {% for region_id, region in regions.items() %}
                        <option value="{{ region_id }}"
                                data-crops="{{ region.viable_crops | join(',') }}">
                            {{ region.name }} ({{ region.state }})
                        </option>
                        {% endfor %}
                    </select>
                </div>
                <div class="form-group">
                    <label for="crop">Crop</label>
                    <select id="crop" name="crop" required disabled onchange="updateCultivarOptions()">
                        <option value="">First select a region...</option>
                    </select>
                </div>
                <div class="form-group" id="cultivar-group" style="display: none;">
                    <label for="cultivar">Cultivar <span style="color: #666; font-weight: normal;">(optional)</span></label>
                    <select id="cultivar" name="cultivar">
                        <option value="">All cultivars (regional average)</option>
                    </select>
                </div>
                <button type="submit" id="submit-btn" disabled>Check Harvest Status</button>
            </form>
        </div>

        <div class="card results" id="results">
            <h2 id="result-title">Results</h2>

            <div id="status-banner" class="status-peak" style="display:none; margin-bottom: 1rem;">
            </div>

            <!-- QUALITY PREDICTION - The core value proposition -->
            <div class="grid" style="margin-bottom: 1rem;">
                <div class="prediction" style="background: linear-gradient(135deg, #fff8e1, #ffecb3); border-left: 4px solid #ff9800;">
                    <div class="prediction-label">Predicted Sweetness</div>
                    <div class="prediction-value" id="result-brix" style="color: #e65100;">-</div>
                    <div id="brix-context" style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;"></div>
                </div>
                <div class="prediction" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-left: 4px solid #1976d2;">
                    <div class="prediction-label">Predicted Acid</div>
                    <div class="prediction-value" id="result-acid" style="color: #1565c0;">-</div>
                    <div id="acid-context" style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;"></div>
                </div>
            </div>

            <div class="grid" style="margin-bottom: 1rem;">
                <div class="prediction" style="background: #f5f5f5;">
                    <div class="prediction-label">Brix:Acid Ratio</div>
                    <div class="prediction-value" id="result-ratio" style="font-size: 1.3rem;">-</div>
                    <div id="ratio-context" style="font-size: 0.85rem; color: #666; margin-top: 0.3rem;"></div>
                </div>
                <div class="prediction" style="background: #f5f5f5;">
                    <div class="prediction-label">Quality Status</div>
                    <div class="prediction-value" id="result-quality-msg" style="font-size: 1rem;">-</div>
                </div>
            </div>

            <div class="grid">
                <div class="prediction">
                    <div class="prediction-label">Full Harvest Window</div>
                    <div class="prediction-value" id="result-full-window" style="font-size: 1.1rem;">-</div>
                </div>
                <div class="prediction" style="background: #fff8e1; border-left: 4px solid #ff9800;">
                    <div class="prediction-label">Peak Window (middle 50%)</div>
                    <div class="prediction-value" id="result-optimal-window" style="font-size: 1.1rem; color: #e65100;">-</div>
                </div>
            </div>
            <div class="grid">
                <div class="prediction">
                    <div class="prediction-label">Current Status</div>
                    <div class="prediction-value" id="result-window">-</div>
                </div>
                <div class="prediction">
                    <div class="prediction-label">Peak Quality Date</div>
                    <div class="prediction-value" id="result-peak">-</div>
                </div>
            </div>
            <div class="grid">
                <div class="prediction">
                    <div class="prediction-label">Season Progress</div>
                    <div class="prediction-value" id="result-progress">-</div>
                    <div class="quality-bar">
                        <div class="quality-fill" id="progress-bar" style="width: 0%"></div>
                    </div>
                </div>
                <div class="prediction">
                    <div class="prediction-label">Data Source</div>
                    <div class="prediction-value" id="result-method" style="font-size: 1rem;">-</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2 id="peak-now-title">What's At Peak Now</h2>
            <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
                Peak = middle 50% of harvest window (best eating quality)
            </p>
            <div class="in-season-list" id="peak-now-list">
                <!-- Populated dynamically -->
            </div>
            <p id="coming-soon-text" style="color: #888; margin-top: 1rem; font-size: 0.85rem;">
            </p>
        </div>

        <footer>
            <p>Fielder - Harvest prediction powered by GDD models + Open-Meteo weather data</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem;">
                Data sources: UF/IFAS, UC Davis, WSU, MSU, Texas A&M
            </p>
        </footer>
    </div>

    <script>
        // Crop display names
        const cropNames = {
            'navel_orange': 'Navel Orange',
            'valencia': 'Valencia Orange',
            'grapefruit': 'Grapefruit',
            'tangerine': 'Tangerine',
            'satsuma': 'Satsuma',
            'peach': 'Peach',
            'sweet_cherry': 'Sweet Cherry',
            'tart_cherry': 'Tart Cherry',
            'cherry': 'Cherry',
            'apple': 'Apple',
            'pear': 'Pear',
            'strawberry': 'Strawberry',
            'blueberry': 'Blueberry',
            'mango': 'Mango',
            'pomegranate': 'Pomegranate',
            'pecan': 'Pecan'
        };

        // Seasonal data - what's at peak each month
        const seasonalPeaks = {
            1: [  // January
                {crop: 'Navel Oranges', region: 'Indian River, FL', peak: 'Peak: Dec-Jan', isPeak: true, harvestWindow: 'Nov-Jan'},
                {crop: 'Grapefruit', region: 'Indian River, FL', peak: 'Peak: Jan-Mar', isPeak: true, harvestWindow: 'Nov-May'},
                {crop: 'Rio Red Grapefruit', region: 'Rio Grande Valley, TX', peak: 'Peak: Dec-Feb', isPeak: true, harvestWindow: 'Oct-Mar'},
                {crop: 'Strawberries', region: 'Plant City, FL', peak: 'Peak: Jan-Feb', isPeak: true, harvestWindow: 'Dec-Mar'},
            ],
            2: [  // February
                {crop: 'Grapefruit', region: 'Indian River, FL', peak: 'Peak: Jan-Mar', isPeak: true, harvestWindow: 'Nov-May'},
                {crop: 'Rio Red Grapefruit', region: 'Rio Grande Valley, TX', peak: 'Peak: Dec-Feb', isPeak: true, harvestWindow: 'Oct-Mar'},
                {crop: 'Strawberries', region: 'Plant City, FL', peak: 'Peak: Jan-Feb', isPeak: true, harvestWindow: 'Dec-Mar'},
            ],
            3: [  // March
                {crop: 'Grapefruit', region: 'Indian River, FL', peak: 'Peak: Jan-Mar', isPeak: true, harvestWindow: 'Nov-May'},
                {crop: 'Valencia Oranges', region: 'Indian River, FL', peak: 'Starting', isPeak: false, harvestWindow: 'Mar-Jun'},
                {crop: 'Strawberries', region: 'Plant City, FL', peak: 'Late season', isPeak: false, harvestWindow: 'Dec-Mar'},
            ],
            4: [  // April
                {crop: 'Valencia Oranges', region: 'Indian River, FL', peak: 'Peak: Apr-May', isPeak: true, harvestWindow: 'Mar-Jun'},
                {crop: 'Strawberries', region: 'California', peak: 'Peak season', isPeak: true, harvestWindow: 'Apr-Nov'},
            ],
            5: [  // May
                {crop: 'Valencia Oranges', region: 'Indian River, FL', peak: 'Peak: Apr-May', isPeak: true, harvestWindow: 'Mar-Jun'},
                {crop: 'Sweet Cherries', region: 'California', peak: 'Starting', isPeak: false, harvestWindow: 'May-Jun'},
                {crop: 'Peaches', region: 'Georgia', peak: 'Starting', isPeak: false, harvestWindow: 'May-Aug'},
            ],
            6: [  // June
                {crop: 'Sweet Cherries', region: 'Pacific NW', peak: 'Peak: Jun-Jul', isPeak: true, harvestWindow: 'Jun-Jul'},
                {crop: 'Peaches', region: 'Georgia', peak: 'Peak: Jun-Jul', isPeak: true, harvestWindow: 'May-Aug'},
                {crop: 'Mangoes', region: 'South Florida', peak: 'Peak: Jun-Jul', isPeak: true, harvestWindow: 'Jun-Aug'},
            ],
            7: [  // July
                {crop: 'Tart Cherries', region: 'Michigan', peak: 'Peak: mid-July', isPeak: true, harvestWindow: 'July'},
                {crop: 'Sweet Cherries', region: 'Pacific NW', peak: 'Peak: Jun-Jul', isPeak: true, harvestWindow: 'Jun-Jul'},
                {crop: 'Peaches', region: 'California', peak: 'Peak: Jun-Aug', isPeak: true, harvestWindow: 'May-Sep'},
                {crop: 'Blueberries', region: 'Michigan', peak: 'Peak: Jul-Aug', isPeak: true, harvestWindow: 'Jul-Aug'},
            ],
            8: [  // August
                {crop: 'Peaches', region: 'California', peak: 'Peak: Jun-Aug', isPeak: true, harvestWindow: 'May-Sep'},
                {crop: 'Blueberries', region: 'Michigan', peak: 'Peak: Jul-Aug', isPeak: true, harvestWindow: 'Jul-Aug'},
                {crop: 'Pears', region: 'Hood River, OR', peak: 'Starting', isPeak: false, harvestWindow: 'Aug-Oct'},
                {crop: 'Apples', region: 'Washington', peak: 'Starting', isPeak: false, harvestWindow: 'Aug-Nov'},
            ],
            9: [  // September
                {crop: 'Apples', region: 'Washington', peak: 'Peak: Sep-Oct', isPeak: true, harvestWindow: 'Aug-Nov'},
                {crop: 'Pears', region: 'Hood River, OR', peak: 'Peak: Aug-Sep', isPeak: true, harvestWindow: 'Aug-Oct'},
                {crop: 'Pomegranates', region: 'California', peak: 'Starting', isPeak: false, harvestWindow: 'Sep-Nov'},
            ],
            10: [  // October
                {crop: 'Apples', region: 'Washington & Michigan', peak: 'Peak: Sep-Oct', isPeak: true, harvestWindow: 'Aug-Nov'},
                {crop: 'Pomegranates', region: 'California', peak: 'Peak: Oct-Nov', isPeak: true, harvestWindow: 'Sep-Nov'},
                {crop: 'Satsumas', region: 'Sweet Valley, FL', peak: 'Peak: Oct-Nov', isPeak: true, harvestWindow: 'Oct-Nov'},
                {crop: 'Pecans', region: 'Texas', peak: 'Starting', isPeak: false, harvestWindow: 'Oct-Dec'},
            ],
            11: [  // November
                {crop: 'Pomegranates', region: 'California', peak: 'Peak: Oct-Nov', isPeak: true, harvestWindow: 'Sep-Nov'},
                {crop: 'Satsumas', region: 'Sweet Valley, FL', peak: 'Peak: Oct-Nov', isPeak: true, harvestWindow: 'Oct-Nov'},
                {crop: 'Navel Oranges', region: 'Indian River, FL', peak: 'Starting', isPeak: false, harvestWindow: 'Nov-Jan'},
                {crop: 'Pecans', region: 'Texas', peak: 'Peak: November', isPeak: true, harvestWindow: 'Oct-Dec'},
            ],
            12: [  // December
                {crop: 'Navel Oranges', region: 'Indian River, FL', peak: 'Peak: Dec-Jan', isPeak: true, harvestWindow: 'Nov-Jan'},
                {crop: 'Rio Red Grapefruit', region: 'Rio Grande Valley, TX', peak: 'Peak: Dec-Feb', isPeak: true, harvestWindow: 'Oct-Mar'},
                {crop: 'Grapefruit', region: 'Indian River, FL', peak: 'Approaching peak', isPeak: false, harvestWindow: 'Nov-May'},
                {crop: 'Tangerines', region: 'Florida', peak: 'Peak: December', isPeak: true, harvestWindow: 'Nov-Dec'},
                {crop: 'Strawberries', region: 'Plant City, FL', peak: 'Starting', isPeak: false, harvestWindow: 'Dec-Mar'},
            ],
        };

        // Coming soon by month
        const comingSoon = {
            1: 'Coming soon: Valencia oranges (Mar-Jun), Strawberries CA (Apr)',
            2: 'Coming soon: Valencia oranges (Mar), Strawberries CA (Apr)',
            3: 'Coming soon: Strawberries CA (Apr), Cherries (May-Jun)',
            4: 'Coming soon: Sweet cherries (May-Jun), Peaches (May-Jul)',
            5: 'Coming soon: Tart cherries (Jul), Mangoes (Jun-Jul)',
            6: 'Coming soon: Tart cherries (Jul), Blueberries (Jul-Aug)',
            7: 'Coming soon: Apples (Aug-Oct), Pears (Aug-Sep)',
            8: 'Coming soon: Pomegranates (Sep-Nov), Pecans (Oct-Nov)',
            9: 'Coming soon: Citrus season starts (Nov), Pecans (Oct-Nov)',
            10: 'Coming soon: Navel oranges (Nov-Jan), Grapefruit (Nov-May)',
            11: 'Coming soon: Grapefruit peak (Jan-Mar), Strawberries FL (Dec-Mar)',
            12: 'Coming soon: FL Strawberry peak (Jan-Feb), Grapefruit peak (Jan-Mar)',
        };

        // Populate "What's at Peak Now" on page load
        function populatePeakNow() {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];

            document.getElementById('peak-now-title').textContent =
                `What's At Peak Now (${monthNames[currentMonth]})`;

            const list = document.getElementById('peak-now-list');
            const peaks = seasonalPeaks[currentMonth] || [];

            list.innerHTML = peaks.map(item => `
                <div class="season-item ${item.isPeak ? 'peak' : ''}">
                    <h3>${item.crop}</h3>
                    <div class="region">${item.region}</div>
                    <div class="status">Harvest: ${item.harvestWindow}</div>
                    <div class="status" style="color: ${item.isPeak ? '#e65100' : '#666'}; font-weight: ${item.isPeak ? 'bold' : 'normal'};">
                        ${item.peak}
                    </div>
                </div>
            `).join('');

            document.getElementById('coming-soon-text').innerHTML =
                '<strong>Coming soon:</strong> ' + (comingSoon[currentMonth] || '').replace('Coming soon: ', '');
        }

        // Call on page load
        populatePeakNow();

        function updateCropOptions() {
            const regionSelect = document.getElementById('region');
            const cropSelect = document.getElementById('crop');
            const submitBtn = document.getElementById('submit-btn');

            const selectedOption = regionSelect.options[regionSelect.selectedIndex];
            const crops = selectedOption.dataset.crops;

            // Clear current options
            cropSelect.innerHTML = '';

            if (!crops) {
                cropSelect.innerHTML = '<option value="">First select a region...</option>';
                cropSelect.disabled = true;
                submitBtn.disabled = true;
                return;
            }

            // Add crops for this region
            cropSelect.innerHTML = '<option value="">Select a crop...</option>';
            crops.split(',').forEach(crop => {
                const option = document.createElement('option');
                option.value = crop;
                option.textContent = cropNames[crop] || crop.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                cropSelect.appendChild(option);
            });

            cropSelect.disabled = false;
        }

        async function updateCultivarOptions() {
            const cropSelect = document.getElementById('crop');
            const regionSelect = document.getElementById('region');
            const cultivarGroup = document.getElementById('cultivar-group');
            const cultivarSelect = document.getElementById('cultivar');
            const submitBtn = document.getElementById('submit-btn');

            const crop = cropSelect.value;
            const region = regionSelect.value;

            // Enable/disable submit based on crop selection
            submitBtn.disabled = !crop;

            if (!crop) {
                cultivarGroup.style.display = 'none';
                return;
            }

            // Fetch cultivars for this crop type
            try {
                const response = await fetch(`/api/cultivars?crop_type=${crop}&region=${region}`);
                const data = await response.json();

                // Clear and populate cultivar dropdown
                cultivarSelect.innerHTML = '<option value="">All cultivars (regional average)</option>';

                if (data.cultivars && data.cultivars.length > 0) {
                    data.cultivars.forEach(cultivar => {
                        const option = document.createElement('option');
                        option.value = cultivar.cultivar_id;
                        // Show name with quality tier indicator
                        let label = cultivar.cultivar_name;
                        if (cultivar.quality_tier === 'artisan') {
                            label += ' ★★★';
                        } else if (cultivar.quality_tier === 'premium') {
                            label += ' ★★';
                        }
                        if (cultivar.timing_class) {
                            label += ` (${cultivar.timing_class})`;
                        }
                        option.textContent = label;
                        cultivarSelect.appendChild(option);
                    });
                    cultivarGroup.style.display = 'block';
                } else {
                    cultivarGroup.style.display = 'none';
                }
            } catch (err) {
                console.error('Failed to fetch cultivars:', err);
                cultivarGroup.style.display = 'none';
            }
        }

        document.getElementById('prediction-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submit-btn');
            const formData = new FormData(e.target);
            const cultivar = formData.get('cultivar');
            const region = formData.get('region');
            const crop = formData.get('crop');

            // Add loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            let url, data;

            if (cultivar) {
                // Use cultivar-specific endpoint
                url = '/predict/cultivar';
                data = {
                    cultivar_id: cultivar,
                    region_id: region
                };
            } else {
                // Use general crop endpoint
                url = '/predict';
                data = {
                    region: region,
                    crop: crop
                };
            }

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                // Remove loading state
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;

                if (result.error) {
                    alert(result.error);
                    return;
                }

                // Update title with next season indicator if applicable
                const cropName = cropNames[result.crop] || result.crop;
                let titleSuffix = '';
                if (result.showing_next_season) {
                    titleSuffix = ' (Next Season)';
                }
                document.getElementById('result-title').textContent = cropName + ' - ' + result.region_name + titleSuffix;

                // Show status banner based on optimal window status
                const banner = document.getElementById('status-banner');
                if (result.showing_next_season) {
                    banner.textContent = 'SHOWING NEXT SEASON PROJECTION';
                    banner.style.display = 'block';
                    banner.className = 'status-peak status-next-season';
                } else if (result.is_at_peak) {
                    banner.textContent = 'AT PEAK QUALITY NOW!';
                    banner.style.display = 'block';
                    banner.className = 'status-peak';
                    banner.style.background = 'linear-gradient(135deg, #ff9800, #ff5722)';
                } else if (result.is_in_optimal_window) {
                    banner.textContent = 'IN OPTIMAL HARVEST WINDOW!';
                    banner.style.display = 'block';
                    banner.className = 'status-peak';
                    banner.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
                } else if (result.is_past_optimal) {
                    banner.textContent = 'Past optimal window - still harvestable';
                    banner.style.display = 'block';
                    banner.className = 'status-peak';
                    banner.style.background = 'linear-gradient(135deg, #9e9e9e, #757575)';
                } else if (result.is_harvestable) {
                    banner.textContent = 'Harvestable - approaching optimal';
                    banner.style.display = 'block';
                    banner.className = 'status-peak';
                    banner.style.background = 'linear-gradient(135deg, #8bc34a, #689f38)';
                } else if (result.is_off_season && !result.showing_next_season) {
                    banner.textContent = 'OFF SEASON';
                    banner.style.display = 'block';
                    banner.className = 'status-peak status-off-season';
                } else {
                    banner.style.display = 'none';
                }

                // Display QUALITY predictions (the core value!)
                const brixUnit = result.quality_unit || '°Brix';
                document.getElementById('result-brix').textContent = result.predicted_brix + ' ' + brixUnit;
                document.getElementById('result-acid').textContent = result.predicted_acid + '% acid';

                // Brix context (compare to peak)
                if (result.peak_brix > result.predicted_brix) {
                    document.getElementById('brix-context').textContent =
                        `Will reach ${result.peak_brix} ${brixUnit} at peak`;
                } else {
                    document.getElementById('brix-context').textContent = 'At or near maximum sweetness';
                }

                // Acid context
                if (result.predicted_acid > 1.0) {
                    document.getElementById('acid-context').textContent = 'Tart, will mellow as it ripens';
                } else if (result.predicted_acid > 0.6) {
                    document.getElementById('acid-context').textContent = 'Well-balanced acidity';
                } else {
                    document.getElementById('acid-context').textContent = 'Mild, sweet flavor profile';
                }

                // Brix:Acid ratio (critical for citrus)
                if (result.brix_acid_ratio) {
                    document.getElementById('result-ratio').textContent = result.brix_acid_ratio + ':1';
                    if (result.brix_acid_ratio >= 12) {
                        document.getElementById('ratio-context').textContent = 'Excellent balance - peak eating quality';
                    } else if (result.brix_acid_ratio >= 10) {
                        document.getElementById('ratio-context').textContent = 'Good balance - ready to eat';
                    } else if (result.brix_acid_ratio >= 8) {
                        document.getElementById('ratio-context').textContent = 'Legal minimum - still maturing';
                    } else {
                        document.getElementById('ratio-context').textContent = 'Too tart - not ready';
                    }
                } else {
                    document.getElementById('result-ratio').textContent = 'N/A';
                    document.getElementById('ratio-context').textContent = '';
                }

                document.getElementById('result-quality-msg').textContent = result.quality_message;

                // Display harvest timing results
                // Full harvest window
                document.getElementById('result-full-window').textContent =
                    result.harvest_start_date + ' - ' + result.harvest_end_date;
                // Optimal (peak) window - middle 50%
                document.getElementById('result-optimal-window').textContent =
                    result.optimal_start_date + ' - ' + result.optimal_end_date;
                // Current status
                document.getElementById('result-window').textContent = result.harvest_window;
                document.getElementById('result-peak').textContent = result.peak_date;
                document.getElementById('result-progress').textContent = result.progress + '%';
                document.getElementById('progress-bar').style.width = Math.min(100, result.progress) + '%';
                document.getElementById('result-method').textContent = result.data_source;

                document.getElementById('results').classList.add('active');

                // Scroll to results on mobile
                if (window.innerWidth < 768) {
                    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                // Reset loading state on error
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                alert('Error: ' + err.message);
            }
        });
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    """Render the main page."""
    return render_template_string(
        HTML_TEMPLATE,
        regions=US_GROWING_REGIONS
    )


@app.route('/predict', methods=['POST'])
def predict():
    """
    API endpoint for harvest prediction.

    Uses GDD (Growing Degree Days) calculated from ACTUAL WEATHER DATA:
    1. Get bloom date from phenology data (extension sources)
    2. Fetch real historical weather from Open-Meteo
    3. Calculate GDD accumulation from bloom to today
    4. Compare to established GDD thresholds for maturity/peak
    5. Project forward using forecast + climatology
    """
    data = request.json

    region_id = data.get('region')
    crop_id = data.get('crop')

    if not all([region_id, crop_id]):
        return jsonify({"error": "Missing required fields"})

    if region_id not in US_GROWING_REGIONS:
        return jsonify({"error": f"Unknown region: {region_id}"})

    region = US_GROWING_REGIONS[region_id]

    # Check if crop is valid for this region
    if crop_id not in region.viable_crops:
        return jsonify({"error": f"{crop_id} is not grown in {region.name}"})

    today = date.today()
    current_year = today.year

    # =========================================================================
    # GET CROP PHENOLOGY DATA (bloom date + GDD thresholds)
    # =========================================================================
    phenology = get_crop_phenology(crop_id, region_id)

    bloom_month, bloom_day = phenology["bloom"]
    gdd_base = phenology["gdd_base"]
    gdd_to_maturity = phenology["gdd_to_maturity"]
    gdd_to_peak = phenology["gdd_to_peak"]
    gdd_window = phenology["gdd_window"]
    data_source = phenology["source"]

    # Determine bloom date for current growing season
    # For most crops, if we're past typical harvest, use next year's bloom
    bloom_date = date(current_year, bloom_month, bloom_day)

    # For long-season crops like Valencia (13+ months), check if we need last year's bloom
    if bloom_date > today:
        # Bloom hasn't happened yet this year - might be tracking last year's crop
        last_year_bloom = date(current_year - 1, bloom_month, bloom_day)
        # If last year's crop would still be developing, use that
        if (today - last_year_bloom).days < 450:  # Max ~15 months
            bloom_date = last_year_bloom

    # =========================================================================
    # CALCULATE GDD FROM ACTUAL WEATHER DATA
    # =========================================================================
    weather_service = WeatherService()

    # Only fetch weather if bloom has passed
    if bloom_date < today:
        try:
            # Fetch actual historical weather from Open-Meteo
            observations = weather_service.provider.get_historical(
                region_id, bloom_date, today
            )

            if observations:
                # Calculate actual GDD accumulation
                current_gdd = sum(obs.gdd(gdd_base) for obs in observations)
                avg_daily_gdd = current_gdd / len(observations)
                data_source = f"{phenology['source']} + Open-Meteo weather ({len(observations)} days)"
            else:
                # Fallback to climatology estimate
                days_elapsed = (today - bloom_date).days
                climatology = weather_service.provider.get_climatology(region_id, today.month)
                avg_daily_gdd = climatology.get("avg_daily_gdd", 15)
                current_gdd = days_elapsed * avg_daily_gdd
                data_source = f"{phenology['source']} + climatology estimate"

        except Exception as e:
            # Fallback if weather fetch fails
            days_elapsed = (today - bloom_date).days
            avg_daily_gdd = 20.0  # Reasonable default
            current_gdd = days_elapsed * avg_daily_gdd
            data_source = f"{phenology['source']} (weather unavailable)"
    else:
        # Bloom hasn't happened yet
        current_gdd = 0
        avg_daily_gdd = 20.0
        data_source = f"{phenology['source']} - awaiting bloom"

    # =========================================================================
    # DETERMINE HARVEST STATUS FROM GDD ACCUMULATION
    # =========================================================================
    # Middle 50% of harvest window = optimal quality
    gdd_optimal_start = gdd_to_peak - (gdd_window / 4)
    gdd_optimal_end = gdd_to_peak + (gdd_window / 4)
    gdd_harvest_end = gdd_to_peak + (gdd_window / 2)

    # Check if off-season first (either too early or past harvest window)
    is_off_season = current_gdd < gdd_to_maturity * 0.7 or current_gdd > gdd_harvest_end

    # Harvestable only if within the valid harvest window (not off-season)
    is_harvestable = current_gdd >= gdd_to_maturity and not is_off_season
    is_in_optimal_window = gdd_optimal_start <= current_gdd <= gdd_optimal_end and not is_off_season
    is_at_peak = gdd_to_peak * 0.97 <= current_gdd <= gdd_to_peak * 1.03 and not is_off_season
    is_past_optimal = current_gdd > gdd_optimal_end and current_gdd <= gdd_harvest_end

    # Calculate progress toward peak (as percentage)
    progress = min(100, (current_gdd / gdd_to_peak * 100)) if gdd_to_peak > 0 else 0

    # =========================================================================
    # PROJECT HARVEST DATES FROM GDD
    # =========================================================================
    if avg_daily_gdd > 0:
        # Calculate days from bloom to each milestone
        days_bloom_to_maturity = int(gdd_to_maturity / avg_daily_gdd)
        days_bloom_to_optimal_start = int(gdd_optimal_start / avg_daily_gdd)
        days_bloom_to_peak = int(gdd_to_peak / avg_daily_gdd)
        days_bloom_to_optimal_end = int(gdd_optimal_end / avg_daily_gdd)
        days_bloom_to_harvest_end = int(gdd_harvest_end / avg_daily_gdd)

        # Calculate actual dates from bloom date (not from today)
        harvest_start_date = bloom_date + timedelta(days=days_bloom_to_maturity)
        optimal_start_date = bloom_date + timedelta(days=days_bloom_to_optimal_start)
        peak_center_date = bloom_date + timedelta(days=days_bloom_to_peak)
        optimal_end_date = bloom_date + timedelta(days=days_bloom_to_optimal_end)
        harvest_end_date = bloom_date + timedelta(days=days_bloom_to_harvest_end)
    else:
        # Fallback dates
        harvest_start_date = bloom_date + timedelta(days=200)
        optimal_start_date = bloom_date + timedelta(days=230)
        peak_center_date = bloom_date + timedelta(days=250)
        optimal_end_date = bloom_date + timedelta(days=270)
        harvest_end_date = bloom_date + timedelta(days=300)

    # =========================================================================
    # PROJECT NEXT SEASON FOR OFF-SEASON CROPS
    # =========================================================================
    # Storage crops (apples, pears) hold quality for months - show current/past season
    # Other crops: if 30+ days past harvest end, show next season's projected dates
    storage_crops = ["apple", "pear"]
    is_past_season = today > harvest_end_date
    days_past_season = (today - harvest_end_date).days if is_past_season else 0
    showing_next_season = False

    if is_off_season and is_past_season and days_past_season >= 30 and crop_id not in storage_crops:
        # Project next season: use next year's bloom date
        next_year = today.year + 1 if today.month >= bloom_date.month else today.year
        next_bloom = get_typical_bloom_date(crop_id, region_id, next_year)

        if avg_daily_gdd > 0:
            harvest_start_date = next_bloom + timedelta(days=days_bloom_to_maturity)
            optimal_start_date = next_bloom + timedelta(days=days_bloom_to_optimal_start)
            peak_center_date = next_bloom + timedelta(days=days_bloom_to_peak)
            optimal_end_date = next_bloom + timedelta(days=days_bloom_to_optimal_end)
            harvest_end_date = next_bloom + timedelta(days=days_bloom_to_harvest_end)
        else:
            harvest_start_date = next_bloom + timedelta(days=200)
            optimal_start_date = next_bloom + timedelta(days=230)
            peak_center_date = next_bloom + timedelta(days=250)
            optimal_end_date = next_bloom + timedelta(days=270)
            harvest_end_date = next_bloom + timedelta(days=300)

        showing_next_season = True
        bloom_date = next_bloom  # Update for response

    # =========================================================================
    # FORMAT HARVEST WINDOW MESSAGE
    # =========================================================================
    if is_off_season:
        if showing_next_season:
            days_until = (harvest_start_date - today).days
            if days_until <= 60:
                harvest_window = f"Next season in {days_until} days"
            else:
                harvest_window = f"Next season: {harvest_start_date.strftime('%B %Y')}"
        elif today < harvest_start_date:
            days_until = (harvest_start_date - today).days
            if days_until <= 30:
                harvest_window = f"Season starts in {days_until} days"
            else:
                harvest_window = f"Season: {harvest_start_date.strftime('%B %d')}"
        else:
            harvest_window = "Off-season"
    elif is_at_peak:
        harvest_window = "AT PEAK NOW!"
    elif is_in_optimal_window:
        harvest_window = "Optimal harvest NOW!"
    elif is_past_optimal:
        harvest_window = "Past peak - still good"
    elif is_harvestable:
        days_until_peak = (peak_center_date - today).days if today < peak_center_date else 0
        if days_until_peak > 0:
            harvest_window = f"Good now, peak in {days_until_peak} days"
        else:
            harvest_window = "Harvestable now"
    else:
        harvest_window = f"Not yet - {harvest_start_date.strftime('%B')}"

    # =========================================================================
    # QUALITY PREDICTION - Brix and Acid based on GDD progress
    # =========================================================================
    quality_predictor = QualityPredictor()
    quality_model = quality_predictor.get_model_by_crop(crop_id)

    # Get cultivar ceiling (max Brix potential)
    cultivar_brix_ceiling = {
        "navel_orange": 14.0,
        "valencia": 13.0,
        "grapefruit": 11.0,
        "tangerine": 13.0,
        "satsuma": 12.0,
        "peach": 14.0,
        "sweet_cherry": 20.0,
        "tart_cherry": 16.0,
        "apple": 15.0,
        "pear": 14.0,
        "strawberry": 10.0,
        "blueberry": 14.0,
        "mango": 18.0,
        "pomegranate": 17.0,
        "pecan": 70.0,
    }.get(crop_id, 12.0)

    # Use actual GDD from weather data for quality prediction
    # current_gdd was already calculated above from real weather

    # Predict quality
    predicted_brix = quality_model.predict_sugar_content(current_gdd, cultivar_brix_ceiling)
    predicted_acid = quality_model.predict_acid_content(current_gdd)
    brix_acid_ratio = predicted_brix / predicted_acid if predicted_acid > 0.1 else None

    peak_brix = quality_model.predict_sugar_content(gdd_to_peak, cultivar_brix_ceiling)
    peak_acid = quality_model.predict_acid_content(gdd_to_peak)

    # Quality message
    if crop_id == "pecan":
        quality_message = f"Oil content: {predicted_brix:.0f}%"
    elif is_at_peak:
        quality_message = "At peak sweetness!"
    elif is_in_optimal_window:
        quality_message = "Excellent - in optimal window"
    elif is_harvestable:
        quality_message = "Good - ready to eat"
    elif is_off_season:
        quality_message = "Not in season"
    else:
        quality_message = "Developing"

    # Format peak date display
    if is_at_peak:
        peak_date_display = "NOW!"
    elif today > optimal_end_date:
        peak_date_display = f"Was {peak_center_date.strftime('%B %d')}"
    else:
        peak_date_display = peak_center_date.strftime("%B %d, %Y")

    return jsonify({
        "region": region_id,
        "region_name": region.name,
        "crop": crop_id,
        "bloom_date": bloom_date.isoformat(),
        "harvest_window": harvest_window,
        "harvest_start_date": harvest_start_date.strftime("%B %d"),
        "harvest_end_date": harvest_end_date.strftime("%B %d"),
        "optimal_start_date": optimal_start_date.strftime("%B %d, %Y"),
        "optimal_end_date": optimal_end_date.strftime("%B %d, %Y"),
        "peak_date": peak_date_display,
        "progress": round(progress, 1),
        "is_harvestable": is_harvestable,
        "is_in_optimal_window": is_in_optimal_window,
        "is_at_peak": is_at_peak,
        "is_past_optimal": is_past_optimal,
        "is_off_season": is_off_season,
        "showing_next_season": showing_next_season,
        "data_source": data_source,
        # Quality predictions
        "predicted_brix": round(predicted_brix, 1),
        "predicted_acid": round(predicted_acid, 2),
        "brix_acid_ratio": round(brix_acid_ratio, 1) if brix_acid_ratio else None,
        "peak_brix": round(peak_brix, 1),
        "peak_acid": round(peak_acid, 2),
        "cultivar_ceiling": cultivar_brix_ceiling,
        "quality_message": quality_message,
        "quality_unit": "% oil" if crop_id == "pecan" else "°Brix"
    })


# =============================================================================
# CULTIVAR-LEVEL PREDICTION ENDPOINT
# =============================================================================
# The correct approach: predictions happen at the CULTIVAR level, not crop level.
# Same cultivar grown in different regions = different harvest dates.
# Different cultivars of same crop type = different timing (early/mid/late).

# Initialize the cultivar database once at module level
_cultivar_db = None

def get_cultivar_database() -> CultivarDatabase:
    """Get or initialize the cultivar database (lazy singleton)."""
    global _cultivar_db
    if _cultivar_db is None:
        _cultivar_db = CultivarDatabase()
        loader = DataLoader(_cultivar_db)
        loader.load_all()
    return _cultivar_db


@app.route('/predict/cultivar', methods=['POST'])
def predict_cultivar():
    """
    Cultivar-level harvest prediction endpoint.

    This is the CORRECT prediction approach:
    - Same cultivar in different regions = different harvest dates
    - Different cultivars of same crop = different timing (early/mid/late varieties)
    - For annual crops, growers can specify their actual planting date

    Example: Florida Radiance strawberry in Central FL vs South FL
    - Central FL: harvest Nov 26 - Mar 15, peak Jan 1 - Feb 15
    - South FL: harvest Dec 6 - Feb 15, peak Dec 21 - Jan 31 (faster GDD accumulation)

    Example: Same cultivar, different planting dates
    - Florida Brilliance planted Oct 1 → harvest starts ~Nov 15
    - Florida Brilliance planted Oct 22 → harvest starts ~Dec 6

    POST body:
    {
        "cultivar_id": "florida_radiance",  // Required
        "region_id": "central_florida",     // Required
        "planting_dates": ["2024-10-01", "2024-10-15", "2024-10-29"]  // Optional array
    }

    When planting_dates is provided (array of dates):
    - Returns prediction for EACH planting date
    - Shows staggered harvest windows
    - Marked as "grower-specific" in response
    - Useful for growers who stagger plantings

    When planting_dates is NOT provided:
    - Uses regional average bloom/planting dates
    - Returns typical harvest window for the region
    - Marked as "regional-average" in response

    Also accepts single "planting_date" (string) for backward compatibility.
    """
    data = request.json

    cultivar_id = data.get('cultivar_id')
    region_id = data.get('region_id')
    rootstock_id = data.get('rootstock_id')  # Optional rootstock selection
    tree_age = data.get('tree_age')  # Optional tree age in years

    # Support both single date and array of dates
    planting_dates_input = data.get('planting_dates') or data.get('planting_date')

    if not all([cultivar_id, region_id]):
        return jsonify({"error": "Missing required fields: cultivar_id and region_id"})

    if region_id not in US_GROWING_REGIONS:
        return jsonify({"error": f"Unknown region: {region_id}"})

    region = US_GROWING_REGIONS[region_id]

    # Get cultivar and regional data from database
    db = get_cultivar_database()
    cultivar = db.get_cultivar(cultivar_id)
    regional_data = db.get_regional_data(cultivar_id, region_id)

    # Look up rootstock if specified
    rootstock = None
    rootstock_brix_modifier = 0.0
    if rootstock_id:
        rootstock = db.rootstocks.get(rootstock_id)
        if rootstock:
            rootstock_brix_modifier = rootstock.brix_modifier
        else:
            # List available rootstocks for this crop
            available_rootstocks = [
                rs.rootstock_id for rs in db.rootstocks.values()
                if cultivar and cultivar.crop_type in rs.crop_types
            ]
            return jsonify({
                "error": f"Unknown rootstock: {rootstock_id}",
                "available_rootstocks": available_rootstocks
            })

    # Calculate tree age modifier based on user's research:
    # 0-2yr: -0.8, 3-4yr: -0.5, 5-7yr: -0.2, 8-18yr: 0.0, 19-25yr: -0.2, >25yr: -0.3
    age_brix_modifier = 0.0
    if tree_age is not None:
        try:
            age = int(tree_age)
            if age <= 2:
                age_brix_modifier = -0.8
            elif age <= 4:
                age_brix_modifier = -0.5
            elif age <= 7:
                age_brix_modifier = -0.2
            elif age <= 18:
                age_brix_modifier = 0.0
            elif age <= 25:
                age_brix_modifier = -0.2
            else:
                age_brix_modifier = -0.3
        except (ValueError, TypeError):
            pass  # Ignore invalid tree_age

    if not cultivar:
        # List available cultivars for this crop type if specified
        available = [c.cultivar_id for c in db.cultivars.values()]
        return jsonify({
            "error": f"Unknown cultivar: {cultivar_id}",
            "available_cultivars": available[:20]  # First 20
        })

    if not regional_data:
        # List regions that have data for this cultivar
        regions_for_cultivar = [
            key.split(':')[1] for key in db.regional_data.keys()
            if key.startswith(f"{cultivar_id}:")
        ]
        return jsonify({
            "error": f"No regional data for {cultivar.cultivar_name} in {region.name}",
            "available_regions": regions_for_cultivar,
            "cultivar_info": {
                "name": cultivar.cultivar_name,
                "crop_type": cultivar.crop_type,
                "timing_class": cultivar.timing_class
            }
        })

    today = date.today()
    current_year = today.year

    # =========================================================================
    # PARSE OPTIONAL PLANTING DATES (single or multiple)
    # =========================================================================
    # If grower provides their actual planting date(s), use them for precise prediction
    # Otherwise, use regional average bloom/planting dates
    grower_planting_dates = []
    prediction_mode = "regional-average"

    if planting_dates_input:
        # Normalize to list
        if isinstance(planting_dates_input, str):
            date_strings = [planting_dates_input]
        elif isinstance(planting_dates_input, list):
            date_strings = planting_dates_input
        else:
            return jsonify({
                "error": "planting_dates must be a string or array of strings",
                "expected_format": "YYYY-MM-DD or ['YYYY-MM-DD', 'YYYY-MM-DD', ...]"
            })

        for date_str in date_strings:
            try:
                grower_planting_dates.append(date.fromisoformat(date_str))
            except ValueError:
                return jsonify({
                    "error": f"Invalid planting_date format: {date_str}",
                    "expected_format": "YYYY-MM-DD (e.g., 2024-10-15)"
                })

        prediction_mode = "grower-specific"
        grower_planting_dates.sort()  # Chronological order

    # =========================================================================
    # GET PHENOLOGY FROM CULTIVAR + REGIONAL DATA
    # =========================================================================
    # GDD parameters from cultivar research
    gdd_base = cultivar.gdd_base_temp or 50.0
    gdd_to_maturity = cultivar.gdd_to_maturity or 1000
    gdd_to_peak = cultivar.gdd_to_peak or int(gdd_to_maturity * 1.15)

    # Calculate GDD window - for grower-specific, use cultivar's inherent window
    # For regional average, use historical data if available
    if grower_planting_dates:
        # Grower-specific: window based on cultivar genetics, not regional spread
        # A single planting has a tighter window than region-wide staggered plantings
        gdd_window = int(gdd_to_peak * 0.12)  # ~12% of peak = single planting window
    elif regional_data.historical_harvest_start_doy and regional_data.historical_harvest_end_doy:
        # Regional average: broader window due to staggered plantings
        avg_gdd_rate = regional_data.avg_gdd_per_day_bloom_to_harvest or 15.0
        harvest_days = regional_data.historical_harvest_end_doy - regional_data.historical_harvest_start_doy
        if harvest_days < 0:  # Wraps around year
            harvest_days += 365
        gdd_window = max(100, int(harvest_days * avg_gdd_rate * 0.5))  # ~50% of season
    else:
        gdd_window = int(gdd_to_peak * 0.15)  # 15% of peak as default

    # =========================================================================
    # DETERMINE BLOOM/PLANTING DATE(S)
    # =========================================================================
    # Build list of planting dates to process (could be 1 or more)
    if grower_planting_dates:
        # Use grower's actual planting date(s)
        planting_dates_to_process = grower_planting_dates
    else:
        # Use regional average bloom/planting date
        bloom_doy = regional_data.avg_bloom_peak_doy or regional_data.avg_bloom_start_doy or 100
        bloom_date = date(current_year, 1, 1) + timedelta(days=bloom_doy - 1)

        # Handle bloom date relative to today
        if bloom_date > today:
            # Bloom hasn't happened yet this year - might be tracking last year's crop
            last_year_bloom = date(current_year - 1, 1, 1) + timedelta(days=bloom_doy - 1)
            if (today - last_year_bloom).days < 450:  # Max ~15 months
                bloom_date = last_year_bloom

        planting_dates_to_process = [bloom_date]

    # =========================================================================
    # PROCESS EACH PLANTING DATE
    # =========================================================================
    weather_service = WeatherService()
    quality_predictor = QualityPredictor()
    quality_model = quality_predictor.get_model_by_crop(cultivar.crop_type)
    cultivar_brix_ceiling = cultivar.research_peak_brix or 12.0

    plantings = []

    for planting_idx, planting_date in enumerate(planting_dates_to_process):
        # Data source label
        if grower_planting_dates:
            data_source = f"{cultivar.cultivar_name} - Planting {planting_idx + 1} ({planting_date.strftime('%b %d, %Y')})"
        else:
            data_source = f"{cultivar.cultivar_name} - {regional_data.data_source or 'Research data'}"

        # ---------------------------------------------------------------------
        # CALCULATE GDD FROM ACTUAL WEATHER DATA
        # ---------------------------------------------------------------------
        if planting_date < today:
            try:
                observations = weather_service.provider.get_historical(
                    region_id, planting_date, today
                )

                if observations:
                    current_gdd = sum(obs.gdd(gdd_base) for obs in observations)
                    avg_daily_gdd = current_gdd / len(observations)
                    data_source = f"{data_source} + Open-Meteo ({len(observations)} days)"
                else:
                    days_elapsed = (today - planting_date).days
                    avg_daily_gdd = regional_data.avg_gdd_per_day_bloom_to_harvest or 15.0
                    current_gdd = days_elapsed * avg_daily_gdd
                    data_source = f"{data_source} + climatology estimate"

            except Exception as e:
                days_elapsed = (today - planting_date).days
                avg_daily_gdd = regional_data.avg_gdd_per_day_bloom_to_harvest or 15.0
                current_gdd = days_elapsed * avg_daily_gdd
                data_source = f"{data_source} (weather unavailable)"
        else:
            current_gdd = 0
            avg_daily_gdd = regional_data.avg_gdd_per_day_bloom_to_harvest or 15.0
            data_source = f"{data_source} - awaiting planting"

        # ---------------------------------------------------------------------
        # PROJECT HARVEST DATES - Use historical data when available
        # ---------------------------------------------------------------------
        # For regional-average mode (no grower planting date), historical data
        # is more accurate than GDD calculations which require calibrated targets
        use_historical_dates = (
            not grower_planting_dates and
            regional_data.historical_harvest_start_doy and
            regional_data.historical_harvest_end_doy
        )

        if use_historical_dates:
            # Use validated historical harvest windows from regional data
            def doy_to_date(doy, ref_year):
                """Convert day-of-year to date, handling year boundaries."""
                if doy <= 0:
                    doy += 365
                    ref_year -= 1
                return date(ref_year, 1, 1) + timedelta(days=doy - 1)

            # Determine which year's season we're in
            harvest_start_doy = regional_data.historical_harvest_start_doy
            harvest_end_doy = regional_data.historical_harvest_end_doy

            # Check if season wraps around year end (e.g., Nov-Jan)
            if harvest_end_doy < harvest_start_doy:
                # Season wraps year boundary
                if today.timetuple().tm_yday >= harvest_start_doy:
                    # We're in the first part (e.g., Nov-Dec of current year)
                    season_year = today.year
                    harvest_start_date = doy_to_date(harvest_start_doy, season_year)
                    harvest_end_date = doy_to_date(harvest_end_doy, season_year + 1)
                elif today.timetuple().tm_yday <= harvest_end_doy:
                    # We're in the second part (e.g., Jan of current year)
                    season_year = today.year - 1
                    harvest_start_date = doy_to_date(harvest_start_doy, season_year)
                    harvest_end_date = doy_to_date(harvest_end_doy, today.year)
                else:
                    # Off-season - show next upcoming season
                    season_year = today.year
                    harvest_start_date = doy_to_date(harvest_start_doy, season_year)
                    harvest_end_date = doy_to_date(harvest_end_doy, season_year + 1)
            else:
                # Season within single year
                if today.timetuple().tm_yday > harvest_end_doy:
                    # Past this year's season, show next year
                    season_year = today.year + 1
                else:
                    season_year = today.year
                harvest_start_date = doy_to_date(harvest_start_doy, season_year)
                harvest_end_date = doy_to_date(harvest_end_doy, season_year)

            # Peak window from historical data if available
            if regional_data.historical_peak_start_doy and regional_data.historical_peak_end_doy:
                peak_start_doy = regional_data.historical_peak_start_doy
                peak_end_doy = regional_data.historical_peak_end_doy

                # Same year logic for peak
                if harvest_end_doy < harvest_start_doy:
                    # Wrapping season
                    if peak_start_doy >= harvest_start_doy:
                        optimal_start_date = doy_to_date(peak_start_doy, harvest_start_date.year)
                    else:
                        optimal_start_date = doy_to_date(peak_start_doy, harvest_end_date.year)

                    if peak_end_doy >= harvest_start_doy:
                        optimal_end_date = doy_to_date(peak_end_doy, harvest_start_date.year)
                    else:
                        optimal_end_date = doy_to_date(peak_end_doy, harvest_end_date.year)
                else:
                    optimal_start_date = doy_to_date(peak_start_doy, harvest_start_date.year)
                    optimal_end_date = doy_to_date(peak_end_doy, harvest_start_date.year)

                # Peak center is midpoint of optimal window
                peak_center_date = optimal_start_date + (optimal_end_date - optimal_start_date) / 2
            else:
                # Estimate optimal as middle 50% of harvest window
                window_days = (harvest_end_date - harvest_start_date).days
                if window_days < 0:
                    window_days += 365
                optimal_offset = window_days // 4
                optimal_start_date = harvest_start_date + timedelta(days=optimal_offset)
                optimal_end_date = harvest_end_date - timedelta(days=optimal_offset)
                peak_center_date = harvest_start_date + timedelta(days=window_days // 2)

        elif avg_daily_gdd > 0:
            # Calculate GDD thresholds for status
            gdd_optimal_start = gdd_to_peak - (gdd_window / 4)
            gdd_optimal_end = gdd_to_peak + (gdd_window / 4)
            gdd_harvest_end = gdd_to_peak + (gdd_window / 2)

            # Calculate days from planting to each milestone (grower-specific mode)
            days_plant_to_maturity = int(gdd_to_maturity / avg_daily_gdd)
            days_plant_to_optimal_start = int(gdd_optimal_start / avg_daily_gdd)
            days_plant_to_peak = int(gdd_to_peak / avg_daily_gdd)
            days_plant_to_optimal_end = int(gdd_optimal_end / avg_daily_gdd)
            days_plant_to_harvest_end = int(gdd_harvest_end / avg_daily_gdd)

            # Calculate actual dates from planting date (not from today)
            harvest_start_date = planting_date + timedelta(days=days_plant_to_maturity)
            optimal_start_date = planting_date + timedelta(days=days_plant_to_optimal_start)
            peak_center_date = planting_date + timedelta(days=days_plant_to_peak)
            optimal_end_date = planting_date + timedelta(days=days_plant_to_optimal_end)
            harvest_end_date = planting_date + timedelta(days=days_plant_to_harvest_end)
        else:
            # Fallback to cultivar's days to maturity
            harvest_start_date = planting_date + timedelta(days=cultivar.days_to_maturity or 120)
            optimal_start_date = harvest_start_date + timedelta(days=15)
            peak_center_date = harvest_start_date + timedelta(days=30)
            optimal_end_date = harvest_start_date + timedelta(days=45)
            harvest_end_date = harvest_start_date + timedelta(days=60)

        # ---------------------------------------------------------------------
        # DETERMINE HARVEST STATUS FROM DATES (works for both historical and GDD)
        # ---------------------------------------------------------------------
        is_off_season = today < harvest_start_date or today > harvest_end_date
        is_harvestable = harvest_start_date <= today <= harvest_end_date
        is_in_optimal_window = optimal_start_date <= today <= optimal_end_date
        is_at_peak = (peak_center_date - timedelta(days=3)) <= today <= (peak_center_date + timedelta(days=3))
        is_past_optimal = today > optimal_end_date and today <= harvest_end_date

        # Calculate progress through season
        if is_off_season and today < harvest_start_date:
            progress = 0
        elif is_off_season:  # Past harvest end
            progress = 100
        else:
            total_days = (harvest_end_date - harvest_start_date).days or 1
            days_into_season = (today - harvest_start_date).days
            progress = min(100, max(0, (days_into_season / total_days) * 100))

        # ---------------------------------------------------------------------
        # FORMAT HARVEST WINDOW MESSAGE
        # ---------------------------------------------------------------------
        if is_off_season:
            if today < harvest_start_date:
                days_until = (harvest_start_date - today).days
                if days_until <= 30:
                    harvest_window = f"Season starts in {days_until} days"
                else:
                    harvest_window = f"Season: {harvest_start_date.strftime('%B %d')}"
            else:
                harvest_window = "Off-season"
        elif is_at_peak:
            harvest_window = "AT PEAK NOW!"
        elif is_in_optimal_window:
            harvest_window = "Optimal harvest NOW!"
        elif is_past_optimal:
            harvest_window = "Past peak - still good"
        elif is_harvestable:
            days_until_peak = (peak_center_date - today).days if today < peak_center_date else 0
            if days_until_peak > 0:
                harvest_window = f"Good now, peak in {days_until_peak} days"
            else:
                harvest_window = "Harvestable now"
        else:
            harvest_window = f"Not yet - {harvest_start_date.strftime('%B')}"

        # ---------------------------------------------------------------------
        # QUALITY PREDICTION
        # ---------------------------------------------------------------------
        # Base Brix from GDD model
        base_predicted_brix = quality_model.predict_sugar_content(current_gdd, cultivar_brix_ceiling)
        base_peak_brix = quality_model.predict_sugar_content(gdd_to_peak, cultivar_brix_ceiling)

        # Apply rootstock and age modifiers (Peak_Brix = Scion_Base + Rootstock_Mod + Age_Mod)
        total_brix_modifier = rootstock_brix_modifier + age_brix_modifier
        predicted_brix = base_predicted_brix + total_brix_modifier
        peak_brix = base_peak_brix + total_brix_modifier

        predicted_acid = quality_model.predict_acid_content(current_gdd)
        brix_acid_ratio = predicted_brix / predicted_acid if predicted_acid > 0.1 else None

        if cultivar.crop_type == "pecan":
            quality_message = f"Oil content: {predicted_brix:.0f}%"
        elif is_at_peak:
            quality_message = "At peak sweetness!"
        elif is_in_optimal_window:
            quality_message = "Excellent - in optimal window"
        elif is_harvestable:
            quality_message = "Good - ready to eat"
        elif is_off_season:
            quality_message = "Not in season"
        else:
            quality_message = "Developing"

        if is_at_peak:
            peak_date_display = "NOW!"
        elif today > optimal_end_date:
            peak_date_display = f"Was {peak_center_date.strftime('%B %d')}"
        else:
            peak_date_display = peak_center_date.strftime("%B %d, %Y")

        # ---------------------------------------------------------------------
        # BUILD PLANTING RESULT
        # ---------------------------------------------------------------------
        planting_result = {
            "planting_date": planting_date.isoformat(),
            "harvest_window": harvest_window,
            "harvest_start_date": harvest_start_date.strftime("%B %d"),
            "harvest_end_date": harvest_end_date.strftime("%B %d"),
            "optimal_start_date": optimal_start_date.strftime("%B %d, %Y"),
            "optimal_end_date": optimal_end_date.strftime("%B %d, %Y"),
            "peak_date": peak_date_display,
            "progress": round(progress, 1),
            "current_gdd": round(current_gdd, 0),
            "is_harvestable": is_harvestable,
            "is_in_optimal_window": is_in_optimal_window,
            "is_at_peak": is_at_peak,
            "is_past_optimal": is_past_optimal,
            "is_off_season": is_off_season,
            "predicted_brix": round(predicted_brix, 1),
            "predicted_acid": round(predicted_acid, 2),
            "brix_acid_ratio": round(brix_acid_ratio, 1) if brix_acid_ratio else None,
            "peak_brix": round(peak_brix, 1),
            "quality_message": quality_message,
            "data_source": data_source,
        }
        plantings.append(planting_result)

    # =========================================================================
    # BUILD RESPONSE
    # =========================================================================
    # For single planting (regional average or single date), flatten for backward compatibility
    # For multiple plantings, return array

    response = {
        # Cultivar info
        "cultivar_id": cultivar_id,
        "cultivar_name": cultivar.cultivar_name,
        "crop_type": cultivar.crop_type,
        "timing_class": cultivar.timing_class,
        "quality_tier": cultivar.quality_tier.value if cultivar.quality_tier else "standard",
        # Region info
        "region_id": region_id,
        "region_name": region.name,
        # Prediction mode
        "prediction_mode": prediction_mode,
        "gdd_to_peak": gdd_to_peak,
        "cultivar_ceiling": cultivar_brix_ceiling,
        "research_sources": cultivar.research_sources,
    }

    # Add rootstock info if specified
    if rootstock:
        response["rootstock_id"] = rootstock.rootstock_id
        response["rootstock_name"] = rootstock.rootstock_name
        response["rootstock_brix_modifier"] = rootstock.brix_modifier
        response["rootstock_notes"] = rootstock.notes

    # Add tree age info if specified
    if tree_age is not None:
        response["tree_age"] = tree_age
        response["age_brix_modifier"] = age_brix_modifier

    # Add total modifier info for transparency
    if rootstock or tree_age is not None:
        response["total_brix_modifier"] = total_brix_modifier

    if len(plantings) == 1:
        # Single planting: merge into top-level for backward compatibility
        response.update(plantings[0])
    else:
        # Multiple plantings: include as array + summary
        response["plantings"] = plantings
        response["planting_count"] = len(plantings)

        # Summary across all plantings
        earliest_harvest = min(p["harvest_start_date"] for p in plantings)
        latest_harvest = max(p["harvest_end_date"] for p in plantings)
        any_harvestable = any(p["is_harvestable"] for p in plantings)
        any_at_peak = any(p["is_at_peak"] for p in plantings)
        any_optimal = any(p["is_in_optimal_window"] for p in plantings)

        response["summary"] = {
            "harvest_range": f"{earliest_harvest} - {latest_harvest}",
            "any_harvestable_now": any_harvestable,
            "any_at_peak_now": any_at_peak,
            "any_in_optimal_window": any_optimal,
        }

    return jsonify(response)


@app.route('/api/cultivars')
def api_cultivars():
    """API endpoint listing all available cultivars."""
    db = get_cultivar_database()

    # Optionally filter by crop type or region
    crop_type = request.args.get('crop_type')
    region_id = request.args.get('region_id') or request.args.get('region')

    cultivars = []
    for cultivar in db.cultivars.values():
        if crop_type and cultivar.crop_type != crop_type:
            continue

        # Check if regional data exists for this cultivar in the requested region
        regions_available = [
            key.split(':')[1] for key in db.regional_data.keys()
            if key.startswith(f"{cultivar.cultivar_id}:")
        ]

        if region_id and region_id not in regions_available:
            continue

        cultivars.append({
            "cultivar_id": cultivar.cultivar_id,
            "cultivar_name": cultivar.cultivar_name,
            "crop_type": cultivar.crop_type,
            "timing_class": cultivar.timing_class,
            "quality_tier": cultivar.quality_tier.value if cultivar.quality_tier else "standard",
            "peak_brix": cultivar.research_peak_brix,
            "regions_available": regions_available
        })

    return jsonify({
        "count": len(cultivars),
        "cultivars": cultivars
    })


@app.route('/api/regions')
def api_regions():
    """API endpoint for regions with their viable crops."""
    return jsonify({
        region_id: {
            "name": r.name,
            "state": r.state,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "viable_crops": r.viable_crops
        }
        for region_id, r in US_GROWING_REGIONS.items()
    })


@app.route('/api/rootstocks')
def api_rootstocks():
    """API endpoint listing available rootstocks.

    Optional query params:
    - crop_type: Filter to rootstocks compatible with a specific crop
    """
    db = get_cultivar_database()
    crop_type = request.args.get('crop_type')

    rootstocks = []
    for rs in db.rootstocks.values():
        # Filter by crop type if specified
        if crop_type and crop_type not in rs.crop_types:
            continue

        rootstocks.append({
            "rootstock_id": rs.rootstock_id,
            "rootstock_name": rs.rootstock_name,
            "crop_types": rs.crop_types,
            "brix_modifier": rs.brix_modifier,
            "brix_modifier_range": list(rs.brix_modifier_range) if rs.brix_modifier_range else None,
            "vigor": rs.vigor,
            "yield_effect": rs.yield_effect,
            "disease_resistance": rs.disease_resistance,
            "cold_hardy_to_f": rs.cold_hardy_to_f,
            "drought_tolerant": rs.drought_tolerant,
            "notes": rs.notes
        })

    # Sort by Brix modifier (high to low) for user convenience
    rootstocks.sort(key=lambda x: x["brix_modifier"], reverse=True)

    return jsonify({
        "count": len(rootstocks),
        "rootstocks": rootstocks,
        "filter_crop_type": crop_type
    })


@app.route('/api/whats-in-season')
def api_whats_in_season():
    """API endpoint showing what's currently in optimal harvest window (middle 50%)."""
    today = date.today()
    in_season = []

    for region_id, region in US_GROWING_REGIONS.items():
        for crop_id in region.viable_crops:
            bloom_date = get_current_season_bloom(crop_id, region_id)
            targets = get_gdd_targets(crop_id)
            base_temp = targets.get("base_temp", 50.0)
            gdd_to_peak = targets.get("gdd_to_peak", 2000)
            gdd_window = targets.get("gdd_window", 200)

            # Middle 50% window
            middle_50_start = gdd_to_peak - (gdd_window / 4)
            middle_50_end = gdd_to_peak + (gdd_window / 4)

            # Quick estimate without API call
            days_since_bloom = (today - bloom_date).days
            if days_since_bloom > 0:
                # Use crop-specific GDD rate
                avg_gdd = estimate_avg_daily_gdd(crop_id, region_id)
                estimated_gdd = days_since_bloom * avg_gdd

                # Check if in optimal window
                if middle_50_start <= estimated_gdd <= middle_50_end:
                    status = "at_peak" if abs(estimated_gdd - gdd_to_peak) < (gdd_window * 0.05) else "optimal"
                    in_season.append({
                        "region": region.name,
                        "region_id": region_id,
                        "crop": crop_id,
                        "status": status,
                        "estimated_gdd": round(estimated_gdd),
                        "optimal_window": f"{middle_50_start:.0f}-{middle_50_end:.0f} GDD"
                    })

    return jsonify(in_season)


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("  Fielder - What's In Season?")
    print("=" * 50)
    print(f"\n  Regions loaded: {len(US_GROWING_REGIONS)}")
    print(f"  Crops with bloom data: {len(TYPICAL_BLOOM_DATES)}")
    print("\n  Starting web server...")
    print("  Open http://localhost:5000 in your browser")
    print("=" * 50 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
