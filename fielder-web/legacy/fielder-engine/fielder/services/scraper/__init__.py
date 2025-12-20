"""
Extension Service Scrapers.

Collects horticultural research data from university extension services
and agricultural research institutions.

Data sources:
- UF/IFAS: Florida citrus, strawberries, blueberries
- UC Davis: Stone fruits, pomology research
- Michigan State: Cherries, apples
- Texas A&M: Pecans, citrus
- Washington State: Apples, cherries, pears
- Oregon State: Pears, cherries
"""

from .base import ExtensionScraper, ScrapedData, DataSource
from .ufifas import UFIFASScraper
from .ucdavis import UCDavisScraper
from .msu import MSUScraper
from .tamu import TAMUScraper

__all__ = [
    "ExtensionScraper",
    "ScrapedData",
    "DataSource",
    "UFIFASScraper",
    "UCDavisScraper",
    "MSUScraper",
    "TAMUScraper",
]
