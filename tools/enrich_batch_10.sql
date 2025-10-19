-- Enrichissement massif des recettes
-- Association des tags de difficulté, saisons, occasions, profils

BEGIN;

-- Batch 10

-- 418. Mille-feuille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '418. Mille-feuille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 419. Soufflé au Grand Marnier
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '419. Soufflé au Grand Marnier'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 420. Riz au lait à la vanille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '420. Riz au lait à la vanille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 22 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 22 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 421. Tiramisu classique au café
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '421. Tiramisu classique au café'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 422. Panna Cotta et son coulis de fruits rouges
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '422. Panna Cotta et son coulis de fruits rouges'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 423. Tiramisu aux fraises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '423. Tiramisu aux fraises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '423. Tiramisu aux fraises'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 424. Panna Cotta au caramel beurre salé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '424. Panna Cotta au caramel beurre salé'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '424. Panna Cotta au caramel beurre salé'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 425. Zabaione au Marsala
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '425. Zabaione au Marsala'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 426. Cannoli siciliens à la ricotta
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '426. Cannoli siciliens à la ricotta'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 427. Torta della nonna (tarte à la crème pâtissière et pignons)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '427. Torta della nonna (tarte à la crème pâtissière et pignons)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '427. Torta della nonna (tarte à la crème pâtissière et pignons)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 428. Torta caprese (gâteau au chocolat et amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '428. Torta caprese (gâteau au chocolat et amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '428. Torta caprese (gâteau au chocolat et amandes)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 429. Semifreddo au nougat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '429. Semifreddo au nougat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 430. Gelato à la pistache maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '430. Gelato à la pistache maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 431. Affogato (glace vanille noyée dans un expresso)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '431. Affogato (glace vanille noyée dans un expresso)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '431. Affogato (glace vanille noyée dans un expresso)'
  AND t.name = 'profil:Rapide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 432. Panettone (version maison)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '432. Panettone (version maison)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 433. Cantucci (croquants aux amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '433. Cantucci (croquants aux amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 434. Bonet piémontais (flan au chocolat et amaretti)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '434. Bonet piémontais (flan au chocolat et amaretti)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '434. Bonet piémontais (flan au chocolat et amaretti)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 435. Pêches au vin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '435. Pêches au vin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '435. Pêches au vin'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 436. Sbrisolona (gâteau friable aux amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '436. Sbrisolona (gâteau friable aux amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 437. Crostata à la confiture d'abricots
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '437. Crostata à la confiture d''abricots'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '437. Crostata à la confiture d''abricots'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '437. Crostata à la confiture d''abricots'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 438. Salame al cioccolato (saucisson au chocolat)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '438. Salame al cioccolato (saucisson au chocolat)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '438. Salame al cioccolato (saucisson au chocolat)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 439. Sfogliatelle napolitaines
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '439. Sfogliatelle napolitaines'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 440. Pastiera napolitaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '440. Pastiera napolitaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 23 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 23 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 441. Cheesecake new-yorkais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '441. Cheesecake new-yorkais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 442. Brownie au chocolat et noix de pécan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '442. Brownie au chocolat et noix de pécan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '442. Brownie au chocolat et noix de pécan'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 443. Cookies aux pépites de chocolat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '443. Cookies aux pépites de chocolat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '443. Cookies aux pépites de chocolat'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 444. Apple pie américaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '444. Apple pie américaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 445. Pumpkin pie (tarte à la citrouille)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '445. Pumpkin pie (tarte à la citrouille)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '445. Pumpkin pie (tarte à la citrouille)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 446. Pecan pie (tarte aux noix de pécan)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '446. Pecan pie (tarte aux noix de pécan)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 447. Carrot cake et son glaçage au cream cheese
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '447. Carrot cake et son glaçage au cream cheese'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 448. Red velvet cake
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '448. Red velvet cake'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 449. Muffins aux myrtilles
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '449. Muffins aux myrtilles'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 450. Cupcakes à la vanille et glaçage
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '450. Cupcakes à la vanille et glaçage'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 451. Banana bread
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '451. Banana bread'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 452. Key lime pie (tarte au citron vert)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '452. Key lime pie (tarte au citron vert)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 453. Crumble aux pommes et à la cannelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '453. Crumble aux pommes et à la cannelle'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '453. Crumble aux pommes et à la cannelle'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 454. Sticky toffee pudding
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '454. Sticky toffee pudding'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 455. Eton mess (meringue, fraises, crème)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '455. Eton mess (meringue, fraises, crème)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '455. Eton mess (meringue, fraises, crème)'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '455. Eton mess (meringue, fraises, crème)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 456. Scones britanniques, clotted cream et confiture
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '456. Scones britanniques, clotted cream et confiture'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '456. Scones britanniques, clotted cream et confiture'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 457. Trifle anglais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '457. Trifle anglais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 458. Banoffee pie
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '458. Banoffee pie'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 459. Bread and butter pudding
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '459. Bread and butter pudding'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 460. Shortbread écossais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '460. Shortbread écossais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 24 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 24 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 461. Forêt-Noire allemande (Schwarzwälder Kirschtorte)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '461. Forêt-Noire allemande (Schwarzwälder Kirschtorte)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 462. Apfelstrudel autrichien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '462. Apfelstrudel autrichien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 463. Sacher Torte viennoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '463. Sacher Torte viennoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 464. Linzer Torte
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '464. Linzer Torte'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 465. Churros espagnols et leur chocolat chaud
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '465. Churros espagnols et leur chocolat chaud'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '465. Churros espagnols et leur chocolat chaud'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 466. Crème catalane
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '466. Crème catalane'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '466. Crème catalane'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 467. Tarta de Santiago (gâteau aux amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '467. Tarta de Santiago (gâteau aux amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 468. Leche frita (lait frit)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '468. Leche frita (lait frit)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 469. Pastel de nata portugais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '469. Pastel de nata portugais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 470. Gâteau basque à la crème ou à la cerise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '470. Gâteau basque à la crème ou à la cerise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '470. Gâteau basque à la crème ou à la cerise'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '470. Gâteau basque à la crème ou à la cerise'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 471. Loukoumades grecs (beignets au miel)
INSERT INTO recipe_tags (recipe_id, tag_id)
COMMIT;