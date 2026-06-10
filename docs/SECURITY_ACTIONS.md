# Actions de sécurité restantes — à exécuter par le propriétaire du dépôt

Ces deux actions ne peuvent pas être faites depuis une session de code :
la première exige le compte Pexels, la seconde réécrit l'historique publié
de `main` (force-push destructif à coordonner).

## 1. Révoquer la clé Pexels (5 min)

La clé `PEXELS_API_KEY` a été commitée dans `.env.production` (retiré du
suivi git depuis, mais la valeur reste dans l'HISTORIQUE git).

1. https://www.pexels.com/api/ → régénérer la clé.
2. Mettre la nouvelle valeur dans Vercel (env `PEXELS_API_KEY`) et dans le
   `.env.production` local (non tracké).

## 2. Purger l'historique git des données personnelles (15 min)

L'historique contient : la clé Pexels, des CSV de données de santé
(poids, objectifs, repas) et des xlsx de plannings personnels.

⚠️ Réécrit TOUT l'historique : les clones existants devront être re-clonés.
À faire de préférence juste après le merge de la PR en cours.

```bash
pip install git-filter-repo   # ou brew install git-filter-repo

git clone --mirror git@github.com:MiyasaKi09/garde-manger-app.git myko-mirror
cd myko-mirror

git filter-repo \
  --invert-paths \
  --path .env.production \
  --path "plan mars 2026.xlsx" \
  --path "plan repas avril 2026.xlsx" \
  --path data-csv.zip \
  --path backups/ \
  --path supabase/exports/latest/csv/weight_entries.csv \
  --path supabase/exports/latest/csv/user_health_goals.csv \
  --path supabase/exports/latest/csv/user_allergies.csv \
  --path supabase/exports/latest/csv/user_diets.csv \
  --path supabase/exports/latest/csv/user_profiles.csv \
  --path supabase/exports/latest/csv/user_recipe_interactions.csv \
  --path supabase/exports/latest/csv/meal_log.csv \
  --path supabase/exports/latest/csv/inventory_lots.csv \
  --path supabase/exports/latest/csv/generated_recipes.csv \
  --path supabase/exports/latest/csv/generated_recipe_ingredients.csv \
  --path supabase/exports/latest/csv/legacy_users.csv \
  --path supabase/exports/latest/csv/plan_regen_requests.csv \
  --path supabase/exports/latest/csv/cooked_dishes.csv \
  --path supabase/exports/latest/csv/cooked_dish_ingredients.csv \
  --path supabase/exports/latest/csv/pantry_items.csv \
  --path supabase/exports/latest/csv/planned_meals.csv \
  --path supabase/exports/latest/csv/meal_plans.csv \
  --path-glob 'supabase/exports/latest/csv/nutrition_plan_*.csv'

git push --force --mirror git@github.com:MiyasaKi09/garde-manger-app.git
```

Puis sur chaque machine locale : re-cloner (ne pas pull par-dessus).

## Déjà fait (sessions de juin 2026)

- `.env.production` retiré du suivi git, `.gitignore` complété.
- Export CI restreint aux tables de référence (plus aucune donnée
  personnelle ne repart dans le dépôt).
- Routes API toutes authentifiées, RLS vérifiée, middleware protecteur.
