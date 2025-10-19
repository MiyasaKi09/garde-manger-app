-- Enrichissement massif des recettes
-- Association des tags de difficulté, saisons, occasions, profils

BEGIN;

-- Batch 12
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '523. Potjevleesch flamand'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 524. Axoa de veau basque
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '524. Axoa de veau basque'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 525. Daube niçoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '525. Daube niçoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 526. Pieds paquets marseillais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '526. Pieds paquets marseillais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 527. Alouettes sans tête provençales
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '527. Alouettes sans tête provençales'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 528. Fricassée de volaille à l'angevine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '528. Fricassée de volaille à l''angevine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 529. Poule au pot
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '529. Poule au pot'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 530. Coquilles Saint-Jacques à la bretonne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '530. Coquilles Saint-Jacques à la bretonne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '530. Coquilles Saint-Jacques à la bretonne'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 531. Cotriade bretonne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '531. Cotriade bretonne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 532. Matelote d'anguille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '532. Matelote d''anguille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 533. Lamproie à la bordelaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '533. Lamproie à la bordelaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 534. Ttoro (soupe de poisson basque)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '534. Ttoro (soupe de poisson basque)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 535. Morue à la lyonnaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '535. Morue à la lyonnaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 536. Quenelles de brochet sauce Nantua
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '536. Quenelles de brochet sauce Nantua'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 537. Grenouilles en persillade
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '537. Grenouilles en persillade'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 538. Fricassée d'escargots
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '538. Fricassée d''escargots'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 539. Caillettes ardéchoises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '539. Caillettes ardéchoises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 540. Diots de Savoie au vin blanc
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '540. Diots de Savoie au vin blanc'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 28 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 28 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 541. Pounti auvergnat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '541. Pounti auvergnat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 542. Farçous aveyronnais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '542. Farçous aveyronnais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 543. Crique ardéchoise (galette de pommes de terre)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '543. Crique ardéchoise (galette de pommes de terre)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '543. Crique ardéchoise (galette de pommes de terre)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 544. Cardons à la moelle lyonnais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '544. Cardons à la moelle lyonnais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 545. Gratin de cardons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '545. Gratin de cardons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '545. Gratin de cardons'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 546. Salade de pissenlits aux lardons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '546. Salade de pissenlits aux lardons'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '546. Salade de pissenlits aux lardons'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '546. Salade de pissenlits aux lardons'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 547. Tarte à l'oignon alsacienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '547. Tarte à l''oignon alsacienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 548. Salsifis à la crème
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '548. Salsifis à la crème'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '548. Salsifis à la crème'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 549. Poêlée de cèpes à la bordelaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '549. Poêlée de cèpes à la bordelaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '549. Poêlée de cèpes à la bordelaise'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 550. Farcis niçois
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '550. Farcis niçois'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 551. Pan bagnat (le vrai)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '551. Pan bagnat (le vrai)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 552. Soupe au pistou
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '552. Soupe au pistou'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 553. Tourton des Alpes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '553. Tourton des Alpes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 554. Oreilles d'âne du Valgaudemar (gratin d'épinards)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '554. Oreilles d''âne du Valgaudemar (gratin d''épinards)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '554. Oreilles d''âne du Valgaudemar (gratin d''épinards)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 555. Pôchouse de Verdun-sur-le-Doubs (version légumes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '555. Pôchouse de Verdun-sur-le-Doubs (version légumes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '555. Pôchouse de Verdun-sur-le-Doubs (version légumes)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '555. Pôchouse de Verdun-sur-le-Doubs (version légumes)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 556. Pâté de pommes de terre du Limousin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '556. Pâté de pommes de terre du Limousin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '556. Pâté de pommes de terre du Limousin'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 557. Flaugnarde aux pommes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '557. Flaugnarde aux pommes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '557. Flaugnarde aux pommes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 558. Millassou (galette de pomme de terre)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '558. Millassou (galette de pomme de terre)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '558. Millassou (galette de pomme de terre)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 559. Escargots de Bourgogne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '559. Escargots de Bourgogne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 560. Lentilles vertes du Berry en salade
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '560. Lentilles vertes du Berry en salade'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '560. Lentilles vertes du Berry en salade'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '560. Lentilles vertes du Berry en salade'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 29 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 29 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 561. Ceviche péruvien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '561. Ceviche péruvien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 562. Lomo saltado (sauté de bœuf péruvien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '562. Lomo saltado (sauté de bœuf péruvien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 563. Aji de gallina (poulet en sauce pimentée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '563. Aji de gallina (poulet en sauce pimentée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 564. Feijoada brésilienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '564. Feijoada brésilienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 565. Pão de queijo (pains au fromage brésiliens)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '565. Pão de queijo (pains au fromage brésiliens)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '565. Pão de queijo (pains au fromage brésiliens)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 566. Moqueca de peixe (ragoût de poisson brésilien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '566. Moqueca de peixe (ragoût de poisson brésilien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '566. Moqueca de peixe (ragoût de poisson brésilien)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 567. Ropa vieja cubaine (bœuf effiloché)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '567. Ropa vieja cubaine (bœuf effiloché)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 568. Picadillo
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '568. Picadillo'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 569. Arroz con pollo
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '569. Arroz con pollo'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 570. Sancocho (soupe colombienne)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '570. Sancocho (soupe colombienne)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 571. Bandeja paisa (plat complet colombien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '571. Bandeja paisa (plat complet colombien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 572. Chiles rellenos (piments farcis mexicains)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '572. Chiles rellenos (piments farcis mexicains)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 573. Mole poblano
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '573. Mole poblano'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 574. Cochinita pibil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '574. Cochinita pibil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 575. Pozole (soupe mexicaine)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '575. Pozole (soupe mexicaine)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 576. Tamales
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '576. Tamales'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 577. Pastel de choclo (gâteau de maïs chilien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '577. Pastel de choclo (gâteau de maïs chilien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 578. Humitas
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '578. Humitas'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 579. Gallo pinto (riz et haricots du Costa Rica)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '579. Gallo pinto (riz et haricots du Costa Rica)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 580. Patacones (bananes plantain frites)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '580. Patacones (bananes plantain frites)'
COMMIT;