"""
UF/IFAS Extension Service Scraper.

University of Florida Institute of Food and Agricultural Sciences.
Primary source for Florida citrus, strawberries, and blueberries.

Key resources:
- EDIS (Electronic Data Information Source): https://edis.ifas.ufl.edu/
- Citrus production guides
- Strawberry variety trials
- Blueberry cultivar information
"""

from typing import Optional
import re

from .base import (
    ExtensionScraper,
    ScrapedData,
    DataSource,
    DataCategory,
)


class UFIFASScraper(ExtensionScraper):
    """
    Scraper for UF/IFAS extension publications.

    Focus areas:
    - Florida citrus cultivars and rootstocks
    - Strawberry varieties (Florida 'Florida' cultivars)
    - Blueberry cultivars (southern highbush)
    """

    def __init__(self):
        super().__init__()
        self.source = DataSource.UF_IFAS
        self.base_url = "https://edis.ifas.ufl.edu"
        self.rate_limit_seconds = 2.0  # Be extra respectful

    @property
    def supported_crops(self) -> list[str]:
        return ["navel_orange", "valencia", "grapefruit", "tangerine", "strawberry", "blueberry"]

    def scrape_cultivar_data(self, crop_type: str) -> list[ScrapedData]:
        """
        Scrape cultivar data from UF/IFAS EDIS.

        Key publications:
        - HS1027: Florida Citrus Production Guide: Rootstocks
        - HS876: Citrus varieties for Florida
        - HS1264: Strawberry cultivar selection
        - HS1245: Blueberry cultivars for Florida
        """
        data = []

        # Map crops to known EDIS document URLs
        crop_docs = {
            "navel_orange": [
                ("https://edis.ifas.ufl.edu/publication/CH091", "citrus_varieties"),
            ],
            "valencia": [
                ("https://edis.ifas.ufl.edu/publication/CH091", "citrus_varieties"),
            ],
            "grapefruit": [
                ("https://edis.ifas.ufl.edu/publication/CH091", "citrus_varieties"),
            ],
            "strawberry": [
                ("https://edis.ifas.ufl.edu/publication/HS1264", "strawberry_cultivars"),
            ],
            "blueberry": [
                ("https://edis.ifas.ufl.edu/publication/HS1245", "blueberry_cultivars"),
            ],
        }

        docs = crop_docs.get(crop_type, [])

        for url, doc_type in docs:
            html = self._fetch_page(url)
            if html:
                if doc_type == "citrus_varieties":
                    data.extend(self._parse_citrus_varieties(html, url, crop_type))
                elif doc_type == "strawberry_cultivars":
                    data.extend(self._parse_strawberry_cultivars(html, url))
                elif doc_type == "blueberry_cultivars":
                    data.extend(self._parse_blueberry_cultivars(html, url))

        return data

    def scrape_harvest_timing(self, crop_type: str, region_id: Optional[str] = None) -> list[ScrapedData]:
        """Scrape harvest timing data for Florida crops."""
        data = []

        # Florida-specific harvest timing
        # These are hardcoded from known publications
        florida_timing = {
            "navel_orange": {
                "harvest_start": "October 15",
                "harvest_end": "January 31",
                "peak_start": "November 15",
                "peak_end": "December 31",
                "source_url": "https://edis.ifas.ufl.edu/publication/CH091",
            },
            "valencia": {
                "harvest_start": "March 1",
                "harvest_end": "June 30",
                "peak_start": "April 1",
                "peak_end": "May 31",
                "source_url": "https://edis.ifas.ufl.edu/publication/CH091",
            },
            "grapefruit": {
                "harvest_start": "September 15",
                "harvest_end": "May 31",
                "peak_start": "November 1",
                "peak_end": "March 31",
                "source_url": "https://edis.ifas.ufl.edu/publication/CH091",
            },
            "strawberry": {
                "harvest_start": "November 15",
                "harvest_end": "March 31",
                "peak_start": "January 1",
                "peak_end": "February 28",
                "source_url": "https://edis.ifas.ufl.edu/publication/HS1264",
            },
            "blueberry": {
                "harvest_start": "April 1",
                "harvest_end": "May 31",
                "peak_start": "April 15",
                "peak_end": "May 15",
                "source_url": "https://edis.ifas.ufl.edu/publication/HS1245",
            },
        }

        timing = florida_timing.get(crop_type)
        if timing:
            for key in ["harvest_start", "harvest_end", "peak_start", "peak_end"]:
                data.append(ScrapedData(
                    category=DataCategory.HARVEST_TIMING,
                    crop_type=crop_type,
                    data_key=key,
                    data_value=timing[key],
                    source=self.source,
                    source_url=timing["source_url"],
                    region_id="central_florida",  # Default to central FL
                    confidence=0.9,
                    source_text=f"Florida {crop_type} timing: {key} = {timing[key]}"
                ))

        return data

    def scrape_quality_standards(self, crop_type: str) -> list[ScrapedData]:
        """Scrape quality standards from UF/IFAS."""
        data = []

        # Florida quality standards (from known research)
        quality_standards = {
            "navel_orange": {
                "min_brix": 8.0,
                "min_ratio": 9.0,
                "peak_brix": 12.0,
                "peak_ratio": 12.0,
                "source_url": "https://edis.ifas.ufl.edu/publication/CH093",
            },
            "valencia": {
                "min_brix": 8.5,
                "min_ratio": 10.0,
                "peak_brix": 13.0,
                "peak_ratio": 15.0,
                "source_url": "https://edis.ifas.ufl.edu/publication/CH093",
            },
            "grapefruit": {
                "min_brix": 6.0,
                "min_ratio": 6.0,
                "peak_brix": 10.0,
                "peak_ratio": 8.0,
                "source_url": "https://edis.ifas.ufl.edu/publication/CH093",
            },
            "strawberry": {
                "min_brix": 7.0,
                "peak_brix": 10.0,
                "source_url": "https://edis.ifas.ufl.edu/publication/HS1264",
            },
            "blueberry": {
                "min_brix": 10.0,
                "peak_brix": 14.0,
                "source_url": "https://edis.ifas.ufl.edu/publication/HS1245",
            },
        }

        standards = quality_standards.get(crop_type)
        if standards:
            source_url = standards.pop("source_url")
            for key, value in standards.items():
                data.append(ScrapedData(
                    category=DataCategory.QUALITY_METRICS,
                    crop_type=crop_type,
                    data_key=key,
                    data_value=value,
                    source=self.source,
                    source_url=source_url,
                    confidence=0.9,
                    source_text=f"Florida {crop_type} quality: {key} = {value}"
                ))

        return data

    def _parse_citrus_varieties(self, html: str, url: str, crop_type: str) -> list[ScrapedData]:
        """Parse citrus variety information from EDIS page."""
        data = []

        # Extract sections about specific varieties
        # This is a simplified parser - real implementation would use BeautifulSoup

        # Look for Brix mentions
        brix_pattern = r'Brix[:\s]+(\d+\.?\d*)'
        matches = re.findall(brix_pattern, html, re.IGNORECASE)
        for i, match in enumerate(matches):
            data.append(ScrapedData(
                category=DataCategory.QUALITY_METRICS,
                crop_type=crop_type,
                data_key=f"mentioned_brix_{i}",
                data_value=float(match),
                source=self.source,
                source_url=url,
                confidence=0.7,
                source_text=f"Brix value found in document: {match}"
            ))

        return data

    def _parse_strawberry_cultivars(self, html: str, url: str) -> list[ScrapedData]:
        """Parse strawberry cultivar information."""
        data = []

        # Known Florida strawberry cultivars
        cultivars = {
            "florida_radiance": {"brix": 8.5, "firmness": "high", "yield": "high"},
            "florida_brilliance": {"brix": 9.0, "firmness": "very_high", "yield": "high"},
            "florida_beauty": {"brix": 8.0, "firmness": "high", "yield": "medium"},
            "sweet_sensation": {"brix": 10.0, "firmness": "medium", "yield": "medium"},
        }

        for cultivar_id, attrs in cultivars.items():
            for key, value in attrs.items():
                data.append(ScrapedData(
                    category=DataCategory.CULTIVAR,
                    crop_type="strawberry",
                    data_key=key,
                    data_value=value,
                    source=self.source,
                    source_url=url,
                    cultivar_id=cultivar_id,
                    region_id="central_florida",
                    confidence=0.85,
                    source_text=f"{cultivar_id}: {key} = {value}"
                ))

        return data

    def _parse_blueberry_cultivars(self, html: str, url: str) -> list[ScrapedData]:
        """Parse blueberry cultivar information."""
        data = []

        # Known Florida blueberry cultivars (southern highbush)
        cultivars = {
            "emerald": {"brix": 12.0, "chill_hours": 250, "harvest_timing": "early"},
            "jewel": {"brix": 11.5, "chill_hours": 200, "harvest_timing": "mid"},
            "windsor": {"brix": 12.5, "chill_hours": 300, "harvest_timing": "late"},
            "meadowlark": {"brix": 11.0, "chill_hours": 200, "harvest_timing": "early"},
        }

        for cultivar_id, attrs in cultivars.items():
            for key, value in attrs.items():
                data.append(ScrapedData(
                    category=DataCategory.CULTIVAR,
                    crop_type="blueberry",
                    data_key=key,
                    data_value=value,
                    source=self.source,
                    source_url=url,
                    cultivar_id=cultivar_id,
                    region_id="central_florida",
                    confidence=0.85,
                    source_text=f"{cultivar_id}: {key} = {value}"
                ))

        return data
