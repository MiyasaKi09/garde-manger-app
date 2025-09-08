'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoginInner() {
  const sp = useSearchParams();
  const redirectTo = sp?.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Whitelist stricte
  const ALLOWED = useMemo(
    () => ['julenglet@gmail.com', 'zoefhebert@gmail.com'],
    []
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    const eLower = (email || '').trim().toLowerCase();
    if (!ALLOWED.includes(eLower)) {
      setError("Cet email n'est pas autorisé.");
      return;
    }

    try {
      const emailRedirectTo =
        `${window.location.origin}/auth/callback?redirect=` +
        encodeURIComponent(redirectTo || '/');

      const { error } = await supabase.auth.signInWithOtp({
        email: eLower,
        options: {
          emailRedirectTo, // ← lien magique renvoie sur /auth/callback
        },
      });
      if (error) throw error;

      setSent(true);
    } catch (err) {
      setError(err?.message || 'Erreur inconnue.');
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{ maxWidth: 420, width: '100%', display: 'grid', gap: 12 }}>
        <h1>Connexion</h1>

        {sent ? (
          <p>
            Un lien de connexion a été envoyé à <b>{email}</b>.<br />
            Ouvre le lien <u>sur cet appareil</u>.
          </p>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
            <input
              className="input"
              type="email"
              required
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn primary" type="submit">Recevoir un lien</button>
            {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
            <div style={{ fontSize: 12, opacity: .7 }}>
              Emails autorisés : julenglet@gmail.com, zoefhebert@gmail.com
            </div>
          </form>
        )}

        <p style={{ fontSize: 12, opacity: .7 }}>
          Après connexion, tu restes identifié sur cet appareil (cookie persistant).
        </p>
      </div>
    </div>
  );
}

// IMPORTANT : Suspense autour de useSearchParams() pour éviter l’erreur Next
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{padding:24}}>Chargement…</div>}>
      <LoginInner />
    </Suspense>
  );
}
