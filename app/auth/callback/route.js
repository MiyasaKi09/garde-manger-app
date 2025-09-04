// /app/auth/callback/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(req) {
  const reqUrl = new URL(req.url);
  const code = reqUrl.searchParams.get('code');                // PKCE code
  const accessToken = reqUrl.searchParams.get('access_token'); // hash-based flow
  const refreshToken = reqUrl.searchParams.get('refresh_token');
  const error = reqUrl.searchParams.get('error');
  const errorDesc = reqUrl.searchParams.get('error_description');
  const redirect = reqUrl.searchParams.get('redirect') || '/';

  // Afficher une erreur explicite si fournie par Supabase (ex: otp_expired)
  if (error) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;padding:24px">
        <h2>Connexion</h2>
        <p style="color:#b91c1c;">${error}: ${errorDesc || ''}</p>
        <p><a href="/login?redirect=${encodeURIComponent(redirect)}">Revenir à la connexion</a></p>
      </body></html>`,
      { status: 400, headers: { 'content-type': 'text/html' } }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    if (code) {
      // 1) Cas PKCE (query param ?code=...)
      const { error: exchError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchError) throw exchError;
    } else if (accessToken && refreshToken) {
      // 2) Cas hash-based (access_token & refresh_token)
      const { error: setError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setError) throw setError;
    } else {
      // Aucun jeton / code → message clair
      return new NextResponse(
        `<html><body style="font-family:system-ui;padding:24px">
          <h2>Connexion</h2>
          <p>Aucun code trouvé dans l’URL.</p>
          <p><a href="/login?redirect=${encodeURIComponent(redirect)}">Revenir à la connexion</a></p>
        </body></html>`,
        { status: 400, headers: { 'content-type': 'text/html' } }
      );
    }

    // OK → redirige sur la page demandée
    return NextResponse.redirect(new URL(redirect, reqUrl.origin));
  } catch (e) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;padding:24px">
        <h2>Connexion</h2>
        <p style="color:#b91c1c;">${e?.message || e}</p>
        <p><a href="/login?redirect=${encodeURIComponent(redirect)}">Revenir à la connexion</a></p>
      </body></html>`,
      { status: 400, headers: { 'content-type': 'text/html' } }
    );
  }
}
