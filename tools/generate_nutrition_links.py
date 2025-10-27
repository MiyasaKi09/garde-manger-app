#!/usr/bin/env python3
"""
Script pour générer les UPDATE SQL pour lier canonical_foods et archetypes aux codes Ciqual
Version simplifié qui génère le SQL à exécuter via pgsql_modify
"""
import csv
from difflib import SequenceMatcher

MAPPING_FILE = 'data/mapping_canonical_ciqual.csv'
MIN_SIMILARITY = 0.90  # Plus strict pour éviter faux positifs

# Dictionnaire manuel pour les cas courants
MANUAL_MAPPINGS = {
    'abricot': '13001',  # Abricot, frais
    'agneau': '6250',    # Agneau
    'ail': '11000',      # Ail
    'amande': '15076',   # Amande
    'ananas': '13006',   # Ananas
    'anchois': '26002',  # Anchois
    'asperge': '20054',  # Asperge
    'avocat': '13025',   # Avocat
    'banane': '13005',   # Banane
    'basilic': '11618',  # Basilic
    'bœuf': '6101',      # Bœuf
    'boeuf': '6101',
    'cassis': '13008',   # Cassis
    'céleri': '20055',   # Céleri
    'celeri': '20055',
    'cèpe': '20028',     # Cèpe
    'cepe': '20028',
    'cerise': '13009',   # Cerise
    'champignon': '20028', # Champignon de Paris
    'chou': '20010',     # Chou
    'citron': '13016',   # Citron
    'coing': '13010',    # Coing
    'datte': '13026',    # Datte
    'cumin': '11035',    # Cumin
    'eau': '18066',      # Eau
    'courge': '20011',   # Courge
    'fraise': '13014',   # Fraise
    'kiwi': '13023',     # Kiwi
    'mâche': '20037',    # Mâche
    'mache': '20037',
    'mandarine': '13048', # Mandarine
    'morille': '20029',  # Morille
    'œuf': '22000',      # Œuf
    'oeuf': '22000',
    'panais': '4021',    # Panais
}

def normalize(text):
    """Normalise un texte pour le matching"""
    if not text:
        return ""
    text = text.lower().strip()
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'ô': 'o', 'ö': 'o',
        'î': 'i', 'ï': 'i',
        'ç': 'c',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def similarity(a, b):
    """Calcule similarité entre deux textes"""
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

def load_ciqual_mapping():
    """Charge le mapping Ciqual"""
    mapping = {}
    with open(MAPPING_FILE, 'r', encoding='iso-8859-1') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader)  # Skip header
        
        for row in reader:
            if len(row) < 8:
                continue
            code = row[6]
            nom = row[7]
            if code and nom:
                mapping[code] = nom
    
    return mapping

# Liste des canonical_foods à matcher (depuis la requête précédente)
CANONICAL_FOODS = [
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
    (1001, 'aubergine'),  # Déjà lié mais pour vérif
    (1002, 'avocat'),
    (1003, 'banane'),
    (1004, 'basilic'),
    (14011, 'bœuf'),
    (1005, 'carotte'),  # Déjà lié
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
    (1020, 'épinard'),  # Déjà lié
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
    (1031, 'laitue'),  # Déjà lié
    (1033, 'mâche'),
    (1034, 'mandarine'),
    (14025, 'morille'),
    (14026, 'noisette'),
    (14027, 'œuf'),
    (14028, 'panais'),
    (14029, 'salade'),  # Déjà lié
    (14030, 'huile d\'olive'),
    (14031, 'huile végétale'),
    (14032, 'vinaigre'),
    (14033, 'sauce soja'),
    (14035, 'bouillon'),
]

def find_best_match(food_name, ciqual_mapping, threshold=MIN_SIMILARITY):
    """Trouve le meilleur match"""
    # 1. Vérifier dictionnaire manuel
    food_normalized = normalize(food_name)
    for manual_key, manual_code in MANUAL_MAPPINGS.items():
        if normalize(manual_key) == food_normalized:
            if manual_code in ciqual_mapping:
                return manual_code, ciqual_mapping[manual_code], 1.0
    
    # 2. Fuzzy matching
    best_score = 0
    best_code = None
    best_name = None
    
    for code, name in ciqual_mapping.items():
        score = similarity(food_name, name)
        if score > best_score:
            best_score = score
            best_code = code
            best_name = name
    
    if best_score >= threshold:
        return best_code, best_name, best_score
    return None, None, 0

def main():
    print("📖 Chargement mapping Ciqual...")
    ciqual_mapping = load_ciqual_mapping()
    print(f"✅ {len(ciqual_mapping)} aliments Ciqual\n")
    
    matches = []
    no_matches = []
    
    for food_id, food_name in CANONICAL_FOODS:
        code, ciqual_name, score = find_best_match(food_name, ciqual_mapping)
        
        if code:
            matches.append({
                'id': food_id,
                'name': food_name,
                'code': code,
                'ciqual_name': ciqual_name,
                'score': score
            })
        else:
            no_matches.append(food_name)
    
    print(f"✅ {len(matches)} correspondances trouvées")
    print(f"❌ {len(no_matches)} non trouvés\n")
    
    # Générer SQL
    print("-- =============================================================")
    print("-- SQL généré pour lier canonical_foods aux codes Ciqual")
    print(f"-- {len(matches)} liens à créer")
    print("-- =============================================================\n")
    
    for match in matches:
        print(f"-- {match['name']} → {match['ciqual_name']} (score: {match['score']:.0%})")
        print(f"UPDATE canonical_foods")
        print(f"SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '{match['code']}')")
        print(f"WHERE id = {match['id']} AND nutrition_id IS NULL;")
        print()
    
    if no_matches:
        print(f"\n-- ❌ Aliments sans correspondance ({len(no_matches)}):")
        for name in no_matches:
            print(f"-- • {name}")
    
    print(f"\n-- Vérification")
    print("SELECT COUNT(*) FILTER (WHERE nutrition_id IS NOT NULL) AS linked,")
    print("       COUNT(*) AS total")
    print("FROM canonical_foods;")

if __name__ == '__main__':
    main()
