'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [redirectTo, setRedirectTo] = useState('/');

  useEffect(() => {
    const url = new URL(window.location.href);
    setRedirectTo(url.searchParams.get('redirect') || '/');
  }, []);

  async function sendOtp(e){
    e.preventDefault();
    setError('');
    // Envoie un OTP par email, sans redirection
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,          // crée l’utilisateur si besoin
        // pas de emailRedirectTo ici
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verify(e){
    e.preventDefault();
    setError('');
    // Vérifie le code à 6 chiffres reçu par email
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email', // 'email' = OTP à 6 chiffres
    });
    if (error) {
      setError(error.message);
      return;
    }
    // Optionnel : contrôler la session
    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session) {
      setError('Session non initialisée. Réessaie ou contacte-moi.');
      return;
    }
    // Redirection après connexion
    window.location.replace(redirectTo || '/');
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{maxWidth:420, width:'100%', display:'grid', gap:12}}>
        <h1>Connexion</h1>

        {!sent ? (
          <form onSubmit={sendOtp} style={{display:'grid', gap:8}}>
            <input
              className="input"
              type="email"
              required
              placeholder="email@exemple.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
            <button className="btn primary" type="submit">Recevoir le code</button>
          </form>
        ) : (
          <form onSubmit={verify} style={{display:'grid', gap:8}}>
            <div style={{fontSize:14, opacity:.8}}>
              Un code à 6 chiffres a été envoyé à <b>{email}</b>.
            </div>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Entrez le code"
              value={otp}
              onChange={(e)=>setOtp(e.target.value.replace(/\D/g,''))}
              required
            />
            <button className="btn primary" type="submit">Se connecter</button>
            <button className="btn" type="button" onClick={()=>{ setSent(false); setOtp(''); }}>
              Changer d’email
            </button>
          </form>
        )}

        {error && <div style={{color:'#b91c1c'}}>{error}</div>}

        <p style={{fontSize:12, opacity:.7}}>
          Après connexion, tu restes identifié sur cet appareil (cookies persistants).
        </p>
      </div>
    </div>
  );
}
