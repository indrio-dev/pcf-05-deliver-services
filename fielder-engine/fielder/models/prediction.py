"""
Prediction Models - Handling uncertainty in imperfect data.

Key insight: We are working with IMPERFECT data. We need to:
1. Express predictions as RANGES, not point estimates
2. Track CONFIDENCE levels
3. Distinguish between what we KNOW vs what we're ESTIMATING
4. Improve predictions over time with feedback

Sources of uncertainty:
- Weather variation (year to year)
- Microclimate differences within regions
- Missing cultivar research data
- Farm-specific practices (unknown to us)
- Climate change shifting historical patterns
"""

from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import Enum
from typing import Optional


class DataQuality(Enum):
    """Quality level of underlying data."""
    HIGH = "high"        # Research-backed, multiple sources
    MEDIUM = "medium"    # Single source or limited research
    LOW = "low"          # Estimated/inferred, sparse data
    UNKNOWN = "unknown"  # No data, using defaults


class ConfidenceLevel(Enum):
    """Confidence in prediction."""
    HIGH = "high"        # 80%+ confidence
    MEDIUM = "medium"    # 60-80% confidence
    LOW = "low"          # 40-60% confidence
    SPECULATIVE = "speculative"  # <40% confidence


@dataclass
class PredictionRange:
    """
    A prediction expressed as a range with confidence.

    Never give point estimates when data is uncertain.
    """
    # The range
    low: float
    mid: float  # Most likely value
    high: float

    # Confidence
    confidence: float  # 0-1
    confidence_level: ConfidenceLevel = ConfidenceLevel.MEDIUM

    # Data quality
    data_quality: DataQuality = DataQuality.MEDIUM

    # What this prediction is based on
    basis: str = ""  # e.g., "cultivar research", "regional average", "estimate"

    def __post_init__(self):
        # Set confidence level based on numeric confidence
        if self.confidence >= 0.8:
            self.confidence_level = ConfidenceLevel.HIGH
        elif self.confidence >= 0.6:
            self.confidence_level = ConfidenceLevel.MEDIUM
        elif self.confidence >= 0.4:
            self.confidence_level = ConfidenceLevel.LOW
        else:
            self.confidence_level = ConfidenceLevel.SPECULATIVE

    @property
    def range_width(self) -> float:
        """Width of the prediction range."""
        return self.high - self.low

    @property
    def uncertainty_pct(self) -> float:
        """Uncertainty as percentage of mid value."""
        if self.mid == 0:
            return 100.0
        return (self.range_width / self.mid) * 100

    def to_display(self) -> str:
        """Format for display to users."""
        if self.confidence_level == ConfidenceLevel.HIGH:
            return f"{self.mid:.1f} (±{(self.high - self.mid):.1f})"
        elif self.confidence_level in [ConfidenceLevel.MEDIUM, ConfidenceLevel.LOW]:
            return f"{self.low:.1f} - {self.high:.1f}"
        else:
            return f"~{self.mid:.1f} (estimate)"


@dataclass
class DateRange:
    """A date prediction expressed as a range."""
    earliest: date
    likely: date
    latest: date

    confidence: float
    data_quality: DataQuality = DataQuality.MEDIUM
    basis: str = ""

    @property
    def range_days(self) -> int:
        return (self.latest - self.earliest).days

    def to_display(self) -> str:
        if self.range_days <= 7:
            return f"~{self.likely.strftime('%b %d')}"
        elif self.range_days <= 21:
            return f"{self.earliest.strftime('%b %d')} - {self.latest.strftime('%b %d')}"
        else:
            return f"{self.earliest.strftime('%b')} to {self.latest.strftime('%b')}"


@dataclass
class HarvestPrediction:
    """
    Complete harvest window prediction with uncertainty.

    This is what we actually tell users - ranges with confidence,
    not false precision.
    """
    crop_id: str
    cultivar_id: Optional[str]
    region_id: str
    year: int

    # Window prediction (as ranges)
    window_start: DateRange
    window_end: DateRange
    peak_window: DateRange

    # Quality prediction (as range)
    predicted_brix: PredictionRange

    # Overall confidence
    overall_confidence: float

    # What we know vs what we're estimating
    known_factors: list[str] = field(default_factory=list)
    estimated_factors: list[str] = field(default_factory=list)
    unknown_factors: list[str] = field(default_factory=list)

    # Comparison to historical
    vs_historical: str = ""  # "early", "normal", "late"
    days_from_normal: int = 0

    def summary(self) -> str:
        """Generate human-readable summary."""
        conf_word = self.overall_confidence_word()

        if self.cultivar_id:
            crop_str = f"{self.cultivar_id}"
        else:
            crop_str = f"{self.crop_id}"

        peak_str = self.peak_window.to_display()
        brix_str = self.predicted_brix.to_display()

        return (
            f"{crop_str} in {self.region_id}: "
            f"Peak window {peak_str}, "
            f"expected Brix {brix_str} "
            f"({conf_word} confidence)"
        )

    def overall_confidence_word(self) -> str:
        if self.overall_confidence >= 0.8:
            return "high"
        elif self.overall_confidence >= 0.6:
            return "moderate"
        elif self.overall_confidence >= 0.4:
            return "limited"
        else:
            return "low"


