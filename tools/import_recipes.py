#!/usr/bin/env python3
"""
Script pour importer les 3000 recettes dans la base de données PostgreSQL
"""

import os
import re
import json
from typing import List, Dict, Tuple, Optional

# Configuration de la connexion à la base de données
# Les variables d'environnement doivent être définies
DB_CONNECTION_STRING = os.getenv("DATABASE_URL_TX", "")

# Règles d'analyse pour déterminer les caractéristiques d'une recette
CUISINE_PATTERNS = {
    "cuisine:Française": ["français", "française", "provence", "alsacien", "breton", "lyonnais", "landaise", "niçois", "dauphinois", "bourguignon", "parisien"],
    "cuisine:Italienne": ["italien", "italienne", "pâtes", "risotto", "pizza", "gnocchi", "tiramisu", "panna cotta", "sicilien", "milanais", "napolitain", "romain"],
    "cuisine:Espagnole": ["espagnol", "espagnole", "paella", "tapas", "gazpacho", "tortilla", "churros", "catalan", "basque"],
    "cuisine:Asiatique": ["asiatique", "wok", "sauté"],
    "cuisine:Chinoise": ["chinois", "chinoise", "cantonais", "sichuan", "dim sum"],
    "cuisine:Japonaise": ["japonais", "japonaise", "ramen", "udon", "soba", "sushi", "miso", "teriyaki", "katsu", "tempura"],
    "cuisine:Thaïlandaise": ["thaï", "thaïlandais", "pad thaï", "tom yum", "curry thaï"],
    "cuisine:Indienne": ["indien", "indienne", "curry", "tandoori", "masala", "biryani", "naan", "chapati"],
    "cuisine:Mexicaine": ["mexicain", "mexicaine", "tacos", "quesadilla", "guacamole", "chili", "mole"],
    "cuisine:Orientale": ["libanais", "libanaise", "marocain", "marocaine", "tajine", "couscous", "houmous", "falafel", "kebab"],
    "cuisine:Américaine": ["américain", "américaine", "burger", "hot-dog", "barbecue", "pulled pork", "cheesecake", "brownies"],
}

REGIME_PATTERNS = {
    "régime:Végétarien": ["végétarien", "végétarienne", "sans viande", "légumes"],
    "régime:Vegan": ["vegan", "végétalien", "tofu", "seitan", "tempeh"],
}

COOKING_METHODS = {
    "Cuisson au four": ["four", "rôti", "gratin", "tarte", "cake", "gâteau", "pizza"],
    "Poêle": ["poêlé", "sauté", "grillé", "frit", "escalope"],
    "Mijotage": ["mijoté", "braisé", "daube", "bourguignon", "tajine", "ragoût"],
    "Vapeur": ["vapeur"],
    "Grill/Barbecue": ["barbecue", "brochette", "grill"],
    "Friture": ["frit", "beignet", "tempura", "churros"],
    "Sans cuisson": ["cru", "tartare", "carpaccio", "salade", "ceviche"],
}

USAGE_PATTERNS = {
    "usage:Rapide (-30min)": ["rapide", "express", "minutes"],
    "usage:Facile": ["facile", "simple", "basique"],
    "usage:Pour recevoir": ["pour recevoir", "festif", "élégant"],
    "usage:En famille": ["famille", "enfants"],
    "usage:Batch cooking": ["batch", "lot", "congélation"],
}

PROFIL_PATTERNS = {
    "profil:Réconfortant": ["réconfortant", "gratin", "mijoté", "crème", "soupe"],
    "profil:Léger": ["léger", "légère", "salade", "vapeur"],
    "profil:Frais": ["frais", "fraîche", "cru", "froid"],
    "profil:Riche": ["riche", "crémeux", "fromage", "lard"],
    "profil:Épicé": ["épicé", "épicée", "piment", "curry", "harissa"],
}


