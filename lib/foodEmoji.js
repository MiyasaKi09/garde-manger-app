const FOOD_EMOJI = {
  // Fruits
  'pomme': '🍎', 'poire': '🍐', 'banane': '🍌', 'raisin': '🍇',
  'fraise': '🍓', 'cerise': '🍒', 'pêche': '🍑', 'mangue': '🥭',
  'ananas': '🍍', 'pastèque': '🍉', 'melon': '🍈', 'kiwi': '🥝',
  'citron': '🍋', 'orange': '🍊', 'mandarine': '🍊', 'clémentine': '🍊',
  'abricot': '🍑', 'prune': '🍑', 'myrtille': '🫐', 'cassis': '🫐',
  'framboise': '🍓', 'mûre': '🫐', 'avocat': '🥑', 'olive': '🫒',
  'noix de coco': '🥥', 'grenade': '🍎', 'datte': '🌴',
  'figue': '🫐', 'litchi': '🍑', 'fruit de la passion': '🍑',

  // Légumes
  'tomate': '🍅', 'carotte': '🥕', 'brocoli': '🥦', 'maïs': '🌽',
  'poivron': '🫑', 'concombre': '🥒', 'courgette': '🥒', 'aubergine': '🍆',
  'pomme de terre': '🥔', 'patate douce': '🍠', 'patate': '🥔',
  'oignon': '🧅', 'échalote': '🧅', 'ail': '🧄',
  'champignon': '🍄', 'salade': '🥬', 'laitue': '🥬',
  'épinard': '🥬', 'chou': '🥬', 'chou-fleur': '🥦',
  'haricot vert': '🫛', 'petit pois': '🫛', 'pois': '🫛',
  'radis': '🥕', 'betterave': '🥕', 'navet': '🥕',
  'céleri': '🥬', 'poireau': '🥬', 'artichaut': '🥬',
  'asperge': '🥬', 'fenouil': '🥬', 'endive': '🥬',
  'butternut': '🎃', 'potiron': '🎃', 'courge': '🎃', 'citrouille': '🎃',

  // Viandes
  'poulet': '🍗', 'boeuf': '🥩', 'bœuf': '🥩', 'porc': '🥩',
  'agneau': '🥩', 'veau': '🥩', 'dinde': '🍗', 'canard': '🦆',
  'jambon': '🥓', 'saucisse': '🌭', 'bacon': '🥓', 'steak': '🥩',
  'escalope': '🍗', 'filet': '🥩', 'côte': '🥩', 'lardon': '🥓',
  'chorizo': '🌭', 'merguez': '🌭', 'rôti': '🥩', 'gigot': '🥩',
  'magret': '🦆', 'cuisse': '🍗', 'aile': '🍗',

  // Poissons & fruits de mer
  'saumon': '🐟', 'thon': '🐟', 'cabillaud': '🐟', 'sardine': '🐟',
  'crevette': '🦐', 'moule': '🦪', 'huître': '🦪', 'crabe': '🦀',
  'truite': '🐟', 'sole': '🐟', 'bar': '🐟', 'dorade': '🐟',
  'lieu': '🐟', 'maquereau': '🐟', 'anchois': '🐟', 'colin': '🐟',
  'calamar': '🦑', 'poulpe': '🐙', 'homard': '🦞',

  // Produits laitiers
  'lait': '🥛', 'fromage': '🧀', 'beurre': '🧈', 'crème': '🥛',
  'yaourt': '🥛', 'yogourt': '🥛', 'skyr': '🥛', 'mascarpone': '🧀',
  'mozzarella': '🧀', 'parmesan': '🧀', 'comté': '🧀', 'gruyère': '🧀',
  'emmental': '🧀', 'chèvre': '🧀', 'roquefort': '🧀', 'camembert': '🧀',
  'ricotta': '🧀', 'feta': '🧀', 'halloumi': '🧀', 'cheddar': '🧀',
  'raclette': '🧀', 'reblochon': '🧀', 'brie': '🧀',

  // Oeufs
  'oeuf': '🥚', 'œuf': '🥚',

  // Céréales & Féculents
  'riz': '🍚', 'pâte': '🍝', 'pain': '🍞', 'farine': '🌾',
  'semoule': '🌾', 'quinoa': '🌾', 'boulgour': '🌾', 'blé': '🌾',
  'avoine': '🌾', 'céréale': '🥣', 'muesli': '🥣', 'granola': '🥣',
  'nouille': '🍜', 'spaghetti': '🍝', 'penne': '🍝', 'tagliatelle': '🍝',
  'tortilla': '🫓', 'galette': '🫓', 'crêpe': '🫓', 'wrap': '🫓',
  'couscous': '🌾', 'polenta': '🌾', 'gnocchi': '🍝',

  // Herbes & Épices
  'basilic': '🌿', 'persil': '🌿', 'coriandre': '🌿', 'menthe': '🌿',
  'thym': '🌿', 'romarin': '🌿', 'ciboulette': '🌿', 'aneth': '🌿',
  'laurier': '🍃', 'origan': '🌿', 'estragon': '🌿', 'sauge': '🌿',
  'cumin': '🧂', 'paprika': '🌶️', 'piment': '🌶️',
  'curry': '🧂', 'cannelle': '🧂', 'gingembre': '🫚', 'curcuma': '🧂',
  'muscade': '🧂', 'poivre': '🧂', 'sel': '🧂',

  // Sucres & Sucreries
  'sucre': '🍬', 'miel': '🍯', 'chocolat': '🍫', 'confiture': '🫙',
  'sirop': '🍯', 'nutella': '🍫', 'cacao': '🍫',
  'biscuit': '🍪', 'cookie': '🍪', 'gâteau': '🍰',

  // Boissons
  'café': '☕', 'thé': '🍵', 'jus': '🧃', 'eau': '💧',
  'vin': '🍷', 'bière': '🍺', 'soda': '🥤', 'limonade': '🍋',
  'schweppes': '🥤', 'coca': '🥤',

  // Condiments & Sauces
  'huile': '🫒', 'vinaigre': '🫙', 'sauce': '🥫', 'moutarde': '🟡',
  'ketchup': '🍅', 'mayonnaise': '🥫', 'sauce soja': '🥫', 'pesto': '🌿',
  'tabasco': '🌶️', 'harissa': '🌶️',

  // Légumineuses
  'lentille': '🫘', 'pois chiche': '🫘', 'haricot sec': '🫘',
  'flageolet': '🫘', 'fève': '🫘',

  // Noix & Graines
  'amande': '🥜', 'noix': '🥜', 'noisette': '🌰', 'cacahuète': '🥜',
  'pistache': '🥜', 'graine': '🌻', 'sésame': '🌻', 'tournesol': '🌻',
  'lin': '🌻', 'chia': '🌻', 'cajou': '🥜', 'pécan': '🥜',

  // Conserves & Bocaux
  'conserve': '🥫', 'bocal': '🫙', 'cornichon': '🥒',

  // Surgelés
  'surgelé': '🧊', 'glacé': '🍦', 'glace': '🍨', 'sorbet': '🍨',

  // Snacks
  'chips': '🥔', 'pringles': '🥔', 'pop-corn': '🍿', 'crackers': '🍘',
};

