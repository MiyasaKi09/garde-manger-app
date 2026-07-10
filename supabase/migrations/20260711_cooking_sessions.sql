-- ============================================================================
-- Migration : 20260711_cooking_sessions.sql
-- Vague 1 — Couche base de données : sessions de cuisine + journal de stock
-- ============================================================================
--
-- Objets créés/modifiés :
--   Tables nouvelles  : cooking_sessions
--                       cooking_session_ingredients
--                       inventory_movements        (journal immuable)
--   Colonnes ajoutées : cooked_dishes.generated_recipe_id  (bigint FK)
--                       cooked_dishes.cooking_session_id   (uuid FK)
--                       meal_log.cooking_session_id        (uuid FK)
--   Contrainte        : cooked_dishes_at_most_one_recipe_source (CHECK NOT VALID)
--   Fonctions PL/pgSQL:
--       public.commit_cooking_session(p jsonb)  → jsonb
--       public.undo_cooking_session(p_session_id uuid) → jsonb
--       public.replace_generated_recipe_ingredients(p_recipe_id bigint, p_rows jsonb) → int
--
-- Idempotence :
--   CREATE TABLE IF NOT EXISTS
--   ADD COLUMN IF NOT EXISTS
--   CREATE OR REPLACE FUNCTION
--   DO-block guards sur toutes les policies RLS et sur la contrainte CHECK
-- ============================================================================


-- ============================================================================
-- 1. TABLE cooking_sessions
--    Trace le cycle complet d'une session de cuisine :
--    draft (ouverture wizard) → committed (validation) → undone (annulation).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cooking_sessions (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Propriétaire — auth.uid() injecté automatiquement ; CASCADE si l'utilisateur est supprimé
    user_id             UUID        NOT NULL DEFAULT auth.uid()
                                    REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Source de la recette : catalogue classique / IA / improvisée
    recipe_source       TEXT        CHECK (recipe_source IN ('curated', 'ai', 'libre')),

    -- recipe_id : recette du catalogue (INTEGER — recipes.id est serial int)
    recipe_id           INTEGER     REFERENCES public.recipes(id) ON DELETE SET NULL,

    -- generated_recipe_id : recette IA (BIGINT — generated_recipes.id est bigserial)
    generated_recipe_id BIGINT      REFERENCES public.generated_recipes(id) ON DELETE SET NULL,

    planned_servings    INTEGER,
    actual_servings     INTEGER,
    portions_eaten      INTEGER,
    portions_left       INTEGER,
    meal_date           DATE,
    meal_type           TEXT,
    storage_method      TEXT,

    status              TEXT        NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft', 'committed', 'undone')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    committed_at        TIMESTAMPTZ
);

-- Index composite pour les requêtes filtrées par utilisateur + statut
CREATE INDEX IF NOT EXISTS idx_cooking_sessions_user_status
    ON public.cooking_sessions (user_id, status);

-- ----------------------------------------------------------------------------
-- RLS cooking_sessions — 4 policies per-utilisateur
-- USING     : filtre les lignes retournées (SELECT, UPDATE, DELETE)
-- WITH CHECK : valide les lignes insérées/modifiées (INSERT, UPDATE)
-- ----------------------------------------------------------------------------
ALTER TABLE public.cooking_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_sessions'
      AND policyname = 'cs_select_own'
  ) THEN
    CREATE POLICY cs_select_own ON public.cooking_sessions
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_sessions'
      AND policyname = 'cs_insert_own'
  ) THEN
    -- WITH CHECK seul : on ne peut créer que ses propres sessions
    CREATE POLICY cs_insert_own ON public.cooking_sessions
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_sessions'
      AND policyname = 'cs_update_own'
  ) THEN
    -- USING + WITH CHECK : on ne peut lire/modifier que ses propres sessions
    CREATE POLICY cs_update_own ON public.cooking_sessions
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_sessions'
      AND policyname = 'cs_delete_own'
  ) THEN
    -- USING seul : on ne peut supprimer que ses propres sessions
    CREATE POLICY cs_delete_own ON public.cooking_sessions
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;


