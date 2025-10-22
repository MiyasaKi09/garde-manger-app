#!/usr/bin/env python3
"""
Script pour enrichir les 441 nouvelles recettes avec des profils gustatifs
Basé sur enrich_recipes_v3_complete.py mais adapté aux nouvelles recettes
"""

import re
from pathlib import Path
from typing import List, Dict, Set

# Règles d'enrichissement par mot-clé dans le nom de la recette
ENRICHMENT_RULES = {
    # ARÔMES (10 tags)
    'Herbacé': ['persil', 'coriandre', 'basilic', 'menthe', 'aneth', 'ciboulette', 'estragon', 'herbes'],
    'Épicé': ['curry', 'épices', 'piment', 'gingembre', 'cumin', 'paprika', 'harissa', 'poivre'],
    'Aillé': ['ail', 'échalote', 'oignon'],
    'Fumé': ['fumé', 'bacon', 'lardons'],
    'Fruité': ['citron', 'orange', 'pomme', 'poire', 'fraise', 'framboise', 'fruits'],
    'Floral': ['fleur', 'rose', 'lavande', 'violette'],
    'Boisé': ['champignon', 'truffe', 'noisette', 'noix'],
    'Marin': ['poisson', 'saumon', 'thon', 'crevette', 'moule', 'fruits de mer', 'poulpe'],
    'Toasté': ['grillé', 'rôti', 'caramélisé'],
    'Vanillé': ['vanille', 'crème'],
    
    # SAVEURS (8 tags)
    'Salé': ['sel', 'salé', 'fromage', 'jambon', 'charcuterie'],
    'Sucré': ['sucre', 'miel', 'sirop', 'caramel'],
    'Acide': ['vinaigre', 'citron', 'cornichon', 'mariné'],
    'Amer': ['endive', 'chicorée', 'roquette', 'café', 'chocolat noir'],
    'Umami': ['parmesan', 'anchois', 'miso', 'sauce soja', 'champignon'],
    'Piquant': ['moutarde', 'raifort', 'wasabi', 'piment'],
    'Doux': ['patate douce', 'carotte', 'potiron', 'courge'],
    'Lactique': ['yaourt', 'crème', 'fromage blanc', 'lait'],
    
    # TEXTURES (5 tags)
    'Croquant': ['croquant', 'croustillant', 'grillé', 'frit'],
    'Fondant': ['fondant', 'moelleux', 'tendre'],
    'Crémeux': ['crème', 'velouté', 'onctueux'],
    'Juteux': ['juteux', 'frais'],
    'Ferme': ['ferme', 'dense'],
    
    # INTENSITÉS (4 tags)
    'Délicat': ['délicat', 'fin', 'léger'],
    'Équilibré': ['équilibré', 'harmonieux'],
    'Prononcé': ['prononcé', 'fort', 'intense'],
    'Puissant': ['puissant', 'relevé', 'corsé'],
}

# Tags spéciaux par type de plat
SPECIAL_TAGS = {
    'Végétarien': ['salade', 'légume', 'végétarien', 'végétal', 'tofu'],
    'Viande': ['bœuf', 'veau', 'agneau', 'porc', 'viande'],
    'Volaille': ['poulet', 'canard', 'dinde', 'volaille'],
    'Poisson': ['poisson', 'saumon', 'thon', 'sole', 'cabillaud', 'truite'],
    'Fruits de mer': ['fruits de mer', 'crevette', 'moule', 'huître', 'coquillage', 'poulpe'],
    'Tradition française': ['bourguignon', 'provençale', 'lyonnaise', 'niçoise', 'alsacienne'],
    'Cuisine du monde': ['italien', 'espagnol', 'grec', 'indien', 'asiatique', 'mexicain'],
}

