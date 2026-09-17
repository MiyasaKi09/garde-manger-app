-- Rollback de 20260917130000_meal_presence.sql
--
-- La table est purement ADDITIVE : aucune colonne existante n'a été modifiée,
-- aucune table du planning ne la référence par clé étrangère, et le moteur la
-- lit en repli vide (aucune déclaration = grille complète, comportement
-- d'avant le livrable 1.5). La supprimer ramène donc exactement l'état
-- antérieur.
--
-- Ce qui est perdu, et il faut le dire : les déclarations d'absence déjà
-- saisies par le foyer. Elles ne sont recopiées nulle part ailleurs. Les plans
-- DÉJÀ PUBLIÉS ne bougent pas — une semaine publiée a figé ses assiettes, ses
-- quantités et ses demandes dans la transaction de publication ; seule la
-- prochaine génération redeviendra complète.

DROP TABLE IF EXISTS public.meal_presence;
