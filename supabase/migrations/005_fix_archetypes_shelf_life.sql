-- Migration 005: Harmoniser les colonnes de durée de conservation dans archetypes
-- Date: 2025-10-28
-- Description: Aligner la structure de la table archetypes avec canonical_foods
--              pour avoir des durées de conservation spécifiques par mode de stockage

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PROBLÈME À RÉSOUDRE :
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Actuellement, archetypes a :
--   - shelf_life_days (générique)
--   - open_shelf_life_days (après ouverture, mais pas par mode de stockage)
--
-- canonical_foods a :
--   - shelf_life_days_pantry
--   - shelf_life_days_fridge
--   - shelf_life_days_freezer
--
-- Il faut harmoniser pour avoir la même granularité dans archetypes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Étape 1: Ajouter les nouvelles colonnes pour durée de conservation par mode de stockage
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS shelf_life_days_pantry integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS shelf_life_days_fridge integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS shelf_life_days_freezer integer;

-- Étape 2: Ajouter les colonnes pour durée de conservation après ouverture par mode de stockage
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS open_shelf_life_days_pantry integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS open_shelf_life_days_fridge integer;
ALTER TABLE archetypes ADD COLUMN IF NOT EXISTS open_shelf_life_days_freezer integer;

-- Étape 3: Migrer les données existantes
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

-- Étape 4: (Optionnel) Garder les anciennes colonnes pour compatibilité ascendante
-- On ne les supprime pas immédiatement pour éviter de casser le code existant
-- Elles pourront être supprimées dans une migration ultérieure

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

-- Étape 5: Créer une vue pour faciliter l'accès aux données de conservation
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
