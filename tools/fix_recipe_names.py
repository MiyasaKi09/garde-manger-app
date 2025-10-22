#!/usr/bin/env python3
"""
Correction des noms de recettes dans enrichment_optimized.sql
Enlève les numéros du format "595. Shawarma" → "Shawarma"
"""

import re

# Lecture du fichier SQL
with open('tools/enrichment_optimized.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern pour trouver les noms avec numéros dans les commentaires et SELECT
# Exemple : SELECT id FROM recipes WHERE name = '595. Shawarma'
pattern = r"SELECT id FROM recipes WHERE name = '(\d+)\. ([^']+)'"

def remove_number(match):
    number_part = match.group(1)  # "595"
    name_part = match.group(2)     # "Shawarma"
    return f"SELECT id FROM recipes WHERE name = '{name_part}'"

# Remplacement
content_fixed = re.sub(pattern, remove_number, content)

# Aussi corriger les commentaires
comment_pattern = r"^-- (\d+)\. (.+)$"
def fix_comment(match):
    number_part = match.group(1)
    name_part = match.group(2)
    return f"-- {name_part}"

content_fixed = re.sub(comment_pattern, fix_comment, content_fixed, flags=re.MULTILINE)

# Comptage des modifications
original_count = len(re.findall(pattern, content))
print(f"🔍 {original_count} noms avec numéros détectés")

# Sauvegarde du fichier corrigé
with open('tools/enrichment_optimized_FIXED.sql', 'w', encoding='utf-8') as f:
    f.write(content_fixed)

print(f"✅ Fichier corrigé créé: tools/enrichment_optimized_FIXED.sql")
print(f"💡 Exemple de correction: '595. Shawarma' → 'Shawarma'")
