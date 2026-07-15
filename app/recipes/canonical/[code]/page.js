import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEditorialRecipe } from '@/lib/db/operationalRecipeCatalog'
import { createCookieSupabase } from '@/lib/supabase/request'
import styles from './recipe.module.css'

export const dynamic = 'force-dynamic'

const sensoryLabels = {
  sweet: 'Sucré', salty: 'Salé', acidic: 'Acide', bitter: 'Amer', umami: 'Umami',
  heat: 'Piquant', pungency: 'Aromatique', richness: 'Richesse', freshness: 'Fraîcheur', intensity: 'Intensité',
}

const sensoryProfileLabels = {
  brothy_umami: 'Bouillonné et savoureux', creamy_delicate: 'Crémeux et délicat', earthy_herbal: 'Végétal et herbacé',
  fermented_pungent: 'Fermenté et intense', fresh_acidic: 'Frais et acidulé', nutty_savory: 'Noisetté et savoureux',
  rich_winey: 'Riche et vineux', savory_crisp: 'Savoureux et croustillant', smoky_sweet: 'Fumé et doux',
  spicy_umami: 'Épicé et savoureux', sweet_fresh: 'Doux et frais', sweet_spiced: 'Doux et épicé',
  tangy_creamy: 'Acidulé et crémeux', tomato_herbal: 'Tomaté et herbacé', warm_aromatic: 'Chaleureux et aromatique',
}

const identityLabels = {
  named_traditional_dish: 'Plat traditionnel',
  domestic_international_dish: 'Classique international',
  domestic_standard: 'Cuisine du quotidien',
}

const roleLabels = {
  base: 'Base', protein: 'Protéine', vegetable: 'Légume', sauce: 'Sauce', cheese: 'Fromage',
  cooking: 'Cuisson', condiment: 'Assaisonnement', seasoning: 'Assaisonnement', fat: 'Matière grasse',
  garnish: 'Garniture', aromatic: 'Aromate', liquid: 'Liquide', flour: 'Farine', egg: 'Œuf', dairy: 'Produit laitier',
}

const categoryLabels = {
  main: 'Plat principal', starter: 'Entrée', dessert: 'Dessert', side: 'Accompagnement', sauce: 'Sauce', soup: 'Soupe',
}

const genericGuardrails = new Set([
  'conserver_les_ingrédients_signatures',
  'conserver_la_technique_centrale',
  'ne_pas_remplacer_par_un_simple_équivalent_nutritionnel',
])

