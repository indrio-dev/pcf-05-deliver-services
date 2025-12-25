#!/usr/bin/env python3
"""
SHARE Framework vs BFA Measurements

Apply COMPLETE SHARE framework (S×H×A×R→E) to BFA's measurements
and compare our predictions to their actual results.

This tests: Does H×R context improve predictions vs BFA's S+A+E only?
"""

import pandas as pd
import json
from datetime import datetime

# Load BFA data
df = pd.read_csv('/mnt/c/Users/abrow/Downloads/openBIData.csv')

print('╔════════════════════════════════════════════════════════╗')
print('║  SHARE FRAMEWORK vs BFA ACTUALS                        ║')
print('╚════════════════════════════════════════════════════════╝\n')

# Focus on vegetables with variety data (can apply H pillar)
vegetables_with_variety = df[
    (df['Species'].notna()) &
    (df['Variety'].notna()) &
    (df['Brix'].notna()) &
    (df['Sample Collection Date'].notna())
].copy()

print(f'Total BFA measurements: {len(df)}')
print(f'With species + variety + Brix + date: {len(vegetables_with_variety)}\n')

# Genetic Brix ceilings by species (H pillar - from research)
GENETIC_CEILINGS = {
    'carrot': {'min': 6, 'typical': 10, 'max': 16},  # Nantes heritage can hit 16
    'beet': {'min': 8, 'typical': 11, 'max': 18},    # Table beets
    'tomato': {'min': 4, 'typical': 6, 'max': 12},   # Heirlooms higher
    'potato': {'min': 3, 'typical': 6, 'max': 10},   # Fingerling types higher
    'kale': {'min': 6, 'typical': 9, 'max': 15},     # Lacinato higher
    'lettuce': {'min': 2, 'typical': 4, 'max': 8},   # Romaine higher
    'peppers': {'min': 4, 'typical': 7, 'max': 12},  # Sweet peppers
    'spinach': {'min': 4, 'typical': 7, 'max': 12},  # Baby spinach lower
}

# Harvest timing by month (R pillar - rough estimate)
def estimate_maturity_stage(species, month):
    """Estimate if sample is early/peak/late season based on month"""
    if not month:
        return 'unknown', 1.0

    month = int(month)

    # Cool season crops (peak spring/fall)
    cool_season = ['carrot', 'beet', 'kale', 'lettuce', 'spinach']
    # Warm season (peak summer)
    warm_season = ['tomato', 'peppers', 'squash', 'cucumber']

    if species in cool_season:
        if month in [4, 5, 10, 11]:  # Spring/fall peak
            return 'peak', 1.0
        elif month in [6, 7, 8]:      # Summer (stress)
            return 'late', 0.85  # Heat stress penalty
        else:
            return 'early', 0.90

    if species in warm_season:
        if month in [7, 8, 9]:        # Summer peak
            return 'peak', 1.0
        elif month in [5, 6]:          # Early summer
            return 'early', 0.90
        elif month in [10, 11]:        # Late season
            return 'late', 0.85
        else:
            return 'off_season', 0.70

    return 'unknown', 0.95

# Practice modifier (A pillar)
def get_practice_modifier(practices):
    """Estimate Brix impact from practices"""
    if not practices or pd.isna(practices):
        return 0.0

    practices_lower = str(practices).lower()
    modifier = 0.0

    # Positive
    if 'regenerative' in practices_lower:
        modifier += 1.5
    if 'biodynamic' in practices_lower:
        modifier += 1.0
    if 'organic' in practices_lower and 'not_cert' not in practices_lower:
        modifier += 0.5
    if 'compost' in practices_lower:
        modifier += 0.3
    if 'rock_minerals' in practices_lower or 'foliar' in practices_lower:
        modifier += 0.5

    # Negative
    if 'synth_fertilizer' in practices_lower:
        modifier -= 0.5

    return modifier

# Soil modifier (S pillar - based on minerals)
def get_soil_modifier(ca, mg, p, k):
    """Estimate Brix impact from soil minerals"""
    modifier = 0.0

    # Ca:Mg ratio (Albrecht)
    if ca and mg:
        ratio = ca / mg
        if 7 <= ratio <= 10:  # Optimal
            modifier += 0.5
        elif ratio < 5:  # Mg excess
            modifier -= 1.0
        elif ratio > 15:  # Ca excess
            modifier -= 0.5

    # Phosphorus (Reams - most important!)
    if p:
        if p > 60:  # High P
            modifier += 1.5
        elif p > 30:  # Medium P
            modifier += 0.5
        else:  # Low P
            modifier -= 1.5

    # Calcium level
    if ca:
        if ca > 2000:  # High Ca
            modifier += 0.5
        elif ca < 1000:  # Low Ca
            modifier -= 0.5

    return modifier

