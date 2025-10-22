#!/usr/bin/env python3
"""
Génère un rapport détaillé des recettes à supprimer
"""

import csv

# Toutes les recettes à supprimer (extraites du script SQL)
recettes_a_supprimer = {
    # Doublons exacts
    9057: "DOUBLON - Bœuf Stroganoff",
    9018: "DOUBLON - Entrecôte grillée",
    9077: "DOUBLON - Sauté de veau Marengo",
    
    # Quasi-doublon
    9069: "QUASI-DOUBLON - Bœuf sauce aux oignons",
    
    # Sauces bœuf génériques
    9062: "GÉNÉRIQUE - Bœuf sauce tomate",
    9063: "GÉNÉRIQUE - Bœuf sauce poivre",
    9064: "GÉNÉRIQUE - Bœuf sauce au roquefort",
    9065: "GÉNÉRIQUE - Bœuf sauce au gorgonzola",
    9066: "GÉNÉRIQUE - Bœuf sauce au chèvre",
    9067: "GÉNÉRIQUE - Bœuf sauce aux champignons",
    9068: "GÉNÉRIQUE - Bœuf sauce aux poivrons",
    9070: "GÉNÉRIQUE - Bœuf sauce au citron",
    9071: "GÉNÉRIQUE - Bœuf sauce au miel",
    9072: "GÉNÉRIQUE - Bœuf sauce aux herbes",
    9073: "GÉNÉRIQUE - Bœuf sauce aux tomates séchées",
    9074: "GÉNÉRIQUE - Bœuf sauce au pesto",
    9075: "GÉNÉRIQUE - Bœuf sauce au curry coco",
    
    # Sauces porc génériques
    9210: "GÉNÉRIQUE - Porc sauce tomate",
    9211: "GÉNÉRIQUE - Porc sauce au poivre",
    9212: "GÉNÉRIQUE - Porc sauce au miel",
    9213: "GÉNÉRIQUE - Porc sauce au roquefort",
    9214: "GÉNÉRIQUE - Porc sauce aux champignons",
    9215: "GÉNÉRIQUE - Porc sauce aux oignons",
    9216: "GÉNÉRIQUE - Porc sauce aux poivrons",
    9217: "GÉNÉRIQUE - Porc sauce au paprika",
    9218: "GÉNÉRIQUE - Porc sauce à la bière",
    9219: "GÉNÉRIQUE - Porc sauce aux herbes",
    9220: "GÉNÉRIQUE - Porc sauce à la moutarde",
    9221: "GÉNÉRIQUE - Porc sauce au pesto",
    9222: "GÉNÉRIQUE - Porc sauce au lait de coco",
    9223: "GÉNÉRIQUE - Porc sauce au curry coco",
    9224: "GÉNÉRIQUE - Porc sauce aigre-douce",
    
    # Potages redondants
    8998: "REDONDANT - Potage aux tomates",
    8999: "REDONDANT - Potage aux champignons",
    9000: "REDONDANT - Potage aux aubergines",
    9001: "REDONDANT - Potage aux poivrons",
    9002: "REDONDANT - Potage au chou-fleur",
    9003: "REDONDANT - Potage aux brocolis",
    9004: "REDONDANT - Potage aux navets",
    9005: "REDONDANT - Potage aux blettes",
    9006: "REDONDANT - Potage au panais",
    9008: "REDONDANT - Potage au chou rouge",
    9009: "REDONDANT - Potage aux artichauts",
    
    # Recettes trop vagues
    9052: "VAGUE - Bœuf aux tomates",
    9082: "VAGUE - Veau aux tomates",
    9092: "VAGUE - Veau aux herbes",
    9143: "VAGUE - Agneau aux tomates",
    9152: "VAGUE - Agneau aux herbes",
    9206: "VAGUE - Porc aux herbes",
    
    # Salades froid
    9337: "REDONDANT - Salade de bœuf froid",
    9338: "REDONDANT - Salade de veau froid",
    9339: "REDONDANT - Salade de porc froid",
    
    # Micro-variations agneau
    9137: "MICRO-VAR - Agneau aux carottes",
    9138: "MICRO-VAR - Agneau aux poireaux",
    9139: "MICRO-VAR - Agneau aux champignons",
    9144: "MICRO-VAR - Agneau aux aubergines",
    9145: "MICRO-VAR - Agneau aux courgettes",
    9148: "MICRO-VAR - Agneau aux navets",
    9149: "MICRO-VAR - Agneau aux épinards",
    9151: "MICRO-VAR - Agneau aux oignons",
    9159: "MICRO-VAR - Agneau au paprika",
    9160: "MICRO-VAR - Agneau au romarin",
    9161: "MICRO-VAR - Agneau au thym",
    9162: "MICRO-VAR - Agneau au miel",
    9166: "MICRO-VAR - Agneau aux abricots",
    9167: "MICRO-VAR - Agneau aux poires",
    9168: "MICRO-VAR - Agneau à la moutarde",
    9169: "MICRO-VAR - Agneau au citron",
    9170: "MICRO-VAR - Agneau aux olives",
    9171: "MICRO-VAR - Agneau au gingembre",
    
    # Micro-variations bœuf
    9051: "MICRO-VAR - Bœuf aux aubergines",
    9053: "MICRO-VAR - Bœuf au céleri",
    9054: "MICRO-VAR - Bœuf au chou",
    9055: "MICRO-VAR - Bœuf aux courgettes",
    9056: "MICRO-VAR - Bœuf aux haricots blancs",
    9058: "MICRO-VAR - Bœuf aux lentilles",
    9059: "MICRO-VAR - Bœuf aux navets",
    9060: "MICRO-VAR - Bœuf au curry doux",
    9061: "MICRO-VAR - Bœuf au paprika",
    9320: "MICRO-VAR - Bœuf au satay",
    9322: "MICRO-VAR - Bœuf au soja",
    9374: "MICRO-VAR - Bœuf au miso",
    9375: "MICRO-VAR - Bœuf au sésame noir",
    9376: "MICRO-VAR - Bœuf au curry cacao",
    
    # Micro-variations veau
    9080: "MICRO-VAR - Veau aux carottes",
    9081: "MICRO-VAR - Veau aux courgettes",
    9084: "MICRO-VAR - Veau aux aubergines",
    9085: "MICRO-VAR - Veau aux oignons",
    9086: "MICRO-VAR - Veau aux pommes de terre",
    9088: "MICRO-VAR - Veau aux pois chiches",
    9089: "MICRO-VAR - Veau aux lentilles",
    9090: "MICRO-VAR - Veau aux navets",
    9091: "MICRO-VAR - Veau aux épinards",
    9093: "MICRO-VAR - Veau aux champignons sauvages",
    9331: "MICRO-VAR - Veau au gingembre",
    9332: "MICRO-VAR - Veau à la citronnelle",
    9333: "MICRO-VAR - Veau à la thaï",
    
    # Micro-variations porc
    9200: "MICRO-VAR - Porc aux pommes",
    9202: "MICRO-VAR - Porc aux poires",
    9204: "MICRO-VAR - Porc aux pommes de terre",
    9207: "MICRO-VAR - Porc au gingembre",
    9326: "MICRO-VAR - Porc au soja",
    9328: "MICRO-VAR - Porc au satay",
    9329: "MICRO-VAR - Porc au curry japonais",
    
    # Burgers
    9263: "MICRO-VAR - Burger au bleu",
    9264: "MICRO-VAR - Burger au roquefort",
    9265: "MICRO-VAR - Burger au chèvre",
    9266: "MICRO-VAR - Burger au gorgonzola",
    9267: "MICRO-VAR - Burger au pesto",
    9268: "MICRO-VAR - Burger au curry doux",
    9273: "MICRO-VAR - Burger aux champignons",
    9274: "MICRO-VAR - Burger aux aubergines",
    9275: "MICRO-VAR - Burger aux tomates",
    9276: "MICRO-VAR - Burger épicé",
    9277: "MICRO-VAR - Burger méditerranéen",
    
    # Sautés de porc
    9192: "MICRO-VAR - Sauté de porc aux champignons",
    9193: "MICRO-VAR - Sauté de porc aux oignons",
    9194: "MICRO-VAR - Sauté de porc aux poivrons",
    9195: "MICRO-VAR - Sauté de porc aux tomates",
    9196: "MICRO-VAR - Sauté de porc aux carottes",
    9197: "MICRO-VAR - Sauté de porc aux courgettes",
    9198: "MICRO-VAR - Sauté de porc aux aubergines",
    
    # Tourtes
    9354: "MICRO-VAR - Tourte au bœuf",
    9356: "MICRO-VAR - Tourte au bœuf et légumes",
    9357: "MICRO-VAR - Tourte au veau",
    9358: "MICRO-VAR - Tourte au veau et champignons",
    9359: "MICRO-VAR - Tourte au veau et légumes",
    9362: "MICRO-VAR - Tourte au porc",
    
    # Gibier
    9227: "MICRO-VAR - Chevreuil au miel",
    9228: "MICRO-VAR - Chevreuil au poivre",
    9229: "MICRO-VAR - Chevreuil au romarin",
    9248: "MICRO-VAR - Chevreuil aux airelles",
    9249: "MICRO-VAR - Chevreuil aux champignons",
    9231: "MICRO-VAR - Sanglier au miel",
    9245: "MICRO-VAR - Sanglier aux carottes",
    9246: "MICRO-VAR - Sanglier aux champignons",
    9247: "MICRO-VAR - Sanglier aux pommes",
    9234: "MICRO-VAR - Cerf au poivre",
    9235: "MICRO-VAR - Cerf aux champignons",
    9253: "MICRO-VAR - Cerf aux marrons",
    9309: "MICRO-VAR - Cerf aux truffes",
    9256: "MICRO-VAR - Faisan aux pommes",
    9257: "MICRO-VAR - Faisan aux champignons",
    9255: "MICRO-VAR - Faisan aux poires",
    
    # Feuilletés
    9367: "MICRO-VAR - Feuilleté au veau",
    9369: "MICRO-VAR - Feuilleté au porc",
    9371: "MICRO-VAR - Feuilleté au sanglier",
    9372: "MICRO-VAR - Feuilleté au chevreuil",
    9373: "MICRO-VAR - Feuilleté au cerf",
    
    # Rôtis de porc
    9174: "MICRO-VAR - Rôti de porc au miel",
    9175: "MICRO-VAR - Rôti de porc au paprika",
    9178: "MICRO-VAR - Rôti de porc aux pommes",
    9179: "MICRO-VAR - Rôti de porc aux pruneaux",
    
    # Côtes de porc
    9183: "MICRO-VAR - Côtes de porc au miel",
    9184: "MICRO-VAR - Côtes de porc aux herbes",
    9185: "MICRO-VAR - Côtes de porc au curry doux",
    
    # Boulettes
    9285: "MICRO-VAR - Boulettes à la tomate",
    9286: "MICRO-VAR - Boulettes au fromage",
    9287: "MICRO-VAR - Boulettes aux herbes",
    9288: "MICRO-VAR - Boulettes aux champignons",
    9289: "MICRO-VAR - Boulettes aux oignons",
    
    # Steak haché
    9292: "MICRO-VAR - Steak haché au fromage",
    9293: "MICRO-VAR - Steak haché aux herbes",
    9294: "MICRO-VAR - Steak haché aux oignons",
    9295: "MICRO-VAR - Steak haché au poivre",
    
    # Recettes froid
    9334: "REDONDANT - Rosbif froid",
    9335: "REDONDANT - Rôti de veau froid",
    9336: "REDONDANT - Rôti de porc froid",
    
    # Pièces basiques
    9022: "BASIQUE - Aloyau grillé",
    9023: "BASIQUE - Onglet grillé",
    9024: "BASIQUE - Hampe grillée",
    9026: "BASIQUE - Filet de bœuf poêlé",
    9028: "BASIQUE - Steak minute",
    9033: "BASIQUE - Merlan de bœuf grillé",
    9096: "BASIQUE - Escalope de veau grillée",
    9102: "BASIQUE - Côte de veau grillée",
    9108: "BASIQUE - Filet de veau grillé",
    9126: "BASIQUE - Carré d'agneau grillé",
    9131: "BASIQUE - Épaule d'agneau grillée",
    9180: "BASIQUE - Côtes de porc grillées",
}

