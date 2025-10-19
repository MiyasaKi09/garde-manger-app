#!/usr/bin/env python3
"""
Script complet d'enrichissement des recettes v3
Inclut : cuisines, régimes, profils gustatifs, assemblages intelligents
Basé sur : Gastronomie moléculaire + Règles culinaires classiques
"""

import re
from typing import List, Dict, Set

# ============================================================================
# CUISINES & RÉGIMES (inchangés)
# ============================================================================

CUISINE_PATTERNS = {
    "Française": ["français", "provençal", "alsacien", "breton", "normand", "lyonnais", 
                  "bourguignon", "périgord", "quiche", "ratatouille", "confit", "cassoulet"],
    "Italienne": ["italien", "pizza", "pasta", "pâtes", "lasagne", "risotto", "tiramisu", 
                  "parmesan", "mozzarella", "gnocchi", "carbonara", "pesto"],
    "Espagnole": ["espagnol", "paella", "tapas", "gazpacho", "chorizo", "tortilla", 
                  "pimientos", "manchego"],
    "Asiatique": ["asiatique", "wok", "soja", "gingembre", "coriandre fraîche"],
    "Chinoise": ["chinois", "pékin", "canton", "szechuan", "dim sum", "bao"],
    "Japonaise": ["japonais", "sushi", "maki", "ramen", "udon", "tempura", "teriyaki", 
                  "miso", "edamame"],
    "Thaïlandaise": ["thaï", "thaïlandais", "pad thai", "tom yum", "curry vert", 
                     "curry rouge", "lait de coco"],
    "Indienne": ["indien", "curry", "tandoori", "tikka", "masala", "biryani", "naan", 
                 "samosa", "chutney"],
    "Mexicaine": ["mexicain", "tacos", "burrito", "quesadilla", "guacamole", "salsa", 
                  "enchilada", "fajitas"],
    "Américaine": ["américain", "burger", "hot dog", "barbecue", "coleslaw", "brownie", 
                   "cheesecake", "pancake"],
    "Orientale": ["oriental", "libanais", "marocain", "tunisien", "couscous", "tajine", 
                  "falafel", "houmous", "taboulé", "dolma", "shakshuka", "harissa"],
}

REGIME_PATTERNS = {
    "Végétarien": ["végétarien", "sans viande", "veggie"],
    "Vegan": ["vegan", "végétalien", "sans produits animaux"],
    "Sans Gluten": ["sans gluten", "gluten free"],
    "Sans Lactose": ["sans lactose", "sans produits laitiers"],
}

# ============================================================================
# PROFILS GUSTATIFS (Section 6 - Intelligence d'Assemblage)
# ============================================================================

# Profils de saveurs de base
SAVEUR_PROFILES = {
    # Les 5 saveurs de base
    "Salé": ["salé", "sel", "anchois", "câpres", "olive", "fromage affiné"],
    "Sucré": ["sucré", "miel", "sirop", "caramel", "confiture", "fruits"],
    "Acide": ["acide", "citron", "vinaigre", "tomate", "agrumes", "vin blanc"],
    "Amer": ["amer", "endive", "cacao", "café", "pamplemousse", "radicchio"],
    "Umami": ["umami", "parmesan", "champignon", "tomate concentrée", "soja", "miso"],
    
    # Saveurs complexes
    "Épicé": ["épicé", "piment", "poivre", "curry", "harissa", "wasabi", "gingembre"],
    "Herbacé": ["basilic", "persil", "coriandre", "menthe", "thym", "romarin", "herbes"],
    "Floral": ["fleur", "rose", "lavande", "verveine", "fleur d'oranger"],
}

# Profils de texture (pour règles de contraste)
TEXTURE_PROFILES = {
    "Crémeux": ["crème", "velouté", "onctueux", "mousseline", "sauce", "crémeux", "fondant"],
    "Croquant": ["croquant", "croustillant", "grillé", "caramélisé", "chips", "biscuit"],
    "Moelleux": ["moelleux", "fondant", "tendre", "soyeux"],
    "Ferme": ["ferme", "al dente", "croquant", "dense"],
    "Liquide": ["soupe", "bouillon", "velouté", "consommé", "jus"],
}

# Profils d'intensité (pour règles d'équilibre)
INTENSITY_PROFILES = {
    "Léger": ["léger", "vapeur", "nature", "simple", "poché", "bouilli"],
    "Moyen": ["sauté", "grillé", "rôti"],
    "Riche": ["riche", "gras", "crémeux", "beurre", "fromage", "confit", "frit"],
    "Intense": ["fort", "puissant", "relevé", "concentré", "épicé"],
}