const CATEGORY_EMOJI = {
  'fruits': '🍎', 'fruit': '🍎',
  'légumes': '🥬', 'légume': '🥬',
  'viandes': '🥩', 'viande': '🥩', 'boucherie': '🥩',
  'volaille': '🍗',
  'poissons': '🐟', 'poisson': '🐟', 'poissonnerie': '🐟',
  'fruits de mer': '🦐',
  'produits laitiers': '🥛', 'laitier': '🥛', 'crèmerie': '🥛',
  'oeufs': '🥚', 'œufs': '🥚',
  'céréales': '🌾', 'féculents': '🍚',
  'épices': '🧂', 'herbes': '🌿', 'aromates': '🌿',
  'condiments': '🫙', 'sauces': '🥫',
  'boissons': '🥤', 'boisson': '🥤',
  'surgelés': '🧊', 'surgelé': '🧊',
  'conserves': '🥫', 'conserve': '🥫',
  'boulangerie': '🍞', 'pain': '🍞',
  'pâtisserie': '🍰', 'dessert': '🍰',
  'sucreries': '🍬', 'confiserie': '🍬',
  'huiles': '🫒', 'matières grasses': '🫒',
  'noix': '🥜', 'graines': '🌻', 'fruits secs': '🥜',
  'légumineuses': '🫘',
  'snacks': '🍿', 'apéritif': '🥂',
  'hygiène': '🧴', 'entretien': '🧹',
};