print('═══════════════════════════════════════════════════════════')
print('SHARE PREDICTIONS vs BFA ACTUALS (Sample Analysis)')
print('═══════════════════════════════════════════════════════════\n')

# Analyze samples with good data
sample_count = 0
matches = []
overpredict = []
underpredict = []

for idx, row in vegetables_with_variety.iterrows():
    if sample_count >= 20:  # Analyze first 20 detailed examples
        break

    species = str(row['Species']).lower()
    if species not in GENETIC_CEILINGS:
        continue

    variety = row['Variety']
    date_str = row['Sample Collection Date']
    brix_actual = float(row['Brix'])

    # Extract month for R pillar
    try:
        month = datetime.strptime(date_str, '%Y-%m-%d').month if date_str else None
    except:
        month = None

    # Get soil data
    soil_ca = float(row['Soil Ca Ppm']) if pd.notna(row['Soil Ca Ppm']) else None
    soil_mg = float(row['Soil Mg Ppm']) if pd.notna(row['Soil Mg Ppm']) else None
    soil_p = float(row['Soil P Ppm']) if pd.notna(row['Soil P Ppm']) else None
    soil_k = float(row['Soil K Ppm']) if pd.notna(row['Soil K Ppm']) else None

    # SHARE PREDICTION:
    # H pillar: Genetic baseline
    ceiling = GENETIC_CEILINGS[species]
    base_brix = ceiling['typical']  # Start with typical for species

    # R pillar: Timing modifier
    timing_stage, timing_mod = estimate_maturity_stage(species, month)

    # A pillar: Practice modifier
    practice_mod = get_practice_modifier(row['Farm Practices'])

    # S pillar: Soil modifier
    soil_mod = get_soil_modifier(soil_ca, soil_mg, soil_p, soil_k)

    # SHARE PREDICTION
    predicted_brix = (base_brix + practice_mod + soil_mod) * timing_mod
    predicted_brix = max(ceiling['min'], min(ceiling['max'], predicted_brix))

    error = predicted_brix - brix_actual
    error_pct = (error / brix_actual) * 100 if brix_actual > 0 else 0

    sample_count += 1

    print(f'{sample_count}. {species.upper()} - {variety or "unknown variety"}')
    print(f'   Date: {date_str} ({timing_stage} season)')
    print(f'   Soil: Ca={soil_ca}, Mg={soil_mg}, P={soil_p}')
    if soil_ca and soil_mg:
        print(f'   Ca:Mg ratio: {soil_ca/soil_mg:.1f}:1')
    print(f'   Practices: {row["Farm Practices"][:60] if pd.notna(row["Farm Practices"]) else "unknown"}')
    print(f'   ')
    print(f'   SHARE PREDICTION: {predicted_brix:.1f}°Bx')
    print(f'     Base (H): {base_brix}°Bx (species typical)')
    print(f'     Practices (A): {practice_mod:+.1f}°Bx')
    print(f'     Soil (S): {soil_mod:+.1f}°Bx')
    print(f'     Timing (R): ×{timing_mod:.2f} ({timing_stage})')
    print(f'   ')
    print(f'   BFA ACTUAL: {brix_actual:.1f}°Bx')
    print(f'   ERROR: {error:+.1f}°Bx ({error_pct:+.0f}%)')

    if abs(error) <= 1.5:
        print(f'   ✅ Good prediction (within 1.5°Bx)')
        matches.append((species, predicted_brix, brix_actual, error))
    elif error > 1.5:
        print(f'   ⚠️  OVER-predicted (missing H/R penalty?)')
        overpredict.append((species, variety, predicted_brix, brix_actual, error, timing_stage))
    else:
        print(f'   ⚠️  UNDER-predicted (missing bonus factor?)')
        underpredict.append((species, variety, predicted_brix, brix_actual, error, timing_stage))

    print()

print('\n═══════════════════════════════════════════════════════════')
print('SUMMARY: SHARE PREDICTIONS vs BFA ACTUALS')
print('═══════════════════════════════════════════════════════════\n')

print(f'Samples analyzed: {sample_count}')
print(f'Good predictions (±1.5°Bx): {len(matches)}')
print(f'Over-predictions (>1.5°Bx): {len(overpredict)}')
print(f'Under-predictions (<-1.5°Bx): {len(underpredict)}\n')

if matches:
    avg_error = sum(abs(e[3]) for e in matches) / len(matches)
    print(f'Average error for good predictions: {avg_error:.2f}°Bx')

print(f'\nThis tests whether COMPLETE SHARE (S×H×A×R→E)')
print(f'predicts better than BFA\'s partial framework (S+A+E)')
print()
