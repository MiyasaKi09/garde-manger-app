'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [redirectTo, setRedirectTo] = useState('/');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    setRedirectTo(url.searchParams.get('redirect') || '/');
  }, []);

  async function sendOtp(e){
    e.preventDefault();
    setError(''); setStatus('Envoi du code…');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) { console.error('[sendOtp]', error); setError(error.message); setStatus(''); return; }
    setSent(true);
    setStatus('Code envoyé. Consulte ta boîte mail.');
  }

  async function verify(e){
    e.preventDefault();
    setError(''); setStatus('Vérification du code…');

    // 1) Vérifie le code OTP (6 chiffres)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email', // IMPORTANT: 6-digit email OTP
    });
    if (error) {
      console.error('[verifyOtp]', error);
      setError(`Vérification impossible: ${error.message}`);
      setStatus('');
      return;
    }
    // 2) Attendre que la session soit réellement disponible
    setStatus('Connexion…');
    let tries = 0;
    while (tries < 20) { // ~2 secondes max
      const { data: sData, error: sErr } = await supabase.auth.getSession();
      if (sErr) { console.error('[getSession]', sErr); }
      if (sData?.session) {
        setStatus('Connecté ✅ redirection…');
        window.location.replace(redirectTo || '/');
        return;
      }
      await new Promise(r => setTimeout(r, 100));
      tries++;
    }
    setError('Session non initialisée après vérification. Réessaie (ou dis-moi ce message).');
    setStatus('');
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
            <button className="btn" type="button" onClick={()=>{ setSent(false); setOtp(''); setStatus(''); }}>
              Changer d’email
            </button>
          </form>
        )}

        {status && <div style={{fontSize:12, opacity:.8}}>{status}</div>}
        {error && <div style={{color:'#b91c1c'}}>{error}</div>}

        <p style={{fontSize:12, opacity:.7}}>
          Après connexion, tu restes identifié sur cet appareil (cookies persistants).
        </p>
      </div>
    </div>
  );
}
