import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Enums } from "@/lib/supabase/database.types"

export type PublicArtwork = {
  id: string
  title: string
  technique: string | null
  year: number | null
  width_cm: number
  height_cm: number
  depth_cm: number | null
  orientation: Enums<"artwork_orientation"> | null
  dominant_palette: string[]
  recommended_spaces: string[]
  monthly_rent: number
  artist: { display_name: string; bio: string | null; statement: string | null; city: string | null; instagram: string | null }
  images: { id: string; url: string }[]
}

const SIGNED_URL_SECONDS = 60 * 60

// Public read: anon only sees approved works, a fixed column set (no sale_price) and approved artists' public fields.
export const getPublicArtwork = cache(async (id: string): Promise<PublicArtwork | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(
      "id, title, technique, year, width_cm, height_cm, depth_cm, orientation, dominant_palette, recommended_spaces, monthly_rent, artists(display_name, bio, statement, city, instagram)",
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle()
  if (!data || !data.artists) return null

  const { data: rows } = await supabase
    .from("artwork_images")
    .select("id, storage_path, is_primary, position")
    .eq("artwork_id", id)
    .order("is_primary", { ascending: false })
    .order("position", { ascending: true })

  const paths = (rows ?? []).map((r) => r.storage_path)
  const urlByPath = new Map<string, string>()
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("artworks").createSignedUrls(paths, SIGNED_URL_SECONDS)
    for (const s of signed ?? []) if (s.signedUrl && s.path) urlByPath.set(s.path, s.signedUrl)
  }

  const { artists, ...artwork } = data
  return {
    ...artwork,
    artist: artists,
    images: (rows ?? []).flatMap((r) => {
      const url = urlByPath.get(r.storage_path)
      return url ? [{ id: r.id, url }] : []
    }),
  }
})
