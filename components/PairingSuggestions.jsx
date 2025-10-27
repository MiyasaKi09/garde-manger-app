/**
 * 🧪 Composant de Suggestions d'Assemblage Intelligent
 * 
 * Affiche des suggestions d'accompagnements harmonieux pour un plat principal
 * basées sur 4 algorithmes gastronomiques.
 * 
 * Utilise l'API /api/recipes/suggestions
 */

'use client';

import { useState, useEffect } from 'react';
import './PairingSuggestions.css';

/**
 * Icônes pour les types de raisons
 */
const REASON_ICONS = {
  food_pairing: '🧬',
  balance: '⚖️',
  contrast: '🎭',
  terroir: '🌍',
  season: '🍂',
};

/**
 * Couleurs pour les scores
 */
function getScoreColor(score) {
  if (score >= 70) return '#22c55e'; // Excellent - Vert
  if (score >= 50) return '#f59e0b'; // Bon - Orange
  if (score >= 30) return '#fbbf24'; // Acceptable - Jaune
  return '#9ca3af'; // Faible - Gris
}

/**
 * Badge de score avec couleur
 */
function ScoreBadge({ score }) {
  const color = getScoreColor(score);
  return (
    <div className="score-badge" style={{ backgroundColor: `${color}20`, color }}>
      <span className="score-value">{score}</span>
      <span className="score-label">/100</span>
    </div>
  );
}

/**
 * Carte de suggestion d'accompagnement
 */
function SuggestionCard({ suggestion, onAddToPlanning, loading }) {
  const { recipe, score, scorePercentage, reasons } = suggestion;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="suggestion-card">
      <div className="suggestion-header">
        <div className="suggestion-info">
          <h4 className="suggestion-title">{recipe.name}</h4>
          {recipe.description && (
            <p className="suggestion-description">{recipe.description}</p>
          )}
        </div>
        <ScoreBadge score={scorePercentage} />
      </div>

      <div className="suggestion-reasons">
        {reasons.slice(0, expanded ? reasons.length : 2).map((reason, index) => (
          <div key={index} className="reason-tag">
            <span className="reason-icon">{REASON_ICONS[reason.type]}</span>
            <span className="reason-text">{reason.description}</span>
            <span className="reason-score">+{reason.score}</span>
          </div>
        ))}
      </div>

      {reasons.length > 2 && (
        <button
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▲ Voir moins' : `▼ ${reasons.length - 2} raison(s) de plus`}
        </button>
      )}

      <div className="suggestion-actions">
        <button
          className="add-button"
          onClick={() => onAddToPlanning(recipe)}
          disabled={loading}
        >
          {loading ? '⏳ Ajout...' : '+ Ajouter au planning'}
        </button>
        <a
          href={`/recipes/${recipe.id}`}
          className="view-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          👁️ Voir la recette
        </a>
      </div>
    </div>
  );
}

/**
 * État de chargement
 */
function LoadingState() {
  return (
    <div className="pairing-loading">
      <div className="spinner"></div>
      <p>Recherche d'accompagnements harmonieux...</p>
      <p className="loading-detail">Analyse des arômes, textures et cuisines...</p>
    </div>
  );
}

/**
 * État d'erreur
 */
function ErrorState({ error, onRetry }) {
  return (
    <div className="pairing-error">
      <div className="error-icon">⚠️</div>
      <h4>Erreur lors du chargement des suggestions</h4>
      <p>{error}</p>
      <button className="retry-button" onClick={onRetry}>
        🔄 Réessayer
      </button>
    </div>
  );
}

/**
 * État vide (aucune suggestion)
 */
