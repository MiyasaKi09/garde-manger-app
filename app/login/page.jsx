'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [redirectTo, setRedirectTo] = useState('/');

  useEffect(() => {
    const url = new URL(window.location.href);
    setRedirectTo(url.searchParams.get('redirect') || '/');
  }, []);

  async function onSubmit(e){
    e.preventDefault();
    setError('');
    const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo }
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{maxWidth:420, width:'100%', display:'grid', gap:12}}>
        <h1>Connexion</h1>
        {sent ? (
          <p>Un lien de connexion a été envoyé à <b>{email}</b>. Ouvre-le sur cet appareil.</p>
        ) : (
          <form onSubmit={onSubmit} style={{display:'grid', gap:8}}>
            <input
              className="input"
              type="email"
              required
              placeholder="email@exemple.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
            <button className="btn primary" type="submit">Recevoir un lien</button>
            {error && <div style={{color:'#b91c1c'}}>{error}</div>}
          </form>
        )}
        <p style={{fontSize:12, opacity:.7}}>
          Après connexion, tu restes identifié sur cet appareil (cookies persistants).
        </p>
      </div>
    </div>
  );
}
