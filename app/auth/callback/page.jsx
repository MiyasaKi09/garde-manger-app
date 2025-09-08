'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';

// Empêche toute tentative de pré-rendu côté serveur
export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabase(), []);
  const [state, setState] = useState({ loading: true, error: '' });

  useEffect(() => {
    async function run() {
      // Garde-fous ENV
      if (!supabase) {
        setState({
          loading: false,
          error:
            'Supabase non configuré côté client (manque NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).',
        });
        return;
      }

      // Récupérer paramètres
      const code = params.get('code'); // PKCE / magic link moderne
      const redirect = params.get('redirect') || '/';

      if (!code) {
        setState({ loading: false, error: "Aucun code trouvé dans l'URL." });
        return;
      }

      try {
        // Échange du code contre une session persistée (PKCE)
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        // ✅ Session en place : rediriger
        router.replace(redirect);
      } catch (err) {
        setState({
          loading: false,
          error:
            err?.message ||
            "Impossible d'établir la session (exchangeCodeForSession).",
        });
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, supabase]);

  if (state.loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            padding: 16,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
          }}
        >
          <h1 style={{ marginBottom: 8 }}>Restauration de session…</h1>
          <p>Merci de patienter quelques secondes.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          padding: 16,
          borderRadius: 12,
          border: '1px solid #fecaca',
          background: '#fee2e2',
          color: '#7f1d1d',
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Connexion</h1>
        <p style={{ whiteSpace: 'pre-wrap' }}>
          {state.error || "Une erreur est survenue."}
        </p>
        <div style={{ marginTop: 12 }}>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: 8,
              background: '#991b1b',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Revenir à la connexion
          </a>
        </div>
      </div>
    </main>
  );
}
