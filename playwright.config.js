// playwright.config.js
// E2E config for Myko / Garde-Manger.
// Browsers path: locally PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers is set
// (symlink /opt/pw-browsers/chromium → versioned binary). In CI we run
// `npx playwright install chromium --with-deps` which uses Playwright's own
// cache, so no executablePath override is needed there.

const { defineConfig, devices } = require('@playwright/test')
const path = require('path')

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || (process.env.PLAYWRIGHT_BROWSERS_PATH
    ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
    : undefined)
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL

// Stub env passed to the dev/start server so the app doesn't hard-error on
// missing Supabase credentials. Browser traffic is intercepted by page.route()
// and middleware auth is bypassed only for this exact stub identity.
const STUB_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'stub',
  MYKO_E2E_BYPASS_AUTH: '1',
}

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,  // avoid port conflicts on the single dev server
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: remoteBaseURL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // LE SERVICE WORKER EST BLOQUÉ ICI, ET CE N'EST PAS UN CONTOURNEMENT.
    //
    // Depuis le livrable 3.7, `components/ServiceWorkerBridge.jsx` enregistre
    // `/sw.js` depuis la mise en page racine — donc sur TOUTES les pages — et
    // `public/sw.js` fait `skipWaiting()` puis `clients.claim()` : il prend la
    // main sur la page déjà ouverte, sans rechargement. Il intercepte quatre
    // lectures (`/api/pantry`, `/api/planning/imports`, `/api/courses`,
    // `/api/nutrition/goals`) et les sert réseau d'abord.
    //
    // Or `page.route()` n'intercepte PAS une requête émise PAR un service
    // worker : elle part du worker, pas de la page. Les réponses simulées de
    // `tests/e2e/helpers/supabaseMock.js` n'arrivaient donc plus, et neuf tests
    // de `/courses` et `/pantry` tombaient sur des écrans vides — ce qui s'est
    // produit en CI sur le commit cd3d069. En développement le pont
    // DÉSENREGISTRE le service worker (`NODE_ENV !== 'production'`) : la faute
    // n'apparaît qu'en CI, qui lance `npm run start`.
    //
    // Ces spécifications éprouvent l'APPLICATION sur un réseau simulé ; un
    // service worker devant ce banc ne mesure plus rien. Il est donc bloqué
    // ici, et éprouvé là où il peut l'être :
    //   — `tests/e2e/pwa-service-worker.spec.js` le rallume pour lui seul
    //     (`test.use({ serviceWorkers: 'allow' })`) et vérifie dans un vrai
    //     Chromium qu'il s'enregistre, qu'il prend la main et sur quelle portée ;
    //   — `tests/pwa/serviceWorker.test.js` (20 tests) rejoue le VRAI fichier
    //     `public/sw.js` et mesure sa stratégie réseau d'abord.
    // Aucune couverture n'est perdue ; elle change d'endroit, et l'endroit est
    // nommé.
    serviceWorkers: 'block',
    // When PLAYWRIGHT_BROWSERS_PATH is set locally, point at the pre-installed
    // symlink. In CI after `npx playwright install chromium`, leave undefined.
    launchOptions: chromiumExecutable ? { executablePath: chromiumExecutable } : {},
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: remoteBaseURL ? undefined : {
    // In CI: build happens before `npx playwright test`, then we start the
    // production server. Locally: reuse whatever is already running (or start
    // the dev server).
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      ...STUB_ENV,
    },
  },
})
