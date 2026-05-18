-- Surnom court par repas (déj/dîner) pour alléger l'affichage du planning.
-- Rempli par la Routine 1 (ex. "Risotto primavera", "Dahl corail").
-- Colonne nullable → zéro impact sur les plannings existants.
-- Appliquée en prod via Supabase migration le 2026-05-18.

ALTER TABLE public.nutrition_plan_meals
  ADD COLUMN IF NOT EXISTS short_label text;
