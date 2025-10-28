-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FICHIER CONSOLIDÉ POUR APPLIQUER LES MIGRATIONS 004 ET 005
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- INSTRUCTIONS :
-- 1. Ouvrez Supabase Dashboard → SQL Editor
-- 2. Copiez/collez ce fichier
-- 3. Exécutez (bouton "Run")
--
-- Ce fichier contient :
-- - Migration 004: Gestion des contenants
-- - Migration 005: Harmonisation des durées de conservation
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 004: Gestion des contenants
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Ajouter les colonnes pour la gestion des contenants
ALTER TABLE inventory_lots ADD COLUMN IF NOT EXISTS container_size numeric;
ALTER TABLE inventory_lots ADD COLUMN IF NOT EXISTS container_unit character varying(20);
ALTER TABLE inventory_lots ADD COLUMN IF NOT EXISTS is_containerized boolean DEFAULT false;

-- Ajouter un index pour optimiser les requêtes sur les lots containerisés
CREATE INDEX IF NOT EXISTS idx_inventory_lots_containerized
ON inventory_lots(user_id, is_containerized)
WHERE is_containerized = true;

-- Commentaires
COMMENT ON COLUMN inventory_lots.container_size IS
'Taille d''un contenant unitaire (ex: 25 pour 25cL, 500 pour 500g)';

COMMENT ON COLUMN inventory_lots.container_unit IS
'Unité du contenant (cL, mL, g, kg, L, etc.)';

COMMENT ON COLUMN inventory_lots.is_containerized IS
'Indique si le produit est stocké en contenants unitaires nécessitant un fractionnement intelligent';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FONCTION : Fractionner un lot lors de la consommation
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION split_containerized_lot(
    p_lot_id uuid,
    p_quantity_consumed numeric,
    p_consumed_unit varchar
)
RETURNS TABLE(
    original_lot_id uuid,
    new_lot_id uuid,
    containers_fully_consumed integer,
    partial_container_remaining numeric,
    message text
) AS $$
DECLARE
    v_lot RECORD;
    v_total_in_container_units numeric;
    v_full_containers_consumed integer;
    v_partial_consumed numeric;
    v_remaining_in_partial numeric;
    v_new_lot_id uuid;
    v_shelf_life_days integer;
BEGIN
    -- Récupérer le lot
    SELECT * INTO v_lot
    FROM inventory_lots
    WHERE id = p_lot_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lot non trouvé: %', p_lot_id;
    END IF;

    IF NOT v_lot.is_containerized THEN
        RAISE EXCEPTION 'Ce lot n''est pas containerisé';
    END IF;

    -- Convertir la quantité consommée dans l'unité du contenant
    -- TODO: Implémenter la conversion d'unités si nécessaire
    v_total_in_container_units := p_quantity_consumed;

    -- Calculer combien de contenants entiers sont consommés
    v_full_containers_consumed := FLOOR(v_total_in_container_units / v_lot.container_size);
    v_partial_consumed := v_total_in_container_units - (v_full_containers_consumed * v_lot.container_size);

    -- Si on consomme une partie d'un contenant supplémentaire
    IF v_partial_consumed > 0 THEN
        v_full_containers_consumed := v_full_containers_consumed + 1;
        v_remaining_in_partial := v_lot.container_size - v_partial_consumed;

        -- Créer un nouveau lot pour le contenant partiellement consommé
        -- Récupérer la durée de conservation après ouverture (si disponible)
        -- TODO: Intégrer avec la table des règles de conservation
        v_shelf_life_days := 7; -- Par défaut 7 jours après ouverture

        INSERT INTO inventory_lots (
            user_id,
            canonical_food_id,
            cultivar_id,
            archetype_id,
            product_id,
            qty_remaining,
            initial_qty,
            unit,
            container_size,
            container_unit,
            is_containerized,
            storage_method,
            storage_place,
            acquired_on,
            expiration_date,
            adjusted_expiration_date,
            is_opened,
            opened_at,
            notes
        ) VALUES (
            v_lot.user_id,
            v_lot.canonical_food_id,
            v_lot.cultivar_id,
            v_lot.archetype_id,
            v_lot.product_id,
            v_remaining_in_partial,
            v_lot.container_size,
            v_lot.container_unit,
            v_lot.container_size,
            v_lot.container_unit,
            true,
            v_lot.storage_method,
            v_lot.storage_place,
            v_lot.acquired_on,
            v_lot.expiration_date,
            CURRENT_DATE + v_shelf_life_days, -- DLC ajustée après ouverture
            true, -- Marqué comme ouvert
            CURRENT_TIMESTAMP,
            COALESCE(v_lot.notes, '') || ' (Contenant ouvert)'
        )
        RETURNING id INTO v_new_lot_id;
    END IF;

    -- Mettre à jour le lot original
    UPDATE inventory_lots
    SET
        qty_remaining = GREATEST(0, qty_remaining - v_full_containers_consumed),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_lot_id;

    -- Retourner les résultats
    RETURN QUERY SELECT
        p_lot_id,
        v_new_lot_id,
        v_full_containers_consumed,
        v_remaining_in_partial,
        CASE
            WHEN v_partial_consumed > 0 THEN
                format('Consommé %s contenants entiers + %s%s d''un contenant. Reste: %s%s dans un nouveau lot ouvert',
                    v_full_containers_consumed - 1,
                    v_partial_consumed,
                    v_lot.container_unit,
                    v_remaining_in_partial,
                    v_lot.container_unit)
            ELSE
                format('Consommé %s contenants entiers', v_full_containers_consumed)
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION split_containerized_lot IS
'Fractionne intelligemment un lot containerisé lors de la consommation.
Crée automatiquement un nouveau lot pour les contenants partiellement consommés avec DLC ajustée.';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 005: Harmonisation des durées de conservation
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Ajouter les nouvelles colonnes pour durée de conservation par mode de stockage
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS shelf_life_days_pantry integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS shelf_life_days_fridge integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS shelf_life_days_freezer integer;

