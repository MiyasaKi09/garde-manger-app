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
  const [loading, setLoading] = useState(false);
  const redirectTo = sp.get('redirect') || '/';

  useEffect(()=>{
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
    setLoading(true);
    try {
      const em = email.trim().toLowerCase();

      // Anti-bruit : on bloque ici si email non autorisé
      if (allowed.length > 0 && !allowed.includes(em)) {
        setError("Cet email n'est pas autorisé.");
        return;
      }

      // IMPORTANT : ne PAS passer emailRedirectTo => OTP (code 6 chiffres) et PAS magic link
      const { data, error } = await supabase.auth.signInWithOtp({
        email: em,
        options: {
          shouldCreateUser: true, // mets false si tu ne veux pas créer d’utilisateur automatiquement
          // NE PAS METTRE emailRedirectTo DU TOUT
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      // même si Supabase renvoie data null/undefined, on passe à l’étape "saisie du code"
      setSent(true);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e){
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const em = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.verifyOtp({
        email: em,
        token,
        type: 'email' // OTP par email (6 chiffres)
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Double check whitelist (au cas où)
      const userEmail = data?.user?.email?.toLowerCase() || '';
      if (allowed.length > 0 && !allowed.includes(userEmail)) {
        await supabase.auth.signOut();
        setError("Cet email n'est pas autorisé.");
        return;
      }

      router.replace(redirectTo);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
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
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Recevoir un code'}
            </button>
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
              onChange={(e)=>setToken(e.target.value.replace(/\D/g,''))}
              required
            />
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Vérification…' : 'Valider'}
            </button>
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
