import { cache } from "react"

import { signImagePaths } from "@/lib/data/storage"
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

  const urlByPath = await signImagePaths(
    supabase,
    (rows ?? []).map((r) => r.storage_path),
  )

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
