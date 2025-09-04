'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/** Empêche la pré-génération statique de cette page (CSR only) */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function CallbackInner() {
  const search = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState('Restauration de la session…');

  useEffect(() => {
    (async () => {
      try {
        const redirect = search.get('redirect') || '/';

        // Erreur éventuelle renvoyée par Supabase
        const urlError = search.get('error');
        const urlErrorDesc = search.get('error_description');
        if (urlError) {
          setMsg(`${urlError}: ${urlErrorDesc || ''}`);
          return;
        }

        // 1) Magic link : tokens dans le hash (#access_token=...&refresh_token=...)
        const hs = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
        const access_token = hs.get('access_token');
        const refresh_token = hs.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
          router.replace(redirect);
          return;
        }

        // 2) Fallback PKCE : ?code=...
        const code = search.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
          router.replace(redirect);
          return;
        }

        // 3) Déjà authentifié ?
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          router.replace(redirect);
          return;
        }

        setMsg('Aucun jeton trouvé dans cette URL.');
      } catch (e) {
        console.error(e);
        setMsg(e?.message || String(e));
      }
    })();
  }, [search, router]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{ maxWidth: 520 }}>
        <h2>Connexion</h2>
        <p>{msg}</p>
        <p style={{ marginTop: 8 }}>
          <a className="btn" href={`/login?redirect=${encodeURIComponent(search.get('redirect') || '/')}`}>
            Revenir à la connexion
          </a>
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center p-6">
          <div className="card" style={{ maxWidth: 520 }}>
            <h2>Connexion</h2>
            <p>Initialisation…</p>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
