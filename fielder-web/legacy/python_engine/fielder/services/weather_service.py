"""
Weather Service - External weather data integration.

We are NOT collecting farm-level IoT data.
We ARE using public weather data + horticultural models to PREDICT harvest windows.

Data sources (free or low-cost):
- NOAA/NWS: Historical and forecast weather
- Open-Meteo: Free weather API (primary for MVP)
- USDA NASS: Crop progress reports
- NASA POWER: Solar/temperature data for agriculture

The key insight: We don't need farm-specific sensors.
Regional weather + horticultural models = predicted harvest windows.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional
import math
import json
import urllib.request
import urllib.parse
from functools import lru_cache


# Location coordinates for our growing regions
# Maps region_id to (latitude, longitude)
REGION_COORDINATES = {
    # Southeast (FL/GA)
    "indian_river": (27.6, -80.4),
    "central_florida": (28.5, -81.4),
    "south_florida": (25.5, -80.4),
    "sweet_valley": (30.5, -86.5),  # Sweet Valley - FL Panhandle / S. AL / S. GA
    "georgia_piedmont": (32.8, -83.6),
    # Texas/Southwest
    "texas_rgv": (26.2, -98.2),
    "texas_hill_country": (30.3, -98.5),
    "texas_pecan_belt": (31.5, -97.0),
    # California
    "california_central_valley": (36.7, -119.8),
    "california_coastal": (36.9, -121.8),
    "california_southern_desert": (33.7, -116.2),
    # Pacific Northwest
    "pacific_nw_yakima": (46.6, -120.5),
    "pacific_nw_wenatchee": (47.4, -120.3),
    "pacific_nw_hood_river": (45.7, -121.5),
    # Midwest
    "michigan_west": (44.8, -85.6),
    "michigan_southwest": (42.0, -86.5),
    "wisconsin_door_county": (45.0, -87.2),
    # Northeast
    "new_york_hudson_valley": (41.7, -73.9),
    "new_york_finger_lakes": (42.5, -76.5),
    "pennsylvania_adams_county": (39.8, -77.2),
    "new_jersey_pine_barrens": (39.8, -74.5),
}


@dataclass
class WeatherObservation:
    """A single weather observation for a location."""
    date: date
    location_id: str

    # Temperature (Fahrenheit)
    temp_high: float
    temp_low: float
    temp_avg: Optional[float] = None

    # Precipitation
    precip_inches: float = 0.0

    # Optional additional data
    humidity_pct: Optional[float] = None
    solar_radiation_mj: Optional[float] = None  # MJ/m2 - affects sugar development

    def __post_init__(self):
        if self.temp_avg is None:
            self.temp_avg = (self.temp_high + self.temp_low) / 2

    def gdd(self, base_temp: float = 55.0) -> float:
        """Calculate Growing Degree Days for this observation."""
        return max(0, self.temp_avg - base_temp)


@dataclass
class WeatherForecast:
    """Weather forecast for a location."""
    date: date
    location_id: str
    temp_high: float
    temp_low: float
    precip_probability: float = 0.0
    confidence: float = 0.8  # Decreases for forecasts further out

    def projected_gdd(self, base_temp: float = 55.0) -> float:
        avg = (self.temp_high + self.temp_low) / 2
        return max(0, avg - base_temp)


@dataclass
class RegionalWeatherSummary:
    """Aggregated weather data for a region over a time period."""
    region_id: str
    start_date: date
    end_date: date

    # GDD accumulation
    total_gdd: float = 0.0
    avg_daily_gdd: float = 0.0

    # Temperature summary
    avg_high: float = 0.0
    avg_low: float = 0.0
    min_temp: float = 0.0
    max_temp: float = 0.0

    # Precipitation
    total_precip_inches: float = 0.0
    rain_days: int = 0

    # Frost events (critical for some crops)
    frost_events: int = 0  # Days with low < 32F
    last_frost_date: Optional[date] = None

    # Chill hours (for deciduous fruit)
    chill_hours: int = 0  # Hours between 32-45F

    # Data quality
    observation_count: int = 0
    missing_days: int = 0


class WeatherProvider(ABC):
    """Abstract base class for weather data providers."""

    @abstractmethod
    def get_historical(
        self,
        location_id: str,
        start_date: date,
        end_date: date
    ) -> list[WeatherObservation]:
        """Get historical weather observations."""
        pass

    @abstractmethod
    def get_forecast(
        self,
        location_id: str,
        days_ahead: int = 7
    ) -> list[WeatherForecast]:
        """Get weather forecast."""
        pass

    @abstractmethod
    def get_climatology(
        self,
        location_id: str,
        month: int
    ) -> dict:
        """Get historical averages (climatology) for a month."""
        pass


class NOAAWeatherProvider(WeatherProvider):
    """
    NOAA/NWS weather data provider.

    Free data sources:
    - Historical: GHCN-Daily (Global Historical Climatology Network)
    - Forecast: NWS API
    - Climatology: NCEI Climate Normals

    Implementation would use requests to hit these APIs.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = "https://api.weather.gov"

    def get_historical(
        self,
        location_id: str,
        start_date: date,
        end_date: date
    ) -> list[WeatherObservation]:
        """
        Get historical weather from NOAA GHCN-Daily.

        In production, this would call:
        https://www.ncei.noaa.gov/cdo-web/api/v2/data
        """
        # Placeholder - would implement actual API call
        return []

    def get_forecast(
        self,
        location_id: str,
        days_ahead: int = 7
    ) -> list[WeatherForecast]:
        """
        Get forecast from NWS API.

        In production, this would call:
        https://api.weather.gov/gridpoints/{office}/{x},{y}/forecast
        """
        # Placeholder - would implement actual API call
        return []

    def get_climatology(
        self,
        location_id: str,
        month: int
    ) -> dict:
        """
        Get climate normals (30-year averages).

        In production, this would use NCEI Climate Normals.
        """
        # Placeholder - would return historical averages
        return {}


