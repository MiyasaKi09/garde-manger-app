/**
 * Déclare le rôle d'assiette des 94 recettes PUBLIABLES qui n'en portaient aucun.
 *
 * L'utilisateur a ouvert son planning et y a trouvé « Far breton aux pruneaux »
 * servi au DÎNER de dimanche. C'est un flan sucré : 160 g de sucre, 900 ml de
 * lait et 350 g de pruneaux pour dix parts. Le moteur n'y était pour rien — sa
 * règle refuse qu'un dessert occupe un créneau de repas, mais elle ne se fie
 * qu'au rôle DÉCLARÉ (voir `isDessertRecipe` dans lib/domain/planning/plateRole.js),
 * et REAL-091 n'en déclarait aucun. Le même défaut avait déjà servi un
 * kouign-amann trois fois en dîner dans une semaine, à 1006 kcal la portion pour
 * 7,8 g de protéines ; le lot précédent (assign-dessert-roles.mjs) avait fermé la
 * porte pour dix-huit pâtisseries, celle-ci était restée entrouverte.
 *
 * POURQUOI CHAQUE LIGNE EST ÉCRITE À LA MAIN, et pourquoi aucune n'est déduite
 * d'un libellé : parce que le libellé ment, dans les deux sens. Une première
 * version du moteur dérivait le rôle du nom et classait « Tarte aux poireaux et
 * lardons » en dessert — un plat salé sorti des repas. La catégorie ment aussi :
 * le corpus range « Idli » en « gâteau vapeur fermenté » et « Tteokbokki » en
 * « gâteaux de riz pimentés », alors que ce sont deux plats salés. Sur les 94
 * fiches de ce lot, SIX seulement portent au libellé un mot évoquant le sucré et
 * CINQ SONT SALÉES : quiche lorraine, tarte thon-tomate-moutarde, tarte aux
 * poireaux et lardons, flamiche aux poireaux, et un beef stroganoff dont la
 * catégorie parle de « crème » — de la crème aigre. Une seule de ces six est un
 * dessert : REAL-091.
 *
 * Et la réciproque a mordu aussi. DESS-002 « Pancakes moelleux » est rangé au
 * corpus en « petit-déjeuner » : aucun mot sucré à son libellé, aucun balayage
 * de catégorie ne l'aurait attrapé. Ce sont ses 35 g de sucre, ses 12 g de
 * levure chimique et l'usage qu'on en fait qui en font le SECOND dessert du lot.
 * Son préfixe de code n'y est pour rien : un code n'est pas une composition.
 *
 * CE QUE CHAQUE RÔLE VEUT DIRE (voir PLATE_ROLES) :
 *   complete  — l'assiette entière ; `accepts: ['vegetables']` = un vert est
 *               OFFERT, jamais imposé (le moteur n'ajoute rien à un `complete`).
 *   main      — le plat principal amputé d'une composante ; il en reçoit UNE.
 *   side      — est lui-même un accompagnement, n'en reçoit jamais.
 *   component — une base qu'on fait une fois et dont on tire plusieurs plats.
 *   dessert   — fin de repas ; ne peut JAMAIS occuper un créneau de repas.
 *
 * LES TROIS ARBITRAGES QUI ONT SERVI DE RÈGLE, quand les grammes ne tranchaient
 * pas seuls :
 *   1. Une légumineuse compte pour protéine ET féculent (lentilles, pois
 *      chiches, haricots secs) : un plat de lentilles n'appelle pas de riz.
 *   2. Tartinade contre garniture — ce qui se trempe et s'étale à la cuillère
 *      est un `component` (houmous, baba ganoush), ce qui se mange à la
 *      fourchette à côté du plat est un `side` (caponata, chakalaka).
 *   3. Un aromate n'est pas une ration de légume : 50 g de carotte-céleri par
 *      part restent un fond de cuisson, d'où le `['vegetables']` offert.
 *
 *   node scripts/data/recipes/assign-plate-roles.mjs --dry-run
 *   node scripts/data/recipes/assign-plate-roles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')

/**
 * Le script n'écrit que lancé en ligne de commande. Le test qui relit les
 * décisions IMPORTE ce module, et un import qui réécrit le corpus rejouerait
 * l'écriture au milieu d'une suite où d'autres tests lisent ce même fichier.
 * On garde le `--dry-run` pour la simulation à la main.
 */
const lanceALaMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
const dryRun = !lanceALaMain || process.argv.includes('--dry-run')

/**
 * Les 94, une par une, avec ce qui a tranché. Le motif porte les grammes PAR
 * PART, parce que c'est la seule chose qui distingue un plat d'une garniture et
 * que « il m'a semblé » ne se relit pas six mois plus tard.
 */
const DECISIONS = [
  // ── complete, rien à ajouter ────────────────────────────────────────────────
  { code: 'IT-001', role: 'complete', accepts: [], reason: 'Lasagnes à la bolognaise : 44 g de pâtes sèches, 106 g de viande et 180 g de tomate-soffritto par part — féculent, protéine et légumes sont déjà montés dans le plat.' },
  { code: 'FR-011', role: 'complete', accepts: [], reason: 'Cabillaud au beurre citronné : 150 g de poisson, 70 g de riz sec et 125 g de haricots verts par part — la fiche porte elle-même son accompagnement, jusque dans son titre.' },
  { code: 'FR-033', role: 'complete', accepts: [], reason: 'Salade de lentilles et œuf mollet : 75 g de lentilles sèches et un œuf entier par part ; la légumineuse fait protéine et féculent, la carotte fait le légume.' },
  { code: 'FR-035', role: 'complete', accepts: [], reason: 'Salade niçoise : 125 g de pommes de terre, 75 g de thon, un œuf et 200 g de crudités par part — c’est l’assiette entière, pas une entrée.' },
  { code: 'IT-002', role: 'complete', accepts: [], reason: 'Risotto aux champignons : 80 g de riz arborio et 125 g de champignons par part, monté au beurre et au parmesan ; un risotto se sert seul, c’est sa définition même.' },
  { code: 'IT-003', role: 'complete', accepts: [], reason: 'Spaghetti carbonara : 100 g de pâtes et 45 g de guanciale par part ; le dossier du moteur cite nommément la carbonara comme le plat auquel on n’ajoute pas de haricots verts.' },
  { code: 'IT-005', role: 'complete', accepts: [], reason: 'Pâtes au pesto : 100 g de pâtes par part liées à 25 ml d’huile, parmesan et pignons — une assiette de pâtes se sert telle quelle.' },
  { code: 'IT-007', role: 'complete', accepts: [], reason: 'Pizza margherita : 125 g de pâte, 100 g de tomate et 75 g de mozzarella par part ; le dossier du moteur range la pizza avec la carbonara parmi les plats qu’on n’accompagne pas.' },
  { code: 'REAL-099', role: 'complete', accepts: [], reason: 'Pappa al pomodoro : 58 g de pain rassis et 167 g de tomate par part — le pain absorbé EST le féculent de la soupe, qui se sert telle quelle.' },
  { code: 'REAL-100', role: 'complete', accepts: [], reason: 'Cacio e pepe : 100 g de pâtes et 45 g de pecorino par part ; le dossier du moteur la cite avec la carbonara comme plat qu’on n’accompagne pas.' },
  { code: 'REAL-101', role: 'complete', accepts: [], reason: 'Bucatini all’amatriciana : 100 g de bucatini, 45 g de guanciale et 150 g de tomate par part — féculent, protéine et sauce réunis.' },
  { code: 'REAL-115', role: 'complete', accepts: [], reason: 'Salmorejo cordobés : 42 g de pain, un demi-œuf dur et 20 g de jambon serrano par part — contrairement au gazpacho il porte un féculent et une garniture protéique, donc il tient l’assiette.' },
  { code: 'REAL-120', role: 'complete', accepts: [], reason: 'Caldo verde : 133 g de pommes de terre, 58 g de chou kale et 42 g de chouriço par part — soupe-repas complète.' },
  { code: 'REAL-125', role: 'complete', accepts: [], reason: 'Fasolada : 83 g de haricots blancs secs par part avec carotte, céleri et tomate ; la légumineuse apporte à elle seule la protéine et le féculent.' },
  { code: 'REAL-126', role: 'complete', accepts: [], reason: 'Gigantes plaki : 83 g de haricots géants secs par part confits au four dans une sauce tomate aux légumes — même équilibre que la fasolada.' },
  { code: 'REAL-129', role: 'complete', accepts: [], reason: 'Avgolemono : 30 g de riz, la chair d’un poulet poché et un demi-œuf par part — bouillon, féculent et protéine dans la même louche.' },
  { code: 'REAL-144', role: 'complete', accepts: [], reason: 'Harira : 25 g de lentilles, 50 g de pois chiches et 15 g de vermicelles par part dans une base tomate — la composition confirme le « soupe complète » du corpus.' },
  { code: 'REAL-163', role: 'complete', accepts: [], reason: 'Ugali et sukuma wiki : 83 g de farine de maïs et 133 g de chou kale par part — la fiche porte le féculent et son légume dans le même service, le nom le dit.' },
  { code: 'REAL-200', role: 'complete', accepts: [], reason: 'Jiaozi porc-ciboulette : 62 g de farine, 62 g de porc et 62 g de ciboulette chinoise par part — le ravioli enferme déjà pâte, viande et légume.' },
  { code: 'VEG-003', role: 'complete', accepts: [], reason: 'Quinoa aux légumes rôtis : 70 g de quinoa sec et 238 g de légumes par part — lui adjoindre un féculent ferait doublon avec le quinoa.' },
  { code: 'PROT-001', role: 'complete', accepts: [], reason: 'Cabillaud vapeur et dal : 250 g de poisson, 60 g de lentilles corail et 120 g d’épinards par part — protéine, féculent et légume dans la même assiette.' },
  { code: 'PROT-002', role: 'complete', accepts: [], reason: 'Morue et pois chiches au four : 130 g de morue, 56 g de pois chiches secs et 120 g d’épinards par part.' },
  { code: 'PROT-005', role: 'complete', accepts: [], reason: 'Murgh tandoori et dal palak : 287 g de poulet, 56 g de lentilles corail et 87 g d’épinards par part — le dal tient le rôle du féculent.' },
  { code: 'PROT-006', role: 'complete', accepts: [], reason: 'Filet mignon et lentilles vertes : 295 g de porc, 57 g de lentilles sèches et 130 g de champignons et haricots verts par part.' },
  { code: 'PROT-007', role: 'complete', accepts: [], reason: 'Tajine de veau aux lentilles corail : 280 g de veau, 56 g de lentilles et 100 g de courgettes par part ; les lentilles lient la sauce et tiennent le féculent.' },
  { code: 'PROT-008', role: 'complete', accepts: [], reason: 'Poulet créole et haricots rouges : 300 g de poulet, 55 g de haricots rouges secs et 145 g de légumes par part.' },
  { code: 'PROT-009', role: 'complete', accepts: [], reason: 'Jarret de bœuf braisé : 325 g de jarret, 57 g de lentilles sèches et 200 g d’épinards et champignons par part.' },
  { code: 'IT-007-D1', role: 'complete', accepts: [], reason: 'Pizza à pâte maturée : même assiette que IT-007, la maturation de vingt-quatre heures ne change que la pâte.' },
  { code: 'IT-007-D2', role: 'complete', accepts: [], reason: 'Pizza aux légumes grillés : la garniture ajoute 137 g de courgette, aubergine et poivron par part à la pâte et à la mozzarella — rien ne manque.' },
  { code: 'IT-001-D1', role: 'complete', accepts: [], reason: 'Lasagnes au ragù de bœuf seul : 44 g de pâtes et 100 g de bœuf par part, même montage que IT-001.' },
  { code: 'IT-001-D3', role: 'complete', accepts: [], reason: 'Lasagnes courgettes et lentilles : 44 g de pâtes, 25 g de lentilles sèches et 62 g de courgettes par part — la protéine est végétale, l’assiette est entière.' },

  // ── complete, un vert est offert sans être nécessaire ───────────────────────
  { code: 'FR-004', role: 'complete', accepts: ['vegetables'], reason: 'Hachis parmentier : 200 g de pommes de terre et 117 g de bœuf effiloché par part, et 25 g de carotte qui n’est qu’un fond — la salade est offerte, jamais imposée.' },
  { code: 'FR-005', role: 'complete', accepts: ['vegetables'], reason: 'Quiche lorraine : 47 g de pâte brisée et 37 g de lardons par part dans un appareil œufs-crème, aucun légume — c’est l’exemple même que le dossier du moteur donne du plat qui se suffit ou s’accompagne d’une salade. TARTE SALÉE.' },
  { code: 'FR-017', role: 'complete', accepts: ['vegetables'], reason: 'Poulet rôti et pommes de terre : 300 g de poulet avec os et 200 g de pommes de terre par part, rôtis ensemble ; il ne manque qu’un vert, et seulement si on le veut.' },
  { code: 'FR-029', role: 'complete', accepts: ['vegetables'], reason: 'Tarte thon, tomate et moutarde : 47 g de pâte, 47 g de thon et 83 g de tomate par part sous un appareil œufs-crème — TARTE SALÉE, le mot « tarte » de son libellé ne dit rien de sa garniture.' },
  { code: 'FR-036', role: 'complete', accepts: ['vegetables'], reason: 'Tarte aux poireaux et lardons : 47 g de pâte, 117 g de poireaux fondus et 30 g de lardons par part — c’est LA fiche que le motif de nom « tarte aux » avait classée dessert ; elle est salée de bout en bout.' },
  { code: 'REAL-075', role: 'complete', accepts: ['vegetables'], reason: 'Tartiflette : 200 g de pommes de terre, 83 g de reblochon et 42 g de lardons par part — l’usage savoyard lui adjoint une salade verte, et rien d’autre.' },
  { code: 'REAL-080', role: 'complete', accepts: ['vegetables'], reason: 'Brandade de morue : 117 g de morue, 100 g de pommes de terre et 50 g de pain de campagne par part — protéine et féculent réunis dans la fiche.' },
  { code: 'REAL-088', role: 'complete', accepts: ['vegetables'], reason: 'Flamiche aux poireaux : 53 g de pâte brisée et 150 g de poireaux fondus par part dans un appareil crème-œufs — TARTE SALÉE, pas une pâtisserie, malgré le fond de pâte.' },
  { code: 'REAL-097', role: 'complete', accepts: ['vegetables'], reason: 'Arancini siciliens : 62 g de riz sec, 37 g de bœuf et 31 g de mozzarella par part — la boule porte déjà le féculent et la protéine, il ne lui manque qu’un cru.' },
  { code: 'REAL-116', role: 'complete', accepts: ['vegetables'], reason: 'Gambas al ajillo : 150 g de crevettes et 75 g de pain de campagne par part, le pain étant porté par la fiche pour saucer l’huile à l’ail — protéine et féculent y sont.' },
  { code: 'REAL-128', role: 'complete', accepts: ['vegetables'], reason: 'Kleftiko d’agneau : 233 g d’épaule et 167 g de pommes de terre par part, cuits dans la même papillote.' },
  { code: 'REAL-136', role: 'complete', accepts: ['vegetables'], reason: 'Mujaddara : 58 g de lentilles brunes et 50 g de riz par part sous 133 g d’oignons caramélisés — la salade au yaourt est l’usage levantin, pas une nécessité structurelle.' },
  { code: 'REAL-279', role: 'complete', accepts: ['vegetables'], reason: 'Coxinha de frango : 70 g de poulet effiloché et 50 g de farine par part — la croquette porte pâte et farce, contrairement aux croquetas qui ne portent que de la béchamel.' },
  { code: 'REAL-280', role: 'complete', accepts: ['vegetables'], reason: 'Empanadas argentines : 60 g de pâte et 70 g de bœuf haché au couteau par part — le chausson est l’assiette.' },
  { code: 'VEG-001', role: 'complete', accepts: ['vegetables'], reason: 'Lentilles vertes mijotées : 67 g de lentilles sèches par part, soit protéine ET féculent dans le même grain ; les 50 g de carotte-céleri restent un fond de cuisson, d’où le vert offert.' },
  { code: 'VEG-001-D1', role: 'complete', accepts: ['vegetables'], reason: 'Lentilles aux lardons : 67 g de lentilles et 25 g de lardons par part — même assiette que la base, la salaison ne fait qu’ajouter à la protéine.' },
  { code: 'VEG-001-D2', role: 'complete', accepts: ['vegetables'], reason: 'Lentilles à l’œuf mollet : 67 g de lentilles et deux tiers d’œuf par part — même assiette que la base.' },
  { code: 'VEG-001-D3', role: 'complete', accepts: ['vegetables'], reason: 'Lentilles à la vinaigrette de moutarde : composition identique à la base, les 15 g de moutarde ne sont qu’un assaisonnement.' },

  // ── main, il manque le féculent ─────────────────────────────────────────────
  { code: 'FR-008', role: 'main', accepts: ['starch'], reason: 'Poulet basquaise : 250 g de poulet avec os et 275 g de poivrons et tomate par part, aucun féculent — la sauce appelle du riz.' },
  { code: 'FR-010', role: 'main', accepts: ['starch'], reason: 'Saumon en papillote : 150 g de saumon et 170 g de julienne par part ; les légumes sont là, le féculent n’entre pas dans la papillote.' },
  { code: 'FR-019', role: 'main', accepts: ['starch'], reason: 'Boulettes de bœuf sauce tomate : 125 g de bœuf et 150 g de tomate par part — les 10 g de chapelure lient la boulette, ils ne font pas une ration de féculent.' },
  { code: 'FR-022', role: 'main', accepts: ['starch'], reason: 'Endives au jambon : deux endives et deux tranches de jambon par part ; les 15 g de farine de la béchamel ne font pas un féculent, il manque les pommes vapeur.' },
  { code: 'IND-001', role: 'main', accepts: ['starch'], reason: 'Curry de pois chiches et épinards : 117 g de pois chiches et 67 g d’épinards par part dans une sauce coco-tomate — un curry se verse sur du riz.' },
  { code: 'MED-001', role: 'main', accepts: ['starch'], reason: 'Shakshuka : un œuf et demi et 275 g de tomate et poivron par part, sans féculent dans la poêle — le pain fait partie du service.' },
  { code: 'REAL-095', role: 'main', accepts: ['starch'], reason: 'Pollo alla cacciatora : 250 g de poulet avec os et 175 g de tomate et champignons par part, aucun féculent.' },
  { code: 'REAL-105', role: 'main', accepts: ['starch'], reason: 'Parmigiana di melanzane : 200 g d’aubergine et 85 g de mozzarella et parmesan par part — protéine et légume y sont, le pain est ce qu’on lui adjoint.' },
  { code: 'REAL-142', role: 'main', accepts: ['starch'], reason: 'Tajine de poulet au citron confit : 250 g de poulet et 67 g d’oignons par part — la semoule ou le pain manquent à l’assiette.' },
  { code: 'REAL-154', role: 'main', accepts: ['starch'], reason: 'Poulet yassa : 250 g de poulet et 167 g d’oignons compotés par part — l’usage sénégalais le sert sur du riz blanc.' },
  { code: 'REAL-155', role: 'main', accepts: ['starch'], reason: 'Mafé de bœuf : 125 g de bœuf, 62 g de patate douce et 81 g de carotte et chou par part — la patate douce est un légume de la sauce, pas la ration de féculent, et le mafé se mange sur du riz.' },
  { code: 'REAL-156', role: 'main', accepts: ['starch'], reason: 'Suya de bœuf : 133 g de bœuf en lamelles par part, avec 83 g d’oignon et tomate crus au service — brochette sans féculent.' },
  { code: 'REAL-162', role: 'main', accepts: ['starch'], reason: 'Kenyan beef wet fry : 150 g de bœuf et 133 g de tomate et poivron par part, sauce courte sans féculent — l’ugali ou le chapati manquent.' },
  { code: 'REAL-167', role: 'main', accepts: ['starch'], reason: 'Kedjenou de poulet : 267 g de poulet et 183 g de tomate et aubergine par part, cuits sans eau ni féculent.' },
  { code: 'REAL-198', role: 'main', accepts: ['starch'], reason: 'Fan qie chao dan : deux œufs et 175 g de tomate par part ; les 3 g de sucre corrigent l’acidité de la tomate, et le plat se mange sur du riz.' },
  { code: 'REAL-296', role: 'main', accepts: ['starch'], reason: 'Chicken paprikash : 250 g de poulet et 83 g d’oignons par part dans une sauce à la crème aigre, sans féculent — les nokedli manquent.' },
  { code: 'REAL-300', role: 'main', accepts: ['starch'], reason: 'Beef stroganoff : 133 g de filet de bœuf et 67 g de champignons par part dans une sauce crème aigre-moutarde, sans féculent — le mot « crème » de son libellé de catégorie désigne de la crème AIGRE, pas une pâtisserie.' },

  // ── main, il manque le féculent ET le légume ────────────────────────────────
  { code: 'EGG-001', role: 'main', accepts: ['starch', 'vegetables'], reason: 'Omelette aux fines herbes : deux œufs et 8 g d’herbes par part, rien d’autre dans la poêle — ni féculent ni légume.' },
  { code: 'FR-038', role: 'main', accepts: ['starch', 'vegetables'], reason: 'Lapin à la moutarde : 233 g de lapin par part dans une sauce crème-moutarde ; les 25 g d’échalote sont un aromate, pas un légume.' },
  { code: 'REAL-117', role: 'main', accepts: ['starch', 'vegetables'], reason: 'Bacalao al pil-pil : 200 g de morue par part émulsionnée à l’huile et à l’ail — la fiche ne contient rien d’autre.' },
  { code: 'REAL-187', role: 'main', accepts: ['starch', 'vegetables'], reason: 'Vindaloo de porc : 183 g de porc par part dans une pâte d’épices vinaigrée ; les 20 g de jaggery équilibrent l’acidité et l’oignon est un aromate.' },
  { code: 'REAL-210', role: 'main', accepts: ['starch', 'vegetables'], reason: 'San bei ji : 225 g de poulet par part glacé au soja et au sésame ; les 30 g de sucre candi font la laque, il n’y a ni légume ni féculent.' },
  { code: 'REAL-244', role: 'main', accepts: ['starch', 'vegetables'], reason: 'Thịt kho trứng : 167 g de poitrine de porc et 1,3 œuf dur par part — les 70 g de sucre font le caramel de braisage, et il manque le riz comme les crudités.' },
  { code: 'REAL-259', role: 'main', accepts: ['starch', 'vegetables'], reason: 'Chicken adobo : 250 g de poulet avec os par part braisé au vinaigre de canne et au soja, sans aucun accompagnement dans la fiche.' },
  { code: 'REAL-288', role: 'main', accepts: ['starch', 'vegetables'], reason: 'Jerk chicken : 225 g de poulet par part sortant du gril, marinade comprise ; les 40 g de sucre brun équilibrent le scotch bonnet, et rien n’accompagne la viande.' },

  // ── main, il ne manque que le légume ────────────────────────────────────────
  { code: 'LEV-002', role: 'main', accepts: ['vegetables'], reason: 'Falafels au four : 87 g de pois chiches secs par part, soit la protéine ET le féculent dans la même boulette — il ne manque que le cru, jamais du riz.' },

  // ── side, c'est déjà un accompagnement ──────────────────────────────────────
  { code: 'FR-006', role: 'side', accepts: [], reason: 'Gratin dauphinois : 233 g de pommes de terre à la crème par part et aucune protéine — le corpus le range lui-même en accompagnement.' },
  { code: 'FR-020', role: 'side', accepts: [], reason: 'Gratin de courgettes : 200 g de courgettes par part liées à un demi-œuf et 20 g de comté — un gratin de légumes est une garniture, pas une assiette.' },
  { code: 'FR-026', role: 'side', accepts: [], reason: 'Haricots verts persillés : 175 g de haricots par part, du beurre et du persil, rien d’autre.' },
  { code: 'FR-034', role: 'side', accepts: [], reason: 'Poireaux vinaigrette : 200 g de poireaux et une vinaigrette par part, les œufs durs étant marqués facultatifs — ni protéine ni féculent.' },
  { code: 'VEG-002', role: 'side', accepts: [], reason: 'Salade de pois chiches, tomate et concombre : 125 g de pois chiches et 160 g de crudités par part, autour de 250 kcal — une salade de mezze, trop légère pour tenir un repas.' },
  { code: 'REAL-092', role: 'side', accepts: [], reason: 'Piperade basquaise : 350 g de poivrons et tomate compotés par part ; les œufs et le jambon de la fiche sont marqués facultatifs et « service », la compotée seule est une garniture.' },
  { code: 'REAL-106', role: 'side', accepts: [], reason: 'Caponata sicilienne : 125 g d’aubergine par part avec olives et câpres — les 40 g de sucre équilibrent les 80 ml de vinaigre, c’est un contorno qui se mange à la fourchette.' },
  { code: 'REAL-109', role: 'side', accepts: [], reason: 'Croquetas de jamón : 22 g de jambon par part dans une béchamel panée — une tapa, jamais un plat, contrairement à la coxinha qui porte 70 g de poulet.' },
  { code: 'REAL-114', role: 'side', accepts: [], reason: 'Gazpacho andalou : 200 g de tomate, 75 g de crudités et 17 g de pain par part, aucune protéine — le corpus range déjà ses veloutés de légumes en accompagnement.' },
  { code: 'REAL-124', role: 'side', accepts: [], reason: 'Dolmades : 44 g de riz cru par part enroulés dans des feuilles de vigne, sans protéine — un mezzé, comme le taboulé libanais déjà rangé en accompagnement.' },
  { code: 'REAL-130', role: 'side', accepts: [], reason: 'İmam bayıldı : une aubergine et 180 g de compotée d’oignon-tomate par part, ni protéine ni féculent ; les 8 g de sucre facultatifs corrigent l’acidité de la tomate.' },
  { code: 'REAL-160', role: 'side', accepts: [], reason: 'Kelewele : 167 g de plantain frit par part, relevé au gingembre, au clou de girofle et au piment de Cayenne — le sucré vient du fruit mûr, aucun sucre n’est ajouté, c’est une garniture salée.' },
  { code: 'REAL-166', role: 'side', accepts: [], reason: 'Chakalaka : 190 g de poivron, carotte, chou et tomate par part relevés au curry — un relish qui se pose à côté du pap et de la viande.' },

  // ── component, une base dont on tire plusieurs plats ────────────────────────
  { code: 'FR-024', role: 'component', accepts: [], reason: 'Béchamel de base : 60 g de roux pour 750 ml de lait — elle nappe, elle lie, elle gratine ; le corpus la range déjà en sauce de base et lui déclare un rendement.' },
  { code: 'LEV-001', role: 'component', accepts: [], reason: 'Houmous : 62 g de pois chiches et 12 g de tahini par part, mixés en tartinade — il se trempe et s’étale, comme le tzatziki et le guacamole déjà déclarés « component ».' },
  { code: 'REAL-139', role: 'component', accepts: [], reason: 'Baba ganoush : 125 g d’aubergine fumée par part réduite en purée au tahini — une tartinade à la cuillère, pas une portion de légume à la fourchette comme la caponata.' },
  { code: 'REAL-202', role: 'component', accepts: [], reason: 'Cong you bing : 83 g de farine par part, une galette feuilletée à la ciboule qu’on fait par fournée — un pain plat, comme le msemen et les blinis déjà déclarés « component ».' },

  // ── dessert, jamais un créneau de repas ─────────────────────────────────────
  { code: 'REAL-091', role: 'dessert', accepts: [], reason: 'Far breton aux pruneaux : 160 g de sucre, 200 g de farine, 900 ml de lait et 350 g de pruneaux pour dix parts — c’est LA fiche servie au dîner de dimanche, et un flan sucré ne peut occuper un créneau de repas.' },
  { code: 'DESS-002', role: 'dessert', accepts: [], reason: 'Pancakes moelleux : 35 g de sucre, 12 g de levure chimique et 250 g de farine pour quatre parts ; le corpus les range en « petit-déjeuner », donc aucun balayage de libellé ne les aurait vus — même arbitrage que les crêpes fines (DESS-001), le rôle dessert les sort des créneaux de repas sans leur retirer le petit-déjeuner, qui passe par la rotation des supports.' },
]

