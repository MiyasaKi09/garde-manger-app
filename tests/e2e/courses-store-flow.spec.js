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

    // Prévisualisation serveur : exactement la décision qui sera utilisée au
    // rangement. Le panneau ne possède plus de guess local indépendant.
    await page.route('/api/courses/storage-plan', async (route) => {
      const body = route.request().postDataJSON()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          decisions: body.items.map(item => ({
            id: item.id,
            decision: {
              valid: true,
              method: 'fridge',
              place: 'Frigo',
              shelfLifeDays: 2,
              expirationDate: '2026-07-15',
              expiryKind: 'estimate',
              storageSource: 'food_safety_rule',
              expirationSource: 'canonical_catalog',
              confidence: 0.98,
              policyVersion: 'storage-v1-2026-07-13',
              requiresConfirmation: false,
              needsReview: false,
              forbiddenMethods: ['pantry'],
              reason: 'Volaille fraîche : conservation au réfrigérateur',
            },
          })),
        }),
      })
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

  // DEPUIS LE LIVRABLE 3.5, CHAQUE ARTICLE EST ÉCRIT DEUX FOIS DANS LE DOCUMENT.
  // `app/courses/page.js` pose en permanence un second rendu de la liste,
  // `.cou-print-doc`, que `app/courses/courses.css` masque à l'écran
  // (`display: none`) et révèle à l'impression. C'est la sortie « impression /
  // PDF » de P17, et elle n'est pas un artefact de test : elle doit être dans
  // le document pour que la boîte d'impression du navigateur la trouve.
  //
  // `getByText` résout AUSSI les éléments masqués — la visibilité n'est
  // éprouvée qu'APRÈS, sur ce qui a été résolu. Un `getByText('Poulet
  // fermier')` nu tombe donc sur « strict mode violation : 2 elements », ce qui
  // s'est produit en CI sur cd3d069. On nomme désormais le rendu qu'on vise :
  // l'écran, `.cou-card-nm`. Le rendu d'impression est éprouvé à part, ci-dessous
  // et par tests/courses/exportListe.test.js.
  const articleAEcran = (page, nom) => page.locator('.cou-card-nm', { hasText: nom })

  test('renders courses page with mocked items', async ({ page }) => {
    await page.goto('/courses')

    await expect(page.getByRole('heading', { name: /la liste/i })).toBeVisible()
    await expect(articleAEcran(page, 'Poulet fermier')).toBeVisible()

    // Le second rendu existe, et il est MASQUÉ À L'ÉCRAN. Les deux moitiés
    // comptent : présent mais visible, il doublerait la liste sous les yeux du
    // foyer ; absent, l'impression sortirait une page vide. `display: none`
    // le retire aussi de l'arbre d'accessibilité, donc aucun lecteur d'écran
    // ne lit la liste deux fois.
    const copieImprimable = page.locator('.cou-print-nom', { hasText: 'Poulet fermier' })
    await expect(copieImprimable).toHaveCount(1)
    await expect(copieImprimable).toBeHidden()
  })

  test('clicking card marks it checked — no add-to-stock call', async ({ page }) => {
    await page.goto('/courses')
    await expect(articleAEcran(page, 'Poulet fermier')).toBeVisible()

    // Armer l'attente AVANT le clic (réponse mockée instantanée — flaky sinon)
    const patchDone = page.waitForResponse(
      (r) => r.url().includes(`/api/courses/shopping-items/${ITEM_ID}`) && r.request().method() === 'PATCH'
    )
    // Click the card top area (triggers toggleItem)
    await page.locator('.cou-card-top').first().click()
    await patchDone

    // add-to-stock must NOT have been called
    expect(addToStockCalled).toBe(false)

    // The card should visually show as "done"
    await expect(page.locator('.cou-card.done')).toBeVisible()
  })

  test('sticky "Ranger mes N achats" button appears after checking', async ({ page }) => {
    await page.goto('/courses')
    await expect(articleAEcran(page, 'Poulet fermier')).toBeVisible()

    // Armer l'attente AVANT le clic : la réponse mockée part instantanément
    // et serait ratée si waitForResponse était appelé après (flaky en CI).
    const patchDone = page.waitForResponse(
      (r) => r.url().includes(`/api/courses/shopping-items/${ITEM_ID}`) && r.request().method() === 'PATCH'
    )
    await page.locator('.cou-card-top').first().click()
    await patchDone

    // The sticky ranger button should appear
    await expect(page.locator('.cou-store-btn')).toBeVisible()
  })

  test('opens StoragePlanSheet and Tout ranger calls add-to-stock', async ({ page }) => {
    await page.goto('/courses')
    await expect(articleAEcran(page, 'Poulet fermier')).toBeVisible()

    // Check the card
    // Armer l'attente AVANT le clic : la réponse mockée part instantanément
    // et serait ratée si waitForResponse était appelé après (flaky en CI).
    const patchDone = page.waitForResponse(
      (r) => r.url().includes(`/api/courses/shopping-items/${ITEM_ID}`) && r.request().method() === 'PATCH'
    )
    await page.locator('.cou-card-top').first().click()
    await patchDone

    // Open the storage sheet
    const rangerBtn = page.locator('.cou-store-btn')
    await expect(rangerBtn).toBeVisible()
    await rangerBtn.click()

    // StoragePlanSheet dialog should open
    const dialog = page.getByRole('dialog', { name: /ranger les achats/i })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Poulet fermier')).toBeVisible()
    await expect(dialog.getByText('Frigo')).toBeVisible()
    await expect(dialog.getByText(/15 juil/i)).toBeVisible()

    // Click "Tout ranger"
    // Même précaution que pour le PATCH plus haut, et pour la même raison :
    // la route est mockée, sa réponse part dans le même tick que le clic. Armée
    // après, l'attente pouvait la manquer et expirer au bout de 30 s — ce
    // qu'elle a fini par faire en CI, jamais en local.
    const toutRangerBtn = dialog.getByRole('button', { name: /tout ranger/i })
    await expect(toutRangerBtn).toBeVisible()
    const addToStockDone = page.waitForResponse((r) => r.url().includes('/api/courses/add-to-stock'))
    await toutRangerBtn.click()

    // add-to-stock should have been called
    await addToStockDone
    expect(addToStockCalled).toBe(true)

    // Phase "done": success state in sheet
    await expect(dialog.getByRole('button', { name: /terminé/i })).toBeVisible()
  })
})
