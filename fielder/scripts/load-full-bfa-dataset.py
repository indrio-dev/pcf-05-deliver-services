#!/usr/bin/env python3
"""
Load FULL BioNutrient Food Association dataset to Neo4j

5,591 measurements with:
- Brix, antioxidants, polyphenols (E pillar)
- Soil minerals: Ca, Mg, P, K + trace (S pillar)
- Farm practices (A pillar)
- Species/variety (H pillar - partial)
- Collection date (R pillar - partial, no harvest timing)

This is THE S→E validation dataset!
"""

import pandas as pd
import sys
import os

# Add parent dir to path for Neo4j connection
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Simple Neo4j connection (since we're in Python not TypeScript)
from neo4j import GraphDatabase

# Neo4j connection
NEO4J_URI = os.getenv('NEO4J_URI', 'neo4j+s://bd5ae157.databases.neo4j.io')
NEO4J_USER = os.getenv('NEO4J_USERNAME', 'neo4j')
NEO4J_PASS = os.getenv('NEO4J_PASSWORD', '7MHJyCog3UvBp1HMgouN-beb0mjPe-F7gfAKamfDZ_0')

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

def run_query(query, params=None):
    with driver.session() as session:
        result = session.run(query, params or {})
        return [record.data() for record in result]

print('╔════════════════════════════════════════════════════════╗')
print('║  LOAD FULL BFA DATASET (5,591 MEASUREMENTS)            ║')
print('╚════════════════════════════════════════════════════════╝\n')

# Load CSV
df = pd.read_csv('/mnt/c/Users/abrow/Downloads/openBIData.csv')

print(f'Total records: {len(df)}')
print(f'Records with Brix: {df["Brix"].notna().sum()}')
print(f'Records with soil data: {df["Soil Ca Ppm"].notna().sum()}\n')

print('Loading measurements to Neo4j...\n')

loaded = 0
skipped = 0
batch = []
BATCH_SIZE = 100

for idx, row in df.iterrows():
    # Must have at minimum: species and some measurement
    if pd.isna(row['Species']) or (pd.isna(row['Brix']) and pd.isna(row['Antioxidants'])):
        skipped += 1
        continue

    # Create measurement ID
    lab_id = str(row['Lab ID']) if pd.notna(row['Lab ID']) else f'unknown_{idx}'
    sample_id = str(row['Sample ID']) if pd.notna(row['Sample ID']) else str(idx)
    measurement_id = f"bfa_{lab_id}_{sample_id}".replace(' ', '_')

    # Parse numeric values
    def safe_float(val):
        if pd.isna(val):
            return None
        try:
            # Handle values like "< 88.50" or "> 41.60"
            if isinstance(val, str):
                val = val.replace('<', '').replace('>', '').strip()
            return float(val)
        except:
            return None

    brix = safe_float(row['Brix'])
    brix_pct = safe_float(str(row['Brix Percentile (by species)']).replace('%', ''))

    # Soil minerals (S pillar - CRITICAL!)
    soil_ca = safe_float(row['Soil Ca Ppm'])
    soil_mg = safe_float(row['Soil Mg Ppm'])
    soil_p = safe_float(row['Soil P Ppm'])
    soil_k = safe_float(row['Soil K Ppm'])
    soil_ph = safe_float(row['Soil Ph'])
    soil_om = safe_float(row['Soil Om Percent'])

    # Calculate Ca:Mg ratio (Albrecht)
    ca_mg_ratio = None
    if soil_ca and soil_mg and soil_mg > 0:
        ca_mg_ratio = round(soil_ca / soil_mg, 2)

    # Build Cypher params
    params = {
        'id': measurement_id,
        'species': str(row['Species']).lower() if pd.notna(row['Species']) else None,
        'variety': str(row['Variety']) if pd.notna(row['Variety']) else None,
        'state': str(row['State']).lower() if pd.notna(row['State']) else None,
        'county': str(row['County']).lower() if pd.notna(row['County']) else None,
        'date': str(row['Sample Collection Date']) if pd.notna(row['Sample Collection Date']) else None,
        'labId': lab_id,
        'sampleId': sample_id,
        'source': str(row['Source']) if pd.notna(row['Source']) else None,
        'farmPractices': str(row['Farm Practices']) if pd.notna(row['Farm Practices']) else None,

        # E pillar measurements
        'brix': brix,
        'brixPercentile': brix_pct,
        'antioxidants': safe_float(row['Antioxidants']),
        'polyphenols': safe_float(row['Polyphenols']),

        # S pillar - Soil minerals
        'soilCa': soil_ca,
        'soilMg': soil_mg,
        'soilP': soil_p,
        'soilK': soil_k,
        'soilPh': soil_ph,
        'soilOm': soil_om,
        'caMgRatio': ca_mg_ratio,
        'soilCaBase': safe_float(row['Soil Ca Base Percent']),
        'soilMgBase': safe_float(row['Soil Mg Base Percent']),
        'soilKBase': safe_float(row['Soil K Base Percent']),

        # Trace minerals
        'soilB': safe_float(row['Soil B Available Ppm']),
        'soilFe': safe_float(row['Soil Fe Available Ppm']),
        'soilMn': safe_float(row['Soil Mn Available Ppm']),
        'soilCu': safe_float(row['Soil Cu Available Ppm']),
        'soilZn': safe_float(row['Soil Zn Available Ppm']),
    }

    batch.append(params)

    # Execute batch
    if len(batch) >= BATCH_SIZE:
        query = """
        UNWIND $batch as m
        CREATE (measurement:Measurement {
            id: m.id,
            source: 'bionutrient_food_association',
            species: m.species,
            variety: m.variety,
            state: m.state,
            county: m.county,
            collectionDate: m.date,
            labId: m.labId,
            sampleId: m.sampleId,
            sampleSource: m.source,
            farmPractices: m.farmPractices,

            brix: m.brix,
            brixPercentile: m.brixPercentile,
            antioxidants: m.antioxidants,
            polyphenols: m.polyphenols,

            soilCa: m.soilCa,
            soilMg: m.soilMg,
            soilP: m.soilP,
            soilK: m.soilK,
            soilPh: m.soilPh,
            soilOm: m.soilOm,
            caMgRatio: m.caMgRatio,
            soilCaBase: m.soilCaBase,
            soilMgBase: m.soilMgBase,
            soilKBase: m.soilKBase,

            soilB: m.soilB,
            soilFe: m.soilFe,
            soilMn: m.soilMn,
            soilCu: m.soilCu,
            soilZn: m.soilZn
        })
        """

        run_query(query, {'batch': batch})
        loaded += len(batch)
        batch = []

        if loaded % 500 == 0:
            print(f'  ✓ Loaded {loaded} measurements...')

# Load remaining batch
if batch:
    query = """
    UNWIND $batch as m
    CREATE (measurement:Measurement {
        id: m.id,
        source: 'bionutrient_food_association',
        species: m.species,
        variety: m.variety,
        state: m.state,
        county: m.county,
        collectionDate: m.date,
        labId: m.labId,
        sampleId: m.sampleId,
        sampleSource: m.source,
        farmPractices: m.farmPractices,
        brix: m.brix,
        brixPercentile: m.brixPercentile,
        antioxidants: m.antioxidants,
        polyphenols: m.polyphenols,
        soilCa: m.soilCa,
        soilMg: m.soilMg,
        soilP: m.soilP,
        soilK: m.soilK,
        soilPh: m.soilPh,
        soilOm: m.soilOm,
        caMgRatio: m.caMgRatio,
        soilCaBase: m.soilCaBase,
        soilMgBase: m.soilMgBase,
        soilKBase: m.soilKBase,
        soilB: m.soilB,
        soilFe: m.soilFe,
        soilMn: m.soilMn,
        soilCu: m.soilCu,
        soilZn: m.soilZn
    })
    """
    run_query(query, {'batch': batch})
    loaded += len(batch)

print(f'\n✓ Loaded {loaded} measurements')
print(f'  Skipped {skipped} (missing species or measurements)\n')

print('╔════════════════════════════════════════════════════════╗')
print('║  BFA DATASET LOAD COMPLETE                             ║')
print('╚════════════════════════════════════════════════════════╝\n')

print(f'Total loaded: {loaded}')
print(f'\nBREAKDOWN:')
print(f'  Measurements with Brix: {df["Brix"].notna().sum()}')
print(f'  Measurements with soil data: {df["Soil Ca Ppm"].notna().sum()}')
print(f'  Measurements with practices: {df["Farm Practices"].notna().sum()}')
print(f'\nThis enables:')
print(f'  ✓ S→E correlation analysis (soil minerals → Brix)')
print(f'  ✓ A→E correlation (practices → Brix)')
print(f'  ✓ Species-specific Brix baselines')
print(f'  ✓ Validation of framework predictions')
print()

driver.close()
