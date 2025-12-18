"""
Quality Prediction Service - The analytical heart of Fielder.

Predicts internal quality (Brix, nutrition, flavor) for different crop types.
Each crop type has a different maturity model and post-harvest behavior.

Key insight: Climacteric vs Non-Climacteric crops behave very differently.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Optional

from ..models.quality import (
    CropMaturityType,
    PostHarvestBehavior,
    SHAREQualityPrediction,
    HeritageCultivar,
    SoilHealth,
    AgriculturalPractices,
    RipenTiming,
)
from ..models.weather import GDDAccumulation


@dataclass
class QualityPredictionResult:
    """Result from a quality prediction."""
    predicted_brix: float
    predicted_quality_score: float  # 0-100
    confidence: float  # 0-1

    # Breakdown by SHARE factor
    genetic_ceiling: float  # From H (Heritage)
    soil_contribution: float  # From S (Soil)
    practice_contribution: float  # From A (Agricultural)
    timing_contribution: float  # From R (Ripen)

    # Recommendations
    optimal_harvest_date: Optional[date] = None
    days_to_peak: Optional[int] = None
    freshness_window_days: Optional[int] = None


class CropQualityModel(ABC):
    """
    Abstract base class for crop-specific quality models.

    Different crops have different:
    - Sugar accumulation patterns
    - Acid development/decline
    - Post-harvest behavior (climacteric vs non-climacteric)
    - Optimal harvest indicators
    """

    def __init__(self, crop_type: CropMaturityType):
        self.crop_type = crop_type

    @property
    @abstractmethod
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        """Whether this crop can ripen after harvest."""
        pass

    @property
    @abstractmethod
    def gdd_base_temp(self) -> float:
        """Base temperature for GDD calculation (Fahrenheit)."""
        pass

    @abstractmethod
    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """Predict sugar content (Brix) based on GDD."""
        pass

    @abstractmethod
    def predict_acid_content(
        self,
        gdd_accumulated: float
    ) -> float:
        """Predict acid content based on GDD."""
        pass

    @abstractmethod
    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """Calculate quality loss after harvest (0-1 multiplier)."""
        pass

    def predict_quality(
        self,
        share_data: SHAREQualityPrediction,
        gdd: Optional[GDDAccumulation] = None
    ) -> QualityPredictionResult:
        """
        Predict quality using the SHARE framework + crop-specific model.
        """
        # Get base prediction from SHARE
        share_result = share_data.predict_quality()

        # Apply crop-specific adjustments
        if gdd and share_data.heritage:
            predicted_brix = self.predict_sugar_content(
                gdd.cumulative_gdd,
                share_data.heritage.max_brix_potential or 12.0
            )
        else:
            predicted_brix = share_result["predicted_brix"]

        # Calculate freshness decay
        if share_data.ripen:
            freshness = self.calculate_freshness_decay(
                share_data.ripen.transit_days,
                share_data.ripen.cold_chain_maintained
            )
            predicted_brix *= freshness

        return QualityPredictionResult(
            predicted_brix=round(predicted_brix, 1),
            predicted_quality_score=share_result["quality_score"],
            confidence=share_result["confidence"],
            genetic_ceiling=share_result["factors"]["base_brix"],
            soil_contribution=share_result["factors"]["soil_modifier"],
            practice_contribution=share_result["factors"]["practice_modifier"],
            timing_contribution=share_result["factors"]["timing_modifier"],
            freshness_window_days=self._get_freshness_window()
        )

    @abstractmethod
    def _get_freshness_window(self) -> int:
        """Days of optimal freshness after harvest."""
        pass


class CitrusQualityModel(CropQualityModel):
    """
    Quality model for citrus (non-climacteric tree fruit).

    Key characteristics:
    - Must ripen on tree - no post-harvest ripening
    - Sugar follows logistic curve with GDD
    - Acid decays exponentially
    - Peak quality = Brix ~12+, TA ~1.0, ratio 10-13:1
    - Long on-tree holding (can improve with time)
    """

    def __init__(self):
        super().__init__(CropMaturityType.TREE_FRUIT_NON_CLIMACTERIC)

        # Model parameters - CALIBRATED for Florida weather (~22 GDD/day base 55F)
        # Navels: bloom March → mature Nov (5100 GDD) → peak Dec (6100 GDD)
        # Florida citrus at peak: Brix 10-12, Acid 0.5-0.8%, Ratio 12-18:1
        self.ssc_min = 6.0   # Minimum Brix (early season, ~Aug)
        self.dd50 = 5500     # GDD at 50% sugar development (~mid-Nov)
        self.s = 900         # Steepness of sugar curve (scaled from 350)
        self.ta0 = 3.0       # Initial acid % (at bloom)
        self.ka = 0.00025    # Acid decay rate - gives ~0.65% TA at peak (FL citrus)

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.NON_CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 55.0  # Citrus base temp

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        Citrus sugar follows logistic curve.

        SSC = SSC_min + (SSC_max - SSC_min) / (1 + exp(-(GDD - DD50)/s))
        """
        import math

        ssc = self.ssc_min + (cultivar_ceiling - self.ssc_min) / (
            1 + math.exp(-(gdd_accumulated - self.dd50) / self.s)
        )
        return ssc

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """
        Citrus acid follows exponential decay.

        TA = TA0 * exp(-ka * GDD)
        """
        import math
        return self.ta0 * math.exp(-self.ka * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Citrus holds well in cold storage.

        Returns multiplier (1.0 = no decay, 0.0 = complete loss)
        """
        if cold_chain:
            # Citrus can last 4-8 weeks in cold storage
            if days_since_harvest <= 7:
                return 1.0
            elif days_since_harvest <= 14:
                return 0.98
            elif days_since_harvest <= 30:
                return 0.95
            else:
                return max(0.8, 1.0 - (days_since_harvest - 30) * 0.01)
        else:
            # Without cold chain, decay faster
            if days_since_harvest <= 3:
                return 1.0
            elif days_since_harvest <= 7:
                return 0.95
            else:
                return max(0.7, 1.0 - (days_since_harvest - 7) * 0.03)

    def _get_freshness_window(self) -> int:
        return 30  # Citrus holds well


class BerryQualityModel(CropQualityModel):
    """
    Quality model for berries (non-climacteric, highly perishable).

    Key characteristics:
    - Must ripen on plant
    - Very short freshness window
    - Sugar fixed at harvest
    - Quality degrades rapidly without cold chain
    """

    def __init__(self):
        super().__init__(CropMaturityType.BERRY_NON_CLIMACTERIC)

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.NON_CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 50.0

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """Berries accumulate sugar more linearly then plateau."""
        # Simplified model - berries reach potential faster
        gdd_to_peak = 1500
        if gdd_accumulated >= gdd_to_peak:
            return cultivar_ceiling
        else:
            return cultivar_ceiling * (gdd_accumulated / gdd_to_peak)

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Berry acid content."""
        import math
        return 1.5 * math.exp(-0.0008 * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """Berries are HIGHLY perishable."""
        if cold_chain:
            if days_since_harvest <= 1:
                return 1.0
            elif days_since_harvest <= 3:
                return 0.95
            elif days_since_harvest <= 5:
                return 0.85
            else:
                return max(0.5, 1.0 - (days_since_harvest - 5) * 0.1)
        else:
            if days_since_harvest <= 1:
                return 0.95
            elif days_since_harvest <= 2:
                return 0.8
            else:
                return max(0.3, 1.0 - days_since_harvest * 0.2)

    def _get_freshness_window(self) -> int:
        return 5  # Berries are highly perishable


class TomatoQualityModel(CropQualityModel):
    """
    Quality model for tomatoes (climacteric vine fruit).

    Key characteristics:
    - CAN ripen after harvest (climacteric)
    - BUT vine-ripened is ALWAYS superior
    - Harvesting green sacrifices flavor potential permanently
    - Color break ≠ peak flavor
    """

    def __init__(self):
        super().__init__(CropMaturityType.VINE_CLIMACTERIC)

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 50.0

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """Tomato sugar development."""
        import math
        dd50 = 1200
        s = 200
        ssc_min = 3.5
        return ssc_min + (cultivar_ceiling - ssc_min) / (
            1 + math.exp(-(gdd_accumulated - dd50) / s)
        )

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Tomato acid content."""
        import math
        return 0.8 * math.exp(-0.0006 * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Tomatoes - tricky because refrigeration damages flavor.

        Counter-ripening: quality can improve post-harvest if picked mature.
        """
        # Tomatoes should NOT be refrigerated (chilling injury)
        if days_since_harvest <= 2:
            return 1.0
        elif days_since_harvest <= 5:
            return 0.95
        elif days_since_harvest <= 7:
            return 0.9
        else:
            return max(0.6, 1.0 - (days_since_harvest - 7) * 0.05)

    def _get_freshness_window(self) -> int:
        return 7


# =============================================================================
# ADDITIONAL CROP-SPECIFIC QUALITY MODELS
# =============================================================================


class PeachQualityModel(CropQualityModel):
    """
    Quality model for peaches (climacteric stone fruit).

    Key characteristics:
    - Climacteric: CAN ripen after harvest
    - But tree-ripened is ALWAYS better
    - Short harvest window per cultivar (7-14 days)
    - Firmness vs flavor tradeoff for shipping
    - Ethylene accelerates ripening
    """

    def __init__(self):
        super().__init__(CropMaturityType.TREE_FRUIT_CLIMACTERIC)

        # Model parameters
        self.ssc_min = 8.0  # Minimum Brix at maturity
        self.dd50 = 1900  # GDD at 50% sugar development
        self.s = 200  # Steepness of sugar curve
        self.ta0 = 1.0  # Initial acid %
        self.ka = 0.0008  # Acid decay rate

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 45.0  # Stone fruit base temp

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        Peach sugar follows sigmoid curve, continuing to rise at harvest.

        Can improve 1-2 Brix post-harvest if picked "firm-ripe".
        """
        import math
        ssc = self.ssc_min + (cultivar_ceiling - self.ssc_min) / (
            1 + math.exp(-(gdd_accumulated - self.dd50) / self.s)
        )
        return ssc

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Peach acid follows exponential decay."""
        import math
        return self.ta0 * math.exp(-self.ka * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Peaches are moderately perishable.

        Can improve in quality 3-5 days post-harvest (counter-ripening).
        """
        if cold_chain:
            # Cold storage (32-34F) extends life
            if days_since_harvest <= 5:
                return 1.0  # May even improve
            elif days_since_harvest <= 10:
                return 0.95
            elif days_since_harvest <= 14:
                return 0.85
            else:
                return max(0.5, 1.0 - (days_since_harvest - 14) * 0.05)
        else:
            # Room temp - ripen fast, then decline
            if days_since_harvest <= 3:
                return 1.0
            elif days_since_harvest <= 5:
                return 0.9
            else:
                return max(0.4, 1.0 - (days_since_harvest - 5) * 0.1)

    def _get_freshness_window(self) -> int:
        return 10  # With cold chain


class CherryQualityModel(CropQualityModel):
    """
    Quality model for cherries (non-climacteric stone fruit).

    Key characteristics:
    - NON-climacteric: Must ripen on tree
    - Very short harvest window (7-10 days)
    - High Brix potential (16-22 for sweet cherries)
    - Cold chain critical - highly perishable
    - Stem condition indicates freshness
    """

    def __init__(self):
        super().__init__(CropMaturityType.TREE_FRUIT_NON_CLIMACTERIC)

        # Cherries develop sugar rapidly in final weeks
        # Start around 12 Brix, peak at 18-22 for sweet cherries
        self.ssc_min = 10.0  # Early season Brix
        self.dd50 = 1400  # GDD at 50% sugar development
        self.s = 80  # Steep curve - rapid sugar gain in final 2 weeks

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.NON_CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 40.0  # Cherry base temp

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        Cherry sugar development - must pick at peak.

        No improvement possible post-harvest.
        """
        import math
        ssc = self.ssc_min + (cultivar_ceiling - self.ssc_min) / (
            1 + math.exp(-(gdd_accumulated - self.dd50) / self.s)
        )
        return ssc

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Cherry acid is lower than citrus, balanced flavor."""
        import math
        return 0.8 * math.exp(-0.0006 * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Cherries are HIGHLY perishable.

        Cold chain (30-32F) critical for quality retention.
        """
        if cold_chain:
            # High humidity cold storage
            if days_since_harvest <= 3:
                return 1.0
            elif days_since_harvest <= 7:
                return 0.95
            elif days_since_harvest <= 14:
                return 0.85
            else:
                return max(0.5, 1.0 - (days_since_harvest - 14) * 0.05)
        else:
            # Room temp - rapid decline
            if days_since_harvest <= 1:
                return 1.0
            elif days_since_harvest <= 3:
                return 0.85
            else:
                return max(0.3, 1.0 - (days_since_harvest - 3) * 0.15)

    def _get_freshness_window(self) -> int:
        return 7  # With cold chain


class AppleQualityModel(CropQualityModel):
    """
    Quality model for apples (climacteric pome fruit).

    Key characteristics:
    - Climacteric: Continues ripening after harvest
    - Exceptional storage life (6-12 months in CA storage)
    - Starch converts to sugar post-harvest
    - Many cultivars improve with storage
    - Texture changes significantly post-harvest
    """

    def __init__(self):
        super().__init__(CropMaturityType.TREE_FRUIT_CLIMACTERIC)

        self.ssc_min = 10.0
        self.dd50 = 2300
        self.s = 300
        self.ta0 = 0.8
        self.ka = 0.0003  # Slow acid decline

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 43.0  # Apple base temp

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        Apple sugar continues to develop in storage.

        Starch index at harvest predicts storage quality.
        """
        import math
        ssc = self.ssc_min + (cultivar_ceiling - self.ssc_min) / (
            1 + math.exp(-(gdd_accumulated - self.dd50) / self.s)
        )
        return ssc

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Apple acid - cultivar dependent, some hold acid well."""
        import math
        return self.ta0 * math.exp(-self.ka * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Apples store exceptionally well.

        Controlled atmosphere (CA) extends life to 6-12 months.
        Regular cold storage: 2-4 months.
        """
        if cold_chain:
            # Cold storage
            if days_since_harvest <= 30:
                return 1.0
            elif days_since_harvest <= 60:
                return 0.98
            elif days_since_harvest <= 90:
                return 0.95
            elif days_since_harvest <= 180:
                return 0.90
            else:
                return max(0.7, 1.0 - (days_since_harvest - 180) * 0.002)
        else:
            # Room temp
            if days_since_harvest <= 7:
                return 1.0
            elif days_since_harvest <= 14:
                return 0.95
            elif days_since_harvest <= 30:
                return 0.85
            else:
                return max(0.5, 1.0 - (days_since_harvest - 30) * 0.02)

    def _get_freshness_window(self) -> int:
        return 60  # With cold storage, much longer possible


class PearQualityModel(CropQualityModel):
    """
    Quality model for pears (climacteric pome fruit - UNIQUE behavior).

    Key characteristics:
    - MUST ripen OFF the tree (unique among tree fruits)
    - Harvested when mature but firm
    - Requires cold treatment then warm ripening
    - Bartlett: 2-4 days at room temp after cold
    - D'Anjou/Bosc: Longer cold treatment required
    """

    def __init__(self):
        super().__init__(CropMaturityType.TREE_FRUIT_CLIMACTERIC)

        self.ssc_min = 10.0
        self.dd50 = 1900
        self.s = 250

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 40.0  # Pear base temp

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        Pear sugar at harvest is NOT final quality.

        True quality emerges after proper ripening protocol.
        """
        import math
        ssc = self.ssc_min + (cultivar_ceiling - self.ssc_min) / (
            1 + math.exp(-(gdd_accumulated - self.dd50) / self.s)
        )
        return ssc

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Pear acid content."""
        import math
        return 0.5 * math.exp(-0.0004 * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Pear freshness is complex - requires specific protocol.

        1. Cold treatment (32-33F) for 14-30 days (cultivar dependent)
        2. Ripen at room temp (65-70F) for 3-7 days
        3. Consume within 2-3 days of full ripeness
        """
        if cold_chain:
            # In cold storage (pre-ripening)
            if days_since_harvest <= 60:
                return 1.0  # Not yet ripe
            elif days_since_harvest <= 90:
                return 0.98
            else:
                return max(0.8, 1.0 - (days_since_harvest - 90) * 0.003)
        else:
            # Post-ripening (room temp)
            if days_since_harvest <= 3:
                return 1.0  # Reaching peak
            elif days_since_harvest <= 5:
                return 1.0  # At peak
            elif days_since_harvest <= 7:
                return 0.9
            else:
                return max(0.4, 1.0 - (days_since_harvest - 7) * 0.1)

    def _get_freshness_window(self) -> int:
        return 5  # After proper ripening, short window


class MangoQualityModel(CropQualityModel):
    """
    Quality model for mangoes (tropical climacteric fruit).

    Key characteristics:
    - Climacteric: Ripens well after harvest
    - Very high Brix potential (14-20+)
    - Chill injury below 55F - NO cold storage for unripe fruit
    - Color is NOT a reliable ripeness indicator
    - Shoulder/stem cues and aroma indicate ripeness
    """

    def __init__(self):
        super().__init__(CropMaturityType.TROPICAL_CLIMACTERIC)

        self.ssc_min = 10.0
        self.dd50 = 3000
        self.s = 400

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 60.0  # Tropical base temp

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        Mango sugar development - continues post-harvest.

        Alphonso and other premium cultivars reach 18-22 Brix.
        """
        import math
        ssc = self.ssc_min + (cultivar_ceiling - self.ssc_min) / (
            1 + math.exp(-(gdd_accumulated - self.dd50) / self.s)
        )
        return ssc

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Mango acid - relatively low, balanced by high sugar."""
        import math
        return 0.6 * math.exp(-0.0005 * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Mango freshness - AVOID cold storage for unripe fruit.

        Ripe mangoes can be refrigerated briefly.
        """
        if cold_chain:
            # Only appropriate for RIPE mangoes
            if days_since_harvest <= 7:
                return 1.0
            elif days_since_harvest <= 14:
                return 0.95
            else:
                return max(0.6, 1.0 - (days_since_harvest - 14) * 0.03)
        else:
            # Room temp ripening
            if days_since_harvest <= 5:
                return 1.0  # Still improving
            elif days_since_harvest <= 8:
                return 1.0  # At peak
            elif days_since_harvest <= 10:
                return 0.9
            else:
                return max(0.4, 1.0 - (days_since_harvest - 10) * 0.1)

    def _get_freshness_window(self) -> int:
        return 8  # After ripening


class PecanQualityModel(CropQualityModel):
    """
    Quality model for pecans (tree nut - unique quality metrics).

    Key characteristics:
    - Quality = oil content (65-72%), NOT Brix
    - Non-climacteric (doesn't ripen after harvest)
    - Kernel color indicates freshness
    - Long shelf life with proper storage
    - Alternate bearing affects quality
    """

    def __init__(self):
        super().__init__(CropMaturityType.NUT)

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.NON_CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 65.0  # Pecan base temp (higher requirement)

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        For pecans, this returns OIL CONTENT percentage, not Brix.

        Full oil development requires ~2900 GDD.
        """
        gdd_target = 2900
        max_oil = 70.0  # Maximum oil content %
        min_oil = 55.0  # Minimum acceptable

        if gdd_accumulated >= gdd_target:
            return max_oil
        elif gdd_accumulated >= 2600:
            # Full shuck split, nearing peak
            return min_oil + (max_oil - min_oil) * (
                (gdd_accumulated - 2600) / (gdd_target - 2600)
            )
        else:
            # Not ready
            return min_oil

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Pecans - return rancidity risk instead of acid."""
        # Fresh pecans have no rancidity
        return 0.0

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Pecans store well but can go rancid.

        Cold/frozen storage greatly extends life.
        """
        if cold_chain:
            # Frozen or cold storage
            if days_since_harvest <= 180:
                return 1.0
            elif days_since_harvest <= 365:
                return 0.98
            else:
                return max(0.85, 1.0 - (days_since_harvest - 365) * 0.0005)
        else:
            # Room temp - rancidity risk
            if days_since_harvest <= 30:
                return 1.0
            elif days_since_harvest <= 90:
                return 0.95
            elif days_since_harvest <= 180:
                return 0.85
            else:
                return max(0.5, 1.0 - (days_since_harvest - 180) * 0.002)

    def _get_freshness_window(self) -> int:
        return 180  # 6 months at room temp, much longer frozen


class BlueberryQualityModel(CropQualityModel):
    """
    Quality model for blueberries (non-climacteric berry).

    Key characteristics:
    - Non-climacteric: Must be fully ripe at harvest
    - Multiple picks over 4-6 week season
    - Bloom (waxy coating) indicates freshness
    - High antioxidant content is quality marker
    - Firmness affects shipping but not eating quality
    """

    def __init__(self):
        super().__init__(CropMaturityType.BERRY_NON_CLIMACTERIC)

        self.ssc_min = 8.0
        self.dd50 = 1300
        self.s = 150

    @property
    def post_harvest_behavior(self) -> PostHarvestBehavior:
        return PostHarvestBehavior.NON_CLIMACTERIC

    @property
    def gdd_base_temp(self) -> float:
        return 45.0  # Blueberry base temp

    def predict_sugar_content(
        self,
        gdd_accumulated: float,
        cultivar_ceiling: float
    ) -> float:
        """
        Blueberry sugar - fixed at harvest.

        Premium cultivars: 12-15 Brix
        Commercial: 10-12 Brix
        """
        import math
        ssc = self.ssc_min + (cultivar_ceiling - self.ssc_min) / (
            1 + math.exp(-(gdd_accumulated - self.dd50) / self.s)
        )
        return ssc

    def predict_acid_content(self, gdd_accumulated: float) -> float:
        """Blueberry acid - low, balanced."""
        import math
        return 0.5 * math.exp(-0.0006 * gdd_accumulated)

    def calculate_freshness_decay(
        self,
        days_since_harvest: int,
        cold_chain: bool
    ) -> float:
        """
        Blueberries moderately perishable but better than strawberries.

        Bloom preservation indicates careful handling.
        """
        if cold_chain:
            if days_since_harvest <= 5:
                return 1.0
            elif days_since_harvest <= 10:
                return 0.95
            elif days_since_harvest <= 14:
                return 0.90
            else:
                return max(0.6, 1.0 - (days_since_harvest - 14) * 0.03)
        else:
            if days_since_harvest <= 3:
                return 1.0
            elif days_since_harvest <= 5:
                return 0.90
            else:
                return max(0.4, 1.0 - (days_since_harvest - 5) * 0.1)

    def _get_freshness_window(self) -> int:
        return 10  # With cold chain


class QualityPredictor:
    """
    Main quality prediction service.

    Routes to appropriate crop-specific model and applies SHARE framework.
    """

    def __init__(self):
        # Create all models
        self._citrus_model = CitrusQualityModel()
        self._berry_model = BerryQualityModel()
        self._tomato_model = TomatoQualityModel()
        self._peach_model = PeachQualityModel()
        self._cherry_model = CherryQualityModel()
        self._apple_model = AppleQualityModel()
        self._pear_model = PearQualityModel()
        self._mango_model = MangoQualityModel()
        self._pecan_model = PecanQualityModel()
        self._blueberry_model = BlueberryQualityModel()

        # Map by maturity type (legacy support)
        self.models: dict[CropMaturityType, CropQualityModel] = {
            CropMaturityType.TREE_FRUIT_NON_CLIMACTERIC: self._citrus_model,
            CropMaturityType.BERRY_NON_CLIMACTERIC: self._berry_model,
            CropMaturityType.VINE_CLIMACTERIC: self._tomato_model,
            CropMaturityType.TREE_FRUIT_CLIMACTERIC: self._peach_model,
        }

        # Map by crop name (more precise)
        self.models_by_crop: dict[str, CropQualityModel] = {
            # Citrus
            "navel_orange": self._citrus_model,
            "valencia": self._citrus_model,
            "grapefruit": self._citrus_model,
            "tangerine": self._citrus_model,
            "satsuma": self._citrus_model,
            # Stone fruit
            "peach": self._peach_model,
            "sweet_cherry": self._cherry_model,
            "tart_cherry": self._cherry_model,
            "cherry": self._cherry_model,
            # Pome fruit
            "apple": self._apple_model,
            "pear": self._pear_model,
            # Berries
            "strawberry": self._berry_model,
            "blueberry": self._blueberry_model,
            # Tropical
            "mango": self._mango_model,
            # Other
            "pomegranate": self._citrus_model,  # Similar non-climacteric behavior
            "pecan": self._pecan_model,
            "tomato": self._tomato_model,
        }

    def get_model(self, crop_type: CropMaturityType) -> CropQualityModel:
        """Get the appropriate model for a crop type (legacy)."""
        return self.models.get(crop_type, self._citrus_model)

    def get_model_by_crop(self, crop_id: str) -> CropQualityModel:
        """
        Get the appropriate model for a specific crop.

        This is more precise than get_model() as it uses crop-specific
        models when available.
        """
        return self.models_by_crop.get(crop_id, self._citrus_model)

    def predict(
        self,
        crop_type: CropMaturityType,
        share_data: SHAREQualityPrediction,
        gdd: Optional[GDDAccumulation] = None
    ) -> QualityPredictionResult:
        """
        Predict quality for a crop using SHARE + crop-specific model.
        """
        model = self.get_model(crop_type)
        return model.predict_quality(share_data, gdd)

    def predict_by_crop(
        self,
        crop_id: str,
        share_data: SHAREQualityPrediction,
        gdd: Optional[GDDAccumulation] = None
    ) -> QualityPredictionResult:
        """
        Predict quality for a specific crop using its model.

        Preferred over predict() as it uses crop-specific models.
        """
        model = self.get_model_by_crop(crop_id)
        return model.predict_quality(share_data, gdd)

    def compare_to_commodity(
        self,
        prediction: QualityPredictionResult
    ) -> dict:
        """
        Compare predicted quality to commodity average.

        This quantifies the value proposition:
        "How much better is this than grocery store produce?"
        """
        # Commodity averages (USDA grades focus on appearance, not nutrition)
        commodity_brix = 8.0  # Typical commodity citrus
        commodity_freshness_days = 14  # Average time in supply chain

        brix_improvement = (
            (prediction.predicted_brix - commodity_brix) / commodity_brix * 100
        )

        freshness_improvement = (
            (commodity_freshness_days - (prediction.freshness_window_days or 0))
            / commodity_freshness_days * 100
        )

        return {
            "brix_vs_commodity": round(brix_improvement, 1),
            "freshness_vs_commodity": round(freshness_improvement, 1),
            "quality_score": prediction.predicted_quality_score,
            "message": self._generate_quality_message(prediction)
        }

    def _generate_quality_message(
        self,
        prediction: QualityPredictionResult
    ) -> str:
        """Generate consumer-facing quality message."""
        if prediction.predicted_brix >= 14:
            return "Exceptional sweetness - top 5% of produce"
        elif prediction.predicted_brix >= 12:
            return "Premium quality - significantly sweeter than grocery store"
        elif prediction.predicted_brix >= 10:
            return "Good quality - noticeably better than average"
        else:
            return "Standard quality"
