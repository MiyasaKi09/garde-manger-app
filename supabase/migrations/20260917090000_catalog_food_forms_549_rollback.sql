-- Rollback du catalogue d'aliments à 549 formes.
--
-- IL NE SUPPRIME RIEN. Relevé sur la base : dix tables référencent
-- `catalog.food_forms(id)` — exigences de recettes, options d'exigence, alias,
-- profils nutritionnels, profils de conservation, conversions d'unité,
-- transformations et leurs sorties, produits commerciaux, plus la table
-- elle-même par `parent_form_id` ; le référentiel de prix
-- (20260824120000) en fait une onzième. Aucune de ces clés étrangères ne porte
-- de clause ON DELETE : toutes sont en NO ACTION. Supprimer une forme que le
-- chargement de corpus vient de rattacher à vingt-six recettes serait donc refusé
-- par la base, et le forcer emporterait ce qui en dépend.
--
-- CE QU'IL FAIT. Il marque les quatorze formes entrées avec ce chargement
-- `status = 'rejected'` — le mécanisme que le dépôt s'est déjà donné en
-- 20260714220006 pour exclure les plats préparés du catalogue d'ingrédients, et
-- que tous les chargeurs lisent (`WHERE ff.status <> 'rejected'`). Une forme
-- rejetée cesse d'être retrouvée : un rechargement de corpus ne la rattacherait
-- plus, et les vingt-six recettes redeviendraient non planifiables, ce qui est
-- l'état d'avant.
--
-- LA GARDE `status = 'candidate'` compte : si l'une de ces formes a été publiée
-- entre-temps, quelqu'un l'a relue et validée, et ce fichier n'a pas à défaire
-- cette relecture. Elle est alors laissée en place, sans bruit et sans erreur.
--
-- CE QU'IL NE REND PAS. Les 535 formes antérieures que le dépôt déclare encore
-- ont été rechargées à l'identique par la migration ; il n'y a donc rien à leur
-- restituer. « Poivron jaune frais » ne figure PAS dans la liste ci-dessous : la
-- base la porte depuis 20260729220000, ce chargement ne l'a pas introduite, et
-- la rejeter retirerait du service quelque chose qui lui préexiste. Les profils
-- nutritionnels, conversions et durées de conservation écrits pour les quatorze
-- formes restent en base, rattachés à des formes devenues invisibles :
-- les effacer demanderait de distinguer ce que ce chargement a écrit de ce qui
-- préexistait, distinction que la table ne porte pas.

UPDATE catalog.food_forms
SET status = 'rejected',
    updated_at = now()
WHERE status = 'candidate'
  AND canonical_name_normalized IN (
    'crevette crue surgelee',
    'epinard surgele',
    'farine de sarrasin',
    'feta',
    'filet de merlu surgele',
    'fromage fondu en portions',
    'fruits de mer cuits surgeles',
    'lieu noir surgele',
    'saucisse vegetale au tofu',
    'seitan',
    'tofu fume',
    'tortilla de ble',
    'vinaigre balsamique',
    'yaourt a la grecque'
  );
