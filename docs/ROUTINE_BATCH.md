# Routine claude.ai — « Myko · Batch déjeuners »

Cette Routine génère les **préparations à l'avance** (batch) pour les déjeuners de
la semaine, en écrivant directement dans Supabase. Elle est déclenchée par le
bouton **« Planifier le batch »** du planning (endpoint `POST /api/routine/generate-batch`).

## Branchement (une fois)
1. Sur **claude.ai → Routines**, crée une nouvelle Routine « Myko · Batch déjeuners ».
   Connecte le **même connecteur Supabase MCP** que la Routine de planning.
2. Récupère l'**URL de déclenchement** + le **token** de la Routine.
3. Dans **Vercel → Settings → Environment Variables**, ajoute :
   - `CLAUDE_ROUTINE_GENERATE_BATCH_URL` = l'URL de déclenchement
   - `CLAUDE_ROUTINE_GENERATE_BATCH_TOKEN` = le token
   Puis **redéploie**.
4. Le webhook reçoit un body `{ "user_id": "...", "import_id": <id?> }` : utilise
   `import_id` s'il est présent, sinon prends l'import le plus récent du `user_id`.

## Schéma (colonnes EXACTES — ne pas en inventer)
- `nutrition_plan_imports` : `id`, `user_id`, `date_range_start`, `date_range_end`
- `nutrition_plan_meals` : `id`, `import_id`, `person_name` ("Julien"/"Zoé"),
  `meal_date`, `meal_type` ('pdj'|'dejeuner'|'diner'|'collation'), `description`,
  `short_label`, `kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`,
  **`batch_recipe_id`** (→ nutrition_plan_batch_recipes.id ; nouveau)
- `nutrition_plan_batch_recipes` : `id`, `import_id`, `name`, **`cook_date`** (nouveau),
  **`portions_total`** int (nouveau), `ingredients` (texte ` · `-séparé), `macros_per_100g`
  (texte), `rendement` (texte), `portions` (texte), `reheat` (texte), `instructions` (texte)
- `nutrition_plan_prep_tasks` : `id`, `import_id`, `prep_date`, `prep_label`, `task`, `estimated_time`

## Instructions de la Routine (à coller)

> Tu es l'assistant batch-cooking de Myko. À chaque déclenchement tu prépares le
> « jour de cuisine » de la semaine, via le connecteur Supabase.
>
> But : l'utilisateur cuisine TOUT à l'avance (le dimanche) et **réchauffe** chaque
> déjeuner de la semaine. On **GARDE les plats variés** (un plat différent par jour) —
> on ne consolide PAS en 1-2 plats. Julien et Zoé mangent le **même plat** à chaque
> déjeuner (portions comptées séparément).
>
> 1. **Cible l'import** : `import_id` du body s'il est fourni, sinon l'import le plus
>    récent (`MAX(id)`) du `user_id`. Note `date_range_start`.
> 2. **Lis les déjeuners** : `SELECT id, person_name, meal_date, description, short_label,
>    kcal, protein_g, carbs_g, fat_g, fiber_g FROM nutrition_plan_meals WHERE
>    import_id = <id> AND meal_type = 'dejeuner' AND meal_date BETWEEN <lundi> AND <vendredi>`.
> 3. **Idempotence** (avant de recréer) :
>    `UPDATE nutrition_plan_meals SET batch_recipe_id = NULL WHERE import_id = <id>;`
>    `DELETE FROM nutrition_plan_prep_tasks WHERE import_id = <id>;`
>    `DELETE FROM nutrition_plan_batch_recipes WHERE import_id = <id>;`
> 4. **Jour de cuisine** `cook_date` = le **dimanche** précédant le lundi de la semaine.
> 5. **Regroupe les déjeuners par PLAT** (par `short_label` ou nom normalisé ; Julien+Zoé
>    du même jour = le même plat). Pour CHAQUE plat distinct :
>    - `portions_total` = nombre de portions de déjeuner couvertes (Julien+Zoé un jour = 2 ;
>      s'il revient sur 2 jours = 4) ;
>    - compose la recette à l'échelle `portions_total` : ingrédients agrégés avec quantités
>      (` · `-séparé, ex. « 600g blanc de poulet · 300g riz · 200g brocoli »), étapes de
>      cuisson, conseil de réchauffage adapté (micro-ondes / poêle / four) ;
>    - `INSERT INTO nutrition_plan_batch_recipes (import_id, name, cook_date, portions_total,
>      ingredients, macros_per_100g, rendement, portions, reheat, instructions) … RETURNING id;`
>    - **relie les repas** : `UPDATE nutrition_plan_meals SET batch_recipe_id = <new id>
>      WHERE import_id = <id> AND meal_type='dejeuner' AND (short_label = '<plat>' OR
>      description ILIKE '%<plat>%') AND meal_date IN (<jours couverts>);`
> 6. **Check-list du jour de cuisine** : pour chaque plat, `INSERT INTO nutrition_plan_prep_tasks
>    (import_id, prep_date, prep_label, task, estimated_time) VALUES (<id>, '<cook_date>',
>    'Jour de cuisine', 'Cuisiner <plat> — <portions_total> portions, portionner en barquettes',
>    '<ex. 30 min>');` + une tâche finale « Étiqueter & ranger (frigo/congélo) ».
> 7. **Réponds en JSON** : `{ "import_id": <id>, "cook_date": "...", "batch_recipes": <n>,
>    "linked_meals": <n> }`.
>
> Règles : n'utilise QUE les colonnes listées, ne touche QUE l'import ciblé, quantités
> réalistes, réchauffage adapté au plat.
