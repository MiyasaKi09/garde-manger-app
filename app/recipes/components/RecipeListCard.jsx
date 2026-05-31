'use client'

import Link from 'next/link'
import { getRecipeStyle } from '@/lib/foodEmoji'

export default function RecipeListCard({ recipe, status }) {
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0)
  const style = getRecipeStyle(recipe.category, recipe.title)
  const hasImage = !!recipe.image_url

  return (
    <Link
      href={`/recipes/generated/${recipe.id}`}
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
            alt={recipe.title}
            className="recipe-img-photo"
            loading="lazy"
          />
        ) : (
          <span className="recipe-img-emoji">{style.emoji}</span>
        )}

        {status.mykoScore !== undefined && status.mykoScore > 0 && (
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
          <h3 className="recipe-img-title">{recipe.title}</h3>
          <div className="recipe-img-meta">
            {totalTime > 0 && <span>⏱ {totalTime}min</span>}
            {recipe.servings && <span>👥 {recipe.servings}</span>}
            {recipe.ingredient_count > 0 && <span>🧂 {recipe.ingredient_count}</span>}
          </div>
        </div>
      </div>

      <div className="recipe-img-footer">
        <div className="recipe-img-avail-bar">
          <div
            className="recipe-img-avail-fill"
            style={{ width: `${status.availabilityPercent || 0}%` }}
          />
        </div>
        <span className="recipe-img-avail-pct">{status.availabilityPercent || 0}%</span>
      </div>
    </Link>
  )
}
