// Adaptateur de données local pour simuler Supabase
// À utiliser quand les vraies clés Supabase ne sont pas configurées

const MOCK_RECIPES = [
  {
    id: "1",
    title: "Ratatouille Provençale",
    name: "Ratatouille Provençale", 
    slug: "ratatouille-provencale",
    description: "Mijoté de légumes du soleil : aubergines, courgettes, tomates, poivrons",
    short_description: "Ratatouille traditionnelle",
    prep_min: 30,
    cook_min: 60, 
    rest_min: 0,
    servings: 6,
    myko_score: 95,
    category_id: 1,
    cuisine_type_id: 1,
    difficulty_level_id: 2,
    instructions: "Couper tous les légumes en dés. Faire revenir séparément aubergines, courgettes, poivrons. Ajouter les tomates, l'ail, les herbes de Provence. Mijoter 45 min.",
    chef_tips: "Cuire les légumes séparément d'abord pour une meilleure texture",
    is_vegetarian: true,
    is_vegan: true,
    is_gluten_free: true,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2", 
    title: "Curry de lentilles corail",
    name: "Curry de lentilles corail",
    slug: "curry-lentilles-corail",
    description: "Curry végétarien aux lentilles corail, lait de coco et épices indiennes",
    short_description: "Curry végétarien protéiné",
    prep_min: 20,
    cook_min: 35,
    rest_min: 0,
    servings: 4,
    myko_score: 88,
    category_id: 2,
    cuisine_type_id: 3,
    difficulty_level_id: 2,
    instructions: "Faire revenir l'oignon et les épices. Ajouter les lentilles corail, le lait de coco et les tomates. Cuire 25 min jusqu'à ce que les lentilles soient tendres.",
    chef_tips: "Rincer les lentilles corail avant cuisson pour éviter l'écume",
    is_vegetarian: true,
    is_vegan: true, 
    is_gluten_free: true,
    is_active: true,
    created_at: "2024-01-16T14:30:00Z"
  },
  {
    id: "3",
    title: "Soupe de potimarron rôti", 
    name: "Soupe de potimarron rôti",
    slug: "soupe-potimarron-roti",
    description: "Velouté onctueux de potimarron rôti avec une pointe de gingembre",
    short_description: "Velouté automnal de potimarron",
    prep_min: 20,
    cook_min: 45,
    rest_min: 0,
    servings: 6,
    myko_score: 90,
    category_id: 3,
    cuisine_type_id: 1,
    difficulty_level_id: 2,
    instructions: "Rôtir le potimarron coupé au four. Faire suer l'oignon, ajouter le potimarron, le bouillon et le gingembre. Mixer jusqu'à obtenir un velouté lisse.",
    chef_tips: "Rôtir le potimarron au four développe ses saveurs",
    is_vegetarian: true,
    is_vegan: true,
    is_gluten_free: true,
    is_active: true,
    created_at: "2024-01-17T09:15:00Z"
  },
  {
    id: "4",
    title: "Risotto aux champignons",
    name: "Risotto aux champignons", 
    slug: "risotto-champignons",
    description: "Risotto crémeux aux champignons de saison et parmesan",
    short_description: "Risotto italien authentique", 
    prep_min: 20,
    cook_min: 35,
    rest_min: 0,
    servings: 4,
    myko_score: 82,
    category_id: 2,
    cuisine_type_id: 2,
    difficulty_level_id: 4,
    instructions: "Faire revenir les champignons. Nacrer le riz avec l'oignon. Ajouter le bouillon louche par louche en remuant. Terminer avec beurre et parmesan.",
    chef_tips: "Ne jamais arrêter de remuer et maintenir le bouillon chaud",
    is_vegetarian: true,
    is_vegan: false,
    is_gluten_free: true,
    is_active: true,
    created_at: "2024-01-18T16:45:00Z"
  },
  {
    id: "5",
    title: "Salade de quinoa aux légumes",
    name: "Salade de quinoa aux légumes",
    slug: "salade-quinoa-legumes", 
    description: "Salade complète et nutritive avec quinoa, légumes croquants et vinaigrette aux herbes",
    short_description: "Salade complète au quinoa",
    prep_min: 25,
    cook_min: 15,
    rest_min: 30,
    servings: 4,
    myko_score: 85,
    category_id: 1,
    cuisine_type_id: 1,
    difficulty_level_id: 1,
    instructions: "Cuire le quinoa. Préparer les légumes. Mélanger avec la vinaigrette et laisser mariner 30 min.",
    chef_tips: "Bien rincer le quinoa avant cuisson pour éviter l'amertume",
    is_vegetarian: true,
    is_vegan: true,
    is_gluten_free: true,
    is_active: true,
    created_at: "2024-01-19T11:20:00Z"
  },
  {
    id: "6",
    title: "Pad Thaï aux légumes",
    name: "Pad Thaï aux légumes",
    slug: "pad-thai-legumes",
    description: "Nouilles de riz sautées à la thaïlandaise avec légumes croquants et sauce aigre-douce",
    short_description: "Nouilles thaï aux légumes", 
    prep_min: 25,
    cook_min: 15,
    rest_min: 0,
    servings: 4,
    myko_score: 80,
    category_id: 2,
    cuisine_type_id: 4,
    difficulty_level_id: 3,
    instructions: "Réhydrater les nouilles de riz. Faire sauter l'ail, ajouter les légumes, puis les nouilles et la sauce. Terminer avec germes de soja et cacahuètes.",
    chef_tips: "Préparer tous les ingrédients avant de commencer la cuisson",
    is_vegetarian: true,
    is_vegan: true,
    is_gluten_free: true,
    is_active: true,
    created_at: "2024-01-20T13:10:00Z"
  }
];

