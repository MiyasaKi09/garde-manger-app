-- ============================================================================
-- Le coût estimé sur la ligne de courses — l'archive de ce qui a été annoncé
-- Contrat : data/prices/CONTRAT.md (v1.0.0)
-- ============================================================================
--
-- CE QUE CETTE MIGRATION POSE
-- ---------------------------
--   public.nutrition_plan_shopping_items + 8 colonnes : la fourchette estimée
--   pour cette ligne, sa devise, la confiance de l'entrée employée, l'état du
--   rendement, et l'identité datée du référentiel qui l'a produite.
--
-- À QUOI ÇA SERT
-- --------------
-- À pouvoir répondre plus tard à « l'estimation était-elle bonne ? ». La
-- réponse exige de savoir ce qui avait été annoncé AU MOMENT où la liste a été
-- produite — pas ce que le référentiel d'aujourd'hui dirait de la même ligne.
-- Recalculer a posteriori répondrait à une autre question, et donnerait à un
-- référentiel corrigé l'air d'avoir toujours eu raison.
--
-- POURQUOI LE PRÉFIXE `purchase_cost_` ET PAS `estimated_cost_`
-- -------------------------------------------------------------
-- Le CONTRAT §6.2 distingue deux montants que l'interface ne doit JAMAIS
-- présenter l'un pour l'autre : `coutConsomme` (grammes exacts, fiche recette)
-- et `coutAchat` (contenants entiers, liste de courses). Une ligne de courses
-- porte le second, par définition — elle est adossée à `purchase_qty` et
-- `purchase_unit`, déjà présentes sur cette table. Mettre la distinction dans
-- le NOM des colonnes, plutôt que dans une colonne `basis` qui inviterait un
-- jour à y écrire l'autre valeur, est la forme la plus solide de la règle : on
-- ne peut pas se tromper de montant si le montant se nomme.
--
-- POURQUOI TROIS BORNES ET PAS UN NOMBRE
-- --------------------------------------
-- §3 : on ne publie jamais un prix ponctuel. Stocker le seul centre
-- interdirait, plus tard, de recomposer la fourchette d'une liste : la
-- composition se fait en quadrature sur les demi-étendues (§3.2), et une
-- demi-étendue perdue ne se retrouve pas. Le low et le high stockés ici sont
-- ceux de la LIGNE ; le total de la liste ne s'obtient JAMAIS en additionnant
-- les low entre eux — ce panier-là, où toutes les lignes seraient simultanément
-- dans leur décile bas, n'existe pas.
--
-- CE QUI A ÉTÉ ÉCARTÉ
-- -------------------
-- 1. Une FK vers catalog.price_sets. Une archive ne doit pas dépendre d'un
--    objet fait pour être remplacé : le jour où le jeu de prix est retiré, la
--    ligne doit encore pouvoir dire ce qu'elle affichait. On garde donc la
--    VERSION et la DATE DE RÉFÉRENCE en clair, comme une citation.
-- 2. Le coût réel dans une colonne d'à côté. Il vit sur le lot
--    (inventory_lots.purchase_price), et `created_lot_ids` — déjà présente ici —
--    fait le lien. Le recopier créerait deux vérités sur le même achat.
-- 3. Un pourcentage de couverture par ligne. La couverture est une propriété de
--    la LISTE (§6) ; sur une ligne elle est binaire : chiffrée, ou non chiffrée
--    (toutes les colonnes à NULL). Un « 100 % » par ligne serait un chiffre qui
--    ne mesure rien.
--
-- IDEMPOTENCE : ADD COLUMN IF NOT EXISTS, contrainte gardée par pg_constraint.
-- ROLLBACK    : 20260824123000_shopping_item_estimated_cost_rollback.sql
-- ============================================================================

