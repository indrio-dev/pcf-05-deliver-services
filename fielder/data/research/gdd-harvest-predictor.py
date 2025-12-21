#!/usr/bin/env python3
"""
GDD-Based Harvest Prediction Validator

Wires up GDD calculations with baseline farm/extension/state data.
Compares GDD-predicted harvest windows against actual farm-reported timing.

GDD Formula: GDD = max(0, (Tmax + Tmin) / 2 - base_temp)

This script validates the GDD model by comparing predictions to ground truth.
"""

import json
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, List, Dict

# =============================================================================
# GDD CONFIGURATION (mirrors TypeScript gdd-targets.ts)
# =============================================================================

@dataclass
class GDDTarget:
    base_temp: float          # Temperature (F) below which no GDD accumulates
    gdd_to_maturity: int      # GDD from bloom to harvest-ready
    gdd_to_peak: int          # GDD from bloom to peak quality
    gdd_window: int           # GDD range during which quality remains high
    max_temp: Optional[float] = None  # Upper developmental threshold
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

# GDD targets by crop - CALIBRATED 2025-12-21 based on farm ground truth
CROP_GDD_TARGETS = {
    'citrus_orange': GDDTarget(55, 5100, 6100, 3500, notes="CALIBRATED: Oct-May (8mo) from farm data"),
    'citrus_grapefruit': GDDTarget(55, 5500, 7100, 4400, notes="VALIDATED: Perfect 100% overlap"),
    'citrus_tangerine': GDDTarget(55, 4800, 5700, 1800, notes="CALIBRATED: Nov-Feb from farm data"),
    'strawberry': GDDTarget(50, 700, 1300, 1700, notes="CALIBRATED: Dec-Apr from farm data"),
    'tomato': GDDTarget(50, 2400, 2600, 2400, max_temp=86, notes="CALIBRATED: Bimodal FL (fall+spring)"),
    'pepper': GDDTarget(55, 2200, 2500, 900, max_temp=95, notes="Sweet peppers"),
    'apple': GDDTarget(43, 1800, 2400, 1400, notes="CALIBRATED: Aug-Nov HARVEST (storage extends)"),
    'peach': GDDTarget(45, 1600, 2000, 1200, notes="CALIBRATED: May-Sept cultivar staggering"),
    'cherry': GDDTarget(40, 1100, 1400, 600, notes="CALIBRATED: Jun-Aug cultivar staggering"),
    'blueberry': GDDTarget(45, 900, 1200, 700, notes="CALIBRATED: 3mo window for cultivar types"),
    'pear': GDDTarget(40, 2200, 2700, 1000, notes="CALIBRATED: Aug-Oct from farm data"),
}

