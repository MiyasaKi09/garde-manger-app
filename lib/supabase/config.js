const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfigError = (!url || !key)
  ? new Error(`Supabase non configuré. Variables manquantes: ${[
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    ].filter(Boolean).join(', ')}`)
  : null

export const isSupabaseConfigured = !supabaseConfigError

export function getSupabaseConfig() {
  if (supabaseConfigError) throw supabaseConfigError
  return { url, key }
}
