-- Enrichissement massif des recettes
-- Association des tags de difficulté, saisons, occasions, profils

BEGIN;

-- Batch 6
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '236. Pois chiches rôtis aux épices'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 237. Salade de pois chiches à la méditerranéenne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '237. Salade de pois chiches à la méditerranéenne'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '237. Salade de pois chiches à la méditerranéenne'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '237. Salade de pois chiches à la méditerranéenne'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 238. Chili sin carne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '238. Chili sin carne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 239. Haricots blancs à la bretonne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '239. Haricots blancs à la bretonne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 240. Fèves à la catalane
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '240. Fèves à la catalane'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '240. Fèves à la catalane'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 13 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 13 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 241. Socca niçoise (galette de farine de pois chiches)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '241. Socca niçoise (galette de farine de pois chiches)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 242. Panisses marseillaises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '242. Panisses marseillaises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 243. Lasagnes végétariennes aux légumes du soleil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '243. Lasagnes végétariennes aux légumes du soleil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '243. Lasagnes végétariennes aux légumes du soleil'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 244. Lasagnes aux épinards et à la ricotta
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '244. Lasagnes aux épinards et à la ricotta'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 245. Risotto aux champignons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '245. Risotto aux champignons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '245. Risotto aux champignons'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 246. Risotto aux asperges et parmesan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '246. Risotto aux asperges et parmesan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '246. Risotto aux asperges et parmesan'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 247. Risotto à la milanaise (au safran)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '247. Risotto à la milanaise (au safran)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 248. Risotto aux courgettes et menthe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '248. Risotto aux courgettes et menthe'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '248. Risotto aux courgettes et menthe'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '248. Risotto aux courgettes et menthe'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 249. Risotto à la tomate et mozzarella
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '249. Risotto à la tomate et mozzarella'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '249. Risotto à la tomate et mozzarella'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 250. Pâtes à la sauce tomate et basilic frais (al pomodoro)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '250. Pâtes à la sauce tomate et basilic frais (al pomodoro)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '250. Pâtes à la sauce tomate et basilic frais (al pomodoro)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 251. Pâtes all'arrabbiata
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '251. Pâtes all''arrabbiata'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 252. Pâtes alla puttanesca
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '252. Pâtes alla puttanesca'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 253. Pâtes à la carbonara (la vraie, sans crème)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '253. Pâtes à la carbonara (la vraie, sans crème)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '253. Pâtes à la carbonara (la vraie, sans crème)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 254. Pâtes cacio e pepe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '254. Pâtes cacio e pepe'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 255. Pâtes à l'amatriciana
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '255. Pâtes à l''amatriciana'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 256. Pâtes au pesto alla genovese
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '256. Pâtes au pesto alla genovese'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 257. Pâtes aux palourdes (alle vongole)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '257. Pâtes aux palourdes (alle vongole)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 258. Pâtes aux fruits de mer (allo scoglio)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '258. Pâtes aux fruits de mer (allo scoglio)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 259. Pâtes alla norma (aubergines, ricotta salata)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '259. Pâtes alla norma (aubergines, ricotta salata)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '259. Pâtes alla norma (aubergines, ricotta salata)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 260. Gnocchis de pommes de terre, sauce sauge et beurre
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '260. Gnocchis de pommes de terre, sauce sauge et beurre'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '260. Gnocchis de pommes de terre, sauce sauge et beurre'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '260. Gnocchis de pommes de terre, sauce sauge et beurre'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 14 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 14 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 261. Gnocchis à la sorrentina (sauce tomate, mozzarella)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '261. Gnocchis à la sorrentina (sauce tomate, mozzarella)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '261. Gnocchis à la sorrentina (sauce tomate, mozzarella)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 262. Raviolis aux épinards et ricotta, sauce tomate
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '262. Raviolis aux épinards et ricotta, sauce tomate'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '262. Raviolis aux épinards et ricotta, sauce tomate'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 263. Cannellonis farcis à la bolognaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '263. Cannellonis farcis à la bolognaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 264. Spaghettis aux boulettes de viande (style italo-américain)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '264. Spaghettis aux boulettes de viande (style italo-américain)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 265. Macaroni and cheese américain (gratin de macaronis)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '265. Macaroni and cheese américain (gratin de macaronis)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '265. Macaroni and cheese américain (gratin de macaronis)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 266. Gratin de pâtes au jambon et béchamel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '266. Gratin de pâtes au jambon et béchamel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '266. Gratin de pâtes au jambon et béchamel'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 267. One pot pasta tomate, basilic, mozzarella
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '267. One pot pasta tomate, basilic, mozzarella'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '267. One pot pasta tomate, basilic, mozzarella'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 268. Pâtes au citron et à la crème
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '268. Pâtes au citron et à la crème'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '268. Pâtes au citron et à la crème'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 269. Salade de pâtes estivale
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '269. Salade de pâtes estivale'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '269. Salade de pâtes estivale'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '269. Salade de pâtes estivale'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 270. Pâtes fraîches maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '270. Pâtes fraîches maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 271. Tofu sauté aux légumes et sauce soja
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '271. Tofu sauté aux légumes et sauce soja'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '271. Tofu sauté aux légumes et sauce soja'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 272. Tofu mariné et grillé au sésame
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '272. Tofu mariné et grillé au sésame'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '272. Tofu mariné et grillé au sésame'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '272. Tofu mariné et grillé au sésame'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 273. Tofu général Tao
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '273. Tofu général Tao'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 274. Tofu Mapo (recette sichuanaise)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '274. Tofu Mapo (recette sichuanaise)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 275. Curry de tofu et légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '275. Curry de tofu et légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '275. Curry de tofu et légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 276. Tofu brouillé (alternative aux œufs)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '276. Tofu brouillé (alternative aux œufs)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '276. Tofu brouillé (alternative aux œufs)'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 277. Tofu Katsu (pané et frit)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '277. Tofu Katsu (pané et frit)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 278. Seitan bourguignon
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '278. Seitan bourguignon'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '278. Seitan bourguignon'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 279. Sauté de seitan et brocolis
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '279. Sauté de seitan et brocolis'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 280. Burger de seitan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '280. Burger de seitan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 15 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 15 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 281. Tempeh laqué à l'indonésienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '281. Tempeh laqué à l''indonésienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 282. Buddha bowl au quinoa, patates douces et avocat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '282. Buddha bowl au quinoa, patates douces et avocat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '282. Buddha bowl au quinoa, patates douces et avocat'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 283. Salade de quinoa, concombre, feta et menthe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '283. Salade de quinoa, concombre, feta et menthe'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
COMMIT;