function sentence(value) {
  if (!value) return ''
  const text = String(value).replaceAll('_', ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatQuantity(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
}

function portionsOf(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 24 ? parsed : fallback
}

async function loadRecipe(code, servings = null) {
  const supabase = await createCookieSupabase()
  return getEditorialRecipe(supabase, code, { servings })
}

export async function generateMetadata({ params }) {
  const recipe = await loadRecipe(params.code)
  return recipe
    ? { title: `${recipe.family} · Myko`, description: `Recette complète de ${recipe.family}, avec quantités et étapes détaillées.` }
    : {}
}

function SubRecipe({ component, recipe }) {
  if (!component || !recipe) return null
  return (
    <details className={styles.subRecipe}>
      <summary>Préparer {component.name || recipe.family} pour cette recette</summary>
      <div className={styles.subRecipeBody}>
        <p>Quantités calculées pour obtenir {formatQuantity(component.requiredQuantity)} {component.requiredUnit}.</p>
        <ul>
          {recipe.exactIngredients.map((ingredient, index) => (
            <li key={`${ingredient.name}-${index}`}>
              <span>{ingredient.name}</span>
              <strong>{formatQuantity(ingredient.quantity)} {ingredient.unit}{ingredient.optional ? ' · facultatif' : ''}</strong>
            </li>
          ))}
        </ul>
        <ol>
          {recipe.exactSteps.map((step, index) => <li key={step.n || index}>{step.instruction}</li>)}
        </ol>
        <Link href={`/recipes/canonical/${component.code}`}>Voir la recette complète de la béchamel →</Link>
      </div>
    </details>
  )
}

export default async function CanonicalRecipePage({ params, searchParams }) {
  const baseRecipe = await loadRecipe(params.code)
  if (!baseRecipe) notFound()
  const servings = portionsOf(searchParams?.portions, baseRecipe.servings)
  const recipe = servings === baseRecipe.servings ? baseRecipe : await loadRecipe(params.code, servings)

  const scores = Object.entries(recipe.sensory?.scores || {})
  const nutrition = recipe.nutritionPerServing
  const nutritionComplete = recipe.operationalEligible && recipe.nutritionCoverage.pct === 100
  const meaningfulGuardrails = (recipe.sensory?.identity_guardrails || []).filter((item) => !genericGuardrails.has(item))
  const profileLabel = sensoryProfileLabels[recipe.sensory?.profile] || sentence(recipe.sensory?.profile)

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/recipes">Recettes</Link><span>→</span><span>{recipe.code}</span>
      </nav>

      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Recette complète Myko</p>
          <h1>{recipe.family}</h1>
          <p className={styles.lede}>{[recipe.cuisineOrigin, categoryLabels[recipe.category] || sentence(recipe.category)].filter(Boolean).join(' · ')}</p>
        </div>
        <div>
          <dl className={styles.facts}>
            <div><dt>Préparation</dt><dd>{recipe.prepMinutes} min</dd></div>
            <div><dt>Cuisson</dt><dd>{recipe.cookMinutes} min</dd></div>
            <div><dt>Portions</dt><dd>{recipe.servings}</dd></div>
            <div><dt>Difficulté</dt><dd>{sentence(recipe.difficulty)}</dd></div>
          </dl>
          <form className={styles.portionForm} method="get" action={`/recipes/canonical/${recipe.code}`}>
            <label htmlFor="portions">Adapter les quantités</label>
            <input id="portions" name="portions" type="number" min="1" max="24" step="1" defaultValue={recipe.servings} />
            <button type="submit">Recalculer</button>
          </form>
        </div>
      </header>

      <section className={styles.quality} aria-label="Qualité de la recette">
        <span>Quantités vérifiées</span>
        {nutritionComplete && <span>Nutrition complète</span>}
        <span>{identityLabels[recipe.identityLevel] || sentence(recipe.identityLevel)}</span>
      </section>

      <div className={`${styles.columns} ${!nutritionComplete ? styles.singleColumn : ''}`}>
        <section className={styles.ingredients}>
          <p className={styles.sectionLabel}>Ingrédients</p>
          <h2>Pour {recipe.servings} personnes</h2>
          <ul>
            {recipe.exactIngredients.map((ingredient, index) => {
              const component = ingredient.component
              const subRecipe = component?.code ? recipe.subRecipes?.[component.code] : null
              return (
                <li className={styles.ingredientRow} key={`${ingredient.name}-${index}`}>
                  <div className={styles.ingredientMain}>
                    <span><strong>{ingredient.name}</strong><small>{roleLabels[ingredient.role] || sentence(ingredient.role)}</small></span>
                    <span>{formatQuantity(ingredient.quantity)} {ingredient.unit}{ingredient.optional ? ' · facultatif' : ''}</span>
                  </div>
                  <SubRecipe component={component} recipe={subRecipe} />
                </li>
              )
            })}
          </ul>
          {recipe.allergens.length > 0 && <p className={styles.notice}><strong>Allergènes :</strong> {recipe.allergens.join(', ')}</p>}
        </section>

        {nutritionComplete && (
          <aside className={styles.aside}>
            <p className={styles.sectionLabel}>Par portion</p>
            <h2>Repères nutritionnels</h2>
            <dl className={styles.nutrition}>
              <div><dt>Énergie</dt><dd>{Math.round(nutrition.kcal)} kcal</dd></div>
              <div><dt>Protéines</dt><dd>{formatQuantity(nutrition.proteinG)} g</dd></div>
              <div><dt>Glucides</dt><dd>{formatQuantity(nutrition.carbsG)} g</dd></div>
              <div><dt>Lipides</dt><dd>{formatQuantity(nutrition.fatG)} g</dd></div>
              <div><dt>Fibres</dt><dd>{formatQuantity(nutrition.fiberG)} g</dd></div>
            </dl>
          </aside>
        )}
      </div>

      <section className={styles.steps}>
        <p className={styles.sectionLabel}>Préparation</p>
        <h2>La méthode</h2>
        <ol>
          {recipe.exactSteps.map((step, index) => (
            <li key={step.n || index}><span>{String(step.n || index + 1).padStart(2, '0')}</span><p>{step.instruction}</p></li>
          ))}
        </ol>
      </section>

      {recipe.variants.length > 0 && (
        <section className={styles.variants}>
          <p className={styles.sectionLabel}>Variantes de la recette</p>
          <h2>D’autres façons de la préparer</h2>
          <ul>{recipe.variants.map((variant) => <li key={variant}>{variant}</li>)}</ul>
        </section>
      )}

      <div className={`${styles.columns} ${meaningfulGuardrails.length === 0 ? styles.singleColumn : ''}`}>
        <section className={styles.sensory}>
          <p className={styles.sectionLabel}>Profil gustatif · {profileLabel}</p>
          <h2>Équilibre du plat</h2>
          <div className={styles.scoreGrid}>
            {scores.map(([key, value]) => (
              <div key={key} className={styles.score}>
                <span>{sensoryLabels[key] || sentence(key)}</span>
                <i><b style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></i>
                <em>{value}/5</em>
              </div>
            ))}
          </div>
          <div className={styles.tags}>{(recipe.sensory?.dominant_flavors || []).map((item) => <span key={item}>{sentence(item)}</span>)}</div>
        </section>

        {meaningfulGuardrails.length > 0 && (
          <aside className={styles.aside}>
            <p className={styles.sectionLabel}>Repères culinaires</p>
            <h2>Ce qui fait le plat</h2>
            <ul className={styles.guardrails}>
              {meaningfulGuardrails.map((item) => <li key={item}>{sentence(item)}</li>)}
            </ul>
            {recipe.conservation && <p className={styles.notice}><strong>Conservation :</strong> {recipe.conservation}</p>}
          </aside>
        )}
      </div>

      <footer className={styles.footer}>
        <div>{recipe.techniques.length > 0 && <strong>{recipe.techniques.map(sentence).join(' · ')}</strong>}</div>
        <Link href={`/planning?recipe=${recipe.code}`}>Intégrer au planning →</Link>
      </footer>
    </main>
  )
}
