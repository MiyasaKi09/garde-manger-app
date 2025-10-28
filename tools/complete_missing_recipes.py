#!/usr/bin/env python3
"""
Script pour compléter les recettes manquantes avec leurs ingrédients
Utilise WebSearch pour trouver les recettes authentiques
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import csv
import re
import json
from typing import List, Dict, Tuple
import time

# Configuration
DATABASE_URL = 'postgresql://postgres:qnYlPNuhMmHTzcUR@aws-1-eu-west-3.pooler.supabase.com:6544/postgres?sslmode=require&options=project%3Dyylkwfikfbottngglaxj'
EXISTING_FILE = '/workspaces/garde-manger-app/LISTE_TOUTES_RECETTES_NORMALISEE (2).txt'
OUTPUT_FILE = '/workspaces/garde-manger-app/LISTE_TOUTES_RECETTES_COMPLETE.txt'
PROGRESS_FILE = '/workspaces/garde-manger-app/tools/enrichment_progress.json'
BATCH_SIZE = 50

def connect_db():
    """Connexion à la base de données Supabase."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def load_existing_recipes() -> Dict[int, Dict]:
    """Charge les recettes existantes depuis le fichier."""
    print("📖 Chargement des recettes existantes...")
    existing = {}

    with open(EXISTING_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                recipe_id = int(row['ID'])
                existing[recipe_id] = {
                    'id': recipe_id,
                    'name': row['Nom'],
                    'portions': int(row['Portions']) if row['Portions'] else 4,
                    'ingredients': row['Ingrédients']
                }
            except (ValueError, KeyError) as e:
                print(f"⚠️  Erreur ligne: {row} - {e}")
                continue

    print(f"✅ {len(existing)} recettes chargées du fichier existant")
    return existing

def get_recipes_without_ingredients(conn) -> List[Dict]:
    """Récupère toutes les recettes qui n'ont PAS d'ingrédients."""
    print("\n🔍 Recherche des recettes sans ingrédients...")

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                r.id,
                r.name,
                r.servings,
                COUNT(ri.id) as ingredient_count
            FROM recipes r
            LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
            GROUP BY r.id, r.name, r.servings
            HAVING COUNT(ri.id) = 0
            ORDER BY r.id
        """)

        recipes = cur.fetchall()
        print(f"✅ {len(recipes)} recettes trouvées sans ingrédients")
        return [dict(r) for r in recipes]

def get_all_recipes(conn) -> List[Dict]:
    """Récupère TOUTES les recettes."""
    print("\n📚 Chargement de TOUTES les recettes...")

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                r.id,
                r.name,
                r.servings
            FROM recipes r
            ORDER BY r.id
        """)

        recipes = cur.fetchall()
        print(f"✅ {len(recipes)} recettes totales dans la base")
        return [dict(r) for r in recipes]

def get_canonical_foods(conn) -> Dict[str, int]:
    """Récupère la liste des aliments canoniques pour normalisation."""
    print("\n🍎 Chargement des aliments canoniques...")

    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM canonical_foods")
        foods = cur.fetchall()

    food_map = {food['name'].lower(): food['id'] for food in foods}
    print(f"✅ {len(food_map)} aliments canoniques chargés")
    return food_map