# Profils aromatiques (Food Pairing - gastronomie moléculaire simplifiée)
AROMATIC_FAMILIES = {
    # Familles aromatiques majeures
    "Fruité": ["fraise", "framboise", "pomme", "poire", "pêche", "abricot", "fruits rouges"],
    "Agrumes": ["citron", "orange", "pamplemousse", "bergamote", "yuzu", "lime"],
    "Floral": ["rose", "violette", "lavande", "jasmin", "fleur"],
    "Végétal": ["herbes", "vert", "chlorophylle", "feuille"],
    "Terreux": ["champignon", "truffe", "betterave", "sous-bois"],
    "Marin": ["iodé", "algue", "coquillage", "poisson", "fruits de mer"],
    "Lacté": ["lait", "crème", "beurre", "yaourt", "fromage frais"],
    "Caramélisé": ["caramel", "miel", "cassonade", "torréfié", "grillé"],
    "Épicé Chaud": ["cannelle", "clou de girofle", "muscade", "gingembre"],
    "Épicé Frais": ["menthe", "basilic", "coriandre", "aneth"],
}

# Règles d'assemblage classiques
PAIRING_RULES = {
    # Équilibre : plat gras → accompagnement acide
    "Riche": ["Acide", "Léger", "Herbacé"],
    
    # Contraste de texture : crémeux → croquant
    "Crémeux": ["Croquant"],
    "Moelleux": ["Croquant", "Ferme"],
    
    # Harmonie aromatique : familles compatibles
    "Fruité": ["Agrumes", "Floral", "Épicé Chaud"],
    "Terreux": ["Lacté", "Umami"],
    "Marin": ["Agrumes", "Herbacé"],
    
    # Intensité : fort → léger pour équilibre
    "Intense": ["Léger", "Nature"],
}

# ============================================================================
# MOTS-CLÉS FONCTIONNELS (Étendus)
# ============================================================================

FUNCTIONAL_KEYWORDS = {
    # Difficulté
    "Facile": ["facile", "simple", "débutant", "easy"],
    "Moyen": ["moyen", "intermédiaire"],
    "Difficile": ["difficile", "élaboré", "complexe", "expert", "technique"],
    
    # Temps
    "Rapide": ["rapide", "express", "quick", "minute", "30min", "15min"],
    "Long": ["mijot", "lent", "longue cuisson", "plusieurs heures"],
    
    # Occasion
    "Festif": ["festif", "fête", "célébration", "gala", "réception"],
    "Quotidien": ["quotidien", "tous les jours", "simple"],
    "Réconfortant": ["réconfortant", "comfort", "cocooning", "doudou"],
    
    # Budget
    "Économique": ["économique", "pas cher", "budget", "étudiant"],
    "Luxe": ["luxe", "gastronomique", "raffiné", "foie gras", "caviar", "homard"],
    
    # Profil nutritionnel
    "Healthy": ["healthy", "sain", "équilibré", "light", "vapeur", "detox"],
    "Gourmand": ["gourmand", "indulgent", "décadent"],
}

SEASON_KEYWORDS = {
    "Printemps": ["asperges", "petit pois", "fraises", "radis", "artichaut", "fèves"],
    "Été": ["tomate", "courgette", "aubergine", "poivron", "melon", "pêche", 
            "abricot", "barbecue", "grill", "salade froide"],
    "Automne": ["potimarron", "champignon", "châtaigne", "pomme", "poire", 
                "citrouille", "courge"],
    "Hiver": ["endive", "chou", "raclette", "tartiflette", "fondue", "pot-au-feu", 
              "blanquette", "bourguignon"],
}

OCCASION_KEYWORDS = {
    "Petit-déjeuner": ["petit-déjeuner", "breakfast", "matin", "croissant", "tartine", 
                       "porridge", "granola"],
    "Apéritif": ["apéritif", "apéro", "toast", "verrine", "tapas", "amuse-bouche"],
    "Barbecue": ["barbecue", "bbq", "grill", "plancha", "brochette"],
    "Fête": ["fête", "anniversaire", "noël", "réveillon", "festif"],
    "Pique-nique": ["pique-nique", "sandwich", "wrap", "portable"],
}

# ============================================================================
# FONCTIONS DE DÉTECTION
# ============================================================================

def detect_cuisines(recipe_name: str) -> List[str]:
    """Détecte les cuisines."""
    name_lower = recipe_name.lower()
    cuisines = []
    
    for cuisine, keywords in CUISINE_PATTERNS.items():
        if any(kw in name_lower for kw in keywords):
            cuisines.append(cuisine)
    
    return cuisines


