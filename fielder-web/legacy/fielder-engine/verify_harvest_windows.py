#!/usr/bin/env python3
"""
Validate harvest window predictions against known reference data.

This script checks each crop/region combination to ensure predicted
harvest windows align with real-world expectations.
"""

import requests
import json
from datetime import date

# Known correct harvest windows from agricultural extension sources
# Format: (crop, region) -> {"harvest_months": [list], "peak_months": [list], "source": "..."}
REFERENCE_DATA = {
    # === CITRUS (Florida) ===
    ("navel_orange", "indian_river"): {
        "harvest_months": [11, 12, 1],  # Nov-Jan
        "peak_months": [12, 1],          # Dec-Jan
        "source": "UF/IFAS"
    },
    ("valencia", "indian_river"): {
        "harvest_months": [3, 4, 5, 6],  # Mar-Jun
        "peak_months": [4, 5],            # Apr-May
        "source": "UF/IFAS"
    },
    ("grapefruit", "indian_river"): {
        "harvest_months": [11, 12, 1, 2, 3, 4, 5],  # Nov-May
        "peak_months": [1, 2, 3],         # Jan-Mar
        "source": "UF/IFAS"
    },
    ("satsuma", "sweet_valley"): {
        "harvest_months": [10, 11],       # Oct-Nov
        "peak_months": [10, 11],          # Late Oct-Early Nov
        "source": "UF/IFAS"
    },
    ("tangerine", "indian_river"): {
        "harvest_months": [11, 12],       # Nov-Dec
        "peak_months": [12],              # December
        "source": "UF/IFAS"
    },

    # === CITRUS (Texas) ===
    ("grapefruit", "texas_rgv"): {
        "harvest_months": [10, 11, 12, 1, 2, 3],  # Oct-Mar
        "peak_months": [12, 1, 2],        # Dec-Feb
        "source": "Texas A&M"
    },

    # === STONE FRUIT ===
    ("peach", "georgia_piedmont"): {
        "harvest_months": [5, 6, 7, 8],   # May-Aug
        "peak_months": [6, 7],            # Jun-Jul
        "source": "UGA Extension"
    },
    ("peach", "california_central_valley"): {
        "harvest_months": [5, 6, 7, 8, 9],  # May-Sep
        "peak_months": [6, 7, 8],         # Jun-Aug
        "source": "UC Davis"
    },
    ("sweet_cherry", "pacific_nw_yakima"): {
        "harvest_months": [6, 7],         # Jun-Jul
        "peak_months": [6, 7],            # Jun-Jul (short window)
        "source": "WSU Extension"
    },
    ("tart_cherry", "michigan_west"): {
        "harvest_months": [7],            # July
        "peak_months": [7],               # Mid-July
        "source": "MSU Extension"
    },

    # === POME FRUIT ===
    ("apple", "pacific_nw_wenatchee"): {
        "harvest_months": [8, 9, 10, 11], # Aug-Nov (varies by cultivar)
        "peak_months": [9, 10],           # Sep-Oct
        "source": "WSU Extension"
    },
    ("apple", "michigan_west"): {
        "harvest_months": [8, 9, 10],     # Aug-Oct
        "peak_months": [9, 10],           # Sep-Oct
        "source": "MSU Extension"
    },
    ("pear", "pacific_nw_hood_river"): {
        "harvest_months": [8, 9, 10],     # Aug-Oct
        "peak_months": [8, 9],            # Aug-Sep (Bartlett)
        "source": "OSU Extension"
    },

    # === BERRIES ===
    ("strawberry", "central_florida"): {
        "harvest_months": [12, 1, 2, 3],  # Dec-Mar
        "peak_months": [1, 2],            # Jan-Feb
        "source": "UF/IFAS"
    },
    ("blueberry", "michigan_west"): {
        "harvest_months": [7, 8],         # Jul-Aug
        "peak_months": [7, 8],            # Jul-Aug
        "source": "MSU Extension"
    },

    # === TROPICAL ===
    ("mango", "south_florida"): {
        "harvest_months": [6, 7, 8],      # Jun-Aug
        "peak_months": [6, 7],            # Jun-Jul
        "source": "UF/IFAS Homestead"
    },
    ("pomegranate", "california_central_valley"): {
        "harvest_months": [9, 10, 11],    # Sep-Nov
        "peak_months": [10, 11],          # Oct-Nov
        "source": "UC Davis"
    },

    # === NUTS ===
    ("pecan", "texas_pecan_belt"): {
        "harvest_months": [10, 11, 12],   # Oct-Dec
        "peak_months": [11],              # November
        "source": "Texas A&M"
    },
}

