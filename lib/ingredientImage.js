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
  ['epinard', 'Spinach'], ['laitue', 'Lettuce'], ['salade', 'Lettuce'], ['roquette', 'Rocket'], ['mache', 'Lettuce'],
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
  ['joue de boeuf', 'Beef'], ['entrecote', 'Beef'], ['bavette', 'Beef'], ['steak', 'Beef'], ['boeuf', 'Beef'],
  ['veau', 'Veal'], ['agneau', 'Lamb'], ['gigot', 'Lamb'], ['porc', 'Pork'],
  ['escalope de dinde', 'Turkey'], ['dinde', 'Turkey'],
  ['blanc de poulet', 'Chicken Breast'], ['cuisse de poulet', 'Chicken Legs'], ['escalope', 'Chicken'], ['poulet', 'Chicken'],
  ['magret', 'Duck'], ['canard', 'Duck'],
  ['jambon', 'Ham'], ['lardon', 'Bacon'], ['bacon', 'Bacon'], ['chorizo', 'Chorizo'],
  ['saucisse', 'Sausages'], ['merguez', 'Sausages'], ['boudin', 'Sausages'],
  // Poissons & fruits de mer
  ['saumon', 'Salmon'], ['thon', 'Tuna'], ['cabillaud', 'Cod'], ['colin', 'Cod'], ['lieu', 'Cod'], ['merlu', 'Cod'],
  ['truite', 'Trout'], ['maquereau', 'Mackerel'], ['crevette', 'Prawns'], ['gambas', 'Prawns'],
  ['sardine', 'Sardines'], ['moule', 'Mussels'], ['calamar', 'Squid'],
  // Crémerie & œufs
  ['parmesan', 'Parmesan'], ['mozzarella', 'Mozzarella'], ['feta', 'Feta'], ['mascarpone', 'Mascarpone'],
  ['ricotta', 'Ricotta'], ['comte', 'Cheese'], ['gruyere', 'Cheese'], ['emmental', 'Cheese'], ['cheddar', 'Cheddar Cheese'],
  ['chevre', 'Goats Cheese'], ['fromage', 'Cheese'], ['beurre', 'Butter'], ['creme', 'Cream'],
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
  for (const [fr, en] of MAP) {
    if (n.includes(norm(fr))) return en
  }
  return null
}

export function ingredientImageUrl(name, size = 'Medium') {
  const en = guessIngredient(name)
  if (!en) return null
  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(en)}-${size}.png`
}