def parse_recipe_file(filepath: str) -> List[str]:
    """Parse le fichier de recettes et retourne une liste de noms de recettes."""
    recipes = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extraire les recettes en ignorant les lignes de batch
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Ignorer les lignes vides, les titres de batch, les numéros et les commentaires
        if not line or line.startswith('---') or line.startswith('Liste de'):
            continue
        
        # Ignorer les lignes contenant des commentaires ou des notes
        if '...' in line or 'note:' in line.lower() or 'pour des raisons' in line.lower():
            continue
        
        # Retirer les numéros en début de ligne (ex: "21. ")
        recipe_name = re.sub(r'^\d+\.\s*', '', line)
        
        if recipe_name and len(recipe_name) > 3:
            recipes.append(recipe_name)
    
    return recipes


def detect_cuisine(recipe_name: str) -> List[str]:
    """Détecte les tags de cuisine basés sur le nom de la recette."""
    tags = []
    recipe_lower = recipe_name.lower()
    
    for tag, keywords in CUISINE_PATTERNS.items():
        for keyword in keywords:
            if keyword.lower() in recipe_lower:
                tags.append(tag)
                break
    
    return tags


def detect_regime(recipe_name: str) -> List[str]:
    """Détecte les tags de régime alimentaire."""
    tags = []
    recipe_lower = recipe_name.lower()
    
    # Végétarien si contient certains mots-clés
    if any(kw in recipe_lower for kw in ["salade", "légumes", "végétarien", "tofu", "seitan", "tempeh"]):
        if "viande" not in recipe_lower and "poulet" not in recipe_lower and "bœuf" not in recipe_lower and "porc" not in recipe_lower and "poisson" not in recipe_lower:
            tags.append("régime:Végétarien")
    
    # Vegan
    if any(kw in recipe_lower for kw in ["vegan", "végétalien", "tofu", "seitan", "tempeh"]):
        tags.append("régime:Vegan")
    
    return tags


def detect_cooking_method(recipe_name: str) -> Optional[str]:
    """Détecte la méthode de cuisson basée sur le nom."""
    recipe_lower = recipe_name.lower()
    
    for method, keywords in COOKING_METHODS.items():
        for keyword in keywords:
            if keyword in recipe_lower:
                return method
    
    return "Mixte"


def detect_role(recipe_name: str) -> str:
    """Détecte le rôle de la recette (plat principal, accompagnement, etc.)."""
    recipe_lower = recipe_name.lower()
    
    # Desserts
    if any(kw in recipe_lower for kw in ["tarte", "gâteau", "crème", "mousse", "tiramisu", "brownie", "cookie", "muffin", "cake", "pudding", "sorbet", "glace", "compote"]):
        return "DESSERT"
    
    # Entrées/Apéritifs
    if any(kw in recipe_lower for kw in ["salade", "soupe", "velouté", "tapas", "bruschetta", "tartine", "toast"]):
        return "ENTREE"
    
    # Accompagnements
    if any(kw in recipe_lower for kw in ["gratin", "purée", "riz", "pâtes", "frites", "légumes rôtis"]):
        # Vérifier si c'est vraiment un accompagnement
        if "poulet" not in recipe_lower and "bœuf" not in recipe_lower and "porc" not in recipe_lower:
            return "ACCOMPAGNEMENT"
    
    # Par défaut, plat principal
    return "PLAT_PRINCIPAL"


def estimate_time(recipe_name: str, role: str) -> Tuple[int, int]:
    """Estime les temps de préparation et cuisson."""
    recipe_lower = recipe_name.lower()
    
    # Temps de préparation par défaut selon le type
    if role == "DESSERT":
        prep_time = 20
        cook_time = 40
    elif role == "ENTREE":
        prep_time = 15
        cook_time = 15
    elif role == "ACCOMPAGNEMENT":
        prep_time = 10
        cook_time = 30
    else:  # PLAT_PRINCIPAL
        prep_time = 25
        cook_time = 45
    
    # Ajustements selon les mots-clés
    if any(kw in recipe_lower for kw in ["rapide", "express", "minutes"]):
        prep_time = min(prep_time, 10)
        cook_time = min(cook_time, 20)
    
    if any(kw in recipe_lower for kw in ["mijoté", "braisé", "confit", "sept heures"]):
        cook_time = max(cook_time, 120)
    
    if "cru" in recipe_lower or "tartare" in recipe_lower or "carpaccio" in recipe_lower:
        cook_time = 0
    
    return prep_time, cook_time


