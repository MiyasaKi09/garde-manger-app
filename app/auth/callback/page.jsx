'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function parseHashFragment(hash) {
  // "#access_token=...&refresh_token=...&...”
  const out = {};
  const s = hash.replace(/^#/, '');
  for (const part of s.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState('Initialisation…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const redirect = url.searchParams.get('redirect') || '/';

        // 1) Cas moderne: ?code=XXXX  → échange côté client
        const code = url.searchParams.get('code');
        if (code) {
          setMsg('Connexion…');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.location.replace(redirect);
          return;
        }

        // 2) Cas hash: #access_token=…&refresh_token=…
        if (window.location.hash && window.location.hash.includes('access_token')) {
          setMsg('Restauration de session…');
          const parts = parseHashFragment(window.location.hash);
          const access_token = parts['access_token'];
          const refresh_token = parts['refresh_token'];
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            window.location.replace(redirect);
            return;
          }
        }

        // Sinon, pas de jeton → retour au login
        window.location.replace('/login?e=missing_token');
      } catch (e) {
        console.error(e);
        setMsg('Erreur de connexion. Retour au login…');
        setTimeout(() => window.location.replace('/login?e=callback_error'), 800);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{maxWidth:420, width:'100%', textAlign:'center'}}>
        <h1>Connexion</h1>
        <p>{msg}</p>
      </div>
    </div>
  );
}
