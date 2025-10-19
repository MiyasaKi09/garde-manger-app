#!/usr/bin/env python3
"""
Script d'enrichissement massif des recettes
- Ajoute des ingrédients réalistes
- Améliore les instructions
- Ajoute des tags supplémentaires (difficulté, occasion, saison)
- Crée des pairings de recettes
"""

import re
from typing import List, Dict, Tuple

# Mappings d'ingrédients communs par mots-clés dans le nom de la recette
INGREDIENT_PATTERNS = {
    # Produits de base
    "pâtes": ["pâtes", "sel", "huile d'olive"],
    "riz": ["riz", "eau", "sel"],
    "pizza": ["farine", "levure", "eau", "sel", "huile d'olive", "tomate", "mozzarella"],
    "tarte": ["pâte feuilletée", "œufs", "crème fraîche"],
    "quiche": ["pâte brisée", "œufs", "crème fraîche", "lait"],
    "gratin": ["pommes de terre", "crème fraîche", "lait", "fromage râpé"],
    "soupe": ["bouillon", "oignon", "ail", "sel", "poivre"],
    "salade": ["huile d'olive", "vinaigre", "sel", "poivre"],
    "burger": ["pain burger", "salade", "tomate", "oignon"],
    "sandwich": ["pain", "beurre", "sel", "poivre"],
    
    # Viandes
    "poulet": ["poulet", "sel", "poivre", "huile"],
    "bœuf": ["bœuf", "sel", "poivre", "huile"],
    "porc": ["porc", "sel", "poivre", "huile"],
    "agneau": ["agneau", "sel", "poivre", "huile d'olive"],
    "canard": ["canard", "sel", "poivre"],
    "veau": ["veau", "sel", "poivre", "beurre"],
    
    # Poissons
    "saumon": ["saumon", "citron", "sel", "poivre", "huile d'olive"],
    "thon": ["thon", "sel", "poivre"],
    "cabillaud": ["cabillaud", "sel", "poivre", "citron"],
    "moules": ["moules", "vin blanc", "oignon", "persil"],
    "crevettes": ["crevettes", "ail", "persil", "huile d'olive"],
    
    # Légumes
    "tomate": ["tomates", "ail", "basilic", "huile d'olive"],
    "courgette": ["courgettes", "ail", "huile d'olive"],
    "aubergine": ["aubergines", "ail", "huile d'olive"],
    "épinards": ["épinards", "ail", "huile d'olive"],
    "champignon": ["champignons", "ail", "persil", "beurre"],
    "poivron": ["poivrons", "huile d'olive"],
    
    # Desserts
    "chocolat": ["chocolat noir", "beurre", "sucre", "œufs"],
    "pommes": ["pommes", "sucre", "beurre"],
    "fraises": ["fraises", "sucre"],
    "citron": ["citrons", "sucre", "œufs"],
    "crème": ["crème liquide", "sucre", "œufs"],
}

# Tags de difficulté
DIFFICULTY_KEYWORDS = {
    "facile": ["salade", "tartine", "toast", "smoothie", "yaourt", "œufs", "omelette"],
    "moyen": ["pâtes", "riz", "poulet rôti", "tarte", "quiche", "gratin"],
    "difficile": ["soufflé", "macarons", "wellington", "croissant", "brioche", "feuilletage"]
}

# Tags d'occasion
OCCASION_KEYWORDS = {
    "usage:Petit-déjeuner": ["porridge", "pancakes", "œufs", "croissant", "pain perdu", "brioche", "granola"],
    "usage:Apéritif": ["verrine", "toast", "tartine", "brochette", "tapas", "bruschetta"],
    "usage:Fête": ["foie gras", "homard", "wellington", "saint-jacques", "champagne"],
    "usage:Barbecue": ["brochette", "grill", "barbecue", "marinade"],
    "usage:Pique-nique": ["sandwich", "wrap", "salade", "cake", "quiche froide"],
}