-- Ajouter les colonnes pour durée de conservation après ouverture par mode de stockage
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS open_shelf_life_days_pantry integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS open_shelf_life_days_fridge integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS open_shelf_life_days_freezer integer;

-- Migrer les données existantes
-- Si shelf_life_days est défini, le copier vers toutes les colonnes spécifiques
UPDATE archetypes
SET
  shelf_life_days_pantry = shelf_life_days,
  shelf_life_days_fridge = shelf_life_days,
  shelf_life_days_freezer = shelf_life_days * 10  -- Convention: freezer = 10x plus long
WHERE shelf_life_days IS NOT NULL
  AND shelf_life_days_pantry IS NULL;

-- Si open_shelf_life_days est défini, le copier (principalement pour fridge)
UPDATE archetypes
SET
  open_shelf_life_days_pantry = open_shelf_life_days,
  open_shelf_life_days_fridge = open_shelf_life_days,
  open_shelf_life_days_freezer = open_shelf_life_days * 10  -- Freezer = plus long
WHERE open_shelf_life_days IS NOT NULL
  AND open_shelf_life_days_fridge IS NULL;

-- Commentaires
COMMENT ON COLUMN archetypes.shelf_life_days_pantry IS
'Durée de conservation au garde-manger (non ouvert), en jours';

COMMENT ON COLUMN archetypes.shelf_life_days_fridge IS
'Durée de conservation au frigo (non ouvert), en jours';

COMMENT ON COLUMN archetypes.shelf_life_days_freezer IS
'Durée de conservation au congélateur (non ouvert), en jours';

COMMENT ON COLUMN archetypes.open_shelf_life_days_pantry IS
'Durée de conservation au garde-manger après ouverture, en jours';

COMMENT ON COLUMN archetypes.open_shelf_life_days_fridge IS
'Durée de conservation au frigo après ouverture, en jours';

COMMENT ON COLUMN archetypes.open_shelf_life_days_freezer IS
'Durée de conservation au congélateur après ouverture, en jours';

-- Créer une vue pour faciliter l'accès aux données de conservation
CREATE OR REPLACE VIEW archetypes_shelf_life AS
SELECT
  a.id,
  a.name,
  a.canonical_food_id,
  a.process,
  -- Durée de conservation fermé
  COALESCE(a.shelf_life_days_pantry, a.shelf_life_days) as shelf_life_pantry,
  COALESCE(a.shelf_life_days_fridge, a.shelf_life_days) as shelf_life_fridge,
  COALESCE(a.shelf_life_days_freezer, a.shelf_life_days * 10) as shelf_life_freezer,
  -- Durée de conservation ouvert
  COALESCE(a.open_shelf_life_days_pantry, a.open_shelf_life_days) as open_shelf_life_pantry,
  COALESCE(a.open_shelf_life_days_fridge, a.open_shelf_life_days) as open_shelf_life_fridge,
  COALESCE(a.open_shelf_life_days_freezer, a.open_shelf_life_days * 10) as open_shelf_life_freezer
FROM archetypes a;