export function getFoodEmoji(name, category) {
  if (!name) return '🍽️';
  const lower = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const lowerOrig = name.toLowerCase();

  for (const [key, emoji] of Object.entries(FOOD_EMOJI)) {
    const keyNorm = key.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (lower.includes(keyNorm) || lowerOrig.includes(key)) return emoji;
  }

  if (category) {
    const catLower = category.toLowerCase();
    for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
      if (catLower.includes(key)) return emoji;
    }
  }

  return '🍽️';
}

const RECIPE_STYLES = {
  'viande': { emoji: '🥩', bg: '#a06a4d', bgEnd: '#74452f' },
  'boeuf': { emoji: '🥩', bg: '#8a5a3c', bgEnd: '#5e3a24' },
  'poulet': { emoji: '🍗', bg: '#c2a06a', bgEnd: '#94774a' },
  'volaille': { emoji: '🍗', bg: '#c2a06a', bgEnd: '#94774a' },
  'poisson': { emoji: '🐟', bg: '#6e8e8a', bgEnd: '#4e6b66' },
  'végétarien': { emoji: '🥬', bg: '#7a8a5a', bgEnd: '#586a3e' },
  'vegan': { emoji: '🌱', bg: '#6e9460', bgEnd: '#4e7042' },
  'pâtes': { emoji: '🍝', bg: '#d0b88c', bgEnd: '#a88a5c' },
  'soupe': { emoji: '🍲', bg: '#c2884a', bgEnd: '#8f5f2f' },
  'salade': { emoji: '🥗', bg: '#8aa05a', bgEnd: '#66803c' },
  'dessert': { emoji: '🍰', bg: '#c08490', bgEnd: '#97606e' },
  'petit-déjeuner': { emoji: '🥐', bg: '#d0a85e', bgEnd: '#a87e38' },
  'apéritif': { emoji: '🥂', bg: '#8a6e94', bgEnd: '#654e70' },
  'snack': { emoji: '🥪', bg: '#c28150', bgEnd: '#8f5a32' },
  'entrée': { emoji: '🥗', bg: '#6e938a', bgEnd: '#4e6e64' },
  'accompagnement': { emoji: '🥘', bg: '#9a8466', bgEnd: '#6f5e45' },
  'sauce': { emoji: '🥫', bg: '#b06149', bgEnd: '#844333' },
  'boisson': { emoji: '🥤', bg: '#76889a', bgEnd: '#56657c' },
  'boulangerie': { emoji: '🍞', bg: '#c2a06a', bgEnd: '#94774a' },
};

const DEFAULT_STYLE = { emoji: '🍽️', bg: '#7e8a5e', bgEnd: '#a06a4d' };

export function getRecipeStyle(category, title) {
  if (category) {
    const lower = category.toLowerCase();
    for (const [key, style] of Object.entries(RECIPE_STYLES)) {
      if (lower.includes(key)) return style;
    }
  }
  if (title) {
    const lower = title.toLowerCase();
    if (lower.includes('salade')) return RECIPE_STYLES['salade'];
    if (lower.includes('soupe') || lower.includes('velouté')) return RECIPE_STYLES['soupe'];
    if (lower.includes('tarte') || lower.includes('gâteau') || lower.includes('mousse')) return RECIPE_STYLES['dessert'];
    if (lower.includes('pâtes') || lower.includes('spaghetti') || lower.includes('penne') || lower.includes('risotto')) return RECIPE_STYLES['pâtes'];
    if (lower.includes('poulet') || lower.includes('dinde')) return RECIPE_STYLES['poulet'];
    if (lower.includes('saumon') || lower.includes('cabillaud') || lower.includes('poisson')) return RECIPE_STYLES['poisson'];
    if (lower.includes('bœuf') || lower.includes('boeuf') || lower.includes('steak')) return RECIPE_STYLES['boeuf'];
  }
  return DEFAULT_STYLE;
}
