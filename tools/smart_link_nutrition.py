#!/usr/bin/env python3
"""
Script pour créer un mapping complet et précis entre canonical_foods et Ciqual
Recherche intelligente avec mots-clés prioritaires
"""
import csv
import json

MAPPING_FILE = 'data/mapping_canonical_ciqual.csv'

# Charger tous les aliments Ciqual
print("📖 Chargement Ciqual...")
ciqual = {}
with open(MAPPING_FILE, 'r', encoding='iso-8859-1') as f:
    reader = csv.reader(f, delimiter=';')
    next(reader)
    for row in reader:
        if len(row) >= 8:
            code = row[6]
            nom = row[7].lower()
            if code and nom:
                ciqual[code] = nom

print(f"✅ {len(ciqual)} aliments Ciqual chargés\n")

# Liste des canonical_foods à mapper (depuis requête précédente)
FOODS = [
    (14010, 'À classer'),
    (1009, 'abricot'),
    (4001, 'agneau'),
    (8001, 'ail des ours'),
    (11001, 'amande'),
    (1010, 'ananas'),
    (9001, 'anchois'),
    (8002, 'aneth'),
    (8003, 'artichaut'),
    (8004, 'asperge'),
    (1002, 'avocat'),
    (1003, 'banane'),
    (1004, 'basilic'),
    (14011, 'bœuf'),
    (1006, 'cassis'),
    (14012, 'cannelle'),
    (14013, 'céleri'),
    (14014, 'cèpe'),
    (1008, 'cerise'),
    (14015, 'champignon'),
    (1011, 'châtaigne'),
    (14016, 'chou'),
    (1013, 'brugnon'),
    (1014, 'carambole'),
    (1015, 'citron'),
    (1016, 'citron vert'),
    (1017, 'coing'),
    (1019, 'datte'),
    (14017, 'cumin'),
    (14018, 'eau'),
    (14005, 'courge butternut'),
    (1022, 'fraise'),
    (1023, 'framboise'),
    (1024, 'fruit de la passion'),
    (1025, 'fruit du dragon'),
    (14019, 'graine de chia'),
    (14020, 'graine de sésame'),
    (1026, 'goyave'),
    (1027, 'grenade'),
    (1028, 'groseille'),
    (14021, 'haricot blanc'),
    (14022, 'haricot noir'),
    (14023, 'haricot rouge'),
    (1029, 'kiwi'),
    (14024, 'lait végétal'),
    (1033, 'mâche'),
    (1034, 'mandarine'),
    (14025, 'morille'),
    (14026, 'noisette'),
    (14027, 'œuf'),
    (14028, 'panais'),
    (14030, 'huile d\'olive'),
    (14031, 'huile végétale'),
    (14032, 'vinaigre'),
    (14033, 'sauce soja'),
    (14035, 'bouillon'),
]

def search_ciqual(food_name, keywords_priority=['cru', 'frais'], keywords_exclude=['cuit', 'séché', 'appertisé', 'surgelé']):
    """Recherche dans Ciqual avec priorité sur cru/frais"""
    food_lower = food_name.lower().replace('œ', 'oe').replace('é', 'e').replace('è', 'e').replace('ê', 'e')
    
    # 1. Chercher avec priorité
    for code, nom in ciqual.items():
        if food_lower in nom:
            # Vérifier exclusions
            if any(exc in nom for exc in keywords_exclude):
                continue
            # Vérifier priorités
            if any(prio in nom for prio in keywords_priority):
                return code, nom
    
    # 2. Chercher sans priorité mais avec exclusions
    for code, nom in ciqual.items():
        if food_lower in nom:
            if any(exc in nom for exc in keywords_exclude):
                continue
            return code, nom
    
    # 3. Chercher sans exclusions (dernier recours)
    for code, nom in ciqual.items():
        if food_lower in nom:
            return code, nom
    
    return None, None

# Rechercher chaque aliment
results = []
not_found = []

for food_id, food_name in FOODS:
    code, ciqual_name = search_ciqual(food_name)
    
    if code:
        results.append({
            'id': food_id,
            'name': food_name,
            'code': code,
            'ciqual_name': ciqual_name
        })
        print(f"✅ {food_name:25} → {code:6} {ciqual_name}")
    else:
        not_found.append(food_name)
        print(f"❌ {food_name:25} → NON TROUVÉ")

print(f"\n{'='*70}")
print(f"✅ {len(results)} trouvés")
print(f"❌ {len(not_found)} non trouvés")
print(f"{'='*70}\n")

# Générer SQL
print("-- Liens automatiques canonical_foods → Ciqual")
print(f"-- Générés: {len(results)} UPDATE statements\n")

for r in results:
    print(f"UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '{r['code']}') WHERE id = {r['id']} AND nutrition_id IS NULL;")

if not_found:
    print(f"\n-- ❌ Non trouvés: {', '.join(not_found)}")
