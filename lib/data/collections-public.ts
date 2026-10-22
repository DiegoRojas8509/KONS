import { cache } from "react"

import { signImagePaths } from "@/lib/data/storage"
import { createClient } from "@/lib/supabase/server"
import type { Enums } from "@/lib/supabase/database.types"
import { EMPTY_FILTERS, type CatalogFilters } from "@/lib/validations/catalog"

// Public reads (no session needed). `anon` only sees published collections and, for the ones set to "open", their works.
// The works of a "mystery" collection are not readable on purpose: only its cover and attributes are public.

export type CatalogCollection = {
  id: string
  title: string
  slug: string
  kind: Enums<"collection_kind">
  reveal: Enums<"collection_reveal">
  monthly_price: number
  space_types: string[]
  palette: string[]
  itemCount: number
  busyNow: boolean
  coverUrl: string | null
}

const PUBLIC_COLUMNS = "id, title, slug, description, kind, reveal, monthly_price, space_types, palette, cover_artwork_id, created_at"

async function coverUrls(supabase: Awaited<ReturnType<typeof createClient>>, coverIds: string[]) {
  const byArtwork = new Map<string, string>()
  if (coverIds.length === 0) return byArtwork
  const { data: images } = await supabase.from("artwork_images").select("artwork_id, storage_path").in("artwork_id", coverIds).eq("is_primary", true)
  const urls = await signImagePaths(
    supabase,
    (images ?? []).map((i) => i.storage_path),
  )
  for (const i of images ?? []) {
    const url = urls.get(i.storage_path)
    if (url) byArtwork.set(i.artwork_id, url)
  }
  return byArtwork
}

export async function listPublicCollections(filters: CatalogFilters = EMPTY_FILTERS): Promise<CatalogCollection[]> {
  const supabase = await createClient()
  let query = supabase.from("collections").select(PUBLIC_COLUMNS).eq("status", "published")
  if (filters.spaces.length > 0) query = query.overlaps("space_types", filters.spaces)
  if (filters.palettes.length > 0) query = query.overlaps("palette", filters.palettes)
  if (filters.priceMin !== undefined) query = query.gte("monthly_price", filters.priceMin)
  if (filters.priceMax !== undefined) query = query.lte("monthly_price", filters.priceMax)
  const { data } = await query.order("created_at", { ascending: false })
  const rows = data ?? []

  const [covers, busy, counts] = await Promise.all([
    coverUrls(
      supabase,
      rows.flatMap((r) => r.cover_artwork_id ?? []),
    ),
    supabase.rpc("collections_busy_now"),
    Promise.all(rows.map((r) => supabase.rpc("collection_item_count", { p_collection_id: r.id }))),
  ])
  const busyIds = new Set(busy.data ?? [])

  return rows.map((r, i) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    kind: r.kind,
    reveal: r.reveal,
    monthly_price: r.monthly_price,
    space_types: r.space_types,
    palette: r.palette,
    itemCount: counts[i].data ?? 0,
    busyNow: busyIds.has(r.id),
    coverUrl: r.cover_artwork_id ? (covers.get(r.cover_artwork_id) ?? null) : null,
  }))
}

export type CollectionWork = {
  id: string
  title: string
  technique: string | null
  width_cm: number
  height_cm: number
  orientation: Enums<"artwork_orientation"> | null
  monthly_rent: number
  artist_name: string
  imageUrl: string | null
}

export type PublicCollection = Omit<CatalogCollection, "busyNow"> & {
  description: string | null
  works: CollectionWork[]
  availability: { start_date: string; end_date: string; status: Enums<"rental_status"> }[]
}

export const getPublicCollection = cache(async (slug: string): Promise<PublicCollection | null> => {
  const supabase = await createClient()
  const { data: c } = await supabase.from("collections").select(PUBLIC_COLUMNS).eq("slug", slug).eq("status", "published").maybeSingle()
  if (!c) return null

  const [covers, count, availability, items] = await Promise.all([
    coverUrls(supabase, c.cover_artwork_id ? [c.cover_artwork_id] : []),
    supabase.rpc("collection_item_count", { p_collection_id: c.id }),
    supabase.rpc("collection_availability", { p_collection_id: c.id }),
    c.reveal === "open"
      ? supabase
          .from("collection_items")
          .select(
            "position, artworks(id, title, technique, width_cm, height_cm, orientation, monthly_rent, artists(display_name), artwork_images(storage_path, is_primary))",
          )
          .eq("collection_id", c.id)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  const workRows = (items.data ?? []).flatMap((r) => (r.artworks ? [r.artworks] : []))
  const primary = (imgs: { storage_path: string; is_primary: boolean }[]) => (imgs.find((i) => i.is_primary) ?? imgs[0])?.storage_path
  const urls = await signImagePaths(
    supabase,
    workRows.flatMap((w) => primary(w.artwork_images) ?? []),
  )

  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    kind: c.kind,
    reveal: c.reveal,
    monthly_price: c.monthly_price,
    space_types: c.space_types,
    palette: c.palette,
    description: c.description,
    itemCount: count.data ?? 0,
    coverUrl: c.cover_artwork_id ? (covers.get(c.cover_artwork_id) ?? null) : null,
    availability: availability.data ?? [],
    works: workRows.map((w) => ({
      id: w.id,
      title: w.title,
      technique: w.technique,
      width_cm: w.width_cm,
      height_cm: w.height_cm,
      orientation: w.orientation,
      monthly_rent: w.monthly_rent,
      artist_name: w.artists?.display_name ?? "",
      imageUrl: urls.get(primary(w.artwork_images) ?? "") ?? null,
    })),
  }
})
