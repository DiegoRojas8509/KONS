import { getCurrentArtist } from "@/lib/data/artist"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type ArtworkListItem = Pick<
  Tables<"artworks">,
  "id" | "title" | "status" | "width_cm" | "height_cm" | "monthly_rent" | "orientation" | "created_at"
>

export type MyArtwork = Omit<Tables<"artworks">, "reviewed_at" | "reviewed_by"> & { rejectionNote: string | null }

// Artists can also read other artists' approved works (public catalog), so every query is pinned to the caller's artist id.
export async function listMyArtworks(): Promise<ArtworkListItem[]> {
  const artist = await getCurrentArtist()
  if (!artist) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select("id, title, status, width_cm, height_cm, monthly_rent, orientation, created_at")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false })
  return data ?? []
}

export type ArtworkImageView = { id: string; url: string; isPrimary: boolean }

const SIGNED_URL_SECONDS = 60 * 60

// Images are served from a private bucket through short-lived signed URLs.
export async function getArtworkImages(artworkId: string): Promise<ArtworkImageView[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("artwork_images")
    .select("id, storage_path, is_primary")
    .eq("artwork_id", artworkId)
    .order("position", { ascending: true })
  if (!rows?.length) return []

  const { data: signed } = await supabase.storage
    .from("artworks")
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      SIGNED_URL_SECONDS,
    )
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))

  return rows.flatMap((r) => {
    const url = urlByPath.get(r.storage_path)
    return url ? [{ id: r.id, url, isPrimary: r.is_primary }] : []
  })
}

export async function getMyArtwork(id: string): Promise<MyArtwork | null> {
  const artist = await getCurrentArtist()
  if (!artist) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(
      "id, artist_id, gallery_id, title, technique, year, width_cm, height_cm, depth_cm, orientation, dominant_palette, recommended_spaces, monthly_rent, sale_price, status, created_at",
    )
    .eq("id", id)
    .eq("artist_id", artist.id)
    .maybeSingle()
  if (!data) return null

  // While the work is being fixed (draft) or after a rejection, keep showing why it was rejected.
  let rejectionNote: string | null = null
  if (data.status === "draft" || data.status === "rejected") {
    const { data: log } = await supabase
      .from("review_logs")
      .select("notes")
      .eq("entity_type", "artwork")
      .eq("entity_id", id)
      .eq("decision", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    rejectionNote = log?.notes ?? null
  }
  return { ...data, rejectionNote }
}
