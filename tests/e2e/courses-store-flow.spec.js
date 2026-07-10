/**
 * courses-store-flow.spec.js
 *
 * Flow:
 *   /courses with mocked items → click a card (checked=true, no add-to-stock call)
 *   → sticky button "Ranger mes N achats" appears
 *   → open sheet → "Tout ranger" (mock add-to-stock per item) → success states
 */

import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers/auth.js'
import { setupSupabaseMock } from './helpers/supabaseMock.js'
import {
  IMPORT_ID,
  ITEM_ID,
  LOT_ID,
  SHOPPING_ITEM,
} from './helpers/fixtures.js'

const IMPORT_FIXTURE = {
  id: IMPORT_ID,
  month_label: 'Juillet 2026',
  date_range_start: '2026-07-07',
  date_range_end: '2026-07-13',
}

test.describe('Courses — acheté → ranger', () => {
  let addToStockCalled

  test.beforeEach(async ({ context, page }) => {
    await mockAuthSession(context)

    addToStockCalled = false

    await setupSupabaseMock(page, {
      tables: {},
      api: {
        // List of imports
        'GET /api/planning/imports': () => ({
          imports: [IMPORT_FIXTURE],
        }),
        // Items for the current import
        [`GET /api/planning/imports/${IMPORT_ID}`]: () => ({
          shoppingItems: [SHOPPING_ITEM],
        }),
      },
    })

    // PATCH shopping-items/:id — checked toggle
    await page.route(`/api/courses/shopping-items/${ITEM_ID}`, (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        })
      }
      return route.fallback()
    })

    // POST add-to-stock — should NOT be called on simple checkbox click
    await page.route('/api/courses/add-to-stock', (route) => {
      if (route.request().method() === 'POST') {
        addToStockCalled = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            items: [{ id: ITEM_ID, ok: true, lot_id: LOT_ID }],
          }),
        })
      }
      return route.fallback()
    })

    // PATCH shopping-items/:id for lot_ids persistence (called by StoragePlanSheet)
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

  test('renders courses page with mocked items', async ({ page }) => {
    await page.goto('/courses')

    await expect(page.getByRole('heading', { name: /la liste/i })).toBeVisible()
    await expect(page.getByText('Poulet fermier')).toBeVisible()
  })

  test('clicking card marks it checked — no add-to-stock call', async ({ page }) => {
    await page.goto('/courses')
    await expect(page.getByText('Poulet fermier')).toBeVisible()

    // Click the card top area (triggers toggleItem)
    await page.locator('.cou-card-top').first().click()

    // Wait for the PATCH to go out (checked state updates)
    await page.waitForResponse(
      (r) => r.url().includes(`/api/courses/shopping-items/${ITEM_ID}`) && r.request().method() === 'PATCH'
    )

    // add-to-stock must NOT have been called
    expect(addToStockCalled).toBe(false)

    // The card should visually show as "done"
    await expect(page.locator('.cou-card.done')).toBeVisible()
  })

  test('sticky "Ranger mes N achats" button appears after checking', async ({ page }) => {
    await page.goto('/courses')
    await expect(page.getByText('Poulet fermier')).toBeVisible()

    await page.locator('.cou-card-top').first().click()
    await page.waitForResponse(
      (r) => r.url().includes(`/api/courses/shopping-items/${ITEM_ID}`) && r.request().method() === 'PATCH'
    )

    // The sticky ranger button should appear
    await expect(page.locator('.cou-store-btn')).toBeVisible()
  })

  test('opens StoragePlanSheet and Tout ranger calls add-to-stock', async ({ page }) => {
    await page.goto('/courses')
    await expect(page.getByText('Poulet fermier')).toBeVisible()

    // Check the card
    await page.locator('.cou-card-top').first().click()
    await page.waitForResponse(
      (r) => r.url().includes(`/api/courses/shopping-items/${ITEM_ID}`) && r.request().method() === 'PATCH'
    )

    // Open the storage sheet
    const rangerBtn = page.locator('.cou-store-btn')
    await expect(rangerBtn).toBeVisible()
    await rangerBtn.click()

    // StoragePlanSheet dialog should open
    const dialog = page.getByRole('dialog', { name: /ranger les achats/i })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Poulet fermier')).toBeVisible()

    // Click "Tout ranger"
    const toutRangerBtn = dialog.getByRole('button', { name: /tout ranger/i })
    await expect(toutRangerBtn).toBeVisible()
    await toutRangerBtn.click()

    // add-to-stock should have been called
    await page.waitForResponse((r) => r.url().includes('/api/courses/add-to-stock'))
    expect(addToStockCalled).toBe(true)

    // Phase "done": success state in sheet
    await expect(dialog.getByRole('button', { name: /terminé/i })).toBeVisible()
  })
})
