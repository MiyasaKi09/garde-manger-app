#!/usr/bin/env python3
"""Parse les résultats de la query et crée le CSV"""

# Données complètes de la query (copier-coller des résultats)
data = """id,name,role
2,Overnight porridge aux graines de chia et fruits rouges,ENTREE
3,Porridge salé aux épinards feta et œuf mollet,PLAT_PRINCIPAL"""

# Les sauvegarder dans le CSV
with open('all_recipes_1058.csv', 'w', encoding='utf-8') as f:
    f.write(data)

print("✓ CSV créé")