def load_all_recipes():
    """Charge toutes les recettes"""
    recipes = {}
    batch_files = [
        'tools/recipes_300.csv',
        'tools/recipes_300_batch2.csv', 
        'tools/recipes_batch3_remaining.csv'
    ]
    for batch_file in batch_files:
        try:
            with open(batch_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    recipes[int(row['id'])] = {
                        'name': row['name'],
                        'role': row['role']
                    }
        except FileNotFoundError:
            print(f"⚠️  Fichier non trouvé: {batch_file}")
    return recipes

def main():
    recipes = load_all_recipes()
    
    print("="*80)
    print("RAPPORT DE NETTOYAGE - RECETTES À SUPPRIMER")
    print("="*80)
    print(f"\nTotal recettes à supprimer: {len(recettes_a_supprimer)}")
    print(f"Total recettes actuelles: {len(recipes)}")
    print(f"Recettes après nettoyage: {len(recipes) - len(recettes_a_supprimer)}")
    print(f"Pourcentage supprimé: {len(recettes_a_supprimer) * 100 / len(recipes):.1f}%")
    
    # Grouper par catégorie
    from collections import defaultdict
    by_category = defaultdict(list)
    
    for recipe_id, reason in recettes_a_supprimer.items():
        category = reason.split(' - ')[0]
        if recipe_id in recipes:
            by_category[category].append((recipe_id, recipes[recipe_id]['name'], recipes[recipe_id]['role']))
    
    # Afficher par catégorie
    for category in sorted(by_category.keys()):
        recs = by_category[category]
        print(f"\n{'='*80}")
        print(f"{category} ({len(recs)} recettes)")
        print('='*80)
        for recipe_id, name, role in sorted(recs, key=lambda x: x[1]):
            print(f"  [{recipe_id:4d}] {name:60s} ({role})")
    
    # Générer CSV
    print(f"\n{'='*80}")
    print("Génération du fichier CSV...")
    with open('RECETTES_A_SUPPRIMER.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', 'Nom', 'Role', 'Raison'])
        for recipe_id, reason in sorted(recettes_a_supprimer.items()):
            if recipe_id in recipes:
                writer.writerow([
                    recipe_id,
                    recipes[recipe_id]['name'],
                    recipes[recipe_id]['role'],
                    reason
                ])
    
    print("✅ Fichier RECETTES_A_SUPPRIMER.csv généré")
    print("\n" + "="*80)
    print("Pour exécuter le nettoyage:")
    print("  psql \"$DATABASE_URL_TX\" -f NETTOYAGE_BASE_RECETTES.sql")
    print("="*80)

if __name__ == '__main__':
    main()
