'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => getSupabase(), []);
  const [msg, setMsg] = useState({ loading: true, error: '' });

  useEffect(() => {
    (async () => {
      if (!supabase) {
        setMsg({
          loading: false,
          error:
            'Supabase non configuré (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).',
        });
        return;
      }

      const redirect = sp.get('redirect') || '/';

      // 1) PKCE / code flow (nouveau)
      const code = sp.get('code');

      // 2) Token-hash flow (ancien magic link)
      const token_hash = sp.get('token_hash');
      const type = sp.get('type'); // "magiclink" | "recovery" | ...

      try {
        if (code) {
          // Essaie PKCE (va chercher le code_verifier en sessionStorage)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace(redirect);
          return;
        }

        if (token_hash && type) {
          // Fallback: ancien flux magic link
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type, // 'magiclink' ou 'recovery'
          });
          if (error) throw error;
          if (!data?.session) throw new Error('Session non créée.');
          router.replace(redirect);
          return;
        }

        // Rien à échanger
        setMsg({ loading: false, error: "Aucun jeton trouvé dans cette URL." });
      } catch (e) {
        // Message détaillé
        const hint =
          'Astuce : ouvre le lien sur le même appareil et juste après avoir demandé l’e-mail. Si tu ouvres depuis Gmail dans une nouvelle fenêtre, le code_verifier peut manquer.';

        setMsg({
          loading: false,
          error: `${e?.message || e} \n\n${hint}`,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, supabase]);

  if (msg.loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div style={{ maxWidth: 520, width: '100%', padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
          <h1 style={{ marginBottom: 8 }}>Restauration de session…</h1>
          <p>Merci de patienter quelques secondes.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div style={{ maxWidth: 520, width: '100%', padding: 16, borderRadius: 12, border: '1px solid #fecaca', background: '#fee2e2', color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>
        <h1 style={{ marginBottom: 8 }}>Connexion</h1>
        <p>{msg.error || "Une erreur est survenue."}</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/login" style={{ padding: '8px 12px', borderRadius: 8, background: '#991b1b', color: '#fff', textDecoration: 'none' }}>
            Revenir à la connexion
          </a>
          <a href="/" style={{ padding: '8px 12px', borderRadius: 8, background: '#1f2937', color: '#fff', textDecoration: 'none' }}>
            Accueil
          </a>
        </div>
      </div>
    </main>
  );
}
