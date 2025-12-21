#!/usr/bin/env python3
"""
GDD Validation with Actual Weather Data (Open-Meteo API)

Uses real historical weather data to calculate GDD with proper:
- Crop-specific base temperatures
- Modified 86/50 method (upper temperature capping)
- Regional coordinates from Fielder's growing-regions database

Open-Meteo API: https://open-meteo.com/ (free, no API key required)
"""

import json
import requests
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional, List, Dict, Tuple
from pathlib import Path

# =============================================================================
# REGION COORDINATES (from growing-regions.ts)
# =============================================================================

REGION_COORDINATES = {
    # Florida
    'indian_river_fl': {'lat': 27.5, 'lon': -80.4, 'name': 'Indian River, FL'},
    'plant_city_fl': {'lat': 28.0, 'lon': -82.1, 'name': 'Plant City, FL'},
    'homestead_fl': {'lat': 25.5, 'lon': -80.5, 'name': 'Homestead, FL'},
    'florida_ridge': {'lat': 27.8, 'lon': -81.5, 'name': 'Florida Ridge'},

    # Georgia
    'georgia_peach': {'lat': 32.5, 'lon': -83.5, 'name': 'Georgia Peach Belt'},
    'fort_valley_ga': {'lat': 32.6, 'lon': -83.9, 'name': 'Fort Valley, GA'},

    # Washington
    'wenatchee_wa': {'lat': 47.4, 'lon': -120.3, 'name': 'Wenatchee, WA'},
    'yakima_wa': {'lat': 46.6, 'lon': -120.5, 'name': 'Yakima Valley, WA'},

    # Michigan
    'traverse_city_mi': {'lat': 44.8, 'lon': -85.6, 'name': 'Traverse City, MI'},
    'southwest_mi': {'lat': 42.1, 'lon': -86.2, 'name': 'Southwest MI'},

    # New York
    'finger_lakes_ny': {'lat': 42.6, 'lon': -76.9, 'name': 'Finger Lakes, NY'},
    'hudson_valley_ny': {'lat': 41.5, 'lon': -74.0, 'name': 'Hudson Valley, NY'},

    # New Jersey
    'south_jersey': {'lat': 39.7, 'lon': -75.1, 'name': 'South Jersey'},

    # Oregon
    'hood_river_or': {'lat': 45.7, 'lon': -121.5, 'name': 'Hood River, OR'},
    'willamette_or': {'lat': 44.9, 'lon': -123.0, 'name': 'Willamette Valley, OR'},

    # California
    'central_valley_ca': {'lat': 36.7, 'lon': -119.8, 'name': 'Central Valley, CA'},

    # Texas
    'rio_grande_tx': {'lat': 26.2, 'lon': -98.2, 'name': 'Rio Grande Valley, TX'},
}

# Map state codes to primary region
STATE_TO_REGION = {
    'FL': 'indian_river_fl',
    'GA': 'georgia_peach',
    'WA': 'wenatchee_wa',
    'MI': 'traverse_city_mi',
    'NY': 'finger_lakes_ny',
    'NJ': 'south_jersey',
    'OR': 'hood_river_or',
    'CA': 'central_valley_ca',
    'TX': 'rio_grande_tx',
}

# =============================================================================
# GDD CONFIGURATION
# =============================================================================

@dataclass
class GDDTarget:
    """GDD parameters for a crop, including modified 86/50 method support."""
    base_temp: float          # Temperature (F) below which no GDD accumulates
    gdd_to_maturity: int      # GDD from bloom to harvest-ready
    gdd_to_peak: int          # GDD from bloom to peak quality
    gdd_window: int           # GDD range during which quality remains high
    max_temp: Optional[float] = None  # Upper developmental threshold (86/50 method)
    notes: str = ""

@dataclass
class CropPhenology:
    crop_id: str
    region: str
    bloom_month: int
    bloom_day: int
    gdd_base: float
    gdd_to_maturity: int
    gdd_to_peak: int
    gdd_window: int
    max_temp: Optional[float] = None

