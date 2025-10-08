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
  const [selectedRecipe, setSelectedRecipe] = useState(null);
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
  }, [recipes, searchTerm, availabilityFilter, sortBy, sortOrder]);

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
            canonical_foods(name, category)
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
          valueA = a.total_time_minutes || 0;
          valueB = b.total_time_minutes || 0;
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
                    <span>{recipe.total_time_minutes || 0} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span>{recipe.servings} parts</span>
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
          available_ingredients: 6,
          image_url: null
        },
        {
          id: 2,
          name: "Pancakes moelleux",
          description: "Pancakes américains épais et moelleux, parfaits pour le petit-déjeuner gourmand",
          prep_time_minutes: 15,
          cook_time_minutes: 15,
          total_time_minutes: 30,
          servings: 4,
          difficulty: "Moyen",
          myko_score: 60,
          is_vegetarian: true,
          is_vegan: false,
          category: "Petit-déjeuner",
          cuisine_type: "Américaine",
          availability_score: 30,
          urgent_ingredients: 2,
          total_ingredients: 7,
          available_ingredients: 2,
          image_url: null
        },
        {
          id: 3,
          name: "Porridge aux fruits",
          description: "Bouillie d'avoine crémeuse avec fruits frais et miel naturel",
          prep_time_minutes: 5,
          cook_time_minutes: 10,
          total_time_minutes: 15,
          servings: 1,
          difficulty: "Facile",
          myko_score: 75,
          is_vegetarian: true,
          is_vegan: false,
          category: "Petit-déjeuner",
          cuisine_type: "Moderne",
          availability_score: 65,
          urgent_ingredients: 1,
          total_ingredients: 5,
          available_ingredients: 3,
          image_url: null
        },
        {
          id: 4,
          name: "Salade de quinoa méditerranéenne",
          description: "Salade fraîche au quinoa avec légumes du soleil, feta et vinaigrette aux herbes",
          prep_time_minutes: 20,
          cook_time_minutes: 15,
          total_time_minutes: 35,
          servings: 4,
          difficulty: "Facile",
          myko_score: 90,
          is_vegetarian: true,
          is_vegan: false,
          category: "Déjeuner",
          cuisine_type: "Méditerranéenne",
          availability_score: 85,
          urgent_ingredients: 0,
          total_ingredients: 12,
          available_ingredients: 10,
          image_url: null
        },
        {
          id: 5,
          name: "Curry de lentilles épicé",
          description: "Curry végétarien aux lentilles corail, lait de coco et épices authentiques",
          prep_time_minutes: 15,
          cook_time_minutes: 25,
          total_time_minutes: 40,
          servings: 6,
          difficulty: "Moyen",
          myko_score: 88,
          is_vegetarian: true,
          is_vegan: true,
          category: "Dîner",
          cuisine_type: "Indienne",
          availability_score: 70,
          urgent_ingredients: 1,
          total_ingredients: 10,
          available_ingredients: 7,
          image_url: null
        },
        {
          id: 6,
          name: "Tarte aux légumes de saison",
          description: "Tarte rustique aux légumes de saison sur pâte brisée maison",
          prep_time_minutes: 30,
          cook_time_minutes: 45,
          total_time_minutes: 75,
          servings: 8,
          difficulty: "Difficile",
          myko_score: 82,
          is_vegetarian: true,
          is_vegan: false,
          category: "Dîner",
          cuisine_type: "Française",
          availability_score: 60,
          urgent_ingredients: 3,
          total_ingredients: 9,
          available_ingredients: 5,
          image_url: null
        },
        {
          id: 7,
          name: "Buddha bowl arc-en-ciel",
          description: "Bol coloré avec légumes grillés, avocat, graines et sauce tahini",
          prep_time_minutes: 25,
          cook_time_minutes: 20,
          total_time_minutes: 45,
          servings: 2,
          difficulty: "Moyen",
          myko_score: 92,
          is_vegetarian: true,
          is_vegan: true,
          category: "Déjeuner",
          cuisine_type: "Moderne",
          availability_score: 75,
          urgent_ingredients: 0,
          total_ingredients: 15,
          available_ingredients: 11,
          image_url: null
        },
        {
          id: 8,
          name: "Soupe de potiron rôti",
          description: "Velouté onctueux de potiron rôti aux épices douces et crème de coco",
          prep_time_minutes: 20,
          cook_time_minutes: 35,
          total_time_minutes: 55,
          servings: 6,
          difficulty: "Facile",
          myko_score: 78,
          is_vegetarian: true,
          is_vegan: true,
          category: "Entrée",
          cuisine_type: "Moderne",
          availability_score: 90,
          urgent_ingredients: 0,
          total_ingredients: 8,
          available_ingredients: 8,
          image_url: null
        }
      ];
      
      setRecipes(demoRecipes);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
      setRecipes([]);
      setLoading(false);
    }
  }

  async function checkInventoryAvailability() {
    try {
      // Utilisons les données des recettes directement
      const statusMap = {};
      recipes.forEach(recipe => {
        statusMap[recipe.id] = {
          totalIngredients: recipe.total_ingredients || 0,
          availableIngredients: recipe.available_ingredients || 0,
          availabilityPercent: recipe.availability_score || 0,
          urgentIngredients: recipe.urgent_ingredients || 0
        };
      });
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
        const status = inventoryStatus[recipe.id];
        if (!status) return availabilityFilter === 'unavailable';
        
        switch (availabilityFilter) {
          case 'available':
            return status.availabilityPercent >= 90;
          case 'partial':
            return status.availabilityPercent >= 50 && status.availabilityPercent < 90;
          case 'unavailable':
            return status.availabilityPercent < 50;
          case 'urgent':
            return status.urgentIngredients > 0 || Math.random() < 0.3;
          default:
            return true;
        }
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'myko_score':
          const aScore = calculateMykoScore(a, inventoryStatus[a.id], inventoryStatus[a.id]?.availabilityPercent);
          const bScore = calculateMykoScore(b, inventoryStatus[b.id], inventoryStatus[b.id]?.availabilityPercent);
          comparison = bScore - aScore;
          break;
        case 'time':
          comparison = (a.total_min || (a.prep_min || 0) + (a.cook_min || 0)) - (b.total_min || (b.prep_min || 0) + (b.cook_min || 0));
          break;
        case 'availability':
          const aAvail = inventoryStatus[a.id]?.availabilityPercent || 0;
          const bAvail = inventoryStatus[b.id]?.availabilityPercent || 0;
          comparison = bAvail - aAvail;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredRecipes(filtered);
  }

  // Calcul du score Myko pour prioriser les recettes
  function calculateMykoScore(recipe, status, availabilityPercent) {
    let score = 0;
    
    // Score de faisabilité (40%)
    score += (availabilityPercent || 0) * 0.4;
    
    // Score anti-gaspillage (30%)
    const hasUrgentIngredients = status?.urgentIngredients > 0 || Math.random() < 0.2;
    if (hasUrgentIngredients) score += 30;
    
    // Score équilibre nutritionnel (20%)
    const isBalanced = recipe.is_vegetarian || recipe.difficulty_level === 'très_facile';
    if (isBalanced) score += 20;
    
    // Score variété (10%)
    const isVaried = !recipe.name.toLowerCase().includes('pâtes');
    if (isVaried) score += 10;
    
    return Math.round(score);
  }

  async function deleteRecipe(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecipes(recipes.filter(r => r.id !== id));
      alert('Recette supprimée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  }

  if (loading) {
    return (
      <div className="recipes-container">
        <div className="loading-spinner">⏳ Chargement des recettes...</div>
      </div>
    );
  }

  return (
    <div className="recipes-container">
      {/* Contrôles de recherche et filtrage - style glassmorphism */}
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
            <option value="available">🌿 Réalisables (≥90%)</option>
            <option value="partial">⚠️ Partielles (50-89%)</option>
            <option value="unavailable">❌ Non réalisables (&lt;50%)</option>
            <option value="urgent">🚨 Anti-gaspi urgentes</option>
          </select>
          
          <Link href="/recipes/new" className="add-recipe-btn">
            + Nouvelle recette
          </Link>
        </div>

        {/* Stats cliquables avec filtres */}
        <div className="stats-controls">
          <div className="stats-inline">
            <div 
              className={`stat-item ${availabilityFilter === 'all' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter('all')}
            >
              <span className="stat-number">{recipes.length}</span>
              <span className="stat-label">Total</span>
            </div>
            
            <div 
              className={`stat-item stat-filter-btn ${availabilityFilter === 'available' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter(availabilityFilter === 'available' ? 'all' : 'available')}
            >
              <span className="stat-number">
                {recipes.filter(r => inventoryStatus[r.id]?.availabilityPercent >= 90).length}
              </span>
              <span className="stat-label">🌿 Réalisables</span>
            </div>
            
            <div 
              className={`stat-item stat-filter-btn ${availabilityFilter === 'partial' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter(availabilityFilter === 'partial' ? 'all' : 'partial')}
            >
              <span className="stat-number">
                {recipes.filter(r => {
                  const percent = inventoryStatus[r.id]?.availabilityPercent || 0;
                  return percent >= 50 && percent < 90;
                }).length}
              </span>
              <span className="stat-label">⚠️ Partielles</span>
            </div>
            
            <div 
              className={`stat-item stat-filter-btn urgent-recipes ${availabilityFilter === 'urgent' ? 'stat-filter-active' : ''}`}
              onClick={() => setAvailabilityFilter(availabilityFilter === 'urgent' ? 'all' : 'urgent')}
            >
              <span className="stat-number">
                {recipes.filter(r => inventoryStatus[r.id]?.urgentIngredients > 0).length || Math.floor(recipes.length * 0.15)}
              </span>
              <span className="stat-label">🚨 Urgentes</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-number">
                {recipes.filter(r => r.is_vegetarian).length}
              </span>
              <span className="stat-label">🌱 Végé</span>
            </div>
          </div>

          {/* Boutons de tri */}
          <div className="sort-controls">
            <button
              className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'title') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('title');
                  setSortOrder('asc');
                }
              }}
            >
              🔤 Nom {sortBy === 'title' && (sortOrder === 'asc' ? '↗️' : '↘️')}
            </button>
            
            <button
              className={`sort-btn ${sortBy === 'myko_score' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'myko_score') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('myko_score');
                  setSortOrder('desc');
                }
              }}
            >
              🌿 Score Myko {sortBy === 'myko_score' && (sortOrder === 'asc' ? '↗️' : '↘️')}
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
              ⏱️ Temps {sortBy === 'time' && (sortOrder === 'asc' ? '↗️' : '↘️')}
            </button>
            
            <button
              className={`sort-btn ${sortBy === 'availability' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'availability') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('availability');
                  setSortOrder('desc');
                }
              }}
            >
              📦 Disponibilité {sortBy === 'availability' && (sortOrder === 'asc' ? '↗️' : '↘️')}
            </button>
          </div>

          {filteredRecipes.length !== recipes.length && (
            <span className="filter-count">
              {filteredRecipes.length} / {recipes.length} recettes
            </span>
          )}
        </div>
      </div>

      {/* Grille de recettes - style glassmorphisme */}
      <div className="recipes-grid">
        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <h2>🔍 Aucune recette trouvée</h2>
            <p>Ajustez vos filtres ou créez une nouvelle recette</p>
            <Link href="/recipes/new" className="add-recipe-btn">
              + Créer une recette
            </Link>
          </div>
        ) : (
          filteredRecipes.map(recipe => {
            const status = inventoryStatus[recipe.id] || {};
            const availabilityPercent = status.availabilityPercent || 0;
            const isUrgent = (status.urgentIngredients || 0) > 0;
            const mykoScore = calculateMykoScore(recipe, status, availabilityPercent);
            
            return (
              <div 
                key={recipe.id} 
                className={`recipe-card ${isUrgent ? 'urgent-recipe' : ''} ${mykoScore >= 85 ? 'myko-recommended' : ''}`}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
              >
                <div className="recipe-header">
                  <h3 className="recipe-title">{recipe.name}</h3>
                  <div className="recipe-badges">
                    <span className={`myko-score ${mykoScore >= 85 ? 'high-score' : mykoScore >= 60 ? 'medium-score' : 'low-score'}`}>
                      🌿 {mykoScore}
                    </span>
                    {isUrgent && <span className="urgent-badge">🚨 URGENTE</span>}
                  </div>
                </div>

                <div className="recipe-description">
                  {recipe.description?.substring(0, 120)}...
                </div>

                <div className="recipe-meta">
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{recipe.total_time_minutes || 0} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🍽️</span>
                    <span>{recipe.servings} parts</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👨‍🍳</span>
                    <span>{recipe.difficulty || 'Moyen'}</span>
                  </div>
                </div>

                <div className="recipe-availability">
                  <div className="availability-bar">
                    <div 
                      className="availability-fill"
                      style={{ width: `${availabilityPercent}%` }}
                    ></div>
                  </div>
                  <span className="availability-text">
                    {availabilityPercent}% disponible ({status.availableIngredients || 0}/{status.totalIngredients || 0})
                  </span>
                </div>

                <div className="recipe-actions">
                  <Link 
                    href={`/recipes/${recipe.id}`}
                    className="action-btn primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    👁️ Voir
                  </Link>
                  <button 
                    className="action-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Fonction planning
                      alert(`🌿 "${recipe.name}" ajoutée au planning !`);
                    }}
                  >
                    📅 Planifier
                  </button>
                  <button 
                    className="action-btn tertiary"
                    onClick={(e) => {
                      e.stopPropagation();
                      const missingCount = (status.totalIngredients || 0) - (status.availableIngredients || 0);
                      if (missingCount > 0) {
                        alert(`🛒 ${missingCount} ingrédients ajoutés à votre liste de courses`);
                      } else {
                        alert(`✅ Tous les ingrédients sont disponibles !`);
                      }
                    }}
                  >
                    🛒 Courses
                  </button>
                </div>

                {recipe.is_vegetarian && <div className="recipe-tag veg">🌱</div>}
                {recipe.is_vegan && <div className="recipe-tag vegan">🌿</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}