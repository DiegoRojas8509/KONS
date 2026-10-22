"use server"

import { revalidatePath } from "next/cache"

import type { ActionResult } from "@/lib/actions/artist"
import { getCurrentArtist } from "@/lib/data/artist"
import { createClient } from "@/lib/supabase/server"
import {
  artworkIdSchema,
  artworkSchema,
  getSubmissionProblems,
  toArtworkRow,
  type ArtworkInput,
} from "@/lib/validations/artwork"

export async function createArtwork(input: ArtworkInput): Promise<{ error: string } | { id: string }> {
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
  return { id: data.id }
}

export async function submitArtworkForReview(id: string): Promise<ActionResult> {
  const parsedId = artworkIdSchema.safeParse(id)
  if (!parsedId.success) return { error: "Obra no válida." }

  const artist = await getCurrentArtist()
  if (!artist || artist.status !== "approved") return { error: "Tu cuenta aún no está aprobada." }

  const supabase = await createClient()
  const { data: artwork } = await supabase
    .from("artworks")
    .select("id, title, width_cm, height_cm, monthly_rent, status")
    .eq("id", parsedId.data)
    .eq("artist_id", artist.id)
    .in("status", ["draft", "rejected"])
    .maybeSingle()
  if (!artwork) return { error: "Esta obra ya no se puede enviar a revisión." }

  const { data: images } = await supabase.from("artwork_images").select("is_primary").eq("artwork_id", artwork.id)
  const problems = getSubmissionProblems(artwork, images ?? [])
  if (problems.length > 0) return { error: problems.join(" ") }

  // Locks the work for editing until the operator resolves it (RLS: artists can only move it to draft/pending_review/retired).
  const { data, error } = await supabase
    .from("artworks")
    .update({ status: "pending_review" })
    .eq("id", artwork.id)
    .in("status", ["draft", "rejected"])
    .select("id")
  if (error || !data?.length) return { error: "No pudimos enviar la obra a revisión. Inténtalo de nuevo." }

  revalidatePath("/artista/obras", "layout")
  return { message: "Obra enviada a revisión." }
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
