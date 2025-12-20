"""
Geo-Search Service.

Connects consumers to farms based on location, crop availability,
and quality predictions.
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..models.region import Location
from ..models.farm import Farm, FarmCrop, FarmAvailability
from .crop_engine import CropPossibilityEngine, CropAvailability


@dataclass
class FarmSearchResult:
    """A farm result from geo-search."""
    farm: Farm
    farm_crop: FarmCrop
    crop_availability: CropAvailability

    # Distance from search location
    distance_miles: float

    # Estimated transit time (part of "Ripen")
    estimated_transit_days: int

    # Quality prediction
    predicted_brix: Optional[float] = None

    # Availability
    in_stock: bool = False
    estimated_available_lbs: Optional[int] = None


class GeoSearchService:
    """
    Geo-search service for finding farms near a location.

    This is the consumer-facing discovery layer that answers:
    - "What's in season near me?"
    - "Where can I get X near me?"
    - "What farms have peak-quality Y right now?"

    Results are sorted by relevance (in-peak, distance, quality).
    """

    def __init__(self, crop_engine: CropPossibilityEngine):
        self.crop_engine = crop_engine
        self.farms: dict[str, Farm] = {}
        self.farm_crops: dict[str, FarmCrop] = {}
        self.availability: dict[str, FarmAvailability] = {}

    def register_farm(self, farm: Farm) -> None:
        """Register a farm in the search index."""
        self.farms[farm.id] = farm

    def register_farm_crop(self, farm_crop: FarmCrop) -> None:
        """Register a farm's crop claim."""
        self.farm_crops[farm_crop.id] = farm_crop

    def update_availability(self, availability: FarmAvailability) -> None:
        """Update real-time availability for a farm crop."""
        self.availability[availability.farm_crop_id] = availability

    def estimate_transit_days(self, distance_miles: float) -> int:
        """
        Estimate transit time based on distance.

        This is part of "Ripen" - harvest at peak + rush to consumer.
        """
        if distance_miles < 50:
            return 1  # Local delivery
        elif distance_miles < 300:
            return 2  # Regional
        elif distance_miles < 1000:
            return 3  # Ground shipping
        else:
            return 4  # Cross-country

    def search_near_location(
        self,
        location: Location,
        max_distance_miles: float = 500.0,
        crop_id: Optional[str] = None,
        in_peak_only: bool = False,
        as_of_date: Optional[date] = None
    ) -> list[FarmSearchResult]:
        """
        Search for farms near a location.

        Args:
            location: Consumer's location
            max_distance_miles: Maximum search radius
            crop_id: Filter to specific crop (optional)
            in_peak_only: Only return farms with peak-quality product
            as_of_date: Date to check availability (default: today)

        Returns:
            List of FarmSearchResult sorted by relevance
        """
        if as_of_date is None:
            as_of_date = date.today()

        results = []

        for farm in self.farms.values():
            # Calculate distance
            distance = location.distance_to(farm.location)
            if distance > max_distance_miles:
                continue

            # Check farm's crops
            for fc_id in farm.claimed_crops:
                farm_crop = self.farm_crops.get(fc_id)
                if not farm_crop:
                    continue

                # Filter by crop if specified
                if crop_id:
                    cultivar = self.crop_engine.cultivars.get(farm_crop.cultivar_id)
                    if not cultivar or cultivar.crop_id != crop_id:
                        continue

                # Get crop availability from engine
                cultivar = self.crop_engine.cultivars.get(farm_crop.cultivar_id)
                if not cultivar:
                    continue

                key = f"{cultivar.id}:{farm.region_id}"
                avail = self.crop_engine.availability.get(key)
                if not avail:
                    continue

                # Check if in season
                window_start, window_end = avail.get_typical_window(as_of_date.year)
                peak_start, peak_end = avail.get_peak_window(as_of_date.year)

                in_season = window_start <= as_of_date <= window_end
                in_peak = peak_start <= as_of_date <= peak_end

                if not in_season:
                    continue

                if in_peak_only and not in_peak:
                    continue

                # Get real-time availability
                farm_avail = self.availability.get(fc_id)
                in_stock = farm_avail.accepting_orders if farm_avail else False
                available_lbs = farm_avail.estimated_available_lbs if farm_avail else None

                # Build result
                crop = self.crop_engine.crops.get(cultivar.crop_id)
                crop_availability = CropAvailability(
                    crop_id=cultivar.crop_id,
                    crop_name=crop.name if crop else "",
                    cultivar_id=cultivar.id,
                    cultivar_name=cultivar.name,
                    region_id=farm.region_id,
                    region_name="",
                    in_season=in_season,
                    in_peak=in_peak,
                    days_until_peak=None if in_peak else (peak_start - as_of_date).days,
                    window_start=window_start,
                    window_end=window_end,
                    peak_start=peak_start,
                    peak_end=peak_end,
                    predicted_peak_brix=avail.historical_peak_brix
                )

                transit_days = self.estimate_transit_days(distance)

                results.append(FarmSearchResult(
                    farm=farm,
                    farm_crop=farm_crop,
                    crop_availability=crop_availability,
                    distance_miles=round(distance, 1),
                    estimated_transit_days=transit_days,
                    predicted_brix=farm_crop.claimed_brix or avail.historical_peak_brix,
                    in_stock=in_stock,
                    estimated_available_lbs=available_lbs
                ))

        # Sort by: in_peak first, then distance, then predicted quality
        results.sort(key=lambda r: (
            not r.crop_availability.in_peak,  # Peak first
            r.distance_miles,  # Closer first
            -(r.predicted_brix or 0)  # Higher Brix first
        ))

        return results

    def search_by_crop_near_location(
        self,
        crop_id: str,
        location: Location,
        max_distance_miles: float = 500.0
    ) -> list[FarmSearchResult]:
        """
        Find farms selling a specific crop near a location.

        Convenience method for "Where can I get X near me?"
        """
        return self.search_near_location(
            location=location,
            max_distance_miles=max_distance_miles,
            crop_id=crop_id,
            in_peak_only=False
        )

    def get_peak_quality_farms(
        self,
        location: Location,
        max_distance_miles: float = 500.0
    ) -> list[FarmSearchResult]:
        """
        Find farms with peak-quality product near a location.

        Convenience method for "What's at peak quality near me?"
        """
        return self.search_near_location(
            location=location,
            max_distance_miles=max_distance_miles,
            in_peak_only=True
        )
