const { test, expect } = require('@playwright/test')

test('la connexion rend correctement et protège les recettes V3', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))

  if (process.env.VERCEL_SHARE_URL) {
    await page.goto(process.env.VERCEL_SHARE_URL)
  }
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Myko' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Mot de passe')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrer' })).toBeVisible()
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveText('')

  await page.screenshot({ path: 'test-results/myko-login-smoke.png', fullPage: true })

  await page.goto('/recipes/canonical/FR-001')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Myko' })).toBeVisible()
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})
