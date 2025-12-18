"""
Base classes for extension service scrapers.

All scrapers inherit from ExtensionScraper and produce ScrapedData objects
that can be validated and merged into the cultivar database.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Optional, Any
import json
import hashlib


class DataSource(Enum):
    """Extension service data sources."""
    UF_IFAS = "uf_ifas"  # University of Florida
    UC_DAVIS = "uc_davis"  # UC Davis
    MSU = "msu"  # Michigan State
    TAMU = "tamu"  # Texas A&M
    WSU = "wsu"  # Washington State
    OSU = "osu"  # Oregon State
    CORNELL = "cornell"  # Cornell
    USDA_ARS = "usda_ars"  # USDA Agricultural Research Service
    NOAA = "noaa"  # NOAA weather data
    GROWER_COOP = "grower_coop"  # Grower cooperatives


class DataCategory(Enum):
    """Categories of scraped data."""
    CULTIVAR = "cultivar"  # Cultivar characteristics
    ROOTSTOCK = "rootstock"  # Rootstock characteristics
    HARVEST_TIMING = "harvest_timing"  # Harvest window data
    QUALITY_METRICS = "quality_metrics"  # Brix, acid, etc.
    CLIMATE = "climate"  # Climate/weather data
    PEST_DISEASE = "pest_disease"  # Pest and disease info
    GROWING_PRACTICES = "growing_practices"  # Best practices


@dataclass
class ScrapedData:
    """
    A single piece of scraped data from an extension service.

    Includes provenance (source, URL, date) for validation and citation.
    """
    # What was scraped
    category: DataCategory
    crop_type: str  # e.g., "apple", "peach"
    data_key: str  # e.g., "honeycrisp_gdd_maturity"
    data_value: Any  # The actual data

    # Provenance
    source: DataSource
    source_url: str
    scrape_date: date = field(default_factory=date.today)
    publication_date: Optional[date] = None

    # Specificity
    cultivar_id: Optional[str] = None
    rootstock_id: Optional[str] = None
    region_id: Optional[str] = None

    # Validation
    confidence: float = 0.8  # How confident are we in this data
    validated: bool = False
    validation_notes: str = ""

    # Original text (for audit trail)
    source_text: str = ""

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON storage."""
        return {
            "category": self.category.value,
            "crop_type": self.crop_type,
            "data_key": self.data_key,
            "data_value": self.data_value,
            "source": self.source.value,
            "source_url": self.source_url,
            "scrape_date": self.scrape_date.isoformat(),
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "cultivar_id": self.cultivar_id,
            "rootstock_id": self.rootstock_id,
            "region_id": self.region_id,
            "confidence": self.confidence,
            "validated": self.validated,
            "validation_notes": self.validation_notes,
            "source_text": self.source_text,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ScrapedData":
        """Create from dictionary."""
        return cls(
            category=DataCategory(data["category"]),
            crop_type=data["crop_type"],
            data_key=data["data_key"],
            data_value=data["data_value"],
            source=DataSource(data["source"]),
            source_url=data["source_url"],
            scrape_date=date.fromisoformat(data["scrape_date"]),
            publication_date=date.fromisoformat(data["publication_date"]) if data.get("publication_date") else None,
            cultivar_id=data.get("cultivar_id"),
            rootstock_id=data.get("rootstock_id"),
            region_id=data.get("region_id"),
            confidence=data.get("confidence", 0.8),
            validated=data.get("validated", False),
            validation_notes=data.get("validation_notes", ""),
            source_text=data.get("source_text", ""),
        )

    def content_hash(self) -> str:
        """Generate hash of the content for deduplication."""
        content = f"{self.category.value}:{self.crop_type}:{self.data_key}:{self.data_value}"
        return hashlib.md5(content.encode()).hexdigest()[:12]


class ExtensionScraper(ABC):
    """
    Abstract base class for extension service scrapers.

    Each scraper implements methods to:
    1. Fetch pages from the extension service
    2. Parse specific data types (cultivars, harvest timing, etc.)
    3. Return validated ScrapedData objects
    """

    def __init__(self):
        self.source: DataSource = DataSource.UF_IFAS  # Override in subclass
        self.base_url: str = ""
        self.rate_limit_seconds: float = 1.0  # Be respectful
        self._last_request_time: Optional[datetime] = None

    @property
    @abstractmethod
    def supported_crops(self) -> list[str]:
        """List of crops this scraper can provide data for."""
        pass

    @abstractmethod
    def scrape_cultivar_data(self, crop_type: str) -> list[ScrapedData]:
        """Scrape cultivar data for a crop type."""
        pass

    @abstractmethod
    def scrape_harvest_timing(self, crop_type: str, region_id: Optional[str] = None) -> list[ScrapedData]:
        """Scrape harvest timing data."""
        pass

    @abstractmethod
    def scrape_quality_standards(self, crop_type: str) -> list[ScrapedData]:
        """Scrape quality standards (Brix, acid, etc.)."""
        pass

    def scrape_all(self) -> list[ScrapedData]:
        """Scrape all available data for all supported crops."""
        all_data = []

        for crop in self.supported_crops:
            all_data.extend(self.scrape_cultivar_data(crop))
            all_data.extend(self.scrape_harvest_timing(crop))
            all_data.extend(self.scrape_quality_standards(crop))

        return all_data

    def _fetch_page(self, url: str) -> Optional[str]:
        """
        Fetch a page with rate limiting.

        Returns HTML content or None if fetch fails.
        """
        import time
        import urllib.request
        import urllib.error

        # Rate limiting
        if self._last_request_time:
            elapsed = (datetime.now() - self._last_request_time).total_seconds()
            if elapsed < self.rate_limit_seconds:
                time.sleep(self.rate_limit_seconds - elapsed)

        try:
            # Add user agent to be a good citizen
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "Fielder-Research-Bot/1.0 (Agricultural Research)"}
            )

            with urllib.request.urlopen(request, timeout=30) as response:
                self._last_request_time = datetime.now()
                return response.read().decode('utf-8')

        except urllib.error.URLError as e:
            print(f"Error fetching {url}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error fetching {url}: {e}")
            return None

    def _extract_numbers(self, text: str) -> list[float]:
        """Extract all numbers from text."""
        import re
        pattern = r'[-+]?\d*\.?\d+'
        matches = re.findall(pattern, text)
        return [float(m) for m in matches if m]

    def _extract_date_range(self, text: str) -> tuple[Optional[str], Optional[str]]:
        """Extract date range from text like 'October 15 - November 30'."""
        import re

        # Common patterns
        patterns = [
            r'(\w+\s+\d{1,2})\s*[-–to]+\s*(\w+\s+\d{1,2})',  # October 15 - November 30
            r'(\w+)\s*[-–to]+\s*(\w+)',  # October - November
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1), match.group(2)

        return None, None


