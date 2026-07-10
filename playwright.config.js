// playwright.config.js
// E2E config for Myko / Garde-Manger.
// Browsers path: locally PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers is set
// (symlink /opt/pw-browsers/chromium → versioned binary). In CI we run
// `npx playwright install chromium --with-deps` which uses Playwright's own
// cache, so no executablePath override is needed there.

const { defineConfig, devices } = require('@playwright/test')
const path = require('path')

// Stub env passed to the dev/start server so the app doesn't hard-error on
// missing Supabase credentials. All actual Supabase network traffic is
// intercepted by page.route() inside each test — no real Supabase is needed.
const STUB_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'stub',
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
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // When PLAYWRIGHT_BROWSERS_PATH is set locally, point at the pre-installed
    // symlink. In CI after `npx playwright install chromium`, leave undefined.
    launchOptions: process.env.PLAYWRIGHT_BROWSERS_PATH
      ? { executablePath: path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium') }
      : {},
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
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
