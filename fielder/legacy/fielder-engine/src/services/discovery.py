"""
Discovery Service - Consumer-facing "what's near me" experience.

This is the shoppable data stream that answers:
- "What's at peak quality near me right now?"
- "Which farms near me have the best citrus?"
- "When will local strawberries be ready?"

The key insight: We're not just listing farms.
We're predicting QUALITY WINDOWS and surfacing the RIGHT products
at the RIGHT time to the RIGHT consumers.
"""

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional
from enum import Enum


class DiscoveryIntent(Enum):
    """What the consumer is looking for."""
    WHATS_READY_NOW = "whats_ready_now"  # "What can I get today?"
    PEAK_QUALITY = "peak_quality"         # "What's at absolute peak?"
    SPECIFIC_CROP = "specific_crop"       # "Where can I find X?"
    UPCOMING = "upcoming"                  # "What's coming soon?"
    BEST_NEAR_ME = "best_near_me"         # "Best quality farms nearby"


class QualityTier(Enum):
    """Quality tier for consumer filtering."""
    PREMIUM = "premium"      # Heritage cultivars, peak timing
    STANDARD = "standard"    # Good commercial, reasonable timing
    ANY = "any"              # Include commodity


@dataclass
class DiscoveryQuery:
    """
    Consumer search query.

    Location-aware, date-aware, quality-aware.
    """
    # Location
    latitude: float
    longitude: float
    max_distance_miles: float = 50.0

    # What they want
    intent: DiscoveryIntent = DiscoveryIntent.WHATS_READY_NOW
    crop_types: list[str] = field(default_factory=list)  # Empty = all

    # Quality preferences
    min_quality_tier: QualityTier = QualityTier.STANDARD
    prefer_heritage: bool = False

    # Timing
    as_of_date: Optional[date] = None  # Default = today
    look_ahead_days: int = 0           # For upcoming intent

    def __post_init__(self):
        if self.as_of_date is None:
            self.as_of_date = date.today()


@dataclass
class DiscoveryResult:
    """
    A single result in consumer discovery.

    Combines farm, crop, timing, and quality information
    into a shoppable result.
    """
    # The farm
    farm_id: str
    farm_name: str
    farm_location: tuple[float, float]  # lat, lon
    distance_miles: float

    # The crop
    crop_id: str
    crop_name: str
    cultivar_id: Optional[str] = None
    cultivar_name: Optional[str] = None

    # Quality prediction
    quality_tier: str = "standard"
    predicted_brix: Optional[float] = None
    predicted_brix_range: tuple[float, float] = (0, 0)
    is_heritage: bool = False

    # Timing
    window_status: str = "in_window"  # "early", "peak", "in_window", "late", "upcoming"
    window_start: Optional[date] = None
    window_end: Optional[date] = None
    peak_start: Optional[date] = None
    peak_end: Optional[date] = None
    days_until_peak: Optional[int] = None
    days_remaining: Optional[int] = None

    # Confidence
    prediction_confidence: float = 0.5
    confidence_label: str = "moderate"  # "high", "moderate", "limited"

    # Display
    headline: str = ""
    description: str = ""

    def to_card(self) -> dict:
        """Generate display card for consumer UI."""
        return {
            "farm": {
                "name": self.farm_name,
                "distance": f"{self.distance_miles:.1f} mi"
            },
            "product": {
                "name": self.cultivar_name or self.crop_name,
                "quality": self.quality_tier,
                "heritage": self.is_heritage
            },
            "timing": {
                "status": self.window_status,
                "message": self._timing_message()
            },
            "quality_prediction": {
                "brix": self.predicted_brix,
                "confidence": self.confidence_label
            },
            "headline": self.headline,
            "description": self.description
        }

    def _timing_message(self) -> str:
        """Generate timing message for display."""
        if self.window_status == "peak":
            return "At peak quality NOW"
        elif self.window_status == "in_window":
            if self.days_remaining and self.days_remaining <= 14:
                return f"In season - {self.days_remaining} days remaining"
            return "In season"
        elif self.window_status == "early":
            return "Early in season - still developing"
        elif self.window_status == "late":
            return "Late in season"
        elif self.window_status == "upcoming":
            if self.days_until_peak:
                return f"Coming in {self.days_until_peak} days"
            return "Coming soon"
        return ""


