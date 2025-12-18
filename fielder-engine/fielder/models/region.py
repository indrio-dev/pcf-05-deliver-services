"""
Geographic region models for the Crop Possibility Engine.

Maps growing regions with their climate characteristics to determine
what crops can grow where and when.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class USDAZone(Enum):
    """
    USDA Plant Hardiness Zones.

    Note: These are for PERENNIAL cold tolerance, NOT annual crop timing.
    For annual crop timing, use freeze dates, soil temps, and GDD instead.
    """
    ZONE_1 = "1"
    ZONE_2 = "2"
    ZONE_3 = "3"
    ZONE_4 = "4"
    ZONE_5 = "5"
    ZONE_6 = "6"
    ZONE_7 = "7"
    ZONE_8 = "8"
    ZONE_9 = "9"
    ZONE_10 = "10"
    ZONE_11 = "11"
    ZONE_12 = "12"
    ZONE_13 = "13"


@dataclass
class ClimateData:
    """Climate characteristics for a region."""

    # Frost dates (day of year, 1-365)
    avg_last_frost_doy: int  # Day of year for average last spring frost
    avg_first_frost_doy: int  # Day of year for average first fall frost

    # Growing season length
    frost_free_days: int

    # Typical GDD accumulation per year (base 50F)
    annual_gdd_50: Optional[int] = None

    # Chill hours (for tree fruits that need winter dormancy)
    avg_chill_hours: Optional[int] = None  # Hours below 45F

    # USDA zone (for perennial hardiness reference)
    usda_zone: Optional[USDAZone] = None


@dataclass
class GrowingRegion:
    """
    A geographic region where crops can be grown.

    Can be as broad as a state or as specific as a county/microclimate.
    """
    id: str
    name: str
    state: str

    # Geographic center (for distance calculations)
    latitude: float
    longitude: float

    # Climate data
    climate: ClimateData

    # Crops that can be grown in this region (populated by Crop Possibility Engine)
    viable_crops: list[str] = field(default_factory=list)  # List of crop IDs


@dataclass
class Location:
    """A specific point location (for consumer/farm positioning)."""
    latitude: float
    longitude: float

    # Optional address components
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

    def distance_to(self, other: "Location") -> float:
        """
        Calculate distance in miles to another location.
        Uses Haversine formula for great-circle distance.
        """
        import math

        R = 3959  # Earth's radius in miles

        lat1, lon1 = math.radians(self.latitude), math.radians(self.longitude)
        lat2, lon2 = math.radians(other.latitude), math.radians(other.longitude)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))

        return R * c


# =============================================================================
# US GROWING REGIONS
# =============================================================================
# Major agricultural regions for the MVP crop set

US_GROWING_REGIONS = {
    # === SOUTHEAST ===
    "indian_river": GrowingRegion(
        id="indian_river",
        name="Indian River District",
        state="FL",
        latitude=27.6,
        longitude=-80.4,
        climate=ClimateData(
            avg_last_frost_doy=45,  # Mid-February
            avg_first_frost_doy=350,  # Mid-December
            frost_free_days=305,
            annual_gdd_50=5500,
            avg_chill_hours=150,
            usda_zone=USDAZone.ZONE_10
        ),
        viable_crops=["navel_orange", "grapefruit", "tangerine", "valencia"]
    ),
    "central_florida": GrowingRegion(
        id="central_florida",
        name="Central Florida",
        state="FL",
        latitude=28.5,
        longitude=-81.4,
        climate=ClimateData(
            avg_last_frost_doy=52,
            avg_first_frost_doy=340,
            frost_free_days=288,
            annual_gdd_50=5200,
            avg_chill_hours=200,
            usda_zone=USDAZone.ZONE_9
        ),
        viable_crops=["navel_orange", "strawberry", "blueberry"]
    ),
    "south_florida": GrowingRegion(
        id="south_florida",
        name="South Florida (Miami-Dade/Homestead)",
        state="FL",
        latitude=25.5,
        longitude=-80.4,
        climate=ClimateData(
            avg_last_frost_doy=15,  # Mid-January (rare)
            avg_first_frost_doy=365,  # Almost never
            frost_free_days=350,
            annual_gdd_50=7000,
            avg_chill_hours=50,
            usda_zone=USDAZone.ZONE_10
        ),
        viable_crops=["mango", "tropical_fruits"]
    ),
    "sweet_valley": GrowingRegion(
        id="sweet_valley",
        name="Sweet Valley (FL Panhandle / S. Alabama / S. Georgia)",
        state="FL",  # Spans FL Panhandle, S. AL, S. GA
        latitude=30.5,
        longitude=-86.5,  # Central to the region (around Crestview, FL area)
        climate=ClimateData(
            avg_last_frost_doy=60,  # Late February
            avg_first_frost_doy=330,  # Late November
            frost_free_days=270,
            annual_gdd_50=4200,
            avg_chill_hours=450,  # More chill than South FL
            usda_zone=USDAZone.ZONE_9
        ),
        viable_crops=["satsuma", "navel_orange", "pecan", "blueberry"]
    ),
    "georgia_piedmont": GrowingRegion(
        id="georgia_piedmont",
        name="Georgia Piedmont (Peach Belt)",
        state="GA",
        latitude=32.8,
        longitude=-83.6,
        climate=ClimateData(
            avg_last_frost_doy=90,  # Late March
            avg_first_frost_doy=310,  # Early November
            frost_free_days=220,
            annual_gdd_50=3800,
            avg_chill_hours=700,
            usda_zone=USDAZone.ZONE_8
        ),
        viable_crops=["peach", "blueberry", "pecan"]
    ),

    # === TEXAS/SOUTHWEST ===
    "texas_rgv": GrowingRegion(
        id="texas_rgv",
        name="Texas Rio Grande Valley",
        state="TX",
        latitude=26.2,
        longitude=-98.2,
        climate=ClimateData(
            avg_last_frost_doy=35,  # Early February
            avg_first_frost_doy=355,  # Late December
            frost_free_days=320,
            annual_gdd_50=6000,
            avg_chill_hours=200,
            usda_zone=USDAZone.ZONE_9
        ),
        viable_crops=["grapefruit", "navel_orange", "tangerine"]
    ),
    "texas_hill_country": GrowingRegion(
        id="texas_hill_country",
        name="Texas Hill Country",
        state="TX",
        latitude=30.3,
        longitude=-98.5,
        climate=ClimateData(
            avg_last_frost_doy=80,  # Late March
            avg_first_frost_doy=320,  # Mid-November
            frost_free_days=240,
            annual_gdd_50=4200,
            avg_chill_hours=500,
            usda_zone=USDAZone.ZONE_8
        ),
        viable_crops=["peach", "pecan"]
    ),
    "texas_pecan_belt": GrowingRegion(
        id="texas_pecan_belt",
        name="Texas Pecan Belt (Central)",
        state="TX",
        latitude=31.5,
        longitude=-97.0,
        climate=ClimateData(
            avg_last_frost_doy=75,  # Mid-March
            avg_first_frost_doy=320,  # Mid-November
            frost_free_days=245,
            annual_gdd_50=4500,
            avg_chill_hours=600,
            usda_zone=USDAZone.ZONE_8
        ),
        viable_crops=["pecan"]
    ),

    # === CALIFORNIA ===
    "california_central_valley": GrowingRegion(
        id="california_central_valley",
        name="California Central Valley (Fresno/Visalia)",
        state="CA",
        latitude=36.7,
        longitude=-119.8,
        climate=ClimateData(
            avg_last_frost_doy=60,  # Early March
            avg_first_frost_doy=335,  # Early December
            frost_free_days=275,
            annual_gdd_50=5000,
            avg_chill_hours=600,
            usda_zone=USDAZone.ZONE_9
        ),
        viable_crops=["peach", "navel_orange", "pomegranate", "cherry", "sweet_cherry", "apple"]
    ),
    "california_coastal": GrowingRegion(
        id="california_coastal",
        name="California Central Coast (Watsonville)",
        state="CA",
        latitude=36.9,
        longitude=-121.8,
        climate=ClimateData(
            avg_last_frost_doy=45,  # Mid-February
            avg_first_frost_doy=355,  # Late December
            frost_free_days=310,
            annual_gdd_50=2500,  # Cooler maritime
            avg_chill_hours=1000,
            usda_zone=USDAZone.ZONE_9
        ),
        viable_crops=["strawberry", "apple"]
    ),
    "california_southern_desert": GrowingRegion(
        id="california_southern_desert",
        name="California Southern Desert (Coachella)",
        state="CA",
        latitude=33.7,
        longitude=-116.2,
        climate=ClimateData(
            avg_last_frost_doy=30,  # Late January
            avg_first_frost_doy=350,  # Mid-December
            frost_free_days=320,
            annual_gdd_50=6500,
            avg_chill_hours=200,
            usda_zone=USDAZone.ZONE_10
        ),
        viable_crops=["navel_orange", "grapefruit"]
    ),

    # === PACIFIC NORTHWEST ===
    "pacific_nw_yakima": GrowingRegion(
        id="pacific_nw_yakima",
        name="Washington Yakima Valley",
        state="WA",
        latitude=46.6,
        longitude=-120.5,
        climate=ClimateData(
            avg_last_frost_doy=120,  # Late April
            avg_first_frost_doy=290,  # Mid-October
            frost_free_days=170,
            annual_gdd_50=2400,
            avg_chill_hours=1200,
            usda_zone=USDAZone.ZONE_6
        ),
        viable_crops=["apple", "cherry", "sweet_cherry", "pear"]
    ),
    "pacific_nw_wenatchee": GrowingRegion(
        id="pacific_nw_wenatchee",
        name="Washington Wenatchee Valley",
        state="WA",
        latitude=47.4,
        longitude=-120.3,
        climate=ClimateData(
            avg_last_frost_doy=115,  # Late April
            avg_first_frost_doy=285,  # Mid-October
            frost_free_days=170,
            annual_gdd_50=2300,
            avg_chill_hours=1300,
            usda_zone=USDAZone.ZONE_6
        ),
        viable_crops=["apple", "cherry", "pear"]
    ),
    "pacific_nw_hood_river": GrowingRegion(
        id="pacific_nw_hood_river",
        name="Oregon Hood River Valley",
        state="OR",
        latitude=45.7,
        longitude=-121.5,
        climate=ClimateData(
            avg_last_frost_doy=110,  # Late April
            avg_first_frost_doy=290,  # Mid-October
            frost_free_days=180,
            annual_gdd_50=2200,
            avg_chill_hours=1100,
            usda_zone=USDAZone.ZONE_7
        ),
        viable_crops=["pear", "apple", "cherry"]
    ),

    # === MIDWEST ===
    "michigan_west": GrowingRegion(
        id="michigan_west",
        name="West Michigan (Grand Traverse/Leelanau)",
        state="MI",
        latitude=44.8,
        longitude=-85.6,
        climate=ClimateData(
            avg_last_frost_doy=135,  # Mid-May
            avg_first_frost_doy=275,  # Early October
            frost_free_days=140,
            annual_gdd_50=2600,
            avg_chill_hours=1400,
            usda_zone=USDAZone.ZONE_5
        ),
        viable_crops=["tart_cherry", "sweet_cherry", "apple", "blueberry"]
    ),
    "michigan_southwest": GrowingRegion(
        id="michigan_southwest",
        name="Southwest Michigan (Berrien County)",
        state="MI",
        latitude=42.0,
        longitude=-86.5,
        climate=ClimateData(
            avg_last_frost_doy=130,  # Early May
            avg_first_frost_doy=280,  # Early October
            frost_free_days=150,
            annual_gdd_50=2800,
            avg_chill_hours=1200,
            usda_zone=USDAZone.ZONE_6
        ),
        viable_crops=["blueberry", "apple", "peach"]
    ),
    "wisconsin_door_county": GrowingRegion(
        id="wisconsin_door_county",
        name="Wisconsin Door County",
        state="WI",
        latitude=45.0,
        longitude=-87.2,
        climate=ClimateData(
            avg_last_frost_doy=140,  # Late May
            avg_first_frost_doy=270,  # Late September
            frost_free_days=130,
            annual_gdd_50=2400,
            avg_chill_hours=1500,
            usda_zone=USDAZone.ZONE_5
        ),
        viable_crops=["tart_cherry", "apple"]
    ),

    # === NORTHEAST ===
    "new_york_hudson_valley": GrowingRegion(
        id="new_york_hudson_valley",
        name="New York Hudson Valley",
        state="NY",
        latitude=41.7,
        longitude=-73.9,
        climate=ClimateData(
            avg_last_frost_doy=120,  # Late April
            avg_first_frost_doy=290,  # Mid-October
            frost_free_days=170,
            annual_gdd_50=2600,
            avg_chill_hours=1100,
            usda_zone=USDAZone.ZONE_6
        ),
        viable_crops=["apple", "blueberry"]
    ),
    "new_york_finger_lakes": GrowingRegion(
        id="new_york_finger_lakes",
        name="New York Finger Lakes",
        state="NY",
        latitude=42.5,
        longitude=-76.5,
        climate=ClimateData(
            avg_last_frost_doy=125,  # Early May
            avg_first_frost_doy=280,  # Early October
            frost_free_days=155,
            annual_gdd_50=2400,
            avg_chill_hours=1200,
            usda_zone=USDAZone.ZONE_6
        ),
        viable_crops=["apple", "blueberry", "tart_cherry"]
    ),
    "pennsylvania_adams_county": GrowingRegion(
        id="pennsylvania_adams_county",
        name="Pennsylvania Adams County (Gettysburg)",
        state="PA",
        latitude=39.8,
        longitude=-77.2,
        climate=ClimateData(
            avg_last_frost_doy=115,  # Late April
            avg_first_frost_doy=290,  # Mid-October
            frost_free_days=175,
            annual_gdd_50=2700,
            avg_chill_hours=1000,
            usda_zone=USDAZone.ZONE_6
        ),
        viable_crops=["apple", "peach", "blueberry"]
    ),
    "new_jersey_pine_barrens": GrowingRegion(
        id="new_jersey_pine_barrens",
        name="New Jersey Pine Barrens",
        state="NJ",
        latitude=39.8,
        longitude=-74.5,
        climate=ClimateData(
            avg_last_frost_doy=115,  # Late April
            avg_first_frost_doy=290,  # Mid-October
            frost_free_days=175,
            annual_gdd_50=2800,
            avg_chill_hours=1000,
            usda_zone=USDAZone.ZONE_7
        ),
        viable_crops=["blueberry"]
    ),
}

# Legacy alias for backward compatibility
FLORIDA_REGIONS = {k: v for k, v in US_GROWING_REGIONS.items() if v.state == "FL"}
