'use client';
import { supabase } from '@/lib/supabaseClient';

export function SignOutButton() {
  return (
    <button
      className="btn"
      onClick={() => supabase.auth.signOut()}
      title="Se déconnecter"
    >
      Se déconnecter
    </button>
  );
}
