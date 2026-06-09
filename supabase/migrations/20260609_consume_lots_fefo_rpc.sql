-- Migration : fonction RPC transactionnelle pour la déduction FEFO des lots
-- Idempotente : utilise CREATE OR REPLACE FUNCTION.
--
-- Usage : SELECT consume_lots_fefo('[{"lot_id":"<uuid>","qty":2.5}, ...]'::jsonb);
-- Échoue entièrement (RAISE EXCEPTION) si un lot est introuvable ou si la
-- quantité résiduelle serait négative avant déduction.

CREATE OR REPLACE FUNCTION consume_lots_fefo(p_consumptions jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  consumption jsonb;
  v_lot_id    uuid;
  v_qty       numeric;
  v_current   numeric;
BEGIN
  -- Boucle sur chaque consommation { lot_id, qty }
  FOR consumption IN SELECT * FROM jsonb_array_elements(p_consumptions)
  LOOP
    v_lot_id := (consumption->>'lot_id')::uuid;
    v_qty    := (consumption->>'qty')::numeric;

    IF v_lot_id IS NULL OR v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Consommation invalide : lot_id=% qty=%', v_lot_id, v_qty;
    END IF;

    -- Lire la quantité courante avec verrou de ligne
    SELECT qty_remaining
      INTO v_current
      FROM inventory_lots
     WHERE id = v_lot_id
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lot introuvable : %', v_lot_id;
    END IF;

    IF v_current < v_qty THEN
      RAISE EXCEPTION 'Stock insuffisant pour le lot % : disponible=% demandé=%',
        v_lot_id, v_current, v_qty;
    END IF;

    -- Décrémenter
    UPDATE inventory_lots
       SET qty_remaining = GREATEST(0, qty_remaining - v_qty)
     WHERE id = v_lot_id;

    -- Supprimer le lot si quantité nulle (reproduit la logique JS existante)
    DELETE FROM inventory_lots
     WHERE id = v_lot_id
       AND qty_remaining <= 0;
  END LOOP;
END;
$$;