@dataclass
class DiscoveryResponse:
    """
    Response to a consumer discovery query.

    Contains ranked results plus context.
    """
    query: DiscoveryQuery
    results: list[DiscoveryResult] = field(default_factory=list)

    # Summary
    total_farms: int = 0
    total_products: int = 0
    crops_available: list[str] = field(default_factory=list)

    # Context
    response_date: date = field(default_factory=date.today)
    search_radius_miles: float = 50.0

    def summary_message(self) -> str:
        """Generate summary for consumer."""
        if not self.results:
            return f"No results found within {self.search_radius_miles} miles"

        crop_list = ", ".join(self.crops_available[:3])
        if len(self.crops_available) > 3:
            crop_list += f" and {len(self.crops_available) - 3} more"

        return (
            f"{self.total_products} products from {self.total_farms} farms nearby. "
            f"Currently available: {crop_list}"
        )


class DiscoveryService:
    """
    Main discovery service for consumer experience.

    Orchestrates:
    - Location-based farm search
    - Harvest window predictions
    - Quality predictions
    - Result ranking and presentation
    """

    def __init__(
        self,
        geo_search,       # GeoSearchService
        crop_engine,      # CropPossibilityEngine
        harvest_predictor,  # HarvestPredictor
        quality_predictor   # QualityPredictor
    ):
        self.geo_search = geo_search
        self.crop_engine = crop_engine
        self.harvest_predictor = harvest_predictor
        self.quality_predictor = quality_predictor

    def discover(self, query: DiscoveryQuery) -> DiscoveryResponse:
        """
        Execute consumer discovery query.

        This is the main entry point for "what's near me".
        """
        response = DiscoveryResponse(
            query=query,
            response_date=query.as_of_date,
            search_radius_miles=query.max_distance_miles
        )

        # 1. Find farms in radius
        nearby_farms = self._find_nearby_farms(query)
        if not nearby_farms:
            return response

        # 2. Get crops for each farm
        farm_crops = self._get_farm_crops(nearby_farms, query)

        # 3. Filter by timing intent
        filtered_crops = self._filter_by_timing(farm_crops, query)

        # 4. Build results with predictions
        results = self._build_results(filtered_crops, query)

        # 5. Rank results
        ranked_results = self._rank_results(results, query)

        # 6. Build response
        response.results = ranked_results
        response.total_farms = len(set(r.farm_id for r in ranked_results))
        response.total_products = len(ranked_results)
        response.crops_available = list(set(r.crop_name for r in ranked_results))

        return response

    def whats_at_peak(
        self,
        latitude: float,
        longitude: float,
        max_distance_miles: float = 50.0
    ) -> DiscoveryResponse:
        """
        Shortcut: What's at absolute peak quality near me right now?
        """
        query = DiscoveryQuery(
            latitude=latitude,
            longitude=longitude,
            max_distance_miles=max_distance_miles,
            intent=DiscoveryIntent.PEAK_QUALITY,
            min_quality_tier=QualityTier.PREMIUM
        )
        return self.discover(query)

    def whats_coming(
        self,
        latitude: float,
        longitude: float,
        days_ahead: int = 30,
        max_distance_miles: float = 50.0
    ) -> DiscoveryResponse:
        """
        Shortcut: What's coming soon near me?
        """
        query = DiscoveryQuery(
            latitude=latitude,
            longitude=longitude,
            max_distance_miles=max_distance_miles,
            intent=DiscoveryIntent.UPCOMING,
            look_ahead_days=days_ahead
        )
        return self.discover(query)

    def find_specific_crop(
        self,
        latitude: float,
        longitude: float,
        crop_type: str,
        max_distance_miles: float = 100.0
    ) -> DiscoveryResponse:
        """
        Shortcut: Where can I find specific crop near me?
        """
        query = DiscoveryQuery(
            latitude=latitude,
            longitude=longitude,
            max_distance_miles=max_distance_miles,
            intent=DiscoveryIntent.SPECIFIC_CROP,
            crop_types=[crop_type]
        )
        return self.discover(query)

    def _find_nearby_farms(self, query: DiscoveryQuery) -> list:
        """Find farms within search radius."""
        # Would use geo_search service
        # Placeholder - returns list of farm objects
        return []

    def _get_farm_crops(self, farms: list, query: DiscoveryQuery) -> list:
        """Get crops claimed by each farm."""
        # Would aggregate crops from each farm
        # Filter by crop_types if specified
        return []

    def _filter_by_timing(self, farm_crops: list, query: DiscoveryQuery) -> list:
        """Filter crops by timing intent."""
        # WHATS_READY_NOW: in current window
        # PEAK_QUALITY: in peak window
        # UPCOMING: window starts within look_ahead_days
        # SPECIFIC_CROP: any timing
        return farm_crops

    def _build_results(
        self,
        farm_crops: list,
        query: DiscoveryQuery
    ) -> list[DiscoveryResult]:
        """Build result objects with predictions."""
        results = []
        # Would iterate through farm_crops
        # Get predictions from harvest_predictor and quality_predictor
        # Build DiscoveryResult for each
        return results

    def _rank_results(
        self,
        results: list[DiscoveryResult],
        query: DiscoveryQuery
    ) -> list[DiscoveryResult]:
        """
        Rank results for presentation.

        Ranking factors:
        1. Timing match (peak > in_window > early/late)
        2. Quality tier (premium > standard)
        3. Distance (closer is better)
        4. Prediction confidence (higher is better)
        5. Heritage preference (if specified)
        """
        def rank_score(result: DiscoveryResult) -> float:
            score = 0.0

            # Timing (0-40 points)
            timing_scores = {
                "peak": 40,
                "in_window": 30,
                "early": 20,
                "late": 15,
                "upcoming": 10
            }
            score += timing_scores.get(result.window_status, 0)

            # Quality (0-30 points)
            quality_scores = {
                "premium": 30,
                "standard": 20,
                "commodity": 10
            }
            score += quality_scores.get(result.quality_tier, 0)

            # Distance (0-15 points, closer = more)
            if result.distance_miles <= 10:
                score += 15
            elif result.distance_miles <= 25:
                score += 12
            elif result.distance_miles <= 50:
                score += 8
            else:
                score += 5

            # Confidence (0-10 points)
            score += result.prediction_confidence * 10

            # Heritage preference bonus
            if query.prefer_heritage and result.is_heritage:
                score += 10

            return score

        return sorted(results, key=rank_score, reverse=True)


