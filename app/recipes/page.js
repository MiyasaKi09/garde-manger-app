'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './recipes.css';

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('myko_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [inventoryStatus, setInventoryStatus] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (recipes.length > 0) {
      checkInventoryAvailability();
    }
  }, [recipes]);

  useEffect(() => {
    filterAndSortRecipes();
  }, [recipes, searchTerm, availabilityFilter, sortBy, sortOrder, inventoryStatus]);

  async function fetchRecipes() {
    try {
      setLoading(true);
      
      console.log('=== CHARGEMENT RECETTES ===');
      console.log('URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Clé définie:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      // Charger les recettes avec leurs ingrédients (nouveau système)
      // Note: on charge d'abord les recettes, puis les ingrédients séparément
      // pour éviter les problèmes de relations multiples
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('id', { ascending: false });

      console.log('Résultat requête Supabase:');
      console.log('- Données:', data);
      console.log('- Erreur:', error);
      console.log('- Nombre de recettes:', data?.length || 0);
      
      if (error) {
        console.error('ERREUR SUPABASE:', error);
        setError(`Erreur de connexion: ${error.message}`);
        setRecipes([]);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Structure de la première recette:');
        console.log('Colonnes disponibles:', Object.keys(data[0]));
        console.log('Première recette complète:', data[0]);
        
        // Charger les ingrédients pour toutes les recettes
        const recipeIds = data.map(r => r.id);
        
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .select(`
            recipe_id,
            id,
            quantity,
            unit,
            notes,
            canonical_food_id,
            archetype_id,
            canonical_foods (
              id,
              canonical_name,
              category_id,
              primary_unit
            ),
            archetypes (
              id,
              name,
              canonical_food_id,
              process,
              primary_unit
            )
          `)
          .in('recipe_id', recipeIds);
        
        if (ingredientsError) {
          console.error('Erreur chargement ingrédients:', ingredientsError);
        }
        
        // Regrouper les ingrédients par recipe_id
        const ingredientsByRecipe = {};
        if (ingredients) {
          ingredients.forEach(ing => {
            if (!ingredientsByRecipe[ing.recipe_id]) {
              ingredientsByRecipe[ing.recipe_id] = [];
            }
            ingredientsByRecipe[ing.recipe_id].push(ing);
          });
        }
        
        // Ajouter les ingrédients à chaque recette
        const recipesWithIngredients = data.map(recipe => ({
          ...recipe,
          recipe_ingredients: ingredientsByRecipe[recipe.id] || [],
          // Normaliser les noms de colonnes pour compatibilité
          title: recipe.name,
          prep_min: recipe.prep_time_minutes,
          cook_min: recipe.cook_time_minutes,
          portions: recipe.servings,
          // Calculer un score Myko basique (sera remplacé par le vrai calcul plus tard)
          myko_score: Math.min(100, 50 + (ingredientsByRecipe[recipe.id]?.length || 0) * 5)
        }));
        
        console.log('Recettes enrichies avec ingrédients:', recipesWithIngredients.length);
        setRecipes(recipesWithIngredients);
        return;
      }
      
      // Si pas de recettes, vérifier si la table existe
      console.log('Aucune recette trouvée, test de la table...');
      const { data: testData, error: testError } = await supabase
        .from('recipes')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('Table recipes introuvable:', testError);
        setError(`Table 'recipes' introuvable. Veuillez vérifier votre base de données.`);
      } else {
        console.log('Table recipes existe mais est vide');
        setRecipes([]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
      setError(`Erreur: ${error.message}`);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  async function checkInventoryAvailability() {
    try {
      if (recipes.length === 0) return;
      
      console.log('🔍 Vérification disponibilité pour', recipes.length, 'recettes');
      console.log('📋 Première recette:', recipes[0]);
      console.log('🥕 Ingrédients première recette:', recipes[0]?.recipe_ingredients?.length || 0);
      
      // Charger l'inventaire disponible
      const { data: inventory, error } = await supabase
        .from('inventory_lots')
        .select('canonical_food_id, archetype_id, quantity_remaining')
        .gt('quantity_remaining', 0)
        .gt('expiry_date', new Date().toISOString());
            
      if (error) {
        console.error('Erreur chargement inventaire:', error);
        return;
      }
      
      // Créer des Sets pour les IDs disponibles
      const availableCanonicalIds = new Set(
        inventory
          .filter(item => item.canonical_food_id)
          .map(item => item.canonical_food_id)
      );
      
      const availableArchetypeIds = new Set(
        inventory
          .filter(item => item.archetype_id)
          .map(item => item.archetype_id)
      );
      
      // Calculer la disponibilité pour chaque recette
      const statusMap = {};
      
      for (const recipe of recipes) {
        const ingredients = recipe.recipe_ingredients || [];
        const totalIngredients = ingredients.length;
        
        if (totalIngredients === 0) {
          statusMap[recipe.id] = {
            totalIngredients: 0,
            availableIngredients: 0,
            availabilityPercent: 0,
            urgentIngredients: 0
          };
          continue;
        }
        
        let availableIngredients = 0;
        
        ingredients.forEach(ingredient => {
          // Vérifier si l'ingrédient est disponible (canonical_food OU archetype)
          const isAvailableCanonical = ingredient.canonical_food_id && availableCanonicalIds.has(ingredient.canonical_food_id);
          const isAvailableArchetype = ingredient.archetype_id && availableArchetypeIds.has(ingredient.archetype_id);
          
          if (isAvailableCanonical || isAvailableArchetype) {
            availableIngredients++;
          }
        });
        
        const urgentIngredients = totalIngredients - availableIngredients;
        
        statusMap[recipe.id] = {
          totalIngredients,
          availableIngredients,
          availabilityPercent: Math.round((availableIngredients / totalIngredients) * 100),
          urgentIngredients
        };
        
        if (recipe.id === 142 || recipe.id === 2) {
          console.log(`📊 Recette #${recipe.id}:`, {
            total: totalIngredients,
            available: availableIngredients,
            percent: Math.round((availableIngredients / totalIngredients) * 100)
          });
        }
      }
      
      console.log('✅ Statuts calculés pour', Object.keys(statusMap).length, 'recettes');
      setInventoryStatus(statusMap);
    } catch (error) {
      console.error('Erreur vérification stocks:', error);
    }
  }

  function filterAndSortRecipes() {
    let filtered = [...recipes];

    // Filtrage par texte
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        (recipe.title || recipe.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrage par disponibilité
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(recipe => {
        const status = inventoryStatus[recipe.id] || { availabilityPercent: 0, urgentIngredients: 0 };
        if (availabilityFilter === 'available') return status.availabilityPercent > 80;
        if (availabilityFilter === 'partial') return status.availabilityPercent > 30 && status.availabilityPercent <= 80;
        if (availabilityFilter === 'urgent') return status.urgentIngredients > 0;
        return true;
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'myko_score':
          valueA = a.myko_score || 0;
          valueB = b.myko_score || 0;
          break;
        case 'availability':
          valueA = inventoryStatus[a.id]?.availabilityPercent || 0;
          valueB = inventoryStatus[b.id]?.availabilityPercent || 0;
          break;
        case 'time':
          // Calculer le temps total à partir de prep_min, cook_min, rest_min
          valueA = (a.prep_min || 0) + (a.cook_min || 0) + (a.rest_min || 0);
          valueB = (b.prep_min || 0) + (b.cook_min || 0) + (b.rest_min || 0);
          break;
        case 'name':
          const nameA = a.title || a.name || '';
          const nameB = b.title || b.name || '';
          return sortOrder === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        default:
          // Tri par ID par défaut (pas de created_at dans la table)
          valueA = a.id || 0;
          valueB = b.id || 0;
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFilteredRecipes(filtered);
  }

  // Statistiques calculées
  const totalRecipes = recipes.length;
  const availableRecipes = filteredRecipes.filter(recipe => {
    const status = inventoryStatus[recipe.id] || { availabilityPercent: 0 };
    return status.availabilityPercent > 80;
  }).length;
  const partialRecipes = filteredRecipes.filter(recipe => {
    const status = inventoryStatus[recipe.id] || { availabilityPercent: 0 };
    return status.availabilityPercent > 30 && status.availabilityPercent <= 80;
  }).length;
  const urgentRecipes = filteredRecipes.filter(recipe => {
    const status = inventoryStatus[recipe.id] || { urgentIngredients: 0 };
    return status.urgentIngredients > 0;
  }).length;

  if (loading) {
    return (
      <div className="recipes-container">
        <div className="loading-spinner">
          Chargement des recettes Myko...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipes-container">
        <div className="error-message" style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          borderRadius: '12px', 
          padding: '20px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ color: '#dc2626' }}>Erreur de connexion</h2>
          <p>{error}</p>
          <button 
            onClick={() => { setError(null); fetchRecipes(); }}
            style={{ 
              padding: '10px 20px', 
              background: '#dc2626', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recipes-container">
      <div className="recipes-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Rechercher une recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Toutes les recettes</option>
            <option value="available">Réalisables</option>
            <option value="partial">Partielles</option>
            <option value="urgent">Urgentes</option>
          </select>
          
          <Link href="/recipes/edit/new" className="add-recipe-btn">
            + Nouvelle recette
          </Link>
        </div>

        <div className="stats-controls">
          <div className="stats-inline">
            <div 
              className={`stat-item stat-filter-btn ${availabilityFilter === 'all' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter('all')}
            >
              <div className="stat-number">{totalRecipes}</div>
              <div className="stat-label">Total</div>
            </div>
            
            <div 
              className={`stat-item stat-filter-btn ${availabilityFilter === 'available' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter('available')}
            >
              <div className="stat-number">{availableRecipes}</div>
              <div className="stat-label">Réalisables</div>
            </div>
            
            <div 
              className={`stat-item stat-filter-btn ${availabilityFilter === 'partial' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter('partial')}
            >
              <div className="stat-number">{partialRecipes}</div>
              <div className="stat-label">Partielles</div>
            </div>
            
            <div 
              className={`stat-item stat-filter-btn urgent-recipes ${availabilityFilter === 'urgent' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter('urgent')}
            >
              <div className="stat-number">{urgentRecipes}</div>
              <div className="stat-label">Urgentes</div>
            </div>
          </div>

          <div className="sort-controls">
            <button
              className={`sort-btn ${sortBy === 'myko_score' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'myko_score') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('myko_score');
                  setSortOrder('desc');
                }
              }}
            >
              Score Myko {sortBy === 'myko_score' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            
            <button
              className={`sort-btn ${sortBy === 'availability' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'availability') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('availability');
                  setSortOrder('desc');
                }
              }}
            >
              Disponibilité {sortBy === 'availability' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            
            <button
              className={`sort-btn ${sortBy === 'time' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'time') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('time');
                  setSortOrder('asc');
                }
              }}
            >
              Temps {sortBy === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            
            <button
              className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('name');
                  setSortOrder('asc');
                }
              }}
            >
              Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          
          {filteredRecipes.length !== totalRecipes && (
            <div className="filter-count">
              {filteredRecipes.length} sur {totalRecipes} recettes
            </div>
          )}
        </div>
      </div>

      <div className="recipes-grid">
        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <h2>Aucune recette trouvée</h2>
            <p>Essayez de modifier vos filtres ou ajoutez de nouvelles recettes.</p>
            <Link href="/recipes/edit/new" className="add-recipe-btn">
              Créer une nouvelle recette
            </Link>
          </div>
        ) : (
          filteredRecipes.map(recipe => {
            const status = inventoryStatus[recipe.id] || { 
              totalIngredients: 0, 
              availableIngredients: 0, 
              availabilityPercent: 0, 
              urgentIngredients: 0 
            };
            const isUrgent = status.urgentIngredients > 0;

            return (
              <Link 
                href={`/recipes/${recipe.id}`}
                key={recipe.id}
                className={`recipe-card ${isUrgent ? 'urgent-recipe' : ''}`}
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <div className="recipe-header">
                  <h3 className="recipe-title">{recipe.title || recipe.name}</h3>
                  <div className="recipe-badges">
                    {isUrgent && <div className="urgent-badge">URGENT</div>}
                  </div>
                </div>
                
                {recipe.description && (
                  <p className="recipe-description">{recipe.description}</p>
                )}
                
                <div className="recipe-meta">
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>
                      {(recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0) > 0 
                        ? `${(recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0)} min` 
                        : 'Temps non défini'}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span>{recipe.servings || recipe.portions || 'Non défini'} parts</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📊</span>
                    <span>{recipe.difficulty_levels?.name || recipe.difficulty || 'Non défini'}</span>
                  </div>
                </div>
                
                <div className="recipe-availability">
                  <div className="availability-bar">
                    <div 
                      className="availability-fill" 
                      style={{ width: `${status.availabilityPercent}%` }}
                    />
                  </div>
                  <div className="availability-text">
                    {status.availabilityPercent}% disponible ({status.availableIngredients}/{status.totalIngredients})
                  </div>
                </div>
                
                <div className="recipe-actions">
                  <button 
                    className="action-btn primary"
                    onClick={(e) => {
                      // Le Link parent gère la navigation
                    }}
                  >
                    👁️ Voir
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert(`🌿 "${recipe.name}" ajoutée au planning !`);
                    }}
                  >
                    📅 Planifier
                  </button>
                  <button 
                    className="action-btn tertiary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert(`🛒 Ingrédients manquants ajoutés aux courses !`);
                    }}
                  >
                    🛒 Courses
                  </button>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}