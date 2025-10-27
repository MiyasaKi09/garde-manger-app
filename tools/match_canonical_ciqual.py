#!/usr/bin/env python3
"""
Lier canonical_foods aux données nutritionnelles Ciqual
en matchant les noms
"""
import csv
from difflib import SequenceMatcher

def normalize(name):
    """Normaliser un nom pour matching"""
    if not name:
        return ''
    return name.lower().strip().replace('é', 'e').replace('è', 'e').replace('ê', 'e') \
        .replace('à', 'a').replace('ç', 'c').replace('ô', 'o').replace('û', 'u')

def similarity(a, b):
    """Calculer similarité entre deux chaînes"""
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

# Charger le mapping Ciqual (nom français → code)
print("📂 Chargement des noms Ciqual...")
ciqual_names = {}
with open('/workspaces/garde-manger-app/data/mapping_canonical_ciqual.csv', 'r', encoding='iso-8859-1') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        alim_code = row.get('alim_code', '').strip()
        alim_nom = row.get('alim_nom_fr', '').strip()
        if alim_code and alim_nom:
            ciqual_names[alim_code] = alim_nom

print(f"  {len(ciqual_names)} aliments Ciqual chargés")

# Charger nutritional_data (ID → source_id)
print("\n📂 Chargement des IDs nutritional_data...")
import psycopg2
import os

# Connexion simplifiée (extraire les paramètres depuis DATABASE_URL_TX)
db_url = os.getenv('DATABASE_URL_TX', '')
if not db_url:
    print("❌ DATABASE_URL_TX non trouvée")
    exit(1)

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

cursor.execute("SELECT id, source_id FROM nutritional_data")
nutrition_id_map = {row[1]: row[0] for row in cursor.fetchall()}  # source_id → id

print(f"  {len(nutrition_id_map)} entrées nutritional_data")

# Charger canonical_foods
print("\n📂 Chargement canonical_foods...")
cursor.execute("SELECT id, canonical_name FROM canonical_foods WHERE nutrition_id IS NULL")
canonical_foods = cursor.fetchall()

print(f"  {len(canonical_foods)} canonical_foods sans nutrition_id")

# Matching
print("\n🔗 Matching en cours...")
matches = []
unmatched = []

for cf_id, cf_name in canonical_foods:
    if not cf_name:
        continue
    
    # Rechercher le meilleur match dans Ciqual
    best_score = 0
    best_code = None
    
    for ciqual_code, ciqual_name in ciqual_names.items():
        score = similarity(cf_name, ciqual_name)
        if score > best_score:
            best_score = score
            best_code = ciqual_code
    
    # Seuil de confiance : 0.7
    if best_score >= 0.7 and best_code in nutrition_id_map:
        matches.append({
            'cf_id': cf_id,
            'cf_name': cf_name,
            'ciqual_code': best_code,
            'ciqual_name': ciqual_names[best_code],
            'nutrition_id': nutrition_id_map[best_code],
            'score': best_score
        })
    else:
        unmatched.append((cf_id, cf_name, best_score, best_code))

print(f"\n✅ Matching terminé:")
print(f"   Matchés (>= 0.7): {len(matches)}")
print(f"   Non matchés: {len(unmatched)}")

# Sauvegarder le mapping pour review
with open('/workspaces/garde-manger-app/data/canonical_ciqual_matches.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['cf_id', 'cf_name', 'ciqual_code', 'ciqual_name', 'nutrition_id', 'score'])
    writer.writeheader()
    writer.writerows(matches)

print(f"\n📁 Mapping sauvegardé dans data/canonical_ciqual_matches.csv")

# Afficher quelques exemples
print("\n📊 Exemples de matches (score > 0.9):")
for match in sorted(matches, key=lambda x: x['score'], reverse=True)[:10]:
    print(f"  {match['score']:.2f} | {match['cf_name']} → {match['ciqual_name']}")

# Proposer l'update SQL
print("\n🔧 Commandes SQL pour update:")
print(f"   UPDATE canonical_foods SET nutrition_id = (SELECT nutrition_id FROM json_data)")
print(f"   Nombre de lignes: {len(matches)}")

conn.close()
