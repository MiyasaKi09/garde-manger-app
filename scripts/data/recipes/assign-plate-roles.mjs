/**
 * assign-plate-roles.mjs
 *
 * Propose des rôles `plate` pour les 285 recettes du corpus V3 qui n'en ont
 * pas encore. Le script PROPOSE — il ne modifie pas le corpus directement.
 * Sa sortie JSON sert de base à l'arbitrage éditorial documenté dans
 * data/recipes/plate-roles-lot01.json.
 *
 * LOGIQUE :
 *   1. Heuristiques catégorie (passage rapide, confiance haute pour les cas nets)
 *   2. Analyse des rôles ingrédients (détection protéine / féculent / légume)
 *   3. Score sensoriel (sweet ≥ 4 dans une catégorie sucrée → dessert)
 *   4. Surcharges éditoriales explicites pour les cas ambigus
 *
 * Un rôle faux est pire qu'un rôle absent : le script émet INCERTAIN
 * plutôt que de deviner.
 *
 * Usage : node scripts/data/recipes/assign-plate-roles.mjs [--apply]
 *   Sans --apply : affiche les propositions en JSON sur stdout.
 *   Avec --apply  : applique les décisions finales (surcharges incluses)
 *                   directement dans data/recipes/corpus-v3.json.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS_PATH = join(ROOT, 'data', 'recipes', 'corpus-v3.json')

// ── Vocabulaire de catégories sucrées ─────────────────────────────────────────
// Ces catégories garantissent un rôle dessert sans analyse supplémentaire.
const SWEET_CATEGORIES = new Set([
  'dessert',
  'dessert froid',
  'dessert et petit-déjeuner',
  'gâteau',
  'petit gâteau',
  'tarte sucrée',
  'pâtisserie',
  'pâtisserie levée feuilletée',
  'flan cuit',
  'petit-déjeuner',   // DESS-002 : pain perdu / pancakes — restent dessert
])

// Préfixes de codes = indicateur fort de catégorie
const SWEET_CODE_PREFIXES = new Set(['DESS-'])

// ── Rôles ingrédients qui comptent comme protéine / féculent / légume ─────────
const PROTEIN_ROLES = new Set([
  'viande', 'protéine', 'poisson', 'fruits de mer', 'protéine végétale',
  'viande de volaille', 'principal', 'fruits_de_mer',
])
const STARCH_ROLES = new Set([
  'féculent', 'pâtes', 'riz', 'céréale', 'base', 'pâte',
  'fond', 'enveloppe', 'farce', 'légumineuse',
])
const VEG_ROLES = new Set([
  'légume', 'légumes', 'garniture',
])

// ── Catégories → rôle automatique (confiance A ou B) ─────────────────────────
// Seuls les cas vraiment nets sont ici. Le reste passe par la détection ou
// les surcharges éditoriales.
const CATEGORY_ROLE_MAP = {
  // Accompagnements explicites
  'accompagnement': { role: 'side', accepts: [], confidence: 'A' },
  'tartinade': { role: 'component', accepts: [], confidence: 'A' },
  'tartinade de poivron et noix': { role: 'component', accepts: [], confidence: 'A' },
  'sauce de base': { role: 'component', accepts: [], confidence: 'A' },
  'purée d aubergine fumée': { role: 'component', accepts: [], confidence: 'A' },
  // Salades de légumes
  'salade de papaye verte': { role: 'side', accepts: [], confidence: 'A' },
  'condiment de légumes': { role: 'side', accepts: [], confidence: 'A' },
  'relish de légumes': { role: 'side', accepts: [], confidence: 'A' },
  // Bouillons fins
  'bouillon de betterave': { role: 'side', accepts: [], confidence: 'A' },
  'bouillon épicé au tamarin': { role: 'side', accepts: [], confidence: 'A' },
  // Tapas / snacks
  'tapas frits': { role: 'side', accepts: [], confidence: 'A' },
  'tapas de crevettes': { role: 'side', accepts: [], confidence: 'A' },
  'friture légère': { role: 'side', accepts: [], confidence: 'B' },
  'beignets': { role: 'side', accepts: [], confidence: 'B' },
  'beignets de haricots': { role: 'side', accepts: [], confidence: 'B' },
  'boulettes de poulpe': { role: 'side', accepts: [], confidence: 'A' },
  'croquette de poulet': { role: 'side', accepts: [], confidence: 'B' },
  'croquettes de riz': { role: 'side', accepts: [], confidence: 'B' },
  'chaussons': { role: 'side', accepts: [], confidence: 'B' },
  'petits pains au fromage': { role: 'side', accepts: [], confidence: 'B' },
  'feuille frite farcie': { role: 'side', accepts: [], confidence: 'B' },
  // Soupes légères
  'soupe froide': { role: 'side', accepts: [], confidence: 'A' },
  'soupe froide épaisse': { role: 'side', accepts: [], confidence: 'A' },
  'soupe de chou': { role: 'side', accepts: [], confidence: 'B' },
  'soupe de tomate et pain': { role: 'side', accepts: [], confidence: 'B' },
  'soupe aigre-piquante': { role: 'side', accepts: [], confidence: 'B' },
  'soupe aigre pimentée': { role: 'side', accepts: [], confidence: 'B' },
  'soupe tomate piment tortilla': { role: 'side', accepts: [], confidence: 'B' },
  // Légumes / féculents seuls
  'purée filante': { role: 'side', accepts: [], confidence: 'A' },
  'pommes de terre chou-fleur': { role: 'side', accepts: [], confidence: 'A' },
  'aubergine fumée': { role: 'side', accepts: [], confidence: 'A' },
  'aubergine sauce parfum poisson': { role: 'side', accepts: [], confidence: 'A' },
  'lentilles noires crémeuses': { role: 'side', accepts: [], confidence: 'B' },
  'ragoût de lentilles': { role: 'side', accepts: [], confidence: 'B' },
  'ragoût de pois chiche': { role: 'side', accepts: [], confidence: 'B' },
  'bananes plantain épicées': { role: 'side', accepts: [], confidence: 'A' },
  'haricots verts frits à sec': { role: 'side', accepts: [], confidence: 'A' },
  'maïs de rue en salade': { role: 'side', accepts: [], confidence: 'A' },
  'omelette roulée': { role: 'side', accepts: [], confidence: 'B' }, // Tamagoyaki
  'pain plat levé': { role: 'side', accepts: [], confidence: 'B' },
  'galette feuilletée à la ciboule': { role: 'side', accepts: [], confidence: 'B' },
  // Gâteaux de riz coréens = snack
  'gâteaux de riz pimentés': { role: 'side', accepts: [], confidence: 'B' },
  // Flan de haricots = moi moi
  'flan de haricots': { role: 'side', accepts: [], confidence: 'B' },
  // Plantain pilé (avec garniture crevette = complete — voir surcharges)
  'plantain pilé': { role: 'side', accepts: [], confidence: 'C' }, // surcharge éditoriale
}

// ── Surcharges éditoriales ─────────────────────────────────────────────────────
// Chaque décision porte : role, accepts, reason, confidence.
// Cette table prime sur toute heuristique automatique.
const EDITORIAL_OVERRIDES = {
  // ── DESSERTS ────────────────────────────────────────────────────────────────
  'DESS-001': { role: 'dessert', accepts: [], reason: 'Crêpes fines sucrées : dessert ou goûter emblématique de la cuisine française, sucré par tradition même si la pâte est neutre.' },
  'DESS-002': { role: 'dessert', accepts: [], reason: 'Recette de petit-déjeuner sucrée (code DESS-) : pain perdu ou pancakes, consommée comme dessert ou collation, pas comme plat.' },
  'DESS-003': { role: 'dessert', accepts: [], reason: 'Gâteau. Dessert de fin de repas.' },
  'DESS-004': { role: 'dessert', accepts: [], reason: 'Dessert froid : panna cotta ou équivalent. Servi en fin de repas.' },
  'DESS-005': { role: 'dessert', accepts: [], reason: 'Dessert froid. Servi en fin de repas.' },
  'DESS-006': { role: 'dessert', accepts: [], reason: 'Pâtisserie sucrée. Dessert de fin de repas.' },
  'DESS-007': { role: 'dessert', accepts: [], reason: 'Dessert. Servi en fin de repas.' },
  'DESS-008': { role: 'dessert', accepts: [], reason: 'Dessert. Servi en fin de repas.' },
  'DESS-009': { role: 'dessert', accepts: [], reason: 'Gâteau. Dessert de fin de repas.' },
  'DESS-010': { role: 'dessert', accepts: [], reason: 'Gâteau. Dessert de fin de repas.' },
  'DESS-011': { role: 'dessert', accepts: [], reason: 'Tarte sucrée. Dessert de fin de repas.' },
  'DESS-012': { role: 'dessert', accepts: [], reason: 'Dessert froid : mousse au chocolat ou crème glacée. Servi en fin de repas.' },
  'FR-030':   { role: 'dessert', accepts: [], reason: 'Dessert français classique. Servi en fin de repas.' },
  'FR-032':   { role: 'dessert', accepts: [], reason: 'Tarte sucrée française. Dessert de fin de repas.' },
  'FR-039':   { role: 'dessert', accepts: [], reason: 'Tarte aux fruits sucrée. Dessert de fin de repas.' },
  'FR-040':   { role: 'dessert', accepts: [], reason: 'Petit gâteau français. Dessert de fin de repas.' },
  'REAL-089': { role: 'dessert', accepts: [], reason: 'Kouign-amann : pâtisserie levée feuilletée bretonne, ~1006 kcal/portion, très sucré (score sensoriel 5/5). Dessert riche de fin de repas — pas un plat du soir.' },
  'REAL-090': { role: 'dessert', accepts: [], reason: 'Petit gâteau sucré. Dessert de fin de repas.' },
  'REAL-091': { role: 'dessert', accepts: [], reason: 'Far breton aux pruneaux : flan cuit sucré, dessert emblématique de Bretagne. Servi en fin de repas.' },
  'REAL-122': { role: 'dessert', accepts: [], reason: 'Pâtisserie sucrée internationale. Dessert de fin de repas.' },

  // ── COMPOSANTS ──────────────────────────────────────────────────────────────
  'FR-024':   { role: 'component', accepts: [], reason: 'Béchamel de base : sauce de liaison, jamais servie seule — entre dans les gratins, lasagnes, endives au jambon.' },
  'LEV-001':  { role: 'component', accepts: [], reason: 'Houmous : tartinade à base de pois chiches, sert de condiment ou de trempette, jamais plat principal.' },
  'REAL-139': { role: 'component', accepts: [], reason: 'Baba ganoush : purée d'aubergine fumée, condiment/trempette du répertoire levantin — jamais servi seul comme plat.' },
  'REAL-140': { role: 'component', accepts: [], reason: 'Muhammara : tartinade de poivron et noix, condiment/trempette syrien — jamais servi seul comme plat.' },

  // ── ACCOMPAGNEMENTS ─────────────────────────────────────────────────────────
  'FR-006':   { role: 'side', accepts: [], reason: 'Gratin dauphinois : féculent crémeux servi en accompagnement, sans protéine animale ni légume vert propre.' },
  'FR-026':   { role: 'side', accepts: [], reason: 'Accompagnement de légumes ou féculent, sans protéine.' },
  'FR-034':   { role: 'side', accepts: [], reason: 'Entrée française classique, légère, sans féculent ni protéine principale.' },
  'REAL-076': { role: 'side', accepts: [], reason: 'Aligot de l'Aubrac : purée filante au fromage, accompagnement de la cuisine auvergnate — sans protéine principale.' },
  'REAL-096': { role: 'side', accepts: [], reason: 'Vitello tonnato : veau froid sauce thon, servi comme entrée froide en Italie — portion de starter, pas un plat principal.' },
  'REAL-097': { role: 'side', accepts: [], reason: 'Croquettes de riz (arancini) : snack/tapas, portions réduites.' },
  'REAL-099': { role: 'side', accepts: [], reason: 'Pappa al pomodoro : soupe épaisse de pain et tomate, primo piatto léger sans protéine animale.' },
  'REAL-106': { role: 'side', accepts: [], reason: 'Condiment de légumes : accompagnement, pas un plat.' },
  'REAL-107': { role: 'side', accepts: [], reason: 'Pain plat levé : pain-accompagnement, sans protéine ni légume.' },
  'REAL-109': { role: 'side', accepts: [], reason: 'Tapas frits espagnols : petites portions, snack ou mise en bouche.' },
  'REAL-114': { role: 'side', accepts: [], reason: 'Gazpacho : soupe froide de légumes, entrée rafraîchissante sans protéine.' },
  'REAL-115': { role: 'side', accepts: [], reason: 'Salmorejo : soupe froide épaisse de tomate et pain, entrée andalouse sans protéine.' },
  'REAL-116': { role: 'side', accepts: [], reason: 'Gambas al ajillo : tapas de crevettes à l'ail, portion de mise en bouche typiquement petite.' },
  'REAL-120': { role: 'side', accepts: [], reason: 'Caldo verde : soupe de chou portugaise avec un peu de chouriço en garniture — trop léger pour être le plat principal.' },
  'REAL-124': { role: 'side', accepts: [], reason: 'Dolmades végétariens (riz et herbes) : meze grec sans protéine principale.' },
  'REAL-130': { role: 'side', accepts: [], reason: 'İmam bayıldı : aubergines braisées à l'huile d'olive et tomates, meze ottoman végétarien sans protéine.' },
  'REAL-137': { role: 'side', accepts: [], reason: 'Fattoush : salade levantine de légumes et pain pita grillé, sans protéine.' },
  'REAL-147': { role: 'side', accepts: [], reason: 'Brik à l'œuf : chausson frit nord-africain, entrée individuelle ou snack.' },
  'REAL-149': { role: 'side', accepts: [], reason: 'Misir wat : ragoût de lentilles corail éthiopien, accompagnement sur injera dans un repas multi-plats.' },
  'REAL-150': { role: 'side', accepts: [], reason: 'Shiro wat : ragoût de farine de pois chiche éthiopien, accompagnement sur injera.' },
  'REAL-156': { role: 'side', accepts: [], reason: 'Suya de bœuf : brochettes épicées d'Afrique de l'Ouest, snack de rue ou entrée.' },
  'REAL-158': { role: 'side', accepts: [], reason: 'Moi moi : gâteau de haricots cuit vapeur, accompagnement ou snack nigérian.' },
  'REAL-159': { role: 'side', accepts: [], reason: 'Akara : beignets de haricots frits, snack/breakfast nigérian.' },
  'REAL-160': { role: 'side', accepts: [], reason: 'Kelewele : bananes plantain épicées sautées, snack ou accompagnement ghanéen.' },
  'REAL-166': { role: 'side', accepts: [], reason: 'Chakalaka : relish de légumes épicés d'Afrique du Sud, condiment pour braai.' },
  'REAL-173': { role: 'side', accepts: [], reason: 'Saag paneer : épinards au fromage indien, plat d'accompagnement typique du thali — servi avec riz ou chapati.' },
  'REAL-176': { role: 'side', accepts: [], reason: 'Aloo gobi : pommes de terre et chou-fleur sautés, plat de légumes indien en accompagnement.' },
  'REAL-177': { role: 'side', accepts: [], reason: 'Baingan bharta : purée d'aubergine fumée indienne, plat de légumes en accompagnement.' },
  'REAL-179': { role: 'side', accepts: [], reason: 'Sambar : soupe de toor dal et légumes, accompagnement du repas sud-indien (avec dosa ou idli).' },
  'REAL-180': { role: 'side', accepts: [], reason: 'Rasam : bouillon épicé au tamarin, soupe fine digestive du repas sud-indien.' },
  'REAL-182': { role: 'side', accepts: [], reason: 'Idli (gâteau vapeur fermenté de riz et lentilles) : pain levé vapeur, accompagnement ou snack du petit-déjeuner sud-indien.' },
  'REAL-183': { role: 'side', accepts: [], reason: 'Vada pav : sandwich de beignet de pomme de terre, snack/street food indien sans protéine animale.' },
  'REAL-185': { role: 'side', accepts: [], reason: 'Samosa aux pommes de terre : chausson frit épicé, snack/entrée indien.' },
  'REAL-186': { role: 'side', accepts: [], reason: 'Pakora d'oignons : beignets de légumes en pâte de farine de pois chiche, snack/entrée.' },
  'REAL-196': { role: 'side', accepts: [], reason: 'Aubergine à la sauce parfum de poisson : plat de légumes chinois en accompagnement.' },
  'REAL-197': { role: 'side', accepts: [], reason: 'Haricots verts frits à sec (gan bian si ji dou) : légume sauté chinois, accompagnement.' },
  'REAL-202': { role: 'side', accepts: [], reason: 'Cong you bing : galette feuilletée à la ciboule, pain-snack chinois sans protéine ni légume.' },
  'REAL-207': { role: 'side', accepts: [], reason: 'Suanla tang (soupe aigre-piquante) : soupe servie en entrée dans le repas chinois.' },
  'REAL-218': { role: 'side', accepts: [], reason: 'Takoyaki : boulettes de poulpe, snack de rue japonais.' },
  'REAL-225': { role: 'side', accepts: [], reason: 'Tamagoyaki : omelette roulée sucrée-salée japonaise (score sucré 5/5), accompagnement de bento ou sushi — pas un dessert, catégorie omelette.' },
  'REAL-231': { role: 'side', accepts: [], reason: 'Tteokbokki : gâteaux de riz coréens pimentés en sauce, street food sans protéine substantielle.' },
  'REAL-248': { role: 'side', accepts: [], reason: 'Tom yum goong : soupe épicée de crevettes, entrée/soupe thaïlandaise dans un repas multi-plats.' },
  'REAL-250': { role: 'side', accepts: [], reason: 'Som tam : salade de papaye verte, accompagnement thaïlandais.' },
  'REAL-271': { role: 'side', accepts: [], reason: 'Sopa de tortilla : soupe de tortilla mexicaine, entrée légère sans protéine substantielle.' },
  'REAL-273': { role: 'side', accepts: [], reason: 'Ceviche de poisson : poisson mariné au citron vert, entrée fraîche mexicaine.' },
  'REAL-274': { role: 'side', accepts: [], reason: 'Esquites : maïs de rue mexicain en salade, snack.' },
  'REAL-278': { role: 'side', accepts: [], reason: 'Pão de queijo : petits pains au fromage brésiliens, snack ou pain d'accompagnement.' },
  'REAL-279': { role: 'side', accepts: [], reason: 'Coxinha de frango : croquettes de poulet brésiliennes, snack/street food.' },
  'REAL-280': { role: 'side', accepts: [], reason: 'Empanadas argentines : chaussons farcis à la viande, entrée ou snack.' },
  'REAL-284': { role: 'side', accepts: [], reason: 'Causa limeña : terrine froide de pomme de terre jaune péruvienne, entrée froide.' },
  'REAL-299': { role: 'side', accepts: [], reason: 'Barszcz czerwony : bouillon de betterave polonais, premier service du repas de Noël.' },

  // ── PLATS PRINCIPAUX ─────────────────────────────────────────────────────────
  'FR-001': { role: 'main', accepts: ['starch'], reason: 'Bœuf bourguignon : bœuf braisé au vin rouge sans féculent dans la casserole — appelle des pommes vapeur ou des pâtes.' },
  'FR-002': { role: 'main', accepts: ['starch'], reason: 'Blanquette de veau : viande blanche en sauce, sans féculent — se sert avec du riz blanc.' },
  'FR-008': { role: 'main', accepts: ['starch'], reason: 'Poulet basquaise : volaille en sauce tomate-poivrons, sans féculent dans la recette.' },
  'FR-016': { role: 'main', accepts: ['starch'], reason: 'Coq au vin : volaille braisée au vin rouge, sans féculent — sert avec des pommes vapeur ou des tagliatelles.' },
  'FR-019': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Boulettes de bœuf sauce tomate : protéine en sauce sans féculent ni légume incorporé.' },
  'FR-038': { role: 'main', accepts: ['starch'], reason: 'Lapin à la moutarde : lapin braisé en sauce crémée, sans féculent.' },
  'REAL-078': { role: 'main', accepts: ['starch'], reason: 'Axoa de veau : sauté de veau aux piments basques, sans féculent — sert avec des pommes vapeur ou du pain.' },
  'REAL-081': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Sole meunière : poisson poêlé sans garniture intégrée — appelle pommes vapeur ou haricots verts.' },
  'REAL-086': { role: 'main', accepts: ['starch'], reason: 'Œufs en meurette : œufs pochés en sauce au vin rouge, servis sur des croutons — pas de féculent dans la casserole.' },
  'REAL-093': { role: 'main', accepts: ['starch'], reason: 'Ossobuco alla milanese : jarret de veau braisé sans féculent, traditionnellement servi avec risotto alla milanese.' },
  'REAL-094': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Saltimbocca alla romana : escalope de veau à la sauge et prosciutto, sans féculent ni légume.' },
  'REAL-095': { role: 'main', accepts: ['starch'], reason: 'Pollo alla cacciatora : poulet chasseur en sauce tomate, sans féculent dans la recette.' },
  'REAL-117': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Bacalao al pil-pil : morue en émulsion d'huile et ail, sans féculent ni légume — appelle des pommes vapeur et des légumes verts.' },
  'REAL-127': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Souvlaki de porc : brochettes grillées grecques, servies avec pita et salade dans le plat traditionnel.' },
  'REAL-142': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Tajine de poulet citron-olives : sans féculent ni légume intégré — appelle couscous ou pain et légumes.' },
  'REAL-143': { role: 'main', accepts: ['starch'], reason: 'Tajine d'agneau aux pruneaux : sucré-salé marocain (score sucré 5/5 — reste un tajine savoureux), sans féculent.' },
  'REAL-148': { role: 'main', accepts: ['starch'], reason: 'Doro wat : poulet éthiopien au berbéré, servi sur injera (féculent non intégré à la recette).' },
  'REAL-151': { role: 'main', accepts: ['starch'], reason: 'Tibs de bœuf : sauté de bœuf éthiopien, servi sur injera.' },
  'REAL-154': { role: 'main', accepts: ['starch'], reason: 'Poulet yassa : poulet sénégalais à l'oignon et citron, servi avec riz blanc.' },
  'REAL-155': { role: 'main', accepts: ['starch'], reason: 'Mafé de bœuf : ragoût à l'arachide d'Afrique de l'Ouest, servi avec riz blanc.' },
  'REAL-157': { role: 'main', accepts: ['starch'], reason: 'Egusi soup : soupe de graines de melon avec bœuf et poisson fumé, servie avec fufu ou pounded yam.' },
  'REAL-162': { role: 'main', accepts: ['starch'], reason: 'Kenyan beef wet fry : bœuf sauté en sauce tomate, servi avec ugali ou chapati.' },
  'REAL-164': { role: 'main', accepts: ['starch'], reason: 'Bobotie : hachis d'agneau gratiné sud-africain, servi avec du riz jaune.' },
  'REAL-167': { role: 'main', accepts: ['starch'], reason: 'Kedjenou de poulet : étouffé ivoirien de poulet aux légumes, servi avec riz ou attiéké.' },
  'REAL-168': { role: 'main', accepts: ['starch'], reason: 'Butter chicken : curry de poulet crémeux, servi avec riz basmati ou naan.' },
  'REAL-169': { role: 'main', accepts: ['starch'], reason: 'Chicken tikka masala : curry crémeux de poulet, servi avec riz basmati ou naan.' },
  'REAL-170': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Tandoori chicken : poulet mariné et grillé au four, servi avec naan, salade et chutney.' },
  'REAL-172': { role: 'main', accepts: ['starch'], reason: 'Rogan josh : curry d'agneau du Cachemire, servi avec riz basmati ou naan.' },
  'REAL-174': { role: 'main', accepts: ['starch'], reason: 'Chana masala : curry de pois chiches, servi avec riz ou chapati.' },
  'REAL-175': { role: 'main', accepts: ['starch'], reason: 'Rajma masala : curry de haricots rouges (rajma-chawal), servi avec riz.' },
  'REAL-178': { role: 'main', accepts: ['starch'], reason: 'Dal makhani : lentilles noires et haricots rouges braisés, servi avec riz ou naan.' },
  'REAL-187': { role: 'main', accepts: ['starch'], reason: 'Vindaloo de porc : curry vinaigré goanais, servi avec riz.' },
  'REAL-188': { role: 'main', accepts: ['starch'], reason: 'Nihari : jarret de bœuf braisé pakistanais, servi avec pain naan ou roti.' },
  'REAL-190': { role: 'main', accepts: ['starch'], reason: 'Keema matar : viande hachée aux petits pois, servi avec riz ou chapati.' },
  'REAL-191': { role: 'main', accepts: ['starch'], reason: 'Mapo tofu : tofu soyeux en sauce pimentée, servi avec riz blanc.' },
  'REAL-192': { role: 'main', accepts: ['starch'], reason: 'Gong bao ji ding (Kung pao chicken) : poulet sauté aux cacahuètes, servi avec riz blanc.' },
  'REAL-194': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Hong shao rou : poitrine de porc braisée rouge, servie avec riz blanc et légumes verts.' },
  'REAL-195': { role: 'main', accepts: ['starch'], reason: 'Hui guo rou (porc deux fois cuit) : porc sauté au doubanjiang, servi avec riz blanc.' },
  'REAL-198': { role: 'main', accepts: ['starch'], reason: 'Fan qie chao dan (tomate-œufs sautés) : plat de protéine-légume emblématique, servi avec riz blanc.' },
  'REAL-199': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Lion's head meatballs : grosses boulettes de porc braisées, sans féculent ni légume intégré.' },
  'REAL-204': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Char siu : porc rôti laqué cantonais, servi avec riz et légumes verts.' },
  'REAL-205': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Poisson vapeur au gingembre et ciboule : poisson entier sans accompagnement intégré.' },
  'REAL-210': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'San bei ji (trois tasses) : poulet taïwanais aux trois sauces, servi avec riz blanc et légumes verts.' },
  'REAL-219': { role: 'main', accepts: ['starch'], reason: 'Tempura de crevettes et légumes : friture japonaise servie avec riz ou soba (non intégrés).' },
  'REAL-220': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Karaage : poulet frit japonais, servi avec riz, salade et citron.' },
  'REAL-223': { role: 'main', accepts: ['starch'], reason: 'Sukiyaki : fondue japonaise de bœuf en sauce sucrée-salée, mangée avec du riz blanc.' },
  'REAL-228': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Bulgogi : bœuf mariné grillé coréen, servi avec riz et banchan (légumes marinés).' },
  'REAL-229': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Galbi gui : travers de bœuf grillés coréens, servis avec riz et banchan.' },
  'REAL-232': { role: 'main', accepts: ['starch'], reason: 'Kimchi jjigae : ragoût de kimchi et porc coréen, servi avec riz blanc.' },
  'REAL-233': { role: 'main', accepts: ['starch'], reason: 'Doenjang jjigae : ragoût de pâte de soja coréen, servi avec riz blanc.' },
  'REAL-234': { role: 'main', accepts: ['starch'], reason: 'Sundubu jjigae : ragoût de tofu soyeux, servi avec riz blanc.' },
  'REAL-235': { role: 'main', accepts: ['starch'], reason: 'Dakgalbi : poulet sauté pimenté coréen, servi avec riz ou dans des wrappes de laitue.' },
  'REAL-244': { role: 'main', accepts: ['starch'], reason: 'Thịt kho trứng : porc braisé aux œufs vietnamien, servi avec riz blanc et légumes.' },
  'REAL-246': { role: 'main', accepts: ['starch'], reason: 'Gaeng keow wan (curry vert thaïlandais) : curry de poulet au lait de coco, servi avec riz jasmin.' },
  'REAL-247': { role: 'main', accepts: ['starch'], reason: 'Massaman curry : curry de bœuf thaïlandais aux pommes de terre, servi avec riz.' },
  'REAL-252': { role: 'main', accepts: ['starch'], reason: 'Pad kra pao (basilic sacré) : porc haché sauté, servi avec riz et œuf frit.' },
  'REAL-255': { role: 'main', accepts: ['starch'], reason: 'Rendang de bœuf : bœuf confit épicé indonésien, servi avec riz blanc.' },
  'REAL-259': { role: 'main', accepts: ['starch'], reason: 'Chicken adobo : poulet braisé vinaigré philippin, servi avec riz blanc.' },
  'REAL-260': { role: 'main', accepts: ['starch'], reason: 'Sinigang de porc : soupe aigre philippine riche en légumes, servie avec riz blanc.' },
  'REAL-263': { role: 'main', accepts: ['starch'], reason: 'Cochinita pibil : porc mariné à l'achiote, servi avec tortillas (non intégrées à la recette).' },
  'REAL-264': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Mole poblano au poulet : sauce complexe mexicaine sur poulet, servie avec riz et tortillas.' },
  'REAL-268': { role: 'main', accepts: ['starch'], reason: 'Birria de res : bœuf braisé pimenté mexicain, servi avec tortillas et consommé de trempage.' },
  'REAL-272': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Pescado a la veracruzana : poisson en sauce tomate-olives, servi avec riz blanc et légumes.' },
  'REAL-277': { role: 'main', accepts: ['starch'], reason: 'Moqueca baiana : ragoût de poisson et crevettes au lait de coco brésilien, servi avec riz.' },
  'REAL-282': { role: 'main', accepts: ['starch'], reason: 'Lomo saltado : bœuf sauté péruvien, servi traditionnellement avec frites ET riz (non intégrés).' },
  'REAL-283': { role: 'main', accepts: ['starch'], reason: 'Ají de gallina : poulet crémeux péruvien, servi avec riz et pommes vapeur.' },
  'REAL-285': { role: 'main', accepts: ['starch'], reason: 'Anticuchos de corazón : brochettes de cœur de bœuf péruviennes, servies avec pommes vapeur et maïs.' },
  'REAL-288': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Jerk chicken : poulet grillé épicé jamaïcain, servi avec riz aux pois et salade.' },
  'REAL-289': { role: 'main', accepts: ['starch'], reason: 'Curry goat jamaïcain : curry de chèvre, servi avec riz aux pois.' },
  'REAL-290': { role: 'main', accepts: ['starch'], reason: 'Ropa vieja : bœuf effiloché cubain aux poivrons, servi avec riz blanc et haricots noirs.' },
  'REAL-292': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Sauerbraten : rôti de bœuf mariné allemand, servi avec Knödel (quenelles de pommes de terre) et chou rouge.' },
  'REAL-293': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Rinderrouladen : roulades de bœuf allemandes, servies avec Knödel et chou rouge.' },
  'REAL-294': { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Wiener schnitzel : escalope panée autrichienne, servie avec salade de pommes de terre ou frites.' },
  'REAL-296': { role: 'main', accepts: ['starch'], reason: 'Chicken paprikash : poulet au paprika hongrois en sauce crémée, servi avec nokedli (spätzle).' },
  'REAL-300': { role: 'main', accepts: ['starch'], reason: 'Beef stroganoff : bœuf en sauce crème aigre, servi avec nouilles aux œufs ou riz.' },

  // ── PLATS COMPLETS ────────────────────────────────────────────────────────────
  'FR-004':   { role: 'complete', accepts: [], reason: 'Hachis Parmentier : plat complet — bœuf effiloché + purée de pommes de terre (protéine + féculent). Autosuffisant.' },
  'FR-005':   { role: 'complete', accepts: [], reason: 'Quiche lorraine : tarte salée avec pâte (féculent), lardons (protéine), appareil œuf-crème. Plat complet.' },
  'FR-010':   { role: 'complete', accepts: [], reason: 'Saumon en papillote aux légumes : protéine + légumes, autosuffisant.' },
  'FR-011':   { role: 'complete', accepts: [], reason: 'Cabillaud au beurre citronné, riz et haricots verts : protéine + féculent + légume, plat complet.' },
  'FR-015':   { role: 'complete', accepts: [], reason: 'Pot-au-feu : multiple protéines (bœuf, os, légumes racines), bouillon généreux — plat complet et autosuffisant de la cuisine française.' },
  'FR-017':   { role: 'complete', accepts: [], reason: 'Poulet rôti et pommes de terre : volaille + féculent dans le même plat. Plat complet emblématique.' },
  'FR-022':   { role: 'complete', accepts: [], reason: 'Endives au jambon : jambon (protéine) + endives (légume) + béchamel, gratin autosuffisant.' },
  'FR-033':   { role: 'complete', accepts: [], reason: 'Salade de lentilles, œuf mollet et moutarde : légumineuse (protéine + féculent) + légumes + protéine (œuf). Salade complète.' },
  'FR-035':   { role: 'complete', accepts: [], reason: 'Salade niçoise : thon/anchois (protéine) + pommes de terre (féculent) + légumes. Salade complète.' },
  'GR-001':   { role: 'complete', accepts: [], reason: 'Moussaka : agneau haché (protéine) + aubergines (légume) + béchamel. Plat grec complet et autosuffisant.' },
  'IT-001':   { role: 'complete', accepts: [], reason: 'Lasagnes à la bolognaise : pâtes (féculent) + bolognaise (protéine) + béchamel. Plat au four complet.' },
  'IT-002':   { role: 'complete', accepts: [], reason: 'Risotto aux champignons : riz (féculent) + parmesan. Primo piatto complet de la cuisine italienne.' },
  'IT-003':   { role: 'complete', accepts: [], reason: 'Spaghetti carbonara : pâtes (féculent) + guanciale/œuf (protéine). Plat complet romain.' },
  'IT-005':   { role: 'complete', accepts: [], reason: 'Pâtes au pesto : pâtes (féculent) + pesto (parmesan, pignons). Primo piatto complet.' },
  'IT-007':   { role: 'complete', accepts: [], reason: 'Pizza margherita : pâte (féculent) + mozzarella + tomate. Plat complet emblématique.' },
  'MAG-001':  { role: 'complete', accepts: [], reason: 'Couscous poulet, merguez et légumes : semoule (féculent) + protéines multiples + légumes. Plat complet maghrébin.' },
  'PROT-001': { role: 'complete', accepts: [], reason: 'Cabillaud vapeur et dal d'épinards : protéine + légumineuse + légume. Plat complet équilibré.' },
  'PROT-002': { role: 'complete', accepts: [], reason: 'Morue et pois chiches au four à la portugaise : protéine + légumineuse + légume. Plat complet.' },
  'PROT-005': { role: 'complete', accepts: [], reason: 'Murgh tandoori et dal palak : volaille + dal (légumineuse + légume). Plat complet indien équilibré.' },
  'PROT-006': { role: 'complete', accepts: [], reason: 'Filet mignon de porc à la moutarde et lentilles vertes : protéine + légumineuse. Plat complet.' },
  'PROT-007': { role: 'complete', accepts: [], reason: 'Tajine de veau aux lentilles corail et courgettes : protéine + légumineuse + légume. Plat complet.' },
  'PROT-008': { role: 'complete', accepts: [], reason: 'Poulet rôti à la créole et haricots rouges : protéine + légumineuse + légumes. Plat complet créole.' },
  'PROT-009': { role: 'complete', accepts: [], reason: 'Jarret de bœuf braisé aux lentilles vertes et épinards : protéine + légumineuse + légume. Plat complet.' },
  'REAL-073': { role: 'complete', accepts: [], reason: 'Cassoulet de Castelnaudary : haricots lingots (féculent/protéine), confit de canard, saucisse, poitrine — plat complet emblématique du Sud-Ouest.' },
  'REAL-074': { role: 'complete', accepts: [], reason: 'Choucroute garnie alsacienne : choucroute (légume fermenté) + charcuteries multiples + pommes vapeur. Plat alsacien complet.' },
  'REAL-075': { role: 'complete', accepts: [], reason: 'Tartiflette : pommes de terre (féculent) + lardons (protéine) + Reblochon. Plat savoyard complet.' },
  'REAL-077': { role: 'complete', accepts: [], reason: 'Garbure béarnaise : haricots (légumineuse) + chou (légume) + confit de canard + jambon. Soupe-repas complète.' },
  'REAL-079': { role: 'complete', accepts: [], reason: 'Bouillabaisse marseillaise : multiples poissons nobles + rouille + pain. Expérience marseillaise autosuffisante.' },
  'REAL-080': { role: 'complete', accepts: [], reason: 'Brandade de morue : morue (protéine) + pommes de terre (féculent) + huile d'olive. Plat complet provençal.' },
  'REAL-082': { role: 'complete', accepts: [], reason: 'Quenelles de brochet sauce Nantua : quenelles (protéine + féculent lié) + sauce aux écrevisses. Plat lyonnais complet et autosuffisant.' },
  'REAL-083': { role: 'complete', accepts: [], reason: 'Navarin d'agneau printanier : agneau (protéine) + pommes nouvelles (féculent) + légumes de printemps. Plat complet.' },
  'REAL-084': { role: 'complete', accepts: [], reason: 'Petit salé aux lentilles : porc demi-sel + lentilles (légumineuse) + carottes. Plat complet de bistrot.' },
  'REAL-085': { role: 'complete', accepts: [], reason: 'Tomates farcies à la chair : tomates (légume) + farce bœuf-veau (protéine) + pain lié. Plat complet de la cuisine familiale française.' },
  'REAL-086': { role: 'complete', accepts: [], reason: 'Œufs en meurette : œufs pochés (protéine) + sauce bourguignonne + lardons + croutons (féculent). Entrée-plat autosuffisant.' },
  'REAL-088': { role: 'complete', accepts: [], reason: 'Flamiche aux poireaux : pâte brisée (féculent) + poireaux (légume) + appareil œuf-crème. Tarte salée complète.' },
  'REAL-092': { role: 'complete', accepts: [], reason: 'Piperade basquaise : poivrons + tomates + œufs + jambon de Bayonne. Plat complet basque, autosuffisant.' },
  'REAL-098': { role: 'complete', accepts: [], reason: 'Ribollita toscane : haricots blancs (légumineuse) + pain rassis (féculent) + chou et légumes. Soupe-repas complète.' },
  'REAL-100': { role: 'complete', accepts: [], reason: 'Cacio e pepe : pâtes (féculent) + pecorino (protéine laitière). Primo piatto romain complet.' },
  'REAL-101': { role: 'complete', accepts: [], reason: 'Bucatini all'amatriciana : pâtes (féculent) + guanciale (protéine) + tomate. Plat complet romain.' },
  'REAL-103': { role: 'complete', accepts: [], reason: 'Pasta alla Norma : pâtes (féculent) + aubergines (légume) + ricotta. Plat sicilien complet.' },
  'REAL-104': { role: 'complete', accepts: [], reason: 'Orecchiette alle cime di rapa : pâtes (féculent) + cime di rapa (légume). Plat des Pouilles complet.' },
  'REAL-105': { role: 'complete', accepts: [], reason: 'Parmigiana di melanzane : aubergines (légume) + mozzarella + parmesan (protéine) + sauce tomate. Secondo piatto complet.' },
  'REAL-108': { role: 'complete', accepts: [], reason: 'Tortilla española : pommes de terre (base féculent) + œufs (protéine) + oignons. Plat complet espagnol.' },
  'REAL-110': { role: 'complete', accepts: [], reason: 'Paella valenciana : riz (féculent) + poulet + lapin + haricots verts + légumes. Plat complet emblématique.' },
  'REAL-111': { role: 'complete', accepts: [], reason: 'Arroz negro : riz au squid ink (féculent) + calmars (protéine). Plat de riz complet catalan.' },
  'REAL-112': { role: 'complete', accepts: [], reason: 'Fideuà : fideos (féculent) + crevettes + calmars. Plat de nouilles complet valencien.' },
  'REAL-113': { role: 'complete', accepts: [], reason: 'Fabada asturiana : faba (légumineuse) + chorizo + morcilla + poitrine. Plat complet des Asturies.' },
  'REAL-118': { role: 'complete', accepts: [], reason: 'Pulpo a la gallega : poulpe (protéine) + pommes de terre (féculent) + paprika. Plat galicien complet.' },
  'REAL-119': { role: 'complete', accepts: [], reason: 'Bacalhau à Brás : morue (protéine) + pommes paille (féculent) + œufs. Plat portugais complet.' },
  'REAL-121': { role: 'complete', accepts: [], reason: 'Francesinha : sandwich gratiné porto en sauce — pain (féculent) + charcuteries (protéine) + sauce bière. Plat complet iconique de Porto.' },
  'REAL-123': { role: 'complete', accepts: [], reason: 'Spanakopita : pâte filo (féculent) + épinards (légume) + feta + œufs. Tourte grecque complète.' },
  'REAL-125': { role: 'complete', accepts: [], reason: 'Fasolada : haricots blancs (légumineuse, protéine + féculent) + légumes. Soupe nationale grecque complète.' },
  'REAL-126': { role: 'complete', accepts: [], reason: 'Gigantes plaki : haricots géants au four (légumineuse) + légumes. Plat grec complet végétarien.' },
  'REAL-128': { role: 'complete', accepts: [], reason: 'Kleftiko d'agneau en papillote : agneau (protéine) + pommes de terre (féculent) + feta. Plat complet grec.' },
  'REAL-129': { role: 'complete', accepts: [], reason: 'Avgolemono : soupe de poulet au riz et citron-œuf (protéine + féculent). Plat complet grec.' },
  'REAL-131': { role: 'complete', accepts: [], reason: 'Menemen : œufs brouillés à la tomate et aux poivrons. Petit-déjeuner/plat complet turc.' },
  'REAL-132': { role: 'complete', accepts: [], reason: 'Mantı turcs : raviolis de bœuf en sauce yaourt — pâte (féculent) + farce bœuf (protéine) + yaourt. Plat complet.' },
  'REAL-133': { role: 'complete', accepts: [], reason: 'Lahmacun : pain plat garni de viande hachée et légumes. Pizza turque complète.' },
  'REAL-134': { role: 'complete', accepts: [], reason: 'Musakhan palestinien : poulet (protéine) + pain taboon (féculent) + sumac. Plat de fête complet.' },
  'REAL-135': { role: 'complete', accepts: [], reason: 'Maqluba : riz (féculent) + agneau (protéine) + aubergines et chou-fleur. Plat renversé levant complet.' },
  'REAL-136': { role: 'complete', accepts: [], reason: 'Mujaddara : lentilles (légumineuse) + riz (céréale) + oignons frits. Plat levantain complet végétarien.' },
  'REAL-141': { role: 'complete', accepts: [], reason: 'Kibbeh bil sanieh : boulgour (féculent) + agneau (protéine) + pignons. Plat levantain complet au four.' },
  'REAL-144': { role: 'complete', accepts: [], reason: 'Harira : soupe marocaine de lentilles, pois chiches, agneau et tomate. Soupe-repas complète.' },
  'REAL-145': { role: 'complete', accepts: [], reason: 'Pastilla au poulet et amandes : feuilles de brick (féculent) + poulet (protéine) + œufs + amandes. Tourte sucrée-salée marocaine, plat complet de fête.' },
  'REAL-146': { role: 'complete', accepts: [], reason: 'Rfissa : poulet (protéine) + msemen (féculent) + lentilles (légumineuse). Plat marocain de cérémonie complet.' },
  'REAL-152': { role: 'complete', accepts: [], reason: 'Jollof rice : riz épicé à la tomate — plat complet d'Afrique de l'Ouest, autosuffisant par tradition culinaire même sans protéine animale.' },
  'REAL-153': { role: 'complete', accepts: [], reason: 'Thiéboudienne : riz brisé + mérou (protéine) + légumes. Plat national sénégalais complet.' },
  'REAL-161': { role: 'complete', accepts: [], reason: 'Waakye : riz + haricots cornille (légumineuse) cuits ensemble. Plat ghanéen complet végétarien.' },
  'REAL-163': { role: 'complete', accepts: [], reason: 'Ugali et sukuma wiki : ugali de maïs (féculent) + sukuma wiki (légume). Plat complet kényan — deux préparations inséparables.' },
  'REAL-165': { role: 'complete', accepts: [], reason: 'Bunny chow : pain en miche farci de curry d'agneau aux pommes de terre. Plat de rue sud-africain complet (féculent + protéine + féculent).' },
  'REAL-171': { role: 'complete', accepts: [], reason: 'Biryani hyderabadi : riz basmati (féculent) + poulet mariné (protéine) + saffran. Plat indien de fête complet.' },
  'REAL-181': { role: 'complete', accepts: [], reason: 'Masala dosa : crêpe fermentée riz-lentilles (féculent) + farce de pommes de terre épicées. Plat du Sud de l'Inde complet.' },
  'REAL-184': { role: 'complete', accepts: [], reason: 'Pav bhaji : légumes épicés en sauce servis avec pav (pain) intégré à la recette. Street food indien complet.' },
  'REAL-189': { role: 'complete', accepts: [], reason: 'Haleem : bouillie de blé + orge + lentilles + bœuf. Plat complet du sous-continent indien, riche et autosuffisant.' },
  'REAL-193': { role: 'complete', accepts: [], reason: 'Dan dan noodles : nouilles (féculent) + porc haché + sauce sésame. Plat de nouilles sichuanais complet.' },
  'REAL-200': { role: 'complete', accepts: [], reason: 'Jiaozi (raviolis porc-ciboulette) : pâte (féculent) + farce porc + légumes. Plat complet de la cuisine du Nord de la Chine.' },
  'REAL-201': { role: 'complete', accepts: [], reason: 'Xiaolongbao : raviolis vapeur au bouillon — pâte (féculent) + farce porc (protéine). Plat complet shanghaïen.' },
  'REAL-203': { role: 'complete', accepts: [], reason: 'Cantonese clay pot rice : riz (féculent) + lap cheong + poulet + shiitaké. Plat en pot complet cantonais.' },
  'REAL-206': { role: 'complete', accepts: [], reason: 'Wonton soup : pâte à wonton (féculent) + porc + crevette + bouillon. Soupe-repas cantonaise complète.' },
  'REAL-208': { role: 'complete', accepts: [], reason: 'Lu rou fan : porc braisé (protéine) + riz (féculent). Plat complet taïwanais.' },
  'REAL-209': { role: 'complete', accepts: [], reason: 'Taiwan beef noodle soup : bœuf (protéine) + nouilles (féculent) + bouillon. Plat complet iconique de Taïwan.' },
  'REAL-211': { role: 'complete', accepts: [], reason: 'Shoyu ramen : nouilles (féculent) + bouillon de poulet + toppings (œuf, porc, etc.). Plat complet japonais.' },
  'REAL-212': { role: 'complete', accepts: [], reason: 'Miso ramen : nouilles (féculent) + bouillon miso + porc + légumes. Plat complet japonais.' },
  'REAL-213': { role: 'complete', accepts: [], reason: 'Tonkotsu ramen : nouilles (féculent) + bouillon d'os de porc + chashu + tamago. Plat complet japonais.' },
  'REAL-214': { role: 'complete', accepts: [], reason: 'Oyakodon : riz japonais (féculent) + poulet + œufs. Bol complet.' },
  'REAL-215': { role: 'complete', accepts: [], reason: 'Katsudon : riz japonais (féculent) + côte de porc panée + œufs. Bol complet.' },
  'REAL-216': { role: 'complete', accepts: [], reason: 'Gyudon : riz japonais (féculent) + bœuf finement tranché. Bol de bœuf sur riz complet.' },
  'REAL-217': { role: 'complete', accepts: [], reason: 'Okonomiyaki Osaka : galette de chou (base) + pâte + œufs + garnitures (porc ou fruits de mer). Plat complet japonais.' },
  'REAL-221': { role: 'complete', accepts: [], reason: 'Japanese curry rice : riz (féculent) + porc (protéine) + pommes de terre et carottes (légumes). Plat complet japonais.' },
  'REAL-222': { role: 'complete', accepts: [], reason: 'Nikujaga : bœuf (protéine) + pommes de terre (féculent) + carottes et oignons. Plat maison japonais complet.' },
  'REAL-224': { role: 'complete', accepts: [], reason: 'Yakisoba : nouilles sautées (féculent) + porc (protéine) + chou et carottes (légumes). Plat complet japonais.' },
  'REAL-226': { role: 'complete', accepts: [], reason: 'Gyoza porc-chou : pâte (féculent) + porc + chou. Raviolis japonais complets.' },
  'REAL-227': { role: 'complete', accepts: [], reason: 'Bibimbap de Jeonju : riz (féculent) + bœuf (protéine) + namuls de légumes variés + œuf. Bol complet coréen.' },
  'REAL-230': { role: 'complete', accepts: [], reason: 'Japchae : nouilles de patate douce (féculent) + bœuf (protéine) + épinards et carottes. Plat complet coréen.' },
  'REAL-236': { role: 'complete', accepts: [], reason: 'Haemul pajeon : galette de chou et ciboule (féculent) + crevettes et calmars (protéine). Plat complet coréen.' },
  'REAL-237': { role: 'complete', accepts: [], reason: 'Kimbap : riz (féculent) + bœuf bulgogi + légumes variés + œuf. Rouleau complet coréen.' },
  'REAL-238': { role: 'complete', accepts: [], reason: 'Bossam : porc bouilli (protéine) + wraps de chou fermenté (légume-féculent). Plat de partage coréen complet.' },
  'REAL-239': { role: 'complete', accepts: [], reason: 'Phở bò : bouillon de bœuf + bœuf tranché (protéine) + nouilles de riz (féculent). Soupe-repas vietnamienne complète.' },
  'REAL-240': { role: 'complete', accepts: [], reason: 'Bún chả : vermicelles de riz (féculent) + porc grillé et boulettes (protéine) + sauce. Plat complet vietnamien.' },
  'REAL-241': { role: 'complete', accepts: [], reason: 'Bánh mì thịt : baguette (féculent) + porc rôti + pâté + légumes marinés. Sandwich complet vietnamien.' },
  'REAL-242': { role: 'complete', accepts: [], reason: 'Gỏi cuốn : galette de riz (féculent) + crevettes + porc + vermicelles + laitue. Rouleau de printemps frais complet.' },
  'REAL-243': { role: 'complete', accepts: [], reason: 'Bún bò Huế : bouillon de bœuf et porc + nouilles de riz épaisses (féculent) + protéines. Soupe complète du Centre Vietnam.' },
  'REAL-245': { role: 'complete', accepts: [], reason: 'Pad thaï : nouilles de riz (féculent) + crevettes + tofu (protéines) + œuf + légumes. Plat complet thaïlandais emblématique.' },
  'REAL-249': { role: 'complete', accepts: [], reason: 'Tom kha gai : soupe de poulet au galanga et lait de coco — protéine + légumes (champignons, galangal) + lait de coco. Soupe-repas thaïlandaise.' },
  'REAL-251': { role: 'complete', accepts: [], reason: 'Larb de porc : porc haché (protéine) + riz gluant grillé moulu (féculent/texture) + herbes. Salade-repas laotienne/thaïlandaise complète.' },
  'REAL-253': { role: 'complete', accepts: [], reason: 'Khao soi : nouilles aux œufs (féculent) + poulet (protéine) + curry au lait de coco. Soupe curry du Nord thaïlandais complète.' },
  'REAL-254': { role: 'complete', accepts: [], reason: 'Nasi goreng : riz frit (féculent) + crevettes + poulet effiloché (protéines). Plat complet indonésien emblématique.' },
  'REAL-256': { role: 'complete', accepts: [], reason: 'Gado-gado : légumes variés + tofu frit + tempeh (protéines) + œufs + sauce arachide. Salade indonésienne complète.' },
  'REAL-261': { role: 'complete', accepts: [], reason: 'Tacos al pastor : porc (protéine) + tortillas de maïs (service, féculent) + ananas + oignon + coriandre. Plat mexicain complet.' },
  'REAL-262': { role: 'complete', accepts: [], reason: 'Carnitas : porc confit (protéine) + tortillas de maïs (service, féculent) + garnitures. Plat mexicain complet.' },
  'REAL-265': { role: 'complete', accepts: [], reason: 'Enchiladas verdes : tortillas de maïs (féculent) + poulet effiloché (protéine) + salsa verde + crème + fromage. Plat complet mexicain.' },
  'REAL-266': { role: 'complete', accepts: [], reason: 'Chilaquiles rojos : chips de tortilla (féculent) + sauce tomate-chili + crème et fromage. Petit-déjeuner mexicain complet.' },
  'REAL-267': { role: 'complete', accepts: [], reason: 'Pozole rojo : maïs nixtamalisé (féculent) + épaule de porc (protéine) + épices. Soupe-repas mexicaine complète.' },
  'REAL-269': { role: 'complete', accepts: [], reason: 'Tamales de poulet salsa verde : masa (féculent) + poulet effiloché (protéine) + salsa. Plat complet mexicain à la vapeur.' },
  'REAL-270': { role: 'complete', accepts: [], reason: 'Tlayuda oaxaqueña : grande tortilla (féculent) + haricots + tasajo de bœuf (protéine) + chou + fromage + avocat. Plat de rue oaxacan complet.' },
  'REAL-275': { role: 'complete', accepts: [], reason: 'Pupusas revueltas : masa (féculent) + fromage + chicharrón de porc (protéine). Plat complet du Salvador.' },
  'REAL-276': { role: 'complete', accepts: [], reason: 'Feijoada completa : haricots noirs (légumineuse) + multiples viandes de porc + orange (service). Plat national brésilien complet.' },
  'REAL-281': { role: 'complete', accepts: [], reason: 'Locro criollo : maïs hominy (féculent) + haricots blancs (légumineuse) + courge + porc. Ragoût des Andes complet.' },
  'REAL-286': { role: 'complete', accepts: [], reason: 'Arepas reina pepiada : masa de maïs (féculent) + poulet effiloché + avocat. Arepa vénézuélienne complète.' },
  'REAL-287': { role: 'complete', accepts: [], reason: 'Pabellón criollo : bœuf effiloché (protéine) + riz (féculent) + haricots noirs + plantain. Plat national vénézuélien complet.' },
  'REAL-291': { role: 'complete', accepts: [], reason: 'Mofongo : plantain pilé (féculent) + chicharrón + crevettes à l'ail (protéine). Plat complet portoricain.' },
  'REAL-295': { role: 'complete', accepts: [], reason: 'Goulash hongrois : bœuf (protéine) + pommes de terre (féculent) + poivrons et tomates (légumes). Plat complet hongrois.' },
  'REAL-297': { role: 'complete', accepts: [], reason: 'Pierogi ruskie : pâte (féculent) + pomme de terre + fromage blanc (farce). Raviolis polonais complets.' },
  'REAL-298': { role: 'complete', accepts: [], reason: 'Bigos : choucroute et chou (légume fermenté) + trois viandes de porc (protéines) + champignons. Ragoût du chasseur polonais complet.' },
  'REAL-301': { role: 'complete', accepts: [], reason: 'Shepherd's pie : agneau haché (protéine) + purée de pommes de terre (féculent) + carottes et petits pois (légumes). Plat complet britannique.' },
  'REAL-302': { role: 'complete', accepts: [], reason: 'Fish and chips : cabillaud pané (protéine) + pommes frites (féculent) + petits pois. Plat complet britannique emblématique.' },

  // ── VEG / PROT / DIVERS ───────────────────────────────────────────────────
  'VEG-001':  { role: 'complete', accepts: [], reason: 'Lentilles vertes mijotées aux légumes : légumineuse (protéine végétale + féculent) + légumes racines. Plat végétarien complet.' },
  'VEG-002':  { role: 'complete', accepts: [], reason: 'Salade de pois chiches, tomate et concombre : légumineuse (protéine végétale) + légumes. Salade végétarienne complète.' },
  'VEG-003':  { role: 'complete', accepts: [], reason: 'Quinoa aux légumes rôtis : quinoa (féculent et protéine végétale) + légumes variés. Plat végétarien complet.' },
  'EGG-001':  { role: 'complete', accepts: [], reason: 'Omelette aux fines herbes : œufs (protéine) + beurre + fines herbes. Plat complet emblématique de la cuisine française.' },
  'IND-001':  { role: 'complete', accepts: [], reason: 'Curry de pois chiches et épinards : pois chiches (protéine végétale et féculent) + épinards (légume). Plat végétarien complet indien.' },
  'IND-002':  { role: 'main', accepts: ['starch'], reason: 'Dahl de lentilles corail : sauce de lentilles sans légume substantiel ni féculent de service — le dal s'accompagne de riz ou chapati.' },
  'LEV-002':  { role: 'main', accepts: ['starch', 'vegetables'], reason: 'Falafels au four : boulettes de pois chiches (protéine végétale), servies avec pita et salade — pas autosuffisants sans leurs accompagnements.' },
}

// ── Fonctions utilitaires ──────────────────────────────────────────────────────
function hasIngredientRole(ingredients, roleSet) {
  return ingredients.some(i => roleSet.has(i.role))
}

function isDesert(recipe) {
  if (SWEET_CODE_PREFIXES.has(recipe.code.replace(/-\d+$/, '-'))) return true
  if (SWEET_CATEGORIES.has(recipe.category)) return true
  return false
}

function proposeRole(recipe) {
  // Surcharge éditoriale → priorité absolue
  if (EDITORIAL_OVERRIDES[recipe.code]) {
    const ov = EDITORIAL_OVERRIDES[recipe.code]
    return { ...ov, confidence: ov.confidence || 'A', source: 'editorial' }
  }

  // Catégorie sucrée
  if (isDesert(recipe)) {
    const score = recipe.sensory?.scores?.sweet ?? 0
    const kcal = score >= 4 ? 'riche' : 'modéré'
    return {
      role: 'dessert',
      accepts: [],
      reason: `Catégorie sucrée (${recipe.category}), score sucré ${score}/5 — dessert ${kcal} de fin de repas.`,
      confidence: 'A',
      source: 'category_heuristic',
    }
  }

  // Map de catégories nets
  if (CATEGORY_ROLE_MAP[recipe.category]) {
    const m = CATEGORY_ROLE_MAP[recipe.category]
    if (m.confidence !== 'C') {
      return { ...m, reason: `Catégorie "${recipe.category}" → ${m.role} par heuristique.`, source: 'category_map' }
    }
  }

  // Détection par rôles ingrédients
  const ings = recipe.ingredients
  const hasProtein = hasIngredientRole(ings, PROTEIN_ROLES)
  const hasStarch = hasIngredientRole(ings, STARCH_ROLES)
  const hasVeg = hasIngredientRole(ings, VEG_ROLES)

  if (hasProtein && hasStarch && hasVeg) {
    return {
      role: 'complete',
      accepts: [],
      reason: 'Détecté : protéine + féculent + légume dans les ingrédients → plat complet.',
      confidence: 'B',
      source: 'ingredient_heuristic',
    }
  }
  if (hasProtein && hasStarch) {
    return {
      role: 'complete',
      accepts: [],
      reason: 'Détecté : protéine + féculent → plat a priori complet (pas de légume distinct détecté).',
      confidence: 'B',
      source: 'ingredient_heuristic',
    }
  }
  if (hasProtein && hasVeg) {
    return {
      role: 'main',
      accepts: ['starch'],
      reason: 'Détecté : protéine + légume mais pas de féculent → plat principal appelant un féculent.',
      confidence: 'B',
      source: 'ingredient_heuristic',
    }
  }
  if (hasProtein) {
    return {
      role: 'main',
      accepts: ['starch', 'vegetables'],
      reason: 'Détecté : protéine seule → plat principal appelant féculent et légumes.',
      confidence: 'C',
      source: 'ingredient_heuristic',
    }
  }

  // Cas non résoluble
  return {
    role: 'INCERTAIN',
    accepts: [],
    reason: 'Aucune heuristique ne s'applique — révision éditoriale nécessaire.',
    confidence: 'C',
    source: 'unresolved',
  }
}

// ── Exécution ──────────────────────────────────────────────────────────────────
const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'))
const nullPlate = corpus.recipes.filter(r => !('plate' in r))
const applyMode = process.argv.includes('--apply')

const proposals = nullPlate.map(recipe => {
  const proposal = proposeRole(recipe)
  return {
    code: recipe.code,
    family: recipe.family,
    category: recipe.category,
    proposal,
  }
})

if (!applyMode) {
  // Mode rapport : sortie JSON + statistiques
  const stats = {}
  proposals.forEach(p => {
    const role = p.proposal.role
    stats[role] = (stats[role] || 0) + 1
  })
  const incertain = proposals.filter(p => p.proposal.role === 'INCERTAIN')

  console.log(JSON.stringify({
    total: proposals.length,
    stats,
    incertain_count: incertain.length,
    incertain_codes: incertain.map(p => p.code),
    proposals,
  }, null, 2))
  process.exit(0)
}

// Mode --apply : write decisions to corpus
let applied = 0
corpus.recipes = corpus.recipes.map(recipe => {
  if ('plate' in recipe) return recipe           // déjà renseigné
  const p = proposeRole(recipe)
  if (p.role === 'INCERTAIN') return recipe      // ne pas écrire de rôle faux
  applied++
  return {
    ...recipe,
    plate: {
      role: p.role,
      accepts: p.accepts,
      reason: p.reason,
    },
  }
})

writeFileSync(CORPUS_PATH, JSON.stringify(corpus, null, 2) + '\n')
process.stderr.write(`Applied ${applied} plate roles to corpus.\n`)
