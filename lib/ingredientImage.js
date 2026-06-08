// Image d'ingrédient « jolie + cohérente » depuis TheMealDB (gratuit, sans clé).
//   https://www.themealdb.com/images/ingredients/<Nom>-Medium.png
// On mappe le nom de produit FR → nom d'ingrédient TheMealDB (anglais UK).
// L'URL est déterministe → l'image s'affiche côté client, sans appel API ni stockage.

const COMBINING = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g')

function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(COMBINING, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Ordre IMPORTANT : du plus spécifique au plus générique (1ère sous-chaîne trouvée gagne).
const MAP = [
  // Légumes
  ['pomme de terre nouvelle', 'New Potatoes'], ['pomme de terre', 'Potatoes'], ['patate douce', 'Sweet Potatoes'], ['patate', 'Potatoes'],
  ['champignon', 'Mushrooms'], ['courgette', 'Courgettes'], ['aubergine', 'Aubergine'],
  ['poivron rouge', 'Red Pepper'], ['poivron vert', 'Green Pepper'], ['poivron', 'Red Pepper'],
  ['tomate cerise', 'Cherry Tomatoes'], ['tomate', 'Tomatoes'], ['carotte', 'Carrots'],
  ['oignon rouge', 'Red Onion'], ['oignon grelot', 'Onion'], ['oignon', 'Onion'], ['echalote', 'Shallots'], ['ail', 'Garlic'],
  ['epinard', 'Spinach'], ['laitue', 'Lettuce'], ['salade', 'Lettuce'], ['roquette', 'arugula'],['mache', 'Lettuce'],
  ['brocoli', 'Broccoli'], ['chou-fleur', 'Cauliflower'], ['chou fleur', 'Cauliflower'], ['chou', 'Cabbage'],
  ['petit pois', 'Peas'], ['pois gourmand', 'Peas'], ['pois', 'Peas'],
  ['feve', 'Broad Beans'], ['haricot vert', 'Green Beans'], ['haricot rouge', 'Kidney Beans'], ['haricot', 'Green Beans'],
  ['radis', 'Radish'], ['betterave', 'Beetroot'], ['navet', 'Turnip'],
  ['poireau', 'Leek'], ['celeri', 'Celery'], ['fenouil', 'Fennel'], ['asperge', 'Asparagus'], ['artichaut', 'Artichoke'],
  ['concombre', 'Cucumber'], ['mais', 'Sweetcorn'], ['courge', 'Butternut Squash'], ['potiron', 'Butternut Squash'],
  ['potimarron', 'Butternut Squash'], ['butternut', 'Butternut Squash'], ['endive', 'Chicory'],
  // Fruits
  ['pomme', 'Apple'], ['poire', 'Pears'], ['banane', 'Banana'], ['citron vert', 'Lime'], ['citron', 'Lemon'],
  ['orange', 'Orange'], ['clementine', 'Orange'], ['mandarine', 'Orange'],
  ['fraise', 'Strawberries'], ['framboise', 'Raspberries'], ['myrtille', 'Blueberries'], ['mure', 'Blackberries'],
  ['raisin', 'Grapes'], ['peche', 'Peaches'], ['abricot', 'Apricot'], ['ananas', 'Pineapple'],
  ['mangue', 'Mango'], ['avocat', 'Avocado'], ['kiwi', 'Kiwi'], ['melon', 'Melon'], ['pasteque', 'Watermelon'],
  ['cerise', 'Cherry'], ['figue', 'Figs'], ['grenade', 'Pomegranate'],
  // Viandes
  ['joue de boeuf', 'beef steak'], ['entrecote', 'beef steak'], ['bavette', 'beef steak'], ['steak', 'beef steak'], ['boeuf', 'beef steak'],
  ['veau', 'veal meat'], ['agneau', 'lamb meat'], ['gigot', 'lamb meat'], ['porc', 'raw pork meat'],
  ['escalope de dinde', 'turkey breast meat'], ['dinde', 'turkey breast meat'],
  ['blanc de poulet', 'raw chicken breast'], ['cuisse de poulet', 'raw chicken'], ['escalope', 'chicken breast'], ['poulet', 'raw chicken breast'],
  ['magret', 'duck breast'], ['canard', 'duck breast meat'],
  ['jambon de bayonne', 'cured ham'], ['jambon de parme', 'prosciutto'], ['jambon serrano', 'prosciutto'],
  ['jambon cru', 'cured ham'], ['prosciutto', 'prosciutto'], ['jambon', 'sliced ham'],
  ['lardon', 'bacon strips'], ['bacon', 'bacon strips'], ['chorizo', 'chorizo sausage'],
  ['saucisse', 'raw sausage'], ['merguez', 'raw sausage'], ['boudin', 'sausage'],
  // Poissons & fruits de mer
  ['saumon', 'raw salmon fillet'], ['thon', 'raw tuna steak'], ['cabillaud', 'cod fillet'], ['colin', 'cod fillet'], ['lieu', 'cod fillet'], ['merlu', 'cod fillet'],
  ['truite', 'trout fish'], ['maquereau', 'mackerel fish'], ['crevette', 'prawns'], ['gambas', 'prawns'],
  ['sardine', 'sardines fish'], ['moule', 'mussels'], ['calamar', 'squid'],
  // Crémerie & œufs
  ['parmesan', 'Parmesan'], ['mozzarella', 'Mozzarella'], ['feta', 'Feta'], ['mascarpone', 'Mascarpone'],
  ['ricotta', 'Ricotta'], ['comte', 'Cheese'], ['gruyere', 'Cheese'], ['emmental', 'Cheese'], ['cheddar', 'Cheddar Cheese'],
  ['chevre', 'Goats Cheese'], ['fromage', 'Cheese'], ['beurre', 'Butter'], ['creme', 'whipping cream'],
  ['skyr', 'Greek Yogurt'], ['yaourt grec', 'Greek Yogurt'], ['yaourt', 'Yogurt'], ['lait', 'Milk'],
  ['oeuf', 'Eggs'],
  // Féculents & épicerie
  ['riz', 'Rice'], ['quinoa', 'Quinoa'], ['boulgour', 'Bulgur Wheat'], ['semoule', 'Couscous'], ['couscous', 'Couscous'],
  ['spaghetti', 'Spaghetti'], ['penne', 'Macaroni'], ['tagliatelle', 'Tagliatelle'],
  ['nouille', 'Noodles'], ['pate', 'Spaghetti'],
  ['farine', 'Flour'], ['pain', 'Bread'], ['baguette', 'Baguette'],
  ['lentille', 'Lentils'], ['pois chiche', 'Chickpeas'],
  ['amande', 'Almonds'], ['noisette', 'Hazelnuts'], ['noix de cajou', 'Cashew Nuts'], ['noix', 'Walnuts'],
  ['huile olive', 'Olive Oil'], ['huile', 'Olive Oil'], ['vinaigre', 'Vinegar'],
  ['sucre', 'Sugar'], ['miel', 'Honey'], ['chocolat', 'Chocolate'], ['cacao', 'Cocoa'],
  ['sauce tomate', 'Tomato Sauce'], ['coulis', 'Tomato Sauce'], ['moutarde', 'Mustard'],
  // Herbes & épices
  ['basilic', 'Basil'], ['persil', 'Parsley'], ['coriandre', 'Coriander'], ['menthe', 'Mint'],
  ['thym', 'Thyme'], ['romarin', 'Rosemary'], ['ciboulette', 'Chives'], ['aneth', 'Dill'],
  ['gingembre', 'Ginger'], ['paprika', 'Paprika'], ['curry', 'Curry Powder'], ['cumin', 'Cumin'], ['cannelle', 'Cinnamon'],
]

export function guessIngredient(name) {
  const n = norm(name)
  if (!n) return null
  // version « singularisée » (retire un s/x final par mot) pour que les pluriels
  // matchent les clés multi-mots : « pommes de terre » → clé « pomme de terre »
  // (sinon ça tombait sur la clé plus courte « pomme » → Apple !)
  const nSing = n.split(' ').map((w) => w.replace(/[sx]$/, '')).join(' ')
  for (const [fr, en] of MAP) {
    const k = norm(fr)
    if (n.includes(k) || nSing.includes(k)) return en
  }
  return null
}

export function ingredientImageUrl(name, size = 'Medium') {
  const en = guessIngredient(name)
  if (!en) return null
  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(en)}-${size}.png`
}