# Regional phenology - CALIBRATED 2025-12-21 based on farm ground truth
CROP_PHENOLOGY = {
    ('citrus_orange', 'FL'): CropPhenology('citrus_orange', 'florida', 3, 15, 55, 5100, 6100, 3500),
    ('citrus_grapefruit', 'FL'): CropPhenology('citrus_grapefruit', 'florida', 3, 1, 55, 5500, 7100, 4400),
    ('citrus_tangerine', 'FL'): CropPhenology('citrus_tangerine', 'florida', 3, 20, 55, 4800, 5700, 1800),
    ('strawberry', 'FL'): CropPhenology('strawberry', 'florida', 10, 1, 50, 700, 1300, 1700),
    ('tomato', 'FL'): CropPhenology('tomato', 'florida', 9, 1, 50, 2400, 2600, 2400),
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

# Regional average GDD per day by month (from gdd.ts estimateAverageGDDPerDay)
# [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
REGIONAL_GDD_RATES = {
    'FL': [15, 17, 20, 23, 25, 26, 26, 26, 25, 22, 18, 15],
    'CA': [10, 12, 15, 18, 22, 25, 28, 27, 24, 19, 13, 10],
    'TX': [12, 14, 18, 22, 26, 28, 30, 30, 27, 22, 16, 12],
    'GA': [8, 10, 15, 20, 24, 27, 28, 28, 25, 18, 12, 8],
    'WA': [2, 4, 8, 12, 16, 20, 24, 23, 18, 11, 5, 2],
    'MI': [0, 2, 6, 12, 18, 22, 25, 24, 18, 10, 4, 0],
    'NY': [0, 2, 6, 12, 18, 22, 25, 24, 18, 10, 4, 0],
    'PA': [0, 2, 6, 12, 18, 22, 25, 24, 18, 10, 4, 0],
    'NJ': [2, 4, 8, 14, 20, 24, 26, 25, 20, 12, 6, 2],
    'OR': [2, 4, 8, 12, 16, 20, 24, 23, 18, 11, 5, 2],
    'OH': [0, 2, 6, 12, 18, 22, 25, 24, 18, 10, 4, 0],
    'NC': [6, 8, 12, 18, 22, 26, 28, 27, 24, 16, 10, 6],
    'SC': [8, 10, 14, 20, 24, 27, 28, 28, 25, 18, 12, 8],
    'default': [5, 7, 12, 16, 20, 24, 26, 25, 20, 14, 8, 5],
}

# =============================================================================
# GDD CALCULATION FUNCTIONS
# =============================================================================

def calculate_daily_gdd(temp_max: float, temp_min: float, base_temp: float = 55,
                        max_temp: float = None) -> float:
    """Calculate GDD for a single day using modified 86/50 method if max_temp provided."""
    capped_max = min(temp_max, max_temp) if max_temp else temp_max
    capped_min = max(temp_min, base_temp)
    avg_temp = (capped_max + capped_min) / 2
    return max(0, avg_temp - base_temp)

def estimate_gdd_per_day(state: str, month: int) -> float:
    """Get estimated average daily GDD for a state/month."""
    rates = REGIONAL_GDD_RATES.get(state, REGIONAL_GDD_RATES['default'])
    return rates[month - 1]

def predict_harvest_month_from_gdd(bloom_date: datetime, gdd_target: int,
                                    state: str) -> int:
    """Predict which month harvest occurs based on GDD accumulation."""
    accumulated_gdd = 0
    current_date = bloom_date

    # Accumulate GDD day by day until target reached
    while accumulated_gdd < gdd_target:
        daily_gdd = estimate_gdd_per_day(state, current_date.month)
        accumulated_gdd += daily_gdd
        current_date += timedelta(days=1)

        # Safety: don't go more than 18 months
        if (current_date - bloom_date).days > 550:
            break

    return current_date.month

def predict_harvest_window(phenology: CropPhenology, state: str, year: int = 2025) -> Dict:
    """Predict harvest window based on GDD from bloom date."""
    bloom_date = datetime(year, phenology.bloom_month, phenology.bloom_day)

    # Calculate dates for maturity, peak, and window end
    gdd_accumulated = 0
    current_date = bloom_date
    maturity_date = None
    peak_date = None
    window_end_date = None

    gdd_window_end = phenology.gdd_to_maturity + phenology.gdd_window

    while gdd_accumulated < gdd_window_end + 500:  # Go a bit past window
        daily_gdd = estimate_gdd_per_day(state, current_date.month)
        gdd_accumulated += daily_gdd

        if maturity_date is None and gdd_accumulated >= phenology.gdd_to_maturity:
            maturity_date = current_date
        if peak_date is None and gdd_accumulated >= phenology.gdd_to_peak:
            peak_date = current_date
        if window_end_date is None and gdd_accumulated >= gdd_window_end:
            window_end_date = current_date

        current_date += timedelta(days=1)
        if (current_date - bloom_date).days > 550:
            break

    # Convert to harvest months
    harvest_months = []
    if maturity_date and window_end_date:
        current = maturity_date
        while current <= window_end_date:
            if current.month not in harvest_months:
                harvest_months.append(current.month)
            current += timedelta(days=15)  # Sample every 2 weeks

    return {
        'bloom_date': bloom_date.strftime('%Y-%m-%d'),
        'maturity_date': maturity_date.strftime('%Y-%m-%d') if maturity_date else None,
        'peak_date': peak_date.strftime('%Y-%m-%d') if peak_date else None,
        'window_end_date': window_end_date.strftime('%Y-%m-%d') if window_end_date else None,
        'predicted_harvest_months': sorted(harvest_months),
        'days_to_maturity': (maturity_date - bloom_date).days if maturity_date else None,
        'days_to_peak': (peak_date - bloom_date).days if peak_date else None,
    }

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

def load_json(filepath):
    with open(filepath) as f:
        return json.load(f)

def months_overlap(months1, months2):
    """Calculate overlap between two month sets."""
    set1 = set(months1) if months1 else set()
    set2 = set(months2) if months2 else set()
    if not set1 or not set2:
        return 0, 0, 0
    intersection = set1 & set2
    union = set1 | set2
    overlap_pct = len(intersection) / len(union) * 100 if union else 0
    return len(intersection), len(union), overlap_pct

def extract_farm_harvest_months(farms_data, state_code):
    """Extract harvest months from farm data for a state."""
    state_data = farms_data.get('states', {}).get(state_code, {})
    products = defaultdict(list)

    for farm in state_data.get('farms', []):
        for product_key, product_data in farm.get('productsAndSeasons', {}).items():
            harvest_months = product_data.get('harvestMonths', [])
            if harvest_months:
                products[product_key].append({
                    'farm': farm.get('farmName', 'Unknown'),
                    'months': harvest_months
                })

    return products

def validate_gdd_predictions(farms_data):
    """Compare GDD predictions to actual farm harvest data."""
    results = []

    for (crop_key, state), phenology in CROP_PHENOLOGY.items():
        # Get farm data for this crop in this state
        farm_products = extract_farm_harvest_months(farms_data, state)

        # Find matching farm product
        matching_farms = None
        for farm_key, farm_entries in farm_products.items():
            if crop_key in farm_key or farm_key in crop_key:
                matching_farms = farm_entries
                break

        if not matching_farms:
            continue

        # Aggregate farm months
        actual_months = set()
        for entry in matching_farms:
            actual_months.update(entry['months'])

        # Get GDD prediction
        prediction = predict_harvest_window(phenology, state)
        predicted_months = prediction['predicted_harvest_months']

        # Calculate overlap
        intersection, union, overlap_pct = months_overlap(
            list(actual_months), predicted_months
        )

        results.append({
            'crop': crop_key,
            'state': state,
            'bloom_date': prediction['bloom_date'],
            'gdd_to_maturity': phenology.gdd_to_maturity,
            'gdd_to_peak': phenology.gdd_to_peak,
            'days_to_maturity': prediction['days_to_maturity'],
            'days_to_peak': prediction['days_to_peak'],
            'predicted_months': predicted_months,
            'actual_farm_months': sorted(actual_months),
            'overlap_pct': round(overlap_pct, 1),
            'farm_count': len(matching_farms),
            'status': 'GOOD' if overlap_pct >= 70 else 'NEEDS_CALIBRATION' if overlap_pct >= 40 else 'POOR'
        })

    return results

# =============================================================================
# MAIN
# =============================================================================

def main():
    base_path = Path(__file__).parent
    farms_data = load_json(base_path / 'localharvest-farms.json')

    print("=" * 80)
    print("GDD HARVEST PREDICTION VALIDATOR")
    print("=" * 80)
    print()
    print("Compares GDD-based predictions to actual farm harvest data (ground truth)")
    print()

    # Validate predictions
    results = validate_gdd_predictions(farms_data)

    print("-" * 80)
    print("GDD PREDICTIONS vs FARM DATA")
    print("-" * 80)
    print()

    # Group by status
    good = [r for r in results if r['status'] == 'GOOD']
    needs_cal = [r for r in results if r['status'] == 'NEEDS_CALIBRATION']
    poor = [r for r in results if r['status'] == 'POOR']

    print(f"WELL-CALIBRATED ({len(good)} crops, >=70% overlap):")
    for r in good:
        print(f"  {r['crop']} ({r['state']}): {r['overlap_pct']}% overlap")
        print(f"    GDD: {r['gdd_to_maturity']} → {r['days_to_maturity']} days")
        print(f"    Predicted: {r['predicted_months']}")
        print(f"    Actual:    {r['actual_farm_months']}")
    print()

    if needs_cal:
        print(f"NEEDS CALIBRATION ({len(needs_cal)} crops, 40-69% overlap):")
        for r in needs_cal:
            print(f"  {r['crop']} ({r['state']}): {r['overlap_pct']}% overlap")
            print(f"    Predicted: {r['predicted_months']}")
            print(f"    Actual:    {r['actual_farm_months']}")
            # Suggest calibration
            pred_center = sum(r['predicted_months']) / len(r['predicted_months']) if r['predicted_months'] else 0
            actual_center = sum(r['actual_farm_months']) / len(r['actual_farm_months']) if r['actual_farm_months'] else 0
            shift = actual_center - pred_center
            if abs(shift) > 0.5:
                direction = "earlier" if shift < 0 else "later"
                print(f"    -> Shift GDD target ~{abs(int(shift * 30 * 20))} GDD {direction}")
        print()

    if poor:
        print(f"POOR FIT ({len(poor)} crops, <40% overlap):")
        for r in poor:
            print(f"  {r['crop']} ({r['state']}): {r['overlap_pct']}% overlap")
            print(f"    Predicted: {r['predicted_months']}")
            print(f"    Actual:    {r['actual_farm_months']}")
            print(f"    -> Major recalibration needed or regional phenology missing")
        print()

    # Summary statistics
    print("-" * 80)
    print("SUMMARY")
    print("-" * 80)
    avg_overlap = sum(r['overlap_pct'] for r in results) / len(results) if results else 0
    print(f"Total crop×region combinations tested: {len(results)}")
    print(f"Average overlap with farm data: {avg_overlap:.1f}%")
    print(f"Well-calibrated (>=70%): {len(good)}")
    print(f"Needs calibration (40-69%): {len(needs_cal)}")
    print(f"Poor fit (<40%): {len(poor)}")
    print()

    # GDD rate analysis
    print("-" * 80)
    print("GDD ACCUMULATION RATES (estimated)")
    print("-" * 80)
    for state in ['FL', 'GA', 'CA', 'TX', 'WA', 'MI', 'NY']:
        annual_gdd = sum(REGIONAL_GDD_RATES.get(state, REGIONAL_GDD_RATES['default'])) * 30
        avg_daily = annual_gdd / 365
        print(f"  {state}: ~{annual_gdd} GDD/year, ~{avg_daily:.1f} GDD/day average")
    print()

    # Write results
    output = {
        'validationDate': '2025-12-21',
        'totalCombinations': len(results),
        'averageOverlap': round(avg_overlap, 1),
        'wellCalibrated': len(good),
        'needsCalibration': len(needs_cal),
        'poorFit': len(poor),
        'results': results
    }

    with open(base_path / 'gdd-validation-results.json', 'w') as f:
        json.dump(output, f, indent=2)

    print("=" * 80)
    print("Results saved to gdd-validation-results.json")
    print("=" * 80)
    print()
    print("NEXT STEPS:")
    print("  1. Adjust GDD targets for crops marked 'NEEDS_CALIBRATION'")
    print("  2. Add regional phenology for crops marked 'POOR'")
    print("  3. Integrate real weather data for actual GDD (vs estimated rates)")
    print("  4. Wire up to Fielder TypeScript prediction engine")

if __name__ == '__main__':
    main()
