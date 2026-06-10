-- Reclassement expiry_kind (complément de 20260610_fix_shelf_life_data) :
-- les préparations périssables (durée max hors congélateur <= 21 j) classées
-- DDM par défaut sont en réalité des DLC (compotes maison, jus, purées,
-- lacto-fermentés...). Avec une alerte J-7 (règle DDM), un produit qui ne vit
-- que 7 jours serait marqué « urgent » dès l'achat.
UPDATE archetypes SET expiry_kind = 'DLC'
WHERE expiry_kind = 'DDM'
  AND GREATEST(coalesce(shelf_life_days_pantry, 0), coalesce(shelf_life_days_fridge, 0)) BETWEEN 1 AND 21;

-- Poudre de laitue séchée (id=43) : produit sec, pas 5 j frigo
UPDATE archetypes
SET shelf_life_days_pantry = 180, shelf_life_days_fridge = NULL, shelf_life_days_freezer = 365,
    expiry_kind = 'DDM'
WHERE id = 43;

-- Répartition obtenue après application : DLC 173 / DDM 225 / ESTIMATE 21.