/**
 * Ce que le libellé aurait capturé À TORT, consigné pour que le prochain lot ne
 * refasse pas le rapprochement. Ces plats sont SALÉS — ou, pour les derniers, le
 * sucre y est un correcteur d'acidité, pas une intention de dessert.
 */
const FAUX_AMIS = [
  { code: 'FR-005', pourquoi: 'Rangée en « tarte salée » au corpus. Un motif de nom ou de catégorie sur « tarte » en fait un dessert ; elle porte 220 g de lardons fumés et pas un gramme de sucre.' },
  { code: 'FR-029', pourquoi: 'Rangée en « tarte salée » au corpus. Thon en conserve, moutarde de Dijon et comté : le mot « tarte » ne dit rien de la garniture.' },
  { code: 'FR-036', pourquoi: 'C’est la fiche que le moteur captait par un motif sur « tarte aux » et sortait des repas. 700 g de poireaux et 180 g de lardons pour six parts.' },
  { code: 'REAL-088', pourquoi: 'Rangée en « tarte salée » au corpus. Fond de pâte brisée et 900 g de poireaux fondus dans un appareil crème-œufs, sans sucre.' },
  { code: 'REAL-300', pourquoi: 'Rangé en « bœuf sauce crème aigre » au corpus. Le mot « crème » d’un libellé de catégorie ne fait pas une pâtisserie : c’est de la crème aigre montée à la moutarde sur du filet de bœuf.' },
  { code: 'REAL-160', pourquoi: 'Rangé en « bananes plantain épicées », profil sensoriel sweet=5, et une règle sur « banane » le rapprocherait du banana bread. C’est du plantain mûr frit au gingembre, au clou de girofle et au piment de Cayenne, servi avec des arachides grillées ; aucun sucre ajouté.' },
  { code: 'REAL-244', pourquoi: '70 g de sucre semoule à la fiche, soit le plus gros poste sucré du lot après le far breton. Ce sucre fait le CARAMEL de braisage d’une poitrine de porc à la sauce poisson : un plat franchement salé.' },
  { code: 'REAL-106', pourquoi: '40 g de sucre semoule. Ils équilibrent 80 ml de vinaigre de vin rouge dans un aigre-doux d’aubergines aux câpres et aux olives ; c’est un contorno.' },
  { code: 'REAL-288', pourquoi: '40 g de sucre brun dans la marinade, qui équilibrent cinq piments scotch bonnet. Le plat sort du gril, pas du four à pâtisserie.' },
  { code: 'REAL-139', pourquoi: 'profil sensoriel « smoky_sweet », sweet=3, à cause de l’aubergine brûlée. C’est une purée au tahini, au citron et à l’ail, salée et fumée.' },
  { code: 'REAL-202', pourquoi: 'Rangé en « galette feuilletée » au corpus, et le mot galette penche vers la pâtisserie. C’est un pain plat à la ciboule, 8 g de sel et pas de sucre.' },
]

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))

