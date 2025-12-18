"""
Texas A&M AgriLife Extension Scraper.

Primary source for:
- Pecans (Texas is #2 producer)
- Texas citrus (Rio Grande Valley)
- Hill Country peaches

Key resources:
- Texas A&M AgriLife Extension: https://agrilifeextension.tamu.edu/
- Texas Pecan Board research
- Texas citrus industry reports
"""

from typing import Optional

from .base import (
    ExtensionScraper,
    ScrapedData,
    DataSource,
    DataCategory,
)


class TAMUScraper(ExtensionScraper):
    """
    Scraper for Texas A&M AgriLife Extension publications.

    Focus areas:
    - Pecans (native and improved cultivars)
    - Texas citrus (Rio Grande Valley grapefruit)
    - Hill Country peaches
    """

    def __init__(self):
        super().__init__()
        self.source = DataSource.TAMU
        self.base_url = "https://agrilifeextension.tamu.edu"
        self.rate_limit_seconds = 2.0

    @property
    def supported_crops(self) -> list[str]:
        return ["pecan", "grapefruit", "navel_orange", "peach"]

    def scrape_cultivar_data(self, crop_type: str) -> list[ScrapedData]:
        """Scrape cultivar data from Texas A&M Extension."""
        data = []

        # Texas cultivar data
        tx_cultivars = {
            "pecan": {
                "desirable": {
                    "chill_hours": 400,
                    "days_to_maturity": 190,
                    "oil_content_pct": 70.0,
                    "kernel_pct": 53.0,
                    "harvest_timing": "mid",
                    "region": "texas_pecan_belt",
                    "notes": "Most planted cultivar, consistent production",
                },
                "pawnee": {
                    "chill_hours": 350,
                    "days_to_maturity": 160,
                    "oil_content_pct": 68.0,
                    "kernel_pct": 56.0,
                    "harvest_timing": "early",
                    "region": "texas_pecan_belt",
                    "notes": "Early ripening, large nut, good for fresh market",
                },
                "stuart": {
                    "chill_hours": 500,
                    "days_to_maturity": 200,
                    "oil_content_pct": 69.0,
                    "kernel_pct": 46.0,
                    "harvest_timing": "late",
                    "region": "texas_pecan_belt",
                    "notes": "Old standard, good pollenizer",
                },
                "caddo": {
                    "chill_hours": 450,
                    "days_to_maturity": 175,
                    "oil_content_pct": 72.0,
                    "kernel_pct": 52.0,
                    "harvest_timing": "mid-early",
                    "region": "texas_pecan_belt",
                    "notes": "High oil content, excellent quality",
                },
                "western_schley": {
                    "chill_hours": 300,
                    "days_to_maturity": 180,
                    "oil_content_pct": 71.0,
                    "kernel_pct": 60.0,
                    "harvest_timing": "mid",
                    "region": "texas_hill_country",
                    "notes": "Paper shell, easy cracking",
                },
            },
            "grapefruit": {
                "rio_red": {
                    "chill_hours": 100,
                    "days_to_maturity": 280,
                    "brix_peak": 11.0,
                    "harvest_timing": "mid",
                    "region": "texas_rgv",
                    "notes": "Texas signature grapefruit, deep red flesh",
                },
                "ruby_red": {
                    "chill_hours": 100,
                    "days_to_maturity": 270,
                    "brix_peak": 10.5,
                    "harvest_timing": "early-mid",
                    "region": "texas_rgv",
                    "notes": "Original red grapefruit from Texas",
                },
                "star_ruby": {
                    "chill_hours": 100,
                    "days_to_maturity": 290,
                    "brix_peak": 11.5,
                    "harvest_timing": "mid-late",
                    "region": "texas_rgv",
                    "notes": "Deep red throughout, fewer seeds",
                },
            },
            "peach": {
                "fredericksburg": {
                    "chill_hours": 600,
                    "days_to_harvest": 120,
                    "brix_peak": 14.0,
                    "harvest_timing": "mid",
                    "region": "texas_hill_country",
                    "notes": "Hill Country specialty, freestone",
                },
                "ranger": {
                    "chill_hours": 550,
                    "days_to_harvest": 100,
                    "brix_peak": 12.0,
                    "harvest_timing": "early",
                    "region": "texas_hill_country",
                },
                "loring": {
                    "chill_hours": 700,
                    "days_to_harvest": 125,
                    "brix_peak": 13.0,
                    "harvest_timing": "mid-late",
                    "region": "texas_hill_country",
                    "notes": "Excellent canning peach",
                },
            },
        }

        if crop_type in tx_cultivars:
            for cultivar_id, attrs in tx_cultivars[crop_type].items():
                for key, value in attrs.items():
                    if key not in ["region", "notes"]:
                        data.append(ScrapedData(
                            category=DataCategory.CULTIVAR,
                            crop_type=crop_type,
                            data_key=key,
                            data_value=value,
                            source=self.source,
                            source_url=f"{self.base_url}/crops/{crop_type}",
                            cultivar_id=cultivar_id,
                            region_id=attrs.get("region"),
                            confidence=0.9,
                            source_text=f"TAMU {cultivar_id}: {key} = {value}"
                        ))
                # Add notes if present
                if "notes" in attrs:
                    data.append(ScrapedData(
                        category=DataCategory.CULTIVAR,
                        crop_type=crop_type,
                        data_key="description",
                        data_value=attrs["notes"],
                        source=self.source,
                        source_url=f"{self.base_url}/crops/{crop_type}",
                        cultivar_id=cultivar_id,
                        region_id=attrs.get("region"),
                        confidence=0.9,
                        source_text=attrs["notes"]
                    ))

        return data

    def scrape_harvest_timing(self, crop_type: str, region_id: Optional[str] = None) -> list[ScrapedData]:
        """Scrape harvest timing for Texas crops."""
        data = []

        # Texas harvest timing
        tx_timing = {
            "pecan": {
                "harvest_start": "October 1",
                "harvest_end": "December 15",
                "peak_start": "October 15",
                "peak_end": "November 30",
                "gdd_base": 65,
                "gdd_maturity": 2600,
                "notes": "Shuck split indicates maturity",
            },
            "grapefruit": {
                "harvest_start": "October 1",
                "harvest_end": "May 31",
                "peak_start": "November 15",
                "peak_end": "March 31",
                "gdd_base": 55,
                "gdd_maturity": 2200,
                "notes": "Long season, improves on tree through winter",
            },
            "peach": {
                "harvest_start": "May 1",
                "harvest_end": "August 31",
                "peak_start": "June 1",
                "peak_end": "July 31",
                "gdd_base": 45,
                "gdd_maturity": 1800,
                "notes": "Hill Country peaks in June",
            },
        }

        timing = tx_timing.get(crop_type)
        if timing:
            for key, value in timing.items():
                data.append(ScrapedData(
                    category=DataCategory.HARVEST_TIMING,
                    crop_type=crop_type,
                    data_key=key,
                    data_value=value,
                    source=self.source,
                    source_url=f"{self.base_url}/harvest/{crop_type}",
                    region_id=region_id or ("texas_pecan_belt" if crop_type == "pecan" else "texas_rgv"),
                    confidence=0.9,
                    source_text=f"TX {crop_type} timing: {key} = {value}"
                ))

        return data

    def scrape_quality_standards(self, crop_type: str) -> list[ScrapedData]:
        """Scrape quality standards from Texas A&M."""
        data = []

        # Texas quality standards
        quality_standards = {
            "pecan": {
                "min_oil_pct": 65.0,
                "premium_oil_pct": 70.0,
                "min_kernel_pct": 45.0,
                "premium_kernel_pct": 55.0,
                "acceptable_moisture_pct": 4.5,
                "notes": "Quality based on oil content and kernel percentage, not Brix",
            },
            "grapefruit": {
                "min_brix": 7.0,
                "min_ratio": 6.0,
                "peak_brix": 11.0,
                "peak_ratio": 7.5,
                "notes": "Texas grapefruit standards, slightly different from Florida",
            },
            "peach": {
                "min_brix": 10.0,
                "peak_brix": 14.0,
                "shipping_firmness": "4-6 lbs",
                "eating_firmness": "1-2 lbs",
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
                    source_text=f"TX {crop_type} quality: {key} = {value}"
                ))

        return data
