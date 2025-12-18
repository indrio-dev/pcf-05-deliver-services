"""
Quality Prediction Models - The Core of Fielder.

SHARE is the analytical framework for predicting internal quality
(flavor, nutrition, antioxidants) vs. the USDA's external appearance focus.

The Problem:
- Produce nutrients have declined ~50% in 50 years
- Cause: Cultivar selection based on yield + appearance (dilution effect)
- Farmers get paid for external quality, not internal quality
- USDA grades focus on appearance, size, defects - NOT nutrition or flavor

The Solution:
- SHARE predicts/verifies INTERNAL quality
- Farmers get paid for flavor and nutrition
- Connects consumers with superior quality, grown in USA, supporting farmers

SHARE Causal Chain:
S → H → A → R → E

Each stage affects the final quality ceiling and realized potential.
"""

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional


class CropMaturityType(Enum):
    """
    Crop types have different maturity and post-harvest behavior.

    This determines which quality prediction model to use.
    """
    # Tree fruits - mature on tree, minimal post-harvest ripening
    TREE_FRUIT_NON_CLIMACTERIC = "tree_fruit_non_climacteric"  # Citrus, cherries

    # Tree fruits - can ripen post-harvest
    TREE_FRUIT_CLIMACTERIC = "tree_fruit_climacteric"  # Apples, peaches, pears

    # Vine fruits
    VINE_CLIMACTERIC = "vine_climacteric"  # Tomatoes, melons
    VINE_NON_CLIMACTERIC = "vine_non_climacteric"  # Grapes, cucumbers

    # Berries
    BERRY_NON_CLIMACTERIC = "berry_non_climacteric"  # Strawberries, blueberries

    # Root vegetables
    ROOT_VEGETABLE = "root_vegetable"  # Carrots, potatoes

    # Leafy greens
    LEAFY_GREEN = "leafy_green"  # Lettuce, spinach, kale

    # Tropical
    TROPICAL_CLIMACTERIC = "tropical_climacteric"  # Bananas, mangoes, avocados

    # Nuts
    NUT = "nut"  # Pecans, almonds, walnuts - quality = oil content not Brix


class PostHarvestBehavior(Enum):
    """How the crop behaves after harvest."""
    # Climacteric: produces ethylene, can ripen after harvest
    # BUT - harvesting early sacrifices flavor/nutrition potential
    CLIMACTERIC = "climacteric"

    # Non-climacteric: must ripen on plant, quality fixed at harvest
    # CRITICAL: harvest timing determines final quality
    NON_CLIMACTERIC = "non_climacteric"


@dataclass
class SoilHealth:
    """
    S - Soil Health: The foundation of the SHARE framework.

    Healthy soil = better nutrient availability = higher potential quality.
    This sets the BASELINE that everything else builds on.
    """
    # Soil test results
    organic_matter_pct: Optional[float] = None
    ph: Optional[float] = None
    cec: Optional[float] = None  # Cation Exchange Capacity

    # Macronutrients (ppm)
    nitrogen_ppm: Optional[float] = None
    phosphorus_ppm: Optional[float] = None
    potassium_ppm: Optional[float] = None

    # Key micronutrients for flavor/nutrition
    calcium_ppm: Optional[float] = None
    magnesium_ppm: Optional[float] = None
    sulfur_ppm: Optional[float] = None
    boron_ppm: Optional[float] = None
    zinc_ppm: Optional[float] = None

    # Biological health
    microbial_activity_score: Optional[float] = None

    def calculate_soil_score(self) -> float:
        """
        Calculate a soil health score (0-100).

        Higher score = better foundation for quality produce.
        """
        # Simplified scoring - would be more sophisticated in production
        score = 50.0  # Baseline

        if self.organic_matter_pct:
            if self.organic_matter_pct >= 5.0:
                score += 15
            elif self.organic_matter_pct >= 3.0:
                score += 10
            elif self.organic_matter_pct >= 2.0:
                score += 5

        if self.ph and 6.0 <= self.ph <= 7.0:
            score += 10

        if self.microbial_activity_score:
            score += min(15, self.microbial_activity_score * 3)

        return min(100, score)


