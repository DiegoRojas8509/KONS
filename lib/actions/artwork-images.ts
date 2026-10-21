"use server"

import { revalidatePath } from "next/cache"

import { getCurrentArtist } from "@/lib/data/artist"
import { createClient } from "@/lib/supabase/server"
import {
  MAX_IMAGES_PER_ARTWORK,
  imageRefSchema,
  isOwnedImagePath,
  registerImagesSchema,
  reorderSchema,
  storagePathFor,
  uploadRequestSchema,
  type AllowedImageType,
} from "@/lib/validations/artwork-images"

const BUCKET = "artworks"

export type UploadTicket = { path: string; token: string }
type Failure = { error: string }

// Loads the artwork only if it belongs to the signed-in approved artist and can still be edited.
async function loadEditableArtwork(artworkId: string) {
  const artist = await getCurrentArtist()
  if (!artist || artist.status !== "approved") return null
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select("id")
    .eq("id", artworkId)
    .eq("artist_id", artist.id)
    .in("status", ["draft", "rejected"])
    .maybeSingle()
  return data ? { artist, supabase } : null
}

// Step 1: validate and hand out signed upload tokens. The file bytes then go straight to Storage (too big for a server action).
export async function prepareImageUploads(input: {
  artworkId: string
  files: { type: string; size: number }[]
}): Promise<{ tickets: UploadTicket[] } | Failure> {
  const parsed = uploadRequestSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Archivos no válidos." }

  const ctx = await loadEditableArtwork(parsed.data.artworkId)
  if (!ctx) return { error: "Esta obra ya no se puede editar." }

  const { count } = await ctx.supabase
    .from("artwork_images")
    .select("id", { count: "exact", head: true })
    .eq("artwork_id", parsed.data.artworkId)
  if ((count ?? 0) + parsed.data.files.length > MAX_IMAGES_PER_ARTWORK) {
    return { error: `Máximo ${MAX_IMAGES_PER_ARTWORK} imágenes por obra.` }
  }

  const tickets: UploadTicket[] = []
  for (const file of parsed.data.files) {
    const path = storagePathFor(ctx.artist.id, parsed.data.artworkId, file.type as AllowedImageType)
    const { data, error } = await ctx.supabase.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) return { error: "No pudimos preparar la carga. Inténtalo de nuevo." }
    tickets.push({ path, token: data.token })
  }
  return { tickets }
}

// Step 2: after the browser uploaded the files, record them. The first image ever added becomes the primary one.
export async function registerArtworkImages(input: { artworkId: string; paths: string[] }): Promise<{ ok: true } | Failure> {
  const parsed = registerImagesSchema.safeParse(input)
  if (!parsed.success) return { error: "Datos no válidos." }

  const ctx = await loadEditableArtwork(parsed.data.artworkId)
  if (!ctx) return { error: "Esta obra ya no se puede editar." }
  const paths = [...new Set(parsed.data.paths)]
  if (!paths.every((p) => isOwnedImagePath(p, ctx.artist.id, parsed.data.artworkId))) {
    return { error: "Ruta de imagen no válida." }
  }

  const { data: existing } = await ctx.supabase
    .from("artwork_images")
    .select("position, is_primary, storage_path")
    .eq("artwork_id", parsed.data.artworkId)
  if (paths.some((p) => (existing ?? []).some((i) => i.storage_path === p))) return { error: "Esa imagen ya está registrada." }
  if ((existing?.length ?? 0) + paths.length > MAX_IMAGES_PER_ARTWORK) {
    return { error: `Máximo ${MAX_IMAGES_PER_ARTWORK} imágenes por obra.` }
  }

  // The browser uploads straight to Storage: make sure every file really arrived before recording it.
  const folder = `${ctx.artist.id}/${parsed.data.artworkId}`
  const { data: objects } = await ctx.supabase.storage.from(BUCKET).list(folder, { limit: 100 })
  const uploaded = new Set((objects ?? []).map((o) => `${folder}/${o.name}`))
  if (!paths.every((p) => uploaded.has(p))) return { error: "No encontramos alguna de las imágenes subidas. Inténtalo de nuevo." }
  const nextPosition = (existing ?? []).reduce((max, i) => Math.max(max, i.position + 1), 0)
  const hasPrimary = (existing ?? []).some((i) => i.is_primary)

  const { error } = await ctx.supabase.from("artwork_images").insert(
    paths.map((storage_path, i) => ({
      artwork_id: parsed.data.artworkId,
      storage_path,
      position: nextPosition + i,
      is_primary: !hasPrimary && i === 0,
    })),
  )
  if (error) return { error: "No pudimos guardar las imágenes." }

  revalidatePath(`/artista/obras/${parsed.data.artworkId}`)
  return { ok: true }
}