ALTER TABLE public.nutrition_plan_shopping_items
  -- La fourchette porte sur purchase_qty / purchase_unit de la même ligne.
  -- numeric(12,4) et non (12,2) : les arrondis d'affichage du §7.2 (0,05 € par
  -- portion, 0,10 € sous 10 €…) s'appliquent au MOMENT DE L'AFFICHAGE. Arrondir
  -- au stockage ferait accumuler l'arrondi dans la composition en quadrature du
  -- total, et le total ne collerait plus à la somme de ce qui est affiché.
  ADD COLUMN IF NOT EXISTS purchase_cost_low     numeric(12,4),
  ADD COLUMN IF NOT EXISTS purchase_cost_central numeric(12,4),
  ADD COLUMN IF NOT EXISTS purchase_cost_high    numeric(12,4),
  ADD COLUMN IF NOT EXISTS purchase_cost_currency text,

  -- Confiance de l'entrée de référentiel employée. Seuls A et B existent ici :
  -- C équivaut à l'absence, et une ligne appuyée sur une entrée en C est une
  -- ligne NON CHIFFRÉE, donc toutes ses colonnes de coût restent à NULL.
  ADD COLUMN IF NOT EXISTS purchase_cost_confidence text,

  -- Le rendement comestible de la forme était-il sourcé ? C'est ce booléen qui
  -- décide de la mention « hors pertes de parage » (§7.3) et qui alimente
  -- yieldKnownPct. false ne signale pas une erreur : il signale que
  -- l'estimation est un MINORANT, ce qui est un biais de sens connu.
  ADD COLUMN IF NOT EXISTS purchase_cost_yield_known boolean,

  -- L'identité datée du référentiel qui a produit ce montant. Recopiée en
  -- clair, pas référencée : c'est une citation, et une citation doit survivre à
  -- la disparition de ce qu'elle cite.
  ADD COLUMN IF NOT EXISTS price_set_version        text,
  ADD COLUMN IF NOT EXISTS price_set_reference_date date,

  ADD COLUMN IF NOT EXISTS priced_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'npsi_purchase_cost_check'
      AND conrelid = 'public.nutrition_plan_shopping_items'::regclass
  ) THEN
    ALTER TABLE public.nutrition_plan_shopping_items
      ADD CONSTRAINT npsi_purchase_cost_check CHECK (
        -- Tout ou rien : un montant sans sa date de référentiel est un montant
        -- intemporel, et un prix n'en est jamais un (§7.1, la date est toujours
        -- visible à côté du montant — encore faut-il l'avoir gardée).
        (
          purchase_cost_low IS NULL AND purchase_cost_central IS NULL
          AND purchase_cost_high IS NULL AND purchase_cost_currency IS NULL
          AND purchase_cost_confidence IS NULL AND purchase_cost_yield_known IS NULL
          AND price_set_version IS NULL AND price_set_reference_date IS NULL
          AND priced_at IS NULL
        )
        OR (
          purchase_cost_low IS NOT NULL AND purchase_cost_central IS NOT NULL
          AND purchase_cost_high IS NOT NULL AND purchase_cost_currency IS NOT NULL
          AND purchase_cost_confidence IS NOT NULL AND purchase_cost_yield_known IS NOT NULL
          AND price_set_version IS NOT NULL AND price_set_reference_date IS NOT NULL
          AND priced_at IS NOT NULL

          -- Strictement positif : zéro serait la façon la plus discrète
          -- d'écrire « je ne sais pas », et l'interface a l'interdiction
          -- d'afficher « 0 € » (§7.1). L'ignorance s'écrit NULL.
          AND purchase_cost_low > 0
          AND purchase_cost_low <= purchase_cost_central
          AND purchase_cost_central <= purchase_cost_high

          AND purchase_cost_currency ~ '^[A-Z]{3}$'
          -- C n'apparaît pas : une entrée en C ne produit pas de montant.
          AND purchase_cost_confidence IN ('A', 'B')
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.nutrition_plan_shopping_items.purchase_cost_central IS
  'Coût d''ACHAT estimé (coutAchat, CONTRAT §6.2) de purchase_qty purchase_unit,
   figé au moment où la liste a été produite. Jamais le coût consommé : l''écart
   entre les deux est le surplus qui rejoint le garde-manger, pas une erreur.';

COMMENT ON COLUMN public.nutrition_plan_shopping_items.purchase_cost_low IS
  'Borne basse de la LIGNE. Le total d''une liste ne s''obtient JAMAIS en
   additionnant ces bornes : ce panier, où toutes les lignes seraient
   simultanément dans leur décile bas, n''existe pas. La composition se fait en
   quadrature sur les demi-étendues (CONTRAT §3.2).';

COMMENT ON COLUMN public.nutrition_plan_shopping_items.purchase_cost_yield_known IS
  'true si le rendement comestible de la forme était sourcé. false ⇒ le
   rendement valait 1,00 par défaut, donc l''estimation est un MINORANT et
   l''affichage doit porter « hors pertes de parage ».';

COMMENT ON COLUMN public.nutrition_plan_shopping_items.price_set_version IS
  'Version du référentiel employé, recopiée en clair et non référencée : une
   archive ne doit pas dépendre d''un objet fait pour être remplacé.';

COMMENT ON COLUMN public.nutrition_plan_shopping_items.price_set_reference_date IS
  'Date à laquelle les prix employés étaient ramenés. Elle s''affiche à côté du
   montant : un montant sans date est une affirmation intemporelle.';

COMMENT ON COLUMN public.nutrition_plan_shopping_items.priced_at IS
  'Quand l''estimation a été calculée. Distincte de price_set_reference_date,
   comme retrieved_on est distincte de observed_on : l''une date la lecture,
   l''autre date le prix.';

-- Retrouver les lignes chiffrées d'une liste (pour recomposer un total, ou pour
-- confronter estimé et réel via created_lot_ids). Partiel : les lignes non
-- chiffrées sont un état normal et n'ont pas à peser sur l'index.
CREATE INDEX IF NOT EXISTS idx_npsi_priced
  ON public.nutrition_plan_shopping_items (plan_version_id)
  WHERE purchase_cost_central IS NOT NULL;

-- La table porte des données de foyer ; 20260713162835 a déjà retiré `anon` de
-- toutes les tables nutrition_plan_*. On le réaffirme : ces colonnes disent ce
-- que le foyer s'apprête à dépenser.
REVOKE ALL ON public.nutrition_plan_shopping_items FROM anon;
