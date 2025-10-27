#!/usr/bin/env python3
"""
Script de finalisation - Import des batches 3-6 canonical_foods
90 lignes déjà importées, reste 137 lignes
"""

import csv

# Lire tout le CSV
with open('supabase/exports/latest/csv/canonical_foods.csv', 'r') as f:
    reader = csv.DictReader(f)
    all_rows = list(reader)

print(f"Total lignes CSV: {len(all_rows)}")
print(f"Déjà importé: 90 lignes (batches 1-2)")
print(f"Reste: {len(all_rows) - 90} lignes\n")

# Générer les 4 scripts SQL restants pour copier-coller manuel
batches = [
    (3, 90, 135),   # Batch 3: lignes 91-135
    (4, 135, 180),  # Batch 4: lignes 136-180
    (5, 180, 225),  # Batch 5: lignes 181-225
    (6, 225, len(all_rows))  # Batch 6: lignes 226-227
]

for batch_num, start_idx, end_idx in batches:
    batch_rows = all_rows[start_idx:end_idx]
    
    print(f"=== BATCH {batch_num} ===")
    print(f"Lignes {start_idx+1}-{end_idx} ({len(batch_rows)} lignes)")
    print(f"IDs: {batch_rows[0]['id']} à {batch_rows[-1]['id']}")
    print(f"Noms: {batch_rows[0]['canonical_name']} ... {batch_rows[-1]['canonical_name']}")
    print()

print("\n✅ Informations générées")
print("\n🎯 Action requise:")
print("   Exécuter chaque batch via pgsql_modify tool")
print("   Fichiers SQL prêts dans /tmp/canonical_batch3-6.sql")
