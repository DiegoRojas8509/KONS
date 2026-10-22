"use server"

import { createClient } from "@/lib/supabase/server"
import { TERMS_VERSION } from "@/lib/constants/terms"
import { rentalRequestSchema, type RentalRequestInput } from "@/lib/validations/rental"

export type RequestRentalResult = { error: string } | { folio: string }

// Public: a visitor asks to rent a collection. The request holds the dates as "en revisión" until the operator resolves it.
export async function requestRental(input: RentalRequestInput): Promise<RequestRentalResult> {
  const parsed = rentalRequestSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  // Honeypot filled: pretend it worked, store nothing.
  if (parsed.data.website) return { folio: "R-00000000" }

  const supabase = await createClient()
  const d = parsed.data
  const { data, error } = await supabase.rpc("request_rental", {
    p_collection_id: d.collectionId,
    p_plan: d.plan,
    p_frequency: d.frequency,
    p_start: d.startDate,
    p_client_name: d.clientName,
    p_email: d.email,
    p_company: d.company || undefined,
    p_phone: d.phone || undefined,
    p_space_type: d.spaceType || undefined,
    p_city: d.city || undefined,
    p_message: d.message || undefined,
    p_terms_version: TERMS_VERSION,
    p_accepted: d.acceptedTerms,
  })

  if (error) {
    switch (error.code) {
      case "23P01":
        return { error: "Esas fechas ya están apartadas. Elige otra fecha de inicio." }
      case "53400":
        return { error: "Ya enviaste varias solicitudes hoy. Escríbenos y te atendemos." }
      case "22008":
        return { error: "La fecha de inicio debe ser de hoy en adelante y dentro de los próximos 18 meses." }
      case "P0002":
        return { error: "Esta colección ya no está disponible." }
      default:
        return { error: "No pudimos enviar la solicitud. Inténtalo de nuevo." }
    }
  }
  return { folio: data }
}
