import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { homePathForRole } from "@/lib/auth/roles"
import type { Database } from "@/lib/supabase/database.types"
import { getSupabasePublicEnv } from "@/lib/supabase/env"

const AUTH_PAGES = ["/login", "/registro"]

// Refreshes the Supabase session and guards /artista and /operador by role.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, anonKey } = getSupabasePublicEnv()

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Redirects must carry the refreshed session cookies.
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  const { pathname } = request.nextUrl
  const isAuthPage = AUTH_PAGES.includes(pathname)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return isAuthPage ? response : redirectTo("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const home = homePathForRole(profile?.role)

  if (isAuthPage) return redirectTo(home)
  if (pathname.startsWith("/operador") && profile?.role !== "operator") return redirectTo(home)
  if (pathname.startsWith("/artista") && profile?.role !== "artist") return redirectTo(home)

  return response
}

export const config = {
  matcher: ["/artista/:path*", "/operador/:path*", "/login", "/registro"],
}
