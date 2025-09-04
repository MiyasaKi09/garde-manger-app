// components/ProtectedShell.jsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export default function ProtectedShell({ children }) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  // routes publiques ? on ne bloque pas
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  const [ready, setReady] = useState(isPublic);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (isPublic) return; // pas de check pour /login & /auth/callback

    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;

      if (!mounted) return;
      setHasSession(!!session);
      setReady(true);

      if (!session) {
        const redirect = encodeURIComponent(pathname || '/');
        router.replace(`/login?redirect=${redirect}`);
      }
    })();

    // reste à l'écoute : si la session change, on met à jour
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      if (!session && !isPublic) {
        const redirect = encodeURIComponent(pathname || '/');
        router.replace(`/login?redirect=${redirect}`);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [pathname, isPublic, router]);

  // Affichage
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="card" style={{maxWidth:420}}>
          <h2>Chargement…</h2>
          <p>Vérification de la session.</p>
        </div>
      </div>
    );
  }

  if (isPublic) return children;     // /login et /auth/callback passent

  if (!hasSession) {
    // On vient de rediriger — rendu neutre pour éviter flicker
    return null;
  }

  return children;
}
