'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function getSupabase() {
  // lit NEXT_PUBLIC_SUPABASE_URL / ANON_KEY et configure PKCE + cookies
  return createClientComponentClient();
}
