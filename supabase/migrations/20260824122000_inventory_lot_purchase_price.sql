-- ============================================================================
-- Le prix payé sur le lot — l'observation du foyer
-- Contrat : data/prices/CONTRAT.md (v1.0.0)
-- ============================================================================
--
-- CE QUE CETTE MIGRATION POSE
-- ---------------------------
--   public.inventory_lots + 4 colonnes : montant, devise, ce sur quoi il porte,
--   et d'où il vient.
--
-- POURQUOI SUR inventory_lots ET NULLE PART AILLEURS
-- --------------------------------------------------
-- inventory_lots EST déjà l'événement d'achat : il porte `acquired_on`,
-- `initial_qty`, `unit`, `brand`, `barcode`, `commercial_name`. Créer une table
-- d'achats à côté dupliquerait toutes ces colonnes et poserait immédiatement la
-- question de savoir laquelle des deux fait foi quand elles divergent. Le prix
-- est un attribut de l'achat, et l'achat est déjà là.
--
-- La correspondance avec le CONTRAT est directe et vaut d'être écrite :
-- `acquired_on` EST l'`observed_on` de cet achat. C'est la date qui vieillit,
-- pas celle où la donnée a été saisie.
--
-- CE QUE CE CHAMP EST, ET CE QU'IL N'EST JAMAIS
-- ---------------------------------------------
-- C'est une OBSERVATION du foyer : ce qui a réellement été payé, en caisse.
-- Ce n'est jamais une estimation. La distinction n'est pas cosmétique : cette
-- colonne est la fondation du recalage du référentiel sur le foyer réel
-- (étape 3), et un recalage nourri d'estimations issues du référentiel serait
-- circulaire — on recalerait le référentiel sur lui-même, en croyant le
-- confronter au réel, et le résultat aurait toutes les apparences d'une
-- validation. C'est pourquoi `purchase_price_source` n'admet aucune valeur qui
-- signifie « estimé ». L'estimation vit sur la ligne de courses
-- (nutrition_plan_shopping_items.purchase_cost_*), séparément, et c'est de la
-- confrontation des deux que naît le recalage.
--
-- POURQUOI UN MONTANT NU NE SUFFIT PAS
-- ------------------------------------
-- « 4,50 » sur un lot de trois bouteilles d'un litre ne veut rien dire : le
-- lot entier, une bouteille, ou le litre ? Les trois lectures diffèrent d'un
-- facteur trois, et rien dans la donnée ne dit laquelle est la bonne. D'où
-- `purchase_price_basis`, obligatoire dès qu'il y a un montant.
--
-- CE QUI A ÉTÉ ÉCARTÉ
-- -------------------
-- Un `price_per_kg` calculé et stocké sur le lot. Ce serait une seconde vérité
-- dérivée de la première : elle cesserait d'être juste dès qu'une correction
-- toucherait `unit`, `initial_qty` ou `container_size`, et rien ne signalerait
-- la divergence. Le €/kg se déduit à la lecture, à partir de colonnes qui, elles,
-- sont maintenues.
--
-- RÉSERVE CONNUE, ÉCRITE ICI POUR NE PAS ÊTRE REDÉCOUVERTE : un montant en base
-- 'lot' se rapporte à `initial_qty` TELLE QU'ELLE ÉTAIT à l'enregistrement.
-- Corriger `initial_qty` après coup sur un lot déjà valorisé rend le montant
-- faux sans le rendre visible. Le trigger de containerisation, lui, normalise
-- `initial_qty` AVANT l'insertion, donc il n'entre pas en conflit.
--
-- IDEMPOTENCE : ADD COLUMN IF NOT EXISTS, contraintes gardées par pg_constraint.
-- ROLLBACK    : 20260824122000_inventory_lot_purchase_price_rollback.sql
-- ============================================================================