def normalize_text(text: str) -> str:
    """Normalise le texte pour la recherche"""
    text = text.lower()
    # Remplacer les caractères accentués
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'ô': 'o', 'ö': 'o',
        'î': 'i', 'ï': 'i',
        'ç': 'c',
        'œ': 'oe',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def find_matching_tags(recipe_name: str) -> Set[str]:
    """Trouve les tags correspondant à une recette"""
    normalized_name = normalize_text(recipe_name)
    matched_tags = set()
    
    # Chercher dans les règles d'enrichissement
    for tag_name, keywords in ENRICHMENT_RULES.items():
        for keyword in keywords:
            normalized_keyword = normalize_text(keyword)
            if normalized_keyword in normalized_name:
                matched_tags.add(tag_name)
                break  # Un seul match par tag suffit
    
    # Chercher dans les tags spéciaux
    for tag_name, keywords in SPECIAL_TAGS.items():
        for keyword in keywords:
            normalized_keyword = normalize_text(keyword)
            if normalized_keyword in normalized_name:
                matched_tags.add(tag_name)
                break
    
    return matched_tags

def generate_enrichment_sql():
    """Génère le SQL pour enrichir les nouvelles recettes"""
    
    print("🔍 Lecture des nouvelles recettes depuis la base...")
    
    # On va créer un SQL qui utilise des CASE WHEN pour détecter les mots-clés
    sql = """-- ========================================================================
-- ENRICHISSEMENT DES 441 NOUVELLES RECETTES
-- Ajout des profils gustatifs (tags) basés sur les noms de recettes
-- ========================================================================

BEGIN;

-- Insérer les associations recette-tag pour les nouvelles recettes
-- (celles avec description = '%À compléter')

"""
    
    # Générer les INSERT pour chaque règle
    associations_count = 0
    
    for tag_name, keywords in {**ENRICHMENT_RULES, **SPECIAL_TAGS}.items():
        # Construire la condition LIKE pour tous les mots-clés de ce tag
        like_conditions = []
        for keyword in keywords:
            # Échapper les apostrophes et créer les conditions LIKE
            escaped_keyword = keyword.replace("'", "''")
            like_conditions.append(f"LOWER(r.name) LIKE '%{escaped_keyword}%'")
        
        where_clause = " OR ".join(like_conditions)
        
        sql += f"""-- Tag: {tag_name}
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = '{tag_name}'
  AND r.description LIKE '%À compléter'
  AND ({where_clause})
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

"""
        associations_count += 1
    
    sql += f"""COMMIT;

-- Vérification finale
SELECT 
    'Enrichissement terminé' as message,
    COUNT(DISTINCT r.id) as recettes_enrichies,
    COUNT(*) as total_associations,
    ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT r.id), 1) as tags_par_recette
FROM recipes r
JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE r.description LIKE '%À compléter';

-- Détail par tag
SELECT 
    t.name as tag,
    COUNT(*) as nombre_recettes
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id
JOIN tags t ON rt.tag_id = t.id
WHERE r.description LIKE '%À compléter'
GROUP BY t.name
ORDER BY COUNT(*) DESC;
"""
    
    return sql

def main():
    print("🚀 Génération du script d'enrichissement pour les nouvelles recettes")
    print("=" * 70)
    
    # Générer le SQL
    sql_content = generate_enrichment_sql()
    
    # Sauvegarder
    output_path = Path(__file__).parent / 'enrich_new_recipes.sql'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✅ Fichier SQL créé: {output_path.name}")
    print(f"📊 Prêt pour enrichir ~441 nouvelles recettes\n")
    
    print("🔍 Exemples de détection:")
    examples = [
        "Bœuf bourguignon",
        "Salade de pois gourmands",
        "Velouté de potiron",
        "Tarte aux pommes",
        "Poulet rôti aux herbes"
    ]
    
    for recipe in examples:
        tags = find_matching_tags(recipe)
        print(f"   {recipe}: {', '.join(sorted(tags)) if tags else 'Aucun tag'}")
    
    print("\n" + "=" * 70)
    print("📋 PROCHAINE ÉTAPE:")
    print("   Exécuter tools/enrich_new_recipes.sql dans Supabase SQL Editor")

if __name__ == '__main__':
    main()
