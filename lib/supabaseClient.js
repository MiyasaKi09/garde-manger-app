// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
let supabaseConfigError = null;

if (!url || !key) {
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !key && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean);

  supabaseConfigError = new Error(
    `Supabase non configuré. Variables manquantes: ${missing.join(', ')}`
  );

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Supabase] Missing env vars', { hasUrl: !!url, hasAnonKey: !!key });
  }
} else {
  try {
    supabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    supabaseConfigError = err;
    console.error('[Supabase] Erreur lors de la création du client', err);
  }
}

export { supabase, supabaseConfigError };

export const isSupabaseConfigured = !!supabase;

export function getSupabaseClient() {
  if (!supabase) {
    throw supabaseConfigError ?? new Error('Supabase client indisponible');
  }
  return supabase;
}
