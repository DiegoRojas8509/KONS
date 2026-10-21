import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

// Landing point of the email-confirmation link: exchanges the code for a session.
// /artista then bounces operators to /operador via proxy.ts.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL("/artista", origin))
    }
  }
  return NextResponse.redirect(new URL("/login?error=confirmacion", origin))
}
