-- Rollback de 20260824120000_prices_reference_catalog.sql
--
-- Les deux tables sont neuves et rien ne les référence : les supprimer ramène
-- exactement l'état antérieur. La couche de prix vit dans lib/domain/prices/ et
-- lit l'artefact JSON importé au build, pas cette table — aucune fonctionnalité
-- ne s'éteint en la retirant.
--
-- ATTENTION : ce rollback DÉTRUIT les relevés chargés en base. L'artefact
-- data/prices/reference-fr.json reste, lui, la copie de référence — c'est lui
-- qui permet de recharger. Ne jouer ce fichier que si cet artefact existe.

BEGIN;

DROP TRIGGER IF EXISTS trg_food_form_prices_provenance ON catalog.food_form_prices;
DROP FUNCTION IF EXISTS catalog.enforce_price_provenance();

DROP TABLE IF EXISTS catalog.food_form_prices;
DROP TABLE IF EXISTS catalog.price_sets;

-- Les lignes de registre insérées dans ops.source_datasets ne sont PAS
-- supprimées : elles peuvent déjà être référencées par une provenance de champ
-- (ops.field_provenance) ou par un run d'import, et surtout les deux exclusions
-- nommées (scraping_enseignes, llm_estimation) ont été écrites pour que la
-- question ne se repose pas. Les effacer rouvrirait précisément le débat
-- qu'elles ferment.

-- Les quatre colonnes de gouvernance restent également en place : d'autres
-- sources que celles du prix peuvent déjà les porter, et une colonne nullable
-- inutilisée ne coûte rien. Pour les retirer réellement :
--   ALTER TABLE ops.source_datasets
--     DROP CONSTRAINT IF EXISTS source_datasets_grants_confidence_check,
--     DROP COLUMN IF EXISTS license_verified_on,
--     DROP COLUMN IF EXISTS license_verified_by,
--     DROP COLUMN IF EXISTS grants_confidence,
--     DROP COLUMN IF EXISTS may_source_price;

COMMIT;
