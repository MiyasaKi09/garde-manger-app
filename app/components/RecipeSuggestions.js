'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function RecipeSuggestions({ mealType = null, onSelectRecipe = null }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minAvailability: 70,
    maxTime: null,
    difficulty: null,
    isVeg: null
  });

  useEffect(() => {
    loadSuggestions();
  }, [filters]);

  async function loadSuggestions() {
    setLoading(true);
    try {
      // Obtenir les suggestions basées sur l'inventaire
      const { data: suggestionsData, error } = await supabase.rpc(
        'suggest_recipes_by_inventory',
        {
          p_limit: 10,
          p_min_availability: filters.minAvailability
        }
      );

      if (error) throw error;

      // Filtrer selon les critères supplémentaires
      let filtered = suggestionsData || [];

      if (filters.maxTime) {
        filtered = filtered.filter(s => !s.cook_time || s.cook_time <= filters.maxTime);
      }

      if (filters.difficulty) {
        filtered = filtered.filter(s => s.difficulty === filters.difficulty);
      }

      // Si on veut filtrer par végétarien, on doit récupérer cette info
      if (filters.isVeg !== null) {
        const recipeIds = filtered.map(s => s.recipe_id);
        const { data: recipesData } = await supabase
          .from('recipes')
          .select('id, is_veg')
          .in('id', recipeIds);
        
        const vegMap = {};
        recipesData?.forEach(r => {
          vegMap[r.id] = r.is_veg;
        });

        filtered = filtered.filter(s => vegMap[s.recipe_id] === filters.isVeg);
      }

      // Ajouter un score de suggestion basé sur plusieurs critères
      const scoredSuggestions = filtered.map(suggestion => ({
        ...suggestion,
        score: calculateSuggestionScore(suggestion)
      }));

      // Trier par score
      scoredSuggestions.sort((a, b) => b.score - a.score);

      setSuggestions(scoredSuggestions.slice(0, 6));
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateSuggestionScore(suggestion) {
    let score = 0;
    
    // Bonus pour haute disponibilité
    score += suggestion.availability_percent;
    
    // Bonus si tous les ingrédients sont disponibles
    if (suggestion.availability_percent === 100) {
      score += 20;
    }
    
    // Pénalité pour les recettes longues
    if (suggestion.cook_time) {
      if (suggestion.cook_time <= 30) score += 10;
      else if (suggestion.cook_time <= 60) score += 5;
      else score -= 5;
    }
    
    // Bonus pour les recettes faciles
    if (suggestion.difficulty === 'facile') score += 10;
    else if (suggestion.difficulty === 'difficile') score -= 5;
    
    // Pénalité pour les ingrédients manquants
    score -= (suggestion.missing_ingredients?.length || 0) * 10;
    
    return score;
  }

  function getDifficultyEmoji(difficulty) {
    switch(difficulty) {
      case 'facile': return '👶';
      case 'moyen': return '👨‍🍳';
      case 'difficile': return '👨‍🍳👨‍🍳';
      default: return '❓';
    }
  }

  function getAvailabilityColor(percent) {
    if (percent >= 90) return '#4caf50';
    if (percent >= 70) return '#ff9800';
    return '#f44336';
  }

  if (loading) {
    return (
      <div className="suggestions-container">
        <div className="suggestions-loading">
          ⏳ Recherche des meilleures recettes selon votre stock...
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-container">
      <div className="suggestions-header">
        <h2>🎯 Recettes suggérées</h2>
        <p className="suggestions-subtitle">
          Basées sur les ingrédients disponibles dans votre inventaire
        </p>
      </div>

      {/* Filtres rapides */}
      <div className="suggestions-filters">
        <select 
          value={filters.minAvailability}
          onChange={(e) => setFilters({...filters, minAvailability: parseInt(e.target.value)})}
          className="filter-select"
        >
          <option value={50}>≥50% disponible</option>
          <option value={70}>≥70% disponible</option>
          <option value={90}>≥90% disponible</option>
          <option value={100}>100% disponible</option>
        </select>

        <select 
          value={filters.maxTime || ''}
          onChange={(e) => setFilters({...filters, maxTime: e.target.value ? parseInt(e.target.value) : null})}
          className="filter-select"
        >
          <option value="">Tout temps</option>
          <option value={30}>≤30 min</option>
          <option value={60}>≤1 heure</option>
          <option value={90}>≤1h30</option>
        </select>

        <select 
          value={filters.difficulty || ''}
          onChange={(e) => setFilters({...filters, difficulty: e.target.value || null})}
          className="filter-select"
        >
          <option value="">Toute difficulté</option>
          <option value="facile">Facile</option>
          <option value="moyen">Moyen</option>
          <option value="difficile">Difficile</option>
        </select>

        <button 
          className={`filter-btn ${filters.isVeg === true ? 'active' : ''}`}
          onClick={() => setFilters({
            ...filters, 
            isVeg: filters.isVeg === true ? null : true
          })}
        >
          🌱 Végé
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div className="no-suggestions">
          <p>Aucune recette ne correspond à vos critères.</p>
          <p>Essayez d'ajuster les filtres ou de faire des courses!</p>
        </div>
      ) : (
        <div className="suggestions-grid">
          {suggestions.map((suggestion, idx) => (
            <div key={suggestion.recipe_id} className="suggestion-card">
              <div className="suggestion-rank">#{idx + 1}</div>
              
              <div className="suggestion-header">
                <h3>{suggestion.title}</h3>
                <div 
                  className="availability-badge"
                  style={{ backgroundColor: getAvailabilityColor(suggestion.availability_percent) }}
                >
                  {Math.round(suggestion.availability_percent)}%
                </div>
              </div>

              <div className="suggestion-meta">
                {suggestion.cook_time && (
                  <span className="meta-item">
                    ⏱ {suggestion.cook_time} min
                  </span>
                )}
                {suggestion.difficulty && (
                  <span className="meta-item">
                    {getDifficultyEmoji(suggestion.difficulty)} {suggestion.difficulty}
                  </span>
                )}
              </div>

              {suggestion.missing_ingredients && suggestion.missing_ingredients.length > 0 && (
                <div className="missing-ingredients">
                  <span className="missing-label">Manquants:</span>
                  <div className="missing-list">
                    {suggestion.missing_ingredients.slice(0, 3).map((ing, i) => (
                      <span key={i} className="missing-item">{ing}</span>
                    ))}
                    {suggestion.missing_ingredients.length > 3 && (
                      <span className="missing-more">
                        +{suggestion.missing_ingredients.length - 3} autres
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="suggestion-actions">
                {onSelectRecipe ? (
                  <button 
                    onClick={() => onSelectRecipe(suggestion.recipe_id)}
                    className="btn-primary"
                  >
                    ✓ Sélectionner
                  </button>
                ) : (
                  <Link 
                    href={`/recipes?selected=${suggestion.recipe_id}`}
                    className="btn-primary"
                  >
                    👁 Voir la recette
                  </Link>
                )}
                
                <Link 
                  href={`/meal-planning?recipe=${suggestion.recipe_id}`}
                  className="btn-secondary"
                >
                  📅 Planifier
                </Link>
              </div>

              {/* Indicateur de score (pour debug, peut être retiré) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="suggestion-score" title="Score de suggestion">
                  Score: {suggestion.score}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .suggestions-container {
          padding: 1rem;
        }

        .suggestions-header {
          margin-bottom: 1.5rem;
        }

        .suggestions-header h2 {
          color: #2e7d32;
          margin-bottom: 0.5rem;
        }

        .suggestions-subtitle {
          color: #666;
          font-size: 0.9rem;
        }

        .suggestions-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: #4caf50;
          color: white;
          border-color: #4caf50;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .suggestion-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          position: relative;
          transition: transform 0.2s;
        }

        .suggestion-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .suggestion-rank {
          position: absolute;
          top: -10px;
          right: -10px;
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .suggestion-header h3 {
          flex: 1;
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }

        .availability-badge {
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .suggestion-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          color: #666;
          font-size: 0.9rem;
        }

        .missing-ingredients {
          background: #fff3e0;
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .missing-label {
          font-weight: 600;
          color: #f57c00;
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.85rem;
        }

        .missing-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .missing-item {
          background: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          border: 1px solid #ffcc80;
        }

        .missing-more {
          color: #f57c00;
          font-style: italic;
          font-size: 0.85rem;
        }

        .suggestion-actions {
          display: flex;
          gap: 0.5rem;
        }

        .suggestion-actions .btn-primary,
        .suggestion-actions .btn-secondary {
          flex: 1;
          padding: 0.5rem;
          text-align: center;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4caf50, #45a049);
          color: white;
          border: none;
        }

        .btn-secondary {
          background: white;
          color: #666;
          border: 1px solid #ddd;
        }

        .suggestion-score {
          position: absolute;
          bottom: 5px;
          right: 5px;
          font-size: 0.7rem;
          color: #999;
        }

        .no-suggestions {
          text-align: center;
          padding: 3rem;
          background: #f5f5f5;
          border-radius: 12px;
        }

        .no-suggestions p {
          color: #666;
          margin: 0.5rem 0;
        }

        .suggestions-loading {
          text-align: center;
          padding: 3rem;
          color: #666;
        }
      `}</style>
    </div>
  );
}