const MOCK_CATEGORIES = [
  { id: 1, name: "Entrées", icon: "🥗", slug: "entrees" },
  { id: 2, name: "Plats principaux", icon: "🍽️", slug: "plats-principaux" },
  { id: 3, name: "Soupes", icon: "🍲", slug: "soupes" }
];

const MOCK_CUISINES = [
  { id: 1, name: "Française", flag: "🇫🇷", slug: "francaise" },
  { id: 2, name: "Italienne", flag: "🇮🇹", slug: "italienne" },
  { id: 3, name: "Indienne", flag: "🇮🇳", slug: "indienne" },
  { id: 4, name: "Asiatique", flag: "🥢", slug: "asiatique" }
];

const MOCK_DIFFICULTIES = [
  { id: 1, name: "Très facile", level: "très_facile" },
  { id: 2, name: "Facile", level: "facile" },
  { id: 3, name: "Moyen", level: "moyen" },
  { id: 4, name: "Difficile", level: "difficile" }
];

// Simuler l'interface Supabase
export const mockSupabaseClient = {
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        order: (column, options) => mockQuery(table, { columns, filters: { [column]: value }, order: { column, options } }),
        limit: (count) => mockQuery(table, { columns, filters: { [column]: value }, limit: count }),
        single: () => mockQuerySingle(table, { columns, filters: { [column]: value } })
      }),
      order: (column, options) => mockQuery(table, { columns, order: { column, options } }),
      limit: (count) => mockQuery(table, { columns, limit: count }),
      single: () => mockQuerySingle(table, { columns })
    })
  }),
  
  auth: {
    getUser: () => Promise.resolve({ 
      data: { 
        user: { id: 'mock-user', email: 'test@example.com' } 
      } 
    })
  }
};

function mockQuery(table, options = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let data = [];
      
      switch (table) {
        case 'recipes':
          data = [...MOCK_RECIPES];
          break;
        case 'recipe_categories':
          data = [...MOCK_CATEGORIES];
          break;
        case 'cuisine_types':
          data = [...MOCK_CUISINES];
          break;
        case 'difficulty_levels':
          data = [...MOCK_DIFFICULTIES];
          break;
        default:
          data = [];
      }

      // Appliquer les filtres
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          data = data.filter(item => item[key] === value);
        });
      }

      // Appliquer le tri
      if (options.order) {
        const { column, options: orderOptions } = options.order;
        data.sort((a, b) => {
          const aVal = a[column];
          const bVal = b[column];
          
          if (orderOptions?.ascending === false) {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      // Appliquer la limite
      if (options.limit) {
        data = data.slice(0, options.limit);
      }

      resolve({ data, error: null });
    }, 100); // Simuler un délai réseau
  });
}

function mockQuerySingle(table, options = {}) {
  return mockQuery(table, { ...options, limit: 1 }).then(result => {
    if (result.data && result.data.length > 0) {
      return { data: result.data[0], error: null };
    }
    return { data: null, error: { message: 'No rows found' } };
  });
}

// Fonction pour vérifier si on doit utiliser les données mock
export function shouldUseMockData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !supabaseUrl || 
         !supabaseKey || 
         supabaseUrl.includes('placeholder') || 
         supabaseKey.includes('placeholder') ||
         supabaseUrl === 'your_supabase_project_url';
}