# Tags de saison
SEASON_KEYWORDS = {
    "saison:Printemps": ["asperges", "petits pois", "fraises", "radis", "printanier"],
    "saison:Été": ["tomate", "courgette", "aubergine", "poivron", "melon", "pêche", "gazpacho"],
    "saison:Automne": ["potimarron", "châtaigne", "champignon", "pomme", "poire"],
    "saison:Hiver": ["endive", "chou", "raclette", "tartiflette", "pot-au-feu", "bourguignon"],
}

# Instructions détaillées par type de recette
INSTRUCTION_TEMPLATES = {
    "PLAT_PRINCIPAL": [
        "Préparer et laver tous les ingrédients.",
        "Préchauffer le four à 180°C si nécessaire.",
        "Assaisonner avec du sel et du poivre.",
        "Suivre la cuisson selon la méthode indiquée.",
        "Vérifier la cuisson et ajuster l'assaisonnement.",
        "Servir chaud et déguster immédiatement."
    ],
    "ACCOMPAGNEMENT": [
        "Préparer les ingrédients.",
        "Cuire selon la méthode appropriée.",
        "Assaisonner à votre goût.",
        "Servir en accompagnement."
    ],
    "ENTREE": [
        "Préparer tous les éléments de l'entrée.",
        "Dresser joliment dans les assiettes.",
        "Assaisonner délicatement.",
        "Servir frais ou tiède selon la recette."
    ],
    "DESSERT": [
        "Préparer tous les ingrédients à température ambiante.",
        "Suivre les étapes de mélange avec précision.",
        "Respecter le temps de cuisson ou de repos.",
        "Laisser refroidir avant de servir.",
        "Décorer et présenter joliment."
    ]
}


def detect_difficulty(recipe_name: str) -> str:
    """Détecte la difficulté d'une recette."""
    name_lower = recipe_name.lower()
    
    for keyword in DIFFICULTY_KEYWORDS["difficile"]:
        if keyword in name_lower:
            return "difficulté:Difficile"
    
    for keyword in DIFFICULTY_KEYWORDS["facile"]:
        if keyword in name_lower:
            return "difficulté:Facile"
    
    return "difficulté:Moyen"


def detect_occasions(recipe_name: str) -> List[str]:
    """Détecte les occasions pour une recette."""
    name_lower = recipe_name.lower()
    occasions = []
    
    for occasion, keywords in OCCASION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in name_lower:
                occasions.append(occasion)
                break
    
    return occasions


def detect_seasons(recipe_name: str) -> List[str]:
    """Détecte les saisons pour une recette."""
    name_lower = recipe_name.lower()
    seasons = []
    
    for season, keywords in SEASON_KEYWORDS.items():
        for keyword in keywords:
            if keyword in name_lower:
                seasons.append(season)
                break
    
    return seasons


def generate_ingredients(recipe_name: str, servings: int = 4) -> List[Tuple[str, float, str]]:
    """Génère une liste d'ingrédients probable pour une recette."""
    name_lower = recipe_name.lower()
    ingredients = []
    
    # Ingrédients de base toujours présents
    base_ingredients = [
        ("sel", 1, "pincée"),
        ("poivre", 1, "pincée"),
    ]
    
    # Chercher des ingrédients spécifiques
    for keyword, ingredient_list in INGREDIENT_PATTERNS.items():
        if keyword in name_lower:
            for ing in ingredient_list:
                # Calculer une quantité basée sur le nombre de portions
                if ing in ["sel", "poivre"]:
                    continue  # Déjà dans base_ingredients
                elif ing in ["huile", "huile d'olive"]:
                    ingredients.append((ing, 2 * servings, "cuillère à soupe"))
                elif ing in ["ail", "oignon"]:
                    ingredients.append((ing, 1, "pièce"))
                elif ing in ["farine", "sucre"]:
                    ingredients.append((ing, 200, "g"))
                elif "fromage" in ing:
                    ingredients.append((ing, 100 * servings / 4, "g"))
                elif "viande" in ing or "poulet" in ing or "bœuf" in ing:
                    ingredients.append((ing, 150 * servings / 4, "g"))
                else:
                    ingredients.append((ing, 100 * servings / 4, "g"))
    
    # Ajouter les ingrédients de base
    ingredients.extend(base_ingredients)
    
    # Dédupliquer
    seen = set()
    unique_ingredients = []
    for ing in ingredients:
        if ing[0] not in seen:
            seen.add(ing[0])
            unique_ingredients.append(ing)
    
    return unique_ingredients if unique_ingredients else [
        ("ingrédient principal", 500, "g"),
        ("sel", 1, "pincée"),
        ("poivre", 1, "pincée"),
    ]