-- ============================================================================
-- 2. TABLE cooking_session_ingredients
--    Détail des ingrédients utilisés (ou non) lors d'une session.
--    Remplace/complète cooked_dish_ingredients avec support multi-lots,
--    substitutions, skips et ingrédients extra.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cooking_session_ingredients (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

    -- FK CASCADE : on supprime les ingrédients si la session est supprimée
    session_id          UUID        NOT NULL
                                    REFERENCES public.cooking_sessions(id) ON DELETE CASCADE,

    -- Ingrédient planifié (issu de la recette, rescalé)
    planned_name        TEXT,
    planned_entity_type TEXT,       -- 'canonical_food' | 'archetype' | null
    planned_entity_id   BIGINT,     -- bigint pour couvrir canonical_foods et archetypes
    planned_quantity    NUMERIC,
    planned_unit        TEXT,

    -- Action réellement réalisée par l'utilisateur
    actual_action       TEXT        DEFAULT 'used'
                                    CHECK (actual_action IN ('used', 'substituted', 'skipped', 'extra')),
    actual_entity_type  TEXT,
    actual_entity_id    BIGINT,
    actual_quantity     NUMERIC,
    actual_unit         TEXT,

    -- Source : stock interne ou externe (hors garde-manger)
    source              TEXT        DEFAULT 'inventory'
                                    CHECK (source IN ('inventory', 'external')),

    -- Allocations multi-lots : [{lot_id: uuid, qty: numeric}, ...]
    lot_allocations     JSONB       NOT NULL DEFAULT '[]',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csi_session_id
    ON public.cooking_session_ingredients (session_id);

-- ----------------------------------------------------------------------------
-- RLS cooking_session_ingredients
-- Ownership vérifiée via EXISTS sur cooking_sessions (pas de user_id direct).
-- USING     : l'utilisateur voit ses propres ingrédients de session
-- WITH CHECK : il ne peut créer que sur ses propres sessions
-- ----------------------------------------------------------------------------
ALTER TABLE public.cooking_session_ingredients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_session_ingredients'
      AND policyname = 'csi_select_own'
  ) THEN
    CREATE POLICY csi_select_own ON public.cooking_session_ingredients
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.cooking_sessions cs
          WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_session_ingredients'
      AND policyname = 'csi_insert_own'
  ) THEN
    CREATE POLICY csi_insert_own ON public.cooking_session_ingredients
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.cooking_sessions cs
          WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_session_ingredients'
      AND policyname = 'csi_update_own'
  ) THEN
    CREATE POLICY csi_update_own ON public.cooking_session_ingredients
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.cooking_sessions cs
          WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.cooking_sessions cs
          WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cooking_session_ingredients'
      AND policyname = 'csi_delete_own'
  ) THEN
    CREATE POLICY csi_delete_own ON public.cooking_session_ingredients
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.cooking_sessions cs
          WHERE cs.id = session_id AND cs.user_id = (SELECT auth.uid())
        )
      );
  END IF;
END $$;


-- ============================================================================
-- 3. TABLE inventory_movements — journal immuable des mouvements de stock
--    Alimenté par commit_cooking_session (type='consumption') et
--    undo_cooking_session (type='restore').
--    Intentionnellement PAS de policy UPDATE ni DELETE côté RLS.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Propriétaire — CASCADE si l'utilisateur est supprimé
    user_id         UUID        NOT NULL DEFAULT auth.uid()
                                REFERENCES auth.users(id) ON DELETE CASCADE,

    -- lot_id SET NULL : le mouvement reste si le lot est supprimé (historique conservé)
    lot_id          UUID        REFERENCES public.inventory_lots(id) ON DELETE SET NULL,

    -- session_id SET NULL : le mouvement reste si la session est supprimée
    session_id      UUID        REFERENCES public.cooking_sessions(id) ON DELETE SET NULL,

    movement_type   TEXT        NOT NULL
                                CHECK (movement_type IN (
                                  'purchase',       -- entrée manuelle
                                  'consumption',    -- déduction par commit_cooking_session
                                  'correction',     -- correction manuelle
                                  'restore',        -- restauration par undo_cooking_session
                                  'waste'           -- gaspillage enregistré
                                )),

    quantity_before NUMERIC,                    -- qty_remaining avant le mouvement
    quantity_delta  NUMERIC     NOT NULL,       -- négatif = sortie ; positif = entrée
    quantity_after  NUMERIC,                    -- qty_remaining après le mouvement
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index principal : requêtes par utilisateur triées chronologiquement
CREATE INDEX IF NOT EXISTS idx_inv_mov_user_created_at
    ON public.inventory_movements (user_id, created_at DESC);

-- Index pour retrouver tous les mouvements d'un lot (ex : historique de lot)
CREATE INDEX IF NOT EXISTS idx_inv_mov_lot_id
    ON public.inventory_movements (lot_id)
    WHERE lot_id IS NOT NULL;

-- Index pour retrouver les mouvements d'une session (ex : undo)
CREATE INDEX IF NOT EXISTS idx_inv_mov_session_id
    ON public.inventory_movements (session_id)
    WHERE session_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- RLS inventory_movements