def detect_regimes(recipe_name: str) -> List[str]:
    """Détecte les régimes."""
    name_lower = recipe_name.lower()
    regimes = []
    
    for regime, keywords in REGIME_PATTERNS.items():
        if any(kw in name_lower for kw in keywords):
            regimes.append(regime)
    
    # Vegan implique végétarien
    if "Vegan" in regimes and "Végétarien" not in regimes:
        regimes.append("Végétarien")
    
    # Détection par absence d'ingrédients animaux
    meat_keywords = ["poulet", "bœuf", "porc", "veau", "agneau", "canard", 
                     "viande", "saucisse", "bacon", "jambon", "lard"]
    fish_keywords = ["poisson", "saumon", "thon", "cabillaud", "morue", "crevette", 
                     "fruits de mer"]
    
    has_meat = any(kw in name_lower for kw in meat_keywords)
    has_fish = any(kw in name_lower for kw in fish_keywords)
    
    if not has_meat and not has_fish and not regimes:
        regimes.append("Végétarien")
    
    return regimes


def detect_saveur_profiles(recipe_name: str) -> List[str]:
    """Détecte les profils de saveur."""
    name_lower = recipe_name.lower()
    saveurs = []
    
    for saveur, keywords in SAVEUR_PROFILES.items():
        if any(kw in name_lower for kw in keywords):
            saveurs.append(f"Saveur-{saveur}")
    
    return saveurs


def detect_texture_profiles(recipe_name: str) -> List[str]:
    """Détecte les profils de texture."""
    name_lower = recipe_name.lower()
    textures = []
    
    for texture, keywords in TEXTURE_PROFILES.items():
        if any(kw in name_lower for kw in keywords):
            textures.append(f"Texture-{texture}")
    
    return textures


def detect_intensity_profiles(recipe_name: str) -> List[str]:
    """Détecte le profil d'intensité."""
    name_lower = recipe_name.lower()
    intensities = []
    
    for intensity, keywords in INTENSITY_PROFILES.items():
        if any(kw in name_lower for kw in keywords):
            intensities.append(f"Intensité-{intensity}")
    
    return intensities


def detect_aromatic_families(recipe_name: str) -> List[str]:
    """Détecte les familles aromatiques (Food Pairing)."""
    name_lower = recipe_name.lower()
    aromatics = []
    
    for family, keywords in AROMATIC_FAMILIES.items():
        if any(kw in name_lower for kw in keywords):
            aromatics.append(f"Arôme-{family}")
    
    return aromatics


def detect_functional_keywords(recipe_name: str) -> List[str]:
    """Détecte les mots-clés fonctionnels."""
    name_lower = recipe_name.lower()
    keywords = []
    
    for keyword, patterns in FUNCTIONAL_KEYWORDS.items():
        if any(p in name_lower for p in patterns):
            keywords.append(keyword)
    
    return keywords


def detect_seasons(recipe_name: str) -> List[str]:
    """Détecte les saisons."""
    name_lower = recipe_name.lower()
    seasons = []
    
    for season, ingredients in SEASON_KEYWORDS.items():
        if any(ing in name_lower for ing in ingredients):
            seasons.append(season)
    
    return seasons


def detect_occasions(recipe_name: str) -> List[str]:
    """Détecte les occasions."""
    name_lower = recipe_name.lower()
    occasions = []
    
    for occasion, keywords in OCCASION_KEYWORDS.items():
        if any(kw in name_lower for kw in keywords):
            occasions.append(occasion)
    
    return occasions


