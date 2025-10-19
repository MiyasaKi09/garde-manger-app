#!/usr/bin/env python3
"""
Script complet d'enrichissement massif des recettes
Génère un fichier SQL qui associe les tags aux recettes existantes
"""

import re

# Mots-clés de difficulté
DIFFICULTY_PATTERNS = {
    "difficulté:Facile": [
        "salade", "tartine", "toast", "smoothie", "yaourt", "œufs", "omelette",
        "croque", "sandwich", "wrap", "bruschetta", "guacamole", "tzatziki"
    ],
    "difficulté:Difficile": [
        "soufflé", "macarons", "wellington", "croissant", "brioche", "feuilletage",
        "tempura", "sushi", "maki", "croquembouche", "millefeuille"
    ]
}

# Mots-clés d'occasions
OCCASION_PATTERNS = {
    "usage:Petit-déjeuner": [
        "porridge", "pancakes", "œufs", "croissant", "pain perdu", "brioche",
        "granola", "muesli", "smoothie", "yaourt", "tartine"
    ],
    "usage:Apéritif": [
        "verrine", "toast", "tartine", "brochette", "tapas", "bruschetta",
        "tapenade", "houmous", "guacamole", "tartare", "carpaccio"
    ],
    "usage:Fête": [
        "foie gras", "homard", "wellington", "saint-jacques", "champagne",
        "caviar", "saumon fumé", "coquilles", "ballotine"
    ],
    "usage:Barbecue": [
        "brochette", "grill", "barbecue", "marinade", "merguez", "chipolata"
    ]
}

# Mots-clés de saisons
SEASON_PATTERNS = {
    "saison:Printemps": [
        "asperges", "petits pois", "fraises", "radis", "printanier", "fèves",
        "artichaut", "rhubarbe"
    ],
    "saison:Été": [
        "tomate", "courgette", "aubergine", "poivron", "melon", "pêche",
        "gazpacho", "salade", "barbecue", "grill", "abricot", "cerise"
    ],
    "saison:Automne": [
        "potimarron", "châtaigne", "champignon", "pomme", "poire", "citrouille",
        "courge", "potiron", "cèpes", "girolles"
    ],
    "saison:Hiver": [
        "endive", "chou", "raclette", "tartiflette", "pot-au-feu", "bourguignon",
        "fondue", "blanquette", "ragoût", "cassoulet"
    ]
}

# Mots-clés de profils
PROFILE_PATTERNS = {
    "profil:Gourmand": [
        "chocolat", "crème", "beurre", "fromage", "foie gras", "confit",
        "fondant", "moelleux", "onctueux", "gratin"
    ],
    "profil:Healthy": [
        "salade", "légumes", "quinoa", "bowl", "smoothie", "vapeur",
        "healthy", "détox", "light"
    ],
    "profil:Rapide": [
        "express", "rapide", "minute", "simple", "facile", "quick"
    ]
}


def detect_tags_for_recipe(recipe_name: str) -> dict:
    """Détecte tous les tags appropriés pour une recette."""
    name_lower = recipe_name.lower()
    tags = {
        'difficulty': None,
        'occasions': [],
        'seasons': [],
        'profiles': []
    }
    
    # Difficulté (une seule)
    for tag, keywords in DIFFICULTY_PATTERNS.items():
        if any(kw in name_lower for kw in keywords):
            tags['difficulty'] = tag
            break
    
    # Par défaut : Moyen
    if not tags['difficulty']:
        tags['difficulty'] = "difficulté:Moyen"
    
    # Occasions (multiples possibles)
    for tag, keywords in OCCASION_PATTERNS.items():
        if any(kw in name_lower for kw in keywords):
            tags['occasions'].append(tag)
    
    # Saisons (multiples possibles)
    for tag, keywords in SEASON_PATTERNS.items():
        if any(kw in name_lower for kw in keywords):
            tags['seasons'].append(tag)
    
    # Profils (multiples possibles)
    for tag, keywords in PROFILE_PATTERNS.items():
        if any(kw in name_lower for kw in keywords):
            tags['profiles'].append(tag)
    
    return tags


