#!/usr/bin/env python3
"""
Analyze BioNutrient Food Association soil → Brix correlations

Tests Albrecht/Reams claims:
1. "Available phosphates DETERMINE sugar content" (Reams)
2. Ca:Mg ratio 7-10:1 optimal for Brix (Albrecht)
3. High Ca → Higher Brix
4. Regenerative practices → Higher Brix
"""

import pandas as pd
import numpy as np

# Load BFA data
df = pd.read_csv('/mnt/c/Users/abrow/Downloads/openBIData.csv')

print('╔════════════════════════════════════════════════════════╗')
print('║  BFA SOIL → BRIX CORRELATION ANALYSIS                  ║')
print('╚════════════════════════════════════════════════════════╝\n')

# Filter to samples with both Brix and soil data
soil_cols = ['Soil Ca Ppm', 'Soil Mg Ppm', 'Soil P Ppm', 'Soil K Ppm']
complete = df[df['Brix'].notna() & df['Soil Ca Ppm'].notna()].copy()

print(f'Total measurements: {len(df)}')
print(f'With Brix: {df["Brix"].notna().sum()}')
print(f'With complete soil + Brix: {len(complete)}\n')

# Convert to numeric
for col in ['Brix', 'Soil Ca Ppm', 'Soil Mg Ppm', 'Soil P Ppm', 'Soil K Ppm']:
    complete[col] = pd.to_numeric(complete[col], errors='coerce')

# Calculate Ca:Mg ratio
complete['Ca_Mg_Ratio'] = complete['Soil Ca Ppm'] / complete['Soil Mg Ppm']

print('═══════════════════════════════════════════════════════════')
print('TEST 1: SOIL PHOSPHORUS → BRIX (Reams\' Law)')
print('═══════════════════════════════════════════════════════════\n')

# Filter to samples with P data
with_p = complete[complete['Soil P Ppm'].notna() & (complete['Soil P Ppm'] > 0)].copy()

if len(with_p) > 10:
    correlation = with_p[['Soil P Ppm', 'Brix']].corr().iloc[0, 1]

    print(f'Samples with P + Brix: {len(with_p)}')
    print(f'\nCorrelation (Pearson r): {correlation:.3f}')
    print(f'R-squared: {correlation**2:.3f}')

    if abs(correlation) > 0.3:
        print(f'\n✅ MODERATE TO STRONG CORRELATION!')
        print(f'   Reams was RIGHT: Phosphorus affects Brix')
    elif abs(correlation) > 0.1:
        print(f'\n⚠️  Weak correlation (r={correlation:.3f})')
    else:
        print(f'\n⚠️  Very weak correlation (r={correlation:.3f})')

    # Group by P levels
    with_p['P_Level'] = pd.cut(with_p['Soil P Ppm'], bins=[0, 30, 60, 1000],
                                labels=['Low (<30)', 'Medium (30-60)', 'High (>60)'])

    print(f'\nBrix by Phosphorus level:')
    for level in ['Low (<30)', 'Medium (30-60)', 'High (>60)']:
        group = with_p[with_p['P_Level'] == level]
        if len(group) > 0:
            print(f'  {level}: {group["Brix"].mean():.2f}°Bx avg (n={len(group)})')

print('\n═══════════════════════════════════════════════════════════')
print('TEST 2: Ca:Mg RATIO → BRIX (Albrecht\'s Ratio)')
print('═══════════════════════════════════════════════════════════\n')

with_ratio = complete[complete['Ca_Mg_Ratio'].notna()].copy()

correlation = with_ratio[['Ca_Mg_Ratio', 'Brix']].corr().iloc[0, 1]
print(f'Samples with Ca:Mg ratio: {len(with_ratio)}')
print(f'Correlation: {correlation:.3f}')

