// components/AuthGate.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const allowed = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export default function AuthGate({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      const email = session.user?.email?.toLowerCase() || '';
      if (allowed.length > 0 && !allowed.includes(email)) {
        await supabase.auth.signOut();
        router.replace('/login?error=not_allowed');
        return;
      }
      setOk(true);
    })();
  }, [router]);

  if (!ok) return null;
  return children;
}
