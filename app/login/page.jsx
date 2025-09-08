// app/login/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = false;       // ✅ pas d'objet
export const fetchCache = 'force-no-store';

const allowed = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export default function LoginPage(){
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/');

  // récupérer ?redirect=… sans useSearchParams (évite soucis de prerender)
  useEffect(()=>{
    try {
      const url = new URL(window.location.href);
      setRedirectTo(url.searchParams.get('redirect') || '/');
    } catch {}
  },[]);

  // si déjà connecté, on saute le login
  useEffect(()=>{
    (async()=>{
      const { data: { session } } = await supabase.auth.getSession();
      if(session) router.replace(redirectTo);
    })();
  },[router, redirectTo]);

  async function requestCode(e){
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const em = email.trim().toLowerCase();
      if (allowed.length && !allowed.includes(em)) {
        setError("Cet email n'est pas autorisé.");
        return;
      }
      // OTP par email (6 chiffres) — pas de magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: em,
        options: { shouldCreateUser: true }
      });
      if (error) { setError(error.message); return; }
      setSent(true);
    } catch (err) {
      setError(String(err?.message || err));
    } finally { setLoading(false); }
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
        type: 'email',
      });
      if (error) { setError(error.message); return; }

      const userEmail = data?.user?.email?.toLowerCase() || '';
      if (allowed.length && !allowed.includes(userEmail)) {
        await supabase.auth.signOut();
        setError("Cet email n'est pas autorisé.");
        return;
      }
      router.replace(redirectTo);
    } catch (err) {
      setError(String(err?.message || err));
    } finally { setLoading(false); }
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
              Accès restreint (allowlist). Tu resteras connecté sur cet appareil.
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
      </div>
    </div>
  );
}