class OpenMeteoProvider(WeatherProvider):
    """
    Open-Meteo weather provider.

    Free, no API key required:
    - Historical: archive-api.open-meteo.com/v1/archive
    - Forecast: api.open-meteo.com/v1/forecast

    Good option for MVP - no rate limits for reasonable usage.
    """

    def __init__(self):
        self.historical_url = "https://archive-api.open-meteo.com/v1/archive"
        self.forecast_url = "https://api.open-meteo.com/v1/forecast"
        self._climatology_cache: dict[tuple[str, int], dict] = {}

    def _get_coordinates(self, location_id: str) -> tuple[float, float]:
        """Get lat/lon for a location ID."""
        if location_id in REGION_COORDINATES:
            return REGION_COORDINATES[location_id]
        raise ValueError(f"Unknown location_id: {location_id}")

    def _celsius_to_fahrenheit(self, celsius: float) -> float:
        """Convert Celsius to Fahrenheit."""
        return celsius * 9 / 5 + 32

    def _fetch_json(self, url: str, params: dict) -> dict:
        """Fetch JSON from URL with query parameters."""
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"

        try:
            with urllib.request.urlopen(full_url, timeout=30) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.URLError as e:
            print(f"Weather API error: {e}")
            return {}
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return {}

    def get_historical(
        self,
        location_id: str,
        start_date: date,
        end_date: date
    ) -> list[WeatherObservation]:
        """
        Get historical weather from Open-Meteo archive.

        API docs: https://open-meteo.com/en/docs/historical-weather-api
        """
        lat, lon = self._get_coordinates(location_id)

        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
            "temperature_unit": "celsius",
            "precipitation_unit": "inch",
            "timezone": "auto"
        }

        data = self._fetch_json(self.historical_url, params)

        if not data or "daily" not in data:
            return []

        daily = data["daily"]
        observations = []

        dates = daily.get("time", [])
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])
        precip = daily.get("precipitation_sum", [])

        for i, date_str in enumerate(dates):
            if i >= len(temp_max) or i >= len(temp_min):
                continue

            t_max = temp_max[i]
            t_min = temp_min[i]

            # Skip if data is missing (None)
            if t_max is None or t_min is None:
                continue

            obs = WeatherObservation(
                date=date.fromisoformat(date_str),
                location_id=location_id,
                temp_high=self._celsius_to_fahrenheit(t_max),
                temp_low=self._celsius_to_fahrenheit(t_min),
                precip_inches=precip[i] if i < len(precip) and precip[i] is not None else 0.0
            )
            observations.append(obs)

        return observations

    def get_forecast(
        self,
        location_id: str,
        days_ahead: int = 7
    ) -> list[WeatherForecast]:
        """
        Get weather forecast from Open-Meteo.

        API docs: https://open-meteo.com/en/docs
        """
        lat, lon = self._get_coordinates(location_id)

        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "temperature_unit": "celsius",
            "forecast_days": min(days_ahead, 16),  # Max 16 days
            "timezone": "auto"
        }

        data = self._fetch_json(self.forecast_url, params)

        if not data or "daily" not in data:
            return []

        daily = data["daily"]
        forecasts = []

        dates = daily.get("time", [])
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])
        precip_prob = daily.get("precipitation_probability_max", [])

        for i, date_str in enumerate(dates):
            if i >= len(temp_max) or i >= len(temp_min):
                continue

            t_max = temp_max[i]
            t_min = temp_min[i]

            if t_max is None or t_min is None:
                continue

            # Confidence decreases for forecasts further out
            confidence = max(0.5, 0.95 - (i * 0.03))

            forecast = WeatherForecast(
                date=date.fromisoformat(date_str),
                location_id=location_id,
                temp_high=self._celsius_to_fahrenheit(t_max),
                temp_low=self._celsius_to_fahrenheit(t_min),
                precip_probability=(precip_prob[i] / 100.0) if i < len(precip_prob) and precip_prob[i] is not None else 0.0,
                confidence=confidence
            )
            forecasts.append(forecast)

        return forecasts

    def get_climatology(
        self,
        location_id: str,
        month: int
    ) -> dict:
        """
        Calculate climatology from historical archive.

        Uses 5-year historical average for the given month.
        Results are cached to avoid repeated API calls.
        """
        cache_key = (location_id, month)
        if cache_key in self._climatology_cache:
            return self._climatology_cache[cache_key]

        # Get last 5 years of data for this month
        current_year = date.today().year
        all_observations = []

        for year in range(current_year - 5, current_year):
            # First and last day of the month
            if month == 12:
                start = date(year, month, 1)
                end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                start = date(year, month, 1)
                end = date(year, month + 1, 1) - timedelta(days=1)

            try:
                obs = self.get_historical(location_id, start, end)
                all_observations.extend(obs)
            except Exception:
                # Skip years with missing data
                continue

        if not all_observations:
            # Return reasonable defaults based on month and location
            result = self._get_default_climatology(location_id, month)
            self._climatology_cache[cache_key] = result
            return result

        # Calculate averages
        avg_high = sum(o.temp_high for o in all_observations) / len(all_observations)
        avg_low = sum(o.temp_low for o in all_observations) / len(all_observations)
        avg_precip = sum(o.precip_inches for o in all_observations) / len(all_observations)

        # Calculate average daily GDD for common base temps
        avg_gdd_50 = sum(o.gdd(50.0) for o in all_observations) / len(all_observations)
        avg_gdd_55 = sum(o.gdd(55.0) for o in all_observations) / len(all_observations)

        result = {
            "avg_high": round(avg_high, 1),
            "avg_low": round(avg_low, 1),
            "avg_temp": round((avg_high + avg_low) / 2, 1),
            "avg_daily_precip": round(avg_precip, 2),
            "avg_daily_gdd": round(avg_gdd_55, 1),  # Default base 55
            "avg_daily_gdd_50": round(avg_gdd_50, 1),
            "avg_daily_gdd_55": round(avg_gdd_55, 1),
            "observation_count": len(all_observations),
            "years_sampled": 5
        }

        self._climatology_cache[cache_key] = result
        return result

    def _get_default_climatology(self, location_id: str, month: int) -> dict:
        """
        Return reasonable default climatology when API data unavailable.

        Based on general knowledge of US growing regions.
        """
        # Very rough defaults by region type and month
        lat, _ = self._get_coordinates(location_id)

        # Base temperature on latitude and season
        if lat < 30:  # South Florida, Texas RGV
            winter_low, summer_high = 55, 95
        elif lat < 35:  # Georgia, Central Texas
            winter_low, summer_high = 35, 95
        elif lat < 40:  # California, Mid-Atlantic
            winter_low, summer_high = 30, 90
        elif lat < 45:  # Pacific NW, Midwest
            winter_low, summer_high = 20, 85
        else:  # Northern states
            winter_low, summer_high = 10, 80

        # Seasonal adjustment
        if month in [12, 1, 2]:
            avg_high = winter_low + 20
            avg_low = winter_low
        elif month in [6, 7, 8]:
            avg_high = summer_high
            avg_low = summer_high - 20
        else:
            # Spring/Fall - interpolate
            avg_high = (winter_low + summer_high) / 2 + 10
            avg_low = (winter_low + summer_high) / 2 - 10

        avg_temp = (avg_high + avg_low) / 2
        avg_gdd_55 = max(0, avg_temp - 55)

        return {
            "avg_high": avg_high,
            "avg_low": avg_low,
            "avg_temp": avg_temp,
            "avg_daily_precip": 0.1,
            "avg_daily_gdd": avg_gdd_55,
            "avg_daily_gdd_50": max(0, avg_temp - 50),
            "avg_daily_gdd_55": avg_gdd_55,
            "observation_count": 0,
            "years_sampled": 0,
            "is_default": True
        }


