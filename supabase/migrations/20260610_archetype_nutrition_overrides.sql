-- =============================================================================
-- Overrides nutritionnels des archétypes transformés préexistants (audit juin 2026)
-- Problème : ces archétypes héritaient des nutriments BRUTS de leur canonique
-- (beurre = lait, confiture = fruit cru, rhum = raisin...) faute de modificateur
-- de process applicable. On les pointe vers leur entrée CIQUAL directe.
-- Idempotent : NOT EXISTS sur archetype_id. Un override par archétype.
-- =============================================================================

-- Helper pattern : insert_override(nom_archétype, code_ciqual, raison)
-- (écrit en INSERT...SELECT explicites ci-dessous)

-- ── Rattachements de canoniques manquants/faux ──────────────────────────────
-- NB : contrainte chk_archetype_parent = XOR(canonical_food_id, cultivar_id).
-- Les archétypes chèvre (235, 418) passent déjà par un cultivar — pas de rattachement.
UPDATE archetypes SET canonical_food_id = (SELECT id FROM canonical_foods WHERE canonical_name='cabillaud')
  WHERE name = 'morue dessalée' AND canonical_food_id IS NULL AND cultivar_id IS NULL;
UPDATE archetypes SET canonical_food_id = (SELECT id FROM canonical_foods WHERE canonical_name='vinaigre')
  WHERE name = 'Vinaigre de cidre' AND cultivar_id IS NULL; -- était rattaché à « aubergine » (!)