@dataclass
class DataSource:
    """Track where data comes from for transparency."""
    source_type: str  # "research", "extension", "historical", "estimate"
    source_name: str
    year: Optional[int] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    quality: DataQuality = DataQuality.MEDIUM


@dataclass
class CultivarDataCompleteness:
    """
    Track what data we have vs what's missing for a cultivar.

    This helps identify research gaps and set appropriate confidence.
    """
    cultivar_id: str

    # What we have
    has_brix_research: bool = False
    has_maturity_data: bool = False
    has_regional_bloom_data: bool = False
    has_gdd_requirements: bool = False
    has_rootstock_data: bool = False

    # Sources
    brix_sources: list[DataSource] = field(default_factory=list)
    maturity_sources: list[DataSource] = field(default_factory=list)

    # Sample sizes (more = higher confidence)
    brix_study_count: int = 0
    years_of_harvest_data: int = 0
    regions_with_data: int = 0

    @property
    def completeness_score(self) -> float:
        """Calculate data completeness (0-1)."""
        factors = [
            self.has_brix_research,
            self.has_maturity_data,
            self.has_regional_bloom_data,
            self.has_gdd_requirements,
            self.has_rootstock_data,
        ]
        return sum(factors) / len(factors)

    @property
    def base_confidence(self) -> float:
        """Base confidence level from data completeness."""
        score = self.completeness_score

        # Boost for sample size
        if self.brix_study_count >= 5:
            score += 0.1
        if self.years_of_harvest_data >= 10:
            score += 0.1

        return min(0.95, score)

    def missing_data(self) -> list[str]:
        """List what data is missing."""
        missing = []
        if not self.has_brix_research:
            missing.append("Brix research")
        if not self.has_maturity_data:
            missing.append("Maturity timing")
        if not self.has_regional_bloom_data:
            missing.append("Regional bloom dates")
        if not self.has_gdd_requirements:
            missing.append("GDD requirements")
        if not self.has_rootstock_data:
            missing.append("Rootstock effects")
        return missing


class PredictionBuilder:
    """
    Build predictions with appropriate uncertainty.

    Enforces honest uncertainty quantification.
    """

    def __init__(self):
        pass

    def build_brix_prediction(
        self,
        cultivar_base: Optional[float],
        rootstock_modifier: float,
        age_modifier: float,
        timing_modifier: float,
        data_completeness: CultivarDataCompleteness
    ) -> PredictionRange:
        """
        Build Brix prediction with uncertainty range.
        """
        # If no cultivar research, use crop-level defaults with low confidence
        if cultivar_base is None:
            return PredictionRange(
                low=8.0,
                mid=10.0,
                high=12.0,
                confidence=0.3,
                data_quality=DataQuality.LOW,
                basis="crop average (no cultivar data)"
            )

        # Calculate point estimate
        point_estimate = cultivar_base + rootstock_modifier + age_modifier + timing_modifier

        # Set range based on data quality
        base_confidence = data_completeness.base_confidence

        if base_confidence >= 0.7:
            # Good data - narrow range
            low = point_estimate - 0.5
            high = point_estimate + 0.5
            data_quality = DataQuality.HIGH
        elif base_confidence >= 0.5:
            # Moderate data - medium range
            low = point_estimate - 1.0
            high = point_estimate + 1.0
            data_quality = DataQuality.MEDIUM
        else:
            # Poor data - wide range
            low = point_estimate - 1.5
            high = point_estimate + 1.5
            data_quality = DataQuality.LOW

        return PredictionRange(
            low=max(0, low),
            mid=point_estimate,
            high=high,
            confidence=base_confidence,
            data_quality=data_quality,
            basis="cultivar research + modifiers"
        )

    def build_date_prediction(
        self,
        base_date: date,
        uncertainty_days: int,
        confidence: float,
        data_quality: DataQuality
    ) -> DateRange:
        """Build date prediction with range."""
        return DateRange(
            earliest=base_date - timedelta(days=uncertainty_days),
            likely=base_date,
            latest=base_date + timedelta(days=uncertainty_days),
            confidence=confidence,
            data_quality=data_quality
        )

    def adjust_confidence_for_conditions(
        self,
        base_confidence: float,
        days_until_event: int,
        weather_forecast_available: bool,
        historical_variance: Optional[float] = None
    ) -> float:
        """
        Adjust confidence based on conditions.

        Confidence decreases for:
        - Events further in the future
        - High historical variance
        - No weather forecast available
        """
        confidence = base_confidence

        # Decay for future predictions
        if days_until_event > 60:
            confidence *= 0.7
        elif days_until_event > 30:
            confidence *= 0.85
        elif days_until_event > 14:
            confidence *= 0.95

        # Weather forecast boost
        if not weather_forecast_available and days_until_event <= 14:
            confidence *= 0.9

        # Historical variance penalty
        if historical_variance and historical_variance > 0.2:
            confidence *= 0.85

        return round(min(0.95, max(0.1, confidence)), 2)
