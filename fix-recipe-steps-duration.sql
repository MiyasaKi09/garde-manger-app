-- Vérifier les étapes actuelles de la Salade niçoise
SELECT step_no, duration, SUBSTRING(description, 1, 50) as desc_preview
FROM recipe_steps
WHERE recipe_id = 9401
ORDER BY step_no;

-- Mettre à jour les durées si elles sont NULL
UPDATE recipe_steps SET duration = 10 WHERE recipe_id = 9401 AND step_no = 1;
UPDATE recipe_steps SET duration = 10 WHERE recipe_id = 9401 AND step_no = 2;
UPDATE recipe_steps SET duration = 20 WHERE recipe_id = 9401 AND step_no = 3;
UPDATE recipe_steps SET duration = 5 WHERE recipe_id = 9401 AND step_no = 4;
UPDATE recipe_steps SET duration = 3 WHERE recipe_id = 9401 AND step_no = 5;
UPDATE recipe_steps SET duration = 2 WHERE recipe_id = 9401 AND step_no = 6;
UPDATE recipe_steps SET duration = 2 WHERE recipe_id = 9401 AND step_no = 7;

-- Vérification finale
SELECT
  SUM(duration) as temps_total_minutes,
  COUNT(*) as nombre_etapes
FROM recipe_steps
WHERE recipe_id = 9401;
