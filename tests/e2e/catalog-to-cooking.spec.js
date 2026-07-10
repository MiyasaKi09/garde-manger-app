/**
 * catalog-to-cooking.spec.js
 *
 * Flow:
 *   /recipes (mocked catalog) → recipe card → recipe detail
 *   → click "Cuisiner" → CookingSessionSheet opens (mock POST /api/cooking-sessions)
 *   → change portions → validate (mock commit) → success banner
 *   → click Annuler (mock undo) → toast "Cuisson annulée"
 */

import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers/auth.js'
import { setupSupabaseMock } from './helpers/supabaseMock.js'
import {
  RECIPE_ID,
  SESSION_ID,
  GENERATED_RECIPE,
  DRAFT_SESSION,
} from './helpers/fixtures.js'

// Catalog-format record returned by GET /api/recipes/catalog
const CATALOG_RECIPE = {
  key: `gen-${RECIPE_ID}`,
  source: 'generated',
  id: RECIPE_ID,
  title: 'Poulet rôti aux herbes',
  description: 'Un classique.',
  image_url: null,
  prep_min: 15,
  cook_min: 60,
  servings: 4,
  rating: null,
  href: `/recipes/generated/${RECIPE_ID}`,
  needs_review: false,
  availability: {
    status: 'manque',
    missing_count: 2,
    expiring_count: 0,
    total: 2,
    available: 0,
    missing: 2,
    missingNames: ['Poulet fermier', 'Herbes de Provence'],
    urgent: 0,
    expiringName: null,
    expiringDays: null,
    percent: 0,
    mykoScore: 5,
  },
}

test.describe('Catalog → Cooking session', () => {
  test.beforeEach(async ({ context, page }) => {
    // 1. Inject fake auth cookie so middleware does NOT redirect to /login
    await mockAuthSession(context)

    // 2. Intercept all Supabase REST calls and the app's /api routes
    await setupSupabaseMock(page, {
      tables: {
        generated_recipes: () => [GENERATED_RECIPE],
        recipes: () => [],
        generated_recipe_ingredients: () => [],
        recipe_ingredients: () => [],
        inventory_lots: () => [],
        archetypes: () => [],
        canonical_foods: () => [],
        reference_categories: () => [],
        reference_subcategories: () => [],
      },
      api: {
        // Catalog endpoint — /recipes page uses authFetch, not Supabase directly
        'GET /api/recipes/catalog': () => ({ recipes: [CATALOG_RECIPE] }),
        // Nutrition goals — needed by CookingSessionSheet.loadPersons()
        'GET /api/nutrition/goals': () => ({ goals: [] }),
        // Available-ingredients for the recipe detail page
        [`GET /api/recipes/generated/${RECIPE_ID}/available-ingredients`]: () => ({
          ingredients: [],
        }),
      },
    })

    // 3. Mock POST /api/cooking-sessions → returns draft session
    await page.route('/api/cooking-sessions', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ session: DRAFT_SESSION }),
        })
      }
      return route.fallback()
    })

    // 4. Mock commit and undo
    await page.route(`/api/cooking-sessions/${SESSION_ID}/commit`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, cooked_dish_id: 'dish-001' }),
        })
      }
      return route.fallback()
    })

    await page.route(`/api/cooking-sessions/${SESSION_ID}/undo`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        })
      }
      return route.fallback()
    })
  })

  test('renders mocked catalog and shows recipe card', async ({ page }) => {
    await page.goto('/recipes')

    // Page header should appear
    await expect(page.getByRole('heading', { name: /que cuisiner/i })).toBeVisible()

    // The mocked recipe card should appear (title text)
    await expect(page.getByText('Poulet rôti aux herbes')).toBeVisible()
  })

  test('navigates to recipe detail via card link', async ({ page }) => {
    await page.goto('/recipes')

    // Wait for recipe to appear then click the link
    await page.getByText('Poulet rôti aux herbes').first().click()

    // Should be on the generated recipe detail page
    await page.waitForURL(`/recipes/generated/${RECIPE_ID}`)

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Poulet rôti aux herbes')
  })

  test('opens CookingSessionSheet and changes portions', async ({ page }) => {
    await page.goto(`/recipes/generated/${RECIPE_ID}`)

    // Wait for recipe to fully load (the cook button should appear)
    const cookBtn = page.getByRole('button', { name: /cuisiner/i })
    await expect(cookBtn).toBeVisible()
    await cookBtn.click()

    // Dialog should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Title inside the sheet
    await expect(dialog.getByText('Cuisiner')).toBeVisible()

    // Wait for the session to load (portions stepper appears when session is loaded)
    const increaseBtn = dialog.getByRole('button', { name: /augmenter les portions/i })
    await expect(increaseBtn).toBeVisible()

    // Initial value should be 4 (defaultServings from GENERATED_RECIPE.servings)
    const stepVal = dialog.locator('.css-step-val').first()
    await expect(stepVal).toHaveText('4')

    // Click + to go from 4 → 5
    await increaseBtn.click()
    await expect(stepVal).toHaveText('5')
  })

  test('commits cooking session — commit API is called and dialog closes', async ({ page }) => {
    await page.goto(`/recipes/generated/${RECIPE_ID}`)

    const cookBtn = page.getByRole('button', { name: /cuisiner/i })
    await expect(cookBtn).toBeVisible()
    await cookBtn.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Wait for the session to load and footer commit button to appear
    const commitBtn = dialog.getByRole('button', { name: /valider la cuisson/i })
    await expect(commitBtn).toBeVisible()
    await commitBtn.click()

    // The commit API must be called
    await page.waitForResponse(
      (r) =>
        r.url().includes(`/api/cooking-sessions/${SESSION_ID}/commit`) &&
        r.request().method() === 'POST',
    )

    // onCommitted() fires immediately after commit → setShowCook(false) batched
    // with setCommitted(true) by React 18 → component returns null instantly.
    // The dialog must disappear from the DOM.
    await expect(dialog).not.toBeVisible()
  })

  test('closing CookingSessionSheet without committing does not call commit', async ({ page }) => {
    let commitCalled = false

    // Override commit route to detect any spurious call
    await page.route(`/api/cooking-sessions/${SESSION_ID}/commit`, (route) => {
      if (route.request().method() === 'POST') {
        commitCalled = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        })
      }
      return route.fallback()
    })

    await page.goto(`/recipes/generated/${RECIPE_ID}`)

    const cookBtn = page.getByRole('button', { name: /cuisiner/i })
    await expect(cookBtn).toBeVisible()
    await cookBtn.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Close using the "Fermer" button (aria-label="Fermer" on the css-close-btn)
    const closeBtn = dialog.getByRole('button', { name: /^fermer$/i })
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()

    // Dialog should close
    await expect(dialog).not.toBeVisible()

    // Commit must NOT have been called
    expect(commitCalled).toBe(false)
  })
})
