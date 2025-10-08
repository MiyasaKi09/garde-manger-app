// Script pour insérer des recettes de test dans Supabase
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (remplacer par vos vraies valeurs)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testRecipes = [
  {
    title: 'Ratatouille Provençale',
    name: 'Ratatouille Provençale',
    slug: 'ratatouille-provencale',
    description: 'Mijoté de légumes du soleil : aubergines, courgettes, tomates, poivrons',
    short_description: 'Ratatouille traditionnelle',
    prep_min: 30,
    cook_min: 60,
    rest_min: 0,
    servings: 6,
    myko_score: 95,
    is_active: true,
    instructions: 'Couper tous les légumes en dés. Faire revenir séparément aubergines, courgettes, poivrons. Ajouter les tomates, l\'ail, les herbes de Provence. Mijoter 45 min.',
    meal_lunch: true,
    meal_dinner: true,
    season_spring: false,
    season_summer: true,
    season_autumn: true,
    season_winter: false,
    is_vegetarian: true,
    is_vegan: true,
    is_gluten_free: true
  },
  {
    title: 'Curry de lentilles corail',
    name: 'Curry de lentilles corail', 
    slug: 'curry-lentilles-corail',
    description: 'Curry végétarien aux lentilles corail, lait de coco et épices indiennes',
    short_description: 'Curry végétarien protéiné',
    prep_min: 20,
    cook_min: 35,
    rest_min: 0,
    servings: 4,
    myko_score: 88,
    is_active: true,
    instructions: 'Faire revenir l\'oignon et les épices. Ajouter les lentilles corail, le lait de coco et les tomates. Cuire 25 min jusqu\'à ce que les lentilles soient tendres.',
    meal_lunch: true,
    meal_dinner: true,
    season_spring: true,
    season_summer: true,
    season_autumn: true,
    season_winter: true,
    is_vegetarian: true,
    is_vegan: true,
    is_gluten_free: true
  },
  {
    title: 'Soupe de potimarron rôti',
    name: 'Soupe de potimarron rôti',
    slug: 'soupe-potimarron-roti',
    description: 'Velouté onctueux de potimarron rôti avec une pointe de gingembre',
    short_description: 'Velouté automnal de potimarron',
    prep_min: 20,
    cook_min: 45,
    rest_min: 0,
    servings: 6,
    myko_score: 90,
    is_active: true,
    instructions: 'Rôtir le potimarron coupé au four. Faire suer l\'oignon, ajouter le potimarron, le bouillon et le gingembre. Mixer jusqu\'à obtenir un velouté lisse.',
    meal_lunch: true,
    meal_dinner: true,
    season_spring: false,
    season_summer: false,
    season_autumn: true,
    season_winter: true,
    is_vegetarian: true,
    is_vegan: true,
    is_gluten_free: true
  }
];

async function insertTestRecipes() {
  console.log('Insertion des recettes de test...');
  
  try {
    // Vérifier d'abord si la table existe
    const { data: tables, error: tablesError } = await supabase
      .from('recipes')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.error('Erreur lors de la vérification de la table recipes:', tablesError);
      return;
    }
    
    console.log('Table recipes accessible');
    
    // Insérer les recettes
    const { data, error } = await supabase
      .from('recipes')
      .insert(testRecipes)
      .select();
    
    if (error) {
      console.error('Erreur lors de l\'insertion:', error);
    } else {
      console.log('Recettes insérées avec succès:', data);
    }
  } catch (err) {
    console.error('Erreur générale:', err);
  }
}

// Exécuter seulement si ce fichier est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  insertTestRecipes();
}

export { insertTestRecipes };