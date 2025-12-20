"""
Crop and Cultivar models for the Crop Possibility Engine.

The Crop Possibility Engine maps every crop to every viable growing region
with seasonal availability windows.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class CropCategory(Enum):
    """Major crop categories."""
    CITRUS = "citrus"
    TREE_FRUIT = "tree_fruit"
    BERRIES = "berries"
    MELONS = "melons"
    TROPICAL = "tropical"
    VEGETABLES = "vegetables"
    LEAFY_GREENS = "leafy_greens"
    ROOT_VEGETABLES = "root_vegetables"
    LEGUMES = "legumes"
    HERBS = "herbs"


class CropType(Enum):
    """Annual vs perennial classification."""
    ANNUAL = "annual"
    PERENNIAL = "perennial"


@dataclass
class Crop:
    """
    A crop species/type that can be grown.

    Example: "Navel Orange", "Roma Tomato", "Strawberry"
    """
    id: str
    name: str
    category: CropCategory
    crop_type: CropType

    # GDD parameters for this crop (base temperature in Fahrenheit)
    gdd_base_temp: float = 50.0  # Default base temp; citrus uses 55

    # For perennials: minimum years before genetic potential is reached
    min_maturity_years: Optional[int] = None

    # General harvest window length in days (crop-level default)
    typical_harvest_days: int = 30


@dataclass
class Cultivar:
    """
    A specific variety/cultivar of a crop.

    Example: "Washington Navel" (cultivar) of "Navel Orange" (crop)

    Cultivar determines genetic ceiling for quality (Brix, nutrition).
    """
    id: str
    name: str
    crop_id: str  # Reference to parent Crop

    # Genetic potential - the ceiling this cultivar can reach
    max_brix: Optional[float] = None  # Peak Brix under ideal conditions

    # Harvest timing characteristics
    early_mid_late: str = "mid"  # "early", "mid", "late" within crop's season
    harvest_window_days: Optional[int] = None  # Override crop default

    # For tree crops: rootstock compatibility notes
    recommended_rootstocks: list[str] = field(default_factory=list)

    # Quality notes
    flavor_profile: Optional[str] = None
    best_use: Optional[str] = None  # "fresh eating", "juice", "processing"


@dataclass
class Rootstock:
    """
    Rootstock for tree crops. Affects vigor, disease resistance, and quality.

    Rootstock modifies the cultivar's genetic potential:
    - Higher quality stocks (Carrizo, Sour Orange): +0.3 to +0.8 Brix
    - Lower quality stocks (Swingle, Rough Lemon): -0.5 to -1.0 Brix
    """
    id: str
    name: str
    crop_category: CropCategory  # Which crop types this rootstock works with

    # Quality modifier (added to cultivar's base Brix)
    brix_modifier: float = 0.0

    # Characteristics
    vigor: str = "medium"  # "low", "medium", "high"
    disease_resistance: dict[str, str] = field(default_factory=dict)
    notes: Optional[str] = None


# Common citrus rootstocks with Brix modifiers (from your research)
CITRUS_ROOTSTOCKS = {
    "carrizo": Rootstock(
        id="carrizo",
        name="Carrizo Citrange",
        crop_category=CropCategory.CITRUS,
        brix_modifier=0.6,
        vigor="medium",
        notes="Consistently lifts SSC/internal quality on navels"
    ),
    "c35": Rootstock(
        id="c35",
        name="C-35 Citrange",
        crop_category=CropCategory.CITRUS,
        brix_modifier=0.6,
        vigor="medium",
        notes="Similar to Carrizo"
    ),
    "sour_orange": Rootstock(
        id="sour_orange",
        name="Sour Orange",
        crop_category=CropCategory.CITRUS,
        brix_modifier=0.5,
        vigor="medium",
        notes="High quality but CTV susceptible - legacy blocks only"
    ),
    "trifoliate": Rootstock(
        id="trifoliate",
        name="Trifoliate Orange",
        crop_category=CropCategory.CITRUS,
        brix_modifier=0.5,
        vigor="low",
        notes="High SSC, smaller fruit"
    ),
    "cleopatra": Rootstock(
        id="cleopatra",
        name="Cleopatra Mandarin",
        crop_category=CropCategory.CITRUS,
        brix_modifier=0.2,
        vigor="medium",
        notes="Good SSC but slow to bear"
    ),
    "swingle": Rootstock(
        id="swingle",
        name="Swingle Citrumelo",
        crop_category=CropCategory.CITRUS,
        brix_modifier=-0.5,
        vigor="high",
        notes="Lower SSC, granulation risk for navels"
    ),
    "rough_lemon": Rootstock(
        id="rough_lemon",
        name="Rough Lemon",
        crop_category=CropCategory.CITRUS,
        brix_modifier=-0.7,
        vigor="high",
        notes="Vigorous, dilutes SSC"
    ),
    "volkamer": Rootstock(
        id="volkamer",
        name="Volkamer Lemon",
        crop_category=CropCategory.CITRUS,
        brix_modifier=-0.7,
        vigor="high",
        notes="Similar to Rough Lemon"
    ),
    "macrophylla": Rootstock(
        id="macrophylla",
        name="Macrophylla",
        crop_category=CropCategory.CITRUS,
        brix_modifier=-0.8,
        vigor="high",
        notes="Lowest SSC grouping"
    ),
}
