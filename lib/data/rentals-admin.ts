import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

// Operator-side reads of rental requests (only the operator can read the table).

export type RentalRow = Pick<
  Tables<"rental_requests">,
  | "id"
  | "folio"
  | "plan"
  | "payment_frequency"
  | "start_date"
  | "end_date"
  | "client_name"
  | "company"
  | "email"
  | "phone"
  | "space_type"
  | "city"
  | "message"
  | "status"
  | "terms_version"
  | "accepted_terms_at"
  | "review_notes"
  | "reviewed_at"
  | "created_at"
> & { collection: { id: string; title: string; slug: string } | null }

const COLUMNS =
  "id, folio, plan, payment_frequency, start_date, end_date, client_name, company, email, phone, space_type, city, message, status, terms_version, accepted_terms_at, review_notes, reviewed_at, created_at, collections(id, title, slug)"

function toRow({ collections, ...r }: Omit<RentalRow, "collection"> & { collections: RentalRow["collection"] }): RentalRow {
  return { ...r, collection: collections }
}

function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

export async function listPendingRentals({ q, order }: { q?: string; order: "asc" | "desc" }): Promise<RentalRow[]> {
  const supabase = await createClient()
  let query = supabase.from("rental_requests").select(COLUMNS).eq("status", "pending")
  if (q) query = query.ilike("client_name", likePattern(q))
  const { data } = await query.order("created_at", { ascending: order === "asc" })
  return (data ?? []).map(toRow)
}

export async function getRental(id: string): Promise<RentalRow | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("rental_requests").select(COLUMNS).eq("id", id).maybeSingle()
  return data ? toRow(data) : null
}

export async function countPendingRentals(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase.from("rental_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
  return count ?? 0
}
