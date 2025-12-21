#!/usr/bin/env python3
"""
Validate Seed Company data against LocalHarvest farm data.
Farm-level data is ground truth (Farm > Extension > State > Seed Company).

Seed companies provide planting windows + days to maturity.
We calculate expected harvest timing and compare to actual farm harvest months.
"""

import json
from collections import defaultdict
from pathlib import Path
from datetime import datetime, timedelta

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

def month_name_to_num(name):
    """Convert month name to number."""
    months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    }
    return months.get(name.lower(), 0)

def calculate_harvest_months(planting_months, days_to_maturity):
    """Calculate harvest months from planting months + days to maturity."""
    if not planting_months or not days_to_maturity:
        return []

    # Handle days_to_maturity that might be a dict or string
    if isinstance(days_to_maturity, dict):
        # Use the higher value (red ripe, etc.)
        days = max(days_to_maturity.values()) if days_to_maturity else 0
    elif isinstance(days_to_maturity, str):
        # Try to extract a number
        import re
        nums = re.findall(r'\d+', str(days_to_maturity))
        days = int(nums[0]) if nums else 0
    else:
        days = int(days_to_maturity)

    if days == 0:
        return []

    harvest_months = set()
    for plant_month in planting_months:
        if isinstance(plant_month, str):
            plant_month = month_name_to_num(plant_month)
        if plant_month == 0:
            continue

        # Calculate harvest month (approximate: 30 days per month)
        months_to_add = days // 30
        harvest_month = ((plant_month - 1 + months_to_add) % 12) + 1
        harvest_months.add(harvest_month)
        # Also add adjacent month for harvest window
        next_month = (harvest_month % 12) + 1
        harvest_months.add(next_month)

    return sorted(harvest_months)

def extract_burpee_harvest_timing(burpee_data):
    """Extract harvest timing from Burpee data (has explicit harvest windows)."""
    products = {}

    for cultivar in burpee_data.get('cultivars', []):
        crop = cultivar.get('crop', '').lower()
        name = cultivar.get('cultivarName', '')
        zones = cultivar.get('zones', {})

        # Collect all harvest months across Florida zones (8, 9, 10, 11)
        harvest_months = set()
        for zone, zone_data in zones.items():
            if zone in ['8', '9', '10', '11']:
                hw = zone_data.get('harvestWindow', {})
                # Parse "June 1" to month 6, etc.
                for key in ['start', 'end']:
                    if key in hw:
                        month_name = hw[key].split()[0]
                        month_num = month_name_to_num(month_name)
                        if month_num:
                            harvest_months.add(month_num)
                            # Fill in months between start and end
                            if key == 'start':
                                start_month = month_num
                            else:
                                end_month = month_num
                                # Add all months in range
                                current = start_month
                                while True:
                                    harvest_months.add(current)
                                    if current == end_month:
                                        break
                                    current = (current % 12) + 1
                                    if len(harvest_months) > 12:
                                        break

        if harvest_months:
            key = f"{crop}_{name.lower().replace(' ', '_')}"
            products[key] = {
                'crop': crop,
                'cultivar': name,
                'harvest_months': sorted(harvest_months),
                'source': 'Burpee explicit harvestWindow',
                'days_to_maturity': cultivar.get('daysToMaturity')
            }

    return products

def extract_marys_timing(marys_data):
    """Extract timing from Mary's data (planting months + days to maturity)."""
    products = {}

    for cultivar in marys_data.get('cultivars', []):
        crop = cultivar.get('crop', '').lower()
        name = cultivar.get('cultivarName', '')
        days = cultivar.get('daysToMaturity')

        # Collect planting months for central/south Florida (zones 9, 10)
        planting_months = []
        for timing in cultivar.get('floridaTimings', []):
            region = timing.get('region', '')
            if 'South' in region or 'Central' in region:
                planting_months.extend(timing.get('plantingMonths', []))

        # Convert to month numbers and deduplicate
        planting_month_nums = list(set(month_name_to_num(m) for m in planting_months if month_name_to_num(m)))

        if planting_month_nums and days:
            harvest_months = calculate_harvest_months(planting_month_nums, days)
            if harvest_months:
                key = f"{crop}_{name.lower().replace(' ', '_')}"
                products[key] = {
                    'crop': crop,
                    'cultivar': name,
                    'planting_months': sorted(planting_month_nums),
                    'days_to_maturity': days,
                    'calculated_harvest_months': harvest_months,
                    'source': "Mary's planting + DTM calculation"
                }

    return products

def extract_johnnys_timing(johnnys_data):
    """Extract timing from Johnny's data (days to maturity only)."""
    products = {}

    for cultivar in johnnys_data.get('cultivars', []):
        crop = cultivar.get('crop', '').lower()
        name = cultivar.get('cultivarName', '')
        days = cultivar.get('daysToMaturity')

        if days and days != 'not specified':
            key = f"{crop}_{name.lower().replace(' ', '_')}"
            products[key] = {
                'crop': crop,
                'cultivar': name,
                'days_to_maturity': days,
                'source': "Johnny's DTM only (no zone timing)"
            }

    return products