ALTER TABLE public.inventory_lots
  ADD COLUMN IF NOT EXISTS purchase_price        numeric(12,4),
  ADD COLUMN IF NOT EXISTS purchase_currency     text,
  ADD COLUMN IF NOT EXISTS purchase_price_basis  text,
  ADD COLUMN IF NOT EXISTS purchase_price_source text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventory_lots_purchase_price_check'
      AND conrelid = 'public.inventory_lots'::regclass
  ) THEN
    ALTER TABLE public.inventory_lots
      ADD CONSTRAINT inventory_lots_purchase_price_check CHECK (
        -- Tout ou rien. Un montant sans base est inexploitable ; une base sans
        -- montant est une case vide qui laisse croire qu'on a l'information.
        (purchase_price IS NULL AND purchase_currency IS NULL
           AND purchase_price_basis IS NULL AND purchase_price_source IS NULL)
        OR (purchase_price IS NOT NULL AND purchase_currency IS NOT NULL
           AND purchase_price_basis IS NOT NULL AND purchase_price_source IS NOT NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventory_lots_purchase_price_shape_check'
      AND conrelid = 'public.inventory_lots'::regclass
  ) THEN
    ALTER TABLE public.inventory_lots
      ADD CONSTRAINT inventory_lots_purchase_price_shape_check CHECK (
        -- Zéro est admis ICI, contrairement au référentiel : sur un lot, 0 est
        -- une observation réelle (don, récolte du potager, geste commercial).
        -- L'absence d'information, elle, s'écrit NULL. La distinction tient
        -- parce que la colonne enregistre un fait, pas une estimation.
        (purchase_price IS NULL OR purchase_price >= 0)
        AND (purchase_currency IS NULL OR purchase_currency ~ '^[A-Z]{3}$')
        AND (purchase_price_basis IS NULL
             OR purchase_price_basis IN ('lot', 'container', 'unit'))
        -- Aucune valeur ne signifie « estimé » : voir l'en-tête. La liste est
        -- fermée exprès, pour qu'ajouter une source soit un geste délibéré.
        AND (purchase_price_source IS NULL
             OR purchase_price_source IN ('receipt', 'manual_entry', 'shopping_list', 'barcode_scan'))
        -- Un prix « par contenant » n'a de sens que s'il y a des contenants.
        AND (purchase_price_basis IS DISTINCT FROM 'container' OR is_containerized IS TRUE)
      );
  END IF;
END $$;

COMMENT ON COLUMN public.inventory_lots.purchase_price IS
  'Montant RÉELLEMENT PAYÉ, jamais une estimation. Ce qu''il couvre est dit par
   purchase_price_basis. 0 est une observation valide (don, potager) ; l''absence
   d''information s''écrit NULL. DONNÉE SENSIBLE : elle dit ce que le foyer
   dépense.';

COMMENT ON COLUMN public.inventory_lots.purchase_price_basis IS
  'Ce sur quoi porte le montant :
     lot       — le lot entier tel qu''enregistré (initial_qty, en `unit`) ;
     container — UN contenant (container_size, en `container_unit`) ; le total
                 se déduit en multipliant par container_count_initial ;
     unit      — UNE unité de `unit` (donc €/kg quand unit vaut kg).
   Sans cette colonne, « 4,50 » sur trois bouteilles d''un litre admet trois
   lectures qui diffèrent d''un facteur trois.';

COMMENT ON COLUMN public.inventory_lots.purchase_currency IS
  'ISO 4217. Le montant n''est JAMAIS converti : convertir demanderait un taux
   de change à la date d''achat, qui est lui-même une donnée à sourcer et à
   dater. On enregistre la devise observée, et la couche de calcul refuse de
   mélanger des devises plutôt que d''inventer un taux.';

COMMENT ON COLUMN public.inventory_lots.purchase_price_source IS
  'D''où vient le montant : receipt (ticket), manual_entry (saisi de mémoire),
   shopping_list (reporté depuis la liste de courses au moment de l''achat),
   barcode_scan. Aucune valeur ne signifie « estimé » : le recalage du
   référentiel sur le foyer (étape 3) serait circulaire s''il se nourrissait
   d''estimations issues de ce même référentiel.';

-- Le chemin d'accès du recalage : les lots valorisés d'un foyer. Index PARTIEL,
-- parce que les lots sans prix resteront longtemps la majorité et n'ont pas à
-- peser dessus. Il ne porte que `user_id` : `acquired_on` aurait été le second
-- terme naturel, mais le socle de stock rejoué en CI ne porte pas cette colonne,
-- et faire dépendre une migration de production d'un fixture de test est une
-- dette qu'on paie deux fois. Le tri par date se fait à la lecture — sur un
-- garde-manger de foyer, la sélection partielle a déjà tout fait.
CREATE INDEX IF NOT EXISTS inventory_lots_user_priced_idx
  ON public.inventory_lots (user_id)
  WHERE purchase_price IS NOT NULL;


-- ── Sécurité : donnée personnelle ET sensible ───────────────────────────────
-- Les LIGNES sont déjà protégées : la policy inventory_lots_owner_all
-- (20260708_rls_user_tables) réserve la table à son propriétaire, et
-- 20260713162835 a retiré `anon` de toutes les tables portant un user_id. On
-- réaffirme les deux ici plutôt que d'en dépendre à distance : ces colonnes
-- disent ce que quelqu'un dépense, et une exposition par héritage de privilège
-- serait exactement le genre d'erreur qu'on ne remarque pas.

REVOKE ALL ON public.inventory_lots FROM anon;

-- ai_claude est un rôle de lecture pour les routines IA (20260708). Il n'a
-- aucune raison de connaître les montants payés : la révocation est explicite
-- et par colonne, pour qu'elle reste vraie même si la table lui était un jour
-- ouverte plus largement.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_claude') THEN
    EXECUTE 'REVOKE ALL (purchase_price, purchase_currency, purchase_price_basis, purchase_price_source)
             ON public.inventory_lots FROM ai_claude';
  END IF;
END $$;
