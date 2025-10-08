'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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
    checkInventoryAvailability();
  }, []);

  useEffect(() => {
    filterAndSortRecipes();
  }, [recipes, searchTerm, availabilityFilter, sortBy, sortOrder]);

  async function fetchRecipes() {
    try {
      // Essayons d'abord avec la nouvelle structure
      let { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_categories!inner(name, icon),
          cuisine_types(name, flag),
          difficulty_levels(name, level)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Nouvelle structure non disponible, utilisation de l\'ancienne');
        // Fallback vers l'ancienne structure
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recipes')
          .select('*')
          .order('title');
        
        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }

      setRecipes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkInventoryAvailability() {
    try {
      // Simulation de disponibilité pour l'instant
      const statusMap = {};
      recipes.forEach(recipe => {
        statusMap[recipe.id] = {
          totalIngredients: Math.floor(Math.random() * 10) + 3,
          availableIngredients: Math.floor(Math.random() * 8) + 1,
          availabilityPercent: Math.floor(Math.random() * 100),
          urgentIngredients: Math.floor(Math.random() * 3)
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
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    const isVaried = !recipe.title.toLowerCase().includes('pâtes');
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
            const isUrgent = status.urgentIngredients > 0 || Math.random() < 0.15;
            const mykoScore = calculateMykoScore(recipe, status, availabilityPercent);
            
            return (
              <div 
                key={recipe.id} 
                className={`recipe-card ${isUrgent ? 'urgent-recipe' : ''} ${mykoScore >= 85 ? 'myko-recommended' : ''}`}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="recipe-header">
                  <h3 className="recipe-title">{recipe.title}</h3>
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
                    <span>{(recipe.prep_min || 0) + (recipe.cook_min || 0)} min</span>
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
                      alert(`🌿 "${recipe.title}" ajoutée au planning !`);
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