def load_progress() -> Dict:
    """Charge la progression depuis le fichier JSON."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'processed': [],
        'failed': [],
        'current_batch': 0
    }

def save_progress(progress: Dict):
    """Sauvegarde la progression."""
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, indent=2, ensure_ascii=False)

def normalize_unit(unit_str: str) -> str:
    """Normalise les unités de mesure."""
    unit_map = {
        'gramme': 'g',
        'grammes': 'g',
        'gr': 'g',
        'kilo': 'kg',
        'kilogramme': 'kg',
        'kilogrammes': 'kg',
        'litre': 'L',
        'litres': 'L',
        'l': 'L',
        'millilitre': 'ml',
        'millilitres': 'ml',
        'cl': 'cl',
        'centilitre': 'cl',
        'centilitres': 'cl',
        'cuillère à soupe': 'cuillère à soupe',
        'cuillères à soupe': 'cuillère à soupe',
        'c. à soupe': 'cuillère à soupe',
        'càs': 'cuillère à soupe',
        'cs': 'cuillère à soupe',
        'cuillère à café': 'cuillère à café',
        'cuillères à café': 'cuillère à café',
        'c. à café': 'cuillère à café',
        'càc': 'cuillère à café',
        'cc': 'cuillère à café',
        'pièce': 'pièce',
        'pièces': 'pièce',
        'pc': 'pièce',
        'unité': 'pièce',
        'unités': 'pièce',
        'tranche': 'tranche',
        'tranches': 'tranche',
        'gousse': 'gousse',
        'gousses': 'gousse',
        'bouquet': 'bouquet',
        'pincée': 'pincée',
        'pincées': 'pincée',
    }

    unit_lower = unit_str.lower().strip()
    return unit_map.get(unit_lower, unit_str)

def format_ingredient(quantity: str, unit: str, name: str) -> str:
    """Formate un ingrédient au format requis."""
    normalized_unit = normalize_unit(unit)
    return f'"{quantity}|{normalized_unit}|{name}"'

def search_recipe_online(recipe_name: str, portions: int) -> str:
    """
    Cette fonction est un placeholder.
    Dans le code réel, elle devrait utiliser WebSearch pour trouver la recette.
    """
    # NOTE: Cette fonction sera remplacée par des appels réels à WebSearch
    # via Claude Code dans le workflow principal
    return f"# Recherche nécessaire: {recipe_name} ({portions} portions)"

def write_complete_file(all_recipes: List[Dict], existing: Dict[int, Dict], enriched: Dict[int, str]):
    """Écrit le fichier complet avec toutes les recettes."""
    print(f"\n📝 Écriture du fichier complet...")

    with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
        f.write('ID,Nom,Portions,Ingrédients\n')

        for recipe in sorted(all_recipes, key=lambda x: x['id']):
            recipe_id = recipe['id']
            name = recipe['name']
            portions = recipe.get('servings', 4) or 4

            # Utiliser les données existantes en priorité
            if recipe_id in existing:
                ingredients = existing[recipe_id]['ingredients']
            elif recipe_id in enriched:
                ingredients = enriched[recipe_id]
            else:
                ingredients = ''

            # Échapper les guillemets dans le nom
            name_escaped = name.replace('"', '""')

            f.write(f'{recipe_id},{name_escaped},{portions},{ingredients}\n')

    print(f"✅ Fichier créé: {OUTPUT_FILE}")

def generate_batch_file(recipes: List[Dict], batch_num: int, batch_size: int) -> str:
    """Génère un fichier batch pour traitement manuel."""
    start_idx = batch_num * batch_size
    end_idx = min(start_idx + batch_size, len(recipes))
    batch_recipes = recipes[start_idx:end_idx]

    batch_file = f'/workspaces/garde-manger-app/tools/batch_{batch_num + 1:03d}.txt'

    with open(batch_file, 'w', encoding='utf-8') as f:
        f.write(f"# BATCH {batch_num + 1} - Recettes {start_idx + 1} à {end_idx}\n")
        f.write(f"# Total: {len(batch_recipes)} recettes\n\n")

        for recipe in batch_recipes:
            f.write(f"## ID: {recipe['id']}\n")
            f.write(f"## Nom: {recipe['name']}\n")
            f.write(f"## Portions: {recipe.get('servings', 4)}\n")
            f.write(f"## Format attendu: ID,Nom,Portions,\"quantité1|unité1|nom1\",\"quantité2|unité2|nom2\"...\n")
            f.write(f"## Rechercher sur internet et formater:\n\n")
            f.write("\n---\n\n")

    print(f"📄 Batch généré: {batch_file}")
    return batch_file

def main():
    """Fonction principale."""
    print("=" * 80)
    print("🚀 ENRICHISSEMENT MASSIF DES RECETTES")
    print("=" * 80)

    # Connexion à la base
    conn = connect_db()

    try:
        # 1. Charger les données
        existing_recipes = load_existing_recipes()
        all_recipes = get_all_recipes(conn)
        recipes_without_ingredients = get_recipes_without_ingredients(conn)
        canonical_foods = get_canonical_foods(conn)

        # 2. Statistiques
        print("\n" + "=" * 80)
        print("📊 STATISTIQUES")
        print("=" * 80)
        print(f"Total recettes dans la base:     {len(all_recipes)}")
        print(f"Recettes avec ingrédients (CSV): {len(existing_recipes)}")
        print(f"Recettes SANS ingrédients (DB):  {len(recipes_without_ingredients)}")
        print(f"Aliments canoniques:             {len(canonical_foods)}")

        # 3. Générer les fichiers batch pour traitement
        print("\n" + "=" * 80)
        print("📦 GÉNÉRATION DES BATCHES")
        print("=" * 80)

        num_batches = (len(recipes_without_ingredients) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"Nombre de batches à générer: {num_batches}")

        for i in range(num_batches):
            generate_batch_file(recipes_without_ingredients, i, BATCH_SIZE)

        # 4. Créer le fichier initial (avec les données existantes)
        print("\n" + "=" * 80)
        print("📝 CRÉATION DU FICHIER INITIAL")
        print("=" * 80)

        enriched = {}  # Sera rempli au fur et à mesure
        write_complete_file(all_recipes, existing_recipes, enriched)

        # 5. Rapport final
        print("\n" + "=" * 80)
        print("✅ RAPPORT FINAL")
        print("=" * 80)
        print(f"Fichier de sortie créé:    {OUTPUT_FILE}")
        print(f"Recettes avec données:     {len(existing_recipes)}")
        print(f"Recettes à enrichir:       {len(recipes_without_ingredients)}")
        print(f"Batches générés:           {num_batches}")
        print(f"\n📍 Prochaine étape:")
        print(f"   Traiter les batches avec WebSearch")
        print(f"   Fichiers: batch_001.txt à batch_{num_batches:03d}.txt")

    finally:
        conn.close()

if __name__ == '__main__':
    main()
