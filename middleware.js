import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Routes publiques (login + callback + assets)
  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/auth/callback') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/robots.txt') ||
    path.startsWith('/sitemap.xml');

  if (!session && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (session && path === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Protège tout sauf les fichiers statiques
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
