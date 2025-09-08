// app/login/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Force dynamic rendering so Vercel doesn't try to prerender this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Read redirect query param client-side (no useSearchParams)
  useEffect(()=>{
    try {
      const url = new URL(window.location.href);
      setRedirectTo(url.searchParams.get('redirect') || '/');
    } catch {}
  },[]);

  // If already logged in on this device, skip login
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

      if (allowed.length > 0 && !allowed.includes(em)) {
        setError("Cet email n'est pas autorisé.");
        return;
      }

      // IMPORTANT: no emailRedirectTo => Supabase sends a 6-digit OTP (not a magic link)
      const { error } = await supabase.auth.signInWithOtp({
        email: em,
        options: {
          shouldCreateUser: true, // set to false if you don't want auto signups
          // DO NOT set emailRedirectTo => we want OTP code emails
        }
      });

      if (error) {
        setError(error.message);
        return;
      }
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
        type: 'email', // 6-digit email OTP
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Safety: re-check allowlist after verify
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
