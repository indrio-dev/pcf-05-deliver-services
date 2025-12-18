"""Data models for Fielder."""

from .crop import Crop, Cultivar, CropCategory
from .region import GrowingRegion, USDAZone
from .harvest import HarvestWindow, SeasonalAvailability
from .farm import Farm, FarmCrop
from .weather import DailyWeather, GDDAccumulation, CROP_GDD_TARGETS, get_gdd_targets
from .quality import SHAREQualityPrediction, CropMaturityType
from .prediction import PredictionRange, DateRange, HarvestPrediction, DataQuality
from .cultivar_database import CultivarDatabase, CultivarResearch, RegionalBloomData

__all__ = [
    "Crop",
    "Cultivar",
    "CropCategory",
    "GrowingRegion",
    "USDAZone",
    "HarvestWindow",
    "SeasonalAvailability",
    "Farm",
    "FarmCrop",
    "DailyWeather",
    "GDDAccumulation",
    "CROP_GDD_TARGETS",
    "get_gdd_targets",
    "SHAREQualityPrediction",
    "CropMaturityType",
    "PredictionRange",
    "DateRange",
    "HarvestPrediction",
    "DataQuality",
    "CultivarDatabase",
    "CultivarResearch",
    "RegionalBloomData",
]