def parse_month(date_str):
    """Extract month from date string like 'August 02' or 'August 02, 2025'."""
    month_names = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12
    }
    for name, num in month_names.items():
        if name in date_str:
            return num
    return None

def get_months_in_range(start_month, end_month):
    """Get list of months between start and end, handling year wrap."""
    if start_month is None or end_month is None:
        return []

    months = []
    m = start_month
    while True:
        months.append(m)
        if m == end_month:
            break
        m = (m % 12) + 1
        if len(months) > 12:  # Safety limit
            break
    return months


def validate_prediction(crop, region, prediction, reference):
    """Check if prediction aligns with reference data."""
    issues = []

    # Parse harvest start/end months
    harvest_start = parse_month(prediction.get('harvest_start_date', ''))
    harvest_end = parse_month(prediction.get('harvest_end_date', ''))
    optimal_start = parse_month(prediction.get('optimal_start_date', ''))
    optimal_end = parse_month(prediction.get('optimal_end_date', ''))

    ref_harvest = reference['harvest_months']
    ref_peak = reference['peak_months']

    # Check harvest start
    if harvest_start and harvest_start not in ref_harvest:
        # Allow 1 month tolerance
        if harvest_start not in [m - 1 for m in ref_harvest] + [m + 1 for m in ref_harvest]:
            issues.append(f"Harvest start ({harvest_start}) not in expected {ref_harvest}")

    # Check harvest end
    if harvest_end and harvest_end not in ref_harvest:
        if harvest_end not in [m - 1 for m in ref_harvest] + [m + 1 for m in ref_harvest]:
            issues.append(f"Harvest end ({harvest_end}) not in expected {ref_harvest}")

    # Check optimal window OVERLAPS with peak months (not just starts in them)
    optimal_months = get_months_in_range(optimal_start, optimal_end)
    peak_overlap = set(optimal_months) & set(ref_peak)

    if optimal_start and not peak_overlap:
        # No overlap at all - this is a real failure
        # Also allow 1 month tolerance on the start
        tolerant_peak = set(ref_peak)
        for m in ref_peak:
            tolerant_peak.add((m - 2) % 12 + 1)  # Month before
            tolerant_peak.add((m % 12) + 1)      # Month after

        if not (set(optimal_months) & tolerant_peak):
            issues.append(f"Optimal window ({optimal_months}) doesn't overlap with peak {ref_peak}")

    return issues

def main():
    base_url = "http://localhost:5000"

    print("=" * 70)
    print("HARVEST WINDOW VALIDATION REPORT")
    print("=" * 70)
    print()

    passed = 0
    failed = 0
    errors = 0

    for (crop, region), reference in REFERENCE_DATA.items():
        try:
            response = requests.post(
                f"{base_url}/predict",
                json={"crop": crop, "region": region},
                timeout=10
            )

            if response.status_code != 200:
                print(f"ERROR: {crop}/{region} - HTTP {response.status_code}")
                errors += 1
                continue

            data = response.json()

            if 'error' in data:
                print(f"ERROR: {crop}/{region} - {data['error']}")
                errors += 1
                continue

            issues = validate_prediction(crop, region, data, reference)

            # Display result
            harvest = f"{data.get('harvest_start_date', '?')} - {data.get('harvest_end_date', '?')}"
            optimal = f"{data.get('optimal_start_date', '?')} - {data.get('optimal_end_date', '?')}"

            if issues:
                print(f"FAIL: {crop} / {region}")
                print(f"      Predicted: {harvest}")
                print(f"      Optimal:   {optimal}")
                print(f"      Expected:  {reference['harvest_months']} (peak: {reference['peak_months']})")
                for issue in issues:
                    print(f"      - {issue}")
                failed += 1
            else:
                print(f"PASS: {crop} / {region}")
                print(f"      Harvest: {harvest}, Optimal: {optimal}")
                passed += 1

            print()

        except requests.exceptions.RequestException as e:
            print(f"ERROR: {crop}/{region} - Connection failed: {e}")
            errors += 1

    print("=" * 70)
    print(f"SUMMARY: {passed} passed, {failed} failed, {errors} errors")
    print(f"         out of {len(REFERENCE_DATA)} crop/region combinations")
    print("=" * 70)

    # Return exit code
    return 0 if failed == 0 and errors == 0 else 1

if __name__ == "__main__":
    exit(main())