-- SELECT et INSERT uniquement — journal immuable : pas de policy UPDATE/DELETE.
-- Les RPCs SECURITY INVOKER s'exécutent avec l'identité de l'utilisateur
-- et passent par im_insert_own pour les entrées 'restore'.
-- USING     : l'utilisateur lit ses propres mouvements
-- WITH CHECK : il ne peut créer que ses propres mouvements
-- ----------------------------------------------------------------------------
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_movements'
      AND policyname = 'im_select_own'
  ) THEN
    CREATE POLICY im_select_own ON public.inventory_movements
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_movements'
      AND policyname = 'im_insert_own'
  ) THEN
    CREATE POLICY im_insert_own ON public.inventory_movements
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- Intentionnellement : aucune policy UPDATE ni DELETE.
-- Le journal est permanent pour l'audit, le undo et les statistiques.


-- ============================================================================
-- 4. ALTER TABLE cooked_dishes — nouvelles colonnes de Vague 1
-- ============================================================================

-- generated_recipe_id : lien vers la recette IA source du plat
ALTER TABLE public.cooked_dishes
  ADD COLUMN IF NOT EXISTS generated_recipe_id BIGINT
    REFERENCES public.generated_recipes(id) ON DELETE SET NULL;

-- cooking_session_id : lien vers la session qui a créé ce plat
--   Utilisé par undo_cooking_session pour identifier et supprimer le plat.
ALTER TABLE public.cooked_dishes
  ADD COLUMN IF NOT EXISTS cooking_session_id UUID
    REFERENCES public.cooking_sessions(id) ON DELETE SET NULL;

-- Contrainte : au plus l'un de recipe_id OU generated_recipe_id peut être non nul.
-- NOT VALID : on ne scanne pas les lignes existantes (historique antérieur sans
-- generated_recipe_id ne doit pas bloquer la migration). La contrainte s'applique
-- à toutes les insertions et mises à jour ultérieures.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.cooked_dishes'::regclass
      AND conname   = 'cooked_dishes_at_most_one_recipe_source'
  ) THEN
    ALTER TABLE public.cooked_dishes
      ADD CONSTRAINT cooked_dishes_at_most_one_recipe_source
      CHECK (NOT (recipe_id IS NOT NULL AND generated_recipe_id IS NOT NULL))
      NOT VALID;
    -- NOT VALID : skip le scan de l'historique existant.
    -- Pour valider les lignes existantes après vérification manuelle :
    --   ALTER TABLE cooked_dishes VALIDATE CONSTRAINT cooked_dishes_at_most_one_recipe_source;
  END IF;
END $$;


-- ============================================================================
-- 5. ALTER TABLE meal_log — colonne cooking_session_id
--    Permet la suppression groupée des entrées lors d'un undo.
-- ============================================================================
ALTER TABLE public.meal_log
  ADD COLUMN IF NOT EXISTS cooking_session_id UUID
    REFERENCES public.cooking_sessions(id) ON DELETE SET NULL;


