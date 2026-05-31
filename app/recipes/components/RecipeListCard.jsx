'use client'

import Link from 'next/link'
import { getRecipeStyle } from '@/lib/foodEmoji'

export default function RecipeListCard({ recipe, status, onCook }) {
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0)
  const style = getRecipeStyle(recipe.category, recipe.title || recipe.name)
  const hasImage = !!recipe.image_url

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="recipe-img-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        className="recipe-img-visual"
        style={hasImage ? undefined : {
          background: `linear-gradient(135deg, ${style.bg} 0%, ${style.bgEnd} 100%)`
        }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title || recipe.name}
            className="recipe-img-photo"
            loading="lazy"
          />
        ) : (
          <span className="recipe-img-emoji">{style.emoji}</span>
        )}

        {status.mykoScore !== undefined && (
          <div className={`recipe-img-score ${
            status.mykoScore >= 80 ? 'score-high' :
            status.mykoScore >= 50 ? 'score-mid' : 'score-low'
          }`}>
            {status.mykoScore}★
          </div>
        )}

        {status.urgentIngredients > 0 && (
          <div className="recipe-img-urgent">URGENT</div>
        )}

        <div className="recipe-img-overlay">
          <h3 className="recipe-img-title">{recipe.title || recipe.name}</h3>
          <div className="recipe-img-meta">
            {totalTime > 0 && <span>⏱ {totalTime}min</span>}
            <span>👥 {recipe.servings || recipe.portions || '?'}</span>
          </div>
        </div>
      </div>

      <div className="recipe-img-footer">
        <div className="recipe-img-avail-bar">
          <div
            className="recipe-img-avail-fill"
            style={{ width: `${status.availabilityPercent}%` }}
          />
        </div>
        <span className="recipe-img-avail-pct">{status.availabilityPercent}%</span>
      </div>
    </Link>
  )
}
