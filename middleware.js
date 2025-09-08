// middleware.ts
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    // Protégez tout SAUF login et auth…
    '/((?!login|auth|_next|favicon.ico|public).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allowlist emails en prod
  const allow = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '')
    .split(',')
    .map(s=>s.trim().toLowerCase())
    .filter(Boolean);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  const email = session.user?.email?.toLowerCase() || '';
  if (allow.length && !allow.includes(email)) {
    // session invalide → déconnexion et redirection vers /login
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', '/');
    // On ne peut pas signOut ici, on force le client à le faire à la prochaine nav
    return NextResponse.redirect(url);
  }

  return res;
}
