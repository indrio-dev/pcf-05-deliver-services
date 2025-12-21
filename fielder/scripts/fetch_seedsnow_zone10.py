#!/usr/bin/env python3
"""
Fetch all cultivars from SeedsNow Zone 10 collection.
Uses Shopify's products.json API with pagination.
"""

import json
import requests
import time
from datetime import datetime
from pathlib import Path

BASE_URL = "https://www.seedsnow.com/collections/usda-hardiness-zone-10/products.json"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "research" / "seed-company-seedsnow-zone10.json"

def fetch_page(page_num):
    """Fetch a single page of products."""
    url = f"{BASE_URL}?page={page_num}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching page {page_num}: {e}")
        return None

def extract_cultivar_data(product):
    """Extract relevant data from a product object."""

    # Determine crop type from product type
    product_type = product.get('product_type', '').lower()

    if 'flower' in product_type:
        crop_category = 'flower'
    elif 'herb' in product_type or product.get('vendor', '').lower() == 'seedsnow-herbs':
        crop_category = 'herb'
    else:
        crop_category = 'vegetable'

    # Extract tags for additional info
    tags = product.get('tags', [])

    # Parse body_html for days to maturity and scientific name
    body_html = product.get('body_html', '')
    days_to_maturity = None
    scientific_name = None

    # Look for days to maturity patterns
    if 'days to maturity' in body_html.lower():
        import re
        match = re.search(r'(\d+)\s*(?:-\s*\d+)?\s*days?\s+to\s+maturity', body_html, re.IGNORECASE)
        if match:
            days_to_maturity = int(match.group(1))

    # Look for scientific name in italics or parentheses
    if '<em>' in body_html or '<i>' in body_html:
        import re
        match = re.search(r'<(?:em|i)>(.*?)</(?:em|i)>', body_html)
        if match:
            potential_name = match.group(1).strip()
            # Check if it looks like a scientific name (two words, capitalized)
            if ' ' in potential_name and potential_name[0].isupper():
                scientific_name = potential_name

    # Extract pack sizes and pricing from variants
    pack_sizes = []
    for variant in product.get('variants', []):
        price = variant.get('price', '0')
        # Convert cents to dollars
        price_dollars = float(price) / 100
        title = variant.get('title', '')
        available = variant.get('available', False)

        pack_info = f"{title} - ${price_dollars:.2f}"
        if not available:
            pack_info += " (Out of Stock)"
        pack_sizes.append(pack_info)

    # Construct product URL
    handle = product.get('handle', '')
    product_url = f"https://www.seedsnow.com/products/{handle}" if handle else None

    # Extract zone info from tags or title
    zone_notes = []
    for tag in tags:
        if 'zone' in tag.lower() or 'heirloom' in tag.lower() or 'organic' in tag.lower():
            zone_notes.append(tag)

    return {
        "name": product.get('title', '').strip(),
        "crop": crop_category,
        "scientificName": scientific_name,
        "daysToMaturity": days_to_maturity,
        "packSizes": pack_sizes,
        "productUrl": product_url,
        "notes": ', '.join(zone_notes) if zone_notes else None,
        "productType": product.get('product_type', ''),
        "vendor": product.get('vendor', ''),
        "tags": tags
    }

def main():
    print("Fetching SeedsNow Zone 10 cultivars...")

    all_cultivars = []
    page = 1

    while True:
        print(f"Fetching page {page}...")
        data = fetch_page(page)

        if not data or not data.get('products'):
            print(f"No more products at page {page}. Stopping.")
            break

        products = data['products']
        print(f"  Found {len(products)} products on page {page}")

        for product in products:
            cultivar = extract_cultivar_data(product)
            all_cultivars.append(cultivar)

        page += 1
        time.sleep(0.5)  # Be nice to their server

    # Create output structure
    output = {
        "source": "SeedsNow",
        "collectionDate": datetime.now().strftime("%Y-%m-%d"),
        "zone": "10",
        "url": "https://www.seedsnow.com/collections/usda-hardiness-zone-10",
        "totalCultivars": len(all_cultivars),
        "cultivars": all_cultivars
    }

    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Write to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nComplete! Collected {len(all_cultivars)} cultivars.")
    print(f"Saved to: {OUTPUT_FILE}")

    # Print summary by crop type
    crop_counts = {}
    for c in all_cultivars:
        crop_type = c['crop']
        crop_counts[crop_type] = crop_counts.get(crop_type, 0) + 1

    print("\nCrop breakdown:")
    for crop_type, count in sorted(crop_counts.items()):
        print(f"  {crop_type}: {count}")

if __name__ == "__main__":
    main()
