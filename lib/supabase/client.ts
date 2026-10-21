import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"
import { getSupabasePublicEnv } from "./env"

// Browser client: anon key only, always subject to RLS.
export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv()
  return createBrowserClient<Database>(url, anonKey)
}
