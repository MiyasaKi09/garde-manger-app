#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère le SQL pour insérer les ingrédients des recettes
dans la table recipe_ingredients en matchant avec canonical_foods
"""

import csv
import re
from difflib import SequenceMatcher

def normalize_ingredient_name(name):
    """Normalise le nom d'un ingrédient pour faciliter le matching"""
    name = name.lower().strip()
    # Retirer les adjectifs courants
    name = re.sub(r'\s+(frais|fraîche|fraîches|cuit|cuite|cuites|moulu|moulue|râpé|râpée|haché|hachée|pelé|pelée|dénoyauté|dénoyautée|séché|séchée|congelé|congelée).*', '', name)
    # Retirer les parenthèses et leur contenu
    name = re.sub(r'\([^)]*\)', '', name)
    # Nettoyer les espaces multiples
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def similarity_ratio(a, b):
    """Calcule la similarité entre deux chaînes"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def find_best_canonical_food_match(ingredient_name, canonical_foods):
    """
    Trouve le meilleur match dans canonical_foods pour un ingrédient
    Retourne (canonical_food_id, canonical_name, confidence_score)
    """
    normalized_ingredient = normalize_ingredient_name(ingredient_name)
    
    best_match = None
    best_score = 0.0
    best_food_id = None
    
    for food_id, food_name, keywords in canonical_foods:
        # Vérifier le nom canonique
        score = similarity_ratio(normalized_ingredient, food_name)
        
        # Vérifier les keywords
        if keywords:
            keywords_str = keywords.strip('{}').replace('"', '')
            for keyword in keywords_str.split(','):
                keyword_score = similarity_ratio(normalized_ingredient, keyword.strip())
                score = max(score, keyword_score)
        
        # Vérifier si le nom normalisé est contenu dans le nom canonique ou inversement
        if normalized_ingredient in food_name or food_name in normalized_ingredient:
            score = max(score, 0.85)
        
        if score > best_score:
            best_score = score
            best_match = food_name
            best_food_id = food_id
    
    return (best_food_id, best_match, best_score)

def main():
    print("🔍 Chargement des canonical_foods...")
    
    # Charger canonical_foods
    canonical_foods = []
    with open('../supabase/exports/latest/csv/canonical_foods.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            canonical_foods.append((
                row['id'],
                row['canonical_name'],
                row.get('keywords', '')
            ))
    
    print(f"✅ {len(canonical_foods)} aliments canoniques chargés")
    
    # Charger les recettes avec ingrédients
    print("\n🔍 Lecture des recettes et parsing des ingrédients...")
    
    recipes_data = []
    unmatched_ingredients = {}  # Pour tracker les ingrédients non matchés
    
    with open('../LISTE_TOUTES_RECETTES COMPLETE.txt', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header
        
        for row in reader:
            if not row or len(row) < 4:
                continue
                
            recipe_id = row[0].strip()
            recipe_name = row[1].strip()
            portions = row[2].strip()
            
            if not recipe_id:
                continue
            
            # Parser les ingrédients (à partir de la colonne 3)
            ingredients = []
            
            for i in range(3, len(row)):
                ingredient_raw = row[i].strip()
                if not ingredient_raw:
                    continue
                
                # Format: quantité|unité|nom
                fields = ingredient_raw.split('|')
                if len(fields) >= 3:
                    quantity = fields[0].strip()
                    unit = fields[1].strip()
                    ingredient_name = fields[2].strip()
                    
                    # Trouver le match dans canonical_foods
                    food_id, matched_name, confidence = find_best_canonical_food_match(
                        ingredient_name, 
                        canonical_foods
                    )
                    
                    ingredients.append({
                        'original_name': ingredient_name,
                        'quantity': quantity,
                        'unit': unit,
                        'canonical_food_id': food_id,
                        'matched_name': matched_name,
                        'confidence': confidence
                    })
                    
                    # Tracker les matchs faibles
                    if confidence < 0.7:
                        key = ingredient_name
                        if key not in unmatched_ingredients:
                            unmatched_ingredients[key] = {
                                'best_match': matched_name,
                                'confidence': confidence,
                                'count': 0
                            }
                        unmatched_ingredients[key]['count'] += 1
            
            if ingredients:
                recipes_data.append({
                    'recipe_id': recipe_id,
                    'recipe_name': recipe_name,
                    'ingredients': ingredients
                })
    
    print(f"✅ {len(recipes_data)} recettes avec ingrédients parsées")
    print(f"⚠️  {len(unmatched_ingredients)} ingrédients avec matching faible (<70%)")
    
    # Générer le SQL
    print("\n📝 Génération du SQL...")
    
    sql_file = 'insert_recipe_ingredients.sql'
    report_file = 'recipe_ingredients_matching_report.txt'
    low_confidence_file = 'low_confidence_matches.csv'
    
    with open(sql_file, 'w', encoding='utf-8') as sql_f, \
         open(report_file, 'w', encoding='utf-8') as report_f, \
         open(low_confidence_file, 'w', encoding='utf-8') as low_f:
        
        # En-tête SQL
        sql_f.write("-- Insertion des ingrédients de recettes\n")
        sql_f.write("-- Généré automatiquement à partir de LISTE_TOUTES_RECETTES COMPLETE.txt\n")
        sql_f.write("-- " + "=" * 70 + "\n\n")
        sql_f.write("BEGIN;\n\n")
        
        # En-tête rapport
        report_f.write("RAPPORT DE MATCHING DES INGRÉDIENTS\n")
        report_f.write("=" * 80 + "\n\n")
        
        # CSV des matchs faibles
        csv_writer = csv.writer(low_f, delimiter='|')
        csv_writer.writerow(['Ingredient_Original', 'Meilleur_Match', 'Confidence', 'Canonical_Food_ID', 'Occurrences'])
        
        total_ingredients = 0
        high_confidence = 0
        medium_confidence = 0
        low_confidence_count = 0
        
        for recipe in recipes_data:
            recipe_id = recipe['recipe_id']
            recipe_name = recipe['recipe_name']
            
            report_f.write(f"\n{'=' * 80}\n")
            report_f.write(f"Recette #{recipe_id}: {recipe_name}\n")
            report_f.write(f"{'=' * 80}\n\n")
            
            sql_f.write(f"-- Recette #{recipe_id}: {recipe_name}\n")
            
            for ing in recipe['ingredients']:
                total_ingredients += 1
                confidence = ing['confidence']
                
                if confidence >= 0.85:
                    high_confidence += 1
                    status = "✅ EXCELLENT"
                elif confidence >= 0.70:
                    medium_confidence += 1
                    status = "🟡 BON"
                else:
                    low_confidence_count += 1
                    status = "⚠️  FAIBLE"
                
                # Rapport
                report_f.write(f"{status} ({confidence:.0%})\n")
                report_f.write(f"  Original  : {ing['original_name']}\n")
                report_f.write(f"  Matché    : {ing['matched_name']} (ID: {ing['canonical_food_id']})\n")
                report_f.write(f"  Quantité  : {ing['quantity']} {ing['unit']}\n\n")
                
                # SQL INSERT
                notes = f"Auto-matched ({confidence:.0%} confidence)" if confidence < 1.0 else ""
                
                sql_f.write(f"INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, quantity, unit, notes)\n")
                sql_f.write(f"VALUES ({recipe_id}, {ing['canonical_food_id']}, {ing['quantity']}, '{ing['unit']}', '{notes}');\n")
            
            sql_f.write("\n")
        
        # Footer SQL
        sql_f.write("\nCOMMIT;\n")
        sql_f.write(f"\n-- Total: {total_ingredients} ingrédients insérés pour {len(recipes_data)} recettes\n")
        
        # Rapport des matchs faibles
        report_f.write("\n" + "=" * 80 + "\n")
        report_f.write("INGRÉDIENTS AVEC MATCHING FAIBLE (<70%)\n")
        report_f.write("=" * 80 + "\n\n")
        
        if unmatched_ingredients:
            for ingredient, info in sorted(unmatched_ingredients.items(), key=lambda x: x[1]['confidence']):
                report_f.write(f"⚠️  {ingredient}\n")
                report_f.write(f"   Meilleur match: {info['best_match']} ({info['confidence']:.0%})\n")
                report_f.write(f"   Occurrences: {info['count']}\n\n")
                
                # Trouver l'ID du match
                food_id = None
                for fid, fname, _ in canonical_foods:
                    if fname == info['best_match']:
                        food_id = fid
                        break
                
                csv_writer.writerow([
                    ingredient,
                    info['best_match'],
                    f"{info['confidence']:.2%}",
                    food_id or '',
                    info['count']
                ])
        else:
            report_f.write("Aucun ingrédient avec matching faible! 🎉\n")
        
        # Statistiques finales
        report_f.write("\n" + "=" * 80 + "\n")
        report_f.write("STATISTIQUES GLOBALES\n")
        report_f.write("=" * 80 + "\n\n")
        report_f.write(f"Total recettes     : {len(recipes_data)}\n")
        report_f.write(f"Total ingrédients  : {total_ingredients}\n")
        report_f.write(f"Excellent match    : {high_confidence} ({high_confidence*100//total_ingredients if total_ingredients else 0}%)\n")
        report_f.write(f"Bon match          : {medium_confidence} ({medium_confidence*100//total_ingredients if total_ingredients else 0}%)\n")
        report_f.write(f"Matching faible    : {low_confidence_count} ({low_confidence_count*100//total_ingredients if total_ingredients else 0}%)\n")
    
    print(f"\n✅ Fichiers générés:")
    print(f"   📄 {sql_file}")
    print(f"   📄 {report_file}")
    print(f"   📄 {low_confidence_file}")
    print(f"\n📊 Statistiques:")
    print(f"   Total recettes     : {len(recipes_data)}")
    print(f"   Total ingrédients  : {total_ingredients}")
    print(f"   ✅ Excellent (≥85%): {high_confidence} ({high_confidence*100//total_ingredients if total_ingredients else 0}%)")
    print(f"   🟡 Bon (70-84%)    : {medium_confidence} ({medium_confidence*100//total_ingredients if total_ingredients else 0}%)")
    print(f"   ⚠️  Faible (<70%)  : {low_confidence_count} ({low_confidence_count*100//total_ingredients if total_ingredients else 0}%)")
    
    if low_confidence_count > 0:
        print(f"\n⚠️  ATTENTION: {low_confidence_count} ingrédients ont un matching faible!")
        print(f"   Consultez {low_confidence_file} pour les réviser manuellement.")
    
    print(f"\n🚀 Pour insérer les données:")
    print(f"   PGPASSWORD='...' psql \"$DATABASE_URL_TX\" -f {sql_file}")

if __name__ == '__main__':
    main()