-- ============================================================================
-- 6. RPC commit_cooking_session(p jsonb) → jsonb
-- ============================================================================
-- Transaction unique (PL/pgSQL = 1 transaction PostgreSQL).
-- Séquence d'exécution, TOUT OU RIEN :
--   a) Verrou + validation de la session (existe, user_id = auth.uid(), status='draft')
--   b) Wipe + insert cooking_session_ingredients depuis p.ingredients
--   c) Pour chaque ingrédient source='inventory' et action IN ('used','substituted','extra') :
--        - Pour chaque allocation {lot_id, qty} :
--            SELECT … FOR UPDATE (verrou)
--            Vérification qty_remaining >= qty
--            UPDATE inventory_lots (keep row at 0 — undo en a besoin)
--            INSERT inventory_movements (type='consumption', delta=-qty)
--   d) Si portions_left > 0 : INSERT cooked_dishes (portions_remaining = portions_left)
--   e) Si meal_date + meal_type + persons[] : INSERT meal_log par personne
--        macros = per_portion × person.portions
--   f) UPDATE cooking_sessions → status='committed'
--   g) RETURN { success, cooked_dish_id, movements, meals_logged }
--
-- Contrat JSON d'entrée :
-- {
--   "session_id": "uuid",
--   "actual_servings": int,
--   "portions_eaten": int,
--   "portions_left": int,
--   "meal_date": "YYYY-MM-DD" | null,
--   "meal_type": "pdj|dejeuner|diner|collation" | null,
--   "storage_method": "fridge|freezer|counter" | null,
--   "persons": [{"person_name": text, "portions": numeric}] | null,
--   "dish": {
--     "name": text,
--     "kcal_per_portion": numeric | null,
--     "protein_g_per_portion": numeric | null,
--     "carbs_g_per_portion": numeric | null,
--     "fat_g_per_portion": numeric | null,
--     "fiber_g_per_portion": numeric | null,
--     "expiration_date": "YYYY-MM-DD" | null
--   },
--   "ingredients": [{
--     "planned_name": text,
--     "planned_entity_type": text | null,
--     "planned_entity_id": bigint | null,
--     "planned_quantity": numeric | null,
--     "planned_unit": text | null,
--     "actual_action": "used|substituted|skipped|extra",
--     "actual_entity_type": text | null,
--     "actual_entity_id": bigint | null,
--     "actual_quantity": numeric | null,
--     "actual_unit": text | null,
--     "source": "inventory|external",
--     "allocations": [{"lot_id": "uuid", "qty": numeric}]
--   }]
-- }
-- ============================================================================
CREATE OR REPLACE FUNCTION public.commit_cooking_session(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_session_id        uuid;
  v_session           record;
  v_ingredient        jsonb;
  v_alloc             jsonb;
  v_lot_id            uuid;
  v_alloc_qty         numeric;
  v_lot_qty_before    numeric;
  v_lot_qty_after     numeric;
  v_cooked_dish_id    bigint;
  v_movements_count   int     := 0;
  v_meals_count       int     := 0;
  v_person            jsonb;
  v_person_portions   numeric;
  v_actual_servings   int;
  v_portions_eaten    int;
  v_portions_left     int;
  v_meal_date         date;
  v_meal_type         text;
  v_storage_method    text;
  v_dish_name         text;
  v_kcal_pp           numeric;   -- kcal par portion
  v_protein_pp        numeric;
  v_carbs_pp          numeric;
  v_fat_pp            numeric;
  v_fiber_pp          numeric;
  v_exp_date          date;
  v_ingr_action       text;
  v_ingr_source       text;
BEGIN
  -- ----------------------------------------------------------------
  -- a) Valider la session
  -- ----------------------------------------------------------------
  v_session_id := (p->>'session_id')::uuid;

  -- FOR UPDATE : verrou anti-double-commit concurrent
  SELECT * INTO v_session
    FROM public.cooking_sessions
   WHERE id      = v_session_id
     AND user_id = auth.uid()
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable ou non autorisée : %', v_session_id;
  END IF;

  IF v_session.status <> 'draft' THEN
    RAISE EXCEPTION
      'Session % : statut "%" invalide pour commit (attendu : draft)',
      v_session_id, v_session.status;
  END IF;

  -- ----------------------------------------------------------------
  -- Extraire les paramètres scalaires du payload
  -- ----------------------------------------------------------------
  v_actual_servings := (p->>'actual_servings')::int;
  v_portions_eaten  := (p->>'portions_eaten')::int;
  v_portions_left   := (p->>'portions_left')::int;
  v_meal_date       := (p->>'meal_date')::date;
  v_meal_type       := p->>'meal_type';
  v_storage_method  := p->>'storage_method';

  v_dish_name   := p->'dish'->>'name';
  v_kcal_pp     := (p->'dish'->>'kcal_per_portion')::numeric;
  v_protein_pp  := (p->'dish'->>'protein_g_per_portion')::numeric;
  v_carbs_pp    := (p->'dish'->>'carbs_g_per_portion')::numeric;
  v_fat_pp      := (p->'dish'->>'fat_g_per_portion')::numeric;
  v_fiber_pp    := (p->'dish'->>'fiber_g_per_portion')::numeric;
  v_exp_date    := (p->'dish'->>'expiration_date')::date;

  -- ----------------------------------------------------------------
  -- b) Wipe + insert cooking_session_ingredients
  -- c) Déduction des lots pour les ingrédients du stock
  --    (combinés dans la même boucle pour éviter deux passes)
  -- ----------------------------------------------------------------
  DELETE FROM public.cooking_session_ingredients
   WHERE session_id = v_session_id;

  FOR v_ingredient IN
    SELECT * FROM jsonb_array_elements(COALESCE(p->'ingredients', '[]'::jsonb))
  LOOP
    v_ingr_action := COALESCE(v_ingredient->>'actual_action', 'used');
    v_ingr_source := COALESCE(v_ingredient->>'source', 'inventory');

    INSERT INTO public.cooking_session_ingredients (
      session_id,
      planned_name,
      planned_entity_type,
      planned_entity_id,
      planned_quantity,
      planned_unit,
      actual_action,
      actual_entity_type,
      actual_entity_id,
      actual_quantity,
      actual_unit,
      source,
      lot_allocations
    ) VALUES (
      v_session_id,
      v_ingredient->>'planned_name',
      v_ingredient->>'planned_entity_type',
      (v_ingredient->>'planned_entity_id')::bigint,
      (v_ingredient->>'planned_quantity')::numeric,
      v_ingredient->>'planned_unit',
      v_ingr_action,
      v_ingredient->>'actual_entity_type',
      (v_ingredient->>'actual_entity_id')::bigint,
      (v_ingredient->>'actual_quantity')::numeric,
      v_ingredient->>'actual_unit',
      v_ingr_source,
      COALESCE(v_ingredient->'allocations', '[]'::jsonb)
    );

    -- Déduire les lots uniquement pour les ingrédients issus du stock
    -- et dont l'action implique une consommation réelle
    IF v_ingr_source = 'inventory'
       AND v_ingr_action IN ('used', 'substituted', 'extra')
    THEN
      FOR v_alloc IN
        SELECT * FROM jsonb_array_elements(
          COALESCE(v_ingredient->'allocations', '[]'::jsonb)
        )
      LOOP
        v_lot_id    := (v_alloc->>'lot_id')::uuid;
        v_alloc_qty := (v_alloc->>'qty')::numeric;

        IF v_lot_id IS NULL OR v_alloc_qty IS NULL OR v_alloc_qty <= 0 THEN
          RAISE EXCEPTION
            'Allocation invalide : lot_id=% qty=%', v_lot_id, v_alloc_qty;
        END IF;

        -- Verrou de ligne + vérification propriété (user_id = auth.uid())
        SELECT qty_remaining INTO v_lot_qty_before
          FROM public.inventory_lots
         WHERE id      = v_lot_id
           AND user_id = auth.uid()
           FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Lot introuvable ou non autorisé : %', v_lot_id;
        END IF;

        IF v_lot_qty_before < v_alloc_qty THEN
          RAISE EXCEPTION
            'Lot % insuffisant : disponible=% demandé=%',
            v_lot_id, v_lot_qty_before, v_alloc_qty;
        END IF;

        v_lot_qty_after := v_lot_qty_before - v_alloc_qty;

        -- Mise à jour du lot.
        -- IMPORTANT : on conserve la ligne même si qty_remaining = 0.
        -- La suppression du lot n'a pas lieu ici (contrairement à consume_lots_fefo).
        -- Le undo a besoin que le lot existe pour restaurer la quantité.
        UPDATE public.inventory_lots
           SET qty_remaining = v_lot_qty_after,
               updated_at    = now()
         WHERE id = v_lot_id;

        -- Entrée dans le journal immuable
        INSERT INTO public.inventory_movements (
          user_id,
          lot_id,
          session_id,
          movement_type,
          quantity_before,
          quantity_delta,      -- négatif = sortie de stock
          quantity_after
        ) VALUES (
          auth.uid(),
          v_lot_id,
          v_session_id,
          'consumption',
          v_lot_qty_before,
          -v_alloc_qty,
          v_lot_qty_after
        );

        v_movements_count := v_movements_count + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- ----------------------------------------------------------------
  -- d) Créer le plat cuisiné si des portions sont à conserver
  -- ----------------------------------------------------------------
  IF COALESCE(v_portions_left, 0) > 0 THEN
    INSERT INTO public.cooked_dishes (
      user_id,
      name,
      recipe_id,
      generated_recipe_id,
      cooking_session_id,
      portions_cooked,
      portions_remaining,
      storage_method,
      -- expiration_date NOT NULL dans cooked_dishes :
      -- défaut J+7 si l'utilisateur ne fournit pas de date
      expiration_date,
      kcal_per_portion,
      protein_g_per_portion,
      carbs_g_per_portion,
      fat_g_per_portion,
      fiber_g_per_portion
    ) VALUES (
      auth.uid(),
      v_dish_name,
      v_session.recipe_id,
      v_session.generated_recipe_id,
      v_session_id,
      v_actual_servings,
      v_portions_left,
      COALESCE(v_storage_method, 'fridge'),
      COALESCE(v_exp_date, CURRENT_DATE + INTERVAL '7 days'),
      v_kcal_pp,
      v_protein_pp,
      v_carbs_pp,
      v_fat_pp,
      v_fiber_pp
    )
    RETURNING id INTO v_cooked_dish_id;
  END IF;

  -- ----------------------------------------------------------------
  -- e) Journaliser les repas par personne
  --    Condition : meal_date ET meal_type ET persons[] non vide
  -- ----------------------------------------------------------------
  IF v_meal_date    IS NOT NULL
     AND v_meal_type IS NOT NULL
     AND p->'persons' IS NOT NULL
     AND jsonb_array_length(p->'persons') > 0
  THEN
    FOR v_person IN
      SELECT * FROM jsonb_array_elements(p->'persons')
    LOOP
      v_person_portions := COALESCE((v_person->>'portions')::numeric, 1);

      INSERT INTO public.meal_log (
        user_id,
        person_name,
        meal_date,
        meal_type,
        cooked_dish_id,
        recipe_id,
        description,
        portions_eaten,
        kcal,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
        cooking_session_id
      ) VALUES (
        auth.uid(),
        v_person->>'person_name',
        v_meal_date,
        v_meal_type,
        v_cooked_dish_id,       -- NULL si portions_left = 0 (aucun plat créé)
        v_session.recipe_id,    -- NULL pour recettes IA ou libres
        v_dish_name,
        v_person_portions,
        -- macros = valeur par portion × nombre de portions consommées par la personne
        CASE WHEN v_kcal_pp    IS NOT NULL THEN v_kcal_pp    * v_person_portions END,
        CASE WHEN v_protein_pp IS NOT NULL THEN v_protein_pp * v_person_portions END,
        CASE WHEN v_carbs_pp   IS NOT NULL THEN v_carbs_pp   * v_person_portions END,
        CASE WHEN v_fat_pp     IS NOT NULL THEN v_fat_pp     * v_person_portions END,
        CASE WHEN v_fiber_pp   IS NOT NULL THEN v_fiber_pp   * v_person_portions END,
        v_session_id
      );

      v_meals_count := v_meals_count + 1;
    END LOOP;
  END IF;

  -- ----------------------------------------------------------------
  -- f) Marquer la session comme commitée
  -- ----------------------------------------------------------------
  UPDATE public.cooking_sessions
     SET status          = 'committed',
         actual_servings = v_actual_servings,
         portions_eaten  = v_portions_eaten,
         portions_left   = v_portions_left,
         meal_date       = v_meal_date,
         meal_type       = v_meal_type,
         storage_method  = v_storage_method,
         committed_at    = now()
   WHERE id = v_session_id;

  -- ----------------------------------------------------------------
  -- g) Résultat
  -- ----------------------------------------------------------------
  RETURN jsonb_build_object(
    'success',        true,
    'cooked_dish_id', v_cooked_dish_id,  -- null si portions_left = 0
    'movements',      v_movements_count,
    'meals_logged',   v_meals_count
  );