function EmptyState({ mainRecipe }) {
  return (
    <div className="pairing-empty">
      <div className="empty-icon">🤔</div>
      <h4>Aucun accompagnement trouvé</h4>
      <p>
        Nous n'avons pas trouvé d'accompagnements compatibles avec{' '}
        <strong>{mainRecipe?.name || 'ce plat'}</strong>.
      </p>
      <p className="empty-hint">
        Cela peut arriver si la recette a des tags très spécifiques ou si peu
        d'accompagnements correspondent à ses caractéristiques.
      </p>
    </div>
  );
}

/**
 * Composant principal de suggestions de pairing
 * 
 * @param {Object} props
 * @param {number} props.mainRecipeId - ID du plat principal
 * @param {string} props.mainRecipeName - Nom du plat principal (optionnel, pour affichage)
 * @param {Function} props.onAddRecipe - Callback appelé quand on ajoute une suggestion au planning
 * @param {Object} props.filters - Filtres optionnels (diet, season)
 * @param {number} props.maxSuggestions - Nombre max de suggestions (défaut: 5)
 */
export default function PairingSuggestions({
  mainRecipeId,
  mainRecipeName,
  onAddRecipe,
  filters = {},
  maxSuggestions = 5,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingRecipe, setAddingRecipe] = useState(null);

  useEffect(() => {
    if (mainRecipeId) {
      fetchSuggestions();
    }
  }, [mainRecipeId, filters.diet, filters.season, maxSuggestions]);

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainRecipeId,
          diet: filters.diet,
          season: filters.season,
          maxSuggestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Erreur fetch suggestions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPlanning(recipe) {
    setAddingRecipe(recipe.id);
    try {
      await onAddRecipe(recipe);
    } catch (err) {
      console.error('Erreur ajout au planning:', err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setAddingRecipe(null);
    }
  }

  if (!mainRecipeId) {
    return null;
  }

  return (
    <div className="pairing-suggestions">
      <div className="pairing-header">
        <div className="pairing-title">
          <h3>🧪 Suggestions d'accompagnements</h3>
          <p className="pairing-subtitle">
            Pour <strong>{mainRecipeName || 'ce plat'}</strong>
          </p>
        </div>
        
        {suggestions.length > 0 && (
          <div className="pairing-count">
            {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} trouvée{suggestions.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {loading && <LoadingState />}

      {error && <ErrorState error={error} onRetry={fetchSuggestions} />}

      {!loading && !error && suggestions.length === 0 && (
        <EmptyState mainRecipe={{ name: mainRecipeName }} />
      )}

      {!loading && !error && suggestions.length > 0 && (
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.recipe.id}
              suggestion={suggestion}
              onAddToPlanning={handleAddToPlanning}
              loading={addingRecipe === suggestion.recipe.id}
            />
          ))}
        </div>
      )}

      {/* Info sur les algorithmes */}
      {!loading && suggestions.length > 0 && (
        <div className="pairing-info">
          <details className="pairing-details">
            <summary>ℹ️ Comment fonctionnent les suggestions ?</summary>
            <div className="pairing-explanation">
              <p>
                Les suggestions sont calculées avec <strong>4 algorithmes gastronomiques</strong> :
              </p>
              <ul>
                <li>
                  <strong>🧬 Food Pairing</strong> (30 pts) - Arômes partagés (gastronomie moléculaire)
                </li>
                <li>
                  <strong>⚖️ Équilibre</strong> (25 pts) - Plat riche ↔ Accompagnement léger/acide
                </li>
                <li>
                  <strong>🎭 Contraste</strong> (20 pts) - Textures opposées (crémeux ↔ croquant)
                </li>
                <li>
                  <strong>🌍 Terroir</strong> (15 pts) - Cuisine commune (Italienne, Française, etc.)
                </li>
                <li>
                  <strong>🍂 Saison</strong> (10 pts) - Bonus pour saison commune
                </li>
              </ul>
              <p className="score-interpretation">
                <strong>Score ≥ 70</strong> : Excellent • <strong>50-69</strong> : Bon •{' '}
                <strong>30-49</strong> : Acceptable • <strong>&lt; 30</strong> : Faible
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
