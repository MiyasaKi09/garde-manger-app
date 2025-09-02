// lib/supabaseServer.js
import { createClient } from '@supabase/supabase-js';

export function supabaseServer() {
  // Si tu ajoutes SUPABASE_SERVICE_ROLE_KEY dans Vercel, on l'utilise (mieux pour les updates).
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false }
  });
}
