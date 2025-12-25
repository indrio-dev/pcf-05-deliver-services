#!/usr/bin/env python3
"""
BFA Linking - BULK approach

Strategy:
1. Query all BFA measurements once (get IDs)
2. Query all cultivars once (get IDs)
3. Do matching in Python (FAST - local processing)
4. Bulk create relationships (single batch insert)

No more complex Cypher pattern matching on 5K+ nodes!
"""

import os
import sys

# Simple connection without neo4j package
import subprocess
import json

NEO4J_URI = "neo4j+s://bd5ae157.databases.neo4j.io"
NEO4J_USER = "neo4j"
NEO4J_PASS = "7MHJyCog3UvBp1HMgouN-beb0mjPe-F7gfAKamfDZ_0"

def run_cypher(query, params=None):
    """Run via npx tsx"""
    script = f"""
import {{ runWriteTransaction, closeDriver }} from './src/lib/graph/index';
(async () => {{
  const r = await runWriteTransaction(`{query}`, {json.dumps(params or {})});
  console.log(JSON.stringify(r));
  await closeDriver();
}})();
"""

    # Write temp script
    with open('/tmp/neo_query.ts', 'w') as f:
        f.write(script)

    # Run it
    result = subprocess.run(
        ['npx', 'tsx', '/tmp/neo_query.ts'],
        capture_output=True,
        text=True,
        cwd='/home/alex/projects/indrio-dev/pcf-05-deliver-services/fielder',
        env={**os.environ, 'NEO4J_URI': NEO4J_URI, 'NEO4J_USERNAME': NEO4J_USER, 'NEO4J_PASSWORD': NEO4J_PASS}
    )

    # Parse output (find JSON line)
    for line in result.stdout.split('\n'):
        if line.strip().startswith('[') or line.strip().startswith('{'):
            try:
                return json.loads(line)
            except:
                pass

    return None

print('╔════════════════════════════════════════════════════════╗')
print('║  BFA BULK LINKING (Python Matching)                    ║')
print('╚════════════════════════════════════════════════════════╝\n')

# Step 1: Get all BFA measurements
print('Step 1: Fetching BFA measurements...')

bfa_query = """
MATCH (m:BFAMeasurement)
WHERE m.species IS NOT NULL
RETURN m.id as id, m.species as species
"""

bfa_data = run_cypher(bfa_query)
print(f'  Fetched {len(bfa_data) if bfa_data else 0} measurements\n')

# Step 2: Get all cultivars
print('Step 2: Fetching cultivars...')

cultivar_query = """
MATCH (c:Cultivar)
WHERE c.productId IS NOT NULL
RETURN c.id as id, c.productId as productId
"""

cultivar_data = run_cypher(cultivar_query)
print(f'  Fetched {len(cultivar_data) if cultivar_data else 0} cultivars\n')

# Step 3: Match locally
print('Step 3: Matching in Python (FAST)...\n')

# Build cultivar lookup
cultivar_lookup = {}
if cultivar_data:
    for c in cultivar_data:
        product = c.get('productId')
        if product:
            cultivar_lookup[product] = c['id']

# Build relationship list
relationships = []
if bfa_data and cultivar_lookup:
    for m in bfa_data:
        species = m.get('species')
        if species and species in cultivar_lookup:
            relationships.append({
                'measurementId': m['id'],
                'cultivarId': cultivar_lookup[species]
            })

print(f'  Matched {len(relationships)} measurements to cultivars\n')

# Step 4: Bulk create relationships
print('Step 4: Bulk creating relationships...\n')

if relationships:
    # Do in chunks of 500
    chunk_size = 500
    created = 0

    for i in range(0, len(relationships), chunk_size):
        chunk = relationships[i:i+chunk_size]

        bulk_query = """
        UNWIND $rels as rel
        MATCH (m:BFAMeasurement {id: rel.measurementId})
        MATCH (c:Cultivar {id: rel.cultivarId})
        MERGE (m)-[:MEASURED_FROM]->(c)
        """

        run_cypher(bulk_query, {'rels': chunk})
        created += len(chunk)

        if created % 500 == 0:
            print(f'  ✓ Created {created} relationships...')

    print(f'\n  Total created: {created}\n')

# Verify
print('╔════════════════════════════════════════════════════════╗')
print('║  VERIFICATION                                          ║')
print('╚════════════════════════════════════════════════════════╝\n')

verify_query = """
MATCH (m:BFAMeasurement)-[:MEASURED_FROM]->()
RETURN count(m) as total
"""

result = run_cypher(verify_query)
if result:
    print(f'Total BFA→Cultivar relationships: {result[0]["total"]}\n')

print('✅ BFA linking COMPLETE!\n')
