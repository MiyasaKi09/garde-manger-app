// middleware.js
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Protéger tout sauf ces chemins publics
export const config = {
  matcher: [
    '/((?!login|auth|_next|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|images|public).*)',
  ],
};

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Récupère la session Supabase depuis les cookies (Edge-safe)
  const { data: { session } } = await supabase.auth.getSession();

  // Allowlist d’emails (définir sur Vercel)
  const allow = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const url = req.nextUrl;

  // Si pas connecté → redirige vers /login avec redirect=…
  if (!session) {
    const loginUrl = url.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  // Si connecté mais email non autorisé → redirige vers /login
  const email = (session.user?.email || '').toLowerCase();
  if (allow.length && !allow.includes(email)) {
    const loginUrl = url.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', '/');
    return NextResponse.redirect(loginUrl);
  }

  return res;
}
