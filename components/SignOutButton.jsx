// components/SignOutButton.jsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export function SignOutButton(){
  const router = useRouter();
  return (
    <button
      className="btn"
      onClick={async ()=>{
        await supabase.auth.signOut();
        router.replace('/login');
      }}
    >
      Se déconnecter
    </button>
  );
}
