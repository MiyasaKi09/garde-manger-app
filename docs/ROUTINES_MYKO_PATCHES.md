# Patches des Routines claude.ai — re-planning dynamique & restes

L'app envoie désormais à la Routine planning :
- un **webhook body** enrichi : `{ user_id, context, output_requirements }` ;
- des requêtes `plan_regen_requests` avec **target_meals** (créneaux précis) et
  des `user_instructions` structurées contenant : `CRÉNEAUX DÉJÀ MANGÉS — NE PAS
  MODIFIER`, `BUDGET RESTANT AUJOURD'HUI`, et éventuellement `REPAS FIXÉ PAR
  L'UTILISATEUR` (improvisation type « bolognaise ce soir »).

Les blocs ci-dessous sont à COLLER dans les prompts existants.

---

## 1. Routine « Génération / Régénération de planning » (v4.0 → v4.1)

### 1a. CP0 — après le point b), ajouter :

```
b-bis) CONTEXTE DU DÉCLENCHEUR : si le body du webhook contient `context`
   et/ou `output_requirements`, lis-les intégralement. Ils contiennent :
   restes à placer, contraintes alimentaires strictes, profil de goûts,
   écarts nutritionnels récents, micros < 70 % AJR, produits ⚠️ DLC.
   Ces informations PRIMENT sur tes valeurs par défaut (sauf les INTERDITS
   du CP2 qui restent absolus).

g) RESTES À PLACER (avant toute génération) :
   SELECT id, name, portions_remaining, expiration_date,
          kcal_per_portion, protein_g_per_portion, carbs_g_per_portion,
          fat_g_per_portion, fiber_g_per_portion
   FROM cooked_dishes
   WHERE user_id = '9055926b-ed29-49f1-96b8-fc717973b333'
     AND portions_remaining > 0
     AND consumed_completely_at IS NULL
     AND expiration_date >= CURRENT_DATE
   ORDER BY expiration_date;

   RÈGLE RESTES : chaque plat listé doit être consommé AVANT sa
   expiration_date. Affecte-le aux PREMIERS créneaux à générer compatibles
   (déjeuner ou dîner), à raison de 2 portions par créneau (Julien+Zoé)
   tant qu'il reste des portions :
   - description = 'Restes — <name>' (préfixe EXACT « Restes — ») ;
   - short_label = '<name>' tronqué ;
   - kcal/macros = valeurs *_per_portion du plat (arrondies comme d'habitude) ;
     si NULL, estime-les depuis le nom du plat ;
   - PAS de fiche generated_recipes pour ces créneaux ;
   - PAS d'ingrédients en liste de courses pour ces créneaux ;
   - ne décrémente PAS portions_remaining (l'app le fait quand c'est mangé).
```

### 1b. CP1-REGEN — remplacer la 1re ligne du bloc target_meals par :

```
Si target_meals IS NOT NULL (repas spécifiques — c'est le mode du
RE-PLANNING DYNAMIQUE déclenché par l'app) :
  Les user_instructions peuvent contenir :
  - « CRÉNEAUX DÉJÀ MANGÉS — NE PAS MODIFIER : ... » → ces créneaux ne sont
    JAMAIS dans target_meals ; n'y touche pas, ne les régénère pas, mais
    tiens compte de ce qui a été mangé pour l'équilibre du jour.
  - « BUDGET RESTANT AUJOURD'HUI : ... » → pour les repas d'AUJOURD'HUI dans
    target_meals, utilise CES bornes (kcal/prot restants par personne) au
    lieu des bornes typologiques standard du CP2.1. Les bornes standard
    s'appliquent aux jours suivants.
  - « REPAS FIXÉ PAR L'UTILISATEUR : <date> <type> = "<plat>" » → ce créneau
    reçoit EXACTEMENT ce plat (description fidèle au souhait, short_label
    dérivé, macros calculées de façon réaliste pour 2 portions maison).
    INTERDIT de le remplacer par autre chose. Ajuste les AUTRES repas du
    jour pour que la journée reste dans les bornes.
```

### 1c. CP4.a — remplacer la ligne « Courses » par :

```
a) Courses : nutrition_plan_shopping_items (import_id, week_label, category,
   product_name, quantity, checked=FALSE).
   - NE SUPPRIME PAS les lignes checked=TRUE : elles sont déjà achetées et
     rangées au stock (l'app y a attaché les lots créés). Supprime puis
     recrée UNIQUEMENT les lignes checked=FALSE.
   - Les créneaux « Restes — ... » ne génèrent AUCUN article.
   - Stock sert uniquement à ajuster les quantités. Produit transformé ≠
     ingrédient brut.
```

---

## 2. Routine « Batch déjeuners » (ajustements)

### 2a. À l'étape 2 (lecture des déjeuners), remplacer la requête par :

```
SELECT id, person_name, meal_date, description, short_label, kcal,
       protein_g, carbs_g, fat_g, fiber_g
FROM nutrition_plan_meals
WHERE import_id = <id>
  AND meal_type = 'dejeuner'
  AND meal_date BETWEEN GREATEST(<lundi>, CURRENT_DATE) AND <vendredi>
  AND description NOT ILIKE 'Restes —%';
```
(— les déjeuners « Restes — ... » sont déjà cuisinés : aucun batch à prévoir ;
— les déjeuners passés ne sont plus à batcher si la routine tourne en cours de semaine.)

### 2b. À l'étape 3 (idempotence), remplacer le DELETE des batch_recipes par :

```
UPDATE nutrition_plan_meals SET batch_recipe_id = NULL WHERE import_id = <id>
  AND meal_date >= CURRENT_DATE;
DELETE FROM nutrition_plan_prep_tasks WHERE import_id = <id>
  AND prep_date >= CURRENT_DATE;
DELETE FROM nutrition_plan_batch_recipes br WHERE br.import_id = <id>
  AND NOT EXISTS (SELECT 1 FROM cooked_dishes cd WHERE cd.batch_recipe_id = br.id);
```
(— ne jamais supprimer une préparation déjà cuisinée : cooked_dishes la
référence pour le décompte des portions.)

---

## 3. Rappels côté app (déjà en place, rien à faire)

- `POST /api/routine/replan-week` compose la requête : target_meals =
  créneaux restants (validés exclus), user_instructions structurées,
  webhook = même URL/token que la génération.
- Le suivi se fait par polling de `plan_regen_requests.status` (page planning).
- Quand un reste est mangé via l'app, `portions_remaining` est décrémenté et
  la nutrition est loguée dans meal_log avec les valeurs par portion.
