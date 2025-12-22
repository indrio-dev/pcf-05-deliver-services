#!/usr/bin/env python3
"""
Generate Entities from USDA Local Food Portal Data

Converts parsed USDA listings to Fielder entity format for Knowledge Graph.

Usage:
    python3 scripts/generate-usda-entities.py
"""

import json
import re
from collections import Counter

# State name to abbreviation
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

def parse_location(address_str):
    """Extract city and state from location_address field."""
    if not address_str:
        return None, None

    addr = str(address_str)

    # Remove USA suffix
    addr = re.sub(r',?\s*USA$', '', addr, flags=re.IGNORECASE)

    # Pattern 1: "City, ST ZIP" or "City, ST"
    match = re.search(r'([^,]+),\s*([A-Z]{2})(?:\s+\d{5})?$', addr)
    if match:
        city = match.group(1).strip()
        state = match.group(2)
        # Remove street address if present
        city = re.sub(r'^\d+\s+[^,]+,\s*', '', city)
        return city, state

    # Pattern 2: "Address, City, State ZIP"
    match = re.search(r',\s*([^,]+),\s*([A-Z]{2})(?:\s+\d{5})?$', addr)
    if match:
        city = match.group(1).strip()
        state = match.group(2)
        return city, state

    # Pattern 3: Full state name
    for state_name, state_code in STATE_ABBREV.items():
        pattern = rf',\s*{state_name}(?:\s+\d{{5}})?$'
        if re.search(pattern, addr, re.IGNORECASE):
            # Extract city (second-to-last part before state)
            parts = addr.split(',')
            if len(parts) >= 2:
                city = parts[-2].strip()
                # Remove street numbers
                city = re.sub(r'^\d+\s+', '', city)
                return city, state_code

    return None, None

def map_directory_to_roles(directory):
    """Map USDA directory type to Fielder roles and channels."""
    mapping = {
        'agritourism': {
            'roles': ['grower', 'retailer'],
            'retailChannels': ['agritourism', 'farm_stand']
        },
        'csa': {
            'roles': ['grower', 'retailer'],
            'retailChannels': ['csa']
        },
        'onfarmmarket': {
            'roles': ['grower', 'retailer'],
            'retailChannels': ['farm_stand', 'd2c']
        },
        'farmersmarket': {
            'roles': ['retailer'],  # Markets themselves, not the vendors
            'retailChannels': ['farmers_market']
        },
        'foodhub': {
            'roles': ['packinghouse'],  # Aggregators/distributors
            'facilityTypes': ['processor'],
            'b2bChannels': ['to_retailers', 'to_distributors']
        }
    }
    return mapping.get(directory, {'roles': ['grower']})

def main():
    print('╔════════════════════════════════════════════════════════╗')
    print('║      GENERATE ENTITIES FROM USDA DATA                  ║')
    print('╚════════════════════════════════════════════════════════╝\n')

    # Load parsed data
    with open('data/collected/usda-local-food/usda-local-food-consolidated.json') as f:
        data = json.load(f)

    listings = data['listings']
    print(f"Total listings: {len(listings)}\n")

    # Generate entities
    entities = []
    skipped = 0
    state_counts = Counter()

    for listing in listings:
        # Extract core fields
        name = listing.get('listing_name')
        address = listing.get('location_address')
        website = listing.get('media_website')
        directory = listing.get('_directory')

        if not name or not address:
            skipped += 1
            continue

        # Parse location
        city, state = parse_location(address)

        if not state:
            skipped += 1
            continue

        state_counts[state] += 1

        # Map to roles
        role_mapping = map_directory_to_roles(directory)

        # Build entity
        entity = {
            'name': name,
            'stateCode': state,
            'roles': role_mapping['roles'],
            'verificationLevel': 'website_verified',
            'dataSource': f'usda_local_food_portal_{directory}_2025_12_22'
        }

        if city:
            entity['city'] = city

        if website:
            entity['website'] = website

        if 'retailChannels' in role_mapping:
            entity['retailChannels'] = role_mapping['retailChannels']

        if 'facilityTypes' in role_mapping:
            entity['facilityTypes'] = role_mapping['facilityTypes']

        if 'b2bChannels' in role_mapping:
            entity['b2bChannels'] = role_mapping['b2bChannels']

        # Coordinates (valuable for mapping)
        if listing.get('location_x') and listing.get('location_y'):
            entity['coordinates'] = {
                'lon': listing['location_x'],
                'lat': listing['location_y']
            }

        # Placeholder products (would need to extract from listing details)
        entity['products'] = []  # To be filled from listing data

        entities.append(entity)

    print(f"╔════════════════════════════════════════════════════════╗")
    print(f"║                 ENTITY GENERATION                      ║")
    print(f"╠════════════════════════════════════════════════════════╣")
    print(f"║  Listings processed:  {len(listings):6}                        ║")
    print(f"║  Entities generated:  {len(entities):6}                        ║")
    print(f"║  Skipped (no state):  {skipped:6}                        ║")
    print(f"╚════════════════════════════════════════════════════════╝")

    print(f"\nStates represented: {len(state_counts)}")
    print("\nTop 15 states:")
    for state, count in state_counts.most_common(15):
        print(f"  {state}: {count:5}")

    # Breakdown by directory/role
    by_directory = Counter(e['dataSource'].split('_')[4] for e in entities)
    print(f"\nBy directory:")
    for directory, count in sorted(by_directory.items(), key=lambda x: -x[1]):
        print(f"  {directory:20} {count:6}")

    # Save
    output_file = 'data/collected/usda-local-food/usda-entities.json'
    with open(output_file, 'w') as f:
        json.dump({
            'source': 'USDA Local Food Portal',
            'collected': '2025-12-22',
            'total': len(entities),
            'entities': entities
        }, f, indent=2)

    print(f"\n💾 Saved to: {output_file}")
    print(f"\n✨ Next: Deduplicate against existing 634 entities, then integrate\n")

if __name__ == '__main__':
    main()