# GDD targets with CALIBRATED values and max_temp for 86/50 method
CROP_GDD_TARGETS = {
    'citrus_orange': GDDTarget(55, 5100, 6100, 3500, notes="CALIBRATED: Oct-May"),
    'citrus_grapefruit': GDDTarget(55, 5500, 7100, 4400, notes="VALIDATED: 100% overlap"),
    'citrus_tangerine': GDDTarget(55, 4800, 5700, 1800, notes="CALIBRATED: Nov-Feb"),
    'strawberry': GDDTarget(50, 700, 1300, 1700, notes="CALIBRATED: Dec-Apr"),
    'tomato': GDDTarget(50, 2400, 2600, 2400, max_temp=86, notes="86/50 method, bimodal FL"),
    'pepper': GDDTarget(55, 2200, 2500, 900, max_temp=95, notes="Heat-tolerant"),
    'apple': GDDTarget(43, 1800, 2400, 1400, notes="CALIBRATED: Aug-Nov harvest"),
    'peach': GDDTarget(45, 1600, 2000, 1200, notes="CALIBRATED: May-Sept"),
    'cherry': GDDTarget(40, 1100, 1400, 600, notes="CALIBRATED: Jun-Aug"),
    'blueberry': GDDTarget(45, 900, 1200, 700, notes="CALIBRATED: 3mo window"),
    'pear': GDDTarget(40, 2200, 2700, 1000, notes="CALIBRATED: Aug-Oct"),
    'lettuce': GDDTarget(40, 800, 900, 300, max_temp=75, notes="Very heat-sensitive"),
    'broccoli': GDDTarget(40, 1600, 1700, 150, max_temp=75, notes="Heat-sensitive"),
    'corn_sweet': GDDTarget(50, 2400, 2500, 100, max_temp=86, notes="Standard 86/50"),
}

# Regional phenology (bloom dates)
CROP_PHENOLOGY = {
    ('citrus_orange', 'FL'): CropPhenology('citrus_orange', 'florida', 3, 15, 55, 5100, 6100, 3500),
    ('citrus_grapefruit', 'FL'): CropPhenology('citrus_grapefruit', 'florida', 3, 1, 55, 5500, 7100, 4400),
    ('citrus_tangerine', 'FL'): CropPhenology('citrus_tangerine', 'florida', 3, 20, 55, 4800, 5700, 1800),
    ('strawberry', 'FL'): CropPhenology('strawberry', 'florida', 10, 1, 50, 700, 1300, 1700),
    ('tomato', 'FL'): CropPhenology('tomato', 'florida', 9, 1, 50, 2400, 2600, 2400, max_temp=86),
    ('peach', 'GA'): CropPhenology('peach', 'georgia', 3, 15, 45, 1600, 2000, 1200),
    ('apple', 'WA'): CropPhenology('apple', 'washington', 4, 20, 43, 1800, 2400, 1400),
    ('apple', 'MI'): CropPhenology('apple', 'michigan', 5, 1, 43, 2000, 2400, 800),
    ('apple', 'NY'): CropPhenology('apple', 'new_york', 5, 1, 43, 1800, 2200, 1000),
    ('cherry', 'WA'): CropPhenology('cherry', 'washington', 4, 10, 40, 1100, 1400, 600),
    ('cherry', 'MI'): CropPhenology('cherry', 'michigan', 5, 1, 40, 900, 1200, 500),
    ('blueberry', 'MI'): CropPhenology('blueberry', 'michigan', 5, 15, 45, 900, 1200, 700),
    ('blueberry', 'NJ'): CropPhenology('blueberry', 'new_jersey', 5, 1, 45, 850, 1100, 600),
    ('pear', 'WA'): CropPhenology('pear', 'washington', 4, 5, 40, 2200, 2700, 1000),
    ('pear', 'OR'): CropPhenology('pear', 'oregon', 4, 5, 40, 2200, 2700, 1000),
}

