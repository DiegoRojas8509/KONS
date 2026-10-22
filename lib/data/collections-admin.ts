import { signImagePaths } from "@/lib/data/storage"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

// Operator-side reads (RLS lets the operator see every collection, draft or not).

export type AdminCollection = Pick<
  Tables<"collections">,
  "id" | "title" | "slug" | "kind" | "reveal" | "status" | "monthly_price" | "created_at"
> & { itemCount: number }

export async function listCollectionsAdmin(): Promise<AdminCollection[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("collections")
    .select("id, title, slug, kind, reveal, status, monthly_price, created_at, collection_items(count)")
    .order("created_at", { ascending: false })
  return (data ?? []).map(({ collection_items, ...c }) => ({ ...c, itemCount: collection_items[0]?.count ?? 0 }))
}

export type WorkThumb = {
  id: string
  title: string
  artist: string
  width_cm: number
  height_cm: number
  monthly_rent: number
  imageUrl: string | null
}

type ImageRow = { storage_path: string; is_primary: boolean }
const primaryPath = (images: ImageRow[]) => (images.find((i) => i.is_primary) ?? images[0])?.storage_path

export type CollectionDetail = Tables<"collections"> & { items: (WorkThumb & { position: number })[] }

export async function getCollectionAdmin(id: string): Promise<CollectionDetail | null> {
  const supabase = await createClient()
  const { data: collection } = await supabase.from("collections").select("*").eq("id", id).maybeSingle()
  if (!collection) return null

  const { data: rows } = await supabase
    .from("collection_items")
    .select(
      "position, artworks(id, title, width_cm, height_cm, monthly_rent, artists(display_name), artwork_images(storage_path, is_primary))",
    )
    .eq("collection_id", id)
    .order("position", { ascending: true })

  const items = (rows ?? []).flatMap((r) => (r.artworks ? [{ position: r.position, w: r.artworks }] : []))
  const urls = await signImagePaths(
    supabase,
    items.flatMap(({ w }) => primaryPath(w.artwork_images) ?? []),
  )
  return {
    ...collection,
    items: items.map(({ position, w }) => ({
      position,
      id: w.id,
      title: w.title,
      artist: w.artists?.display_name ?? "",
      width_cm: w.width_cm,
      height_cm: w.height_cm,
      monthly_rent: w.monthly_rent,
      imageUrl: urls.get(primaryPath(w.artwork_images) ?? "") ?? null,
    })),
  }
}

// Approved works that do not belong to any collection yet.
export async function listFreeArtworks(): Promise<WorkThumb[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(
      "id, title, width_cm, height_cm, monthly_rent, artists(display_name), artwork_images(storage_path, is_primary), collection_items(collection_id)",
    )
    .eq("status", "approved")
    .order("title", { ascending: true })
  const free = (data ?? []).filter((w) => !w.collection_items)
  const urls = await signImagePaths(
    supabase,
    free.flatMap((w) => primaryPath(w.artwork_images) ?? []),
  )
  return free.map((w) => ({
    id: w.id,
    title: w.title,
    artist: w.artists?.display_name ?? "",
    width_cm: w.width_cm,
    height_cm: w.height_cm,
    monthly_rent: w.monthly_rent,
    imageUrl: urls.get(primaryPath(w.artwork_images) ?? "") ?? null,
  }))
}

export type PublishableGallery = { id: string; title: string; artist: string; freeCount: number }

// Artist galleries that still have approved works outside any collection and were not turned into a collection yet.
export async function listPublishableGalleries(): Promise<PublishableGallery[]> {
  const supabase = await createClient()
  const [{ data: galleries }, { data: used }] = await Promise.all([
    supabase
      .from("galleries")
      .select("id, title, artists(display_name), artworks(id, status, collection_items(collection_id))")
      .order("created_at", { ascending: false }),
    supabase.from("collections").select("source_gallery_id").not("source_gallery_id", "is", null),
  ])
  const taken = new Set((used ?? []).map((c) => c.source_gallery_id))
  return (galleries ?? [])
    .filter((g) => !taken.has(g.id))
    .map((g) => ({
      id: g.id,
      title: g.title,
      artist: g.artists?.display_name ?? "",
      freeCount: g.artworks.filter((w) => w.status === "approved" && !w.collection_items).length,
    }))
    .filter((g) => g.freeCount > 0)
}
