-- Ajouter une colonne pour stocker le JSON brut du plan nutritionnel
-- Permet d'alimenter la vue enrichie (prep steps, cooking details)
ALTER TABLE nutrition_plan_imports
ADD COLUMN IF NOT EXISTS raw_json TEXT;
