"""
Weather and Growing Degree Day (GDD) models.

GDD is the core mechanism for predicting harvest timing.
Crops develop based on accumulated heat, not calendar days.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class DailyWeather:
    """Daily weather observation for GDD calculation."""
    date: date
    temp_high_f: float
    temp_low_f: float

    # Optional additional data
    precipitation_in: Optional[float] = None
    humidity_pct: Optional[float] = None

    def calculate_gdd(self, base_temp: float = 55.0) -> float:
        """
        Calculate Growing Degree Days for this day.

        GDD = max(0, (Tmax + Tmin) / 2 - base_temp)

        For citrus, base temp is 55F (12.8C).
        Default base temp of 55F works for most crops.
        """
        avg_temp = (self.temp_high_f + self.temp_low_f) / 2
        gdd = max(0, avg_temp - base_temp)
        return gdd


@dataclass
class GDDAccumulation:
    """
    Cumulative GDD tracking from a reference date (e.g., bloom).

    Used to predict crop development stages and harvest timing.
    """
    region_id: str
    crop_id: str
    year: int
    base_temp: float = 55.0

    # Reference point (typically bloom date for tree crops)
    reference_date: date = None

    # Cumulative GDD to date
    cumulative_gdd: float = 0.0
    last_updated: date = None

    # GDD targets for this crop
    gdd_to_maturity: Optional[int] = None  # GDD when harvestable
    gdd_to_peak: Optional[int] = None  # GDD at peak quality

    def add_day(self, weather: DailyWeather) -> float:
        """Add a day's GDD to the accumulation."""
        daily_gdd = weather.calculate_gdd(self.base_temp)
        self.cumulative_gdd += daily_gdd
        self.last_updated = weather.date
        return daily_gdd

    @property
    def pct_to_maturity(self) -> Optional[float]:
        """Percentage progress toward maturity."""
        if self.gdd_to_maturity is None:
            return None
        return min(100.0, (self.cumulative_gdd / self.gdd_to_maturity) * 100)

    @property
    def pct_to_peak(self) -> Optional[float]:
        """Percentage progress toward peak quality."""
        if self.gdd_to_peak is None:
            return None
        return min(100.0, (self.cumulative_gdd / self.gdd_to_peak) * 100)

    def days_to_target(self, target_gdd: int, avg_daily_gdd: float) -> int:
        """
        Estimate days until reaching a GDD target.

        Args:
            target_gdd: The GDD target to reach
            avg_daily_gdd: Average GDD per day (e.g., rolling 14-day average)

        Returns:
            Estimated days to target
        """
        remaining_gdd = target_gdd - self.cumulative_gdd
        if remaining_gdd <= 0:
            return 0
        if avg_daily_gdd <= 0:
            return -1  # Cannot estimate
        return int(remaining_gdd / avg_daily_gdd)


@dataclass
class WeatherForecast:
    """Weather forecast for projecting future GDD."""
    region_id: str
    forecast_date: date
    temp_high_f: float
    temp_low_f: float
    confidence: float = 0.8  # Confidence level (decreases for further out)

    def projected_gdd(self, base_temp: float = 55.0) -> float:
        """Calculate projected GDD from forecast."""
        avg_temp = (self.temp_high_f + self.temp_low_f) / 2
        return max(0, avg_temp - base_temp)


# =============================================================================
# CROP GDD TARGETS
# =============================================================================
# GDD requirements for each crop type, used for harvest window prediction.
# base_temp: Temperature (F) below which no GDD accumulates
# gdd_to_maturity: GDD from bloom/leaf-out to harvestable
# gdd_to_peak: GDD from bloom/leaf-out to peak quality
# gdd_window: GDD range during which quality remains high (for window end)

