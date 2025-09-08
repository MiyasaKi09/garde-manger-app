// lib/supabaseClient.js
'use client';

import { createClient } from '@supabase/supabase-js';

let _supabase = null;

function readEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anon };
}

/**
 * Retourne une instance Supabase ou `null` si l'ENV est incomplète.
 * Ne jette JAMAIS une erreur au moment de l'import.
 */
export function getSupabase() {
  if (_supabase) return _supabase;

  const { url, anon } = readEnv();

  if (!url || !anon) {
    // Ne pas throw ici : on laisse la page afficher un message propre
    console.error(
      '[supabase] Variables manquantes : ' +
      `NEXT_PUBLIC_SUPABASE_URL=${url ? 'OK' : 'ABSENT'}, ` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon ? 'OK' : 'ABSENT'}`
    );
    return null;
  }

  _supabase = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // compatible magic link
    },
  });

  return _supabase;
}
