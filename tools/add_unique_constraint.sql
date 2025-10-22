-- ========================================================================
-- ÉTAPE 0 : Ajout de la contrainte UNIQUE sur recipes.name
-- À exécuter AVANT add_recipes_batch1.sql
-- ========================================================================

BEGIN;

-- Vérifier s'il y a des doublons existants
SELECT name, COUNT(*) as nombre
FROM recipes
GROUP BY name
HAVING COUNT(*) > 1;

-- Si des doublons existent, les afficher pour les corriger manuellement
-- Sinon, ajouter la contrainte UNIQUE

ALTER TABLE recipes
ADD CONSTRAINT recipes_name_unique UNIQUE (name);

-- Vérification
SELECT 
  'Contrainte ajoutée avec succès !' as message,
  COUNT(*) as nombre_recettes
FROM recipes;

COMMIT;
