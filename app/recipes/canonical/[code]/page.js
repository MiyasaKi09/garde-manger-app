import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOperationalRecipe } from '@/lib/db/operationalRecipeCatalog'
import { createCookieSupabase } from '@/lib/supabase/request'
import styles from './recipe.module.css'

export const dynamic = 'force-dynamic'

const sensoryLabels = {
  sweet: 'Sucré',
  salty: 'Salé',
  acidic: 'Acide',
  bitter: 'Amer',
  umami: 'Umami',
  heat: 'Piquant',
  pungency: 'Aromatique',
  richness: 'Richesse',
  freshness: 'Fraîcheur',
  intensity: 'Intensité',
}

const identityLabels = {
  named_traditional_dish: 'Plat traditionnel nommé',
  domestic_international_dish: 'Plat domestique international',
  domestic_standard: 'Standard de cuisine domestique',
}

function formatQuantity(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
}

async function loadRecipe(code) {
  const supabase = await createCookieSupabase()
  return getOperationalRecipe(supabase, code)
}

export async function generateMetadata({ params }) {
  const recipe = await loadRecipe(params.code)
  return recipe
    ? { title: `${recipe.family} · Myko`, description: `${recipe.cuisineOrigin} — recette Myko V3 contrôlée.` }
    : {}
}

export default async function CanonicalRecipePage({ params }) {
  const recipe = await loadRecipe(params.code)
  if (!recipe?.eligible) notFound()

  const scores = Object.entries(recipe.sensory?.scores || {})
  const nutrition = recipe.nutritionPerServing

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/recipes">Recettes</Link><span>→</span><span>{recipe.code}</span>
      </nav>

      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Recette V3 contrôlée · confiance {recipe.confidence}</p>
          <h1>{recipe.family}</h1>
          <p className={styles.lede}>{recipe.cuisineOrigin} · {recipe.category}</p>
          {recipe.canonicalArbitration && <p className={styles.arbitration}>{recipe.canonicalArbitration}</p>}
        </div>
        <dl className={styles.facts}>
          <div><dt>Préparation</dt><dd>{recipe.prepMinutes} min</dd></div>
          <div><dt>Cuisson</dt><dd>{recipe.cookMinutes} min</dd></div>
          <div><dt>Portions</dt><dd>{recipe.servings}</dd></div>
          <div><dt>Difficulté</dt><dd>{recipe.difficulty}</dd></div>
        </dl>
      </header>

      <section className={styles.quality} aria-label="Qualité de la recette">
        <span>Nutrition calculée à 100 %</span>
        <span>{identityLabels[recipe.identityLevel] || recipe.identityLevel}</span>
        <span>Aucune substitution implicite</span>
      </section>

      <div className={styles.columns}>
        <section className={styles.ingredients}>
          <p className={styles.sectionLabel}>Ingrédients exacts</p>
          <h2>Pour {recipe.servings} personnes</h2>
          <ul>
            {recipe.exactIngredients.map((ingredient) => (
              <li key={`${ingredient.foodFormId}-${ingredient.role}`}>
                <span><strong>{ingredient.name}</strong><small>{ingredient.role}</small></span>
                <span>{formatQuantity(ingredient.quantity)} {ingredient.unit}{ingredient.optional ? ' · facultatif' : ''}</span>
              </li>
            ))}
          </ul>
          {recipe.allergens.length > 0 && <p className={styles.notice}><strong>Allergènes :</strong> {recipe.allergens.join(', ')}</p>}
        </section>

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
          <p className={styles.microcopy}>Calcul déterministe à partir des formes alimentaires exactes et des quantités convertibles. Pas de valeur par défaut silencieuse.</p>
        </aside>
      </div>

      <section className={styles.steps}>
        <p className={styles.sectionLabel}>Déroulé exécutable</p>
        <h2>La méthode</h2>
        <ol>
          {recipe.exactSteps.map((step, index) => (
            <li key={step.n || index}><span>{String(step.n || index + 1).padStart(2, '0')}</span><p>{step.instruction}</p></li>
          ))}
        </ol>
      </section>

      <div className={styles.columns}>
        <section className={styles.sensory}>
          <p className={styles.sectionLabel}>Profil sensoriel · {recipe.sensory?.profile}</p>
          <h2>Équilibre du plat</h2>
          <div className={styles.scoreGrid}>
            {scores.map(([key, value]) => (
              <div key={key} className={styles.score}>
                <span>{sensoryLabels[key] || key}</span>
                <i><b style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} /></i>
                <em>{value}/5</em>
              </div>
            ))}
          </div>
          <div className={styles.tags}>{(recipe.sensory?.dominant_flavors || []).map((item) => <span key={item}>{item.replaceAll('_', ' ')}</span>)}</div>
        </section>

        <aside className={styles.aside}>
          <p className={styles.sectionLabel}>Identité culinaire</p>
          <h2>À préserver</h2>
          <ul className={styles.guardrails}>
            {(recipe.sensory?.identity_guardrails || []).map((item) => <li key={item}>{item.replaceAll('_', ' ')}</li>)}
          </ul>
          {recipe.conservation && <p className={styles.notice}><strong>Conservation :</strong> {recipe.conservation}</p>}
        </aside>
      </div>

      <footer className={styles.footer}>
        <div><strong>{recipe.techniques.join(' · ')}</strong><span>{recipe.sources.length} source de données traçable</span></div>
        <Link href={`/planning?recipe=${recipe.code}`}>Intégrer au planning →</Link>
      </footer>
    </main>
  )
}
