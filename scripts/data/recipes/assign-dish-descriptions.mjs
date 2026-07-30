/**
 * Pose un champ `description_courte` sur chaque recette publiable du corpus.
 *
 * POURQUOI : le planificateur affiche « İmam bayıldı », « Bacalao al pil-pil »,
 * « Mujaddara », « Thịt kho trứng »… sans aucune indication de ce qu'on va
 * manger. L'utilisateur voit son planning sans pouvoir en déduire le repas.
 *
 * CE QUE DIT UNE BONNE DESCRIPTION :
 * - les ingrédients principaux et la forme du plat, pas l'histoire ;
 * - une seule ligne, lisible d'un coup d'œil sous le nom ;
 * - déduite du contenu de la recette (ingrédients, technique, catégorie)
 *   et jamais de la mémoire — le contenu fait autorité ;
 * - aucun superlatif (pas de « délicieux », « savoureux », « exquis »…).
 *
 * POURQUOI LES 392 PUBLIABLES, PAS LES 576 :
 * Les 184 non-publiables sont bloquées par des formes d'aliments sans
 * correspondance stock confirmée. Les poser en description n'apporterait rien
 * au planificateur qui ne peut pas les servir. Elles sont ignorées ici ; un
 * second lot pourra les couvrir quand leur éligibilité sera résolue.
 *
 *   node scripts/data/recipes/assign-dish-descriptions.mjs --dry-run
 *   node scripts/data/recipes/assign-dish-descriptions.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const REPORT = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-match-report.json')

const dryRun = process.argv.includes('--dry-run')

/**
 * Descriptions des recettes publiables, une par une.
 *
 * Règle d'écriture appliquée à chaque entrée :
 *   - phrase unique sans point interne suivi d'une majuscule ;
 *   - ingrédients principaux nommés dans l'ordre de leur rôle dans le plat ;
 *   - forme de la préparation (soupe, tarte, braisé, sauté…) toujours présente ;
 *   - les recettes dérivées précisent l'écart par rapport à leur base.
 */