# =============================================================================
# OPEN-METEO API
# =============================================================================

class OpenMeteoClient:
    """Client for Open-Meteo weather API (free, no API key required)."""

    HISTORICAL_URL = "https://archive-api.open-meteo.com/v1/archive"
    FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

    @staticmethod
    def celsius_to_fahrenheit(celsius: float) -> float:
        return celsius * 9 / 5 + 32

    def get_historical(self, lat: float, lon: float, start_date: datetime,
                       end_date: datetime) -> List[Dict]:
        """Fetch historical weather data from Open-Meteo archive."""
        params = {
            'latitude': lat,
            'longitude': lon,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'daily': 'temperature_2m_max,temperature_2m_min',
            'temperature_unit': 'celsius',
            'timezone': 'auto'
        }

        try:
            response = requests.get(self.HISTORICAL_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            if 'daily' not in data:
                print(f"  Warning: No daily data returned for {lat}, {lon}")
                return []

            daily = data['daily']
            observations = []

            for i, date_str in enumerate(daily['time']):
                t_max_c = daily['temperature_2m_max'][i]
                t_min_c = daily['temperature_2m_min'][i]

                if t_max_c is None or t_min_c is None:
                    continue

                observations.append({
                    'date': date_str,
                    'temp_high_f': self.celsius_to_fahrenheit(t_max_c),
                    'temp_low_f': self.celsius_to_fahrenheit(t_min_c),
                })

            return observations

        except requests.RequestException as e:
            print(f"  Error fetching weather data: {e}")
            return []

# =============================================================================
# GDD CALCULATION WITH 86/50 METHOD
# =============================================================================

def calculate_daily_gdd(temp_high_f: float, temp_low_f: float,
                        base_temp: float = 55.0,
                        max_temp: Optional[float] = None) -> float:
    """
    Calculate GDD for a single day using modified 86/50 method.

    The 86/50 method caps both high and low temperatures:
    - If max_temp is specified, cap temp_high at max_temp
    - Always cap temp_low at base_temp (no negative contribution)

    This is critical for heat-sensitive crops like tomatoes, lettuce,
    where development STOPS above certain temperatures.
    """
    # Apply upper temperature cap if specified (86/50 method)
    capped_high = min(temp_high_f, max_temp) if max_temp else temp_high_f

    # Cap low at base temp (no negative GDD)
    capped_low = max(temp_low_f, base_temp)

    # Average of capped temperatures
    avg_temp = (capped_high + capped_low) / 2

    return max(0, avg_temp - base_temp)

def calculate_cumulative_gdd(observations: List[Dict], base_temp: float,
                              max_temp: Optional[float] = None) -> float:
    """Calculate cumulative GDD from a list of daily observations."""
    total_gdd = 0
    for obs in observations:
        daily_gdd = calculate_daily_gdd(
            obs['temp_high_f'],
            obs['temp_low_f'],
            base_temp,
            max_temp
        )
        total_gdd += daily_gdd
    return total_gdd

# =============================================================================
# HARVEST WINDOW PREDICTION WITH ACTUAL WEATHER
# =============================================================================

def predict_harvest_window_actual(phenology: CropPhenology, state: str,
                                   year: int = 2024) -> Dict:
    """
    Predict harvest window using ACTUAL weather data from Open-Meteo.

    This replaces the estimated monthly GDD rates with real temperatures,
    applying the modified 86/50 method for heat-sensitive crops.
    """
    # Get coordinates for this state
    region_id = STATE_TO_REGION.get(state)
    if not region_id or region_id not in REGION_COORDINATES:
        return {'error': f'No coordinates for state {state}'}

    coords = REGION_COORDINATES[region_id]
    client = OpenMeteoClient()

    # Calculate date range: bloom date to 18 months later
    bloom_date = datetime(year, phenology.bloom_month, phenology.bloom_day)
    end_date = bloom_date + timedelta(days=550)

    # Cap end date to available data (Open-Meteo historical goes to ~5 days ago)
    max_date = datetime.now() - timedelta(days=5)
    if end_date > max_date:
        end_date = max_date

    print(f"  Fetching weather for {coords['name']} from {bloom_date.date()} to {end_date.date()}...")

    # Fetch actual weather data
    observations = client.get_historical(coords['lat'], coords['lon'], bloom_date, end_date)

    if not observations:
        return {'error': 'No weather data available'}

    print(f"  Got {len(observations)} days of weather data")

    # Accumulate GDD day by day with proper temp capping
    base_temp = phenology.gdd_base
    max_temp = phenology.max_temp  # For 86/50 method

    gdd_accumulated = 0
    maturity_date = None
    peak_date = None
    window_end_date = None

    gdd_window_end = phenology.gdd_to_maturity + phenology.gdd_window

    daily_gdd_values = []

    for i, obs in enumerate(observations):
        daily_gdd = calculate_daily_gdd(
            obs['temp_high_f'],
            obs['temp_low_f'],
            base_temp,
            max_temp
        )
        gdd_accumulated += daily_gdd
        daily_gdd_values.append(daily_gdd)

        obs_date = datetime.strptime(obs['date'], '%Y-%m-%d')

        if maturity_date is None and gdd_accumulated >= phenology.gdd_to_maturity:
            maturity_date = obs_date
        if peak_date is None and gdd_accumulated >= phenology.gdd_to_peak:
            peak_date = obs_date
        if window_end_date is None and gdd_accumulated >= gdd_window_end:
            window_end_date = obs_date

    # Calculate harvest months
    harvest_months = []
    if maturity_date and window_end_date:
        current = maturity_date
        while current <= window_end_date:
            if current.month not in harvest_months:
                harvest_months.append(current.month)
            current += timedelta(days=15)

    avg_daily_gdd = sum(daily_gdd_values) / len(daily_gdd_values) if daily_gdd_values else 0

    return {
        'bloom_date': bloom_date.strftime('%Y-%m-%d'),
        'maturity_date': maturity_date.strftime('%Y-%m-%d') if maturity_date else None,
        'peak_date': peak_date.strftime('%Y-%m-%d') if peak_date else None,
        'window_end_date': window_end_date.strftime('%Y-%m-%d') if window_end_date else None,
        'predicted_harvest_months': sorted(harvest_months),
        'days_to_maturity': (maturity_date - bloom_date).days if maturity_date else None,
        'days_to_peak': (peak_date - bloom_date).days if peak_date else None,
        'total_gdd_accumulated': round(gdd_accumulated, 1),
        'avg_daily_gdd': round(avg_daily_gdd, 2),
        'observation_days': len(observations),
        'method': '86/50' if max_temp else 'standard',
        'max_temp_cap': max_temp,
    }

# =============================================================================
# VALIDATION
# =============================================================================

def load_farm_data() -> Dict:
    """Load farm harvest data (ground truth)."""
    base_path = Path(__file__).parent
    with open(base_path / 'localharvest-farms.json') as f:
        return json.load(f)

def get_farm_harvest_months(farms_data: Dict, crop: str, state: str) -> List[int]:
    """Extract harvest months for a crop/state from farm data."""
    state_data = farms_data.get('states', {}).get(state, {})
    all_months = set()

    for farm in state_data.get('farms', []):
        for product_key, product_data in farm.get('productsAndSeasons', {}).items():
            # Match crop name (flexible)
            if crop.replace('citrus_', '').replace('_', ' ') in product_key.lower():
                months = product_data.get('harvestMonths', [])
                all_months.update(months)

    return sorted(all_months)

def months_overlap(months1: List[int], months2: List[int]) -> float:
    """Calculate overlap percentage between two month sets."""
    set1 = set(months1)
    set2 = set(months2)
    if not set1 or not set2:
        return 0.0
    intersection = set1 & set2
    union = set1 | set2
    return len(intersection) / len(union) * 100

def run_validation():
    """Run validation with actual weather data."""
    print("=" * 80)
    print("GDD VALIDATION WITH ACTUAL WEATHER DATA (Open-Meteo API)")
    print("=" * 80)
    print()
    print("Using real historical weather with modified 86/50 method for temp capping")
    print()

    farms_data = load_farm_data()

    results = []

    for (crop, state), phenology in CROP_PHENOLOGY.items():
        print(f"\n{crop} ({state}):")

        # Get farm ground truth
        actual_months = get_farm_harvest_months(farms_data, crop, state)
        if not actual_months:
            print(f"  No farm data for {crop} in {state}")
            continue

        # Predict with actual weather
        prediction = predict_harvest_window_actual(phenology, state, year=2024)

        if 'error' in prediction:
            print(f"  Error: {prediction['error']}")
            continue

        predicted_months = prediction['predicted_harvest_months']
        overlap = months_overlap(predicted_months, actual_months)

        print(f"  GDD Method: {prediction['method']}" +
              (f" (capped at {prediction['max_temp_cap']}°F)" if prediction['max_temp_cap'] else ""))
        print(f"  Avg daily GDD: {prediction['avg_daily_gdd']}")
        print(f"  Days to maturity: {prediction['days_to_maturity']}")
        print(f"  Predicted months: {predicted_months}")
        print(f"  Farm actual months: {actual_months}")
        print(f"  Overlap: {overlap:.1f}%")

        results.append({
            'crop': crop,
            'state': state,
            'bloom_date': prediction['bloom_date'],
            'gdd_method': prediction['method'],
            'max_temp_cap': prediction['max_temp_cap'],
            'avg_daily_gdd': prediction['avg_daily_gdd'],
            'days_to_maturity': prediction['days_to_maturity'],
            'days_to_peak': prediction['days_to_peak'],
            'predicted_months': predicted_months,
            'actual_farm_months': actual_months,
            'overlap_pct': round(overlap, 1),
            'status': 'GOOD' if overlap >= 70 else 'NEEDS_CALIBRATION' if overlap >= 40 else 'POOR'
        })

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY: ACTUAL WEATHER vs ESTIMATED RATES")
    print("=" * 80)

    if results:
        avg_overlap = sum(r['overlap_pct'] for r in results) / len(results)
        good = sum(1 for r in results if r['status'] == 'GOOD')
        needs_cal = sum(1 for r in results if r['status'] == 'NEEDS_CALIBRATION')
        poor = sum(1 for r in results if r['status'] == 'POOR')

        print(f"\nTotal crop×region combinations: {len(results)}")
        print(f"Average overlap with farm data: {avg_overlap:.1f}%")
        print(f"Well-calibrated (>=70%): {good}")
        print(f"Needs calibration (40-69%): {needs_cal}")
        print(f"Poor fit (<40%): {poor}")

        print("\n86/50 Method Usage:")
        with_86_50 = [r for r in results if r['max_temp_cap']]
        print(f"  Crops using max_temp cap: {len(with_86_50)}")
        for r in with_86_50:
            print(f"    - {r['crop']} ({r['state']}): capped at {r['max_temp_cap']}°F")

    # Save results
    output = {
        'validationDate': datetime.now().strftime('%Y-%m-%d'),
        'dataSource': 'Open-Meteo Historical API',
        'method': 'Actual weather with modified 86/50',
        'results': results,
        'summary': {
            'avgOverlap': round(avg_overlap, 1) if results else 0,
            'wellCalibrated': good if results else 0,
            'needsCalibration': needs_cal if results else 0,
            'poorFit': poor if results else 0,
        }
    }

    base_path = Path(__file__).parent
    with open(base_path / 'gdd-actual-weather-results.json', 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nResults saved to gdd-actual-weather-results.json")

if __name__ == '__main__':
    run_validation()
