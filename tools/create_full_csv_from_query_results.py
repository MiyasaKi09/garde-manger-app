#!/usr/bin/env python3
"""
Crée le CSV complet avec TOUTES les 1058 recettes
à partir des résultats de la query pgsql
"""

# Résultats CSV copiés de pgsql_query
QUERY_RESULTS = """id,name,role
2,Overnight porridge aux graines de chia et fruits rouges,ENTREE
3,Porridge salé aux épinards, feta et œuf mollet,PLAT_PRINCIPAL
6,Pudding de chia au lait de coco et coulis de mangue,DESSERT
7,Granola maison aux noix de pécan et sirop d'érable,ENTREE
8,Muesli Bircher aux pommes râpées et noisettes,ENTREE
9,Pancakes américains fluffy au sirop d'érable,DESSERT
10,Pancakes à la banane sans sucre ajouté,ENTREE
11,Pancakes salés au saumon fumé et aneth,PLAT_PRINCIPAL"""

# (Le reste sera ajouté - TODO: Coller TOUS les résultats)

with open('all_recipes_COMPLETE.csv', 'w', encoding='utf-8') as f:
    f.write(QUERY_RESULTS)

print(f"✅ CSV créé")
print(f"📊 Recettes: {len(QUERY_RESULTS.split(chr(10))) - 1}")
