# SQL FINAL - Insertion des ingrédients manquants

## 📄 Fichier généré
`insert_missing_ingredients_FINAL.sql`

## 📊 Contenu
- **260 canonical_foods** (aliments de base au singulier)
- **52 archetypes** (transformations, épices, préparations)
- **0 sous-recettes** (à créer séparément - voir liste ci-dessous)

## ✅ Corrections appliquées

### 1. Tout au singulier
- ✅ `beurre` (pas "beurres")
- ✅ `carotte` (pas "carottes")
- ✅ `gousse d'ail` (pas "gousses d'ail")
- ✅ `oignon` (pas "oignons")
- ✅ `tomate` (pas "tomates")

### 2. Épices = Archetypes
- ✅ `cumin` → archetype
- ✅ `cannelle` → archetype
- ✅ `paprika` → archetype
- ✅ Toutes les épices moulues/en poudre → archetypes

### 3. Adjectifs précis retirés
- ✅ `tomates mûres` → `tomate`
- ✅ Qualificatifs retirés (mûr, jeune, tendre, bio, gros, petit)

### 4. Préparations = Archetypes
- ✅ `huile d'olive` → archetype
- ✅ `crème fraîche` → archetype
- ✅ `beurre salé` → archetype
- ✅ Tous les produits transformés → archetypes

## 🚀 Exécution

```bash
# Depuis le dossier tools/
PGPASSWORD='votre_password' psql "$DATABASE_URL_TX" -f insert_missing_ingredients_FINAL.sql
```

Ou avec la variable d'environnement depuis .env.local :

```bash
set -a
source ../.env.local
set +a
PGPASSWORD="${DATABASE_URL_TX##*:}" psql "$DATABASE_URL_TX" -f insert_missing_ingredients_FINAL.sql
```

## ⚠️ TODO après insertion

### Archetypes à lier
Certains archetypes ont un `TODO` car ils nécessitent de lier le `canonical_food_id`.
Exemples :
- `huile d'olive` → lier à canonical_food "huile"
- `cumin` → créer canonical_food "cumin" si nécessaire
- `crème fraîche` → lier à canonical_food "crème"

### Sous-recettes à créer (11)
Ces ingrédients doivent être créés comme **recettes** dans la table `recipes` :

1. **bouillon de boeuf** (utilisé 5x)
2. **pâte feuilletée** (utilisé 4x)
3. **bouillon de légume** (utilisé 2x)
4. **sauce tomate** (utilisé 2x)
5. **haricot blancs sauce tomate** (utilisé 1x)
6. **pâte brisée** (utilisé 1x)
7. **pâte à pizza** (utilisé 1x)
8. **confit de canard** (utilisé 1x)
9. **ganache ou crème** (utilisé 1x)
10. **sucre pour caramel** (utilisé 1x)
11. **ganache chocolat** (utilisé 1x)

Ces sous-recettes seront référencées via `sub_recipe_id` dans `recipe_ingredients`.

## 📝 Prochaines étapes

1. ✅ Exécuter `insert_missing_ingredients_FINAL.sql`
2. ⏭️ Créer les 11 sous-recettes dans la table `recipes`
3. ⏭️ Compléter les `canonical_food_id` pour les archetypes avec TODO
4. ⏭️ Générer et exécuter le SQL pour `recipe_ingredients`
