'use client';

import { useMemo, useState } from 'react';
import { getSupabase } from '../../lib/supabaseClient';

const ALLOWED = ['julenglet@gmail.com', 'zoefhebert@gmail.com'];

export default function LoginPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!supabase) {
      setError(
        "Configuration manquante côté client : vérifie NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans Vercel."
      );
      return;
    }

    const eLower = (email || '').trim().toLowerCase();
    if (!ALLOWED.includes(eLower)) {
      setError("Cet email n'est pas autorisé.");
      return;
    }

    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email: eLower,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Erreur inconnue.');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div style={{ maxWidth: 420, width:'100%', display:'grid', gap:12, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
        <h1>Connexion</h1>

        {!supabase && (
          <div style={{ padding:10, border:'1px solid #fecaca', background:'#fee2e2', color:'#991b1b', borderRadius:8 }}>
            <b>Supabase non configuré côté client.</b><br />
            Pose les variables <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel (Project → Settings → Environment Variables), puis redeploie.
          </div>
        )}

        {sent ? (
          <p>
            Un lien de connexion a été envoyé à <b>{email}</b>.<br />
            Ouvre le lien <u>sur cet appareil</u>.
          </p>
        ) : (
          <form onSubmit={onSubmit} style={{ display:'grid', gap:8 }}>
            <input
              style={{ padding:10, border:'1px solid #d1d5db', borderRadius:8 }}
              type="email"
              required
              placeholder="email@exemple.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
            <button
              style={{ padding:10, borderRadius:8, background:'#16a34a', color:'#fff', border:0 }}
              type="submit"
              disabled={!supabase}
              title={!supabase ? 'Supabase non configuré' : ''}
            >
              Recevoir un lien
            </button>
            {error && <div style={{ color:'#b91c1c' }}>{error}</div>}
            <div style={{ fontSize:12, opacity:.7 }}>
              Emails autorisés : julenglet@gmail.com, zoefhebert@gmail.com
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
