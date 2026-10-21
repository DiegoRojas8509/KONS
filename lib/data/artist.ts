import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export type CurrentArtist = Pick<
  Tables<"artists">,
  "id" | "display_name" | "bio" | "statement" | "city" | "instagram" | "status"
> & { rejectionNote: string | null }

// The signed-in user's artist record (RLS only lets them read their own) plus the latest rejection reason, if any.
export const getCurrentArtist = cache(async (): Promise<CurrentArtist | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: artist } = await supabase
    .from("artists")
    .select("id, display_name, bio, statement, city, instagram, status")
    .eq("profile_id", user.id)
    .maybeSingle()
  if (!artist) return null

  let rejectionNote: string | null = null
  if (artist.status === "rejected") {
    const { data: log } = await supabase
      .from("review_logs")
      .select("notes")
      .eq("entity_type", "artist")
      .eq("entity_id", artist.id)
      .eq("decision", "rejected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    rejectionNote = log?.notes ?? null
  }

  return { ...artist, rejectionNote }
})
