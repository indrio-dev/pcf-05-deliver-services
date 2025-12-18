"""
Feedback Loop - Learn from actual harvest data to improve predictions.

The system starts with research-based predictions (imperfect).
Over time, actual harvest observations from partner farms improve accuracy.

This is NOT IoT data collection. This is:
- Farms reporting when they actually harvested
- Optional Brix/quality measurements
- Comparing predictions vs reality
- Adjusting models for specific regions/cultivars

Improvement pathway:
1. Research-based baseline (50-60% accuracy)
2. Regional calibration from aggregated feedback (70-80%)
3. Farm-specific patterns for repeat partners (80-90%)
"""

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional
from enum import Enum
import statistics


class FeedbackType(Enum):
    """Type of feedback received."""
    HARVEST_DATE = "harvest_date"  # When they actually harvested
    BRIX_MEASUREMENT = "brix_measurement"  # Actual Brix reading
    QUALITY_RATING = "quality_rating"  # Subjective quality (1-5)
    MARKET_TIMING = "market_timing"  # When product hit market


@dataclass
class HarvestFeedback:
    """
    Feedback from an actual harvest event.

    This is what we learn from:
    - Farm reports when they actually harvested
    - Optional quality measurements
    - Market timing data
    """
    feedback_id: str
    farm_id: str
    crop_id: str
    cultivar_id: Optional[str]
    region_id: str
    year: int

    # What we predicted
    predicted_peak_start: date
    predicted_peak_end: date
    predicted_brix: Optional[float] = None
    prediction_confidence: float = 0.5

    # What actually happened
    actual_harvest_date: Optional[date] = None
    actual_brix: Optional[float] = None
    quality_rating: Optional[int] = None  # 1-5

    # Context
    notes: Optional[str] = None
    reported_by: Optional[str] = None
    reported_date: Optional[date] = None

    @property
    def harvest_date_error(self) -> Optional[int]:
        """Days between predicted peak and actual harvest."""
        if not self.actual_harvest_date:
            return None
        predicted_mid = self.predicted_peak_start + (
            self.predicted_peak_end - self.predicted_peak_start
        ) // 2
        return (self.actual_harvest_date - predicted_mid).days

    @property
    def brix_error(self) -> Optional[float]:
        """Difference between predicted and actual Brix."""
        if self.predicted_brix is None or self.actual_brix is None:
            return None
        return self.actual_brix - self.predicted_brix

    @property
    def was_early(self) -> Optional[bool]:
        """Did harvest come before predicted window?"""
        if not self.actual_harvest_date:
            return None
        return self.actual_harvest_date < self.predicted_peak_start

    @property
    def was_late(self) -> Optional[bool]:
        """Did harvest come after predicted window?"""
        if not self.actual_harvest_date:
            return None
        return self.actual_harvest_date > self.predicted_peak_end


@dataclass
class RegionalCalibration:
    """
    Calibration adjustments for a specific region.

    Built from aggregated feedback data.
    """
    region_id: str
    cultivar_id: str

    # Date adjustments
    avg_date_error_days: float = 0.0  # Positive = predictions run early
    date_error_std: float = 7.0
    sample_size_dates: int = 0

    # Brix adjustments
    avg_brix_error: float = 0.0  # Positive = predictions run low
    brix_error_std: float = 0.5
    sample_size_brix: int = 0

    # When calibration was last updated
    last_updated: Optional[date] = None
    years_of_data: int = 0

    @property
    def date_adjustment(self) -> int:
        """
        Days to adjust predictions.

        If avg_date_error is +5, predictions are 5 days early,
        so we ADD 5 days to future predictions.
        """
        if self.sample_size_dates < 3:
            return 0  # Not enough data
        return round(self.avg_date_error_days)

    @property
    def brix_adjustment(self) -> float:
        """Brix points to adjust predictions."""
        if self.sample_size_brix < 3:
            return 0.0
        return round(self.avg_brix_error, 1)

    @property
    def confidence_boost(self) -> float:
        """
        How much to boost confidence based on calibration data.

        More observations = higher confidence in predictions.
        """
        if self.sample_size_dates >= 20:
            return 0.2
        elif self.sample_size_dates >= 10:
            return 0.15
        elif self.sample_size_dates >= 5:
            return 0.1
        elif self.sample_size_dates >= 3:
            return 0.05
        return 0.0


