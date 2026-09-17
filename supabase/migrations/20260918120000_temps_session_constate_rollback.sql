-- Rollback de 20260918120000_temps_session_constate.sql
--
-- La table est purement ADDITIVE : aucune colonne existante n'a été modifiée,
-- aucune table du planning ne la référence, et l'écran la lit en repli vide
-- (aucune ligne = session non chronométrée, l'annonce s'affiche seule avec sa
-- définition). La supprimer ramène donc exactement l'état antérieur : le temps
-- de session reste affiché, calculé comme une somme, simplement plus personne
-- ne peut le confronter à un chronomètre.
--
-- Ce qui est perdu, et il faut le dire : les temps réellement constatés déjà
-- saisis par le foyer. Ils ne sont recopiés nulle part ailleurs, et c'est la
-- seule mesure qui dise si le chiffre annoncé est juste. Une exportation avant
-- rollback se fait par
--   COPY (SELECT * FROM public.cooking_session_times) TO STDOUT WITH CSV HEADER;

DROP TABLE IF EXISTS public.cooking_session_times;
