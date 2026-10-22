"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { ActionResult } from "@/lib/actions/artist"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validations/artwork"
import { collectionSchema, collectionStatusSchema, toCollectionRow, type CollectionInput } from "@/lib/validations/collection"
import { slugify } from "@/lib/validations/gallery"

// RLS only lets the operator write collections and items; these actions also report a friendly error otherwise.
const UNIQUE_VIOLATION = "23505"

async function currentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

async function insertCollection(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  row: {
    title: string
    description: string | null
    reveal: "mystery" | "open"
    space_types: string[]
    palette: string[]
    monthly_price: number
    kind?: "curated" | "artist"
    source_gallery_id?: string
  },
) {
  const base = slugify(row.title)
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase.from("collections").insert({ ...row, slug, created_by: userId }).select("id").single()
    if (!error && data) return { id: data.id }
    if (error?.code !== UNIQUE_VIOLATION) return { error: "No pudimos crear la colección." }
  }
  return { error: "No pudimos generar una dirección única. Cambia el nombre e inténtalo de nuevo." }
}

export async function createCollection(input: CollectionInput): Promise<ActionResult> {
  const parsed = collectionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  const { supabase, userId } = await currentUserId()
  if (!userId) return { error: "Tu sesión expiró." }

  const result = await insertCollection(supabase, userId, { ...toCollectionRow(parsed.data), kind: "curated" })
  if ("error" in result) return { error: result.error ?? "No pudimos crear la colección." }
  revalidatePath("/operador/colecciones")
  redirect(`/operador/colecciones/${result.id}`)
}

export async function updateCollection(id: string, input: CollectionInput): Promise<ActionResult> {
  const parsed = collectionSchema.safeParse(input)
  if (!isUuid(id) || !parsed.success) return { error: parsed.success ? "Colección no válida." : (parsed.error.issues[0]?.message ?? "Datos inválidos.") }
  const supabase = await createClient()
  const { data, error } = await supabase.from("collections").update(toCollectionRow(parsed.data)).eq("id", id).select("id")
  if (error || !data?.length) return { error: "No pudimos guardar los cambios." }
  revalidatePath("/operador/colecciones", "layout")
  revalidatePath("/catalogo", "layout")
  return { message: "Colección guardada." }
}

export async function setCollectionStatus(id: string, status: string): Promise<ActionResult> {
  const parsedStatus = collectionStatusSchema.safeParse(status)
  if (!isUuid(id) || !parsedStatus.success) return { error: "Datos no válidos." }
  const supabase = await createClient()

  if (parsedStatus.data === "published") {
    const { data: c } = await supabase.from("collections").select("cover_artwork_id").eq("id", id).maybeSingle()
    const { count } = await supabase.from("collection_items").select("artwork_id", { count: "exact", head: true }).eq("collection_id", id)
    if (!count) return { error: "Agrega al menos una obra antes de publicar." }
    if (!c?.cover_artwork_id) return { error: "Elige la obra que será la portada antes de publicar." }
  }
  const { data, error } = await supabase.from("collections").update({ status: parsedStatus.data }).eq("id", id).select("id")
  if (error || !data?.length) return { error: "No pudimos cambiar el estado." }
  revalidatePath("/operador/colecciones", "layout")
  revalidatePath("/catalogo", "layout")
  revalidatePath("/")
  return { message: "Estado actualizado." }
}

