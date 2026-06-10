// lib/supabaseClient.js
// Client navigateur Supabase basé sur les COOKIES (auth-helpers) :
// la session est ainsi visible par le middleware et les routes serveur
// (createMiddlewareClient / createRouteHandlerClient lisent les mêmes cookies).
// Auparavant : createClient brut → session en localStorage, invisible côté
// serveur → mot de passe « qui ne marche pas » et sessions qui sautent.
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

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
} else {
  try {
    supabase = createPagesBrowserClient({
      supabaseUrl: url,
      supabaseKey: key,
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
