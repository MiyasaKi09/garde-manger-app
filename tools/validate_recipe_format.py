#!/usr/bin/env python3
"""
Validateur de format pour les lignes de recettes enrichies.
Usage: python3 validate_recipe_format.py <fichier>
"""

import re
import sys

def validate_recipe_line(line, line_num=0):
    """Valide une ligne de recette."""
    line = line.strip()

    # Ignorer les lignes vides et l'en-tête
    if not line or line.startswith('ID,Nom,Portions'):
        return True, "SKIP"

    # Format attendu: ID,Nom,Portions,"ing1","ing2",...
    # Les ingrédients peuvent contenir des virgules, donc on split avec soin

    # Extraire ID
    match = re.match(r'^(\d+),', line)
    if not match:
        return False, f"Ligne {line_num}: ID invalide au début"

    recipe_id = int(match.group(1))
    rest = line[match.end():]

    # Extraire le nom (peut contenir des virgules si entre guillemets)
    # Format: Nom,Portions,"ingredients"
    # ou: "Nom avec virgule",Portions,"ingredients"

    if rest.startswith('"'):
        # Nom entre guillemets
        end_quote = rest.find('"', 1)
        if end_quote == -1:
            return False, f"Ligne {line_num}: Guillemets du nom non fermés"
        name = rest[1:end_quote]
        rest = rest[end_quote+1:]
        if not rest.startswith(','):
            return False, f"Ligne {line_num}: Virgule attendue après le nom"
        rest = rest[1:]
    else:
        # Nom sans guillemets
        comma_pos = rest.find(',')
        if comma_pos == -1:
            return False, f"Ligne {line_num}: Virgule attendue après le nom"
        name = rest[:comma_pos]
        rest = rest[comma_pos+1:]

    # Extraire les portions
    comma_pos = rest.find(',')
    if comma_pos == -1:
        return False, f"Ligne {line_num}: Virgule attendue après les portions"

    try:
        portions = int(rest[:comma_pos])
        if portions < 1 or portions > 50:
            return False, f"Ligne {line_num}: Portions invalides ({portions}), attendu 1-50"
    except ValueError:
        return False, f"Ligne {line_num}: Portions invalides '{rest[:comma_pos]}'"

    rest = rest[comma_pos+1:]

    # Extraire les ingrédients
    ingredients = re.findall(r'"([^"]+)"', rest)

    if len(ingredients) == 0:
        return False, f"Ligne {line_num}: Aucun ingrédient trouvé"

    if len(ingredients) < 2:
        return False, f"Ligne {line_num}: Trop peu d'ingrédients ({len(ingredients)}), minimum 2"

    # Valider chaque ingrédient
    valid_units = [
        'g', 'kg', 'ml', 'L', 'cl', 'dl',
        'cuillère à soupe', 'cuillère à café',
        'pièce', 'tranche', 'gousse', 'bouquet', 'pincée',
        'tasse', 'verre', 'brin', 'feuille', 'branche',
        'c. à soupe', 'c. à café', 'càs', 'càc', 'cs', 'cc'
    ]

    for i, ing in enumerate(ingredients, 1):
        parts = ing.split('|')

        if len(parts) != 3:
            return False, f"Ligne {line_num}, ingrédient {i}: Format invalide '{ing}' (attendu quantité|unité|nom)"

        quantity, unit, ingredient_name = parts

        # Valider la quantité
        try:
            qty_float = float(quantity)
            if qty_float < 0:
                return False, f"Ligne {line_num}, ingrédient {i}: Quantité négative"
        except ValueError:
            return False, f"Ligne {line_num}, ingrédient {i}: Quantité invalide '{quantity}'"

        # Valider l'unité
        if not unit:
            return False, f"Ligne {line_num}, ingrédient {i}: Unité vide"

        # Valider le nom
        if not ingredient_name or len(ingredient_name) < 2:
            return False, f"Ligne {line_num}, ingrédient {i}: Nom d'ingrédient invalide"

    return True, f"✅ ID {recipe_id}: {name} ({portions} portions, {len(ingredients)} ingrédients)"


def validate_file(filepath):
    """Valide un fichier entier."""
    print("=" * 80)
    print(f"🔍 VALIDATION DU FICHIER: {filepath}")
    print("=" * 80)

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    total = 0
    valid = 0
    errors = []

    for i, line in enumerate(lines, 1):
        is_valid, message = validate_recipe_line(line, i)

        if message == "SKIP":
            continue

        total += 1

        if is_valid:
            valid += 1
            print(message)
        else:
            errors.append(message)
            print(f"❌ {message}")

    print("\n" + "=" * 80)
    print(f"📊 RÉSULTATS")
    print("=" * 80)
    print(f"Total lignes validées: {total}")
    print(f"Lignes valides:        {valid}")
    print(f"Lignes avec erreurs:   {len(errors)}")

    if errors:
        print("\n⚠️  ERREURS:")
        for error in errors:
            print(f"  - {error}")

    return len(errors) == 0


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 validate_recipe_format.py <fichier>")
        print("\nExemple:")
        print("  python3 validate_recipe_format.py enriched_recipes.txt")
        sys.exit(1)

    filepath = sys.argv[1]
    success = validate_file(filepath)
    sys.exit(0 if success else 1)
