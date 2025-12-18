"""
Crop Possibility Engine.

Maps every crop to every viable growing region with seasonal availability.
This is the core data layer - "Google Maps of seasonal agriculture."
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..models.crop import Crop, Cultivar, CropCategory
from ..models.region import GrowingRegion, USDAZone
from ..models.harvest import SeasonalAvailability, HarvestWindow


@dataclass
class CropAvailability:
    """Result from the Crop Possibility Engine."""
    crop_id: str
    crop_name: str
    cultivar_id: Optional[str]
    cultivar_name: Optional[str]
    region_id: str
    region_name: str

    # Availability status
    in_season: bool
    in_peak: bool
    days_until_peak: Optional[int]

    # Harvest window
    window_start: date
    window_end: date
    peak_start: date
    peak_end: date

    # Quality prediction
    predicted_peak_brix: Optional[float] = None


class CropPossibilityEngine:
    """
    The Crop Possibility Engine determines what can grow where and when.

    Core responsibilities:
    1. Map crops to viable growing regions (zone compatibility)
    2. Calculate seasonal availability windows
    3. Answer "what's in season near me" queries
    4. Predict peak quality windows for each crop/region

    This is the foundational data layer that farms claim crops against.
    """

    def __init__(self):
        # These would be loaded from database in production
        self.crops: dict[str, Crop] = {}
        self.cultivars: dict[str, Cultivar] = {}
        self.regions: dict[str, GrowingRegion] = {}
        self.availability: dict[str, SeasonalAvailability] = {}

    def register_crop(self, crop: Crop) -> None:
        """Register a crop in the engine."""
        self.crops[crop.id] = crop

    def register_cultivar(self, cultivar: Cultivar) -> None:
        """Register a cultivar in the engine."""
        self.cultivars[cultivar.id] = cultivar

    def register_region(self, region: GrowingRegion) -> None:
        """Register a growing region in the engine."""
        self.regions[region.id] = region

    def set_availability(
        self,
        cultivar_id: str,
        region_id: str,
        availability: SeasonalAvailability
    ) -> None:
        """Set seasonal availability for a cultivar in a region."""
        key = f"{cultivar_id}:{region_id}"
        self.availability[key] = availability

    def can_grow(self, crop_id: str, region_id: str) -> bool:
        """
        Determine if a crop can grow in a region.

        Based on:
        - USDA zone compatibility (for perennials)
        - Frost-free days (for annuals)
        - GDD requirements
        """
        crop = self.crops.get(crop_id)
        region = self.regions.get(region_id)

        if not crop or not region:
            return False

        # Check if crop is in region's viable crops list
        return crop_id in region.viable_crops

    def get_in_season(
        self,
        region_id: str,
        as_of_date: Optional[date] = None
    ) -> list[CropAvailability]:
        """
        Get all crops currently in season for a region.

        This is the core query for "what's in season near me."
        """
        if as_of_date is None:
            as_of_date = date.today()

        results = []
        region = self.regions.get(region_id)
        if not region:
            return results

        for crop_id in region.viable_crops:
            crop = self.crops.get(crop_id)
            if not crop:
                continue

            # Find cultivars for this crop
            crop_cultivars = [
                c for c in self.cultivars.values()
                if c.crop_id == crop_id
            ]

            for cultivar in crop_cultivars:
                key = f"{cultivar.id}:{region_id}"
                avail = self.availability.get(key)
                if not avail:
                    continue

                # Check if in season
                window_start, window_end = avail.get_typical_window(as_of_date.year)
                peak_start, peak_end = avail.get_peak_window(as_of_date.year)

                in_season = window_start <= as_of_date <= window_end
                in_peak = peak_start <= as_of_date <= peak_end

                if in_season:
                    days_until_peak = None
                    if as_of_date < peak_start:
                        days_until_peak = (peak_start - as_of_date).days

                    results.append(CropAvailability(
                        crop_id=crop_id,
                        crop_name=crop.name,
                        cultivar_id=cultivar.id,
                        cultivar_name=cultivar.name,
                        region_id=region_id,
                        region_name=region.name,
                        in_season=True,
                        in_peak=in_peak,
                        days_until_peak=days_until_peak,
                        window_start=window_start,
                        window_end=window_end,
                        peak_start=peak_start,
                        peak_end=peak_end,
                        predicted_peak_brix=avail.historical_peak_brix
                    ))

        return results

    def get_upcoming(
        self,
        region_id: str,
        days_ahead: int = 30,
        as_of_date: Optional[date] = None
    ) -> list[CropAvailability]:
        """
        Get crops coming into season within the specified days.

        Useful for "what's coming soon" features.
        """
        if as_of_date is None:
            as_of_date = date.today()

        results = []
        region = self.regions.get(region_id)
        if not region:
            return results

        for crop_id in region.viable_crops:
            crop = self.crops.get(crop_id)
            if not crop:
                continue

            crop_cultivars = [
                c for c in self.cultivars.values()
                if c.crop_id == crop_id
            ]

            for cultivar in crop_cultivars:
                key = f"{cultivar.id}:{region_id}"
                avail = self.availability.get(key)
                if not avail:
                    continue

                window_start, window_end = avail.get_typical_window(as_of_date.year)
                peak_start, peak_end = avail.get_peak_window(as_of_date.year)

                # Check if window starts within days_ahead
                days_to_start = (window_start - as_of_date).days
                if 0 < days_to_start <= days_ahead:
                    results.append(CropAvailability(
                        crop_id=crop_id,
                        crop_name=crop.name,
                        cultivar_id=cultivar.id,
                        cultivar_name=cultivar.name,
                        region_id=region_id,
                        region_name=region.name,
                        in_season=False,
                        in_peak=False,
                        days_until_peak=(peak_start - as_of_date).days,
                        window_start=window_start,
                        window_end=window_end,
                        peak_start=peak_start,
                        peak_end=peak_end,
                        predicted_peak_brix=avail.historical_peak_brix
                    ))

        return sorted(results, key=lambda x: x.window_start)

    def search_by_crop(
        self,
        crop_id: str,
        as_of_date: Optional[date] = None
    ) -> list[CropAvailability]:
        """
        Find all regions where a specific crop is currently in season.

        This answers "where can I get X right now?"
        """
        if as_of_date is None:
            as_of_date = date.today()

        results = []
        for region in self.regions.values():
            if crop_id not in region.viable_crops:
                continue

            crop = self.crops.get(crop_id)
            if not crop:
                continue

            crop_cultivars = [
                c for c in self.cultivars.values()
                if c.crop_id == crop_id
            ]

            for cultivar in crop_cultivars:
                key = f"{cultivar.id}:{region.id}"
                avail = self.availability.get(key)
                if not avail:
                    continue

                window_start, window_end = avail.get_typical_window(as_of_date.year)
                peak_start, peak_end = avail.get_peak_window(as_of_date.year)

                in_season = window_start <= as_of_date <= window_end
                in_peak = peak_start <= as_of_date <= peak_end

                if in_season:
                    results.append(CropAvailability(
                        crop_id=crop_id,
                        crop_name=crop.name,
                        cultivar_id=cultivar.id,
                        cultivar_name=cultivar.name,
                        region_id=region.id,
                        region_name=region.name,
                        in_season=True,
                        in_peak=in_peak,
                        days_until_peak=None if in_peak else (peak_start - as_of_date).days,
                        window_start=window_start,
                        window_end=window_end,
                        peak_start=peak_start,
                        peak_end=peak_end,
                        predicted_peak_brix=avail.historical_peak_brix
                    ))

        return results
