import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'

let browserClient

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, key } = getSupabaseConfig()
    browserClient = createBrowserClient(url, key)
  }
  return browserClient
}
