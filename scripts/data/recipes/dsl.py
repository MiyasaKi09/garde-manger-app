"""Expanseur compact : une recette tient en quelques lignes, le schéma complet est reconstruit."""
import json, sys

SCORES = ["sweet", "salty", "acidic", "bitter", "umami", "heat",
          "pungency", "richness", "freshness", "intensity"]


def r(code, family, cuisine, category, servings, prep, cook, diff, ing, steps,
      tech, profile, sc, flavors, aromas, textures, sign, guards, cons,
      allerg=(), plate="main", accepts=(), plate_why="", identity="named_traditional_dish",
      arb="", variants=(), sources=()):
    """ing : liste de « Forme|quantité|unité|rôle » (suffixe |opt pour optionnel)."""
    ingredients = []
    for spec in ing:
        parts = spec.split("|")
        ingredients.append({
            "form": parts[0], "quantity": float(parts[1]) if "." in parts[1] else int(parts[1]),
            "unit": parts[2], "role": parts[3], "optional": len(parts) > 4,
        })
    return {
        "code": code, "family": family, "cuisine_origin": cuisine,
        "identity_level": identity, "category": category, "status": "candidate",
        "confidence": "B", "servings": servings, "prep_minutes": prep,
        "cook_minutes": cook, "difficulty": diff,
        "sources": list(sources) or ["myko_canonical_v3"],
        "canonical_arbitration": arb or f"Version canonique retenue pour {family}.",
        "ingredients": ingredients,
        "steps": [{"n": i + 1, "instruction": s} for i, s in enumerate(steps)],
        "techniques": list(tech),
        "variants": list(variants) or ["Version simplifiée", "variante de saison"],
        "sensory": {
            "profile": profile,
            "scores": dict(zip(SCORES, [int(c) for c in sc])),
            "dominant_flavors": list(flavors), "aroma_families": list(aromas),
            "target_textures": list(textures), "signature_ingredients": list(sign),
            "identity_guardrails": list(guards),
        },
        "conservation": cons,
        "allergens": list(allerg),
        "plate": {"role": plate, "accepts": list(accepts),
                  "reason": plate_why or "rôle d'assiette déclaré par la recette"},
    }


def ecrire(recettes, chemin):
    json.dump({"recipes": recettes}, open(chemin, "w"), ensure_ascii=False, indent=1)
    print(f"{len(recettes)} recettes écrites dans {chemin}")