def extract_farm_harvest_months(farms_data, state_code):
    """Extract harvest months from farm data for a state."""
    state_data = farms_data.get('states', {}).get(state_code, {})
    products = defaultdict(list)

    for farm in state_data.get('farms', []):
        for product_key, product_data in farm.get('productsAndSeasons', {}).items():
            harvest_months = product_data.get('harvestMonths', [])
            if harvest_months:
                # Normalize product key
                normalized = product_key.lower().replace('_', ' ').replace('-', ' ')
                products[normalized].append({
                    'farm': farm.get('farmName', 'Unknown'),
                    'months': harvest_months
                })

    return products

def find_matching_seed_product(farm_product, seed_products):
    """Find matching seed company product."""
    farm_lower = farm_product.lower()

    for seed_key, seed_data in seed_products.items():
        crop = seed_data.get('crop', '').lower()
        cultivar = seed_data.get('cultivar', '').lower()

        # Match by crop type
        if crop in farm_lower or farm_lower in crop:
            return seed_key, seed_data

        # Match common crops
        if 'tomato' in farm_lower and crop == 'tomato':
            return seed_key, seed_data
        if 'strawberry' in farm_lower and crop == 'strawberry':
            return seed_key, seed_data
        if 'pepper' in farm_lower and crop == 'pepper':
            return seed_key, seed_data
        if 'melon' in farm_lower and (crop == 'melon' or crop == 'watermelon'):
            return seed_key, seed_data

    return None, None

def validate_florida_seed_companies(farms_data, burpee_data, marys_data, johnnys_data):
    """Validate Florida farm data against seed company data."""
    results = {
        'state': 'FL',
        'sources': ['Burpee', "Mary's Heirloom Seeds", "Johnny's Selected Seeds"],
        'matches': [],
        'discrepancies': [],
        'seed_only': [],
        'farm_only': [],
        'agreement_score': 0
    }

    # Extract seed company timing
    burpee_products = extract_burpee_harvest_timing(burpee_data)
    marys_products = extract_marys_timing(marys_data)
    johnnys_products = extract_johnnys_timing(johnnys_data)

    # Merge all seed products (prefer Burpee for explicit harvest windows)
    all_seed_products = {}
    all_seed_products.update(johnnys_products)
    all_seed_products.update(marys_products)
    all_seed_products.update(burpee_products)  # Overwrites with explicit windows

    # Get farm products
    farm_products = extract_farm_harvest_months(farms_data, 'FL')

    matched_seed = set()
    total_overlap = 0
    total_comparisons = 0

    for farm_product, farm_entries in farm_products.items():
        seed_key, seed_data = find_matching_seed_product(farm_product, all_seed_products)

        if seed_data:
            matched_seed.add(seed_key)

            # Get farm months
            all_farm_months = set()
            for entry in farm_entries:
                all_farm_months.update(entry['months'])

            # Get seed company expected harvest months
            seed_months = seed_data.get('harvest_months') or seed_data.get('calculated_harvest_months', [])

            if seed_months:
                intersection, union, overlap_pct = months_overlap(list(all_farm_months), seed_months)
                total_overlap += overlap_pct
                total_comparisons += 1

                comparison = {
                    'product': farm_product,
                    'seed_product': seed_key,
                    'farm_months': sorted(all_farm_months),
                    'seed_months': seed_months,
                    'overlap_pct': round(overlap_pct, 1),
                    'farm_count': len(farm_entries),
                    'seed_source': seed_data.get('source', 'Unknown'),
                    'days_to_maturity': seed_data.get('days_to_maturity')
                }

                if overlap_pct >= 50:  # Lower threshold for seed data (less precise)
                    results['matches'].append(comparison)
                else:
                    comparison['note'] = 'Seed company timing differs from farm reality'
                    results['discrepancies'].append(comparison)
            else:
                results['farm_only'].append({
                    'product': farm_product,
                    'farm_count': len(farm_entries),
                    'seed_info': f"DTM only: {seed_data.get('days_to_maturity')} days",
                    'note': 'Seed company has no harvest timing'
                })
        else:
            results['farm_only'].append({
                'product': farm_product,
                'farm_count': len(farm_entries),
                'note': 'No matching seed company data'
            })

    # Seed products not validated by farms
    for seed_key in all_seed_products:
        if seed_key not in matched_seed:
            results['seed_only'].append({
                'product': seed_key,
                'seed_data': all_seed_products[seed_key],
                'note': 'No farm validation available'
            })

    results['agreement_score'] = round(total_overlap / total_comparisons, 1) if total_comparisons else 0

    return results, burpee_products, marys_products, johnnys_products

