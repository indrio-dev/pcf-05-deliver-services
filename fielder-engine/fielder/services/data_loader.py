"""
Data Loader - Seed the system with researchable data.

This is how we bootstrap the platform with:
- Cultivar research data (Brix studies, maturity timing)
- Regional bloom/harvest data from extension services
- Rootstock research
- USDA zone definitions

Data sources to compile:
- UC Davis Fruit & Nut Research
- UF/IFAS Citrus Extension
- USDA Plant Hardiness Zones
- State extension services
- Academic Brix/quality studies
"""

from dataclasses import dataclass
from datetime import date
from typing import Optional
import json
from pathlib import Path

from fielder.models.cultivar_database import (
    CultivarDatabase,
    CultivarResearch,
    RegionalBloomData,
    RootstockResearch,
    QualityTier,
    BreedingFocus,
)
from fielder.models.crop import CropType, Cultivar
from fielder.models.region import GrowingRegion


@dataclass
class DataLoadResult:
    """Result of a data load operation."""
    cultivars_loaded: int = 0
    regional_data_loaded: int = 0
    rootstocks_loaded: int = 0
    errors: list[str] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []

    @property
    def success(self) -> bool:
        return len(self.errors) == 0


class DataLoader:
    """
    Load research data into the cultivar database.

    Phase 1: Hardcoded research data (compile from studies)
    Phase 2: JSON/YAML data files
    Phase 3: Database with admin interface
    """

    def __init__(self, database: CultivarDatabase):
        self.db = database

    def load_citrus_cultivars(self) -> DataLoadResult:
        """
        Load citrus cultivar research data.

        Sources:
        - UF/IFAS Citrus Extension
        - USDA Citrus Maturity Studies
        - Wutscher Rootstock Research
        """
        result = DataLoadResult()

        # === NAVEL ORANGES ===

        washington_navel = CultivarResearch(
            cultivar_id="washington_navel",
            cultivar_name="Washington Navel",
            crop_type="navel_orange",
            research_peak_brix=12.5,
            research_avg_brix=11.5,
            research_brix_range=(10.5, 13.0),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1870,
            days_to_maturity=270,
            gdd_to_maturity=2000,
            gdd_to_peak=2300,
            gdd_base_temp=55.0,
            timing_class="mid",
            recommended_rootstocks=["carrizo", "c35", "sour_orange"],
            optimal_usda_zones=["9a", "9b", "10a", "10b"],
            flavor_profile="Sweet, low acid, classic navel flavor",
            best_use=["fresh"],
            research_sources=[
                "UF/IFAS Citrus Extension",
                "USDA Citrus Maturity Studies"
            ]
        )
        self.db.add_cultivar(washington_navel)
        result.cultivars_loaded += 1

        cara_cara = CultivarResearch(
            cultivar_id="cara_cara",
            cultivar_name="Cara Cara Navel",
            crop_type="navel_orange",
            research_peak_brix=13.0,
            research_avg_brix=12.0,
            research_brix_range=(11.0, 14.0),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.NUTRITION],
            is_heritage=False,
            year_introduced=1976,
            days_to_maturity=260,
            gdd_to_maturity=1900,
            gdd_to_peak=2200,
            gdd_base_temp=55.0,
            timing_class="early",
            recommended_rootstocks=["carrizo", "c35"],
            optimal_usda_zones=["9a", "9b", "10a", "10b"],
            flavor_profile="Sweet, low acid, berry-like undertones, pink flesh",
            best_use=["fresh"],
            nutrition_highlights=["Higher lycopene than standard navels"],
            research_sources=["UC Riverside Citrus Variety Collection"]
        )
        self.db.add_cultivar(cara_cara)
        result.cultivars_loaded += 1

        # === VALENCIA ORANGES ===

        valencia = CultivarResearch(
            cultivar_id="valencia",
            cultivar_name="Valencia",
            crop_type="valencia_orange",
            research_peak_brix=13.5,
            research_avg_brix=12.5,
            research_brix_range=(11.0, 14.5),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1870,
            days_to_maturity=390,  # Late season
            gdd_to_maturity=3200,
            gdd_to_peak=3500,
            gdd_base_temp=55.0,
            timing_class="late",
            recommended_rootstocks=["carrizo", "swingle", "sour_orange"],
            optimal_usda_zones=["9b", "10a", "10b"],
            flavor_profile="Rich, complex, excellent sugar-acid balance",
            best_use=["fresh", "juice"],
            research_sources=["UF/IFAS Valencia Studies"]
        )
        self.db.add_cultivar(valencia)
        result.cultivars_loaded += 1

        # === GRAPEFRUIT ===

        ruby_red = CultivarResearch(
            cultivar_id="ruby_red",
            cultivar_name="Ruby Red",
            crop_type="grapefruit",
            research_peak_brix=11.0,
            research_avg_brix=10.0,
            research_brix_range=(9.0, 12.0),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1929,
            days_to_maturity=240,
            gdd_to_maturity=1800,
            gdd_to_peak=2100,
            gdd_base_temp=55.0,
            timing_class="mid",
            recommended_rootstocks=["sour_orange", "carrizo"],
            optimal_usda_zones=["9b", "10a", "10b"],
            flavor_profile="Sweet-tart, less bitter than white grapefruit",
            best_use=["fresh"],
            research_sources=["Texas A&M Citrus Center"]
        )
        self.db.add_cultivar(ruby_red)
        result.cultivars_loaded += 1

        rio_red = CultivarResearch(
            cultivar_id="rio_red",
            cultivar_name="Rio Red",
            crop_type="grapefruit",
            research_peak_brix=11.5,
            research_avg_brix=10.5,
            research_brix_range=(9.5, 12.5),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.NUTRITION],
            is_heritage=False,
            year_introduced=1984,
            days_to_maturity=240,
            gdd_to_maturity=1800,
            gdd_to_peak=2100,
            gdd_base_temp=55.0,
            timing_class="mid",
            recommended_rootstocks=["sour_orange", "carrizo"],
            optimal_usda_zones=["9b", "10a", "10b"],
            flavor_profile="Sweeter than Ruby Red, deep red flesh",
            best_use=["fresh"],
            nutrition_highlights=["High lycopene"],
            research_sources=["Texas A&M Citrus Center"]
        )
        self.db.add_cultivar(rio_red)
        result.cultivars_loaded += 1

        # === BLOOD ORANGES ===
        # Exceptional flavor citrus - anthocyanin pigments create unique taste
        # Commercial in California, Sicily; growing in Florida specialty market

        moro = CultivarResearch(
            cultivar_id="moro_blood",
            cultivar_name="Moro Blood Orange",
            crop_type="blood_orange",
            research_peak_brix=12.5,
            research_avg_brix=11.0,
            research_brix_range=(9.5, 13.5),
            quality_tier=QualityTier.ARTISAN,
            breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.NUTRITION],
            is_heritage=True,
            year_introduced=1850,  # Sicilian origin
            days_to_maturity=280,
            gdd_to_maturity=5800,  # Calibrated for ~22 GDD/day
            gdd_to_peak=6400,
            gdd_base_temp=55.0,
            timing_class="mid",
            recommended_rootstocks=["carrizo", "c35"],
            optimal_usda_zones=["9a", "9b", "10a"],
            flavor_profile="Intense raspberry-citrus, deepest red flesh, complex berry notes",
            best_use=["fresh", "juice", "cocktails"],
            nutrition_highlights=["High anthocyanins", "Antioxidant-rich"],
            research_sources=["UC Riverside Citrus", "Sicily citrus studies"]
        )
        self.db.add_cultivar(moro)
        result.cultivars_loaded += 1

        tarocco = CultivarResearch(
            cultivar_id="tarocco_blood",
            cultivar_name="Tarocco Blood Orange",
            crop_type="blood_orange",
            research_peak_brix=13.0,
            research_avg_brix=11.5,
            research_brix_range=(10.0, 14.0),
            quality_tier=QualityTier.ARTISAN,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1800,  # Italian origin
            days_to_maturity=290,
            gdd_to_maturity=6000,
            gdd_to_peak=6600,
            gdd_base_temp=55.0,
            timing_class="mid-late",
            recommended_rootstocks=["carrizo", "trifoliate"],
            optimal_usda_zones=["9a", "9b", "10a"],
            flavor_profile="Sweetest blood orange, honey notes, less acidic, prized in Italy",
            best_use=["fresh", "premium juice"],
            nutrition_highlights=["Highest vitamin C of blood oranges"],
            research_sources=["Italian citrus research", "UC Davis"]
        )
        self.db.add_cultivar(tarocco)
        result.cultivars_loaded += 1

        sanguinelli = CultivarResearch(
            cultivar_id="sanguinelli_blood",
            cultivar_name="Sanguinelli Blood Orange",
            crop_type="blood_orange",
            research_peak_brix=12.0,
            research_avg_brix=10.5,
            research_brix_range=(9.0, 13.0),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1929,  # Spanish origin
            days_to_maturity=300,
            gdd_to_maturity=6200,
            gdd_to_peak=6800,
            gdd_base_temp=55.0,
            timing_class="late",
            recommended_rootstocks=["carrizo", "c35"],
            optimal_usda_zones=["9a", "9b", "10a"],
            flavor_profile="Tart-sweet balance, streaky flesh, wine-like notes",
            best_use=["fresh", "marmalade", "cooking"],
            research_sources=["Spanish citrus research"]
        )
        self.db.add_cultivar(sanguinelli)
        result.cultivars_loaded += 1

        # === TANGERINES / MANDARINS ===
        # Exceptional flavor citrus - easy peel, kid-friendly, high demand

        honey = CultivarResearch(
            cultivar_id="honey_tangerine",
            cultivar_name="Honey Tangerine (Murcott)",
            crop_type="tangerine",
            research_peak_brix=15.0,
            research_avg_brix=13.5,
            research_brix_range=(12.0, 16.0),
            quality_tier=QualityTier.ARTISAN,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1913,  # Florida origin
            days_to_maturity=290,
            gdd_to_maturity=5800,  # Calibrated for ~22 GDD/day
            gdd_to_peak=6200,
            gdd_base_temp=55.0,
            timing_class="late",
            recommended_rootstocks=["swingle", "carrizo"],
            optimal_usda_zones=["9a", "9b", "10a"],
            flavor_profile="Exceptionally sweet, honey-like, rich tangerine flavor, seedy",
            best_use=["fresh", "juice"],
            research_sources=["UF/IFAS Citrus Extension"]
        )
        self.db.add_cultivar(honey)
        result.cultivars_loaded += 1

        sumo = CultivarResearch(
            cultivar_id="sumo_citrus",
            cultivar_name="Sumo Citrus (Shiranui/Dekopon)",
            crop_type="tangerine",
            research_peak_brix=16.0,
            research_avg_brix=14.0,
            research_brix_range=(13.0, 17.0),
            quality_tier=QualityTier.ARTISAN,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=False,
            year_introduced=1972,  # Japanese hybrid
            days_to_maturity=300,
            gdd_to_maturity=6000,
            gdd_to_peak=6500,
            gdd_base_temp=55.0,
            timing_class="late",
            recommended_rootstocks=["carrizo", "c35"],
            optimal_usda_zones=["9a", "9b", "10a"],
            flavor_profile="Intensely sweet, no seeds, distinctive knob, premium market darling",
            best_use=["fresh", "premium retail"],
            research_sources=["Japanese citrus research", "California citrus"]
        )
        self.db.add_cultivar(sumo)
        result.cultivars_loaded += 1

        satsuma_owari = CultivarResearch(
            cultivar_id="satsuma_owari",
            cultivar_name="Owari Satsuma",
            crop_type="satsuma",
            research_peak_brix=12.5,
            research_avg_brix=11.0,
            research_brix_range=(9.5, 13.5),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1878,  # Japanese origin
            days_to_maturity=230,
            gdd_to_maturity=4600,
            gdd_to_peak=5100,
            gdd_base_temp=55.0,
            timing_class="early",
            recommended_rootstocks=["trifoliate", "flying_dragon"],
            optimal_usda_zones=["8b", "9a", "9b"],
            flavor_profile="Classic satsuma, mild sweet, seedless, cold-hardy",
            best_use=["fresh", "canning"],
            research_sources=["Auburn University", "Louisiana citrus"]
        )
        self.db.add_cultivar(satsuma_owari)
        result.cultivars_loaded += 1

        clementine = CultivarResearch(
            cultivar_id="clementine",
            cultivar_name="Clementine",
            crop_type="tangerine",
            research_peak_brix=13.5,
            research_avg_brix=12.0,
            research_brix_range=(10.5, 14.5),
            quality_tier=QualityTier.PREMIUM,
            breeding_focus=[BreedingFocus.FLAVOR],
            is_heritage=True,
            year_introduced=1902,  # Algerian origin
            days_to_maturity=270,
            gdd_to_maturity=5500,
            gdd_to_peak=5900,
            gdd_base_temp=55.0,
            timing_class="mid",
            recommended_rootstocks=["carrizo", "c35"],
            optimal_usda_zones=["9a", "9b", "10a"],
            flavor_profile="Sweet-tart, seedless, easy peel, perfect snacking size",
            best_use=["fresh", "kids snacking"],
            research_sources=["California citrus research", "Spain citrus"]
        )
        self.db.add_cultivar(clementine)
        result.cultivars_loaded += 1

        return result

    def load_citrus_rootstocks(self) -> DataLoadResult:
        """
        Load citrus rootstock research data.

        Key finding: Rootstock affects internal quality more than most realize.
        Source: Wutscher rootstock studies, UF/IFAS extension
        """
        result = DataLoadResult()

        rootstocks = [
            RootstockResearch(
                rootstock_id="carrizo",
                rootstock_name="Carrizo Citrange",
                crop_types=["navel_orange", "valencia_orange", "grapefruit"],
                brix_modifier=0.6,
                brix_modifier_range=(0.3, 0.8),
                vigor="medium",
                yield_effect="neutral",
                disease_resistance={
                    "tristeza": "tolerant",
                    "phytophthora": "moderate",
                    "citrus_nematode": "susceptible"
                },
                cold_hardy_to_f=24,
                notes="Consistently lifts SSC/internal quality",
                research_sources=["Wutscher Rootstock Studies"]
            ),
            RootstockResearch(
                rootstock_id="c35",
                rootstock_name="C-35 Citrange",
                crop_types=["navel_orange", "valencia_orange"],
                brix_modifier=0.5,
                brix_modifier_range=(0.2, 0.7),
                vigor="semi-dwarfing",
                yield_effect="neutral",
                disease_resistance={
                    "tristeza": "tolerant",
                    "phytophthora": "good"
                },
                cold_hardy_to_f=22,
                notes="Semi-dwarfing with good quality",
                research_sources=["UF/IFAS Extension"]
            ),
            RootstockResearch(
                rootstock_id="sour_orange",
                rootstock_name="Sour Orange",
                crop_types=["navel_orange", "valencia_orange", "grapefruit"],
                brix_modifier=0.5,
                brix_modifier_range=(0.3, 0.6),
                vigor="medium",
                yield_effect="neutral",
                disease_resistance={
                    "tristeza": "susceptible",  # Major limitation
                    "phytophthora": "good"
                },
                cold_hardy_to_f=22,
                notes="Excellent quality but tristeza-susceptible; being phased out",
                research_sources=["Traditional Florida industry data"]
            ),
            RootstockResearch(
                rootstock_id="swingle",
                rootstock_name="Swingle Citrumelo",
                crop_types=["navel_orange", "valencia_orange", "grapefruit"],
                brix_modifier=-0.5,
                brix_modifier_range=(-0.7, -0.3),
                vigor="vigorous",
                yield_effect="high",
                disease_resistance={
                    "tristeza": "tolerant",
                    "phytophthora": "excellent",
                    "citrus_nematode": "tolerant"
                },
                cold_hardy_to_f=20,
                drought_tolerant=True,
                notes="High yield but lower internal quality; common commercial choice",
                research_sources=["Wutscher Rootstock Studies"]
            ),
            RootstockResearch(
                rootstock_id="rough_lemon",
                rootstock_name="Rough Lemon",
                crop_types=["navel_orange", "valencia_orange", "grapefruit"],
                brix_modifier=-0.7,
                brix_modifier_range=(-0.9, -0.5),
                vigor="vigorous",
                yield_effect="high",
                disease_resistance={
                    "tristeza": "tolerant",
                    "phytophthora": "susceptible"
                },
                cold_hardy_to_f=26,
                drought_tolerant=True,
                notes="Maximum yield, minimum quality - commodity production",
                research_sources=["Historic Florida citrus data"]
            ),
            RootstockResearch(
                rootstock_id="us_897",
                rootstock_name="US-897 (Cleopatra x Flying Dragon)",
                crop_types=["navel_orange", "valencia_orange", "grapefruit", "tangerine"],
                brix_modifier=0.5,  # Trifoliate-leaning hybrid = high SSC
                brix_modifier_range=(0.4, 0.6),
                vigor="semi-dwarfing",
                yield_effect="neutral",
                disease_resistance={
                    "tristeza": "tolerant",
                    "phytophthora": "good",
                    "hlb": "tolerant",  # Key advantage in HLB era
                    "citrus_nematode": "tolerant"
                },
                cold_hardy_to_f=20,  # Excellent cold tolerance from Flying Dragon
                drought_tolerant=True,
                notes="HLB-tolerant rootstock from UF/IFAS. Semi-dwarfing with good quality. "
                      "Cleopatra mandarin x Flying Dragon trifoliate hybrid. "
                      "Released 2007, popular choice for new plantings in HLB era.",
                research_sources=["UF/IFAS CREC", "Bowman et al. 2016"]
            ),
            RootstockResearch(
                rootstock_id="us_942",
                rootstock_name="US-942 (Sunki x Flying Dragon)",
                crop_types=["navel_orange", "valencia_orange", "grapefruit"],
                brix_modifier=0.3,
                brix_modifier_range=(0.1, 0.5),
                vigor="semi-dwarfing",
                yield_effect="neutral",
                disease_resistance={
                    "tristeza": "tolerant",
                    "phytophthora": "excellent",
                    "hlb": "tolerant",
                    "citrus_nematode": "tolerant"
                },
                cold_hardy_to_f=18,
                drought_tolerant=True,
                notes="HLB-tolerant rootstock. Sunki mandarin x Flying Dragon. "
                      "Very cold hardy. Released 2010.",
                research_sources=["UF/IFAS CREC", "Bowman et al. 2016"]
            ),
        ]

        for rootstock in rootstocks:
            self.db.add_rootstock(rootstock)
            result.rootstocks_loaded += 1

        return result

    def load_florida_regional_data(self) -> DataLoadResult:
        """
        Load regional bloom/harvest data for Florida citrus regions.

        Florida regions:
        - Indian River (premium grapefruit, navels)
        - Central Ridge (sweet oranges)
        - Southwest (Valencia, specialty)
        - North Florida (cold-sensitive limits)
        """
        result = DataLoadResult()

        regional_data = [
            # Indian River - Washington Navel
            RegionalBloomData(
                cultivar_id="washington_navel",
                region_id="indian_river",
                avg_bloom_start_doy=75,   # Mid-March
                avg_bloom_peak_doy=85,    # Late March
                avg_bloom_end_doy=95,     # Early April
                historical_harvest_start_doy=305,  # Nov 1
                historical_harvest_end_doy=31,     # Jan 31 (next year)
                historical_peak_start_doy=335,     # Dec 1 (middle 30 days of 90-day season)
                historical_peak_end_doy=365,       # Dec 31
                avg_gdd_per_day_bloom_to_harvest=11.5,
                years_of_data=20,
                data_source="UF/IFAS Historical Records"
            ),
            # Sweet Valley (North FL) - Washington Navel
            # North FL is cooler = earlier color break, slightly earlier season
            # But also more frost risk, so season compressed
            RegionalBloomData(
                cultivar_id="washington_navel",
                region_id="sweet_valley",
                avg_bloom_start_doy=80,   # Late March (slightly later due to cooler)
                avg_bloom_peak_doy=90,    # Early April
                avg_bloom_end_doy=100,    # Mid-April
                historical_harvest_start_doy=288,  # Oct 15 (earlier color break)
                historical_harvest_end_doy=15,     # Jan 15 (frost risk limits late harvest)
                historical_peak_start_doy=320,     # Nov 16 (middle 30 days)
                historical_peak_end_doy=350,       # Dec 16
                avg_gdd_per_day_bloom_to_harvest=10.0,  # Cooler than Indian River
                years_of_data=15,
                data_source="UF/IFAS North Florida Extension"
            ),
            # Indian River - Ruby Red Grapefruit
            RegionalBloomData(
                cultivar_id="ruby_red",
                region_id="indian_river",
                avg_bloom_start_doy=60,   # Early March
                avg_bloom_peak_doy=75,    # Mid-March
                avg_bloom_end_doy=90,     # Late March
                historical_harvest_start_doy=305,  # Nov 1
                historical_harvest_end_doy=120,    # April 30
                historical_peak_start_doy=349,     # Dec 15
                historical_peak_end_doy=60,        # March 1
                avg_gdd_per_day_bloom_to_harvest=11.0,
                years_of_data=25,
                data_source="Indian River Citrus League"
            ),
            # Central Ridge - Valencia
            RegionalBloomData(
                cultivar_id="valencia",
                region_id="central_ridge",
                avg_bloom_start_doy=60,   # Early March
                avg_bloom_peak_doy=75,    # Mid-March
                avg_bloom_end_doy=90,     # Late March
                historical_harvest_start_doy=60,   # March 1
                historical_harvest_end_doy=181,    # June 30
                historical_peak_start_doy=91,      # April 1
                historical_peak_end_doy=152,       # June 1
                avg_gdd_per_day_bloom_to_harvest=12.0,
                years_of_data=30,
                data_source="UF/IFAS Citrus Extension"
            ),
        ]

        for data in regional_data:
            self.db.add_regional_data(data)
            result.regional_data_loaded += 1

        return result

    def load_strawberry_regional_data(self) -> DataLoadResult:
        """
        Load regional bloom/harvest data for strawberry cultivars.

        Florida strawberries:
        - Transplanted Sept-Oct (DOY 260-290)
        - Harvest Nov-March (DOY 305-90)
        - Different regions = different timing due to GDD accumulation rates
        - South Florida: earlier, faster GDD accumulation
        - Central Florida (Plant City): main production area
        - California: different timing entirely (year-round production)

        Key insight: Same cultivar, different region = different harvest dates!
        """
        result = DataLoadResult()

        regional_data = [
            # =================================================================
            # CENTRAL FLORIDA (Plant City area) - Main FL strawberry region
            # =================================================================
            # Florida Brilliance - EARLY (first to market, high yield)
            RegionalBloomData(
                cultivar_id="florida_brilliance",
                region_id="central_florida",
                avg_bloom_start_doy=274,   # Oct 1 (transplant = "bloom" for annual strawberries)
                avg_bloom_peak_doy=281,    # Oct 8
                avg_bloom_end_doy=288,     # Oct 15
                historical_harvest_start_doy=319,  # Nov 15 (earliest FL berries)
                historical_harvest_end_doy=60,     # March 1
                historical_peak_start_doy=349,     # Dec 15 (Christmas market)
                historical_peak_end_doy=31,        # Jan 31
                avg_gdd_per_day_bloom_to_harvest=14.0,  # FL avg ~14 GDD/day base 50
                years_of_data=8,
                data_source="UF/IFAS Gulf Coast Research Center"
            ),
            # Florida Radiance - EARLY (established variety)
            RegionalBloomData(
                cultivar_id="florida_radiance",
                region_id="central_florida",
                avg_bloom_start_doy=274,   # Oct 1
                avg_bloom_peak_doy=281,    # Oct 8
                avg_bloom_end_doy=288,     # Oct 15
                historical_harvest_start_doy=330,  # Nov 26 (Thanksgiving)
                historical_harvest_end_doy=75,     # March 15
                historical_peak_start_doy=1,       # Jan 1
                historical_peak_end_doy=45,        # Feb 15
                avg_gdd_per_day_bloom_to_harvest=14.0,
                years_of_data=15,
                data_source="UF/IFAS Gulf Coast Research Center"
            ),
            # Strawberry Festival - MID (the classic FL cultivar)
            RegionalBloomData(
                cultivar_id="florida_festival",
                region_id="central_florida",
                avg_bloom_start_doy=274,   # Oct 1
                avg_bloom_peak_doy=281,    # Oct 8
                avg_bloom_end_doy=288,     # Oct 15
                historical_harvest_start_doy=340,  # Dec 6
                historical_harvest_end_doy=90,     # March 31
                historical_peak_start_doy=15,      # Jan 15
                historical_peak_end_doy=59,        # Feb 28
                avg_gdd_per_day_bloom_to_harvest=14.0,
                years_of_data=25,
                data_source="UF/IFAS - Florida's most planted cultivar 2000-2020"
            ),
            # Sensation - MID-LATE (premium flavor)
            RegionalBloomData(
                cultivar_id="florida_sensation",
                region_id="central_florida",
                avg_bloom_start_doy=274,   # Oct 1
                avg_bloom_peak_doy=281,    # Oct 8
                avg_bloom_end_doy=288,     # Oct 15
                historical_harvest_start_doy=349,  # Dec 15
                historical_harvest_end_doy=90,     # March 31
                historical_peak_start_doy=32,      # Feb 1
                historical_peak_end_doy=75,        # March 15
                avg_gdd_per_day_bloom_to_harvest=14.0,
                years_of_data=8,
                data_source="UF/IFAS Gulf Coast Research Center"
            ),
            # Winter Dawn - LATE (extends season into March)
            RegionalBloomData(
                cultivar_id="winter_dawn",
                region_id="central_florida",
                avg_bloom_start_doy=274,   # Oct 1
                avg_bloom_peak_doy=281,    # Oct 8
                avg_bloom_end_doy=288,     # Oct 15
                historical_harvest_start_doy=1,    # Jan 1
                historical_harvest_end_doy=105,    # April 15
                historical_peak_start_doy=45,      # Feb 15
                historical_peak_end_doy=90,        # March 31
                avg_gdd_per_day_bloom_to_harvest=14.0,
                years_of_data=18,
                data_source="UF/IFAS Gulf Coast Research Center"
            ),

            # =================================================================
            # SOUTH FLORIDA (Homestead area) - Earlier, faster GDD
            # Higher temps = faster GDD accumulation = earlier harvest
            # =================================================================
            # Florida Brilliance - EARLY (even earlier in South FL)
            RegionalBloomData(
                cultivar_id="florida_brilliance",
                region_id="south_florida",
                avg_bloom_start_doy=288,   # Oct 15 (later transplant due to heat)
                avg_bloom_peak_doy=295,    # Oct 22
                avg_bloom_end_doy=302,     # Oct 29
                historical_harvest_start_doy=330,  # Nov 26
                historical_harvest_end_doy=32,     # Feb 1 (shorter season - too hot)
                historical_peak_start_doy=349,     # Dec 15
                historical_peak_end_doy=15,        # Jan 15
                avg_gdd_per_day_bloom_to_harvest=18.0,  # Higher GDD/day in S. FL
                years_of_data=5,
                data_source="UF/IFAS Tropical Research"
            ),
            # Florida Radiance - EARLY
            RegionalBloomData(
                cultivar_id="florida_radiance",
                region_id="south_florida",
                avg_bloom_start_doy=288,   # Oct 15
                avg_bloom_peak_doy=295,    # Oct 22
                avg_bloom_end_doy=302,     # Oct 29
                historical_harvest_start_doy=340,  # Dec 6
                historical_harvest_end_doy=45,     # Feb 15
                historical_peak_start_doy=355,     # Dec 21
                historical_peak_end_doy=31,        # Jan 31
                avg_gdd_per_day_bloom_to_harvest=18.0,
                years_of_data=10,
                data_source="UF/IFAS Tropical Research"
            ),
            # Strawberry Festival - MID
            RegionalBloomData(
                cultivar_id="florida_festival",
                region_id="south_florida",
                avg_bloom_start_doy=288,   # Oct 15
                avg_bloom_peak_doy=295,    # Oct 22
                avg_bloom_end_doy=302,     # Oct 29
                historical_harvest_start_doy=349,  # Dec 15
                historical_harvest_end_doy=60,     # March 1
                historical_peak_start_doy=1,       # Jan 1
                historical_peak_end_doy=45,        # Feb 15
                avg_gdd_per_day_bloom_to_harvest=18.0,
                years_of_data=15,
                data_source="UF/IFAS Tropical Research"
            ),

            # =================================================================
            # CALIFORNIA COASTAL (Watsonville/Salinas) - Year-round production
            # Day-neutral/everbearing cultivars produce continuously
            # =================================================================
            # Albion - Day-neutral, year-round
            RegionalBloomData(
                cultivar_id="albion",
                region_id="california_coastal",
                avg_bloom_start_doy=60,    # March 1 (spring planting)
                avg_bloom_peak_doy=90,     # April 1
                avg_bloom_end_doy=120,     # May 1
                historical_harvest_start_doy=135,  # May 15
                historical_harvest_end_doy=305,    # Nov 1 (long season)
                historical_peak_start_doy=166,     # June 15
                historical_peak_end_doy=273,       # Sept 30
                avg_gdd_per_day_bloom_to_harvest=8.0,  # Cooler coastal CA
                years_of_data=18,
                data_source="UC Davis Strawberry Breeding Program"
            ),
            # Camarosa - Short-day, but productive in CA
            RegionalBloomData(
                cultivar_id="camarosa",
                region_id="california_coastal",
                avg_bloom_start_doy=32,    # Feb 1 (early planting)
                avg_bloom_peak_doy=60,     # March 1
                avg_bloom_end_doy=90,      # April 1
                historical_harvest_start_doy=105,  # April 15
                historical_harvest_end_doy=213,    # Aug 1
                historical_peak_start_doy=135,     # May 15
                historical_peak_end_doy=181,       # June 30
                avg_gdd_per_day_bloom_to_harvest=8.0,
                years_of_data=30,
                data_source="California Strawberry Commission"
            ),
        ]

        for data in regional_data:
            self.db.add_regional_data(data)
            result.regional_data_loaded += 1

        return result

    def load_strawberry_cultivars(self) -> DataLoadResult:
        """
        Load strawberry cultivar research data.

        Strawberries are non-climacteric - quality at harvest is quality at consumption.
        Key growing regions: California (Watsonville, Oxnard), Florida (Plant City)
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="albion",
                cultivar_name="Albion",
                crop_type="strawberry",
                research_peak_brix=11.0,
                research_avg_brix=9.5,
                research_brix_range=(8.0, 12.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=2006,
                days_to_maturity=90,  # From planting
                timing_class="day-neutral",  # Produces continuously
                optimal_usda_zones=["7a", "7b", "8a", "8b", "9a", "9b"],
                flavor_profile="Intense sweetness, firm texture, long-lasting flavor",
                best_use=["fresh"],
                research_sources=["UC Davis Strawberry Breeding Program"]
            ),
            CultivarResearch(
                cultivar_id="camarosa",
                cultivar_name="Camarosa",
                crop_type="strawberry",
                research_peak_brix=10.0,
                research_avg_brix=8.5,
                research_brix_range=(7.0, 11.0),
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.YIELD, BreedingFocus.SHIPPING],
                is_heritage=False,
                year_introduced=1992,
                days_to_maturity=85,
                timing_class="short-day",
                optimal_usda_zones=["8a", "8b", "9a", "9b", "10a"],
                flavor_profile="Balanced sweetness, firm, ships well",
                best_use=["fresh", "processing"],
                research_sources=["UC Davis", "Florida Strawberry Growers Association"]
            ),
            CultivarResearch(
                cultivar_id="chandler",
                cultivar_name="Chandler",
                crop_type="strawberry",
                research_peak_brix=10.5,
                research_avg_brix=9.0,
                research_brix_range=(7.5, 11.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,  # Classic variety
                year_introduced=1983,
                days_to_maturity=85,
                timing_class="short-day",
                optimal_usda_zones=["7b", "8a", "8b", "9a"],
                flavor_profile="Complex, classic strawberry flavor, softer texture",
                best_use=["fresh", "u-pick"],
                research_sources=["UC Davis Strawberry Breeding Program"]
            ),
            # === FLORIDA STRAWBERRY CULTIVARS (UF/IFAS) ===
            # Short-day varieties for Florida winter production (Plant City region)
            # Transplanted Sept-Oct, season runs Nov through April
            # Timing classes based on PEAK PRODUCTION period within the season:
            #   - early: peaks Nov-Dec (Thanksgiving/Christmas market)
            #   - early-mid: peaks Dec-Jan
            #   - mid: peaks Jan-Feb (main season)
            #   - mid-late: peaks Feb-Mar
            #   - late: peaks Mar-Apr (extends season)
            CultivarResearch(
                cultivar_id="florida_radiance",
                cultivar_name="Florida Radiance",
                crop_type="strawberry",
                research_peak_brix=9.5,
                research_avg_brix=8.0,
                research_brix_range=(6.5, 10.5),
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.YIELD, BreedingFocus.DISEASE_RESISTANCE],
                is_heritage=False,
                year_introduced=2009,
                days_to_maturity=60,  # From transplant to first harvest
                gdd_to_maturity=700,
                gdd_to_peak=850,
                gdd_base_temp=50.0,
                timing_class="early-mid",  # Peak Dec-Jan (starts early, extends to mid-season)
                optimal_usda_zones=["9a", "9b", "10a"],
                flavor_profile="Mild sweetness, firm, good color",
                best_use=["fresh", "shipping"],
                research_sources=["UF/IFAS Gulf Coast Research Center"]
            ),
            CultivarResearch(
                cultivar_id="florida_festival",
                cultivar_name="Strawberry Festival",
                crop_type="strawberry",
                research_peak_brix=10.0,
                research_avg_brix=8.5,
                research_brix_range=(7.0, 11.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=2000,
                days_to_maturity=65,
                gdd_to_maturity=750,
                gdd_to_peak=900,
                gdd_base_temp=50.0,
                timing_class="mid",  # Peak Jan-Feb (main season producer)
                optimal_usda_zones=["9a", "9b", "10a"],
                flavor_profile="Classic strawberry flavor, aromatic, excellent fresh eating",
                best_use=["fresh"],
                research_sources=["UF/IFAS - Florida's most planted cultivar 2000-2020"]
            ),
            CultivarResearch(
                cultivar_id="florida_sensation",
                cultivar_name="Sensation",
                crop_type="strawberry",
                research_peak_brix=11.0,
                research_avg_brix=9.0,
                research_brix_range=(7.5, 12.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=2017,
                days_to_maturity=70,
                gdd_to_maturity=800,
                gdd_to_peak=950,
                gdd_base_temp=50.0,
                timing_class="mid-late",  # Peak Feb-Mar (extends into late season)
                optimal_usda_zones=["9a", "9b", "10a"],
                flavor_profile="High sugar, excellent flavor, newer premium variety",
                best_use=["fresh"],
                research_sources=["UF/IFAS Gulf Coast Research Center"]
            ),
            CultivarResearch(
                cultivar_id="florida_brilliance",
                cultivar_name="Florida Brilliance",
                crop_type="strawberry",
                research_peak_brix=9.0,
                research_avg_brix=7.5,
                research_brix_range=(6.0, 10.0),
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.YIELD, BreedingFocus.DISEASE_RESISTANCE],
                is_heritage=False,
                year_introduced=2018,
                days_to_maturity=55,  # Very early
                gdd_to_maturity=650,
                gdd_to_peak=800,
                gdd_base_temp=50.0,
                timing_class="early",  # Peak Nov-Dec (Thanksgiving/Christmas market)
                optimal_usda_zones=["9a", "9b", "10a"],
                flavor_profile="Mild, firm, excellent shipping quality",
                best_use=["fresh", "shipping"],
                research_sources=["UF/IFAS - bred for early market window"]
            ),
            CultivarResearch(
                cultivar_id="winter_dawn",
                cultivar_name="Winter Dawn",
                crop_type="strawberry",
                research_peak_brix=10.5,
                research_avg_brix=8.5,
                research_brix_range=(7.0, 11.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=2005,
                days_to_maturity=75,
                gdd_to_maturity=850,
                gdd_to_peak=1000,
                gdd_base_temp=50.0,
                timing_class="late",  # Peak Mar-Apr (extends season to end)
                optimal_usda_zones=["9a", "9b", "10a"],
                flavor_profile="High sugar, aromatic, excellent late-season quality",
                best_use=["fresh"],
                research_sources=["UF/IFAS Gulf Coast Research Center"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    def load_tomato_cultivars(self) -> DataLoadResult:
        """
        Load tomato cultivar research data.

        Tomatoes are climacteric - can ripen post-harvest, but vine-ripened superior.
        This is where heritage varieties DRAMATICALLY outperform commodity.
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="brandywine",
                cultivar_name="Brandywine",
                crop_type="tomato",
                research_peak_brix=8.0,
                research_avg_brix=6.5,
                research_brix_range=(5.0, 9.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                is_heirloom=True,
                year_introduced=1885,
                days_to_maturity=85,
                timing_class="mid",
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b"],
                flavor_profile="Complex, rich, balanced acidity, classic beefsteak",
                best_use=["fresh", "slicing"],
                nutrition_highlights=["Higher antioxidants than modern varieties"],
                research_sources=["Seed Savers Exchange", "Academic heirloom studies"]
            ),
            CultivarResearch(
                cultivar_id="cherokee_purple",
                cultivar_name="Cherokee Purple",
                crop_type="tomato",
                research_peak_brix=7.5,
                research_avg_brix=6.0,
                research_brix_range=(5.0, 8.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.NUTRITION],
                is_heritage=True,
                is_heirloom=True,
                year_introduced=1890,  # Approximate
                days_to_maturity=80,
                timing_class="mid",
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Smoky, complex, wine-like notes",
                best_use=["fresh", "slicing"],
                nutrition_highlights=["High anthocyanins"],
                research_sources=["Cherokee heirloom preservation"]
            ),
            CultivarResearch(
                cultivar_id="roma",
                cultivar_name="Roma VF",
                crop_type="tomato",
                research_peak_brix=5.5,
                research_avg_brix=4.5,
                research_brix_range=(4.0, 6.0),
                quality_tier=QualityTier.COMMODITY,
                breeding_focus=[BreedingFocus.YIELD, BreedingFocus.DISEASE_RESISTANCE],
                is_heritage=False,
                year_introduced=1963,
                days_to_maturity=75,
                timing_class="mid",
                optimal_usda_zones=["4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b"],
                flavor_profile="Mild, meaty, low acid",
                best_use=["cooking", "canning", "sauce"],
                research_sources=["Commercial seed data"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    # === STONE FRUITS ===

    def load_peach_cultivars(self) -> DataLoadResult:
        """
        Load peach cultivar research data.

        Peaches are climacteric - can ripen post-harvest but tree-ripened superior.
        Key regions: Georgia, South Carolina, California Central Valley, Texas Hill Country
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="elberta",
                cultivar_name="Elberta",
                crop_type="peach",
                research_peak_brix=13.0,
                research_avg_brix=11.5,
                research_brix_range=(10.0, 14.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                is_heirloom=True,
                year_introduced=1870,
                days_to_maturity=98,
                gdd_to_maturity=1900,
                gdd_to_peak=2100,
                gdd_base_temp=45.0,
                timing_class="mid",
                min_chill_hours=850,
                recommended_rootstocks=["lovell", "nemaguard", "guardian"],
                optimal_usda_zones=["5b", "6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Classic freestone, rich honey-sweet flavor, aromatic",
                best_use=["fresh", "canning", "freezing"],
                research_sources=["University of Georgia Extension", "Historic variety data"]
            ),
            CultivarResearch(
                cultivar_id="redhaven",
                cultivar_name="Redhaven",
                crop_type="peach",
                research_peak_brix=12.5,
                research_avg_brix=11.0,
                research_brix_range=(9.5, 13.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.DISEASE_RESISTANCE],
                is_heritage=True,
                year_introduced=1940,
                days_to_maturity=78,
                gdd_to_maturity=1600,
                gdd_to_peak=1800,
                gdd_base_temp=45.0,
                timing_class="early",
                min_chill_hours=800,
                recommended_rootstocks=["lovell", "nemaguard"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Balanced sweet-tart, firm texture, classic peach",
                best_use=["fresh", "freezing"],
                research_sources=["Michigan State University", "Penn State Extension"]
            ),
            CultivarResearch(
                cultivar_id="georgia_belle",
                cultivar_name="Georgia Belle",
                crop_type="peach",
                research_peak_brix=14.0,
                research_avg_brix=12.0,
                research_brix_range=(10.5, 15.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                is_heirloom=True,
                year_introduced=1870,
                days_to_maturity=95,
                gdd_to_maturity=1850,
                gdd_to_peak=2050,
                gdd_base_temp=45.0,
                timing_class="mid",
                min_chill_hours=850,
                recommended_rootstocks=["lovell", "guardian"],
                optimal_usda_zones=["6a", "6b", "7a", "7b", "8a"],
                flavor_profile="White flesh, intensely sweet, low acid, aromatic",
                best_use=["fresh"],
                research_sources=["University of Georgia Historic Cultivars"]
            ),
            CultivarResearch(
                cultivar_id="ohhenry",
                cultivar_name="O'Henry",
                crop_type="peach",
                research_peak_brix=13.5,
                research_avg_brix=12.0,
                research_brix_range=(10.5, 14.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.SHIPPING],
                is_heritage=False,
                year_introduced=1970,
                days_to_maturity=105,
                gdd_to_maturity=2000,
                gdd_to_peak=2200,
                gdd_base_temp=45.0,
                timing_class="late",
                min_chill_hours=750,
                recommended_rootstocks=["nemaguard", "lovell"],
                optimal_usda_zones=["6b", "7a", "7b", "8a", "8b", "9a"],
                flavor_profile="Large freestone, rich complex flavor, firm",
                best_use=["fresh", "shipping"],
                research_sources=["UC Davis", "California Tree Fruit Agreement"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    def load_cherry_cultivars(self) -> DataLoadResult:
        """
        Load cherry cultivar research data.

        Cherries are non-climacteric - must ripen on tree.
        Key regions: Pacific Northwest (WA/OR), Michigan, California
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="bing",
                cultivar_name="Bing",
                crop_type="sweet_cherry",
                research_peak_brix=20.0,
                research_avg_brix=18.0,
                research_brix_range=(16.0, 22.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                year_introduced=1875,
                days_to_maturity=65,
                gdd_to_maturity=1400,
                gdd_to_peak=1550,
                gdd_base_temp=40.0,
                timing_class="mid",
                min_chill_hours=1100,
                recommended_rootstocks=["mazzard", "gisela_5", "gisela_6"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Deep red, intensely sweet, firm, classic cherry flavor",
                best_use=["fresh"],
                research_sources=["Washington State University", "Oregon State Extension"]
            ),
            CultivarResearch(
                cultivar_id="rainier",
                cultivar_name="Rainier",
                crop_type="sweet_cherry",
                research_peak_brix=21.0,
                research_avg_brix=19.0,
                research_brix_range=(17.0, 23.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1960,
                days_to_maturity=60,
                gdd_to_maturity=1350,
                gdd_to_peak=1500,
                gdd_base_temp=40.0,
                timing_class="mid",
                min_chill_hours=900,
                recommended_rootstocks=["mazzard", "gisela_5"],
                optimal_usda_zones=["5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Yellow with red blush, exceptionally sweet, delicate flavor",
                best_use=["fresh"],
                nutrition_highlights=["Lower anthocyanins but higher in other antioxidants"],
                research_sources=["Washington State University Breeding Program"]
            ),
            CultivarResearch(
                cultivar_id="montmorency",
                cultivar_name="Montmorency",
                crop_type="tart_cherry",
                research_peak_brix=14.0,
                research_avg_brix=12.0,
                research_brix_range=(10.0, 15.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.NUTRITION],
                is_heritage=True,
                year_introduced=1760,
                days_to_maturity=55,
                gdd_to_maturity=1200,
                gdd_to_peak=1350,
                gdd_base_temp=40.0,
                timing_class="mid",
                min_chill_hours=1000,
                recommended_rootstocks=["mahaleb", "mazzard"],
                optimal_usda_zones=["4a", "4b", "5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Bright red, tart-sweet balance, intense cherry flavor",
                best_use=["pies", "preserves", "juice", "drying"],
                nutrition_highlights=["High melatonin", "Anti-inflammatory compounds"],
                research_sources=["Michigan State University Tart Cherry Research"]
            ),
            CultivarResearch(
                cultivar_id="sweetheart",
                cultivar_name="Sweetheart",
                crop_type="sweet_cherry",
                research_peak_brix=19.0,
                research_avg_brix=17.0,
                research_brix_range=(15.0, 21.0),
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.SHIPPING, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=1990,
                days_to_maturity=75,
                gdd_to_maturity=1550,
                gdd_to_peak=1700,
                gdd_base_temp=40.0,
                timing_class="late",
                min_chill_hours=800,
                recommended_rootstocks=["gisela_5", "gisela_6"],
                optimal_usda_zones=["5b", "6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Self-fertile, extended season, good but not exceptional flavor",
                best_use=["fresh", "shipping"],
                research_sources=["Summerland Research Station, BC"]
            ),
            # === EXCEPTIONAL FLAVOR COMMERCIAL CULTIVARS ===
            CultivarResearch(
                cultivar_id="lapins",
                cultivar_name="Lapins",
                crop_type="sweet_cherry",
                research_peak_brix=21.0,
                research_avg_brix=19.0,
                research_brix_range=(17.0, 23.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1983,
                days_to_maturity=70,
                gdd_to_maturity=1450,
                gdd_to_peak=1600,
                gdd_base_temp=40.0,
                timing_class="mid-late",
                min_chill_hours=800,
                recommended_rootstocks=["gisela_5", "gisela_6", "mazzard"],
                optimal_usda_zones=["5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Self-fertile, sweeter than Bing, large firm fruit, exceptional flavor",
                best_use=["fresh"],
                research_sources=["Summerland Research Station BC - Stella x Van cross"]
            ),
            CultivarResearch(
                cultivar_id="regina",
                cultivar_name="Regina",
                crop_type="sweet_cherry",
                research_peak_brix=20.5,
                research_avg_brix=18.5,
                research_brix_range=(16.5, 22.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=1998,
                days_to_maturity=80,
                gdd_to_maturity=1650,
                gdd_to_peak=1800,
                gdd_base_temp=40.0,
                timing_class="late",
                min_chill_hours=900,
                recommended_rootstocks=["gisela_5", "gisela_6"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Very large, firm, excellent flavor, rain-crack resistant",
                best_use=["fresh", "premium market"],
                research_sources=["Jork Fruit Research Germany"]
            ),
            CultivarResearch(
                cultivar_id="skeena",
                cultivar_name="Skeena",
                crop_type="sweet_cherry",
                research_peak_brix=20.0,
                research_avg_brix=18.0,
                research_brix_range=(16.0, 22.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=2000,
                days_to_maturity=75,
                gdd_to_maturity=1550,
                gdd_to_peak=1700,
                gdd_base_temp=40.0,
                timing_class="late",
                min_chill_hours=850,
                recommended_rootstocks=["gisela_5", "gisela_6"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Self-fertile, large mahogany fruit, exceptional rich flavor",
                best_use=["fresh"],
                research_sources=["Summerland Research Station BC"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    # === POME FRUITS ===

    def load_apple_cultivars(self) -> DataLoadResult:
        """
        Load apple cultivar research data.

        Apples are climacteric - can store 6-12 months in CA storage.
        Key regions: Washington, New York, Michigan, Pennsylvania
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="honeycrisp",
                cultivar_name="Honeycrisp",
                crop_type="apple",
                research_peak_brix=14.5,
                research_avg_brix=13.0,
                research_brix_range=(11.5, 15.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1991,
                days_to_maturity=160,
                gdd_to_maturity=2300,
                gdd_to_peak=2500,
                gdd_base_temp=43.0,
                timing_class="mid",
                min_chill_hours=1000,
                recommended_rootstocks=["m9", "m26", "bud9"],
                optimal_usda_zones=["4a", "4b", "5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Explosive crunch, balanced sweet-tart, complex honey notes",
                best_use=["fresh"],
                research_sources=["University of Minnesota Breeding Program"]
            ),
            CultivarResearch(
                cultivar_id="fuji",
                cultivar_name="Fuji",
                crop_type="apple",
                research_peak_brix=16.0,
                research_avg_brix=14.5,
                research_brix_range=(13.0, 17.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1962,
                days_to_maturity=180,
                gdd_to_maturity=2600,
                gdd_to_peak=2850,
                gdd_base_temp=43.0,
                timing_class="late",
                min_chill_hours=800,
                recommended_rootstocks=["m9", "m26", "mm106"],
                optimal_usda_zones=["5b", "6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Very sweet, dense crisp texture, long storage",
                best_use=["fresh", "storage"],
                research_sources=["Tohoku Research Station, Japan", "Washington State"]
            ),
            CultivarResearch(
                cultivar_id="gala",
                cultivar_name="Gala",
                crop_type="apple",
                research_peak_brix=14.0,
                research_avg_brix=12.5,
                research_brix_range=(11.0, 15.0),
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=1965,
                days_to_maturity=140,
                gdd_to_maturity=2100,
                gdd_to_peak=2300,
                gdd_base_temp=43.0,
                timing_class="early",
                min_chill_hours=700,
                recommended_rootstocks=["m9", "m26", "mm106"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Mild sweet, aromatic, thin skin, good for kids",
                best_use=["fresh", "sauce"],
                research_sources=["New Zealand Apple & Pear Board"]
            ),
            CultivarResearch(
                cultivar_id="gravenstein",
                cultivar_name="Gravenstein",
                crop_type="apple",
                research_peak_brix=13.0,
                research_avg_brix=11.5,
                research_brix_range=(10.0, 14.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                is_heirloom=True,
                year_introduced=1669,
                days_to_maturity=120,
                gdd_to_maturity=1800,
                gdd_to_peak=2000,
                gdd_base_temp=43.0,
                timing_class="early",
                min_chill_hours=700,
                recommended_rootstocks=["mm106", "mm111"],
                optimal_usda_zones=["6a", "6b", "7a", "7b", "8a", "8b", "9a"],
                flavor_profile="Complex tart-sweet, aromatic, best cooking apple",
                best_use=["sauce", "pies", "cider", "fresh"],
                research_sources=["Slow Food Ark of Taste", "Historic variety records"]
            ),
            CultivarResearch(
                cultivar_id="pink_lady",
                cultivar_name="Pink Lady (Cripps Pink)",
                crop_type="apple",
                research_peak_brix=15.0,
                research_avg_brix=13.5,
                research_brix_range=(12.0, 16.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.SHIPPING],
                is_heritage=False,
                year_introduced=1973,
                days_to_maturity=200,
                gdd_to_maturity=2900,
                gdd_to_peak=3150,
                gdd_base_temp=43.0,
                timing_class="late",
                min_chill_hours=600,
                recommended_rootstocks=["m9", "m26"],
                optimal_usda_zones=["6b", "7a", "7b", "8a", "8b", "9a"],
                flavor_profile="Tart-sweet balance, effervescent, crisp, long storage",
                best_use=["fresh", "salads"],
                research_sources=["Western Australia Dept of Agriculture"]
            ),
            # === EXCEPTIONAL FLAVOR COMMERCIAL CULTIVARS ===
            CultivarResearch(
                cultivar_id="cosmic_crisp",
                cultivar_name="Cosmic Crisp",
                crop_type="apple",
                research_peak_brix=15.0,
                research_avg_brix=13.5,
                research_brix_range=(12.0, 16.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.SHIPPING],
                is_heritage=False,
                year_introduced=2019,
                days_to_maturity=175,
                gdd_to_maturity=2500,
                gdd_to_peak=2750,
                gdd_base_temp=43.0,
                timing_class="mid-late",
                min_chill_hours=800,
                recommended_rootstocks=["m9", "g41"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Explosive crunch, high sugar, slow browning, stores 12+ months",
                best_use=["fresh", "storage"],
                research_sources=["Washington State University - Honeycrisp x Enterprise cross"]
            ),
            CultivarResearch(
                cultivar_id="sweetango",
                cultivar_name="SweeTango",
                crop_type="apple",
                research_peak_brix=14.5,
                research_avg_brix=13.0,
                research_brix_range=(11.5, 15.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=2009,
                days_to_maturity=130,
                gdd_to_maturity=1950,
                gdd_to_peak=2150,
                gdd_base_temp=43.0,
                timing_class="early",
                min_chill_hours=900,
                recommended_rootstocks=["m9", "bud9"],
                optimal_usda_zones=["4a", "4b", "5a", "5b", "6a"],
                flavor_profile="Honeycrisp x Zestar cross, explosive crunch, honey-spice notes",
                best_use=["fresh"],
                research_sources=["University of Minnesota - limited licensing"]
            ),
            CultivarResearch(
                cultivar_id="envy",
                cultivar_name="Envy",
                crop_type="apple",
                research_peak_brix=15.5,
                research_avg_brix=14.0,
                research_brix_range=(12.5, 16.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.SHIPPING],
                is_heritage=False,
                year_introduced=2008,
                days_to_maturity=180,
                gdd_to_maturity=2600,
                gdd_to_peak=2850,
                gdd_base_temp=43.0,
                timing_class="late",
                min_chill_hours=700,
                recommended_rootstocks=["m9", "m26"],
                optimal_usda_zones=["6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Braeburn x Royal Gala cross, sweet-tart, dense crisp, slow browning",
                best_use=["fresh", "salads"],
                research_sources=["Plant & Food Research New Zealand"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    def load_pear_cultivars(self) -> DataLoadResult:
        """
        Load pear cultivar research data.

        Pears are UNIQUE: climacteric but MUST ripen OFF the tree.
        Pick at maturity, ripen at room temp for 2-5 days.
        Key regions: Pacific Northwest (OR/WA), California
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="bartlett",
                cultivar_name="Bartlett (Williams)",
                crop_type="pear",
                research_peak_brix=14.0,
                research_avg_brix=12.5,
                research_brix_range=(11.0, 15.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                year_introduced=1770,
                days_to_maturity=115,
                gdd_to_maturity=1800,
                gdd_to_peak=2000,
                gdd_base_temp=40.0,
                timing_class="early",
                min_chill_hours=800,
                recommended_rootstocks=["ohxf_97", "ohxf_333", "bartlett_seedling"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Classic pear flavor, buttery smooth, aromatic",
                best_use=["fresh", "canning"],
                research_sources=["Oregon State University", "USA Pears"]
            ),
            CultivarResearch(
                cultivar_id="danjou",
                cultivar_name="D'Anjou",
                crop_type="pear",
                research_peak_brix=13.5,
                research_avg_brix=12.0,
                research_brix_range=(10.5, 14.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.SHIPPING],
                is_heritage=True,
                year_introduced=1800,
                days_to_maturity=130,
                gdd_to_maturity=1950,
                gdd_to_peak=2150,
                gdd_base_temp=40.0,
                timing_class="mid",
                min_chill_hours=800,
                recommended_rootstocks=["ohxf_97", "ohxf_333"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Subtle sweet, citrus hints, dense firm texture",
                best_use=["fresh", "cooking", "storage"],
                research_sources=["Washington State University", "Harry & David research"]
            ),
            CultivarResearch(
                cultivar_id="bosc",
                cultivar_name="Bosc",
                crop_type="pear",
                research_peak_brix=14.5,
                research_avg_brix=13.0,
                research_brix_range=(11.5, 15.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                year_introduced=1807,
                days_to_maturity=140,
                gdd_to_maturity=2050,
                gdd_to_peak=2250,
                gdd_base_temp=40.0,
                timing_class="mid",
                min_chill_hours=800,
                recommended_rootstocks=["ohxf_97", "ohxf_333"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Honey-sweet, dense crisp, woodsy spice notes",
                best_use=["fresh", "baking", "poaching"],
                research_sources=["Oregon State Pear Research"]
            ),
            CultivarResearch(
                cultivar_id="comice",
                cultivar_name="Comice",
                crop_type="pear",
                research_peak_brix=15.5,
                research_avg_brix=14.0,
                research_brix_range=(12.5, 16.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                year_introduced=1849,
                days_to_maturity=150,
                gdd_to_maturity=2150,
                gdd_to_peak=2350,
                gdd_base_temp=40.0,
                timing_class="late",
                min_chill_hours=600,
                recommended_rootstocks=["ohxf_97"],
                optimal_usda_zones=["6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Most buttery and sweet, melting texture, 'Christmas pear'",
                best_use=["fresh", "gift boxes"],
                research_sources=["Harry & David", "USA Pears premium variety research"]
            ),
            # === EXCEPTIONAL FLAVOR COMMERCIAL CULTIVARS ===
            CultivarResearch(
                cultivar_id="seckel",
                cultivar_name="Seckel",
                crop_type="pear",
                research_peak_brix=17.0,
                research_avg_brix=15.5,
                research_brix_range=(14.0, 18.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                is_heirloom=True,
                year_introduced=1790,
                days_to_maturity=140,
                gdd_to_maturity=2000,
                gdd_to_peak=2200,
                gdd_base_temp=40.0,
                timing_class="mid",
                min_chill_hours=800,
                recommended_rootstocks=["ohxf_97", "ohxf_333"],
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b"],
                flavor_profile="'Sugar pear' - sweetest of all pears, honey-like, spicy notes",
                best_use=["fresh", "preserves", "garnish"],
                research_sources=["American heirloom variety", "USA Pears"]
            ),
            CultivarResearch(
                cultivar_id="concorde",
                cultivar_name="Concorde",
                crop_type="pear",
                research_peak_brix=15.0,
                research_avg_brix=13.5,
                research_brix_range=(12.0, 16.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1977,
                days_to_maturity=145,
                gdd_to_maturity=2100,
                gdd_to_peak=2300,
                gdd_base_temp=40.0,
                timing_class="mid-late",
                min_chill_hours=650,
                recommended_rootstocks=["ohxf_97"],
                optimal_usda_zones=["6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Comice x Conference cross, vanilla notes, less grit, long storage",
                best_use=["fresh", "storage"],
                research_sources=["East Malling Research UK", "USA Pears specialty program"]
            ),
            CultivarResearch(
                cultivar_id="starkrimson",
                cultivar_name="Starkrimson",
                crop_type="pear",
                research_peak_brix=14.5,
                research_avg_brix=13.0,
                research_brix_range=(11.5, 15.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.APPEARANCE],
                is_heritage=False,
                year_introduced=1956,
                days_to_maturity=125,
                gdd_to_maturity=1800,
                gdd_to_peak=2000,
                gdd_base_temp=40.0,
                timing_class="early",
                min_chill_hours=700,
                recommended_rootstocks=["ohxf_97"],
                optimal_usda_zones=["5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Brilliant red color, aromatic, floral notes, tender flesh",
                best_use=["fresh", "display"],
                research_sources=["Stark Brothers Nurseries", "Red-skinned sport of Clapp's Favorite"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    # === TROPICAL/SUBTROPICAL ===

    def load_mango_cultivars(self) -> DataLoadResult:
        """
        Load mango cultivar research data.

        Mangoes are climacteric tropical - can ripen post-harvest.
        US production limited to South Florida, some California/Arizona.
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="tommy_atkins",
                cultivar_name="Tommy Atkins",
                crop_type="mango",
                research_peak_brix=15.0,
                research_avg_brix=13.0,
                research_brix_range=(11.0, 16.0),
                quality_tier=QualityTier.COMMODITY,
                breeding_focus=[BreedingFocus.SHIPPING, BreedingFocus.APPEARANCE],
                is_heritage=False,
                year_introduced=1940,
                days_to_maturity=120,
                gdd_to_maturity=2800,
                gdd_to_peak=3100,
                gdd_base_temp=60.0,
                timing_class="mid",
                optimal_usda_zones=["10a", "10b", "11a"],
                flavor_profile="Mild, fibrous, bred for shipping not flavor",
                best_use=["fresh", "shipping"],
                research_sources=["UF/IFAS Tropical Research", "USDA-ARS Miami"]
            ),
            CultivarResearch(
                cultivar_id="kent",
                cultivar_name="Kent",
                crop_type="mango",
                research_peak_brix=18.0,
                research_avg_brix=16.0,
                research_brix_range=(14.0, 20.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1944,
                days_to_maturity=130,
                gdd_to_maturity=3000,
                gdd_to_peak=3300,
                gdd_base_temp=60.0,
                timing_class="late",
                optimal_usda_zones=["10a", "10b", "11a"],
                flavor_profile="Rich, sweet, minimal fiber, excellent flavor",
                best_use=["fresh"],
                research_sources=["UF/IFAS Tropical Research"]
            ),
            CultivarResearch(
                cultivar_id="alphonso",
                cultivar_name="Alphonso",
                crop_type="mango",
                research_peak_brix=21.0,
                research_avg_brix=19.0,
                research_brix_range=(17.0, 23.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                year_introduced=1500,  # Approximate, ancient Indian variety
                days_to_maturity=100,
                gdd_to_maturity=2600,
                gdd_to_peak=2900,
                gdd_base_temp=60.0,
                timing_class="early",
                optimal_usda_zones=["10b", "11a"],
                flavor_profile="King of mangoes - intense sweetness, creamy, aromatic",
                best_use=["fresh"],
                research_sources=["Rare Fruit Council", "Indian horticulture research"]
            ),
            CultivarResearch(
                cultivar_id="haden",
                cultivar_name="Haden",
                crop_type="mango",
                research_peak_brix=17.0,
                research_avg_brix=15.0,
                research_brix_range=(13.0, 19.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                year_introduced=1910,
                days_to_maturity=110,
                gdd_to_maturity=2700,
                gdd_to_peak=3000,
                gdd_base_temp=60.0,
                timing_class="early",
                optimal_usda_zones=["10a", "10b", "11a"],
                flavor_profile="Rich, spicy-sweet, aromatic, beautiful color",
                best_use=["fresh"],
                research_sources=["UF/IFAS Tropical Research", "Florida mango history"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    def load_pomegranate_cultivars(self) -> DataLoadResult:
        """
        Load pomegranate cultivar research data.

        Pomegranates are non-climacteric - must ripen on tree.
        Key region: California Central Valley
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="wonderful",
                cultivar_name="Wonderful",
                crop_type="pomegranate",
                research_peak_brix=17.0,
                research_avg_brix=15.5,
                research_brix_range=(14.0, 18.0),
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.YIELD, BreedingFocus.SHIPPING],
                is_heritage=False,
                year_introduced=1896,
                days_to_maturity=180,
                gdd_to_maturity=2400,
                gdd_to_peak=2700,
                gdd_base_temp=50.0,
                timing_class="mid",
                min_chill_hours=200,
                optimal_usda_zones=["7b", "8a", "8b", "9a", "9b", "10a"],
                flavor_profile="Sweet-tart, deep red, commercial standard",
                best_use=["fresh", "juice"],
                nutrition_highlights=["High antioxidants", "Punicalagins"],
                research_sources=["UC Davis Pomology", "POM Wonderful research"]
            ),
            CultivarResearch(
                cultivar_id="parfianka",
                cultivar_name="Parfianka",
                crop_type="pomegranate",
                research_peak_brix=18.5,
                research_avg_brix=17.0,
                research_brix_range=(15.5, 20.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=True,
                year_introduced=1800,  # Turkmenistan origin
                days_to_maturity=170,
                gdd_to_maturity=2300,
                gdd_to_peak=2600,
                gdd_base_temp=50.0,
                timing_class="early",
                min_chill_hours=150,
                optimal_usda_zones=["8a", "8b", "9a", "9b", "10a"],
                flavor_profile="Exceptionally sweet, soft seeds, complex wine notes",
                best_use=["fresh"],
                research_sources=["UC Davis Wolfskill collection", "Rare fruit enthusiasts"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    # === NUTS ===

    def load_pecan_cultivars(self) -> DataLoadResult:
        """
        Load pecan cultivar research data.

        Pecans measure quality by oil content (65-75%) not Brix.
        Key regions: Georgia, Texas, New Mexico
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="desirable",
                cultivar_name="Desirable",
                crop_type="pecan",
                research_peak_brix=None,  # Nuts don't use Brix
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=1930,
                days_to_maturity=190,
                gdd_to_maturity=2600,
                gdd_to_peak=2850,
                gdd_base_temp=65.0,
                timing_class="mid",
                min_chill_hours=600,
                optimal_usda_zones=["7a", "7b", "8a", "8b", "9a"],
                flavor_profile="Rich, buttery, excellent quality, good fill",
                best_use=["fresh", "baking", "snacking"],
                research_sources=["University of Georgia Pecan Research", "Texas A&M"]
            ),
            CultivarResearch(
                cultivar_id="pawnee",
                cultivar_name="Pawnee",
                crop_type="pecan",
                research_peak_brix=None,
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1984,
                days_to_maturity=160,
                gdd_to_maturity=2300,
                gdd_to_peak=2550,
                gdd_base_temp=65.0,
                timing_class="early",
                min_chill_hours=500,
                optimal_usda_zones=["6b", "7a", "7b", "8a", "8b", "9a"],
                flavor_profile="Early maturing, excellent flavor, large nuts",
                best_use=["fresh", "baking"],
                research_sources=["USDA Pecan Breeding Program", "Oklahoma State"]
            ),
            CultivarResearch(
                cultivar_id="stuart",
                cultivar_name="Stuart",
                crop_type="pecan",
                research_peak_brix=None,
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.YIELD],
                is_heritage=True,
                year_introduced=1886,
                days_to_maturity=200,
                gdd_to_maturity=2750,
                gdd_to_peak=3000,
                gdd_base_temp=65.0,
                timing_class="late",
                min_chill_hours=600,
                optimal_usda_zones=["7b", "8a", "8b", "9a"],
                flavor_profile="Reliable producer, good flavor, classic variety",
                best_use=["fresh", "commercial"],
                research_sources=["Historic pecan variety records", "Auburn University"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    # === BERRIES ===

    def load_blueberry_cultivars(self) -> DataLoadResult:
        """
        Load blueberry cultivar research data.

        Blueberries are non-climacteric - must ripen on bush.
        Key regions: Michigan, Florida, Georgia, New Jersey, Pacific NW
        Different types: Northern Highbush, Southern Highbush, Rabbiteye
        """
        result = DataLoadResult()

        cultivars = [
            CultivarResearch(
                cultivar_id="duke",
                cultivar_name="Duke",
                crop_type="blueberry",
                research_peak_brix=14.0,
                research_avg_brix=12.5,
                research_brix_range=(11.0, 15.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=1987,
                days_to_maturity=60,  # From bloom
                gdd_to_maturity=1100,
                gdd_to_peak=1250,
                gdd_base_temp=45.0,
                timing_class="early",
                min_chill_hours=1000,
                optimal_usda_zones=["4a", "4b", "5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Mild sweet, firm, excellent post-harvest quality",
                best_use=["fresh", "processing"],
                research_sources=["USDA-ARS Chatsworth NJ", "Michigan State University"]
            ),
            CultivarResearch(
                cultivar_id="emerald",
                cultivar_name="Emerald",
                crop_type="blueberry",
                research_peak_brix=13.5,
                research_avg_brix=12.0,
                research_brix_range=(10.5, 14.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1999,
                days_to_maturity=55,
                gdd_to_maturity=1000,
                gdd_to_peak=1150,
                gdd_base_temp=45.0,
                timing_class="early",
                min_chill_hours=250,  # Southern Highbush - low chill
                optimal_usda_zones=["8a", "8b", "9a", "9b", "10a"],
                flavor_profile="Large berries, excellent sweet flavor, southern adapted",
                best_use=["fresh"],
                research_sources=["UF/IFAS Blueberry Breeding Program"]
            ),
            CultivarResearch(
                cultivar_id="jewel",
                cultivar_name="Jewel",
                crop_type="blueberry",
                research_peak_brix=14.5,
                research_avg_brix=13.0,
                research_brix_range=(11.5, 15.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=1998,
                days_to_maturity=60,
                gdd_to_maturity=1050,
                gdd_to_peak=1200,
                gdd_base_temp=45.0,
                timing_class="early",
                min_chill_hours=200,  # Very low chill
                optimal_usda_zones=["8a", "8b", "9a", "9b", "10a"],
                flavor_profile="Very sweet, aromatic, excellent fresh eating",
                best_use=["fresh", "u-pick"],
                research_sources=["UF/IFAS Blueberry Breeding Program"]
            ),
            CultivarResearch(
                cultivar_id="bluecrop",
                cultivar_name="Bluecrop",
                crop_type="blueberry",
                research_peak_brix=12.5,
                research_avg_brix=11.0,
                research_brix_range=(9.5, 13.5),
                quality_tier=QualityTier.STANDARD,
                breeding_focus=[BreedingFocus.YIELD, BreedingFocus.DISEASE_RESISTANCE],
                is_heritage=True,
                year_introduced=1952,
                days_to_maturity=65,
                gdd_to_maturity=1150,
                gdd_to_peak=1300,
                gdd_base_temp=45.0,
                timing_class="mid",
                min_chill_hours=1000,
                optimal_usda_zones=["4a", "4b", "5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Industry standard, reliable, good but not exceptional flavor",
                best_use=["fresh", "processing", "freezing"],
                research_sources=["USDA-ARS historic releases", "Commercial standard"]
            ),
            # === EXCEPTIONAL FLAVOR COMMERCIAL BLUEBERRIES ===
            CultivarResearch(
                cultivar_id="chandler",
                cultivar_name="Chandler",
                crop_type="blueberry",
                research_peak_brix=16.0,
                research_avg_brix=14.0,
                research_brix_range=(12.5, 17.0),
                quality_tier=QualityTier.ARTISAN,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1994,
                days_to_maturity=70,
                gdd_to_maturity=1200,
                gdd_to_peak=1350,
                gdd_base_temp=45.0,
                timing_class="mid-late",
                min_chill_hours=1000,
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b"],
                flavor_profile="Exceptionally sweet, largest berries, complex fruit flavors",
                best_use=["fresh", "premium markets", "u-pick"],
                research_sources=["USDA-ARS", "NC State University"]
            ),
            CultivarResearch(
                cultivar_id="legacy",
                cultivar_name="Legacy",
                crop_type="blueberry",
                research_peak_brix=15.5,
                research_avg_brix=13.5,
                research_brix_range=(12.0, 16.5),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR, BreedingFocus.YIELD],
                is_heritage=False,
                year_introduced=1993,
                days_to_maturity=75,
                gdd_to_maturity=1250,
                gdd_to_peak=1400,
                gdd_base_temp=45.0,
                timing_class="mid-late",
                min_chill_hours=800,
                optimal_usda_zones=["5a", "5b", "6a", "6b", "7a", "7b", "8a"],
                flavor_profile="Rich aromatic flavor, outstanding sweetness, intense blueberry taste",
                best_use=["fresh", "premium retail"],
                research_sources=["USDA-ARS Beltsville", "Rutgers University"]
            ),
            CultivarResearch(
                cultivar_id="toro",
                cultivar_name="Toro",
                crop_type="blueberry",
                research_peak_brix=15.0,
                research_avg_brix=13.0,
                research_brix_range=(11.5, 16.0),
                quality_tier=QualityTier.PREMIUM,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=1987,
                days_to_maturity=65,
                gdd_to_maturity=1100,
                gdd_to_peak=1250,
                gdd_base_temp=45.0,
                timing_class="mid",
                min_chill_hours=1000,
                optimal_usda_zones=["4a", "4b", "5a", "5b", "6a", "6b", "7a"],
                flavor_profile="Excellent sweet-tart balance, firm texture, aromatic",
                best_use=["fresh", "u-pick", "farmers markets"],
                research_sources=["USDA-ARS Chatsworth NJ"]
            ),
            CultivarResearch(
                cultivar_id="sweetcrisp",
                cultivar_name="Sweetcrisp",
                crop_type="blueberry",
                research_peak_brix=16.5,
                research_avg_brix=14.5,
                research_brix_range=(13.0, 18.0),
                quality_tier=QualityTier.ARTISAN,
                breeding_focus=[BreedingFocus.FLAVOR],
                is_heritage=False,
                year_introduced=2009,
                days_to_maturity=55,
                gdd_to_maturity=950,
                gdd_to_peak=1100,
                gdd_base_temp=45.0,
                timing_class="early",
                min_chill_hours=300,  # Southern Highbush - low chill
                optimal_usda_zones=["7a", "7b", "8a", "8b", "9a"],
                flavor_profile="Extraordinarily sweet, crunchy texture, highest sugar of southern types",
                best_use=["fresh", "premium snacking"],
                research_sources=["UF/IFAS Blueberry Breeding Program"]
            ),
        ]

        for cultivar in cultivars:
            self.db.add_cultivar(cultivar)
            result.cultivars_loaded += 1

        return result

    # === ROOTSTOCKS ===

    def load_peach_rootstocks(self) -> DataLoadResult:
        """Load peach rootstock research data."""
        result = DataLoadResult()

        rootstocks = [
            RootstockResearch(
                rootstock_id="lovell",
                rootstock_name="Lovell",
                crop_types=["peach", "nectarine"],
                brix_modifier=0.0,  # Standard/neutral
                vigor="vigorous",
                yield_effect="high",
                disease_resistance={
                    "bacterial_canker": "moderate",
                    "oak_root_fungus": "susceptible"
                },
                cold_hardy_to_f=-10,
                notes="Industry standard seedling rootstock, good anchorage",
                research_sources=["UC Davis Pomology", "Penn State Extension"]
            ),
            RootstockResearch(
                rootstock_id="nemaguard",
                rootstock_name="Nemaguard",
                crop_types=["peach", "nectarine", "plum"],
                brix_modifier=0.0,
                vigor="vigorous",
                yield_effect="high",
                disease_resistance={
                    "root_knot_nematode": "resistant",
                    "bacterial_canker": "susceptible"
                },
                cold_hardy_to_f=5,
                notes="Best for sandy soils with nematode pressure",
                research_sources=["USDA-ARS Fresno"]
            ),
            RootstockResearch(
                rootstock_id="guardian",
                rootstock_name="Guardian",
                crop_types=["peach", "nectarine"],
                brix_modifier=0.2,  # Slight quality boost
                vigor="medium",
                yield_effect="neutral",
                disease_resistance={
                    "peach_tree_short_life": "resistant",
                    "bacterial_canker": "tolerant",
                    "ring_nematode": "resistant"
                },
                cold_hardy_to_f=-5,
                notes="Developed for Southeast US, tolerates replant situations",
                research_sources=["Clemson University", "Byron, GA USDA-ARS"]
            ),
        ]

        for rootstock in rootstocks:
            self.db.add_rootstock(rootstock)
            result.rootstocks_loaded += 1

        return result

    def load_apple_rootstocks(self) -> DataLoadResult:
        """Load apple rootstock research data."""
        result = DataLoadResult()

        rootstocks = [
            RootstockResearch(
                rootstock_id="m9",
                rootstock_name="M.9 (Malling 9)",
                crop_types=["apple"],
                brix_modifier=0.5,  # Quality improvement
                vigor="dwarfing",
                yield_effect="high",  # Per tree efficiency
                disease_resistance={
                    "fire_blight": "susceptible",
                    "collar_rot": "susceptible"
                },
                cold_hardy_to_f=-10,
                notes="Most common dwarfing stock, requires support, early bearing",
                research_sources=["East Malling Research Station", "Cornell University"]
            ),
            RootstockResearch(
                rootstock_id="m26",
                rootstock_name="M.26 (Malling 26)",
                crop_types=["apple"],
                brix_modifier=0.3,
                vigor="semi-dwarfing",
                yield_effect="high",
                disease_resistance={
                    "fire_blight": "susceptible",
                    "collar_rot": "moderate"
                },
                cold_hardy_to_f=-15,
                notes="Good for home orchards, moderate support needed",
                research_sources=["East Malling Research Station"]
            ),
            RootstockResearch(
                rootstock_id="mm106",
                rootstock_name="MM.106 (Malling-Merton 106)",
                crop_types=["apple"],
                brix_modifier=0.1,
                vigor="semi-vigorous",
                yield_effect="neutral",
                disease_resistance={
                    "collar_rot": "susceptible",
                    "fire_blight": "moderate"
                },
                cold_hardy_to_f=-20,
                notes="Good for well-drained soils, free-standing",
                research_sources=["East Malling/John Innes"]
            ),
            RootstockResearch(
                rootstock_id="bud9",
                rootstock_name="Bud.9 (Budagovsky 9)",
                crop_types=["apple"],
                brix_modifier=0.4,
                vigor="dwarfing",
                yield_effect="high",
                disease_resistance={
                    "fire_blight": "moderate",
                    "collar_rot": "good"
                },
                cold_hardy_to_f=-40,
                notes="Extremely cold hardy, developed in Russia",
                research_sources=["Budagovsky Institute", "Cornell cold climate trials"]
            ),
        ]

        for rootstock in rootstocks:
            self.db.add_rootstock(rootstock)
            result.rootstocks_loaded += 1

        return result

    def load_pear_rootstocks(self) -> DataLoadResult:
        """Load pear rootstock research data."""
        result = DataLoadResult()

        rootstocks = [
            RootstockResearch(
                rootstock_id="ohxf_97",
                rootstock_name="OHxF 97 (Old Home x Farmingdale)",
                crop_types=["pear"],
                brix_modifier=0.3,
                vigor="semi-dwarf",
                yield_effect="high",
                disease_resistance={
                    "fire_blight": "resistant",
                    "pear_decline": "tolerant"
                },
                cold_hardy_to_f=-25,
                notes="Most popular commercial rootstock, excellent fire blight resistance",
                research_sources=["Oregon State University", "USDA-ARS Kearneysville"]
            ),
            RootstockResearch(
                rootstock_id="ohxf_333",
                rootstock_name="OHxF 333",
                crop_types=["pear"],
                brix_modifier=0.1,
                vigor="vigorous",
                yield_effect="neutral",
                disease_resistance={
                    "fire_blight": "resistant",
                    "pear_decline": "tolerant"
                },
                cold_hardy_to_f=-25,
                notes="For standard trees, good anchorage",
                research_sources=["Oregon State University"]
            ),
            RootstockResearch(
                rootstock_id="bartlett_seedling",
                rootstock_name="Bartlett Seedling",
                crop_types=["pear"],
                brix_modifier=0.0,
                vigor="vigorous",
                yield_effect="neutral",
                disease_resistance={
                    "fire_blight": "susceptible",
                    "pear_decline": "susceptible"
                },
                cold_hardy_to_f=-20,
                notes="Traditional rootstock, being replaced by OHxF series",
                research_sources=["Historic pear production records"]
            ),
        ]

        for rootstock in rootstocks:
            self.db.add_rootstock(rootstock)
            result.rootstocks_loaded += 1

        return result

    def load_cherry_rootstocks(self) -> DataLoadResult:
        """Load cherry rootstock research data."""
        result = DataLoadResult()

        rootstocks = [
            RootstockResearch(
                rootstock_id="mazzard",
                rootstock_name="Mazzard (P. avium seedling)",
                crop_types=["sweet_cherry"],
                brix_modifier=0.0,
                vigor="vigorous",
                yield_effect="neutral",
                disease_resistance={
                    "bacterial_canker": "moderate",
                    "phytophthora": "moderate"
                },
                cold_hardy_to_f=-25,
                notes="Standard rootstock, large trees, deep rooted",
                research_sources=["Washington State University", "Traditional cherry culture"]
            ),
            RootstockResearch(
                rootstock_id="gisela_5",
                rootstock_name="Gisela 5",
                crop_types=["sweet_cherry"],
                brix_modifier=0.4,  # Quality improvement
                vigor="semi-dwarfing",
                yield_effect="high",
                disease_resistance={
                    "bacterial_canker": "moderate",
                    "cherry_leaf_spot": "moderate"
                },
                cold_hardy_to_f=-20,
                notes="50% size reduction, early bearing, may need irrigation",
                research_sources=["Giessen University Germany", "WSU trials"]
            ),
            RootstockResearch(
                rootstock_id="gisela_6",
                rootstock_name="Gisela 6",
                crop_types=["sweet_cherry"],
                brix_modifier=0.3,
                vigor="semi-vigorous",
                yield_effect="high",
                disease_resistance={
                    "bacterial_canker": "moderate",
                    "phytophthora": "moderate"
                },
                cold_hardy_to_f=-20,
                notes="70% size of Mazzard, good balance of size and precocity",
                research_sources=["Giessen University Germany", "WSU trials"]
            ),
            RootstockResearch(
                rootstock_id="mahaleb",
                rootstock_name="Mahaleb",
                crop_types=["tart_cherry", "sweet_cherry"],
                brix_modifier=0.0,
                vigor="medium",
                yield_effect="neutral",
                disease_resistance={
                    "bacterial_canker": "susceptible",
                    "drought": "tolerant"
                },
                cold_hardy_to_f=-25,
                drought_tolerant=True,
                notes="Prefers well-drained soil, traditional tart cherry stock",
                research_sources=["Michigan State University"]
            ),
        ]

        for rootstock in rootstocks:
            self.db.add_rootstock(rootstock)
            result.rootstocks_loaded += 1

        return result

    def load_all(self) -> DataLoadResult:
        """Load all available data."""
        combined = DataLoadResult()

        # Citrus
        citrus_result = self.load_citrus_cultivars()
        combined.cultivars_loaded += citrus_result.cultivars_loaded
        combined.errors.extend(citrus_result.errors)

        rootstock_result = self.load_citrus_rootstocks()
        combined.rootstocks_loaded += rootstock_result.rootstocks_loaded
        combined.errors.extend(rootstock_result.errors)

        regional_result = self.load_florida_regional_data()
        combined.regional_data_loaded += regional_result.regional_data_loaded
        combined.errors.extend(regional_result.errors)

        # Stone fruits
        peach_result = self.load_peach_cultivars()
        combined.cultivars_loaded += peach_result.cultivars_loaded
        combined.errors.extend(peach_result.errors)

        cherry_result = self.load_cherry_cultivars()
        combined.cultivars_loaded += cherry_result.cultivars_loaded
        combined.errors.extend(cherry_result.errors)

        # Pome fruits
        apple_result = self.load_apple_cultivars()
        combined.cultivars_loaded += apple_result.cultivars_loaded
        combined.errors.extend(apple_result.errors)

        pear_result = self.load_pear_cultivars()
        combined.cultivars_loaded += pear_result.cultivars_loaded
        combined.errors.extend(pear_result.errors)

        # Tropical
        mango_result = self.load_mango_cultivars()
        combined.cultivars_loaded += mango_result.cultivars_loaded
        combined.errors.extend(mango_result.errors)

        pomegranate_result = self.load_pomegranate_cultivars()
        combined.cultivars_loaded += pomegranate_result.cultivars_loaded
        combined.errors.extend(pomegranate_result.errors)

        # Nuts
        pecan_result = self.load_pecan_cultivars()
        combined.cultivars_loaded += pecan_result.cultivars_loaded
        combined.errors.extend(pecan_result.errors)

        # Berries
        strawberry_result = self.load_strawberry_cultivars()
        combined.cultivars_loaded += strawberry_result.cultivars_loaded
        combined.errors.extend(strawberry_result.errors)

        strawberry_regional = self.load_strawberry_regional_data()
        combined.regional_data_loaded += strawberry_regional.regional_data_loaded
        combined.errors.extend(strawberry_regional.errors)

        blueberry_result = self.load_blueberry_cultivars()
        combined.cultivars_loaded += blueberry_result.cultivars_loaded
        combined.errors.extend(blueberry_result.errors)

        tomato_result = self.load_tomato_cultivars()
        combined.cultivars_loaded += tomato_result.cultivars_loaded
        combined.errors.extend(tomato_result.errors)

        # Rootstocks
        peach_rs_result = self.load_peach_rootstocks()
        combined.rootstocks_loaded += peach_rs_result.rootstocks_loaded
        combined.errors.extend(peach_rs_result.errors)

        apple_rs_result = self.load_apple_rootstocks()
        combined.rootstocks_loaded += apple_rs_result.rootstocks_loaded
        combined.errors.extend(apple_rs_result.errors)

        pear_rs_result = self.load_pear_rootstocks()
        combined.rootstocks_loaded += pear_rs_result.rootstocks_loaded
        combined.errors.extend(pear_rs_result.errors)

        cherry_rs_result = self.load_cherry_rootstocks()
        combined.rootstocks_loaded += cherry_rs_result.rootstocks_loaded
        combined.errors.extend(cherry_rs_result.errors)

        return combined
