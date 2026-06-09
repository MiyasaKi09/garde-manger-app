// middleware.js (JS, pas TS)
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (processus d'authentification magiclink)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// Pages nécessitant une session utilisateur (préfixes de chemin)
const PROTECTED_PREFIXES = [
  '/pantry',
  '/planning',
  '/courses',
  '/nutrition',
  '/recipes',
  '/garden',
  '/restes',
  '/produits',
  '/cook',
  '/settings',
];

function isProtectedPath(pathname) {
  // Jamais de redirection pour les API (elles gèrent leur propre auth et
  // doivent renvoyer du JSON, pas une redirection HTML) ni pour /auth/*.
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) return false;
  if (pathname === '/' || pathname === '/login') return false;

  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Rafraîchir la session (important pour que auth.uid() fonctionne)
  const { data: { session } } = await supabase.auth.getSession();

  // Protection des pages : rediriger vers /login si pas de session
  const { pathname } = req.nextUrl;
  if (!session && isProtectedPath(pathname)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return res;
}
