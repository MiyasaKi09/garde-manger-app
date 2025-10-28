#!/usr/bin/env python3
"""
Fusionne le fichier existant avec les nouvelles recettes enrichies.
Produit un fichier final complet trié par ID.
"""

import csv
import sys
from collections import OrderedDict

def load_recipes_from_file(filepath):
    """Charge les recettes depuis un fichier CSV."""
    recipes = {}

    print(f"📖 Chargement: {filepath}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            # Lire ligne par ligne pour gérer les formats complexes
            first_line = f.readline()

            for line in f:
                line = line.strip()
                if not line:
                    continue

                # Extraire l'ID (premier champ)
                comma_pos = line.find(',')
                if comma_pos == -1:
                    continue

                try:
                    recipe_id = int(line[:comma_pos])
                    recipes[recipe_id] = line
                except ValueError:
                    print(f"⚠️  Ligne ignorée (ID invalide): {line[:50]}...")
                    continue

        print(f"✅ {len(recipes)} recettes chargées")
        return recipes

    except FileNotFoundError:
        print(f"⚠️  Fichier non trouvé: {filepath}")
        return {}


def merge_and_write(existing_file, enriched_file, output_file):
    """Fusionne deux fichiers de recettes."""
    print("=" * 80)
    print("🔄 FUSION DES FICHIERS DE RECETTES")
    print("=" * 80)

    # Charger les fichiers
    existing = load_recipes_from_file(existing_file)
    enriched = load_recipes_from_file(enriched_file)

    # Fusionner (les nouvelles écrasent les anciennes si même ID)
    all_recipes = {**existing, **enriched}

    print(f"\n📊 Statistiques:")
    print(f"  - Recettes existantes:  {len(existing)}")
    print(f"  - Recettes enrichies:   {len(enriched)}")
    print(f"  - Total après fusion:   {len(all_recipes)}")

    # Détecter les recettes écrasées
    overlapping = set(existing.keys()) & set(enriched.keys())
    if overlapping:
        print(f"  - Recettes écrasées:    {len(overlapping)}")
        if len(overlapping) <= 10:
            print(f"    IDs: {sorted(overlapping)}")

    # Écrire le fichier de sortie
    print(f"\n📝 Écriture: {output_file}")

    with open(output_file, 'w', encoding='utf-8') as f:
        # En-tête
        f.write('ID,Nom,Portions,Ingrédients\n')

        # Recettes triées par ID
        for recipe_id in sorted(all_recipes.keys()):
            f.write(all_recipes[recipe_id] + '\n')

    print(f"✅ Fichier créé avec succès!")

    # Statistiques finales
    ids = sorted(all_recipes.keys())
    print(f"\n📈 Plage d'IDs:")
    print(f"  - Min: {min(ids)}")
    print(f"  - Max: {max(ids)}")
    print(f"  - Total: {len(ids)}")

    # Détecter les gaps
    all_ids_in_range = set(range(min(ids), max(ids) + 1))
    existing_ids = set(ids)
    missing_ids = sorted(all_ids_in_range - existing_ids)

    if missing_ids:
        print(f"\n⚠️  IDs manquants dans la plage: {len(missing_ids)}")
        if len(missing_ids) <= 20:
            print(f"  {missing_ids}")
        else:
            print(f"  Premiers: {missing_ids[:10]}")
            print(f"  Derniers: {missing_ids[-10:]}")


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python3 merge_recipe_files.py <fichier_existant> <fichier_enrichi> <fichier_sortie>")
        print("\nExemple:")
        print("  python3 merge_recipe_files.py \\")
        print("    'LISTE_TOUTES_RECETTES_NORMALISEE (2).txt' \\")
        print("    'nouvelles_recettes.txt' \\")
        print("    'LISTE_TOUTES_RECETTES_COMPLETE.txt'")
        sys.exit(1)

    existing_file = sys.argv[1]
    enriched_file = sys.argv[2]
    output_file = sys.argv[3]

    merge_and_write(existing_file, enriched_file, output_file)
