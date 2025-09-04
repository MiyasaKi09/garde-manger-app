'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState('Restauration de la session…');

  useEffect(() => {
    (async () => {
      try {
        const redirect = search.get('redirect') || '/';

        // 1) Erreur éventuelle renvoyée par Supabase (ex: otp_expired)
        const urlError = search.get('error');
        const urlErrorDesc = search.get('error_description');
        if (urlError) {
          setMsg(`${urlError}: ${urlErrorDesc || ''}`);
          return;
        }

        // 2) Cas MAGIC LINK : tokens dans le hash (#access_token=...&refresh_token=...)
        const hash = window.location.hash || '';
        const hs = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const access_token = hs.get('access_token');
        const refresh_token = hs.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) throw setErr;
          router.replace(redirect);
          return;
        }

        // 3) Cas PKCE : ?code=... (au cas où Supabase enverrait un "code")
        const code = search.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
          router.replace(redirect);
          return;
        }

        // 4) Rien trouvé
        setMsg('Aucun jeton trouvé dans cette URL.');
      } catch (e) {
        console.error(e);
        setMsg(e?.message || String(e));
      }
    })();
  }, [search, router]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{maxWidth:520}}>
        <h2>Connexion</h2>
        <p>{msg}</p>
        <p style={{marginTop:8}}>
          <a className="btn" href={`/login?redirect=${encodeURIComponent(search.get('redirect') || '/')}`}>
            Revenir à la connexion
          </a>
        </p>
      </div>
    </div>
  );
}