def estimate_servings(role: str) -> int:
    """Estime le nombre de portions."""
    if role == "DESSERT":
        return 6
    elif role == "ENTREE":
        return 4
    elif role == "ACCOMPAGNEMENT":
        return 4
    else:
        return 4


def generate_description(recipe_name: str, tags: List[str]) -> str:
    """Génère une description basée sur le nom et les tags."""
    cuisine_tags = [t for t in tags if t.startswith("cuisine:")]
    
    if cuisine_tags:
        cuisine = cuisine_tags[0].split(":")[1]
        return f"Une délicieuse recette {cuisine.lower()} : {recipe_name}"
    
    return f"Une savoureuse recette de {recipe_name}"


def create_recipe_sql(recipes: List[str], existing_tags: Dict[str, int]) -> str:
    """Génère le SQL pour insérer toutes les recettes."""
    
    sql_parts = []
    recipe_tags_sql = []
    instructions_sql = []
    
    # Collecter tous les tags nécessaires
    all_tags_needed = set()
    
    for recipe_name in recipes:
        cuisine_tags = detect_cuisine(recipe_name)
        regime_tags = detect_regime(recipe_name)
        all_tags_needed.update(cuisine_tags + regime_tags)
    
    # Créer les nouveaux tags si nécessaire
    new_tags = []
    for tag in all_tags_needed:
        if tag not in existing_tags:
            new_tags.append(tag)
    
    if new_tags:
        sql_parts.append("-- Insertion des nouveaux tags")
        sql_parts.append("INSERT INTO tags (name) VALUES")
        tag_values = [f"('{tag}')" for tag in new_tags]
        sql_parts.append(",\n".join(tag_values))
        sql_parts.append("ON CONFLICT (name) DO NOTHING;")
        sql_parts.append("")
    
    # Générer le SQL pour les recettes
    sql_parts.append("-- Insertion des recettes")
    sql_parts.append("INSERT INTO recipes (name, description, prep_time_minutes, cook_time_minutes, servings, cooking_method, role, is_scalable_to_main)")
    sql_parts.append("VALUES")
    
    recipe_values = []
    for i, recipe_name in enumerate(recipes, start=2):  # start=2 car il y a déjà 1 recette
        role = detect_role(recipe_name)
        cooking_method = detect_cooking_method(recipe_name)
        prep_time, cook_time = estimate_time(recipe_name, role)
        servings = estimate_servings(role)
        
        cuisine_tags = detect_cuisine(recipe_name)
        regime_tags = detect_regime(recipe_name)
        all_recipe_tags = cuisine_tags + regime_tags
        
        description = generate_description(recipe_name, all_recipe_tags)
        
        # Échapper les apostrophes
        safe_name = recipe_name.replace("'", "''")
        safe_desc = description.replace("'", "''")
        safe_method = cooking_method.replace("'", "''") if cooking_method else "Mixte"
        
        is_scalable = 'true' if role == "ACCOMPAGNEMENT" else 'false'
        
        recipe_values.append(
            f"('{safe_name}', '{safe_desc}', {prep_time}, {cook_time}, {servings}, '{safe_method}', '{role}', {is_scalable})"
        )
        
        # Préparer les associations recipe_tags
        for tag in all_recipe_tags:
            recipe_tags_sql.append((i, tag))
        
        # Préparer une instruction basique
        instructions_sql.append((i, safe_name))
    
    sql_parts.append(",\n".join(recipe_values))
    sql_parts.append("RETURNING id;")
    sql_parts.append("")
    
    # Générer le SQL pour les recipe_tags
    if recipe_tags_sql:
        sql_parts.append("-- Association des tags aux recettes")
        sql_parts.append("INSERT INTO recipe_tags (recipe_id, tag_id)")
        sql_parts.append("SELECT r.id, t.id")
        sql_parts.append("FROM (VALUES")
        
        tag_associations = []
        for recipe_id, tag_name in recipe_tags_sql:
            safe_tag = tag_name.replace("'", "''")
            tag_associations.append(f"  ({recipe_id}, '{safe_tag}')")
        
        sql_parts.append(",\n".join(tag_associations))
        sql_parts.append(") AS r(id, tag_name)")
        sql_parts.append("JOIN tags t ON t.name = r.tag_name")
        sql_parts.append("ON CONFLICT (recipe_id, tag_id) DO NOTHING;")
        sql_parts.append("")
    
    # Générer le SQL pour les instructions
    if instructions_sql:
        sql_parts.append("-- Ajout des instructions de base")
        sql_parts.append("INSERT INTO instructions (recipe_id, step_number, description)")
        sql_parts.append("VALUES")
        
        instruction_values = []
        for recipe_id, recipe_name in instructions_sql:
            instruction_values.append(
                f"({recipe_id}, 1, 'Préparer tous les ingrédients pour {recipe_name}'),"
            )
            instruction_values.append(
                f"({recipe_id}, 2, 'Suivre les étapes de préparation classiques pour cette recette'),"
            )
            instruction_values.append(
                f"({recipe_id}, 3, 'Servir et déguster'),"
            )
        
        # Retirer la dernière virgule de la toute dernière ligne
        if instruction_values:
            instruction_values[-1] = instruction_values[-1].rstrip(',')
        
        sql_parts.append("\n".join(instruction_values))
        sql_parts.append(";")
    
    return "\n".join(sql_parts)


