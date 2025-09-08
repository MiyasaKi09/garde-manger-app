'use client';

import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const err = sp.get('error');

  if (!err) {
    // Normalement on est déjà redirigé par la route server ci-dessus.
    // Si on voit cette page sans erreur, c'est un aller-retour très rapide.
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div style={{maxWidth:520, width:'100%', padding:16, border:'1px solid #e5e7eb', borderRadius:12, background:'#fff'}}>
          <h1>Restauration de session…</h1>
          <p>Tu peux fermer cette page si rien ne se passe.</p>
        </div>
      </main>
    );
  }

  // Affichage d’erreur lisible
  const msg =
    err === 'no_token'
      ? "Aucun jeton trouvé dans l’URL. Ouvre le lien de l’e-mail sur cet appareil."
      : err;

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div style={{maxWidth:520, width:'100%', padding:16, borderRadius:12, border:'1px solid #fecaca', background:'#fee2e2', color:'#7f1d1d', whiteSpace:'pre-wrap'}}>
        <h1>Connexion</h1>
        <p style={{marginTop:8}}>{msg}</p>
        <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
          <a href="/login" style={{padding:'8px 12px', borderRadius:8, background:'#991b1b', color:'#fff', textDecoration:'none'}}>Revenir à la connexion</a>
          <a href="/" style={{padding:'8px 12px', borderRadius:8, background:'#1f2937', color:'#fff', textDecoration:'none'}}>Accueil</a>
        </div>
      </div>
    </main>
  );
}
