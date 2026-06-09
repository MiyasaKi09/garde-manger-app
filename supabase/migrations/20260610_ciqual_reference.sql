-- Table de référence CIQUAL 2020 (ANSES) : codes aliments + noms français + groupes.
-- Rend les liaisons canonical_foods.nutrition_id → nutritional_data(source_id) vérifiables.
-- DÉJÀ APPLIQUÉE en base (juin 2026). Les données (3 185 lignes) se chargent avec :
--   node scripts/generate-ciqual-inserts.js > /tmp/ciqual_inserts.sql
-- puis exécution du SQL généré (source : data/mapping_canonical_ciqual.csv).

CREATE TABLE IF NOT EXISTS public.ciqual_reference (
  alim_code text PRIMARY KEY,
  alim_nom_fr text NOT NULL,
  groupe text,
  sous_groupe text
);

ALTER TABLE public.ciqual_reference ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY ciqual_reference_read ON public.ciqual_reference FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.ciqual_reference IS
  'Référence CIQUAL 2020 (ANSES) : codes aliments et noms français. Source : table CIQUAL officielle.';

CREATE EXTENSION IF NOT EXISTS unaccent;
