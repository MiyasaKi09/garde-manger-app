import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

const PROTECTED_PREFIXES = [
  '/pantry', '/planning', '/courses', '/nutrition', '/recipes', '/garden',
  '/restes', '/produits', '/cook', '/settings',
]

function isProtectedPath(pathname) {
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) return false
  if (pathname === '/' || pathname === '/login') return false
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function middleware(request) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return response

  const { pathname } = request.nextUrl

  // Le navigateur Playwright intercepte les appels client, mais pas les appels
  // réseau effectués par le middleware. Ce garde-fou strict permet au serveur
  // E2E d'utiliser son identité factice sans contacter un domaine inexistant.
  // Il ne peut pas s'activer avec les identifiants d'un environnement réel.
  const isE2eStub = process.env.MYKO_E2E_BYPASS_AUTH === '1'
    && url === 'https://example.supabase.co'
    && key === 'stub'
  if (isE2eStub) {
    const hasStubSession = request.cookies.has('sb-example-auth-token')
    if (!hasStubSession && isProtectedPath(pathname)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = ''
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // getUser validates the session with Supabase; getSession alone only decodes cookies.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    const redirect = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}
