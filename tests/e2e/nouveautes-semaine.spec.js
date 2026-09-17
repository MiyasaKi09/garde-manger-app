/**
 * nouveautes-semaine.spec.js — l'écran « Nouveautés de la semaine » (plan §5,
 * phase 5).
 *
 * CE QUE CE FICHIER ÉPROUVE, ET QUE NI VITEST NI LE SQL NE PEUVENT TENIR :
 * qu'on ATTEINT l'écran depuis l'accueil, et qu'il montre le lot. « Un lot qui
 * se voit » est le livrable ; un écran qu'on n'atteint pas ne se voit pas.
 *
 *   1. l'accueil porte la bande, avec le compte et la date du lot, et elle mène
 *      à l'onglet « Nouveautés » de la page des recettes ;
 *   2. l'onglet ne montre QUE les recettes datées — une recette sans date
 *      n'est pas une nouveauté, elle est une recette dont personne n'a noté le
 *      jour d'entrée ;
 *   3. il dit combien de recettes du catalogue ne sont pas datables, au lieu de
 *      laisser croire qu'un lot de trois est tout ce qui existe.
 *
 * LES DATES SONT CALCULÉES DEPUIS LE JOUR DE LA COURSE, pas écrites en dur :
 * une date figée ferait passer ce test au vert cette semaine et au rouge la
 * suivante, ce qui est la définition d'un test qu'on finit par ignorer.
 */

import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers/auth.js'
import { setupSupabaseMock } from './helpers/supabaseMock.js'

const JOUR = 86400000
const enJour = (instant) => new Date(instant).toISOString().slice(0, 10)

const aujourdHui = enJour(Date.now())
const lundi = (() => {
  const instant = Date.parse(`${aujourdHui}T00:00:00Z`)
  const jourDeSemaine = new Date(instant).getUTCDay()
  return enJour(instant - (jourDeSemaine === 0 ? 6 : jourDeSemaine - 1) * JOUR)
})()
const vieuxLot = enJour(Date.parse(`${aujourdHui}T00:00:00Z`) - 60 * JOUR)

const carte = (id, titre, pouredOn) => ({
  key: `canonical-${id}`,
  source: 'canonical_v3',
  id,
  title: titre,
  description: 'France · plat complet',
  image_url: null,
  prep_min: 15,
  cook_min: 20,
  servings: 2,
  rating: null,
  href: `/recipes/canonical/${id}`,
  planning_ready: false,
  variant_count: 0,
  poured_on: pouredOn,
  canonical_quality: { confidence: 'B', nutrition_coverage_pct: 100 },
  availability: null,
})

// Deux recettes versées cette semaine, une versée il y a deux mois, une sans
// date : c'est l'état réel du catalogue en miniature.
const CATALOGUE = [
  carte('JUM-900', 'Chili végétarien aux haricots noirs', lundi),
  carte('JUM-901', 'Gratin de courge aux lentilles', aujourdHui),
  carte('SRC-900', 'Blanquette de veau', vieuxLot),
  carte('FR-900', 'Bœuf bourguignon', null),
]

const RESUME_ACCUEIL = {
  aujourdHui,
  debutSemaine: lundi,
  catalogue: { total: 752, datees: 3, nonDatees: 749 },
  dernierVersement: { date: aujourdHui, compte: 1, joursDepuis: 0 },
  recettes: [],
  compte: 2,
  affichage: 'semaine',
}

test.describe('Nouveautés de la semaine', () => {
  test.beforeEach(async ({ context, page }) => {
    await mockAuthSession(context)
    await setupSupabaseMock(page, {
      tables: { inventory_lots: () => [], archetypes: () => [], canonical_foods: () => [] },
      api: {
        'GET /api/recipes/catalog': () => ({ recipes: CATALOGUE }),
        'GET /api/recipes/nouveautes': () => RESUME_ACCUEIL,
        'GET /api/today': () => ({ meals: [], tasks: [], alerts: [], shopping: { requiredCount: 0, items: [] } }),
      },
    })
  })

  test('l’accueil porte la bande, et elle mène à l’écran', async ({ page }) => {
    await page.goto('/')
    const bande = page.locator('.today-nouv')
    await expect(bande).toBeVisible()
    await expect(bande).toContainText('Nouveautés de la semaine')
    await expect(bande).toContainText('2 recettes datées')
    // La phrase dit la date, jamais seulement le compte.
    await expect(bande).toContainText('cette semaine')

    await bande.click()
    await expect(page).toHaveURL(/\/recipes\?vue=nouveautes$/)
  })

  test('l’écran ne montre que les recettes datées, et dit ce qu’il ne date pas', async ({ page }) => {
    await page.goto('/recipes?vue=nouveautes')

    // L'onglet demandé par l'accueil est bien celui qui s'ouvre.
    await expect(page.locator('.rc-flat-head .rc-t')).toContainText('Nouveautés de la semaine · 2')

    // Les deux recettes de la semaine, et elles seules : ni le lot de deux mois,
    // ni la recette sans date.
    await expect(page.getByRole('heading', { name: 'Chili végétarien aux haricots noirs' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Gratin de courge aux lentilles' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Blanquette de veau' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Bœuf bourguignon' })).toHaveCount(0)

    // Chaque carte porte SA date : un écran de nouveautés sans date laisse
    // croire que tout vient d'arriver.
    await expect(page.locator('.rc-verse').first()).toContainText('versée le')

    // Et l'encadré dit la part du catalogue qu'on ne sait pas dater.
    await expect(page.locator('.rc-nouv-cadre')).toContainText('3 recettes datées sur 4')
    await expect(page.locator('.rc-nouv-cadre')).toContainText("L'autre est entrée avant que le registre des versements n'existe")
  })

  test('sans aucune date, l’écran le dit au lieu de montrer le catalogue', async ({ page }) => {
    await setupSupabaseMock(page, {
      api: {
        'GET /api/recipes/catalog': () => ({ recipes: [carte('FR-900', 'Bœuf bourguignon', null)] }),
      },
    })
    await page.goto('/recipes?vue=nouveautes')
    await expect(page.locator('.rc-nouv-dit')).toContainText('Aucune recette du catalogue ne porte de date de versement.')
    await expect(page.getByRole('heading', { name: 'Bœuf bourguignon' })).toHaveCount(0)
  })
})
