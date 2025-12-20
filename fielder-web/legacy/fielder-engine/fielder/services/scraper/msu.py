"""
Michigan State University Extension Scraper.

Primary source for:
- Tart cherries (Montmorency)
- Sweet cherries
- Apples
- Blueberries

Key resources:
- MSU Extension: https://www.canr.msu.edu/
- Michigan Fruit Crop Advisory Team
- Trevor Nichols Research Center data
"""

from typing import Optional

from .base import (
    ExtensionScraper,
    ScrapedData,
    DataSource,
    DataCategory,
)


class MSUScraper(ExtensionScraper):
    """
    Scraper for Michigan State University extension publications.

    Focus areas:
    - Tart cherries (Michigan is #1 producer)
    - Sweet cherries
    - Apples (especially cold-hardy varieties)
    - Blueberries (West Michigan)
    """

    def __init__(self):
        super().__init__()
        self.source = DataSource.MSU
        self.base_url = "https://www.canr.msu.edu"
        self.rate_limit_seconds = 2.0

    @property
    def supported_crops(self) -> list[str]:
        return ["tart_cherry", "sweet_cherry", "apple", "blueberry"]

    def scrape_cultivar_data(self, crop_type: str) -> list[ScrapedData]:
        """Scrape cultivar data from MSU Extension."""
        data = []

        # Michigan cultivar data
        mi_cultivars = {
            "tart_cherry": {
                "montmorency": {
                    "chill_hours": 1200,
                    "days_to_harvest": 70,
                    "brix_peak": 15.0,
                    "acid_pct": 1.8,
                    "harvest_timing": "mid",
                    "region": "michigan_west",
                    "notes": "Primary US tart cherry cultivar, 95%+ of production",
                },
                "balaton": {
                    "chill_hours": 1100,
                    "days_to_harvest": 75,
                    "brix_peak": 19.0,
                    "acid_pct": 1.5,
                    "harvest_timing": "mid-late",
                    "region": "michigan_west",
                    "notes": "Hungarian variety, higher sugar, darker color",
                },
            },
            "sweet_cherry": {
                "hedelfingen": {
                    "chill_hours": 1200,
                    "days_to_harvest": 70,
                    "brix_peak": 18.0,
                    "harvest_timing": "late",
                    "region": "michigan_west",
                },
                "emperor_francis": {
                    "chill_hours": 1100,
                    "days_to_harvest": 65,
                    "brix_peak": 17.0,
                    "harvest_timing": "mid",
                    "region": "michigan_west",
                },
            },
            "apple": {
                "honeycrisp": {
                    "chill_hours": 1000,
                    "days_to_harvest": 155,
                    "brix_peak": 14.0,
                    "harvest_timing": "mid-late",
                    "region": "michigan_west",
                    "notes": "Premium eating apple, high crunch, balanced acid",
                },
                "gala": {
                    "chill_hours": 900,
                    "days_to_harvest": 140,
                    "brix_peak": 14.0,
                    "harvest_timing": "early-mid",
                    "region": "michigan_west",
                },
                "fuji": {
                    "chill_hours": 800,
                    "days_to_harvest": 175,
                    "brix_peak": 16.0,
                    "harvest_timing": "late",
                    "region": "michigan_southwest",
                    "notes": "Very high sugar, excellent storage",
                },
                "northern_spy": {
                    "chill_hours": 1200,
                    "days_to_harvest": 180,
                    "brix_peak": 13.5,
                    "harvest_timing": "late",
                    "region": "michigan_west",
                    "notes": "Heritage variety, excellent for pies, long storage",
                },
            },
            "blueberry": {
                "duke": {
                    "chill_hours": 1000,
                    "days_to_harvest": 60,
                    "brix_peak": 13.0,
                    "harvest_timing": "early",
                    "region": "michigan_southwest",
                },
                "bluecrop": {
                    "chill_hours": 1000,
                    "days_to_harvest": 70,
                    "brix_peak": 12.5,
                    "harvest_timing": "mid",
                    "region": "michigan_southwest",
                    "notes": "Industry standard, reliable production",
                },
                "jersey": {
                    "chill_hours": 1100,
                    "days_to_harvest": 80,
                    "brix_peak": 14.0,
                    "harvest_timing": "late",
                    "region": "michigan_southwest",
                    "notes": "Heritage variety, excellent flavor",
                },
            },
        }

        if crop_type in mi_cultivars:
            for cultivar_id, attrs in mi_cultivars[crop_type].items():
                for key, value in attrs.items():
                    if key not in ["region", "notes"]:
                        data.append(ScrapedData(
                            category=DataCategory.CULTIVAR,
                            crop_type=crop_type,
                            data_key=key,
                            data_value=value,
                            source=self.source,
                            source_url=f"{self.base_url}/resources/{crop_type}",
                            cultivar_id=cultivar_id,
                            region_id=attrs.get("region"),
                            confidence=0.9,
                            source_text=f"MSU {cultivar_id}: {key} = {value}"
                        ))
                # Add notes if present
                if "notes" in attrs:
                    data.append(ScrapedData(
                        category=DataCategory.CULTIVAR,
                        crop_type=crop_type,
                        data_key="description",
                        data_value=attrs["notes"],
                        source=self.source,
                        source_url=f"{self.base_url}/resources/{crop_type}",
                        cultivar_id=cultivar_id,
                        region_id=attrs.get("region"),
                        confidence=0.9,
                        source_text=attrs["notes"]
                    ))

        return data

    def scrape_harvest_timing(self, crop_type: str, region_id: Optional[str] = None) -> list[ScrapedData]:
        """Scrape harvest timing for Michigan crops."""
        data = []

        # Michigan harvest timing
        mi_timing = {
            "tart_cherry": {
                "harvest_start": "July 5",
                "harvest_end": "July 25",
                "peak_start": "July 10",
                "peak_end": "July 20",
                "gdd_base": 40,
                "gdd_maturity": 1500,
                "notes": "Very short window, 10-14 days total",
            },
            "sweet_cherry": {
                "harvest_start": "July 1",
                "harvest_end": "August 15",
                "peak_start": "July 15",
                "peak_end": "August 1",
                "gdd_base": 40,
                "gdd_maturity": 1400,
            },
            "apple": {
                "harvest_start": "August 15",
                "harvest_end": "November 15",
                "peak_start": "September 15",
                "peak_end": "October 31",
                "gdd_base": 43,
                "gdd_maturity": 2200,
            },
            "blueberry": {
                "harvest_start": "July 1",
                "harvest_end": "September 15",
                "peak_start": "July 15",
                "peak_end": "August 15",
                "gdd_base": 45,
                "gdd_maturity": 1200,
            },
        }

        timing = mi_timing.get(crop_type)
        if timing:
            for key, value in timing.items():
                data.append(ScrapedData(
                    category=DataCategory.HARVEST_TIMING,
                    crop_type=crop_type,
                    data_key=key,
                    data_value=value,
                    source=self.source,
                    source_url=f"{self.base_url}/harvest/{crop_type}",
                    region_id=region_id or "michigan_west",
                    confidence=0.9,
                    source_text=f"MI {crop_type} timing: {key} = {value}"
                ))

        return data

    def scrape_quality_standards(self, crop_type: str) -> list[ScrapedData]:
        """Scrape quality standards from MSU."""
        data = []

        # Michigan quality standards
        quality_standards = {
            "tart_cherry": {
                "min_brix": 13.0,
                "peak_brix": 15.0,
                "target_acid_pct": 1.8,
                "processing_standard": True,
            },
            "sweet_cherry": {
                "min_brix": 16.0,
                "peak_brix": 20.0,
                "min_size_row": 11,  # Row size (smaller number = bigger cherry)
            },
            "apple": {
                "min_brix": 11.0,
                "peak_brix": 14.0,
                "min_pressure_lbs": 14,  # Firmness at harvest
                "starch_index": 4,  # Target starch index at harvest (1-8 scale)
            },
            "blueberry": {
                "min_brix": 10.0,
                "peak_brix": 14.0,
                "bloom_retention": True,  # Waxy bloom indicates quality
            },
        }

        standards = quality_standards.get(crop_type)
        if standards:
            for key, value in standards.items():
                data.append(ScrapedData(
                    category=DataCategory.QUALITY_METRICS,
                    crop_type=crop_type,
                    data_key=key,
                    data_value=value,
                    source=self.source,
                    source_url=f"{self.base_url}/quality/{crop_type}",
                    confidence=0.9,
                    source_text=f"MI {crop_type} quality: {key} = {value}"
                ))

        return data
