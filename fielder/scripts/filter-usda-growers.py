#!/usr/bin/env python3
"""
Filter USDA Data to Tier 1 Growers

Extracts only entities we can make SHARE predictions for:
- Single-farm CSAs (num_supplyfarms=1)
- On-farm markets (farm stands, U-pick)
- Agritourism (with product data)

Skips:
- Multi-farm CSAs (aggregators)
- Farmers markets (retail locations)
- Food hubs (distributors)

Usage:
    python3 scripts/filter-usda-growers.py
"""

import json
import re
from collections import Counter

# Map USDA product names to Fielder ProductType IDs
PRODUCT_MAPPING = {
    # Fruit
    'apples': 'apple',
    'apple': 'apple',
    'peaches': 'peach',
    'peach': 'peach',
    'cherries': 'cherry',
    'cherry': 'cherry',
    'blueberries': 'blueberry',
    'blueberry': 'blueberry',
    'strawberries': 'strawberry',
    'strawberry': 'strawberry',
    'raspberries': 'raspberry',
    'raspberry': 'raspberry',
    'blackberries': 'blackberry',
    'blackberry': 'blackberry',
    'pears': 'pear',
    'pear': 'pear',
    'plums': 'plum',
    'plum': 'plum',
    'grapes': 'grape',
    'grape': 'grape',
    'oranges': 'orange',
    'orange': 'orange',
    'grapefruit': 'grapefruit',
    'tangerines': 'tangerine',
    'tangerine': 'tangerine',
    'mandarins': 'tangerine',
    'lemons': 'lemon',
    'lemon': 'lemon',
    'avocado': 'avocado',
    'mango': 'mango',

    # Vegetables
    'tomatoes': 'tomato',
    'tomato': 'tomato',
    'lettuce': 'lettuce',
    'spinach': 'spinach',
    'kale': 'kale',
    'carrots': 'carrot',
    'carrot': 'carrot',
    'onions': 'onion',
    'onion': 'onion',
    'potatoes': 'potato',
    'potato': 'potato',
    'sweet potatoes': 'sweet_potato',
    'sweet potato': 'sweet_potato',
    'peppers': 'pepper',
    'pepper': 'pepper',
    'squash': 'squash',
    'cucumbers': 'cucumber',
    'cucumber': 'cucumber',
    'beans': 'bean',
    'peas': 'pea',
}

def parse_products(products_str):
    """Parse semicolon-separated product list."""
    if not products_str:
        return []

    # Split on semicolon
    items = str(products_str).split(';')

    canonical_products = set()

    for item in items:
        item_lower = item.lower().strip()
        if not item_lower:
            continue

        # Check against mapping
        for usda_name, canonical_name in PRODUCT_MAPPING.items():
            if usda_name in item_lower:
                canonical_products.add(canonical_name)
                break

    return sorted(list(canonical_products))

def main():
    print('╔════════════════════════════════════════════════════════╗')
    print('║        FILTER USDA DATA TO TIER 1 GROWERS              ║')
    print('╚════════════════════════════════════════════════════════╝\n')

    # Load data
    with open('data/collected/usda-local-food/usda-local-food-consolidated.json') as f:
        data = json.load(f)

    listings = data['listings']

    # Filter to growers only
    growers = []

    # 1. Single-farm CSAs
    csa_single = [l for l in listings
                  if l.get('_directory') == 'csa'
                  and str(l.get('num_supplyfarms')) == '1']

    # 2. On-farm markets
    onfarm = [l for l in listings if l.get('_directory') == 'onfarmmarket']

    # 3. Agritourism (check product coverage first)
    agri_with_products = [l for l in listings
                         if l.get('_directory') == 'agritourism'
                         and l.get('products')]

    print(f"Filter results:")
    print(f"  Single-farm CSAs:           {len(csa_single):5}")
    print(f"  On-farm markets:            {len(onfarm):5}")
    print(f"  Agritourism w/ products:    {len(agri_with_products):5}")
    print(f"  ────────────────────────────────")
    print(f"  Total Tier 1 growers:       {len(csa_single) + len(onfarm) + len(agri_with_products):5}\n")

    # Combine
    all_growers = csa_single + onfarm + agri_with_products

    # Parse products
    print("Parsing product lists...")
    growers_with_products = 0
    product_counts = Counter()

    for listing in all_growers:
        products = parse_products(listing.get('products'))
        if products:
            growers_with_products += 1
            for p in products:
                product_counts[p] += 1
        listing['_parsed_products'] = products

    print(f"  Growers with parseable products: {growers_with_products}/{len(all_growers)} ({growers_with_products*100//len(all_growers)}%)\n")

    print("Top 15 products:")
    for product, count in product_counts.most_common(15):
        print(f"  {product:20} {count:5} growers")

    # Save filtered data
    output_file = 'data/collected/usda-local-food/usda-tier1-growers.json'
    with open(output_file, 'w') as f:
        json.dump({
            'source': 'USDA Local Food Portal - Tier 1 Growers',
            'collected': '2025-12-22',
            'filter': 'Single-farm CSAs + on-farm markets + agritourism with products',
            'total': len(all_growers),
            'with_products': growers_with_products,
            'growers': all_growers
        }, f, indent=2, default=str)

    print(f"\n💾 Saved to: {output_file}")
    print(f"\n✨ Ready for entity generation and deduplication\n")

if __name__ == '__main__':
    main()