def generate_detailed_instructions(recipe_name: str, role: str, cooking_method: str) -> List[str]:
    """Génère des instructions détaillées."""
    base_instructions = INSTRUCTION_TEMPLATES.get(role, INSTRUCTION_TEMPLATES["PLAT_PRINCIPAL"])
    
    # Personnaliser selon la méthode de cuisson
    if "four" in cooking_method.lower():
        base_instructions.insert(1, "Préchauffer le four à 180°C (th.6).")
    elif "poêle" in cooking_method.lower():
        base_instructions.insert(1, "Faire chauffer une poêle à feu moyen avec un filet d'huile.")
    elif "mijotage" in cooking_method.lower():
        base_instructions.insert(1, "Préparer une cocotte ou une casserole à fond épais.")
    
    return base_instructions


def create_enrichment_sql() -> str:
    """Crée le script SQL d'enrichissement."""
    
    sql_parts = []
    sql_parts.append("-- Script d'enrichissement des recettes")
    sql_parts.append("-- Ajoute : difficulté, occasions, saisons")
    sql_parts.append("")
    sql_parts.append("BEGIN;")
    sql_parts.append("")
    
    # Créer les nouveaux tags
    new_tags = [
        "difficulté:Facile",
        "difficulté:Moyen",
        "difficulté:Difficile",
        "saison:Printemps",
        "saison:Été",
        "saison:Automne",
        "saison:Hiver",
        "usage:Petit-déjeuner",
        "usage:Apéritif",
        "usage:Fête",
        "usage:Barbecue",
        "profil:Gourmand",
        "profil:Healthy",
        "profil:Rapide",
    ]
    
    sql_parts.append("-- Insertion des nouveaux tags")
    sql_parts.append("INSERT INTO tags (name) VALUES")
    tag_values = [f"('{tag}')" for tag in new_tags]
    sql_parts.append(",\n".join(tag_values))
    sql_parts.append("ON CONFLICT (name) DO NOTHING;")
    sql_parts.append("")
    
    sql_parts.append("COMMIT;")
    
    return "\n".join(sql_parts)


def main():
    """Fonction principale."""
    print("🎨 Enrichissement des recettes")
    print("=" * 60)
    
    # Générer le SQL pour les nouveaux tags
    print("\n🏷️  Génération des nouveaux tags...")
    sql = create_enrichment_sql()
    
    output_file = "/workspaces/garde-manger-app/tools/enrich_tags.sql"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"✅ Script SQL créé : {output_file}")
    
    # Exemple d'enrichissement pour une recette
    print("\n📝 Exemple d'enrichissement pour 'Bœuf bourguignon':")
    recipe_name = "Bœuf bourguignon"
    
    difficulty = detect_difficulty(recipe_name)
    occasions = detect_occasions(recipe_name)
    seasons = detect_seasons(recipe_name)
    ingredients = generate_ingredients(recipe_name, 6)
    instructions = generate_detailed_instructions(recipe_name, "PLAT_PRINCIPAL", "Mijotage")
    
    print(f"  - Difficulté: {difficulty}")
    print(f"  - Occasions: {', '.join(occasions) if occasions else 'Quotidien'}")
    print(f"  - Saisons: {', '.join(seasons) if seasons else 'Toute l année'}")
    print(f"  - Nombre d'ingrédients: {len(ingredients)}")
    print(f"  - Nombre d'instructions: {len(instructions)}")
    
    print("\n✨ Prêt pour l'enrichissement !")
    print("\nPour enrichir toutes les recettes :")
    print("  1. Exécuter enrich_tags.sql")
    print("  2. Utiliser enrich_all_recipes.sql (à générer)")


if __name__ == "__main__":
    main()