const DESCRIPTIONS = {
  /* ── Plats français classiques ─────────────────────────────────────── */
  'FR-003': "Bœuf braisé à la bière blonde avec une compotée d'oignons liée au pain d'épices",
  'FR-004': "Bœuf effiloché recouvert d'une purée de pommes de terre, gratiné au four",
  'FR-005': "Tarte salée garnie de lardons fumés dans un appareil œufs-crème, cuite au four",
  'FR-006': "Fines lamelles de pommes de terre fondantes dans la crème et le lait parfumés à l'ail et à la muscade",
  'FR-008': "Cuisses de poulet mijotées avec poivrons rouges et verts, tomates et vin blanc",
  'FR-009': "Blancs de poulet en sauce crème-moutarde avec champignons de Paris et échalote",
  'FR-010': "Pavé de saumon cuit en papillote avec julienne de courgette, carotte, poireau et aneth",
  'FR-011': "Dos de cabillaud poêlé accompagné de riz et haricots verts, nappé d'un beurre au citron",
  'FR-012': "Oignons longuement caramélisés en soupe liée, servie avec croûtons et fromage gratiné",
  'FR-013': "Champignons de Paris mixés en velouté sur une base de béchamel, liés à la crème fraîche",
  'FR-014': "Potimarron fondu au bouillon, mixé en velouté et lié à la crème fraîche avec une touche de muscade",
  'FR-017': "Poulet entier rôti au four avec pommes de terre, oignon et ail, arrosé régulièrement",
  'FR-018': "Filet mignon de porc saisi puis nappé d'une sauce crème-moutarde de Dijon au vin blanc",
  'FR-019': "Boulettes de bœuf haché liées à l'œuf et à la chapelure, mijotées dans une sauce tomate",
  'FR-020': "Courgettes poêlées gratinées dans un appareil œufs-crème fraîche au comté",
  'FR-021': "Poireaux émincés fondus longuement au beurre à couvert, liés à la crème fraîche",
  'FR-022': "Endives cuites à la vapeur, roulées dans du jambon blanc, nappées de béchamel et gratinées au comté",
  'FR-023': "Pain de mie fourré au jambon blanc et gruyère, nappé de béchamel, gratiné au four",
  'FR-024': "Sauce blanche de base, roux mouillé au lait et assaisonné à la muscade",
  'FR-025': "Pommes de terre écrasées au presse-purée, montées au beurre froid et détendues au lait chaud",
  'FR-026': "Haricots verts blanchis puis revenus au beurre avec ail et persil",
  'FR-027': "Pommes de terre précuites à l'eau puis rissolées à l'huile d'olive avec ail",
  'FR-028': "Cake salé au jambon blanc, olives vertes et gruyère, cuit au four",
  'FR-029': "Tarte salée garnie de thon en conserve et tomates sur un fond de moutarde, dans un appareil œufs-crème",
  'FR-030': "Cerises noyées dans un appareil liquide œufs-lait-crème parfumé à la vanille, cuit au four",
  'FR-031': "Petits choux au gruyère soufflés au four, servis chauds en apéritif",
  'FR-032': "Pommes caramélisées au beurre recouvertes d'une pâte feuilletée, cuites au four et renversées",
  'FR-033': "Lentilles vertes tièdes avec œuf mollet, carottes et vinaigrette à l'huile de noix et moutarde",
  'FR-034': "Poireaux cuits à la vapeur, servis tièdes ou froids avec une vinaigrette moutardée au persil",
  'FR-035': "Salade composée de thon, œufs, tomates, haricots verts, pommes de terre et olives en vinaigrette",
  'FR-036': "Fond de pâte brisée garni d'une fondue de poireaux et lardons dans un appareil crème-œufs",
  'FR-037': "Confit de canard effiloché recouvert d'une purée de pommes de terre, gratiné au comté",
  'FR-038': "Lapin braisé au vin blanc et bouillon, nappé d'une sauce crème-moutarde à l'échalote et au thym",
  'FR-039': "Fond de pâte brisée garni de tranches de pommes et d'un appareil crème-œufs à la cannelle",
  'FR-040': "Petits gâteaux bombés au beurre noisette et miel, parfumés au zeste de citron",

  /* ── Pâtes et cuisine italienne ────────────────────────────────────── */
  'IT-001': "Feuilles de lasagne alternées de sauce bolognaise bœuf-porc et de béchamel, gratinées au four",
  'IT-002': "Riz arborio nacré et mouillé progressivement au bouillon avec champignons, parmesan et beurre en finale",
  'IT-003': "Spaghettis liés à une émulsion de guanciale, jaunes d'œufs et pecorino, généreusement poivrés",
  'IT-004': "Spaghettis avec sauce de bœuf haché longuement mijoté avec le soffritto et la tomate",
  'IT-005': "Pâtes liées à une sauce de basilic frais pilé avec parmesan, pignons et ail dans l'huile d'olive",
  'IT-006': "Gnocchi de pomme de terre pochés dans une sauce tomate, gratinés à la mozzarella",
  'IT-007': "Pâte levée garnie d'une sauce tomate et mozzarella fraîche, cuite à haute température",
  'IT-008': "Soupe de légumes de saison avec haricots blancs, pommes de terre et petites pâtes dans un bouillon",

  /* ── Cuisine mexicaine ──────────────────────────────────────────────── */
  'MX-001': "Bœuf haché mijoté avec haricots rouges, tomate, poivrons et épices torréfiées dans un bouillon relevé",

  /* ── Cuisine végétarienne et légumineuses ───────────────────────────── */
  'VEG-001': "Lentilles vertes cuites avec carottes, céleri, oignon et ail dans un bouillon au laurier et au thym",
  'VEG-002': "Pois chiches avec tomates fraîches, concombre, oignon rouge et persil, en vinaigrette au citron et cumin",
  'VEG-003': "Quinoa cuit avec courgettes, poivrons et carottes rôtis, finition au jus de citron et persil",

  /* ── Œufs ──────────────────────────────────────────────────────────── */
  'EGG-001': "Omelette crémeuse aux œufs, pliée, parfumée au persil et à la ciboulette",

  /* ── Cuisine indienne ───────────────────────────────────────────────── */
  'IND-001': "Pois chiches et épinards mijotés dans une sauce tomate-lait de coco aux épices avec ail et gingembre",

  /* ── Cuisine méditerranéenne / levantine ────────────────────────────── */
  'MED-001': "Œufs pochés dans une sauce tomate-poivrons épicée au cumin et paprika fumé",
  'LEV-001': "Tartinade lisse de pois chiches mixés avec tahini, jus de citron, ail et cumin",
  'LEV-002': "Boulettes de pois chiches secs mixés crus avec oignon, ail, persil, coriandre et cumin, cuites au four",

  /* ── Desserts ───────────────────────────────────────────────────────── */
  'DESS-001': "Crêpes à la farine de blé, œufs et lait, cuites à la poêle en fines galettes",
  'DESS-002': "Crêpes épaisses levées à la farine, œufs, lait et levure chimique, cuites en petits disques à la poêle",
  'DESS-003': "Gâteau moelleux au yaourt nature, farine, œufs et huile, cuit au four",
  'DESS-004': "Couches de biscuits cuillère imbibés de café alternées avec une crème mascarpone-œufs sucrée, servies froides avec du cacao",
  'DESS-005': "Mousse aérienne de chocolat noir à 70 % montée sur des blancs d'œufs battus",
  'DESS-007': "Pommes coupées sous un crumble sablé de farine, beurre et cassonade, cuites au four",
  'DESS-009': "Gâteau à la mie dense aux bananes mûres écrasées, beurre, œufs et cassonade",
  'DESS-010': "Gâteau à cœur fondant de chocolat noir à 70 % et beurre, peu fariné, cuit brièvement",
  'DESS-011': "Fond sablé garni d'une crème au citron et au beurre, coiffé d'une meringue",

  /* ── Plats régionaux et recettes réelles ────────────────────────────── */
  'REAL-075': "Gratin de pommes de terre, lardons et oignons recouvert de reblochon fondant",
  'REAL-080': "Morue dessalée et pochée, émulsionnée à l'huile d'olive, au lait et à l'ail jusqu'à obtenir une pâte crémeuse",
  'REAL-087': "Frisée en vinaigrette moutardée avec lardons dorés, croûtons et un œuf poché",
  'REAL-088': "Fond de pâte brisée garni d'une fondue de poireaux dans un appareil crème-œufs",
  'REAL-089': "Pâtisserie levée bretonne feuilletée au beurre demi-sel et caramélisée au sucre",
  'REAL-091': "Flan épais à la farine, lait entier et œufs, avec des pruneaux, cuit longuement au four",
  'REAL-092': "Compotée de poivrons rouges, piment doux, tomates et oignons au piment d'Espelette",
  'REAL-095': "Cuisses de poulet braisées avec champignons de Paris, tomates et vin rouge",
  'REAL-097': "Boules de riz au safran farcies d'un ragù de bœuf haché et de mozzarella, panées et frites",
  'REAL-099': "Soupe toscane de tomates et pain rassis lié au bouillon, fini à l'huile d'olive et au basilic",
  'REAL-100': "Pâtes tonnarelli liées à une émulsion de pecorino et poivre noir torréfié, sans autre matière grasse",
  'REAL-101': "Pâtes épaisses bucatini avec guanciale grillé, tomates et pecorino",
  'REAL-102': "Spaghettis avec sauce tomate aux olives noires, câpres, anchois et piment séché",
  'REAL-105': "Tranches d'aubergines frites ou rôties, montées en gratin avec sauce tomate, mozzarella et parmesan",
  'REAL-106': "Aigre-doux sicilien d'aubergines avec céleri, olives vertes, câpres en sauce tomate sucrée-vinaigrée",
  'REAL-108': "Omelette épaisse espagnole de pommes de terre confites à l'huile d'olive",
  'REAL-109': "Croquettes crémeuses de béchamel au jambon serrano, panées et frites",
  'REAL-114': "Soupe froide de tomates, concombre et poivron vert, émulsionnée à l'huile d'olive et vinaigre de xérès",
  'REAL-115': "Crème froide épaisse de tomates et pain blanc à l'huile d'olive, garnie d'œuf dur et jambon",
  'REAL-116': "Crevettes saisies dans l'huile d'olive infusée à l'ail et au piment séché",
  'REAL-117': "Morue dessalée confite à l'huile d'olive et à l'ail, liée en émulsion crémeuse par les gélatines du poisson",
  'REAL-120': "Soupe de pommes de terre et chou kale en chiffonnade avec du chouriço",
  'REAL-124': "Feuilles de vigne farcies de riz cru, aneth, menthe et oignons, cuites à l'étouffée et acidulées au citron",
  'REAL-125': "Soupe de haricots blancs avec tomates concassées, carottes, céleri et huile d'olive",
  'REAL-126': "Haricots géants cuits au four dans une sauce tomate à l'aneth et au persil",
  'REAL-128': "Épaule d'agneau marinée au citron et à l'origan, cuite lentement en papillote",
  'REAL-129': "Soupe de bouillon de poulet et riz, liée à l'émulsion d'œufs et de jus de citron frais",
  'REAL-130': "Aubergines farcies d'une compotée d'oignons, tomates et ail à l'huile d'olive, confites au four",
  'REAL-136': "Riz et lentilles brunes assaisonnés au cumin, surmontés d'oignons longuement caramélisés",
  'REAL-138': "Salade dense de persil plat haché, tomates, oignon nouveau et boulgour, assaisonnée au citron",
  'REAL-139': "Purée d'aubergines grillées à la flamme, mélangées au tahini, jus de citron et ail",
  'REAL-142': "Cuisses de poulet mijotées à l'étouffée avec citron confit au sel, olives vertes et épices au safran",
  'REAL-143': "Épaule d'agneau braisée avec pruneaux, miel et amandes dans un glacé sucré-salé au sésame",
  'REAL-144': "Soupe de lentilles, pois chiches, tomates, céleri, coriandre et vermicelles fins",
  'REAL-154': "Cuisses de poulet grillées puis mijotées dans une compotée d'oignons au citron et à la moutarde",
  'REAL-155': "Bœuf mijoté dans une sauce à l'arachide avec patate douce, carottes, chou et piment",
  'REAL-156': "Lamelles de bœuf marinées à sec dans un mélange d'arachides moulues et d'épices, grillées en brochette",
  'REAL-160': "Tranches de banane plantain mûre épicées au gingembre, clou de girofle et piment, frites",
  'REAL-162': "Bœuf en petits cubes cuit à sec puis mijoté avec tomates, oignon rouge et coriandre fraîche",
  'REAL-163': "Polenta de farine de maïs ferme servie avec un sauté de chou kale aux tomates et oignons",
  'REAL-166': "Relish de légumes sautés et compotés — poivron, carotte, chou et tomate — aux épices de curry",
  'REAL-167': "Poulet entier en morceaux cuit hermétiquement à l'étouffée avec tomates, aubergine africaine, piment et gingembre",
  'REAL-187': "Épaule de porc marinée au vinaigre et aux épices grillées, mijotée en curry pimenté et aigre",
  'REAL-198': "Œufs brouillés vifs auxquels sont ajoutées des tomates fraîches compotées et de la ciboule",
  'REAL-200': "Raviolis pliés à la main farcis de porc haché et ciboulette chinoise, pochés ou poêlés",
  'REAL-202': "Galette croustillante feuilletée de pâte eau chaude, garnie de ciboule hachée",
  'REAL-210': "Morceaux de poulet braisés et glacés dans un mélange de sauce soja, huile de sésame et vin de riz, finis au basilic thaï",
  'REAL-244': "Poitrine de porc braisée à l'eau de coco avec des œufs durs dans un caramel de sauce poisson",
  'REAL-259': "Cuisses de poulet marinées et braisées dans un mélange vinaigre de canne et sauce soja à l'ail et au laurier",
  'REAL-279': "Croquettes en forme de cuisse farcies de poulet effiloché aux tomates et oignons, panées et frites",
  'REAL-280': "Chaussons de pâte au saindoux farcis de bœuf haché au couteau avec œuf dur, olives et cumin",
  'REAL-287': "Bœuf effiloché en sofrito, haricots noirs, riz blanc et tranches de plantain frites, servis ensemble",
  'REAL-288': "Poulet en morceaux marinés dans un mélange de piment scotch bonnet, piment de la Jamaïque et thym, grillé",
  'REAL-295': "Bœuf mijoté longuement dans un bouillon paprikaté avec pommes de terre, tomates et poivrons",
  'REAL-296': "Cuisses de poulet cuites avec des oignons dans une sauce paprika doux hongrois liée à la crème aigre",
  'REAL-300': "Lamelles de filet de bœuf saisies vif avec des champignons, nappées d'une sauce crème aigre et moutarde",

  /* ── Protéines complètes ────────────────────────────────────────────── */
  'PROT-001': "Dos de cabillaud cuit à la vapeur accompagné d'un dal de lentilles corail et épinards aux épices",
  'PROT-002': "Morue dessalée et pois chiches rôtis au four avec épinards, tomates et huile d'olive",
  'PROT-005': "Hauts de cuisse de poulet marinés au yaourt et grillés, servis avec un dal d'épinards aux lentilles corail",
  'PROT-006': "Filet mignon de porc saisi, nappé d'une sauce moutarde, servi avec lentilles vertes et champignons",
  'PROT-007': "Épaule de veau mijotée longuement avec lentilles corail, courgettes et épices de tajine",
  'PROT-008': "Poulet entier rôti aux épices créoles, accompagné de haricots rouges à la tomate",
  'PROT-009': "Jarret de bœuf braisé au vin blanc avec lentilles vertes et épinards, lié à la moutarde en fin de cuisson",

  /* ── Recettes du répertoire ─────────────────────────────────────────── */
  'SRC-001': "Poule entière pochée longuement avec une farce de pain de mie, lait, jambon et persil",
  'SRC-002': "Bœuf braisé au vin blanc avec des carottes fondantes dans un fond de bouillon lié à la farine",
  'SRC-003': "Gigot d'agneau rôti accompagné de haricots flageolets au beurre avec thym et laurier",
  'SRC-004': "Poulet flambé au calvados, mijoté au cidre avec des pommes et champignons, lié à la crème",
  'SRC-005': "Escalopes de veau roulées autour d'une farce au porc haché, braisées dans une sauce tomate",
  'SRC-006': "Épaule de veau saisie et braisée au vin blanc avec champignons, oignons grelots et tomates",
  'SRC-007': "Sauce provençale d'anchois mixés avec ail, huile d'olive et vinaigre, servie sur pain grillé",
  'SRC-008': "Escalopes de dinde pochées dans un bouillon avec carottes, champignons et poireau, liées à la crème",
  'SRC-009': "Bouchées feuilletées garnies d'une fricassée de poulet et veau dans une sauce liée avec champignons",
  'SRC-010': "Courgettes évidées farcies d'un mélange de porc et bœuf haché à la tomate, cuites au four",
  'SRC-011': "Pain de mie fourré au jambon et emmental, gratiné, surmonté d'un œuf",
  'SRC-012': "Bouquets de brocolis blanchis nappés d'une sauce béchamel crémeuse, gratinés au four",
  'SRC-013': "Langue de bœuf pochée longuement dans un court-bouillon, servie avec une sauce au vinaigre et cornichons",
  'SRC-014': "Lentilles corail tièdes avec œuf poché, carottes, poireau et vinaigrette à l'huile d'olive",
  'SRC-015': "Œufs durs farcis d'un mélange de jaunes tamisés avec mayonnaise et moutarde",
  'SRC-016': "Omelette roulée aux pommes de terre et lardons avec oignon, garnie de ciboulette",
  'SRC-017': "Sandwich de pain de campagne pressé avec tomates, œuf dur, olives noires et huile d'olive",
  'SRC-018': "Petites pâtes avec thon en conserve et sauce tomate réduite à l'ail",
  'SRC-019': "Tarte sur pâte levée à l'huile, garnie d'oignons longuement confits, anchois et olives noires",
  'SRC-020': "Poireaux blanchis gratinés sous une couche de crème fraîche et gruyère",
  'SRC-021': "Poivrons rouges blanchis farcis de riz, lardons et tomate liés à l'œuf, rôtis au four",
  'SRC-022': "Soupe mixée de pommes de terre et poireau dans un bouillon de volaille, liée à la crème",
  'SRC-023': "Riz sauté à la poêle avec œufs brouillés, jambon blanc et petits pois",
  'SRC-024': "Riz froid avec thon, œufs, tomates et poivron vert en vinaigrette",
  'SRC-025': "Pommes de terre en rondelles avec jambon blanc, œufs durs, cornichons et mayonnaise moutardée",
  'SRC-026': "Épaule de porc saisie puis mijotée avec des pruneaux et des lardons fumés",
  'SRC-027': "Épaule de veau braisée au vin blanc avec olives vertes et noires dans une sauce tomate",
  'SRC-028': "Galette croustillante de farine de pois chiche à l'huile d'olive, cuite à haute température au four",
  'SRC-029': "Soupe provençale de légumes variés et haricots avec pâtes, servie avec un pistou de basilic et ail",
  'SRC-030': "Condiment d'olives noires dénoyautées mixées avec ail et huile d'olive",
  'SRC-031': "Aubergines évidées farcies de bœuf haché à la tomate et à l'ail, gratinées au gruyère",
  'SRC-032': "Boudin noir poêlé avec des pommes et oignons sautés au beurre",
  'SRC-033': "Soupe de moules et pommes de terre dans un bouillon de poisson avec tomates et vin blanc",
  'SRC-034': "Calamars flambés au cognac et mijotés dans une sauce tomate au vin blanc",
  'SRC-035': "Carottes râpées en salade avec vinaigrette moutardée et jus d'orange fraîche",
  'SRC-036': "Haricots blancs mijotés longuement avec confit de canard, saucisse de Toulouse et poitrine de porc",
  'SRC-037': "Céleri branche en julienne avec une sauce rémoulade à la moutarde, jaune d'œuf et yaourt",
  'SRC-038': "Feuilles de chou vert blanchies farcies d'un mélange bœuf-porc haché, mijotées longuement",
  'SRC-039': "Noix de Saint-Jacques dans leur coquille, gratinées avec sauce crème et chapelure",
  'SRC-040': "Fenouil en quartiers saisi puis braisé au vin blanc et bouillon, acidulé au citron",
  'SRC-041': "Bouquets de chou-fleur blanchis gratinés dans une béchamel crémeuse au gruyère",
  'SRC-042': "Lentilles vertes mijotées avec lardons fumés, carottes et oignons parfumés au thym",
  'SRC-043': "Morue dessalée cuite au four avec pommes de terre, œufs et persil",
  'SRC-044': "Moules cuites à couvert dans un fumet de vin blanc, ail et beurre, finies au persil",
  'SRC-045': "Rondelles de jarret de veau braisées dans une garniture aromatique au vin blanc",
  'SRC-046': "Tranches d'aubergines panées et frites, montées en gratin avec sauce tomate, mozzarella et parmesan",
  'SRC-047': "Petits pois mijotés avec de la laitue effilée, oignons blancs et beurre",
  'SRC-048': "Compotée de poivrons rouges, tomates et oignons au piment d'Espelette avec des œufs",
  'SRC-049': "Pommes de terre rissolées dans la graisse de confit de canard avec ail et persil",
  'SRC-050': "Chou vert mijoté longuement avec saucisses de Morteau et Montbéliard, pommes de terre et légumes racines",
  'SRC-051': "Compotée provençale d'aubergines, courgettes, poivrons et tomates à l'huile d'olive et à l'ail",
  'SRC-052': "Riz nacré à l'oignon puis absorbant un bouillon de volaille, finit au beurre",
  'SRC-053': "Salade verte avec tranches de fromage de chèvre gratinées sur croûtons, vinaigrette au miel",
  'SRC-054': "Salade avec confit de canard chaud, tomates et vinaigrette moutardée",
  'SRC-055': "Pavé de saumon saisi puis nappé d'une sauce crème-oseille au vin blanc",
  'SRC-056': "Appareil de béchamel au gruyère et emmental allégé avec des blancs montés, cuit aussitôt au four",
  'SRC-057': "Fond de pâte feuilletée garni d'oignons longuement fondus avec lardons dans un appareil crème-œufs",
  'SRC-058': "Hachis de porc gras et maigre avec échine, ail et persil, cuit en bain-marie et pressé froid",
  'SRC-059': "Thon en conserve mijoté avec une compotée de poivrons rouges et verts, tomates et ail",
  'SRC-060': "Truite farineuse saisie au beurre, garnie d'amandes effilées torréfiées",

  /* ── Dérivées SRC-001 ────────────────────────────────────────────────── */
  'SRC-001-D1': "Poule entière pochée longuement avec carottes, navets, poireau et céleri, sans farce",
  'SRC-001-D2': "Poule entière pochée avec une farce de pain de mie, lait, jambon et persil, avec un dôme de chou vert",

  /* ── Dérivée SRC-002 ─────────────────────────────────────────────────── */
  'SRC-002-D1': "Bœuf braisé aux carottes, refroidi et servi en gelée naturelle formée par le bouillon",

  /* ── Dérivées SRC-003 ────────────────────────────────────────────────── */
  'SRC-003-D1': "Gigot d'agneau rôti avec haricots flageolets mijotés dans une sauce tomate au beurre et thym",
  'SRC-003-D2': "Gigot d'agneau rôti avec haricots flageolets en conserve cuits au beurre avec thym et laurier",

  /* ── Dérivées SRC-004 ────────────────────────────────────────────────── */
  'SRC-004-D1': "Poulet flambé au calvados, mijoté au cidre avec pommes et champignons, lié aux jaunes d'œufs et crème",
  'SRC-004-D2': "Poulet flambé au calvados, mijoté au cidre avec pommes, champignons et poireaux ajoutés",

  /* ── Dérivées SRC-005 ────────────────────────────────────────────────── */
  'SRC-005-D1': "Escalopes de veau roulées farcies au porc haché, braisées dans une sauce tomate en conserve",
  'SRC-005-D2': "Escalopes de veau roulées farcies au porc haché, braisées dans une sauce tomate fraîche au persil",

  /* ── Dérivées SRC-006 ────────────────────────────────────────────────── */
  'SRC-006-D1': "Veau braisé au vin blanc avec champignons, oignons grelots et tomates pelées en conserve",
  'SRC-006-D2': "Poulet en morceaux braisé au vin blanc avec champignons, oignons grelots et tomates fraîches",

  /* ── Dérivées SRC-007 ────────────────────────────────────────────────── */
  'SRC-007-D1': "Anchoïade d'anchois et ail à l'huile d'olive épaissie avec du pain de mie mixé",
  'SRC-007-D2': "Anchoïade d'anchois et ail à l'huile d'olive, acidulée au jus de citron plutôt qu'au vinaigre",
  'SRC-007-D3': "Anchoïade d'anchois et ail à l'huile d'olive avec tomate râpée incorporée",

  /* ── Dérivées SRC-008 ────────────────────────────────────────────────── */
  'SRC-008-D1': "Dinde pochée avec carottes, champignons et poireaux dans un bouillon, liée à la crème",
  'SRC-008-D2': "Dinde et légumes cuits sous pression puis liés à la crème fraîche",
  'SRC-008-D3': "Dinde pochée avec carottes, champignons et poireau dans un bouillon au vin blanc, sans liaison crémeuse",
  'SRC-008-D4': "Dinde et légumes cuits au four dans un bouillon de volaille, liés à la crème fraîche",

  /* ── Dérivées SRC-009 ────────────────────────────────────────────────── */
  'SRC-009-D1': "Bouchées feuilletées garnies d'une fricassée de saumon et champignons liée",
  'SRC-009-D2': "Petites bouchées feuilletées garnies d'une fricassée de champignons liée et gratinées en entrée",
  'SRC-009-D3': "Bouchées feuilletées avec une fricassée de poulet effiloché et champignons liée à la crème",
  'SRC-009-D4': "Bouchées feuilletées avec fricassée de poulet et veau dans la tradition alsacienne aux quenelles",

  /* ── Dérivées SRC-010 ────────────────────────────────────────────────── */
  'SRC-010-D1': "Courgettes évidées farcies de chair de brochet et oignons, cuites au four dans la tomate",
  'SRC-010-D2': "Courgettes farcies de viande hachée relevée au cumin pour un profil épicé",
  'SRC-010-D3': "Courgettes rondes blanchies puis farcies de viande hachée à la tomate",
  'SRC-010-D4': "Courgettes farcies de viande hachée mouillées de tomate fraîche râpée plutôt qu'en conserve",

  /* ── Dérivées SRC-011 ────────────────────────────────────────────────── */
  'SRC-011-D1': "Pain de mie au jambon et emmental gratiné au four, surmonté d'un œuf",
  'SRC-011-D2': "Pain de mie au jambon et emmental avec l'œuf cuit dans un évidement central",

  /* ── Dérivées SRC-012 ────────────────────────────────────────────────── */
  'SRC-012-D1': "Brocolis blanchis gratinés dans une sauce béchamel crémeuse, sans protéine animale",
  'SRC-012-D2': "Brocolis blanchis avec béchamel crémeuse et jambon blanc en garniture",
  'SRC-012-D3': "Brocolis blanchis dans une béchamel crémeuse, gratiné avec une croûte dorée épaissie",
  'SRC-012-D4': "Brocolis blanchis dans une béchamel crémeuse au jambon blanc, sans liant à l'œuf",

  /* ── Dérivées SRC-013 ────────────────────────────────────────────────── */
  'SRC-013-D1': "Langue de bœuf pochée puis servie avec une sauce piquante au vinaigre de vin rouge et cornichons",
  'SRC-013-D2': "Langue de bœuf pochée puis mijotée dans une sauce tomate légèrement pimentée",
  'SRC-013-D3': "Langue de bœuf sauce piquante aux cornichons, cuite sous pression pour gagner du temps",

  /* ── Dérivées SRC-014 ────────────────────────────────────────────────── */
  'SRC-014-D1': "Lentilles corail tièdes avec lardons fumés, carottes, poireau et vinaigrette à l'huile d'olive",
  'SRC-014-D2': "Lentilles corail tièdes avec œuf poché, légumes aromatiques et vinaigrette au vinaigre de cidre",
  'SRC-014-D3': "Lentilles corail tièdes avec œuf poché et légumes de saison en vinaigrette",
  'SRC-014-D4': "Lentilles corail tièdes avec œuf poché, poireaux étuvés doucement et vinaigrette",
  'SRC-014-D5': "Lentilles corail tièdes avec œuf poché et effilochée de jambonneau",
  'SRC-014-D6': "Lentilles corail tièdes avec œuf poché, légumes aromatiques et noisettes torréfiées",

  /* ── Dérivées SRC-015 ────────────────────────────────────────────────── */
  'SRC-015-D1': "Œufs durs farcis d'un mélange de jaunes à la mayonnaise avec du thon émietté",
  'SRC-015-D2': "Œufs durs farcis d'un mélange de jaunes lié à l'avocat frais et au citron",
  'SRC-015-D3': "Verrine de crème de thon et jaunes d'œufs à la mayonnaise, garnie d'œuf mimosa",
  'SRC-015-D4': "Œufs mimosa à la mayonnaise moutardée, panés à la chapelure et frits",

  /* ── Dérivées SRC-016 ────────────────────────────────────────────────── */
  'SRC-016-D1': "Omelette paysanne aux pommes de terre et lardons enrichie de croûtons et d'une cuillerée de crème",
  'SRC-016-D2': "Omelette plate aux pommes de terre fraîchement râpées et lardons",
  'SRC-016-D3': "Omelette épaisse non roulée, cuite des deux côtés, aux pommes de terre et lardons",
  'SRC-016-D4': "Omelette paysanne refroidie et taillée en lanières pour une salade ou une garniture froide",

  /* ── Dérivées SRC-017 ────────────────────────────────────────────────── */
  'SRC-017-D1': "Sandwich pressé de pain de campagne avec tomates, œuf dur, olives noires et huile d'olive frottée à l'ail",
  'SRC-017-D2': "Sandwich provençal pressé avec tomates fraîches en rondelles, œuf dur et olives",
  'SRC-017-D3': "Pan bagnat classique préparé la veille pour une meilleure imprégnation des ingrédients",
  'SRC-017-D4': "Pan bagnat provençal pressé avec fèves fraîches et oignon nouveau en saison",

  /* ── Dérivées SRC-018 ────────────────────────────────────────────────── */
  'SRC-018-D1': "Petites pâtes avec thon en conserve et sauce tomate relevée uniquement à l'ail",
  'SRC-018-D2': "Petites pâtes avec thon dans une sauce tomate réduite longuement avec oignon et ail",
  'SRC-018-D3': "Petites pâtes avec thon en conserve dans une sauce tomate finie à l'huile d'olive crue",

  /* ── Dérivées SRC-019 ────────────────────────────────────────────────── */
  'SRC-019-D1': "Tarte sur pâte levée garnie d'oignons confits, anchois et olives, proche de la pissaladière",
  'SRC-019-D2': "Tarte niçoise levée aux oignons confits, anchois et olives vertes",
  'SRC-019-D3': "Tarte levée aux oignons confits et anchois, avec une couche de fenouil braisé",
  'SRC-019-D4': "Tarte niçoise levée aux oignons confits, anchois, olives et tranches d'aubergine rôtie",

  /* ── Dérivées SRC-020 ────────────────────────────────────────────────── */
  'SRC-020-D1': "Poireaux blanchis nappés d'une béchamel à la muscade, gratinés au gruyère",
  'SRC-020-D2': "Poireaux blanchis dans une sauce tomate fraîche à l'ail, gratinés au gruyère",
  'SRC-020-D3': "Poireaux blanchis dans une crème fraîche, gratinés sous une croûte de chapelure et gruyère",
  'SRC-020-D4': "Poireaux cuits à la vapeur puis gratinés dans une crème fraîche au gruyère",

  /* ── Dérivées SRC-021 ────────────────────────────────────────────────── */
  'SRC-021-D1': "Poivrons rouges farcis de riz cuisiné au curry dans un bouillon de volaille, rôtis au four",
  'SRC-021-D2': "Poivrons rouges farcis de riz et lardons à la tomate, parfumés aux herbes fraîches",
  'SRC-021-D3': "Poivrons rouges farcis de riz et lardons à la tomate, rôtis à découvert pour une peau plus dorée",
  'SRC-021-D4': "Poivrons rouges coupés en barquettes, farcis de riz et lardons à la tomate",

  /* ── Dérivées SRC-022 ────────────────────────────────────────────────── */
  'SRC-022-D1': "Soupe froide lisse de poireaux et pommes de terre dans le bouillon, liée à la crème",
  'SRC-022-D2': "Soupe de poireau et pomme de terre dans le bouillon, garnie de croûtons frits et de cerfeuil frais",
  'SRC-022-D3': "Soupe de poireau et pomme de terre à l'eau, liée à la crème, sans bouillon de viande",
  'SRC-022-D4': "Soupe de poireaux et pommes de terre dans un bouillon de volaille, liée légèrement à la crème",

  /* ── Dérivées SRC-023 ────────────────────────────────────────────────── */
  'SRC-023-D1': "Riz sauté avec crevettes décortiquées, œufs brouillés, petits pois et oignons",
  'SRC-023-D2': "Riz sauté avec œufs brouillés, carottes, petits pois et sauce soja, sans protéine animale",
  'SRC-023-D3': "Riz sauté avec œufs brouillés, lardons fumés et petits pois",
  'SRC-023-D4': "Riz sauté au beurre avec œufs brouillés et jambon blanc, sans sauce soja",

  /* ── Dérivées SRC-024 ────────────────────────────────────────────────── */
  'SRC-024-D1': "Riz froid avec thon, œufs, tomates et poivron vert blanchi en vinaigrette",
  'SRC-024-D2': "Riz complet froid avec thon, œufs, tomates et poivron vert en vinaigrette",

  /* ── Dérivées SRC-025 ────────────────────────────────────────────────── */
  'SRC-025-D1': "Pommes de terre, jambon blanc, œufs durs, cornichons avec mayonnaise maison à la moutarde",
  'SRC-025-D2': "Pommes de terre, jambon blanc, œufs durs et cornichons liés à une mayonnaise allégée à la crème",
  'SRC-025-D3': "Pommes de terre, blanc de poulet poché, œufs durs et cornichons en mayonnaise moutardée",
  'SRC-025-D4': "Pommes de terre, œufs durs et cornichons liés à la mayonnaise moutardée, sans charcuterie",

  /* ── Dérivées SRC-026 ────────────────────────────────────────────────── */
  'SRC-026-D1': "Porc sauté rapidement à feu vif avec pruneaux et lardons fumés",
  'SRC-026-D2': "Épaule de porc mijotée en cocotte avec des pruneaux",
  'SRC-026-D3': "Épaule de porc mijotée avec pruneaux, lardons et chou rouge",

  /* ── Dérivées SRC-027 ────────────────────────────────────────────────── */
  'SRC-027-D1': "Veau braisé aux olives vertes et noires avec concentré de tomate dans le style corse",
  'SRC-027-D2': "Veau braisé aux olives vertes et noires avec un zeste de citron en finition",
  'SRC-027-D3': "Veau braisé aux olives avec pommes de terre cuites dans le même jus de cuisson",
  'SRC-027-D4': "Veau braisé aux olives dans une sauce tomate concentrée, sans vin de déglaçage",

  /* ── Dérivée SRC-028 ─────────────────────────────────────────────────── */
  'SRC-028-D1': "Galette de pois chiche à l'huile d'olive, assaisonnée généreusement au poivre noir du moulin",

  /* ── Dérivées SRC-029 ────────────────────────────────────────────────── */
  'SRC-029-D1': "Soupe de légumes et haricots avec pâtes courtes dans un bouillon, servie avec pistou, sans tomate",
  'SRC-029-D2': "Soupe de légumes et haricots avec pâtes, servie avec du gruyère râpé fondu en surface",
  'SRC-029-D3': "Soupe de légumes et haricots avec pâtes, à la tomate râpée pour une note plus fraîche",
  'SRC-029-D4': "Soupe de légumes et haricots avec des pommes de terre en morceaux en plus des pâtes",
  'SRC-029-D5': "Soupe de légumes avec haricots blancs et haricots rouges réunis, liée au pistou",

  /* ── Dérivées SRC-031 ────────────────────────────────────────────────── */
  'SRC-031-D1': "Aubergines évidées farcies de riz cuit à la tomate, gratinées au gruyère",
  'SRC-031-D2': "Aubergines évidées farcies de bœuf haché à la tomate, la farce liée à la crème",
  'SRC-031-D3': "Aubergines farcies de bœuf haché à la tomate, cuites à la friteuse à air",
  'SRC-031-D4': "Aubergines farcies de bœuf haché à la tomate et gruyère, sans liant à l'œuf",

  /* ── Dérivées SRC-032 ────────────────────────────────────────────────── */
  'SRC-032-D1': "Tourte feuilletée garnie de boudin noir, pommes caramélisées et fondue de poireaux",
  'SRC-032-D2': "Tarte renversée de pommes caramélisées et boudin noir sur pâte feuilletée",
  'SRC-032-D3': "Boudin noir poêlé avec pommes, oignons caramélisés au miel et purée de pommes de terre",
  'SRC-032-D4': "Boudin noir poêlé avec pommes, pommes de terre nouvelles et raisins secs",
  'SRC-032-D5': "Pommes évidées farcies de boudin noir et oignons, cuites au four",
  'SRC-032-D6': "Boudin noir et pommes sautés au beurre, flambés au calvados",

  /* ── Dérivées SRC-033 ────────────────────────────────────────────────── */
  'SRC-033-D1': "Soupe de moules et pommes de terre dans un bouillon de poisson aux tomates râpées",
  'SRC-033-D2': "Bouillabaisse servie d'abord en soupe filtrée, puis avec les fruits de mer en assiette",
  'SRC-033-D3': "Soupe de moules dans un bouillon de poisson et tomates avec concentré, sans vin blanc",

  /* ── Dérivées SRC-034 ────────────────────────────────────────────────── */
  'SRC-034-D1': "Calamars flambés au cognac, mijotés dans une sauce tomate au vin blanc, sans crème",
  'SRC-034-D2': "Calamars flambés au whisky, mijotés dans une sauce tomate au vin blanc",
  'SRC-034-D3': "Calamars flambés au cognac, mijotés dans un vin blanc lié à la crème fraîche au safran",

  /* ── Dérivées SRC-035 ────────────────────────────────────────────────── */
  'SRC-035-D1': "Carottes râpées en vinaigrette à l'orange avec cumin et raisins secs",
  'SRC-035-D2': "Carottes râpées assaisonnées d'une vinaigrette douce à l'orange sans vinaigre",
  'SRC-035-D3': "Carottes râpées avec des suprêmes d'orange frais en vinaigrette moutardée",

  /* ── Dérivées SRC-036 ────────────────────────────────────────────────── */
  'SRC-036-D1': "Haricots blancs avec confit de canard, saucisse de Toulouse et poitrine de porc, cuits longuement au four",
  'SRC-036-D2': "Cassoulet avec une croûte épaisse de haricots et de chapelure, mitonnée plusieurs fois au four",
  'SRC-036-D3': "Cassoulet avec saucisse de Toulouse et saucisse de Montbéliard réunies",
  'SRC-036-D4': "Cassoulet préparé la veille pour une texture plus concentrée après réchauffage",

  /* ── Dérivées SRC-037 ────────────────────────────────────────────────── */
  'SRC-037-D1': "Céleri branche blanchi puis assaisonné d'une rémoulade à la moutarde et yaourt",
  'SRC-037-D2': "Céleri rémoulade classique avec ajout de câpres pour une note piquante",
  'SRC-037-D3': "Céleri rémoulade avec des dés de pomme fraîche mélangés",

  /* ── Dérivées SRC-038 ────────────────────────────────────────────────── */
  'SRC-038-D1': "Feuilles de chou farcies d'un mélange bœuf-porc haché, mijotées dans une sauce tomate",
  'SRC-038-D2': "Chou farci avec une farce de brochet et porc haché, dans le style de la Dombes",
  'SRC-038-D3': "Chou farci à la viande, terminé sous le gril avec une couche gratinée",
  'SRC-038-D4': "Feuilles de chou blanc farcies d'un mélange bœuf-porc haché, mijotées longuement",

  /* ── Dérivées SRC-039 ────────────────────────────────────────────────── */
  'SRC-039-D1': "Noix de Saint-Jacques gratinées dans leur coquille sur un lit de poireaux fondus",
  'SRC-039-D2': "Noix de Saint-Jacques dans leur coquille, nappées d'une sauce Mornay et gratinées",
  'SRC-039-D3': "Noix de Saint-Jacques avec champignons morilles réhydratés dans une sauce crème, gratinées",
  'SRC-039-D4': "Noix de Saint-Jacques cuites dans leur coquille scellée au four dans une sauce crème",
  'SRC-039-D5': "Noix de Saint-Jacques saisies, flambées au whisky et nappées d'une sauce crème à l'échalote",

  /* ── Dérivées SRC-040 ────────────────────────────────────────────────── */
  'SRC-040-D1': "Fenouil d'abord blanchi puis saisi et braisé au vin blanc avec jus de citron",
  'SRC-040-D2': "Fenouil braisé dans un bouillon léger fortement acidulé au jus de citron, sans vin",
  'SRC-040-D3': "Fenouil braisé avec une proportion plus importante d'huile d'olive et sans beurre",
  'SRC-040-D4': "Fenouil braisé au vin blanc avec ail et herbes dans le style provençal",

  /* ── Dérivées SRC-041 ────────────────────────────────────────────────── */
  'SRC-041-D1': "Chou-fleur blanchi gratiné dans une sauce au bouillon de volaille liée au gruyère",
  'SRC-041-D2': "Chou-fleur blanchi dans une béchamel parfumée au curry, gratinée au gruyère",
  'SRC-041-D3': "Chou-fleur blanchi dans une béchamel enrichie d'oignons fondus, gratiné au gruyère",
  'SRC-041-D4': "Chou-fleur blanchi dans une béchamel crémeuse avec des noix concassées, gratiné",

  /* ── Dérivées SRC-042 ────────────────────────────────────────────────── */
  'SRC-042-D1': "Lentilles vertes et lardons mixés en velouté crémeux avec carottes et thym",
  'SRC-042-D2': "Lentilles corail mijotées avec lardons fumés, carottes et oignons au thym",
  'SRC-042-D3': "Lentilles vertes et lardons cuits à l'huile d'olive, assaisonnés au poivre noir en finition",

  /* ── Dérivées SRC-043 ────────────────────────────────────────────────── */
  'SRC-043-D1': "Morue effeuillée saisie avec des pommes de terre frites en fins bâtonnets et liée aux œufs brouillés",
  'SRC-043-D2': "Morue dessalée cuite au four avec pommes de terre, tomates fraîches et poivrons",

  /* ── Dérivées SRC-044 ────────────────────────────────────────────────── */
  'SRC-044-D1': "Moules cuites dans le vin blanc et beurre, dont le jus est lié à une farine pour une sauce courte",
  'SRC-044-D2': "Moules cuites dans le vin blanc et beurre, finies avec de la crème fraîche",
  'SRC-044-D3': "Moules cuites à couvert dans du cidre brut avec ail et beurre",

  /* ── Dérivées SRC-045 ────────────────────────────────────────────────── */
  'SRC-045-D1': "Jarret de veau braisé sans tomate dans une garniture aromatique de légumes au vin blanc",
  'SRC-045-D2': "Jarret de veau mijoté à l'huile d'olive avec tomates pelées et vin blanc",
  'SRC-045-D3': "Jarret de veau braisé avec une gremolata d'agrumes et d'anchois en finition",
  'SRC-045-D4': "Jarret de veau braisé avec champignons ajoutés en garniture",

  /* ── Dérivées SRC-046 ────────────────────────────────────────────────── */
  'SRC-046-D1': "Aubergines panées et saisies, montées sans tomate avec mozzarella, parmesan et basilic",
  'SRC-046-D2': "Aubergines rôties au four puis montées en gratin avec tomate, mozzarella et parmesan",
  'SRC-046-D3': "Parmigiana dans le style napolitain, avec des tranches d'œuf dur intercalées entre les couches",

  /* ── Dérivées SRC-047 ────────────────────────────────────────────────── */
  'SRC-047-D1': "Petits pois mijotés avec laitue, oignons blancs et oignons grelots glacés",
  'SRC-047-D2': "Petits pois à la française liés au beurre pommade en finition",
  'SRC-047-D3': "Petits pois avec laitue effilée dans un beurre monté, sans oignons grelots",
  'SRC-047-D4': "Cuisses de poulet ajoutées aux petits pois à la française avec laitue et oignons",

  /* ── Dérivées SRC-048 ────────────────────────────────────────────────── */
  'SRC-048-D1': "Compotée de poivrons et tomates au piment d'Espelette avec œufs brouillés et jambon de Bayonne",
  'SRC-048-D2': "Fondue de poivrons et tomates au piment d'Espelette sans œufs, servie en accompagnement",
  'SRC-048-D3': "Compotée de poivrons rouges et piments doux verts aux œufs brouillés, au piment d'Espelette",
  'SRC-048-D4': "Compotée de poivrons et tomates avec des œufs pochés dans la sauce plutôt que brouillés",

  /* ── Dérivées SRC-049 ────────────────────────────────────────────────── */
  'SRC-049-D1': "Pommes de terre rissolées dans la graisse de canard avec ail, persil et oignons fondus",
  'SRC-049-D2': "Pommes de terre sarladaises enrichies de cèpes frais rissolés avec l'ail et le persil",
  'SRC-049-D3': "Pommes de terre rissolées dans de la graisse d'oie pure avec ail et persil",

  /* ── Dérivées SRC-050 ────────────────────────────────────────────────── */
  'SRC-050-D1': "Chou blanc mijoté avec saucisses de Morteau et Montbéliard, pommes de terre et légumes racines",
  'SRC-050-D2': "Potée d'hiver avec saucisses fumées, chou vert et lentilles vertes ajoutées aux légumes",
  'SRC-050-D3': "Potée traditionnelle avec jambonneau et saucisses fumées, chou et légumes d'hiver",
  'SRC-050-D4': "Potée servie d'abord en soupe de bouillon puis en assiette de viande et légumes séparés",

  /* ── Dérivées SRC-051 ────────────────────────────────────────────────── */
  'SRC-051-D1': "Légumes méditerranéens confits séparément puis réunis et confits au four à basse température",
  'SRC-051-D2': "Ratatouille provençale cuite rapidement à la poêle pour garder les légumes plus fermes",
  'SRC-051-D3': "Ratatouille provençale enrichie d'olives noires ajoutées en cours de cuisson",
  'SRC-051-D4': "Ratatouille provençale avec basilic frais ajouté en finition hors du feu",

  /* ── Dérivées SRC-052 ────────────────────────────────────────────────── */
  'SRC-052-D1': "Riz pilaf nacré à l'oignon et parfumé au curry avant absorption du bouillon",
  'SRC-052-D2': "Riz pilaf avec des vermicelles dorés au beurre mélangés au riz avant absorption du bouillon",
  'SRC-052-D3': "Riz pilaf avec des dés de potimarron cuits dans le bouillon",
  'SRC-052-D4': "Riz pilaf nacré avec poivrons rouges dans un bouillon de légumes sans viande",

  /* ── Dérivées SRC-053 ────────────────────────────────────────────────── */
  'SRC-053-D1': "Salade verte avec du fromage de chèvre pané et frit, vinaigrette au miel",
  'SRC-053-D2': "Salade verte avec chèvre gratiné sur croûton, pignons de pin torréfiés et vinaigrette au miel",
  'SRC-053-D3': "Salade verte avec chèvre gratiné sur croûton et vinaigrette au miel et basilic frais",
  'SRC-053-D4': "Salade verte avec chèvre gratiné sur croûton et tomates cerises fraîches",
  'SRC-053-D5': "Salade verte avec chèvre gratiné sur croûton et lamelles de poire fraîche",

  /* ── Dérivées SRC-054 ────────────────────────────────────────────────── */
  'SRC-054-D1': "Frisée avec confit de canard chaud et tomates en vinaigrette moutardée",
  'SRC-054-D2': "Salade au confit de canard avec pignons de pin torréfiés et échalotes en vinaigrette",
  'SRC-054-D3': "Salade avec confit de canard, gésiers confits et magret de canard fumé en vinaigrette",
  'SRC-054-D4': "Salade landaise avec tranche de foie gras de canard en plus du confit",
  'SRC-054-D5': "Salade avec confit de canard et filet de truite fumée en vinaigrette moutardée",

  /* ── Dérivées SRC-055 ────────────────────────────────────────────────── */
  'SRC-055-D1': "Saumon saisi puis nappé d'une sauce crème-oseille déglacée au vermouth sec",
  'SRC-055-D2': "Saumon en sauce crème-oseille au vin blanc, servi sur des pâtes fraîches aux œufs",

  /* ── Dérivées SRC-056 ────────────────────────────────────────────────── */
  'SRC-056-D1': "Soufflés au fromage de ménage cuits dans des ramequins individuels",
  'SRC-056-D2': "Soufflé à la béchamel de gruyère et comté affiné pour une saveur plus prononcée",
  'SRC-056-D3': "Soufflé au gruyère et emmental relevé de ciboulette fraîche",
  'SRC-056-D4': "Soufflé au gruyère avec de la mimolette demi-vieille pour une couleur et saveur dorées",
  'SRC-056-D5': "Soufflé léger lié au fromage blanc et à la fécule, sans béchamel",

  /* ── Dérivées SRC-057 ────────────────────────────────────────────────── */
  'SRC-057-D1': "Fond feuilleté garni d'oignons longuement fondus avec crème liée aux œufs à la muscade",
  'SRC-057-D2': "Tarte à l'oignon sur fond feuilleté avec lardons et fromage de chèvre en garniture",
  'SRC-057-D3': "Tarte à l'oignon avec lardons, relevée d'herbes de Provence séchées",
  'SRC-057-D4': "Tarte fine feuilletée d'oignons longuement confits au miel et lardons, sans appareil à crème",

  /* ── Dérivées SRC-058 ────────────────────────────────────────────────── */
  'SRC-058-D1': "Terrine de porc haché et échine avec des morceaux de poulet intégrés dans la masse",
  'SRC-058-D2': "Terrine de porc haché avec poivrons rôtis et olives en garniture intercalée",
  'SRC-058-D3': "Terrine de campagne conditionnée en bocaux stérilisés pour une conservation longue durée",
  'SRC-058-D4': "Terrine de porc haché aromatisée aux épices du pain d'épices",

  /* ── Dérivées SRC-059 ────────────────────────────────────────────────── */
  'SRC-059-D1': "Thon en conserve mijoté dans une compotée de poivrons rouges et verts à la tomate",
  'SRC-059-D2': "Thon mijoté dans une piperade de poivrons et tomates liée aux œufs en fin de cuisson",
  'SRC-059-D3': "Thon à la basquaise terminé sous le gril avec une couche de fromage gratinée",

  /* ── Dérivées SRC-060 ────────────────────────────────────────────────── */
  'SRC-060-D1': "Truite meunière avec amandes effilées torréfiées à sec au beurre, sans déglacage",
  'SRC-060-D2': "Truite poêlée puis flambée au cognac, servie avec des amandes effilées",
  'SRC-060-D3': "Truite cuite au four sous une couche de crème fraîche et amandes effilées",
  'SRC-060-D4': "Filets de truite enrobés de farine, saisis au beurre et garnis d'amandes effilées",
}