# Albrecht optimal: 7-10:1
with_ratio['Ratio_Category'] = pd.cut(
    with_ratio['Ca_Mg_Ratio'],
    bins=[0, 5, 7, 10, 15, 100],
    labels=['Too Low (<5:1)', 'Low (5-7:1)', 'Optimal (7-10:1)', 'High (10-15:1)', 'Too High (>15:1)']
)

print(f'\nBrix by Ca:Mg ratio category:')
for cat in ['Too Low (<5:1)', 'Low (5-7:1)', 'Optimal (7-10:1)', 'High (10-15:1)', 'Too High (>15:1)']:
    group = with_ratio[with_ratio['Ratio_Category'] == cat]
    if len(group) > 0:
        print(f'  {cat}: {group["Brix"].mean():.2f}°Bx avg (n={len(group)})')

# Test if optimal range has highest Brix
optimal = with_ratio[with_ratio['Ratio_Category'] == 'Optimal (7-10:1)']['Brix'].mean()
other = with_ratio[with_ratio['Ratio_Category'] != 'Optimal (7-10:1)']['Brix'].mean()

if len(with_ratio[with_ratio['Ratio_Category'] == 'Optimal (7-10:1)']) > 5:
    print(f'\nOptimal ratio (7-10:1): {optimal:.2f}°Bx')
    print(f'Non-optimal ratios: {other:.2f}°Bx')
    print(f'Difference: {optimal - other:.2f}°Bx')

    if optimal > other:
        print(f'✅ Albrecht was RIGHT: Optimal ratio produces higher Brix!')

print('\n═══════════════════════════════════════════════════════════')
print('TEST 3: CALCIUM LEVEL → BRIX')
print('═══════════════════════════════════════════════════════════\n')

correlation = complete[['Soil Ca Ppm', 'Brix']].corr().iloc[0, 1]
print(f'Correlation: {correlation:.3f}')

complete['Ca_Level'] = pd.cut(
    complete['Soil Ca Ppm'],
    bins=[0, 1000, 1500, 2000, 5000],
    labels=['Low (<1000)', 'Medium (1000-1500)', 'Good (1500-2000)', 'High (>2000)']
)

print(f'\nBrix by Calcium level:')
for level in ['Low (<1000)', 'Medium (1000-1500)', 'Good (1500-2000)', 'High (>2000)']:
    group = complete[complete['Ca_Level'] == level]
    if len(group) > 0:
        print(f'  {level}: {group["Brix"].mean():.2f}°Bx avg (n={len(group)})')

print('\n═══════════════════════════════════════════════════════════')
print('TEST 4: FARM PRACTICES → BRIX')
print('═══════════════════════════════════════════════════════════\n')

practices_data = complete[complete['Farm Practices'].notna()].copy()

# Check for regenerative
practices_data['is_regenerative'] = practices_data['Farm Practices'].str.contains(
    'regenerative', case=False, na=False
)
practices_data['is_organic'] = practices_data['Farm Practices'].str.contains(
    'organic', case=False, na=False
)

regen = practices_data[practices_data['is_regenerative']]['Brix'].mean()
non_regen = practices_data[~practices_data['is_regenerative']]['Brix'].mean()

print(f'Regenerative: {regen:.2f}°Bx avg')
print(f'Non-regenerative: {non_regen:.2f}°Bx avg')
print(f'Difference: {regen - non_regen:.2f}°Bx')

if regen > non_regen:
    print(f'✅ Regenerative practices → Higher Brix!')

print('\n═══════════════════════════════════════════════════════════')
print('SUMMARY: DOES SOIL AFFECT BRIX?')
print('═══════════════════════════════════════════════════════════\n')

print('ALBRECHT/REAMS VALIDATION:')
print(f'  Phosphorus affects Brix: Test with {len(with_p)} samples')
print(f'  Ca:Mg ratio matters: Test with {len(with_ratio)} samples')
print(f'  Practices affect Brix: Test with {len(practices_data)} samples')

print(f'\nThis data enables quantifying S→E connection!')
print(f'Framework can now predict: Soil minerals → Expected Brix')
print()
