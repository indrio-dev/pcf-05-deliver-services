"""
Cultivar Database - The researchable foundation of quality prediction.

In practice:
- Soil health is important but typically UNKNOWN for most farms
- What we CAN research and know:
  - Cultivar genetic potential (Brix, nutrition research)
  - Rootstock effects on quality
  - Bloom dates by region
  - Days to maturity
  - GDD requirements

This is the data we can compile from:
- Academic research
- USDA/Land-grant university studies
- Extension service data
- Historical records
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Optional
from enum import Enum


class QualityTier(Enum):
    """Quality tier based on breeding focus and research data."""
    ARTISAN = "artisan"  # Exceptional flavor, specialty/boutique cultivars
    PREMIUM = "premium"  # Heritage/heirloom, bred for flavor/nutrition
    STANDARD = "standard"  # Modern commercial, balanced
    COMMODITY = "commodity"  # Bred for yield/shipping, lower quality ceiling


class BreedingFocus(Enum):
    """What the cultivar was primarily selected for."""
    FLAVOR = "flavor"
    NUTRITION = "nutrition"
    YIELD = "yield"
    APPEARANCE = "appearance"
    SHIPPING = "shipping"
    DISEASE_RESISTANCE = "disease_resistance"


@dataclass
class CultivarResearch:
    """
    Research data for a cultivar - the foundation for quality prediction.

    This is what we can compile from academic research, extension services,
    and historical data without knowing individual farm soil conditions.
    """
    cultivar_id: str
    cultivar_name: str
    crop_type: str  # e.g., "navel_orange", "strawberry", "tomato"

    # === GENETIC POTENTIAL (from research) ===

    # Brix research (what this cultivar CAN achieve)
    research_peak_brix: Optional[float] = None  # Peak Brix from studies
    research_avg_brix: Optional[float] = None   # Average Brix from studies
    research_brix_range: tuple[float, float] = (0, 0)  # Min-max observed

    # Quality tier
    quality_tier: QualityTier = QualityTier.STANDARD
    breeding_focus: list[BreedingFocus] = field(default_factory=list)

    # Heritage status
    is_heritage: bool = False
    is_heirloom: bool = False  # Pre-1950 open-pollinated
    year_introduced: Optional[int] = None

    # === MATURITY DATA ===

    # Days from bloom/planting to harvest
    days_to_maturity: Optional[int] = None
    days_to_maturity_range: tuple[int, int] = (0, 0)

    # GDD requirements (if researched)
    gdd_to_maturity: Optional[int] = None
    gdd_to_peak: Optional[int] = None
    gdd_base_temp: float = 50.0

    # Harvest timing within crop's overall window
    timing_class: str = "mid"  # "early", "mid", "late"

    # === ROOTSTOCK COMPATIBILITY (for tree crops) ===

    recommended_rootstocks: list[str] = field(default_factory=list)
    rootstock_quality_notes: dict[str, str] = field(default_factory=dict)

    # === GROWING REQUIREMENTS ===

    min_chill_hours: Optional[int] = None  # For deciduous tree fruits
    optimal_usda_zones: list[str] = field(default_factory=list)
    cold_hardy_to_f: Optional[int] = None
    heat_tolerant: bool = True

    # === QUALITY CHARACTERISTICS ===

    flavor_profile: Optional[str] = None
    best_use: list[str] = field(default_factory=list)  # ["fresh", "juice", "cooking"]
    nutrition_highlights: list[str] = field(default_factory=list)

    # === RESEARCH SOURCES ===

    research_sources: list[str] = field(default_factory=list)
    last_updated: Optional[date] = None


@dataclass
class RegionalBloomData:
    """
    Bloom/planting dates by region - starts the GDD clock.

    This is researchable from extension services and historical data.
    """
    cultivar_id: str
    region_id: str

    # Bloom dates (for tree crops)
    avg_bloom_start_doy: Optional[int] = None  # Day of year (1-365)
    avg_bloom_peak_doy: Optional[int] = None
    avg_bloom_end_doy: Optional[int] = None

    # Planting dates (for annuals)
    recommended_plant_start_doy: Optional[int] = None
    recommended_plant_end_doy: Optional[int] = None

    # Harvest window (historical)
    historical_harvest_start_doy: Optional[int] = None
    historical_harvest_end_doy: Optional[int] = None
    historical_peak_start_doy: Optional[int] = None
    historical_peak_end_doy: Optional[int] = None

    # Regional GDD accumulation rate
    avg_gdd_per_day_bloom_to_harvest: Optional[float] = None

    # Data quality
    years_of_data: int = 0
    data_source: Optional[str] = None


@dataclass
class RootstockResearch:
    """
    Research data for rootstocks - quality modifiers for tree crops.
    """
    rootstock_id: str
    rootstock_name: str
    crop_types: list[str]  # Which crops this works with

    # Quality effects (from research)
    brix_modifier: float = 0.0  # Added to cultivar base
    brix_modifier_range: tuple[float, float] = (0, 0)

    # Vigor and productivity
    vigor: str = "medium"  # "dwarfing", "semi-dwarfing", "medium", "vigorous"
    yield_effect: str = "neutral"  # "low", "neutral", "high"

    # Disease resistance
    disease_resistance: dict[str, str] = field(default_factory=dict)

    # Regional suitability
    cold_hardy_to_f: Optional[int] = None
    drought_tolerant: bool = False
    salt_tolerant: bool = False
    flood_tolerant: bool = False

    # Special notes
    notes: Optional[str] = None
    research_sources: list[str] = field(default_factory=list)


class CultivarDatabase:
    """
    Database of cultivar research data.

    This is the knowledge base we build from:
    - Academic research partnerships
    - USDA and land-grant university collaboration
    - Extension service data
    - Direct measurements from partner farms

    Phase 1: Build with research data (Brix studies, maturity data)
    Phase 2: Enhance with actual measurements from farm network
    Phase 3: Create comprehensive quality database
    """

    def __init__(self):
        self.cultivars: dict[str, CultivarResearch] = {}
        self.regional_data: dict[str, RegionalBloomData] = {}
        self.rootstocks: dict[str, RootstockResearch] = {}

    def add_cultivar(self, cultivar: CultivarResearch) -> None:
        """Add a cultivar to the database."""
        self.cultivars[cultivar.cultivar_id] = cultivar

    def add_regional_data(self, data: RegionalBloomData) -> None:
        """Add regional bloom/harvest data."""
        key = f"{data.cultivar_id}:{data.region_id}"
        self.regional_data[key] = data

    def add_rootstock(self, rootstock: RootstockResearch) -> None:
        """Add a rootstock to the database."""
        self.rootstocks[rootstock.rootstock_id] = rootstock

    def get_cultivar(self, cultivar_id: str) -> Optional[CultivarResearch]:
        """Get cultivar research data."""
        return self.cultivars.get(cultivar_id)

    def get_regional_data(
        self,
        cultivar_id: str,
        region_id: str
    ) -> Optional[RegionalBloomData]:
        """Get regional bloom/harvest data for a cultivar."""
        key = f"{cultivar_id}:{region_id}"
        return self.regional_data.get(key)

    def get_premium_cultivars(self, crop_type: str) -> list[CultivarResearch]:
        """Get cultivars with premium quality genetics."""
        return [
            c for c in self.cultivars.values()
            if c.crop_type == crop_type and c.quality_tier == QualityTier.PREMIUM
        ]

    def get_heritage_cultivars(self, crop_type: str) -> list[CultivarResearch]:
        """Get heritage/heirloom cultivars."""
        return [
            c for c in self.cultivars.values()
            if c.crop_type == crop_type and (c.is_heritage or c.is_heirloom)
        ]

    def predict_harvest_window(
        self,
        cultivar_id: str,
        region_id: str,
        year: int
    ) -> Optional[dict]:
        """
        Predict harvest window using cultivar maturity data + regional bloom dates.

        Returns dict with window_start, window_end, peak_start, peak_end
        """
        cultivar = self.get_cultivar(cultivar_id)
        regional = self.get_regional_data(cultivar_id, region_id)

        if not cultivar or not regional:
            return None

        # Calculate from bloom date + days to maturity
        if regional.avg_bloom_peak_doy and cultivar.days_to_maturity:
            bloom_doy = regional.avg_bloom_peak_doy
            maturity_doy = bloom_doy + cultivar.days_to_maturity

            # Handle year rollover
            if maturity_doy > 365:
                maturity_year = year + 1
                maturity_doy -= 365
            else:
                maturity_year = year

            from datetime import date, timedelta

            # Window is +/- 15 days around maturity
            maturity_date = date(maturity_year, 1, 1) + timedelta(days=maturity_doy - 1)
            window_start = maturity_date - timedelta(days=15)
            window_end = maturity_date + timedelta(days=30)

            # Peak is centered +/- 10 days
            peak_start = maturity_date - timedelta(days=5)
            peak_end = maturity_date + timedelta(days=15)

            return {
                "window_start": window_start,
                "window_end": window_end,
                "peak_start": peak_start,
                "peak_end": peak_end,
                "expected_peak_brix": cultivar.research_peak_brix,
                "quality_tier": cultivar.quality_tier.value
            }

        # Fallback to historical data
        if regional.historical_harvest_start_doy:
            from datetime import date, timedelta

            start = date(year, 1, 1) + timedelta(days=regional.historical_harvest_start_doy - 1)
            end = date(year, 1, 1) + timedelta(days=regional.historical_harvest_end_doy - 1)

            peak_start = start
            peak_end = end
            if regional.historical_peak_start_doy:
                peak_start = date(year, 1, 1) + timedelta(days=regional.historical_peak_start_doy - 1)
            if regional.historical_peak_end_doy:
                peak_end = date(year, 1, 1) + timedelta(days=regional.historical_peak_end_doy - 1)

            return {
                "window_start": start,
                "window_end": end,
                "peak_start": peak_start,
                "peak_end": peak_end,
                "expected_peak_brix": cultivar.research_peak_brix,
                "quality_tier": cultivar.quality_tier.value
            }

        return None


# Example data from your research

WASHINGTON_NAVEL = CultivarResearch(
    cultivar_id="washington_navel",
    cultivar_name="Washington Navel",
    crop_type="navel_orange",
    research_peak_brix=12.5,
    research_avg_brix=11.5,
    research_brix_range=(10.5, 13.0),
    quality_tier=QualityTier.PREMIUM,
    breeding_focus=[BreedingFocus.FLAVOR],
    is_heritage=True,
    year_introduced=1870,
    days_to_maturity=270,
    gdd_to_maturity=2000,
    gdd_to_peak=2300,
    gdd_base_temp=55.0,
    timing_class="mid",
    recommended_rootstocks=["carrizo", "c35", "sour_orange"],
    optimal_usda_zones=["9a", "9b", "10a", "10b"],
    flavor_profile="Sweet, low acid, classic navel flavor",
    best_use=["fresh"],
    research_sources=[
        "UF/IFAS Citrus Extension",
        "USDA Citrus Maturity Studies"
    ]
)

FLORIDA_NAVEL_REGIONAL = RegionalBloomData(
    cultivar_id="washington_navel",
    region_id="indian_river",
    avg_bloom_start_doy=75,  # Mid-March
    avg_bloom_peak_doy=85,   # Late March
    avg_bloom_end_doy=95,    # Early April
    historical_harvest_start_doy=305,  # Nov 1
    historical_harvest_end_doy=31,     # Jan 31 (next year)
    historical_peak_start_doy=335,     # Dec 1 (middle 30 days of 90-day season)
    historical_peak_end_doy=365,       # Dec 31
    avg_gdd_per_day_bloom_to_harvest=11.5,
    years_of_data=20,
    data_source="UF/IFAS Historical Records"
)

CARRIZO_ROOTSTOCK = RootstockResearch(
    rootstock_id="carrizo",
    rootstock_name="Carrizo Citrange",
    crop_types=["navel_orange", "valencia", "grapefruit"],
    brix_modifier=0.6,
    brix_modifier_range=(0.3, 0.8),
    vigor="medium",
    yield_effect="neutral",
    disease_resistance={
        "tristeza": "tolerant",
        "phytophthora": "moderate",
        "citrus_nematode": "susceptible"
    },
    cold_hardy_to_f=24,
    notes="Consistently lifts SSC/internal quality on navels",
    research_sources=["Wutscher Rootstock Studies", "UF/IFAS Extension"]
)
