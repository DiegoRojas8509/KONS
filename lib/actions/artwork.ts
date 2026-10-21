"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { ActionResult } from "@/lib/actions/artist"
import { getCurrentArtist } from "@/lib/data/artist"
import { createClient } from "@/lib/supabase/server"
import { artworkIdSchema, artworkSchema, toArtworkRow, type ArtworkInput } from "@/lib/validations/artwork"

export async function createArtwork(input: ArtworkInput): Promise<ActionResult> {
  const parsed = artworkSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  const artist = await getCurrentArtist()
  if (!artist || artist.status !== "approved") return { error: "Tu cuenta aún no está aprobada." }

  const supabase = await createClient()
  // Starts as 'draft' (column default). RLS also checks that the gallery belongs to the artist.
  const { data, error } = await supabase
    .from("artworks")
    .insert({ ...toArtworkRow(parsed.data), artist_id: artist.id })
    .select("id")
    .single()
  if (error || !data) return { error: "No pudimos guardar la obra. Revisa los datos e inténtalo de nuevo." }

  revalidatePath("/artista/obras")
  redirect(`/artista/obras/${data.id}`)
}

export async function updateArtwork(id: string, input: ArtworkInput): Promise<ActionResult> {
  const parsedId = artworkIdSchema.safeParse(id)
  const parsed = artworkSchema.safeParse(input)
  if (!parsedId.success) return { error: "Obra no válida." }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  const supabase = await createClient()
  // Only draft/rejected works are editable (RLS enforces it too). Editing a rejected work reopens it as a draft.
  const { data, error } = await supabase
    .from("artworks")
    .update({ ...toArtworkRow(parsed.data), status: "draft" })
    .eq("id", parsedId.data)
    .in("status", ["draft", "rejected"])
    .select("id")
  if (error || !data?.length) return { error: "No pudimos guardar los cambios. Esta obra ya no se puede editar." }

  revalidatePath("/artista/obras", "layout")
  return { message: "Obra guardada." }
}
