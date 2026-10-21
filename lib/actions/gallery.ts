"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { ActionResult } from "@/lib/actions/artist"
import { getCurrentArtist } from "@/lib/data/artist"
import { createClient } from "@/lib/supabase/server"
import { galleryIdSchema, gallerySchema, slugify, type GalleryInput } from "@/lib/validations/gallery"

const UNIQUE_VIOLATION = "23505"

export async function createGallery(input: GalleryInput): Promise<ActionResult> {
  const parsed = gallerySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  const artist = await getCurrentArtist()
  if (!artist || artist.status !== "approved") return { error: "Tu cuenta aún no está aprobada." }

  const supabase = await createClient()
  const baseSlug = slugify(parsed.data.title)

  // slug must be globally unique: on collision retry with a short random suffix.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const { error } = await supabase.from("galleries").insert({
      artist_id: artist.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      slug,
    })
    if (!error) {
      revalidatePath("/artista/galerias")
      redirect("/artista/galerias")
    }
    if (error.code !== UNIQUE_VIOLATION) return { error: "No pudimos crear la galería. Inténtalo de nuevo." }
  }
  return { error: "No pudimos generar una dirección única para la galería. Cambia el título e inténtalo de nuevo." }
}

export async function updateGallery(id: string, input: GalleryInput): Promise<ActionResult> {
  const parsedId = galleryIdSchema.safeParse(id)
  const parsed = gallerySchema.safeParse(input)
  if (!parsedId.success) return { error: "Galería no válida." }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  // RLS restricts the update to galleries of the signed-in approved artist; the slug stays stable.
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("galleries")
    .update({ title: parsed.data.title, description: parsed.data.description || null })
    .eq("id", parsedId.data)
    .select("id")
  if (error || !data?.length) return { error: "No pudimos guardar los cambios." }

  revalidatePath("/artista/galerias")
  return { message: "Galería guardada." }
}
