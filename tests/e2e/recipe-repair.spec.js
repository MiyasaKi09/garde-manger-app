/**
 * recipe-repair.spec.js
 *
 * Two sub-flows:
 *   1. /recipes catalog shows a needs_review recipe (its card appears normally)
 *   2. /courses: banner "X à confirmer" → click → IngredientReviewPanel opens
 *      → Confirmer button → POST /api/ingredients/review asserted
 */

import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers/auth.js'
import { setupSupabaseMock } from './helpers/supabaseMock.js'
import {
  RECIPE_ID,
  IMPORT_ID,
  ITEM_ID,
  GENERATED_RECIPE,
  SHOPPING_ITEM,
  SHOPPING_ITEM_PENDING,
  REVIEW_DATA,
} from './helpers/fixtures.js'

// Catalog-format record for the "Recipe catalog" sub-test
// The /recipes page calls GET /api/recipes/catalog (not Supabase directly)
const NEEDS_REVIEW_CATALOG_RECIPE = {
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
  needs_review: true,
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

const IMPORT_FIXTURE = {
  id: IMPORT_ID,
  month_label: 'Juillet 2026',
  date_range_start: '2026-07-07',
  date_range_end: '2026-07-13',
}

// GENERATED_RECIPE already has status:'needs_review'
const NEEDS_REVIEW_RECIPE = {
  ...GENERATED_RECIPE,
  id: RECIPE_ID,
  status: 'needs_review',
}

test.describe('Recipe repair — needs_review + review panel', () => {
  // ── Part 1: catalog shows needs_review recipe ────────────────────────────────
  test.describe('Recipe catalog', () => {
    test.beforeEach(async ({ context, page }) => {
      await mockAuthSession(context)

      await setupSupabaseMock(page, {
        tables: {
          generated_recipes: () => [NEEDS_REVIEW_RECIPE],
          recipes: () => [],
          generated_recipe_ingredients: () => [],
          recipe_ingredients: () => [],
          inventory_lots: () => [],
          archetypes: () => [],
          canonical_foods: () => [],
        },
        api: {
          // /recipes page calls authFetch('/api/recipes/catalog'), not Supabase directly
          'GET /api/recipes/catalog': () => ({ recipes: [NEEDS_REVIEW_CATALOG_RECIPE] }),
        },
      })
    })

    test('needs_review recipe appears in catalog', async ({ page }) => {
      await page.goto('/recipes')

      await expect(page.getByRole('heading', { name: /que cuisiner/i })).toBeVisible()

      // The recipe card should be visible regardless of status
      await expect(page.getByText('Poulet rôti aux herbes')).toBeVisible()

      // It should be a link (recipe card is an <a>)
      await expect(page.getByRole('link', { name: /poulet rôti aux herbes/i })).toBeVisible()
    })
  })

  // ── Part 2: courses review panel ────────────────────────────────────────────
  test.describe('Courses — review panel', () => {
    let reviewPostCalls

    test.beforeEach(async ({ context, page }) => {
      await mockAuthSession(context)

      reviewPostCalls = []

      await setupSupabaseMock(page, {
        tables: {},
        api: {
          'GET /api/planning/imports': () => ({ imports: [IMPORT_FIXTURE] }),
          [`GET /api/planning/imports/${IMPORT_ID}`]: () => ({
            shoppingItems: [SHOPPING_ITEM, SHOPPING_ITEM_PENDING],
          }),
          // Resolve-pending: no-op
          'POST /api/ingredients/resolve-pending': () => ({ ok: true }),
        },
      })

      // GET /api/ingredients/review → returns items for the review panel
      await page.route('/api/ingredients/review', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(REVIEW_DATA),
          })
        }
        // POST: track calls
        if (route.request().method() === 'POST') {
          let body = null
          try { body = JSON.parse(route.request().postData() || 'null') } catch { /* ignore */ }
          reviewPostCalls.push(body)
          // After confirm, return empty lists (all cleared)
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true }),
          })
        }
        return route.fallback()
      })

      // Shopping item PATCH (toggle check)
      await page.route(`/api/courses/shopping-items/**`, (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true }),
          })
        }
        return route.fallback()
      })
    })

    test('shows banner "à confirmer" when items have pending review_status', async ({ page }) => {
      await page.goto('/courses')

      await expect(page.getByRole('heading', { name: /la liste/i })).toBeVisible()

      // Banner with "à confirmer" should appear
      // (resolutionSummary.toConfirm > 0 because SHOPPING_ITEM_PENDING has review_status:'pending')
      await expect(page.getByText(/à confirmer/i)).toBeVisible()
    })

    test('clicking banner opens IngredientReviewPanel', async ({ page }) => {
      await page.goto('/courses')

      await expect(page.getByRole('heading', { name: /la liste/i })).toBeVisible()

      // Click the resolution banner button
      const banner = page.getByRole('button', { name: /à confirmer/i })
      await expect(banner).toBeVisible()
      await banner.click()

      // Panel dialog should open
      const panel = page.getByRole('dialog', { name: /aliments à confirmer/i })
      await expect(panel).toBeVisible()

      // Should show the pending item (from REVIEW_DATA)
      await expect(panel.getByText('Coriandre fraîche')).toBeVisible()
    })

    test('clicking Confirmer POSTs to /api/ingredients/review', async ({ page }) => {
      await page.goto('/courses')

      await expect(page.getByRole('heading', { name: /la liste/i })).toBeVisible()

      const banner = page.getByRole('button', { name: /à confirmer/i })
      await banner.click()

      const panel = page.getByRole('dialog', { name: /aliments à confirmer/i })
      await expect(panel).toBeVisible()

      // Click "Confirmer" for the pending item
      const confirmBtn = panel.getByRole('button', { name: /confirmer/i }).first()
      await expect(confirmBtn).toBeVisible()
      await confirmBtn.click()

      // Wait for the POST to complete
      await page.waitForResponse((r) => r.url().includes('/api/ingredients/review') && r.request().method() === 'POST')

      // Assert the POST body
      expect(reviewPostCalls.length).toBeGreaterThan(0)
      const lastCall = reviewPostCalls[reviewPostCalls.length - 1]
      expect(lastCall).toMatchObject({
        action: 'confirm',
        target: 'shopping_item',
      })
    })
  })
})
