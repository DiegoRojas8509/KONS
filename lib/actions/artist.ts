"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { artistProfileSchema, toArtistProfileRow, type ArtistProfileInput } from "@/lib/validations/artist"

export type ActionResult = { error: string } | { message: string }

export async function updateArtistProfile(input: ArtistProfileInput): Promise<ActionResult> {
  const parsed = artistProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." }

  // RLS + column grants only allow the owner to change these five columns.
  const { data, error } = await supabase
    .from("artists")
    .update(toArtistProfileRow(parsed.data))
    .eq("profile_id", user.id)
    .select("id")
  if (error || !data?.length) return { error: "No pudimos guardar tu perfil. Inténtalo de nuevo." }

  revalidatePath("/artista", "layout")
  return { message: "Perfil guardado." }
}
