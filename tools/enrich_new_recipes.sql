-- ========================================================================
-- ENRICHISSEMENT DES 441 NOUVELLES RECETTES
-- Ajout des profils gustatifs (tags) basés sur les noms de recettes
-- ========================================================================

BEGIN;

-- Insérer les associations recette-tag pour les nouvelles recettes
-- (celles avec description = '%À compléter')

-- Tag: Herbacé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Herbacé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%persil%' OR LOWER(r.name) LIKE '%coriandre%' OR LOWER(r.name) LIKE '%basilic%' OR LOWER(r.name) LIKE '%menthe%' OR LOWER(r.name) LIKE '%aneth%' OR LOWER(r.name) LIKE '%ciboulette%' OR LOWER(r.name) LIKE '%estragon%' OR LOWER(r.name) LIKE '%herbes%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Épicé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Épicé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%curry%' OR LOWER(r.name) LIKE '%épices%' OR LOWER(r.name) LIKE '%piment%' OR LOWER(r.name) LIKE '%gingembre%' OR LOWER(r.name) LIKE '%cumin%' OR LOWER(r.name) LIKE '%paprika%' OR LOWER(r.name) LIKE '%harissa%' OR LOWER(r.name) LIKE '%poivre%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Aillé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Aillé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%ail%' OR LOWER(r.name) LIKE '%échalote%' OR LOWER(r.name) LIKE '%oignon%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Fumé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Fumé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%fumé%' OR LOWER(r.name) LIKE '%bacon%' OR LOWER(r.name) LIKE '%lardons%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Fruité
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Fruité'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%citron%' OR LOWER(r.name) LIKE '%orange%' OR LOWER(r.name) LIKE '%pomme%' OR LOWER(r.name) LIKE '%poire%' OR LOWER(r.name) LIKE '%fraise%' OR LOWER(r.name) LIKE '%framboise%' OR LOWER(r.name) LIKE '%fruits%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Floral
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Floral'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%fleur%' OR LOWER(r.name) LIKE '%rose%' OR LOWER(r.name) LIKE '%lavande%' OR LOWER(r.name) LIKE '%violette%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Boisé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Boisé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%champignon%' OR LOWER(r.name) LIKE '%truffe%' OR LOWER(r.name) LIKE '%noisette%' OR LOWER(r.name) LIKE '%noix%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Marin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Marin'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%poisson%' OR LOWER(r.name) LIKE '%saumon%' OR LOWER(r.name) LIKE '%thon%' OR LOWER(r.name) LIKE '%crevette%' OR LOWER(r.name) LIKE '%moule%' OR LOWER(r.name) LIKE '%fruits de mer%' OR LOWER(r.name) LIKE '%poulpe%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Toasté
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Toasté'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%grillé%' OR LOWER(r.name) LIKE '%rôti%' OR LOWER(r.name) LIKE '%caramélisé%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Vanillé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Vanillé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%vanille%' OR LOWER(r.name) LIKE '%crème%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Salé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Salé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%sel%' OR LOWER(r.name) LIKE '%salé%' OR LOWER(r.name) LIKE '%fromage%' OR LOWER(r.name) LIKE '%jambon%' OR LOWER(r.name) LIKE '%charcuterie%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Sucré
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Sucré'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%sucre%' OR LOWER(r.name) LIKE '%miel%' OR LOWER(r.name) LIKE '%sirop%' OR LOWER(r.name) LIKE '%caramel%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Acide
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Acide'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%vinaigre%' OR LOWER(r.name) LIKE '%citron%' OR LOWER(r.name) LIKE '%cornichon%' OR LOWER(r.name) LIKE '%mariné%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Amer
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Amer'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%endive%' OR LOWER(r.name) LIKE '%chicorée%' OR LOWER(r.name) LIKE '%roquette%' OR LOWER(r.name) LIKE '%café%' OR LOWER(r.name) LIKE '%chocolat noir%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Umami
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Umami'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%parmesan%' OR LOWER(r.name) LIKE '%anchois%' OR LOWER(r.name) LIKE '%miso%' OR LOWER(r.name) LIKE '%sauce soja%' OR LOWER(r.name) LIKE '%champignon%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Piquant
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Piquant'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%moutarde%' OR LOWER(r.name) LIKE '%raifort%' OR LOWER(r.name) LIKE '%wasabi%' OR LOWER(r.name) LIKE '%piment%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Doux
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Doux'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%patate douce%' OR LOWER(r.name) LIKE '%carotte%' OR LOWER(r.name) LIKE '%potiron%' OR LOWER(r.name) LIKE '%courge%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Lactique
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Lactique'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%yaourt%' OR LOWER(r.name) LIKE '%crème%' OR LOWER(r.name) LIKE '%fromage blanc%' OR LOWER(r.name) LIKE '%lait%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Croquant
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Croquant'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%croquant%' OR LOWER(r.name) LIKE '%croustillant%' OR LOWER(r.name) LIKE '%grillé%' OR LOWER(r.name) LIKE '%frit%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Fondant
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Fondant'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%fondant%' OR LOWER(r.name) LIKE '%moelleux%' OR LOWER(r.name) LIKE '%tendre%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Crémeux
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Crémeux'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%crème%' OR LOWER(r.name) LIKE '%velouté%' OR LOWER(r.name) LIKE '%onctueux%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Juteux
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Juteux'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%juteux%' OR LOWER(r.name) LIKE '%frais%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Ferme
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Ferme'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%ferme%' OR LOWER(r.name) LIKE '%dense%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Délicat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Délicat'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%délicat%' OR LOWER(r.name) LIKE '%fin%' OR LOWER(r.name) LIKE '%léger%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Équilibré
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Équilibré'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%équilibré%' OR LOWER(r.name) LIKE '%harmonieux%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Prononcé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Prononcé'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%prononcé%' OR LOWER(r.name) LIKE '%fort%' OR LOWER(r.name) LIKE '%intense%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Puissant
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Puissant'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%puissant%' OR LOWER(r.name) LIKE '%relevé%' OR LOWER(r.name) LIKE '%corsé%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Végétarien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Végétarien'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%salade%' OR LOWER(r.name) LIKE '%légume%' OR LOWER(r.name) LIKE '%végétarien%' OR LOWER(r.name) LIKE '%végétal%' OR LOWER(r.name) LIKE '%tofu%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Viande
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Viande'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%bœuf%' OR LOWER(r.name) LIKE '%veau%' OR LOWER(r.name) LIKE '%agneau%' OR LOWER(r.name) LIKE '%porc%' OR LOWER(r.name) LIKE '%viande%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Volaille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Volaille'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%poulet%' OR LOWER(r.name) LIKE '%canard%' OR LOWER(r.name) LIKE '%dinde%' OR LOWER(r.name) LIKE '%volaille%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Poisson
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Poisson'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%poisson%' OR LOWER(r.name) LIKE '%saumon%' OR LOWER(r.name) LIKE '%thon%' OR LOWER(r.name) LIKE '%sole%' OR LOWER(r.name) LIKE '%cabillaud%' OR LOWER(r.name) LIKE '%truite%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Fruits de mer
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Fruits de mer'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%fruits de mer%' OR LOWER(r.name) LIKE '%crevette%' OR LOWER(r.name) LIKE '%moule%' OR LOWER(r.name) LIKE '%huître%' OR LOWER(r.name) LIKE '%coquillage%' OR LOWER(r.name) LIKE '%poulpe%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Tradition française
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Tradition française'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%bourguignon%' OR LOWER(r.name) LIKE '%provençale%' OR LOWER(r.name) LIKE '%lyonnaise%' OR LOWER(r.name) LIKE '%niçoise%' OR LOWER(r.name) LIKE '%alsacienne%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Tag: Cuisine du monde
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT DISTINCT
    r.id,
    t.id
FROM recipes r
CROSS JOIN tags t
WHERE t.name = 'Cuisine du monde'
  AND r.description LIKE '%À compléter'
  AND (LOWER(r.name) LIKE '%italien%' OR LOWER(r.name) LIKE '%espagnol%' OR LOWER(r.name) LIKE '%grec%' OR LOWER(r.name) LIKE '%indien%' OR LOWER(r.name) LIKE '%asiatique%' OR LOWER(r.name) LIKE '%mexicain%')
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

COMMIT;

-- Vérification finale
SELECT 
    'Enrichissement terminé' as message,
    COUNT(DISTINCT r.id) as recettes_enrichies,
    COUNT(*) as total_associations,
    ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT r.id), 1) as tags_par_recette
FROM recipes r
JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE r.description LIKE '%À compléter';

-- Détail par tag
SELECT 
    t.name as tag,
    COUNT(*) as nombre_recettes
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id
JOIN tags t ON rt.tag_id = t.id
WHERE r.description LIKE '%À compléter'
GROUP BY t.name
ORDER BY COUNT(*) DESC;
