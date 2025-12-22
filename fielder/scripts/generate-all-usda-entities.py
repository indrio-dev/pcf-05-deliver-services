#!/usr/bin/env python3
"""
Generate ALL USDA Entities for Knowledge Graph

Converts all 22,778 USDA listings to Fielder entities:
- Growers: Single-farm CSAs, on-farm markets, agritourism
- Retailers: Multi-farm CSAs, farmers markets
- Distribution: Food hubs

Even without complete product data, the network structure is valuable
for inference, regional analysis, and future enrichment.

Usage:
    python3 scripts/generate-all-usda-entities.py
"""

import json
import re
from collections import Counter

# State abbreviations
STATE_ABBREV = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH',
    'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
    'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
    'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN',
    'texas': 'TX', 'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
    'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
}

# Product mapping (USDA names → Fielder ProductType)
PRODUCT_MAPPING = {
    'apples': 'apple', 'apple': 'apple',
    'peaches': 'peach', 'peach': 'peach',
    'cherries': 'cherry', 'cherry': 'cherry',
    'blueberries': 'blueberry', 'blueberry': 'blueberry',
    'strawberries': 'strawberry', 'strawberry': 'strawberry',
    'raspberries': 'raspberry', 'raspberry': 'raspberry',
    'blackberries': 'blackberry', 'blackberry': 'blackberry',
    'pears': 'pear', 'pear': 'pear',
    'plums': 'plum', 'plum': 'plum',
    'grapes': 'grape', 'grape': 'grape',
    'oranges': 'orange', 'orange': 'orange',
    'grapefruit': 'grapefruit',
    'tangerines': 'tangerine', 'mandarins': 'tangerine',
    'lemons': 'lemon', 'lemon': 'lemon',
    'avocado': 'avocado', 'mango': 'mango',
    'tomatoes': 'tomato', 'tomato': 'tomato',
    'potatoes': 'potato', 'potato': 'potato',
    'sweet potatoes': 'sweet_potato', 'sweet potato': 'sweet_potato',
}

def parse_location(address_str):
    """Extract city and state from location_address."""
    if not address_str:
        return None, None

    addr = str(address_str).replace(', USA', '').replace(',USA', '')

    # Pattern: "City, ST" or "City, ST ZIP"
    match = re.search(r'([^,]+),\s*([A-Z]{2})(?:\s+\d{5})?$', addr)
    if match:
        city = match.group(1).strip()
        state = match.group(2)
        # Remove street address
        city = re.sub(r'^\d+\s+[^,]+,\s*', '', city)
        city = re.sub(r'^\d+\s+', '', city)
        return city, state

    # Full state name
    for state_name, state_code in STATE_ABBREV.items():
        if re.search(rf',\s*{state_name}(?:\s+\d{{5}})?$', addr, re.IGNORECASE):
            parts = addr.split(',')
            if len(parts) >= 2:
                city = parts[-2].strip()
                city = re.sub(r'^\d+\s+', '', city)
                return city, state_code

    return None, None

def parse_products(products_str):
    """Parse USDA products field to Fielder ProductTypes."""
    if not products_str:
        return []

    items = str(products_str).split(';')
    canonical = set()

    for item in items:
        item_lower = item.lower().strip()
        if not item_lower:
            continue

        for usda_name, fielder_name in PRODUCT_MAPPING.items():
            if usda_name in item_lower:
                canonical.add(fielder_name)
                break

    return sorted(list(canonical))

