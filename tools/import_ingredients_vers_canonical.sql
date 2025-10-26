-- ================================================================
-- Script d'importation des ingrédients classifiés
-- Basé sur INGREDIENTS_CLASSIFIES.csv et RECETTES_PROPRES.csv
-- ================================================================
-- 
-- Ce script insère les canonical_foods manquants dans leurs
-- catégories et sous-catégories appropriées
-- ================================================================

BEGIN;

-- ================================================================
-- PARTIE 1 : MAPPING INGRÉDIENTS -> CATÉGORIES + SOUS-CATÉGORIES
-- ================================================================

CREATE TEMP TABLE ingredient_mapping (
    ingredient_name TEXT PRIMARY KEY,
    category_name TEXT NOT NULL,
    subcategory_code TEXT NOT NULL,
    primary_unit TEXT DEFAULT 'g'
);

-- FRUITS
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Agrumes
('citron', 'Fruits', 'fruits_agrumes'),
('citron vert', 'Fruits', 'fruits_agrumes'),
('orange', 'Fruits', 'fruits_agrumes'),
-- Fruits à noyau
('pêche', 'Fruits', 'fruits_noyau'),
('abricot', 'Fruits', 'fruits_noyau'),
('cerise', 'Fruits', 'fruits_noyau'),
('pruneau', 'Fruits', 'fruits_noyau'),
-- Fruits à pépins
('pomme', 'Fruits', 'fruits_pome'),
('poire', 'Fruits', 'fruits_pome'),
-- Fruits rouges & baies
('fraise', 'Fruits', 'fruits_rouges'),
('framboise', 'Fruits', 'fruits_rouges'),
('myrtille', 'Fruits', 'fruits_rouges'),
-- Fruits exotiques & tropicaux
('banane', 'Fruits', 'fruits_exotiques'),
('mangue', 'Fruits', 'fruits_exotiques'),
('ananas', 'Fruits', 'fruits_exotiques'),
('avocat', 'Fruits', 'fruits_exotiques'),
('fruit de la passion', 'Fruits', 'fruits_exotiques'),
-- Figues & dattes
('figue', 'Fruits', 'fruits_figues_dattes'),
('figue fraîche', 'Fruits', 'fruits_figues_dattes'),
('datte', 'Fruits', 'fruits_figues_dattes'),
-- Raisins
('raisin', 'Fruits', 'fruits_raisin'),
('raisin sec', 'Fruits', 'fruits_raisin'),
('raisin blanc', 'Fruits', 'fruits_raisin');

-- LÉGUMES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Alliums (oignons, ail, etc.)
('oignon', 'Légumes', 'legumes_alliums'),
('oignon rouge', 'Légumes', 'legumes_alliums'),
('oignon vert', 'Légumes', 'legumes_alliums'),
('ail', 'Légumes', 'legumes_alliums'),
('échalote', 'Légumes', 'legumes_alliums'),
('poireau', 'Légumes', 'legumes_alliums'),
-- Solanacées (tomates, poivrons, aubergines)
('tomate', 'Légumes', 'legumes_solanacees'),
('tomate cerise', 'Légumes', 'legumes_solanacees'),
('poivron', 'Légumes', 'legumes_solanacees'),
('poivron rouge', 'Légumes', 'legumes_solanacees'),
('poivron jaune', 'Légumes', 'legumes_solanacees'),
('aubergine', 'Légumes', 'legumes_solanacees'),
('piment', 'Légumes', 'legumes_solanacees'),
('piment d''espelette', 'Légumes', 'legumes_solanacees'),
('piment cayenne', 'Légumes', 'legumes_solanacees'),
-- Cucurbitacées (courgettes, concombres, courges)
('courgette', 'Légumes', 'legumes_cucurbitacees'),
('concombre', 'Légumes', 'legumes_cucurbitacees'),
('potimarron', 'Légumes', 'legumes_cucurbitacees'),
('potiron', 'Légumes', 'legumes_cucurbitacees'),
('courge', 'Légumes', 'legumes_cucurbitacees'),
-- Crucifères (choux, brocoli)
('chou-fleur', 'Légumes', 'legumes_cruciferes'),
('brocoli', 'Légumes', 'legumes_cruciferes'),
('chou blanc', 'Légumes', 'legumes_cruciferes'),
('chou vert', 'Légumes', 'legumes_cruciferes'),
('chou', 'Légumes', 'legumes_cruciferes'),
('chou de bruxelle', 'Légumes', 'legumes_cruciferes'),
('navet', 'Légumes', 'legumes_cruciferes'),
('radis', 'Légumes', 'legumes_cruciferes'),
-- Racines & tubercules
('carotte', 'Légumes', 'legumes_racines'),
('pomme de terre', 'Légumes', 'legumes_racines'),
('betterave', 'Légumes', 'legumes_racines'),
('panais', 'Légumes', 'legumes_racines'),
('patate douce', 'Légumes', 'legumes_racines'),
('gingembre', 'Légumes', 'legumes_racines'),
('topinambour', 'Légumes', 'legumes_racines'),
('rutabaga', 'Légumes', 'legumes_racines'),
-- Légumes feuilles
('épinard', 'Légumes', 'legumes_feuilles'),
('épinard frais', 'Légumes', 'legumes_feuilles'),
('salade', 'Légumes', 'legumes_feuilles'),
('laitue romaine', 'Légumes', 'legumes_feuilles'),
('endive', 'Légumes', 'legumes_feuilles'),
('cresson', 'Légumes', 'legumes_feuilles'),
('oseille', 'Légumes', 'legumes_feuilles'),
('blette', 'Légumes', 'legumes_feuilles'),
-- Tiges
('céleri', 'Légumes', 'legumes_tiges'),
('céleri branche', 'Légumes', 'legumes_tiges'),
('asperge', 'Légumes', 'legumes_tiges'),
('asperge verte', 'Légumes', 'legumes_tiges'),
-- Légumineuses vertes
('petit pois', 'Légumes', 'legumes_legumineuses_vertes'),
('haricot vert', 'Légumes', 'legumes_legumineuses_vertes'),
('pois mange-tout', 'Légumes', 'legumes_legumineuses_vertes');

