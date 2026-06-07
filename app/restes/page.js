'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirection de /restes vers /pantry?tab=waste
 * La gestion des restes est maintenant intégrée dans le garde-manger
 */
export default function RestesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pantry?tab=waste');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--surface)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔄</div>
        <h1 style={{ color: 'var(--forest-700)', marginBottom: '1rem' }}>
          Redirection en cours...
        </h1>
        <p style={{ color: 'var(--earth-600)', lineHeight: '1.6' }}>
          La gestion des restes est désormais intégrée dans le garde-manger.
          <br />
          Vous allez être redirigé automatiquement.
        </p>
      </div>
    </div>
  );
}
