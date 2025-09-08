// app/login/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

const allowed = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export default function LoginPage(){
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const redirectTo = sp.get('redirect') || '/';

  useEffect(()=>{
    // Si déjà loggé, on file sur redirect
    (async()=>{
      const { data: { session } } = await supabase.auth.getSession();
      if(session){
        router.replace(redirectTo);
      }
    })();
  },[router, redirectTo]);

  async function requestCode(e){
    e.preventDefault();
    setError('');
    const em = email.trim().toLowerCase();

    // Anti-bruit : on empêche même la demande de code si email non autorisé
    if (allowed.length > 0 && !allowed.includes(em)) {
      setError("Cet email n'est pas autorisé.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: em,
      options: {
        // IMPORTANT : on ne fait pas de magic link, juste un code
        shouldCreateUser: true, // ou false si tu veux empêcher la création automatique
        emailRedirectTo: null,
      }
    });
    if(error){ setError(error.message); return; }
    setSent(true);
  }

  async function verifyCode(e){
    e.preventDefault();
    setError('');
    const em = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.verifyOtp({
      email: em,
      token,
      type: 'email' // <- le type pour OTP 6 chiffres par email
    });
    if(error){ setError(error.message); return; }

    // Double check whitelist (au cas où signup auto)
    const userEmail = data?.user?.email?.toLowerCase() || '';
    if (allowed.length > 0 && !allowed.includes(userEmail)) {
      await supabase.auth.signOut();
      setError("Cet email n'est pas autorisé.");
      return;
    }

    router.replace(redirectTo);
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card" style={{maxWidth:420, width:'100%', display:'grid', gap:12}}>
        <h1>Connexion</h1>

        {!sent ? (
          <form onSubmit={requestCode} style={{display:'grid', gap:8}}>
            <input
              className="input"
              type="email"
              required
              placeholder="email@exemple.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
            />
            <button className="btn primary" type="submit">Recevoir un code</button>
            {error && <div style={{color:'#b91c1c'}}>{error}</div>}
            <p style={{fontSize:12, opacity:.7}}>
              Seuls les emails autorisés peuvent se connecter.
            </p>
          </form>
        ) : (
          <form onSubmit={verifyCode} style={{display:'grid', gap:8}}>
            <p>Un code à 6 chiffres a été envoyé à <b>{email}</b>.</p>
            <input
              className="input"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              placeholder="Code à 6 chiffres"
              value={token}
              onChange={e=>setToken(e.target.value.replace(/\D/g,''))}
              required
            />
            <button className="btn primary" type="submit">Valider</button>
            {error && <div style={{color:'#b91c1c'}}>{error}</div>}
            <button className="btn" type="button" onClick={()=>{ setSent(false); setToken(''); }}>
              Utiliser un autre email
            </button>
          </form>
        )}

        <p style={{fontSize:12, opacity:.7}}>
          Tu resteras connecté sur cet appareil jusqu’à déconnexion.
        </p>
      </div>
    </div>
  );
}