COMMENT ON VIEW archetypes_shelf_life IS
'Vue simplifiée des durées de conservation des archétypes avec fallback sur les anciennes colonnes';

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ MIGRATIONS APPLIQUÉES AVEC SUCCÈS !
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 006: Données de conservation vérifiées pour les archétypes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- Date: 2025-10-28
-- Description: Complète les colonnes de durée de conservation pour les archétypes
--              avec des données vérifiées basées sur les standards alimentaires
--
-- Sources: ANSES, FDA, standards européens de conservation alimentaire
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PRODUITS LAITIERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Crème liquide
UPDATE archetypes SET
  shelf_life_days_pantry = NULL, -- Ne se conserve pas au garde-manger
  shelf_life_days_fridge = 30,   -- 30 jours fermé au frigo (UHT)
  shelf_life_days_freezer = 120, -- 4 mois au congélateur
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,  -- 3 jours après ouverture au frigo
  open_shelf_life_days_freezer = 60 -- 2 mois après ouverture au congélateur
WHERE name ILIKE '%crème%liquide%' OR name ILIKE '%crème fraîche%';

-- Lait
UPDATE archetypes SET
  shelf_life_days_pantry = 90,   -- 3 mois (UHT)
  shelf_life_days_fridge = 7,    -- 7 jours (frais)
  shelf_life_days_freezer = 90,  -- 3 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,  -- 3 jours après ouverture
  open_shelf_life_days_freezer = 30
WHERE name ILIKE '%lait%' AND name NOT ILIKE '%chocolat%';

-- Yaourt
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 21,   -- 3 semaines
  shelf_life_days_freezer = 60,  -- 2 mois (déconseillé)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%yaourt%' OR name ILIKE '%yogurt%';

-- Fromage à pâte dure
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 21, -- 3 semaines
  open_shelf_life_days_freezer = 90
WHERE (name ILIKE '%parmesan%' OR name ILIKE '%comté%' OR name ILIKE '%emmental%')
  AND name ILIKE '%fromage%';

-- Fromage à pâte molle
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 14,   -- 2 semaines
  shelf_life_days_freezer = 90,  -- 3 mois (déconseillé)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 5, -- 5 jours
  open_shelf_life_days_freezer = 30
WHERE (name ILIKE '%camembert%' OR name ILIKE '%brie%' OR name ILIKE '%chèvre%')
  AND name ILIKE '%fromage%';

-- Beurre
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 30, -- 1 mois
  open_shelf_life_days_freezer = 180
WHERE name ILIKE '%beurre%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VIANDES ET CHARCUTERIE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Viande fraîche (bœuf, porc, poulet)
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 3,    -- 2-3 jours
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 1, -- 1 jour si déballée
  open_shelf_life_days_freezer = 180
WHERE (name ILIKE '%viande%' OR name ILIKE '%bœuf%' OR name ILIKE '%porc%' OR name ILIKE '%poulet%')
  AND name NOT ILIKE '%haché%'
  AND name NOT ILIKE '%cuit%';

-- Viande hachée
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 2,    -- 1-2 jours maximum
  shelf_life_days_freezer = 120, -- 4 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 1, -- Consommer immédiatement
  open_shelf_life_days_freezer = 60
WHERE name ILIKE '%haché%';

-- Jambon tranché
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 7,    -- 1 semaine
  shelf_life_days_freezer = 60,  -- 2 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3, -- 3 jours
  open_shelf_life_days_freezer = 30
WHERE name ILIKE '%jambon%' AND name NOT ILIKE '%cru%';

-- Jambon cru / Saucisson sec
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 21, -- 3 semaines
  open_shelf_life_days_freezer = 90
WHERE (name ILIKE '%jambon%cru%' OR name ILIKE '%saucisson%sec%');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- POISSONS ET FRUITS DE MER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Poisson frais
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 2,    -- 1-2 jours
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 1,
  open_shelf_life_days_freezer = 90
WHERE name ILIKE '%poisson%' OR name ILIKE '%saumon%' OR name ILIKE '%cabillaud%' OR name ILIKE '%truite%';

-- Poisson fumé
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 14,   -- 2 semaines
  shelf_life_days_freezer = 60,  -- 2 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,
  open_shelf_life_days_freezer = 30
WHERE name ILIKE '%fumé%' AND (name ILIKE '%saumon%' OR name ILIKE '%truite%');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CONSERVES ET PRODUITS SECS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Conserves (boîtes métalliques)
UPDATE archetypes SET
  shelf_life_days_pantry = 1095, -- 3 ans
  shelf_life_days_fridge = 1095,
  shelf_life_days_freezer = NULL, -- Pas nécessaire
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3, -- Transférer dans un récipient et consommer sous 3 jours
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%conserve%' OR name ILIKE '%boîte%';

-- Pâtes sèches
UPDATE archetypes SET
  shelf_life_days_pantry = 730,  -- 2 ans
  shelf_life_days_fridge = 730,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 365, -- 1 an après ouverture
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%pâtes%' AND name NOT ILIKE '%fraîches%';

