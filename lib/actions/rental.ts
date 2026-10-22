"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { rentalReviewSchema, type RentalReviewInput } from "@/lib/validations/collection"

// Confirm or release a pending rental request. The RPC re-checks that the caller is an operator.
export async function reviewRental(input: RentalReviewInput): Promise<{ error: string }> {
  const parsed = rentalReviewSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  const supabase = await createClient()
  const { error } = await supabase.rpc("review_rental_request", {
    p_id: parsed.data.requestId,
    p_decision: parsed.data.decision,
    p_notes: parsed.data.notes || undefined,
  })
  if (error) {
    if (error.code === "42501") return { error: "No tienes permiso para revisar." }
    if (error.code === "P0002") return { error: "Esta solicitud ya fue resuelta o no existe." }
    return { error: "No pudimos guardar la decisión. Inténtalo de nuevo." }
  }

  revalidatePath("/operador")
  revalidatePath("/catalogo", "layout")
  redirect("/operador?tab=rentas")
}