class FeedbackCollector:
    """
    Collect and store harvest feedback.

    In production, this would persist to database.
    """

    def __init__(self):
        self.feedback: list[HarvestFeedback] = []
        self.calibrations: dict[str, RegionalCalibration] = {}

    def add_feedback(self, feedback: HarvestFeedback) -> None:
        """Add new feedback and update calibrations."""
        self.feedback.append(feedback)
        self._update_calibration(feedback)

    def get_feedback_for_region(
        self,
        region_id: str,
        cultivar_id: Optional[str] = None,
        years: Optional[int] = None
    ) -> list[HarvestFeedback]:
        """Get all feedback for a region."""
        result = [f for f in self.feedback if f.region_id == region_id]

        if cultivar_id:
            result = [f for f in result if f.cultivar_id == cultivar_id]

        if years:
            cutoff_year = date.today().year - years
            result = [f for f in result if f.year >= cutoff_year]

        return result

    def get_calibration(
        self,
        region_id: str,
        cultivar_id: str
    ) -> Optional[RegionalCalibration]:
        """Get calibration for a region/cultivar combo."""
        key = f"{region_id}:{cultivar_id}"
        return self.calibrations.get(key)

    def _update_calibration(self, new_feedback: HarvestFeedback) -> None:
        """Update regional calibration with new feedback."""
        if not new_feedback.cultivar_id:
            return

        key = f"{new_feedback.region_id}:{new_feedback.cultivar_id}"

        # Get all feedback for this region/cultivar
        relevant = self.get_feedback_for_region(
            new_feedback.region_id,
            new_feedback.cultivar_id,
            years=5  # Use last 5 years
        )

        # Calculate date error statistics
        date_errors = [f.harvest_date_error for f in relevant if f.harvest_date_error is not None]
        brix_errors = [f.brix_error for f in relevant if f.brix_error is not None]

        calibration = RegionalCalibration(
            region_id=new_feedback.region_id,
            cultivar_id=new_feedback.cultivar_id
        )

        if len(date_errors) >= 2:
            calibration.avg_date_error_days = statistics.mean(date_errors)
            calibration.date_error_std = statistics.stdev(date_errors) if len(date_errors) > 1 else 7.0
            calibration.sample_size_dates = len(date_errors)

        if len(brix_errors) >= 2:
            calibration.avg_brix_error = statistics.mean(brix_errors)
            calibration.brix_error_std = statistics.stdev(brix_errors) if len(brix_errors) > 1 else 0.5
            calibration.sample_size_brix = len(brix_errors)

        years = set(f.year for f in relevant)
        calibration.years_of_data = len(years)
        calibration.last_updated = date.today()

        self.calibrations[key] = calibration


class PredictionCalibrator:
    """
    Apply calibration adjustments to predictions.

    Takes raw predictions from models and adjusts based on
    accumulated feedback data.
    """

    def __init__(self, collector: FeedbackCollector):
        self.collector = collector

    def calibrate_date_prediction(
        self,
        region_id: str,
        cultivar_id: str,
        predicted_date: date,
        base_confidence: float
    ) -> tuple[date, float]:
        """
        Adjust a date prediction based on regional calibration.

        Returns: (adjusted_date, adjusted_confidence)
        """
        calibration = self.collector.get_calibration(region_id, cultivar_id)

        if not calibration:
            return predicted_date, base_confidence

        # Apply date adjustment
        adjusted_date = predicted_date + timedelta(days=calibration.date_adjustment)

        # Boost confidence based on calibration data
        adjusted_confidence = min(0.95, base_confidence + calibration.confidence_boost)

        return adjusted_date, adjusted_confidence

    def calibrate_brix_prediction(
        self,
        region_id: str,
        cultivar_id: str,
        predicted_brix: float,
        base_confidence: float
    ) -> tuple[float, float]:
        """
        Adjust a Brix prediction based on regional calibration.

        Returns: (adjusted_brix, adjusted_confidence)
        """
        calibration = self.collector.get_calibration(region_id, cultivar_id)

        if not calibration:
            return predicted_brix, base_confidence

        # Apply Brix adjustment
        adjusted_brix = predicted_brix + calibration.brix_adjustment

        # Boost confidence based on calibration data
        adjusted_confidence = min(0.95, base_confidence + calibration.confidence_boost)

        return adjusted_brix, adjusted_confidence

    def get_prediction_uncertainty(
        self,
        region_id: str,
        cultivar_id: str,
        base_uncertainty_days: int
    ) -> int:
        """
        Adjust prediction uncertainty based on calibration.

        More data = narrower uncertainty range.
        """
        calibration = self.collector.get_calibration(region_id, cultivar_id)

        if not calibration or calibration.sample_size_dates < 5:
            return base_uncertainty_days

        # Use observed standard deviation if we have enough data
        if calibration.sample_size_dates >= 10:
            # 2 standard deviations covers ~95% of cases
            return int(calibration.date_error_std * 2)
        elif calibration.sample_size_dates >= 5:
            # Blend observed and base uncertainty
            return int((base_uncertainty_days + calibration.date_error_std * 2) / 2)

        return base_uncertainty_days


