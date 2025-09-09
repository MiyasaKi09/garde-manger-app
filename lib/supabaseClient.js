// lib/supabaseClient.js
'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Petit garde-fou pour éviter un "undefined.auth"
if (!url || !anon) {
  // On log + on exporte un proxy qui jette une erreur claire si utilisé
  console.error('Supabase env vars missing:', { url: !!url, anon: !!anon });
  export const supabase = undefined; // <- reste undefined pour repérer vite en dev
} else {
  export const supabase = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
