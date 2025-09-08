// middleware.js (à la racine du repo, à côté de package.json)
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const PUBLIC_PATHS = [
  '/login',
  '/favicon.ico',
  '/robots.txt',
  '/manifest.json',
  '/_next',      // assets Next
  '/images',     // adapte si tu as un dossier public/images
  '/auth',       // si tu gardes d'autres routes publiques
];

const allowedEnv = process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '';
const ALLOWED = allowedEnv
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export async function middleware(req) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // laisser passer les routes publiques
  if (PUBLIC_PATHS.some(prefix => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // pas de session => login
  if (!session) {
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  const email = session.user?.email?.toLowerCase() || '';

  // whitelist stricte (si ALLOWED non vide, on applique)
  if (ALLOWED.length > 0 && !ALLOWED.includes(email)) {
    // on kill la session et on renvoie au login
    await supabase.auth.signOut();
    url.pathname = '/login';
    url.searchParams.set('error', 'not_allowed');
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    // protège tout sauf API/next assets (déjà gérés plus haut)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
