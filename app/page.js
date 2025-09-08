'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!cancelled) setMe(user);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'auth error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="card" style={{ padding: 24 }}>
      <h1>Bienvenue dans Myko</h1>

      {loading ? (
        <p style={{ marginTop: 8, opacity: 0.7 }}>Chargement…</p>
      ) : err ? (
        <p style={{ marginTop: 8, color: '#b91c1c' }}>{err}</p>
      ) : me ? (
        <>
          <p style={{ marginTop: 8 }}>Connecté en tant que <b>{me.email}</b>.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Link className="btn" href="/pantry">🏺 Garde-manger</Link>
            <Link className="btn" href="/recipes">📖 Recettes</Link>
            <Link className="btn" href="/garden">🌱 Potager</Link>
            <Link className="btn" href="/planning">📅 Planning</Link>
          </div>
        </>
      ) : (
        <>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Vous n’êtes pas connecté.
          </p>
          <Link className="btn" style={{ marginTop: 12 }} href="/login">Se connecter</Link>
        </>
      )}
    </div>
  );
}
