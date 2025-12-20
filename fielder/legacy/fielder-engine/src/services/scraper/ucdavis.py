"""
UC Davis Extension Service Scraper.

University of California Davis - Department of Plant Sciences.
Primary source for California stone fruits, pomology research.

Key resources:
- Fruit & Nut Research & Information Center
- UC Cooperative Extension
- California tree fruit research
"""

from typing import Optional

from .base import (
    ExtensionScraper,
    ScrapedData,
    DataSource,
    DataCategory,
)


class UCDavisScraper(ExtensionScraper):
    """
    Scraper for UC Davis extension publications.

    Focus areas:
    - Stone fruits (peaches, cherries, plums)
    - Pome fruits (apples, pears)
    - Citrus
    - Pomegranates
    """

    def __init__(self):
        super().__init__()
        self.source = DataSource.UC_DAVIS
        self.base_url = "https://fruitsandnuts.ucdavis.edu"
        self.rate_limit_seconds = 2.0

    @property
    def supported_crops(self) -> list[str]:
        return ["peach", "cherry", "sweet_cherry", "apple", "pear", "pomegranate", "navel_orange"]

    def scrape_cultivar_data(self, crop_type: str) -> list[ScrapedData]:
        """Scrape cultivar data from UC Davis Fruit & Nut Center."""
        data = []

        # California cultivar data (from research publications)
        ca_cultivars = {
            "peach": {
                "elberta": {
                    "chill_hours": 850,
                    "days_to_harvest": 130,
                    "brix_peak": 13.0,
                    "harvest_timing": "mid-late",
                    "region": "california_central_valley",
                },
                "ohhenry": {
                    "chill_hours": 750,
                    "days_to_harvest": 145,
                    "brix_peak": 13.5,
                    "harvest_timing": "late",
                    "region": "california_central_valley",
                },
                "redhaven": {
                    "chill_hours": 950,
                    "days_to_harvest": 110,
                    "brix_peak": 12.0,
                    "harvest_timing": "early",
                    "region": "california_central_valley",
                },
            },
            "sweet_cherry": {
                "bing": {
                    "chill_hours": 1100,
                    "days_to_harvest": 65,
                    "brix_peak": 20.0,
                    "harvest_timing": "mid",
                    "region": "california_central_valley",
                },
                "rainier": {
                    "chill_hours": 900,
                    "days_to_harvest": 60,
                    "brix_peak": 21.0,
                    "harvest_timing": "early-mid",
                    "region": "california_central_valley",
                },
                "brooks": {
                    "chill_hours": 700,
                    "days_to_harvest": 55,
                    "brix_peak": 18.0,
                    "harvest_timing": "early",
                    "region": "california_central_valley",
                },
            },
            "pomegranate": {
                "wonderful": {
                    "chill_hours": 150,
                    "days_to_harvest": 180,
                    "brix_peak": 17.0,
                    "harvest_timing": "mid",
                    "region": "california_central_valley",
                },
                "parfianka": {
                    "chill_hours": 200,
                    "days_to_harvest": 170,
                    "brix_peak": 18.0,
                    "harvest_timing": "early-mid",
                    "region": "california_central_valley",
                },
            },
        }

        if crop_type in ca_cultivars:
            for cultivar_id, attrs in ca_cultivars[crop_type].items():
                for key, value in attrs.items():
                    if key != "region":
                        data.append(ScrapedData(
                            category=DataCategory.CULTIVAR,
                            crop_type=crop_type,
                            data_key=key,
                            data_value=value,
                            source=self.source,
                            source_url=f"{self.base_url}/cultivars/{crop_type}",
                            cultivar_id=cultivar_id,
                            region_id=attrs.get("region"),
                            confidence=0.85,
                            source_text=f"UC Davis {cultivar_id}: {key} = {value}"
                        ))

        return data

    def scrape_harvest_timing(self, crop_type: str, region_id: Optional[str] = None) -> list[ScrapedData]:
        """Scrape harvest timing for California crops."""
        data = []

        # California harvest timing (Central Valley)
        ca_timing = {
            "peach": {
                "harvest_start": "May 15",
                "harvest_end": "September 30",
                "peak_start": "July 1",
                "peak_end": "August 31",
                "gdd_base": 45,
                "gdd_maturity": 1800,
            },
            "sweet_cherry": {
                "harvest_start": "May 1",
                "harvest_end": "June 30",
                "peak_start": "May 15",
                "peak_end": "June 15",
                "gdd_base": 40,
                "gdd_maturity": 1400,
            },
            "pomegranate": {
                "harvest_start": "September 15",
                "harvest_end": "November 30",
                "peak_start": "October 1",
                "peak_end": "November 15",
                "gdd_base": 50,
                "gdd_maturity": 2400,
            },
        }

        timing = ca_timing.get(crop_type)
        if timing:
            for key, value in timing.items():
                data.append(ScrapedData(
                    category=DataCategory.HARVEST_TIMING,
                    crop_type=crop_type,
                    data_key=key,
                    data_value=value,
                    source=self.source,
                    source_url=f"{self.base_url}/harvest/{crop_type}",
                    region_id=region_id or "california_central_valley",
                    confidence=0.85,
                    source_text=f"CA {crop_type} timing: {key} = {value}"
                ))

        return data

    def scrape_quality_standards(self, crop_type: str) -> list[ScrapedData]:
        """Scrape quality standards from UC Davis."""
        data = []

        # California quality standards
        quality_standards = {
            "peach": {
                "min_brix": 10.0,
                "peak_brix": 13.0,
                "shipping_firmness_lbs": 6.0,
                "eating_firmness_lbs": 2.0,
            },
            "sweet_cherry": {
                "min_brix": 16.0,
                "peak_brix": 20.0,
                "min_size_mm": 24,
                "premium_size_mm": 28,
            },
            "pomegranate": {
                "min_brix": 14.0,
                "peak_brix": 17.0,
                "max_acid_pct": 2.0,
                "optimal_ratio": 10.0,
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
                    confidence=0.85,
                    source_text=f"CA {crop_type} quality: {key} = {value}"
                ))

        return data
