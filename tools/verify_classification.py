# Vérification des classifications douteuses

PROBLEMES_POTENTIELS = {
    # CANONICAL qui devraient être ARCHETYPE
    'girofle': 'ARCHETYPE - clou séché (girofle)',
    'sucre glace': 'ARCHETYPE - sucre broyé',
    'raisin sec': 'ARCHETYPE - fruit séché',
    'pruneau': 'ARCHETYPE - prune séchée',
    'nuoc mam': 'ARCHETYPE - sauce fermentée',
    'mirin': 'ARCHETYPE - vin de riz fermenté',
    'saké': 'ARCHETYPE - alcool fermenté',
    'amaretto': 'ARCHETYPE - liqueur distillée',
    'calvados': 'ARCHETYPE - eau-de-vie distillée',
    'cognac': 'ARCHETYPE - eau-de-vie distillée',
    'rhum': 'ARCHETYPE - alcool distillé',
    'xérès': 'ARCHETYPE - vin fortifié',
    'madère': 'ARCHETYPE - vin fortifié',
    'vin blanc': 'ARCHETYPE - fermenté',
    'vin rouge': 'ARCHETYPE - fermenté',
    'cidre': 'ARCHETYPE - fermenté',
    'bière': 'ARCHETYPE - fermenté',
    'chocolat noir': 'ARCHETYPE - fève torréfiée et transformée',
    'sirop d\'agave': 'ARCHETYPE - sève concentrée/cuite',
    'café': 'ARCHETYPE - grain torréfié',
    
    # ARCHETYPE qui devraient être CANONICAL
    'blanc de poulet': 'CANONICAL - partie naturelle (pas de transformation)',
    'magret de canard': 'CANONICAL - découpe simple (pas de cuisson)',
}

print("=== INGRÉDIENTS À CORRIGER ===\n")
for ing, raison in PROBLEMES_POTENTIELS.items():
    print(f"• {ing:30s} → {raison}")

print(f"\nTotal: {len(PROBLEMES_POTENTIELS)} corrections nécessaires")
