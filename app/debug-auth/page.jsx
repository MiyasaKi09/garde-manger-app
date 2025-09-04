'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function mask(s, keep = 6) {
  if (!s) return '(absent)';
  return s.slice(0, keep) + '…';
}

export default function DebugAuthPage() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [log, setLog] = useState([]);

  function addLog(...args){
    setLog(l => [new Date().toLocaleTimeString() + ' - ' + args.join(' '), ...l].slice(0,200));
  }

  useEffect(() => {
    (async () => {
      const s = await supabase.auth.getSession();
      setSession(s.data.session);
      addLog('getSession ->', s.data.session ? 'OK' : 'NULL');

      const u = await supabase.auth.getUser();
      setUser(u.data.user || null);
      addLog('getUser ->', u.data.user ? 'OK' : 'NULL');
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      addLog(`onAuthStateChange: ${event} (session=${s ? 'OK' : 'NULL'})`);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function refresh(){
    const s = await supabase.auth.getSession();
    setSession(s.data.session);
    addLog('manual getSession ->', s.data.session ? 'OK' : 'NULL');
    const u = await supabase.auth.getUser();
    setUser(u.data.user || null);
    addLog('manual getUser ->', u.data.user ? 'OK' : 'NULL');
  }

  return (
    <div className="p-4" style={{maxWidth:800, margin:'0 auto', display:'grid', gap:12}}>
      <h1>Debug Auth</h1>

      <div className="card" style={{display:'grid', gap:6}}>
        <div>SUPABASE_URL host : <code>{process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : '(absent)'}</code></div>
        <div>ANON key (début) : <code>{mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}</code></div>
      </div>

      <div className="card" style={{display:'grid', gap:6}}>
        <div><b>Session :</b> {session ? 'présente ✅' : 'absente ❌'}</div>
        <div><b>User :</b> {user ? user.email || user.id : '—'}</div>
        <button className="btn" onClick={refresh}>Rafraîchir</button>
        <button className="btn" onClick={()=>supabase.auth.signOut()}>Se déconnecter</button>
        <a className="btn" href="/login">Aller au login</a>
      </div>

      <div className="card">
        <b>Événements :</b>
        <pre style={{whiteSpace:'pre-wrap'}}>{log.join('\n')}</pre>
      </div>
    </div>
  );
}
