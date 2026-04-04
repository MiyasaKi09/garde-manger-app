'use client'

import Link from 'next/link'

/**
 * Carte de recette dans la grille de listing.
 * Extrait de recipes/page.js pour simplifier le JSX.
 */
export default function RecipeListCard({ recipe, status, onCook }) {
  const isUrgent = status.urgentIngredients > 0
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0)

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className={`recipe-card ${isUrgent ? 'urgent-recipe' : ''}`}
      style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
    >
      <div className="recipe-header">
        <h3 className="recipe-title">{recipe.title || recipe.name}</h3>
        <div className="recipe-badges">
          {status.mykoScore !== undefined && (
            <div className={`myko-score ${
              status.mykoScore >= 80 ? 'high-score' :
              status.mykoScore >= 50 ? 'medium-score' : 'low-score'
            }`}>
              {status.mykoScore}★
            </div>
          )}
          {isUrgent && <div className="urgent-badge">URGENT</div>}
        </div>
      </div>

      {recipe.description && (
        <p className="recipe-description">{recipe.description}</p>
      )}

      <div className="recipe-meta">
        <div className="meta-item">
          <span className="meta-icon">⏱️</span>
          <span>{totalTime > 0 ? `${totalTime} min` : 'Temps non défini'}</span>
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
        <button className="action-btn primary">
          👁️ Voir
        </button>
        <button
          className="action-btn cook"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onCook(recipe)
          }}
        >
          🍳 Cuisiner
        </button>
        <button
          className="action-btn secondary"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          📅 Planifier
        </button>
      </div>
    </Link>
  )
}