-- CHAMPIGNONS
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
('champignon', 'Champignons', 'champignons_commestibles'),
('champignon de Paris', 'Champignons', 'champignons_cultives'),
('cèpe', 'Champignons', 'champignons_sauvages'),
('morille', 'Champignons', 'champignons_sauvages');

-- ŒUFS
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
('œuf', 'Œufs', 'oeufs_poule');

-- CÉRÉALES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Grains & céréales entières
('riz', 'Céréales', 'cereales_grains'),
('riz Arborio', 'Céréales', 'cereales_grains'),
('riz basmati', 'Céréales', 'cereales_grains'),
('riz japonais', 'Céréales', 'cereales_grains'),
('blé', 'Céréales', 'cereales_grains'),
('maïs', 'Céréales', 'cereales_grains'),
-- Farines, semoules & flocons
('farine', 'Céréales', 'farines_semoules'),
('farine complète', 'Céréales', 'farines_semoules'),
('farine de sarrasin', 'Céréales', 'farines_semoules'),
('farine de riz gluant', 'Céréales', 'farines_semoules'),
('farine de pois chiche', 'Céréales', 'farines_semoules'),
('flocon d''avoine', 'Céréales', 'farines_semoules'),
('semoule', 'Céréales', 'farines_semoules'),
('chapelure', 'Céréales', 'farines_semoules'),
('chapelure panko', 'Céréales', 'farines_semoules'),
-- Pâtes & autres produits céréaliers
('pâte', 'Céréales', 'produits_cerealiers'),
('spaghetti', 'Céréales', 'produits_cerealiers'),
('penne', 'Céréales', 'produits_cerealiers'),
('tagliatelle', 'Céréales', 'produits_cerealiers'),
('linguine', 'Céréales', 'produits_cerealiers'),
('vermicelle de riz', 'Céréales', 'produits_cerealiers'),
-- Pseudo-céréales
('quinoa', 'Céréales', 'pseudo_cereales'),
('sarrasin', 'Céréales', 'pseudo_cereales');

-- LÉGUMINEUSES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
('pois chiche', 'Légumineuses', 'legumineuses_seches'),
('haricot blanc', 'Légumineuses', 'legumineuses_seches'),
('haricot rouge', 'Légumineuses', 'legumineuses_seches'),
('haricot noir', 'Légumineuses', 'legumineuses_seches'),
('lentille', 'Légumineuses', 'legumineuses_seches'),
('lentille corail', 'Légumineuses', 'legumineuses_seches'),
('lentille verte', 'Légumineuses', 'legumineuses_seches');

