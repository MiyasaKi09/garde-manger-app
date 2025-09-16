// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log utile en dev/preview si une var manque (n'empêche pas le build)
if (!url || !key) {
  // visible côté serveur ET client (selon où c’est importé)
  // en prod, assure-toi que les deux existent sur Vercel (Preview + Production)
  console.warn('[Supabase] Missing env vars', { hasUrl: !!url, hasAnonKey: !!key });
}

// Export d’un singleton “browser-friendly”
export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
