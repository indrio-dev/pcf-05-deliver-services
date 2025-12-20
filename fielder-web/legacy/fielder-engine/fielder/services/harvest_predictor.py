"""
Harvest Window Prediction Service.

Predicts when crops will hit peak quality based on GDD accumulation,
cultivar characteristics, and current weather patterns.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

from ..models.crop import Cultivar, Rootstock, CITRUS_ROOTSTOCKS
from ..models.weather import GDDAccumulation, DailyWeather, CITRUS_GDD_TARGETS
from ..models.harvest import HarvestWindow


@dataclass
class BrixPrediction:
    """Predicted Brix at a given point in time."""
    predicted_brix: float
    cultivar_base: float
    rootstock_modifier: float
    age_modifier: float
    timing_modifier: float
    confidence: float = 0.8


class HarvestPredictor:
    """
    Predicts harvest windows and quality for crops.

    Uses GDD accumulation to predict:
    1. When harvest window opens
    2. When peak quality window occurs
    3. Expected Brix at peak

    Based on your research:
    - Citrus base temp: 55F
    - Sugar follows logistic curve
    - Acid follows exponential decay
    - Peak = SSC ~12, TA ~1.0, ratio ~12:1
    """

    def __init__(self):
        self.gdd_targets = CITRUS_GDD_TARGETS
        self.rootstocks = CITRUS_ROOTSTOCKS

    def calculate_age_modifier(self, tree_age_years: Optional[int]) -> float:
        """
        Calculate Brix modifier based on tree age.

        Trees shift from vegetative to reproductive energy allocation:
        - 0-2 yrs: -0.8 (vegetative phase)
        - 3-4 yrs: -0.5 (transition)
        - 5-7 yrs: -0.2 (canopy completion)
        - 8-18 yrs: 0.0 (prime - genetic potential realized)
        - 19-25 yrs: -0.2
        - >25 yrs: -0.3
        """
        if tree_age_years is None:
            return 0.0  # Assume prime if unknown

        age = tree_age_years
        if age <= 2:
            return -0.8
        elif age <= 4:
            return -0.5
        elif age <= 7:
            return -0.2
        elif age <= 18:
            return 0.0  # Prime
        elif age <= 25:
            return -0.2
        else:
            return -0.3

    def calculate_timing_modifier(
        self,
        current_gdd: float,
        peak_gdd: float,
        gdd_halfwidth: float = 150.0,
        max_penalty: float = 1.0
    ) -> float:
        """
        Calculate Brix modifier based on timing relative to peak.

        Uses parabolic penalty: Timing_Mod = -G * (d / H)^2

        Args:
            current_gdd: Current cumulative GDD
            peak_gdd: GDD at peak quality
            gdd_halfwidth: Half-width of peak window in GDD units
            max_penalty: Maximum penalty at edge of window

        Returns:
            Timing modifier (0 at peak, negative away from peak)
        """
        d = abs(current_gdd - peak_gdd)
        h = gdd_halfwidth

        if d <= h / 2:
            return 0.0  # In inner quartile, no penalty

        penalty = max_penalty * (d / h) ** 2
        return -min(penalty, max_penalty * 1.5)  # Cap at 1.5x max

    def predict_brix(
        self,
        cultivar_base_brix: float,
        rootstock_id: Optional[str],
        tree_age_years: Optional[int],
        current_gdd: float,
        peak_gdd: float
    ) -> BrixPrediction:
        """
        Predict Brix for a crop at current GDD.

        Algorithm:
        Peak Brix = Cultivar Base + Rootstock Modifier + Age Modifier + Timing Modifier
        """
        # Rootstock modifier
        rootstock_mod = 0.0
        if rootstock_id and rootstock_id in self.rootstocks:
            rootstock_mod = self.rootstocks[rootstock_id].brix_modifier

        # Age modifier
        age_mod = self.calculate_age_modifier(tree_age_years)

        # Timing modifier
        timing_mod = self.calculate_timing_modifier(current_gdd, peak_gdd)

        # Total predicted Brix
        predicted = cultivar_base_brix + rootstock_mod + age_mod + timing_mod

        return BrixPrediction(
            predicted_brix=round(predicted, 2),
            cultivar_base=cultivar_base_brix,
            rootstock_modifier=rootstock_mod,
            age_modifier=age_mod,
            timing_modifier=round(timing_mod, 2),
            confidence=0.8 if tree_age_years else 0.6
        )

    def predict_harvest_window(
        self,
        crop_id: str,
        region_id: str,
        bloom_date: date,
        gdd_accumulation: GDDAccumulation,
        avg_daily_gdd: float
    ) -> HarvestWindow:
        """
        Predict harvest window for a crop based on GDD accumulation.

        Args:
            crop_id: The crop being predicted
            region_id: The growing region
            bloom_date: Date of bloom (reference point)
            gdd_accumulation: Current GDD tracking
            avg_daily_gdd: Average GDD per day for projection

        Returns:
            Predicted HarvestWindow
        """
        targets = self.gdd_targets.get(crop_id, {})
        gdd_to_maturity = targets.get("gdd_to_legal_maturity", 2000)
        gdd_to_peak = targets.get("gdd_to_peak", 2300)

        current_gdd = gdd_accumulation.cumulative_gdd

        # Calculate days to maturity
        days_to_maturity = max(0, int((gdd_to_maturity - current_gdd) / avg_daily_gdd))
        days_to_peak = max(0, int((gdd_to_peak - current_gdd) / avg_daily_gdd))

        today = date.today()
        window_start = today + timedelta(days=days_to_maturity)
        peak_center = today + timedelta(days=days_to_peak)

        # Peak window is +/- 15 days around peak center
        peak_start = peak_center - timedelta(days=15)
        peak_end = peak_center + timedelta(days=15)

        # Window ends ~30 days after peak (quality declines)
        window_end = peak_end + timedelta(days=30)

        return HarvestWindow(
            crop_id=crop_id,
            cultivar_id=None,
            region_id=region_id,
            year=today.year,
            window_start=window_start,
            window_end=window_end,
            peak_start=peak_start,
            peak_end=peak_end,
            gdd_at_window_start=gdd_to_maturity,
            gdd_at_peak=gdd_to_peak
        )

    def estimate_sugar_acid(
        self,
        current_gdd: float,
        ssc_min: float = 6.0,
        ssc_max: float = 12.0,
        dd50: float = 2050.0,
        s: float = 350.0,
        ta0: float = 3.0,
        ka: float = 0.0005
    ) -> dict:
        """
        Estimate sugar (SSC) and acid (TA) at current GDD.

        Based on your research:
        - SSC follows logistic curve: SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(DD - DD50)/s))
        - TA follows exponential decay: TA = TA0 * exp(-ka * DD)

        Returns dict with SSC, TA, ratio, and BrimA
        """
        import math

        # Sugar (logistic rise)
        ssc = ssc_min + (ssc_max - ssc_min) / (1 + math.exp(-(current_gdd - dd50) / s))

        # Acid (exponential decay)
        ta = ta0 * math.exp(-ka * current_gdd)

        # Quality indices
        ratio = ssc / ta if ta > 0 else 0
        brima = ssc - 4 * ta  # Flavor index

        return {
            "ssc": round(ssc, 2),
            "ta": round(ta, 2),
            "ratio": round(ratio, 1),
            "brima": round(brima, 2),
            "gdd": int(current_gdd)
        }