def main():
    base_path = Path(__file__).parent

    farms_data = load_json(base_path / 'localharvest-farms.json')
    burpee_data = load_json(base_path / 'seed-company-burpee-florida.json')
    marys_data = load_json(base_path / 'seed-company-marys-florida.json')
    johnnys_data = load_json(base_path / 'seed-company-johnnys-florida.json')

    print("=" * 80)
    print("SEED COMPANY VALIDATION: Farm Data (Ground Truth) vs Seed Company Data")
    print("=" * 80)
    print()
    print("Validation Hierarchy: Farm > Extension > State > Seed Company")
    print("Seed companies provide planting guidance; farms show actual harvest reality.")
    print()

    results, burpee, marys, johnnys = validate_florida_seed_companies(
        farms_data, burpee_data, marys_data, johnnys_data
    )

    print("-" * 80)
    print("DATA SOURCE SUMMARY")
    print("-" * 80)
    print(f"  Burpee: {len(burpee)} cultivars with harvest windows (most detailed)")
    print(f"  Mary's: {len(marys)} cultivars with planting months + DTM")
    print(f"  Johnny's: {len(johnnys)} cultivars with DTM only")
    print()

    print("-" * 80)
    print("FLORIDA: LocalHarvest Farms vs Seed Companies")
    print("-" * 80)
    print(f"Agreement Score: {results['agreement_score']}%")
    print()

    if results['matches']:
        print("MATCHING PRODUCTS (>=50% overlap):")
        for m in results['matches']:
            print(f"  {m['product']}:")
            print(f"    Farm (ground truth): {m['farm_months']}")
            print(f"    Seed company: {m['seed_months']}")
            print(f"    Overlap: {m['overlap_pct']}% | Source: {m['seed_source']}")
        print()

    if results['discrepancies']:
        print("DISCREPANCIES (<50% overlap) - Farm data takes precedence:")
        for d in results['discrepancies']:
            print(f"  {d['product']}:")
            print(f"    Farm (ground truth): {d['farm_months']}")
            print(f"    Seed company: {d['seed_months']}")
            print(f"    Overlap: {d['overlap_pct']}%")
            print(f"    -> Seed company timing is inaccurate for this region")
        print()

    if results['farm_only']:
        print("FARM PRODUCTS WITHOUT SEED COMPANY MATCH:")
        for f in results['farm_only'][:5]:
            print(f"  {f['product']} ({f['farm_count']} farms)")
            if 'seed_info' in f:
                print(f"    Note: {f['seed_info']}")
        if len(results['farm_only']) > 5:
            print(f"  ... and {len(results['farm_only']) - 5} more")
        print()

    # Cross-validate days to maturity across seed companies
    print("-" * 80)
    print("DAYS TO MATURITY CROSS-VALIDATION")
    print("-" * 80)

    # Find cultivars in multiple sources
    dtm_comparison = defaultdict(dict)

    for data, source in [(burpee, 'Burpee'), (marys, "Mary's"), (johnnys, "Johnny's")]:
        for key, info in data.items():
            cultivar = info.get('cultivar', key)
            dtm = info.get('days_to_maturity')
            if dtm:
                dtm_comparison[cultivar.lower()][source] = dtm

    # Show cultivars with data from multiple sources
    multi_source = {k: v for k, v in dtm_comparison.items() if len(v) > 1}
    if multi_source:
        print("Cultivars with DTM from multiple sources:")
        for cultivar, sources in sorted(multi_source.items())[:10]:
            dtm_values = [f"{s}: {d}d" for s, d in sources.items()]
            print(f"  {cultivar.title()}: {' | '.join(dtm_values)}")
    print()

    # Summary
    print("=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    print()
    print("Key Findings:")
    print("  1. Burpee provides explicit harvest windows (most useful for validation)")
    print("  2. Mary's provides Florida-specific regional timing (planting months)")
    print("  3. Johnny's provides DTM only - no zone-specific guidance")
    print("  4. Calculated harvest timing from planting+DTM is approximate")
    print()
    print("Data Quality Ranking (for harvest timing):")
    print("  1. FARM DATA - Actual operational harvest (ground truth)")
    print("  2. EXTENSION - Regionally-calibrated recommendations")
    print("  3. STATE CALENDARS - Aggregate state-level timing")
    print("  4. SEED COMPANIES - Planting guidance, not harvest reality")
    print()
    print("Recommendation:")
    print("  - Use seed company data for cultivar selection and planting timing")
    print("  - Use farm/extension data for harvest window predictions")
    print("  - Cross-reference DTM across multiple sources for accuracy")

    # Write results
    output = {
        'validationDate': '2025-12-21',
        'hierarchy': 'Farm > Extension > State > Seed Company',
        'florida': results,
        'sources': {
            'burpee_cultivars': len(burpee),
            'marys_cultivars': len(marys),
            'johnnys_cultivars': len(johnnys)
        }
    }

    with open(base_path / 'seed-company-validation-results.json', 'w') as f:
        json.dump(output, f, indent=2)

    print()
    print("=" * 80)
    print("Results saved to seed-company-validation-results.json")
    print("=" * 80)

if __name__ == '__main__':
    main()
