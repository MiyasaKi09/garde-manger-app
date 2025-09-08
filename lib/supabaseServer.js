// lib/supabaseServer.js
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Server-side Supabase client (App Router)
 * - Aucune syntaxe TypeScript
 * - Pas de non-null assertion "!"
 * - set/remove en no-op côté Server Component (lecture seule des cookies)
 */
export function getServerSupabase() {
  const cookieStore = cookies();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Env manquantes: NEXT_PUBLIC_SUPABASE_URL et/ou NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      // En Server Component, on peut lire mais pas écrire
      get(name) {
        return cookieStore.get(name)?.value;
      },
      // no-op pour éviter les erreurs quand SSR n’autorise pas l’écriture
      set(name, value, options) {
        try {
          // Sur les Route Handlers/middleware on peut écrire,
          // mais ici on est possiblement en lecture seule.
          cookieStore.set?.({ name, value, ...options });
        } catch {
          /* ignore */
        }
      },
      remove(name, options) {
        try {
          cookieStore.set?.({ name, value: '', ...options });
        } catch {
          /* ignore */
        }
      },
    },
  });
}

export default getServerSupabase;
