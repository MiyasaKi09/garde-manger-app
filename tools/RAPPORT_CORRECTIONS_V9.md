# RAPPORT DES CORRECTIONS V9

## Résumé

**22 ingrédients reclassifiés** pour respecter la règle fondamentale :
- **CANONICAL** = aliment brut, naturel, non transformé
- **ARCHETYPE** = toute transformation (fermentation, séchage, distillation, torréfaction, broyage, extraction, cuisson)

## Statistiques finales

| Métrique | V9 initial | V9 corrigé | Différence |
|----------|-----------|------------|------------|
| **Canonical** | 76 | **57** | -19 |
| **Archetypes** | 139 | **158** | +19 |
| **Existants** | 164 | 164 | = |
| **Ignorés** | 17 | 17 | = |
| **Non mappés** | 0 | **0** | ✅ |

## Corrections appliquées

### 1. Alcools et boissons fermentées (CANONICAL → ARCHETYPE)

| Ingrédient | Raison |
|-----------|---------|
| vin blanc (11x) | Fermentation du raisin |
| vin rouge (3x) | Fermentation du raisin |
| xérès (1x) | Vin fortifié (alcool ajouté) |
| madère (1x) | Vin fortifié |
| cidre (1x) | Fermentation de pommes |
| bière (1x) | Fermentation de céréales |
| cognac (3x) | Eau-de-vie distillée |
| calvados (1x) | Eau-de-vie distillée |
| rhum (3x) | Alcool distillé de canne |
| amaretto (1x) | Liqueur distillée |
| saké (1x) | Alcool de riz fermenté |
| mirin (5x) | Vin de riz fermenté |

**Justification** : La fermentation et la distillation sont des processus de transformation complexes.

### 2. Fruits séchés (CANONICAL → ARCHETYPE)

| Ingrédient | Raison |
|-----------|---------|
| pruneau (1x) | Prune séchée (déshydratation) |
| raisin sec (1x) | Raisin séché |
| abricot sec (1x) | Abricot séché |

**Justification** : Le séchage est une transformation qui concentre les sucres et modifie la structure.

### 3. Sucre et chocolat (CANONICAL → ARCHETYPE)

| Ingrédient | Raison |
|-----------|---------|
| sucre glace (4x) | Sucre broyé finement |
| chocolat noir (3x) | Fève de cacao torréfiée et transformée |
| pépite de chocolat (1x) | Chocolat solidifié |

**Justification** : Broyage (sucre glace) et torréfaction/transformation (chocolat) sont des processus industriels.

### 4. Épices et condiments (CANONICAL → ARCHETYPE)

| Ingrédient | Raison |
|-----------|---------|
| girofle (2x) | Bouton de fleur séché |
| nuoc mam (1x) | Sauce poisson fermentée |
| sirop d'agave (2x) | Sève concentrée et cuite |

**Justification** : Séchage (girofle), fermentation (nuoc mam), concentration par cuisson (sirop agave).

### 5. Café (CANONICAL → ARCHETYPE)

| Ingrédient | Raison |
|-----------|---------|
| café (1x) | Grain torréfié et moulu |

**Justification** : Le café nécessite torréfaction (chaleur) puis broyage.

### 6. Viandes (ARCHETYPE → CANONICAL)

| Ingrédient | Raison |
|-----------|---------|
| blanc de poulet (1x) | Partie naturelle du poulet (simple découpe) |
| magret de canard (1x) | Découpe simple (pas de cuisson/transformation) |

**Justification** : Une simple découpe anatomique ne constitue pas une transformation. Le blanc de poulet reste de la viande brute.

## Validation

✅ **Toutes les corrections ont été vérifiées** dans le fichier `INSERT_INGREDIENTS_FINAL_V9.sql` :
- Blanc de poulet : dans section CANONICAL
- Chocolat noir, vins, alcools, fruits secs, girofle, sucre glace, café : dans section ARCHETYPE

## Fichier final

📄 **`INSERT_INGREDIENTS_FINAL_V9.sql`**
- **57 CANONICAL** (aliments bruts)
- **158 ARCHETYPES** (transformés)
- **0 NON MAPPÉS** ✅
- Prêt pour exécution sur Supabase