-- Riz
UPDATE archetypes SET
  shelf_life_days_pantry = 730,  -- 2 ans
  shelf_life_days_fridge = 730,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 365,
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%riz%';

-- Farine
UPDATE archetypes SET
  shelf_life_days_pantry = 365,  -- 1 an
  shelf_life_days_fridge = 730,  -- 2 ans (idéal pour éviter les mites)
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 180, -- 6 mois
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%farine%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CONDIMENTS ET SAUCES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Moutarde
UPDATE archetypes SET
  shelf_life_days_pantry = 365,  -- 1 an
  shelf_life_days_fridge = 730,  -- 2 ans
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 180,
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%moutarde%';

-- Ketchup / Mayonnaise
UPDATE archetypes SET
  shelf_life_days_pantry = 365,
  shelf_life_days_fridge = 365,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 60,  -- 2 mois
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%ketchup%' OR name ILIKE '%mayonnaise%';

-- Huile d'olive
UPDATE archetypes SET
  shelf_life_days_pantry = 730,  -- 2 ans
  shelf_life_days_fridge = NULL,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 365, -- 1 an après ouverture
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%huile%olive%';

-- Vinaigre
UPDATE archetypes SET
  shelf_life_days_pantry = 1825, -- 5 ans (quasi infini)
  shelf_life_days_fridge = NULL,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 1825,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%vinaigre%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FRUITS ET LÉGUMES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Légumes feuilles (salades, épinards)
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 5,    -- 3-5 jours
  shelf_life_days_freezer = 180, -- 6 mois (blanchis)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 2,
  open_shelf_life_days_freezer = 90
WHERE (name ILIKE '%salade%' OR name ILIKE '%épinard%' OR name ILIKE '%laitue%')
  AND name NOT ILIKE '%cuite%';

-- Carottes
UPDATE archetypes SET
  shelf_life_days_pantry = 7,    -- 1 semaine
  shelf_life_days_fridge = 21,   -- 3 semaines
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%carotte%';

-- Tomates
UPDATE archetypes SET
  shelf_life_days_pantry = 7,    -- 1 semaine
  shelf_life_days_fridge = 14,   -- 2 semaines
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%tomate%' AND name NOT ILIKE '%sauce%' AND name NOT ILIKE '%concentré%';

-- Pommes de terre
UPDATE archetypes SET
  shelf_life_days_pantry = 60,   -- 2 mois
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 270, -- 9 mois (cuites)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%pomme%terre%';

-- Oignons / Ail
UPDATE archetypes SET
  shelf_life_days_pantry = 90,   -- 3 mois
  shelf_life_days_fridge = 90,
  shelf_life_days_freezer = 180,
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%oignon%' OR name ILIKE '%ail%';

-- Fruits à noyau (pêches, abricots, prunes)
UPDATE archetypes SET
  shelf_life_days_pantry = 5,    -- 3-5 jours
  shelf_life_days_fridge = 7,    -- 1 semaine
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%pêche%' OR name ILIKE '%abricot%' OR name ILIKE '%prune%';

-- Agrumes (oranges, citrons)
UPDATE archetypes SET
  shelf_life_days_pantry = 14,   -- 2 semaines
  shelf_life_days_fridge = 30,   -- 1 mois
  shelf_life_days_freezer = 120, -- 4 mois (jus)
  open_shelf_life_days_pantry = 3, -- 3 jours coupé
  open_shelf_life_days_fridge = 5, -- 5 jours coupé
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%orange%' OR name ILIKE '%citron%' OR name ILIKE '%pamplemousse%';

-- Bananes
UPDATE archetypes SET
  shelf_life_days_pantry = 7,    -- 1 semaine
  shelf_life_days_fridge = 14,   -- 2 semaines (ralentit mûrissement)
  shelf_life_days_freezer = 180, -- 6 mois (écrasées)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%banane%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ŒUFS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Œufs entiers
UPDATE archetypes SET
  shelf_life_days_pantry = 28,   -- 4 semaines
  shelf_life_days_fridge = 42,   -- 6 semaines
  shelf_life_days_freezer = NULL, -- Ne pas congeler entiers
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 2, -- Cassés: 2 jours
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%œuf%' OR name ILIKE '%oeuf%';

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ DONNÉES DE CONSERVATION AJOUTÉES AVEC SUCCÈS !
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- Note: Ces durées sont des recommandations standard.
-- Elles peuvent varier selon:
-- - La qualité initiale du produit
-- - Les conditions de stockage (température, humidité)
-- - L'emballage
-- - Les traitements (pasteurisation, UHT, etc.)
--
-- Toujours faire confiance à ses sens (aspect, odeur, goût) avant consommation.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