END;
$$;


-- ============================================================================
-- 7. RPC undo_cooking_session(p_session_id uuid) → jsonb
-- ============================================================================
-- Annule une session commitée — TOUT OU RIEN.
-- Séquence :
--   a) Verrou + validation (existe, user_id = auth.uid(), status='committed')
--   b) Vérification fail-fast du plat cuisiné :
--        si portions_remaining < portions_attendues → EXCEPTION (correction manuelle)
--   c) Restauration des lots : pour chaque movement 'consumption' de la session :
--        UPDATE inventory_lots qty_remaining += qty_déduites
--        INSERT inventory_movements (type='restore', delta = +qty)
--        Skip défensif si le lot n'existe plus (ne devrait pas arriver dans ce flow)
--   d) Suppression des entrées meal_log liées à la session
--   e) Suppression du plat cuisiné (portions déjà vérifiées en b)
--   f) Session → status='undone'
--   g) RETURN { success, lots_restored, lots_skipped }
-- ============================================================================
CREATE OR REPLACE FUNCTION public.undo_cooking_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_session            record;
  v_movement           record;
  v_lot_qty_before     numeric;
  v_lot_qty_after      numeric;
  v_restore_count      int     := 0;
  v_skipped_count      int     := 0;
  v_cooked_dish        record;
  v_has_cooked_dish    boolean := false;
  v_expected_remaining numeric;