class SeasonalHighlights:
    """
    Generate seasonal highlights and recommendations.

    "What's special right now" across all regions.
    """

    def __init__(self, crop_engine, cultivar_database):
        self.crop_engine = crop_engine
        self.cultivar_db = cultivar_database

    def get_current_highlights(
        self,
        region_id: str,
        as_of_date: Optional[date] = None
    ) -> list[dict]:
        """
        Get current seasonal highlights for a region.

        Returns crops that are:
        - At peak quality NOW
        - Premium/heritage varieties
        - Notable for some reason
        """
        if as_of_date is None:
            as_of_date = date.today()

        highlights = []

        # Get crops currently in peak window
        # Would query crop_engine for peak window crops

        # Prioritize heritage varieties
        # Add context about why this is special

        return highlights

    def get_upcoming_highlights(
        self,
        region_id: str,
        days_ahead: int = 30,
        as_of_date: Optional[date] = None
    ) -> list[dict]:
        """Get upcoming seasonal highlights."""
        if as_of_date is None:
            as_of_date = date.today()

        highlights = []

        # Get crops with peak window starting in next N days
        # Add context about what makes them special

        return highlights

    def get_monthly_calendar(
        self,
        region_id: str,
        month: int,
        year: int
    ) -> dict:
        """
        Generate monthly availability calendar.

        Shows what's in season throughout the month.
        """
        calendar = {
            "month": month,
            "year": year,
            "region_id": region_id,
            "crops_in_season": [],
            "crops_at_peak": [],
            "crops_ending": [],
            "crops_starting": []
        }

        # Would analyze harvest windows for the month
        # Categorize by timing within month

        return calendar
