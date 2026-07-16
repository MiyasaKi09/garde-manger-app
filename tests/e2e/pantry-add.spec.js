/**
 * pantry-add.spec.js
 *
 * Flow:
 *   /pantry renders mocked lots → open add form (FAB "+")
 *   → search (mocked canonical_foods) → select result → submit
 *   → mocked POST /api/lots/create → item appears (or toast success)
 */

import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers/auth.js'
import { setupSupabaseMock } from './helpers/supabaseMock.js'
import { LOT_ID, INVENTORY_LOT } from './helpers/fixtures.js'

// Enriched lot response returned by GET /api/pantry
// (the API route adds product_name, expiration_status and badge fields)
const PANTRY_API_RESPONSE = {
  lots: [
    {
      id: LOT_ID,
      canonical_food_id: 10,
      archetype_id: null,
      qty_remaining: 1500,
      initial_qty: 1500,
      unit: 'g',
      storage_method: 'fridge',
      storage_place: 'Frigo',
      expiration_date: '2026-08-01T00:00:00Z',
      adjusted_expiration_date: null,
      acquired_on: '2026-07-01',
      notes: null,
      is_opened: false,
      is_containerized: false,
      container_size: null,
      container_unit: null,
      // Fields added by the API route enrichment
      product_name: 'Poulet fermier',
      expiry_kind: null,
      effective_expiration: '2026-08-01T00:00:00Z',
      expiration_status: 'good',
      expiration_badge: { label: 'Frais 22 j', color: '#57a773', bgColor: '#edf7f0' },
      days_until_expiration: 22,
      grams_per_unit: null,
      density_g_per_ml: null,
      primary_unit: 'g',
    },
  ],
  stats: {
    total_products: 1,
    at_risk: 0,
    by_status: { good: 1, expiring_soon: 0, expired: 0, no_date: 0 },
    by_location: [{ name: 'Frigo', count: 1 }],
  },
}

const CANONICAL_FOOD = {
  id: 10,
  canonical_name: 'Poulet fermier',
  category_id: 3,
  subcategory_id: null,
  keywords: ['poulet', 'volaille'],
  primary_unit: 'g',
  shelf_life_days_pantry: 3,
  shelf_life_days_fridge: 4,
  shelf_life_days_freezer: 90,
}

test.describe('Pantry — ajouter un article', () => {
  test.beforeEach(async ({ context, page }) => {
    await mockAuthSession(context)

    await setupSupabaseMock(page, {
      tables: {
        // Pantry page initial load
        inventory_lots: (url) => {
          // Return an empty select=* query or the actual lot depending on state
          return [INVENTORY_LOT]
        },
        canonical_foods: (url) => {
          const params = url.searchParams
          const select = params.get('select') || ''
          // Search query from SmartAddForm
          const orFilter = params.get('or') || ''
          if (orFilter.includes('poulet') || orFilter.includes('fermier')) {
            return [CANONICAL_FOOD]
          }
          // Enrichment query (select by id list)
          if (select.includes('canonical_name')) {
            return [{ id: 10, canonical_name: 'Poulet fermier', density_g_per_ml: null, unit_weight_grams: null, shelf_life_days_pantry: 3 }]
          }
          return [CANONICAL_FOOD]
        },
        archetypes: () => [],
        reference_categories: () => [],
        reference_subcategories: () => [],
      },
      api: {
        // Pantry page calls authFetch('/api/pantry'), not Supabase directly
        'GET /api/pantry': () => PANTRY_API_RESPONSE,
      },
    })

    // POST /api/lots/create — intercept and return success
    await page.route('/api/lots/create', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            lots: [{ id: LOT_ID, qty_remaining: 1, unit: 'unités' }],
          }),
        })
      }
      return route.fallback()
    })
  })

  test('renders pantry page with mocked lots', async ({ page }) => {
    await page.goto('/pantry')

    await expect(page.getByRole('heading', { name: /garde-manger/i })).toBeVisible()
    // The mocked lot's product name should appear
    await expect(page.getByText(/poulet fermier/i)).toBeVisible()
  })

  test('opens SmartAddForm via FAB', async ({ page }) => {
    await page.goto('/pantry')
    await expect(page.getByRole('heading', { name: /garde-manger/i })).toBeVisible()

    // Click the "+" FAB button
    const fab = page.locator('.pantry-fab:not(.pantry-fab-secondary)')
    await expect(fab).toBeVisible()
    await fab.click()

    // SmartAddForm should be visible
    await expect(page.locator('.smart-add-modal')).toBeVisible()
  })

  test('searches for a product in the form', async ({ page }) => {
    await page.goto('/pantry')
    await expect(page.getByRole('heading', { name: /garde-manger/i })).toBeVisible()

    const fab = page.locator('.pantry-fab:not(.pantry-fab-secondary)')
    await fab.click()

    // Wait for the form to open.
    // Scope the search input to the modal to avoid matching the pantry page's
    // own search box (placeholder uses unicode ellipsis … vs ASCII ...).
    const modal = page.locator('.smart-add-modal')
    await expect(modal).toBeVisible()
    const searchInput = modal.locator('input.search-input')
    await expect(searchInput).toBeVisible()

    // Type a search term
    await searchInput.fill('poulet')

    // Search results should appear inside the modal
    await expect(modal.locator('.product-item').first()).toBeVisible({ timeout: 5000 })
  })

  test('selects product and submits lot form → POST /api/lots/create', async ({ page }) => {
    let createCalled = false
    let createBody = null

    // Override the route to track the call
    await page.route('/api/lots/create', (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true
        try { createBody = JSON.parse(route.request().postData() || 'null') } catch { /* ignore */ }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, lots: [{ id: LOT_ID }] }),
        })
      }
      return route.fallback()
    })

    await page.goto('/pantry')
    await expect(page.getByRole('heading', { name: /garde-manger/i })).toBeVisible()

    const fab = page.locator('.pantry-fab:not(.pantry-fab-secondary)')
    await fab.click()

    // Scope to the modal to avoid matching the pantry page's own search box
    const modal = page.locator('.smart-add-modal')
    await expect(modal).toBeVisible()
    const searchInput = modal.locator('input.search-input')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('poulet')

    // Wait for search results to appear inside the modal (300ms debounce + Supabase mock)
    const resultItem = modal.locator('.product-item').first()
    await expect(resultItem).toBeVisible({ timeout: 5000 })
    await resultItem.click()

    // Now on step 2: lot details form — the submit button is "Ajouter au stock"
    // Scope to the modal to avoid matching the FAB "Ajouter un article" which comes
    // later in the DOM and would be returned by .last() on a broad selector.
    const submitBtn = modal.getByRole('button', { name: /ajouter au stock/i })
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    // Should have called /api/lots/create
    await page.waitForResponse((r) => r.url().includes('/api/lots/create'))
    expect(createCalled).toBe(true)
    expect(createBody).not.toBeNull()
    expect(createBody.lots).toBeDefined()
    expect(createBody.lots.length).toBe(1)

    // Toast "ajouté au garde-manger" should appear
    await expect(page.getByText(/ajouté au garde-manger|ajouté|stock/i).first()).toBeVisible()
  })
})
