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
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Anti-gaspi</span>
          <h1 className="v21-title">Restes</h1>
          <div className="v21-rule" />
          <p className="v21-lede">La gestion des restes est désormais intégrée au garde-manger.</p>
        </div>
      </header>

      <section className="v21-section flush" aria-busy="true" aria-label="Redirection en cours">
        <p className="v21-next" style={{ marginTop: 0 }}>Redirection vers le garde-manger…</p>
        <div className="v21-skel" style={{ height: 56, marginTop: 14 }} />
        <div className="v21-skel" style={{ height: 56, marginTop: 12 }} />
        <div className="v21-skel" style={{ height: 56, marginTop: 12 }} />
      </section>
    </div>
  );
}