/* ── Application au corpus ──────────────────────────────────────────── */
const rapport = JSON.parse(readFileSync(REPORT, 'utf8'))
const publiables = new Set(
  rapport.recipe_eligibility
    .filter((r) => r.eligible_for_publication)
    .map((r) => r.code),
)

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))

const poses = []
const refus = []
const ignorees = [] // publiables sans description dans ce lot

for (const [code, description] of Object.entries(DESCRIPTIONS)) {
  const recette = parCode.get(code)
  if (!recette) {
    refus.push(`${code} : absent du corpus`)
    continue
  }
  if (!publiables.has(code)) {
    refus.push(`${code} ${recette.family} : non publiable, ignoré`)
    continue
  }
  if (recette.description_courte && recette.description_courte !== description) {
    refus.push(`${code} ${recette.family} : description déjà posée, non écrasée`)
    continue
  }
  recette.description_courte = description
  poses.push(`${code.padEnd(14)} ${recette.family}`)
}

// Recettes publiables sans description dans ce lot
for (const code of publiables) {
  if (!Object.hasOwn(DESCRIPTIONS, code)) {
    const recette = parCode.get(code)
    ignorees.push(`${code.padEnd(14)} ${recette?.family || '?'}`)
  }
}

console.log(`${poses.length} description(s) posée(s) :`)
for (const ligne of poses) console.log(`  ${ligne}`)

if (refus.length) {
  console.log(`\n${refus.length} refus :`)
  for (const ligne of refus) console.log(`  ${ligne}`)
}

if (ignorees.length) {
  console.log(`\n${ignorees.length} recette(s) publiable(s) sans description dans ce lot :`)
  for (const ligne of ignorees) console.log(`  ${ligne}`)
} else {
  console.log('\nToutes les recettes publiables ont une description.')
}

const avecDescription = corpus.recipes.filter((r) => r.description_courte).length
console.log(`\nTotal descriptions dans le corpus après ce lot : ${avecDescription}`)

if (dryRun) {
  console.log('\nSimulation : rien écrit.')
} else {
  writeFileSync(CORPUS, `${JSON.stringify(corpus, null, 2)}\n`)
  console.log(`\n${CORPUS} mis à jour.`)
}

export { DESCRIPTIONS }
