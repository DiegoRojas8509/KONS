import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { getSupabasePublicEnv } from "./env"

// Service-role client: bypasses RLS. Server Actions only, never import from a client component.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY. See .env.example.")
  }
  const { url } = getSupabasePublicEnv()

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
