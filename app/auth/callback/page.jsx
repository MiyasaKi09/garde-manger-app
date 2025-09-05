'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

function CallbackInner() {
  const search = useSearchParams();
  const router = useRouter();

  const [msg, setMsg] = useState('Restauration de la session…');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  async function tryVerifyOtpWithEmail(email, token_hash, redirect) {
    // Vérification du magic link via token_hash
    const { error: vErr } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash,
      email,
    });
    if (vErr) throw vErr;
    router.replace(redirect);
  }

  useEffect(() => {
    (async () => {
      try {
        const redirect = search.get('redirect') || '/';

        // 0) Erreurs renvoyées par Supabase
        const urlError = search.get('error');
        const urlErrorDesc = search.get('error_description');
        if (urlError) {
          setMsg(`${urlError}: ${urlErrorDesc || ''}`);
          return;
        }

        // 1) Cas "hash tokens" (#access_token & #refresh_token)
        const hs = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
        const access_token = hs.get('access_token');
        const refresh_token = hs.get('refresh_token');
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
          router.replace(redirect);
          return;
        }

        // 2) Cas "token_hash" (nouveau format)
        const token_hash = search.get('token_hash');
        const type = search.get('type');
        if (token_hash && (type === 'magiclink' || type === 'recovery')) {
          // Essayer avec l'email mémorisé
          const remembered = localStorage.getItem('myko.lastEmail');
          if (remembered) {
            try {
              await tryVerifyOtpWithEmail(remembered, token_hash, redirect);
              return;
            } catch (e) {
              console.error('verifyOtp with remembered email failed:', e);
              // on tente la saisie manuelle
            }
          }
          // On n'a pas d'email : demander à l’utilisateur
          setNeedsEmail(true);
          setMsg('Confirme ton email pour terminer la connexion.');
          return;
        }

        // 3) Cas "code" (PKCE) — rarement utilisé en magic link, mais on tente si présent
        const code = search.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
          router.replace(redirect);
          return;
        }

        // 4) Déjà authentifié ?
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

  // Soumission du mini-form e-mail pour token_hash
  async function onSubmitEmail(e) {
    e.preventDefault();
    try {
      const redirect = search.get('redirect') || '/';
      const token_hash = search.get('token_hash');
      await tryVerifyOtpWithEmail(emailInput.trim(), token_hash, redirect);
    } catch (e) {
      console.error(e);
      setMsg(e?.message || String(e));
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{ maxWidth: 520 }}>
        <h2>Connexion</h2>
        <p>{msg}</p>

        {needsEmail && (
          <form onSubmit={onSubmitEmail} style={{display:'grid', gap:8, marginTop:12}}>
            <input
              className="input"
              type="email"
              required
              placeholder="email@exemple.com"
              value={emailInput}
              onChange={e=>setEmailInput(e.target.value)}
            />
            <button className="btn primary" type="submit">Continuer</button>
            <p style={{fontSize:12, opacity:.7}}>
              Cet e-mail doit être le même que celui utilisé pour demander le lien.
            </p>
          </form>
        )}

        {!needsEmail && (
          <p style={{ marginTop: 8 }}>
            <a className="btn" href={`/login?redirect=${encodeURIComponent(search.get('redirect') || '/')}`}>
              Revenir à la connexion
            </a>
          </p>
        )}
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
