import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

// Everything here relies on the operator-wide SELECT policies; non-operators simply get empty results.

export type InboxOptions = { q?: string; order: "asc" | "desc" }

export type PendingArtist = {
  id: string
  display_name: string
  city: string | null
  created_at: string
  email: string | null
}

export type PendingArtwork = {
  id: string
  title: string
  width_cm: number
  height_cm: number
  monthly_rent: number
  created_at: string
  artist_name: string
}

// Keeps user text from acting as ilike wildcards.
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

export async function listPendingArtists({ q, order }: InboxOptions): Promise<PendingArtist[]> {
  const supabase = await createClient()
  let query = supabase
    .from("artists")
    .select("id, display_name, city, created_at, profiles!artists_profile_id_fkey(email)")
    .eq("status", "pending")
  if (q) query = query.ilike("display_name", likePattern(q))
  const { data } = await query.order("created_at", { ascending: order === "asc" })
  return (data ?? []).map((a) => ({
    id: a.id,
    display_name: a.display_name,
    city: a.city,
    created_at: a.created_at,
    email: a.profiles?.email ?? null,
  }))
}

export async function listPendingArtworks({ q, order }: InboxOptions): Promise<PendingArtwork[]> {
  const supabase = await createClient()
  let query = supabase
    .from("artworks")
    .select("id, title, width_cm, height_cm, monthly_rent, created_at, artists(display_name)")
    .eq("status", "pending_review")
  if (q) query = query.ilike("title", likePattern(q))
  const { data } = await query.order("created_at", { ascending: order === "asc" })
  return (data ?? []).map((w) => ({
    id: w.id,
    title: w.title,
    width_cm: w.width_cm,
    height_cm: w.height_cm,
    monthly_rent: w.monthly_rent,
    created_at: w.created_at,
    artist_name: w.artists?.display_name ?? "—",
  }))
}

export async function countPending(): Promise<{ artists: number; artworks: number }> {
  const supabase = await createClient()
  const [artists, artworks] = await Promise.all([
    supabase.from("artists").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("artworks").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
  ])
  return { artists: artists.count ?? 0, artworks: artworks.count ?? 0 }
}

export type ReviewLog = Pick<Tables<"review_logs">, "id" | "decision" | "notes" | "created_at">

export async function listReviewLogs(entityType: "artist" | "artwork", entityId: string): Promise<ReviewLog[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("review_logs")
    .select("id, decision, notes, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
  return data ?? []
}
