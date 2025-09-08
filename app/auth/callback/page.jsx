'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function CallbackInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const redirect = sp?.get('redirect') || '/';
  const [msg, setMsg] = useState('Restauration de session…');

  useEffect(() => {
    (async () => {
      try {
        // Le lien magique Supabase renvoie des fragments/params.
        // Cette méthode parse l’URL et enregistre la session.
        const { data, error } = await supabase.auth.getSessionFromUrl({
          // default: true -> clear hash automatiquement
          storeSession: true,
        });
        if (error) throw error;

        // ✅ session active → redirige
        setMsg('Connecté. Redirection…');
        router.replace(redirect || '/');
      } catch (err) {
        console.error('getSessionFromUrl error', err);
        setMsg("Aucun code trouvé dans l'URL.");
      }
    })();
  }, [router, redirect]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{ maxWidth: 480, width: '100%' }}>
        <h1>Connexion</h1>
        <p>{msg}</p>
        <div style={{ marginTop: 12 }}>
          <a className="btn" href="/login">Revenir à la connexion</a>
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div style={{padding:24}}>Chargement…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
