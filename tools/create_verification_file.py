import csv
import re

# Lire le fichier complet
recipes = []
with open('../LISTE_TOUTES_RECETTES COMPLETE.txt', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Extraire les noms d'ingrédients depuis la colonne Ingrédients
        ingredients_raw = row.get('Ingrédients', '')
        
        # Parser les ingrédients au format "quantité|unité|nom"
        ingredients_list = []
        if ingredients_raw:
            # Les ingrédients sont entre guillemets, séparés par des virgules
            parts = re.findall(r'"([^"]+)"', ingredients_raw)
            for part in parts:
                # Format: quantité|unité|nom
                fields = part.split('|')
                if len(fields) >= 3:
                    ingredient_name = fields[2].strip()
                    # Simplifier le nom (enlever les détails)
                    ingredient_name = re.sub(r'\s+(frais|fraîche|cuit|cuite|moulu|moulue|râpé|râpée|haché|hachée|pelé|pelée|dénoyauté|dénoyautée).*', '', ingredient_name)
                    ingredients_list.append(ingredient_name)
        
        recipes.append({
            'id': row['ID'],
            'name': row['Nom'],
            'portions': row.get('Portions', ''),
            'ingredients': ', '.join(ingredients_list) if ingredients_list else ''
        })

print(f"✅ {len(recipes)} recettes chargées")

# Créer le fichier de vérification
DST = 'VERIFICATION_INGREDIENTS_RECETTES.csv'

with open(DST, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, delimiter='|')
    
    # En-tête
    writer.writerow(['ID', 'Nom_Recette', 'Portions', 'Ingredients_Detectes', 'Ingredients_Corriges', 'Statut', 'Notes'])
    
    # Données
    for r in recipes:
        writer.writerow([
            r['id'],
            r['name'],
            r['portions'],
            r['ingredients'],
            '',  # Colonne vide pour corrections
            'À vérifier',  # Statut initial
            ''  # Notes vides
        ])

print(f"✅ Fichier créé: {DST}")
print(f"   Total: {len(recipes)} recettes")
print(f"\n📋 Colonnes du fichier:")
print("   - ID: Identifiant de la recette")
print("   - Nom_Recette: Nom de la recette")
print("   - Portions: Nombre de portions")
print("   - Ingredients_Detectes: Ingrédients extraits automatiquement")
print("   - Ingredients_Corriges: À remplir si corrections nécessaires")
print("   - Statut: 'À vérifier' / 'Validé' / 'Corrigé'")
print("   - Notes: Commentaires libres")

# Afficher quelques exemples
print(f"\n🔍 Aperçu des 5 premières recettes:")
for r in recipes[:5]:
    print(f"\n   [{r['id']}] {r['name']}")
    print(f"       Ingrédients: {r['ingredients'][:100]}...")