CROP_GDD_TARGETS = {
    # === CITRUS ===
    # Base temp 55F for all citrus
    # Long development period (9-12 months from bloom to harvest)
    "navel_orange": {
        "base_temp": 55.0,
        # CALIBRATED for actual Florida weather: ~22 GDD/day average
        # Bloom mid-March → Mature Nov 1 (230 days) → Peak Dec 15 (275 days)
        # FULL SEASON: Nov 1 - Jan 31 = ~90 days of quality harvest
        "gdd_to_maturity": 5100,        # ~230 days, SSC >= 8, ratio >= 9:1
        "gdd_to_good_flavor": 5600,     # ~250 days, BrimA >= 7.5
        "gdd_to_peak": 6100,            # ~275 days, SSC ~12, TA ~1.0
        "gdd_window": 2000,             # ~90 day window (Nov 1 - Jan 31)
        "notes": "Quality holds well on tree, entire Nov-Jan window is optimal"
    },
    "valencia": {
        "base_temp": 55.0,
        # CALIBRATED: Bloom March → Mature Mar (next yr, 365 days) → Peak May (410 days)
        "gdd_to_maturity": 8000,  # ~365 days, March start of season
        "gdd_to_peak": 9000,      # ~410 days, April-May peak (13-14 months from bloom)
        "gdd_window": 2200,       # March-June = ~100 days
        "notes": "Late season (Mar-Jun), peak Apr-May, can regreen if left too long"
    },
    "grapefruit": {
        "base_temp": 55.0,
        # CALIBRATED: Bloom March → Mature Nov (245 days) → Peak Jan (320 days)
        # Very long window: Nov-May = 180 days
        "gdd_to_maturity": 5500,  # ~245 days
        "gdd_to_peak": 7100,      # ~320 days (mid-January)
        "gdd_window": 4000,       # ~180 days window (Nov-May)
        "notes": "Very long harvest window, holds well on tree"
    },
    "tangerine": {
        "base_temp": 55.0,
        # CALIBRATED: Bloom March → Mature Nov (240 days) → Peak Dec (260 days)
        "gdd_to_maturity": 5300,  # ~240 days
        "gdd_to_peak": 5700,      # ~260 days (mid-December)
        "gdd_window": 900,        # ~40 days (Nov-Dec)
        "notes": "Shorter season than oranges, peak for holidays"
    },
    "satsuma": {
        "base_temp": 55.0,
        # CALIBRATED: Bloom March → Mature Oct (210 days) → Peak Nov (230 days)
        "gdd_to_maturity": 4600,  # ~210 days
        "gdd_to_peak": 5100,      # ~230 days (early November)
        "gdd_window": 700,        # ~30 days (Oct-Nov)
        "notes": "Early season, cold-tolerant, seedless"
    },

    # === STONE FRUIT ===
    # Base temp 40-45F, bloom to harvest 90-150 days
    "peach": {
        "base_temp": 45.0,
        "gdd_to_maturity": 1800,
        "gdd_to_peak": 2000,
        "gdd_window": 150,              # ~7-14 day window per cultivar
        "chill_hours_required": 650,    # Typical for commercial cultivars
        "notes": "Climacteric, continue ripening after harvest"
    },
    "sweet_cherry": {
        "base_temp": 40.0,
        "gdd_to_maturity": 1400,
        "gdd_to_peak": 1550,
        "gdd_window": 100,              # Very short window (7-10 days)
        "chill_hours_required": 1100,
        "notes": "Non-climacteric, must pick at peak"
    },
    "tart_cherry": {
        # VALIDATED: Zavalloni et al. 2006, J. Amer. Soc. Hort. Sci. 131(5):601-607
        # 'Montmorency' sour cherry phenological model, Michigan State University
        "base_temp": 39.2,              # 4°C - validated by Eisensmith et al. (1980, 1982)
        "gdd_to_maturity": 1000,        # ~1000 GDD base 4°C from full bloom (Fig. 4)
        "gdd_to_peak": 1100,            # Full fruit development
        "gdd_window": 80,               # Very short window (7-10 days)
        "chill_hours_required": 954,    # Richardson et al. 1974, Anderson et al. 1986
        # Phenology from side green (120 GDD from March 1):
        # Green tip: +24, Tight cluster: +44, Open cluster: +60,
        # First white: +78, First bloom: +98, Full bloom: +123, Petal fall: +181
        "gdd_side_green": 120,          # From March 1 to side green
        "gdd_to_full_bloom": 243,       # Total from March 1 (120 + 123)
        "notes": "Primarily for processing. Model R²=0.992 phenology, R²=0.971 fruit growth"
    },

    # === POME FRUIT ===
    # Base temp 40-43F, 130-180 days bloom to harvest
    "apple": {
        "base_temp": 43.0,
        "gdd_to_maturity": 2200,
        "gdd_to_peak": 2500,
        "gdd_window": 200,              # 2-3 week window, varies by cultivar
        "chill_hours_required": 1000,
        "notes": "Climacteric, starch converts to sugar post-harvest"
    },
    "pear": {
        "base_temp": 40.0,
        # Bloom early April, Bartlett harvest mid-Aug (~140 days)
        # At 18 GDD/day (base 40) = 2520 GDD to maturity
        "gdd_to_maturity": 2400,
        "gdd_to_peak": 2700,
        "gdd_window": 800,              # Aug-Oct (Bartlett through Comice)
        "chill_hours_required": 800,
        "notes": "MUST ripen OFF tree, unique among tree fruits"
    },

    # === BERRIES ===
    # Shorter GDD accumulation period
    "strawberry": {
        "base_temp": 50.0,
        # Florida: Dec-Mar harvest, Jan-Feb peak (from Oct 1 planting)
        "gdd_to_maturity": 700,         # ~65 days to December harvest start
        "gdd_to_peak": 1300,            # ~120 days to Jan-Feb peak
        "gdd_window": 1100,             # Dec-Mar = ~105 days
        "notes": "Non-climacteric, must harvest at full color"
    },
    "blueberry": {
        "base_temp": 45.0,
        "gdd_to_maturity": 1200,
        "gdd_to_peak": 1400,
        "gdd_window": 100,
        "chill_hours_required": 800,    # Varies greatly by cultivar
        "notes": "Non-climacteric, multiple picks over 4-6 weeks"
    },

    # === TROPICAL/SUBTROPICAL ===
    "mango": {
        "base_temp": 60.0,
        "gdd_to_maturity": 2800,
        "gdd_to_peak": 3200,
        "gdd_window": 300,              # Varies by cultivar
        "chill_hours_required": 0,      # No chill requirement
        "notes": "Climacteric, chill injury below 55F"
    },
    "pomegranate": {
        "base_temp": 50.0,
        # California: Sept-Nov harvest, Oct-Nov peak (from April 15 bloom)
        "gdd_to_maturity": 3800,        # ~138 days to September start
        "gdd_to_peak": 4500,            # ~165 days to Oct-Nov peak
        "gdd_window": 1000,             # Sept-Nov = ~75 days
        "chill_hours_required": 150,    # Low chill requirement
        "notes": "Non-climacteric, stores well"
    },

    # === NUTS ===
    "pecan": {
        "base_temp": 65.0,
        "gdd_to_maturity": 2600,        # Shuck split
        "gdd_to_peak": 2900,            # Full oil development
        "gdd_window": 400,              # Harvest window generous
        "chill_hours_required": 500,
        "notes": "Quality = oil content not Brix, alternate bearing"
    },
}

# Legacy alias for backward compatibility
CITRUS_GDD_TARGETS = {
    k: v for k, v in CROP_GDD_TARGETS.items()
    if k in ["navel_orange", "valencia", "grapefruit", "tangerine", "satsuma"]
}


def get_gdd_targets(crop_id: str) -> dict:
    """
    Get GDD targets for a crop.

    Falls back to reasonable defaults if crop not in database.
    """
    if crop_id in CROP_GDD_TARGETS:
        return CROP_GDD_TARGETS[crop_id]

    # Default values for unknown crops
    return {
        "base_temp": 50.0,
        "gdd_to_maturity": 1800,
        "gdd_to_peak": 2100,
        "gdd_window": 200,
        "notes": "Default values - crop-specific data not available"
    }
