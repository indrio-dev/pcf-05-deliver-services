#!/usr/bin/env python3
"""
Validate LocalHarvest farm data against state harvest calendars.
Four-way validation for Fielder harvest timing accuracy.
"""

import json
from collections import defaultdict
from pathlib import Path

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

def extract_farm_products(state_data):
    """Extract all products and their harvest months from farm data."""
    products = defaultdict(list)
    for farm in state_data.get('farms', []):
        for product_key, product_data in farm.get('productsAndSeasons', {}).items():
            # Normalize product key
            normalized = product_key.lower().replace('_', ' ').replace('-', ' ')
            harvest_months = product_data.get('harvestMonths', [])
            if harvest_months:
                products[normalized].append({
                    'farm': farm.get('farmName', 'Unknown'),
                    'months': harvest_months
                })
    return products

def extract_calendar_products(state_data):
    """Extract products and harvest months from state calendar."""
    products = {}
    for product_key, product_data in state_data.get('products', {}).items():
        normalized = product_key.lower().replace('_', ' ').replace('-', ' ')
        products[normalized] = {
            'harvestMonths': product_data.get('harvestMonths', []),
            'peakMonths': product_data.get('peakMonths', []),
            'notes': product_data.get('notes', '')
        }
    return products

def find_matching_product(farm_product, calendar_products):
    """Find best matching product in calendar (fuzzy match)."""
    # Direct match
    if farm_product in calendar_products:
        return farm_product, calendar_products[farm_product]

    # Partial match
    for cal_product in calendar_products:
        if farm_product in cal_product or cal_product in farm_product:
            return cal_product, calendar_products[cal_product]
        # Handle citrus variants
        if 'citrus' in farm_product or 'orange' in farm_product:
            if 'citrus' in cal_product or 'orange' in cal_product:
                return cal_product, calendar_products[cal_product]
        if 'apple' in farm_product and 'apple' in cal_product:
            return cal_product, calendar_products[cal_product]
        if 'peach' in farm_product and 'peach' in cal_product:
            return cal_product, calendar_products[cal_product]
        if 'cherry' in farm_product and 'cherry' in cal_product:
            return cal_product, calendar_products[cal_product]
        if 'blueberry' in farm_product and 'blueberry' in cal_product:
            return cal_product, calendar_products[cal_product]
        if 'strawberry' in farm_product and 'strawberry' in cal_product:
            return cal_product, calendar_products[cal_product]

    return None, None

def validate_state(state_code, farm_state_data, calendar_state_data):
    """Validate a single state's farm data against calendar."""
    results = {
        'state': state_code,
        'farm_count': farm_state_data.get('totalFarms', 0),
        'matches': [],
        'discrepancies': [],
        'farm_only': [],
        'calendar_only': [],
        'agreement_score': 0
    }

    farm_products = extract_farm_products(farm_state_data)
    calendar_products = extract_calendar_products(calendar_state_data)

    matched_calendar = set()
    total_overlap = 0
    total_comparisons = 0

    for farm_product, farm_entries in farm_products.items():
        cal_product, cal_data = find_matching_product(farm_product, calendar_products)

        if cal_product:
            matched_calendar.add(cal_product)
            # Aggregate farm months
            all_farm_months = set()
            for entry in farm_entries:
                all_farm_months.update(entry['months'])

            cal_months = cal_data['harvestMonths']
            intersection, union, overlap_pct = months_overlap(list(all_farm_months), cal_months)

            total_overlap += overlap_pct
            total_comparisons += 1

            if overlap_pct >= 70:
                results['matches'].append({
                    'product': farm_product,
                    'calendar_product': cal_product,
                    'farm_months': sorted(all_farm_months),
                    'calendar_months': cal_months,
                    'overlap_pct': round(overlap_pct, 1),
                    'farm_count': len(farm_entries)
                })
            else:
                results['discrepancies'].append({
                    'product': farm_product,
                    'calendar_product': cal_product,
                    'farm_months': sorted(all_farm_months),
                    'calendar_months': cal_months,
                    'overlap_pct': round(overlap_pct, 1),
                    'farm_count': len(farm_entries),
                    'note': 'Low overlap - may indicate regional variation or data issue'
                })
        else:
            results['farm_only'].append({
                'product': farm_product,
                'farm_count': len(farm_entries)
            })

    # Products in calendar but not in farm data
    for cal_product in calendar_products:
        if cal_product not in matched_calendar:
            results['calendar_only'].append(cal_product)

    results['agreement_score'] = round(total_overlap / total_comparisons, 1) if total_comparisons else 0

    return results

