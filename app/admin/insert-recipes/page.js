'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminInsertRecipes() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function insertTestRecipes() {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Début insertion des recettes de test...');
      
      // 1. Insérer les catégories
      const { error: categoryError } = await supabase
        .from('recipe_categories')
        .upsert([
          { name: 'Entrées', slug: 'entrees', icon: '🥗' },
          { name: 'Plats principaux', slug: 'plats-principaux', icon: '🍽️' },
          { name: 'Soupes', slug: 'soupes', icon: '🍲' }
        ], { onConflict: 'slug' });
      
      if (categoryError) {
        console.error('Erreur catégories:', categoryError);
        throw categoryError;
      }

      // 2. Insérer les types de cuisine
      const { error: cuisineError } = await supabase
        .from('cuisine_types')
        .upsert([
          { name: 'Française', slug: 'francaise', flag: '🇫🇷' },
          { name: 'Italienne', slug: 'italienne', flag: '🇮🇹' },
          { name: 'Indienne', slug: 'indienne', flag: '🇮🇳' },
          { name: 'Asiatique', slug: 'asiatique', flag: '🥢' }
        ], { onConflict: 'slug' });
      
      if (cuisineError) {
        console.error('Erreur cuisines:', cuisineError);
        throw cuisineError;
      }

      // 3. Insérer les niveaux de difficulté
      const { error: difficultyError } = await supabase
        .from('difficulty_levels')
        .upsert([
          { level: 'très_facile', name: 'Très facile', description: 'Accessible à tous, moins de 30min', sort_order: 1 },
          { level: 'facile', name: 'Facile', description: 'Techniques de base, 30-60min', sort_order: 2 },
          { level: 'moyen', name: 'Moyen', description: 'Quelques techniques, 1-2h', sort_order: 3 },
          { level: 'difficile', name: 'Difficile', description: 'Techniques avancées, plus de 2h', sort_order: 4 }
        ], { onConflict: 'level' });
      
      if (difficultyError) {
        console.error('Erreur difficultés:', difficultyError);
        throw difficultyError;
      }

      // 4. Récupérer les IDs des tables de référence
      const { data: categories } = await supabase.from('recipe_categories').select('id, slug');
      const { data: cuisines } = await supabase.from('cuisine_types').select('id, slug');
      const { data: difficulties } = await supabase.from('difficulty_levels').select('id, level');
      
      const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
      const cuisineMap = Object.fromEntries(cuisines.map(c => [c.slug, c.id]));
      const diffMap = Object.fromEntries(difficulties.map(d => [d.level, d.id]));

      // 5. Insérer les recettes de test
      const testRecipes = [
        {
          title: 'Ratatouille Provençale',
          slug: 'ratatouille-provencale',
          description: 'Mijoté de légumes du soleil : aubergines, courgettes, tomates, poivrons. Un classique de la cuisine française parfait pour l\'été.',
          short_description: 'Délicieux plat de légumes méditerranéens',
          instructions: 'Couper tous les légumes en dés réguliers. Dans une large poêle, faire revenir séparément les aubergines, puis les courgettes, puis les poivrons dans l\'huile d\'olive. Réserver chaque légume. Dans la même poêle, faire revenir l\'oignon émincé, ajouter l\'ail haché. Remettre tous les légumes, ajouter les tomates concassées, les herbes de Provence, le thym, le laurier. Saler, poivrer. Mijoter à feu doux 45 minutes en remuant de temps en temps.',
          category_id: catMap['plats-principaux'],
          cuisine_type_id: cuisineMap['francaise'],
          difficulty_level_id: diffMap['facile'],
          servings: 6,
          prep_min: 30,
          cook_min: 45,
          rest_min: 0,
          calories: 180,
          proteins: 6.2,
          carbs: 22.5,
          fats: 9.1,
          fiber: 8.3,
          estimated_cost: 3.50,
          budget_category: 'économique',
          skill_level: 'débutant',
          season_spring: false,
          season_summer: true,
          season_autumn: true,
          season_winter: false,
          meal_breakfast: false,
          meal_lunch: true,
          meal_dinner: true,
          meal_snack: false,
          is_vegetarian: true,
          is_vegan: true,
          is_gluten_free: true,
          chef_tips: 'Cuire les légumes séparément d\'abord pour une meilleure texture. La ratatouille est encore meilleure réchauffée le lendemain.',
          author_name: 'Chef Myko'
        },
        {
          title: 'Curry de lentilles corail',
          slug: 'curry-lentilles-corail',
          description: 'Curry végétarien aux lentilles corail, lait de coco et épices indiennes. Riche en protéines et en saveurs.',
          short_description: 'Curry végétarien épicé et nutritif',
          instructions: 'Rincer les lentilles corail à l\'eau froide. Dans une casserole, faire chauffer l\'huile et faire revenir l\'oignon émincé jusqu\'à ce qu\'il soit translucide. Ajouter l\'ail, le gingembre râpé et les épices (curcuma, cumin, coriandre, garam masala). Faire revenir 1 minute. Ajouter les lentilles, les tomates concassées et le lait de coco. Porter à ébullition puis réduire le feu et laisser mijoter 25-30 minutes jusqu\'à ce que les lentilles soient tendres. Saler, poivrer et ajouter le jus de citron. Garnir de coriandre fraîche.',
          category_id: catMap['plats-principaux'],
          cuisine_type_id: cuisineMap['indienne'],
          difficulty_level_id: diffMap['moyen'],
          servings: 4,
          prep_min: 20,
          cook_min: 35,
          rest_min: 0,
          calories: 320,
          proteins: 18.4,
          carbs: 42.1,
          fats: 12.3,
          fiber: 16.2,
          estimated_cost: 2.80,
          budget_category: 'économique',
          skill_level: 'intermédiaire',
          season_spring: true,
          season_summer: true,
          season_autumn: true,
          season_winter: true,
          meal_breakfast: false,
          meal_lunch: true,
          meal_dinner: true,
          meal_snack: false,
          is_vegetarian: true,
          is_vegan: true,
          is_gluten_free: true,
          chef_tips: 'Rincer les lentilles corail avant cuisson pour éviter l\'écume. Ajuster la consistance avec un peu d\'eau si nécessaire.',
          author_name: 'Chef Myko'
        },
        {
          title: 'Soupe de potimarron rôti',
          slug: 'soupe-potimarron-roti',
          description: 'Velouté onctueux de potimarron rôti avec une pointe de gingembre. Parfait pour les soirées d\'automne.',
          short_description: 'Velouté automnal réconfortant',
          instructions: 'Préchauffer le four à 200°C. Couper le potimarron en quartiers, retirer les graines. Badigeonner d\'huile d\'olive et rôtir 30 minutes. Pendant ce temps, faire suer l\'oignon dans une casserole avec un peu d\'huile. Ajouter le gingembre râpé. Quand le potimarron est tendre, retirer la chair et l\'ajouter à la casserole. Verser le bouillon, porter à ébullition et laisser mijoter 15 minutes. Mixer jusqu\'à obtenir un velouté lisse. Ajouter la crème, saler et poivrer. Servir avec des graines de courge grillées.',
          category_id: catMap['soupes'],
          cuisine_type_id: cuisineMap['francaise'],
          difficulty_level_id: diffMap['facile'],
          servings: 6,
          prep_min: 20,
          cook_min: 45,
          rest_min: 0,
          calories: 145,
          proteins: 4.1,
          carbs: 18.2,
          fats: 7.3,
          fiber: 5.1,
          estimated_cost: 2.20,
          budget_category: 'économique',
          skill_level: 'débutant',
          season_spring: false,
          season_summer: false,
          season_autumn: true,
          season_winter: true,
          meal_breakfast: false,
          meal_lunch: true,
          meal_dinner: true,
          meal_snack: false,
          is_vegetarian: true,
          is_vegan: true,
          is_gluten_free: true,
          chef_tips: 'Rôtir le potimarron au four développe ses saveurs. Garder quelques graines pour les faire griller en accompagnement.',
          author_name: 'Chef Myko'
        }
      ];

      const { data: insertedRecipes, error: recipesError } = await supabase
        .from('recipes')
        .upsert(testRecipes, { onConflict: 'slug' })
        .select();
      
      if (recipesError) {
        console.error('Erreur recettes:', recipesError);
        throw recipesError;
      }

      console.log('Recettes insérées:', insertedRecipes);
      setMessage(`✅ ${insertedRecipes.length} recettes insérées avec succès !`);
      
    } catch (error) {
      console.error('Erreur lors de l\'insertion:', error);
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>Administration - Recettes de Test</h1>
      <p>Cette page permet d'insérer des recettes de test dans votre base de données Supabase.</p>
      
      <button 
        onClick={insertTestRecipes}
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: loading ? '#ccc' : '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        {loading ? 'Insertion en cours...' : 'Insérer 3 recettes de test'}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          borderRadius: '8px',
          background: message.includes('✅') ? '#dcfce7' : '#fee2e2',
          color: message.includes('✅') ? '#16a34a' : '#dc2626',
          border: '1px solid ' + (message.includes('✅') ? '#bbf7d0' : '#fecaca')
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h3>Après insertion :</h3>
        <ol>
          <li>Allez sur <a href="/recipes" style={{ color: '#2563eb' }}>la page des recettes</a></li>
          <li>Vous devriez voir les 3 recettes avec leurs vrais temps de cuisson</li>
          <li>Testez en cliquant sur "Voir" pour voir les détails</li>
        </ol>
      </div>
    </div>
  );
}