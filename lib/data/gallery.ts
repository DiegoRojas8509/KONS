import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type GalleryRow = Pick<Tables<"galleries">, "id" | "title" | "description" | "slug" | "created_at">

const COLUMNS = "id, title, description, slug, created_at"

// RLS limits both queries to the signed-in artist's own galleries.
export async function listGalleries(): Promise<GalleryRow[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("galleries").select(COLUMNS).order("created_at", { ascending: false })
  return data ?? []
}

export async function getGallery(id: string): Promise<GalleryRow | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("galleries").select(COLUMNS).eq("id", id).maybeSingle()
  return data
}
