"""
Farm and provider models.

Farms claim crops in their region, enabling the marketplace layer
on top of the Crop Possibility Engine.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Optional
from enum import Enum

from .region import Location


class FarmStatus(Enum):
    """Farm verification status."""
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"


class FulfillmentType(Enum):
    """How the farm can fulfill orders."""
    FARM_PICKUP = "farm_pickup"
    LOCAL_DELIVERY = "local_delivery"  # DoorDash, Instacart, etc.
    REGIONAL_SHIPPING = "regional_shipping"  # Parcel carriers
    NATIONAL_SHIPPING = "national_shipping"


@dataclass
class Farm:
    """
    A farm that can provide products to consumers.

    Farms claim crops in their region and become discoverable
    when those crops are in season.
    """
    id: str
    name: str
    location: Location
    region_id: str

    # Contact/business info
    owner_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

    # Verification
    status: FarmStatus = FarmStatus.PENDING
    verified_date: Optional[date] = None

    # Fulfillment capabilities
    fulfillment_types: list[FulfillmentType] = field(default_factory=list)
    max_shipping_radius_miles: Optional[int] = None

    # Crops this farm provides (list of FarmCrop IDs)
    claimed_crops: list[str] = field(default_factory=list)


@dataclass
class FarmCrop:
    """
    A crop claimed by a specific farm.

    This links a farm to a cultivar with farm-specific details
    like tree age (for perennials), rootstock, and acreage.
    """
    id: str
    farm_id: str
    cultivar_id: str

    # For tree crops: age and rootstock affect quality
    tree_age_years: Optional[int] = None
    rootstock_id: Optional[str] = None

    # Scale
    acreage: Optional[float] = None
    estimated_annual_yield_lbs: Optional[int] = None

    # Availability
    available: bool = True
    available_from: Optional[date] = None
    available_until: Optional[date] = None

    # Quality claims (verified through testing or self-reported)
    claimed_brix: Optional[float] = None
    last_brix_test_date: Optional[date] = None
    organic_certified: bool = False

    # Pricing
    price_per_lb: Optional[float] = None
    min_order_lbs: Optional[float] = None

    def calculate_predicted_brix(
        self,
        cultivar_base_brix: float,
        rootstock_modifier: float = 0.0
    ) -> float:
        """
        Calculate predicted peak Brix for this farm's crop.

        Based on your algorithm:
        Peak Brix = Cultivar Base + Rootstock Modifier + Age Modifier

        Age modifier:
        - 0-2 yrs: -0.8
        - 3-4 yrs: -0.5
        - 5-7 yrs: -0.2
        - 8-18 yrs: 0.0 (prime)
        - 19-25 yrs: -0.2
        - >25 yrs: -0.3
        """
        # Age modifier
        age_mod = 0.0
        if self.tree_age_years is not None:
            age = self.tree_age_years
            if age <= 2:
                age_mod = -0.8
            elif age <= 4:
                age_mod = -0.5
            elif age <= 7:
                age_mod = -0.2
            elif age <= 18:
                age_mod = 0.0  # Prime
            elif age <= 25:
                age_mod = -0.2
            else:
                age_mod = -0.3

        return cultivar_base_brix + rootstock_modifier + age_mod


@dataclass
class FarmAvailability:
    """
    Real-time availability for a farm's crop.

    Updated by farms to indicate current inventory and
    readiness to fulfill orders.
    """
    farm_crop_id: str
    date_updated: date

    # Current status
    in_season: bool = False
    in_peak: bool = False

    # Inventory
    estimated_available_lbs: Optional[int] = None
    accepting_orders: bool = False

    # Lead time (harvest to ship)
    lead_time_days: int = 1  # "Ripen" includes harvest + transit

    # Current quality (if recently tested)
    current_brix: Optional[float] = None
    current_brix_date: Optional[date] = None
