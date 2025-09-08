// app/auth/callback/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type'); // 'magiclink' | 'recovery'
  const redirect = url.searchParams.get('redirect') || '/';

  const supabase = createRouteHandlerClient({ cookies });

  try {
    if (code) {
      // PKCE moderne (plus fiable car ici côté serveur)
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (token_hash && type) {
      // Ancien format de magic link
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) throw error;
    } else {
      // Rien à échanger → on renvoie un message lisible à la page
      return NextResponse.redirect(
        new URL('/auth/callback?error=no_token', url.origin)
      );
    }

    // Session OK → redirige vers la cible
    return NextResponse.redirect(new URL(redirect, url.origin));
  } catch (e) {
    return NextResponse.redirect(
      new URL(
        `/auth/callback?error=${encodeURIComponent(e.message || 'unknown')}`,
        url.origin
      )
    );
  }
}