def map_to_entity(listing):
    """Convert USDA listing to Fielder entity format."""
    directory = listing.get('_directory')
    name = listing.get('listing_name')
    address = listing.get('location_address')

    if not name or not address:
        return None

    city, state = parse_location(address)
    if not state:
        return None

    # Base entity
    entity = {
        'name': name,
        'stateCode': state,
        'verificationLevel': 'website_verified',
        'dataSource': f'usda_{directory}_2025_12_22'
    }

    if city:
        entity['city'] = city

    if listing.get('media_website'):
        entity['website'] = listing['media_website']

    # Role mapping based on directory type
    if directory == 'csa':
        num_farms = str(listing.get('num_supplyfarms', ''))
        if num_farms == '1':
            # Single farm CSA
            entity['roles'] = ['grower', 'retailer']
            entity['retailChannels'] = ['csa']
            entity['features'] = ['single_farm_csa']
        else:
            # Multi-farm CSA (aggregator/retailer)
            entity['roles'] = ['retailer']
            entity['retailChannels'] = ['csa']
            if num_farms and num_farms != '':
                entity['features'] = [f'multi_farm_csa_{num_farms}_farms']

    elif directory == 'onfarmmarket':
        entity['roles'] = ['grower', 'retailer']
        entity['retailChannels'] = ['farm_stand', 'd2c']

    elif directory == 'agritourism':
        entity['roles'] = ['grower', 'retailer']
        entity['retailChannels'] = ['agritourism', 'farm_stand']

    elif directory == 'farmersmarket':
        # Market location (not grower)
        entity['roles'] = ['retailer']
        entity['retailChannels'] = ['farmers_market']
        entity['features'] = ['market_location']

    elif directory == 'foodhub':
        entity['roles'] = ['packinghouse']
        entity['facilityTypes'] = ['processor']
        entity['b2bChannels'] = ['to_retailers', 'to_distributors']
        entity['features'] = ['food_hub']

    # Parse products
    products = parse_products(listing.get('products'))
    entity['products'] = products

    # Flag if no products (needs research)
    if not products:
        if 'features' not in entity:
            entity['features'] = []
        entity['features'].append('needs_product_research')

    # Coordinates (valuable for mapping)
    if listing.get('location_x') and listing.get('location_y'):
        entity['_coordinates'] = {
            'lon': listing['location_x'],
            'lat': listing['location_y']
        }

    return entity

def main():
    print('╔════════════════════════════════════════════════════════╗')
    print('║      GENERATE ALL USDA ENTITIES (FULL INTEGRATION)     ║')
    print('╚════════════════════════════════════════════════════════╝\n')

    # Load parsed data
    with open('data/collected/usda-local-food/usda-local-food-consolidated.json') as f:
        data = json.load(f)

    listings = data['listings']
    print(f"Total USDA listings: {len(listings)}\n")

    # Convert to entities
    entities = []
    skipped = 0

    for listing in listings:
        entity = map_to_entity(listing)
        if entity:
            entities.append(entity)
        else:
            skipped += 1

    print(f"╔════════════════════════════════════════════════════════╗")
    print(f"║                 ENTITY GENERATION                      ║")
    print(f"╠════════════════════════════════════════════════════════╣")
    print(f"║  USDA listings:       {len(listings):6}                        ║")
    print(f"║  Entities generated:  {len(entities):6}                        ║")
    print(f"║  Skipped:             {skipped:6}                        ║")
    print(f"╚════════════════════════════════════════════════════════╝")

    # Breakdown by role
    role_counts = Counter()
    for entity in entities:
        for role in entity.get('roles', []):
            role_counts[role] += 1

    print(f"\nBy role:")
    for role, count in sorted(role_counts.items(), key=lambda x: -x[1]):
        print(f"  {role:20} {count:6}")

    # Product coverage
    with_products = sum(1 for e in entities if e.get('products'))
    without_products = len(entities) - with_products

    print(f"\nProduct data:")
    print(f"  With products:        {with_products:6} ({with_products*100//len(entities)}%)")
    print(f"  Needs research:       {without_products:6} ({without_products*100//len(entities)}%)")

    # State coverage
    state_counts = Counter(e['stateCode'] for e in entities)
    print(f"\nGeographic coverage:")
    print(f"  States: {len(state_counts)}")
    print(f"\n  Top 10 states:")
    for state, count in state_counts.most_common(10):
        print(f"    {state}: {count:5}")

    # Save
    output_file = 'data/collected/usda-local-food/usda-all-entities.json'
    with open(output_file, 'w') as f:
        json.dump({
            'source': 'USDA Local Food Portal - All Entities',
            'collected': '2025-12-22',
            'total': len(entities),
            'with_products': with_products,
            'without_products': without_products,
            'entities': entities
        }, f, indent=2, default=str)

    print(f"\n💾 Saved to: {output_file}")
    print(f"\n✨ Next: Deduplicate against existing 634 entities, then integrate\n")

if __name__ == '__main__':
    main()
