-- Rollback de 20260727120000_member_taste_preferences.sql
--
-- Les deux tables sont purement additives : aucune colonne existante n'a été
-- modifiée, aucune donnée d'une autre table n'en dépend. Les supprimer ramène
-- exactement l'état antérieur — le moteur retombe alors sur les seules
-- contraintes de compte (user_allergies, user_diets, user_food_bans), ce que
-- lib/domain/planning/tastePreferences.js gère déjà en profil vide.

-- Ne JAMAIS toucher public.meal_feedback : cette table préexiste et appartient
-- au suivi d'adhérence de closed_loop_planning_v2.
DROP TABLE IF EXISTS public.meal_taste_feedback;
DROP TABLE IF EXISTS public.member_food_preferences;