-- ── Produits laitiers (canonique lait) ──────────────────────────────────────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id, v.reason
FROM (VALUES
  ('beurre','16400','Beurre 82% MG doux : CIQUAL direct (barattage non modélisable)'),
  ('beurre salé','16402','Beurre 80% MG demi-sel : CIQUAL direct'),
  ('beurre clarifié','16040','Beurre clarifié/ghee : CIQUAL direct'),
  ('beurre de tourage','16400','Beurre de tourage : assimilé beurre 82% MG'),
  ('beurre fondu','16400','Beurre fondu : assimilé beurre 82% MG'),
  ('beurre froid','16400','Beurre froid : assimilé beurre 82% MG'),
  ('beurre manié','16400','Beurre manié : assimilé beurre 82% MG (50/50 farine — approximation)'),
  ('beurre mou','16400','Beurre mou : assimilé beurre 82% MG'),
  ('beurre pour glaçage','16400','Beurre pour glaçage : assimilé beurre 82% MG'),
  ('crème fraîche','19410','Crème 30% MG épaisse rayon frais : CIQUAL direct'),
  ('crème liquide','19415','Crème 30% MG semi-épaisse UHT : CIQUAL direct'),
  ('crème','19402','Crème de lait (aliment moyen) : CIQUAL direct'),
  ('Crème liquide 15%','19436','Crème légère 15-20% fluide : CIQUAL direct'),
  ('Crème liquide 30%','19415','Crème 30% UHT : CIQUAL direct'),
  ('crème fouettée','19420','Crème chantilly sous pression : CIQUAL direct'),
  ('crème chiboust','39710','Crème chiboust : proxy crème pâtissière CIQUAL'),
  ('crème pâtissière','39710','Crème pâtissière : CIQUAL direct'),
  ('crème pâtissière chocolat','39710','Crème pâtissière chocolat : proxy crème pâtissière'),
  ('Fromage blanc 0%','19644','Fromage blanc nature 0% MG : CIQUAL direct'),
  ('Fromage blanc 20%','19646','Fromage blanc nature 3% MG (≈20% sur extrait sec) : CIQUAL direct'),
  ('Fromage blanc 40%','19649','Fromage blanc gourmand 8% MG (≈40% sur extrait sec) : CIQUAL direct'),
  ('fromage blanc','19501','Fromage blanc (aliment moyen) : CIQUAL direct'),
  ('Petit-suisse','19664','Petit suisse nature 4% MG : CIQUAL direct'),
  ('Faisselle','19641','Faisselle 6% MG : CIQUAL direct'),
  ('Kéfir','19865','Kéfir de lait : CIQUAL direct'),
  ('Cottage cheese','19641','Cottage cheese : proxy faisselle 6% MG (fromage frais grainé)'),
  ('Ricotta','19585','Ricotta : CIQUAL direct'),
  ('Mascarpone','19584','Mascarpone : CIQUAL direct'),
  ('Cream cheese','12320','Cream cheese : proxy fromage fondu double crème 31% MG'),
  ('Fromage à tartiner nature','12320','Fromage à tartiner : proxy fromage fondu double crème'),
  ('mozzarella','19590','Mozzarella lait de vache : CIQUAL direct'),
  ('feta','12066','Feta AOP : CIQUAL direct'),
  ('fromage râpé','12118','Emmental râpé : CIQUAL direct'),
  ('fromage','12115','Fromage générique : proxy emmental (fromage le plus courant)'),
  ('fromage Minas','12805','Fromage Minas : proxy chèvre frais (pâte fraîche saumurée)'),
  ('fromage frais','19501','Fromage frais : proxy fromage blanc (aliment moyen)'),
  ('fromage de chèvre','12803','Chèvre lactique affiné (bûchette/crottin) : CIQUAL direct'),
  ('Bûche de chèvre fraîche','12800','Chèvre frais type bûchette fraîche : CIQUAL direct'),
  ('babeurre','19801','Babeurre : proxy lait fermenté à boire nature maigre'),
  ('yaourt nature','19600','Yaourt nature (aliment moyen) : CIQUAL direct'),
  ('yaourt grec','19860','Yaourt à la grecque nature : CIQUAL direct'),
  ('lait','19041','Lait demi-écrémé UHT : aligné sur le canonique'),
  ('ganache ou crème','31085','Ganache : proxy chocolat noir 40% à pâtisser (approximation)')
) AS v(name, code, reason)
JOIN archetypes a ON a.name = v.name
JOIN nutritional_data nd ON nd.source_id = v.code
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- ── Laits végétaux ──────────────────────────────────────────────────────────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id, v.reason
FROM (VALUES
  ('Lait de soja','18900','Boisson au soja nature : CIQUAL direct'),
  ('Lait d''amande','18107','Boisson à l''amande nature non sucrée : CIQUAL direct'),
  ('Lait d''avoine','18905','Boisson à base d''avoine nature : CIQUAL direct'),
  ('Lait de riz','18904','Boisson au riz nature : CIQUAL direct'),
  ('Lait de coco','18041','Lait de coco : CIQUAL direct')
) AS v(name, code, reason)
JOIN archetypes a ON a.name = v.name
JOIN nutritional_data nd ON nd.source_id = v.code
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- ── Pains, farines, pâtes ───────────────────────────────────────────────────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id, v.reason
FROM (VALUES
  ('pain','7001','Pain baguette courante : CIQUAL direct'),
  ('baguette','7001','Baguette courante : CIQUAL direct'),
  ('pain de campagne','7100','Pain de campagne : CIQUAL direct'),
  ('pain de mie','7200','Pain de mie courant : CIQUAL direct'),
  ('mie de pain','7201','Mie de pain : pain de mie sans croûte'),
  ('mie pain','7201','Mie de pain : pain de mie sans croûte'),
  ('brioche','7741','Brioche : CIQUAL direct'),
  ('pains burger','7259','Pain pour hamburger (bun) : CIQUAL direct'),
  ('pain d''épices','23200','Pain d''épices : CIQUAL direct'),
  ('pain rassis','7001','Pain rassis : assimilé baguette courante'),
  ('farine','9436','Farine de blé T55 : CIQUAL direct'),
  ('semoule','9610','Semoule de blé dur crue : CIQUAL direct'),
  ('pâte','23410','Pâte (générique) : proxy pâte brisée crue'),
  ('pâte brisée','23410','Pâte brisée crue : CIQUAL direct'),
  ('pâte feuilletée','23420','Pâte feuilletée crue : CIQUAL direct'),
  ('pâte à pizza','37001','Pâte à pizza crue : CIQUAL direct'),
  ('pâte à pain','37001','Pâte à pain : proxy pâte à pizza crue'),
  ('pâte phyllo','23402','Pâte phyllo : proxy pâte à pizza fine crue'),
  ('pâtes','9810','Pâtes sèches standard crues : CIQUAL direct'),
  ('pâtes courtes','9810','Pâtes sèches standard crues : CIQUAL direct'),
  ('spaghetti','9810','Pâtes sèches standard crues : CIQUAL direct'),
  ('linguine','9810','Pâtes sèches standard crues : CIQUAL direct'),
  ('trofie','9810','Pâtes sèches standard crues : CIQUAL direct'),
  ('trofie ou linguine','9810','Pâtes sèches standard crues : CIQUAL direct'),
  ('nouilles','9810','Nouilles sèches : proxy pâtes sèches standard'),
  ('nouilles chinoises','9810','Nouilles chinoises sèches : proxy pâtes sèches'),
  ('nouilles ramen','9810','Nouilles ramen sèches : proxy pâtes sèches'),
  ('nouilles udon','9810','Nouilles udon : proxy pâtes sèches'),
  ('fideos pâtes','9810','Fideos : proxy pâtes sèches'),
  ('raviolis frais','9821','Raviolis frais : proxy pâtes aux œufs crues (hors farce)')
) AS v(name, code, reason)
JOIN archetypes a ON a.name = v.name
JOIN nutritional_data nd ON nd.source_id = v.code
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- ── Viandes par coupe ───────────────────────────────────────────────────────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id, v.reason
FROM (VALUES
  ('steak de bœuf','6111','Steak : proxy faux-filet cru'),
  ('entrecôte de bœuf','6103','Entrecôte crue : CIQUAL direct'),
  ('bavette','6103','Bavette : proxy entrecôte crue'),
  ('pavé de bœuf','6116','Pavé : proxy filet de bœuf cru'),
  ('bœuf en morceaux','6231','Bœuf bourguignon/pot-au-feu cru : CIQUAL direct'),
  ('bœuf à braiser','6231','Bœuf à braiser : CIQUAL bourguignon cru'),
  ('bœuf à mijoter','6231','Bœuf à mijoter : CIQUAL bourguignon cru'),
  ('paleron de bœuf','6270','Paleron cru : CIQUAL direct'),
  ('côte de bœuf','6001','Côte de bœuf crue : CIQUAL direct'),
  ('filet de bœuf','6116','Filet de bœuf cru : CIQUAL direct'),
  ('araignée de bœuf','6111','Araignée : proxy faux-filet cru'),
  ('bœuf effiloché','6230','Bœuf effiloché : CIQUAL bourguignon cuit'),
  ('escalope de veau','6521','Escalope de veau crue : CIQUAL direct'),
  ('veau en morceaux','6590','Veau collier cru : CIQUAL direct'),
  ('sauté de veau','6560','Veau épaule crue : CIQUAL direct'),
  ('veau pour blanquette','6590','Veau collier cru : CIQUAL direct'),
  ('rôti de veau','6550','Veau rôti cru : CIQUAL direct'),
  ('veau haché','6536','Veau steak haché 15% MG cru : CIQUAL direct'),
  ('côte de veau','6510','Côte de veau crue : CIQUAL direct'),
  ('filet de veau','6530','Filet de veau cru : CIQUAL direct'),
  ('jarret de veau','6583','Jarret de veau cru : CIQUAL direct'),
  ('paupiettes de veau','6521','Paupiette : proxy escalope crue (hors farce)'),
  ('grenadins de veau','6522','Veau noix crue : CIQUAL direct'),
  ('agneau haché','21504','Agneau haché : proxy épaule crue'),
  ('côtelette d''agneau','21500','Côtelette d''agneau crue : CIQUAL direct'),
  ('gigot d''agneau','21502','Gigot cru : CIQUAL direct'),
  ('épaule d''agneau','21504','Épaule crue : CIQUAL direct'),
  ('filet d''agneau','21502','Filet : proxy gigot cru'),
  ('carré d''agneau','21500','Carré : proxy côtelette crue'),
  ('blanc de poulet','36003','Blanc de poulet : aligné sur poulet viande crue')
) AS v(name, code, reason)
JOIN archetypes a ON a.name = v.name
JOIN nutritional_data nd ON nd.source_id = v.code
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- ── Charcuterie, abats, bouillons ───────────────────────────────────────────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id, v.reason
FROM (VALUES
  ('jambon','28900','Jambon cuit supérieur : CIQUAL direct'),
  ('jambon blanc','28900','Jambon cuit supérieur : CIQUAL direct'),
  ('jambon cuit','28900','Jambon cuit supérieur : CIQUAL direct'),
  ('jambon cru','28800','Jambon cru : CIQUAL direct'),
  ('jambon serrano','28845','Jambon sec Serrano : CIQUAL direct'),
  ('jambon ibérique','28845','Jambon ibérique : proxy Serrano'),
  ('saucisse','30102','Saucisse fumée à cuire : CIQUAL direct'),
  ('saucisse de Toulouse','30110','Saucisse de Toulouse crue : CIQUAL direct'),
  ('saucisse de Strasbourg','30742','Saucisse de Strasbourg/Knack : CIQUAL direct'),
  ('chair à saucisse','30051','Chair à saucisse pur porc crue : CIQUAL direct'),
  ('porc haché','30051','Porc haché : proxy chair à saucisse pur porc'),
  ('lard','16530','Lard gras cru : CIQUAL direct'),
  ('lardons','28502','Lardons : poitrine de porc fumée crue'),
  ('boudin noir','8703','Boudin noir à cuire : CIQUAL direct'),
  ('foie de porc','40119','Foie de porc cru : CIQUAL direct'),
  ('bouillon de bœuf','25930','Bouillon de bœuf déshydraté reconstitué : CIQUAL direct'),
  ('bouillon de poulet','25947','Bouillon de volaille reconstitué : CIQUAL direct'),
  ('bouillon de volaille','25947','Bouillon de volaille reconstitué : CIQUAL direct'),
  ('morue dessalée','26043','Morue dessalée : proxy cabillaud cru')
) AS v(name, code, reason)
JOIN archetypes a ON a.name = v.name
JOIN nutritional_data nd ON nd.source_id = v.code
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- ── Alcools et boissons ─────────────────────────────────────────────────────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id, v.reason
FROM (VALUES
  ('vin blanc','5215','Vin blanc sec : CIQUAL direct'),
  ('vin rouge','5214','Vin rouge : CIQUAL direct'),
  ('bière','5001','Bière cœur de marché : CIQUAL direct'),
  ('bière blonde','5001','Bière blonde : CIQUAL cœur de marché'),
  ('bière ambrée','5010','Bière ambrée : proxy bière spéciale 5-6°'),
  ('bière brune','5000','Bière brune : CIQUAL direct'),
  ('cidre','5003','Cidre (aliment moyen) : CIQUAL direct'),
  ('cidre brut','5006','Cidre brut : CIQUAL direct'),
  ('rhum','1004','Rhum : CIQUAL direct'),
  ('cognac','1005','Cognac : proxy whisky (eau-de-vie 40°)'),
  ('calvados','1005','Calvados : proxy whisky (eau-de-vie 40°)'),
  ('kirsch','1005','Kirsch : proxy whisky (eau-de-vie 40°)'),
  ('Grand Marnier','1003','Grand Marnier : CIQUAL liqueur'),
  ('amaretto','1003','Amaretto : CIQUAL liqueur'),
  ('porto','1006','Porto : CIQUAL vin doux'),
  ('Marsala','1006','Marsala : CIQUAL vin doux')
) AS v(name, code, reason)
JOIN archetypes a ON a.name = v.name
JOIN nutritional_data nd ON nd.source_id = v.code
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- ── Sucré : chocolats, confitures, compotes, caramel ────────────────────────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id, v.reason
FROM (VALUES
  ('chocolat','31005','Chocolat noir à croquer <70% : CIQUAL direct'),
  ('chocolat noir','31074','Chocolat noir 70% dégustation : CIQUAL direct'),
  ('caramel beurre salé','31046','Caramel : proxy caramel liquide/nappage'),
  ('crème marrons','15013','Crème de marrons : CIQUAL direct'),
  ('Compote de pommes','13038','Compote de pomme : CIQUAL direct'),
  ('Compote de pommes stérilisée','13038','Compote de pomme : CIQUAL direct'),
  ('Compote d''abricots','13038','Compote : proxy compote de pomme'),
  ('Compote de cerises','13038','Compote : proxy compote de pomme'),
  ('Compote de fraises','13038','Compote : proxy compote de pomme'),
  ('Compote de pêches','13038','Compote : proxy compote de pomme'),
  ('Compote de poires','13038','Compote : proxy compote de pomme'),
  ('Compote de prunes','13038','Compote : proxy compote de pomme'),
  ('Confiture de fraises','31024','Confiture de fraise : CIQUAL direct'),
  ('Confiture de cerises','31038','Confiture de cerise : CIQUAL direct'),
  ('Confiture de prunes','31053','Confiture de prune : CIQUAL direct'),
  ('Confiture d''abricots','31024','Confiture : proxy confiture de fraise'),
  ('Confiture de pêches','31024','Confiture : proxy confiture de fraise'),
  ('Confiture de poires','31024','Confiture : proxy confiture de fraise'),
  ('Confiture de pommes','31024','Confiture : proxy confiture de fraise'),
  ('Confiture de raisin','31024','Confiture : proxy confiture de fraise'),
  ('Thon en conserve','25431','Thon en conserve : aligné sur canonique thon appertisé')
) AS v(name, code, reason)
JOIN archetypes a ON a.name = v.name
JOIN nutritional_data nd ON nd.source_id = v.code
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- ── Cas résolus par motif de nom CIQUAL (codes non confirmés à la main) ─────
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, pick.id, v.reason
FROM (VALUES
  ('blanc d''œuf','blanc d''oeuf%cru','Blanc d''œuf cru : CIQUAL direct'),
  ('jaune d''œuf','jaune d''oeuf%cru','Jaune d''œuf cru : CIQUAL direct'),
  ('sauce tomate','sauce tomate%','Sauce tomate : CIQUAL direct'),
  ('Jus de carotte','jus de carotte%','Jus de carotte : CIQUAL direct'),
  ('Soupe de potiron','soupe de potiron%','Soupe de potiron : CIQUAL direct'),
  ('paprika doux','paprika%','Paprika : CIQUAL direct'),
  ('curry','curry, poudre','Curry en poudre : CIQUAL direct'),
  ('Anchois marinés','anchois%marin%','Anchois marinés : CIQUAL direct'),
  ('Pommes au four','pomme%cuite au four%','Pomme cuite au four : CIQUAL direct'),
  ('Vinaigre de cidre','vinaigre de cidre%','Vinaigre de cidre : CIQUAL direct'),
  ('vinaigre de cidre','vinaigre de cidre%','Vinaigre de cidre : CIQUAL direct')
) AS v(name, pattern, reason)
JOIN archetypes a ON a.name = v.name
JOIN LATERAL (
  SELECT nd.id FROM ciqual_reference cr
  JOIN nutritional_data nd ON nd.source_id = cr.alim_code
  WHERE unaccent(lower(cr.alim_nom_fr)) LIKE unaccent(lower(v.pattern))
  ORDER BY length(cr.alim_nom_fr) ASC
  LIMIT 1
) pick ON true
WHERE NOT EXISTS (SELECT 1 FROM archetype_nutrition_overrides ano WHERE ano.archetype_id = a.id);

-- Restent volontairement en héritage direct du canonique (transformation neutre) :
-- découpes simples (filets de poisson, blanc de poireau...), lacto-fermentés,
-- flocons d'avoine, poudre d'amande, mélanges d'épices, légumes lavés/sous vide.
-- Restent imparfaits (proxy canonique brut) : confits (ail/oignon/tomate/aubergine/
-- échalote), oignons caramélisés — pas d'entrée CIQUAL directe, ajout d'huile/sucre
-- non modélisé.
