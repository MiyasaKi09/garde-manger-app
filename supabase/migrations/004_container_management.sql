-- Migration 004: Gestion des contenants pour fractionnement intelligent des lots
-- Date: 2025-10-28
-- Description: Ajoute les colonnes nécessaires pour gérer les contenants unitaires
--              et permettre le fractionnement automatique des lots lors de la consommation

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CONCEPT :
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Exemple : 6 pots de crème fraîche de 25cL
-- - Initial : 1 lot de 6 unités, container_size=25, container_unit='cL'
-- - Après consommation de 30cL :
--   → Lot 1 : 4 pots fermés (100cL total), DLC originale
--   → Lot 2 : 1 pot ouvert (20cL restants), DLC ajustée (opened_at + shelf_life_after_opening)
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

-- Commentaire
COMMENT ON FUNCTION split_containerized_lot IS
'Fractionne intelligemment un lot containerisé lors de la consommation.
Crée automatiquement un nouveau lot pour les contenants partiellement consommés avec DLC ajustée.';
