'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function parseHashFragment(hash) {
  const out = {};
  const s = (hash || '').replace(/^#/, '');
  if (!s) return out;
  for (const part of s.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState('Connexion…');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const redirect = url.searchParams.get('redirect') || '/';

      try {
        // 1) Nouveau format: ?code=XXXX
        const code = url.searchParams.get('code');
        if (code) {
          setMsg('Échange du code…');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw new Error(`exchangeCodeForSession: ${error.message}`);
        } else if (window.location.hash.includes('access_token')) {
          // 2) Ancien format: #access_token=…&refresh_token=…
          setMsg('Restauration de la session…');
          const h = parseHashFragment(window.location.hash);
          const { error } = await supabase.auth.setSession({
            access_token: h.access_token,
            refresh_token: h.refresh_token,
          });
          if (error) throw new Error(`setSession: ${error.message}`);
        } else {
          throw new Error('Aucun jeton trouvé dans l’URL (ni code, ni access_token).');
        }

        // Vérif de session effective
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Session non créée après échange des jetons.');

        setMsg('Connecté ✅ redirection…');
        setTimeout(() => window.location.replace(redirect), 300);
      } catch (e) {
        console.error('[auth/callback] error:', e);
        setMsg('Échec de la connexion ❌');
        setDetail(String(e?.message || e));
        // Option: proposer un bouton pour retourner au /login
      }
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{maxWidth:520, width:'100%', display:'grid', gap:10}}>
        <h1>Connexion</h1>
        <p>{msg}</p>
        {detail && (
          <pre style={{whiteSpace:'pre-wrap', background:'#f6f6f6', padding:8, borderRadius:6}}>
            {detail}
          </pre>
        )}
        <div>
          <a className="btn" href="/login">Retour au login</a>
        </div>
      </div>
    </div>
  );
}