@dataclass
class PredictionAccuracyReport:
    """
    Report on prediction accuracy for a region/time period.

    Useful for monitoring system performance and identifying
    regions/cultivars that need more research data.
    """
    region_id: str
    cultivar_id: Optional[str]
    report_period_start: date
    report_period_end: date

    # Date prediction accuracy
    total_date_predictions: int = 0
    within_7_days: int = 0
    within_14_days: int = 0
    mean_absolute_error_days: float = 0.0

    # Brix prediction accuracy
    total_brix_predictions: int = 0
    within_0_5_brix: int = 0
    within_1_0_brix: int = 0
    mean_absolute_error_brix: float = 0.0

    @property
    def date_accuracy_7d(self) -> float:
        """Percentage of predictions within 7 days."""
        if self.total_date_predictions == 0:
            return 0.0
        return (self.within_7_days / self.total_date_predictions) * 100

    @property
    def date_accuracy_14d(self) -> float:
        """Percentage of predictions within 14 days."""
        if self.total_date_predictions == 0:
            return 0.0
        return (self.within_14_days / self.total_date_predictions) * 100

    @property
    def brix_accuracy_0_5(self) -> float:
        """Percentage of predictions within 0.5 Brix."""
        if self.total_brix_predictions == 0:
            return 0.0
        return (self.within_0_5_brix / self.total_brix_predictions) * 100

    def summary(self) -> str:
        """Generate human-readable summary."""
        lines = [
            f"Prediction Accuracy Report: {self.region_id}",
            f"Period: {self.report_period_start} to {self.report_period_end}",
            "",
            f"Date Predictions: {self.total_date_predictions}",
            f"  Within 7 days:  {self.date_accuracy_7d:.1f}%",
            f"  Within 14 days: {self.date_accuracy_14d:.1f}%",
            f"  Mean error:     {self.mean_absolute_error_days:.1f} days",
        ]

        if self.total_brix_predictions > 0:
            lines.extend([
                "",
                f"Brix Predictions: {self.total_brix_predictions}",
                f"  Within 0.5:  {self.brix_accuracy_0_5:.1f}%",
                f"  Mean error:  {self.mean_absolute_error_brix:.1f} Brix",
            ])

        return "\n".join(lines)


class AccuracyAnalyzer:
    """
    Analyze prediction accuracy from collected feedback.

    Identifies:
    - Which regions/cultivars have good predictions
    - Where we need more research data
    - Systematic biases in predictions
    """

    def __init__(self, collector: FeedbackCollector):
        self.collector = collector

    def generate_report(
        self,
        region_id: str,
        cultivar_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> PredictionAccuracyReport:
        """Generate accuracy report for a region."""
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=365)

        feedback = self.collector.get_feedback_for_region(region_id, cultivar_id)
        feedback = [
            f for f in feedback
            if f.reported_date and start_date <= f.reported_date <= end_date
        ]

        report = PredictionAccuracyReport(
            region_id=region_id,
            cultivar_id=cultivar_id,
            report_period_start=start_date,
            report_period_end=end_date
        )

        # Date accuracy
        date_errors = [
            abs(f.harvest_date_error)
            for f in feedback
            if f.harvest_date_error is not None
        ]
        if date_errors:
            report.total_date_predictions = len(date_errors)
            report.within_7_days = sum(1 for e in date_errors if e <= 7)
            report.within_14_days = sum(1 for e in date_errors if e <= 14)
            report.mean_absolute_error_days = statistics.mean(date_errors)

        # Brix accuracy
        brix_errors = [
            abs(f.brix_error)
            for f in feedback
            if f.brix_error is not None
        ]
        if brix_errors:
            report.total_brix_predictions = len(brix_errors)
            report.within_0_5_brix = sum(1 for e in brix_errors if e <= 0.5)
            report.within_1_0_brix = sum(1 for e in brix_errors if e <= 1.0)
            report.mean_absolute_error_brix = statistics.mean(brix_errors)

        return report

    def identify_data_gaps(self) -> list[dict]:
        """
        Identify regions/cultivars with insufficient calibration data.

        Returns list of gaps that need more feedback or research.
        """
        gaps = []

        # Group feedback by region/cultivar
        combos: dict[str, list[HarvestFeedback]] = {}
        for f in self.collector.feedback:
            if f.cultivar_id:
                key = f"{f.region_id}:{f.cultivar_id}"
                if key not in combos:
                    combos[key] = []
                combos[key].append(f)

        for key, feedback_list in combos.items():
            region_id, cultivar_id = key.split(":")

            if len(feedback_list) < 5:
                gaps.append({
                    "region_id": region_id,
                    "cultivar_id": cultivar_id,
                    "feedback_count": len(feedback_list),
                    "gap_type": "insufficient_feedback",
                    "recommendation": "Need 5+ harvest reports for reliable calibration"
                })
            elif len(set(f.year for f in feedback_list)) < 3:
                gaps.append({
                    "region_id": region_id,
                    "cultivar_id": cultivar_id,
                    "years_of_data": len(set(f.year for f in feedback_list)),
                    "gap_type": "limited_years",
                    "recommendation": "Need 3+ years for weather variation understanding"
                })

        return gaps
