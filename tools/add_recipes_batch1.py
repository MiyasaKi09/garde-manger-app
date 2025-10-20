#!/usr/bin/env python3
"""
Script rapide pour ajouter 50 recettes du bloc1 (Entrées)
Avec vérification anti-doublons directement dans le SQL
"""

import re

# Lecture du bloc1
with open('../supabase/bloc1_entrees.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Extraction des recettes (format: - Nom de recette)
recettes = []
for line in content.split('\n'):
    line = line.strip()
    # Chercher les lignes qui commencent par "- "
    if line.startswith('- '):
        nom = line[2:].strip()  # Enlever "- "
        # Nettoyage
        nom = nom.replace('"', "'")
        if nom and len(nom) > 3:  # Éviter les noms trop courts
            recettes.append(nom)

print(f"✅ {len(recettes)} recettes extraites du bloc1")

# Prendre les 50 premières
recettes_batch1 = recettes[:50]

# Génération du SQL avec vérification anti-doublons intégrée
sql_output = """-- ========================================================================
-- BATCH 1 : Ajout de 50 Entrées (Bloc 1)
-- Vérification anti-doublons intégrée dans le SQL
-- ========================================================================

BEGIN;

-- Les INSERT utilisent ON CONFLICT pour éviter les doublons
-- Si une recette existe déjà avec le même nom, elle sera ignorée

"""

for i, nom in enumerate(recettes_batch1, 1):
    # Échappement des quotes
    nom_escaped = nom.replace("'", "''")
    
    sql_output += f"""-- {i}. {nom}
INSERT INTO recipes (name, role, description)
VALUES (
  '{nom_escaped}',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

"""

sql_output += """
COMMIT;

-- Vérification
SELECT 
  'Batch 1 terminé' as message,
  COUNT(*) as nouvelles_recettes
FROM recipes
WHERE description = 'Entrée classique - À compléter';
"""

# Sauvegarde
with open('add_recipes_batch1.sql', 'w', encoding='utf-8') as f:
    f.write(sql_output)

print(f"✅ Fichier SQL créé: add_recipes_batch1.sql")
print(f"📊 50 recettes prêtes à être insérées")
print(f"\n🔍 Exemples:")
for i, nom in enumerate(recettes_batch1[:5], 1):
    print(f"   {i}. {nom}")
print(f"   ...")
print(f"\n💡 Le SQL utilise ON CONFLICT (name) DO NOTHING pour éviter les doublons")
print(f"   → Si une recette existe déjà, elle sera ignorée automatiquement")