export async function setPrimaryImage(input: { artworkId: string; imageId: string }): Promise<{ ok: true } | Failure> {
  const parsed = imageRefSchema.safeParse(input)
  if (!parsed.success) return { error: "Datos no válidos." }
  const ctx = await loadEditableArtwork(parsed.data.artworkId)
  if (!ctx) return { error: "Esta obra ya no se puede editar." }

  const { error } = await ctx.supabase.rpc("set_primary_artwork_image", {
    p_artwork_id: parsed.data.artworkId,
    p_image_id: parsed.data.imageId,
  })
  if (error) return { error: "No pudimos cambiar la imagen principal." }

  revalidatePath(`/artista/obras/${parsed.data.artworkId}`)
  return { ok: true }
}

export async function reorderArtworkImages(input: { artworkId: string; orderedIds: string[] }): Promise<{ ok: true } | Failure> {
  const parsed = reorderSchema.safeParse(input)
  if (!parsed.success) return { error: "Datos no válidos." }
  const ctx = await loadEditableArtwork(parsed.data.artworkId)
  if (!ctx) return { error: "Esta obra ya no se puede editar." }

  const results = await Promise.all(
    parsed.data.orderedIds.map((id, position) =>
      ctx.supabase.from("artwork_images").update({ position }).eq("id", id).eq("artwork_id", parsed.data.artworkId),
    ),
  )
  if (results.some((r) => r.error)) return { error: "No pudimos reordenar las imágenes." }

  revalidatePath(`/artista/obras/${parsed.data.artworkId}`)
  return { ok: true }
}

export async function deleteArtworkImage(input: { artworkId: string; imageId: string }): Promise<{ ok: true } | Failure> {
  const parsed = imageRefSchema.safeParse(input)
  if (!parsed.success) return { error: "Datos no válidos." }
  const ctx = await loadEditableArtwork(parsed.data.artworkId)
  if (!ctx) return { error: "Esta obra ya no se puede editar." }

  const { data: image } = await ctx.supabase
    .from("artwork_images")
    .select("storage_path, is_primary")
    .eq("id", parsed.data.imageId)
    .eq("artwork_id", parsed.data.artworkId)
    .maybeSingle()
  if (!image) return { error: "La imagen ya no existe." }

  const { error } = await ctx.supabase.from("artwork_images").delete().eq("id", parsed.data.imageId)
  if (error) return { error: "No pudimos eliminar la imagen." }
  await ctx.supabase.storage.from(BUCKET).remove([image.storage_path])

  // Never leave an artwork with images but no primary one.
  if (image.is_primary) {
    const { data: next } = await ctx.supabase
      .from("artwork_images")
      .select("id")
      .eq("artwork_id", parsed.data.artworkId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle()
    if (next) {
      await ctx.supabase.rpc("set_primary_artwork_image", { p_artwork_id: parsed.data.artworkId, p_image_id: next.id })
    }
  }

  revalidatePath(`/artista/obras/${parsed.data.artworkId}`)
  return { ok: true }
}
