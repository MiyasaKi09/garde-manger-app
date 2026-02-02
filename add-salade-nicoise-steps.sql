-- Ajout des étapes pour la recette Salade niçoise (ID: 9401)
-- À exécuter si la table recipe_steps ne contient pas encore d'étapes pour cette recette

-- Supprimer les anciennes étapes si elles existent
DELETE FROM recipe_steps WHERE recipe_id = 9401;

-- Insérer les nouvelles étapes
INSERT INTO recipe_steps (recipe_id, step_no, description, duration, type, created_at) VALUES
(9401, 1, 'Préparer les légumes : Laver la salade verte et bien l''égoutter. Couper les tomates en quartiers. Trancher finement les poivrons verts et les oignons rouges.', 10, 'preparation', NOW()),
(9401, 2, 'Cuire les œufs durs : Porter de l''eau à ébullition, y plonger les œufs et cuire 10 minutes. Rafraîchir sous l''eau froide puis écaler et couper en quartiers.', 10, 'cooking', NOW()),
(9401, 3, 'Préparer les pommes de terre : Cuire les pommes de terre à l''eau salée pendant 15-20 minutes jusqu''à ce qu''elles soient tendres. Laisser refroidir puis couper en rondelles.', 20, 'cooking', NOW()),
(9401, 4, 'Assembler la salade : Dans un grand saladier, disposer la salade verte comme base. Ajouter les tomates, les poivrons, les oignons rouges, les pommes de terre et les haricots verts cuits.', 5, 'assembly', NOW()),
(9401, 5, 'Ajouter le thon et les anchois : Émietter le thon au-dessus de la salade. Disposer les filets d''anchois. Ajouter les olives noires de Nice.', 3, 'assembly', NOW()),
(9401, 6, 'Disposer les œufs : Disposer harmonieusement les quartiers d''œufs durs sur le dessus de la salade.', 2, 'assembly', NOW()),
(9401, 7, 'Assaisonner : Arroser d''huile d''olive, de vinaigre de vin, saler et poivrer. Parsemer de basilic frais ciselé.', 2, 'preparation', NOW()),
(9401, 8, 'Servir : Servir immédiatement ou laisser reposer 10 minutes au frais pour que les saveurs se mélangent.', 10, 'resting', NOW());

-- Vérification
SELECT
  step_no,
  SUBSTRING(description, 1, 60) || '...' as description_preview,
  duration,
  type
FROM recipe_steps
WHERE recipe_id = 9401
ORDER BY step_no;

-- Afficher le résumé
SELECT
  COUNT(*) as total_steps,
  SUM(duration) as total_duration_minutes
FROM recipe_steps
WHERE recipe_id = 9401;