export async function addCollectionItems(collectionId: string, artworkIds: string[]): Promise<ActionResult> {
  if (!isUuid(collectionId) || artworkIds.length === 0 || !artworkIds.every(isUuid)) return { error: "Datos no válidos." }
  const supabase = await createClient()
  const { data: last } = await supabase
    .from("collection_items")
    .select("position")
    .eq("collection_id", collectionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()
  const start = (last?.position ?? -1) + 1
  const { error } = await supabase
    .from("collection_items")
    .insert(artworkIds.map((artwork_id, i) => ({ collection_id: collectionId, artwork_id, position: start + i })))
  if (error) {
    return { error: error.code === UNIQUE_VIOLATION ? "Alguna obra ya pertenece a otra colección." : "No pudimos agregar las obras." }
  }

  // The first work becomes the cover when the collection has none.
  const { data: c } = await supabase.from("collections").select("cover_artwork_id").eq("id", collectionId).maybeSingle()
  if (c && !c.cover_artwork_id) await supabase.from("collections").update({ cover_artwork_id: artworkIds[0] }).eq("id", collectionId)
  revalidatePath(`/operador/colecciones/${collectionId}`)
  return { message: "Obras agregadas." }
}

export async function removeCollectionItem(collectionId: string, artworkId: string): Promise<ActionResult> {
  if (!isUuid(collectionId) || !isUuid(artworkId)) return { error: "Datos no válidos." }
  const supabase = await createClient()
  const { error } = await supabase.from("collection_items").delete().eq("collection_id", collectionId).eq("artwork_id", artworkId)
  if (error) return { error: "No pudimos quitar la obra." }
  const { data: c } = await supabase.from("collections").select("cover_artwork_id").eq("id", collectionId).maybeSingle()
  if (c?.cover_artwork_id === artworkId) await supabase.from("collections").update({ cover_artwork_id: null }).eq("id", collectionId)
  revalidatePath(`/operador/colecciones/${collectionId}`)
  return { message: "Obra quitada." }
}

export async function setCollectionCover(collectionId: string, artworkId: string): Promise<ActionResult> {
  if (!isUuid(collectionId) || !isUuid(artworkId)) return { error: "Datos no válidos." }
  const supabase = await createClient()
  const { data: item } = await supabase
    .from("collection_items")
    .select("artwork_id")
    .eq("collection_id", collectionId)
    .eq("artwork_id", artworkId)
    .maybeSingle()
  if (!item) return { error: "La portada debe ser una obra de la colección." }
  const { error } = await supabase.from("collections").update({ cover_artwork_id: artworkId }).eq("id", collectionId)
  if (error) return { error: "No pudimos cambiar la portada." }
  revalidatePath(`/operador/colecciones/${collectionId}`)
  return { message: "Portada actualizada." }
}

// Turns an artist's gallery into an open collection (draft): its free approved works, priced at the sum of their rents.
export async function publishArtistGallery(galleryId: string): Promise<ActionResult> {
  if (!isUuid(galleryId)) return { error: "Galería no válida." }
  const { supabase, userId } = await currentUserId()
  if (!userId) return { error: "Tu sesión expiró." }

  const { data: gallery } = await supabase
    .from("galleries")
    .select("id, title, description, artists(display_name), artworks(id, status, monthly_rent, dominant_palette, recommended_spaces, created_at, collection_items(collection_id))")
    .eq("id", galleryId)
    .maybeSingle()
  if (!gallery) return { error: "No encontramos la galería." }
  const free = gallery.artworks.filter((w) => w.status === "approved" && !w.collection_items)
  if (free.length === 0) return { error: "La galería no tiene obras aprobadas disponibles." }

  const price = Math.max(50, Math.round(free.reduce((sum, w) => sum + w.monthly_rent, 0) / 50) * 50)
  const top = (lists: string[][]) => {
    const counts = new Map<string, number>()
    for (const v of lists.flat()) counts.set(v, (counts.get(v) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k)
  }
  const result = await insertCollection(supabase, userId, {
    title: gallery.artists?.display_name ? `${gallery.title} · ${gallery.artists.display_name}`.slice(0, 80) : gallery.title,
    description: gallery.description,
    reveal: "open",
    space_types: top(free.map((w) => w.recommended_spaces)),
    palette: top(free.map((w) => w.dominant_palette)),
    monthly_price: price,
    kind: "artist",
    source_gallery_id: gallery.id,
  })
  if ("error" in result) return { error: result.error ?? "No pudimos crear la colección." }

  const ordered = [...free].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const { error } = await supabase
    .from("collection_items")
    .insert(ordered.map((w, i) => ({ collection_id: result.id, artwork_id: w.id, position: i })))
  if (error) return { error: "Creamos la colección pero no pudimos agregar sus obras." }
  await supabase.from("collections").update({ cover_artwork_id: ordered[0].id }).eq("id", result.id)

  revalidatePath("/operador/colecciones")
  redirect(`/operador/colecciones/${result.id}`)
}
