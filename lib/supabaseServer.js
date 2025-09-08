// lib/supabaseServer.js
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Server-side Supabase client (App Router) SANS @supabase/ssr
 * - Utilise createServerComponentClient fourni par @supabase/auth-helpers-nextjs
 * - Compatible pour lire la session et conditionner l'UI (Connexion/Déconnexion)
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

  // Note: createServerComponentClient peut lire/écrire via cookies()
  // On lui passe explicitement les credentials pour éviter les surprises.
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore },
    { supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_ANON_KEY }
  );

  return supabase;
}

export default getServerSupabase;
