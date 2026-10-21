"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { homePathForRole } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/server"
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth"

export type AuthActionResult = { error: string } | { message: string }

export async function signIn(input: LoginInput): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.user) {
    return { error: "Correo o contraseña incorrectos." }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()
  redirect(homePathForRole(profile?.role))
}

export async function signUp(input: RegisterInput): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  const origin = (await headers()).get("origin")
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // The on_auth_user_created trigger creates the profile (always role 'artist') and a pending artist row.
      data: {
        full_name: parsed.data.fullName,
        display_name: parsed.data.displayName || parsed.data.fullName,
      },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  })
  if (error) {
    return { error: "No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo." }
  }

  // With email confirmation enabled Supabase returns no session until the user confirms.
  if (!data.session) {
    return { message: "Te enviamos un correo para confirmar tu cuenta. Ábrelo para continuar." }
  }
  redirect(homePathForRole("artist"))
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
