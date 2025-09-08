// middleware.js (JS, pas TS)
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|login|auth/).*)', // ← laisse passer /login et /auth/*
  ],
};

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Si pas de session → redirige vers /login?redirect=<chemin>
  if (!session) {
    const url = req.nextUrl.clone();
    const path = url.pathname + (url.search || '');
    url.pathname = '/login';
    url.search = `?redirect=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return res;
}
