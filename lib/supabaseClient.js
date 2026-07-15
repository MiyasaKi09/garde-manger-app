// Compatibility facade for existing client components. New code should import
// getSupabaseBrowserClient() directly from lib/supabase/browser.
import { getSupabaseBrowserClient } from './supabase/browser'
import { isSupabaseConfigured, supabaseConfigError } from './supabase/config'

export { isSupabaseConfigured, supabaseConfigError }
export const getSupabaseClient = getSupabaseBrowserClient

export const supabase = new Proxy({}, {
  get(_target, property) {
    const client = getSupabaseBrowserClient()
    const value = client[property]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
