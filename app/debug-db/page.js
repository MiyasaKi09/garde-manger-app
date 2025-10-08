'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugDatabase() {
  const [tables, setTables] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipesError, setRecipesError] = useState(null);
  const [recipeColumns, setRecipeColumns] = useState([]);

  useEffect(() => {
    checkDatabase();
  }, []);

  async function checkDatabase() {
    try {
      // Tester la connexion en listant les tables disponibles
      console.log('Test de connexion à Supabase...');
      
      // Essayer de récupérer des recettes avec différentes requêtes
      const tests = [
        { name: 'Toutes colonnes', query: supabase.from('recipes').select('*').limit(5) },
        { name: 'Colonnes basiques', query: supabase.from('recipes').select('id, title, name').limit(5) },
        { name: 'Sans limite', query: supabase.from('recipes').select('id, title').limit(1) }
      ];

      for (const test of tests) {
        console.log(`Test: ${test.name}`);
        const { data, error } = await test.query;
        
        if (error) {
          console.error(`Erreur ${test.name}:`, error);
          setRecipesError(error.message);
        } else {
          console.log(`Succès ${test.name}:`, data);
          if (data && data.length > 0) {
            setRecipes(data);
            setRecipeColumns(Object.keys(data[0]));
            break;
          }
        }
      }

      // Essayer d'autres tables
      const { data: categoriesData } = await supabase.from('recipe_categories').select('*').limit(3);
      const { data: cuisineData } = await supabase.from('cuisine_types').select('*').limit(3);
      const { data: inventoryData } = await supabase.from('inventory_lots').select('*').limit(3);
      const { data: canonicalData } = await supabase.from('canonical_foods').select('*').limit(3);

      setTables([
        { name: 'recipes', count: recipes.length, sample: recipes[0] },
        { name: 'recipe_categories', count: categoriesData?.length || 0, sample: categoriesData?.[0] },
        { name: 'cuisine_types', count: cuisineData?.length || 0, sample: cuisineData?.[0] },
        { name: 'inventory_lots', count: inventoryData?.length || 0, sample: inventoryData?.[0] },
        { name: 'canonical_foods', count: canonicalData?.length || 0, sample: canonicalData?.[0] }
      ]);

    } catch (err) {
      console.error('Erreur lors du test de la base:', err);
      setRecipesError(err.message);
    }
  }

  async function insertSampleRecipe() {
    try {
      const sampleRecipe = {
        title: 'Recette de Test',
        name: 'Recette de Test',
        slug: 'recette-test',
        description: 'Une recette de test pour vérifier l\'insertion',
        prep_min: 15,
        cook_min: 30,
        rest_min: 0,
        servings: 4,
        myko_score: 75,
        instructions: 'Instructions de test',
        is_active: true
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert(sampleRecipe)
        .select();

      if (error) {
        console.error('Erreur insertion:', error);
        alert(`Erreur: ${error.message}`);
      } else {
        console.log('Recette insérée:', data);
        alert('Recette insérée avec succès!');
        checkDatabase(); // Recharger
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert(`Erreur: ${err.message}`);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Débogage Base de Données</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Connexion Supabase</h2>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Non définie'}</p>
        <p>Clé: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Définie' : 'Non définie'}</p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Tables disponibles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {tables.map((table, idx) => (
            <div key={idx} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
              <h3>{table.name}</h3>
              <p>Nombre d'enregistrements: {table.count}</p>
              {table.sample && (
                <details>
                  <summary>Échantillon</summary>
                  <pre style={{ fontSize: '11px', overflow: 'auto' }}>
                    {JSON.stringify(table.sample, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Recettes trouvées</h2>
        {recipesError && <p style={{ color: 'red' }}>Erreur: {recipesError}</p>}
        <p>Nombre: {recipes.length}</p>
        
        {recipeColumns.length > 0 && (
          <details>
            <summary>Colonnes disponibles dans recipes</summary>
            <ul>
              {recipeColumns.map((col, idx) => (
                <li key={idx}>{col}</li>
              ))}
            </ul>
          </details>
        )}

        {recipes.length > 0 && (
          <details>
            <summary>Première recette</summary>
            <pre style={{ fontSize: '11px', overflow: 'auto' }}>
              {JSON.stringify(recipes[0], null, 2)}
            </pre>
          </details>
        )}
      </section>

      <section>
        <h2>Actions</h2>
        <button 
          onClick={checkDatabase}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Recharger
        </button>
        <button 
          onClick={insertSampleRecipe}
          style={{ padding: '10px' }}
        >
          Insérer recette de test
        </button>
      </section>
    </div>
  );
}