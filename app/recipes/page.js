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
      
      // Utilisation de la vraie base de données Myko
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_categories(name, icon),
          cuisine_types(name, flag),
          difficulty_levels(name, level),
          recipe_ingredients(
            id,
            quantity,
            unit,
            notes,
            canonical_foods(id, name, category)
          )
        `)
        .eq('is_active', true)
        .order('myko_score', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('Recettes chargées:', data);
      setRecipes(data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
      
      // En cas d'erreur, essayer une requête plus simple
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from('recipes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        if (simpleError) throw simpleError;
        setRecipes(simpleData || []);
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        setRecipes([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function checkInventoryAvailability() {
    try {
      if (recipes.length === 0) return;
      
      // Calculer la disponibilité réelle des ingrédients pour chaque recette
      const statusMap = {};
      
      for (const recipe of recipes) {
        if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
          const totalIngredients = recipe.recipe_ingredients.length;
          
          // Vérifier la disponibilité de chaque ingrédient dans l'inventaire
          const { data: inventory, error } = await supabase
            .from('inventory_lots')
            .select('canonical_food_id, quantity_remaining')
            .gt('quantity_remaining', 0)
            .gt('expiry_date', new Date().toISOString());
            
          let availableIngredients = 0;
          let urgentIngredients = 0;
          
          if (!error && inventory) {
            const availableFoods = new Set(inventory.map(item => item.canonical_food_id));
            
            recipe.recipe_ingredients.forEach(ingredient => {
              if (ingredient.canonical_foods && availableFoods.has(ingredient.canonical_foods.id)) {
                availableIngredients++;
              } else {
                urgentIngredients++;
              }
            });
          }
          
          statusMap[recipe.id] = {
            totalIngredients,
            availableIngredients,
            availabilityPercent: Math.round((availableIngredients / totalIngredients) * 100),
            urgentIngredients
          };
        } else {
          // Si pas d'ingrédients dans la recette, on met des valeurs par défaut
          statusMap[recipe.id] = {
            totalIngredients: 0,
            availableIngredients: 0,
            availabilityPercent: 0,
            urgentIngredients: 0
          };
        }
      }
      
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
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          // Calculer le temps total en priorisant total_time_minutes, sinon prep + cook
          valueA = a.total_time_minutes || 
                   ((a.prep_time_minutes || 0) + (a.cook_time_minutes || 0)) || 
                   a.prep_time_minutes || 
                   a.cook_time_minutes || 0;
          valueB = b.total_time_minutes || 
                   ((b.prep_time_minutes || 0) + (b.cook_time_minutes || 0)) || 
                   b.prep_time_minutes || 
                   b.cook_time_minutes || 0;
          break;
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default:
          valueA = a.created_at || '';
          valueB = b.created_at || '';
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
          
          <Link href="/recipes/new" className="add-recipe-btn">
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
            <Link href="/recipes/new" className="add-recipe-btn">
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
            const isRecommended = recipe.myko_score >= 80;

            return (
              <div 
                key={recipe.id} 
                className={`recipe-card ${isUrgent ? 'urgent-recipe' : ''} ${isRecommended ? 'myko-recommended' : ''}`}
              >
                <div className="recipe-header">
                  <h3 className="recipe-title">{recipe.name}</h3>
                  <div className="recipe-badges">
                    <div className={`myko-score ${
                      recipe.myko_score >= 80 ? 'high-score' :
                      recipe.myko_score >= 60 ? 'medium-score' : 'low-score'
                    }`}>
                      {recipe.myko_score || 0}★
                    </div>
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
                      {recipe.total_time_minutes && recipe.total_time_minutes > 0 
                        ? `${recipe.total_time_minutes} min` 
                        : recipe.prep_time_minutes && recipe.cook_time_minutes 
                        ? `${(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min`
                        : recipe.prep_time_minutes 
                        ? `${recipe.prep_time_minutes} min (prep)`
                        : recipe.cook_time_minutes
                        ? `${recipe.cook_time_minutes} min (cuisson)`
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
                  <Link 
                    href={`/recipes/${recipe.id}`} 
                    className="action-btn primary"
                  >
                    👁️ Voir
                  </Link>
                  <button 
                    className="action-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`🌿 "${recipe.name}" ajoutée au planning !`);
                    }}
                  >
                    📅 Planifier
                  </button>
                  <button 
                    className="action-btn tertiary"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`🛒 Ingrédients manquants ajoutés aux courses !`);
                    }}
                  >
                    🛒 Courses
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}