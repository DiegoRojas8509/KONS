import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "./database.types"
import { getSupabasePublicEnv } from "./env"

// Server client (Server Components, Server Actions, Route Handlers): acts as the signed-in user, subject to RLS.
export async function createClient() {
  const { url, anonKey } = getSupabasePublicEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component, where cookies are read-only. Session refresh happens in proxy.ts.
        }
      },
    },
  })
}
