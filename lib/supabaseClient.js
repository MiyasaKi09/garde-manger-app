// lib/supabaseClient.js
'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// On déclare d'abord, puis on assigne conditionnellement
let supabase = null;

if (url && anon) {
  supabase = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // En prod, on évite de spammer la console ; en dev, on aide au
