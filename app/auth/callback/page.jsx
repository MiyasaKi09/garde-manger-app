'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState('Connexion…');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const redirect = url.searchParams.get('redirect') || '/';

      if (!code) {
        setError('Aucun code trouvé dans l’URL');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('exchangeCodeForSession error:', error);
        setError(error.message);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session non créée');
        return;
      }

      setMsg('Connecté ✅ redirection…');
      setTimeout(() => window.location.replace(redirect), 500);
    })();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{maxWidth:420, width:'100%', display:'grid', gap:12}}>
        <h1>Connexion</h1>
        {error ? <p style={{color:'#b91c1c'}}>{error}</p> : <p>{msg}</p>}
      </div>
    </div>
  );
}
