// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Petit garde-fou utile en DEV/Preview
if (!url || !key) {
  // ça s'affichera dans la console navigateur
  console.error('[Supabase] Variables manquantes:',
    { hasUrl: !!url, hasAnonKey: !!key }
  );
}

export const supabase = createClient(url!, key!);
