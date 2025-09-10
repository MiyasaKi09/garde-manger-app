// lib/meta.js
// Estime des métadonnées produit à partir du nom/catégorie avec précision maximale
// Renvoie: { density_g_per_ml, grams_per_unit, confidence_density, confidence_unit, reason, category_suggestion }

/* ============ DENSITÉS (g/ml) ============ */
const DENSITY_RULES = [
  // HUILES & CORPS GRAS
  { rx:/huile\s+(olive|colza|tournesol|arachide)/i,    gml:0.92, conf:0.95 },
  { rx:/huile\s+(coco|palme)/i,                        gml:0.92, conf:0.90 },
  { rx:/huile(?!\s+essentielle)/i,                     gml:0.91, conf:0.85 },
  { rx:/beurre(?!\s+de\s+cacahu[eè]te)/i,             gml:0.91, conf:0.85 },
  { rx:/margarine/i,                                   gml:0.80, conf:0.80 },
  
  // MIELS & SIROPS
  { rx:/miel\s+(acacia|châtaignier|lavande|thym)/i,    gml:1.45, conf:0.95 },
  { rx:/miel/i,                                        gml:1.42, conf:0.90 },
  { rx:/sirop\s+(érable|agave)/i,                      gml:1.37, conf:0.95 },
  { rx:/sirop\s+(glucose|mais)/i,                      gml:1.43, conf:0.95 },
  { rx:/sirop/i,                                       gml:1.35, conf:0.85 },
  { rx:/confiture|gelée/i,                             gml:1.33, conf:0.85 },
  
  // VINAIGRES & CONDIMENTS LIQUIDES
  { rx:/vinaigre\s+(balsamique|xérès)/i,               gml:1.06, conf:0.95 },
  { rx:/vinaigre\s+(vin|cidre)/i,                      gml:1.01, conf:0.95 },
  { rx:/vinaigre/i,                                    gml:1.02, conf:0.85 },
  { rx:/sauce\s+soja/i,                                gml:1.15, conf:0.90 },
  { rx:/ketchup/i,                                     gml:1.20, conf:0.90 },
  { rx:/moutarde/i,                                    gml:1.05, conf:0.85 },
  
  // PRODUITS LAITIERS
  { rx:/lait\s+(entier|3\.?[25])/i,                    gml:1.03, conf:0.95 },
  { rx:/lait\s+(demi-écrémé|1\.?5)/i,                  gml:1.02, conf:0.95 },
  { rx:/lait\s+écrémé/i,                               gml:1.03, conf:0.95 },
  { rx:/lait\s+concentré/i,                            gml:1.28, conf:0.95 },
  { rx:/lait(?!\s+(de\s+coco|d'amande))/i,            gml:1.03, conf:0.85 },
  { rx:/crème\s+(fraîche|liquide|fleurette)/i,         gml:1.01, conf:0.90 },
  { rx:/crème\s+épaisse/i,                             gml:0.99, conf:0.90 },
  { rx:/yaourt\s+(grec|bulgare)/i,                     gml:1.05, conf:0.90 },
  { rx:/yaourt/i,                                      gml:1.04, conf:0.85 },
  { rx:/fromage\s+blanc/i,                             gml:1.02, conf:0.85 },
  
  // LAITS VÉGÉTAUX
  { rx:/lait\s+de\s+coco/i,                            gml:0.95, conf:0.90 },
  { rx:/lait\s+(d'amande|de\s+soja|d'avoine)/i,        gml:1.03, conf:0.85 },
  
  // JUS & BOISSONS
  { rx:/jus\s+(orange|pomme|raisin|ananas)/i,          gml:1.05, conf:0.90 },
  { rx:/jus\s+de\s+citron/i,                           gml:1.02, conf:0.90 },
  { rx:/jus/i,                                         gml:1.04, conf:0.75 },
  { rx:/bouillon\s+(poule|bœuf|légumes)/i,             gml:1.00, conf:0.85 },
  { rx:/coulis\s+(tomate|fruit)/i,                     gml:1.02, conf:0.85 },
  { rx:/eau/i,                                         gml:1.00, conf:1.00 },
  
  // POUDRES & FARINES (densité apparente en vrac)
  { rx:/farine\s+(blé|t55|t65)/i,                      gml:0.53, conf:0.90 },
  { rx:/farine\s+(complète|t150)/i,                    gml:0.48, conf:0.90 },
  { rx:/farine\s+de\s+riz/i,                           gml:0.50, conf:0.85 },
  { rx:/farine\s+de\s+maïs/i,                          gml:0.56, conf:0.85 },
  { rx:/farine/i,                                      gml:0.53, conf:0.80 },
  { rx:/semoule\s+(fine|couscous)/i,                   gml:0.65, conf:0.90 },
  { rx:/semoule/i,                                     gml:0.59, conf:0.85 },
  
  // SUCRES & ÉDULCORANTS
  { rx:/sucre\s+(blanc|roux|cassonade)/i,              gml:0.85, conf:0.90 },
  { rx:/sucre\s+glace/i,                               gml:0.56, conf:0.90 },
  { rx:/sucre/i,                                       gml:0.85, conf:0.80 },
  { rx:/miel\s+poudre/i,                               gml:0.40, conf:0.80 },
  
  // CÉRÉALES & LÉGUMINEUSES
  { rx:/riz\s+(basmati|thaï|jasmin)/i,                 gml:0.75, conf:0.90 },
  { rx:/riz\s+(rond|arborio|risotto)/i,                gml:0.80, conf:0.90 },
  { rx:/riz/i,                                         gml:0.78, conf:0.85 },
  { rx:/quinoa/i,                                      gml:0.78, conf:0.90 },
  { rx:/boulgour/i,                                    gml:0.68, conf:0.85 },
  { rx:/avoine\s+flocons/i,                            gml:0.38, conf:0.85 },
  { rx:/lentilles\s+(corail|rouge)/i,                  gml:0.85, conf:0.90 },
  { rx:/lentilles\s+vertes/i,                          gml:0.80, conf:0.90 },
  { rx:/lentilles/i,                                   gml:0.82, conf:0.85 },
  { rx:/haricots?\s+(blancs?|rouges?)/i,               gml:0.78, conf:0.85 },
  { rx:/pois\s+(chiches?|cassés?)/i,                   gml:0.80, conf:0.85 },
  
  // PÂTES
  { rx:/p[aâ]tes\s+(fraîches|aux\s+œufs)/i,           gml:0.75, conf:0.90 },
  { rx:/p[aâ]tes\s+complètes/i,                        gml:0.58, conf:0.85 },
  { rx:/p[aâ]tes/i,                                    gml:0.65, conf:0.80 },
  
  // ÉPICES & ASSAISONNEMENTS
  { rx:/sel\s+(fin|gros)/i,                            gml:1.20, conf:0.95 },
  { rx:/sel/i,                                         gml:1.15, conf:0.85 },
  { rx:/poivre\s+(noir|blanc)/i,                       gml:0.65, conf:0.85 },
  { rx:/paprika/i,                                     gml:0.45, conf:0.85 },
  { rx:/curcuma/i,                                     gml:0.55, conf:0.85 },
  { rx:/cannelle/i,                                    gml:0.56, conf:0.85 },
  
  // CHOCOLATS & CACAO
  { rx:/chocolat\s+(noir|70)/i,                        gml:1.35, conf:0.90 },
  { rx:/chocolat\s+au\s+lait/i,                        gml:1.28, conf:0.90 },
  { rx:/cacao\s+poudre/i,                              gml:0.41, conf:0.85 },
  
  // NOIX & GRAINES
  { rx:/amandes?\s+(poudre|farine)/i,                  gml:0.64, conf:0.85 },
  { rx:/noix\s+de\s+coco\s+râpée/i,                    gml:0.35, conf:0.85 },
];

/* ============ POIDS PAR UNITÉ (grammes) ============ */
const UNIT_WEIGHT_RULES = [
  // ŒUFS (par calibre)
  { rx:/œufs?\s+(très\s+gros|xl)/i,                    g:73,   conf:0.95 },
  { rx:/œufs?\s+(gros|l)/i,                            g:63,   conf:0.95 },
  { rx:/œufs?\s+(moyens?|m)/i,                         g:53,   conf:0.95 },
  { rx:/œufs?\s+(petits?|s)/i,                         g:43,   conf:0.95 },
  { rx:/oeuf|œuf/i,                                    g:60,   conf:0.90 },
  
  // AIL & AROMATES
  { rx:/ail.*gousses?|gousses?.*ail/i,                 g:4,    conf:0.95 },
  { rx:/échalotes?/i,                                  g:25,   conf:0.85 },
  { rx:/oignons?\s+nouveaux/i,                         g:15,   conf:0.85 },
  
  // AGRUMES (par variété et taille)
  { rx:/citrons?\s+(jaunes?|de\s+nice)/i,              g:120,  conf:0.90 },
  { rx:/citrons?\s+verts?|limes?/i,                    g:60,   conf:0.90 },
  { rx:/citrons?/i,                                    g:115,  conf:0.85 },
  { rx:/oranges?\s+(navel|valencia)/i,                 g:200,  conf:0.90 },
  { rx:/oranges?\s+sanguines?/i,                       g:170,  conf:0.90 },
  { rx:/oranges?/i,                                    g:180,  conf:0.85 },
  { rx:/pamplemousses?/i,                              g:400,  conf:0.85 },
  { rx:/mandarines?|clémentines?/i,                    g:70,   conf:0.85 },
  
  // POMMES (par variété)
  { rx:/pommes?\s+(gala|fuji|braeburn)/i,              g:140,  conf:0.90 },
  { rx:/pommes?\s+(granny|golden)/i,                   g:160,  conf:0.90 },
  { rx:/pommes?\s+(reinette|canada)/i,                 g:180,  conf:0.90 },
  { rx:/pommes?(?!\s+de\s+terre)/i,                    g:150,  conf:0.85 },
  
  // AUTRES FRUITS
  { rx:/bananes?\s+(plantain|antillaise)/i,            g:200,  conf:0.90 },
  { rx:/bananes?/i,                                    g:120,  conf:0.85 },
  { rx:/poires?\s+(williams|conference)/i,             g:170,  conf:0.90 },
  { rx:/poires?/i,                                     g:160,  conf:0.85 },
  { rx:/avocats?\s+(hass|forte)/i,                     g:170,  conf:0.90 },
  { rx:/avocats?/i,                                    g:200,  conf:0.85 },
  { rx:/mangues?/i,                                    g:350,  conf:0.80 },
  { rx:/ananas/i,                                      g:1200, conf:0.80 },
  { rx:/melons?/i,                                     g:1500, conf:0.75 },
  { rx:/pastèques?/i,                                  g:4000, conf:0.70 },
  
  // LÉGUMES RACINES
  { rx:/carottes?\s+(nouvelles?|primeur)/i,            g:50,   conf:0.90 },
  { rx:/carottes?/i,                                   g:80,   conf:0.85 },
  { rx:/radis\s+(roses?|ronds?)/i,                     g:15,   conf:0.90 },
  { rx:/radis\s+noirs?/i,                              g:200,  conf:0.85 },
  { rx:/navets?/i,                                     g:150,  conf:0.80 },
  { rx:/betteraves?\s+(rouges?|chioggia)/i,            g:180,  conf:0.85 },
  { rx:/pommes?\s+de\s+terre\s+(charlotte|ratte)/i,    g:60,   conf:0.90 },
  { rx:/pommes?\s+de\s+terre\s+(bintje|russet)/i,      g:200,  conf:0.90 },
  { rx:/pommes?\s+de\s+terre|patates?/i,               g:150,  conf:0.80 },
  { rx:/patates?\s+douces?/i,                          g:250,  conf:0.80 },
  
  // OIGNONS & BULBES
  { rx:/oignons?\s+(blancs?|nouveaux)/i,               g:80,   conf:0.85 },
  { rx:/oignons?\s+(rouges?|violets?)/i,               g:120,  conf:0.85 },
  { rx:/oignons?\s+jaunes?/i,                          g:110,  conf:0.85 },
  { rx:/oignons?/i,                                    g:110,  conf:0.80 },
  { rx:/poireaux?/i,                                   g:300,  conf:0.80 },
  
  // LÉGUMES FRUITS
  { rx:/tomates?\s+(cœurs?\s+de\s+bœuf|beefsteak)/i,   g:350,  conf:0.95 },
  { rx:/tomates?\s+(noires?\s+de\s+crim[éeè]{1,2})/i,  g:180,  conf:0.95 },
  { rx:/tomates?\s+cerises?/i,                         g:15,   conf:0.95 },
  { rx:/tomates?\s+cocktail/i,                         g:35,   conf:0.90 },
  { rx:/tomates?\s+(grappes?|rondes?)/i,               g:130,  conf:0.90 },
  { rx:/tomates?\s+roma/i,                             g:80,   conf:0.90 },
  { rx:/tomates?/i,                                    g:120,  conf:0.80 },
  { rx:/aubergines?/i,                                 g:400,  conf:0.80 },
  { rx:/courgettes?/i,                                 g:200,  conf:0.80 },
  { rx:/concombres?/i,                                 g:300,  conf:0.80 },
  { rx:/poivrons?\s+(rouges?|verts?|jaunes?)/i,        g:160,  conf:0.85 },
  { rx:/poivrons?/i,                                   g:150,  conf:0.80 },
  
  // CHOUX & LÉGUMES FEUILLES
  { rx:/choux\s+(blancs?|pommés?)/i,                   g:1200, conf:0.80 },
  { rx:/choux?\s+rouges?/i,                            g:1000, conf:0.80 },
  { rx:/choux?\s+de\s+bruxelles/i,                     g:15,   conf:0.90 },
  { rx:/choux?\s+fleurs?/i,                            g:800,  conf:0.80 },
  { rx:/brocolis?/i,                                   g:400,  conf:0.80 },
  { rx:/salades?\s+(iceberg|pommée)/i,                 g:500,  conf:0.85 },
  { rx:/salades?\s+(batavia|feuille\s+de\s+chêne)/i,   g:200,  conf:0.85 },
  { rx:/salades?/i,                                    g:250,  conf:0.75 },
  { rx:/épinards?\s+(pousses?|jeunes?)/i,              g:25,   conf:0.85 },
  
  // HERBES AROMATIQUES (par bouquet/botte)
  { rx:/persils?\s+(plat|frisé)/i,                     g:30,   conf:0.85 },
  { rx:/basilics?/i,                                   g:25,   conf:0.85 },
  { rx:/ciboulettes?/i,                                g:20,   conf:0.85 },
  { rx:/menthes?/i,                                    g:15,   conf:0.80 },
  { rx:/coriandres?\s+fraîches?/i,                     g:25,   conf:0.85 },
  { rx:/thyms?\s+frais/i,                              g:10,   conf:0.80 },
  { rx:/romarin\s+frais/i,                             g:15,   conf:0.80 },
  
  // VIANDES (portions standard)
  { rx:/steaks?\s+(de\s+bœuf|hachés?)/i,               g:120,  conf:0.90 },
  { rx:/côtes?\s+de\s+(bœuf|porc)/i,                   g:300,  conf:0.85 },
  { rx:/escalopes?\s+(de\s+porc|de\s+veau)/i,          g:150,  conf:0.90 },
  { rx:/blancs?\s+de\s+poulet/i,                       g:180,  conf:0.90 },
  { rx:/cuisses?\s+de\s+poulet/i,                      g:200,  conf:0.85 },
  { rx:/saucisses?\s+(de\s+toulouse|merguez)/i,        g:100,  conf:0.90 },
  
  // POISSONS (portions)
  { rx:/filets?\s+de\s+(saumon|cabillaud|sole)/i,      g:150,  conf:0.90 },
  { rx:/truites?\s+(entières?|portion)/i,              g:300,  conf:0.85 },
  { rx:/sardines?\s+fraîches?/i,                       g:80,   conf:0.85 },
  
  // PRODUITS DE BOULANGERIE
  { rx:/baguettes?\s+(tradition|classique)/i,          g:250,  conf:0.95 },
  { rx:/pains?\s+de\s+mie/i,                           g:500,  conf:0.90 },
  { rx:/croissants?/i,                                 g:60,   conf:0.90 },
  { rx:/pains?\s+au\s+chocolat/i,                      g:70,   conf:0.90 },
];

/* ============ SUGGESTIONS DE CATÉGORIES ============ */
const CATEGORY_RULES = [
  // Fruits
  { rx:/pommes?(?!\s+de\s+terre)|poires?|bananes?|oranges?|citrons?|avocats?|mangues?|ananas|kiwis?|fraises?|cerises?|pêches?|abricots?|prunes?|raisins?|melons?|pastèques?/i, cat:'Fruits' },
  { rx:/tomates?.*cerises?|tomates?.*cocktail/i, cat:'Fruits' }, // tomates cerises = plutôt fruit côté usage
  
  // Légumes par sous-catégories
  { rx:/tomates?(?!.*cerises?)(?!.*cocktail)|aubergines?|courgettes?|concombres?|poivrons?|piments?/i, cat:'Légumes fruits' },
  { rx:/carottes?|navets?|radis|betteraves?|pommes?\s+de\s+terre|patates?/i, cat:'Légumes racines' },
  { rx:/choux?|brocolis?|salades?|épinards?|roquettes?|mâches?/i, cat:'Légumes feuilles' },
  { rx:/oignons?|ails?|échalotes?|poireaux?/i, cat:'Légumes bulbes' },
  { rx:/haricots?\s+verts?|petits?\s+pois|fèves?|artichauts?|asperges?|céleris?/i, cat:'Légumes divers' },
  
  // Herbes et aromates
  { rx:/persils?|basilics?|ciboulettes?|menthes?|coriandres?|thyms?|romarin|origan|estragon/i, cat:'Herbes aromatiques' },
  { rx:/ails?.*gousses?|gousses?.*ails?/i, cat:'Aromates' },
  
  // Produits laitiers
  { rx:/laits?(?!\s+(de\s+coco|d'amande|de\s+soja))|crèmes?|yaourts?|fromages?|beurres?|margarines?/i, cat:'Produits laitiers' },
  { rx:/laits?\s+(de\s+coco|d'amande|de\s+soja|d'avoine)/i, cat:'Laits végétaux' },
  
  // Viandes
  { rx:/bœufs?|veaux?|agneau|mouton|porcs?|steaks?|côtes?|rôtis?|escalopes?/i, cat:'Viandes rouges' },
  { rx:/poulets?|dindes?|canards?|pintades?|volailles?/i, cat:'Volailles' },
  { rx:/jambons?|saucisses?|lardons?|bacon|chorizo|charcuteries?/i, cat:'Charcuterie' },
  
  // Poissons
  { rx:/saumons?|thons?|cabillauds?|soles?|truites?|sardines?|maquereaux?|daurades?/i, cat:'Poissons' },
  { rx:/crevettes?|langoustines?|crabes?|homards?|moules?|huîtres?|coquilles?/i, cat:'Fruits de mer' },
  
  // Céréales et féculents
  { rx:/riz|quinoa|boulgour|avoine|orge|épeautre/i, cat:'Céréales' },
  { rx:/p[aâ]tes?|spaghetti|penne|fusilli|lasagnes?/i, cat:'Pâtes' },
  { rx:/pains?|baguettes?|croissants?|brioches?/i, cat:'Boulangerie' },
  { rx:/farines?|semoules?/i, cat:'Farines et semoules' },
  
  // Légumineuses
  { rx:/lentilles?|haricots?|pois\s+(chiches?|cassés?)|fèves?(?!\s+fraîches?)/i, cat:'Légumineuses' },
  
  // Huiles et condiments
  { rx:/huiles?|vinaigres?|moutardes?|mayonnaises?/i, cat:'Huiles et vinaigres' },
  { rx:/sels?|poivres?|épices?|herbes?\s+séchées?/i, cat:'Épices et condiments' },
  { rx:/sauces?|ketchup|coulis/i, cat:'Sauces et condiments' },
  
  // Sucré
  { rx:/sucres?|miels?|sirops?|confitures?|gelées?/i, cat:'Sucrants' },
  { rx:/chocolats?|cacaos?/i, cat:'Chocolat et cacao' },
  
  // Boissons
  { rx:/jus|eaux?|bouillons?/i, cat:'Boissons' },
  
  // Œufs
  { rx:/œufs?|oeufs?/i, cat:'Œufs' },
  
  // Noix et graines
  { rx:/amandes?|noix|noisettes?|pistaches?|cacahuètes?|graines?/i, cat:'Noix et graines' },
];

/* ============ FONCTIONS UTILITAIRES ============ */
function pickRule(rules, text) {
  for (const rule of rules) {
    if (rule.rx.test(text)) return rule;
  }
  return null;
}

function pickCategory(text) {
  const rule = pickRule(CATEGORY_RULES, text);
  return rule ? rule.cat : 'Autre';
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
}

/* ============ FONCTION PRINCIPALE ============ */
export function estimateProductMeta({ name = '', category = '' }) {
  const searchText = `${name} ${category}`;
  const normalizedText = normalizeText(searchText);
  
  // Recherche de règles avec texte normalisé ET original
  const densityHit = pickRule(DENSITY_RULES, searchText) || pickRule(DENSITY_RULES, normalizedText);
  const unitHit = pickRule(UNIT_WEIGHT_RULES, searchText) || pickRule(UNIT_WEIGHT_RULES, normalizedText);
  
  // Valeurs par défaut intelligentes
  const density_g_per_ml = densityHit ? densityHit.gml : 1.0;
  const grams_per_unit = unitHit ? unitHit.g : null;
  const confidence_density = densityHit ? densityHit.conf : 0.5;
  const confidence_unit = unitHit ? unitHit.conf : 0.2;
  
  // Suggestion de catégorie si non fournie ou générique
  const category_suggestion = (!category || category.toLowerCase() === 'autre') 
    ? pickCategory(name) 
    : null;
  
  // Raisons détaillées
  const reason = {
    density: densityHit ? 'keyword_match' : 'default_water',
    density_rule: densityHit?.rx?.source || null,
    unit: unitHit ? 'weight_database' : 'unknown',
    unit_rule: unitHit?.rx?.source || null,
    category: category_suggestion ? 'auto_detected' : 'provided'
  };
  
  return {
    density_g_per_ml,
    grams_per_unit,
    confidence_density,
    confidence_unit,
    category_suggestion,
    reason,
    // Métadonnées supplémentaires pour debugging
    debug: {
      search_text: searchText,
      normalized_text: normalizedText,
      density_matches: DENSITY_RULES.filter(r => r.rx.test(searchText) || r.rx.test(normalizedText)).length,
      unit_matches: UNIT_WEIGHT_RULES.filter(r => r.rx.test(searchText) || r.rx.test(normalizedText)).length
    }
  };
}

/* ============ FONCTIONS UTILITAIRES EXPORTÉES ============ */

// Obtenir toutes les catégories possibles
export function getAllCategories() {
  return [...new Set(CATEGORY_RULES.map(r => r.cat))].sort();
}

// Obtenir des suggestions de produits similaires
export function getSimilarProducts(productName, limit = 5) {
  const normalized = normalizeText(productName);
  const suggestions = [];
  
  // Recherche dans les règles de densité
  DENSITY_RULES.forEach(rule => {
    const match = rule.rx.source.match(/([^|()\\]+)/g);
    if (match) {
      match.forEach(term => {
        const cleanTerm = term.replace(/[^a-zA-Z\s]/g, '').trim();
        if (cleanTerm.length > 2 && normalizeText(cleanTerm).includes(normalized.split(' ')[0])) {
          suggestions.push({
            name: cleanTerm,
            type: 'density',
            confidence: rule.conf
          });
        }
      });
    }
  });
  
  // Recherche dans les règles d'unités
  UNIT_WEIGHT_RULES.forEach(rule => {
    const match = rule.rx.
