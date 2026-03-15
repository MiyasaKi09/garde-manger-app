'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Récupérer le code depuis l'URL
        const code = new URLSearchParams(window.location.search).get('code');

        if (code) {
          // Échanger le code pour une session (utilise le même client que le reste de l'app)
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Erreur auth callback:', error);
            router.push('/login?error=auth_failed');
            return;
          }

          console.log('✅ Session créée avec succès');
        }

        // Rediriger vers la page demandée ou l'accueil
        const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
        router.push(redirect);
        router.refresh();
      } catch (error) {
        console.error('Erreur callback:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p style={{ marginTop: '1rem' }}>Connexion en cours...</p>
    </div>
  );
}
