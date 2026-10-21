"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { reviewSchema, type ReviewInput } from "@/lib/validations/review"

// Approve or reject an artist/artwork. The review_entity RPC re-checks that the caller is an operator,
// that a rejection has a note, and writes the status change + review_logs row in one transaction.
export async function reviewEntity(input: ReviewInput): Promise<{ error: string }> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("review_entity", {
    p_entity_type: parsed.data.entityType,
    p_entity_id: parsed.data.entityId,
    p_decision: parsed.data.decision,
    p_notes: parsed.data.notes || undefined,
  })

  if (error) {
    if (error.code === "42501") return { error: "No tienes permiso para revisar." }
    if (error.code === "P0002") return { error: "Esta solicitud ya fue resuelta o no existe." }
    return { error: "No pudimos guardar la decisión. Inténtalo de nuevo." }
  }

  revalidatePath("/operador")
  redirect(`/operador?tab=${parsed.data.entityType === "artist" ? "artistas" : "obras"}`)
}
