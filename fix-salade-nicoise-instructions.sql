-- Mise à jour des instructions de la recette Salade niçoise (ID: 9401)

UPDATE recipes
SET instructions = '1. Préparer les légumes : Laver la salade verte et bien l''égoutter. Couper les tomates en quartiers. Trancher finement les poivrons verts et les oignons rouges.

2. Cuire les œufs durs : Porter de l''eau à ébullition, y plonger les œufs et cuire 10 minutes. Rafraîchir sous l''eau froide puis écaler et couper en quartiers.

3. Préparer les pommes de terre : Cuire les pommes de terre à l''eau salée pendant 15-20 minutes jusqu''à ce qu''elles soient tendres. Laisser refroidir puis couper en rondelles.

4. Assembler la salade : Dans un grand saladier, disposer la salade verte comme base. Ajouter les tomates, les poivrons, les oignons rouges, les pommes de terre et les haricots verts cuits.

5. Ajouter le thon et les anchois : Émietter le thon au-dessus de la salade. Disposer les filets d''anchois. Ajouter les olives noires de Nice.

6. Disposer les œufs : Disposer harmonieusement les quartiers d''œufs durs sur le dessus de la salade.

7. Assaisonner : Arroser d''huile d''olive, de vinaigre de vin, saler et poivrer. Parsemer de basilic frais ciselé.

8. Servir : Servir immédiatement ou laisser reposer 10 minutes au frais pour que les saveurs se mélangent.',
    updated_at = NOW()
WHERE id = 9401;

-- Vérification
SELECT id, name,
       CASE
         WHEN instructions IS NULL THEN 'NULL'
         WHEN LENGTH(instructions) = 0 THEN 'VIDE'
         ELSE SUBSTRING(instructions, 1, 100) || '...'
       END as instructions_preview
FROM recipes
WHERE id = 9401;