-- PRODUITS LAITIERS
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Laits
('lait', 'Produits laitiers', 'laitiers_laits'),
('lait entier', 'Produits laitiers', 'laitiers_laits'),
('lait végétal', 'Produits laitiers', 'laitiers_laits'),
('lait de coco', 'Produits laitiers', 'laitiers_laits'),
-- Crèmes, beurres
('crème liquide', 'Produits laitiers', 'lait_creme'),
('crème fraîche', 'Produits laitiers', 'lait_creme'),
('beurre', 'Produits laitiers', 'lait_creme'),
('beurre salé', 'Produits laitiers', 'lait_creme'),
-- Yaourts & fermentés
('yaourt', 'Produits laitiers', 'laitiers_fermentes'),
('yaourt grec', 'Produits laitiers', 'laitiers_fermentes'),
('yaourt nature', 'Produits laitiers', 'laitiers_fermentes'),
('fromage blanc', 'Produits laitiers', 'laitiers_fermentes'),
('fromage frais', 'Produits laitiers', 'laitiers_fermentes'),
-- Fromages
('feta', 'Produits laitiers', 'laitiers_fromages'),
('mozzarella', 'Produits laitiers', 'laitiers_fromages'),
('parmesan', 'Produits laitiers', 'laitiers_fromages'),
('gruyère', 'Produits laitiers', 'laitiers_fromages'),
('comté', 'Produits laitiers', 'laitiers_fromages'),
('cheddar', 'Produits laitiers', 'laitiers_fromages'),
('chèvre frais', 'Produits laitiers', 'laitiers_fromages'),
('mascarpone', 'Produits laitiers', 'laitiers_fromages'),
('ricotta', 'Produits laitiers', 'laitiers_fromages');

-- VIANDES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Ruminants
('bœuf', 'Viandes', 'viandes_ruminants'),
('bœuf haché', 'Viandes', 'viandes_ruminants'),
('veau', 'Viandes', 'viandes_ruminants'),
('agneau', 'Viandes', 'viandes_ruminants'),
('agneau haché', 'Viandes', 'viandes_ruminants'),
-- Porcins
('porc', 'Viandes', 'viandes_porcins'),
('porc haché', 'Viandes', 'viandes_porcins'),
('lardon', 'Viandes', 'viandes_porcins'),
('bacon', 'Viandes', 'viandes_porcins'),
('jambon', 'Viandes', 'viandes_porcins'),
('chorizo', 'Viandes', 'viandes_porcins'),
-- Volailles
('poulet', 'Viandes', 'viandes_volailles'),
('blanc de poulet', 'Viandes', 'viandes_volailles'),
('canard', 'Viandes', 'viandes_volailles'),
('magret de canard', 'Viandes', 'viandes_volailles'),
-- Gibier
('lapin', 'Viandes', 'viandes_gibier'),
('chevreuil', 'Viandes', 'viandes_gibier'),
('sanglier', 'Viandes', 'viandes_gibier');

-- POISSONS
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Poissons gras
('saumon', 'Poissons', 'poissons_gras'),
('saumon fumé', 'Poissons', 'poissons_gras'),
('thon', 'Poissons', 'poissons_gras'),
-- Poissons blancs
('cabillaud', 'Poissons', 'poissons_blancs'),
('morue dessalée', 'Poissons', 'poissons_blancs'),
('sole', 'Poissons', 'poissons_blancs'),
-- Crustacés & mollusques
('crevette', 'Poissons', 'fruits_de_mer'),
('moule', 'Poissons', 'fruits_de_mer'),
('calamar', 'Poissons', 'fruits_de_mer');

-- ÉPICES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Feuilles & herbes
('basilic', 'Épices', 'epices_feuilles_herbes'),
('persil', 'Épices', 'epices_feuilles_herbes'),
('coriandre', 'Épices', 'epices_feuilles_herbes'),
('menthe', 'Épices', 'epices_feuilles_herbes'),
('thym', 'Épices', 'epices_feuilles_herbes'),
('romarin', 'Épices', 'epices_feuilles_herbes'),
('laurier', 'Épices', 'epices_feuilles_herbes'),
('aneth', 'Épices', 'epices_feuilles_herbes'),
('ciboulette', 'Épices', 'epices_feuilles_herbes'),
('sauge', 'Épices', 'epices_feuilles_herbes'),
('estragon', 'Épices', 'epices_feuilles_herbes'),
-- Graines & semences
('cumin', 'Épices', 'epices_graines'),
('coriandre', 'Épices', 'epices_graines'),
('graine de sésame', 'Épices', 'epices_graines'),
-- Racines & rhizomes
('gingembre', 'Épices', 'epices_racines_rhizomes'),
('curcuma', 'Épices', 'epices_racines_rhizomes'),
-- Écorces / fruits
('poivre', 'Épices', 'epices_ecorces_fruits'),
('cannelle', 'Épices', 'epices_ecorces_fruits'),
-- Autres
('muscade', 'Épices', 'epices_autres'),
('clou de girofle', 'Épices', 'epices_autres'),
('vanille', 'Épices', 'epices_autres'),
('paprika', 'Épices', 'epices_autres'),
('sel', 'Épices', 'epices_autres');

