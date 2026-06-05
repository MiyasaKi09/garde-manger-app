-- Migration 024: Ajout des aliments canoniques manquants (couverture résolveur)
-- Date: 2026-06-04
-- Description: Ajoute les canonical_foods absents qui faisaient échouer la liaison
--   ingrédient → stock (pâtes, tofu, condiments asiatiques, mélanges d'épices…).
--   Chaque entrée porte des `keywords` que lib/ingredientResolver.js exploite pour
--   matcher les variantes (penne/orecchiette → pâtes, etc.).
--
--   - category_id résolu par sous-requête sur reference_categories.name (pas d'ID en dur).
--   - nutrition_id laissé NULL : à relier au CIQUAL ultérieurement (la nutrition
--     précise retombe alors sur l'estimation IA ; la LIAISON STOCK, elle, fonctionne).
--   - Idempotent : ON CONFLICT (canonical_name) DO NOTHING.
--
-- Rollback: migrations/024-add-missing-canonicals-rollback.sql

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   AJOUT CANONIQUES MANQUANTS (couverture résolveur)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

INSERT INTO canonical_foods (canonical_name, keywords, primary_unit, category_id)
VALUES
  -- Féculents / céréales
  ('pâtes',    '{penne,"penne rigate",orecchiette,spaghetti,fusilli,macaroni,coquillette,coquillettes,tagliatelle,tagliatelles,lasagne,lasagnes,"feuilles de lasagnes",rigatoni,farfalle,conchiglie,pates,pate,nouilles}', 'g', (SELECT id FROM reference_categories WHERE name = 'Céréales')),
  ('boulgour', '{boulghour,bulgur,boulgour}',                                  'g',  (SELECT id FROM reference_categories WHERE name = 'Céréales')),
  ('semoule',  '{couscous,"semoule de blé"}',                                  'g',  (SELECT id FROM reference_categories WHERE name = 'Céréales')),
  ('naan',     '{"pain naan","naan nature"}',                                 'u',  (SELECT id FROM reference_categories WHERE name = 'Céréales')),
  ('nachos',   '{"tortilla chips","chips de mais",tortillas}',                'g',  (SELECT id FROM reference_categories WHERE name = 'Céréales')),

  -- Légumineuses / végétal
  ('tofu',     '{"tofu ferme","tofu fumé","tofu soyeux","tofu nature"}',      'g',  (SELECT id FROM reference_categories WHERE name = 'Légumineuses')),

  -- Produits laitiers
  ('halloumi', '{halloumi,"fromage à griller"}',                             'g',  (SELECT id FROM reference_categories WHERE name = 'Produits laitiers')),

  -- Viandes / charcuterie
  ('chorizo',   '{"chorizo doux","chorizo fort"}',                           'g',  (SELECT id FROM reference_categories WHERE name = 'Viandes')),
  ('guanciale', '{joue de porc,"lard de joue"}',                             'g',  (SELECT id FROM reference_categories WHERE name = 'Viandes')),

  -- Poissons
  ('lieu jaune', '{lieu,"dos de lieu","filet de lieu"}',                     'g',  (SELECT id FROM reference_categories WHERE name = 'Poissons')),

  -- Noix et graines / oléagineux
  ('sésame',  '{"huile de sésame","graines de sésame","purée de sésame"}',   'g',  (SELECT id FROM reference_categories WHERE name = 'Noix et graines')),
  ('tahini',  '{tahin,"purée de sésame","crème de sésame"}',                 'g',  (SELECT id FROM reference_categories WHERE name = 'Noix et graines')),

  -- Matières grasses
  ('saindoux', '{"graisse de porc",lard}',                                   'g',  (SELECT id FROM reference_categories WHERE name = 'Huiles')),

  -- Condiments / sauces / conserves
  ('mayonnaise', '{mayo}',                                                   'g',  (SELECT id FROM reference_categories WHERE name = 'Conserves')),
  ('ketchup',    '{"sauce tomate ketchup"}',                                'g',  (SELECT id FROM reference_categories WHERE name = 'Conserves')),
  ('pesto',      '{"pesto rosso","pesto verde","pesto genovese"}',          'g',  (SELECT id FROM reference_categories WHERE name = 'Conserves')),
  ('câpres',     '{capre,capres}',                                          'g',  (SELECT id FROM reference_categories WHERE name = 'Conserves')),
  ('gochujang',  '{"pâte de piment coréenne","pate de piment coreenne"}',   'g',  (SELECT id FROM reference_categories WHERE name = 'Conserves')),
  ('mirin',      '{"saké de cuisine","vin de riz"}',                        'ml', (SELECT id FROM reference_categories WHERE name = 'Conserves')),
  ('nuoc-mâm',   '{"nuoc mam","nuoc-mam","sauce poisson","sauce de poisson"}','ml',(SELECT id FROM reference_categories WHERE name = 'Conserves')),
  ('kimchi',     '{"chou fermenté coréen"}',                                'g',  (SELECT id FROM reference_categories WHERE name = 'Conserves')),

  -- Épices / mélanges
  ('harissa',             '{"pâte de piment","pate de piment"}',            'g',  (SELECT id FROM reference_categories WHERE name = 'Épices')),
  ('ras el-hanout',       '{ras-el-hanout,"ras el hanout","ras-el hanout"}', 'g', (SELECT id FROM reference_categories WHERE name = 'Épices')),
  ('herbes de Provence',  '{"herbes de provence","mélange provençal"}',     'g',  (SELECT id FROM reference_categories WHERE name = 'Épices')),
  ('galanga',             '{"gingembre thaï"}',                             'g',  (SELECT id FROM reference_categories WHERE name = 'Épices')),
  ('combava',             '{kaffir,"feuilles de kaffir","feuille de combava","feuilles de combava","citron kaffir"}', 'u', (SELECT id FROM reference_categories WHERE name = 'Épices'))
ON CONFLICT (canonical_name) DO NOTHING;

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM canonical_foods
  WHERE canonical_name IN (
    'pâtes','boulgour','semoule','naan','nachos','tofu','halloumi','chorizo','guanciale',
    'lieu jaune','sésame','tahini','saindoux','mayonnaise','ketchup','pesto','câpres',
    'gochujang','mirin','nuoc-mâm','kimchi','harissa','ras el-hanout','herbes de Provence',
    'galanga','combava'
  );
  RAISE NOTICE '✅ Canoniques cibles présents en base : % / 26', n;
  RAISE NOTICE '⚠️  nutrition_id NULL sur les nouveaux — à relier au CIQUAL plus tard.';
END $$;
