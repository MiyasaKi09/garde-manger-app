'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CookWizard from '@/components/CookWizard';
import RecipeListCard from './components/RecipeListCard';
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
  const [selectedRecipeToCook, setSelectedRecipeToCook] = useState(null);

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
      
      // Charger les recettes avec leurs ingrédients (nouveau système)
      // Note: on charge d'abord les recettes, puis les ingrédients séparément
      // pour éviter les problèmes de relations multiples
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('id', { ascending: true }); // Tri croissant pour avoir les recettes avec ingrédients en premier

      if (error) {
        console.error('ERREUR SUPABASE:', error);
        setError(`Erreur de connexion: ${error.message}`);
        setRecipes([]);
        return;
      }
      
      if (data && data.length > 0) {
        // Charger les ingrédients pour toutes les recettes
        const recipeIds = data.map(r => r.id);

        // IMPORTANT: Charger TOUS les ingrédients (pas seulement les 1000 premiers)
        // Supabase limite par défaut à 1000 résultats, donc on utilise une boucle de pagination
        let allIngredients = [];
        const BATCH_SIZE = 1000;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const { data: ingredientsBatch, error: ingredientsError } = await supabase
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
            .in('recipe_id', recipeIds)
            .range(offset, offset + BATCH_SIZE - 1);

          if (ingredientsError) {
            console.error('❌ Erreur chargement batch ingrédients:', ingredientsError);
            break;
          }

          if (ingredientsBatch && ingredientsBatch.length > 0) {
            allIngredients = allIngredients.concat(ingredientsBatch);
            offset += BATCH_SIZE;
            hasMore = ingredientsBatch.length === BATCH_SIZE;
          } else {
            hasMore = false;
          }
        }

        const ingredients = allIngredients;

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

        setRecipes(recipesWithIngredients);
        return;
      }
      
      // Si pas de recettes, vérifier si la table existe
      const { data: testData, error: testError } = await supabase
        .from('recipes')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('Table recipes introuvable:', testError);
        setError(`Table 'recipes' introuvable. Veuillez vérifier votre base de données.`);
      } else {
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

      // Charger l'inventaire disponible (lots non expirés, quantité > 0)
      // Note : On ne charge pas les archetypes ici à cause d'une ambiguïté de relation dans la DB
      // On fera la correspondance différemment
      const { data: inventory, error } = await supabase
        .from('inventory_lots')
        .select('canonical_food_id, archetype_id, qty_remaining, unit, expiration_date')
        .gt('qty_remaining', 0)
        .gt('expiration_date', new Date().toISOString());

      if (error) {
        console.error('Erreur chargement inventaire:', error);
        return;
      }

      // Charger les archetypes pour créer un mapping archetype_id -> canonical_food_id
      const archetypeIds = inventory?.filter(lot => lot.archetype_id).map(lot => lot.archetype_id) || [];
      let archetypeMapping = {};

      if (archetypeIds.length > 0) {
        const { data: archetypes, error: archetypesError } = await supabase
          .from('archetypes')
          .select('id, canonical_food_id')
          .in('id', archetypeIds);

        if (!archetypesError && archetypes) {
          archetypes.forEach(arch => {
            archetypeMapping[arch.id] = arch.canonical_food_id;
          });
        }
      }

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
        let ingredientsExpiringSoon = 0; // Ingrédients qui expirent dans les 7 prochains jours
        const URGENT_DAYS_THRESHOLD = 7;

        ingredients.forEach(ingredient => {
          // Additionner la quantité totale disponible pour cet ingrédient
          let totalAvailable = 0;
          let earliestExpirationDate = null;

          // AMÉLIORATION : On cherche par correspondance intelligente :
          // 1. Correspondance directe par canonical_food_id ou archetype_id
          // 2. Si l'ingrédient demande un archetype, on cherche aussi les lots avec le canonical_food parent
          // 3. Si l'ingrédient demande un canonical_food, on cherche aussi les lots avec n'importe quel archetype de ce canonical_food

          if (ingredient.canonical_food_id) {
            // L'ingrédient demande un canonical_food
            inventory.forEach(lot => {
              let matches = false;
              // Correspondance directe avec canonical_food_id
              if (lot.canonical_food_id === ingredient.canonical_food_id) {
                matches = true;
              }
              // Correspondance avec un archetype du même canonical_food (via notre mapping)
              else if (lot.archetype_id && archetypeMapping[lot.archetype_id] === ingredient.canonical_food_id) {
                matches = true;
              }

              if (matches) {
                totalAvailable += lot.qty_remaining || 0;
                // Suivre la date d'expiration la plus proche
                if (lot.expiration_date) {
                  const expDate = new Date(lot.expiration_date);
                  if (!earliestExpirationDate || expDate < earliestExpirationDate) {
                    earliestExpirationDate = expDate;
                  }
                }
              }
            });
          } else if (ingredient.archetype_id) {
            // L'ingrédient demande un archetype spécifique
            const ingredientCanonicalId = ingredient.archetypes?.canonical_food_id;

            inventory.forEach(lot => {
              let matches = false;
              // Correspondance directe avec archetype_id
              if (lot.archetype_id === ingredient.archetype_id) {
                matches = true;
              }
              // Correspondance avec le canonical_food parent (si le lot est au niveau canonical_food)
              else if (lot.canonical_food_id && ingredientCanonicalId && lot.canonical_food_id === ingredientCanonicalId) {
                matches = true;
              }

              if (matches) {
                totalAvailable += lot.qty_remaining || 0;
                // Suivre la date d'expiration la plus proche
                if (lot.expiration_date) {
                  const expDate = new Date(lot.expiration_date);
                  if (!earliestExpirationDate || expDate < earliestExpirationDate) {
                    earliestExpirationDate = expDate;
                  }
                }
              }
            });
          }

          // Comparer à la quantité requise (si disponible)
          const requiredQty = ingredient.quantity || 1;
          if (totalAvailable >= requiredQty) {
            availableIngredients++;

            // Vérifier si cet ingrédient expire bientôt
            if (earliestExpirationDate) {
              const now = new Date();
              const daysUntilExpiration = Math.floor((earliestExpirationDate - now) / (1000 * 60 * 60 * 24));
              if (daysUntilExpiration <= URGENT_DAYS_THRESHOLD) {
                ingredientsExpiringSoon++;
              }
            }
          }
        });

        const availabilityPercent = Math.round((availableIngredients / totalIngredients) * 100);

        // Calcul du score Myko (0-100)
        // Basé sur : disponibilité (60%), urgence (30%), complexité (10%)
        let mykoScore = 0;

        // Composante disponibilité (60 points max)
        mykoScore += (availabilityPercent / 100) * 60;

        // Composante urgence (30 points max) : plus il y a d'ingrédients qui expirent bientôt, plus le score est élevé
        if (totalIngredients > 0) {
          const urgencyPercent = (ingredientsExpiringSoon / totalIngredients) * 100;
          mykoScore += (urgencyPercent / 100) * 30;
        }

        // Composante complexité (10 points max) : moins c'est complexe, plus le score est élevé
        const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
        if (totalTime > 0) {
          // Score inversé : 10 minutes = 10 points, 120 minutes = 0 points
          const complexityScore = Math.max(0, 10 - (totalTime / 120) * 10);
          mykoScore += complexityScore;
        } else {
          mykoScore += 5; // Score neutre si pas de temps défini
        }

        statusMap[recipe.id] = {
          totalIngredients,
          availableIngredients,
          availabilityPercent,
          urgentIngredients: ingredientsExpiringSoon,
          mykoScore: Math.round(mykoScore)
        };
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
          // Utiliser le score Myko calculé avec la disponibilité réelle
          valueA = inventoryStatus[a.id]?.mykoScore || 0;
          valueB = inventoryStatus[b.id]?.mykoScore || 0;
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
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="myko-page-container">
        <div className="hero-header">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Recettes</span>
              <h1 className="hero-title">Cuisiner avec votre stock</h1>
              <p className="hero-subtitle">{recipes.length} recette{recipes.length !== 1 ? 's' : ''} disponible{recipes.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="hero-actions">
              <Link href="/recipes/edit/new" className="btn-primary">+ Nouvelle recette</Link>
            </div>
          </div>
        </div>

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

            return (
              <RecipeListCard
                key={recipe.id}
                recipe={recipe}
                status={status}
                onCook={setSelectedRecipeToCook}
              />
            );
          })
        )}
      </div>

      {/* CookWizard */}
      <CookWizard
        open={!!selectedRecipeToCook}
        onClose={() => setSelectedRecipeToCook(null)}
        recipe={selectedRecipeToCook}
        onComplete={() => setSelectedRecipeToCook(null)}
      />
    </div>
      </div>
    </>
  );
}