-- HUILES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
('huile d''olive', 'Huiles', 'huiles_vegetales'),
('huile végétale', 'Huiles', 'huiles_vegetales'),
('huile de sésame', 'Huiles', 'huiles_vegetales'),
('huile de coco', 'Huiles', 'huiles_vegetales');

-- CONSERVES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Conserves légumes
('concentré de tomate', 'Conserves', 'conserves_legumes'),
('sauce tomate', 'Conserves', 'conserves_legumes'),
-- Conserves poissons
('thon au naturel', 'Conserves', 'conserves_marines'),
('anchois', 'Conserves', 'conserves_marines');

-- NOIX ET GRAINES
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Noix & amandes
('noix', 'Noix et graines', 'noix_amandes'),
('noisette', 'Noix et graines', 'noix_amandes'),
('amande', 'Noix et graines', 'noix_amandes'),
('cacahuète', 'Noix et graines', 'noix_amandes'),
('pistache', 'Noix et graines', 'noix_amandes'),
('châtaigne', 'Noix et graines', 'noix_amandes'),
-- Graines
('graine de chia', 'Noix et graines', 'graines_courantes'),
('pignon de pin', 'Noix et graines', 'graines_courantes');

-- ÉDULCORANTS
INSERT INTO ingredient_mapping (ingredient_name, category_name, subcategory_code) VALUES
-- Sucres
('sucre', 'Édulcorants', 'edul_sucres'),
('sucre glace', 'Édulcorants', 'edul_sucres'),
-- Miels
('miel', 'Édulcorants', 'edul_miels'),
-- Sirops
('sirop d''érable', 'Édulcorants', 'edul_sirops'),
('sirop d''agave', 'Édulcorants', 'edul_sirops');

-- ================================================================
-- PARTIE 2 : INSERTION DES CANONICAL_FOODS MANQUANTS
-- ================================================================

-- Insérer les canonical_foods qui n'existent pas encore
WITH new_foods AS (
    SELECT DISTINCT
        im.ingredient_name,
        rc.id AS category_id,
        rs.id AS subcategory_id,
        im.primary_unit
    FROM 
        ingredient_mapping im
        JOIN reference_categories rc ON rc.name = im.category_name
        JOIN reference_subcategories rs ON rs.code = im.subcategory_code
    WHERE 
        NOT EXISTS (
            SELECT 1 
            FROM canonical_foods cf 
            WHERE LOWER(cf.canonical_name) = LOWER(im.ingredient_name)
        )
)
INSERT INTO canonical_foods (
    canonical_name, 
    category_id, 
    subcategory_id, 
    primary_unit
)
SELECT 
    ingredient_name,
    category_id,
    subcategory_id,
    primary_unit
FROM new_foods;

-- ================================================================
-- PARTIE 3 : RAPPORT FINAL
-- ================================================================

-- Afficher les statistiques
DO $$
DECLARE
    total_canonical INT;
    total_par_categorie RECORD;
BEGIN
    SELECT COUNT(*) INTO total_canonical FROM canonical_foods;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 IMPORT TERMINÉ - STATISTIQUES FINALES';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Total canonical_foods : %', total_canonical;
    RAISE NOTICE '';
    RAISE NOTICE '📦 Répartition par catégorie :';
    
    FOR total_par_categorie IN
        SELECT 
            rc.name AS categorie,
            COUNT(*) AS nombre
        FROM 
            canonical_foods cf
            JOIN reference_categories rc ON rc.id = cf.category_id
        GROUP BY 
            rc.name
        ORDER BY 
            COUNT(*) DESC
    LOOP
        RAISE NOTICE '   • % : %', total_par_categorie.categorie, total_par_categorie.nombre;
    END LOOP;
    
    RAISE NOTICE '================================================';
END $$;

-- Nettoyage
DROP TABLE IF EXISTS ingredient_mapping;

COMMIT;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