BEGIN
  -- ----------------------------------------------------------------
  -- a) Valider la session
  -- ----------------------------------------------------------------
  -- FOR UPDATE : verrou anti-double-undo concurrent
  SELECT * INTO v_session
    FROM public.cooking_sessions
   WHERE id      = p_session_id
     AND user_id = auth.uid()
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable ou non autorisée : %', p_session_id;
  END IF;

  IF v_session.status <> 'committed' THEN
    RAISE EXCEPTION
      'Session % : statut "%" invalide pour undo (attendu : committed)',
      p_session_id, v_session.status;
  END IF;

  -- ----------------------------------------------------------------
  -- b) Vérification fail-fast du plat cuisiné
  --    On échoue ICI avant de toucher les lots pour éviter un état partiel.
  -- ----------------------------------------------------------------
  SELECT * INTO v_cooked_dish
    FROM public.cooked_dishes
   WHERE cooking_session_id = p_session_id;

  v_has_cooked_dish := FOUND;

  IF v_has_cooked_dish THEN
    -- Portions attendues = ce qui a été mis de côté au commit
    -- = actual_servings - portions_eaten = portions_left
    v_expected_remaining :=
      v_cooked_dish.portions_cooked - COALESCE(v_session.portions_eaten, 0);

    IF v_cooked_dish.portions_remaining < v_expected_remaining THEN
      RAISE EXCEPTION
        'Des portions ont déjà été consommées — correction manuelle requise';
    END IF;
  END IF;

  -- ----------------------------------------------------------------
  -- c) Restaurer les lots depuis les mouvements 'consumption'
  -- ----------------------------------------------------------------
  FOR v_movement IN
    SELECT * FROM public.inventory_movements
     WHERE session_id    = p_session_id
       AND movement_type = 'consumption'
  LOOP
    -- Verrou sur le lot cible
    SELECT qty_remaining INTO v_lot_qty_before
      FROM public.inventory_lots
     WHERE id = v_movement.lot_id
       FOR UPDATE;

    IF NOT FOUND THEN
      -- Lot introuvable : suppression manuelle hors-flow.
      -- Ce cas ne devrait pas survenir (commit_cooking_session ne supprime jamais
      -- les lots) mais on le gère défensivement.
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- quantity_delta est négatif pour 'consumption' → son opposé = quantité à rendre
    v_lot_qty_after := v_lot_qty_before + (-v_movement.quantity_delta);

    UPDATE public.inventory_lots
       SET qty_remaining = v_lot_qty_after,
           updated_at    = now()
     WHERE id = v_movement.lot_id;

    -- Tracer la restauration dans le journal
    INSERT INTO public.inventory_movements (
      user_id,
      lot_id,
      session_id,
      movement_type,
      quantity_before,
      quantity_delta,       -- positif = rentrée en stock
      quantity_after
    ) VALUES (
      auth.uid(),
      v_movement.lot_id,
      p_session_id,
      'restore',
      v_lot_qty_before,
      -v_movement.quantity_delta,
      v_lot_qty_after
    );

    v_restore_count := v_restore_count + 1;
  END LOOP;

  -- ----------------------------------------------------------------
  -- d) Supprimer les entrées meal_log liées à cette session
  -- ----------------------------------------------------------------
  DELETE FROM public.meal_log
   WHERE cooking_session_id = p_session_id;

  -- ----------------------------------------------------------------
  -- e) Supprimer le plat cuisiné (portions déjà vérifiées en b)
  -- ----------------------------------------------------------------
  IF v_has_cooked_dish THEN
    DELETE FROM public.cooked_dishes WHERE id = v_cooked_dish.id;
  END IF;

  -- ----------------------------------------------------------------
  -- f) Marquer la session comme annulée
  -- ----------------------------------------------------------------
  UPDATE public.cooking_sessions
     SET status = 'undone'
   WHERE id = p_session_id;

  -- ----------------------------------------------------------------
  -- g) Résultat
  -- ----------------------------------------------------------------
  RETURN jsonb_build_object(
    'success',       true,
    'lots_restored', v_restore_count,
    'lots_skipped',  v_skipped_count
  );