class WeatherService:
    """
    Main weather service for Fielder.

    Aggregates weather data and calculates GDD accumulation
    for harvest window predictions.
    """

    def __init__(self, provider: Optional[WeatherProvider] = None):
        self.provider = provider or OpenMeteoProvider()
        self._gdd_cache: dict[str, float] = {}

    def calculate_gdd_accumulation(
        self,
        region_id: str,
        start_date: date,  # e.g., bloom date
        end_date: date,    # e.g., today
        base_temp: float = 55.0
    ) -> float:
        """
        Calculate cumulative GDD from start_date to end_date.

        This is the core calculation for harvest prediction.
        """
        observations = self.provider.get_historical(region_id, start_date, end_date)

        total_gdd = sum(obs.gdd(base_temp) for obs in observations)
        return total_gdd

    def project_gdd_to_date(
        self,
        region_id: str,
        current_gdd: float,
        target_gdd: float,
        base_temp: float = 55.0
    ) -> tuple[date, float]:
        """
        Project when target GDD will be reached.

        Uses forecast + climatology for future dates.

        Returns:
            (projected_date, confidence)
        """
        today = date.today()

        # Get forecast for next 7-14 days
        forecasts = self.provider.get_forecast(region_id, days_ahead=14)

        gdd_remaining = target_gdd - current_gdd
        if gdd_remaining <= 0:
            return today, 0.95

        # Calculate average GDD/day from forecast
        if forecasts:
            forecast_gdd = sum(f.projected_gdd(base_temp) for f in forecasts)
            avg_daily_gdd = forecast_gdd / len(forecasts)
            confidence = 0.8  # Forecast-based
        else:
            # Fall back to climatology
            climatology = self.provider.get_climatology(
                region_id,
                today.month
            )
            avg_daily_gdd = climatology.get("avg_daily_gdd", 10.0)
            confidence = 0.6  # Climatology-based

        days_to_target = int(gdd_remaining / avg_daily_gdd) if avg_daily_gdd > 0 else 30
        projected_date = today + timedelta(days=days_to_target)

        # Reduce confidence for projections further out
        if days_to_target > 14:
            confidence *= 0.9
        if days_to_target > 30:
            confidence *= 0.8

        return projected_date, round(confidence, 2)

    def get_season_summary(
        self,
        region_id: str,
        season_start: date,
        as_of_date: Optional[date] = None
    ) -> RegionalWeatherSummary:
        """
        Get weather summary for the growing season to date.

        Useful for comparing current year to historical norms.
        """
        if as_of_date is None:
            as_of_date = date.today()

        observations = self.provider.get_historical(
            region_id,
            season_start,
            as_of_date
        )

        if not observations:
            return RegionalWeatherSummary(
                region_id=region_id,
                start_date=season_start,
                end_date=as_of_date
            )

        total_gdd = sum(obs.gdd() for obs in observations)
        temps_high = [obs.temp_high for obs in observations]
        temps_low = [obs.temp_low for obs in observations]

        frost_events = sum(1 for obs in observations if obs.temp_low < 32)
        frost_dates = [obs.date for obs in observations if obs.temp_low < 32]

        # Chill hours (simplified - hours between 32-45F)
        # In reality this would need hourly data
        chill_days = sum(1 for obs in observations if 32 <= obs.temp_low <= 45)
        estimated_chill_hours = chill_days * 8  # Rough estimate

        return RegionalWeatherSummary(
            region_id=region_id,
            start_date=season_start,
            end_date=as_of_date,
            total_gdd=total_gdd,
            avg_daily_gdd=total_gdd / len(observations) if observations else 0,
            avg_high=sum(temps_high) / len(temps_high) if temps_high else 0,
            avg_low=sum(temps_low) / len(temps_low) if temps_low else 0,
            min_temp=min(temps_low) if temps_low else 0,
            max_temp=max(temps_high) if temps_high else 0,
            total_precip_inches=sum(obs.precip_inches for obs in observations),
            rain_days=sum(1 for obs in observations if obs.precip_inches > 0.01),
            frost_events=frost_events,
            last_frost_date=max(frost_dates) if frost_dates else None,
            chill_hours=estimated_chill_hours,
            observation_count=len(observations),
            missing_days=(as_of_date - season_start).days - len(observations)
        )

    def compare_to_normal(
        self,
        region_id: str,
        current_gdd: float,
        days_since_bloom: int
    ) -> dict:
        """
        Compare current season to historical norms.

        Returns whether season is running ahead, behind, or normal.
        """
        # Would use climatology data
        # For now, return placeholder
        expected_gdd = days_since_bloom * 11.5  # Rough Florida average

        deviation = current_gdd - expected_gdd
        pct_deviation = (deviation / expected_gdd * 100) if expected_gdd > 0 else 0

        if pct_deviation > 10:
            status = "ahead"
            message = f"Season running {abs(pct_deviation):.0f}% ahead of normal"
        elif pct_deviation < -10:
            status = "behind"
            message = f"Season running {abs(pct_deviation):.0f}% behind normal"
        else:
            status = "normal"
            message = "Season tracking close to normal"

        return {
            "status": status,
            "current_gdd": current_gdd,
            "expected_gdd": expected_gdd,
            "deviation_gdd": deviation,
            "deviation_pct": round(pct_deviation, 1),
            "message": message
        }
