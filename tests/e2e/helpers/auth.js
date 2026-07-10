/**
 * auth.js — helpers to inject a fake Supabase session into Playwright tests.
 *
 * Strategy:
 *   The middleware (middleware.js) uses createMiddlewareClient from
 *   @supabase/auth-helpers-nextjs which reads the session from the request
 *   cookie named `sb-<projectRef>-auth-token`.  For
 *   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co the project ref is
 *   "example", so the cookie name is `sb-example-auth-token`.
 *
 *   The cookie value is a JSON-serialised session object (same format as what
 *   @supabase/auth-helpers-shared stores when calling setItem).  If
 *   session.expires_at is far in the future (Unix seconds), GoTrueClient
 *   returns the session from storage WITHOUT making any network call to
 *   Supabase.  This means:
 *     • Middleware passes → no redirect to /login
 *     • Browser-side supabase.auth.getSession() returns our fake session
 *     • authFetch sends the fake access_token as Bearer; since /api routes are
 *       also intercepted via page.route(), no real auth check happens
 *
 *   supabase.auth.getUser() (called on some pages) DOES make a network call
 *   to /auth/v1/user — mock that in supabaseMock.js.
 */

// A structurally valid but fake JWT (three base64url parts).
// The payload decodes to { sub, email, role, exp:9999999999 }.
export const FAKE_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJzdHViLXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImV4cCI6OTk5OTk5OTk5OX0' +
  '.c3R1Yi1zaWduYXR1cmU'

export const FAKE_USER = {
  id: 'stub-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
}

export const FAKE_SESSION = {
  access_token: FAKE_ACCESS_TOKEN,
  token_type: 'bearer',
  expires_in: 3600,
  // Year 2286 — never expires during tests
  expires_at: 9999999999,
  refresh_token: 'stub-refresh-token',
  user: FAKE_USER,
}

/**
 * Inject the fake session cookie into the browser context so that:
 *   1. The middleware reads it and does NOT redirect to /login.
 *   2. Client-side supabase.auth.getSession() returns our fake session.
 *
 * Call this BEFORE page.goto() on any protected route.
 *
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function mockAuthSession(context) {
  await context.addCookies([
    {
      name: 'sb-example-auth-token',
      value: JSON.stringify(FAKE_SESSION),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}