def main():
    base_path = Path(__file__).parent

    farms_data = load_json(base_path / 'localharvest-farms.json')
    calendar_data = load_json(base_path / 'state-harvest-calendars.json')

    print("=" * 80)
    print("HARVEST DATA VALIDATION: LocalHarvest Farms vs State Calendars")
    print("=" * 80)
    print()

    all_results = []
    states_validated = 0
    states_with_calendar = 0

    for state_code, farm_state_data in farms_data.get('states', {}).items():
        if state_code in calendar_data.get('states', {}):
            calendar_state_data = calendar_data['states'][state_code]
            result = validate_state(state_code, farm_state_data, calendar_state_data)
            all_results.append(result)
            states_validated += 1
            states_with_calendar += 1
        else:
            all_results.append({
                'state': state_code,
                'farm_count': farm_state_data.get('totalFarms', 0),
                'note': 'No state calendar data available for comparison'
            })
            states_validated += 1

    # Summary
    print(f"States in farm data: {len(farms_data.get('states', {}))}")
    print(f"States with calendar data: {states_with_calendar}")
    print(f"Total farms: {farms_data.get('totalFarms', 0)}")
    print()

    # High agreement states
    print("-" * 80)
    print("HIGH AGREEMENT STATES (>= 70% overlap)")
    print("-" * 80)
    high_agreement = [r for r in all_results if r.get('agreement_score', 0) >= 70]
    for r in sorted(high_agreement, key=lambda x: x.get('agreement_score', 0), reverse=True):
        print(f"  {r['state']}: {r['agreement_score']}% agreement ({len(r.get('matches', []))} products matched)")
    print()

    # Moderate agreement
    print("-" * 80)
    print("MODERATE AGREEMENT (50-69% overlap)")
    print("-" * 80)
    moderate = [r for r in all_results if 50 <= r.get('agreement_score', 0) < 70]
    for r in sorted(moderate, key=lambda x: x.get('agreement_score', 0), reverse=True):
        print(f"  {r['state']}: {r['agreement_score']}% agreement")
        for d in r.get('discrepancies', [])[:3]:
            print(f"    - {d['product']}: Farm {d['farm_months']} vs Calendar {d['calendar_months']}")
    print()

    # Low/no agreement
    print("-" * 80)
    print("LOW/NO AGREEMENT or NO CALENDAR DATA")
    print("-" * 80)
    low = [r for r in all_results if r.get('agreement_score', 0) < 50 or 'note' in r]
    for r in low:
        if 'note' in r:
            print(f"  {r['state']}: {r['note']} ({r['farm_count']} farms)")
        else:
            print(f"  {r['state']}: {r.get('agreement_score', 0)}% agreement")
    print()

    # Detailed product matches
    print("-" * 80)
    print("DETAILED PRODUCT VALIDATION (sample)")
    print("-" * 80)

    for r in all_results:
        if r.get('agreement_score', 0) >= 70 and r.get('matches'):
            print(f"\n{r['state']} ({r['farm_count']} farms, {r['agreement_score']}% agreement):")
            for m in r['matches'][:5]:
                print(f"  {m['product']}: Farm {m['farm_months']} = Calendar {m['calendar_months']} ({m['overlap_pct']}%)")
            if r.get('discrepancies'):
                print(f"  Discrepancies:")
                for d in r['discrepancies'][:2]:
                    print(f"    {d['product']}: Farm {d['farm_months']} vs Calendar {d['calendar_months']} ({d['overlap_pct']}%)")

    # Write validation results to JSON
    output = {
        'validationDate': '2025-12-21',
        'summary': {
            'totalStates': len(farms_data.get('states', {})),
            'statesWithCalendar': states_with_calendar,
            'totalFarms': farms_data.get('totalFarms', 0),
            'highAgreement': len(high_agreement),
            'moderateAgreement': len(moderate),
            'lowAgreement': len([r for r in all_results if 0 < r.get('agreement_score', 0) < 50]),
            'noCalendarData': len([r for r in all_results if 'note' in r])
        },
        'stateResults': all_results
    }

    with open(base_path / 'validation-results.json', 'w') as f:
        json.dump(output, f, indent=2)

    print()
    print("=" * 80)
    print(f"Validation complete. Results saved to validation-results.json")
    print("=" * 80)

if __name__ == '__main__':
    main()
