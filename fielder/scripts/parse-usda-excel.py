#!/usr/bin/env python3
"""
Parse USDA Local Food Portal Excel Files

Converts the 5 USDA Excel files to consolidated JSON:
- onfarmmarket
- agritourism
- csa
- farmersmarket
- foodhub

Usage:
    python3 scripts/parse-usda-excel.py
"""

import openpyxl
import json
from pathlib import Path
from collections import Counter

DATA_DIR = Path('data/collected/usda-local-food')

FILES = {
    'onfarmmarket': 'onfarmmarket_2025-12220523.xlsx',
    'agritourism': 'agritourism_2025-12221846.xlsx',
    'csa': 'csa_2025-12221853.xlsx',
    'farmersmarket': 'farmersmarket_2025-1222192.xlsx',
    'foodhub': 'foodhub_2025-12221911.xlsx',
}

def parse_excel_file(filepath: Path, directory_type: str):
    """Parse a single USDA Excel file."""
    print(f"\n📄 Parsing {directory_type}...")
    print(f"   File: {filepath.name}")

    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    sheet = wb.active

    # Get headers from first row
    headers = []
    for cell in sheet[1]:
        headers.append(cell.value)

    print(f"   Columns: {len(headers)}")
    print(f"   Sample fields: {', '.join([h for h in headers[:5] if h])}")

    # Parse rows
    listings = []
    for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        if not any(row):  # Skip empty rows
            continue

        # Build record
        record = {'_directory': directory_type}
        for idx, value in enumerate(row):
            if idx < len(headers) and headers[idx]:
                record[headers[idx]] = value

        listings.append(record)

    print(f"   Records: {len(listings)}")

    wb.close()
    return listings, headers

def main():
    print('╔════════════════════════════════════════════════════════╗')
    print('║       PARSE USDA LOCAL FOOD PORTAL EXCEL FILES         ║')
    print('╚════════════════════════════════════════════════════════╝')

    all_listings = []
    all_headers = set()

    # Parse each file
    for directory_type, filename in FILES.items():
        filepath = DATA_DIR / filename

        if not filepath.exists():
            print(f"\n⚠️  File not found: {filename}")
            continue

        listings, headers = parse_excel_file(filepath, directory_type)
        all_listings.extend(listings)
        all_headers.update(headers)

    print(f"\n╔════════════════════════════════════════════════════════╗")
    print(f"║                    PARSING COMPLETE                    ║")
    print(f"╠════════════════════════════════════════════════════════╣")
    print(f"║  Total listings:     {len(all_listings):6}                          ║")
    print(f"║  Unique fields:      {len(all_headers):6}                          ║")
    print(f"╚════════════════════════════════════════════════════════╝")

    # Breakdown by directory
    by_directory = Counter(listing['_directory'] for listing in all_listings)
    print("\nBreakdown by directory:")
    for directory, count in sorted(by_directory.items(), key=lambda x: -x[1]):
        print(f"  {directory:20} {count:6}")

    # Breakdown by state
    state_counts = Counter()
    for listing in all_listings:
        state = listing.get('location_state') or listing.get('State') or listing.get('state')
        if state:
            state_counts[state] += 1

    print(f"\nStates represented: {len(state_counts)}")
    print("Top 10 states:")
    for state, count in state_counts.most_common(10):
        print(f"  {state}: {count}")

    # Save consolidated JSON
    output_file = DATA_DIR / 'usda-local-food-consolidated.json'
    output_data = {
        'source': 'USDA Local Food Portal',
        'collected_date': '2025-12-22',
        'directories': list(FILES.keys()),
        'total_listings': len(all_listings),
        'listings': all_listings
    }

    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2, default=str)

    print(f"\n💾 Saved to: {output_file}")
    print(f"   Size: {output_file.stat().st_size // 1024 // 1024} MB")

    # Show sample fields
    print(f"\nSample record fields:")
    if all_listings:
        sample = all_listings[0]
        for key in list(sample.keys())[:10]:
            value = sample[key]
            if value:
                print(f"  {key}: {str(value)[:50]}")

    print("\n✨ Parsing complete!")
    print("   Next: Generate entities for Knowledge Graph integration\n")

if __name__ == '__main__':
    main()
