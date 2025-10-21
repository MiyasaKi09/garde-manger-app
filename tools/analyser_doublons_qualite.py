#!/usr/bin/env python3
"""
Analyse de la qualité et des doublons dans la base de recettes
Détecte les recettes redondantes, trop génériques ou inutiles
"""

import csv
from collections import defaultdict
import re
from difflib import SequenceMatcher

def normalize_name(name):
    """Normalise un nom pour la comparaison"""
    # Minuscules
    name = name.lower()
    # Supprimer accents (simple)
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ô': 'o', 'ö': 'o',
        'û': 'u', 'ü': 'u', 'ù': 'u',
        'î': 'i', 'ï': 'i',
        'ç': 'c',
        'œ': 'oe'
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    # Normaliser espaces
    name = ' '.join(name.split())
    
    return name

def similarity(s1, s2):
    """Calcule la similarité entre deux chaînes (0-1)"""
    return SequenceMatcher(None, s1, s2).ratio()

def load_all_recipes():
    """Charge toutes les recettes depuis les 3 batches"""
    recipes = []
    
    for batch_file in ['recipes_300.csv', 'recipes_300_batch2.csv', 'recipes_batch3_remaining.csv']:
        try:
            with open(batch_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    recipes.append({
                        'id': row['id'],
                        'name': row['name'],
                        'role': row['role'],
                        'name_normalized': normalize_name(row['name'])
                    })
        except FileNotFoundError:
            print(f"⚠️  Fichier {batch_file} non trouvé")
    
    return recipes

def analyze_duplicates(recipes):
    """Détecte les doublons exacts et quasi-identiques"""
    print("\n" + "="*80)
    print("🔍 ANALYSE DES DOUBLONS")
    print("="*80)
    
    # Doublons exacts (nom normalisé identique)
    exact_duplicates = defaultdict(list)
    for recipe in recipes:
        exact_duplicates[recipe['name_normalized']].append(recipe)
    
    exact_count = 0
    for name_norm, dups in sorted(exact_duplicates.items()):
        if len(dups) > 1:
            exact_count += len(dups) - 1
            print(f"\n❌ DOUBLON EXACT ({len(dups)} recettes) :")
            for dup in dups:
                print(f"   [{dup['id']:4s}] {dup['name']:60s} ({dup['role']})")
    
    if exact_count == 0:
        print("✅ Aucun doublon exact trouvé")
    else:
        print(f"\n📊 Total: {exact_count} doublons exacts")
    
    # Quasi-doublons (similarité > 90%)
    print("\n" + "="*80)
    print("🔍 QUASI-DOUBLONS (similarité > 90%)")
    print("="*80)
    
    quasi_duplicates = []
    for i, recipe1 in enumerate(recipes):
        for recipe2 in recipes[i+1:]:
            sim = similarity(recipe1['name_normalized'], recipe2['name_normalized'])
            if sim > 0.90 and sim < 1.0:  # Pas 100% (déjà traité)
                quasi_duplicates.append((recipe1, recipe2, sim))
    
    quasi_duplicates.sort(key=lambda x: -x[2])
    
    if quasi_duplicates:
        for recipe1, recipe2, sim in quasi_duplicates[:50]:  # Top 50
            print(f"\n⚠️  Similarité {sim:.1%} :")
            print(f"   [{recipe1['id']:4s}] {recipe1['name']}")
            print(f"   [{recipe2['id']:4s}] {recipe2['name']}")
    else:
        print("✅ Aucun quasi-doublon trouvé")
    
    print(f"\n📊 Total: {len(quasi_duplicates)} paires quasi-identiques")
    
    return exact_count, len(quasi_duplicates)

def analyze_generic_recipes(recipes):
    """Détecte les recettes trop génériques"""
    print("\n" + "="*80)
    print("🔍 RECETTES TROP GÉNÉRIQUES")
    print("="*80)
    
    generic_patterns = [
        # Motifs génériques à détecter
        (r'^(boeuf|bœuf|veau|agneau|porc|poulet|dinde|canard|saumon|thon|cabillaud) (aux?|au|à la|à l\') (légumes?|herbes?|épices?|sauce|tomates?)$', 
         "Trop vague - manque de spécificité"),
        (r'^(boeuf|bœuf|veau|agneau|porc|poulet|dinde|canard) grillé$',
         "Trop simple - manque d'originalité"),
        (r'^(boeuf|bœuf|veau|agneau|porc|poulet|dinde|canard) rôti$',
         "Trop simple - manque d'originalité"),
        (r'^(boeuf|bœuf|veau|agneau|porc|poulet|dinde) sauce .*$',
         "Générique - quelle sauce ?"),
        (r'^potage aux? .*$',
         "Générique - tous les potages se ressemblent"),
        (r'^salade de? .*$',
         "Peut être générique"),
    ]
    
    generic_recipes = []
    
    for recipe in recipes:
        name_norm = recipe['name_normalized']
        for pattern, reason in generic_patterns:
            if re.match(pattern, name_norm):
                generic_recipes.append((recipe, reason))
                break
    
    if generic_recipes:
        # Grouper par raison
        by_reason = defaultdict(list)
        for recipe, reason in generic_recipes:
            by_reason[reason].append(recipe)
        
        for reason, recs in sorted(by_reason.items()):
            print(f"\n⚠️  {reason} ({len(recs)} recettes) :")
            for recipe in sorted(recs, key=lambda x: x['name'])[:20]:  # Max 20 exemples
                print(f"   [{recipe['id']:4s}] {recipe['name']:60s} ({recipe['role']})")
            if len(recs) > 20:
                print(f"   ... et {len(recs) - 20} autres")
    else:
        print("✅ Pas de recettes manifestement trop génériques")
    
    print(f"\n📊 Total: {len(generic_recipes)} recettes potentiellement trop génériques")
    
    return len(generic_recipes)

def analyze_micro_variations(recipes):
    """Détecte les micro-variations (ex: poulet grillé, poulet grillé aux herbes, etc.)"""
    print("\n" + "="*80)
    print("🔍 MICRO-VARIATIONS (variations mineures d'un même plat)")
    print("="*80)
    
    # Grouper par base de nom
    groups = defaultdict(list)
    
    for recipe in recipes:
        # Extraire la base (avant les détails)
        name_norm = recipe['name_normalized']
        
        # Patterns pour extraire la base
        base = name_norm
        
        # Retirer les détails après "aux, au, à la, avec, sauce, mariné, glacé, etc."
        for sep in [' aux ', ' au ', ' à la ', ' à l\'', ' avec ', ' et ', ' sauce ', ' marine', ' glace', ' roti', ' grille', ' pane', ' frit']:
            if sep in base:
                base = base.split(sep)[0]
                break
        
        groups[base].append(recipe)
    
    # Identifier les groupes avec beaucoup de variations
    micro_variations = []
    for base, recs in groups.items():
        if len(recs) >= 5:  # 5+ variations = suspect
            micro_variations.append((base, recs))
    
    micro_variations.sort(key=lambda x: -len(x[1]))
    
    if micro_variations:
        print(f"\n{len(micro_variations)} bases avec beaucoup de variations :\n")
        
        for base, recs in micro_variations[:30]:  # Top 30
            print(f"\n📋 Base: '{base}' ({len(recs)} variations)")
            for recipe in sorted(recs, key=lambda x: x['name'])[:10]:
                print(f"   [{recipe['id']:4s}] {recipe['name']}")
            if len(recs) > 10:
                print(f"   ... et {len(recs) - 10} autres variations")
    else:
        print("✅ Pas de groupes avec trop de micro-variations")
    
    total_variations = sum(len(recs) for _, recs in micro_variations)
    print(f"\n📊 Total: {len(micro_variations)} groupes avec {total_variations} recettes")
    
    return micro_variations

def analyze_usefulness(recipes):
    """Analyse l'utilité des recettes"""
    print("\n" + "="*80)
    print("🔍 ANALYSE DE L'UTILITÉ")
    print("="*80)
    
    # Recettes suspects
    suspicious = []
    
    for recipe in recipes:
        name = recipe['name'].lower()
        
        # Critères de suspicion
        reasons = []
        
        # Trop court (manque de détail)
        if len(recipe['name']) < 15:
            reasons.append("Nom trop court/vague")
        
        # Que des ingrédients de base
        if any(pattern in name for pattern in [
            'bœuf aux', 'veau aux', 'agneau aux', 'porc aux',
            'poulet aux', 'dinde aux', 'canard aux'
        ]):
            if not any(specific in name for specific in [
                'curry', 'moutarde', 'miel', 'vin', 'sauce',
                'braisé', 'confit', 'rôti', 'grillé'
            ]):
                reasons.append("Ingrédient + accompagnement basique")
        
        # Recettes "froid" (peu utiles dans une app de cuisine)
        if 'froid' in name and recipe['role'] != 'ENTREE':
            reasons.append("Recette 'froid' redondante")
        
        if reasons:
            suspicious.append((recipe, reasons))
    
    if suspicious:
        # Grouper par raison
        by_reason = defaultdict(list)
        for recipe, reasons in suspicious:
            for reason in reasons:
                by_reason[reason].append(recipe)
        
        for reason, recs in sorted(by_reason.items()):
            print(f"\n⚠️  {reason} ({len(recs)} recettes) :")
            for recipe in sorted(recs, key=lambda x: x['name'])[:15]:
                print(f"   [{recipe['id']:4s}] {recipe['name']:60s} ({recipe['role']})")
            if len(recs) > 15:
                print(f"   ... et {len(recs) - 15} autres")
    
    print(f"\n📊 Total: {len(suspicious)} recettes potentiellement peu utiles")
    
    return len(suspicious)

def generate_recommendations(recipes, exact_dups, quasi_dups, generic_count, micro_variations, suspicious_count):
    """Génère les recommandations finales"""
    print("\n" + "="*80)
    print("💡 RECOMMANDATIONS")
    print("="*80)
    
    print(f"\n📊 Récapitulatif:")
    print(f"   • Total recettes: {len(recipes)}")
    print(f"   • Doublons exacts: {exact_dups}")
    print(f"   • Quasi-doublons: {quasi_dups}")
    print(f"   • Recettes génériques: {generic_count}")
    print(f"   • Groupes avec micro-variations: {len(micro_variations)}")
    print(f"   • Recettes peu utiles: {suspicious_count}")
    
    # Calculer le nombre estimé de recettes à nettoyer
    to_clean = exact_dups + (quasi_dups // 2) + (generic_count // 3) + suspicious_count
    
    print(f"\n🎯 Actions recommandées:")
    print(f"   1. Supprimer les {exact_dups} doublons exacts")
    print(f"   2. Fusionner ~{quasi_dups // 2} quasi-doublons")
    print(f"   3. Enrichir ou supprimer ~{generic_count // 3} recettes génériques")
    print(f"   4. Consolider les groupes avec trop de micro-variations")
    print(f"   5. Supprimer les recettes peu utiles")
    
    print(f"\n📉 Nettoyage estimé: {to_clean} recettes à réviser ({to_clean * 100 // len(recipes)}%)")
    print(f"   Base optimale: ~{len(recipes) - to_clean} recettes de qualité")
    
    return to_clean

def main():
    print("🔍 ANALYSE QUALITÉ DE LA BASE DE RECETTES")
    print("="*80)
    
    recipes = load_all_recipes()
    print(f"\n📖 {len(recipes)} recettes chargées")
    
    # Analyses
    exact_dups, quasi_dups = analyze_duplicates(recipes)
    generic_count = analyze_generic_recipes(recipes)
    micro_variations = analyze_micro_variations(recipes)
    suspicious_count = analyze_usefulness(recipes)
    
    # Recommandations
    to_clean = generate_recommendations(
        recipes, exact_dups, quasi_dups, 
        generic_count, micro_variations, suspicious_count
    )
    
    print("\n✅ Analyse terminée !")
    print("\nVoulez-vous générer un fichier CSV avec les recettes à réviser ? (O/N)")

if __name__ == '__main__':
    main()
