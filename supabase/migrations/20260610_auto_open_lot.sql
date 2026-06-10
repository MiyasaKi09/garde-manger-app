-- Ouverture automatique d'un lot à la première consommation partielle.
-- Un lot en vrac (g/kg/ml/cl/l) dont qty_remaining passe sous initial_qty est
-- de fait « entamé » : on le marque ouvert et on réduit sa DLC selon les durées
-- après ouverture de l'archétype (plafonnée à la DLC d'origine).
-- Les unités à la pièce (u, pièce...) ne sont pas concernées : entamer un sachet
-- de 3 pommes n'« ouvre » pas les pommes restantes.

CREATE OR REPLACE FUNCTION auto_open_lot_on_partial_consumption()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_open_days integer;
BEGIN
  IF NEW.is_opened IS DISTINCT FROM true
     AND NEW.qty_remaining IS NOT NULL
     AND NEW.initial_qty IS NOT NULL
     AND NEW.qty_remaining > 0
     AND NEW.qty_remaining < NEW.initial_qty
     AND OLD.qty_remaining IS DISTINCT FROM NEW.qty_remaining
     AND lower(coalesce(NEW.unit, '')) IN ('g', 'kg', 'ml', 'cl', 'l')
  THEN
    NEW.is_opened := true;
    NEW.opened_at := now();

    SELECT CASE coalesce(NEW.storage_method, 'fridge')
             WHEN 'pantry'  THEN a.open_shelf_life_days_pantry
             WHEN 'freezer' THEN a.open_shelf_life_days_freezer
             ELSE a.open_shelf_life_days_fridge
           END
      INTO v_open_days
      FROM archetypes a
     WHERE a.id = NEW.archetype_id;

    IF v_open_days IS NOT NULL AND v_open_days > 0 THEN
      NEW.adjusted_expiration_date := LEAST(
        coalesce(NEW.expiration_date, CURRENT_DATE + v_open_days),
        CURRENT_DATE + v_open_days
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_open_lot ON inventory_lots;
CREATE TRIGGER trg_auto_open_lot
  BEFORE UPDATE OF qty_remaining ON inventory_lots
  FOR EACH ROW
  EXECUTE FUNCTION auto_open_lot_on_partial_consumption();