@dataclass
class ScraperRegistry:
    """Registry of all available scrapers."""
    scrapers: dict[DataSource, ExtensionScraper] = field(default_factory=dict)

    def register(self, scraper: ExtensionScraper):
        """Register a scraper."""
        self.scrapers[scraper.source] = scraper

    def get_scraper(self, source: DataSource) -> Optional[ExtensionScraper]:
        """Get a scraper by source."""
        return self.scrapers.get(source)

    def get_scrapers_for_crop(self, crop_type: str) -> list[ExtensionScraper]:
        """Get all scrapers that support a crop type."""
        return [
            scraper for scraper in self.scrapers.values()
            if crop_type in scraper.supported_crops
        ]

    def scrape_all(self) -> list[ScrapedData]:
        """Run all scrapers and collect data."""
        all_data = []
        for scraper in self.scrapers.values():
            all_data.extend(scraper.scrape_all())
        return all_data


class DataValidator:
    """
    Validates scraped data against existing database and known constraints.

    Flags:
    - Outliers (values far from expected ranges)
    - Conflicts (contradictory data from different sources)
    - Missing data (required fields not present)
    """

    # Expected ranges for common metrics
    EXPECTED_RANGES = {
        "brix": (6.0, 25.0),
        "acid_pct": (0.1, 5.0),
        "gdd_maturity": (500, 4000),
        "gdd_peak": (500, 5000),
        "chill_hours": (0, 2000),
        "days_to_maturity": (30, 365),
    }

    def validate(self, data: ScrapedData) -> tuple[bool, list[str]]:
        """
        Validate a piece of scraped data.

        Returns (is_valid, list_of_warnings).
        """
        warnings = []

        # Check value ranges for numeric data
        if isinstance(data.data_value, (int, float)):
            key_lower = data.data_key.lower()

            for metric, (min_val, max_val) in self.EXPECTED_RANGES.items():
                if metric in key_lower:
                    if not (min_val <= data.data_value <= max_val):
                        warnings.append(
                            f"Value {data.data_value} outside expected range "
                            f"[{min_val}, {max_val}] for {metric}"
                        )

        # Check required fields
        if not data.source_url:
            warnings.append("Missing source URL")

        if data.confidence < 0.5:
            warnings.append(f"Low confidence ({data.confidence})")

        is_valid = len(warnings) == 0 or all("outside expected" not in w for w in warnings)

        return is_valid, warnings

    def compare_sources(self, data_list: list[ScrapedData]) -> dict:
        """
        Compare data from multiple sources for the same metric.

        Returns summary of agreements and conflicts.
        """
        # Group by (crop, data_key)
        by_metric = {}
        for d in data_list:
            key = (d.crop_type, d.data_key, d.cultivar_id)
            if key not in by_metric:
                by_metric[key] = []
            by_metric[key].append(d)

        conflicts = []
        agreements = []

        for key, items in by_metric.items():
            if len(items) > 1:
                values = [d.data_value for d in items if isinstance(d.data_value, (int, float))]
                if values:
                    spread = max(values) - min(values)
                    avg = sum(values) / len(values)
                    pct_spread = (spread / avg * 100) if avg > 0 else 0

                    if pct_spread > 20:  # More than 20% difference
                        conflicts.append({
                            "metric": key,
                            "values": [(d.source.value, d.data_value) for d in items],
                            "spread_pct": pct_spread
                        })
                    else:
                        agreements.append({
                            "metric": key,
                            "consensus_value": avg,
                            "sources": [d.source.value for d in items]
                        })

        return {
            "conflicts": conflicts,
            "agreements": agreements,
            "total_metrics": len(by_metric)
        }
