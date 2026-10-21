import { createClient } from "@/lib/supabase/server"
import type { Enums } from "@/lib/supabase/database.types"

export type CatalogItem = {
  id: string
  title: string
  technique: string | null
  width_cm: number
  height_cm: number
  depth_cm: number | null
  orientation: Enums<"artwork_orientation"> | null
  monthly_rent: number
  dominant_palette: string[]
  recommended_spaces: string[]
  artist_name: string
  imageUrl: string | null
}

const SIGNED_URL_SECONDS = 60 * 60

// Public read, no session needed. The `anon` role can only read approved works and a fixed set of columns
// (sale_price and review fields are not public), so never use select("*") here.
export async function listCatalog(): Promise<CatalogItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("artworks")
    .select(
      "id, title, technique, width_cm, height_cm, depth_cm, orientation, monthly_rent, dominant_palette, recommended_spaces, created_at, artists(display_name), artwork_images(storage_path, is_primary)",
    )
    .eq("status", "approved")
    .eq("artwork_images.is_primary", true)
    .order("created_at", { ascending: false })
  const rows = data ?? []

  const paths = rows.flatMap((r) => r.artwork_images.map((i) => i.storage_path))
  const urlByPath = new Map<string, string>()
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("artworks").createSignedUrls(paths, SIGNED_URL_SECONDS)
    for (const s of signed ?? []) if (s.signedUrl && s.path) urlByPath.set(s.path, s.signedUrl)
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    technique: r.technique,
    width_cm: r.width_cm,
    height_cm: r.height_cm,
    depth_cm: r.depth_cm,
    orientation: r.orientation,
    monthly_rent: r.monthly_rent,
    dominant_palette: r.dominant_palette,
    recommended_spaces: r.recommended_spaces,
    artist_name: r.artists?.display_name ?? "",
    imageUrl: r.artwork_images[0] ? (urlByPath.get(r.artwork_images[0].storage_path) ?? null) : null,
  }))
}
