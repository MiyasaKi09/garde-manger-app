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
        const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (error) throw error;
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
      <div style={{ maxWidth: 480, width: '100%', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
        <h1>Connexion</h1>
        <p>{msg}</p>
        <div style={{ marginTop: 12 }}>
          <a href="/login" style={{ color:'#2563eb' }}>Revenir à la connexion</a>
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
