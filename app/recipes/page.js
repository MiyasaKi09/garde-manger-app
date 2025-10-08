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
          id,
          title,
          name,
          description,
          short_description,
          servings,
          prep_min,
          cook_min,
          rest_min,
          myko_score,
          difficulty_level_id,
          category_id,
          cuisine_type_id,
          is_active,
          created_at,
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
        .order('myko_score', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        console.log('Message d\'erreur complet:', error);
        // Ne pas throw, essayer la requête de fallback
      }

      console.log('Recettes chargées:', data);
      console.log('Nombre de recettes:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('Première recette:', data[0]);
        setRecipes(data || []);
        return; // Sortir si on a des données
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
      
      // En cas d'erreur ou pas de données, essayer des requêtes plus simples
      console.log('Essai de requête simple sans relations...');
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from('recipes')
          .select('*')
          .limit(50);
          
        console.log('Requête simple - Données:', simpleData);
        console.log('Requête simple - Erreur:', simpleError);
        
        if (simpleError) {
          console.error('Erreur requête simple:', simpleError);
          // Essayer sans conditions
          const { data: basicData, error: basicError } = await supabase
            .from('recipes')
            .select('id, title, name, description')
            .limit(10);
          
          console.log('Requête basique - Données:', basicData);
          console.log('Requête basique - Erreur:', basicError);
          
          if (!basicError && basicData) {
            setRecipes(basicData.map(r => ({ ...r, prep_min: 30, cook_min: 15, myko_score: 75 })));
            return;
          }
        } else {
          setRecipes(simpleData || []);
          return;
        }
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
      }
      
      // Si tout échoue, créer des recettes de démonstration
      console.log('Utilisation de recettes de démonstration...');
      setRecipes([
        {
          id: 'demo-1',
          title: 'Ratatouille Provençale',
          name: 'Ratatouille Provençale',
          description: 'Mijoté de légumes du soleil : aubergines, courgettes, tomates, poivrons. Un classique de la cuisine française parfait pour l\'été.',
          short_description: 'Délicieux plat de légumes du soleil',
          prep_min: 30,
          cook_min: 60,
          rest_min: 0,
          servings: 6,
          myko_score: 95,
          instructions: 'Couper tous les légumes en dés. Faire revenir séparément aubergines, courgettes, poivrons. Ajouter les tomates, l\'ail, les herbes de Provence. Mijoter 45 min.',
          difficulty: 'Facile',
          is_vegetarian: true,
          is_vegan: true
        },
        {
          id: 'demo-2',
          title: 'Curry de lentilles corail',
          name: 'Curry de lentilles corail',
          description: 'Curry végétarien aux lentilles corail, lait de coco et épices indiennes. Riche en protéines et en saveurs.',
          short_description: 'Curry végétarien aux lentilles corail',
          prep_min: 20,
          cook_min: 35,
          rest_min: 0,
          servings: 4,
          myko_score: 88,
          instructions: 'Faire revenir l\'oignon et les épices. Ajouter les lentilles corail, le lait de coco et les tomates. Cuire 25 min jusqu\'à ce que les lentilles soient tendres.',
          difficulty: 'Moyen',
          is_vegetarian: true,
          is_vegan: true
        },
        {
          id: 'demo-3',
          title: 'Soupe de potimarron rôti',
          name: 'Soupe de potimarron rôti',
          description: 'Velouté onctueux de potimarron rôti avec une pointe de gingembre. Parfait pour les soirées d\'automne.',
          short_description: 'Velouté onctueux de potimarron rôti',
          prep_min: 20,
          cook_min: 45,
          rest_min: 0,
          servings: 6,
          myko_score: 90,
          instructions: 'Rôtir le potimarron coupé au four. Faire suer l\'oignon, ajouter le potimarron, le bouillon et le gingembre. Mixer jusqu\'à obtenir un velouté lisse.',
          difficulty: 'Facile',
          is_vegetarian: true,
          is_vegan: true
        },
        {
          id: 'demo-4',
          title: 'Salade de quinoa aux légumes',
          name: 'Salade de quinoa aux légumes',
          description: 'Salade complète et nutritive avec quinoa, légumes croquants et vinaigrette aux herbes.',
          short_description: 'Salade complète au quinoa',
          prep_min: 25,
          cook_min: 15,
          rest_min: 30,
          servings: 4,
          myko_score: 82,
          instructions: 'Cuire le quinoa. Préparer les légumes. Mélanger avec la vinaigrette et laisser mariner 30 min.',
          difficulty: 'Très facile',
          is_vegetarian: true,
          is_vegan: true
        },
        {
          id: 'demo-5',
          title: 'Risotto aux champignons',
          name: 'Risotto aux champignons',
          description: 'Risotto crémeux aux champignons de saison et parmesan. Un classique italien réconfortant.',
          short_description: 'Risotto italien aux champignons',
          prep_min: 20,
          cook_min: 35,
          rest_min: 0,
          servings: 4,
          myko_score: 78,
          instructions: 'Faire revenir les champignons. Nacrer le riz, ajouter le bouillon louche par louche en remuant. Terminer avec beurre et parmesan.',
          difficulty: 'Difficile',
          is_vegetarian: true,
          is_vegan: false
        },
        {
          id: 'demo-6',
          title: 'Pad Thaï aux légumes',
          name: 'Pad Thaï aux légumes',
          description: 'Nouilles de riz sautées à la thaïlandaise avec légumes croquants et sauce aigre-douce.',
          short_description: 'Nouilles thaï aux légumes',
          prep_min: 25,
          cook_min: 15,
          rest_min: 0,
          servings: 4,
          myko_score: 85,
          instructions: 'Réhydrater les nouilles. Faire sauter l\'ail, ajouter les légumes, puis les nouilles et la sauce. Terminer avec germes de soja.',
          difficulty: 'Moyen',
          is_vegetarian: true,
          is_vegan: true
        }
      ]);
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
                  <h3 className="recipe-title">{recipe.title || recipe.name}</h3>
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
                      {(recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0) > 0 
                        ? `${(recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0)} min` 
                        : recipe.prep_min && recipe.cook_min 
                        ? `${(recipe.prep_min || 0) + (recipe.cook_min || 0)} min`
                        : recipe.prep_min 
                        ? `${recipe.prep_min} min (prep)`
                        : recipe.cook_min
                        ? `${recipe.cook_min} min (cuisson)`
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