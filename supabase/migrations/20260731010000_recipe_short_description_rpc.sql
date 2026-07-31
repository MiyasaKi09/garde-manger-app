-- RPC légère : descriptions courtes de N recettes en un aller-retour.
--
-- Contexte : `culinary.recipe_versions` porte maintenant `short_description`
-- (ajouté par 20260731000000), mais la table n'est pas exposée directement
-- par PostgREST depuis l'application cliente — seul chemin est le SECURITY
-- DEFINER. Cette fonction permet à `getImport()` d'enrichir toutes les lignes
-- de repas avec la description courte sans la stocker en doublon dans
-- `nutrition_plan_meals`, et sans réécrire les données de plan déjà en base.
--
-- Entrée : tableau des codes recette (insensible à la casse).
-- Sortie  : table (recipe_code TEXT, short_description TEXT), uniquement les
--           recettes ayant une description non nulle (les autres ne génèrent
--           pas de ligne ; l'appelant doit traiter l'absence comme null).
--
-- Idempotent : CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.get_recipe_short_descriptions(p_codes text[])
RETURNS TABLE(recipe_code text, short_description text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    upper(rv.source_record_key) AS recipe_code,
    rv.short_description
  FROM culinary.recipe_versions rv
  WHERE rv.short_description IS NOT NULL
    AND upper(rv.source_record_key) = ANY(
      SELECT upper(c) FROM unnest(p_codes) AS c
    );
$$;

-- L'utilisateur authentifié lit les descriptions : pas d'écriture, pas de
-- secrets — la description est un texte éditorial.
GRANT EXECUTE ON FUNCTION public.get_recipe_short_descriptions(text[]) TO authenticated;