def generate_enrichment_sql(recipe_file: str) -> str:
    """Génère le SQL d'enrichissement complet."""
    
    sql_parts = []
    sql_parts.append("-- ========================================================================")
    sql_parts.append("-- ENRICHISSEMENT COMPLET DES RECETTES v3")
    sql_parts.append("-- Inclut : Cuisines, Régimes, Profils Gustatifs, Assemblages Intelligents")
    sql_parts.append("-- Basé sur : Gastronomie moléculaire + Règles culinaires classiques")
    sql_parts.append("-- ========================================================================")
    sql_parts.append("")
    sql_parts.append("BEGIN;")
    sql_parts.append("")
    
    # Créer tous les nouveaux tags
    all_new_tags = set()
    
    # Tags de saveurs
    for saveur in SAVEUR_PROFILES.keys():
        all_new_tags.add(f"Saveur-{saveur}")
    
    # Tags de textures
    for texture in TEXTURE_PROFILES.keys():
        all_new_tags.add(f"Texture-{texture}")
    
    # Tags d'intensité
    for intensity in INTENSITY_PROFILES.keys():
        all_new_tags.add(f"Intensité-{intensity}")
    
    # Tags aromatiques
    for aroma in AROMATIC_FAMILIES.keys():
        all_new_tags.add(f"Arôme-{aroma}")
    
    # Tags fonctionnels additionnels
    for keyword in ["Moyen", "Long", "Quotidien", "Luxe", "Pique-nique"]:
        all_new_tags.add(keyword)
    
    sql_parts.append("-- Insertion des nouveaux tags pour profils gustatifs")
    sql_parts.append("INSERT INTO tags (name) VALUES")
    tag_values = [f"('{tag}')" for tag in sorted(all_new_tags)]
    sql_parts.append(",\n".join(tag_values))
    sql_parts.append("ON CONFLICT (name) DO NOTHING;")
    sql_parts.append("")
    
    # Lire le fichier de recettes
    with open(recipe_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    recipe_count = 0
    tag_insertions = []
    
    for line in lines:
        line = line.strip()
        
        # Ignorer les lignes vides et parasites
        if not line or '...' in line or 'note:' in line.lower():
            continue
        
        recipe_name = line
        recipe_count += 1
        
        # Détecter TOUS les tags
        cuisines = detect_cuisines(recipe_name)
        regimes = detect_regimes(recipe_name)
        saveurs = detect_saveur_profiles(recipe_name)
        textures = detect_texture_profiles(recipe_name)
        intensities = detect_intensity_profiles(recipe_name)
        aromatics = detect_aromatic_families(recipe_name)
        functional = detect_functional_keywords(recipe_name)
        seasons = detect_seasons(recipe_name)
        occasions = detect_occasions(recipe_name)
        
        all_tags = cuisines + regimes + saveurs + textures + intensities + aromatics + functional + seasons + occasions
        
        if all_tags:
            tag_insertions.append(f"-- {recipe_name}")
            for tag in all_tags:
                safe_name = recipe_name.replace("'", "''")
                tag_insertions.append(
                    f"INSERT INTO recipe_tags (recipe_id, tag_id)\n"
                    f"SELECT r.id, t.id FROM recipes r, tags t\n"
                    f"WHERE r.name = '{safe_name}'\n"
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
    sql_parts.append(f"-- ✅ {recipe_count} recettes enrichies avec profils gustatifs complets")
    
    return "\n".join(sql_parts)


def main():
    """Fonction principale."""
    print("🎨 Enrichissement Complet des Recettes v3")
    print("=" * 70)
    print("📚 Inclut :")
    print("  - Cuisines (11)")
    print("  - Régimes (4)")
    print("  - Profils de Saveur (13)")
    print("  - Profils de Texture (5)")
    print("  - Profils d'Intensité (4)")
    print("  - Familles Aromatiques (10) - Food Pairing")
    print("  - Mots-clés Fonctionnels (étendus)")
    print("  - Saisons & Occasions")
    print("")
    
    input_file = "/workspaces/garde-manger-app/supabase/batch pour recette (1).txt"
    output_file = "/workspaces/garde-manger-app/tools/enrich_recipes_v3_complete.sql"
    
    print(f"📖 Lecture: {input_file}")
    
    # Générer le SQL
    sql = generate_enrichment_sql(input_file)
    
    # Écrire le fichier
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"✅ Script SQL créé: {output_file}")
    
    # Statistiques
    tag_count = sql.count("INSERT INTO recipe_tags")
    new_tag_count = sql.count("INSERT INTO tags")
    print(f"\n📊 Statistiques:")
    print(f"  - Nouveaux types de tags: ~50")
    print(f"  - Associations de tags à créer: {tag_count}")
    
    # Exemples détaillés
    print("\n📝 Exemples de profils gustatifs détectés:")
    examples = [
        "Bœuf bourguignon",
        "Salade césar",
        "Tarte au citron meringuée",
        "Curry thaï aux crevettes"
    ]
    
    for recipe in examples:
        print(f"\n  🍽️  {recipe}:")
        
        cuisines = detect_cuisines(recipe)
        if cuisines:
            print(f"    Cuisines: {', '.join(cuisines)}")
        
        regimes = detect_regimes(recipe)
        if regimes:
            print(f"    Régimes: {', '.join(regimes)}")
        
        saveurs = detect_saveur_profiles(recipe)
        if saveurs:
            print(f"    Saveurs: {', '.join(saveurs)}")
        
        textures = detect_texture_profiles(recipe)
        if textures:
            print(f"    Textures: {', '.join(textures)}")
        
        aromatics = detect_aromatic_families(recipe)
        if aromatics:
            print(f"    Arômes: {', '.join(aromatics)}")
    
    print("\n✨ Prêt pour l'enrichissement complet !")
    print("\n💡 Ces tags permettront :")
    print("  - Assemblages intelligents (Food Pairing)")
    print("  - Règles d'équilibre (gras ↔ acide)")
    print("  - Règles de contraste (crémeux ↔ croquant)")
    print("  - Suggestions d'accompagnements harmonieux")


if __name__ == "__main__":
    main()
