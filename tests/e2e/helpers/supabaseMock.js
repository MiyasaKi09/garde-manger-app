/**
 * supabaseMock.js — intercept all calls to https://example.supabase.co/**
 * and to app-internal /api/** routes, returning deterministic fixture data.
 *
 * Usage:
 *   import { setupSupabaseMock } from './helpers/supabaseMock.js'
 *   await setupSupabaseMock(page, {
 *     tables: {
 *       generated_recipes: () => [FIXTURE],
 *       inventory_lots:    () => [],
 *     },
 *     api: {
 *       'POST /api/cooking-sessions': () => ({ session: DRAFT }),
 *     },
 *   })
 *
 * All tables not listed fall back to returning [] (empty PostgREST array).
 * All API routes not listed fall back to { ok: true }.
 */

import { FAKE_USER, FAKE_SESSION } from './auth.js'

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ tables?: Record<string, (url:URL) => any>, api?: Record<string, (req:import('@playwright/test').Request) => any> }} opts
 */
export async function setupSupabaseMock(page, { tables = {}, api = {} } = {}) {
  // ── 1. Supabase network (https://example.supabase.co/**) ─────────────────
  await page.route('https://example.supabase.co/**', (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname

    // Auth: getUser
    if (pathname === '/auth/v1/user') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_USER),
      })
    }

    // Auth: token refresh
    if (pathname.startsWith('/auth/v1/token')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION),
      })
    }

    // Auth: other auth endpoints
    if (pathname.startsWith('/auth/v1/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, error: null }),
      })
    }

    // REST v1: extract table name
    if (pathname.startsWith('/rest/v1/')) {
      // pathname like /rest/v1/generated_recipes or /rest/v1/rpc/func_name
      const rest = pathname.slice('/rest/v1/'.length)
      const tableName = rest.split('?')[0].split('/')[0]

      const handler = tables[tableName]
      if (handler) {
        const result = handler(url)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(result),
        })
      }

      // Default: empty array (PostgREST returns [] for unknown/empty tables)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    }

    // Anything else from supabase.co: pass through as empty OK
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: null, error: null }),
    })
  })

  // ── 2. App internal API routes (/api/**) ──────────────────────────────────
  await page.route('/api/**', (route) => {
    const req = route.request()
    const method = req.method().toUpperCase()
    const url = new URL(req.url())
    // Build a key like "POST /api/cooking-sessions" or "GET /api/planning/imports"
    const key = `${method} ${url.pathname}`

    // Try exact match, then prefix match
    const handler = api[key] ?? findPrefixHandler(api, method, url.pathname)

    if (handler) {
      const result = handler(req, url)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(result),
      })
    }

    // Default fallback: generic ok response
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

/** Find a handler whose key is a prefix of "METHOD /path". */
function findPrefixHandler(api, method, pathname) {
  for (const [key, handler] of Object.entries(api)) {
    const [km, kp] = key.split(' ')
    if (km === method && pathname.startsWith(kp)) return handler
  }
  return null
}

/**
 * Track whether a specific API route was called.
 * Returns a { called, body } object updated when the route is hit.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} method uppercase method
 * @param {string} pathnamePrefix e.g. '/api/ingredients/review'
 * @param {any} responseBody what to return
 * @returns {{ calls: Array<{ body: any }> }}
 */
export function trackApiRoute(page, method, pathnamePrefix, responseBody) {
  const tracker = { calls: [] }

  page.route(`/api/**`, (route, request) => {
    const url = new URL(request.url())
    if (request.method().toUpperCase() === method && url.pathname.startsWith(pathnamePrefix)) {
      let parsedBody = null
      try { parsedBody = JSON.parse(request.postData() || 'null') } catch { /* ignore */ }
      tracker.calls.push({ body: parsedBody })
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseBody),
      })
    }
    // Not our route — continue to next handler
    return route.fallback()
  })

  return tracker
}
