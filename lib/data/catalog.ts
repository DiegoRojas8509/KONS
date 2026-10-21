import { signImagePaths } from "@/lib/data/storage"
import { createClient } from "@/lib/supabase/server"
import type { Enums } from "@/lib/supabase/database.types"
import type { CatalogFilters } from "@/lib/validations/catalog"

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

// Public read, no session needed. The `anon` role can only read approved works and a fixed set of columns
// (sale_price and review fields are not public), so never use select("*") here.
export async function listCatalog(filters: CatalogFilters = { palettes: [], spaces: [] }): Promise<CatalogItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from("artworks")
    .select(
      "id, title, technique, width_cm, height_cm, depth_cm, orientation, monthly_rent, dominant_palette, recommended_spaces, created_at, artists(display_name), artwork_images(storage_path, is_primary)",
    )
    .eq("status", "approved")
    .eq("artwork_images.is_primary", true)

  // Filters combine with AND; inside palette/space a work matches if it has ANY of the selected values.
  if (filters.orientation) query = query.eq("orientation", filters.orientation)
  if (filters.widthMin !== undefined) query = query.gte("width_cm", filters.widthMin)
  if (filters.widthMax !== undefined) query = query.lte("width_cm", filters.widthMax)
  if (filters.heightMin !== undefined) query = query.gte("height_cm", filters.heightMin)
  if (filters.heightMax !== undefined) query = query.lte("height_cm", filters.heightMax)
  if (filters.rentMin !== undefined) query = query.gte("monthly_rent", filters.rentMin)
  if (filters.rentMax !== undefined) query = query.lte("monthly_rent", filters.rentMax)
  if (filters.palettes.length > 0) query = query.overlaps("dominant_palette", filters.palettes)
  if (filters.spaces.length > 0) query = query.overlaps("recommended_spaces", filters.spaces)

  const { data } = await query.order("created_at", { ascending: false })
  const rows = data ?? []

  const urlByPath = await signImagePaths(
    supabase,
    rows.flatMap((r) => r.artwork_images.map((i) => i.storage_path)),
  )

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