def main():
    """Fonction principale."""
    print("🍳 Import des 3000 recettes dans la base de données")
    print("=" * 60)
    
    # Lire le fichier de recettes
    recipe_file = "/workspaces/garde-manger-app/supabase/batch pour recette.txt"
    print(f"\n📖 Lecture du fichier : {recipe_file}")
    
    recipes = parse_recipe_file(recipe_file)
    print(f"✅ {len(recipes)} recettes trouvées")
    
    # Tags existants (à récupérer de la base)
    existing_tags = {
        "cuisine:Américaine": 11,
        "cuisine:Asiatique": 4,
        "cuisine:Chinoise": 7,
        "cuisine:Espagnole": 3,
        "cuisine:Française": 1,
        "cuisine:Indienne": 8,
        "cuisine:Italienne": 2,
        "cuisine:Japonaise": 6,
        "cuisine:Mexicaine": 10,
        "cuisine:Orientale": 9,
        "cuisine:Thaïlandaise": 5,
        "profil:Acide": 18,
        "profil:Crémeux": 16,
        "profil:Épicé": 17,
        "profil:Frais": 14,
        "profil:Léger": 13,
        "profil:Réconfortant": 12,
        "profil:Riche": 15,
        "profil:Sucré-salé": 19,
        "régime:Faible en glucides": 24,
        "régime:Sans gluten": 22,
        "régime:Sans lactose": 23,
        "régime:Vegan": 21,
        "régime:Végétarien": 20,
        "usage:Anti-gaspi": 30,
        "usage:Batch cooking": 29,
        "usage:En famille": 28,
        "usage:Facile": 26,
        "usage:Festif": 31,
        "usage:Pique-nique": 32,
        "usage:Pour recevoir": 27,
        "usage:Rapide (-30min)": 25,
    }
    
    # Générer le SQL
    print("\n🔧 Génération du script SQL...")
    sql_script = create_recipe_sql(recipes, existing_tags)
    
    # Sauvegarder le script
    output_file = "/workspaces/garde-manger-app/tools/import_recipes.sql"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Script d'import des 3000 recettes\n")
        f.write("-- Généré automatiquement\n\n")
        f.write("BEGIN;\n\n")
        f.write(sql_script)
        f.write("\n\nCOMMIT;\n")
    
    print(f"✅ Script SQL généré : {output_file}")
    print(f"\n📊 Statistiques :")
    print(f"   - Recettes à importer : {len(recipes)}")
    
    # Statistiques par rôle
    roles_count = {}
    for recipe_name in recipes:
        role = detect_role(recipe_name)
        roles_count[role] = roles_count.get(role, 0) + 1
    
    print(f"\n   Répartition par type :")
    for role, count in sorted(roles_count.items()):
        print(f"   - {role}: {count}")
    
    print("\n✨ Script prêt à être exécuté !")
    print(f"   Commande : psql \"$DATABASE_URL_TX\" -f {output_file}")


if __name__ == "__main__":
    main()
