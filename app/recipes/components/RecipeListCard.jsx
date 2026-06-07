'use client'

import Link from 'next/link'

export default function RecipeListCard({ recipe, status }) {
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0)
  const hasImage = !!recipe.image_url
  const monogram = (recipe.title || 'M').trim().charAt(0).toUpperCase()

  const meta = []
  if (totalTime > 0) meta.push(`${totalTime} min`)
  if (recipe.servings) meta.push(`${recipe.servings} pers.`)
  if (status?.mykoScore > 0) meta.push(`${status.mykoScore} pts`)

  return (
    <Link href={`/recipes/generated/${recipe.id}`} className="v21-card rc-card">
      <div className="v21-card-media">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image_url} alt={recipe.title} loading="lazy" />
        ) : (
          <span className="v21-card-mono">{monogram}</span>
        )}
        {status?.urgentIngredients > 0 && <span className="rc-flag">Urgent</span>}
      </div>

      <div className="v21-card-body">
        <h3 className="v21-card-title">{recipe.title}</h3>
        {meta.length > 0 && <div className="v21-card-meta">{meta.join(' · ')}</div>}
        <div className="rc-avail">
          <span className="rc-avail-bar" aria-hidden="true">
            <span className="rc-avail-fill" style={{ width: `${status?.availabilityPercent || 0}%` }} />
          </span>
          <span className="rc-avail-pct">{status?.availabilityPercent || 0}%</span>
        </div>
      </div>
    </Link>
  )
}