@dataclass
class HeritageCultivar:
    """
    H - Heritage Cultivars: The genetic ceiling for quality.

    Cultivar + rootstock combination determines the MAXIMUM possible
    Brix, nutrition, and flavor that can be achieved.

    Modern cultivars selected for yield/appearance have LOWER genetic
    ceilings than heritage varieties selected for flavor/nutrition.
    """
    cultivar_id: str
    cultivar_name: str
    rootstock_id: Optional[str] = None
    rootstock_name: Optional[str] = None

    # Genetic potential (what this combination CAN achieve)
    max_brix_potential: Optional[float] = None
    max_nutrient_density_score: Optional[float] = None  # 0-100

    # For tree crops: minimum years to reach genetic potential
    years_to_maturity: Optional[int] = None

    # Quality characteristics
    flavor_profile: Optional[str] = None
    nutrition_highlights: list[str] = field(default_factory=list)

    # Heritage vs modern
    is_heritage_variety: bool = False
    year_introduced: Optional[int] = None

    # Breeding focus (what this cultivar was selected FOR)
    bred_for_yield: bool = False
    bred_for_appearance: bool = False
    bred_for_shipping: bool = False
    bred_for_flavor: bool = False
    bred_for_nutrition: bool = False


@dataclass
class AgriculturalPractices:
    """
    A - Agricultural Practices: Tertiary modifier to quality.

    Fertilizer, irrigation, pest management, etc.
    Can help or hurt, but CANNOT overcome bad S or H.

    This is a +/- adjustment on top of the genetic ceiling.
    """
    # Certification
    organic_certified: bool = False
    regenerative_certified: bool = False

    # Irrigation
    irrigation_type: Optional[str] = None  # drip, flood, rainfed

    # Inputs
    uses_synthetic_fertilizer: bool = True
    uses_synthetic_pesticides: bool = True
    uses_cover_crops: bool = False

    # Management
    crop_load_managed: bool = False  # Thinning for quality
    soil_testing_frequency: Optional[str] = None

    def calculate_practice_modifier(self) -> float:
        """
        Calculate practice modifier (-0.5 to +0.5).

        This adjusts the genetic ceiling based on farming practices.
        """
        modifier = 0.0

        if self.organic_certified:
            modifier += 0.1
        if self.regenerative_certified:
            modifier += 0.2
        if self.uses_cover_crops:
            modifier += 0.1
        if self.crop_load_managed:
            modifier += 0.2  # Thinning is important for tree fruit quality

        return min(0.5, modifier)


@dataclass
class RipenTiming:
    """
    R - Ripen: Harvest timing + transit to consumer.

    For non-climacteric crops (citrus, berries): harvest AT peak
    For climacteric crops: harvest at optimal maturity for ripening

    Peak = middle 50% of harvest window
    Transit = time from harvest to consumer (freshness degradation)
    """
    # Harvest timing
    harvest_date: Optional[date] = None
    days_from_bloom: Optional[int] = None
    gdd_at_harvest: Optional[float] = None

    # Position in harvest window
    in_peak_window: bool = False
    days_from_peak_center: int = 0

    # Transit (part of the freshness equation)
    transit_days: int = 0
    cold_chain_maintained: bool = True

    # Quality at harvest
    brix_at_harvest: Optional[float] = None
    acid_at_harvest: Optional[float] = None
    firmness_at_harvest: Optional[float] = None

    def calculate_timing_modifier(self, crop_type: CropMaturityType) -> float:
        """
        Calculate timing modifier based on harvest timing and transit.

        For non-climacteric: penalty for picking outside peak window
        For climacteric: different calculation based on intended ripening
        """
        modifier = 0.0

        # Harvest timing penalty
        if not self.in_peak_window:
            # Penalty increases with distance from peak
            modifier -= min(0.8, abs(self.days_from_peak_center) * 0.05)

        # Transit freshness penalty
        if self.transit_days > 1:
            if self.cold_chain_maintained:
                modifier -= (self.transit_days - 1) * 0.05
            else:
                modifier -= (self.transit_days - 1) * 0.15

        return max(-1.0, modifier)