END;
$$;


-- ============================================================================
-- 8. RPC replace_generated_recipe_ingredients(p_recipe_id, p_rows) → int
-- ============================================================================
-- Remplacement atomique (DELETE + INSERT) des ingrédients d'une recette générée.
-- Utilisée par le résolveur de liaisons (Vague 2) pour persister les liaisons
-- canonical_food / archetype après résolution IA.
--
-- Vérifie la propriété de la recette avant toute modification.
-- Retourne le nombre d'ingrédients insérés.
--
-- Contrat JSON pour p_rows (tableau) :
-- [{
--   "raw_name": text,
--   "quantity": numeric | null,
--   "unit": text | null,
--   "notes": text | null,
--   "canonical_food_id": bigint | null,
--   "archetype_id": bigint | null,
--   "match_status": "matched|unmatched|partial" | null
-- }]
-- ============================================================================
CREATE OR REPLACE FUNCTION public.replace_generated_recipe_ingredients(
  p_recipe_id bigint,
  p_rows      jsonb
)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_count int := 0;
  v_row   jsonb;
BEGIN
  -- Vérifier que la recette appartient à l'utilisateur courant
  IF NOT EXISTS (
    SELECT 1 FROM public.generated_recipes
     WHERE id      = p_recipe_id
       AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION
      'Recette générée introuvable ou non autorisée : %', p_recipe_id;
  END IF;

  -- Supprimer les ingrédients existants
  DELETE FROM public.generated_recipe_ingredients
   WHERE generated_recipe_id = p_recipe_id;

  -- Insérer les nouveaux ingrédients
  FOR v_row IN
    SELECT * FROM jsonb_array_elements(COALESCE(p_rows, '[]'::jsonb))
  LOOP
    INSERT INTO public.generated_recipe_ingredients (
      generated_recipe_id,
      raw_name,
      quantity,
      unit,
      notes,
      canonical_food_id,
      archetype_id,
      match_status
    ) VALUES (
      p_recipe_id,
      v_row->>'raw_name',
      (v_row->>'quantity')::numeric,
      v_row->>'unit',
      v_row->>'notes',
      (v_row->>'canonical_food_id')::bigint,
      (v_row->>'archetype_id')::bigint,
      COALESCE(v_row->>'match_status', 'unmatched')
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;


-- ============================================================================
-- 9. COMMENTAIRES — documentation des objets créés
-- ============================================================================

COMMENT ON TABLE public.cooking_sessions IS
'Session de cuisine : cycle draft → committed → undone. Créée à l''ouverture
du CookingSessionSheet, commitée après validation, annulable via undo tant
que le plat cuisiné n''a pas été entamé. Vague 1 — audit Myko juillet 2026.';

COMMENT ON COLUMN public.cooking_sessions.recipe_source IS
'Source de la recette : curated (catalogue classique), ai (IA), libre (improvisée).';

COMMENT ON COLUMN public.cooking_sessions.portions_left IS
'Portions conservées pour plus tard = actual_servings - portions_eaten.
Si > 0, un plat cuisiné est créé dans cooked_dishes.';

COMMENT ON COLUMN public.cooking_sessions.status IS
'Cycle de vie : draft = brouillon en cours, committed = finalisé, undone = annulé.';

COMMENT ON TABLE public.cooking_session_ingredients IS
'Ingrédients réels d''une session de cuisine. Wipe+insert à chaque commit.
lot_allocations stocke les allocations multi-lots : [{lot_id, qty}].
actual_action : used / substituted / skipped / extra.';

COMMENT ON COLUMN public.cooking_session_ingredients.lot_allocations IS
'Tableau JSON d''allocations multi-lots : [{lot_id: uuid, qty: numeric}].
Peut contenir plusieurs lots si le stock d''un ingrédient était réparti.';

COMMENT ON TABLE public.inventory_movements IS
'Journal immuable des mouvements de stock. Alimenté par commit_cooking_session
(type=consumption, delta négatif) et undo_cooking_session (type=restore, delta positif).
Pas de policy UPDATE ni DELETE côté RLS — les lignes ne doivent jamais être modifiées.
quantity_delta : négatif = sortie ; positif = entrée.';

COMMENT ON COLUMN public.inventory_movements.quantity_delta IS
'Variation de qty_remaining : négatif pour consumption/waste, positif pour purchase/restore/correction.';

COMMENT ON COLUMN public.cooked_dishes.generated_recipe_id IS
'FK vers generated_recipes : plat issu d''une recette IA.
Mutuellement exclusif avec recipe_id (contrainte cooked_dishes_at_most_one_recipe_source NOT VALID).';

COMMENT ON COLUMN public.cooked_dishes.cooking_session_id IS
'FK vers cooking_sessions. Permet à undo_cooking_session de retrouver et supprimer
le plat si les portions n''ont pas été entamées depuis le commit.';

COMMENT ON COLUMN public.meal_log.cooking_session_id IS
'FK vers cooking_sessions. Permet la suppression groupée lors d''un undo :
DELETE FROM meal_log WHERE cooking_session_id = ?';

COMMENT ON FUNCTION public.commit_cooking_session(jsonb) IS
'Transaction unique : valide la session draft, déduit les lots alloués via
inventory_movements, crée le plat cuisiné si portions_left > 0, journalise les
repas par personne dans meal_log, marque la session committed.
Signature : commit_cooking_session(p jsonb) → jsonb
Retour : { success: bool, cooked_dish_id: bigint|null, movements: int, meals_logged: int }';

COMMENT ON FUNCTION public.undo_cooking_session(uuid) IS
'Annule une session committed : restaure les lots via inventory_movements (type=restore),
supprime les entrées meal_log et le plat cuisiné associés. Echoue si des portions
du plat ont été consommées depuis le commit (correction manuelle requise).
Signature : undo_cooking_session(p_session_id uuid) → jsonb
Retour : { success: bool, lots_restored: int, lots_skipped: int }';

COMMENT ON FUNCTION public.replace_generated_recipe_ingredients(bigint, jsonb) IS
'Remplacement atomique (DELETE + INSERT) des generated_recipe_ingredients.
Vérifie la propriété de la recette. Utilisée par le résolveur de liaisons (Vague 2).
Signature : replace_generated_recipe_ingredients(p_recipe_id bigint, p_rows jsonb) → int
Retour : nombre d''ingrédients insérés.';


-- ============================================================================
-- 10. Vérification (informative — ne bloque pas si partielle)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cooking_sessions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inventory_movements'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cooked_dishes'
      AND column_name = 'cooking_session_id'
  ) THEN
    RAISE NOTICE
      'Migration 20260711_cooking_sessions : 3 tables + 3 RPCs + colonnes FK créés avec RLS.';
  END IF;
END $$;