def generate_enrichment_sql(recipe_file: str) -> str:
    """Génère le SQL d'enrichissement à partir du fichier de recettes."""
    
    sql_parts = []
    sql_parts.append("-- Enrichissement massif des recettes")
    sql_parts.append("-- Association des tags de difficulté, saisons, occasions, profils")
    sql_parts.append("")
    sql_parts.append("BEGIN;")
    sql_parts.append("")
    
    # Lire le fichier de recettes
    with open(recipe_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    recipe_count = 0
    tag_insertions = []
    
    for line in lines:
        line = line.strip()
        
        # Ignorer les lignes vides et les parasites
        if not line or '...' in line or 'note:' in line.lower() or 'pour des raisons' in line.lower():
            continue
        
        recipe_name = line
        recipe_count += 1
        
        # Détecter les tags
        tags = detect_tags_for_recipe(recipe_name)
        
        # Préparer l'insertion SQL
        all_tags = []
        if tags['difficulty']:
            all_tags.append(tags['difficulty'])
        all_tags.extend(tags['occasions'])
        all_tags.extend(tags['seasons'])
        all_tags.extend(tags['profiles'])
        
        if all_tags:
            # Commentaire pour lisibilité
            tag_insertions.append(f"-- {recipe_name}")
            for tag in all_tags:
                tag_insertions.append(
                    f"INSERT INTO recipe_tags (recipe_id, tag_id)\n"
                    f"SELECT r.id, t.id FROM recipes r, tags t\n"
                    f"WHERE r.name = '{recipe_name.replace("'", "''")}'\n"
                    f"  AND t.name = '{tag}'\n"
                    f"ON CONFLICT (recipe_id, tag_id) DO NOTHING;"
                )
            tag_insertions.append("")
    
    sql_parts.append(f"-- Enrichissement de {recipe_count} recettes")
    sql_parts.append("")
    sql_parts.extend(tag_insertions)
    sql_parts.append("")
    sql_parts.append("COMMIT;")
    sql_parts.append("")
    sql_parts.append(f"-- ✅ {recipe_count} recettes enrichies")
    
    return "\n".join(sql_parts)


def main():
    """Fonction principale."""
    print("🎨 Génération du script d'enrichissement complet")
    print("=" * 60)
    
    input_file = "/workspaces/garde-manger-app/supabase/batch pour recette (1).txt"
    output_file = "/workspaces/garde-manger-app/tools/enrich_all_recipes.sql"
    
    print(f"\n📖 Lecture du fichier : {input_file}")
    
    # Générer le SQL
    sql = generate_enrichment_sql(input_file)
    
    # Écrire le fichier
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"✅ Script SQL créé : {output_file}")
    
    # Statistiques
    tag_count = sql.count("INSERT INTO recipe_tags")
    print(f"\n📊 Statistiques :")
    print(f"  - Nombre d'associations de tags : {tag_count}")
    print(f"  - Taille du fichier : {len(sql.split('\n'))} lignes")
    
    # Exemples
    print("\n📝 Exemples de détection :")
    examples = [
        "Bœuf bourguignon",
        "Salade verte simple",
        "Macarons au chocolat",
        "Gazpacho andalou",
        "Raclette savoyarde"
    ]
    
    for recipe in examples:
        tags = detect_tags_for_recipe(recipe)
        all_detected = [tags['difficulty']]
        all_detected.extend(tags['occasions'])
        all_detected.extend(tags['seasons'])
        all_detected.extend(tags['profiles'])
        print(f"\n  {recipe}:")
        for tag in all_detected:
            print(f"    → {tag}")
    
    print("\n✨ Script prêt à être exécuté !")


if __name__ == "__main__":
    main()