@dataclass
class EnrichMeasurement:
    """
    E - Enrich: The actual measurement of the system.

    This is PROOF that the SHARE framework delivered.
    It's also the feedback loop for improving predictions.

    What we measure:
    - Brix (sugar content)
    - Nutrition (vitamins, minerals, antioxidants)
    - Freshness (days since harvest, storage conditions)
    """
    # Core quality metrics
    brix: Optional[float] = None
    titratable_acid: Optional[float] = None
    brix_acid_ratio: Optional[float] = None
    brima_score: Optional[float] = None  # BrimA = Brix - 4*TA

    # Nutrition (lab tested)
    vitamin_c_mg_per_100g: Optional[float] = None
    total_antioxidants_orac: Optional[float] = None
    polyphenols_mg_per_100g: Optional[float] = None

    # Freshness
    days_since_harvest: int = 0
    storage_temp_f: Optional[float] = None

    # Verification
    test_date: Optional[date] = None
    lab_verified: bool = False
    self_reported: bool = True

    def calculate_quality_score(self) -> float:
        """
        Calculate overall quality score (0-100).

        Weights Brix, nutrition, and freshness.
        """
        score = 0.0
        factors = 0

        # Brix contribution (0-40 points)
        if self.brix:
            if self.brix >= 14:
                score += 40
            elif self.brix >= 12:
                score += 35
            elif self.brix >= 10:
                score += 25
            elif self.brix >= 8:
                score += 15
            factors += 1

        # Freshness contribution (0-30 points)
        if self.days_since_harvest <= 1:
            score += 30
        elif self.days_since_harvest <= 3:
            score += 25
        elif self.days_since_harvest <= 5:
            score += 15
        elif self.days_since_harvest <= 7:
            score += 10
        factors += 1

        # Nutrition contribution (0-30 points) - if available
        if self.vitamin_c_mg_per_100g:
            # Normalize based on expected ranges
            score += min(30, self.vitamin_c_mg_per_100g / 2)
            factors += 1

        return score if factors == 0 else score


@dataclass
class SHAREQualityPrediction:
    """
    Complete SHARE quality prediction for a crop.

    Combines all five factors to predict internal quality.
    """
    # The five factors
    soil: Optional[SoilHealth] = None
    heritage: Optional[HeritageCultivar] = None
    agricultural_practices: Optional[AgriculturalPractices] = None
    ripen: Optional[RipenTiming] = None
    enrich: Optional[EnrichMeasurement] = None  # Actual measurement (if available)

    # Crop type determines prediction model
    crop_maturity_type: CropMaturityType = CropMaturityType.TREE_FRUIT_NON_CLIMACTERIC

    def predict_quality(self) -> dict:
        """
        Predict internal quality based on SHARE factors.

        Returns predicted Brix, quality score, and confidence.
        """
        # Start with genetic ceiling from heritage cultivar
        if self.heritage and self.heritage.max_brix_potential:
            base_brix = self.heritage.max_brix_potential
        else:
            base_brix = 10.0  # Default assumption

        # Soil modifier (0 to +10% of base)
        soil_mod = 0.0
        if self.soil:
            soil_score = self.soil.calculate_soil_score()
            soil_mod = (soil_score - 50) / 500  # -10% to +10%

        # Practice modifier
        practice_mod = 0.0
        if self.agricultural_practices:
            practice_mod = self.agricultural_practices.calculate_practice_modifier()

        # Timing modifier
        timing_mod = 0.0
        if self.ripen:
            timing_mod = self.ripen.calculate_timing_modifier(self.crop_maturity_type)

        # Calculate predicted Brix
        predicted_brix = base_brix * (1 + soil_mod) + practice_mod + timing_mod

        # Calculate quality score
        quality_score = 50.0  # Baseline

        if predicted_brix >= 14:
            quality_score += 30
        elif predicted_brix >= 12:
            quality_score += 20
        elif predicted_brix >= 10:
            quality_score += 10

        if self.heritage and self.heritage.is_heritage_variety:
            quality_score += 10

        if self.ripen and self.ripen.in_peak_window:
            quality_score += 10

        # Confidence based on available data
        confidence = 0.5
        if self.soil:
            confidence += 0.1
        if self.heritage:
            confidence += 0.15
        if self.agricultural_practices:
            confidence += 0.1
        if self.ripen and self.ripen.brix_at_harvest:
            confidence += 0.15  # Actual measurement increases confidence

        return {
            "predicted_brix": round(predicted_brix, 1),
            "quality_score": round(min(100, quality_score), 0),
            "confidence": round(min(1.0, confidence), 2),
            "factors": {
                "base_brix": base_brix,
                "soil_modifier": round(soil_mod, 3),
                "practice_modifier": round(practice_mod, 2),
                "timing_modifier": round(timing_mod, 2),
            }
        }