const poses = []
const refus = []
for (const decision of DECISIONS) {
  const recette = parCode.get(decision.code)
  if (!recette) {
    refus.push(`${decision.code} : absent du corpus`)
    continue
  }
  // Un rôle déjà déclaré ne se réécrit pas en silence : le rôle DÉCLARÉ prime
  // sur toute déduction, y compris la nôtre.
  if (recette.plate?.role && recette.plate.role !== decision.role) {
    refus.push(`${decision.code} ${recette.family} : déclare déjà « ${recette.plate.role} », non écrasé`)
    continue
  }
  recette.plate = { role: decision.role, accepts: decision.accepts, reason: decision.reason }
  poses.push(`${decision.code.padEnd(12)} ${decision.role.padEnd(10)} ${JSON.stringify(decision.accepts).padEnd(18)} ${recette.family}`)
}

console.log(`${poses.length} rôle(s) d'assiette posé(s) :`)
for (const ligne of poses) console.log(`  ${ligne}`)

if (refus.length) {
  console.log(`\n${refus.length} refus :`)
  for (const ligne of refus) console.log(`  ${ligne}`)
}

console.log('\nÉcartés à dessein, le libellé les rangeait à tort parmi les sucrés :')
for (const faux of FAUX_AMIS) {
  const recette = parCode.get(faux.code)
  console.log(`  ${faux.code.padEnd(12)} ${recette?.family || '?'} — ${faux.pourquoi}`)
}

const parRole = {}
for (const recette of corpus.recipes) {
  const role = recette.plate?.role || '(non déclaré)'
  parRole[role] = (parRole[role] || 0) + 1
}
console.log('\nRépartition des rôles au corpus :', JSON.stringify(parRole))

const duLot = {}
for (const decision of DECISIONS) duLot[decision.role] = (duLot[decision.role] || 0) + 1
console.log(`Répartition du lot (${DECISIONS.length} fiches) :`, JSON.stringify(duLot))

if (dryRun) {
  console.log('\nSimulation : rien écrit.')
} else {
  writeFileSync(CORPUS, `${JSON.stringify(corpus, null, 2)}\n`)
  console.log(`\n${CORPUS} mis à jour.`)
}

export { DECISIONS, FAUX_AMIS }
